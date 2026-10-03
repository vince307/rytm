import type { PatternListItem } from "@/types";

export const PATTERNS_PAGE_SIZE = 10;

export type PatternSort = "sum" | "count" | "name";

/** Search, sort, then page — in that order, so „Pokaż więcej” reveals the rest of the same sorted, filtered list. */
export function listView<T extends PatternListItem>(
  rows: readonly T[],
  term: string,
  sort: PatternSort,
  expanded: boolean,
): { shown: T[]; total: number; hasMore: boolean } {
  const needle = term.toLowerCase();
  // The input order is the tie-breaker (stable sort), so equal sums/counts keep the server's order.
  const list = rows.filter((p) => p.name.toLowerCase().includes(needle));
  if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name, "pl"));
  else if (sort === "count") list.sort((a, b) => b.occurrences - a.occurrences);
  else list.sort((a, b) => b.sumMinor - a.sumMinor);
  const total = list.length;
  return {
    shown: expanded ? list : list.slice(0, PATTERNS_PAGE_SIZE),
    total,
    hasMore: !expanded && total > PATTERNS_PAGE_SIZE,
  };
}
