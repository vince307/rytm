import { describe, expect, it } from "vitest";

import { derivePatterns, resolveKey } from "@/lib/patterns/derive";
import type { MerchantPattern, PatternDecision, PatternSource } from "@/types";

function byKey(patterns: readonly MerchantPattern[], key: string): MerchantPattern {
  const found = patterns.find((p) => p.key === key);
  if (!found) throw new Error(`no pattern for key "${key}"`);
  return found;
}

// Defaults for a decision object that only cares about one field — `resolveKey` only reads `mergedInto`, but the
// interface requires the others.
function decision(partial: Partial<PatternDecision>): PatternDecision {
  return { mergedInto: null, excluded: false, pinnedType: null, displayName: null, ...partial };
}

describe("resolveKey", () => {
  it("returns the key itself when it has no decision (unknown key)", () => {
    expect(resolveKey("nope", new Map())).toBe("nope");
  });

  it("follows a direct merge to its target", () => {
    const decisions = new Map([["a", decision({ mergedInto: "b" })]]);
    expect(resolveKey("a", decisions)).toBe("b");
  });

  it("follows a chain a → b → c to the terminal root c", () => {
    const decisions = new Map([
      ["a", decision({ mergedInto: "b" })],
      ["b", decision({ mergedInto: "c" })],
    ]);
    expect(resolveKey("a", decisions)).toBe("c");
  });

  it("resolves a 2-cycle to the code-point-smallest member, from either entry", () => {
    const decisions = new Map([
      ["x", decision({ mergedInto: "y" })],
      ["y", decision({ mergedInto: "x" })],
    ]);
    expect(resolveKey("x", decisions)).toBe("x");
    expect(resolveKey("y", decisions)).toBe("x");
  });

  it("resolves a 3-cycle to the code-point-smallest member, from every key on it", () => {
    const decisions = new Map([
      ["a", decision({ mergedInto: "b" })],
      ["b", decision({ mergedInto: "c" })],
      ["c", decision({ mergedInto: "a" })],
    ]);
    expect(resolveKey("a", decisions)).toBe("a");
    expect(resolveKey("b", decisions)).toBe("a");
    expect(resolveKey("c", decisions)).toBe("a");
  });

  it("resolves a cycle entered from a tail outside it, independent of the entry point", () => {
    const decisions = new Map([
      ["d", decision({ mergedInto: "a" })],
      ["a", decision({ mergedInto: "b" })],
      ["b", decision({ mergedInto: "c" })],
      ["c", decision({ mergedInto: "a" })],
    ]);
    expect(resolveKey("d", decisions)).toBe("a");
  });
});

function tx(id: string, amountMinor: number, counterparty: string, occurredOn = "2026-01-01"): PatternSource {
  return { id, amountMinor, counterparty, title: "", occurredOn };
}

describe("derivePatterns with decisions", () => {
  it("a pinned type overrides D5 both ways", () => {
    // "Steady": D5 natural = fixed (within tolerance); pinned to frequent overrides it.
    const steadyRows = [
      tx("s1", 17000, "Steady", "2026-01-01"),
      tx("s2", 20000, "Steady", "2026-01-02"),
      tx("s3", 23000, "Steady", "2026-01-03"),
    ];
    // "Varied": D5 natural = frequent (one grosz over tolerance); pinned to fixed overrides it.
    const variedRows = [
      tx("v1", 16999, "Varied", "2026-01-01"),
      tx("v2", 20000, "Varied", "2026-01-02"),
      tx("v3", 23000, "Varied", "2026-01-03"),
    ];
    const decisions = new Map([
      ["steady", decision({ pinnedType: "frequent" })],
      ["varied", decision({ pinnedType: "fixed" })],
    ]);
    const patterns = derivePatterns([...steadyRows, ...variedRows], decisions);

    const steady = byKey(patterns, "steady");
    expect(steady.type).toBe("frequent");
    expect(steady.fixedAmountMinor).toBeNull();

    const varied = byKey(patterns, "varied");
    expect(varied.type).toBe("fixed");
    expect(varied.fixedAmountMinor).toBe(20000); // median of [16999, 20000, 23000], out of tolerance but kept
  });

  it("a display name override wins over the most-frequent variant", () => {
    // "FOO" (2 rows) and "Foo" (1 row) share the key "foo" but are different case variants.
    const rows = [tx("f1", 1000, "FOO"), tx("f2", 1000, "FOO"), tx("f3", 1000, "Foo")];
    const decisions = new Map([["foo", decision({ displayName: "Custom Foo" })]]);
    const withOverride = byKey(derivePatterns(rows, decisions), "foo");
    const withoutOverride = byKey(derivePatterns(rows), "foo");
    expect(withoutOverride.name).toBe("FOO"); // the natural, most-frequent variant
    expect(withOverride.name).toBe("Custom Foo");
  });

  it("only the root's own decision is read — an absorbed key's excluded/pinnedType/displayName are ignored", () => {
    const rootRows = [tx("r1", 1000, "Root", "2026-01-01"), tx("r2", 1100, "Root", "2026-01-02")];
    const absorbedRows = [tx("a1", 1000, "Absorbed", "2026-01-03")];
    const decisions = new Map([
      [
        "absorbed",
        decision({ mergedInto: "root", excluded: true, pinnedType: "fixed", displayName: "ShouldBeIgnored" }),
      ],
    ]);
    const pattern = byKey(derivePatterns([...rootRows, ...absorbedRows], decisions), "root");
    expect(pattern.excluded).toBe(false);
    expect(pattern.name).toBe("Root");
    expect(pattern.name).not.toBe("ShouldBeIgnored");
    expect(pattern.merged).toEqual([{ key: "absorbed", name: "Absorbed" }]);
    expect(pattern.occurrences).toBe(3);
  });

  it("US-03: a later import's rows of an absorbed merchant join the merged group with the same decisions applied", () => {
    const earlyRows = [tx("c1", 10000, "Cafe A", "2026-01-01"), tx("c2", 10000, "Cafe A", "2026-01-02")];
    const laterRows = [tx("c3", 10000, "Cafe B", "2026-02-01"), tx("c4", 50000, "Cafe B", "2026-02-02")];
    const decisions = new Map([
      ["cafe b", decision({ mergedInto: "cafe a" })],
      ["cafe a", decision({ pinnedType: "fixed", displayName: "Cafe Renamed", excluded: true })],
    ]);

    // Before the later import: only "Cafe A" has rows; "cafe b"'s decision is inert (no rows yet).
    const before = derivePatterns(earlyRows, decisions);
    expect(before).toHaveLength(1);
    expect(before[0]).toMatchObject({ key: "cafe a", name: "Cafe Renamed", type: "fixed", excluded: true, merged: [] });

    // After the later import: the union is one "cafe a" group; D5 over all 4 rows would say "frequent"
    // (50000 is far outside the tolerance around the median), but the pinned type still holds.
    const after = derivePatterns([...earlyRows, ...laterRows], decisions);
    expect(after).toHaveLength(1);
    const merged = after[0];
    expect(merged.key).toBe("cafe a");
    expect(merged.type).toBe("fixed"); // pinned; D5 alone would say "frequent" here
    expect(merged.name).toBe("Cafe Renamed");
    expect(merged.excluded).toBe(true);
    expect(merged.occurrences).toBe(4);
    expect(merged.merged).toEqual([{ key: "cafe b", name: "Cafe B" }]);
    expect(merged.transactionIds.sort()).toEqual(["c1", "c2", "c3", "c4"]);
  });
});
