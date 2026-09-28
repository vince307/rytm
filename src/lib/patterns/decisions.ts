// Durable pattern decisions read (FR-009/US-03): the caller's own decisions, keyed by merchant key. RLS scopes
// the rows to `user_id`, so no `.eq` is needed here (mirrors the transactions and threshold reads). Paged by
// keyset like `loadPatterns` (S-04 F5 precedent) — a flood of decisions is self-inflicted (RLS-scoped), but the
// read must not silently truncate at PostgREST's `max_rows` any more than the transactions read does.
import type { SupabaseClient } from "@supabase/supabase-js";

import { collectPages, PAGE_SIZE } from "@/lib/patterns/load";
import type { Database } from "@/db/database.types";
import type { PatternDecision, PatternType } from "@/types";

const PINNED_TYPES: readonly PatternType[] = ["fixed", "frequent"];

function isPinnedType(kind: string): kind is PatternType {
  return (PINNED_TYPES as readonly string[]).includes(kind);
}

interface DecisionRow {
  id: number;
  merchant_key: string;
  merged_into: string | null;
  excluded: boolean;
  pinned_type: string | null;
  display_name: string | null;
}

/**
 * One row per `(user_id, merchant_key)` decision the caller has made — merge target, exclusion, pinned type,
 * display name. A `pinned_type` outside the two known kinds is read as `null` (defensive, as `loadThresholds`
 * skips unknown kinds; the DB check constraint makes it unreachable in practice).
 */
export async function loadDecisions(
  supabase: SupabaseClient<Database>,
): Promise<{ decisions: Map<string, PatternDecision> } | { error: unknown }> {
  const result = await collectPages<DecisionRow>(async (afterId) => {
    let query = supabase
      .from("pattern_decisions")
      .select("id, merchant_key, merged_into, excluded, pinned_type, display_name")
      .order("id")
      .limit(PAGE_SIZE);
    if (afterId !== null) query = query.gt("id", afterId);
    const { data, error } = await query;
    return { rows: data ?? [], error };
  });
  if ("error" in result) return { error: result.error };
  const decisions = new Map<string, PatternDecision>();
  for (const row of result.rows) {
    decisions.set(row.merchant_key, {
      mergedInto: row.merged_into,
      excluded: row.excluded,
      pinnedType: row.pinned_type && isPinnedType(row.pinned_type) ? row.pinned_type : null,
      displayName: row.display_name,
    });
  }
  return { decisions };
}
