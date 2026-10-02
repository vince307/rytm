<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Santander CSV import (S-10)

- **Plan**: context/changes/santander-csv-import/plan.md
- **Scope**: Full plan
- **Reviewed phases**: 1, 2, 3, 4, 5, 6
- **Date**: 2026-10-02
- **Verdict**: APPROVED
- **Findings**: 0 critical, 1 warning, 4 observations (the warning and one observation fixed in `9621622`)

Reviewed by one agent of autonomous run `2026-10-01-m2-santander` (no human in the loop). The skill's two review
subagents were not spawned: the code diff is ~800 lines, so the reviewer read every changed source file, the
migration, the pgTAP and the smoke diff directly. Triage was decided per the run contract (CRITICAL → fix, WARNING →
fix if cheap, OBSERVATION → record).

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS |
| Scope Discipline | PASS |
| Safety & Quality | PASS |
| Architecture | PASS |
| Pattern Consistency | PASS |
| Success Criteria | PASS |

## Verification (re-run by this reviewer, not inherited)

Contract baseline (`main` at `1fed366`): lint 0; astro check 0 errors (137 files); fixture:check OK (ing +
santander); vitest 256 passed (15 files); build OK; pgTAP Files=5, Tests=102 PASS; smoke 140 PASS / 0 FAIL.

| Suite | Observed on this branch (after the review fix) | Baseline + delta |
| --- | --- | --- |
| `npm run lint` | 0 errors | 0 + 0 |
| `npx astro check` | 0 errors, 144 files | 137 + 7 (`banks`, `common`, `detect`, `santander` + `banks`/`detect`/`santander-parser` tests) |
| `npm run fixture:check` | ing OK, santander OK | Δ0 |
| `npm test` | 291 passed, 18 files | 256 + 35 (5 schema, 6 banks, 13 santander-parser incl. +1 from this review, 11 detect); 15 + 3 files |
| `npm run build` | OK | — |
| `npx supabase db reset && npx supabase test db` | Files=6, Tests=119, PASS | 5 + 1 files (`import_statement.test.sql`, 15), 102 + 17 (15 + 2 in `domain_rls`) |
| smoke on `astro dev :4398` | 147 PASS / 0 FAIL (run 3×: before and after the fix) | 140 + 7 (plan: +5 Phase 3, +2 Phase 5) |

Arithmetic check: vitest +35 = 290 − 256 (implementation) + 1 (this review). pgTAP +17 = 15 (new file `plan(15)`)
+ 2 (`domain_rls` `plan(28)` → `plan(30)`).

**Deliberate breaks re-executed by the reviewer:**

1. Migration: replaced `revoke execute … from public, anon` with a comment, `db reset`, `test db` → **red**
   (`import_statement.test.sql` test 13 "anon has no EXECUTE privilege"); restored via `git checkout`, `db reset`
   → PASS 6/119. Meta-check: only the privilege assert went red; the "anon cannot execute import_statement" call
   assert stayed green because anon also lacks table privileges on `imports` (see F3).
