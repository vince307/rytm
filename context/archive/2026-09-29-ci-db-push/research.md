---
date: 2026-09-29T17:17:57+0200
researcher: Claude (Opus 5.5)
git_commit: 64c6a67
branch: main
repository: vince307/rytm
topic: "Run hosted Supabase migrations from the CI deploy job, not the laptop (ci-db-push)"
tags: [research, ci, github-actions, supabase, migrations, deploy, 10x-autonomous-run]
status: complete
last_updated: 2026-09-29
last_updated_by: Claude (Opus 5.5)
---

# Research: `supabase db push` in the CI `deploy` job

**Date**: 2026-09-29T17:17:57+0200
**Researcher**: Claude (Opus 5.5)
**Git Commit**: 64c6a67
**Branch**: main
**Repository**: vince307/rytm

## Research Question

From `change.md`: move `supabase db push` for the hosted project `psqbtvooufapkatpkxlw` into the `deploy` job of
`.github/workflows/ci.yml` (after pgTAP + smoke are green, before `vercel deploy`), so that schema and code ship from
the same commit and no agent needs production credentials locally. Settle: CI auth, ordering and failure
handling in `deploy`, and every rule and doc that encodes today's "human or ship agent pushes before merge" flow.

## Summary

- **Feasible with the CLI the repo already pins.** Supabase documents this exact recipe for GitHub Actions:
  `setup-cli` → `supabase link --project-ref` → `supabase db push`, with the secrets `SUPABASE_ACCESS_TOKEN`,
  `SUPABASE_DB_PASSWORD` and `SUPABASE_PROJECT_ID`. Source:
  [Managing environments](https://supabase.com/docs/guides/deployment/managing-environments).
  The `smoke` job already installs CLI `2.117.0` with `supabase/setup-cli@v1` (`.github/workflows/ci.yml:39-42`).
- **IPv4 runners are covered by `link`.** GitHub-hosted runners have no IPv6, and the direct DB host is IPv6-only.
  In CLI v2.117.0, `link` stores the session pooler URL (port 5432), and `db push` falls back to it when the
  direct host is unreachable. Checked in the `supabase/cli` source at tag v2.117.0; see the IPv4/IPv6 finding below.
  A `--db-url` path without a token exists, but it gets no fallback and puts the Postgres password in a URL secret.
- **Three GitHub secrets are missing.** The repo has exactly 5 secrets: `SUPABASE_URL`, `SUPABASE_KEY`,
  `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `VERCEL_TOKEN` (`gh secret list`, observed 2026-09-29). Neither
  `SUPABASE_ACCESS_TOKEN` nor `SUPABASE_DB_PASSWORD` is among them. `deploy-plan.md:68` records the local `.env`
  as the only copy of the DB password. Creating the secrets is a human step.
- **Ordering changes, the compatibility requirement does not.** Today the hosted DB is pushed before the merge,
  from a laptop or the ship agent (`CLAUDE.md:59`, `step-prompts.md:183-185`). In CI the push would run after the
  merge, a few minutes before `vercel deploy`. In both flows production code briefly runs against the new schema,
  so migrations must stay backward-compatible with the previous deploy. That rule is implicit today and should be
  written down.
- **Failure leaves the schema partly applied, and production code unchanged.** `db push` runs each migration
  file in its own transaction. Earlier files stay applied and recorded, and the failing file rolls back, unless it
  contains a statement that cannot run in a transaction (`CREATE INDEX CONCURRENTLY` and similar). A failing step
  stops the job, so `vercel deploy` does not run. The repo has no runbook for a failed hosted migration
  (`infrastructure.md:87` only says "write down-migrations").
- **Docs and rules to change**, across `CLAUDE.md`, `AGENTS.md`, `deploy-plan.md`, `infrastructure.md`,
  `.claude/settings.local.json` and the `10x-autonomous-run` skill: the lines listed in Code References (the
  searched set, not guaranteed exhaustive outside it). The local `soft_deny` on `npx supabase db push` stays; only its rationale text changes.

## Detailed Findings

### The `deploy` job today

- The job runs `needs: [ci, smoke]`, only on push to `main`, with `concurrency: production`
  (`.github/workflows/ci.yml:69-73`). There is no `cancel-in-progress`, so a running deploy is not cancelled.
- Steps: checkout → setup-node → `npm ci` → `vercel pull --environment=production` → `npm run build` →
  `vercel deploy --prebuilt --prod` (`ci.yml:78-86`). It has no Supabase CLI and no DB step.
- pgTAP (`supabase test db`) and smoke run against a throwaway local Supabase in the `smoke` job (`ci.yml:44-65`),
  so every migration has been applied from scratch and tested before `deploy` starts.

### Supabase CLI in CI (v2.117.0)

- **Auth** ([Managing environments](https://supabase.com/docs/guides/deployment/managing-environments)):
  - The access token authenticates Management API calls: `link`, reading the pooler config, and creating a
    temporary login role when no password is given.
  - `SUPABASE_DB_PASSWORD` is the Postgres credential `push` uses.
  - `SUPABASE_PROJECT_ID` is the ref. It is not secret; `deploy-plan.md:12` already publishes it.
- **Scoped tokens**
  ([personal access tokens](https://supabase.com/docs/guides/platform/personal-access-tokens)):
  - Scoped tokens (prefix `sbp_fc`) can be limited to chosen projects and permissions. Supabase recommends them
    for CI.
  - Classic tokens carry full account access.
  - Not confirmed: the minimum permission set `link` needs.
- **IPv4/IPv6**
  ([troubleshooting](https://supabase.com/docs/guides/troubleshooting/supabase--your-network-ipv4-and-ipv6-compatibility-cHe3BP)):
  - The direct connection is IPv6 by default, and GitHub Actions is listed as IPv4-only.
  - In `supabase/cli` at v2.117.0, `link` saves the pooler URL with session port 5432
    (`legacy-link-services-core.ts`).
  - `push` tries the direct host, then falls back to that saved pooler URL (`legacy-db-config.layer.ts`).
- **`db push` semantics** (`legacy-db-push-core.ts` and `legacy-migration-apply.ts` at v2.117.0):
  - Each file is one implicit transaction, and its history row is written in the file's last batch.
  - Non-transactional statements commit the open batch first (supabase/cli#5156).
  - `seed.sql` runs only with `--include-seed`, which defaults to false. This matches `CLAUDE.md:57`.
  - It refuses to run when the remote has versions that are missing locally ("Remote migration versions not found
    in local migrations directory"), and when local files are older than the latest remote version unless
    `--include-all` is passed.
  - `--dry-run` still connects and runs the history checks. It lists pending files, or prints "Remote database is
    up to date." and exits 0.
  - There is a confirmation prompt that defaults to yes. Its non-TTY behaviour is unverified, so pass `--yes`.
- **The ledger is aligned today.** `npx supabase migration list` on 2026-09-28 showed 6 local = 6 remote, with
  `20260928120000` the latest (run log of `context/runs/2026-09-28-s05-s06-s07/`). The first CI push therefore
  starts from a clean ledger.
- **CLI install:**
  - `supabase/setup-cli` is at v3 upstream; `@v1` (latest v1.7.3) still works.
  - The docs example still uses `@v1` with `version: latest`, which the repo rejected because of drift
    (`ci.yml:41`).
  - Pinning the same `2.117.0` in `deploy` keeps both jobs on one CLI. Moving to v3 is a separate change.

### Ordering and failure handling inside `deploy`

This section is inference from the job structure above and the CLI semantics; it has not been run.

- **Recommended order:** `npm ci` → `vercel pull` → `npm run build` → `setup-cli` → `supabase link` →
  `db push --dry-run` (logged) → `db push --yes` → `vercel deploy --prebuilt --prod`.
  - Building before pushing means a build failure leaves both schema and code untouched.
  - The gap between the push and the deploy shrinks to the upload of the prebuilt output.
- **If the migration fails:**
  - The job goes red and `vercel deploy` is skipped.
  - Production keeps the previous deploy, with the files before the failing one already applied.
  - Recovery is human: a fix-forward migration through a new PR, or `migration repair` if the ledger is wrong.
    This keeps `vercel rollback`/`promote` human-only (`CLAUDE.md:9`).
- **If `vercel deploy` fails after a successful push:**
  - The schema is ahead of the code. This is the same situation as today's push-before-merge window, just shorter.
  - It is safe only if the migration is backward-compatible; see Architecture Insights.
- **A re-run of the job is safe:** `db push` on an up-to-date remote is a no-op ("Remote database is up to date").
- **Secrets scope:** put the two Supabase secrets on a GitHub Environment, for example `production` (the name
  already used by `concurrency`), and reference it from `deploy` only. `ci` and `smoke` run on PRs and should not
  see them. The repo does not use GitHub Environments today (`ci.yml` has no `environment:` key).
- **Optional early drift check:** a `db push --dry-run` against hosted on PRs would surface ledger mismatches
  before the merge. It would expose the secrets to PR runs. The repo is private (`settings.local.json:23`), but
  keeping the secrets on the `deploy` job only is the smaller change.

### What `10x-autonomous-run` and the local rules must change

- **Ship step:** drop local `db push`, dry-run and `migration list` before merge
  (`.claude/skills/10x-autonomous-run/references/step-prompts.md:183-185`). Instead:
  - merge after CI is green;
  - watch the `deploy` run (the DB step included);
  - verify with `npx supabase migration list` (local = remote).
  - Deploy-failure rule (`step-prompts.md:187-188`): add "a failed DB step → BLOCKED with the run URL, no local
    push, no repair".
- **SKILL.md:**
  - description (`:3`) and Step 0 question 2 (`:29`);
  - preflight `supabase projects list` + `.temp/project-ref` (`:50`). The link is still needed for
    `migration list` verification, which is read-only.
  - the never-list line about `db push` (`:125`).
- **process.md:** chain (`:39`), trap 9 "Hosted DB before merge" (`:116`), ship authorisation (`:121-124`).
- **gates.md:31:** the ship gate keeps `migration list` local = remote. It now proves that CI did the push.
- **agent-contract.md:44-45:** "Only the Ship step … runs `npx supabase db push`" → no step runs it.
- **settings.local.json:15:** the `soft_deny` on `npx supabase db push` stays. Its "except within … 10x-autonomous-run"
  clause goes, as `change.md` intends. The environment text at `:25-27` and `:37-38` lists the CI secrets and the
  deploy steps and needs the new secrets and step.

## Code References

- `.github/workflows/ci.yml:39-42` — `supabase/setup-cli@v1`, CLI pinned `2.117.0` (smoke job)
- `.github/workflows/ci.yml:69-86` — `deploy` job: needs, `concurrency: production`, Vercel steps; insertion point before `:86`
- `CLAUDE.md:59` — "Reaching the hosted DB is a human step — `npx supabase link` … then `npx supabase db push`, **before** merging"
- `CLAUDE.md:60`, `:65` — production deploy description; `deploy` needs the `VERCEL_*` secrets
- `CLAUDE.md:57` — seed is local/CI only, `db push` never applies it (unchanged)
- `AGENTS.md:43` — production ships only from `deploy` (add the DB step)
- `context/deployment/deploy-plan.md:29` — production path (Vercel only)
- `context/deployment/deploy-plan.md:58-68` — secrets inventory; `:68` DB password only in local `.env`
- `context/deployment/deploy-plan.md:75-76` — "Human only: … Supabase migrations against the hosted DB"; rollback does not touch Supabase
- `context/foundation/infrastructure.md:87-88` — down-migrations note; "a human … applies Supabase migrations"
- `.claude/settings.local.json:15` — `soft_deny` `npx supabase db push` (rationale text); `:25-27`, `:37-38` environment text
- `.claude/skills/10x-autonomous-run/SKILL.md:3`, `:29`, `:50`, `:110`, `:125`
- `.claude/skills/10x-autonomous-run/references/process.md:39`, `:101`, `:116`, `:121-124`
- `.claude/skills/10x-autonomous-run/references/step-prompts.md:166`, `:172`, `:183-185`, `:187-188`, `:192`
- `.claude/skills/10x-autonomous-run/references/gates.md:31`; `agent-contract.md:44-45`; `run-log-template.md:56`

## Architecture Insights

- **One gate for schema and code.** After the change, a migration reaches production only from a commit on `main`
  whose `ci` + `smoke` (with pgTAP on a fresh DB) are green. This is the same gate code already has, and it removes
  the production token from every laptop and agent session.
- **The backward-compatibility rule becomes explicit.** Both today's flow and the CI flow have a window in which
  the old code runs on the new schema. The 6 existing migrations fit that rule: they are additive tables and
  functions, plus one FK/unique swap (`20260924122144_transactions_import_account_fk.sql:10-11`). A destructive
  change (drop/rename used by live code) needs the expand → deploy → contract sequence over two merges. Nothing in
  the repo says so; the plan should add it to `CLAUDE.md`.
- **What stays human:** rollback (`vercel rollback`/`promote`), `migration repair`, hosted `db reset`, and
  creating or rotating the new secrets. CI never repairs.

## Historical Context (from prior changes)

- `context/archive/2026-09-21-settings-account/plan-brief.md:46`, `plan.md:274-294` — origin of "push before merge":
  "Merge przed `db push` → produkcyjne `?error=delete`". This is **supported** as a reason, and the CI order (push
  then deploy, same job) meets the same need.
- `context/archive/2026-09-21-settings-account/reviews/impl-review.md:64-65` — the first migration went in via
  `psql`; the ledger was then missing and needed `migration repair`; `link` needs a CLI access token. **Supported**
  and still relevant: CI also needs a token, or the `--db-url` path.
- `context/archive/2026-09-23-domain-schema-rls/plan.md:50`, `ing-csv-import/plan.md:321` — human push before
  merge. **Superseded** by the autonomous-run ship step (2026-09-27/28 runs), which this change supersedes again.
- `context/deployment/deploy-plan.md:148` — CI registry rate limits (smoke image pulls). Not related to `deploy`,
  which would pull no images: `link`/`push` are API and pooler calls.

## Related Research

- Not applicable: no earlier research on CI migrations. Related decision log: `context/runs/2026-09-28-s05-s06-s07/orchestration-notes.md`.

## Open Questions

To verify during implementation. None of these blocks planning.

1. The minimum scoped-token permissions for `link` + `db push`. Create the token scoped to
   `psqbtvooufapkatpkxlw`, and widen it only if the first run fails with a permission error.
2. The exit code of a failed `db push`, and prompt behaviour without a TTY. Pass `--yes`, and check once that a
   failing push turns the step red. The inference from the source is non-zero, but it is untested.
3. Product and ops choice for the plan: GitHub Environment `production`, with or without required reviewers.
   Required reviewers would reintroduce a human click per deploy.
4. A safe first run: this change ships no migration. Its own merge exercises `link` plus `db push` as a no-op
   ("Remote database is up to date"), which proves the wiring before the first real migration goes through CI.
