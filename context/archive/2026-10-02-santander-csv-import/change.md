---
change_id: santander-csv-import
title: Santander Bank Polska CSV import on the same rules as ING
status: archived
created: 2026-10-02
updated: 2026-10-02
archived_at: 2026-10-02T00:50:21Z
---

## Notes

Roadmap S-10 (`santander-csv-import`), milestone M-2 (second bank — Santander), slice 2 of 3
(`F-03 synthetic-santander-fixture → S-10 → S-11 santander-card-merchants`). Outcome: the user uploads a Santander
Bank Polska PLN CSV; the app recognises the format itself, shows the import result (debit count, range from the header
start date to the export date), and lists the import with the bank's name. A file in another currency and a range that
overlaps an existing import of that account are rejected with a message. Credits and refunds are skipped, and the
transactions reach the patterns.
PRD refs: FR-018 (Santander, nice-to-have, "na tych samych zasadach co ING"), FR-004 (import list + undo), FR-005
(overlap per account rejected, no dedup). Contract: `context/foundation/import-formats.md` § Santander (rules 1–7,
D2, D7) and § Wykrywanie formatu. Fixture: `test/fixtures/santander/` (F-03; main PLN file 187 rows / 184 debits,
USD reject file, `expected.json` with per-row `rawMerchant`). Worked example: `context/archive/2026-09-24-ing-csv-import/`.

**Scope at identity time:**
- A pure browser-side Santander reader in `src/lib/import/` that follows `parseLine` in
  `scripts/fixture-santander-check.mjs`. That dialect is not strict RFC 4180: trap ST15 puts a `"` inside a bare field.
- Format detection that picks ING or Santander, wired into `ImportWizard.tsx`.
- A payload schema that allows a missing bank transaction id.
- A backward-compatible migration so the database accepts `source = 'santander'`.
- The bank's name on the wizard, the result screen and the imports list.
- Unit tests against `expected.json`, pgTAP for the widened write path, and smoke cases.

**Out of scope (S-11):** normalising card merchant tails (city or branch stripping, `MARKA *Marka App` variants, the
ATM pattern) and grouping merchants across banks. S-10 stores the rule-5 raw merchant only. Santander on the public
demo account is parked (roadmap § Parked).

**Migration expected: yes** (expand-only). `imports.source` has `check (source in ('ing'))` and
`import_ing_statement` hard-codes `'ing'` (migrations `20260923165530_domain_imports_transactions.sql`,
`20260924224014_import_ing_statement.sql`). The database therefore refuses a Santander import today. Changes needed:
- Widen the check.
- Add a way to write `source = 'santander'`: a new RPC, or a source-aware RPC that keeps `import_ing_statement`
  callable unchanged. The live code calls `import_ing_statement` with five named arguments while the schema is
  already new. The plan decides how.
- Add the pgTAP proof and run `npm run db:types`.

No new table, so no new RLS policies. `bank_tx_id` is already nullable, and `transactions_bank_tx_key` is partial
(`where bank_tx_id is not null`).

### Kit bindings (design/rytm-os/prototype/, content.json)

| Kit view / key | Bound how | Santander gap |
| --- | --- | --- |
| `views/imports-new.html` (`importsNew`/`uploadReady`, app.js) | step 1 of `ImportWizard.tsx` | `importFlow.supported` reads "…Później dołączymy Santander." and app.js reads "Santander wkrótce". `copyExtra.imports.formatRecognised` is "rozpoznano format ING" → **DESIGN-GAP**: per-bank recognised line + supported line, `copyExtra` + new K-row in `design-kit.md` |
| `importErrors.unknownFormat` | step 1 error | Reads "…Obsługujemy: ING Bank Śląski. Santander wkrótce." → **DESIGN-GAP** (same K-row): copy listing both banks via `copyExtra`, never edit the kit |
| `importErrors.wrongCurrency` | step 1 error (USD file, ST14) | Fits as is |
| `views/imports-account.html` (`importAccount`) | step 2 | Rows say `copyExtra.imports.bankName` "ING Bank Śląski" → per-bank name needed. The kit has **no** single-account variant (roadmap Unknown) → **DESIGN-GAP** if step 2 is skipped or changed. See decision 3 |
| `views/imports-summary.html` (`importSummary`), `importFlow.oneAccount` | step 3 | The account line uses `accountLabel` "ING · {name}" → per-bank label |
| `views/imports-result.html`, `src/pages/imports/result.astro` | result lead | `accountLabel` hard-coded ING → per-bank |
| `views/imports.html` (`imports()`), `src/pages/imports/index.astro` | list "Rachunek" cell | `accountLabel` hard-coded ING. The list needs `imports.source` in its select. The kit shows only ING rows → the Santander label is a gap |

There is no kit view for a Santander-specific screen, and none is needed. Every gap above is a copy gap. The next free
ids are **K26** and **G38** (last used: K25, G37).

