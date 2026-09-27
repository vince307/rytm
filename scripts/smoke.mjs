// Smoke test: proves the built app, the Vercel adapter and the Supabase auth flow still work together,
// including the account contract (password change, self-service deletion) which also cleans up the smoke user,
// the import write path (POST /api/imports: saved, overlap, invalid payload, anonymous) and the import delete
// path (POST /api/imports/delete: not-found, own delete, patterns dropping the import, re-import accepted).
// Zero dependencies on purpose. Run against a live server: BASE_URL=http://localhost:4321 node scripts/smoke.mjs

const BASE_URL = process.env.BASE_URL ?? "http://localhost:4321";
const email = `smoke-${Date.now()}@example.com`;
const password = "Smoke-Test-Passw0rd!";
const password2 = "Smoke-Test-Passw0rd-2!";
// Seeded by supabase/seed.sql on every `supabase start` / `db reset` (local and CI).
const seeded = { email: "test@rytm.local", password: "Rytm-Test-Passw0rd!" };
// Small synthetic import (2 debits) for the POST /api/imports steps; the smoke user is deleted later, which
// cascades the import away.
const importPayload = JSON.stringify({
  accountNumber: "11111100000000000000000099",
  accountName: "Konto smoke",
  periodStart: "2026-05-01",
  periodEnd: "2026-05-31",
  transactions: [
    {
      occurredOn: "2026-05-04",
      amountMinor: 1299,
      bankTxId: "000000000000000001",
      counterparty: "Sklep smoke",
      title: "Zakup",
      details: "",
    },
    {
      occurredOn: "2026-05-20",
      amountMinor: 4550,
      bankTxId: "000000000000000002",
      counterparty: "Kawiarnia smoke",
      title: "Płatność kartą",
      details: "",
    },
  ],
});
let importResultPath = "/imports/result";
const jar = new Map();

