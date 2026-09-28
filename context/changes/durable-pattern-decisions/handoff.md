# Handoff — `durable-pattern-decisions` (slice S-05)

Written by the `implement` step, Phase 2 (2026-09-28, autonomous run `2026-09-28-s05-s06-s07`). Phase 2 (decisions in
derivation and view models) is fully green and committed; `derivePatterns` and the view helpers now honour decisions,
but **no caller passes any decisions yet** (`loadPatterns` still calls `derivePatterns(rows)` with the default empty
map), so the app is behaviourally unchanged. What the next agent must not get wrong: `resolveKey` in
`src/lib/patterns/derive.ts` is keyed on the **raw** (un-merged) merchant key — `derivePatterns` resolves each row's
own key through it *before* grouping, and only the **resolved root's** decision is read; do not read a decision by
any other key, and do not apply a decision after grouping (Phase 3's `loadPatternData` / `detailTarget` must resolve
the *same* way, via `resolveKey`, not a fresh ad-hoc lookup).

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/durable-pattern-decisions` (confirmed with `git branch --show-current`), cut from `main` at `f252112` |
| Commits on branch | 9 — change identity, research, plan, plan review, Phase 1 (`1e2ea9b` + sha-record `272232b`), Phase 1 handoff (`17e3137`), **Phase 2 `feat(durable-pattern-decisions): decisions in derivation and view models (p2)` (`c2b63b4`)**, **`docs(durable-pattern-decisions): record phase 2 commit sha in Progress` (`a89ce59`)** |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` (unchanged — only flips once, at Phase 1 entry) |
| `## Progress` rows remaining | 49 pending (`grep -c '^- \[ \]' plan.md`); Phase 2's own `2.9` `[reviewer]` still `[ ]` (not mine) |
| Working tree | Clean after the two commits |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `src/types.ts` | New `PatternDecision` interface (`mergedInto`, `excluded`, `pinnedType`, `displayName`); `MerchantPattern` gains `excluded: boolean` and `merged: { key: string; name: string }[]`; `PatternListItem` now also omits `merged` (detail-only) |
| `src/lib/patterns/derive.ts` | New `resolveKey(key, decisions)` — follows `mergedInto` to its root, a cycle resolves to the code-point-smallest member on it, deterministic from any entry point (direct, chain, or a tail leading into the cycle). `derivePatterns(rows, decisions = new Map())` — two passes: (1) group by each row's own raw key exactly as before S-05 (`byRawKey`, needed for `merged[].name`); (2) union each raw key's rows/variants into its **resolved root's** group. Per group: `type = decision?.pinnedType ?? d5Type(amounts)`, `name = decision?.displayName ?? topVariant(...)`, `excluded = decision?.excluded ?? false`, `merged` = other member raw keys (sorted by key) with their own top variant name. An absorbed key's own decision fields are never read (only `byRawKey`'s rows/variants are reused for `merged[].name`) |
| `src/lib/patterns/view.ts` | `listOverview`: an excluded pattern's early return now also fires on `pattern.excluded` — keeps the applicable `threshold`, `overMinor` forced to 0. `patternDetail`: `overLimit(txs, pattern.excluded ? null : applicable, pattern.type)` — `threshold` in the return still equals `applicable` (kept), but `overMinor`/`sequence`/every transaction's `overMinor` come out 0 via `overLimit`'s existing null-threshold path (no new logic needed there) |
| `src/pages/patterns.astro` | The hand-built `PatternListItem` literal (`overviewByKey` re-merge, removed in Phase 3) gains `excluded: p.excluded` — required now that `PatternListItem` needs it; no other change (plan review F2) |
| `test/unit/pattern-decisions.test.ts` | New. `resolveKey`: unknown key, direct merge, chain a→b→c, 2-cycle, 3-cycle, cycle entered from a tail — all assert the algebraic result, not just "doesn't crash". `derivePatterns`: pinned type overrides D5 both ways (`fixedAmountMinor` set to the median even out of tolerance); a display-name override beats the most-frequent variant (proven via same-key different-case variants `"FOO"`/`"Foo"`); an absorbed key's own `excluded`/`pinnedType`/`displayName` are ignored (root's own decision — or its absence — wins); a US-03 date-split case (early rows only vs. early+later) where the later rows of an absorbed raw merchant join the merged group and the pinned type/name/exclusion hold although D5 over all rows would say `frequent` |
| `test/unit/patterns.test.ts` | New `describe("derivePatterns — F-02 oracle with the fixture decisions (S-05)")`: a new `oracleGroups()` helper (unlike `expectedGroups()`, does **not** split `user-merge` back apart) — decisions `sportowo.pl → sportowo` (grounded via `merchantKey(rawMerchant)` off the fixture's own `expected.rows[].rawMerchant`, never a hardcoded slug) and `excluded` on the real key of the `przelew-konto-osobiste` group. Partition equals the oracle's 30 groups; the merged pattern's occurrence/sum match both the oracle and the sum of its two undecided components; `merged` lists `sportowo.pl`; the excluded group is marked `excluded: true`; every other group is unaffected; determinism under a shuffle |
| `test/unit/pattern-view.test.ts` | Existing `wolt`/`kawiarnia`/`sklep` literals gain `excluded: false, merged: []`. New cases: `listOverview` — an excluded twin of `wolt` keeps its threshold but `overMinor` 0 while `wolt` itself stays > 0; `patternDetail` — an excluded twin keeps `threshold`, `overMinor` 0, all-`false` `sequence`, every transaction `overMinor` 0 |
| `context/changes/durable-pattern-decisions/plan.md` | Phase 2 `## Progress` rows `2.1`–`2.8` ticked `[x]` with ` — c2b63b4` suffix and the observed numbers/meta-checks recorded inline; `2.9` left `[ ]` for `/10x-impl-review` |
| `context/changes/durable-pattern-decisions/handoff.md` | This file |

## 3. Verification

Baseline for this phase (measured on this branch before Phase 2, i.e. Phase 1's own result): lint 0 · astro check 0
errors (109 files) · fixture:check OK · vitest 141 (8 files) · build OK · pgTAP 102 (5 files) · smoke 77 PASS.

| Command / check | Result |
| --- | --- |
| `git branch --show-current` | `feat/durable-pattern-decisions` |
| `npm run lint` | 0 errors (delta 0) |
| `npx astro check` | 0 errors, **110** files (delta +1 — the new test file; `tsconfig.json` includes `**/*`) |
| `npm run fixture:check` | OK |
| `npm test` | **158** passed, **9** files (baseline 141/8 + 17 new cases in +1 new file, delta +17/+1) |
| `npm run build` | passes |
| `npx supabase db reset && npx supabase test db` | pgTAP 102 (5 files), all pass (delta 0 — Phase 2 touches no DB) |
| `npm run db:types` | run to confirm no drift; `git status`/`git diff` on `src/db/database.types.ts` showed nothing (delta 0, as expected — no schema change this phase) |
| `BASE_URL=http://localhost:4398 npm run smoke` (`ASTRO_DEV_BACKGROUND=1 npx astro dev --port 4398`) | 77 PASS (delta 0), run twice (before and after the deliberate breaks) |

Deliberate breaks (each: edit only the named line in the worktree, run the narrowest relevant vitest file(s),
observe red, restore, re-run to confirm green; full suite + build + astro check + pgTAP + smoke re-run green after
all three were restored):

1. **`resolveKey` reduced to one hop, no loop** (`return decisions.get(key)?.mergedInto ?? key;`) →
   `pattern-decisions.test.ts`: chain (a→b→c), 2-cycle and 3-cycle cases FAIL (3/54 tests; "unknown key", "direct
   merge" and "cycle entered from a tail" happened to still pass — a tail's first hop already lands on the correct
   answer in these fixtures, and direct merge is inherently one hop). Restored → 54/54 green. **Meta-check**:
   `patterns.test.ts`'s new S-05 block (direct single-hop `sportowo.pl → sportowo`) stayed green throughout, so the
   red isolates multi-hop/cycle resolution specifically, not merging itself.
2. **`type = d5Type(amounts)` — `pinnedType` ignored** → `pattern-decisions.test.ts`: "a pinned type overrides D5
   both ways" and the US-03 date-split case FAIL (2/54 tests: `steady` expected `frequent` got `fixed`, the merged
   cafe pattern expected `fixed` got `frequent`). Restored → green. **Meta-check**: `patterns.test.ts`'s F-02 fixture
   partition case (`derivePatterns — F-02 oracle`, no decisions with a pin) stayed green, so the red isolates the pin
   path, not D5/derivation generally.
3. **`excluded` dropped from `listOverview`'s early return** (`if (!threshold || !refMonth)`) →
   `pattern-view.test.ts`: the new excluded-list case FAILs (`overMinor` 2000 instead of 0 for the excluded twin).
   Restored → green (14/14). **Meta-check**: `wolt` itself (non-excluded, same threshold, `overMinor` 2000) stayed
   green in the very same run, proving the threshold does apply and only the exclusion check zeroes it — not that
   the threshold stopped applying generally.

No `BEGIN … ROLLBACK` DB experiment was needed this phase (pure TypeScript, no migration touched); pgTAP was re-run
once at the end to confirm delta 0, not as part of any break/restore cycle.

## 4. Next command

`/10x-implement durable-pattern-decisions phase 3`

## 5. Open

- Manual Progress rows not touched this phase (unchanged from the Phase 1 handoff, plus this phase's own):
  `[reviewer]` 1.9, 1.10 (Phase 1, still open for `/10x-impl-review`), **2.9** (this phase's own — "only the root's
  decision is read; nothing applied after grouping; cycle rule deterministic and documented" —
  `src/lib/patterns/derive.ts` `resolveKey` / `derivePatterns`), 3.8, 4.9, 6.8, 6.9, 7.8; `[visual]` 5.8, 5.9, 7.10,
  7.11; `[human]` 7.9 (product owner confirms plan decision 9, „nie wchodzi do sumy miesięcznej”).
- Gap ids still reserved for later phases: K22, G33 (Phase 6); G4/G24/G28 rows to be updated in Phases 5–7
  (`context/foundation/design-kit.md`) — nothing registered yet, Phase 2 touched no UI/copy.
- Carried risks (plan `## Known risks`, unchanged): normalizer drift (`src/lib/patterns/merchant.ts`
  `normalizeMerchant`); smoke text-anchor rule (`InlineAlert.astro` renders `<span> text </span>` — bare text, never
  `>text<`) — relevant starting Phase 4/6 smoke additions, not yet exercised.
- Phase 3 (next) is: paged reads for decisions and thresholds (closes S-04 F5), one `loadPatternData` entry point
  replacing `loadPatterns` in both pages, island-ready `listOverview` return type (closes S-04 impl-review F7,
  `patterns.astro`'s remaining `overviewByKey` `Map`), and the absorbed-key redirect (`detailTarget`). Plan's own
  Phase 3 criterion flags that **passing an empty `Map()` into `derivePatterns` from `loadPatternData` is not yet
  caught by any automated check** until Phase 4's smoke step "merged pattern sums its components" — Phase 3 must
  record that break as expected-uncaught (plan Phase 3 §Success Criteria, deliberate break 2), not treat it as a
  regression.

## 6. Autonomous decisions

- **Ran the phase's work directly rather than through the interactive `/10x-implement` UX** (no `AskUserQuestion`,
  no `TaskCreate`/`TaskUpdate` todo list) — same substitute as Phase 1: read the plan's Phase 2 section in full,
  applied its contract by hand (implement → plan-criteria checks → deliberate break/meta-check per criterion →
  full repo-wide gate → commit → sha-writeback docs commit). Rejected: invoking the Skill tool and answering its
  prompts myself — the agent contract (rule 1) forbids `AskUserQuestion` outright. Would change: a non-interactive
  skill entry point.
- **`resolveKey` cycle rule implemented as "track visited keys in order, on a repeat return the code-point-smallest
  member of the cycle slice"** rather than e.g. Tarjan-style SCC detection. Why: the plan's contract only requires
  determinism and the smallest-member rule, not a particular algorithm; this is O(chain length) per call, correct
  for the tested topologies (direct, chain, 2-cycle, 3-cycle, tail-into-cycle), and reads directly off the decisions
  map with no precomputation. Would change: if a future phase needs cycle detection across the *whole* decisions
  map in one pass (e.g. the endpoint validating "does this merge create a cycle" before writing) rather than
  per-key resolution — not needed here since the plan's merge endpoint (Phase 4) rejects non-root targets outright,
  making a fresh cycle structurally very hard to create.
- **`derivePatterns` restructured into two explicit passes (`byRawKey` then union-by-root) instead of a single pass
  with an in-place key rewrite.** Why: `merged[].name` needs each absorbed key's *own* most-frequent variant, which
  is lost once rows are unioned into the root group in a single pass; keeping `byRawKey` around (and storing each
  member's own `variants` map alongside its key in the union pass) avoids a second lookup entirely, which also
  sidestepped a `no-non-null-assertion` lint error the first draft (`byRawKey.get(k)!`) hit. Would change: nothing
  foreseen — this shape is what Phase 3's `loadPatternData`/`detailTarget` and Phase 6's merged-variants list both
  need directly from `MerchantPattern.merged`.
- **Test-time key grounding: computed `merchantKey`/`resolveKey` inputs from the fixture's own `expected.rows[].rawMerchant`** (never hardcoded `"sportowo"`/`"sportowo.pl"` string literals) in `test/unit/patterns.test.ts`'s new
  S-05 block, per the plan's explicit note ("the real merchantKey is whatever key derivePatterns gives that group").
  Verified the exact values once with a throwaway probe test (`normalizeMerchant`/`merchantKey` of the three raw
  strings involved) before writing the assertions, then removed the probe file — the shipped test never hardcodes
  the slugs, it derives and asserts them via `merchantKey(row.rawMerchant)`. Would change: nothing; this is what the
  plan asked for.
- **`fixedAmountMinor` for a pinned-fixed pattern kept as `Math.round(median(amounts))` even when a component's
  amount is outside the D5 tolerance** (test: "varied" pinned fixed, `fixedAmountMinor` 20000 despite 16999 being
  1 grosz over tolerance) — this is the plan's own stated rule ("unchanged rule, also for a pinned-fixed pattern
  outside the tolerance"), not a new judgment call; recorded here only because it is easy to mistake for a bug on a
  first read of the test.
