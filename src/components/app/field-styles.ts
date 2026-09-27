// field-styles.ts — shared toolbar field classes (kit `.search-field` / `.select-field`, styles.css). Moved out
// of PatternsTable (S-04, faza 4) so MonthSelect can reuse the same box without duplicating the focus rule.
// DESIGN-GAP: G29 — the kit's .search-field / .select-field drop the control outline and define no focus style; the
// wrapper borrows the kit's own `.field input:focus` (border ink + 3px ring ink/8, as FormField) via focus-within.
export const field =
  "flex min-h-[43px] items-center gap-2 rounded-lg border border-line bg-paper px-3 text-muted transition-colors focus-within:border-ink focus-within:ring-[3px] focus-within:ring-ink/8 max-[559px]:w-full";
// The native search clear button is a browser colour outside the token set and absent from the kit's plain input.
export const control =
  "w-full min-w-0 border-0 bg-transparent text-[13px] text-ink outline-none [&::-webkit-search-cancel-button]:appearance-none";
