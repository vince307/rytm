import type { APIRoute } from "astro";
import { createClient } from "@/lib/supabase";
import { isCallbackTarget } from "@/lib/auth-rules";

export const prerender = false;

// Landing point of the links Supabase e-mails (signup confirmation, password recovery). With the PKCE
// flow the link carries `?code=…`; exchanging it needs the code-verifier cookie the same browser
// received when the flow started, so the exchange fails when the link is opened elsewhere or expired.
// Confirmation itself already happened on Supabase's /verify, so a failed exchange still means
// "confirmed — sign in with your password"; for recovery it means "ask for a new link".
export const GET: APIRoute = async (context) => {
  const code = context.url.searchParams.get("code");
  const flowId = context.url.searchParams.get("sb_flow_id");
  const nextParam = context.url.searchParams.get("next");
  const next = isCallbackTarget(nextParam) ? nextParam : "/home";
  const fallback = next === "/reset/new" ? "/reset/new?state=expired" : "/login?confirmed=1";

  if (!code) {
    return context.redirect("/login");
  }
  const supabase = createClient(context.request.headers, context.cookies);
  if (!supabase) {
    return context.redirect(fallback);
  }
  const { error } = await supabase.auth.exchangeCodeForSession(code, flowId ? { flowId } : undefined);
  if (error) {
    // eslint-disable-next-line no-console -- server-side only; the runtime log is the one place this error is visible
    console.error("auth/callback exchange failed", error.status, error.code, error.message);
    return context.redirect(fallback);
  }
  return context.redirect(next);
};
