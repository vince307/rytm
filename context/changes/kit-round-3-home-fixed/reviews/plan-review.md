<!-- PLAN-REVIEW-REPORT -->
# Plan Review: Overview, trend and fixed costs on kit round 3 (S-15)

- **Plan**: context/changes/kit-round-3-home-fixed/plan.md
- **Mode**: Deep (claims verified inline against the code — no sub-agent; see Grounding)
- **Date**: 2026-10-03
- **Verdict**: SOUND (after the triage fixes below; REVISE before them)
- **Findings**: 0 critical, 4 warnings, 3 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| End-State Alignment | PASS |
| Lean Execution | PASS |
| Architectural Fitness | WARNING (F1) |
| Blind Spots | PASS |
| Plan Completeness | WARNING (F2, F3, F4) |

## Grounding

Paths 9/9 ✓ (`src/pages/{home,fixed}.astro`, `src/pages/patterns/[...key].astro`, `src/components/home/{ImportPanel,TrendChart,StatCard}.astro`,
`src/components/fixed/FixedSection.astro`, `src/lib/patterns/{home,trend}.ts`, `src/lib/format.ts`, `test/unit/{home-stats,kit-contract,format,over-limit-trend}.test.ts`);
new files (`PanelTitle`, `FixedSummary`, `InfoPanel`, `fixed-view.ts`) absent today ✓. Symbols ✓: `homeStats`/`fixedTotalMinor`/`fixedRisen`,
`fillMonthLocative` `slice(5, 7)`, local `monthIndex` + `sumLabel` comment in `home.astro`, `fixed.astro` without `try`, `FixedSection` `compact`/`empty`.
Kit keys ✓ (`content.json`): `dashboard.descriptionNoName`, `stats[0].foot`, `trend.{noThreshold,amountLabel,zeroMarker,gridLabel}`,
`fixedCosts.{readError,noChanges,noNew,noComparison,itemForms}`, `importFlow.debitForms`, `imports.santanderAccountName`,
`auth.resetVisual.{eyebrow,title}`, `home.*`, `app.fixedLong`; `patternDetail.monthNames` keys = 12 nominatives in order. Kit markup (`app.js`
`dashboard()`): `.fixed-summary-row` = `<span>label</span><strong>n koszty</strong>` ✓. Register last ids K37 / G38 ✓. Collision scan
(esbuild-bundled `copy.ts`, read-only): today 33 colliding leaves; after P1–P5 only the role exceptions remain; the new S-15 literals
(„Zobacz zmiany”, „Podrożały”, „Nowe”, „koszt/koszty/kosztów”, zero note, „wzrost”/„spadek”) collide with nothing. Smoke needles checked against the
smoke data (one-month: risen 0 / new 0 → `>0 kosztów<` ×2; June: risen 1 / new 1 → `>1 koszt<` ×2; May bar `maj 26: 5,50 zł ponad próg`). brief↔plan ✓.
Follow-ups with `Trigger: S-15` (intake § S-15 ×3, intake „month template”, S-14 `fixed.astro` `try`, F8, F9) and the condition-triggered ones
(panel title, month-index, `FixedSection compact`, G36) are all included or justified as moot. PRD: FR-011/012/013 numbers unchanged —
`overMinor`, `fixedRisen` rule, `fixedOverview`, `overLimitTrend` untouched; `trendBarHeight` is geometry; removals are PRD-silent and named in `[human]` 5.11.

## Findings

### F1 — `monthsLocative` kept as a "role exception" although it duplicates the kit

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Architectural Fitness
- **Location**: Phase 5 §2 `ROLE_EXCEPTIONS`, decision 12 (vs decision 9)
- **Detail**: `copyExtra.patterns.monthsLocative` equals `Object.values(copy.patternDetail.monthNames)` byte for byte (all 12). The stated reason
  („K30, deliberate „we wrześniu” helper”) is wrong — the „we” is added by `fillMonthLocative`, the table holds plain „wrześniu”. Decision 9 derives
  the nominatives from the same kit object, so keeping the locatives duplicated contradicts the plan's own audit rule.
- **Fix**: Rebind its three readers in P1 (which already touches `fillMonthLocative`, `fixed.astro`, `[...key].astro`), delete the leaf, re-pin
  kit-contract on the kit values, drop it from `ROLE_EXCEPTIONS`, note K30 in the P5 register.
