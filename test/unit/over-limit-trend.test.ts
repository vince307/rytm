import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { buildImportPayload, parseIngStatement } from "@/lib/import/ing";
import { derivePatterns } from "@/lib/patterns/derive";
import { overLimitTrend, trendBarHeight } from "@/lib/patterns/trend";
import { listOverview } from "@/lib/patterns/view";
import type { MerchantPattern, PatternSource, Threshold } from "@/types";

// Crafted-row cases (plan Phase 1, contract 5, numbered 1-13) plus the F-02 fixture (case 13). Rows/patterns use
// the same shape `pattern-view.test.ts` / `fixed-overview.test.ts` use.
const row = (id: string, occurredOn: string, amountMinor: number): PatternSource => ({
  id,
  occurredOn,
  amountMinor,
  counterparty: "",
  title: "",
});

function pattern(key: string, transactionIds: string[], overrides: Partial<MerchantPattern> = {}): MerchantPattern {
  return {
    key,
    name: overrides.name ?? key,
    type: overrides.type ?? "frequent",
    occurrences: transactionIds.length,
    sumMinor: 0,
    medianMinor: 0,
    fixedAmountMinor: null,
    transactionIds,
    excluded: overrides.excluded ?? false,
    merged: [],
  };
}

const count = (value: number): Threshold => ({ kind: "count", value });
const sum = (value: number): Threshold => ({ kind: "sum", value });

