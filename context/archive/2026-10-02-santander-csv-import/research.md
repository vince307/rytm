---
date: 2026-10-02T00:41:18+02:00
researcher: Claude (autonomous run 2026-10-01-m2-santander, research step)
git_commit: d2f2a862ccd9959cbb3bd953f763c18eb56eabd3
branch: feat/santander-csv-import
repository: Rytm
topic: "S-10 santander-csv-import — parser dialect, format detection, expand-only schema/RPC, patterns contract, kit copy, risks R1–R3, follow-up F-03 F9"
tags: [research, import, santander, supabase, migration, patterns, design-kit]
status: complete
last_updated: 2026-10-02
last_updated_by: Claude (autonomous run, research step)
---

# Research: Santander CSV import on the same rules as ING (S-10)

**Date**: 2026-10-02T00:41:18+02:00
**Researcher**: Claude (autonomous run `2026-10-01-m2-santander`, research step)
**Git Commit**: `d2f2a86` (`docs(santander-csv-import): change identity (autonomous run)`)
**Branch**: `feat/santander-csv-import`
**Repository**: Rytm

Anchors are **file + symbol**, never line numbers (agent contract). Facts about the real Santander exports are
**aggregates only**: counts, shares and day offsets. No values from the real files appear here.

## Research Question

Derived from `change.md` (no human in the loop):

1. **Q1, parser and detection.** What can a Santander reader reuse from `src/lib/import/ing.ts`? Which dialect does it
   need? How should format detection choose between ING and Santander (R3)?
2. **Q2, schema and RPC.** What exactly blocks `source = 'santander'` today? What is the safe expand-only migration,
   given that the production code calls `import_ing_statement` during the deploy window? What does the pgTAP and
   smoke proof need?
3. **Q3, payload.** What does the zod payload need? How should a missing `bankTxId`, Lp and `accountName` (R2) be
   handled?
4. **Q4, R1.** Can an operation date fall before the header start date on a real export?
5. **Q5, patterns.** How must Santander rows be stored so that `rawMerchant` and `merchantKey` produce useful
   patterns?
6. **Q6, kit.** Which views and copy are bound, and which strings are gaps rather than kit copy?
7. **Q7, follow-up F-03 F9.** What is the comparator defect, and what is the fix?

## Summary

- **R1 is resolved: no.**
  - Observed on both real exports (the PLN file with 483 data rows and the USD file with 3), read through the
    contract's symlink dir: **0 rows** have an operation date before the header start, and 0 rows have a booking date
    before it. 0 rows have either date after the export date.
  - In both files the earliest operation date **equals** the header start date (offset 0 days). The earliest booking
    date is later (2 and 7 days).
  - Inference: the bank filters the export by operation date, so `importPayloadSchema`'s period refine and the 22023
    check in `import_ing_statement` hold for the real file. The fixture enforces the same invariant
    (`scripts/fixture-santander-check.mjs` `check`).
  - Recommendation: no clamping. Keep the reject, and keep an explicit unit case for an out-of-period operation date
    → `unknown-format`.
- **The database refuses Santander in exactly two places.**
  - Constraint `imports_source_check` is `CHECK (source = 'ing')`. Its name was verified on the local DB.
  - `import_ing_statement` hard-codes `'ing'` (migration `20260924224014_import_ing_statement.sql`).
  - `bank_tx_id` is already nullable with a partial unique index (`transactions_bank_tx_key`), and the RPC passes a
    JSON null through as SQL null.
  - **Recommended migration (option A, expand-only).**
    1. Widen `imports_source_check` to `('ing','santander')`.
    2. Add a **new** function `import_statement(p_source text, …the same five args)`.
    3. Leave `import_ing_statement` byte-for-byte untouched.
    4. Explicitly `revoke execute … from public, anon` and `grant … to authenticated`. A `BEGIN … ROLLBACK` probe
       showed that a new function in `public` gets EXECUTE for **PUBLIC and anon** by default.
  - Option B (a defaulted `p_source` on `import_ing_statement`) is rejected. It either creates an ambiguous overload
    for PostgREST named-arg calls, or needs a drop/recreate of the live function.
