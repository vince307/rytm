import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { buildImportPayload, parseIngStatement } from "@/lib/import/ing";
import { derivePatterns } from "@/lib/patterns/derive";
import { fixedOverview } from "@/lib/patterns/fixed";
import type { MerchantPattern, PatternSource } from "@/types";

// Crafted-row cases (plan Phase 2, contract 5, numbered 1-15) plus the F-02 fixture (case 16). Rows/patterns are
// built with the same shape `pattern-view.test.ts` uses; `previousMinor` / `deltaMinor` are always relative to the
// occurrence directly before the reported one, in any month (the double-charge rule).
const row = (id: string, occurredOn: string, amountMinor: number): PatternSource => ({
  id,
  occurredOn,
  amountMinor,
  counterparty: "",
  title: "",
});

function fixedPattern(
  key: string,
  transactionIds: string[],
  overrides: Partial<MerchantPattern> = {},
): MerchantPattern {
  return {
    key,
    name: overrides.name ?? key,
    type: overrides.type ?? "fixed",
    occurrences: transactionIds.length,
    sumMinor: 0,
    medianMinor: 0,
    fixedAmountMinor: null,
    transactionIds,
    excluded: overrides.excluded ?? false,
    merged: [],
  };
}

describe("fixedOverview — crafted rows", () => {
  it("case 1: US-04 rise in tolerance is reported as changed", () => {
    const rows = [row("1", "2026-07-20", 4300), row("2", "2026-08-20", 4900)];
    const patterns = [fixedPattern("netflix", ["1", "2"])];
    const result = fixedOverview(patterns, rows);
    expect(result.changed).toEqual([
      {
        key: "netflix",
        name: "netflix",
        occurredOn: "2026-08-20",
        amountMinor: 4900,
        previousMinor: 4300,
        deltaMinor: 600,
      },
    ]);
    expect(result.new).toEqual([]);
    expect(result.unchanged).toEqual([]);
  });

  it("case 2: a decrease is reported with a negative delta", () => {
    const rows = [row("1", "2026-07-15", 5599), row("2", "2026-08-15", 5099)];
    const patterns = [fixedPattern("p", ["1", "2"])];
    const result = fixedOverview(patterns, rows);
    expect(result.changed).toEqual([
      { key: "p", name: "p", occurredOn: "2026-08-15", amountMinor: 5099, previousMinor: 5599, deltaMinor: -500 },
    ]);
  });

  it("case 3: an unchanged amount lands only in unchanged", () => {
    const rows = [row("1", "2026-07-08", 2499), row("2", "2026-08-08", 2499)];
    const patterns = [fixedPattern("p", ["1", "2"])];
    const result = fixedOverview(patterns, rows);
    expect(result.unchanged).toEqual([{ key: "p", name: "p", amountMinor: 2499 }]);
    expect(result.changed).toEqual([]);
    expect(result.new).toEqual([]);
  });

  it("case 4: double charge, rise on the first — reported at the first", () => {
    const rows = [row("1", "2026-07-05", 4300), row("2", "2026-08-01", 4900), row("3", "2026-08-20", 4900)];
    const patterns = [fixedPattern("p", ["1", "2", "3"])];
    const result = fixedOverview(patterns, rows);
    expect(result.changed).toEqual([
      { key: "p", name: "p", occurredOn: "2026-08-01", amountMinor: 4900, previousMinor: 4300, deltaMinor: 600 },
    ]);
  });

  it("case 5: double charge, rise on the second — reported at the second", () => {
    const rows = [row("1", "2026-07-05", 4300), row("2", "2026-08-01", 4300), row("3", "2026-08-20", 4900)];
    const patterns = [fixedPattern("p", ["1", "2", "3"])];
    const result = fixedOverview(patterns, rows);
    expect(result.changed).toEqual([
      { key: "p", name: "p", occurredOn: "2026-08-20", amountMinor: 4900, previousMinor: 4300, deltaMinor: 600 },
    ]);
  });

  it("case 6: up then down inside R — the latest change wins", () => {
    const rows = [row("1", "2026-07-05", 4300), row("2", "2026-08-01", 4900), row("3", "2026-08-20", 4300)];
    const patterns = [fixedPattern("p", ["1", "2", "3"])];
    const result = fixedOverview(patterns, rows);
    expect(result.changed).toEqual([
      { key: "p", name: "p", occurredOn: "2026-08-20", amountMinor: 4300, previousMinor: 4900, deltaMinor: -600 },
    ]);
  });

  it("case 7: charged only in R, with a comparison month — new", () => {
    const rows = [row("1", "2026-08-05", 12900), row("x", "2026-07-01", 100)];
    const patterns = [fixedPattern("p", ["1"])];
    const result = fixedOverview(patterns, rows);
    expect(result.new).toEqual([{ key: "p", name: "p", firstOccurredOn: "2026-08-05", amountMinor: 12900 }]);
    expect(result.changed).toEqual([]);
    expect(result.unchanged).toEqual([]);
  });

  it("case 8: new wins over changed when the pattern has no occurrence in P", () => {
    const rows = [row("1", "2026-05-10", 3900), row("2", "2026-08-10", 4500), row("x", "2026-07-01", 100)];
    const patterns = [fixedPattern("p", ["1", "2"])];
    const result = fixedOverview(patterns, rows);
    expect(result.new).toEqual([{ key: "p", name: "p", firstOccurredOn: "2026-08-10", amountMinor: 4500 }]);
    expect(result.changed).toEqual([]);
  });

  it("case 9: no comparison month (gap) — nothing new, candidates fall to changed / unchanged", () => {
    const rows = [row("1", "2026-05-10", 3900), row("2", "2026-08-10", 4500), row("3", "2026-08-15", 7000)];
    const patterns = [fixedPattern("pA", ["1", "2"]), fixedPattern("pB", ["3"])];
    const result = fixedOverview(patterns, rows);
    expect(result.hasComparison).toBe(false);
    expect(result.comparisonMonth).toBe("2026-07");
    expect(result.new).toEqual([]);
    expect(result.changed).toEqual([
      { key: "pA", name: "pA", occurredOn: "2026-08-10", amountMinor: 4500, previousMinor: 3900, deltaMinor: 600 },
    ]);
    expect(result.unchanged).toEqual([{ key: "pB", name: "pB", amountMinor: 7000 }]);
  });

  it("case 10: one month of data — nothing new, every candidate unchanged", () => {
    const rows = [row("1", "2026-08-05", 1000)];
    const patterns = [fixedPattern("p", ["1"])];
    const result = fixedOverview(patterns, rows);
    expect(result.hasComparison).toBe(false);
    expect(result.new).toEqual([]);
    expect(result.changed).toEqual([]);
    expect(result.unchanged).toEqual([{ key: "p", name: "p", amountMinor: 1000 }]);
  });

  it("case 11: excluded / frequent are in no section; a pinned-fixed out-of-tolerance rise is reported", () => {
    const rows = [
      row("1", "2026-07-01", 4300),
      row("2", "2026-08-01", 9999),
      row("3", "2026-07-02", 1000),
      row("4", "2026-08-02", 5000),
      row("5", "2026-07-03", 2000),
      row("6", "2026-08-03", 20000),
    ];
    const patterns = [
      fixedPattern("excludedFixed", ["1", "2"], { excluded: true }),
      fixedPattern("freq", ["3", "4"], { type: "frequent" }),
      fixedPattern("pinned", ["5", "6"]),
    ];
    const result = fixedOverview(patterns, rows);
    expect(result.changed.map((r) => r.key)).toEqual(["pinned"]);
    expect(result.new).toEqual([]);
    expect(result.unchanged).toEqual([]);
  });

  it("case 12: a fixed pattern not charged in R (lapsed) is in no section", () => {
    const rows = [row("1", "2026-06-10", 1000), row("x", "2026-08-01", 1)];
    const patterns = [fixedPattern("lapsed", ["1"])];
    const result = fixedOverview(patterns, rows);
    expect(result.changed).toEqual([]);
    expect(result.new).toEqual([]);
    expect(result.unchanged).toEqual([]);
  });

  it("case 13: no rows — referenceMonth null, every section empty", () => {
    expect(fixedOverview([], [])).toEqual({
      referenceMonth: null,
      comparisonMonth: null,
      hasComparison: false,
      changed: [],
      new: [],
      unchanged: [],
    });
  });

  it("case 14: same-day tiebreak by numeric id, order-independent", () => {
    const rows = [row("1", "2026-07-10", 4300), row("9", "2026-08-20", 4300), row("10", "2026-08-20", 4900)];
    const patterns = [fixedPattern("tie", ["1", "9", "10"])];
    const shuffled = [fixedPattern("tie", ["10", "1", "9"])];
    const expected = [
      { key: "tie", name: "tie", occurredOn: "2026-08-20", amountMinor: 4900, previousMinor: 4300, deltaMinor: 600 },
    ];
    expect(fixedOverview(patterns, rows).changed).toEqual(expected);
    expect(fixedOverview(shuffled, [...rows].reverse()).changed).toEqual(expected);
  });

  it("case 15: section order follows the patterns order, not a re-sort", () => {
    const rows = [
      row("1", "2026-07-01", 100),
      row("2", "2026-08-01", 200),
      row("3", "2026-07-02", 100),
      row("4", "2026-08-02", 200),
    ];
    const patterns = [fixedPattern("zzz", ["1", "2"]), fixedPattern("aaa", ["3", "4"])];
    const result = fixedOverview(patterns, rows);
    expect(result.changed.map((r) => r.key)).toEqual(["zzz", "aaa"]);
  });
});

