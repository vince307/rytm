// Origin-behind-proxy check: proves the built Node server (dist/server/entry.mjs) sees the public https origin when it
// is reached the way Caddy reaches it on the VPS — plain HTTP on 127.0.0.1, with `Host`, `X-Forwarded-Proto` and
// `X-Forwarded-Host` naming https://rytm.ariom.cloud. Two things break if Astro's `security.allowedDomains`
// (astro.config.mjs) stops trusting those headers:
//   1. every form POST answers 403 (Astro's CSRF check compares `Origin` with the request URL, which would be http://);
//   2. e-mailed links are built from `context.url.origin` (signup.ts, resend.ts, reset.ts) and would point at http://.
// Steps: a foreign Origin is still refused (negative control), the seeded user signs in, a new address signs up (its
// pending-e-mail cookie is `Secure`), a reset e-mail for it lands in Mailpit with `redirect_to=<PUBLIC_ORIGIN>/…`, and
// the new account is deleted again.
//
// Local/CI only: it creates and deletes an account, so it refuses a non-loopback BASE_URL. GoTrue rewrites a
// redirect_to that is not allow-listed to site_url, so supabase/config.toml lists PUBLIC_ORIGIN in
// `additional_redirect_urls`, and Mailpit must be running (do not exclude it in `supabase start -x`).
// Zero dependencies (node:http, because fetch refuses to set `Host`). Run against a live built server:
//   HOST=127.0.0.1 PORT=4402 node dist/server/entry.mjs   (SUPABASE_URL/SUPABASE_KEY of the local Supabase)
//   BASE_URL=http://127.0.0.1:4402 PUBLIC_ORIGIN=https://rytm.ariom.cloud node scripts/check-proxy-origin.mjs

import { Buffer } from "node:buffer";
import http from "node:http";
import { setTimeout as sleep } from "node:timers/promises";
import { URL } from "node:url";

const BASE_URL = process.env.BASE_URL ?? "http://127.0.0.1:4402";
const PUBLIC_ORIGIN = process.env.PUBLIC_ORIGIN ?? "https://rytm.ariom.cloud";
const MAILPIT_URL = process.env.MAILPIT_URL ?? "http://127.0.0.1:54324";
const seeded = { email: "test@rytm.local", password: "Rytm-Test-Passw0rd!" };
const email = `proxy-${Date.now()}@example.com`;
const password = "Proxy-Check-Passw0rd!";

const base = new URL(BASE_URL);
const pub = new URL(PUBLIC_ORIGIN);
if (!["127.0.0.1", "localhost", "[::1]"].includes(base.hostname) || base.protocol !== "http:") {
  console.error(`BASE_URL must be a local http server (got ${BASE_URL}); this check creates accounts.`);
  process.exit(1);
}

// What Caddy sends upstream for a browser on PUBLIC_ORIGIN.
const proxyHeaders = {
  Host: pub.host,
  "X-Forwarded-Proto": pub.protocol.replace(":", ""),
  "X-Forwarded-Host": pub.host,
  "X-Forwarded-For": "203.0.113.7",
};

function post(path, form, { origin = PUBLIC_ORIGIN, cookie = "" } = {}) {
  const body = new URLSearchParams(form).toString();
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: base.hostname.replace(/^\[|\]$/g, ""),
        port: base.port || 80,
        path,
        method: "POST",
        headers: {
          ...proxyHeaders,
          Origin: origin,
          "Content-Type": "application/x-www-form-urlencoded",
          "Content-Length": Buffer.byteLength(body),
          ...(cookie ? { Cookie: cookie } : {}),
        },
      },
      (res) => {
        res.resume();
        res.on("end", () =>
          resolve({
            status: res.statusCode,
            location: res.headers.location ?? "",
            setCookie: res.headers["set-cookie"] ?? [],
          }),
        );
      },
    );
    req.on("error", reject);
    req.end(body);
  });
}

const cookiesOf = (setCookie) => setCookie.map((c) => c.split(";")[0]).join("; ");
const locationPath = (location) =>
  location ? new URL(location, PUBLIC_ORIGIN).pathname + new URL(location, PUBLIC_ORIGIN).search : "";

