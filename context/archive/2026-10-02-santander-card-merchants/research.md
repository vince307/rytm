---
date: 2026-10-02T03:14:49+0200
researcher: Claude (autonomous run 2026-10-01-m2-santander, /10x-research step)
git_commit: 80caf10616cb87e2a30576eac433ef68150ec35f
branch: feat/santander-card-merchants
repository: Rytm
topic: "S-11 santander-card-merchants — how to turn a Santander card tail into a merchant key (city, quotes, ATM, store codes) without touching ING keys"
tags: [research, patterns, normalisation, santander, merchant-key]
status: complete
last_updated: 2026-10-02
last_updated_by: Claude (autonomous run, /10x-research)
---

# Research: Santander card tails → merchant patterns (S-11)

**Date**: 2026-10-02T03:14:49+0200
**Researcher**: Claude (autonomous run `2026-10-01-m2-santander`, research step)
**Git Commit**: `80caf10` (branch = `main` 9f63fd9 + the `/10x-new` docs commit)
**Branch**: `feat/santander-card-merchants`
**Repository**: Rytm

## Research Question

From `change.md` (§ Open questions for research, § Roadmap claims, § Follow-ups), no user interview (autonomous run):

- **Q1** How to recognise and strip the trailing city of a Santander card tail (closed list vs positional heuristic),
  1- and 2-word cities, without over-merging.
- **Q2** What real card tails look like beyond the fixture (aggregates only): city share, branch/store codes that are not
  `≥ 3` digits, shapes the fixture lacks.
- **Q3** Where the ATM rule (and every other Santander rule) lives — `rawMerchant` keyed on the `title`, or a rewrite of
  the stored `counterparty`.
- **Q4** Display name of a mixed (cross-bank) pattern via `derive.ts` `topVariant`.
- Constraint carried from `change.md`: no rule may re-key ING merchants.

Every candidate rule was measured on **both** the synthetic oracle (`test/fixtures/santander/expected.json`, 184
imported rows) **and** the real PLN export (counts only; the export path is in the gitignored agent contract).

## Summary

1. **The city must be stripped positionally, not from a closed list.** On the real PLN export the card tail ends in a
   place name for 56 of 57 distinct last tokens (by inspection; the 57th is a support-URL-like token), and those places
   are mostly villages and small towns: a list of the ~60 largest Polish cities covers **8 of 57** distinct last tokens,
   **87 of 229** distinct payment tails and **158 of 432** card-payment rows. A gazetteer would leave ~60 % of real rows
   unstripped. The Visa descriptor also **truncates** the city (2-word cities appear with a cut-off second word), so even
   a complete gazetteer would miss them. Rule: on a Santander card-payment tail, drop the **last token**; then drop one
   more when the new last token is a known first word of a 2-word Polish city (`NOWY/NOWA/STARA/BIALA/ZIELONA/SUCHA/…`)
   or repeats the dropped city (descriptor shape `<NAME> <CITY> <CITY>`).
2. **City stripping alone is not enough on real data — store/till codes dominate the residual splits.** The fixture's
   store numbers are pure `≥ 3`-digit tokens (`STORE_NUMBER` already drops them); real tails carry **alphanumeric store
   codes**, **2-digit** branch numbers, **till markers** (`K.<n>`), subscription IDs, and **5-digit codes glued onto a
   truncated name**. 96 of 229 distinct real payment tails contain a digit. A Santander-only code-token rule is needed
   (see Detailed Findings § Q2 for the exact shapes and the rule that measured best).
3. **Measured result of the recommended rule set (R10):** fixture **35 keys = 35 split-back oracle groups, 0 splits,
   0 over-merges, cross-bank `pizzeria trzy sery` equals the ING key**; real export **239 → 193 keys** against 183
   merchants by a private judgement labelling, **0 over-merged keys**, 6 merchants still split over 10 extra keys
   (current code: 0 over-merges, 17 merchants split over 56 extra keys). City stripping alone (R2) reaches the fixture
   target but leaves 47 extra keys on real data.
