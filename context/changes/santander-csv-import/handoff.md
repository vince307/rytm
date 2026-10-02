# Handoff — `santander-csv-import` (slice S-10)

The `/10x-impl-review santander-csv-import` step of autonomous run `2026-10-01-m2-santander` reviewed all six phases,
re-ran every suite, verified the migration on the live local DB with two accounts, performed every `[reviewer]` row,
fixed one warning and recorded four observations. **Verdict `MERGE: CLEAR`.** The next agent must not get this
wrong: rows 5.6 and 6.6 are `[visual]` and still need real screenshots of every imports view — the reviewer's
headless wizard run (row 6.7) checked behaviour and text, it produced no screenshots and does not satisfy them.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/santander-csv-import`, cut from `main` at `1fed366` |
| Commits | 24 on top of `1fed366`; this step: `9621622` (fix), plus the docs commit carrying this handoff |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `impl_reviewed` |
| `## Progress` rows remaining | 6 (`grep -c '^- \[ \]' plan.md`): 5.6, 6.6 `[visual]`; 6.8–6.11 `[human]` |
| Working tree | clean after the docs commit (`tree-clean.sh` → `CLEAN`) |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `context/changes/santander-csv-import/reviews/impl-review.md` | Full review: verdicts, suites vs baseline, deliberate breaks, live-DB two-account proof, deploy-window proof, reviewer rows, findings F1–F5, ends with `MERGE: CLEAR — …` |
| `test/unit/santander-parser.test.ts` | New case "rule 5: a quoted card description whose tail holds a comma yields the tail, comma included" (synthetic, invented values) — F1, commit `9621622` |
| `src/lib/import/banks.ts` | Header comment reworded (where the bank literals live, `imports_source_check`) — F2, `9621622` |
| `src/lib/import/ing.ts` | Header comment reworded (separate line reader, not a copy) — F2, `9621622` |
| `context/changes/santander-csv-import/plan.md` | `## Progress` 1.6, 2.7, 3.6, 4.7, 6.7 ticked `— impl-review`; no Phase text touched |
| `context/changes/santander-csv-import/change.md` | `status: impl_reviewed` |
| `context/changes/santander-csv-import/handoff.md` | This file |

## 3. Verification

Baseline (contract, `main` `1fed366`): lint 0; astro check 0 (137 files); fixture:check OK; vitest 256/15 files;
build OK; pgTAP Files=5 Tests=102 PASS; smoke 140/0.

| Command | Result (observed in this step) |
| --- | --- |
| `git branch --show-current` | `feat/santander-csv-import` |
| `npm run lint` | 0 errors (baseline 0, Δ0) |
| `npx astro check` | 0 errors, 144 files (baseline 137, +7 new `.ts` files) |
| `npm run fixture:check` | ing OK, santander OK |
| `npm test` | 291 passed, 18 files (baseline 256/15, +35: schema 5, banks 6, santander-parser 13 incl. +1 F1, detect 11; +3 files) |
| `npm run build` | OK |
| `npx supabase db reset && npx supabase test db` (sandbox disabled) | Files=6, Tests=119, PASS (baseline 5/102, +1 file / +17: 15 new + 2 `domain_rls`) |
| `astro dev :4398` + `npm run smoke` | 147 PASS / 0 FAIL (baseline 140, +7), run three times incl. after the fix; port 4398 killed, 4398/4399 clear |
| Live DB, two accounts, `BEGIN … ROLLBACK` | Via both `import_statement` and `import_ing_statement`: B sees 0 of A's rows; update → 42501; delete → 0 rows; spoofed `user_id` insert → 42501; tx into A's import → 23503/42501; `user_id` key in `p_transactions` lands under the caller; unknown source → 23514; anon both RPCs and `select` → 42501; deleting A's `auth.users` row cascades A's imports+transactions to 0, B untouched |
| Deploy window | ING migration + `import_rpc`/`import_delete` tests unchanged vs `main`; PostgREST `rpc/import_ing_statement` with `main`'s five named args → import id (no ambiguity); `main`'s list select works; DB reset afterwards |
| Deliberate break 1 | Revoke line removed from the migration → pgTAP red (`has_function_privilege` assert); restored → PASS. Meta: the anon *call* assert stayed green (table grants also deny anon) — F3 |
| Deliberate break 2 | Per-bank refine in `schema.ts` `importPayloadSchema` → `true` → 2 schema cases red; restored → green |
| Deliberate break 3 | `santander.ts` `CARD` tail `(.+)$` → `([^,]+)$` → only the new F1 case red; restored → green. Meta: proves the fixture never covered this shape |
| Real exports (counts only, throwaway test deleted) | PLN → santander, 483 rows / 466 debits / 17 credits, 0 empty counterparties, 16 with comma, payload valid; USD → `wrongCurrency`. Shape comparator: R1 0% both files, one explained difference (`BBQ__QQB_`) |
| Privacy | 281 distinct values from the real exports: 0 hits in tracked files (excl. kit) and in the `main..HEAD` patch + messages |
| Headless wizard (Playwright fallback, outside repo, system Chrome) | Santander + ING imports, overlap block, patterns tail, ING delete — all as expected (row 6.7); cleanup deleted both imports; DB reset afterwards |

