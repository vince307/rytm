// LEGACY (v1, 2026-09-25) — superseded by the supervised process in SKILL.md / references/process.md.
// Kept for reference only: do NOT run. It shipped nothing; see context/runs/2026-09-25-roadmap-all/.
// Autonomous roadmap run — the pipeline (Rytm).
//
// Invoked by the `/10x-autonomous-run` skill AFTER preflight, as:
//   Workflow({ scriptPath: ".claude/skills/10x-autonomous-run/pipeline.workflow.js",
//              args: { runId, slices: [{ fn, id, intent, requires }] } })
//
// Ported from the 10xDevs run of 2026-08-22. Differences, and why:
//   * SERIAL. One slice at a time, each cut from a freshly pulled main. The roadmap
//     is nearly a chain and all worktrees would share one local Supabase, so
//     concurrency buys little and costs a class of cross-run DB corruption.
//   * SHIPS. Archive -> PR -> CI green -> supabase db push -> merge -> deploy watched.
//     Authorised by the maintainer on 2026-09-25.
//
// A workflow script has NO filesystem access, so every gate is a separate, cheap
// VERIFIER AGENT that runs `ls`/`grep`/`gh` and returns a structured verdict. The
// script branches on the verifier, never on the working agent's self-report — in
// the source run an agent twice reported success having written nothing.

export const meta = {
  name: '10x-autonomous-run',
  description: 'Take roadmap slices through the full 10x chain and ship each to production, serially, no human in the loop',
  whenToUse: 'Invoked by the /10x-autonomous-run skill after preflight. Not run directly.',
  phases: [
    { title: 'Intake',     detail: '/10x-new on feat/<id> — verify the roadmap slice against the repo' },
    { title: 'Research',   detail: '/10x-research' },
    { title: 'Plan',       detail: '/10x-plan' },
    { title: 'PlanReview', detail: '/10x-plan-review + autonomous triage' },
    { title: 'Implement',  detail: '/10x-implement, one commit per phase, only on green' },
    { title: 'ImplReview', detail: '/10x-impl-review with a machine MERGE line' },
    { title: 'Visual',     detail: 'screenshot gate against design/rytm-os/prototype for slices with UI' },
    { title: 'Ship',       detail: 'archive, PR, CI, db push, merge to main, deploy watched' },
    { title: 'Scribe',     detail: 'run-log after each slice and at the end' },
  ],
}

const RUN_ID   = args?.runId
const SLICES   = args?.slices ?? []
const RUN_DIR  = `context/runs/${RUN_ID}`
const CONTRACT = `${RUN_DIR}/agent-contract.md`
const SKILL    = '.claude/skills/10x-autonomous-run'

if (!RUN_ID || SLICES.length === 0) {
  throw new Error('args must carry { runId, slices[] } — the skill fills these after preflight')
}

// --- schemas ---------------------------------------------------------------

const GATE = {
  type: 'object',
  properties: {
    pass:     { type: 'boolean', description: 'true only if EVERY check passed' },
    failed:   { type: 'array', items: { type: 'string' }, description: 'the checks that failed, verbatim' },
    evidence: { type: 'string', description: 'real command output you based this on, trimmed' },
  },
  required: ['pass', 'failed', 'evidence'],
  additionalProperties: false,
}

const STEP_REPORT = {
  type: 'object',
  properties: {
    status:    { type: 'string', enum: ['OK', 'NEEDS_CONTINUATION', 'BLOCKED'] },
    artifacts: { type: 'array', items: { type: 'string' } },
    headline:  { type: 'string', description: 'at most two sentences, for the run log' },
    decisions: { type: 'array', items: { type: 'string' }, description: 'autonomous decisions, one line each' },
  },
  required: ['status', 'artifacts', 'headline'],
  additionalProperties: false,
}

