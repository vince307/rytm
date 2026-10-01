---
date: 2026-10-01T23:07:56+0200
researcher: Claude (autonomous run 2026-10-01-m2-santander, research step)
git_commit: 24ad875
branch: feat/synthetic-santander-fixture
repository: Rytm
topic: "F-03 synthetic-santander-fixture — gate layout for a second bank, cross-bank merchant, shape comparator, real-export shape facts vs import-formats.md"
tags: [research, fixture, santander, import-formats, fixture-check, scripts]
status: complete
last_updated: 2026-10-01
last_updated_by: Claude (autonomous run, research step)
---

# Research: F-03 synthetic Santander fixture

**Date**: 2026-10-01T23:07:56+0200
**Researcher**: Claude (autonomous run 2026-10-01-m2-santander)
**Git Commit**: 24ad875
**Branch**: feat/synthetic-santander-fixture
**Repository**: Rytm

## Research Question

Derived from `change.md` (roadmap-claims table, autonomous decisions) and `handoff.md` §5 of the `/10x-new` step:

- (a) How does `npm run fixture:check` cover `test/fixtures/santander/` with no new CI step?
- (b) Which ING-fixture merchant becomes the cross-bank shared merchant (S-11), and what key does the ING oracle give it?
- (c) Is a Santander `fixture:shape` analogue in scope (roadmap risk „fixture zbyt czysty”)?
- (d) Repo plumbing: `.gitattributes`, `.gitignore`, `.prettierignore`, ESLint scope.
- (e) Real-export shape facts that `import-formats.md` (Santander section) gets wrong or omits — re-checked from the real exports, shapes only.
- (f) Open unknown: does BLIK via an operator carry the merchant's domain (D3) in Santander?

Privacy: the real exports (paths in the gitignored run contract) were read with the sandbox disabled by two scratchpad
scripts that print only masks (`9{n}` for digit runs, `a` for letter runs) and counts. No value from them appears here.

## Summary

1. **Gate (a).** `scripts/fixture-ing-check.mjs` hard-wires `FIXTURE_DIR` to `test/fixtures/ing` and its
   “no extra files” rule reads only that directory (`check()`, step 1), so a sibling `test/fixtures/santander/` does
   not break it. It already exports `check()` and runs only under its own `import.meta.url === argv[1]` guard, so an
   aggregator can import it without side effects. Recommendation: new `scripts/fixture-santander.mjs` (generator,
   `export generate()`), `scripts/fixture-santander-check.mjs` (`export check()`), and a tiny
   `scripts/fixture-check.mjs` that awaits both `check()`s and prints both error lists; repoint `package.json`
   `fixture:check` to it. CI `ci` job step `npm run fixture:check` stays byte-identical. Do not refactor the ING
   generator/check (byte-exact fixture; any change risks ING `fixture:check` drift).
2. **Cross-bank merchant (b).** ING oracle `pattern` keys are hand-authored slugs, not `merchantKey()` output; the unit
   tests compare **grouping sets**, not key strings (`test/unit/patterns.test.ts`, comment at the `Oracle:` header and
   `expectedGroups`). Recommended shared merchant: **`pizzeria-trzy-sery`** (noise pool, `NOISE_POOL` in
   `scripts/fixture-ing.mjs`; raw `PIZZERIA TRZY SERY UL. MAKOWA 9 KRAKÓW`; ASCII name, no trap ids). Its ING
   `normalizeMerchant` result is `PIZZERIA TRZY SERY` (rule 3 `ADDRESS` strips ` UL. …`), whereas a Santander card tail
   `PIZZERIA TRZY SERY KRAKOW` normalizes today to `PIZZERIA TRZY SERY KRAKOW` — the gap S-11 must close (trailing
   city token). Santander `expected.json` rows carry `pattern: "pizzeria-trzy-sery"` plus a top-level cross-bank
   declaration pointing at the ING file.
