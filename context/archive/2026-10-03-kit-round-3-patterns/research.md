---
date: 2026-10-03T13:31:43+02:00
researcher: Claude (autonomous run 2026-10-02-kit-round-3, research step)
git_commit: 91df8d5809ad2789ab3d21c8802b1e64091e77c6
branch: feat/kit-round-3-patterns
repository: Rytm
topic: "S-14 kit-round-3-patterns — copy rebind map, kit layout/behaviour and shared-component blast radius for the plan"
tags: [research, design-kit, patterns, pattern-detail, threshold, pattern-actions, dialog, field-styles, badge, smoke]
status: complete
last_updated: 2026-10-03
last_updated_by: Claude (autonomous research step)
---

# Research: S-14 `kit-round-3-patterns`: open questions for the plan

**Date**: 2026-10-03T13:31:43+02:00
**Git Commit**: `91df8d5` (branch `feat/kit-round-3-patterns` = `main` `5ed97f4` + the change-identity commit)
**Repository**: Rytm

## Research Question

From `change.md` (§ Roadmap claims vs repo now, § Follow-ups triggered, § Autonomous decisions 2, 4, 6) and
`handoff.md` §5 of the `/10x-new` step:

1. Key-by-key map `copyExtra.patterns` → round-3 `content.json` (`patterns`, `patternDetail`, `threshold`,
   `patternActions`, `components.*`) against `src/content/copy.ts` as it is now; which keys stay `copyExtra`; which
   are read by non-pattern views.
2. Smoke and unit assertions that pin pattern copy.
3. Kit layout/behaviour: column order, „Pokaż więcej”, status badges, detail states, actions dialog structure.
4. Open copy decisions: `sequenceSummary` plurals, `threshold.invalid` vs the validator, `patternActions.lead`
   („ustawienia wzorca”), „Scalenie cofnięte.”, `thresholdSum`, `overInMonth`.
5. Shared components with cross-view blast radius: `DialogContent`, `field-styles.ts`, focus ring, `Badge`.
6. Status badges: can `fixedOverview` drive them from the data `/patterns` already loads; the `patternTxs` 500.

## Summary

- **The slice is a rebind plus four small behaviours (kit column order, „Pokaż więcej”, status badges, a `try` on `/patterns`), no migration.** Of the 56 leaves in `copyExtra.patterns`
  (`src/content/copy.ts`; arrays count as one leaf), 25 map 1:1 with identical text to a round-3 key, 18 have no
  `content.json` key and stay (`app.js` literals or app-only placeholders, §1.2), and 13 map to a key with different
  wording or need a decision (§1). Only two leaves are read outside the pattern views: `upload` (`src/pages/home.astro`) and
  `monthsLocative` (`src/pages/fixed.astro`); both stay.
- **Smoke pins few pattern strings, and none of them changes wording under the recommended map** (§2).
  `scripts/smoke.mjs` asserts `>brak ustawionego progu<`, `>ponad próg<`, `>Akcje<`, `>Cofnij scalenie<`, `Suma w
  maju`, `Wzorce scalone.`, `>stały<`/`>częsty<`, `>Ponad progiem<`, and the `?error=name` redirect for a 101-char
  name. Unit tests that must change: `test/unit/table-columns.test.ts` and the `tableHeaders` part of
  `test/unit/kit-contract.test.ts` (kit column order). The `copyExtra.patterns.sumLabel`/`overInMonth` placeholder
  assertions in `kit-contract.test.ts` need repointing to `copy.patternDetail.sumLabel` when `sumLabel` moves.
- **Kit behaviour to copy, kit bugs to skip** (§3). Kit column order: Sprzedawca | Typ | Wystąpienia | Kwota | Suma
  | Próg | Ponad progiem. Status badges go in the „Ponad progiem” cell, after the excess value. „Pokaż więcej” in
  `app.js` `patterns()` / `showMorePatterns()` shows `slice(0,3)`. Clicking it re-renders in data order and ignores
  search and sort, and `bindInteractions` never updates the count. That is demo code: the app keeps its
  client-side search/sort over the whole list (`PatternsTable.tsx`), and the page size is a plan constant.
- **Copy decisions, resolved as recommendations** (§4):
  - `sequenceSummary`: keep a plural-aware `copyExtra` template shaped like the kit's (K29 precedent; new K-row).
  - `threshold.invalid`: adopt the kit string. The validator `parseThresholdValue` is unchanged. Add a K-row for
    the dropped range and decimals hint.
  - `patternActions.lead`: adopt it. It is byte-identical to today's `copyExtra.patterns.actionsLead`, so nothing
    visible changes. The dialog that says it lives on the detail page, where every decision is reversed.
  - „Scalenie cofnięte.”, `thresholdSum`, `overInMonth`: stay in `copyExtra`.
  - Rename limit: `{n}` = 100.
- **Shared touches** (§5):
  - `DialogContent` (`src/components/ui/dialog.tsx`): 3 importers, none passes `className`.
  - `field` (`src/components/app/field-styles.ts`): 2 importers, both pattern views. `rounded-lg` there is 14 px
    (`--radius-lg: var(--radius)`, 14 px in `src/styles/global.css`), so the switch to `rounded-[8px]` is a real
    change.
  - `buttonVariants`: site-wide.
  - Both new kit tokens fit the allowed Tailwind names exactly: `--rytm-focus-ring` = `ink/12` and
    `--rytm-badge-soft` = `excess/18` (`src/styles/brand.css`).
