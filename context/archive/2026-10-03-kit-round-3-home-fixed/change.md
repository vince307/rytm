---
change_id: kit-round-3-home-fixed
title: Przegląd, trend i koszty stałe według rundy 3 kitu
status: archived
created: 2026-10-03
updated: 2026-10-03
archived_at: 2026-10-03T14:52:50Z
---

## Notes

Slice **S-15** (milestone M-3, the LAST one), roadmap `context/foundation/roadmap.md` `### S-15`. PRD: FR-011,
FR-012, FR-013 — presentation changes, not rules (M-3 scope anchor; PRD wins over kit copy, `[human]` row when they
collide). Branch `feat/kit-round-3-home-fixed`, cut from `main` at `1bf6a5c` (after S-14). Written by the autonomous
run `2026-10-02-kit-round-3`, step `/10x-new`.

Views: `/home` (`src/pages/home.astro`, `src/components/home/{StatCard,TrendChart,ImportPanel}.astro`), `/fixed`
(`src/pages/fixed.astro`, `src/components/fixed/{FixedSection,FixedRow}.astro`); pure data in
`src/lib/patterns/{home,fixed,trend}.ts`; copy in `src/content/copy.ts` (`copyExtra.home`, `copyExtra.fixed`,
`copyExtra.emptyViews`). Final phase: audit that every remaining `copyExtra` entry (all namespaces) is a string the
kit truly does not provide (`content.json` has no key with that meaning) — each survivor keeps a `DESIGN-GAP` + gap
row in `context/foundation/design-kit.md`.

**Migration expected: no.** Every kit item here is copy, layout or a pure re-shaping of data `fixedOverview` /
`overLimitTrend` / `homeStats` already compute (the home „Nowe” count = `fixedOverview(...).new.length`). No table,
column or constraint is touched.

## Roadmap claims vs repo now

The `### S-15` block was written at plan time (2026-10-02, before F-04/S-13/S-12/S-14 shipped). Checked against the
branch on 2026-10-03:

