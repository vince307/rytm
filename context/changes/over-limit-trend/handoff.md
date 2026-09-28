# Handoff — `over-limit-trend` (slice S-07)

Written by the `research` step (`/10x-research over-limit-trend`, run `2026-09-28-s05-s06-s07`). `research.md` is on
disk and `change.md` is `preparing`; no product code. The one thing the next agent must not get wrong: the trend is a
new pure aggregate that applies **exactly** `listOverview`'s three guards (`appliesTo`, reference month present,
`!pattern.excluded`) over `patternTxs(pattern, indexById(rows))` and sums `overLimit(...).byMonth` — so
`trend[referenceMonth] === Σ listOverview(...).items[].overMinor`; never a second derivation, never a kit sample number.

## 1. State

| Item | Value |
|---|---|
| Branch | `feat/over-limit-trend`, cut from `main` at `c0b0068` |
| Commits | 2 on the branch: `docs(over-limit-trend): change identity (autonomous run)` (`8c08aef`), `docs(over-limit-trend): research` |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `preparing` (set by `metadata-guard.mjs mark-researched`) |
| `## Progress` rows remaining | n/a — no `plan.md` yet |
| Working tree | clean after the commit (three files staged by explicit path) |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/over-limit-trend/research.md` | Research: reuse contract, month axis, PRD↔kit conflicts, per-element in/out table for the kit's `/home`, shared components, error branch, fixture over-limit table (§ 7) |
| `context/changes/over-limit-trend/change.md` | Frontmatter only: `status: new → preparing`, `updated` |
| `context/changes/over-limit-trend/handoff.md` | This file |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/over-limit-trend` (observed before writing) |
| Fixture computation (node over `test/fixtures/ing/expected.json`, count/sum rule of `overLimit`) | per-month table in `research.md` § 7; 12 months 2025-09 … 2026-08 |
| Code suites (lint, astro check, vitest, build, pgTAP, smoke) | **not run** — docs-only step; baseline on `main` `c0b0068` inherited, unverified |
| Live DB | not touched |

## 4. Next command

`/10x-plan over-limit-trend`

## 5. Open

- **Scope (research recommendation, plan decides)** — IN: trend panel (`copy.trend.*`, `trend.tooShort` for < 3
  months), stat „Ponad progiem w tym miesiącu” = trend's last point, its delta foot vs `previousMonth(R)` (copy gap),
  „Koszty stałe” foot = `fixedOverview(...).changed.filter((r) => r.deltaMinor > 0).length` (`src/lib/patterns/fixed.ts`),
  its value only as Σ of `/fixed` row amounts in R (else foot-only + gap), `greetingNoName`, lead with locative month
  (`copyExtra.patterns.monthsLocative`), `+ Wgraj CSV`, import panel, existing empty state, `InlineAlert` error.
  OUT → DESIGN-GAP: „Rozpoznane wydatki” (PRD silent; tied to open `[human]` 7.9), „Co wraca najczęściej” (no
  selection rule; `derivePatterns` sorts by `sumMinor`), „niepełny” marker (PRD US-05 AC 4).
- **DESIGN-GAPs to register** in `context/foundation/design-kit.md` (next free **G35**): „niepełny” vs PRD; bar numeric
  value / accessibility (PRD Non-Goal „listy i sumy”); zero/all-zero bar rendering (kit `max(12%, v/max)` with max 0);
  no-threshold-yet state; delta foot + lead + „podrożały” verb copy (K11 → `copyExtra`); „Rozpoznane wydatki”;
  „Co wraca najczęściej”; tokens missing for kit bar grey / info-panel background (no raw hex).
- **Month axis**: recommended continuous earliest → reference month, zero-filled; unit case with a gap month.
  Needs a forward month step or backwards iteration with `previousMonth` (`src/lib/patterns/over-limit.ts`).
- **Fixture proof**: `kino-swiatlo` count 1 → 2025-10 49,13 · 2026-05 133,47 · 2026-06 41,24 · 2026-07 87,59, others 0;
  count 2 → only 2026-05 98,22 · 2026-07 51,98. Confirm the `derivePatterns` key for these (answer-key keys used).
- **Error branch**: wrap the aggregate + `fixedOverview` on `/home` so a `patternTxs` drift throw hits `InlineAlert`,
  not a 500 (S-06 follow-up). Do not retrofit `/patterns`/`/fixed`.
- **Follow-ups**: excluded patterns skipped in every monthly total (S-05, in scope); S-05 F6 (`validateMerge`) fires,
  not fixed here; carried `[human]` S-05 7.9, S-06 4.10.
- Smoke: add post-import `/home` cases next to the „kawiarnia smoke” threshold save/change/remove cases in
  `scripts/smoke.mjs` (bare text with and without the trigger).

## 6. Autonomous decisions

- **Question derived from `change.md`**, no `AskUserQuestion`. Would change: a maintainer message narrowing scope.
- **Month axis = continuous, zero-filled (recommended).** Rejected: months with ≥ 1 row only. Why: a time series
  must not compress gaps; US-05 AC 2 „0, nie brak wartości”; identical on the fixture. Would change: maintainer
  preferring the literal FR-013 reading.
- **„niepełny” out (PRD wins).** Why: US-05 AC 4 is explicit and the app cannot know completeness (reference month =
  latest in data). Would change: maintainer revising the PRD assumption of 2026-09-18.
- **Bar chart kept despite PRD Non-Goal „Wykresy inne niż lista i suma”**, on condition that every month's numeric
  sum is readable. Why: kit G6 delivered `.monthly-trend` for FR-013; numbers satisfy „sumy per miesiąc”. Would
  change: maintainer reading the Non-Goal as „no bars” → render the months as a list.
- **„Rozpoznane wydatki”, „Co wraca najczęściej” out.** Why: PRD silent, each needs a new product rule; never invent
  numbers. Would change: maintainer defining them (7.9 answer for the first; a selection rule for the second).
- **„Koszty stałe” value lean = Σ of `/fixed` row amounts in R.** Why: sum of figures the user already sees, no new
  rule. Would change: plan-review judging it a new definition → foot-only card + gap.
- **Delta foot in (lean).** Why: difference of two points of the same aggregate. Would change: copy template judged
  an invention → drop + gap.
- **Fixture computed from `expected.json`, not from running `derivePatterns`.** Why: research only; keys confirmed in
  the plan's unit case. Would change: a key mismatch in that case.
