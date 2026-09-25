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
