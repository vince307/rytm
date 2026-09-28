---
date: 2026-09-28T20:20:35+02:00
researcher: Claude (autonomous run 2026-09-28-s05-s06-s07, research step)
git_commit: 8c08aef7184b2aa6f2bb925eb655a023ba1fcd4a
branch: feat/over-limit-trend
repository: Rytm
topic: "S-07 over-limit-trend — per-month „ponad progiem” trend on /home (FR-013, US-05): reuse contract, month axis, PRD↔kit conflicts, undefined /home figures, fixture proof"
tags: [research, over-limit, trend, home, dashboard, design-kit, fixture]
status: complete
last_updated: 2026-09-28
last_updated_by: Claude (autonomous research step)
---

# Research: per-month „ponad progiem” trend on `/home` (S-07)

**Date**: 2026-09-28T20:20:35+02:00
**Researcher**: Claude (autonomous run, research step — no human in the loop)
**Git Commit**: 8c08aef7184b2aa6f2bb925eb655a023ba1fcd4a
**Branch**: feat/over-limit-trend
**Repository**: Rytm

Anchors are **file + symbol** (agent contract: never line numbers).

## Research Question

Derived from `change.md` (no human asked): (1) how the trend reuses the shipped over-limit path without a second
derivation; (2) which months form the axis; (3) the „niepełny” PRD↔kit conflict; (4) for every other figure on the
kit's `/home` (`dashboard()`), whether the PRD defines it — in or out of S-07, out → DESIGN-GAP; (5) which shared
components exist; (6) error/empty branches; (7) whether a migration is needed; (8) which fixture months carry
over-limit amounts under a sensible threshold so the trend is verifiable.

## Summary

- **Reuse contract (resolved).** `overLimit` (`src/lib/patterns/over-limit.ts`) already returns `byMonth` for every
  month of one pattern; only positive months are recorded. `listOverview` (`src/lib/patterns/view.ts`) reads just
  `byMonth.get(refMonth)` after three guards: stored threshold `appliesTo` the pattern's type, a non-null reference
  month, and `!pattern.excluded`. The trend is one new pure function beside `listOverview` that applies **the same
  three guards** and the same `patternTxs(pattern, indexById(rows))` join, then sums every `byMonth` entry into a
  month map. Invariant to test: `trend[referenceMonth] === Σ listOverview(...).items[].overMinor`.
- **Month axis (resolved with a recommendation).** PRD FR-013 says only „miesięcy obecnych w danych”; US-05 AC 2 says
  „0, nie brak wartości”. No earlier decision defines a global axis (S-04 decision 2 fixes only the reference month;
  `patternDetail.months` is per pattern). Recommend: continuous calendar range from the earliest month in `rows` to
  `referenceMonth(rows)`, stepped with `previousMonth`-style arithmetic, zero-filled. On the F-02 fixture both readings
  give the same 12 months (2025-09 … 2026-08); a unit case with a gap month decides the difference.
- **„niepełny” marker (conflict, resolved for PRD).** PRD US-05 AC 4 („bez oznaczenia”, assumption 2026-09-18)
  contradicts kit `trendChart()` (`.tbar.hot` + `<b>niepełny</b>` + legend `trend.current`). The app cannot know
  completeness either: the reference month is the latest in the data (maintainer binding). → PRD wins, DESIGN-GAP.
