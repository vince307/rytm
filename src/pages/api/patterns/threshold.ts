import type { APIRoute } from "astro";
import { createClient } from "@/lib/supabase";
import { parseThresholdValue, thresholdRedirect, thresholdSaveSchema } from "@/lib/patterns/threshold-form";

export const prerender = false;

// Saves (upserts) the caller's threshold for one pattern (FR-010). Mirrors src/pages/api/imports/delete.ts's
// guard / parse / log / redirect shape. The client never sends `user_id` (column default `auth.uid()`); the
// upsert conflicts on `(user_id, merchant_key)` so re-saving the same pattern changes the row in place instead
// of duplicating it (S-04 Critical Implementation Details — "Upsert"). No server-side check that `kind` matches
// the pattern's current D5 type (S-04 Autonomous decision 7) — the evaluator ignores a mismatched kind instead.
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
  const parsed = thresholdSaveSchema.safeParse(form);
  if (!parsed.success) {
    return context.redirect("/patterns");
  }
  const { key, kind, value: rawValue, month } = parsed.data;

  const value = parseThresholdValue(kind, rawValue);
  if (value === null) {
    return context.redirect(thresholdRedirect(key, "error-value", month));
  }

  const result = await supabase
    .from("pattern_thresholds")
    .upsert({ merchant_key: key, kind, value }, { onConflict: "user_id,merchant_key" });
  if (result.error) {
    // eslint-disable-next-line no-console -- server-side only; the runtime log is the one place this error is visible
    console.error("threshold save failed", result.error.code, result.error.message);
    return context.redirect(thresholdRedirect(key, "error-save", month));
  }
  return context.redirect(thresholdRedirect(key, "saved", month));
};
