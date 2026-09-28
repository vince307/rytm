<!-- PLAN-REVIEW-REPORT -->
# Plan Review: Trend „ponad progiem” per miesiąc (S-07 `over-limit-trend`)

- **Plan**: `context/changes/over-limit-trend/plan.md`
- **Mode**: Deep (codebase claims verified inline by this step — no sub-agent; run `2026-09-28-s05-s06-s07`)
- **Date**: 2026-09-28
- **Verdict**: REVISE → SOUND after triage (all fixes applied to `plan.md` / `plan-brief.md`)
- **Findings**: 1 critical · 2 warnings · 4 observations

## Verdicts

| Dimension | Verdict (before triage) |
|-----------|---------|
| End-State Alignment | FAIL (F1) |
| Lean Execution | PASS |
| Architectural Fitness | PASS |
| Blind Spots | WARNING (F3) |
| Plan Completeness | WARNING (F2) |

## Grounding

Grounding: 8/8 paths ✓ (`src/pages/home.astro`, `src/lib/patterns/{over-limit,view,fixed,load}.ts`,
`src/lib/format.ts`, `src/content/copy.ts`, `scripts/smoke.mjs`; shared components live in `src/components/app/` —
`PageTitle`, `Panel`, `EmptyState`, `InlineAlert` — `Icon.astro` in `src/components/`), 12/12 symbols ✓
(`overLimit` returns every month's `byMonth`, `appliesTo`, `monthOf`, `previousMonth`, `referenceMonth`,
`listOverview` guards `!threshold || !refMonth || pattern.excluded`, `patternTxs` throws on drift, `indexById`,
`fixedOverview` skips `excluded` and non-`fixed`, `formatSignedMoney` U+2212, `plural`, `copy.dashboard.*` /
`copy.trend.*` keys as named), 9/9 smoke step names ✓, brief↔plan ✓ (after F1 edit).
Follow-ups with `Trigger: S-07`: excluded-skip (included, binding), S-05 F6 (deferred — O2), S-06 `fixedOverview`
reuse for „podrożały” (included verbatim); S-06 one-off noise (plan said „not triggered” — it fires, F3).

## Findings

### F1 — Continuous zero-filled axis asserts `0,00 zł` for months with no data

- **Severity**: ❌ CRITICAL
- **Impact**: 🔬 HIGH — architectural stakes; think carefully before deciding
- **Dimension**: End-State Alignment
- **Location**: Critical Implementation Details (aggregate), Phase 1 §1/§5 case 9, Phase 3 `homeStats.previous`, decision 2
- **Detail**: FR-013 („dla wszystkich miesięcy obecnych w danych”), the roadmap outcome („dla każdego miesiąca obecnego
  w danych”) and the maintainer's run binding („najnowszy miesiąc **w danych**”) all use „present in the data” = a month
  with rows. The plan's continuous axis renders a month with no import as `0,00 zł ponad progiem` — a figure the app
  does not know. US-05 AC 2 („0, nie brak wartości”) is about a month *with* transactions none of which is over, so it
  does not license zero-filling missing data. Consequences: the secondary success criterion („czy suma maleje z
  miesiąca na miesiąc”) gets a false improvement after a skipped import; the stat delta foot would compare R with a
  no-data month while the „Koszty stałe” card on the same page (S-06 `fixedOverview`, `hasComparison` = P has rows)
  refuses exactly that comparison. Identical on the fixture (12 consecutive months), so no test would have caught it.
- **Fix (applied)**: axis = distinct `monthOf` over all rows, sorted; no `nextMonth`; case 9 → `[05, 07]`; break 1.6
  inverted (continuous fill must turn case 9 red); `homeStats.previous` = `previousMonth(R)` only when on the axis
  (+ case 3b); G35 text, visual `home-gap-month`, decision 2 rewritten, `[human]` 4.9 kept and reworded (reversal =
  continuous axis), brief updated.
  - Strength: matches PRD/roadmap/binding literal and S-06's gap rule; never shows an unknown as 0.
  - Tradeoff: bars are equidistant, a gap is visible only in the axis labels.
  - Confidence: HIGH — three written sources agree; only the plan step's own reasoning argued otherwise.
  - Blind spot: the maintainer may still prefer a time axis — `[human]` 4.9 names it.
- **Decision**: FIXED (overturned plan decision 2)

