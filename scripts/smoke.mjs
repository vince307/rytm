// Smoke test: proves the built app, the Vercel adapter and the Supabase auth flow still work together,
// including the account contract (password change, self-service deletion) which also cleans up the smoke user,
// the import write path (POST /api/imports: saved, overlap, invalid payload, anonymous), the import delete
// path (POST /api/imports/delete: not-found, own delete, patterns dropping the import, re-import accepted) and
// the durable pattern decision path (POST /api/patterns/decision: merge, type, rename, exclude/restore, unmerge,
// a second import joining a merged pattern without re-editing — S-05 US-03) and /fixed (FR-012/US-04, S-06):
// pre-import view, a one-month state (no change / unchanged rows / no-comparison message, no "nowy"), a changed
// amount with its previous value, an excluded pattern staying off the list, a new pattern with its "pierwsze
// wystąpienie" meta and "nowy" badge, and the comparison-present negative control — reusing the smoke user's
// existing May/June imports and decisions rather than a dedicated payload (S-06 plan Key Discoveries), and
// /home (FR-013/US-05, FR-012/US-04, S-07 Phases 2-4): pre-import (no trend, no import panel), a one-month
// no-threshold state (hint + tooShort panel), the over-limit sum after a threshold is saved, the import panel
// offering the next upload once data exists, the sum dropping to 0 after removal, an excluded pattern's threshold
// contributing nothing while the newer month still appears on the axis, every month recomputing once the pattern
// is restored, the accent stat card's delta foot hidden with one month of data and shown once a previous month
// exists, and the "Koszty stałe" card's total and "podrożała" count — pure GETs inserted between existing steps,
// no new payload — and the S-09 demo guard (the seeded demo account refused a second import, an undo, a password
// change and a deletion).
// Zero dependencies on purpose. Run against a live server: BASE_URL=http://localhost:4321 node scripts/smoke.mjs

