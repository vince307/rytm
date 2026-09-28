// Smoke test: proves the built app, the Vercel adapter and the Supabase auth flow still work together,
// including the account contract (password change, self-service deletion) which also cleans up the smoke user,
// the import write path (POST /api/imports: saved, overlap, invalid payload, anonymous), the import delete
// path (POST /api/imports/delete: not-found, own delete, patterns dropping the import, re-import accepted) and
// the durable pattern decision path (POST /api/patterns/decision: merge, type, rename, exclude/restore, unmerge,
// a second import joining a merged pattern without re-editing — S-05 US-03) and /fixed (FR-012/US-04, S-06):
// pre-import view, a one-month state (no change / unchanged rows), a changed amount with its previous value, and
// an excluded pattern staying off the list — reusing the smoke user's existing May/June imports and decisions
// rather than a dedicated payload (S-06 plan Key Discoveries).
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
// A second, non-overlapping month for the US-03 durability proof (S-05 Phase 4): new bankTxIds, same account.
// "Sklep smoke" and "Kawiarnia smoke" join the merged pattern created below; "Piekarnia smoke" stays separate.
const importPayloadJune = JSON.stringify({
  accountNumber: "11111100000000000000000099",
  accountName: "Konto smoke",
  periodStart: "2026-06-01",
  periodEnd: "2026-06-30",
  transactions: [
    {
      occurredOn: "2026-06-04",
      amountMinor: 1299,
      bankTxId: "000000000000000003",
      counterparty: "Sklep smoke",
      title: "Zakup",
      details: "",
    },
    {
      occurredOn: "2026-06-10",
      amountMinor: 800,
      bankTxId: "000000000000000004",
      counterparty: "Piekarnia smoke",
      title: "Zakup",
      details: "",
    },
    {
      occurredOn: "2026-06-20",
      amountMinor: 4700,
      bankTxId: "000000000000000005",
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
  [
    "fixed shows the pre-import view",
    () => request("/fixed"),
    { status: 200, contains: ">Koszty stałe pojawią się po pierwszym imporcie.<", notContains: ">Zmieniły kwotę<" },
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
    "fixed with one month lists no change",
    () => request("/fixed"),
    { status: 200, contains: ">Żaden koszt stały nie zmienił kwoty w tym miesiącu.<" },
  ],
  [
    "fixed with one month lists unchanged patterns",
    () => request("/fixed"),
    { status: 200, contains: [">Kawiarnia smoke<", ">Bez zmian<"] },
  ],
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
  [
    "decision with an unknown action is rejected",
    () => request("/api/patterns/decision", { method: "POST", form: { key: "kawiarnia smoke", action: "nope" } }),
    { status: 302, location: "/patterns/kawiarnia%20smoke?error=decision" },
  ],
  [
    "merge into itself is rejected",
    () =>
      request("/api/patterns/decision", {
        method: "POST",
        form: { key: "sklep smoke", action: "merge", target: "sklep smoke" },
      }),
    { status: 302, location: "/patterns/sklep%20smoke?error=merge" },
  ],
  [
    "pattern is merged",
    () =>
      request("/api/patterns/decision", {
        method: "POST",
        form: { key: "sklep smoke", action: "merge", target: "kawiarnia smoke" },
      }),
    { status: 302, location: "/patterns/kawiarnia%20smoke?merged=1" },
  ],
  [
    "merge confirms the result",
    () => request("/patterns/kawiarnia%20smoke?merged=1"),
    { status: 200, contains: "Wzorce scalone." },
  ],
  [
    "detail offers the actions",
    () => request("/patterns/kawiarnia%20smoke"),
    { status: 200, contains: ">Akcje<", notContains: "Wzorce scalone." },
  ],
  [
    "merged pattern sums its components",
    () => request("/patterns/kawiarnia%20smoke"),
    { status: 200, contains: ">58,49 zł<" },
  ],
  [
    "merged pattern lists its variant",
    () => request("/patterns/kawiarnia%20smoke"),
    { status: 200, contains: ">Cofnij scalenie<" },
  ],
  [
    "merged pattern is re-typed by D5",
    () => request("/patterns/kawiarnia%20smoke"),
    { status: 200, contains: ">częsty<" },
  ],
  [
    "absorbed pattern redirects to the merged one",
    () => request("/patterns/sklep%20smoke"),
    { status: 302, location: "/patterns/kawiarnia%20smoke" },
  ],
  ["patterns list shows one merged row", () => request("/patterns"), { status: 200, notContains: ">Sklep smoke<" }],
  [
    "type is pinned",
    () =>
      request("/api/patterns/decision", {
        method: "POST",
        form: { key: "kawiarnia smoke", action: "type", type: "fixed" },
      }),
    { status: 302, location: "/patterns/kawiarnia%20smoke?typed=1" },
  ],
  [
    "pinned type shows on the detail",
    () => request("/patterns/kawiarnia%20smoke"),
    { status: 200, contains: ">stały<" },
  ],
  [
    "threshold on the pinned type is saved",
    () =>
      request("/api/patterns/threshold", {
        method: "POST",
        form: { key: "kawiarnia smoke", kind: "amount", value: "40" },
      }),
    { status: 302, location: "/patterns/kawiarnia%20smoke?saved=1" },
  ],
  [
    "pinned type takes the amount threshold",
    () => request("/patterns/kawiarnia%20smoke"),
    { status: 200, contains: ">5,50 zł<" },
  ],
  [
    "pattern is excluded",
    () => request("/api/patterns/decision", { method: "POST", form: { key: "kawiarnia smoke", action: "exclude" } }),
    { status: 302, location: "/patterns/kawiarnia%20smoke?excluded=1" },
  ],
  [
    "excluded pattern has no over-limit",
    () => request("/patterns/kawiarnia%20smoke"),
    { status: 200, contains: ">stały<", notContains: ">5,50 zł<" },
  ],
  [
    "rename with an over-long name is rejected",
    () =>
      request("/api/patterns/decision", {
        method: "POST",
        form: { key: "kawiarnia smoke", action: "rename", name: "a".repeat(101) },
      }),
    { status: 302, location: "/patterns/kawiarnia%20smoke?error=name" },
  ],
  [
    "pattern is renamed",
    () =>
      request("/api/patterns/decision", {
        method: "POST",
        form: { key: "kawiarnia smoke", action: "rename", name: "Kawiarnia Rytm" },
      }),
    { status: 302, location: "/patterns/kawiarnia%20smoke?renamed=1" },
  ],
  [
    "rename keeps the exclusion",
    () => request("/patterns/kawiarnia%20smoke"),
    { status: 200, contains: ">Kawiarnia Rytm<", notContains: ">5,50 zł<" },
  ],
  [
    "excluded pattern shows the banner",
    () => request("/patterns/kawiarnia%20smoke"),
    { status: 200, contains: ">Wykluczony z analizy<" },
  ],
  [
    "patterns list shows the excluded section",
    () => request("/patterns"),
    { status: 200, contains: ">Kawiarnia Rytm<", notContains: "Wzorzec przywrócony do analizy." },
  ],
  [
    "excluded pattern leaves the table",
    () => request("/patterns"),
    { status: 200, notContains: 'href="/patterns/kawiarnia%20smoke"' },
  ],
  [
    "import after the decisions is saved",
    () => request("/api/imports", { method: "POST", form: { payload: importPayloadJune } }),
    { status: 302, location: "/imports/result?id=" },
  ],
  [
    "later import joins the merged pattern",
    () => request("/patterns/kawiarnia%20smoke"),
    { status: 200, contains: ">59,99 zł<" },
  ],
  [
    "later import keeps the pinned type",
    () => request("/patterns/kawiarnia%20smoke"),
    { status: 200, contains: ">stały<" },
  ],
  [
    "later import keeps the name",
    () => request("/patterns/kawiarnia%20smoke"),
    { status: 200, contains: ">Kawiarnia Rytm<" },
  ],
  [
    "later import keeps the exclusion",
    () => request("/patterns/kawiarnia%20smoke"),
    { status: 200, notContains: ">7,00 zł<" },
  ],
  [
    "pattern is restored",
    () => request("/api/patterns/decision", { method: "POST", form: { key: "kawiarnia smoke", action: "restore" } }),
    { status: 302, location: "/patterns/kawiarnia%20smoke?restored=1" },
  ],
  [
    "restored pattern shows its over-limit again",
    () => request("/patterns/kawiarnia%20smoke"),
    { status: 200, contains: ">7,00 zł<" },
  ],
  [
    "restored pattern drops the banner",
    () => request("/patterns/kawiarnia%20smoke"),
    { status: 200, notContains: ">Wykluczony z analizy<" },
  ],
  [
    "list confirms a restore",
    () => request("/patterns?restored=1"),
    { status: 200, contains: "Wzorzec przywrócony do analizy." },
  ],
  [
    "merge is undone",
    () =>
      request("/api/patterns/decision", {
        method: "POST",
        form: { key: "kawiarnia smoke", action: "unmerge", source: "sklep smoke" },
      }),
    { status: 302, location: "/patterns/kawiarnia%20smoke?unmerged=1" },
  ],
  [
    "unmerged pattern has its own detail again",
    () => request("/patterns/sklep%20smoke"),
    { status: 200, contains: ">Sklep smoke<" },
  ],
  [
    "fixed lists a changed amount",
    () => request("/fixed"),
    { status: 200, contains: ">+1,50 zł<", notContains: ">Żaden koszt stały nie zmienił kwoty w tym miesiącu.<" },
  ],
  [
    "fixed shows the previous amount",
    () => request("/fixed"),
    { status: 200, contains: [">20.06.2026 · poprzednio 45,50 zł<", ">Kawiarnia Rytm<"] },
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
  ["fixed without a session goes to login", () => request("/fixed"), { status: 302, location: "/login" }],
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
    "decision without a session goes to login",
    () =>
      request("/api/patterns/decision", {
        method: "POST",
        form: { key: "kawiarnia smoke", action: "exclude" },
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
  // `contains` accepts a single needle or an array of needles that must all be present (S-06: a `/fixed` step
  // proves two facts from one GET — e.g. a row's name and its section header — rather than splitting into two
  // named steps just to fit a single-needle assertion).
  const needles = expected.contains === undefined ? [] : [expected.contains].flat();
  const ok =
    actual.status === expected.status &&
    (expected.location === undefined || actual.location.startsWith(expected.location)) &&
    needles.every((needle) => actual.body.includes(needle)) &&
    (expected.notContains === undefined || !actual.body.includes(expected.notContains));
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}  -> ${actual.status} ${actual.location}`);
  if (!ok) {
    failed++;
    console.log(
      `      expected ${expected.status} ${expected.location ?? ""} ${needles.join(" & ")} ${
        expected.notContains ? `notContains:${expected.notContains}` : ""
      }`,
    );
  }
}

console.log(failed ? `\n${failed} step(s) failed` : "\nAll smoke steps passed");
process.exit(failed ? 1 : 0);
