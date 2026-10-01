// ING Bank Śląski statement reader (context/foundation/import-formats.md, ING rules 1–8, D1, D2, D7).
// Pure module, no Node imports: runs in the browser (import wizard) and in Vitest. The dialect follows the
// reference reader in scripts/fixture-ing-check.mjs (cp1250, lenient quotes for T19, searched header).
// Deliberate independent copy of santander.ts's line reader (S-10 Phase 6): the two dialects differ (`;` vs
// `,`, quote-escaping rules), so only the bank-agnostic pieces (common.ts) are shared.
import { isDate, toMinor, type ParseError, type StatementAccount } from "@/lib/import/common";
import type { ImportPayload } from "@/lib/import/schema";

/** Name as in the `Konto` column (preamble name without ` (PLN)`), and account number from the preamble. */
export type IngAccount = StatementAccount;

export interface IngRow {
  /** Account number (the row's `Konto` name resolved through the preamble). */
  account: string;
  occurredOn: string;
  /** Signed, in grosze, as in the file: negative = debit. */
  amountMinor: number;
  bankTxId: string;
  counterparty: string;
  title: string;
  details: string;
}

export interface IngStatement {
  accounts: IngAccount[];
  /** D1: the account with the most rows (first in the preamble on a tie). */
  defaultAccountNumber: string;
  /** D7: `Zakres dat` from the preamble. */
  period: { start: string; end: string };
  rows: IngRow[];
}

export type IngParseError = ParseError;
export type IngParseResult = { ok: true; statement: IngStatement } | { ok: false; error: IngParseError };

const WIDTH = 21;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const AMOUNT = /^-?\d+,\d{2}$/;

interface Field {
  value: string;
  quoted: boolean;
}

class FormatError extends Error {}

// One line of the ING dialect: `;` separator, `"` quote char. ING does not escape quotes inside a quoted field
// (T19: `" PHU "NAZWA" … "`), so a `"` closes the field only before `;` or the end of the line.
function parseLine(line: string): Field[] {
  const fields: Field[] = [];
  let i = 0;
  for (;;) {
    if (line[i] === '"') {
      let value = "";
      i++;
      for (;;) {
        if (i >= line.length) throw new FormatError("unterminated quoted field");
        if (line[i] === '"' && (i + 1 === line.length || line[i + 1] === ";")) {
          i++;
          break;
        }
        value += line[i++];
      }
      fields.push({ value, quoted: true });
    } else {
      const end = line.indexOf(";", i);
      const value = line.slice(i, end === -1 ? line.length : end);
      if (value.includes('"')) throw new FormatError("quote inside a bare field");
      fields.push({ value, quoted: false });
      i = end === -1 ? line.length : end;
    }
    if (i >= line.length) return fields;
    i++; // skip ;
  }
}

// A cp1250 export with Polish letters is never valid UTF-8 (the bank header alone has `Ś`), so bytes that
// decode as UTF-8 and contain non-ASCII are a re-saved file whose names would turn into mojibake.
function looksLikeUtf8(bytes: Uint8Array): boolean {
  if (!bytes.some((b) => b >= 0x80)) return false;
  try {
    new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return true;
  } catch {
    return false;
  }
}

