# Step prompts — the literal text the orchestrator dispatches

Every step is ONE fresh `Agent` (`subagent_type: general-purpose`, `run_in_background: true`). Never continue an
agent with SendMessage, never fork: the next step must be able to start from the files alone. These prompts
worked first try on every step of the 2026-09-27 run (S-03 resume, S-02, S-04; 0 retries).

Placeholders: `<RUN>` run id · `<FN>` roadmap id (`S-04`) · `<ID>` change id · `<D>` change dir
(`context/changes/<ID>`) · `<N>` phase number · `<NEXT>` the next step's command.

**Rule for the orchestrator:** the prompt carries PROCESS rules only (what is not in any file). If you want to add
a slice-specific fact, it belongs in an artifact — that is an ARTIFACT GAP; log it in `orchestration-notes.md`.

## Model per step

| Step | Model | Why |
|---|---|---|
| new, research, plan, plan-review | session's strongest (default) | judgement, product reading |
| implement (per phase) | `sonnet` | working tier (course rule: route by phase); escalate to default only if the same gate fails twice |
| impl-review, visual | strongest (default) | review + security + visual judgement |
| archive + ship | strongest (default) | irreversible actions |
| diagnostics (e.g. "is Chrome selected?") | `haiku` | trivial |

## Header (every step)

```
You are ONE step of supervised autonomous run <RUN> in the repo /Users/kamilp/Dev/10xDevs40/Rytm. You are a fresh
session: everything you need is on disk. Read, in this order:
  1. context/runs/<RUN>/agent-contract.md   (binding rules)
  2. <D>/handoff.md                         (state + "## 4. Next command")
  3. <step-specific inputs>
Slice <FN> `<ID>`, branch feat/<ID> (checked out by the orchestrator — confirm with `git branch --show-current`;
otherwise STOP, BLOCKED). Change dir: <D>.
```

## Footer (every step except ship)

```
Finish: rewrite <D>/handoff.md per .claude/skills/10x-autonomous-run/references/handoff-schema.md (six headings,
exact text; §4 Next command = `<NEXT>`), commit `<message>` staging by explicit path (never .gitignore or
.claude/skills/10x-autonomous-run/). Do not push. Report ≤12 lines: <step-specific>, any `ARTIFACT GAP: …`.
Last line: `STATUS: DONE | BLOCKED | NEEDS_CONTINUATION — <one clause>`.
```

## Bodies

### new (fresh slice)
Inputs: `context/foundation/roadmap.md` (`## At a glance` + `### <FN>`), PRD refs, and the two most recently
archived slices as worked examples + the code you build on.
```
STEP: `/10x-new <ID>` via the Skill tool.
- Every claim in the roadmap block is a PLAN-TIME claim. Check each against the repo NOW (earlier slices shipped
  since) → "roadmap claim | repo now | correction" table in change.md. Name the kit views
  (design/rytm-os/prototype/) and content.json keys this slice binds; kit has no view → DESIGN-GAP, never invented.
  State whether a migration is expected.
- List every open follow-up in context/archive/*/follow-ups/review-fixes.md whose `Trigger:` names this slice,
  with your take on scope.
- Never AskUserQuestion. The skill says STOP and wait — decide; record under `## Autonomous decisions` in change.md
  (chosen, rejected, why, what would change the answer).
```
NEXT = `/10x-research <ID>` · commit `docs(<ID>): change identity (autonomous run)`.

### new-refresh (resuming a branch that predates the latest main)
The orchestrator has already `git merge main` into the branch (never rebase a pushed branch).
```
STEP: `/10x-new <ID>` — REFRESH, not re-create. The folder exists from an earlier run; since then <slices> shipped.
Re-verify EVERY roadmap claim in change.md against the repo NOW, update the table, kit binding and keys, bump
`updated:`, keep the status. If the skill would overwrite the folder, edit change.md in place instead.
```
NEXT = the step after the last completed one · commit `docs(<ID>): odświeżenie tożsamości zmiany po <FN-prev>`.

### research
```
STEP: `/10x-research <ID>` via the Skill tool. Output: <D>/research.md.
- Never AskUserQuestion; derive the question/scope from change.md (roadmap corrections, open unknowns, triggered
  follow-ups).
- Source-backed: file + SYMBOL, never line numbers. Resolve the unknowns with evidence (cite the PRD section;
  where the PRD is silent or contradicts itself, say so and recommend).
