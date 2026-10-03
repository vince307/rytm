# Overview, trend and fixed costs on kit round 3 (S-15) — Implementation Plan

## Overview

Bind `/home` and `/fixed` to design kit round 3 and close milestone M-3: `/home` gets the kit dashboard (one accent
stat card, the full-width trend with its legend chips and per-bar names, and the `.dashboard-fixed` summary
„Koszty stałe · Zobacz zmiany” with „Podrożały” / „Nowe” rows) in place of the second stat card and the import
panel; `/fixed` gets the kit read-error alert, the kit state messages (`fixedCosts.noComparison` under the title,
`noChanges` / `noNew` after the sections), delta suffixes „· wzrost” / „· spadek” and kit copy. The triggered
follow-ups ride along (S-14 F8 detail `try`, F9 comment, `fixed.astro` `try`, one `monthIndex`, a shared
`PanelTitle`). The last phase audits every remaining `copyExtra` leaf across all namespaces, guards it with a unit
test, updates the gap register and runs the seam sweep and the visual gate. Presentation only: `fixedOverview`,
`overLimitTrend`, thresholds and every endpoint keep their rules. **No migration.**

## Current State Analysis

Source: `research.md` (§1–§6), `change.md` (claims table, decisions A2/A3), re-checked in this step against `src/`,
`scripts/smoke.mjs`, `test/unit/` and `design/rytm-os/`. Anchors are symbols.

- `src/pages/home.astro`: one `try` around `overLimitTrend` → `fixedOverview` → `homeStats`; local `monthIndex`
  (`split("-")`); `leadFor` reads `copyExtra.home.lead` (byte-identical to `copy.dashboard.descriptionNoName`) +
  `monthsNominative`; `deltaFootFor` reads `copyExtra.home.deltaFoot` (= `copy.dashboard.stats[0].foot`) +
  `monthsGenitive`; `risenFootFor` reads `copyExtra.home.risen/risenForms`; two `StatCard`s in
  `grid-cols-[1.2fr_1fr]`; trend `Panel` with inline title markup; `TrendChart` gets `hint={h.noThreshold}`;
  `ImportPanel` at the bottom. The comment above `leadFor` cites a non-existent `patterns.astro` `sumLabel` (F9).
  The pre-import branch reads `copyExtra.home.empty*` (byte-identical to `copy.home.*`).
- `src/lib/patterns/home.ts` `homeStats` → `HomeStats { overMinor, previous, fixedTotalMinor, fixedRisen }`;
  `fixedTotalMinor` feeds only the second card. Pinned by `test/unit/home-stats.test.ts` (case 1 `toEqual`, case 4,
  F-02 fixture `175298`).
- `src/components/home/TrendChart.astro`: bars `bg-muted/55`, zero bar `h-[2px]`, value `text-[10px] text-muted`,
  no per-bar name, `<ol aria-label>` = `copy.trend.title`, one legend chip, local `infoPanel` class string for the
  `tooShort` note and the `hint`. `src/lib/patterns/trend.ts` `trendBarHeight` min 12 % (unit `[10, 1000, 12]`).
- `src/pages/fixed.astro`: `fixedOverview` with **no `try`**; error branch shows `copy.components.error`; eyebrow
  `copyExtra.fixed.eyebrow` (= `copy.app.fixedLong`); `countText` uses `copyExtra.fixed.itemForms`
  (= `copy.fixedCosts.itemForms`); empty lines inside each section (`changedEmpty`, `newEmpty` / `noComparison`,
  `unchangedEmpty`); `deltaClass` carries a stale `DESIGN-GAP: G34` comment; the third section passes `compact`.
- `src/components/fixed/FixedSection.astro`: inline `.section-label` markup, `compact` prop only adds a bare class,
  always renders the list panel (rows or the empty line).
- `src/pages/patterns/[...key].astro`: `detailTarget`, `patternDetail`, `sequenceLabel` run unguarded after the
  `readError` check (S-14 F8); `src/lib/format.ts` `fillMonthLocative` parses the month with `slice(5, 7)`.
- Kit (`prototype/app.js` `dashboard`, `trendChart`, `fixedCosts`; `styles.css`): reads no `content.json` key for
  these views — layout from markup, wording from `content.json` keys with the same meaning (research Architecture
  Insights). `.stats-single`, `.dashboard-fixed`, `.fixed-summary-row`, `.trend-value`, `.trend-zero-note`,
  `.info-panel`, `.fixed-empty-states`, `.increase/.decrease`, `.text-link` (same box as `.back-link`).
- Smoke (`scripts/smoke.mjs`) pins, by step name: „home before import has no trend”, „home shows the trend without a
  threshold”, „home shows the over-limit sum”, „home offers the next import”, „home counts fixed costs that rose”,
  „fixed with one month lists no change”, „fixed without a previous month says so”, „fixed lists a changed amount”,
  „fixed compares with the previous month”; header comment describes the import panel and the card total. Smoke
  data: one month (May) → later May + June with Kawiarnia Rytm risen (+1,50 zł), Piekarnia smoke new, Sklep smoke
  unchanged.
- Register `context/foundation/design-kit.md`: last ids `K37`, `G38`.
- Follow-ups consumed: `context/archive/2026-10-03-kit-round-3-patterns/follow-ups/review-fixes.md` (`fixed.astro`
  `try`, F8, F9), `context/archive/2026-10-02-kit-round-3-intake/follow-ups/review-fixes.md` § S-15 (card feet → moot
  with the card; badge tint done in S-14; `noComparison` smoke string → P4).

## Desired End State

- `/home` data branch: title row unchanged (lead from `copy.dashboard.descriptionNoName`, „+ Wgraj CSV”); ONE accent
  card „Ponad progiem w tym miesiącu” in a `minmax(260px,380px)` column with the delta foot from
  `copy.dashboard.stats[0].foot`; the trend panel (title via `PanelTitle`); a „Koszty stałe” panel with „Zobacz
  zmiany” → `/fixed`, „Podrożały · N koszt/koszty/kosztów” (rises only) and „Nowe · N …” (`fixedOverview().new`),
  side by side ≥ 561 px, stacked below. No import panel, no second card, no fixed-cost total.
- Trend: bars `bg-muted`, zero bar 2 px `bg-line`, min non-zero height 8 %, sums 11 px bold ink above bars, each bar
  `role="img"` named „{month}: {amount} ponad próg” (zero: „{month}: Brak kwoty ponad próg”), list named
  `trend.gridLabel`; legend „suma ponad progiem” + „Cienka kreska oznacza 0,00 zł” only when a bar is 0 + „Brak
  ustawionego progu” only when no pattern has a threshold; `tooShort` note kept; the old hint panel is gone.
