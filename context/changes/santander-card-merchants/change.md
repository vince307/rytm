---
change_id: santander-card-merchants
title: Santander card transactions grouped into the right merchant patterns, shared with ING
status: preparing
created: 2026-10-02
updated: 2026-10-02
archived_at: null
---

## Notes

Roadmap S-11 (`santander-card-merchants`), milestone M-2 (second bank — Santander), slice 3 of 3 and the milestone's
north star (`F-03 synthetic-santander-fixture → S-10 santander-csv-import → S-11`). Outcome: a Santander card
description yields a merchant without the card number and without the branch number; payments with both cards of one
account land in one pattern; ATM withdrawals form one pattern; the same merchant seen in ING and in Santander is one
pattern.
PRD refs: FR-018 (Santander "na tych samych zasadach co ING"), FR-006 (description → merchant normalisation), FR-007
(each transaction counts in exactly one pattern). Contract: `context/foundation/import-formats.md` § Santander
(card-description regex, rule 5, "Kształty do seeda"). Oracle: `test/fixtures/santander/expected.json` (F-03) —
34 patterns (25 `resolvedBy: normalization`, 8 `import`, 1 `user-merge`) plus `crossBank`
(`pizzeria-trzy-sery`, `frequent`, joined with `test/fixtures/ing/expected.json`). Worked examples:
`context/archive/2026-09-25-merchant-patterns/` (ING normalisation), `context/archive/2026-10-02-santander-csv-import/`
(the `counterparty` contract this slice builds on).

**Measured gap at identity time** (current `merchantKey(rawMerchant(row.rawMerchant, ""))` over the oracle's 184
imported rows, probe run on this branch = `main` 9f63fd9): **37 keys vs 34 oracle groups, 0 over-merges, 3 splits**:
- `siec-przyklad` (ST02) splits into `siec przyklad krakow` / `siec przyklad warszawa` — the branch number is already
  dropped by `STORE_NUMBER`; the trailing **city** is what splits it.
- `bankomat` (ST04) splits into one key per ATM address (`ul. przykladowa 5 warszawa`, `al. testowa 12 krakow`) —
  `ADDRESS` needs a space before `UL.`/`AL.`, and the ATM tail starts with it.
- `marka` (ST03) splits — **expected**: the oracle resolves it by user-merge (S-05), not normalisation.
- Cross-bank (ST10): ING raw `PIZZERIA TRZY SERY UL. MAKOWA 9 KRAKÓW` → `pizzeria trzy sery`; Santander tail
  `PIZZERIA TRZY SERY KRAKOW` → `pizzeria trzy sery krakow` — **not joined**.
- ST15 (`PUB "POD KOGUTEM" KRAKOW`, `KINO " NOVA" SALA DUZA GDANSK`): partition already right, but the display name
  keeps the quotes and the city; the README says S-11 removes the quotes.
- ST01 (two cards): already one pattern since S-10 (the card mask never enters `counterparty`).

**Scope at identity time:**
- Santander-card-only normalisation in `src/lib/patterns/merchant.ts` (or a sibling module): trailing-city stripping
  (1- and 2-word cities: `NOWY SACZ`, `BIALA PODLASKA`, `ZIELONA GORA`, `SUCHA BESKIDZKA`), quote stripping, and
  ATM rows → one `bankomat` pattern. The signal that a row is a Santander card row is its `title`
  (`DOP. VISA <mask> <kind> …`, kept verbatim by S-10 in `transactions.title`); `rawMerchant(counterparty, title)`
  already receives it, and `load.ts` already selects `counterparty, title`.
- Unit tests: the Santander partition against `expected.json` (user-merge split back, like the ING test in
  `test/unit/patterns.test.ts`), the cross-bank join, and an **ING key-text pin** (see below).
- Smoke: a Santander + ING import on one account shows one `pizzeria` pattern (match the rendered node, `>text<`).

**Out of scope:** `MARKA *Marka App` vs `MARKA APPS …` (ST03 — user-merge by the oracle, [human] 3.9); `Wypłata BLIK`
stays its own pattern (ST06, [human] 3.9); diacritic folding (no oracle case; would re-key ING); Santander on the demo
account (Parked); any change to the readers' `counterparty` contract (S-10).

