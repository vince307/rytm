<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Cofnięcie błędnego importu (S-02 `undo-import`)

- **Plan**: context/changes/undo-import/plan.md
- **Scope**: Full plan
- **Reviewed phases**: 1, 2
- **Date**: 2026-09-27
- **Verdict**: APPROVED (after one WARNING fixed on this branch in `2058011`)
- **Findings**: 0 critical, 1 warning (fixed), 5 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS (was WARNING — F1 fixed) |
| Scope Discipline | PASS |
| Safety & Quality | PASS |
| Architecture | PASS |
| Pattern Consistency | PASS |
| Success Criteria | PASS |

## Suites — re-run by this step, against the post-S-03 baseline (`main` `4425f8c`)

| Command | Observed | Arithmetic |
| --- | --- | --- |
| `npm run lint` | 0 errors | baseline 0, delta 0 |
| `npx astro check` | 0 errors, 93 files | baseline 89 + 4 new files (`delete.ts` helper, endpoint, unit test, `DeleteImportDialog.tsx`) = 93 |
| `npm run fixture:check` | OK | — |
| `npm test` | 78/78, 5 files | baseline 72/4 + 6 tests / 1 file (`import-delete.test.ts`) = 78/5 |
| `npm run build` | Complete | — |
| `npx supabase db reset && npx supabase test db` | 54/54, 3 files, PASS | baseline 44 + 10 (`import_delete.test.sql` `plan(10)`) = 54 |
| `BASE_URL=http://localhost:4398 npm run smoke` | 61/61 PASS (before F1 fix: 60/60) | baseline 48 + 12 (implement) + 1 (this review, F1) = 61 |
| `git diff --stat main -- supabase/migrations` | empty | no migration, as planned |
| raw-color grep over `DeleteImportDialog.tsx`, `button.tsx`, `imports/index.astro` | no hits | — |
| `DESIGN-GAP: K19/K20/G30` in `copy.ts` + `imports/index.astro`; rows K19, K20, G30 in `design-kit.md` | present | — |

Gate re-run after the fix commit: lint 0 · astro check 0/93 · vitest 78/78 · fixture OK · build OK · smoke 61/61.
Dev server on :4398 started with `ASTRO_DEV_BACKGROUND=1 npx astro dev --port 4398 --ignore-lock`, killed after; :4321 untouched.

## Security — delete endpoint (`src/pages/api/imports/delete.ts` `POST`)

Probed live against the local Supabase with two fresh accounts A and B (script in scratch, accounts deleted after):

| Probe | Result |
| --- | --- |
| B posts A's real import id | 302 `/imports?error=missing`; A's `/imports/result?id=` still 200 — RLS `imports: authenticated delete own` refuses, app reports not-found (no existence oracle: identical to an unknown id) |
| B reads A's result page | 302 `/imports` |
| A posts own id with `Origin: https://evil.example` | 403 (Astro `security.checkOrigin`, default-on for SSR — same posture as every other POST in `src/pages/api/`, none configures CSRF itself) |
| A posts own id with no `Origin` header | 403 |
| A posts own id same-origin | 302 `/imports?deleted=1`; result page then 302 `/imports` |
| A posts the same id again | 302 `/imports?error=missing` |
| empty body / `?next=https://evil.example` appended | 302 `/imports?error=missing` — redirect targets are the three constants in `src/lib/import/delete.ts`, no request data reaches `Location` (no open redirect) |
| anonymous POST | 302 `/login` (smoke „import delete without a session goes to login”) |

Auth guard (`createClient` null / `getUser()` no user → `/login`) and zod parse (`deleteImportSchema`, `z.uuid()`, non-form body caught) mirror `src/pages/api/auth/delete.ts` `POST`; the only delete call carries `.select("id")`.

## Deliberate breaks re-executed by this step

1. **App "missing" branch** — `src/lib/import/delete.ts` `deleteImportRedirect`: the empty/null-data check disabled. Red: unit „redirects to missing when the RLS-filtered delete returns no row” and „… when data is null” FAIL (2 failed / 4 passed); live, B's delete of A's id answered `/imports?deleted=1` while A's import still rendered 200. Restored from backup → 6/6. **Meta-check**: the import survived the broken build, so the red proves the app's honesty branch (no false "Import usunięty."), not authorization — authorization is RLS, proven separately by pgTAP assertions 6/8.
2. **F1 fix** — status block removed from the empty branch of `src/pages/imports/index.astro`. Red: exactly „imports shows the deletion above the empty list” and the new „imports shows the not-found line above the empty list” FAIL; the table-state „imports shows the not-found line” (runs while an import exists) stays PASS. Restored → 61/61. **Meta-check**: the new step exercises the empty branch specifically, not the table branch.

## Reviewer Progress rows

