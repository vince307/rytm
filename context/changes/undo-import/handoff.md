# Handoff — `undo-import` (slice S-02)

Written by the `/10x-research` step (2026-09-27). `research.md` answers the S-02 questions with source + live-DB evidence;
`change.md` moved `new` → `preparing`. The next agent must not get this wrong: **no migration is needed** — the live local DB
already has `imports: authenticated delete own` and the single cascade FK `transactions_import_account_fkey`, and an
own delete followed by a re-import of the same range/`bank_tx_id`s was observed to work; an RLS-filtered delete of a
foreign/missing id returns **0 rows and no error**, so the endpoint must use a returning `.select()` (or count) to
tell "deleted" from "not found".

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/undo-import`, cut from `main` at `d11f3ef`; `main` `4425f8c` (S-03) merged in as `9eb6dd6` |
| Commits | this step adds 1: `docs(undo-import): research` on top of `7c82bf2` |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `preparing` (`updated: 2026-09-27`, via `metadata-guard.mjs mark-researched`) |
| `## Progress` rows remaining | n/a — no `plan.md` yet |
| Working tree | clean apart from the maintainer's ` M .gitignore` and `?? .claude/skills/10x-autonomous-run/` (never staged) |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `context/changes/undo-import/research.md` | Research: endpoint/page patterns, RLS+cascade in migrations and live DB (probe), pgTAP/smoke structure and slot, `/patterns` derivation, kit dialog/toast/danger patterns, shared components, 5 DESIGN-GAP candidates, endpoint and feedback options |
| `context/changes/undo-import/change.md` | Frontmatter only: `status: preparing` |
| `context/changes/undo-import/handoff.md` | This file |

## 3. Verification

| Command | Result |
| --- | --- |
| `git branch --show-current` | `feat/undo-import` (observed before writing) |
| `npm test` | 72/72 passed, 4 files (baseline after S-03: 72 — delta 0) |
| live DB catalog (`docker exec supabase_db_rytm psql`: `pg_policies`, `pg_constraint`, grants, `schema_migrations`) | 6 policies incl. both `… delete own`; `authenticated` has DELETE/INSERT/SELECT; one FK into `imports` (`transactions_import_account_fkey`, `confdeltype=c`); 4 migrations applied |
| live DB probe in `BEGIN … ROLLBACK` | stranger delete 0 rows; owner delete 1 import → 0 of 206 transactions visible; `import_ing_statement` same range + same rows → 206 again; after rollback 1 import / 206 tx (unchanged) |
| `grep plan( supabase/tests/database/*.sql` | 28 + 16 = 44 (static; `supabase test db` not run) |
| `scripts/smoke.mjs` `steps` | 48 entries (static count; smoke not run) |
| lint / astro check / build / pgTAP run / smoke run | **not run** — research step, no code touched; baseline after S-03 inherited, unverified here: lint 0 · astro check 0 (89 files) · pgTAP 44 · smoke 48 |

No deliberate break — nothing executable was changed. The probe is itself the evidence that the cascade frees range and `bank_tx_id`s (meta-check: it ran as `authenticated` with RLS on, so it proves the policy path the app will use, not superuser behaviour).

## 4. Next command

`/10x-plan undo-import`

## 5. Open

- **Plan choices** (research recommends, does not decide): endpoint `POST` in new `src/pages/api/imports/delete.ts` (form field `id`, `z.uuid()`, copy `src/pages/api/auth/delete.ts` `POST` + `src/pages/api/imports.ts` `POST` guard/logging) vs `DELETE` verb (unreachable from a native form/smoke); feedback via redirect `/imports?deleted=1` / `?error=delete` + `InlineAlert` (precedent `src/pages/settings.astro`, `src/pages/login.astro` `deleted`) vs a new shared Toast (none exists in `src/components`).
- **DESIGN-GAP candidates** (rows after K18/G29 in `context/foundation/design-kit.md`): (1) dialog/action copy only in `prototype/app.js` `modal('deleteImport')` → `copyExtra.imports`; (2) h2 „Usunąć import z maja?” hardcoded month → range placeholder (K16/`formatRangeLong` precedent); (3) **new**: toast text „Import usunięty w prototypie.” is prototype narration, not shippable; (4) no delete-failure copy / pending state; (5) no toast component.
- **Proofs to add**: pgTAP own delete → cascade → re-import (extend `supabase/tests/database/import_rpc.test.sql` or new file); smoke after step „import with an invalid payload is rejected”: delete (id from `importResultPath`) → `/patterns` contains „Wzorce pojawią się po pierwszym imporcie.” and not „Kawiarnia smoke” (runner has no negative-contains — extend `steps` expectation shape) → re-post `importPayload` 302 → merchant back.
- `DeleteAccountDialog` uses `SubmitButton` without `pending`; `useFormStatus` stays false on a native POST — a new dialog wanting a pending state must pass `pending` itself.
- Invariant for S-04/S-05: persisted pattern decisions/thresholds key on `merchantKey` + `user_id`, never `import_id`.
- Roadmap `### S-02` **Status** still `proposed` — archive step owns it.

## 6. Autonomous decisions

1. **Research question derived from `change.md` + orchestrator's coverage list**, no interview. Rejected: STOP for scope. Why: contract forbids a human. What would change it: an interactive run.
2. **Live-DB probe inside a rolled-back transaction**, not `supabase db reset` + `test db`. Why: answers "does re-import work" without wiping local data. What would change it: orchestrator requiring a clean-DB pgTAP run at research time.
3. **Recommendations left as options for `/10x-plan`** (POST form endpoint, InlineAlert feedback). Why: research does not approve design. What would change it: a shared Toast or DELETE-route precedent landing on `main`.
4. **Toast text „w prototypie” registered as a gap**, not reused verbatim. Why: prototype narration. What would change it: kit author confirming the string.
5. **Ran `npm test` only** among the gate suites. Why: cheap and it re-measures the moved vitest baseline the previous handoff flagged; other suites unaffected by a docs step. What would change it: code changes in this step.
