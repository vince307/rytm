import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { parseIngStatement } from "@/lib/import/ing";
import { santanderCardMerchant } from "@/lib/patterns/santander-card";

// Synthetic values only (no fixture bytes) — this pins the card gate and the rule 2/3/5 tail logic directly,
// independent of what the Santander reader's CARD regex happens to extract in any given fixture row.
const paymentTitle = (merchant: string, mask = "123456******1234") =>
  `DOP. VISA ${mask} PŁATNOŚĆ KARTĄ 12.34 PLN ${merchant}`;
const atmTitle = (mask = "123456******1234") =>
  `DOP. VISA ${mask} WYPŁATA Z BANKOMATU KARTĄ 50.00 PLN UL PRZYKLADOWA 5 WARSZAWA`;

describe("santanderCardMerchant — payment kind (rules 2, 3, 5)", () => {
  it.each([
    ["a 2-token tail keeps its first token", "KWIACIARNIA GDYNIA", "KWIACIARNIA"],
    ["a 1-token tail is kept", "PIEKARNIA", "PIEKARNIA"],
    ["a 2-word city is dropped", "SKLEP ROWEROWY SUCHA BESKIDZKA", "SKLEP ROWEROWY"],
    ["a truncated second word is dropped", "APTEKA TESTOWA NOWY TA", "APTEKA TESTOWA"],
    [
      "the near miss keeps a city-prefix word that is not at the tail boundary",
      "BAR MLECZNY POD ZIELONA GORKA NOWY SACZ",
      "BAR MLECZNY POD ZIELONA GORKA",
    ],
    ["a repeated city is dropped once", "SALON RADOM RADOM", "SALON"],
    ["a quote mid-tail becomes a space", 'KINO "NOVA" SALA DUZA GDANSK', "KINO NOVA SALA DUZA"],
    ["a quote at the tail start becomes a space", '"SKLEP" WARSZAWA', "SKLEP"],
    ["case is preserved (no folding here)", "Marka App Zakopane", "Marka App"],
  ])("%s: %s -> %s", (_label, merchant, expected) => {
    expect(santanderCardMerchant(merchant, paymentTitle(merchant))).toBe(expected);
  });

  it("the card mask does not affect the result", () => {
    const a = santanderCardMerchant("KWIACIARNIA GDYNIA", paymentTitle("KWIACIARNIA GDYNIA", "111111******1111"));
    const b = santanderCardMerchant("KWIACIARNIA GDYNIA", paymentTitle("KWIACIARNIA GDYNIA", "222222******2222"));
    expect(a).toBe(b);
    expect(a).toBe("KWIACIARNIA");
  });
});

describe("santanderCardMerchant — ATM kind (rule 1)", () => {
  it("returns Bankomat for a dot-less `UL ` address, regardless of the counterparty tail", () => {
    expect(santanderCardMerchant("UL PRZYKLADOWA 5 WARSZAWA", atmTitle())).toBe("Bankomat");
  });

  it("the card mask does not affect the ATM result either", () => {
    expect(santanderCardMerchant("AL. TESTOWA 12 KRAKOW", atmTitle("999999******9999"))).toBe("Bankomat");
  });
});

describe("santanderCardMerchant — null outside the card gate", () => {
  it("returns null for a card refund (ZWROT PŁATNOŚCI KARTĄ, not in the gate)", () => {
    const title = "DOP. VISA 123456******1234 ZWROT PŁATNOŚCI KARTĄ 12.34 PLN SKLEP PRZYKLAD WARSZAWA";
    expect(santanderCardMerchant("SKLEP PRZYKLAD WARSZAWA", title)).toBeNull();
  });

  it("returns null for a BLIK purchase", () => {
    expect(santanderCardMerchant("KSIEGARNIA PRZYKLAD", "Zakup BLIK KSIEGARNIA PRZYKLAD:12345678901")).toBeNull();
  });

  it("returns null for a transfer title", () => {
    expect(santanderCardMerchant("ANNA NOWAK", "Przelew środków")).toBeNull();
  });

  it("returns null for an ING-style title", () => {
    expect(santanderCardMerchant("KINOTEKA SP. Z O.O.", "Płatność kartą")).toBeNull();
  });

  it("returns null for every title of the ING main fixture", () => {
    const bytes = readFileSync(new URL("../fixtures/ing/Lista_transakcji_nr_0000123456_010926.csv", import.meta.url));
    const result = parseIngStatement(new Uint8Array(bytes));
    if (!result.ok) throw new Error(result.error);
    expect(result.statement.rows.length).toBeGreaterThan(0);
    for (const row of result.statement.rows) {
      expect(santanderCardMerchant(row.counterparty, row.title)).toBeNull();
    }
  });
});
