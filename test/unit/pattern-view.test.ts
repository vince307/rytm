import { describe, expect, it } from "vitest";

import { listOverview, patternDetail } from "@/lib/patterns/view";
import type { MerchantPattern, PatternSource, Threshold } from "@/types";

// Fixture: three independent patterns sharing one read.
// - "wolt" (frequent): 2 occurrences in April, 3 in May — a count threshold of 2 flags the 3rd May occurrence.
// - "kawiarnia" (fixed): 1 occurrence in May — a stored `count` threshold does not apply to a fixed pattern.
// - "sklep" (frequent, no stored threshold): 1 occurrence in April only, so May (the reference month) has none.
const wolt: MerchantPattern = {
  key: "wolt",
  name: "Wolt",
  type: "frequent",
  occurrences: 5,
  sumMinor: 10000,
  medianMinor: 2000,
  fixedAmountMinor: null,
  transactionIds: ["1", "2", "10", "11", "12"],
  excluded: false,
  merged: [],
};
const kawiarnia: MerchantPattern = {
  key: "kawiarnia",
  name: "Kawiarnia",
  type: "fixed",
  occurrences: 1,
  sumMinor: 4550,
  medianMinor: 4550,
  fixedAmountMinor: 4550,
  transactionIds: ["4"],
  excluded: false,
  merged: [],
};
const sklep: MerchantPattern = {
  key: "sklep",
  name: "Sklep",
  type: "frequent",
  occurrences: 1,
  sumMinor: 1299,
  medianMinor: 1299,
  fixedAmountMinor: null,
  transactionIds: ["20"],
  excluded: false,
  merged: [],
};
const patterns: MerchantPattern[] = [wolt, kawiarnia, sklep];

const rows: PatternSource[] = [
  { id: "1", amountMinor: 2000, counterparty: "Wolt", title: "", occurredOn: "2026-04-01" },
  { id: "2", amountMinor: 2000, counterparty: "Wolt", title: "", occurredOn: "2026-04-02" },
  { id: "10", amountMinor: 2000, counterparty: "Wolt", title: "", occurredOn: "2026-05-01" },
  { id: "11", amountMinor: 2000, counterparty: "Wolt", title: "", occurredOn: "2026-05-10" },
  { id: "12", amountMinor: 2000, counterparty: "Wolt", title: "", occurredOn: "2026-05-20" },
  { id: "4", amountMinor: 4550, counterparty: "Kawiarnia", title: "", occurredOn: "2026-05-15" },
  { id: "20", amountMinor: 1299, counterparty: "Sklep", title: "", occurredOn: "2026-04-15" },
];

const thresholds = new Map<string, Threshold>([
  ["wolt", { kind: "count", value: 2 }],
  ["kawiarnia", { kind: "count", value: 2 }], // mismatched: fixed only takes `amount`
]);

describe("listOverview", () => {
  it("reference month is the latest calendar month across every pattern's rows", () => {
    expect(listOverview(patterns, rows, thresholds).referenceMonth).toBe("2026-05");
  });

  it("carries the applicable threshold and the reference month's over-limit sum", () => {
    const { items } = listOverview(patterns, rows, thresholds);
    const woltItem = items.find((i) => i.key === "wolt");
    expect(woltItem).toEqual({ key: "wolt", threshold: { kind: "count", value: 2 }, overMinor: 2000 });
  });

  it("a stored threshold whose kind does not apply to the pattern's type renders as no threshold", () => {
    const { items } = listOverview(patterns, rows, thresholds);
    expect(items.find((i) => i.key === "kawiarnia")).toEqual({ key: "kawiarnia", threshold: null, overMinor: 0 });
  });

  it("no stored threshold at all also yields null + 0, not an error", () => {
    const { items } = listOverview(patterns, rows, thresholds);
    expect(items.find((i) => i.key === "sklep")).toEqual({ key: "sklep", threshold: null, overMinor: 0 });
  });

  it("no rows at all yields a null reference month and 0 for every item", () => {
    const { referenceMonth, items } = listOverview(patterns, [], new Map());
    expect(referenceMonth).toBeNull();
    for (const item of items) expect(item.overMinor).toBe(0);
  });

  it("an excluded pattern keeps its applicable threshold but overMinor is 0, while the same pattern non-excluded is over (S-05)", () => {
    const woltExcluded: MerchantPattern = { ...wolt, key: "wolt-excluded", excluded: true };
    const withExcluded = [...patterns, woltExcluded];
    const withThresholds = new Map(thresholds).set("wolt-excluded", { kind: "count", value: 2 });
    const { items } = listOverview(withExcluded, rows, withThresholds);
    expect(items.find((i) => i.key === "wolt-excluded")).toEqual({
      key: "wolt-excluded",
      threshold: { kind: "count", value: 2 },
      overMinor: 0,
    });
    expect(items.find((i) => i.key === "wolt")?.overMinor).toBeGreaterThan(0);
  });
});

