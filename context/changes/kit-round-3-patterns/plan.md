# Patterns, pattern detail and the actions dialog on kit round 3 (S-14) — Implementation Plan

## Overview

Bind `/patterns`, `/patterns/<key>` and the pattern actions dialog to design kit round 3: kit column order (Kwota
before Suma, `tableHeaders` gone), status badges „nowy” / „zmiana kwoty” in the „Ponad progiem” cell, „Pokaż więcej”
applied after search and sort, the kit toolbar field (8 px, `--rytm-focus-ring`), one shared `focusRing` and
`fieldBox`, the detail copy rebind with a plural-aware sequence label on `role="img"`, the kit not-found and
no-occurrences states, the dialog copy and rename field (F5: the derived name is never prefilled), and the kit
round-3 `.modal` geometry for all three dialogs. Presentation only: `parseThresholdValue`, `parseDisplayName` (limit
100), `validateMerge`, the decision/threshold endpoints and their redirect params stay the same. No migration.

## Current State Analysis

Source: `research.md` (§1–§6, Code References) and `change.md` (claims table, follow-ups), re-checked in this step
against `src/` and `design/rytm-os/`. Anchors are symbols.

- `src/pages/patterns.astro` reads `copyExtra.patterns` (`eyebrow`, `sortPrefix`, `typeLabels`, `footer`,
  `patternForms`, `thresholdCount`, `thresholdSum`, `openPattern`, `upload`, `decisionError`) into `tableCopy`;
  `listOverview` runs in an IIFE with **no `try`** (a `patternTxs` id drift is a 500). `home.astro` has the single
  `try` → `console.error` + `copy.components.error` pattern to copy.
- `src/components/patterns/PatternsTable.tsx`: header `DESIGN-GAP: G28` (badges omitted, „Pokaż więcej” is S-14);
  `<thead>` maps `tableHeaders(copy.columns)` (`src/lib/patterns/table-columns.ts` `BODY_ORDER` 0,1,2,4,3,5,6); body
  renders Suma before Kwota; search/sort in one `useMemo` (`visible`); footer counts `visible.length`; local
  `focusRing` = `outline-none focus-visible:ring-[3px] focus-visible:ring-ink/15`.
- `src/components/app/field-styles.ts` `field`: `rounded-lg` (= 14 px via `--radius-lg`), `focus-within:ring-ink/8`,
  `DESIGN-GAP: G29`. Importers: `PatternsTable.tsx`, `MonthSelect.tsx` only.
- `src/components/app/Badge.tsx`: tones `fixed`/`frequent`/`excess`/`new` (`bg-excess/25`), no `changed`,
  `DESIGN-GAP: G34` comment. Importers: `PatternsTable.tsx`, `[...key].astro`, `fixed.astro`.
- `src/pages/patterns/[...key].astro`: reads ~30 `copyExtra.patterns` leaves; not-found = 404 + `InlineAlert` info
  `detailMissing` (`DESIGN-GAP: G31`); month without occurrences = `<p>` `monthEmpty`; sequence summary is an
  `sr-only` span (`SequenceMark` spans are already `aria-hidden`) filled from `x.sequenceSummary` with `{n}` = all
  occurrences; merged variants render under the heading (`mergedLabel` + per-variant `unmerge` form); decision
  results arrive as page params (`merged`, `unmerged`, `typed`, `renamed`, `excluded`, `restored`,
  `error=merge|name|decision`) and render as `decisionAlert`.
- `src/components/patterns/PatternActionsDialog.tsx`: one dialog, in-place reveals (`revealed` state), local
  `fieldBox` (G32 comment), merge button **disabled** with `mergeNone` text when no targets, rename input
  `maxLength={100}` `defaultValue={name}` where `name = decision?.displayName ?? topVariant(...)` (F5: an untouched
  save freezes the derived name). `PatternActionsCopy` carries only dialog strings, never result lines (smoke rule).
- `src/components/ui/dialog.tsx` `DialogContent`: `rounded-[13px] p-[31px] max-w-[480px] w-[calc(100%-40px)]
  max-h-[calc(100vh-32px)] overflow-auto`; close button carries its own ink/15 focus classes. Importers:
  `PatternActionsDialog`, `DeleteImportDialog`, `DeleteAccountDialog` (none passes `className`).
- Kit `prototype/app.js` `patternDetail()`: merged variants sit at the bottom of the transactions panel (h3
  „Połączone nazwy”); the sequence is `role="img"` with an aria-label pluralising **both** counts; no occurrences =
  `.no-occurrences` (info icon 18 + `noOccurrences`) and `p.muted` „Brak transakcji do pokazania w wybranym
  miesiącu.” (literal, no key); not-found = `section.panel.view-empty` h1 + p + „Wróć do wzorców” CTA.
- Kit `styles.css` round 3: `.modal{padding:26px}`, `.modal-backdrop{padding:16px}`, `.no-occurrences{min-height:120px;
  display:flex;align-items:center;justify-content:center;gap:10px;color:muted;font-size:14px}`.
- `vitest.config.ts` includes `test/unit/**/*.test.ts` only (no `.tsx`); no test renders a component yet.
  `react-dom/server` `renderToStaticMarkup` with `createElement` works in the node environment.
- Register `context/foundation/design-kit.md`: last K id `K34`, last G id `G38`.
- Smoke (`scripts/smoke.mjs`): raw-HTML `contains`/`notContains`, `location` prefix; island props serialize the same
  strings, so island content is matched as `>text<`. The smoke user's `/patterns` shows at most 2 table rows at any step (May import:
  Sklep + Kawiarnia; the June import that adds Piekarnia lands only after the merge — plan review F1); the demo account has no
  transactions in `supabase/seed.sql`.

## Desired End State

- `/patterns`: columns Sprzedawca | Typ | Wystąpienia | Kwota | Suma | Próg | Ponad progiem read straight from
  `copy.patterns.columns`; „Ponad progiem” cell = excess value (or „—”) then a „nowy” / „zmiana kwoty” badge for
  fixed patterns `fixedOverview` marks new / changed in the reference month; the first 10 rows of the filtered,
  sorted list, with „Pokaż więcej” in the table foot when more match; the count line counts the whole filtered list;
  toolbar fields 8 px with a 3 px ink/12 focus-within ring; an assembly error renders `copy.components.error`, never a 500.
- `/patterns/<key>`: all copy from `copy.patternDetail` / `copy.threshold` / `copy.patternActions` except the keys
  recorded as gaps; the sequence is a `role="img"` with a plural-aware label „{within} {forms} w ramach progu, {over}
  {forms} ponad próg”; a month without occurrences shows the kit `.no-occurrences` block and the kit transactions line;
  an unknown key renders the kit not-found panel (h1, body, „Wróć do wzorców” CTA) with status 404; merged variants
  under „Połączone nazwy” at the bottom of the transactions panel, per-variant „Cofnij scalenie” kept.
