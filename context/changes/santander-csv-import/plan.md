# Santander CSV import (S-10) — Implementation Plan

## Overview

The user uploads a Santander Bank Polska PLN CSV on `/imports/new`. The wizard recognises the format by itself,
goes through the same three steps as ING, and saves the debits through a new source-aware RPC. The list and the result
screen name the bank. A file in another currency is rejected with the existing message. A range that overlaps an
existing import of the same account is rejected, as for ING (FR-005). Credits and refunds are skipped (D2). The stored
`counterparty` is the rule-5 raw merchant, so the rows reach the patterns (FR-018, "na tych samych zasadach co ING").
The ING path keeps working byte-for-byte during the deploy window, and the ING smoke steps stay unchanged.

## Current State Analysis

Source: `research.md` (Q1–Q7) and `change.md` (claims table). Anchors are symbols, not line numbers.

- **Database.** Santander is refused in exactly two places. `imports_source_check` is `CHECK (source = 'ing')`
  (`20260923165530_domain_imports_transactions.sql`), and `import_ing_statement` inserts a hard-coded `'ing'`
  (`20260924224014_import_ing_statement.sql`). `bank_tx_id` is nullable, with the partial unique index
  `transactions_bank_tx_key`. `imports_no_overlap` is bank-agnostic. A new `public` function gets EXECUTE for
  PUBLIC **and anon** by default (research probe), so the grants must be explicit.
- **Payload.** `src/lib/import/schema.ts` `importTransactionSchema.bankTxId` requires 18 digits, and the payload has
  no `source`. `src/pages/api/imports.ts` `POST` calls `rpc("import_ing_statement")` with five named arguments.
- **Reader.** `src/lib/import/ing.ts` holds the only reader. Its private `parseLine` throws on a quote in a bare field,
  so it cannot read Santander (trap ST15). `toMinor` and `isDate` are private and bank-agnostic. The dialect oracle is
  `scripts/fixture-santander-check.mjs` (`parseLine`, `CARD`, `rawMerchantOf`, `YMD`, `DMY`, `toMinor`). The fixture
  is `test/fixtures/santander/`: the main PLN file has 187 rows and 184 debits, sum 1342109, period
  2026-03-01..2026-08-31. The USD file is the currency-reject case. `expected.json` holds a per-row `rawMerchant`.
- **Wizard.** `src/components/imports/ImportWizard.tsx` `readStatement` calls only `parseIngStatement`.
  `Loaded.statement` is `IngStatement`. The flow always goes 1→2→3 and preselects `defaultAccountNumber`, so a
  one-account file needs no new UI.
- **Copy.** `src/content/copy.ts` `copyExtra.imports.{formatRecognised, bankName, accountLabel}` are ING literals.
  Kit `importFlow.supported` and `importErrors.unknownFormat` say "Santander wkrótce". `index.astro` and `result.astro`
  select `account_name` but not `source`.
- **Patterns.** `src/lib/patterns/merchant.ts` `rawMerchant(counterparty, title)` reads `counterparty`. Santander card
  rows have an empty col 3, so the reader must store the rule-5 merchant in `counterparty`.
- **R1 is closed.** On both real exports, 0 operation dates fall before the header start. The whole-file reject stays.
- **Follow-up F-03 F9** (`scripts/fixture-santander-shape.mjs` `same` / `shape`) has the trigger S-10.

## Desired End State

- The main Santander fixture imported through the wizard saves 184 transactions summing 1342109 grosze. The import
  carries `source = 'santander'` and `bank_tx_id` null. The list shows "Santander · Rachunek", and `/patterns` shows
  the card merchants by their rule-5 tail.
- The USD fixture → "Waluta inna niż PLN" in step 1. Re-importing the main file → the step-3 overlap block, and the
  server returns `?error=overlap` if it is bypassed. Any other file → "Nieznany format pliku. Obsługujemy: ING Bank
  Śląski i Santander Bank Polska."
- ING is unchanged. `import_ing_statement`, `import_rpc.test.sql` and the ING smoke steps have no diff. A payload
  without `source` (a stale tab) is still accepted as ING.
- Verify with `npm test`, `npx supabase test db`, `npm run smoke`, and the screenshots of every state.

### Key Discoveries:

- Option A (a new `import_statement(p_source, …)`) is the only shape that keeps the live five-argument call valid.
  A defaulted `p_source` on the old name creates a PostgREST-ambiguous overload (research Q2).
- `ImportWizard.tsx` already validates the built payload with `importPayloadSchema` before step 3 is ready
  (`payloadValid`). A conditional `bankTxId` therefore also protects the client.
- The `scripts/smoke.mjs` "signup after deletion is accepted again" → "signin re-created account" → "delete
  re-created account (cleanup)" block runs on a **fresh** account. Santander steps placed there cannot change any
  count or pattern that an existing ING step asserts.
- `new.astro` builds the wizard `labels`. Overriding `flow.supported` and `errors.unknownFormat` there with the
  `copyExtra` versions changes every use site, including the G27 stand-ins, with no wizard edit.

## What We're NOT Doing

- Card-tail normalisation (city or branch stripping, `MARKA *Marka App`, the `bankomat` pattern) and cross-bank
  merchant grouping. Both are S-11. The 34-pattern partition in `expected.json` is S-11's oracle, not ours.
- Retiring `import_ing_statement`. A later contract migration, in its own merge after deploy, may drop it.
- Persisting Lp, or any per-row Santander key (see Autonomous decisions, and `[human]` row 6.9).
- A balance-chain check (opening + Σ = closing) in the app reader. Rule 3 (row count) and the period check are the
  contract.
- Skipping step 2 for a one-account file. Santander on the public demo account (roadmap § Parked).
- Showing the account tail on the list. The kit list shows only `ING · <name>`.
- Editing `design/rytm-os/` (read-only), `scripts/fixture-ing*.mjs`, `test/fixtures/**`, `import_rpc.test.sql`,
  `import_delete.test.sql`, or any existing ING smoke step.
