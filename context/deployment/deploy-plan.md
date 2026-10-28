---
project: rytm
deployed_at: 2026-09-18
platform: VPS (Docker container behind Caddy, ariom-infra)
production_url: https://rytm.ariom.cloud
image: ghcr.io/vince307/rytm:<commit sha>
previous_platform: Vercel Hobby, team kamilps-projects, project rytm, fra1, https://rytm-phi.vercel.app (until the VPS cut-over)
deploy_path: github-actions-gate
repository: https://github.com/vince307/rytm
supabase: self-hosted stack rytm-supabase on the VPS (former hosted project psqbtvooufapkatpkxlw, eu-central-1, retired)
context_type: mvp
source_contracts:
  - context/foundation/infrastructure.md
  - context/foundation/tech-stack.md
---

# Deploy plan — first production deployment

## Current production: VPS (ariom-cloud-hosting, 2026-10)

Rytm left Vercel for the owner's VPS; Supabase moved from the hosted project `psqbtvooufapkatpkxlw` to the self-hosted stack `rytm-supabase` on the same VPS. The app reaches it at `SUPABASE_URL=http://kong:8000` (internal Docker network, anon key in `/opt/apps/rytm/.env`); e-mailed links go to `https://rytm.ariom.cloud/auth/v1/...`. Database backups: `ariom-db-backup` (ariom-infra). The Vercel sections below are the audit trail of the first deployment and no longer describe production.

- **Runtime**: `@astrojs/node` standalone (`dist/server/entry.mjs`) in the image built from `Dockerfile` (`node:22.14.0-bookworm-slim`, `USER node`, `HOST=0.0.0.0`, `PORT=4402`). One container per host, published on `127.0.0.1:4402` only; Caddy terminates TLS for `https://rytm.ariom.cloud` and reverse-proxies to it. Compose file, env file and the deploy dispatcher live in the `ariom-infra` repo (`server/apps/rytm/compose.yml`, `server/app-deploy`), installed under `/opt/apps/rytm/`.
- **Health**: `GET /api/health` → `200 {"status":"ok"}`; touches neither Supabase nor env, so a paused database does not make the container unhealthy. Used by the compose healthcheck, by `app-deploy` and by the `deploy` job's final public check.
- **Behind the proxy**: `astro.config.mjs` sets `security.allowedDomains: [{ hostname: "rytm.ariom.cloud", protocol: "https" }]`, so Astro trusts Caddy's `X-Forwarded-Proto`/`X-Forwarded-Host` for that host only. Without it `context.url` is `http://…`: every form POST gets 403 from Astro's origin check and e-mailed links (`signup.ts`, `resend.ts`, `reset.ts` build them from `context.url.origin`) point at `http://`. `scripts/check-proxy-origin.mjs` (CI `smoke` job) guards both against the built server.
- **Production path**: push to `main` → `ci` + `smoke` + `image` (build, push `ghcr.io/vince307/rytm:<sha>`) → `deploy`: Tailscale (`tag:ci`) → `ssh apps-deploy@$DEPLOY_HOST status rytm` (fails before the schema changes if the VPS is unreachable) → `migrate rytm --dry-run` → `migrate rytm` → `migrations rytm` (migration tar piped over SSH; the "Migration ledger" step, JSON `{version,name}` list) → `login rytm` (job token on stdin) → `deploy rytm <sha>` → `logout rytm` (always) → `curl -fsS https://rytm.ariom.cloud/api/health`. `app-deploy` pulls, switches the tag, waits for the health check and restores the last good tag by itself when it fails (the job then fails).
- **Rollback**: `ssh apps-deploy@<host> rollback rytm` — back to the good tag before the last one (a second rollback returns). Owner only (or a CI job); it does not touch Supabase, a bad migration is still fixed forward. `status rytm` shows the tags, container state and local images.
- **Runtime env** (`/opt/apps/rytm/.env`, `640 root:apps-deploy`, never in the image or the repo): `SUPABASE_URL` (`http://kong:8000`), `SUPABASE_KEY` (anon key of the self-hosted stack), `DEMO_EMAIL`; `CRON_SECRET` is optional and unused in production now.
- **GitHub secrets** read by `deploy` (environment `production`): `DEPLOY_HOST`, `DEPLOY_SSH_KEY`, `DEPLOY_KNOWN_HOSTS`, `TS_OAUTH_CLIENT_ID`, `TS_OAUTH_SECRET`. No `SUPABASE_ACCESS_TOKEN` / `SUPABASE_DB_PASSWORD` any more. The image push and the server's pull use the job's own `GITHUB_TOKEN` (`packages: write` in `image`, `packages: read` in `deploy`); no PAT.
- **Supabase Auth URL configuration** (self-hosted GoTrue config in the `rytm-supabase` stack, owner): Site URL `https://rytm.ariom.cloud` and Redirect URLs must contain `https://rytm.ariom.cloud/**`; otherwise GoTrue rewrites every e-mailed `redirect_to` to the Site URL. Local `supabase/config.toml` lists the same pattern so the proxy check can prove it.
- **Keep-alive**: removed (`.github/workflows/keep-alive.yml` deleted); a self-hosted database does not auto-pause. The `/api/keep-alive` route stays only because the smoke test exercises it.
- **Migrations**: files in `supabase/migrations/` (`<14 digits>_<name>.sql`, no backslash anywhere — the server rejects it; guarded by `test/unit/migrations-no-backslash.test.ts`). `migrate rytm` is the forced-command entry used only by the CI `deploy` job. `migration repair` and a production database reset are owner-only: root on the VPS, `docker exec` into the stack's Postgres container.
- **No previews**: there is no preview deploy any more; test a production build locally with `npm run build && node dist/server/entry.mjs` or the image (`docker build -t rytm:local .`).

