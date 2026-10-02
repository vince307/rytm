/**
 * Kit `patterns.columns` (round 3): Sprzedawca, Typ, Wystąpienia, Kwota, Suma, Próg, Ponad progiem.
 * The app's table body still renders Suma before Kwota (kit order is S-14, K17), so the headers are mapped to the
 * body order: kit indices 0, 1, 2, 4, 3, 5, 6.
 */
const BODY_ORDER = [0, 1, 2, 4, 3, 5, 6] as const;

export function tableHeaders(columns: readonly string[]): string[] {
  return BODY_ORDER.map((i) => columns[i]);
}
