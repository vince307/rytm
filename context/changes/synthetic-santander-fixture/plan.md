# Synthetic Santander fixture (F-03) — Implementation Plan

## Overview

The repo gains a deterministic, synthetic Santander Bank Polska CSV export (PLN account) that reproduces the real
export's **shape** and its traps, a small USD-account file for the currency-rejection path, a machine-readable answer
key (`expected.json`) and a generated README — all under `test/fixtures/santander/`, produced by one dependency-free
Node generator. The existing CI gate `npm run fixture:check` grows to cover both banks without a new CI step, a
local-only shape comparator guards against a fixture that is "too clean", and the Santander section of
`context/foundation/import-formats.md` is corrected to match the real export. S-10 (parser/import) and S-11 (card
merchants, cross-bank grouping) are then built and measured without a real statement in the repo (FR-018, NFR
„prywatność danych źródłowych”).

## Current State Analysis

- ING has the full pattern to copy (not to modify): `scripts/fixture-ing.mjs` (`generate()`, traps as data, seeded
  `mulberry32`, `OUT_DIR` hard-wired, generated README + `expected.json`), `scripts/fixture-ing-check.mjs` (`check()`
  exported, CLI guard `import.meta.url === pathToFileURL(process.argv[1]).href`, `FIXTURE_DIR` hard-wired to
  `test/fixtures/ing`, extra-file rule reads only that dir) and `scripts/fixture-ing-shape.mjs` (local-only, masks
  only, exit 0 without real files).
- `package.json`: `fixture:ing`, `fixture:check` (→ `fixture-ing-check.mjs`), `fixture:shape`. CI job `ci` runs
  `npm run fixture:check` once, after lint and before `npm test` (`.github/workflows/ci.yml`).
- Plumbing: `.gitignore` already lets `test/fixtures/**/*.csv` in; `.prettierignore` covers `test/fixtures/`;
  ESLint `scriptsConfig` lints `scripts/**/*.mjs`; `.gitattributes` has only `test/fixtures/ing/** -text`.
- ING oracle (`test/fixtures/ing/expected.json`) uses hand slugs as `pattern` keys; `test/unit/patterns.test.ts`
  compares grouping sets, not key text. The ING pattern `pizzeria-trzy-sery` exists there (`type: frequent`,
  `resolvedBy: normalization`, raw `PIZZERIA TRZY SERY UL. MAKOWA 9 KRAKÓW`, declared in `NOISE_POOL`).
- `src/lib/import/` has `ing.ts` only; nothing consumes a Santander fixture yet. No DB, UI or copy is involved.
- Real-export shape facts (aggregate scan, research.md § Real export) contradict or extend `import-formats.md` in six
  places: Lp order, header date formats + grouped account mask, col 6 quoting, card tail ASCII, `Wypłata BLIK` + the
  `:<11 digits>` suffix, free-title transfers, and recurring `Oplata za …` debits.

## Desired End State

- `test/fixtures/santander/` holds: the main PLN export `historia_2026-08-31_<invented 26 digits>.csv` (≈180 data
  rows, range 2026-03-01 → export date 2026-08-31, two cards, every trap ST01–ST14), the USD reject file
  (3 card rows), `expected.json`, `README.md` — every byte produced by `npm run fixture:santander`.
- `npm run fixture:check` runs both bank checks in one process, prints one OK/FAIL line per bank and exits non-zero
  if either fails; the CI step is byte-identical.
- `npm run fixture:shape:santander -- <dir>` (local only) compares fixture vs real export structure, printing masks
  and shares only — never values or file names.
- `import-formats.md` Santander section matches the real export; ING scripts and `test/fixtures/ing/` are unchanged.

Verify: `npm run fixture:santander && git diff --exit-code test/fixtures/santander`, `npm run fixture:check`,
`git diff --exit-code main -- scripts/fixture-ing.mjs scripts/fixture-ing-check.mjs scripts/fixture-ing-shape.mjs test/fixtures/ing .github/workflows/ci.yml`.

### Key Discoveries:

- `scripts/fixture-ing-check.mjs` `check()` is import-safe (CLI guard at file end) — an aggregator can await it.
- ING `rawMerchant`/`normalizeMerchant` (`src/lib/patterns/merchant.ts`) does not strip a trailing city or card mask
  and does not fold diacritics; real Santander card tails are pure ASCII — so the shared merchant must be ASCII.
- Santander has no transaction ID: manifest row key = `(file, lp)` (import-formats rule 7).
- The real Santander file name embeds the account number → the shape tool must never print file names
  (F-02 impl-review F1); an empty dir arg must not resolve to cwd (F-02 review F6); `.gitattributes` must cover the
  whole fixture dir (F-02 review F5); README facts must be generated, not hand-written (F-02 review F4).