- **Status badges need no new read** (§6). `src/pages/patterns.astro` already holds `dataResult.patterns` and
  `dataResult.rows`, and `fixedOverview(patterns, rows)` (`src/lib/patterns/fixed.ts`) takes exactly those.
  `patterns.astro` has no `try` around `listOverview`, so a `patternTxs` id drift is a 500 today. `home.astro`'s
  single `try` is the pattern to copy.

## Detailed Findings

### 1. Copy map `copyExtra.patterns` → round 3 (question 1)

The readers: `src/pages/patterns.astro` (`tableCopy`, template, `resultAlert`), `src/pages/patterns/[...key].astro`
(`sumLabel`, `overLabel`, `sequenceSummary`, `editorCopy`, `actionsCopy`, `resultAlert`, `decisionAlert`, template),
`src/components/patterns/ExcludedPatterns.astro`, `RestoreForm.astro`. `PatternsTable.tsx`, `ThresholdEditor.tsx`
and `PatternActionsDialog.tsx` get their copy only through props (`PatternsTableCopy`, `editorCopy`, `PatternActionsCopy`).
`prototype/app.js` itself never reads `content.json`. Every kit string in it is a literal. Below, "kit key" means
the `content.json` key whose text matches the literal.

#### 1.1 Identical text: rebind, delete the `copyExtra` leaf (25 leaves)

| `copyExtra.patterns.` | → kit key |
| --- | --- |
| `eyebrow` | `app.patternsLong` |
| `patternForms` | `patterns.countForms` (also `ExcludedPatterns.astro`) |
| `typeLeads.fixed` / `.frequent` | `patternDetail.typeFixed` / `typeFrequent` |
| `thresholdPanel` / `thresholdActive` / `thresholdNone` | `threshold.title` / `activeLabel` / `noThreshold` |
| `valueLabel.amount` / `.count` | `threshold.amount` / `count` |
| `suffix.money` / `.count` | `threshold.unitCurrency` / `unitCount` |
| `occurrencesPanel` | `patternDetail.monthSelect` |
| `sequenceWithin` | `patternDetail.sequenceWithin` |
| `sumLabel` | `patternDetail.sumLabel` (still filled by `fillMonthLocative`, K30) |
| `monthEmpty` | `patternDetail.noOccurrences` |
| `thresholdSaveError` | `threshold.saveError` (K32: not `patternDetail.thresholdError`) |
| `actionsEyebrow` / `actionsTitle` / `actionsLead` | `patternActions.eyebrow` / `title` / `lead` |
| `typeChanged` / `excludedToast` / `merged` | `patternActions.typeChanged` / `excludedToast` / `merged` |
| `close` | `patternActions.closeLabel` (K32 twin `close`, same text) |
| `excludedToggle` | `patterns.excluded` |
| `unmerge` | `patternActions.undoMerge` |

Also: `copyExtra.auth.saving` („Zapisywanie…”) is read by `editorCopy` and `actionsCopy`. It rebinds to
`threshold.saving` / `patternActions.saving`, which have the same text. The `auth` leaf stays, because S-12 auth
views read it.

#### 1.2 No `content.json` key: stays in `copyExtra` (18 leaves)

| Leaf | Why it stays |
| --- | --- |
| `upload` „+ Wgraj CSV” | `app.js` literal with the „+ ” prefix; `emptyViews.button` is „Wgraj CSV” without it. Read by `home.astro` too |
| `typeLabels.fixed` / `.frequent` | `app.js` `badge()` literals |
| `sortPrefix`, `footer` („· wszystkie miesiące”) | `app.js` `patterns()` literals |
| `detailEyebrow`, `setThreshold`, `thresholdRemoved`, `overBadge`, `thresholdCount`, `openPattern`, `actions` („Akcje”) | `app.js` `patternDetail()` / `thresholdEditor()` / `patternRows()` literals. `overBadge` „ponad próg” ≠ `patternDetail.sequenceOver` „Ponad próg”, a different role |
| `occurrenceForms` | `app.js` pluralises inline. No forms key in `content.json` (K21 „brak liczby mnogiej wystąpień”) |
| `monthsLocative` | K30: the kit `monthNames` gives „w wrześniu”. `fillMonthLocative` (`src/lib/format.ts`) needs the array. Read by `fixed.astro` too |
| `overInMonth` | G31 remainder: the kit has no label for „ponad progiem” outside the reference month |
| `thresholdSum` | The kit never renders a `sum` threshold in a row |
| `unmerged` „Scalenie cofnięte.” | `app.js` `undoMerge` toast literal; no key |
| `renameHint` „Pusta nazwa przywraca nazwę z wyciągu.” | App-only behaviour. `parseDisplayName` maps an empty field to `null`, which clears the override. The kit's empty rename just closes. Keep it as G33 |

Grep scope for "no key": `design/rytm-os/react-kit/docs/content.json`, searched for the literal texts „Akcje”,
„ponad próg”, „wystąpienie”, „stały”, „Wzorzec”, „Otwórz wzorzec”, „Ustaw próg”, „Próg usunięty”, „Scalenie
cofnięte”, „wszystkie miesiące”, „Sortuj”. The search found no matches, except „Scal wzorce” as `mergeTitle`.