async function mailpitLinks(to) {
  for (let i = 0; i < 20; i++) {
    const search = await fetch(`${MAILPIT_URL}/api/v1/search?query=${encodeURIComponent(`to:"${to}"`)}`);
    if (!search.ok) throw new Error(`Mailpit search answered ${search.status} (is Mailpit running on ${MAILPIT_URL}?)`);
    const { messages = [] } = await search.json();
    if (messages.length > 0) {
      const message = await (await fetch(`${MAILPIT_URL}/api/v1/message/${messages[0].ID}`)).json();
      return [...`${message.Text} ${message.HTML}`.matchAll(/https?:\/\/[^\s"'<>]+/g)].map((m) =>
        m[0].replaceAll("&amp;", "&"),
      );
    }
    await sleep(500);
  }
  throw new Error(`no e-mail to ${to} in Mailpit after 10 s`);
}

let failures = 0;
async function step(name, run) {
  try {
    const detail = await run();
    console.log(`ok   ${name}${detail ? ` — ${detail}` : ""}`);
  } catch (err) {
    failures++;
    console.log(`FAIL ${name} — ${err instanceof Error ? err.message : String(err)}`);
  }
}
function expect(condition, message) {
  if (!condition) throw new Error(message);
}

console.log(`proxy-origin check: ${BASE_URL} as ${PUBLIC_ORIGIN}`);

await step("a foreign Origin is still refused (CSRF check active)", async () => {
  const res = await post("/api/auth/signin", seeded, { origin: "https://evil.example" });
  expect(res.status === 403, `expected 403, got ${res.status}`);
  return "403";
});

await step("seeded user signs in through the proxy (no 403)", async () => {
  const res = await post("/api/auth/signin", seeded);
  expect(res.status !== 403, "403: Astro does not see the request as same-origin (check security.allowedDomains)");
  expect(
    res.status === 302 && locationPath(res.location) === "/home",
    `expected 302 /home, got ${res.status} ${res.location}`,
  );
  return `${res.status} ${res.location}`;
});

await step("a new address signs up through the proxy (no 403, Secure cookie)", async () => {
  const res = await post("/api/auth/signup", { email, password });
  expect(res.status !== 403, "403: Astro does not see the request as same-origin (check security.allowedDomains)");
  expect(
    res.status === 302 && locationPath(res.location) === "/confirm-email",
    `expected 302 /confirm-email, got ${res.status} ${res.location}`,
  );
  const pending = res.setCookie.find((c) => c.startsWith("rytm-pending-email="));
  expect(pending, "no rytm-pending-email cookie");
  if (pub.protocol === "https:") {
    expect(/;\s*secure/i.test(pending), `pending cookie is not Secure: the app saw http (${pending})`);
  }
  return `${res.status} ${res.location}`;
});

await step(`the e-mailed link returns to ${PUBLIC_ORIGIN}`, async () => {
  const res = await post("/api/auth/reset", { email });
  expect(res.status === 302, `expected 302, got ${res.status}`);
  const links = await mailpitLinks(email);
  const redirects = links.map((link) => new URL(link).searchParams.get("redirect_to")).filter((r) => r !== null);
  expect(redirects.length > 0, `no redirect_to in the e-mail links: ${links.join(" ")}`);
  const bad = redirects.filter((r) => !r.startsWith(`${PUBLIC_ORIGIN}/auth/callback`));
  expect(
    bad.length === 0,
    `redirect_to ${bad.join(", ")} (GoTrue falls back to site_url when ${PUBLIC_ORIGIN} is not in additional_redirect_urls)`,
  );
  return `redirect_to=${redirects[0]}`;
});

await step("the new account is deleted again", async () => {
  const signin = await post("/api/auth/signin", { email, password });
  expect(
    signin.status === 302 && locationPath(signin.location) === "/home",
    `sign-in got ${signin.status} ${signin.location}`,
  );
  const res = await post(
    "/api/auth/delete",
    { current: password, confirm: "USUŃ" },
    { cookie: cookiesOf(signin.setCookie) },
  );
  expect(
    res.status === 302 && locationPath(res.location) === "/login?deleted=1",
    `expected 302 /login?deleted=1, got ${res.status} ${res.location}`,
  );
  return email;
});

if (failures > 0) {
  console.error(`${failures} proxy-origin step(s) failed`);
  process.exit(1);
}
console.log("All proxy-origin steps passed");
