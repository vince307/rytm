import type { APIRoute } from "astro";
import { z } from "zod";
import { createClient } from "@/lib/supabase";

export const prerender = false;

const schema = z.object({ email: z.string().trim().pipe(z.email()), password: z.string().min(1) });

export const POST: APIRoute = async (context) => {
  const form = Object.fromEntries(await context.request.formData());
  const parsed = schema.safeParse(form);
  const supabase = createClient(context.request.headers, context.cookies);
  if (!parsed.success || !supabase) {
    return context.redirect("/login?error=1");
  }
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return context.redirect("/login?error=1");
  }
  return context.redirect("/home");
};
