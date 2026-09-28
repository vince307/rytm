# Handoff — `durable-pattern-decisions` (slice S-05)

The `/10x-impl-review` step wrote this handoff on 2026-09-28, in autonomous run `2026-09-28-s05-s06-s07`. It reviewed all 7 phases: 0 critical findings, 3 warnings (all fixed in `9de439b`) and 6 observations (recorded as follow-ups). The result is `MERGE: CLEAR`, and `change.md` is `impl_reviewed`.

**What the next agent must not get wrong:** the next step is the **visual gate**, not another review or implement pass. Phase 5 changed the **shared** `DialogContent`, so the `/settings` and `/imports` delete dialogs must be re-shot alongside the `/patterns` views.

## 1. State

| Item                         | Value                                                                                                                                                                                                |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Branch                       | `feat/durable-pattern-decisions` (confirmed with `git branch --show-current`), cut from `main` at `f252112`                                                                                          |
| Commits on branch            | 27 ahead of `f252112`. This step added `9de439b` `fix(durable-pattern-decisions): poprawki z przeglądu implementacji` and this docs commit `docs(durable-pattern-decisions): przegląd implementacji` |
| Pushed / PR / merged         | no / none / no                                                                                                                                                                                       |
| `change.md` status           | `impl_reviewed`                                                                                                                                                                                      |
| `## Progress` rows remaining | 5 (`grep -c '^- \[ \]' plan.md`): `[visual]` 5.8, 5.9, 7.10, 7.11 and `[human]` 7.9                                                                                                                  |
| Working tree                 | clean after this commit                                                                                                                                                                              |

## 2. Artifacts

| Path                                                                   | What it is                                                                                                                                                                      |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `context/changes/durable-pattern-decisions/reviews/impl-review.md`     | New. Full-plan review (phases 1–7) with the evidence, the findings F1–F9 and their decisions. Ends with `MERGE: CLEAR — …`                                                      |
| `src/components/hooks/usePageShowReset.ts`                             | `usePageShowReset` keeps `reset` in a `useRef` and subscribes to `pageshow` once per mount, not on every render (F2). `onPersistedPageShow` is unchanged                        |
| `src/pages/patterns.astro`                                             | Header comments corrected: "S-04 impl-review F7", and the empty state is "(below)" (F1)                                                                                         |
| `test/unit/pattern-view.test.ts`                                       | One `listOverview` test title corrected to "S-04 impl-review F7" (F1)                                                                                                           |
| `context/foundation/design-kit.md`                                     | „Do rundy 3” item 8 (G24) no longer asks for the modal side margin, which Phase 5 closed (F1)                                                                                   |
| `context/changes/durable-pattern-decisions/follow-ups/review-fixes.md` | The undo-import F4 "Closed" entry is corrected: the hook is not wired into `DeleteAccountDialog`. New section "From `/10x-impl-review`" adds F4–F9, each with a `Trigger:` line |
| `context/changes/durable-pattern-decisions/plan.md`                    | `[reviewer]` rows 1.9, 1.10, 2.9, 3.8, 4.9, 6.8 and 6.9 ticked, with evidence inline. Row 7.8 annotated with the review re-check                                                |
| `context/changes/durable-pattern-decisions/change.md`                  | `status: impl_reviewed`                                                                                                                                                         |
| `context/changes/durable-pattern-decisions/handoff.md`                 | This file                                                                                                                                                                       |

## 3. Verification

Baseline (`main` `f252112`): lint 0 · astro check 0 errors (109 files) · fixture:check OK · vitest 141 (8 files) · build OK · pgTAP 76 (4 files) · smoke 77.

| Command / check                                                          | Result (observed this step)                                                                                                                                                                                                                                                |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run lint`                                                           | 0 errors (delta 0), before and after the fixes                                                                                                                                                                                                                             |
| `npx astro check`                                                        | 0 errors, 120 files (+11)                                                                                                                                                                                                                                                  |
| `npm run fixture:check`                                                  | OK                                                                                                                                                                                                                                                                         |
| `npm test`                                                               | 190 passed, 11 files (141 + 49, +3 files), before and after the fixes                                                                                                                                                                                                      |
| `npm run build`                                                          | Complete                                                                                                                                                                                                                                                                   |
| `npx supabase db reset && npx supabase test db`                          | Files=5, Tests=102, PASS (76 + 26). Run at the start and again at the end, after the final `db reset`                                                                                                                                                                      |
| smoke (`ASTRO_DEV_BACKGROUND=1 npx astro dev --port 4398 --ignore-lock`) | 111 PASS / 0 FAIL (77 + 34), before and after the fixes. Server killed afterwards                                                                                                                                                                                          |
| Live two-account RLS probe (SQL, `BEGIN … ROLLBACK`)                     | B against A's rows: read 0, update 0, delete 0. Spoofed `user_id` insert → 42501; ownership move → 42501. anon S/I/U/D → 42501 (also via PostgREST: 401 / 42501). `delete_own_account` cascade removes only A's rows. Grants: `authenticated` has S/I/U/D, `anon` has none |
| HTTP probes on `POST /api/patterns/decision`                             | Extra `user_id` field ignored. Foreign `Origin` → 403. Key `//evil.example/x` stays under `/patterns/`. `back=https://…` → `?error=decision`                                                                                                                               |

