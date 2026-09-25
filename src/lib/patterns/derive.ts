// Pattern derivation (import-formats.md D5, PRD FR-006/FR-007): every transaction lands in exactly one pattern,
// and the result does not depend on input order (guardrail „determinizm”).
import { merchantKey, normalizeMerchant, rawMerchant } from "@/lib/patterns/merchant";
import type { MerchantPattern, PatternSource, PatternType } from "@/types";

/** D5 tolerance of a fixed pattern: max(15% of the median, 10 zł), inclusive. Mirror of scripts/fixture-ing.mjs. */
export const TOLERANCE = { pct: 15, minMinor: 1000 } as const;

/** Median; an even count gives the mean of the two middle values. */
export function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** D5: `fixed` iff every amount is within the tolerance of the median; one occurrence is `fixed`. */
export function d5Type(amounts: readonly number[]): PatternType {
  const m = median(amounts);
  const tolerance = Math.max((m * TOLERANCE.pct) / 100, TOLERANCE.minMinor);
  return amounts.every((a) => Math.abs(a - m) <= tolerance) ? "fixed" : "frequent";
}

const codePointCompare = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

export function derivePatterns(rows: readonly PatternSource[]): MerchantPattern[] {
  const groups = new Map<string, { rows: PatternSource[]; variants: Map<string, number> }>();
  for (const row of rows) {
    const raw = rawMerchant(row.counterparty, row.title);
    const key = merchantKey(raw);
    const group = groups.get(key) ?? { rows: [], variants: new Map<string, number>() };
    group.rows.push(row);
    const name = normalizeMerchant(raw);
    group.variants.set(name, (group.variants.get(name) ?? 0) + 1);
    groups.set(key, group);
  }

  const patterns = [...groups.entries()].map(([key, group]): MerchantPattern => {
    // Display name: the variant with the most rows; tie → the code-point-smallest.
    const [name] = [...group.variants.entries()].sort(([a, na], [b, nb]) => nb - na || codePointCompare(a, b))[0];
    const amounts = group.rows.map((r) => r.amountMinor);
    const type = d5Type(amounts);
    const medianMinor = Math.round(median(amounts));
    return {
      key,
      name,
      type,
      occurrences: group.rows.length,
      sumMinor: amounts.reduce((s, a) => s + a, 0),
      medianMinor,
      fixedAmountMinor: type === "fixed" ? medianMinor : null,
      transactionIds: group.rows.map((r) => r.id).sort(codePointCompare),
    };
  });

  return patterns.sort(
    (a, b) => b.sumMinor - a.sumMinor || a.name.localeCompare(b.name, "pl") || codePointCompare(a.key, b.key),
  );
}
