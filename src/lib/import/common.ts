// Bank-agnostic pieces shared by every statement reader (S-10). Pure module, no Node imports: runs in the
// browser (import wizard) and in Vitest. `ing.ts` and `santander.ts` each keep their own line dialect
// (different separators and quoting rules) — only the pieces that do not depend on a dialect live here.

/** A parse failure the wizard shows to the user (no detail beyond the kind: import-formats.md). */
export type ParseError = "unknown-format" | "wrong-currency";

/** One account found in a statement, with the row counts an import's step 2 shows (D1/D2). */
export interface StatementAccount {
  /** Display name — ING reads it from the preamble; Santander has none in the file (S-10 decision 5), so the
   * reader is given one by its caller. */
  name: string;
  /** Account number, digits only. */
  number: string;
  rows: number;
  /** Rows with amountMinor < 0 — the ones an import takes (D2). */
  debits: number;
  /** Rows with amountMinor >= 0 — skipped by an import (D2). */
  credits: number;
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** `YYYY-MM-DD`, and a real calendar date (rejects 2026-02-30). */
export function isDate(value: string): boolean {
  if (!DATE.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

/** `-116,85` / `18,50` → signed grosze. Decimal comma, no thousands separator, minus = debit. */
export function toMinor(amount: string): number {
  const [whole, frac] = amount.replace("-", "").split(",");
  return (amount.startsWith("-") ? -1 : 1) * (Number(whole) * 100 + Number(frac));
}
