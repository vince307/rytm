<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Settings account (S-08)

- **Plan**: context/changes/settings-account/plan.md
- **Scope**: Full plan
- **Reviewed phases**: 1, 2, 3
- **Date**: 2026-09-22
- **Verdict**: NEEDS ATTENTION
- **Findings**: 0 critical, 7 warnings, 3 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | WARNING |
| Scope Discipline | WARNING |
| Safety & Quality | WARNING |
| Architecture | PASS |
| Pattern Consistency | WARNING |
| Success Criteria | PASS |

## Success criteria re-run (2026-09-22)

| Criterion | Result |
|---|---|
| 1.1 `delete_own_account` on local DB | exists, `prosecdef=t` |
| 1.2 `anon` via REST | 401 |
| 1.3 / 2.1 `npm run lint`, `npx astro check`, `npm run build` | PASS / 68 files 0 errors / PASS |
| 1.4 / 2.2 `npm run smoke` | 39/39, 0 FAIL |
| 2.3 `copyExtra.stub`, `DESIGN-GAP: G18` in `src/` | 0, 0 |
| 2.4 `USUŃ` in `src/` | only `src/lib/auth-rules.ts` |
| 3.1 GitHub Actions on `main` | green (`35767328210`) |
| 3.2 production `/settings` | 302 → `/login` |

Plan adherence across all 13 planned changes: no MISSING, no DRIFT, no unjustified EXTRA. The central safety property holds — the current-password check runs on `createStatelessClient()` (`src/lib/supabase.ts:27-38`), whose `getAll` returns `[]` and whose `setAll` is a no-op, so verification cannot overwrite the caller's session cookies.

## Findings

### F1 — Irreversible deletion requires no re-authentication, while the reversible password change does

- **Severity**: ⚠️ WARNING
- **Impact**: 🔬 HIGH — architectural stakes; think carefully before deciding
- **Dimension**: Safety & Quality
- **Location**: src/pages/api/auth/delete.ts:33
- **Detail**: Deleting an account needs only a live session cookie plus the typed word. The typed word is a UI speed-bump, not a security boundary: `delete_own_account` is exposed on PostgREST to any signed-in user, and `@supabase/ssr` sets auth cookies with `httpOnly: false`, so any XSS or an unlocked borrowed browser can destroy the account with a single `fetch` that never touches the input. Meanwhile `password.ts:35` demands the current password for a trivially reversible change. The guardrails are inverted relative to blast radius.
- **Fix A ⭐ Recommended**: Verify the current password before the RPC, reusing `createStatelessClient()` + `signInWithPassword` exactly as `password.ts` already does.
  - Strength: The helper, the pattern and the error redirect (`?error=current-password`) all exist in this change already; the destructive path becomes at least as guarded as the reversible one.
  - Tradeoff: Adds a second field to the dialog, so the kit modal (G14) and copy need a G24 gap row; smoke gains a step.
  - Confidence: HIGH — identical mechanism proven in `password.ts` and covered by smoke.
  - Blind spot: Whether the product wants friction here; FR-019 does not state a re-auth requirement.
- **Fix B**: Accept as-is and document the decision in `design-kit.md`/plan as a deliberate product choice.
  - Strength: Keeps the kit modal exactly as designed and ships nothing new.
  - Tradeoff: Leaves the inverted-guardrail property permanently, with no record of why.
  - Confidence: MEDIUM — defensible for a personal-finance MVP, weaker once real money data lands (F-01).
  - Blind spot: No threat model for this app has been written down.
- **Decision**: PENDING

### F2 — Hosted migration ledger does not exist; the next migration will be mis-applied

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Safety & Quality
- **Location**: context/deployment/deploy-plan.md:55
- **Detail**: The migration was applied with raw `psql`, so `supabase_migrations.schema_migrations` was never created. The docs note that the next `db push` harmlessly re-applies `20260921120000` because it is idempotent — true for this file only. The next migration (a `create table`, an `insert`, an `alter`) will also be re-applied and will either fail the push or duplicate data.
- **Fix**: Seed the ledger before the next migration is written — `npx supabase migration repair --status applied 20260921120000` once `supabase link` works (it needs a CLI access token, absent on this machine).
  - Strength: One command, closes the trap before anything depends on it.
  - Tradeoff: Requires the owner to obtain a Supabase CLI access token first.
  - Confidence: HIGH — `migration repair` exists precisely for hand-applied migrations.
  - Blind spot: Not verified against this exact CLI version.
- **Decision**: PENDING

### F3 — The "no trace" promise rests on a convention nothing enforces

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Safety & Quality
- **Location**: supabase/migrations/20260921120000_delete_own_account.sql:20
- **Detail**: The function deletes only the `auth.users` row and relies on the assumption (migration comment, lines 3-4) that future F-01 domain tables will carry `on delete cascade` FKs. A future table storing `user_id` without an FK, or with `on delete set null`, would silently retain the user's financial data while the UI promises deletion "bez śladu" (`copy.settings.deleteBody`). That is a GDPR-shaped gap, not a tidiness one.
- **Fix**: Add "every table referencing a user needs an FK to `auth.users` with `on delete cascade`" to the migration rules in `CLAUDE.md`, next to the existing RLS rule, before F-01 tables land.
  - Strength: Puts the constraint where agents and humans already read the migration rules; costs one line.
  - Tradeoff: Still a convention, not a database-level guarantee.
  - Confidence: HIGH — mirrors how the RLS rule is already enforced in this repo.
  - Blind spot: Existing hosted tables outside `supabase/migrations/` were not audited.
