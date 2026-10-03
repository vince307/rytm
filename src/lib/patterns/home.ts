// `/home` stat-card summary (FR-013, US-05, FR-012, US-04 — S-07 Phase 3). Pure differences and sums over two
// already-computed pure results (`overLimitTrend`, `fixedOverview`) — no new rule, no second read of the rows.
//
// `overMinor` is the trend's last axis point (0 without months — the same "no rows" shape `overLimitTrend`
// returns). `previous` compares that point against `previousMonth(referenceMonth)` **only when that month is on
// the trend's axis** — the same gap rule `fixedOverview`'s `hasComparison` uses (S-06 D6, plan review F1): one
// month of data, or a gap month right before the reference month, hides the delta foot instead of printing a
// comparison against a month the app has no data for. There is no fixed-cost total any more (round 3 `/home`
// shows a summary, not a sum). `fixedRisen` ("Podrożały") counts only the rows whose amount went up
// (`deltaMinor > 0`) — a decrease is a `changed` row too but is never counted. `fixedNew` ("Nowe") is
// `fixed.new.length`; `fixedOverview` returns an empty `new` without a comparison month, so one month of data
// reads "0 kosztów", never "everything is new" (US-04 AC).
import { previousMonth } from "@/lib/patterns/over-limit";
import type { FixedOverview } from "@/lib/patterns/fixed";
import type { OverLimitTrend } from "@/lib/patterns/trend";

export interface HomeStats {
  overMinor: number;
  previous: { month: string; deltaMinor: number } | null;
  fixedRisen: number;
  fixedNew: number;
}

export function homeStats(trend: OverLimitTrend, fixed: FixedOverview): HomeStats {
  const last = trend.months.at(-1) ?? null;
  const overMinor = last?.overMinor ?? 0;

  let previous: HomeStats["previous"] = null;
  if (trend.referenceMonth && last) {
    const prevMonth = previousMonth(trend.referenceMonth);
    const prevEntry = trend.months.find((m) => m.month === prevMonth);
    if (prevEntry) previous = { month: prevMonth, deltaMinor: last.overMinor - prevEntry.overMinor };
  }

  const fixedRisen = fixed.changed.filter((row) => row.deltaMinor > 0).length;
  const fixedNew = fixed.new.length;

  return { overMinor, previous, fixedRisen, fixedNew };
}
