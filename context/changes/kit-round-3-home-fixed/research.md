---
date: 2026-10-03T15:32:45+02:00
researcher: Claude (autonomous run 2026-10-02-kit-round-3, step /10x-research)
git_commit: b06933f
branch: feat/kit-round-3-home-fixed
repository: Rytm
topic: "S-15 kit-round-3-home-fixed — /home and /fixed against round-3 kit; copyExtra closing audit"
tags: [research, home, fixed, trend, copy, design-kit, copyExtra]
status: complete
last_updated: 2026-10-03
last_updated_by: Claude (autonomous run, /10x-research)
---

# Research: S-15 `kit-round-3-home-fixed`

**Date**: 2026-10-03T15:32:45+02:00 · **Git Commit**: `b06933f` · **Branch**: `feat/kit-round-3-home-fixed` · **Repository**: Rytm

## Research Question

Derived from `change.md` (no human in the loop): (1) bind `/home` and `/fixed` to the round-3 kit — which kit
structure, keys and literals apply, and which open mappings (`change.md` § Roadmap claims vs repo, handoff §5) resolve
how; (2) does removing the home `ImportPanel` or the second stat card conflict with the PRD or an existing user path
(first-import entry, demo)? (3) state of the triggered follow-ups (S-14 F8/F9, `fixed.astro` `try`, `FixedSection`
`compact`, `monthIndex`, `PanelTitle`); (4) the full `copyExtra` audit for the closing phase: every leaf, its reader,
and whether the kit now provides it.

## Summary

- **Kit `/home` (round 3)** = title row with „+ Wgraj CSV” → ONE accent stat card (`.stats.stats-single`) → full-width
  trend panel → `.panel.dashboard-fixed` summary („Koszty stałe”, link „Zobacz zmiany” → `#/fixed`, two
  `.fixed-summary-row`s „Podrożały · 2 koszty”, „Nowe · 1 koszt”). No `.import-panel` in `prototype/app.js`
  `dashboard()`, in any of the 4 home views (`home`, `home-no-name`, `home-empty`, `home-demo`), in
  `react-kit/docs/routes.md` or `copy-map.md`; `dashboard.importTitle/importBody` and `dashboard.stats[1]` are orphan
  keys in `react-kit/docs/content.json`. Decisions A2/A3 in `change.md` are confirmed by the kit (detail § 1).
- **PRD check** — see § 2: removal of `ImportPanel` and the second card conflicts with no PRD clause found; the
  import entry survives in the title-row button, the nav and the pre-import empty state.
- **Trend** (§ 3): `trendChart()` reads no `content.json` key; legend chips „Cienka kreska oznacza 0,00 zł” and
  „Brak progu” are unconditional literals with no key of the same text; kit min bar height is 8 % (app 12 %).
- **`/fixed`** (§ 4): kit keeps all three sections in every state and puts `noComparison` (under the title) and
  `noChanges`/`noNew` (in `.fixed-empty-states`, after the last section) as `.info-panel`s; error = `.inline-alert`
  under the title with `fixedCosts.readError` text, sections still drawn. `fixedCosts.decreased` is rendered nowhere.
- **Follow-ups** (§ 5) and the **`copyExtra` audit** (§ 6) follow.

## 1. Kit binding — `/home`

Source: `design/rytm-os/prototype/app.js` `dashboard(empty=false, showName=true)` (router: `#/home` → `dashboard()`,
`#/home-empty` → `dashboard(true)`, `#/home-no-name` → `dashboard(false,false)`), `applyDashboardState()` (only
re-sets the no-name `h1`/lead), CSS `design/rytm-os/prototype/styles.css`. `content.json` lives at
`design/rytm-os/react-kit/docs/content.json` (no root `docs/content.json`).

