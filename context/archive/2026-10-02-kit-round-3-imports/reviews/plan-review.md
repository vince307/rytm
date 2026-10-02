<!-- PLAN-REVIEW-REPORT -->
# Plan Review: Import wizard, result and history on kit round 3 (S-13)

- **Plan**: context/changes/kit-round-3-imports/plan.md
- **Mode**: Deep
- **Date**: 2026-10-02
- **Verdict**: SOUND (after the in-plan fixes below)
- **Findings**: 0 critical, 4 warnings, 4 observations

Autonomous run `2026-10-02-kit-round-3`: no human triage. The reviewer triaged each finding into `plan.md` per the
agent contract (CRITICAL → fix; WARNING → fix if obvious, else `## Known risks`; OBSERVATION → record).

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| End-State Alignment | PASS |
| Lean Execution | WARNING |
| Architectural Fitness | PASS |
| Blind Spots | WARNING |
| Plan Completeness | WARNING |

## Grounding

Grounding: 9/9 paths ✓ (`ImportWizard.tsx`, `DeleteImportDialog.tsx`, `new.astro`, `index.astro`, `result.astro`,
`banks.ts`, `detect.ts`, `InlineAlert.astro`, `Glyph.tsx`), 14/14 symbols ✓ (`readStatement`, `blocking`,
`serverMessage`, `fill`, `Headline`, `readImportFile`/`FileError`, `accountLabel`, `formatRangeShort`/`Long`,
`isDemoEmail`/`demoImportAllowed`, `ServerError`, `usePageShowReset`), kit keys ✓ (every `importFlow` /
`importErrors` / `imports` key the plan names exists in `design/rytm-os/react-kit/docs/content.json`, incl.
`tooLarge {maxMb}`, `tooMany {maxTransactions}`, `limits` 5/5000, `formatRecognised {bank}`, `bankName`,
`deleteTitle {range}`, `importButton {n} {debits}`, `notFound`, `demoDeleteBlocked`), gap ids `G38` / `K33` free ✓,
Progress↔Phase ✓ (6 phases, 40 rows, one-to-one, single `## Progress`, no checkboxes in phase bodies), brief↔plan ✓.

Code checks (sub-agent + direct): `accountLabel()` readers = wizard, `index.astro`, `result.astro`, `banks.test.ts`,
a smoke comment — matches the plan's P2/P3/P4 retirement order. `copyExtra.imports` is read only by `new.astro`,
`index.astro`, `result.astro`, `home.astro` (no settings/layout reader). `FileError` has no exhaustive
switch/Record, so adding `tooLarge` compiles; `errors[fileError]` would show `{maxMb}` raw — the plan's
`fileErrorMessage` covers it. Wizard is `client:load` (SSR at step 1) and `ServerError` renders the message in a
`<span>`, so `>…` rendered-node needles work. `formatRangeLong("2026-05-01","2026-05-31")` = „1 maja – 31 maja
2026” as the P2 smoke expects. Smoke: Santander „Rachunek” / ING „Konto smoke”, both `…0099`; demo user ends with
≥ 1 import (P5 smoke placement valid). No `React` info alert exists (`ServerError` is error-only) → `InfoAlert`
is justified, not pattern sprawl.

Follow-ups whose `Trigger:` names or fires on S-13 (all archive `follow-ups/review-fixes.md` grepped): month
template (F-04) — not fired, no `{month}` in import copy (research); dialog geometry / S-01 F9 / undo-import F4 —
resolved on `main` or cross-view, recorded in `change.md`; F8 `DialogContent` `max-h` — in P6 visual gate +
follow-up clause; field radius S-04 F11 — not fired (no text field); prettier-must-not-reformat-kit — binding
(no `npm run format`, in "NOT Doing"). No `Trigger: S-13` entry exists (run log confirms). Deferrals convincing.

PRD check: FR-003 (count + range on the result) kept — h1 count + panel range; FR-004 list + undo kept; FR-005
overlap rejection unchanged server-side; FR-018 Santander same rules. No decision contradicts PRD text. Product-visible
choices (skipped-credits cell dropped, 200 not-found instead of 302) were added to `[human]` row 6.8.

## Findings

### F1 — Overlap smoke needle is a known false positive

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 2 §3 Smoke
- **Detail**: The plan asserts the bare text `Ten zakres nachodzi na istniejący import:`. The island's serialized
  props carry `importErrors.overlap` („Ten zakres nachodzi na istniejący import: {range}.”), so that needle is green
  even when nothing renders — exactly the false positive the agent contract warns about.
