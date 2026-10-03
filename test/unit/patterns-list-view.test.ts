import { describe, expect, it } from "vitest";

import { listView, PATTERNS_PAGE_SIZE } from "@/lib/patterns/list-view";
import type { PatternListItem } from "@/types";

const rows = (n: number): PatternListItem[] =>
  Array.from({ length: n }, (_, i) => ({
    key: `k${i}`,
    name: `Sklep ${String.fromCharCode(97 + (n - i))}${i}`,
    type: "fixed",
    occurrences: 3,
    sumMinor: (n - i) * 1000,
    fixedAmountMinor: null,
    threshold: null,
    overMinor: 0,
    excluded: false,
  }));

describe("listView", () => {
  it("has a page size of 10", () => {
    expect(PATTERNS_PAGE_SIZE).toBe(10);
  });

  it.each([
    [9, 9, false],
    [10, 10, false],
    [11, 10, true],
  ])("%i rows: shows %i, hasMore %s", (n, shown, hasMore) => {
    const v = listView(rows(n), "", "sum", false);
    expect(v.shown).toHaveLength(shown);
    expect(v.total).toBe(n);
    expect(v.hasMore).toBe(hasMore);
  });

  it("expanded shows every row and no button", () => {
    const v = listView(rows(12), "", "sum", true);
    expect(v.shown).toHaveLength(12);
    expect(v.hasMore).toBe(false);
  });

  it("empty input", () => {
    expect(listView([], "", "sum", false)).toEqual({ shown: [], total: 0, hasMore: false });
  });

  it("a search match that is last by sum is shown, total counts the filtered list", () => {
    const r = rows(12);
    r[11] = { ...r[11], name: "Unikat" };
    const v = listView(r, "unikat", "sum", false);
    expect(v.shown.map((p) => p.name)).toEqual(["Unikat"]);
    expect(v.total).toBe(1);
    expect(v.hasMore).toBe(false);
  });

  it("sort by name over 12 rows shows the first 10 by name, not by input order", () => {
    const r = rows(12);
    const v = listView(r, "", "name", false);
    const sorted = [...r].sort((a, b) => a.name.localeCompare(b.name, "pl")).slice(0, 10);
    expect(v.shown.map((p) => p.key)).toEqual(sorted.map((p) => p.key));
    expect(v.shown.map((p) => p.key)).not.toEqual(r.slice(0, 10).map((p) => p.key));
  });
});
