# Zmiany kwot i nowe wzorce stałe (S-06 `fixed-cost-changes`) Implementation Plan

## Overview

Turn `/fixed` from a static placeholder into the kit's „Koszty stałe” view (FR-012, US-04): for the fixed patterns
charged in the reference month it lists which **changed amount** (every change against the previous occurrence, a
rise, a decrease or a change inside the D5 tolerance), which are **new** against the previous calendar month (D6), and
which are **unchanged**; with no transaction in the previous month it says there is no month to compare with instead of
calling everything new. Everything is derived on read from `loadPatternData` by one pure, exported function
(`fixedOverview`) that S-07's `/home` stat card can reuse. The F-02 fixture gains an in-tolerance price change in its
reference month so the headline case is visible on the one importable file. No migration.

## Current State Analysis

Source: `context/changes/fixed-cost-changes/research.md` (rule, fixture, kit), re-checked here against the files below
at `2d916db` on `feat/fixed-cost-changes`.

- **Page.** `src/pages/fixed.astro` renders `PageTitle` + `ViewEmpty` („Koszty stałe pojawią się po pierwszym
  imporcie.”) unconditionally — even for an account with data. It is already a protected route
  (`src/middleware.ts` `PROTECTED_ROUTES`) and the sidebar entry exists.
- **Read.** `src/lib/patterns/load.ts` `loadPatternData(supabase)` → `{ patterns, rows, thresholds, decisions }` or
  `{ error }`. `patterns` (`MerchantPattern`, `src/types.ts`) already carry S-05 decisions: merged components grouped
  under the root, `type = pinnedType ?? d5Type(amounts)`, `excluded`, `displayName` as `name`. `rows`
  (`PatternSource`) carry `id`, `amountMinor` (positive grosze), `occurredOn`, counterparty, title.
- **Helpers to reuse.** `src/lib/patterns/over-limit.ts` `referenceMonth(rows)` (latest month in the data — the
  maintainer-bound meaning of „w tym miesiącu”), `monthOf`, `byOccurredThenId` (numeric id tiebreak).
  `src/lib/patterns/view.ts` has private `patternTxs(pattern, byId)` / `indexById(rows)` — the join from a pattern's
  `transactionIds` to its rows. `src/lib/format.ts` has `formatMoney` („52,99 zł”), `formatIsoDate` („20.05.2026”),
  `plural`; **no signed-delta formatter** and **no previous-month helper**.
- **Page shape to copy.** `src/pages/patterns.astro`: `createClient` → `loadPatternData` → error branch
  (`console.error` + `PageTitle` + `InlineAlert kind="error"` with `copy.components.error`, `DESIGN-GAP: K18`) → empty
  branch (`ViewEmpty`) → content.
- **Shared UI.** `PageTitle.astro`, `Panel.astro`, `InlineAlert.astro`, `ViewEmpty.astro`,
  `src/components/patterns/merchant-mark.ts` (`merchantMark` class string), `src/components/app/Badge.tsx` (tones
  `fixed | frequent | excess`; header: „Further tones (`new` / `changed`) arrive with S-06”).
  `ExcludedPatterns.astro` shows the list-in-panel shape (`rounded-xl border border-line bg-paper px-5`, rows with
  `border-b … last:border-b-0`) and why `Panel`'s `p-[22px]` is not overridden.
- **Kit.** `design/rytm-os/prototype/app.js` `fixedCosts()`: `.dash-title` (eyebrow „Koszty stałe”, h1 „Co zmieniło
  się samo?”, lead) + three `section.fixed-section` („Zmieniły kwotę”, „Nowe w tym miesiącu”, „Bez zmian”), each
  `.section-label` (h2 17 px + count 12 px muted) over a `.fixed-list.panel` (padding 0 20) of `.fixed-row` (min-height
  70, border-bottom line): changed row = `.merchant` (mark + `strong` 13 px + `small` 11 px muted „20.05.2026 ·
  poprzednio 49,00 zł”) + `.fixed-change` (`span` amount, `b` 13 px amber-dark „+6,00 zł”); new row = `small`
  „pierwsze wystąpienie · 15.05.2026”, amount + `badge('nowy','new')`; „Bez zmian” = `.panel.compact` (min-height 55),
  mark + name + amount. ≤ 560 px: `.fixed-list{padding:0 14px}`, `.fixed-row{gap:12px}`, `.fixed-change` column,
  `align-items:end`, gap 4. Badge `.badge.new` = `#EFE4D1` / amber-dark (K9, `brand.css` `.rytm-badge--new`).
- **Copy present.** `copy.fixedCosts.{title,changed,new,unchanged}`, `copy.components.new` („nowy”),
  `copy.emptyViews.fixed.*`, `copyExtra.fixed.{eyebrow,lead}`. Row copy („poprzednio”, „pierwsze wystąpienie ·”,
  „N pozycje”) exists only in `app.js`. Next free gap ids: **K23**, **G34** (`context/foundation/design-kit.md`).
- **Fixture.** `scripts/fixture-ing.mjs` `TRAP_SERIES` T11 `kinoteka`: `monthly(17, [4999 × 6, 5599 × 6])` (rise
  2026-03). At the fixture's reference month 2026-08 **no fixed pattern changes amount**; T16 `silownia-ruch` is the
  only new one; `kurs-przyklad.pl` and `phu-przyklad` are lapsed. `npm run fixture:check` compares the committed bytes
  with `generate()` output. Fixture consumers: `scripts/fixture-ing-check.mjs`, `scripts/fixture-ing-shape.mjs`
  (local only, structure), `test/unit/ing-parser.test.ts` (sum `6497147` twice), `test/unit/patterns.test.ts` (oracle
  groups from `expected.json`, `KINOTEKA` `fixedAmountMinor` 5299). Smoke and pgTAP do not read it.
- **Smoke user state** (`scripts/smoke.mjs` `steps`): before „import is saved…” no import; at „patterns list the
  re-imported merchant” one May-2026 import („Sklep smoke” 12,99 zł 2026-05-04, „Kawiarnia smoke” 45,50 zł
  2026-05-20); at „later import keeps the exclusion” plus June (Sklep 12,99 06-04, Piekarnia 8,00 06-10, Kawiarnia
  47,00 06-20), with Sklep merged into Kawiarnia, which is pinned `fixed`, renamed „Kawiarnia Rytm” and **excluded**;
  at „unmerged pattern has its own detail again” Kawiarnia is restored and unmerged. So after the last one R = 2026-06,
  P = 2026-05: „Kawiarnia Rytm” changed 45,50 → 47,00 (+1,50 zł), „Sklep smoke” unchanged, „Piekarnia smoke” new — the
  existing run already exercises every section; no new payload is needed.
- **Baseline** (agent contract, `main` `3706508`; vitest and fixture re-observed on this branch at plan time): lint 0 ·
  astro check 0 errors (120 files) · fixture:check OK · vitest 190 (11 files) · build OK · pgTAP 102 (5 files) · smoke
  111 PASS.

