# Handoff — `undo-import` (slice S-02)

Written by the `/10x-plan` step (2026-09-27). `plan.md` (2 code phases, 22 Progress rows) and `plan-brief.md` are on
disk; `change.md` moved `preparing` → `planned`, roadmap S-02 → `planning`. The next agent must not get this wrong:
**the endpoint must read the deleted row back** (`.delete().eq("id", id).select("id")`) — an RLS-filtered delete of
a foreign/missing id returns 0 rows and no error, so an `error`-only check would report success; and **no
migration** belongs to this slice.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/undo-import`, cut from `main` at `d11f3ef`; `main` `4425f8c` (S-03) merged in as `9eb6dd6` |
| Commits | this step adds 1: `docs(undo-import): plan` on top of `48ddcb5` (`docs(undo-import): research`) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `planned` (`updated: 2026-09-27`, via `metadata-guard.mjs mark-planned`) |
| `## Progress` rows remaining | 22 (`grep -c '^- \[ \]' plan.md`): Phase 1 — 9 automated + 2 `[reviewer]`; Phase 2 — 8 automated + 2 `[visual]` + 1 `[reviewer]` |
| Working tree | clean apart from the maintainer's ` M .gitignore` and `?? .claude/skills/10x-autonomous-run/` (never staged) |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `context/changes/undo-import/plan.md` | Full plan: 2 phases, `## Autonomous decisions` (13), `## Progress` |
| `context/changes/undo-import/plan-brief.md` | Two-page brief with the key-decision table |
| `context/changes/undo-import/change.md` | Frontmatter `status: planned` |
| `context/foundation/roadmap.md` | S-02 `Status` → `planning` (at-a-glance row + `### S-02` body) |
| `context/changes/undo-import/handoff.md` | This file |

## 3. Verification

| Command | Result |
| --- | --- |
| `git branch --show-current` | `feat/undo-import` (observed before writing) |
| `metadata-guard.mjs inspect` / `mark-planned` | change.md hash matched; `{"changed":true}`, status `planned` |
| `grep -c '^## Progress' plan.md` / `grep -c '^- \[ \]' plan.md` | 1 / 22; each phase's Success Criteria bullets map 1:1 to its Progress rows (checked by count: P1 9+2, P2 8+3) |
| Kit strings the plan binds to | grep: „Wzorce pojawią się po pierwszym imporcie.”, „Nie masz jeszcze żadnego importu.” are `content.json` titles; dialog/toast strings only in `prototype/app.js` `modal` / `showToast` |
| lint / astro check / vitest / build / pgTAP / smoke | **not run** — docs step, no code touched. Baseline for implement (inherited from the contract, unverified here): lint 0 · astro check 0 errors (89 files) · vitest 72/72 (4 files) · pgTAP 44 · smoke 48 |

No deliberate break — nothing executable changed. The plan names three breaks for Phase 1 (endpoint returning-select,
cascade FK, smoke `notContains`) and one for Phase 2 (status block), each with its meta-check.

## 4. Next command

`/10x-plan-review undo-import`

## 5. Open

- **Manual-only Progress rows** (human/reviewer checklist):
  - 1.10 `[reviewer]` `src/pages/api/imports/delete.ts` `POST` mirrors `src/pages/api/auth/delete.ts` `POST`; no delete without the returning select.
  - 1.11 `[reviewer]` pgTAP `import_delete.test.sql` assertions 6/8 = RLS proofs, 1–5 = owner cascade proof.
  - 2.9 `[visual]` screenshots desktop 1440 + ~400 px: `default`, `dialog-open`, `success`, `error`, `not-found`, `empty-after-last-delete`, `trigger-focus` (pending code-reviewed only).
  - 2.10 `[visual]` dialog margins at ~400 px vs G24; fifth column reachable by in-panel scroll.
  - 2.11 `[reviewer]` `copyExtra.imports` K19 strings byte-equal to `prototype/app.js` `modal('deleteImport')` / `imports()`.
- **DESIGN-GAPs planned (added in Phase 2, not yet in `context/foundation/design-kit.md`)**: K19 (delete action + dialog copy only in `app.js`, h2 month → `{range}`), K20 (toast „w prototypie” → „Import usunięty.”), G30 (result/pending states via `InlineAlert`, no Toast, placeholder error / not-found / pending copy).
- **Carried risk**: S-03 follow-up F2 (keyset paging in `src/lib/patterns/load.ts` `collectPages`) names S-02 as trigger; plan defers it (decision 11) — a mid-read delete ends in the `/patterns` error state.
- **Visual account**: never import into `test@rytm.local` (smoke „patterns renders empty view” needs it empty); use a fresh local signup.
- Invariant for S-04/S-05: persisted pattern decisions/thresholds key on `merchantKey` + `user_id`, never `import_id`.
- No `db push` needed at ship (no migration).

## 6. Autonomous decisions

1. **No interview, no complexity/phase confirmation** (the skill's `AskUserQuestion` gates). Chose: decide from research + kit + repo precedents; all 13 plan decisions recorded in `plan.md` `## Autonomous decisions`. Why: contract forbids a human. What would change it: an interactive run.
2. **Endpoint `POST /api/imports/delete` + `InlineAlert` feedback** (plan decisions 1–3). Rejected: `DELETE` verb, RPC, new Toast. Why: native form + smoke runner + `/settings` precedent. What would change it: a shared Toast or fetch-based client pattern on `main`.
3. **Placeholder copy** „Usunąć import {range}?”, „Import usunięty.”, error/not-found/pending lines (plan decisions 4–6), each under K19/K20/G30. What would change it: kit round 3 copy.
4. **Gap rows and copy keys land with Phase 2 code** (plan decision 13), not in this docs commit. Why: register must not point at non-existent code. What would change it: orchestrator requiring gaps at plan time.
5. **Roadmap synced to `planning` and committed with the plan** (the skill leaves it for implement's first commit). Why: the run commits every docs step; forward-only change. What would change it: the archive step owning all roadmap edits.
6. **Wrote `plan-brief.md`** alongside `plan.md` (skill Step 4.5), though the run step named only `plan.md`. Why: skill output contract; plan-review may read it. What would change it: the orchestrator forbidding extra artifacts.
