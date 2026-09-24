// Synthetic ING statement fixture (F-02): deterministic generator of test/fixtures/ing/.
// Shapes come from context/foundation/import-formats.md plus a structure-only comparison with a real export
// (field masks, quoting, counts — no values); every name, number, amount and date below is invented,
// nothing is copied from a real statement. Traps T01–T19 are declared as data; one run builds the CSV and
// expected.json together, so the answer key cannot drift from the file.
// Zero dependencies on purpose, no clock, seeded PRNG. Run: npm run fixture:ing (writes test/fixtures/ing/).
// Other scripts import { generate } to get the same files in memory (path -> Uint8Array | string).

import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { TextDecoder } from "node:util";

const OUT_DIR = path.resolve(import.meta.dirname, "../test/fixtures/ing");
const SEED = 20250901;
const GENERATED_ON = "2026-09-01";
const PERIOD = { start: "2025-09-01", end: "2026-08-31" };
const MONTHS = [
  "2025-09",
  "2025-10",
  "2025-11",
  "2025-12",
  "2026-01",
  "2026-02",
  "2026-03",
  "2026-04",
  "2026-05",
  "2026-06",
  "2026-07",
  "2026-08",
];
const LAST_MONTH = MONTHS[MONTHS.length - 1];
// D5 from import-formats.md: fixed pattern = every amount within max(15% of the median, 10 zł) of the median.
const TOLERANCE = {
  pct: 15,
  minMinor: 1000,
  rule: "D5: max(15% mediany, 10 zł); |kwota - mediana| <= tolerancja; mediana parzystej liczby = średnia dwóch środkowych",
};
// Rule 7 operator list (import-formats.md), matched case-insensitively against "Dane kontrahenta".
const OPERATORS = ["PayPro", "PayU", "Cashbill", "Autopay", "ING Pay"];

const GENERATED_AT = "09:15";
// The bank's own public letterhead (preamble line 1) — the only real-world string in the file.
const BANK_HEADER = "ING Bank Śląski S.A. ul. Sokolska 34, 40-086 Katowice";
const OWNER = { name: "PRZYKŁADOWA FIRMA JAN PRZYKŁADOWY", address: "UL. TESTOWA 1A 00-001 PRZYKŁADOWO" };
// `name` = the Konto column; the preamble lists it as "<name> (PLN)". Numbers: 2 + 4×6 digit groups.
const MAIN = { name: "Rachunek Firmowy Główny", number: "11 1111 0000 0000 0000 0000 0001" };
const VAT = { name: "Rachunek VAT", number: "11 1111 0000 0000 0000 0000 0002" };
const MAIN_FILE = "Lista_transakcji_nr_0000123456_010926.csv";
// Counterparty banks (Nazwa banku), all invented; picked from the account number so a number keeps its bank.
const BANKS = ["BANK PRZYKŁADOWY S.A.", "BANK TESTOWY S.A.", "FIKCYJNY BANK SPÓŁDZIELCZY"];
const ROW_WIDTH = 21;

// 15 column names per the column table in import-formats.md; columns 15–20 are unnamed and empty.
const COLUMNS = [
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

export const TRAPS = {
  T01: [
    "Ten sam sprzedawca w dwóch zapisach (`sportowo.pl …` vs `SPORTOWO SP. Z O.O. …`)",
    "jeden wzorzec, user-merge",
  ],
  T02: [
    "Nazwa sklepu zdublowana w kontrahencie (`PIEKARNIA KŁOSEK PIEKARNIA KŁOSEK …`)",
    "jeden wzorzec, normalization",
  ],
  T03: ["Sieć z numerem placówki, dwie placówki (`MINIMARKET PRZYSTANEK 0412/1187`)", "jeden wzorzec, normalization"],
  T04: ["Operator płatności z domeną sprzedawcy w końcówce `Tytułu` BLIK", "surowy sprzedawca = domena (D3), import"],
  T05: ["Operator bez domeny w `Tytule` (Autopay)", "surowy sprzedawca = kontrahent ze zwiniętymi spacjami"],
  T06: [
    "Przelew własny między rachunkami: para ±, to samo `Nr transakcji`, różne `Konto`",
    "obciążenie na głównym importowane, strona VAT pominięta (D1)",
  ],
  T07: [
    "Split payment VAT (`PRZ SP Ref SP: …`), para na głównym i VAT",
    "obciążenie na głównym importowane, strona VAT pominięta (D1)",
  ],
  T08: ["Powtarzalny przelew na własne konto w innym banku (D8)", "wzorzec, user-exclude"],
  T09: ["Opłaty US/ZUS, powtarzalne, zmienna kwota", "frequent"],
  T10: ["Abonament ze stałą kwotą", "fixed"],
  T11: ["Abonament z jedną podwyżką ~12%", "jeden wzorzec fixed przy D5"],
  T12: ["Sprzedawca z rozrzutem ~45%", "frequent"],
  T13: ["Zwrot BLIK (kwota dodatnia, `Zwrot transakcji BLIK … Nr zwrotu …`)", "pominięty, skipReason credit (D2)"],
  T14: ["PayPal jako pośrednik", "sprzedawca nieprzezroczysty (FR-014)"],
  T15: ["Allegro", "sprzedawca nieprzezroczysty (D3)"],
  T16: ["Nowy wzorzec stały tylko w ostatnim miesiącu", "fixed, firstMonth 2026-08 (D6)"],
  T17: ["Uznania (przelew przychodzący, P.BLIK przychodzący)", "pominięte, skipReason credit"],
  T18: ["Wiersze rachunku VAT poza parami T06/T07", "pominięte, skipReason other-account (D1)"],
  T19: [
    'Cudzysłów w nazwie kontrahenta bez escapowania (ING nie podwaja `"`)',
    'parser czyta pole łagodnie: `"` zamyka pole tylko przed `;` lub końcem linii; wzorzec, normalization',
  ],
};

// cp1250 encoder: Node's TextDecoder only decodes windows-1250. A character outside the table throws.
const CP1250 = new Map([
  ["ą", 0xb9],
  ["ć", 0xe6],
  ["ę", 0xea],
  ["ł", 0xb3],
  ["ń", 0xf1],
  ["ó", 0xf3],
  ["ś", 0x9c],
  ["ź", 0x9f],
  ["ż", 0xbf],
  ["Ą", 0xa5],
  ["Ć", 0xc6],
  ["Ę", 0xca],
  ["Ł", 0xa3],
  ["Ń", 0xd1],
  ["Ó", 0xd3],
  ["Ś", 0x8c],
  ["Ź", 0x8f],
  ["Ż", 0xaf],
  ["„", 0x84],
  ["”", 0x94],
  ["–", 0x96],
  ["…", 0x85],
]);

function encodeCp1250(text) {
  const bytes = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const code = ch.charCodeAt(0);
    const byte = code < 0x80 ? code : CP1250.get(ch);
    if (byte === undefined) throw new Error(`cp1250: no mapping for ${JSON.stringify(ch)} (U+${code.toString(16)})`);
    bytes[i] = byte;
  }
  if (new TextDecoder("windows-1250").decode(bytes) !== text) throw new Error("cp1250: round-trip mismatch");
  return bytes;
}

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

