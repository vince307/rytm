<!-- IMPL-REVIEW-REPORT -->

# Implementation Review: Merchant patterns list (S-03)

- **Plan**: context/changes/merchant-patterns/plan.md
- **Scope**: Full plan
- **Reviewed phases**: 1, 2, 3
- **Date**: 2026-09-27
- **Verdict**: APPROVED
- **Findings**: 0 critical, 2 warnings, 6 observations

Reviewed by the `impl-review` step of autonomous run `2026-09-27-s03-s02-s04` (no human in the loop — triage decided
in place, see `handoff.md` § 6). Diff `d11f3ef..HEAD` (22 files). Two parallel sub-reviews (plan drift; safety +
pattern consistency) plus the reviewer's own read of `normalizeMerchant` (Progress 1.7) and a full re-run of the gate.

## Verdicts

| Dimension           | Verdict |
| ------------------- | ------- |
| Plan Adherence      | PASS    |
| Scope Discipline    | PASS    |
| Safety & Quality    | WARNING |
| Architecture        | PASS    |
| Pattern Consistency | WARNING |
| Success Criteria    | PASS    |

## Gate re-run by the reviewer (baseline `main` at `d11f3ef`, from `agent-contract.md`)

| Command                                                                                             | Result                                              | Arithmetic vs baseline                                                                                                                    |
| --------------------------------------------------------------------------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run lint`                                                                                      | 0 errors, 0 warnings                                | 0 + 0                                                                                                                                     |
| `npx astro check`                                                                                   | 0/0/0, 89 files                                     | 82 files + 7 new (`merchant.ts`, `derive.ts`, `load.ts`, `Glyph.tsx`, `Badge.tsx`, `PatternsTable.tsx`, `patterns.test.ts`), errors 0 + 0 |
| `npm run fixture:check` + `git diff --quiet d11f3ef..HEAD -- test/fixtures scripts/fixture-ing.mjs` | OK, fixture untouched                               | —                                                                                                                                         |
| `npm test` (vitest)                                                                                 | before fix 71/71, 4 files; after fix 72/72, 4 files | 32 + 39 (implement) = 71; + 1 (F1 test) = 72; files 3 + 1                                                                                 |
| `npm run build`                                                                                     | Complete (before and after fix)                     | —                                                                                                                                         |
| `npx supabase db reset && npx supabase test db`                                                     | 44/44, 2 files, PASS                                | 44 + 0 (no schema change)                                                                                                                 |
| smoke on :4398 (`ASTRO_DEV_BACKGROUND=1 npx astro dev --port 4398 --ignore-lock`)                   | 48 PASS / 0 FAIL, before and after fix              | 46 + 2 (`patterns lists imported merchants`, `patterns proposes a type`)                                                                  |

Server on :4398 killed after; :4321 (maintainer's) not touched.

Deliberate breaks executed by the reviewer:

1. `normalizeMerchant` with rule 6 (`dropDoubledPrefix`) removed → 1 test red (`PIEKARNIA KŁOSEK PIEKARNIA KŁOSEK ŁÓDŹ →
PIEKARNIA KŁOSEK ŁÓDŹ`), restored with `git checkout --` → 71/71. **Meta-check:** only the synthetic rule case went
   red, `fixture partition` stayed green — the fixture carries T02 only in its doubled form (6 × `PIEKARNIA KŁOSEK
PIEKARNIA KŁOSEK ŁÓDŹ`), so rule 6 changes the display name, never the partition. The plan's "the oracle partition
   pins rule order" holds for rules 3–5, not 6 (see F3).
2. F1 fix reverted (`git stash` of `load.ts`) → new case `fails instead of returning a partial list when pages end
short of the count` red, restored → 72/72. **Meta-check:** the fake counts 7 on page 1 then serves 5 rows, which is
   exactly the concurrent-delete shape; the case goes red only when the empty-page-before-count check is absent.

## Progress rows performed by the reviewer

- **1.7** read `normalizeMerchant` (`src/lib/patterns/merchant.ts`) against the plan's rule list: rules 1→7 in the
  planned order; `LEGAL_FORM` verbatim from the plan; `ADDRESS` cuts from the first `UL.`/`AL.`; `STORE_NUMBER`
  ≥ 3 digits; `dropDoubledPrefix` longest-prefix-first; empty result falls back to the collapsed NFC raw. No rule the
  plan does not name; each rule has a fixture-derived case in `test/unit/patterns.test.ts` (UL., SP. Z O.O., S.A.,
  S.A.R.L., store numbers, T02) or is named by the plan (SP. J., SP. K., S.C., S.C.A, bare SA). **PASS → ticked.**
- 3.8 screenshots — left for the Visual step.

## Findings

### F1 — `collectPages` returns a silently partial list when rows shift mid-read

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/lib/patterns/load.ts `collectPages`
- **Detail**: Offset paging; if an import is deleted in another tab mid-read (S-02 undo), later rows shift left, the
  loop ends on an empty page and returns fewer rows than the first page's `count` with no error — contradicting the
  function's own "no partial list" contract and FR-007 "every transaction counts once" (plan Known risks F6).
- **Fix**: On an empty page, return `{ error }` when `total !== null && rows.length < total`; add a unit case.
- **Decision**: FIXED — applied in `collectPages` + test `fails instead of returning a partial list when pages end
short of the count`; gate re-run green. Keyset paging (the full cure) stays in `follow-ups/review-fixes.md`.

### F2 — `collectPages` has no iteration bound and counts on every page

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Safety & Quality
- **Location**: src/lib/patterns/load.ts `collectPages`, `loadPatterns`
- **Detail**: With `count: null` and a server that ignores `range`, the loop never ends; `count: "exact"` runs a
  `COUNT(*)` on every page though only the first is used. Neither occurs with PostgREST today (`range` honoured,
  `count` returned), and `data_volume: small` means 1–3 pages.
- **Fix**: Switch `loadPatterns` to keyset paging (`.gt("id", lastId).order("id").limit(PAGE_SIZE)`, count on the
  first page only, stop on an empty page) — also removes F1's root cause.
  - Strength: removes offset shift and per-page COUNT together; plan-review F6 already names it.
  - Tradeoff: rewrites the paging contract and its tests; `transactions.id` ordering must be verified.
  - Confidence: MED — straightforward, but touches the plan's pinned paging contract.
  - Blind spot: S-02's delete path behaviour under concurrent reads not observed.
- **Decision**: DEFERRED → `follow-ups/review-fixes.md` (not cheap/local enough for review; no user-visible defect today).

### F3 — Test gaps: rule 6 not pinned by the oracle; `S.C.A` / bare `http://` unexercised

