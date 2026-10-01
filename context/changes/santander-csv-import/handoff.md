# Handoff — `santander-csv-import` (slice S-10)

The `/10x-plan-review santander-csv-import` step of autonomous run `2026-10-01-m2-santander` wrote this handoff. The
plan is reviewed (verdict PROCEED, REVISE → SOUND after triage), 5 findings fixed in `plan.md`, and `change.md` is
`plan_reviewed`. The next agent must not get this wrong: the ING path stays byte-identical (`import_ing_statement`,
`import_rpc.test.sql`, `import_delete.test.sql`, every existing ING smoke step), and the new `import_statement` RPC is
security invoker with `revoke … from public, anon` — `user_id` only from the `auth.uid()` default, never the payload.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/santander-csv-import`, cut from `main` at `1fed366` |
| Commits | 4 on top of `1fed366`: identity, research, plan, and `docs(santander-csv-import): plan review` (this step) |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `plan_reviewed` |
| `## Progress` rows remaining | 43 (`grep -c '^- \[ \]' plan.md`; was 42, +6.11 from review F3) |
| Working tree | clean after the commit, except for files this step did not touch |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `context/changes/santander-csv-import/reviews/plan-review.md` | Plan review: 0 critical, 3 warnings, 3 observations, triage decisions, `VERDICT: PROCEED` |
| `context/changes/santander-csv-import/plan.md` | Triage edits: Phase 2 `user_id` contract + pgTAP case (F4); Phase 3 smoke `accountName: "Rachunek"` (F1); Phase 6 wizard keeps the `file.size` pre-read check (F5); Phase 6 `[human]` bullet + Progress 6.11 (F3); two Known-risks entries (F2 previews, F6 card mask) |
| `context/changes/santander-csv-import/change.md` | Frontmatter `status: planned → plan_reviewed` |
| `context/changes/santander-csv-import/handoff.md` | This file |

## 3. Verification

| Command | Result (observed in this step) |
| --- | --- |
| `git branch --show-current` | `feat/santander-csv-import` |
| Grounding (ls / grep of plan paths and symbols) | 12/12 paths, 11/11 symbols, brief↔plan consistent |
| `grep -c '^- \[ \]' plan.md` | 43; every Success Criteria bullet has a Progress row (6.11 added with its bullet) |
| Code checks | `import_ing_statement` is security invoker with explicit revoke; `imports.user_id default auth.uid()` + `with check` insert policy; previews share the production DB (`deploy-plan.md`) |

No product code changed, so lint, astro check, vitest, build, pgTAP and smoke were not run. The contract baseline
(`1fed366`: lint 0, astro check 0 (137 files), fixture:check OK, vitest 256 (15 files), build OK, pgTAP Files=5
Tests=102, smoke 140/0) is inherited and unverified here.

## 4. Next command

`/10x-implement santander-csv-import phase 1`

## 5. Open

**Phases** (each for a fresh implement agent), unchanged in shape:

1. Comparator F-03 F9 + R1 metric in `scripts/fixture-santander-shape.mjs` `same` / `shape`.
2. Migration `…_import_statement_source.sql`, `import_statement.test.sql` (incl. the foreign-`user_id` element case),
   `domain_rls.test.sql` extension, `db:types`.
3. `banks.ts`, schema `source` + conditional `bankTxId`, endpoint `rpc("import_statement")`, smoke +5 in the
   re-created-account block (`santanderPayload.accountName = "Rachunek"`).
4. `common.ts`, `santander.ts`, `detect.ts`, `santander-parser.test.ts`, `detect.test.ts`.
5. Per-bank `accountLabel` in `index.astro` / `result.astro`, smoke +2.
6. Wizard on `readImportFile` (keep `file.size` check in `readStatement`), K26 copy and register, docs notes, seam
   sweep.

**Manual-only Progress rows (checklist):**

- 1.6 [reviewer] Real-export comparison (sandbox off, symlink dir from the contract).
- 2.7 [reviewer] Migration review.
- 3.6 [reviewer] ING smoke steps byte-identical.
- 4.7 [reviewer] Reader vs rules 1–6.
- 5.6 [visual] List and result.
- 6.6 [visual] Every wizard state at 1280 and ~400 px.
- 6.7 [reviewer] Full local Santander import.
- 6.8 **[human]** Import the owner's real export locally.
- 6.9 **[human]** Accept the rule-7 deviation (Lp not stored).
- 6.10 **[human]** Accept the K26 wording, including "Rachunek".
- 6.11 **[human]** Accept that S-11 re-keys Santander card patterns (new, review F3).

**DESIGN-GAP to add in implement:** K26 (Phases 5–6) in `context/foundation/design-kit.md`, `src/content/copy.ts`
`copyExtra.imports`. No G-row.

**Follow-ups:** F-03 F9 taken in Phase 1. F-03 O1 and ING F8 not triggered. No new follow-up file from this review.

**Carried risks** (plan.md § Known risks): S-11 re-keys Santander patterns; R1 guarded only by the manual comparator;
rollback shows "ING · Rachunek"; the PR preview (production DB) cannot import until merge — expected, no fallback;
Santander `title` holds the masked card number (own data, RLS).

## 6. Autonomous decisions

1. **Verdict PROCEED, no RETHINK.**
   - Chosen: keep option A and the 6-phase structure. Rejected: restructuring.
   - Why: every risky claim checked against the code held (old RPC shape, grants, constraint name, smoke block,
     wizard seams).
   - What would change it: a local proof that the new function needs definer rights, or the smoke re-created block
     disappearing.
2. **F2 handled as a Known risk, not a code fallback.**
   - Rejected: endpoint falls back to `import_ing_statement` on a missing function.
   - Why: production order (migration before code) makes it dead code; it only helps the preview.
   - What would change it: a preview-smoke job becoming a gate before merge.
3. **F3 added as `[human]` 6.11** rather than pulling S-11's normaliser into S-10.
   - Why: the roadmap splits them and the window between slices is short.
   - What would change it: S-11 slipping out of this run, leaving users to save thresholds on raw-tail keys.
4. **No phase split/merge.**
   - Why: each phase is green alone and fits one agent; Phase 6 is the largest but mostly copy and greps.
   - What would change it: the Phase 6 agent hitting context limits — then split the seam sweep into its own phase.
5. **Review run without a sub-agent.**
   - Why: the risky claims were few and on known files; direct reads were cheaper.
   - What would change it: a plan touching unfamiliar modules.