4. **Q3: all rules belong in the patterns layer, gated on the stored `title`, applied to the raw merchant before
   `normalizeMerchant` / `merchantKey`.** `derive.ts` `derivePatterns` is the single consumer of `rawMerchant` /
   `merchantKey` / `normalizeMerchant` in `src/` (grep over `src`, `scripts`, `supabase`); it already passes
   `row.title`, and `load.ts` `loadPatternData` selects `counterparty, title`. Rewriting the stored `counterparty`
   instead would break `fixture:check` (`scripts/fixture-santander-check.mjs` compares `rawMerchant` to the rule-5
   tail) and need a data migration. The ATM rule keys on the title's `WYPŁATA Z BANKOMATU KARTĄ` kind, not on the
   address shape: real ATM tails start with `UL ` **without a dot**, so a fix to `ADDRESS` would not reach them.
5. **Q4: apply the Santander rules to the *raw* string, so key and display agree.** `derivePatterns` computes
   `name = normalizeMerchant(raw)` and `rawKey = merchantKey(raw)` from the same `raw`; a key-only rule would leave
   city-suffixed/quoted display variants in the group and `topVariant` could pick one. With the raw-level rule the
   fixture's cross-bank pizzeria group has one display variant on both sides (`PIZZERIA TRZY SERY`).
6. **ING keys are safe by construction under the title gate:** 0 occurrences of `DOP. VISA` or `Wypłata BLIK` in the 4
   ING fixture CSVs (decoded cp1250). The ING key-text pin from `change.md` remains the test that proves it.
7. **New finding outside the fixture: real `Wypłata BLIK` rows carry the ATM address in col 3** (`Bankomat <operator> UL
   <street> <n>`), so they split per ATM (2 keys for 3 rows), while the fixture's ST06 has one fixed counterparty. A
   title-gated `Wypłata BLIK` → one pattern rule keeps the oracle (ST06 stays its own pattern, not `bankomat`) and fixes
   the real split. Plan decides (recommended in).
