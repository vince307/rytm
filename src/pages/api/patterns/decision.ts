import type { APIRoute } from "astro";
import { createClient } from "@/lib/supabase";
import {
  decisionKeySchema,
  decisionRedirect,
  decisionSchema,
  parseDisplayName,
  validateMerge,
} from "@/lib/patterns/decision-form";
import { loadPatternData } from "@/lib/patterns/load";

export const prerender = false;

// Writes one durable pattern decision for the caller (FR-009/US-03). Mirrors src/pages/api/patterns/threshold.ts's
// guard / parse / log / redirect shape, but parses `key` alone first (decisionKeySchema) so a form that fails the
// action-specific schema still lands its error on the right pattern's detail (S-04 F4 lesson — never a silent
// redirect to /patterns once a key is in hand). Every write sends `merchant_key` plus only the one column the
// action changes, `onConflict: "user_id,merchant_key"` — never a full decision object, so untouched decisions on
// the same row survive (pgTAP + smoke "rename keeps the exclusion" prove the partial upsert). The client never
// sends `user_id` (column default `auth.uid()`). `merge` is the only action that reads: it needs the current
// roots to reject self-merge, an unknown/absorbed target, and an excluded target (S-04 decision 7 precedent — no
// such read for the other five actions).
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

  const keyParsed = decisionKeySchema.safeParse(form);
  if (!keyParsed.success) {
    return context.redirect("/patterns");
  }
  const { key } = keyParsed.data;

  const parsed = decisionSchema.safeParse(form);
  if (!parsed.success) {
    return context.redirect(decisionRedirect(key, "error-decision"));
  }
  const input = parsed.data;

  switch (input.action) {
    case "merge": {
      const read = await loadPatternData(supabase);
      if ("error" in read) {
        // eslint-disable-next-line no-console -- server-side only; the runtime log is the one place this error is visible
        console.error("pattern decision failed", "merge", "read", read.error);
        return context.redirect(decisionRedirect(key, "error-decision"));
      }
      if (!validateMerge(read.patterns, key, input.target)) {
        return context.redirect(decisionRedirect(key, "error-merge"));
      }
      const result = await supabase
        .from("pattern_decisions")
        .upsert({ merchant_key: key, merged_into: input.target }, { onConflict: "user_id,merchant_key" });
      if (result.error) {
        // eslint-disable-next-line no-console -- server-side only; the runtime log is the one place this error is visible
        console.error("pattern decision failed", "merge", result.error.code, result.error.message);
        return context.redirect(decisionRedirect(key, "error-decision"));
      }
      return context.redirect(decisionRedirect(input.target, "merged"));
    }
    case "unmerge": {
      const result = await supabase
        .from("pattern_decisions")
        .update({ merged_into: null })
        .eq("merchant_key", input.source);
      if (result.error) {
        // eslint-disable-next-line no-console -- server-side only; the runtime log is the one place this error is visible
        console.error("pattern decision failed", "unmerge", result.error.code, result.error.message);
        return context.redirect(decisionRedirect(key, "error-decision"));
      }
      return context.redirect(decisionRedirect(key, "unmerged"));
    }
    case "type": {
      const result = await supabase
        .from("pattern_decisions")
        .upsert({ merchant_key: key, pinned_type: input.type }, { onConflict: "user_id,merchant_key" });
      if (result.error) {
        // eslint-disable-next-line no-console -- server-side only; the runtime log is the one place this error is visible
        console.error("pattern decision failed", "type", result.error.code, result.error.message);
        return context.redirect(decisionRedirect(key, "error-decision"));
      }
      return context.redirect(decisionRedirect(key, "typed"));
    }
    case "rename": {
      const displayName = parseDisplayName(input.name);
      if (displayName === "invalid") {
        return context.redirect(decisionRedirect(key, "error-name"));
      }
      const result = await supabase
        .from("pattern_decisions")
        .upsert({ merchant_key: key, display_name: displayName }, { onConflict: "user_id,merchant_key" });
      if (result.error) {
        // eslint-disable-next-line no-console -- server-side only; the runtime log is the one place this error is visible
        console.error("pattern decision failed", "rename", result.error.code, result.error.message);
        return context.redirect(decisionRedirect(key, "error-decision"));
      }
      return context.redirect(decisionRedirect(key, "renamed"));
    }
    case "exclude": {
      const result = await supabase
        .from("pattern_decisions")
        .upsert({ merchant_key: key, excluded: true }, { onConflict: "user_id,merchant_key" });
      if (result.error) {
        // eslint-disable-next-line no-console -- server-side only; the runtime log is the one place this error is visible
        console.error("pattern decision failed", "exclude", result.error.code, result.error.message);
        return context.redirect(decisionRedirect(key, "error-decision"));
      }
      return context.redirect(decisionRedirect(key, "excluded"));
    }
    case "restore": {
      const result = await supabase
        .from("pattern_decisions")
        .upsert({ merchant_key: key, excluded: false }, { onConflict: "user_id,merchant_key" });
      if (result.error) {
        // eslint-disable-next-line no-console -- server-side only; the runtime log is the one place this error is visible
        console.error("pattern decision failed", "restore", result.error.code, result.error.message);
        return context.redirect(decisionRedirect(key, "error-decision", input.back));
      }
      return context.redirect(decisionRedirect(key, "restored", input.back));
    }
  }
};