function cookieHeader() {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

function storeCookies(response) {
  for (const raw of response.headers.getSetCookie()) {
    const [pair, ...attrs] = raw.split(";");
    const [name, ...rest] = pair.split("=");
    const expired = attrs.some((a) => /max-age=0/i.test(a.trim()));
    if (expired) jar.delete(name.trim());
    else jar.set(name.trim(), rest.join("="));
  }
}

async function request(path, { method = "GET", form } = {}) {
  const response = await fetch(BASE_URL + path, {
    method,
    redirect: "manual",
    headers: {
      Cookie: cookieHeader(),
      Origin: BASE_URL,
      ...(form ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    body: form ? new URLSearchParams(form).toString() : undefined,
  });
  storeCookies(response);
  const body = response.status === 200 ? await response.text() : "";
  return { status: response.status, location: response.headers.get("location") ?? "", body };
}

const steps = [
  ["landing renders", () => request("/"), { status: 200, contains: "Zobacz swój rytm" }],
  ["login renders", () => request("/login"), { status: 200, contains: "Zaloguj się" }],
  ["login offers password reset", () => request("/login"), { status: 200, contains: "Nie pamiętam hasła" }],
  [
    "login shows e-mail confirmed state",
    () => request("/login?confirmed=1"),
    { status: 200, contains: "E-mail potwierdzony" },
  ],
  ["confirm-email renders", () => request("/confirm-email"), { status: 200, contains: "Link jest w drodze." }],
  ["callback without code goes to login", () => request("/auth/callback"), { status: 302, location: "/login" }],
  [
    "callback with a bad code still says confirmed",
    () => request("/auth/callback?code=bogus&next=/home"),
    { status: 302, location: "/login?confirmed=1" },
  ],
  [
    "callback with a bad recovery code expires the reset",
    () => request("/auth/callback?code=bogus&next=/reset/new"),
    { status: 302, location: "/reset/new?state=expired" },
  ],
  [
    "reset/new without a session is expired",
    () => request("/reset/new"),
    { status: 200, contains: "Ten link już wygasł." },
  ],
  ["home redirects anonymous user", () => request("/home"), { status: 302, location: "/login" }],
  ["settings redirects anonymous user", () => request("/settings"), { status: 302, location: "/login" }],
  [
    "signup creates account",
    () => request("/api/auth/signup", { method: "POST", form: { email, password } }),
    { status: 302, location: "/confirm-email" },
  ],
  [
    "signin rejects wrong password",
    () => request("/api/auth/signin", { method: "POST", form: { email, password: "wrong" } }),
    { status: 302, location: "/login?error=1" },
  ],
  [
    "signin accepts correct password",
    () => request("/api/auth/signin", { method: "POST", form: { email, password } }),
    { status: 302, location: "/home" },
  ],
  [
    "home renders empty state for signed-in user",
    () => request("/home"),
    { status: 200, contains: "Nie masz jeszcze żadnego importu." },
  ],
  ["settings renders account e-mail", () => request("/settings"), { status: 200, contains: email }],
  [
    "import is saved and shows its result",
    async () => {
      const response = await request("/api/imports", { method: "POST", form: { payload: importPayload } });
      importResultPath = response.location;
      return response;
    },
    { status: 302, location: "/imports/result?id=" },
  ],
  [
    "import result renders the debit count",
    () => request(importResultPath),
    { status: 200, contains: "Dodaliśmy 2 obciążenia." },
  ],
  ["patterns lists imported merchants", () => request("/patterns"), { status: 200, contains: "Kawiarnia smoke" }],
  // The rendered badge text node — a bare "stały" would also match the island's serialized copy props.
  ["patterns proposes a type", () => request("/patterns"), { status: 200, contains: ">stały<" }],
  [
    "import of an overlapping range is rejected",
    () => request("/api/imports", { method: "POST", form: { payload: importPayload } }),
    { status: 302, location: "/imports/new?error=overlap&from=" },
  ],
  [
    "import with an invalid payload is rejected",
    () => request("/api/imports", { method: "POST", form: { payload: "not-json" } }),
    { status: 302, location: "/imports/new?error=invalid" },
  ],
  [
    "import delete of an unknown id is not found",
    () =>
      request("/api/imports/delete", {
        method: "POST",
        form: { id: "00000000-0000-4000-8000-000000000000" },
      }),
    { status: 302, location: "/imports?error=missing" },
  ],
  [
    "import delete of a malformed id is not found",
    () => request("/api/imports/delete", { method: "POST", form: { id: "not-a-uuid" } }),
    { status: 302, location: "/imports?error=missing" },
  ],
  [
    "imports shows the not-found line",
    () => request("/imports?error=missing"),
    { status: 200, contains: "Nie znaleziono tego importu" },
  ],
  [
    "import is deleted",
    () =>
      request("/api/imports/delete", {
        method: "POST",
        form: { id: new URLSearchParams(importResultPath.split("?")[1]).get("id") },
      }),
    { status: 302, location: "/imports?deleted=1" },
  ],
  [
    "imports shows the deletion above the empty list",
    () => request("/imports?deleted=1"),
    { status: 200, contains: "Import usunięty." },
  ],
  [
    "imports is empty after the last delete",
    () => request("/imports"),
    { status: 200, contains: "Nie masz jeszcze żadnego importu.", notContains: "Konto smoke" },
  ],
  [
    "imports shows the not-found line above the empty list",
    () => request("/imports?error=missing"),
    { status: 200, contains: "Nie znaleziono tego importu" },
  ],
  [
    "patterns drop the deleted import",
    () => request("/patterns"),
    { status: 200, contains: "Wzorce pojawią się po pierwszym imporcie.", notContains: "Kawiarnia smoke" },
  ],
  [
    "deleted import result goes back to the list",
    () => request(importResultPath),
    { status: 302, location: "/imports" },
  ],
  [
    "same range is imported again after delete",
    async () => {
      const response = await request("/api/imports", { method: "POST", form: { payload: importPayload } });
      importResultPath = response.location;
      return response;
    },
    { status: 302, location: "/imports/result?id=" },
  ],
  ["patterns list the re-imported merchant", () => request("/patterns"), { status: 200, contains: "Kawiarnia smoke" }],
  [
    "pattern detail renders the month total",
    () => request("/patterns/kawiarnia%20smoke"),
    { status: 200, contains: "Suma w maju" },
  ],
  [
    "pattern detail has no threshold yet",
    () => request("/patterns/kawiarnia%20smoke"),
    { status: 200, contains: ">brak ustawionego progu<" },
  ],
  [
    "threshold with a zero value is rejected",
    () =>
      request("/api/patterns/threshold", {
        method: "POST",
        form: { key: "kawiarnia smoke", kind: "amount", value: "0" },
      }),
    { status: 302, location: "/patterns/kawiarnia%20smoke?error=value" },
  ],
  [
    "threshold is saved",
    () =>
      request("/api/patterns/threshold", {
        method: "POST",
        form: { key: "kawiarnia smoke", kind: "amount", value: "30" },
      }),
    { status: 302, location: "/patterns/kawiarnia%20smoke?saved=1" },
  ],
  [
    // Same key + kind, changed value: proves the upsert's onConflict path through real PostgREST, not just the
    // pgTAP SQL statement — steps 5 and the Phase 6 list steps then read ">5,50 zł<", which a non-updated 30 zł
    // threshold would render as ">15,50 zł<" (plan review F1).
    "threshold is changed",
    () =>
      request("/api/patterns/threshold", {
        method: "POST",
        form: { key: "kawiarnia smoke", kind: "amount", value: "40" },
      }),
    { status: 302, location: "/patterns/kawiarnia%20smoke?saved=1" },
  ],
  [
    "pattern detail confirms the saved threshold",
    () => request("/patterns/kawiarnia%20smoke?saved=1"),
    { status: 200, contains: "Sukces — próg zapisany." },
  ],
  [
    "pattern detail marks the over-limit transaction",
    () => request("/patterns/kawiarnia%20smoke"),
    { status: 200, contains: ">ponad próg<" },
  ],
  [
    "pattern detail shows the over-limit sum",
    () => request("/patterns/kawiarnia%20smoke"),
    { status: 200, contains: ">5,50 zł<" },
  ],
  ["patterns list shows the threshold", () => request("/patterns"), { status: 200, contains: ">40,00 zł<" }],
  ["patterns list shows the over-limit sum", () => request("/patterns"), { status: 200, contains: ">5,50 zł<" }],
  [
    "patterns list links the pattern detail",
    () => request("/patterns"),
    { status: 200, contains: 'href="/patterns/kawiarnia%20smoke"' },
  ],
  [
    "threshold is removed",
    () => request("/api/patterns/threshold/delete", { method: "POST", form: { key: "kawiarnia smoke" } }),
    { status: 302, location: "/patterns/kawiarnia%20smoke?removed=1" },
  ],
  [
    "pattern detail drops the over-limit mark after removal",
    () => request("/patterns/kawiarnia%20smoke"),
    { status: 200, contains: ">brak ustawionego progu<", notContains: ">ponad próg<" },
  ],
  ["pattern detail of an unknown key is not found", () => request("/patterns/nie%20ma%20takiego"), { status: 404 }],
  ["imports lists the delete action", () => request("/imports"), { status: 200, contains: ">Usuń import<" }],
  [
    "password change rejects wrong current password",
    () =>
      request("/api/auth/password", {
        method: "POST",
        form: { current: "wrong", password: password2, confirm: password2 },
      }),
    { status: 302, location: "/settings?error=current-password" },
  ],
  [
    "password change rejects short password",
    () =>
      request("/api/auth/password", { method: "POST", form: { current: password, password: "abc", confirm: "abc" } }),
    { status: 302, location: "/settings?error=password" },
  ],
  [
    "password change succeeds",
    () =>
      request("/api/auth/password", {
        method: "POST",
        form: { current: password, password: password2, confirm: password2 },
      }),
    { status: 302, location: "/settings?password=changed" },
  ],
  [
    "settings shows password changed",
    () => request("/settings?password=changed"),
    { status: 200, contains: "Hasło zostało zmienione." },
  ],
  [
    "delete without confirm word is rejected",
    () => request("/api/auth/delete", { method: "POST", form: { current: password2, confirm: "usuń" } }),
    { status: 302, location: "/settings?error=delete" },
  ],
  [
    "delete without current password is rejected",
    () => request("/api/auth/delete", { method: "POST", form: { confirm: "USUŃ" } }),
    { status: 302, location: "/settings?error=delete" },
  ],
  [
    "delete with wrong current password is rejected",
    () => request("/api/auth/delete", { method: "POST", form: { current: "wrong", confirm: "USUŃ" } }),
    { status: 302, location: "/settings?error=delete-password" },
  ],
  ["login redirects signed-in user", () => request("/login"), { status: 302, location: "/home" }],
  [
    "reset always says check inbox",
    () => request("/api/auth/reset", { method: "POST", form: { email: "nobody@example.com" } }),
    { status: 302, location: "/reset?sent=1" },
  ],
  ["signout clears session", () => request("/api/auth/signout", { method: "POST" }), { status: 302, location: "/" }],
  ["home redirects after signout", () => request("/home"), { status: 302, location: "/login" }],
  [
    "import without a session goes to login",
    () => request("/api/imports", { method: "POST", form: { payload: importPayload } }),
    { status: 302, location: "/login" },
  ],
  [
    "pattern detail without a session goes to login",
    () => request("/patterns/kawiarnia%20smoke"),
    { status: 302, location: "/login" },
  ],
  [
    "threshold save without a session goes to login",
    () =>
      request("/api/patterns/threshold", {
        method: "POST",
        form: { key: "kawiarnia smoke", kind: "amount", value: "40" },
      }),
    { status: 302, location: "/login" },
  ],
  [
    "import delete without a session goes to login",
    () =>
      request("/api/imports/delete", {
        method: "POST",
        form: { id: "00000000-0000-4000-8000-000000000000" },
      }),
    { status: 302, location: "/login" },
  ],
  [
    "signup with a taken e-mail says occupied",
    () => request("/api/auth/signup", { method: "POST", form: { email, password } }),
    { status: 302, location: "/register?error=occupied" },
  ],
  [
    "register shows the occupied state",
    () => request("/register?error=occupied"),
    { status: 200, contains: "jest już zajęty" },
  ],
  [
    "signin rejects the old password",
    () => request("/api/auth/signin", { method: "POST", form: { email, password } }),
    { status: 302, location: "/login?error=1" },
  ],
  [
    "signin accepts the new password",
    () => request("/api/auth/signin", { method: "POST", form: { email, password: password2 } }),
    { status: 302, location: "/home" },
  ],
  [
    "delete with password and confirm word removes the account",
    () => request("/api/auth/delete", { method: "POST", form: { current: password2, confirm: "USUŃ" } }),
    { status: 302, location: "/login?deleted=1" },
  ],
  [
    "login shows the deleted state",
    () => request("/login?deleted=1"),
    { status: 200, contains: "Konto zostało usunięte." },
  ],
  ["home redirects after deletion", () => request("/home"), { status: 302, location: "/login" }],
  [
    "signin after deletion is rejected",
    () => request("/api/auth/signin", { method: "POST", form: { email, password: password2 } }),
    { status: 302, location: "/login?error=1" },
  ],
  [
    "signup after deletion is accepted again",
    () => request("/api/auth/signup", { method: "POST", form: { email, password } }),
    { status: 302, location: "/confirm-email" },
  ],
  [
    "signin re-created account",
    () => request("/api/auth/signin", { method: "POST", form: { email, password } }),
    { status: 302, location: "/home" },
  ],
  [
    "delete re-created account (cleanup)",
    () => request("/api/auth/delete", { method: "POST", form: { current: password, confirm: "USUŃ" } }),
    { status: 302, location: "/login?deleted=1" },
  ],
  [
    "seeded test user signs in",
    () => request("/api/auth/signin", { method: "POST", form: seeded }),
    { status: 302, location: "/home" },
  ],
  ["patterns renders empty view", () => request("/patterns"), { status: 200, contains: "Wgraj pierwszy wyciąg" }],
  ["signout seeded user", () => request("/api/auth/signout", { method: "POST" }), { status: 302, location: "/" }],
];

let failed = 0;
for (const [name, run, expected] of steps) {
  const actual = await run();
  const ok =
    actual.status === expected.status &&
    (expected.location === undefined || actual.location.startsWith(expected.location)) &&
    (expected.contains === undefined || actual.body.includes(expected.contains)) &&
    (expected.notContains === undefined || !actual.body.includes(expected.notContains));
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}  -> ${actual.status} ${actual.location}`);
  if (!ok) {
    failed++;
    console.log(
      `      expected ${expected.status} ${expected.location ?? ""} ${expected.contains ?? ""} ${
        expected.notContains ? `notContains:${expected.notContains}` : ""
      }`,
    );
  }
}

console.log(failed ? `\n${failed} step(s) failed` : "\nAll smoke steps passed");
process.exit(failed ? 1 : 0);
