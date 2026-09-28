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

/** A merchant pattern derived on read from the user's transactions (S-03). */
export interface MerchantPattern {
  /** `merchantKey` of the group — the pattern's identity. */
  key: string;
  name: string;
  type: PatternType;
  occurrences: number;
  sumMinor: number;
  medianMinor: number;
  /** Median for `fixed`, `null` for `frequent`. */
  fixedAmountMinor: number | null;
  transactionIds: string[];
}

/** The slim list item sent to the patterns island. `threshold` is only set when its `kind` applies to `type`
 * (S-04 decision 3); `overMinor` is the reference month's over-limit sum (S-04 decision 10 — no month label on
 * the list), 0 when there is no applicable threshold or nothing is over. */
export type PatternListItem = Omit<MerchantPattern, "transactionIds" | "medianMinor"> & {
  threshold: Threshold | null;
  overMinor: number;
};
