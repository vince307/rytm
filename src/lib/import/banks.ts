// The banks this app can import a statement from (S-10). One source of truth for the payload schema (and so
// the endpoint's `p_source`) and the per-bank labels. Each reader still stamps its own literal (`source:
// "ing"` / `"santander"` in its payload builder, `bank` in detect.ts's DetectResult) — a new bank touches those
// too, and the database check `imports_source_check`.
export const BANK_SOURCES = ["ing", "santander"] as const;

export type BankSource = (typeof BANK_SOURCES)[number];

export function isBankSource(value: string): value is BankSource {
  return (BANK_SOURCES as readonly string[]).includes(value);
}

/**
 * Per-bank account label for the imports list and result screen (S-10 Phase 5, `copyExtra.imports.accountLabel`).
 * An unknown `source` falls back to the `ing` template, so a row can never crash the page.
 */
export function accountLabel(templates: Record<BankSource, string>, source: string, name: string): string {
  const template = isBankSource(source) ? templates[source] : templates.ing;
  // A function replacement (not a string) so an account name containing `$&` / `$1` renders verbatim instead of
  // being interpreted as a String.replace substitution pattern (S-10 follow-up F4).
  return template.replace("{name}", () => name);
}
