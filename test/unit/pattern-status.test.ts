import { describe, expect, it } from "vitest";

import { patternStatuses } from "@/lib/patterns/status";
import type { fixedOverview } from "@/lib/patterns/fixed";

type Overview = ReturnType<typeof fixedOverview>;
const base: Overview = {
  referenceMonth: "2026-03",
  comparisonMonth: "2026-02",
  hasComparison: true,
  changed: [],
  new: [],
  unchanged: [],
};

describe("patternStatuses", () => {
  it("maps changed and new rows by key, leaves unchanged out", () => {
    const map = patternStatuses({
      ...base,
      changed: [{ key: "a", name: "A", occurredOn: "2026-03-01", amountMinor: 2, previousMinor: 1, deltaMinor: 1 }],
      new: [{ key: "b", name: "B", firstOccurredOn: "2026-03-02", amountMinor: 5 }],
      unchanged: [{ key: "c", name: "C", amountMinor: 3 }],
    });
    expect(map.get("a")).toBe("changed");
    expect(map.get("b")).toBe("new");
    expect(map.has("c")).toBe(false);
  });

  it("lets new win over changed for the same key", () => {
    const map = patternStatuses({
      ...base,
      changed: [{ key: "a", name: "A", occurredOn: "2026-03-01", amountMinor: 2, previousMinor: 1, deltaMinor: 1 }],
      new: [{ key: "a", name: "A", firstOccurredOn: "2026-03-01", amountMinor: 2 }],
    });
    expect(map.get("a")).toBe("new");
  });

  it("is empty for an empty overview", () => {
    expect(patternStatuses(base).size).toBe(0);
  });
});
