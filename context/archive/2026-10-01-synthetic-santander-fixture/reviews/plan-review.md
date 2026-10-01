<!-- PLAN-REVIEW-REPORT -->
# Plan Review: Synthetic Santander fixture (F-03)

- **Plan**: context/changes/synthetic-santander-fixture/plan.md
- **Mode**: Deep (codebase claims checked directly by this step; no sub-agent — every risky claim was a single-file or single-command check)
- **Date**: 2026-10-01
- **Verdict**: REVISE → SOUND after triage (all four warnings fixed in plan.md)
- **Findings**: 0 critical, 4 warnings, 3 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| End-State Alignment | WARNING (F3) |
| Lean Execution | PASS |
| Architectural Fitness | PASS |
| Blind Spots | WARNING (F1, F2) |
| Plan Completeness | WARNING (F4) |

## Grounding

Grounding: 9/9 paths ✓ (`scripts/fixture-ing{,-check,-shape}.mjs`, `package.json`, `.gitattributes`, `.github/workflows/ci.yml`,
`context/foundation/import-formats.md`, `src/lib/patterns/merchant.ts`, `test/unit/patterns.test.ts`), 6/6 symbols ✓
(`check` async + CLI guard `import.meta.url === pathToFileURL(process.argv[1]).href`, `FIXTURE_DIR` hard-wired to
`test/fixtures/ing`, `parseLine`/`toMinor` exported, `fixture:check` → `fixture-ing-check.mjs`, ING oracle pattern
`pizzeria-trzy-sery` = `frequent`/`normalization`, ING `tolerance` `{pct 15, minMinor 1000}`), brief↔plan ✓.
Progress↔Phase: 3/3 phases, 9+8+9 criteria (26 rows) ↔ rows one-to-one after the 3.9 addition; no checkboxes inside phase blocks.
Blast radius of repointing `fixture:check`: tracked references are only `.github/workflows/ci.yml` (step unchanged),
`CLAUDE.md`, `package.json` and comments in ING files — none break.

Real-export re-check (sandbox disabled, booleans/counts only, no value printed): on both exports opening + Σ amounts ==
closing, closing == Lp 1 balance, Lp N balance − amount == opening, Lp 1 is the unique max booking date, file-name date
== header col 0 and file-name digits == header account; the PLN file's balances break a file-order chain on 333/482
pairs and a booking-date chain on 277.

## Follow-ups whose `Trigger:` names this slice

None. `grep` of every `Trigger:` line in `context/archive/*/follow-ups/` for F-03 / Santander / fixture / bank: no match
(agrees with `change.md` § Follow-ups triggered by this slice).

## Does the fixture serve S-10 and S-11?

- **S-10** (roadmap: detect format, show count + period header→export date, reject other currency and overlapping
  range, skip credits/refunds): detection signal (9 fields, col 0 `YMD`, col 2 `'`) = ST13 header; period (D7) and
  `imported.count/sumMinor` in `files`; currency reject = ST14; credits/refunds = ST08/ST09; key `(file, lp)`. Overlap
  only as an identical re-import (O1). Served.
- **S-11** (merchant without card/branch number, both cards → one pattern, ATMs → one pattern, same merchant ING +
  Santander → one pattern, ING oracle unchanged): ST01, ST02, ST04, ST10 + `crossBank` cover each clause; ING files are
  byte-guarded. Gaps fixed: under-merge was measured but not over-merge (F3); ATM raw contract ambiguous (F1). Served
  after fixes.

## Findings

### F1 — ATM rawMerchant contradicts the format contract S-10 will implement

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Blind Spots
- **Location**: Phase 1 trap table ST04; Phase 2 check 3 (`rawMerchant` re-derived by rule 5); Phase 3 §2
- **Detail**: `import-formats.md` regex block maps `WYPŁATA Z BANKOMATU KARTĄ … <adres>` → sprzedawca „bankomat” at
  parse time, while the plan gives ST04 `resolvedBy: normalization` with `rawMerchant` = regex tail. The check
  re-derives rule 5, so the implementer would have to guess, and S-10 could implement either — making ST04 and S-11's
  ATM clause unmeasurable.