## Desired End State

- `/fixed` for an account with transactions shows the kit title block and three sections. „Zmieniły kwotę”: one row
  per fixed pattern whose amount changed this month — date of the changing charge, „poprzednio <amount>”, the new
  amount and a signed delta (rise `+6,00 zł` in `excess-text`, decrease `−4,00 zł` in `green`). „Nowe w tym
  miesiącu”: fixed patterns charged this month and not in the previous calendar month — „pierwsze wystąpienie ·
  <date>”, amount, badge „nowy”. „Bez zmian”: the rest charged this month, compact. Each section shows its count
  („1 pozycja”, „2 pozycje”, „5 pozycji”); an empty section shows a muted line.
- With no transaction in the previous month, „Nowe w tym miesiącu” shows „Nie ma poprzedniego miesiąca do porównania.”
  and no pattern carries „nowy”.
- Excluded, frequent and lapsed (not charged this month) patterns appear in no section. An account with no
  transactions keeps the pre-import view; a failed read shows the error line.
- On the synthetic fixture: `kinoteka` 17.08.2026 · poprzednio 55,99 zł → 59,99 zł, `+4,00 zł`; `silownia-ruch` new
  (05.08.2026, 129,00 zł); `kawa-testowa.pl`, `muzykalnia`, own transfer unchanged.
- Verified by: vitest +1 file (and cases in `format` / `over-limit` tests), smoke +10, fixture:check on the
  regenerated fixture, screenshots of every named state.

### Key Discoveries:

- The smoke user's existing two imports already produce a change, a new pattern, an unchanged one, an excluded one and
  a one-month state at known steps — `/fixed` smoke is pure GETs inserted between existing steps.
- A double charge in R where the first charge carries the rise and the second repeats it: „last vs immediately
  previous” would call it unchanged. The rule below reports **the latest change among R's occurrences**, so a rise
  inside R is never hidden (refines research case (a)).
- Fixture option B keeps `KINOTEKA`'s median at 5299 (4999 × 6, 5599 × 5, 5999 × 1 → middle pair 4999 / 5599), max
  gap 700 ≤ tolerance 1000 → still `fixed`; only `ing-parser.test.ts`'s sum moves (+400).
- `/fixed` is SSR Astro with no island, so `>text<` anchors are safe for text rendered as one inline expression; the
  pre-import title and every row string must be emitted as a single string per element.

## What We're NOT Doing

- No `/patterns` status badges `nowy` / `zmiana kwoty` (G28 stays open; follow-up) and no `changed` Badge tone (nothing
  renders it).
- No `/home` stat card „Koszty stałe · N pozycje podrożały” (S-07 consumes `fixedOverview`).
- No change to D5 typing (`d5Type`) or to pattern typing on `/fixed` only: a rise beyond tolerance that flips a pattern
  to `frequent` drops it from `/fixed` (`[human]` row 4.10); one-off merchants count as fixed (follow-up).
- No lapsed-patterns section, no month picker, no month label, no row link to the pattern detail (kit rows are not
  links), no dismiss / „seen” state, no migration, no pgTAP change.
- No hand edit of generated fixture files; no change to `scripts/smoke.mjs` payloads.

## Implementation Approach

Four small phases, each independently green on the full local gate and committed on green by a fresh agent: the
fixture change alone (F-02 oracle) → the pure rule with unit tests on crafted rows and the fixture (no UI) → the
`/fixed` page with the „Zmieniły kwotę” and „Bez zmian” sections (two new components) → the „Nowe w tym miesiącu”
section, the no-comparison message, the `new` Badge tone, follow-ups and the seam sweep (no new component). Baseline
for every delta: lint 0 · astro check 0 errors (120 files) · fixture:check OK · vitest 190 (11 files) · build OK ·
pgTAP 102 (5 files) · smoke 111 PASS. Each phase re-measures its own starting point and writes `baseline + delta`.

Local gate (every phase):

```bash
npm run lint && npx astro check && npm run fixture:check && npm test && npm run build
npx supabase db reset && npx supabase test db
ASTRO_DEV_BACKGROUND=1 npx astro dev --port 4398 --ignore-lock &   # then
BASE_URL=http://localhost:4398 npm run smoke                        # then: lsof -ti :4398 | xargs kill
```

(Docker / `127.0.0.1:54321` commands run with the sandbox disabled; never port 4321.)

## Critical Implementation Details

- **The rule, exactly.** R = `referenceMonth(rows)` over the full read; P = `previousMonth(R)`; `hasComparison` =
  some row (any pattern, any type, excluded or not) has `monthOf(occurredOn) === P`. Candidates = patterns with `type
  === "fixed"`, `!excluded`, and ≥ 1 occurrence in R. Order a candidate's occurrences with `byOccurredThenId`.
  **New** = `hasComparison` and 0 occurrences in P (D6) — wins over changed. **Changed** = otherwise, some occurrence
  in R has a predecessor (the occurrence directly before it, in any month) with a different amount; report the
  **latest** such occurrence: its date, its amount, the predecessor's amount, delta = amount − predecessor (signed).
  **Unchanged** = the remaining candidates. Everything else is in no section. Without a comparison month nothing is
  new; those patterns fall through to changed / unchanged.
- **Row values.** Changed: the reported occurrence (above). New: date of the **first** occurrence in R (kit „pierwsze
  wystąpienie”), amount of the **latest** occurrence in R. Unchanged: amount of the latest occurrence in R. Section
  order = the order of `patterns` (derivePatterns: sum desc, name, key) — deterministic, no second sort.
- **Single-string rendering.** Meta lines (`„20.06.2026 · poprzednio 45,50 zł”`, `„pierwsze wystąpienie ·
  10.06.2026”`), amounts, deltas, counts and the empty / no-comparison lines are each built as one string (template
  helper) and rendered as the only child of their element, so smoke's `>text<` anchors match. The element's
  `{expr}` stays on the same line as its opening and closing tag — `eslint --fix` (eslint-plugin-prettier) wraps
  long elements onto three lines, and Astro then emits `<tag> text </tag>` (the `InlineAlert` trap, agent contract);
  check the served HTML (`curl`) before asserting. If the formatter insists on wrapping, assert the bare text instead
  (`/fixed` has no island, so no serialized-props false positive) and keep each positive / negative pair (plan
  review F1).

## Phase 1: Fixture — an in-tolerance price change in the reference month

### Overview

Give T11 `kinoteka` a second step 55,99 → 59,99 zł on 2026-08-17 through the generator, regenerate, and prove every
fixture consumer stays green. No app code changes.

### Changes Required:

#### 1. Generator

**File**: `scripts/fixture-ing.mjs`

**Intent**: The one importable file must show US-04's headline case in its reference month (roadmap S-06 risk).

