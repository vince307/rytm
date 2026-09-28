<!-- PLAN-REVIEW-REPORT -->
# Plan Review: Trwałe decyzje o wzorcach (S-05 `durable-pattern-decisions`)

- **Plan**: `context/changes/durable-pattern-decisions/plan.md`
- **Mode**: Deep
- **Date**: 2026-09-28
- **Verdict**: REVISE before triage → SOUND after the in-plan fixes (autonomous run, triaged by the reviewer)
- **Findings**: 2 critical · 1 warning · 3 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| End-State Alignment | PASS |
| Lean Execution | PASS |
| Architectural Fitness | PASS |
| Blind Spots | WARNING (F4, F5) |
| Plan Completeness | FAIL → fixed (F1, F2, F3) |

## Grounding

Paths 9/9 ✓ (`derive.ts`, `load.ts`, `thresholds.ts`, `view.ts`, `[...key].astro`, `patterns.astro`, `dialog.tsx`,
`InlineAlert.astro`, `scripts/smoke.mjs`; `src/components/hooks/` absent as the plan says). Symbols ✓:
`derivePatterns`, `d5Type`, `appliesTo`, `overLimit`, `listOverview`, `patternDetail`, `loadPatterns` (importers:
only the two pattern pages), `loadThresholds`, `SubmitButton`, `buttonVariants` `text`/`inline`,
`copyExtra.auth.saving`, `plural`, `copy.patternActions.*` (7 keys, strings match the kit), kit `app.js` modal texts
(„Akcje na wzorcu”, „Zarządzaj wzorcem.”, lead, „Typ wzorca zmieniony.”, „Wzorzec wykluczony z analizy.”).
brief↔plan ✓. No `context/foundation/lessons.md`, no `docs/reference/contract-surfaces.md` (checks skipped).
Progress↔Phase ✓ (7/7 phases, 65 rows, 1:1 with Success Criteria, no checkboxes in phase blocks).

Smoke arithmetic re-computed against the code (`patternDetail` shows the reference month = latest month across all
rows): May merged 12,99 + 45,50 = 58,49 ✓; D5 of {12,99, 45,50}: median 29,245, tolerance 10 zł → częsty ✓; amount
40 on pinned stały → May over 5,50 ✓; June 12,99 + 47,00 = 59,99 ✓, over 7,00 ✓; D5 over four amounts → częsty ✓;
merged name tie 1 : 1 → „Kawiarnia smoke” (code-point smallest) so step 7 `notContains >Sklep smoke<` holds ✓.
Smoke counts 26 + 5 + 3 = 34 ✓; pgTAP list 26 ✓.

Follow-ups whose `Trigger:` names S-05 or fires on it: S-04 F5 (paging — included, Phase 3); undo-import dialog
geometry + F4 bfcache (included, Phase 5); S-04 F8 (included, Phase 5); S-01 F9 shared close icon (folded into the
geometry item — already met on `main`, see F6); S-04 F11 field radius (trigger „next UI change to a view with a form
field” fires — deferral justified, F5); S-04 F4 / F3 (triggers not fired).

## Findings

### F1 — `>text<` anchors on `InlineAlert` result lines can never match

- **Severity**: ❌ CRITICAL
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 6 §5 Smoke („merge confirms the result”), Phase 7 §5 Smoke step 3 („list confirms a restore”)
- **Detail**: `src/components/app/InlineAlert.astro` wraps `<slot />` on its own lines inside `<span>`; compiled
  with the default `compressHTML` it renders `<span> Wzorce scalone. </span>` (verified by compiling the component).
  `contains: ">Wzorce scalone.<"` and `">Wzorzec przywrócony do analizy.<"` would fail on correct code, making
  Phases 6 and 7 red. Existing InlineAlert smoke steps (`"Sukces — próg zapisany."`, `"Import usunięty."`) use bare
  text. Bare text, however, risks the false positive the agent contract warns of if an island's props carry it.