- **PRD Non-Goal vs kit chart.** PRD Non-Goals: „Wykresy inne niż lista i suma — MVP pokazuje listy i sumy per
  miesiąc.” The kit delivered the bar chart (design-kit.md G6 „delivered · `.monthly-trend`”). The two reconcile if
  every bar carries its **numeric sum** (the PRD's „suma per miesiąc”); the kit bars carry height only → DESIGN-GAP
  (value label / accessible list).
- **Undefined `/home` figures.** The PRD never mentions a dashboard, `/home`, a greeting, „Rozpoznane wydatki”, the
  „Koszty stałe” value, the „+X zł względem …” delta or „Co wraca najczęściej” (grep of `context/foundation/prd.md`).
  Recommendations per element in the scope table below: stat 1 + its delta, trend panel, greeting-no-name, lead,
  upload button and import panel **in**; „Koszty stałe” card **in** only as defined by existing pure functions (S-06
  follow-up); „Rozpoznane wydatki” and „Co wraca najczęściej” **out** → DESIGN-GAP.
- **Migration: none.** Thresholds are stored per `(user_id, merchant_key)` in `pattern_thresholds` and read whole by
  `loadThresholds`; the trend is recomputed per request from `loadPatternData`, so a threshold change/removal moves
  every month by construction (FR-013 „według dzisiejszych progów”). No pgTAP / `db:types` work.
- **Fixture (verifiable trend).** Under count threshold **1/mies. on „kino-swiatlo”** (US-05 analogue) the fixture
  yields over-limit amounts in 2025-10, 2026-05, 2026-06, 2026-07 and 0 in the other 8 months; raising it to 2 moves
  historical months (US-05 „zmienia próg … przelicza wszystkie miesiące”). Details in § Fixture.

## Detailed Findings

### 1. The over-limit path the trend must reuse

- `overLimit(txs, threshold, type)` (`src/lib/patterns/over-limit.ts`): returns `{ byTx, byMonth }`; `null` threshold
  or a kind that does not `appliesTo` the type → empty maps; months with `monthOver === 0` are **not** set. So the
  trend must zero-fill itself.
- Excess semantics (maintainer binding confirmed at Step 0): `sum`/`amount` = excess; `count` = full amount of
  every transaction after the N-th in the month (`overLimit`, S-04 decision 1). Chronological order =
  `byOccurredThenId` (numeric id tie-break).
- `listOverview` (`src/lib/patterns/view.ts`) guards: `stored && appliesTo(stored, pattern.type)`; `!refMonth`;
  `pattern.excluded` → `overMinor: 0`. `patternDetail` runs `overLimit(txs, pattern.excluded ? null : applicable, …)`
  — same exclusion rule. The trend must use the same guards; a pattern merged into a root appears once (derive merges
  components into the root, threshold keyed on the root — `derivePatterns` in `src/lib/patterns/derive.ts`, consumed
  via `loadPatternData`).
- `patternTxs` throws on drift (`pattern "…" references missing transaction "…"`); `indexById` builds the join map.
  Both exported for reuse (header comment of `view.ts`).
- Helpers present: `monthOf`, `previousMonth`, `referenceMonth` (over-limit.ts). Absent: a helper that lists or steps
  **forward** through months (only `previousMonth` exists) — the axis needs either a `nextMonth` or iteration
  backwards from the reference month with `previousMonth` until the earliest month.

### 2. Month axis

- PRD FR-013: „dla wszystkich miesięcy obecnych w danych (trend)”; US-05 Then: „dla każdego z 12 miesięcy”; AC 2:
  „Miesiąc bez transakcji ponad progiem pokazuje 0, nie brak wartości.” PRD is **silent** on a calendar month with no
  transactions at all between two imports.
- Earlier decisions: S-04 plan decision 2 (reference month = latest month in data, `referenceMonth`); S-06
  `fixedOverview` treats a gap month as „no comparison” (`hasComparison`), i.e. gaps are real in the domain.
- Options: (a) months with ≥ 1 row — literal; a gap month disappears and the axis silently compresses time;
  (b) continuous earliest → reference, zero-filled — a gap month shows 0. **Recommend (b)**: a trend is a time series
  and the secondary success criterion („czy suma maleje z miesiąca na miesiąc”) reads month-to-month. Caveat: under
  (b) a gap month shows 0 though nothing was imported for it — acceptable for FR-013 (AC 2), recorded as a plan
  decision with a reversal condition (maintainer prefers strict reading).
- Rows counted for the axis: all debit rows (`loadPatternData.rows`), including excluded patterns' rows — the axis
  is „months present in the data”, independent of thresholds; otherwise an account with no thresholds has no axis.
- Axis length < 3 → kit `.info-panel` with `trend.tooShort` („Trend pojawi się po 3 miesiącach danych.”, present in
  `copy.trend`). Kit renders bars **and** the info panel together (`trendChart()`).

### 3. Kit `/home` elements — defined or not, and scope recommendation

Kit source: `design/rytm-os/prototype/app.js` `dashboard()` + `trendChart()` + `applyDashboardState`; copy
`design/rytm-os/react-kit/docs/content.json` `dashboard.*`, `trend.*` (via `copy` in `src/content/copy.ts`).

| Kit element | PRD defines? | Existing function | Recommendation |
|---|---|---|---|
| Trend panel „Ponad progiem” · „miesięcznie · wszystkie dane” (`copy.trend.title/range/legend`) | yes — FR-013, US-05 | new aggregate over `overLimit` | **IN (core)** |
| Bar value (numeric sum per month) | yes — „suma per miesiąc”; Non-Goal says lists and sums only | same aggregate + `formatMoney` | **IN**, but kit has no value label → **DESIGN-GAP** |
| „niepełny” bar + legend `trend.current` | PRD **contradicts** (US-05 AC 4) | — | **OUT** → DESIGN-GAP |
| `trend.tooShort` info panel (< 3 months) | secondary criterion „≥ 3 miesiącach” | axis length | **IN** (copy exists) |
| All-zero trend (no threshold anywhere / nothing over) | AC 2 requires 0s | — | **IN as zeros**; kit's `max(12%, …)` minimum height would draw 0 as data and `max = 0` divides by zero → **DESIGN-GAP** (zero-bar rendering, no copy for „no threshold yet”) |
| Stat 1 „Ponad progiem w tym miesiącu” value | yes — Business Logic „Wynik”: „suma „ponad progiem w tym miesiącu””; S-04 decision 2 | `trend[referenceMonth]` = Σ `listOverview` `overMinor` | **IN** |
| Stat 1 foot „+42,20 zł względem kwietnia” | **silent** | `trend[R] − trend[previousMonth(R)]`, both from the same aggregate — no new domain rule | **IN (lean)** with copy **DESIGN-GAP** (template, sign/zero states, genitive month names — `copyExtra.patterns.monthsLocative` exists, no genitive list; `formatSignedMoney` exists). If R is the only month: no foot |
| Stat 2 „Rozpoznane wydatki” + „64 transakcje · 12 wzorców” | **silent**; PRD has no notion of „unrecognised” spending (every debit belongs to one pattern — `derivePatterns`) | none | **OUT** → DESIGN-GAP. Defining it needs a product rule (R only? excluded included? — open `[human]` 7.9 names exactly this: „the product owner naming a total spending figure for S-07”) |
| Stat 3 „Koszty stałe” foot „N pozycje podrożały” | PRD Primary „które podrożały” (FR-012) | `fixedOverview(patterns, rows).changed.filter((r) => r.deltaMinor > 0).length` (S-06 follow-up, `src/lib/patterns/fixed.ts` header) | **IN** (plural forms `copyExtra.fixed.itemForms` exist; verb „podrożała/podrożały/podrożało” absent → copy gap) |
| Stat 3 „Koszty stałe” value „1 920 zł” | **silent** | candidate: Σ `amountMinor` over `fixedOverview` `changed ∪ new ∪ unchanged` = sum of the per-row amounts `/fixed` already shows for R | **Plan decides**: IN only with this definition (no new rule — a sum of figures already on `/fixed`); otherwise the card renders the foot only and the value is a DESIGN-GAP. Never a kit sample number |
| „Co wraca najczęściej” panel (3 `.list-item`s, „N razy · próg X”, „+excess” or sum, „próg własny”, „Zobacz wszystkie wzorce”) | **silent**; kit takes `data.patterns.slice(0, 3)` — no rule | `derivePatterns` sorts by `sumMinor` desc, not by frequency; per-month vs all-time count undefined | **OUT** → DESIGN-GAP (selection/order/meta/copy: „Co wraca najczęściej”, „próg własny”, „Zobacz wszystkie wzorce” exist only in `app.js`) |
| Greeting | K5: name optional, app stores no name | `copy.dashboard.greetingNoName` „Dzień dobry.” | **IN** (no-name variant) |
| Lead „Oto rytm Twoich wydatków w maju.” | silent (presentation) | `copy.dashboard.description` is a **sample** with the month baked in; `copyExtra.patterns.monthsLocative` + a `{month}` template (the pattern used by `patterns/[...key].astro` `sumLabel`) | **IN (lean)** via a `copyExtra` template → K11-class gap row. Alternative no-name lead „Twój maj w jednym spokojnym widoku.” exists only in `applyDashboardState` |
| `+ Wgraj CSV` button | — | `copyExtra.patterns.upload`, `buttonVariants` | **IN** |
| Import panel „Dodaj najnowszy wyciąg” | — | `copy.dashboard.importTitle/importBody`, `copyExtra.imports.choose` „Wybierz plik”, `Icon.astro` `import` | **IN** (static) |
| Axis label „maj 26” | — | `formatMonthShort` gives „maj 2026”; no short-label helper | **IN**, needs a formatter (Intl `pl-PL` short month + 2-digit year) — formatting, not copy |
| Empty (no transactions) `#/home-empty` | — | current `home.astro` (`EmptyState`, `copyExtra.home.*`) | **IN, unchanged**, now conditional on `referenceMonth(rows) === null` |
| Read error | — | `InlineAlert kind="error"` + `copy.components.error` (`patterns.astro`, `fixed.astro`, K18) | **IN**, same shape |

### 4. Shared components (what exists)

Existing and reusable: `src/components/app/PageTitle.astro` (`.dash-title`, slot for the right-hand button),
`Panel.astro` (`.panel`), `EmptyState.astro` (`.empty-dashboard`, already in `home.astro`), `InlineAlert.astro`,
`src/components/Icon.astro`, `buttonVariants` (`src/components/ui/button.tsx`), `merchantMark`
(`src/components/patterns/merchant-mark.ts`), formatters in `src/lib/format.ts` (`formatMoney`, `formatSignedMoney`,
`formatMonthShort`, `plural`). **None** for `.stats`/`.stat-card(.accent)`, `.dash-grid`, `.panel-title` (inline in
`patterns/[...key].astro`), `.trend`/`.monthly-trend`/`.tbar`, `.legend`/`.dot`, `.info-panel`, `.import-panel`,
`.text-link`. The stat value on `patterns/[...key].astro` reuses only the label string `copy.dashboard.stats[0].label`.
Tokens: `ink`, `paper`, `paper-soft`, `excess`, `excess-text`, `muted`, `line`, `green` (`src/styles/global.css`
`@theme`); the kit's bar grey `#9aaab3`, dashed gridline, info/import-panel background `#e8ecea` have **no token** →
map to the nearest allowed name or record a gap (never a raw hex, per CLAUDE.md colour rule). The kit bar colour for
non-current months is grey, not `excess`; with the „hot” state dropped, all bars share one colour.

### 5. Error and empty branches

`patterns.astro` and `fixed.astro`: `createClient` → `loadPatternData` → `{error}` → `console.error` + `PageTitle` +
`<InlineAlert kind="error">{copy.components.error}</InlineAlert>` (DESIGN-GAP K18). **No `try`** around
`listOverview` / `fixedOverview`: a `patternTxs` drift throw becomes a 500 (S-06 follow-up, trigger „next change
touching `loadPatternData`”). `/home` will call both the new aggregate and `fixedOverview`; wrapping those calls so a
throw lands in the same `InlineAlert` branch is cheap in a new page (recommend; do not retrofit `/patterns`/`/fixed`
— other views).

### 6. Tests and smoke today

- `scripts/smoke.mjs`: `/home` asserted only anonymously (302) and signed-in **before** import („home renders empty
  state for signed-in user” → „Nie masz jeszcze żadnego importu.”). No post-import `/home` assertion. Smoke uses its
  own synthetic CSV with a pattern „kawiarnia smoke” and a threshold saved/changed/removed via
  `/api/patterns/threshold` + `/delete` — the natural place for „save threshold → `/home` value changes, delete →
  drops” (assert bare text with and without the trigger, agent-contract rule).
- `test/unit/pattern-view.test.ts` covers `listOverview`/`patternDetail`/`detailTarget`;
  `test/unit/fixed-overview.test.ts` has crafted cases 1–15 and an F-02 fixture case 16 (`fixtureSources`) — the
  pattern to copy for a trend fixture case. No `/home` test exists.

### 7. Fixture — months carrying over-limit amounts

Computed from `test/fixtures/ing/expected.json` (`rows[]` with `imported: true`, grouped by `pattern`, amounts
negated to positive grosze, order `(occurredOn, line)`; the count rule of `overLimit`). Caveats: `expected.json`
keys (e.g. `kino-swiatlo`) are the answer-key keys — the plan must confirm the matching `derivePatterns` key (as
`fixed-overview.test.ts` case 16 did); DB ids follow insert order, and none of the patterns below has two rows on the
same date within a month, so the id tie-break does not affect these numbers.

Fixture months: 12 consecutive, 2025-09 … 2026-08 (reference month 2026-08).

| Threshold | 25-09 | 25-10 | 25-11 | 25-12 | 26-01 | 26-02 | 26-03 | 26-04 | 26-05 | 26-06 | 26-07 | 26-08 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `kino-swiatlo` (frequent, 14 tx) count 1 | 0 | 49,13 | 0 | 0 | 0 | 0 | 0 | 0 | 133,47 | 41,24 | 87,59 | 0 |
| `kino-swiatlo` count 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 98,22 | 0 | 51,98 | 0 |
| `stacja-drogowskaz` (frequent, 15 tx) count 1 | 286,88 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 221,40 | 955,34 |
| `stacja-drogowskaz` count 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 834,69 |
| `pizzeria-trzy-sery` sum 50,00 zł | 0 | 0 | 54,44 | 0 | 0 | 0 | 4,79 | 17,55 | 49,10 | 60,12 | 0 | 17,07 |

Recommended verification set (US-05 analogue): `kino-swiatlo` count 1 → 4 non-zero historical months, reference
month 0 (proves AC 2 on the latest bar); change to 2 → 2025-10 and 2026-06 drop to 0, 2026-05 and 2026-07 shrink
(proves „przelicza wszystkie miesiące, także historyczne”); delete → all 0; add `stacja-drogowskaz` count 1 → the
reference month becomes 955,34 and 2025-09 286,88 (proves the cross-pattern sum; with both at count 1 the totals are
2025-09 286,88; 2025-10 49,13; 2026-05 133,47; 2026-06 41,24; 2026-07 308,99; 2026-08 955,34). Sum-type check:
`pizzeria-trzy-sery` 50,00 zł gives 7 non-zero months including the excess-only crossing (2026-03 4,79).
`przelew-konto-osobiste` is a `user-exclude` pattern in the key (excluded only after a decision) — a unit case with
it excluded + a threshold should contribute 0 to every month.

## Code References

- `src/lib/patterns/over-limit.ts` — `overLimit`, `appliesTo`, `monthOf`, `previousMonth`, `referenceMonth`, `byOccurredThenId`
- `src/lib/patterns/view.ts` — `listOverview` (guards to mirror), `patternDetail`, `patternTxs` (drift throw), `indexById`
- `src/lib/patterns/fixed.ts` — `fixedOverview` (stat 3 foot, candidate value)
- `src/lib/patterns/load.ts` — `loadPatternData` (one read: `patterns`, `rows`, `thresholds`, `decisions`)
- `src/lib/patterns/derive.ts` — `derivePatterns` (merge-to-root, `excluded`, sort by `sumMinor` desc)
- `src/pages/home.astro` — static placeholder (`PageTitle` + `EmptyState` unconditional)
- `src/pages/patterns.astro`, `src/pages/fixed.astro` — error-branch shape (`InlineAlert`, K18)
- `src/lib/format.ts` — `formatMoney`, `formatSignedMoney`, `formatMonthShort`, `plural`
- `src/content/copy.ts` — `copy.dashboard`, `copy.trend`, `copyExtra.home`, `copyExtra.patterns.monthsLocative`, `copyExtra.fixed.itemForms`
- `design/rytm-os/prototype/app.js` — `dashboard`, `trendChart`, `applyDashboardState`, sample `data.months`
- `design/rytm-os/prototype/styles.css` — `.stats`, `.stat-card`, `.dash-grid`, `.trend`, `.monthly-trend`, `.tbar`, `.legend`, `.info-panel`, `.import-panel`
- `test/fixtures/ing/expected.json` — month/pattern data for § 7
- `scripts/smoke.mjs` — „home renders empty state for signed-in user”, threshold save/change/remove cases

## Architecture Insights

- Every page is „one read (`loadPatternData`) → pure assembly in `src/lib/patterns/*` → Astro render”; S-07 fits as a
  new pure export (e.g. `overLimitTrend`) plus an `/home` page composition. No API route needed (the page is SSR).
- Rules live in exactly one place (`overLimit`, `fixedOverview`); later slices consume exports, never re-derive —
  explicitly requested by the S-06 follow-up and the `fixed.ts` header.
- DESIGN-GAP ids: the gap register's highest id is **G34** (`context/foundation/design-kit.md`, S-06); next free
  **G35**. Conflicts table highest **K23**.

## Historical Context (from prior changes)

- `context/archive/2026-09-27-pattern-threshold-over-limit/plan.md` — decision 1 (excess semantics), decision 2
  (reference month), out-of-scope „No `/home` stat card and no trend (S-07)”. Supported, still current.
- `context/archive/2026-09-28-durable-pattern-decisions/plan.md` decision 9 + `follow-ups/review-fixes.md`
  „S-07 — monthly sums must skip `pattern.excluded`” (trigger: first phase that builds a monthly total) — **in scope**;
  F6 (`validateMerge` lets an excluded source re-enter) — trigger fires, fix belongs to `/patterns/<key>` (other view);
  `[human]` 7.9 still open.
- `context/archive/2026-09-28-fixed-cost-changes/follow-ups/review-fixes.md` — „N pozycje podrożały” via
  `fixedOverview` (in scope); drift throw → 500 (recommend handling in `/home`).
- design-kit.md G6 „delivered · `.monthly-trend`”, K1 (stat renamed to „ponad progiem w tym miesiącu”), K4 (chart per
  month), K5 (name optional), K11 (copy gaps → `copyExtra`), K18 (error line).

## Related Research

- `context/archive/2026-09-27-pattern-threshold-over-limit/research.md` — § „w tym miesiącu” (reference month shared
  with the later `/home` stat).

## Open Questions

For the plan (product choices, not missing evidence):

1. „Koszty stałe” value: sum of `/fixed` row amounts in R, or foot-only card + gap. Lean: sum (no new rule).
2. Stat 1 delta foot: render (template gap) or drop. Lean: render; hide when `previousMonth(R)` is outside the axis.
3. Layout with „Rozpoznane wydatki” and „Co wraca najczęściej” out: two stat cards + full-width trend panel vs keep
   the kit grid with gap placeholders. Lean: omit the elements (never placeholder numbers), note in the gap rows.
4. Month axis strict vs continuous — recommended continuous (§ 2); needs a gap-month unit case.
5. Bar value presentation (visible label vs visually hidden list) — DESIGN-GAP; any choice must keep the numeric sum
   readable (PRD Non-Goal wording + accessibility).

Evidence gaps: none material. `derivePatterns` keys for the fixture patterns in § 7 were not executed here (answer-key
keys used); confirm in the plan's unit case.
