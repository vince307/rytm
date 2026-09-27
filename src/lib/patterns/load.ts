// Reads every debit of the signed-in user (RLS scopes the rows) and derives the merchant patterns.
// PostgREST caps a response at `max_rows` (1000 locally and on hosted Supabase), so a plain select would silently
// truncate and break "every transaction counts once" (FR-007). The loop pages by keyset (`id > afterId`), not
// offset (S-03 follow-up F2): an import deleted mid-read shifts an offset page and silently skips or repeats rows,
// but a keyset page is unaffected — a gap in the id sequence is simply not returned, never duplicated. There is
// therefore no `count` query to compare against (it would no longer detect anything a keyset read could miss).
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/db/database.types";
import { derivePatterns } from "@/lib/patterns/derive";
import type { MerchantPattern, PatternSource } from "@/types";

export const PAGE_SIZE = 1000;

/** Hard cap on the number of pages a single read may take, so a server that never returns an empty page (a bug,
 * not real data — `max_rows` is far below this many pages of debits) fails loudly instead of looping forever. */
export const MAX_PAGES = 1000;

/**
 * Pages through `fetchPage(afterId)`: `null` on the first call, then the previous page's last row's `id`. Stops on
 * the first empty page — a short page (below `PAGE_SIZE`) is **not** the end, since a server cap can sit below it;
 * only an empty page means there is nothing left. Any error fails the whole read: no partial list. More than
 * `MAX_PAGES` pages without an empty one is treated as an error rather than looping forever.
 */
export async function collectPages<T extends { id: number }>(
  fetchPage: (afterId: number | null) => Promise<{ rows: T[]; error: unknown }>,
): Promise<{ rows: T[] } | { error: unknown }> {
  const rows: T[] = [];
  let afterId: number | null = null;
  for (let page = 0; page < MAX_PAGES; page++) {
    const result = await fetchPage(afterId);
    if (result.error) return { error: result.error };
    if (result.rows.length === 0) return { rows };
    rows.push(...result.rows);
    afterId = result.rows[result.rows.length - 1].id;
  }
  return { error: new Error("patterns read exceeded MAX_PAGES without an empty page") };
}

interface TransactionSourceRow {
  id: number;
  amount_minor: number;
  counterparty: string;
  title: string;
  occurred_on: string;
}

/** One read serves both the list and the detail (S-04): the widened select carries `occurred_on` for the
 * over-limit rule, and the raw rows (`PatternSource[]`, keyed by transaction id) are returned alongside the
 * derived patterns so a detail view can pick its own pattern's transactions out of the same read. */
export async function loadPatterns(
  supabase: SupabaseClient<Database>,
): Promise<{ patterns: MerchantPattern[]; rows: PatternSource[] } | { error: unknown }> {
  const result = await collectPages<TransactionSourceRow>(async (afterId) => {
    let query = supabase
      .from("transactions")
      .select("id, amount_minor, counterparty, title, occurred_on")
      .order("id")
      .limit(PAGE_SIZE);
    if (afterId !== null) query = query.gt("id", afterId);
    const { data, error } = await query;
    return { rows: data ?? [], error };
  });
  if ("error" in result) return { error: result.error };
  const rows: PatternSource[] = result.rows.map((row) => ({
    id: String(row.id),
    amountMinor: row.amount_minor,
    counterparty: row.counterparty,
    title: row.title,
    occurredOn: row.occurred_on,
  }));
  return { patterns: derivePatterns(rows), rows };
}