- **Payload blocker.** `importTransactionSchema.bankTxId` is `z.string().regex(/^\d{18}$/)`, which is required and
  non-null. Santander needs a payload that carries the bank (`source`) and a `bankTxId` that is null for Santander,
  while ING keeps the 18-digit rule. Lp must **not** go into `bank_tx_id`, because Lp restarts per export and
  `transactions_bank_tx_key` spans imports.
- **Patterns (Q5).** `rawMerchant(counterparty, title)` returns `collapse(counterparty)` (`src/lib/patterns/merchant.ts`).
  An empty counterparty gives key `""`, so all such rows merge into one pattern.
  - Santander card rows have an empty col 3. The reader must therefore store the rule-5 raw merchant (card-regex tail,
    else col 3, else col 2) **in `counterparty`**.
  - On the real PLN export, 0 rows have both col 2 and col 3 empty, so the rule-5 merchant is never empty there.
  - The `OPERATORS` branch falls through to `collapse(counterparty)` when the title has no `Nr transakcji`, so
    Santander rows are safe there.
- **Detection (R3).** Santander first: strict UTF-8 decode (`TextDecoder('utf-8', {fatal:true})`), then rule 1 on
  line 1. Otherwise run the unchanged `parseIngStatement`, which itself rejects UTF-8 with non-ASCII (`looksLikeUtf8`).
  Neither matching → `unknown-format`.
  - Both real files are valid UTF-8, without BOM, without CR, with 9 fields on 100% of rows. The header row count
    matches col 7.
  - `ing.ts` `parseLine` throws on a quote inside a bare field. It cannot read Santander (trap ST15).
- **Kit (Q6).** These are copy gaps, not UI gaps.
  - `importFlow.supported` and `importErrors.unknownFormat` (kit JSON at `design/rytm-os/react-kit/docs/content.json`)
    say Santander is coming. `copyExtra.imports.{formatRecognised, bankName, accountLabel}` are ING literals.
  - Next free ids: **K26** and **G38**.
  - The wizard never auto-skips step 2. It preselects `defaultAccountNumber`, so a one-account Santander file goes
    1→2→3 like ING and needs no G-row.
- **F-03 F9** is a three-part fix in `scripts/fixture-santander-shape.mjs`:
  1. In `same`, treat a key present on one side only as a difference.
  2. Count `""` only inside quoted values, as a share of lines.
  3. Split lines on `/\r?\n/`.
  - The current comparator on the real dir reports "No structural differences" for both PLN and USD.

## Detailed Findings

### Q1 — Parser dialect and reuse

**ING reader (`src/lib/import/ing.ts`)**

- Exports:
  - `parseIngStatement(bytes): IngParseResult`
  - `buildImportPayload(statement, accountNumber): ImportPayload`
  - types `IngAccount`, `IngRow`, `IngStatement`, `IngParseError` (`"unknown-format" | "wrong-currency"`) and
    `IngParseResult` (`{ok:true, statement} | {ok:false, error}`)
- Module-private, not exported: `parseLine`, `looksLikeUtf8`, `toMinor`, `isDate`.
- Bank-agnostic and reusable after extraction: `toMinor` (`-?\d+,\d{2}` → signed minor units, identical to `toMinor`
  in `scripts/fixture-santander-check.mjs`), the result union, and the "debits only, made positive" step of
  `buildImportPayload`.
- ING-specific:
  - cp1250 decoding plus the UTF-8 rejection (`looksLikeUtf8`)
  - the `;` dialect with a lenient T19 rule that still **throws on a quote inside a bare field**
  - the preamble and accounts block
  - the 21-column width
  - the 18-digit `bankTxId`
  - out-of-period rows throw `FormatError` → `unknown-format`

