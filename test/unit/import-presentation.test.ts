import { describe, expect, it } from "vitest";
import { copy } from "@/content/copy";
import {
  accountDisplay,
  bankDisplayName,
  fileErrorMessage,
  fillTemplate,
  tooManyMessage,
} from "@/lib/import/presentation";

describe("fillTemplate", () => {
  it("renders a value containing $& verbatim", () => {
    expect(fillTemplate("Konto {name}", { name: "A$&B$1" })).toBe("Konto A$&B$1");
  });

  it("keeps an unknown placeholder literal", () => {
    expect(fillTemplate("{a} i {b}", { a: 1 })).toBe("1 i {b}");
  });
});

describe("bankDisplayName", () => {
  it("names both banks and falls back to ING for an unknown source", () => {
    expect(bankDisplayName(copy.imports.bankName, "santander")).toBe("Santander Bank Polska");
    expect(bankDisplayName(copy.imports.bankName, "ing")).toBe("ING Bank Śląski");
    expect(bankDisplayName(copy.imports.bankName, "mbank")).toBe("ING Bank Śląski");
  });
});

describe("accountDisplay", () => {
  it("drops the bank prefix and appends the tail", () => {
    expect(accountDisplay("Rachunek", "61 1090 1234 0001 1112 2223 0099")).toBe("Rachunek · •• 0099");
    expect(accountDisplay("Konto smoke", "61109012340001111222230099")).toBe("Konto smoke · •• 0099");
  });
});

describe("file error messages", () => {
  it("fills the size limit for tooLarge", () => {
    expect(fileErrorMessage(copy.importErrors, "tooLarge")).toBe("Plik przekracza limit 5 MB. Wybierz mniejszy plik.");
  });

  it("returns the kit text for the other rejections", () => {
    expect(fileErrorMessage(copy.importErrors, "empty")).toBe(copy.importErrors.empty);
    expect(fileErrorMessage(copy.importErrors, "wrongCurrency")).toBe(copy.importErrors.wrongCurrency);
    expect(fileErrorMessage(copy.importErrors, "unknownFormat")).toBe(copy.importErrors.unknownFormat);
  });

  it("fills the debit limit for tooMany", () => {
    expect(tooManyMessage(copy.importErrors)).toContain("ponad 5000 obciążeń");
    expect(tooManyMessage(copy.importErrors)).not.toContain("{");
  });
});
