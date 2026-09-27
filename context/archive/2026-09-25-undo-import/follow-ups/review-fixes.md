# Review follow-ups — `undo-import`

From `reviews/impl-review.md` and `reviews/visual-review.md` (2026-09-27), restated at archive. Symbols, not line
numbers. The archive of S-03 (`context/archive/2026-09-25-merchant-patterns/`) is read-only, so its F2 is restated here
with the trigger marked as fired.

- [ ] **S-03 F2 — keyset paging in `loadPatterns` / `collectPages`** (`src/lib/patterns/load.ts`): replace offset
      `.range()` with `.gt("id", lastId).order("id").limit(PAGE_SIZE)`, `count` on the first page only, stop on an
      empty page, bound the loop. **Trigger fired**: S-02 undo-import landed — a delete racing a `/patterns` page-read
      now ends in the error state („patterns read ended short of count”), never wrong totals (impl-review F6). Take it in
      S-04 (it reads the same patterns) or as its own small change, whichever comes first.
- [ ] **Shared dialog geometry vs kit `.modal`** (`src/components/ui/dialog.tsx` `DialogContent`): 440 px /
      `p-[22px]` / `rounded-xl` vs kit 480 px / 31 px / 13 px, and 0 px vs kit 20 px side margin at 400 px
      (`.modal-backdrop` padding). Affects `/settings` `DeleteAccountDialog` and `/imports` `DeleteImportDialog`; G24 in
      `context/foundation/design-kit.md` states it. Cross-view — needs its own change (one view + global tokens).
      Trigger: next change that touches a dialog, or the maintainer accepting a cross-view fix.
- [ ] **S-01 F9 (carried) — shared close icon**: `src/components/ui/dialog.tsx` close glyph vs
      `src/components/Glyph.tsx` `Glyph`. Fold into the dialog-geometry change above.
- [ ] **F5 — `buttonVariants` `text`** (`src/components/ui/button.tsx`): unused until S-04 „Usuń próg”; the S-04 plan
      reuses it or folds it back.
- [ ] **F4 — `DeleteImportDialog` `pending` never resets on bfcache restore** (same class as `DeleteAccountDialog`); a
      `pageshow` reset belongs in a shared-dialog change. Trigger: a user report or the dialog change above.
- [ ] **F3 — CSRF relies on Astro's default `security.checkOrigin`** (`astro.config.mjs`): any future
      `checkOrigin: false` must add explicit protection to `src/pages/api/imports/delete.ts` and the other POSTs.
- **Invariant for S-04/S-05**: persisted pattern decisions/thresholds key on `merchantKey` + `user_id`, never `import_id`.
