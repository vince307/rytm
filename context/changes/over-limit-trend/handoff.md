# Handoff — `over-limit-trend` (slice S-07)

Written by the `implement phase 2` step (`/10x-implement over-limit-trend phase 2`, run
`2026-09-28-s05-s06-s07`). Phase 2 (`/home` title block + trend panel) is implemented, gated and committed. The one
thing the next agent must not get wrong: `TrendChart.astro`'s bars are a `<li>` with an explicit `h-[200px]` and a
`relative flex-1` middle wrapper around the absolutely-positioned `<i>` bar — **not** a bare `<i style="height:X%">`
direct child of the list the way the kit does it. A bare `<i>` two levels deep (inside a `<li>` whose own height is
"auto", the default for a non-stretched flex item) would not resolve the percentage height in every browser; if
Phase 3/4 restructure this markup, keep the bar's percentage height resolving against an ancestor with an
*explicit* pixel height, not one inferred from `align-items`.

## 1. State

| Item | Value |
|---|---|
| Branch | `feat/over-limit-trend`, cut from `main` at `c0b0068` |
| Commits | 9 on the branch: `8c08aef` change identity, `3fedeb7` research, `6278303` plan, `579cb9e` plan review, `0a40fab` feat p1, `5ac8aa7` docs (p1 SHA), `b5592b7` handoff after p1, `3894189` **feat(over-limit-trend): /home — title block i panel trendu (p2)**, `2082444` docs (p2 SHA record) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` (unchanged) |
| `## Progress` rows remaining | 25 (`grep -c '^- \[ \]' plan.md`) — Phase 2 fully closed except `2.10 [reviewer]` (not mine); Phases 3–4 untouched |
| Working tree | clean (`git status --porcelain` empty after both commits) |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/components/home/TrendChart.astro` | New. Kit `trendChart()` / `.monthly-trend` without `.tbar.hot`/„niepełny”/`trend.current` (G35); props `{ bars, legend, ariaLabel, note?, hint? }`; each bar's value/label rendered as the sole child of its `<span>` on one line (smoke `>text<` anchor rule) |
| `src/pages/home.astro` | Rewritten. `createClient` → `loadPatternData` → inside `try`: `overLimitTrend(...)`; three-way result union (`error` / `referenceMonth: null` / `trend`), same discriminant shape as `fixed.astro`. Error branch unchanged pattern (`InlineAlert kind="error"`, `DESIGN-GAP: K18`); pre-import branch (`referenceMonth === null`) is the **exact same JSX** the placeholder had before this phase; new branch renders `PageTitle` (no-name lead, K24) + `Panel` + `TrendChart` |
| `src/content/copy.ts` | `copyExtra.home` gains `lead` (K24, `{month}` + `monthsNominative`, May byte-for-byte with `applyDashboardState`) and `noThreshold` (G35 placeholder) |
| `context/foundation/design-kit.md` | New rows **K24** (no-name lead copy) and **G35** (trend states the kit/PRD conflict on); **G6** status amended to note S-07 Phase 2 delivery; both new ids appended to „Do rundy 3” (items 26–27) |
| `scripts/smoke.mjs` | Header comment extended to mention `/home`; checker's `notContains` now accepts an array symmetrically to `contains` (plan review F2); 6 new steps inserted into the existing run: `home before import has no trend`, `home shows the trend without a threshold`, `home shows the over-limit sum`, `home drops the sum after threshold removal`, `home skips an excluded pattern`, `home recomputes every month` |
| `context/changes/over-limit-trend/plan.md` | Phase 2 `## Progress` rows 2.1–2.9 ticked with SHA `3894189`; row 2.10 `[reviewer]` left open |
| `context/changes/over-limit-trend/handoff.md` | This file |

## 3. Verification