Audit trail for the first deployment, executed from Plan Mode on 2026-09-18 against the decision in `infrastructure.md` (Vercel over Cloudflare Workers). This file is the source of truth for **what is already deployed and which secrets are wired**; milestone planning reads it before touching infrastructure.

## Decisions taken during the deploy

| Decision               | Choice                                                                                                                                                                                                                                                 | Why                                                                                                                                                                       |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hosted Supabase        | New project `rytm`, `eu-central-1`, created from the CLI (`supabase projects create`)                                                                                                                                                                  | Same region as the `fra1` function; keeps `getUser()` round-trips inside Frankfurt                                                                                        |
| Production path        | **GitHub Actions after the gate**: push to `main` → `ci` + `smoke` → `deploy` (`vercel pull` → `npm run build` → `supabase link` → `db push` → `migration list` → `vercel deploy --prebuilt --prod`; hosted migrations since 2026-09-29, `ci-db-push`) | `tech-stack.md` asks for auto-deploy-on-merge _and_ the risk register wanted CI to be a real gate; Vercel's Git integration cannot do both                                |
| Vercel Git integration | Connected, but `main` disabled in `vercel.json` (`git.deploymentEnabled.main = false`)                                                                                                                                                                 | Previews for every other branch/PR still build automatically                                                                                                              |
| Framework preset       | `"framework": "astro"` in `vercel.json`                                                                                                                                                                                                                | `vercel link --yes` created the project as "Other"                                                                                                                        |
| Node version           | `engines.node = "22.x"` in `package.json`                                                                                                                                                                                                              | Vercel defaults new projects to 24.x; `.nvmrc` is 22.14                                                                                                                   |
| `astro preview`        | Removed from `package.json`                                                                                                                                                                                                                            | `@astrojs/vercel` 11 has no preview entrypoint (confirmed: "The @astrojs/vercel adapter does not support the preview command"); CI smoke runs against `astro dev` instead |
| ESLint                 | `design/**` ignored                                                                                                                                                                                                                                    | The read-only design kit's prototype JS had 103 errors that would have failed the gate on every push                                                                      |

## What changed in the repo

Commits `4b27098` (swap) and `aaad9c9` (framework preset), then this file.

- `package.json` / `package-lock.json`: `@astrojs/cloudflare` + `wrangler` → `@astrojs/vercel@11.0.10`; `engines.node`; no `preview` script
- `astro.config.mjs`: `adapter: vercel()` (no sub-path, default Node middleware, `env.schema` unchanged)
- `wrangler.jsonc`: deleted · `vercel.json`: new
- `.gitignore`: Cloudflare entries removed (`.vercel/` was already ignored)
- `.github/workflows/ci.yml`: `smoke` fixed (no `.dev.vars`, empty-secret guard, `astro dev` target); new `deploy` job
- `eslint.config.js`: ignore `design/**`
- Docs: `CLAUDE.md`, `AGENTS.md`, `README.md.scaffold`, `scripts/smoke.mjs` header — every Cloudflare reference replaced
- Untouched: `src/lib/supabase.ts`, `src/middleware.ts` (already read `astro:env/server`, which maps to Vercel env vars)

