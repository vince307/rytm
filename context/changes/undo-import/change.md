---
change_id: undo-import
title: Cofnięcie błędnego importu
status: new
created: 2026-09-25
updated: 2026-09-25
archived_at: null
---

## Notes

Roadmap slice **S-02** (`context/foundation/roadmap.md`, `### S-02`), PRD refs US-02, FR-004 (+ FR-005 via US-02).
Outcome: Użytkownik może zobaczyć listę importów (data, rachunek, zakres, liczba obciążeń) i usunąć błędny import
wraz z jego transakcjami; po usunięciu wzorce i sumy nie zawierają jego transakcji, a ponowne wgranie tego zakresu
jest przyjęte.

### Roadmap claims checked against the repo (2026-09-25, `main` at `d11f3ef`)

| Roadmap claim (plan-time) | Repo now | Correction |
| --- | --- | --- |
| "Użytkownik może zobaczyć listę importów (data, rachunek, zakres, liczba obciążeń)" | **Already shipped by S-01**: `src/pages/imports/index.astro` lists the caller's imports newest-first with `created_at`, `account_name`, `period_start–period_end`, `transactions(count)`; empty and error states exist. Its comment says "the „Usuń import” column arrives with S-02". | The list is **not** S-02 scope. S-02 adds only the fifth (unlabelled) column with the delete action + confirmation dialog + result feedback. |
| "usunąć błędny import wraz z jego transakcjami" | DB already supports it: `imports: authenticated delete own` RLS policy; `transactions_import_account_fkey` (migration `20260924122144_transactions_import_account_fk.sql`) is `on delete cascade`. No app route deletes yet (`src/pages/api/imports.ts` exports only `POST`). | **No migration expected.** Need an app endpoint (e.g. `POST /api/imports/delete` or a `DELETE` on `/api/imports/[id]`, zod-validated uuid, `prerender = false`) that deletes one import by id under RLS. pgTAP has only the cross-account "B deletes no imports of A" check — **no test proves own delete cascades to transactions** or that a re-import of the same range is accepted afterwards; add that proof. |
| "po usunięciu wzorce i sumy nie zawierają jego transakcji" | **No patterns or sums exist yet.** Nothing outside `src/pages/imports/*` and `src/lib/import/*` reads `transactions`; `/patterns`, `/home`, `/fixed` render no transaction-derived data (S-03 not shipped). | Satisfied **by construction** today (transactions are gone via cascade; every future view derives from `transactions`). The observable proof in S-02 is: the debit count/row disappears from `/imports` and the transaction rows are gone (pgTAP). The "wzorce i sumy" half becomes testable in S-03; the invariant to carry forward: patterns/sums must be *derived* from `transactions`, never materialised without an `import_id` cascade. |
| "ponowne wgranie tego zakresu jest przyjęte" | `imports_no_overlap` exclusion constraint is on live rows, so a deleted import frees its range; `transactions_bank_tx_key` (unique `user_id, account_number, bank_tx_id`) is freed by the cascade too. | Holds by schema; must be **proven** (pgTAP: delete → re-insert same range and same `bank_tx_id`s succeeds; smoke: import → delete → same import again → 302 to `/imports/result`). |
| Risk: decisions/thresholds tied to merchant, not import — checked only in S-05 | Unchanged; no decisions/threshold tables exist yet. | Carry forward, no S-02 action. |
| Prerequisites: S-01 | S-01 (`ing-csv-import`) archived at `context/archive/2026-09-24-ing-csv-import`, merged in `d11f3ef`. | Met. |

### Design-kit binding

Views of `design/rytm-os/prototype/`:
- `views/imports.html` → `app.js` `imports()` — table with 5th column: `<button class="text-button danger" onclick="openModal('deleteImport')">Usuń import</button>`.
- `app.js` `modal('deleteImport')` (`.modal`, rendered on `/imports`) — eyebrow „Cofnij import”, h2 „Usunąć import z maja?”, body „Wzorce wykryte w tym imporcie zostaną przeliczone. Tę decyzję można cofnąć przez ponowny import.”, `.btn.btn-danger` „Usuń import”, close button `aria-label="Zamknij"`.
- `app.js` `toast()` / `showToast('Import usunięty w prototypie.','success')` — success feedback after delete.
- `views/imports-empty.html` → `emptyView('imports')` — the state after deleting the last import (already implemented in `src/pages/imports/index.astro`).
- `design-kit.md` G9 row („Ekran „Importy CSV” + cofnięcie importu”, FR-004) — status "delivered · `/imports`".

