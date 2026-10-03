import { describe, expect, it } from "vitest";

import { keyFromPath, patternHref } from "@/lib/patterns/path";
import {
  formatThresholdInput,
  parseThresholdValue,
  thresholdDeleteSchema,
  thresholdRedirect,
  thresholdSaveSchema,
} from "@/lib/patterns/threshold-form";
import type { Threshold, ThresholdKind } from "@/types";

describe("parseThresholdValue", () => {
  it("accepts a count", () => {
    expect(parseThresholdValue("count", "4")).toBe(4);
  });

  it.each<[ThresholdKind, string, number]>([
    ["sum", "55", 5500],
    ["sum", "55,5", 5550],
    ["sum", "55.50", 5550],
    ["amount", "1 000", 100000],
  ])("accepts money %s %s → %i", (kind, raw, expected) => {
    expect(parseThresholdValue(kind, raw)).toBe(expected);
  });

  it("rejects a non-positive value", () => {
    expect(parseThresholdValue("count", "0")).toBeNull();
    expect(parseThresholdValue("count", "-5")).toBeNull();
    expect(parseThresholdValue("amount", "0")).toBeNull();
    expect(parseThresholdValue("amount", "-5")).toBeNull();
  });

  it("rejects a fractional count", () => {
    expect(parseThresholdValue("count", "4.5")).toBeNull();
  });

  it("rejects more than two decimal places for money", () => {
    expect(parseThresholdValue("sum", "55,555")).toBeNull();
  });

  it("rejects empty and non-numeric input", () => {
    for (const kind of ["count", "sum", "amount"] as const) {
      expect(parseThresholdValue(kind, "")).toBeNull();
      expect(parseThresholdValue(kind, "abc")).toBeNull();
    }
  });

  it("accepts the count boundary and rejects one past it", () => {
    expect(parseThresholdValue("count", "999")).toBe(999);
    expect(parseThresholdValue("count", "1000")).toBeNull();
  });

  it("strips spaces including NBSP", () => {
    expect(parseThresholdValue("count", " 4 ")).toBe(4);
    expect(parseThresholdValue("amount", "1 000")).toBe(100000);
  });
});

describe("formatThresholdInput", () => {
  it.each<[Threshold, string]>([
    [{ kind: "count", value: 4 }, "4"],
    [{ kind: "sum", value: 5500 }, "55"],
    [{ kind: "amount", value: 5550 }, "55,50"],
    [{ kind: "amount", value: 5501 }, "55,01"],
  ])("formats %o → %s", (threshold, expected) => {
    expect(formatThresholdInput(threshold, "pl")).toBe(expected);
  });

  it.each<[Threshold, string]>([
    [{ kind: "count", value: 4 }, "4"],
    [{ kind: "amount", value: 5550 }, "55.50"],
    [{ kind: "amount", value: 5500 }, "55"],
  ])("formats %o → %s in English", (threshold, expected) => {
    expect(formatThresholdInput(threshold, "en")).toBe(expected);
  });

  it("round-trips through parseThresholdValue", () => {
    for (const threshold of [
      { kind: "count", value: 4 } as const,
      { kind: "sum", value: 5500 } as const,
      { kind: "amount", value: 5550 } as const,
      { kind: "amount", value: 5501 } as const,
    ]) {
      expect(parseThresholdValue(threshold.kind, formatThresholdInput(threshold, "pl"))).toBe(threshold.value);
    }
  });
});

describe("thresholdSaveSchema / thresholdDeleteSchema", () => {
  it("rejects an empty key", () => {
    expect(thresholdSaveSchema.safeParse({ key: "", kind: "count", value: "4" }).success).toBe(false);
    expect(thresholdDeleteSchema.safeParse({ key: "" }).success).toBe(false);
  });

  it("rejects an unknown kind", () => {
    expect(thresholdSaveSchema.safeParse({ key: "wolt", kind: "weekly", value: "4" }).success).toBe(false);
  });

  it("rejects an invalid month", () => {
    expect(thresholdSaveSchema.safeParse({ key: "wolt", kind: "count", value: "4", month: "2026-13" }).success).toBe(
      false,
    );
    expect(thresholdDeleteSchema.safeParse({ key: "wolt", month: "2026-13" }).success).toBe(false);
  });

  it("accepts a well-formed save without a month", () => {
    expect(thresholdSaveSchema.safeParse({ key: "wolt", kind: "sum", value: "50000" }).success).toBe(true);
  });
});

describe("thresholdRedirect", () => {
  it("maps every status to its query param", () => {
    expect(thresholdRedirect("kawiarnia smoke", "saved")).toBe("/patterns/kawiarnia%20smoke?saved=1");
    expect(thresholdRedirect("kawiarnia smoke", "removed")).toBe("/patterns/kawiarnia%20smoke?removed=1");
    expect(thresholdRedirect("kawiarnia smoke", "error-value")).toBe("/patterns/kawiarnia%20smoke?error=value");
    expect(thresholdRedirect("kawiarnia smoke", "error-save")).toBe("/patterns/kawiarnia%20smoke?error=save");
  });

  it("carries the month first when given", () => {
    expect(thresholdRedirect("wolt", "saved", "2026-04")).toBe("/patterns/wolt?month=2026-04&saved=1");
  });
});

describe("patternHref / keyFromPath", () => {
  it.each(["kawiarnia smoke", "restauracja pod przykładem", "kawa-testowa.pl", "a/b", "100%"])(
    "round-trips %s",
    (key) => {
      const href = patternHref(key);
      const pathname = href.split("?")[0];
      expect(keyFromPath(pathname)).toBe(key);
    },
  );

  it("puts month first, ahead of other params", () => {
    expect(patternHref("wolt", { saved: "1" }, "2026-04")).toBe("/patterns/wolt?month=2026-04&saved=1");
  });

  it("returns null for an empty segment", () => {
    expect(keyFromPath("/patterns/")).toBeNull();
  });

  it("returns null for a non-matching path", () => {
    expect(keyFromPath("/home")).toBeNull();
  });

  it("falls back to the raw segment when decoding throws", () => {
    expect(keyFromPath("/patterns/%")).toBe("%");
  });
});
