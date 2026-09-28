# Trend „ponad progiem” per miesiąc (S-07 `over-limit-trend`) Implementation Plan

## Overview

Turn `/home` from a static placeholder into the kit's dashboard (`dashboard()` in the no-name variant) for an account
with transactions: a monthly „Ponad progiem” trend over every month of the user's data, computed on read from
**today's** thresholds (FR-013, US-05), the stat „Ponad progiem w tym miesiącu” with its change against the previous
month, the „Koszty stałe” card built from S-06's `fixedOverview`, and the „Dodaj najnowszy wyciąg” import panel. The
trend is one new pure aggregate over the shipped `overLimit` rule, over the months present in the data — the same guards as `listOverview`, so its last
point equals the sum of the over-limit figures `/patterns` shows. The pre-import view stays. No migration.

## Current State Analysis

Source: `context/changes/over-limit-trend/research.md`, re-checked here against the files below on
`feat/over-limit-trend` (`3fedeb7`).

- **Page.** `src/pages/home.astro` renders `PageTitle` (`copyExtra.home.empty*`) + `EmptyState` **unconditionally**,
  even for an account with data. `/home` is already protected (`src/middleware.ts` `PROTECTED_ROUTES`) and the
  sidebar/mobile entry exists.
- **Read.** `src/lib/patterns/load.ts` `loadPatternData(supabase)` → `{ patterns, rows, thresholds, decisions }` or
  `{ error }` — patterns already carry S-05 decisions (merge-to-root, `pinnedType`, `excluded`); thresholds are the
  current ones (`pattern_thresholds`, one row per `(user_id, merchant_key)`, never per month).
- **Rule.** `src/lib/patterns/over-limit.ts` `overLimit(txs, threshold, type)` returns `byMonth` for **every** month of
  one pattern (only positive months recorded); `appliesTo`, `monthOf`, `previousMonth`, `referenceMonth` exist; no
  forward month step. `src/lib/patterns/view.ts` `listOverview` reads only `byMonth.get(refMonth)` after the guards
  `stored && appliesTo(stored, pattern.type)`, `refMonth`, `!pattern.excluded`; `patternTxs` / `indexById` are
  exported; `patternTxs` throws on id drift.
- **S-06 export.** `src/lib/patterns/fixed.ts` `fixedOverview(patterns, rows)` → `changed` / `new` / `unchanged` for
  the reference month (header names the `/home` card as its S-07 consumer).
- **Page shape to copy.** `src/pages/fixed.astro`: `createClient` → `loadPatternData` → a typed `result` union →
  error branch (`console.error` + `PageTitle` + `InlineAlert kind="error"` `copy.components.error`, `DESIGN-GAP: K18`)
  → empty branch → content. No `try` around the pure assembly (S-06 follow-up: a drift throw becomes a 500).
- **Shared UI.** `PageTitle.astro` (slot for the right-hand button — `patterns.astro` puts `+ Wgraj CSV` there with
  `buttonVariants({ variant: "primary" })`), `Panel.astro` (`p-[22px]`, ≤ 559 px `p-[17px]`), `EmptyState.astro`,
  `InlineAlert.astro`, `Icon.astro` (`import`, `arrow`), `buttonVariants` (`primary`, `ghost`). **No** component for
  `.stats` / `.stat-card`, `.panel-title`, `.trend` / `.tbar`, `.legend` / `.dot`, `.info-panel`, `.import-panel`.
- **Formatters.** `src/lib/format.ts` `formatMoney`, `formatSignedMoney`, `formatMonthShort` („maj 2026”), `plural`.
  `Intl.DateTimeFormat("pl-PL", { month: "short", year: "2-digit", timeZone: "UTC" })` yields the kit's axis label
  „maj 26” / „paź 25” (checked in Node at plan time).
- **Copy present.** `copy.dashboard.{eyebrow, greetingNoName, stats[0].label, stats[2].label, importTitle, importBody}`,
  `copy.trend.{title, range, legend, tooShort}` (`trend.current` exists — not used, see decision 3),
  `copyExtra.patterns.upload` („+ Wgraj CSV”), `copyExtra.patterns.monthsLocative` (the `{month}` + month-list
  precedent), `copyExtra.imports.choose` („Wybierz plik”), `copyExtra.fixed.itemForms`. Only in `app.js`:
  `applyDashboardState`'s no-name lead „Twój maj w jednym spokojnym widoku.”; only as a `content.json` **sample**:
  „+42,20 zł względem kwietnia”, „2 pozycje podrożały”.
- **Tokens.** `paper-soft` = `#E8ECEA` = the kit's `.info-panel` / `.import-panel` background exactly. No token for the
  bar grey `#9aaab3`, the dashed gridline `#d2d7d8`, the import-panel border `#9da9aa` or the accent label brown
  `#72501f`. Next free gap ids: **G35**, **K24** (`context/foundation/design-kit.md`: last G34, last K23).
- **Fixture, confirmed by running `derivePatterns` at plan time** (throwaway vitest over
  `Lista_transakcji_nr_0000123456_010926.csv`, then deleted): 206 rows, 12 months `2025-09` … `2026-08`, reference
  `2026-08`, 31 patterns. The research's answer-key slugs map to `derivePatterns` keys **`"kino światło"`**
  (frequent, 14), **`"stacja paliw drogowskaz"`** (frequent, 15), **`"pizzeria trzy sery"`** (frequent, 7).
  `overLimit(...).byMonth` observed:
  - `kino światło` count 1 → `2025-10` 4913 · `2026-05` 13347 · `2026-06` 4124 · `2026-07` 8759
  - `kino światło` count 2 → `2026-05` 9822 · `2026-07` 5198
  - `stacja paliw drogowskaz` count 1 → `2025-09` 28688 · `2026-07` 22140 · `2026-08` 95534; count 2 → `2026-08` 83469
  - `pizzeria trzy sery` sum 5000 → `2025-11` 5444 · `2026-03` 479 · `2026-04` 1755 · `2026-05` 4910 · `2026-06` 6012 ·
    `2026-08` 1707 (**6** non-zero months — research § 7 said 7; its table was right, the prose count was not)
  - `fixedOverview`: `changed` = `kinoteka` +400 (5999); `new` = `siłownia ruch` 12900; `unchanged` =
    `jan przykładowy` 150000, `kawa-testowa.pl` 3900, `muzykalnia` 2499 → Σ amounts **175298**, rises **1**.
- **Smoke user state** (`scripts/smoke.mjs` `steps`): „home renders empty state for signed-in user” — no import. After
  „patterns list the re-imported merchant”: one May-2026 import (Sklep smoke 12,99 05-04, Kawiarnia smoke 45,50
  05-20), no threshold. After „threshold is changed”: Kawiarnia (`fixed`) `amount` 40 zł → May over **5,50 zł**.
  After „pattern detail drops the over-limit mark after removal”: no threshold. Later Sklep is merged into Kawiarnia,
  pinned `fixed`, threshold `amount` 40 saved again, Kawiarnia excluded; „import after the decisions is saved” adds June
  (Sklep 12,99 06-04, Piekarnia 8,00 06-10, Kawiarnia 47,00 06-20); after „later import keeps the exclusion” the only
  threshold belongs to an excluded pattern → every month 0. After „restored pattern shows its over-limit again”: May
  **5,50 zł**, June **7,00 zł**. After „unmerged pattern has its own detail again”: same trend; `/fixed` shows
  Kawiarnia Rytm +1,50 zł (4700), Sklep smoke unchanged (1299), Piekarnia smoke new (800) → Σ **67,99 zł**, 1 rise.
- **Baseline** (agent contract, `main` `c0b0068`; vitest and fixture:check re-observed on this branch at plan time):
  lint 0 · astro check 0 errors (124 files) · fixture:check OK · vitest 213 (12 files) · build OK · pgTAP 102 (5 files)
  · smoke 121 PASS.

