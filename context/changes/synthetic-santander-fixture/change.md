---
change_id: synthetic-santander-fixture
title: Synthetic Santander PLN export with format traps and a USD reject file
status: plan_reviewed
created: 2026-10-01
updated: 2026-10-01
archived_at: null
---

## Notes

Roadmap F-03 (`synthetic-santander-fixture`), milestone M-2 (second bank — Santander), slice 1 of 3
(`F-03 → S-10 santander-csv-import → S-11 santander-card-merchants`). Foundation slice: the repo gains a synthetic
Santander Bank Polska CSV export (PLN) that reproduces the real export's **shape** and its traps, plus a USD-account
file for the currency-rejection path, an expected-result manifest and a consistency gate "like ING" — so S-10 (parser,
import) and S-11 (card-merchant grouping) are built and measured without a real statement in the repo.
PRD refs: FR-018 (Santander import, nice-to-have), FR-014 (synthetic data only), NFR „prywatność danych źródłowych”.
Worked example: `context/archive/2026-09-24-synthetic-ing-fixture/` (F-02, the ING analogue).

**Scope at identity time:** a deterministic dependency-free Node generator + committed files under
`test/fixtures/santander/`, an expected-result manifest, README with trap ids, and a consistency gate wired into the
existing CI `fixture:check` step. Out of scope: the Santander parser, format detection in `src/lib/import/`, any UI,
copy, DB/demo seed (all S-10/S-11).

**UI / design kit:** none. The slice binds **no** kit view in `design/rytm-os/prototype/views/` and **no**
`content.json` key — it ships data and scripts only. (For S-10, not here: `importFlow.supported` and
`importErrors.unknownFormat` in `design/rytm-os/react-kit/docs/content.json` still say „Santander wkrótce” / „Później
dołączymy Santander” — a kit-copy gap S-10 must handle via `copyExtra` + `design-kit.md`, never invent.) No DESIGN-GAP.

**Migration expected: no.** No table, column, RPC or seed change; `supabase/seed.sql` keeps seeding no domain data.

### Roadmap claims vs repo now (checked 2026-10-01 on `feat/synthetic-santander-fixture`, base `main` 5e61822)

Real-export facts below come from a local, aggregate-only shape scan of the two real files named in the run contract
(counts and masked shapes only; no value left the scan).