- **Fix**: ST04 states `rawMerchant` = ATM address tail, `bankomat` comes from S-11 normalization (matches the
  roadmap putting the ATM outcome in S-11 and keeps the raw information); Phase 3 doc correction rewrites the ATM arrow.
  - Strength: one truth in doc, manifest and check; ATM grouping stays S-11's measurable outcome.
  - Tradeoff: between S-10 and S-11 each ATM address is its own pattern.
  - Confidence: HIGH — resolvedBy vocabulary in ING README (`import` = parser rule, `normalization` = FR-006).
  - Blind spot: S-11 may still prefer a parser-level mapping; then generator + doc change together.
- **Decision**: FIXED (plan ST04 row, Phase 3 §2)

### F2 — Header/balance invariants under-asserted; closing == Lp 1 depends on a tie-break

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Critical Implementation Details; Phase 2 check 2
- **Detail**: Balances are computed along (booking, operation, reverse Lp); if another row shared Lp 1's booking date
  with a later operation date, it would be chronologically last and header closing ≠ Lp 1 balance. The real exports
  also satisfy opening + Σ == closing, Lp N balance − amount == opening and file name ↔ header (date, account) — cheap
  completeness invariants S-10 can reuse, not asserted.
- **Fix**: New "Header invariants" paragraph (Lp 1 unique max booking date + the three invariants); check 2 asserts them.
- **Decision**: FIXED

### F3 — Fixture measures S-11 under-merge but not over-merge; cross-bank type unspecified

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: End-State Alignment
- **Location**: Phase 1 noise paragraph; ST10; Phase 2 check 3
- **Detail**: S-11 must strip a trailing city (ST10). Nothing in the fixture fails an over-eager stripper (two
  merchants sharing a city, a two-word city). ST10's Santander rows could get a D5 type different from ING's
  `frequent`, leaving the joined pattern's type undefined for S-11.
- **Fix**: Noise gets ≥ 2 merchants sharing a city token and ≥ 1 two-word city; ST10 amounts inside the ING spread,
  `crossBank` entry carries `"type": "frequent"`, checked in both oracles.
- **Decision**: FIXED

### F4 — Product calls in the oracle have no `[human]` row

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Autonomous decisions „PRD literal text”; Phase 3 Manual Verification
- **Detail**: The plan says no `[human]` row is needed, yet the oracle fixes product behaviour S-11 is graded
  against: `Wypłata BLIK` separate from `bankomat`, ST03 resolved by user-merge (not auto-normalization), `Oplata za …`
  `fixed`. None contradicts the PRD (FR-006/FR-009 let user decisions cover normalization gaps), so they stand.
- **Fix**: Phase 3 Manual gains `[human]` criterion → Progress 3.9; decisions row updated.
- **Decision**: FIXED

### O1 — Overlap only as identical re-import

- **Severity**: OBSERVATION
- **Dimension**: End-State Alignment
- **Detail**: S-10 proves a partial overlap only with a test-built variant. Recorded in plan `## Known risks`.
- **Decision**: RECORDED

### O2 — ING check header comment becomes partly stale

- **Severity**: OBSERVATION
- **Dimension**: Architectural Fitness
- **Detail**: `scripts/fixture-ing-check.mjs` opens with "Fixture gate (F-02): npm run fixture:check" and prints
  "fixture:check OK"; after repointing it is one bank of the gate. Accepted: ING scripts stay byte-untouched by design;
  the aggregator's own output and the CLAUDE.md line carry the truth.
- **Decision**: RECORDED

### O3 — Fixture balance chain is cleaner than the real export

- **Severity**: OBSERVATION
- **Dimension**: Blind Spots
- **Detail**: Real balances form no clean chain under file or booking order; the fixture's chronological chain is
  cleaner. Harmless because the check asserts no chain; 3.7 lists it as an explained difference (plan `## Known risks`).
- **Decision**: RECORDED

## Phase sizing

Each phase is independently green (Phase 1 leaves `fixture:check` ING-only; Phase 2 adds the gate; Phase 3 is
local-only tooling + docs) and fits one fresh agent; no split/merge needed.

VERDICT: PROCEED — approach (per-bank copy of the ING generator/check, aggregator gate, local shape tool) is sound and grounded; four warnings fixed in plan.md.
