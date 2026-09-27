# Handoff — `undo-import` (slice S-02)

Written by the `/10x-plan-review` step (2026-09-27). Verdict **PROCEED** (skill verdict SOUND): 0 critical, 2 warnings,
2 observations, all fixed in `plan.md`; `change.md` → `plan_reviewed`. The next agent must not get this wrong:
**the endpoint must read the deleted row back** (`.delete().eq("id", id).select("id")`) — an RLS-filtered delete of a
foreign/missing id returns 0 rows and no error — and the Phase 2 smoke step „imports lists the delete action” asserts
`>Usuń import<` (text node), not the bare string that also sits in the island's props. **No migration** in this slice.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/undo-import`, cut from `main` at `d11f3ef`; `main` `4425f8c` (S-03) merged in as `9eb6dd6` |
| Commits | this step adds 1: `docs(undo-import): plan review` on top of `dcc021b` (`docs(undo-import): plan`) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` (`updated: 2026-09-27`, direct frontmatter edit — the metadata guard has no command for it) |
| `## Progress` rows remaining | 22 (`grep -c '^- \[ \]' plan.md`): Phase 1 — 9 automated + 2 `[reviewer]`; Phase 2 — 8 automated + 2 `[visual]` + 1 `[reviewer]` |
| Working tree | clean apart from the maintainer's ` M .gitignore` and `?? .claude/skills/10x-autonomous-run/` (never staged) |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `context/changes/undo-import/reviews/plan-review.md` | Review report (F1–F4, all FIXED), grounding evidence, ends with the `VERDICT:` line |
| `context/changes/undo-import/plan.md` | Edited: F9 deferral bullet in `## What We're NOT Doing`; Phase 2 §5 smoke `>Usuń import<`; Phase 1 astro-check criterion + Progress 1.2 reworded (0 errors gate, file count recorded, expected +3); new `## Known risks` before `## Progress` |
| `context/changes/undo-import/change.md` | `status: plan_reviewed` |
| `context/changes/undo-import/handoff.md` | This file |

## 3. Verification

| Command | Result |
| --- | --- |
| `git branch --show-current` | `feat/undo-import` (observed before writing) |
| `grep -cE '^  \[' scripts/smoke.mjs` | 48 — matches the smoke baseline the plan uses |
| grep migrations for policies/FKs/grants | `imports: authenticated delete own` + select-own policies; single `transactions_import_account_fkey … on delete cascade` (old `(import_id,user_id)` FK dropped in `20260924122144`); `revoke all … from anon` |
| `grep` `domain_rls.test.sql` | top-level `with d as (delete … returning 1) select is(count(*), …) from d` pattern already in use — planned pgTAP shape is valid |
| `grep` `prototype/app.js` `imports()` / `modal('deleteImport')`, `styles.css` `.text-button` | kit strings and `.text-button.danger` metrics match the plan's K19 keys and `text-danger`/`inline` variants |
| `grep -c '^- \[ \]' plan.md` / `grep -n '^## ' plan.md` | 22 / `## Progress` is last, preceded by `## Known risks` |
| lint / astro check / vitest / build / pgTAP / smoke | **not run** — docs step, no code touched. Baseline for implement (inherited from the contract, unverified here): lint 0 · astro check 0 errors (89 files) · vitest 72/72 (4 files) · pgTAP 44 · smoke 48 |

No deliberate break — nothing executable changed. The plan's breaks (Phase 1: endpoint returning-select, cascade FK →
`restrict`, smoke `notContains`; Phase 2: status block) were checked for feasibility: the FK break cannot be masked
because only one FK links `transactions` to `imports`.

## 4. Next command

`/10x-implement undo-import`

## 5. Open

- **Manual-only Progress rows** (human/reviewer checklist):
  - 1.10 `[reviewer]` `src/pages/api/imports/delete.ts` `POST` mirrors `src/pages/api/auth/delete.ts` `POST`; no delete without the returning select.
  - 1.11 `[reviewer]` pgTAP `import_delete.test.sql` assertions 6/8 = RLS proofs, 1–5 = owner cascade proof.
  - 2.9 `[visual]` screenshots desktop 1440 + ~400 px: `default`, `dialog-open`, `success`, `error`, `not-found`, `empty-after-last-delete`, `trigger-focus` (pending code-reviewed only).
  - 2.10 `[visual]` dialog margins at ~400 px vs G24; fifth column reachable by in-panel scroll.
  - 2.11 `[reviewer]` `copyExtra.imports` K19 strings byte-equal to `prototype/app.js` `modal('deleteImport')` / `imports()`.
- **DESIGN-GAPs planned (land in Phase 2)**: K19, K20, G30 — not yet in `context/foundation/design-kit.md`.
- **Carried risks** (`plan.md` `## Known risks`): S-03 follow-up F2 (keyset paging in `src/lib/patterns/load.ts` `collectPages`) deferred though its trigger is S-02 landing — archive step should restate the trigger in `context/archive/2026-09-25-merchant-patterns/follow-ups/review-fixes.md`; S-01 follow-up F9 (shared icon — `src/components/ui/dialog.tsx`, `src/components/auth/ServerError.tsx` → `src/components/Glyph.tsx` `Glyph`) deferred, stays open in `context/archive/2026-09-24-ing-csv-import/follow-ups/review-fixes.md`.
- **Visual account**: never import into `test@rytm.local` (smoke „patterns renders empty view” needs it empty); use a fresh local signup.
- Invariant for S-04/S-05: persisted pattern decisions/thresholds key on `merchantKey` + `user_id`, never `import_id`.
- No `db push` needed at ship (no migration).

## 6. Autonomous decisions

1. **Triage done without `AskUserQuestion`** — all four findings LOW impact with one obvious fix; applied and marked FIXED in the report. Rejected: leaving `Decision: PENDING`. What would change it: a CRITICAL/HIGH-impact finding with two real options.
2. **No Step-3 sub-agent** — the riskiest claims (RLS returning-select, single cascade FK, pgTAP CTE shape, smoke runner + ordering, kit strings) were verified directly. What would change it: a plan with wide blast radius across modules.
3. **F2 keyset paging deferral upheld** (error state, never wrong totals). What would change it: an observed „patterns read ended short of count” log.
4. **F9 shared icon deferred with reason in plan** (no new icon markup; remaining sprites in components shared beyond `/imports`). What would change it: `DeleteImportDialog` needing its own icon — then use `Glyph`.
5. **`change.md` status set by direct edit** — guard has only `mark-planned` / `mark-researched`. What would change it: a guard command for `plan_reviewed`.
