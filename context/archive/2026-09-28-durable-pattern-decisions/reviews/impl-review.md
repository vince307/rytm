<!-- IMPL-REVIEW-REPORT -->

# Implementation Review: Trwałe decyzje o wzorcach (S-05 `durable-pattern-decisions`)

- **Plan**: context/changes/durable-pattern-decisions/plan.md
- **Scope**: Full plan
- **Reviewed phases**: 1, 2, 3, 4, 5, 6, 7
- **Date**: 2026-09-28
- **Verdict**: APPROVED
- **Findings**: 0 critical, 3 warnings (all fixed in `9de439b`), 6 observations (recorded in `follow-ups/review-fixes.md`)

## Verdicts

| Dimension           | Verdict         |
| ------------------- | --------------- |
| Plan Adherence      | PASS            |
| Scope Discipline    | PASS            |
| Safety & Quality    | PASS            |
| Architecture        | PASS            |
| Pattern Consistency | WARNING (fixed) |
| Success Criteria    | PASS            |

## Evidence (observed in this review, branch `feat/durable-pattern-decisions`)

Baseline (agent contract, `main` `f252112`): lint 0 · astro check 0 errors (109 files) · fixture:check OK · vitest 141 (8 files) · build OK · pgTAP 76 (4 files) · smoke 77 PASS.

| Suite                                           | Result                                                   | Delta over baseline                                     |
| ----------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------- |
| `npm run lint`                                  | 0 errors                                                 | 0                                                       |
| `npx astro check`                               | 0 errors, 120 files                                      | +11 files (count recorded, not gated)                   |
| `npm run fixture:check`                         | OK                                                       | —                                                       |
| `npm test`                                      | 190 passed, 11 files                                     | +49 tests, +3 files (141 + 49 = 190) — plan: +3 files ✔ |
| `npm run build`                                 | Complete                                                 | —                                                       |
| `npx supabase db reset && npx supabase test db` | Files=5, Tests=102, PASS                                 | +26, +1 file (76 + 26 = 102) — plan ✔                   |
| smoke on `astro dev --port 4398`                | 111 PASS / 0 FAIL (two runs, before and after the fixes) | +34 (77 + 34 = 111) — plan ✔                            |

Live local DB, two accounts, all inside `BEGIN … ROLLBACK` (then `db reset` + pgTAP 102 PASS at the end):

- As user B against user A's `pattern_decisions` rows: SELECT 0 rows, UPDATE 0 rows, DELETE 0 rows. INSERT with `user_id` = A → 42501. Moving B's own row to `user_id` = A → 42501. The same `merchant_key` for B → B's own row (keys are per user).
- `anon`: SELECT / INSERT / UPDATE / DELETE → 42501, both in SQL and through PostgREST with the anon key (HTTP 401, code 42501).
- `delete_own_account()` as A leaves 0 rows of A and keeps B's row (FR-019 cascade).
- Grants: `authenticated` holds DELETE, INSERT, SELECT, UPDATE; `anon` holds none.

HTTP probes against the endpoint (seeded user):

- An extra `user_id` form field is ignored; the row is owned by the session user.
- A foreign `Origin` → 403 (Astro `checkOrigin`, the same posture as every other POST).
- Key `//evil.example/x` → `/patterns/%2F%2Fevil.example%2Fx?excluded=1`, so there is no open redirect.
- `back=https://evil.example` → the schema rejects it → `?error=decision` on the key's own detail.

Deliberate breaks re-executed:

1. **Code break.** The rename upsert in `src/pages/api/patterns/decision.ts` (`case "rename"`) was changed to send `excluded: false` as well.
   - Red: "rename keeps the exclusion", "excluded pattern shows the banner", "excluded pattern leaves the table" and "later import keeps the exclusion" FAILed. "pattern is renamed" stayed PASS.
   - Restored with `cp`; `git diff` was empty and smoke was back to 111/111.
   - Meta-check: the red proves that the partial upsert preserves the untouched column, not that rename works. The break reaches wider than Phase 4 recorded (4 steps instead of 2), because the Phase 6/7 steps depend on the exclusion too.
