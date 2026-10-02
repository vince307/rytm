# Handoff — `kit-round-3-imports` (slice S-13)

Final pre-merge state, written by the archive + ship step (the archived copy must not be stale). Earlier: the
visual gate step wrote this handoff. The gate ran: `VISUAL: PASS`. F7 and F8 were reproduced and fixed, and the
`.dash-title` stacking below 560 px was fixed as well (`5707d1a`). [visual] 6.6 is ticked. Only [human] 6.8 is
still open. The next agent must not miss that `PageTitle.astro` (shared) changed in this slice. `/home`,
`/patterns`, `/fixed` and `/settings` now stack the title action below 560 px, as the round-3 kit does. Those views
were checked at 400 px, but the PR description should say it.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/kit-round-3-imports`, cut from `main` at `2a8f89d` (F-04 merged) |
| Commits | `6e369ff` … `74029c7` (docs, P1–P6, epilogue, review fix + docs), `5707d1a` fix (visual gate), `e26eea8` docs (visual gate), + final handoff docs + `chore(archive): close kit-round-3-imports` |
| Pushed / PR / merged | PR/CI/merge/deploy recorded in `context/runs/2026-10-02-kit-round-3/run-log.md` |
| `change.md` status | `archived` (folder → `context/archive/2026-10-02-kit-round-3-imports/`) |
| `## Progress` rows remaining | 1 of 40 (`grep -c '^- \[ \]' plan.md` = 1): [human] 6.8 |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `src/components/imports/ImportWizard.tsx` | F7: `chooseOtherButton` rendered only when `!demoLocked`; F8: `usePageShowReset(() => setSubmitting(false))`; `StepTitle` stacks below 560 px |
| `src/components/app/PageTitle.astro` | `max-[559px]:flex-col` (kit round 3 `.dash-title{flex-direction:column}` ≤560 px) |
| `context/changes/kit-round-3-imports/reviews/visual-review.md` | gate report: method, 32 states, hand-checked numbers, fixes, observations, VISUAL line |
| `context/changes/kit-round-3-imports/screenshots/` | 64 app PNGs (32 states × 1280/400) + 38 kit frames + `README.md` (state · desktop · mobile · how reached) |
| `context/changes/kit-round-3-imports/follow-ups/review-fixes.md` | F7 and F8 marked **Resolved** with evidence; F3 still deferred |
| `context/changes/kit-round-3-imports/plan.md` | [visual] 6.6 ticked |
| `context/foundation/design-kit.md` | K33 row: added the `app.js` „Obsługujemy wyciągi …” vs `importFlow.supported` mismatch |

## 3. Verification

Baseline = contract line (`main` 2a8f89d). Everything below was observed in this step, after `5707d1a`:

| Command | Result |
| --- | --- |
| `npm run lint` | 0 errors (baseline 0) |
| `npx astro check` | 0 errors, 155 files (baseline 0 / 152, +3 slice files) |
| `npm run fixture:check` | ing OK, santander OK |
| `npm test` | 352 passed / 23 files (baseline 347 / 22; Δ0 vs impl-review) |
| `npm run build` | OK |
| `npx supabase db reset && npx supabase test db` | Files=6, Tests=119, PASS (Δ0) |
| smoke, :4398, fresh reset | 166 PASS / 0 FAIL (baseline 157, +9 = plan) |
| Visual gate | 64 app PNGs: `scrollWidth` = viewport and no `undefined` / `{…}` in all; dialog not clipped at 400 px; dialog initial focus on the dialog, not the danger button; Esc returns focus to the trigger |
| F7 before/after | Playwright `isDisabled()` of „Wybierz inny plik” on demo-locked `?error=overlap`: `false` → button absent |
| F8 before/after (headed Chrome, Claude-in-Chrome) | Back from result → bfcache step 3 with „Importowanie…” + „Wstecz” disabled → after fix both enabled; second click → `?error=overlap` (server guard, no double import) |
| End state | dev servers on 4398/4399 killed; `npx supabase db reset` after the final smoke (no gate or smoke data left); scratchpad CSVs never in the repo |