| Kit element (data branch, in order) | Kit markup / copy | `content.json` key | App today (`src/pages/home.astro`) | Binding |
| --- | --- | --- | --- | --- |
| Title row | `.dash-title`: eyebrow „Przegląd miesiąca”, `h1` „Dzień dobry.”, lead „Twój maj w jednym spokojnym widoku.”, `a.btn.btn-primary` „+ Wgraj CSV” → `#/imports/new` | `dashboard.eyebrow`, `greetingNoName`, `descriptionNoName` „Twój {month} w jednym spokojnym widoku.”; button: no key | `PageTitle` + `leadFor` (reads `copyExtra.home.lead`, byte-identical to `descriptionNoName`); button `copyExtra.patterns.upload` | rebind lead to `dashboard.descriptionNoName`; button stays `copyExtra.patterns.upload` (no dashboard key) |
| Stats | `.stats.stats-single` → one `article.stat-card.accent`: „Ponad progiem w tym miesiącu” / „284,40 zł” / „+42,20 zł względem kwietnia”. `stat-card` occurs once in `app.js` | `dashboard.stats[0].label`, `.foot` „{delta} względem {month}” | two `StatCard`s in `grid-cols-[1.2fr_1fr]` | one card; foot rebinds to `dashboard.stats[0].foot` (byte-identical to `copyExtra.home.deltaFoot`); grid → kit `.stats-single{grid-template-columns:minmax(260px,380px);margin-bottom:16px}` (≤ 360 px `minmax(0,1fr)`) |
| Trend | `section.panel.dashboard-trend` → `.panel-title` (`h2` „Ponad progiem”, `span` „miesięcznie · wszystkie dane”) + `trendChart()` | `trend.title`, `trend.range` | `Panel` + inline title markup + `TrendChart` | unchanged layout (`.dashboard-trend{width:100%;margin-top:0}`); copy § 3 |
| Fixed summary | `section.panel.dashboard-fixed` → `.panel-title` (`h2` „Koszty stałe”, `a.text-link` „Zobacz zmiany” → `#/fixed`) + `.fixed-summary-row` `<span>Podrożały</span><strong>2 koszty</strong>` + `.fixed-summary-row` `<span>Nowe</span><strong>1 koszt</strong>` | title „Koszty stałe” = `dashboard.stats[1].label` = `app.fixedLong` (both „Koszty stałe”; `app.fixedLong` is the nav label, `stats[1].label` the dashboard one — prefer `dashboard.stats[1].label`, the dashboard namespace per `copy-map.md` row `home`); „Zobacz zmiany”, „Podrożały”, „Nowe”, „koszt/koszty/kosztów”: **no key** (counts are hard-coded literals, `pluralPL` not called) | not built; `ImportPanel` sits here | new panel; data `homeStats().fixedRisen` and `fixedOverview().new.length`; literals → `copyExtra.home` + `DESIGN-GAP` + gap row; noun forms need a 3-form array for `plural()` (kit shows only „koszt”, „koszty”; „kosztów” is the regular genitive plural — inference, record as gap) |
| Import panel | **absent** | `dashboard.importTitle` „Dodaj najnowszy wyciąg”, `importBody` — orphans; CSS `.import-panel` survives in `styles.css` (round-1 leftover) | `ImportPanel` | remove (A3) |

CSS for the new panel (quoted from `styles.css`): `.dashboard-fixed{width:100%;margin-top:15px;display:grid;
grid-template-columns:1fr 1fr;gap:12px}`, `.dashboard-fixed .panel-title{grid-column:1/-1;margin-bottom:2px}`, ≤ 560 px
`.dashboard-fixed{grid-template-columns:1fr}`; `.fixed-summary-row{display:flex;justify-content:space-between;
align-items:center;border-top:1px solid var(--line);padding:13px 0;font-size:13px;color:var(--muted)}`,
`.fixed-summary-row strong{color:var(--ink)}`. So the two rows sit side by side at ≥ 561 px, stacked below.

**`.panel-title` vs `.section-label`** (`styles.css`): identical `h2` (17 px, `margin:0`, `letter-spacing:-.03em`) and
`span` (12 px muted); they differ only in `align-items` (`start` vs `center`) and `margin-bottom` (20 px vs 9 px).
One `PanelTitle.astro` with a variant/`class` prop fits both (decision 5 in `change.md` holds); the app today already
renders both inline with these exact values (`home.astro` trend title `mb-5 … items-start`, `FixedSection.astro`
`mb-[9px] … items-center`).

**Demo** (`home-demo.html` → `#/home?demo=1`): `demoMode` only adds `appShell`'s `.demo-notice`; the dashboard body and
its „+ Wgraj CSV” button are unchanged (not disabled) in the kit. No home-specific demo work.

**Pre-import** (`home-empty.html`): kit literals equal `content.json` `home.emptyEyebrow/emptyTitle/emptyLead/
emptyIllustrationAlt` — rebind from the `copyExtra.home` duplicates; body/CTA already `copy.emptyState.*`.