2. **DB break**, inside `BEGIN … ROLLBACK`: the update policy was recreated `with check (true)`.
   - B moving its own row to A was **still rejected**, because Postgres applies the SELECT policy to the updated row as well.
   - Only with the select policy also relaxed did the move succeed.
   - Meta-check: pgTAP 21 proves "ownership cannot move" under two independent guards. It does not isolate the explicit `with check`. Recorded as follow-up F9; not a defect.

## Findings

### F1 — Stale docs and comments left by the phases

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: `follow-ups/review-fixes.md` (Closed, undo-import F4); `src/pages/patterns.astro` header comments; `test/unit/pattern-view.test.ts` (`listOverview` title); `context/foundation/design-kit.md` („Do rundy 3” item 8, G24)
- **Detail**:
  - The follow-ups file claimed the hook was wired into `DeleteAccountDialog`, but it is not, and its own Open section says so.
  - `patterns.astro` and a test title cited "S-05 F7" where the item is S-04 impl-review F7.
  - The empty state was described as "(above)" but renders below.
  - Design-kit item 8 still asked the kit author for the modal side margin that Phase 5 closed.
- **Fix**: Reworded all four places.
- **Decision**: FIXED — `9de439b`

### F2 — `usePageShowReset` re-subscribes on every render

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: `src/components/hooks/usePageShowReset.ts` `usePageShowReset`
- **Detail**: The effect depended on `[reset]`, and all three consumers (`DeleteImportDialog`, `ThresholdEditor`, `PatternActionsDialog`) pass an inline arrow. The `pageshow` listener was therefore torn down and re-added on every render. This worked, but it was wasteful and against hook conventions.
- **Fix**: Keep the latest `reset` in a `useRef` and subscribe once per mount. `onPersistedPageShow` and its unit test are unchanged.
- **Decision**: FIXED — `9de439b`

### F4 — Seam sweep: two duplicates neither extracted nor justified

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: `src/lib/patterns/decision-form.ts` `STATUS_PARAMS` vs `src/lib/patterns/threshold-form.ts`; `src/components/patterns/PatternActionsDialog.tsx` `fieldBox` vs `ThresholdEditor.tsx`'s field wrapper
- **Detail**: Plan Phase 7 §4 names both duplicates and requires "extract … or record why not". Row 7.8 was ticked without either.
- **Fix**: Justification recorded in `follow-ups/review-fixes.md` F4.
  - `STATUS_PARAMS`: the two maps have disjoint status sets for two independent endpoints.
  - `fieldBox`: belongs to the carried S-04 F11 field sweep.
  - Both carry a `Trigger:` line. Row 7.8 is annotated.
- **Decision**: FIXED (justified) — `9de439b`

### F3 — Minor architecture/UX observations (consolidated)

- **Severity**: ℹ️ OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Architecture
- **Location**: `src/lib/patterns/load.ts` ↔ `decisions.ts` / `thresholds.ts`; `PatternActionsDialog` `pending`; `decision.ts` `case "merge"`; `src/content/copy.ts` `copyExtra.patterns.close`
- **Detail**:
  - `load` imports the two readers, and they import `collectPages` / `PAGE_SIZE` back from `load`. This is a circular ESM import that works because every use happens at call time.
  - One shared `pending` shows „Zapisuję…” on every action button, not just the one clicked. It does block double submits.
  - A merge POST runs the full `loadPatternData` to validate two keys (plan decision 3 accepted this).
  - Pinning is one-way (plan decision 6).
  - `close: "Zamknij"` is now the third copy of the same string in `copy.ts`.
