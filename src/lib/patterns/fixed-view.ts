// /fixed presentation rules, apart from the page so they are unit-testable (smoke data never reaches "a comparison
// month with no change"). One message per state: without a comparison month `changed` and `new` are necessarily empty
// (S-06 D6), so `noChanges` / `noNew` would be a second, misleading message next to `noComparison`.
import { formatSignedMoney } from "@/lib/format";
import type { FixedOverview } from "@/lib/patterns/fixed";

export interface FixedNotices {
  noComparison: boolean;
  noChanges: boolean;
  noNew: boolean;
  unchangedEmpty: boolean;
}

export function fixedNotices(overview: FixedOverview): FixedNotices {
  const { hasComparison } = overview;
  return {
    noComparison: !hasComparison,
    noChanges: hasComparison && overview.changed.length === 0,
    noNew: hasComparison && overview.new.length === 0,
    unchangedEmpty: overview.unchanged.length === 0,
  };
}

/** `+1,50 zł · wzrost` / `−5,00 zł · spadek` — the signed delta plus its word, so direction is not colour alone. */
export function deltaText(deltaMinor: number, words: { increase: string; decrease: string }): string {
  return `${formatSignedMoney(deltaMinor)} · ${deltaMinor > 0 ? words.increase : words.decrease}`;
}
