# Handoff — `durable-pattern-decisions` (slice S-05)

Written by the `implement` step, Phase 1 (2026-09-28, autonomous run `2026-09-28-s05-s06-s07`). Phase 1
(`pattern_decisions` table and its proofs) is fully green and committed; no app code reads the table yet. What the
next agent must not get wrong: the plan's Phase 2 §5 already patches `src/pages/patterns.astro`'s hand-built
`PatternListItem` literal to add `excluded: pattern.excluded` — do it in the same edit as the `MerchantPattern` /
`PatternListItem` type change or `npx astro check` goes red mid-phase (plan review F2, still valid).

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/durable-pattern-decisions` (confirmed with `git branch --show-current`) |
| Commits on branch | 8 — change identity, research, plan, plan review, **`feat(durable-pattern-decisions): pattern_decisions table and its proofs (p1)` (`1e2ea9b`)**, **`docs(durable-pattern-decisions): record phase 1 commit sha in Progress` (`272232b`)** |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` (flipped from `plan_reviewed` at Phase 1 entry, per `/10x-implement` contract step 10) |
| `## Progress` rows remaining | 57 pending (`grep -c '^- \[ \]' plan.md`), 8 done (Phase 1's `1.1`–`1.8`, all carry ` — 1e2ea9b`); `1.9`/`1.10` `[reviewer]` still `[ ]` (not mine) |
| Working tree | Clean after the two commits |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `supabase/migrations/20260928120000_pattern_decisions.sql` | New table `public.pattern_decisions`: `id`, `user_id` (FK `auth.users(id) on delete cascade`, default `auth.uid()`), `merchant_key` (1–500 chars), `merged_into` (nullable, 1–500 chars, self-merge blocked by named check `pattern_decisions_no_self_merge`), `excluded boolean not null default false`, `pinned_type` (`fixed`/`frequent`), `display_name` (nullable, 1–100 chars), `created_at`, `unique (user_id, merchant_key)`. RLS: 4 per-operation policies for `authenticated` (`select`/`insert`/`update`/`delete`, update has `using`+`with check`); `revoke all … from anon`; `revoke truncate, trigger, references, maintain … from authenticated` — **not** `update` (upsert precedent) |
| `supabase/tests/database/pattern_decisions.test.sql` | pgTAP `plan(26)`, style of `pattern_thresholds.test.sql`; users A/B fixed UUIDs `aaaaaaaa…`/`bbbbbbbb…`; covers RLS isolation, the app's partial-upsert path, every constraint, US-02 import-delete survival, FR-019 account-delete cascade, anon lockout |
| `src/db/database.types.ts` | Regenerated (`npm run db:types`); diff adds only the `pattern_decisions` table block |
| `src/types.ts` | `export type PatternDecisionRow = Tables<"pattern_decisions">;` added beside `PatternThresholdRow` |
| `context/changes/durable-pattern-decisions/plan.md` | Phase 1 `## Progress` rows `1.1`–`1.8` ticked `[x]` with ` — 1e2ea9b` suffix; `1.9`/`1.10` left `[ ]` for `/10x-impl-review` |
| `context/changes/durable-pattern-decisions/change.md` | `status: plan_reviewed → implementing` |
| `context/foundation/roadmap.md` | S-05 `Status`: `planning → in-progress` (glance table row + item body), per `/10x-implement`'s roadmap-sync step (file was not pre-dirty, so this rode in the phase commit) |
| `context/changes/durable-pattern-decisions/handoff.md` | This file |

## 3. Verification

Baseline on `main` `f252112` (agent contract, re-measured on this branch before Phase 1): lint 0 · astro check 0
errors (109 files) · fixture:check OK · vitest 141 (8 files) · build OK · pgTAP 76 (4 files) · smoke 77 PASS.

| Command / check | Result |
| --- | --- |
| `git branch --show-current` | `feat/durable-pattern-decisions` |
| `npx supabase db reset && npx supabase test db` | PASS — 102 (5 files) = baseline 76 (4 files) + 26 (new file), delta +26 |
| `npm run db:types` | regenerated `src/db/database.types.ts`; `git diff` showed only the new `pattern_decisions` block |
| `npm run lint` | 0 errors (delta 0) |
| `npx astro check` | 0 errors, 109 files (delta 0 — no app code touched) |
| `npm run fixture:check` | OK |
| `npm test` | 141 passed, 8 files (delta 0) |
| `npm run build` | passes |
| `BASE_URL=http://localhost:4398 npm run smoke` (`ASTRO_DEV_BACKGROUND=1 npx astro dev --port 4398`) | 77 PASS (delta 0), run twice (before and after the deliberate breaks / final `db reset`) |
| Migration filename | `20260928120000_pattern_decisions.sql` matches `^[0-9]{14}_[a-z_]+\.sql$`, sorts after `20260927200000_pattern_thresholds.sql` |

Deliberate breaks (each: edit only the migration file in the worktree, `npx supabase db reset`, `npx supabase test
db`, observe red, restore the file byte-for-byte (`diff` confirmed identical), `db reset` again):

1. **Dropped the `update` policy** → assertions 6, 7, 8 FAIL (`42501`/`have 0 want 1`); restored → 102/102 green.
   Meta-check: assertions 3 and 5 (plain inserts, no upsert) stayed green — the red isolates the UPDATE branch the
   app's `on conflict do update` needs, not RLS in general. (Side effect noted, not a meta-check failure: 21 and 22
   also failed, because without any UPDATE policy B's own update silently touches 0 rows instead of raising 42501 —
   consistent with the break, not contradicting it.)
