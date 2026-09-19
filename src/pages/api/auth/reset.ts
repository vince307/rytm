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
    await supabase.auth.resetPasswordForEmail(parsed.data.email, { redirectTo });
  }
  return context.redirect("/reset?sent=1");
};