- Clamping out-of-period rows (R1). A Santander overlap reject fixture.

## Implementation Approach

Bottom-up, each phase green on its own:

1. Make the shape comparator trustworthy (F9 + R1 metric), since the reader treats the fixture as truth.
2. Widen the database (expand only).
3. Make the payload and endpoint source-aware and prove the write path through smoke with a hand-built Santander
   payload.
4. Add the pure Santander reader and the format detector, tested against `expected.json`.
5. Name the bank on the server-rendered list and result.
6. Wire the wizard to the detector, fill the K26 copy gaps, and sweep the seams.

The browser parses the file and the server re-validates, as for ING. The database stays the last line of defence:
RLS, `imports_no_overlap`, `amount_minor > 0`, and the period check in the RPC.

## Critical Implementation Details

**Deploy window.** The `deploy` job pushes the migration minutes before the new code. Old code calls
`import_ing_statement` with five keys and posts payloads without `source`. Both must keep working: the old function is
untouched, and `source` defaults to `"ing"` in the schema. After a `vercel rollback`, the old list would label a
Santander import "ING · Rachunek". That cosmetic risk is accepted.

**Detection order.** Santander is tried first with a strict UTF-8 decode (`TextDecoder("utf-8", { fatal: true })`)
plus rule 1 on line 1: 9 fields, col 0 `YYYY-MM-DD`, col 2 starts with `'`. Otherwise `parseIngStatement` runs
unchanged. A cp1250 ING file with Polish letters fails the strict decode. An ASCII-only ING file fails rule 1. A
Santander file re-saved as cp1250 falls through to ING and is rejected as `unknown-format`. Once rule 1 matches, a
later Santander failure is final (`unknown-format` / `wrong-currency`). It must never fall through to ING.

## Phase 1: Shape comparator fix (F-03 F9) and R1 metric

### Overview

Scripts only. The comparator stops hiding a variant that is present on one side only, and it measures R1. It is then
re-run against the real exports with aggregate output only.

### Changes Required:

#### 1. Comparator

**File**: `scripts/fixture-santander-shape.mjs`

**Intent**: Close F9 (`context/archive/2026-10-01-synthetic-santander-fixture/follow-ups/review-fixes.md` § F9), so
that a parser-breaking real-only variant cannot print as "=". Also add the R1 guard that research recommended.

**Contract**:
- `same(a, b)`: a distribution key present on one side only is a difference, whatever its share. `TOLERANCE_PP` still
  applies to keys present on both sides.
- `shape`: split lines on `/\r?\n/`, since CR is already reported separately. Count `""` only inside parsed quoted
  values, as a share of lines (replacing the absolute `text.match(/""/g)` count).
- New metrics: "operation date before header start: share" and "booking date before header start: share", both
  computed from the parsed header col 1 and data-row col 1 / col 0.
- The privacy rules are unchanged: side labels by position, no file names, no values.

### Success Criteria:

#### Automated Verification:

- `npm run fixture:shape:santander -- <scratch dir with a copy of the fixture PLN CSV renamed historia_2026-01-01_<26 digits>.csv>` exits 0, prints the two R1 metrics, and its output matches neither `\d{26}` nor `historia_`
- One-sided variant: a scratch copy of the fixture with one data row altered into a quoting signature or col-4 mask absent from the fixture (under 5% of rows) is reported as a difference
- Deliberate break: restore the old key-by-key tolerance in `same` → the one-sided variant prints "=" again (red); restore → reported (meta-check: proves the new rule, not the tolerance, catches it)
- `npm run fixture:check` OK (ing + santander), and `git diff --exit-code main -- scripts/fixture-ing-shape.mjs test/fixtures`
- Full local gate vs baseline (contract): lint 0 errors, astro check 0 errors, fixture:check OK, vitest Δ0, build OK, pgTAP Δ0, smoke Δ0

#### Manual Verification:

- [reviewer] `npm run fixture:shape:santander -- <symlink dir from the run contract>` (sandbox disabled): output is aggregates only. The R1 shares are 0 for both real files. Every reported difference is explained in the handoff, or it is a real-only variant that Phase 4 handles (otherwise STOP: the reader contract changes)

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 2: Database — widened source and `import_statement` RPC

### Overview

One expand-only migration plus its pgTAP proof and regenerated types. The endpoint still calls `import_ing_statement`
in this phase.

### Changes Required:

#### 1. Migration

**File**: `supabase/migrations/20261002120000_import_statement_source.sql` (any timestamp after
`20260928120000`, in the required format)

**Intent**: Let the database record a Santander import without touching anything the production code calls.

**Contract**:
- `alter table public.imports drop constraint imports_source_check, add constraint imports_source_check check (source
  in ('ing', 'santander'))`.
- `create function public.import_statement(p_source text, p_account_number text, p_account_name text, p_period_start
  date, p_period_end date, p_transactions jsonb) returns uuid`, `language plpgsql security invoker set search_path =
  ''`. Its body is `import_ing_statement`'s body: the same 22023 validations, with error texts naming
  `import_statement`. The only difference is `insert … values (p_source, …)`. An unknown source is rejected by the
  check (23514).
- `comment on function`, then `revoke execute … from public, anon` and `grant execute … to authenticated`.
- `import_ing_statement` is not mentioned in this file.
- `user_id` is never a parameter and never read from `p_transactions`: both insert column lists stay exactly as in
  `import_ing_statement` (no `user_id`), so `user_id` comes only from the column default `auth.uid()` and the
  `with check` RLS policies (security invoker, never definer).
- The header states: expand only, the old function stays for the deploy window, a later contract migration may drop
  it, no new table (so no new RLS policies), and the user_id cascade is unchanged.