**Migration expected: no.** Pattern keys are derived at read time (`derive.ts` `derivePatterns` →
`merchantKey(rawMerchant(counterparty, title))`); transactions store only the raw `counterparty`/`title`. No new table,
column, RPC or policy. `pattern_thresholds` / `pattern_decisions` store `merchant_key` text
(`20260927200000_pattern_thresholds.sql`, `20260928120000_pattern_decisions.sql`) — a Santander row saved between the
S-10 deploy and this one is orphaned by the new keys; see Autonomous decision 3.

### How this slice protects existing ING pattern keys

The ING oracle test (`test/unit/patterns.test.ts`) asserts a **partition**, never key strings — a rule that renames
every ING key consistently would stay green while orphaning every saved ING threshold/decision (stored by key text).
So:
1. Every new rule is gated on the Santander card title (`DOP. VISA …`); ING titles never carry it (0 occurrences in
   the ING fixture CSVs). The ING raws prove why the gate is load-bearing: `PIEKARNIA KŁOSEK PIEKARNIA KŁOSEK ŁÓDŹ` ends
   in a bare city and `PHU "PRZYKŁAD" JAN TESTOWY …` carries quotes — a global city or quote rule would re-key both.
2. A new test pins `merchantKey` **text** for every `rawMerchant` in `test/fixtures/ing/expected.json` to the value
   on `main` 9f63fd9 (computed before any rule changes).
3. `test/fixtures/ing/**`, `scripts/fixture-ing*.mjs` and the ING `expected.json` stay byte-identical
   (`npm run fixture:check`, `git diff main -- test/fixtures/ing scripts/fixture-ing*.mjs` empty).
4. The cross-bank join moves the Santander side onto the ING key, never the reverse.

### Kit bindings (design/rytm-os/prototype/, content.json)

No new UI. The slice changes which names and groups the existing views render.

| Kit view / key | Bound how | Gap |
| --- | --- | --- |
| `views/patterns.html`, `content.json` `patterns.*` (`title`, `columns`, `searchPlaceholder`, `sortOptions`) | `/patterns` list (`PatternsTable.tsx`) shows the normalised Santander merchant names | none |
| `views/pattern-wolt.html`, `patternDetail.*` (`transactions`, `rawDescription`) | pattern detail lists the rows of a mixed ING + Santander pattern; the raw description stays the bank's own text (the Santander `title` keeps the masked card number — S-10 carried risk, own data under RLS) | none — the kit has no per-row bank marker and the outcome does not need one |
| `views/fixed.html` (`fixedCosts`, K23) and `views/home.html` (`dashboard.*`) | consume the same derived patterns; names change, no markup changes | none |
| `patternActions.*` (merge, K22) | ST03 is resolved by the existing merge dialog | none |
| The `bankomat` pattern's display name | normalisation output (data, like any merchant name), not kit chrome | none — see Autonomous decision 4 |

There is no kit view to add. Next free gap ids if research finds one: **K27**, **G38**.

### Roadmap claims vs repo now (checked 2026-10-02 on `feat/santander-card-merchants` = `main` 9f63fd9)