No deliberate break this step: F7 and F8 were each observed red in the product before the fix and green after,
which is stronger evidence than a synthetic break. There is no automated guard for either. F8 needs a real bfcache
restore, which headless Playwright does not perform.

## 4. Next command

none — shipped

## 5. Open

- **Manual-only rows:**
  - [ ] [human] 6.8: accept the S-13 kit-text deviations (list in `plan.md` Phase 6 manual criteria) and send G38
    and K33 to the kit author. K33 now also lists the drop-zone lead mismatch.
- **PR note:** `src/components/app/PageTitle.astro` is shared. Below 560 px the title action („+ Wgraj CSV”,
  „+ Nowy import”) now sits under the lead on every app view. Kit round 3 does the same, and the views were checked
  at 400 px (`visual-review.md` fix 3). The diff in `context/foundation/design-kit.md` is mostly Prettier table
  re-padding.
- **Follow-ups** (`follow-ups/review-fixes.md`): F3 (`result.astro` `imported` select error unlogged) remains
  deferred. Restated trigger — `Trigger: next change touching src/pages/imports/result.astro, or an observability
  audit` (grep `context/archive/2026-10-02-kit-round-3-imports/follow-ups/review-fixes.md`). F7 and F8 are resolved.
- **DESIGN-GAP:** none added. G38 and K33 stay open for round 4.
- **Observations** (`visual-review.md`): the kit's static step-3 progress bar is not built; alert tints are token
  approximations; the G38 result placeholder remains.

## 6. Autonomous decisions

1. **Playwright for the PNG set, Claude-in-Chrome for F8 and a cross-check.** Rejected: Chrome screenshots for
   everything. Why: Chrome screenshots are not written to the repo, and 64 states need deterministic replays.
   Headless Playwright never restores from bfcache, so only headed Chrome could show F8. Would change: a Chrome
   tool that saves PNGs into the repo.
2. **F7: hide „Wybierz inny plik” when locked rather than disable it.** Rejected: `disabled={demoLocked}`. Why: the
   text button has no disabled style. A control that cannot do anything adds noise, and „Wróć do importów” stays.
   Would change: the kit showing a disabled text button in a demo frame.
3. **F8: reset only `submitting`, not the whole wizard.** Why: this is the fix the review proposed, and it mirrors
   `DeleteImportDialog`. The server overlap guard rejects a repeat POST, which was observed. Would change: the
   maintainer preferring a fresh step 1 after Back.
4. **Fix `.dash-title` stacking in the shared `PageTitle`, not only in the wizard.** Rejected: a follow-up for a
   later slice. Why: it is a global kit rule (round 3, ≤560 px) that only moves views closer to their kit frames.
   It is two classes, and the four neighbouring views were checked at 400 px. Would change: the orchestrator
   enforcing "no shared-component change in an imports slice". In that case revert the `PageTitle.astro` line and
   file a follow-up with `Trigger: S-12`.
5. **Test data via `test@rytm.local` and the demo account, not fresh accounts.** Why: the plan's [visual] row names
   them. The demo import cannot be undone through the UI, so the step ended with `npx supabase db reset`. Would
   change: nothing. The reset leaves the seed state.
6. **Error query states opened by URL.** Why: they are the redirect targets of the POST endpoints and render the
   same page. Provoking `failed` or `invalid` server-side would need a broken DB or a crafted payload. Would change:
   a state whose rendering depends on more than the query string.
7. **Archive despite one open [human] row (6.8) and one SHA-less row (6.6).** Rejected: holding the archive until
   the owner accepts the kit-text deviations. Why: 6.8 is an owner decision (accept deviations, send G38/K33 to the
   kit author) that no code change depends on; it goes to the PR's „Do decyzji właściciela produktu” list as a
   post-run checklist. 6.6 is a [visual] row whose fix commit is `5707d1a`; SHA-less is a soft signal. No SHA
   repoint: the branch merges with `--merge`, so every Progress SHA stays in `main`'s history. Would change: the
   owner rejecting a deviation (then a new change, not a reopened archive).
