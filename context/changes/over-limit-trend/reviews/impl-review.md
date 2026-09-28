<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Trend „ponad progiem” per miesiąc (S-07 `over-limit-trend`)

- **Plan**: context/changes/over-limit-trend/plan.md
- **Scope**: Full plan
- **Reviewed phases**: 1, 2, 3, 4
- **Date**: 2026-09-28
- **Verdict**: APPROVED (after fix `51456f7`; before it: NEEDS ATTENTION)
- **Findings**: 0 critical, 4 warnings, 4 observations

Reviewer: autonomous run `2026-09-28-s05-s06-s07`, `/10x-impl-review` step (no human in the loop; triage decided in
place, see `handoff.md` §6). Two read-only sub-agents (plan drift; safety and patterns), and every suite re-run by the
reviewer.

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS (F2 fixed) |
| Scope Discipline | PASS |
| Safety & Quality | PASS (F1 fixed) |
| Architecture | PASS |
| Pattern Consistency | WARNING (F3 partly fixed, F4 deferred) |
| Success Criteria | PASS |

## Evidence (observed in this step)

Baseline = agent contract, `main` `c0b0068`: lint 0 · astro check 0 errors (124 files) · fixture:check OK · vitest
213 (12 files) · build OK · pgTAP 102 (5 files) · smoke 121 PASS.

| Suite | Before fixes (HEAD `a5bc149`) | After fixes (`51456f7`) | Delta vs baseline |
|---|---|---|---|
| `npm run lint` | 0 errors | 0 errors, 0 warnings | 0 |
| `npx astro check` | 0 errors, 131 files | 0 errors, 131 files | +7 files (3 components, `trend.ts`, `home.ts`, 2 tests), 0 errors |
| `npm run fixture:check` | OK | OK | — |
| `npm test` | 246 passed, 14 files | 246 passed, 14 files | +33 tests, +2 files (213 + 33 = 246) |
| `npm run build` | OK | OK | — |
| `npx supabase db reset && npx supabase test db` | Files=5, Tests=102 PASS | Files=5, Tests=102 PASS | 0 |
| smoke `BASE_URL=http://localhost:4398` | 131 PASS / 0 FAIL | 131 PASS / 0 FAIL | +10 (121 + 10 = 131, as planned) |
| `git diff --name-only main...HEAD -- supabase/` | empty | empty | no migration, as planned |

**Core invariant on real data** (fresh local account via the API on :4398, the F-02 fixture imported through
`POST /api/imports`, thresholds set through `POST /api/patterns/threshold`; the page's bar labels and the stat value
read from `/home`, Σ of the `overMinor` props read from `/patterns`):

| State | Σ `/patterns` overMinor | `/home` stat (= last bar `sie 26`) | Historical months |
|---|---|---|---|
| no threshold | 0,00 | 0,00 zł, hint shown | all 12 at 0,00 zł |
| kino count 1 + stacja count 1 + pizzeria sum 50 | 972,41 | 972,41 zł | `wrz 25` 286,88 · `paź 25` 49,13 · `maj 26` 182,57 · `lip 26` 308,99 (= plan fixture figures summed) |
| kino → count 2 | 972,41 | 972,41 zł | `paź 25` → 0,00 · `maj 26` 147,32 · `cze 26` 60,12 · `lip 26` 273,38 (historical months recomputed) |
| stacja excluded | 17,07 | 17,07 zł | `wrz 25` 0,00 · `lip 26` 51,98 (stacja contributes 0 to every month) |
| kino threshold removed | 17,07 | 17,07 zł | `maj 26` 49,10 · `lip 26` 0,00 (kino contributes 0 to every month) |

The invariant `months.at(-1) = Σ listOverview.overMinor` held in all five states, a changed and a removed threshold
recomputed every month (US-05 AC), and an excluded pattern added 0 to every month. After the fix: the rendered `<ol>`
has 0 non-`<li>` children and the lead reads „Twój sierpień w jednym spokojnym widoku.”. The account was deleted
afterwards and the local DB reset (`npx supabase db reset`).

**Deliberate breaks re-executed by the reviewer:**

