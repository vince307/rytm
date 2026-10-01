# Handoff — `santander-csv-import` (slice S-10)

The `/10x-new santander-csv-import` step of autonomous run `2026-10-01-m2-santander` wrote this handoff. The change
folder exists with `change.md` (status `new`): the roadmap claims are checked against the repo, the kit bindings and
gaps are listed, a migration is expected, and one triggered follow-up (F-03 F9) is in scope. The next agent must not
get this wrong: the database refuses Santander today (`imports.source` check `in ('ing')`, and
`import_ing_statement` hard-codes `'ing'`). Any fix must be expand-only, with `import_ing_statement(text,text,date,date,jsonb)`
still callable unchanged by the live code.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/santander-csv-import`, cut from `main` at `1fed366` |
| Commits | 1 on top of `1fed366`: `docs(santander-csv-import): change identity (autonomous run)` |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `new` |
| `## Progress` rows remaining | n/a: no `plan.md` yet |
| Working tree | clean after the commit (`tree-clean.sh` printed `CLEAN` before this step's writes) |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `context/changes/santander-csv-import/change.md` | Change identity: scope, migration-expected verdict, kit bindings/gaps table, "roadmap claim, repo now, correction" table, triggered follow-ups, autonomous decisions, open risks R1–R3 |
| `context/changes/santander-csv-import/handoff.md` | This file |

## 3. Verification

| Command | Result |
| --- | --- |
| `git branch --show-current` | `feat/santander-csv-import` |
| `.claude/skills/10x-autonomous-run/scripts/tree-clean.sh` (before writing) | `CLEAN` |
| Uniqueness: `context/changes/santander-csv-import`, `context/archive/*santander-csv-import` | absent before creation |
| `grep Trigger:` over `context/archive/*/follow-ups/review-fixes.md` | one hit for S-10 (F-03 F9) |
| `node` over `test/fixtures/santander/expected.json` | main file: 187 rows, 0 with an operation or booking date outside the period. Kinds: card 163, transfer 8, other 7, atm 3, blik 3, blik-withdrawal 2, card-refund 1 |

No product code changed, so lint, astro check, vitest, build, pgTAP and smoke were not run. Baseline per the contract
(inherited, unverified in this step): lint 0, astro check 0 (137 files), fixture:check OK, vitest 256, build OK,
pgTAP 102, smoke 140/0.

## 4. Next command

`/10x-research santander-csv-import`

## 5. Open

- **R1** (`change.md` § Open risks): is an operation date ever before the header start date? `importPayloadSchema`
  `.refine` (transaction date outside the import period) and `import_ing_statement`'s 22023 check would reject the
  whole file.
  - Research answers this abstractly from the real PLN export, using the symlink dir in the agent contract with the
    sandbox off. Counts only.
- **R2**: what to store in `account_name` for Santander. Header col 3 is the owner's personal name; avoid storing it.
- **R3**: format detection versus encodings. ING `looksLikeUtf8` in `src/lib/import/ing.ts` versus Santander UTF-8.
- **Schema**: `importPayloadSchema` `bankTxId` regex `^\d{18}$` blocks Santander. Lp must not go into `bank_tx_id`
  (`transactions_bank_tx_key` spans imports).
- **Patterns**: `src/lib/patterns/merchant.ts` `rawMerchant` reads `counterparty`. Santander card rows have an empty
  col 3, so the reader must store the rule-5 tail there.
- **DESIGN-GAPs to add in implement:**
  - K26 (copy): `importFlow.supported` and `importErrors.unknownFormat` still say "Santander wkrótce". Per-bank
    `formatRecognised`, `bankName` and `accountLabel` in `copyExtra.imports`.
  - Possibly G38, if the plan changes step 2 for one-account files.
- **Follow-up in scope:** F-03 F9, `scripts/fixture-santander-shape.mjs` `same`
  (`context/archive/2026-10-01-synthetic-santander-fixture/follow-ups/review-fixes.md`).
- **Accepted risk for S-11:** re-keying Santander card patterns when S-11 normalises the tails.

## 6. Autonomous decisions

1. **Next = `/10x-research`, not `/10x-plan`.**
   - Why: the slice spans the parser dialect, a backward-compatible schema/RPC, the patterns' `counterparty`
     contract, five views' copy, and R1.
   - What would change it: the orchestrator's chain mandating plan next. `change.md` is enough to plan from.
2. **Migration expand-only.**
   - Chosen: widen the `imports.source` check and add a Santander-capable write path.
   - Rejected: re-signing or renaming `import_ing_statement`.
   - Why: the deploy window runs old code on the new schema.
   - What would change it: nothing in this slice.
3. **Step 2 stays for one-account files**, with the single account preselected.
   - The ING wizard always goes 1 → 2 → 3 (`setStep(2)` in `ImportWizard.tsx`). Skipping step 2 needs a kit state
     that does not exist.
   - What would change it: the kit author adding a single-account state, or the plan finding a kit-backed skip.
4. **S-10 stores raw card merchants; normalisation stays in S-11.**
   - What would change it: the plan judging the S-11 re-key of user decisions unacceptable.
5. **F-03 F9 is in scope as a small separate phase.**
   - What would change it: the plan finding the parser phase too large, in which case F9 moves to S-11 with its
     trigger rewritten.
6. **The real exports were not opened in this step** (contract privacy rules).
   - R1 goes to research.
   - What would change it: nothing.
