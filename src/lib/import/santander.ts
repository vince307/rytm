// Santander Bank Polska statement reader (context/foundation/import-formats.md, Santander rules 1–7, D2, D7).
// Pure module, no Node imports: runs in the browser (import wizard) and in Vitest. The dialect is ported from
// the oracle reader scripts/fixture-santander-check.mjs (parseLine, CARD, rawMerchantOf) — a deliberate
// independent copy (S-10 Phase 6), not a shared import: the oracle checks the fixture against the generator,
// this reader runs against arbitrary bytes from the wizard.
import { isDate, toMinor, type ParseError, type StatementAccount } from "@/lib/import/common";
import type { ImportPayload } from "@/lib/import/schema";

export interface SantanderRow {
  account: string;
  occurredOn: string;
  /** Signed, in grosze, as in the file: negative = debit. */
  amountMinor: number;
  counterparty: string;
  title: string;
  details: string;
}

export interface SantanderStatement {
  /** Always one entry: a Santander export covers a single account. */
  accounts: StatementAccount[];
  defaultAccountNumber: string;
  /** D7: start = header col 1, end = header col 0 (the export date; Santander has no explicit range end). */
  period: { start: string; end: string };
  rows: SantanderRow[];
}

export type SantanderParseResult = { ok: true; statement: SantanderStatement } | { ok: false; error: ParseError };

const YMD = /^\d{4}-\d{2}-\d{2}$/;
const DMY = /^\d{2}-\d{2}-\d{4}$/;
const AMOUNT = /^-?\d+,\d{2}$/;
const HEADER_ACCOUNT = /^'\d{2}( \d{4}){6}$/;
// Card description (rule 5's regex): mask, action, amount with a dot, currency, ASCII tail.
const CARD =
  /^DOP\. VISA (\d{6}\*{6}\d{4}) (PŁATNOŚĆ KARTĄ|ZWROT PŁATNOŚCI KARTĄ|WYPŁATA Z BANKOMATU KARTĄ) (\d+\.\d{2}) ([A-Z]{3}) (.+)$/;

interface Field {
  value: string;
  quoted: boolean;
}

class FormatError extends Error {}

// One line of the Santander dialect: `,` separator, `"` quote char. NOT strict RFC 4180: a `"` opens a quoted
// field only at field start; a bare field may hold `"` elsewhere (a quoted merchant name inside an unquoted
// card description, ST15). There is no `""` escape: a quote inside a quoted field that does not close it is a
// format violation.
function parseLine(line: string): Field[] {
  const fields: Field[] = [];
  let i = 0;
  for (;;) {
    if (line[i] === '"') {
      let value = "";
      i++;
      for (;;) {
        if (i >= line.length) throw new FormatError("unterminated quoted field");
        if (line[i] === '"') {
          if (i + 1 < line.length && line[i + 1] === '"') throw new FormatError('"" escape not allowed');
          if (i + 1 === line.length || line[i + 1] === ",") {
            i++;
            break;
          }
          throw new FormatError("stray quote inside quoted field");
        }
        value += line[i++];
      }
      fields.push({ value, quoted: true });
    } else {
      const end = line.indexOf(",", i);
      const value = line.slice(i, end === -1 ? line.length : end);
      fields.push({ value, quoted: false });
      i = end === -1 ? line.length : end;
    }
    if (i >= line.length) return fields;
    i++; // skip ,
  }
}

const collapse = (s: string) => s.trim().replace(/\s+/g, " ");

// Rule 5 (import-formats.md): card regex tail; else counterparty (col 3); else the description (col 2).
function rawMerchantOf(description: string, counterparty: string): string {
  const m = CARD.exec(description);
  if (m) return collapse(m[5]);
  if (counterparty) return collapse(counterparty);
  return collapse(description);
}

function dmyToIso(dmy: string): string {
  const [d, m, y] = dmy.split("-");
  return `${y}-${m}-${d}`;
}

function isValidDmy(value: string): boolean {
  return DMY.test(value) && isDate(dmyToIso(value));
}

function decodeStrictUtf8(bytes: Uint8Array): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch (e) {
    throw new FormatError(`not strict UTF-8: ${(e as Error).message}`);
  }
}

function splitLines(text: string): string[] {
  const lines = text.split(/\r?\n/);
  if (lines[lines.length - 1] === "") lines.pop();
  if (!lines.length) throw new FormatError("file is empty");
  return lines;
}

// Rule 1 + the cheap part of format detection (detect.ts): does line 1 look like a Santander header at all,
// without running the full reader? Used to decide whether a Santander failure is final (never falls through
// to the ING reader) — see import-formats.md § Wykrywanie formatu and the plan's Critical Implementation
// Details.
export function looksLikeSantander(bytes: Uint8Array): boolean {
  let text: string;
  try {
    text = decodeStrictUtf8(bytes);
  } catch {
    return false;
  }
  let lines: string[];
  try {
    lines = splitLines(text);
  } catch {
    return false;
  }
  let fields: Field[];
  try {
    fields = parseLine(lines[0]);
  } catch {
    return false;
  }
  return fields.length === 9 && YMD.test(fields[0].value) && fields[2].value.startsWith("'");
}