1. `trend.ts` `overLimitTrend`: the `pattern.excluded` skip removed → `over-limit-trend.test.ts` case 7 FAILs (1 of 22),
   case 5 (per-pattern sums) stays green → the red is the exclusion guard, not the summing. Restored → green.
2. `view.ts` `applicableThreshold`: returns `stored` without `appliesTo` → FAILs in **both** callers:
   `pattern-view.test.ts` („a stored threshold whose kind does not apply… renders as no threshold”) and
   `over-limit-trend.test.ts` case 8. Meta-check: this proves the one extracted guard feeds `/patterns` and the trend.
   Without the extraction, only one of them would go red. Restored → 246 green.

**Phase 1 extraction — `/patterns` and `/patterns/<key>` unchanged:** `pattern-view.test.ts` is untouched and green,
and every S-04/S-05 smoke step (list, detail, threshold save/change/remove, decisions, exclusion) is among the 131
PASS. `patternDetail` keeps its own `threshold` parameter. `grep -c "appliesTo(stored" src/lib/patterns/*.ts` = 1
(`view.ts`).

**`/home` security:** `/home` is in `src/middleware.ts` `PROTECTED_ROUTES` (smoke „home redirects anonymous user” →
302 /login). The only read is `createClient` (cookie session, anon key, RLS) → `loadPatternData`, with no service key.
A failed read, an unconfigured client or a throw anywhere in `overLimitTrend` → `fixedOverview` → `homeStats` (one
`try`) goes to the `InlineAlert` branch with `console.error("home failed")`, never a 500. There is no `set:html`.

## Findings

### F1 — `<div>` gridline as a direct child of `<ol>` in the trend chart

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality (HTML validity / accessibility)
- **Location**: src/components/home/TrendChart.astro — the chart markup
- **Detail**: The dashed mid gridline `<div aria-hidden>` sat inside `<ol aria-label>`. Only `<li>` is allowed there,
  and screen readers may miscount the list. The decorative legend dot `<i>` also had no `aria-hidden`.
- **Fix**: Wrap the `<ol>` in a `relative` div, make the gridline its sibling, and add `aria-hidden` to the legend dot.
- **Decision**: FIXED — `51456f7` (served HTML re-checked: 0 non-`li` children in the `<ol>`; smoke 131/0).

### F2 — G35 / G36 rows did not record what renders

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: context/foundation/design-kit.md — rows G35, G36; follow-ups/review-fixes.md
- **Detail**: The plan's G35 content was missing four items: the 10 px sum label, `min-w-[44px]` instead of the kit's
  24 px, the in-panel scroll, and the read error via K18. G36 was missing the hidden delta foot and the accent colour
  `#72501f` → `excess-text`, although `StatCard.astro`'s header points at that note. The follow-ups file also claimed
  the import-panel border `#9da9aa` was covered by „the G35 note”, and it was not.
- **Fix**: Amend G35 and G36 so they name everything above plus the `#9da9aa` import-panel border, and correct the
  follow-up's claim.
- **Decision**: FIXED — `51456f7`.

### F3 — Month-index parse duplicated

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: src/pages/home.astro `leadFor` / `deltaFootFor`; src/pages/patterns/[...key].astro (`Number(m.slice(5, 7)) - 1`)
- **Detail**: `Number(x.split("-")[1]) - 1` was written twice in `home.astro` (Phase 2 `leadFor`, Phase 3
  `deltaFootFor`). A third copy, in another style, lives in `patterns/[...key].astro`.
- **Fix**: Add one local `monthIndex` in `home.astro` now. Sharing it with `[...key].astro` via `src/lib/format.ts`
  touches another view, so it goes to a follow-up with a `Trigger:`.
- **Decision**: FIXED (in-view part) — `51456f7`; cross-view part → follow-ups/review-fixes.md.