#### 1.3 Key exists, wording or role differs: plan decides (13 leaves)

| Leaf (today) | Kit | Recommendation |
| --- | --- | --- |
| `detailMissing` „Nie znaleziono tego wzorca — mógł zniknąć po usunięciu importu.” | `patternDetail.notFound` „Nie znaleziono wzorca. Mógł zniknąć po cofnięciu importu.” `app.js` splits it into h1 „Nie znaleziono wzorca.” + p + a „Wróć do wzorców” CTA | Kit key. Split on the first „. ” the way `app.js` does, or render whole. Layout §3.4 |
| `sequenceSummary` | `patternDetail.sequenceSummary` „{within} wystąpień w ramach progu, {over} ponad próg.” | Keep plural (§4.1) |
| `thresholdInvalid` | `threshold.invalid` „Wpisz próg większy od zera.” | Kit key (§4.2) |
| `mergeLabel` „Scal z wzorcem” | `app.js` merge view: h2 `mergeTitle` „Scal wzorce”, p `mergeLead`, select label literal „Wzorzec” | `mergeTitle` + `mergeLead` from the kit. The label „Wzorzec” is an `app.js` literal and goes to `copyExtra`. Note: the `app.js` merge lead („Wybierz sprzedawcę, którego transakcje mają należeć do „{name}”.”) ≠ `mergeLead`, so read the key (copy.ts rule) |
| `mergeSubmit` „Scal” | `app.js` button „Scal wzorce” (same text as `mergeTitle`, no own key) | `copyExtra` literal „Scal wzorce” (do not reuse `mergeTitle` for a button role) |
| `mergeNone` | `patternActions.mergeEmpty` „Nie ma innych wzorców do scalenia.” | Kit key |
| `renameLabel` „Nazwa sprzedawcy” | `patternActions.renamePlaceholder` „Nowa nazwa”, used as the field label in `app.js`; `renameTitle` „Zmień nazwę wzorca” as h2 | `renameTitle` heading + `renamePlaceholder` as label |
| `renameSubmit` „Zapisz nazwę” | `patternActions.save` „Zapisz” | Kit key |
| `renamed` „Nazwa zmieniona.” | `patternActions.renamed` „Nazwa wzorca zmieniona.” | Kit key. No smoke pin (smoke asserts `?renamed=1` only) |
| `mergedLabel` „Scalone warianty” | `patternActions.mergedVariants` „Połączone nazwy” | Kit key |
| `mergeInvalid` „Nie można scalić z tym wzorcem.” | `patternActions.mergeInvalid` „Nie można scalić tych wzorców.” | Kit key (K32: not `errorMerge`) |
| `nameInvalid` „…najwyżej 100 znaków.” | `patternActions.renameLong` „Nazwa może mieć maksymalnie {n} znaków.” | Kit key, `{n}` = 100 (K31; not `renameMaxLength` 60) |
| `decisionError` | `patternActions.saveError` „Nie udało się zapisać zmian. Spróbuj ponownie.” | Kit key (K32: not `errorSave`). Also read by `patterns.astro` `resultAlert` |

Kit keys with no app reader after this map: `patterns.showMore` (new, §3.2); `patterns.merchantMark` („Znak
sprzedawcy”). `app.js` gives the mark `aria-hidden` and `PatternsTable.tsx` renders the `merchantMark` span with `aria-hidden` too, so the key has
no visible role and can stay unread. `components.changed` (new badge, §6) and `components.excluded` (unused: the
table filters out excluded rows). `patternActions.mergeForms` is not rendered by `app.js`.

### 2. Tests that pin pattern copy (question 2)

**Smoke** (`scripts/smoke.mjs` `steps` array; body substring matches). Pattern-copy needles and what the §1 map
does to them:

| Step (name) | Needle | Source after the map | Text changes? |
| --- | --- | --- | --- |
| „patterns table keeps the Ponad progiem header” | `>Ponad progiem<` | `copy.patterns.columns[6]` | no; the order change keeps the cell |
| „pattern detail renders the month total” | `Suma w maju` | `copy.patternDetail.sumLabel` + `fillMonthLocative` | no |
| „pattern detail has no threshold yet”, „…drops the over-limit mark after removal” | `>brak ustawionego progu<` (+ notContains `>ponad próg<`) | `threshold.noThreshold`, `copyExtra.overBadge` | no |
| „pattern detail confirms the saved threshold” | `Sukces — próg zapisany.` | `copy.components.success` | no |
| „pattern detail marks the over-limit transaction” | `>ponad próg<` | `copyExtra.overBadge` | no |
| „merge confirms the result”, „detail offers the actions” | `Wzorce scalone.`, `>Akcje<` | `patternActions.merged`, `copyExtra.actions` | no |
| „merged pattern lists its variant” | `>Cofnij scalenie<` | `patternActions.undoMerge` | no |
| type steps | `>stały<`, `>częsty<` | `copyExtra.typeLabels` | no |
| „excluded pattern shows the banner” / „restored … drops the banner” | `>Wykluczony z analizy<` | `patternActions.excluded` | no (already kit) |
| „list confirms a restore” | `Wzorzec przywrócony do analizy.` | `patternActions.restored` | no (already kit) |
| „rename with an over-long name is rejected” | POST `"a".repeat(101)` → `?error=name` | `parseDisplayName` 100 limit | no (K31 keeps 100) |
| „patterns lists imported merchants” / „…re-imported merchant” | `Kawiarnia smoke` | data | see note |

