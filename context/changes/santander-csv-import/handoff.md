# Handoff — `santander-csv-import` (slice S-10)

The `/10x-research santander-csv-import` step of autonomous run `2026-10-01-m2-santander` wrote this handoff.
`research.md` answers Q1–Q7 and risks R1–R3, and `change.md` is now `preparing`.

The next agent must not get this wrong: write Santander through a **new** RPC `import_statement(p_source, …)` plus a
widened `imports_source_check`. Leave `import_ing_statement` byte-for-byte untouched, and revoke EXECUTE from
`public, anon` explicitly. A `BEGIN … ROLLBACK` probe showed that a new function gets both grants by default.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/santander-csv-import`, cut from `main` at `1fed366` |
| Commits | 2 on top of `1fed366`: change identity, and `docs(santander-csv-import): research` (this step) |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `preparing` (set by `metadata-guard.mjs mark-researched`) |
| `## Progress` rows remaining | n/a: no `plan.md` yet |
| Working tree | clean after the commit, except for files this step did not touch |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `context/changes/santander-csv-import/research.md` | Source-backed research. Q1 parser and detection (R3), Q2 schema/RPC (option A vs B, local-DB proof), Q3 payload, Lp and `accountName` (R2), Q4 R1 on the real exports (aggregates only), Q5 patterns contract, Q6 kit copy gaps (K26), Q7 F-03 F9 fix. Ends with five open questions for the plan |
| `context/changes/santander-csv-import/change.md` | Frontmatter only: `status: new → preparing`, `updated` |
| `context/changes/santander-csv-import/handoff.md` | This file |

## 3. Verification

| Command | Result (observed in this step) |
| --- | --- |
| `git branch --show-current` | `feat/santander-csv-import` |
| Aggregate node script over the real exports (contract symlink dir, sandbox off) | Both files: valid UTF-8, no BOM, no CR, 9 fields on 100% of rows, header col 7 == row count. PLN: 483 rows (466 debits). Operation date or booking date before the header start: **0** in both files. Either date after the export date: 0 in both. Earliest operation date − start = 0 days in both. Earliest booking date − start = +2 / +7 days. Longest col 2 ≤ 95 characters, col 3 ≤ 88. No row has both col 2 and col 3 empty |
| `npm run fixture:shape:santander -- <symlink dir>` (before the F9 fix) | "No structural differences" for PLN and for USD |
| Local DB, `pg_constraint` / `pg_proc` read inside `BEGIN … ROLLBACK` | `imports_source_check` = `CHECK (source = 'ing')`. `import_ing_statement` ACL: authenticated, service_role, postgres |
| Local DB probe inside `BEGIN … ROLLBACK` | Widening the check to `('ing','santander')` works. A new `public` function gets EXECUTE for PUBLIC **and anon**. After `ROLLBACK`, a re-query showed the probe function gone (count 0) and the check back to `'ing'` only |
| `node` over `test/fixtures/santander/expected.json` | `patterns` resolvedBy: normalization 25, import 8, user-merge 1. 37 distinct lower-cased raw merchants among imported rows. 0 imported rows with an `OPERATORS` name in `rawMerchant` |

No product code was changed, so lint, astro check, vitest, build, pgTAP and smoke were not run. The baseline in the
contract (lint 0, astro check 0 (137 files), fixture:check OK, vitest 256, build OK, pgTAP 102, smoke 140/0) is
inherited and unverified in this step.

## 4. Next command

`/10x-plan santander-csv-import`

## 5. Open

- **R1, resolved.** On both real exports, 0 operation dates fall before the header start. Keep the whole-file reject,
  with a unit case `→ unknown-format`. Add an R1 share metric to `scripts/fixture-santander-shape.mjs` `shape` in the
  F9 phase.
- **R2 (plan decides wording; part of K26).**
  - Santander `accountName` is a neutral `copyExtra` label plus the account tail. Never header col 3.
  - `copyExtra.imports.accountLabel` becomes per-source.
  - `src/pages/imports/index.astro` and `result.astro` must select `source`.
- **R3, resolved as a design.** In `ImportWizard.tsx` `readStatement`, try strict UTF-8 plus rule 1 on line 1 for
  Santander first. Otherwise call the unchanged `parseIngStatement`. Neither matching → `unknown-format`.
- **Payload.**
  - `src/lib/import/schema.ts` `importTransactionSchema` gets `source` and a conditional `bankTxId`: 18 digits for
    ING, null for Santander.
  - A missing `source` defaults to `ing` (stale tabs during deploy).
  - Lp is not persisted. `bank_tx_id` stays null.
- **Patterns.** The Santander reader stores the rule-5 raw merchant in `counterparty`
  (`src/lib/patterns/merchant.ts` `rawMerchant` reads only that). Unit tests assert per-row `rawMerchant`, not the
  34-pattern partition (that partition is S-11's oracle).
- **Proof to plan.**
  - pgTAP: extend `domain_rls.test.sql` (source accepted and rejected), and extend `import_rpc.test.sql` or add a new
    file for `import_statement`.
  - Smoke: a new Santander payload step; ING steps untouched.
  - Run `npm run db:types`.
- **DESIGN-GAP to add in implement:** K26 (copy) in `context/foundation/design-kit.md`. It covers both-banks
  `importFlow.supported` / `importErrors.unknownFormat` via `copyExtra`, and per-bank `formatRecognised`, `bankName`,
  `accountLabel` and the Santander account label. **No G38**: the wizard already preselects one account at step 2.
- **Follow-up in scope:** F-03 F9 in `scripts/fixture-santander-shape.mjs` `same` / `shape`
  (`context/archive/2026-10-01-synthetic-santander-fixture/follow-ups/review-fixes.md`). Re-run the comparator on the
  symlink dir after the fix.
- **Accepted risk for S-11:** Santander pattern keys change when S-11 normalises card tails.

## 6. Autonomous decisions

1. **Option A (new `import_statement` RPC) recommended over option B (defaulted `p_source` on
   `import_ing_statement`).**
   - Why: option B either creates an overload that PostgREST named-arg calls cannot disambiguate, or needs a
     drop/recreate of the live function. Option A leaves old code untouched during the deploy window.
   - What would change it: the plan proving that option B is safe on this PostgREST version, with a local HTTP test.
2. **R1: keep the reject, do not clamp.**
   - Why: 0 violations on the real exports, the fixture enforces the same invariant, and the PRD is silent.
   - What would change it: a real export with an operation date before the header start, which the new shape metric
     would flag.
3. **Lp not persisted; a deviation from import-formats rule 7's wording.**
   - Why: nothing reads it, and FR-005 rejects ranges instead of deduplicating.
   - What would change it: a feature needing per-row identity.
4. **No G38.**
   - Why: `ImportWizard.tsx` never auto-skips step 2, and it already handles one account (preselected, "1 rachunek"
     lead).
   - What would change it: the plan deciding to skip step 2 for single-account files.
5. **Research scope derived from `change.md` with no interview.** Three parallel read-only workers (schema/RPC,
   kit/copy, parser/patterns/F9); R1 and the DB probes were done by the parent.
   - What would change it: nothing. This was the standard autonomous mode.
6. **The real exports were read for aggregates only.** No value, name or number from them went into any artifact.
   - What would change it: nothing.
