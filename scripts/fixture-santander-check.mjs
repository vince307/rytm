// Fixture gate (F-03): part of npm run fixture:check. Independent of scripts/fixture-santander.mjs: re-reads
// test/fixtures/santander/ from disk with this file's own reader against the Santander format contract in
// context/foundation/import-formats.md (header invariants, quoting, D2/D5/D7) and the expected.json manifest.
// 1. Bytes on disk == generate() output, no extra files (catches hand edits and broken determinism).
// 2. Every CSV re-read from disk, independently of the generator: UTF-8, LF, 9-field lines, header/data-row
//    shape, header invariants (opening/closing, Lp 1 == unique max booking date, file-name == header col 0/2).
// 3. expected.json against the parsed rows: D2 (debits only), rule 5 (rawMerchant), D5 (fixed/frequent),
//    every TRAPS id has a row, crossBank patterns exist on both sides of the ING oracle.
// 4. Reject file: the condition named by `reason` (only `currency` in this slice) holds, and an ok file never
//    trips it.
// Also exports the small CSV reader (parseLine, toMinor, DMY/YMD, CARD) for scripts/fixture-santander-shape.mjs
// (Phase 3) — the only Santander CSV reader in the repo.

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { TextDecoder, TextEncoder } from "node:util";

const FIXTURE_DIR = path.resolve(import.meta.dirname, "../test/fixtures/santander");

export const YMD = /^\d{4}-\d{2}-\d{2}$/;
export const DMY = /^\d{2}-\d{2}-\d{4}$/;
const AMOUNT = /^-?\d+,\d{2}$/;
const HEADER_ACCOUNT = /^'\d{2}( \d{4}){6}$/;
const FILENAME_RE = /^historia_(\d{4}-\d{2}-\d{2})_(\d{26})\.csv$/;
// Card description (rule 5's regex): mask, action, amount with a dot, currency, ASCII tail.
export const CARD =
  /^DOP\. VISA (\d{6}\*{6}\d{4}) (PŁATNOŚĆ KARTĄ|ZWROT PŁATNOŚCI KARTĄ|WYPŁATA Z BANKOMATU KARTĄ) (\d+\.\d{2}) ([A-Z]{3}) (.+)$/;
// Over this many data rows, the file must show the ST12 adjacent-inversion trait (the real export's shape);
// the small reject file (3 rows, strictly descending by design) never does and is not held to it.
const INVERSION_ROW_THRESHOLD = 10;

// One CSV line in the Santander dialect: `,` separator, `"` quote char, RFC-style (no `""` escape — the
// generator refuses a value containing `"`, so any quote inside a quoted field, or a bare field holding a
// quote, is a format violation here, not an escape to decode). Returns [{ value, quoted }] or throws.
export function parseLine(line) {
  const fields = [];
  let i = 0;
  for (;;) {
    if (line[i] === '"') {
      let value = "";
      i++;
      for (;;) {
        if (i >= line.length) throw new Error("unterminated quoted field");
        if (line[i] === '"') {
          if (i + 1 < line.length && line[i + 1] === '"') throw new Error('"" escape not allowed');
          if (i + 1 === line.length || line[i + 1] === ",") {
            i++;
            break;
          }
          throw new Error("stray quote inside quoted field");
        }
        value += line[i++];
      }
      fields.push({ value, quoted: true });
    } else {
      const end = line.indexOf(",", i);
      const value = line.slice(i, end === -1 ? line.length : end);
      if (value.includes('"')) throw new Error("quote inside a bare field");
      fields.push({ value, quoted: false });
      i = end === -1 ? line.length : end;
    }
    if (i >= line.length) return fields;
    i++; // skip ,
  }
}

export const toMinor = (amount) => {
  const [whole, frac] = amount.replace("-", "").split(",");
  return (amount.startsWith("-") ? -1 : 1) * (Number(whole) * 100 + Number(frac));
};

const dmyToIso = (dmy) => {
  const [d, m, y] = dmy.split("-");
  return `${y}-${m}-${d}`;
};

const collapse = (s) => s.trim().replace(/\s+/g, " ");

// Rule 5 (import-formats.md): card regex tail; else counterparty (col 3); else the description (col 2).
export function rawMerchantOf(description, counterparty) {
  const m = CARD.exec(description);
  if (m) return collapse(m[5]);
  if (counterparty) return collapse(counterparty);
  return collapse(description);
}

