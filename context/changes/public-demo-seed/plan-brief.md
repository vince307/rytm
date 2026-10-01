# Public demo account on production — Plan Brief

> Full plan: `context/changes/public-demo-seed/plan.md`

## What & Why

Roadmap S-09, the last item of milestone M-1: a reviewer opens `rytm-phi.vercel.app`, signs in to one shared demo
account and sees the imported synthetic ING statement with its patterns. The public URL must never carry a real
statement (FR-014, privacy NFR). A shared account must not be one visitor's click away from being locked or emptied.

## Starting Point

The synthetic fixture already imports through the wizard (206 debits, 12 months). Nothing writes rows to production
except the app itself: `seed.sql` is local-only, migrations are CI-only, and agents have no hosted DB access. Every
signed-in user can change the password, delete the account, undo imports and import files. There is no role or demo
concept.

## Desired End State

The owner seeds the demo account through the UI on production. For the account matching `DEMO_EMAIL`, the server
refuses a password change, account deletion, import undo and any import beyond the first, each with a one-sentence
message. Thresholds and pattern decisions still work. The README shows the credentials, and `deploy-plan.md` holds the
seed and reset procedure.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) |
| --- | --- | --- |
| How the account is seeded | Owner signs up and imports the fixture through the UI | No agent, script or migration writes to production, and the live flow gets exercised |
| Protection | Server refuses password change, deletion, import undo, and any import after the first | Nobody can lock out reviewers or empty the demo, while the threshold mechanism stays testable |
| New imports on demo | Blocked, except the first one on an empty account | Nobody can upload a real statement to a shared public account |
| Credentials | README "Demo" section and the submission text, no `/login` UI | No new UI outside the design kit |
| How the demo is recognised | `DEMO_EMAIL` env var, trimmed and case-insensitive; unset means no demo | No schema change, and turning it off is an env change |
| Reset | Owner deletes the user in the Supabase dashboard (cascade), signs up and imports again | No reset code; the first import on an empty account is allowed |
| Messages | Two `copyExtra` sentences in existing error slots, design gap G37 | The kit has no state for a refused action |

## Scope

**In scope:**
- `DEMO_EMAIL` in `env.schema`, `.env.example` and the CI smoke `.env`.
- `src/lib/demo.ts` plus a unit test.
- Guards in 4 endpoints.
- Error codes and copy on 3 pages.
- Local `demo@rytm.local` in `seed.sql`, plus 8 smoke steps.
- `deploy-plan.md` procedure, `CLAUDE.md` and README.
- Owner rollout.

**Out of scope:**
- Migration, role column, DB-level guard.
- Read-only demo, hidden or disabled forms.
- Demo login UI.
- Automatic reset.
- Any script or agent writing demo data to production.
- The fixture's second account.

## Architecture / Approach

A pure rule module decides whether an e-mail is the demo account and whether an import is allowed (zero existing
imports). Each endpoint checks right after `getUser()`, before validation or RPC, and redirects with its own
`?error=` code. The import endpoint counts the caller's imports through RLS and fails closed. CI proves every guard
through smoke against a real server with a seeded local demo user.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Demo-account guard in code | Four refusals, messages, unit and smoke coverage | Guard placed after the RPC shows `overlap` instead of `demo` (smoke step 3 catches it) |
| 2. Demo procedure and docs | Seed and reset procedure, env var documented, README skeleton | Reset steps unclear to the owner later |
| 3. Rollout and seeding | Env var → merge → owner seeds via UI → credentials in README | Seeding before the guard deploy leaves a window to undo the import |

**Prerequisites:** local Supabase running; owner access to Vercel env and a real inbox for the demo address.
**Estimated effort:** ~1–2 sessions of code, plus about 15 minutes of owner steps.

## Open Risks & Assumptions

- Visitors can still change thresholds and pattern decisions, so the demo can drift until the owner resets it.
- The demo address and password are public. The inbox receives any password-reset e-mails visitors trigger (rate-limited).
- A local `.env` copied before this change lacks `DEMO_EMAIL`, so local smoke fails until the line is added.

## Success Criteria (Summary)

- A reviewer signs in with the README credentials and sees the synthetic statement, patterns and trend.
- No visitor can lock the account, delete it, empty it or upload their own statement to it.
- All 8 new smoke steps pass in CI.
