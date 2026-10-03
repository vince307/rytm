<!-- PLAN-REVIEW-REPORT -->
# Plan Review: Patterns, pattern detail and the actions dialog on kit round 3 (S-14)

- **Plan**: context/changes/kit-round-3-patterns/plan.md
- **Mode**: Deep (code checked directly by the reviewer; no sub-agent)
- **Date**: 2026-10-03
- **Verdict**: SOUND after the fixes below (REVISE before them)
- **Findings**: 0 critical, 3 warnings, 3 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| End-State Alignment | PASS |
| Lean Execution | WARNING (F2, fixed) |
| Architectural Fitness | PASS |
| Blind Spots | WARNING (F1, fixed) |
| Plan Completeness | WARNING (F3, fixed) |

## Grounding

11/11 paths ✓ (`PatternsTable.tsx`, `table-columns.ts`, `table-columns.test.ts`, `field-styles.ts`, `Badge.tsx`,
`dialog.tsx`, `ViewEmpty.astro`, `decision-form.ts`, `BackLink.astro`, `merchant-mark.ts`, `kit-contract.test.ts`);
symbols ✓ (`fixedOverview(patterns, rows)` in `src/lib/patterns/fixed.ts`, new wins via `continue`, keys = `pattern.key`;
`focusRing` value byte-identical in `button.tsx`, `BackLink.astro`, `PatternsTable.tsx`, `dialog.tsx` close button;
`--rytm-focus-ring` .12 and `--rytm-badge-soft` rgba(199,157,98,.18) in `brand.css` and prototype `styles.css`
`.badge.new,.badge.changed`; `patterns.astro` IIFE with no `try`; `vitest.config.ts` `*.test.ts` only); kit copy ✓
(`renameLong` „…maksymalnie {n} znaków.”, `mergeInvalid`, `renamed`, `notFound`, `noOccurrences`, `showMore`,
`components.new/changed`, `threshold.invalid` match the smoke needles in the plan); no existing smoke assertion pins an
old `copyExtra` string the plan rebinds (grep) ✓; brief↔plan ✓ (after F2 update).

PRD check: FR-007 columns all kept (paging hides rows, search acts on the whole list). FR-011: `listView` filters,
sorts and slices but never touches `overMinor`/`sumMinor`; the count line uses the filtered total; badges sit beside
the excess value and do not change which patterns are over the limit — „Pokaż więcej” leaves sorting, sums and the
over-limit set unchanged ✓. FR-009/FR-010 rules unchanged (endpoints, validators out of scope) ✓.

Follow-ups whose `Trigger:` names S-14 (intake K17/K31/G29, S-12 F1/F2, S-04 F3/F11, S-05 F4/F5, S-06 badges/tint,
`try`): all included. S-05 F6/F7 deferred as rule changes (convincing, M-3 is presentation-only). Missed: S-01 F9
(close glyph, `2026-09-25-undo-import`, trigger "fold into the dialog-geometry change") → F3.

## Findings

### F1 — „Pokaż więcej” smoke break cannot fire: the smoke user never shows 4 rows

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Current State Analysis (smoke bullet), Phase 3 §3 and the page-size deliberate break, decision 2
- **Detail**: The plan says "the smoke user has 4 merchants" and uses `PATTERNS_PAGE_SIZE = 3` as the deliberate
  break for the new `notContains: ">Pokaż więcej<"` step. In `scripts/smoke.mjs` every `/patterns` request before the
  merge runs on `importPayload` only (Sklep smoke + Kawiarnia smoke = 2 rows); `importPayloadJune` (adds Piekarnia)
  is posted only after the merge, and Santander/Pizzeria run on other accounts later. With ≤ 3 rows, size 3 renders
  no button, so the break stays green and proves nothing.
- **Fix**: Place the step right after `patterns table keeps the Ponad progiem header` (2 rows), break with
  `PATTERNS_PAGE_SIZE = 1`; correct the smoke bullet and decision 2 rationale (≥ 2); Known risks names that paging
  itself is proven by unit/render tests and the visual row.
- **Decision**: FIXED (plan Phase 3 §3, success criterion and row 3.4, Current State, decision 2, Known risks)