2. `schema.ts` per-bank refine replaced by `true` → **red** ("rejects a santander payload carrying an 18-digit
   bankTxId", "rejects an ing payload with a null bankTxId"); restored → 290 green.
3. `santander.ts` `CARD` tail `(.+)$` → `([^,]+)$` → **only the new F1 test went red** (12 others green); restored →
   green. Meta-check: proves the fixture never covered a comma in a card tail, so F1 was a real gap.

**Live local DB, two accounts (inside `BEGIN … ROLLBACK`, `supabase_db_rytm`), via `import_statement` AND
`import_ing_statement`:** A imported through both RPCs (sources `ing,santander`). As B: sees 0 imports / 0
transactions of A; `update imports` → 42501 (no UPDATE grant), `update transactions` → 42501; `delete` of A's imports
and transactions → 0 rows; direct insert into `imports` with spoofed `user_id` = A → 42501; insert of a transaction
into A's import → 23503 (composite FK), same with spoofed `user_id` → 42501; B importing the same account and range
as A through both RPCs → accepted (FR-005 is per user), and a `user_id` key of A inside `p_transactions` lands
under B (imports and transactions); unknown source → 23514. anon: both RPCs → 42501, `select imports` → 42501.
`delete from auth.users` A → A's imports 0, transactions 0; B's 2 imports / 2 transactions untouched. Function
catalogue: both functions `prosecdef = false`, `anon` EXECUTE false, `authenticated` true.

**Deploy-window claim (production code on the new schema):** `git diff --exit-code main` on
`20260924224014_import_ing_statement.sql`, `import_rpc.test.sql`, `import_delete.test.sql` → empty. Through
PostgREST on the reset local DB, as the authenticated seed user, `POST /rest/v1/rpc/import_ing_statement` with
`main`'s five named arguments returned an import id (no PGRST203 ambiguity — the new function has a different
name); `main`'s list select (`id, account_name, period_start, period_end, created_at, transactions(count)`) returned
it. anon `POST /rpc/import_statement` → 42501. `main`'s ING smoke payloads carry no `source` (only `source` in
`main`'s smoke is an unrelated patterns form field), and those unchanged steps pass on the new endpoint, so the
stale-tab default (`source` → `ing`) is exercised. The local DB was reset after these probes.