**Santander dialect (oracle: `scripts/fixture-santander-check.mjs`)**

- `parseLine` (exported):
  - Separator `,`.
  - `"` opens a quoted field **only at field start**, and closes only before `,` or end of line.
  - A bare field may contain `"` (ST15). It throws on `""` and on a stray quote inside a quoted field.
  - Returns `{value, quoted}` per field.
- Other exports usable as the spec: `YMD`, `DMY`, `CARD`, `toMinor` and `rawMerchantOf`.
- Header and data-row layout: `context/foundation/import-formats.md` § Santander, "Struktura pliku".
  - Header: col 0 export date `YYYY-MM-DD`, col 1 start `DD-MM-YYYY`, col 2 `'`+grouped 26 digits, col 3 owner,
    col 4 currency, col 5/6 balances, col 7 row count.
  - Data row: col 0 booking date, col 1 operation date (**used**), col 2 description, col 3 counterparty, col 4
    counterparty account, col 5 amount, col 6 balance, col 7 Lp.
- Rules 1–7 (import-formats § "Reguły importu Santander"):
  1. detect
  2. currency ≠ PLN → reject
  3. row count == header col 7
  4. skip amounts ≥ 0
  5. raw merchant
  6. period = header col 1 .. header col 0 (D7)
  7. internal key `(import_id, lp)`
- Fixture: `test/fixtures/santander/`.
  - The main PLN file has 187 rows, 184 imported, period 2026-03-01..2026-08-31, `imported.sumMinor` 1342109.
  - The USD reject file has 3 rows.
  - `expected.json` has per-row keys `file, lp, line, bookedOn, occurredOn, amountMinor, kind, card, traps, imported,
    skipReason, rawMerchant, pattern`.
  - It is the oracle for the S-10 unit tests, mirroring `test/unit/ing-parser.test.ts`.

**Real exports: aggregate shape (sandbox off, symlink dir)**

| Check | Result |
| --- | --- |
| UTF-8 validity, BOM, CR | Both files: valid UTF-8, no BOM, no CR |
| Field count per data row | 9 on 100% of rows, both files |
| Header col 7 vs data-row count | Matches in both files |
| Comparator `npm run fixture:shape:santander` (fixture vs real) | "No structural differences" for PLN and for USD |
| PLN file composition | 483 data rows: 466 debits, 17 credits |
| Longest description (col 2) | ≤ 95 characters |
| Longest counterparty (col 3) | ≤ 88 characters |

The text lengths are far below `TEXT_MAX = 500` (`src/lib/import/schema.ts`).

**Recommendation for the plan.**
- Add a new module `src/lib/import/santander.ts`, which ports `parseLine`, `rawMerchantOf` and the header logic from
  the check script into TypeScript.
- Add a small shared `src/lib/import/detect.ts` (or similar) that returns a bank-tagged result.
- Extract `toMinor` and `isDate` into a shared helper, or duplicate them. Duplication is acceptable at that size.
- Do not weaken the ING `parseLine`.

### Q1/R3 — Format detection

- Today `ImportWizard.tsx` `readStatement` is the only caller of `parseIngStatement`. `Loaded.statement` is typed
  `IngStatement`.
- `import-formats.md` § "Wykrywanie formatu" gives the rules:
  - ING: line 1 starts with `"Lista transakcji"` after cp1250 decoding.
  - Santander: rule 1.
  - Neither → reject with the unknown-format message.
- Proposed order:
  1. Try strict UTF-8.
  2. If line 1 matches rule 1 (9 fields, col 0 `YMD`, col 2 starts with `'`), use the Santander reader.
  3. Otherwise call `parseIngStatement(bytes)` unchanged.
- Why this order is safe:
  - An ING file with Polish characters is not valid UTF-8, so the fatal decode fails and the file goes to ING.
  - An ASCII-only ING file decodes, but line 1 does not match rule 1.
  - A Santander file re-saved as cp1250 fails the strict decode. ING then rejects it as `unknown-format`, consistent
    with the ING "re-saved file" stance.