describe("overLimitTrend — crafted rows", () => {
  it("case 1: no rows — empty trend", () => {
    expect(overLimitTrend([], [], new Map())).toEqual({ referenceMonth: null, months: [], hasThreshold: false });
  });

  it("case 2: rows, no thresholds — every axis month 0, no threshold anywhere", () => {
    const rows = [row("1", "2026-06-01", 1000), row("2", "2026-07-01", 2000)];
    const patterns = [pattern("p", ["1", "2"])];
    const result = overLimitTrend(patterns, rows, new Map());
    expect(result.referenceMonth).toBe("2026-07");
    expect(result.months).toEqual([
      { month: "2026-06", overMinor: 0 },
      { month: "2026-07", overMinor: 0 },
    ]);
    expect(result.hasThreshold).toBe(false);
  });

  it("case 3: count 1 — historical months filled, not only the reference month", () => {
    const rows = [
      row("1", "2026-06-05", 1000),
      row("2", "2026-06-10", 2000),
      row("3", "2026-06-15", 3000),
      row("4", "2026-07-05", 500),
      row("5", "2026-08-05", 700),
      row("6", "2026-08-10", 800),
    ];
    const patterns = [pattern("p", ["1", "2", "3", "4", "5", "6"])];
    const thresholds = new Map<string, Threshold>([["p", count(1)]]);
    const result = overLimitTrend(patterns, rows, thresholds);
    expect(result.months).toEqual([
      { month: "2026-06", overMinor: 5000 },
      { month: "2026-07", overMinor: 0 },
      { month: "2026-08", overMinor: 800 },
    ]);
    expect(result.hasThreshold).toBe(true);
  });

  it("case 4: a changed threshold moves historical months (US-05)", () => {
    const rows = [
      row("1", "2026-06-05", 1000),
      row("2", "2026-06-10", 2000),
      row("3", "2026-06-15", 3000),
      row("4", "2026-07-05", 500),
      row("5", "2026-08-05", 700),
      row("6", "2026-08-10", 800),
    ];
    const patterns = [pattern("p", ["1", "2", "3", "4", "5", "6"])];
    const thresholds = new Map<string, Threshold>([["p", count(2)]]);
    const result = overLimitTrend(patterns, rows, thresholds);
    const byMonth = new Map(result.months.map((m) => [m.month, m.overMinor]));
    expect(byMonth.get("2026-06")).toBe(3000);
    expect(byMonth.get("2026-08")).toBe(0);
  });

  it("case 5: two patterns sum per month; removing one threshold zeroes only that pattern", () => {
    const rows = [
      row("a1", "2026-06-05", 300),
      row("a2", "2026-06-10", 400),
      row("b1", "2026-06-01", 100),
      row("b2", "2026-06-20", 200),
    ];
    const patterns = [pattern("a", ["a1", "a2"]), pattern("b", ["b1", "b2"])];
    const both = overLimitTrend(
      patterns,
      rows,
      new Map<string, Threshold>([
        ["a", count(1)],
        ["b", count(1)],
      ]),
    );
    expect(both.months).toEqual([{ month: "2026-06", overMinor: 600 }]);

    const onlyA = overLimitTrend(patterns, rows, new Map<string, Threshold>([["a", count(1)]]));
    expect(onlyA.months).toEqual([{ month: "2026-06", overMinor: 400 }]);
  });

  it("case 6: sum threshold — the crossing transaction contributes only its excess", () => {
    const rows = [row("1", "2026-06-01", 600), row("2", "2026-06-15", 700)];
    const patterns = [pattern("p", ["1", "2"])];
    const thresholds = new Map<string, Threshold>([["p", sum(1000)]]);
    const result = overLimitTrend(patterns, rows, thresholds);
    expect(result.months).toEqual([{ month: "2026-06", overMinor: 300 }]);
  });

  it("case 7: an excluded pattern contributes nothing; hasThreshold false when it is the only one", () => {
    const rows = [row("1", "2026-06-05", 1000), row("2", "2026-06-10", 1500), row("3", "2026-07-05", 2000)];
    const patterns = [pattern("p", ["1", "2", "3"], { excluded: true })];
    const thresholds = new Map<string, Threshold>([["p", count(1)]]);
    const result = overLimitTrend(patterns, rows, thresholds);
    expect(result.months).toEqual([
      { month: "2026-06", overMinor: 0 },
      { month: "2026-07", overMinor: 0 },
    ]);
    expect(result.hasThreshold).toBe(false);
  });

  it("case 8: an inapplicable threshold (count on a fixed pattern) contributes nothing; hasThreshold false", () => {
    const rows = [row("1", "2026-06-05", 1000), row("2", "2026-06-10", 1500)];
    const patterns = [pattern("p", ["1", "2"], { type: "fixed" })];
    const thresholds = new Map<string, Threshold>([["p", count(1)]]);
    const result = overLimitTrend(patterns, rows, thresholds);
    expect(result.months).toEqual([{ month: "2026-06", overMinor: 0 }]);
    expect(result.hasThreshold).toBe(false);
  });

  it("case 9: a calendar month with no row is absent from the axis (gap)", () => {
    const rows = [row("1", "2026-05-05", 1000), row("2", "2026-07-05", 2000)];
    const result = overLimitTrend([], rows, new Map());
    expect(result.months.map((m) => m.month)).toEqual(["2026-05", "2026-07"]);
  });

  it("case 9b: the axis crosses a year boundary in chronological order", () => {
    const rows = [
      row("1", "2025-11-05", 100),
      row("2", "2025-12-05", 100),
      row("3", "2026-01-05", 100),
      row("4", "2026-02-05", 100),
    ];
    const result = overLimitTrend([], rows, new Map());
    expect(result.months.map((m) => m.month)).toEqual(["2025-11", "2025-12", "2026-01", "2026-02"]);
  });

  it("case 10: the axis starts at an excluded pattern's earliest row", () => {
    const rows = [row("1", "2026-03-05", 1000), row("2", "2026-05-05", 2000)];
    const patterns = [pattern("p", ["1"], { excluded: true })];
    const result = overLimitTrend(patterns, rows, new Map());
    expect(result.months.map((m) => m.month)).toEqual(["2026-03", "2026-05"]);
  });

  it("case 11: the last month equals the sum of listOverview's reference-month figures (invariant)", () => {
    const rows = [
      row("a1", "2026-06-01", 300),
      row("a2", "2026-08-05", 1600),
      row("a3", "2026-08-06", 900),
      row("b1", "2026-06-10", 500),
      row("b2", "2026-08-10", 2200),
      row("c1", "2026-07-01", 900),
      row("c2", "2026-08-15", 900),
      row("d1", "2026-08-20", 100),
    ];
    const patterns = [
      pattern("a", ["a1", "a2", "a3"]), // thresholded — over-limit in the reference month
      pattern("b", ["b1", "b2"], { excluded: true }), // excluded
      pattern("c", ["c1", "c2"], { type: "fixed" }), // inapplicable threshold
      pattern("d", ["d1"]), // no threshold
    ];
    const thresholds = new Map<string, Threshold>([
      ["a", count(1)],
      ["b", count(1)],
      ["c", count(1)],
    ]);
    const trend = overLimitTrend(patterns, rows, thresholds);
    const overview = listOverview(patterns, rows, thresholds);
    expect(trend.referenceMonth).toBe(overview.referenceMonth);
    const last = trend.months.at(-1);
    expect(last?.month).toBe(overview.referenceMonth);
    const overviewSum = overview.items.reduce((total, item) => total + item.overMinor, 0);
    expect(last?.overMinor).toBe(overviewSum);
    expect(overviewSum).toBe(900);
  });
});

