# Hosted Supabase migrations from the CI `deploy` job — Implementation Plan

## Overview

Move `supabase db push` for the hosted project `psqbtvooufapkatpkxlw` into the `deploy` job of
`.github/workflows/ci.yml`. It runs after `ci` + `smoke` (pgTAP included) are green and before `vercel deploy`, so
schema and code ship from the same commit on `main`. After this change no laptop and no agent session needs the
hosted Supabase token: the `deploy` job logs `migration list`, and `10x-autonomous-run` verifies the push from that
log.

## Current State Analysis

- `deploy` (`.github/workflows/ci.yml:69-86`) runs `needs: [ci, smoke]`, only on push to `main`,
  `concurrency: production`, with steps checkout → setup-node → `npm ci` → `vercel pull` → `npm run build` →
  `vercel deploy --prebuilt --prod`. It has no Supabase CLI and no `environment:` key.
- The `smoke` job already installs CLI `2.117.0` via `supabase/setup-cli@v1` (`ci.yml:39-42`), pinned because
  `latest` drifted.
- Hosted migrations are pushed before merge by a human (`CLAUDE.md:59`) or by the autonomous-run ship step
  (`.claude/skills/10x-autonomous-run/references/step-prompts.md:183-185`), with the hosted token in
  `supabase/.temp` and the sandbox disabled.
- GitHub has 5 secrets (`SUPABASE_URL`, `SUPABASE_KEY`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `VERCEL_TOKEN`);
  `SUPABASE_ACCESS_TOKEN` and `SUPABASE_DB_PASSWORD` are missing. The DB password lives only in the local `.env`
  (`context/deployment/deploy-plan.md:68`).
- The hosted ledger is aligned: 6 local = 6 remote on 2026-09-28, latest `20260928120000`.

## Desired End State

- A push to `main` runs, inside `deploy`: build → `supabase link` → `db push --dry-run` → `db push --yes` →
  `supabase migration list` → `vercel deploy --prebuilt --prod`. A failing migration turns the job red and the
  Vercel deploy is skipped.
- The two Supabase secrets live on the GitHub Environment `production` (no required reviewers), which only
  `deploy` references; `ci` and `smoke` on PRs cannot read them.
- `CLAUDE.md`, `AGENTS.md`, `deploy-plan.md` and `infrastructure.md` describe CI as the only path to the hosted DB,
  and `CLAUDE.md` states the backward-compatibility rule for migrations.
- `10x-autonomous-run` never touches the hosted DB: it merges on green CI, watches `deploy`, and reads the
  `migration list` output from the `deploy` log.
- Verified by the merge of this change itself: `deploy` is green, its log says "Remote database is up to date"
  and lists `20260928120000` in both the Local and Remote columns.

### Key Discoveries:

- `supabase link` in CLI v2.117.0 saves the session pooler URL (port 5432) and `db push` falls back to it, which
  covers IPv4-only GitHub runners (research § IPv4/IPv6).
- `db push` applies each file in its own transaction; a failure leaves earlier files applied and recorded, the
  failing one not (research § `db push` semantics). Re-running on an up-to-date remote is a no-op.
- `db push` never applies `seed.sql` without `--include-seed` (`CLAUDE.md:57` stays true).
- The project ref is not secret (`deploy-plan.md:12` publishes it) — it can sit in the workflow file.

## What We're NOT Doing

- No `db push --dry-run` against hosted on PRs (would expose the secrets to PR runs).
- No required reviewers on the `production` environment (would put a human click on every deploy).
- No `supabase/setup-cli@v3` upgrade and no CLI version bump — both jobs stay on `@v1` / `2.117.0`.
- No automated `migration repair`, hosted `db reset` or rollback in CI; recovery stays human.
- No change to `vercel rollback` / `promote` (human-only) or to the `soft_deny` on local `db push` and
  `vercel --prod` (only its autonomous-run exception goes).
- No deletion of the owner's local `supabase link` — a human still needs it for `migration repair`.
- No new migration in this change.

## Implementation Approach

One committed PR carries the workflow change (Phase 1) and the docs (Phase 2). Phase 3 edits gitignored local files
(`.claude/**`), which are never committed. Phase 4 is the rollout: a human creates the environment and secrets
before the merge, and the merge's own `deploy` run is the proof (a no-op push).

## Critical Implementation Details

**Timing & lifecycle** — The secrets must exist before this PR merges: without them `supabase link` fails, `deploy`
goes red and the Vercel deploy is skipped for that commit (production keeps the previous deploy; safe but noisy).
Build runs before `link`/`push`, so a build failure never touches the schema.

**Debug & observability** — The `migration list` step is the verification surface for agents; give it a stable
step name (`Hosted migration ledger`) so the ship gate can find it in `gh run view --log`.

## Phase 1: `deploy` job pushes hosted migrations

