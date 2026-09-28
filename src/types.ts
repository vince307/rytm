import type { Tables } from "@/db/database.types";

export type ImportRow = Tables<"imports">;
export type TransactionRow = Tables<"transactions">;
export type PatternThresholdRow = Tables<"pattern_thresholds">;
export type PatternDecisionRow = Tables<"pattern_decisions">;

/** D5 type proposed by the app: `fixed` = stały, `frequent` = częsty. */
export type PatternType = "fixed" | "frequent";

/** `count` / `sum` apply to `frequent` patterns, `amount` to `fixed` (FR-010). */
export type ThresholdKind = "count" | "sum" | "amount";

/** One user-set threshold on a pattern (`pattern_thresholds` row, minus identity). `value` is a plain count for
 * `count`, grosze for `sum` / `amount`. */
export interface Threshold {
  kind: ThresholdKind;
  value: number;
}

/** What pattern derivation needs from one debit (amount positive, in grosze). `occurredOn` (`YYYY-MM-DD`) is
 * unused by `derivePatterns` itself but carried through the read for the over-limit rule and view models (S-04). */
export interface PatternSource {
  id: string;
  amountMinor: number;
  counterparty: string;
  title: string;
  occurredOn: string;
}

/** One durable decision fixed at a merchant key (`pattern_decisions` row, minus identity) — FR-009/US-03. Applied
 * inside `derivePatterns`, before grouping (S-05); only the *root* key's decision (after following `mergedInto`)
 * is read — an absorbed key's own `excluded` / `pinnedType` / `displayName` stay stored but inert. */
export interface PatternDecision {
  /** The key this merchant is merged into, or `null` when it is not absorbed by another pattern. */
  mergedInto: string | null;
  excluded: boolean;
  /** Overrides `d5Type` for good when set (S-05: no way back to the automatic type once pinned). */
  pinnedType: PatternType | null;
  /** Overrides the most-frequent variant name when set; `null` shows the derived name. */
  displayName: string | null;
}

/** A merchant pattern derived on read from the user's transactions (S-03), decisions applied (S-05). */
export interface MerchantPattern {
  /** `merchantKey` of the group — the pattern's identity (the resolved *root* key when merged, S-05). */
  key: string;
  name: string;
  type: PatternType;
  occurrences: number;
  sumMinor: number;
  medianMinor: number;
  /** Median for `fixed`, `null` for `frequent`. */
  fixedAmountMinor: number | null;
  transactionIds: string[];
  /** `true` when the root key's decision excludes this pattern from over-limit and monthly sums (S-05). */
  excluded: boolean;
  /** Keys merged into this pattern that have rows in this read, sorted by key; `name` is that key's own
   * most-frequent variant (S-05). Empty for a pattern nothing was merged into. */
  merged: { key: string; name: string }[];
}

/** The slim list item sent to the patterns island. `threshold` is only set when its `kind` applies to `type`
 * (S-04 decision 3); `overMinor` is the reference month's over-limit sum (S-04 decision 10 — no month label on
 * the list), 0 when there is no applicable threshold or nothing is over. `merged` is detail-only (S-05). */
export type PatternListItem = Omit<MerchantPattern, "transactionIds" | "medianMinor" | "merged"> & {
  threshold: Threshold | null;
  overMinor: number;
};
