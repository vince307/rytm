# Handoff — `durable-pattern-decisions` (slice S-05)

Written by the `implement` step, Phase 4 (2026-09-28, autonomous run `2026-09-28-s05-s06-s07`). Phase 4 (decision
endpoint + US-03 durability smoke) is fully green and committed: `POST /api/patterns/decision` now writes
`pattern_decisions` rows for all six actions (merge, unmerge, type, rename, exclude, restore), and smoke proves the
full US-03 loop over real HTTP, including a second import joining an already-merged/pinned/renamed/excluded pattern
with no re-editing. **There is still no UI** — everything this phase added is posted directly by smoke; a browser
user cannot yet trigger any of it (Phase 6 adds the „Akcje” dialog). What the next agent must not get wrong: `merge`
is the **only** action that reads (`loadPatternData`, to run `validateMerge` against the current roots) — every
other action writes blind, straight from the parsed form, exactly as the plan's Critical Implementation Details
say; do not add a read to `unmerge`/`type`/`rename`/`exclude`/`restore` "for consistency". Every write is a
**partial** upsert (`{ merchant_key: key, <one column> }`, `onConflict: "user_id,merchant_key"`) — never spread a
full decision object, or a later phase's write will silently reset every other column on that row (proven by
smoke "rename keeps the exclusion" and this phase's break 4.6).

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/durable-pattern-decisions` (confirmed with `git branch --show-current`), cut from `main` at `f252112` |
| Commits on branch | 13 — change identity, research, plan, plan review, Phase 1 (`1e2ea9b` + sha-record `272232b`), Phase 1 handoff (`17e3137`), Phase 2 (`c2b63b4` + sha-record `a89ce59`), Phase 2 handoff (`8f3f5f9`), Phase 3 (`b1010f3` + sha-record `3000e75`), Phase 3 handoff (`f7eb960`), **Phase 4 `feat(durable-pattern-decisions): decision endpoint and US-03 durability smoke (p4)` (`61145cf`)**, **`docs(durable-pattern-decisions): record phase 4 commit sha in Progress` (`c2626db`)** |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` (unchanged — only flips once, at Phase 1 entry) |
| `## Progress` rows remaining | 39 pending (`grep -c '^- \[ \]' plan.md`); Phase 4's own `4.9` `[reviewer]` still `[ ]` (not mine) |
| Working tree | Clean after the two commits (`git status --short` empty) |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `src/lib/patterns/decision-form.ts` | New. `decisionKeySchema` (key alone, `.loose()` so the rest of the form passes through unvalidated — parsed first, S-04 F4 lesson). `decisionSchema` — zod discriminated union on `action`: `merge` (`target`), `unmerge` (`source`), `type` (`type` ∈ `fixed`\|`frequent`), `rename` (`name`), `exclude`, `restore` (optional `back: "list"`). `parseDisplayName(raw)` — trim; empty → `null`; >100 chars → the literal `"invalid"` (eslint `no-redundant-type-constituents` disabled on that one signature with a comment — the rule doesn't distinguish a sentinel literal from `string` structurally). `validateMerge(patterns, source, target)` — both must be current roots in `patterns`, `target !== source`, `target` not excluded. `decisionRedirect(key, status, back?)` — maps each of 9 `DecisionStatus` values to its query param on the key's own detail, or (`back === "list"`) to `/patterns` |
| `src/pages/api/patterns/decision.ts` | New. `POST`, `prerender = false`. Guard identical to `threshold.ts` (unconfigured client / no user → `/login`). Parses `decisionKeySchema` first (no usable key → `/patterns`), then `decisionSchema` (fails → `error-decision` on the key's own detail). One `switch` per action; every branch does exactly one partial upsert (or, for `unmerge`, one `update … set merged_into = null … .eq("merchant_key", source)`) and one `console.error` + `error-decision` on a DB error. `merge` alone calls `loadPatternData` first and rejects via `error-merge` (not `error-decision`) when `validateMerge` fails |
| `test/unit/decision-form.test.ts` | New, 22 cases: `decisionKeySchema` (accepts with extra fields, rejects empty/missing/>500 chars); `decisionSchema` (accepts all six actions incl. `restore` with/without `back`, rejects unknown action, missing `target`/`source`, bad `type`, >500-char key); `parseDisplayName` (trim, empty/whitespace → `null`, 100 ok, 101 → `"invalid"`); `validateMerge` (ok, self, unknown target, target not a current root i.e. already-absorbed shape, excluded target, unknown source); `decisionRedirect` (all 9 statuses, `back: "list"`, a key with a space) |
| `scripts/smoke.mjs` | New `importPayloadJune` (same account, 2026-06-01..30, 3 new `bankTxId`s: Sklep smoke 12,99 zł 06-04, Piekarnia smoke 8,00 zł 06-10, Kawiarnia smoke 47,00 zł 06-20). 26 new steps inserted after "pattern detail drops the over-limit mark after removal": 25 sequential steps proving the full US-03 loop (unknown action → self-merge rejected → merge → sums/re-types → absorbed-key redirect → list drops the absorbed row → pin type → threshold → exclude → over-long rename rejected → rename → exclusion survives the rename → second import → merge/type/name/exclusion all hold on the new rows with no re-editing → restore → unmerge → absorbed key has its own detail again), plus 1 anonymous-session step ("decision without a session goes to login") placed alongside the other anonymous checks. Top file comment updated to mention the decision path |
| `context/changes/durable-pattern-decisions/plan.md` | Phase 4 `## Progress` rows `4.1`–`4.8` ticked `[x]` with ` — 61145cf` and the **observed** numbers/meta-checks recorded inline (§3 below has the same detail); `4.9` left `[ ]` for `/10x-impl-review` |
| `context/changes/durable-pattern-decisions/handoff.md` | This file |

## 3. Verification

Baseline for this phase (measured on this branch before Phase 4, i.e. Phase 3's own result): lint 0 · astro check 0
errors (111 files) · fixture:check OK · vitest 165 (9 files) · build OK · pgTAP 102 (5 files) · smoke 77 PASS.

| Command / check | Result |
| --- | --- |
| `git branch --show-current` | `feat/durable-pattern-decisions` |
| `npm run lint` | 0 errors (delta 0) |
| `npx astro check` | 0 errors, 0 warnings, 0 hints, **114** files (delta +3 — `decision-form.ts`, `decision.ts`, `decision-form.test.ts`) |
| `npm run fixture:check` | OK |
| `npm test` | **187** passed, **10** files (baseline 165/9 + 22 new cases in 1 new file, delta +22/+1 file) |
| `npm run build` | passes |
| `npx supabase db reset && npx supabase test db` | pgTAP 102 (5 files), all pass (delta 0 — Phase 4 touches no migration) |
| `npm run db:types` | run to confirm no drift; `git diff --stat src/db/database.types.ts` empty (delta 0, as expected) |
| `BASE_URL=http://localhost:4398 npm run smoke` (`ASTRO_DEV_BACKGROUND=1 npx astro dev --port 4398`) | **103** PASS (baseline 77, +26), run clean before and after all three deliberate breaks |

Deliberate breaks (all on `src/pages/api/patterns/decision.ts` / `src/lib/patterns/load.ts` / `decision-form.ts`,
each restored immediately after its own smoke run, full gate re-confirmed green afterward):

1. **Plan criterion 4.6** — rename's upsert changed to send `{ merchant_key, display_name, excluded: false }`
   (a full-column write instead of the partial one) → 2/103 smoke steps FAIL: "rename keeps the exclusion" (the
   one the plan names) **and** its downstream dependent "later import keeps the exclusion" (the exclusion, once
   wrongly reset, stays reset through the later import too — both are the same root cause, not two bugs).
   Restored → 103/103. **Meta-check**: "pattern is renamed" itself stayed green throughout, so the red proves the
   untouched `excluded` column does not survive a full-column upsert — not that the rename action is broken.
2. **Plan criterion 4.7** — `loadPatternData` changed to call `derivePatterns(rows, new Map())` instead of
   `derivePatterns(rows, decisions)` → **8** smoke steps FAIL, wider than the plan's named 4 (steps 4, 5, 13, 16):
   "merged pattern sums its components", "merged pattern is re-typed by D5", "patterns list shows one merged row",
   "excluded pattern has no over-limit", "rename keeps the exclusion", "later import joins the merged pattern",
   "later import keeps the name", "later import keeps the exclusion". The 4 extra failures ("patterns list shows
   one merged row" and the three "later import keeps/joins …" steps) are the same root cause reaching further
   downstream — once no decision ever reaches `derivePatterns`, the merge stops holding for *any* read, not just
   the ones the plan's criterion named; recording the wider, actually-observed set rather than trimming it to the
   plan's 4 to stay literal. Restored → 103/103. **Meta-check**: the four write steps ("pattern is merged", "type
   is pinned", "pattern is excluded", "pattern is renamed") and the three reads that consult the decisions map
   directly rather than through `derivePatterns` ("absorbed pattern redirects to the merged one" —
   `detailTarget`/`resolveKey` — "pinned type shows on the detail" and "pinned type takes the amount threshold" —
   both trivially true for a single-occurrence pattern under D5 regardless of the pin) all stayed green throughout
   — isolating the break to derivation specifically, exactly as Phase 3's own unguarded break (3.7) predicted this
   phase would catch.
3. **Plan criterion 4.8** — `validateMerge` changed to always `return true` → exactly 1/103 FAILs: "merge into
   itself is rejected" redirects to `/patterns/sklep%20smoke?error=decision` instead of `?error=merge` (the DB's
   `pattern_decisions_no_self_merge` check constraint still rejects the write as an untyped error, but the
   app-side `error-merge` branch never fires). Restored → 103/103. **Meta-check**: the DB would refuse the
   self-merge either way, so the *only* observable difference is which redirect target fires — confirming the
   app-side validation is what the smoke step actually proves, not just "the write eventually fails".

No `BEGIN … ROLLBACK` DB experiment was needed this phase (no migration touched); pgTAP was re-run once at the end
(after all three code breaks were restored) to confirm delta 0.

## 4. Next command

`/10x-implement durable-pattern-decisions phase 5`

## 5. Open

- Manual Progress rows not touched this phase (carried from earlier handoffs, plus this phase's own):
  `[reviewer]` 1.9, 1.10 (Phase 1), 2.9 (Phase 2), 3.8 (Phase 3), **4.9** (this phase's own — "the endpoint mirrors
  the threshold endpoint (guard, parse, log, redirect) but parses `key` first; every write sends one decision
  column; the client never sends `user_id`; `merge` is the only action that reads" — verified by hand during
  implementation, see `src/pages/api/patterns/decision.ts` in full, but still needs `/10x-impl-review`'s own
  check), 5.8, 5.9 (Phase 5, `[visual]`), 6.8, 6.9, 7.8 (`[reviewer]`); `[visual]` 5.8, 5.9, 7.10, 7.11; `[human]`
  7.9 (product owner confirms plan decision 9, „nie wchodzi do sumy miesięcznej” — already answered by the
  maintainer's Step-0 product decision recorded in the agent contract, but the row itself is still unticked
  pending Phase 7).
- Gap ids still reserved for later phases: K22, G33 (Phase 6); G4/G24/G28 rows to be updated in Phases 5–7
  (`context/foundation/design-kit.md`) — nothing registered yet, Phase 4 touched no UI/copy/kit rows.
- Carried risks (plan `## Known risks`, unchanged, now partly exercised): normalizer drift
  (`src/lib/patterns/merchant.ts` `normalizeMerchant`) still open; PostgREST partial-upsert semantics — now
  **proven** by pgTAP 6–7 (Phase 1) *and* smoke "rename keeps the exclusion" (this phase, break 4.6) rather than
  just asserted; smoke text-anchor rule (`InlineAlert.astro` renders `<span> text </span>` — bare text, never
  `>text<`) — relevant starting Phase 6's `patternActions` toasts, not yet exercised (this phase's own new smoke
  assertions are all plain `>text<` page content or `notContains`, no `InlineAlert` result lines yet since there
  is no UI to render one).
- Carried from Phase 3 §5 — `src/pages/patterns/[...key].astro`'s `astro check` false positive on
  `Astro.redirect(patternHref(...), ...)` called directly inside a nested `if`/`return`: worked around there by
  precomputing the href first. Not re-triggered this phase (no new `Astro.redirect(patternHref(...))` call site
  was added — the endpoint redirects via `context.redirect(decisionRedirect(...))`, a different shape); flagging
  again here only so Phase 6 (which does touch `[...key].astro`) knows to watch for it if it adds another
  `Astro.redirect(patternHref(...))` site.
- **New, not in the plan text**: the plan's own criterion 4.7 explicitly says "steps 4, 5, 13, 16 FAIL" for the
  empty-decisions break; the actually-observed failure set was 8 steps (see §3 point 2). This is not a defect in
  the implementation — it is the plan's criterion under-stating its own blast radius, because steps 7 ("patterns
  list shows one merged row") and 18/20/21 (the three "later import …" steps) are logically downstream of the
  same merge/exclusion state the named 4 steps check. No plan or code change needed; recorded here so
  `/10x-impl-review` does not read "4 failures expected, 8 observed" as a red flag without this context.
- Phase 5 (next) is: shared dialog geometry (`DialogContent` → kit `.modal`, G24) and the `usePageShowReset` bfcache
  hook (undo-import F4, S-04 F8), visible only on `/settings` and `/imports`. It does not touch anything this
  phase added — no interaction expected. Phase 6 is the first phase to actually wire the decision endpoint to a
  UI (the „Akcje” dialog); until then a decision can only be made the way this phase's smoke does it, by POSTing
  directly.

## 6. Autonomous decisions

- **Ran the phase's work directly rather than through the interactive `/10x-implement` UX** (no `AskUserQuestion`,
  no `TaskCreate`/`TaskUpdate` todo list) — same substitute as Phases 1–3: read the plan's Phase 4 section in
  full, applied its contract by hand (implement → plan-criteria checks → deliberate break/meta-check per criterion
  → full repo-wide gate → commit → sha-writeback docs commit). Rejected: invoking the Skill tool and answering its
  prompts myself — the agent contract (rule 1) forbids `AskUserQuestion` outright. Would change: a non-interactive
  skill entry point.
- **Recorded break 4.7's actually-observed 8-step failure set in full, rather than trimming the write-up to the
  plan's named 4 steps to look literal.** Why: the extra 4 failures are real, deterministic, and explained by the
  same root cause (steps 7, 18, 20, 21 are all downstream reads of the merge/exclusion state that steps 4, 5, 13,
  16 also check) — silently under-reporting a break's blast radius would be worse than a plan criterion that
  slightly under-counts its own effect. Would change: if a future review decides the plan text itself should be
  corrected to name all 8, that is a plan edit, not an implementation one — left as-is since the plan document's
  job is to state the *minimum* proof, and 8/8 ⊇ 4/4.
- **Disabled `@typescript-eslint/no-redundant-type-constituents` on `parseDisplayName`'s signature alone**, with a
  same-line justification comment, rather than restructuring the return type to a discriminated object (e.g.
  `{ ok: true; value: string | null } | { ok: false }`). Why: the plan's own contract spells out the exact return
  shape as `string | null | "invalid"` and the smoke/unit-test call sites all narrow on `=== "invalid"`;
  restructuring would be an unplanned API change for a lint technicality the rule itself cannot distinguish (a
  sentinel literal vs. an arbitrary string are structurally identical to TypeScript). Would change: if a second,
  unrelated function in this codebase hits the same rule, worth asking whether a shared "sentinel" type alias is
  worth introducing instead of repeating the per-site disable.
- **Used `.loose()` instead of the plan text's literal `.passthrough()`** on `decisionKeySchema`. Why: this repo
  pins zod 4.6.5, where `.passthrough()` is deprecated in favour of `.loose()` (confirmed via `npx eslint`, which
  flags the deprecated call under `@typescript-eslint/no-deprecated`); `.loose()` is the direct replacement with
  identical runtime behaviour (unknown keys pass through unvalidated) — not a behavioural decision, just following
  the installed dependency's own migration off a deprecated alias the plan's prose predates. Would change: nothing
  — this is what the plan's contract meant, expressed in the current API.
