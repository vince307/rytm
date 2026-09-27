<!-- PLAN-REVIEW-REPORT -->
# Plan Review: Próg na wzorcu i „ponad próg” (S-04 `pattern-threshold-over-limit`)

- **Plan**: `context/changes/pattern-threshold-over-limit/plan.md`
- **Mode**: Deep
- **Date**: 2026-09-27
- **Verdict**: SOUND (after triage; REVISE-level items were fixed in the plan)
- **Findings**: 0 critical · 1 warning · 4 observations
- **Reviewer**: plan-review step of autonomous run `2026-09-27-s03-s02-s04` (no human; triage decided by the agent)

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| End-State Alignment | PASS |
| Lean Execution | PASS |
| Architectural Fitness | PASS |
| Blind Spots | WARNING (F1, fixed; F2, F4 recorded) |
| Plan Completeness | PASS (F3 wording fixed) |

## Grounding

Grounding: 7/7 paths ✓ (`src/lib/patterns/load.ts`, `derive.ts`, `merchant.ts`, `src/pages/patterns.astro`,
`src/components/patterns/PatternsTable.tsx`, `src/pages/api/imports/delete.ts`, `scripts/smoke.mjs`; new paths free,
migration `20260927200000_*` sorts after `20260924224014_import_ing_statement.sql`), 14/14 symbols ✓
(`collectPages`, `loadPatterns` with `count: "exact"` + `.range()` + `id, amount_minor, counterparty, title`,
`d5Type` one occurrence → `fixed`, `buttonVariants` `text`/`inline`, `SubmitButton` `pending`/`pendingText`/`showArrow`,
`copyExtra.auth.saving`, `copyExtra.howItWorks.sequenceOver`, `plural`, `formatMoney` (plain space, so `>5,50 zł<`
matches), `Glyph` `arrow`/`arrow-left`, content.json `threshold.*` 7 keys / `patternDetail.*` 4 keys /
`components.success` / `dashboard.stats[0].label`, `PROTECTED_ROUTES` prefix match, `delete_own_account` deletes only
`auth.users`, K20/G30 highest → K21/G31 free), brief↔plan ✓ (brief smoke total updated with F1).
Progress↔Phase: 6 phases ↔ 6 Progress sections; success-criteria bullets map 1:1 (P1 7+2, P2 7+1, P3 6+1, P4 8+2,
P5 8+2, P6 7+5 = 56 rows); no checkboxes inside phase blocks. No `lessons.md`, no `contract-surfaces.md`.

### Checks the orchestrator asked for

- **Migration vs existing migrations + CLAUDE.md**: policy naming `"<table>: authenticated <op> own"`, `to
  authenticated`, `(select auth.uid()) = user_id` match `20260923165530_domain_imports_transactions.sql`; four
  per-operation policies, UPDATE with `using` + `with check` (pgTAP 17 proves the `with check`); `user_id` FK `on delete
  cascade` (pgTAP 20 as `postgres`, break 1.6); no `import_id` (pgTAP 19 proves US-02 survival). Grants follow the
  repo precedent (no explicit table grants anywhere; `revoke all from anon`; `revoke truncate, trigger, references,
  maintain from authenticated`) and correctly do **not** copy `revoke update` from
  `20260924122144_transactions_import_account_fk.sql`. Break 1.5 is sound: Postgres raises (not skips) on `ON CONFLICT
  DO UPDATE` when no UPDATE policy admits the existing row.
