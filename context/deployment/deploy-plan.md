---
project: rytm
deployed_at: 2026-09-18
platform: Vercel
plan: Hobby
team: kamilps-projects
vercel_project: rytm
region: fra1
production_url: https://rytm-phi.vercel.app
deploy_path: github-actions-gate
repository: https://github.com/vince307/rytm
supabase_project_ref: psqbtvooufapkatpkxlw
supabase_region: eu-central-1
context_type: mvp
source_contracts:
  - context/foundation/infrastructure.md
  - context/foundation/tech-stack.md
---

# Deploy plan — first production deployment

Audit trail for the first deployment, executed from Plan Mode on 2026-09-18 against the decision in `infrastructure.md` (Vercel over Cloudflare Workers). This file is the source of truth for **what is already deployed and which secrets are wired**; milestone planning reads it before touching infrastructure.

## Decisions taken during the deploy

| Decision               | Choice                                                                                                                                              | Why                                                                                                                                                                       |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hosted Supabase        | New project `rytm`, `eu-central-1`, created from the CLI (`supabase projects create`)                                                               | Same region as the `fra1` function; keeps `getUser()` round-trips inside Frankfurt                                                                                        |
| Production path        | **GitHub Actions after the gate**: push to `main` → `ci` + `smoke` → `deploy` (`vercel pull` → `npm run build` → `vercel deploy --prebuilt --prod`) | `tech-stack.md` asks for auto-deploy-on-merge _and_ the risk register wanted CI to be a real gate; Vercel's Git integration cannot do both                                |
| Vercel Git integration | Connected, but `main` disabled in `vercel.json` (`git.deploymentEnabled.main = false`)                                                              | Previews for every other branch/PR still build automatically                                                                                                              |
| Framework preset       | `"framework": "astro"` in `vercel.json`                                                                                                             | `vercel link --yes` created the project as "Other"                                                                                                                        |
| Node version           | `engines.node = "22.x"` in `package.json`                                                                                                           | Vercel defaults new projects to 24.x; `.nvmrc` is 22.14                                                                                                                   |
| `astro preview`        | Removed from `package.json`                                                                                                                         | `@astrojs/vercel` 11 has no preview entrypoint (confirmed: "The @astrojs/vercel adapter does not support the preview command"); CI smoke runs against `astro dev` instead |
| ESLint                 | `design/**` ignored                                                                                                                                 | The read-only design kit's prototype JS had 103 errors that would have failed the gate on every push                                                                      |

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
- **Supabase** hosted project `rytm` (`psqbtvooufapkatpkxlw`, Postgres 17, `eu-central-1`). First migration `20260921120000_delete_own_account.sql` applied on 2026-09-22 (details in the 2026-09-22 section). It went in through `psql`, **not** `supabase db push`; since 2026-09-23 the project is `supabase link`ed on the owner's machine and `supabase migration list` shows `20260921120000` as applied remotely, so the migration ledger exists and the next `db push` applies only new files (impl-review F2). Second migration `20260923165530_domain_imports_transactions.sql` (F-01: `imports`, `transactions`) applied with `npx supabase db push` by the owner on 2026-09-23 — the first migration shipped through the ledger. Auth uses the new-style **publishable** key.
- **GitHub** `vince307/rytm` (private), default branch `main`, remote `origin`.

## Secrets inventory

| Where                     | Name                                 | Environments / notes                                                                                                                                                                                                           |
| ------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Vercel env                | `SUPABASE_URL`                       | production, preview (encrypted)                                                                                                                                                                                                |
| Vercel env                | `SUPABASE_KEY`                       | production, preview (`--sensitive`: cannot be read back with `vercel env pull`)                                                                                                                                                |
| GitHub secrets            | `SUPABASE_URL`, `SUPABASE_KEY`       | used by the `ci` build step                                                                                                                                                                                                    |
| GitHub secrets            | `VERCEL_TOKEN`                       | account token `rytm-github-actions`, scope kamilp's projects — created in the dashboard, used by `deploy`                                                                                                                      |
| GitHub secrets            | `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` | from `.vercel/project.json`                                                                                                                                                                                                    |
| GitHub secrets            | `VERCEL_AUTOMATION_BYPASS_SECRET`    | **not yet created** — needed only when a preview-smoke job is added                                                                                                                                                            |
| Local `.env` (gitignored) | `SUPABASE_DB_PASSWORD`               | the only copy of the DB password; keep it. Since 2026-09-20 `SUPABASE_URL`/`SUPABASE_KEY` here point at the local Docker Supabase (values from `.env.example`); the production pair lives only on Vercel and in GitHub secrets |

