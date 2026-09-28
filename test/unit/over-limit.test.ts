import { describe, expect, it } from "vitest";

import { appliesTo, monthOf, overLimit, previousMonth, referenceMonth, type DatedTx } from "@/lib/patterns/over-limit";
import type { Threshold } from "@/types";

const tx = (id: string, occurredOn: string, amountMinor: number): DatedTx => ({ id, occurredOn, amountMinor });

describe("overLimit", () => {
  it("US-01 Wolt: count 4 flags the 5th and 6th order with their full amount", () => {
    const txs = Array.from({ length: 6 }, (_, i) => tx(String(i + 1), `2026-05-0${i + 1}`, 2000));
    const threshold: Threshold = { kind: "count", value: 4 };
    const { byTx, byMonth } = overLimit(txs, threshold, "frequent");
    expect(byTx).toEqual(
      new Map([
        ["5", 2000],
        ["6", 2000],
      ]),
    );
    expect(byMonth).toEqual(new Map([["2026-05", 4000]]));
  });

  it("resets per month: April's 5th order flags, May's 3 do not", () => {
    const april = Array.from({ length: 5 }, (_, i) => tx(String(i + 1), `2026-04-0${i + 1}`, 1000));
    const may = Array.from({ length: 3 }, (_, i) => tx(String(i + 6), `2026-05-0${i + 1}`, 1000));
    const threshold: Threshold = { kind: "count", value: 4 };
    const { byTx, byMonth } = overLimit([...april, ...may], threshold, "frequent");
    expect(byTx).toEqual(new Map([["5", 1000]]));
    expect(byMonth).toEqual(new Map([["2026-04", 1000]]));
  });

  it("count N with exactly N occurrences flags nothing", () => {
    const txs = Array.from({ length: 4 }, (_, i) => tx(String(i + 1), `2026-05-0${i + 1}`, 1000));
    const { byTx, byMonth } = overLimit(txs, { kind: "count", value: 4 }, "frequent");
    expect(byTx.size).toBe(0);
    expect(byMonth.size).toBe(0);
  });

  it("sum 100,00 zł: the crossing transaction carries the excess, later ones the full amount", () => {
    const txs = [
      tx("1", "2026-05-10", 4000),
      tx("2", "2026-05-10", 4000),
      tx("3", "2026-05-10", 3000),
      tx("4", "2026-05-10", 2000),
    ];
    const { byTx, byMonth } = overLimit(txs, { kind: "sum", value: 10000 }, "frequent");
    expect(byTx).toEqual(
      new Map([
        ["3", 1000],
        ["4", 2000],
      ]),
    );
    expect(byMonth).toEqual(new Map([["2026-05", 3000]]));
  });

  it("sum exactly at the threshold flags nothing (strict boundary)", () => {
    const txs = [tx("1", "2026-05-10", 4000), tx("2", "2026-05-10", 4000), tx("3", "2026-05-10", 2000)];
    const { byTx, byMonth } = overLimit(txs, { kind: "sum", value: 10000 }, "frequent");
    expect(byTx.size).toBe(0);
    expect(byMonth.size).toBe(0);
  });

  it("fixed amount 49,00: only the transaction strictly over carries the excess", () => {
    const txs = [tx("1", "2026-05-10", 5500), tx("2", "2026-05-11", 4900), tx("3", "2026-05-12", 4500)];
    const { byTx, byMonth } = overLimit(txs, { kind: "amount", value: 4900 }, "fixed");
    expect(byTx).toEqual(new Map([["1", 600]]));
    expect(byMonth).toEqual(new Map([["2026-05", 600]]));
  });

  it("same-day tie breaks on numeric id order, regardless of input order", () => {
    const forward = [tx("9", "2026-05-10", 1000), tx("10", "2026-05-10", 2000)];
    const reversed = [tx("10", "2026-05-10", 2000), tx("9", "2026-05-10", 1000)];
    for (const txs of [forward, reversed]) {
      const { byTx } = overLimit(txs, { kind: "count", value: 1 }, "frequent");
      expect(byTx).toEqual(new Map([["10", 2000]]));
    }
  });

  it("a mismatched threshold kind yields empty maps", () => {
    const txs = [tx("1", "2026-05-10", 5500)];
    expect(overLimit(txs, { kind: "count", value: 1 }, "fixed").byTx.size).toBe(0);
    expect(overLimit(txs, { kind: "amount", value: 100 }, "frequent").byTx.size).toBe(0);
  });

  it("no threshold yields empty maps", () => {
    const txs = [tx("1", "2026-05-10", 5500)];
    const { byTx, byMonth } = overLimit(txs, null, "fixed");
    expect(byTx.size).toBe(0);
    expect(byMonth.size).toBe(0);
  });

  it("is independent of input order", () => {
    const sumTxs = [
      tx("1", "2026-05-10", 4000),
      tx("2", "2026-05-10", 4000),
      tx("3", "2026-05-10", 3000),
      tx("4", "2026-05-10", 2000),
    ];
    const amountTxs = [tx("1", "2026-05-10", 5500), tx("2", "2026-05-11", 4900), tx("3", "2026-05-12", 4500)];
    const sumThreshold: Threshold = { kind: "sum", value: 10000 };
    const amountThreshold: Threshold = { kind: "amount", value: 4900 };

    const sumExpected = overLimit(sumTxs, sumThreshold, "frequent");
    const amountExpected = overLimit(amountTxs, amountThreshold, "fixed");

    expect(overLimit([...sumTxs].reverse(), sumThreshold, "frequent")).toEqual(sumExpected);
    expect(overLimit([sumTxs[2], sumTxs[0], sumTxs[3], sumTxs[1]], sumThreshold, "frequent")).toEqual(sumExpected);
    expect(overLimit([...amountTxs].reverse(), amountThreshold, "fixed")).toEqual(amountExpected);
  });
});

describe("appliesTo", () => {
  it("count and sum apply to frequent, amount to fixed", () => {
    expect(appliesTo({ kind: "count", value: 1 }, "frequent")).toBe(true);
    expect(appliesTo({ kind: "sum", value: 1 }, "frequent")).toBe(true);
    expect(appliesTo({ kind: "amount", value: 1 }, "fixed")).toBe(true);
    expect(appliesTo({ kind: "count", value: 1 }, "fixed")).toBe(false);
    expect(appliesTo({ kind: "amount", value: 1 }, "frequent")).toBe(false);
  });
});

describe("monthOf", () => {
  it("takes the YYYY-MM prefix of an ISO date", () => {
    expect(monthOf("2026-05-20")).toBe("2026-05");
  });
});

describe("referenceMonth", () => {
  it("is the latest month across years", () => {
    expect(referenceMonth([{ occurredOn: "2025-12-31" }, { occurredOn: "2026-01-05" }])).toBe("2026-01");
    expect(referenceMonth([{ occurredOn: "2026-01-05" }, { occurredOn: "2025-12-31" }])).toBe("2026-01");
  });

  it("is null for no rows", () => {
    expect(referenceMonth([])).toBeNull();
  });
});

describe("previousMonth", () => {
  it.each([
    ["2026-08", "2026-07"],
    ["2026-01", "2025-12"],
    ["2026-10", "2026-09"],
  ])("%s → %s", (yearMonth, text) => {
    expect(previousMonth(yearMonth)).toBe(text);
  });
});