// Data-row col 4: grouped digits, bare — groups of 4 except a shorter final group, never a leading `'`.
function isGroupedDigits(value) {
  const groups = value.split(" ");
  return groups.every(
    (g, i) => /^\d+$/.test(g) && (i === groups.length - 1 ? g.length <= 4 && g.length >= 1 : g.length === 4),
  );
}

const median = (values) => {
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

// Parses one statement from disk bytes; format problems go to `errors` (prefixed with the file name).
// Returns null when the file cannot be decoded/split at all (nothing further to check structurally).
function readStatement(name, bytes, errors) {
  const err = (msg) => errors.push(`${name}: ${msg}`);
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) err("starts with a UTF-8 BOM");
  if (bytes.includes(0x0d)) err("contains CR; line endings must be LF only");
  if (bytes[bytes.length - 1] !== 0x0a) err("does not end with a newline");
  let text;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch (e) {
    err(`invalid UTF-8: ${e.message}`);
    return null;
  }
  const lines = text.split("\n");
  if (lines[lines.length - 1] === "") lines.pop();
  if (!lines.length) {
    err("file is empty");
    return null;
  }
  const parsed = lines.map((line, i) => {
    try {
      return parseLine(line);
    } catch (e) {
      err(`line ${i + 1}: ${e.message}`);
      return [];
    }
  });
  const cell = (f, i) => f[i] ?? { value: "", quoted: false };
  parsed.forEach((f, i) => {
    if (f.length !== 9) err(`line ${i + 1}: ${f.length} fields, expected 9`);
    else if (cell(f, 8).value !== "" || cell(f, 8).quoted) err(`line ${i + 1}: field 8 (last) must be empty`);
  });

  const hf = parsed[0];
  const h = Array.from({ length: 9 }, (_, i) => cell(hf, i).value);
  if (!YMD.test(h[0])) err("header col 0 is not YYYY-MM-DD");
  if (!DMY.test(h[1])) err("header col 1 is not DD-MM-YYYY");
  if (!HEADER_ACCOUNT.test(h[2])) err("header col 2 is not '<2 digits><6x4-digit groups>");
  if (!/^[A-Z]{3}$/.test(h[4])) err("header col 4 is not a 3-letter currency code");
  if (!(cell(hf, 5).quoted && AMOUNT.test(h[5]))) err("header col 5 (opening) must be a quoted -?digits,dd");
  if (!(cell(hf, 6).quoted && AMOUNT.test(h[6]))) err("header col 6 (closing) must be a quoted -?digits,dd");
  if (!/^\d+$/.test(h[7])) err("header col 7 is not a bare integer");

  const fnMatch = FILENAME_RE.exec(name);
  if (!fnMatch) err("file name is not historia_<YYYY-MM-DD>_<26 digits>.csv");
  else {
    if (fnMatch[1] !== h[0]) err(`file name date ${fnMatch[1]} != header col 0 ${h[0]}`);
    const headerDigits = h[2].replace(/['\s]/g, "");
    if (fnMatch[2] !== headerDigits) err(`file name digits ${fnMatch[2]} != header col 2 digits ${headerDigits}`);
  }

  const rows = [];
  for (let i = 1; i < parsed.length; i++) {
    const f = parsed[i];
    const v = Array.from({ length: 9 }, (_, k) => cell(f, k).value);
    const at = `line ${i + 1}`;
    if (cell(f, 0).quoted || cell(f, 1).quoted) err(`${at}: date fields must be bare`);
    if (!DMY.test(v[0])) err(`${at}: col 0 (booking date) is not DD-MM-YYYY`);
    if (!DMY.test(v[1])) err(`${at}: col 1 (operation date) is not DD-MM-YYYY`);
    const bookingOn = DMY.test(v[0]) ? dmyToIso(v[0]) : null;
    const occurredOn = DMY.test(v[1]) ? dmyToIso(v[1]) : null;
    if (bookingOn && occurredOn && bookingOn < occurredOn) err(`${at}: booking date before operation date`);
    if (v[2].includes(",") !== cell(f, 2).quoted)
      err(`${at}: col 2 (description) quoting does not match the comma rule`);
    if (v[3].includes(",") !== cell(f, 3).quoted)
      err(`${at}: col 3 (counterparty) quoting does not match the comma rule`);
    if (cell(f, 4).quoted) err(`${at}: col 4 (counterparty account) must never be quoted`);
    if (v[4] !== "" && !isGroupedDigits(v[4])) err(`${at}: col 4 is neither empty nor grouped digits`);
    if (!(cell(f, 5).quoted && AMOUNT.test(v[5]))) err(`${at}: col 5 (amount) must be a quoted -?digits,dd`);
    if (!(cell(f, 6).quoted && AMOUNT.test(v[6]))) err(`${at}: col 6 (balance) must be a quoted -?digits,dd`);
    if (cell(f, 7).quoted || !/^\d+$/.test(v[7])) err(`${at}: col 7 (Lp) must be a bare integer`);
    const lp = Number(v[7]);
    if (lp !== i) err(`${at}: Lp ${lp} != file position ${i}`);

    const cardMatch = CARD.exec(v[2]);
    let kind = "other";
    if (cardMatch) {
      const action = cardMatch[2];
      kind = action === "PŁATNOŚĆ KARTĄ" ? "card" : action === "ZWROT PŁATNOŚCI KARTĄ" ? "card-refund" : "atm";
    } else if (v[2].startsWith("Zakup BLIK")) kind = "blik";
    else if (v[2].startsWith("Wypłata BLIK")) kind = "blik-withdrawal";
    else if (v[2].startsWith("Przelew")) kind = "transfer";

    const amountMinor = AMOUNT.test(v[5]) ? toMinor(v[5]) : 0;
    const balanceAfter = AMOUNT.test(v[6]) ? toMinor(v[6]) : 0;

    if (cardMatch) {
      if (v[3] !== "" || v[4] !== "") err(`${at}: card row must have col 3/col 4 empty`);
      const [, , , amtDot, cur, tail] = cardMatch;
      const descAmount = Math.round(Number(amtDot) * 100);
      if (descAmount !== Math.abs(amountMinor)) err(`${at}: description amount != |col 5|`);
      if (cur !== h[4]) err(`${at}: description currency ${cur} != header col 4 ${h[4]}`);
      if (!/^[\x20-\x7E]*$/.test(tail)) err(`${at}: card tail is not ASCII`);
      if (tail.includes("  ") || tail !== tail.trim()) err(`${at}: card tail has a leading/trailing/double space`);
      if (kind === "card-refund" && amountMinor <= 0) err(`${at}: refund must be a positive amount`);
      if ((kind === "card" || kind === "atm") && amountMinor >= 0) err(`${at}: card payment/ATM must be negative`);
    }

    rows.push({
      line: i + 1,
      lp,
      bookingOn,
      occurredOn,
      description: v[2],
      counterparty: v[3],
      counterpartyAccount: v[4],
      amountMinor,
      balanceAfter,
      kind,
      card: cardMatch ? cardMatch[1].slice(-4) : null,
    });
  }

  if (rows.length !== Number(h[7])) err(`header col 7 (${h[7]}) != data row count (${rows.length})`);

  if (rows.length) {
    for (const r of rows) {
      if (r.bookingOn && h[0] < r.bookingOn)
        err(`line ${r.line}: booking date ${r.bookingOn} is after header col 0 ${h[0]}`);
      if (r.occurredOn && DMY.test(h[1]) && dmyToIso(h[1]) > r.occurredOn)
        err(`line ${r.line}: operation date ${r.occurredOn} is before header col 1`);
    }
    const first = rows[0];
    const last = rows[rows.length - 1];
    const uniqueMax = rows.every(
      (r) => r === first || !r.bookingOn || !first.bookingOn || r.bookingOn < first.bookingOn,
    );
    if (!uniqueMax) err(`Lp 1 (line ${first.line}) does not have the unique maximum booking date`);
    if (rows.length > INVERSION_ROW_THRESHOLD) {
      const hasInversion = rows.some(
        (r, i) => i < rows.length - 1 && r.bookingOn && rows[i + 1].bookingOn && r.bookingOn < rows[i + 1].bookingOn,
      );
      if (!hasInversion) err("no adjacent booking-date inversion found (expected real-export shape, ST12)");
    }
    if (toMinor(h[6]) !== first.balanceAfter) err("header col 6 (closing) != Lp 1's col 6");
    const openingMinor = toMinor(h[5]);
    const sum = rows.reduce((s, r) => s + r.amountMinor, 0);
    if (openingMinor + sum !== toMinor(h[6])) err("opening + Σ amounts != closing");
    if (last.balanceAfter - last.amountMinor !== openingMinor) err("Lp N's col 6 - col 5 != opening");
    const cardIds = new Set(rows.map((r) => r.card).filter(Boolean));
    if (cardIds.size < 2) err(`fewer than 2 distinct card masks (${cardIds.size})`);
  }

  return { header: h, headerFields: hf, rows, currency: h[4] };
}

function checkFileEntry(name, stmt, fileEntry, errors) {
  const err = (msg) => errors.push(`${name} (expected.json): ${msg}`);
  const headerDigits = stmt.header[2].replace(/['\s]/g, "");
  if (fileEntry.account !== headerDigits) err("account != header col 2 digits");
  if (fileEntry.currency !== stmt.header[4]) err("currency != header col 4");
  if (DMY.test(stmt.header[1])) {
    const start = dmyToIso(stmt.header[1]);
    const end = stmt.header[0];
    if (fileEntry.period?.start !== start || fileEntry.period?.end !== end) err("period != header col 1 -> col 0 (D7)");
  }
  if (fileEntry.declaredCount !== Number(stmt.header[7])) err("declaredCount != header col 7");
}

// The one reject condition in this slice (D4: USD file fixture) — a reject file must trip exactly it, and an
// ok file must never trip it.
function checkRejectCondition(name, stmt, fileEntry, errors) {
  const currencyTripped = stmt.currency !== "PLN";
  if (fileEntry.expect === "ok") {
    if (currencyTripped) errors.push(`${name}: ok file trips reject condition currency`);
  } else if (fileEntry.expect === "reject") {
    if (fileEntry.reason !== "currency") errors.push(`${name}: unknown reason ${fileEntry.reason}`);
    else if (!currencyTripped) errors.push(`${name}: reason currency does not hold in the file`);
  } else {
    errors.push(`${name}: expect must be ok or reject`);
  }
}

// Re-derives D2/rule-5 independently of the generator and cross-checks expected.json rows[] for one file.
// Returns the imported manifest rows (ok files only) for the D5 pattern check.
function checkManifestRows(name, stmt, fileEntry, expected, errors) {
  const err = (msg) => errors.push(`${name} (expected.json): ${msg}`);
  const manifestRows = expected.rows.filter((r) => r.file === name);
  if (manifestRows.length !== stmt.rows.length)
    err(`${manifestRows.length} rows[] entries for ${stmt.rows.length} data rows`);
  const isOk = fileEntry.expect === "ok";
  const imported = [];
  stmt.rows.forEach((row, i) => {
    const m = manifestRows[i];
    if (!m) return;
    const at = `rows[] line ${row.line}`;
    if (m.lp !== row.lp) err(`${at}: lp ${m.lp} != file ${row.lp}`);
    if (m.bookedOn !== row.bookingOn) err(`${at}: bookedOn ${m.bookedOn} != file ${row.bookingOn}`);
    if (m.occurredOn !== row.occurredOn) err(`${at}: occurredOn ${m.occurredOn} != file ${row.occurredOn}`);
    if (m.amountMinor !== row.amountMinor) err(`${at}: amountMinor ${m.amountMinor} != file ${row.amountMinor}`);
    if (m.kind !== row.kind) err(`${at}: kind ${m.kind} != derived ${row.kind}`);
    if ((m.card ?? null) !== row.card) err(`${at}: card ${m.card} != derived ${row.card}`);
    const rawMerchant = rawMerchantOf(row.description, row.counterparty);
    if (m.rawMerchant !== rawMerchant)
      err(`${at}: rawMerchant ${JSON.stringify(m.rawMerchant)} != rule 5 ${JSON.stringify(rawMerchant)}`);
    if (!isOk) {
      if (m.imported !== false || m.skipReason !== "rejected-file" || m.pattern !== null) {
        err(`${at}: reject-file row must be imported:false, skipReason:"rejected-file", pattern:null`);
      }
      return;
    }
    const skipReason = row.amountMinor < 0 ? null : "credit";
    if (m.skipReason !== skipReason || m.imported !== (skipReason === null)) {
      err(`${at}: imported/skipReason ${m.imported}/${m.skipReason}, D2 gives ${skipReason === null}/${skipReason}`);
    }
    if (m.imported !== (m.pattern !== null)) err(`${at}: pattern must be set exactly for imported rows`);
    if (m.imported) imported.push(m);
  });
  if (isOk) {
    const sumMinor = imported.reduce((s, r) => s - r.amountMinor, 0);
    if (fileEntry.imported.count !== imported.length || fileEntry.imported.sumMinor !== sumMinor) {
      err(`imported ${JSON.stringify(fileEntry.imported)} != rows (${imported.length}, ${sumMinor})`);
    }
  }
  return imported;
}

// D5 (import-formats.md): fixed patterns stay within tolerance of their median, frequent ones (with >= 2
// occurrences) have at least one amount outside it; every pattern's rollup fields match its own rows.
function checkPatterns(importedRows, expected, errors) {
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
}

// Every crossBank entry's pattern must exist in both this fixture's patterns[] and the ING oracle's, with the
// same D5 `type` on both sides (Phase 1 handoff: observed "frequent" on both for pizzeria-trzy-sery).
function checkCrossBank(expected, errors) {
  for (const cb of expected.crossBank ?? []) {
    const santanderPattern = expected.patterns.find((p) => p.key === cb.pattern);
    if (!santanderPattern) errors.push(`crossBank ${cb.pattern}: not found in santander patterns[]`);
    let ingExpected;
    try {
      ingExpected = JSON.parse(readFileSync(path.resolve(import.meta.dirname, "..", cb.oracle), "utf8"));
    } catch (e) {
      errors.push(`crossBank ${cb.pattern}: cannot read oracle ${cb.oracle}: ${e.message}`);
      continue;
    }
    const ingPattern = ingExpected.patterns?.find((p) => p.key === cb.pattern);
    if (!ingPattern) errors.push(`crossBank ${cb.pattern}: not found in ING oracle patterns[]`);
    if (santanderPattern && ingPattern && santanderPattern.type !== ingPattern.type) {
      errors.push(
        `crossBank ${cb.pattern}: type ${santanderPattern.type} (santander) != ${ingPattern.type} (ing oracle)`,
      );
    }
  }
}

export async function check() {
  const errors = [];
  const { generate, TRAPS } = await import("./fixture-santander.mjs");
  const generated = generate();
  const onDisk = readdirSync(FIXTURE_DIR).filter((f) => !f.startsWith("."));
  const bytesOf = (name) => new Uint8Array(readFileSync(path.join(FIXTURE_DIR, name)));

  // 1. Byte equality with the generator.
  for (const name of onDisk)
    if (!(name in generated)) errors.push(`${name}: not produced by the generator (extra file)`);
  for (const [name, content] of Object.entries(generated)) {
    if (!onDisk.includes(name)) {
      errors.push(`${name}: missing on disk (run npm run fixture:santander)`);
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
    if (!csvs.includes(name)) {
      errors.push(`${name}: listed in expected.json but missing on disk`);
      continue;
    }
    const stmt = readStatement(name, bytesOf(name), errors);
    if (stmt) statements[name] = stmt;
  }

  const okNames = Object.keys(statements).filter((n) => expected.files[n].expect === "ok");
  if (!okNames.length) errors.push("expected.json: no file with expect ok");

  const importedRows = [];
  for (const [name, stmt] of Object.entries(statements)) {
    checkRejectCondition(name, stmt, expected.files[name], errors);
    checkFileEntry(name, stmt, expected.files[name], errors);
    const imported = checkManifestRows(name, stmt, expected.files[name], expected, errors);
    if (expected.files[name].expect === "ok") importedRows.push(...imported);
  }

  const knownFiles = new Set(Object.keys(expected.files));
  for (const r of expected.rows) {
    if (!knownFiles.has(r.file)) errors.push(`rows[] line ${r.line}: file ${r.file} not in expected.json files`);
  }

  if (okNames.length) checkPatterns(importedRows, expected, errors);

  const seen = new Set(expected.rows.flatMap((r) => r.traps));
  const missing = Object.keys(TRAPS).filter((t) => !seen.has(t));
  if (missing.length) errors.push(`traps without rows: ${missing.join(", ")}`);

  checkCrossBank(expected, errors);

  return errors;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const errors = await check();
  if (errors.length) {
    console.error(`fixture:check (santander) FAILED (${errors.length}):`);
    for (const e of errors.slice(0, 50)) console.error(`  - ${e}`);
    if (errors.length > 50) console.error(`  … and ${errors.length - 50} more`);
    process.exit(1);
  }
  console.log(
    "fixture:check (santander) OK — test/fixtures/santander/ matches the generator and the Santander format contract",
  );
}