### Roadmap claims vs repo now (checked 2026-10-02 on `feat/santander-csv-import` = `main` 1fed366)

| Roadmap / plan-time claim | Repo now | Correction |
| --- | --- | --- |
| Prerequisite F-03, status `proposed` / Backlog "Ready: yes" | F-03 archived 2026-10-02 (`context/archive/2026-10-01-synthetic-santander-fixture/`). `fixture:check` covers ing + santander (`scripts/fixture-check.mjs`) | — ready |
| "aplikacja sama rozpoznaje format" | `ImportWizard.tsx` `readStatement` calls only `parseIngStatement`. `src/lib/import/` has `ing.ts`, `schema.ts`, `delete.ts`, no detector | New detector plus a Santander reader. Detection follows import-formats rule 1 (9 fields, col 0 `YYYY-MM-DD`, col 2 starts with `'`) |
| Parser per `parseLine` from `scripts/fixture-santander-check.mjs` (Backlog note) | Confirmed. `ing.ts` `parseLine` **throws** on a quote in a bare field ("quote inside a bare field"), so the ING parser cannot be reused for Santander | Separate line reader, or a shared reader with per-dialect quoting. Do not copy the ING strictness (ST15) |
| "na tych samych zasadach co ING" (FR-018) — one payload/RPC path | `importPayloadSchema` requires `bankTxId: /^\d{18}$/` on every transaction. Santander has no transaction id (rule 7) | Schema must accept a missing or null `bankTxId` for Santander. Keep the ING rule intact (the endpoint has no source today, so the payload must carry the bank) |
| Rule 7: "klucz wewnętrzny = `(import_id, lp)`" | `transactions` has no `lp` column. `bank_tx_id` is unique per (user, account) **across** imports, and Lp restarts at 1 in every export | Do not put Lp into `bank_tx_id`: a second import of the same account would hit 23505. Store `bank_tx_id = null`. The plan decides whether Lp is persisted at all. Nothing reads it today |
| "zakres od daty z nagłówka do daty eksportu" (D7) | Header col 1 = start (`DD-MM-YYYY`), header col 0 = export date (`YYYY-MM-DD`): two formats in one row (ST13) | — . The reader must parse both. `importPayloadSchema` and the RPC reject any `occurredOn` outside the period (22023 → `?error=failed`). See Open risk R1 |
| "import do listy importów z nazwą banku" | `imports.source` exists but only `'ing'` is allowed. `index.astro` and `result.astro` select `account_name` only, and render `copyExtra.imports.accountLabel` = "ING · {name}" | Migration (above). The list and result select `source` and map it to a bank label |
| "plik w innej walucie … odrzucany z komunikatem" | The ING path maps `wrong-currency` → `importErrors.wrongCurrency`. The USD fixture exists (ST14) | Reuse the same error. Santander rule 2 checks header col 4 (ING checks per row) |
| "zakres nakładający się na istniejący import tego rachunku" (FR-005) | `imports_no_overlap` on (user, account_number, range) is bank-agnostic. Endpoint 23P01 → `?error=overlap&from&to`. The wizard UX check matches `existing` by `accountNumber` | Works unchanged once the account number is the 26 digits of header col 2 (strip `'` and spaces) |
| "uznania i zwroty są pomijane" (D2) | ING `buildImportPayload` filters `amountMinor < 0` | Same rule (Santander rule 4). The fixture expects 184 of 187 rows imported (ST08 refund, ST09 credits) |
| "transakcje trafiają do wzorców" | `src/lib/patterns/merchant.ts` `rawMerchant(counterparty, title)` reads `counterparty` and, for operators, the title. `load.ts` selects `counterparty, title`. Santander card rows have an **empty** col 3 | The Santander reader must store the rule-5 raw merchant in `counterparty`: the card-description regex tail, else col 3, else col 2. Otherwise 163 card rows collapse into one empty-name pattern. Normalising those tails is S-11 |
| Kit "Santander tylko jako 'wkrótce'" (Unknown) | Confirmed in `content.json` `importFlow.supported`, `importErrors.unknownFormat` and in app.js. Also `copyExtra.imports.formatRecognised`, `bankName`, `accountLabel` are ING literals | Copy gaps → `copyExtra` + K26 (table above) |
| Risk: "import ING musi działać bez zmian … (migracja wstecznie zgodna, smoke ING bez zmian)" | Smoke posts a 2-debit ING payload to `/api/imports` (`scripts/smoke.mjs` `importPayload`). pgTAP `import_rpc.test.sql` and `import_delete.test.sql` call `import_ing_statement` | Keep `import_ing_statement(text,text,date,date,jsonb)` callable as is (expand), and keep those tests green unchanged. Old code on the new schema must keep importing ING |
| Demo guard (S-09) | `/api/imports` lets the demo account make only its first import (`demoImportAllowed`). Santander on demo is parked | No change |

### Follow-ups triggered by this slice

