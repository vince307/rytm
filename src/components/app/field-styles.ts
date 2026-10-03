// field-styles.ts — shared field classes: the toolbar field (kit `.search-field` / `.select-field`, styles.css),
// the one focus ring and the one 8 px form box. Moved out of PatternsTable (S-04, faza 4) so MonthSelect reuses the
// same box; consolidated in S-14 faza 4 (S-04 F3, S-12 F1).
// Kit round 3 `.search-field:focus-within` / `.select-field:focus-within`: border ink + ring `--rytm-focus-ring`
// (ink/12) + colour ink, radius 8 px.
export const field =
  "flex min-h-[43px] items-center gap-2 rounded-[8px] border border-line bg-paper px-3 text-muted transition-colors focus-within:border-ink focus-within:text-ink focus-within:ring-[3px] focus-within:ring-ink/12 max-[559px]:w-full";
// The native search clear button is a browser colour outside the token set and absent from the kit's plain input.
export const control =
  "w-full min-w-0 border-0 bg-transparent text-[13px] text-ink outline-none [&::-webkit-search-cancel-button]:appearance-none";
// The kit has no `:focus-visible` rule; this ink/15 ring is the app's one keyboard-focus ring (buttons, links,
// dialog close, table links).
export const focusRing = "outline-none focus-visible:ring-[3px] focus-visible:ring-ink/15";
// Kit `.field input:focus` (border ink + 3px ring ink/8) on the `--rytm-field` (paper) 8 px box, via focus-within.
export const fieldBox =
  "rounded-[8px] border border-line bg-paper focus-within:border-ink focus-within:ring-[3px] focus-within:ring-ink/8";