3. **Diacritics finding (new).** In the real PLN export every card-description merchant tail is pure ASCII with single
   spaces (438/438 card rows), while ING counterparty names carry Polish letters (`KAWIARNIA FILIŻANKA …`). A shared
   merchant with a diacritic would force S-11 to fold diacritics in `normalizeMerchant`, which re-keys existing ING
   merchants (`merchant.ts` header: “changing it re-keys merchants (S-04/S-05 store rows by key)”). Hence the ASCII
   pick for the declared trap; the diacritic case is recorded as an S-11 open question, not built into F-03 by default.
4. **Shape comparator (c).** Recommended **in scope, local-only**, as `scripts/fixture-santander-shape.mjs` +
   `fixture:shape:santander` (or a dir-arg on one `fixture:shape`), mirroring `scripts/fixture-ing-shape.mjs`
   (prints masks/shares only, exit 0 without real files, never a CI gate). Two privacy constraints from F-02's
   impl-review apply harder here: the Santander real filename **contains the account number**
   (`historia_<date>_<26 digits>.csv`), so the tool must never print file names (F-02 review F1), and an empty dir arg
   must not resolve to cwd (F-02 review F6).
5. **Plumbing (d).** `.gitignore` already allows `!test/fixtures/**/*.csv`; `.prettierignore` already covers
   `test/fixtures/`; ESLint `scriptsConfig` lints `scripts/**/*.mjs` (new scripts are linted). `.gitattributes` has only
   `test/fixtures/ing/** -text` → add `test/fixtures/santander/** -text` (whole directory, per F-02 review F5).
6. **Doc corrections (e).** Six corrections to the Santander section of `import-formats.md` confirmed (table in
   Detailed Findings § Real export); one correction from `change.md` is **refined**: the `Oplata za …` rows are not
   provably bank fees — they are a recurring debit to one counterparty with col 3/col 4 filled.
7. **D3/BLIK (f).** Answered for this export: BLIK rows (6: `Zakup BLIK` and `Wypłata BLIK`, all debits) all have col 3
   (counterparty) and col 4 (account) filled; the description ends `…:<11 digits>`. Col 3 is the merchant source; the D3
   domain-in-title rule is not needed as the primary path. No migration, no UI, no kit binding in this slice.

## Detailed Findings

### ING gate and generator (pattern to copy, not to modify)

- `scripts/fixture-ing-check.mjs` — `FIXTURE_DIR` constant; `check()` does (1) byte equality vs
  `generate()` from `./fixture-ing.mjs` plus “not produced by the generator (extra file)” over
  `readdirSync(FIXTURE_DIR)`; (2) re-reads each CSV with its own reader (`parseLine`, `decodeCp1250`) against the
  format contract; (3) `checkManifest` + `checkPatterns` (D1/D2/D5/D6, trap coverage `TRAP_IDS` T01–T19);
  (4) `rejectConditions` — each reject file trips exactly its own reason, and all three reasons
  (`overlap`, `no-header`, `currency`) must exist. Exports reused by `fixture-ing-shape.mjs`: `COLUMN_NAMES`, `DATE`,
  `FOOTER`, `decodeCp1250`, `parseLine`, `toMinor`.
- `scripts/fixture-ing.mjs` — header comment: zero deps, no clock, seeded PRNG (`mulberry32`, `SEED`), traps as data
  (`TRAPS`, `TRAP_SERIES`, `NOISE_POOL`, `REJECT_FILES`), one run builds CSV + `expected.json` + README so the answer
  key cannot drift; `export function generate()` returns path → bytes/string; `OUT_DIR` hard-wired.
- What the Santander check must differ on (format, from § Real export): UTF-8 (no cp1250 round-trip), `,` separator with
  RFC-style quoting (no `""` escapes observed, 0 lines), one header line and no column header, no footer, no
  transaction ID (key = `lp`), single account per file (no D1 account choice), only one reject reason required
  (`currency`). An `overlap` reject file is **not** required by the roadmap F-03 outcome; S-10 can prove
  `imports_no_overlap` by importing the main file twice (plan decides).
- `package.json` scripts `fixture:ing`, `fixture:check`, `fixture:shape`; `.github/workflows/ci.yml` job `ci` runs
  `npm run fixture:check` once, after `npm run lint`, before `npm test`.