import { randomUUID } from "node:crypto";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:4321";
const email = `smoke-${Date.now()}@example.com`;
const password = "Smoke-Test-Passw0rd!";
const password2 = "Smoke-Test-Passw0rd-2!";
// Seeded by supabase/seed.sql on every `supabase start` / `db reset` (local and CI).
const seeded = { email: "test@rytm.local", password: "Rytm-Test-Passw0rd!" };
// Shared demo account (S-09), also seeded; the dev server's .env sets DEMO_EMAIL to this address.
const demo = { email: "demo@rytm.local", password: "Rytm-Demo-Passw0rd!" };
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
// S-10: a Santander payload on the re-created account (2 debits, no bank transaction id — rule 7),
// `accountName: "Rachunek"` is what the wizard sends (Phase 5, copyExtra.imports.santanderAccountName).
const santanderTransactions = [
  {
    occurredOn: "2026-05-06",
    amountMinor: 1850,
    bankTxId: null,
    counterparty: "Santander smoke",
    title: "Płatność kartą",
    details: "",
  },
  {
    occurredOn: "2026-05-22",
    amountMinor: 3200,
    bankTxId: null,
    counterparty: "Santander smoke",
    title: "Płatność kartą",
    details: "",
  },
];
const santanderPayload = JSON.stringify({
  source: "santander",
  accountNumber: "22222200000000000000000099",
  accountName: "Rachunek",
  periodStart: "2026-05-01",
  periodEnd: "2026-05-31",
  transactions: santanderTransactions,
});
// Same shape, but one transaction carries an ING-style 18-digit id — rejected by the schema's per-bank refine.
const santanderInvalidPayload = JSON.stringify({
  source: "santander",
  accountNumber: "22222200000000000000000099",
  accountName: "Rachunek",
  periodStart: "2026-05-01",
  periodEnd: "2026-05-31",
  transactions: [{ ...santanderTransactions[0], bankTxId: "000000000000000009" }, santanderTransactions[1]],
});
let santanderResultPath = "/imports/result";
// S-11 Phase 4: a Santander card import (two card payments to the same merchant in two cities, two ATM
// withdrawals at two addresses) on the re-created account, disjoint (June) from the May payload above.
const santanderCardPayload = JSON.stringify({
  source: "santander",
  accountNumber: "22222200000000000000000099",
  accountName: "Rachunek",
  periodStart: "2026-06-01",
  periodEnd: "2026-06-30",
  transactions: [
    {
      occurredOn: "2026-06-03",
      amountMinor: 1850,
      bankTxId: null,
      counterparty: "PIZZERIA SMOKE KRAKOW",
      title: "DOP. VISA 123456******1111 PŁATNOŚĆ KARTĄ 18.50 PLN PIZZERIA SMOKE KRAKOW",
      details: "",
    },
    {
      occurredOn: "2026-06-08",
      amountMinor: 2200,
      bankTxId: null,
      counterparty: "PIZZERIA SMOKE WARSZAWA",
      title: "DOP. VISA 123456******2222 PŁATNOŚĆ KARTĄ 22.00 PLN PIZZERIA SMOKE WARSZAWA",
      details: "",
    },
    {
      occurredOn: "2026-06-12",
      amountMinor: 5000,
      bankTxId: null,
      counterparty: "UL SMOKOWA 5 KRAKOW",
      title: "DOP. VISA 123456******3333 WYPŁATA Z BANKOMATU KARTĄ 50.00 PLN UL SMOKOWA 5 KRAKOW",
      details: "",
    },
    {
      occurredOn: "2026-06-18",
      amountMinor: 10000,
      bankTxId: null,
      counterparty: "UL SMOKOWA 7 WARSZAWA",
      title: "DOP. VISA 123456******4444 WYPŁATA Z BANKOMATU KARTĄ 100.00 PLN UL SMOKOWA 7 WARSZAWA",
      details: "",
    },
  ],
});
// Same merchant on the ING side (a new account, never imported before): proves the cross-bank join (S-11) — the
// Santander card tail and this ING counterparty's address tail both normalize to "PIZZERIA SMOKE".
const ingPizzeriaPayload = JSON.stringify({
  accountNumber: "11111100000000000000000097",
  accountName: "Konto smoke",
  periodStart: "2026-06-01",
  periodEnd: "2026-06-30",
  transactions: [
    {
      occurredOn: "2026-06-15",
      amountMinor: 1850,
      bankTxId: "000000000000000010",
      counterparty: "PIZZERIA SMOKE UL. SMOKOWA 1 KRAKÓW",
      title: "Płatność kartą",
      details: "",
    },
  ],
});
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
  ["how-it-works renders", () => request("/how-it-works"), { status: 200, contains: ">Trzy spokojne kroki.<" }],
  ["for-who renders", () => request("/for-who"), { status: 200, contains: ">Rytm pasuje do Twojego tempa.<" }],
  ["landing footer links for-who", () => request("/"), { status: 200, contains: '>Dla kogo</a><a href="#"' }],
  ["login renders", () => request("/login"), { status: 200, contains: "Zaloguj się" }],
  ["login offers password reset", () => request("/login"), { status: 200, contains: "Nie pamiętam hasła" }],
  [
    "reset page uses the round-3 copy",
    () => request("/reset"),
    { status: 200, contains: [">Odzyskaj dostęp.<", "Podaj e-mail, którego używasz w Rytmie."] },
  ],
  [
    "login error shows the restored kit message",
    () => request("/login?error=1"),
    { status: 200, contains: ">Nie rozpoznaliśmy tego e-maila i hasła. Spróbuj ponownie.<" },
  ],
  [
    "register fills the password minimum",
    () => request("/register"),
    { status: 200, contains: "co najmniej 6 znaków", notContains: "{n}" },
  ],
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
    "home before import has no trend",
    () => request("/home"),
    { status: 200, notContains: [">Ponad progiem<", ">Dodaj najnowszy wyciąg<"] },
  ],
  [
    "fixed shows the pre-import view",
    () => request("/fixed"),
    { status: 200, contains: ">Koszty stałe pojawią się po pierwszym imporcie.<", notContains: ">Zmieniły kwotę<" },
  ],
  ["settings renders account e-mail", () => request("/settings"), { status: 200, contains: email }],
  [
    "settings fills the password minimum",
    () => request("/settings"),
    { status: 200, contains: "co najmniej 6 znaków", notContains: "{n}" },
  ],
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
  // S-13: the wizard island is server-rendered at step 1, so these match the rendered node (leading `>`), not
  // the bare text that the island's serialized props also contain.
  [
    "import wizard step 1 names both banks",
    () => request("/imports/new"),
    {
      status: 200,
      contains: ">Obsługujemy pliki CSV z ING Bank Śląski i Santander Bank Polska w PLN.<",
    },
  ],
  [
    "import wizard shows the inconsistent-file message for a rejected payload",
    () => request("/imports/new?error=invalid"),
    { status: 200, contains: ">Plik jest niespójny:" },
  ],
  [
    "import wizard renders the overlap range as a link inside the kit sentence",
    () => request("/imports/new?error=overlap&from=2026-05-01&to=2026-05-31"),
    {
      status: 200,
      contains: [
        ">Ten zakres nachodzi na istniejący import:",
        '<a href="/imports" class="underline">1 maja – 31 maja 2026</a>',
      ],
    },
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
    { status: 200, contains: "Nie znaleziono importu." },
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
    { status: 200, contains: "Nie znaleziono importu." },
  ],
  [
    "patterns drop the deleted import",
    () => request("/patterns"),
    { status: 200, contains: "Wzorce pojawią się po pierwszym imporcie.", notContains: "Kawiarnia smoke" },
  ],
  [
    "deleted import result shows not-found",
    () => request(importResultPath),
    { status: 200, contains: ">Nie znaleziono importu.<" },
  ],
  [
    "import result of a malformed id shows not-found",
    () => request("/imports/result?id=nope"),
    { status: 200, contains: ">Nie znaleziono importu.<" },
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
    "patterns table keeps the Ponad progiem header",
    () => request("/patterns"),
    { status: 200, contains: ">Ponad progiem<" },
  ],
  [
    "home shows the trend without a threshold",
    () => request("/home"),
    {
      status: 200,
      contains: [
        ">Ponad progiem<",
        ">0,00 zł<",
        ">maj 26<",
        "Trend pojawi się po 3 miesiącach danych.",
        "Ustaw próg na wzorcu, a tu pojawi się suma ponad progiem.",
      ],
    },
  ],
  [
    "fixed with one month lists no change",
    () => request("/fixed"),
    { status: 200, contains: ">Żaden koszt stały nie zmienił kwoty w tym miesiącu.<" },
  ],
  [
    "fixed fills the month in the new section title",
    () => request("/fixed"),
    { status: 200, contains: ">Nowe w maju<", notContains: "{month}" },
  ],
  [
    "fixed with one month lists unchanged patterns",
    () => request("/fixed"),
    { status: 200, contains: [">Kawiarnia smoke<", ">Bez zmian<"] },
  ],
  [
    "fixed without a previous month says so",
    () => request("/fixed"),
    {
      status: 200,
      contains: ">Nie ma poprzedniego miesiąca do porównania.<",
      notContains: ">nowy<",
    },
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
    "home shows the over-limit sum",
    () => request("/home"),
    {
      status: 200,
      contains: ">5,50 zł<",
      notContains: "Ustaw próg na wzorcu, a tu pojawi się suma ponad progiem.",
    },
  ],
  ["home offers the next import", () => request("/home"), { status: 200, contains: ">Dodaj najnowszy wyciąg<" }],
  [
    // One month of data (May only) — `homeStats.previous` is `null` (`previousMonth` April has no rows), so the
    // accent stat card renders no delta foot at all (S-07 Phase 3, plan review F1 gap rule).
    "home has no comparison with one month",
    () => request("/home"),
    { status: 200, contains: ">Ponad progiem w tym miesiącu<", notContains: "względem" },
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
    "home drops the sum after threshold removal",
    () => request("/home"),
    { status: 200, contains: ">0,00 zł<", notContains: ">5,50 zł<" },
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
    "home skips an excluded pattern",
    () => request("/home"),
    { status: 200, contains: ">cze 26<", notContains: [">5,50 zł<", ">7,00 zł<"] },
  ],
  [
    "fixed hides an excluded pattern",
    () => request("/fixed"),
    { status: 200, contains: ">Piekarnia smoke<", notContains: ">Kawiarnia Rytm<" },
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
  ["home recomputes every month", () => request("/home"), { status: 200, contains: [">5,50 zł<", ">7,00 zł<"] }],
  [
    // June (7,00 zł) vs May (5,50 zł) — the accent card's delta foot, positive control for the previous step.
    "home compares with the previous month",
    () => request("/home"),
    { status: 200, contains: ">+1,50 zł względem maja<" },
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
    // "Koszty stałe" card: Kawiarnia Rytm 47,00 + Sklep smoke 12,99 + Piekarnia smoke 8,00 = 67,99 zł; only
    // Kawiarnia Rytm rose (S-07 Phase 3, `homeStats.fixedRisen` counts `deltaMinor > 0` only).
    "home counts fixed costs that rose",
    () => request("/home"),
    { status: 200, contains: [">1 pozycja podrożała<", ">67,99 zł<"] },
  ],
  [
    "fixed shows the previous amount",
    () => request("/fixed"),
    { status: 200, contains: [">20.06.2026 · poprzednio 45,50 zł<", ">Kawiarnia Rytm<"] },
  ],
  [
    "fixed marks a new pattern",
    () => request("/fixed"),
    { status: 200, contains: [">pierwsze wystąpienie · 10.06.2026<", ">nowy<"] },
  ],
  [
    "fixed compares with the previous month",
    () => request("/fixed"),
    { status: 200, notContains: ">Nie ma poprzedniego miesiąca do porównania.<" },
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
  // S-10 Phase 3: the Santander write path, on a fresh account, proving import_statement end to end
  // without touching any ING step above.
  [
    "santander import is saved and shows its result",
    async () => {
      const response = await request("/api/imports", { method: "POST", form: { payload: santanderPayload } });
      santanderResultPath = response.location;
      return response;
    },
    { status: 302, location: "/imports/result?id=" },
  ],
  [
    "santander import result renders the debit count",
    () => request(santanderResultPath),
    { status: 200, contains: "Dodaliśmy 2 obciążenia." },
  ],
  // S-13 Phase 3: the kit draws the bank in its own column and the account as `{name} · •• {tail}` (rewritten
  // from the S-10 bank-prefixed label). Plain server-rendered cells, no island: node and bare text coincide.
  ["imports list names the bank", () => request("/imports"), { status: 200, contains: ">Santander Bank Polska<" }],
  ["imports list shows the account tail", () => request("/imports"), { status: 200, contains: ">Rachunek · •• 0099<" }],
  [
    "imports list has the bank column",
    () => request("/imports"),
    {
      status: 200,
      contains: ">Bank</th>",
    },
  ],
  [
    "santander import result names the bank",
    () => request(santanderResultPath),
    { status: 200, contains: ">Santander Bank Polska<" },
  ],
  [
    "santander import result shows the account",
    () => request(santanderResultPath),
    { status: 200, contains: ">Rachunek · •• 0099<" },
  ],
  [
    "patterns lists the santander merchant",
    () => request("/patterns"),
    // The rendered node (`<span>{p.name}</span>`), not the bare text — PatternsTable's serialized island
    // props contain the same string.
    { status: 200, contains: ">Santander smoke<" },
  ],
  [
    "santander import of an overlapping range is rejected",
    () => request("/api/imports", { method: "POST", form: { payload: santanderPayload } }),
    { status: 302, location: "/imports/new?error=overlap&from=" },
  ],
  [
    "santander import with a bank transaction id is rejected",
    () => request("/api/imports", { method: "POST", form: { payload: santanderInvalidPayload } }),
    { status: 302, location: "/imports/new?error=invalid" },
  ],
  // S-11 Phase 4: cross-bank merchant join (Santander card + ING) and the Santander ATM "Bankomat" pattern,
  // proven end to end through the real import endpoint and the real /patterns page — reusing the re-created
  // account's still-signed-in session, no new signup needed.
  [
    "santander card import is saved",
    () => request("/api/imports", { method: "POST", form: { payload: santanderCardPayload } }),
    { status: 302, location: "/imports/result?id=" },
  ],
  [
    "ing import of the same merchant is saved",
    () => request("/api/imports", { method: "POST", form: { payload: ingPizzeriaPayload } }),
    { status: 302, location: "/imports/result?id=" },
  ],
  [
    "patterns join the santander and ing pizzeria rows into one merchant",
    // The rendered node, not the bare text — PatternsTable's serialized island props contain the same string.
    () => request("/patterns"),
    {
      status: 200,
      contains: ">PIZZERIA SMOKE<",
      notContains: [">PIZZERIA SMOKE KRAKOW<", ">PIZZERIA SMOKE WARSZAWA<"],
    },
  ],
  [
    "patterns join the santander atm withdrawals into one Bankomat pattern",
    () => request("/patterns"),
    { status: 200, contains: ">Bankomat<", notContains: ">UL SMOKOWA 5 KRAKOW<" },
  ],
  [
    "delete re-created account (cleanup)",
    () => request("/api/auth/delete", { method: "POST", form: { current: password, confirm: "USUŃ" } }),
    { status: 302, location: "/login?deleted=1" },
  ],
  // S-09 demo guard: the seeded demo account (DEMO_EMAIL) is refused a second import, an import undo, a password
  // change and a deletion; the seeded test user's steps below prove other accounts are unaffected.
  [
    "demo user signs in",
    () => request("/api/auth/signin", { method: "POST", form: demo }),
    { status: 302, location: "/home" },
  ],
  // Only guarantees the account has an import: the first run creates it, later local runs are refused.
  [
    "demo first import is accepted (or already present)",
    () => request("/api/imports", { method: "POST", form: { payload: importPayload } }),
    // Accepted prefixes, not just "/imports/": a failed or invalid import must not pass as "present".
    { status: 302, location: ["/imports/result", "/imports/new?error=demo"] },
  ],
  // S-13 P5: the demo account owns an import now (created above or earlier), so the wizard is locked up front.
  [
    "demo import wizard shows the demo note",
    () => request("/imports/new"),
    { status: 200, contains: ">Na wspólnym koncie demo dodawanie i cofanie importów jest wyłączone.<" },
  ],
  // The guard runs before the RPC, so the same range answers `demo`, not `overlap`.
  [
    "demo second import is refused",
    () => request("/api/imports", { method: "POST", form: { payload: importPayload } }),
    { status: 302, location: "/imports/new?error=demo" },
  ],
  [
    "demo import undo is refused",
    () => request("/api/imports/delete", { method: "POST", form: { id: randomUUID() } }),
    { status: 302, location: "/imports?error=demo" },
  ],
  [
    "demo password change is refused",
    () =>
      request("/api/auth/password", {
        method: "POST",
        form: { current: demo.password, password: password2, confirm: password2 },
      }),
    { status: 302, location: "/settings?error=demo-password" },
  ],
  // /reset/new accepts any signed-in session, not only a recovery one, so it needs the same guard.
  [
    "demo password reset (/reset/new) is refused",
    () => request("/api/auth/reset/new", { method: "POST", form: { password: password2, confirm: password2 } }),
    { status: 302, location: "/reset/new?error=demo" },
  ],
  [
    "demo account deletion is refused",
    () => request("/api/auth/delete", { method: "POST", form: { current: demo.password, confirm: "USUŃ" } }),
    { status: 302, location: "/settings?error=demo-delete" },
  ],
  [
    "demo user still signs in with its password",
    () => request("/api/auth/signin", { method: "POST", form: demo }),
    { status: 302, location: "/home" },
  ],
  ["signout demo user", () => request("/api/auth/signout", { method: "POST" }), { status: 302, location: "/" }],
  [
    "seeded test user signs in",
    () => request("/api/auth/signin", { method: "POST", form: seeded }),
    { status: 302, location: "/home" },
  ],
  [
    "test user import wizard has no demo note",
    () => request("/imports/new"),
    { status: 200, notContains: ">Na wspólnym koncie demo dodawanie i cofanie importów jest wyłączone.<" },
  ],
  ["patterns renders empty view", () => request("/patterns"), { status: 200, contains: "Wgraj pierwszy wyciąg" }],
  ["signout seeded user", () => request("/api/auth/signout", { method: "POST" }), { status: 302, location: "/" }],
];

let failed = 0;
for (const [name, run, expected] of steps) {
  const actual = await run();
  // `location` accepts a single prefix or an array of accepted prefixes (S-09 review F6: the demo's first import
  // is either created or already present, but never failed). `contains` accepts a single needle or an array of needles that must all be present (S-06: a `/fixed` step
  // proves two facts from one GET — e.g. a row's name and its section header — rather than splitting into two
  // named steps just to fit a single-needle assertion). `notContains` is symmetric (S-07 plan review F2: a /home
  // step needs two negative needles — e.g. neither delta amount after an exclusion — from one GET).
  const needles = expected.contains === undefined ? [] : [expected.contains].flat();
  const antiNeedles = expected.notContains === undefined ? [] : [expected.notContains].flat();
  const ok =
    actual.status === expected.status &&
    (expected.location === undefined ||
      [expected.location].flat().some((prefix) => actual.location.startsWith(prefix))) &&
    needles.every((needle) => actual.body.includes(needle)) &&
    antiNeedles.every((needle) => !actual.body.includes(needle));
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}  -> ${actual.status} ${actual.location}`);
  if (!ok) {
    failed++;
    console.log(
      `      expected ${expected.status} ${[expected.location ?? ""].flat().join(" | ")} ${needles.join(" & ")} ${
        antiNeedles.length ? `notContains:${antiNeedles.join(" & ")}` : ""
      }`,
    );
  }
}

console.log(failed ? `\n${failed} step(s) failed` : "\nAll smoke steps passed");
process.exit(failed ? 1 : 0);
