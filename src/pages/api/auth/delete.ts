import type { APIRoute } from "astro";
import { DEMO_EMAIL } from "astro:env/server";
import { z } from "zod";
import { createClient, verifyPassword } from "@/lib/supabase";
import { DELETE_CONFIRM_WORD } from "@/lib/auth-rules";
import { DEMO_ERROR, isDemoEmail } from "@/lib/demo";

export const prerender = false;

const schema = z.object({
  current: z.string().min(1),
  confirm: z
    .string()
    .trim()
    .refine((v) => v === DELETE_CONFIRM_WORD),
});

// Self-service account deletion (FR-019): the current password is verified first (the irreversible
// action is guarded at least as strongly as the reversible password change), then the
// `delete_own_account` RPC removes the auth.users row (Supabase cascades the identities and
// sessions) and the local cookies are cleared.
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
  // S-09: the demo account is shared and public — deleting it would take the demo away from every reviewer.
  if (isDemoEmail(user.email, DEMO_EMAIL)) {
    return context.redirect(DEMO_ERROR.delete);
  }
  const form = Object.fromEntries(await context.request.formData());
  const parsed = schema.safeParse(form);
  if (!parsed.success || !user.email) {
    return context.redirect("/settings?error=delete");
  }
  const verified = await verifyPassword(user.email, parsed.data.current);
  if (verified === null) {
    return context.redirect("/settings?error=delete");
  }
  if (!verified) {
    return context.redirect("/settings?error=delete-password");
  }
  const { error } = await supabase.rpc("delete_own_account");
  if (error) {
    // eslint-disable-next-line no-console -- server-side only; the runtime log is the one place this error is visible
    console.error("auth/delete failed", error.code, error.message);
    return context.redirect("/settings?error=delete");
  }
  await supabase.auth.signOut({ scope: "local" });
  return context.redirect("/login?deleted=1");
};
