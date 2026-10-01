<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Public demo account on production — Implementation Plan

- **Plan**: context/changes/public-demo-seed/plan.md
- **Scope**: Full plan
- **Reviewed phases**: 1, 2, 3
- **Date**: 2026-10-01
- **Verdict**: REJECTED
- **Findings**: 1 critical, 3 warnings, 4 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS |
| Scope Discipline | PASS |
| Safety & Quality | FAIL |
| Architecture | PASS |
| Pattern Consistency | PASS |
| Success Criteria | PASS |

Plan adherence: all planned changes match their contracts (drift agent: no DRIFT/MISSING/EXTRA). Agreed deviations: Auto Confirm seeding with `demo@rytm.example`; prettier realignment of `design-kit.md`; `randomUUID` import in smoke.

Success criteria re-run on 2026-10-01: `npm test` 256/256, lint, `astro check` 0 errors, build, `db reset` + pgTAP 102 PASS, smoke all steps including 8 demo, prettier, grep 4/4, merge run 36904776371 ci/smoke/deploy success, production `/login` 200. Manual rows 1.7, 1.8 and 2.3 were verified in a browser this session; 3.4–3.6 were confirmed by the owner.

## Findings

### F1 — `/reset/new` bypasses the demo password guard

- **Severity**: ❌ CRITICAL
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Safety & Quality
- **Location**: src/pages/api/auth/reset/new.ts:21-33
- **Detail**: The endpoint accepts any signed-in session. It checks only `getUser()`, not that the session came from a recovery link, then calls `updateUser({ password })`. `/reset/new` renders the form whenever `Astro.locals.user` is set (`src/pages/reset/new.astro:15`), and middleware does not block it. Reproduced locally: demo sign-in → POST `/api/auth/reset/new` → `?success=1` → the old password is rejected (`/login?error=1`). On production, anyone with the README credentials can lock every reviewer out. `demo@rytm.example` cannot receive recovery mail, so only the owner can restore the account (dashboard). Line 33's global `signOut()` also ends every other demo session. The plan's Current State Analysis listed only `password.ts` as a password-setting path, so this is a gap in the plan.
- **Fix A ⭐ Recommended**: Add the demo guard to `reset/new.ts` right after `if (!user)` (redirect `DEMO_ERROR.resetNew` → `/reset/new?error=demo`, with the existing `demoLocked` settings sentence), a smoke step "demo reset/new is refused", and a row in the deploy-plan guard table.
  - Strength: Same pattern as the four existing guards; a small diff closes the production hole with the next deploy.
  - Tradeoff: A normal user's logged-in session can still use `/reset/new` as a second password-change path that skips the current-password check.
  - Confidence: HIGH — mirrors `password.ts:31-34`; reproduced locally.
  - Blind spot: `/reset/new.astro` needs a branch to show `?error=demo` (needs to be checked).
- **Fix B**: Make `/reset/new` require a recovery-origin session (a short-lived httpOnly cookie set by `/auth/callback` when `next=/reset/new`), so a normal sign-in session cannot use it at all.
  - Strength: Closes the hole for every account, not only the demo one.
  - Tradeoff: Touches the auth callback flow (S-08 territory); needs its own smoke steps; larger change.
  - Confidence: MED — the cookie lifecycle across callback and redirect needs care.
  - Blind spot: Interaction with an expired or other-browser callback fallback.
- **Decision**: FIXED (Fix A) — guard in `reset/new.ts` → `/reset/new?error=demo` with `copyExtra.settings.demoLocked`; `DEMO_ERROR.resetNew`; smoke step "demo password reset (/reset/new) is refused" (break-check: red without the guard); deploy-plan guard table and G37 row updated. Reaches production with the next deploy.

### F2 — Sign-out on the shared account ends every reviewer's session

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/pages/api/auth/signout.ts:9
- **Detail**: `signOut()` defaults to `scope: "global"` and revokes all of the user's sessions. With one shared demo account, any reviewer clicking „Wyjdź” signs out everyone signed in to the demo. The code predates S-09, but S-09 makes it user-visible. `delete.ts` and `verifyPassword` already use `scope: "local"`.
- **Fix**: `supabase.auth.signOut({ scope: "local" })` in `signout.ts`, also correct for normal multi-device users.
- **Decision**: FIXED — `signOut({ scope: "local" })` in `signout.ts`; smoke signout steps still pass.

