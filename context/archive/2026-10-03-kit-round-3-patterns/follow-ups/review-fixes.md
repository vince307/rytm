# Follow-ups — kit-round-3-patterns (S-14)

Each item carries a `Trigger:` line; later slices grep for it.

- [ ] **S-05 F6 — an excluded pattern can be merged as the source** (`validateMerge` checks only the target; see
  `context/archive/2026-09-28-durable-pattern-decisions/follow-ups/review-fixes.md`). Not a presentation change, so S-14
  left it.
  Trigger: rule changes or product feedback on merge behaviour.
- [ ] **S-05 F7 — `unmerge` is not scoped to the root** (`src/pages/api/patterns/decision.ts`, same archive file).
  Trigger: rule changes or product feedback on merge behaviour.
- [ ] **`fixed.astro` `try`** — the `/fixed` read keeps its own error handling; adopt the kit boundary with the page.
  Trigger: S-15
- [ ] **Panel radius 20 vs 12** — kit panels use 20, the app `Panel` 12; one global radius pass, not a per-view edit.
  Trigger: global radius pass (kit round 4 or maintainer preference)
- [ ] **In-dialog decision errors / separate modal views** — the kit draws merge, merge-empty and rename as separate
  modal views and errors inside the dialog; the app reveals forms in place and shows results as page alerts (G33).
  Trigger: kit round 4 or maintainer preference
- [ ] **K35–K37 to the kit author** — plural forms in `patternDetail.sequenceSummary`, `threshold.invalid` omits the
  range/decimals rule, no key for the transactions-panel literal (register rows K35–K37).
  Trigger: kit round 4

## From `/10x-impl-review` (2026-10-03, `reviews/impl-review.md`)

- [x] **F5 — dialog title can run under the close glyph on a phone** (`src/components/ui/dialog.tsx` `dialogContentClass`
  18 px side padding vs the close button at `right-[19px]`, 17 px wide; `DialogTitle` has no right padding). Affects the
  delete-import and delete-account dialogs too. Check in visual row 8.7; if a title overlaps, add right padding to
  `DialogTitle`.
  Trigger: visual gate of kit-round-3-patterns (row 8.7)
  Resolved 2026-10-03 (visual gate): no overlap at 400 px in all three dialogs — the glyph shares its row with the
  eyebrow, the title starts 14 px below it (rects in `reviews/visual-review.md` § F5). No change.
- [ ] **F7 — `FormField.tsx` / `DeleteAccountDialog.tsx` keep their own 8 px box** (`focus:ring-ink/8` on the input) instead
  of `fieldBox` (`focus-within:` on a wrapper); `fieldBox`'s comment says „the one 8 px form box”.
  Trigger: next slice touching auth or settings forms
- [ ] **F8 — `/patterns/<key>` has no assembly `try`** (`patternDetail`, `sequenceLabel` run unguarded, unlike
  `patterns.astro` since P1); not a regression.
  Trigger: S-15 (alongside the `fixed.astro` `try`)
- [ ] **F9 — `home.astro` comment cites a „`patterns.astro` `sumLabel` precedent” that never existed** (stale since S-06).
  Trigger: S-15 (touches `home.astro`)
