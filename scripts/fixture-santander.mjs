// Synthetic Santander Bank Polska statement fixture (F-03): deterministic generator of
// test/fixtures/santander/. Shapes come from context/foundation/import-formats.md plus an aggregate,
// values-never-printed comparison with real exports (field masks, quoting, counts, booleans only) — every
// name, address, account number, card mask and amount below is invented, nothing is copied from a real
// statement. Traps ST01-ST14 are declared as data; one run builds both CSV files, expected.json and the
// README together, so the answer key cannot drift from the files.
// Zero dependencies on purpose, no clock, seeded PRNG. Run: npm run fixture:santander (writes
// test/fixtures/santander/). Other scripts import { generate } to get the same files in memory
// (path -> Uint8Array | string).
// `mulberry32`/date helpers are duplicated from scripts/fixture-ing.mjs on purpose (plan decision): the ING
// generator stays byte-untouched, so sharing a module would risk its fixture drifting for an unrelated change.

import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { TextEncoder } from "node:util";

const OUT_DIR = path.resolve(import.meta.dirname, "../test/fixtures/santander");
const SEED = 20260831;
const EXPORT_DATE = "2026-08-31"; // header col 0 of the main file
const RANGE_START = "2026-03-01"; // header col 1 of the main file
const OWNER = "JAN KOWALSKI UL. PRZYKLADOWA 5 00-001 WARSZAWA"; // one bare field, no comma
// 26 digits: positions 3-6 (0-indexed 2..5) are the invented but plausible public bank code 1090; the rest is
// invented. Different from the ING fixture's MAIN/VAT numbers so imports_no_overlap never couples the two
// fixtures by account number.
const ACCOUNT_DIGITS = "61109012340001111222233334";
const USD_ACCOUNT_DIGITS = "77109056780009998887776665";
const CARDS = ["411111******1111", "411111******2222"];
const MAIN_FILE = `historia_${EXPORT_DATE}_${ACCOUNT_DIGITS}.csv`;
const USD_FILE = `historia_${EXPORT_DATE}_${USD_ACCOUNT_DIGITS}.csv`;
const OPENING = 5000000; // 50 000,00 PLN, invented
const USD_OPENING = 100000; // 1 000,00 USD, invented
// D5 from import-formats.md, same formula as the ING fixture (tolerance is bank-agnostic).
const TOLERANCE = {
  pct: 15,
  minMinor: 1000,
  rule: "D5: max(15% mediany, 10 zł); |kwota - mediana| <= tolerancja; mediana parzystej liczby = średnia dwóch środkowych",
};

export const TRAPS = {
  ST01: ["Ten sam sprzedawca płacony dwiema kartami na jednym koncie", "jeden wzorzec; maska karty poza sprzedawcą"],
  ST02: ["Ta sama sieć, różne numery placówek w końcówce opisu kartowego", "jeden wzorzec, resolvedBy normalization"],
  ST03: [
    "Ten sam sprzedawca zapisany dwojako przez operatora karty (`MARKA *Marka App` vs `MARKA APPS …`), stała kwota",
    "jeden wzorzec stały (fixed), resolvedBy user-merge",
  ],
  ST04: [
    "Wypłaty z bankomatu kartą pod ≥ 2 adresami",
    "rawMerchant = adres (regex); jeden wzorzec częsty `bankomat` dopiero po normalizacji S-11",
  ],
  ST05: [
    "Zakup BLIK z kontrahentem w kol. 3; jeden wiersz z domenopodobnym tokenem w opisie",
    "rawMerchant = kol. 3 (reguła 5); reguła D3 (domena) nieużywana",
  ],
  ST06: ["Wypłata BLIK (wypłata gotówki przez BLIK)", "rawMerchant = kol. 3; własny wzorzec, nie scalany z `bankomat`"],
  ST07: [
    "Przelewy: `Przelew środków`, `Przelew na telefon`, dowolny tytuł z przecinkiem w kol. 2 (cudzysłów)",
    "rawMerchant = kol. 3 w każdym wierszu",
  ],
  ST08: ["Zwrot płatności kartą (kwota dodatnia)", "pominięty, skipReason credit (D2)"],
  ST09: [
    "Uznania niebędące zwrotem (przelewy przychodzące), jedno z przecinkiem w kol. 3 (cudzysłów)",
    "pominięte, skipReason credit",
  ],
  ST10: [
    "Sprzedawca między bankami: końcówka kartowa `PIZZERIA TRZY SERY KRAKOW` (ASCII), ≥ 3 wiersze, obie karty",
    "pattern `pizzeria-trzy-sery` = slug z fixture ING; wpis crossBank",
  ],
  ST11: ["Powtarzalne obciążenie `Oplata za …`, ta sama kwota co miesiąc", "jeden wzorzec stały (fixed)"],
  ST12: [
    "Data księgowania ≠ data operacji na większości wierszy; porządek pliku z sąsiadującymi inwersjami",
    "`occurredOn` = data operacji (kol. 1)",
  ],
  ST13: [
    "Nagłówek: dwa formaty dat, numer rachunku z wiodącym `'`, kwoty w cudzysłowie, kol. 7 == liczba wierszy",
    "okres = kol. 1 nagłówka → kol. 0 nagłówka (D7)",
  ],
  ST14: ["Plik rachunku walutowego USD", "plik odrzucony, reason currency"],
};

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pad = (n, width = 2) => String(n).padStart(width, "0");

function addDays(iso, days) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const dmy = (iso) => `${iso.slice(8, 10)}-${iso.slice(5, 7)}-${iso.slice(0, 4)}`;

function formatAmount(minor) {
  const abs = Math.abs(minor);
  return `${minor < 0 ? "-" : ""}${Math.floor(abs / 100)},${pad(abs % 100)}`;
}

function formatAmountDot(absMinor) {
  return `${Math.floor(absMinor / 100)}.${pad(absMinor % 100)}`;
}

