import type { APIRoute } from "astro";
import { createClient } from "@/lib/supabase";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const supabase = createClient(context.request.headers, context.cookies);
  if (supabase) {
    // Local scope: ends only this browser's session; a global sign-out would also end every other reviewer's
    // session on the shared demo account (S-09) and every other device of a normal user.
    await supabase.auth.signOut({ scope: "local" });
  }
  return context.redirect("/");
};
