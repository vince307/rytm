# Zmiany kwot i nowe wzorce stałe (S-06) — Plan Brief

> Full plan: `context/changes/fixed-cost-changes/plan.md`
> Research: `context/changes/fixed-cost-changes/research.md`

## What & Why

The user sees which fixed costs changed amount this month (any change against the previous charge — rise, decrease or
inside the D5 tolerance) and which are new against the previous calendar month (FR-012, US-04, PRD primary success
criterion 2). With no previous month to compare, the app says so instead of calling everything new.

## Starting Point

`/fixed` is a static placeholder that always shows the pre-import empty view. Patterns (with S-05 decisions) are
derived on read by `loadPatternData`; `/patterns` already uses „reference month = latest month in the data”. Nothing
computes a per-occurrence change or „new”. The synthetic fixture has no price change in its reference month.

## Desired End State

`/fixed` shows the kit's three sections — „Zmieniły kwotę” (date, „poprzednio …”, new amount, signed delta),
„Nowe w tym miesiącu” (first date, amount, „nowy”), „Bez zmian” — with counts and empty lines; the no-comparison message
replaces the new list; excluded, frequent and lapsed patterns are absent. On the fixture: kinoteka +4,00 zł,
silownia-ruch new.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Fixture | T11 kinoteka second step 55,99 → 59,99 zł on 2026-08-17, own phase | Headline case visible on the importable file; median 5299 and D5 type unchanged | Research |
| Candidates | Fixed, not excluded, charged in the reference month (latest month in data) | Same month and type as `/patterns`; maintainer binding | Research |
| „Changed” | Latest occurrence in R that differs from its immediate predecessor (any month) | A rise on the first of two R charges is not hidden | Plan |
| „New” | Charged in R, none in P, comparison month exists; wins over changed | D6 literal; one row per pattern | Research |
| No comparison | No user transaction in P → message, nothing new | Covers one month of data and a gap month | Research |
| D5 flip | Accepted; out-of-tolerance rise leaves `/fixed` | One typing rule across views — **against FR-012 literal → `[human]` 4.10** | Plan |
| One-off merchants | Listed as new (D5); follow-up | Changing D5 ripples into S-03–S-05 | Research |
| Empty / decrease UI | Sections always render with a muted line; decrease `−` in green | Kit silent → G34 placeholders | Plan |
| Badge | Only `new` tone (`excess`/25 + `excess-text`) | Kit tint has no token; `changed` unused | Plan |
| Smoke | Reuse the smoke user's May / June imports (+10 GETs) | They already hold change, new, unchanged, excluded, one-month | Plan |
| Scope | `/fixed` only; `/patterns` badges (G28) and `/home` card (S-07) deferred | One view + global tokens | Research + Plan |

## Scope

**In scope:** fixture T11 change; `fixedOverview` + `previousMonth` + `formatSignedMoney`; `/fixed` page with
`FixedSection` / `FixedRow`; Badge `new` tone; K23 / G34 gap rows; follow-ups file; smoke.

**Out of scope:** D5 typing changes, lapsed section, month picker / label, row links, dismiss state, migration,
`/patterns` badges, `/home` stat card.

## Architecture / Approach

`loadPatternData` → `fixedOverview(patterns, rows)` (R = `referenceMonth`, P = `previousMonth(R)`, rows joined via
`patternTxs`, ordered by `byOccurredThenId`) → `{ changed, new, unchanged, hasComparison }` → `fixed.astro` renders
`FixedSection` × 3 of `FixedRow`s. Exported for S-07.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Fixture | T11 second rise, regenerated F-02, sum 6497147 → 6497547 | Drift / D5 flip — both broken deliberately |
| 2. Pure rule | `fixedOverview`, helpers, 16 unit cases incl. fixture | Double-charge and gap-month semantics |
| 3. View: changed + unchanged | Page states, 2 components, K23 / G34, 6 smoke steps | Single-string rendering for smoke anchors |
| 4. View: new + seam sweep | „Nowe” section, no-comparison message, badge, follow-ups, 4 smoke steps | Stale comments / kit rows |

**Prerequisites:** S-05 on `main` (it is); local Supabase running.
**Estimated effort:** 4 implement sessions (one fresh agent per phase), then visual gate and review.

## Open Risks & Assumptions

- `[human]` 4.10: a large rise flips the pattern to `frequent` and it disappears from `/fixed` (remedy: pin).
- One-off merchants will crowd „Nowe w tym miesiącu” on real statements; the fixture cannot show it.
- Empty-section, decrease and no-comparison presentation are placeholders until the kit author delivers G34.

## Success Criteria (Summary)

- Fixture account: kinoteka listed under „Zmieniły kwotę” with +4,00 zł; silownia-ruch „nowy”; lapsed patterns absent.
- One month of data: „Nie ma poprzedniego miesiąca do porównania.” and no „nowy” anywhere (smoke).
- vitest +1 file, smoke 111 → 121, pgTAP 102 unchanged, fixture:check green on every phase.