## Desired End State

- `/home` for an account with transactions shows eyebrow „Przegląd miesiąca”, h1 „Dzień dobry.”, lead „Twój <miesiąc>
  w jednym spokojnym widoku.” (reference month, nominative) and `+ Wgraj CSV`; then two stat cards — accent „Ponad
  progiem w tym miesiącu” = the reference month's over-limit sum with foot „<±delta> względem <poprzedniego miesiąca>”
  (hidden when the calendar month before R has no data — one month of data, or a gap month; plan review F1), and „Koszty stałe” = Σ of the amounts `/fixed` lists for the reference month with
  foot „N pozycje podrożały”; then the full-width panel „Ponad progiem · miesięcznie · wszystkie dane” with one bar per
  month present in the data (≥ 1 debit — FR-013 literal, plan review F1), ascending, each bar labelled with its sum and its
  month („maj 26”), a month with nothing over showing `0,00 zł` and no bar height, the legend „suma ponad progiem”, the
  „Trend pojawi się po 3 miesiącach danych.” panel under fewer than 3 months and a hint when no pattern has an
  applicable threshold; then the „Dodaj najnowszy wyciąg” panel.
- Changing or removing a threshold changes every month on the next request; an excluded pattern adds nothing to any
  month; no bar is marked „niepełny”; a calendar month without any imported debit is not on the axis (never a
  false `0,00 zł`). The trend's reference-month value equals Σ of `/patterns` over-limit figures.
- An account with no transactions keeps today's pre-import view; a failed read — or a drift throw inside the assembly —
  shows the error line, never a 500.
- On the synthetic fixture with `kino światło` count 1: bars `paź 25` 49,13 zł, `maj 26` 133,47 zł, `cze 26` 41,24 zł,
  `lip 26` 87,59 zł, the other 8 at `0,00 zł`; stat `0,00 zł`, foot „−87,59 zł względem lipca”; „Koszty stałe”
  `1752,98 zł`, „1 pozycja podrożała”. Count 2 → `paź 25` and `cze 26` drop to 0, `maj 26` 98,22 zł, `lip 26` 51,98 zł.
- Verified by: vitest +2 files (and cases in `over-limit` / `format` tests), smoke +10, screenshots of every named state.

### Key Discoveries:

- `overLimit` already yields every month; the whole domain change is a sum over `byMonth` over the months present in the data —
  no new rule, no stored totals (FR-013 „według dzisiejszych progów” holds by construction).
- The smoke user's existing steps already reach every trend state: no import, one month without / with / after removal
  of a threshold, two months with the threshold pattern excluded, and two months with historical May + current June —
  `/home` smoke is pure GETs inserted between existing steps; no new payload.
- `/home` has no island, so no serialized-props false positive; but every asserted string must be the only child of
  its element, on one line (`eslint --fix` wraps long elements; Astro then emits `<tag> text </tag>` — the
  `InlineAlert` trap). Check the served HTML with `curl` before asserting; where the formatter insists on wrapping,
  assert bare text and keep each positive/negative pair.
- The bar value doubles as the proof in smoke: in Phase 2 no stat card exists yet, so `>5,50 zł<` can only come from a
  bar label; from Phase 3 the unique strings (delta foot, „podrożała”, `67,99 zł`) carry the stat proofs.

## What We're NOT Doing

- No „niepełny” marker, no `.tbar.hot`, no `trend.current` legend entry (PRD US-05 AC 4 wins over the kit — G35).
- No „Rozpoznane wydatki” card and no „Co wraca najczęściej” panel (PRD defines neither figure; `[human]` S-05 7.9
  open) — G36; the trend panel takes the full width.
- No greeting with a name (the app stores none, K5), no month picker, no bar tooltip/interaction, no link from a bar.
- No fix of S-05 F6 (`validateMerge` lets an excluded source re-enter — another view); no retrofit of `try` into
  `/patterns` / `/fixed`; no change to `overLimit`, `fixedOverview` or `derivePatterns` semantics.
- No migration, no pgTAP change, no `db:types`, no change to smoke payloads or the fixture.

## Implementation Approach

Four small phases, each independently green on the full local gate and committed on green by a fresh agent: the pure
trend aggregate with its axis and formatter (no UI) → `/home` title block + trend panel (one new component) → the two
stat cards and their pure summary (one new component) → the import panel, follow-ups and the seam sweep (one new
component). Baseline for every delta: lint 0 · astro check 0 errors (124 files) · fixture:check OK · vitest 213 (12
files) · build OK · pgTAP 102 (5 files) · smoke 121 PASS. Each phase re-measures its own starting point and writes
`baseline + delta`.

Local gate (every phase):

```bash
npm run lint && npx astro check && npm run fixture:check && npm test && npm run build
npx supabase db reset && npx supabase test db
ASTRO_DEV_BACKGROUND=1 npx astro dev --port 4398 --ignore-lock &   # then
BASE_URL=http://localhost:4398 npm run smoke                        # then: lsof -ti :4398 | xargs kill
```

(Docker / `127.0.0.1:54321` commands run with the sandbox disabled; never port 4321.)

## Critical Implementation Details

- **The aggregate, exactly.** R = `referenceMonth(rows)` over the full read. Axis = the distinct
  `monthOf(occurredOn)` over **all** rows (excluded patterns' rows included — the axis is „months present in the
  data”, FR-013 literal, independent of thresholds), sorted ascending; its last entry is R. A calendar month with no
  row is **not** on the axis (plan review F1 — a month without data is unknown, not „0 ponad progiem”). For each pattern:
  `threshold = applicableThreshold(pattern, thresholds)`; skip when `!threshold || pattern.excluded`; otherwise add
  every entry of `overLimit(patternTxs(pattern, byId), threshold, pattern.type).byMonth` into the month map. Every axis
  month without an entry is `0` (US-05 AC 2 — a month with data and nothing over). `hasThreshold` = some non-excluded pattern has an applicable threshold. Invariant:
  `months.at(-1).overMinor === Σ listOverview(patterns, rows, thresholds).items[].overMinor`.
- **One guard.** `applicableThreshold(pattern, thresholds)` (= `stored && appliesTo(stored, pattern.type) ? stored :
  null`) is extracted in `view.ts` and used by `listOverview` and the trend (`patternDetail` keeps its own
  `threshold` parameter) — the exclusion check stays explicit at each over-limit call site (the list still *displays* an excluded pattern's
  threshold, S-05 decision 8).
- **Bar height.** `trendBarHeight(value, max)`: `0` when `value === 0` (the bar renders as a 2 px stub so the month is
  visibly present), otherwise `max(12, value / max × 100)` % (kit `trendChart()`). `max === 0` never divides.
- **Error branch.** `/home` wraps the pure assembly (`overLimitTrend`, later `fixedOverview` / `homeStats`) in
  `try`/`catch`; a throw logs `console.error("home failed", …)` and renders the same branch as a failed read.
- **Single-string rendering.** Bar value, axis label, stat value, stat foot, info panel and hint are each one string
  (template helper in the frontmatter) rendered as the only child of their element with `{expr}` on the same line as
  the tags (S-06 plan, same trap).

## Phase 1: `overLimitTrend` — the pure monthly aggregate

### Overview

The DB-free aggregate, its month step, bar-height helper and axis-label formatter, unit-tested on crafted rows and on
the fixture. No caller yet — the app is unchanged.

### Changes Required:

#### 1. Month step — none

No `nextMonth` (plan review F1: the axis is the sorted set of months present in the data, not a stepped calendar
range). `over-limit.ts` is unchanged.

#### 2. Shared guard

**File**: `src/lib/patterns/view.ts`

**Intent**: One definition of „the threshold that applies to this pattern now”, not a copy in the trend.

