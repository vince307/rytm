/**
 * Kit contract: every key, index and placeholder the app reads from `design/rytm-os/react-kit/docs/content.json`.
 *
 * Red after a kit intake? Adapt the reader in `src/` or patch the kit (intake patch, precedent K12) — never edit an
 * assertion to match the new kit (CLAUDE.md red-test rule). Each assertion maps to a real read in `src/`.
 */
import { describe, expect, it } from "vitest";

import { field, fieldBox, focusRing } from "@/components/app/field-styles";
import { buttonVariants } from "@/components/ui/button";
import { dialogContentClass } from "@/components/ui/dialog";
import { copy, copyExtra } from "@/content/copy";
import { DELETE_CONFIRM_WORD, MIN_PASSWORD_LENGTH } from "@/lib/auth-rules";
import { MAX_DEBITS, MAX_FILE_BYTES } from "@/lib/import/schema";

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

  it("keeps 7 pattern table columns in kit order (Kwota before Suma), read straight from copy.patterns.columns", () => {
    expect(copy.patterns.columns).toHaveLength(7);
    for (const h of copy.patterns.columns) expect(h.length).toBeGreaterThan(0);
    expect(copy.patterns.columns[3]).toBe("Kwota");
    expect(copy.patterns.columns[4]).toBe("Suma");
  });

  it("keeps the placeholders the app fills", () => {
    expect(copy.fixedCosts.new).toContain("w {month}");
    expect(copy.patternDetail.sumLabel).toContain("w {month}");
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

  it("keeps the import templates and plural forms the wizard and the delete dialog fill (S-13 review F1)", () => {
    // ImportWizard splits `overlap` at `{range}` — without it the range link would silently vanish.
    expect(copy.importErrors.overlap.split("{range}")).toHaveLength(2);
    expect(copy.imports.deleteTitle).toContain("{range}");
    expect(copy.importFlow.importButton).toContain("{n}");
    expect(copy.importFlow.importButton).toContain("{debits}");
    // new.astro casts `importFlow.debitForms` to a 3-tuple for `plural()`.
    expect(copy.importFlow.debitForms).toHaveLength(3);
  });

  it("keeps the auth keys confirm-email and reset/new read (S-12 P7)", () => {
    // ResendButton fills `{seconds}`; without it the countdown would show a static label.
    expect(copy.confirmEmail.resendCountdown).toContain("{seconds}");
    for (const key of ["newPassword", "repeatPassword", "passwordMismatch"] as const) {
      expect(copy.authStates[key].length, key).toBeGreaterThan(0);
    }
  });

  it("keeps the settings keys /settings reads (S-12 P3)", () => {
    const s = copy.settings;
    for (const key of [
      "logout",
      "passwordSuccess",
      "passwordInvalid",
      "saveError",
      "demoPasswordBlocked",
      "demoDeleteBlocked",
      "deleteError",
      "deletePassword",
      "deleteConfirm",
      "deleteButton",
      "deleteDisabledHelp",
      "deletedNotice",
    ] as const) {
      expect(s[key].length, key).toBeGreaterThan(0);
    }
    // The dialog's confirmation hint must name the word the server compares against.
    expect(s.deleteConfirm).toContain(DELETE_CONFIRM_WORD);
  });

  it("pins the shared field / focus / box classes and the round-3 dialog geometry (S-14 p4)", () => {
    expect(field).toContain("rounded-[8px]");
    expect(field).toContain("focus-within:ring-ink/12");
    expect(field).toContain("focus-within:text-ink");
    expect(focusRing).toContain("focus-visible:ring-ink/15");
    for (const cls of focusRing.split(" ")) expect(buttonVariants()).toContain(cls);
    expect(fieldBox).toContain("rounded-[8px]");
    expect(fieldBox).toContain("bg-paper");
    for (const cls of ["p-[26px]", "max-[559px]:px-[18px]", "max-[559px]:py-[22px]", "w-[calc(100%-32px)]"]) {
      expect(dialogContentClass).toContain(cls);
    }
  });
});
