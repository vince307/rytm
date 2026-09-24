// Local-only structure comparison (F-02): npm run fixture:shape [-- dir]. Reads <dir>/Lista_transakcji_*.csv
// (default data/, gitignored real exports) and the ok fixture files, and prints ONLY structure: encoding, line
// endings, masked preamble lines (whitelisted labels, everything else <other>), quoting signatures, shares and
// digit masks. Never counterparties, titles, amounts, account/transaction numbers or dates. No real file ->
// message and exit 0, so this is never a CI gate.

import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { COLUMN_NAMES, DATE, FOOTER, decodeCp1250, parseLine, toMinor } from "./fixture-ing-check.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const FIXTURE_DIR = path.join(ROOT, "test/fixtures/ing");
const dir = path.resolve(process.argv[2] ?? path.join(ROOT, "data"));
const LABELS = new Set([
  "Lista transakcji",
  "Dane Użytkownika:",
  "Wybrane rachunki:",
  "Zastosowane kryteria wyboru",
  "Podsumowanie",
  "Zakres dat:",
  "Typy transakcji:",
  "wszystkie",
  "Liczba transakcji:",
  "Ukryto saldo po transakcji",
  FOOTER,
]);
const DETAIL_TYPES = ["TR.BLIK", "PRZELEW", "P.BLIK", "PRZ SP"];
const OPERATORS = ["paypro", "payu", "cashbill", "autopay", "ing pay"];
const TOLERANCE_PP = 5;

