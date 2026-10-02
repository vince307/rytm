<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Import wizard, result and history on kit round 3 (S-13)

- **Plan**: context/changes/kit-round-3-imports/plan.md
- **Scope**: Full plan
- **Reviewed phases**: 1, 2, 3, 4, 5, 6
- **Date**: 2026-10-02
- **Verdict**: APPROVED (after the two WARNING fixes in `e305f81`)
- **Findings**: 0 critical, 2 warnings (both fixed), 6 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS (F1 fixed) |
| Scope Discipline | PASS |
| Safety & Quality | PASS |
| Architecture | PASS |
| Pattern Consistency | PASS (F2 fixed) |
| Success Criteria | PASS |

## How this review was run

- Full code diff `git diff main...HEAD -- src test scripts` (≈600 lines) read in the main context, not through the
  skill's two subagents (decision 1 in the handoff). Plan "Changes Required" of P1–P6 checked file by file: every
  planned file is in the diff; unplanned files: none outside `context/`.
- **No migration** in the slice: `git diff main...HEAD --stat -- supabase` is empty. pgTAP re-run on a fresh
  `db reset`: Files=6, Tests=119, PASS (Δ0). No two-account migration test needed; the data-isolation question the
  slice does raise (result page for a foreign id) was checked live, see F6.
- Write endpoints: none added or changed (`src/pages/api/**` not in the diff). `DeleteImportDialog` still posts to
  the unchanged `/api/imports/delete` (auth guard, zod uuid, demo guard `isDemoEmail` before the RPC, `checkOrigin`
  default). No new redirect target.

## Suites (observed in this step; baseline = contract line, `main` 2a8f89d)

| Suite | Before fixes | After fixes (`e305f81`) | Baseline | Delta |
| --- | --- | --- | --- | --- |
| `npm run lint` | 0 errors | 0 errors | 0 | 0 |
| `npx astro check` | 0 errors (155 files) | 0 errors (155 files) | 0 (152 files) | 0 errors; +3 files = `presentation.ts`, `InfoAlert.tsx`, `import-presentation.test.ts` |
| `npm run fixture:check` | ing OK, santander OK | same | OK | 0 |
| `npm test` | 351 / 23 files | 352 / 23 files | 347 / 22 | +5 tests, +1 file. Arithmetic: +7 import-presentation, +1 kit-contract (P1), −4 `accountLabel` (P4) = +4 → 351; +1 kit-contract (review F1) = 352 |
| `npm run build` | OK | OK | OK | — |
| `npx supabase db reset && npx supabase test db` | 119 PASS | 119 PASS | 119 | 0 |
| smoke (:4398, fresh reset) | 166 PASS / 0 FAIL | 166 PASS / 0 FAIL | 157 | +9 = plan's P1 +2, P2 +1, P3 +2, P4 +2, P5 +2 |

## Deliberate breaks (re-executed in this step)

1. `fileErrorMessage` returns `errors.unknownFormat` for `tooLarge` (`src/lib/import/presentation.ts`) →
   `import-presentation.test.ts` "fills the size limit for tooLarge" red (1 failed / 7); restored with
   `git checkout`, 7/7 green. Meta-check: proves the helper; the wizard's wiring (`readStatement` → `tooLarge`,
   step-1 `fileErrorMessage(errors, fileError)`) is confirmed by reading the code, not by a test (no React test infra).
2. `result.astro`: a `return Astro.redirect("/imports")` re-added after `const notFound = !imported` → smoke red on
   exactly "deleted import result shows not-found" and "import result of a malformed id shows not-found" (302);
   restored. Meta-check: those steps cover an own-deleted id and a malformed id; the foreign-id case is the same
   branch through RLS and was proven separately (F6), so the break plus F6 cover all three not-found inputs.

## [reviewer] rows

| Row | Result | Evidence |
| --- | --- | --- |
| 1.7 | PASS | `readStatement` checks `file.size > MAX_FILE_BYTES` before `file.arrayBuffer()`; step-1 strings: `kit.newEyebrow/newLead/back/dropTitle/choose/formatRecognised/bankName`, `flow.supported`, `errors.*` — all `copy.*`; removed `copyExtra.imports` keys: astro check 0 errors (a reader would fail typing) |
| 2.7 | PASS | `<dl>` rendered once above the overlap/free branch; `importButton` filled with `plural(n, flow.debitForms)`; no-range fallback = `overlapBefore` minus „: ” + `overlapAfter` „.” → „Ten zakres nachodzi na istniejący import.” + tail |
| 3.7 | PASS | `usePageShowReset` and `onOpenAutoFocus` still in `DeleteImportDialog`; `disabled={demo}` with `demo = isDemoEmail(...)` in `imports/index.astro`; `api/imports/delete.ts` not in the diff |
| 4.6 | PASS | `DESIGN-GAP: G38` comment in `result.astro` header matches register row G38 (both tables); FR-003: h1 „Dodaliśmy N …” (count) + meta „Zakres dat” (range) |
| 5.5 | PASS (code) | `demoImportAllowed(0) === true` → fresh demo unlocked (smoke "demo first import is accepted" green on fresh reset); `onDrop` → `handleFile` → `if (!file \|\| demoLocked) return`; fail closed `error ? 1 : existing.length`. Drag & drop not exercised in a browser |
| 6.7 | PASS (after F2) | seam greps empty; `fill` alias and the `resultTitle` replace chain removed (F2); register rows G38/K33/K32/K11 present; follow-ups carry `Trigger:` |