### F3 — Preview deploys reach the production DB with the guard off

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: context/deployment/deploy-plan.md (env inventory)
- **Detail**: `SUPABASE_URL`/`SUPABASE_KEY` are scoped to "production, preview", but `DEMO_EMAIL` only to production. On a preview URL `isDemoEmail` fails open, so the demo account could delete itself, undo its import or upload anything. Vercel Authentication on previews limits this to team members.
- **Fix**: `printf 'demo@rytm.example' | vercel env add DEMO_EMAIL preview` (human), and update the inventory row to "production, preview".
- **Decision**: PENDING — deploy-plan rows updated to "production, preview"; waiting for the owner to run `printf 'demo@rytm.example' | vercel env add DEMO_EMAIL preview`.

### F4 — Guard is app-level only; the DB and GoTrue still allow the actions

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Safety & Quality
- **Location**: src/lib/demo.ts; RLS on `public.imports`; `delete_own_account`
- **Detail**: RLS still lets the demo user delete their own imports, and the user can call `delete_own_account` and GoTrue `PUT /user` directly. Anyone with the demo access token (readable `sb-*` cookie) and the anon key can skip the Astro endpoints. The anon key is server-only here (`astro:env/server`), which narrows exposure, but Supabase treats it as public by design. The plan chose this explicitly ("No migration, no role column, no DB-level guard").
- **Fix A ⭐ Recommended**: Document this as a known limitation in deploy-plan § Demo account, with the dashboard reset as the recovery path.
  - Strength: Matches the plan's conscious decision; zero code; the reset procedure is proven.
  - Tradeoff: A determined visitor can still empty the demo until the owner resets it.
  - Confidence: HIGH — the plan scoped this out deliberately.
  - Blind spot: Not verified whether the hosted project has `double_confirm_changes` on (e-mail change path).
- **Fix B**: Add a DB guard: a `before delete` trigger on `imports` and a check in `delete_own_account` refusing a demo user id (a lookup table), via a backward-compatible migration plus a pgTAP test.
  - Strength: Closes the data-emptying paths regardless of client.
  - Tradeoff: A new migration and table; does not cover GoTrue password/e-mail changes; more moving parts for a demo.
  - Confidence: MED — feasible, but the demo identity must then live in the DB, not only in env.
  - Blind spot: Interaction with the owner's reset (deleting the user must still cascade).
- **Decision**: FIXED (Fix A) — documented in deploy-plan § Demo account → Known limitation.

### F5 — First-import window after a reset is open to any reviewer

- **Severity**: 💬 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: context/deployment/deploy-plan.md § Reset; src/pages/api/imports.ts:26-31
- **Detail**: Between re-creating the user (published password) and the owner's import, any reviewer who signs in first can upload any statement, including a real one. The count/RPC check-then-act also allows two concurrent first imports.
- **Fix**: In the Reset runbook, re-create the user with a temporary password, import the fixture, then set the published password in the dashboard.
- **Decision**: FIXED — Reset runbook: re-create with a temporary password, import, then set the published password via the dashboard SQL Editor.

### F6 — Smoke "first import" step accepts any `/imports/…` location

- **Severity**: 💬 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: scripts/smoke.mjs:783-787 (prefix match at :840)
- **Detail**: The `/imports/` prefix also matches `/imports/new?error=failed|invalid|demo`, so the `demoImportAllowed(0)` path is never proven end to end, even on a fresh CI database.
- **Fix**: Have the step reject `/imports/new?error=failed` and `?error=invalid` (accept only `/imports/result…` or `/imports/new?error=demo`).
- **Decision**: FIXED — smoke `location` accepts a list of prefixes; the first-import step accepts only `/imports/result` or `/imports/new?error=demo` (fresh DB → result, rerun → demo; both runs green).

### F7 — CLAUDE.md smoke count "46/46 PASS" is stale

- **Severity**: 💬 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: CLAUDE.md:58
- **Detail**: The count predates this change (the smoke suite now has 100+ steps); the 8 demo steps make it more wrong.
- **Fix**: Replace "must be 46/46 PASS" with "must end with `All smoke steps passed`".
- **Decision**: FIXED — CLAUDE.md now says smoke must end with `All smoke steps passed`.

### F8 — `DEMO_EMAIL` is declared `access: "secret"` but documented as not secret

- **Severity**: 💬 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: astro.config.mjs:21; context/deployment/deploy-plan.md (inventory row)
- **Detail**: Harmless (server-only either way), but the config and the doc disagree.
- **Fix**: One line in the deploy-plan row: "declared `secret` only to keep it server-side; the value is public (README)".
- **Decision**: FIXED — deploy-plan inventory row explains `access: "secret"` only keeps it server-side.
