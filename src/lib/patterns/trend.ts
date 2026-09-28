// The `/home` monthly "ponad progiem" trend (FR-013, US-05, S-07). One pure aggregate over the same read
// `listOverview` uses: for every non-excluded pattern with a threshold applicable to its current type
// (`applicableThreshold`, `view.ts`), sum `overLimit(...).byMonth` into a month map — always against *today's*
// thresholds (FR-013 "według dzisiejszych progów"; nothing per-month is stored, so a threshold change or removal
// moves every month on the next read, historical months included). An excluded pattern contributes nothing to any
// month (S-05 decision 9 / [human] 7.9), matching `listOverview`.
//
// Axis = the distinct calendar months present in the data (`monthOf` over *all* rows, excluded patterns' rows
// included — the axis asks "did anything happen this month", not "is anything over"), sorted ascending; its last
// entry is the reference month (maintainer binding: "w tym miesiącu" = the latest month in the data). A calendar
// month with no row is not on the axis — plan review F1 overturned a continuous zero-filled range: a gap month is
// unknown, not "0 zł ponad progiem", and a zero-fill would bias the secondary success criterion ("czy suma
// maleje") and contradict `fixedOverview`'s own gap rule (S-06 D6) on the same page. Every axis month with no
// entry in the summed map is `0` (US-05 AC 2 — a month with data and nothing over, not a missing value).
//
// Invariant this module must keep: `months.at(-1).overMinor === Σ listOverview(patterns, rows, thresholds).items[]
// .overMinor` — the trend's last point and `/patterns`' figures are the same sum read two ways (unit test 11).
import { applicableThreshold, indexById, patternTxs } from "@/lib/patterns/view";
import { monthOf, overLimit } from "@/lib/patterns/over-limit";
import type { MerchantPattern, PatternSource, Threshold } from "@/types";

export interface TrendMonth {
  month: string;
  overMinor: number;
}

export interface OverLimitTrend {
  referenceMonth: string | null;
  months: TrendMonth[];
  /** `true` when at least one non-excluded pattern has a threshold applicable to its current type — distinguishes
   * "every month is legitimately 0" from "no threshold is set anywhere" (the `/home` hint, Phase 2). */
  hasThreshold: boolean;
}

/** The monthly "ponad progiem" trend over every month present in the data. No rows → an empty trend. */
export function overLimitTrend(
  patterns: readonly MerchantPattern[],
  rows: readonly PatternSource[],
  thresholds: ReadonlyMap<string, Threshold>,
): OverLimitTrend {
  const axis = [...new Set(rows.map((row) => monthOf(row.occurredOn)))].sort();
  if (axis.length === 0) return { referenceMonth: null, months: [], hasThreshold: false };

  const byId = indexById(rows);
  const totals = new Map<string, number>();
  let hasThreshold = false;

  for (const pattern of patterns) {
    if (pattern.excluded) continue;
    const threshold = applicableThreshold(pattern, thresholds);
    if (!threshold) continue;
    hasThreshold = true;
    const { byMonth } = overLimit(patternTxs(pattern, byId), threshold, pattern.type);
    for (const [month, overMinor] of byMonth) {
      totals.set(month, (totals.get(month) ?? 0) + overMinor);
    }
  }

  const months = axis.map((month) => ({ month, overMinor: totals.get(month) ?? 0 }));
  return { referenceMonth: axis[axis.length - 1], months, hasThreshold };
}

/** Bar height as a percentage of the panel's max (kit `trendChart()`): `0` for a `0` value (rendered as a 2 px
 * stub so the month stays visibly present on the axis), otherwise at least 12 % so a small non-zero sum is still
 * visible, scaled linearly to `max`. `max === 0` never divides (every value is 0 too, so the branch above already
 * returns 0). */
export function trendBarHeight(value: number, max: number): number {
  if (value === 0 || max === 0) return 0;
  return Math.max(12, (value / max) * 100);
}