**Write endpoint `src/pages/api/imports.ts` `POST`:** auth guard (`getUser`, redirect `/login`) unchanged and
before any work; the S-09 demo guard (`isDemoEmail` + `demoImportAllowed`) runs before parsing, whatever `source`
says; zod `importPayloadSchema.safeParse` before the RPC; `user_id` is never in the payload schema nor in the RPC
arguments (DB default `auth.uid()` + RLS `with check`, security invoker); CSRF posture identical to the repo's other
form POSTs (Astro's origin check, unchanged config); every redirect is a fixed path plus `encodeURIComponent(id)` or
`URLSearchParams` — no open redirect.

## Reviewer rows performed

- **1.6** `npm run fixture:shape:santander -- <symlink dir>` (sandbox disabled): exit 0; 0 matches for a ≥20-digit
  number or `historia_`; R1 shares 0% (operation and booking date) on both real files; PLN: one difference, `row
  quoting signature`, real-only key `BBQ__QQB_` (quoted description, empty col 3/4) — explained in the Phase 1
  handoff (comma inside a card tail), and now pinned by a unit test (F1). USD: no structural differences. Ticked.
- **2.7** Migration expand-only (widened check + new function, `import_ing_statement` untouched), header and
  `comment on function` name the deploy window, the grants and per-account FR-005; live two-account proof above.
  Ticked.
- **3.6** `git diff main...HEAD -- scripts/smoke.mjs` has 0 removed lines; the 7 new steps sit between "signin
  re-created account" and "delete re-created account (cleanup)". Ticked.
- **4.7** `santander.ts` `parseLine`, `CARD` and `rawMerchantOf` are textually identical to the oracle in
  `scripts/fixture-santander-check.mjs`; rules 1–6 of `import-formats.md` § Santander each map to a check in
  `readStatement` (rule 1 also in `looksLikeSantander`, rule 2 after structure, rule 3 col 7, rule 4 in
  `buildSantanderPayload`, rule 5 `rawMerchantOf`, rule 6 period). Privacy: a throwaway script collected 281
  distinct values from both real exports (account numbers, owner field, col 3, col 4, card masks, rule-5 merchants
  ≥ 6 chars) and searched every tracked file (excluding the read-only kit) plus the full `main..HEAD` patch and
  commit messages: **0 hits** in both. App reader on the real exports (throwaway test, deleted, counts only): PLN →
  `santander`, 483 rows, 466 debits, 17 credits, 466 payload rows, 0 empty counterparties, 16 with a comma, payload
  schema-valid; USD → `wrongCurrency`. Matches the orchestrator's evidence. Ticked.
- **6.7** Headless system Chrome (Playwright fallback, outside the repo) against `astro dev :4398`, seed test
  account: Santander main fixture → step 1 "rozpoznano format Santander", step 2 "Santander Bank Polska · 187",
  step 3 "Santander · Rachunek · •• 3334", 184 debits, 3 skipped → result "Dodaliśmy 184 obciążenia." with
  "Santander · Rachunek"; `/imports` lists it; `/patterns` shows a rule-5 tail with city (`KAWIARNIA PRZYKLAD
  WARSZAWA`, fixture value); re-upload → step 3 overlap block; ING main fixture → "rozpoznano format ING", "ING Bank
  Śląski", import + result; ING import deleted through the dialog (rows 2 → 1, Santander row kept); Santander
  deleted too (cleanup). Ticked. (Not screenshots — 5.6/6.6 stay for the visual gate.)

Open rows not mine: 5.6, 6.6 `[visual]`; 6.8–6.11 `[human]`.

## Findings

### F1 — Real-only quoting signature had no test

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: `test/unit/santander-parser.test.ts` (`describe("parseSantanderStatement — main fixture")`)
- **Detail**: The real PLN export has a quoted card description whose tail contains a comma (`BBQ__QQB_`, ~2% of
  rows); the fixture has none (the shape comparator reports it as the only difference). The reader handled it (the
  real-export probe parsed all rows), but no test protected it: a `CARD` tail regex that stops at `,` stayed green
  on the whole suite before this review.
- **Fix**: Add a synthetic (invented values) quoted card row with a comma in the tail and assert the full tail as
  `counterparty`. Break-verified (see deliberate break 3).
- **Decision**: FIXED — `9621622`

### F2 — Stale seam comments in `banks.ts` and `ing.ts`

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: `src/lib/import/banks.ts` (header), `src/lib/import/ing.ts` (header)
- **Detail**: `banks.ts` said "(Phase 4+) format detection — never hard-code the two literals elsewhere", but
  `detect.ts` `DetectResult` and both payload builders stamp the literals themselves. `ing.ts` called its reader a
  "deliberate independent copy of santander.ts's line reader" although the two dialects are different code.
- **Fix**: Reword both comments to the actual state (and name `imports_source_check` as the other place a new bank
  touches).
- **Decision**: FIXED — `9621622`

### F3 — pgTAP anon call assertion proves table grants, not the function revoke

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: `supabase/tests/database/import_statement.test.sql` ("anon cannot execute import_statement")
- **Detail**: With the `revoke … from public, anon` removed, this `throws_ok('42501')` stays green: anon can then
  execute the function but fails on `insert into public.imports` (no table privilege) with the same 42501. The
  revoke is still proven by the sibling `has_function_privilege('anon', …)` assert, which goes red. Plan row 2.5
  said "the anon asserts go red" — only one does. No defect; the migration's revoke is in place and live-verified.
- **Fix**: None needed; recorded so nobody reads the call assert as the revoke's proof.
- **Decision**: ACCEPTED

### F4 — `accountLabel()` uses `String.replace` with a string replacement

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: `src/lib/import/banks.ts` `accountLabel`
- **Detail**: `template.replace("{name}", name)` interprets `$&`, `$'` etc. inside `name`. Pre-existing behaviour
  (the list and result did `x.accountLabel.replace("{name}", …)` on `main`); ING names come from the user's own
  file and Santander's is the fixed "Rachunek"; output is escaped by Astro/React, so cosmetic at most.
- **Fix**: `template.replace("{name}", () => name)` when `banks.ts` is next touched (S-11).
- **Decision**: ACCEPTED (recorded, not fixed — pre-existing, cosmetic)

### F5 — PR preview cannot import until merge

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Architecture
- **Location**: `src/pages/api/imports.ts` `POST` (`rpc("import_statement")`)
- **Detail**: Previews share the production DB, where `import_statement` exists only after the merge's `deploy`
  job; every preview import (ING too) ends in `?error=failed` until then. Already in plan § Known risks and
  plan-review F2; production order (migration before code) is safe, as verified above.
- **Fix**: None — do not add a fallback to `import_ing_statement`.
- **Decision**: ACCEPTED

MERGE: CLEAR — no open CRITICAL, every automated criterion re-run green (vitest 256+35, pgTAP 102+17, smoke 140+7), the migration holds two-account RLS/cascade/anon on the live DB and keeps main's five-argument call working, and all [reviewer] rows pass; [visual]/[human] rows remain for the visual gate and the owner