const REVIEW_REPORT = {
  type: 'object',
  properties: {
    verdict:     { type: 'string', enum: ['SOUND', 'REVISE', 'RETHINK', 'APPROVED', 'NEEDS_ATTENTION', 'REJECTED'] },
    critical:    { type: 'integer' },
    warnings:    { type: 'integer' },
    merge:       { type: 'string', enum: ['CLEAR', 'BLOCKED', 'N/A'], description: 'impl-review only: BLOCKED iff >=1 critical, an unmet success criterion, or a red suite. plan-review: N/A' },
    mergeReason: { type: 'string' },
    hasUI:       { type: 'boolean', description: 'true if the slice adds or changes anything a user sees in the browser' },
    headline:    { type: 'string' },
  },
  required: ['verdict', 'critical', 'warnings', 'merge', 'mergeReason', 'hasUI', 'headline'],
  additionalProperties: false,
}

const SHIP_REPORT = {
  type: 'object',
  properties: {
    status:        { type: 'string', enum: ['SHIPPED', 'BLOCKED'] },
    pr:            { type: 'string', description: 'PR URL, or "none"' },
    mergeCommit:   { type: 'string', description: 'sha on main, or "none"' },
    migrations:    { type: 'array', items: { type: 'string' }, description: 'migration files pushed to the hosted DB' },
    ciFixRounds:   { type: 'integer' },
    deploy:        { type: 'string', description: 'conclusion of the main CI run incl. the deploy job, with its run URL' },
    blockedReason: { type: 'string' },
    headline:      { type: 'string' },
  },
  required: ['status', 'pr', 'mergeCommit', 'migrations', 'ciFixRounds', 'deploy', 'headline'],
  additionalProperties: false,
}

// --- helpers ---------------------------------------------------------------

const changeDir = (id) => `context/changes/${id}`
// After /10x-archive the folder lives under context/archive/<created>-<id>/.
const anyDir = (id) => `$(ls -d ${changeDir(id)} context/archive/*-${id} 2>/dev/null | head -1)`

function brief(s, body) {
  return `You are ONE step of autonomous run \`${RUN_ID}\`. Roadmap slice ${s.fn}: \`${s.id}\`.
Slice outcome: ${JSON.stringify(s.intent)}

READ FIRST, in full, in this order:
  1. ${CONTRACT}                                   — the standing brief; it binds you
  2. ${SKILL}/references/handoff-schema.md
  3. context/foundation/roadmap.md — the \`### ${s.fn}\` block (Outcome, Prerequisites, Risk, Unknowns)
  4. ${changeDir(s.id)}/handoff.md                 — if it exists, this is your input

NON-NEGOTIABLE:
  * NEVER call AskUserQuestion. Where your skill tells you to ask, or to STOP and
    wait, decide instead and record it under \`## Autonomous decisions\` with what you
    chose, what you rejected, why, and WHAT WOULD CHANGE THE ANSWER.
  * You work in the MAIN checkout on branch \`feat/${s.id}\`. Confirm with
    \`git branch --show-current\` before writing anything; if you are on another
    branch, STOP and return BLOCKED.
  * Rewrite ${changeDir(s.id)}/handoff.md before returning (all six numbered headings,
    exact text — a verifier greps for them) and COMMIT your artifacts on feat/${s.id}.
  * Anchor on symbols, never line numbers. Success criteria use baseline + delta,
    never absolute counts.
  * Anything touching Docker, the local Supabase (127.0.0.1:54321), gh or the network:
    run Bash with the sandbox DISABLED.
  * Return at most 12 lines.

${body}`
}

const HANDOFF_HEADINGS = `'## 1\\. State' '## 2\\. Artifacts' '## 3\\. Verification' '## 4\\. Next command' '## 5\\. Open' '## 6\\. Autonomous decisions'`
const handoffChecks = (id) => [
  `D=${anyDir(id)}; test -f "$D/handoff.md" && echo HANDOFF_OK`,
  `D=${anyDir(id)}; for h in ${HANDOFF_HEADINGS}; do grep -q "^$h" "$D/handoff.md" || echo "MISSING: $h"; done` +
    ` — ANY "MISSING:" line means this check FAILED`,
  `git branch --show-current — must print feat/${id}`,
]

