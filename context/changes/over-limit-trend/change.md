---
change_id: over-limit-trend
title: Trend „ponad progiem” per miesiąc według dzisiejszych progów (S-07)
status: impl_reviewed
created: 2026-09-28
updated: 2026-09-28
archived_at: null
---

## Notes

Trend „ponad progiem” (roadmap S-07).

Outcome (roadmap `### S-07`): użytkownik widzi sumę „ponad progiem” dla każdego miesiąca obecnego w danych, liczoną
według dzisiejszych progów; zmiana lub usunięcie progu przelicza wszystkie miesiące, miesiąc bez nadwyżki pokazuje 0.
PRD: FR-013 (must-have; rozstrzygnięcie: próg znaczy „jak oceniam dziś”, wersjonowanie progów = Non-Goal), US-05
(12 miesięcy, próg Wolt 4/mies. → 6/mies. przelicza wszystkie miesiące, także historyczne → usunięcie progu: Wolt nie
wnosi nic do żadnego miesiąca). AC: suma per miesiąc = suma kwot „ponad próg” ze wszystkich wzorców z progiem w tym
miesiącu; miesiąc bez nadwyżki = 0, nie brak wartości; tylko bieżące progi; **niepełny bieżący miesiąc pokazywany na
równi z pełnymi, bez oznaczenia** (założenie 2026-09-18). Kryterium sukcesu drugorzędne: „trend miesięczny ponad
progiem na ≥ 3 miesiącach: po kilku importach widać, czy suma maleje”.

Binding for this run (agent contract, maintainer Step 0, 2026-09-28): „ponad próg” = **nadwyżka ponad próg**
(`overLimit` as shipped in S-04 — excess for `sum`/`amount`, full amount for `count`); „w tym miesiącu” = **najnowszy
miesiąc w danych** (`referenceMonth(rows)`). Working assumption from S-05 `[human]` 7.9 (decision 9): a pattern with
`excluded` contributes to **no** monthly total.

### Roadmap claims checked against the repo at `main` `c0b0068` (2026-09-28, after S-04, S-05, S-06 shipped)

