import type { APIRoute } from "astro";
import { createClient } from "@/lib/supabase";
import { thresholdDeleteSchema, thresholdRedirect } from "@/lib/patterns/threshold-form";

export const prerender = false;

// Removes the caller's threshold for one pattern (FR-010); same guard / parse / log shape as
// src/pages/api/imports/delete.ts. Idempotent by design (S-04 Autonomous decision 8): a delete of an already-absent
// threshold still returns no error and redirects to `removed` — nothing is lost, and the page renders the true
// post-delete state ("brak ustawionego progu") either way.
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
    return context.redirect("/patterns");
  }
  const parsed = thresholdDeleteSchema.safeParse(form);
  if (!parsed.success) {
    return context.redirect("/patterns");
  }
  const { key, month } = parsed.data;

  const result = await supabase.from("pattern_thresholds").delete().eq("merchant_key", key);
  if (result.error) {
    // eslint-disable-next-line no-console -- server-side only; the runtime log is the one place this error is visible
    console.error("threshold delete failed", result.error.code, result.error.message);
    return context.redirect(thresholdRedirect(key, "error-save", month));
  }
  return context.redirect(thresholdRedirect(key, "removed", month));
};
