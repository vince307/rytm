// Pattern derivation (import-formats.md D5, PRD FR-006/FR-007): every transaction lands in exactly one pattern,
// and the result does not depend on input order (guardrail „determinizm”). S-05: a durable decision, keyed on the
// *raw* merchant key, is resolved to its root (`resolveKey`) *before* grouping — so a merge's count/sum/median/type
// are recomputed over the union of its components, and a pinned type / excluded flag / display name apply to the
// whole group. Only the root's own decision is read; an absorbed key's decision fields stay stored but inert.
import { merchantKey, normalizeMerchant, rawMerchant } from "@/lib/patterns/merchant";
import type { MerchantPattern, PatternDecision, PatternSource, PatternType } from "@/types";

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

/**
 * Follows `mergedInto` from `key` to its root. A cycle (only reachable through races or crafted POSTs — the
 * decision endpoint only ever accepts a *current root* as a merge target) resolves to the code-point-smallest key
 * on the cycle, regardless of which key on (or leading into) the cycle `resolveKey` was called with — so the
 * result stays deterministic and input-order independent.
 */
export function resolveKey(key: string, decisions: ReadonlyMap<string, PatternDecision>): string {
  const visited: string[] = [];
  let current = key;
  for (;;) {
    const seenAt = visited.indexOf(current);
    if (seenAt !== -1) {
      return visited.slice(seenAt).reduce((min, k) => (codePointCompare(k, min) < 0 ? k : min));
    }
    visited.push(current);
    const next = decisions.get(current)?.mergedInto;
    if (!next) return current;
    current = next;
  }
}

function topVariant(variants: ReadonlyMap<string, number>): string {
  // The variant with the most rows; tie → the code-point-smallest.
  const [name] = [...variants.entries()].sort(([a, na], [b, nb]) => nb - na || codePointCompare(a, b))[0];
  return name;
}

export function derivePatterns(
  rows: readonly PatternSource[],
  decisions: ReadonlyMap<string, PatternDecision> = new Map(),
): MerchantPattern[] {
  // Pass 1: group by the row's own (un-merged) key, exactly as before S-05 — this is also each merge component's
  // own identity for `merged[].name` and for reading an absorbed key's (ignored) decision fields.
  const byRawKey = new Map<string, { rows: PatternSource[]; variants: Map<string, number> }>();
  for (const row of rows) {
    const raw = rawMerchant(row.counterparty, row.title);
    const rawKey = merchantKey(raw);
    const entry = byRawKey.get(rawKey) ?? { rows: [], variants: new Map<string, number>() };
    entry.rows.push(row);
    const name = normalizeMerchant(raw);
    entry.variants.set(name, (entry.variants.get(name) ?? 0) + 1);
    byRawKey.set(rawKey, entry);
  }

  // Pass 2: union each raw key's rows/variants into its resolved root's group. `members` carries each raw key's
  // own variants alongside it, so `merged[].name` never has to look `byRawKey` back up (no non-null assertion).
  const groups = new Map<
    string,
    { rows: PatternSource[]; variants: Map<string, number>; members: { key: string; variants: Map<string, number> }[] }
  >();
  for (const [rawKey, entry] of byRawKey) {
    const key = resolveKey(rawKey, decisions);
    const group = groups.get(key) ?? { rows: [], variants: new Map<string, number>(), members: [] };
    group.rows.push(...entry.rows);
    for (const [name, count] of entry.variants) group.variants.set(name, (group.variants.get(name) ?? 0) + count);
    group.members.push({ key: rawKey, variants: entry.variants });
    groups.set(key, group);
  }

  const patterns = [...groups.entries()].map(([key, group]): MerchantPattern => {
    const decision = decisions.get(key);
    const amounts = group.rows.map((r) => r.amountMinor);
    const medianMinor = Math.round(median(amounts));
    const type = decision?.pinnedType ?? d5Type(amounts);
    const merged = group.members
      .filter((m) => m.key !== key)
      .sort((a, b) => codePointCompare(a.key, b.key))
      .map((m) => ({ key: m.key, name: topVariant(m.variants) }));
    return {
      key,
      name: decision?.displayName ?? topVariant(group.variants),
      type,
      occurrences: group.rows.length,
      sumMinor: amounts.reduce((s, a) => s + a, 0),
      medianMinor,
      fixedAmountMinor: type === "fixed" ? medianMinor : null,
      transactionIds: group.rows.map((r) => r.id).sort(codePointCompare),
      excluded: decision?.excluded ?? false,
      merged,
    };
  });

  return patterns.sort(
    (a, b) => b.sumMinor - a.sumMinor || a.name.localeCompare(b.name, "pl") || codePointCompare(a.key, b.key),
  );
}
