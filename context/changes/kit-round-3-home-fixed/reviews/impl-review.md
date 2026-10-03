<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Overview, trend and fixed costs on kit round 3 (S-15)

- **Plan**: context/changes/kit-round-3-home-fixed/plan.md
- **Scope**: Full plan
- **Reviewed phases**: 1, 2, 3, 4, 5
- **Date**: 2026-10-03
- **Verdict**: APPROVED
- **Findings**: 0 critical, 2 warnings (both fixed), 5 observations (1 fixed)

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS |
| Scope Discipline | PASS |
| Safety & Quality | PASS |
| Architecture | PASS |
| Pattern Consistency | WARNING (F2, fixed) |
| Success Criteria | PASS |

## Scope checks requested by the orchestrator

- **FR-011/012/013 numbers unchanged**: `src/lib/patterns/over-limit.ts`, `fixed.ts`, `load.ts` have no diff vs `main`.
  `trend.ts` changes only `trendBarHeight` (bar height 12 → 8 %, presentation). `home.ts` `homeStats` drops
  `fixedTotalMinor` and adds `fixedNew = fixed.new.length`; `overMinor`, `previous`, `fixedRisen` are computed as before.
- **`/home` no longer renders the import panel or the fixed-cost total**: `ImportPanel.astro` deleted; no `ImportPanel`,
  `fixedTotalMinor`, `importTitle`, `importBody` in `src/` or `scripts/`; smoke „home summarises fixed costs with one
  month” notContains `>Dodaj najnowszy wyciąg<`.
- **`/imports/new` still reachable from `/home`**: title-row button `href="/imports/new"` (data branch), `EmptyState`
  `href="/imports/new"` (pre-import branch), nav `Sidebar` / `MobileNav` → `/imports` (list, which links to the new
  import). See F7.
- **No migration, no endpoint change**: `git diff --name-only main...HEAD -- supabase src/pages/api` is empty.
- **`copyExtra` guard** (`kit-contract.test.ts` „keeps copyExtra free of strings the kit already ships”): with
  `ROLE_EXCEPTIONS` removed, a listing script found exactly five collisions — all five exceptions are live and each
  reason names the colliding kit key (F3 completed one). Deliberate break: `copyExtra.fixed.probe = "Brak poprzedniego
  miesiąca do porównania."` (= `copy.fixedCosts.noComparison`, the exact pre-P4 duplicate class) → case red with
  `fixed.probe`; restored.
- **Subagents**: the skill's two review subagents were not launched; the source diff (≈ 1 200 lines) was read in
  full in this context. Would change: a diff too large to read whole.

## Findings

### F1 — Stale `/home` header comment after P1 (seam)

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: src/pages/home.astro (frontmatter header comment)
- **Detail**: P2 rewrote the header but kept „`/patterns` and `/fixed` are not retrofitted — one view, tracked as a
  follow-up” and „the pre-import state is unchanged from before this change”. P1 added the boundary to `/fixed` and
  `/patterns/<key>`, and P2 rebound the pre-import branch to kit `home.*` keys. A later phase silently contradicting an
  earlier one in prose.
- **Fix**: Rewrite the two clauses to the current truth.
- **Decision**: FIXED — `fcc4554`

### F2 — Unpinned 3-tuple cast of `fixedCosts.itemForms`

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: src/pages/fixed.astro `itemForms`; test/unit/kit-contract.test.ts
- **Detail**: P4 cast `copy.fixedCosts.itemForms as unknown as readonly [string, string, string]` for `plural()`.
  Every other kit forms array cast this way (`importFlow.debitForms`, `patterns.countForms`) uses a plain
  `as [string, string, string]` and is pinned with `toHaveLength(3)` in `kit-contract.test.ts` (S-14 impl review); this
  one was not pinned, so a kit reshape would fail silently at render.
- **Fix**: Plain cast + `expect(copy.fixedCosts.itemForms).toHaveLength(3)` in the existing pin case.
- **Decision**: FIXED — `fcc4554`