**Contract**: `TRAP_SERIES` T11 entry `entries: monthly(17, [...Array(6).fill(4999), ...Array(5).fill(5599), 5999])`;
its comment names both rises (2026-03 +12%, 2026-08 +4,00 zł, both inside D5 tolerance, median 5299); `TRAPS.T11`
label becomes „Abonament z dwiema podwyżkami (~12%, potem +4 zł)” (expectation text unchanged: „jeden wzorzec fixed
przy D5”). `expectType: "fixed"` stays.

#### 2. Regenerated fixture

**Files**: `test/fixtures/ing/*` (generated — `npm run fixture:ing`; never edited by hand)

**Contract**: the diff touches only kinoteka's 2026-08 row amount, the main CSV preamble debit sum, `expected.json`
(that row's `amountMinor`, `files[MAIN].imported.sumMinor` 6497147 → 6497547, the kinoteka pattern's `sumMinor`) and
`README.md` (T11 label). `medianMinor` of kinoteka stays 5299.

#### 3. Test and doc ripple

**Files**: `test/unit/ing-parser.test.ts`, `context/foundation/import-formats.md`

**Contract**: both `6497147` assertions → `6497547`. The fixture note „abonament z jedną podwyżką ~12%” → names the
second, in-tolerance rise in the last month (the fixture's „zmiana kwoty” case for S-06). `test/unit/patterns.test.ts`
unchanged (KINOTEKA 5299 holds).

### Success Criteria:

#### Automated Verification:

- `npm run fixture:ing` then `git diff --stat test/fixtures/ing` shows only `Lista_transakcji_nr_0000123456_010926.csv`, `expected.json`, `README.md`; `npm run fixture:check` OK
- `npm test` — 190 (11 files), delta 0; `ing-parser.test.ts` and `patterns.test.ts` green (KINOTEKA `fixedAmountMinor` 5299 unchanged)
- `npm run lint` 0 errors; `npx astro check` 0 errors (120 files, delta 0); `npm run build` passes
- `npx supabase db reset && npx supabase test db` — 102 (delta 0); `BASE_URL=http://localhost:4398 npm run smoke` — 111 PASS (delta 0)
- Deliberate break (drift): change the T11 last amount in the generator to 6099 **without** regenerating → `npm run fixture:check` FAILs naming the main CSV / `expected.json`; restored → OK. Meta-check: proves the committed bytes are tied to the generator, not that 5999 is right
- Deliberate break (tolerance): set the T11 last amount to 6400 and run `npm run fixture:ing` into a scratch copy (or run and `git checkout test/fixtures/ing`) → the generator's `expectType` assertion throws (median 5299, gap 1101 > 1000 → `frequent`); restored → regenerates identically to the committed files. Meta-check: proves kinoteka's `fixed` type is guarded at generation, so the fixture cannot silently lose its change case to the D5 flip
- `grep -rn "6497147" test src` empty

#### Manual Verification:

- [reviewer] The generated-file diff contains only the kinoteka 2026-08 amount and its derived totals / label (no id, date or ordering drift); no generated file was edited by hand

**Implementation Note**: proceed on green automated criteria.

---

## Phase 2: `fixedOverview` — the pure change / new rule

### Overview

The DB-free rule and its formatter helpers, unit-tested on crafted rows and on the fixture. No caller yet — the app is
unchanged.

### Changes Required:

#### 1. Month helper

**File**: `src/lib/patterns/over-limit.ts`

**Contract**: `previousMonth(yearMonth: string): string` beside `monthOf` — calendar predecessor (`2026-01` →
`2025-12`), plain arithmetic on the string, no `Date` / time zone.

#### 2. Shared joins

**File**: `src/lib/patterns/view.ts`

**Intent**: One join from a pattern to its rows, not a copy in the new module.

**Contract**: `patternTxs` and `indexById` become exported (signatures unchanged); header comment mentions the S-06
consumer.

#### 3. The rule

**File**: `src/lib/patterns/fixed.ts` (new)

**Intent**: FR-012 / US-04 / D6 as one pure function over the same read `/patterns` uses, exported for S-07's
`/home` stat card.

**Contract**:

```ts
export interface FixedChangedRow { key: string; name: string; occurredOn: string; amountMinor: number;
  previousMinor: number; deltaMinor: number }
export interface FixedNewRow { key: string; name: string; firstOccurredOn: string; amountMinor: number }
export interface FixedUnchangedRow { key: string; name: string; amountMinor: number }
export interface FixedOverview { referenceMonth: string | null; comparisonMonth: string | null;
  hasComparison: boolean; changed: FixedChangedRow[]; new: FixedNewRow[]; unchanged: FixedUnchangedRow[] }
export function fixedOverview(patterns: readonly MerchantPattern[], rows: readonly PatternSource[]): FixedOverview
```

Rule and row values exactly as in Critical Implementation Details. No rows → `referenceMonth: null`,
`comparisonMonth: null`, `hasComparison: false`, three empty arrays. Header comment cites FR-012, US-04 AC, D6, the
maintainer binding („w tym miesiącu” = latest month in the data), the double-charge rule and that excluded / lapsed /
frequent patterns are in no section.

#### 4. Signed delta formatter

**File**: `src/lib/format.ts`

**Contract**: `formatSignedMoney(minor: number): string` — `600` → „+6,00 zł”, `-400` → „−4,00 zł” (U+2212 minus, the
kit prints a typographic sign), `0` → „0,00 zł”; built on `formatMoney(Math.abs(minor))`.

#### 5. Unit tests

**Files**: `test/unit/fixed-overview.test.ts` (new), `test/unit/format.test.ts`, `test/unit/over-limit.test.ts`

**Contract**: crafted `MerchantPattern` + `PatternSource` literals (as `pattern-view.test.ts` builds them), R =
2026-08, P = 2026-07 unless stated:

1. US-04 rise in tolerance: 07-20 4300, 08-20 4900 → `changed` `{ occurredOn: "2026-08-20", amountMinor: 4900,
   previousMinor: 4300, deltaMinor: 600 }`; not in `new` / `unchanged`.
2. Decrease: 07 5599, 08 5099 → `changed`, `deltaMinor` −500.
3. Unchanged: 07 2499, 08 2499 → `unchanged` `{ amountMinor: 2499 }` only.
4. Double charge, rise on the first: 07 4300, 08-01 4900, 08-20 4900 → `changed` reported at 08-01 (+600).
5. Double charge, rise on the second: 07 4300, 08-01 4300, 08-20 4900 → `changed` at 08-20 (+600).
6. Up then down inside R: 07 4300, 08-01 4900, 08-20 4300 → `changed` at 08-20 (−600, the latest change).
7. New: only 08-05 12900, user has other rows in 07 → `new` `{ firstOccurredOn: "2026-08-05", amountMinor: 12900 }`.
8. New wins: 05 3900, 08 4500, nothing in 06–07 for this pattern, user has rows in 07 → `new`, not `changed`.
9. No comparison month (gap): user rows in 05 and 08 only → `hasComparison: false`, `comparisonMonth` "2026-07",
   `new` empty; a pattern 05 3900 / 08 4500 → `changed` (+600); a pattern only in 08 → `unchanged`.
10. One month of data: all rows in 08 → `hasComparison: false`, `new` empty, every candidate `unchanged`.
11. Excluded fixed pattern with a rise → in no section; `frequent` pattern with a rise → in no section; a pattern whose
    amounts are out of tolerance but `type: "fixed"` (pinned) → reported.
12. Lapsed: fixed pattern last charged 06 → in no section.
13. No rows → `referenceMonth: null`, empty sections.
14. Same-day tiebreak: ids `"9"` (4300) and `"10"` (4900) on 08-20, predecessor 07 4300 → numeric order, change at id
    `"10"` (+600); shuffled input → identical output.
15. Section order follows `patterns` order.
16. F-02 fixture (rows via `parseIngStatement` + `buildImportPayload` as `patterns.test.ts` `fixtureSources`,
    `derivePatterns` without decisions): R "2026-08", `hasComparison: true`; `changed` = exactly KINOTEKA `{ occurredOn:
    "2026-08-17", amountMinor: 5999, previousMinor: 5599, deltaMinor: 400 }`; `new` = exactly the T16 pattern (first
    occurrence 2026-08-05, 12900); `unchanged` = the T04 `kawa-testowa.pl`, T10 `muzykalnia` and T08 own-transfer
    patterns; the T04 `kurs-przyklad.pl` and T19 `phu-przyklad` patterns in no section (identify groups by name /
    transaction ids the way `patterns.test.ts` does).

`format.test.ts`: `formatSignedMoney` for 600, −400, 0, 123456 („+1234,56 zł”, pl-PL does not group 4 digits).
`over-limit.test.ts`: `previousMonth` for „2026-08”, „2026-01”, „2026-10”.

### Success Criteria:

#### Automated Verification:

- `npm test` — 190 + the new cases, 12 files, 0 failures (record the total)
- `npm run lint` 0 errors; `npx astro check` 0 errors (record the count; +2 expected: `fixed.ts`, `fixed-overview.test.ts`)
- `npm run fixture:check` OK; `npm run build` passes
- `npx supabase db reset && npx supabase test db` — 102 (delta 0); `BASE_URL=http://localhost:4398 npm run smoke` — 111 PASS (delta 0)
- Deliberate break (D6 window): make „new” mean „no occurrence before R” instead of „none in P” → case 8 FAILs; restored → green. Meta-check: case 7 stays green, so the red proves the P-only window, not new-detection itself
- Deliberate break (double charge): compare only the last occurrence with its predecessor → case 4 FAILs; restored → green. Meta-check: cases 1 and 5 stay green, so the red isolates the „latest change among R's occurrences” rule
- Deliberate break (exclusion): drop the `!excluded` filter → case 11's excluded pattern appears; restored → green. Meta-check: the frequent twin stays out, so the red is the exclusion filter, not the type filter
- Deliberate break (comparison): set `hasComparison` to `true` always → cases 9 and 10 FAIL; restored → green. Meta-check: the fixture case 16 stays green (it has a P), so the red proves the gap-month / one-month guard

#### Manual Verification:

- [reviewer] `fixed.ts` imports only from `over-limit.ts`, `view.ts` and `@/types` (no DB, no copy); the header comment states the rule, the double-charge choice and the no-comparison definition; `patternTxs` is not duplicated

**Implementation Note**: proceed on green automated criteria.

---

## Phase 3: `/fixed` view — „Zmieniły kwotę” and „Bez zmian”

### Overview

The page reads the data, keeps the pre-import view and the error line, and renders the kit title block plus the
changed and unchanged sections through two new components. The „Nowe” section follows in Phase 4.

### Changes Required:

#### 1. Section

**File**: `src/components/fixed/FixedSection.astro` (new)

**Intent**: Kit `.fixed-section` + `.section-label` + `.fixed-list.panel` with an empty line.

**Contract**: props `{ title: string; count: string; empty: string; compact?: boolean; hasRows: boolean }` + default
slot for rows. `<section>` mt/mb 22; label row (flex, space-between, mb 9): `<h2>` 17 px, tracking −0.03em, `<span>`
12 px `text-muted` with `count`. List wrapper: panel look (`rounded-xl border border-line bg-paper`) with `px-5`,
`max-[559px]:px-[14px]` (the `ExcludedPatterns` wrapper shape — not `Panel`, whose `p-[22px]` cannot be overridden
reliably). `hasRows` false → one `<p>` (13 px `text-muted`, py 18) with `empty` as its only child instead of the slot.

#### 2. Row

**File**: `src/components/fixed/FixedRow.astro` (new)

**Intent**: Kit `.fixed-row` for all three sections.

**Contract**: props `{ name: string; meta?: string; amount: string; compact?: boolean }` + default slot (the delta
or, in Phase 4, the badge). Row: flex, space-between, items-center, `min-h-[70px]` (`compact` → `min-h-[55px]`),
`border-b border-line last:border-b-0`, `max-[559px]:gap-3`. Left: `.merchant` — `<span class:list={merchantMark}
aria-hidden="true">` first character of `name` (as `ExcludedPatterns`), then `<div>` with `<strong>` 13 px `name` and,
when `meta`, `<small>` block 11 px `text-muted` mt 4. Right (`.fixed-change`): flex items-center gap 14 with `<span>`
`amount` and the slot; ≤ 559 px column, `items-end`, gap 4. Compact rows render just the amount on the right.

#### 3. Page

**File**: `src/pages/fixed.astro`

**Intent**: Real data instead of the unconditional placeholder.

**Contract**: `createClient` → `loadPatternData` (unconfigured client → error branch, as `patterns.astro`) →
`fixedOverview(patterns, rows)`.

- Error: `console.error("fixed costs failed", error)`; `PageTitle` (eyebrow `copyExtra.fixed.eyebrow`, title
  `copy.fixedCosts.title`, lead `copyExtra.fixed.lead`) + `InlineAlert kind="error"` `copy.components.error` with the
  `DESIGN-GAP: K18` comment.
- `referenceMonth === null` (no transactions): today's `PageTitle` + `ViewEmpty`, unchanged.
- Otherwise: `PageTitle` (eyebrow, `copy.fixedCosts.title`, lead), then `FixedSection` „Zmieniły kwotę”
  (`copy.fixedCosts.changed`; rows `FixedRow` with `meta` = `x.previously` filled with `formatIsoDate(occurredOn)` and
  `formatMoney(previousMinor)`, `amount` = `formatMoney(amountMinor)`, slot `<b>` 13 px `formatSignedMoney(deltaMinor)`
  in `text-excess-text` for a rise, `text-green` for a decrease — `DESIGN-GAP: G34` comment on the decrease colour;
  empty `x.changedEmpty`) and `FixedSection compact` „Bez zmian” (`copy.fixedCosts.unchanged`; name + amount; empty
  `x.unchangedEmpty`). Count strings: `x.count` filled with `n` and `plural(n, x.itemForms)`.
- Header comment: kit `fixedCosts()`, FR-012 / US-04, `fixedOverview`, the „Nowe” section arriving in Phase 4.

#### 4. Copy and gap register

**Files**: `src/content/copy.ts`, `context/foundation/design-kit.md`

**Contract**: `copyExtra.fixed` gains

- under `// DESIGN-GAP: K23` — verbatim from `prototype/app.js` `fixedCosts()`: `itemForms: ["pozycja", "pozycje",
  "pozycji"]` (kit renders the first two; the third completes the Polish tuple), `count: "{n} {items}"`, `previously:
  "{date} · poprzednio {amount}"`.
- under `// DESIGN-GAP: G34` — placeholders: `changedEmpty: "Żaden koszt stały nie zmienił kwoty w tym miesiącu."`,
  `unchangedEmpty: "Brak kosztów stałych bez zmian w tym miesiącu."`.

`design-kit.md`: **K23** (row copy and section counts of „Koszty stałe” rendered only in `app.js`; the kit's „3
pozycje” over two rows is a kit inconsistency — the app prints the real count); **G34** („Koszty stałe” states the kit
does not define: empty section line, decrease sign and colour — `−` U+2212 in `green` vs the kit's amber rise, rows not
links, no month label, read error via K18; placeholder · S-06 faza 3); **G5** status amended („S-06: wdrożone —
`/fixed` na danych”); K23 / G34 appended to „Do rundy 3”.

#### 5. Smoke

**File**: `scripts/smoke.mjs`

**Contract**: inserted into the existing run (GETs only; header comment mentions `/fixed`):

1. after „home renders empty state for signed-in user”: „fixed shows the pre-import view” — GET `/fixed` → 200
   contains `>Koszty stałe pojawią się po pierwszym imporcie.<`, notContains `>Zmieniły kwotę<`.
2. after „patterns list the re-imported merchant” (May only): „fixed with one month lists no change” — GET `/fixed`
   → 200 contains `>Żaden koszt stały nie zmienił kwoty w tym miesiącu.<`.
3. same position: „fixed with one month lists unchanged patterns” — contains `>Kawiarnia smoke<` and `>Bez zmian<`.
4. after „unmerged pattern has its own detail again” (May + June): „fixed lists a changed amount” — contains
   `>+1,50 zł<` and notContains `>Żaden koszt stały nie zmienił kwoty w tym miesiącu.<` (negative control for step 2).
5. same position: „fixed shows the previous amount” — contains `>20.06.2026 · poprzednio 45,50 zł<` and `>Kawiarnia
   Rytm<`.
6. next to the anonymous steps: „fixed without a session goes to login” — GET `/fixed` → 302 `/login`.

### Success Criteria:

#### Automated Verification:

- `npm run lint` 0 errors; `npx astro check` 0 errors (record the count; +2 expected: the two components)
- `npm test` — Phase 2 count, 0 failures (delta 0)
- `npm run fixture:check` OK; `npm run build` passes
- `npx supabase db reset && npx supabase test db` — 102 (delta 0)
- `BASE_URL=http://localhost:4398 npm run smoke` — 111 + 6 = 117 PASS
- Deliberate break (delta): render the delta with `formatMoney(deltaMinor)` instead of `formatSignedMoney` → „fixed lists a changed amount” FAILs while „fixed shows the previous amount” PASSes; restored → PASS. Meta-check: proves the signed formatter reaches the page, not merely that the row renders
- Deliberate break (pre-import): drop the `referenceMonth === null` branch (always render the sections) → „fixed shows the pre-import view” FAILs; restored → PASS. Meta-check: step 2 stays green, so the red is the no-data branch, not the page
- No raw colours in the new components and the page (`grep -nE "#[0-9a-fA-F]{3,6}\b|\[#"` empty); every new key carries `DESIGN-GAP: K23` / `G34`; `design-kit.md` has rows K23, G34 and the amended G5

#### Manual Verification:

- [reviewer] Every string from `copy` / `copyExtra`; K23 byte-for-byte with `prototype/app.js` `fixedCosts()`; only G34 placeholders new; colours only via `ink` / `paper` / `muted` / `line` / `excess-text` / `green`; `merchantMark` reused, no new primitive

**Implementation Note**: proceed on green automated criteria; screenshots happen in the Visual step after Phase 4.

---

## Phase 4: „Nowe w tym miesiącu”, no-comparison message, follow-ups and seam sweep

### Overview

The middle section with the kit „nowy” badge, the one-month / gap-month message instead of new rows, the excluded
smoke proof, the follow-ups file and the seam sweep. No new component.

### Changes Required:

#### 1. Badge tone

**File**: `src/components/app/Badge.tsx`

**Contract**: tone `new` = `bg-excess/25 text-excess-text` — the kit `.badge.new` `#EFE4D1` / amber-dark has no token;
this is the same mapping `InlineAlert` uses for the kit's near-identical `#f0e3d8` error tint (K9 / G34 note). Header
comment: `new` added by S-06; `changed` stays unimplemented until the `/patterns` badges (G28).

#### 2. Page

**File**: `src/pages/fixed.astro`

**Contract**: between the two sections, `FixedSection` „Nowe w tym miesiącu” (`copy.fixedCosts.new`): rows
`FixedRow` with `meta` = `x.firstSeen` filled with `formatIsoDate(firstOccurredOn)`, `amount` = `formatMoney
(amountMinor)`, slot `<Badge tone="new">{copy.components.new}</Badge>` (static SSR, no `client:` directive); empty =
`hasComparison ? x.newEmpty : x.noComparison`; count from the rows. Header comment's Phase-4 note removed.

#### 3. Copy and gap register

**Files**: `src/content/copy.ts`, `context/foundation/design-kit.md`

**Contract**: K23 block gains `firstSeen: "pierwsze wystąpienie · {date}"` (verbatim `app.js`); G34 block gains
`newEmpty: "Brak nowych kosztów stałych w tym miesiącu."` and `noComparison: "Nie ma poprzedniego miesiąca do
porównania."` (the PRD US-04 AC wording). G34 row extended: no-comparison message replaces the new list (defined as „no
transaction of the user in the previous calendar month”, covering one month of data and a gap month), lapsed fixed
patterns shown nowhere, `new` badge token mapping; K9 note „S-06: `Badge` tone `new` → `excess`/25 + `excess-text`”.

#### 4. Follow-ups

**File**: `context/changes/fixed-cost-changes/follow-ups/review-fixes.md` (new)

**Contract**: one entry each, with a `Trigger:` line:

- D5 flip hides an out-of-tolerance rise from `/fixed` (FR-012 „niezależnie od tolerancji”; mitigation S-05 pin) —
  Trigger: `[human]` 4.10 answered „must show” or product feedback.
- One-off merchants are D5-fixed and list as „nowy” on real data (`d5Type` single occurrence) — Trigger: product
  feedback or S-07's stat card.
- `/patterns` status badges `nowy` / `zmiana kwoty` (G28) from `fixedOverview` + a `changed` Badge tone — Trigger:
  next change to `/patterns`.
- S-07 `/home` „Koszty stałe · N pozycje podrożały” = `fixedOverview(...).changed.filter(r => r.deltaMinor > 0)` —
  Trigger: S-07.

#### 5. Seam sweep

**Intent**: Nothing half-migrated leaves the branch.

**Contract**: over every file this change touched: no duplicated helper or class string introduced by two phases
(the list-panel wrapper classes of `ExcludedPatterns` and `FixedSection`, the merchant-mark markup of `FixedRow` and
`ExcludedPatterns`, any inline sign / money formatting next to `formatSignedMoney`, any second copy of `patternTxs` /
month arithmetic) — extract to a shared constant / helper or record why not; no stale comment (`fixed.astro`,
`Badge.tsx`, `view.ts`, `fixed.ts`, `fixture-ing.mjs` T11, `smoke.mjs` header); no stale kit row (G5, G28, G34, K9,
K23 agree with what renders); no unused export.

#### 6. Smoke

**File**: `scripts/smoke.mjs`

**Contract**:

1. after Phase 3's step 3 (May only): „fixed without a previous month says so” — GET `/fixed` → 200 contains `>Nie ma
   poprzedniego miesiąca do porównania.<` (the `x.noComparison` string) and notContains `>nowy<` (AC: not
   „wszystko jest nowe”).
2. after „later import keeps the exclusion” (Kawiarnia excluded): „fixed hides an excluded pattern” — contains
   `>Piekarnia smoke<`, notContains `>Kawiarnia Rytm<` (Phase 3 step 5 is the positive control after the restore).
3. after Phase 3's step 5: „fixed marks a new pattern” — contains `>pierwsze wystąpienie · 10.06.2026<` and `>nowy<`.
4. same position: „fixed compares with the previous month” — notContains `>Nie ma poprzedniego miesiąca do
   porównania.<` (negative control for step 1).

### Success Criteria:

#### Automated Verification:

- `npm run lint` 0 errors; `npx astro check` 0 errors (record the count; delta 0 expected)
- `npm test` — Phase 3 count, 0 failures (final: baseline 190 + the S-06 cases, 11 + 1 files)
- `npm run fixture:check` OK; `npm run build` passes
- `npx supabase db reset && npx supabase test db` — 102 (delta 0 over the baseline, 5 files)
- `BASE_URL=http://localhost:4398 npm run smoke` — 117 + 4 = 121 PASS (+10 over the baseline 111)
- Deliberate break (message): render `x.newEmpty` regardless of `hasComparison` → „fixed without a previous month says so” FAILs while „fixed compares with the previous month” PASSes; restored → PASS. Meta-check: proves the message follows `hasComparison`, not that it renders
- Deliberate break (exclusion reaches the page): drop the `!excluded` filter in `fixedOverview` → „fixed hides an excluded pattern” FAILs (and unit case 11); restored → PASS. Meta-check: „fixed marks a new pattern” stays green, so the red is the exclusion, not the read
- Seam-sweep greps: `grep -rn "Further tones" src` empty; `grep -rnE "#[0-9a-fA-F]{3,6}\b|\[#"` over `src/components/fixed`, `src/pages/fixed.astro`, `src/components/app/Badge.tsx` empty; `grep -rn "DESIGN-GAP: G34\|DESIGN-GAP: K23" src` matches only `copy.ts`, `fixed.astro` and `Badge.tsx` (the `new` tone mapping is a G34 item — plan review F2)

#### Manual Verification:

- [reviewer] Seam sweep done: duplicated helpers / classes extracted or justified, stale comments and kit rows (G5, G28, G34, K9, K23) match the code, the follow-ups file lists every item with a `Trigger:`
- [human] Product owner confirms decision 7 (against FR-012's literal „niezależnie od tolerancji”): a fixed pattern whose rise leaves the D5 tolerance turns `frequent` and drops off `/fixed` instead of being listed under „Zmieniły kwotę”; mitigation = pin the type (S-05); reversal = typing candidates on pre-R history in `fixed.ts` only
- [visual] Screenshots, desktop 1440 px and mobile ~400 px, on `astro dev --port 4399` with freshly registered local accounts (never the seeded `test@rytm.local`): `fixed-pre-import` (no import), `fixed-overview` (synthetic ING fixture imported — changed, new and unchanged rows), `fixed-no-comparison` (one month of data: message in „Nowe”, empty „Zmieniły kwotę” line), `fixed-gap-month` (two months with an empty month between), `fixed-decrease` (two crafted months via `POST /api/imports` with a price drop — green `−` delta), `fixed-double-charge` (two charges in the reference month), `fixed-excluded` (fixture account with `kinoteka` excluded — its row gone, empty „Zmieniły kwotę” line), `fixed-no-fixed` (account whose patterns are all frequent or excluded — three empty lines), `fixed-read-error` (only if reachable without leaving the local DB mutated — else a documented `db reset` in the same step), `fixed-long-name` (a long merchant name at 400 px, stacked `.fixed-change`)
- [visual] Fixture US-04 walk-through on screen: `kinoteka` „17.08.2026 · poprzednio 55,99 zł”, 59,99 zł, „+4,00 zł”; `silownia-ruch` „pierwsze wystąpienie · 05.08.2026”, 129,00 zł, „nowy”; `kurs-przyklad.pl` and `phu-przyklad` absent; counts match the rows

**Implementation Note**: the Visual step performs the `[visual]` rows; `[human]` stays open on the post-run checklist.

---

## Testing Strategy

### Unit Tests:

- `test/unit/fixed-overview.test.ts` — rise / decrease / unchanged, double charge (three orders), new, new-wins,
  gap-month and one-month comparison, excluded / frequent / pinned / lapsed, empty read, id tiebreak and shuffle,
  section order, and the F-02 fixture (kinoteka +400, T16 new, lapsed absent).
- `test/unit/format.test.ts` — `formatSignedMoney`; `test/unit/over-limit.test.ts` — `previousMonth`.
- `test/unit/ing-parser.test.ts` — the regenerated sum.

### Integration Tests:

- Smoke (+10): pre-import view, one-month state (no change, unchanged rows, no-comparison message, no „nowy”), excluded
  pattern hidden, two-month state (signed delta, previous amount, new row with badge, comparison present), anonymous
  redirect.
- `npm run fixture:check` on the regenerated fixture (bytes = generator, D5 types, D6/T16).

### Manual Testing Steps:

1. `npx supabase start`; `ASTRO_DEV_BACKGROUND=1 npx astro dev --port 4399 --ignore-lock`.
2. Register a fresh local account; `/fixed` shows the pre-import view.
3. Import the synthetic fixture (`npm run fixture:ing`); `/fixed` shows kinoteka +4,00 zł, silownia-ruch „nowy”, three
   unchanged rows; lapsed patterns absent.
4. Exclude kinoteka from its detail („Akcje” → „Wyklucz z analizy”); `/fixed` drops it. Kill the server
   (`lsof -ti :4399 | xargs kill`).

## Performance Considerations

One extra pure pass over the already-read rows (index by id, per-pattern sort of its own rows). No new query.

## Migration Notes

None — nothing new is stored. The fixture change is committed generated output; archived S-03 / S-04 / S-05 documents
quoting the old sum `6497147` are historical and not edited.

## References

- Research: `context/changes/fixed-cost-changes/research.md`; identity: `change.md`
- PRD: `context/foundation/prd.md` (FR-012, US-04, Success Criteria primary 2); `context/foundation/import-formats.md`
  (D5, D6, fixture note)
- Read / helpers: `src/lib/patterns/load.ts` `loadPatternData`, `src/lib/patterns/derive.ts` `derivePatterns` /
  `d5Type`, `src/lib/patterns/over-limit.ts` `referenceMonth` / `monthOf` / `byOccurredThenId`,
  `src/lib/patterns/view.ts` `patternTxs` / `indexById` / `listOverview`
- Page precedent: `src/pages/patterns.astro`; components `src/components/patterns/ExcludedPatterns.astro`,
  `src/components/patterns/merchant-mark.ts`, `src/components/app/Badge.tsx`
- Fixture: `scripts/fixture-ing.mjs` `TRAP_SERIES` (T11), `TRAPS`, `scripts/fixture-ing-check.mjs`
- Kit: `design/rytm-os/prototype/app.js` `fixedCosts()`, `badge`; `design/rytm-os/prototype/styles.css`
  `.fixed-section`, `.section-label`, `.fixed-list`, `.fixed-row`, `.fixed-change`, `.compact`, `.badge.new`
- Format example: `context/archive/2026-09-28-durable-pattern-decisions/plan.md`

## Autonomous decisions

Made by the plan step of run `2026-09-28-s05-s06-s07` in place of asking a human.

1. **Fixture option B** (T11 second step 5599 → 5999 on 2026-08-17), in its own phase. Rejected A (move the rise:
   changes the asserted median 5299 and archived screenshot values) and crafted-rows-only (roadmap risk: unverifiable
   on the importable file). Would change: the maintainer wanting the fixture's R change to mirror the PRD's ~12% example.
2. **Candidates = `type === "fixed"`, not excluded, ≥ 1 occurrence in R** (R = latest month in the data, maintainer
   binding). Would change: the maintainer revising „w tym miesiącu”.
3. **Changed = the latest occurrence in R whose amount differs from its immediate predecessor (any month)** —
   refines research's „last vs immediately previous”, which would call a double charge with the rise on the first
   charge „unchanged”. Rejected: last-vs-predecessor (hides a rise inside R), last-in-R vs last-before-R (ignores a
   change between two R charges). Would change: the kit author defining a double-charge row.
4. **New = charged in R, none in P, and a comparison month exists; new wins over changed; sections disjoint** (D6
   literal; kit shows a pattern once). Would change: the kit adding a combined „nowy + zmiana” row.
5. **No comparison month = no transaction of the user in P** (covers one month of data and a gap month); then nothing is
   new and patterns fall to changed / unchanged; the message replaces the new list. Rejected: „only one month of data”
   (a gap month would mark everything new, which the AC forbids). Would change: the PRD stating the one-month rule only.
6. **Lapsed fixed patterns (none in R) appear nowhere** („Bez zmian” implies charged this month). Would change: the kit
   adding a lapsed section.
7. **D5 flip accepted — against FR-012's literal „niezależnie od tolerancji”** → `[human]` row 4.10. A rise beyond
   tolerance turns the pattern `frequent` and it leaves `/fixed`. Rejected: typing `/fixed` candidates on pre-R history
   (`/fixed` and `/patterns` would disagree on a pattern's type). Why: one typing rule across views; US-04's own example
   is in tolerance; pin (S-05) is the user's remedy. Would change: the product owner answering „must show” (then
   `fixed.ts` adds pre-R-typed candidates to „Zmieniły kwotę” only).
8. **One-off merchants listed as new (D5: one occurrence = fixed)** accepted as a follow-up, not changed here (ripples
   into S-03–S-05). Would change: product feedback after real imports.
9. **Row values:** changed = the reported occurrence; new = first date in R, latest amount in R; unchanged = latest
   amount in R. Would change: the kit showing the median instead.
10. **Section order = `patterns` order** (sum desc, name, key). Rejected: by delta (a second sort rule to test). Would
    change: usability feedback wanting the biggest rise first.
11. **All three sections always render; an empty section shows a muted line (G34); no dedicated „no fixed pattern”
    state.** Rejected: hiding empty sections (the headline section vanishing reads as a bug). Would change: the kit
    drawing empty sections.
12. **Decrease = „−” (U+2212) in `green`; rise `+` in `excess-text`** (G34). Rejected: amber for both (a drop is not a
    warning). Would change: the kit defining the decrease colour.
13. **Badge: only the `new` tone, `bg-excess/25 text-excess-text`** (InlineAlert's mapping of the kit's near-identical
    tint); no `changed` tone (nothing renders it). Would change: G28 being taken up.
14. **G28 `/patterns` badges deferred** (one view + global tokens) → follow-up. Would change: the maintainer asking to
    fold it in.
15. **No month label, rows not links, no dismiss state, no migration** (kit has none). Would change: kit additions.
16. **Module `src/lib/patterns/fixed.ts`, exported for S-07; `patternTxs` / `indexById` exported from `view.ts`**
    rather than copied. Would change: S-07 needing a different shape.
17. **Smoke reuses the existing smoke user's May / June imports** — they already hold a change (+1,50 zł), a new, an
    unchanged, an excluded and a one-month state. Rejected (research): a new two-month payload. Would change: the S-05
    steps being reordered.
18. **Gap ids: K23 (verbatim kit row copy) and G34 (states)**, landing with the code in Phases 3–4 (S-05 decision 22).
    Would change: the orchestrator requiring gap rows at plan time.
19. **Four phases; ≤ 2 new components (Phase 3); smoke split 6 / 4; the fixture phase alone.** Would change: a phase
    not independently green (merge it with the next).
20. **Decision → PRD literal:** only decision 7 contradicts the PRD's literal text and carries the `[human]` row.
    Decision 5 widens the AC's one-month case (it still satisfies it). Would change: the plan review reading decision 3
    as contradicting „względem ostatniego wystąpienia”.

## Known risks

- **D5 flip** hides the exact case US-04 cares about when a rise is large (`[human]` 4.10, follow-up).
- **One-off merchants** will crowd „Nowe w tym miesiącu” on real statements; the fixture's generator asserts T16 is the
  only new pattern, so the fixture cannot show it.
- **Astro check file count** is recorded, not asserted — only the error delta gates.
- **Smoke text anchors**: every asserted string must be the only child of its element (single-string rendering); the
  pre-import title already is (`PageTitle` `<h1>{title}</h1>`).
- **Badge `new` tint** (plan review F5): `bg-excess/25` over `paper` ≈ `#E7DCCA` vs the kit's `#EFE4D1`; `/20` would be
  closer (≈ `#E9E0D0`) but `/25` keeps one mapping with `InlineAlert`'s error tint. The visual step compares against
  the kit; a mismatch is a G34 note, not a new token.

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Fixture — an in-tolerance price change in the reference month

#### Automated

- [x] 1.1 `npm run fixture:ing`; generated diff only in the main CSV, `expected.json`, `README.md`; `npm run fixture:check` OK — e0d8e4d
- [x] 1.2 `npm test` — 190 (11 files), delta 0; `ing-parser.test.ts` and `patterns.test.ts` green (KINOTEKA 5299 unchanged) — e0d8e4d
- [x] 1.3 `npm run lint` 0; `npx astro check` 0 errors (120 files, delta 0); `npm run build` passes — e0d8e4d
- [x] 1.4 `npx supabase db reset && npx supabase test db` — 102 (delta 0); smoke 111 PASS (delta 0) — e0d8e4d
- [x] 1.5 Deliberate break (generator changed without regenerating) → `fixture:check` FAILs; restored → OK; meta-check recorded — e0d8e4d
- [x] 1.6 Deliberate break (T11 last amount 6400) → generator `expectType` assertion throws; restored → identical regeneration; meta-check recorded — e0d8e4d
- [x] 1.7 `grep -rn "6497147" test src` empty — e0d8e4d

#### Manual

- [ ] 1.8 [reviewer] Generated diff limited to kinoteka's 2026-08 amount and derived totals / label; nothing hand-edited

### Phase 2: `fixedOverview` — the pure change / new rule

#### Automated

- [x] 2.1 `npm test` — 190 + the new cases, 12 files, 0 failures (total recorded) — 213 passed, 12 files
- [x] 2.2 `npm run lint` 0; `npx astro check` 0 errors (count recorded) — 122 files, 0 errors
- [x] 2.3 `npm run fixture:check` OK; `npm run build` passes
- [x] 2.4 `npx supabase db reset && npx supabase test db` — 102 (delta 0); smoke 111 PASS (delta 0)
- [x] 2.5 Deliberate break (new = no occurrence before R) → case 8 FAILs; restored → green; meta-check recorded
- [x] 2.6 Deliberate break (last occurrence vs predecessor only) → case 4 FAILs; restored → green; meta-check recorded
- [x] 2.7 Deliberate break (`!excluded` filter dropped) → case 11 FAILs; restored → green; meta-check recorded
- [x] 2.8 Deliberate break (`hasComparison` always true) → cases 9, 10 FAIL; restored → green; meta-check recorded

#### Manual

- [ ] 2.9 [reviewer] `fixed.ts` pure (imports only `over-limit.ts`, `view.ts`, `@/types`); header states the rule, double-charge choice, no-comparison definition; `patternTxs` not duplicated

### Phase 3: `/fixed` view — „Zmieniły kwotę” and „Bez zmian”

#### Automated

- [ ] 3.1 `npm run lint` 0; `npx astro check` 0 errors (count recorded)
- [ ] 3.2 `npm test` — Phase 2 count, 0 failures (delta 0)
- [ ] 3.3 `npm run fixture:check` OK; `npm run build` passes
- [ ] 3.4 `npx supabase db reset && npx supabase test db` — 102 (delta 0)
- [ ] 3.5 `BASE_URL=http://localhost:4398 npm run smoke` — 111 + 6 = 117 PASS
- [ ] 3.6 Deliberate break (unsigned delta) → „fixed lists a changed amount” FAILs, „fixed shows the previous amount” PASSes; restored → PASS; meta-check recorded
- [ ] 3.7 Deliberate break (no pre-import branch) → „fixed shows the pre-import view” FAILs; restored → PASS; meta-check recorded
- [ ] 3.8 No raw colours in new components / page; `DESIGN-GAP: K23` / `G34` on every new key; rows K23, G34 and amended G5 in `design-kit.md`

#### Manual

- [ ] 3.9 [reviewer] Strings from `copy` / `copyExtra`; K23 byte-for-byte with `fixedCosts()`; only G34 placeholders new; allowed colour names only; `merchantMark` reused, no new primitive

### Phase 4: „Nowe w tym miesiącu”, no-comparison message, follow-ups and seam sweep

#### Automated

- [ ] 4.1 `npm run lint` 0; `npx astro check` 0 errors (count recorded)
- [ ] 4.2 `npm test` — Phase 3 count, 0 failures (final: 190 + the S-06 cases, 12 files)
- [ ] 4.3 `npm run fixture:check` OK; `npm run build` passes
- [ ] 4.4 `npx supabase db reset && npx supabase test db` — 102 (delta 0, 5 files)
- [ ] 4.5 `BASE_URL=http://localhost:4398 npm run smoke` — 117 + 4 = 121 PASS (+10 over the baseline 111)
- [ ] 4.6 Deliberate break (message ignores `hasComparison`) → „fixed without a previous month says so” FAILs, „fixed compares with the previous month” PASSes; restored → PASS; meta-check recorded
- [ ] 4.7 Deliberate break (`!excluded` filter dropped) → „fixed hides an excluded pattern” FAILs; restored → PASS; meta-check recorded
- [ ] 4.8 Seam-sweep greps: no „Further tones”; no raw colours in `src/components/fixed`, `fixed.astro`, `Badge.tsx`; `DESIGN-GAP: G34` / `K23` only in `copy.ts`, `fixed.astro`, `Badge.tsx`

#### Manual

- [ ] 4.9 [reviewer] Seam sweep: duplicated helpers / classes extracted or justified; stale comments and kit rows (G5, G28, G34, K9, K23) match the code; follow-ups file lists every item with a `Trigger:`
- [ ] 4.10 [human] Product owner confirms decision 7 (against FR-012 „niezależnie od tolerancji”): an out-of-tolerance rise flips the pattern to `frequent` and leaves `/fixed`; remedy = pin
- [ ] 4.11 [visual] Screenshots desktop 1440 px + mobile ~400 px: `fixed-pre-import`, `fixed-overview`, `fixed-no-comparison`, `fixed-gap-month`, `fixed-decrease`, `fixed-double-charge`, `fixed-excluded`, `fixed-no-fixed`, `fixed-read-error`, `fixed-long-name`
- [ ] 4.12 [visual] Fixture US-04 walk-through: kinoteka +4,00 zł vs 55,99 zł, silownia-ruch „nowy” 05.08.2026, lapsed patterns absent, counts match rows
