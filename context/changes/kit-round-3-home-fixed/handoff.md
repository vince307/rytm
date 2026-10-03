# Handoff — `kit-round-3-home-fixed` (slice S-15)

Written by the `/10x-implement … phase 4` step of autonomous run `2026-10-02-kit-round-3`. Phase 4 is committed (`e875337`), all gates
green. The next agent must not get wrong: P5 owns the `copyExtra` audit — `fixed.eyebrow/itemForms/changedEmpty/newEmpty/noComparison` are gone, `fixed.delta` (K40) and `fixed.unchangedEmpty` (G39) are new.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/kit-round-3-home-fixed`, cut from `main` at `1bf6a5c` (after S-14) |
| Commits | P1 `6108b70`, P2 `7934a98`, P3 `bcf364a`, P4 `e875337 feat(kit-round-3-home-fixed): /fixed — stany kitu, sufiksy delty i copy (p4)` (+ this handoff commit) |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | 16 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `src/lib/patterns/fixed-view.ts` | new: `fixedNotices(overview)`, `deltaText(deltaMinor, words)` |
| `test/unit/fixed-view.test.ts` | new: 5 cases (state rule, both delta directions) |
| `src/pages/fixed.astro` | eyebrow `copy.app.fixedLong`; `InfoPanel` noComparison under title; sections without `empty`/`compact`; `.fixed-empty-states` block (`grid gap-2.5 mt-3`) with noChanges / noNew / unchangedEmpty; delta via `deltaText` |
| `src/components/fixed/FixedSection.astro` | props `title,count,hasRows`; `PanelTitle variant="section"`; list panel only with rows |
| `src/content/copy.ts` | `copyExtra.fixed`: removed eyebrow, itemForms, changedEmpty, newEmpty, noComparison; added `delta` (K40), kept `unchangedEmpty` (G39) |
| `scripts/smoke.mjs` | four fixed steps re-pinned, same step count |
| `plan.md` | rows 4.1–4.6 ticked with `e875337` |

## 3. Verification

| Command | Result |
| --- | --- |
| `npm run lint` | 0 errors (baseline 0) |
| `npx astro check` | Result (166 files): 0 errors, 0 warnings, 3 hints (P3: 164 files) |
| `npm run fixture:check` | ing OK, santander OK |
| `npm test` | 386 passed / 27 files (P3 381, +5) |
| `npm run build` | OK |
| `npx supabase db reset && npx supabase test db` | Files=6, Tests=119 PASS (Δ0) |
| `npm run smoke` on :4398 | 195 PASS / 0 FAIL (P3 195, Δ0; baseline 192, cumulative +3) |
| Break: `noChanges` ignores `hasComparison` | unit „without a comparison month…” red + smoke „fixed with one month lists no change” red; restored. Meta-check: smoke proves the page uses the helper (one-month state), unit also covers the „comparison, empty changed” case that smoke never reaches (stays green there by design) |
| Break: `deltaText` drops suffix | 2 unit cases red + smoke „fixed lists a changed amount” red; restored |

`>0 pozycji<` is true for the „Zmieniły kwotę” section and „Nowe” (both 0 in one-month state); the step pairs it with a notContains of the old message. Dev server on :4398 killed; local DB reset after the breaks.

## 4. Next command

`/10x-implement kit-round-3-home-fixed phase 5`

## 5. Open

- Manual rows left: 1.8, 2.7, 3.8, 4.7, 5.8 `[reviewer]`; 2.8, 5.9, 5.10 `[visual]`; 5.11 `[human]`.
- `DESIGN-GAP: K39`, `K40`, `G39` comments in `src/content/copy.ts`; K38/K39/K40/G39 register rows in `context/foundation/design-kit.md` are P5's job; the `Badge.tsx` comment mentions G34 (not in the P4 grep scope).
- Carried risks: `plan.md` § Known risks (no page render test).
- No migration, no follow-ups written.

## 6. Autonomous decisions

1. **Implemented in this context, not delegated.** Why: small, file-local phase. Would change: a larger phase.
2. **Commit message in Polish, approved as drafted.** Would change: maintainer preference.
3. **`fixedNotices` result defaulted to all-false outside the data branch** (not nullable) so the template and lint/tsc agree. Would change: a page render test.
4. **`itemForms` cast to a 3-tuple in `fixed.astro`** (kit JSON types it `string[]`, `plural` wants a tuple). Would change: `plural` accepting `readonly string[]`.
5. **`InfoPanel` classes `mt-0 mb-2` for noComparison under the title**; final spacing left to the visual gate. Would change: visual gate.