### F3 — `auth.saving` exception reason named one of two collisions

- **Severity**: 💬 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: test/unit/kit-contract.test.ts `ROLE_EXCEPTIONS`
- **Detail**: „Zapisywanie…” equals both `threshold.saving` and `patternActions.saving`; the reason cited only the first.
- **Fix**: Reason names both.
- **Decision**: FIXED — `fcc4554`

### F4 — `Badge.tsx` comment still says „G34 delivered”

- **Severity**: 💬 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: src/components/app/Badge.tsx (header comment)
- **Detail**: Not a `DESIGN-GAP` marker, still true for the badge tint; the register's G34 row now also covers S-15.
  Outside S-15 views. Recorded in the P5 handoff already.
- **Fix**: none now.
- **Decision**: RECORDED

### F5 — Trend value spacing / wrap differs from kit `.trend-value`

- **Severity**: 💬 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: src/components/home/TrendChart.astro (value `span`)
- **Detail**: Kit `.trend-value` has `margin-bottom:5px` and at ≤ 560 px `white-space:normal; line-height:1.1`; the app
  keeps `whitespace-nowrap` (plan P3 contract: G35 long-axis decision) and has no bottom margin. Planned deviation;
  the visual gate decides.
- **Fix**: none now; visual gate.
- **Decision**: RECORDED

### F6 — Guard catches byte-identical duplicates only

- **Severity**: 💬 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: test/unit/kit-contract.test.ts
- **Detail**: Same meaning with different text needs a reviewer. This review re-walked the surviving `fixed.*` / `home.*`
  leaves against `content.json` (`fixedCosts.*` incl. `decreased`, `counts`, `unchangedForms`; `dashboard.*`) — no
  ignored same-meaning key. Already a follow-up with a `Trigger:`.
- **Decision**: RECORDED

### F7 — Nav reaches the import wizard through `/imports`

- **Severity**: 💬 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Scope Discipline
- **Location**: src/components/app/Sidebar.astro, MobileNav.astro
- **Detail**: With `ImportPanel` gone, `/home` links straight to `/imports/new` from the title button and the empty
  state; the nav goes to the imports list (unchanged, kit `routes.md`). Product-visible removal is in `[human]` 5.11.
- **Decision**: RECORDED

## Success criteria (re-run in this step)

| Command | Result (baseline on `main` 1bf6a5c) |
| --- | --- |
| `npm run lint` | 0 errors (baseline 0) |
| `npx astro check` | 0 errors, 166 files (baseline 162, +4 = 5 files added — `InfoPanel`, `PanelTitle`, `FixedSummary`, `fixed-view.ts`, `fixed-view.test.ts` — minus `ImportPanel`) |
| `npm run fixture:check` | ing OK, santander OK |
| `npm test` | 387 passed / 27 files (baseline 375 / 26: +12 tests, +1 file) — before and after `fcc4554` (the pin is an `expect` in an existing case) |
| `npm run build` | OK (before and after fixes) |
| `npx supabase db reset && npx supabase test db` | Files=6, Tests=119, PASS (Δ0) |
| smoke on :4398 | 195 PASS / 0 FAIL, „All smoke steps passed” (baseline 192, +3 = P2 +1, P3 +2), before and after fixes |
| Deliberate break 1 | `copyExtra` guard (above) — red, restored |
| Deliberate break 2 | `home.astro` `zeroNote={h.zeroNote}` (unconditional) → smoke „home names each trend bar” FAIL (1 step); restored, tree clean. Meta-check: proves the page applies the „any bar is 0” condition, not the note's wording |

Manual `[reviewer]` rows 1.8, 2.7, 3.8, 4.7, 5.8 performed and ticked. `[visual]` 2.8, 5.9, 5.10 and `[human]` 5.11 open.

MERGE: CLEAR — no open CRITICAL, every automated criterion re-run green (smoke +3, vitest +12 vs baseline), both warnings fixed in `fcc4554`; only visual and human rows remain.