- **Smoke runner**: `request()` uses `redirect: "manual"`, always sends `Origin: BASE_URL` (so `checkOrigin` passes),
  reads bodies only on 200 (plan's 404 step correctly asserts status only), checks `status` / `location` prefix /
  `contains` / `notContains`. There is **no anonymous flag** — one shared cookie jar — so anonymous steps only work
  after „signout clears session”; the plan places them beside „import without a session goes to login”, which is
  after signout ✓. `/api/patterns/*` is not in `PROTECTED_ROUTES`, so the endpoints' own `getUser` guard must redirect
  (plan says „guard as `delete.ts`” ✓).
- **Kit views**: all kit copy keys the plan cites exist; K21 / G31 split is consistent with `design-kit.md`.
- **Route encoding of `merchantKey`**: verified in `node_modules/astro` 7.3.2 — see F2. Spaces, diacritics and `/`
  (`%2F`) work with the plan's `Astro.url.pathname` + `decodeURIComponent` approach; `Astro.params` would have been
  wrong for `/`. Only literal `%XX` escapes double-decode.
- **Phase size / independence**: each phase is additive and green on its own (P3 changes `/patterns` only at the call
  site; P4 renders a placeholder note until P5). P4 is the largest (route + 4 small shared components + copy + gap
  rows + 4 smoke steps), estimated well under 200k tokens for a fresh agent. No split / merge.

## Findings

### F1 — FR-010 „zmienić” (upsert conflict path) never proven through PostgREST

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 5 — §6 Smoke
- **Detail**: The app changes a threshold with supabase-js `.upsert(…, { onConflict: "user_id,merchant_key" })`
  without sending `user_id` (column default `auth.uid()`). pgTAP 5–6 prove the hand-written SQL `insert … on conflict
  … do update`, not what PostgREST builds from the request; the smoke saved a threshold only once, so the conflict /
  update path — the „zmienić” in FR-010 — was never exercised end-to-end.
- **Fix**: Phase 5 smoke saves `30` first, then a new step 2a „threshold is changed” saves `40`; the later `>5,50 zł<`
  assertions (detail and Phase 6 list) would read `>15,50 zł<` if the row were not updated in place. Counts updated:
  Phase 5 65 + 9 = 74, Phase 6 74 + 3 = 77 (+16 over baseline 61); Desired End State, Testing Strategy, Progress 5.5 /
  6.5 and `plan-brief.md` updated.
- **Decision**: FIXED (applied to plan.md)

### F2 — Pathname decoding is known, not hypothetical

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Critical Implementation Details (key from the raw path); Known risks
- **Detail**: Astro 7.3.2 `core/util/pathname.js` `validateAndDecodePathname` runs `decodeURI` until stable (≤ 10
  times) before routing, and `core/fetch/fetch-state.js` writes the result back through the URL setter, which
  re-encodes spaces / non-ASCII. So `Astro.url.pathname` is `…/kawiarnia%20smoke` (Phase 4 break 4.6 will go red, as
  planned), `%2F` survives, a bare `%` falls back correctly, and only a key containing a literal `%XX` escape is
  double-decoded. The plan's approach is right; its wording treated pre-decoding as a possibility.
- **Fix**: Critical Implementation Details gained the verified behaviour; Known risks „Double decode” rewritten with
  the concrete mechanism.
- **Decision**: FIXED (documentation only)

### F3 — `Threshold` type location ambiguous between Phase 2 and Phase 3

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 3 — §2 Types
- **Detail**: Phase 2 says `Threshold` / `ThresholdKind` are exported from `src/types.ts`; Phase 3 said „moved here
  from Phase 2 if Phase 2 declared them locally”, inviting a local declaration.
- **Fix**: Phase 3 now states they live in `src/types.ts` since Phase 2, never locally.
- **Decision**: FIXED

### F4 — Crafted POSTs can store unbounded thresholds; `loadThresholds` does not page

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 3 §3 `loadThresholds`; Phase 5 §1 save endpoint (decision 7)
- **Detail**: The save endpoint does not check that `key` is one of the caller's patterns, so a user can POST
  thresholds for arbitrary keys; past PostgREST `max_rows` the unpaged read silently drops rows. RLS keeps it
  self-inflicted; no cross-user impact.
- **Fix**: recorded under plan `## Known risks` (keyset paging in `loadThresholds` if ever observed).
- **Decision**: ACCEPTED (Known risk)

### F5 — Product decisions checked against the PRD: upheld

- **Severity**: 💡 OBSERVATION
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: End-State Alignment
- **Location**: Autonomous decisions 1, 2, 3; Progress 6.12 `[human]`
- **Detail**:
  - *Over amount* (decision 1): PRD Business Logic „Wynik” defines „nadwyżka” per kind explicitly („suma miesiąca
    minus próg”, „kwota wystąpienia minus akceptowana kwota, gdy dodatnia”). US-01 AC „suma kwot transakcji
    oznaczonych” is compatible if „kwota” means the flagged over amount, and is identical for the count example it
    illustrates (Wolt). The plan's reading is not clearly wrong → not overturned.
  - *„w tym miesiącu”* (decision 2): PRD „Gdzie użytkownik spotyka regułę” says „w bieżącym miesiącu oraz … w
    poprzednich miesiącach”; US-05 „niepełny bieżący miesiąc” hints at the calendar month but the product imports
    historical CSVs — the wall-clock month would be empty for the fixture (ends 2026-08) and clock-dependent against
    the determinism guardrail. Latest data month is the defensible reading → not overturned.
  - *Type flip* (decision 3): PRD silent; keep-row-apply-if-matching keeps reads side-effect free → upheld.
  - Progress 6.12 `[human]` names decisions 1 and 2 explicitly ✓; plan decision 24 records this review.
- **Fix**: none beyond decision 24 in the plan.
- **Decision**: ACCEPTED (product owner confirms via 6.12)

## Triage summary

| Decision | Findings |
|---|---|
| Fixed | F1, F2, F3 |
| Accepted | F4, F5 |
| Skipped / Dismissed | — |

Verdict after fixes: SOUND. Six phases kept; `## Progress` unchanged in shape (56 rows; 5.5 and 6.5 re-counted).

## Autonomous decisions (this step)

- **Did not overturn decision 1 (excess part).** Rejected: switching to full flagged amounts per US-01 AC. Why:
  Business Logic is the specific definition and the AC is readable consistently with it. Would change: the product
  owner declaring US-01 AC normative (6.12).
- **Did not overturn decision 2 (latest data month).** Rejected: wall-clock month. Why: empty for historical imports,
  non-deterministic. Would change: product owner choosing the calendar month, or regular monthly imports.
- **Added one smoke step instead of a pgTAP assertion for F1.** Rejected: more pgTAP (does not exercise PostgREST's
  upsert). Why: the gap is the HTTP/PostgREST layer. Would change: a smoke-runtime budget limit.
- **Kept six phases.** Rejected: splitting Phase 4. Why: each phase is additive, independently green and sized for
  one fresh session. Would change: an implementer hitting context limits in Phase 4 (then split shared components
  out as 4a).
- **No `AskUserQuestion`** (agent contract rule 1); triage decided here and recorded.

VERDICT: PROCEED — approach sound and verified against code and PRD; one smoke gap (FR-010 change path) fixed in the plan, remaining items recorded as known risks.