Keys of `design/rytm-os/react-kit/docs/content.json` this slice binds to:
- `emptyViews.imports.title`, `emptyViews.imports.lead`, `emptyState.*` (empty list after the last delete — already bound).
- `components.error` („Błąd — sprawdź plik CSV.”) — only generic error the kit has; already used for the list-read failure.
- **None for the delete action or dialog.** `content.json` has no key for „Usuń import”, „Cofnij import”, the dialog title/body, the close label on this dialog, or the success toast. `copyExtra.imports` in `src/content/copy.ts` also has none yet.

Expected DESIGN-GAPs (to be recorded as rows in `context/foundation/design-kit.md` + `DESIGN-GAP` comments by the plan/implement steps, never invented):
1. **Copy gap (K11-type)** — delete action, dialog eyebrow/title/body/button and success toast exist only in `prototype/app.js`; they go to `copyExtra.imports` with a K11/new-K-row reference, taken verbatim from the prototype.
2. **Dialog title with a hardcoded month** — „Usunąć import z maja?” names a month; a real import spans an arbitrary range (possibly several months, like US-02's styczeń–marzec). Needs a range placeholder (analogous to K16 for `importErrors.overlap`); placeholder decision to be recorded.
3. **Body copy promises recalculated patterns** („Wzorce wykryte w tym imporcie zostaną przeliczone”) before patterns exist (S-03) — analogous to G26; decide whether to show it verbatim or defer.
4. **No delete-failure state** — kit has no error copy for a failed import deletion (analogous to G24 for account deletion); plus no pending/disabled state of the „Usuń import” button in the dialog.
5. **Toast** — kit `.toast` pattern (`prototype/styles.css`) has no counterpart component in `src/components/`; either a result banner via existing `InlineAlert` (success) or a new shared toast — plan must choose and record.

### Reusable pieces already in the repo

- `src/components/ui/dialog.tsx` (shadcn new-york, used by `src/components/settings/DeleteAccountDialog.tsx` — same kit `.modal` pattern, `closeLabel` prop), `src/components/auth/SubmitButton`, `src/components/auth/ServerError`, `src/components/app/InlineAlert.astro`, `buttonVariants` in `src/components/ui/button.tsx`.
- Account deletion flow (`src/pages/api/auth/delete.ts` + `DeleteAccountDialog`) is the in-repo precedent for a destructive POST + dialog + redirect-with-status.
- `scripts/smoke.mjs` already has the POST `/api/imports` saved/overlap steps to extend with delete → re-import.

## Autonomous decisions

1. **Did not STOP after creating `change.md`** (the `/10x-new` skill prints the next-step prompt and waits). Chose: continue to handoff + commit. Rejected: waiting for a human. Why: the run's agent contract forbids a human in the loop. What would change it: the orchestrator running this step interactively.
2. **Title in Polish** („Cofnięcie błędnego importu”, the roadmap `### S-02` heading) instead of the skill's humanised id „Undo import”. Why: context docs and commit log are Polish; the roadmap heading is canonical. What would change it: a repo convention requiring English `change.md` titles.
3. **Notes carry the verified roadmap corrections and design-kit binding** instead of the skill's placeholder comment. Why: the run step requires them in `change.md`. What would change it: a separate `frame.md`/`research.md` mandated for them.
4. **Scope narrowed: the import list is not S-02 work** — it already ships in `src/pages/imports/index.astro` (S-01). Rejected: re-building or restyling the list. Why: observed in the repo; "one view" rule. What would change it: research finding the shipped list misses a roadmap field (it shows date, account, range, debit count — all four).
5. **"No migration expected"** — `imports: authenticated delete own` policy + `transactions_import_account_fkey … on delete cascade` already exist. Rejected: planning a `delete_import` RPC now. Why: one RLS-scoped `delete from imports where id = …` is atomic with the cascade. What would change it: research needing the deleted range/count returned atomically for the success message, or a race with a concurrent import.
6. **"Wzorce i sumy" half treated as satisfied by construction** (nothing derives from `transactions` yet); carried forward as an invariant for S-03+. Rejected: building a pattern stub to test it. Why: S-03 owns patterns. What would change it: S-03 shipping before S-02 merges.
7. **DESIGN-GAP rows not yet added to `context/foundation/design-kit.md`**; listed above as expected gaps. Why: `/10x-new` writes only `change.md`; plan decides placeholders. What would change it: the orchestrator requiring gaps registered at identity time.
8. **Next step `/10x-research`**, not the skill's default `/10x-plan`. Why: open choices remain (endpoint shape, toast vs `InlineAlert`, title placeholder). What would change it: the orchestrator skipping research when `change.md` settles scope.