**Contract**: `export function applicableThreshold(pattern: MerchantPattern, thresholds: ReadonlyMap<string,
Threshold>): Threshold | null`; `listOverview` uses it (behaviour unchanged — `pattern-view.test.ts` stays green
untouched); header comment names the S-07 consumer.

#### 3. The aggregate

**File**: `src/lib/patterns/trend.ts` (new)

**Intent**: FR-013 / US-05 as one pure function over the same read `/patterns` uses.

**Contract**:

```ts
export interface TrendMonth { month: string; overMinor: number }
export interface OverLimitTrend { referenceMonth: string | null; months: TrendMonth[]; hasThreshold: boolean }
export function overLimitTrend(patterns: readonly MerchantPattern[], rows: readonly PatternSource[],
  thresholds: ReadonlyMap<string, Threshold>): OverLimitTrend
export function trendBarHeight(value: number, max: number): number
```

Rule exactly as in Critical Implementation Details; no rows → `{ referenceMonth: null, months: [], hasThreshold:
false }`. Header comment cites FR-013, US-05 AC (0 not missing; today's thresholds only; no „niepełny”), the
maintainer bindings (excess semantics; reference month = latest month in the data), S-05 decision 9 (excluded adds
nothing), the axis decision (months present in the data — plan review F1) and the `listOverview` invariant. Imports only `over-limit.ts`, `view.ts`,
`@/types`.

#### 4. Axis formatter

**File**: `src/lib/format.ts`

**Contract**: `formatMonthAxis(yearMonth: string): string` — `2026-05` → „maj 26”, `2025-10` → „paź 25” (kit
`data-day`), `Intl.DateTimeFormat("pl-PL", { month: "short", year: "2-digit", timeZone: "UTC" })`.

#### 5. Unit tests

**Files**: `test/unit/over-limit-trend.test.ts` (new), `test/unit/format.test.ts`

**Contract**: crafted `MerchantPattern` + `PatternSource` literals (the `fixed-overview.test.ts` shape):

1. No rows → `referenceMonth: null`, `months: []`, `hasThreshold: false`.
2. Rows, no thresholds → every axis month `0`, `hasThreshold: false`.
3. Count 1 on a frequent pattern with 3 txs in 2026-06, 1 in 2026-07, 2 in 2026-08 → 06 = 2nd + 3rd amount, 07 = 0,
   08 = 2nd amount (historical months filled, not only R).
4. Same rows, count 2 → 06 = 3rd amount only, 08 = 0 (a changed threshold moves historical months — US-05).
5. Two patterns with thresholds → per-month sums; removing one pattern's threshold from the map → it contributes 0 in
   every month, the other unchanged.
6. Sum threshold: the crossing transaction contributes only its excess (the maintainer binding reaches the trend).
7. Excluded pattern with an applicable threshold → 0 in every month; `hasThreshold: false` when it is the only one.
8. Inapplicable threshold (`count` on a `fixed` pattern) → 0; `hasThreshold: false`.
9. Gap month: rows in 2026-05 and 2026-07 only → axis `[05, 07]` (no 06 — no data is not „0”); year boundary: rows in
   2025-11, 2025-12, 2026-01, 2026-02 → 4 months in chronological order.
10. The axis starts at an excluded pattern's earliest row.
11. Invariant: on a mixed set (thresholded, excluded, inapplicable, no threshold) the last month equals
    Σ `listOverview(...).items[].overMinor`.
12. `trendBarHeight`: `(0, 0)` → 0, `(0, 500)` → 0, `(10, 1000)` → 12, `(500, 1000)` → 50, `(1000, 1000)` → 100.
13. F-02 fixture (rows via `parseIngStatement` + `buildImportPayload`, `derivePatterns` without decisions, as
    `fixed-overview.test.ts` case 16): axis = the 12 months `2025-09` … `2026-08`; with `{"kino światło": count 1}` →
    `2025-10` 4913, `2026-05` 13347, `2026-06` 4124, `2026-07` 8759, the other 8 months 0; count 2 → `2026-05` 9822,
    `2026-07` 5198, the other 10 months 0; count 1 on both `kino światło` and `stacja paliw drogowskaz` → `2025-09`
    28688, `2025-10` 4913, `2026-05` 13347, `2026-06` 4124, `2026-07` 30899, `2026-08` 95534, the rest 0;
    `{"pizzeria trzy sery": sum 5000}` → `2025-11` 5444, `2026-03` 479, `2026-04` 1755, `2026-05` 4910, `2026-06` 6012,
    `2026-08` 1707, the rest 0. Assert the keys exist in `derivePatterns` output first (fail loudly on a key drift).

`format.test.ts`: `formatMonthAxis` for
„2026-05”, „2025-10”, „2026-01”.

### Success Criteria:

#### Automated Verification:

- `npm test` — 213 + the new cases, 13 files, 0 failures (record the total); `pattern-view.test.ts` untouched and green
- `npm run lint` 0 errors; `npx astro check` 0 errors (record the count; +2 expected: `trend.ts`, the test)
- `npm run fixture:check` OK; `npm run build` passes
- `npx supabase db reset && npx supabase test db` — 102 (delta 0); `BASE_URL=http://localhost:4398 npm run smoke` — 121 PASS (delta 0)
- Deliberate break (exclusion): drop the `pattern.excluded` skip in `overLimitTrend` → case 7 FAILs; restored → green. Meta-check: case 5 stays green, so the red is the exclusion guard, not the summing
- Deliberate break (axis): fill the axis as a continuous calendar range from the first to R → case 9 FAILs; restored → green. Meta-check: case 13 stays green (the fixture has 12 consecutive months), so only the gap case guards the axis rule — recorded, as expected
- Deliberate break (history): add only `byMonth.get(referenceMonth)` (the `listOverview` shape) → cases 3 and 13 FAIL while case 11 stays green. Meta-check: proves the invariant alone would not catch a trend collapsed to one month, which is why cases 3 / 13 exist

#### Manual Verification:

- [reviewer] `trend.ts` imports only `over-limit.ts`, `view.ts`, `@/types`; `applicableThreshold` is the single guard (no second `appliesTo(stored …)` ternary in `view.ts` / `trend.ts`); `patternTxs` not duplicated; header states the axis rule, the exclusion rule and the invariant

**Implementation Note**: proceed on green automated criteria.

---

## Phase 2: `/home` — title block and the trend panel

### Overview

The page reads the data, keeps the pre-import view, gains the error line, and renders the no-name title block plus the
full-width trend panel through one new component.

### Changes Required:

#### 1. Trend chart

**File**: `src/components/home/TrendChart.astro` (new)

**Intent**: Kit `trendChart()` + `.monthly-trend`, without the „niepełny” state, with a readable sum per month.

**Contract**: props `{ bars: { label: string; amount: string; height: number }[]; legend: string; note?: string; hint?:
string }`. Chart: `<ol>` (`aria-label` from the caller) in a wrapper `relative flex items-end gap-[13px] h-[200px]
border-b border-line px-2.5` with the dashed mid gridline (`border-t border-dashed border-line`, kit `#d2d7d8` → `line`),
`max-[559px]:gap-[7px]`, wrapped in `overflow-x-auto` so a long axis scrolls inside the panel, never the page. Each
`<li>` (`flex-1 min-w-[44px]`, column, justify-end): value `<span>` (9–10 px, `text-muted`, `whitespace-nowrap`) =
`amount`, bar `<i>` (`bg-muted/55` — kit `#9aaab3`, no token, G35; `rounded-t-[3px]`; `style` height `height%`, a
`height === 0` bar is a 2 px stub), axis `<span>` (10 px `text-muted`) = `label`. Legend below (`mt-[31px]`, 11 px
`text-muted`, `.dot` 8 px round `bg-muted/55`) with `legend` only. `note` → kit `.info-panel` (`mt-[14px] p-[13px]
bg-paper-soft border-l-[3px] border-ink text-xs text-muted`), `hint` → the same shape; each renders its text as the only
child. Header comment: kit `trendChart()`, what is deliberately absent (`.tbar.hot`, `trend.current`) and why (G35).

#### 2. Page

**File**: `src/pages/home.astro`

**Intent**: Real data instead of the unconditional placeholder.

**Contract**: `createClient` → `loadPatternData` (unconfigured client → error branch) → inside `try`:
`overLimitTrend(patterns, rows, thresholds)`; result union `{ error } | { referenceMonth: null } | { trend }`.

- Error: `console.error("home failed", error)`; `PageTitle` (eyebrow `copy.dashboard.eyebrow`, title
  `copy.dashboard.greetingNoName`) + `InlineAlert kind="error"` `copy.components.error`, `DESIGN-GAP: K18` comment.
- `referenceMonth === null`: today's `PageTitle` + `EmptyState`, unchanged.
- Otherwise: `PageTitle` eyebrow `copy.dashboard.eyebrow`, title `copy.dashboard.greetingNoName`, lead
  `copyExtra.home.lead` with `{month}` = `copyExtra.home.monthsNominative[R month − 1]`, slot `<a href="/imports/new">`
  `copyExtra.patterns.upload` (`buttonVariants({ variant: "primary" })`, as `patterns.astro`); then a `Panel` with the
  kit `.panel-title` inline (flex, space-between, mb 20; `<h2>` 17 px tracking −0.03em `copy.trend.title`; `<span>`
  12 px `text-muted` `copy.trend.range`) and `TrendChart` with `bars` from `trend.months` (`formatMonthAxis`,
  `formatMoney`, `trendBarHeight` against the max), `legend` `copy.trend.legend`, `note` `copy.trend.tooShort` when
  `months.length < 3`, `hint` `copyExtra.home.noThreshold` when `!trend.hasThreshold`.
- Header comment: kit `dashboard()` (no-name variant, K5), FR-013 / US-05, `overLimitTrend`, the `try` reason (S-06
  follow-up), stat cards arriving in Phase 3, import panel in Phase 4.

#### 3. Copy and gap register

**Files**: `src/content/copy.ts`, `context/foundation/design-kit.md`

**Contract**: `copyExtra.home` gains

- under `// DESIGN-GAP: K24` — verbatim from `prototype/app.js` `applyDashboardState` (`#/home-no-name`), generalised
  like `sumLabel`: `lead: "Twój {month} w jednym spokojnym widoku."`, `monthsNominative: ["styczeń", "luty", "marzec",
  "kwiecień", "maj", "czerwiec", "lipiec", "sierpień", "wrzesień", "październik", "listopad", "grudzień"]` (May
  reproduces the kit string byte for byte).
- under `// DESIGN-GAP: G35` — placeholder `noThreshold: "Ustaw próg na wzorcu, a tu pojawi się suma ponad progiem."`.

`design-kit.md`: **K24** (no-name lead exists only in `applyDashboardState`, with the month baked in); **G35** (trend
states the kit does not define or the PRD overrides: no „niepełny” marker / `trend.current` — PRD US-05 AC 4 and the
app cannot know completeness; a visible sum per bar — PRD „sumy per miesiąc”, label 9–10 px, bar `min-w-[44px]`
instead of 24 px, inner horizontal scroll; zero month = 2 px stub instead of the kit's 12 % minimum; a calendar month
without data absent from the axis (FR-013 literal; the kit sample has no gap); no-threshold hint placeholder; bar grey / dot / gridline token mapping `muted/55` / `line`; read error via
K18; placeholder · S-07 faza 2); **G6** status amended („S-07: wdrożone — `/home` na danych, bez „niepełny” (G35)”);
K24 / G35 appended to „Do rundy 3”.

#### 4. Smoke

**File**: `scripts/smoke.mjs`

**Contract**: first extend the checker so `notContains` accepts a single needle **or an array** (all must be absent),
symmetric to `contains` (`[expected.notContains].flat()` next to `needles`; today it takes one string only — plan
review F2); then inserted into the existing run (GETs only; header comment mentions `/home`):

1. after „home renders empty state for signed-in user”: „home before import has no trend” — GET `/home` → 200
   notContains `>Ponad progiem<`.
2. after „patterns list the re-imported merchant” (May, no threshold): „home shows the trend without a threshold” —
   contains `>Ponad progiem<`, `>0,00 zł<`, `>maj 26<`, `copy.trend.tooShort` and the `noThreshold` text.
3. after „threshold is changed” (May, `amount` 40): „home shows the over-limit sum” — contains `>5,50 zł<`,
   notContains the `noThreshold` text (negative control for step 2).
4. after „pattern detail drops the over-limit mark after removal”: „home drops the sum after threshold removal” —
   contains `>0,00 zł<`, notContains `>5,50 zł<`.
5. after „later import keeps the exclusion” (June, only threshold on an excluded pattern): „home skips an excluded
   pattern” — contains `>cze 26<`, notContains `>5,50 zł<` and `>7,00 zł<`.
6. after „restored pattern shows its over-limit again”: „home recomputes every month” — contains `>5,50 zł<` (May,
   historical) and `>7,00 zł<` (June).

### Success Criteria:

#### Automated Verification:

- `npm run lint` 0 errors; `npx astro check` 0 errors (record the count; +1 expected: `TrendChart.astro`)
- `npm test` — Phase 1 count, 0 failures (delta 0)
- `npm run fixture:check` OK; `npm run build` passes
- `npx supabase db reset && npx supabase test db` — 102 (delta 0)
- `BASE_URL=http://localhost:4398 npm run smoke` — 121 + 6 = 127 PASS
- Deliberate break (history): render only the last month's bar → „home recomputes every month” FAILs on `>5,50 zł<` while „home shows the over-limit sum” PASSes; restored → PASS. Meta-check: proves historical months reach the page, not just that the panel renders
- Deliberate break (exclusion reaches the page): drop the `pattern.excluded` skip in `overLimitTrend` → „home skips an excluded pattern” FAILs; restored → PASS. Meta-check: step 6 is the positive control after the restore, so the red is the exclusion, not the read
- Deliberate break (pre-import): drop the `referenceMonth === null` branch → „home before import has no trend” FAILs (or the existing empty-state step); restored → PASS. Meta-check: step 2 stays green, so the red is the no-data branch
- No raw colours in `src/components/home` and `home.astro` (`grep -nE "#[0-9a-fA-F]{3,6}\b|\[#"` empty); no `trend.current` / `niepełny` in `src`; every new key carries `DESIGN-GAP: K24` / `G35`; rows K24, G35 and amended G6 in `design-kit.md`

#### Manual Verification:

- [reviewer] Every string from `copy` / `copyExtra`; K24 byte-for-byte with `applyDashboardState` for May; only the G35 hint is a placeholder; colours only via token names; `Panel`, `PageTitle`, `buttonVariants` reused; the `try` covers the whole pure assembly

**Implementation Note**: proceed on green automated criteria; screenshots happen in the Visual step after Phase 4.

---

## Phase 3: stat cards — „Ponad progiem w tym miesiącu” and „Koszty stałe”

### Overview

The pure summary over the trend and `fixedOverview`, one new card component and the two-card stats row between the
title block and the trend panel.

### Changes Required:

#### 1. The summary

**File**: `src/lib/patterns/home.ts` (new)

**Intent**: The `/home` figures as differences and sums of already-computed values — no new rule.

**Contract**:

```ts
export interface HomeStats { overMinor: number; previous: { month: string; deltaMinor: number } | null;
  fixedTotalMinor: number; fixedRisen: number }
export function homeStats(trend: OverLimitTrend, fixed: FixedOverview): HomeStats
```

`overMinor` = last axis month (0 without months). `previous` = `previousMonth(R)` and `last − its value` when that
month is on the axis (it has data — the same comparison rule as `fixedOverview`'s `hasComparison`, S-06 D6), else
`null` (one month of data, or a gap month before R — plan review F1). `fixedTotalMinor` = Σ `amountMinor`
over `fixed.changed`, `fixed.new`, `fixed.unchanged` (the amounts `/fixed` lists). `fixedRisen` =
`fixed.changed.filter((r) => r.deltaMinor > 0).length` (S-06 follow-up formula, verbatim). Header cites the S-06
follow-up and decisions 5–6.

#### 2. Stat card

**File**: `src/components/home/StatCard.astro` (new)

**Contract**: props `{ label: string; value: string; foot?: string; accent?: boolean }`. `<article>` `rounded-xl border
p-5`: default `bg-paper border-line`, label / foot `text-muted`; `accent` `bg-excess border-excess`, label / foot
`text-excess-text` (kit `#72501f`, no token — nearest, G36). Label 12 px bold; value 32 px `font-extrabold`
`tracking-[-0.06em]` `mt-4 mb-[5px]`; foot 12 px. Each text the only child of its element.

#### 3. Page

**File**: `src/pages/home.astro`

**Contract**: inside the same `try`: `fixedOverview(patterns, rows)` and `homeStats(trend, fixed)`. Between the title
block and the trend panel: a grid `grid grid-cols-[1.2fr_1fr] gap-[15px] mb-[15px] max-[899px]:grid-cols-1` (kit
`.stats` minus the „Rozpoznane wydatki” column — G36) with `StatCard accent` (label `copy.dashboard.stats[0].label`,
value `formatMoney(overMinor)`, foot `x.deltaFoot` filled with `formatSignedMoney(deltaMinor)` and
`x.monthsGenitive[month − 1]` only when `previous`) and `StatCard` (label `copy.dashboard.stats[2].label`, value
`formatMoney(fixedTotalMinor)`, foot `x.count`-style `"{n} {items}"` with `plural(fixedRisen, x.risenForms)`). Header
comment's Phase-3 note removed.

#### 4. Copy and gap register

**Files**: `src/content/copy.ts`, `context/foundation/design-kit.md`

**Contract**: `copyExtra.home` gains, under `// DESIGN-GAP: K25` (the kit prints these only as `content.json`
`dashboard.stats[].foot` **samples**; the templates reproduce them byte for byte): `deltaFoot: "{delta} względem
{month}"`, `monthsGenitive: ["stycznia", "lutego", "marca", "kwietnia", "maja", "czerwca", "lipca", "sierpnia",
"września", "października", "listopada", "grudnia"]`, `risen: "{n} {items}"`, `risenForms: ["pozycja podrożała",
"pozycje podrożały", "pozycji podrożało"]` (the kit shows the middle form; the others complete the Polish tuple).

`design-kit.md`: **K25** (stat foot copy only as sample values); **G36** (dashboard content the PRD does not define:
„Rozpoznane wydatki” not rendered — needs a product rule, `[human]` S-05 7.9; „Co wraca najczęściej” not rendered —
no selection rule; therefore stats row 2 columns `1.2fr 1fr` and the trend panel full width instead of `.dash-grid`;
„Koszty stałe” value defined as Σ of `/fixed` row amounts in the reference month; delta foot hidden with one month;
accent label colour `excess-text` for `#72501f`; placeholder · S-07 faza 3); K25 / G36 appended to „Do rundy 3”.

#### 5. Unit tests

**File**: `test/unit/home-stats.test.ts` (new)

**Contract**: 1) empty trend + empty overview → `overMinor` 0, `previous` null, 0 / 0; 2) one month → `previous` null;
3) two consecutive months rise (+150), drop (−8759), equal (0) → signed `deltaMinor`, `month` = `previousMonth(R)`;
3b) axis `[2026-05, 2026-07]` (gap) → `previous` null; 4) crafted
`FixedOverview` with a rise, a decrease, a new and an unchanged row → `fixedRisen` 1 (the decrease not counted),
`fixedTotalMinor` = Σ of the four amounts; 5) F-02 fixture with `{"kino światło": count 1}` → `overMinor` 0,
`previous` `{ month: "2026-07", deltaMinor: -8759 }`, `fixedTotalMinor` 175298, `fixedRisen` 1.