## What We're NOT Doing

- Santander parser, format detection, `src/lib/import/schema.ts` / `imports.source` changes, UI, copy, kit gaps — S-10.
- Card-merchant normalization (card mask, city tail, `*` variants, cross-bank key) in `src/lib/patterns/` — S-11.
- Any change to `scripts/fixture-ing*.mjs`, `test/fixtures/ing/**` or ING `expected.json` (byte-exact; S-11 risk).
- A diacritic-bearing cross-bank merchant (would force S-11 to fold diacritics and re-key stored ING merchants).
- A Santander overlap reject file (S-10 proves `imports_no_overlap` by importing the main file twice).
- Demo seed / `supabase/seed.sql`, migrations, pgTAP, smoke changes; a new CI step; new npm dependencies.
- Copying any value (name, merchant, amount, date, account/card number) from the real exports — shapes only.

## Implementation Approach

Copy the ING architecture per bank instead of generalizing it: traps are data in `scripts/fixture-santander.mjs`; one
`generate()` run expands them into rows, adds seeded noise, orders the file "≈ newest first with inversions", numbers
Lp, computes balances, and builds CSV + `expected.json` + README together so the answer key cannot drift. A separate
`scripts/fixture-santander-check.mjs` compares bytes with `generate()` and then re-reads the files from disk with its
own reader to check the format contract and the manifest independently. A tiny `scripts/fixture-check.mjs` aggregates
both banks. The shape comparator imports the Santander check's reader.

## Critical Implementation Details

**Header invariants (plan review F2; each observed true on the real PLN and USD exports, booleans only).**
Header col 5 (opening) + Σ col 5 of all data rows == header col 6 (closing); Lp N's col 6 − Lp N's col 5 == opening;
Lp 1's booking date is the **unique** maximum (so it is chronologically last whatever the tie-break); the file name's
date == header col 0 and its 26 digits == header col 2 without `'` and spaces.

**Two date formats and two orders.** Header col 0 is `YYYY-MM-DD`, header col 1 and every data-row date are
`DD-MM-YYYY`. File order is Lp 1..N ascending, rows roughly newest-first by booking date with a few adjacent
inversions (real ≈ 8%) — the fixture must contain inversions, Lp 1 must carry the maximum booking date, and booking
date ≥ operation date on every row (equal on ≈ 10%). Balances (col 6) are computed along true chronological order
(booking date, then operation date, then reverse Lp); header col 6 (closing) == Lp 1's col 6. The check must not
assert a file-order balance chain (the real file does not have one).

**Quoting.** RFC-style: col 5 and col 6 always quoted (data rows and header), col 2/col 3 quoted only when they contain
`,`; no `""` escapes (the generator must refuse a value containing `"`). Every line has 9 fields, col 8 empty, LF,
trailing LF, UTF-8 without BOM. The shared reader (exported from the check) splits on `,` outside quotes.

**Privacy.** Every value is invented. Card masks use the public test BIN `411111` (`411111******1111`,
`411111******2222`); the account number is invented with the public bank code `1090` at positions 3–6 and must differ
from the ING fixture's `MAIN`/`VAT`. The generator's header comment states "no value copied from a real export".

## Phase 1: Generator and fixture files

### Overview

The generator, the main PLN export, the USD reject file, `expected.json`, the generated README and the
`.gitattributes` entry. After this phase S-10/S-11 have files and an answer key; the gate comes in Phase 2.

### Changes Required:

#### 1. Generator

**File**: `scripts/fixture-santander.mjs`

**Intent**: Deterministically produce every file in `test/fixtures/santander/` from one trap declaration, mirroring
`scripts/fixture-ing.mjs` (zero deps, `node:` modules only, no clock, seeded PRNG, `OUT_DIR` hard-wired).

**Contract**:
- `export function generate()` → `Map`/object `relative file name → Uint8Array | string` (no disk write); CLI run
  (same guard as the ING scripts) writes them to `test/fixtures/santander/`. `export const TRAPS` (id → [description,
  expected outcome]) for the check and README.
- Constants: `SEED`, `EXPORT_DATE = "2026-08-31"` (header col 0), `RANGE_START = "2026-03-01"` (header col 1,
  rendered `01-03-2026`), invented `ACCOUNT` (PLN) and `USD_ACCOUNT`, invented `OWNER` (name + address with postcode,
  one bare field, no comma), `CARDS = ["411111******1111", "411111******2222"]`.
