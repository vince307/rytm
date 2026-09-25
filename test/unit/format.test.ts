import { describe, expect, it } from "vitest";

import { formatAccountTail, formatRangeLong, formatRangeShort, plural } from "@/lib/format";

const TRANSACTIONS = ["transakcja", "transakcje", "transakcji"] as const;

describe("plural", () => {
  it.each([
    [1, "transakcja"],
    [2, "transakcje"],
    [5, "transakcji"],
    [12, "transakcji"],
    [22, "transakcje"],
    [206, "transakcji"],
  ])("%i → %s", (n, form) => {
    expect(plural(n, TRANSACTIONS)).toBe(form);
  });
});

describe("formatRangeShort", () => {
  it("omits the start year within one year", () => {
    expect(formatRangeShort("2026-05-01", "2026-05-28")).toBe("01.05–28.05.2026");
  });

  it("shows both full dates across years", () => {
    expect(formatRangeShort("2025-09-01", "2026-08-31")).toBe("01.09.2025–31.08.2026");
  });
});

describe("formatRangeLong", () => {
  it("uses genitive month names and one year within one year", () => {
    expect(formatRangeLong("2026-03-01", "2026-05-31")).toBe("1 marca – 31 maja 2026");
  });

  it("shows the year at both dates across years", () => {
    expect(formatRangeLong("2025-09-01", "2026-08-31")).toBe("1 września 2025 – 31 sierpnia 2026");
  });
});

describe("formatAccountTail", () => {
  it("keeps the last four digits", () => {
    expect(formatAccountTail("11111100000000000000004821")).toBe("•• 4821");
    expect(formatAccountTail("11 1111 0000 0000 0000 0000 4821")).toBe("•• 4821");
  });
});