const plDate = (iso) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}`;

function formatAmount(minor) {
  const abs = Math.abs(minor);
  return `${minor < 0 ? "-" : ""}${Math.floor(abs / 100)},${pad(abs % 100)}`;
}

const collapse = (s) => s.trim().replace(/\s+/g, " ");
const digits = (s) => s.replace(/\s+/g, "");

// Monthly schedule: amounts[i] falls on `day` of MONTHS[from + i].
function monthly(day, amounts, from = 0) {
  return amounts.map((amount, i) => [`${MONTHS[from + i]}-${pad(day)}`, amount]);
}

// Title builders get (date, rng) so BLIK numbers come from the seeded PRNG in declaration order.
function blik(token = "") {
  return (date, rng) =>
    collapse(`Płatność BLIK ${plDate(date)} Nr transakcji ${Math.floor(1e10 + rng() * 9e10)} ${token}`);
}

function blikRefund(date, rng) {
  const tx = Math.floor(1e10 + rng() * 9e10);
  const refund = Math.floor(1e8 + rng() * 9e8);
  return `Zwrot transakcji BLIK ${plDate(date)} Nr transakcji ${tx} Nr zwrotu ${refund}`;
}

const monthTitle = (prefix) => (date) => `${prefix} ${date.slice(5, 7)}/${date.slice(0, 4)}`;

// Trap declarations. amounts are positive grosze; `credit: true` makes them positive in the file, otherwise
// debits (negative). `pair` mirrors every row onto the other account with the opposite sign and the same
// Nr transakcji. `pattern`/`resolvedBy` are the intended outcome after normalization and user decisions;
// `expectType` must agree with D5 computed from the imported amounts (generation fails otherwise).
// `details` is the Szczegóły type; with `splitRef` it renders as "<type> Ref SP: <ref> " (split payment: "PRZ SP"
// on the paying side, "PRZELEW" on the VAT side via `pair.details`). TR.BLIK rows carry no Nr rachunku unless
// the series sets `accountNo`; every other type gets one.
const TRAP_SERIES = [
  {
    traps: ["T01"],
    details: "TR.BLIK",
    counterparty: "sportowo.pl   UL. BIEGOWA 7    GDYNIA",
    title: blik("sportowo.pl"),
    entries: [
      ["2025-09-14", 18999],
      ["2025-12-03", 7450],
      ["2026-03-21", 25900],
      ["2026-06-09", 12900],
    ],
    pattern: "sportowo",
    resolvedBy: "user-merge",
  },
  {
    traps: ["T01"],
    details: "TR.BLIK",
    counterparty: "SPORTOWO SP. Z O.O. ul. Biegowa 7 Gdynia",
    title: blik("SPORTOWO"),
    entries: [
      ["2025-10-22", 9990],
      ["2026-01-17", 34900],
      ["2026-04-28", 5999],
      ["2026-07-12", 15490],
    ],
    pattern: "sportowo",
    resolvedBy: "user-merge",
  },
  {
    traps: ["T02"],
    details: "TR.BLIK",
    counterparty: "PIEKARNIA KŁOSEK PIEKARNIA KŁOSEK ŁÓDŹ",
    title: blik("KLOSEK"),
    entries: [
      ["2025-09-06", 1250],
      ["2025-11-15", 2380],
      ["2026-01-10", 890],
      ["2026-03-07", 1645],
      ["2026-05-16", 3120],
      ["2026-07-25", 1480],
    ],
    pattern: "piekarnia-klosek",
    resolvedBy: "normalization",
  },
  {
    traps: ["T03"],
    details: "TR.BLIK",
    counterparty: "MINIMARKET PRZYSTANEK 0412 UL. TORUŃSKA 12 KRAKÓW",
    title: blik("PRZYSTANEK"),
    entries: [
      ["2025-09-19", 2345],
      ["2025-12-19", 4120],
      ["2026-03-13", 1799],
      ["2026-06-26", 6230],
    ],
    pattern: "minimarket-przystanek",
    resolvedBy: "normalization",
  },
  {
    traps: ["T03"],
    details: "TR.BLIK",
    counterparty: "MINIMARKET PRZYSTANEK 1187   AL. ŚWIERKOWA 5   KRAKÓW",
    title: blik("PRZYSTANEK"),
    entries: [
      ["2025-10-30", 3380],
      ["2026-02-11", 1575],
      ["2026-05-02", 4899],
      ["2026-08-14", 2710],
    ],
    pattern: "minimarket-przystanek",
    resolvedBy: "normalization",
  },
  {
    traps: ["T04"],
    details: "TR.BLIK",
    counterparty: "PayU S.A. UL. PRZYKŁADOWA 3 POZNAŃ",
    title: blik("ksiegarnia-przyklad.pl"),
    entries: [
      ["2025-10-05", 4590],
      ["2026-01-24", 12900],
      ["2026-04-11", 3250],
      ["2026-07-03", 8999],
    ],
    pattern: "ksiegarnia-przyklad.pl",
    resolvedBy: "import",
  },
  {
    traps: ["T04"],
    details: "TR.BLIK",
    counterparty: "PAYPRO SA UL. PRZYKŁADOWA 8 POZNAŃ",
    title: blik("kawa-testowa.pl"),
    entries: monthly(2, Array(12).fill(3900)),
    pattern: "kawa-testowa.pl",
    resolvedBy: "import",
    expectType: "fixed",
  },
  {
    traps: ["T04"],
    details: "TR.BLIK",
    counterparty: "CASHBILL S.A. UL. PRZYKŁADOWA 11 KATOWICE",
    // BLIK tail as a full URL: rule 7 takes it as-is, so reaching the domain is normalization's job.
    title: blik("https://www.bilety-przyklad.pl"),
    entries: [
      ["2025-11-08", 6000],
      ["2026-05-23", 12000],
    ],
    pattern: "bilety-przyklad.pl",
    resolvedBy: "normalization",
  },
  {
    traps: ["T04"],
    details: "TR.BLIK",
    counterparty: "ING PAY UL. PRZYKŁADOWA 34 KATOWICE",
    title: blik("apteka-przyklad.pl"),
    entries: [
      ["2025-12-12", 2345],
      ["2026-02-27", 5670],
      ["2026-06-18", 1899],
    ],
    pattern: "apteka-przyklad.pl",
    resolvedBy: "import",
  },
  {
    traps: ["T04"],
    details: "TR.BLIK",
    counterparty: "AUTOPAY S.A.   UL. PRZYKŁADOWA 9   SOPOT",
    title: blik("kurs-przyklad.pl"),
    entries: [
      ["2026-02-02", 19900],
      ["2026-03-02", 19900],
    ],
    pattern: "kurs-przyklad.pl",
    resolvedBy: "import",
  },
  {
    traps: ["T05"],
    details: "TR.BLIK",
    counterparty: "AUTOPAY S.A.   UL. PRZYKŁADOWA 9   SOPOT",
    title: blik(),
    entries: [
      ["2025-11-26", 2750],
      ["2026-04-16", 8400],
    ],
    pattern: "autopay",
    resolvedBy: "normalization",
  },
  {
    traps: ["T06"],
    details: "PRZELEW",
    counterparty: `${OWNER.name} ${OWNER.address}`,
    accountNo: digits(VAT.number),
    title: "Przelew własny",
    entries: [
      ["2025-10-15", 150000],
      ["2026-02-16", 80000],
      ["2026-06-15", 210000],
    ],
    pair: { account: VAT, counterparty: `${OWNER.name} ${OWNER.address}`, accountNo: digits(MAIN.number) },
    pattern: "przelew-wlasny-vat",
    resolvedBy: "normalization",
  },
  {
    traps: ["T07"],
    details: "PRZ SP",
    splitRef: "WTA250925000417",
    counterparty: "RACHUNEK VAT PRZYKŁADOWA FIRMA",
    accountNo: digits(VAT.number),
    title: "Przeksięgowanie VAT FV/09/2025",
    entries: [["2025-09-25", 23000]],
    pair: {
      account: VAT,
      details: "PRZELEW",
      counterparty: "RACHUNEK VAT PRZYKŁADOWA FIRMA",
      accountNo: digits(MAIN.number),
    },
    pattern: "przeksiegowanie-vat",
    resolvedBy: "normalization",
  },
  {
    traps: ["T07"],
    details: "PRZ SP",
    splitRef: "WTA251222000873",
    counterparty: "RACHUNEK VAT PRZYKŁADOWA FIRMA",
    accountNo: digits(VAT.number),
    title: "Przeksięgowanie VAT FV/12/2025",
    entries: [["2025-12-22", 41400]],
    pair: {
      account: VAT,
      details: "PRZELEW",
      counterparty: "RACHUNEK VAT PRZYKŁADOWA FIRMA",
      accountNo: digits(MAIN.number),
    },
    pattern: "przeksiegowanie-vat",
    resolvedBy: "normalization",
  },
  {
    traps: ["T07"],
    details: "PRZ SP",
    splitRef: "WTA260324000129",
    counterparty: "RACHUNEK VAT PRZYKŁADOWA FIRMA",
    accountNo: digits(VAT.number),
    title: "Przeksięgowanie VAT FV/03/2026",
    entries: [["2026-03-24", 18400]],
    pair: {
      account: VAT,
      details: "PRZELEW",
      counterparty: "RACHUNEK VAT PRZYKŁADOWA FIRMA",
      accountNo: digits(MAIN.number),
    },
    pattern: "przeksiegowanie-vat",
    resolvedBy: "normalization",
  },
  {
    traps: ["T07"],
    details: "PRZ SP",
    splitRef: "WTA260624000561",
    counterparty: "RACHUNEK VAT PRZYKŁADOWA FIRMA",
    accountNo: digits(VAT.number),
    title: "Przeksięgowanie VAT FV/06/2026",
    entries: [["2026-06-24", 32200]],
    pair: {
      account: VAT,
      details: "PRZELEW",
      counterparty: "RACHUNEK VAT PRZYKŁADOWA FIRMA",
      accountNo: digits(MAIN.number),
    },
    pattern: "przeksiegowanie-vat",
    resolvedBy: "normalization",
  },
  {
    traps: ["T08"],
    details: "PRZELEW",
    counterparty: "JAN PRZYKŁADOWY UL. TESTOWA 1A 00-001 PRZYKŁADOWO",
    accountNo: "99888800000000000000000042",
    title: "Przelew na konto osobiste",
    entries: monthly(11, Array(12).fill(150000)),
    pattern: "przelew-konto-osobiste",
    resolvedBy: "user-exclude",
  },
  {
    traps: ["T09"],
    details: "PRZELEW",
    counterparty: "URZĄD SKARBOWY W PRZYKŁADOWIE",
    // Tax micro-account in the bank's short "<7 digits>\\<5 digits>" form.
    accountNo: "7710100\\00001",
    title: monthTitle("PIT-5L zaliczka"),
    entries: monthly(20, [41200, 125000, 38000, 90500, 67300, 21000, 148800, 55600, 73400, 99900, 30100, 84700]),
    pattern: "urzad-skarbowy",
    resolvedBy: "normalization",
    expectType: "frequent",
  },
  {
    traps: ["T09"],
    details: "PRZELEW",
    counterparty: "ZAKŁAD UBEZPIECZEŃ SPOŁECZNYCH",
    accountNo: "77600000000000000000000002",
    title: monthTitle("Składki ZUS"),
    entries: monthly(
      10,
      [148034, 152011, 191042, 145580, 210533, 149912, 163377, 187020, 144009, 158818, 199945, 151230],
    ),
    pattern: "zus",
    resolvedBy: "normalization",
    expectType: "frequent",
  },
  {
    traps: ["T10"],
    details: "TR.BLIK",
    counterparty: "MUZYKALNIA SP. Z O.O. UL. NUTOWA 4 WARSZAWA",
    title: blik("muzykalnia.pl"),
    entries: monthly(8, Array(12).fill(2499)),
    pattern: "muzykalnia",
    resolvedBy: "normalization",
    expectType: "fixed",
  },
  {
    traps: ["T11"],
    details: "TR.BLIK",
    counterparty: "KINOTEKA SP. Z O.O. UL. EKRANOWA 21 WARSZAWA",
    title: blik("kinoteka.pl"),
    // Price rise 49,99 -> 55,99 (+12%) from 2026-03, mid-range.
    entries: monthly(17, [...Array(6).fill(4999), ...Array(6).fill(5599)]),
    pattern: "kinoteka",
    resolvedBy: "normalization",
    expectType: "fixed",
  },
  {
    traps: ["T12"],
    details: "TR.BLIK",
    counterparty: "RESTAURACJA POD PRZYKŁADEM UL. SMACZNA 2 WROCŁAW",
    title: blik("PODPRZYKLADEM"),
    entries: [
      ["2025-09-27", 4500],
      ["2025-10-18", 8900],
      ["2025-11-29", 6200],
      ["2026-01-03", 11600],
      ["2026-02-14", 7300],
      ["2026-03-28", 5100],
      ["2026-04-25", 9800],
      ["2026-05-30", 6900],
      ["2026-07-18", 12400],
      ["2026-08-22", 5600],
    ],
    pattern: "restauracja-pod-przykladem",
    resolvedBy: "normalization",
    expectType: "frequent",
  },
  {
    traps: ["T13", "T01"],
    details: "TR.BLIK",
    counterparty: "sportowo.pl   UL. BIEGOWA 7    GDYNIA",
    title: blikRefund,
    accountNo: "66555500000000000000000011",
    entries: [["2026-03-26", 25900]],
    credit: true,
  },
  {
    traps: ["T14"],
    details: "TR.BLIK",
    counterparty: "PAYPAL EUROPE S.A.R.L. ET CIE S.C.A LUXEMBOURG",
    title: blik("PAYPAL"),
    entries: [
      ["2025-10-09", 3499],
      ["2026-01-29", 15900],
      ["2026-04-07", 7250],
      ["2026-08-03", 2199],
    ],
    pattern: "paypal",
    resolvedBy: "normalization",
  },
  {
    traps: ["T15"],
    details: "TR.BLIK",
    counterparty: "ALLEGRO SP. Z O.O. UL. PRZYKŁADOWA 5 POZNAŃ",
    title: blik("allegro.pl"),
    entries: [
      ["2025-09-10", 8990],
      ["2025-11-20", 21450],
      ["2025-12-08", 4999],
      ["2026-02-21", 13700],
      ["2026-05-12", 2890],
      ["2026-07-29", 33000],
    ],
    pattern: "allegro",
    resolvedBy: "normalization",
  },
  {
    traps: ["T13", "T15"],
    details: "TR.BLIK",
    counterparty: "ALLEGRO SP. Z O.O. UL. PRZYKŁADOWA 5 POZNAŃ",
    title: blikRefund,
    entries: [["2025-12-15", 4999]],
    credit: true,
  },
  {
    traps: ["T16"],
    details: "TR.BLIK",
    counterparty: "SIŁOWNIA RUCH UL. MOCNA 10 KRAKÓW",
    title: blik("silownia-ruch.pl"),
    accountNo: "66555500000000000000000012",
    entries: [["2026-08-05", 12900]],
    pattern: "silownia-ruch",
    resolvedBy: "normalization",
    expectType: "fixed",
  },
  {
    traps: ["T17"],
    details: "PRZELEW",
    counterparty: "KLIENT PRZYKŁADOWY SP. Z O.O. UL. ZLECENIOWA 1 GDAŃSK",
    accountNo: "55444400000000000000000007",
    title: monthTitle("Zapłata za FV"),
    entries: monthly(
      5,
      [984000, 1045000, 870000, 1230000, 915000, 1002000, 1180000, 894000, 1067000, 953000, 1110000, 1021000],
    ),
    credit: true,
  },
  {
    traps: ["T17"],
    details: "P.BLIK",
    counterparty: "EWA TESTOWA",
    accountNo: "55444400000000000000000008",
    title: "Przelew na telefon zwrot za bilety",
    entries: [
      ["2025-11-09", 6000],
      ["2026-05-24", 4500],
    ],
    credit: true,
  },
  {
    traps: ["T18"],
    details: "PRZELEW",
    account: VAT,
    counterparty: "URZĄD SKARBOWY W PRZYKŁADOWIE",
    accountNo: "77101000000000000000000003",
    title: (date) => `VAT-7 ${date.slice(5, 7)}/${date.slice(0, 4)}`,
    entries: [
      ["2025-10-24", 51200],
      ["2026-01-26", 64300],
      ["2026-04-24", 47800],
      ["2026-07-24", 58900],
    ],
  },
  {
    traps: ["T18"],
    details: "PRZELEW",
    splitRef: "KS260212000913",
    account: VAT,
    counterparty: "KLIENT PRZYKŁADOWY SP. Z O.O. UL. ZLECENIOWA 1 GDAŃSK",
    accountNo: "55444400000000000000000007",
    title: "Zapłata VAT FV/02/2026",
    entries: [["2026-02-12", 27600]],
    credit: true,
  },
  {
    traps: ["T19"],
    details: "TR.BLIK",
    // Literal quotes inside the name: ING writes them undoubled, so the field reads " PHU "PRZYKŁAD" JAN … ".
    counterparty: 'PHU "PRZYKŁAD" JAN TESTOWY UL. LEŚNA 3 PRZYKŁADOWO',
    title: blik("PRZYKLAD"),
    entries: [
      ["2025-11-04", 6700],
      ["2026-02-24", 7150],
      ["2026-06-02", 6900],
    ],
    pattern: "phu-przyklad",
    resolvedBy: "normalization",
  },
];

// Noise: ordinary purchases from a small merchant pool, so the main account dominates (D1 default) and the
// Szczegóły mix stays close to import-formats.md (TR.BLIK ~60%, PRZELEW ~20%).
const NOISE_POOL = [
  ["TR.BLIK", "KAWIARNIA FILIŻANKA UL. RYNEK 3 KRAKÓW", "filizanka", "kawiarnia-filizanka", 900, 3800],
  ["TR.BLIK", "PIZZERIA TRZY SERY UL. MAKOWA 9 KRAKÓW", "trzysery.pl", "pizzeria-trzy-sery", 3200, 11900],
  ["TR.BLIK", "STACJA PALIW DROGOWSKAZ UL. DROGOWA 1 KRAKÓW", "DROGOWSKAZ", "stacja-drogowskaz", 8000, 32000],
  ["TR.BLIK", "DROGERIA LAWENDA UL. KWIATOWA 14 KRAKÓW", "lawenda.pl", "drogeria-lawenda", 1500, 9800],
  ["TR.BLIK", "KINO ŚWIATŁO UL. FILMOWA 2 KRAKÓW", "kinoswiatlo.pl", "kino-swiatlo", 2200, 7600],
  ["TR.BLIK", "SKLEP ZOOLOGICZNY PAZUREK UL. PSIA 6 KRAKÓW", "PAZUREK", "zoologiczny-pazurek", 1900, 14500],
  ["P.BLIK", "ADAM TESTOWY", "", "adam-testowy", 2000, 15000],
  ["P.BLIK", "MARIA PRZYKŁADOWA", "", "maria-przykladowa", 1500, 8000],
  ["P.BLIK", "PIOTR FIKCYJNY", "", "piotr-fikcyjny", 3000, 20000],
];
const NOISE_ROWS = { "TR.BLIK": 56, "P.BLIK": 12 };

function noiseSeries(rng) {
  const byMerchant = new Map(NOISE_POOL.map((m) => [m[1], []]));
  for (const [details, count] of Object.entries(NOISE_ROWS)) {
    const pool = NOISE_POOL.filter((m) => m[0] === details);
    for (let i = 0; i < count; i++) {
      const merchant = pool[Math.floor(rng() * pool.length)];
      const date = addDays(PERIOD.start, Math.floor(rng() * 365));
      const amount = Math.round(merchant[4] + rng() * (merchant[5] - merchant[4]));
      byMerchant.get(merchant[1]).push([date, amount]);
    }
  }
  return NOISE_POOL.map(([details, counterparty, token, pattern]) => ({
    traps: [],
    details,
    counterparty,
    title: details === "P.BLIK" ? "Przelew na telefon" : blik(token),
    entries: byMerchant.get(counterparty),
    pattern,
    resolvedBy: "normalization",
  }));
}

// Reject files: small statements of the main account (same shape, fictional values), each breaking exactly one
// import rule. `reason` is the machine code in expected.json; `why` is the README text. Only `overlap` shares
// dates with the main file; the other two sit in 2024 so their only defect is the one they test.
const REJECT_FILES = [
  {
    reason: "overlap",
    why: "zakres nachodzi na główny wyciąg przy tym samym numerze rachunku; odrzucenie dopiero po zaimportowaniu głównego (FR-005, `imports_no_overlap`)",
    fileName: "Lista_transakcji_nr_0000123457_011026-overlap.csv",
    docNo: "0000123457",
    generatedOn: "2026-10-01",
    period: { start: "2026-08-01", end: "2026-09-30" },
    idBase: 600000000000000,
    series: [
      {
        details: "TR.BLIK",
        counterparty: "MUZYKALNIA SP. Z O.O. UL. NUTOWA 4 WARSZAWA",
        title: blik("muzykalnia.pl"),
        entries: [
          ["2026-08-08", 2499],
          ["2026-09-08", 2499],
        ],
        pattern: "muzykalnia",
      },
      {
        details: "TR.BLIK",
        counterparty: "PAYPRO SA UL. PRZYKŁADOWA 8 POZNAŃ",
        title: blik("kawa-testowa.pl"),
        entries: [
          ["2026-08-02", 3900],
          ["2026-09-02", 3900],
        ],
        pattern: "kawa-testowa.pl",
      },
      {
        details: "PRZELEW",
        counterparty: "ZAKŁAD UBEZPIECZEŃ SPOŁECZNYCH",
        accountNo: "77600000000000000000000002",
        title: monthTitle("Składki ZUS"),
        entries: [["2026-09-10", 152300]],
        pattern: "zus",
      },
      {
        details: "TR.BLIK",
        counterparty: "KAWIARNIA FILIŻANKA UL. RYNEK 3 KRAKÓW",
        title: blik("filizanka"),
        entries: [["2026-09-14", 1450]],
        pattern: "kawiarnia-filizanka",
      },
      {
        details: "PRZELEW",
        counterparty: "KLIENT PRZYKŁADOWY SP. Z O.O. UL. ZLECENIOWA 1 GDAŃSK",
        accountNo: "55444400000000000000000007",
        title: monthTitle("Zapłata za FV"),
        entries: [["2026-09-05", 998000]],
        credit: true,
      },
    ],
  },
  {
    reason: "no-header",
    why: 'brak wiersza nagłówka `"Data transakcji"` — preambuła przechodzi wprost w wiersze danych (reguła 1)',
    fileName: "Lista_transakcji_nr_0000098765_011024-no-header.csv",
    docNo: "0000098765",
    generatedOn: "2024-10-01",
    period: { start: "2024-09-01", end: "2024-09-30" },
    idBase: 200000000000000,
    header: false,
    series: [
      {
        details: "TR.BLIK",
        counterparty: "PIEKARNIA KŁOSEK PIEKARNIA KŁOSEK ŁÓDŹ",
        title: blik("KLOSEK"),
        entries: [
          ["2024-09-07", 1120],
          ["2024-09-21", 2240],
        ],
        pattern: "piekarnia-klosek",
      },
      {
        details: "PRZELEW",
        counterparty: "URZĄD SKARBOWY W PRZYKŁADOWIE",
        accountNo: "7710100\\00001",
        title: monthTitle("PIT-5L zaliczka"),
        entries: [["2024-09-20", 64100]],
        pattern: "urzad-skarbowy",
      },
      {
        details: "TR.BLIK",
        counterparty: "KINO ŚWIATŁO UL. FILMOWA 2 KRAKÓW",
        title: blik("kinoswiatlo.pl"),
        entries: [["2024-09-13", 3800]],
        pattern: "kino-swiatlo",
      },
    ],
  },
  {
    reason: "currency",
    why: "jeden wiersz z `Waluta` = `EUR` (reguła 5)",
    fileName: "Lista_transakcji_nr_0000099876_021124-currency.csv",
    docNo: "0000099876",
    generatedOn: "2024-11-02",
    period: { start: "2024-10-01", end: "2024-10-31" },
    idBase: 300000000000000,
    currency: (row) => (row.seq === 1 ? "EUR" : "PLN"),
    series: [
      {
        details: "TR.BLIK",
        counterparty: "DROGERIA LAWENDA UL. KWIATOWA 14 KRAKÓW",
        title: blik("lawenda.pl"),
        entries: [
          ["2024-10-04", 4270],
          ["2024-10-18", 2915],
        ],
        pattern: "drogeria-lawenda",
      },
      {
        details: "TR.BLIK",
        counterparty: "STACJA PALIW DROGOWSKAZ UL. DROGOWA 1 KRAKÓW",
        title: blik("DROGOWSKAZ"),
        entries: [["2024-10-11", 21480]],
        pattern: "stacja-drogowskaz",
      },
      {
        details: "PRZELEW",
        counterparty: "ZAKŁAD UBEZPIECZEŃ SPOŁECZNYCH",
        accountNo: "77600000000000000000000002",
        title: monthTitle("Składki ZUS"),
        entries: [["2024-10-10", 139870]],
        pattern: "zus",
      },
    ],
  },
];

// Expands series into rows (declaration order = tie-break order); counterparty account numbers are invented.
function expand(seriesList, rng) {
  const rows = [];
  seriesList.forEach((s, si) => {
    const accountNo = s.accountNo ?? (s.details === "TR.BLIK" ? null : `3344440000000000000000${pad(si, 4)}`);
    for (const [date, amount] of s.entries) {
      const title = typeof s.title === "function" ? s.title(date, rng) : s.title;
      const signed = s.credit ? amount : -amount;
      const pairKey = s.pair ? `p${rows.length}` : null;
      const base = { occurredOn: date, title, splitRef: s.splitRef ?? null, traps: s.traps ?? [], pairKey };
      rows.push({
        ...base,
        details: s.details,
        account: s.account ?? MAIN,
        counterparty: s.counterparty,
        accountNo,
        amountMinor: signed,
        pattern: s.pattern ?? null,
        resolvedBy: s.resolvedBy ?? null,
        expectType: s.expectType ?? null,
      });
      if (s.pair) {
        rows.push({
          ...base,
          details: s.pair.details ?? s.details,
          account: s.pair.account,
          counterparty: s.pair.counterparty,
          accountNo: s.pair.accountNo,
          amountMinor: -signed,
          pattern: null,
          resolvedBy: null,
          expectType: null,
        });
      }
    }
  });
  return rows.map((row, seq) => ({ ...row, seq }));
}

// Rule 7: operator in "Dane kontrahenta" -> last token of Tytuł after "Nr transakcji NNN"; else collapsed counterparty.
function rawMerchant(counterparty, title) {
  const isOperator = OPERATORS.some((op) => counterparty.toLowerCase().includes(op.toLowerCase()));
  if (isOperator) {
    const tail = /Nr transakcji \d+\s*(.*)$/.exec(title)?.[1].trim() ?? "";
    if (tail) return tail.split(/\s+/).pop();
  }
  return collapse(counterparty);
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

// The export mixes quoting per field: text fields in "…", dates, amounts, currency and the '…' numbers bare.
const quoteField = (value) => {
  if (/["\r\n]/.test(value)) throw new Error(`field cannot hold quotes or line breaks: ${value}`);
  return `"${value}"`;
};
// Dane kontrahenta only: ING puts literal `"` inside the field without doubling them (T19). Allowed on purpose here,
// but never next to a `;`, at either end or doubled — the reader closes a quoted field only at `"` + `;`/end of line.
const counterpartyField = (value) => {
  if (/[\r\n]|"(;|$)|^"|""/.test(value)) throw new Error(`counterparty cannot be read back unambiguously: ${value}`);
  return `"${value}"`;
};
const bareField = (value) => {
  if (/[";\r\n]/.test(value)) throw new Error(`bare field cannot hold quotes, separators or line breaks: ${value}`);
  return value;
};
// One CSV line from already-rendered fields, right-padded with empty fields to `width`.
const csvLine = (fields, width = fields.length) => [...fields, ...Array(width - fields.length).fill("")].join(";");

const bankName = (accountNo) => BANKS[[...accountNo].reduce((s, ch) => s + ch.charCodeAt(0), 0) % BANKS.length];
// Plain types carry two trailing spaces; split payments "<type> Ref SP: <ref> " with one.
const detailsText = (row) => (row.splitRef ? `${row.details} Ref SP: ${row.splitRef} ` : `${row.details}  `);
const preambleName = (account) => `${account.name} (PLN)`;

// Builds one ING statement file and its manifest part. `header`/`currency` exist for the reject files;
// `idBase` keeps Nr transakcji unique across files of the same account.
function buildStatement({
  fileName,
  docNo,
  period,
  accounts,
  rows,
  generatedOn = GENERATED_ON,
  idBase = 400000000000000,
  header = true,
  currency = () => "PLN",
}) {
  const ordered = [...rows].sort((a, b) =>
    a.occurredOn === b.occurredOn ? a.seq - b.seq : a.occurredOn < b.occurredOn ? 1 : -1,
  );
  // Nr transakcji: 18 digits, chronological, invented; both sides of a pair share one id.
  const ids = new Map();
  [...ordered].reverse().forEach((row, i) => {
    const key = row.pairKey ?? `r${row.seq}`;
    if (!ids.has(key)) ids.set(key, `310${idBase + i * 1013 + ((row.seq * 37) % 1000)}`);
  });
  const dataLines = ordered.map((row, i) => {
    // ~1.5% of rows are booked a day later than the transaction date.
    const shifted = i % 60 === 29 && !row.pairKey && addDays(row.occurredOn, 1) <= period.end;
    const fields = [
      bareField(row.occurredOn),
      bareField(shifted ? addDays(row.occurredOn, 1) : row.occurredOn),
      counterpartyField(` ${row.counterparty} `),
      quoteField(` ${row.title}`),
      row.accountNo ? bareField(`'${row.accountNo} '`) : "",
      row.accountNo ? quoteField(bankName(row.accountNo)) : "",
      quoteField(detailsText(row)),
      bareField(`'${ids.get(row.pairKey ?? `r${row.seq}`)}'`),
      bareField(formatAmount(row.amountMinor)),
      bareField(currency(row)),
      "",
      "",
      "",
      "",
      quoteField(row.account.name),
    ];
    return csvLine(fields, ROW_WIDTH);
  });

  const credits = rows.filter((r) => r.amountMinor > 0);
  const debits = rows.filter((r) => r.amountMinor < 0);
  const sum = (list) => list.reduce((s, r) => s + Math.abs(r.amountMinor), 0);
  const ddmmyy = `${generatedOn.slice(8, 10)}${generatedOn.slice(5, 7)}${generatedOn.slice(2, 4)}`;
  // Layout of the real export; the header line number depends on the account count (18 + accounts).
  const preamble = [
    csvLine([quoteField("Lista transakcji"), "", "", "", "", quoteField(BANK_HEADER)], ROW_WIDTH),
    csvLine([quoteField(`Dokument nr ${docNo}_${ddmmyy}`)], 2),
    csvLine([quoteField(`Wygenerowany dnia: ${generatedOn}, ${GENERATED_AT}`)], ROW_WIDTH),
    "",
    csvLine([quoteField("Dane Użytkownika:")], 2),
    csvLine([quoteField(`${OWNER.name} , ${OWNER.address}`)], 2),
    "",
    csvLine([quoteField("Wybrane rachunki:")], 2),
    ...accounts.map((a) => csvLine([quoteField(preambleName(a)), "", quoteField(a.number)], 4)),
    "",
    csvLine([quoteField("Zastosowane kryteria wyboru"), "", "", "", "", quoteField("Podsumowanie")], 8),
    "",
    csvLine(
      [
        quoteField("Zakres dat:"),
        quoteField(`${period.start} - ${period.end}`),
        quoteField("Typy transakcji:"),
        quoteField("wszystkie"),
        "",
        quoteField("Liczba transakcji:"),
        bareField(String(rows.length)),
      ],
      8,
    ),
    "",
    csvLine(
      ["", "", "", "", "", quoteField(`Suma uznań (${credits.length}):`), formatAmount(sum(credits)), "PLN"],
      ROW_WIDTH,
    ),
    "",
    csvLine(
      [
        quoteField("Ukryto saldo po transakcji"),
        "",
        "",
        "",
        "",
        quoteField(`Suma obciążeń (${debits.length}):`),
        formatAmount(sum(debits)),
        "PLN",
      ],
      ROW_WIDTH,
    ),
    "",
  ];
  const headerLines = header ? [csvLine(COLUMNS.map(quoteField), ROW_WIDTH)] : [];
  const footer = [
    "",
    "",
    csvLine([quoteField("Dokument ma charakter informacyjny, nie stanowi dowodu księgowego")], 2),
  ];
  const text = [...preamble, ...headerLines, ...dataLines, ...footer].join("\n") + "\n";
  if (text.includes("\r")) throw new Error(`${fileName}: CR in output, line endings must be LF`);
  for (const line of dataLines) {
    if (line.split(";").length !== ROW_WIDTH) throw new Error(`${fileName}: data row without ${ROW_WIDTH} fields`);
  }
  const firstDataLine = preamble.length + headerLines.length + 1;

  // D1: default account = most rows; D2: only debits. Manifest rows keep file order.
  const counts = accounts.map((a) => ({
    name: a.name,
    preambleName: preambleName(a),
    number: digits(a.number),
    rows: 0,
  }));
  for (const row of rows) counts.find((c) => c.name === row.account.name).rows++;
  const defaultAccount = counts.reduce((best, c) => (c.rows > best.rows ? c : best)).name;
  const manifestRows = ordered.map((row, i) => {
    const skipReason = row.account.name !== defaultAccount ? "other-account" : row.amountMinor >= 0 ? "credit" : null;
    const imported = skipReason === null;
    if (imported && !row.pattern) throw new Error(`${fileName}: imported row without pattern (seq ${row.seq})`);
    return {
      file: fileName,
      line: firstDataLine + i,
      bankTxId: ids.get(row.pairKey ?? `r${row.seq}`),
      account: row.account.name,
      occurredOn: row.occurredOn,
      amountMinor: row.amountMinor,
      traps: [...row.traps].sort(),
      imported,
      skipReason,
      rawMerchant: imported ? rawMerchant(row.counterparty, row.title) : null,
      pattern: imported ? row.pattern : null,
    };
  });
  const importedRows = manifestRows.filter((r) => r.imported);
  const file = {
    expect: "ok",
    reason: null,
    accounts: counts,
    defaultAccount,
    period,
    declaredCount: rows.length,
    imported: { count: importedRows.length, sumMinor: importedRows.reduce((s, r) => s - r.amountMinor, 0) },
  };
  return { bytes: encodeCp1250(text), file, manifestRows, ordered };
}

// Patterns from imported rows only: D5 type, median, first month; declared expectations must hold.
function buildPatterns(manifestRows, ordered) {
  const byKey = new Map();
  manifestRows.forEach((row, i) => {
    if (!row.imported) return;
    const source = ordered[i];
    const group = byKey.get(row.pattern) ?? { rows: [], resolvedBy: new Set(), expectTypes: new Set() };
    group.rows.push(row);
    group.resolvedBy.add(source.resolvedBy);
    if (source.expectType) group.expectTypes.add(source.expectType);
    byKey.set(row.pattern, group);
  });
  const patterns = [...byKey.entries()]
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
  // D6: the only pattern new in the last month is T16; every trap has at least one row.
  const newInLast = patterns.filter((p) => p.firstMonth === LAST_MONTH).map((p) => p.key);
  const t16 = patterns.filter((p) => p.traps.includes("T16")).map((p) => p.key);
  if (newInLast.join() !== t16.join() || t16.length !== 1) {
    throw new Error(`D6: patterns new in ${LAST_MONTH} are [${newInLast.join(", ")}], expected only the T16 one`);
  }
  const seen = new Set(manifestRows.flatMap((r) => r.traps));
  const missing = Object.keys(TRAPS).filter((t) => !seen.has(t));
  if (missing.length) throw new Error(`traps without rows: ${missing.join(", ")}`);
  return patterns;
}

function readme(expected, rejectWhy) {
  const main = expected.files[MAIN_FILE];
  const trapRows = (id) =>
    expected.rows
      .filter((r) => r.traps.includes(id))
      .map((r) => r.line)
      .join(", ");
  const lines = [
    "# Syntetyczny wyciąg ING (fixture F-02)",
    "",
    "Plik wygenerowany przez `scripts/fixture-ing.mjs` — nie edytuj ręcznie.",
    "",
    "## Pochodzenie",
    "",
    "Kształt plików pochodzi z `context/foundation/import-formats.md` i ze strukturalnego porównania z prawdziwym",
    "eksportem (tylko maski pól, cudzysłowy i liczniki — bez wartości):",
    "",
    "- cp1250 bez BOM, końce linii LF, separator `;`, 21 pól w wierszu danych i nagłówku (pola 15–20 puste);",
    "- preambuła o zmiennej długości (18 linii + 1 na rachunek): nagłówek banku, `Dokument nr …`, `Wygenerowany dnia: …`,",
    '  `Dane Użytkownika:`, `Wybrane rachunki:` (`"<nazwa> (PLN)";;"<numer>";`), `Zakres dat:` / `Liczba transakcji:`,',
    "  `Suma uznań (N):` / `Suma obciążeń (N):` (kwoty bez znaku, bez cudzysłowu); przy 2 rachunkach nagłówek kolumn",
    '  od `"Data transakcji"` jest w linii 20 — parser ma go szukać, nie liczyć linii;',
    "- mieszane cudzysłowy: daty, kwota, waluta, `Nr rachunku` (`'<cyfry> '`) i `Nr transakcji` (`'<18 cyfr>'`) bez `\"`;",
    "  `Dane kontrahenta` ze spacją na początku i na końcu, `Tytuł` ze spacją na początku, `Szczegóły` z dwiema spacjami po typie",
    "  (`PRZ SP Ref SP: <ref> ` przy split payment), `Konto` = nazwa rachunku bez ` (PLN)`;",
    '- cudzysłów wewnątrz `Dane kontrahenta` nie jest podwajany (`" PHU "NAZWA" … "`) — pole kończy `"` przed `;` lub końcem linii;',
    '- `TR.BLIK` prawie zawsze bez `Nr rachunku` i `Nazwa banku`; stopka `"Dokument ma charakter informacyjny…";` po 2 pustych liniach.',
    "",
    "Wszystkie nazwy, numery, kwoty i daty są wymyślone — żadna wartość nie pochodzi z prawdziwego wyciągu",
    "(jedyny prawdziwy napis to nagłówek banku w linii 1).",
    "",
    "## Pliki",
    "",
    "| Plik | Oczekiwany wynik |",
    "|---|---|",
    ...Object.entries(expected.files).map(([name, f]) =>
      f.expect === "reject"
        ? `| \`${name}\` | reject (\`${f.reason}\`): ${rejectWhy[name]}; wiersze danych: ${f.declaredCount}, ` +
          `zakres ${f.period.start} – ${f.period.end} |`
        : `| \`${name}\` | ok; rachunek domyślny \`${f.defaultAccount}\`, ${f.declaredCount} wierszy, ` +
          `import ${f.imported.count} obciążeń, suma ${formatAmount(f.imported.sumMinor)} zł |`,
    ),
    "| `expected.json` | klucz odpowiedzi: `files`, `rows` (każdy wiersz danych plików `ok`), `patterns` (oczekiwane wzorce) |",
    "",
    `Zakres głównego wyciągu: ${main.period.start} – ${main.period.end}; rachunki: ${main.accounts
      .map((a) => `${a.name} (${a.rows})`)
      .join(", ")}.`,
    "",
    "## Klucz odpowiedzi (`expected.json`)",
    "",
    "- `rows[]` — w kolejności pliku; `line` = numer linii w pliku (od 1), `bankTxId` = `Nr transakcji` bez `'` i spacji,",
    "  `amountMinor` w groszach ze znakiem jak w pliku, `imported`/`skipReason` (`credit` | `other-account`) wg D1/D2",
    "  przy rachunku domyślnym, `rawMerchant` wg reguły 7 (tylko importowane), `pattern` = klucz oczekiwanego wzorca.",
    "- `patterns[]` — liczone tylko z importowanych wierszy; `sumMinor`/`medianMinor` jako kwoty dodatnie,",
    "  `type` wg D5 (`tolerance`), `resolvedBy`: `import` (reguła 7 / D3), `normalization` (FR-006),",
    "  `user-merge` / `user-exclude` (decyzje FR-009), `rawMerchants` = surowi sprzedawcy scaleni we wzorzec.",
    "- `files[].accounts[]` — `name` jak w kolumnie `Konto`, `preambleName` jak w preambule (z ` (PLN)`), `number` bez spacji;",
    "  `imported.sumMinor` — suma importowanych obciążeń (dodatnia).",
    "- `files[].expect` — `ok` albo `reject` z `reason`: `overlap` (zakres nachodzi na plik z `overlapsWith` przy tym",
    "  samym numerze rachunku — odrzucenie dopiero po zaimportowaniu tamtego), `no-header` (brak wiersza",
    '  `"Data transakcji"`), `currency` (`Waluta` ≠ `PLN`). Plik `reject` nie importuje niczego (`imported.count` = 0),',
    "  a jego wiersze nie trafiają do `rows[]` ani `patterns[]`; poza swoją wadą ma ten sam kształt co główny wyciąg.",
    "",
    "## Pułapki",
    "",
    "Wiersze pułapki: `rows[]` z danym identyfikatorem w `traps`; wzorce: `patterns[]` z tym identyfikatorem.",
    "",
    "| ID | Pułapka | Oczekiwany wynik | Linie w głównym pliku |",
    "|---|---|---|---|",
    ...Object.entries(TRAPS).map(([id, [what, outcome]]) => `| ${id} | ${what} | ${outcome} | ${trapRows(id)} |`),
    "",
    "Pozostałe wiersze to szum (`TR.BLIK`, `P.BLIK`) z zasianego PRNG — też mają wpisy w `rows[]` i `patterns[]`.",
    "",
    "## Polecenia",
    "",
    "- `npm run fixture:ing` — regeneruje wszystkie pliki w tym katalogu (deterministycznie, bajt w bajt).",
    "- `npm run fixture:check` — porównuje pliki z wyjściem generatora i sprawdza kontrakt formatu oraz manifestu.",
    "- `npm run fixture:shape` — lokalnie porównuje strukturę z prawdziwym wyciągiem w `data/` (wypisuje tylko statystyki).",
    "",
    "## Zasada zmian",
    "",
    "Zmiana fixture = zmiana deklaracji w `scripts/fixture-ing.mjs` + `npm run fixture:ing`. Nie edytuj CSV ani",
    "`expected.json` ręcznie — `fixture:check` odrzuci każdą różnicę względem generatora.",
    "",
  ];
  return lines.join("\n");
}

export function generate() {
  const rng = mulberry32(SEED);
  const rows = expand([...TRAP_SERIES, ...noiseSeries(rng)], rng);
  const main = buildStatement({
    fileName: MAIN_FILE,
    docNo: "0000123456",
    period: PERIOD,
    accounts: [MAIN, VAT],
    rows,
  });
  // Own PRNG stream, so adding or changing a reject file never shifts a byte of the main file.
  const rejectRng = mulberry32(SEED + 1);
  const rejects = REJECT_FILES.map((spec) => {
    const built = buildStatement({ ...spec, accounts: [MAIN], rows: expand(spec.series, rejectRng) });
    // Rejected as a whole: nothing is imported, so its rows stay out of rows[]/patterns[].
    const file = {
      ...built.file,
      expect: "reject",
      reason: spec.reason,
      ...(spec.reason === "overlap" ? { overlapsWith: MAIN_FILE } : {}),
      imported: { count: 0, sumMinor: 0 },
    };
    return { name: spec.fileName, why: spec.why, bytes: built.bytes, file };
  });
  const expected = {
    schema: 1,
    tolerance: TOLERANCE,
    files: { [MAIN_FILE]: main.file, ...Object.fromEntries(rejects.map((r) => [r.name, r.file])) },
    rows: main.manifestRows,
    patterns: buildPatterns(main.manifestRows, main.ordered),
  };
  return {
    [MAIN_FILE]: main.bytes,
    ...Object.fromEntries(rejects.map((r) => [r.name, r.bytes])),
    "expected.json": JSON.stringify(expected, null, 2) + "\n",
    "README.md": readme(expected, Object.fromEntries(rejects.map((r) => [r.name, r.why]))),
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const files = generate();
  mkdirSync(OUT_DIR, { recursive: true });
  for (const [name, content] of Object.entries(files)) writeFileSync(path.join(OUT_DIR, name), content);
  console.log(`fixture:ing wrote ${Object.keys(files).length} files to ${path.relative(process.cwd(), OUT_DIR)}/`);
}
