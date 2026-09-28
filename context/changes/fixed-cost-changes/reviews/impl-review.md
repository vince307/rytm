<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Zmiany kwot i nowe wzorce stałe (S-06 `fixed-cost-changes`)

- **Plan**: context/changes/fixed-cost-changes/plan.md
- **Scope**: Full plan
- **Reviewed phases**: 1, 2, 3, 4
- **Date**: 2026-09-28
- **Verdict**: APPROVED (after the fixes in `9d92300`)
- **Findings**: 0 critical · 4 warnings (all fixed) · 4 observations

Reviewer: autonomous run `2026-09-28-s05-s06-s07`, impl-review step (fresh session; two read-only subagents for plan
drift and safety/patterns, every suite re-run by this step). Triage done autonomously (no human in the loop):
CRITICAL → fix; WARNING → fixed when cheap, else follow-up; OBSERVATION → recorded.

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS (one follow-up formula drift, fixed — F2) |
| Scope Discipline | PASS (smoke runner's array `contains` is a harmless test-infra extra — F7) |
| Safety & Quality | PASS |
| Architecture | PASS |
| Pattern Consistency | WARNING → fixed (F1, F4) |
| Success Criteria | PASS |

## Required checks (step instructions)

- **No migration**: `git diff --name-only main...HEAD -- supabase/` → empty. pgTAP unchanged (Files=5, Tests=102).
- **Fixture generated, not hand-edited**: `npm run fixture:ing` on the branch → `git status test/fixtures` clean
  (byte-identical regeneration); `npm run fixture:check` OK. Diff limited to kinoteka's 2026-08-17 amount
  (55,99 → 59,99), the CSV preamble debit sum (67193,47 → 67197,47), `expected.json` (row `amountMinor` −5999,
  `imported.sumMinor` 6497547, kinoteka `sumMinor` 63988; `medianMinor` 5299 unchanged) and README (T11 label + the
  derived main-file sum 64975,47). No id / date / order drift.
- **Other fixture consumers**: `scripts/fixture-ing-check.mjs`, `scripts/fixture-ing-shape.mjs` (structure only),
  `test/unit/ing-parser.test.ts` (sum updated to 6497547 in both assertions — the only meaning change, intended),
  `test/unit/patterns.test.ts` (KINOTEKA `fixedAmountMinor` 5299 — unchanged, still green), and the new
  `test/unit/fixed-overview.test.ts` case 16. `supabase/seed.sql` only mentions the directory. Smoke and pgTAP do not
  read the fixture. No consumer silently changed meaning.
- **Auth + RLS read**: `/fixed` is in `src/middleware.ts` `PROTECTED_ROUTES`; smoke „fixed without a session goes to
  login” (302 `/login`) passes. `fixed.astro` reads only through `createClient(Astro.request.headers, Astro.cookies)`
  (cookie-bound user session, RLS) → `loadPatternData`, the exact shape of `patterns.astro`; no admin/service client,
  no new query, no `set:html`.

## Suites (re-run by this step, on the final code incl. `9d92300`)

Baseline (agent contract, `main` `3706508`): lint 0 · astro check 0 errors (120 files) · fixture:check OK · vitest
190 (11 files) · build OK · pgTAP 102 (5 files) · smoke 111.

| Suite | Observed | Baseline + delta |
|---|---|---|
| `npm run lint` | 0 errors | 0 + 0 |
| `npx astro check` | 0 errors, 124 files | 120 + 4 files (`fixed.ts`, `fixed-overview.test.ts`, `FixedSection.astro`, `FixedRow.astro`) — matches plan (+2 p2, +2 p3, +0 p4) |
| `npm run fixture:check` | OK | OK |
| `npm test` | 213 passed, 12 files | 190 + 23 (16 fixed-overview + 4 format + 3 over-limit), 11 + 1 files |
| `npm run build` | Complete | OK |
| `npx supabase db reset && npx supabase test db` | Files=5, Tests=102, PASS | 102 + 0 |
| smoke (`astro dev --port 4398`) | 121 PASS / 0 FAIL (twice) | 111 + 10 (6 p3 + 4 p4) — matches plan target |

### Deliberate breaks re-executed by this step

1. **Unit, double charge (plan 2.6)**: change loop in `fixedOverview` started at the last index only → case 4 FAILs;
   cases 1, 5, 6 stay green. Cases 9 and 10 also went red, but as an artifact of this break's form (a
   single-occurrence pattern reads `txs[-1]`), not of the rule. Meta-check: the red on case 4 with 5/6 green isolates
   „latest change among R's occurrences”. Restored (`cp` from backup; `git diff` empty) → 16/16.
2. **Smoke, signed delta (plan 3.6)**: `{formatSignedMoney(row.deltaMinor)}` → `{formatMoney(row.deltaMinor)}` in
   `fixed.astro` → „fixed lists a changed amount” FAIL, „fixed shows the previous amount” PASS, every other step PASS.
   Meta-check: proves the signed formatter reaches the served page, not merely that the row renders. Restored → 121/121.

## Findings

### F1 — Conditional classes built without `cn()`

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: src/pages/fixed.astro `deltaClass`; src/components/fixed/FixedSection.astro list wrapper
- **Detail**: CLAUDE.md: „use the `cn()` helper for conditional/merged class names”. Both built conditional class lists
  as raw `class:list` arrays; neighbouring components (`Panel`, `InlineAlert`, `MobileNav`) use `class:list={cn(...)}`.
