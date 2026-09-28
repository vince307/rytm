# Agent contract — template

Copy to `context/runs/<run-id>/agent-contract.md` at the start of a run and fill the
`<<< >>>` slots. Every step reads this file first, then does only its assigned step.

> **Fill before the run:** `<<<RUN-ID>>>`, `<<<MAIN-SHA>>>`, `<<<BASELINE>>>`, `<<<SLICES>>>`.

Run `<<<RUN-ID>>>` · base `main` at `<<<MAIN-SHA>>>` · slices, in order: `<<<SLICES>>>`

---

## Hard rules

0. **You are a fresh session for exactly ONE step.** You remember nothing of earlier steps.
   Your inputs are files: this contract, then `<change dir>/handoff.md` (§4 Next command, §5 Open),
   then what it points at. Something you need is not on disk → report `ARTIFACT GAP: …`, do not guess.
   The orchestrator checks out the branch and verifies your gate itself
   (`references/gates.md`); do not switch branches.
1. **No human in the loop.** NEVER call `AskUserQuestion`. Where a 10x skill says ask,
   or STOP and wait, decide yourself and record it under `## Autonomous decisions`:
   chosen, rejected, why, and **what would change the answer**.
2. **Always leave a handoff** to `.claude/skills/10x-autonomous-run/references/handoff-schema.md`,
   committed on the slice branch.
3. **Context hygiene at ~300k.** Approaching it, write the handoff and return
   `STATUS: NEEDS_CONTINUATION` with what remains.
4. **Report back short** — at most 12 lines, last line
   `STATUS: DONE | BLOCKED | NEEDS_CONTINUATION — <one clause>` (ship: `SHIPPED | BLOCKED`).
   The orchestrator reads artifacts.
5. **Verify, do not inherit.** A green you were told about is not one you observed.

## Git — serial, one slice at a time

- Each slice lives on `feat/<change-id>`, cut from a freshly pulled `main`, in the
  **main checkout** (no worktrees: all slices would share one local Supabase).
- Before writing, `git branch --show-current` must print your slice branch.
- Docs steps commit their artifacts (`docs(<id>): …`); implement commits once per
  plan phase (`feat(<id>): <phase title> (pN)`), **only on green**; fixes are
  `fix(<id>): …`. Conventional Commits, messages in Polish like the rest of the log.
- Never `--no-verify`, never force-push, never push to `main` directly.
- Stage by explicit path, never `git add -A` / `git add .`. Never stage or commit files you
  did not change in this step, and never the ones in the allow-list of
  `.claude/skills/10x-autonomous-run/scripts/tree-clean.sh` (the maintainer's own uncommitted
  work, if any). "Clean tree" is defined ONCE, by that script (prints `CLEAN`).
- Only the Ship step pushes, opens the PR, runs `npx supabase db push` and merges —
  under the maintainer's standing authorisation of 2026-09-25 (reconfirmed 2026-09-27).
- A branch that predates the latest `main` gets `git merge main` (by the orchestrator) —
  never a rebase of a pushed branch (it would need a force-push).

## Project rules that bind every step

`CLAUDE.md` is injected into your context — it binds. The ones runs trip over:

- **Design kit is the source of truth.** `design/rytm-os/` is read-only. Layout and
  components come from `design/rytm-os/prototype/` (views in `prototype/views/*.html`,
  patterns in `prototype/styles.css`); copy from `src/content/copy.ts` (`copy` = kit
  JSON, `copyExtra` = kit gaps); colors only via Tailwind names
  `ink`/`paper`/`paper-soft`/`excess`/`excess-text`/`muted`/`line`/`green`. Missing UI →
  gap row in `context/foundation/design-kit.md` + `DESIGN-GAP` comment. Never invent.
- **One view + global tokens** — no redesign of neighbouring views. Reuse shared
  components in `src/components/` (and `src/components/ui/`, shadcn "new-york");
  never `shadcn init`.
- **Migrations**: `supabase/migrations/YYYYMMDDHHmmss_short_description.sql`; RLS on
  every new table, granular per-operation, per-role; user data carries `user_id`
  FK → `auth.users(id)` **on delete cascade**; pgTAP proof in
  `supabase/tests/database/`; then `npm run db:types` (never hand-edit
  `src/db/database.types.ts`).
- **Real bank data never enters the repo** (`data/`, `*.csv` are ignored). Tests and
  demos use the synthetic ING fixture (`npm run fixture:ing`, checked by
  `npm run fixture:check`).
- API routes: uppercase `GET`/`POST`, `export const prerender = false`, zod input.
  `cn()` for class merging. Services in `src/lib/`, shared types in `src/types.ts`.
- Local test account: `test@rytm.local` / `Rytm-Test-Passw0rd!` (seed, local only).

## Verification — the local gate

```bash
npm run lint
npx astro check
npm run fixture:check
npm test
npm run build
npx supabase db reset && npx supabase test db
ASTRO_DEV_BACKGROUND=1 npx astro dev --port 4398 --ignore-lock &   # then:
BASE_URL=http://localhost:4398 npm run smoke          # then: lsof -ti :4398 | xargs kill
```

Baseline on `main` — the orchestrator REWRITES this line after every ship
(`.claude/skills/10x-autonomous-run/scripts/baseline.sh`):
`<<<BASELINE>>>` — **measure on your branch; write
`baseline + delta`, never absolute counts.**

- **Deliberate break, then meta-check it**: break what the test protects, watch red,
  restore — then ask whether the break proves what it appears to (an RLS test that
  stays green when you remove the app-side check may be proving RLS, not your code).
- **Anchor on symbols, never line numbers.**
- Anything touching Docker, `127.0.0.1:54321`, `gh` or the network: Bash with the
  sandbox DISABLED — the sandbox blocks those and the failures look like product bugs.
- Kill every dev server you start (`lsof -ti :4398 -ti :4399 | xargs kill` — macOS lsof
  rejects `:A :B`); use only ports 4398 (gates/smoke) and 4399 (visual); a stray one
  makes the next step's smoke hit stale code. **Port 4321 is the maintainer's own
  `astro dev` — never use it, never kill it.** Astro 7 refuses a second dev server unless
  started as `ASTRO_DEV_BACKGROUND=1 npx astro dev --port <p> --ignore-lock`.
- **Never** `npm run smoke` against production (it creates real users), never
  `vercel --prod`.
- **Local DB experiments only inside `BEGIN … ROLLBACK`.** Any other mutation of the local DB
  (revoking a grant, dropping a policy to force an error state) must be followed by
  `npx supabase db reset` in the same step — otherwise the next step's pgTAP fails on
  something that is not a product bug.
- **Smoke assertions on React-island content match the rendered node (`>text<`)**, not the
  bare text — the island's serialized props contain the same string (false positive seen in
  two slices).

## Screenshots and follow-ups

- Visual gate: `.claude/skills/10x-autonomous-run/references/visual-gate.md` — Claude-in-Chrome
  first (the maintainer selected the browser at preflight; never select or switch it yourself),
  Playwright fallback (`.claude/skills/10x-autonomous-run/scripts/visual-capture.mjs`).
  Never fake a screenshot.
- Follow-ups go to `<change dir>/follow-ups/review-fixes.md`, each with a
  `Trigger: <slice id | condition>` line — later slices grep for them.
