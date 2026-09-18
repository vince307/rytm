---
bootstrapped_at: 2026-09-18T17:26:46Z
starter_id: 10x-astro-starter
starter_name: "10x Astro Starter (Astro + Supabase + Cloudflare)"
project_name: rytm
language_family: js
package_manager: npm
cwd_strategy: git-clone
bootstrapper_confidence: first-class
phase_3_status: ok
audit_command: "npm audit --json"
---

## Hand-off

```yaml
starter_id: 10x-astro-starter
package_manager: npm
project_name: rytm
hints:
  language_family: js
  team_size: solo
  deployment_target: vercel
  ci_provider: github-actions
  ci_default_flow: auto-deploy-on-merge
  bootstrapper_confidence: first-class
  path_taken: standard
  quality_override: false
  self_check_answers: null
  has_auth: true
  has_payments: false
  has_realtime: false
  has_ai: false
  has_background_jobs: false
```

Solo developer with ten years of full-stack JS shipping a six-week, after-hours MVP that needs accounts with per-account data isolation, CSV upload parsed within the request, and relational data (imports → transactions → merchant patterns → thresholds, plus durable user decisions). 10x Astro Starter is the recommended default for `(web, js)`: Astro + React + TypeScript with Supabase giving PostgreSQL and auth out of the box, clearing all four agent-friendly gates. Standard path taken — the recommendation matched the PRD priors without a custom walk. Deployment target overridden from the starter's Cloudflare Pages default to Vercel, the developer's existing platform (the Astro adapter swap is the one scaffold-time deviation to expect; the same request-time-budget gotcha applies to CSV import on either host). Bootstrapper confidence is first-class: registered with a valid CLI but not battle-tested end-to-end, so expect mostly-smooth scaffolding with occasional manual steps. Auth is the only technology-forcing feature; payments, realtime, AI and background jobs are out of scope per PRD non-goals. CI on GitHub Actions with auto-deploy on merge to main.

## Pre-scaffold verification

| Signal      | Value                                                        | Severity | Notes                                                                                   |
| ----------- | ------------------------------------------------------------ | -------- | --------------------------------------------------------------------------------------- |
| npm package | not run                                                      | —        | cmd_template starts with `git clone`; no npm CLI package to resolve                     |
| GitHub repo | przeprogramowani/10x-astro-starter last pushed 2026-09-12   | fresh    | from card.docs_url; `gh api` failed TLS verification inside the sandbox, checked via `curl` against api.github.com (96 stars, default branch `master`) |

Local toolchain observed (informational, not part of the slot): node v22.14.0 (matches `.nvmrc`), npm 10.9.2.

## Scaffold log

**Resolved invocation**: `git clone https://github.com/przeprogramowani/10x-astro-starter .bootstrap-scaffold && cd .bootstrap-scaffold && npm install`
**Strategy**: git-clone
**Exit code**: 0 (final run; see deviations)
**Files moved**: 46 starter files + `node_modules/` (30 690 files) — 30736 total
**Conflicts (.scaffold siblings)**: README.md.scaffold
**.gitignore handling**: append-merged (+17 lines under `# from 10x-astro-starter`)
**.bootstrap-scaffold cleanup**: deleted (no leftovers)
**context/ drops**: none (starter ships no `context/`)

**Deviations from the resolved invocation** (all caused by the session sandbox, none by the starter):

1. `git clone` exited 128 twice — the sandbox denies writes under `.bootstrap-scaffold/.git/` (`hooks/*.sample`, then `config`). Because this strategy deletes the cloned `.git/` before the move-up anyway, the tree was fetched as `https://codeload.github.com/przeprogramowani/10x-astro-starter/tar.gz/master` and extracted with `tar --strip-components=1`. End state is identical: starter files at `master` (pushed 2026-09-12) without upstream history.
2. `tar` could not create `.vscode/extensions.json`, `.vscode/launch.json`, `.vscode/settings.json` (sandbox denies writes to `.vscode/`). The three files were extracted to the session scratchpad (`scratchpad/vscode-from-starter/`) for manual copy; they are editor settings only.
3. `npm install` exited 255 on `EPERM` writing to `~/.npm/_cacache` (sandbox allows only `~/.npm/_logs`; npm's "root-owned files" message is a misdiagnosis). Re-run as `npm install --cache "$TMPDIR/npm-cache"` — exit 0, `found 0 vulnerabilities`, 804 packages.

Move log (excluding node_modules internals):

```
move    .env.example
move    .github/  (1 files)
merge   .gitignore  (+17 lines appended)
move    .husky/  (1 files)
move    .nvmrc
move    .prettierrc.json
move    AGENTS.md
move    CLAUDE.md
sibling README.md -> README.md.scaffold  (existing wins)
move    astro.config.mjs
move    components.json
move    eslint.config.js
move    node_modules/  (30690 files)
move    package-lock.json
move    package.json
move    public/  (3 files)
move    scripts/  (1 files)
move    src/  (26 files)
move    supabase/  (2 files)
move    tsconfig.json
move    wrangler.jsonc
```

Last lines of the successful install:

```
  run `npm fund` for details

found 0 vulnerabilities
npm notice
npm notice New major version of npm available! 10.9.2 -> 12.0.2
npm notice Changelog: https://github.com/npm/cli/releases/tag/v12.0.2
npm notice To update run: npm install -g npm@12.0.2
npm notice
```

## Post-scaffold audit

**Tool**: npm audit --json
**Summary**: 0 CRITICAL, 0 HIGH, 0 MODERATE, 0 LOW
**Direct vs transitive**: 0/0/0/0 direct of total 0/0/0/0
**Dependency counts**: prod 377, dev 269, optional 167, total 804

#### CRITICAL findings

none

#### HIGH findings

none

#### MODERATE findings

none

#### LOW / INFO findings

none

## Hints recorded but not acted on

| Hint                    | Value                  |
| ----------------------- | ---------------------- |
| bootstrapper_confidence | first-class            |
| quality_override        | false                  |
| path_taken              | standard               |
| self_check_answers      | null                   |
| team_size               | solo                   |
| deployment_target       | vercel (starter ships `@astrojs/cloudflare` + `wrangler.jsonc`; adapter swap is a manual follow-up) |
| ci_provider             | github-actions         |
| ci_default_flow         | auto-deploy-on-merge   |
| has_auth                | true                   |
| has_payments            | false                  |
| has_realtime            | false                  |
| has_ai                  | false                  |
| has_background_jobs     | false                  |

## Next steps

Next: a future skill will set up agent context (CLAUDE.md, AGENTS.md). For now, your project is scaffolded and verified — happy hacking.

Useful manual steps in the meantime:
- `git init` (if you have not already) to start your own repo history. (This cwd already has `.git/`; the starter's history was not imported.)
- Review any `.scaffold` siblings the conflict policy created and decide which version of each file to keep — here: `README.md.scaffold`.
- Address audit findings per your project's risk tolerance — the full breakdown is in this log (clean tree at bootstrap time).
- Copy `.vscode/` from the session scratchpad if you want the starter's editor settings.
- The starter's own `CLAUDE.md` and `AGENTS.md` now live in the project root; review them against the parent `CLAUDE.md` before `/10x-agents-md` / `/10x-rule-review`.
- Deployment target is Vercel while the scaffold is wired for Cloudflare (`@astrojs/cloudflare`, `wrangler.jsonc`, `.dev.vars` in `.gitignore`); plan the adapter swap in the deploy plan.
