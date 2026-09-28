# Handoff — `over-limit-trend` (slice S-07)

Written by the `/10x-impl-review over-limit-trend` step (full plan, phases 1–4) of run `2026-09-28-s05-s06-s07`.
The review is filed at `reviews/impl-review.md` and ends `MERGE: CLEAR`. The one fix commit `51456f7` is in, and
`change.md` is `impl_reviewed`. The next agent must not get this wrong: the 5 open Progress rows are `[human]`
(4.9–4.11, post-run checklist) and `[visual]` (4.12–4.13, the next step). Nothing else is pending.

## 1. State

| Item | Value |
|---|---|
| Branch | `feat/over-limit-trend`, cut from `main` at `c0b0068` |
| Commits | 17 on the branch after this step: …`286884f` feat p4, `4fec6ef` epilogue, `a5bc149` handoff p4, **`51456f7` fix(over-limit-trend): poprawki z przeglądu implementacji**, then this step's `docs(over-limit-trend): przegląd implementacji` |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `impl_reviewed` (was `implemented`) |
| `## Progress` rows remaining | 5 (`grep -c '^- \[ \]' plan.md`): `4.9`, `4.10`, `4.11` [human]; `4.12`, `4.13` [visual]. The [reviewer] rows 1.8 / 2.10 / 3.10 / 4.8 were performed and ticked here |
| Working tree | clean after the docs commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/over-limit-trend/reviews/impl-review.md` | Implementation review: 0 critical, 4 warnings (F1–F4, all fixed or split into fixed plus follow-up), 4 observations; evidence table, real-data invariant, deliberate breaks; last line `MERGE: CLEAR — …` |
| `src/components/home/TrendChart.astro` | (fix `51456f7`) gridline `<div>` moved out of `<ol>` into a `relative` wrapper; `aria-hidden` on the legend dot; one `infoPanel` class constant for `note` / `hint` |
| `src/pages/home.astro` | (fix `51456f7`) `HomeResult` type with `referenceMonth: string` on the data branch (no `?? ""`); empty branch discriminated by `result.referenceMonth === null`; one local `monthIndex` used by `leadFor` and `deltaFootFor` |
| `context/foundation/design-kit.md` | (fix `51456f7`) G35 amended: 10 px sum, `min-w-[44px]`, in-panel scroll, `#9da9aa` import border, K18 read error. G36 amended: hidden delta foot, `#72501f` → `excess-text` |
| `context/changes/over-limit-trend/follow-ups/review-fixes.md` | (fix `51456f7`) false "G35 note" claim corrected; 2 new items with `Trigger:` — `PanelTitle.astro` extraction (six inline copies), a shared `monthIndex` in `src/lib/format.ts` for `home.astro` + `patterns/[...key].astro` |
| `context/changes/over-limit-trend/plan.md` | Progress rows 1.8, 2.10, 3.10, 4.8 ticked with review notes |
| `context/changes/over-limit-trend/change.md` | `status: impl_reviewed` |
| `context/changes/over-limit-trend/handoff.md` | This file |

## 3. Verification