- **1.10** PASS — guard/parse/log shape matches `auth/delete.ts` `POST` (plus a try/catch around `formData()` the precedent lacks — a strict improvement); one delete call, with `.select("id")`; `deleted=1` only via `deleteImportRedirect` on ≥1 returned row.
- **1.11** PASS — assertion 6 (B deletes A2 by real id under role `authenticated`) and 8 (non-existent id) are the RLS/0-rows proofs; 1–5 the owner cascade + re-import proof; the implement handoff's break 2 (FK → `on delete restrict`) proved 1–2 observe the cascade, break 1 / this review's break 1 prove the app branch.
- **2.11** PASS — `deleteAction` „Usuń import”, `deleteDialogEyebrow` „Cofnij import”, `deleteDialogBody`, `close` „Zamknij” byte-identical to `design/rytm-os/prototype/app.js` `imports()` / `modal('deleteImport')`; new placeholders only `deleteDialogTitle` `{range}` (K19), `deleted` (K20), `deleting`/`deleteError`/`deleteMissing` (G30).

## Findings

### F1 — Delete result lines rendered only in the table state

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: src/pages/imports/index.astro (frontmatter `status`; the three render branches)
- **Detail**: Plan Phase 2 §3 requires the status block „in **all three** states”. The empty branch rendered only the success line and the read-error branch none; so a second delete of the last import (double submit, two tabs) landed on `/imports?error=missing` above the empty view with no message at all — the user saw a silent empty page. Live-reproduced before the fix.
- **Fix**: One `status` object in the frontmatter (success / missing / delete), rendered by the same `InlineAlert` block in every branch; smoke step „imports shows the not-found line above the empty list” added.
- **Decision**: FIXED — `2058011`

### F2 — Endpoint repeated the missing-redirect literal

- **Severity**: 💬 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: src/pages/api/imports/delete.ts `POST`
- **Detail**: The plan exports `DELETE_IMPORT_MISSING` from `src/lib/import/delete.ts`; the endpoint's two early returns used the string literal instead.
- **Fix**: Use `DELETE_IMPORT_MISSING`.
- **Decision**: FIXED — `2058011`

### F3 — CSRF protection is framework-default, not configured

- **Severity**: 💬 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: astro.config.mjs (`defineConfig`, no `security` key)
- **Detail**: Cross-origin and Origin-less POSTs get 403 from Astro's default `security.checkOrigin`; the smoke runner sends `Origin` for that reason. Consistent with every other POST endpoint; recorded because a future `checkOrigin: false` would silently expose this destructive endpoint (Supabase cookies' SameSite=Lax would then be the only barrier).
- **Fix**: None now.
- **Decision**: RECORDED

### F4 — Dialog pending state is never reset

- **Severity**: 💬 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/components/imports/DeleteImportDialog.tsx `DeleteImportDialog` (`setPending`)
- **Detail**: If the page is restored from bfcache after submit (browser Back), the button can stay „Usuwanie…”/disabled until reload. Same behaviour class as `DeleteAccountDialog`; harmless (reload recovers, the POST is idempotent-safe via `missing`).
- **Fix**: None now; a `pageshow` reset would be a shared-component change beyond this view.
- **Decision**: RECORDED

### F5 — `text` button variant ships unused

- **Severity**: 💬 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Scope Discipline
- **Location**: src/components/ui/button.tsx `buttonVariants` (`text`)
- **Detail**: Only `text-danger` is used; `text` is there for S-04 „Usuń próg” per plan decision 7, whose reversal condition (never reused by S-04) is the check.
- **Fix**: None; S-04 plan should reuse it or fold it back.
- **Decision**: RECORDED

### F6 — S-03 follow-up F2 trigger now fires

- **Severity**: 💬 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Architecture
- **Location**: src/lib/patterns/load.ts `collectPages`
- **Detail**: A delete racing a `/patterns` page-read ends in the error state („patterns read ended short of count”), never wrong totals — verified by reading `collectPages`; deferred by plan decision 11. The archive step restates the trigger in `context/archive/2026-09-25-merchant-patterns/follow-ups/review-fixes.md`.
- **Fix**: None in this slice.
- **Decision**: RECORDED

## Autonomous decisions

1. **Triage done in place, no `AskUserQuestion`**. Chose: fix F1/F2 (cheap, local), record F3–F6. Rejected: leaving F1 as a follow-up. Why: F1 is a plan-contract drift a user can hit (silent empty page) and the fix is one view. What would change it: a fix needing a shared component or another view.
2. **No subagents for Steps 2 (drift / security scan)**. Chose: read the whole 10-file code diff in-context and run the live probes myself. Rejected: two general-purpose agents. Why: the diff is small (~350 lines of code) and the security focus required live two-account probes the subagents would not run. What would change it: a diff wide enough that reading it all would crowd the context.
3. **Status in the read-error state too** (F1 fix shows the delete result above the kit generic read error). Rejected: suppressing it there. Why: the plan's literal contract („all three states”) and the delete outcome is true regardless of the later read failure. What would change it: the kit author defining precedence between result lines and the read error (G30 round 3).
4. **Smoke grew by one step (+1 → 61)** to protect F1. Why: a fix without a proof would regress silently. What would change it: nothing — additive.

MERGE: CLEAR — 0 open CRITICAL, all automated success criteria met and re-observed (lint 0, check 0/93, vitest 78/78, pgTAP 54, smoke 61), reviewer rows 1.10/1.11/2.11 pass; only [visual] 2.9/2.10 remain for the Visual step
