# Review follow-ups — `durable-pattern-decisions` (S-05)

Written by the Phase 7 implement step (`/10x-implement durable-pattern-decisions phase 7`, autonomous run
`2026-09-28-s05-s06-s07`), per plan Phase 7 §3. Records what this slice closed from earlier archives, and what
carries forward with a `Trigger:` line for the next slice/change to pick up.

## Closed by this slice

- **S-04 F5 — `loadThresholds` had no paging**
  (`context/archive/2026-09-27-pattern-threshold-over-limit/follow-ups/review-fixes.md`). Closed Phase 3:
  `loadPatternData` (`src/lib/patterns/load.ts`) pages transactions, thresholds **and** decisions through the same
  `collectPages` keyset loop; no second, unpaged read remains.
- **S-04 F7 — two list-item shapes; `listOverview().referenceMonth` discarded**
  (`context/archive/2026-09-27-pattern-threshold-over-limit/reviews/impl-review.md`). Closed Phase 2/3:
  `listOverview` returns island-ready `PatternListItem`s directly; `/patterns.astro` never re-merges a second
  `Map`.
- **S-04 F8 — editor pending state could stick after bfcache back-navigation**
  (`ThresholdEditor.tsx`'s `saving`). Closed Phase 5: `usePageShowReset` (`src/components/hooks/usePageShowReset.ts`)
  resets `saving`/`pending` on a persisted `pageshow`; also reused by `PatternActionsDialog.tsx` (Phase 6).
- **undo-import F4 — `DeleteImportDialog`'s `pending` never reset on bfcache restore**
  (`context/archive/2026-09-25-undo-import/follow-ups/review-fixes.md`). Closed Phase 5: same `usePageShowReset`
  hook, wired into `DeleteImportDialog` and `DeleteAccountDialog`.
- **undo-import — shared dialog geometry vs kit `.modal`** (G24 in `context/foundation/design-kit.md`). Closed
  Phase 5: `DialogContent` (`src/components/ui/dialog.tsx`) now matches the kit's 480 px / 31 px / 13 px geometry
  and 20 px side margin at 400 px (`design-kit.md` G24 addendum, faza 5).
- **S-01 F9 (carried via undo-import) — shared close icon**: already met on `main` before this slice touched
  `dialog.tsx` — `DialogContent`'s close button already used the kit sprite `#close` (same `Glyph`/`Icon` sprite
  as everywhere else). Recorded as closed with no code change; verified by reading `dialog.tsx` at the start of
  Phase 5.

## Open — carried forward

- **S-04 F4 — save/delete with a usable key but an invalid form lands silently on `/patterns`**
  (`src/pages/api/patterns/threshold.ts`, `src/pages/api/patterns/threshold/delete.ts`). The decision endpoint
  (`src/pages/api/patterns/decision.ts`) already parses `key` first and redirects errors to the pattern's own
  detail (S-04 F4's own lesson, applied here in Phase 4) — the threshold endpoints themselves are unchanged.
  Trigger: a merchant key longer than 500 characters seen in real data, or the next change that touches
  `threshold.ts`/`threshold/delete.ts`.
- **S-04 F11 — app-wide `rounded-lg` (14px) vs the kit's 8px fields**. `ThresholdEditor` and (this slice)
  `PatternActionsDialog`'s revealed `<select>`/`<input>` both use local `rounded-[8px]` fields; `field-styles.ts`'s
  shared `field`/`control` (the `/patterns` toolbar, `MonthSelect`) and `FormField.tsx` still use the app-wide
  14px radius. Not swept this slice — `DeleteAccountDialog`'s modal confirmation input is the same 14px shape.
  Trigger: the next UI change to a view with a form field, or a design-kit round naming field radii.
- **DeleteAccountDialog bfcache**: checked, not fixed here. `DeleteAccountDialog.tsx`'s `SubmitButton` is never
  passed a `pending` prop — its POST is a plain `<form action="/api/auth/delete">`, and `SubmitButton`'s own
  comment notes `useFormStatus()` "stays false for a native POST to a URL action", so there is no manual pending
  flag to get stuck on bfcache restore the way `ThresholdEditor`/`DeleteImportDialog`/`PatternActionsDialog` had
  (all three now use `usePageShowReset`). No stuck-button bug was reproduced against `DeleteAccountDialog` this
  slice — the agent-contract's carried item may refer to the confirmation-word/current-password fields instead
  (which bfcache restores as typed, not blank, since React state survives the back-forward cache), or to a state
  not yet observed. Trigger: a user or the visual step reproducing an actual stuck state on `/settings` after Back.
- **S-07 — monthly sums must skip `pattern.excluded`**. `MerchantPattern.excluded` (this slice, Phase 1–2) is the
  shared flag; `listOverview`/`patternDetail` already zero every over-limit figure for an excluded pattern
  (decision 8). Any monthly spending total S-07 builds must read the same flag and exclude those patterns from the
  sum — the PRD's FR-017 note (decision 9, `[human]` row 7.9) is explicit that an excluded pattern is not just
  hidden from "ponad próg" but from "every monthly sum". Trigger: S-07 implementation, first phase that builds a
  monthly total.
