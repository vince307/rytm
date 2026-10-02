<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Kit round 3 intake (F-04)

- **Plan**: context/changes/kit-round-3-intake/plan.md
- **Scope**: Full plan
- **Reviewed phases**: 1, 2, 3
- **Date**: 2026-10-02
- **Verdict**: APPROVED
- **Findings**: 0 critical, 2 warnings, 5 observations (all warnings fixed in `d279eef`)

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS |
| Scope Discipline | PASS |
| Safety & Quality | PASS |
| Architecture | PASS |
| Pattern Consistency | WARNING (F2, fixed) |
| Success Criteria | PASS |

## Evidence (observed in this step)

| Check | Result |
| --- | --- |
| `npm run lint` | 0 errors (baseline 0, Δ0) |
| `npx astro check` | 0 errors, 152 files (baseline 149, +3 new files: `table-columns.ts`, 2 tests) |
| `npm run fixture:check` | OK (ing + santander) |
| `npm test` | 347 passed / 22 files (baseline 335 / 20: +5 `fillMonthLocative`, +1 `table-columns`, +6 kit-contract = +12; +2 files) |
| `npm run build` | OK |
| `npx supabase db reset && npx supabase test db` | Files=6, Tests=119, PASS (Δ0) |
| smoke on `astro dev` :4398 | 157 PASS / 0 FAIL (baseline 151, +6 — the 6 planned steps); re-run after the fix commit: same |
| Delivery vs kit (`diff -rq -x .DS_Store` per contract mapping, `cmp` CHANGELOG) | only `react-kit/docs/content.json` differs; parsed diff = 4 added `authStates` leaves (`loginError`, `resetTitle`, `resetBody`, `checkInbox`), each byte-equal to `main`'s round-2 value; 0 removed / 0 changed; no file under `design/` deleted |
| `bash scripts/sync-kit.sh` re-run | `git status` clean (idempotent) |
| Migration / write endpoints | none in `git diff main...HEAD` (`supabase/`, `src/pages/api/`, `src/middleware.ts`, `src/db/` untouched) — the two-account RLS check does not apply; no endpoint review needed |
| Templated kit keys (`{x}` in round-3 `content.json`, 22 leaves) vs readers in `src/` | every one the app reads is filled (`passwordTooShort` ×3, `resetNew.lead`, `trend.tooShort`, `fixedCosts.new`, `footer.copyright`); `dashboard.stats[].foot`, `importErrors.tooLarge/tooMany/overlap`, `components.info` etc. are not read |
| Deliberate break 1 | `table-columns.ts` `BODY_ORDER` → identity order: `table-columns.test.ts` red (1 failed / 347), restored → green. Meta-check: kit-contract stays green on this break (it pins lengths only) — the `table-columns` test is the guard of the mapping |
| Deliberate break 2 | `register.astro` `passwordTooShort` without `.replace("{n}", …)`: smoke `register fills the password minimum` FAIL, restored → PASS. Meta-check: the needle lives in island props, so the `notContains: "{n}"` half is what proves the fill (the rendered node appears only after typing) |

## Findings

### F1 — S-14 follow-up gives the wrong kit column order

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: context/changes/kit-round-3-intake/follow-ups/review-fixes.md § „S-14”
- **Detail**: The entry called the app's body order (Suma / Kwota) "the kit column order"; round-3 `patterns.columns` is Sprzedawca / Typ / Wystąpienia / **Kwota / Suma** / Próg / Ponad progiem. S-14 following the entry would keep the wrong order and believe K17 adopted.
- **Fix**: Corrected order, named `BODY_ORDER` / `PatternsTable` / `table-columns.test.ts` as the things S-14 changes.
- **Decision**: FIXED (`d279eef`)

