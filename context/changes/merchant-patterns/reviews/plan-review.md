<!-- PLAN-REVIEW-REPORT -->
# Plan Review: Merchant patterns list (S-03) Implementation Plan

- **Plan**: context/changes/merchant-patterns/plan.md
- **Mode**: Deep (codebase verification done inline: the step had no sub-agent tool)
- **Date**: 2026-09-25
- **Verdict**: REVISE → SOUND after fixes (0 critical; 4 warnings, all LOW impact and fixed in plan.md)
- **Findings**: 0 critical, 4 warnings, 3 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| End-State Alignment | PASS |
| Lean Execution | PASS |
| Architectural Fitness | PASS |
| Blind Spots | WARNING (F2, F3, F6, F7) |
| Plan Completeness | WARNING (F1, F4, F5) |

## Grounding

Grounding: 9/9 paths ✓ (`src/pages/patterns.astro`, `src/lib/format.ts`, `src/types.ts`,
`src/components/imports/ImportWizard.tsx`, `scripts/smoke.mjs`, `src/content/copy.ts`, `context/foundation/design-kit.md`,
`src/components/app/InlineAlert.astro`, `src/components/app/Stepper.tsx`); symbols ✓ (`Glyph` in `ImportWizard`,
`OPERATORS` / `rawMerchant` / `median` / `d5Type` / `TOLERANCE` in `scripts/fixture-ing.mjs`, `max_rows = 1000` in
`supabase/config.toml`, icons `search` / `sort` in `ICON_NAMES` and the sprite, `buildImportPayload` keeps
`counterparty` + `title`, `transactions.id` is a number); brief↔plan ✓.

Riskiest claims, verified in this step:

- **31-group partition** — re-derived end to end, not inherited: the main fixture CSV → `parseIngStatement` →
  `buildImportPayload(…, MAIN_ACCOUNT)` → a scratch port of the plan's `rawMerchant` + 7-rule `normalizeMerchant`
  (node `--experimental-strip-types`, `$TMPDIR`, not committed): 206 rows, 0 `rawMerchant` mismatches against
  `expected.json`, 31 groups, the only split `sportowo` → `sportowo` + `sportowo.pl`, no over-merge.
- **Oracle totals** — `expected.json` main file `imported` = 206 rows / 6 497 147 grosze, all on
  `Rachunek Firmowy Główny`; `patterns[]` 30 (24 normalization, 4 import, 1 user-merge, 1 user-exclude).
- **No duplicate of shipped work** — `formatMoney`, `Badge`, `merchantKey`, `derivePatterns` absent from `src/` and
  `context/archive/`; G26 stays open deliberately.
- **No new table** — so the RLS / cascade / pgTAP rule does not apply; the loader relies on the existing
  `transactions` RLS select policy.
- **Test counts** — every criterion is baseline + delta (vitest 32/3 files, pgTAP 44, smoke 46 named as baselines).
- **Kit traceability** — toolbar, table, badge, foot, "+ Wgraj CSV" come from `prototype/app.js` `patterns()` /
  `patternRows()`; the Kwota column is K17, omitted later-slice parts are G28, the error copy is now K18 (F4).

## Findings

### F1 — Smoke "proposes a type" assertion is vacuous

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 3 §6 Smoke
- **Detail**: The step asserted the page body contains `stały`. The island receives `copy.typeLabels`
  (`{ fixed: "stały", frequent: "częsty" }`) as props, which Astro serializes into the `<astro-island props="…">`
  attribute — the word is in the HTML whether or not any row renders a fixed badge, so the step cannot go red.
- **Fix**: assert the rendered text node `>stały<` and say why in the plan.
- **Decision**: FIXED (plan.md Phase 3 §6)

### F2 — Visual step would break the smoke's empty-view step

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 3 Manual Verification; Manual Testing Steps
- **Detail**: The plan imported the main fixture into the seeded `test@rytm.local`. `scripts/smoke.mjs` step
  "patterns renders empty view" signs in as that user and expects the empty state; after the Visual step every later
  smoke run (impl-review, Ship) fails until `supabase db reset`, and the failure looks like a product regression.
- **Fix**: use a freshly registered local account for data states, the seeded user only for `pusty`; `db reset` if
  the seeded user ever gets data.
- **Decision**: FIXED (plan.md Phase 3 Manual Verification + Manual Testing Steps; Progress titles unchanged)

### F3 — `createClient` returning `null` is unhandled

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 3 §4 Page
- **Detail**: `src/lib/supabase.ts` `createClient` returns `null` without `SUPABASE_URL` / `SUPABASE_KEY`; the plan
  passed its result straight into `loadPatterns(supabase: SupabaseClient<Database>)` — `astro check` fails, and the
  implementer would have to guess between empty (the `imports/index.astro` precedent) and error.
- **Fix**: `null` → error state without calling the loader (the slice rule is "never the empty state on a failed
  read").
- **Decision**: FIXED (plan.md Phase 3 §4)

### F4 — Error copy is an unregistered kit gap

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 3 §4 / §5
- **Detail**: The error state reuses `copy.components.error` = „Błąd — sprawdź plik CSV.” for a database read
  failure on a page with no CSV in sight. The kit has no generic read-error line; the project rule is "missing UI →
  gap row + `DESIGN-GAP` comment, never invented", and `design-kit.md` has no row for it (the `imports/index.astro`
  precedent never registered one).
- **Fix**: register **K18** in `design-kit.md` with a `DESIGN-GAP: K18` comment at the error branch; placeholder
  stays `components.error`.
- **Decision**: FIXED (plan.md Phase 3 §5)

### F5 — Merchant mark upper-casing deviates from the kit

- **Severity**: 💬 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 3 §3 PatternsTable
- **Detail**: Kit `patternRows()` renders `p.name[0]` as-is; the plan upper-cases it. Visible only for lower-case
  names (`kawa-testowa.pl`).
- **Fix**: follow the kit literally or register the deviation in G28.
- **Decision**: ACCEPTED — recorded in plan.md `## Known risks`

### F6 — Offset paging can skip rows under a concurrent delete

- **Severity**: 💬 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 2 §1 / Critical Implementation Details
- **Detail**: `.range()` offsets shift if rows are deleted between pages (S-02 undo in another tab), skipping rows
  silently. Negligible at PRD `data_volume: small`; keyset paging on `id` removes the class and the per-page count.
- **Fix**: keyset paging (`.gt("id", lastId).order("id").limit(PAGE_SIZE)`, stop on an empty page).
- **Decision**: ACCEPTED — recorded in plan.md `## Known risks`

### F7 — Real-data over-merge / split risks of the rule set

- **Severity**: 💬 OBSERVATION
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Blind Spots
- **Location**: Phase 1 §1 `normalizeMerchant`
- **Detail**: Bare `SA` legal-form token and the "≥ 3-digit token" rule can merge distinct real merchants
  (`PIZZA 365` → `PIZZA`); long-form legal names, card processors and unlisted operators can split. The oracle
  cannot see these. Also the roadmap `### S-03` Risk line still promises a migration the plan deliberately omits.
- **Fix**: none in S-03 — roadmap Unknown (owner user) + S-05 merges; archive step corrects the roadmap text.
- **Decision**: ACCEPTED — recorded in plan.md `## Known risks`