### F2 — Phase 8 (dialog geometry) is too small to justify its own fresh agent and full gate

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Lean Execution
- **Location**: Phase 8 (old), Implementation Approach, decision 16
- **Detail**: Old P8 changed one class string in `dialog.tsx` plus a kit-contract pin (smoke Δ0). Its stated reason
  for isolation — "so its screenshots cover the two non-pattern dialogs" — does not hold: all screenshots are taken in
  the final phase (row 9.7). P4 already opens `dialog.tsx` (close-button `focusRing`) and is the same kind of change
  (shared class strings, pins, smoke Δ0). A separate phase costs a fresh agent plus a full local gate (build, db
  reset, pgTAP, smoke) for ~5 lines.
- **Fix**: Merge into P4 as „#### 4. Dialog geometry and close glyph”; P9 becomes P8 (rows 9.x → 8.x).
  - Strength: one fewer full gate and agent session; `dialog.tsx` edited once.
  - Tradeoff: P4 grows from 8 to 9 files, still class-string edits only.
  - Confidence: HIGH — no dependency on P5–P7; P4 stays a single-agent phase.
  - Blind spot: None significant.
- **Decision**: FIXED (plan: P4 overview/§4/criteria/rows 4.5–4.7; Phase 8 = register + sweep + visual; brief
  updated; decision 16 rewritten; Progress ↔ criteria re-checked 1:1 for all 8 phases)

### F3 — Triggered follow-up S-01 F9 (close glyph) not dispositioned

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 4 (dialog geometry), change.md follow-ups table
- **Detail**: `context/archive/2026-09-25-undo-import/follow-ups/review-fixes.md` S-01 F9: `dialog.tsx` inline
  `<svg><use …#close>` vs `Glyph` — "Fold into the dialog-geometry change above". S-14 is that change; the plan neither
  includes nor defers it. Same markup as `Glyph` (`rytm-icon`, `aria-hidden`), so zero visual change.
- **Fix**: Include in P4 §4: close button renders `<Glyph name="close" size={17} className="block" />`.
- **Decision**: FIXED

### F4 — `patternActions.lead` names a screen the app does not have, without a `[human]` row

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: End-State Alignment
- **Location**: decision 7, row 9.9 (now 8.9)
- **Detail**: Kit „…Możesz je później odwrócić w ustawieniach wzorca.” The plan reads it as the detail page (where
  every decision is reversed) — reasonable, not overturned; but it is a product-visible copy reading, so the
  maintainer should see it.
- **Fix**: Added to `[human]` row 8.9 and its Manual Verification bullet; decision 7 updated.
- **Decision**: FIXED

### F5 — Two kit sources disagree on the new/changed badge tint

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Architectural Fitness
- **Location**: Phase 2 §1
- **Detail**: `src/styles/brand.css` (synced from `react-kit/styles`) has `.rytm-badge--new, .rytm-badge--changed
  { background: #EFE4D1 }`; prototype `styles.css` round 3 has `background: var(--rytm-badge-soft)` (excess/18). Over
  `paper` #F2F1EC they come out within a few RGB steps. The plan follows the prototype (layout source per the
  contract) — correct; the implementer should not "fix" it toward `#EFE4D1`.
- **Fix**: None needed; recorded.
- **Decision**: RECORDED

### F6 — Kit Kwota cell falls back to the sum; the app keeps „—”

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: End-State Alignment
- **Location**: Phase 1 §1
- **Detail**: Kit `patternRows()` renders `money(p.amount||p.sum)` for a fixed pattern; the plan keeps
  `fixedAmountMinor` or „—”. Demo-data shortcut in the kit; FR-007 „kwota (dla stałych)” is the amount, not the sum.
  The plan's choice is right.
- **Fix**: None needed; recorded.
- **Decision**: RECORDED

## Phase sizing

8 phases after F2. P1–P3 each touch `PatternsTable` but deliver separable, testable outcomes (order, badges,
paging) — merging them would make one phase carry three deliberate-break sets; kept. P5/P6 split the detail page by
copy vs states; kept. P7 is the largest (dialog + result lines + constant) but single-component; kept.

VERDICT: PROCEED — approach sound and PRD-consistent (FR-011 untouched by paging/badges); three warnings fixed in plan.md (smoke break that could not fire, dialog geometry merged into P4 → 8 phases, S-01 F9 close glyph included).
