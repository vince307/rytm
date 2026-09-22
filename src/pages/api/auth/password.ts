import type { APIRoute } from "astro";
import { z } from "zod";
import { createClient, createStatelessClient } from "@/lib/supabase";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth-rules";

export const prerender = false;

const schema = z
  .object({
    current: z.string().min(1),
    password: z.string().min(MIN_PASSWORD_LENGTH),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm);

// Changes the signed-in user's password after verifying the current one. The check runs on a
// stateless client so the session cookies stay untouched and the user remains signed in.
export const POST: APIRoute = async (context) => {
  const supabase = createClient(context.request.headers, context.cookies);
  if (!supabase) {
    return context.redirect("/login");
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return context.redirect("/login");
  }
  const form = Object.fromEntries(await context.request.formData());
  const parsed = schema.safeParse(form);
  const verifier = createStatelessClient();
  if (!parsed.success || !verifier || !user.email) {
    return context.redirect("/settings?error=password");
  }
  const { error: currentError } = await verifier.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.current,
  });
  if (currentError) {
    return context.redirect("/settings?error=current-password");
  }
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    // eslint-disable-next-line no-console -- server-side only; the runtime log is the one place this error is visible
    console.error("auth/password failed", error.status, error.code, error.message);
    return context.redirect("/settings?error=password");
  }
  return context.redirect("/settings?password=changed");
};
