# Local proof: `supabase db push --yes` without a TTY (Phase 1, step 1.4)

Date: 2026-09-29 · CLI 2.117.0 (same pin as `ci.yml`) · target: local Supabase `rytm`
(`postgresql://postgres:postgres@127.0.0.1:54322/postgres` via `--db-url`), stdin `</dev/null`.

Closes research open question 2 (exit code of a failed push, prompt behaviour without a TTY).

| Case | Command | Exit | Output |
| --- | --- | --- | --- |
| Up to date | `db push --yes` | 0 | `{"upToDate":true,…,"message":"Local database is up to date."}` |
| Up to date | `db push --dry-run` | 0 | same, `"dryRun":true` |
| Broken migration | `db push --yes` with `20260929999999_break_check.sql` (`create table public.break_check` + `select` from a missing table) | **1** | prompt `[Y/n] y` answered by `--yes`, then `LegacyDbPushApplyError: relation "public.table_that_does_not_exist" does not exist (SQLSTATE 42P01)` |

After the failure:

- `migration list --local`: the same 6 versions as before, latest `20260928120000`; `20260929999999` is not recorded.
- `to_regclass('public.break_check')` is NULL: the file's transaction rolled back, including the statement before
  the failing one.
- The throwaway file was deleted; `git status --porcelain supabase/migrations` is empty.

Conclusions for the `deploy` job:

- A failing migration exits 1, so the `Push hosted migrations` step goes red and `vercel deploy` is skipped.
- `--yes` answers the confirmation prompt; nothing blocks without a TTY.
- ~~Without a TTY the CLI prints JSON~~ — **corrected by impl-review F1**: the JSON above appeared because the
  proof ran inside Claude Code. CLI 2.117.0 prints JSON only with `--output-format json` or when it detects an AI
  agent (`AI_AGENT`, `CLAUDECODE`, …); a TTY plays no part. Re-checked: with those vars removed and `CI=true`,
  `migration list --local` prints the text table; with `--output-format json` it prints JSON.
- So on GitHub Actions the dry-run and push steps print text (hosted: "Remote database is up to date."), and the
  `Hosted migration ledger` step passes `--output-format json` explicitly to print
  `{"migrations":[{"local":…,"remote":…},…]}` for the ship-gate check (`scripts/hosted-ledger.sh`).
- The exit-code and `--yes` conclusions above do not depend on the output format.
