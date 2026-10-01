import type { APIRoute } from "astro";
import { z } from "zod";
import { DEMO_EMAIL } from "astro:env/server";
import { createClient } from "@/lib/supabase";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth-rules";
import { DEMO_ERROR, isDemoEmail } from "@/lib/demo";

export const prerender = false;

const schema = z
  .object({ password: z.string().min(MIN_PASSWORD_LENGTH), confirm: z.string() })
  .refine((v) => v.password === v.confirm);

// Sets the new password for the session /auth/callback created from the recovery link, then ends
// that session: the user signs in again with the new password (kit: success → "Zaloguj się").
export const POST: APIRoute = async (context) => {
  const form = Object.fromEntries(await context.request.formData());
  const parsed = schema.safeParse(form);
  const supabase = createClient(context.request.headers, context.cookies);
  if (!parsed.success || !supabase) {
    return context.redirect("/reset/new?error=1");
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return context.redirect("/reset/new?state=expired");
  }
  // S-09: the demo account is shared and public — any signed-in session reaches this form, so a new password
  // here would lock every other reviewer out just like /api/auth/password.
  if (isDemoEmail(user.email, DEMO_EMAIL)) {
    return context.redirect(DEMO_ERROR.resetNew);
  }
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    // eslint-disable-next-line no-console -- server-side only; the runtime log is the one place this error is visible
    console.error("auth/reset/new failed", error.status, error.code, error.message);
    return context.redirect("/reset/new?error=1");
  }
  await supabase.auth.signOut();
  return context.redirect("/reset/new?success=1");
};
