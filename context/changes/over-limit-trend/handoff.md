# Handoff — `over-limit-trend` (slice S-07)

Written by the `implement phase 3` step (`/10x-implement over-limit-trend phase 3`, run
`2026-09-28-s05-s06-s07`). Phase 3 (`/home` stat cards — "Ponad progiem w tym miesiącu" and "Koszty stałe") is
implemented, gated and committed. The one thing the next agent must not get wrong: the accent stat card's delta
foot is computed by `deltaFootFor` in `home.astro`'s frontmatter, which **requires** a non-null `HomeStats.previous`
(`NonNullable<HomeStats["previous"]>` parameter) — it must stay behind the `result.stats.previous ? … : undefined`
ternary at the `StatCard` call site (`src/pages/home.astro`). Calling it unconditionally (the Phase 3 deliberate
break) prints a delta foot with one month of data, which is exactly what US-05/plan review F1's gap rule forbids.

## 1. State

| Item | Value |
|---|---|
| Branch | `feat/over-limit-trend`, cut from `main` at `c0b0068` |
| Commits | 11 on the branch: `8c08aef` change identity, `3fedeb7` research, `6278303` plan, `579cb9e` plan review, `0a40fab` feat p1, `5ac8aa7` docs (p1 SHA), `b5592b7` handoff after p1, `3894189` feat p2, `2082444` docs (p2 SHA), `7e21d6f` handoff after p2, `30cc44a` **feat(over-limit-trend): /home — karty statystyk „Ponad progiem” i „Koszty stałe” (p3)**, `0fd4a11` docs (p3 SHA record) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` (unchanged) |
| `## Progress` rows remaining | 16 (`grep -c '^- \[ \]' plan.md`) — Phase 3 fully closed except `3.10 [reviewer]`; also still open from earlier phases: `1.8 [reviewer]`, `2.10 [reviewer]`; Phase 4 (4.1–4.13) untouched |
| Working tree | clean (`git status --porcelain` empty after both commits) |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/lib/patterns/home.ts` | New. `homeStats(trend, fixed): HomeStats` — `overMinor` = trend's last axis point; `previous` = `{ month, deltaMinor }` against `previousMonth(referenceMonth)` only when that month is on the trend's axis (else `null`, S-06 D6 / plan review F1 gap rule); `fixedTotalMinor` = Σ `amountMinor` over `fixed.changed`/`new`/`unchanged`; `fixedRisen` = count of `changed` rows with `deltaMinor > 0` |
| `src/components/home/StatCard.astro` | New. Kit `.stat-card` / `.stat-card.accent`; props `{ label, value, foot?, accent? }`; label/value/foot each the sole child of their element (smoke `>text<` anchor rule); value colour is always `ink` (kit does not override `.stat-value` under `.accent`) |
| `src/pages/home.astro` | Rewritten. `try` now runs `overLimitTrend` → (if `referenceMonth` non-null) `fixedOverview` → `homeStats`; result union gains `stats: HomeStats` alongside `trend`. New 2-column grid (`grid-cols-[1.2fr_1fr]`, `max-[899px]:grid-cols-1`) between `PageTitle` and the trend `Panel`: accent `StatCard` (label `copy.dashboard.stats[0].label`, value `formatMoney(stats.overMinor)`, foot via `deltaFootFor` only when `stats.previous` is set) and a plain `StatCard` (label `copy.dashboard.stats[2].label` — "Koszty stałe", value `formatMoney(stats.fixedTotalMinor)`, foot always via `risenFootFor`) |
| `src/content/copy.ts` | `copyExtra.home` gains `deltaFoot` ("{delta} względem {month}"), `monthsGenitive` (12-form table), `risen` ("{n} {items}"), `risenForms` (K25, generalising the kit's `dashboard.stats[].foot` samples) |
| `context/foundation/design-kit.md` | New rows **K25** (stat-foot copy only as kit samples) and **G36** (dashboard content the PRD doesn't define: "Rozpoznane wydatki" / "Co wraca najczęściej" not rendered, "Koszty stałe" value = Σ `/fixed` amounts); both ids appended to „Do rundy 3” (items 28–29) |
| `scripts/smoke.mjs` | Header comment extended to mention Phase 3; 3 new steps inserted into the existing run: `home has no comparison with one month` (after "home shows the over-limit sum"), `home compares with the previous month` (after "home recomputes every month"), `home counts fixed costs that rose` (after "fixed lists a changed amount") |
| `test/unit/home-stats.test.ts` | New. Cases 1–4 (empty, one month, three signed-delta sub-cases, gap month, `FixedOverview` sums/rises) plus case 5 (F-02 fixture, `kino światło` count 1: `overMinor` 0, `previous` `{ month: "2026-07", deltaMinor: -8759 }`, `fixedTotalMinor` 175298, `fixedRisen` 1) |
| `context/changes/over-limit-trend/plan.md` | Phase 3 `## Progress` rows 3.1–3.9 ticked with SHA `30cc44a`; row 3.10 `[reviewer]` left open |
| `context/changes/over-limit-trend/handoff.md` | This file |

