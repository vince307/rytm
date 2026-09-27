// Threshold read (FR-010/FR-011): the caller's own thresholds, keyed by merchant key. RLS scopes the rows to
// `user_id`, so no `.eq` is needed here (mirrors the transactions read).
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/db/database.types";
import type { Threshold, ThresholdKind } from "@/types";

const KINDS: readonly ThresholdKind[] = ["count", "sum", "amount"];

function isThresholdKind(kind: string): kind is ThresholdKind {
  return (KINDS as readonly string[]).includes(kind);
}

/**
 * One row per pattern the caller has set a threshold on — at most a few dozen for a real user, far below
 * PostgREST's `max_rows`, so this does not page (S-04 Known risks: a crafted flood of thresholds could exceed it,
 * but RLS keeps that self-inflicted). A row whose `kind` is not one of the three is skipped; the DB check
 * constraint makes that unreachable in practice, but the read stays defensive rather than throwing on it.
 */
export async function loadThresholds(
  supabase: SupabaseClient<Database>,
): Promise<{ thresholds: Map<string, Threshold> } | { error: unknown }> {
  const { data, error } = await supabase.from("pattern_thresholds").select("merchant_key, kind, value");
  if (error) return { error };
  const thresholds = new Map<string, Threshold>();
  for (const row of data) {
    if (!isThresholdKind(row.kind)) continue;
    thresholds.set(row.merchant_key, { kind: row.kind, value: row.value });
  }
  return { thresholds };
}
