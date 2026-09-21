import type { APIRoute } from "astro";
import { createClient } from "@/lib/supabase";
import { PENDING_EMAIL_COOKIE } from "@/lib/auth-rules";

export const prerender = false;

// Re-sends the signup confirmation for the address signup stored in the pending cookie. Supabase
// allows one re-send per minute; the page shows the same countdown, the server answer is the fallback.
export const POST: APIRoute = async (context) => {
  const email = context.cookies.get(PENDING_EMAIL_COOKIE)?.value;
  const supabase = createClient(context.request.headers, context.cookies);
  if (!email || !supabase) {
    return context.redirect("/confirm-email?error=1");
  }
  const emailRedirectTo = new URL("/auth/callback?next=/home", context.url.origin).toString();
  const { error } = await supabase.auth.resend({ type: "signup", email, options: { emailRedirectTo } });
  if (error) {
    // eslint-disable-next-line no-console -- server-side only; the runtime log is the one place this error is visible
    console.error("auth/resend failed", error.status, error.code, error.message);
    return context.redirect("/confirm-email?error=1");
  }
  return context.redirect("/confirm-email?resent=1");
};