**No home read-error view** in the kit (the CHANGELOG line „Puste dane i błąd odczytu dostały odrębne komunikaty”
has no dashboard counterpart in `app.js`; the only „Nie udało się wczytać” string is `fixedCosts`'). `/home` keeps
`components.error`.

**Summary-panel data — „Podrożały” semantics.** `homeStats().fixedRisen` (`src/lib/patterns/home.ts` `homeStats`)
counts `fixed.changed` rows with `deltaMinor > 0` only. The kit sample „2 koszty” has no rule behind it: it equals
`content.json` `fixedCosts.counts.changed: 2` (all changed rows, one of which in the `fixedCosts()` sample is a
decrease, CloudBox „−5,00 zł · spadek”). The label „Podrożały” means „went up”; counting decreases under it would
be false. Recommendation: keep rises only (`fixedRisen`, S-07 plan decision 6 formula, PRD Success Criteria Primary
„które podrożały”). „Nowe” = `fixedOverview().new.length` (empty when `hasComparison` is false, PRD US-04 AC).

## 2. PRD and user-path check — removing `ImportPanel` and the second stat card

**PRD** (`context/foundation/prd.md`): no clause names `/home`, a dashboard or an overview. FR-011 (sum „ponad progiem
w tym miesiącu”), FR-012 (which fixed patterns changed / are new), FR-013 (monthly trend), US-04, US-05, Success
Criteria Primary („Dla wzorców stałych aplikacja wskazuje, które podrożały i które są nowe względem poprzedniego
okresu”) and MVP flow step 6 („widzi, które podrożały i które są nowe”) are the only ones touching what `/home`
shows. Searched for a fixed-cost total, an import prompt / „najnowszy wyciąg” / next-month reminder: none. FR-003
(upload + result), the persona („raz w miesiącu”) and FR-014 (demo on seed data) do not place the import entry on
`/home`. The S-07 research reached the same verdict (`context/archive/2026-09-28-over-limit-trend/research.md`,
„Undefined `/home` figures”). **Verdict: no conflict; the PRD is silent on both elements.** The new summary rows map
onto Success Criteria Primary more directly than the removed card did.

**History** (`context/archive/2026-09-28-over-limit-trend/`): both elements came from S-07 copying the round-1/2 kit —
`research.md` scope table („Import panel … IN (static)”, PRD column empty; „Koszty stałe” value: „silent … Plan
decides”); `plan.md` decision 6 (total = Σ `/fixed` rows, `[human]` row 4.11 **left unchecked**) and Phase 4 (import
panel). `plan-review.md` F3: the total is inflated by one-off merchants D5 types `fixed` — removing the total removes
that symptom from `/home` (the same merchants still count in „Nowe”, out of scope per `change.md` decision 6). The F-04
visual review (`context/archive/2026-10-02-kit-round-3-intake/reviews/visual-review.md`, observation 1) already
logged „2 cards + import panel vs 1 card + »Koszty stałe« panel” for S-15.

**User paths to `/imports/new` after removal** (all present today, none depends on `ImportPanel`):
`home.astro` data branch `PageTitle` slot („+ Wgraj CSV”, `copyExtra.patterns.upload`); pre-import `EmptyState`
(`copy.emptyState.cta`); `ViewEmpty` CTAs on `/patterns`, `/fixed`, `/imports`; `/patterns` and `/imports` title
buttons; Sidebar / `MobileNav` link to `/imports` (no direct `/imports/new` nav link). The `/home` error branch had
no CTA before and has none after.

**Demo**: `home.astro` has no demo branching; `ImportPanel` and the title button are plain links. The demo block is
in `src/pages/imports/new.astro` (`demoLocked = isDemoEmail(...) && !demoImportAllowed(...)`, `src/lib/demo.ts`),
`ImportWizard.tsx` (`flow.demoImportBlocked`) and `/api/imports`. Kit `home-demo.html` keeps the button enabled too.
Removal changes nothing for demo users.

**Readers that go with the removal** (grep `src/`, `test/`, `scripts/`): `ImportPanel` → `home.astro` only;
`dashboard.importTitle/importBody` → `home.astro` only; `dashboard.stats[1].label` → second card only;
`copyExtra.home.risen/risenForms` → `home.astro` `risenFootFor` only; `HomeStats.fixedTotalMinor` → second card value
only (+ `test/unit/home-stats.test.ts` cases „empty” `toEqual`, „fixed total sums every row…”, F-02 fixture case
expecting 175298). Plan chooses: drop the field and rewrite those three cases, or keep it unused (dead field —
recommend drop).

**Smoke** (`scripts/smoke.mjs`, by step name):

| Step | Pinned | Effect |
| --- | --- | --- |
| „home offers the next import” | `>Dodaj najnowszy wyciąg<` | breaks on removal → invert/replace with a summary-panel step |
| „home counts fixed costs that rose” | `>1 pozycja podrożała<`, `>67,99 zł<` | breaks on removal → replace (e.g. `>Podrożały<` + `>1 koszt<`) |
| „home before import has no trend” | notContains `>Dodaj najnowszy wyciąg<` | becomes vacuous → retarget (e.g. `>Zobacz zmiany<`) |
| „home has no comparison with one month” | notContains `względem` | stays valid only if no new string contains „względem” |
| „home compares with the previous month” | `>+1,50 zł względem maja<` | unchanged by the rebind (`dashboard.stats[0].foot` is byte-identical to `copyExtra.home.deltaFoot`) |
| „home shows the trend without a threshold” / „home shows the over-limit sum” | „Ustaw próg na wzorcu, a tu pojawi się suma ponad progiem.” (contains / notContains) | move with any `noThreshold` change (§ 3) |
| „fixed with one month lists no change” / „fixed lists a changed amount” | `>Żaden koszt stały nie zmienił kwoty w tym miesiącu.<` | move to `fixedCosts.noChanges` text |
| „fixed without a previous month says so” / „fixed compares with the previous month” | `>Nie ma poprzedniego miesiąca do porównania.<` | move to `fixedCosts.noComparison` text |
| header comment of `smoke.mjs` | „no import panel”, „Koszty stałe card's total and podrożała count” | stale → rewrite |

No smoke step pins `newEmpty` / `unchangedEmpty`. No Playwright / e2e suite exists in the repo.

## 3. Trend — `trendChart()` vs `TrendChart.astro`

Kit source (`prototype/app.js` `trendChart()`), quoted:
`const max=Math.max(1,...)`; per month `<div class="trend-column"><span class="trend-value">${money(v)}</span><i
class="tbar ${v===0?'zero':''}" style="height:${v===0?'2px':Math.max(8,v/max*100)+'%'}" role="img"
aria-label="${label}: ${money(v)} ponad próg"></i><span class="trend-month">${label}</span></div>`; group
`role="group" aria-label="Miesięczna suma ponad progiem"`; legend `<span><i class="dot"></i> suma ponad progiem</span>
<span class="trend-zero-note">Cienka kreska oznacza 0,00 zł</span><span class="trend-no-threshold" title="Brak progu:
nie ustawiono granicy dla wzorca.">Brak progu</span>`. **`trendChart()` reads no `content.json` key**; both legend
chips render **unconditionally** (static sample, no zero month in it); no `.trend-no-threshold` CSS rule exists; no
„za krótki trend” state exists in `app.js`.

`content.json` `trend.*`: `title`, `range`, `legend` (= literals), `current` „Bieżący miesiąc” (unused, C4),
`tooShort` „Trend pojawi się po {n} miesiącach danych.”, `noThreshold` „Brak ustawionego progu”, `zero` and
`zeroMarker` „Brak kwoty ponad próg”, `amountLabel` „{amount} ponad próg”, `gridLabel` „Suma ponad progiem”,
`minimumMonths` 3.

| Item | Kit | App (`TrendChart.astro`, `home.astro` `barsFor`) | Recommendation |
| --- | --- | --- | --- |
| Min non-zero bar | 8 % (`Math.max(8,…)`) | 12 % (`src/lib/patterns/trend.ts` `trendBarHeight`, pinned by `test/unit/over-limit-trend.test.ts` `describe("trendBarHeight")` case `[10, 1000, 12]`) | 8 % — kit geometry, no PRD stake; update the unit case (a value change, not a weakened assertion) |
| Zero bar | `2px`, class `zero`, colour `--rytm-sequence-soft` (= `--rytm-line`) | `h-[2px]`, `bg-muted/55` | keep 2 px; colour `bg-line` |
| Bar colour | `.trend-column .tbar{background:var(--rytm-sequence)}`, `--rytm-sequence: var(--rytm-muted)` (`src/styles/brand.css`) | `bg-muted/55` (round-1/2 `#9aaab3` nearest-token, G35 note) | `bg-muted` — exact token now; the G35 bar-grey part closes. Legend `.dot` stays raw `#9aaab3` in kit CSS (unchanged rule) — keep `bg-muted/55` or align to `bg-muted`; plan picks, visual gate checks |
| Sum above bar | `.trend-value{font-size:11px;color:var(--ink);font-weight:700}` (9 px ≤ 560, 8 px ≤ 360, wraps) | `text-[10px] text-muted`, `whitespace-nowrap` | adopt kit type; keep `nowrap` + `min-w-[44px]` + scroll (G35 decisions for long axes, no kit counter-rule at 12 months) — plan/visual gate |
| Bar accessible name | `role="img"` + `aria-label="{label}: {money} ponad próg"` | none on the bar; the `<li>` text is amount + label | bind `trend.amountLabel` („{amount} ponad próg”) — kit key exists; `{label}: ` prefix is kit markup |
| Group name | literal „Miesięczna suma ponad progiem” | `ariaLabel={copy.trend.title}` („Ponad progiem”) | `trend.gridLabel` „Suma ponad progiem” is the nearest key (not the same text) — use the key (rule: copy from `content.json`; the literal has no key) |
| Zero note | legend `.trend-zero-note` literal „Cienka kreska oznacza 0,00 zł”, `margin-left:auto` | absent | literal has no key; `trend.zero`/`zeroMarker` „Brak kwoty ponad próg” have a different meaning (a name for the zero mark, not an explanation of it). Recommend: legend note from `copyExtra.home` (kit literal verbatim) + `DESIGN-GAP` + gap row; render it when at least one bar is 0 (US-05 AC „Miesiąc bez transakcji ponad progiem pokazuje 0” — the note explains the mark); zero bar's name via `trend.zeroMarker` |
| „Brak progu” | legend chip literal „Brak progu”, `title` literal | info panel `copyExtra.home.noThreshold` („Ustaw próg na wzorcu, a tu pojawi się suma ponad progiem.”, G35 placeholder) when `!trend.hasThreshold` | Kit now draws the state → the info panel and its `copyExtra` leaf go. Chip text: `trend.noThreshold` „Brak ustawionego progu” (key, same meaning) vs literal „Brak progu” — recommend the key (contract rule „copy from `content.json`”; the `title` literal then has no carrier — drop it, no tooltip). Show only when `!hasThreshold` (an always-on „no threshold” chip would be false for users with thresholds). Smoke pins move |
| Too short | none in `app.js` | info panel `trend.tooShort` with `minimumMonths` | keep (kit key, US-05 / roadmap) |

Reversal: if the visual gate shows the bare chip leaves the all-zero chart unexplained, keep the info panel as a
`DESIGN-GAP` (this is the US-05 „no threshold at all” check `change.md` § Kit binding asked for — PRD US-05 does not
name a „no threshold” message; FR-010/FR-013 only need the 0 sums, which render).

## 4. `/fixed` — `fixedCosts(state)` vs `fixed.astro`

Kit (`prototype/app.js` `fixedCosts(state='')`, views `fixed`, `fixed-no-month`, `fixed-no-changes`, `fixed-no-new`,
`fixed-error`; `fixed-empty` → `emptyView('fixed')`): header eyebrow „Koszty stałe”, `h1` „Co zmieniło się samo?”, lead
„Rytm porównuje miesiące kalendarzowe i pokazuje różnice.”; **all three sections render in every state** (static
sample rows stay even in `no-changes` / `no-new` / `error`); state messages:

- `error` → `.inline-alert.error` (warning icon) „Nie udało się wczytać kosztów stałych. Odśwież widok.” under the
  header, before the sections.
- `no-month` → `.info-panel` „Brak poprzedniego miesiąca do porównania.” under the header, before the sections.
- `no-changes` / `no-new` → `.info-panel` inside `section.fixed-empty-states` **after the last section**
  (`.fixed-empty-states{display:none}`, `:not(:empty){display:grid;gap:10px;margin-top:12px}`).

Rows: changed `small` „20.05.2026 · poprzednio 49,00 zł”, `b.increase` „+6,00 zł · wzrost” / `b.decrease` „−5,00 zł ·
spadek” (U+2212); new `small` „pierwsze wystąpienie · 15.05.2026” + `badge('nowy','new')`; unchanged in
`.fixed-list.panel.compact` (`.compact .fixed-row{min-height:55px}` vs 70 px). Counts are literals („2 pozycje”).
CSS `.decrease{color:var(--green)!important}`, `.increase{color:var(--excess-dark)}`.

`content.json` `fixedCosts.*`: `title`, `changed`, `new` „Nowe w {month}”, `unchanged`, `decreased` „Obniżona kwota”
(**rendered nowhere** in `app.js`), `noChanges`, `noNew`, `noComparison`, `readError`, `itemForms`, `counts`,
`unchangedForms` (= `itemForms`).

| Item | Recommendation |
| --- | --- |
| Error | `fixed.astro`: wrap `fixedOverview` in `try` (shape of `home.astro`'s `result` IIFE); alert text `fixedCosts.readError`; title/lead kept. Do NOT draw the three sections on error — the kit's static sample rows under an error are a prototype artefact; drawing sections from failed data would invent content (PRD-safe reading, K18 precedent). |
| No comparison month | `fixedCosts.noComparison` as an `.info-panel` under the title (kit placement). The „Nowe” section stays (kit draws it in every state) with count „0 pozycji” and no second empty line inside it — one message, not two. PRD US-04 AC („lista nowych … pusta z komunikatem”) is met by either placement |
| Empty changed / new | `fixedCosts.noChanges` / `fixedCosts.noNew` as `.info-panel`s in a `.fixed-empty-states` block after the last section (kit placement). The empty section keeps heading + count; its list panel is omitted (the kit never draws an empty list panel — its sample rows stay, which a real view cannot do). Plan decision; visual gate confirms |
| Empty unchanged | no kit key/state → keep `copyExtra.fixed.unchangedEmpty` in-section + `DESIGN-GAP` (gap row) |
| Delta | `formatSignedMoney(delta)` + suffix „ · wzrost” / „ · spadek” (`app.js` literals, no key) → `copyExtra.fixed` + `DESIGN-GAP`. `fixedCosts.decreased` „Obniżona kwota” is not the suffix (different text, not rendered by the kit) → not read; record. Colour: `text-excess-text` / `text-green` — drop the „DESIGN-GAP: G34” comment on `deltaClass` (kit defines both). Smoke `fixed lists a changed amount` pins `>+1,50 zł<` — a suffix inside the same `<b>` changes the node text → pin moves |
| Count | `fixedCosts.itemForms` (byte-identical to `copyExtra.fixed.itemForms`); `count` template „{n} {items}” stays `copyExtra` (no key) or inlines |
| Eyebrow | `app.fixedLong` (= `copyExtra.fixed.eyebrow` byte for byte) |
| `compact` | `FixedSection` `compact` → give it the kit meaning (shorter rows) or drop it; rows already get 55 px via `FixedRow compact` — dropping the section prop is the smaller change |

## 5. Triggered follow-ups — current state

| Follow-up | Evidence on the branch | Take |
| --- | --- | --- |
| `fixed.astro` `try` (S-14, `2026-09-28-fixed-cost-changes`) | `src/pages/fixed.astro` `result` IIFE calls `fixedOverview(...)` with no `try`; `home.astro` `result` wraps `overLimitTrend`/`fixedOverview`/`homeStats` in `try … catch (err) { return { error: err } }` | copy the `home.astro` shape; alert → `fixedCosts.readError` |
| S-14 F8 (`context/archive/2026-10-03-kit-round-3-patterns/follow-ups/review-fixes.md`) | `src/pages/patterns/[...key].astro` frontmatter: `detailTarget(...)`, `patternDetail(...)`, `sequenceLabel(...)` run unguarded after the `readError` check | wrap the assembly (from `detailTarget` to `sequenceSummary`) so a throw takes the existing `readError` branch (`components.error`); note the `Astro.redirect` / 404 returns inside — the `try` must not swallow them (redirects are `return`s, not throws, so a try/catch around pure calls is safe) |
| S-14 F9 | `home.astro` comment above `leadFor` cites „`patterns.astro` `sumLabel` precedent” — `sumLabel` lives in `patterns/[...key].astro`, and is a `fillMonthLocative` call | rewrite with the lead rebind |
| Month-index parse in two styles | `home.astro` `monthIndex` (`Number(yearMonth.split("-")[1]) - 1`) vs `src/lib/format.ts` `fillMonthLocative` (`Number(yearMonth.slice(5, 7)) - 1`) | export one `monthIndex(yearMonth)` from `src/lib/format.ts`, used by both |
| Panel-title markup inline | 6 sites with `text-[17px] tracking-[-0.03em]` `h2`: `home.astro` (trend), `FixedSection.astro`, `settings.astro` (×1), `patterns/[...key].astro` (×3) | `PanelTitle.astro` for the 2 `/home` panels (`.panel-title`: `items-start mb-5`; summary panel override `mb-[2px]` + `col-span-full`) and `FixedSection` (`.section-label`: `items-center mb-[9px]`) — § 1 shows one component with a variant fits; other 4 sites stay, follow-up stays open |
| `FixedSection` `compact` | prop only adds the bare class `compact` (no CSS for it in the app) | drop it (§ 4) |
| G36 (`2026-09-28-over-limit-trend`) | kit C5 omits „Rozpoznane wydatki” / „Co wraca najczęściej” permanently | tick, no code |
| `copyExtra.fixed.noComparison` smoke string (F-04) | `scripts/smoke.mjs` „fixed without a previous month says so” | moves with the rebind (§ 2 table) |
| One-off merchants as „nowy” | condition met (new „Nowe” row on `/home`) | out of scope (classifier rule); `[human]` row |

## 6. `copyExtra` closing audit (every leaf)

Method: `src/content/copy.ts` (`copy` = `design/rytm-os/react-kit/docs/content.json`, `copyExtra` = gap object; 7
namespaces: `auth`, `home`, `imports`, `patterns`, `fixed`, `settings`, `emptyViews` — no `app`). Readers found by
grep over `src/`, `test/`, `scripts/` including the per-file aliases (`const x = copyExtra.<ns>`, `const h =
copyExtra.home`, props into `ImportWizard.tsx`, `PatternsTable.tsx`, `DeleteAccountDialog.tsx`). Kit meaning checked
against all flattened `content.json` leaves (not only exact text). Spot-verified in this step: `auth.resetVisual`,
`importFlow.debitForms`, `imports.santanderAccountName`, `fixedCosts.itemForms`, `home.*`, `app.fixedLong`,
`components.*` values. **Dead leaves: none** (every leaf has ≥ 1 reader in `src/`).

Legend — Kit: **BI** byte-identical key exists · **SM** same meaning, different text · **—** no key. Verdict:
**drop** (rebind, no visible change) · **rebind-S15** (visible change in an S-15 view) · **keep** (true gap; keeps or
gets `DESIGN-GAP` + gap row) · **follow-up** (rebind possible in a non-S-15 view; decision 7 of `change.md`).

### 6a. `home`, `fixed`, `emptyViews` (S-15 views)

| Leaf | Reader | Kit | Verdict |
| --- | --- | --- | --- |
| `home.emptyEyebrow` / `emptyTitle` / `emptyLead` / `emptyIllustrationAlt` | `home.astro` empty branch | `home.*` BI (4) | drop |
| `home.lead` | `home.astro` `leadFor` | `dashboard.descriptionNoName` BI (K24 delivered) | drop |
| `home.monthsNominative` | `home.astro` `leadFor` | — (12 nominatives exist only as keys of the `patternDetail.monthNames` object) | keep (K25-style, K24 `{month}` needs a nominative). Option: derive from `Object.keys(copy.patternDetail.monthNames)` — keys are the nominatives; plan decides (key order is JSON insertion order) |
| `home.monthsGenitive` | `home.astro` `deltaFootFor` | — | keep (K25) |
| `home.deltaFoot` | `home.astro` `deltaFootFor` | `dashboard.stats[0].foot` BI | drop |
| `home.risen` / `risenForms` | `home.astro` `risenFootFor` | `dashboard.stats[1].foot` SM (wrong for n = 1, K29) | delete with the second card |
| `home.noThreshold` | `home.astro` trend `hint` | `trend.noThreshold` SM | rebind-S15 (§ 3: legend chip) — leaf deleted |
| new: summary-panel literals „Zobacz zmiany”, „Podrożały”, „Nowe”, forms `koszt/koszty/kosztów`; legend „Cienka kreska oznacza 0,00 zł”; delta suffixes „wzrost” / „spadek” | to be added | — (all `app.js` literals) | keep — new `copyExtra` leaves + `DESIGN-GAP` + gap row(s) |
| `fixed.eyebrow` | `fixed.astro` | `app.fixedLong` BI text (nav role) | drop (`change.md` § Kit binding already binds `app.fixedLong`) |
| `fixed.lead` | `fixed.astro` | — | keep (K11 „brak leadu `/fixed`”) |
| `fixed.itemForms` | `fixed.astro` `countText` | `fixedCosts.itemForms` BI | drop |
| `fixed.count` | `fixed.astro` `countText` | — (bare `{n} {items}`) | keep or inline (K23) |
| `fixed.previously` / `firstSeen` | `fixed.astro` | — | keep (K23 partial) |
| `fixed.changedEmpty` | `fixed.astro` | `fixedCosts.noChanges` SM | rebind-S15 |
| `fixed.newEmpty` | `fixed.astro` | `fixedCosts.noNew` SM | rebind-S15 |
| `fixed.noComparison` | `fixed.astro` | `fixedCosts.noComparison` SM | rebind-S15 |
| `fixed.unchangedEmpty` | `fixed.astro` | — | keep (G34 placeholder) |
| `emptyViews.body` | `patterns.astro`, `fixed.astro`, `imports/index.astro` (`ViewEmpty`) | — (`app.js` `emptyView()` literal) | keep (K11) |

### 6b. `auth`, `imports`, `patterns`, `settings` (other views — closing audit)

| Leaf | Reader | Kit | Verdict |
| --- | --- | --- | --- |
| `auth.confirmEmailVisual.{eyebrow,title,lead}` | `confirm-email.astro` | — | keep (K13) |
| `auth.resetNewVisual.eyebrow` / `.title` | `reset/new.astro` | `auth.resetVisual.eyebrow` / `.title` BI | drop possible only by assembling the visual object from two sources (`.lead` differs) — follow-up, byte-identical so no visual change |
| `auth.resetNewVisual.lead` | `reset/new.astro` | — (`resetVisual.lead` is a different sentence) | keep (K13) |
| `auth.expiredEyebrow` / `expiredLead` / `expiredAlert` | `reset/new.astro` | — | keep (K11/K34) |
| `auth.confirmedLogin`, `occupiedOr`, `saveNewPassword`, `doneEyebrow`, `resetSuccessLead` | `login.astro`, `register.astro`, `reset/new.astro` | — | keep (K11) |
| `auth.resetNewError`, `resent`, `resendError` | `reset/new.astro`, `confirm-email.astro` | — (not in `app.js` either — app placeholders) | keep (K11) |
| `auth.saving` | `reset/new.astro`, `settings.astro` | `threshold.saving` / `patternActions.saving` BI text, other namespace | keep (role differs; optional follow-up) |
| `imports.saveError` | `imports/new.astro` → `ImportWizard` | — | keep (K28) |
| `imports.table.importedOn`, `table.debits`, `toPatterns`, `toOverview`, `transactionForms`, `transactionsLabel`, `resultTitle`, `next`, `stepEyebrow`, `accountTitle`, `accountForms`, `selected`, `summaryTitle`, `summary.debits`, `overlapTail` | `imports/index.astro`, `imports/result.astro`, `ImportWizard.tsx` | — | keep (K11) |
| `imports.accountLead` | `ImportWizard.tsx` | — (tail is app text) | keep (K33) |
| `imports.deleteDialogEyebrow` | `imports/index.astro` | — | keep (K19) |
| `imports.debitForms` | `imports/result.astro` `title` | `importFlow.debitForms` BI (wizard already reads it via `imports/new.astro`) | **drop — follow-up** (S-13 view; no visible change) |
| `imports.santanderAccountName` | `ImportWizard.tsx` `readStatement` | `imports.santanderAccountName` BI | **drop — follow-up** (S-13 view; no visible change) |
| `patterns.upload` | `patterns.astro`, `home.astro` | `emptyState.cta` / `emptyViews.button` SM (no „+ ”) | keep (kit renders „+ Wgraj CSV” in both headers) |
| `patterns.typeLabels.*`, `sortPrefix`, `footer`, `detailEyebrow`, `setThreshold`, `thresholdRemoved`, `thresholdCount`, `openPattern`, `occurrenceForms` | patterns views, `PatternsTable.tsx`, tests | — | keep (K11/K21) |
| `patterns.overBadge` | `patterns/[...key].astro` | `patternDetail.sequenceOver` SM (capitalised legend label) | keep (role/case differ) |
| `patterns.monthsLocative` | `patterns/[...key].astro`, `fixed.astro`, `kit-contract.test.ts` | `patternDetail.monthNames` BI values, other shape | keep (K30 deliberate) |
| `patterns.noTransactions` | `patterns/[...key].astro` | — | keep (K37) |
| `patterns.overInMonth`, `thresholdSum` | detail / `PatternsTable` | — | keep (G31) |
| `patterns.sequenceSummary` | `sequenceLabel` | `patternDetail.sequenceSummary` SM (no plural forms) | keep (K35) |
| `patterns.actions` | `patterns/[...key].astro` | — | keep (K22 note) |
| `patterns.mergeField`, `renameHint`, `unmerged` | `patterns/[...key].astro` | — | keep (G33) |
| `patterns.mergeSubmit` | `patterns/[...key].astro` | `patternActions.mergeTitle` BI text (h2 role) | keep (role differs) |
| `settings.loginData`, `dataLabel`, `session`, `savePassword`, `cancel`, `dangerEyebrow`, `deleteDialogEyebrow`, `deleteDialogTitle`, `deleteDialogBody` | `settings.astro`, `DeleteAccountDialog.tsx` | — | keep (K15) |
| `settings.close`, `settings.deleting` | `DeleteAccountDialog.tsx` | `patternActions.closeLabel` / `imports.deleteWaiting` BI text, other namespaces | keep (role differs; optional follow-up) |

**Audit result.** In-scope edits (S-15 views): drop 8 leaves (`home.empty*` ×4, `home.lead`, `home.deltaFoot`,
`fixed.eyebrow`, `fixed.itemForms`), delete 3 with the removed UI (`home.risen`, `home.risenForms`,
`home.noThreshold`), rebind 3 with visible text change (`fixed.changedEmpty/newEmpty/noComparison`), add the new
literals of § 1/3/4. Outside S-15: 2 byte-identical drops (`imports.debitForms`, `imports.santanderAccountName`) and
1 partial (`auth.resetNewVisual.eyebrow/title`) — no visible change, so decision 7 allows doing them in the closing
phase (copy only); the plan may instead file them as follow-ups. Text-identical keys in a different role
(`auth.saving`, `settings.close/deleting`, `patterns.mergeSubmit`, `fixed.eyebrow`→`app.fixedLong` is the one taken)
stay unless the plan argues the role is the same. Every other leaf is a true gap (no `content.json` key with that
meaning).

**Register drift to fix in the closing phase** (`context/foundation/design-kit.md`): K24 delivered but `home.astro`
still carries `DESIGN-GAP: K24` comments; G34 delivered but the `copy.ts` `fixed` block comment calls the states
placeholders; `home.empty*` have no K/G row; G35 row text still describes the `ImportPanel` border and the
`noThreshold` placeholder (both leave); K29 becomes moot for the app (second card gone); K23 meta lines stay partial;
new rows for the summary-panel / legend / suffix literals.

## Code References

- `src/pages/home.astro` — `result` IIFE (`try`), `monthIndex`, `leadFor`, `barsFor`, `deltaFootFor`, `risenFootFor`; `StatCard` ×2, `TrendChart`, `ImportPanel`
- `src/pages/fixed.astro` — `result` IIFE (no `try`), `countText`, `previouslyText`, `firstSeenText`, `deltaClass` (`DESIGN-GAP: G34` comment)
- `src/pages/patterns/[...key].astro` — `detailTarget` / `patternDetail` / `sequenceLabel` unguarded (S-14 F8)
- `src/components/home/{StatCard,TrendChart,ImportPanel}.astro`, `src/components/fixed/{FixedSection,FixedRow}.astro`, `src/components/app/{Panel,PageTitle,InlineAlert}.astro`
- `src/lib/patterns/home.ts` `homeStats` / `HomeStats`; `src/lib/patterns/trend.ts` `trendBarHeight`; `src/lib/patterns/fixed.ts` `FixedOverview`; `src/lib/format.ts` `fillMonthLocative`, `plural`
- `src/content/copy.ts` `copyExtra`; `design/rytm-os/react-kit/docs/content.json` `dashboard`, `home`, `trend`, `fixedCosts`, `app.fixedLong`
- `design/rytm-os/prototype/app.js` `dashboard`, `applyDashboardState`, `trendChart`, `fixedCosts`, `emptyView`; `prototype/styles.css` `.stats-single`, `.dashboard-fixed`, `.fixed-summary-row`, `.panel-title`, `.section-label`, `.trend-column .tbar`, `.trend-value`, `.info-panel`, `.fixed-empty-states`, `.increase`, `.decrease`, `.compact .fixed-row`
- `scripts/smoke.mjs` steps listed in § 2; `test/unit/home-stats.test.ts`, `test/unit/over-limit-trend.test.ts` `describe("trendBarHeight")`

## Architecture Insights

- `app.js` reads no `content.json` key for dashboard, trend or fixed costs; every string is a literal. „Kit has the
  text” therefore means „a `content.json` key with that meaning exists”, checked per string — the prototype markup
  decides layout, `content.json` decides wording, and where they disagree in text (`trend.noThreshold` vs „Brak
  progu”; `fixedCosts.new` vs „Nowe w tym miesiącu”) the key wins (precedent: `fixedCosts.new` kept in S-06/F-04).
- Prototype states are static samples (sections with rows under an error; legend chips always on). The app renders
  data-driven states: show the message only under the condition it describes.
- No schema change: every new figure (`fixedRisen`, `new.length`) is already computed. **No migration.**

## Historical Context (from prior changes)

- `context/archive/2026-09-28-over-limit-trend/{research,plan,plan-review}.md` — S-07 added the second card (decision 6, `[human]` 4.11 unchecked) and `ImportPanel` (Phase 4) from the round-1/2 kit; PRD column empty for both. Supported by the current kit diff: round 3 dropped both.
- `context/archive/2026-10-02-kit-round-3-intake/reviews/visual-review.md` obs. 1 — F-04 logged the layout difference for S-15.
- `context/archive/2026-10-03-kit-round-3-patterns/follow-ups/review-fixes.md` F8/F9 — still open on this branch (verified in code, § 5).
- `context/foundation/design-kit.md` round-3 status table — K24/G34 delivered, G35 resolved-by-decision, K23/K25 partial, K29 open.

## Related Research

- `context/archive/2026-10-02-kit-round-3-intake/research.md` (intake copy map; predates S-12/S-13/S-14 `copy.ts` edits — superseded for `copyExtra` by § 6 here).
- `context/archive/2026-09-28-over-limit-trend/research.md`.

## Open Questions (plan decides; recommendation given in the section)

1. `HomeStats.fixedTotalMinor`: drop (+ rewrite 3 unit cases) or keep unused — recommend drop (§ 2).
2. „Podrożały” = rises only (`fixedRisen`) — recommended (§ 1); kit sample count has no rule.
3. Noun forms `koszt/koszty/kosztów` — „kosztów” is not in the kit (only two forms shown); new `copyExtra.home` array + gap row.
4. Trend: chip text `trend.noThreshold` vs literal „Brak progu”; zero note shown only when a zero bar exists; bar colour `bg-muted`; min height 8 % (§ 3). Whether the bare chip suffices for the all-zero chart → visual gate.
5. `/fixed` empty-section placement (kit `.fixed-empty-states` vs in-section) and whether `unchangedEmpty` joins that block for consistency (§ 4).
6. Closing-phase reach outside S-15 views: `imports.debitForms`, `imports.santanderAccountName`, `auth.resetNewVisual.eyebrow/title` (byte-identical) — do or follow-up (§ 6b).
7. `[human]` rows: removed `/home` fixed-cost total; removed import panel; one-off merchants in the „Nowe” count; trend chip copy key-vs-literal.
