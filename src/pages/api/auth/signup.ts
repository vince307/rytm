import type { APIRoute } from "astro";
import { z } from "zod";
import { createClient } from "@/lib/supabase";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth-rules";

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
  // dashboard Site URL: production, previews and local dev each get their own. PKCE: Supabase confirms
  // the e-mail on /verify and lands on /login?code=…; the code is not exchanged (see G19) — sign in with the password.
  const emailRedirectTo = new URL("/login", context.url.origin).toString();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo, ...(name ? { data: { name } } : {}) },
  });
  if (error) {
    return context.redirect("/register?error=1");
  }
  return context.redirect("/confirm-email");
};