8. **Cross-bank join is ASCII-limited.** Santander tails are ASCII (0 non-ASCII distinct tails in the real export);
   ING keeps diacritics. Only merchants whose name has no Polish letters can join (the oracle's one case does).
   Diacritic folding would re-key ING; it stays out of scope (`change.md`), and the real cross-bank rate cannot be
   measured here (no real ING export among the run's inputs).

## Detailed Findings

### Current pipeline (what S-11 hooks into)

- `src/lib/import/santander.ts` `rawMerchantOf` (rule 5): for a card description matching `CARD`
  (`DOP. VISA <mask> <PŁATNOŚĆ KARTĄ|ZWROT PŁATNOŚCI KARTĄ|WYPŁATA Z BANKOMATU KARTĄ> <amount> <CUR> <tail>`) it stores
  only the collapsed tail in `counterparty`; `readStatement` stores the full description in `title` (`v[2].trim()`).
  So the card mask never reaches the merchant (ST01 already one pattern — confirmed: probe R0 shows no ST01 split).
- `src/lib/patterns/merchant.ts` `rawMerchant(counterparty, title)` applies only the ING operator rule (`OPERATORS`,
  `Nr transakcji` in the title); otherwise returns the collapsed counterparty. `normalizeMerchant` applies `SCHEME`,
  `ADDRESS` (`\s(UL|AL)\.\s.*$` — needs a leading space and a dot), `LEGAL_FORM`, `STORE_NUMBER` (`^\d{3,}$`),
  `dropDoubledPrefix`. `merchantKey` = `normalizeMerchant` lower-cased (`pl-PL`). The file header states rule order is
  load-bearing because S-04/S-05 store rows by key.
- `src/lib/patterns/derive.ts` `derivePatterns` pass 1: `raw = rawMerchant(row.counterparty, row.title)`,
  `rawKey = merchantKey(raw)`, display variant `normalizeMerchant(raw)`; `topVariant` = most rows, tie → code-point
  smallest; `resolveKey` applies user merges after normalisation.
- `src/pages/api/patterns/decision.ts` `unmerge` only clears `merged_into` of a user decision. **A normalisation
  over-merge cannot be undone by the user; an under-merge can be fixed by the existing merge (K22).** This asymmetry is
  why the measurements below weight over-merges as the failure that must be 0.

### Q1 — city recognition

Evidence (real PLN export, aggregates):

| Measure | Value |
| --- | --- |
| Data rows by kind | 432 card-payment debits, 3 card refunds (credit), 3 ATM debits, 3 `Zakup BLIK`, 3 `Wypłata BLIK`, 25 other debits, 14 other credits (= 483 data rows) |
| Distinct card-payment tails | 229 (231 incl. the 2 distinct ATM tails) |
| Tokens per distinct payment tail | 2: 21 · 3: 69 · 4: 91 · 5: 35 · 6: 12 · 7: 1 |
| Raw tail length | 12–37 characters; no tail with a double space or trailing space |
| Distinct last tokens (upper-cased) | 57; 18 of them occur in more than one letter case (`ALLCAPS` and `Titlecase`) |
| Last token is a place name | 56 of 57 by inspection (Polish localities incl. villages, plus ≥ 4 foreign cities); 1 support-URL-like token |
| Last token in a top-~60 Polish city list | 8 of 57 tokens · 87 of 229 tails · 158 of 432 rows |
| 2-word city (first word in the `NOWY/STARA/BIALA/…` list) | 4 distinct tails; truncated second words observed (the descriptor's city field is cut at ~13 characters) |
| Tail repeats the city (`<NAME> <CITY> <CITY>`) | present (several distinct tails); handled by the repeat rule |

Conclusions:

- **Closed list rejected**: covers ~37 % of real rows, cannot cover truncated 2-word cities, and is a data file to
  maintain. **Positional rule chosen**: the Visa descriptor is `<name ≤ ~23 chars> <city ≤ ~13 chars>`, so the last
  token is the city slot in the inspected data.
- **2-word cities**: a tiny prefix list (first words of multi-word Polish town names: `NOWY NOWA NOWE STARY STARA STARE
  BIALA BIALY BIALE ZIELONA ZIELONY SUCHA DABROWA`, plus foreign `LOS SAN` if wanted) handles all 4 fixture cases
  (`NOWY SACZ`, `BIALA PODLASKA`, `ZIELONA GORA`, `SUCHA BESKIDZKA`) and the near miss `… POD ZIELONA GORKA NOWY SACZ`
  (→ `bar mleczny pod zielona gorka`), and 4 real tails. A miss only leaves a single-raw pattern with an ugly name
  (no partition harm in the inspected data); an over-strip would require a name ending in one of these words right
  before the city.
- **Minimum remaining tokens**: `minLeft = 1` (strip even from a 2-token tail `KWIACIARNIA GDYNIA` → `kwiaciarnia`)
  vs `minLeft = 2` (keep 2-token tails whole). Measured: min1 = 193 real keys / 0 over-merges; min2 = 199 keys /
  0 over-merges; the fixture passes both (2-token tails are single-raw groups). Under min1, **36 of 178** real
  card-payment keys are a single word (generic words like a car-wash or ice-cream-shop noun) — today each is unique, so
  no over-merge, but a second same-noun shop in another town would merge irreversibly. **Recommend min1** (matches the
  oracle slugs `piekarnia`, `kwiaciarnia`, `antykwariat`, and real data shows 0 over-merges); record min2 as the
  fallback if the owner sees a wrong merge.
- PRD: FR-006 says only "normalizuje opis transakcji do sprzedawcy" (`context/foundation/prd.md` § Functional
  Requirements); FR-018 says Santander works "na tych samych zasadach co ING". Neither defines city handling — the
  contract is `context/foundation/import-formats.md` § Santander (tail = "sprzedawca i miasto", ASCII, "istotne dla
  łączenia sprzedawców między bankami (S-11)") and the oracle. **PRD silent → recommendation above.**

### Q2 — real tails beyond the fixture (shapes the fixture lacks)

Abstract shapes observed in the real export (no values):

1. `<CHAIN> <letter(s)+digits store code> K.<n> <CITY>` — the most frequent chain in the export appears under **24
   distinct tails** today (store code × till number × city); `K.<n>` / `K.<n>.` till markers also occur on another
   chain.
2. `<CHAIN> <2-digit branch> <CITY>` (`01`, `02`, `22`, `24` shapes) — `STORE_NUMBER` needs ≥ 3 digits, so these split.
3. `<SUBSCRIPTION> <5-char alnum id> <truncated word> <FOREIGN CITY>` — one subscription service under **7 distinct
   tails** in 7 months (a new id every charge).
4. `<truncated name><5 digits> <CITY>` — a terminal/merchant code **glued** onto the truncated name (several merchants).
5. `<COMPANY> <legal form> <CITY>` with truncated legal forms (`SP. Z O.O` without the final dot, `SP.Z.O.O`,
   `S.A` without dot, `SP z oo`, `SP. Z`): 23 distinct tails carry a legal-form-like token, the current `LEGAL_FORM`
   strips 16 of them. The 7 misses are single-raw merchants in the inspected data (display-only impact).
6. `"<NAME>" <CITY>` / `" <NAME>" <REST> <CITY>` — quotes at the start of the tail (4 distinct tails), not only
   mid-tail as in the fixture's ST15.
7. Commas inside the tail (2 distinct tails) — the description field is then quoted in the CSV and `santander.ts`
   `parseLine` reads it; no rule impact.
8. ATM tail `UL <STREET> <n> <CITY>` — `UL` without a dot (fixture uses `UL. ` / `AL. `).
9. Mixed letter case across tails of the same merchant/city — `merchantKey` lower-cases, so no split from case.

Candidate code-token rules (applied after the city rule, Santander card tails only; a rule never empties the tail —
if it would, the tokens are kept):

| Id | Rule | Real keys | Over-merged keys | Merchants split (extra keys) |
| --- | --- | --- | --- | --- |
| D0 | current `STORE_NUMBER` only | 227 (R4) | 0 | 11 (44) |
| D1 | drop any all-digit token | 215 | 1 | 8 (39) |
| D2 | drop any token containing a digit | 186 | 2 | 7 (11) |
| D2+NR | D2, but keep the token after `NR`/`NO` | 193 | 1 | 7 (11) |
| **D3** | drop a token matching `^[A-Z]{0,2}\d[\dA-Z]*\.?$` (store code / short id / bare number) or `^K\.\d+\.?$` (till) or `#`; strip trailing `\d{3,}` from a `^[A-Za-z]{3,}\d{3,}$` glued token; keep the token after `NR`/`NO` | **193** (with W-BLIK rule) | **0** | **6 (10)** |

The over-merges of D1/D2 were (abstractly): different numbered cooperative shops (`SKLEP NR <n>`) collapsing into one
key, and a glued `<truncated word><digits>` token removed entirely so its merchant collapsed onto a different shop
with the same generic first word. D3 avoids both. The 6 merchants D3 still splits: a fast-food chain whose descriptor
carries a location word, a discounter whose descriptor carries a street name instead of a number, an app store with
two descriptor styles, a subscription service with two descriptor styles, the largest convenience chain's corporate
descriptor vs its store descriptor, a caterer with/without legal form — all fixable by the user's merge (K22), none
fixable by a deterministic rule without a brand list.

### Measurements — every variant, both datasets

Fixture = 184 imported rows of the main oracle file; "oracle groups" = 34 patterns with the ST03 user-merge split
back by raw merchant (35 groups), as `test/unit/patterns.test.ts` `expectedGroups` does for ING. Cross-bank = all ST10
rows get one key equal to `merchantKey` of the ING oracle's `pizzeria-trzy-sery` raw. Real = all debit rows of the real
PLN export except card refunds (counted keys over every kind; card keys = card-payment + ATM rows), graded against a
**private judgement labelling** (chains/brands under several descriptors = one merchant; everything else = its own
tail; kept in the session scratchpad, never in the repo): 183 merchants.

| Variant | Rules | Fixture keys / splits / over / cross-bank | Real all keys / card keys / over-merged keys / split merchants (extra keys) |
| --- | --- | --- | --- |
| R0 | current code | 37 / 2 / 0 / no | 239 / 224 / 0 / 17 (56) |
| R1 | + ATM kind → `bankomat`, quotes stripped | 36 / 1 / 0 / no | 238 / 223 / 0 / 16 (55) |
| R2 | R1 + drop last token (min1) | 35 / 0 / 0 / yes | 230 / 215 / 0 / 13 (47) |
| R3 | R1 + drop last token (min2) | 35 / 0 / 0 / yes | 233 / 218 / 0 / 13 (50) |
| R4 | R2 + 2-word-city prefix + repeated city | 35 / 0 / 0 / yes | 227 / 212 / 0 / 11 (44) |
| R5 | R4 + D1 | 35 / 0 / 0 / yes | 215 / 200 / 1 / 8 (39) |
| R6 | R4 + D2 | 35 / 0 / 0 / yes | 186 / 171 / 2 / 7 (11) |
| R7 | R6 + NR guard | 35 / 0 / 0 / yes | 193 / 178 / 1 / 7 (11) |
| R8 | R7 + `Wypłata BLIK` → one key | 35 / 0 / 0 / yes | 192 / 178 / 1 / 6 (10) |
| **R10** | R4 + D3 + NR guard + `Wypłata BLIK` rule | **35 / 0 / 0 / yes** | **193 / 179 / 0 / 6 (10)** |
| R11 | R10 with min2 | 35 / 0 / 0 / yes | 199 / 185 / 0 / 9 (16) |

The grading of "over-merged" and "split" on real data is only as good as the private labelling (one judgement call:
a same-named delicatessen in two localities was labelled one merchant; it merges from R2 on). Fixture keys under R10
equal the oracle slugs (de-hyphenated) for 30 of 34 patterns; the 4 exceptions are partition-neutral: ST03 `marka`
(2 keys by design — user-merge), `wyplata-blik-gotowka` → `wypłata blik` (the BLIK-withdrawal rule's fixed name),
`sklep-rowerowy-sucha-beskidzka` → `sklep rowerowy`, `kino-nova` → `kino nova sala duza` (`change.md`: the slug text is
not a stripping rule).

Probe: copy of `src/lib/patterns/merchant.ts` + a title-gated pre-normaliser and a reader port of `santander.ts`
`parseLine`/`CARD`, run with `node --experimental-strip-types` in the session scratchpad (not committed).

### Q3 — where the rules live

- **Chosen location**: a Santander-card step inside (or called from) `merchant.ts` `rawMerchant(counterparty, title)`,
  gated on the title. `rawMerchant` already receives the title and is the only producer of `raw` for both
  `merchantKey` and `normalizeMerchant` in `derivePatterns`. Gates measured safe: `^DOP\. VISA \d{6}\*{6}\d{4}
  (PŁATNOŚĆ KARTĄ|WYPŁATA Z BANKOMATU KARTĄ) ` for card rules, `^Wypłata BLIK ` for the BLIK-withdrawal rule; 0 matches
  of either prefix in the 4 ING fixture CSVs.
- **Rejected**: changing `santander.ts` `rawMerchantOf` (the stored `counterparty`) — `scripts/fixture-santander-check.mjs`
  checks `expected.json` `rawMerchant` against rule 5 and the oracle's `rawMerchants` keep the city, so `fixture:check`
  would fail; and already-imported rows would keep the old value (data migration, deploy-window risk).
- **Rejected**: making `ADDRESS` match `UL`/`AL.` at the start — global (`normalizeMerchant` is shared with ING) and
  still misses the real `UL ` without a dot.
- **Card mask**: never needs stripping in the patterns layer (`CARD` keeps it out of `counterparty`); the title keeps
  it (S-10 carried risk, own data under RLS) — unchanged.
- **Card regex duplication**: `santander.ts` `CARD` is module-private; the patterns gate needs only the prefix and
  kind. Plan decides between exporting a shared constant from `santander.ts` and a local regex in `merchant.ts`
  (the S-10 precedent kept the oracle reader and the app reader as deliberate independent copies).

### Q4 — display name of a mixed pattern

- `derivePatterns` adds `normalizeMerchant(raw)` to the group's variants; `topVariant` picks the most frequent. With the
  rule applied to `raw`, every Santander row of the cross-bank pizzeria yields `PIZZERIA TRZY SERY`, and the ING raw
  `PIZZERIA TRZY SERY UL. MAKOWA 9 KRAKÓW` normalises to the same string (`ADDRESS` strips from ` UL. `), so the group has
  one variant. Quoted ST15 names display without quotes (`PUB POD KOGUTEM`, `KINO NOVA SALA DUZA`).
- In real data the same merchant appears in two letter cases; the variant with more rows wins, ties → code-point
  smallest (upper case first). No change needed.
- The `bankomat` pattern: a fixed string produced by the rule is the display name (lower-case key `bankomat`; the
  display casing, e.g. `Bankomat`, is a plan detail). It is data in the merchant-name slot of `PatternsTable.tsx`,
  not kit chrome — `change.md` decision 4 holds; no DESIGN-GAP.

### Protecting ING keys

- Gate as above; the rule code path is never entered for an ING row in the fixture (0 title matches).
- `test/unit/patterns.test.ts` grades only the partition (`expectedGroups`, `oracleGroups`), so the planned ING
  key-text pin (`change.md` § How this slice protects existing ING pattern keys) is still required.
- Santander rows imported between the S-10 deploy and S-11's are re-keyed; thresholds/decisions saved on their old keys
  are orphaned (`change.md` decision 3, [human] 6.11). Measured scale on the real export if the owner had imported it:
  239 → 193 keys, i.e. most card patterns change key.

## Code References

- `src/lib/patterns/merchant.ts` `rawMerchant`, `normalizeMerchant`, `merchantKey`, `ADDRESS`, `LEGAL_FORM`,
  `STORE_NUMBER` — the hook point and the shared ING rules that must not change.
- `src/lib/patterns/derive.ts` `derivePatterns`, `topVariant`, `resolveKey` — sole consumer; key and display derive
  from the same `raw`.
- `src/lib/patterns/load.ts` `loadPatternData` — selects `id, amount_minor, counterparty, title, occurred_on`.
- `src/lib/import/santander.ts` `CARD`, `rawMerchantOf`, `readStatement` — `counterparty` = tail, `title` = full
  description.
- `src/pages/api/patterns/decision.ts` `unmerge` case — clears a user merge only.
- `scripts/fixture-santander-check.mjs` `rawMerchantOf` — oracle check of rule-5 raws (reason not to change the reader).
- `test/unit/patterns.test.ts` `expectedGroups`, `oracleGroups`, `fixtureSources` — the ING partition test to mirror
  for Santander.
- `test/fixtures/santander/expected.json` `patterns[]`, `crossBank` — the oracle.

## Architecture Insights

- Pattern identity is computed at read time from stored raw text, so every normalisation change is a re-key; gating
  bank-specific rules on a bank-specific title signal keeps the other bank's keys byte-stable.
- Over-merge is the unrecoverable error (no user split of a normalisation key); under-merge is recoverable (merge).
  Rules should be chosen for 0 over-merges first, fewest splits second.
- The descriptor format (`name ≤ ~23` + `city ≤ ~13`, single spaces, ASCII) is the reason positional city stripping
  works; it is a property of the Visa clearing descriptor, not of Santander's CSV.

## Historical Context (from prior changes)

- `context/archive/2026-09-25-merchant-patterns/` — ING normalisation rules and their order (FR-006); F3 follow-up
  (`S.C.A`, `http://` tests) is adjacent, not triggered.
- `context/archive/2026-10-02-santander-csv-import/` — S-10: `counterparty` = rule-5 tail, `title` = description, no
  `Lp`; impl-review F4 (`banks.ts` `accountLabel`) assigned to S-11 (in scope by `change.md` decision 5; not researched
  further — a one-line fix).
- `context/archive/2026-10-01-synthetic-santander-fixture/` — F-03 oracle; [human] 3.9 product calls (ST03 user-merge,
  ST06 own pattern, ST11 fixed) are respected by R10.
- `context/foundation/import-formats.md` § Santander — historical claims checked: "końcówka … ASCII … pojedyncze spacje
  (2–7 tokenów)" **supported** (real: 0 non-ASCII, 2–7 tokens); "`Zakup BLIK …:<11 cyfr>` stała końcówka" **partial** —
  the real export's BLIK titles end in ` ref:<11 digits>`, not `:<11 digits>` (no S-11 impact: BLIK uses col 3);
  ATM tail "`<adres>`" **supported** but the real address starts `UL ` without a dot.

## Related Research

Not applicable — no earlier `research.md` on Santander normalisation.

## Open Questions

- **Wypłata BLIK as one pattern** (real-only shape): recommended in (title-gated, oracle-neutral); the plan decides and,
  if taken, the fixture could gain a second ATM address on ST06 (generator change in `scripts/fixture-santander.mjs`
  `buildST06`, regenerate) — a fixture follow-up, not required for S-11.
- **min1 vs min2** — measured both; recommend min1. Changes if the owner's real import shows a wrong cross-town merge
  of a generic one-word name.
- **Cross-bank coverage on real data** cannot be measured (no real ING export in the run's inputs); diacritic folding
  stays out of scope.
- **Santander BLIK through a payment operator** (2 real rows: col 3 is the operator with its address) yields the operator
  as merchant; the ING D3 domain rule does not apply (no `Nr transakcji`). Out of S-11 scope; candidate follow-up with
  `Trigger: Santander BLIK operator rows seen in a real import`.
- `import-formats.md` § Santander BLIK end-shape (`ref:`) — doc correction candidate, not S-11 behaviour.
