<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Domain schema RLS (F-01)

- **Plan**: context/changes/domain-schema-rls/plan.md
- **Scope**: Full plan
- **Reviewed phases**: 1, 2, 3
- **Date**: 2026-09-24
- **Verdict**: APPROVED
- **Findings**: 0 critical, 2 warnings, 3 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | WARNING |
| Scope Discipline | PASS |
| Safety & Quality | WARNING |
| Architecture | PASS |
| Pattern Consistency | PASS |
| Success Criteria | PASS |

Re-run on 2026-09-24: `npx supabase test db` 25/25, `npm run db:types` byte-identical, `npm run lint` / `npx astro check` 0 errors, `npm run build` OK, `npm run smoke` 41/41, `supabase migration list` local = remote. RLS isolation verified: foreign `user_id` → 42501 before any constraint fires (no 23P01/23505 leak), composite FK blocks foreign imports, anon SELECT hits the revoke (42501), cascade from `delete_own_account()` unblocked. Not findings: roadmap F-01 still `in-progress` (flipped to `done` by `/10x-archive`); `eslint.config.js` ignore (documented adaptation).

## Findings

### F1 — `transactions.account_number` is not tied to its import

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Safety & Quality
- **Location**: supabase/migrations/20260923165530_domain_imports_transactions.sql:43,55
- **Detail**: The column is documented as a copy of `imports.account_number`, but nothing enforces it. A signed-in client writing directly to PostgREST can store a transaction under its own import with a different account number, which sidesteps `transactions_bank_tx_key` (the dedupe key includes `account_number`). Damage stays inside the caller's own data — integrity, not isolation.
- **Fix A ⭐ Recommended**: New migration: `unique (id, user_id, account_number)` on `imports` and replace the composite FK with `(import_id, user_id, account_number) → imports(id, user_id, account_number) on delete cascade`; pgTAP case for a mismatched account number (23503).
  - Strength: The database guarantees the invariant the schema comment already claims, before S-01 writes the first real row (tables are empty on production).
  - Tradeoff: A second migration and `db push` (human step) for a gap no current code path can hit.
  - Confidence: HIGH — same composite-FK mechanism already proven by the `(import_id, user_id)` test.
  - Blind spot: None significant.
- **Fix B**: Leave the schema; S-01 always copies the import's account number server-side and documents it.
  - Strength: No migration now.
  - Tradeoff: Invariant rests on convention; a direct PostgREST write can still break dedupe for that user.
  - Confidence: MEDIUM — holds as long as only server code writes transactions.
  - Blind spot: Clients hold a usable JWT (`@supabase/ssr` cookies are not httpOnly).
- **Decision**: FIXED via Fix A (2026-09-24) — migration `20260924122144_transactions_import_account_fk.sql`: `unique (id, user_id, account_number)` on imports, FK `transactions_import_account_fkey (import_id, user_id, account_number)` on delete cascade (old `(id, user_id)` key dropped); pgTAP "a transaction must carry the account number of its import" (23503).

### F2 — Per-account scope of the overlap and dedupe keys is untested across users

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: supabase/tests/database/domain_rls.test.sql:22,81-85
- **Detail**: Accounts A and B use different account numbers, so dropping `user_id` from `imports_no_overlap` or `transactions_bank_tx_key` would leave all 25 assertions green — and a joint bank account imported by two users would then get 23P01/23505 that reveals the other user's data.
- **Fix**: Add two `lives_ok` cases as B: an import of A's account number over A's range, and a transaction with A's `(account_number, bank_tx_id)`; bump `plan()`.
- **Decision**: FIXED (2026-09-24) — two `lives_ok` as B: import of A's account number over A's range, and a transaction with A's `(account_number, bank_tx_id)`; B's survival counts now 2/2; `plan(28)`.

### F3 — Plan contract still says `--local` for `db:types`

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: context/changes/domain-schema-rls/plan.md (Phase 2 §1); package.json `db:types`
- **Detail**: Implementation uses `--db-url postgresql://postgres:postgres@127.0.0.1:54322/postgres` because `--local` failed with a pg-meta password error on this machine; the plan was not annotated. The URL is Supabase's documented local default, not a secret. The script is POSIX-shell only (subshell + `printf`).
- **Fix**: Add a one-line addendum under Phase 2 §1 recording the `--db-url` adaptation and why; switch back to `--local` if it works after a clean `supabase start`.
- **Decision**: FIXED (2026-09-24) — addendum under plan Phase 2 §1 recording `--db-url` and why.

### F4 — `authenticated` still holds UPDATE and MAINTAIN

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: supabase/migrations/20260923165530_domain_imports_transactions.sql:96-97
- **Detail**: Rows are immutable by design and no update policy exists, so UPDATE is harmless but PostgREST PATCH answers success with 0 rows instead of a permission error. MAINTAIN (PG17) is unreachable through PostgREST.
- **Fix**: If F1 Fix A lands, add `update, maintain` to the `revoke … from authenticated` in the same migration and turn tests "A cannot update" into `throws_ok '42501'`.
- **Decision**: FIXED (2026-09-24) — same migration as F1: `revoke update, maintain … from authenticated`; tests "A cannot update …" now `throws_ok '42501'`.

### F5 — CI installs the Supabase CLI as `latest`

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: .github/workflows/ci.yml (`supabase/setup-cli`, `version: latest`)
- **Detail**: Pre-existing, but the new `supabase test db` step adds another pulled image (pg_prove) and the 2026-09-23 registry rate limit showed how network-bound the job is. `latest` also drifts from the devDependency (`supabase ^2.23.4`, local 2.117.0).
- **Fix**: Pin `version:` to the CLI version used locally; consider Docker image caching if rate limits recur (noted in `deploy-plan.md`).
- **Decision**: FIXED (2026-09-24) — `.github/workflows/ci.yml` pins `supabase/setup-cli` to `2.117.0`.