- Schema questions: existing migrations + pgTAP are the pattern. Live-DB experiments ONLY inside BEGIN … ROLLBACK
  (sandbox disabled for 127.0.0.1:54321).
- Kit: bound views, existing shared components (src/components, ui/), exact kit copy vs gaps.
- Research only — no product code.
```
NEXT = `/10x-plan <ID>` · commit `docs(<ID>): research`.

### plan
Inputs add: a recent archived plan.md as the format example.
```
STEP: `/10x-plan <ID>` via the Skill tool. Output: plan.md with `## Progress`.
- Never AskUserQuestion. Decide every open choice — incl. product questions research answered with a
  recommendation — and record under `## Autonomous decisions` (chosen, rejected, why, what would change it). Where
  you decide against the PRD's literal text, say so AND add a `[human]` Progress row naming the decision.
- Code phases only (the run ships). Phases SMALL and independently green — each is implemented by a separate
  fresh agent: ≤ ~2 new UI components per phase (a 4-component UI phase cost 320k tokens). Each phase: automated
  criteria as baseline + delta (baseline in the contract), a DELIBERATE BREAK + meta-check, the full local gate
  (+ `npm run db:types` after a migration).
- The LAST phase includes a seam-sweep row: duplicated helpers/classes, stale comments or kit rows left by earlier
  phases.
- Manual rows carry an owner tag: `[reviewer]`, `[visual]`, `[human]`. Screenshot rows name every state, desktop
  + ~400 px.
- Migrations: CLAUDE.md rules are hard (name format, RLS per operation per role, user_id FK on delete cascade,
  pgTAP proof).
```
NEXT = `/10x-plan-review <ID>` · commit `docs(<ID>): plan`.

### plan-review
```
STEP: `/10x-plan-review <ID>` via the Skill tool. Output: <D>/reviews/plan-review.md.
- Never AskUserQuestion. Check claims against the CODE, not the plan's word.
- Check every open follow-up whose `Trigger:` names this slice: included, or deferral convincingly justified.
- Scrutinise product decisions against the PRD; overturn only if clearly wrong, else make sure a `[human]` row
  names them.
- Each phase independently green and sized for one fresh agent; split/merge if not, keep Progress consistent.
- Triage into plan.md yourself: CRITICAL → fix; WARNING → fix if obvious else `## Known risks`; OBSERVATION → record.
- File ends with exactly: `VERDICT: PROCEED — <reason>` or `VERDICT: RETHINK — <reason>` (RETHINK = approach
  fundamentally wrong; then do NOT edit plan.md). On PROCEED set change.md status plan_reviewed.