- Header line: `<YYYY-MM-DD>,<DD-MM-YYYY>,'<NN NNNN NNNN NNNN NNNN NNNN NNNN>,<owner + address>,<CUR>,"<opening>","<closing>",<N>,`.
- Data line: `<booking DD-MM-YYYY>,<operation DD-MM-YYYY>,<description>,<counterparty>,<counterparty account>,"<amount>","<balance>",<lp>,`.
  Amounts `-?\d+,\d{2}`, no thousands separator, ≤ 4 integer digits.
- Description kinds: card `DOP. VISA <mask> PŁATNOŚĆ KARTĄ <amount with .> PLN <ASCII tail, single spaces, 2–7
  tokens>`; `ZWROT PŁATNOŚCI KARTĄ` (positive); `WYPŁATA Z BANKOMATU KARTĄ` (tail = ATM address); `Zakup BLIK …:<11
  digits>` and `Wypłata BLIK …:<11 digits>` (col 3 counterparty + col 4 account filled); `Przelew środków` /
  `Przelew na telefon` (col 3 counterparty); free-title transfers (invoice/utility-style refs with `/`-separated ids);
  recurring `Oplata za <…>` debit (one counterparty, one account, identical title). Card rows: col 3/col 4 empty, card
  amount in description == |col 5|. Col 4 when filled: grouped digits, bare, no `'`. Card share ≈ 85–90 %, the two
  cards ≈ 55/45.
- Traps (values invented by the implementer; ING names reused only for ST10):

  | ID | Trap | Expected outcome (manifest) |
  |---|---|---|
  | ST01 | Two cards on one account; the same merchant paid with both | one pattern; card mask not part of the merchant |
  | ST02 | Same chain, different branch numbers in the card tail (invented chain) | one pattern, `resolvedBy: normalization` |
  | ST03 | Same merchant written two ways by the card operator (`MARKA *Marka App` vs `MARKA APPS <CITY>`), monthly same amount | one `fixed` pattern, `resolvedBy: user-merge` |
  | ST04 | Card ATM withdrawals at ≥ 2 addresses | `rawMerchant` = the ATM address tail (regex, like every card row); one `frequent` pattern `bankomat`, `resolvedBy: normalization` (S-11 maps it; the parser does not) |
  | ST05 | `Zakup BLIK` with counterparty in col 3; one row carries a domain-shaped token in the description | raw merchant = col 3 (rule 5), D3 domain rule not used |
  | ST06 | `Wypłata BLIK` (BLIK cash withdrawal) | raw merchant = col 3 (rule 5); own pattern, not merged into `bankomat` |
  | ST07 | Transfers: `Przelew środków`, `Przelew na telefon`, a free-title debit with a `,` in col 2 (quoted) | raw merchant = col 3 |
  | ST08 | Card refund (`ZWROT PŁATNOŚCI KARTĄ`, positive) | skipped, `skipReason: credit` (D2) |
  | ST09 | Non-refund credits (incoming transfers, one with a `,` in col 3, quoted) | skipped, `skipReason: credit` |
  | ST10 | Cross-bank merchant: card tail `PIZZERIA TRZY SERY KRAKOW` (ASCII), ≥ 3 rows, both cards | `pattern: "pizzeria-trzy-sery"` = the ING slug; `crossBank` entry |
  | ST11 | Recurring `Oplata za …` debit, same amount monthly | one `fixed` pattern (not asserted to be a bank fee) |
  | ST12 | Booking ≠ operation date on ≈ 90 % of rows; file order with adjacent booking-date inversions | `occurredOn` = operation date (col 1) |
  | ST13 | Header: two date formats, `'` + grouped account number, quoted balances, col 7 == data-row count | period = header col 1 → header col 0 (D7) |
  | ST14 | USD account file (header col 4 `USD`, 3 card rows in `USD`, one tail with `*`, one with `_`) | file rejected, `reason: currency` |

  Plus seeded noise: one-off card merchants (ASCII, invented), a few `frequent` card merchants with spread > D5
  tolerance, so D5 yields both types. Over-merge guards for S-11 (plan review F3): ≥ 2 distinct merchants share one
  city tail token, and ≥ 1 card tail ends in a two-word city — each stays its own pattern. ST10's Santander rows keep
  amounts inside the ING `pizzeria-trzy-sery` spread so its Santander `type` is `frequent` like the ING oracle's, and
  the `crossBank` entry records `"type": "frequent"` for the joined pattern.
