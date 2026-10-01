# Handoff — `santander-csv-import` (slice S-10)

The `/10x-implement santander-csv-import phase 2` step of autonomous run `2026-10-01-m2-santander` implemented
Phase 2 (expand-only migration + `import_statement` RPC + pgTAP + regenerated types). It is committed and the local
gate is green. The next agent must not get this wrong: **the endpoint still calls `import_ing_statement`** — Phase 2
only widens the database, it does not touch `src/pages/api/imports.ts` or `src/lib/import/schema.ts`. A subtle pgTAP
trap to watch for in Phase 3+: never write `(select col from tbl where id = <volatile_function_call>)` — Postgres can
re-evaluate a volatile function once per row a scan visits when it appears in a WHERE filter with no index, calling
a write RPC a second time and colliding with its own just-inserted range (hit and fixed in this step, see `## 3`).
Always split a write call and its assertion into two statements, as `import_rpc.test.sql` already does.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/santander-csv-import`, cut from `main` at `1fed366` |
| Commits | 8 on top of `1fed366`: identity (`d2f2a86`), research (`e5f54f9`), plan (`396ea97`), plan review (`e576f3d`), Phase 1 fix (`b7880c3`), Phase 1 SHA backfill (`00c4400`), Phase 1 handoff (`03f4d08`), **this step**: Phase 2 migration+RPC+pgTAP+types (`b7f29e1`), Phase 2 SHA backfill (`e9d14d8`) |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `implementing` (unchanged) |
| `## Progress` rows remaining | 32 (`grep -c '^- \[ \]' plan.md`; was 38, -6 for Phase 2's automated rows) |
| Working tree | clean (`bash .claude/skills/10x-autonomous-run/scripts/tree-clean.sh` → `CLEAN`) |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `supabase/migrations/20261002120000_import_statement_source.sql` | Expand-only: widens `imports_source_check` to `('ing', 'santander')`; adds `public.import_statement(p_source, p_account_number, p_account_name, p_period_start, p_period_end, p_transactions)` — same body/validations as `import_ing_statement`, same insert column lists (no `user_id` in either list, so `user_id` comes only from the column default `auth.uid()` and RLS), writing `p_source` instead of the literal `'ing'`; `security invoker`, `set search_path = ''`; explicit `revoke … from public, anon` + `grant … to authenticated`. `import_ing_statement` is untouched and not mentioned in this file. |
| `supabase/tests/database/import_statement.test.sql` (new) | `plan(15)`: success + `source='santander'` + null `bank_tx_id` (×2 rows), a second disjoint-range Santander import accepted, overlap rejected (23P01, no row added), out-of-period rejected (22023, no row), `import_statement('ing', …)` still records `'ing'`, unknown source rejected (23514), a payload element carrying another user's `user_id` key still lands under the caller, `has_function_privilege('anon', …)` false, anon `throws_ok` 42501, account-B isolation. |
| `supabase/tests/database/domain_rls.test.sql` | `plan(28)` → `plan(30)`: two new asserts — a direct insert with `source = 'santander'` is accepted, one with `'mbank'` → 23514. |
| `src/db/database.types.ts` (generated) | Regenerated via `npm run db:types`; `Functions.import_statement` present. |
| `context/changes/santander-csv-import/plan.md` | `## Progress` 2.1–2.6 ticked with `— b7f29e1`; no other section touched. |
| `context/changes/santander-csv-import/handoff.md` | This file. |

## 3. Verification

