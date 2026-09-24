// Fixture gate (F-02): npm run fixture:check. Exit 1 with a list of errors, 0 when test/fixtures/ing/ is clean.
// 1. Bytes on disk == generate() output, no extra files (catches hand edits and broken determinism).
// 2. Every CSV re-read from disk with this file's own reader (independent of the generator) against the ING
//    format contract in context/foundation/import-formats.md: cp1250 + LF, preamble, header, per-field quoting.
// 3. expected.json against the parsed rows: D1 default account, D2 debits only, D5 pattern types, D6/T16, T01–T19.
// 4. Reject files: the condition named by `reason` holds, and no other reject condition does.
// Also exports the small CSV reader used by scripts/fixture-ing-shape.mjs.

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { TextDecoder, TextEncoder } from "node:util";

const FIXTURE_DIR = path.resolve(import.meta.dirname, "../test/fixtures/ing");
const WIDTH = 21;
export const COLUMN_NAMES = [
  "Data transakcji",
  "Data księgowania",
  "Dane kontrahenta",
  "Tytuł",
  "Nr rachunku",
  "Nazwa banku",
  "Szczegóły",
  "Nr transakcji",
  "Kwota transakcji (waluta rachunku)",
  "Waluta",
  "Kwota blokady/zwolnienie blokady",
  "Waluta",
  "Kwota płatności w walucie",
  "Waluta",
  "Konto",
];
export const FOOTER = "Dokument ma charakter informacyjny, nie stanowi dowodu księgowego";
export const DATE = /^\d{4}-\d{2}-\d{2}$/;
const AMOUNT = /^-?\d+,\d{2}$/;
const TX_ID = /^'\d{18}'$/;
const ACCOUNT_NO = /^'(\d{26}|\d{7}\\\d{5}) '$/;
const DETAILS = /^(TR\.BLIK|PRZELEW|P\.BLIK|PRZ SP)( {2}| Ref SP: \S+ )$/;
// Data-row quoting per field (import-formats.md): Q = always quoted, B = bare and non-empty, E = empty and bare,
// x = quoted when present, bare when empty (Nazwa banku; Nr rachunku is B-or-empty, checked below).
const QUOTING = "BBQQ-xQBBBEEEEQEEEEEE";
const TRAP_IDS = Array.from({ length: 19 }, (_, i) => `T${String(i + 1).padStart(2, "0")}`);

// cp1250 via the platform decoder only: the byte -> char table comes from TextDecoder, not from the generator.
const decoder = new TextDecoder("windows-1250");
const ENCODE = new Map();
for (let b = 0; b < 256; b++) {
  const ch = decoder.decode(Uint8Array.of(b));
  if (ch !== "\uFFFD" && !ENCODE.has(ch)) ENCODE.set(ch, b);
}

export function decodeCp1250(bytes) {
  const text = decoder.decode(bytes);
  const back = Array.from(text, (ch) => ENCODE.get(ch) ?? -1);
  const roundTrip = back.length === bytes.length && back.every((b, i) => b === bytes[i]);
  return { text, roundTrip };
}