## 3. Verification

All commands run and observed in this step (not inherited); baseline is Phase 2's own gate (`main` `c0b0068`
lint 0 · astro check 0 errors, 127 files · fixture:check OK · vitest 238, 13 files · build OK · pgTAP 102, 5 files ·
smoke 127 PASS).

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/over-limit-trend` (confirmed before writing) |
| `npm run lint` | 0 errors (one round of `npm run lint:fix` needed for Prettier wrapping in `StatCard.astro`, `home.ts` and `home.astro`, then clean — verified the fixed formatting kept every smoke-asserted string as the sole child of its element) |
| `npx astro check` | 130 files, 0 errors/warnings/hints (baseline 127, +3 expected: `home.ts`, `home-stats.test.ts`, `StatCard.astro`) |
| `npm run fixture:check` | OK |
| `npm test` | 246 passed, 14 files (baseline 238/13, +8: home-stats.test.ts cases 1, 2, 3×3, 3b, 4, 5 — matches Phase 3's "14 files" target exactly) |
| `npm run build` | passes |
| `npx supabase db reset && npx supabase test db` (sandbox disabled — Docker/127.0.0.1:54321) | Files=5, Tests=102, PASS (delta 0) — run once before the breaks and once more after, both clean |
| `ASTRO_DEV_BACKGROUND=1 npx astro dev --port 4398 --ignore-lock` + `BASE_URL=http://localhost:4398 npm run smoke` (sandbox disabled) | 130 PASS (127 + 3, matches plan exactly); server killed after (`lsof -ti :4398 \| xargs kill`) |
| Deliberate break 1 (`home.ts`: `deltaMinor: prevEntry.overMinor - last.overMinor`, sign reversed) | `npx vitest run test/unit/home-stats.test.ts` → case 3 (rise, drop) and the F-02 fixture case FAIL (3 of 8 tests), case 3 (equal, delta 0) and case 3b (gap → `previous: null`) stay green; smoke: `home compares with the previous month` FAILs (`+1,50 zł` no longer matches), `home has no comparison with one month` stays green (positive control — no foot is rendered there regardless of sign). Restored via `Edit`; re-ran unit tests (8/8 green) and smoke (130/130). Meta-check: the red isolates the sign, not the foot's presence |
| Deliberate break 2 (`home.ts`: `fixed.changed.filter((row) => row.deltaMinor !== 0)`) | Unit case 4 FAILs (`fixedRisen` 2 instead of 1 — the crafted decrease now counts); smoke `home counts fixed costs that rose` stays green (the smoke user's `/fixed` state has no decrease at that point in the flow, so only the unit case guards the `> 0` filter). Restored; re-ran unit tests (8/8) and smoke (confirmed the one step green). Meta-check matches the plan exactly |
| Deliberate break 3 (`home.astro`: accent `StatCard` foot always calls `deltaFootFor` with a `{ month: "2026-01", deltaMinor: 0 }` fallback instead of the `result.stats.previous ? … : undefined` ternary) | `home has no comparison with one month` FAILs (`notContains: "względem"` now matches "0,00 zł względem stycznia"); `home compares with the previous month` (positive control, later in the flow where `previous` is genuinely set) stays green. Restored via `Edit`; re-ran smoke (130/130) |
| Post-restore full gate | `npm run lint` / `astro check` / `fixture:check` / `npm test` / `npm run build` re-run clean after both restores (see rows above); `git status --porcelain` checked before staging — only the 7 intended files |
| Automated grep row 3.9 | `grep -rnE "#[0-9a-fA-F]{3,6}\b\|\[#" src/components/home/StatCard.astro src/pages/home.astro` matches only `StatCard.astro`'s header comment (`#72501f`, documenting the kit hex next to the `excess-text` token substitution) — same convention as `Panel.astro`'s `#d9c2a0` comment and Phase 2's `TrendChart.astro` header (judged as satisfying the criterion's intent, same reasoning Phase 2 recorded); `grep -n "K25"` hits `copy.ts`, `home.astro` (a doc comment) and `design-kit.md` (row + „Do rundy 3” item); rows K25/G36 present in `design-kit.md` |

## 4. Next command

`/10x-implement over-limit-trend phase 4`

## 5. Open

- **Manual Progress rows still pending overall (unchanged in kind from the Phase 2 handoff, `3.10` newly due):**
  `1.8 [reviewer]`, `2.10 [reviewer]`, `3.10 [reviewer]` (due now, not done by this step — `home.ts` import/reuse
  audit: note below); `4.8 [reviewer]`; `4.9 / 4.10 / 4.11 [human]`; `4.12 / 4.13 [visual]`.