// Do the work, then have an independent agent check the artifacts landed. One
// re-dispatch, then the slice fails rather than poisoning downstream steps.
async function gated({ s, label, phaseName, body, checks, schema, effort }) {
  let last = null
  let out  = null
  for (let attempt = 1; attempt <= 2; attempt++) {
    const retry = attempt === 1 ? '' : `

RETRY ${attempt}/2 — the previous attempt left required artifacts missing:
${JSON.stringify(last?.failed ?? [])}
Do the step and WRITE AND COMMIT THE FILES. Do not report success without them.`

    out = await agent(brief(s, body + retry), { label: `${label}:${s.id}`, phase: phaseName, schema, effort })

    last = await agent(
      `Verification only. Change nothing, fix nothing, infer nothing.
Run each check with Bash from the repo root (/Users/kamilp/Dev/10xDevs40/Rytm; sandbox
disabled for gh/supabase) and report what you actually observed.

${checks.map((c, i) => `${i + 1}. ${c}`).join('\n')}

\`pass\` is true only if EVERY check passed. Put real command output in \`evidence\`.`,
      { label: `gate:${label}:${s.id}`, phase: phaseName, schema: GATE, effort: 'low' }
    )

    if (last?.pass) return out ?? {}
    log(`GATE FAIL ${label} ${s.id} (attempt ${attempt}/2): ${(last?.failed ?? ['verifier returned nothing']).join('; ')}`)
  }
  throw new Error(`${label} gate failed twice: ${(last?.failed ?? ['verifier returned nothing']).join('; ')}`)
}

// Leave main clean for the next slice, whatever state this one died in.
async function park(s, reason) {
  await agent(
    `Slice \`${s.id}\` of autonomous run \`${RUN_ID}\` FAILED: ${reason}

Park it so the next slice can start from a clean main. Sandbox disabled for git/gh.
  1. If on feat/${s.id} with uncommitted changes: stage them BY PATH — never \`git add -A\`,
     and never stage \`.gitignore\` or \`.claude/skills/10x-autonomous-run/\` (the maintainer's
     uncommitted files, carried across branches on purpose) — and commit \`wip(${s.id}): halted by autonomous run ${RUN_ID}\` — the
     pre-commit hook still applies; if it fails, fix lint only, never --no-verify.
  2. If the branch has commits and is not pushed, push it: \`git push -u origin feat/${s.id}\`
     so the work is not only on this machine. Do NOT open or merge a PR.
  3. If a PR exists for feat/${s.id}, leave it OPEN and comment the reason with gh.
  4. \`git switch main && git pull --ff-only\`; \`git status --porcelain\` must be empty.
  5. Kill the run's dev servers ONLY: \`lsof -ti :4398 :4399 | xargs kill 2>/dev/null\` — never :4321 (the maintainer's).
Return 4 lines: branch state, PR state, main clean yes/no, anything odd.`,
    { label: `park:${s.id}`, phase: 'Ship', effort: 'low' }
  )
}