## 4. Next command

Visual gate for the imports views (list with ING + Santander rows, every wizard state: step 1 empty / Santander ready / ING ready / unknown / USD, step 2 Santander, step 3 Santander ready / overlap, result Santander + ING) at 1280 px and ~400 px per `.claude/skills/10x-autonomous-run/references/visual-gate.md` (Progress 5.6, 6.6) — then `/10x-archive santander-csv-import` and ship.

## 5. Open

- **[visual]** 5.6 list + results; 6.6 every wizard state — not done by this step.
- **[human] checklist:** 6.8 owner imports their real Santander PLN export locally (count/range match); 6.9 accept
  rule-7 deviation (Lp not stored); 6.10 accept K26 wording incl. "Rachunek"; 6.11 accept that S-11 re-keys
  Santander card patterns.
- **Carried risks:** PR preview cannot import until merge (production DB has no `import_statement` yet; do not add a
  fallback — review F5, plan-review F2); after a `vercel rollback` Santander imports read "ING · Rachunek"; R1 guarded
  only by the hand-run shape metric; Santander `title` keeps the masked card number (own data, RLS).
- **Observations recorded, not fixed:** F3 (`import_statement.test.sql` anon call assert proves table grants, the
  revoke is proven by the `has_function_privilege` assert); F4 (`banks.ts` `accountLabel` uses a string replacement,
  so `$&` in a name would be expanded — pre-existing, cosmetic; switch to `() => name` when S-11 touches the file).
- **Follow-ups:** none new; no `follow-ups/review-fixes.md` created (the only warning was fixed).
- **DESIGN-GAP:** none added by this step (K26 complete from Phase 6).
- **ARTIFACT GAP:** none.

## 6. Autonomous decisions

1. **Reviewed directly instead of spawning the skill's two subagents.**
   - Chosen: read every changed source/migration/test file in this session.
   - Rejected: plan-drift and safety subagents.
   - Why: the code diff is ~800 lines; direct reading gave full evidence for both dimensions without a lossy summary.
   - What would change it: a diff several times larger, or context near the ~300k limit.
2. **F1 (WARNING) fixed with a synthetic unit test, not a fixture change.**
   - Chosen: an inline invented row in `santander-parser.test.ts`.
   - Rejected: regenerating `test/fixtures/santander/` with a comma-tail row.
   - Why: the plan forbids editing `test/fixtures/**` in this slice; the inline row pins the behaviour, and break 3 proved it.
   - What would change it: S-11 needing that shape in the fixture's `expected.json` for its normaliser oracle.
3. **F4 recorded, not fixed.**
   - Chosen: OBSERVATION with a trigger (S-11 touching `banks.ts`).
   - Rejected: fixing it now.
   - Why: pre-existing behaviour from `main`, cosmetic only (output escaped); outside this slice's contract.
   - What would change it: an account name source that is not the user's own file (e.g. shared data).
4. **Ticked [reviewer] 6.7 from a headless Playwright run, not Claude-in-Chrome.**
   - Chosen: Playwright fallback driving the real wizard with fixture files on `:4398`.
   - Rejected: Claude-in-Chrome (reserved for the visual gate; the contract forbids selecting the browser myself).
   - Why: 6.7 checks behaviour (import, patterns, overlap, ING import/delete), which the DOM text proves; screenshots stay with 5.6/6.6.
   - What would change it: the visual gate finding a rendering defect that the DOM text check could not see.
5. **`MERGE: CLEAR` with `[visual]`/`[human]` rows open.**
   - Chosen: CLEAR.
   - Rejected: BLOCKED.
   - Why: the brief blocks only on an open CRITICAL, an unmet criterion, or a red suite; the open rows belong to later steps by design.
   - What would change it: the visual gate failing a state, which would re-open the slice before ship.