- **Decision**: FIXED — P1 §1 paragraph + files, criterion/Progress 1.3, P5 §2 list, P5 §3 K30 note, decision 12.

### F2 — `/patterns/<key>` `try` contract leaves `readError` const and the template bindings out of scope

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Plan Completeness
- **Location**: Critical Implementation Details („Try blocks that contain `return Astro.redirect`”), Phase 1 §3
- **Detail**: `readError` is `const` and read by the 404 check and two template conditions; the span `detailTarget … sequenceLabel` declares
  `target`, `pattern`, `sumLabel`, `overLabel`, `overCount`, `sequenceSummary` as `const`s the template reads, so a `try` block scopes them away. The
  plan only says "make `pattern` / `detail` `let`" and "set the error"; the 404 check runs before the throw site could set anything.
- **Fix**: `let assemblyError`, `const pageError = readError ?? assemblyError` after the `try`, 404 check moved below it, every template-read
  binding hoisted as `let` with its default.
  - Strength: keeps the existing error branch and redirect/404 paths byte-for-byte; no new component.
  - Tradeoff: ten hoisted `let`s in the frontmatter.
  - Confidence: HIGH — read from the current file.
  - Blind spot: none significant; P1 deliberate break 1.5 proves it.
- **Decision**: FIXED — appended to Critical Implementation Details.

### F3 — `TrendChart` props contradict between P3 §2 and §3; criterion 3.3 cannot pass

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 3 §2, §3, criterion 3.3
- **Detail**: §2 passes booleans `hasZero` / `noThreshold`; §3 declares `zeroNote?` / `noThreshold?` and says the chip "reads `copy.trend.noThreshold`"
  (would make the component import copy, against the "components carry no copy" rule). 3.3's grep `noThreshold\|hint=` over `home.astro` would match
  the new `noThreshold=` prop line.
- **Fix**: page passes the strings conditionally (`zeroNote`, `noThreshold`), `TrendChart` imports no copy; 3.3 greps `h.noThreshold|hint`, the
  `noThreshold:` leaf and `@/content/copy` in `TrendChart`.
- **Decision**: FIXED.

### F4 — Criterion 4.3 greps `compact` in `fixed.astro`, which keeps `FixedRow compact`

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 4 criterion 4.3
- **Detail**: the "empty" grep can never be empty: `<FixedRow … compact />` stays in `fixed.astro` by design.
- **Fix**: grep `compact` only in `FixedSection.astro`.
- **Decision**: FIXED.

### F5 — Phase sizing (P2, P5) fits one fresh agent each

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Lean Execution
- **Location**: Phases 2 and 5
- **Detail**: P2 = one data field + 2 small components + one page rewrite + 3 re-pins / 1 smoke step — each piece small and pinned. P5's heavy part,
  the visual matrix (5.9/5.10), is a `[visual]` row the visual-gate step performs, and `[reviewer]` 5.8 belongs to impl-review (run
  `process.md` rule 6); the implement agent's P5 work is 3 rebinds, one guard case, register rows, sweep, follow-ups file — lighter still after F1
  moved `monthsLocative` into P1. No split or merge.
- **Decision**: RECORDED.

### F6 — Leaf-reader grep keys on generic leaf names

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 5 §4, criterion 5.2
- **Detail**: new leaves `link`, `added`, `delta.increase` share names with unrelated identifiers; a bare-name grep reports a reader that is not one.
- **Fix**: grep the access tail; recorded in `## Known risks`.
- **Decision**: FIXED (Known risks).

### F7 — Smoke anchors `>Podrożały<` / `>Nowe<` were missing from the one-text-node list

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Critical Implementation Details, Phase 2 §5
- **Detail**: P2 smoke asserts both, but the list naming strings that must be a node's only content omitted them; the kit's `<span>` label keeps them
  safe if followed.
- **Fix**: added to the list.
- **Decision**: FIXED.

## Triage summary

Fixed: F1, F2, F3, F4, F6, F7 · Recorded: F5 · Verdict after fixes: REVISE → SOUND. Progress unchanged at 42 rows (1.3 title extended, no row
added or removed). No product decision overturned; `[human]` 5.11 already names every product-visible choice.

VERDICT: PROCEED — approach sound and PRD-neutral; four completeness/consistency warnings fixed in plan.md, no phase resizing needed.
