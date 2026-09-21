import type { APIRoute } from "astro";
import { z } from "zod";
import { createClient } from "@/lib/supabase";
import { MIN_PASSWORD_LENGTH, PENDING_EMAIL_COOKIE, PENDING_EMAIL_MAX_AGE } from "@/lib/auth-rules";

export const prerender = false;

const schema = z.object({
  email: z.string().trim().pipe(z.email()),
  password: z.string().min(MIN_PASSWORD_LENGTH),
  name: z
    .string()
    .trim()
    .max(80)
    .optional()
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty trimmed string must also become undefined, not just null/undefined
    .transform((v) => v || undefined),
});

export const POST: APIRoute = async (context) => {
  const form = Object.fromEntries(await context.request.formData());
  const parsed = schema.safeParse(form);
  const supabase = createClient(context.request.headers, context.cookies);
  if (!parsed.success || !supabase) {
    return context.redirect("/register?error=1");
  }
  const { email, password, name } = parsed.data;
  // Derived from the request origin (like reset.ts) so the confirmation link never depends on the
  // dashboard Site URL: production, previews and local dev each get their own. The link lands on
  // /auth/callback, which exchanges the PKCE code for a session and continues to /home.
  const emailRedirectTo = new URL("/auth/callback?next=/home", context.url.origin).toString();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo, ...(name ? { data: { name } } : {}) },
  });
  if (error) {
    if (error.code === "user_already_exists") {
      return context.redirect("/register?error=occupied");
    }
    // Status + message only (no e-mail): an SMTP failure surfaces here as "Error sending confirmation email".
    // eslint-disable-next-line no-console -- server-side only; the runtime log is the one place this error is visible
    console.error("auth/signup failed", error.status, error.code, error.message);
    return context.redirect("/register?error=1");
  }
  // With e-mail confirmations on, Supabase answers an existing address with a placeholder user
  // (no identities) instead of an error, so the response cannot be used to enumerate accounts.
  if (data.user && data.user.identities?.length === 0) {
    return context.redirect("/register?error=occupied");
  }
  context.cookies.set(PENDING_EMAIL_COOKIE, email, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: context.url.protocol === "https:",
    maxAge: PENDING_EMAIL_MAX_AGE,
  });
  return context.redirect("/confirm-email");
};
