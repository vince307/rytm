# Handoff — `over-limit-trend` (slice S-07)

Written by the `new` step (`/10x-new over-limit-trend`, run `2026-09-28-s05-s06-s07`). The change folder exists with
`change.md` (identity, roadmap-claim corrections, kit binding, triggered follow-ups, autonomous decisions); no code.
The one thing the next agent must not get wrong: the trend's month sums must come from the **same** `overLimit` /
`appliesTo` / `patternTxs` path `listOverview` uses (excluded patterns contribute nothing), so the latest bar equals
the `/patterns` over-limit figures for the reference month — never a second derivation.

## 1. State

| Item | Value |
|---|---|
| Branch | `feat/over-limit-trend`, cut from `main` at `c0b0068` |
| Commits | 1 on the branch: `docs(over-limit-trend): change identity (autonomous run)` |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `new` |
| `## Progress` rows remaining | n/a — no `plan.md` yet |
| Working tree | clean after the commit (only the two files below were staged, by explicit path) |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/over-limit-trend/change.md` | Change identity: outcome + PRD refs (FR-013, US-05, secondary success criterion), roadmap claim → repo now → correction table, migration verdict (none), kit binding (`dashboard()` / `trendChart()` on `/home`, `content.json` `trend.*` + `dashboard.*` keys), candidate DESIGN-GAPs (from G35), triggered follow-ups with take, `## Autonomous decisions` |
| `context/changes/over-limit-trend/handoff.md` | This file |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/over-limit-trend` (observed before writing) |
| `test -d context/changes/over-limit-trend` / `context/archive/*over-limit-trend*` | absent before creation (uniqueness check) |
| Code suites (lint, astro check, vitest, build, pgTAP, smoke) | **not run** — docs-only step, no code changed; baseline on `main` `c0b0068` per agent contract is inherited, unverified |

## 4. Next command

`/10x-research over-limit-trend`

## 5. Open

- **PRD ↔ kit conflict**: `design/rytm-os/prototype/app.js` `trendChart()` marks the current month „niepełny” (`.tbar.hot`,
  legend `trend.current`); PRD US-05 AC says no marker. Lean: PRD wins → DESIGN-GAP (next free id G35). Plan decides.
- **Month axis**: present months vs continuous earliest → reference month, zero-filled (lean). Fixture has 12
  consecutive months 2025-09 … 2026-08, so both coincide there; unit tests must cover a gap month.
- **Undefined `/home` figures**: „Rozpoznane wydatki”, „Koszty stałe” value, „+X zł względem <miesiąc>”, „Co wraca
  najczęściej” order, month names in lead/axis — define from existing pure functions or cut behind a DESIGN-GAP.
- **Follow-ups in scope**: skip `MerchantPattern.excluded` in every monthly total (S-05, [human] 7.9 working
  assumption); `/home` „N pozycje podrożały” = `fixedOverview(...).changed.filter((r) => r.deltaMinor > 0).length`
  (`src/lib/patterns/fixed.ts`). **Fires, not fixed**: S-05 F6 (`validateMerge` lets an excluded source re-enter).
  All in `context/archive/2026-09-28-durable-pattern-decisions/follow-ups/review-fixes.md` and
  `context/archive/2026-09-28-fixed-cost-changes/follow-ups/review-fixes.md`.
- **Error branch**: `/home` will call `patternTxs` (`src/lib/patterns/view.ts`) via the aggregate; a drift throw should
  land in the `InlineAlert` error state, not a 500 (S-06 impl-review follow-up).
- Carried `[human]` rows from earlier slices (not this slice's): S-05 7.9, S-06 4.10.

## 6. Autonomous decisions

See `change.md` `## Autonomous decisions` for the full list with reversal conditions. Summary:

- Did not STOP after `change.md` — no human in the loop. Would change: a maintainer pause.
- Next = `/10x-research` (not `/10x-plan`): undefined dashboard figures, a PRD↔kit conflict and the month axis need
  grounding. Would change: research already on disk.
- Migration = no (trend computed on read; stored totals would violate „według dzisiejszych progów”). Would change: a
  performance finding on the read.
- View = `/home` kit `dashboard()` bound in full, trend panel as the core; no new route. Would change: a figure needing
  new domain rules → cut to a DESIGN-GAP.
- „niepełny” marker dropped per PRD (lean). Would change: maintainer revising the PRD assumption.
- Month axis continuous + zero-filled (lean). Would change: a strict reading preferred by the maintainer.
- Excluded patterns out of every `/home` total ([human] 7.9 assumption). Would change: 7.9 answered narrowly.
- S-05 F6 not fixed here (another view). Would change: a wrong `/home` number traced to it in the visual gate.
