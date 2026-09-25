import { describe, expect, it } from "vitest";

import { importPayloadSchema, MAX_DEBITS, type ImportPayload } from "@/lib/import/schema";

const transaction = (occurredOn = "2026-05-10"): ImportPayload["transactions"][number] => ({
  occurredOn,
  amountMinor: 1299,
  bankTxId: "310400000000236170",
  counterparty: "SKLEP",
  title: "Płatność BLIK",
  details: "TR.BLIK",
});

const payload = (overrides: Partial<ImportPayload> = {}): ImportPayload => ({
  accountNumber: "11111100000000000000000001",
  accountName: "Rachunek Firmowy Główny",
  periodStart: "2026-05-01",
  periodEnd: "2026-05-31",
  transactions: [transaction()],
  ...overrides,
});

const valid = (value: unknown) => importPayloadSchema.safeParse(value).success;

describe("importPayloadSchema", () => {
  it("accepts a well-formed payload", () => {
    expect(valid(payload())).toBe(true);
  });

  it(`accepts ${MAX_DEBITS} transactions and rejects one more or none`, () => {
    expect(valid(payload({ transactions: Array.from({ length: MAX_DEBITS }, () => transaction()) }))).toBe(true);
    expect(valid(payload({ transactions: Array.from({ length: MAX_DEBITS + 1 }, () => transaction()) }))).toBe(false);
    expect(valid(payload({ transactions: [] }))).toBe(false);
  });

  it("rejects a transaction dated outside the period", () => {
    expect(valid(payload({ transactions: [transaction("2026-06-01")] }))).toBe(false);
    expect(valid(payload({ transactions: [transaction("2026-04-30")] }))).toBe(false);
    expect(valid(payload({ transactions: [transaction("2026-05-01"), transaction("2026-05-31")] }))).toBe(true);
  });

  it("rejects a period that ends before it starts", () => {
    expect(valid(payload({ periodStart: "2026-06-01", periodEnd: "2026-05-31", transactions: [] }))).toBe(false);
    expect(valid(payload({ periodStart: "2026-05-31", periodEnd: "2026-05-01" }))).toBe(false);
  });

  it("rejects an amount that is not a positive integer", () => {
    for (const amountMinor of [0, -100, 12.5]) {
      expect(valid(payload({ transactions: [{ ...transaction(), amountMinor }] }))).toBe(false);
    }
  });

  it("rejects a malformed account number or transaction id", () => {
    for (const accountNumber of [
      "1111110000000000000000000",
      "11 1111 0000 0000 0000 0000 0001",
      "PL11111100000000000000000001",
    ]) {
      expect(valid(payload({ accountNumber }))).toBe(false);
    }
    expect(valid(payload({ transactions: [{ ...transaction(), bankTxId: "'310400000000236170'" }] }))).toBe(false);
  });

  it("rejects an empty account name and over-long text fields", () => {
    expect(valid(payload({ accountName: "" }))).toBe(false);
    expect(valid(payload({ transactions: [{ ...transaction(), title: "x".repeat(501) }] }))).toBe(false);
  });
});
