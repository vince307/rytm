<!-- PLAN-REVIEW-REPORT -->
# Plan Review: Kit round 3 intake (F-04)

- **Plan**: context/changes/kit-round-3-intake/plan.md
- **Mode**: Deep (claims verified directly against code and the delivery; no sub-agent — the riskiest claims were few and file-local)
- **Date**: 2026-10-02
- **Verdict**: REVISE → SOUND after triage (all fixes applied in plan.md)
- **Findings**: 1 critical, 1 warning, 3 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| End-State Alignment | PASS |
| Lean Execution | PASS |
| Architectural Fitness | PASS |
| Blind Spots | FAIL → fixed (F1) |
| Plan Completeness | WARNING → fixed (F2) |

## Grounding

Grounding: 9/9 paths ✓ (`home.astro`, `fixed.astro`, `patterns/[...key].astro`, `PatternsTable.tsx`, `patterns.astro`, `imports/new.astro`, `src/lib/format.ts`, `test/unit/format.test.ts`, `scripts/sync-kit.sh`; `src/lib/patterns/table-columns.ts` correctly new), 8/8 symbols ✓ (`copy.dashboard.stats[2].label`, `copy.columns.slice(0, 4)`/`amountColumn`, `copy.fixedCosts.new`, local `monthLocative`, `passwordTooShort` ×3 pages, `copy.components.error` as `genericError`, `MIN_PASSWORD_LENGTH = 6`, `months.length < 3`), brief↔plan ✓.

Independent leaf diff (Node, round-2 kit vs delivery `content.json`): 41 changed/removed leaves. Every one the app reads is in the plan; the rest are unread (`auth.confirmEmail*`, `auth.resetNewTitle`, `auth.resetExpired`, `dashboard.patterns.*`, `dashboard.description`, `stats[0].foot`, `trend.current`, `importFlow.overlap/result/supported`, `importErrors.*`, `components.info` — app uses `copyExtra` overrides or nothing). `brand.css`: exactly the 8 token lines differ; `src/styles/brand.css` = `sed(font path)` of the round-2 kit byte for byte (`cmp`). `components.error`'s other 2 sites (`imports/index.astro`, `imports/result.astro` count-read failure) are read failures — the new meaning fits.

Follow-ups whose Trigger names a kit round: 5, all dispositioned in `change.md` § Open follow-ups and plan Phase 3 §2 — badge `new` tint (fired → token synced, adoption S-15), G36 (fired → closed), focus ring (S-14), field radius 14→8 px and panel radius (not fired: verified the round-3 `prototype/styles.css` diff adds no field/panel `border-radius`). Deferrals convincing.

PRD: trend minimum 3 months (PRD § Success Criteria „≥ 3 miesiącach”) and password rule (`MIN_PASSWORD_LENGTH`) agree with the plan; no product decision departs from the PRD; kit-text departures sit in `[human]` 3.8.

## Findings

### F1 — Prettier step rests on a false premise and breaks the brand.css contract

- **Severity**: ❌ CRITICAL
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Current State Analysis (file-copy bullet), Critical Implementation Details „Order of the kit copy”, Phase 1 §1–§2, criteria 1.1/1.2
- **Detail**: The plan says `lint-staged` reformats committed kit bytes (round-2 precedent `2ad7d14`) and therefore prescribes `npx prettier --write` over `design/rytm-os/**/*.{json,css,md}` and `src/styles/brand.css`. In the code: `npx prettier --check` warns on the committed `prototype/styles.css`, `react-kit/styles/brand.css`, `docs/content.json`, `docs/routes.md` and on `src/styles/brand.css` — none is prettier-formatted. The husky hook is not installed in this checkout (no `core.hooksPath`, no `prepare` script, only `*.sample` hooks) and CI has no prettier gate, so round 2 committed the delivery verbatim. Following the plan would rewrite whole files (minified 42-line `styles.css` expanded; `brand.css` reflowed) and make Phase 1's own contract „`src/styles/brand.css` diff = the 8 token lines” impossible, plus a kit no longer byte-equal to the delivery. Verified: `JSON.stringify(JSON.parse(delivery), null, 2) + "\n"` reproduces the delivery `content.json` exactly, so a Node patch touches only the 4 lines.
- **Fix**: Copy byte for byte, patch `content.json` via Node round-trip, never prettier on `design/` or `src/styles/brand.css`; compare raw delivery with `diff -rq`; idempotence = `sync-kit.sh` re-run + `git status`; hook risk recorded in `## Known risks`.
- **Decision**: FIXED — plan.md Current State, Desired End State, Critical Implementation Details, Phase 1 §1/§2 contracts, criteria 1.1/1.2, Progress 1.1/1.2 titles, new `## Known risks`; plan-brief risk cell.

### F2 — Seam sweep misses two doc comments made stale by the swap

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 3 §3 Seam sweep
- **Detail**: `ImportWizard.tsx` prop doc `genericError` says „`copy.components.error` — a save that failed…”; Phase 1 repoints it to `copyExtra.imports.saveError` but only edits `imports/new.astro`. `TrendChart.astro` header comment quotes `trend.current` as „bieżący, niepełny…”; round 3 changed it to „Bieżący miesiąc” (key unread by the app). Both would mislead S-13/S-15.
- **Fix**: Added both to the Phase 3 seam-sweep contract.
- **Decision**: FIXED

### F3 — `/patterns` „Ponad progiem” needle is unambiguous (checked)

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 2 §2 smoke steps
- **Detail**: The round-3 kit holds „Ponad progiem” only in `patterns.columns[6]` and `trend.title`; `/patterns` does not render `trend.title`, and `PatternsTable.tsx` reads `columns` only in `<thead>`. The new `>Ponad progiem<` step on `/patterns` therefore proves the header, unlike the existing `/home` assertion of the same needle (trend legend). `/register` and `/settings` pass no other `{n}` template to their islands, so `notContains "{n}"` is sound.
- **Fix**: None needed.
- **Decision**: RECORDED

### F4 — Phase sizing and Progress consistency

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phases 1–3, `## Progress`
- **Detail**: Progress has exactly one `## Progress`, 3 `### Phase N` matching the body, 24 rows 1:1 with Success Criteria (P1 8, P2 8, P3 8), no checkboxes inside phase blocks. Each phase ends green on its own (P1 cannot be split — `copy.ts` imports the JSON and smoke pins the filled trend sentence; decision 9 holds) and fits one fresh agent. No split/merge.
- **Fix**: None needed.
- **Decision**: RECORDED

### F5 — Reader-side index reads remain unguarded

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 2 break 2, decision 10
- **Detail**: The plan already admits nothing automated catches `home.astro` reading `stats[n]` out of range; `noUncheckedIndexedAccess` rejected as out of scope. Acceptable; now also listed under `## Known risks`.
- **Fix**: None beyond the Known-risks entry.
- **Decision**: RECORDED

## Triage summary (autonomous, run contract rule 1)

- Fixed: F1, F2 (2)
- Recorded: F3, F4, F5 (3)
- `[human]` rows: 3.8 already names every kit-text deviation (`fillMonthLocative` „we wrześniu”, `tableHeaders` body order, `copyExtra.imports.saveError`, the 4 restored `authStates`); no product decision overturned.

VERDICT: PROCEED — approach sound and verified against code; the one critical (prettier on unformatted kit files) is fixed in plan.md by a byte-faithful copy.
