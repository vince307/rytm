<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Hosted Supabase migrations from the CI `deploy` job

- **Plan**: context/changes/ci-db-push/plan.md
- **Scope**: Full plan (completed phases; Phase 4 rollout pending)
- **Reviewed phases**: 1, 2, 3
- **Date**: 2026-09-29
- **Verdict**: REJECTED → all 7 findings fixed in triage (2026-09-29)
- **Findings**: 1 critical, 2 warnings, 4 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS |
| Scope Discipline | PASS |
| Safety & Quality | FAIL |
| Architecture | PASS |
| Pattern Consistency | PASS |
| Success Criteria | WARNING |

## Findings

### F1 — The ledger step prints a text table in CI, so `hosted-ledger.sh` never finds the JSON

- **Severity**: ❌ CRITICAL
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: .github/workflows/ci.yml:115; context/changes/ci-db-push/reviews/local-push-failure.md
- **Detail**:
  - CLI 2.117.0 picks JSON output only when `--output-format json` is given or an AI agent is detected (`AI_AGENT`, `CLAUDECODE`, …). A TTY has nothing to do with it.
  - The local proof ran inside Claude Code, which sets those vars, so it saw JSON and blamed the missing TTY.
  - Re-checked: with the agent vars removed and `CI=true`, `migration list` prints the text table. With `--output-format json` it prints JSON.
  - On GitHub Actions every ship gate would fail with "no migration ledger JSON". This fails safe (no false OK), but it blocks the autonomous run.
- **Fix**: add `--output-format json` to the `Hosted migration ledger` step, and correct the conclusions in `local-push-failure.md` (JSON comes from agent detection, not from the missing TTY).
- **Decision**: FIXED — `--output-format json` on the ledger step (ci.yml), conclusions in local-push-failure.md corrected

### F2 — Local allow rules pre-approve the hosted commands that `soft_deny` is meant to stop

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Safety & Quality
- **Location**: .claude/settings.local.json:8-9, :15
- **Detail**:
  - `permissions.allow` holds `Bash(npx supabase *)` and `Bash(npm *)`.
  - These match `npx supabase db push`, `npx supabase link --project-ref psqbtvooufapkatpkxlw`, `migration repair`, `db reset --linked` and `npm exec supabase …`.
  - An explicit allow is likely checked before the auto-mode `soft_deny` classifier, so the plan's "local `db push` denied without exception" may not hold.
  - `soft_deny` also names only the `npx supabase db push` spelling.
  - Whether this allow rule predates the change was not established (the file is gitignored).
  - Precedence between the two was not verified.
- **Fix A ⭐ Recommended**: add hard `permissions.deny` rules for `npx supabase db push*`, `npx supabase link*`, `npx supabase migration repair*`, `npx supabase db reset --linked*` and `npm exec supabase*`
  - Strength: a deny rule wins over allow, independent of the classifier, and routine local commands (`start`, `test db`, `migration new`) keep working without prompts.
  - Tradeoff: a human doing `migration repair` has to run it outside Claude Code (via the `!` prefix or a terminal).
  - Confidence: HIGH — deny precedence over allow is documented Claude Code behaviour.
  - Blind spot: other spellings (for example `node_modules/.bin/supabase`) stay reachable, and the soft_deny still covers them only by its wording.
- **Fix B**: narrow the allow rule to specific local subcommands (`start`, `stop`, `status`, `test db`, `migration new`, `migration list --local`, `gen types`, `db reset` without `--linked`)
  - Strength: hosted commands fall back to a permission prompt plus the soft_deny, with no hard block.
  - Tradeoff: every unlisted local command prompts; the list needs upkeep.
  - Confidence: MED — depends on how well the patterns match the real invocations.
  - Blind spot: which local supabase subcommands the skills actually use has not been counted.
- **Decision**: FIXED via Fix A — permissions.deny for npx supabase db push/link/migration repair/db reset --linked and npm exec supabase

### F3 — `hosted-ledger.sh` can report LEDGER OK for renamed or edited migrations, and breaks on GNU xargs

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: .claude/skills/10x-autonomous-run/scripts/hosted-ledger.sh:22-27
- **Detail**:
  - `--diff-filter=A` skips migrations that were renamed (`R`) or edited (`M`) in the merge.
  - `db push` never re-applies a version that is already applied, so hosted can differ from the repo while the script prints OK.
  - A ledger row with `local != remote` (pending or orphaned) is not checked.
  - `xargs basename` on empty input exits 123 on GNU/Linux; it happens to work on macOS.
- **Fix**:
  - Fail when the merge changes `supabase/migrations` with M, R or D.
  - Fail when any ledger row has `local != remote`.
  - Replace `xargs basename` with `sed 's#.*/##'`.
- **Decision**: FIXED — fails on M/D (renames as D+A via --no-renames) and on any local != remote row; sed instead of xargs basename

### F4 — Skill wording still says the ship gate checks "GitHub and Supabase"

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: .claude/skills/10x-autonomous-run/SKILL.md:97; references/process.md:100
- **Detail**: Both gates now read only the GitHub deploy log; "Supabase" suggests hosted access the agent no longer has.
- **Fix**: say "GitHub (deploy log)" instead.
- **Decision**: FIXED — "GitHub (incl. the deploy log)" in SKILL.md and process.md

### F5 — Stale doc lines next to the new fix-forward rule

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: context/foundation/infrastructure.md:87; context/deployment/deploy-plan.md:141
- **Detail**:
  - `infrastructure.md:87` still says "write down-migrations before applying up", which clashes with fix-forward.
  - `deploy-plan.md:141` (a dated history entry) points to a "Human only … Supabase migrations against the hosted DB" line "below" that no longer exists.
- **Fix**:
  - `infrastructure.md:87`: say failed or bad migrations are fixed forward in a new PR.
  - `deploy-plan.md:141`: add "(rule replaced 2026-09-29 by `ci-db-push`)".
- **Decision**: FIXED — fix-forward in infrastructure.md; replaced-rule note on the deploy-plan.md history line

### F6 — A cancelled queued deploy leaves the ledger check reading the wrong run

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: .github/workflows/ci.yml:77; .claude/skills/10x-autonomous-run/references/step-prompts.md (DEPLOY step)
- **Detail**:
  - With `concurrency: production` and no `cancel-in-progress`, a running deploy is never cut. But when two merges land close together, the older queued deploy is cancelled.
  - Its migrations still ship with the newer run.
  - `hosted-ledger.sh` on the older run then fails with "no ledger" (safe, but a false BLOCKED).
  - The script also does not check that the run's `headSha` matches the given sha; `gates.md` does.
  - `$sha^1` assumes merge commits, which is right for `gh pr merge --merge`.
- **Fix**: in the DEPLOY step, if the merge-sha run's deploy was cancelled, run the check on the newest green `main` run that contains the merge sha. Add a `--merge`-only comment next to `$sha^1`.
- **Decision**: FIXED — DEPLOY step checks the newest main run containing the merge when a deploy was cancelled; `--merge` comment next to `$sha^1`

### F7 — `db push` would also sync Vault secrets from `config.toml`

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: .github/workflows/ci.yml:105-109
- **Detail**:
  - `db push` in 2.117.0 also updates Vault secrets from `[db.vault]` in `supabase/config.toml`.
  - That section is commented out today, so nothing happens. Uncommenting it later would silently change production Vault from CI.
- **Fix**: pass `--skip-vault` to the dry-run and push steps if `db push` 2.117.0 has the flag (check `supabase db push --help`).
- **Decision**: FIXED — `--skip-vault` on dry-run and push (flag confirmed in the 2.117.0 binary)
