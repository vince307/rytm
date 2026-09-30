# Hosted Supabase migrations from the CI `deploy` job — Plan Brief

> Full plan: `context/changes/ci-db-push/plan.md`
> Research: `context/changes/ci-db-push/research.md`

## What & Why

Production should have one gate: CI on `main`. Code already ships that way, but schema changes still reach the
hosted project `psqbtvooufapkatpkxlw` via `npx supabase db push` from a laptop or the autonomous-run ship agent,
with the production token stored locally. This plan moves the push into the `deploy` job so schema and code ship
from the same green commit and no machine outside CI holds the hosted token.

## Starting Point

`deploy` (`.github/workflows/ci.yml:69-86`) runs after `ci` + `smoke` and does `vercel pull` → build →
`vercel deploy --prebuilt --prod`; it has no Supabase step. `CLAUDE.md:59` and the autonomous-run ship step tell a
human or agent to push hosted migrations before merging. The two Supabase secrets CI would need do not exist.

## Desired End State

Merging to `main` runs build → `supabase link` → `db push --dry-run` → `db push --yes` → `migration list` →
`vercel deploy`. A failed migration stops the Vercel deploy. Agents confirm the push by reading the `deploy` log;
docs and rules say CI is the only path to the hosted DB and that migrations must be backward-compatible.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| CI auth | `SUPABASE_ACCESS_TOKEN` (scoped) + `SUPABASE_DB_PASSWORD`, `supabase link` | Documented Supabase recipe; `link` gives the IPv4 pooler fallback GitHub runners need | Research |
| Step order | build → link → dry-run → push → migration list → vercel deploy | Build failure never touches the schema; push-to-deploy gap is just the upload | Research |
| Secret scope | GitHub Environment `production`, no required reviewers, only on `deploy` | PR jobs cannot read the secrets, and deploy stays fully automatic | Plan |
| Agent verification | Read `Hosted migration ledger` step from the `deploy` log (`gh run view --log`) | No token on any laptop or agent — fully meets the change's goal | Plan |
| CLI pin | `setup-cli@v1`, `2.117.0` | Same as `smoke`; v3 upgrade is a separate change | Research |
| Compatibility rule | Hard rule in `CLAUDE.md`: backward-compatible migrations, expand → deploy → contract | Old code runs on the new schema until Vercel finishes, in both old and new flows | Research |
| Failure recovery | Human: fix forward in a new PR or `migration repair`; CI never repairs | Keeps destructive/rollback actions human-only | Research |

## Scope

**In scope:**
- `deploy` job: `environment: production` + five Supabase steps
- Local proof that a failing `db push --yes` exits non-zero without a TTY
- `CLAUDE.md`, `AGENTS.md`, `deploy-plan.md`, `infrastructure.md`
- Local-only: `10x-autonomous-run` skill files and `.claude/settings.local.json`
- Rollout: environment + secrets (human), first no-op run recorded

**Out of scope:**
- Hosted dry-run on PRs, required reviewers, `setup-cli@v3`
- Automated repair / rollback / hosted reset
- Removing the owner's local `supabase link` (still needed for human `migration repair`)
- Any new migration

## Architecture / Approach

One PR (workflow + docs); gitignored agent tooling edited locally alongside. A human creates the `production`
environment and secrets before the merge; the merge's own `deploy` run is a no-op push ("Remote database is up to
date") that proves the wiring before any real migration relies on it.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. `deploy` job pushes hosted migrations | Supabase steps in `deploy`, failure path proven locally | Non-TTY / exit-code behaviour differs from source reading |
| 2. Repository docs | CI as the only DB path; compatibility hard rule | Missing a stale "push before merge" line |
| 3. Local agent tooling | Ship step verifies from the deploy log; no local hosted access | Gitignored edits need permission prompts |
| 4. Rollout and first CI push | Secrets in place, green no-op run recorded | Scoped token lacks a permission `link` needs |

**Prerequisites:** local Supabase running (Phase 1 proof); owner access to GitHub repo settings and Supabase
dashboard (Phase 4).
**Estimated effort:** ~1 session across 4 phases, plus a few minutes of human setup.

## Open Risks & Assumptions

- Minimum scoped-token permissions for `link` + `db push` are unconfirmed; widen the scope if the first run fails.
- If the PR merges before the secrets exist, `deploy` goes red and Vercel is skipped for that commit (safe, noisy).
- A non-backward-compatible migration would break production for the minutes between push and Vercel deploy — the
  new hard rule is the only guard.

## Success Criteria (Summary)

- The merge of this change produces a green `deploy` whose log shows the no-op push and ledger local = remote.
- No doc, rule or skill tells a human or agent to run `supabase db push` against the hosted project.
- The first later migration reaches production only through the `deploy` job.