### F4 — Panel-title markup inline in six places; info-panel classes duplicated

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Pattern Consistency (missing shared component)
- **Location**: src/pages/home.astro (trend panel header), src/components/app/FixedSection.astro, src/pages/patterns/[...key].astro, src/pages/settings.astro; src/components/home/TrendChart.astro `note` / `hint`
- **Detail**: `<h2 class="text-[17px] tracking-[-0.03em]">` (kit `.panel-title`) is inline in six places. The Phase 4
  seam sweep neither extracted nor justified it. Inside `TrendChart` the `.info-panel` class string was copied for
  `note` and `hint`.
- **Fix**: Extract the info-panel classes to one `infoPanel` constant in `TrendChart` now. Record the
  `PanelTitle.astro` extraction as a follow-up (it touches four other views — the one-view rule).
  - Strength: keeps the change to one view and still records the missing shared component.
  - Tradeoff: the duplication stays until the next panel-title change.
  - Confidence: HIGH — the markup is identical and has no behaviour.
  - Blind spot: whether the `m-0` differences are visible (the visual gate can check).
- **Decision**: FIXED (`infoPanel`, `51456f7`) + deferred → follow-ups/review-fixes.md (`Trigger:` next panel-title change or a `/10x-ui` pass).

### F5 — Dead `?? ""` fallback on the lead

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality (typing)
- **Location**: src/pages/home.astro — `result` union, `leadFor(...)`
- **Detail**: The data branch carried the full `OverLimitTrend`, so `referenceMonth` stayed `string | null` and the
  lead used `?? ""`. If that invariant broke, the page would silently print „Twój undefined…”.
- **Fix**: Narrow `referenceMonth: string` in the `HomeResult` success variant and discriminate the empty branch on
  `result.referenceMonth === null`.
- **Decision**: FIXED — `51456f7` (smoke „home before import has no trend” / „home renders empty state” and all data-branch steps green).

### F6 — Chart geometry differs from the plan's wrapper contract

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: src/components/home/TrendChart.astro — `<li class="h-[200px] …">`
- **Detail**: The plan put `h-[200px] items-end` on the wrapper. The code puts the height on each `<li>`, with the
  amount and axis label inside it, so the `border-b` baseline sits under the labels and `top-1/2` is the midpoint of
  the whole column, not of the bar area. It works functionally (smoke, invariant); this is only a visual difference
  from the kit `.monthly-trend`.
- **Fix**: none now — the visual gate (`[visual]` 4.12, `home-kit-compare`) judges it; a visible defect there becomes
  a G35 note or a fix.
- **Decision**: RECORDED → visual gate.

### F7 — `home.ts` imports `previousMonth` from `over-limit.ts`

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Architecture
- **Location**: src/lib/patterns/home.ts — imports
- **Detail**: Progress row 3.10 says „imports only `trend.ts`, `fixed.ts` types, `@/types`”. `previousMonth` is the
  existing shared month step. Reusing it is exactly what the seam sweep asks for (no second month arithmetic), so the
  row's wording was too narrow, not the code.
- **Fix**: none; row 3.10 ticked with this note.
- **Decision**: ACCEPTED.

### F8 — `trend.ts` header does not restate US-05 AC 4 („bez oznaczenia niepełny”)

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: src/lib/patterns/trend.ts — header comment
- **Detail**: The plan asked the header to cite AC 4, but its own grep forbids the word „niepełny” in `src` outside
  `TrendChart.astro`. The rule is documented where it is enforced (`TrendChart.astro` header, G35), and the aggregate
  has no notion of completeness to state.
- **Fix**: none — the plan contradicted itself; the rendering side is the right home.
- **Decision**: ACCEPTED.

## Manual Progress rows

- `[reviewer]` 1.8, 2.10, 3.10, 4.8 — performed and ticked (4.8 after `51456f7`).
- `[human]` 4.9, 4.10, 4.11 — open (post-run checklist, product-owner decisions 2 / 4 / 6).
- `[visual]` 4.12, 4.13 — open (next step: visual gate for `/home`).

MERGE: CLEAR — no open CRITICAL, all automated criteria met and every suite green after fix 51456f7 (smoke 131 = 121 + 10, vitest 246 = 213 + 33, pgTAP 102 + 0), invariant verified on real data; remaining rows are [human]/[visual] by design.
