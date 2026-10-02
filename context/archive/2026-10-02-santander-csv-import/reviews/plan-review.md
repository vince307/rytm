<!-- PLAN-REVIEW-REPORT -->
# Plan Review: Santander CSV import (S-10)

- **Plan**: context/changes/santander-csv-import/plan.md
- **Mode**: Deep (codebase verified directly by the reviewer, no sub-agent)
- **Date**: 2026-10-02
- **Verdict**: SOUND (after triage; REVISE before)
- **Findings**: 0 critical, 3 warnings, 3 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| End-State Alignment | PASS |
| Lean Execution | PASS |
| Architectural Fitness | PASS |
| Blind Spots | WARNING (F2, F3) |
| Plan Completeness | WARNING (F1) |

## Grounding

Paths 12/12 ✓ (`scripts/fixture-santander-shape.mjs`, `src/lib/import/{schema,ing}.ts`, `src/pages/api/imports.ts`,
`src/components/imports/ImportWizard.tsx`, `src/pages/imports/{new,index,result}.astro`, `scripts/smoke.mjs`,
`supabase/tests/database/domain_rls.test.sql`, `test/unit/schema.test.ts`, `test/fixtures/santander/`,
`context/foundation/design-kit.md`). Symbols 11/11 ✓ (`import_ing_statement` security invoker + explicit revoke;
inline `check (source in ('ing'))` → auto-named `imports_source_check`; `readStatement` with `MAX_FILE_BYTES`;
`payloadValid`; `fill(x.accountLabel, …)` in the wizard; `x.accountLabel.replace` in `index.astro` / `result.astro`;
smoke block "signup after deletion is accepted again" → "signin re-created account" → "delete re-created account
(cleanup)"; `domain_rls.test.sql` `plan(28)`; `same` / `TOLERANCE_PP` / `text.match(/""/g)` in the comparator; K25
last K-row). Brief↔plan ✓. Progress↔Phase ✓ (42 rows before, 43 after triage; every Success Criteria bullet maps).

## Checks the orchestrator asked for

- **Follow-ups whose `Trigger:` names S-10**: exactly one, F-03 F9
  (`context/archive/2026-10-01-synthetic-santander-fixture/follow-ups/review-fixes.md`) — included as Phase 1. F-03 O1
  (trigger: a change touching `fixture-ing-shape.mjs`) is correctly not triggered; Phase 1 asserts that file has no
  diff.
- **Migration backward compatibility (deploy window)**: verified against the code. Production code calls
  `import_ing_statement` with five named args and posts payloads without `source`; the migration only widens
  `imports_source_check` and adds a new function under a new name, never touching the old one. Old code on the new
  schema keeps inserting `'ing'`. Rollback of code leaves valid rows (cosmetic "ING · Rachunek" label, Known risks).
- **Grants / RLS / user_id**: the new function is `security invoker` (not definer), `search_path = ''`, explicit
  `revoke … from public, anon` + `grant … to authenticated` with a deliberate break proving the revoke matters
  (Supabase default privileges grant EXECUTE to anon). `user_id` comes only from the column default `auth.uid()` and
  the `with check ((select auth.uid()) = user_id)` insert policy; the copied insert column lists never include
  `user_id`. Made explicit in the plan (F4).
- **Product decisions vs PRD**: FR-018 ("na tych samych zasadach co ING": wynik importu, lista, odrzucanie nakładań,
  tylko obciążenia) is met. None overturned. `[human]` rows: 6.8 real export, 6.9 rule-7 deviation, 6.10 K26 wording /
  "Rachunek", and new 6.11 S-11 re-keying (F3).
- **S-11 seam**: clean. The rule-5 raw merchant goes into `counterparty`, which `src/lib/patterns/merchant.ts`
  `rawMerchant` already reads; no phase touches `src/lib/patterns/`; `expected.json`'s 34-pattern partition is left to
  S-11. Santander BLIK/transfer rows whose col 3 names an operator (PayU, …) fall back to `counterparty` in
  `rawMerchant` because Santander titles carry no `Nr transakcji`, so the stored value equals rule 5.
- **Phase sizing**: six phases, each green on its own (Phase 2 leaves the endpoint on the old RPC; Phase 3 compiles
  with the unchanged wizard because `buildImportPayload` gains `source: "ing"`; Phase 5 switches the wizard to
  `accountLabel.ing`). Phase 6 is the largest but stays one agent's work. No split or merge needed.