## What is deployed

- **Vercel** project `rytm` in team `kamilps-projects` (Hobby), function region `fra1`, Node 22.x, framework Astro, Build Output API (`.vercel/output/`)
- **Production alias**: `https://rytm-phi.vercel.app` (also `rytm-kamilps-projects.vercel.app`). `rytm.vercel.app` belongs to a different account — do not use it.
- Raw deployment URLs (`rytm-<hash>-kamilps-projects.vercel.app`) sit behind Vercel Authentication and answer **302 to SSO**, not the app — verify against the alias, never the deployment URL.
- First production deploy: `vercel deploy --prod --yes` from this machine on 2026-09-18 (human gate). Every later production deploy comes from the `deploy` job.
- **Supabase** hosted project `rytm` (`psqbtvooufapkatpkxlw`, Postgres 17, `eu-central-1`). First migration `20260921120000_delete_own_account.sql` applied on 2026-09-22 (details in the 2026-09-22 section). It went in through `psql`, **not** `supabase db push`; since 2026-09-23 the project is `supabase link`ed on the owner's machine and `supabase migration list` shows `20260921120000` as applied remotely, so the migration ledger exists and the next `db push` applies only new files (impl-review F2). Second migration `20260923165530_domain_imports_transactions.sql` (F-01: `imports`, `transactions`) applied with `npx supabase db push` by the owner on 2026-09-23 — the first migration shipped through the ledger; third `20260924122144_transactions_import_account_fk.sql` (impl-review F1/F4) on 2026-09-24. Auth uses the new-style **publishable** key.
- **GitHub** `vince307/rytm` (private), default branch `main`, remote `origin`.

## Secrets inventory

Vercel-era inventory. Since the VPS move the `Vercel env` rows live in `/opt/apps/rytm/.env`, the `VERCEL_*` GitHub secrets are no longer read by any workflow (delete them with the Vercel project), and the deploy secrets are listed under _Current production_ above.

| Where                           | Name                                 | Environments / notes                                                                                                                                                                                                                                                                                                                                   |
| ------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Vercel env                      | `SUPABASE_URL`                       | production, preview (encrypted)                                                                                                                                                                                                                                                                                                                        |
| Vercel env                      | `SUPABASE_KEY`                       | production, preview (`--sensitive`: cannot be read back with `vercel env pull`)                                                                                                                                                                                                                                                                        |
| Vercel env                      | `DEMO_EMAIL`                         | production, preview (previews share the production database, so the guard must hold there too); not a secret (it is published in the README; `astro.config.mjs` declares it `access: "secret"` only to keep it server-side), but added and changed only by the human like every Vercel env var; unset = no demo account (S-09, see Demo account below) |
| Vercel env                      | `CRON_SECRET`                        | production only; bearer for `/api/keep-alive` (Supabase keep-alive). Must equal the GitHub secret of the same name — rotate both together; mismatch → 401 and the daily ping fails                                                                                                                                                                     |
| GitHub secrets                  | `CRON_SECRET`                        | read by `.github/workflows/keep-alive.yml` (daily 03:17 UTC + manual `workflow_dispatch`), which pings `https://rytm-phi.vercel.app/api/keep-alive` so the free-tier project never auto-pauses                                                                                                                                                         |
| GitHub secrets                  | `SUPABASE_URL`, `SUPABASE_KEY`       | used by the `ci` build step                                                                                                                                                                                                                                                                                                                            |
| GitHub secrets                  | `VERCEL_TOKEN`                       | account token `rytm-github-actions`, scope kamilp's projects — created in the dashboard, used by `deploy`                                                                                                                                                                                                                                              |
| GitHub secrets                  | `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` | from `.vercel/project.json`                                                                                                                                                                                                                                                                                                                            |
| GitHub Environment `production` | `SUPABASE_ACCESS_TOKEN`              | Supabase **scoped** access token limited to `psqbtvooufapkatpkxlw`; read only by the `deploy` job (`link`, `db push`, `migration list`); created and rotated by the human                                                                                                                                                                              |
| GitHub Environment `production` | `SUPABASE_DB_PASSWORD`               | Postgres password of the hosted project, used by `db push` through the session pooler; copy of the local `.env` value                                                                                                                                                                                                                                  |
| GitHub secrets                  | `VERCEL_AUTOMATION_BYPASS_SECRET`    | **not yet created** — needed only when a preview-smoke job is added                                                                                                                                                                                                                                                                                    |
| Local `.env` (gitignored)       | `SUPABASE_DB_PASSWORD`               | the owner's copy of the DB password (CI holds the other, on the `production` environment); keep it. Since 2026-09-20 `SUPABASE_URL`/`SUPABASE_KEY` here point at the local Docker Supabase (values from `.env.example`); the production pair lives only on Vercel and in GitHub secrets                                                                |