- Wrong currency (rule 2) maps to the existing `wrong-currency` → `importErrors.wrongCurrency`. The ST14/USD fixture
  covers it.
- The plan can widen `Loaded.statement` to a bank-tagged union, or normalise both readers into one
  `Statement {bank, accounts, period, defaultAccountNumber, rows}` shape. The wizard only needs `accounts`, `period`,
  `defaultAccountNumber` and a payload builder.

### Q2 — Schema and RPC (verified on the local DB)

**Tables and the RPC today**

- `imports`, from `20260923165530_domain_imports_transactions.sql`, as read from `pg_constraint`:
  - `imports_source_check` = `CHECK ((source = 'ing'::text))`
  - `imports_check` (period_end ≥ period_start)
  - `imports_no_overlap` (EXCLUDE gist on user_id, account_number, `daterange [ ]`; bank-agnostic)
  - `imports_id_user_id_account_number_key`
  - `imports_user_id_fkey` (cascade)
- `transactions`:
  - `bank_tx_id text` is nullable, with no format check in the DB.
  - `transactions_bank_tx_key` is a partial unique index on (user_id, account_number, bank_tx_id) where it is not
    null.
  - `amount_minor > 0`.
- RLS on both tables: per-operation policies for `authenticated` covering select, insert and delete. Neither table has
  an update policy.
- `import_ing_statement(p_account_number, p_account_name, p_period_start, p_period_end, p_transactions jsonb) returns
  uuid` (`20260924224014_import_ing_statement.sql`). This is its only definition.
  - `security invoker`, `search_path = ''`.
  - Raises 22023 for: no `auth.uid()`, a non-array, length outside 1..5000, or any `occurred_on` null or outside the
    period.
  - Inserts `('ing', …)`, then the transactions via `jsonb_array_elements`. `bank_tx_id` is `e ->> 'bank_tx_id'`, so
    JSON null becomes NULL.
  - Constraint errors (23P01, 23505, 23514) propagate.
  - ACL: `authenticated`, `service_role` and `postgres` only.

**Proof by `BEGIN … ROLLBACK` on the local DB**

- Widening via `drop constraint imports_source_check, add constraint imports_source_check check (source in
  ('ing','santander'))` works.
- A freshly created `public` function gets the ACL `=X/postgres … anon=X/postgres authenticated=X/postgres …`.
- After `ROLLBACK`, the probe function was gone and the check was back to `'ing'` only.

**Recommendation: option A (expand-only)**

1. One migration `YYYYMMDDHHmmss_import_statement_source.sql`.
2. Widen the check.
3. `create function public.import_statement(p_source text, p_account_number text, p_account_name text, p_period_start
   date, p_period_end date, p_transactions jsonb) returns uuid`, with the same body as `import_ing_statement` except
   `insert … values (p_source, …)`. Validate `p_source in ('ing','santander')` → 22023, or let the check raise
   23514.
4. Copy the `revoke execute … from public, anon` / `grant execute … to authenticated` pair and the
   `comment on function`.
5. Keep `import_ing_statement` untouched. Old code keeps calling it.
6. A later contract migration, in a separate merge after deploy, may drop it once nothing calls it. That is out of
   S-10 scope.

The endpoint `src/pages/api/imports.ts` (`POST`) then calls `rpc("import_statement", {p_source, …})`.

**Option B, rejected.** It would add `p_source text default 'ing'` to `import_ing_statement`.
- `create or replace` cannot change the argument list. It creates a second overload.
- PostgREST resolves named-key calls by argument names. The old five-key call matches both overloads, which gives an
  ambiguity error (PGRST203; known PostgREST semantics, not tested here).
- Avoiding that means dropping the live five-arg function in the same migration.
- Not chosen: it is riskier than A and keeps a misleading name.

