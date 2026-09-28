import { describe, expect, it } from "vitest";

import {
  decisionKeySchema,
  decisionRedirect,
  decisionSchema,
  parseDisplayName,
  validateMerge,
} from "@/lib/patterns/decision-form";
import type { MerchantPattern } from "@/types";

function pattern(key: string, overrides: Partial<MerchantPattern> = {}): MerchantPattern {
  return {
    key,
    name: key,
    type: "frequent",
    occurrences: 1,
    sumMinor: 100,
    medianMinor: 100,
    fixedAmountMinor: null,
    transactionIds: ["1"],
    excluded: false,
    merged: [],
    ...overrides,
  };
}

describe("decisionKeySchema", () => {
  it("accepts a well-formed key alongside other fields", () => {
    expect(decisionKeySchema.safeParse({ key: "wolt", action: "exclude" }).success).toBe(true);
  });

  it("rejects an empty or missing key", () => {
    expect(decisionKeySchema.safeParse({ key: "" }).success).toBe(false);
    expect(decisionKeySchema.safeParse({}).success).toBe(false);
  });

  it("rejects a key over 500 characters", () => {
    expect(decisionKeySchema.safeParse({ key: "a".repeat(501) }).success).toBe(false);
  });
});

describe("decisionSchema", () => {
  it("accepts each action", () => {
    expect(decisionSchema.safeParse({ action: "merge", key: "wolt", target: "kawiarnia" }).success).toBe(true);
    expect(decisionSchema.safeParse({ action: "unmerge", key: "wolt", source: "wolt.pl" }).success).toBe(true);
    expect(decisionSchema.safeParse({ action: "type", key: "wolt", type: "fixed" }).success).toBe(true);
    expect(decisionSchema.safeParse({ action: "type", key: "wolt", type: "frequent" }).success).toBe(true);
    expect(decisionSchema.safeParse({ action: "rename", key: "wolt", name: "Wolt" }).success).toBe(true);
    expect(decisionSchema.safeParse({ action: "exclude", key: "wolt" }).success).toBe(true);
    expect(decisionSchema.safeParse({ action: "restore", key: "wolt" }).success).toBe(true);
    expect(decisionSchema.safeParse({ action: "restore", key: "wolt", back: "list" }).success).toBe(true);
  });

  it("rejects an unknown action", () => {
    expect(decisionSchema.safeParse({ action: "nope", key: "wolt" }).success).toBe(false);
  });

  it("rejects a merge with no target", () => {
    expect(decisionSchema.safeParse({ action: "merge", key: "wolt" }).success).toBe(false);
  });

  it("rejects an unmerge with no source", () => {
    expect(decisionSchema.safeParse({ action: "unmerge", key: "wolt" }).success).toBe(false);
  });

  it("rejects a type outside fixed/frequent", () => {
    expect(decisionSchema.safeParse({ action: "type", key: "wolt", type: "weekly" }).success).toBe(false);
  });

  it("rejects a key over 500 characters on any action", () => {
    expect(decisionSchema.safeParse({ action: "exclude", key: "a".repeat(501) }).success).toBe(false);
  });
});

describe("parseDisplayName", () => {
  it("trims surrounding whitespace", () => {
    expect(parseDisplayName("  Sportowo  ")).toBe("Sportowo");
  });

  it("treats empty and whitespace-only input as clearing the override", () => {
    expect(parseDisplayName("")).toBeNull();
    expect(parseDisplayName("   ")).toBeNull();
  });

  it("accepts exactly 100 characters", () => {
    expect(parseDisplayName("a".repeat(100))).toBe("a".repeat(100));
  });

  it("rejects 101 characters", () => {
    expect(parseDisplayName("a".repeat(101))).toBe("invalid");
  });
});

describe("validateMerge", () => {
  const patterns = [pattern("wolt"), pattern("kawiarnia"), pattern("excluded-one", { excluded: true })];

  it("accepts two current, non-excluded roots", () => {
    expect(validateMerge(patterns, "wolt", "kawiarnia")).toBe(true);
  });

  it("rejects merging into itself", () => {
    expect(validateMerge(patterns, "wolt", "wolt")).toBe(false);
  });

  it("rejects an unknown target", () => {
    expect(validateMerge(patterns, "wolt", "nieznany")).toBe(false);
  });

  it("rejects a target that is not a current root (already absorbed)", () => {
    // "sklep.pl" is not among `patterns` at all — the same shape an already-absorbed key has.
    expect(validateMerge(patterns, "wolt", "sklep.pl")).toBe(false);
  });

  it("rejects an excluded target", () => {
    expect(validateMerge(patterns, "wolt", "excluded-one")).toBe(false);
  });

  it("rejects an unknown source", () => {
    expect(validateMerge(patterns, "nieznany", "kawiarnia")).toBe(false);
  });
});

describe("decisionRedirect", () => {
  it("maps every status to its query param on the key's own detail", () => {
    expect(decisionRedirect("kawiarnia smoke", "merged")).toBe("/patterns/kawiarnia%20smoke?merged=1");
    expect(decisionRedirect("kawiarnia smoke", "unmerged")).toBe("/patterns/kawiarnia%20smoke?unmerged=1");
    expect(decisionRedirect("kawiarnia smoke", "typed")).toBe("/patterns/kawiarnia%20smoke?typed=1");
    expect(decisionRedirect("kawiarnia smoke", "renamed")).toBe("/patterns/kawiarnia%20smoke?renamed=1");
    expect(decisionRedirect("kawiarnia smoke", "excluded")).toBe("/patterns/kawiarnia%20smoke?excluded=1");
    expect(decisionRedirect("kawiarnia smoke", "restored")).toBe("/patterns/kawiarnia%20smoke?restored=1");
    expect(decisionRedirect("kawiarnia smoke", "error-merge")).toBe("/patterns/kawiarnia%20smoke?error=merge");
    expect(decisionRedirect("kawiarnia smoke", "error-name")).toBe("/patterns/kawiarnia%20smoke?error=name");
    expect(decisionRedirect("kawiarnia smoke", "error-decision")).toBe("/patterns/kawiarnia%20smoke?error=decision");
  });

  it("sends the result to /patterns when back is list", () => {
    expect(decisionRedirect("kawiarnia smoke", "restored", "list")).toBe("/patterns?restored=1");
    expect(decisionRedirect("kawiarnia smoke", "error-decision", "list")).toBe("/patterns?error=decision");
  });

  it("encodes a key with a space", () => {
    expect(decisionRedirect("sklep smoke", "merged")).toBe("/patterns/sklep%20smoke?merged=1");
  });
});