- Actions dialog: kit eyebrow/title/lead; merge section = „Scal wzorce” heading + `mergeLead` + „Wzorzec” select +
  „Scal wzorce” button, or the `mergeEmpty` info panel + disabled button; rename section = „Zmień nazwę wzorca”
  heading + „Nowa nazwa” field with the current name as placeholder and only a stored `displayName` as value + hint +
  „Zapisz”. Decision results: `renamed` „Nazwa wzorca zmieniona.”, `error=name` „Nazwa może mieć maksymalnie 100
  znaków.”, `error=merge` „Nie można scalić tych wzorców.”, `error=decision` `patternActions.saveError`.
- All three dialogs: padding 26 px (≤ 559 px: 22/18 px, radius 12 px), width `calc(100% - 32px)` up to 480 px.
- `copyExtra.patterns` keeps only leaves with a reader and a gap note (§1.2 of research + the new K35–K37 literals).

### Key Discoveries:

- `fixedOverview(patterns, rows)` takes exactly `dataResult.patterns` / `dataResult.rows`, which `patterns.astro`
  already holds — badges need no second read (`change.md` decision 2 holds).
- Radix `DialogContent` is not server-rendered while closed: dialog content is provable only by visual + reviewer
  rows, never smoke. Decision result lines are page-rendered and smoke-provable.
- The island's SSR render of `PatternsTable` is plain React: `renderToStaticMarkup(createElement(PatternsTable, …))`
  in a `.test.ts` file proves column order, badges and paging without a DOM library or a config change.
- `focusRing` keeps ink/15 (the kit has no `:focus-visible` rule) — consolidating it is a zero-visual change.

## What We're NOT Doing