### Overview

Add the Supabase steps to `deploy` between `npm run build` and `vercel deploy`, bound to the `production`
environment, and prove locally that a failing `db push --yes` exits non-zero without a TTY.

### Changes Required:

#### 1. Deploy job

**File**: `.github/workflows/ci.yml`

**Intent**: Ship schema and code from the same green commit; a failed migration stops the Vercel deploy.

**Contract**:
- `deploy` gains `environment: production`; `needs`, `if`, `concurrency: production` unchanged (no
  `cancel-in-progress`).
- New steps, in order, after `- run: npm run build` and before the `vercel deploy` step:
  1. `supabase/setup-cli@v1` with `version: 2.117.0` (same pin and comment rationale as `smoke`).
  2. `Link hosted Supabase` — `supabase link --project-ref psqbtvooufapkatpkxlw`.
  3. `Pending hosted migrations` — `supabase db push --dry-run`.
  4. `Push hosted migrations` — `supabase db push --yes`.
  5. `Hosted migration ledger` — `supabase migration list`.
- `SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}` and
  `SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }}` are set as `env` on those Supabase steps only (not
  job-level), so `npm ci`/build/Vercel steps never see them.
- Update the comment above `deploy` (`ci.yml:67-68`) to name the DB step and the backward-compatibility rule.

#### 2. Local proof of failure semantics (no file change)

**Intent**: Close research open question 2 (exit code, non-TTY) before relying on it in production.

**Contract**: Against the local Supabase (`npx supabase start`), add a throwaway migration with an invalid
statement to `supabase/migrations/`, run
`npx supabase db push --db-url postgresql://postgres:postgres@127.0.0.1:54322/postgres --yes </dev/null`, record
the exit code (must be non-zero) and that no prompt blocks; then delete the file and confirm
`npx supabase migration list --local` shows no extra version. Record the result in
`context/changes/ci-db-push/reviews/local-push-failure.md`.

### Success Criteria:

#### Automated Verification:

- Workflow parses as YAML: `node -e "require('yaml').parse(require('fs').readFileSync('.github/workflows/ci.yml','utf8'))"` (or `npx --yes yaml valid < .github/workflows/ci.yml`)
- `grep -n "environment: production" .github/workflows/ci.yml` hits the `deploy` job only
- Supabase step order in `deploy` is link → dry-run → push → migration list, all after `npm run build` and before `vercel deploy`
- Local failing `db push --yes </dev/null` exits non-zero and is recorded in `reviews/local-push-failure.md`
- Throwaway migration removed: `git status --porcelain supabase/migrations` is empty
- `npm run lint` passes

#### Manual Verification:

- Reviewer confirms the Supabase secrets appear only in `env:` of the Supabase steps of `deploy`

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual
confirmation before proceeding.

---

## Phase 2: Repository docs describe CI as the only path to the hosted DB

### Overview

Replace "human pushes before merge" with "CI pushes after green, before Vercel", list the new secrets, and write
down the backward-compatibility rule.

### Changes Required:

#### 1. Project rules

**File**: `CLAUDE.md`

**Intent**: Agents and humans stop pushing hosted migrations by hand, and migrations stay safe for the window in
which the previous deploy runs on the new schema.

**Contract**:
- Hard rules, Supabase migrations bullet: add "Migrations must be backward-compatible with the deploy currently in
  production (the `deploy` job pushes the schema minutes before the new code goes live); a drop/rename of anything
  live code uses goes expand → deploy → contract over two merges."
- Environment § Migrations (`:59`): hosted DB is reached only by the `deploy` job (`supabase link` → `db push` →
  `migration list`, secrets on the GitHub Environment `production`); a human never runs `db push`; `migration
  repair` and hosted `db reset` stay human-only.
- Production deploy bullet (`:60`) and `## CI` (`:65`): name the DB step and that `deploy` needs
  `SUPABASE_ACCESS_TOKEN` + `SUPABASE_DB_PASSWORD` besides `VERCEL_*`.

#### 2. Agent onboarding

**File**: `AGENTS.md`

**Intent**: Keep `AGENTS.md:43` consistent with `CLAUDE.md`.

**Contract**: § Deployment mentions that `deploy` also applies hosted Supabase migrations before the Vercel deploy.

#### 3. Deployment state

**File**: `context/deployment/deploy-plan.md`

**Intent**: The deployment record reflects the new path, secrets and responsibilities.

**Contract**:
- Decisions table, "Production path" row (`:29`): add `supabase link` → `db push` → `migration list` between build
  and deploy.
- Secrets inventory (`:58-68`): new row "GitHub Environment `production`" with `SUPABASE_ACCESS_TOKEN` (scoped
  token, project `psqbtvooufapkatpkxlw`, rotation owner = human) and `SUPABASE_DB_PASSWORD`; the local `.env` row
  stops calling itself "the only copy".