**Proof surface**

- pgTAP:
  - Extend `supabase/tests/database/domain_rls.test.sql` (`plan(28)`): `source 'santander'` accepted, and an unknown
    source rejected with 23514. Today it never asserts the source check.
  - Extend `import_rpc.test.sql` (`plan(16)`), or add `import_statement.test.sql`:
    - `import_statement('santander', …)` records `source`.
    - All-null `bank_tx_id` is accepted.
    - Two Santander imports of the same account in disjoint ranges are both accepted (no 23505 from null ids).
    - Overlap → 23P01.
    - Out-of-period → 22023.
    - anon → 42501.
    - The `import_ing_statement` cases stay unchanged.
  - `import_delete.test.sql`, `pattern_thresholds` and `pattern_decisions` stay unchanged.
- Delete path (`src/pages/api/imports/delete.ts`, `src/lib/import/delete.ts` `deleteImportSchema`): a plain RLS
  delete with an FK cascade. It is bank-agnostic and needs no change.
- Run `npm run db:types` afterwards. `imports.Row.source` is typed `string`, not an enum, so no type fallout beyond
  the new `Functions.import_statement` entry.
- Smoke (`scripts/smoke.mjs`):
  - `importPayload` / `importPayloadJune` and the steps "import is saved and shows its result", "import of an
    overlapping range is rejected", "import with an invalid payload is rejected" and "same range is imported again
    after delete" are all ING-shaped.
  - Add a Santander payload (source `santander`, null `bankTxId`) to prove the new path end-to-end, including the list
    showing the bank.
  - Do not edit the ING steps.
- Error mapping in `api/imports.ts`:
  - 23P01 → `?error=overlap&from&to` (bank-agnostic).
  - Everything else, including 22023 and 23505 → `?error=failed`.
  - zod failure → `?error=invalid`.

### Q3 — Payload, Lp and `accountName` (R2)

**Payload**

- `src/lib/import/schema.ts` has:
  - `importTransactionSchema.bankTxId` with the 18-digit regex
  - `accountNumber /^\d{26}$/`
  - `accountName min(1).max(200)`
  - `TEXT_MAX = 500`
  - `MAX_DEBITS = 5000`
  - period refines: start ≤ end, and every `occurredOn` within the period
- The payload has no `source`. Recommendation:
  - Add `source: z.enum(["ing","santander"])`.
  - Validate `bankTxId` conditionally: ING requires 18 digits, Santander requires null or absent. Use a discriminated
    union or a `superRefine`.
- An old browser bundle posting a payload without `source` during the deploy window would hit the new endpoint. The
  plan should default a missing `source` to `"ing"`, so a stale tab does not get `error=invalid`.

**Lp**

- Rule 7 says the internal key is `(import_id, lp)`. `transactions` has no `lp` column, and nothing in `src/` would
  read one.
- The PRD (FR-018 note) says the missing transaction key "nie przeszkadza" (does not matter) because FR-005 rejects
  ranges.
- Recommendation: do not persist Lp in S-10. Store `bank_tx_id = null`.
- This is a documented deviation from rule 7's wording. Lp is only a within-file order, and FR-005 makes a key
  unnecessary.
- What would change it: a feature that needs per-row identity across reloads (none on the roadmap).

**`accountName` (R2)**

- ING takes it from the preamble's account product name (`ing.ts` `IngAccount.name`), not a person.
- Santander's header has no account name. Col 3 is the owner's personal name, which `import-formats.md` and the
  shape-notes privacy NFR say to avoid.
- Where `account_name` is consumed:
  - `src/pages/imports/index.astro`: the "Rachunek" column via `copyExtra.imports.accountLabel`
  - `src/pages/imports/result.astro`: the lead
  - `ImportWizard.tsx`: step 3 `dl`, with `formatAccountTail(number)` appended
