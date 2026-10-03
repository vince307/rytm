import { INTL_TAG, type Locale } from "@/lib/i18n";

// Intl instances are memoised per locale (at most two per formatter); time zones are unchanged by locale.
function perLocale<T>(make: (tag: string) => T): (locale: Locale) => T {
  const cache = new Map<Locale, T>();
  return (locale) => {
    let hit = cache.get(locale);
    if (!hit) {
      hit = make(INTL_TAG[locale]);
      cache.set(locale, hit);
    }
    return hit;
  };
}

/** Separator of the numeric date: PL `DD.MM.YYYY`, EN `DD/MM/YYYY`. */
const dateSep = (locale: Locale) => (locale === "pl" ? "." : "/");

const monthYear = perLocale(
  (tag) => new Intl.DateTimeFormat(tag, { month: "long", year: "numeric", timeZone: "Europe/Warsaw" }),
);
/** Month labels follow Warsaw time, not the server's UTC clock. */
export function formatMonthYear(date: Date, locale: Locale): string {
  return monthYear(locale).format(date);
}

const shortDate = perLocale(
  (tag) =>
    new Intl.DateTimeFormat(tag, { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Warsaw" }),
);

/** `28.05.2026` / `28/05/2026` — a timestamp (e.g. imports.created_at) as a Warsaw calendar date. */
export function formatDate(timestamp: string, locale: Locale): string {
  return shortDate(locale).format(new Date(timestamp));
}

const pluralRules = perLocale((tag) => new Intl.PluralRules(tag));

/** Noun form for `n`: `[one, few, many]`, e.g. `["transakcja", "transakcje", "transakcji"]`. EN dictionaries carry
 * `[one, other, other]`: category `one` → first, `few` → second, anything else → third. */
export function plural(n: number, [one, few, many]: readonly [string, string, string], locale: Locale): string {
  const category = pluralRules(locale).select(n);
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
export function formatRangeShort(start: string, end: string, locale: Locale): string {
  const sep = dateSep(locale);
  const s = parts(start);
  const e = parts(end);
  const from = s.year === e.year ? `${s.day}${sep}${s.month}` : `${s.day}${sep}${s.month}${sep}${s.year}`;
  return `${from}–${e.day}${sep}${e.month}${sep}${e.year}`;
}

/** `20.05.2026` — an ISO calendar date (e.g. transactions.occurred_on) with no time zone, plain string split. */
export function formatIsoDate(iso: string, locale: Locale): string {
  const { year, month, day } = parts(iso);
  const sep = dateSep(locale);
  return `${day}${sep}${month}${sep}${year}`;
}

const monthShort = perLocale(
  (tag) => new Intl.DateTimeFormat(tag, { month: "short", year: "numeric", timeZone: "UTC" }),
);

/** `2026-05` → `maj 2026` — the pattern detail month select's option label (kit `patternDetail`, S-04). */
export function formatMonthShort(yearMonth: string, locale: Locale): string {
  const [year, month] = yearMonth.split("-");
  return monthShort(locale).format(Date.UTC(Number(year), Number(month) - 1, 1));
}

const monthAxis = perLocale(
  (tag) => new Intl.DateTimeFormat(tag, { month: "short", year: "2-digit", timeZone: "UTC" }),
);

/** `2026-05` → `maj 26` — the `/home` trend chart's per-bar axis label (kit `trendChart()` `data-day`, S-07). */
export function formatMonthAxis(yearMonth: string, locale: Locale): string {
  const [year, month] = yearMonth.split("-");
  return monthAxis(locale).format(Date.UTC(Number(year), Number(month) - 1, 1));
}

const dayMonth = perLocale((tag) => new Intl.DateTimeFormat(tag, { day: "numeric", month: "long", timeZone: "UTC" }));
const longDate = (iso: string, locale: Locale) => {
  const { year, month, day } = parts(iso);
  return { dayMonth: dayMonth(locale).format(Date.UTC(Number(year), Number(month) - 1, Number(day))), year };
};

/** `1 marca – 31 maja 2026`; `1 września 2025 – 31 sierpnia 2026` when the years differ. */
export function formatRangeLong(start: string, end: string, locale: Locale): string {
  const s = longDate(start, locale);
  const e = longDate(end, locale);
  const from = s.year === e.year ? s.dayMonth : `${s.dayMonth} ${s.year}`;
  return `${from} – ${e.dayMonth} ${e.year}`;
}

/** `•• 4821` — last four digits of an account number. */
export function formatAccountTail(number: string): string {
  return `•• ${number.replace(/\s+/g, "").slice(-4)}`;
}

const money = perLocale((tag) => new Intl.NumberFormat(tag, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));

/** `52,99 zł` — grosze as złoty, the kit's `money()` (prototype/app.js). pl-PL does not group 4 digits. */
export function formatMoney(minor: number, locale: Locale): string {
  return `${money(locale).format(minor / 100)} zł`;
}

/** `+6,00 zł` / `−6,00 zł` (U+2212 minus, the kit's typographic sign) — a signed amount for `/fixed` "Zmieniły
 * kwotę" (S-06 `fixedOverview`). `0` → `"0,00 zł"`, no sign. Built on `formatMoney`. */
export function formatSignedMoney(minor: number, locale: Locale): string {
  if (minor === 0) return formatMoney(0, locale);
  return `${minor > 0 ? "+" : "−"}${formatMoney(Math.abs(minor), locale)}`;
}

/** `YYYY-MM` → zero-based month index (`"2026-05"` → 4); one parse for every month table lookup. */
export function monthIndex(yearMonth: string): number {
  return Number(yearMonth.slice(5, 7)) - 1;
}

/**
 * Fills a kit month template (`"Nowe w {month}"`, `"Suma w {month}"`) with the month's locative. Polish writes „we"
 * before „wrześniu" (kit templates say „w {month}" — F-04 intake, round-4 K-row); English replaces `{month}` with
 * `locatives[monthIndex]` and never rewrites a preposition. `yearMonth` is `YYYY-MM`.
 */
export function fillMonthLocative(
  template: string,
  yearMonth: string,
  locatives: readonly string[],
  locale: Locale,
): string {
  const locative = locatives[monthIndex(yearMonth)];
  if (locale === "en") return template.replace("{month}", locative);
  const preposition = locative === "wrześniu" ? "we" : "w";
  return template.includes("w {month}")
    ? template.replace("w {month}", `${preposition} ${locative}`)
    : template.replace("{month}", locative);
}