- **Fix**: assert both result lines as bare text; pair each with a negative control on the same page without the
  result param (`detail offers the actions` notContains `Wzorce scalone.`; `patterns list shows the excluded section`
  notContains `Wzorzec przywrócony do analizy.`); `PatternActionsDialog`'s `copy` prop carries only the strings it
  renders; `>text<` only for text inline in its element.
- **Decision**: FIXED (plan Phase 6 §1 + §5, Phase 7 §5, Known risks)

### F2 — Phase 2 is not independently green: `astro check` breaks on `patterns.astro`

- **Severity**: ❌ CRITICAL
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 2 — Types
- **Detail**: `PatternListItem = Omit<MerchantPattern, "transactionIds" | "medianMinor"> & {…}` (`src/types.ts`).
  Phase 2 adds required `excluded` (kept on `PatternListItem`) and `merged` (omitted). `src/pages/patterns.astro`
  builds a `PatternListItem` literal by hand (the `overviewByKey` re-merge) with no `excluded` — removed only in
  Phase 3. Phase 2 lists no page change, so its `npx astro check` 0-errors criterion (2.2) fails.
- **Fix**: Phase 2 adds `excluded: pattern.excluded` to that literal (new §5 in Phase 2).
- **Decision**: FIXED

### F3 — Smoke step 3 leaves the merge source implicit

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 4 §4 Smoke step 3
- **Detail**: „`target: "kawiarnia smoke"`” without the `key`; under decision 2 the key is the absorbed pattern, and
  step 7 depends on the merged name staying „Kawiarnia smoke”.
- **Fix**: spell out `{ key: "sklep smoke", action: "merge", target: "kawiarnia smoke" }` and the name tie-break.
- **Decision**: FIXED

### F4 — Phase 3's derive-input break is unguarded for one phase

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 3 criterion 3.7
- **Detail**: With no decision rows before Phase 4, nothing catches `loadPatternData` passing `new Map()`. The plan
  records it and Phase 4's 4.7 re-runs the break against steps 4, 5, 13, 16. Acceptable.
- **Fix**: none; recorded in Known risks.
- **Decision**: ACCEPTED

### F5 — S-04 F11 (field radius) trigger fires; deferral kept

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: What We're NOT Doing; decision 13
- **Detail**: F11's trigger („next UI change to a view with a form field”) fires on the detail view. The plan keeps
  the app-wide token sweep out (it would re-screenshot `/patterns`, auth and settings — outside „one view + global
  tokens” for a decisions slice) and uses kit 8 px locally, as S-04 did; Phase 7's follow-ups file re-queues it.
  Convincing.
- **Fix**: none.
- **Decision**: ACCEPTED

### F6 — S-01 F9 (shared close icon) is already met on `main`

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: End-State Alignment
- **Location**: Phase 7 §3 follow-ups file
- **Detail**: undo-import's follow-ups fold S-01 F9 into the geometry fix; `src/components/ui/dialog.tsx`
  `DialogContent` already renders the kit sprite `#close`. The plan did not mention it.
- **Fix**: Phase 7's follow-ups file records S-01 F9 as closed with no code change.
- **Decision**: FIXED

## Product decisions vs PRD

FR-009 / US-03 / US-02 AC checked: merge (union before grouping → „każda transakcja liczy się raz”, sums = components),
exclusion (no „ponad próg”), pinned type, rename, durability across a later import and import deletion — all covered.
Decision 6 (toggle between stały / częsty, no return to automatic) satisfies „zmienić typ wzorca (stały/częsty)”.
Decision 9 („nie wchodzi do sumy miesięcznej”) is consistent with the maintainer's binding reading of „ponad próg”
and keeps its `[human]` row 7.9. No decision overturned.

Phase sizing: each phase is one fresh-agent unit and independently green after F2; no split / merge needed; Progress
unchanged (65 rows).

VERDICT: PROCEED — approach sound and code-grounded; two smoke/type-check defects that would have turned Phases 2, 6 and 7 red are fixed in plan.md.
