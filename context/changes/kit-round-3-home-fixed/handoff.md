# Handoff — `kit-round-3-home-fixed` (slice S-15)

Written by the `/10x-implement … phase 3` step of autonomous run `2026-10-02-kit-round-3`. Phase 3 is committed (`bcf364a`), all gates
green. The next agent must not get wrong: `InfoPanel` exists now — P4 reuses it for the three `/fixed` messages; `copyExtra.home.noThreshold` is gone (chip uses `copy.trend.noThreshold`).

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/kit-round-3-home-fixed`, cut from `main` at `1bf6a5c` (after S-14) |
| Commits | P1 `6108b70`, P2 `7934a98`, P3 `bcf364a feat(kit-round-3-home-fixed): Trend — chipy legendy, nazwy słupków i geometria kitu (p3)` (+ this handoff commit) |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | 22 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `src/components/app/InfoPanel.astro` | new, kit `.info-panel`; default slot, optional `class` via `cn` |
| `src/components/home/TrendChart.astro` | props `bars{…,name}`, `zeroNote?`, `noThreshold?` (no `hint`, no copy import); bar `role="img"` + `aria-label`, `bg-muted` / zero `bg-line`, bold ink values, legend chips, `note` via `InfoPanel` |
| `src/lib/patterns/trend.ts` | `trendBarHeight` minimum 8 |
| `src/pages/home.astro` | `barsFor` adds `name` (`amountLabel` / `zeroMarker`); `ariaLabel` = `copy.trend.gridLabel`; passes `zeroNote` (any zero bar) and `noThreshold` |
| `src/content/copy.ts` | `copyExtra.home`: `noThreshold` removed, `zeroNote` added (DESIGN-GAP K39) |
| `scripts/smoke.mjs` | no-threshold step re-pinned to `>Brak ustawionego progu<`, over-limit step notContains it, +2 steps (zero bar, bar names) |
| `test/unit/over-limit-trend.test.ts` | `[10,1000,8]`, +`[80,1000,8]` |
| `plan.md` | rows 3.1–3.7 ticked with `bcf364a` |

## 3. Verification

| Command | Result |
| --- | --- |
| `npm run lint` | 0 errors (baseline 0) |
| `npx astro check` | Result (164 files): 0 errors, 0 warnings, 3 hints (P2: 163 files, 0 errors) |
| `npm run fixture:check` | ing OK, santander OK |
| `npm test` | 381 passed / 26 files (P2 380, +1) |
| `npm run build` | OK |
| `npx supabase db reset && npx supabase test db` | Files=6, Tests=119 PASS (Δ0) |
| `npm run smoke` on :4398 | 195 PASS / 0 FAIL (P2 193, +2; baseline 192, cumulative +3) |
| Break: `zeroNote` unconditional | smoke „home names each trend bar” red; restored. Meta-check: proves the condition, not the text |
| Break: `noThreshold` chip unconditional | smoke „home shows the over-limit sum” red; restored. Meta-check: proves the condition on `hasThreshold` |
| Break: minimum 12 | 2 `trendBarHeight` cases red (10,1000 and 80,1000); restored. First attempt hit only the doc comment (stayed green) — wrong break, redone on the `return` line |

Dev server on :4398 killed; local DB reset after the breaks.

## 4. Next command

`/10x-implement kit-round-3-home-fixed phase 4`

## 5. Open

- Manual rows left: 1.8, 2.7, 3.8, 4.7, 5.8 `[reviewer]`; 2.8, 5.9, 5.10 `[visual]`; 5.11 `[human]`.
- `DESIGN-GAP: K39` comment in `copyExtra.home.zeroNote`; K38/K39 rows in `context/foundation/design-kit.md` are P5's job.
- Carried risks: `plan.md` § Known risks (no page render test).
- No migration, no follow-ups written.

## 6. Autonomous decisions

1. **Implemented in this context, not delegated.** Why: small, file-local phase. Would change: a larger phase.
2. **Commit message in Polish, approved as drafted.** Would change: maintainer preference.
3. **Bar `<i>` carries `role="img"` + `aria-label`** exactly as the plan's contract; breakpoints ≤ 560 / ≤ 360 px implemented as `max-[559px]` / `max-[359px]`. Would change: visual gate showing a different breakpoint.
4. **`InfoPanel` takes only `class`**, the slot is on one line so smoke anchors `>text<` hold. Would change: prettier wrapping it (it did not).