No secret value has ever been written to the repo or pasted into a chat; `vercel env add` and `gh secret set` were fed from `.env` via stdin.

## Operating model (who may do what)

Vercel-era; on the VPS the `vercel` commands are gone, rollback is `ssh apps-deploy@<host> rollback rytm` (owner or CI) and hosted migrations stay CI-only exactly as below.

- **Agent, unattended**: `npx vercel` (preview deploy), `vercel ls`, `vercel inspect <url> --logs`, `vercel logs <url>`, `vercel env ls`, `gh run watch`, `npm run smoke` against a local/preview server.
- **Human only (self-hosted era)**: `migration repair` and a production DB reset, as root on the VPS via `docker exec`; no Supabase tokens exist any more. Vercel-era list: `vercel deploy --prod` outside the workflow, `vercel rollback` / `vercel promote <url>`, `vercel env rm/add` (rotation → then redeploy), plan changes, deleting the project, `supabase migration repair` and a hosted `db reset`, creating/rotating `SUPABASE_ACCESS_TOKEN` and `SUPABASE_DB_PASSWORD`, rotating `VERCEL_TOKEN` (expiry ≤ 1 year — set a reminder).
- **CI only**: production migrations — the `deploy` job runs `ssh apps-deploy@… migrate rytm` (since the move to the self-hosted stack; formerly `supabase db push`) after `ci` + `smoke` are green on `main`, before `vercel deploy`. No human or agent runs `db push` against the hosted project.
- **Rollback**: `vercel rollback` (Hobby: only to the immediately previous production deployment) or `vercel promote <deployment-url>`. Neither touches Supabase; a failed or bad migration is fixed forward with a new migration in a new PR.
- **Logs**: 1-hour runtime retention on Hobby — import failures should be persisted app-side (risk register).

## Verification results (2026-09-18)

| Check                                                                             | Result                                                                         |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Local: `npm run lint`, `npx astro check`, `npm run build`                         | 0 errors; adapter `@astrojs/vercel`                                            |
| Local: `astro dev` `/` → 200, `/dashboard` → 302 `/auth/signin`                   | pass                                                                           |
| Supabase Auth API health/settings with the stored key                             | 200 / 200                                                                      |
| `vercel inspect`: target production, status Ready                                 | pass                                                                           |
| `https://rytm-phi.vercel.app/`                                                    | 200, `<title>10x Astro Starter</title>` (starter page — real UI not built yet) |
| `/dashboard` → 302 `/auth/signin`; `/auth/signin`, `/auth/signup` → 200 with form | pass                                                                           |
| Function region from `x-vercel-id`                                                | `arn1::fra1::…` → runs in `fra1` (`arn1` = edge PoP)                           |
| GitHub Actions run 35389120232 (before `VERCEL_TOKEN` existed)                    | `ci` ✅ `smoke` ✅ `deploy` ❌ (empty token — expected)                        |
| GitHub Actions run for this commit                                                | see run list — first green `deploy` closes the loop                            |

Not run against production: `npm run smoke` (creates real users, sends real emails).

## Verification results (2026-09-20) — live auth flow

Run 35505256578 (commit `fe4f549`): `ci` ✅ `smoke` ✅ `deploy` ✅ — the first fully green pipeline; production serves that build.