- **Fix**: If the cycle bites, move `collectPages` / `PAGE_SIZE` / `MAX_PAGES` to `src/lib/patterns/paging.ts`. Nothing else is needed now.
- **Decision**: RECORDED

### F5 — Rename field prefilled with the derived name freezes it

- **Severity**: ℹ️ OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: `src/components/patterns/PatternActionsDialog.tsx` rename `<input defaultValue={name}>`
- **Detail**: Submitting the untouched field stores the current top variant as a permanent `display_name`.
- **Fix**: Pass the stored `displayName` (null → empty field). Follow-up F5 with a `Trigger:` line.
- **Decision**: RECORDED

### F6 — An excluded pattern can be merged as the source

- **Severity**: ℹ️ OBSERVATION
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Plan Adherence
- **Location**: `src/lib/patterns/decision-form.ts` `validateMerge`
- **Detail**: Only the target is checked for `excluded`. Under the plan's "only the root's decision applies" rule (decision 4), the source's exclusion goes inert and its rows re-enter the analysis inside the target until „Cofnij scalenie”. This follows the plan, but a user may be surprised.
- **Fix**: Reject `source.excluded` in `validateMerge`, add a unit case, and hide „Scal z…” while the pattern is excluded.
  - Strength: an exclusion can never be undone silently.
  - Tradeoff: it changes a plan decision and the dialog (visual gate).
  - Confidence: MED — the answer is a product call.
  - Blind spot: whether users merge excluded variants on purpose.
- **Decision**: RECORDED — follow-up F6, Trigger S-07

### F7 — `unmerge` not scoped to the root

- **Severity**: ℹ️ OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: `src/pages/api/patterns/decision.ts` `case "unmerge"`
- **Detail**: Any of the user's own keys can be un-merged from any detail URL, and 0 affected rows still answers `unmerged`. This is safe under RLS and idempotent. Scoping by `merged_into = key` would break chains.
- **Fix**: Follow-up F7.
- **Decision**: RECORDED

### F8 — Shared `DialogContent` has no scroll on short viewports

- **Severity**: ℹ️ OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: `src/components/ui/dialog.tsx` `DialogContent`
- **Detail**: The geometry matches the kit exactly: 480 / 31 / 13, a 20 px margin, and the close button at 18 / 19. The kit has no scroll rule either.
  - With a form revealed, a short mobile viewport may clip the dialog.
  - A long first line could run about 5 px under the close icon.
  - The `/settings` and `/imports` consumers pass no `className` override, so there is no `tailwind-merge` conflict and no regression from the old 440 / 22 values.
- **Fix**: Follow-up F8 — the visual gate checks the mobile shots.
- **Decision**: RECORDED

### F9 — pgTAP leaves some verified privileges unasserted

- **Severity**: ℹ️ OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: `supabase/tests/database/pattern_decisions.test.sql`
- **Detail**:
  - Only TRUNCATE (authenticated) and INSERT (anon) are asserted. The rest was verified live in this review.
  - Assertion 21 is doubly guarded, as shown by the DB break above.
- **Fix**: Follow-up F9.
- **Decision**: RECORDED

## Manual Progress rows

- `[reviewer]` rows ticked in this review, each with its evidence inline in `plan.md` `## Progress`: 1.9, 1.10, 2.9, 3.8, 4.9, 6.8, 6.9. Row 6.9 was checked by code inspection: native focusable controls, Radix Esc / close, one hidden `action` per form.
- Row 7.8 was already ticked by the implement step. It was re-checked here and annotated (F4).
- Still open, and not this step's: `[visual]` 5.8, 5.9, 7.10, 7.11 (the visual gate); `[human]` 7.9 (the post-run checklist).

MERGE: CLEAR — no CRITICAL; all 3 warnings fixed in 9de439b; every suite green at baseline + delta (vitest +49, pgTAP +26, smoke +34); the migration was verified live with two accounts; the remaining rows are [visual]/[human] for later steps.
