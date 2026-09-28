// `/home` stat-card summary (FR-013, US-05, FR-012, US-04 — S-07 Phase 3). Pure differences and sums over two
// already-computed pure results (`overLimitTrend`, `fixedOverview`) — no new rule, no second read of the rows.
//
// `overMinor` is the trend's last axis point (0 without months — the same "no rows" shape `overLimitTrend`
// returns). `previous` compares that point against `previousMonth(referenceMonth)` **only when that month is on
// the trend's axis** — the same gap rule `fixedOverview`'s `hasComparison` uses (S-06 D6, plan review F1): one
// month of data, or a gap month right before the reference month, hides the delta foot instead of printing a
// comparison against a month the app has no data for. `fixedTotalMinor` sums the `amountMinor` of every row
// `/fixed` lists for the reference month (`changed` + `new` + `unchanged` — the S-06 plan's "Koszty stałe" value,
// decision 6, `[human]` row 4.11: includes one-off merchants D5 types `fixed`, plan review F3). `fixedRisen`
// counts only the rows whose amount went up (`deltaMinor > 0`), verbatim the S-06 follow-up formula — a decrease
// is a `changed` row too but is never counted as "podrożała".
import { previousMonth } from "@/lib/patterns/over-limit";
import type { FixedOverview } from "@/lib/patterns/fixed";
import type { OverLimitTrend } from "@/lib/patterns/trend";

export interface HomeStats {
  overMinor: number;
  previous: { month: string; deltaMinor: number } | null;
  fixedTotalMinor: number;
  fixedRisen: number;
}

const sumAmounts = (rows: readonly { amountMinor: number }[]): number =>
  rows.reduce((sum, row) => sum + row.amountMinor, 0);

export function homeStats(trend: OverLimitTrend, fixed: FixedOverview): HomeStats {
  const last = trend.months.at(-1) ?? null;
  const overMinor = last?.overMinor ?? 0;

  let previous: HomeStats["previous"] = null;
  if (trend.referenceMonth && last) {
    const prevMonth = previousMonth(trend.referenceMonth);
    const prevEntry = trend.months.find((m) => m.month === prevMonth);
    if (prevEntry) previous = { month: prevMonth, deltaMinor: last.overMinor - prevEntry.overMinor };
  }

  const fixedTotalMinor = sumAmounts(fixed.changed) + sumAmounts(fixed.new) + sumAmounts(fixed.unchanged);
  const fixedRisen = fixed.changed.filter((row) => row.deltaMinor > 0).length;

  return { overMinor, previous, fixedTotalMinor, fixedRisen };
}