| Check                                                                                           | Result                                                                                                                                                                                               |
| ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Real signup on `/register` with the project owner's Gmail (done by the owner in the browser)    | 302 `/confirm-email`; confirmation mail arrived                                                                                                                                                      |
| Confirmation link (first signup, before `fe4f549`)                                              | `…/auth/v1/verify?token=pkce_…&type=signup&redirect_to=http://localhost:3000` — Site URL not yet applied; clicking it still confirmed the account (`auth.users.email_confirmed_at` set 10:25:23 UTC) |
| Signin on `/login` → `/home` (owner)                                                            | pass; session cookie `sb-…-auth-token` set                                                                                                                                                           |
| Signed-in: `/login`, `/register` → redirect to `/home`; `/home`, `/settings`, `/patterns` → 200 | pass                                                                                                                                                                                                 |
| Console errors / failed requests on `/home`, `/settings`                                        | none (5 requests, 200/304)                                                                                                                                                                           |
| `Wyjdź` → `POST /api/auth/signout` → `/`; cookie gone; `/home` → redirect `/login`              | pass                                                                                                                                                                                                 |
| Second signup with a non-member address (Yahoo) at 10:43 UTC                                    | `confirmation_sent_at` set, **mail never arrived** — see open step 1                                                                                                                                 |

Facts read from production `auth.users` with a read-only `SELECT` over the session pooler (`aws-0-eu-central-1.pooler.supabase.com:5432`, DB password from `.env`); nothing was written.

## E-mail delivery (2026-09-20, evening) — custom SMTP via Brevo

Done by the owner in the dashboards; verified by reading `auth.users` (read-only) and the app's runtime logs.

| Step                                                                                                                                                                    | Result                                                                                                                                                                                                          |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Supabase Auth URL configuration re-checked                                                                                                                              | the first two signups still carried `redirect_to=http://localhost:3000` (auth log `referer`), i.e. the earlier save had not applied; fixed by the owner                                                         |
| Brevo SMTP in Supabase (Auth → SMTP Settings): host `smtp-relay.brevo.com`, port `587`, username = Brevo SMTP login (`…@smtp-brevo.com`), password = Brevo **SMTP key** | first attempt: auth log `535 "5.7.8 Authentication failed"` → wrong credential pair; fixed                                                                                                                      |
| Sender                                                                                                                                                                  | `noreply@rytm.app` was rejected by Brevo (_sender not valid_: the domain is not ours). Sender is now `vince307@gmail.com` (Brevo single-sender verification), name `Rytm`                                       |
| Signup with a non-member address (Yahoo)                                                                                                                                | user created 19:14:04 UTC; after the sender fix the confirmation was re-sent 19:24:59, **delivered to Inbox**, link `redirect_to=https://rytm-phi.vercel.app/login`, confirmed 19:25:21, signed in 19:40:43 UTC |
| Rate limit                                                                                                                                                              | Supabase default with custom SMTP: 30 e-mails/hour (Auth → Rate Limits) — enough for the MVP                                                                                                                    |

Secrets: the Brevo SMTP key exists only in the Brevo and Supabase dashboards; nothing in the repo, Vercel or GitHub.

Recommendation (not a blocker): authenticate an owned domain in Brevo (DKIM/DMARC) and send from `noreply@<domain>`; a Gmail sender relayed through Brevo relies on Gmail's `p=none` DMARC and may land in spam at stricter providers.

## Verification results (2026-09-21, afternoon) — round-2 empty views (G18)

- Commit `ae72f1e` (`feat(app): empty views before the first import`) went through the `deploy` job (run 35615416702: `ci`, `smoke`, `deploy` all green) — the second production deploy done entirely by the GitHub Actions gate, no `vercel --prod` by hand.
- `/patterns`, `/fixed`, `/imports` now render the kit's empty view (`ViewEmpty.astro`, copy from `copy.emptyViews`) instead of the `InlineAlert` placeholder; anonymous requests still answer 302 → `/login`.
- **Verified on production by the owner** the same day: signed-in views show „Wgraj pierwszy wyciąg” + „Wgraj CSV ↗” → `/imports/new`.
- Smoke grew to 24 steps (`patterns renders empty view`, seeded user). No new secrets, env vars or Vercel settings — the secrets inventory above is unchanged.
- Still a placeholder: `/settings` (`copyExtra.stub`, waits for the G11 + FR-019 slice).