- Operating model (`:75-76`): "Supabase migrations against the hosted DB" leaves the human-only list; human-only
  keeps `migration repair`, hosted `db reset`, secret rotation. Rollback line adds that a failed migration is
  fixed forward through a new PR.
- New dated section `## CI migrations (2026-09-29)` recording the change and the first no-op run result (filled in
  Phase 4).

#### 4. Infrastructure note

**File**: `context/foundation/infrastructure.md`

**Intent**: Remove the stale "a human applies Supabase migrations" statement.

**Contract**: Approval bullet (`:88`) drops "applies Supabase migrations" from the human list and says the `deploy`
job applies them; Secrets bullet (`:86`) mentions the `production` environment secrets.

### Success Criteria:

#### Automated Verification:

- No doc still tells anyone to push by hand: `grep -rn "db push" CLAUDE.md AGENTS.md context/deployment context/foundation/infrastructure.md` shows only CI-path wording
- `npx prettier --check CLAUDE.md AGENTS.md context/deployment/deploy-plan.md context/foundation/infrastructure.md` passes

#### Manual Verification:

- The backward-compatibility rule in `CLAUDE.md` reads as a hard rule and names expand → deploy → contract

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual
confirmation before proceeding.

---

## Phase 3: Local agent tooling stops touching the hosted DB

### Overview

Update the gitignored `10x-autonomous-run` skill and `.claude/settings.local.json` so the ship step verifies the
CI push from the `deploy` log and never links to or pushes to the hosted project. These files are local-only
(`.gitignore:48`) and are not committed; writes to them need the user's permission prompt (sandbox deny list).

### Changes Required:

#### 1. Ship step

**File**: `.claude/skills/10x-autonomous-run/references/step-prompts.md`

**Intent**: The ship agent no longer needs hosted credentials.

**Contract**:
- Step 4 HOSTED DB (`:183-185`) is removed; steps renumber.
- DEPLOY step: after `gh run watch … --exit-status`, if the branch had migrations
  (`git diff --name-only <merge-base>..<merge-sha> -- supabase/migrations`), read
  `gh run view <run> --log --job <deploy-job-id>` and confirm every new version appears in both columns of the
  `Hosted migration ledger` step; a red DB step → BLOCKED with the run URL, no local push, no repair.
- Sandbox note drops `supabase` from "Sandbox DISABLED for …"; NEVER list adds "`supabase db push`, `supabase link`
  to the hosted project".
- Report line: "migrations (from the deploy log)".

#### 2. Skill entry and references

**Files**: `.claude/skills/10x-autonomous-run/SKILL.md`, `references/process.md`, `references/gates.md`,
`references/agent-contract.md`, `references/run-log-template.md`

**Intent**: Every rule agrees with the new ship step.

**Contract**:
- `SKILL.md`: description (`:3`) and Step 0 question 2 (`:29`) say "CI applies hosted migrations"; preflight
  (`:50`) drops `supabase projects list` / `.temp/project-ref` / `migration list` and checks
  `gh secret list --env production` names both Supabase secrets instead; never-list line (`:110`/`:125`) becomes
  "never run `supabase db push` or link to the hosted project — CI does it".
- `process.md`: chain line (`:39`) drops "supabase db push"; gate text (`:101`) reads ledger from the deploy log;
  trap 9 (`:116`) becomes "Migrations must be backward-compatible — old code runs on the new schema until Vercel
  finishes"; authorisation (`:121-124`) drops `db push`.
- `gates.md:31` ship row: replace `npx supabase migration list` with the deploy-log ledger check.
- `agent-contract.md:44-45`: "Only the Ship step pushes, opens the PR and merges"; no step runs `db push`.
- `run-log-template.md:56`: column "Migrations pushed" → "Migrations (deploy log)".

#### 3. Local auto-mode settings

**File**: `.claude/settings.local.json`

**Intent**: Local `db push` is denied without exception; the environment text matches reality.

**Contract**: `soft_deny` entry (`:15`) drops "except within the explicitly authorized 10x-autonomous-run skill";
secrets text (`:25`) adds the `production` environment secrets by name; CI/CD text (`:27`) names the DB step;
protected environments text (`:38`) drops the autonomous-run override.

### Success Criteria:

#### Automated Verification:

- `grep -rn "db push" .claude/skills/10x-autonomous-run` returns only prohibitions or descriptions of the CI step
- `grep -rn "projects list\|project-ref" .claude/skills/10x-autonomous-run/SKILL.md` returns nothing
- `node -e "JSON.parse(require('fs').readFileSync('.claude/settings.local.json','utf8'))"` succeeds
- `git status --porcelain .claude` is empty (files stay ignored)

#### Manual Verification:

- Reading the ship step end to end, no action needs a Supabase token on the machine

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual
confirmation before proceeding.