- **Fix**: `deltaClass` returns `cn(...)`; wrapper uses `cn(..., compact && "compact")`.
- **Decision**: FIXED — `9d92300`

### F2 — S-07 follow-up formula counts decreases as rises

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: context/changes/fixed-cost-changes/follow-ups/review-fixes.md (S-07 `/home` entry)
- **Detail**: plan Phase 4 §4 contract: „N pozycje podrożały” = `fixedOverview(...).changed.filter(r => r.deltaMinor > 0)`.
  The file gave `.changed.length` with the filter optional — S-07 greps this file, and `changed` holds decreases too.
- **Fix**: formula corrected to the rise-only filter.
- **Decision**: FIXED — `9d92300`

### F3 — Stale kit row and stale phase comment

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence (Phase 4 §5 seam sweep)
- **Location**: context/foundation/design-kit.md row G28; src/components/fixed/FixedRow.astro header
- **Detail**: G28 still said the `/patterns` status badges come „(S-06)”; S-06 deferred them (plan „What We're NOT
  Doing”). `FixedRow`'s header said „or, from Phase 4, the `nowy` badge” — a phase forward-reference after Phase 4.
- **Fix**: G28 row amended „S-06: odznaki statusu odłożone” → follow-up; comment rewritten.
- **Decision**: FIXED — `9d92300`

### F4 — Seam-sweep duplication neither extracted nor justified

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency (Phase 4 §5)
- **Location**: src/components/fixed/FixedSection.astro wrapper classes vs `ExcludedPatterns.astro`;
  src/components/fixed/FixedRow.astro merchant-mark `<span>` (both branches) vs `ExcludedPatterns.astro`
- **Detail**: the plan requires „extract … or record why not”. The handoff's duplication check covered only
  `formatSignedMoney` / `patternTxs` / `previousMonth`.
- **Fix**: recorded why not, in the components' header comments: the wrapper strings already differ (kit
  `.fixed-list` ≤ 560 px padding has no `ExcludedPatterns` counterpart); the shared part of the mark is the
  `merchantMark` class string, a wrapper component for one `<span>` is not worth a file.
- **Decision**: FIXED (justified) — `9d92300`

### F5 — Pattern/row drift in the derive step returns 500, not the error line

- **Severity**: 🔍 OBSERVATION
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Safety & Quality
- **Location**: src/lib/patterns/view.ts `patternTxs` (throws), called from src/lib/patterns/fixed.ts `fixedOverview`
  inside src/pages/fixed.astro's result IIFE
- **Detail**: `patternTxs` throws on a missing transaction id (documented as a programming error). No `try` around the
  derive step, so it surfaces as a 500. Same shape `patterns.astro` already has with `listOverview` — inherited, not
  introduced.
- **Fix**: wrap both pages' derive step and return `{ error }` · Strength: one error UX for read and derive · Tradeoff:
  masks a programming error behind a generic line · Confidence: MED — never observed · Blind spot: whether the drift
  is reachable at all given one read feeds both inputs.
- **Decision**: RECORDED — follow-ups/review-fixes.md (Trigger: a 500 on `/fixed`/`/patterns`, or next `loadPatternData` change)

### F6 — `FixedSection` `compact` prop is dead styling

- **Severity**: 🔍 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Scope Discipline
- **Location**: src/components/fixed/FixedSection.astro `compact`
- **Detail**: adds a `compact` class no CSS defines; the component's comment already says so (prototype parity).
- **Fix**: drop the prop or give it meaning on the next `/fixed` change.
- **Decision**: RECORDED — follow-ups/review-fixes.md

### F7 — Smoke runner accepts an array for `contains`

- **Severity**: 🔍 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Scope Discipline
- **Location**: scripts/smoke.mjs runner (`contains` handling)
- **Detail**: not in the plan; test-infrastructure only, payloads unchanged, all 121 steps green.
- **Fix**: none — keep.
- **Decision**: ACCEPTED

### F8 — Without a comparison month, a pattern charged only in R lists as „Bez zmian”

- **Severity**: 🔍 OBSERVATION
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Plan Adherence
- **Location**: src/lib/patterns/fixed.ts `fixedOverview` (fall-through when `hasComparison` is false)
- **Detail**: per plan decision 5 and unit cases 9/10; with a gap month a change is reported against an R-2
  predecessor. Correct to the plan; reads slightly odd („bez zmian” with nothing compared). Product call, visible in
  the visual gate's `fixed-no-comparison` / `fixed-gap-month` shots.
- **Fix**: none in this slice.
- **Decision**: ACCEPTED (plan decision 5)

## Manual rows

- `[reviewer]` 1.8, 2.9, 3.9, 4.9 — performed by this step and passed (after F2–F4 fixes for 4.9); ticked with
  `9d92300`.
- `[human]` 4.10 (decision 7, D5 flip) — open, post-run checklist.
- `[visual]` 4.11, 4.12 — open, next step (visual gate).

MERGE: CLEAR — no open CRITICAL, every automated criterion re-observed green (smoke 111+10, vitest 190+23, pgTAP 102+0), four warnings fixed in 9d92300; only [human]/[visual] rows remain for later steps