Rename, type, exclude, unmerge and threshold-removed toasts are asserted only through the 302 `location`. So the
wording changes in §1.3 (`renamed`, `mergeInvalid`, `nameInvalid`, `decisionError`) break no smoke step. The plan
may add `>text<` needles for the new strings. Contract rule: a React-island string must be matched as `>text<`,
because the island's serialized props carry the same text.

Note on „Pokaż więcej”: the smoke user imports 4 merchants (`Sklep`, `Kawiarnia`, `Piekarnia`, `Santander smoke`,
the payloads at the top of `scripts/smoke.mjs`). The `Kawiarnia smoke` needle would also match the island's
serialized `patterns` prop when the row is hidden, so it cannot catch a page-size regression. A page size ≥ 4 keeps
every smoke row rendered. A smoke step for the button itself needs a list longer than the page size, for example the
demo account.

**Unit** (`test/unit/`):
- `table-columns.test.ts` pins `tableHeaders(copy.patterns.columns)` = [Sprzedawca, Typ, Wystąpienia, **Suma,
  Kwota**, Próg, Ponad progiem] (`src/lib/patterns/table-columns.ts` `BODY_ORDER`). It goes away together with
  `tableHeaders` (F-04 follow-up).
- `kit-contract.test.ts`: „keeps 7 pattern table columns, all mapped by tableHeaders” needs rewriting without
  `tableHeaders`. The placeholder assertions on `copyExtra.patterns.sumLabel` / `overInMonth` (`toContain("w
  {month}")`) need repointing: `sumLabel` → `copy.patternDetail.sumLabel` (it holds `w {month}`), `overInMonth`
  stays. `monthsLocative` length 12 stays.
- `threshold-form.test.ts` (`parseThresholdValue`: count 1–999 integer; money ≤ 2 decimals, `.`/`,`, ≤ 7 integer
  digits, 1 gr – 1 000 000 zł) and `decision-form.test.ts` (`parseDisplayName` 100 ok / 101 `invalid`): rules
  unchanged; no edit.
- No unit test pins pattern copy literally (agent sweep of `test/unit/`).

### 3. Kit layout and behaviour (question 3)

#### 3.1 List (`patterns.html`, `app.js` `patterns()` / `patternRows()`)

- Top to bottom: `.dash-title` (eyebrow, h1, p, „+ Wgraj CSV”), then `.toolbar` (search + sort), then
  `.panel.table-panel` (table + `.table-foot`), then `.excluded-section`.
- Columns: Sprzedawca | Typ | Wystąpienia | **Kwota | Suma** | Próg | Ponad progiem | (empty th, arrow).
- Cells:
  - Kwota: `money(amount||sum)` for `stały`, „—” otherwise.
  - Ponad progiem: `span.excess-value` (or „—”), then the status badge.
  - The arrow: `a.icon-button` with aria-label „Otwórz wzorzec”.
- App today (`PatternsTable.tsx`): the same cells, with Suma before Kwota. The swap is two cells plus `<thead>`
  reading `copy.patterns.columns` directly.

#### 3.2 „Pokaż więcej” (kit vs. roadmap Risk)

- Kit behaviour:
  - First render: `visible.slice(0,3)`.
  - The button `#showMorePatterns` (`btn btn-ghost`, in `.table-foot` next to the count) shows only when more than
    3 rows exist.
  - `showMorePatterns()` re-renders every non-excluded pattern in data order, ignoring the current search and sort,
    and removes the button.
  - `bindInteractions` search and sort re-slice to 3 and never bring the button back.
  - The count line `#patternCount` always shows the total. `routes.md` says the row count comes from the API.
- Kit `.table-foot`: `display:flex; justify-content:space-between`, padding 13px 17px, top border, 12px muted
  text. At ≤ 560 px it stacks (column, gap 13px). The button has no own rule; it is a plain `.btn.btn-ghost`.
- App today:
  - Search (case-insensitive substring) and sort (sum/count desc, name `localeCompare("pl")`, stable) run
    client-side in a `useMemo` over the whole non-excluded list (`PatternsTable.tsx`).
  - The footer counts the **filtered** list (`visible.length`).
- Recommendation, which keeps the Risk „must not change sorting or sums”:
  - Apply the page limit **after** filter and sort, and show the button when the filtered list is longer than the
    limit. Revealing shows the rest of the same sorted list.
  - Keep the count line on the full filtered list, never on the visible slice.
  - Whether a new search collapses the list back to the page size is a plan choice. Recommended: keep it
    expanded, since `app.js` gives no guidance beyond its own bug.
  - The page size is a plan constant; the kit's 3 matches its 5-row demo data. It must be ≥ 4 for smoke (§2).
  - The SSR render of the island must show the same first page.

#### 3.3 Status badges

- `badge(p.status)` renders after the excess value in the „Ponad progiem” cell:
  - „nowy” gets the `new` class;
  - any other non-empty status gets the `changed` class (in the data that is „zmiana kwoty”).