- `/fixed`: eyebrow `copy.app.fixedLong`; read error → `fixedCosts.readError` alert under the title, no sections;
  without a comparison month → `fixedCosts.noComparison` info panel under the title and no other empty message;
  with a comparison → `noChanges` / `noNew` (and the app's `unchangedEmpty`) as info panels in one block after the
  sections; an empty section keeps heading + count and drops its list panel; deltas read „+1,50 zł · wzrost” /
  „−5,00 zł · spadek”.
- `/patterns/<key>`: an assembly throw renders `copy.components.error` with 200, never a 500.
- `copyExtra`: every leaf has a reader and no `content.json` key with the same meaning, except recorded role
  exceptions, enforced by a unit test; the register says which K/G rows S-15 closed and lists the new literals.

### Key Discoveries:

- Every new figure is already computed: „Podrożały” = `homeStats().fixedRisen`, „Nowe” = `fixedOverview().new.length`
  (empty when `hasComparison` is false) — no new read, no rule.
- `copy.patternDetail.monthNames` keys are the 12 nominatives in calendar order — `monthsNominative` has a kit
  equivalent (keys, not values; values are K30 locatives) and can be derived instead of duplicated.
- The kit's „Podrożały · 2 koszty” equals `fixedCosts.counts.changed` (one sample row is a decrease) — a sample, not a
  rule; the label means „went up”.
- Smoke matches raw HTML; island-free Astro output, so `>text<` anchors work as long as a helper keeps each string in
  one text node (the `deltaClass` precedent).
- The kit's `.text-link` is the same box as `.back-link`; `BackLink.astro`'s class string + `focusRing` already render
  it.

## What We're NOT Doing

- No rule change: `fixedOverview`, `overLimitTrend`, `d5Type` (one-off merchants still count as „nowy” — `[human]`
  row), thresholds, `/api/*`; no migration, RLS, pgTAP or `db:types` change.
- No `/home` read-error copy change (the kit has no dashboard error view; `components.error` stays).
- No third summary row or fixed-cost total anywhere on `/home`; no import panel (`dashboard.importTitle/importBody`
  stay orphan kit keys).
- No `trend.current` / „niepełny” bar, no `trend.zero` / `fixedCosts.decreased` reader (recorded).
- `PanelTitle` adoption outside `/home` and `FixedSection` (`settings.astro`, `patterns/[...key].astro` ×3 stay — the
  follow-up remains open with those call sites).
- `Panel` radius 20 vs 12, `FormField` / `DeleteAccountDialog` field box (S-14 F7), S-05 F6/F7 — not triggered.
- Editing anything under `design/rytm-os/` or `src/styles/brand.css`; `npm run format` (F-04 prettier follow-up).

## Implementation Approach

Five small phases, each green on its own and committed separately by a fresh agent. P1 lands the pure guards and the
shared month index (no visible change except the `/fixed` error text). P2 rebuilds the dashboard body (one card +
summary panel, two new components: `PanelTitle`, `FixedSummary`). P3 rebinds the trend (one new component:
`InfoPanel`, then reused by `/fixed`). P4 rebinds `/fixed` (no new component). P5 is the milestone-closing audit,
register, seam sweep, follow-ups and visual gate. Every phase measures the baseline on the branch before editing,
reports `baseline + delta`, deletes the `copyExtra` leaves whose last reader it moved (grep proves it), runs at
least one deliberate break with a meta-check, and runs the full local gate (`npm run lint`, `npx astro check`,
`npm run fixture:check`, `npm test`, `npm run build`, `npx supabase db reset && npx supabase test db`, smoke on port
4398 — Docker/network commands with the sandbox disabled).

## Critical Implementation Details

**One text node per smoke-pinned string.** Every new string smoke asserts (`>Brak ustawionego progu<`, `>Cienka
kreska oznacza 0,00 zł<`, `>Zobacz zmiany<`, `>1 koszt<`, `>+1,50 zł · wzrost<`, `>Brak poprzedniego miesiąca do
porównania.<`) must render as the only content of its element, built in a helper/expression so prettier never wraps
it onto its own indented line (`deltaClass` precedent in `fixed.astro`). Keep „względem” out of every new `/home`
string („home has no comparison with one month” is a `notContains: "względem"`).

**Try blocks that contain `return Astro.redirect`.** In `patterns/[...key].astro` the redirects are `return`s, not
throws, so a `try` around `detailTarget` … `sequenceLabel` does not swallow them. The `catch` must leave the page in
the existing `readError` branch: set the error, and clear `pattern` / `detail` (make them `let`) so the actions
dialog and the 404 status never render alongside the error; log with `console.error("pattern detail failed", …)`.

**`/fixed` message rule (one message per state).** Pure helper `fixedNotices(overview)` →
`{ noComparison: !hasComparison, noChanges: hasComparison && changed.length === 0, noNew: hasComparison &&
new.length === 0, unchangedEmpty: unchanged.length === 0 }`. Without a comparison month `changed` and `new` are
necessarily empty (S-06 D6), so `noChanges` / `noNew` would be a second, misleading message.

**„Nowe” on `/home`.** `HomeStats.fixedNew = fixed.new.length` — `fixedOverview` already returns an empty `new` when
`hasComparison` is false, so one month reads „Nowe · 0 kosztów”, never „everything is new” (US-04 AC).

## Phase 1: Error boundaries and one month index

### Overview

The pure follow-ups: `/fixed` and `/patterns/<key>` stop turning an assembly throw into a 500, `/fixed` shows the kit
read-error copy, and one `monthIndex` serves both month parsers. No new UI component; no layout change.

### Changes Required:

#### 1. Shared month index

**File**: `src/lib/format.ts`, `src/pages/home.astro`, `test/unit/format.test.ts`

**Intent**: Two parsers of `YYYY-MM` in two styles (research §5) become one.

**Contract**: `export function monthIndex(yearMonth: string): number` (`"2026-05"` → 4); `fillMonthLocative` and
`home.astro` use it; the local `monthIndex` in `home.astro` is deleted. New `format.test.ts` cases: January → 0,
December → 11, and `fillMonthLocative` unchanged for „wrześniu” (we).

#### 2. `/fixed` error boundary and kit error copy

**File**: `src/pages/fixed.astro`

**Intent**: Archived follow-up „`fixed.astro` `try`” — copy the `home.astro` `result` IIFE shape; the error alert reads
the kit's `/fixed` read-error line (K18 delivered).

**Contract**: `fixedOverview(...)` inside `try … catch (err) { return { error: err } }`; the error branch renders
`InlineAlert kind="error"` with `copy.fixedCosts.readError` (title + lead kept, no sections). The header comment
names the boundary.

#### 3. `/patterns/<key>` assembly boundary (S-14 F8)

**File**: `src/pages/patterns/[...key].astro`

**Intent**: An id drift inside `detailTarget` / `patternDetail` / `sequenceLabel` renders the existing error branch.

**Contract**: see Critical Implementation Details („Try blocks that contain `return Astro.redirect`”). Redirect,
404 and success paths unchanged.

#### 4. F9 comment

**File**: `src/pages/home.astro`

**Intent**: The comment above `leadFor` stops citing a „`patterns.astro` `sumLabel` precedent”.

**Contract**: comment names the real precedent (`fillMonthLocative` month templates in `src/lib/format.ts`).

### Success Criteria:

#### Automated Verification:

- `npm test`: baseline + the new `format.test.ts` cases, 0 failed
- Smoke baseline PASS, 0 FAIL (Δ0 — no smoke step pins the `/fixed` error text)
- `grep -n "const monthIndex" src/pages/home.astro` empty; `grep -n "sumLabel" src/pages/home.astro` empty
- Deliberate break: `throw` inside the new `fixed.astro` `try` → `GET /fixed` as the test user answers 200 with „Nie udało się wczytać kosztów stałych. Odśwież widok.”, not 500; restored; meta-check recorded (the throw sits in assembly, after the read — it proves the boundary, not `loadPatternData`'s own error path)
- Deliberate break: `throw` inside the `[...key].astro` `try` → `GET /patterns/kawiarnia%20smoke` (or any existing key of the test user) answers 200 with `copy.components.error` and no actions dialog; restored
- Deliberate break: `monthIndex` returns the month number unshifted → the new format cases and the „we wrześniu” case go red; restored
- Full local gate vs baseline (lint 0, astro check 0, fixture:check OK, vitest baseline + Δ, build OK, pgTAP Δ0, smoke Δ0)

#### Manual Verification:

- [reviewer] Both `try` blocks wrap assembly only (never `loadPatternData`); redirects and the 404 path in `[...key].astro` behave as before; F8/F9 closed

---

## Phase 2: Dashboard body — one stat card and the „Koszty stałe” summary

### Overview

Kit `dashboard()` body: `.stats-single` with the accent card, the trend panel title through a shared `PanelTitle`,
and the new `.dashboard-fixed` summary panel; the second card, its total and `ImportPanel` go. Home copy rebinds to
kit keys. New UI components: `PanelTitle.astro`, `FixedSummary.astro` (2).

### Changes Required:

#### 1. Stats data

**File**: `src/lib/patterns/home.ts`, `test/unit/home-stats.test.ts`

**Intent**: Decision 2 — the fixed-cost total leaves `/home`; the summary needs the new-cost count.

**Contract**: `HomeStats { overMinor; previous; fixedRisen; fixedNew }` — `fixedTotalMinor` and `sumAmounts` deleted,
`fixedNew = fixed.new.length`. Header comment rewritten (no total, „Podrożały” = rises only, „Nowe” empty without a
comparison). Tests: case 1 `toEqual` with `fixedNew: 0`; case 4 becomes „only rises count toward fixedRisen, new rows
toward fixedNew”; the F-02 fixture case asserts `fixedNew` = the fixture's `fixedOverview(...).new.length` (cross-check
`fixed-overview.test.ts`; observed value, never invented). Add one case: no comparison → `fixedNew` 0.

#### 2. Shared panel title

**File**: `src/components/app/PanelTitle.astro` (new)

**Intent**: Archived follow-up „panel-title markup inline” — one component for kit `.panel-title` and `.section-label`
(research §1: identical `h2`/`span`, differ only in `align-items` and `margin-bottom`).

**Contract**: props `title: string`, `variant?: "panel" | "section"` (`panel` = `items-start mb-5`, `section` =
`items-center mb-[9px]`), `class?: string` (merged with `cn`); right-hand side = default slot (text `span` or a link).
`h2` `text-[17px] tracking-[-0.03em]`. P2 uses it for both `/home` panels; P4 for `FixedSection`.

#### 3. Summary panel

**File**: `src/components/home/FixedSummary.astro` (new), `src/content/copy.ts`

**Intent**: Kit `.panel.dashboard-fixed` from data already computed.

**Contract**: props `risen: string`, `added: string` (count texts built by the page with `plural`), `href: string`.
Renders `Panel` with the kit grid (`grid grid-cols-2 gap-3 mt-[15px]`, ≤ 560 px one column), `PanelTitle` spanning
both columns (`col-span-full mb-[2px]`) with title `copy.dashboard.stats[1].label` and a „Zobacz zmiany” link (the
`BackLink` box: `text-[13px] font-extrabold text-ink no-underline` + `focusRing`), then two `.fixed-summary-row`s
(`flex justify-between items-center border-t border-line py-[13px] text-[13px] text-muted`, value `strong text-ink`).
New leaves, each under one `DESIGN-GAP: K38` comment (kit `app.js` literals, no key): `copyExtra.home.fixedSummary =
{ link: "Zobacz zmiany", risen: "Podrożały", added: "Nowe", costForms: ["koszt", "koszty", "kosztów"] }` („kosztów”
is the regular genitive plural the kit never shows — recorded in K38).

#### 4. `/home` page

**File**: `src/pages/home.astro`, `src/components/home/ImportPanel.astro` (delete), `src/content/copy.ts`

**Intent**: Kit layout and copy keys.

**Contract**: one `StatCard accent` in `grid grid-cols-[minmax(260px,380px)] mb-4 max-[360px]:grid-cols-[minmax(0,1fr)]`;
trend panel title via `PanelTitle variant="panel"` (span `copy.trend.range`); `FixedSummary` after the trend with
`fixedRisen` / `fixedNew` and `href="/fixed"`. `leadFor` → `copy.dashboard.descriptionNoName` with the nominative from
`Object.keys(copy.patternDetail.monthNames)[monthIndex(month)]` (decision 9); `deltaFootFor` →
`copy.dashboard.stats[0].foot` + `copyExtra.home.monthsGenitive`; pre-import branch → `copy.home.emptyEyebrow /
emptyTitle / emptyLead / emptyIllustrationAlt`. Delete `risenFootFor`, the `ImportPanel` import and file, and leaves
`home.lead`, `home.monthsNominative`, `home.deltaFoot`, `home.risen`, `home.risenForms`, `home.empty*` (grep first).
Remove the `DESIGN-GAP: K24` comment (K24 delivered); the `monthsGenitive` comment says K25 only (K29 moot for the app).
Header comment describes the round-3 dashboard.

#### 5. Kit-contract pin and smoke

**File**: `test/unit/kit-contract.test.ts`, `scripts/smoke.mjs`

**Intent**: Pin the derived nominatives; move the smoke pins that described the removed UI.

**Contract**: new kit-contract case: `Object.keys(copy.patternDetail.monthNames)` has 12 entries, `[0]` „styczeń”,
`[4]` „maj”, `[8]` „wrzesień”. Smoke (same step count): „home before import has no trend” notContains
`[">Ponad progiem<", ">Zobacz zmiany<"]`; „home offers the next import” replaced in place by „home summarises fixed
costs with one month” — contains `[">Zobacz zmiany<", ">Podrożały<", ">0 kosztów<"]`, notContains `">Dodaj najnowszy
wyciąg<"`; „home counts fixed costs that rose” — contains `[">Podrożały<", ">Nowe<", ">1 koszt<"]`, notContains
`[">67,99 zł<", ">0 kosztów<"]` (Kawiarnia Rytm rose, Piekarnia smoke is new); one new step „home lead names the
reference month” (one-month state, after „home summarises fixed costs with one month”): contains `">Twój maj w jednym
spokojnym widoku.<"` (no step pins the lead today); header comment rewritten for the summary panel.

### Success Criteria:

#### Automated Verification:

- `npm test`: Phase 1 count + the new home-stats and kit-contract cases (rewritten cases counted once), 0 failed
- Smoke Phase 1 count + 1 PASS, 0 FAIL (three steps re-pinned as listed, one lead step added; „home compares with the previous month” `>+1,50 zł względem maja<` unchanged)
- `grep -rn "ImportPanel\|fixedTotalMinor\|risenFootFor\|risenForms\|monthsNominative\|h\.lead\|h\.deltaFoot\|h\.empty" src test` empty, and `copyExtra.home` holds only `monthsGenitive` + `fixedSummary` (+ `noThreshold` until P3)
- Deliberate break: `fixedNew` hard-coded to 0 → home-stats red and smoke „home counts fixed costs that rose” red (`>0 kosztów<` appears); restored; meta-check recorded (smoke proves the page wires `fixedNew` into the panel, the unit test proves the count)
- Deliberate break: nominative index shifted by one → smoke „home lead names the reference month” red („Twój czerwiec …”); restored — meta-check: the kit-contract case stays green (it pins the kit keys, not the page's index), which is why the smoke step exists
- Full local gate vs baseline, smoke + 1

#### Manual Verification:

- [reviewer] Layout classes match kit `.stats-single`, `.dashboard-fixed`, `.fixed-summary-row`; colours only via Tailwind names; `FixedSummary` and `PanelTitle` carry no copy of their own
- [visual] Quick look at 1280 and ~400 px: one card, summary rows side by side at 1280 and stacked at 400 (full matrix in P5)

---

## Phase 3: Trend — legend chips, bar names and kit geometry

### Overview

Kit `trendChart()` presentation on the existing data: legend chips shown under the condition they describe, a name
per bar, the kit group name, bar colours, value type and the 8 % minimum; the „no threshold” info panel and its
placeholder leaf go. New UI component: `InfoPanel.astro` (1), reused by `/fixed` in P4.

### Changes Required:

#### 1. Shared info panel

**File**: `src/components/app/InfoPanel.astro` (new), `src/components/home/TrendChart.astro`

**Intent**: Kit `.info-panel` is needed by the trend note and three `/fixed` messages — one component instead of the
local `infoPanel` class string.

**Contract**: default slot; class string = today's `infoPanel` (`mt-[14px] border-l-[3px] border-ink bg-paper-soft
p-[13px] text-xs text-muted`), optional `class` merged with `cn`. The slot content renders without wrapping whitespace
(smoke anchors).

#### 2. Bar data and height

**File**: `src/lib/patterns/trend.ts`, `test/unit/over-limit-trend.test.ts`, `src/pages/home.astro`

**Intent**: Kit minimum bar height (`Math.max(8, …)`), decision 5.

**Contract**: `trendBarHeight` minimum 8; doc comment updated; the unit case `[10, 1000, 12]` becomes `[10, 1000, 8]`
(a value change of the same assertion, not a weaker one) plus one case at the boundary (`[80, 1000, 8]`).
`home.astro` `barsFor` adds `name` per bar: `` `${label}: ${…}` `` with `copy.trend.amountLabel` (`{amount}`) for a
non-zero bar and `copy.trend.zeroMarker` for a zero bar; passes `hasZero` (any bar 0) and `noThreshold`
(`!trend.hasThreshold`) instead of `hint`.

#### 3. Chart markup and legend

**File**: `src/components/home/TrendChart.astro`, `src/content/copy.ts`

**Intent**: Kit look and names; the legend explains the zero mark and the missing threshold only when true
(decision 4).

**Contract**: props `bars: { label; amount; height; name }[]`, `legend`, `ariaLabel`, `note?`, `zeroNote?`,
`noThreshold?` (`hint` removed). `<ol aria-label>` = `copy.trend.gridLabel` (passed by the page); each bar `<i
role="img" aria-label={bar.name}>`; bar `bg-muted`, zero bar `h-[2px] bg-line`; value `text-[11px] font-bold
text-ink` (≤ 560 px `text-[9px]`, ≤ 360 px `text-[8px]`), keeping `whitespace-nowrap`, `min-w-[44px]` and the
reversed scroll (G35 decisions for long axes); legend dot `bg-muted`. Legend row: „suma ponad progiem”, then
`zeroNote` with `ml-auto` (≤ 560 px `text-[10px]`) when given, then the `noThreshold` chip when given; `note`
(`tooShort`) renders through `InfoPanel`. New leaf `copyExtra.home.zeroNote = "Cienka kreska oznacza 0,00 zł"` under
`DESIGN-GAP: K39`; the chip reads `copy.trend.noThreshold` (no `title` tooltip — the kit's `title` literal has no
carrier, K39). Delete `copyExtra.home.noThreshold` and its G35 comment. Header comment: G35 bar-grey part closed
(exact `--rytm-sequence` = muted), gridline stays `border-line`.

#### 4. Smoke

**File**: `scripts/smoke.mjs`

**Contract**: „home shows the trend without a threshold” contains `">Brak ustawionego progu<"` instead of the old hint
sentence (other needles unchanged); „home shows the over-limit sum” notContains `">Brak ustawionego progu<"`. Two new
steps: „home explains the zero bar” (one-month, no-threshold state, after „home shows the trend without a threshold”):
contains `">Cienka kreska oznacza 0,00 zł<"`; „home names each trend bar” (after „home shows the over-limit sum”):
contains `aria-label="maj 26: 5,50 zł ponad próg"`, notContains `">Cienka kreska oznacza 0,00 zł<"`.

### Success Criteria:

#### Automated Verification:

- `npm test`: Phase 2 count + 1 (boundary case), 0 failed
- Smoke Phase 2 count + 2 PASS, 0 FAIL
- `grep -rn "noThreshold\|hint=" src/pages/home.astro src/content/copy.ts` shows only `copy.trend.noThreshold`; `grep -n "infoPanel" src/components/home/TrendChart.astro` empty
- Deliberate break: `zeroNote` passed unconditionally → „home names each trend bar” red; restored; meta-check recorded (proves the condition, not the text)
- Deliberate break: `trendBarHeight` minimum back to 12 → the `trendBarHeight` cases red; restored
- Deliberate break: `noThreshold` chip shown when `hasThreshold` → „home shows the over-limit sum” red; restored
- Full local gate vs baseline, smoke + 3 (cumulative)

#### Manual Verification:

- [reviewer] Every trend string comes from `copy.trend.*` except `zeroNote` (K39); no hard-coded hex; the old hint panel and `hint` prop are gone

---

## Phase 4: `/fixed` — kit states, delta suffixes and copy

### Overview

Kit `fixedCosts(state)` presentation: the message rule, the info panels in kit places, empty sections without an
empty list panel, delta suffixes, kit copy keys, `PanelTitle` in `FixedSection`. No new UI component (uses
`InfoPanel` from P3, `PanelTitle` from P2).

### Changes Required:

#### 1. Pure helpers

**File**: `src/lib/patterns/fixed-view.ts` (new), `test/unit/fixed-view.test.ts` (new)

**Intent**: The state rule and the delta text are unit-testable apart from the page (smoke data never reaches „a
comparison month with no change”).

**Contract**: `fixedNotices(overview: FixedOverview)` per Critical Implementation Details; `deltaText(deltaMinor,
words: { increase: string; decrease: string })` → `` `${formatSignedMoney(deltaMinor)} · ${word}` `` („+1,50 zł ·
wzrost”, „−5,00 zł · spadek”, U+2212 from `formatSignedMoney`). Tests: no comparison (only `noComparison`, plus
`unchangedEmpty` when unchanged is empty); comparison with empty changed / new / unchanged; comparison with rows (all
false); both delta directions.

#### 2. Page

**File**: `src/pages/fixed.astro`, `src/content/copy.ts`

**Intent**: Kit placement and copy (decisions 6–7).

**Contract**: eyebrow `copy.app.fixedLong` on every branch; `countText` → `copy.fixedCosts.itemForms`. Data branch:
`PageTitle`, then `InfoPanel` with `copy.fixedCosts.noComparison` when `notices.noComparison` (under the title,
`mt-0 mb-…` as the visual gate settles), then the three `FixedSection`s (no `compact`, no `empty` prop), then — when any
of `noChanges` / `noNew` / `unchangedEmpty` holds — one block (kit `.fixed-empty-states`: `grid gap-2.5 mt-3`) with an
`InfoPanel` each, in section order: `copy.fixedCosts.noChanges`, `copy.fixedCosts.noNew`, `copyExtra.fixed.unchangedEmpty`.
Delta `<b>` text = `deltaText(row.deltaMinor, copyExtra.fixed.delta)` with new leaves `copyExtra.fixed.delta =
{ increase: "wzrost", decrease: "spadek" }` under `DESIGN-GAP: K40`; `deltaClass` keeps `text-excess-text` /
`text-green` and loses its G34 comment (the kit now defines `.increase` / `.decrease`). Delete leaves `fixed.eyebrow`,
`fixed.itemForms`, `fixed.changedEmpty`, `fixed.newEmpty`, `fixed.noComparison`; the `fixed` block comment: `unchangedEmpty`
is the one empty state the kit does not define (`DESIGN-GAP: G39`). Header comment rewritten.

#### 3. Section component

**File**: `src/components/fixed/FixedSection.astro`

**Intent**: Shared title markup; no empty list panel; `compact` follow-up closed.

**Contract**: props `title`, `count`, `hasRows` (`empty`, `compact` removed); heading via `PanelTitle
variant="section"`; the list panel renders only when `hasRows`. Header comment updated.

#### 4. Smoke

**File**: `scripts/smoke.mjs`

**Contract**: „fixed with one month lists no change” → contains `[">Zmieniły kwotę<", ">0 pozycji<"]`, notContains
`">W tym miesiącu nie zmieniły się żadne koszty stałe.<"` (one message without a comparison); „fixed without a
previous month says so” → contains `">Brak poprzedniego miesiąca do porównania.<"` (notContains `>nowy<` kept); „fixed
lists a changed amount” → contains `">+1,50 zł · wzrost<"`, notContains `">W tym miesiącu nie zmieniły się żadne koszty
stałe.<"`; „fixed compares with the previous month” → notContains `">Brak poprzedniego miesiąca do porównania.<"` and
`">Nie pojawiły się nowe koszty stałe.<"`. Same step count. (Verify `>0 pozycji<` is unique to the changed section in
that state; if the „Nowe” section also reads „0 pozycji”, keep the needle — both are true — and say so.)

### Success Criteria:

#### Automated Verification:

- `npm test`: Phase 3 count + the `fixed-view.test.ts` cases, 0 failed
- Smoke Phase 3 count PASS, 0 FAIL (Δ0 steps; four steps re-pinned)
- `grep -rn "compact\|changedEmpty\|newEmpty\|x.noComparison\|x.eyebrow\|x.itemForms\|G34" src/pages/fixed.astro src/components/fixed/FixedSection.astro` empty (FixedRow's own `compact` stays)
- Deliberate break: `noChanges` ignores `hasComparison` → `fixed-view.test.ts` and smoke „fixed with one month lists no change” red; restored; meta-check recorded (smoke proves the page uses the helper, the unit test proves the rule incl. the state smoke never reaches)
- Deliberate break: `deltaText` drops the suffix → `fixed-view.test.ts` and „fixed lists a changed amount” red; restored
- Full local gate vs baseline, smoke + 3 (cumulative)

#### Manual Verification:

- [reviewer] One message per state (no comparison → only `noComparison`); no section drawn under a read error; colours only via Tailwind names

---

## Phase 5: Milestone-closing `copyExtra` audit, gap register, seam sweep and visual gate

### Overview

Close M-3: every remaining `copyExtra` leaf (all seven namespaces) has a reader and no `content.json` key with the
same meaning, guarded by a unit test; the three byte-identical duplicates outside S-15 are rebound (zero visible
change); the register, the follow-ups and the comments match the code; the visual gate covers every `/home` and
`/fixed` state. No new UI component.

### Changes Required:

#### 1. Byte-identical rebinds outside S-15 views (decision 10)

**File**: `src/pages/imports/result.astro`, `src/pages/imports/new.astro` and/or `src/components/imports/ImportWizard.tsx`
(wherever `santanderAccountName` is read), `src/pages/reset/new.astro`, `src/content/copy.ts`

**Intent**: Research §6b — same bytes from the kit key, so no screen changes.

**Contract**: `copyExtra.imports.debitForms` → `copy.importFlow.debitForms`; `copyExtra.imports.santanderAccountName` →
`copy.imports.santanderAccountName` (passed in the same prop the wizard already receives); `auth.resetNewVisual.eyebrow
/ title` → `copy.auth.resetVisual.eyebrow / title`, `copyExtra.auth.resetNewVisual` keeps only `lead` (K13 comment kept).
Delete the moved leaves. If a rebind turns out NOT byte-identical or needs a component API change beyond one prop,
stop and file it in `follow-ups/review-fixes.md` with `Trigger: next slice touching <view>` instead.

#### 2. `copyExtra` guard test

**File**: `test/unit/kit-contract.test.ts`

**Intent**: Make the milestone audit durable: a future duplicate fails CI instead of waiting for a manual audit.

**Contract**: one case walks every string leaf of `copyExtra` (array elements included) and fails when its value
equals any string leaf of `copy`, unless the path is in an explicit `ROLE_EXCEPTIONS` map `{ path: reason }`. Expected
exceptions after P1–P5 (verify by running it; add none without a reason): `auth.saving` (`threshold.saving` — other
component's namespace), `settings.close` (`patternActions.close*` / `imports.deleteClose`), `settings.deleting`
(`imports.deleteWaiting`), `patterns.mergeSubmit` (`patternActions.mergeTitle` — h2 role), `patterns.monthsLocative.*`
(K30, deliberate „we wrześniu” helper), `imports.transactionForms.2` (one form of a 3-form array; `importFlow.transactions`
is a label). Any S-15 leaf that collides (e.g. a kit string „Nowe”) is rebound instead.

#### 3. Gap register

**File**: `context/foundation/design-kit.md`

**Contract**: round-3 table: K23 partial (meta lines only; `itemForms` adopted), K24 adopted (no `DESIGN-GAP` left),
K25 partial (genitive months only), K29 moot for the app (second card removed — row kept for the author), G34 closed
(S-15: kit states adopted; `unchangedEmpty` moved to G39), G35 text updated (no `ImportPanel` border, no `noThreshold`
placeholder; bar grey exact `--rytm-sequence`; gridline still raw), K11 home/fixed/app part updated, K18 note: `/home`
keeps `components.error` (no kit dashboard error view). New rows (next free ids at plan time; renumber if taken): K38
dashboard summary literals („Zobacz zmiany”, „Podrożały”, „Nowe”, hard-coded counts, no plural forms — app adds
„kosztów”); K39 trend legend literals („Cienka kreska oznacza 0,00 zł”, „Brak progu” + its `title`, group label
„Miesięczna suma ponad progiem”) vs `trend.noThreshold` / `gridLabel`, legend `.dot` raw `#9aaab3`; K40 `/fixed` delta
suffixes „wzrost” / „spadek” as literals, `fixedCosts.decreased` rendered nowhere; K41 orphan keys
`dashboard.importTitle/importBody/stats[1].value/foot`; G39 no copy for an empty „Bez zmian” section. „Do rundy 4”
list gains K38–K41 and G39. The „Dostarczone bez wiersza K/G” line keeps `trend.amountLabel/zeroMarker/gridLabel` (now
read).

#### 4. Seam sweep

**File**: any file touched in P1–P4, `src/content/copy.ts`, `scripts/smoke.mjs`

**Contract**: every remaining `copyExtra` leaf has a reader in `src/` (scripted grep over the leaf names, all
namespaces); no comment naming `ImportPanel`, the second card, `fixedTotalMinor`, `risen`, `noThreshold` as an app hint,
`hint`, `compact` on `FixedSection`, „placeholder” for kit-delivered states, or `DESIGN-GAP: K24` / `G34`; every
`DESIGN-GAP` id in `src/` has a register row; `smoke.mjs` header comment matches the steps; `copy.ts` header comment
still true.

#### 5. Follow-ups

**File**: `context/changes/kit-round-3-home-fixed/follow-ups/review-fixes.md` (new)

**Contract**: closed here (with the commit that closed each): `fixed.astro` `try`, S-14 F8, F9, `monthIndex`, F-04 § S-15
items (card feet moot, badge tint done in S-14, `noComparison` string moved), G36 tick (kit C5, no code). Open, each
with `Trigger:`: `PanelTitle` for `settings.astro` + `patterns/[...key].astro` ×3 (next slice touching those views);
one-off merchants as „nowy” on `/home` and `/fixed` (`d5Type` rule change or product feedback); K38–K41, G39 (kit round 4);
any rebind from item 1 that had to be deferred.

### Success Criteria:

#### Automated Verification:

- `npm test`: Phase 4 count + the guard case, 0 failed
- Every `copyExtra` leaf has a reader (grep loop prints nothing)
- Seam greps empty (`ImportPanel`, `fixedTotalMinor`, `risenFootFor`, `DESIGN-GAP: K24`, `DESIGN-GAP: G34` in `src/`); every `DESIGN-GAP` id in `src/` appears in `context/foundation/design-kit.md`
- Phase leaves `design/` and `src/styles/brand.css` untouched (`git diff --stat main -- design src/styles/brand.css` empty)
- Deliberate break: add `copyExtra.home.probe = "Bez zmian"` (= `copy.fixedCosts.unchanged`) → the guard case red; restored; meta-check recorded (the guard catches byte-identical duplicates only — same meaning with different text stays a reviewer row)
- Deliberate break: add an unread `copyExtra.fixed.unused` leaf → the leaf-reader grep catches it; restored
- Full local gate vs baseline, smoke + 3 (cumulative)

#### Manual Verification:

- [reviewer] Audit complete: every surviving leaf is a true gap or a `ROLE_EXCEPTIONS` entry with a reason; no same-meaning kit key ignored (research §6 table re-walked); register matches the code; follow-ups carry `Trigger:` lines
- [visual] Screenshots desktop 1280 + ~400 px, compared with kit views `home`, `home-no-name`, `home-empty`, `home-demo`, `fixed*`: `/home` data with a threshold and ≥ 3 months (synthetic ING fixture import), one month (no delta foot, „Podrożały · 0 kosztów”, „Nowe · 0 kosztów”, `tooShort` note), no threshold (both legend chips, zero bars), a zero month among non-zero bars (zero note), 12-month axis at 400 px (scroll opens at the end), pre-import empty, demo account; `/fixed` with changed (rise, and decrease if the fixture yields one, else stated), new and unchanged rows, no comparison month, comparison with no change, comparison with no new cost, empty „Bez zmian” (if reachable, else stated), pre-import empty view, read error (only if reproducible without mutating the DB outside `BEGIN … ROLLBACK`, else stated); „Zobacz zmiany” with keyboard focus
- [visual] Other views touched by rebinds, desktop + ~400 px: `/reset/new` visual panel, import result title, Santander account step (byte-identical — confirm no change)
- [human] Accept S-15 product-visible choices: removed `/home` fixed-cost total (second card) and import panel (PRD silent; S-07 `[human]` 4.11 never ticked); „Podrożały” counts rises only (kit sample counts all changed rows); one-off merchants still count in „Nowe”; trend chip reads `trend.noThreshold` „Brak ustawionego progu” not the prototype's „Brak progu”, and the old „Ustaw próg na wzorcu…” hint panel is gone; trend minimum bar 12 → 8 %; zero note only when a bar is 0; `/fixed` without a comparison shows one message and empty sections keep only heading + count; „Nowe” noun forms add „kosztów”; send K38–K41 and G39 to the kit author

## Testing Strategy

### Unit Tests:

- New: `fixed-view.test.ts` (`fixedNotices` every state incl. „comparison, no change” that smoke never reaches;
  `deltaText` both directions). Extended: `format.test.ts` (`monthIndex`), `home-stats.test.ts` (`fixedNew`, total
  cases rewritten), `over-limit-trend.test.ts` (`trendBarHeight` 8 % + boundary), `kit-contract.test.ts` (month-name
  keys, `copyExtra` guard).

### Integration Tests:

- Smoke + 3 net (P2 + 1 lead step, P3 + 2 trend steps); re-pinned in place: P2 three home steps, P3 two trend steps,
  P4 four fixed steps — each re-pin replaces a needle that described removed or reworded UI, never a weaker check of
  the same behaviour. pgTAP unchanged (no schema change).

### Manual Testing Steps:

1. `npx supabase start`; import the synthetic ING fixture for the test user (several months, > 1 fixed pattern);
   `ASTRO_DEV_BACKGROUND=1 npx astro dev --port 4399 --ignore-lock`.
2. Walk the P5 visual list at 1280 and ~400 px; reach one-month / no-threshold states with the smoke-style account or
   a fresh signup + one import; remove/restore a threshold for the zero-bar state.
3. Kill the dev server (`lsof -ti :4399 | xargs kill`).

## Known risks

- `/home` and `/fixed` pages have no render test; the page wiring is proven by smoke needles and the visual gate,
  the rules by the pure helpers.
- Deriving nominatives from `Object.keys(copy.patternDetail.monthNames)` relies on JSON key order (insertion order
  for non-integer keys — stable in JS); the kit-contract case pins it, a kit reorder fails CI rather than the page.
- `>0 pozycji<` / `>1 koszt<` needles can match more than one element; each step pairs them with a negative needle
  (`>0 kosztów<`, the old texts) so the step still discriminates.
- The read-error states cannot be produced by smoke; the deliberate breaks in P1 prove them once.

## Performance Considerations

None: no new read; `fixedNotices` and `deltaText` are O(rows) over data already in memory.

## Migration Notes

None. Rollback = revert the merge.

## Autonomous decisions

Recorded in place of the skill's questions (run contract rule 1). **No decision departs from the PRD's literal text**:
the PRD names neither a `/home` fixed-cost total nor an import panel (research §2); FR-011/FR-012/FR-013, US-04/US-05
and Success Criteria Primary („które podrożały i które są nowe”) are met more directly by the summary panel. Kit
departures and product-visible choices the maintainer may reverse are collected in the `[human]` row 5.11.

| # | Decision | Chosen | Rejected | Why | What would change it |
| --- | --- | --- | --- | --- | --- |
| 1 | Complexity / questions | MEDIUM, 0 questions | Interview | Research answered every open question with a recommendation; the rest is reversible presentation | A product owner available |
| 2 | Second stat card and its total | Removed; `HomeStats.fixedTotalMinor` dropped (3 unit cases rewritten) | Keep the card with a `DESIGN-GAP`; keep the field unused | Kit `.stats-single`; PRD silent; a dead field invites drift; the total was inflated by one-off merchants (S-07 F3) | Maintainer wants the total → a card with a `DESIGN-GAP`, never a third summary row |
| 3 | Import panel | Removed; `ImportPanel.astro` deleted | Keep (kit keys still exist) | No round-3 home view draws it; entry stays in the title button, empty states, nav; demo gating lives in `/imports/new` | Maintainer asks for it back, or a kit view draws it |
| 4 | Legend chips | Zero note only when a bar is 0; chip `trend.noThreshold` only when no threshold; hint panel removed | Always-on chips (prototype sample); literal „Brak progu”; keep the hint panel | An always-on „no threshold” is false for users with thresholds; copy from `content.json` when a key with the meaning exists (`fixedCosts.new` precedent) | Visual gate shows the all-zero chart unexplained → hint panel back as `DESIGN-GAP`; maintainer prefers the literal |
| 5 | Minimum bar height | 8 % (kit) | 12 % (app) | Kit geometry, no PRD stake; same assertion with the new value | Visual gate shows small sums invisible at 400 px |
| 6 | `/fixed` messages | One message per state: no comparison → only `noComparison` under the title; with comparison → `noChanges` / `noNew` after the sections | Kit-literal both messages; in-section empty lines | Kit placement; a „no change” line without a comparison month is misleading (S-06 D6) | Kit adds an explicit no-month + no-change state |
| 7 | Empty sections | Heading + count, no list panel; `unchangedEmpty` joins the after-sections block | Empty list panel with a line; `unchangedEmpty` in-section | Kit never draws an empty list panel; one place for every empty message | Visual gate finds the bare heading confusing → in-section line back |
| 8 | Summary counts | „Podrożały” = rises only (`fixedRisen`); „Nowe” = `fixedOverview().new.length`, one-off merchants included | All changed rows (kit sample); filter one-offs | The label means „went up”; filtering is a classifier rule outside M-3 | Kit adds a rule; product feedback on one-off noise |
| 9 | Nominative months | Derived from `Object.keys(copy.patternDetail.monthNames)` + kit-contract pin | Keep `copyExtra.home.monthsNominative` | The kit holds the 12 nominatives; the milestone audit requires no kit-equivalent leaf | Kit reshapes `monthNames` → pin fails, restore the `copyExtra` table with a K row |
| 10 | Byte-identical leaves outside S-15 | Rebind in P5 (`imports.debitForms`, `imports.santanderAccountName`, `auth.resetNewVisual.eyebrow/title`) | File as follow-ups | Zero visible change; the milestone-closing audit asks for them fixed or filed — fixing is cheaper than tracking | A rebind needs more than one prop change → follow-up with `Trigger:` |
| 11 | Audit durability | Unit guard over `copyExtra` vs `copy` string leaves with a reasoned `ROLE_EXCEPTIONS` map | One-off manual audit | A future duplicate fails CI | — |
| 12 | Role exceptions | Keep `auth.saving`, `settings.close/deleting`, `patterns.mergeSubmit`, `patterns.monthsLocative`, `imports.transactionForms[2]` | Bind across namespaces | A view reading another component's key couples it to wording the author may change for that component | Kit adds shared `components.*` keys |
| 13 | `PanelTitle` reach | `/home` panels + `FixedSection` | All six call sites | One view + global tokens; other views stay untouched | Next slice touching settings / pattern detail |
| 14 | Bar names | `role="img"` + aria-label per bar (`amountLabel` / `zeroMarker`), list named `trend.gridLabel` | No names; the kit's literal group label | Kit markup; key over literal | Screen-reader test showing duplicated reading is worse |
| 15 | `/fixed` read error | Alert only, no sections | Kit sample sections under the alert | Rows from failed data would be invented (K18 precedent) | Kit draws an explicit error layout |
| 16 | Delta suffixes | `copyExtra.fixed.delta` literals (K40); `fixedCosts.decreased` unread | `decreased` as the suffix | `decreased` is different text the kit renders nowhere | Kit adds suffix keys |
| 17 | Phase size | 5 phases, ≤ 2 new UI components each | Fewer, larger phases | Contract: fresh agent per phase, small and green | — |

## References

- Change identity: `context/changes/kit-round-3-home-fixed/change.md`
- Research: `context/changes/kit-round-3-home-fixed/research.md`
- Kit: `design/rytm-os/prototype/app.js` (`dashboard`, `trendChart`, `fixedCosts`, `emptyView`),
  `design/rytm-os/prototype/styles.css` (`.stats-single`, `.dashboard-fixed`, `.fixed-summary-row`, `.panel-title`,
  `.section-label`, `.trend-value`, `.trend-zero-note`, `.info-panel`, `.fixed-empty-states`, `.increase`, `.decrease`,
  `.text-link`), `design/rytm-os/react-kit/docs/content.json`, views `home*.html`, `fixed*.html`
- Register: `context/foundation/design-kit.md`
- Follow-ups consumed: `context/archive/2026-10-03-kit-round-3-patterns/follow-ups/review-fixes.md` (`fixed.astro` `try`,
  F8, F9), `context/archive/2026-10-02-kit-round-3-intake/follow-ups/review-fixes.md` (§ S-15),
  `context/archive/2026-09-28-over-limit-trend/` (second card, import panel, G36)
- Format example: `context/archive/2026-10-03-kit-round-3-patterns/plan.md`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Error boundaries and one month index

#### Automated

- [ ] 1.1 npm test: baseline plus new format cases, 0 failed
- [ ] 1.2 Smoke baseline PASS, 0 FAIL, Δ0
- [ ] 1.3 No local monthIndex and no sumLabel comment left in home.astro
- [ ] 1.4 Deliberate break: throw in the fixed.astro try renders readError with 200, not 500, restored, meta-check recorded
- [ ] 1.5 Deliberate break: throw in the [...key].astro try renders components.error with 200 and no dialog, restored
- [ ] 1.6 Deliberate break: unshifted monthIndex turns the format cases red, restored
- [ ] 1.7 Full local gate vs baseline, smoke Δ0

#### Manual

- [ ] 1.8 [reviewer] Both try blocks wrap assembly only; redirects and 404 unchanged; F8/F9 closed

### Phase 2: Dashboard body — one stat card and the Koszty stałe summary

#### Automated

- [ ] 2.1 npm test: Phase 1 count plus home-stats and kit-contract cases, 0 failed
- [ ] 2.2 Smoke Phase 1 count + 1 PASS, 0 FAIL, three home steps re-pinned
- [ ] 2.3 No reader left for ImportPanel, fixedTotalMinor, risenFootFor or deleted copyExtra.home leaves
- [ ] 2.4 Deliberate break: fixedNew = 0 turns home-stats and the rose step red, restored, meta-check recorded
- [ ] 2.5 Deliberate break: shifted nominative index turns the lead step red, restored, meta-check recorded
- [ ] 2.6 Full local gate vs baseline, smoke + 1

#### Manual

- [ ] 2.7 [reviewer] Layout matches kit stats-single, dashboard-fixed, fixed-summary-row; Tailwind colour names only; components carry no copy
- [ ] 2.8 [visual] Quick look 1280 and ~400 px: one card, summary rows side by side then stacked

### Phase 3: Trend — legend chips, bar names and kit geometry

#### Automated

- [ ] 3.1 npm test: Phase 2 count + 1, 0 failed
- [ ] 3.2 Smoke Phase 2 count + 2 PASS, 0 FAIL
- [ ] 3.3 No copyExtra.home.noThreshold, hint prop or local infoPanel left
- [ ] 3.4 Deliberate break: unconditional zeroNote turns the bar-names step red, restored, meta-check recorded
- [ ] 3.5 Deliberate break: minimum back to 12 turns the trendBarHeight cases red, restored
- [ ] 3.6 Deliberate break: chip shown with a threshold turns the over-limit-sum step red, restored
- [ ] 3.7 Full local gate vs baseline, smoke + 3 cumulative

#### Manual

- [ ] 3.8 [reviewer] Trend strings from copy.trend except zeroNote (K39); no hex; hint panel gone

### Phase 4: /fixed — kit states, delta suffixes and copy

#### Automated

- [ ] 4.1 npm test: Phase 3 count plus fixed-view cases, 0 failed
- [ ] 4.2 Smoke Phase 3 count PASS, 0 FAIL, four fixed steps re-pinned
- [ ] 4.3 No compact, changedEmpty, newEmpty, noComparison, eyebrow, itemForms or G34 left in fixed.astro / FixedSection
- [ ] 4.4 Deliberate break: noChanges ignoring hasComparison turns fixed-view and the one-month step red, restored, meta-check recorded
- [ ] 4.5 Deliberate break: deltaText without suffix turns fixed-view and the changed-amount step red, restored
- [ ] 4.6 Full local gate vs baseline, smoke + 3 cumulative

#### Manual

- [ ] 4.7 [reviewer] One message per state; no sections under a read error; Tailwind colour names only

### Phase 5: Milestone-closing copyExtra audit, gap register, seam sweep and visual gate

#### Automated

- [ ] 5.1 npm test: Phase 4 count plus the copyExtra guard case, 0 failed
- [ ] 5.2 Every copyExtra leaf has a reader
- [ ] 5.3 Seam greps empty; every DESIGN-GAP id in src has a register row
- [ ] 5.4 Phase leaves design/ and brand.css untouched
- [ ] 5.5 Deliberate break: copyExtra leaf equal to a kit string turns the guard red, restored, meta-check recorded
- [ ] 5.6 Deliberate break: unread copyExtra leaf caught by the leaf-reader grep, restored
- [ ] 5.7 Full local gate vs baseline, smoke + 3 cumulative

#### Manual

- [ ] 5.8 [reviewer] Audit complete, role exceptions reasoned, register matches code, follow-ups carry Trigger lines
- [ ] 5.9 [visual] Screenshots desktop + ~400 px of every listed /home and /fixed state, compared with the kit views
- [ ] 5.10 [visual] Screenshots desktop + ~400 px of the rebound views outside S-15 (reset/new panel, import result title, Santander account step)
- [ ] 5.11 [human] Accept S-15 product-visible choices (removed total and import panel, rises-only Podrożały, one-offs in Nowe, chip key text and removed hint panel, minimum bar 12 → 8 %, conditional zero note, one /fixed message without comparison, kosztów form) and send K38–K41, G39 to the kit author
