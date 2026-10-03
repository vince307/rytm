// merchant-mark.ts — the kit's merchant-mark square (prototype `.merchant-mark`, styles.css): first character of
// the pattern's name, no case change, kit background `--rytm-merchant-mark` = token `paper-soft`.
// Radius 8px as in the kit, explicit because the app theme's `rounded-lg` is 14px (`--radius`; S-06 visual gate).
// Shared so PatternsTable's table rows and ExcludedPatterns' list rows never drift apart (S-05 Phase 7 seam sweep).
export const merchantMark =
  "bg-paper-soft grid size-[30px] shrink-0 place-items-center rounded-[8px] text-[11px] font-extrabold";
