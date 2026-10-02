<!-- PLAN-REVIEW-REPORT -->
# Plan Review: Santander card merchants (S-11)

- **Plan**: context/changes/santander-card-merchants/plan.md
- **Mode**: Deep (claims checked against the code and re-measured with the research probe; real export read for counts only)
- **Date**: 2026-10-02
- **Verdict**: SOUND (after the in-plan fixes below)
- **Findings**: 0 critical, 3 warnings, 2 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| End-State Alignment | PASS |
| Lean Execution | PASS |
| Architectural Fitness | PASS |
| Blind Spots | WARNING (F1–F5, all fixed or recorded in plan.md) |
| Plan Completeness | PASS |

## Grounding

Paths 7/7 ✓ (`src/lib/patterns/merchant.ts`, `derive.ts`, `load.ts`, `src/lib/import/santander.ts`, `banks.ts`,
`test/unit/patterns.test.ts`, `scripts/smoke.mjs`; new files `santander-card.ts` / `santander-card.test.ts` /
`santander-patterns.test.ts` absent as expected). Symbols ✓: `rawMerchant`, `normalizeMerchant`, `merchantKey`,
`STORE_NUMBER`, `ADDRESS`, `derivePatterns` (key and display from the same `raw`), `topVariant`, `CARD`,
`rawMerchantOf` (title = `v[2].trim()`), `buildSantanderPayload` (debits only), `parseSantanderStatement`,
`accountLabel` (still `replace("{name}", name)`), `fixtureSources` / `expectedGroups`. Brief↔plan ✓.
Progress↔Phase ✓ (29 rows = 6 + 7 + 5 + 11 Success Criteria bullets; one `## Progress`, no checkboxes in phase bodies).

Oracle facts re-checked: main Santander file 184 imported rows, sum 1342109, 34 patterns (ST03 the only user-merge →
35 split-back groups); all 2-word-city groups are single-raw (Phase 2 break 3 claim holds); every distinct ING oracle
raw (32) lives in the main file, so the ING key-text pin covers the whole record. Research probe re-run on this
branch: R10 reproduces exactly (fixture 35 keys / 0 splits / 0 over; real 193 keys / 0 over-merged / 6 split
merchants, 10 extra keys).

## Over-merge audit (the product's unrecoverable failure)

| Rule | Over-merge class | Real data (counts) | Outcome |
| --- | --- | --- | --- |
| `Wypłata BLIK` gate | Not bank-specific — an ING BLIK cash withdrawal would be re-keyed and merged | 3/3 real, 2/2 fixture titles end in `:` + 11 digits | **F1 fixed**: `BLIK_GATE` = `^Wypłata BLIK .+:\d{11}$` |
| Code token on the first token | Brand-number names (`4F …`, `5 SMAKOW`) reduced to a generic word | no count change with the guard | **F2 fixed**: first token never dropped |
| `NR` guard | Defeated for ≥ 3 digits by the global `STORE_NUMBER` | glue fix costs +1 split | **F3** recorded (Known risks) |
| `CITY_PREFIX` pop to 1 token | `<GENERIC> STARY <CITY>` → `<GENERIC>` | ≥ 2-left variant costs +1 split, 0 over either way | **F4** recorded, [human] 4.11 + FU4 extended |
| Positional city on cityless tail | `<AGG> *<MERCHANT>` → `<AGG>` | 2 `*` tails, none reduced | **F5** Known-risk text corrected |
| min 1 token | Generic one-word name across towns | 0 measured | already a [human] row (4.11) |

ING keys provably untouched: card gate needs `DOP. VISA <mask>` (0 in ING fixtures; ING titles start `Płatność …`);
BLIK gate now needs Santander's end shape; Phase 1 pins key text for all 32 ING raws before any rule lands, and
Phase 2 break 1 proves the pin catches a gate removal that the partition test would miss.

## Follow-ups whose `Trigger:` names this slice

S-10 F4 (`accountLabel`) — included (Phase 1). S-10 [human] 6.11 — carried as [human] 4.9, FU5. F-03 [human] 3.9 —
carried as 4.8. merchant-patterns F3 — taken (Phase 1). No other `Trigger:` line in `context/archive/*` names S-11.

