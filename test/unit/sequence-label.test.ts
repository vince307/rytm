import { describe, expect, it } from "vitest";
import { getCopy } from "@/content/copy";
import { sequenceLabel } from "@/lib/patterns/sequence-label";

const { copyExtra } = getCopy("pl");

const label = (count: number, over: number) =>
  sequenceLabel(count, over, copyExtra.patterns.sequenceSummary, copyExtra.patterns.occurrenceForms, "pl");

describe("sequenceLabel", () => {
  it("uses singular and genitive plural forms", () => {
    expect(label(1, 0)).toBe("1 wystąpienie w ramach progu, 0 wystąpień ponad próg");
  });
  it("uses the few form for 2-4", () => {
    expect(label(3, 1)).toBe("2 wystąpienia w ramach progu, 1 wystąpienie ponad próg");
  });
  it("handles everything over the threshold", () => {
    expect(label(5, 5)).toBe("0 wystąpień w ramach progu, 5 wystąpień ponad próg");
  });
  it("handles the 22 form", () => {
    expect(label(22, 2)).toBe("20 wystąpień w ramach progu, 2 wystąpienia ponad próg");
  });
  it("has no trailing full stop", () => {
    expect(label(4, 1).endsWith(".")).toBe(false);
  });
});