#### 6. Smoke

**File**: `scripts/smoke.mjs`

**Contract**:

1. after Phase 2's step 3 (May only, threshold 40): „home has no comparison with one month” — contains `>Ponad progiem w
   tym miesiącu<`, notContains `względem`.
2. after Phase 2's step 6 (May 5,50, June 7,00): „home compares with the previous month” — contains `>+1,50 zł względem
   maja<`.
3. after „fixed lists a changed amount” (unmerged): „home counts fixed costs that rose” — contains `>1 pozycja
   podrożała<` and `>67,99 zł<`.

### Success Criteria:

#### Automated Verification:

- `npm run lint` 0 errors; `npx astro check` 0 errors (record the count; +3 expected: `home.ts`, the test, `StatCard.astro`)
- `npm test` — Phase 2 count + the new cases, 14 files, 0 failures (record the total)
- `npm run fixture:check` OK; `npm run build` passes
- `npx supabase db reset && npx supabase test db` — 102 (delta 0)
- `BASE_URL=http://localhost:4398 npm run smoke` — 127 + 3 = 130 PASS
- Deliberate break (delta sign): compute `previous − last` → „home compares with the previous month” FAILs and unit case 3 FAILs; restored → PASS. Meta-check: step 1 stays green, so the red is the sign, not the foot's presence
- Deliberate break (rises only): count `deltaMinor !== 0` → unit case 4 FAILs while smoke step 3 stays green. Meta-check: the smoke user has no decrease, so only the unit case guards the „podrożały” filter — recorded
- Deliberate break (one-month foot): always render the foot (previous month 0) → „home has no comparison with one month” FAILs; restored → PASS. Meta-check: step 2 stays green
- No raw colours in `StatCard.astro` / `home.astro`; every new key carries `DESIGN-GAP: K25`; rows K25, G36 in `design-kit.md`

