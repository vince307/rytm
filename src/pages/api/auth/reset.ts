import type { APIRoute } from "astro";
import { z } from "zod";
import { createClient } from "@/lib/supabase";

export const prerender = false;

const schema = z.object({ email: z.string().trim().pipe(z.email()) });

// Always answers "check your inbox" — never reveals whether the account exists.
export const POST: APIRoute = async (context) => {
  const form = Object.fromEntries(await context.request.formData());
  const parsed = schema.safeParse(form);
  const supabase = createClient(context.request.headers, context.cookies);
  if (parsed.success && supabase) {
    // /reset/new is the G17 page (not built yet); the link in the e-mail 404s until it ships.
    const redirectTo = new URL("/reset/new", context.url.origin).toString();
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, { redirectTo });
    if (error) {
      // The page still says "check your inbox" (no account enumeration); the failure is only visible in the logs.
      // eslint-disable-next-line no-console -- server-side only; the runtime log is the one place this error is visible
      console.error("auth/reset failed", error.status, error.code, error.message);
    }
  }
  return context.redirect("/reset?sent=1");
};
