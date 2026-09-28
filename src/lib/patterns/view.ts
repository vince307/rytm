// Pure assembly of what `/patterns` and `/patterns/<key>` render (S-04), unit-testable without a DB. Both
// consume the same widened read (`loadPatternData`); the reference month (S-04 Autonomous decision 2) is always
// `referenceMonth(rows)` over the caller's full read — the list (`listOverview`) and the detail page
// (`[...key].astro`) each call it on the same rows, so they never disagree.
// S-05: an excluded pattern keeps its stored/applicable threshold (the panel still shows it) but generates no
// "ponad próg" anywhere — `overLimit` is simply not run against its transactions. `listOverview` returns
// island-ready `PatternListItem`s directly (S-04 impl-review F7) — no second `Map` re-merge in the page.
// `detailTarget` resolves a requested key through the decisions before the page looks it up, so an absorbed
// key's URL redirects to its current root (S-05 Critical Implementation Details).
// `patternTxs` / `indexById` are exported for `src/lib/patterns/fixed.ts` (S-06 `fixedOverview`) — the one join
// from a pattern to its own rows, not duplicated there.
import { resolveKey } from "@/lib/patterns/derive";
import {
  appliesTo,
  byOccurredThenId,
  monthOf,
  overLimit,
  referenceMonth,
  type DatedTx,
} from "@/lib/patterns/over-limit";
import type { MerchantPattern, PatternDecision, PatternListItem, PatternSource, Threshold } from "@/types";

interface PatternTx extends DatedTx {
  counterparty: string;
  title: string;
}

/** Picks one pattern's own rows out of the full read's rows, by transaction id. Throws only if a pattern's
 * `transactionIds` and the rows it was derived from have drifted apart (a programming error, not real input). */
export function patternTxs(pattern: MerchantPattern, byId: ReadonlyMap<string, PatternSource>): PatternTx[] {
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

export function indexById(rows: readonly PatternSource[]): Map<string, PatternSource> {
  return new Map(rows.map((row) => [row.id, row]));
}

/** What `/patterns` needs, island-ready (S-04 impl-review F7 — no second `Map` re-merge in the page): every
 * pattern's own fields plus its threshold (only when applicable) and reference-month over-limit sum (S-04
 * decision 10 — no month label on the list), in pattern order. */
export function listOverview(
  patterns: readonly MerchantPattern[],
  rows: readonly PatternSource[],
  thresholds: ReadonlyMap<string, Threshold>,
): { referenceMonth: string | null; items: PatternListItem[] } {
  const refMonth = referenceMonth(rows);
  const byId = indexById(rows);
  const items = patterns.map((pattern): PatternListItem => {
    const stored = thresholds.get(pattern.key) ?? null;
    const threshold = stored && appliesTo(stored, pattern.type) ? stored : null;
    const base = {
      key: pattern.key,
      name: pattern.name,
      type: pattern.type,
      occurrences: pattern.occurrences,
      sumMinor: pattern.sumMinor,
      fixedAmountMinor: pattern.fixedAmountMinor,
      excluded: pattern.excluded,
      threshold,
    };
    if (!threshold || !refMonth || pattern.excluded) return { ...base, overMinor: 0 };
    const { byMonth } = overLimit(patternTxs(pattern, byId), threshold, pattern.type);
    return { ...base, overMinor: byMonth.get(refMonth) ?? 0 };
  });
  return { referenceMonth: refMonth, items };
}

export type DetailTarget =
  { kind: "found"; pattern: MerchantPattern } | { kind: "redirect"; key: string } | { kind: "missing" };

/**
 * Resolves a requested key through the decisions before looking it up (S-05 Critical Implementation Details): the
 * key's current root may differ from the requested key when it was merged into another pattern after the
 * requester's link/bookmark was made. `redirect` only when the root actually has a pattern in this read
 * (otherwise the owning import may have been deleted, or the key never existed — `missing`, same as before S-05).
 */
export function detailTarget(
  key: string,
  patterns: readonly MerchantPattern[],
  decisions: ReadonlyMap<string, PatternDecision>,
): DetailTarget {
  const root = resolveKey(key, decisions);
  if (root !== key) {
    const pattern = patterns.find((p) => p.key === root);
    return pattern ? { kind: "redirect", key: root } : { kind: "missing" };
  }
  const pattern = patterns.find((p) => p.key === key);
  return pattern ? { kind: "found", pattern } : { kind: "missing" };
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
 * `referenceMonth` must be `referenceMonth(rows)` over the same full read `listOverview` uses (the detail page
 * computes it that way), so the list and every detail request agree on "the" current month.
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
  // An excluded pattern keeps `applicable` in the returned `threshold` (decision 8) but runs no over-limit pass.
  const { byTx, byMonth } = overLimit(txs, pattern.excluded ? null : applicable, pattern.type);

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