## Findings

### F1 — Kit-contract pins promised by the plan's Testing Strategy were missing

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: test/unit/kit-contract.test.ts (`describe("kit contract …")`)
- **Detail**: Testing Strategy lists `importErrors.overlap {range}`, `imports.deleteTitle {range}`,
  `importFlow.importButton {n}{debits}`; none were pinned. `ImportWizard` `overlapMessage` splits `overlap` at
  `{range}` — a kit intake dropping the placeholder would silently lose the range link with every suite green.
  `new.astro` also casts `importFlow.debitForms` to a 3-tuple unchecked.
- **Fix**: add one `it` pinning the three templates and `debitForms` length 3.
- **Decision**: FIXED (`e305f81`)

### F2 — Seam: second template filler left after P1/P6

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: src/components/imports/ImportWizard.tsx (`const fill = fillTemplate`), src/pages/imports/result.astro (`title`)
- **Detail**: P6 contract: "no duplicated helper (`fill` in the wizard replaced by `fillTemplate`)". The wizard kept
  `fill` as an alias; `result.astro` filled `resultTitle` with a `.replace("{n}")…replace("{debits}")` chain
  (string replacement, not the S-10 F4 function form) — a second filling path on an import surface.
- **Fix**: call `fillTemplate` directly at the five wizard sites and in `result.astro` `title`.
- **Decision**: FIXED (`e305f81`; smoke "Dodaliśmy 2 obciążenia." still green)

### F3 — Result page turns an imports read error into "not found", unlogged

- **Severity**: 💬 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/pages/imports/result.astro (`imported` select)
- **Detail**: only `.data` is read; a DB error renders the kit not-found state with no log line. Pre-existing (it
  used to redirect to `/imports`, equally silent); the count query does log.
- **Fix**: log the select error and show `components.error`. Deferred → `follow-ups/review-fixes.md`.
- **Decision**: DEFERRED (follow-up with Trigger)

### F4 — `design-kit.md` diff is mostly table re-padding

- **Severity**: 💬 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Scope Discipline
- **Location**: context/foundation/design-kit.md
- **Detail**: 225 changed lines, 19 with `git diff -w` (lint-staged Prettier re-pads every Markdown table). Content
  changes are the G38/K33/K32/K11/round-4 rows the plan asked for. Noise for the PR reviewer only.
- **Fix**: none; mention in the PR body.
- **Decision**: RECORDED

### F5 — Register has no "adopted" marker for the S-13 rows

- **Severity**: 💬 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: context/foundation/design-kit.md § „Runda 3 — status rejestru”
- **Detail**: plan P6 says K16/K20/K26/G25/G26/G27/G30 "→ adopted in S-13"; the table's „Slice” column already
  names S-13 and the table convention has no adopted/pending marker (implementer decision 4). Acceptable; the
  archive is the adoption record.
- **Fix**: none.
- **Decision**: RECORDED

### F6 — Not-found 200 for a foreign id leaks nothing (verified)

- **Severity**: 💬 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/pages/imports/result.astro (`notFound` branch)
- **Detail**: live check after smoke: as `test@rytm.local`, `/imports/result?id=<demo user's import id>` and
  `?id=<random uuid>` both 200 and byte-identical once the id string is removed; no account name, tail or count in
  the body; `?id=nope` same state; anonymous → 302 `/login`. Status 200 vs 404 is plan decision 5.
- **Fix**: none.
- **Decision**: RECORDED

### F7 — Demo-locked wizard keeps the „Wybierz inny plik” text button enabled

- **Severity**: 💬 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/components/imports/ImportWizard.tsx (`chooseOtherButton`)
- **Detail**: with `demoLocked` and a `?error=` (e.g. `overlap`, `invalid`), the error alert's „Wybierz inny plik”
  opens the picker; `handleFile` then ignores the file silently. No server effect (guards unchanged).
- **Fix**: disable `chooseOtherButton` when `demoLocked`. Deferred → `follow-ups/review-fixes.md`.
- **Decision**: DEFERRED (follow-up with Trigger)

### F8 — Known risk: wizard `submitting` without bfcache reset

- **Severity**: 💬 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/components/imports/ImportWizard.tsx (`submitting`)
- **Detail**: plan `## Known risks` (plan review F6), unchanged; to be decided by the visual gate (6.6).
- **Fix**: `usePageShowReset(() => setSubmitting(false))` if the gate reproduces it.
- **Decision**: DEFERRED to the visual gate (follow-up with Trigger)

MERGE: CLEAR — no CRITICAL; both WARNINGs fixed in e305f81; all suites green (vitest 352 = baseline 347 +5, smoke 166 = 157 +9, pgTAP 119 Δ0); every [reviewer] row passed; open rows are [visual] 6.6 and [human] 6.8, which are not merge-blocking criteria for this step
