# Handoff — `over-limit-trend` (slice S-07)

Written by the ship step (archive + push + PR + CI + merge + deploy) of run `2026-09-28-s05-s06-s07`, as the final
pre-merge state before `git push`. The slice is archived; the PR, CI rounds, merge sha and deploy run are recorded in
`context/runs/2026-09-28-s05-s06-s07/run-log.md`, not here (after the merge this file is on `main` and is not edited).
The next agent must not get this wrong: the three open `[human]` rows (4.9–4.11) are a post-run checklist for the
product owner, not a blocker; there is no migration and no hosted `db push`.

## 1. State

| Item | Value |
|---|---|
| Branch | `feat/over-limit-trend`, cut from `main` at `c0b0068` |
| Commits | `c0b0068..HEAD`: through `116ee05` docs(over-limit-trend): bramka wizualna, then this step's `docs(over-limit-trend): handoff przed wysyłką` and `chore(archive): close over-limit-trend` (+ `docs(over-limit-trend): roadmapa po archiwizacji`) |
| Pushed / PR / merged | PR/CI/merge/deploy recorded in `context/runs/2026-09-28-s05-s06-s07/run-log.md` (pushed by this step after this commit; target `main`, `gh pr merge --merge`) |
| `change.md` status | `archived` (stamped by `/10x-archive` in this step; folder → `context/archive/2026-09-28-over-limit-trend/`) |
| `## Progress` rows remaining | 3 (`grep -c '^- \[ \]' plan.md`): `4.9`, `4.10`, `4.11` [human]. post-run human checklist, see §5 |
| Working tree | clean after the archive commits (checked by `tree-clean.sh` at the end of the ship step) |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/archive/2026-09-28-over-limit-trend/` | (ship step) the change folder, moved by `/10x-archive`; `change.md` stamped `archived` |
| `context/foundation/roadmap.md` | (ship step) S-07 `done` in At a glance + body, `## Done` entry, `## Backlog Handoff` row S-07 refreshed (no dependents) |
| `context/changes/over-limit-trend/handoff.md` | (ship step) this file, final pre-merge state |
| — below: artifacts of the visual-gate step, unchanged — | |
| `src/components/home/TrendChart.astro` | (fix `c095e37`) the `<ol>` is the 200 px bar area with `border-b` as the baseline; month labels `absolute -bottom-[22px]` inside a `pb-[22px]` wrapper; gridline `top-[100px]`; legend `mt-[9px]`; scroll box `flex flex-row-reverse overflow-x-auto` so a long axis opens on the newest months |
| `context/foundation/design-kit.md` | (fix `c095e37`) G35 amended: scroll start at the end of the axis, kit `.monthly-trend` geometry |
| `context/changes/over-limit-trend/screenshots/*.png` | 18 app PNGs (9 states × desktop/mobile), 4 kit frames (`kit-home-no-name-*`, `kit-home-empty-*`), and `home-kit-compare-*` (side by side, built from those real PNGs). Every app PNG was captured after `c095e37` |
| `context/changes/over-limit-trend/screenshots/README.md` | accounts, crafted files, how each state was reached, and the measurements |
| `context/changes/over-limit-trend/reviews/visual-review.md` | state verdicts, the hand-checked number, the US-05 walk-through, the fix, the gate table, observations; ends with the `VISUAL: PASS — …` line |
| `context/changes/over-limit-trend/plan.md` | Progress rows 4.12 and 4.13 ticked with gate notes |
| `context/changes/over-limit-trend/handoff.md` | This file |

## 3. Verification

Ship step: the local gate below is inherited from the visual-gate step (unverified by this step — no code changed
since `c095e37`, only docs). This step's verification is the PR's CI (`ci` → `smoke`) and the `main` run (`ci` →
`smoke` → `deploy`), recorded in the run log. `git diff --name-only main...HEAD -- supabase/migrations` = empty.

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

`none — shipped`

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

Made by the ship step:

- **Archived with 3 open `[human]` rows (4.9–4.11), 0 automated pending.** Chosen: `Continue archiving`; the rows are
  product-owner confirmations of decisions already implemented and gated, listed in the PR under „Do decyzji
  właściciela produktu”. Rejected: holding the slice. Would change: the owner rejecting a decision before merge.
- **No SHA repointing.** The PR merges with a merge commit (`--merge`), so every Progress SHA stays in `main`
  history. Would change: a squash merge.
- **Handoff finalised before the archive move**, so the archived copy carries the final state. Would change: nothing.