| Roadmap / plan-time claim | Repo now | Correction |
| --- | --- | --- |
| Prerequisites S-10, F-03 (Backlog: "Ready: yes") | Both archived (`context/archive/2026-10-01-synthetic-santander-fixture/`, `context/archive/2026-10-02-santander-csv-import/`), merged in PR #17 | — ready |
| Baseline: "kreator importu woła wprost parser ING i zawsze pokazuje krok wyboru rachunku" | `ImportWizard.tsx` uses `detect.ts` (`readImportFile`, `buildPayload`, `DetectResult`) and dispatches ING / Santander | Stale (S-10). No wizard work in S-11 |
| Baseline: "zapis importu wyłącznie przez RPC `import_ing_statement`" | `/api/imports` calls `import_statement` (`p_source`); `import_ing_statement` kept for the expand window | Stale (S-10). Not touched |
| Baseline: "`imports.source` dopuszcza tylko `'ing'`, brak `lp`" | `imports_source_check` allows `('ing','santander')` (`20261002120000_import_statement_source.sql`); `Lp` deliberately not stored (S-10 decision, import-formats rule 7) | Stale. S-11 does not need `Lp` or `source` (the card title is the signal) |
| Baseline: "`rawMerchant()` czyta kolumny ING, `normalizeMerchant()` neutralne" | Still true — and sufficient as the entry point: Santander stores the rule-5 raw merchant in `counterparty` and the full description in `title` (`santander.ts` `rawMerchantOf`, row builder) | The Santander rules hook in where `rawMerchant` / `normalizeMerchant` already see `title` |
| Baseline: "copy kitu mówi „Santander wkrótce”" | Overridden by `copyExtra` (K26) in S-10 | Stale. No copy work in S-11 |
| Outcome: "sprzedawca bez numeru karty" | Already true: `CARD` regex in `santander.ts` puts only the tail in `counterparty` | Done by S-10; S-11 only proves it in the partition test (ST01) |
| Outcome: "…i numeru placówki" | `STORE_NUMBER` (`/^\d{3,}$/`) already drops `0101`/`0202`; the split left is the city | Work = city stripping, not branch-number stripping |
| Outcome: "płatności obiema kartami … tego samego wzorca" | Already true (probe: no ST01 split) | Test only |
| Outcome: "wypłaty z bankomatu tworzą jeden wzorzec" | Not true: one key per ATM address | In scope (ATM kind → `bankomat`) |
| Outcome: "ten sam sprzedawca z ING i z Santandera jest jednym wzorcem" | Not true: `… krakow` suffix | In scope (city stripping on card tails) |
| Unknowns: "—" | Open design questions remain: how a city is recognised (closed list vs heuristic), what the real export's tails look like beyond the fixture (aggregate shape re-check allowed by the contract), the `bankomat` display name | Research questions, not blockers |
| Risk: "oczekiwany wynik fixture ING musi pozostać bez zmian" | ING oracle is byte-checked by `fixture:check`, but `patterns.test.ts` checks only the partition, not key text | Add the ING key-text pin (above) |
| Backlog note: "normalizacja zmienia klucze wzorców Santandera — zapisane progi/decyzje po `merchant_key` (6.11)" | Confirmed: both tables key by `merchant_key` text; keys are read-time derived | Autonomous decision 3 |
| Backlog note: "Trigger: S-11 — F4 S-10: `banks.ts` `accountLabel` → `replace("{name}", () => name)`" | Confirmed: `accountLabel` still does `template.replace("{name}", name)` (a `$&`/`$1` in an account name expands) | Autonomous decision 5 |

### Follow-ups triggered by this slice

I read every `Trigger:` line in `context/archive/*/follow-ups/review-fixes.md` (8 files). **None names S-11 /
`santander-card-merchants` literally.** The S-11 triggers live elsewhere:

- **S-10 F4** (`src/lib/import/banks.ts` `accountLabel` string replacement expands `$&`; source:
  `context/archive/2026-10-02-santander-csv-import/reviews/impl-review.md` F4, restated in that slice's handoff §5 and
  the roadmap Backlog row S-11 as "Trigger: S-11"). **Take: in scope**, as one isolated fix with a unit test in
  `test/unit/banks.test.ts` (decision 5).
- **S-10 [human] 6.11** — accept that S-11 re-keys Santander card patterns. Bears directly on this slice; decision 3.
- **F-03 [human] 3.9** — the oracle's product calls S-11 is graded against: `Wypłata BLIK` its own pattern, ST03 by
  user-merge, `Oplata za …` fixed. **Take:** S-11 implements the oracle as it stands; reversing any call is a
  generator edit (`scripts/fixture-santander.mjs` `buildST06`/`buildST03`/`buildST11`) + regenerate, not a normaliser
  change. Stays a [human] row.
- **S-10 [human] 6.8** (owner imports the real Santander export locally) — relevant evidence for city stripping on
  real tails; stays human. Research may re-check tail shapes only as aggregates (contract § Run-specific inputs).

Not triggered, but adjacent (opportunistic, not required):
- **merchant-patterns F3** (`context/archive/2026-09-25-merchant-patterns/follow-ups/review-fixes.md`): standalone
  `S.C.A` and `http://` test cases for `normalizeMerchant`, no trigger line. S-11 edits the same test file; cheap to
  add. Plan decides.
- **F-03 O1** (`fixture-ing-shape.mjs` path guard): trigger is a change to that script; S-11 must not touch ING
  scripts. Not taken.
- **S-04 F4 / durable-decisions** "merchant key longer than 500 characters": S-11 only shortens keys. Not taken.

