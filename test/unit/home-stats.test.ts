import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { buildImportPayload, parseIngStatement } from "@/lib/import/ing";
import { derivePatterns } from "@/lib/patterns/derive";
import { fixedOverview, type FixedOverview } from "@/lib/patterns/fixed";
import { homeStats } from "@/lib/patterns/home";
import { overLimitTrend } from "@/lib/patterns/trend";
import type { OverLimitTrend, TrendMonth } from "@/lib/patterns/trend";
import type { PatternSource, Threshold } from "@/types";

// Crafted-input cases (plan Phase 3, contract 5, numbered 1-4) plus the F-02 fixture (case 5). `homeStats` is pure
// over two already-computed pure results, so the trend/`FixedOverview` inputs below are hand-built literals —
// there is no second rule to re-derive.
const trendOf = (months: TrendMonth[], hasThreshold = true): OverLimitTrend => ({
  referenceMonth: months.length > 0 ? months[months.length - 1].month : null,
  months,
  hasThreshold,
});

const emptyFixed: FixedOverview = {
  referenceMonth: null,
  comparisonMonth: null,
  hasComparison: false,
  changed: [],
  new: [],
  unchanged: [],
};

describe("homeStats — crafted inputs", () => {
  it("case 1: empty trend + empty overview", () => {
    const result = homeStats(trendOf([], false), emptyFixed);
    expect(result).toEqual({ overMinor: 0, previous: null, fixedTotalMinor: 0, fixedRisen: 0 });
  });

  it("case 2: one month of data — no previous", () => {
    const trend = trendOf([{ month: "2026-05", overMinor: 1000 }]);
    const result = homeStats(trend, emptyFixed);
    expect(result.overMinor).toBe(1000);
    expect(result.previous).toBeNull();
  });

  it.each([
    ["rise", 5000, 5150, 150],
    ["drop", 8759, 0, -8759],
    ["equal", 300, 300, 0],
  ])("case 3 (%s): two consecutive months — signed delta against the reference month", (_label, prev, last, delta) => {
    const trend = trendOf([
      { month: "2026-06", overMinor: prev },
      { month: "2026-07", overMinor: last },
    ]);
    const result = homeStats(trend, emptyFixed);
    expect(result.overMinor).toBe(last);
    expect(result.previous).toEqual({ month: "2026-06", deltaMinor: delta });
  });

  it("case 3b: a gap month before the reference month — no previous", () => {
    const trend = trendOf([
      { month: "2026-05", overMinor: 1000 },
      { month: "2026-07", overMinor: 2000 },
    ]);
    const result = homeStats(trend, emptyFixed);
    expect(result.overMinor).toBe(2000);
    expect(result.previous).toBeNull();
  });

  it("case 4: fixed total sums every row, only rises count toward fixedRisen", () => {
    const fixed: FixedOverview = {
      referenceMonth: "2026-06",
      comparisonMonth: "2026-05",
      hasComparison: true,
      changed: [
        { key: "a", name: "a", occurredOn: "2026-06-05", amountMinor: 5150, previousMinor: 5000, deltaMinor: 150 },
        { key: "b", name: "b", occurredOn: "2026-06-10", amountMinor: 2000, previousMinor: 3000, deltaMinor: -1000 },
      ],
      new: [{ key: "c", name: "c", firstOccurredOn: "2026-06-15", amountMinor: 900 }],
      unchanged: [{ key: "d", name: "d", amountMinor: 1200 }],
    };
    const result = homeStats(trendOf([]), fixed);
    expect(result.fixedRisen).toBe(1);
    expect(result.fixedTotalMinor).toBe(5150 + 2000 + 900 + 1200);
  });
});

describe("homeStats — F-02 fixture (case 5)", () => {
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

  it("kino światło count 1 — reference-month over-limit, previous-month delta, fixed total and rises", () => {
    const rows = fixtureSources();
    const patterns = derivePatterns(rows);
    const thresholds = new Map<string, Threshold>([["kino światło", { kind: "count", value: 1 }]]);
    const trend = overLimitTrend(patterns, rows, thresholds);
    const fixed = fixedOverview(patterns, rows);
    const result = homeStats(trend, fixed);
    expect(result.overMinor).toBe(0);
    expect(result.previous).toEqual({ month: "2026-07", deltaMinor: -8759 });
    expect(result.fixedTotalMinor).toBe(175298);
    expect(result.fixedRisen).toBe(1);
  });
});