Gate options (for the plan):

| Option | Effect | Verdict |
| --- | --- | --- |
| Aggregator `scripts/fixture-check.mjs` importing both `check()` | both banks reported in one run, one exit code; ING script untouched | **recommended** |
| `"fixture:check": "node …ing-check.mjs && node …santander-check.mjs"` | zero new file; Santander errors hidden while ING fails | acceptable fallback |
| New CI step `fixture:check:santander` | second gate name in CI/CLAUDE.md/contract | rejected (change.md decision 3) |

### Oracle keys and the cross-bank merchant

- `test/fixtures/ing/expected.json` top-level keys: `schema`, `tolerance`, `files`, `rows`, `patterns`; row fields
  include `rawMerchant` and `pattern` (slug); patterns carry `key`, `type`, `resolvedBy`, `traps`, `rawMerchants`,
  `occurrences`, `sumMinor`, `medianMinor`, `firstMonth` (observed via `node -e` on the file).
- `test/unit/patterns.test.ts` — `expectedGroups()` / `oracleGroups()` group rows by `pattern` slug and assert the
  produced patterns' transaction-id sets equal the oracle's; real keys are derived via `merchantKey(rawMerchant)` from
  the fixture's own raws, “never a hardcoded slug” (comment above `sportowoRaws`). So a cross-bank oracle is a shared
  **slug** across the two `expected.json` files; S-11 asserts grouping, not key text.
- `src/lib/patterns/merchant.ts` — `rawMerchant()` (rule 7/D3, ING columns), `normalizeMerchant()` rules:
  scheme/www, `ADDRESS` (` UL.`/` AL.` to end), `LEGAL_FORM`, `STORE_NUMBER` (`^\d{3,}$` tokens), `dropDoubledPrefix`;
  `merchantKey()` = lower-case pl-PL. No city stripping without ` UL.`, no diacritic folding, no card-mask handling.
- Candidates (ING main file, imported, `resolvedBy: normalization`):

| Candidate | ING raw → `normalizeMerchant` | Verdict |
| --- | --- | --- |
| `pizzeria-trzy-sery` (`NOISE_POOL`) | `… UL. MAKOWA 9 KRAKÓW` → `PIZZERIA TRZY SERY` | **recommended**: ASCII name, no trap ids, restaurant = plausible card merchant |
| `drogeria-lawenda` (`NOISE_POOL`) | → `DROGERIA LAWENDA` | equivalent fallback |
| `kawiarnia-filizanka` (`NOISE_POOL`) | → `KAWIARNIA FILIŻANKA` | rejected as default: forces diacritic folding in S-11 (re-keys ING) |
| `muzykalnia` (T10), `kinoteka` (T11) | → `MUZYKALNIA`, `KINOTEKA` | rejected: carry ING traps; D5 fixed-pattern sums would mix banks |

- Cross-bank occurrences must not change ING `expected.json` (roadmap S-11 risk: „oczekiwany wynik fixture ING musi
  pozostać bez zmian”); the Santander manifest is a separate file in `test/fixtures/santander/`.

### Real export — shapes vs `import-formats.md` (Santander section)

Observed by aggregate scan (PLN file: 484 lines = 1 header + 483 data rows; USD file: 4 lines = 1 + 3).

