// Merchant extraction (import-formats.md rule 7 / D3) and normalization (PRD FR-006).
// Pure and deterministic: the same bank description always yields the same key and display name.
// Rule order in `normalizeMerchant` is load-bearing — changing it re-keys merchants (S-04/S-05 store rows by key).
// S-11: the Santander step (`santanderCardMerchant`) runs first in `rawMerchant` — a Santander card payment, ATM
// or `Wypłata BLIK` row's raw merchant comes from there; everything else (including every ING row, which never
// matches its gates) falls through to the rule 7 / D3 operator logic below, unchanged.
import { santanderCardMerchant } from "@/lib/patterns/santander-card";

/**
 * Payment operators (import-formats.md rule 7 / D3), matched case-insensitively against `Dane kontrahenta`.
 * Mirror of `OPERATORS` in scripts/fixture-ing.mjs. PRD Open Question 2: the list lives here, not in config/DB.
 */
export const OPERATORS: readonly string[] = ["PayPro", "PayU", "Cashbill", "Autopay", "ING Pay"];

const collapse = (s: string) => s.trim().replace(/\s+/g, " ");

/**
 * Rule 7 / D3: a payment through an operator names the merchant by the last token of the `Tytuł` tail after
 * `Nr transakcji <digits>` (the merchant's domain); otherwise — or with an empty tail — the counterparty itself.
 * Same behaviour as `rawMerchant` in scripts/fixture-ing.mjs. The Santander step (S-11) is checked first; it
 * returns non-null only for a Santander card/ATM or `Wypłata BLIK` title, so an ING row is never affected.
 */
export function rawMerchant(counterparty: string, title: string): string {
  const card = santanderCardMerchant(counterparty, title);
  if (card !== null) return card;
  const lower = counterparty.toLowerCase();
  const isOperator = OPERATORS.some((op) => lower.includes(op.toLowerCase()));
  if (isOperator) {
    const tail = (/Nr transakcji \d+\s*(.*)$/.exec(title)?.[1] ?? "").trim();
    if (tail) return tail.split(/\s+/).pop() ?? tail;
  }
  return collapse(counterparty);
}

const SCHEME = /^(https?:\/\/)?(www\.)?/i;
const ADDRESS = /\s(UL|AL)\.\s.*$/i;
// Alternation order matters: `S.A.R.L.` before `S.A.`, the bare `SA` last.
const LEGAL_FORM = /\s(SP\.\s?Z\s?O\.\s?O\.|SP\.\s?J\.|SP\.\s?K\.|S\.A\.R\.L\.|S\.C\.A|S\.C\.|S\.A\.|SA)(\s|$).*/i;
const STORE_NUMBER = /^\d{3,}$/;

// `X X rest` → `X rest`, longest repeated prefix first (T02: `PIEKARNIA KŁOSEK PIEKARNIA KŁOSEK ŁÓDŹ`).
function dropDoubledPrefix(tokens: string[]): string[] {
  for (let k = Math.floor(tokens.length / 2); k >= 1; k--) {
    const same = tokens.slice(0, k).every((t, i) => t === tokens[k + i]);
    if (same) return [...tokens.slice(0, k), ...tokens.slice(2 * k)];
  }
  return tokens;
}

/** Display form of a raw merchant, case preserved. Rules apply in the order listed in the plan (FR-006). */
export function normalizeMerchant(raw: string): string {
  const base = collapse(raw).normalize("NFC");
  let s = base;
  s = s.replace(SCHEME, "").replace(/\/+$/, ""); // 2. scheme, www., trailing slash
  s = s.replace(ADDRESS, ""); // 3. address from ` UL. ` / ` AL. `
  s = s.replace(LEGAL_FORM, ""); // 4. legal form and everything after it
  let tokens = s.split(" ").filter((t) => t && !STORE_NUMBER.test(t)); // 5. store numbers (T03)
  tokens = dropDoubledPrefix(tokens); // 6. doubled name (T02)
  const result = collapse(tokens.join(" ")); // 7.
  return result || base;
}

/** Grouping key: the normalized name, lower-cased (Polish locale). */
export function merchantKey(raw: string): string {
  return normalizeMerchant(raw).toLocaleLowerCase("pl-PL");
}
