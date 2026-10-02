// The banks this app can import a statement from (S-10). One source of truth for the payload schema,
// the endpoint and (Phase 4+) format detection — never hard-code the two literals elsewhere.
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
  return template.replace("{name}", name);
}