- Copy: `components.new` / `components.changed`.
- CSS: both get `background: var(--rytm-badge-soft)` (`rgba(199,157,98,.18)` = Tailwind `bg-excess/18`) and
  `color: var(--rytm-excess-text)` (= `text-excess-text`). Base: pill, 11px/800, `min-height: 23px`, padding
  3px 8px.
- The app's `Badge` (`src/components/app/Badge.tsx`):
  - Tones: `new` = `bg-excess/25 text-excess-text`. There is no `changed` tone.
  - Importers: `PatternsTable.tsx`, `[...key].astro`, `fixed.astro`.
  - Moving `new` to `/18` and adding `changed` with the same classes therefore also changes the `/fixed` „nowy”
    badge. That is the S-06 follow-up „Badge new tint vs kit” and is intended (S-15 shoots `/fixed` again).

#### 3.4 Detail (`pattern-wolt.html`, `pattern-not-found.html`, `pattern-no-occurrences.html`)

- **Not found** (`app.js` `#/patterns/missing`):
  - Inside the app shell, one `section.panel.view-empty`: h1 „Nie znaleziono wzorca.”, p „Mógł zniknąć po
    cofnięciu importu.”, `btn-primary` „Wróć do wzorców” → `/patterns`.
  - There is no back-link and no detail top.
  - The app today has status 404 + `InlineAlert` info `detailMissing`.
  - Shared candidate: `src/components/app/ViewEmpty.astro` (props `icon`, `title`, `body`, `cta`, `href`; it
    renders `title` as an h2). The kit not-found has an h1 and no icon, so reuse needs an optional icon and
    heading level, or a plain `Panel` with the same classes.
- **No occurrences** (`app.js`, any month starting with „gru”):
  - The full layout stays. The total shows 0,00 zł / „0 wystąpień”.
  - The sequence is replaced by `.no-occurrences`: info icon 18 + `patternDetail.noOccurrences`.
  - The transactions panel shows `p.muted` „Brak transakcji do pokazania w wybranym miesiącu.” That is a literal
    with no key; it is a gap if the app adopts it.
- **Sequence**:
  - `.sequence-large[role=img][aria-label=…]` with `aria-hidden` `span.seq` children. The summary is an
    **aria-label on the sequence**, not an sr-only span.
  - The app today has an `sr-only` span with `sequenceSummary` next to the visible sequence
    (`[...key].astro`, `SequenceMark.astro`).
  - Both are announced. Moving to `role="img"` + `aria-label` is a kit-fidelity choice, not a requirement.
- **Threshold editor**:
  - Options `.threshold-switch`: fixed has „Akceptowana kwota”; frequent has „Liczba na miesiąc” / „Suma na miesiąc”.
  - Field: label `threshold.amount`/`count`, suffix `unitCurrency`/`unitCount`.
  - `#thresholdMessage.inline-alert.error` holds `invalid` / `saveError`.
  - The note is `threshold.empty`/`active`.
  - Buttons: „Ustaw próg” (no threshold) or `save`; text-button `remove` (toast „Próg usunięty.”).
  - Kit validation: only `Number(value) <= 0` gives `invalid`. The 450 ms fake save always errors and adds class
    `success` to the error alert, which is a kit demo bug, not something to copy.

#### 3.5 Actions dialog (`pattern-actions*.html`, `app.js` `modal()`)

- **Default** (`?modal=actions`):
  - Close button (aria „Zamknij”), eyebrow, h2 `title`, p `lead`. The lead appears only here.
  - `.modal-actions`: 4 ghost buttons — merge (opens the merge view), change type (immediate + toast), rename
    (opens the rename view), exclude (toast).
  - `.merged-variants`: h3 `mergedVariants`, ul, text-button `undoMerge`.
- **Merge**: a separate modal view.
  - h2 `mergeTitle`, p (literal ≠ `mergeLead`), `label.field` „Wzorzec” + select, hidden
    `.inline-alert.error` `mergeInvalid`, `btn-primary` „Scal wzorce”.
  - Merge error: the same view with the alert shown.
  - Merge empty: h2, p, `.info-panel` `mergeEmpty`, disabled ghost „Scal wzorce”.
- **Rename**: h2 `renameTitle`, `label.field` „Nowa nazwa” + `input maxlength=61`, placeholder = the current
  name, **no value**. Below it a hidden `div.field-error` `renameLong` and `btn-primary` `save`.
- The app today (`PatternActionsDialog.tsx`) keeps one dialog with in-place reveals: a merge select in the local
  `fieldBox`, direct-submit type/exclude forms, and a rename input with `maxLength={100}` and `defaultValue={name}`.
  `name` = `pattern.name` = `decision?.displayName ?? topVariant(...)` (`src/lib/patterns/derive.ts`), so the
  derived name is prefilled. That is follow-up F5: saving unchanged freezes it as `display_name`.
  - Kit fidelity for F5: no `defaultValue`. Put the current name in `placeholder`, as the kit does (`app.js`
    placeholder = name), or prefill only a stored `displayName`. Either way an untouched submit must not write the
    derived name. With an empty value, `parseDisplayName` → `null` clears the override, which is the `renameHint`
    behaviour (§1.2).
  - In-place reveal vs. separate modal views: separate views are kit fidelity but a structural change (the
    dialog's `useState`, plus the `decisionRedirect` statuses `?error=merge` / `?error=name`, which today surface
    as a page-level `decisionAlert` after the redirect, not inside the dialog). In-place sections with kit headings and
    states are the smaller step. Plan decides; either renders the kit states (empty, error).