Baseline = agent contract (`main` `c0b0068`): lint 0 · astro check 0 errors (124 files) · fixture:check OK · vitest
213 (12 files) · build OK · pgTAP 102 (5 files) · smoke 121 PASS. Every row below was observed in this step, both
before and after the fix commit (same results).

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/over-limit-trend` |
| `npm run lint` | 0 errors, 0 warnings (after the fix: the first draft's `class={infoPanel}` warned `prefer-class-list-directive`, so it was switched to `class:list`) |
| `npx astro check` | 0 errors, 131 files (baseline 124, +7 new files) |
| `npm run fixture:check` | OK |
| `npm test` | 246 passed, 14 files (baseline 213 / 12, +33 / +2) |
| `npm run build` | OK |
| `npx supabase db reset && npx supabase test db` (sandbox off) | Files=5, Tests=102, PASS (delta 0) |
| smoke on `astro dev --port 4398` (sandbox off) | 131 PASS / 0 FAIL (baseline 121, +10 as planned); server killed afterwards |
| `git diff --name-only main...HEAD -- supabase/` | empty (no migration, as planned) |
| Real-data invariant (fresh account, F-02 fixture via `POST /api/imports`, thresholds via the API; `/home` vs Σ `/patterns` `overMinor`) | equal in 5 states: 0,00 / 972,41 / 972,41 / 17,07 / 17,07. A changed threshold (kino count 1 → 2) and a removed one moved historical months; an excluded pattern (stacja) contributed 0 to every month. Account deleted, then `npx supabase db reset` |
| Deliberate break 1: `overLimitTrend` without the `pattern.excluded` skip | unit case 7 FAIL (1 of 22), case 5 green, so the red is the guard; restored, green |
| Deliberate break 2: `applicableThreshold` returns `stored` without `appliesTo` | FAILs in `pattern-view.test.ts` (listOverview inapplicable threshold) **and** trend case 8, which proves the one guard feeds both callers; restored, 246 green |
| Served HTML after fix | `<ol>` has 0 non-`<li>` children; lead „Twój sierpień w jednym spokojnym widoku.” |

## 4. Next command

visual gate for /home

## 5. Open

- **Post-run human checklist:** `[human]` 4.9 — axis holds only months with data (decision 2 / plan review F1).
  `[human]` 4.10 — bar chart kept against the Non-Goal „Wykresy inne niż lista i suma” (decision 4). `[human]` 4.11 —
  „Koszty stałe” = Σ of the `/fixed` amounts, one-off D5 merchants included (decision 6).
- **Visual step:** `[visual]` 4.12 (screenshots of the nine named states, desktop 1440 px and mobile ~400 px, port
  4399, freshly registered local accounts) and 4.13 (fixture walk-through). The visual step should also judge impl
  review F6: `TrendChart.astro` puts `h-[200px]` on each `<li>` including the labels, so the `border-b` baseline sits
  under the axis labels and the dashed gridline is the midpoint of the whole column. Compare with the kit
  `.monthly-trend` in `home-kit-compare`, and check the `m-0` differences in the panel title.
- **DESIGN-GAPs:** none added; G35 and G36 were amended to match what renders.
- **Follow-ups** (`follow-ups/review-fixes.md`, each with `Trigger:`): S-05 F6; `patternTxs` drift → 500 on
  `/patterns` / `/fixed`; G36 figures; long-history scroll; one-off D5 noise in „Koszty stałe”; **new:**
  `PanelTitle.astro` extraction; a shared `monthIndex` in `src/lib/format.ts`.

## 6. Autonomous decisions

Made by the `/10x-impl-review` step of run `2026-09-28-s05-s06-s07` in place of asking a human.

- **Triage without AskUserQuestion: F1, F2, F5 fixed; F3 and F4 fixed in-view, cross-view part deferred; F6–F8
  recorded or accepted.** Why: the contract says WARNING → fix if cheap. Every fix is a few lines inside the one view
  (`/home` + its components) or its gap rows. Extracting `PanelTitle` or a shared `monthIndex` would edit four other
  views (the one-view rule). Would change: the maintainer asking for the shared components in this PR.
- **Row 3.10 ticked despite `home.ts` importing `previousMonth` from `over-limit.ts` (F7).** Why: the row's intent is
  „no second rule / month arithmetic”; reusing the shared month step fulfils it and a copy would violate the seam
  sweep. Would change: the plan author meaning the import list literally (then move the call into `trend.ts`).
- **F8 accepted (no AC 4 text in `trend.ts`).** Why: the plan's own grep forbids „niepełny” outside
  `TrendChart.astro`, and the aggregate has no completeness notion. Would change: nothing short of a plan rewrite.
- **F6 (chart geometry) left to the visual gate, not fixed blind.** Why: it is a pixel-level kit comparison, and the
  visual step has the screenshots to decide. Would change: this review having screenshots showing the baseline
  visibly wrong.
- **Real-data invariant checked with a throwaway script (`$TMPDIR`/scratchpad, not committed) and a temporary vitest
  file used only to dump the fixture payload, deleted immediately (tree clean).** Why: the task asked for real data,
  and the payload builder is TypeScript. Would change: nothing.
- **`design-kit.md` committed as edited.** The file was already failing `prettier --check` on HEAD before this step,
  so the check result says nothing about these edits. lint-staged ran on commit. Would change: a maintainer rule to
  keep that file Prettier-clean (then run `prettier --write` separately, as its own commit).
- **Verdict APPROVED / `MERGE: CLEAR`.** Why: 0 CRITICAL, every automated criterion met, suites green after the fix,
  and the open rows are [human]/[visual] by design. Would change: the visual gate finding a defect in `/home`.