### F2 — Smoke `notContains` takes one string; the plan asserts two

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 2 §4 step 5, Phase 4 §5
- **Detail**: `scripts/smoke.mjs` checker: `needles = [expected.contains].flat()` but
  `!actual.body.includes(expected.notContains)` — a single string. Phase 2 step 5 needs `>5,50 zł<` and `>7,00 zł<`
  absent; Phase 4 adds a second negative needle to Phase 2 step 1. An array would be coerced to `"a,b"` and pass
  vacuously.
- **Fix (applied)**: Phase 2 §4 now first extends `notContains` to a needle or an array (symmetric to `contains`).
- **Decision**: FIXED

### F3 — „Koszty stałe” value fires the S-06 one-off-noise follow-up the plan called „not triggered”

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Blind Spots
- **Location**: Phase 3 `homeStats.fixedTotalMinor`, decision 6, change.md follow-up table
- **Detail**: S-06 follow-up: D5 types every single-occurrence merchant `fixed` (smoke „Piekarnia smoke”); trigger
  includes „S-07's `/home` stat card surfacing the same noise”. The plan judged it untriggered because the foot counts
  rises only — but the *value* sums `changed` + `new` + `unchanged`, so every one-off in R inflates the headline figure
  (with no comparison month, a one-off lands in `unchanged` and still counts).
- **Fix (applied)**: keep the Σ (it equals what `/fixed` lists; the defect is the classifier's, not the card's) —
  Known risks entry, `[human]` 4.11 names the noise and the alternative (foot-only card / classifier fix), Phase 4
  follow-ups gain an entry with a `Trigger:`.
  - Strength: no invented rule; `/home` and `/fixed` stay consistent.
  - Tradeoff: on real statements the card may overstate fixed costs until the classifier is fixed.
  - Confidence: MED — magnitude on the maintainer's real data unknown (fixture shows 5 plausible fixed rows).
  - Blind spot: real-data share of one-off `fixed` patterns not measured (real data never enters the repo).
- **Decision**: FIXED (recorded, not re-scoped)

### O1 — Bar chart vs PRD Non-Goal „Wykresy inne niż lista i suma” (decision 4)

- **Severity**: OBSERVATION · **Impact**: 🔎 MEDIUM · **Dimension**: End-State Alignment · **Location**: decision 4
- **Detail**: Literal conflict, but the kit (source of truth for UI, G6 `.monthly-trend` delivered) draws exactly this
  chart and the plan labels every bar with its sum, so the content is still „sumy per miesiąc”. Not clearly wrong;
  `[human]` 4.10 names it with a reversal (list in the same panel).
- **Decision**: ACCEPTED

### O2 — S-05 F6 deferral is justified

- **Severity**: OBSERVATION · **Impact**: 🏃 LOW · **Dimension**: Lean Execution · **Location**: What We're NOT Doing
- **Detail**: Fixing it means a `validateMerge` rejection plus hiding „Scal z…” and error copy in the
  `/patterns/<key>` dialog — another view and a kit gap. The trend follows the root's decision faithfully; follow-up
  carried with a new trigger.
- **Decision**: ACCEPTED

### O3 — „Koszty stałe” with no fixed pattern in R has no kit state

- **Severity**: OBSERVATION · **Impact**: 🏃 LOW · **Dimension**: Blind Spots · **Location**: Phase 3 §3
- **Detail**: renders `0,00 zł` · „0 pozycji podrożało”. Readable, not wrong; the visual step should look at it
  (e.g. smoke state after „later import keeps the exclusion”) and note it under G36 if it reads badly.
- **Decision**: ACCEPTED

### O4 — Phase sizing

- **Severity**: OBSERVATION · **Impact**: 🏃 LOW · **Dimension**: Plan Completeness · **Location**: Phases 1–4
- **Detail**: each phase is independently green (Phase 1 has no caller; 2–4 each add one component, own smoke steps
  and breaks). Phase 2 is the largest (component + page + copy + 2 gap rows + 6 smoke + 3 breaks) but below the S-05
  size-lesson threshold; no split/merge. Progress ↔ Phase headings and criteria consistent (41 rows, one `## Progress`).
- **Decision**: ACCEPTED

## Triage summary

Fixed: F1, F2, F3 (3) · Accepted: O1–O4 (4). Verdict after fixes: REVISE → SOUND.

VERDICT: PROCEED — approach sound; the one critical (continuous axis inventing 0 for no-data months) is fixed in plan.md to the FR-013 literal with `[human]` 4.9 kept, both warnings fixed.
