# Handoff — `santander-csv-import` (slice S-10)

The `/10x-plan santander-csv-import` step of autonomous run `2026-10-01-m2-santander` wrote this handoff. `plan.md`
has 6 small phases and 42 Progress rows, `plan-brief.md` sits next to it, and `change.md` is now `planned`.

The next agent must not get this wrong: the ING path must stay byte-identical. That means `import_ing_statement`,
`import_rpc.test.sql`, `import_delete.test.sql` and every existing ING smoke step. Santander writes through a **new**
`import_statement` RPC, and its EXECUTE grant must be revoked from `public, anon` explicitly.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/santander-csv-import`, cut from `main` at `1fed366` |
| Commits | 3 on top of `1fed366`: identity, research, and `docs(santander-csv-import): plan` (this step) |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `planned` (set by `metadata-guard.mjs mark-planned`) |
| `## Progress` rows remaining | 42 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the commit, except for files this step did not touch |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `context/changes/santander-csv-import/plan.md` | Implementation plan, 6 phases, `## Autonomous decisions` (15 rows), `## Progress` (42 rows) |
| `context/changes/santander-csv-import/plan-brief.md` | Two-page brief |
| `context/changes/santander-csv-import/change.md` | Frontmatter: `status: preparing → planned` |
| `context/foundation/roadmap.md` | S-10 status `proposed → planning`, in the At-a-glance table and in the S-10 body |
| `context/changes/santander-csv-import/handoff.md` | This file |

## 3. Verification

| Command | Result (observed in this step) |
| --- | --- |
| `git branch --show-current` | `feat/santander-csv-import` |
| Mapping of Success Criteria bullets to Progress rows (awk over `plan.md`) | P1 5+1, P2 6+1, P3 5+1, P4 6+1, P5 5+1, P6 5+5 = 42 = `grep -c '^- \[ \]'` |
| `metadata-guard.mjs inspect` / `mark-planned` | `changed: true`, status `planned` |

This step changed no product code, so lint, astro check, vitest, build, pgTAP and smoke were not run. The contract
baseline (`1fed366`: lint 0, astro check 0 (137 files), fixture:check OK, vitest 256 (15 files), build OK, pgTAP
Files=5 Tests=102, smoke 140/0) is inherited and unverified here.

## 4. Next command

`/10x-plan-review santander-csv-import`

## 5. Open

**Phases** (each for a fresh implement agent):

1. Comparator F-03 F9 plus the R1 metric, in `scripts/fixture-santander-shape.mjs` `same` / `shape`.
2. Migration `…_import_statement_source.sql`, `import_statement.test.sql`, the `domain_rls.test.sql` extension and
   `db:types`.
3. `banks.ts`, schema `source` plus the conditional `bankTxId`, endpoint `rpc("import_statement")`, and smoke +5 in
   the fresh "re-created account" block.
4. `common.ts`, `santander.ts`, `detect.ts`, `santander-parser.test.ts` and `detect.test.ts`.
5. Per-bank `accountLabel` in `index.astro` / `result.astro`, and smoke +2.
6. The wizard on `readImportFile`, the K26 copy and register, the `import-formats.md` / `CLAUDE.md` notes, and the
   seam sweep.

**Manual-only Progress rows (checklist):**

- 1.6 [reviewer] Real-export comparison (sandbox off, symlink dir from the contract).
- 2.7 [reviewer] Migration review.
- 3.6 [reviewer] ING smoke steps byte-identical.
- 4.7 [reviewer] Reader vs rules 1–6.
- 5.6 [visual] List and result.
- 6.6 [visual] Every wizard state at 1280 and ~400 px.
- 6.7 [reviewer] Full local Santander import.
- 6.8 **[human]** Import the owner's real export locally.
- 6.9 **[human]** Accept the rule-7 deviation (Lp not stored).
- 6.10 **[human]** Accept the K26 wording, including "Rachunek".

**DESIGN-GAP to add in implement:** K26 (Phases 5–6), in `context/foundation/design-kit.md`, `src/content/copy.ts`
and `copyExtra.imports`. No G-row.

**Follow-ups:**
- F-03 F9 is taken in Phase 1.
- F-03 O1 and ING F8 are not triggered.

**Carried risks:**
- S-11 re-keys Santander patterns.
- R1 is guarded only by the manual comparator.
- After a rollback, Santander imports would show as "ING · Rachunek" (cosmetic).

## 6. Autonomous decisions

The full table is in `plan.md` § Autonomous decisions. The load-bearing ones:

1. **Write path is option A.**
   - Chosen: `import_statement(p_source, …)` with an explicit revoke.
   - Rejected: a defaulted `p_source` on the old function.
   - Why: only option A keeps the live five-key call unambiguous during the deploy window.
   - What would change it: a local HTTP proof that option B resolves without PGRST203.
2. **`source` defaults to `ing`.**
   - Rejected: a required `source`.
   - Why: stale tabs during the deploy window post no `source`.
   - What would change it: the contract migration that retires ING-only code.
3. **Lp is not stored, and `bank_tx_id` is null.** This deviates from the wording of `import-formats.md` rule 7, so it
   gets [human] 6.9.
   - Rejected: Lp in `bank_tx_id`, which collides in `transactions_bank_tx_key`; and a new `lp` column.
   - What would change it: a feature that needs per-row identity.
4. **The Santander account name is "Rachunek".**
   - It is a `copyExtra` key, injected into the pure reader via options. The owner's name in header col 3 is never
     stored. This gets [human] 6.10.
   - Rejected: storing "Rachunek •• NNNN" (duplicates the tail in steps 2–3), and a tail on the list (the kit has
     none).
   - What would change it: a user with two Santander PLN accounts.
5. **Reader structure.**
   - Chosen: `santander.ts` + `detect.ts`, checking Santander first with strict UTF-8 and otherwise running the
     unchanged ING reader, plus `common.ts`. A matched Santander file never falls through to ING.
   - Rejected: a merged reader.
   - What would change it: a third bank whose line 1 matches rule 1.
6. **No balance-chain check.** Rule 3 and the period check only.
   - Why: the chain is not an import rule.
   - What would change it: a real export where the row count passes but rows are missing.
7. **`details` is `""` for Santander.**
   - Why: store the minimum. Nothing reads `details`.
   - What would change it: a feature reading counterparty accounts.
8. **Smoke goes in the fresh "re-created account" block.**
   - Why: no existing ING assertion can shift.
   - What would change it: that block being removed.
9. **`supported` / `unknownFormat` overrides are injected in `new.astro`.**
   - Why: the kit is read-only, and one injection point covers the G27 stand-ins.
   - What would change it: the kit author updating `content.json`.
10. **`readImportFile` is extracted into `detect.ts`.**
    - Why: it gives the wizard wiring an automated deliberate break.
    - What would change it: component tests existing for the wizard.
11. **Complexity MEDIUM, 0 questions.**
    - Why: research recommended an answer for every open choice.
    - What would change it: a product owner being available.
