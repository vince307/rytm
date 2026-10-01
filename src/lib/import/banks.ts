// The banks this app can import a statement from (S-10). One source of truth for the payload schema,
// the endpoint and (Phase 4+) format detection — never hard-code the two literals elsewhere.
export const BANK_SOURCES = ["ing", "santander"] as const;

export type BankSource = (typeof BANK_SOURCES)[number];

export function isBankSource(value: string): value is BankSource {
  return (BANK_SOURCES as readonly string[]).includes(value);
}
