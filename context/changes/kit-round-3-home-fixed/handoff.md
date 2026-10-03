# Handoff — `kit-round-3-home-fixed` (slice S-15)

Written by the `/10x-research` step of autonomous run `2026-10-02-kit-round-3`. `research.md` answers the kit binding
for `/home` and `/fixed`, the PRD/user-path check for the two removals (no conflict) and the full `copyExtra` audit;
no code touched. The next agent must not get wrong: the kit's `app.js` reads NO `content.json` key for these views —
wording comes from `content.json` keys where one with that meaning exists (`trend.noThreshold`, `fixedCosts.noChanges/
noNew/noComparison/readError`), layout from the prototype, and prototype "always-on" sample states (legend chips,
sections with rows under an error) render in the app only under the condition they describe.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/kit-round-3-home-fixed`, cut from `main` at `1bf6a5c` (after S-14) |
| Commits | 2 — `docs(kit-round-3-home-fixed): change identity (autonomous run)`, `docs(kit-round-3-home-fixed): research` |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `preparing` (set by `metadata-guard.mjs mark-researched`) |
| `## Progress` rows remaining | n/a — no `plan.md` yet |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `context/changes/kit-round-3-home-fixed/research.md` | §1 `/home` kit binding, §2 PRD + user paths + smoke/unit pins, §3 trend, §4 `/fixed`, §5 follow-ups state, §6 `copyExtra` audit (every leaf, reader, kit key, verdict), Open Questions |
| `context/changes/kit-round-3-home-fixed/change.md` | frontmatter only: `status: new → preparing`, `updated` |
| `context/changes/kit-round-3-home-fixed/handoff.md` | this file |

## 3. Verification

Docs-only step; no suite run (nothing in `src/`, `scripts/`, `supabase/`, `test/` changed). No live-DB experiment
(no schema question arose — no migration). Facts were read from the branch in this step: kit `prototype/app.js`,
`styles.css`, `views/*.html`, `react-kit/docs/{content.json,routes.md,copy-map.md}`, `CHANGELOG.md`; `src/pages/
{home,fixed}.astro`, `patterns/[...key].astro`, home/fixed components, `src/lib/patterns/{home,trend,fixed}.ts`,
`src/lib/format.ts`, `src/content/copy.ts`, `scripts/smoke.mjs`, `test/unit/{home-stats,over-limit-trend}.test.ts`,
PRD, roadmap, `design-kit.md`, archive S-07/F-04/S-14. Baseline for later steps (inherited, unverified here): `main`
at `1bf6a5c` — lint 0; astro check 0 / 162 files; fixture OK; vitest 375 / 26 files; build OK; pgTAP 119 PASS;
smoke 192 / 0.

## 4. Next command

`/10x-plan kit-round-3-home-fixed`

## 5. Open

- Plan decisions with research recommendations (`research.md` § Open Questions): drop `HomeStats.fixedTotalMinor`
  (`src/lib/patterns/home.ts` `homeStats`, rewrite 3 cases in `test/unit/home-stats.test.ts`); „Podrożały” = rises only
  (`fixedRisen`); new `copyExtra.home` leaves for „Zobacz zmiany”, „Podrożały”, „Nowe”, `koszt/koszty/kosztów`, legend
  „Cienka kreska oznacza 0,00 zł”, delta suffixes „wzrost”/„spadek” (each `DESIGN-GAP` + gap row); trend chip text
  `trend.noThreshold`, shown only when `!hasThreshold`; zero note only when a bar is 0; `trendBarHeight` 12 → 8 %
  (update `describe("trendBarHeight")` case); bar `bg-muted`; group name `trend.gridLabel`; bar name `trend.amountLabel`.
- `/fixed`: `try` around `fixedOverview` → `fixedCosts.readError`; `noComparison` info panel under the title;
  `noChanges`/`noNew` in a `.fixed-empty-states` block after the sections; `unchangedEmpty` stays `copyExtra` (G34)
  — placement consistency open; drop `FixedSection` `compact`; drop the `deltaClass` G34 comment.
- Follow-ups in scope (verified open in code): S-14 F8 (`patterns/[...key].astro` `try` around `detailTarget` →
  `sequenceSummary`), F9 (`home.astro` comment above `leadFor`), `monthIndex` into `src/lib/format.ts` (used by
  `fillMonthLocative`), `PanelTitle.astro` with `.panel-title`/`.section-label` variant for `/home` + `FixedSection`
  (other 4 call sites stay), G36 tick.
- Smoke pins that move (`scripts/smoke.mjs`, by step name): „home offers the next import”, „home counts fixed costs
  that rose”, „home before import has no trend” (negative control), „home shows the trend without a threshold” /
  „home shows the over-limit sum”, „fixed with one month lists no change” / „fixed lists a changed amount” (suffix
  joins the `>+1,50 zł<` node), „fixed without a previous month says so” / „fixed compares with the previous month”;
  header comment. Keep „względem” out of new strings („home has no comparison with one month”).
- Closing audit (`research.md` § 6): in-scope drops `home.empty*` ×4, `home.lead`, `home.deltaFoot`, `fixed.eyebrow`,
  `fixed.itemForms`; deletions `home.risen`, `home.risenForms`, `home.noThreshold`; outside S-15, byte-identical:
  `imports.debitForms`, `imports.santanderAccountName`, `auth.resetNewVisual.eyebrow/title` (do or follow-up).
  Register drift in `context/foundation/design-kit.md` (K24/G34 comments, G35 text, K29 moot, `home.empty*` no row).
- `[human]` rows: removed `/home` fixed-cost total (PRD silent; S-07 `[human]` 4.11 never ticked); removed import
  panel (PRD silent); one-off merchants in the „Nowe” count; trend chip key vs literal.
- No migration. No `DESIGN-GAP` added in this step.

## 6. Autonomous decisions

1. **Removal of `ImportPanel` and the second card confirmed (A2/A3 of `change.md`).** Chosen: remove both. Rejected:
   keep either with a `DESIGN-GAP`. Why: no round-3 home view (incl. `home-demo`) draws them, the PRD names neither
   (FR-011/012/013, US-04/05, Success Criteria checked), `/imports/new` stays reachable from the title button, empty
   states and nav, demo gating lives in `/imports/new`. Would change: the maintainer asking for the total or the panel.
2. **Copy key over prototype literal when the meaning matches** (`trend.noThreshold` over „Brak progu”,
   `trend.gridLabel` over „Miesięczna suma ponad progiem”). Rejected: literal verbatim in `copyExtra`. Why: CLAUDE.md
   rule „copy from `content.json`”; precedent `fixedCosts.new` over „Nowe w tym miesiącu”. Would change: visual gate
   or maintainer preferring the literal → `copyExtra` + gap row.
3. **Conditional rendering of prototype sample states** (legend chips, info panels; no sections under an error).
   Rejected: always-on as in the prototype. Why: an always-on „Brak progu” is false for users with thresholds; rows
   under an error would be invented data. Would change: the kit adding conditions or an explicit error layout.
4. **„Podrożały” counts rises only.** Rejected: all changed rows (kit sample `fixedCosts.counts.changed`). Why: the
   label says „went up”; PRD Success Criteria „które podrożały”. Would change: the kit adding a rule or the maintainer.
5. **Research did not run suites or DB experiments.** Why: no question needed them (docs step, no schema). Would
   change: a schema question in the plan.
