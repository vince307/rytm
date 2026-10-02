# Santander card merchants (S-11) — Implementation Plan

## Overview

A Santander card payment lands in the same merchant pattern however the bank's Visa descriptor spells the place, the
store code or the till: the city, quotes and store/till codes leave the merchant, every ATM withdrawal is one
`Bankomat` pattern, and a merchant seen in ING and in Santander (ASCII names) is one pattern. All rules are gated on
the Santander title stored by S-10, live in the patterns layer, and leave every ING pattern key byte-identical. No
migration, no new UI.

## Current State Analysis

Source: `research.md` (Q1–Q4, variant table R0–R11) and `change.md` (claims table). Anchors are symbols.

- **Pipeline.** `src/lib/import/santander.ts` `rawMerchantOf` stores only the card tail (`CARD` regex group 5) in
  `transactions.counterparty`; `readStatement` stores the full description in `title`. So the card mask never reaches
  a merchant (ST01 is already one pattern).
- **Hook point.** `src/lib/patterns/derive.ts` `derivePatterns` is the only consumer:
  `raw = rawMerchant(row.counterparty, row.title)`, `rawKey = merchantKey(raw)`, display variant
  `normalizeMerchant(raw)`, `topVariant` = most rows. A rule applied to `raw` changes key and display together.
  `src/lib/patterns/load.ts` `loadPatternData` already selects `counterparty, title`.
- **Shared rules.** `src/lib/patterns/merchant.ts` `normalizeMerchant` (`SCHEME`, `ADDRESS` = `\s(UL|AL)\.\s.*$`,
  `LEGAL_FORM`, `STORE_NUMBER` = `^\d{3,}$`, `dropDoubledPrefix`) is shared with ING; a global change re-keys ING
  (`PIEKARNIA KŁOSEK … ŁÓDŹ` ends in a bare city; `PHU "PRZYKŁAD" …` carries quotes).
- **Gap measured on the oracle** (184 imported rows): 37 keys vs 35 split-back oracle groups — ST02 splits by city,
  ST04 by ATM address, ST10 not joined with ING (`pizzeria trzy sery krakow` vs `pizzeria trzy sery`).
- **Gap on the real PLN export** (counts only, research): 239 keys, 0 over-merges, 17 merchants split over 56 extra
  keys; residual splits come from cities (mostly villages, a closed list covers 37 % of rows), 2-digit branches,
  alphanumeric store codes, `K.<n>` till markers, glued `<name><digits>` codes, subscription ids.
- **Tests.** `test/unit/patterns.test.ts` grades the ING oracle by **partition** only (`expectedGroups`), never key
  text; a consistent rename of every ING key would stay green while orphaning saved thresholds/decisions.
- **S-10 F4.** `src/lib/import/banks.ts` `accountLabel` does `template.replace("{name}", name)`: an account name
  containing `$&` / `$1` expands.

## Desired End State

- Oracle (`test/fixtures/santander/expected.json`): 35 keys = 35 split-back groups (34 patterns, ST03 user-merge
  split back), 0 splits, 0 over-merges; every ST10 row has key `pizzeria trzy sery` = the ING oracle key; aggregates
  of every non-user-merge group equal the oracle; names `SIEC PRZYKLAD`, `Bankomat`, `PUB POD KOGUTEM`,
  `KINO NOVA SALA DUZA`.
- Real PLN export (local, counts only, never in the repo or CI): after Phase 2 ≈ R4 (227 all keys / 212 card keys /
  0 over-merged keys); after Phase 3 ≈ R10 (193 / 179 / 0).
- ING: `merchantKey(rawMerchant(counterparty, title))` of every ING oracle row equals the text on `main` 9f63fd9,
  pinned by a test; ING fixtures and scripts have no diff.
- Smoke: on one account a Santander card import and an ING import of the same merchant render one pattern; ATM rows
  render one `Bankomat` pattern.

### Key Discoveries:

- `derivePatterns` computes key and display from the same `raw`, so the rule belongs before `normalizeMerchant`
  (research Q4); a key-only rule would leave city-suffixed display variants in a group.
- The real ATM tail starts `UL ` **without** a dot — the ATM rule keys on the title kind, not on the address shape.
- Over-merge is unrecoverable in the product (`api/patterns/decision.ts` `unmerge` clears only user merges);
  under-merge is fixable with the existing merge (K22). Rules are chosen for 0 over-merges first.
- `scripts/smoke.mjs` matchers accept arrays for `contains` / `notContains`.

## What We're NOT Doing