## Verification results (2026-09-22) — S-08 settings account (`settings-account`)

- Commits `8c9ded6` (backend + smoke), `d8d2594` (view), `f744e6c` (manual gate), `da073c5` (plan SHA) pushed to `main`. GitHub Actions run `35751978360` green end to end: `ci` → `smoke` → `deploy` (`vercel deploy --prebuilt --prod` from the workflow, not by hand).
- Hosted migration applied **by an agent on the owner's explicit instruction**, which deviates from the "Human only … Supabase migrations against the hosted DB" line in the operating model below (that rule was replaced on 2026-09-29 by `ci-db-push`: hosted migrations are applied only by the CI `deploy` job). Route: direct `psql` to `db.psqbtvooufapkatpkxlw.supabase.co` with `SUPABASE_DB_PASSWORD` from `.env`, because `supabase link` requires a CLI access token that is not on this machine (`~/.supabase` holds only telemetry). Follow-up closed 2026-09-23: the migration ledger exists (see Supabase above).
- `public.delete_own_account` on the hosted DB: `security definer`, `search_path=""`, owner `postgres`, ACL `postgres=X/postgres authenticated=X/postgres service_role=X/postgres` — neither `anon` nor `public` may execute.
- Guard checked without destroying anything: invoking it with no `auth.uid()` raises `delete_own_account requires an authenticated user`, and `auth.users` still holds 2 rows. `anon` through `POST /rest/v1/rpc/delete_own_account` → **401**.
- Production alias `https://rytm-phi.vercel.app`: `/settings` → **302 `/login`**, `/login` → 200, `?deleted=1` renders "Konto zostało usunięte.", and the old `copyExtra.stub` placeholder is gone.
- **Still open**: the full delete cycle on production with a disposable account (plan row 3.4). Production has e-mail confirmations on, so it needs a real inbox and stays with the owner.

## Verification results (2026-09-24) — F-01 domain schema (`domain-schema-rls`)

- `npx supabase db push --dry-run` listed only `20260923165530_domain_imports_transactions.sql`; the owner then ran `npx supabase db push` (human step, per the operating model). `npx supabase migration list` shows `20260921120000` and `20260923165530` both local and remote.
- Hosted schema checked with `npx supabase db dump --linked --schema public` (dump deleted afterwards): RLS enabled on `imports` and `transactions`; six policies — `select` / `insert` / `delete` per table, role `authenticated` only, each `(select auth.uid()) = user_id`; no `update` policy; `imports_no_overlap` exclusion constraint; `user_id` → `auth.users` `on delete cascade` on both tables plus `(import_id, user_id)` → `imports` `on delete cascade`. Grants: `anon` none; `authenticated` `SELECT, INSERT, DELETE, UPDATE, MAINTAIN` — no `TRUNCATE` / `TRIGGER` / `REFERENCES` (revoked in the migration because `TRUNCATE` bypasses RLS). `MAINTAIN` (Postgres 17 default) is not reachable through PostgREST and was left as is.
- Commits `10929f3` (schema + pgTAP + CI step) and `d8ad8bb` (typed client + docs) pushed to `main`. GitHub Actions run `35908863964`: the first attempt and two reruns on 2026-09-23 failed in `smoke` → "Start local Supabase" with `toomanyrequests` from ghcr.io and public.ecr.aws (registry rate limit on shared runner IPs, not the change); the rerun on 2026-09-24 was green end to end — `Run database tests` 25/25, smoke green, `deploy` shipped `d8ad8bb`.
- Production alias `https://rytm-phi.vercel.app`: `/` → 200, `/settings` → **302 `/login`**. The app does not read the new tables yet (S-01).
- If registry rate limits recur in CI: rerun failed jobs after a while; if it becomes frequent, cache Docker images between runs and pin the Supabase CLI version in `ci.yml` (today `version: latest`).
- Impl-review follow-up (commit `667b27a`): migration `20260924122144_transactions_import_account_fk.sql` applied with `npx supabase db push` by the owner on 2026-09-24 (tables still empty). Hosted schema re-checked with a `db dump` (deleted afterwards): FK `transactions_import_account_fkey (import_id, user_id, account_number)` → `imports` on delete cascade, key `imports_id_user_id_account_number_key`; `authenticated` now holds only `SELECT, INSERT, DELETE` on both tables (UPDATE and MAINTAIN revoked), `anon` nothing. `migration list` shows all three migrations local and remote. CI pins `supabase/setup-cli` to `2.117.0`.
- Plan row 3.4 closed 2026-09-24 by the owner: the production delete cycle on a disposable account (confirmed signup → `/settings` → password + `USUŃ`) ends on `/login?deleted=1` with the new cascades in place.

