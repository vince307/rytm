---
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
---

## Why this stack

Solo developer with ten years of full-stack JS shipping a six-week, after-hours MVP that needs accounts with per-account data isolation, CSV upload parsed within the request, and relational data (imports → transactions → merchant patterns → thresholds, plus durable user decisions). 10x Astro Starter is the recommended default for `(web, js)`: Astro + React + TypeScript with Supabase giving PostgreSQL and auth out of the box, clearing all four agent-friendly gates. Standard path taken — the recommendation matched the PRD priors without a custom walk. Deployment target overridden from the starter's Cloudflare Pages default to Vercel, the developer's existing platform (the Astro adapter swap is the one scaffold-time deviation to expect; the same request-time-budget gotcha applies to CSV import on either host). Bootstrapper confidence is first-class: registered with a valid CLI but not battle-tested end-to-end, so expect mostly-smooth scaffolding with occasional manual steps. Auth is the only technology-forcing feature; payments, realtime, AI and background jobs are out of scope per PRD non-goals. CI on GitHub Actions with auto-deploy on merge to main.