#### Manual Verification:

- [reviewer] `home.ts` imports only `trend.ts`, `fixed.ts` types and `@/types`; `fixedOverview` reused verbatim (no second change rule); K25 templates reproduce the kit samples byte for byte; only allowed colour names

**Implementation Note**: proceed on green automated criteria.

---

## Phase 4: import panel, follow-ups and seam sweep

### Overview

The kit's „Dodaj najnowszy wyciąg” panel, the follow-ups file and the sweep over everything the change touched. One new
component.

### Changes Required:

#### 1. Import panel

**File**: `src/components/home/ImportPanel.astro` (new)

**Contract**: props `{ title: string; body: string; cta: string; href: string }`. Kit `.import-panel`: `mt-[15px]
rounded-xl border border-dashed border-muted/55 bg-paper-soft px-[22px] py-[19px]` flex space-between center;
≤ 559 px column, `items-start`, gap 15 (kit `#9da9aa` border → `muted/55`, same mapping as the bar, G35 note). Left:
38 px `rounded-[10px] bg-ink text-paper` box with `Icon name="import" size={17}` (`aria-hidden`), then `<strong>` 13 px
`title` and `<span>` block 12 px `text-muted` mt 3 `body`. Right: `<a>` `buttonVariants({ variant: "ghost" })` `cta`.

#### 2. Page

**File**: `src/pages/home.astro`

**Contract**: after the trend panel, `ImportPanel` with `copy.dashboard.importTitle`, `copy.dashboard.importBody`,
`copyExtra.imports.choose`, `/imports/new`. Header comment's Phase-4 note removed.

#### 3. Follow-ups

**File**: `context/changes/over-limit-trend/follow-ups/review-fixes.md` (new)

**Contract**: one entry each, with a `Trigger:` line:

- S-05 F6 (`validateMerge` lets an excluded source re-enter via a merge) still open; the trend shows the root's
  decision faithfully — Trigger: product feedback or the next change to `/patterns/<key>`.
