---
change_id: ci-db-push
title: Run hosted Supabase migrations from the CI deploy job, not the laptop
status: impl_reviewed
created: 2026-09-29
updated: 2026-09-30
archived_at: null
---

## Notes

Production should have one gate: CI on `main`. Deploy already goes that way (`ci` → `smoke` → `deploy` → `vercel deploy --prebuilt --prod`), but schema changes still reach the hosted project (`psqbtvooufapkatpkxlw`) via `npx supabase db push` run from a developer machine — by hand or by `/10x-autonomous-run` — with the hosted token in `supabase/.temp` and the sandbox disabled.

Intent: move `supabase db push` into the `deploy` job of `.github/workflows/ci.yml`, after pgTAP + smoke are green and before `vercel deploy`, so schema and code ship together from the same commit and no agent needs production credentials locally.

Scope to settle in research/plan:
- auth for CI: `SUPABASE_ACCESS_TOKEN` + project ref + DB password (or `--db-url`) as GitHub secrets
- ordering and failure handling in `deploy` (migration fails → no Vercel deploy)
- `CLAUDE.md` hard rules and `context/deployment/deploy-plan.md`
- `.claude/skills/10x-autonomous-run` (ship step: replace local `db push` with "wait for green `deploy`, then `npx supabase migration list`"; `gates.md` § ship; `SKILL.md` Step 1 preflight and "never" list)
- keep `vercel rollback` / `promote` human-only; keep the auto-mode `soft_deny` for local `db push` and `vercel --prod` in `.claude/settings.local.json`

Decided 2026-09-29 after considering unblocking `db push` / `vercel --prod` for agents in auto mode — rejected in favour of this change.
