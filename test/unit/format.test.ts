import { describe, expect, it } from "vitest";

import {
  fillMonthLocative,
  formatDate,
  formatAccountTail,
  formatIsoDate,
  formatMonthYear,
  formatMonthAxis,
  formatMonthShort,
  formatMoney,
  formatRangeLong,
  formatRangeShort,
  formatSignedMoney,
  monthIndex,
  plural,
} from "@/lib/format";

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
    expect(plural(n, TRANSACTIONS, "pl")).toBe(form);
  });
});

describe("formatRangeShort", () => {
  it("omits the start year within one year", () => {
    expect(formatRangeShort("2026-05-01", "2026-05-28", "pl")).toBe("01.05–28.05.2026");
  });

  it("shows both full dates across years", () => {
    expect(formatRangeShort("2025-09-01", "2026-08-31", "pl")).toBe("01.09.2025–31.08.2026");
  });
});

describe("formatRangeLong", () => {
  it("uses genitive month names and one year within one year", () => {
    expect(formatRangeLong("2026-03-01", "2026-05-31", "pl")).toBe("1 marca – 31 maja 2026");
  });

  it("shows the year at both dates across years", () => {
    expect(formatRangeLong("2025-09-01", "2026-08-31", "pl")).toBe("1 września 2025 – 31 sierpnia 2026");
  });
});

describe("formatAccountTail", () => {
  it("keeps the last four digits", () => {
    expect(formatAccountTail("11111100000000000000004821")).toBe("•• 4821");
    expect(formatAccountTail("11 1111 0000 0000 0000 0000 4821")).toBe("•• 4821");
  });
});

describe("formatMoney", () => {
  it.each([
    [5299, "52,99 zł"],
    [150000, "1500,00 zł"],
    [1234567, "12\u00a0345,67 zł"],
  ])("%i → %s", (minor, text) => {
    expect(formatMoney(minor, "pl")).toBe(text);
  });
});

describe("formatSignedMoney", () => {
  it.each([
    [600, "+6,00 zł"],
    [-400, "\u22124,00 zł"],
    [0, "0,00 zł"],
    [123456, "+1234,56 zł"],
  ])("%i → %s", (minor, text) => {
    expect(formatSignedMoney(minor, "pl")).toBe(text);
  });
});

describe("formatIsoDate", () => {
  it("splits the ISO date with no time zone", () => {
    expect(formatIsoDate("2026-05-20", "pl")).toBe("20.05.2026");
  });
});

describe("formatMonthShort", () => {
  it.each([
    ["2026-05", "maj 2026"],
    ["2026-01", "sty 2026"],
    ["2025-12", "gru 2025"],
  ])("%s → %s", (yearMonth, text) => {
    expect(formatMonthShort(yearMonth, "pl")).toBe(text);
  });
});

describe("formatMonthAxis", () => {
  it.each([
    ["2026-05", "maj 26"],
    ["2025-10", "paź 25"],
    ["2026-01", "sty 26"],
  ])("%s → %s", (yearMonth, text) => {
    expect(formatMonthAxis(yearMonth, "pl")).toBe(text);
  });
});

describe("fillMonthLocative", () => {
  const locatives = [
    "styczniu",
    "lutym",
    "marcu",
    "kwietniu",
    "maju",
    "czerwcu",
    "lipcu",
    "sierpniu",
    "wrześniu",
    "październiku",
    "listopadzie",
    "grudniu",
  ];

  it.each([
    ["Nowe w {month}", "2026-05", "Nowe w maju"],
    ["Nowe w {month}", "2026-09", "Nowe we wrześniu"],
    ["Suma w {month}", "2026-01", "Suma w styczniu"],
    ["Suma w {month}", "2026-09", "Suma we wrześniu"],
    ["Ponad progiem {month}", "2026-09", "Ponad progiem wrześniu"],
  ])("%s / %s → %s", (template, yearMonth, expected) => {
    expect(fillMonthLocative(template, yearMonth, locatives, "pl")).toBe(expected);
  });
});

describe("monthIndex", () => {
  it.each([
    ["2026-01", 0],
    ["2026-05", 4],
    ["2026-12", 11],
  ])("%s → %i", (yearMonth, expected) => {
    expect(monthIndex(yearMonth)).toBe(expected);
  });
});

describe("English (en-GB) output", () => {
  const monthsEn = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  it("plural: one / other", () => {
    const forms = ["transaction", "transactions", "transactions"] as const;
    expect(plural(1, forms, "en")).toBe("transaction");
    expect(plural(2, forms, "en")).toBe("transactions");
    expect(plural(5, forms, "en")).toBe("transactions");
  });
  it("formatMoney groups thousands with a comma and a dot decimal", () => {
    expect(formatMoney(384260, "en")).toBe("3,842.60 zł");
  });
  it("formatSignedMoney", () => {
    expect(formatSignedMoney(600, "en")).toBe("+6.00 zł");
    expect(formatSignedMoney(-400, "en")).toBe("\u22124.00 zł");
  });
  it("formatIsoDate uses DD/MM/YYYY", () => {
    expect(formatIsoDate("2026-05-20", "en")).toBe("20/05/2026");
  });
  it("formatRangeShort", () => {
    expect(formatRangeShort("2026-05-01", "2026-05-28", "en")).toBe("01/05–28/05/2026");
    expect(formatRangeShort("2025-09-01", "2026-08-31", "en")).toBe("01/09/2025–31/08/2026");
  });
  it("formatRangeLong", () => {
    expect(formatRangeLong("2026-03-01", "2026-05-31", "en")).toBe("1 March – 31 May 2026");
  });
  it("formatMonthShort / formatMonthAxis", () => {
    expect(formatMonthShort("2026-05", "en")).toBe("May 2026");
    expect(formatMonthAxis("2026-09", "en")).toBe("Sept 26");
  });
  it("formatMonthYear", () => {
    expect(formatMonthYear(new Date("2026-09-15T12:00:00Z"), "en")).toBe("September 2026");
    expect(formatMonthYear(new Date("2026-09-15T12:00:00Z"), "pl")).toBe("wrzesień 2026");
  });
  it("formatDate", () => {
    expect(formatDate("2026-05-28T10:00:00Z", "en")).toBe("28/05/2026");
    expect(formatDate("2026-05-28T10:00:00Z", "pl")).toBe("28.05.2026");
  });
  it("fillMonthLocative replaces {month} without rewriting a preposition", () => {
    expect(fillMonthLocative("Total in {month}", "2026-09", monthsEn, "en")).toBe("Total in September");
  });
});
