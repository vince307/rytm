/**
 * Kit contract: every key, index and placeholder the app reads from `design/rytm-os/react-kit/docs/content.json`.
 *
 * Red after a kit intake? Adapt the reader in `src/` or patch the kit (intake patch, precedent K12) — never edit an
 * assertion to match the new kit (CLAUDE.md red-test rule). Each assertion maps to a real read in `src/`.
 */
import { describe, expect, it } from "vitest";

import { copy, copyExtra } from "@/content/copy";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth-rules";
import { MAX_DEBITS, MAX_FILE_BYTES } from "@/lib/import/schema";
import { tableHeaders } from "@/lib/patterns/table-columns";

describe("kit contract (content.json as the app reads it)", () => {
  it("keeps the 4 authStates keys the login and reset pages read", () => {
    for (const key of ["loginError", "resetTitle", "resetBody", "checkInbox"] as const) {
      expect(copy.authStates[key], key).toEqual(expect.any(String));
      expect(copy.authStates[key].length, key).toBeGreaterThan(0);
    }
  });

  it("keeps the dashboard cards the home page renders (stats[0], stats[1])", () => {
    expect(copy.dashboard.stats.length).toBeGreaterThanOrEqual(2);
    for (const stat of copy.dashboard.stats) expect(stat.label.length).toBeGreaterThan(0);
    expect(copy.dashboard.stats[1].label).toBe("Koszty stałe");
  });

  it("keeps 7 pattern table columns, all mapped by tableHeaders", () => {
    expect(copy.patterns.columns).toHaveLength(7);
    const headers = tableHeaders(copy.patterns.columns);
    expect(headers).toHaveLength(7);
    for (const h of headers) expect(h.length).toBeGreaterThan(0);
  });

  it("keeps the placeholders the app fills", () => {
    expect(copy.fixedCosts.new).toContain("w {month}");
    expect(copyExtra.patterns.sumLabel).toContain("w {month}");
    expect(copyExtra.patterns.overInMonth).toContain("w {month}");
    expect(copy.trend.tooShort).toContain("{n}");
    expect(copy.authStates.passwordTooShort).toContain("{n}");
    expect(copy.resetNew.lead).toContain("{n}");
  });

  it("pins the numbers the app shares with the kit", () => {
    expect(copy.trend.minimumMonths).toBe(3); // PRD § Success Criteria: ≥ 3 miesiące
    expect(copy.authStates.passwordMinLength).toBe(MIN_PASSWORD_LENGTH);
  });

  it("has a locative for each of the 12 months", () => {
    expect(copyExtra.patterns.monthsLocative).toHaveLength(12);
  });

  it("keeps the import rejection messages, placeholders and limits the wizard fills (S-13)", () => {
    expect(copy.importErrors.tooLarge).toContain("{maxMb}");
    expect(copy.importErrors.tooMany).toContain("{maxTransactions}");
    expect(copy.importErrors.limits.maxMb * 1024 * 1024).toBe(MAX_FILE_BYTES);
    expect(copy.importErrors.limits.maxTransactions).toBe(MAX_DEBITS);
    expect(copy.importErrors.inconsistent.length).toBeGreaterThan(0);
    expect(copy.imports.formatRecognised).toContain("{bank}");
    expect(copy.imports.bankName.ing.length).toBeGreaterThan(0);
    expect(copy.imports.bankName.santander.length).toBeGreaterThan(0);
  });
});