function readStatement(bytes: Uint8Array): IngParseResult {
  if (looksLikeUtf8(bytes)) throw new FormatError("UTF-8 bytes, expected cp1250");
  const lines = new TextDecoder("windows-1250").decode(bytes).split(/\r?\n/);
  const parsed = lines.map(parseLine);
  const cell = (at: number, f: number): Field => parsed[at]?.[f] ?? { value: "", quoted: false };
  const find = (label: string) => parsed.findIndex((f) => f[0]?.quoted && f[0].value === label);

  // Rule 1 + format detection.
  if (!(cell(0, 0).quoted && cell(0, 0).value === "Lista transakcji")) throw new FormatError("not an ING export");

  // Rule 2: accounts, `Zakres dat` and `Liczba transakcji` from the preamble.
  const accountsAt = find("Wybrane rachunki:");
  if (accountsAt === -1) throw new FormatError('no "Wybrane rachunki:"');
  const accounts: { name: string; number: string }[] = [];
  for (let i = accountsAt + 1; i < lines.length && lines[i] !== ""; i++) {
    const name = /^(.+) \([A-Z]{3}\)$/.exec(cell(i, 0).value)?.[1];
    const number = cell(i, 2).value;
    if (!name || !cell(i, 0).quoted || !/^\d+( \d+)*$/.test(number)) throw new FormatError("bad account line");
    accounts.push({ name, number: number.replace(/\s+/g, "") });
  }
  if (!accounts.length) throw new FormatError("no accounts");

  const rangeAt = find("Zakres dat:");
  if (rangeAt === -1) throw new FormatError('no "Zakres dat:"');
  const range = /^(\d{4}-\d{2}-\d{2}) - (\d{4}-\d{2}-\d{2})$/.exec(cell(rangeAt, 1).value);
  if (!range || !isDate(range[1]) || !isDate(range[2]) || range[1] > range[2]) throw new FormatError("bad range");
  const period = { start: range[1], end: range[2] };
  const count = cell(rangeAt, 6);
  if (cell(rangeAt, 5).value !== "Liczba transakcji:" || count.quoted || !/^\d+$/.test(count.value)) {
    throw new FormatError('no "Liczba transakcji:"');
  }

  // Header is searched, not counted: the preamble grows with the number of accounts.
  const headerAt = find("Data transakcji");
  if (headerAt === -1) throw new FormatError('no "Data transakcji" header');

  // Data rows: every line after the header whose first field is a bare date; everything else is the footer.
  const byName = new Map(accounts.map((a) => [a.name, a.number]));
  const rows: IngRow[] = [];
  let foreignCurrency = false;
  for (const f of parsed.slice(headerAt + 1)) {
    if (!f[0] || f[0].quoted || !DATE.test(f[0].value)) continue;
    if (f.length !== WIDTH) throw new FormatError("data row width");
    const v = f.map((x) => x.value);
    const account = byName.get(v[14]);
    if (!isDate(v[0]) || !AMOUNT.test(v[8]) || account === undefined) throw new FormatError("bad data row");
    if (v[0] < period.start || v[0] > period.end) throw new FormatError("date outside Zakres dat");
    if (v[9] !== "PLN") foreignCurrency = true;
    rows.push({
      account,
      occurredOn: v[0],
      amountMinor: toMinor(v[8]),
      bankTxId: v[7].replace(/['\s]/g, ""),
      counterparty: v[2].trim(),
      title: v[3].trim(),
      details: v[6].trim(),
    });
  }
  if (rows.length !== Number(count.value)) throw new FormatError("row count differs from Liczba transakcji");

  // Rule 5 only once the structure holds.
  if (foreignCurrency) return { ok: false, error: "wrong-currency" };

  const withCounts = accounts.map((a) => {
    const own = rows.filter((r) => r.account === a.number);
    const debits = own.filter((r) => r.amountMinor < 0).length;
    return { ...a, rows: own.length, debits, credits: own.length - debits };
  });
  const defaultAccount = withCounts.reduce((best, a) => (a.rows > best.rows ? a : best), withCounts[0]);
  return {
    ok: true,
    statement: { accounts: withCounts, defaultAccountNumber: defaultAccount.number, period, rows },
  };
}

export function parseIngStatement(bytes: Uint8Array): IngParseResult {
  try {
    return readStatement(bytes);
  } catch (e) {
    if (e instanceof FormatError) return { ok: false, error: "unknown-format" };
    throw e;
  }
}

/** The debits (D2) of one account (D1), as absolute amounts in file order, with the preamble period (D7). */
export function buildImportPayload(statement: IngStatement, accountNumber: string): ImportPayload {
  const account = statement.accounts.find((a) => a.number === accountNumber);
  if (!account) throw new Error(`account ${accountNumber} is not in the statement`);
  return {
    source: "ing",
    accountNumber,
    accountName: account.name,
    periodStart: statement.period.start,
    periodEnd: statement.period.end,
    transactions: statement.rows
      .filter((r) => r.account === accountNumber && r.amountMinor < 0)
      .map((r) => ({
        occurredOn: r.occurredOn,
        amountMinor: -r.amountMinor,
        bankTxId: r.bankTxId,
        counterparty: r.counterparty,
        title: r.title,
        details: r.details,
      })),
  };
}