---

## Phase 4: Rollout and first CI push

### Overview

Human creates the environment and secrets, then the PR merges; the merge's `deploy` run is a no-op push that proves
the wiring before the first real migration goes through CI.

### Changes Required:

#### 1. GitHub Environment and secrets (human)

**Intent**: Give `deploy` hosted credentials that no PR job can read.

**Contract**: Repo Settings → Environments → `production` (no required reviewers, no branch restriction needed
beyond `deploy`'s `if`). Create a Supabase **scoped** access token limited to `psqbtvooufapkatpkxlw`;
`gh secret set SUPABASE_ACCESS_TOKEN --env production` and `gh secret set SUPABASE_DB_PASSWORD --env production`
fed from stdin/`.env`, never pasted into chat. If the first run fails with a permission error, widen the token's
scope, not the secret location.

#### 2. Record the first run

**File**: `context/deployment/deploy-plan.md`

**Intent**: Close the dated section with evidence.

**Contract**: Under `## CI migrations (2026-09-29)`: run URL, merge sha, the dry-run message and the ledger showing
`20260928120000` local = remote.

### Success Criteria:

#### Automated Verification:

- `gh secret list --env production` lists `SUPABASE_ACCESS_TOKEN` and `SUPABASE_DB_PASSWORD`
- `gh run view <merge run> --json conclusion,jobs` shows `ci`, `smoke`, `deploy` = success
- `deploy` log contains "Remote database is up to date" and the `Hosted migration ledger` step lists `20260928120000` in both columns

#### Manual Verification:

- Production (`rytm.vercel.app`) still serves the app after the merge deploy (sign-in page loads)
- The first later change with a real migration shows it applied in the `deploy` log (post-rollout check)

**Implementation Note**: The PR must not merge until 4.1 is done.

---

## Testing Strategy

### Integration Tests:

- The existing `smoke` job (pgTAP + smoke on a fresh local DB) stays the gate for every migration.
- The Phase 1 local failure proof covers the red path; the Phase 4 merge covers the green no-op path.

### Manual Testing Steps:

1. Create environment + secrets, merge the PR.
2. Watch the merge run; open the `deploy` log and check the four Supabase steps.
3. Confirm production still loads.

## Migration Notes

No schema change. Ledger is aligned (6 = 6), so the first CI push is a no-op. If a future CI push fails partway,
earlier files stay applied; fix forward with a new migration in a new PR, or have a human run `migration repair`
if the ledger is wrong.

## References

- Research: `context/changes/ci-db-push/research.md`
- Supabase CI recipe: https://supabase.com/docs/guides/deployment/managing-environments
- Origin of "push before merge": `context/archive/2026-09-21-settings-account/plan.md:274-294`
- Current deploy job: `.github/workflows/ci.yml:67-86`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: `deploy` job pushes hosted migrations

#### Automated

- [x] 1.1 Workflow parses as YAML — 480d4a5
- [x] 1.2 `environment: production` only on the `deploy` job — 480d4a5
- [x] 1.3 Supabase step order link → dry-run → push → migration list, after build and before vercel deploy — 480d4a5
- [x] 1.4 Local failing `db push --yes </dev/null` exits non-zero, recorded in `reviews/local-push-failure.md` — 480d4a5
- [x] 1.5 Throwaway migration removed from `supabase/migrations` — 480d4a5
- [x] 1.6 `npm run lint` passes — 480d4a5

#### Manual

- [x] 1.7 Supabase secrets only in `env:` of the Supabase steps of `deploy` — 480d4a5

### Phase 2: Repository docs describe CI as the only path to the hosted DB

#### Automated

- [x] 2.1 No doc still tells anyone to push by hand — 2d72101
- [x] 2.2 Prettier check passes on the edited docs — 2d72101

#### Manual

- [x] 2.3 Backward-compatibility hard rule in `CLAUDE.md` names expand → deploy → contract — 2d72101

### Phase 3: Local agent tooling stops touching the hosted DB

#### Automated

- [x] 3.1 `db push` in the skill appears only as prohibition or CI description
- [x] 3.2 SKILL.md preflight no longer uses `projects list` / `project-ref`
- [x] 3.3 `.claude/settings.local.json` is valid JSON
- [x] 3.4 `.claude` files stay ignored by git

#### Manual

- [x] 3.5 Ship step needs no Supabase token on the machine

### Phase 4: Rollout and first CI push

#### Automated

- [ ] 4.1 `production` environment holds both Supabase secrets
- [ ] 4.2 Merge run: `ci`, `smoke`, `deploy` success
- [ ] 4.3 `deploy` log shows "Remote database is up to date" and ledger `20260928120000` local = remote

#### Manual

- [ ] 4.4 Production still serves the app after the merge deploy
- [ ] 4.5 First real migration later shows up applied in the `deploy` log