### F2 — `DESIGN-GAP` marker dropped for a still-open gap (K25 / K29)

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: src/content/copy.ts `copyExtra.home.deltaFoot` comment
- **Detail**: Phase 3 reworded the K25 comment and removed its `DESIGN-GAP` token, although the register marks K25 `partial` and K29 `open · S-15` — the app still fills the gap with its own feet. CLAUDE.md: a kit gap carries a `DESIGN-GAP` comment; slices grep for it.
- **Fix**: Comment now starts `DESIGN-GAP: K25 / K29 —` (`grep -rn DESIGN-GAP src | wc -l` 50 → 51).
- **Decision**: FIXED (`d279eef`)

### F3 — `.prettierignore` follow-up candidate not queued

- **Severity**: 💬 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Scope Discipline
- **Location**: plan.md § Known risks; follow-ups/review-fixes.md
- **Detail**: Plan review F1 named `.prettierignore` for `design/` + `src/styles/brand.css` a follow-up candidate; it was only in the handoff, without a `Trigger:`.
- **Fix**: Added entry „Prettier must not reformat the kit” with a `Trigger:` line.
- **Decision**: FIXED (`d279eef`)

### F4 — Stale register text in design-kit.md

- **Severity**: 💬 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: context/foundation/design-kit.md § „Widoki i trasy w kicie” `/home` row; legacy K17, K18, G36 rows
- **Detail**: `/home` still read „3 stat-cardy … z częściowym miesiącem” (round 3: 2 cards, C5; no „niepełny”, C4). K17/K18/G36 legacy rows read as open with no pointer to the round-3 status table.
- **Fix**: `/home` row updated; each of the three rows ends with „Runda 3: zob. § „Runda 3 — status rejestru”.”
- **Decision**: FIXED (`d279eef`)

### F5 — Kit-contract coverage edges

- **Severity**: 💬 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: test/unit/kit-contract.test.ts
- **Detail**: `copyExtra.patterns.overInMonth` (filled by `fillMonthLocative` in `patterns/[...key].astro`) was not pinned while its sibling `sumLabel` was. `authStates.passwordMinLength` is asserted but not read by `src/` — it is the deliberate drift pin of plan decision 7 (app `MIN_PASSWORD_LENGTH` wins), so row 2.8 passes with this noted. Reader-side index reads (`home.astro` `stats[1]`) stay unguarded by automation, as the plan recorded.
- **Fix**: Added `expect(copyExtra.patterns.overInMonth).toContain("w {month}")`.
- **Decision**: FIXED (`d279eef`)

### F6 — `referenceMonth ?? ""` type escape in `/fixed`

- **Severity**: 💬 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/pages/fixed.astro `FixedSection` „Nowe” `title`
- **Detail**: `FixedOverview.referenceMonth` is `string | null`; the overview branch is reached only when it is non-null (the IIFE returns `{ referenceMonth: null }` otherwise), so `""` is unreachable. If the invariant ever broke, `fillMonthLocative` would print „Nowe w undefined”.
- **Fix**: None now; a narrower `FixedOverview` type is for whoever next touches `fixedOverview`.
- **Decision**: ACCEPTED

### F7 — Remaining stale gap marker K24

- **Severity**: 💬 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: src/pages/home.astro `leadFor`, src/content/copy.ts `copyExtra.home.lead`
- **Detail**: `DESIGN-GAP: K24` remains although round 3 delivers `dashboard.description` / `descriptionNoName` templates; adoption (nominative vs locative month) belongs to S-15 per the register. Left as is — F-04 is no-rebind.
- **Fix**: S-15 binds the kit lead and drops the marker.
- **Decision**: ACCEPTED (S-15)

## Reviewer rows

- 1.8 — PASS, ticked.
- 2.8 — PASS (with F5 note), ticked.
- 3.7 — PASS after F1/F3/F4 fixes (register vs research matrix: all 33 ids K11–K26, G20, G23–G37 match status and slice; K27–K32 cover plan items (a)–(f); seam greps empty), ticked.
- 3.6 `[visual]` and 3.8 `[human]` remain open (not reviewer rows).

MERGE: CLEAR — no CRITICAL, every automated criterion met and re-observed (lint, astro check, fixture, vitest 347, build, pgTAP 119, smoke 157/0), no migration; remaining rows are the visual gate and the `[human]` acceptance.
