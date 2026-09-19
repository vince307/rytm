// Poland-only product: month labels follow Warsaw time, not the server's UTC clock.
export function formatMonthYear(date = new Date()): string {
  return new Intl.DateTimeFormat("pl-PL", { month: "long", year: "numeric", timeZone: "Europe/Warsaw" }).format(date);
}
