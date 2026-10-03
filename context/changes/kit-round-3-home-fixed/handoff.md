# Handoff — `kit-round-3-home-fixed` (slice S-15)

Written by the `/10x-implement … phase 2` step of autonomous run `2026-10-02-kit-round-3`. Phase 2 is committed (`7934a98`), all gates
green. The next agent must not get wrong: `copyExtra.home` now holds `noThreshold`, `monthsGenitive`, `fixedSummary` — `noThreshold` goes in P3.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/kit-round-3-home-fixed`, cut from `main` at `1bf6a5c` (after S-14) |
| Commits | P1 `6108b70`, P2 `7934a98 feat(kit-round-3-home-fixed): Korpus dashboardu — jedna karta i podsumowanie „Koszty stałe” (p2)` (+ this handoff commit) |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | 29 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `src/lib/patterns/home.ts` | `HomeStats` = `overMinor, previous, fixedRisen, fixedNew`; `fixedTotalMinor`/`sumAmounts` removed |
| `src/components/app/PanelTitle.astro` | new, kit `.panel-title` / `.section-label` (`variant` panel/section, default slot) |
| `src/components/home/FixedSummary.astro` | new, kit `.dashboard-fixed` panel; props `title, link, href, rows` |
| `src/components/home/ImportPanel.astro` | deleted |
| `src/pages/home.astro` | one accent card, `PanelTitle` on the trend, `FixedSummary`; lead/foot/empty state from kit keys |
| `src/content/copy.ts` | `copyExtra.home`: removed lead, monthsNominative, deltaFoot, risen, risenForms; added `fixedSummary` (DESIGN-GAP K38) |
| `scripts/smoke.mjs` | 3 steps re-pinned, 1 added (`home lead names the reference month`), header comment |
| `test/unit/home-stats.test.ts`, `test/unit/kit-contract.test.ts` | `fixedNew` cases (+1), nominative pin (+1) |
| `plan.md`, `change.md` | rows 2.1–2.6 ticked with `7934a98` |

## 3. Verification

| Command | Result |
| --- | --- |
| `npm run lint` | 0 errors (baseline 0) |
| `npx astro check` | Result (163 files): 0 errors, 0 warnings, 3 hints (P1: 162 files, 0 errors) |
| `npm run fixture:check` | ing OK, santander OK |
| `npm test` | 380 passed / 26 files (P1 378, +2) |
| `npm run build` | OK |
| `npx supabase db reset && npx supabase test db` | Files=6, Tests=119 PASS (Δ0) |
| `npm run smoke` on :4398 | 193 PASS / 0 FAIL (P1 192, +1) |
| Break: `fixedNew = 0` | home-stats 2 red, smoke „home counts fixed costs that rose” red; restored. Meta-check: unit proves the count, smoke proves the page wires it |
| Break: nominative index +1 | smoke „home lead names the reference month” red; restored. Meta-check: kit-contract stays green (12/12), as planned — it pins kit keys, not the page index |

Dev server on :4398 killed; local DB reset after the breaks.

## 4. Next command

`/10x-implement kit-round-3-home-fixed phase 3`

## 5. Open

- Manual rows left: 1.8, 2.7, 3.8, 4.7, 5.8 `[reviewer]`; 2.8, 5.9, 5.10 `[visual]`; 5.11 `[human]`.
- `DESIGN-GAP: K38` comment added in `copyExtra.home.fixedSummary`; the K38 row in `context/foundation/design-kit.md` is P5's job.
- Carried risks: `plan.md` § Known risks (no page render test).
- No migration, no follow-ups written.

## 6. Autonomous decisions

1. **Implemented in this context, not delegated.** Why: small, file-local phase. Would change: a larger phase.
2. **Commit message in Polish, approved as drafted.** Would change: maintainer preference.
3. **`FixedSummary` takes `title, link, href, rows`** instead of the plan's `risen/added` props, so the component carries no copy at all (the plan's reviewer row: „carry no copy”). Would change: a reviewer asking for the plan's exact props.
4. **Mobile `PanelTitle` class `max-[559px]:col-auto`** mirrors kit `.panel-title{grid-column:auto}` at ≤ 559 px. Would change: visual gate showing a different breakpoint.