### 4. Open copy decisions (question 4)

#### 4.1 `sequenceSummary`: plurals

- Kit: „{within} wystąpień w ramach progu, {over} ponad próg.” The noun is fixed in the genitive plural, so it
  reads „1 wystąpień” and „2 wystąpień”. The kit's own `app.js` `patternDetail()` pluralises each count in the
  aria-label. The JSON key is therefore less correct than the prototype.
- PRD: FR-008 and FR-011 say nothing about screen-reader wording.
- Precedent: K29 (`copyExtra.home.risen`). The app keeps its own grammatical template until the kit's is fixed.
- **Recommendation:** keep a `copyExtra` template in the kit's shape, „{within} {occurrences} w ramach progu,
  {over} ponad próg.”, filled with `occurrenceForms` for `within`. Today's template counts all occurrences
  (`{n}`); the kit counts the within-threshold ones (`{within}`). That changes the meaning, so the plan decides
  `within = count − over`, as in the kit. Add `DESIGN-GAP` + a new K-row (K35) for round 4 („forms for
  `sequenceSummary`”).
- What would change it: the maintainer accepting the ungrammatical kit string for screen-reader-only text.

#### 4.2 `threshold.invalid`: the validator stays

- Kit „Wpisz próg większy od zera.” covers only `≤ 0`. That is also the whole of `app.js` `saveThreshold`
  validation.
- `parseThresholdValue` (`src/lib/patterns/threshold-form.ts`) rejects more inputs:
  - counts that are not integers, or above 999 (`COUNT_MAX`);
  - money with more than 2 decimals, or above 1 000 000 zł (`MONEY_MAX_MINOR`);
  - non-numeric input.
- For those inputs the kit message is misleading (for example „1000” for a count is „greater than zero”).
- PRD: FR-010 says nothing about the message. The validator is a rule; the message is presentation.
- **Recommendation:** read `threshold.invalid` (K32 picks `threshold.*`, not `patternDetail.thresholdInvalid`) and
  leave `parseThresholdValue` and its tests untouched. Add a K-row (K36) asking the author for a range/decimals
  variant.
- Alternative: keep `copyExtra.patterns.thresholdInvalid`, which is more precise but leaves the kit. Rejected,
  because the kit is the source of truth for copy and the PRD does not contradict it.

#### 4.3 `patternActions.lead`: „…odwrócić w ustawieniach wzorca” (G33)

- The kit string is byte-identical to today's `copyExtra.patterns.actionsLead`, so the rebind changes nothing
  visible.
- The dialog is mounted only on the detail page (`src/pages/patterns/[...key].astro` imports
  `PatternActionsDialog`; no other importer in `src/`). The detail page (threshold editor + „Akcje”) is the
  pattern's settings surface in practice. Every decision is reversed there or from the list:
  - type: change it again;
  - merge: `undoMerge`;
  - rename: an empty name clears it;
  - exclude: „Przywróć” on the detail banner or in the list's „Wykluczone”.
- PRD FR-009 requires the decisions to be durable. It does not name a settings screen, so nothing contradicts the
  wording.
- **Recommendation:** read the kit key, with no `[human]` row. Narrow the G33 note in `design-kit.md` to „lead
  names no screen; read as the detail page”.
- What would change it: a product decision for a separate pattern-settings screen.

#### 4.4 The rest

| Item | Recommendation |
| --- | --- |
| „Scalenie cofnięte.” | stays `copyExtra.patterns.unmerged`; it is an `app.js` literal with no key (§1.2). Keep the `DESIGN-GAP` |
| `thresholdSum` „{amount} / miesiąc” | stays; the kit never renders a sum threshold in a row |
| `overInMonth` „Ponad progiem w {month}” | stays (G31 remainder); on the reference month `overLabel` reads `copy.dashboard.stats[0].label` (unchanged) |
| Rename limit | `{n}` = 100 in `renameLong`; `renameMaxLength` (60) unread. No migration (DB CHECK `display_name` 1–100 in `supabase/migrations/20260928120000_pattern_decisions.sql`, `parseDisplayName`) |
| `detailMissing` → `notFound` | kit text; „cofnięciu importu” matches the kit's own wording of import deletion |

### 5. Shared components and blast radius (question 5)