#### 2. pgTAP

**File**: `supabase/tests/database/import_statement.test.sql` (new), `supabase/tests/database/domain_rls.test.sql`

**Intent**: Prove the new write path and the widened check. `import_rpc.test.sql` stays byte-identical as the ING
regression.

**Contract**:
- New file, following `import_rpc.test.sql`'s fixtures and role switching:
  - `import_statement('santander', …)` returns a uuid, records `source = 'santander'`, and stores all-null
    `bank_tx_id`.
  - Two Santander imports of one account in disjoint ranges are both accepted (no 23505 from null ids).
  - An overlapping range → 23P01, with no rows added.
  - An out-of-period `occurred_on` → 22023, with no `imports` row.
  - `import_statement('ing', …)` records `'ing'`.
  - An unknown source → 23514.
  - `anon` → 42501.
  - `has_function_privilege('anon', …)` is false.
  - User B does not see user A's Santander import.
  - An element of `p_transactions` carrying a `user_id` key of user B still lands under the caller (user A).
- `domain_rls.test.sql`: `plan(28)` grows by the new asserts. A direct insert with `source 'santander'` is accepted,
  and one with `'mbank'` → 23514.

#### 3. Types

**File**: `src/db/database.types.ts` (generated)

**Intent**: Run `npm run db:types` so `Functions.import_statement` exists. Never hand-edit the file.

### Success Criteria:

#### Automated Verification:

- `npx supabase db reset` applies the migration; `npx supabase test db` passes with the new file (pgTAP baseline + new asserts, Result: PASS)
- `npm run db:types && grep -q import_statement src/db/database.types.ts`
- ING path untouched: `git diff --exit-code main -- supabase/migrations/20260924224014_import_ing_statement.sql supabase/tests/database/import_rpc.test.sql supabase/tests/database/import_delete.test.sql`
- Deliberate break 1: the new function inserts a literal `'ing'` → the "records source santander" assert goes red; restore → green
- Deliberate break 2: drop the `revoke … from public, anon` line → the anon asserts go red; restore → green (meta-check: proves the explicit revoke matters, because a new function is executable by anon by default)
- Full local gate vs baseline: lint 0 errors, astro check 0 errors, fixture:check OK, vitest Δ0, build OK, pgTAP baseline + delta PASS, smoke Δ0 (the endpoint still calls the old RPC)

#### Manual Verification:

- [reviewer] The migration is expand-only and backward-compatible with production. The header and function comment name the deploy window, the grants, and the per-account FR-005 rule

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 3: Source-aware payload and endpoint

### Overview

The payload carries the bank. The endpoint writes through `import_statement`. Smoke proves the Santander write path
with a hand-built payload on a fresh account.

### Changes Required:

#### 1. Bank list and payload schema

**File**: `src/lib/import/banks.ts` (new), `src/lib/import/schema.ts`

**Intent**: Give the app one source of the supported banks, and validate a bank-specific transaction id.

**Contract**:
- `banks.ts`:
  - `export const BANK_SOURCES = ["ing", "santander"] as const`
  - `export type BankSource`
  - `isBankSource(value: string): value is BankSource`
- `schema.ts`:
  - `importPayloadSchema` gains `source: z.enum(BANK_SOURCES).default("ing")`. A stale tab without `source` is ING.
  - `bankTxId` becomes `z.string().regex(/^\d{18}$/).nullable()`.
  - A refine: when `source` is `ing`, every `bankTxId` is non-null; when it is `santander`, every one is null.
- `ImportPayload` stays the inferred output type, so `source` is required on output. The header comment names
  `import_statement`.

#### 2. ING payload builder

**File**: `src/lib/import/ing.ts`

**Intent**: `buildImportPayload` sets `source: "ing"`. Nothing else in the ING reader changes.

**Contract**: The return value gains `source: "ing"`. If `test/unit/ing-parser.test.ts` deep-compares the payload,
only that expectation gains the field.

#### 3. Endpoint

**File**: `src/pages/api/imports.ts`

**Intent**: Call `import_statement` with `p_source`. Keep every redirect and error mapping as they are.

**Contract**: `rpc("import_statement", { p_source: p.source, …the same five keys })`. The header comment says ING or
Santander. 23P01 → overlap, the demo guard, and the `?error=` codes are unchanged.

#### 4. Tests

**File**: `test/unit/schema.test.ts`

**Contract**: New cases:
- A Santander payload with null ids passes.
- A Santander payload with an 18-digit id fails.
- An ING payload with a null id fails.
- A payload without `source` parses as `ing`.
- An unknown source fails.

#### 5. Smoke

**File**: `scripts/smoke.mjs`

**Intent**: Prove the new path end to end without touching any ING step.

**Contract**:
- A `santanderPayload` constant with `source: "santander"`, an invented 26-digit account, `accountName: "Rachunek"`
  (what the wizard sends, `copyExtra.imports.santanderAccountName` from Phase 5; Phase 5's list step asserts
  `>Santander · Rachunek<` on it), 2 debits, `bankTxId: null`, and a distinctive `counterparty`.
- New steps, inserted after "signin re-created account" and before "delete re-created account (cleanup)":
  - The Santander import is saved → 302 `/imports/result?id=`.
  - Its result renders "Dodaliśmy 2 obciążenia."
  - `/patterns` lists the Santander merchant, matched on the rendered node.
  - The same payload again → 302 `/imports/new?error=overlap&from=`.
  - A Santander payload with an 18-digit `bankTxId` → `/imports/new?error=invalid`.
- No existing step is edited.

### Success Criteria:

#### Automated Verification:

- `npm test`: vitest baseline + the new schema cases, 0 failed
- Smoke against `astro dev` on :4398: baseline + 5 PASS, 0 FAIL; `git diff main -- scripts/smoke.mjs` shows only added lines
- Deliberate break: the endpoint passes `p_source: "mbank"` instead of `p.source` → 23514 → `error=failed` → "santander import is saved" goes red; restore → green (meta-check: reverting to `import_ing_statement` would NOT go red — it accepts null `bank_tx_id` — so this break proves only that `p_source` reaches the database; the stored `santander` value is proven by pgTAP 2.1 and by the Phase 5 list step)
- Deliberate break: remove the source refine in `schema.ts` → the "ING with null id" unit case goes red; restore → green
- Full local gate vs baseline: lint, astro check, fixture:check, vitest (+ delta), build, pgTAP (Phase 2 count), smoke (+5)

#### Manual Verification:

- [reviewer] Every existing ING smoke step is byte-identical, and the stale-tab default (`source` missing → `ing`) is covered by those unchanged ING steps, which post no `source`

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 4: Santander reader and format detection

### Overview

Pure modules, no Node imports, tested against `test/fixtures/santander/expected.json`. They are not yet wired into the
wizard.

### Changes Required:

#### 1. Shared helpers

**File**: `src/lib/import/common.ts` (new), `src/lib/import/ing.ts`

**Intent**: One copy of the bank-agnostic pieces. `ing.ts` imports them, and its behaviour is unchanged.

**Contract**:
- `toMinor(amount)` and `isDate(iso)` move here from `ing.ts`.
- `export type ParseError = "unknown-format" | "wrong-currency"`.
- `export interface StatementAccount { name; number; rows; debits; credits }`.
- `IngAccount` and `IngParseError` become aliases of these, so existing imports keep compiling.

#### 2. Santander reader

**File**: `src/lib/import/santander.ts` (new)

**Intent**: Implement Santander rules 1–6 from `context/foundation/import-formats.md`. The dialect is ported from
`scripts/fixture-santander-check.mjs` `parseLine`: `"` opens a field only at its start, a bare field may contain `"`
(ST15), and `""` or a stray quote inside a quoted field is an error.

**Contract**:
- `parseSantanderStatement(bytes: Uint8Array, opts: { accountName: string }): { ok: true; statement:
  SantanderStatement } | { ok: false; error: ParseError }`.
- `SantanderStatement = { accounts: [StatementAccount]; defaultAccountNumber; period: { start, end }; rows: { account,
  occurredOn, amountMinor /* signed */, counterparty, title, details }[] }`.
- `unknown-format` when any of these holds:
  - The bytes are not strict UTF-8.
  - Line 1 fails rule 1.
  - Any line is not 9 fields, or col 8 is not empty.
  - Header col 0 is not a valid `YYYY-MM-DD`, or col 1 is not a valid `DD-MM-YYYY`.
  - Col 2 is not `'` plus 26 grouped digits.
  - Col 7 is not an integer equal to the number of data rows (rule 3).
  - Any data-row date is invalid, or an amount fails `-?\d+,\d{2}`.
  - Any operation date (col 1) falls outside [header col 1, header col 0] (D7, R1).
  - The header start is after the export date.
- `wrong-currency` when the header col 4 is not `PLN` (rule 2). This is checked only once the structure holds, as in
  ING.
- Mapping:
  - `account` = the 26 digits.
  - `occurredOn` = col 1, as ISO.
  - `counterparty` = the rule-5 raw merchant (`CARD` tail, else col 3, else col 2, whitespace collapsed).
  - `title` = col 2, trimmed.
  - `details` = `""`.
  - The single account's `name` = `opts.accountName`. The reader never reads the owner name in header col 3.
- `buildSantanderPayload(statement, accountNumber): ImportPayload`: `source: "santander"`, debits only (D2), as
  absolute amounts in file order, `bankTxId: null`, period from the header.

#### 3. Format detector

**File**: `src/lib/import/detect.ts` (new)

**Intent**: One entry point for the wizard. It applies the detection order from Critical Implementation Details.

**Contract**:
- `detectStatement(bytes, opts: { santanderAccountName: string }): { ok: true; bank: BankSource; statement: { accounts:
  StatementAccount[]; defaultAccountNumber; period } } | { ok: false; error: ParseError }`.
- `buildPayload(detected, accountNumber): ImportPayload` dispatches to `buildImportPayload` or
  `buildSantanderPayload`.

#### 4. Unit tests

**File**: `test/unit/santander-parser.test.ts`, `test/unit/detect.test.ts` (new)

**Contract**:
- Main file, against `expected.json`:
  - ok.
  - The account equals `files[…].account`.
  - The period is 2026-03-01..2026-08-31.
  - 187 rows, 184 debits, 3 credits.
  - The payload has 184 transactions summing 1342109, `source: "santander"`, and every `bankTxId` null.
  - Per imported row in file order: `occurredOn`, `|amountMinor|`, and `counterparty === rawMerchant`.
  - The payload passes `importPayloadSchema`.
- The ST15 row (a bare field containing `"`) parses.
- The USD file → `wrong-currency`.
- These variants → `unknown-format`:
  - The main file without one data row.
  - One operation date moved before the header start (R1).
  - A `""` inside a quoted field.
  - The ING main fixture's bytes.
  - The main file re-encoded to windows-1250.
- Detection:
  - The ING main fixture → `ing`.
  - The Santander main → `santander`.
  - The Santander USD → `wrong-currency`, not `unknown-format`.
  - Empty and random bytes → `unknown-format`.

### Success Criteria:

#### Automated Verification:

- `npm test`: vitest baseline (after Phase 3) + new parser and detector cases, 0 failed; `test/unit/ing-parser.test.ts` passes unchanged except for Phase 3's `source` field
- The new modules import no Node module: `grep -L "from \"node:" src/lib/import/{common,santander,detect}.ts` lists all three
- Deliberate break 1: `rawMerchant` prefers col 3 over the `CARD` tail → the per-row `counterparty` test goes red; restore → green
- Deliberate break 2: the reader throws on a `"` inside a bare field → the ST15 case goes red; restore → green (meta-check: the fixture really contains the ST15 shape, so the test proves the dialect, not a vacuous pass)
- Deliberate break 3: the detector tries ING first and falls through on any Santander error → the USD case returns `unknown-format` (red); restore → green
- Full local gate vs baseline: lint, astro check, fixture:check, vitest (+ delta), build, pgTAP, smoke (Phase 3 count)

#### Manual Verification:

- [reviewer] `santander.ts` matches `import-formats.md` rules 1–6 and the oracle `parseLine`/`rawMerchantOf`. No value from the real exports appears in tests or code

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 5: Bank name on the imports list and the result

### Overview

Two server-rendered pages read `source` and render a per-bank account label. The per-bank copy keys start here
(DESIGN-GAP K26).

### Changes Required:

#### 1. Copy

**File**: `src/content/copy.ts`

**Intent**: Per-bank account label and the neutral Santander account name. Never header col 3.

**Contract**:
- `copyExtra.imports.accountLabel` becomes `{ ing: "ING · {name}", santander: "Santander · {name}" }`.
- New key `santanderAccountName: "Rachunek"`, the kit's own word for the column.
- `// DESIGN-GAP: K26` comments on both.
- The wizard's single use of `accountLabel` becomes `accountLabel.ing`, so ING renders the same. Phase 6 makes it
  per-bank.

#### 2. Label helper

**File**: `src/lib/import/banks.ts`

**Contract**: `accountLabel(templates: Record<BankSource, string>, source: string, name: string): string` fills
`{name}`. An unknown source falls back to `ing`, so a row can never crash the list. Unit test in
`test/unit/banks.test.ts`.

#### 3. Pages

**File**: `src/pages/imports/index.astro`, `src/pages/imports/result.astro`

**Intent**: Select `source` beside `account_name`, and render `accountLabel(x.accountLabel, source, account_name)`.

### Success Criteria:

#### Automated Verification:

- `npm test`: + `banks.test.ts` cases (ing, santander, unknown → ing), 0 failed
- Smoke: two new steps in the fresh-account Santander block — `/imports` contains `>Santander · Rachunek<` (rendered node) and the Santander result page contains `Santander · Rachunek`; baseline + 7 PASS total vs the contract baseline, 0 FAIL
- Deliberate break: the list ignores `source` (always `ing`) → the list step goes red; restore → green (meta-check: the step asserts the rendered cell, not serialized props — the page has no island holding the label)
- `grep -n "DESIGN-GAP: K26" src/content/copy.ts` finds the comments
- Full local gate vs baseline: lint, astro check, fixture:check, vitest (+ delta), build, pgTAP, smoke (+7)

#### Manual Verification:

- [visual] Screenshots at 1280 px and ~400 px: the list with one ING and one Santander row; the Santander result screen; the ING result screen (regression) — compared with kit `imports.html` / `imports-result.html`, no horizontal scroll, colours from tokens only

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 6: Wizard wiring, kit gaps and seam sweep

### Overview

The wizard reads the file through `detectStatement` and shows the bank in steps 1–3. The K26 copy and register are
completed. The last phase sweeps every seam the slice left behind.

### Changes Required:

#### 1. Copy

**File**: `src/content/copy.ts`

**Contract**: All entries under `// DESIGN-GAP: K26`.
- `formatRecognised` becomes `{ ing: "rozpoznano format ING", santander: "rozpoznano format Santander" }`.
- `bankName` becomes `{ ing: "ING Bank Śląski", santander: "Santander Bank Polska" }`.
- New `supported`: "Obsługujemy wyciągi ING Bank Śląski i Santander Bank Polska w PLN."
- New `unknownFormat`: "Nieznany format pliku. Obsługujemy: ING Bank Śląski i Santander Bank Polska."

#### 2. Page

**File**: `src/pages/imports/new.astro`

**Intent**: Pass `flow.supported = x.supported` and `errors = { …copy.importErrors, unknownFormat: x.unknownFormat }`.
Every unknown-format use, including the G27 stand-ins, then names both banks, and the kit JSON is not edited.

#### 3. Wizard

**File**: `src/components/imports/ImportWizard.tsx`

**Intent**: Replace the ING-only reading with the detector and keep the flow 1→2→3 unchanged.

**Contract**:
- `readStatement` becomes a thin wrapper over `readImportFile(bytes, { santanderAccountName:
  x.santanderAccountName })` (change 4 below). It keeps its `file.size > MAX_FILE_BYTES` check (and the G27
  comment) **before** `file.arrayBuffer()`, so an oversized file is never read into memory; `readImportFile`
  repeats the check on `bytes.length` only so it can be unit-tested.
- `Loaded` holds the detected result, including `bank`.
- The payload comes from `buildPayload`.
- Step 1 chip shows `x.formatRecognised[bank]`. Step 2 `<small>` shows `x.bankName[bank]`. Step 3 account value shows
  `accountLabel(x.accountLabel, bank, name) · formatAccountTail(number)`.
- The overlap check, the `payloadValid` gate, the submit lock and the server-error mapping are unchanged.
- The header comment mentions both banks.

#### 4. Testable file classification

**File**: `src/lib/import/detect.ts`, `test/unit/detect.test.ts`

**Intent**: Move the wizard's file-level decisions out of the component so they are unit-tested (the wizard has no
component tests).

**Contract**: `readImportFile(bytes: Uint8Array, opts: { santanderAccountName }): { detected } | { error:
"unknownFormat" | "wrongCurrency" | "empty" }` — `bytes.length > MAX_FILE_BYTES` → `unknownFormat` (G27),
`detectStatement` errors mapped as today, no debits on any account → `empty`. Tests: Santander main → `detected.bank
=== "santander"`; ING main → `ing`; USD → `wrongCurrency`; oversized buffer → `unknownFormat`; a Santander file whose
rows are all credits → `empty`.

