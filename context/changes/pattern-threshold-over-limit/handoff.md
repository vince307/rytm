# Handoff — `pattern-threshold-over-limit` (slice S-04)

Written by the `implement phase 3` step (2026-09-27, autonomous run `2026-09-27-s03-s02-s04`). Phase 3 (keyset
read, widened select, thresholds read, view models) is implemented and committed, both automated criteria green.
The next agent (Phase 4 — pattern detail view, read-only) must not get this wrong: `loadPatterns` now returns
`{ patterns, rows }` (not just `patterns`) — the detail route needs both `rows` (to build the pattern's own
`DatedTx`/transactions via `view.ts`'s `patternDetail`) and the thresholds map from the new `loadThresholds`
(`src/lib/patterns/thresholds.ts`). `patternDetail`'s `referenceMonth` parameter is **not** recomputed by the
route — it must be the same value `listOverview` (or a bare `referenceMonth(rows)` call from `over-limit.ts`)
produces from the identical `rows`, so the list and every detail request agree on "the" current month.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/pattern-threshold-over-limit`, cut from `main` at `a6a8b18` (confirmed with `git branch --show-current` before any edit) |
| Commits on branch | 11, in order: change identity, research, plan, plan review, `feat(...): pattern_thresholds table and its proofs (p1)` (`6e5c08c`), `chore(...): record phase 1 commit sha` (`cb100a0`), `docs(...): phase 1 handoff` (`1d722cb`), `feat(...): over-limit rule, input parsing and path helpers (p2)` (`dac4eff`), `chore(...): record phase 2 commit sha` (`cf01cd3`), `docs(...): phase 2 handoff` (`775c5b0`), `feat(...): keyset read, widened select, thresholds read and view models (p3)` (`3e45b8c`), `chore(...): record phase 3 commit sha in progress` (`609bff4`) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` (unchanged this phase) |
| `## Progress` rows remaining | 36 (`grep -c '^- \[ \]' plan.md`); Phase 3's 6 automated rows (3.1–3.6) are `[x]` with `— 3e45b8c`; Phase 3's 1 `[reviewer]` row (3.7) left `[ ]` — not this step's to tick; carried unticked from before: 1.8, 1.9, 2.8 (`[reviewer]`) |
| Working tree | clean apart from the maintainer's ` M .gitignore` and `?? .claude/skills/10x-autonomous-run/` (neither staged nor committed) |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `src/lib/patterns/load.ts` | Rewritten. `collectPages<T extends { id: number }>(fetchPage: (afterId: number \| null) => Promise<{ rows: T[]; error: unknown }>)` — keyset (`afterId` = previous page's last row's numeric `id`), no `count` query, stops on the first empty page (a short page is not the end), bounded by new export `MAX_PAGES = 1000`. `loadPatterns` selects `id, amount_minor, counterparty, title, occurred_on`, `.order("id").limit(PAGE_SIZE)` + `.gt("id", afterId)` after the first page; returns `{ patterns, rows }` where `rows: PatternSource[]` |
| `src/types.ts` | `PatternSource` gains `occurredOn: string` |
| `src/lib/patterns/over-limit.ts` | `byOccurredThenId` (the `(occurredOn, numeric id)` comparator) is now exported — `view.ts` reuses it so the sequence marks and the over-limit computation always agree on transaction order; no behaviour change |
| `src/lib/patterns/thresholds.ts` | New. `loadThresholds(supabase) -> { thresholds: Map<string, Threshold> } \| { error }` — `select merchant_key, kind, value`, no paging (comment explains why); rows with an unreadable `kind` are skipped (unreachable given the DB check constraint) |
| `src/lib/patterns/view.ts` | New. `listOverview(patterns, rows, thresholds) -> { referenceMonth, items: { key, threshold, overMinor }[] }` and `patternDetail(pattern, rows, threshold, refMonth, requestedMonth?) -> { months, month, threshold, sumMinor, count, overMinor, sequence, transactions }` — both pure, consume `appliesTo`/`overLimit`/`referenceMonth`/`byOccurredThenId`/`monthOf` from `over-limit.ts` |
| `src/pages/patterns.astro` | **Unchanged** — `loadPatterns`'s new `rows` field is additive; the existing `"patterns" in result` / `result.patterns.map(...)` call site already works against the new return shape, so no edit was needed (verified by reading the file; not a no-op left unverified) |
| `test/unit/patterns.test.ts` | Rewrote the `collectPages` describe block for keyset semantics (capped server carrying the last id in `calls`, later-page error, empty-list-one-call, mid-read row deletion not failing, `MAX_PAGES` exhaustion); `fixtureSources()` now supplies `occurredOn` |
| `test/unit/pattern-view.test.ts` | New — 10 cases: `listOverview` (reference month across patterns, applicable threshold + its over-limit sum, mismatched-kind threshold → null/0, no stored threshold → null/0, no rows → null + all-zero); `patternDetail` (default-to-reference-month with descending `months`, `sequence` chronological vs `transactions` newest-first, requested-month-not-present falls back, reference month with zero occurrences still defaults there, requested month that *is* present is honoured, mismatched threshold renders as none, counterparty/title carried through) |
| `context/changes/pattern-threshold-over-limit/plan.md` | Phase 3 `## Progress` rows 3.1–3.6 → `[x] … — 3e45b8c` (3.7 `[reviewer]`, untouched) |
| `context/changes/pattern-threshold-over-limit/handoff.md` | This file |

## 3. Verification

Baseline (agent contract, post-S-02 `main` `a6a8b18`): lint 0 · astro check 0 errors (93 files) · vitest 78/78
(5 files) · pgTAP 54 (3 files) · smoke 61 PASS. Phase 2 baseline on this branch: astro check 98 files, vitest
123/123 (7 files), pgTAP 76/76 (4 files), smoke 61 PASS. All commands run and observed in this step, on this
branch:

| Command | Result |
| --- | --- |
| `git branch --show-current` | `feat/pattern-threshold-over-limit` — confirmed before any edit |
| `npm run lint` | 0 errors (delta 0) |
| `npx astro check` | 0 errors, 101 files (Phase 2 baseline 98 files, delta +3 files — `thresholds.ts`, `view.ts`, `pattern-view.test.ts`) |
| `npm test` | 137/137, 8 files (Phase 2 baseline 123/7 files, delta +14 tests / +1 file — all in the rewritten `collectPages` block and the new `pattern-view.test.ts`) |
| `npm run fixture:check` | OK |
| `npm run build` | OK (`.vercel/output/` emitted) |
| `npx supabase db reset && npx supabase test db` | PASS — 76/76 (4 files), delta 0 from Phase 2 (this phase touches no migration) |
| `BASE_URL=http://localhost:4398 npm run smoke` | 61 PASS (delta 0) — proves `/patterns` still reads through keyset paging against a real PostgREST; port 4398 killed after, 4321 untouched; sandbox disabled only for the Docker/Supabase/dev-server commands, per contract |

**Deliberate break (3.6 — keyset vs. offset)**: staged the phase's real files first (`git add`), then in the
worktree only replaced `collectPages`'s keyset advance (`afterId = <last row's id>`) with offset arithmetic
(`fetchPage(rows.length === 0 ? null : rows.length)`, ignoring the real id). Ran `npx vitest run
test/unit/patterns.test.ts`: went red — "does not fail when a row is deleted between pages — the gap is skipped,
not duplicated or missed" FAILed (row `{id:5}` returned twice: offset `4` after two 2-row pages coincides with a
real id in the `[1,2,4,5]` fixture's gap, so the fake keyset-style server re-serves `5`), 38/39 other cases stayed
green. **Meta-check**: re-ran only "reads every row when the server caps pages below the requested size" (the
no-gap capped-server case) in isolation under the same break — it stayed green, because for a gap-free id
sequence starting at 1, `rows.length` (offset) and the true last id are numerically identical at every page
boundary, so offset and keyset arithmetic are indistinguishable without a gap. This is exactly the risk the
plan's meta-check note called out: only the mid-read-delete case can tell the two schemes apart. Restored via
`git checkout -- src/lib/patterns/load.ts` (resets to the staged, pre-break version); re-ran full `npm test` →
137/137 green, `git diff --cached --stat` unchanged (confirmed identical insertion/deletion counts before and
after the break/restore cycle), then re-ran `npm run lint` clean.

## 4. Next command

`/10x-implement pattern-threshold-over-limit phase 4`

## 5. Open

- **Manual-only Progress rows, not ticked here** (leave for `/10x-impl-review`): `[reviewer]` 3.7 (no
  `count: "exact"` remains in `load.ts`; the loop is bounded by `MAX_PAGES`; `/patterns` markup is byte-identical
  in intent — verified true in this step: the call site file has zero diff); carried from earlier phases: 1.8,
  1.9 (Phase 1 policy/pgTAP mapping), 2.8 (Phase 2 oracle-case traceability).
- **Carried from plan-review, unchanged**: `[human]` Progress 6.12 (product owner confirms Autonomous decisions 1
  and 2 against the PRD's literal wording) — this phase's `listOverview`/`patternDetail` are the view-model layer
  that decision 6.12 would revert if answered otherwise, but they call `appliesTo`/`overLimit`/`referenceMonth`
  unchanged from Phase 2, so nothing new is at risk here beyond what Phase 2's handoff already flagged. Known
  risks in `plan.md` (`Astro.url.pathname` decoding, double-decode of a literal `%XX` escape, unbounded threshold
  rows via `loadThresholds` unpaged, normalizer drift) — none triggered by Phase 3 (no route yet, no DB write);
  `loadThresholds`'s no-paging choice is exactly the F4 plan-review finding, accepted as a Known risk, unchanged.
- **No DESIGN-GAPs added this phase** — plan decision 22 places K21 / G31 with the code in Phases 4–6; Phase 3 has
  no rendered strings (view.ts and thresholds.ts are pure/read-only, no copy).
- **Next symbol to build (Phase 4)**: `src/pages/patterns/[...key].astro` (new route) using `keyFromPath`
  (`src/lib/patterns/path.ts`, from Phase 2), `loadPatterns` + `loadThresholds` via `Promise.all`, `patternDetail`
  (this phase); shared components `BackLink.astro`, `SequenceMark.astro`, `field-styles.ts`, `MonthSelect.tsx`
  (all new); `Badge` gains the `excess` tone; `format.ts` gains `formatMonthShort`/`formatIsoDate`; `copy.ts` /
  `design-kit.md` gain K21/G31 rows; `scripts/smoke.mjs` gains 4 steps — plan Phase 4.

## 6. Autonomous decisions

1. **Implemented Phase 3 directly in this context rather than delegating to a subagent.** Chosen: write
   `load.ts`'s rewrite, the two new pure-read modules and `view.ts` myself, plus both test files. Rejected:
   delegate-to-subagent. Why: same reasoning as Phase 2 (Autonomous decision 1) — no DB write, no UI, and the
   view-model contract (which fields come from which of `pattern`/`rows`/`threshold`/`refMonth`) is easy to blur
   across a round-trip summary but cheap to get right by reading the plan's exact contract once and writing
   directly against it. Would change: a later phase large enough, or touching enough unfamiliar UI surface, that
   in-context risks the session's budget.
2. **Never called `AskUserQuestion`.** Chosen: decide and proceed per the step rules; recorded here instead. Why:
   the step's rules override the skill's interactive defaults for this run. Would change: a maintainer message
   reinstating interactive gates for this run.
3. **Split the phase into two commits** (`3e45b8c` feat, then `609bff4` chore appending the commit's own SHA),
   mirroring Phases 1–2 (Autonomous decision 3 both times). Chosen: two commits. Rejected: leaving the SHA-suffix
   edit uncommitted (violates the "clean apart from the two maintainer paths" contract), `--amend` (forbidden).
   Why: the SHA can only be known after the commit exists. Would change: a revised skill/contract deferring all
   SHA-writing to the epilogue, or accepting a dirty `plan.md` between phases.
4. **Left `src/pages/patterns.astro` untouched** rather than adding a cosmetic destructure of `patterns` from the
   new `{ patterns, rows }` return shape. Chosen: no edit — `"patterns" in result` and `result.patterns.map(...)`
   already type-check and behave identically against the widened return type (the new `rows` field is additive
   and simply unused by this page). Rejected: rewriting the same two lines as `const { patterns } = result` for
   no behavioural difference, which would only add diff noise against the plan's own "no visible change" framing
   for this phase. Verified, not assumed: read the file, confirmed `astro check` (0 errors) and the full smoke
   suite (61 PASS, delta 0) exercise this exact call site against the new shape. Would change: a reviewer finding
   the field-access style inconsistent with the rest of the codebase (none of the sibling loaders currently
   destructure this way either, so no such inconsistency was found).
5. **Exported `byOccurredThenId` from `over-limit.ts` instead of re-implementing the `(occurredOn, numeric id)`
   tie-break inside `view.ts`.** Chosen: reuse. Rejected: a second, separately-hand-written comparator in
   `view.ts` (the plan's own "Critical Implementation Details — Chronology" note treats this exact tie-break as
   load-bearing and easy to get wrong twice, e.g. re-introducing a string comparison). Why: Phase 2's unit oracle
   (cases 7, and the Phase 2 deliberate break 2.7) already proves this comparator's numeric-id behaviour;
   duplicating it would need its own proof or silently rely on Phase 2's. Would change: a future phase needing a
   different tie-break for a different purpose (none identified).
6. **`patternDetail` takes `refMonth` as a parameter rather than recomputing `referenceMonth(rows)` internally.**
   Chosen: caller supplies it (as the plan's prose states: "`referenceMonth` is the value `listOverview` already
   computed for the same read"). Rejected: recomputing inside `patternDetail` (cheap, but then a detail route that
   passes a stale or differently-filtered `rows` slice could silently disagree with the list on which month is
   "the" current one). Why: correctness of "the list and every detail request agree" is a single-source-of-truth
   property, not a performance one — recomputation would hide a caller bug instead of surfacing it. Would change:
   a future requirement for a detail page to compute its own, pattern-local reference month (out of scope per
   Autonomous decision 2, "one global reference month").
7. **Left `plan.md` row 3.7 `[reviewer]` unticked**, per the step's explicit instruction that rows tagged
   `[reviewer]`/`[visual]`/`[human]` are never mine to check. Would change: nothing — hard rule from the step
   prompt, not a judgment call.

ARTIFACT GAP: none — `agent-contract.md`, `handoff.md` (prior, Phase 2), `plan.md`, `reviews/plan-review.md`,
`change.md` and every file the plan's Phase 3 section names (`src/lib/patterns/load.ts`, `src/types.ts`,
`src/pages/patterns.astro`, `test/unit/patterns.test.ts`, plus Phase 2's `over-limit.ts` for the comparator reuse)
were present and readable.