| Doc says (section / table row) | Observed shape | Action in F-03 |
| --- | --- | --- |
| Kodowanie: UTF-8, no BOM, LF | confirmed in PLN file: no BOM, no CR, trailing LF | — |
| Cudzysłów: only amounts and comma fields | col 5 **and col 6** quoted on every data row; col 2 quoted on 11 rows and col 3 on 5 rows (comma inside); header col 5/6 quoted; 0 `""` escapes | doc: name col 6 |
| ID: `Lp` „1..N, malejąco po dacie księgowania” | `Lp` 1..N ascending in file order; booking date (col 0) of row 1 is the file maximum and of the last row the minimum, with 41 of 482 adjacent pairs inverted | doc: „Lp rosnąco w kolejności pliku; wiersze ≈ od najnowszej daty księgowania, nie ściśle”; fixture must contain inversions |
| Daty: `DD-MM-YYYY`, col 0 booking, col 1 operation (used); differ ~90% | data rows: col 0 > col 1 in 442/483, equal in 41/483, never col 0 < col 1 | doc ok (~91%); fixture keeps booking ≥ operation |
| Struktura: header row fields | header col 0 `YYYY-MM-DD` (export date), col 1 `DD-MM-YYYY` (range start), col 2 `'` + IBAN in groups (`'NN NNNN …`, 2+6×4 digits, spaces), col 3 owner name + address with postcode (bare, no comma), col 4 currency, col 5/6 quoted balances, col 7 bare row count, col 8 empty; header col 1 ≤ every operation date and header col 0 ≥ every booking date | doc: state both header date formats and the grouped account mask |
| Opis kartowy regex | `DOP. VISA <6 digits>******<4 digits> <KIND> <amount with .> <CUR> <tail>`; kinds `PŁATNOŚĆ KARTĄ` (432), `ZWROT PŁATNOŚCI KARTĄ` (3, all positive), `WYPŁATA Z BANKOMATU KARTĄ` (3); tail 2–7 tokens, **pure ASCII, single spaces** on all 438; description amount has no thousands separator; 2 card masks (≈54% / 46% of card rows); 10 tails contain `*` | doc: add “tail ASCII (no Polish letters)” — affects S-11 cross-bank matching |
| Kol. 3 / 4 for card rows | col 3 and col 4 empty on all 438 card rows (incl. ATM) | doc ok (rule 5: card → regex) |
| BLIK: `Zakup BLIK <operator/sprzedawca>` | 6 BLIK rows: 3 `Zakup BLIK`, 3 `Wypłata BLIK`, all debits; col 3 and col 4 filled; description ends `…:<11 digits>`; one `Zakup BLIK` tail carries a domain-like token | doc: add `Wypłata BLIK` (cash withdrawal, ATM-like) and the `:<11 digits>` suffix |
| Przelewy: `Przelew środków / Przelew na telefon / dowolny tytuł` | 12 `Przelew …` rows (11 credits, 1 debit), col 3 mixed case; 19 other non-card rows (483 − 438 card − 6 BLIK − 12 `Przelew` − 8 `Oplata za`) with free titles (invoice/utility references, slash-separated ids); col 4 = counterparty account in groups, bare, no `'` | doc: add free-title shape; col 4 mask |
| (absent) | 8 rows `Oplata za …`: identical description, one counterparty, one account, all debits | doc: add as „powtarzalne obciążenie z tytułem `Oplata za …`” — **not** asserted as a bank fee (change.md said fee; not provable from shape) |
| Uznania | 17 positive rows (≈3.5%): 3 card refunds, the rest transfers/free titles | fixture: ≥1 refund + ≥1 non-refund credit, both skipped (D2) |
| Liczba kolumn: 9 (last empty) | 9 on every line incl. header; col 8 always empty | — |
| Kwota | `-?\d+,\d{2}`, no thousands separator, max 4 integer digits observed | — |
| USD file | header col 4 `USD`; 3 rows, all `PŁATNOŚĆ KARTĄ … USD`, col 3/4 empty; 2 of 3 tails contain `_` or `*` | synthetic reject file: 3 card rows, USD in header and descriptions |

### Plumbing

- `.gitignore`: `*.csv` then `!test/fixtures/**/*.csv` — Santander CSVs are committable as-is.
- `.prettierignore`: `test/fixtures/` — generated README/JSON are not reformatted by lint-staged.
- `.gitattributes`: only `test/fixtures/ing/** -text` (with a comment) → add `test/fixtures/santander/** -text`.
- `eslint.config.*`: `scriptsConfig` with `files: ["scripts/**/*.mjs"]` — new scripts must pass `npm run lint`.
- Consumers of fixture dirs: `scripts/fixture-ing*.mjs`, `test/unit/{ing-parser,patterns,fixed-overview,home-stats,over-limit-trend}.test.ts`, `supabase/seed.sql` (demo, ING only) — all address `test/fixtures/ing` explicitly; none enumerates `test/fixtures/`.

