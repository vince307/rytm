import type { APIRoute } from "astro";
import { createClient } from "@/lib/supabase";
import { deleteImportRedirect, deleteImportSchema } from "@/lib/import/delete";

export const prerender = false;

// Deletes one of the caller's own imports (S-02, FR-004): the RLS "delete own" policy scopes the delete and
// the transactions_import_account_fkey cascade removes its transactions atomically. Mirrors
// src/pages/api/auth/delete.ts POST for the guard, form parsing and logging shape.
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

  let form: Record<string, FormDataEntryValue>;
  try {
    form = Object.fromEntries(await context.request.formData());
  } catch {
    return context.redirect("/imports?error=missing");
  }
  const parsed = deleteImportSchema.safeParse(form);
  if (!parsed.success) {
    return context.redirect("/imports?error=missing");
  }

  const result = await supabase.from("imports").delete().eq("id", parsed.data.id).select("id");
  if (result.error) {
    // eslint-disable-next-line no-console -- server-side only; the runtime log is the one place this error is visible
    console.error("imports delete failed", result.error.code, result.error.message);
  }
  return context.redirect(deleteImportRedirect(result));
};
