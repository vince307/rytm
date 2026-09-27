// Over-limit rule (FR-011, PRD Business Logic "Wynik"). Pure and deterministic: the same transactions and
// threshold always yield the same per-transaction and per-month over amounts, independent of input order
// (guardrail "determinizm"). Over amount is the *excess* part for `sum` / `amount` (the crossing transaction
// carries only what pushed the month over, later ones their full amount), and the full amount for `count`
// (S-04 Autonomous decision 1 — follows Business Logic "Wynik" over the literal US-01 AC wording).
import type { PatternType, Threshold } from "@/types";

/** What the rule needs from one transaction: its date and amount (grosze). */
export interface DatedTx {
  id: string;
  occurredOn: string;
  amountMinor: number;
}

/** `count` / `sum` apply to `frequent` patterns, `amount` to `fixed` (FR-010). */
export function appliesTo(threshold: Threshold, type: PatternType): boolean {
  return threshold.kind === "amount" ? type === "fixed" : type === "frequent";
}

/** `2026-05-20` → `2026-05` (plain string slice — `occurredOn` is always an ISO calendar date). */
export function monthOf(isoDate: string): string {
  return isoDate.slice(0, 7);
}

/** Latest calendar month across the rows, or `null` for no rows (S-04 Autonomous decision 2). Plain string
 * comparison is correct: `YYYY-MM` sorts lexicographically the same as chronologically. */
export function referenceMonth(rows: readonly { occurredOn: string }[]): string | null {
  let latest: string | null = null;
  for (const row of rows) {
    const month = monthOf(row.occurredOn);
    if (latest === null || month > latest) latest = month;
  }
  return latest;
}

/** Chronological order (S-04 decision 17): `(occurredOn, id)` ascending, `id` compared numerically — never as a
 * string, where `"10" < "9"`. Exported so `view.ts` orders a month's transactions the same way `overLimit` does
 * (the sequence marks and the over amounts must agree on which transaction is "first"). */
export const byOccurredThenId = (a: DatedTx, b: DatedTx): number => {
  if (a.occurredOn !== b.occurredOn) return a.occurredOn < b.occurredOn ? -1 : 1;
  const ai = BigInt(a.id);
  const bi = BigInt(b.id);
  return ai < bi ? -1 : ai > bi ? 1 : 0;
};

/** Per-transaction and per-month over amounts for one pattern's transactions against one threshold. Only
 * positive amounts are ever recorded (no zero entries). A `null` threshold, or one whose `kind` does not apply
 * to `type` (a stale threshold after a D5 type flip — S-04 Autonomous decision 3), yields empty maps. */
export function overLimit(
  txs: readonly DatedTx[],
  threshold: Threshold | null,
  type: PatternType,
): { byTx: Map<string, number>; byMonth: Map<string, number> } {
  const byTx = new Map<string, number>();
  const byMonth = new Map<string, number>();
  if (!threshold || !appliesTo(threshold, type)) return { byTx, byMonth };

  const byMonthTxs = new Map<string, DatedTx[]>();
  for (const tx of txs) {
    const month = monthOf(tx.occurredOn);
    const group = byMonthTxs.get(month);
    if (group) group.push(tx);
    else byMonthTxs.set(month, [tx]);
  }

  for (const [month, monthTxs] of byMonthTxs) {
    const sorted = [...monthTxs].sort(byOccurredThenId);
    let monthOver = 0;

    if (threshold.kind === "count") {
      sorted.forEach((tx, i) => {
        if (i >= threshold.value) {
          byTx.set(tx.id, tx.amountMinor);
          monthOver += tx.amountMinor;
        }
      });
    } else if (threshold.kind === "sum") {
      let running = 0;
      let crossed = false;
      for (const tx of sorted) {
        running += tx.amountMinor;
        if (crossed) {
          byTx.set(tx.id, tx.amountMinor);
          monthOver += tx.amountMinor;
        } else if (running > threshold.value) {
          const over = running - threshold.value;
          byTx.set(tx.id, over);
          monthOver += over;
          crossed = true;
        }
      }
    } else {
      for (const tx of sorted) {
        if (tx.amountMinor > threshold.value) {
          const over = tx.amountMinor - threshold.value;
          byTx.set(tx.id, over);
          monthOver += over;
        }
      }
    }

    if (monthOver > 0) byMonth.set(month, monthOver);
  }

  return { byTx, byMonth };
}