- PRD and kit position: the PRD is silent, and the kit shows ING rows only.
- Recommendation:
  - Store a neutral label from `copyExtra`, e.g. a generic "Rachunek" template plus the tail mask, so that two
    Santander accounts stay distinguishable on the list (the list shows no number).
  - Make `accountLabel` per source (ING · … / Santander · …).
  - Record it as K26. **Never store header col 3.**

### Q4 — R1 (operation date vs header start)

All results are aggregates over both real exports.

| Check | PLN file (483 rows) | USD file (3 rows) |
| --- | --- | --- |
| Operation date < header start | 0 | 0 |
| Booking date < header start | 0 | 0 |
| Operation or booking date > export date | 0 | 0 |
| Earliest operation date − header start | 0 days | 0 days |
| Earliest booking date − header start | +2 days | +7 days |

- Inference: the header start is the bank's **operation-date** filter bound. This is not proven for every export,
  only for these two. Cards booking 1–3 days late can therefore cross the start only in booking date, never in
  operation date, and `occurredOn` = col 1 stays inside the period.
- The fixture enforces "every operation date ≥ header col 1, booking ≤ header col 0" (`fixture-santander-check.mjs`
  `check`). The shape comparator does **not** measure this.
- Recommendation:
  - Add a metric "operation date before header start: share" to `fixture-santander-shape.mjs` alongside the F9 fix,
    so a future real export with a different filter shows up.
  - Keep the whole-file reject (unit test: a row with an operation date before the start → `unknown-format`). Do not
    clamp silently. The PRD is silent on out-of-period rows, and D7 says the period comes from the header.

### Q5 — Patterns contract

- `src/lib/patterns/merchant.ts` `rawMerchant(counterparty, title)`:
  - If the counterparty contains an `OPERATORS` entry (PayPro, PayU, Cashbill, Autopay, ING Pay) **and** the title has
    `Nr transakcji \d+ …`, it returns the last token of the tail.
  - Otherwise it returns `collapse(counterparty)`. An empty counterparty gives `""`.
- `merchantKey` = `normalizeMerchant(raw)` lower-cased (pl-PL).
- `src/lib/patterns/load.ts` `loadTransactionRows` selects `id, amount_minor, counterparty, title, occurred_on`.
  `derive.ts` `derivePatterns` calls `rawMerchant(row.counterparty, row.title)`.
