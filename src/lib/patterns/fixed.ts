// `/fixed` rule (FR-012, US-04, D6, S-06). Pure and DB-free, over the same read `/patterns` uses
// (`loadPatternData` → `MerchantPattern[]` + `PatternSource[]`) — S-07's `/home` stat card reuses this export
// rather than re-deriving it.
//
// R = `referenceMonth(rows)` (the maintainer binding: "w tym miesiącu" = the latest month present in the user's
// data, not the wall-clock calendar month — S-04/S-07). P = `previousMonth(R)`. `hasComparison` is true only when
// the user has *some* transaction (any pattern, any type, excluded or not) in P — a gap month between imports
// must not be read as "everything is new" (PRD US-04 AC).
//
// Candidates: patterns with `type === "fixed"` (after S-05 decisions — a pinned `fixed` counts, a pinned
// `frequent` does not) and not `excluded`, with at least one occurrence in R. A fixed pattern with none in R
// (lapsed) is in no section — "Bez zmian" implies charged this month. A rise large enough to flip a pattern to
// `frequent` (D5) simply leaves the candidate set — accepted (plan decision 7, `[human]` row 4.10).
//
// New (D6) wins over changed: charged in R, no occurrence in P, and P has a comparison at all. Otherwise the rule
// reports the **latest** occurrence in R whose amount differs from its immediate chronological predecessor (any
// month, not necessarily R) — a double charge in R where the *first* charge carries the rise is not hidden behind
// an unchanged second charge (plan Key Discoveries). No such occurrence → unchanged, at the latest amount in R.
import { byOccurredThenId, monthOf, previousMonth, referenceMonth } from "@/lib/patterns/over-limit";
import { indexById, patternTxs } from "@/lib/patterns/view";
import type { MerchantPattern, PatternSource } from "@/types";

export interface FixedChangedRow {
  key: string;
  name: string;
  occurredOn: string;
  amountMinor: number;
  previousMinor: number;
  deltaMinor: number;
}

export interface FixedNewRow {
  key: string;
  name: string;
  firstOccurredOn: string;
  amountMinor: number;
}

export interface FixedUnchangedRow {
  key: string;
  name: string;
  amountMinor: number;
}

export interface FixedOverview {
  referenceMonth: string | null;
  comparisonMonth: string | null;
  hasComparison: boolean;
  changed: FixedChangedRow[];
  new: FixedNewRow[];
  unchanged: FixedUnchangedRow[];
}

export function fixedOverview(patterns: readonly MerchantPattern[], rows: readonly PatternSource[]): FixedOverview {
  const refMonth = referenceMonth(rows);
  if (!refMonth) {
    return { referenceMonth: null, comparisonMonth: null, hasComparison: false, changed: [], new: [], unchanged: [] };
  }
  const comparisonMonth = previousMonth(refMonth);
  const hasComparison = rows.some((row) => monthOf(row.occurredOn) === comparisonMonth);

  const byId = indexById(rows);
  const changed: FixedChangedRow[] = [];
  const newRows: FixedNewRow[] = [];
  const unchanged: FixedUnchangedRow[] = [];

  for (const pattern of patterns) {
    if (pattern.type !== "fixed" || pattern.excluded) continue;

    const txs = [...patternTxs(pattern, byId)].sort(byOccurredThenId);
    const inR = txs.filter((tx) => monthOf(tx.occurredOn) === refMonth);
    if (inR.length === 0) continue; // lapsed — not charged in R

    if (hasComparison && !txs.some((tx) => monthOf(tx.occurredOn) === comparisonMonth)) {
      newRows.push({
        key: pattern.key,
        name: pattern.name,
        firstOccurredOn: inR[0].occurredOn,
        amountMinor: inR[inR.length - 1].amountMinor,
      });
      continue;
    }

    let change: FixedChangedRow | null = null;
    for (let i = 1; i < txs.length; i++) {
      const tx = txs[i];
      if (monthOf(tx.occurredOn) !== refMonth) continue;
      const prev = txs[i - 1];
      if (prev.amountMinor !== tx.amountMinor) {
        change = {
          key: pattern.key,
          name: pattern.name,
          occurredOn: tx.occurredOn,
          amountMinor: tx.amountMinor,
          previousMinor: prev.amountMinor,
          deltaMinor: tx.amountMinor - prev.amountMinor,
        };
      }
    }

    if (change) changed.push(change);
    else unchanged.push({ key: pattern.key, name: pattern.name, amountMinor: inR[inR.length - 1].amountMinor });
  }

  return { referenceMonth: refMonth, comparisonMonth, hasComparison, changed, new: newRows, unchanged };
}