describe("patternDetail", () => {
  const refMonth = "2026-05";

  it("defaults to the reference month, with months chronological (descending) and totals for that month", () => {
    const detail = patternDetail(wolt, rows, thresholds.get("wolt") ?? null, refMonth);
    expect(detail.month).toBe("2026-05");
    expect(detail.months).toEqual(["2026-05", "2026-04"]);
    expect(detail.threshold).toEqual({ kind: "count", value: 2 });
    expect(detail.count).toBe(3);
    expect(detail.sumMinor).toBe(6000);
    expect(detail.overMinor).toBe(2000);
  });

  it("orders `sequence` chronologically but lists `transactions` newest first", () => {
    const detail = patternDetail(wolt, rows, thresholds.get("wolt") ?? null, refMonth);
    // Chronological: id 10 (05-01), 11 (05-10), 12 (05-20) — the count-2 threshold flags only the 3rd.
    expect(detail.sequence).toEqual([false, false, true]);
    expect(detail.transactions.map((t) => t.id)).toEqual(["12", "11", "10"]);
    expect(detail.transactions.map((t) => t.overMinor)).toEqual([2000, 0, 0]);
  });

  it("a requested month not present in `months` falls back to the reference month", () => {
    const detail = patternDetail(sklep, rows, null, refMonth, "2026-01");
    expect(detail.month).toBe(refMonth);
  });

  it("the reference month is the default even when this pattern has no occurrences in it", () => {
    const detail = patternDetail(sklep, rows, null, refMonth);
    expect(detail.month).toBe(refMonth);
    expect(detail.months).toEqual(["2026-05", "2026-04"]);
    expect(detail.count).toBe(0);
    expect(detail.sumMinor).toBe(0);
    expect(detail.overMinor).toBe(0);
    expect(detail.sequence).toEqual([]);
    expect(detail.transactions).toEqual([]);
  });

  it("a requested month that IS present in `months` is honoured", () => {
    const detail = patternDetail(sklep, rows, null, refMonth, "2026-04");
    expect(detail.month).toBe("2026-04");
    expect(detail.count).toBe(1);
    expect(detail.transactions).toHaveLength(1);
  });

  it("a mismatched stored threshold renders the detail as if there were none", () => {
    const detail = patternDetail(kawiarnia, rows, thresholds.get("kawiarnia") ?? null, refMonth);
    expect(detail.threshold).toBeNull();
    expect(detail.overMinor).toBe(0);
    expect(detail.transactions.every((t) => t.overMinor === 0)).toBe(true);
  });

  it("carries counterparty and title through to each transaction", () => {
    const detail = patternDetail(kawiarnia, rows, null, refMonth);
    expect(detail.transactions).toEqual([
      { id: "4", occurredOn: "2026-05-15", counterparty: "Kawiarnia", title: "", amountMinor: 4550, overMinor: 0 },
    ]);
  });

  it("an excluded pattern keeps its threshold but runs no over-limit pass (S-05)", () => {
    const woltExcluded: MerchantPattern = { ...wolt, key: "wolt-excluded", excluded: true };
    const detail = patternDetail(woltExcluded, rows, thresholds.get("wolt") ?? null, refMonth);
    expect(detail.threshold).toEqual({ kind: "count", value: 2 });
    expect(detail.overMinor).toBe(0);
    expect(detail.sequence.every((over) => !over)).toBe(true);
    expect(detail.transactions.every((t) => t.overMinor === 0)).toBe(true);
  });
});
