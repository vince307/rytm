// Smoke test: proves the built app, the Vercel adapter and the Supabase auth flow still work together,
// including the account contract (password change, self-service deletion) which also cleans up the smoke user.
// Zero dependencies on purpose. Run against a live server: BASE_URL=http://localhost:4321 node scripts/smoke.mjs

const BASE_URL = process.env.BASE_URL ?? "http://localhost:4321";
const email = `smoke-${Date.now()}@example.com`;
const password = "Smoke-Test-Passw0rd!";
const password2 = "Smoke-Test-Passw0rd-2!";
// Seeded by supabase/seed.sql on every `supabase start` / `db reset` (local and CI).
const seeded = { email: "test@rytm.local", password: "Rytm-Test-Passw0rd!" };
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
    () => request("/api/auth/delete", { method: "POST", form: { confirm: "usuń" } }),
    { status: 302, location: "/settings?error=delete" },
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
    "delete with confirm word removes the account",
    () => request("/api/auth/delete", { method: "POST", form: { confirm: "USUŃ" } }),
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
    () => request("/api/auth/delete", { method: "POST", form: { confirm: "USUŃ" } }),
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
    (expected.contains === undefined || actual.body.includes(expected.contains));
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}  -> ${actual.status} ${actual.location}`);
  if (!ok) {
    failed++;
    console.log(`      expected ${expected.status} ${expected.location ?? ""} ${expected.contains ?? ""}`);
  }
}

console.log(failed ? `\n${failed} step(s) failed` : "\nAll smoke steps passed");
process.exit(failed ? 1 : 0);