describe("fixedOverview — F-02 fixture (case 16)", () => {
  const FIXTURES = new URL("../fixtures/ing/", import.meta.url);
  const MAIN = "Lista_transakcji_nr_0000123456_010926.csv";
  const MAIN_ACCOUNT = "11111100000000000000000001";

  function fixtureSources(): PatternSource[] {
    const result = parseIngStatement(new Uint8Array(readFileSync(new URL(MAIN, FIXTURES))));
    if (!result.ok) throw new Error(result.error);
    return buildImportPayload(result.statement, MAIN_ACCOUNT).transactions.map((t) => ({
      // ING always carries a bankTxId (S-10 widened the type to string | null only for Santander, rule 7).
      id: t.bankTxId ?? "",
      amountMinor: t.amountMinor,
      counterparty: t.counterparty,
      title: t.title,
      occurredOn: t.occurredOn,
    }));
  }

  // `derivePatterns` keys on `merchantKey` (the normalized display name, lower-cased) — not `expected.json`'s
  // hand-authored oracle slugs (`test/unit/patterns.test.ts` header comment). T16's counterparty normalizes to
  // "SIŁOWNIA RUCH" and T08's ("przelew-konto-osobiste" in the oracle) to "JAN PRZYKŁADOWY" (the sender's name,
  // address stripped) — both confirmed against this fixture's actual `derivePatterns` output.
  it("reports kinoteka changed, silownia-ruch new, and the other fixed patterns unchanged or absent", () => {
    const rows = fixtureSources();
    const patterns = derivePatterns(rows);
    const result = fixedOverview(patterns, rows);

    expect(result.referenceMonth).toBe("2026-08");
    expect(result.hasComparison).toBe(true);

    expect(result.changed).toEqual([
      {
        key: "kinoteka",
        name: "KINOTEKA",
        occurredOn: "2026-08-17",
        amountMinor: 5999,
        previousMinor: 5599,
        deltaMinor: 400,
      },
    ]);

    expect(result.new).toEqual([
      { key: "siłownia ruch", name: "SIŁOWNIA RUCH", firstOccurredOn: "2026-08-05", amountMinor: 12900 },
    ]);

    const unchangedKeys = result.unchanged.map((r) => r.key).sort();
    expect(unchangedKeys).toEqual(["jan przykładowy", "kawa-testowa.pl", "muzykalnia"]);

    const reported = new Set([
      ...result.changed.map((r) => r.key),
      ...result.new.map((r) => r.key),
      ...result.unchanged.map((r) => r.key),
    ]);
    expect(reported.has("kurs-przyklad.pl")).toBe(false);
    expect(reported.has('phu "przykład" jan testowy')).toBe(false);
  });
});