const collapse = (s) => s.trim().replace(/\s+/g, " ");

// Counts top-level comma-separated fields, treating a quoted field's internal commas as not separators
// (quote-aware, like the real reader will be in Phase 2) — a naive `line.split(",")` would miscount a line
// whose quoted field legitimately contains a comma (ST07/ST09).
function countFields(line) {
  let count = 1;
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') inQuotes = !inQuotes;
    else if (ch === "," && !inQuotes) count++;
  }
  return count;
}

function assertAscii(s) {
  for (const ch of s) {
    if (ch.codePointAt(0) > 127) throw new Error(`card tail must be ASCII: ${JSON.stringify(s)}`);
  }
}

// RFC-style quoting: never a literal `"` inside a field (no "" escapes); `,`/CR/LF never inside a bare field.
const bare = (value) => {
  if (/[",\r\n]/.test(value)) throw new Error(`bare field cannot hold a comma or quote: ${JSON.stringify(value)}`);
  return value;
};
const quoted = (value) => {
  if (/["\r\n]/.test(value)) throw new Error(`field cannot hold a quote: ${JSON.stringify(value)}`);
  return `"${value}"`;
};
// col 2 / col 3: bare unless the value contains a comma, in which case quoted (ST07/ST09 traps exercise this).
const maybeQuoted = (value) => (value.includes(",") ? quoted(value) : bare(value));

// Header col 2 shape: `'` + 2 digits + six groups of 4 (26 digits total), spaces between groups.
function groupAccount(digits26) {
  if (!/^\d{26}$/.test(digits26)) throw new Error(`account must be 26 digits: ${digits26}`);
  const groups = [digits26.slice(0, 2)];
  for (let i = 2; i < 26; i += 4) groups.push(digits26.slice(i, i + 4));
  return `'${groups.join(" ")}`;
}
// Data-row col 4: the same digits, grouped by 4, bare — no leading `'` (unlike the header's col 2).
function groupDigits(digits) {
  const groups = [];
  for (let i = 0; i < digits.length; i += 4) groups.push(digits.slice(i, i + 4));
  return groups.join(" ");
}
const invented26 = (n) => String(n).padStart(26, "0");

const cardLast4 = (cardNo) => cardNo.slice(-4);

// --- Row constructors -------------------------------------------------------------------------------------
// Every constructor returns a plain row object; `pattern` is the intended slug after S-11
// normalisation/user decisions (null for rows that are never imported). `imported`/`skipReason` are derived
// uniformly later from the sign of `amountMinor` (D2), except for the USD file which is rejected as a whole.

function card({
  traps = [],
  card: cardNo,
  tail,
  amountAbs,
  bookingOn,
  occurredOn,
  currency = "PLN",
  pattern = null,
  resolvedBy = null,
  expectType = null,
}) {
  assertAscii(tail);
  const t = collapse(tail);
  return {
    traps,
    kind: "card",
    card: cardLast4(cardNo),
    bookingOn,
    occurredOn,
    amountMinor: -amountAbs,
    description: `DOP. VISA ${cardNo} PŁATNOŚĆ KARTĄ ${formatAmountDot(amountAbs)} ${currency} ${t}`,
    counterparty: "",
    counterpartyAccount: "",
    rawMerchant: t,
    pattern,
    resolvedBy,
    expectType,
  };
}

function cardRefund({ traps = [], card: cardNo, tail, amountAbs, bookingOn, occurredOn, currency = "PLN" }) {
  assertAscii(tail);
  const t = collapse(tail);
  return {
    traps,
    kind: "card-refund",
    card: cardLast4(cardNo),
    bookingOn,
    occurredOn,
    amountMinor: amountAbs,
    description: `DOP. VISA ${cardNo} ZWROT PŁATNOŚCI KARTĄ ${formatAmountDot(amountAbs)} ${currency} ${t}`,
    counterparty: "",
    counterpartyAccount: "",
    rawMerchant: t,
    pattern: null,
    resolvedBy: null,
    expectType: null,
  };
}

function atm({
  traps = [],
  card: cardNo,
  address,
  amountAbs,
  bookingOn,
  occurredOn,
  currency = "PLN",
  pattern = null,
  resolvedBy = null,
  expectType = null,
}) {
  assertAscii(address);
  const t = collapse(address);
  return {
    traps,
    kind: "atm",
    card: cardLast4(cardNo),
    bookingOn,
    occurredOn,
    amountMinor: -amountAbs,
    description: `DOP. VISA ${cardNo} WYPŁATA Z BANKOMATU KARTĄ ${formatAmountDot(amountAbs)} ${currency} ${t}`,
    counterparty: "",
    counterpartyAccount: "",
    rawMerchant: t,
    pattern,
    resolvedBy,
    expectType,
  };
}

function blik({
  traps = [],
  counterparty,
  counterpartyAccount,
  freeText,
  suffix,
  amountAbs,
  bookingOn,
  occurredOn,
  pattern = null,
  resolvedBy = null,
  expectType = null,
}) {
  if (!/^\d{11}$/.test(suffix)) throw new Error(`BLIK suffix must be 11 digits: ${suffix}`);
  return {
    traps,
    kind: "blik",
    card: null,
    bookingOn,
    occurredOn,
    amountMinor: -amountAbs,
    description: `Zakup BLIK ${freeText}:${suffix}`,
    counterparty,
    counterpartyAccount,
    rawMerchant: collapse(counterparty),
    pattern,
    resolvedBy,
    expectType,
  };
}

function blikWithdrawal({
  traps = [],
  counterparty,
  counterpartyAccount,
  freeText,
  suffix,
  amountAbs,
  bookingOn,
  occurredOn,
  pattern = null,
  resolvedBy = null,
  expectType = null,
}) {
  if (!/^\d{11}$/.test(suffix)) throw new Error(`BLIK suffix must be 11 digits: ${suffix}`);
  return {
    traps,
    kind: "blik-withdrawal",
    card: null,
    bookingOn,
    occurredOn,
    amountMinor: -amountAbs,
    description: `Wypłata BLIK ${freeText}:${suffix}`,
    counterparty,
    counterpartyAccount,
    rawMerchant: collapse(counterparty),
    pattern,
    resolvedBy,
    expectType,
  };
}

function transfer({
  traps = [],
  title,
  counterparty,
  counterpartyAccount,
  amountMinor,
  bookingOn,
  occurredOn,
  pattern = null,
  resolvedBy = null,
  expectType = null,
  kind = "transfer",
}) {
  return {
    traps,
    kind,
    card: null,
    bookingOn,
    occurredOn,
    amountMinor,
    description: title,
    counterparty,
    counterpartyAccount,
    rawMerchant: collapse(counterparty || title),
    pattern,
    resolvedBy,
    expectType,
  };
}

// --- Traps (main PLN file) --------------------------------------------------------------------------------
// Dates and amounts below are invented by the implementer (plan decision); only the ING slug name is reused
// for ST10. `d(month, day)` renders a 2026 ISO date.
const d = (m, day) => `2026-${pad(m)}-${pad(day)}`;

function buildST01() {
  const tail = "SKLEP PRZYKLAD WARSZAWA";
  return [
    card({
      traps: ["ST01"],
      card: CARDS[0],
      tail,
      amountAbs: 3500,
      bookingOn: d(3, 12),
      occurredOn: d(3, 10),
      pattern: "sklep-przyklad",
      resolvedBy: "normalization",
    }),
    card({
      traps: ["ST01"],
      card: CARDS[1],
      tail,
      amountAbs: 4200,
      bookingOn: d(4, 9),
      occurredOn: d(4, 7),
      pattern: "sklep-przyklad",
      resolvedBy: "normalization",
    }),
    card({
      traps: ["ST01"],
      card: CARDS[0],
      tail,
      amountAbs: 3900,
      bookingOn: d(5, 14),
      occurredOn: d(5, 13),
      pattern: "sklep-przyklad",
      resolvedBy: "normalization",
    }),
    card({
      traps: ["ST01"],
      card: CARDS[1],
      tail,
      amountAbs: 4600,
      bookingOn: d(6, 18),
      occurredOn: d(6, 16),
      pattern: "sklep-przyklad",
      resolvedBy: "normalization",
    }),
    card({
      traps: ["ST01"],
      card: CARDS[0],
      tail,
      amountAbs: 3700,
      bookingOn: d(7, 20),
      occurredOn: d(7, 19),
      pattern: "sklep-przyklad",
      resolvedBy: "normalization",
    }),
  ];
}

function buildST02() {
  return [
    card({
      traps: ["ST02"],
      card: CARDS[0],
      tail: "SIEC PRZYKLAD 0101 WARSZAWA",
      amountAbs: 2200,
      bookingOn: d(3, 5),
      occurredOn: d(3, 3),
      pattern: "siec-przyklad",
      resolvedBy: "normalization",
    }),
    card({
      traps: ["ST02"],
      card: CARDS[1],
      tail: "SIEC PRZYKLAD 0202 KRAKOW",
      amountAbs: 2100,
      bookingOn: d(4, 11),
      occurredOn: d(4, 9),
      pattern: "siec-przyklad",
      resolvedBy: "normalization",
    }),
    card({
      traps: ["ST02"],
      card: CARDS[0],
      tail: "SIEC PRZYKLAD 0101 WARSZAWA",
      amountAbs: 2500,
      bookingOn: d(5, 8),
      occurredOn: d(5, 6),
      pattern: "siec-przyklad",
      resolvedBy: "normalization",
    }),
    card({
      traps: ["ST02"],
      card: CARDS[1],
      tail: "SIEC PRZYKLAD 0202 KRAKOW",
      amountAbs: 2400,
      bookingOn: d(7, 15),
      occurredOn: d(7, 13),
      pattern: "siec-przyklad",
      resolvedBy: "normalization",
    }),
  ];
}

function buildST03() {
  const rows = [
    [CARDS[0], "MARKA *Marka App", d(3, 15), d(3, 14)],
    [CARDS[0], "MARKA APPS WARSZAWA", d(4, 15), d(4, 14)],
    [CARDS[1], "MARKA *Marka App", d(5, 15), d(5, 15)],
    [CARDS[1], "MARKA APPS WARSZAWA", d(6, 15), d(6, 13)],
    [CARDS[0], "MARKA *Marka App", d(7, 15), d(7, 14)],
    [CARDS[0], "MARKA APPS WARSZAWA", d(8, 15), d(8, 14)],
  ];
  return rows.map(([cardNo, tail, bookingOn, occurredOn]) =>
    card({
      traps: ["ST03"],
      card: cardNo,
      tail,
      amountAbs: 2999,
      bookingOn,
      occurredOn,
      pattern: "marka",
      resolvedBy: "user-merge",
      expectType: "fixed",
    }),
  );
}

function buildST04() {
  return [
    atm({
      traps: ["ST04"],
      card: CARDS[0],
      address: "UL. PRZYKLADOWA 5 WARSZAWA",
      amountAbs: 20000,
      bookingOn: d(3, 20),
      occurredOn: d(3, 19),
      pattern: "bankomat",
      resolvedBy: "normalization",
      expectType: "frequent",
    }),
    atm({
      traps: ["ST04"],
      card: CARDS[1],
      address: "AL. TESTOWA 12 KRAKOW",
      amountAbs: 30000,
      bookingOn: d(5, 22),
      occurredOn: d(5, 21),
      pattern: "bankomat",
      resolvedBy: "normalization",
      expectType: "frequent",
    }),
    atm({
      traps: ["ST04"],
      card: CARDS[0],
      address: "UL. PRZYKLADOWA 5 WARSZAWA",
      amountAbs: 25000,
      bookingOn: d(7, 25),
      occurredOn: d(7, 24),
      pattern: "bankomat",
      resolvedBy: "normalization",
      expectType: "frequent",
    }),
  ];
}

function buildST05() {
  const counterparty = "KSIEGARNIA PRZYKLAD";
  const account = invented26(5000000000001);
  return [
    blik({
      traps: ["ST05"],
      counterparty,
      counterpartyAccount: account,
      freeText: "KSIEGARNIA PRZYKLAD",
      suffix: "10293847561",
      amountAbs: 4500,
      bookingOn: d(3, 22),
      occurredOn: d(3, 20),
      pattern: "ksiegarnia-przyklad",
      resolvedBy: "import",
    }),
    // Domain-shaped token in the free text — rule 5 still takes col 3, D3 is not used.
    blik({
      traps: ["ST05"],
      counterparty,
      counterpartyAccount: account,
      freeText: "KSIEGARNIA-PRZYKLAD.PL",
      suffix: "20394857162",
      amountAbs: 3200,
      bookingOn: d(5, 11),
      occurredOn: d(5, 11),
      pattern: "ksiegarnia-przyklad",
      resolvedBy: "import",
    }),
    blik({
      traps: ["ST05"],
      counterparty,
      counterpartyAccount: account,
      freeText: "KSIEGARNIA PRZYKLAD",
      suffix: "30495867273",
      amountAbs: 5100,
      bookingOn: d(7, 9),
      occurredOn: d(7, 7),
      pattern: "ksiegarnia-przyklad",
      resolvedBy: "import",
    }),
  ];
}

function buildST06() {
  const counterparty = "WYPLATA BLIK GOTOWKA";
  const account = invented26(6000000000001);
  return [
    blikWithdrawal({
      traps: ["ST06"],
      counterparty,
      counterpartyAccount: account,
      freeText: "WYPLATA GOTOWKI",
      suffix: "40506172839",
      amountAbs: 10000,
      bookingOn: d(4, 17),
      occurredOn: d(4, 15),
      pattern: "wyplata-blik-gotowka",
      resolvedBy: "import",
    }),
    blikWithdrawal({
      traps: ["ST06"],
      counterparty,
      counterpartyAccount: account,
      freeText: "WYPLATA GOTOWKI",
      suffix: "50617283940",
      amountAbs: 15000,
      bookingOn: d(6, 21),
      occurredOn: d(6, 19),
      pattern: "wyplata-blik-gotowka",
      resolvedBy: "import",
    }),
  ];
}

function buildST07() {
  return [
    transfer({
      traps: ["ST07"],
      title: "Przelew środków",
      counterparty: "ANNA NOWAK",
      counterpartyAccount: invented26(7000000000001),
      amountMinor: -8000,
      bookingOn: d(3, 28),
      occurredOn: d(3, 27),
      pattern: "anna-nowak",
      resolvedBy: "import",
    }),
    transfer({
      traps: ["ST07"],
      title: "Przelew na telefon",
      counterparty: "PIOTR WISNIEWSKI",
      counterpartyAccount: invented26(7000000000002),
      amountMinor: -6000,
      bookingOn: d(5, 19),
      occurredOn: d(5, 18),
      pattern: "piotr-wisniewski",
      resolvedBy: "import",
    }),
    // Free title with a comma in col 2 — must come out quoted.
    transfer({
      traps: ["ST07"],
      title: "Platnosc za fakture, nr FV/2026/07/0099",
      counterparty: "FIRMA USLUGOWA SP. Z O.O.",
      counterpartyAccount: invented26(7000000000003),
      amountMinor: -45000,
      bookingOn: d(7, 30),
      occurredOn: d(7, 28),
      pattern: "firma-uslugowa",
      resolvedBy: "import",
      kind: "other",
    }),
  ];
}

function buildST08() {
  return [
    cardRefund({
      traps: ["ST08"],
      card: CARDS[0],
      tail: "SKLEP PRZYKLAD WARSZAWA",
      amountAbs: 4500,
      bookingOn: d(6, 5),
      occurredOn: d(6, 5),
    }),
  ];
}

function buildST09() {
  return [
    transfer({
      traps: ["ST09"],
      title: "Przelew środków",
      counterparty: "KLIENT TESTOWY SP. Z O.O.",
      counterpartyAccount: invented26(9000000000001),
      amountMinor: 120000,
      bookingOn: d(4, 3),
      occurredOn: d(4, 1),
    }),
    // Comma inside col 3 — must come out quoted.
    transfer({
      traps: ["ST09"],
      title: "Przelew środków",
      counterparty: "FIRMA, SPOLKA JAWNA",
      counterpartyAccount: invented26(9000000000002),
      amountMinor: 35000,
      bookingOn: d(8, 2),
      occurredOn: d(7, 31),
    }),
  ];
}

function buildST10() {
  const tail = "PIZZERIA TRZY SERY KRAKOW";
  return [
    card({
      traps: ["ST10"],
      card: CARDS[0],
      tail,
      amountAbs: 4500,
      bookingOn: d(3, 17),
      occurredOn: d(3, 16),
      pattern: "pizzeria-trzy-sery",
      resolvedBy: "normalization",
      expectType: "frequent",
    }),
    card({
      traps: ["ST10"],
      card: CARDS[1],
      tail,
      amountAbs: 7200,
      bookingOn: d(5, 24),
      occurredOn: d(5, 22),
      pattern: "pizzeria-trzy-sery",
      resolvedBy: "normalization",
      expectType: "frequent",
    }),
    card({
      traps: ["ST10"],
      card: CARDS[0],
      tail,
      amountAbs: 11000,
      bookingOn: d(7, 13),
      occurredOn: d(7, 11),
      pattern: "pizzeria-trzy-sery",
      resolvedBy: "normalization",
      expectType: "frequent",
    }),
  ];
}

function buildST11() {
  const counterparty = "SANTANDER BANK POLSKA S.A.";
  const account = invented26(1100000000001);
  const months = [3, 4, 5, 6, 7, 8];
  return months.map((m) =>
    transfer({
      traps: ["ST11"],
      title: "Oplata za prowadzenie konta",
      counterparty,
      counterpartyAccount: account,
      amountMinor: -1000,
      bookingOn: d(m, 3),
      occurredOn: d(m, 3),
      pattern: "oplata-za-prowadzenie-konta",
      resolvedBy: "import",
      expectType: "fixed",
      kind: "other",
    }),
  );
}

// --- Noise -------------------------------------------------------------------------------------------------
// Card merchants dominate (D-analogue of the real export's ~87% card share). Two merchants share a trailing
// city token ("… WARSZAWA") and one has a two-word city tail ("SUCHA BESKIDZKA") — over-merge guards for
// S-11's city-stripping (plan review F3): each stays its own pattern here.
const CARD_NOISE_POOL = [
  ["KAWIARNIA PRZYKLAD WARSZAWA", "kawiarnia-przyklad", 800, 2500],
  ["RESTAURACJA POD GORA WARSZAWA", "restauracja-pod-gora", 2500, 6000],
  ["SALON FRYZJERSKI STYL WARSZAWA", "salon-fryzjerski-styl", 4000, 9000],
  ["SKLEP ROWEROWY SUCHA BESKIDZKA", "sklep-rowerowy-sucha-beskidzka", 5000, 25000],
  ["DROGERIA PRZYKLAD KRAKOW", "drogeria-przyklad", 1000, 4000],
  ["APTEKA PRZYKLAD KRAKOW", "apteka-przyklad", 1500, 6000],
  ["STACJA PALIW PRZYKLAD KRAKOW", "stacja-paliw-przyklad", 8000, 25000],
  ["ABONAMENT SIEC PRZYKLAD WARSZAWA", "abonament-siec-przyklad", 2999, 3099],
  ["SIEC SPOZYWCZA DELTA WARSZAWA", "siec-spozywcza-delta", 1000, 8000],
  ["MYJNIA SAMOCHODOWA PRZYKLAD KRAKOW", "myjnia-samochodowa-przyklad", 3000, 9000],
];
const OTHER_NOISE_POOL = [
  ["USLUGI KOMPUTEROWE BAJT", "uslugi-komputerowe-bajt"],
  ["SERWIS SAMOCHODOWY TURBO", "serwis-samochodowy-turbo"],
];
// Buffer strictly inside (anchorLow, anchorHigh) so noise rows can never collide with the two anchor dates
// that must stay the file's unique booking-date extremes (see buildMainFile / orderMain).
const BUFFER_START = "2026-03-08";
const BUFFER_DAYS = 174; // 2026-03-08 .. 2026-08-28 inclusive

function cardNoise(rng, count) {
  const rows = [];
  for (let i = 0; i < count; i++) {
    const [tail, pattern, lo, hi] = CARD_NOISE_POOL[Math.floor(rng() * CARD_NOISE_POOL.length)];
    const cardNo = rng() < 0.55 ? CARDS[0] : CARDS[1];
    const amountAbs = Math.round(lo + rng() * (hi - lo));
    const bookingOn = addDays(BUFFER_START, Math.floor(rng() * BUFFER_DAYS));
    const gap = rng() < 0.1 ? 0 : 1 + Math.floor(rng() * 3);
    const occurredOn = addDays(bookingOn, -gap);
    rows.push(card({ card: cardNo, tail, amountAbs, bookingOn, occurredOn, pattern, resolvedBy: "normalization" }));
  }
  return rows;
}

function otherNoise(rng, count) {
  const rows = [];
  for (let i = 0; i < count; i++) {
    const [name, pattern] = OTHER_NOISE_POOL[Math.floor(rng() * OTHER_NOISE_POOL.length)];
    const amountAbs = Math.round(2000 + rng() * 8000);
    const bookingOn = addDays(BUFFER_START, Math.floor(rng() * BUFFER_DAYS));
    const gap = rng() < 0.1 ? 0 : 1 + Math.floor(rng() * 3);
    const occurredOn = addDays(bookingOn, -gap);
    rows.push(
      transfer({
        title: "Przelew środków",
        counterparty: name,
        counterpartyAccount: invented26(9100000000000 + i),
        amountMinor: -amountAbs,
        bookingOn,
        occurredOn,
        pattern,
        resolvedBy: "import",
      }),
    );
  }
  return rows;
}

// --- Ordering and balances ---------------------------------------------------------------------------------

// File order: Lp 1..N, roughly newest-first by booking date with a few adjacent inversions. `anchorHigh` and
// `anchorLow` must end up first/last respectively and are never swapped, so Lp 1's booking date stays the
// unique maximum (plan review F2) and Lp N stays the row the balance chain starts from.
function orderMain(rows, anchorHigh, anchorLow) {
  const withIndex = rows.map((r, i) => ({ r, i }));
  withIndex.sort((a, b) => (a.r.bookingOn === b.r.bookingOn ? a.i - b.i : a.r.bookingOn < b.r.bookingOn ? 1 : -1));
  const order = withIndex.map((x) => x.r);
  if (order[0] !== anchorHigh) throw new Error("orderMain: anchorHigh is not the booking-date maximum");
  if (order[order.length - 1] !== anchorLow) throw new Error("orderMain: anchorLow is not the booking-date minimum");

  const n = order.length;
  const targetInversions = Math.round((n - 1) * 0.08);
  let made = 0;
  let i = 1;
  while (made < targetInversions && i <= n - 3) {
    if (order[i].bookingOn !== order[i + 1].bookingOn) {
      [order[i], order[i + 1]] = [order[i + 1], order[i]];
      made++;
      i += 2;
    } else {
      i++;
    }
  }
  if (made === 0) throw new Error("orderMain: no adjacent booking-date inversion could be created (ST12)");
  order.forEach((r, idx) => (r.lp = idx + 1));
  return order;
}

// Small reject file: strictly descending, distinct booking dates — no inversions needed at this size.
function orderSimple(rows) {
  const order = [...rows].sort((a, b) => (a.bookingOn === b.bookingOn ? 0 : a.bookingOn < b.bookingOn ? 1 : -1));
  for (let i = 0; i < order.length - 1; i++) {
    if (order[i].bookingOn <= order[i + 1].bookingOn)
      throw new Error("orderSimple: booking dates are not strictly descending");
  }
  order.forEach((r, idx) => (r.lp = idx + 1));
  return order;
}

// True chronological order (oldest -> newest): booking date, then operation date, then Lp descending as the
// tie-break (plan's "Header invariants" paragraph). Mutates `balanceAfter` onto each row; returns the closing
// balance, which by construction equals the last-chronological row's balance == Lp 1's balance.
function computeBalances(order, opening) {
  const chrono = [...order].sort((a, b) => {
    if (a.bookingOn !== b.bookingOn) return a.bookingOn < b.bookingOn ? -1 : 1;
    if (a.occurredOn !== b.occurredOn) return a.occurredOn < b.occurredOn ? -1 : 1;
    return b.lp - a.lp;
  });
  if (chrono[chrono.length - 1] !== order[0]) throw new Error("computeBalances: Lp 1 is not chronologically last");
  if (chrono[0] !== order[order.length - 1]) throw new Error("computeBalances: Lp N is not chronologically first");
  let balance = opening;
  for (const row of chrono) {
    balance += row.amountMinor;
    row.balanceAfter = balance;
  }
  return balance;
}

// --- Rendering -----------------------------------------------------------------------------------------------

function renderHeader({ date, rangeStart, accountDigits, owner, currency, opening, closing, count }) {
  const fields = [
    bare(date),
    bare(dmy(rangeStart)),
    bare(groupAccount(accountDigits)),
    bare(owner),
    bare(currency),
    quoted(formatAmount(opening)),
    quoted(formatAmount(closing)),
    bare(String(count)),
    "",
  ];
  return fields.join(",");
}

function renderDataLine(row) {
  const fields = [
    bare(dmy(row.bookingOn)),
    bare(dmy(row.occurredOn)),
    maybeQuoted(row.description),
    row.counterparty ? maybeQuoted(row.counterparty) : "",
    row.counterpartyAccount ? bare(groupDigits(row.counterpartyAccount)) : "",
    quoted(formatAmount(row.amountMinor)),
    quoted(formatAmount(row.balanceAfter)),
    bare(String(row.lp)),
    "",
  ];
  return fields.join(",");
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function d5Type(amounts) {
  const m = median(amounts);
  const tolerance = Math.max((m * TOLERANCE.pct) / 100, TOLERANCE.minMinor);
  return amounts.every((a) => Math.abs(a - m) <= tolerance) ? "fixed" : "frequent";
}

// Patterns from imported rows only (D2: amount < 0); `order` is zipped with `manifestRows` by index so
// resolvedBy/expectType (not serialised onto the manifest row) are still available for the self-check.
function buildPatterns(manifestRows, order) {
  const byKey = new Map();
  manifestRows.forEach((m, i) => {
    if (!m.imported) return;
    const src = order[i];
    const group = byKey.get(m.pattern) ?? { rows: [], resolvedBy: new Set(), expectTypes: new Set() };
    group.rows.push(m);
    group.resolvedBy.add(src.resolvedBy);
    if (src.expectType) group.expectTypes.add(src.expectType);
    byKey.set(m.pattern, group);
  });
  return [...byKey.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([key, group]) => {
      if (group.resolvedBy.size !== 1) throw new Error(`pattern ${key}: conflicting resolvedBy`);
      const amounts = group.rows.map((r) => -r.amountMinor);
      const type = d5Type(amounts);
      for (const expected of group.expectTypes) {
        if (expected !== type) throw new Error(`pattern ${key}: declared ${expected}, D5 gives ${type}`);
      }
      return {
        key,
        type,
        resolvedBy: [...group.resolvedBy][0],
        traps: [...new Set(group.rows.flatMap((r) => r.traps))].sort(),
        rawMerchants: [...new Set(group.rows.map((r) => r.rawMerchant))].sort(),
        occurrences: group.rows.length,
        sumMinor: amounts.reduce((s, a) => s + a, 0),
        medianMinor: Math.round(median(amounts)),
        firstMonth: group.rows.map((r) => r.occurredOn.slice(0, 7)).sort()[0],
      };
    });
}

function rowToManifest(fileName) {
  return (row) => ({
    file: fileName,
    lp: row.lp,
    line: row.lp + 1,
    bookedOn: row.bookingOn,
    occurredOn: row.occurredOn,
    amountMinor: row.amountMinor,
    kind: row.kind,
    card: row.card ?? null,
    traps: [...row.traps].sort(),
    imported: row.amountMinor < 0,
    skipReason: row.amountMinor < 0 ? null : "credit",
    rawMerchant: row.rawMerchant,
    pattern: row.amountMinor < 0 ? row.pattern : null,
  });
}

function rejectRowToManifest(fileName) {
  return (row) => ({
    file: fileName,
    lp: row.lp,
    line: row.lp + 1,
    bookedOn: row.bookingOn,
    occurredOn: row.occurredOn,
    amountMinor: row.amountMinor,
    kind: row.kind,
    card: row.card ?? null,
    traps: [...row.traps].sort(),
    imported: false,
    skipReason: "rejected-file",
    rawMerchant: row.rawMerchant,
    pattern: null,
  });
}

// --- File builders -------------------------------------------------------------------------------------------

function buildMainFile() {
  const rng = mulberry32(SEED);
  const trapRows = [
    ...buildST01(),
    ...buildST02(),
    ...buildST03(),
    ...buildST04(),
    ...buildST05(),
    ...buildST06(),
    ...buildST07(),
    ...buildST08(),
    ...buildST09(),
    ...buildST10(),
    ...buildST11(),
  ];
  // Anchors: the unique booking-date extremes (see orderMain/computeBalances); counted as ordinary noise
  // merchant occurrences so they also contribute to those patterns.
  const anchorHigh = card({
    card: CARDS[0],
    tail: "KAWIARNIA PRZYKLAD WARSZAWA",
    amountAbs: 1850,
    bookingOn: EXPORT_DATE,
    occurredOn: addDays(EXPORT_DATE, -1),
    pattern: "kawiarnia-przyklad",
    resolvedBy: "normalization",
  });
  const anchorLow = card({
    card: CARDS[1],
    tail: "DROGERIA PRZYKLAD KRAKOW",
    amountAbs: 2200,
    bookingOn: addDays(RANGE_START, 1),
    occurredOn: RANGE_START,
    pattern: "drogeria-przyklad",
    resolvedBy: "normalization",
  });
  const noise = [...cardNoise(rng, 136), ...otherNoise(rng, 4)];
  const all = [...trapRows, anchorHigh, anchorLow, ...noise];

  const order = orderMain(all, anchorHigh, anchorLow);
  // ST12 and ST13 are file-level traits (date-shift/inversion; header shape) rather than a distinct merchant,
  // so they are tagged onto one representative row each: the first adjacent inversion pair's earlier-position
  // row, and the Lp 1 / closing-balance anchor.
  for (let i = 1; i < order.length - 2; i++) {
    if (order[i].bookingOn < order[i + 1].bookingOn) {
      order[i].traps = [...order[i].traps, "ST12"];
      break;
    }
  }
  anchorHigh.traps = [...anchorHigh.traps, "ST13"];

  const closing = computeBalances(order, OPENING);
  const dataLines = order.map(renderDataLine);
  const header = renderHeader({
    date: EXPORT_DATE,
    rangeStart: RANGE_START,
    accountDigits: ACCOUNT_DIGITS,
    owner: OWNER,
    currency: "PLN",
    opening: OPENING,
    closing,
    count: order.length,
  });
  const text = [header, ...dataLines].join("\n") + "\n";
  if (text.includes("\r")) throw new Error(`${MAIN_FILE}: CR in output, line endings must be LF`);
  for (const line of [...dataLines, header]) {
    if (countFields(line) !== 9) throw new Error(`${MAIN_FILE}: a line does not have 9 fields`);
  }

  const manifestRows = order.map(rowToManifest(MAIN_FILE));
  const imported = manifestRows.filter((m) => m.imported);
  const fileEntry = {
    expect: "ok",
    reason: null,
    account: ACCOUNT_DIGITS,
    currency: "PLN",
    period: { start: RANGE_START, end: EXPORT_DATE },
    declaredCount: order.length,
    imported: { count: imported.length, sumMinor: imported.reduce((s, m) => s - m.amountMinor, 0) },
  };
  const seen = new Set(manifestRows.flatMap((m) => m.traps));
  const missingInMain = Object.keys(TRAPS).filter((t) => t !== "ST14" && !seen.has(t));
  if (missingInMain.length) throw new Error(`traps without a row in the main file: ${missingInMain.join(", ")}`);
  return { name: MAIN_FILE, bytes: new TextEncoder().encode(text), fileEntry, manifestRows, order };
}

function buildUsdFile() {
  const rows = [
    card({
      traps: ["ST14"],
      card: CARDS[0],
      tail: "SHOP*ONLINE NEW YORK",
      amountAbs: 5000,
      bookingOn: "2026-08-20",
      occurredOn: "2026-08-18",
      currency: "USD",
    }),
    card({
      traps: ["ST14"],
      card: CARDS[1],
      tail: "STORE_EXAMPLE BOSTON",
      amountAbs: 3200,
      bookingOn: "2026-08-10",
      occurredOn: "2026-08-08",
      currency: "USD",
    }),
    card({
      traps: ["ST14"],
      card: CARDS[0],
      tail: "SAMPLE SHOP CHICAGO",
      amountAbs: 2100,
      bookingOn: "2026-08-03",
      occurredOn: "2026-08-01",
      currency: "USD",
    }),
  ];
  const order = orderSimple(rows);
  const closing = computeBalances(order, USD_OPENING);
  const dataLines = order.map(renderDataLine);
  const header = renderHeader({
    date: EXPORT_DATE,
    rangeStart: "2026-08-01",
    accountDigits: USD_ACCOUNT_DIGITS,
    owner: OWNER,
    currency: "USD",
    opening: USD_OPENING,
    closing,
    count: order.length,
  });
  const text = [header, ...dataLines].join("\n") + "\n";
  if (text.includes("\r")) throw new Error(`${USD_FILE}: CR in output, line endings must be LF`);
  for (const line of [...dataLines, header]) {
    if (countFields(line) !== 9) throw new Error(`${USD_FILE}: a line does not have 9 fields`);
  }
  const manifestRows = order.map(rejectRowToManifest(USD_FILE));
  const fileEntry = {
    expect: "reject",
    reason: "currency",
    account: USD_ACCOUNT_DIGITS,
    currency: "USD",
    period: { start: "2026-08-01", end: EXPORT_DATE },
    declaredCount: order.length,
    imported: { count: 0, sumMinor: 0 },
  };
  return { name: USD_FILE, bytes: new TextEncoder().encode(text), fileEntry, manifestRows };
}

function readme(expected) {
  const main = expected.files[MAIN_FILE];
  const trapRows = (id) =>
    expected.rows
      .filter((r) => r.traps.includes(id))
      .map((r) => r.line)
      .join(", ");
  const lines = [
    "# Syntetyczny wyciąg Santander (fixture F-03)",
    "",
    "Plik wygenerowany przez `scripts/fixture-santander.mjs` — nie edytuj ręcznie.",
    "",
    "## Pochodzenie",
    "",
    "Kształt plików pochodzi z `context/foundation/import-formats.md` (sekcja „Santander Bank Polska”) i z",
    "agregowanego porównania struktury z prawdziwymi eksportami (maski pól, cudzysłowy, liczniki, same",
    "wartości logiczne — bez wartości):",
    "",
    "- UTF-8 bez BOM, końce linii LF, separator `,`, 9 pól w każdym wierszu (nagłówek i dane), ostatnie puste;",
    "- nagłówek: data eksportu (`YYYY-MM-DD`), data początku zakresu (`DD-MM-YYYY`), numer rachunku z wiodącym",
    "  `'` w grupach (2 + 6×4 cyfry), właściciel (jedno pole bez przecinka), waluta, saldo początkowe/końcowe",
    "  w cudzysłowie, liczba wierszy danych;",
    "- dane: data księgowania, data operacji (**używana** jako `occurredOn`), opis, kontrahent, nr rachunku",
    "  kontrahenta, kwota w cudzysłowie, saldo po operacji w cudzysłowie, `Lp`, (puste); kol. 2/3 w cudzysłowie",
    '  tylko gdy zawierają przecinek, bez escapowania `"`;',
    "- opis kartowy: `DOP. VISA <maska> PŁATNOŚĆ KARTĄ <kwota.> <WALUTA> <końcówka ASCII>` (też ZWROT i",
    "  WYPŁATA Z BANKOMATU); `Zakup BLIK`/`Wypłata BLIK <tekst>:<11 cyfr>`; przelewy i `Oplata za …`;",
    "- `Lp` 1..N rosnąco w kolejności pliku, wiersze ≈ od najnowszej daty księgowania z nielicznymi inwersjami;",
    "  saldo liczone w prawdziwym porządku chronologicznym (data księgowania, data operacji, `Lp` malejąco),",
    "  nie w kolejności pliku — plik nie ma gładkiego łańcucha sald w swojej własnej kolejności.",
    "",
    "Wszystkie nazwy, adresy, numery i kwoty są wymyślone — żadna wartość nie pochodzi z prawdziwego wyciągu.",
    "",
    "## Pliki",
    "",
    "| Plik | Oczekiwany wynik |",
    "|---|---|",
    `| \`${MAIN_FILE}\` | ok; ${main.declaredCount} wierszy, import ${main.imported.count} obciążeń, suma ${formatAmount(main.imported.sumMinor)} zł, okres ${main.period.start} – ${main.period.end} |`,
    `| \`${USD_FILE}\` | reject (\`currency\`): waluta rachunku to USD, nie PLN; ${expected.files[USD_FILE].declaredCount} wiersze |`,
    "| `expected.json` | klucz odpowiedzi: `files`, `rows`, `patterns`, `crossBank` |",
    "",
    "## Pułapki",
    "",
    "Wiersze pułapki: `rows[]` z danym identyfikatorem w `traps`; wzorce: `patterns[]` z tym identyfikatorem.",
    "ST12/ST13 są cechami pliku (przesunięcie dat / nagłówek), nie osobnym sprzedawcą — oznaczone na jednym",
    "reprezentatywnym wierszu każda.",
    "",
    "| ID | Pułapka | Oczekiwany wynik | Linie w głównym pliku |",
    "|---|---|---|---|",
    ...Object.entries(TRAPS).map(([id, [what, outcome]]) => `| ${id} | ${what} | ${outcome} | ${trapRows(id)} |`),
    "",
    "Pozostałe wiersze to szum kartowy/przelewowy z zasianego PRNG — też mają wpisy w `rows[]` i `patterns[]`.",
    "",
    "## Polecenia",
    "",
    "- `npm run fixture:santander` — regeneruje wszystkie pliki w tym katalogu (deterministycznie, bajt w bajt).",
    "- `npm run fixture:check` — porównuje pliki z wyjściem generatora i sprawdza kontrakt formatu (ING i Santander).",
    "- `npm run fixture:shape:santander` — lokalnie porównuje strukturę z prawdziwym wyciągiem w `data/` (tylko statystyki).",
    "",
    "## Zasada zmian",
    "",
    "Zmiana fixture = zmiana deklaracji w `scripts/fixture-santander.mjs` + `npm run fixture:santander`. Nie",
    "edytuj CSV ani `expected.json` ręcznie.",
    "",
  ];
  return lines.join("\n");
}

export function generate() {
  const main = buildMainFile();
  const usd = buildUsdFile();
  const expected = {
    schema: 1,
    bank: "santander",
    tolerance: TOLERANCE,
    crossBank: [{ pattern: "pizzeria-trzy-sery", oracle: "test/fixtures/ing/expected.json", traps: ["ST10"] }],
    files: { [main.name]: main.fileEntry, [usd.name]: usd.fileEntry },
    rows: [...main.manifestRows, ...usd.manifestRows],
    patterns: buildPatterns(main.manifestRows, main.order),
  };
  return {
    [main.name]: main.bytes,
    [usd.name]: usd.bytes,
    "expected.json": JSON.stringify(expected, null, 2) + "\n",
    "README.md": readme(expected),
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const files = generate();
  mkdirSync(OUT_DIR, { recursive: true });
  for (const [name, content] of Object.entries(files)) writeFileSync(path.join(OUT_DIR, name), content);
  console.log(
    `fixture:santander wrote ${Object.keys(files).length} files to ${path.relative(process.cwd(), OUT_DIR)}/`,
  );
}
