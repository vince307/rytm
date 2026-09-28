// Threshold read (FR-010/FR-011): the caller's own thresholds, keyed by merchant key. RLS scopes the rows to
// `user_id`, so no `.eq` is needed here (mirrors the transactions read).
import type { SupabaseClient } from "@supabase/supabase-js";

import { collectPages, PAGE_SIZE } from "@/lib/patterns/load";
import type { Database } from "@/db/database.types";
import type { Threshold, ThresholdKind } from "@/types";

const KINDS: readonly ThresholdKind[] = ["count", "sum", "amount"];

function isThresholdKind(kind: string): kind is ThresholdKind {
  return (KINDS as readonly string[]).includes(kind);
}

interface ThresholdRow {
  id: number;
  merchant_key: string;
  kind: string;
  value: number;
}

/**
 * One row per pattern the caller has set a threshold on. Paged by keyset like `loadPatterns` (S-04 F5: a crafted
 * flood of thresholds is self-inflicted — RLS scopes the rows — but the read must not silently truncate at
 * PostgREST's `max_rows` any more than the transactions read does). A row whose `kind` is not one of the three is
 * skipped; the DB check constraint makes that unreachable in practice, but the read stays defensive rather than
 * throwing on it.
 */
export async function loadThresholds(
  supabase: SupabaseClient<Database>,
): Promise<{ thresholds: Map<string, Threshold> } | { error: unknown }> {
  const result = await collectPages<ThresholdRow>(async (afterId) => {
    let query = supabase
      .from("pattern_thresholds")
      .select("id, merchant_key, kind, value")
      .order("id")
      .limit(PAGE_SIZE);
    if (afterId !== null) query = query.gt("id", afterId);
    const { data, error } = await query;
    return { rows: data ?? [], error };
  });
  if ("error" in result) return { error: result.error };
  const thresholds = new Map<string, Threshold>();
  for (const row of result.rows) {
    if (!isThresholdKind(row.kind)) continue;
    thresholds.set(row.merchant_key, { kind: row.kind, value: row.value });
  }
  return { thresholds };
}
