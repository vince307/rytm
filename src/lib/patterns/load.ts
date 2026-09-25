// Reads every debit of the signed-in user (RLS scopes the rows) and derives the merchant patterns.
// PostgREST caps a response at `max_rows` (1000 locally and on hosted Supabase), so a plain select would silently
// truncate and break "every transaction counts once" (FR-007). The loop pages until the exact count is reached.
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/db/database.types";
import { derivePatterns } from "@/lib/patterns/derive";
import type { MerchantPattern } from "@/types";

export const PAGE_SIZE = 1000;

export interface Page<T> {
  rows: T[];
  count: number | null;
  error: unknown;
}

/**
 * Pages through `fetchPage(from, to)` (inclusive range). The offset advances by the rows actually returned — never
 * assume a short page is the last one (a server cap below PAGE_SIZE would truncate). Stops once the collected rows
 * reach the first page's `count`, or on an empty page. Any error fails the whole read: no partial list.
 */
export async function collectPages<T>(
  fetchPage: (from: number, to: number) => Promise<Page<T>>,
): Promise<{ rows: T[] } | { error: unknown }> {
  const rows: T[] = [];
  let total: number | null = null;
  for (;;) {
    const page = await fetchPage(rows.length, rows.length + PAGE_SIZE - 1);
    if (page.error) return { error: page.error };
    total ??= page.count;
    if (page.rows.length === 0) return { rows };
    rows.push(...page.rows);
    if (total !== null && rows.length >= total) return { rows };
  }
}

export async function loadPatterns(
  supabase: SupabaseClient<Database>,
): Promise<{ patterns: MerchantPattern[] } | { error: unknown }> {
  const result = await collectPages(async (from, to) => {
    const { data, count, error } = await supabase
      .from("transactions")
      .select("id, amount_minor, counterparty, title", { count: "exact" })
      .order("id")
      .range(from, to);
    return { rows: data ?? [], count, error };
  });
  if ("error" in result) return { error: result.error };
  return {
    patterns: derivePatterns(
      result.rows.map((row) => ({
        id: String(row.id),
        amountMinor: row.amount_minor,
        counterparty: row.counterparty,
        title: row.title,
      })),
    ),
  };
}
