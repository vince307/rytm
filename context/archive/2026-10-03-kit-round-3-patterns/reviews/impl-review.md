<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Patterns, pattern detail and the actions dialog on kit round 3 (S-14)

- **Plan**: context/changes/kit-round-3-patterns/plan.md
- **Scope**: Full plan
- **Reviewed phases**: 1, 2, 3, 4, 5, 6, 7, 8
- **Date**: 2026-10-03
- **Verdict**: APPROVED (after fixes in `5e85b9a`)
- **Findings**: 0 critical, 3 warnings, 6 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS |
| Scope Discipline | PASS |
| Safety & Quality | PASS |
| Architecture | PASS |
| Pattern Consistency | WARNING (F2 fixed; F7 open) |
| Success Criteria | PASS |

## Suites (re-run by the reviewer, branch at `5e85b9a`)

Baseline (contract, `main` at 5ed97f4): lint 0; astro check 0 errors (157 files); fixture:check OK; vitest 354 / 23 files;
build OK; pgTAP Files=6 Tests=119 PASS; smoke 184 PASS / 0 FAIL.

| Suite | Branch | Delta |
| --- | --- | --- |
| `npm run lint` | 0 errors | 0 |
| `npx astro check` | 0 errors, 0 warnings, 3 hints (162 files) — observed, before and after the fixes | +5 files |
| `npm run fixture:check` | ing OK, santander OK | 0 |
| `npm test` | 375 passed / 26 files | +21 tests (= 354 + 21), +3 files (+4 new − `table-columns.test.ts`) |
| `npm run build` | OK | — |
| `npx supabase db reset && npx supabase test db` | Files=6, Tests=119, PASS (unsandboxed) | 0 |
| smoke on :4398 | 192 PASS / 0 FAIL, before and after the fixes | +8 (= P3 +1, P5 +2, P6 +2, P7 +3 — the plan's net +8) |

Orchestrator flag (b): P5 recorded +2 against criterion 5.6 „smoke + 3”. 5.6 is cumulative from the baseline
(P3 +1 + P5 +2 = +3); P5's own contract is „Smoke +2”. Met.

Deliberate breaks re-executed:
1. `listView` slicing before filtering (`rows.slice(0, PATTERNS_PAGE_SIZE).filter(…)`) → 4 list-view + 1 render test red;
   restored, 8/8 green. Meta: proves the filter → sort → slice order (FR-011 sums/status are server values the slice
   only hides).
2. `scripts/smoke.mjs` `request()` back to „read body only on 200” → exactly one step red
   (`unknown pattern shows the kit not-found panel -> 404`); restored. Meta: the only pre-existing 404 step asserts
   status alone, every `notContains` step asserts 200, redirects assert status/location — no existing step relied on an
   empty non-200 body, and the new not-found step is not vacuous (orchestrator flag (a)).

Migration: none (`git diff main...HEAD -- supabase` empty). Write endpoints: `src/pages/api/` not in the diff; auth via
middleware prefix on `/patterns`, zod `decisionSchema`, `user_id` never from the form, redirects only to `/patterns` or a
server-resolved `patternHref`. Rename limit: `parseDisplayName` uses `DISPLAY_NAME_MAX = 100`, DB CHECK
`char_length(display_name) between 1 and 100` unchanged.

Shared styles (flag (c)): `focusRing` byte-identical to main in `buttonVariants`, `BackLink`, dialog close; no
`DialogContent` importer (`DeleteImportDialog`, `DeleteAccountDialog`, `PatternActionsDialog`) passes `className`;
close button keeps position and `sr-only` label; `field` reaches only `PatternsTable` and `MonthSelect`. Pixels: visual
row 8.7 (see F5).

„Pokaż więcej” (flag (d)): `listView` filters, stable-sorts, then slices; the count line reads `total`; the button only
sets `expanded`; sums, over-limit values and badges are server row values — FR-011 unaffected.

## Findings

### F1 — Dead `copyExtra.patterns.sumLabel` leaf with a false comment

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: src/content/copy.ts `copyExtra.patterns.sumLabel`
- **Detail**: P5 rebound the reader to `copy.patternDetail.sumLabel`; the leaf stayed, its comment claimed the kit bakes „maju” in. The P8 leaf-reader loop missed it because `sumLabel` is also a local variable name in `[...key].astro`.
- **Fix**: Delete the leaf and its comment.
- **Decision**: FIXED — 5e85b9a

### F2 — `plural()` widened to `readonly string[]`, 3-form check lost for every caller

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: src/lib/format.ts `plural`; src/lib/patterns/sequence-label.ts `sequenceLabel`; `PatternsTableCopy.patternForms`
- **Detail**: P1 widened the signature so the JSON-typed `copy.patterns.countForms` compiles; a 2-element array would render `undefined`. The repo precedent (`importFlow.debitForms`, S-13) casts at the kit boundary and pins the length.
- **Fix**: `plural` / `sequenceLabel` / `patternForms` back to `readonly [string, string, string]`; `countForms as [string, string, string]` in `patterns.astro` and `ExcludedPatterns.astro`; `kit-contract.test.ts` pins `copy.patterns.countForms` length 3.
- **Decision**: FIXED — 5e85b9a

### F3 — Stale comments / register wording after later phases

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: src/components/patterns/PatternActionsDialog.tsx `dialogFieldBox`; context/foundation/design-kit.md row G32 (round-3 table)
- **Detail**: The comment said „the select has no kit reference … new fields use kit 8 px locally” — P7 adopted the kit merge view and P4 the shared `fieldBox`. G32 said „jedno `field`” where the shared box is `fieldBox`.
- **Fix**: Rewrite the comment; name `fieldBox` in G32.
- **Decision**: FIXED — 5e85b9a

### F4 — `request()` now reads 404 bodies

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Scope Discipline
- **Location**: scripts/smoke.mjs `request`
- **Detail**: Unplanned but needed for the P6 not-found step. Verified by break 2: no existing step changes meaning.
- **Fix**: None.
- **Decision**: ACCEPTED

### F5 — Phone dialog padding 18 px vs the close glyph

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/components/ui/dialog.tsx `dialogContentClass`
- **Detail**: Close button sits at `right-[19px]` (17 px glyph); `DialogTitle` has no right padding, so a long title may run under it at ~400 px in all three dialogs.
- **Fix**: Check in visual row 8.7; add right padding to `DialogTitle` if it overlaps.
- **Decision**: DEFERRED — follow-ups/review-fixes.md (Trigger: visual gate row 8.7)

### F6 — `ViewEmpty` callers not byte-identical

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: src/components/app/ViewEmpty.astro (CTA `arrow` branch)
- **Detail**: The `{" "}` inside the `arrow` fragment adds whitespace text inside the `inline-flex` CTA; same elements and classes, no visual effect.
- **Fix**: None.
- **Decision**: ACCEPTED

### F7 — `FormField` / `DeleteAccountDialog` keep their own 8 px box

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: src/components/auth/FormField.tsx; src/components/settings/DeleteAccountDialog.tsx
- **Detail**: Already carried in the handoff; `fieldBox` composes `focus-within:` on a wrapper, these use `focus:` on the input.
- **Fix**: Consolidate when those forms are next touched.
- **Decision**: DEFERRED — follow-ups/review-fixes.md

### F8 — Detail page has no assembly `try`

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: src/pages/patterns/[...key].astro (`patternDetail`, `sequenceLabel`)
- **Detail**: Not a regression (main had none); `patterns.astro` gained one in P1.
- **Fix**: Align with S-15's `fixed.astro` `try`.
- **Decision**: DEFERRED — follow-ups/review-fixes.md (Trigger: S-15)

### F9 — `home.astro` cites a non-existent `sumLabel` precedent

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: src/pages/home.astro (comment above the month-locative fill)
- **Detail**: Stale since before S-14; out of this slice's views.
- **Fix**: Repoint to `[...key].astro` when S-15 edits `home.astro`.
- **Decision**: DEFERRED — follow-ups/review-fixes.md (Trigger: S-15)

## Manual rows

`[reviewer]` 1.7, 2.6, 3.7, 4.7, 5.7, 6.6, 7.7, 8.8 performed and ticked (8.8 after F1/F3 fixes). Open: `[visual]` 8.6,
8.7; `[human]` 8.9.

MERGE: CLEAR — no open CRITICAL, every automated criterion met and re-observed (smoke +8, vitest +21, pgTAP Δ0), all suites green after fixes; warnings fixed in 5e85b9a, observations recorded with triggers.