## Autonomous decisions

1. **Next step = `/10x-research`, not `/10x-plan`** (the skill's default).
   - Rejected: plan directly; `/10x-frame`.
   - Why: the core design question (how to recognise a trailing city without a gazetteer that over- or under-strips,
     where to gate the Santander rules, how `derive.ts` display variants interact with the cross-bank join) needs
     codebase grounding and an aggregate re-check of real card tails. The framing itself is not in doubt.
   - What would change it: the orchestrator's chain mandating plan next; the gap table above is enough to plan from.
2. **Santander rules gated on the card title, not global, and not on `imports.source`.**
   - Chosen: apply city/quote/ATM rules only when `title` matches the Santander card description.
   - Rejected: global rules in `normalizeMerchant` (re-keys ING raws like `… ŁÓDŹ`, `PHU "…"`); gating by
     `imports.source` (needs a join in `load.ts` for no gain — the title is already selected and unambiguous).
   - What would change it: research finding a non-card Santander row (BLIK/transfer `counterparty`) that also needs
     city stripping, or an ING title that matches the card regex.
3. **No key migration for thresholds/decisions saved on raw-tail Santander patterns; accept orphaning (S-10 6.11).**
   - Rejected: a data migration re-keying `pattern_thresholds` / `pattern_decisions` rows.
   - Why: it would re-implement the normaliser in SQL, and in the deploy window old code would read the new keys
     (breaks the backward-compat rule). The exposure window is S-10's deploy (2026-10-02) → S-11's deploy, and the
     agent cannot inspect production rows.
   - What would change it: the owner rejecting 6.11, or evidence of production thresholds/decisions on Santander
     keys — then a separate expand-safe re-key (app-side, on read) is planned.
4. **`bankomat` display name is normalisation data, not kit copy — no DESIGN-GAP.**
   - Why: every pattern name on `/patterns` is derived data; the oracle names the group `bankomat`
     (`import-formats.md` ST04). The exact display casing is a plan detail.
   - What would change it: research finding the label rendered as UI chrome (e.g. a badge or a fixed string outside
     the merchant-name slot) — then a K27 gap row + `copyExtra`.
5. **S-10 F4 (`banks.ts` `accountLabel`) taken into scope** although S-11 would not otherwise touch `banks.ts`.
   - Rejected: leaving it until "the file is touched".
   - Why: the roadmap and the S-10 handoff assign it to S-11 explicitly; it is a one-line fix plus a test, and a
     trigger that never fires rots.
   - What would change it: the plan judging it a distraction for the north-star slice — then it gets a follow-up row
     with a concrete trigger in this change's `follow-ups/review-fixes.md`.
6. **Did not open the real Santander exports in this step.** The probe above ran on the synthetic oracle only.
   Research may open them under the contract's privacy rules (aggregates only, via the symlink dir).

## Open questions for research

- **Q1 — city recognition.** Closed list of Polish cities (1–2 tokens, ASCII) vs a positional heuristic (drop the
  last 1–2 tokens of a ≥ N-token tail). The fixture has 1-word (`WARSZAWA`, `KRAKOW`, `OPOLE`, …) and 2-word
  (`NOWY SACZ`, `BIALA PODLASKA`, `ZIELONA GORA`, `SUCHA BESKIDZKA`) cities, a 2-token tail (`PIEKARNIA ZAKOPANE`),
  and a near-miss name token (`… POD ZIELONA GORKA NOWY SACZ`). Grading is by partition, so the slug text
  (`sklep-rowerowy-sucha-beskidzka`) is not a stripping rule — but the cross-bank key must equal ING's exactly.
- **Q2 — real tails.** What share of real card tails end in a recognisable city; any tails with a branch code that is
  not ≥ 3 digits (e.g. letter+digits); any tail shape the fixture lacks (aggregates only).
- **Q3 — ATM rule location.** Keyed off the `WYPŁATA Z BANKOMATU KARTĄ` kind in `title` (in `rawMerchant`) vs a
  rewrite of the stored `counterparty` (would need a data change — rejected by decision 3's reasoning).
- **Q4 — display name of a mixed pattern.** `derive.ts` `topVariant` picks the most frequent normalised variant; check
  that a cross-bank group never shows a city-suffixed or quoted variant.
