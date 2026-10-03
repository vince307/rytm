# Handoff — `kit-round-3-patterns` (slice S-14)

Written by the `/10x-implement … phase 1` step of autonomous run `2026-10-02-kit-round-3`. Phase 1 is committed
(`5956c76`); next is phase 2. The one thing not to get wrong: `PatternsTable` now reads `copy.columns` directly, so
the Kwota cell precedes Suma in the body — keep that order when adding the badge in „Ponad progiem” (P2).

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/kit-round-3-patterns`, cut from `main` at `5ed97f4` |
| Commits | 5 + handoff commit: `5956c76 feat(kit-round-3-patterns): … (p1)` on top of the 4 docs commits |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | 50 of 56 (`grep -c '^- \[ \]' plan.md`); 1.1–1.6 ticked with `5956c76`, 1.7 `[reviewer]` left open |
| Working tree | clean after the handoff commit (`tree-clean.sh`) |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `src/components/patterns/PatternsTable.tsx` | headers map `copy.columns`; Kwota cell before Suma; `patternForms` typed `readonly string[]` |
| `src/lib/patterns/table-columns.ts`, `test/unit/table-columns.test.ts` | deleted (`tableHeaders` gone) |
| `src/lib/format.ts` | `plural` accepts `readonly string[]` (kit `countForms` is `string[]` from JSON) |
| `src/pages/patterns.astro` | `listOverview` inside `try` → `{ error }` → existing `copy.components.error` branch; eyebrow = `copy.app.patternsLong`; `patternForms` = `copy.patterns.countForms` |
| `src/components/patterns/ExcludedPatterns.astro` | toggle = `copy.patterns.excluded`, forms = `copy.patterns.countForms`; `copyExtra` import dropped |
| `src/content/copy.ts` | deleted `copyExtra.patterns` leaves `eyebrow`, `patternForms`, `excludedToggle` |
| `test/unit/patterns-table.test.ts` | new: `renderToStaticMarkup` of `PatternsTable` — header order, Kwota before Suma |
| `test/unit/kit-contract.test.ts` | column test rewritten without `tableHeaders` (Kwota idx 3, Suma idx 4) |
| `context/changes/kit-round-3-patterns/{plan,change,handoff}.md` | Progress 1.1–1.6, status `implementing`, this file |

## 3. Verification

| Command | Result |
| --- | --- |
| `npm run lint` | 0 errors (after fixing prettier/type-assertion in the new test) |
| `npx astro check` | 0 errors (baseline 157 files; branch run reports 156 files: −`table-columns` +…; hints 3) |
| `npm run fixture:check` | ing OK, santander OK |
| `npm test` | 355 passed / 23 files (baseline 354 / 23: −1 `table-columns` case, +2 render cases) |
| `npm run build` | OK |
| `npx supabase db reset && test db` | Files=6, Tests=119 PASS (Δ0) |
| `npm run smoke` on 4398 | 184 PASS / 0 FAIL (baseline 184, Δ0) |
| Break 1: Kwota/Suma cells swapped back | `patterns-table.test.ts` red (1 failed), restored with `git checkout --`. Meta: smoke stays green on that break (props carry kit-order labels), which is why the render test exists |
| Break 2: `throw` inside the `try` (`?boom=1`) | `GET /patterns` 200 with „Nie udało się wczytać danych…”, plain `/patterns` has no error text; restored. Meta: before this phase the IIFE had no `try`, so the same throw was a 500 (not re-run on old code) |

## 4. Next command

`/10x-implement kit-round-3-patterns phase 2`

## 5. Open

- Manual-only rows, not mine: `[reviewer]` 1.7, 2.6, 3.7, 4.7, 5.7, 6.6, 7.7, 8.8; `[visual]` 8.6, 8.7; `[human]` 8.9.
- `DESIGN-GAP: G28` header in `PatternsTable.tsx` kept (badges P2; „Pokaż więcej” clause goes with P3).
- `plural` signature widened in `src/lib/format.ts` (not in the plan; needed for kit `countForms`). Reviewer may prefer a typed tuple cast in `copy.ts` instead.
- Roadmap `S-14` status not touched (orchestrator-owned); no `DESIGN-GAP` added; no register rows due in P1.
- Carried from plan review: keep the badge tint on `bg-excess/18`; keep „—” in Kwota when `fixedAmountMinor` is null; K35–K37 register rows in P5/P6, G33 in P7.

## 6. Autonomous decisions

1. **Execution mode: in this context** (skill asks delegate vs in-context). Rejected: subagent — phase is small. Would change if a phase exceeds context budget.
2. **Widened `plural` and `PatternsTableCopy.patternForms` to `readonly string[]`** rather than casting at each call site. Rejected: `as unknown as` casts in three places. Would change if the reviewer wants kit JSON typed as tuples in `copy.ts`.
3. **Commit message approved as drafted** (Polish subject per contract). Would change nothing.
4. **Roadmap not flipped to `in-progress`**: the At-a-glance status is `planning` and orchestrator manages ship-time status. Would change if the verifier greps roadmap status.
5. **Smoke run twice** (second only to count PASS lines): both 184 PASS; local DB accrues extra users, harmless.
6. **No step asked the user** (run contract rule 1).
