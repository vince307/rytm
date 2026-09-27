# Handoff — `pattern-threshold-over-limit` (slice S-04)

Written by the `implement phase 2` step (2026-09-27, autonomous run `2026-09-27-s03-s02-s04`). Phase 2 (pure
over-limit rule, threshold input parsing, path helpers) is implemented and committed, both automated criteria
green. The next agent (Phase 3 — keyset read, widened select, thresholds read, view models) must not get this
wrong: `Threshold` / `ThresholdKind` already live in `src/types.ts` (added this phase) — Phase 3's `PatternSource`
widening and `view.ts` must import them from there, never redeclare.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/pattern-threshold-over-limit`, cut from `main` at `a6a8b18` (confirmed with `git branch --show-current` before any edit) |
| Commits on branch | 9, in order: change identity, research, plan, plan review, `feat(...): pattern_thresholds table and its proofs (p1)` (`6e5c08c`), `chore(...): record phase 1 commit sha in progress` (`cb100a0`), `docs(...): phase 1 handoff` (`1d722cb`), `feat(...): over-limit rule, input parsing and path helpers (p2)` (`dac4eff`), `chore(...): record phase 2 commit sha in progress` (`cf01cd3`) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` (unchanged this phase; `updated: 2026-09-27` already current) |
| `## Progress` rows remaining | 42 (`grep -c '^- \[ \]' plan.md`); Phase 2's 7 automated rows (2.1–2.7) are `[x]` with `— dac4eff`; Phase 2's 1 `[reviewer]` row (2.8) left `[ ]` — not this step's to tick; Phase 1's 2 `[reviewer]` rows (1.8, 1.9) also still `[ ]`, carried from before |
| Working tree | clean apart from the maintainer's ` M .gitignore` and `?? .claude/skills/10x-autonomous-run/` (neither staged nor committed) |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `src/lib/patterns/over-limit.ts` | New. `DatedTx`; `appliesTo(threshold, type)`; `monthOf(isoDate)`; `referenceMonth(rows)`; `overLimit(txs, threshold, type) -> { byTx, byMonth }` — per-month grouping, `(occurredOn, BigInt(id))` ascending tie-break, `count`/`sum`/`amount` rules per plan §Phase 2 contract 1, only positive entries recorded |
| `src/lib/patterns/threshold-form.ts` | New. `thresholdSaveSchema` / `thresholdDeleteSchema` (zod, `month` optional `/^\d{4}-(0[1-9]\|1[0-2])$/`); `parseThresholdValue(kind, raw)`; `formatThresholdInput(threshold)`; `thresholdRedirect(key, status, month?)` → `patternHref` |
| `src/lib/patterns/path.ts` | New. `patternHref(key, params?, month?)` (month first in the query string); `keyFromPath(pathname)` (strips `/patterns/`, rejects empty, decodes once, raw-segment fallback on throw) |
| `src/types.ts` | Added `ThresholdKind = "count" \| "sum" \| "amount"` and `interface Threshold { kind; value }`, beside `PatternType` |
| `test/unit/over-limit.test.ts` | New — 14 cases covering plan Phase 2 contract cases 1–11 (US-01 Wolt, month reset, exact-N, sum crossing + strict boundary, fixed amount, id tie-break both orders, kind mismatch, no threshold, determinism/shuffle) plus `appliesTo` / `monthOf` / `referenceMonth` |
| `test/unit/threshold-form.test.ts` | New — 31 cases: `parseThresholdValue` (count/money accept + every reject case named in the plan, NBSP strip), `formatThresholdInput` + round-trip, `thresholdSaveSchema`/`thresholdDeleteSchema`, `thresholdRedirect` (all four statuses + month-first), `patternHref`/`keyFromPath` round-trip (space, diacritics, dot, slash, `%`) + empty/non-matching/throw-fallback |
| `context/changes/pattern-threshold-over-limit/plan.md` | Phase 2 `## Progress` rows 2.1–2.7 → `[x] … — dac4eff` (2.8 `[reviewer]`, untouched) |
| `context/changes/pattern-threshold-over-limit/handoff.md` | This file |

## 3. Verification

Baseline (agent contract, post-S-02 `main` `a6a8b18`): lint 0 · astro check 0 errors (93 files) · vitest 78/78
(5 files) · pgTAP 54 (3 files) · smoke 61 PASS. Phase 1 baseline on this branch: astro check 93 files, vitest 78/78
(5 files), pgTAP 76/76 (4 files), smoke 61 PASS. All commands run and observed in this step, on this branch:

| Command | Result |
| --- | --- |
| `git branch --show-current` | `feat/pattern-threshold-over-limit` — confirmed before any edit |
| `npm test` | 123/123, 7 files (Phase 1 baseline 78/5 files, delta +45 tests / +2 files — both new files) |
| `npm run lint` | 0 errors (delta 0) |
| `npx astro check` | 0 errors, 98 files (Phase 1 baseline 93 files, delta +5 files — 3 lib + 2 test, 0 errors) |
| `npm run fixture:check` | OK |
| `npm run build` | OK (`.vercel/output/` emitted) |
| `npx supabase db reset && npx supabase test db` | PASS — 76/76 (4 files), delta 0 from Phase 1 (this phase touches no DB) |
| `BASE_URL=http://localhost:4398 npm run smoke` | 61 PASS (delta 0); port 4398 killed after, 4321 untouched; sandbox disabled only for the Docker/Supabase/dev-server commands, contract-per rule |

**Deliberate break 1 (2.6 — sum boundary)**: `over-limit.ts` `running > threshold.value` → `running >=
threshold.value` (worktree only, after staging the phase's real files). Ran `npx vitest run
test/unit/over-limit.test.ts`: went red — "sum exactly at the threshold flags nothing (strict boundary)" FAILed
(`byTx.size` 1 instead of 0), 13/14 other cases stayed green. **Meta-check**: the crossing-transaction case ("sum
100,00 zł: the crossing transaction carries the excess…") stayed green under the break, so the red is pinned to
the `>` vs `>=` boundary specifically, not to the crossing arithmetic in general — exactly the risk the plan's
meta-check note called out. Restored via `git checkout -- src/lib/patterns/over-limit.ts` (resets to the staged,
pre-break version); re-ran → 14/14 green, `git diff --cached --stat` unchanged.

**Deliberate break 2 (2.7 — id tie-break)**: `byOccurredThenId`'s `BigInt(a.id)` / `BigInt(b.id)` comparison →
plain string comparison `a.id < b.id` (worktree only). Ran the same file: went red — "same-day tie breaks on
numeric id order, regardless of input order" FAILed (flagged `"9"` instead of `"10"`, since the string comparison
`"10" < "9"` is true), 13/14 other cases stayed green. **Meta-check**: every other case uses single-digit or
distinct-date ids where string and numeric order agree, so only this two-digit same-day case can distinguish the
two comparators — proving the numeric-id requirement is actually exercised, not merely present. Restored via `git
checkout -- src/lib/patterns/over-limit.ts`; re-ran with `test/unit/threshold-form.test.ts` too → 45/45 green,
`git diff --cached --stat` unchanged.

Both breaks were edited into the worktree only *after* `git add` staged the phase's real files, so each `git
checkout --` restore returned the file to exactly the staged (correct) version — confirmed by `git diff --cached
--stat` showing the same file-level insertion counts before and after each break/restore cycle.

## 4. Next command

`/10x-implement pattern-threshold-over-limit phase 3`

## 5. Open

- **Manual-only Progress rows, not ticked here** (leave for `/10x-impl-review`): `[reviewer]` 2.8 (each oracle
  case in `test/unit/over-limit.test.ts` traceable to PRD Business Logic „Wynik” / US-01 Wolt or an Autonomous
  decision — see this handoff's §2 mapping and plan.md `## Autonomous decisions` 1, 3, 17, 18; none copies the
  prototype's hard-coded `.seq.over` marks, since `design/rytm-os/prototype/app.js` was never read by the test
  file); carried from Phase 1: 1.8, 1.9 (policy shape / pgTAP assertion mapping, `pattern_thresholds` migration
  and test file).