- `/patterns` and `/fixed` still let a `patternTxs` drift throw become a 500 (only `/home` wraps it) — Trigger: next
  change touching those pages or `loadPatternData`.
- „Rozpoznane wydatki” and „Co wraca najczęściej” (G36) — Trigger: `[human]` S-05 7.9 answered / the kit author
  defining the selection rule.
- Long histories: bars keep `min-w-[44px]` and scroll inside the panel — Trigger: an account with > 24 months or
  usability feedback.
- S-06 „one-off merchants are D5-fixed” now also inflates the `/home` „Koszty stałe” value (plan review F3) — Trigger:
  `[human]` 4.11 answered against the Σ, or product feedback on real data.

#### 4. Seam sweep

**Intent**: Nothing half-migrated leaves the branch.

**Contract**: over every file this change touched: no duplicated helper or class string introduced by two phases (the
`.panel-title` markup inline in `home.astro` and `patterns/[...key].astro`, the info-panel classes used by `note` and
`hint`, the `bg-muted/55` mapping in `TrendChart` and `ImportPanel`, any inline `{month}` / `{n}` template fill next to
the existing `.replace()` helpers, any second `appliesTo(stored …)` guard or month arithmetic) — extract to a shared
constant / helper or record why not; no stale comment (`home.astro`, `trend.ts`, `home.ts`, `view.ts`, `fixed.ts`
header naming S-07, `smoke.mjs` header); no stale kit row (G6, G35, G36, K5, K24, K25 agree with what renders); no
unused export (`trend.current` still unused by design — noted in G35).

#### 5. Smoke

**File**: `scripts/smoke.mjs`

**Contract**: after Phase 2's step 3: „home offers the next import” — contains `>Dodaj najnowszy wyciąg<`; Phase 2's
step 1 („home before import has no trend”) gains notContains `>Dodaj najnowszy wyciąg<` (negative control).

### Success Criteria:

#### Automated Verification:

- `npm run lint` 0 errors; `npx astro check` 0 errors (record the count; +1 expected: `ImportPanel.astro`)
- `npm test` — Phase 3 count, 0 failures (final: 213 + the S-07 cases, 14 files)
- `npm run fixture:check` OK; `npm run build` passes
- `npx supabase db reset && npx supabase test db` — 102 (delta 0 over the baseline, 5 files)
- `BASE_URL=http://localhost:4398 npm run smoke` — 130 + 1 = 131 PASS (+10 over the baseline 121)
- Deliberate break (panel on the empty branch): render `ImportPanel` also in the `referenceMonth === null` branch → „home before import has no trend” FAILs; restored → PASS. Meta-check: „home offers the next import” stays green, so the red is the branch placement
- Seam-sweep greps: `grep -rnE "#[0-9a-fA-F]{3,6}\b|\[#"` over `src/components/home`, `src/pages/home.astro` empty; `grep -rn "niepełny\|trend.current" src` empty; `grep -rn "DESIGN-GAP: G35\|DESIGN-GAP: G36\|DESIGN-GAP: K24\|DESIGN-GAP: K25" src` matches only `copy.ts`, `home.astro` and `src/components/home/*`; `grep -c "appliesTo(stored" src/lib/patterns/*.ts` ≤ 1

#### Manual Verification:

- [reviewer] Seam sweep done: duplicated helpers / classes extracted or justified, stale comments and kit rows (G6, G35, G36, K5, K24, K25) match the code, the follow-ups file lists every item with a `Trigger:`
- [human] Product owner confirms decision 2 as revised by plan review F1 (FR-013 literal „dla wszystkich miesięcy obecnych w danych”): the axis holds only months with ≥ 1 imported debit, so a calendar month with no import between two imports is absent (not `0,00 zł`) and the delta foot is hidden after such a gap; reversal = continuous zero-filled calendar axis (one line in `trend.ts`, case 9 flips, `homeStats.previous` follows)
- [human] Product owner confirms decision 4 (against the PRD Non-Goal „Wykresy inne niż lista i suma”): the kit's bar chart is kept because every bar carries its numeric sum; reversal = render the months as a list in the same panel
- [human] Product owner confirms decision 6 (PRD silent — a new figure): „Koszty stałe” value = Σ of the amounts `/fixed` lists for the reference month (incl. an own transfer typed `fixed`, e.g. `jan przykładowy` 1500 zł on the fixture, and every one-off merchant D5 types `fixed` — S-06 follow-up „one-off merchants list as nowy”, fired by this value, plan review F3); reversal = foot-only card, or a classifier fix in `derivePatterns`
- [visual] Screenshots, desktop 1440 px and mobile ~400 px, on `astro dev --port 4399` with freshly registered local accounts (never the seeded `test@rytm.local`): `home-pre-import` (no import), `home-no-threshold` (fixture imported, no threshold — flat 0,00 zł bars + hint), `home-fixture-trend` (fixture, `kino światło` count 1 and `stacja paliw drogowskaz` count 1 — 12 labelled bars, stat 955,34 zł, foot vs lipca, „Koszty stałe” 1752,98 zł · 1 pozycja podrożała, import panel), `home-one-month` (one month imported with a threshold — tooShort panel, no delta foot), `home-two-months` (two months — tooShort still shown, delta foot), `home-gap-month` (imports for two months with an empty month between — two bars only, no bar for the empty month, no delta foot), `home-excluded` (the only thresholded pattern excluded — zeros + hint), `home-read-error` (only if reachable without leaving the local DB mutated — else a documented `db reset` in the same step), `home-kit-compare` (the kit `#/home-no-name` frame beside the fixture state)
- [visual] Fixture US-05 walk-through on screen: set `kino światło` count 1 → `paź 25` 49,13 zł, `maj 26` 133,47 zł, `cze 26` 41,24 zł, `lip 26` 87,59 zł, the rest 0,00 zł; change to 2 → `paź 25` and `cze 26` 0,00 zł, `maj 26` 98,22 zł, `lip 26` 51,98 zł; remove → every bar 0,00 zł and the hint; no bar marked „niepełny”

**Implementation Note**: the Visual step performs the `[visual]` rows; `[human]` rows stay open on the post-run
checklist.

---

## Testing Strategy

### Unit Tests:

- `test/unit/over-limit-trend.test.ts` — empty read, no thresholds, historical months, threshold change / removal,
  cross-pattern sum, excess semantics, excluded and inapplicable thresholds, gap month and year boundary, axis from
  excluded rows, the `listOverview` invariant, `trendBarHeight`, the F-02 fixture (kino / stacja / pizzeria).
- `test/unit/home-stats.test.ts` — reference value, delta sign and absence, fixed total and rises, the fixture.
- `test/unit/format.test.ts` — `formatMonthAxis`.

### Integration Tests:

- Smoke (+10): pre-import (no trend, no import panel), one month without / with / after removal of a threshold, the
  tooShort panel and the hint, an excluded threshold pattern, the recomputed historical month, the delta foot, the
  „Koszty stałe” card, the import panel.

### Manual Testing Steps:

1. `npx supabase start`; `ASTRO_DEV_BACKGROUND=1 npx astro dev --port 4399 --ignore-lock`.
2. Register a fresh local account; `/home` shows the pre-import view.
3. Import the synthetic fixture; `/home` shows 12 bars at 0,00 zł and the hint.
4. On `/patterns/kino%20%C5%9Bwiat%C5%82o` set a count threshold 1; `/home` shows the four non-zero months; change to
   2 and remove, checking `/home` each time. Kill the server (`lsof -ti :4399 | xargs kill`).

## Performance Considerations

One extra pure pass over the already-read rows per request (the same `overLimit` pass `/patterns` makes, over every
month instead of one) plus `fixedOverview`. No new query; 12 months × 31 patterns on the fixture.

## Migration Notes