## CI migrations (2026-09-29) — `ci-db-push`

- The `deploy` job binds the GitHub Environment `production` and runs, between `npm run build` and `vercel deploy`: `supabase/setup-cli@v1` (`2.117.0`) → `Link hosted Supabase` → `Pending hosted migrations` (`db push --dry-run`) → `Push hosted migrations` (`db push --yes`) → `Hosted migration ledger` (`migration list`). A failed migration stops the job before Vercel; earlier files stay applied.
- Local proof (`context/changes/ci-db-push/reviews/local-push-failure.md`): a failing `db push --yes` without a TTY exits 1 and rolls back the failing file. The CLI prints JSON only with `--output-format json` (or when it detects an AI agent), so the ledger step passes it explicitly; the dry-run and push steps print text. Both push steps use `--skip-vault` (impl-review F1, F7).
- Migrations must be backward-compatible with the deploy in production (hard rule in `CLAUDE.md`).
- First run (2026-09-30): merge `98a306c` (PR #10), run https://github.com/vince307/rytm/actions/runs/36756578942 . Attempt 1 failed at `Link hosted Supabase` — `Invalid access token format` (the secret held something other than the token; the CLI requires `^sbp_(oauth_|v0_)?[a-f0-9]{40}$`); Vercel was skipped and production stayed on the previous deploy. After re-setting `SUPABASE_ACCESS_TOKEN`, attempt 2 was green end to end: `Finished supabase link.`, dry-run and push both `Remote database is up to date.`, ledger 6 local = 6 remote up to `20260928120000` (`hosted-ledger.sh` → `LEDGER OK (0 new: none)`), then `vercel deploy --prod`; `https://rytm-phi.vercel.app/login` answers 200.

## Demo account (S-09)

One shared account that reviewers sign in to on `https://rytm.ariom.cloud` (until the cut-over `https://rytm-phi.vercel.app`); credentials are in `README.md` § Demo. The server recognises it by `DEMO_EMAIL` (trimmed, case-insensitive; `src/lib/demo.ts`). No script, migration or agent writes demo data to production — seeding and reset are owner steps in the app and the Supabase dashboard.

- **Env var**: `DEMO_EMAIL` in the server env file `/opt/apps/rytm/.env` (was: Vercel production and preview). Human only; a change takes effect when the container is recreated (next deploy).
- **Data rule**: only the synthetic fixture `test/fixtures/ing/Lista_transakcji_nr_0000123456_010926.csv` is ever imported into this account — never a real statement, the account is shared.

### Seeding (in order)

1. Pick the demo address and a strong password; both get published. The address needs no inbox (the user is confirmed by hand in step 4), so a reserved domain such as `demo@rytm.example` works.
2. Set `DEMO_EMAIL=<address>` in `/opt/apps/rytm/.env` on the VPS (at the first seeding: `printf '<address>' | vercel env add DEMO_EMAIL production` and the same for `preview`).
3. Deploy: merge to `main` and wait for the green `deploy` job (or wait for the next one, if the code is already live). Never create the user before the guard is live.
4. Supabase dashboard → project `rytm` → Authentication → Users → Add user → Create new user: the address and password, **Auto Confirm User** ticked.
5. Sign in on `https://rytm.ariom.cloud/login`.
6. `/imports/new`: import the fixture in the wizard with its default account „Rachunek Firmowy Główny” (not „Rachunek VAT”). Expected: 206 debits, 01.09.2025–31.08.2026; `/patterns`, `/fixed` and `/home` show the synthetic data.

### What the guard refuses

For the demo account only; every other account behaves as before.

| Action                                      | Redirect                        |
| ------------------------------------------- | ------------------------------- |
| Password change (`/api/auth/password`)      | `/settings?error=demo-password` |
| Account deletion (`/api/auth/delete`)       | `/settings?error=demo-delete`   |
| Undo an import (`/api/imports/delete`)      | `/imports?error=demo`           |
| Any import while the account has ≥ 1 import | `/imports/new?error=demo`       |
| New password via `/api/auth/reset/new`      | `/reset/new?error=demo`         |

Thresholds, pattern decisions (merge, exclude, type, name) and fixed-cost pinning stay usable, so visitors drift the demo state over time; there is no automatic reset.

### Known limitation

The guard is app-level only (a deliberate plan choice: no migration, no DB-level guard). RLS still lets the demo user delete its own imports, `delete_own_account` still runs for it, and GoTrue still accepts a password change. Someone holding the demo session token plus the project's anon key could call Supabase directly and skip the Astro endpoints. The anon key is server-only in this app (`astro:env/server`), which narrows this, but Supabase treats it as public by design. Recovery is the reset below. Not verified: whether the hosted project has double-confirm for e-mail changes (the demo address cannot receive mail, so with it on an e-mail change cannot complete).

### Reset

1. Supabase dashboard → project `rytm` → Authentication → Users: delete the demo user. The cascade removes its imports, transactions and pattern data.
2. Add the user again as in seeding step 4 (same address, Auto Confirm User), but with a **temporary, unpublished password** — with the published one, any reviewer who signs in before step 3 gets the empty account's one allowed import and could upload any statement.
3. Sign in with the temporary password and import the fixture again (step 6 above) — allowed, because the account is empty.
4. Set the published password back: dashboard → SQL Editor, `update auth.users set encrypted_password = extensions.crypt('<published password>', extensions.gen_salt('bf')) where email = '<demo address>';` (the app's own password change is refused for the demo account by design). Sign in once with the published password to confirm.

`DEMO_EMAIL` stays as it is; no deploy is needed.

**Seeded** 2026-10-01: `demo@rytm.example` added with Auto Confirm after the green `deploy` of PR #12; wizard import of the fixture's default account → 206 debits (01.09.2025–31.08.2026). Credentials in `README.md` § Demo.

## Manual steps still open

1. ~~PKCE callback~~ — done 2026-09-21 (`fe68166`) and **verified on production by the owner** the same day: signup with a non-member address → `/confirm-email` → „Wyślij ponownie” (re-sent 14:06:15 UTC) → link → `/auth/callback` → signed in on `/home` (`email_confirmed_at` 14:07:26, `last_sign_in_at` 14:08:56 UTC); „Nie pamiętam hasła” → link → `/reset/new` → new password → sign-in; `/register` with a taken address → occupied state. The Brevo mail landed in Yahoo's spam folder — see the sender-domain recommendation.
2. Optional: create the Protection Bypass for Automation secret and store it as `VERCEL_AUTOMATION_BYPASS_SECRET`.
3. Optional: sender domain for Brevo (see recommendation above).
4. ~~Before merging `ci-db-push`: create the GitHub Environment `production` (no required reviewers), a Supabase scoped access token for `psqbtvooufapkatpkxlw`, and `gh secret set SUPABASE_ACCESS_TOKEN --env production` / `gh secret set SUPABASE_DB_PASSWORD --env production` (fed from stdin).~~ — done 2026-09-30.

## Deferred (from the risk register)

- Preview-smoke job hitting the Vercel preview URL with `x-vercel-protection-bypass` (needs the bypass secret; smoke must assert on a page marker, not on 200).
- CSV import size cap + time budget (Hobby 4 active-CPU-hours is a project-wide kill switch); 4.5 MB body limit surfaced in the import UI.
- Persist import failures in a Supabase table (1-hour log retention).
- `/10x-rule-review` on `CLAUDE.md` and `AGENTS.md` after the doc rewrite.
- `npm audit`: `path-to-regexp` (high) via `@vercel/routing-utils` inside `@astrojs/vercel` — build-time only, no fix upstream yet; re-check on adapter updates.
- Local git is 2.28.0 and needs `http.version=HTTP/1.1` + `http.postBuffer` (set in this repo's `.git/config`) to push to GitHub; upgrading git removes the workaround.
- Monetisation or any non-personal use triggers the Hobby fair-use clause → re-run `/10x-infra-research` (Cloudflare Workers is the pre-approved runner-up).