- **Fix**: Assert `>Ten zakres nachodzi na istniejący import:` (the `ServerError` `<span>` node) plus the link node.
- **Decision**: FIXED (plan.md Phase 2 §3)

### F2 — Demo step-1 gating fails OPEN on a read error as written

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Critical Implementation Details — Demo gating
- **Detail**: The plan says "fail closed (`count ?? 1`)", but `new.astro` has no count: `existing` is `data ?? []`,
  so on a select error `existing.length` is 0 and `demoImportAllowed(0)` is true — note hidden. Also, a demo user
  landing on `?error=demo` while locked would see the same sentence twice (`InfoAlert` + `ServerError`).
- **Fix**: `error ? 1 : existing.length`; show the sentence once when both apply. Reviewer row 5.5 checks it.
- **Decision**: FIXED (plan.md Critical Implementation Details, Phase 5 manual row text)

### F3 — Delete-dialog demo note source unnamed

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 3 §3 Delete dialog
- **Detail**: `labels.demoNote` had no copy source; there is no `demoNote` key. Kit `modal('deleteImport')` uses
  „Na wspólnym koncie demo cofanie importów jest wyłączone.” = `copy.imports.demoDeleteBlocked`. Without the name an
  implementer could invent a `copyExtra` key or reuse `importFlow.demoImportBlocked` (different text).
- **Fix**: `labels.demoNote = copy.imports.demoDeleteBlocked`.
- **Decision**: FIXED (plan.md Phase 3 §3)

### F4 — Step-3 demo-locked state is unreachable

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Lean Execution
- **Location**: Phase 5 §2, Phase 6 visual row
- **Detail**: When `demoLocked`, step 1 disables the picker and blocks drop, so step 3 cannot be reached; when not
  locked the step-3 button must stay enabled. The step-3 disabled button + note is dead code and the visual row
  listed a state ("step 3 — demo locked") an implementer cannot produce.
- **Fix**: Drop the step-3 demo change from P5; visual row marks it unreachable; K33 records the kit's unreachable
  state for the author.
- **Decision**: FIXED (plan.md Desired End State, Phase 5 overview + §2, Phase 6 §1 K33 and visual row, plan-brief)

### F5 — Wizard pending state not reset on bfcache restore

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 2 §2 (submit `importButton` / `waiting`)
- **Detail**: `ImportWizard` `submitting` has no `pageshow` reset (`DeleteImportDialog` uses `usePageShowReset`).
  Pre-existing, not introduced by the plan; the visual gate may reproduce it.
- **Fix**: Recorded in `## Known risks` with the conditional remedy.
- **Decision**: RECORDED (plan.md `## Known risks`)

### F6 — `>Bank<` is a short needle

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 3 §4 Smoke
- **Detail**: `>Bank<` could match another node on `/imports`; the step only proves the column if it goes red when the
  column is removed.
- **Fix**: Recorded in `## Known risks` (deliberate break required, else anchor on the header node).
- **Decision**: RECORDED (plan.md `## Known risks`)

### F7 — Additional kit-internal inconsistencies for K33

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 6 §1 Register
- **Detail**: `app.js` step-1 demo note says „dodawanie importów”, the key says „dodawanie i cofanie importów”;
  `app.js` writes „ponad 5 000”, `limits` renders „5000”. The key wins (copy rule); the author should know.
- **Fix**: Added to the K33 row contract.
- **Decision**: RECORDED (plan.md Phase 6 §1)

### F8 — Product-visible choices not on the human row

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: End-State Alignment
- **Location**: Phase 6 `[human]` row 6.8, decisions 5 and 8
- **Detail**: Dropping „Pominięte wpływy / zwroty” from the summary and turning the unknown-id 302 into a 200
  not-found page are product-visible. Neither breaks the PRD (FR-003 covers the result, not the summary), so they
  stand, but the human should see them.
- **Fix**: Both added to row 6.8's text (row title unchanged, Progress intact).
- **Decision**: RECORDED (plan.md Phase 6 manual criteria)

## Phase sizing

Six phases, each with its own green gate and at most one new UI component; P1 is the largest (module + detect +
step 1 + kit-contract + 2 smoke steps) but stays within one fresh agent. No split or merge needed; Progress
unchanged (40 rows).

VERDICT: PROCEED — the approach (pure presentation module, surface-by-surface rebinding, no server or schema change) holds against the code and kit; the four warnings were narrow and are fixed in plan.md.