None — nothing new is stored; thresholds stay per `(user_id, merchant_key)`.

## References

- Research: `context/changes/over-limit-trend/research.md`; identity: `change.md`
- PRD: `context/foundation/prd.md` (FR-013, US-05, Non-Goals, Success Criteria secondary)
- Rule / read: `src/lib/patterns/over-limit.ts` `overLimit` / `appliesTo` / `referenceMonth` / `previousMonth`,
  `src/lib/patterns/view.ts` `listOverview` / `patternTxs` / `indexById`, `src/lib/patterns/fixed.ts`
  `fixedOverview`, `src/lib/patterns/load.ts` `loadPatternData`, `src/lib/patterns/derive.ts` `derivePatterns`
- Page precedent: `src/pages/fixed.astro`, `src/pages/patterns.astro`; components `PageTitle.astro`, `Panel.astro`,
  `EmptyState.astro`, `InlineAlert.astro`, `Icon.astro`, `src/components/ui/button.tsx` `buttonVariants`
- Kit: `design/rytm-os/prototype/app.js` `dashboard()`, `trendChart()`, `applyDashboardState`;
  `design/rytm-os/prototype/styles.css` `.stats`, `.stat-card`, `.panel-title`, `.trend`, `.tbar`, `.monthly-trend`,
  `.legend`, `.dot`, `.info-panel`, `.import-panel`; `design/rytm-os/react-kit/docs/content.json` `dashboard`, `trend`
- Follow-ups consumed: `context/archive/2026-09-28-durable-pattern-decisions/follow-ups/review-fixes.md` (excluded
  skipped in monthly sums, F6), `context/archive/2026-09-28-fixed-cost-changes/follow-ups/review-fixes.md` („N pozycje
  podrożały”, drift throw)
- Format example: `context/archive/2026-09-28-fixed-cost-changes/plan.md`

## Autonomous decisions

Made by the plan step of run `2026-09-28-s05-s06-s07` in place of asking a human.

1. **One pure aggregate `overLimitTrend` in `src/lib/patterns/trend.ts`, guards shared with `listOverview` through an
   extracted `applicableThreshold`.** Rejected: widening `listOverview` to return every month (mixes a list DTO with a
   series); copying the guard (drift risk). Would change: plan review preferring the trend inside `view.ts`.
2. **Axis = the months present in the data (≥ 1 debit), ascending — FR-013 / roadmap outcome literal.** *Revised by
   plan review F1* (the plan step had chosen a continuous zero-filled calendar range). Rejected: the continuous range —
   a month with no import would render `0,00 zł`, a figure the app does not know (US-05 AC 2 „0, nie brak wartości”
   concerns a month *with* transactions none of which is over); it would bias the secondary success criterion („czy
   suma maleje”) toward a false improvement; and it would contradict S-06's gap rule on the same page (`fixedOverview`
   treats a gap month as „no comparison”). The axis labels („maj 26”, „lip 26”) still show a gap. Identical on the
   fixture. `[human]` row 4.9 names it. Would change: the maintainer preferring a continuous time axis.
3. **No „niepełny” marker (PRD US-05 AC 4 over the kit).** Why: explicit AC, and the reference month is the latest in
   the data — the app cannot know completeness. Would change: the maintainer revising the PRD assumption of 2026-09-18.