- `expected.json` shape (`JSON.stringify(…, null, 2) + "\n"`):

  ```json
  {
    "schema": 1,
    "bank": "santander",
    "tolerance": { "pct": 15, "minMinor": 1000, "rule": "D5: …" },
    "crossBank": [{ "pattern": "pizzeria-trzy-sery", "oracle": "test/fixtures/ing/expected.json", "traps": ["ST10"] }],
    "files": {
      "<name>": {
        "expect": "ok", "reason": null, "account": "<grouped number>", "currency": "PLN",
        "period": { "start": "2026-03-01", "end": "2026-08-31" }, "declaredCount": 0,
        "imported": { "count": 0, "sumMinor": 0 }
      }
    },
    "rows": [
      { "file": "…", "lp": 1, "line": 2, "bookedOn": "YYYY-MM-DD", "occurredOn": "YYYY-MM-DD",
        "amountMinor": -2431, "kind": "card|card-refund|atm|blik|blik-withdrawal|transfer|other",
        "card": "1111|2222|null", "traps": ["ST10"], "imported": true, "skipReason": null,
        "rawMerchant": "…", "pattern": "…" }
    ],
    "patterns": [
      { "key": "…", "type": "fixed|frequent", "resolvedBy": "normalization|user-merge|import",
        "traps": [], "rawMerchants": [], "occurrences": 0, "sumMinor": 0, "medianMinor": 0, "firstMonth": "YYYY-MM" }
    ]
  }
  ```

  `rawMerchant` follows Santander rule 5 as written today (card regex tail incl. city; else col 3; else col 2);
  `pattern` is the intended slug after S-11 normalization/user decisions. Rows of the USD file are listed with
  `imported: false`, `skipReason: "rejected-file"`.

#### 2. Generated README

**File**: `test/fixtures/santander/README.md` (generated by the same run)

**Intent**: A person outside the project finds every trap's rows and knows how to regenerate.

**Contract**: Sections: origin (shapes from `import-formats.md` + aggregate real-export scan, zero values copied),
format summary, trap table ST01–ST14 with row counts computed from the manifest, files and expected outcome, commands
(`fixture:santander`, `fixture:check`, `fixture:shape:santander`), "change = edit the generator + regenerate".

#### 3. npm script and attributes

**File**: `package.json`, `.gitattributes`

**Intent**: One regeneration command; byte-exact fixture in git.

**Contract**: `"fixture:santander": "node scripts/fixture-santander.mjs"`; `.gitattributes` += `test/fixtures/santander/** -text`
(with a one-line comment like the ING one). `fixture:check` is **not** repointed in this phase.

### Success Criteria:

#### Automated Verification:

