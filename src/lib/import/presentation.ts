// Presentation helpers shared by every import surface (S-13): the wizard, the history list and the result page
// derive the same strings here, so unit tests pin them and the three screens cannot drift. Pure module.
import type { copy } from "@/content/copy";
import { isBankSource, type BankSource } from "@/lib/import/banks";
import type { FileError } from "@/lib/import/detect";
import { formatAccountTail } from "@/lib/format";

/**
 * Fills `{placeholder}`s. A function replacement (S-10 F4) so a value containing `$&` /
 * `$1` renders verbatim; an unknown placeholder stays literal.
 */
export function fillTemplate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));
}

/** The bank's own name (kit `imports.bankName`); an unknown source falls back to `ing`, so a row never crashes. */
export function bankDisplayName(names: Record<BankSource, string>, source: string): string {
  return names[isBankSource(source) ? source : "ing"];
}

/** The kit's account cell: `{account_name} · •• {last 4}` (the bank has its own cell). */
export function accountDisplay(name: string, accountNumber: string): string {
  return `${name} · ${formatAccountTail(accountNumber)}`;
}

type ImportErrors = typeof copy.importErrors;

/** `importErrors.tooMany` with the limit filled — shared by the wizard's step 3 and the unit tests. */
export function tooManyMessage(errors: ImportErrors): string {
  return fillTemplate(errors.tooMany, { maxTransactions: errors.limits.maxTransactions });
}

/** One kit message per file-level rejection; the size limit is filled from `importErrors.limits`. */
export function fileErrorMessage(errors: ImportErrors, error: FileError): string {
  return error === "tooLarge" ? fillTemplate(errors.tooLarge, { maxMb: errors.limits.maxMb }) : errors[error];
}
