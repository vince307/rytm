---
name: 10x-autonomous-run
description: Take the next roadmap slices through the full 10x chain — new, research, plan, plan-review, implement, impl-review, visual gate, archive, PR, CI, db push, merge to main, production deploy — with no human in the loop, one slice at a time in dependency order. The session supervises; every 10x step is a fresh agent that starts from the files the previous step wrote. Leaves a run folder an outsider can read without any transcript. Use when the user says "autonomous run", "10x-autonomous-run", "run the roadmap", "zrób resztę slice'ów", "uruchom autonomicznie", "poprowadź kolejne slice'y", or pairs roadmap slice ids with unattended execution.
---

# Autonomous roadmap run — Rytm (v2, supervised)

**Read `references/process.md` first — it is the binding process definition.** Then
`references/step-prompts.md` (what you dispatch), `references/gates.md` (what you check) and
`references/visual-gate.md` (screenshots).

v2 (2026-09-28) replaces the v1 Workflow pipeline (`legacy/pipeline-v1.workflow.js`, kept for reference only).
v1 shipped nothing on 2026-09-25: both failures were gate false positives a script could not judge. v2 shipped
three slices on 2026-09-27/28 with zero retries. Evidence: `context/runs/2026-09-27-s03-s02-s04/`
(`run-log.md`, `orchestration-notes.md`, `skill-proposal.md`) — local, gitignored.

You are the **orchestrator**. You never write product code and never read a subagent transcript. You prepare
branches, dispatch ONE fresh agent per step, check every gate yourself, keep the run log, and report.

---

## Step 0 — agree the rules with the maintainer (the only interactive step)

Before anything runs, while the maintainer is at the keyboard, confirm in one AskUserQuestion round (skip what
they already said):

1. **Slices** — explicit list, `--next N`, or `--all` (topological order from the roadmap). Mention a slice that
   writes data to production (e.g. S-09 demo seed) as a separate risk.
2. **How far** — full ship (PR → CI → hosted `db push` → merge → deploy, the standing authorisation of
   2026-09-25) or stop at an open PR.
3. **On failure** — park and continue independent slices (default) or stop the run.

Then **select the browser for screenshots**: `mcp__claude-in-chrome__list_connected_browsers`; if more than one
is connected, AskUserQuestion with one option per browser (display name + deviceId) plus the exact option "Open a
confirmation screen in every connected Chrome extension and let me select the right one there.", then
`select_browser` / `switch_browser`. Subagents inherit the selection. If no browser is connected, the visual gate
uses the Playwright fallback — say so.

Write the agreed rules into the run log (`## Rules agreed with the maintainer`). **After Step 0, never call
AskUserQuestion again** — decide, record, continue.

## Step 1 — validate, preflight, baseline (sandbox DISABLED for Docker, gh, network)

```bash
bash .claude/skills/10x-autonomous-run/scripts/validate-rule-files.sh   # fix + commit anything it reports
git switch main && git pull --ff-only
.claude/skills/10x-autonomous-run/scripts/tree-clean.sh                # CLEAN
gh auth status                                                         # vince307; x509 error = sandbox, not auth
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:54321/rest/v1/   # local Supabase up (any HTTP code)
npx supabase projects list >/dev/null && cat supabase/.temp/project-ref  # psqbtvooufapkatpkxlw, token valid
lsof -ti :4398 -ti :4399                                               # empty (:4321 is the maintainer's — never touch)
gh run list --branch main --limit 1                                    # green — never start on a red main
.claude/skills/10x-autonomous-run/scripts/baseline.sh                  # the baseline line for the contract
```

Anything red, dirty or unauthenticated stops the run. Say which, and stop.

## Step 2 — resolve the slices

Read `context/foundation/roadmap.md` (`## At a glance` + each `### S-NN`). Order topologically. Refuse a slice
that is `blocked`, whose prerequisite is neither `done` nor earlier in the run. For each slice note its state:

