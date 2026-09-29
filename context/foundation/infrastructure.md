---
project: rytm
researched_at: 2026-09-18
recommended_platform: Vercel
runner_up: Cloudflare Workers
context_type: mvp
tech_stack:
  language: TypeScript
  framework: Astro 7.3 (output "server") + React 19 islands, Supabase (Postgres + auth via @supabase/ssr)
  runtime: Node.js 22 on Vercel Functions (Fluid compute) — replaces the scaffolded Cloudflare workerd adapter
---

## Recommendation

**Deploy on Vercel (Hobby plan, region `fra1`).**

Vercel and Cloudflare Workers tied on the five agent-friendly criteria (4 Pass + 1 Partial each). The interview broke the tie: the developer wants to **minimize cost** (Vercel Hobby is $0 for a personal tool; Cloudflare's free tier caps CPU at 10 ms/request, which the in-request CSV parse will likely exceed, forcing Workers Paid at $5/mo) and has **existing Vercel familiarity**. The app is stateless request/response, serves a single region (Poland), and keeps its data in external Supabase, so no platform is excluded by persistent-connection or co-location needs. `tech-stack.md` already recorded Vercel as the target and anticipated the adapter swap as the one scaffold-time deviation; this decision makes it explicit. The Hobby plan's non-commercial licence fits the PRD persona (author's own tool) — see the risk register for the trigger that would force Pro.

Interview answers used as weights: persistent connections **No** · cost **Minimize** · familiarity **Vercel / Netlify** · reach **Single region** · co-location **External providers fine**.

## Platform Comparison

Scores are Pass / Partial / Fail against `references/agent-friendly-criteria.md`. All six platforms passed the hard filters (no persistent process needed; every platform runs Astro 7 SSR). Research checked 2026-09-18.

| Platform           | CLI-first | Managed / serverless | Agent-readable docs | Stable deploy API | MCP / integration                   | Cost @ 10k–100k req/mo                    |
| ------------------ | --------- | -------------------- | ------------------- | ----------------- | ----------------------------------- | ----------------------------------------- |
| Vercel             | Pass      | Pass                 | Pass                | Pass              | Partial (beta)                      | $0 Hobby (non-commercial)                 |
| Cloudflare Workers | Pass      | Pass                 | Pass                | Pass              | Partial (unlabelled, treat as beta) | ~$5 Workers Paid                          |
| Netlify            | Partial   | Pass                 | Pass                | Pass              | Pass (GA)                           | $0 Free (300 credits, 20 prod deploys/mo) |
| Railway            | Partial   | Pass                 | Pass                | Pass              | Pass (GA)                           | $5–7 Hobby                                |
| Render             | Partial   | Pass                 | Pass                | Pass              | Pass (GA)                           | $0 Free (spin-down) or $7 Starter         |
| Fly.io             | Partial   | Partial              | Pass                | Pass              | Partial (experimental)              | $2–5 pay-as-you-go                        |

**Vercel.** `@astrojs/vercel` 11.x targets Astro 7 (GA). CLI covers deploy (`vercel`, `vercel --prod`), rollback (`vercel rollback`, Hobby: only to the immediately previous production deploy), logs (`vercel logs`), env (`vercel env`); `--yes`, `VERCEL_TOKEN` and `--non-interactive` make it scriptable, stdout is the deployment URL, non-zero exit on failure. Docs: `vercel.com/docs/llms.txt` and a `.md` twin of every page. Hobby: 1M invocations, 4 active-CPU-hours, 360 GB-hours, 300 s max duration, 4.5 MB request body, 1 h log retention, **non-commercial personal use only**. Region defaults to `iad1`; set `fra1` in `vercel.json` (single region on Hobby). Vercel MCP (`https://mcp.vercel.com`) is **beta** as of 2026-09-15.

**Cloudflare Workers.** Already scaffolded (`@astrojs/cloudflare` 14.3, wrangler 4.131, `nodejs_compat`). The adapter dropped Pages support entirely — Workers only, `astro dev` runs real workerd. Best rollback story of the six: `wrangler rollback` to any of the last 100 versions, `wrangler versions upload --preview-alias` for previews, `wrangler tail --format json`. Docs via `developers.cloudflare.com/llms.txt`. Free tier: 100k req/day but **10 ms CPU per request** — a few-thousand-row CSV parse plus Supabase inserts plausibly exceeds it, so budget Workers Paid ($5/mo, 30 s CPU). Known gotchas: `@supabase/ssr` needs `nodejs_compat` (set), and wrangler ≥4.40 needed `fetch_iterable_type_support` for Astro SSR (auto with compat date ≥ 2026-02-19; ours is 2026-05-08). MCP servers exist but carry no GA/beta label.

**Netlify.** `@astrojs/netlify` 8.2.x targets Astro 7 (GA). Functions timeout 60 s, 6 MB body. No CLI rollback (`netlify api restoreSiteDeploy` or UI). Docs via `docs.netlify.com/llms.txt`; official remote MCP is GA. Free plan is credit-based: 300 credits/month with a hard pause when exhausted, **15 credits per production deploy (~20/month max)**; functions run in Ohio on Free — EU regions (`fra`) are Pro-only. Commercial use allowed on Free.

**Railway.** Railpack zero-config Node build (needs `"start": "node ./dist/server/entry.mjs"` after swapping to `@astrojs/node`). `railway up --ci` is deterministic; **rollback is dashboard-only**. Docs via `docs.railway.com/llms.txt`; MCP GA. No usable free tier ($1 credit); Hobby $5/mo + usage ≈ $5–7 total. Serverless sleep can return 502 on the first request after idle. EU region Amsterdam.

**Render.** Native Node Web Service, official Astro SSR template, honours `.nvmrc`. CLI covers deploys/logs/env but **no rollback** (REST `…/deploys/{id}/rollback`). Docs via `render.com/docs/llms.txt`; MCP GA. Free service spins down after 15 min (~60 s cold start on 0.1 CPU — the first request after idle is the login page); Starter $7/mo always-on. PR previews require the $25/mo Pro workspace. Frankfurt region available.

**Fly.io.** Full VM, Node 22 in a Dockerfile the developer owns (`fly launch` Astro detection reported flaky). Rollback = redeploy a previous image (`fly releases --image` + `fly deploy -i …`). Docs on GitHub + `fly.io/llms.txt`. No free tier (card required); ~$2–5/mo. **Warsaw region closed** (Region Consolidation, 2025-09-09) — use `fra`/`ams`. `fly mcp server` is experimental.

### Shortlisted Platforms

#### 1. Vercel (Recommended)

$0 for the MVP persona, every routine operation scriptable from the CLI, `fra1` pinning on Hobby, GA Astro 7 adapter, and the developer already knows it. The only cost is one adapter swap and the doc updates that follow it.

#### 2. Cloudflare Workers

Zero migration (the scaffold already targets it), the strongest rollback/preview CLI of the six, and a flat $5/mo that does not care whether the app becomes commercial. Lost the tie on cost and familiarity; becomes the pick if the Hobby non-commercial clause is ever triggered.

#### 3. Netlify

Familiar, MCP is GA, `astro dev` works natively. Loses on operability (no CLI rollback), on Free-tier geography (Ohio functions for Polish users talking to EU Supabase), and on the 20-deploys-per-month ceiling, which an agent-driven workflow would hit.

## Anti-Bias Cross-Check: Vercel

### Devil's Advocate — Weaknesses

1. **Hobby is non-commercial personal use only.** Rytm today is the author's own tool, which fits — but the PRD keeps open registration with a 10k-user aspiration. Any monetisation ("buy me a coffee", a paid tier) or use to earn income forces Pro at $20/mo, 4× Cloudflare Paid.
2. **The adapter swap ripples through the repo.** `@astrojs/cloudflare` → `@astrojs/vercel`; delete `wrangler.jsonc`; `.dev.vars` → `.env`; the CI `smoke` job copies `.env` to `.dev.vars`; `CLAUDE.md`, `AGENTS.md` and `tech-stack.md` all describe Cloudflare. Every doc left unchanged misleads the next agent session.
3. **Rollback and logs are weak on Hobby.** `vercel rollback` only reaches the immediately previous production deploy; runtime logs are retained for one hour. A bug noticed the next morning has no logs.
4. **Vercel's own Astro guide is stale.** It still shows `@astrojs/vercel/serverless` and `functionPerRoute`, both removed in adapter v10. An agent that follows Vercel's page instead of Astro's writes a broken config.
5. **Region defaults to `iad1`.** Without `"regions": ["fra1"]`, the middleware's per-request `getUser()` call and every data query cross the Atlantic from Frankfurt-hosted Supabase.

### Pre-Mortem — How This Could Fail

The swap went smoothly and the first deploy took ten minutes; that was the problem — nobody wrote down what changed. The `smoke` CI job kept copying `.env` to `.dev.vars`, passed against a preview that no longer read it, and hid a broken `SUPABASE_KEY` for two weeks. Preview URLs came up behind Vercel Authentication, so the agent's verification step always received a login page and marked the deploy "OK". The region was never pinned; pages felt sluggish from Warsaw, and the author blamed Supabase. In month three a friend asked to use the app; the author added a "buy me a coffee" link, and on the next fair-use review the project was flagged as commercial — the choice was $20/mo or migrate. Meanwhile a CSV-parsing regression looped on a malformed row, burned the 4 active-CPU-hour Hobby quota overnight, and the deployment was paused for the rest of the month — right before the course deadline. One-hour log retention meant the loop was only found by reproducing locally. Migrating back to Cloudflare took a weekend, most of it undoing doc drift.

### Unknown Unknowns

- **The Fluid compute quota is a kill switch.** Hobby allows 4 active-CPU-hours per month; a runaway parse pauses the whole project, not one function.
- **Preview deployments are password-gated by default** (Vercel Authentication). CI smoke tests or an agent hitting a preview URL need the Protection Bypass for Automation secret in a request header.
- **The first-ever `vercel` deploy of a new project is production**, whatever flags are passed.
- **`vercel env add` creates variables as `sensitive` by default**, which cannot be read back with `vercel env pull` (verify on this account) — the local `.env` must be maintained separately.
- **Git-integration deploys are decoupled from GitHub Actions.** A push to `main` builds and ships on Vercel even if `npm run lint` fails in CI, unless production is deployed from the workflow (`vercel --prod` after the gate) or an Ignored Build Step is configured.
- **Version-specific behaviour (adapter 11 / Astro 7):** use `astro dev` locally, not `vercel dev`; `middlewareMode: 'edge'` moves middleware to the Edge runtime and breaks `@supabase/ssr` cookie handling — keep the default Node middleware; `astro:env/server` reads `process.env` set through `vercel env`, no config change.

## Operational Story

- **Preview deploys**: every branch push via the Git integration (or `vercel` from the CLI) produces `https://rytm-<hash>-<team>.vercel.app`; previews are protected by Vercel Authentication by default — automated checks send `x-vercel-protection-bypass: $VERCEL_AUTOMATION_BYPASS_SECRET`; previews from fork PRs need manual approval.
- **Secrets**: `SUPABASE_URL` / `SUPABASE_KEY` live in Vercel project env vars, scoped per environment (`vercel env add SUPABASE_KEY production < file`, default `sensitive`); the GitHub Actions gate keeps its own copies as repository secrets, and the `deploy` job reads `SUPABASE_ACCESS_TOKEN` / `SUPABASE_DB_PASSWORD` from the GitHub Environment `production` (added 2026-09-29, `ci-db-push`); rotation = `vercel env rm` + `vercel env add` + redeploy, done by the human.
- **Rollback**: `vercel rollback` (instant, to the immediately previous production deployment on Hobby) or `vercel promote <url>` to re-point at any earlier deployment; Supabase migrations are not rolled back by either — write down-migrations before applying up.
- **Approval**: a human runs `vercel --prod`, rotates secrets, changes the plan, deletes the project, and runs `supabase migration repair`; hosted Supabase migrations are applied only by the CI `deploy` job (since 2026-09-29, `ci-db-push`); an agent may run `vercel` (preview), `vercel logs`, `vercel env ls`, `vercel inspect`, and `npm run smoke` against a preview unattended, using a project-scoped `VERCEL_TOKEN` in an env var (never in `.mcp.json` or the repo).
- **Logs**: build logs via `vercel inspect <url> --logs`; runtime logs via `vercel logs <url> --json --since 1h` (1-hour retention on Hobby, `--follow` capped at 5 min); GitHub Actions logs via `gh run view --log`.

## Risk Register

| Risk                                                                                                       | Source                        | Likelihood | Impact | Mitigation                                                                                                                                                                             |
| ---------------------------------------------------------------------------------------------------------- | ----------------------------- | ---------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Project becomes "commercial" under Hobby fair-use, forcing Pro ($20/mo) or migration                       | Devil's advocate              | M          | M      | Keep Rytm strictly personal until a monetisation decision; at that point re-run this research — Cloudflare Workers ($5 flat) is the pre-approved runner-up.                            |
| Adapter swap leaves stale Cloudflare instructions in `CLAUDE.md`, `AGENTS.md`, `tech-stack.md`, `ci.yml`   | Devil's advocate / Pre-mortem | H          | M      | The deploy plan lists every file to touch; run `/10x-rule-review` on both rules files after the swap; delete `wrangler.jsonc` and `.dev.vars` handling in the same commit.             |
| CI `smoke` job silently tests the wrong env (`cp .env .dev.vars`)                                          | Pre-mortem                    | H          | M      | Update the job to write only `.env`; fail the job if `SUPABASE_URL` is empty at preview start.                                                                                         |
| Runaway CSV parse burns the 4 active-CPU-hour quota and pauses the project                                 | Unknown unknowns              | L          | H      | Cap rows per import (reject > N rows with a clear error), stream-parse, add a hard time budget in the import handler; watch usage in `vercel` dashboard before the deadline week.      |
| Region left at `iad1`, doubling Supabase latency on every request                                          | Devil's advocate              | M          | M      | Commit `vercel.json` with `"regions": ["fra1"]` in the first deploy; verify with `vercel inspect` (region shown).                                                                      |
| Agent's preview verification hits the Vercel Authentication page and reports success                       | Pre-mortem / Unknown unknowns | M          | M      | Smoke test asserts on a page marker, not on HTTP 200; pass the protection-bypass header from a GitHub secret.                                                                          |
| Bug noticed after 1 h has no runtime logs                                                                  | Devil's advocate              | M          | L      | Log import failures to a Supabase `import_errors` table (per-user, RLS) rather than relying on platform logs.                                                                          |
| Agent follows Vercel's stale Astro page and uses removed `@astrojs/vercel/serverless` / `functionPerRoute` | Devil's advocate              | M          | L      | Point the deploy plan at `docs.astro.build/en/guides/integrations-guide/vercel/`; adapter 11 config is `adapter: vercel()` with no sub-path.                                           |
| Push to `main` deploys to production before CI lint/check finishes                                         | Unknown unknowns              | M          | M      | Either deploy production from GitHub Actions after the gate (`vercel deploy --prebuilt --prod`) or leave Git integration on and accept that CI is advisory; decide in the deploy plan. |
| 4.5 MB request body cap rejects a very large multi-year CSV with a bare 413                                | Research finding              | L          | L      | Validate file size client-side and show the limit in the import UI (kit copy needed → gap register).                                                                                   |
| Vercel MCP still beta; agent tooling may change                                                            | Research finding              | L          | L      | Use the CLI for MVP; add MCP only when repeated `--help` cycles appear.                                                                                                                |

## Getting Started

Verified against the pinned versions (Astro 7.3.2, `@astrojs/vercel` 11.x, `vercel` CLI 59.x) on 2026-09-18.

1. Swap the adapter: `npm rm @astrojs/cloudflare wrangler && npm i @astrojs/vercel` and in `astro.config.mjs` replace `import cloudflare from "@astrojs/cloudflare"` / `adapter: cloudflare()` with `import vercel from "@astrojs/vercel"` / `adapter: vercel()` (no `/serverless` sub-path, no `functionPerRoute`). Delete `wrangler.jsonc`; local secrets now live only in `.env`.
2. Pin the region: add `vercel.json` with `{ "regions": ["fra1"] }`. Keep `astro dev` for local development (`vercel dev` is not needed with adapter 11).
3. Update the repo contracts in the same commit: `CLAUDE.md` / `AGENTS.md` deploy and env lines, `tech-stack.md` (already says Vercel), the CI `smoke` job (drop `cp .env .dev.vars`).
4. First deploy (manual gate — the first deploy of a new project is production): `npx vercel login`, then `npx vercel link --yes`, `npx vercel env add SUPABASE_URL production`, `npx vercel env add SUPABASE_KEY production` (repeat for `preview`), then `npx vercel --prod`. Confirm region and adapter in `npx vercel inspect <url>`.
5. Wire the loop: connect the GitHub repo in the Vercel project for branch previews, create a Protection Bypass for Automation secret, store it plus `VERCEL_TOKEN`/`VERCEL_ORG_ID`/`VERCEL_PROJECT_ID` as GitHub secrets, and decide in the deploy plan whether production ships from Git integration or from the workflow after the lint/check gate.

## Out of Scope

The following were not evaluated in this research:

- Docker image configuration
- CI/CD pipeline setup
- Production-scale architecture (multi-region, HA, DR)
