# Review follow-ups — `kit-round-3-auth-settings` (S-12)

Source: `plan.md` Phase 8 (2026-10-03). Later slices grep `Trigger:`.

## F1 — S-04 F11 remainder: `field-styles.ts` `field` still `rounded-lg` (14 px)

- **Where**: `src/components/app/field-styles.ts` (`field`), read by `PatternsTable` / `MonthSelect`; plus the G32-commented inputs in `ThresholdEditor` and `PatternActionsDialog`.
- **What**: S-12 moved only `FormField` and the delete-dialog input to the kit field (C3, `--rytm-field`: `rounded-[8px] bg-paper`); the pattern views keep the old radius and the `DESIGN-GAP: G32` comments.
- **Fix**: `field` → `rounded-[8px]` (already `bg-paper`); drop the G32 comments in `ThresholdEditor.tsx` / `PatternActionsDialog.tsx`.
- Trigger: S-14 (kit-round-3-patterns)

## F2 — `DialogContent` padding and radius not on the kit `.modal`

- **Where**: `src/components/ui/dialog.tsx` (`DialogContent`).
- **What**: kit `.modal` is 26 px padding (mobile 22×18 px) and 12 px radius; S-12 added only the max-height/scroll (plan decision 10) because padding visibly changes the S-13/S-14 dialogs.
- **Fix**: apply the kit padding and radius in `DialogContent`; check all three dialogs in the visual gate.
- Trigger: S-14 (kit-round-3-patterns)

## Resolved in S-12 (archives stay read-only; listed here so trigger greps see them closed)

- **`2026-09-28-durable-pattern-decisions` F8** — shared `DialogContent` without `max-h` / `overflow-y-auto`: closed by S-12 phase 5 (`DialogContent` max-height + scroll).
- **S-04 F11 (`2026-09-27-pattern-threshold-over-limit`), `FormField` / dialog-input part** — closed by S-12 phase 6 (`rounded-[8px] bg-paper`); the `field-styles.ts` remainder is F1 above.

## F3 — Landing „Trzy kroki do jasności.” head does not stack on a phone (visual gate)

- **Where**: `src/pages/index.astro` (section head of the steps block) — layout from an earlier slice, untouched by S-12 (P1 was a copy rebind).
- **What**: at 400 px the kit `landing` stacks the h2 and „Wystarczy jeden wieczór w miesiącu.” in one column; the app keeps them side by side, so the h2 wraps to two lines (`screenshots/landing-mobile.png` vs `kit-landing-mobile.png`). No overflow (`scrollWidth` 400, 360 px tier 360).
- **Fix**: stack the section head below 560 px as the kit does.
- Trigger: next slice that touches the public pages (or a round-4 landing pass)
