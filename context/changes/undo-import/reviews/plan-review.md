<!-- PLAN-REVIEW-REPORT -->
# Plan Review: Cofnięcie błędnego importu (S-02 `undo-import`)

- **Plan**: `context/changes/undo-import/plan.md`
- **Mode**: Deep (claims verified directly against the code; see Autonomous decisions for why no sub-agent)
- **Date**: 2026-09-27
- **Verdict**: SOUND
- **Findings**: 0 critical · 2 warnings · 2 observations — all triaged into `plan.md` (FIXED / recorded)

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| End-State Alignment | PASS |
| Lean Execution | PASS |
| Architectural Fitness | PASS |
| Blind Spots | WARNING (F2, F3) |
| Plan Completeness | WARNING (F1, F4) |

## Grounding

Grounding: 9/9 paths ✓ (`src/pages/api/auth/delete.ts`, `src/pages/api/imports.ts`, `src/pages/imports/index.astro`,
`src/pages/imports/result.astro`, `scripts/smoke.mjs`, `src/components/ui/button.tsx`, `src/components/ui/dialog.tsx`,
`src/components/settings/DeleteAccountDialog.tsx`, `src/components/app/InlineAlert.astro`; new paths
`src/lib/import/delete.ts`, `src/pages/api/imports/delete.ts`, `test/unit/import-delete.test.ts`,
`supabase/tests/database/import_delete.test.sql`, `src/components/imports/DeleteImportDialog.tsx` are free),
12/12 symbols ✓, brief↔plan ✓.

Claims checked against the code, not the plan's word:

- **RLS / cascade** — `20260923165530_domain_imports_transactions.sql`: policy „imports: authenticated delete own”
  (`using ((select auth.uid()) = user_id)`), select-own policy (needed by `.delete().select("id")` / `RETURNING`),
  `revoke all … from anon` (→ pgTAP assertion 10 `42501` holds). `20260924122144_transactions_import_account_fk.sql`
  drops the old `(import_id, user_id)` FK and adds the **only** FK `transactions_import_account_fkey … on delete
  cascade` — so the Phase 1 cascade break (swap to `restrict`) cannot be masked by a second cascading FK.
- **pgTAP style** — `domain_rls.test.sql` already uses top-level `with d as (delete … returning 1) select is(count(*), …)
  from d`, so assertion 1/6/8 shapes are valid Postgres (data-modifying CTE at top level). `import_rpc.test.sql`
  has `plan(16)`, role switch via `set local role` + `request.jwt.claims`, and `set local role anon`.
- **Smoke runner** — `scripts/smoke.mjs` `steps` = 48 entries (matches baseline); the check is `status` / `location`
  prefix / `contains` only — `notContains` must indeed be added. `importResultPath` is set by „import is saved and
  shows its result”; the slot after „import with an invalid payload is rejected” is the last step where the smoke user
  owns exactly one import. „import without a session goes to login” follows „home redirects after signout”, so the
  anonymous delete step runs without a session.
- **Kit views** — `design/rytm-os/prototype/app.js` `imports()` 5th column `text-button danger` „Usuń import”;
  `modal('deleteImport')` eyebrow „Cofnij import”, h2 „Usunąć import z maja?”, body verbatim as the plan's K19 keys,
  one `.btn.btn-danger`, close `aria-label="Zamknij"`, toast „Import usunięty w prototypie.”. `styles.css`
  `.text-button{…font-weight:800;font-size:12px;padding:5px 0}`, `.text-button.danger{color:var(--amber-dark)}` —
  matches the planned `text` / `text-danger` / `inline` variants. `thresholdEditor` uses `.text-button` for „Usuń próg”
  (S-04 reuse claim holds). `content.json` `emptyViews.patterns.title` = „Wzorce pojawią się po pierwszym imporcie.”,
  `emptyViews.imports.title` = „Nie masz jeszcze żadnego importu.” — both rendered by `patterns.astro` /
  `imports/index.astro` `PageTitle` in the empty branch.
- **Symbols** — `SubmitButton` has `pending`, `pendingText`, `variant`, `size`, `showArrow`; `DialogContent`
  `closeLabel`; `formatRangeLong(start, end)` in `src/lib/format.ts`; `copyExtra.settings.deleting` „Usuwanie…” and
  `deleteError` exist; `result.astro` redirects to `/imports` for a missing row; design-kit register tops out at K18 /
  G29, so K19 / K20 / G30 are the next free ids.
- **Blast radius** — `buttonVariants` only gains variants/sizes (`SubmitButton`'s `ButtonVariant`/`ButtonSize` types
  widen automatically; no caller changes). `imports/index.astro` has no other importers. No migration touched.

Follow-ups whose trigger names S-02:

- `context/archive/2026-09-25-merchant-patterns/follow-ups/review-fixes.md` **F2** (keyset paging) — deferral in plan
  decision 11 judged convincing (failure mode is the error state, never wrong totals); recorded under `## Known risks`
  (F3 below).