## PRD / oracle

FR-006 (normalise description → merchant) and FR-018 are silent on cities; FR-007 (each transaction counted once)
holds — `derivePatterns` assigns each row one key. The oracle partition is the contract; slug text is not matched
(decision 14). Product calls left to the owner have [human] rows 4.8–4.11; `Wypłata BLIK` as one pattern is checked
by 4.10.

## Findings

### F1 — `Wypłata BLIK` gate is not Santander-specific

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Critical Implementation Details (BLIK line); Phase 3 Rules + Tests
- **Detail**: The plan gated the BLIK-withdrawal rule on `startsWith("Wypłata BLIK ")`. The phrase is generic Polish
  banking text; the ING fixture has no BLIK cash withdrawal, so neither the 0-match check nor the key-text pin can
  see an ING row with that title. Such a row would be re-keyed (orphaning saved ING thresholds/decisions) and merged
  with every Santander BLIK withdrawal.
- **Fix**: Gate on Santander's own end shape `^Wypłata BLIK .+:\d{11}$` (covers both `:` and ` ref:`); add an
  ING-shaped `… Nr transakcji …` title → `null` unit case.
- **Decision**: FIXED (in plan.md)

### F2 — Code-token rule can drop a brand's first token

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Critical Implementation Details rule 4; Phase 3
- **Detail**: `^[A-Z]{0,2}\d[\dA-Z]*\.?$` matches brand names that start with a digit (`4F`, `5 …`); dropping the
  first token leaves a generic word that merges with unrelated shops. Store/till codes follow the chain name, never
  lead it.
- **Fix**: Never drop the first token (measured: real counts unchanged, 193 / 0 / 6).
- **Decision**: FIXED (in plan.md)

### F3 — `NR` guard does not protect numbers of ≥ 3 digits

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Blind Spots
- **Location**: Critical Implementation Details rule 4; Phase 3 tests
- **Detail**: The guard keeps `123` in `SKLEP NR 123`, but `normalizeMerchant` then drops it via the global
  `STORE_NUMBER` (`merchantKey("SKLEP NR 123")` = `sklep nr`, checked). The plan's unit case uses 1–2-digit numbers,
  so it would pass while the class stays open.
- **Fix**: Glue the number to the guard (`NR123`) · Strength: closes the class · Tradeoff: +1 real split against the
  private labelling (a chain under several numbers), uglier display · Confidence: MED — labelling is a judgement ·
  Blind spot: owner's view of numbered co-op shops. Not applied; recorded in Known risks and Critical Implementation
  Details (guard unit cases use 1–2 digits). Same behaviour already exists for ING.
- **Decision**: ACCEPTED (Known risks)

### F4 — `CITY_PREFIX` pop can leave one generic word; "while" wording

- **Severity**: 🔵 OBSERVATION
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Blind Spots
- **Location**: Critical Implementation Details rule 3
- **Detail**: `<GENERIC> STARY <CITY>` → `<GENERIC>`. Requiring ≥ 2 tokens left costs +1 real split, 0 over-merges
  either way. Also, "while … pop one more" read as a loop; the measured probe does single `if`s.
- **Fix**: Wording changed to three single `if` pops; risk recorded in Known risks, [human] 4.11 bullet and FU4.
- **Decision**: FIXED (wording) / ACCEPTED (risk)

### F5 — Known-risk text understated cityless descriptors

- **Severity**: 🔵 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Known risks
- **Detail**: "single-raw pattern, display only" is wrong for `<AGG> *<MERCHANT>` tails without a city: they reduce
  to `<AGG>` and merge. Real export: 2 such tails, neither affected.
- **Fix**: Known-risk bullet corrected.
- **Decision**: FIXED (in plan.md)

VERDICT: PROCEED — approach (title-gated positional rules in the patterns layer, ING key-text pin first) is sound and re-measured (R10 reproduces 193 keys / 0 over-merges); the two cheap over-merge holes (generic BLIK gate, first-token code drop) are fixed in plan.md and the rest are recorded with [human] rows.
