import { describe, expect, it } from "vitest";

import type { FixedOverview } from "@/lib/patterns/fixed";
import { deltaText, fixedNotices } from "@/lib/patterns/fixed-view";

const row = {};
const overview = (o: Partial<FixedOverview>): FixedOverview =>
  ({
    referenceMonth: "2026-06",
    comparisonMonth: "2026-05",
    hasComparison: true,
    changed: [row],
    new: [row],
    unchanged: [row],
    ...o,
  }) as FixedOverview;

describe("fixedNotices", () => {
  it("without a comparison month says only noComparison (plus unchangedEmpty when unchanged is empty)", () => {
    expect(fixedNotices(overview({ hasComparison: false, changed: [], new: [] }))).toEqual({
      noComparison: true,
      noChanges: false,
      noNew: false,
      unchangedEmpty: false,
    });
    expect(fixedNotices(overview({ hasComparison: false, changed: [], new: [], unchanged: [] })).unchangedEmpty).toBe(
      true,
    );
  });
  it("with a comparison, flags each empty section", () => {
    expect(fixedNotices(overview({ changed: [] })).noChanges).toBe(true);
    expect(fixedNotices(overview({ new: [] })).noNew).toBe(true);
    expect(fixedNotices(overview({ unchanged: [] })).unchangedEmpty).toBe(true);
  });
  it("with rows everywhere flags nothing", () => {
    expect(fixedNotices(overview({}))).toEqual({
      noComparison: false,
      noChanges: false,
      noNew: false,
      unchangedEmpty: false,
    });
  });
});

describe("deltaText", () => {
  const words = { increase: "wzrost", decrease: "spadek" };
  it("suffixes a rise", () => {
    expect(deltaText(150, words)).toBe("+1,50 zł · wzrost");
  });
  it("suffixes a drop with U+2212", () => {
    expect(deltaText(-500, words)).toBe("−5,00 zł · spadek");
  });
});
