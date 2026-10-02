import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { parseIngStatement } from "@/lib/import/ing";
import { merchantKey } from "@/lib/patterns/merchant";
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

describe("santanderCardMerchant — rule 4 (code tokens)", () => {
  it.each([
    ["a store-code and a K.-code token are both dropped", "MARKA A12 K.3 GDYNIA", "MARKA"],
    ["a 1-2 digit code token (no NR/NO label) is dropped", "MARKA 01 GDYNIA", "MARKA"],
    ["a bare # token is dropped", "MARKA # GDYNIA", "MARKA"],
    ["a 3-letter+digits token is not code-shaped, kept as-is", "FIRMA ABC12 GDYNIA", "FIRMA ABC12"],
    ["a glued <word><digits> token loses only its digit tail", "SKLEP12345 GDYNIA", "SKLEP"],
    ["a lone numeric tail is kept, never emptied (first-token floor)", "12345 GDYNIA", "12345"],
    ["a code-shaped first token (brand, not a store code) is kept", "4F SKLEP GDYNIA", "4F SKLEP"],
    ["a numeric first token (brand, not a store code) is kept", "5 SMAKOW GDYNIA", "5 SMAKOW"],
  ])("%s: %s -> %s", (_label, merchant, expected) => {
    expect(santanderCardMerchant(merchant, paymentTitle(merchant))).toBe(expected);
  });

  it("two different-city tails with 1-2 digit code tokens (no NR/NO label) collapse to the same result", () => {
    const a = santanderCardMerchant("MARKA 01 GDYNIA", paymentTitle("MARKA 01 GDYNIA"));
    const b = santanderCardMerchant("MARKA 22 KRAKOW", paymentTitle("MARKA 22 KRAKOW"));
    expect(a).toBe(b);
    expect(a).toBe("MARKA");
  });

  it("the NR guard protects a 1-2 digit number from being dropped as a code token", () => {
    const a = santanderCardMerchant("SKLEP NR 12 GDYNIA", paymentTitle("SKLEP NR 12 GDYNIA"));
    const b = santanderCardMerchant("SKLEP NR 7 GDYNIA", paymentTitle("SKLEP NR 7 GDYNIA"));
    expect(a).toBe("SKLEP NR 12");
    expect(b).toBe("SKLEP NR 7");
    expect(a).not.toBe(b);
  });
});

describe("santanderCardMerchant — BLIK withdrawal gate", () => {
  it("matches the fixture's `:<11 digits>` end shape", () => {
    const title = "Wypłata BLIK WYPLATA GOTOWKI:50617283940";
    expect(santanderCardMerchant("WYPLATA BLIK GOTOWKA", title)).toBe("Wypłata BLIK");
  });

  it("also matches the real export's ` ref:<11 digits>` end shape", () => {
    const title = "Wypłata BLIK WYPLATA GOTOWKI ref:98765432109";
    expect(santanderCardMerchant("INNY KONTRAHENT", title)).toBe("Wypłata BLIK");
  });

  it("two BLIK withdrawal titles with different counterparties and end shapes key the same", () => {
    const a = santanderCardMerchant("WYPLATA BLIK GOTOWKA", "Wypłata BLIK WYPLATA GOTOWKI:50617283940");
    const b = santanderCardMerchant("INNY KONTRAHENT", "Wypłata BLIK WYPLATA GOTOWKI ref:98765432109");
    expect(a).toBe(b);
    expect(merchantKey(a ?? "")).toBe("wypłata blik");
  });

  it("returns null for an ING-shaped BLIK withdrawal title (no `:<11 digits>` end)", () => {
    const title = "Wypłata BLIK 12.06.2026 Nr transakcji 123456789012345";
    expect(santanderCardMerchant("SOME OPERATOR", title)).toBeNull();
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
