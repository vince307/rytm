import type { APIRoute } from "astro";
import { SUPABASE_URL, SUPABASE_KEY, CRON_SECRET } from "astro:env/server";

export const prerender = false;

// Supabase keep-alive ping, invoked daily by .github/workflows/keep-alive.yml against the production alias
// (rytm-phi.vercel.app). The free-tier project auto-pauses after ~7 days without activity, which takes production
// down and breaks deploys. The request must reach Postgres itself, so this runs a real PostgREST query.
//
// Every table revokes all privileges from `anon`, and this route must not widen that. So the expected answer is
// Postgres refusing the anon role (SQLSTATE 42501): the query was planned and checked inside the database, which
// is the activity we need, and it also proves the revoke still holds. Any other answer is surfaced as 502.
//
// External scheduler, not a Vercel cron: Vercel aims crons at the deployment URL, which Vercel Authentication
// answers with a 302 to SSO, and a redirected cron neither runs nor logs (deploy-plan.md, Production alias).
//
// Auth: `Authorization: Bearer <CRON_SECRET>`. No secret configured, or a mismatch → 401 (fails closed).
export const GET: APIRoute = async ({ request }) => {
  const json = (status: number, body: Record<string, unknown>) =>
    new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

  if (!CRON_SECRET || request.headers.get("authorization") !== `Bearer ${CRON_SECRET}`) {
    return json(401, { ok: false });
  }
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return json(503, { ok: false, error: "supabase env missing" });
  }

  try {
    // `apikey` only: the publishable key is not a JWT, so it does not go in `Authorization`.
    const res = await fetch(`${SUPABASE_URL}/rest/v1/imports?select=id&limit=1`, {
      headers: { apikey: SUPABASE_KEY },
    });
    const body = (await res.json().catch(() => null)) as { code?: string } | null;
    const ok = res.status === 401 && body?.code === "42501";
    return json(ok ? 200 : 502, { ok, supabaseStatus: res.status, code: body?.code ?? null });
  } catch (err) {
    return json(502, { ok: false, error: err instanceof Error ? err.message : "fetch failed" });
  }
};