// Digit runs -> 9{n}; any letter -> a single <text> marker. Shape only, no value survives.
const mask = (s) => s.replace(/\d+/g, (d) => `9{${d.length}}`).replace(/[^\d\s{}'\\,.:;_-]+/gu, "<text>");

function maskField({ value, quoted }) {
  let m;
  if (value === "") return quoted ? '""' : "";
  if (LABELS.has(value)) m = value;
  else if (/^Dokument nr \d+_\d+$/.test(value)) m = `Dokument nr ${mask(value.slice(12))}`;
  else if (/^Wygenerowany dnia: \d{4}-\d{2}-\d{2}, \d{2}:\d{2}$/.test(value)) m = "Wygenerowany dnia: <date>, <time>";
  else if (/^Suma (uznań|obciążeń) \(\d+\):$/.test(value)) m = value.replace(/\d+/, "<n>");
  else if (/^.+ \((PLN|EUR|USD|GBP|CHF)\)$/.test(value)) m = `<name> ${value.slice(-5)}`;
  else if (/^\d{4}-\d{2}-\d{2} - \d{4}-\d{2}-\d{2}$/.test(value)) m = "<date> - <date>";
  else if (/^[\d ]{10,}$/.test(value)) m = mask(value);
  else if (/^-?\d+,\d{2}$/.test(value)) m = value.startsWith("-") ? "-<amount>" : "<amount>";
  else if (/^\d+$/.test(value)) m = "<int>";
  else if (value === "PLN") m = "PLN";
  else m = "<other>";
  return quoted ? `"${m}"` : m;
}

const maskLine = (fields) => fields.map(maskField).join(";");

// Collapse runs of identical lines: account lists of different length stay comparable.
function collapseRuns(list) {
  const out = [];
  for (const item of list) {
    const last = out[out.length - 1];
    if (last && last.item === item) last.n++;
    else out.push({ item, n: 1 });
  }
  return out.map(({ item, n }) => (n > 1 ? `${item} ×${n}` : item));
}

const pct = (part, total) => (total ? Math.round((part / total) * 1000) / 10 : 0);
function distribution(values) {
  const counts = new Map();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return Object.fromEntries(
    [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => [k, pct(n, values.length)]),
  );
}

function shape(bytes) {
  const metrics = {};
  const put = (key, value) => (metrics[key] = value);
  const text = decodeCp1250(bytes);
  const crlf = (text.text.match(/\r\n/g) ?? []).length;
  const lf = (text.text.match(/\n/g) ?? []).length;
  put("BOM (UTF-8)", bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf ? "yes" : "no");
  put("line endings", crlf === 0 ? "LF" : crlf === lf ? "CRLF" : "mixed");
  put("final newline", bytes[bytes.length - 1] === 0x0a ? "yes" : "no");
  put("cp1250 round-trip", text.roundTrip ? "yes" : "no");

  const lines = text.text.split(/\r?\n/);
  if (lines[lines.length - 1] === "") lines.pop();
  let unparseable = 0;
  const parsed = lines.map((line) => {
    try {
      return parseLine(line);
    } catch {
      unparseable++;
      return [{ value: "\u0000", quoted: false }];
    }
  });
  put("unparseable lines", String(unparseable));
  const headerAt = parsed.findIndex((f) => f[0]?.quoted && f[0].value === "Data transakcji");
  const isRow = (f) => !f[0]?.quoted && DATE.test(f[0]?.value ?? "");
  const firstRow = parsed.findIndex(isRow);
  const lastRow = parsed.length - 1 - [...parsed].reverse().findIndex(isRow);
  const preambleEnd = headerAt !== -1 ? headerAt : firstRow !== -1 ? firstRow : parsed.length;

  put("header line", headerAt === -1 ? "none" : String(headerAt + 1));
  const accountsAt = parsed.findIndex((f) => f[0]?.value === "Wybrane rachunki:");
  let accounts = 0;
  const accountNames = [];
  if (accountsAt !== -1) {
    for (let i = accountsAt + 1; i < preambleEnd && lines[i] !== ""; i++) {
      accounts++;
      accountNames.push(parsed[i][0]?.value.replace(/ \([A-Z]{3}\)$/, ""));
    }
  }
  put("accounts in preamble", String(accounts));
  put("preamble lines", collapseRuns(parsed.slice(0, preambleEnd).map(maskLine)));
  put(
    "labels found (whitelist)",
    parsed
      .slice(0, preambleEnd)
      .flatMap((f) => f.map(maskField))
      .filter((m) => /^"[^<9]/.test(m))
      .join(", "),
  );

  if (headerAt !== -1) {
    const h = parsed[headerAt];
    put("header fields", String(h.length));
    const named = h.filter((x) => x.value !== "");
    const differs = COLUMN_NAMES.map((n, i) => (h[i]?.value === n && h[i].quoted ? null : i)).filter((i) => i !== null);
    put("header names", differs.length ? `differ at index ${differs.join(", ")}` : "15 expected names, quoted");
    put("header named/empty fields", `${named.length} named, ${h.length - named.length} empty`);
  }

  const rows = parsed.filter(isRow);
  const n = rows.length;
  const col = (k) => rows.map((f) => f[k] ?? { value: "", quoted: false });
  const share = (pred) => pct(rows.filter(pred).length, n);
  const v = (f, k) => f[k]?.value ?? "";
  put("data row field counts", distribution(rows.map((f) => String(f.length))));
  put(
    "row quoting signature (Q quoted, B bare, _ empty)",
    distribution(rows.map((f) => f.map((x) => (x.quoted ? (x.value ? "Q" : "q") : x.value ? "B" : "_")).join(""))),
  );
  put(
    "Szczegóły type",
    distribution(col(6).map(({ value }) => DETAIL_TYPES.find((t) => value.startsWith(`${t} `)) ?? "other")),
  );
  put(
    "Szczegóły form",
    distribution(
      col(6).map(({ value }) =>
        /^\S+( \S+)? {2}$/.test(value) && !value.includes("Ref SP")
          ? "<TYPE>␣␣"
          : /^.+ Ref SP: \S+ $/.test(value)
            ? "<TYPE> Ref SP: <ref>␣"
            : "other",
      ),
    ),
  );
  put(
    "Data księgowania ≠ Data transakcji",
    share((f) => v(f, 1) !== v(f, 0)),
  );
  put(
    "credits (amount > 0)",
    share((f) => /^\d/.test(v(f, 8)) && toMinor(v(f, 8)) > 0),
  );
  put(
    "amount matches -?d+,dd",
    share((f) => /^-?\d+,\d{2}$/.test(v(f, 8))),
  );
  put("Waluta", distribution(col(9).map(({ value }) => (value === "PLN" ? "PLN" : "other"))));
  put("Nr rachunku (4) masks", distribution(col(4).map(({ value }) => (value ? mask(value) : "<empty>"))));
  put(
    "Nr rachunku (4) in '…' with trailing space",
    share((f) => /^'.*\s'$/.test(v(f, 4))),
  );
  put(
    "TR.BLIK rows with empty Nr rachunku",
    pct(
      rows.filter((f) => v(f, 6).startsWith("TR.BLIK") && !v(f, 4)).length,
      rows.filter((f) => v(f, 6).startsWith("TR.BLIK")).length,
    ),
  );
  put(
    "Nazwa banku (5) present iff Nr rachunku",
    share((f) => !v(f, 4) === !v(f, 5)),
  );
  put("Nr transakcji (7) masks", distribution(col(7).map(({ value }) => (value ? mask(value) : "<empty>"))));
  put(
    "Dane kontrahenta (2): trailing space",
    share((f) => v(f, 2).endsWith(" ")),
  );
  put(
    "Dane kontrahenta (2): leading space",
    share((f) => v(f, 2).startsWith(" ")),
  );
  put(
    "Dane kontrahenta (2): multiple inner spaces",
    share((f) => /\S {2,}\S/.test(v(f, 2))),
  );
  put(
    "Dane kontrahenta (2): payment operator",
    share((f) => OPERATORS.some((op) => v(f, 2).toLowerCase().includes(op))),
  );
  put(
    "Tytuł (3): leading space",
    share((f) => v(f, 3).startsWith(" ")),
  );
  put(
    "Tytuł (3): trailing space",
    share((f) => v(f, 3).endsWith(" ")),
  );
  put(
    "Konto (14) = preamble account name",
    share((f) => accountNames.includes(v(f, 14))),
  );
  put(
    "fields 10–13 empty",
    share((f) => f.slice(10, 14).every((x) => x.value === "")),
  );
  put(
    "fields 15–20 empty",
    share((f) => f.slice(15).every((x) => x.value === "")),
  );
  put("footer lines", collapseRuns((firstRow === -1 ? [] : parsed.slice(lastRow + 1)).map(maskLine)));
  return metrics;
}

// Differences: exact for strings/lists, > TOLERANCE_PP for shares and distribution entries.
function same(a, b) {
  if (typeof a === "number" && typeof b === "number") return Math.abs(a - b) <= TOLERANCE_PP;
  if (Array.isArray(a) || Array.isArray(b) || typeof a !== "object" || typeof b !== "object") {
    return JSON.stringify(a) === JSON.stringify(b);
  }
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  return [...keys].every((k) => Math.abs((a[k] ?? 0) - (b[k] ?? 0)) <= TOLERANCE_PP);
}

function render(value) {
  if (typeof value === "number") return `${value}%`;
  if (Array.isArray(value)) return value.map((l) => `\n        | ${l}`).join("");
  if (typeof value === "object") {
    return Object.entries(value)
      .map(([k, p]) => `${k} ${p}%`)
      .join(", ");
  }
  return value;
}

if (!existsSync(dir)) {
  console.log(`fixture:shape: directory ${dir} does not exist — nothing to compare (local-only, not a CI gate).`);
  process.exit(0);
}
const realFiles = readdirSync(dir).filter((f) => /^Lista_transakcji_.*\.csv$/.test(f));
if (!realFiles.length) {
  console.log(`fixture:shape: no Lista_transakcji_*.csv in ${dir} — nothing to compare (local-only, not a CI gate).`);
  process.exit(0);
}
const expected = JSON.parse(readFileSync(path.join(FIXTURE_DIR, "expected.json"), "utf8"));
const sides = [
  ...Object.entries(expected.files)
    .filter(([, f]) => f.expect === "ok")
    .map(([name], i) => ({ label: `fixture ${i + 1}`, bytes: readFileSync(path.join(FIXTURE_DIR, name)) })),
  // Real files are labelled by position only: the file name carries a document number and a date.
  ...realFiles.sort().map((name, i) => ({ label: `real ${i + 1}`, bytes: readFileSync(path.join(dir, name)) })),
];
let shapes;
try {
  shapes = sides.map((s) => ({ label: s.label, metrics: shape(new Uint8Array(s.bytes)) }));
} catch (e) {
  // Never echo file content: report only the error class.
  console.error(`fixture:shape: failed to analyse a file (${e instanceof Error ? e.name : "error"})`);
  process.exit(1);
}

console.log(
  `fixture:shape — ${shapes.map((s) => s.label).join(" vs ")} (shares in % of data rows; = same, ≠ differs)\n`,
);
const differences = [];
for (const key of Object.keys(shapes[0].metrics)) {
  const values = shapes.map((s) => s.metrics[key]);
  const equal = values.every((x) => same(values[0], x));
  if (equal) {
    console.log(`= ${key}: ${render(values[0])}`);
    continue;
  }
  differences.push(key);
  console.log(`≠ ${key}`);
  shapes.forEach((s, i) => console.log(`    ${s.label}: ${render(values[i])}`));
}
console.log(
  differences.length
    ? `\nDifferences (${differences.length}): ${differences.join("; ")}`
    : "\nNo structural differences.",
);