// ===========================================================================
// One slice, end to end.
// ===========================================================================
async function runSlice(s) {
  const dir = changeDir(s.id)

  // --- Intake ---------------------------------------------------------------
  await gated({
    s, label: 'new', phaseName: 'Intake', schema: STEP_REPORT,
    body: `STEP 0 — branch. Sandbox disabled:
    git switch main && git pull --ff-only
    git switch -c feat/${s.id}        (if it already exists from a resumed run: git switch feat/${s.id})
(The "confirm feat/${s.id}" rule above applies from here on.)

STEP: \`/10x-new ${s.id}\` — invoke the 10x-new skill with the Skill tool.

THE PART THAT IS NOT IN THE SKILL, and matters most: every claim in the roadmap
block for ${s.fn} is a PLAN-TIME claim. Check each against the repo as it is NOW —
earlier slices have shipped since and may already provide (or contradict) part of
it. Record corrections in change.md. Confirm which views of design/rytm-os/prototype/
and which keys of design/rytm-os/react-kit/docs/content.json this slice binds to, and
list them in change.md; if the kit has no view for something the slice needs, that
is a DESIGN-GAP (see the contract), not a licence to invent.

The skill tells you to STOP and wait. You do not. Decide and record why.
Commit: \`docs(${s.id}): change identity (autonomous run)\`.`,
    checks: [
      `test -f ${dir}/change.md && echo CHANGE_OK`,
      `grep -q '^## Autonomous decisions' ${dir}/change.md && echo DECISIONS_OK`,
      ...handoffChecks(s.id),
    ],
  })

  // --- Research -------------------------------------------------------------
  await gated({
    s, label: 'research', phaseName: 'Research', schema: STEP_REPORT,
    body: `STEP: \`/10x-research ${s.id}\` via the Skill tool.
Its scope clarification uses AskUserQuestion — scope it yourself from change.md and
the roadmap block, and record the scoping decision. Wait for ALL sub-agents, then
WRITE research.md before returning: in the source run a research step reported
"waiting for the last agent" and died having written nothing.
Cover, at minimum: the existing schema and RPCs this slice reads/writes
(supabase/migrations/, src/db/database.types.ts), the services in src/lib/, the kit
views it binds to, and which shared components in src/components/ already exist.
Commit: \`docs(${s.id}): research\`.`,
    checks: [
      `test -f ${dir}/research.md && echo RESEARCH_OK`,
      `test "$(wc -l < ${dir}/research.md)" -gt 50 && echo RESEARCH_SUBSTANTIAL`,
      ...handoffChecks(s.id),
    ],
  })

  // --- Plan -----------------------------------------------------------------
  await gated({
    s, label: 'plan', phaseName: 'Plan', schema: STEP_REPORT, effort: 'high',
    body: `STEP: \`/10x-plan ${s.id}\` via the Skill tool.
Every AskUserQuestion collapses to "decide, then save", each with its reversal
condition under \`## Autonomous decisions\`. The plan MUST end with \`## Progress\`.

Rytm-specific constraints the plan must honour:
  * Do NOT plan a manual "deploy to hosted DB / preview / production" phase — the
    run's Ship step does db push, PR, merge and deploy. Plan code phases only.
  * A migration ships with RLS (granular per-operation, per-role), a user_id FK to
    auth.users ON DELETE CASCADE for user data, a pgTAP proof in
    supabase/tests/database/, and \`npm run db:types\` in the same phase.
  * A phase with UI ends with a screenshot row (states listed by name) — the Visual
    step performs it. Colors only via the Tailwind names in CLAUDE.md, copy only via
    src/content/copy.ts.
  * Every phase's automated criteria come from: npm run lint, npx astro check,
    npm run fixture:check, npm run build, npx supabase test db, npm run smoke —
    as baseline + delta.
Commit: \`docs(${s.id}): plan\`.`,
    checks: [
      `test -f ${dir}/plan.md && echo PLAN_OK`,
      `grep -q '^## Progress' ${dir}/plan.md && echo PROGRESS_OK`,
      `test "$(grep -c '^- \\[ \\]' ${dir}/plan.md)" -ge 1 && echo HAS_ROWS`,
      `grep -q '^## Autonomous decisions' ${dir}/plan.md && echo DECISIONS_OK`,
      ...handoffChecks(s.id),
    ],
  })

  // --- Plan review ----------------------------------------------------------
  const planReview = await gated({
    s, label: 'plan-review', phaseName: 'PlanReview', schema: REVIEW_REPORT, effort: 'high',
    body: `STEP: \`/10x-plan-review ${s.id}\` via the Skill tool. Review DEEP. Set merge "N/A".

Triage yourself — there is no interactive loop:
  CRITICAL    -> fix directly in plan.md
  WARNING     -> fix if obvious, otherwise record under \`## Known risks\` in plan.md
  OBSERVATION -> record only

A **RETHINK** verdict is different: do NOT rewrite the plan. Leave it untouched and
return verdict RETHINK — the slice leaves this run for a fresh human planning pass.

Check specifically: RLS/cascade on every new table; the plan does not duplicate
something an earlier slice already shipped (read context/archive/); every UI element
traces to a kit view or a DESIGN-GAP row; no absolute test counts.
Set hasUI. Commit: \`docs(${s.id}): plan review\`.`,
    checks: [
      `test -f ${dir}/reviews/plan-review.md && echo REVIEW_OK`,
      `grep -qiE 'verdict' ${dir}/reviews/plan-review.md && echo VERDICT_PRESENT`,
      ...handoffChecks(s.id),
    ],
  })
  if (planReview?.verdict === 'RETHINK') {
    throw new Error(`plan-review returned RETHINK — ${planReview.headline ?? 'no headline'}. Plan left untouched for a fresh /10x-plan.`)
  }

  // --- Implement ------------------------------------------------------------
  await gated({
    s, label: 'implement', phaseName: 'Implement', schema: STEP_REPORT,
    body: `STEP: \`/10x-implement ${s.id}\` via the Skill tool — ALL phases, back to back.

Every AskUserQuestion — manual-confirmation gate, commit-message approval,
between-phase prompt — collapses to "decide, then proceed", recorded under
\`## Autonomous decisions\`. Manual-only Progress rows you genuinely cannot perform:
leave them unticked and list them in the handoff as a human checklist. Screenshot
rows are left for the Visual step. NEVER tick a row you did not verify.

Per phase: implement, run the plan's criteria, run the DELIBERATE BREAK and META-CHECK
it (does the break prove what it appears to? if the suite stays green, the break is
the wrong one), restore, then the full local gate:
    npm run lint && npx astro check && npm run fixture:check && npm run build
    npx supabase db reset && npx supabase test db      (when migrations/DB changed)
    ASTRO_DEV_BACKGROUND=1 npx astro dev --port 4398 --ignore-lock (background) ;
    BASE_URL=http://localhost:4398 npm run smoke ; lsof -ti :4398 | xargs kill   (never touch :4321)
and only then commit — one Conventional Commit per phase, only on green, never
--no-verify. Do not push, do not open a PR.`,
    checks: [
      `git log --oneline main..HEAD | wc -l — must be >= 5 (four docs commits + at least one code commit)`,
      `git log --oneline main..HEAD --grep='(p1)' | wc -l — must be >= 1`,
      `grep -c '^- \\[ \\]' ${dir}/plan.md — report the count; every remaining row must be listed as Manual or screenshot in the handoff's "## 5. Open"`,
      ...handoffChecks(s.id),
      `git status --porcelain — must be empty`,
    ],
  })

  // --- Impl review ----------------------------------------------------------
  const review = await agent(
    brief(s, `STEP: \`/10x-impl-review ${s.id}\` via the Skill tool, on feat/${s.id}.

RE-RUN every suite yourself (the full local gate from the contract). Do not accept the
implementer's numbers; reconcile them against the baseline and show the arithmetic.
Re-execute at least one deliberate break yourself. If a migration is involved, check
it against the LIVE local database (\`npx supabase db reset\` then query), not just the
file — RLS isolation, cascade from auth.users, grants.

Do not rubber-stamp: where findings were already applied, verify they are real.

Triage: CRITICAL -> fix in code on this branch, re-run the gate, commit
\`fix(${s.id}): poprawki z przeglądu implementacji\`. WARNING -> fix if cheap and
local, else follow-ups/review-fixes.md. OBSERVATION -> record. Name files and SYMBOLS.

END the report with exactly this line, alone on its own line:
    MERGE: CLEAR — <reason>        or        MERGE: BLOCKED — <reason>
BLOCKED iff, AFTER your fixes: >=1 open CRITICAL, an unmet success criterion, or a
red suite. Warnings NEVER block. Set hasUI. Commit the review.`),
    { label: `impl-review:${s.id}`, phase: 'ImplReview', schema: REVIEW_REPORT, effort: 'high' }
  )

  const gate = await agent(
    `Verification only, change nothing. Repo root, sandbox as needed.
1. ls ${dir}/reviews/impl-review*.md
2. grep -hnE '^MERGE: (CLEAR|BLOCKED)' ${dir}/reviews/impl-review*.md — quote verbatim.
3. git status --porcelain — must be empty.
4. git branch --show-current — must be feat/${s.id}.
\`pass\` only if 1–4 hold AND the LAST MERGE line says CLEAR.`,
    { label: `gate:impl-review:${s.id}`, phase: 'ImplReview', schema: GATE, effort: 'low' }
  )
  if (!gate?.pass) {
    throw new Error(`impl-review gate: ${(gate?.failed ?? ['verifier returned nothing']).join('; ')} ` +
      `(reviewer self-reported ${JSON.stringify(review?.merge ?? null)}: ${review?.mergeReason ?? ''})`)
  }

  // --- Visual ---------------------------------------------------------------
  if (review?.hasUI || planReview?.hasUI) {
    await gated({
      s, label: 'visual', phaseName: 'Visual', schema: STEP_REPORT,
      body: `STEP: visual gate for the views this slice adds or changes.

  1. \`npm run dev -- --port 4399\` in the background; sign in as test@rytm.local /
     Rytm-Test-Passw0rd! (seeded — \`npx supabase db reset\` first if needed) and
     import the synthetic ING fixture where the view needs data.
  2. Drive Chrome with the claude-in-chrome MCP tools (load them via ToolSearch in
     ONE call). Open each changed route AND the matching design/rytm-os/prototype/views/*.html.
     Screenshot every named state from the plan: default, empty, error,
     loading/disabled where they exist — desktop and ~400px mobile (see
     context/archive/2026-09-21-settings-account/screenshots/README.md for the
     iframe trick and the JPEG→PNG note). Save to ${dir}/screenshots/ with a README.md
     table of states. Never commit a temporary preview file.
     If the Chrome tools are unavailable, fall back to
     \`npx -y playwright@1.55 screenshot --viewport-size=1440,900 <url> <file>\` for
     public routes; for authenticated ones record "not captured" — do NOT fake it.
  3. Compare against the prototype: layout, component patterns, tokens (ink/paper/
     paper-soft/excess/excess-text/muted/line/green only), copy from src/content/copy.ts,
     visible focus, keyboard path. Fix real discrepancies on this branch; re-run lint +
     build + smoke after fixes. What the kit genuinely lacks -> gap row in
     context/foundation/design-kit.md + \`DESIGN-GAP\` comment, never invented.
  4. Write ${dir}/reviews/visual-review.md ending with one line:
        VISUAL: PASS — <reason> | VISUAL: GAPS — <what> | VISUAL: NOT-CAPTURED — <why>
     GAPS and NOT-CAPTURED do not block shipping; they are reported to the maintainer.
  5. Kill the dev server. Tick the screenshot rows in plan.md you actually verified.
     Commit: \`docs(${s.id}): bramka wizualna\` (+ \`fix(${s.id}): …\` for code fixes).`,
      checks: [
        `test -f ${dir}/reviews/visual-review.md && echo VISUAL_OK`,
        `grep -hE '^VISUAL: (PASS|GAPS|NOT-CAPTURED)' ${dir}/reviews/visual-review.md`,
        `git status --porcelain — must be empty (untracked screenshots count as a FAIL)`,
        ...handoffChecks(s.id),
      ],
    })
  } else {
    log(`${s.fn} ${s.id}: no UI per both reviews — visual gate skipped`)
  }

  // --- Ship -----------------------------------------------------------------
  const ship = await agent(
    brief(s, `STEP: SHIP. You have the maintainer's standing authorisation (2026-09-25) for
every action below, including the hosted-DB push and the merge to main. Sandbox
DISABLED for all of it. Follow the order exactly — each step's precondition is the
previous one's success.

  1. ARCHIVE — \`/10x-archive ${s.id}\` via the Skill tool. Its warning prompt: answer it
     yourself (archive) and record why. It moves the folder to context/archive/, flips
     ${s.fn} to done in roadmap.md and commits \`chore(archive): close ${s.id}\`.
     From here the handoff lives at context/archive/<created>-${s.id}/handoff.md —
     update its "## 1. State" / "## 4. Next command" as you go and commit at the end.
  2. PUSH + PR — \`git push -u origin feat/${s.id}\`, then
     \`gh pr create --base main --head feat/${s.id} --title "feat(${s.id}): <outcome in Polish>"\`
     with a body: slice ${s.fn}, outcome, what shipped per phase, migrations, verification
     table (baseline + delta), visual verdict, known follow-ups, autonomous decisions
     worth a look. Never push to main directly, never force-push.
  3. CI — \`gh pr checks --watch --fail-fast\` (jobs ci + smoke). Red -> read the failed log
     (\`gh run view --log-failed\`), fix on the branch, re-run the local gate, commit
     \`fix(${s.id}): CI …\`, push, watch again. At most 2 fix rounds, then status BLOCKED.
  4. HOSTED DB — only if \`git diff --name-only main...HEAD -- supabase/migrations\` is
     non-empty: \`npx supabase db push --dry-run\` (must list exactly this branch's new
     migrations — anything else: BLOCKED, push nothing), then \`npx supabase db push\`,
     then \`npx supabase migration list\` showing local = remote. This happens BEFORE the
     merge, because main deploys on merge and the code must find its schema.
  5. MERGE — \`gh pr merge --merge --delete-branch\` (a merge commit, like PR #1).
     Then \`git switch main && git pull --ff-only\`.
  6. DEPLOY — find the CI run for the merge commit on main
     (\`gh run list --branch main --limit 3\`) and \`gh run watch <id> --exit-status\`.
     Jobs ci, smoke and deploy must all succeed. If deploy fails, do NOT revert on your
     own and do NOT run vercel by hand: report status BLOCKED with the run URL — the
     maintainer owns rollback (\`vercel rollback\`).
  7. \`git status --porcelain\` on main must be empty.

NEVER: \`npm run smoke\` against production, \`vercel --prod\`, --no-verify, force-push,
merging with a red or pending check.`),
    { label: `ship:${s.id}`, phase: 'Ship', schema: SHIP_REPORT }
  )

  const shipGate = await agent(
    `Verification only, change nothing. Repo root, sandbox DISABLED (gh, supabase).
1. gh pr list --head feat/${s.id} --state merged --json number,url,mergeCommit — must list one merged PR.
2. git fetch origin && git branch --show-current && git status --porcelain — must be main, clean.
3. git log origin/main --oneline -5 — the merge commit for feat/${s.id} is there.
4. ls -d context/archive/*-${s.id} && grep -nE '^\\| ${s.fn} ' context/foundation/roadmap.md — archived; row status done.
5. gh run list --branch main --limit 3 --json headSha,conclusion,status,url — the run for that merge commit is completed / success.
6. npx supabase migration list — no migration pending on remote (every Local has a Remote).
\`pass\` only if ALL six hold.`,
    { label: `gate:ship:${s.id}`, phase: 'Ship', schema: GATE, effort: 'low' }
  )

  if (ship?.status !== 'SHIPPED' || !shipGate?.pass) {
    throw new Error(`ship: ${ship?.blockedReason ?? ship?.headline ?? 'no report'} | gate: ${(shipGate?.failed ?? ['verifier returned nothing']).join('; ')}`)
  }
  return { planReview, review, ship }
}

