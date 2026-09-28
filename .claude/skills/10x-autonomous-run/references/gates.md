# Gates — what the orchestrator checks after every step

The orchestrator checks every gate ITSELF, with shell commands, before dispatching the next step. It never takes
the agent's report as proof, and never reads a subagent transcript. A gate is 1–2 commands; if it needs more, the
artifact is the defect.

`$D` = `context/changes/<id>` (after archive: `context/archive/<created>-<id>`).

## Every step

```bash
git branch --show-current                                   # feat/<id> (main after ship)
.claude/skills/10x-autonomous-run/scripts/tree-clean.sh     # CLEAN
for h in '## 1\. State' '## 2\. Artifacts' '## 3\. Verification' '## 4\. Next command' '## 5\. Open' '## 6\. Autonomous decisions'; do
  grep -q "^$h" $D/handoff.md || echo "MISSING: $h"; done
sed -n '/^## 4/,/^## 5/p' $D/handoff.md                     # = the step you expect next
lsof -ti :4398 -ti :4399                                    # empty — no stray run server
```

## Per step

| Step | Extra check |
|---|---|
| new / new-refresh | `grep -c '^## Autonomous decisions' $D/change.md` = 1 |
| research | `npx supabase test db` still PASS (the agent may have experimented on the local DB) |
| plan | Progress row count; every manual row has an owner tag: `grep -E '^\s*- \[ \]' $D/plan.md \| grep -vE '\[(reviewer\|visual\|human)\]'` lists only automated rows |
| plan-review | `tail -1 $D/reviews/plan-review.md` = `VERDICT: PROCEED — …` (RETHINK → park the slice, plan untouched) |
| implement phase N | `git log --oneline -3` shows `(pN)`; phase-N automated rows ticked with ` — <sha>`; quick independent re-run: `npm test` + `npx supabase test db` |
| impl-review | `tail -1 $D/reviews/impl-review.md` = `MERGE: CLEAR — …`; only `[visual]`/`[human]` rows left |
| visual | `tail -1 $D/reviews/visual-review.md` = `VISUAL: …`; `file $D/screenshots/*.png` (real PNGs, sane sizes); **open ONE screenshot yourself** and check it against the fixture (catches blank/faked captures); only `[human]` rows left; if the agent touched the DB: grants/pgTAP intact |
| ship | `gh pr view <n> --json state,mergeCommit`; `gh run view <id> --json conclusion,headSha,jobs` = ci/smoke/deploy success on the merge sha; roadmap row `done`; archive folder exists; `npx supabase migration list` local = remote |

## After every ship (orchestrator, on main)

1. `scripts/baseline.sh` → paste the line into the run's `agent-contract.md` as "Baseline on main after <slice>".
   (Or take the numbers the impl-review + visual steps measured on the merged code and CI confirmed — say which.)
2. Update `run-log.md`: status row, a log line with PR / merge sha / deploy run / migrations.

## Judging a failed gate

A failed check is first a question: **is the failure real?** v1 lost a finished slice to a dirty-tree check that
contradicted the contract, and another to a verifier reading the wrong tree. Look at the evidence (a `git show
feat/<id>:<path>` settles "is the file on the branch"). Real → re-dispatch the step once with the failed check
quoted; same gate fails twice → park the slice. False positive → log it in `orchestration-notes.md` and proceed.