- **Possible finding for row 3.10's reviewer**: the plan's literal text for 3.10 reads "`home.ts` imports only
  `trend.ts`, `fixed.ts` types, `@/types`" — `home.ts` also imports `previousMonth` from `@/lib/patterns/over-limit`
  (needed to compute the comparison month; `trend.ts` does not re-export it). `fixed.ts` itself already imports
  `previousMonth` directly from `over-limit.ts` (same source, same pattern), so this reads as the same omission
  Phase 2 hit with `TrendChart`'s `ariaLabel` prop (not literally in the contract's prop list, but required and
  consistent with the codebase) rather than a real drift — recorded as an autonomous decision below, not silently
  fixed or hidden.
- **DESIGN-GAPs added this phase:** K25 (stat-foot copy templates, `copyExtra.home.deltaFoot`/`monthsGenitive`/
  `risen`/`risenForms`), G36 (dashboard content the PRD doesn't define — "Rozpoznane wydatki" / "Co wraca
  najczęściej" not rendered, "Koszty stałe" value = Σ `/fixed` amounts) — both registered in
  `context/foundation/design-kit.md`, both appended to „Do rundy 3” (items 28–29).
- **Carried risks (from the plan, unchanged unless noted):** bar label legibility at ~400 px — still not checked,
  no dev server was left running for a manual phone-width look (the `[visual]` step after Phase 4 owns this,
  now also covering the new 2-column stat grid's mobile stacking, `max-[899px]:grid-cols-1`); axis gaps hide the
  delta foot (Phase 3 now implements this exactly — `homeStats.previous` returns `null` on a gap, verified by unit
  case 3b and the crafted "one month" smoke step); „Koszty stałe” noise on real data (plan review F3, `[human]`
  4.11 — the fixed total `home.ts` computes reuses `fixedOverview` verbatim, so the noise is unchanged from
  `/fixed`, not amplified); smoke `>text<` anchors on wrapped elements — re-verified this phase for every new
  label/value/foot span via `eslint --fix`'s output (see Verification); `Intl` ICU output pinned by
  `formatMonthAxis`/`formatSignedMoney` (unchanged, reused).
- **New note for Phase 4 implementer:** the stat grid sits between `PageTitle` and the trend `Panel` in
  `home.astro`'s third JSX branch — the import panel (Phase 4 contract) goes **after** the trend `Panel`, so it
  does not need to touch this grid at all; only the page's closing structure changes.

## 6. Autonomous decisions

Made by the `implement phase 3` step of run `2026-09-28-s05-s06-s07` in place of asking a human.

- **`home.ts` imports `previousMonth` directly from `@/lib/patterns/over-limit`, not solely from `trend.ts`/
  `fixed.ts`.** Why: the plan's Phase 3 contract text for `home.ts` does not itself restrict imports (only the
  Manual row 3.10 phrases it as "imports only `trend.ts`, `fixed.ts` types, `@/types`"), and `previousMonth` is
  defined in `over-limit.ts` — `fixed.ts` already imports it from the same place (`import { …, previousMonth, … }
  from "@/lib/patterns/over-limit"`), so re-importing it through `trend.ts` would mean re-exporting a symbol
  `trend.ts` does not otherwise need, purely to satisfy a literal reading of a manual-review row. Rejected: adding
  a `previousMonth` re-export to `trend.ts` (indirection with no behavioural benefit, and `trend.ts`'s own header
  states its imports are `over-limit.ts`, `view.ts`, `@/types` — adding an export used only by `home.ts` would
  contradict that). Would change: row 3.10's reviewer treating this as a real drift rather than an omission in the
  row's wording (same class of call as Phase 2's `ariaLabel` decision) — then either add the re-export to
  `trend.ts` or reword the row.
- **The "Koszty stałe" foot always renders** (`risenFootFor` called unconditionally, no `undefined` fallback),
  while the accent card's foot is conditional on `stats.previous`. Why: the plan's contract text for the second
  card doesn't describe a hidden-foot state — "N pozycje podrożały" is a valid sentence at `n = 0`
  ("0 pozycji podrożało"), unlike the accent foot's "{delta} względem {month}" which has no meaningful value
  without a comparison month at all. Rejected: hiding the second foot too when `fixedRisen === 0` (not asked for
  by the plan, and an empty-looking accent-only stats row would look broken next to a card with no foot at all).
  Would change: a `[human]`/`[reviewer]` finding that a zero count should hide the foot — then wrap it in the same
  conditional the accent card uses.
- **No `AskUserQuestion` at any of the skill's normal gates** (exec-mode choice, commit-message approval,
  dirty-path prompt, next-phase decision) — decided in place per the agent contract's rule 1. Exec mode:
  in-context (Phase 3 is two small new files plus one page/copy/design-kit/smoke edit each — same reasoning as
  Phases 1–2). Commit message: proposed and used as drafted. Dirty paths: none appeared (`git status --porcelain`
  checked before both stages). Next phase: this step stops after Phase 3 per the task's explicit instruction.
  Would change: a human reviewing mid-run with an explicit alternative instruction.
- **Two commits instead of one** (`30cc44a` feat, `0fd4a11` docs SHA-record) — same reasoning as Phases 1–2: the
  SHA can only be known after the closing commit exists, so the append is necessarily a second, small commit; the
  contract explicitly allows this. Would change: nothing.