// ===========================================================================
// The run: serial, in the topological order the skill passed.
// ===========================================================================
const shipped = []
const failed  = []
const skipped = []
const failedIds = new Set()

for (const s of SLICES) {
  const blockedBy = (s.requires ?? []).filter((r) => failedIds.has(r))
  if (blockedBy.length) {
    skipped.push({ fn: s.fn, id: s.id, reason: `prerequisite(s) failed in this run: ${blockedBy.join(', ')}` })
    failedIds.add(s.id)
    log(`SKIP ${s.fn} ${s.id} — prerequisite failed: ${blockedBy.join(', ')}`)
    continue
  }

  log(`START ${s.fn} ${s.id}`)
  let result = null
  let error  = null
  try {
    result = await runSlice(s)
  } catch (e) {
    error = e?.message ?? String(e)
  }

  if (result) {
    shipped.push({ fn: s.fn, id: s.id, pr: result.ship.pr, mergeCommit: result.ship.mergeCommit,
                   migrations: result.ship.migrations, deploy: result.ship.deploy,
                   ciFixRounds: result.ship.ciFixRounds,
                   review: { verdict: result.review?.verdict, critical: result.review?.critical,
                             warnings: result.review?.warnings, merge: result.review?.mergeReason } })
    log(`SHIPPED ${s.fn} ${s.id} — ${result.ship.pr}`)
  } else {
    failed.push({ fn: s.fn, id: s.id, reason: error })
    failedIds.add(s.id)
    log(`FAILED ${s.fn} ${s.id} — ${error}`)
    await park(s, error)
  }

  await agent(
    `Append to ${RUN_DIR}/run-log.md — you are the orchestrator's scribe and the only writer
of that file (it is gitignored; never commit it). Record, as prose a stranger can follow,
the outcome of ${s.fn} \`${s.id}\`:
${JSON.stringify(result ? { status: 'SHIPPED', ship: result.ship, review: result.review, planReview: result.planReview } : { status: 'FAILED', reason: error })}
Update the status table row for ${s.fn}. Change nothing else.`,
    { label: `scribe:${s.id}`, phase: 'Scribe', effort: 'low' }
  )
}