All commands run and observed in this step (not inherited); baseline is Phase 1's own gate (`main` `c0b0068`
lint 0 · astro check 0 errors, 126 files · fixture:check OK · vitest 238, 13 files · build OK · pgTAP 102, 5 files ·
smoke 121 PASS).

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/over-limit-trend` (confirmed before writing) |
| `npm run lint` | 0 errors (one round of `npm run lint:fix` needed for Prettier wrapping in `TrendChart.astro` and one new `smoke.mjs` line, then clean — verified the fixed formatting kept every smoke-asserted string as the sole child of its element on one line) |
| `npx astro check` | 127 files, 0 errors/warnings/hints (baseline 126, +1 expected: `TrendChart.astro`) |
| `npm run fixture:check` | OK |
| `npm test` | 238 passed, 13 files (delta 0 — Phase 2 adds no unit tests, matches plan) |
| `npm run build` | passes |
| `npx supabase db reset && npx supabase test db` (sandbox disabled — Docker/127.0.0.1:54321) | Files=5, Tests=102, PASS (delta 0) |
| `ASTRO_DEV_BACKGROUND=1 npx astro dev --port 4398 --ignore-lock` + `BASE_URL=http://localhost:4398 npm run smoke` (sandbox disabled) | 127 PASS (121 + 6, matches plan exactly); server killed after (`lsof -ti :4398 \| xargs kill`) |
| Deliberate break 1 (`home.astro` `barsFor`: `trend.months.slice(-1)` instead of the full array) | `home recomputes every month` FAILs on `>5,50 zł<` (the May, historical, bar); `home shows the over-limit sum` stays green (at that point in the smoke flow only the reference month exists, so a single-bar chart is indistinguishable from the bug there) — restored via `Edit` back to `trend.months.map(...)`; re-ran smoke → 127/127 green again. Meta-check matches the plan exactly: only the later, two-month step proves historical months reach the page |
| Deliberate break 2 (`trend.ts`: dropped `if (pattern.excluded) continue;`) | `home skips an excluded pattern` FAILs; `home recomputes every month` (the positive control right after the pattern is restored, later in the same run) stays green — restored; re-ran smoke → 127/127 green. Meta-check matches the plan: the red isolates the exclusion guard reaching the page, not the read itself |
| Deliberate break 3 (`home.astro`: `return { trend };` unconditionally, dropping the `referenceMonth === null` branch) | Both `home renders empty state for signed-in user` (the pre-existing step) and the new `home before import has no trend` FAIL; `home shows the trend without a threshold` (the first step *with* data) stays green — restored; re-ran smoke → 127/127 green. Matches the plan's own prediction ("or the existing empty-state step") |
| Post-restore check | Read both files back after each break/restore pair and diffed the relevant lines by eye against the intended final content (no pre-staged index to `git diff --quiet` against mid-commit, unlike Phase 1 — the final full gate re-run after all three restores, plus `git status --porcelain` before staging, is the actual proof) |
| Automated grep row 2.9 | `grep -rnE "#[0-9a-fA-F]{3,6}\b\|\[#"` over `src/components/home` / `home.astro` matches only inside two comment lines in `TrendChart.astro`'s header (documenting the kit's original hex next to the token substitution, e.g. `bg-muted/55` for `#9aaab3`) — same convention already shipped in `src/components/app/Panel.astro` (`// Kit border #d9c2a0 has no token`) and `ThresholdEditor.tsx`. No hex appears in a class/style value. Same reasoning for `grep -rn "niepełny\|trend.current" src`: the only hits are in `TrendChart.astro`'s own header, documenting what is deliberately *not* rendered (mirrors `trend.ts`'s Phase 1 header). Judged as satisfying the criterion's intent (nothing renders to the user); recorded as an autonomous decision below |

## 4. Next command

`/10x-implement over-limit-trend phase 3`

## 5. Open

- **Manual Progress rows still pending overall (unchanged in kind from the plan-review handoff, none newly due):**
  `1.8 [reviewer]`, `2.10 [reviewer]` (due now, not done by this step — `home.astro` string/token/reuse audit);
  `3.10 [reviewer]`; `4.8 [reviewer]`; `4.9 / 4.10 / 4.11 [human]`; `4.12 / 4.13 [visual]`.
- **DESIGN-GAPs added this phase:** K24 (no-name lead copy, `copyExtra.home.lead` + `monthsNominative`), G35 (trend
  chart states the kit doesn't define — no „niepełny”, visible bar sums, zero-month stub, gap-month-absent-from-axis,
  no-threshold hint placeholder, bar/gridline token mapping) — both registered in `context/foundation/design-kit.md`
  with G6's status amended; both appended to „Do rundy 3”.
- **Carried risks (from the plan, unchanged unless noted):** bar label legibility at ~400 px — not yet checked, no
  dev server was left running for a manual phone-width look (the `[visual]` step after Phase 4 owns this); axis
  gaps hide the delta foot (Phase 3 concern, `homeStats.previous`); „Koszty stałe” noise on real data (plan review
  F3, due Phase 3); smoke `>text<` anchors on wrapped elements — re-verified this phase for every new bar/note/hint
  span via `eslint --fix`'s output (see Verification); `Intl` ICU output pinned by `formatMonthAxis` (Phase 1,
  re-used unchanged here).