## Code References

- `scripts/fixture-ing-check.mjs` — `FIXTURE_DIR`, `check()`, `readStatement`, `checkManifest`, `checkPatterns`, `rejectConditions`, CLI guard at file end
- `scripts/fixture-ing.mjs` — `generate()`, `TRAPS`, `TRAP_SERIES`, `NOISE_POOL`, `REJECT_FILES`, `mulberry32`, `OUT_DIR`
- `scripts/fixture-ing-shape.mjs` — `mask`, `maskField`, `shape`, default `data/` dir
- `src/lib/patterns/merchant.ts` — `OPERATORS`, `rawMerchant`, `normalizeMerchant`, `merchantKey`
- `test/unit/patterns.test.ts` — `expectedGroups`, `oracleGroups`, `sportowoRaws`
- `test/fixtures/ing/expected.json` — oracle shape
- `package.json` — `fixture:*` scripts; `.github/workflows/ci.yml` — job `ci`, step `npm run fixture:check`
- `.gitattributes`, `.gitignore`, `.prettierignore`, `eslint.config.*` (`scriptsConfig`)
- `context/foundation/import-formats.md` — section „Santander Bank Polska”, „Wykrywanie formatu”, D2/D3/D4/D7
- `context/foundation/prd.md` — FR-018 (Santander import, nice-to-have), FR-014 (synthetic data only)
- `context/foundation/roadmap.md` — F-03, S-10, S-11 entries

## Architecture Insights

- Fixture = generator-as-source-of-truth: CSV, manifest and README come from one deterministic run; the check re-reads
  bytes independently of the generator. Copy this per bank instead of generalizing the ING scripts.
- Santander has no transaction ID: the manifest row key is `lp` (import-formats rule 7: internal key `(import_id, lp)`);
  S-10 meets `src/lib/import/schema.ts` (ING 18-digit ID) and `imports.source` (`'ing'` only, roadmap „Data” line) —
  out of F-03 scope.
- The synthetic Santander account number must differ from the ING fixture accounts (`MAIN`/`VAT` in
  `scripts/fixture-ing.mjs`) so `imports_no_overlap` (per account number) never couples the two fixtures in S-10 tests.
- Card-mask, city-tail and `*` handling are S-11 normalization work; F-03 only declares them as traps with expected
  slugs.

## Historical Context (from prior changes)

- `context/archive/2026-09-24-synthetic-ing-fixture/plan-brief.md` — F-02 chose `fixture:check` in CI + local
  `fixture:shape`; „rozjazdy z prawdziwym plikiem wychodzą dopiero w `fixture:shape`” (supported; same rationale
  applies to F-03).
- `context/archive/2026-09-24-synthetic-ing-fixture/reviews/impl-review.md` — F1 (shape tool may print the real file
  name on I/O error), F5 (`.gitattributes` must cover the whole dir, not only CSV), F6 (empty dir arg → cwd), F4
  (README preamble length off by one — README facts must be generated, not hand-written). All relevant to F-03.

## Related Research

Not applicable — F-02 left no `research.md` (archive holds `change.md`, `plan-brief.md`, `plan.md`, `reviews/`).

## Open Questions

- **Diacritic-bearing cross-bank merchant** (S-11, not F-03): real card tails are ASCII; folding diacritics in
  `normalizeMerchant` would re-key stored ING decisions. Plan may add a second, optional diacritic trap only if it
  records it as „S-11 decides”; default is not to.
- **Fixture file name**: real names embed the account number; the synthetic file uses an invented 26-digit number.
  Whether the invented IBAN keeps Santander's public bank code `1090` (detection does not use it) is a plan choice.
- **Overlap reject file** for Santander: not required by F-03's outcome; plan decides (default: none).
- **`fixture:shape` naming**: separate `fixture:shape:santander` vs one script with a bank switch — plan decides.