- No endpoint or rule change: `src/pages/api/patterns/{decision,threshold,threshold/delete}.ts`, `validateMerge`
  (S-05 F6 excluded-source merge stays open), `unmerge` scoping (F7), `parseThresholdValue`, `parseDisplayName`
  (100, not the kit's `renameMaxLength` 60 — K31); no migration, RLS or pgTAP change.
- No kit separate modal views for merge/rename and no in-dialog error after a redirect: errors stay page alerts
  (decision 4).
- No toast component (page alerts replace kit toasts, S-04 decision 15).
- `fixed.astro` `try` and `/fixed` layout (S-15); `home.astro` `monthIndex` (S-15).
- `Panel.astro` radius 20 vs kit 12 and `PatternsTable` `rounded-xl` (app-wide radius decision, out of scope).
- `patterns.merchantMark`, `components.excluded`, `patternActions.mergeForms`, `patternDetail.monthNames`,
  `patternDetail.thresholdError/thresholdInvalid`, `patternActions.error*`, `renameMaxLength` stay unread (K30/K31/K32).
- Editing anything under `design/rytm-os/` or `src/styles/brand.css`; `npm run format`.

## Implementation Approach

Eight small phases, each green on its own, each deleting the `copyExtra.patterns` leaves whose last reader it
rebinds (a `grep` proves no reader is left). List first (P1 columns + list copy + `try`, P2 badges, P3 „Pokaż
więcej”), then the shared field/focus consolidation (P4), the detail page (P5 copy + sequence, P6 states + merged
variants), the dialog (P7), and the register + seam sweep + visual gate (P8). The shared `DialogContent` geometry rides
with the other shared class changes in P4 (plan review F2); its screenshots are P8 row 8.7. No phase adds more than one new UI component
(none needs one: `ViewEmpty` is extended, not duplicated). Every phase measures the baseline on the branch before
editing and reports `baseline + delta`.

## Critical Implementation Details

**„Pokaż więcej” order of operations.** Filter → sort → slice, in that order, inside `PatternsTable`. The count line
uses the filtered list length, never the slice. The button shows when `filtered.length > PAGE_SIZE` and the list is
not expanded; clicking sets `expanded = true` and reveals the rest of the **same** sorted, filtered list (never the
kit's `showMorePatterns()`, which re-renders in data order). A new search or sort keeps `expanded` as it is. The SSR
render shows the same first page. Extract the slice as a pure helper so it is unit-tested apart from React.

**Status badge source.** Build `Map<key, "new" | "changed">` from one `fixedOverview(dataResult.patterns,
dataResult.rows)` call inside the same `try` as `listOverview` (`new` wins over `changed`, as `fixedOverview`
already decides). Pass the status on each island row; the island never computes it.

**Rename field (F5).** `value` = the stored `displayName` (`dataResult.decisions.get(pattern.key)?.displayName`),
empty when `null`; `placeholder` = the shown name. An untouched save then writes what is already stored (or `null`
→ no override), never the derived name. An emptied field still clears the override (`renameHint`).

**Island strings vs smoke.** Result-line strings (`renamed`, `renameLong`, `mergeInvalid`, `saveError`, `merged`, …)
must not enter `PatternActionsCopy` or `PatternsTableCopy`, otherwise a bare-text smoke needle is satisfied by the
serialized props. Rendered island text asserted by smoke must render without wrapping whitespace (`>text<`).

**Sequence label.** `role="img"` + `aria-label` on the sequence container; the `sr-only` span goes. `within =
count − over`; both counts take `occurrenceForms` (kit `app.js`), no trailing full stop.

## Phase 1: Kit column order, list copy and the `/patterns` error boundary

### Overview

Swap the body cells to kit order, read the kit headers directly, delete `tableHeaders`, rebind the list-page copy
that has identical kit keys, and wrap the list assembly in a `try`. No new UI component.

### Changes Required:

#### 1. Column order

**File**: `src/components/patterns/PatternsTable.tsx`, `src/lib/patterns/table-columns.ts` (delete),
`test/unit/table-columns.test.ts` (delete), `test/unit/kit-contract.test.ts`

**Intent**: K17 / F-04 follow-up — the body follows the kit order, so the header mapping goes.

**Contract**: `<thead>` maps `copy.columns` as given; body cells Sprzedawca, Typ, Wystąpienia, Kwota
(`fixedAmountMinor` or „—”), Suma, Próg, Ponad progiem, arrow. `kit-contract.test.ts` „keeps 7 pattern table
columns…” rewritten without `tableHeaders` (7 labels, kit order, Kwota index 3, Suma index 4). The header comment
drops the „Pokaż więcej is S-14” clause only when P3 lands (keep G28 for badges until P2).

#### 2. Render test

**File**: `test/unit/patterns-table.test.ts` (new)

**Intent**: Prove the rendered table, which smoke cannot (the serialized props carry every label in kit order).

**Contract**: `renderToStaticMarkup(createElement(PatternsTable, { patterns, copy }))` with a fixed fixture; asserts
the `<th>` order and that a fixed row's Kwota cell precedes its Suma cell. Later phases add cases to this file.

#### 3. List copy and error boundary

**File**: `src/pages/patterns.astro`, `src/components/patterns/ExcludedPatterns.astro`, `src/content/copy.ts`

**Intent**: Rebind identical-text leaves (research §1.1) and stop a pure-assembly throw from becoming a 500
(`fixed-cost-changes` follow-up).

**Contract**: `x.eyebrow` → `copy.app.patternsLong`; `x.patternForms` → `copy.patterns.countForms` (table copy and
`ExcludedPatterns`); `excludedToggle` → `copy.patterns.excluded` wherever read. `listOverview` (and, from P2,
`fixedOverview`) run inside one `try`; `catch` → `console.error("patterns list failed", …)` + the existing error
branch (`copy.components.error`). Delete the leaves whose last reader moved (`eyebrow`, `patternForms`,
`excludedToggle` — grep first; `decisionError` stays until P7).

### Success Criteria:

#### Automated Verification:

- `npm test`: baseline − the `table-columns.test.ts` cases + the new render cases, 0 failed
- Smoke baseline PASS, 0 FAIL (Δ0; `>Ponad progiem<` still green)
- `grep -rn "tableHeaders\|table-columns" src test` empty; no reader left for the deleted `copyExtra.patterns` leaves
- Deliberate break: swap the Kwota/Suma cells back → the render test red, restored; meta-check recorded (the props-only smoke needle stays green, which is why the render test exists)
- Deliberate break: throw inside the `try` in `patterns.astro` → `GET /patterns` as the test user answers 200 with `copy.components.error`, not 500; restored
- Full local gate vs baseline (lint, astro check, fixture:check, vitest, build, pgTAP Δ0, smoke Δ0)

#### Manual Verification:

- [reviewer] Body and header order match kit `patternRows()`; the `try` wraps assembly only, not the read

---

## Phase 2: Status badges and the Badge tones

### Overview

Kit `badge(p.status)` in the „Ponad progiem” cell, driven by `fixedOverview` on the data already loaded; `Badge`
gains `changed` and both tones move to `--rytm-badge-soft`. No new UI component.

### Changes Required:

#### 1. Badge tones

**File**: `src/components/app/Badge.tsx`

**Intent**: S-06 follow-ups (G28 `changed` tone, `new` tint vs kit) — one tint for both, the kit token.

**Contract**: `tone` adds `"changed"`; `new` and `changed` = `bg-excess/18 text-excess-text` (= `--rytm-badge-soft`
/ `--rytm-excess-text`); the G34 comment rewritten to name the round-3 token, no `DESIGN-GAP` left for this tint.
`/fixed` „nowy” changes tint 25 → 18 % (intended).

#### 2. Status per row

**File**: `src/lib/patterns/status.ts` (new, pure), `src/pages/patterns.astro`,
`src/components/patterns/PatternsTable.tsx`, `test/unit/pattern-status.test.ts` (new),
`test/unit/patterns-table.test.ts`

**Intent**: Each fixed pattern new / changed in the reference month carries its status to the island.

**Contract**: `patternStatuses(overview: ReturnType<typeof fixedOverview>): Map<string, "new" | "changed">`
(`new` wins). `patterns.astro` calls `fixedOverview(dataResult.patterns, dataResult.rows)` inside the P1 `try` and
passes rows as `PatternListItem & { status: "new" | "changed" | null }` (the row type lives with the island props).
`PatternsTableCopy` gains `statusLabels: { new: string; changed: string }` = `copy.components.new` / `.changed`.
Cell: excess value or „—”, then `<Badge tone={status}>` with a small gap (kit inline order). Drop the badge clause
of the G28 header comment.

### Success Criteria:

#### Automated Verification:

- `npm test`: Phase 1 count + new `pattern-status` and badge render cases, 0 failed
- Smoke Phase 1 count PASS, 0 FAIL (Δ0 — badge presence depends on data; the render test proves it)
- `grep -n "G28" src/components/patterns/PatternsTable.tsx` mentions only „Pokaż więcej” (until P3)
- Deliberate break: `patternStatuses` returns an empty map → status test red; `PatternsTable` ignores `status` → render test red; restored; meta-check recorded
- Full local gate vs baseline, smoke Δ0

#### Manual Verification:

- [reviewer] One `fixedOverview` call on the same `loadPatternData` result; no second read; colors via Tailwind names only

---

## Phase 3: „Pokaż więcej”

### Overview

The kit table-foot button, applied after search and sort. No new UI component.

### Changes Required:

#### 1. List view helper

**File**: `src/lib/patterns/list-view.ts` (new, pure), `test/unit/patterns-list-view.test.ts` (new)

**Intent**: Search, sort and the page limit become one tested function, so the order of operations is a unit
assertion rather than React state.

**Contract**: `export const PATTERNS_PAGE_SIZE = 10`; `listView<T extends PatternListItem>(rows: readonly T[], term:
string, sort: "sum" | "count" | "name", expanded: boolean): { shown: T[]; total: number; hasMore: boolean }` —
filter (case-insensitive substring of `name`), then the existing stable sort (sum desc, count desc, name
`localeCompare("pl")`), then slice; `total` = filtered length; `hasMore` = `!expanded && total > 10`. The logic moves
out of the `useMemo` in `PatternsTable.tsx` unchanged. Cases: 9 / 10 / 11 rows; expanded; empty; 12 rows where the
only search match is last by sum → `shown` holds it, `total` 1, `hasMore` false; sort by name over 12 rows → the
first 10 by name, not by input order.

#### 2. Table foot

**File**: `src/components/patterns/PatternsTable.tsx`, `src/pages/patterns.astro`, `test/unit/patterns-table.test.ts`

**Intent**: Roadmap outcome „Pokaż więcej” without changing sorting or sums (roadmap Risk).

**Contract**: `useState(false)` `expanded`; `useMemo(() => listView(patterns, term, sort, expanded))`; footer count
reads `total`. Foot = count span + (when `hasMore`) `<Button variant="ghost">` with `copy.showMore` (=
`copy.patterns.showMore`, new `PatternsTableCopy` field), text rendered with no surrounding whitespace; click sets
`expanded`. Kit `.table-foot` ≤ 559 px stacking exists (`max-[559px]:flex-col`); add the kit gap 13 px. G28 leaves
the `PatternsTable.tsx` header. Render test: 12 rows → 10 `<tr>` in `<tbody>`, the button, count line „12 …”.

#### 3. Smoke

**File**: `scripts/smoke.mjs`

**Contract**: +1 `patterns list shows no Pokaż więcej for a short list` — `notContains: ">Pokaż więcej<"` on
`/patterns` as the test user, placed right after `patterns table keeps the Ponad progiem header` (2 rows there:
Sklep smoke + Kawiarnia smoke, before the merge).

### Success Criteria:

#### Automated Verification:

- `npm test`: Phase 2 count + list-view and render cases, 0 failed
- Smoke Phase 2 count + 1 PASS, 0 FAIL
- `grep -n "G28" src/components/patterns/PatternsTable.tsx` empty
- Deliberate break: `PATTERNS_PAGE_SIZE = 1` → the new smoke step red (button rendered for the 2 rows) and list-view tests red; restored; meta-check recorded (needle is the rendered node, not the serialized `showMore` prop; a size ≥ 2 would leave the step green — plan review F1)
- Deliberate break: slice before filtering in `listView` → the last-by-sum search case red; restored
- Full local gate vs baseline, smoke + 1

#### Manual Verification:

- [reviewer] Count line counts the filtered list; reveal keeps the current sort; search keeps `expanded`

---

## Phase 4: Toolbar field, one focus ring, one field box, dialog geometry

### Overview

Kit `.search-field` / `.select-field` round 3 (8 px, `--rytm-focus-ring`), plus the two consolidations the
follow-ups ask for: one `focusRing` export (value unchanged) and one `fieldBox` export (S-12 F1, S-04 F11, S-05 F4),
and the shared `DialogContent` on the kit round-3 `.modal` (S-12 F2) with the close glyph on `Glyph` (S-01 F9, whose
trigger is "the dialog-geometry change"). Merged here by the plan review: every item is a shared class-string change
with smoke Δ0, `dialog.tsx` is already open for the close-button `focusRing`, and the screenshots of the two
non-pattern dialogs are taken in the final phase anyway. No new UI component.

### Changes Required:

#### 1. Toolbar field

**File**: `src/components/app/field-styles.ts`

**Intent**: G29 closes — the kit now draws the focus-within rule.

**Contract**: `field`: `rounded-lg` → `rounded-[8px]`; `focus-within:ring-ink/8` → `focus-within:ring-ink/12` (=
`--rytm-focus-ring`); add `focus-within:text-ink` (kit `color: var(--ink)`); comment cites the kit rule, no
`DESIGN-GAP: G29`. Readers: `PatternsTable.tsx`, `MonthSelect.tsx` (pattern views only).

#### 2. Shared focus ring and field box

**File**: `src/components/app/field-styles.ts`, `src/components/ui/button.tsx`, `src/components/app/BackLink.astro`,
`src/components/patterns/PatternsTable.tsx`, `src/components/ui/dialog.tsx`, `src/components/patterns/ThresholdEditor.tsx`,
`src/components/patterns/PatternActionsDialog.tsx`, `src/components/patterns/merchant-mark.ts`

**Intent**: S-04 F3 — one source for the ink/15 focus ring; one source for the 8 px `paper` form box.

**Contract**: `export const focusRing = "outline-none focus-visible:ring-[3px] focus-visible:ring-ink/15"` (value
byte-identical to today's classes; the kit has no `:focus-visible` rule, so no visual change); `buttonVariants`
base, `BackLink`, `PatternsTable` (local const removed) and the dialog close button compose it via `cn()`.
`export const fieldBox = "rounded-[8px] border border-line bg-paper focus-within:border-ink focus-within:ring-[3px]
focus-within:ring-ink/8"` (kit `.field input:focus` = ink/8, `--rytm-field` = paper); `ThresholdEditor` input-suffix
box and the dialog's local `fieldBox` compose it; both G32 comments go. `merchant-mark.ts` comment: `bg-paper-soft`
= `--rytm-merchant-mark` (no longer „nearest”). `BackLink`'s „G29 precedent” comment and `patterns.astro`'s „G28” comment are rewritten to name the shared export / the final state (the `G2x` greps stay meaningful).

#### 3. Pins

**File**: `test/unit/kit-contract.test.ts`

**Contract**: + cases: `field` contains `rounded-[8px]` and `focus-within:ring-ink/12`; `focusRing` contains
`focus-visible:ring-ink/15`; `buttonVariants()` contains every `focusRing` class; `fieldBox` contains `rounded-[8px]`
and `bg-paper`.

#### 4. Dialog geometry and close glyph

**File**: `src/components/ui/dialog.tsx`, `test/unit/kit-contract.test.ts`

**Intent**: S-12 F2 — kit `.modal{padding:26px}`, `≤560px{padding:22px 18px;width:100%;border-radius:12px}`,
`.modal-backdrop{padding:16px}`; S-01 F9 — one icon component.

**Contract**: export `dialogContentClass` (the class string `DialogContent` composes): `p-[26px]`,
`w-[calc(100%-32px)] max-w-[480px]`, `rounded-[13px]`, `max-[559px]:px-[18px] max-[559px]:py-[22px]
max-[559px]:rounded-[12px]`; `max-h-[calc(100vh-32px)] overflow-auto` kept. The close button's inline `<svg><use
…#close>` becomes `<Glyph name="close" size={17} className="block" />` (same markup, `Glyph` already renders
`rytm-icon` + `aria-hidden`). kit-contract pins `p-[26px]`, `max-[559px]:px-[18px]`, `max-[559px]:py-[22px]`,
`w-[calc(100%-32px)]`. Close button position unchanged.

### Success Criteria:

#### Automated Verification:

- `npm test`: Phase 3 count + the new kit-contract cases, 0 failed
- Smoke Phase 3 count PASS, 0 FAIL (Δ0)
- `grep -rn "G29\|G32" src` empty; `grep -rn "focus-visible:ring-ink/15" src` matches only `field-styles.ts`
- Deliberate break: `field` back to `rounded-lg` → kit-contract red; restored; meta-check recorded (pins the token, not the pixels — visual row 8.6 / 8.7 covers pixels)
- Deliberate break: dialog padding back to `p-[31px]` → the dialog pin red; restored; meta-check recorded (pins classes; visual row 8.7 proves the three dialogs)
- Full local gate vs baseline, smoke Δ0

#### Manual Verification:

- [reviewer] `buttonVariants` / `BackLink` / dialog close render the same class set as before (focus ring unchanged site-wide); `ui/` importing from `app/field-styles` noted as accepted; no dialog importer passes a `className` that fights the new padding

---

## Phase 5: Detail copy rebind and the sequence label

### Overview

Rebind the detail page and threshold editor to `patternDetail.*` / `threshold.*`, and move the sequence summary to
a plural-aware `role="img"` label. No new UI component.

### Changes Required:

#### 1. Copy rebind

**File**: `src/pages/patterns/[...key].astro`, `src/content/copy.ts`, `test/unit/kit-contract.test.ts`

**Intent**: Research §1.1/§1.3 — identical-text leaves to kit keys; `threshold.invalid` adopted (decision 6).

**Contract**: `sumLabel` → `fillMonthLocative(copy.patternDetail.sumLabel, month, x.monthsLocative)`; `typeLeads` →
`copy.patternDetail.typeFixed/typeFrequent`; `thresholdPanel/Active/None` → `copy.threshold.title/activeLabel/
noThreshold`; `editorCopy.valueLabel` → `{ amount: copy.threshold.amount, count: copy.threshold.count }`, `suffix` →
`{ money: copy.threshold.unitCurrency, count: copy.threshold.unitCount }`, `saving` → `copy.threshold.saving`;
`occurrencesPanel` → `copy.patternDetail.monthSelect`; `sequenceWithin` → `copy.patternDetail.sequenceWithin`;
`resultAlert` `error=value` → `copy.threshold.invalid`, `error=save` → `copy.threshold.saveError`. Delete the leaves
whose last reader moved (grep). `kit-contract.test.ts`: the `copyExtra.patterns.sumLabel` assertion repoints to
`copy.patternDetail.sumLabel` (`w {month}`); `overInMonth` stays. `parseThresholdValue` untouched.

#### 2. Sequence label

**File**: `src/lib/patterns/sequence-label.ts` (new, pure), `test/unit/sequence-label.test.ts` (new),
`src/pages/patterns/[...key].astro`, `src/content/copy.ts`

**Intent**: Kit `app.js` aria-label shape with correct plurals (decision 5); kit `role="img"` placement (decision 8).

**Contract**: `copyExtra.patterns.sequenceSummary` = „{within} {withinForms} w ramach progu, {over} {overForms} ponad
próg” with `DESIGN-GAP: K35`; `sequenceLabel(count: number, over: number, template: string, forms: readonly
[string, string, string]): string`, `within = count − over`. The sequence container gets `role="img"` +
`aria-label`; the `sr-only` span goes. Cases: (1,0) „1 wystąpienie … 0 wystąpień …”, (3,1), (5,5), (22,2).

#### 3. Register and smoke

**File**: `context/foundation/design-kit.md`, `scripts/smoke.mjs`

**Contract**: rows K35 (`patternDetail.sequenceSummary` has no plural forms, app keeps a `copyExtra` template, ask
round 4) and K36 (`threshold.invalid` omits the range / two-decimals rule of `parseThresholdValue`). Smoke +2:
`pattern detail shows the kit invalid-threshold line` (GET detail `?error=value` contains `Wpisz próg większy od
zera.`); `pattern detail labels the sequence` (contains `role="img" aria-label="<label computed from the smoke
fixture>"` — attribute order as rendered).

### Success Criteria:

#### Automated Verification:

- `npm test`: Phase 4 count + `sequence-label` cases, 0 failed
- Smoke Phase 4 count + 2 PASS, 0 FAIL; `Suma w maju`, `>brak ustawionego progu<` still green
- `grep -rn "copyExtra.patterns.\(thresholdInvalid\|thresholdSaveError\|typeLeads\|thresholdPanel\|occurrencesPanel\)" src` empty
- Deliberate break: `within = count` → sequence-label test red and the smoke label step red; restored; meta-check recorded
- Deliberate break: `error=value` back to the old copyExtra text → the invalid-threshold smoke step red; restored
- Full local gate vs baseline, smoke + 3

#### Manual Verification:

- [reviewer] K35/K36 rows match the `DESIGN-GAP` comments; `threshold-form.ts` and its tests unchanged

---

## Phase 6: Detail states and merged variants

### Overview

Kit not-found panel, kit no-occurrences block and transactions line, and merged variants at the bottom of the
transactions panel. `ViewEmpty` is extended (no new component).

### Changes Required:

#### 1. Not found

**File**: `src/components/app/ViewEmpty.astro`, `src/pages/patterns/[...key].astro`, `src/content/copy.ts`

**Intent**: Kit view `pattern-not-found.html` (G31 not-found part closes).

**Contract**: `ViewEmpty` props: `icon?: IconName` (no mark when absent), `headingLevel?: "h1" | "h2"` (default
`h2`); existing callers unchanged. Not-found branch: status 404 (unchanged), no `.detail-top` (no back link, no
„Akcje”), `<ViewEmpty headingLevel="h1" title=… body=… cta={copy.patternDetail.back} href="/patterns" />` with title
/ body = `copy.patternDetail.notFound` split after its first „. ” (title keeps the full stop). Delete `detailMissing`
and the not-found `DESIGN-GAP: G31` comment. The CTA keeps `ViewEmpty`'s ↗ arrow only if the kit view has none —
kit has none, so the arrow becomes a prop-controlled default (`arrow?: boolean`, default true).

#### 2. No occurrences

**File**: `src/pages/patterns/[...key].astro`, `src/content/copy.ts`, `context/foundation/design-kit.md`

**Intent**: Kit view `pattern-no-occurrences.html`.

**Contract**: `detail.count === 0`: kit `.no-occurrences` (`min-h-[120px] flex items-center justify-center gap-2.5
text-sm text-muted`, `info` icon 18 + `copy.patternDetail.noOccurrences`); transactions panel shows `<p
class="text-muted">` `copyExtra.patterns.noTransactions` „Brak transakcji do pokazania w wybranym miesiącu.”
(`app.js` literal, no key) with `DESIGN-GAP: K37` + register row K37. Delete `monthEmpty` and its G31 comment.

#### 3. Merged variants

**File**: `src/pages/patterns/[...key].astro`, `src/content/copy.ts`

**Intent**: Kit `patternDetail()` places `.merged-variants` at the bottom of the transactions panel.

**Contract**: block moves from under the heading to the end of the transactions `Panel`: top border `line`, mt 20 /
pt 15 px, h3 13 px `copy.patternActions.mergedVariants`, one row per variant (name muted 13 px) with its own unmerge
form and `copy.patternActions.undoMerge` button (per-variant undo kept — decision 9). Button text still renders as
`>Cofnij scalenie<`. Delete `mergedLabel`, `unmerge`.

#### 4. Smoke

**File**: `scripts/smoke.mjs`

**Contract**: +2: `unknown pattern shows the kit not-found panel` (GET `/patterns/smoke-missing-<ts>` → status 404,
contains `>Nie znaleziono wzorca.<`); `merged pattern titles its variants` (contains `>Połączone nazwy<` in the
existing merged-pattern context). +1 more only if the smoke imports already give a merchant with no occurrence in
the reference month (`no-occurrences` needle `>Brak wystąpień w tym miesiącu.<`); otherwise the visual row covers it
and the handoff says why.

### Success Criteria:

#### Automated Verification:

- `npm test`: Phase 5 count, 0 failed
- Smoke Phase 5 count + 2 (or + 3, see Contract) PASS, 0 FAIL; `>Cofnij scalenie<` still green
- `grep -n "G31" "src/pages/patterns/[...key].astro"` mentions only `overInMonth`; no reader left for `detailMissing`, `monthEmpty`, `mergedLabel`, `unmerge`
- Deliberate break: the not-found title gets the whole unsplit `notFound` string → the not-found step red; restored; meta-check recorded (proves the split, not only the 404)
- Full local gate vs baseline, smoke + 5 (or + 6)

#### Manual Verification:

- [reviewer] Other `ViewEmpty` callers render byte-identical markup (defaults); K37 row matches its comment

---

## Phase 7: Actions dialog copy, rename field and decision results

### Overview

Kit `modal('patternActions' | 'merge' | 'mergeEmpty' | 'rename')` content inside the existing in-place dialog
(decision 3), the F5 rename fix, and the page result lines on kit keys. No new UI component (`InfoAlert` reused).

### Changes Required:

#### 1. Dialog

**File**: `src/components/patterns/PatternActionsDialog.tsx`, `src/pages/patterns/[...key].astro`, `src/content/copy.ts`

**Intent**: G33 — the kit now draws merge, merge-empty and rename.

**Contract**: `PatternActionsCopy` fields: `eyebrow` (`patternActions.eyebrow`), `title`, `lead`, `close`
(`closeLabel`), `saving` (`patternActions.saving`), `actions` (stays `copyExtra`), `merge`/`changeType`/`rename`/
`exclude` (unchanged), `mergeTitle`, `mergeLead`, `mergeEmpty` (kit keys), `mergeField` „Wzorzec” and `mergeSubmit`
„Scal wzorce” (`copyExtra`, `app.js` literals), `renameTitle`, `renameLabel` (= `renamePlaceholder` „Nowa nazwa”),
`renameHint` (stays `copyExtra`), `renameSubmit` (= `patternActions.save`). The merge action button is always
enabled; its section shows a 17 px heading `mergeTitle` + muted `mergeLead`, then either the select (label
`mergeField`) + primary `mergeSubmit`, or `<InfoAlert>` `mergeEmpty` + a disabled ghost `mergeSubmit` (kit
`pattern-actions-merge-empty.html`). Rename section: 17 px heading `renameTitle`, label `renameLabel`, input
`maxLength={DISPLAY_NAME_MAX}`, `placeholder={name}`, `defaultValue={storedName}`, hint, primary `renameSubmit`. New
prop `storedName: string` = `dataResult.decisions.get(pattern.key)?.displayName ?? ""` from the page. Result-line
strings stay out of the props.

#### 2. Limit constant

**File**: `src/lib/patterns/decision-form.ts`

**Contract**: `export const DISPLAY_NAME_MAX = 100`, used by `parseDisplayName` (behaviour unchanged; `decision-form`
tests unchanged) and by the dialog input and the `renameLong` fill.

#### 3. Result lines

**File**: `src/pages/patterns/[...key].astro`, `src/pages/patterns.astro`, `src/content/copy.ts`,
`context/foundation/design-kit.md`

**Contract**: `decisionAlert`: `merged` → `copy.patternActions.merged`; `typed` → `.typeChanged`; `renamed` →
`.renamed`; `excluded` → `.excludedToast`; `error=merge` → `.mergeInvalid`; `error=name` →
`.renameLong.replace("{n}", String(DISPLAY_NAME_MAX))`; `error=decision` → `.saveError` (also `patterns.astro`
`resultAlert`); `unmerged` stays `copyExtra`. Delete every leaf whose last reader moved (`actionsEyebrow`,
`actionsTitle`, `actionsLead`, `close`, `mergeLabel`, `mergeNone`, `renameLabel`, `renameSubmit`, `merged`,
`typeChanged`, `renamed`, `excludedToast`, `mergeInvalid`, `nameInvalid`, `decisionError` — grep each). Register:
G33 narrowed („lead names no screen; read as the detail page”; separate modal views and in-dialog errors not
adopted), K31 „`{n}` = 100 filled”.

#### 4. Smoke

**File**: `scripts/smoke.mjs`

**Contract**: +3 page GETs with the param on the smoke merchant: `?renamed=1` contains `Nazwa wzorca zmieniona.`;
`?error=name` contains `Nazwa może mieć maksymalnie 100 znaków.`; `?error=merge` contains `Nie można scalić tych
wzorców.`. Existing `Wzorce scalone.`, `>Akcje<`, 101-char `?error=name` redirect steps unchanged.

### Success Criteria:

#### Automated Verification:

- `npm test`: Phase 6 count, 0 failed (`decision-form` cases unchanged)
- Smoke Phase 6 count + 3 PASS, 0 FAIL
- `grep -n "G32\|G33\|defaultValue={name}" src/components/patterns/PatternActionsDialog.tsx` empty
- Deliberate break: drop the `{n}` fill → the `?error=name` step red (`{n}` rendered); restored; meta-check recorded (needle includes „100”, so it proves the fill, not just the key)
- Deliberate break: `error=merge` back to the old `copyExtra` text → the `?error=merge` step red; restored
- Full local gate vs baseline, smoke + 8 (or + 9)

#### Manual Verification:

- [reviewer] Untouched rename save of a pattern with no stored name posts an empty value (no override written); with a stored name, the same name; `validateMerge` / endpoints untouched

---

## Phase 8: Gap register, seam sweep and visual gate

### Overview

Close the register rows, sweep what earlier phases left, file the follow-ups, and shoot every state. No product code
change except removing stale comments or dead leaves the sweep finds.

### Changes Required:

#### 1. Register

**File**: `context/foundation/design-kit.md`

**Contract**: round-3 table: K17 adopted (kit column order), K21 / K22 / G28 / G29 / G34 (badge tint) closed by
S-14, G31 reduced to `overInMonth`, G32 closed for the pattern views, G33 narrowed (P7), K11 patterns part updated,
K30 / K31 / K32 notes say which keys stay unread; K35–K37 present with their app answers.

#### 2. Seam sweep

**File**: any file touched in P1–P7, `src/content/copy.ts`

**Contract**: every remaining `copyExtra.patterns` leaf has a reader in `src/` (scripted grep loop over the leaf
names); no local `focusRing` / `fieldBox` / `rounded-lg` duplicate in `src/components/patterns/`; no comment still
naming `tableHeaders`, `BODY_ORDER`, „S-14” as future work, `detailMissing`, `monthEmpty`, G28/G29/G32; every
`DESIGN-GAP` id left in the pattern views has a register row; `PatternsTable` header comment describes the final
behaviour.

#### 3. Follow-ups

**File**: `context/changes/kit-round-3-patterns/follow-ups/review-fixes.md` (new)

**Contract**: each with `Trigger:` — S-05 F6 / F7 (rule changes, product feedback); `fixed.astro` `try` (S-15);
Panel radius 20 vs 12 (global radius pass); in-dialog decision errors / separate modal views (kit round 4 or
maintainer preference); K35–K37 (kit round 4).

### Success Criteria:

#### Automated Verification:

- Every `copyExtra.patterns` leaf has a reader (grep loop prints nothing)
- Seam greps empty (`tableHeaders`, `BODY_ORDER`, `detailMissing`, `monthEmpty`, `G28`, `G29`, `G32` in `src/`)
- Phase leaves `design/` and `src/styles/brand.css` untouched (`git diff --stat main -- design src/styles/brand.css` empty)
- Deliberate break: re-add an unused `copyExtra.patterns.mergeNone` leaf → the leaf-reader grep catches it; restored
- Full local gate vs baseline, smoke + 8 (or + 9)

#### Manual Verification:

- [visual] Screenshots desktop 1280 + ~400 px, compared with the kit views: `/patterns` default, > 10 rows collapsed and expanded (synthetic ING fixture import), search narrowing below the page size, search field focused, sort select focused, a „nowy” and a „zmiana kwoty” badge (if the data yields one, else stated), empty state, „Wykluczone” open; `/patterns/<key>` with threshold and over-limit marks, without threshold, `?error=value`, a month without occurrences, not-found, merged variants, excluded banner, month select focused, threshold field focused; actions dialog default, merge revealed, merge empty, rename revealed (placeholder shows the name, value empty)
- [visual] Other views touched by shared changes, desktop + ~400 px: `/imports` delete-import dialog, `/settings` delete-account dialog (with its fields), `/fixed` „nowy” badge, a primary button and the back link with keyboard focus (ring unchanged)
- [reviewer] Seam sweep complete; register matches the plan; follow-ups carry Trigger lines
- [human] Accept S-14 product-visible choices: „Pokaż więcej” page size 10 that stays expanded on a new search; field radius 14 → 8 px on the patterns toolbar and month select; dialog padding 31 → 26 px (22/18 px on a phone) across all three dialogs; `/fixed` „nowy” tint 25 → 18 %; status badges mean „in the latest month”; sequence label keeps plurals instead of the kit string (K35); `threshold.invalid` drops the range/decimals hint (K36); merge/rename errors stay page alerts; `patternActions.lead` „…w ustawieniach wzorca” read as the detail page (plan review F4); send K35–K37 to the kit author

## Testing Strategy

### Unit Tests:

- New: `patterns-table.test.ts` (column order, Kwota before Suma, badges, 10-row page + button) via
  `renderToStaticMarkup` + `createElement` in a `.test.ts` file (no config change); `pattern-status.test.ts`;
  `patterns-list-view.test.ts` (filter → sort → slice); `sequence-label.test.ts` (plural forms).
- Changed: `kit-contract.test.ts` (columns without `tableHeaders`, `sumLabel` repoint, field / focus / fieldBox /
  dialog pins). Removed: `table-columns.test.ts`. Unchanged: `threshold-form`, `decision-form`, `format`.

### Integration Tests:

- Smoke + 8 net (P3 +1, P5 +2, P6 +2, P7 +3), + 9 if P6 finds a deterministic no-occurrences merchant; no existing
  assertion edited. pgTAP unchanged (no schema change).

### Manual Testing Steps:

1. `npx supabase start`, import the synthetic ING fixture for the test user (more than 10 merchants),
   `ASTRO_DEV_BACKGROUND=1 npx astro dev --port 4399 --ignore-lock`.
2. Walk the P8 visual list at 1280 and ~400 px; trigger result lines by URL params; open (do not submit) the
   delete-import and delete-account dialogs.
3. Kill the dev server (`lsof -ti :4399 | xargs kill`).

## Known risks

- The badge, paging and column proofs are render tests of the island, not of the hydrated page; hydration uses the
  same component, and the visual gate checks the result.
- `ui/button.tsx` and `ui/dialog.tsx` importing `focusRing` from `app/field-styles.ts` inverts the usual ui → app
  direction; accepted to close S-04 F3 with one source (reviewer row 4.7).
- Status badges compare the latest month with the previous one while the list covers all months; the reading
  „in the latest month” is part of the `[human]` row.
- The no-occurrences state may lack a smoke step (data-dependent); the visual row covers it.
- `/patterns` smoke shows at most 2 table rows, so smoke proves only „no button on a short list”; paging itself (10 rows, button, reveal in sort order) is proven by the `listView` unit tests and the render test, and the visual row 8.6 with the synthetic ING fixture (plan review F1).

## Performance Considerations

One extra pure `fixedOverview` pass over data already in memory on `/patterns`; paging reduces rendered rows.

## Migration Notes

None. Rollback = revert the merge.

## Autonomous decisions

Recorded in place of the skill's questions (run contract rule 1). No decision departs from the PRD's literal text:
FR-007 lists the columns the table keeps (the full list is one click away), FR-009 / FR-010 / FR-011 rules are
unchanged. Kit departures and product-visible choices are collected in the `[human]` row 8.9.

| # | Decision | Chosen | Rejected | Why | What would change it |
| --- | --- | --- | --- | --- | --- |
| 1 | Complexity / questions | MEDIUM, 0 questions | Interview | Research answered every open question with a recommendation; the rest is reversible presentation | A product owner available |
| 2 | „Pokaż więcej” | 10 rows, after filter + sort, count on the filtered list, stays expanded on search | Kit 3 (demo data); collapse on search | ≥ 2 keeps every smoke row; 10 is a screenful at 1280 px; collapsing on search hides matches the user just revealed | Maintainer prefers another size (one constant) |
| 3 | Dialog structure | In-place sections with kit headings and states | Kit separate modal views | Smaller change; PRG flow and smoke unchanged; every kit state still drawn | Kit round 4 or maintainer asking for kit navigation |
| 4 | Merge / rename errors | Page alert after the redirect (unchanged) | Reopen the dialog with the inline error | S-12 precedent (one alert slot); no client state across a redirect | Reviewer requires in-dialog retry |
| 5 | `sequenceSummary` | `copyExtra` template, plurals for both counts (K35) | Kit „{within} wystąpień …” | Kit JSON is ungrammatical; its own `app.js` pluralises; K29 precedent | Maintainer accepts the kit string for screen-reader text |
| 6 | `threshold.invalid` | Kit string, validator unchanged (K36) | Keep the precise `copyExtra` text | Kit is the copy source; PRD FR-010 silent on the message | Feedback that out-of-range input is confusing |
| 7 | `patternActions.lead` | Kit key; listed in `[human]` row 8.9 (plan review F4) | Rewording | Byte-identical to today; the detail page is where every decision is reversed | A separate pattern-settings screen in scope |
| 8 | Sequence a11y | `role="img"` + `aria-label` (kit) | `sr-only` span | Kit fidelity; both announce; removes a duplicate node | Screen-reader test showing a regression |
| 9 | Merged variants | Bottom of the transactions panel (kit), per-variant undo kept | Kit single undo button | Unmerge is per source (`unmerge` action takes `source`) | `unmerge` gaining a whole-chain mode |
| 10 | Rename field (F5) | Value = stored `displayName` or empty; placeholder = shown name | Kit empty value always; today's derived prefill | Untouched save never freezes the derived name and never clears a stored one | — |
| 11 | Not-found layout | Extend `ViewEmpty` (optional icon, heading level, arrow) | Plain `Panel` copy | One empty-state component; defaults keep other callers identical | Kit giving not-found its own pattern |
| 12 | No-occurrences transactions line | Adopt the `app.js` literal in `copyExtra` (K37) | Omit it | Kit draws it; copy from the prototype is not invented | Kit adds a key |
| 13 | Focus ring | One `focusRing` export, ink/15 unchanged | Unify on `--rytm-focus-ring` (.12) | Kit has no `:focus-visible` rule; zero visual change site-wide | Kit adds a focus rule |
| 14 | Status badges | In scope, one `fixedOverview` on the same read | Follow-up to S-15 | Kit draws them; no rule change; no second read | `fixedOverview` cost visible in smoke timing |
| 15 | Rename limit | 100 (`DISPLAY_NAME_MAX`) | Kit 60 | Schema CHECK 1–100; M-3 has no migrations (K31) | Kit round 4 insisting on 60 → expand/contract change |
| 16 | Phase size | 8 phases (plan review merged the dialog geometry into P4), no new UI component | 9 phases with the geometry isolated; fewer, larger phases | Contract: fresh agent per phase, small and green | — |

## References

- Change identity: `context/changes/kit-round-3-patterns/change.md`
- Research: `context/changes/kit-round-3-patterns/research.md`
- Kit: `design/rytm-os/prototype/app.js` (`patterns`, `patternRows`, `showMorePatterns`, `badge`, `patternDetail`,
  `thresholdEditor`, `modal`), `design/rytm-os/prototype/styles.css` (`.search-field`, `.select-field`, `.table-foot`,
  `.no-occurrences`, `.merged-variants`, `.modal`, `.view-empty`), `design/rytm-os/react-kit/docs/content.json`,
  views `patterns*.html`, `pattern-*.html`
- Register: `context/foundation/design-kit.md`
- Follow-ups consumed: `context/archive/2026-10-02-kit-round-3-intake/follow-ups/review-fixes.md`,
  `context/archive/2026-10-03-kit-round-3-auth-settings/follow-ups/review-fixes.md` (F1, F2),
  `context/archive/2026-09-28-durable-pattern-decisions/follow-ups/review-fixes.md` (F4, F5),
  `context/archive/2026-09-28-fixed-cost-changes/`, `context/archive/2026-09-27-pattern-threshold-over-limit/` (F3)
- Format example: `context/archive/2026-10-03-kit-round-3-auth-settings/plan.md`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Kit column order, list copy and the /patterns error boundary

#### Automated

- [x] 1.1 npm test: baseline minus table-columns cases plus render cases, 0 failed — 5956c76
- [x] 1.2 Smoke baseline PASS, 0 FAIL, Δ0 — 5956c76
- [x] 1.3 No tableHeaders / table-columns left; no reader for deleted copyExtra.patterns leaves — 5956c76
- [x] 1.4 Deliberate break: Kwota/Suma cells swapped back turns the render test red, restored, meta-check recorded — 5956c76
- [x] 1.5 Deliberate break: throw inside the try renders components.error with 200, not 500, restored — 5956c76
- [x] 1.6 Full local gate vs baseline, smoke Δ0 — 5956c76

#### Manual

- [ ] 1.7 [reviewer] Body and header order match kit patternRows(); try wraps assembly only

### Phase 2: Status badges and the Badge tones

#### Automated

- [x] 2.1 npm test: Phase 1 count plus pattern-status and badge render cases, 0 failed
- [x] 2.2 Smoke Phase 1 count PASS, 0 FAIL, Δ0
- [x] 2.3 G28 in PatternsTable.tsx names only Pokaż więcej
- [x] 2.4 Deliberate break: empty status map and ignored status turn status and render tests red, restored, meta-check recorded
- [x] 2.5 Full local gate vs baseline, smoke Δ0

#### Manual

- [ ] 2.6 [reviewer] One fixedOverview call on the same loadPatternData result; Tailwind color names only

### Phase 3: Pokaż więcej

#### Automated

- [ ] 3.1 npm test: Phase 2 count plus list-view and render cases, 0 failed
- [ ] 3.2 Smoke Phase 2 count + 1 PASS, 0 FAIL
- [ ] 3.3 No G28 left in PatternsTable.tsx
- [ ] 3.4 Deliberate break: page size 1 turns the new smoke step and list-view tests red, restored, meta-check recorded
- [ ] 3.5 Deliberate break: slice before filter in listView turns the last-by-sum search case red, restored
- [ ] 3.6 Full local gate vs baseline, smoke + 1

#### Manual

- [ ] 3.7 [reviewer] Count line counts the filtered list; reveal keeps the sort; search keeps expanded

### Phase 4: Toolbar field, one focus ring, one field box, dialog geometry

#### Automated

- [ ] 4.1 npm test: Phase 3 count plus new kit-contract cases, 0 failed
- [ ] 4.2 Smoke Phase 3 count PASS, 0 FAIL, Δ0
- [ ] 4.3 No G29 / G32 in src; focus-visible:ring-ink/15 only in field-styles.ts
- [ ] 4.4 Deliberate break: field back to rounded-lg turns kit-contract red, restored, meta-check recorded
- [ ] 4.5 Deliberate break: dialog padding back to 31 px turns the dialog pin red, restored, meta-check recorded
- [ ] 4.6 Full local gate vs baseline, smoke Δ0

#### Manual

- [ ] 4.7 [reviewer] buttonVariants / BackLink / dialog close keep the same focus classes; ui importing app/field-styles accepted; no dialog importer passes a className fighting the new padding

### Phase 5: Detail copy rebind and the sequence label

#### Automated

- [ ] 5.1 npm test: Phase 4 count plus sequence-label cases, 0 failed
- [ ] 5.2 Smoke Phase 4 count + 2 PASS, 0 FAIL, Suma w maju and brak ustawionego progu still green
- [ ] 5.3 No reader left for the rebound threshold / detail copyExtra leaves
- [ ] 5.4 Deliberate break: within = count turns sequence-label test and label smoke step red, restored, meta-check recorded
- [ ] 5.5 Deliberate break: error=value back to the old text turns the invalid-threshold step red, restored
- [ ] 5.6 Full local gate vs baseline, smoke + 3

#### Manual

- [ ] 5.7 [reviewer] K35/K36 rows match the DESIGN-GAP comments; threshold-form unchanged

### Phase 6: Detail states and merged variants

#### Automated

- [ ] 6.1 npm test: Phase 5 count, 0 failed
- [ ] 6.2 Smoke Phase 5 count + 2 (or + 3) PASS, 0 FAIL, Cofnij scalenie still green
- [ ] 6.3 G31 in the detail page names only overInMonth; no reader for detailMissing / monthEmpty / mergedLabel / unmerge
- [ ] 6.4 Deliberate break: unsplit notFound title turns the not-found step red, restored, meta-check recorded
- [ ] 6.5 Full local gate vs baseline, smoke + 5 (or + 6)

#### Manual

- [ ] 6.6 [reviewer] Other ViewEmpty callers render identical markup; K37 row matches its comment

### Phase 7: Actions dialog copy, rename field and decision results

#### Automated

- [ ] 7.1 npm test: Phase 6 count, 0 failed, decision-form cases unchanged
- [ ] 7.2 Smoke Phase 6 count + 3 PASS, 0 FAIL
- [ ] 7.3 No G32 / G33 / defaultValue={name} left in PatternActionsDialog.tsx
- [ ] 7.4 Deliberate break: renameLong without the {n} fill turns the error=name step red, restored, meta-check recorded
- [ ] 7.5 Deliberate break: error=merge back to the old text turns the error=merge step red, restored
- [ ] 7.6 Full local gate vs baseline, smoke + 8 (or + 9)

#### Manual

- [ ] 7.7 [reviewer] Untouched rename save writes nothing new; validateMerge and endpoints untouched

### Phase 8: Gap register, seam sweep and visual gate

#### Automated

- [ ] 8.1 Every copyExtra.patterns leaf has a reader
- [ ] 8.2 Seam greps empty (tableHeaders, BODY_ORDER, detailMissing, monthEmpty, G28, G29, G32)
- [ ] 8.3 Phase leaves design/ and brand.css untouched
- [ ] 8.4 Deliberate break: re-added unused copyExtra.patterns.mergeNone caught by the leaf-reader grep, restored
- [ ] 8.5 Full local gate vs baseline, smoke + 8 (or + 9)

#### Manual

- [ ] 8.6 [visual] Screenshots desktop + ~400 px of every listed pattern state, compared with the kit views
- [ ] 8.7 [visual] Screenshots desktop + ~400 px of the other views touched by shared changes (imports and settings dialogs, /fixed badge, focus ring)
- [ ] 8.8 [reviewer] Seam sweep complete; register matches the plan; follow-ups carry Trigger lines
- [ ] 8.9 [human] Accept S-14 product-visible choices (page size 10 kept expanded on search, field radius 14 → 8 px, dialog padding across 3 dialogs, /fixed badge tint, badges mean latest month, K35 plurals, K36 shorter invalid message, page-level dialog errors, lead „ustawienia wzorca” = detail page) and send K35–K37 to the kit author
