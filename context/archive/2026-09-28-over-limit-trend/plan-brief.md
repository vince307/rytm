# Trend „ponad progiem” per miesiąc (S-07) — Plan Brief

> Full plan: `context/changes/over-limit-trend/plan.md`
> Research: `context/changes/over-limit-trend/research.md`

## What & Why

FR-013 / US-05: the user sees the „ponad progiem” sum for every month of their data, computed with **today's**
thresholds — change or remove a threshold and every month, historical ones too, moves; a month with nothing over shows
0. This is the secondary success criterion („czy suma maleje z miesiąca na miesiąc”) and the reason `/home` exists.

## Starting Point

`/home` is a static placeholder that shows the pre-import empty state even to accounts with data. `overLimit` already
computes every month of one pattern; `listOverview` (`/patterns`) reads only the reference month; S-06 left
`fixedOverview` for the „Koszty stałe” card.

## Desired End State

`/home` with data shows the kit's no-name dashboard: „Dzień dobry.” + „Twój <miesiąc> w jednym spokojnym widoku.”,
two stat cards („Ponad progiem w tym miesiącu” with a delta against the previous month; „Koszty stałe” with „N
pozycje podrożały”), a full-width bar chart with one labelled bar per month present in the data (a month without any import is
absent, not 0), and the import panel. No bar is marked „niepełny”; excluded patterns add nothing; fewer than 3 months shows
„Trend pojawi się po 3 miesiącach danych.”.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Aggregate | New pure `overLimitTrend` summing `overLimit(...).byMonth`, guards shared with `listOverview` | Last point = Σ `/patterns` over-limit figures by construction | Research + Plan |
| Month axis | Months present in the data only (FR-013 literal; `[human]` 4.9) | A month without data is unknown, not „0 ponad progiem”; same gap rule as `/fixed` | Plan review F1 (overturned the plan's continuous axis) |
| „niepełny” | Not shown (PRD US-05 AC 4 over the kit) | The app cannot know completeness | Research |
| Chart vs Non-Goal | Bars kept, each with its visible sum (`[human]`) | „sumy per miesiąc” stay readable; kit G6 delivered the chart | Plan |
| Stat 1 | Trend's last point + delta to `previousMonth(R)`, foot hidden when that month has no data | Two points of one aggregate, no new rule | Research + Plan |
| „Koszty stałe” | Σ of `/fixed` amounts in R + rises from `fixedOverview` (`[human]` for the value) | Figures the user already sees on `/fixed` | Research + Plan |
| Out | „Rozpoznane wydatki”, „Co wraca najczęściej” → G36; 2-column stats, full-width trend | PRD defines neither; never invent | Research |
| Greeting / lead | No-name variant (`#/home-no-name`), month via `copyExtra` template | App stores no name (K5) | Research + Plan |
| Error | `try` around the pure assembly → `InlineAlert` (S-06 follow-up); `/patterns`, `/fixed` untouched | Drift throw never a 500 on the new page | Research |
| Migration | None | Recomputed on read; thresholds never per month | change.md |

## Scope

**In scope:** `overLimitTrend`, `applicableThreshold`, `formatMonthAxis`, `homeStats`; `/home` with title
block, two stat cards, trend panel, import panel, error and pre-import branches; copy K24/K25 + placeholders G35;
design-kit rows G35, G36, K24, K25, G6 amended; smoke +10; follow-ups file.

**Out of scope:** „niepełny” marker, „Rozpoznane wydatki”, „Co wraca najczęściej”, named greeting, S-05 F6 fix,
`try` retrofit on `/patterns` / `/fixed`, migration, fixture change.

## Architecture / Approach

`loadPatternData` (one read) → `overLimitTrend(patterns, rows, thresholds)` + `fixedOverview(patterns, rows)` →
`homeStats(trend, fixed)` → Astro render (`TrendChart`, `StatCard`, `ImportPanel` under `src/components/home/`). No
API route, no island, no stored totals.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. `overLimitTrend` | Pure aggregate + axis + formatter, unit-tested on crafted rows and the fixture | Guard drift from `listOverview` (invariant case) |
| 2. `/home` trend panel | Title block, trend chart, error / pre-import branches, smoke +6 | Bar label legibility; smoke `>text<` anchors |
| 3. Stat cards | `homeStats`, `StatCard`, two cards, smoke +3 | Delta / „Koszty stałe” definitions (`[human]`) |
| 4. Import panel + sweep | `ImportPanel`, follow-ups, seam sweep, smoke +1, visual + `[human]` rows | Stale kit rows / duplicated classes |

**Prerequisites:** S-04, S-05, S-06 shipped (on `main` `c0b0068`); local Supabase for pgTAP and smoke.
**Estimated effort:** 4 small phases, one fresh agent each, then the visual step.

## Open Risks & Assumptions

- 12 value labels at ~400 px: the chart scrolls inside its panel; legibility judged in the visual step.
- Gaps between imports show only in the axis labels; the delta foot hides after a gap (`[human]` 4.9).
- „Koszty stałe” value includes every one-off merchant D5 types `fixed` (S-06 follow-up, fired here — `[human]` 4.11).
- „Koszty stałe” includes an own transfer typed `fixed` (fixture: `jan przykładowy` 1500 zł) — `[human]` 4.11.
- Excluded patterns skipped in every monthly total rests on S-05 `[human]` 7.9 (working assumption).

## Success Criteria (Summary)

- On the fixture with `kino światło` count 1 the bars read 49,13 / 133,47 / 41,24 / 87,59 zł in Oct, May, Jun, Jul and
  0,00 zł elsewhere; count 2 and removal move historical months.
- Smoke proves save / change / remove / exclude / restore reach `/home`; unit tests prove the invariant with `/patterns`.
- Full local gate green in every phase: vitest 213 → + S-07 cases (14 files), smoke 121 → 131, pgTAP 102 unchanged.