## Findings

### F1 — Smoke Santander payload's `accountName` unspecified, but Phase 5 asserts "Santander · Rachunek"

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 3 § Smoke / Phase 5 § Success Criteria
- **Detail**: Phase 3 defines `santanderPayload` with an account, debits and counterparty but no `accountName`;
  Phase 5's new smoke step asserts `>Santander · Rachunek<` on the list, which only holds if that payload carried
  `accountName: "Rachunek"`. A different name chosen freely in Phase 3 would make Phase 5's step red or force it to
  rewrite a Phase-3 constant that smoke steps 3.x already assert on.
- **Fix**: Pin `accountName: "Rachunek"` (what the wizard sends) in the Phase 3 smoke contract.
- **Decision**: FIXED (plan.md Phase 3 § Smoke)

### F2 — PR previews share the production database; the branch preview cannot import until merge

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Blind Spots
- **Location**: Critical Implementation Details § Deploy window / Known risks
- **Detail**: `context/deployment/deploy-plan.md` records that Vercel previews use the production `SUPABASE_URL`.
  From Phase 3 the endpoint calls `import_statement`, which reaches production only in the merge's `deploy` job. Every
  import on this branch's auto-built PR preview (ING too) therefore ends in `?error=failed`. Production is unaffected
  (migration precedes code), and the plan verifies locally, but a later step looking at the preview could misread it as
  a regression and add a fallback.
- **Fix**: Known-risks entry: verification is local only; a failed preview import before merge is expected; no
  fallback to `import_ing_statement`.
  - Strength: no code, keeps option A's single write path.
  - Tradeoff: the PR preview cannot demo the slice until merge.
  - Confidence: HIGH — deploy-plan states previews share the production DB.
  - Blind spot: whether the ship step relies on a preview smoke (deploy-plan says that job does not exist yet).
- **Decision**: FIXED (plan.md § Known risks)

### F3 — S-11 re-keying of Santander patterns had no `[human]` row

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 6 § Manual Verification / Known risks
- **Detail**: `change.md` decision 4 accepts that S-11's normaliser re-keys Santander card patterns, orphaning any
  threshold or decision (stored by `merchant_key`) saved between S-10 and S-11. That is a user-visible product
  consequence decided autonomously, listed only in Known risks.
- **Fix**: Add `[human]` 6.11 (Success Criteria bullet + Progress row).
- **Decision**: FIXED (plan.md Phase 6 Manual + Progress 6.11)

### F4 — `user_id` provenance in the new RPC was implicit

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Architectural Fitness
- **Location**: Phase 2 § Migration / pgTAP
- **Detail**: "Its body is `import_ing_statement`'s body" implies the right thing, but the plan never says `user_id`
  must not be read from the payload.
- **Fix**: Contract line (column lists without `user_id`, security invoker never definer) plus a pgTAP case: an
  element carrying another user's `user_id` still lands under the caller (inside row 2.1).
- **Decision**: FIXED (plan.md Phase 2)

### F5 — `readImportFile(bytes)` could drop the pre-read size check

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 6 § Wizard / Testable file classification
- **Detail**: Today `readStatement` rejects `file.size > MAX_FILE_BYTES` before `file.arrayBuffer()`. Moving the
  check into a bytes-based `readImportFile` would read an oversized file into memory first.
- **Fix**: Keep the `file.size` check (and its G27 comment) in the wrapper; `readImportFile` repeats it only for
  testability.
- **Decision**: FIXED (plan.md Phase 6 § Wizard)

### F6 — Santander `title` stores the masked card number

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 4 § Mapping (`title` = col 2)
- **Detail**: Card rows' col 2 contains `<6 digits>******<4 digits>`. It is the user's own data under RLS, like ING
  titles, and is not rendered on the list; S-11 may want it for card-level grouping. No change needed.
- **Fix**: Recorded in Known risks.
- **Decision**: ACCEPTED (plan.md § Known risks)

## Triage summary

- Fixed: F1, F2, F3, F4, F5 (5)
- Accepted: F6 (1)
- Verdict after fixes: REVISE → SOUND

VERDICT: PROCEED — option A keeps the deploy window safe (new security-invoker RPC with explicit revoke, old function untouched), phases are independently green and sized, the S-11 seam is clean, and the three warnings were fixed in plan.md
