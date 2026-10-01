import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { buildPayload, detectStatement } from "@/lib/import/detect";

const INGFIX = new URL("../fixtures/ing/", import.meta.url);
const STFIX = new URL("../fixtures/santander/", import.meta.url);
const ING_MAIN = "Lista_transakcji_nr_0000123456_010926.csv";
const SANTANDER_MAIN = "historia_2026-08-31_61109012340001111222233334.csv";
const SANTANDER_USD = "historia_2026-08-31_77109056780009998887776665.csv";
const SANTANDER_ACCOUNT_NAME = "Rachunek";

const bytesOf = (base: URL, name: string) => new Uint8Array(readFileSync(new URL(name, base)));

describe("detectStatement", () => {
  it("detects the ING main fixture as ing", () => {
    const result = detectStatement(bytesOf(INGFIX, ING_MAIN), { santanderAccountName: SANTANDER_ACCOUNT_NAME });
    expect(result.ok).toBe(true);
    expect(result.ok && result.bank).toBe("ing");
  });

  it("detects the Santander main fixture as santander", () => {
    const result = detectStatement(bytesOf(STFIX, SANTANDER_MAIN), {
      santanderAccountName: SANTANDER_ACCOUNT_NAME,
    });
    expect(result.ok).toBe(true);
    expect(result.ok && result.bank).toBe("santander");
  });

  it("matches the Santander USD fixture as wrong-currency, not unknown-format (rule 1 matched first)", () => {
    const result = detectStatement(bytesOf(STFIX, SANTANDER_USD), {
      santanderAccountName: SANTANDER_ACCOUNT_NAME,
    });
    expect(result).toEqual({ ok: false, error: "wrong-currency" });
  });

  it("rejects empty and random bytes as unknown-format", () => {
    expect(detectStatement(new Uint8Array(), { santanderAccountName: SANTANDER_ACCOUNT_NAME })).toEqual({
      ok: false,
      error: "unknown-format",
    });
    let seed = 42;
    const random = Uint8Array.from({ length: 4096 }, () => (seed = (Math.imul(seed, 1103515245) + 12345) >>> 0) >>> 24);
    expect(detectStatement(random, { santanderAccountName: SANTANDER_ACCOUNT_NAME })).toEqual({
      ok: false,
      error: "unknown-format",
    });
  });
});

describe("buildPayload", () => {
  it("dispatches to the ING builder", () => {
    const result = detectStatement(bytesOf(INGFIX, ING_MAIN), { santanderAccountName: SANTANDER_ACCOUNT_NAME });
    if (!result.ok) throw new Error("expected ok");
    const payload = buildPayload(result, result.statement.defaultAccountNumber);
    expect(payload.source).toBe("ing");
    expect(payload.transactions.length).toBeGreaterThan(0);
  });

  it("dispatches to the Santander builder", () => {
    const result = detectStatement(bytesOf(STFIX, SANTANDER_MAIN), {
      santanderAccountName: SANTANDER_ACCOUNT_NAME,
    });
    if (!result.ok) throw new Error("expected ok");
    const payload = buildPayload(result, result.statement.defaultAccountNumber);
    expect(payload.source).toBe("santander");
    expect(payload.transactions).toHaveLength(184);
    expect(payload.transactions.every((t) => t.bankTxId === null)).toBe(true);
  });
});