- Consequence: Santander must store the rule-5 raw merchant in `counterparty`.
  - Proposed mapping: `counterparty` = rule-5 merchant, `title` = col 2 description, `details` = col 3 or empty
    (plan's choice).
  - In the fixture, 0 imported rows have an operator name in `rawMerchant`, so the operator branch is not hit.
  - Storing col 2 in `title` stores the card mask (6+4 digits, middle masked) as written by the bank. That is the
    user's own data under RLS, like ING's `title`. Note it, it is not a blocker.
- Oracle limit:
  - `expected.json` `patterns` (34) are resolved partly by normalisation (25), partly by import (8) and partly by user
    merge (1).
  - The 184 imported fixture rows have 37 distinct lower-cased raw merchants.
  - S-10 unit tests should therefore assert per-row `rawMerchant` (and the `counterparty` stored), **not** the
    34-pattern partition. That partition is S-11's oracle, after normalisation.

### Q6 — Kit bindings and copy

**Kit copy (`design/rytm-os/react-kit/docs/content.json`)**

- `importFlow.supported`: "Obsługujemy wyciągi ING Bank Śląski w PLN. Później dołączymy Santander."
- `importErrors.unknownFormat`: "Nieznany format pliku. Obsługujemy: ING Bank Śląski. Santander wkrótce."
- `importErrors.wrongCurrency` fits as is.
- `prototype/app.js` `importsNew()` says "Santander wkrótce." in the hint. That is a kit-internal discrepancy with the
  JSON. The app uses the JSON key.

**`src/content/copy.ts` `copyExtra.imports`**

- `formatRecognised`: "rozpoznano format ING"
- `bankName`: "ING Bank Śląski"
- `accountLabel`: "ING · {name}"
- The other keys are bank-neutral.

**Where the copy renders in `ImportWizard.tsx`**

| Copy | Where |
| --- | --- |
| `flow.supported` | step-1 drop zone |
| `x.formatRecognised` | step-1 chip |
| `x.bankName` | step-2 radio `<small>` |
| `x.accountLabel` | step-3 `dl` |
| Labels | passed from `src/pages/imports/new.astro` |

**Data the pages read**

- `new.astro` selects `account_number, period_start, period_end` for `existing`. It needs no `source`, because overlap
  is per account number.
- `index.astro` and `result.astro` select `account_name` but not `source`. Add `source` and map it to a bank label.
- No other view renders account labels (home, patterns and settings were checked).

**Step 2 and the kit views**

- `ImportWizard.tsx` always goes 1→2→3 (`setStep`), with `setAccount(result.statement.defaultAccountNumber)`
  preselecting. With one account the lead already reads "Ten plik zawiera 1 rachunek…". So `change.md` decision 3 is
  confirmed, and no G38 is needed.
- Kit views `imports-account.html` (three accounts), `imports-summary.html` ("ING · Konto główne · •• 4821") and
  `imports.html` ("ING · Konto główne") show ING only. They have no single-account variant and no Santander row.

**Gaps**

- The gaps go in one **K26** row in `context/foundation/design-kit.md` (table header `| # | W kicie | W
  \`shape-notes.md\` | Rozstrzygnięcie |`). They cover:
  - both-banks `supported` / `unknownFormat` text in `copyExtra`
  - per-bank `formatRecognised`, `bankName` and `accountLabel`
  - the Santander account-name label from R2
- Each gets a `DESIGN-GAP` comment at its use site.
- The last ids used are K25 and G37.

### Q7 — Follow-up F-03 F9

- Source: `context/archive/2026-10-01-synthetic-santander-fixture/follow-ups/review-fixes.md` § F9, Trigger S-10.
- The defects in `scripts/fixture-santander-shape.mjs`:
  - `same(a, b)` compares distributions key by key with `TOLERANCE_PP` (5). A variant present on one side only, at
    under 5%, prints as "=".
  - `shape` counts `'"" occurrences'` as an absolute `text.match(/""/g)`. That also counts empty quoted fields.
  - `shape` splits on `"\n"`, so a CRLF file would differ on many metrics from one cause.
- The fix, as proposed in F9:
  1. A one-sided key is a difference.
  2. Keep the tolerance for shares.
  3. Count `""` inside parsed quoted values, as a share of lines.
  4. Split on `/\r?\n/`.
  - Plus the R1 metric above.
- After the fix, re-run `npm run fixture:shape:santander -- <symlink dir>` with the sandbox off. The output is
  aggregate-only.
- Baseline today, before the fix: "No structural differences" for PLN and USD.

## Code References

- `src/lib/import/ing.ts`
  - `parseIngStatement`, `buildImportPayload`: the ING reader and the payload builder.
  - `parseLine`, `looksLikeUtf8`, `toMinor`: private; the strict bare-field quote check and the cp1250 guard.
- `src/lib/import/schema.ts`
  - `importTransactionSchema`, `importPayloadSchema`: the `bankTxId` regex, the period refines, `TEXT_MAX`,
    `MAX_DEBITS`.
- `src/pages/api/imports.ts`
  - `POST`: the demo guard (`demoImportAllowed`), `rpc("import_ing_statement")`, the 23P01 → overlap mapping.
- `src/components/imports/ImportWizard.tsx`
  - `readStatement`, `Loaded`, `FileError`, the `setStep` flow, the overlap filter over `existing`.
- `src/pages/imports/new.astro`, `index.astro`, `result.astro`: labels, `existing`, `account_name` selects.
- `src/content/copy.ts` `copyExtra.imports`: `formatRecognised`, `bankName`, `accountLabel`.
- `design/rytm-os/react-kit/docs/content.json`: `importFlow.supported`, `importErrors.unknownFormat`,
  `importErrors.wrongCurrency`.
- `src/lib/patterns/merchant.ts` `rawMerchant`, `merchantKey`, `OPERATORS`; `src/lib/patterns/load.ts`
  `loadTransactionRows`; `src/lib/patterns/derive.ts` `derivePatterns`.
- `supabase/migrations/20260923165530_domain_imports_transactions.sql`
  - `imports_source_check`, `imports_no_overlap`, `transactions_bank_tx_key`.
- `supabase/migrations/20260924224014_import_ing_statement.sql`: `import_ing_statement` and its grants.
- `supabase/tests/database/domain_rls.test.sql`, `import_rpc.test.sql`, `import_delete.test.sql`
- `scripts/smoke.mjs` `importPayload`, `importPayloadJune`
- `scripts/fixture-santander-check.mjs`: `parseLine`, `CARD`, `rawMerchantOf`, `check`.
- `scripts/fixture-santander-shape.mjs`: `same`, `shape`.
- `test/unit/ing-parser.test.ts`: the pattern for a fixture-driven `santander-parser.test.ts`.
- `test/fixtures/santander/expected.json`: per-row `rawMerchant`, `occurredOn`, `imported`.

## Architecture Insights

- Import is **client-parsed, server-validated**. The browser reader builds a JSON payload, the endpoint re-validates it
  with zod, and one security-invoker RPC writes the import and its transactions atomically under RLS.
  - A second bank adds a reader plus a `source` dimension.
  - The DB-side guarantees (no overlap per account, positive amounts, period containment) are bank-agnostic already.
- Pattern derivation is read-time from `counterparty` and `title`, with no stored merchant column. The importer
  therefore owns "what the merchant is" via `counterparty`. This is the contract S-11 will build on.
- The CLAUDE.md expand → deploy → contract rule shapes the RPC choice. A new function name is the only change that
  leaves both the old and new code working on one schema.

## Historical Context (from prior changes)

- `context/archive/2026-09-24-ing-csv-import/`: the worked example; the client-parse/RPC split, smoke import steps and
  fixture-driven tests originate there.
  - Its F8 (DB text-length checks) is not triggered here, because `TEXT_MAX` already bounds the fields and the real
    Santander fields are ≤ 95 characters.
- `context/archive/2026-10-01-synthetic-santander-fixture/`: F-03 produced the fixture, the check script and the
  shape comparator.
  - Its F9 is triggered for S-10.
  - Its O1 (`fixture-ing-shape.mjs` path guard) is not triggered.
- PRD FR-005 clarification (2026-09-24, S-01): overlap is per account number via `imports_no_overlap`. This is still
  accurate, and it is bank-agnostic.

## Related Research

- `context/archive/2026-09-24-ing-csv-import/research.md`: the ING import precedent.
- `context/foundation/import-formats.md` § Santander, § Wykrywanie formatu: the format contract.

## Open Questions

Decisions for `/10x-plan`. None blocks it.

1. **Payload `source` default.** Should a missing `source` default to `"ing"` (stale tabs during deploy)? Recommended:
   yes.
2. **Santander `accountName` wording**, part of K26: a neutral label plus the tail mask. Never header col 3.
3. **Reader structure.** A normalised `Statement` union, or a bank-tagged wrapper around the two readers. This affects
   how much of `ImportWizard.tsx` changes.
4. **Balance invariants.** Should the reader also check opening + Σ = closing (as `check` does), or only rule 3 (row
   count)? Recommended: rule 3 plus the period check. The balance check is extra strictness that the import rules do
   not require.
5. **PGRST203 ambiguity for option B.** Inferred from PostgREST semantics, not tested. Moot if option A is chosen.
