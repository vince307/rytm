// Local-only structure comparison (F-03): npm run fixture:shape:santander [-- dir]. Reads <dir>/historia_*.csv
// (default data/, gitignored real exports) and the Santander fixture files, and prints ONLY structure: encoding,
// line endings, masked header, quoting/field-count signatures, description-kind shares, card-tail shape, date
// relationships and BLIK suffix share. Never a counterparty, title, amount, account/card number or FILE NAME —
// sides are labelled `fixture PLN`, `fixture USD`, `real N (<CUR>)` by position only. No real file -> message and
// exit 0, so this is never a CI gate. Reuses the one Santander CSV reader (scripts/fixture-santander-check.mjs);
// does not duplicate it.

import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { TextDecoder } from "node:util";
import { CARD, DMY, YMD, parseLine, toMinor } from "./fixture-santander-check.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const FIXTURE_DIR = path.join(ROOT, "test/fixtures/santander");
// Empty string (`-- ""`) is falsy, so it falls through to the default instead of resolving to cwd.
const dir = path.resolve(process.argv[2] || path.join(ROOT, "data"));
const TOLERANCE_PP = 5;
const AMOUNT = /^-?\d+,\d{2}$/;

// Digit runs -> 9{n}; any letter/other -> a single <text> marker. Shape only, no value survives.
const mask = (s) => s.replace(/\d+/g, (d) => `9{${d.length}}`).replace(/[^\d\s{}'*_.-]+/gu, "<text>");

function maskHeaderField(value, quoted, idx) {
  if (idx === 0) return YMD.test(value) ? "<YMD>" : "<other>";
  if (idx === 1) return DMY.test(value) ? "<DMY>" : "<other>";
  if (idx === 2) return /^'\d{2}( \d{4}){6}$/.test(value) ? "'<account>" : mask(value);
  if (idx === 3) return value === "" ? "" : "<text>";
  if (idx === 4) return /^[A-Z]{3}$/.test(value) ? value : "<other>";
  if (idx === 5 || idx === 6) {
    const m = quoted && AMOUNT.test(value) ? (value.startsWith("-") ? "-<amount>" : "<amount>") : "<other>";
    return quoted ? `"${m}"` : m;
  }
  if (idx === 7) return /^\d+$/.test(value) ? "<int>" : "<other>";
  return value === "" ? "" : "<other>";
}

const pct = (part, total) => (total ? Math.round((part / total) * 1000) / 10 : 0);
function distribution(values) {
  const counts = new Map();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return Object.fromEntries(
    [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => [k, pct(n, values.length)]),
  );
}

// Card tail (CARD group 5) shape only: ASCII-ness, spacing and token count never reveal the merchant text.
function tailShape(tail) {
  const ascii = /^[\x20-\x7E]*$/.test(tail);
  const singleSpace = !tail.includes("  ") && tail === tail.trim();
  const tokens = tail.split(/\s+/).filter(Boolean).length;
  const star = tail.includes("*");
  return { ascii, singleSpace, tokens, star };
}

function kindOf(description) {
  if (CARD.test(description)) {
    const action = CARD.exec(description)[2];
    return action === "PŁATNOŚĆ KARTĄ" ? "card" : action === "ZWROT PŁATNOŚCI KARTĄ" ? "card-refund" : "atm";
  }
  if (description.startsWith("Zakup BLIK")) return "blik";
  if (description.startsWith("Wypłata BLIK")) return "blik-withdrawal";
  if (description.startsWith("Przelew")) return "transfer";
  if (description.startsWith("Oplata za")) return "fee";
  return "other";
}

function fillPattern(col3, col4) {
  const a = col3 !== "" ? "3" : "_";
  const b = col4 !== "" ? "4" : "_";
  return `${a}${b}`;
}

// Parses one statement's bytes into structure-only metrics. Never returns a raw value — only masks, shares and
// distributions. Throws only on a decode failure the caller reports by error class alone (no byte content).
function shape(bytes) {
  const metrics = {};
  const put = (key, value) => (metrics[key] = value);
  put("BOM (UTF-8)", bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf ? "yes" : "no");
  put("contains CR", bytes.includes(0x0d) ? "yes" : "no");
  put("final newline", bytes[bytes.length - 1] === 0x0a ? "yes" : "no");

  let text;
  let utf8Valid = true;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    utf8Valid = false;
    text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  }
  put("UTF-8 valid", utf8Valid ? "yes" : "no");
  put('"" occurrences', String((text.match(/""/g) ?? []).length));

  const lines = text.split("\n");
  if (lines[lines.length - 1] === "") lines.pop();
  let unparseable = 0;
  const parsed = lines.map((line) => {
    try {
      return parseLine(line);
    } catch {
      unparseable++;
      return null;
    }
  });
  put("unparseable lines", String(unparseable));

  const hf = parsed[0];
  const h = hf ? Array.from({ length: 9 }, (_, i) => hf[i]?.value ?? "") : null;
  put("masked header", hf ? hf.map((f, i) => maskHeaderField(f.value, f.quoted, i)).join(",") : "<header unparseable>");

  const rowFields = parsed.slice(1).filter(Boolean);
  const n = rowFields.length;
  const col = (f, i) => f[i] ?? { value: "", quoted: false };
  const v = (f, i) => col(f, i).value;
  const share = (pred) => pct(rowFields.filter(pred).length, n);

  put("data row field counts", distribution(rowFields.map((f) => String(f.length))));
  put(
    "row quoting signature (Q quoted, B bare, _ empty)",
    distribution(
      rowFields.map((f) =>
        Array.from({ length: 9 }, (_, i) => col(f, i))
          .map((x) => (x.quoted ? (x.value ? "Q" : "q") : x.value ? "B" : "_"))
          .join(""),
      ),
    ),
  );

  const kinds = rowFields.map((f) => kindOf(v(f, 2)));
  put("description kind", distribution(kinds));

  const cardRows = rowFields.filter((f) => CARD.test(v(f, 2)));
  const cardMasks = new Set(cardRows.map((f) => CARD.exec(v(f, 2))[1]));
  put("distinct card masks", String(cardMasks.size));
  const tails = cardRows.map((f) => tailShape(CARD.exec(v(f, 2))[5]));
  put("card tail ASCII share", pct(tails.filter((t) => t.ascii).length, tails.length));
  put("card tail single-space share", pct(tails.filter((t) => t.singleSpace).length, tails.length));
  put("card tail token-count distribution", distribution(tails.map((t) => String(t.tokens))));
  put("card tail '*' share", pct(tails.filter((t) => t.star).length, tails.length));

  const blikRows = rowFields.filter((f) => kindOf(v(f, 2)).startsWith("blik"));
  put(
    "BLIK ':<11 digits>' suffix share",
    pct(blikRows.filter((f) => /:\d{11}$/.test(v(f, 2))).length, blikRows.length),
  );

  put(
    "booking >= operation share",
    share((f) => DMY.test(v(f, 0)) && DMY.test(v(f, 1)) && dmyIso(v(f, 0)) >= dmyIso(v(f, 1))),
  );
  put(
    "booking != operation share",
    share((f) => v(f, 0) !== v(f, 1)),
  );
  let inversions = 0;
  let adjacent = 0;
  for (let i = 0; i < rowFields.length - 1; i++) {
    const a = v(rowFields[i], 0);
    const b = v(rowFields[i + 1], 0);
    if (!DMY.test(a) || !DMY.test(b)) continue;
    adjacent++;
    if (dmyIso(a) < dmyIso(b)) inversions++;
  }
  put("adjacent booking-date inversion share", pct(inversions, adjacent));
  put(
    "credits share",
    share((f) => AMOUNT.test(v(f, 5)) && toMinor(v(f, 5)) > 0),
  );
  put(
    "col3/col4 fill by kind",
    distribution(rowFields.map((f) => `${kindOf(v(f, 2))}:${fillPattern(v(f, 3), v(f, 4))}`)),
  );
  put("col4 masks", distribution(rowFields.map((f) => (v(f, 4) ? mask(v(f, 4)) : "<empty>"))));

  if (h && /^\d+$/.test(h[7] ?? "")) {
    put("header col 7 == row count", Number(h[7]) === n ? "yes" : "no");
  } else {
    put("header col 7 == row count", "n/a");
  }
  if (h && AMOUNT.test(h[6]) && rowFields[0] && AMOUNT.test(v(rowFields[0], 6))) {
    put("header col 6 == Lp 1 balance", toMinor(h[6]) === toMinor(v(rowFields[0], 6)) ? "yes" : "no");
  } else {
    put("header col 6 == Lp 1 balance", "n/a");
  }

  return metrics;
}

function dmyIso(dmy) {
  const [d, m, y] = dmy.split("-");
  return `${y}-${m}-${d}`;
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
  if (typeof value === "object") {
    return Object.entries(value)
      .map(([k, p]) => `${k} ${p}%`)
      .join(", ");
  }
  return value;
}

if (!existsSync(dir)) {
  console.log(
    `fixture:shape:santander: directory ${dir} does not exist — nothing to compare (local-only, not a CI gate).`,
  );
  process.exit(0);
}
const realFiles = readdirSync(dir).filter((f) => /^historia_.*\.csv$/.test(f));
if (!realFiles.length) {
  console.log(`fixture:shape:santander: no historia_*.csv in ${dir} — nothing to compare (local-only, not a CI gate).`);
  process.exit(0);
}

let expected;
try {
  expected = JSON.parse(readFileSync(path.join(FIXTURE_DIR, "expected.json"), "utf8"));
} catch (e) {
  console.error(
    `fixture:shape:santander: cannot read the fixture's expected.json (${e instanceof Error ? e.name : "error"})`,
  );
  process.exit(1);
}

function currencyOf(bytes) {
  try {
    const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    const firstLine = text.split("\n")[0];
    const f = parseLine(firstLine);
    const cur = f[4]?.value ?? "";
    return /^[A-Z]{3}$/.test(cur) ? cur : "unknown";
  } catch {
    return "unknown";
  }
}

const sides = [
  ...Object.entries(expected.files).map(([name, entry]) => ({
    label: `fixture ${entry.currency}`,
    currency: entry.currency,
    bytes: readFileSync(path.join(FIXTURE_DIR, name)),
  })),
];

const realByCurrency = new Map();
for (const name of realFiles.sort()) {
  let bytes;
  try {
    bytes = readFileSync(path.join(dir, name));
  } catch (e) {
    // Node's I/O error carries the full path; report only an anonymous label and the error code.
    console.error(
      `fixture:shape:santander: cannot read a real file (${e instanceof Error && "code" in e ? String(e.code) : "error"})`,
    );
    process.exit(1);
  }
  const cur = currencyOf(bytes);
  const n = (realByCurrency.get(cur) ?? []).length + 1;
  realByCurrency.set(cur, [...(realByCurrency.get(cur) ?? []), { label: `real ${n} (${cur})`, currency: cur, bytes }]);
}
for (const list of realByCurrency.values()) sides.push(...list);

let shapes;
try {
  shapes = sides.map((s) => ({ label: s.label, currency: s.currency, metrics: shape(new Uint8Array(s.bytes)) }));
} catch (e) {
  // Never echo file content: report only the error class.
  console.error(`fixture:shape:santander: failed to analyse a file (${e instanceof Error ? e.name : "error"})`);
  process.exit(1);
}

const currencies = [...new Set(shapes.map((s) => s.currency))].sort();
for (const cur of currencies) {
  const group = shapes.filter((s) => s.currency === cur);
  console.log(
    `\n=== ${cur} — ${group.map((s) => s.label).join(" vs ")} (shares in % of data rows; = same, ≠ differs) ===\n`,
  );
  if (group.length < 2) {
    console.log("(only one side in this currency — nothing to compare)");
    continue;
  }
  const differences = [];
  for (const key of Object.keys(group[0].metrics)) {
    const values = group.map((s) => s.metrics[key]);
    const equal = values.every((x) => same(values[0], x));
    if (equal) {
      console.log(`= ${key}: ${render(values[0])}`);
      continue;
    }
    differences.push(key);
    console.log(`≠ ${key}`);
    group.forEach((s, i) => console.log(`    ${s.label}: ${render(values[i])}`));
  }
  console.log(
    differences.length
      ? `\nDifferences (${differences.length}): ${differences.join("; ")}`
      : "\nNo structural differences.",
  );
}