- **fresh** — no branch, no change folder → start at `new`;
- **resumable** — `feat/<id>` exists (local or origin) with a change folder → read its `handoff.md` §4 on the
  branch (`git show feat/<id>:context/changes/<id>/handoff.md`); resume at that step. If the branch predates
  `main`, the orchestrator runs `git merge main` into it (never rebase a pushed branch) and the first step is a
  **new-refresh**;
- **someone's half-done work** without a handoff → refuse, say why.

## Step 3 — scaffold the run folder

```bash
RUN_ID="$(date +%Y-%m-%d)-<short-name>"; R="context/runs/$RUN_ID"; mkdir -p "$R"
cp .claude/skills/10x-autonomous-run/references/agent-contract.md   "$R/"
cp .claude/skills/10x-autonomous-run/references/run-log-template.md "$R/run-log.md"
```

Fill every `<<< >>>` slot (an unfilled slot is a bug); delete the template's "Copy to…/Fill before…" lines. Start
`$R/orchestration-notes.md` (what you did per step, interventions, false positives, "Skill change:" proposals).
`context/runs/` is gitignored — never commit it.

## Step 4 — drive each slice (serial)

For each slice, in order:

1. **Branch** (orchestrator): fresh → `git switch main && git pull --ff-only && git switch -c feat/<id>`;
   resumable → `git switch feat/<id>` (+ `git merge main` if behind). Agents never switch branches.
2. **Steps**: new → research → plan → plan-review → implement **phase by phase** → impl-review → visual (UI
   slices) → archive + ship. Dispatch each with the literal prompt from `references/step-prompts.md`, the model
   from its table, `run_in_background: true`. One step at a time; wait for the notification.
3. **Gate** after every step (`references/gates.md`), then one line in `run-log.md` (status table + log) and, when
   something is worth learning, an entry in `orchestration-notes.md`.
4. **Failure**: a real gate failure → re-dispatch that step once with the failed check quoted; the same gate fails
   twice, a `VERDICT: RETHINK`, a `MERGE: BLOCKED`, or a ship `BLOCKED` → **park**: WIP committed by path, branch
   pushed, PR (if any) left open with a comment, back to a clean `main`. Dependent slices are skipped; independent
   ones continue (unless Step 0 said stop).
5. **After ship**: verify on GitHub + Supabase (gates.md § ship), re-baseline, rewrite the contract's baseline
   line, next slice.

While it runs: no other work in this repo, no branch switching by anyone but you.

## Step 5 — close the run

Every slice appears in exactly one of shipped / failed / skipped (a missing one is a reporting bug). Verify:

```bash
git switch main && git pull --ff-only && git log --oneline -10
gh pr list --state all --limit 10 && gh run list --branch main --limit 5
grep -nE '^\| S-' context/foundation/roadmap.md
npx supabase migration list
```

Append `# RUN COMPLETE` to the run log and report in Polish: (1) shipped — PRs, merge shas, deploys, migrations;
(2) failed/skipped, one line each, where the branch was left; (3) autonomous decisions worth a second look;
(4) what needs a human (`[human]` rows, follow-ups, DESIGN-GAPs); (5) the command to continue. Fold the run's
"Skill change:" notes into a short proposal for this skill.

## What this skill must never do

- Never call `AskUserQuestion` after Step 0.
- Never force-push, never push directly to `main`, never `--no-verify`, never `vercel --prod`, never
  `npm run smoke` against production, never `supabase db reset` against the hosted project, never roll back
  (rollback is human: `vercel rollback` / `vercel promote`).
- Never merge a PR whose CI is not green or whose impl-review says `MERGE: BLOCKED`.
- Never `supabase db push` a migration that is not on a branch whose CI is green.
- Never read a subagent transcript, never continue an agent via SendMessage to do the next step. If the answer is
  not in an artifact, the artifact is the defect.