- `context/archive/2026-09-24-ing-csv-import/follow-ups/review-fixes.md` **F9** (shared icon component, „przy
  S-02/S-03”) — the plan was silent; now deferred with a reason (F1 below).

## Findings

### F1 — S-01 follow-up F9 (shared icon) not addressed

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: What We're NOT Doing
- **Detail**: F9 names S-02/S-03 as its trigger. S-03 delivered the shared `src/components/Glyph.tsx`, but
  `src/components/ui/dialog.tsx` (close icon) and `src/components/auth/ServerError.tsx` (warning icon) still inline
  `<use href="/rytm/icons/ui/ui.svg#…">`. The plan neither does the swap nor says why not. Deferral is right (the new
  island adds no icon markup; `dialog.tsx`/`ServerError` serve `/settings` and auth screens — outside one view), but
  it must be written down.
- **Fix**: Add a „What We're NOT Doing” bullet deferring F9 with that reason.
- **Decision**: FIXED — bullet added to `## What We're NOT Doing`.

### F2 — Smoke „imports lists the delete action” can pass on island props alone

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 2 §5 Smoke — status lines
- **Detail**: `contains: "Usuń import"` also matches the `DeleteImportDialog` island's serialized `labels` prop
  (`labels.action`), so the step stays green even if the trigger never renders server-side. `scripts/smoke.mjs`
  already documents this trap for „patterns proposes a type” (`>stały<`).
- **Fix**: assert the SSR text node `>Usuń import<`.
- **Decision**: FIXED — Phase 2 §5 contract updated.

### F3 — F2 keyset-paging deferral fires its own trigger

- **Severity**: 💬 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: What We're NOT Doing / Autonomous decisions 11
- **Detail**: The merchant-patterns follow-up F2 trigger is literally „S-02 undo-import landing”. The deferral is
  sound (a mid-read delete yields the `/patterns` error state via `collectPages`, reload recovers, totals are never
  wrong) but the follow-up would then read as silently skipped after merge.
- **Fix**: Record under `## Known risks`, with a note that S-02's archive step restates the trigger as an observed
  short-read log.
- **Decision**: FIXED — `## Known risks` section added before `## Progress`.

### F4 — astro check file-count delta is brittle

- **Severity**: 💬 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 1 Success Criteria / Progress 1.2
- **Detail**: „delta +2 files” ignores the new `test/unit/import-delete.test.ts`; `tsconfig.json` includes `**/*`, so
  the count likely moves by 3. A count mismatch would stall implement on a non-defect.
- **Fix**: Gate on 0 errors, record the file count (expected +3).
- **Decision**: FIXED — Phase 1 criterion and Progress 1.2 reworded (same row, still 22 rows).

## Triage summary

| Decision | Findings |
| --- | --- |
| Fixed | F1, F2, F3, F4 |
| Skipped / Accepted / Dismissed | — |

Verdict after fixes: SOUND. `## Progress` still has one `### Phase N` per plan phase and 22 rows (P1 9+2, P2 8+3),
each mapping 1:1 to its phase's Success Criteria bullets; no checkboxes outside `## Progress`.

## Autonomous decisions

1. **Triage without `AskUserQuestion`** (the skill's Step 6/7 prompts). Chose: apply every fix myself (all LOW
   impact, one obvious fix each), record decisions here. Rejected: saving with `Decision: PENDING`. Why: run contract
   forbids a human; findings had no real tradeoff. What would change it: a CRITICAL or HIGH-impact finding with two
   genuine options — it would be recorded, not silently picked.
2. **No sub-agent for Step 3.** Chose: verify the 5 riskiest claims (RLS/returning select, single cascade FK, pgTAP
   CTE shape, smoke runner capabilities + ordering, kit strings/styles) directly with grep/read. Rejected: one
   general-purpose sub-agent. Why: every claim resolved in a handful of files already open; a sub-agent would have
   re-read them. What would change it: a plan touching many modules or shared utilities with unknown callers.
3. **F2 keyset paging stays deferred** (plan decision 11 upheld). Why: the failure mode is a visible error state
   with correct data, not wrong numbers; one view per slice. What would change it: an observed „patterns read ended
   short of count” log, or S-04 adding more concurrent writers to `transactions`.
4. **F9 shared icon stays deferred.** Why: no new icon markup in this slice; the remaining inline sprites live in
   components shared with `/settings` and auth. What would change it: the S-02 implementation needing any icon of its
   own in `DeleteImportDialog` — then use `Glyph` and swap `dialog.tsx` in the same commit.
5. **`change.md` set to `plan_reviewed` by direct frontmatter edit.** Why: `metadata-guard.mjs` offers only
   `mark-planned` / `mark-researched`. What would change it: a guard command for this status.

VERDICT: PROCEED — plan is feasible and grounded (RLS, single cascade FK, smoke runner, kit strings verified); 2 warnings + 2 observations fixed in plan.md, no critical findings