function readStatement(bytes: Uint8Array, accountName: string): SantanderParseResult {
  const text = decodeStrictUtf8(bytes);
  const lines = splitLines(text);
  const parsed = lines.map((line) => parseLine(line));

  parsed.forEach((f, i) => {
    if (f.length !== 9) throw new FormatError(`line ${i + 1}: ${f.length} fields, expected 9`);
    if (f[8].value !== "" || f[8].quoted) throw new FormatError(`line ${i + 1}: col 8 (last) must be empty`);
  });

  const hf = parsed[0];
  const h = hf.map((f) => f.value);
  if (!YMD.test(h[0])) throw new FormatError("header col 0 is not YYYY-MM-DD");
  if (!isValidDmy(h[1])) throw new FormatError("header col 1 is not a valid DD-MM-YYYY");
  if (!HEADER_ACCOUNT.test(h[2])) throw new FormatError("header col 2 is not '<2 digits><6x4-digit groups>");
  if (!/^\d+$/.test(h[7])) throw new FormatError("header col 7 is not a bare integer");

  const exportDate = h[0];
  const rangeStart = dmyToIso(h[1]);
  if (rangeStart > exportDate) throw new FormatError("header start (col 1) is after the export date (col 0)");

  const accountNumber = h[2].replace(/['\s]/g, "");

  const rows: SantanderRow[] = [];
  for (let i = 1; i < parsed.length; i++) {
    const f = parsed[i];
    const v = f.map((x) => x.value);
    const at = `line ${i + 1}`;
    if (!isValidDmy(v[0])) throw new FormatError(`${at}: col 0 (booking date) is not a valid DD-MM-YYYY`);
    if (!isValidDmy(v[1])) throw new FormatError(`${at}: col 1 (operation date) is not a valid DD-MM-YYYY`);
    if (!AMOUNT.test(v[5])) throw new FormatError(`${at}: col 5 (amount) is not a signed amount`);

    const occurredOn = dmyToIso(v[1]);
    if (occurredOn < rangeStart || occurredOn > exportDate) {
      throw new FormatError(`${at}: operation date ${occurredOn} outside [${rangeStart}, ${exportDate}] (R1)`);
    }

    rows.push({
      account: accountNumber,
      occurredOn,
      amountMinor: toMinor(v[5]),
      counterparty: rawMerchantOf(v[2], v[3]),
      title: v[2].trim(),
      details: "",
    });
  }
  if (rows.length !== Number(h[7])) throw new FormatError(`header col 7 (${h[7]}) != data row count (${rows.length})`);

  // Rule 2 only once the structure holds, as in ING.
  if (h[4] !== "PLN") return { ok: false, error: "wrong-currency" };

  const debits = rows.filter((r) => r.amountMinor < 0).length;
  const account: StatementAccount = {
    name: accountName,
    number: accountNumber,
    rows: rows.length,
    debits,
    credits: rows.length - debits,
  };

  return {
    ok: true,
    statement: {
      accounts: [account],
      defaultAccountNumber: accountNumber,
      period: { start: rangeStart, end: exportDate },
      rows,
    },
  };
}

/** `opts.accountName` is never read from the file (S-10 decision 5 — Santander has no owner-name-free column;
 * the reader never reads header col 3, the real owner's name). */
export function parseSantanderStatement(bytes: Uint8Array, opts: { accountName: string }): SantanderParseResult {
  try {
    return readStatement(bytes, opts.accountName);
  } catch (e) {
    if (e instanceof FormatError) return { ok: false, error: "unknown-format" };
    throw e;
  }
}

/** The debits (D2) of the statement's one account, as absolute amounts in file order, `bankTxId: null` (no
 * per-row id exists — import-formats.md rule 7), with the header period (D7). */
export function buildSantanderPayload(statement: SantanderStatement, accountNumber: string): ImportPayload {
  const account = statement.accounts.find((a) => a.number === accountNumber);
  if (!account) throw new Error(`account ${accountNumber} is not in the statement`);
  return {
    source: "santander",
    accountNumber,
    accountName: account.name,
    periodStart: statement.period.start,
    periodEnd: statement.period.end,
    transactions: statement.rows
      .filter((r) => r.account === accountNumber && r.amountMinor < 0)
      .map((r) => ({
        occurredOn: r.occurredOn,
        amountMinor: -r.amountMinor,
        bankTxId: null,
        counterparty: r.counterparty,
        title: r.title,
        details: r.details,
      })),
  };
}
