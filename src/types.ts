import type { Tables } from "@/db/database.types";

export type ImportRow = Tables<"imports">;
export type TransactionRow = Tables<"transactions">;
export type PatternThresholdRow = Tables<"pattern_thresholds">;

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

/** What pattern derivation needs from one debit (amount positive, in grosze). */
export interface PatternSource {
  id: string;
  amountMinor: number;
  counterparty: string;
  title: string;
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

/** The slim list item sent to the patterns island. */
export type PatternListItem = Omit<MerchantPattern, "transactionIds" | "medianMinor">;