| Command | Result (observed in this step) |
| --- | --- |
| `git branch --show-current` | `feat/santander-csv-import` (confirmed before starting) |
| `npx supabase migration up` (sandbox disabled: Docker) | Applied cleanly from the prior state |
| `npx supabase db reset && npx supabase test db` (sandbox disabled: Docker) | **First attempt failed**: `import_statement.test.sql` aborted mid-run (`conflicting key value violates exclusion constraint`). Root cause: a pgTAP `is()` call used `(select source from public.imports where id = public.import_statement(…))` — a volatile function inside a `WHERE` filter on a multi-row table gets re-evaluated once per row the scan visits (not hoisted), so the RPC ran a second time with the same account/range it had just inserted and collided with its own row. Fixed by splitting the write (`select public.import_statement(…);`) and the assertion (a separate `select is((select source from public.imports where account_number = …), …)`) into two statements, matching `import_rpc.test.sql`'s own pattern. After the fix: `npx supabase db reset && npx supabase test db` → Files=6, Tests=119, **Result: PASS** (baseline Files=5, Tests=102 — Δ+17: +2 `domain_rls.test.sql`, +15 new `import_statement.test.sql`) |
| `npm run db:types && grep -q import_statement src/db/database.types.ts` | match found |
| `git diff --exit-code main -- supabase/migrations/20260924224014_import_ing_statement.sql supabase/tests/database/import_rpc.test.sql supabase/tests/database/import_delete.test.sql` | exit 0 (unchanged) |
| **Deliberate break 1** (2.4): edited the migration file so the new function's insert read `values ('ing', p_account_number, …)` (literal, not `p_source`); `db reset` + `test db` → test 2 ("the import records source santander") failed red (`have: ing / want: santander`); restored the file (byte-diff confirmed identical to pre-break); `db reset` + `test db` → green again | red → green confirmed |
| **Deliberate break 2** (2.5): deleted the `revoke execute … from public, anon` line; `db reset` + `test db` → test 13 ("anon has no EXECUTE privilege on import_statement") failed red; the `throws_ok` 42501 assertion (test 14) stayed green — this local Supabase stack already restricts `anon` more broadly (observed, not assumed), so only the explicit-privilege assertion is sensitive to this specific line, not the end-to-end call. Restored the line (byte-diff confirmed identical); `db reset` + `test db` → both green | red → green confirmed; **meta-check**: the privilege assertion is the one that actually proves the revoke's effect in this environment — recorded as a deviation from the plan's assumption that *both* anon asserts would flip (`## 6` decision 1) |
| `npm run lint` | 0 errors (baseline: 0) |
| `npx astro check` | 0 errors, 0 warnings, 137 files (baseline: 137 files, 0 errors) |
| `npm run fixture:check` | `fixture:check ing OK`, `fixture:check santander OK` |
| `npm test` | 256 passed, 15 files (baseline 256/15 — Δ0) |
| `npm run build` | OK |
| `astro dev --port 4398` + `npm run smoke` (sandbox disabled: network) | 140 PASS / 0 FAIL (baseline 140/0 — Δ0, expected: Phase 2 doesn't touch the endpoint); dev server killed after (`lsof -ti :4398 -ti :4399` clear) |
| Final `npx supabase db reset` | Left the local DB on the committed migration set + seed only (no stray experiment data) |

## 4. Next command

`/10x-implement santander-csv-import phase 3`

## 5. Open

**Carried from Phase 1 handoff, unchanged:** S-11 re-keys Santander card patterns; R1 guarded only by the Phase 1
shape metric (also run once against both real exports, Phase 1 `## 3`); rollback shows "ING · Rachunek"; the PR
preview (production DB) cannot import until merge (Known risks, plan-review F2 — **binding for Phase 3**: the
endpoint will start calling `import_statement`, which does not exist in production until the merge's `deploy` job,
so every import on this branch's auto-built PR preview, ING included, will end in `?error=failed` until merge — do
not read that as a regression and do not add a fallback to `import_ing_statement`); Santander `title` holds the
masked card number (own data, RLS).

**New from this step:**
- A reusable pgTAP hazard worth remembering for Phase 3's new test cases: never embed a volatile RPC call inside a
  `WHERE` filter subquery used as a value — split the write and the read assertion into two statements (see `## 3`).
- Deliberate break 2's anon assertions did not both flip red as the plan's meta-check predicted; only
  `has_function_privilege` did. Recorded as an autonomous decision (`## 6` #1), not a STOP — the revoke still has an
  observable, provable effect, just a narrower one than the plan text assumed for this local stack.

**Manual-only Progress rows (checklist, unchanged):**

- 1.6 [reviewer] Real-export comparison — recorded finding in Phase 1 handoff; still unticked (not mine to tick).
- **2.7 [reviewer] Migration review** — new this phase: the migration is expand-only and backward-compatible; the
  header/function comment name the deploy window, the grants, and the per-account FR-005 rule (all present — see
  `supabase/migrations/20261002120000_import_statement_source.sql` header and the function's `comment on function`).
- 3.6 [reviewer] ING smoke steps byte-identical.
- 4.7 [reviewer] Reader vs rules 1–6.
- 5.6 [visual] List and result.
- 6.6 [visual] Every wizard state at 1280 and ~400 px.
- 6.7 [reviewer] Full local Santander import.
- 6.8 **[human]** Import the owner's real export locally.
- 6.9 **[human]** Accept the rule-7 deviation (Lp not stored).
- 6.10 **[human]** Accept the K26 wording, including "Rachunek".
- 6.11 **[human]** Accept that S-11 re-keys Santander card patterns.

**DESIGN-GAP to add in implement:** K26 (Phases 5–6), unchanged — not due yet.

**Follow-ups:** none new. No new follow-up file.

## 6. Autonomous decisions

1. **Deliberate break 2 did not flip both anon assertions red; proceeded on the one that did.**
   - Chosen: accept `has_function_privilege('anon', …) = false` flipping red (and back to green on restore) as
     sufficient proof that the explicit revoke matters, record the observed difference, continue to the full gate.
   - Rejected: treating the plan's "the anon asserts go red" (plural) as a hard criterion and blocking on it;
     redesigning the test to force both assertions to be break-sensitive (e.g. by granting `anon` broader baseline
     privileges elsewhere, which would weaken an unrelated guarantee).
   - Why: this local Supabase stack already restricts the `anon` role beyond function-level grants (observed, not
     assumed — the `throws_ok` 42501 call stayed green with the revoke line removed), so the two assertions are not
     equally sensitive to this one line in this environment. The privilege-level assertion is the correct, precise
     one for proving "the explicit revoke matters, because a new function is executable by anon by default" — it is
     the literal mechanism the plan's comment describes. Blocking Phase 2 on a discrepancy between the plan's
     prose and an environment-specific detail already covered by test 14 (anon still can't execute) would add no
     safety.
   - What would change it: a reviewer concluding the `throws_ok` 42501 assertion is *load-bearing on the revoke
     line specifically* (not on broader anon restrictions) in a different environment (e.g. production), in which
     case a documented note would be needed that local and production anon defaults can diverge.
2. **Fixed a pgTAP double-evaluation bug in my own new test, not inherited from the plan.**
   - Chosen: rewrite the one `is()` assertion that embedded `public.import_statement(…)` inside a
     `WHERE id = …` filter as two statements (a bare write, then a separate read-only assertion).
   - Rejected: wrapping the subquery in `WITH … AS MATERIALIZED (…)` to force single evaluation (works, but less
     readable and inconsistent with `import_rpc.test.sql`'s existing style); leaving it and hoping it was a one-off.
   - Why: confirmed by direct psql reproduction (see `## 3`) that Postgres re-evaluates a volatile function used as
     a per-row filter expression on a multi-row table — here, second call collided with the first call's own
     freshly-inserted exclusion-constraint key. The two-statement split matches the plan's own `import_rpc.test.sql`
     precedent and removes any ambiguity about evaluation count.
   - What would change it: nothing — this is a correctness fix for a bug I introduced, not a plan deviation.