- Changing the stored `counterparty` (`santander.ts` `rawMerchantOf`) — `fixture:check` compares it with the
  oracle's rule-5 raws, and stored rows would need a data migration.
- Any rule outside the Santander title gate; any edit of `ADDRESS` / `LEGAL_FORM` / `STORE_NUMBER`; diacritic
  folding (would re-key ING; cross-bank join stays ASCII-only).
- A city gazetteer; a brand list; `MARKA *Marka App` vs `MARKA APPS …` (ST03 — user-merge by the oracle).
- Re-keying saved `pattern_thresholds` / `pattern_decisions` rows (S-10 [human] 6.11, decision 6).
- Santander BLIK through a payment operator, fixture ST06 with a second ATM address — follow-ups.
- Santander on the demo account (Parked). UI, copy or kit changes (no DESIGN-GAP).
- Editing `test/fixtures/**`, `scripts/fixture-*.mjs`, `design/rytm-os/`.

## Implementation Approach

Safety net first (pin ING key text while it is still main's), then the rules in two independently green steps: the
oracle-reaching rules (Phase 2, R4) and the real-data code-token rules (Phase 3, R10), then the end-to-end proof,
docs and the seam sweep (Phase 4). Each rule phase is measured on the oracle (CI test) and on the real export (local
count, recorded in the handoff only as counts).

## Critical Implementation Details

**Rule order inside the Santander step (load-bearing; it is what research measured as R10).** Given a row whose
`title` matches the card gate `^DOP\. VISA \d{6}\*{6}\d{4} (PŁATNOŚĆ KARTĄ|WYPŁATA Z BANKOMATU KARTĄ) `:
1. ATM kind → return `"Bankomat"`.
2. Replace every `"` with a space; split the collapsed tail on spaces.
3. City (minimum 1 token left, never empty), **at most three pops, each a single `if`, never a loop** (as measured
   by the research probe): if more than 1 token, pop the last token (`city`); then, if more than 1 token is left and
   the new last token is in `CITY_PREFIX` (upper-cased: `NOWY NOWA NOWE STARY STARA STARE BIALA BIALY BIALE ZIELONA
   ZIELONY SUCHA DABROWA LOS SAN`), pop one more; then, if more than 1 token is left and the new last token equals
   `city` case-insensitively (`<NAME> <CITY> <CITY>`), pop one more.
4. (Phase 3) Code tokens: drop a token matching `^[A-Z]{0,2}\d[\dA-Z]*\.?$`i, `^K\.\d+\.?$`i or equal to `#`, unless
   it is the **first** token (a brand such as `4F` / `5 SMAKOW` is a name, not a store code — plan review F2; measured
   on the real export: no count change vs R10) or the previous token matches `^(NR|NO)\.?$`i; strip trailing digits
   from a glued `^([A-Za-z]{3,})\d{3,}$` token; if every token would be dropped, keep the tokens from step 3. The `NR`
   guard protects only numbers of 1–2 digits: a kept `NR 123` still loses `123` to `normalizeMerchant` `STORE_NUMBER`
   (global, ING-shared, not changed) — see Known risks; unit cases for the guard use 1–2-digit numbers.
5. Return the tokens joined by one space. `normalizeMerchant` / `merchantKey` then run unchanged (legal form, store
   number, doubled prefix, lower-case).
A title matching `BLIK_GATE` = `^Wypłata BLIK .+:\d{11}$` (Phase 3; Santander's own end shape — the fixture's
`:<11 cyfr>` and the real ` ref:<11 cyfr>` both end in `:` + 11 digits, measured 2/2 fixture and 3/3 real rows) →
return `"Wypłata BLIK"`. A bare `startsWith("Wypłata BLIK")` is not enough: the phrase is not bank-specific, and an ING
BLIK cash withdrawal (no ING example in the fixture, so the key-text pin cannot see it) would be re-keyed (plan
review F1). Any other title → the step returns `null` and
`rawMerchant` behaves exactly as on `main`.

**Real-export measurement (local only).** The contract's symlink dir with the sandbox disabled; a harness in the
session scratchpad (the research probe `probe/measure.ts` is the reference) that loads the real module (e.g. `jiti`
from `node_modules` with `alias: { "@/": "<repo>/src/" }`) and prints counts only: all keys, card keys, and — when the
private labelling from research is present in the scratchpad — over-merged keys and split merchants. Never a value,
never a file name, never in the repo or CI. If the scratchpad harness/labelling is missing, report key counts only
and say so (`ARTIFACT GAP` only if the export itself is unreadable).

## Phase 1: Safety net — ING key-text pin, `accountLabel` fix

### Overview

Characterisation tests that pin today's behaviour before any rule changes, plus the S-10 F4 one-line fix. No
normalisation change.

### Changes Required:

#### 1. ING key-text pin

**File**: `test/unit/patterns.test.ts`

**Intent**: Catch any change of ING key **text**, which the partition test cannot see.

**Contract**: New `describe("ING merchant keys — text pin (S-11)")`: a literal record `ING_KEYS: Record<string,
string>` from every distinct non-null `rawMerchant` of `test/fixtures/ing/expected.json` to its key computed on this
branch before Phase 2 (= `main` 9f63fd9); for every imported row of the ING main fixture (`fixtureSources()`),
`merchantKey(rawMerchant(counterparty, title))` equals `ING_KEYS[row.rawMerchant]` (join rows to the oracle by
`bankTxId`); the record covers every distinct oracle raw (no missing, no extra entry).

#### 2. `normalizeMerchant` cases (merchant-patterns F3)

**File**: `test/unit/patterns.test.ts`

**Intent**: Close `context/archive/2026-09-25-merchant-patterns/follow-ups/review-fixes.md` F3 (cheap, same file).

**Contract**: `it.each` rows in `describe("normalizeMerchant")` for a standalone `S.C.A` legal form and an
`http://` (not `https://`) scheme, with the outputs current code produces.

#### 3. `accountLabel` (S-10 F4)

**File**: `src/lib/import/banks.ts`, `test/unit/banks.test.ts`

**Intent**: An account name is inserted literally.

**Contract**: `template.replace("{name}", () => name)`; new case: a name containing `$&` and `$1` renders verbatim.

### Success Criteria:

#### Automated Verification:

- `npm test`: vitest baseline + the new pin / F3 / F4 cases, 0 failed
- Deliberate break 1: `merchantKey` returns the key with spaces replaced by `-` → the F-02 `fixture partition` test stays green and the ING key-text pin goes red; restore → green (meta-check: proves the pin catches what the partition cannot)
- Deliberate break 2: revert `accountLabel` to `replace("{name}", name)` → the `$&` case goes red; restore → green
- `git diff --exit-code main -- test/fixtures scripts src/lib/patterns` (no rule changed in this phase)
- Full local gate vs baseline (contract): lint 0 errors, astro check 0 errors, fixture:check OK, vitest + delta, build OK, pgTAP Δ0, smoke Δ0

#### Manual Verification:

- [reviewer] `ING_KEYS` was generated from the code on this branch before any rule change (not hand-typed), and holds no real-export value

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 2: Santander card step — ATM, quotes, city

### Overview

The title-gated Santander step with rules 1–3 and 5 (Critical Implementation Details). Reaches the oracle: 0 splits,
cross-bank join.

### Changes Required:

#### 1. Santander card step

**File**: `src/lib/patterns/santander-card.ts` (new)

**Intent**: One pure, import-free module that turns a Santander card row into the raw merchant used by the patterns
layer; ING rows never enter it.

**Contract**: `export function santanderCardMerchant(counterparty: string, title: string): string | null` — `null`
unless the title matches the card gate; ATM kind → `"Bankomat"`; payment kind → rules 2, 3, 5. `CARD_GATE` and
`CITY_PREFIX` are module constants; a header comment states: gate mirrors `src/lib/import/santander.ts` `CARD` (prefix
and kinds only, a deliberate independent copy like S-10's oracle/app readers), rules are positional by design
(research Q1), minimum 1 token, and order is load-bearing (keys are stored by S-04/S-05).

#### 2. Hook

**File**: `src/lib/patterns/merchant.ts`

**Intent**: `rawMerchant(counterparty, title)` returns `santanderCardMerchant(counterparty, title)` when non-null,
before the operator rule; otherwise unchanged. The file header names the Santander step.

#### 3. Tests

**File**: `test/unit/santander-card.test.ts` (new), `test/unit/santander-patterns.test.ts` (new)

**Contract**:
- `santander-card.test.ts` (synthetic values only): a 2-token tail keeps its first token (`KWIACIARNIA GDYNIA` →
  `KWIACIARNIA`); a 1-token tail is kept; 2-word city (`… SUCHA BESKIDZKA`), truncated second word (`… NOWY TA`), the
  near miss `BAR MLECZNY POD ZIELONA GORKA NOWY SACZ` → `BAR MLECZNY POD ZIELONA GORKA`; repeated city
  (`<NAME> RADOM RADOM`); quotes mid-tail and at tail start; mixed case; ATM kind with a dot-less `UL ` address →
  `Bankomat`; two card masks → same result; `null` for: `ZWROT PŁATNOŚCI KARTĄ`, `Zakup BLIK …`, `Przelew …`, an
  ING-style title (`Płatność kartą`), every title of the ING main fixture.
- `santander-patterns.test.ts`, mirroring `patterns.test.ts` `expectedGroups`: Santander main fixture →
  `parseSantanderStatement` → `buildSantanderPayload`; zip the payload transactions with the oracle's imported rows
  in file order (assert `occurredOn` and `amountMinor` per index), id = `String(lp)`; `derivePatterns` gives 35
  patterns equal to the 35 split-back oracle groups, 184 ids, sum 1342109; aggregates of every non-user-merge group
  equal the oracle; names `SIEC PRZYKLAD`, `Bankomat`, `PUB POD KOGUTEM`, `KINO NOVA SALA DUZA`; cross-bank: every
  ST10 key equals `merchantKey(rawMerchant(<ING oracle pizzeria-trzy-sery rawMerchants[0]>, ""))` and equals
  `"pizzeria trzy sery"`, and `derivePatterns` over ING main + Santander main sources yields one pattern holding all
  ING and Santander pizzeria ids, named `PIZZERIA TRZY SERY`, type = `crossBank[0].type`.

### Success Criteria:

#### Automated Verification:

- `npm test`: Phase 1 count + the new files, 0 failed; ING key-text pin and F-02 partition unchanged and green
- Deliberate break 1: drop the title gate (rules run for every row) → the ING key-text pin goes red; restore → green (meta-check: the ING partition test alone would not catch it — the gate is load-bearing)
- Deliberate break 2: skip the city rule → the Santander partition (ST02 split) and the cross-bank case go red; restore → green
- Deliberate break 3: empty `CITY_PREFIX` → only the 2-word-city unit cases go red (meta-check: the oracle partition stays green, since its 2-word cities are single-raw groups — the unit cases are the only guard, say so in the handoff)
- `git diff --exit-code main -- test/fixtures scripts/fixture-ing.mjs scripts/fixture-ing-check.mjs scripts/fixture-ing-shape.mjs src/lib/import/santander.ts`
- Full local gate vs baseline: lint, astro check, fixture:check, vitest + delta, build, pgTAP Δ0, smoke Δ0

#### Manual Verification:

- [reviewer] Real-export measurement (local, counts only, see Critical Implementation Details) ≈ R4: all keys 227, card keys 212, 0 over-merged keys; any deviation explained in the handoff; no value from the export in code, tests, handoff or commit

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 3: Code tokens and BLIK withdrawals

### Overview

Rule 4 (store/till codes with the `NR` guard) and the `Wypłata BLIK` rule. Oracle-neutral (stays 35/0/0), cuts real
splits from R4 to R10.

### Changes Required:

#### 1. Rules

**File**: `src/lib/patterns/santander-card.ts`

**Intent**: Remove descriptor noise that splits one merchant on real data, never merging two merchants.

**Contract**: rule 4 exactly as in Critical Implementation Details (after the city rule, first token never dropped);
a title matching `BLIK_GATE` (`^Wypłata BLIK .+:\d{11}$`) → `"Wypłata BLIK"` whatever the counterparty (both the
` ref:` and the `:` end shapes match it). The exported function keeps its name and signature (rename only if the seam sweep finds the name wrong; then
update every caller).

#### 2. Tests

**File**: `test/unit/santander-card.test.ts`, `test/unit/santander-patterns.test.ts`

**Contract**: synthetic cases: `<CHAIN> A12 K.3 <CITY>` → `<CHAIN>`; `<CHAIN> 01 <CITY>` and `<CHAIN> 22 <OTHER
CITY>` → same key; `SKLEP NR 12 <CITY>` vs `SKLEP NR 7 <CITY>` → different keys; a 3-letter+digits token (`ABC12`)
kept; glued `<WORD>12345 <CITY>` → `<WORD>`; `#` dropped; `12345 <CITY>` keeps `12345` (never empty); two
`Wypłata BLIK` titles with different counterparties (one ending `:<11 digits>`, one ` ref:<11 digits>`) → same key
`wypłata blik`; an ING-shaped title `Wypłata BLIK <dd.mm.yyyy> Nr transakcji <digits>` (no `:<11 digits>` end) →
`null`; a code-shaped first token (`4F SKLEP <CITY>`, `5 SMAKOW <CITY>`) is kept; Santander partition test still 35/0/0, and the ST06 group is still its own pattern (not `Bankomat`).

### Success Criteria:

#### Automated Verification:

- `npm test`: Phase 2 count + new cases, 0 failed; Santander partition, cross-bank and ING pin unchanged and green
- Deliberate break 1: remove the `NR` guard → the `SKLEP NR` case goes red; restore → green (meta-check: the oracle has no `NR` shape, so the unit case and the local real measurement are the only guards — the real run with the break should report > 0 over-merged keys; record if checked)
- Deliberate break 2: make the BLIK rule return `"Bankomat"` → the ST06-own-pattern assertion goes red; restore → green
- Full local gate vs baseline: lint, astro check, fixture:check, vitest + delta, build, pgTAP Δ0, smoke Δ0

#### Manual Verification:

- [reviewer] Real-export measurement ≈ R10: all keys 193, card keys 179, 0 over-merged keys, ≤ 6 merchants split; deviation explained; counts only

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 4: End-to-end proof, docs and seam sweep

### Overview

Smoke proves the join and the ATM pattern through the real endpoint and page; docs describe the rules; the screens
are captured; seams left by Phases 1–3 are swept.

### Changes Required:

#### 1. Smoke

**File**: `scripts/smoke.mjs`

**Intent**: Prove S-11's outcome end to end without touching any existing step.

**Contract**: on the re-created account, after "santander import with a bank transaction id is rejected" and before
"delete re-created account (cleanup)":
- `santanderCardPayload`: `source: "santander"`, account `22222200000000000000000099`, period 2026-06-01..2026-06-30
  (disjoint from the existing May payload), `bankTxId: null`, card rows with real-shaped titles
  (`DOP. VISA 123456******1111 PŁATNOŚĆ KARTĄ 18.50 PLN PIZZERIA SMOKE KRAKOW`, the same merchant with card `…2222`
  and `WARSZAWA`), and two ATM rows (`… WYPŁATA Z BANKOMATU KARTĄ … UL SMOKOWA 5 KRAKOW`, another address);
  `counterparty` = the tail, as the reader stores it.
- `ingPizzeriaPayload`: ING, account `11111100000000000000000097`, June 2026, one debit `PIZZERIA SMOKE UL. SMOKOWA 1
  KRAKÓW` with a unique 18-digit `bankTxId`.
- Steps: both imports → 302 `/imports/result?id=`; `/patterns` contains `>PIZZERIA SMOKE<` and notContains
  `>PIZZERIA SMOKE KRAKOW<`, `>PIZZERIA SMOKE WARSZAWA<`; `/patterns` contains `>Bankomat<` and notContains
  `>UL SMOKOWA 5 KRAKOW<`. Rendered-node needles only (contract rule).

#### 2. Docs

**File**: `context/foundation/import-formats.md`, `CLAUDE.md`

**Contract**:
- `import-formats.md` § Santander: a short "Normalizacja sprzedawcy (S-11)" paragraph (title gate, rule order, min 1
  token, `Bankomat`, `Wypłata BLIK`, ASCII-only cross-bank join); rule 5 / ATM wording switched from future ("dopiero
  po normalizacji S-11") to present; the `Zakup BLIK` / `Wypłata BLIK` end shape notes that real exports end in
  ` ref:<11 cyfr>` and the fixture in `:<11 cyfr>` (shape only).
- `CLAUDE.md` `npm test` line mentions the Santander partition and the ING key-text pin.

#### 3. Seam sweep

**File**: everything touched in Phases 1–4

**Contract**:
- One card-gate regex in the patterns layer (`santander-card.ts`), with the comment pointing at `santander.ts`
  `CARD`; no copy of the rules in `merchant.ts` or `derive.ts`.
- No duplicated test helper between `patterns.test.ts` and `santander-patterns.test.ts` beyond the oracle-specific
  loaders (extract a shared helper to `test/unit/` only if both files hold the same function body).
- Comments: `merchant.ts` header, `santander.ts` `rawMerchantOf` (mentions that S-11 normalises in the patterns
  layer), smoke header list; no stale "S-11 will" wording in `src/`, `scripts/smoke.mjs` or `import-formats.md`.
- No `TODO`; no kit row needed (`grep -n "K27\|G38" context/foundation/design-kit.md` empty).
- `follow-ups/review-fixes.md` rows still accurate (update a row if a phase took it).

### Success Criteria:

#### Automated Verification:

- Smoke against `astro dev` on :4398: baseline + 4 PASS (2 imports, join, ATM), 0 FAIL; `git diff main -- scripts/smoke.mjs` shows only added lines
- Deliberate break: `rawMerchant` skips the Santander step → the join and `Bankomat` smoke steps go red; restore → green (meta-check: needles are rendered nodes `>…<`, so the island's serialized props cannot satisfy them)
- Seam greps: `grep -rn "DOP\\\\. VISA" src/lib/patterns` → one file; `grep -rn "S-11 will\|dopiero po normalizacji S-11" src scripts/smoke.mjs context/foundation/import-formats.md` → nothing; `grep -rn "TODO" src/lib/patterns test/unit/santander-*.test.ts` → nothing
- `git diff --exit-code main -- test/fixtures scripts/fixture-ing.mjs scripts/fixture-ing-check.mjs scripts/fixture-ing-shape.mjs design/`
- Full local gate vs baseline: lint 0 errors, astro check 0 errors, fixture:check OK, vitest (Phase 3 count), build OK, pgTAP Δ0, smoke + 4

#### Manual Verification:

- [visual] Screenshots at 1280 px and ~400 px, local test account with the ING main fixture and the Santander main fixture imported (imports deleted afterwards): `/patterns` list (one `PIZZERIA TRZY SERY` row, `Bankomat`, `PUB POD KOGUTEM`, `SIEC PRZYKLAD`); `/patterns` filtered by "pizzeria" (one row); pattern detail of `PIZZERIA TRZY SERY` (rows of both banks, raw descriptions as the banks wrote them); pattern detail of `Bankomat` (two addresses); `/fixed` (Santander fixed patterns by normalised names) — compared with kit `patterns.html` / `pattern-wolt.html` / `fixed.html`, no horizontal scroll, tokens only
- [reviewer] Seam sweep complete; the rules match Critical Implementation Details in order; no real-export value anywhere in the diff
- [human] F-03 3.9 carried: confirm the oracle's product calls (`Wypłata BLIK` own pattern, ST03 user-merge, `Oplata za …` fixed)
- [human] S-10 6.11 carried: accept that S-11 re-keys Santander card patterns (real-export scale 239 → 193 keys); thresholds/decisions saved on old keys are orphaned
- [human] Owner imports the real Santander PLN export locally (S-10 6.8) and checks the patterns: no wrong cross-town merge of a generic one-word name (min-1 rule), `Bankomat` and `Wypłata BLIK` each one pattern
- [human] Accept min 1 token (decision 3): a one-word generic name (e.g. a car wash) in two towns merges irreversibly — the fallback is min 2 (+6 real keys); the same applies to the `CITY_PREFIX` pop leaving one word (Known risks)

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Testing Strategy

### Unit Tests:

- ING key-text pin (every ING oracle raw); F3 `normalizeMerchant` cases; `accountLabel` `$&`.
- `santanderCardMerchant` per rule and per gate (synthetic values), including every ING main-fixture title → `null`.
- Santander oracle partition + aggregates + names; cross-bank key and joined pattern.

### Integration Tests:

- Smoke: Santander card import + ING import on one account → one pattern; ATM rows → one `Bankomat` pattern.
- pgTAP unchanged (no schema change).

### Manual Testing Steps:

1. Import the ING main fixture and the Santander main fixture on the local test account.
2. `/patterns`: one `PIZZERIA TRZY SERY` row with both banks' rows in its detail; one `Bankomat`; quotes gone.
3. Delete both imports. Take the screenshots listed in Phase 4.

## Performance Considerations

A few regexes per Santander card row at read time; `derivePatterns` already runs per request over ≤ `MAX_PAGES`
pages. Negligible.

## Migration Notes

None. Keys are read-time derived. Rollback = revert the code; keys return to S-10's. Thresholds/decisions saved on a
Santander key in either version are orphaned by the other (accepted, [human] 6.11).

## Autonomous decisions

Recorded in place of the skill's questions (run contract rule 1).

| # | Decision | Chosen | Rejected | Why | What would change it |
| --- | --- | --- | --- | --- | --- |
| 1 | Complexity / questions | MEDIUM, 0 questions | Interview | Research measured every candidate rule on both datasets and recommended one | A product owner available |
| 2 | City recognition | Positional: last token + 2-word prefix list + repeated city | Gazetteer | A closed list covers 37 % of real rows and cannot handle truncated 2-word cities | Another account where the last token is often not a place |
| 3 | Minimum tokens left | min 1 (`[human]` row) | min 2 | Matches the oracle slugs, 0 over-merges on real data; min 2 costs 6 real keys | An observed wrong cross-town merge of a one-word name → min 2 |
| 4 | Code-token rule | D3 + `NR`/`NO` guard | D1, D2, D2+NR, none | Only variant with 0 over-merges and fewest splits (R10) | A real brand token matching the code shape causing an over-merge |
| 5 | `Wypłata BLIK` | One pattern `Wypłata BLIK` (title-gated) | Per-ATM BLIK patterns | Real rows split per ATM; oracle-neutral (ST06 stays its own pattern, never merged with `Bankomat` — `import-formats.md` respected) | Owner wanting per-ATM BLIK withdrawals |
| 6 | Saved thresholds/decisions on old Santander keys | Accept orphaning, no migration | SQL re-key; app-side alias | SQL would duplicate the normaliser and break the deploy-window rule; exposure window is one deploy | Owner rejecting 6.11, or production rows on Santander keys |
| 7 | Rule location | New `src/lib/patterns/santander-card.ts`, called first in `rawMerchant` | Inside `normalizeMerchant`; in the reader (`rawMerchantOf`) | Key and display agree; ING path untouched; reader change breaks `fixture:check` and stored rows | A second bank needing the same positional rules (then generalise the module) |
| 8 | Card-gate regex source | Local constant in `santander-card.ts`, comment to `santander.ts` `CARD` | Export `CARD` from the reader | Keeps patterns layer independent of the import layer; S-10 precedent of deliberate copies; the gate needs only prefix + kind | The descriptor format changing (then both change — sweep grep finds them) |
| 9 | Display names | `Bankomat`, `Wypłata BLIK` (data in the name slot, no DESIGN-GAP) | Lower-case `bankomat`; kit copy key | Names are derived data like every merchant name (`change.md` decision 4) | The label rendered as UI chrome |
| 10 | S-10 F4 | In Phase 1 | Follow-up | Assigned to S-11 by the roadmap; one line + test | — |
| 11 | merchant-patterns F3 | In Phase 1 | Leave | Same test file, two rows | — |
| 12 | `import-formats.md` BLIK `ref:` shape | Doc note in Phase 4 | Follow-up | Shape-only fact found by research; prevents a stale contract | — |
| 13 | Phase split | 4 phases (safety net / oracle rules / real-data rules / e2e + sweep) | One rules phase | Each phase independently green and measurable (R4 then R10) | — |
| 14 | PRD / contract literal text | No deviation: FR-006/FR-018 silent on cities; `import-formats.md` ATM/BLIK lines and the F-03 partition hold. Oracle slug text (`sklep-rowerowy-sucha-beskidzka`, `kino-nova`, `wyplata-blik-gotowka`) is not matched literally — partition is the contract (`change.md`) | — | — | The owner reading slugs as key text |
| 15 | Plan review (2026-10-02) | `BLIK_GATE` on Santander's `:<11 digits>` end shape; first token never a code token; single-`if` city pops; NR-guard limit and prefix-pop risk recorded | `startsWith("Wypłata BLIK")`; NR glue; prefix pop needing ≥ 2 left | Each fix measured on the real export: no count change for the applied ones, +1 split for the rejected ones | A real ING `Wypłata BLIK` title ending in `:<11 digits>`; an observed `NR <≥3 digits>` over-merge |

## Known risks

- min 1: a generic one-word name in two towns merges and the user cannot split it ([human] row).
- Cross-bank join only for ASCII names (Santander tails are ASCII, ING keeps diacritics); the real rate is unmeasured
  (no real ING export among the inputs) — follow-up.
- 6 real merchants still split (descriptor styles); fixable with the existing merge.
- Positional rule assumes the Visa descriptor keeps the city as the last token; an online merchant without a city
  loses its last word. Usually display only, but an aggregator descriptor `<AGG> *<MERCHANT>` with no city slot
  would reduce to `<AGG>` and merge different merchants (measured on the real export: 2 distinct `*` tails, neither
  reduced to one token — plan review F5).
- `CITY_PREFIX` pop may leave one generic word: a name ending in a prefix word (`<GENERIC> STARY <CITY>`) reduces to
  `<GENERIC>` and can merge across towns. Requiring ≥ 2 tokens to remain for the prefix pop costs +1 real split
  (194 keys / 7 split merchants, 0 over-merges either way), so R10 is kept; covered by [human] 4.11 and FU4 (plan
  review F4).
- The `NR`/`NO` guard is partial: a guarded number of ≥ 3 digits is still dropped by `normalizeMerchant`
  `STORE_NUMBER` (`SKLEP NR 123` and `SKLEP NR 456` → `sklep nr`). Gluing the number to the guard (`NR123`) costs +1
  real split against the private labelling (chains under several numbers labelled one merchant), so not applied; the
  same merge already exists for ING (plan review F3).

## References

- Research: `context/changes/santander-card-merchants/research.md`; identity: `change.md`
- Analogue: `context/archive/2026-09-25-merchant-patterns/plan.md`; previous slice:
  `context/archive/2026-10-02-santander-csv-import/plan.md` (F4, 6.11)
- Contract: `context/foundation/import-formats.md` § Santander; oracle: `test/fixtures/santander/expected.json`
  (`patterns`, `crossBank`), `test/fixtures/ing/expected.json`
- Code: `src/lib/patterns/merchant.ts`, `derive.ts`, `load.ts`; `src/lib/import/santander.ts` (`CARD`,
  `rawMerchantOf`); `src/lib/import/banks.ts` `accountLabel`; `scripts/smoke.mjs`
- Follow-ups: `context/changes/santander-card-merchants/follow-ups/review-fixes.md`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Safety net — ING key-text pin, `accountLabel` fix

#### Automated

- [ ] 1.1 `npm test` baseline + pin / F3 / F4 cases, 0 failed
- [ ] 1.2 Deliberate break 1: dashed `merchantKey` → partition green, ING pin red; restored → green
- [ ] 1.3 Deliberate break 2: old `accountLabel` replace → `$&` case red; restored → green
- [ ] 1.4 No rule, fixture or script changed vs `main`
- [ ] 1.5 Full local gate vs baseline (vitest + delta, others Δ0)

#### Manual

- [ ] 1.6 [reviewer] `ING_KEYS` generated from pre-change code, no real-export value

### Phase 2: Santander card step — ATM, quotes, city

#### Automated

- [ ] 2.1 `npm test` + `santander-card` / `santander-patterns` files, 0 failed; ING pin and F-02 partition green
- [ ] 2.2 Deliberate break 1: no title gate → ING pin red; restored → green
- [ ] 2.3 Deliberate break 2: no city rule → Santander partition and cross-bank red; restored → green
- [ ] 2.4 Deliberate break 3: empty `CITY_PREFIX` → only 2-word-city unit cases red; restored → green
- [ ] 2.5 ING fixtures/scripts and `santander.ts` unchanged vs `main`
- [ ] 2.6 Full local gate vs baseline

#### Manual

- [ ] 2.7 [reviewer] Real-export measurement ≈ R4 (227 / 212 / 0 over), counts only

### Phase 3: Code tokens and BLIK withdrawals

#### Automated

- [ ] 3.1 `npm test` + code-token / BLIK cases, 0 failed; partition, cross-bank, ING pin green
- [ ] 3.2 Deliberate break 1: no `NR` guard → `SKLEP NR` case red; restored → green
- [ ] 3.3 Deliberate break 2: BLIK rule returns `Bankomat` → ST06 assertion red; restored → green
- [ ] 3.4 Full local gate vs baseline

#### Manual

- [ ] 3.5 [reviewer] Real-export measurement ≈ R10 (193 / 179 / 0 over, ≤ 6 split), counts only

### Phase 4: End-to-end proof, docs and seam sweep

#### Automated

- [ ] 4.1 Smoke baseline + 4 PASS, 0 FAIL; smoke diff additions only
- [ ] 4.2 Deliberate break: `rawMerchant` skips the Santander step → join and `Bankomat` steps red; restored → green
- [ ] 4.3 Seam greps: one card gate in patterns, no stale S-11 future wording, no TODO
- [ ] 4.4 ING fixtures/scripts and kit unchanged vs `main`
- [ ] 4.5 Full local gate vs baseline (smoke + 4)

#### Manual

- [ ] 4.6 [visual] `/patterns` list, filtered "pizzeria", detail `PIZZERIA TRZY SERY`, detail `Bankomat`, `/fixed` at 1280 px and ~400 px vs kit
- [ ] 4.7 [reviewer] Seam sweep complete, rule order as specified, no real-export value in the diff
- [ ] 4.8 [human] F-03 3.9: confirm the oracle's product calls
- [ ] 4.9 [human] S-10 6.11: accept re-keying of Santander card patterns
- [ ] 4.10 [human] Owner imports the real Santander PLN export and checks the patterns (S-10 6.8)
- [ ] 4.11 [human] Accept min 1 token (decision 3) over min 2