- **Decision**: PENDING

### F4 — The password-verification session is created and abandoned, never revoked

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/pages/api/auth/password.ts:35-41
- **Detail**: `signInWithPassword` on the stateless verifier mints a real GoTrue session and refresh token server-side. The tokens are dropped rather than revoked, so every password-change attempt leaves an orphan row in `auth.sessions`/`auth.refresh_tokens` valid for its full refresh lifetime. The window is widest when verification succeeds but `updateUser` then fails (`:43-47`), where nothing downstream can clean up.
- **Fix**: `await verifier.auth.signOut({ scope: "local" });` immediately after the check — `scope: "local"` revokes only the throwaway session, never the caller's.
- **Decision**: PENDING

### F5 — The delete dialog's accessible description is a dangling reference

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/components/settings/DeleteAccountDialog.tsx:41
- **Detail**: Passing `id={HINT_ID}` to `DialogDescription` overrides Radix's generated `context.descriptionId`, while `DialogContent` still renders `aria-describedby={context.descriptionId}`. The dialog therefore points at an id that no longer exists, so a screen reader announces no description on a destructive confirmation, and Radix logs its description warning in dev.
- **Fix**: Drop the explicit `id` and let Radix wire the description, or pass `aria-describedby` to `DialogContent` instead.
- **Decision**: PENDING

### F6 — The plan's query-param table contradicts the shipped behaviour

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: context/changes/settings-account/plan.md (Implementation Approach — query-param table)
- **Detail**: The table promises `?error=delete` → "`InlineAlert error` przy panelu destrukcyjnym", while Phase 2 item 6 specifies the dialog reopening with `ServerError`. The implementation follows item 6 (`settings.astro:75`). The plan contradicts itself, so a later reader is misled about intended behaviour.
- **Fix**: Correct the table row to match item 6 and the shipped behaviour.
- **Decision**: PENDING

### F7 — `eslint.config.js` change falls outside the plan's stated scope

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Scope Discipline
- **Location**: eslint.config.js:82-83
- **Detail**: `.claude/**` was added to the ESLint ignores. `.claude/` is tracked and its `.mjs` skill scripts would otherwise fail `strictTypeChecked` and break the `npm run lint` gate. The edit is one commented line and relaxes nothing for app code, but it belongs to the skills-install commit (`6231332`) rather than this plan, and the plan was never amended to mention it.
- **Fix**: Note the adaptation in the plan (it is already in the `8c9ded6` commit body) so the change record stays honest.
- **Decision**: PENDING

### F8 — `deploy-plan.md` still records row 3.4 as open

- **Severity**: 📋 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: context/deployment/deploy-plan.md (2026-09-22 section, "Still open")
- **Detail**: The section says the full production delete cycle on a disposable account is still open. The owner has since confirmed production works end to end and plan row 3.4 is `[x]`, so the deployment inventory now contradicts the plan.
- **Fix**: Update the line to record that the owner verified the full cycle on production on 2026-09-22.
- **Decision**: PENDING

### F9 — Two reliability nits: non-normalized `USUŃ` comparison and a silently dead form path

- **Severity**: 📋 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: src/lib/auth-rules.ts:4 · src/components/settings/DeleteAccountDialog.tsx:71 · src/components/auth/NewPasswordForm.tsx:39
- **Detail**: (a) `USUŃ` is compared with `===` and no Unicode normalization, so a decomposed `N`+U+0301 (pasted text, some IMEs) never enables the button and is refused server-side with no explanation. (b) `labels.currentRequired` is optional but `next.current` is set regardless, so a future caller passing `current` without `currentRequired` gets a form that blocks submission while displaying nothing. `settings.astro:58` passes it, so there is no live bug.
- **Fix**: `.normalize("NFC")` on both sides of the word comparison; tie `currentRequired` to `current` in the props type or supply a fallback.
- **Decision**: PENDING

### F10 — Undocumented raw colors and duplicated `FormField` markup in the dialog

- **Severity**: 📋 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: src/components/settings/DeleteAccountDialog.tsx:53-65 · src/components/ui/dialog.tsx:52
- **Detail**: `bg-white` on the confirmation input and `shadow-[0_25px_80px_rgba(32,47,64,0.25)]` on the dialog are outside the kit token list (`ink`/`paper`/`paper-soft`/`excess`/`excess-text`/`muted`/`line`/`green`). `bg-white` is inherited from `FormField.tsx:52` rather than invented, but neither carries the source comment this repo uses elsewhere (`Panel.astro:9` documents its one deviation and cites K15). Separately, the input at `:53-65` re-implements `FormField`'s markup and classes by hand instead of reusing the shared component — the "missing shared component" category from the design-system contract.
- **Fix**: Reuse `FormField` for the confirmation input, or add K15-style source comments for both deviations.
- **Decision**: PENDING

## Also noted, not itemized

- The delete flow is JS-only: the trigger, the confirmation gate and `?error=delete` all live in the island and Radix portals render nothing during SSR, so with JS off the danger panel shows a dead button. `NewPasswordForm` degrades to a plain POST by comparison.
- Other sessions are not invalidated after a password change, and no copy says so.
- The server-side `signInWithPassword` shares one Supabase rate-limit bucket per function IP with `/api/auth/signin`; the wrong-current-password branch is the only auth failure path that logs nothing.
- `SettingsRow`'s named `action` slot has no caller — unexercised surface on a new shared component.
- `npm run smoke` is now destructive as well as creative (it deletes the accounts it creates). The existing "never against production" rule covers it, but the stakes rose.
