// Poland-only product: month labels follow Warsaw time, not the server's UTC clock.
export function formatMonthYear(date = new Date()): string {
  return new Intl.DateTimeFormat("pl-PL", { month: "long", year: "numeric", timeZone: "Europe/Warsaw" }).format(date);
}

const shortDate = new Intl.DateTimeFormat("pl-PL", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "Europe/Warsaw",
});

/** `28.05.2026` — a timestamp (e.g. imports.created_at) as a Warsaw calendar date. */
export function formatDate(timestamp: string): string {
  return shortDate.format(new Date(timestamp));
}

const pluralRules = new Intl.PluralRules("pl-PL");

/** Polish noun form for `n`: `[one, few, many]`, e.g. `["transakcja", "transakcje", "transakcji"]`. */
export function plural(n: number, [one, few, many]: readonly [string, string, string]): string {
  const category = pluralRules.select(n);
  if (category === "one") return one;
  if (category === "few") return few;
  return many;
}

// Ranges below take ISO calendar dates (`YYYY-MM-DD`, as in imports.period_start/end) — no time zone involved.
const parts = (iso: string) => {
  const [year, month, day] = iso.split("-");
  return { year, month, day };
};

/** `01.05–28.05.2026`; `01.09.2025–31.08.2026` when the years differ. */
export function formatRangeShort(start: string, end: string): string {
  const s = parts(start);
  const e = parts(end);
  const from = s.year === e.year ? `${s.day}.${s.month}` : `${s.day}.${s.month}.${s.year}`;
  return `${from}–${e.day}.${e.month}.${e.year}`;
}

/** `20.05.2026` — an ISO calendar date (e.g. transactions.occurred_on) with no time zone, plain string split. */
export function formatIsoDate(iso: string): string {
  const { year, month, day } = parts(iso);
  return `${day}.${month}.${year}`;
}

const monthShort = new Intl.DateTimeFormat("pl-PL", { month: "short", year: "numeric", timeZone: "UTC" });

/** `2026-05` → `maj 2026` — the pattern detail month select's option label (kit `patternDetail`, S-04). */
export function formatMonthShort(yearMonth: string): string {
  const [year, month] = yearMonth.split("-");
  return monthShort.format(Date.UTC(Number(year), Number(month) - 1, 1));
}

const dayMonth = new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "long", timeZone: "UTC" });
const longDate = (iso: string) => {
  const { year, month, day } = parts(iso);
  return { dayMonth: dayMonth.format(Date.UTC(Number(year), Number(month) - 1, Number(day))), year };
};

/** `1 marca – 31 maja 2026`; `1 września 2025 – 31 sierpnia 2026` when the years differ. */
export function formatRangeLong(start: string, end: string): string {
  const s = longDate(start);
  const e = longDate(end);
  const from = s.year === e.year ? s.dayMonth : `${s.dayMonth} ${s.year}`;
  return `${from} – ${e.dayMonth} ${e.year}`;
}

/** `•• 4821` — last four digits of an account number. */
export function formatAccountTail(number: string): string {
  return `•• ${number.replace(/\s+/g, "").slice(-4)}`;
}

const money = new Intl.NumberFormat("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** `52,99 zł` — grosze as złoty, the kit's `money()` (prototype/app.js). pl-PL does not group 4 digits. */
export function formatMoney(minor: number): string {
  return `${money.format(minor / 100)} zł`;
}

/** `+6,00 zł` / `−6,00 zł` (U+2212 minus, the kit's typographic sign) — a signed amount for `/fixed` "Zmieniły
 * kwotę" (S-06 `fixedOverview`). `0` → `"0,00 zł"`, no sign. Built on `formatMoney`. */
export function formatSignedMoney(minor: number): string {
  if (minor === 0) return formatMoney(0);
  return `${minor > 0 ? "+" : "−"}${formatMoney(Math.abs(minor))}`;
}