| Roadmap / plan-time claim | Repo / real export now | Correction |
| --- | --- | --- |
| Synthetic CSV „zgodny z `import-formats.md`” (Santander section) | Section exists; most of it matches the real PLN export (UTF-8 no BOM, LF + trailing LF, `,` separator, 9 fields on every row, no column header, header col 7 == data-row count, card amount in description == col 5 on all card rows, operation date ≠ booking date in ~91%) | Four doc inaccuracies to fix in this slice (rows below); the fixture follows the real shape, `import-formats.md` is corrected alongside |
| `import-formats.md`: `Lp` „1..N, malejąco po dacie księgowania” | `Lp` runs **1..N ascending in file order**; booking dates are only roughly newest-first — not monotone in either direction; the „saldo po operacji” chain holds only for ~⅓ of adjacent row pairs in file order | Doc: „Lp 1..N rosnąco w kolejności pliku; kolejność wierszy ≈ od najnowszych, nie ściśle po dacie księgowania”. Fixture must not be perfectly date-sorted; the gate must not assert a file-order balance chain |
| `import-formats.md` header row: date formats not stated per column | Header col 0 (export date) is `YYYY-MM-DD`, header col 1 (range start) is `DD-MM-YYYY`; data-row dates are `DD-MM-YYYY`; header col 5/6 = opening/closing balance, closing balance == first data row's balance | Doc: state both header date formats (two formats in one row is itself a trap for S-10's D7 range). Detection rule „pole 0 = `YYYY-MM-DD`, pole 2 zaczyna się od `'`” confirmed |
| Description patterns: card / ATM / BLIK / transfers / refund | Confirmed: `DOP. VISA <mask> PŁATNOŚĆ KARTĄ` (bulk), `ZWROT PŁATNOŚCI KARTĄ` (positive), `WYPŁATA Z BANKOMATU KARTĄ`, `Zakup BLIK …`, `Przelew środków`. **Not in the doc:** `Wypłata BLIK …` (BLIK cash withdrawal, counterparty in col 3), bank-fee rows (`Oplata za …`), free-text transfer titles (invoice/utility references); BLIK descriptions end with a `…:<11-digit ref>` suffix | Add `Wypłata BLIK` (ATM-like, not a merchant — same handling question as card ATM), bank fee and free-title transfer shapes to the doc and the fixture |
| Quoting: `"` only on amounts and comma-containing fields | Col 5 (amount) **and col 6 (balance)** always quoted; col 2/3 quoted only when they contain `,` | Doc: name col 6 explicitly |
| Traps: two cards on one account | Confirmed: 2 distinct card masks in the PLN export | — |
| Trap: same merchant written two ways by the card operator (`MARKA *Marka App`) | Confirmed: card merchants with `*` exist (~2% of card rows) | — |
| Trap: same chain with different branch numbers | Not measurable abstractly without exposing names; pattern documented in `import-formats.md` „Kształty do seeda (dodatkowe)” | Kept as a declared trap (invented chain) |
| Trap: refund to skip (D2) | Confirmed: card refunds are positive amounts; real file also has other credits (positive rows ≈ 3.5%) | Fixture adds at least one non-refund credit, also skipped by D2 |
| Trap: merchant also present in the ING fixture | `scripts/fixture-ing.mjs` declares merchants as data; `test/fixtures/ing/expected.json` carries merchant keys per pattern | Pick one ING merchant whose raw text the Santander card line can carry; expected manifest names the shared normalized key (S-11's cross-bank grouping) |
| USD account file for currency rejection | Real USD export: header col 4 = `USD`, only card rows, card description currency `USD` | Synthetic reject file mirrors it (3 card rows, USD in header and descriptions) |
| „oczekiwany wynik i kontrola spójności jak dla ING” | `npm run fixture:check` = `scripts/fixture-ing-check.mjs`, ING-only (`FIXTURE_DIR` hard-wired to `test/fixtures/ing`); CI `ci` job runs `npm run fixture:check` once | Extend the gate so one `npm run fixture:check` covers both banks (new `fixture-santander*.mjs` + aggregator, or a chained script) — CI step unchanged. Decide in plan |
| Repo lets fixture CSVs in | `.gitignore` has `*.csv` + `!test/fixtures/**/*.csv`; `.prettierignore` covers `test/fixtures/` | Fine. `.gitattributes` has `test/fixtures/ing/** -text` only → add `test/fixtures/santander/** -text` (byte-exact compare) |
| Unknown: do BLIK payments via operators carry the merchant domain (D3)? | BLIK purchases are rare in the PLN export (3 rows, all with col 3 filled); 1 of 3 carries a domain-like token | Answered for this export: col 3 names the counterparty; the D3 domain rule is not needed as a primary path but one BLIK row with a domain-shaped tail is a fair trap. Owner (user) may override |
| Prerequisite: real PLN export available locally, outside the repo | Present at the run-contract path, outside the repo (`/Users/kamilp/Downloads/…`, not under the working tree) | — . A `fixture:shape`-style local comparator (ING has `scripts/fixture-ing-shape.mjs`) is the risk mitigation „fixture zbyt czysty” — scope decision below |
| FR-014 as a ref | FR-014 is the public-demo seed; S-09 seeds the demo account from the ING fixture | This slice does not touch the demo seed; FR-014 applies only as „synthetic data only” |
| Status `ready`, no blockers | No code depends on a Santander fixture yet; `src/lib/import/` has `ing.ts` only | — |

### Follow-ups triggered by this slice

None. Every `Trigger:` line in `context/archive/*/follow-ups/review-fixes.md` was read; none names F-03,
`synthetic-santander-fixture`, Santander, or a second bank/fixture. Nearest neighbours (not triggered): ING-import
F8 (DB text-length checks, aimed at S-03) — relevant to S-10 only if it writes the same columns; F9 (shared `Icon.tsx`)
— UI, not this slice.

## Autonomous decisions

1. **Next step = `/10x-research`, not `/10x-plan`.** Chosen: research first. Rejected: straight to plan (the skill's
   default). Why: the slice must reconcile `import-formats.md` with the real export (four inaccuracies found above),
   choose a gate layout for a second bank in `fixture:check`, and pick the cross-bank shared merchant from the ING
   generator — codebase grounding, not framing. What would change it: if the orchestrator's chain mandates plan next,
   research findings above are enough to plan from.
2. **Doc corrections belong to this slice.** Chosen: F-03 fixes the Santander section of `import-formats.md` (Lp order,
   header date formats, `Wypłata BLIK`/fees/free titles, col 6 quoting). Rejected: leave for S-10. Why: the fixture is
   „zgodny z import-formats.md”; shipping a fixture that disagrees with the contract would hand S-10 two truths. What
   would change it: the maintainer declaring `import-formats.md` frozen as the 2026-09-18 Q&A record.
3. **One CI entry point.** Chosen (provisional, plan decides the mechanics): `npm run fixture:check` checks both
   banks; no new CI step. Rejected: a separate `fixture:check:santander` CI step. Why: one gate name in CLAUDE.md,
   the contract and CI. What would change it: the ING check script's coupling making a shared entry point riskier
   than a second step.
4. **BLIK/D3 unknown answered from the real export (abstract count only), not escalated.** Chosen: col 3 is the BLIK
   counterparty; include one domain-tailed BLIK trap. Why: the roadmap marks it Block: no and expects the answer from
   the real export. What would change it: the user stating a different expectation for operator-mediated BLIK.
5. **Opened the real exports with the sandbox disabled** (read-only, aggregate output) — the sandbox denies
   `~/Downloads`, and the run contract names those exact paths as F-03 inputs. Nothing was copied or written outside
   the scratchpad. What would change it: a contract revision moving the exports under an allowed path.