- **New note for Phase 3/4 implementers:** `TrendChart.astro`'s bar markup uses an explicit `h-[200px]` `<li>` +
  `relative flex-1` wrapper + `absolute inset-x-0 bottom-0` `<i>` (see the header note above) rather than the kit's
  bare `<i style="height:X%">` direct-child pattern — because this component also renders a value label above and
  an axis label below each bar (the kit's bars carry no value), which the kit's own direct-percentage trick cannot
  accommodate without an explicit height somewhere in the chain. If a later phase touches this file, keep that
  explicit-height anchor.

## 6. Autonomous decisions

Made by the `implement phase 2` step of run `2026-09-28-s05-s06-s07` in place of asking a human.

- **`TrendChart.astro` bar markup: `<li h-[200px]>` → `<span value>` + `<div relative flex-1><i absolute bottom-0
  style="height:X%"></i></div>` + `<span label>`, instead of the kit's bare `<i style="height:X%">` as a direct
  flex child of the list.** Why: the plan's contract literally reads "`<li>` (`flex-1 min-w-[44px]`, column,
  justify-end)" containing three stacked children (value, bar, label) — a percentage height on a doubly-nested `<i>`
  only resolves reliably when *some* ancestor in the chain has an explicit (non-percentage) height; a `<li>` with
  auto height (the default for a flex item under `align-items: flex-end`) does not guarantee that across browsers.
  Rejected: mimicking the kit's bare-`<i>`-as-direct-flex-child trick, which works for the kit only because its
  `.tbar` carries no separate value/label children. Would change: a visual-gate finding that the explicit `h-[200px]`
  anchor causes visible bar-area overflow/clipping at some breakpoint — then the height budget needs to subtract the
  value/label rows' own heights instead of assuming they fit inside 200px (not verified visually in this step, no
  screenshot was taken — that is the `[visual]` step's job after Phase 4).
- **`ariaLabel` added as an explicit prop on `TrendChart`, not listed in the plan's literal prop contract.** Why:
  the plan's contract text says `<ol>` gets "`aria-label` from the caller" but the typed prop list right above it
  omits an `ariaLabel` field — read as an omission, not an instruction to hardcode or drop it. Passed
  `copy.trend.title` from `home.astro`. Would change: the `[reviewer]` row (2.10) or a later phase finding the
  redundant `aria-label` (duplicating the adjacent visible `<h2>`) is worse than no `aria-label` at all — then drop
  it and let the panel's own heading do the labelling.
- **Automated Progress row 2.9's "no raw colours" / "no `trend.current`/`niepełny` in `src`" greps read as targeting
  rendered/class output, not source comments.** Chosen: ticked 2.9 as satisfied — the only hits are two documentation
  comments in `TrendChart.astro`'s header (kit hex next to its token substitution; what was deliberately not
  rendered), matching the pattern already shipped in `src/components/app/Panel.astro` (`// Kit border #d9c2a0 has no
  token`) and Phase 1's own `trend.ts` header. Rejected: stripping the hex/„niepełny”/`trend.current` mentions from
  the comments entirely, which would make the header less useful for the next implementer and contradicts the
  established codebase convention. Would change: the `[reviewer]` row or a later gate treating comment-level
  mentions as a real failure — then reword the comments to describe the mapping without repeating the literal
  strings (e.g. "the kit's amber current-month state" instead of naming `trend.current`).
- **No `AskUserQuestion` at any of the skill's normal gates** (exec-mode choice, commit-message approval, dirty-path
  prompt, next-phase decision) — decided in place per the agent contract's rule 1. Exec mode: in-context (Phase 2 is
  four small files plus one smoke/checker change — same reasoning as Phase 1). Commit message: proposed and used as
  drafted. Dirty paths: none appeared (`git status --porcelain` checked before both stages). Next phase: this step
  stops after Phase 2 per the task's explicit instruction. Would change: a human reviewing mid-run with an explicit
  alternative instruction.
- **Two commits instead of one** (`3894189` feat, `2082444` docs SHA-record) — same reasoning as Phase 1: the SHA
  can only be known after the closing commit exists, so the append is necessarily a second, small commit; the
  contract explicitly allows this. Would change: nothing.