No secret value has ever been written to the repo or pasted into a chat; `vercel env add` and `gh secret set` were fed from `.env` via stdin.

## Operating model (who may do what)

- **Agent, unattended**: `npx vercel` (preview deploy), `vercel ls`, `vercel inspect <url> --logs`, `vercel logs <url>`, `vercel env ls`, `gh run watch`, `npm run smoke` against a local/preview server.
- **Human only**: `vercel deploy --prod` outside the workflow, `vercel rollback` / `vercel promote <url>`, `vercel env rm/add` (rotation → then redeploy), plan changes, deleting the project, Supabase migrations against the hosted DB, rotating `VERCEL_TOKEN` (expiry ≤ 1 year — set a reminder).
- **Rollback**: `vercel rollback` (Hobby: only to the immediately previous production deployment) or `vercel promote <deployment-url>`. Neither touches Supabase.
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
- Hosted migration applied **by an agent on the owner's explicit instruction**, which deviates from the "Human only … Supabase migrations against the hosted DB" line in the operating model below. Route: direct `psql` to `db.psqbtvooufapkatpkxlw.supabase.co` with `SUPABASE_DB_PASSWORD` from `.env`, because `supabase link` requires a CLI access token that is not on this machine (`~/.supabase` holds only telemetry). Follow-up closed 2026-09-23: the migration ledger exists (see Supabase above).
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
- Plan row 3.4 closed 2026-09-24 by the owner: the production delete cycle on a disposable account (confirmed signup → `/settings` → password + `USUŃ`) ends on `/login?deleted=1` with the new cascades in place.

## Manual steps still open

1. ~~PKCE callback~~ — done 2026-09-21 (`fe68166`) and **verified on production by the owner** the same day: signup with a non-member address → `/confirm-email` → „Wyślij ponownie” (re-sent 14:06:15 UTC) → link → `/auth/callback` → signed in on `/home` (`email_confirmed_at` 14:07:26, `last_sign_in_at` 14:08:56 UTC); „Nie pamiętam hasła” → link → `/reset/new` → new password → sign-in; `/register` with a taken address → occupied state. The Brevo mail landed in Yahoo's spam folder — see the sender-domain recommendation.
2. Optional: create the Protection Bypass for Automation secret and store it as `VERCEL_AUTOMATION_BYPASS_SECRET`.
3. Optional: sender domain for Brevo (see recommendation above).

## Deferred (from the risk register)

- Preview-smoke job hitting the Vercel preview URL with `x-vercel-protection-bypass` (needs the bypass secret; smoke must assert on a page marker, not on 200).
- CSV import size cap + time budget (Hobby 4 active-CPU-hours is a project-wide kill switch); 4.5 MB body limit surfaced in the import UI.
- Persist import failures in a Supabase table (1-hour log retention).
- `/10x-rule-review` on `CLAUDE.md` and `AGENTS.md` after the doc rewrite.
- `npm audit`: `path-to-regexp` (high) via `@vercel/routing-utils` inside `@astrojs/vercel` — build-time only, no fix upstream yet; re-check on adapter updates.
- Local git is 2.28.0 and needs `http.version=HTTP/1.1` + `http.postBuffer` (set in this repo's `.git/config`) to push to GitHub; upgrading git removes the workaround.
- Monetisation or any non-personal use triggers the Hobby fair-use clause → re-run `/10x-infra-research` (Cloudflare Workers is the pre-approved runner-up).