```
NEXT = `/10x-implement <ID> phase 1` · commit `docs(<ID>): plan review`.

### implement — phase N (model: sonnet)
```
STEP: `/10x-implement <ID> phase <N>` via the Skill tool — PHASE <N> ONLY; stop after it is committed.
(Last phase: then run the skill's epilogue → status implemented, even with [reviewer]/[visual]/[human] rows open.)
- Never AskUserQuestion; every confirmation / commit-message / between-phase prompt → decide, then proceed (and
  stop after this phase); record in handoff §6.
- UI: design kit is the source of truth; missing kit UI/copy → DESIGN-GAP, never invented. Endpoints: uppercase
  POST, prerender = false, zod, auth guard — mirror the existing ones.
- Rows tagged [reviewer]/[visual]/[human] are NOT yours. Never tick a row you did not verify.
- Implement, run the phase criteria, DELIBERATE BREAK + META-CHECK (suite stays green → wrong break), restore,
  then the full local gate (contract § Verification). Only on green: ONE commit `feat(<ID>): <title> (p<N>)`,
  staged by path, never --no-verify. Append ` — <sha>` to each ticked row.
- Do not push, no PR, no `supabase db push`.
```
NEXT = `/10x-implement <ID> phase <N+1>` (last phase: `/10x-impl-review <ID>`) · report: sha, suites
baseline + delta, break red→green, rows ticked/left.

### impl-review
```
STEP: `/10x-impl-review <ID>` via the Skill tool.
- Never AskUserQuestion. RE-RUN every suite yourself; reconcile against the contract baseline with arithmetic;
  re-execute at least one deliberate break.
- If implemented phase by phase: look for seams (duplicated helpers, stale comments, a later phase silently
  changing an earlier contract).
- Migration: verify on the LIVE local DB after `db reset` with TWO accounts (read/insert/update/delete of the
  other's rows, spoofed user_id, anon, cascade from account delete). It will be pushed to production — any defect
  is CRITICAL.
- Write endpoints: auth guard, zod, user_id never from the form, CSRF posture as the repo's other POSTs, no open
  redirect.
- [reviewer] rows are YOURS: perform, tick only if they pass.
- Triage: CRITICAL → fix + `fix(<ID>): poprawki z przeglądu implementacji`; WARNING → fix if cheap, else
  follow-ups/review-fixes.md with a `Trigger:` line; OBSERVATION → record. Files + SYMBOLS.
- File ends with exactly: `MERGE: CLEAR — <reason>` or `MERGE: BLOCKED — <reason>` (BLOCKED iff, after fixes: an
  open CRITICAL, an unmet criterion, or a red suite; warnings never block).
```
NEXT = visual gate (UI slice) or `/10x-archive <ID>` then ship.

### visual
Inputs add: `.claude/skills/10x-autonomous-run/references/visual-gate.md` (binding) and the previous slice's
`reviews/visual-review.md` + `screenshots/README.md` as the worked example.
```
STEP: visual gate for <views>, per references/visual-gate.md: Claude-in-Chrome first (the browser was selected at
preflight — never select or switch it yourself), Playwright fallback (scripts/visual-capture.mjs). Ports 4398/4399
only. Every [visual] state, desktop 1440 + ~400 px, plus kit frames. Hand-check one number where the view shows
computed values. Fix real discrepancies, re-run the gate after fixes. End visual-review.md with the VISUAL line.
Tick [visual] rows only for what you captured and verified; leave [human] open.
```
NEXT = `/10x-archive <ID>` then ship (say whether a hosted `db push` is due) · commit
`docs(<ID>): bramka wizualna` (+ `fix(<ID>): …`), screenshots included.

### archive + ship
```
STEP: ARCHIVE + SHIP. Standing authorisation (see agent-contract § Git) for every action below. Sandbox DISABLED
for git push, gh, supabase. In order:
  1. ARCHIVE — `/10x-archive <ID>`; answer its prompts (archive; open [human] rows are a post-run checklist, not a
     blocker; record why). Check the roadmap At-a-glance row says done AND refresh `## Backlog Handoff` (this row
     + "Ready for /10x-plan" of dependents). Restate any trigger the handoff §5 asks to restate. Before pushing,
     write the handoff's final pre-merge state (§1: "PR/CI/merge/deploy recorded in context/runs/<RUN>/run-log.md";
     §4: `none — shipped`) so the archived copy is not stale.
  2. PUSH + PR — `git push -u origin feat/<ID>`; `gh pr create --base main` with a Polish body: outcome, phases,
     migrations, verification (baseline + delta), review + visual verdicts, follow-ups, autonomous decisions, and
     „Do decyzji właściciela produktu” listing every open [human] row.
  3. CI — `gh pr checks --watch`. Red → `gh run view --log-failed`, fix, local gate, commit `fix(<ID>): CI …`, push.
     Max 2 rounds, then BLOCKED (PR open with a comment; NO db push).
  4. HOSTED DB — only if `git diff --name-only main...HEAD -- supabase/migrations` is non-empty, only after CI is
     green: `npx supabase db push --dry-run` must list exactly this branch's migrations (else BLOCKED, push
     nothing); `npx supabase db push`; `npx supabase migration list` local = remote. BEFORE the merge.
  5. MERGE — all checks green: `gh pr merge --merge --delete-branch`; `git switch main && git pull --ff-only`.
  6. DEPLOY — `gh run watch <merge-sha run> --exit-status`: ci, smoke, deploy success. Failure: no revert, no
     vercel, no DB action — BLOCKED with the run URL.
  7. Commit nothing on main; tree clean per scripts/tree-clean.sh.
NEVER: smoke against production, `vercel --prod`, --no-verify, force-push, merge on red/pending, hosted db reset,
touching :4321.
Report ≤12 lines: PR URL, CI, migrations (dry-run + list), merge sha, deploy run + result, git status.
Last line: `STATUS: SHIPPED | BLOCKED — <one clause>`.
```