| Component | Importers | S-14 change | Blast radius |
| --- | --- | --- | --- |
| `src/components/ui/dialog.tsx` `DialogContent` (today `rounded-[13px] p-[31px] max-w-[480px] w-[calc(100%-40px)] max-h-[calc(100vh-32px)] overflow-auto`) | `PatternActionsDialog.tsx`, `imports/DeleteImportDialog.tsx`, `settings/DeleteAccountDialog.tsx` (none passes `className`) | kit round 3 `.modal`: `padding: 26px`; ≤ 560 px `padding: 22px 18px; width: 100%; border-radius: 12px`. Base radius stays 13px (base rule `border-radius: 13px`; only the media query says 12). `.modal-backdrop` padding 16px (base 20) ≈ the app's `w-[calc(100%-40px)]` → `w-[calc(100%-32px)]` | 3 dialogs; the visual gate shoots all three (decision 4 of `change.md`) |
| `src/components/app/field-styles.ts` `field` | `PatternsTable.tsx`, `patterns/MonthSelect.tsx` | `rounded-lg` (= 14px via `--radius-lg: var(--radius)`, `--radius: 14px` in `src/styles/global.css`) → `rounded-[8px]`; `focus-within:ring-ink/8` → `ring-ink/12` (= `--rytm-focus-ring`) + `focus-within:text-ink` (kit `color: var(--ink)`); drop the G29 comment | pattern views only |
| Focus ring `focus-visible:ring-[3px] focus-visible:ring-ink/15` | `ui/button.tsx` `buttonVariants` (site-wide), `app/BackLink.astro` (only importer `[...key].astro`), `PatternsTable.tsx` local `focusRing`, `ui/dialog.tsx` close button | follow-up F3: one shared export | the kit defines no button or link focus style (`styles.css` has no `:focus-visible` rule; `--rytm-focus-ring` is used only by `.search-field`/`.select-field:focus-within`). **Recommendation:** export `focusRing` with the **unchanged** ink/15 value from `field-styles.ts` and import it in the four places. That gives zero visual change site-wide and closes F3 |
| Form-field rings `ring-ink/8` | `auth/FormField.tsx`, `ThresholdEditor.tsx`, `PatternActionsDialog.tsx` `fieldBox`, `settings/DeleteAccountDialog.tsx` | none on the value: the kit `.field input:focus` is `rgba(32,47,64,.08)` = ink/8. F11 / S-05 F4: `fieldBox` duplicates the ThresholdEditor box, so the plan can extract one `fieldBox` export (8px, `bg-paper` = `--rytm-field`) and drop the two G32 comments (S-12 F1) | pattern components |
| `src/components/app/Badge.tsx` | `PatternsTable.tsx`, `[...key].astro`, `fixed.astro` | `new` `bg-excess/25` → `bg-excess/18` (= `--rytm-badge-soft`); add `changed` with the same classes; drop the G28 note | `/fixed` „nowy” badge tint changes slightly (intended; S-06 follow-up) |
| `merchant-mark.ts` | `PatternsTable.tsx` | value already `bg-paper-soft` = `--rytm-merchant-mark`; comment only | none |

Colour rule check: every new value above is expressed with the allowed Tailwind names (`ink`, `excess`,
`excess-text`, `paper`, `paper-soft`, `line`) plus an opacity. Per `src/styles/brand.css`, `--rytm-ink` is
`#202F40` (rgb 32,47,64) and `--rytm-excess` is `#C79D62` (rgb 199,157,98), so `ink/12` and `excess/18` reproduce
the kit tokens exactly.

### 6. Status badges and the `/patterns` 500 (question 6)

- `fixedOverview(patterns, rows)` (`src/lib/patterns/fixed.ts`) returns `changed[]`, `new[]` and `unchanged[]`.
  Each row carries `key`.
  - It covers non-excluded `fixed` patterns that occur in the reference month.
  - `new` needs `hasComparison` and wins over `changed`.
- `src/pages/patterns.astro` calls `loadPatternData` once and already holds `dataResult.patterns` /
  `dataResult.rows`, the inputs of `listOverview`. A `Map<key, "new" | "changed">` built from `fixedOverview` on
  the same arrays needs **no second read**. `/home` already calls both on one `loadPatternData` result. This
  confirms `change.md` decision 2: no split needed.
- Semantics: the kit badge is per row. The app's sets are relative to the reference month (the latest month in
  the data) versus the previous month, the same as `/fixed`. The list covers „wszystkie miesiące”, so the badge
  reads as „in the latest month”. That is presentation, with no new rule.
- No `try` around assembly: `patterns.astro` (`listOverview`), `[...key].astro` (`patternDetail`) and
  `fixed.astro` (`fixedOverview`) are all unwrapped.
  - `patternTxs` throws on id drift, which becomes a 500.
  - `home.astro` wraps its whole assembly in one `try`; the `catch` logs `console.error` and renders
    `copy.components.error`. Its header comment says `/patterns` and `/fixed` were „not retrofitted”.
  - Wrapping `listOverview` + `fixedOverview` in `patterns.astro` the same way is the triggered follow-up.
    `[...key].astro` is optional, in the same pattern. `fixed.astro` is S-15.

## Code References