| Roadmap claim | Repo now | Correction |
| --- | --- | --- |
| One „Ponad progiem” card | `home.astro` renders TWO `StatCard`s: `dashboard.stats[0]` (over limit) and `dashboard.stats[1]` „Koszty stałe” (value `homeStats().fixedTotalMinor`, foot `copyExtra.home.risen`). Kit `dashboard()`: `.stats.stats-single` — one card | Drop the second card. Its total (`fixedTotalMinor`) has no place in the kit dashboard — decision below (A2) |
| Trend at full width | Already: the trend `Panel` spans the content column (S-07) | No layout change; only the trend's copy/legend (below) |
| Fixed-costs summary on the dashboard | Not built. App renders `ImportPanel` (`dashboard.importTitle/importBody`) instead; kit round 3 `dashboard()` draws `.panel.dashboard-fixed`: title „Koszty stałe”, link „Zobacz zmiany” → `/fixed`, two `.fixed-summary-row`s „Podrożały · 2 koszty”, „Nowe · 1 koszt”, and NO `.import-panel` (absent from `app.js`; the keys survive in `content.json` unused) | New panel from data already computed (`fixedRisen`, `fixedOverview().new.length`). „Zobacz zmiany”, „Podrożały”, „Nowe”, noun forms „koszt/koszty/kosztów” are `app.js` literals → `copyExtra.home` + `DESIGN-GAP` + gap row. `ImportPanel` removal — decision A3 |
| Without „Rozpoznane wydatki” / „Co wraca najczęściej” (C5) | Already absent; G36 closed in F-04 | Nothing to do |
| Leads and card feet with `{month}` / `{delta}` / `{n}` and declension | Lead: `copyExtra.home.lead` = `dashboard.descriptionNoName` byte for byte (K24 delivered). Delta foot: `copyExtra.home.deltaFoot` = `dashboard.stats[0].foot` byte for byte. Both still read from `copyExtra`; `monthsNominative` / `monthsGenitive` exist only in `copyExtra` | Rebind lead and delta foot to the kit keys; the two month tables stay `copyExtra` (kit has neither — K25). `{n}` foot (`stats[1].foot`, K29) goes away with the second card — K29 is then moot for the app (row stays for the author) |
| Trend: sums above bars | Already: every bar shows its sum (S-07, `TrendChart` `bar.amount`) | Bind the per-bar accessible name to `trend.amountLabel` „{amount} ponad próg” (kit `aria-label`); bar min height app 12 % vs kit 8 % (`trendBarHeight`) — research checks |
| Trend: zero marker | 2 px bar exists (`bar.height === 0`); no legend note. Kit legend: `.trend-zero-note` literal „Cienka kreska oznacza 0,00 zł”; `content.json` `trend.zero` / `trend.zeroMarker` „Brak kwoty ponad próg” (different text) | Research maps: legend note literal (`copyExtra` + gap) vs `trend.zeroMarker` as the zero bar's name |
| Trend: „brak progu” description | App shows an info panel with `copyExtra.home.noThreshold` (G35 placeholder) when no pattern has a threshold. Kit: legend chip `.trend-no-threshold` „Brak progu” with `title` „Brak progu: nie ustawiono granicy dla wzorca.” (literals); `trend.noThreshold` „Brak ustawionego progu” | Research decides key vs literal and whether the info panel stays (US-05 needs a state for „no threshold at all”) |
| `/fixed` count with true plural | Already: `countText` with `copyExtra.fixed.itemForms` | Rebind to `fixedCosts.itemForms` (identical); `count` „{n} {items}” template stays `copyExtra` or inlines |
| Calm decrease colour | Already green (`deltaClass`, comment `DESIGN-GAP: G34`). Kit now defines `.decrease{color:var(--green)}` / `.increase{color:var(--excess-dark)}` and suffixes „· wzrost” / „· spadek” (`app.js` literals); `fixedCosts.decreased` „Obniżona kwota” is not rendered by `app.js` | Drop the G34 comment (kit agrees). Suffix — research decides (literal vs `fixedCosts.decreased`) |
| Separate empty-section messages | Exist as G34 placeholders: `copyExtra.fixed.changedEmpty/newEmpty/unchangedEmpty` | Rebind changed → `fixedCosts.noChanges`, new → `fixedCosts.noNew`; „Bez zmian” has no kit key → stays `copyExtra` + gap. Kit shows them as `.info-panel` (`.fixed-empty-states`), app inside the section — research picks placement |
| No comparison month | Exists: `copyExtra.fixed.noComparison` „Nie ma poprzedniego…” inside the „Nowe” section | Rebind to `fixedCosts.noComparison` „Brak poprzedniego miesiąca do porównania.”; kit places it as an `.info-panel` under the title (`fixedCosts('no-month')`); smoke string `scripts/smoke.mjs` moves (F-04 follow-up) |
| Read error distinct from empty | Distinct already, but generic `components.error`; `fixed.astro` has NO `try` around `fixedOverview` (a `patternTxs` drift → 500) | Bind `/fixed` error to `fixedCosts.readError` (kit `fixedCosts('error')`); wrap assembly in `try` like `home.astro` (S-14 follow-up). `/home` error keeps `components.error` (kit has no home error view) |
| Risk: leftovers `copyExtra` (`home`, `fixed`, `app`) | There is no `copyExtra.app` (S-12 moved app shell copy to `app.*`). Namespaces now: `auth`, `home`, `fixed`, `imports`, `patterns`, `settings`, `emptyViews`. `copyExtra.home.emptyEyebrow/emptyTitle/emptyLead/emptyIllustrationAlt` duplicate `content.json` `home.*` byte for byte; `copyExtra.fixed.eyebrow` = `app.fixedLong` | Drop the duplicates, read the kit. Final phase audits ALL namespaces, not only home/fixed/app |
| Risk items K11, K18, K23, K24, K25, G34, G35, G36 | Register (round-3 table): K18, K24 `delivered`; G34 `delivered` (S-14 closed the badge tint); G36 closed (F-04); G35 `resolved-by-decision` (raw gridline `#d2d7d8`); K23 `partial` (meta lines „poprzednio” / „pierwsze wystąpienie” still no key); K25 `partial` + K29 `open · S-15` | Also in play: K30 (`fixedCosts.new` „Nowe w {month}” already through `fillMonthLocative`), K11 `/fixed` lead (no key), `copyExtra.emptyViews.body` (`app.js` `emptyView()` literal — stays). Final status of each row written in the last phase |
| (not in roadmap) „Nowe w tym miesiącu” | App: `fillMonthLocative(copy.fixedCosts.new, …)` → „Nowe we wrześniu”; kit `fixedCosts()` literal „Nowe w tym miesiącu” | Keep the key (kit's own content.json); no change |
| No migration | Confirmed (no schema item) | — |

## Kit binding

Kit views (`design/rytm-os/prototype/views/`, shells rendered by `prototype/app.js` `dashboard()`, `trendChart()`,
`applyDashboardState()`, `fixedCosts(state)`, `emptyView('fixed')`; CSS `prototype/styles.css` `.stats-single`,
`.dashboard-trend`, `.monthly-trend`, `.legend`, `.trend-zero-note`, `.trend-no-threshold`, `.dashboard-fixed`,
`.fixed-summary-row`, `.fixed-section`, `.fixed-row`, `.increase`, `.decrease`, `.info-panel`, `.inline-alert`):

| View | App target |
| --- | --- |
| `home-no-name.html` (`#/home-no-name`) | `/home` with data: one stat card, trend, „Koszty stałe” summary panel, „+ Wgraj CSV” in the title row |
| `home.html` | same layout with a name — the app has no user name (K5), reads `greetingNoName` / `descriptionNoName` |
| `home-empty.html` | `/home` before the first import (`dashboard(true)`) — already built; rebind to `home.*` |
| `home-demo.html` | `/home` on the demo account — demo bar from `AppLayout` (S-12); no home-specific work expected |
| `fixed.html` | `/fixed` three sections, rise/fall suffix and colour, „nowy” badge |
| `fixed-no-month.html` | `/fixed` without a comparison month (`fixedCosts.noComparison` as `.info-panel`) |
| `fixed-no-changes.html` / `fixed-no-new.html` | `/fixed` empty „Zmieniły kwotę” / „Nowe” sections (`noChanges` / `noNew`) |
| `fixed-error.html` | `/fixed` read error (`fixedCosts.readError` inline alert) |
| `fixed-empty.html` | `/fixed` before the first import (`emptyView('fixed')`) — already built |
| (none) | `/home` read error — no kit view; keeps `components.error` (DESIGN-GAP stays as today, no new invention) |
| (none) | `/fixed` empty „Bez zmian” section — no kit key; keeps `copyExtra.fixed.unchangedEmpty` (gap row) |
| (none) | `/home` „no threshold at all” beyond the legend chip — research checks the chip covers US-05; otherwise the G35 placeholder stays |

`content.json` keys bound: `dashboard.*` (`eyebrow`, `greetingNoName`, `descriptionNoName`, `stats[0].label/foot`;
`stats[1]` NOT read after the card goes — label „Koszty stałe” may title the summary panel; `importTitle/importBody`
fate = decision A3); `home.*` (4 empty-state keys, replacing the `copyExtra.home` duplicates); `trend.*` (`title`,
`range`, `legend`, `tooShort`, `minimumMonths`, `amountLabel`, `noThreshold`/`zeroMarker`/`gridLabel` per research;
`current` NOT read — C4); `fixedCosts.*` (`title`, `changed`, `new`, `unchanged`, `noChanges`, `noNew`,
`noComparison`, `readError`, `itemForms`, `decreased` per research); `emptyViews.fixed/cta/button`; `app.fixedLong`
(eyebrow); `components.new`, `components.error`.

Expected to stay `copyExtra` (kit has no key; each keeps or gets a `DESIGN-GAP` + gap row): `home.monthsNominative`,
`home.monthsGenitive`, `home.noThreshold` (unless the chip replaces it), the summary-panel literals („Zobacz zmiany”,
„Podrożały”, „Nowe”, „koszt/koszty/kosztów”), `fixed.lead`, `fixed.previously`, `fixed.firstSeen` (K23),
`fixed.unchangedEmpty`, `emptyViews.body`; trend legend literals („Cienka kreska oznacza 0,00 zł”, the „Brak progu”
title) if research keeps them. No kit view → `DESIGN-GAP`, never invented.

## Follow-ups triggered

Grep of `context/archive/*/follow-ups/review-fixes.md` `Trigger:` lines naming S-15, home, fixed, trend, dashboard,
a month template, a badge tint, a panel title, or a condition S-15 meets:

| Source | Item | Trigger | Take |
| --- | --- | --- | --- |
| `2026-10-02-kit-round-3-intake` § S-15 | Card feet stay `copyExtra.home.risen` until K29 is fixed | S-15 | **Moot if A2 holds** — the second card (and its `{n}` foot) leaves; the summary panel's „Podrożały · N koszty” uses its own noun forms. `risen` / `risenForms` deleted; K29 stays open for the author |
| same | `Badge` `new` tint via `--rytm-badge-soft` | S-15 | **Already resolved** by S-14 P2 (G34 row „zamknięte”); visual gate re-checks the `/fixed` badge only |
| same | `fixed.noComparison` smoke string moves with the copy | S-15 | **In scope** — `scripts/smoke.mjs` asserts „>Nie ma poprzedniego miesiąca do porównania.<” |
| same § month template | Use `fillMonthLocative`, never a local locative read (K30) | any slice touching a month template | **In scope** — `fixedCosts.new` already uses it; lead (nominative) and delta foot (genitive) use their own tables, never `patternDetail.monthNames` |
| `2026-10-03-kit-round-3-patterns` | `fixed.astro` `try` — adopt the kit error boundary | S-15 | **In scope** — wrap `fixedOverview` like `home.astro`; error → `fixedCosts.readError` |
| same F8 | `/patterns/<key>` has no assembly `try` (`patternDetail`, `sequenceLabel`) | S-15 | **In scope, small** — same `try` → `components.error` pattern; touches `patterns/[...key].astro` only in the frontmatter, no visual change |
| same F9 | `home.astro` comment cites a non-existent „`patterns.astro` `sumLabel` precedent” | S-15 | **In scope** — the comment is rewritten with the lead rebind anyway |
| same F7 | `FormField.tsx` / `DeleteAccountDialog.tsx` own 8 px box vs `fieldBox` | next slice touching auth or settings forms | **Not triggered** |
| same | Panel radius 20 vs 12 | global radius pass | **Not triggered** — unless the plan edits `Panel.astro` (it should not; the summary panel reuses it) |
| `2026-09-28-fixed-cost-changes` | A pattern/row drift throws past the error branch on `/fixed` / `/patterns` | a 500 in logs, or next change touching `loadPatternData` | **In scope** for `/fixed` (= the S-14 `try` item); `/patterns` already wrapped in S-14 P1 |
| same | `FixedSection` `compact` prop adds only an unstyled class | the next `/fixed` change | **In scope** — drop the prop or give it the kit `.fixed-list.compact` meaning |
| same | One-off merchants are D5-fixed and list as „nowy” | product feedback, or S-07's `/home` stat card surfacing the same noise | **Condition met, out of scope** — the new „Nowe · N koszty” row will surface it on `/home`; fixing it is a classifier rule (`derivePatterns` / `d5Type`), and M-3 changes presentation, not rules. Stays open; noted in `[human]` |
| same | D5 flip hides an out-of-tolerance rise from `/fixed` | `[human]` 4.10 or product feedback | **Not triggered** (rule) |
| same | `Badge` `new` tint vs kit `#EFE4D1` | kit token or G28 `changed` tone | **Already resolved** (S-14 P2, `--rytm-badge-soft`) |
| `2026-09-28-over-limit-trend` | „Rozpoznane wydatki” / „Co wraca najczęściej” (G36) not rendered | `[human]` S-05 7.9 or the kit defining the rule | **Close** — kit decision C5 omits both permanently; tick it in this slice's follow-ups, no code |
| same | Panel-title markup inline in six places | the next change that adds a panel title | **Triggered** (the summary panel adds one). **In scope, narrow**: a shared `PanelTitle.astro` used by the two `/home` panels and `FixedSection`; the `patterns/[...key].astro` ×3 and `settings.astro` call sites stay (other views) — follow-up kept open with the shortened list. Research confirms the kit `.panel-title` vs `.section-label` split |
| same | Month-index parse in two styles | next change touching `patterns/[...key].astro` or adding a third declension table | **Triggered** (F8 touches `[...key].astro`; S-14 already moved the patterns side into `fillMonthLocative`). **In scope** — one `monthIndex(yearMonth)` in `src/lib/format.ts`, used by `fillMonthLocative` and `home.astro` |
| same | One-off merchants inflate the `/home` „Koszty stałe” value | `[human]` 4.11 or product feedback | **Mostly moot** if A2 drops the value; the same noise shows in the „Nowe” count (row above) |
| same | Long histories > 24 months | account with > 24 months | **Not triggered** |
| `2026-09-27-pattern-threshold-over-limit` F3 / F11, `2026-09-25-undo-import` dialog geometry | focus ring, field radius, dialog geometry | focus/field/dialog changes | **Not triggered** — closed by S-14 (G29, G32, `DialogContent`); `/home` and `/fixed` have no field or dialog. The „Zobacz zmiany” link reuses `focusRing` |
| `2026-10-02-kit-round-3-intake` § Prettier | `.prettierignore` for the kit | husky hook / CI prettier / `npm run format` | **Not triggered** — do not run `npm run format` |
| `2026-10-02-kit-round-3-imports` F3, `2026-10-03-kit-round-3-auth-settings` F3 | `imports/result.astro` observability; landing on phone | those views | **Not triggered** |

## Autonomous decisions

1. **Next step `/10x-research`, not `/10x-plan`.** Chosen: research. Rejected: plan directly (the skill default).
   Why: the trend legend/„brak progu” mapping (keys vs `app.js` literals), the empty-section placement (kit
   `.info-panel` below vs app in-section), the summary panel's data and copy, and the closing audit of every
   `copyExtra` namespace need a key-by-key map plus the smoke strings that pin them (`scripts/smoke.mjs`); the intake
   research.md map predates S-12/S-13/S-14 edits to `copy.ts`. The orchestrator also names research. What would
   change it: an up-to-date copyExtra→content.json map already on disk.
2. **(A2) One stat card; the „Koszty stałe” total leaves `/home`.** Chosen: follow kit `dashboard()` `.stats-single`
   — the fixed-cost information moves to the summary panel (rises count, new count, link to `/fixed`). Rejected:
   keep the second card with a `DESIGN-GAP`. Why: round 3 redraws the dashboard explicitly (CHANGELOG „Dashboard
   pokazuje kartę „Ponad progiem”, pełnoszeroki trend i zestawienie kosztów stałych”); FR-012 asks for which fixed
   costs changed / are new — the panel shows exactly that; no FR requires a fixed-cost total on `/home`. `homeStats`
   loses `fixedTotalMinor` (+ its unit tests) or keeps it unused — plan decides. `[human]` row records the removed
   number. What would change it: the maintainer wanting the total back — then a card with a `DESIGN-GAP`, never a
   third invented summary row.
3. **(A3) `ImportPanel` leaves `/home`.** Chosen: follow the kit — round-3 `dashboard()` has no `.import-panel`; the
   import entry stays as „+ Wgraj CSV” in the title row and the pre-import empty state. Rejected: keep it because
   `dashboard.importTitle/importBody` still exist in `content.json`. Why: the view is the source of truth for layout,
   and stale keys without a view are not a drawing. Smoke assertions „home offers the next import”
   (`>Dodaj najnowszy wyciąg<`) invert; `ImportPanel.astro` is deleted if nothing else reads it. What would change
   it: research finding the panel in any round-3 home view or in `routes.md`, or the maintainer asking to keep it.
4. **S-14 F8 (`/patterns/<key>` `try`) in scope although it is a patterns view.** Chosen: include. Rejected: defer.
   Why: the follow-up names S-15 explicitly, it is a frontmatter-only guard with the `home.astro` shape, and it
   triggers the month-index unification. What would change it: the plan exceeding a sensible size — then a new
   follow-up `Trigger: next change touching patterns/[...key].astro`.
5. **Panel-title follow-up: narrow adoption.** Chosen: a shared `PanelTitle.astro` for the `/home` panels and
   `FixedSection` only. Rejected: the full six-site sweep (touches `/patterns/<key>` and `/settings` visuals — other
   views). Why: one view + global tokens; the follow-up stays open with the remaining call sites. What would change
   it: research showing the shared markup differs by view (kit `.panel-title` vs `.section-label`) so one component
   does not fit — then inline markup and the follow-up unchanged.
6. **One-off merchants as „nowy” stays out of scope.** Why: a classifier rule (`d5Type`), M-3 changes presentation.
   What would change it: the visual gate on the seed/fixture data showing the „Nowe” count dominated by one-offs to a
   degree that makes the panel misleading — then a `[human]` decision before ship.
7. **Closing audit covers every `copyExtra` namespace.** Chosen: all of `auth`, `home`, `fixed`, `imports`,
   `patterns`, `settings`, `emptyViews`, each survivor either has no `content.json` key with that meaning or is a
   recorded deliberate deviation (K29/K30/K31/K35-style). Rejected: home/fixed only. Why: the roadmap Risk says the
   final phase checks that `copyExtra` holds only what the kit truly does not provide; earlier slices may have left
   byte-identical duplicates (found here: `copyExtra.home.empty*` = `home.*`). Rebinding outside home/fixed is copy
   only (same bytes → no visual change); a wording change outside S-15 views becomes a follow-up, not an edit. What
   would change it: the audit finding a non-identical rebind in another view — then follow-up, not scope.