4. **Bar chart kept, with a visible sum on every bar — against the PRD Non-Goal's literal „Wykresy inne niż lista i
   suma”** → `[human]` row. Rejected: hover/SR-only values (a sighted user cannot read historical sums); a list instead
   of bars (drops the kit's delivered G6). Bars get `min-w-[44px]` and scroll inside the panel so labels never overlap.
   Would change: the maintainer reading the Non-Goal as „no bars”.
5. **Stat „Ponad progiem w tym miesiącu” = the trend's last point; its foot = difference to the previous axis month,
   hidden with one month.** Why: two points of the same aggregate, no new rule; the kit prints the foot (sample). Would
   change: plan review judging the delta template an invention → drop the foot, keep the value.
6. **„Koszty stałe” value = Σ of the amounts `/fixed` lists for the reference month; foot = rises only
   (`deltaMinor > 0`, S-06 follow-up verbatim)** → `[human]` row (PRD silent, the figure is new on screen). Rejected:
   foot-only card (the kit's card has a value; an empty value slot looks broken). Would change: the product owner
   defining „Koszty stałe” differently (e.g. excluding own transfers).
7. **„Rozpoznane wydatki” and „Co wraca najczęściej” not rendered; stats row 2 columns (`1.2fr 1fr`), trend panel full
   width** (G36). Rejected: kit sample numbers or placeholders; an empty third column. Why: PRD defines neither; never
   invent a figure. Would change: `[human]` S-05 7.9 answered with a spending-total rule, or a selection rule for the
   list.
8. **Greeting „Dzień dobry.” and the no-name lead „Twój <miesiąc> w jednym spokojnym widoku.”** (kit
   `#/home-no-name`, K5). Rejected: the name-variant lead „Oto rytm Twoich wydatków w maju.” (belongs to the named
   greeting). Would change: the app storing a first name.
9. **Zero month = 2 px stub with a `0,00 zł` label; non-zero = kit `max(12 %, v/max)`.** Rejected: the kit's 12 %
   minimum for 0 (draws a zero as data). Would change: the kit defining zero bars.
10. **No-threshold hint** (placeholder, G35) when no non-excluded pattern has an applicable threshold. Rejected: a flat
    chart with no explanation. Would change: the author supplying copy (replace the string) or the maintainer preferring
    no hint.
11. **`try`/`catch` around the pure assembly on `/home` only** (S-06 follow-up); `/patterns`, `/fixed` not retrofitted
    (one view) → follow-up. Would change: plan review asking for a shared page helper now.
12. **S-05 F6 not fixed** (another view) → follow-up; the trend follows the root's decision. Would change: the visual
    gate showing a wrong `/home` number caused by it.
13. **Colour mapping without new tokens**: bar / dot / import-panel border `muted/55` (kit `#9aaab3` / `#9da9aa`),
    gridline `line` (`#d2d7d8`), accent label `excess-text` (`#72501f`), panels `paper-soft` (exact). Recorded in
    G35 / G36. Would change: the visual step finding the grey visibly off → a G35 note, not a token.
14. **Four phases; ≤ 1 new component each (TrendChart, StatCard, ImportPanel); smoke split 6 / 3 / 1 (+ one negative
    control added to an existing new step).** Would change: a phase not independently green (merge it with the next).
15. **Fixture numbers confirmed by running `derivePatterns` + `overLimit` at plan time**; keys `kino światło`,
    `stacja paliw drogowskaz`, `pizzeria trzy sery`; research's „7 non-zero months” for pizzeria corrected to 6. Would
    change: a fixture regeneration (then case 13 fails loudly on the key check).
16. **Gap ids K24 (no-name lead), G35 (trend states), K25 (stat foot samples), G36 (dashboard content)** land with
    the code in Phases 2–3 (S-05 decision 22 precedent). Would change: the orchestrator requiring gap rows at plan time.
17. **Decisions against the PRD's literal text:** 4, with a `[human]` row (2 now follows the literal, plan review F1,
    and keeps its `[human]` row); 6 adds a figure the PRD does not
    define and carries a `[human]` row too. Decision 3 follows the PRD against the kit (no row needed).

18. **Plan review triage (2026-09-28, `reviews/plan-review.md`)**: F1 overturned decision 2 (axis = months present in
    the data; `nextMonth` dropped; `homeStats.previous` = `previousMonth(R)` only when it has data); F2 smoke
    `notContains` accepts an array (Phase 2); F3 „Koszty stałe” one-off noise → Known risks, `[human]` 4.11, follow-up.
    Would change: the maintainer answering 4.9 for a continuous axis.

## Known risks

- **Bar label density**: 12 labels at 9–10 px fit on desktop; on ~400 px the chart scrolls inside the panel. The visual
  step judges legibility; a failure is a G35 note plus a follow-up, not a redesign.
- **Axis with gaps** (decision 2, plan review F1): bars are equidistant, so a gap between imports is visible only in
  the axis labels; the delta foot hides after a gap (as `/fixed` shows „no comparison”).
- **„Koszty stałe” noise** (plan review F3): the value sums every row `/fixed` lists, so every one-off merchant that D5
  types `fixed` in R inflates it (S-06 follow-up, fired here). Consistent with `/fixed` by construction; the fix
  belongs to the classifier, not the card — `[human]` 4.11 + follow-up.
- **Smoke `notContains` arrays** (plan review F2): the checker takes one string today; Phase 2 extends it before any
  new step relies on two negative needles.
- **Astro check file count** is recorded, not asserted — only the error delta gates.
- **Smoke text anchors**: every asserted string must be the only child of its element on one line; check `curl` output
  before asserting.
- **`Intl` short-month output** depends on the Node ICU data; `formatMonthAxis` unit cases pin „maj 26” / „paź 25”.

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: `overLimitTrend` — the pure monthly aggregate

#### Automated

- [x] 1.1 `npm test` — 213 + the new cases, 13 files, 0 failures (total recorded); `pattern-view.test.ts` untouched and green
- [x] 1.2 `npm run lint` 0; `npx astro check` 0 errors (count recorded)
- [x] 1.3 `npm run fixture:check` OK; `npm run build` passes
- [x] 1.4 `npx supabase db reset && npx supabase test db` — 102 (delta 0); smoke 121 PASS (delta 0)
- [x] 1.5 Deliberate break (excluded skip dropped) → case 7 FAILs; restored → green; meta-check recorded
- [x] 1.6 Deliberate break (axis filled as a continuous calendar range) → case 9 FAILs; restored → green; meta-check recorded
- [x] 1.7 Deliberate break (reference month only) → cases 3, 13 FAIL, case 11 green; restored → green; meta-check recorded

#### Manual

- [ ] 1.8 [reviewer] `trend.ts` pure (imports only `over-limit.ts`, `view.ts`, `@/types`); `applicableThreshold` the single guard; `patternTxs` not duplicated; header states axis rule, exclusion rule, invariant

### Phase 2: `/home` — title block and the trend panel

#### Automated

- [ ] 2.1 `npm run lint` 0; `npx astro check` 0 errors (count recorded)
- [ ] 2.2 `npm test` — Phase 1 count, 0 failures (delta 0)
- [ ] 2.3 `npm run fixture:check` OK; `npm run build` passes
- [ ] 2.4 `npx supabase db reset && npx supabase test db` — 102 (delta 0)
- [ ] 2.5 `BASE_URL=http://localhost:4398 npm run smoke` — 121 + 6 = 127 PASS
- [ ] 2.6 Deliberate break (only the last bar) → „home recomputes every month” FAILs, „home shows the over-limit sum” PASSes; restored → PASS; meta-check recorded
- [ ] 2.7 Deliberate break (excluded skip dropped) → „home skips an excluded pattern” FAILs; restored → PASS; meta-check recorded
- [ ] 2.8 Deliberate break (no pre-import branch) → „home before import has no trend” FAILs; restored → PASS; meta-check recorded
- [ ] 2.9 No raw colours in `src/components/home` / `home.astro`; no `trend.current` / `niepełny` in `src`; `DESIGN-GAP: K24` / `G35` on every new key; rows K24, G35 and amended G6 in `design-kit.md`

#### Manual

- [ ] 2.10 [reviewer] Strings from `copy` / `copyExtra`; K24 byte-for-byte with `applyDashboardState` for May; only the G35 hint a placeholder; token colour names only; `Panel`, `PageTitle`, `buttonVariants` reused; `try` covers the pure assembly

### Phase 3: stat cards — „Ponad progiem w tym miesiącu” and „Koszty stałe”

#### Automated

- [ ] 3.1 `npm run lint` 0; `npx astro check` 0 errors (count recorded)
- [ ] 3.2 `npm test` — Phase 2 count + the new cases, 14 files, 0 failures (total recorded)
- [ ] 3.3 `npm run fixture:check` OK; `npm run build` passes
- [ ] 3.4 `npx supabase db reset && npx supabase test db` — 102 (delta 0)
- [ ] 3.5 `BASE_URL=http://localhost:4398 npm run smoke` — 127 + 3 = 130 PASS
- [ ] 3.6 Deliberate break (delta sign reversed) → „home compares with the previous month” and unit case 3 FAIL; restored → PASS; meta-check recorded
- [ ] 3.7 Deliberate break (`deltaMinor !== 0` counted as a rise) → unit case 4 FAILs, smoke step 3 green; restored → green; meta-check recorded
- [ ] 3.8 Deliberate break (foot always rendered) → „home has no comparison with one month” FAILs; restored → PASS; meta-check recorded
- [ ] 3.9 No raw colours in `StatCard.astro` / `home.astro`; `DESIGN-GAP: K25` on every new key; rows K25, G36 in `design-kit.md`

#### Manual

- [ ] 3.10 [reviewer] `home.ts` imports only `trend.ts`, `fixed.ts` types, `@/types`; `fixedOverview` reused verbatim; K25 templates reproduce the kit samples byte for byte; allowed colour names only

### Phase 4: import panel, follow-ups and seam sweep

#### Automated

- [ ] 4.1 `npm run lint` 0; `npx astro check` 0 errors (count recorded)
- [ ] 4.2 `npm test` — Phase 3 count, 0 failures (final: 213 + the S-07 cases, 14 files)
- [ ] 4.3 `npm run fixture:check` OK; `npm run build` passes
- [ ] 4.4 `npx supabase db reset && npx supabase test db` — 102 (delta 0, 5 files)
- [ ] 4.5 `BASE_URL=http://localhost:4398 npm run smoke` — 130 + 1 = 131 PASS (+10 over the baseline 121)
- [ ] 4.6 Deliberate break (import panel on the empty branch) → „home before import has no trend” FAILs; restored → PASS; meta-check recorded
- [ ] 4.7 Seam-sweep greps: no raw colours in `src/components/home` / `home.astro`; no `niepełny` / `trend.current` in `src`; `DESIGN-GAP: G35` / `G36` / `K24` / `K25` only in `copy.ts`, `home.astro`, `src/components/home/*`; `appliesTo(stored` at most once in `src/lib/patterns`

#### Manual

- [ ] 4.8 [reviewer] Seam sweep: duplicated helpers / classes extracted or justified; stale comments and kit rows (G6, G35, G36, K5, K24, K25) match the code; follow-ups file lists every item with a `Trigger:`
- [ ] 4.9 [human] Product owner confirms decision 2 as revised by plan review F1 (FR-013 literal): axis = months with data only, a month with no import between two imports is absent, delta foot hidden after a gap
- [ ] 4.10 [human] Product owner confirms decision 4 (against the PRD Non-Goal „Wykresy inne niż lista i suma”): bar chart kept, every bar labelled with its sum
- [ ] 4.11 [human] Product owner confirms decision 6 (PRD silent): „Koszty stałe” value = Σ of `/fixed` amounts in the reference month, one-off D5-`fixed` merchants included (plan review F3)
- [ ] 4.12 [visual] Screenshots desktop 1440 px + mobile ~400 px: `home-pre-import`, `home-no-threshold`, `home-fixture-trend`, `home-one-month`, `home-two-months`, `home-gap-month`, `home-excluded`, `home-read-error`, `home-kit-compare`
- [ ] 4.13 [visual] Fixture US-05 walk-through: `kino światło` count 1 → four non-zero months (49,13 / 133,47 / 41,24 / 87,59 zł); count 2 → 98,22 / 51,98 zł only; removed → all 0,00 zł + hint; no „niepełny”