- **Carried from plan-review, unchanged**: `[human]` Progress 6.12 (product owner confirms Autonomous decisions 1
  — excess-part-only over amount for `sum`/`amount` — and 2 — reference month = latest month in data — against
  the PRD's literal wording); this phase's `overLimit` and `referenceMonth` are exactly the functions decision
  6.12 would revert if answered otherwise. Known risks in `plan.md` (`Astro.url.pathname` decoding, double-decode
  of a literal `%XX` escape, unbounded threshold rows via `loadThresholds` unpaged, normalizer drift) — none
  triggered by Phase 2 (no DB, no route yet); `keyFromPath`'s throw-fallback is now covered by a unit case
  (`"/patterns/%"` → `"%"`) but the Astro-runtime decode behaviour itself is still unverified end-to-end until
  Phase 4's smoke step.
- **No DESIGN-GAPs added this phase** — plan decision 22 places K21 / G31 with the code in Phases 4–6, not here;
  Phase 2 has no rendered strings.
- **Next symbol to build**: `src/lib/patterns/load.ts` `collectPages` (rewrite: keyset via `.gt("id", afterId)`,
  drop `count: "exact"`, `MAX_PAGES` cap) and `loadPatterns` (widen select to add `occurred_on`, return `{
  patterns, rows }`); `src/lib/patterns/thresholds.ts` `loadThresholds` (new); `src/lib/patterns/view.ts`
  `listOverview` / `patternDetail` (new, consumes `overLimit` / `appliesTo` / `referenceMonth` from this phase);
  `src/pages/patterns.astro` call-site update; oracle in `test/unit/patterns.test.ts` (rewrite the `collectPages`
  block) and `test/unit/pattern-view.test.ts` (new) — plan Phase 3.

## 6. Autonomous decisions

1. **Implemented Phase 2 directly in this context rather than delegating to a subagent.** Chosen: write the three
   pure modules and their two test files myself. Rejected: delegate-to-subagent (the skill's default
   recommendation). Why: the phase is entirely pure functions with no DB/UI surface — reading the plan's exact
   per-case contract (11 over-limit cases, ~15 parsing cases) once and writing directly against it was cheaper
   and safer than a round-trip summary that could blur a boundary condition (the whole point of Phase 2 is
   boundary correctness). Would change: a later phase large enough, or touching enough unfamiliar surface, that
   keeping it in-context risks the session's budget or invites drift a subagent's isolation would catch sooner.
2. **Never called `AskUserQuestion`** for the skill's execution-mode prompt, manual-verification gate, dirty-path
   prompt (none arose — the tree was exactly the planned set plus the two maintainer paths) or commit-message
   approval. Chosen: decide and proceed per the step rules; recorded here instead. Why: the step's rules override
   the skill's interactive defaults for this run. Would change: a maintainer message reinstating interactive
   gates for this run.
3. **Split the phase into two commits** (`dac4eff` feat, then `cf01cd3` chore appending the commit's own SHA to
   the Progress rows it just created), mirroring Phase 1's Autonomous decision 3. Chosen: two commits. Rejected:
   leaving the SHA-suffix edit uncommitted (would violate the "clean tree apart from the two maintainer paths"
   hand-off contract), and `--amend` (forbidden by the agent contract). Why: same chicken-and-egg the SHA can only
   be known after the commit exists. Would change: a revised skill/contract that defers all SHA-writing to the
   epilogue or accepts a dirty `plan.md` between phases.
4. **Fixed an accidental literal NBSP character in `threshold-form.ts`'s whitespace-strip regex** (introduced by
   the file-write step, flagged by `eslint`'s `no-irregular-whitespace` on first `npm run lint`) by simplifying
   `/[\s ]/` to plain `/\s/` with a comment noting `\s` already matches NBSP per the JS spec — rather than
   re-inserting an escaped ` ` that risked the same silent literal-character substitution. Chosen: the
   simpler, provably-equivalent regex. Rejected: re-typing the escape sequence a second time. Why: `\s` matching
   NBSP is a documented ECMA-262 fact, not an assumption; the unit test `"1 000"` (an explicit escape in a
   test file, unaffected by the same issue) still asserts the behaviour. Would change: nothing — this is settled
   by the spec, not a judgment call.
5. **Left plan.md's `[reviewer]` row 2.8 unticked**, per the step's explicit instruction that rows tagged
   `[reviewer]`/`[visual]`/`[human]` are never mine to check. Would change: nothing — hard rule from the step
   prompt, not a judgment call.

ARTIFACT GAP: none — `agent-contract.md`, `handoff.md` (prior, Phase 1), `plan.md`, `reviews/plan-review.md`,
`change.md` and every file the plan's Phase 2 section names (`src/types.ts`, existing `src/lib/patterns/*`,
`test/unit/patterns.test.ts`, `src/lib/format.ts`, `src/lib/import/schema.ts` for zod-style precedent) were
present and readable.
