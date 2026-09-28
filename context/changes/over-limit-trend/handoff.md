# Handoff — `over-limit-trend` (slice S-07)

Written by the visual-gate step for `/home` of run `2026-09-28-s05-s06-s07`. The gate ended `VISUAL: PASS`
(`reviews/visual-review.md`), and one fix commit `c095e37` (chart geometry + 400 px scroll start) is in. The next
agent must not get this wrong: the only open Progress rows are the three `[human]` rows (4.9–4.11). They belong on
the post-run checklist and do not block archive or ship. There is no migration and no hosted `db push`.

## 1. State

| Item | Value |
|---|---|
| Branch | `feat/over-limit-trend`, cut from `main` at `c0b0068` |
| Commits | 19 on the branch after this step: …`51456f7` fix (impl review), `ab93530` docs impl review, **`c095e37` fix(over-limit-trend): geometria wykresu trendu jak kit i przewijanie od najnowszego miesiąca**, then this step's `docs(over-limit-trend): bramka wizualna` |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `impl_reviewed` (unchanged; `/10x-archive` stamps it) |
| `## Progress` rows remaining | 3 (`grep -c '^- \[ \]' plan.md`): `4.9`, `4.10`, `4.11` [human]. `4.12` and `4.13` [visual] were ticked in this step |
| Working tree | clean after the docs commit (dev servers on 4398/4399 killed; local DB reset, seed restored) |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/components/home/TrendChart.astro` | (fix `c095e37`) the `<ol>` is the 200 px bar area with `border-b` as the baseline; month labels `absolute -bottom-[22px]` inside a `pb-[22px]` wrapper; gridline `top-[100px]`; legend `mt-[9px]`; scroll box `flex flex-row-reverse overflow-x-auto` so a long axis opens on the newest months |
| `context/foundation/design-kit.md` | (fix `c095e37`) G35 amended: scroll start at the end of the axis, kit `.monthly-trend` geometry |
| `context/changes/over-limit-trend/screenshots/*.png` | 18 app PNGs (9 states × desktop/mobile), 4 kit frames (`kit-home-no-name-*`, `kit-home-empty-*`), and `home-kit-compare-*` (side by side, built from those real PNGs). Every app PNG was captured after `c095e37` |
| `context/changes/over-limit-trend/screenshots/README.md` | accounts, crafted files, how each state was reached, and the measurements |
| `context/changes/over-limit-trend/reviews/visual-review.md` | state verdicts, the hand-checked number, the US-05 walk-through, the fix, the gate table, observations; ends with the `VISUAL: PASS — …` line |
| `context/changes/over-limit-trend/plan.md` | Progress rows 4.12 and 4.13 ticked with gate notes |
| `context/changes/over-limit-trend/handoff.md` | This file |

## 3. Verification

Baseline = agent contract (`main` `c0b0068`): lint 0 · astro check 0 errors (124 files) · fixture:check OK · vitest
213 (12 files) · build OK · pgTAP 102 (5 files) · smoke 121 PASS. Every row below was observed in this step, after
fix `c095e37`.

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/over-limit-trend` |
| `npm run lint` | 0 errors, 0 warnings |
| `npx astro check` | 0 errors, 131 files (baseline 124, +7) |
| `npm run fixture:check` | OK |
| `npm test` | 246 passed, 14 files (baseline 213 / 12, +33 / +2) |
| `npm run build` | Complete |
| `npx supabase db reset && npx supabase test db` (sandbox off) | Files=5, Tests=102, PASS (delta 0) |
| smoke on `astro dev --port 4398` (sandbox off) | 131 PASS / 0 FAIL (baseline 121, +10); server killed, then `db reset` |
| Visual capture (Playwright, :4399) | 9 states × 2 viewports; `scrollWidth` = viewport in every shot; every bar sum fits its column |
| Real Chrome US-05 walk-through | count 1 → 49,13 / 133,47 / 41,24 / 87,59; count 2 → 98,22 / 51,98; removed → 12 × 0,00 + hint; no „niepełny” |
| Read-error state | `REVOKE SELECT ON public.transactions FROM authenticated` outside a transaction → captured → `npx supabase db reset` → `has_table_privilege('authenticated','public.transactions','select')` = `t`, 0 `visual-%` accounts |

## 4. Next command

`/10x-archive over-limit-trend` then ship (no hosted `db push` due, no migration)

## 5. Open

- **Post-run human checklist:** `[human]` 4.9: the axis holds only months with data (decision 2 / plan review F1;
  see `home-gap-month-*.png`). `[human]` 4.10: the bar chart is kept against the Non-Goal „Wykresy inne niż lista i
  suma” (decision 4). `[human]` 4.11: „Koszty stałe” = Σ of the `/fixed` amounts, one-off D5 merchants included
  (decision 6).
- **DESIGN-GAPs:** none added. G35 was amended (`TrendChart.astro`: scroll start and geometry).
- **Follow-ups** (`follow-ups/review-fixes.md`, each with `Trigger:`), unchanged by this step: S-05 F6; `patternTxs`
  drift → 500 on `/patterns` / `/fixed`; G36 figures; long-history scroll; one-off D5 noise in „Koszty stałe”;
  `PanelTitle.astro` extraction; a shared `monthIndex` in `src/lib/format.ts`.
- **Observations** (`reviews/visual-review.md`): wide bars with 1–2 months (kit `flex:1` rule); the header shows the
  calendar month while the lead shows the data month (AppLayout, pre-S-07). Neither is actionable in this slice.

## 6. Autonomous decisions

Made by the visual-gate step of run `2026-09-28-s05-s06-s07` in place of asking a human.

- **F6 fixed, not recorded.** The baseline under the month labels was visibly off the kit `.monthly-trend` in the
  first capture. The fix is local to `TrendChart.astro`, which has one consumer. Rejected: a G35 note only. Would
  change: the kit author preferring the labels inside the axis.
- **400 px scroll opens at the end of the axis (`flex-row-reverse`).** Rejected: leaving it at the oldest month, which
  hid the reference month the stat card reports; compressing the bars below 44 px, where a sum would no longer fit;
  a client script. Pure CSS, no DOM or reading-order change. Would change: usability feedback preferring
  oldest-first, or the kit defining a mobile trend frame.
- **PNGs from Playwright, walk-through in Claude-in-Chrome.** Chrome screenshots do not land on disk. This is the
  same split as the S-06 worked example. Would change: a Chrome tool that saves PNGs into the repo.
- **Read-error reached with REVOKE + `db reset`**, not `BEGIN … ROLLBACK`: the page's HTTP request uses another
  connection, so a rolled-back revoke never reaches it. Grants were proven back (`has_table_privilege` = `t`). Would
  change: an app-level error path reachable without touching the DB.
- **One account per state, both viewports from the same account.** The worked example did the same. Would change:
  nothing (the data is identical per viewport).
- **`home-kit-compare` is a side-by-side composite of two real PNGs** (kit frame + `home-fixture-trend`). It is not a
  new capture, and it is labelled that way. Would change: the plan meaning a separate capture of the kit frame only
  (that exists too: `kit-home-no-name-*`).