2. **Removed `pattern_decisions_no_self_merge`** → assertion 10 FAILs (`caught: no exception, wanted 23514`);
   restored → green. Meta-check: assertions 11–15 (the other check constraints) stayed green, so the red is the
   named self-merge check, not a generic constraint failure. Side effect: assertion 23 (import-survival count) also
   failed as a downstream consequence (the illegal self-merge row persisted, count 3 not 2) — expected, not a
   meta-check concern.
3. **`user_id` FK without `on delete cascade`** → the whole test file erred: `delete_own_account()` itself raised
   `update or delete on table "users" violates foreign key constraint` before assertion 24 could run (`Result: FAIL`,
   `Bad plan: planned 26 but ran 23`). This proves the break harder than a single red assertion would: without the
   cascade, account deletion is impossible at all, which is exactly the invariant the cascade exists to guarantee.
   Restored → green, 102/102.

No `BEGIN … ROLLBACK`-only experiment was available here (migration content, not row data, was under test), so each
break/restore cycle used a full `npx supabase db reset` per the contract's "any other DB mutation must be followed
by a reset in the same step" rule — done after every break and again after the final restore.

## 4. Next command

`/10x-implement durable-pattern-decisions phase 2`

## 5. Open

- Manual Progress rows not touched this phase (post-implement checklist, unchanged from the plan-review handoff):
  `[reviewer]` 1.9, 1.10 (this phase's own — left for `/10x-impl-review`), 2.9, 3.8, 4.9, 6.8, 6.9, 7.8; `[visual]`
  5.8, 5.9, 7.10, 7.11; `[human]` 7.9 (product owner confirms plan decision 9, „nie wchodzi do sumy miesięcznej”).
- Gap ids still reserved for later phases: K22, G33 (Phase 6); G4/G24/G28 rows to be updated in Phases 5–7
  (`context/foundation/design-kit.md`) — nothing registered yet, Phase 1 touched no UI.
- Carried risks (plan `## Known risks`, unchanged): normalizer drift (`src/lib/patterns/merchant.ts`
  `normalizeMerchant`); Phase 3 break 3.7 unguarded until Phase 4's 4.7; smoke text-anchor rule (`InlineAlert.astro`
  renders `<span> text </span>` — bare text, never `>text<`).
- Phase 2 is next: pure derivation with decisions (`derivePatterns`, `resolveKey`) and the fixture oracle
  (`test/unit/patterns.test.ts`, new `test/unit/pattern-decisions.test.ts`); no caller passes decisions yet, so the
  app stays behaviourally unchanged after Phase 2 too. Remember plan review F2 (Phase 2 §5): patch
  `src/pages/patterns.astro`'s `PatternListItem` literal in the same edit as the type change.

## 6. Autonomous decisions

- **Ran the phase's work directly rather than through the interactive `/10x-implement` UX** (no `AskUserQuestion`,
  no `TaskCreate`/`TaskUpdate` todo list). Chosen: read `SKILL.md` in full, then applied its substance by hand —
  preflight, per-phase execution, the fixed verification sequence (plan criteria → stage → deliberate break/meta-
  check → repo-wide checks → commit ritual → SHA writeback → `change.md` update → roadmap sync), matching the
  skill's contract exactly except for its interactive prompts. Rejected: literally invoking the Skill tool and then
  answering its `AskUserQuestion` calls myself in the transcript — the agent contract (rule 1) forbids
  `AskUserQuestion` outright, and the skill's own text says every such prompt is where a human would decide; since
  there is no human, deciding silently and recording it here is the documented substitute. Would change: a future
  run giving the autonomous path a non-interactive skill entry point (e.g. a `--no-ask` mode) — then invoke it
  directly instead of hand-driving the ritual.
- **Exec mode: implemented in this context, not delegated to a subagent.** Why: Phase 1 is DB-only (one migration,
  one pgTAP file, two type files) — small enough that delegation overhead was not worth it, and the deliberate-break
  cycle needed tight control over the exact edit/reset/restore sequence. Would change: a later phase touching many
  UI files where delegation keeps this context leaner.
- **`change.md.status` → `implementing`** and **roadmap S-05 → `in-progress`** applied at Phase 1 entry per the
  skill's documented "on first phase" rules, even though the human orchestrator never asked for it — the skill
  contract makes both unconditional on entering implementation, not conditional on being asked. Would change:
  nothing; this is mechanical per the skill text, not a judgment call.
- **Docker/Supabase were not running at start** (`docker info` failed). Started Docker Desktop (`open -a Docker`,
  sandbox disabled per contract) and waited for it, then `npx supabase start` — both are Docker/`127.0.0.1:54321`
  operations the contract explicitly names as sandbox-disabled. Would change: nothing, this is the documented path.