Deliberate breaks:

1. **Rename upsert also sends `excluded: false`** (`decision.ts` `case "rename"`).
   - Red: 4 smoke steps went red, including "rename keeps the exclusion", while "pattern is renamed" stayed PASS.
   - Restored → 111/111.
   - Meta-check: this proves the partial upsert preserves the untouched column.
2. **Update policy `with check (true)`** (`BEGIN … ROLLBACK`).
   - The ownership move was still rejected, because the SELECT policy also guards the updated row. The move only succeeded once the select policy was relaxed as well.
   - Meta-check: pgTAP 21 proves the combined guard, not the explicit `with check` alone. Recorded as follow-up F9.

## 4. Next command

`visual gate for /patterns and /patterns/<key> (+ /settings, /imports dialogs re-shot for the shared DialogContent change)`

## 5. Open

Human / visual checklist, left unticked in `plan.md` `## Progress`:

- [ ] 5.8 [visual] `settings-delete-dialog` and `imports-delete-dialog` at 1440 px and ~400 px: 480 px wide on desktop, a 20 px margin on mobile, and the close button clear of the eyebrow.
- [ ] 5.9 [visual] bfcache Back after „Usuń import” / „Zapisz próg”: neither button is stuck pending. `usePageShowReset` changed in `9de439b`, so check it on screen.
- [ ] 7.10 [visual] The full shot list from plan Phase 7.
- [ ] 7.11 [visual] The fixture US-03 walk-through.
- [ ] 7.9 [human] The product owner confirms decision 9.

Follow-ups, in `follow-ups/review-fixes.md` → "From `/10x-impl-review`":

- **F4:** `STATUS_PARAMS` and `fieldBox` duplicates, justified.
- **F5:** the rename `defaultValue={name}` in `PatternActionsDialog` freezes the derived name.
- **F6:** `validateMerge` allows an excluded source (Trigger: S-07).
- **F7:** `case "unmerge"` is unscoped.
- **F8:** `DialogContent` has no scroll on short viewports. The visual gate should look at the mobile `merge-picker` / `rename-field` shots.
- **F9:** pgTAP gaps.

The earlier carried items (S-04 F4, F11, DeleteAccountDialog bfcache, S-07 excluded sums) are unchanged.

Carried risks: normalizer drift (`normalizeMerchant` in `src/lib/patterns/merchant.ts`), and the circular import between `load.ts` and `decisions.ts` / `thresholds.ts` (`collectPages`), which is harmless now. No new DESIGN-GAP ids.

## 6. Autonomous decisions

- **F6 (excluded source merge) recorded, not fixed.**
  - Why: the behaviour follows plan decision 4 ("only the root's decision applies; the absorbed key's decisions stay inert"). A fix changes that decision and the dialog UI after implementation.
  - Rejected: adding the `source.excluded` check now.
  - Would change: S-07 monthly totals making the re-entry visible, or product feedback.
- **The three warnings were fixed as cheap edits in one `fix(...)` commit** rather than deferred: two comment/doc corrections and a small hook refactor with no behaviour change, re-gated green.
  - Would change: a fix touching behaviour under the visual gate. It would then have been deferred.
- **Row 6.9 (keyboard) ticked by code inspection**, not in a browser: native focusable controls, Radix Dialog Esc / close / focus trap, one hidden `action` per form.
  - Would change: the visual gate finding a focus problem. It then reopens 6.9.
- **Row 7.8 left ticked** (the implement step's per-run carve-out). Its gap (the unjustified `STATUS_PARAMS` / `fieldBox`) was closed here and the row annotated, rather than un-ticked and re-ticked.
  - Would change: a stricter reading that `[reviewer]` rows belong only to the review. The evidence is the same either way.
- **`MERGE: CLEAR` with `[visual]` / `[human]` rows open.**
  - Why: they are owned by later steps (the visual gate and the post-run checklist), not success criteria of this review.
  - Would change: the orchestrator treating any open Progress row as an unmet criterion.