#### 5. Kit gap register

**File**: `context/foundation/design-kit.md`

**Contract**:
- Row **K26**, `placeholder`. The kit announces Santander as "wkrótce" (`importFlow.supported`,
  `importErrors.unknownFormat`, app.js `importsNew()`), and its import views show ING only. The app adds both-bank
  `supported` / `unknownFormat`, per-bank `formatRecognised` / `bankName` / `accountLabel`, and the neutral Santander
  account name "Rachunek" (no account name in the export; the owner's name is never stored).
- An entry under "Do rundy 3". No G-row: the wizard already handles a one-account file.

#### 6. Seam sweep

**File**: everything touched in Phases 1–6, plus `context/foundation/import-formats.md`, `CLAUDE.md`

**Intent**: Leave no seam for S-11 to trip over.

**Contract**:
- No duplicated `toMinor`, `isDate` or line reader between `ing.ts` and `santander.ts`. The app reader and the
  oracle script are deliberate independent copies, and a header comment says so.
- No stale "ING only" wording in the comments of `api/imports.ts`, `schema.ts`, `ImportWizard.tsx` or `new.astro`.
- The `import_ing_statement` mention in `schema.ts` points to `import_statement`.
- No unused copy keys (the old string forms are gone).
- K26 is in both the register and the code.
- `import-formats.md`:
  - "Wykrywanie formatu" names both banks in the reject line.
  - Rule 7 notes that S-10 stores no Lp and `bank_tx_id` is null (FR-005 rejects ranges).
- `CLAUDE.md` `npm test` line mentions the Santander parser and detector.
- No `TODO` is left.

### Success Criteria:

#### Automated Verification:

- `npm test` (Phase 5 count + `readImportFile` cases, 0 failed); smoke (+7, 0 FAIL)
- `grep -rn "DESIGN-GAP: K26" src` ≥ 2 hits and a `K26` row in `context/foundation/design-kit.md`
- Seam sweep: `grep -n "function toMinor\|function isDate\|function parseLine" src/lib/import/*.ts` shows each helper once in `common.ts` (and `parseLine` once per dialect); `grep -rn "import_ing_statement" src --include=*.ts --include=*.tsx --include=*.astro` only in `database.types.ts`; `grep -rn "accountLabel.replace(" src` finds nothing (all labels go through the helper)
- Deliberate break: `readImportFile` calls `parseIngStatement` instead of `detectStatement` → the "Santander main → santander" case goes red; restore → green (meta-check: proves the classification the wizard uses, not the wizard's rendering — that is the 6.6 screenshots)
- Full local gate vs baseline: lint 0 errors, astro check 0 errors, fixture:check OK, vitest (+ delta), build OK, pgTAP (+ delta) PASS, smoke (+7) 0 FAIL

#### Manual Verification:

- [visual] Screenshots at 1280 px and ~400 px of every wizard state: step 1 empty (both-bank `supported` line); step 1 Santander main file ready ("rozpoznano format Santander"); step 1 ING main file ready ("rozpoznano format ING", regression); step 1 unknown format (both-bank message); step 1 USD file (wrong currency); step 2 Santander (one account preselected, "Santander Bank Polska · 187 transakcji"); step 3 Santander ready ("Santander · Rachunek · •• 3334", 184 debits, 3 skipped); step 3 Santander overlap after one import; result after the Santander import ("Dodaliśmy 184 obciążenia."); the list with both banks — compared with the kit views, no horizontal scroll, tokens only
- [reviewer] A full Santander import through the wizard on the local test account: `/patterns` shows the card merchants by their rule-5 tails (city included — S-11 normalises), and the ING flow on the same account still imports and deletes
- [human] Product owner imports their own real Santander PLN export locally (never committed, never shared) and confirms the debit count and range match the bank's statement
- [human] Accept the deviation from `import-formats.md` rule 7: Lp is not stored and Santander rows have no per-row key (decision 4)
- [human] Accept the K26 wording, including the generic "Rachunek" as the Santander account name (two Santander accounts would be told apart only by range on the list) (decision 5)
- [human] Accept that S-11 re-keys Santander card patterns: a threshold or decision saved on a raw-tail Santander pattern between S-10 and S-11 is orphaned by S-11's normaliser unless S-11 migrates keys (`change.md` decision 4)

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Testing Strategy

### Unit Tests:

- Santander reader against `expected.json`: counts, sum, period, per-row date, amount and raw merchant, ST15, R1
  reject, row-count reject, `""` reject, cp1250 and ING bytes reject, USD → wrong currency.
- Detector: both fixtures, USD, garbage, and the fall-through rule.
- Schema: `source` default, per-bank `bankTxId`. Bank label helper.
- ING parser tests stay green, with only the `source` field added to the payload expectation.

### Integration Tests:

- pgTAP: `import_statement` (source, null ids, disjoint re-import, overlap, period, grants, isolation), the widened
  check, and the ING RPC file unchanged.
- Smoke: the Santander write, result, patterns, overlap, invalid and list steps on a fresh account. The ING steps are
  unchanged.

### Manual Testing Steps:

1. On `/imports/new`, upload the Santander main fixture, go through steps 1→2→3, and import. Check the result (184)
   and the list ("Santander · Rachunek").
2. Upload it again. Step 3 blocks with the existing range.
3. Upload the USD fixture → wrong currency. Upload an image → unknown format with both banks named.
4. Upload the ING main fixture. Its flow is unchanged, and the chip reads "rozpoznano format ING".
5. Take screenshots of every state at 1280 px and ~400 px.

## Performance Considerations

The reader runs in the browser on ~190 rows (real exports ~480). The strict UTF-8 decode runs once before the ING
attempt, which is negligible. The payload stays far below `MAX_DEBITS` and the 4.5 MB body limit.

## Migration Notes

There is one expand-only migration, `20261002120000_import_statement_source.sql`: a widened check plus a new
function. The CI `deploy` job applies it, never by hand. Old code works on the new schema. A contract migration
dropping `import_ing_statement` belongs to a later slice, once no deployed code calls it. Rollback: the app can be
rolled back freely. Santander rows already written stay valid. An old deploy would label them "ING · Rachunek".

## Autonomous decisions

These are recorded in place of the skill's user questions (no human in the loop, run contract rule 1).

| # | Decision | Chosen | Rejected | Why | What would change it |
| --- | --- | --- | --- | --- | --- |
| 1 | Complexity / questions | MEDIUM, 0 questions | Interview | Research answered every solution choice with a recommendation | A product owner available |
| 2 | Write path | New `import_statement(p_source, …)` (option A), old function untouched, explicit revoke | Defaulted `p_source` on `import_ing_statement` (option B) | Only A keeps the live five-key call unambiguous in the deploy window | A local HTTP proof that B resolves without PGRST203 |
| 3 | Payload `source` | `z.enum(BANK_SOURCES).default("ing")` + per-bank `bankTxId` refine | Required `source` | A stale tab during deploy posts no `source`; it must not get `error=invalid` | The contract migration retiring ING-only code |
| 4 | Lp / row key | Not stored; `bank_tx_id` null. **Deviates from `import-formats.md` rule 7's wording** → `[human]` 6.9 | Lp in `bank_tx_id`; a new `lp` column | Lp restarts per export and `transactions_bank_tx_key` spans imports (23505); nothing reads it; FR-005 rejects ranges | A feature needing per-row identity |
| 5 | Santander account name (R2) | Stored `account_name` = `copyExtra.imports.santanderAccountName` "Rachunek", injected into the pure reader via options; label "Santander · Rachunek"; tail only in wizard steps 2–3 | Header col 3 (owner's name); "Rachunek •• NNNN" stored (duplicates the tail in steps 2–3); tail on the list (kit list has none) | Privacy NFR; no invented UI; one label rule for both banks. `[human]` 6.10 | A user with two Santander PLN accounts, or the kit author adding a Santander row |
| 6 | Reader structure (research Q3) | Two bank readers + `detect.ts` returning `{bank, statement}` with a shared `StatementAccount`; `buildPayload` dispatch | One merged reader; a fully normalised row type | Smallest wizard change; ING reader stays as-is | S-11 needing bank-specific rows in the wizard |
| 7 | Balance check (research Q4) | Rule 3 (row count) + period check only | Opening + Σ = closing | Not in the import rules; the oracle script already guards the fixture | A real export where row count passes but rows are missing |
| 8 | R1 | Whole-file reject on an out-of-period operation date; shape metric added | Clamp; booking date for the range | 0 violations on both real exports; D7 says the period comes from the header | The new metric reporting > 0 on a real export |
| 9 | `details` for Santander | `""` | Col 3 (duplicates `counterparty`); col 4 (counterparty account number) | Store the minimum; nothing reads `details` | A feature reading counterparty accounts |
| 10 | Detection order | Strict UTF-8 + rule 1 → Santander, else unchanged ING; a matched Santander file never falls through | ING first | ING reader stays untouched; a re-saved Santander file is rejected like a re-saved ING one | A bank whose line 1 also matches rule 1 |
| 11 | Step 2 for one account | Kept (preselected), no G-row | Skip step 2 | Wizard already handles one account; the kit has no skip state | The kit author adding a one-account state |
| 12 | F-03 F9 | Phase 1, before the reader | Defer to S-11 | The reader trusts the fixture; the comparator must not hide a real-only variant | Phase 1 showing no change in the real comparison (it still ships, as a fix) |
| 13 | Smoke placement | Santander steps in the fresh "re-created account" block; ING steps byte-identical | A separate user; mixing into the main account | No existing count or pattern assertion can shift; no extra signup | The re-created block being removed from smoke |
| 14 | Copy for `supported` / `unknownFormat` | `copyExtra` overrides injected in `new.astro` | Editing kit JSON; per-site overrides in the wizard | Kit is read-only; one injection point covers the G27 stand-ins | The kit author updating `content.json` (then delete the overrides) |
| 15 | PRD literal text | FR-018 met as written; no PRD deviation. The one contract deviation is rule 7 (row 4) | — | — | — |

## Known risks

- S-11 will normalise Santander card tails, which re-keys any threshold or decision a user saved on a Santander pattern
  in between (accepted in `change.md` decision 4).
- A future real export with a different filter bound (R1) is caught only by the Phase 1 shape metric, run by hand.
- After a `vercel rollback`, Santander imports would be labelled "ING · Rachunek" until roll-forward. This is cosmetic.
- Vercel previews share the production database (`context/deployment/deploy-plan.md`). From Phase 3 on, this
  branch's PR preview calls `import_statement`, which exists in production only after the merge's `deploy` job, so
  every import on the preview (ING included) ends in `?error=failed` until merge. Production is unaffected (the
  migration lands before the code). Verification of this slice is local only; do not read a failed preview import as
  a product bug, and do not "fix" it with a fallback to `import_ing_statement` (plan-review F2).
- Santander `title` keeps the bank's card description, including the masked card number (`<6>******<4>`); it is the
  user's own data under RLS, like ING titles, and is not rendered on the list (plan-review F6).

## References

- Research: `context/changes/santander-csv-import/research.md`. Identity: `change.md`
- ING analogue: `context/archive/2026-09-24-ing-csv-import/plan.md`
- Fixture analogue: `context/archive/2026-10-01-synthetic-santander-fixture/plan.md`, `follow-ups/review-fixes.md`
  § F9
- Format contract: `context/foundation/import-formats.md` § Santander (rules 1–7), § Wykrywanie formatu, D2, D7
- Oracle reader: `scripts/fixture-santander-check.mjs` (`parseLine`, `CARD`, `rawMerchantOf`)
- RPC precedent: `supabase/migrations/20260924224014_import_ing_statement.sql`
- Wizard: `src/components/imports/ImportWizard.tsx` (`readStatement`, `Loaded`, `payloadValid`)
- Kit: `design/rytm-os/react-kit/docs/content.json` (`importFlow.supported`, `importErrors`), `prototype/views/imports*.html`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Shape comparator fix (F-03 F9) and R1 metric

#### Automated

- [x] 1.1 Comparator on a renamed fixture copy exits 0, prints the R1 metrics, leaks no `\d{26}` / `historia_` — b7880c3
- [x] 1.2 A one-sided variant under 5% is reported as a difference — b7880c3
- [x] 1.3 Deliberate break: old `same` tolerance hides the variant (red); restored → reported — b7880c3
- [x] 1.4 `fixture:check` OK; ING shape script and fixtures unchanged vs `main` — b7880c3
- [x] 1.5 Full local gate vs baseline (Δ0) — b7880c3

#### Manual

- [ ] 1.6 [reviewer] Real-export comparison prints aggregates only; R1 shares 0; differences explained

### Phase 2: Database — widened source and `import_statement` RPC

#### Automated

- [x] 2.1 `db reset` applies the migration; `supabase test db` passes with `import_statement.test.sql` — b7f29e1
- [x] 2.2 `db:types` regenerated with `import_statement` — b7f29e1
- [x] 2.3 ING migration, `import_rpc.test.sql`, `import_delete.test.sql` unchanged vs `main` — b7f29e1
- [x] 2.4 Deliberate break 1: literal `'ing'` in the new function turns the source assert red; restored → green — b7f29e1
- [x] 2.5 Deliberate break 2: missing revoke turns the anon asserts red; restored → green — b7f29e1
- [x] 2.6 Full local gate vs baseline (pgTAP + delta, others Δ0) — b7f29e1

#### Manual

- [ ] 2.7 [reviewer] Migration is expand-only and backward-compatible; header and comment explain the deploy window and grants

### Phase 3: Source-aware payload and endpoint

#### Automated

- [x] 3.1 `npm test` baseline + schema cases, 0 failed — 2afa395
- [x] 3.2 Smoke baseline + 5 PASS, 0 FAIL; smoke diff is additions only — 2afa395
- [x] 3.3 Deliberate break: endpoint forwards a wrong `p_source` → Santander save step red; restored → green — 2afa395
- [x] 3.4 Deliberate break: removed source refine → "ING with null id" case red; restored → green — 2afa395
- [x] 3.5 Full local gate vs baseline — 2afa395

#### Manual

- [ ] 3.6 [reviewer] ING smoke steps byte-identical; stale-tab default covered by them

### Phase 4: Santander reader and format detection

#### Automated

- [x] 4.1 `npm test` + parser and detector cases, 0 failed; ING parser test unchanged except `source` — c339cfe
- [x] 4.2 New import modules have no Node imports — c339cfe
- [x] 4.3 Deliberate break 1: col 3 before the card tail turns the `counterparty` test red; restored → green — c339cfe
- [x] 4.4 Deliberate break 2: strict bare-field quote turns the ST15 case red; restored → green — c339cfe
- [x] 4.5 Deliberate break 3: ING-first fall-through turns the USD case red; restored → green — c339cfe
- [x] 4.6 Full local gate vs baseline — c339cfe

#### Manual

- [ ] 4.7 [reviewer] Reader matches rules 1–6 and the oracle; no real-export value in code or tests

### Phase 5: Bank name on the imports list and the result

#### Automated

- [x] 5.1 `npm test` + label helper cases, 0 failed — c186c67
- [x] 5.2 Smoke: list and result name Santander (baseline + 7 PASS, 0 FAIL) — c186c67
- [x] 5.3 Deliberate break: list ignores `source` → list step red; restored → green — c186c67
- [x] 5.4 `DESIGN-GAP: K26` comments present in `copy.ts` — c186c67
- [x] 5.5 Full local gate vs baseline — c186c67

#### Manual

- [ ] 5.6 [visual] List (ING + Santander rows), Santander result, ING result at 1280 px and ~400 px vs kit

### Phase 6: Wizard wiring, kit gaps and seam sweep

#### Automated

- [x] 6.1 `npm test` (+ `readImportFile` cases) and smoke (+7) green
- [x] 6.2 K26 in code (≥ 2 hits) and in `design-kit.md`
- [x] 6.3 Seam sweep greps: one helper copy, no live `import_ing_statement` call, no `accountLabel.replace(`
- [x] 6.4 Deliberate break: `readImportFile` bypasses the detector → Santander case red; restored → green
- [x] 6.5 Full local gate vs baseline

#### Manual

- [ ] 6.6 [visual] Every wizard state (step 1 empty / Santander ready / ING ready / unknown / USD; step 2 Santander; step 3 Santander ready / overlap; result; list) at 1280 px and ~400 px vs kit
- [ ] 6.7 [reviewer] Full Santander import locally: patterns show rule-5 tails; ING import and delete still work
- [ ] 6.8 [human] Owner imports their real Santander PLN export locally; count and range match the bank
- [ ] 6.9 [human] Accept the rule-7 deviation: Lp not stored, no per-row Santander key
- [ ] 6.10 [human] Accept the K26 wording, incl. "Rachunek" as the Santander account name
- [ ] 6.11 [human] Accept that S-11 re-keys Santander card patterns (thresholds/decisions saved in between are orphaned)
