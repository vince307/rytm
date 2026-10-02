import { describe, expect, it } from "vitest";

import { BANK_SOURCES, isBankSource } from "@/lib/import/banks";

describe("BANK_SOURCES / isBankSource", () => {
  it("lists ing and santander", () => {
    expect(BANK_SOURCES).toEqual(["ing", "santander"]);
  });

  it("accepts a known source", () => {
    expect(isBankSource("ing")).toBe(true);
    expect(isBankSource("santander")).toBe(true);
  });

  it("rejects an unknown source", () => {
    expect(isBankSource("mbank")).toBe(false);
  });
});
