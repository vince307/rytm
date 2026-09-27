// Pure assembly of what `/patterns` and `/patterns/<key>` render (S-04), unit-testable without a DB. Both
// consume the same widened read (`loadPatterns`) and threshold read (`loadThresholds`); the reference month
// (S-04 Autonomous decision 2) is computed once here and shared between the list and every detail request so
// they never disagree.
import {
  appliesTo,
  byOccurredThenId,
  monthOf,
  overLimit,
  referenceMonth,
  type DatedTx,
} from "@/lib/patterns/over-limit";
import type { MerchantPattern, PatternSource, Threshold } from "@/types";

interface PatternTx extends DatedTx {
  counterparty: string;
  title: string;
}

/** Picks one pattern's own rows out of the full read's rows, by transaction id. Throws only if a pattern's
 * `transactionIds` and the rows it was derived from have drifted apart (a programming error, not real input). */
function patternTxs(pattern: MerchantPattern, byId: ReadonlyMap<string, PatternSource>): PatternTx[] {
  return pattern.transactionIds.map((id) => {
    const row = byId.get(id);
    if (!row) throw new Error(`pattern "${pattern.key}" references missing transaction "${id}"`);
    return {
      id,
      occurredOn: row.occurredOn,
      amountMinor: row.amountMinor,
      counterparty: row.counterparty,
      title: row.title,
    };
  });
}

function indexById(rows: readonly PatternSource[]): Map<string, PatternSource> {
  return new Map(rows.map((row) => [row.id, row]));
}

export interface PatternListOverviewItem {
  key: string;
  /** Only when the stored threshold's kind applies to this pattern's current type (S-04 decision 3). */
  threshold: Threshold | null;
  /** The reference month's over-limit sum for this pattern; 0 when there is no applicable threshold or nothing
   * is over. */
  overMinor: number;
}

/** What `/patterns` needs beyond the derived patterns themselves: each row's threshold (only when applicable)
 * and its reference-month over-limit sum (S-04 decision 10 — no month label on the list). */
export function listOverview(
  patterns: readonly MerchantPattern[],
  rows: readonly PatternSource[],
  thresholds: ReadonlyMap<string, Threshold>,
): { referenceMonth: string | null; items: PatternListOverviewItem[] } {
  const refMonth = referenceMonth(rows);
  const byId = indexById(rows);
  const items = patterns.map((pattern): PatternListOverviewItem => {
    const stored = thresholds.get(pattern.key) ?? null;
    const threshold = stored && appliesTo(stored, pattern.type) ? stored : null;
    if (!threshold || !refMonth) return { key: pattern.key, threshold, overMinor: 0 };
    const { byMonth } = overLimit(patternTxs(pattern, byId), threshold, pattern.type);
    return { key: pattern.key, threshold, overMinor: byMonth.get(refMonth) ?? 0 };
  });
  return { referenceMonth: refMonth, items };
}

export interface PatternDetailTransaction {
  id: string;
  occurredOn: string;
  counterparty: string;
  title: string;
  amountMinor: number;
  /** 0 when this transaction is not over the threshold. */
  overMinor: number;
}

export interface PatternDetailView {
  /** Months with at least one occurrence of this pattern, union the reference month, descending. */
  months: string[];
  /** `requestedMonth` when it is one of `months`, else the reference month (S-04 decision 14: the default month
   * is always the reference month, even for a pattern with no occurrences in it). */
  month: string | null;
  /** Only when the stored threshold's kind applies to this pattern's current type (S-04 decision 3). */
  threshold: Threshold | null;
  /** This month's sum, occurrence count and over-limit sum (0 for a month with no occurrences or no threshold). */
  sumMinor: number;
  count: number;
  overMinor: number;
  /** Chronological order (`occurredOn`, numeric `id`) — `true` where that transaction is over. */
  sequence: boolean[];
  /** The month's transactions, newest first (display order — the kit shows the latest occurrence on top; the
   * over-limit rule itself runs chronologically, before this reversal). */
  transactions: PatternDetailTransaction[];
}

/**
 * One pattern's detail: the month picker, the selected month's totals and over-limit sum, and its transactions.
 * `referenceMonth` is the value `listOverview` already computed for the same read — never recomputed here, so
 * the list and every detail request agree on "the" current month.
 */
export function patternDetail(
  pattern: MerchantPattern,
  rows: readonly PatternSource[],
  threshold: Threshold | null,
  refMonth: string | null,
  requestedMonth?: string | null,
): PatternDetailView {
  const byId = indexById(rows);
  const txs = patternTxs(pattern, byId);
  const applicable = threshold && appliesTo(threshold, pattern.type) ? threshold : null;
  const { byTx, byMonth } = overLimit(txs, applicable, pattern.type);

  const monthSet = new Set(txs.map((tx) => monthOf(tx.occurredOn)));
  if (refMonth) monthSet.add(refMonth);
  const months = [...monthSet].sort().reverse();

  const month = requestedMonth && months.includes(requestedMonth) ? requestedMonth : refMonth;

  const monthTxs = month ? txs.filter((tx) => monthOf(tx.occurredOn) === month) : [];
  const chronological = [...monthTxs].sort(byOccurredThenId);
  const sequence = chronological.map((tx) => byTx.has(tx.id));
  const transactions: PatternDetailTransaction[] = [...chronological].reverse().map((tx) => ({
    id: tx.id,
    occurredOn: tx.occurredOn,
    counterparty: tx.counterparty,
    title: tx.title,
    amountMinor: tx.amountMinor,
    overMinor: byTx.get(tx.id) ?? 0,
  }));

  return {
    months,
    month,
    threshold: applicable,
    sumMinor: monthTxs.reduce((sum, tx) => sum + tx.amountMinor, 0),
    count: monthTxs.length,
    overMinor: month ? (byMonth.get(month) ?? 0) : 0,
    sequence,
    transactions,
  };
}