describe("trendBarHeight", () => {
  it.each([
    [0, 0, 0],
    [0, 500, 0],
    [10, 1000, 12],
    [500, 1000, 50],
    [1000, 1000, 100],
  ])("(%i, %i) → %i", (value, max, height) => {
    expect(trendBarHeight(value, max)).toBe(height);
  });
});

describe("overLimitTrend — F-02 fixture (case 13)", () => {
  const FIXTURES = new URL("../fixtures/ing/", import.meta.url);
  const MAIN = "Lista_transakcji_nr_0000123456_010926.csv";
  const MAIN_ACCOUNT = "11111100000000000000000001";

  function fixtureSources(): PatternSource[] {
    const result = parseIngStatement(new Uint8Array(readFileSync(new URL(MAIN, FIXTURES))));
    if (!result.ok) throw new Error(result.error);
    return buildImportPayload(result.statement, MAIN_ACCOUNT).transactions.map((t) => ({
      id: t.bankTxId,
      amountMinor: t.amountMinor,
      counterparty: t.counterparty,
      title: t.title,
      occurredOn: t.occurredOn,
    }));
  }

  const MONTHS = [
    "2025-09",
    "2025-10",
    "2025-11",
    "2025-12",
    "2026-01",
    "2026-02",
    "2026-03",
    "2026-04",
    "2026-05",
    "2026-06",
    "2026-07",
    "2026-08",
  ];

  function zeroMonths(overrides: Record<string, number>): { month: string; overMinor: number }[] {
    return MONTHS.map((month) => ({ month, overMinor: overrides[month] ?? 0 }));
  }

  it("the axis is the fixture's 12 consecutive months, reference month 2026-08", () => {
    const rows = fixtureSources();
    const result = overLimitTrend([], rows, new Map());
    expect(result.months.map((m) => m.month)).toEqual(MONTHS);
    expect(result.referenceMonth).toBe("2026-08");
  });

  it("kino światło count 1", () => {
    const rows = fixtureSources();
    const patterns = derivePatterns(rows);
    expect(patterns.some((p) => p.key === "kino światło")).toBe(true);
    const thresholds = new Map<string, Threshold>([["kino światło", count(1)]]);
    const result = overLimitTrend(patterns, rows, thresholds);
    expect(result.months).toEqual(zeroMonths({ "2025-10": 4913, "2026-05": 13347, "2026-06": 4124, "2026-07": 8759 }));
  });

  it("kino światło count 2", () => {
    const rows = fixtureSources();
    const patterns = derivePatterns(rows);
    const thresholds = new Map<string, Threshold>([["kino światło", count(2)]]);
    const result = overLimitTrend(patterns, rows, thresholds);
    expect(result.months).toEqual(zeroMonths({ "2026-05": 9822, "2026-07": 5198 }));
  });

  it("kino światło and stacja paliw drogowskaz, both count 1", () => {
    const rows = fixtureSources();
    const patterns = derivePatterns(rows);
    expect(patterns.some((p) => p.key === "stacja paliw drogowskaz")).toBe(true);
    const thresholds = new Map<string, Threshold>([
      ["kino światło", count(1)],
      ["stacja paliw drogowskaz", count(1)],
    ]);
    const result = overLimitTrend(patterns, rows, thresholds);
    expect(result.months).toEqual(
      zeroMonths({
        "2025-09": 28688,
        "2025-10": 4913,
        "2026-05": 13347,
        "2026-06": 4124,
        "2026-07": 30899,
        "2026-08": 95534,
      }),
    );
  });

  it("pizzeria trzy sery, sum 5000", () => {
    const rows = fixtureSources();
    const patterns = derivePatterns(rows);
    expect(patterns.some((p) => p.key === "pizzeria trzy sery")).toBe(true);
    const thresholds = new Map<string, Threshold>([["pizzeria trzy sery", sum(5000)]]);
    const result = overLimitTrend(patterns, rows, thresholds);
    expect(result.months).toEqual(
      zeroMonths({
        "2025-11": 5444,
        "2026-03": 479,
        "2026-04": 1755,
        "2026-05": 4910,
        "2026-06": 6012,
        "2026-08": 1707,
      }),
    );
  });
});
