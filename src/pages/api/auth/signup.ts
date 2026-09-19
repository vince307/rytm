import type { APIRoute } from "astro";
import { z } from "zod";
import { createClient } from "@/lib/supabase";

export const prerender = false;

const schema = z.object({
  email: z.string().trim().pipe(z.email()),
  password: z.string().min(6),
  name: z
    .string()
    .trim()
    .max(80)
    .optional()
    .transform((v) => v ?? undefined),
});

export const POST: APIRoute = async (context) => {
  const form = Object.fromEntries(await context.request.formData());
  const parsed = schema.safeParse(form);
  const supabase = createClient(context.request.headers, context.cookies);
  if (!parsed.success || !supabase) {
    return context.redirect("/register?error=1");
  }
  const { email, password, name } = parsed.data;
  const { error } = await supabase.auth.signUp({ email, password, options: name ? { data: { name } } : undefined });
  if (error) {
    return context.redirect("/register?error=1");
  }
  return context.redirect("/confirm-email");
};