I read every `Trigger:` line in `context/archive/*/follow-ups/review-fixes.md`. Exactly one names S-10:

- **F-03 F9**: the shape comparator hides a variant present on one side only
  (`context/archive/2026-10-01-synthetic-santander-fixture/follow-ups/review-fixes.md`,
  `scripts/fixture-santander-shape.mjs` `same`, the `""`-occurrences metric, line splitting).
  - **Take:** in scope as a **small, separate phase**.
  - Why: S-10 is the first slice that trusts the fixture as the parser's truth. A comparator that reports "=" for a
    real-only variant under 5% is exactly how a parser-breaking shape (like ST15 was) gets past.
  - After the fix, research or implement re-runs `npm run fixture:shape:santander` on the contract's symlink dir
    (sandbox off, aggregate output only).
  - What would drop it: the plan judging the parser phase too large, in which case F9 moves to S-11 with its trigger
    rewritten.

Not triggered, but adjacent:
- **F-03 O1** (`fixture-ing-shape.mjs` path guard). Trigger: a change touching that file, and S-10 has no reason to.
- **ING-import F8** (DB text-length checks, aimed at S-03). Relevant only because Santander writes the same
  `counterparty`/`title` columns. The zod `TEXT_MAX = 500` already bounds them. Not taken.

## Autonomous decisions

1. **Next step = `/10x-research`, not `/10x-plan`** (the skill's default).
   - Rejected: plan directly.
   - Why: the slice touches the parser dialect, the schema/RPC shape under a backward-compatibility constraint, the
     pattern pipeline's `counterparty` contract, and five views' copy. Risk R1 also needs an abstract re-check of the
     real export. That is codebase grounding, not framing.
   - What would change it: the orchestrator's chain mandating plan next. The tables above are enough to plan from.
2. **Migration: expand-only, ING path untouched.**
   - Chosen: widen `imports.source` and add a Santander-capable write path, while `import_ing_statement` keeps its
     signature and behaviour.
   - Rejected: replacing `import_ing_statement` with a renamed or re-signed function. Live code calls it by name with
     5 args during the deploy window.
   - Why: CLAUDE.md requires expand → deploy → contract.
   - What would change it: none in this slice. A later contract migration may retire the ING-only function.
3. **Wizard step 2 for a single-account file: provisional = keep the 3-step flow, with step 2 showing the one
   account preselected.**
   - This matches how the ING wizard already treats a one-account file, and adds no invented UI.
   - Rejected: skipping step 2, which needs a kit state that does not exist (a G-gap plus a new Stepper behaviour).
   - Why: the kit is the source of truth, and the roadmap Unknown says "rozstrzygana w planie".
   - What would change it: the plan or research finding that the ING wizard already auto-skips step 2 for one
     account. Then Santander follows that behaviour.
4. **Card merchant in S-10 = the raw rule-5 tail stored as `counterparty`; normalisation is deferred to S-11.**
   - Rejected: normalising tails in S-10.
   - Why: the roadmap splits it that way, and `expected.json` gives `rawMerchant` per row as S-10's oracle.
   - Accepted risk: S-11 changing the keys of Santander patterns re-keys any decisions or thresholds a user saved
     on them in between. Thresholds and decisions are stored by `merchant_key`.
   - What would change it: the plan judging that re-keying unacceptable, in which case S-10 ships with S-11's
     normaliser or S-11 carries a key migration.
5. **F-03 F9 taken into scope** (see Follow-ups).
6. **Did not open the real Santander exports in this step.** The contract allows only F-03 steps and later steps
   that must re-check a shape. R1 is handed to research as the one shape question.
   - What would change it: none. Research may open them under the contract's privacy rules.

## Open risks for research

- **R1 — operation date before the header start date.** D7 sets the period from header col 1, while `occurredOn` =
  data-row col 1 (operation date). Cards book 1–3 days late, so a card operation booked inside the range could carry
  an operation date **before** the header start.
  - Effect: `importPayloadSchema` and the RPC would reject the whole file (`?error=failed`).
  - The fixture has 0 such rows, and neither `fixture-santander-check.mjs` nor the shape comparator asserts it.
  - Research must answer, abstractly from the real PLN export: are booking dates ≥ header start? Are operation dates?
  - If not, the plan picks one: clamp the period start to min(operation date), use the booking date for the range
    check, or extend the trap list. Do not silently drop rows.
- **R2 — `account_name` for Santander.** The header has no account name, and header col 3 is the owner's personal
  name. Storing it as `account_name` would put a person's name on every list row and in `accountLabel`.
  - Candidates: a fixed label, or a label built from the account tail. The plan decides. K/G gap if the kit wording
    is missing.
- **R3 — format detection on a re-saved file.** ING insists on cp1250 (`looksLikeUtf8`), Santander is UTF-8 without
  BOM. The detector must try each dialect's own decoding, and the "unknown format" path must stay intact for neither.