- **Severity**: 💬 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: test/unit/patterns.test.ts `normalizeMerchant` cases
- **Detail**: Reviewer break 1 shows rule 6 is guarded only by one synthetic case. The `S\.C\.A` alternative only
  appears after `S.A.R.L.` has already cut the string, so it is never exercised alone; no `http://` (non-TLS) case.
- **Fix**: Add a standalone `S.C.A` case and an `http://` case when S-05 touches normalization.
- **Decision**: RECORDED

### F4 — `—` placeholder for non-fixed amount is a literal, not copy

- **Severity**: 💬 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: src/components/patterns/PatternsTable.tsx `PatternsTable` (Kwota cell)
- **Detail**: The kit itself uses the literal dash; K17 covers the column. Typographic glyph, not wording.
- **Fix**: Move to `copyExtra.patterns` if the K17 author delivers a key.
- **Decision**: RECORDED

### F5 — `columns.slice(0, 4)` done twice

- **Severity**: 💬 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: src/pages/patterns.astro `tableCopy`, src/components/patterns/PatternsTable.tsx `PatternsTable`
- **Detail**: Harmless redundancy; the island payload already carries 4 columns.
- **Fix**: Trim in the page only.
- **Decision**: RECORDED

### F6 — Error log shape differs from `imports/index.astro`

- **Severity**: 💬 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: src/pages/patterns.astro frontmatter `console.error`
- **Detail**: Logs the whole error object (incl. `details`/`hint`); the neighbour logs `code` + `message`. Server-side
  only, no user data in PostgREST errors here.
- **Fix**: Log `code` and `message` like `imports/index.astro`.
- **Decision**: RECORDED

### F7 — `Glyph` `size` wider than `Icon.astro`

- **Severity**: 💬 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: src/components/Glyph.tsx `GlyphProps`
- **Detail**: `Icon.astro` restricts `size` to the kit sizes; `Glyph` takes any `number`.
- **Fix**: Share the size union between the two.
- **Decision**: RECORDED

### F8 — Carried plan risks (real-statement over-merge, roadmap Risk line)

- **Severity**: 💬 OBSERVATION
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Plan Adherence
- **Location**: src/lib/patterns/merchant.ts `LEGAL_FORM`, `STORE_NUMBER`; context/foundation/roadmap.md `### S-03`
- **Detail**: Plan-review F7: bare `SA` and ≥ 3-digit token rules can merge distinct real merchants (`PIZZA 365`);
  the oracle cannot see this. Roadmap `### S-03` Risk line still promises a migration the slice deliberately omits.
- **Fix**: S-05 user merges / owner feedback on real statements; the archive step corrects the roadmap text.
- **Decision**: RECORDED

## Success criteria

All automated Progress rows re-observed green above. Manual: 1.7 performed and ticked by the reviewer; 3.9 was ticked
by implement on HTTP evidence (consistent with the smoke's 2 new green steps; not re-run visually); 3.8 pending for the
Visual step. No success criterion unmet. Slice has UI: `/patterns` (`src/pages/patterns.astro` +
`src/components/patterns/PatternsTable.tsx`).

MERGE: CLEAR — 0 open CRITICAL, all suites green on re-run (vitest 72 = 32+40, smoke 48 = 46+2, pgTAP 44 = 44+0), F1 fixed, F2 deferred to follow-ups; only screenshots (3.8) remain for the Visual step