| Roadmap claim (plan-time) | Repo now | Correction |
|---|---|---|
| Prerequisite: S-04 (only) | S-04, **S-05 and S-06** shipped. Patterns still derived on read: `loadPatternData` (`src/lib/patterns/load.ts`) → `derivePatterns(rows, decisions)` with merge-to-root, `pinnedType`, `excluded`; thresholds come in the same read (`thresholds: Map<key, Threshold>`) | S-07 builds on **decided** patterns: a merged pattern's months are the union of its components (threshold keyed on the root); a pinned type decides whether `count`/`sum` or `amount` applies (`appliesTo`); an `excluded` pattern adds nothing to any month (decision 9 / 7.9). Consume `loadPatternData`, never re-derive |
| „rozszerza regułę z S-04 na wszystkie miesiące” | `overLimit(txs, threshold, type)` (`src/lib/patterns/over-limit.ts`) **already returns `byMonth` for every month** of a pattern; `listOverview` (`src/lib/patterns/view.ts`) reads only `byMonth.get(refMonth)`, `patternDetail` only the selected month. No cross-pattern per-month aggregate exists | The rule needs no change. New work = one pure aggregate next to `listOverview` (e.g. `overLimitTrend(patterns, rows, thresholds)`): for every non-excluded pattern with an applicable threshold, sum `overLimit(...).byMonth` into a month map, then zero-fill the month axis. It must reuse `patternTxs`/`indexById`/`appliesTo` exactly as `listOverview` does, so the trend's last point **equals** the sum of `/patterns` over-limit figures for the reference month |
| „dla każdego miesiąca obecnego w danych” | `referenceMonth(rows)`, `monthOf`, `previousMonth` exist; nothing lists all months | Month axis definition is open for research/plan: months with ≥ 1 row (literal PRD) vs the continuous calendar range first → reference month (a gap month between imports would then show 0 — PRD's „0, nie brak wartości” argues for it). See Autonomous decisions |
| „zmiana lub usunięcie progu przelicza wszystkie miesiące” | Thresholds are stored per `(user_id, merchant_key)` (`pattern_thresholds`), never per month; every page recomputes from the current read | Holds by construction — no stored per-month totals. Proof needed in tests (unit: change/remove threshold → every month moves; smoke: save threshold → `/home` changes, delete → drops) |
| „niepełny bieżący miesiąc świadomie nie jest oznaczany (założenie PRD)” | **Kit contradicts it:** `app.js` `trendChart()` paints the `current` month `.tbar.hot` (amber) with a `<b>niepełny</b>` label and a legend entry `trend.current` „bieżący, niepełny miesiąc” | **Conflict PRD ↔ kit.** The app also cannot know a month is incomplete (the reference month is the latest in the data, not the calendar month). Candidate DESIGN-GAP; lean: PRD wins — no „niepełny” label (see Autonomous decisions) |
| Outcome = a trend (the view is implied) | `src/pages/home.astro` is a **static placeholder**: `PageTitle` + `EmptyState` rendered **unconditionally**, even for an account with data. The kit's only trend is on the `/home` dashboard (`dashboard()`), G6 „delivered · `.monthly-trend`” | The slice's view is **`/home`** (kit `#/home`), not a new route. The pre-import state (`#/home-empty`) stays for accounts with no transactions |
| Parallel with S-05, S-06, S-09 | S-05, S-06 done; S-09 not in this run | S-06 left a pure function for the `/home` card: `fixedOverview(patterns, rows).changed.filter((r) => r.deltaMinor > 0).length` = „N pozycje podrożały” (`src/lib/patterns/fixed.ts` header names S-07) |
| Unknowns: — | The kit's `/home` has content the PRD does not define: „Rozpoznane wydatki” (sum + „64 transakcje · 12 wzorców”), „Koszty stałe 1 920 zł”, „+42,20 zł względem kwietnia”, „Co wraca najczęściej” (which 3 patterns?), greeting with a name the app does not store, „w maju” month-name lead | **Open unknowns** for research/plan (see Design kit binding + Autonomous decisions) |

### Migration

**No migration expected.** FR-013 is a pure function of transactions, thresholds and S-05 decisions — all already read
by `loadPatternData`; the PRD forbids threshold versioning, so nothing per-month is stored. Would change: a plan
choosing to persist a snapshot of monthly totals (rejected in advance — it would contradict „według dzisiejszych
progów”) or storing the user's first name for the kit greeting (out of scope — `greetingNoName` exists, K5). No pgTAP /
`db:types` / `db push` work then.

### Design kit binding

View (`design/rytm-os/prototype/`, rendered by `app.js`; `views/*.html` are shells):

- `views/home.html` → `app.js` `dashboard()`: **primary (and only) view of this slice** — `.dash-title` (eyebrow
  „Przegląd miesiąca”, h1 greeting, lead „Oto rytm Twoich wydatków w maju.”, `+ Wgraj CSV` button), `.stats` (three
  `.stat-card`s, first `.accent`), `.dash-grid` (panel „Ponad progiem” + `trendChart()`; panel „Co wraca najczęściej”
  with `.list-item`s + `text-link` „Zobacz wszystkie wzorce”), `.import-panel`.
- `trendChart()`: `.trend.monthly-trend` of `.tbar` (height = value / max, min 12 %, `data-day` month label „maj 26”),
  `.legend` (`.dot` „suma ponad progiem”, `.dot.hot` „bieżący, niepełny miesiąc”), and `.info-panel` „Trend pojawi się
  po 3 miesiącach danych.” when < 3 months. Kit data: 8 months „paź 25” … „maj 26”.
- `views/home-no-name.html` → `applyDashboardState`: greeting „Dzień dobry.”, lead „Twój maj w jednym spokojnym
  widoku.” — the app stores no name (K5), so **this is the greeting variant** that applies.
- `views/home-empty.html` → `dashboard(true)`: pre-import state, already rendered by `home.astro`; stays.
- Styles: `prototype/styles.css` `.stats`, `.stat-card(.accent)`, `.stat-label/.stat-value/.stat-foot`, `.dash-grid`,
  `.panel-title`, `.trend`, `.tbar(.hot)`, `.monthly-trend`, `.legend`, `.dot`, `.info-panel`, `.list-item`,
  `.item-amount.up`, `.import-panel`; ≤ 900 px: `.stats`/`.dash-grid` one column, `.monthly-trend .tbar{min-width:17px}`;
  ≤ 560 px: `.trend{gap:7px}`, `.import-panel` stacked.

Keys (`design/rytm-os/react-kit/docs/content.json`, via `copy` in `src/content/copy.ts`):

- `trend.title` „Ponad progiem”, `trend.range` „miesięcznie · wszystkie dane”, `trend.legend` „suma ponad progiem”,
  `trend.current` „bieżący, niepełny miesiąc” (see conflict), `trend.tooShort` „Trend pojawi się po 3 miesiącach danych.”
- `dashboard.eyebrow`, `dashboard.greetingNoName` „Dzień dobry.”, `dashboard.stats[0..2].label` („Ponad progiem w tym
  miesiącu” — already used by `patterns/[...key].astro`; „Rozpoznane wydatki”; „Koszty stałe”),
  `dashboard.importTitle`, `dashboard.importBody`. `dashboard.greeting`/`description`/`stats[].value|foot`/`patterns`
  are **sample values**, not copy.
- Existing `copyExtra.home.*` (empty state, K11) stays.

DESIGN-GAPs expected (register in `context/foundation/design-kit.md` when the plan fixes what renders; next free id
**G35**; never invent):

- **„niepełny” marker vs PRD AC** — kit marks the current month; PRD says no marker (and the app cannot know).
- **Stat-foot / lead copy only in `app.js` or as sample** — „+X zł względem <miesiąc>” (delta vs previous month,
  including sign/zero/no-previous-month states), „N transakcje · M wzorców” plurals, „N pozycje podrożały” plurals,
  month names in the lead („w maju”, „Twój maj…”) and on the axis („maj 26”) — K11-class → `copyExtra`.
- **„Rozpoznane wydatki” / „Koszty stałe” values** — PRD defines neither sum (reference month? excluded skipped?
  fixed = sum of latest amounts?).
- **„Co wraca najczęściej” selection/order** and meta for a pattern with no threshold (kit sample „co miesiąc”).
- **All-zero trend** (thresholds set nowhere, or nothing over) — bars at the 12 % minimum look like data; kit has no
  state.
- **Account with transactions but no threshold at all** — kit shows only a fully populated dashboard.
- **Read error** — kit none; reuse `/patterns`' `InlineAlert` shape (same class as G30/G31).
- **Bar accessibility** — kit bars carry no value (height only); a numeric value per month (FR-013 is a *sum*) needs a
  visually-hidden label or tooltip the kit does not define.

### Open follow-ups whose trigger names this slice (or fires on it)

Grep of `context/archive/*/follow-ups/review-fixes.md` + roadmap `## Backlog Handoff` for `S-07` / `over-limit-trend`
/ `/home`:

| Follow-up | Source | Take |
|---|---|---|
| **Monthly sums must skip `pattern.excluded`** — Trigger: S-07, first phase that builds a monthly total | S-05 follow-ups; Backlog Handoff S-07 | **In scope, binding.** Every `/home` figure (trend, „ponad progiem w tym miesiącu”, „Rozpoznane wydatki”, „Koszty stałe”) skips excluded patterns — working assumption [human] 7.9 |
| **S-05 F6 — excluded pattern merged as a source re-enters the analysis** — Trigger: S-07 | S-05 follow-ups; Backlog Handoff S-07 | **Fires, but no code change in S-07.** The trend shows the re-entry faithfully (only the root's decision applies, S-05 decision 4). Fixing it means changing `validateMerge` + the decision dialog — another view (`/patterns/<key>`), against one-view. Record as still open with trigger „product feedback”; a unit case in the trend documents the behaviour |
| **S-06 — `/home` „Koszty stałe · N pozycje podrożały”** = `fixedOverview(patterns, rows).changed.filter((r) => r.deltaMinor > 0).length` — Trigger: S-07 | S-06 follow-ups; Backlog Handoff S-07 | **In scope** if the plan renders the kit's stat cards (lean: yes, see decisions). Reuse `fixedOverview` verbatim — never re-derive |
| S-06 — one-off merchants list as „nowy” on real data — Trigger: product feedback or S-07's `/home` stat card surfacing the same noise | S-06 follow-ups | **Not triggered**: the card counts rises only (`deltaMinor > 0` in `changed`), and a one-off pattern is `new`, never `changed`. Would fire if the plan shows „nowe” on `/home` (kit does not) |
| S-06 — D5 flip hides an out-of-tolerance rise (`[human]` 4.10) | S-06 follow-ups | Not triggered; the „podrożały” count inherits it. No work |
| S-06 — `Badge` `changed`, `/patterns` G28 badges; panel radius 20 px vs 12 px; `patternTxs` drift throws past the error branch | S-06 follow-ups | Not triggered. **Relevant:** `/home` will be a third page calling `patternTxs` via the aggregate; the plan should wrap the computation so a drift lands in the `InlineAlert` error branch, not a 500 (cheap to do right in a new page). Panels: use `Panel.astro` as-is (consistent with other views) |
| S-04 F11 (8 px field radius), F3 (focus ring), F4 (threshold endpoints) | S-04 / S-05 follow-ups | Not triggered — `/home` has no form field; its links (`Zobacz wszystkie wzorce`, CTA buttons) reuse existing `buttonVariants`/`BackLink` rings |
| S-03 F3/F5–F7, S-01 F8, undo-import F3, S-05 F4/F5/F7/F8/F9 | older follow-ups | Not triggered by S-07 |

Next: `/10x-research over-limit-trend` — month-axis definition (present months vs continuous range) against the
fixture's 12 months (2025-09 … 2026-08), which fixture patterns carry a US-05-like frequent pattern for a count
threshold, the `/home` stat-card semantics the PRD leaves undefined, the „niepełny” conflict, and the reuse contract
with `listOverview` / `fixedOverview` need grounding before a plan.

## Autonomous decisions

Made by the `new` step of run `2026-09-28-s05-s06-s07` in place of asking a human.

- **Did not STOP after `change.md`** (10x-new says display the next step and wait). Chosen: continue to handoff and
  commit. Why: no human in the loop (agent contract, rule 1). Would change: a maintainer message pausing the run.
- **Next step = `/10x-research`, not the skill's default `/10x-plan`.** Why: the `/home` dashboard carries several
  figures the PRD does not define, a PRD↔kit conflict, and an open month-axis definition — all need code/fixture
  grounding; the orchestrator named it. Rejected `/10x-frame`: FR-013 framing is settled (PRD resolution + maintainer
  bindings). Would change: research already on disk.
- **Migration = no.** Chosen: compute the trend on read from `loadPatternData`. Rejected: stored monthly totals. Why:
  „według dzisiejszych progów” means every threshold change must move every month — a stored total would go stale.
  Would change: a performance finding that the read cannot serve `/home` in seconds (guardrail) — none expected at
  12 months.
- **The view is `/home` (kit `dashboard()`), bound in full as one view; the trend panel is the core.** Rejected: a new
  `/trend` route (kit has none — would be invented); rejected: the trend panel alone on an otherwise empty `/home`
  (the kit's `/home` is one composition and `home.astro` is a placeholder; S-06 already queued the stat card here).
  Why: one view + global tokens is satisfied by `/home`. Kit elements whose values the PRD does not define
  („Rozpoznane wydatki”, „Koszty stałe” value, „Co wraca najczęściej” order, deltas) are for the plan to either define
  from existing pure functions or drop behind a DESIGN-GAP. Would change: research finding one of those figures needs
  new domain rules — then that element is cut from S-07 and recorded as a gap, not invented.
- **„niepełny” marker: lean = PRD wins (no marker, no `trend.current` legend entry, the latest bar not singled out as
  incomplete).** Rejected: rendering kit's `.hot` + „niepełny” as-is. Why: a PRD acceptance criterion outranks a kit
  sample, and the app cannot know completeness (the reference month is the latest in the data). Final call in the
  plan with a DESIGN-GAP row. Would change: the maintainer revising the PRD assumption, or the plan finding the import
  range end date makes completeness knowable *and* the maintainer wanting it shown.
- **Month axis: lean = continuous calendar range from the earliest to the reference month, zero-filled.** Rejected:
  only months with ≥ 1 row. Why: a missing month would silently compress the time axis, and the PRD's „0, nie brak
  wartości” spirit; on the fixture both coincide (12 consecutive months). Left to research/plan to confirm. Would
  change: the plan reading „miesiące obecne w danych” strictly and the maintainer preferring it.
- **Excluded patterns out of every `/home` total** — working assumption from S-05 [human] 7.9 (the orchestrator's
  instruction). Would change: the maintainer answering 7.9 „only ‚ponad próg’ sums” — then „Rozpoznane wydatki” could
  include them (the trend never does, S-05 decision 8).
- **S-05 F6 not fixed here.** Why: fixing it touches `validateMerge` and the `/patterns/<key>` dialog (another view).
  Would change: the visual gate showing a user-visible wrong number on `/home` caused by it.
- **Candidate DESIGN-GAPs listed, not registered.** Why: ids are assigned when the plan fixes what renders (as in
  S-03…S-06 `new`). Would change: the contract requiring gap rows at `new`.
- **Title in Polish**, matching the repo's log and earlier slices.