- `src/content/copy.ts` `copyExtra.patterns`: the 56 leaves of §1
- `design/rytm-os/react-kit/docs/content.json` `patterns`, `patternDetail`, `threshold`, `patternActions`, `components`
- `design/rytm-os/prototype/app.js` `patterns()`, `patternRows()`, `showMorePatterns()`, `bindInteractions`, `badge()`, `patternDetail()`, `thresholdEditor()`, `saveThreshold`, `modal()` (default / `merge` / `mergeEmpty` / `rename`), `emptyView('patterns')`
- `design/rytm-os/prototype/styles.css` `.modal` (base + „Runda 3” override + `@media(max-width:560px)`), `.search-field:focus-within,.select-field:focus-within`, `.field input:focus`, `.badge.new/.changed`, `.merchant-mark`, `.table-foot`
- `src/pages/patterns.astro`: `tableCopy`, `resultAlert`, `visibleItems`, `listOverview` call (no `try`)
- `src/pages/patterns/[...key].astro`: `sumLabel`, `overLabel`, `sequenceSummary` (sr-only span), `editorCopy`, `actionsCopy`, `resultAlert`, `decisionAlert`, `unmergeClass`, the 404 branch
- `src/components/patterns/PatternsTable.tsx`: `PatternsTableCopy`, `thresholdLabel`, local `focusRing`, `useMemo` search/sort, footer count
- `src/components/patterns/PatternActionsDialog.tsx`: `PatternActionsCopy`, `fieldBox`, rename `defaultValue={name}`
- `src/components/patterns/ThresholdEditor.tsx`: input-suffix box (G32 comment)
- `src/components/patterns/ExcludedPatterns.astro`, `RestoreForm.astro`, `MonthSelect.tsx`, `merchant-mark.ts`
- `src/components/ui/dialog.tsx` `DialogContent`, `src/components/ui/button.tsx` `buttonVariants`, `src/components/app/{field-styles.ts,BackLink.astro,Badge.tsx,ViewEmpty.astro,SequenceMark.astro}`
- `src/lib/patterns/table-columns.ts` `tableHeaders`, `BODY_ORDER`; `src/lib/patterns/fixed.ts` `fixedOverview`; `src/lib/patterns/derive.ts` (pattern `name`); `src/lib/patterns/threshold-form.ts` `parseThresholdValue`; `src/lib/patterns/decision-form.ts` `parseDisplayName`, `decisionRedirect`; `src/lib/format.ts` `fillMonthLocative`
- `src/pages/home.astro`: the single `try` around `overLimitTrend` / `fixedOverview` / `homeStats` (the pattern for §6)
- `scripts/smoke.mjs` `steps` (§2); `test/unit/{table-columns,kit-contract,threshold-form,decision-form,format}.test.ts`
- `src/styles/brand.css` `:root` (`--rytm-focus-ring`, `--rytm-badge-soft`, `--rytm-merchant-mark`, `--rytm-field`); `src/styles/global.css` `--radius`, `--radius-lg`

## Architecture Insights

- `copy` is the raw JSON module, so a rebind is a type-checked property path. Index reads (`columns[i]`,
  `stats[0]`) remain the blind spot (intake research). After the column swap `PatternsTable` can read
  `copy.patterns.columns` in kit order with no index mapping.
- Copy reaches the React islands only through typed props (`PatternsTableCopy`, `PatternActionsCopy`, the editor's
  copy object). The rebind is therefore mostly in the two `.astro` pages, plus prop-type field renames where a
  role changes (merge/rename headings).
- Templates are filled by chained `.replace` at the page, and month templates go through `fillMonthLocative`
  (K30). `renameLong {n}` follows the same convention.
- Pattern pages are PRG: decisions and threshold saves redirect with a status param, and the page renders the
  alert. Kit in-dialog errors (`mergeInvalid`, `renameLong`) map onto that by reopening or rendering in context.
  The plan chooses where.

## Historical Context (from prior changes)

- `context/archive/2026-10-02-kit-round-3-intake/research.md`. Its patterns copy map agrees with §1 on the leaves it
  names that were re-checked here (`sumLabel`, `renamed`, `mergeInvalid`, `thresholdInvalid`, `mergeNone`,
  `nameInvalid`, `decisionError`, `detailMissing`). Its `sequenceSummary` → `patternDetail.sequenceSummary` line is now superseded by §4.1 (keep
  plurals). Its K31 recommendation (100) is confirmed.
- `context/archive/2026-10-03-kit-round-3-auth-settings/follow-ups/review-fixes.md`. F1 (field 8px, G32 comments)
  and F2 (`DialogContent` round 3) name S-14 and are covered in §5. S-12 already set the dialog field to
  `rounded-[8px] bg-paper`.
- `context/archive/2026-09-28-durable-pattern-decisions/follow-ups/review-fixes.md`. F5 (rename prefill) is
  covered in §3.5. F6/F7 are out of scope, per `change.md` decision 5.
- `context/archive/2026-09-28-fixed-cost-changes`: status badges + `Badge` `changed` tone + `patternTxs` 500, all
  covered in §3.3, §5 and §6.
- `context/archive/2026-09-27-pattern-threshold-over-limit` F3 (one focus-ring export), covered in §5.

## Related Research

- `context/archive/2026-10-02-kit-round-3-intake/research.md`
- `context/archive/2026-10-03-kit-round-3-auth-settings/research.md` (dialog `.modal` styles, §5 there)

## Open Questions

These are plan choices, not missing evidence:
1. The „Pokaż więcej” page size (≥ 4), and whether a new search collapses the list back.
2. The actions dialog: in-place sections or kit-style separate views (§3.5). The rename field: kit placeholder =
   current name with an empty value, or prefill the stored `displayName` only (F5).
3. The not-found layout: extend `ViewEmpty.astro` or use a plain `Panel` (§3.4). The no-occurrences transactions
   line „Brak transakcji do pokazania w wybranym miesiącu.” is an `app.js` literal: adopt it as `copyExtra` with a
   gap note, or omit it.
4. The sequence: `role="img"` + `aria-label` like the kit, or keep the `sr-only` span.
5. New K-rows for `design-kit.md`: K35 (`sequenceSummary` forms), K36 (`threshold.invalid` range/decimals). Also
   the narrowed G33 note on `patternActions.lead`.