- `npm run fixture:santander` exits 0 and writes exactly 4 files (main CSV, USD CSV, `expected.json`, `README.md`) to `test/fixtures/santander/`
- Determinism: a second `npm run fixture:santander` leaves `git status --porcelain test/fixtures/santander` unchanged after staging the first run
- Deliberate break: change `SEED` → regenerate → `git diff --exit-code test/fixtures/santander` is red; restore `SEED` → regenerate → clean (meta-check: proves the committed bytes are tied to the generator, not that the format is right — that is Phase 2's job)
- Shape smoke via `node -e`: main CSV has no BOM, no `\r`, trailing `\n`, 9 fields on every line (quote-aware), header col 7 == data-line count, header col 4 `PLN`; USD file header col 4 `USD`
- Git plumbing: `git check-ignore test/fixtures/santander/*.csv` prints nothing; `git check-attr text test/fixtures/santander/expected.json` reports `unset`
- ING untouched: `git diff --exit-code main -- scripts/fixture-ing.mjs scripts/fixture-ing-check.mjs scripts/fixture-ing-shape.mjs test/fixtures/ing`
- Full local gate vs baseline (contract): lint 0 errors, astro check 0 errors, `fixture:check` OK (still ING only), vitest baseline Δ0, build OK, pgTAP baseline Δ0, smoke baseline Δ0

#### Manual Verification:

- [reviewer] Every trap ST01–ST14 has recognisable rows in the CSV and matching `traps` entries in `expected.json`; the main file reads like the real export's shape (header, kinds, quoting) per research.md § Real export
- [reviewer] Privacy: no merchant, counterparty, amount, date, account or card number comes from the real exports — scratchpad overlap scan of fixture tokens vs real col 2/col 3 tokens (sandbox disabled, prints counts of overlapping tokens outside the format vocabulary only, never the tokens)

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 2: Santander check and the two-bank gate

### Overview

`scripts/fixture-santander-check.mjs` plus the aggregator `scripts/fixture-check.mjs`; `npm run fixture:check` now
covers both banks with the CI step unchanged.

### Changes Required:

#### 1. Santander check

**File**: `scripts/fixture-santander-check.mjs`

**Intent**: Catch hand edits, determinism breaks and drift from the Santander format contract or D2/D5/D7 — reading
the files from disk independently of the generator.

**Contract**: `export async function check()` → `string[]` errors; CLI guard prints
`fixture:check (santander) OK …` / the error list and sets the exit code. Also exports the reader for Phase 3:
`parseLine(line)` (quote-aware, 9 fields, `{ value, quoted }`, throws on `""` escapes or stray quotes), `toMinor`,
`DMY` / `YMD` date regexes, `CARD` description regex. Checks:
1. `generate()` bytes == disk for every file; no extra file in `test/fixtures/santander/`.
2. Per CSV from disk: fatal UTF-8 decode, no BOM, no `\r`, trailing LF; 9 fields per line, col 8 empty; header col 0
   `YMD`, col 1 `DMY`, col 2 `'` + `\d{2}( \d{4}){6}`, col 4 `[A-Z]{3}`, col 5/col 6 quoted amounts, col 7 == data
   rows; data rows: col 0/col 1 `DMY`, booking ≥ operation, col 5/col 6 quoted `-?\d+,\d{2}`, col 7 Lp == 1..N in
   file order; header col 1 ≤ every operation date, header col 0 ≥ every booking date; header col 6 == Lp 1's col 6;
   opening + Σ amounts == closing; Lp N's col 6 − col 5 == opening; file name date/digits == header col 0/col 2;
   Lp 1 has the unique maximum booking date and ≥ 1 adjacent booking-date inversion exists (main file); card rows match
   `CARD`, description amount == |col 5|, description currency == header col 4, col 3/col 4 empty, tail ASCII with
   single spaces; refunds > 0, card payments/ATM < 0; ≥ 2 distinct card masks; filled col 4 is grouped digits
   without `'`; col 2/col 3 quoted iff they contain `,`.
3. Manifest (ok files): exactly one `rows` entry per `(file, lp)`; `amountMinor` == col 5; `occurredOn`/`bookedOn`
   == col 1/col 0; `imported` == (amount < 0) with `skipReason: credit` otherwise (D2); `rawMerchant` re-derived by
   rule 5; `imported.count`/`sumMinor`/`declaredCount`/`period` consistent; D5: every `fixed` pattern within
   tolerance of its median, every `frequent` with ≥ 2 occurrences has one outside; every `TRAPS` id appears in
   ≥ 1 row; each `crossBank` pattern exists in both the Santander `patterns` and the ING oracle's `patterns`, with the entry's
   `type` in both.
4. Reject file: `expect: reject`, `reason: currency`, header col 4 ≠ `PLN`; it trips only its own reason (format
   otherwise valid) and the main file does not trip it.

#### 2. Aggregator

**File**: `scripts/fixture-check.mjs`, `package.json`

**Intent**: One gate name for both banks; every bank's errors are reported even when another bank fails.

**Contract**: Imports `check` from `./fixture-ing-check.mjs` and `./fixture-santander-check.mjs`, awaits both, prints
`fixture:check <bank> OK` or the bank's error list (first 50 + count), exits 1 if any bank has errors.
`"fixture:check": "node scripts/fixture-check.mjs"`. `scripts/fixture-ing-check.mjs` itself is not edited and keeps
working standalone.

### Success Criteria:

#### Automated Verification:

- `npm run fixture:check` exits 0 and prints an OK line for `ing` and for `santander`
- Deliberate break 1 (bytes): flip one byte in the main Santander CSV → `fixture:check` exits 1 with a santander error while the ing line still says OK; `git checkout` the file → green
- Deliberate break 2 (semantics): in the generator mark the ST08 refund row `imported: true` and regenerate → `fixture:check` exits 1 on the D2 rule although the byte comparison passes; restore + regenerate → green (meta-check: proves the check re-derives from disk instead of trusting the generator)
- Deliberate break 3 (aggregation): flip one byte in the ING main CSV → exit 1 with an ing error AND a santander OK line (proves both banks run); `git checkout` → green
- Standalone ING still works: `node scripts/fixture-ing-check.mjs` exits 0
- CI unchanged: `git diff --exit-code main -- .github/workflows/ci.yml`; ING files unchanged as in 1.6
- Full local gate vs baseline: lint 0 errors, astro check 0 errors, `fixture:check` OK (both banks), vitest Δ0, build OK, pgTAP Δ0, smoke Δ0

#### Manual Verification:

- [reviewer] The check's rules match research.md § Real export (no rule asserts a fact the real export does not have, e.g. a file-order balance chain or strict date order)

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 3: Shape comparator, format doc and seam sweep

### Overview

Local-only `fixture:shape:santander`, the `import-formats.md` corrections, a CLAUDE.md command line, and the seam
sweep over everything this slice added.

### Changes Required:

#### 1. Shape comparator

**File**: `scripts/fixture-santander-shape.mjs`, `package.json`

**Intent**: Mitigate the roadmap risk „fixture zbyt czysty” without leaking data: compare fixture vs real export
structure, per currency.

**Contract**: `"fixture:shape:santander": "node scripts/fixture-santander-shape.mjs"`; dir = `process.argv[2]` if
non-empty, else `data/` (never cwd); reads `historia_*.csv`; no dir / no files → message, exit 0 (never a CI gate).
Imports the reader from `./fixture-santander-check.mjs`. Sides labelled `fixture PLN`, `fixture USD`, `real N (<CUR>)`
by position — **never file names or the dir's file listing**; I/O and parse errors report only the side label and the
error code/class. Metrics (masks/shares only): BOM, line endings, final newline, UTF-8 validity; field-count
distribution; per-row quoting signature; masked header (`<YMD>,<DMY>,'<9{2} 9{4}…>,<text>,<CUR>,"<amount>"…`);
description-kind distribution (card pay/refund/ATM, `Zakup BLIK`, `Wypłata BLIK`, `Przelew …`, `Oplata za`, other);
card tail ASCII share, single-space share, token-count distribution, `*` share; distinct card masks count; booking ≥
operation share, booking ≠ operation share, adjacent inversion share; credits share; col 3/col 4 fill by kind; col 4
masks; BLIK `:<11 digits>` suffix share; `""` count; header col 7 == rows; header col 6 == Lp 1 balance. Differences
compared within the same currency, tolerance in percentage points like the ING tool.

#### 2. Format contract

**File**: `context/foundation/import-formats.md` (section „Santander Bank Polska”)

**Intent**: The doc and the fixture tell S-10 one truth.

**Contract**: Table and subsections corrected per research.md § Real export: `Lp` 1..N ascending in file order, rows ≈
newest booking date first, not strictly; header col 0 `YYYY-MM-DD` vs col 1 `DD-MM-YYYY` and the grouped account mask;
quoting names col 5 and col 6; card tail ASCII without Polish letters; `Wypłata BLIK` and the `:<11 digits>` BLIK
suffix; free-title transfer shape; recurring `Oplata za …` debit; col 4 mask; the ATM line of the regex block says
`rawMerchant` = address tail and the „bankomat” pattern comes from normalization (S-11), so rule 5 and the fixture
manifest agree (plan review F1); the header invariants above. One line pointing at
`test/fixtures/santander/README.md` (ST01–ST14) in „Kształty do seeda (dodatkowe)”. No value from the real exports.

#### 3. Project commands

**File**: `CLAUDE.md` (section „Commands”)

**Intent**: The fixture commands are discoverable; `fixture:check` is described as covering both banks.

**Contract**: One bullet: `npm run fixture:ing` / `fixture:santander` (regenerate), `fixture:check` (both banks,
CI), `fixture:shape` / `fixture:shape:santander` (local-only, structure vs a real export, never a gate).

#### 4. Seam sweep

**File**: everything added or touched by Phases 1–3

**Intent**: Leave no seam for S-10/S-11 to trip over.

**Contract**: One CSV reader (in `fixture-santander-check.mjs`, imported by the shape tool — no copy); no duplicated
constant between the Santander generator and check other than the deliberate independent re-derivation (format
regexes, rule 5); header comments accurate (no "ING-only" wording left on the aggregator path, no stale TODO); README
trap counts generated; `change.md` claims that the plan refined (`Oplata za` "bank fee") not repeated in the new docs;
no `DESIGN-GAP`/kit row needed (none expected). Duplication of `mulberry32`/date helpers with the ING generator is
accepted (ING scripts stay untouched) and noted in the generator header.

### Success Criteria:

#### Automated Verification:

- `npm run fixture:shape:santander` with no arg and no `data/historia_*.csv` exits 0 with a message; with `-- ""` likewise (does not scan cwd)
- Privacy guard: `npm run fixture:shape:santander -- <scratch dir holding a copy of the fixture CSV renamed historia_2026-01-01_<26 digits>.csv>` exits 0 and its output matches neither `\d{26}` nor `historia_`
- Deliberate break: make the tool print the side's file name → the privacy grep above goes red; restore → green (meta-check: proves the grep catches a leaked name, not merely that the fixture has none)
- `npm run fixture:check` OK for both banks after any generator fix from the shape comparison (regenerated, committed bytes match)
- Seam sweep: `grep -n "parseLine\|function parse" scripts/fixture-santander*.mjs` shows one reader definition; no `TODO`/`ING-only` left in the new scripts
- Full local gate vs baseline: lint 0 errors, astro check 0 errors, `fixture:check` OK (both banks), vitest Δ0, build OK, pgTAP Δ0, smoke Δ0

#### Manual Verification:

- [reviewer] `npm run fixture:shape:santander -- <real export dir from the run contract>` (sandbox disabled): output holds only masks/shares, no file name; every remaining difference is explained in the implement handoff or fixed in the generator
- [reviewer] `import-formats.md` Santander section and `test/fixtures/santander/README.md` agree with each other and with research.md § Real export; neither contains a value from the real exports
- [human] Product owner confirms the oracle's product calls S-11 is measured against: `Wypłata BLIK` its own pattern (not `bankomat`), ST03 resolved by user-merge (not automatic normalization), `Oplata za …` a `fixed` pattern — reversible by editing the generator + regenerating

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Testing Strategy

### Unit Tests:

- No new Vitest file: the gate is `fixture:check` (byte compare + independent format/manifest checks), as for ING.
  Vitest baseline stays Δ0; S-10 adds the parser tests against `test/fixtures/santander/expected.json`.

### Integration Tests:

- None in this slice. S-10 imports the main file (and re-imports it for the overlap path); S-11 asserts grouping sets
  including the cross-bank `pizzeria-trzy-sery` pattern.

### Manual Testing Steps:

1. `npm run fixture:santander`; open the main CSV; compare with the shape table in research.md.
2. Pick 3 traps from `expected.json` `rows[].traps`, find the rows by `lp`.
3. Run the shape comparator against the real export dir (sandbox disabled), confirm the output carries no values.

## Performance Considerations

None — ~190 rows, generation in milliseconds.

## Migration Notes

None — no schema, seed or data change.

## Autonomous decisions

Recorded in place of the skill's user questions (no human in the loop, run contract rule 1).

| Decision | Chosen | Rejected | Why | What would change it |
| --- | --- | --- | --- | --- |
| Complexity / question budget | MEDIUM, 0 questions — research answered every solution choice | interview | Research + change.md + run contract settle scope; remaining choices are mechanical | A product owner available to answer |
| Gate layout | Aggregator `scripts/fixture-check.mjs` | `&&` chain; second CI step | Both banks reported in one run; CI step and ING script untouched | ING check gaining side effects on import |
| Shared merchant | `pizzeria-trzy-sery` (ASCII) | `kawiarnia-filizanka` (diacritic), T10/T11 merchants | Real card tails are ASCII; no ING trap interplay; no re-keying in S-11 | Maintainer wanting S-11 to fold diacritics now |
| Shape comparator | In scope, separate `fixture:shape:santander` | Defer; bank switch on `fixture:shape` | Roadmap risk „fixture zbyt czysty”; ING tool stays untouched | Maintainer judging the research scan sufficient |
| Overlap reject file | None | `…-overlap.csv` | Roadmap F-03 names only the USD reject; S-10 re-imports the main file | S-10 plan needing a distinct overlapping range |
| `Wypłata BLIK` handling | Own pattern from col 3 (rule 5 as written) | Merge into `bankomat` | Rule 5 is the current contract; the manifest must be definite | S-11 deciding BLIK withdrawals are ATM-like (edit generator + regenerate) |
| `Oplata za …` | Recurring `fixed` debit, not called a bank fee | "bank fee" (change.md) | Not provable from shape | Owner confirming it is a fee |
| Trap ids | `ST01–ST14` | `T20+` / `S01` | Distinct from ING `T01–T19` and roadmap `S-NN` ids | — |
| Period and size | 2026-03-01 → 2026-08-31, ≈180 rows | 12 months like ING | Enough months for D5 fixed/frequent; keeps the file reviewable | S-11 needing a longer series |
| Account number / BIN | Invented, public bank code `1090`; test BIN `411111` | Fully random digits | Plausible shape for S-10 detection without any real value | Detection rules relying on checksums |
| Doc corrections phase | Phase 3, after the comparator re-checks shapes | Phase 1 | The comparator confirms the facts the doc states | — |
| PRD literal text | No deviation from FR-018/FR-014; the oracle's product calls get `[human]` row 3.9 (plan review F4) | — | F-03 ships data and scripts only, but S-11 is measured against its slugs | — |

## Known risks

- Overlap rejection (S-10) is provable with this fixture only as an identical re-import of the main file; a partial
  overlap needs a test-built variant in S-10 (plan review O1).
- The real export's balances form no clean chain under any simple ordering (file order or booking date); the
  fixture's chronological chain is cleaner by design — 3.7 should list it as an explained difference, the check never
  asserts a chain (plan review O3).

## References

- Research: `context/changes/synthetic-santander-fixture/research.md` (§ Summary, § Real export, gate options)
- Identity: `context/changes/synthetic-santander-fixture/change.md`
- ING analogue: `context/archive/2026-09-24-synthetic-ing-fixture/plan.md`, `reviews/impl-review.md` (F1, F4, F5, F6)
- Scripts: `scripts/fixture-ing.mjs` (`generate`, `NOISE_POOL`, `mulberry32`), `scripts/fixture-ing-check.mjs` (`check`, `parseLine`), `scripts/fixture-ing-shape.mjs` (`mask`, `shape`, `same`)
- Merchant rules: `src/lib/patterns/merchant.ts` (`rawMerchant`, `normalizeMerchant`, `merchantKey`)
- Format contract: `context/foundation/import-formats.md` (Santander section, D2/D5/D7)
- Roadmap: `context/foundation/roadmap.md` — F-03, S-10, S-11
- CI: `.github/workflows/ci.yml` (job `ci`, step `npm run fixture:check`)

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Generator and fixture files

#### Automated

- [x] 1.1 `npm run fixture:santander` exits 0 and writes exactly 4 files to `test/fixtures/santander/` — 5301ea4
- [x] 1.2 Determinism: a second run leaves the fixture dir unchanged — 5301ea4
- [x] 1.3 Deliberate break: changed `SEED` turns `git diff --exit-code test/fixtures/santander` red; restored → clean — 5301ea4
- [x] 1.4 Shape smoke via `node -e`: no BOM, no `\r`, trailing LF, 9 fields per line, header col 7 == rows, PLN/USD headers — 5301ea4
- [x] 1.5 Git plumbing: CSVs not ignored; `text` attribute unset for the fixture dir — 5301ea4
- [x] 1.6 ING untouched: no diff vs `main` in ING scripts and `test/fixtures/ing` — 5301ea4
- [x] 1.7 Full local gate vs baseline (Δ0; `fixture:check` still ING only) — 5301ea4

#### Manual

- [ ] 1.8 [reviewer] Every trap ST01–ST14 has rows and manifest entries; main file matches the real-export shape
- [ ] 1.9 [reviewer] Privacy overlap scan: no value from the real exports in the fixture

### Phase 2: Santander check and the two-bank gate

#### Automated

- [x] 2.1 `npm run fixture:check` exits 0 with OK lines for `ing` and `santander`
- [x] 2.2 Deliberate break 1 (bytes): flipped Santander byte → red on santander, ing OK; restored → green
- [x] 2.3 Deliberate break 2 (semantics): refund marked imported + regenerated → red on D2; restored → green
- [x] 2.4 Deliberate break 3 (aggregation): flipped ING byte → red on ing with santander OK; restored → green
- [x] 2.5 Standalone `node scripts/fixture-ing-check.mjs` exits 0
- [x] 2.6 CI workflow and ING files unchanged vs `main`
- [x] 2.7 Full local gate vs baseline (Δ0; `fixture:check` covers both banks)

#### Manual

- [ ] 2.8 [reviewer] Check rules assert only facts the real export has

### Phase 3: Shape comparator, format doc and seam sweep

#### Automated

- [ ] 3.1 `fixture:shape:santander` without files (no arg and `-- ""`) exits 0 with a message
- [ ] 3.2 Privacy guard: output on a renamed fixture copy matches neither `\d{26}` nor `historia_`
- [ ] 3.3 Deliberate break: printing the file name turns the privacy grep red; restored → green
- [ ] 3.4 `npm run fixture:check` OK for both banks after any generator fix
- [ ] 3.5 Seam sweep: one Santander CSV reader; no `TODO`/`ING-only` in the new scripts
- [ ] 3.6 Full local gate vs baseline (Δ0)

#### Manual

- [ ] 3.7 [reviewer] Shape comparison against the real exports prints masks only; differences explained or fixed
- [ ] 3.8 [reviewer] `import-formats.md` and the fixture README agree with research and hold no real value
- [ ] 3.9 [human] Product owner confirms the oracle's product calls (`Wypłata BLIK` own pattern, ST03 user-merge, `Oplata za …` fixed)