// One CSV line in the ING dialect (import-formats.md): `;` separator, `"` quote char, no multi-line fields.
// ING does not escape quotes inside a quoted field (T19: `" PHU "NAZWA" … "`), so a `"` closes the field only
// when followed by `;` or the end of the line; any other `"` is a literal character. There is no `""` escape:
// `""` inside a value is two literal quotes (an empty field `""` still reads as empty, its second `"` precedes `;`).
// Returns [{ value, quoted }] or throws on an unterminated quoted field.
export function parseLine(line) {
  const fields = [];
  let i = 0;
  for (;;) {
    if (line[i] === '"') {
      let value = "";
      i++;
      for (;;) {
        if (i >= line.length) throw new Error("unterminated quoted field");
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
      if (value.includes('"')) throw new Error("quote inside a bare field");
      fields.push({ value, quoted: false });
      i = end === -1 ? line.length : end;
    }
    if (i >= line.length) return fields;
    i++; // skip ;
  }
}

export const toMinor = (amount) => {
  const [whole, frac] = amount.replace("-", "").split(",");
  return (amount.startsWith("-") ? -1 : 1) * (Number(whole) * 100 + Number(frac));
};

// Parses one statement from disk bytes; format problems go to `errors` (prefixed with the file name).
function readStatement(name, bytes, errors) {
  const err = (msg) => errors.push(`${name}: ${msg}`);
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) err("starts with a UTF-8 BOM");
  if (bytes.includes(0x0d)) err("contains CR; line endings must be LF only");
  if (bytes[bytes.length - 1] !== 0x0a) err("does not end with a newline");
  const { text, roundTrip } = decodeCp1250(bytes);
  if (!roundTrip) err("cp1250 decode/encode round-trip differs from the bytes on disk");
  const lines = text.split("\n");
  if (lines[lines.length - 1] === "") lines.pop();
  const parsed = lines.map((line, i) => {
    try {
      return parseLine(line);
    } catch (e) {
      err(`line ${i + 1}: ${e.message}`);
      return [{ value: line, quoted: false }];
    }
  });
  const cell = (i, f) => parsed[i]?.[f] ?? { value: "", quoted: false };
  const isEmptyLine = (i) => lines[i] === "";

  // Preamble.
  if (!(cell(0, 0).quoted && cell(0, 0).value === "Lista transakcji"))
    err('line 1 does not start with "Lista transakcji"');
  const find = (label) => parsed.findIndex((f) => f[0]?.quoted && f[0].value === label);
  const accounts = [];
  const accountsAt = find("Wybrane rachunki:");
  if (accountsAt === -1) err('no "Wybrane rachunki:" line');
  else {
    for (let i = accountsAt + 1; i < lines.length && !isEmptyLine(i); i++) {
      const f = parsed[i];
      const m = /^(.+) \(PLN\)$/.exec(f[0]?.value ?? "");
      const number = f[2]?.value ?? "";
      if (!(f.length === 4 && f[0].quoted && m && f[1].value === "" && f[2].quoted && /^\d+( \d+)+$/.test(number))) {
        err(`line ${i + 1}: account line is not "<name> (PLN)";;"<number in groups>";`);
        continue;
      }
      accounts.push({ name: m[1], number: number.replace(/\s+/g, "") });
    }
  }
  let period = null;
  let declaredCount = null;
  const rangeAt = find("Zakres dat:");
  if (rangeAt === -1) err('no "Zakres dat:" line');
  else {
    const m = /^(\d{4}-\d{2}-\d{2}) - (\d{4}-\d{2}-\d{2})$/.exec(cell(rangeAt, 1).value);
    if (m) period = { start: m[1], end: m[2] };
    else err(`line ${rangeAt + 1}: "Zakres dat:" value is not "YYYY-MM-DD - YYYY-MM-DD"`);
    const count = cell(rangeAt, 6);
    if (cell(rangeAt, 5).value !== "Liczba transakcji:" || count.quoted || !/^\d+$/.test(count.value)) {
      err(`line ${rangeAt + 1}: "Liczba transakcji:";N (bare integer) not in fields 5–6 of the "Zakres dat:" line`);
    } else declaredCount = Number(count.value);
  }
  const sums = {};
  for (const [kind, label] of [
    ["credit", "Suma uznań"],
    ["debit", "Suma obciążeń"],
  ]) {
    const at = parsed.findIndex((f) => f[5]?.quoted && f[5].value.startsWith(`${label} (`));
    const m = at === -1 ? null : /\((\d+)\):$/.exec(cell(at, 5).value);
    if (!m || !/^\d+,\d{2}$/.test(cell(at, 6).value) || cell(at, 7).value !== "PLN") {
      err(`no "${label} (N):";<unsigned amount>;PLN line`);
    } else sums[kind] = { count: Number(m[1]), minor: toMinor(cell(at, 6).value) };
  }

  // Header: searched, not counted; expected right after the preamble (18 lines + one per account).
  const headerAt = parsed.findIndex((f) => f[0]?.quoted && f[0].value === "Data transakcji");
  if (headerAt !== -1) {
    if (headerAt + 1 !== 18 + accounts.length) {
      err(`header on line ${headerAt + 1}, expected ${18 + accounts.length} (18 + ${accounts.length} accounts)`);
    }
    const f = parsed[headerAt];
    const okHeader =
      f.length === WIDTH &&
      COLUMN_NAMES.every((n, i) => f[i].quoted && f[i].value === n) &&
      f.slice(COLUMN_NAMES.length).every((x) => !x.quoted && x.value === "");
    if (!okHeader) err(`line ${headerAt + 1}: header is not the 15 quoted column names + 6 empty fields`);
  }

  // Data rows: every line whose first field is a bare date (rule: data rows recognised by the date regex).
  const rows = [];
  parsed.forEach((f, i) => {
    if (f[0]?.quoted || !DATE.test(f[0]?.value ?? "")) return;
    const at = `line ${i + 1}`;
    if (f.length !== WIDTH) {
      err(`${at}: ${f.length} fields, expected ${WIDTH}`);
      return;
    }
    [...QUOTING].forEach((q, k) => {
      const { value, quoted } = f[k];
      const ok =
        q === "-"
          ? !quoted
          : q === "Q"
            ? quoted
            : q === "B"
              ? !quoted && value !== ""
              : q === "E"
                ? !quoted && value === ""
                : quoted === (value !== "");
      if (!ok) err(`${at}: field ${k} quoting/emptiness breaks pattern ${q}`);
    });
    const v = f.map((x) => x.value);
    if (!DATE.test(v[1])) err(`${at}: Data księgowania is not YYYY-MM-DD`);
    else if (v[1] < v[0]) err(`${at}: Data księgowania before Data transakcji`);
    if (!v[2].startsWith(" ") || !v[2].endsWith(" ")) err(`${at}: Dane kontrahenta must start and end with a space`);
    if (!v[3].startsWith(" ")) err(`${at}: Tytuł must start with a space`);
    if (v[4] !== "" && !ACCOUNT_NO.test(v[4])) err(`${at}: Nr rachunku is neither empty nor '<number> '`);
    if ((v[4] === "") !== (v[5] === "")) err(`${at}: Nazwa banku present without Nr rachunku or vice versa`);
    if (!DETAILS.test(v[6])) err(`${at}: Szczegóły is not "<TYPE>  " or "<TYPE> Ref SP: <ref> "`);
    if (!TX_ID.test(v[7])) err(`${at}: Nr transakcji is not '<18 digits>'`);
    if (!AMOUNT.test(v[8])) err(`${at}: amount is not -?digits,dd`);
    if (!accounts.some((a) => a.name === v[14])) err(`${at}: Konto is not an account from "Wybrane rachunki:"`);
    if (period && (v[0] < period.start || v[0] > period.end)) err(`${at}: date outside "Zakres dat:"`);
    rows.push({
      line: i + 1,
      occurredOn: v[0],
      bankTxId: v[7].replace(/['\s]/g, ""),
      amountMinor: AMOUNT.test(v[8]) ? toMinor(v[8]) : 0,
      currency: v[9],
      account: v[14],
      counterparty: v[2],
      raw: lines[i],
    });
  });

  // Layout: rows directly after the header (or the preamble), then 2 empty lines + footer, nothing else.
  const firstRowAt = headerAt === -1 ? 17 + accounts.length : headerAt + 1;
  if (rows.length && rows[0].line !== firstRowAt + 1)
    err(`first data row on line ${rows[0].line}, expected ${firstRowAt + 1}`);
  const afterRows = firstRowAt + rows.length;
  if (rows.some((r, k) => r.line !== firstRowAt + 1 + k)) err("data rows are not contiguous");
  const tail = lines.slice(afterRows);
  if (!(tail.length === 3 && tail[0] === "" && tail[1] === "" && tail[2] === `"${FOOTER}";`)) {
    err('after the data rows expected exactly 2 empty lines and the footer line "<footer>";');
  }

  if (declaredCount !== null && declaredCount !== rows.length) {
    err(`"Liczba transakcji:" ${declaredCount} != ${rows.length} data rows`);
  }
  const credits = rows.filter((r) => r.amountMinor > 0);
  const debits = rows.filter((r) => r.amountMinor < 0);
  const abs = (list) => list.reduce((s, r) => s + Math.abs(r.amountMinor), 0);
  if (sums.credit && (sums.credit.count !== credits.length || sums.credit.minor !== abs(credits))) {
    err('"Suma uznań" does not match the credit rows');
  }
  if (sums.debit && (sums.debit.count !== debits.length || sums.debit.minor !== abs(debits))) {
    err('"Suma obciążeń" does not match the debit rows');
  }
  const keys = new Set(rows.map((r) => `${r.bankTxId}|${r.account}`));
  if (keys.size !== rows.length) err("(Nr transakcji, Konto) is not unique");
  return { accounts, period, declaredCount, headerAt, rows };
}

const median = (values) => {
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

function checkManifest(name, stmt, entry, expected, errors) {
  const err = (msg) => errors.push(`${name} (expected.json): ${msg}`);
  const counts = stmt.accounts.map((a) => ({ ...a, rows: stmt.rows.filter((r) => r.account === a.name).length }));
  const defaultAccount = counts.reduce((best, c) => (c.rows > best.rows ? c : best), counts[0])?.name;
  if (entry.defaultAccount !== defaultAccount)
    err(`defaultAccount ${entry.defaultAccount}, D1 gives ${defaultAccount}`);
  const accountsOk =
    entry.accounts.length === counts.length &&
    counts.every(
      (c, i) =>
        entry.accounts[i].name === c.name &&
        entry.accounts[i].preambleName === `${c.name} (PLN)` &&
        entry.accounts[i].number === c.number &&
        entry.accounts[i].rows === c.rows,
    );
  if (!accountsOk) err("accounts[] differ from the preamble / per-account row counts");
  if (JSON.stringify(entry.period) !== JSON.stringify(stmt.period)) err('period differs from "Zakres dat:"');
  if (entry.declaredCount !== stmt.declaredCount) err('declaredCount differs from "Liczba transakcji:"');

  const manifestRows = expected.rows.filter((r) => r.file === name);
  if (manifestRows.length !== stmt.rows.length)
    err(`${manifestRows.length} rows[] entries for ${stmt.rows.length} data rows`);
  stmt.rows.forEach((row, i) => {
    const m = manifestRows[i];
    if (!m) return;
    const at = `rows[] line ${row.line}`;
    for (const k of ["line", "bankTxId", "account", "occurredOn", "amountMinor"]) {
      if (m[k] !== row[k]) err(`${at}: ${k} ${JSON.stringify(m[k])} != file ${JSON.stringify(row[k])}`);
    }
    const skipReason = row.account !== defaultAccount ? "other-account" : row.amountMinor >= 0 ? "credit" : null;
    if (m.skipReason !== skipReason || m.imported !== (skipReason === null)) {
      err(`${at}: imported/skipReason ${m.imported}/${m.skipReason}, D1/D2 give ${skipReason === null}/${skipReason}`);
    }
    if (m.imported !== (m.pattern !== null)) err(`${at}: pattern must be set exactly for imported rows`);
    // T19: Dane kontrahenta holds a literal `"` written undoubled inside the quoted field.
    if (m.traps.includes("T19")) {
      const inner = row.counterparty.trim();
      const rawField = `"${row.counterparty}"`;
      if (!/[^"]"[^"]/.test(inner) || inner.includes('""') || !row.raw.includes(`;${rawField};`)) {
        err(`${at}: T19 row has no unescaped inner quote in Dane kontrahenta`);
      }
    }
  });
  const imported = manifestRows.filter((r) => r.imported);
  const sumMinor = imported.reduce((s, r) => s - r.amountMinor, 0);
  if (entry.imported.count !== imported.length || entry.imported.sumMinor !== sumMinor) {
    err(`imported ${JSON.stringify(entry.imported)} != rows (${imported.length}, ${sumMinor})`);
  }
  return imported;
}

function checkPatterns(importedRows, mainPeriod, expected, errors) {
  const err = (msg) => errors.push(`expected.json patterns: ${msg}`);
  const { pct, minMinor } = expected.tolerance;
  const groups = new Map();
  for (const r of importedRows) groups.set(r.pattern, [...(groups.get(r.pattern) ?? []), r]);
  const keys = new Set(expected.patterns.map((p) => p.key));
  for (const key of groups.keys()) if (!keys.has(key)) err(`rows reference pattern ${key} missing from patterns[]`);
  for (const p of expected.patterns) {
    const rows = groups.get(p.key) ?? [];
    if (!rows.length) {
      err(`${p.key}: no imported rows`);
      continue;
    }
    const amounts = rows.map((r) => -r.amountMinor);
    const m = median(amounts);
    const tolerance = Math.max((m * pct) / 100, minMinor);
    const outside = amounts.filter((a) => Math.abs(a - m) > tolerance).length;
    if (p.type === "fixed" && outside) err(`${p.key}: fixed but ${outside} amount(s) outside D5 tolerance`);
    if (p.type === "frequent" && amounts.length >= 2 && !outside) err(`${p.key}: frequent but every amount within D5`);
    if (!["fixed", "frequent"].includes(p.type)) err(`${p.key}: unknown type ${p.type}`);
    const firstMonth = rows.map((r) => r.occurredOn.slice(0, 7)).sort()[0];
    const sum = amounts.reduce((s, a) => s + a, 0);
    if (
      p.occurrences !== rows.length ||
      p.sumMinor !== sum ||
      p.medianMinor !== Math.round(m) ||
      p.firstMonth !== firstMonth
    ) {
      err(`${p.key}: occurrences/sumMinor/medianMinor/firstMonth differ from its rows`);
    }
    const traps = [...new Set(rows.flatMap((r) => r.traps))].sort();
    if (JSON.stringify(traps) !== JSON.stringify(p.traps)) err(`${p.key}: traps differ from its rows`);
  }
  const t16 = expected.patterns.filter((p) => p.traps.includes("T16"));
  const lastMonth = mainPeriod.end.slice(0, 7);
  if (t16.length !== 1 || t16[0].firstMonth !== lastMonth || t16[0].type !== "fixed") {
    err(`T16 must be one fixed pattern with firstMonth ${lastMonth}`);
  }
  const seen = new Set(expected.rows.flatMap((r) => r.traps));
  const missing = TRAP_IDS.filter((t) => !seen.has(t));
  if (missing.length) err(`traps without rows: ${missing.join(", ")}`);
}

// The three reject conditions, evaluated on the parsed file; a reject file must trip exactly its own.
function rejectConditions(stmt, okStatements) {
  return {
    "no-header": stmt.headerAt === -1,
    currency: stmt.rows.some((r) => r.currency !== "PLN"),
    overlap: okStatements.some(
      (ok) =>
        stmt.period &&
        ok.period &&
        stmt.accounts.some((a) => ok.accounts.some((b) => b.number === a.number)) &&
        stmt.period.start <= ok.period.end &&
        ok.period.start <= stmt.period.end,
    ),
  };
}

export async function check() {
  const errors = [];
  const { generate } = await import("./fixture-ing.mjs");
  const generated = generate();
  const onDisk = readdirSync(FIXTURE_DIR).filter((f) => !f.startsWith("."));
  const bytesOf = (name) => new Uint8Array(readFileSync(path.join(FIXTURE_DIR, name)));

  // 1. Byte equality with the generator.
  for (const name of onDisk)
    if (!(name in generated)) errors.push(`${name}: not produced by the generator (extra file)`);
  for (const [name, content] of Object.entries(generated)) {
    if (!onDisk.includes(name)) {
      errors.push(`${name}: missing on disk (run npm run fixture:ing)`);
      continue;
    }
    const want = typeof content === "string" ? new TextEncoder().encode(content) : content;
    const have = bytesOf(name);
    const diff = want.findIndex((b, i) => b !== have[i]);
    if (diff !== -1 || want.length !== have.length) {
      const at = diff === -1 ? Math.min(want.length, have.length) : diff;
      const line = have.subarray(0, at).filter((b) => b === 0x0a).length + 1;
      errors.push(
        `${name}: differs from generator output at byte ${at} (line ${line}); edit the generator, not the file`,
      );
    }
  }

  // 2–4 on the files as they are on disk.
  let expected;
  try {
    expected = JSON.parse(readFileSync(path.join(FIXTURE_DIR, "expected.json"), "utf8"));
  } catch (e) {
    errors.push(`expected.json: ${e.message}`);
    return errors;
  }
  const csvs = onDisk.filter((f) => f.endsWith(".csv"));
  for (const name of csvs) if (!(name in expected.files)) errors.push(`${name}: no entry in expected.json files`);
  const statements = {};
  for (const name of Object.keys(expected.files)) {
    if (!csvs.includes(name)) errors.push(`${name}: listed in expected.json but missing on disk`);
    else statements[name] = readStatement(name, bytesOf(name), errors);
  }
  const okNames = Object.keys(statements).filter((n) => expected.files[n].expect === "ok");
  if (!okNames.length) errors.push("expected.json: no file with expect ok");
  const importedRows = [];
  for (const name of okNames) {
    const stmt = statements[name];
    const conditions = rejectConditions(stmt, []);
    for (const [reason, hit] of Object.entries(conditions))
      if (hit) errors.push(`${name}: ok file trips reject condition ${reason}`);
    importedRows.push(...checkManifest(name, stmt, expected.files[name], expected, errors));
  }
  const knownFiles = new Set(Object.keys(expected.files));
  for (const r of expected.rows) {
    if (!knownFiles.has(r.file) || expected.files[r.file].expect !== "ok")
      errors.push(`rows[] line ${r.line}: file ${r.file} is not an ok file`);
  }
  if (okNames.length) checkPatterns(importedRows, statements[okNames[0]].period, expected, errors);

  const okStatements = okNames.map((n) => statements[n]);
  for (const [name, stmt] of Object.entries(statements)) {
    const entry = expected.files[name];
    if (entry.expect === "ok") continue;
    if (entry.expect !== "reject") {
      errors.push(`${name}: expect must be ok or reject`);
      continue;
    }
    const conditions = rejectConditions(stmt, okStatements);
    if (!(entry.reason in conditions)) errors.push(`${name}: unknown reason ${entry.reason}`);
    else if (!conditions[entry.reason]) errors.push(`${name}: reason ${entry.reason} does not hold in the file`);
    for (const [reason, hit] of Object.entries(conditions)) {
      if (hit && reason !== entry.reason) errors.push(`${name}: also trips ${reason}; a reject file tests one rule`);
    }
    if (entry.reason === "overlap" && !okNames.includes(entry.overlapsWith))
      errors.push(`${name}: overlapsWith is not an ok file`);
    if (entry.imported.count !== 0 || entry.imported.sumMinor !== 0)
      errors.push(`${name}: reject file must import nothing`);
  }
  for (const reason of ["overlap", "no-header", "currency"]) {
    if (!Object.values(expected.files).some((f) => f.expect === "reject" && f.reason === reason)) {
      errors.push(`expected.json: no reject file with reason ${reason}`);
    }
  }
  return errors;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const errors = await check();
  if (errors.length) {
    console.error(`fixture:check FAILED (${errors.length}):`);
    for (const e of errors.slice(0, 50)) console.error(`  - ${e}`);
    if (errors.length > 50) console.error(`  … and ${errors.length - 50} more`);
    process.exit(1);
  }
  console.log("fixture:check OK — test/fixtures/ing/ matches the generator and the ING format contract");
}
