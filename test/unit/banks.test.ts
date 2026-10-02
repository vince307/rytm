import { describe, expect, it } from "vitest";

import { accountLabel, BANK_SOURCES, isBankSource } from "@/lib/import/banks";

const templates = { ing: "ING · {name}", santander: "Santander · {name}" };

describe("BANK_SOURCES / isBankSource", () => {
  it("lists ing and santander", () => {
    expect(BANK_SOURCES).toEqual(["ing", "santander"]);
  });

  it("accepts a known source", () => {
    expect(isBankSource("ing")).toBe(true);
    expect(isBankSource("santander")).toBe(true);
  });

  it("rejects an unknown source", () => {
    expect(isBankSource("mbank")).toBe(false);
  });
});

describe("accountLabel", () => {
  it("fills the ING template", () => {
    expect(accountLabel(templates, "ing", "Rachunek Firmowy Główny")).toBe("ING · Rachunek Firmowy Główny");
  });

  it("fills the Santander template", () => {
    expect(accountLabel(templates, "santander", "Rachunek")).toBe("Santander · Rachunek");
  });

  it("falls back to the ing template for an unknown source", () => {
    expect(accountLabel(templates, "mbank", "Rachunek")).toBe("ING · Rachunek");
  });

  it("inserts a name containing $& / $1 verbatim (S-10 F4)", () => {
    expect(accountLabel(templates, "ing", "Konto $& $1 Testowe")).toBe("ING · Konto $& $1 Testowe");
  });
});
