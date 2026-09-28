# Handoff — `durable-pattern-decisions` (slice S-05)

Written by the `implement` step, Phase 3 (2026-09-28, autonomous run `2026-09-28-s05-s06-s07`). Phase 3 (paged
reads, one pattern-data read, absorbed-key redirect) is fully green and committed; both pages now read through the
single `loadPatternData` entry point and `listOverview` returns island-ready items, but **no decisions exist yet**
(no write path — Phase 4), so the app is still behaviourally unchanged. What the next agent must not get wrong:
`loadPatternData` (`src/lib/patterns/load.ts`) is now the **only** sanctioned read for both pages and the Phase 4
decision endpoint — do not add a third caller of `loadThresholds`/`loadDecisions`/the private transaction reader
directly; and `decisions.ts` / `thresholds.ts` both import `collectPages`/`PAGE_SIZE` from `load.ts` while `load.ts`
imports `loadDecisions`/`loadThresholds` back — this is a **deliberate circular ESM import**, safe only because
every cross-reference is used inside a function body, never at module-top-level evaluation; do not "fix" it by
hoisting a top-level call.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/durable-pattern-decisions` (confirmed with `git branch --show-current`), cut from `main` at `f252112` |
| Commits on branch | 11 — change identity, research, plan, plan review, Phase 1 (`1e2ea9b` + sha-record `272232b`), Phase 1 handoff (`17e3137`), Phase 2 (`c2b63b4` + sha-record `a89ce59`), Phase 2 handoff (`8f3f5f9`), **Phase 3 `feat(durable-pattern-decisions): paged reads, one pattern-data read, absorbed-key redirect (p3)` (`b1010f3`)**, **`docs(durable-pattern-decisions): record phase 3 commit sha in Progress` (`3000e75`)** |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` (unchanged — only flips once, at Phase 1 entry) |
| `## Progress` rows remaining | 42 pending (`grep -c '^- \[ \]' plan.md`); Phase 3's own `3.8` `[reviewer]` still `[ ]` (not mine) |
| Working tree | Clean after the two commits |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `src/lib/patterns/decisions.ts` | New. `loadDecisions(supabase)` — pages `pattern_decisions` (`select id, merchant_key, merged_into, excluded, pinned_type, display_name`) via `collectPages` (`.order("id")` + `.gt("id", afterId)`, `PAGE_SIZE` from `load.ts`), returns `Map<merchant_key, PatternDecision>`. An unrecognised `pinned_type` reads as `null` (defensive; DB check constraint makes it unreachable) |
| `src/lib/patterns/thresholds.ts` | `loadThresholds` now pages the same way (was unpaged — closes S-04 F5); `id` added to the select |
| `src/lib/patterns/load.ts` | `loadPatterns` removed; its read is now the private, unexported `loadTransactionRows`. New `loadPatternData(supabase)` — `Promise.all([loadTransactionRows, loadThresholds, loadDecisions])`, any error fails the whole read, then `derivePatterns(rows, decisions)`. Returns `{ patterns, rows, thresholds, decisions }`. `collectPages`'s `MAX_PAGES` error text changed from `"patterns read exceeded…"` to the read-neutral `"paged read exceeded MAX_PAGES without an empty page"` (now shared by three readers) |
| `src/lib/patterns/view.ts` | `listOverview` now returns full `PatternListItem[]` directly (island-ready, S-04 impl-review F7) instead of the old `PatternListOverviewItem` (removed) — no page-side re-merge needed any more. New `detailTarget(key, patterns, decisions): DetailTarget` (`{ kind: "found"; pattern }` &#124; `{ kind: "redirect"; key }` &#124; `{ kind: "missing" }`) — resolves `key` through `resolveKey` (from `derive.ts`) first; `redirect` only when the resolved root actually has a pattern in this read, otherwise `missing` (covers both an unknown key and a root whose owning import was deleted) |
| `src/pages/patterns.astro` | Calls `loadPatternData` once; `items = listOverview(...).items` directly — the old hand-built `PatternListItem` literal + `overviewByKey` `Map` re-merge is gone |
| `src/pages/patterns/[...key].astro` | Calls `loadPatternData` once. `target = detailTarget(key, patterns, decisions)`; `redirectHref = target?.kind === "redirect" ? patternHref(target.key) : null`, then `if (redirectHref !== null) return Astro.redirect(redirectHref, 302);` (302, not the page's own 404 branch); `pattern = target?.kind === "found" ? target.pattern : undefined` unchanged from there down. See §6 for why the redirect href is precomputed as a ternary rather than called directly inside `return Astro.redirect(...)` |
| `test/unit/pattern-view.test.ts` | Existing `listOverview` assertions widened from `{ key, threshold, overMinor }` to full `PatternListItem` objects (name/type/occurrences/sumMinor/fixedAmountMinor/excluded included); added "returns items in pattern order". New `describe("detailTarget (S-05)")`: plain key found; key with no decision found; absorbed key → redirect to root; absorbed key resolved through a two-hop chain → redirect to the *final* root, not the first hop; absorbed key whose root has no pattern in this read → missing (not a dead-link redirect); unknown key with no decision → missing |
| `context/changes/durable-pattern-decisions/plan.md` | Phase 3 `## Progress` rows `3.1`–`3.7` ticked `[x]` with ` — b1010f3` suffix and the observed numbers/meta-checks recorded inline; `3.8` left `[ ]` for `/10x-impl-review` |
| `context/changes/durable-pattern-decisions/handoff.md` | This file |

## 3. Verification

Baseline for this phase (measured on this branch before Phase 3, i.e. Phase 2's own result): lint 0 · astro check 0
errors (110 files) · fixture:check OK · vitest 158 (9 files) · build OK · pgTAP 102 (5 files) · smoke 77 PASS.

| Command / check | Result |
| --- | --- |
| `git branch --show-current` | `feat/durable-pattern-decisions` |
| `npm run lint` | 0 errors (delta 0) |
| `npx astro check` | 0 errors, 0 warnings, 0 hints, **111** files (delta +1 — the new `decisions.ts`) |
| `npm run fixture:check` | OK |
| `npm test` | **165** passed, **9** files (baseline 158/9 + 7 new cases in the same file, delta +7/+0 files) |
| `npm run build` | passes |
| `npx supabase db reset && npx supabase test db` | pgTAP 102 (5 files), all pass (delta 0 — Phase 3 touches no DB) |
| `npm run db:types` | run to confirm no drift; `git diff --stat src/db/database.types.ts` empty (delta 0, as expected — no schema change this phase) |
| `BASE_URL=http://localhost:4398 npm run smoke` (`ASTRO_DEV_BACKGROUND=1 npx astro dev --port 4398`) | 77 PASS (delta 0), run twice (before and after the deliberate breaks) |

Deliberate breaks:

1. **`detailTarget`'s redirect branch reduced to always `{ kind: "missing" }`** (`src/lib/patterns/view.ts`, the
   `if (root !== key)` block) → `pattern-view.test.ts`: exactly the two absorbed-key cases FAIL ("an absorbed key
   redirects to its root", "…resolves through a chain to the final root"; 19/21 in that file). Restored → 21/21
   green; full suite re-run → 165/165. **Meta-check**: the "unknown key" and "key with no decision at all" cases
   (both also expect `missing`) stayed green throughout the break, so the red isolates the redirect-to-an-existing-
   root path specifically, not `detailTarget`'s missing-handling in general (this matches plan criterion 3.6).
2. **`loadPatternData` passes `new Map()` instead of `decisions` to `derivePatterns`** (`src/lib/patterns/load.ts`)
   → `npm run lint`, `npx astro check`, `npm test` (165/165) and `npm run build` **all stayed green** — confirmed,
   as the plan itself predicts, that nothing automated catches this yet. Restored → unchanged green. Recorded per
   plan criterion 3.7 as an **expected-uncaught** gap, not a regression: no decisions are written anywhere before
   Phase 4, so `derivePatterns(rows, decisions)` and `derivePatterns(rows, new Map())` are behaviourally identical
   until then; Phase 4's smoke step "merged pattern sums its components" is the guard that will actually catch a
   regression here.

No `BEGIN … ROLLBACK` DB experiment was needed this phase (pure TypeScript/read-path changes, no migration
touched); pgTAP was re-run once at the end to confirm delta 0, not as part of any break/restore cycle.

## 4. Next command

`/10x-implement durable-pattern-decisions phase 4`

## 5. Open

- Manual Progress rows not touched this phase (carried from earlier handoffs, plus this phase's own):
  `[reviewer]` 1.9, 1.10 (Phase 1), 2.9 (Phase 2), **3.8** (this phase's own — "both small reads page via
  `collectPages` (`order id`, `gt id`); pages use only `loadPatternData`; no second `Map` in `patterns.astro`" —
  verified by hand during implementation, see §6, but still needs `/10x-impl-review`'s own check), 4.9, 6.8, 6.9,
  7.8; `[visual]` 5.8, 5.9, 7.10, 7.11; `[human]` 7.9 (product owner confirms plan decision 9, „nie wchodzi do
  sumy miesięcznej”).
- Gap ids still reserved for later phases: K22, G33 (Phase 6); G4/G24/G28 rows to be updated in Phases 5–7
  (`context/foundation/design-kit.md`) — nothing registered yet, Phase 3 touched no UI/copy.
- Carried risks (plan `## Known risks`, unchanged): normalizer drift (`src/lib/patterns/merchant.ts`
  `normalizeMerchant`); smoke text-anchor rule (`InlineAlert.astro` renders `<span> text </span>` — bare text,
  never `>text<`) — relevant starting Phase 4/6 smoke additions, not yet exercised.
- **New, not in the plan text**: `src/pages/patterns/[...key].astro`'s Astro-check false positive. Calling
  `patternHref(target.key)` directly as the sole expression inside `return Astro.redirect(patternHref(...), 302)`
  (nested one level inside an `if`) makes `astro check` (ts 6133) report `patternHref` as an unused import, even
  though it demonstrably executes (confirmed with a throwaway `void patternHref;` probe, and by moving the call
  into an intermediate `const` computed via ternary, which resolved it with 0 hints). Root cause not fully
  diagnosed (looks like a dead-code/control-flow quirk in Astro's frontmatter→TSX transform specific to
  `return Astro.redirect(<call using a same-file import>, …)`); worked around by computing
  `redirectHref = target?.kind === "redirect" ? patternHref(target.key) : null` first and branching on
  `redirectHref !== null`. If Phase 4/6 add more `Astro.redirect(patternHref(...))` call sites, expect the same
  false positive and apply the same "compute the href first, branch second" shape rather than re-diagnosing.
- Phase 4 (next) is: the decision endpoint (merge / exclude / restore / pin type / rename) and the US-03
  durability smoke (+26 steps: 103 total). It is the first phase that actually writes `pattern_decisions` rows, so
  it is also the first phase where the "empty `Map()` into `derivePatterns`" gap from this phase's break 2 would
  actually be caught if reintroduced — plan criterion 4.7 re-checks exactly that.

## 6. Autonomous decisions

- **Ran the phase's work directly rather than through the interactive `/10x-implement` UX** (no `AskUserQuestion`,
  no `TaskCreate`/`TaskUpdate` todo list) — same substitute as Phases 1–2: read the plan's Phase 3 section in full,
  applied its contract by hand (implement → plan-criteria checks → deliberate break/meta-check per criterion →
  full repo-wide gate → commit → sha-writeback docs commit). Rejected: invoking the Skill tool and answering its
  prompts myself — the agent contract (rule 1) forbids `AskUserQuestion` outright. Would change: a non-interactive
  skill entry point.
- **Kept `collectPages`/`PAGE_SIZE`/`MAX_PAGES` in `load.ts` and let `decisions.ts`/`thresholds.ts` import them
  back, accepting a circular module graph** (`load.ts` → `decisions.ts`/`thresholds.ts` → `load.ts`), rather than
  extracting a separate `paging.ts` module. Why: the plan's own file list for this phase (`## Critical
  Implementation Details` is silent on this, but the Phase 3 change list only names `decisions.ts` (new),
  `thresholds.ts`, `load.ts`, `view.ts`/`types.ts`, `patterns.astro`, `patterns/[...key].astro` — no new paging
  module) and the existing unit test `test/unit/patterns.test.ts` imports `collectPages`/`MAX_PAGES` from
  `@/lib/patterns/load` by name; moving them would be an unplanned rename. Verified safe: every cross-module
  reference is inside a function body (never used to compute a top-level constant), so ESM's live-binding
  semantics resolve it correctly regardless of evaluation order — confirmed by `npm run build`, `npx astro check`
  (0 errors) and the full `npm test` run all passing. Would change: if a future phase needs a *fourth* paged
  reader outside `src/lib/patterns/`, extracting `collectPages` to its own module would then be worth the rename.
- **`loadPatternData`'s three reads run via a single `Promise.all` (transactions, thresholds, decisions), not
  three sequential awaits or a nested `Promise.all` mirroring the old two-read shape.** Why: the plan's own Phase
  3 contract says exactly this ("the transactions, threshold and decision reads in parallel (`Promise.all`), any
  error fails the whole read"); this is not a judgment call, just confirming the literal contract was followed as
  written, recorded here only because it's easy to mistake for an arbitrary choice on a first read of the diff.
- **`detailTarget`'s `redirect` branch looks up the root pattern eagerly (`patterns.find((p) => p.key === root)`)
  to decide `redirect` vs `missing`, rather than always redirecting and letting a second request 404.** Why: the
  plan's own contract says so explicitly ("`redirect` when `resolveKey(key)` differs from `key` and that root is
  among `patterns`") — redirecting to a key that then 404s would be a broken link, which the plan's `missing`
  branch exists specifically to prevent (also matches the `detailTarget` unit test "absorbed key whose root has
  no rows → missing", not "redirect to a 404").
- **Worked around the `astro check` "unused import" false positive for `patternHref`** (detailed in §5) by
  precomputing `redirectHref` via a ternary and branching on `redirectHref !== null`, instead of calling
  `patternHref` directly inside `return Astro.redirect(...)`. Why: three other shapes were tried first (direct
  call inside the nested `if`/`return`; the same call wrapped in a named `resolveTarget()` helper function; an
  intermediate `const redirectHref = patternHref(target.key)` declared *inside* the `if` block right before the
  `return`) and all three still triggered the hint (the last one flagged the `const` itself as unused despite
  being read on the very next line) — only hoisting the `patternHref` call out to an unconditional ternary
  *outside* any `if`/`return` block made the hint disappear, confirming it is not simply "add more usages" but
  specifically about `patternHref` appearing only inside a block whose sole content is `return Astro.redirect(…)`.
  Would change: if a future phase finds the true root cause and a cleaner fix, or if Astro/TypeScript versions
  bump and the quirk disappears — the current shape is a workaround, not the "natural" code.