phase('Scribe')
await agent(
  `Close out ${RUN_DIR}/run-log.md for run \`${RUN_ID}\`. Record these facts and invent none:
  shipped: ${JSON.stringify(shipped)}
  failed:  ${JSON.stringify(failed)}
  skipped: ${JSON.stringify(skipped)}
Every slice this run was given (${SLICES.map((s) => s.fn).join(', ')}) must appear in exactly
one list — a slice that vanishes is a reporting bug; say so if you see one.
Fill the RUN COMPLETE table and the "Environment traps" and "Decisions" sections (read
each shipped slice's archived handoff.md "## 6. Autonomous decisions" for the ones worth a
second look). Do NOT edit or commit anything outside ${RUN_DIR}/ — recurring traps go in
the handoff below under "needs the maintainer", for them to fold into
${SKILL}/references/process.md §7.
Then write ${RUN_DIR}/handoff.md for the maintainer: what shipped (PRs, deploys,
migrations), what failed and where its branch is, manual-only rows left, DESIGN-GAPs added,
follow-ups, and the next command. It must stand alone.`,
  { label: 'scribe:close', phase: 'Scribe', effort: 'low' }
)

return {
  runId: RUN_ID,
  shipped,
  failed,
  skipped,
  artifacts: { runLog: `${RUN_DIR}/run-log.md`, handoff: `${RUN_DIR}/handoff.md` },
}
