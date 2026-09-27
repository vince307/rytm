---
change_id: undo-import
title: Cofnięcie błędnego importu
status: impl_reviewed
created: 2026-09-25
updated: 2026-09-27
archived_at: null
---

## Notes

Roadmap slice **S-02** (`context/foundation/roadmap.md`, `### S-02`), PRD refs US-02, FR-004 (+ FR-005 via US-02).
Outcome: Użytkownik może zobaczyć listę importów (data, rachunek, zakres, liczba obciążeń) i usunąć błędny import
wraz z jego transakcjami; po usunięciu wzorce i sumy nie zawierają jego transakcji, a ponowne wgranie tego zakresu
jest przyjęte.

### Roadmap claims checked against the repo (refreshed 2026-09-27, branch `feat/undo-import` at `9eb6dd6` = `main` `4425f8c` merged; first check 2026-09-25 at `d11f3ef`)

Since 09-25 **S-03 `merchant-patterns` shipped** (archived `context/archive/2026-09-25-merchant-patterns/`, PR #3). It added **no migration**: patterns are derived on every read from the caller's `transactions` (`src/lib/patterns/load.ts` `loadPatterns` → `derivePatterns`), rendered on `/patterns` with per-pattern sum and fixed amount. Migrations are unchanged (`20260921…`, `20260923165530…`, `20260924122144…`, `20260924224014_import_ing_statement.sql`); `design/rytm-os/` is unchanged since `d11f3ef`.

| Roadmap claim (plan-time) | Repo now (2026-09-27) | Correction |
| --- | --- | --- |
| "Użytkownik może zobaczyć listę importów (data, rachunek, zakres, liczba obciążeń)" | **Already shipped by S-01**, unchanged by S-03: `src/pages/imports/index.astro` lists the caller's imports newest-first with `created_at`, `account_name`, `period_start–period_end`, `transactions(count)`; empty and error states exist; its header comment still says the „Usuń import” column arrives with S-02. | The list is **not** S-02 scope. S-02 adds only the fifth (unlabelled) column with the delete action + confirmation dialog + result feedback. |
| "usunąć błędny import wraz z jego transakcjami" | Unchanged: `imports: authenticated delete own` RLS policy; `transactions_import_account_fkey` `on delete cascade`. `src/pages/api/imports.ts` still exports only `POST`; `src/pages/api/` has only `auth/` + `imports.ts`. pgTAP (`domain_rls.test.sql`, `import_rpc.test.sql`) still has only the cross-account "B deletes no imports of A" check. | **No migration expected.** Need an app endpoint (zod-validated uuid, `prerender = false`) that deletes one import by id under RLS, plus a pgTAP proof that an own delete cascades to its transactions. |
| "po usunięciu wzorce i sumy nie zawierają jego transakcji" | **Now observable (changed since 09-25).** `/patterns` (`src/pages/patterns.astro` → `loadPatterns`) derives patterns, occurrences, per-pattern **sum** (`sumMinor`) and fixed amount from `transactions` on each SSR request — nothing is materialised, so a cascade-deleted transaction cannot linger. `collectPages` already fails the read (error state, never a partial list) if rows vanish mid-paging, e.g. an import deleted during the read. `/home` and `/fixed` still render no transaction-derived data (no other "sums" exist). `/imports/result?id=<deleted>` finds no row and redirects to `/imports`. | The "wzorce i sumy" half is **now testable and in scope as proof**: smoke after delete — `/patterns` no longer contains the smoke merchant („Kawiarnia smoke”) and, for the smoke user's only import, renders the empty view („Wgraj pierwszy wyciąg”); unit/derivation needs no change. Invariant carried to S-04/S-05: any persisted pattern decision/threshold table keys on `merchantKey` + `user_id` (cascade from `auth.users`), never on `import_id`, and patterns stay derived. |
| "ponowne wgranie tego zakresu jest przyjęte" | Unchanged: `imports_no_overlap` exclusion is on live rows; `transactions_bank_tx_key` (unique `user_id, account_number, bank_tx_id`) freed by the cascade. Smoke already has the "overlapping range is rejected" step after the first import. | Holds by schema; must be **proven** — pgTAP: delete → `import_ing_statement` with the same range and same `bank_tx_id`s succeeds; smoke: import → delete → same payload again → 302 `/imports/result?id=` → `/patterns` shows the merchant again. |
| Risk: decisions/thresholds tied to merchant, not import — checked only in S-05 | Still no decisions/threshold tables (S-03 added none; roadmap S-03 Risk now says they arrive in S-04/S-05 "z tą samą regułą RLS i kaskady"). Pattern identity is `merchantKey`, independent of imports. | Carry forward, no S-02 action; S-02 proof above already shows patterns reappear by merchant after re-import. |
| Prerequisites: S-01 | S-01 archived `context/archive/2026-09-24-ing-csv-import`. Roadmap marks S-02 "Parallel with S-03" — S-03 is `done` and merged into this branch. | Met. S-02 `Status` in roadmap still `proposed` (archive step owns it). |

### Design-kit binding

Views of `design/rytm-os/prototype/` (unchanged since 09-25):
- `views/imports.html` → `app.js` `imports()` — table with 5th column: `<button class="text-button danger" onclick="openModal('deleteImport')">Usuń import</button>`.
- `app.js` `modal('deleteImport')` (`.modal`, on `/imports`) — eyebrow „Cofnij import”, h2 „Usunąć import z maja?”, body „Wzorce wykryte w tym imporcie zostaną przeliczone. Tę decyzję można cofnąć przez ponowny import.”, `.btn.btn-danger` „Usuń import”, close button `aria-label="Zamknij"`.
- `app.js` `toast()` / `showToast('Import usunięty w prototypie.','success')` — success feedback after delete.
- `views/imports-empty.html` → `emptyView('imports')` — state after deleting the last import (already implemented in `src/pages/imports/index.astro`).
- **New since 09-25:** `patterns(empty = true)` → `emptyView('patterns')` — what `/patterns` shows once the last import is deleted (already implemented in `src/pages/patterns.astro`, not restyled by S-02).
- `design-kit.md` G9 row („Ekran „Importy CSV” + cofnięcie importu”, FR-004) — status "delivered · `/imports`".

Keys of `design/rytm-os/react-kit/docs/content.json` this slice binds to:
- `emptyViews.imports.title`, `emptyViews.imports.lead`, `emptyState.*` (empty import list after the last delete — already bound).
- **New since 09-25:** `emptyViews.patterns.*`, `emptyViews.cta`, `emptyViews.button` — read-only binding of the `/patterns` empty view used as the smoke proof; no S-02 edit.
- `components.error` („Błąd — sprawdź plik CSV.”) — only generic error; already used for list-read failure on `/imports` and (since S-03) `/patterns` under `DESIGN-GAP: K18`.
- **None for the delete action or dialog.** `content.json` has no key for „Usuń import”, „Cofnij import”, the dialog title/body, its close label, or the success toast. `copyExtra.imports` in `src/content/copy.ts` still has none (S-03 added only `copyExtra.patterns`).

Expected DESIGN-GAPs (rows in `context/foundation/design-kit.md` + `DESIGN-GAP` comments by plan/implement, never invented). Registered rows since 09-25: K17, K18, G28, G29 (all S-03) — none covers S-02.
1. **Copy gap (K11-type)** — delete action, dialog eyebrow/title/body/button and success toast exist only in `prototype/app.js`; they go to `copyExtra.imports` taken verbatim, with a K-row reference.
2. **Dialog title with a hardcoded month** — „Usunąć import z maja?”; a real import spans an arbitrary range. Needs a range placeholder (precedent K16 `overlapPrefix` + `formatRangeLong`).
3. **Body copy about recalculated patterns — changed since 09-25: no longer a gap.** „Wzorce wykryte w tym imporcie zostaną przeliczone” is now **true** (patterns are derived on read after S-03), so it can be used verbatim; no G26-style deferral.
4. **No delete-failure state** — kit has no error copy for a failed import deletion (analogous to G24; K18 is the read-failure precedent), plus no pending/disabled state of the dialog button.
5. **Toast** — kit `.toast` pattern has still no counterpart in `src/components/` (S-03 added `Badge.tsx`, `Glyph.tsx`, `PatternsTable.tsx`, no toast); plan chooses result banner via `InlineAlert` vs new shared toast and records it.

### Reusable pieces already in the repo

- `src/components/ui/dialog.tsx` (shadcn new-york, used by `src/components/settings/DeleteAccountDialog.tsx` — same kit `.modal` pattern, `closeLabel` prop), `src/components/auth/SubmitButton`, `src/components/auth/ServerError`, `src/components/app/InlineAlert.astro`, `buttonVariants` in `src/components/ui/button.tsx`; `src/lib/format.ts` `formatRangeLong` for the range placeholder.
- Account deletion flow (`src/pages/api/auth/delete.ts` + `DeleteAccountDialog`) is the in-repo precedent for a destructive POST + dialog + redirect-with-status.
- `scripts/smoke.mjs` already has POST `/api/imports` saved/overlap steps and (S-03) "patterns lists imported merchants" / "patterns renders empty view" steps to extend with delete → patterns gone → re-import.

## Autonomous decisions

1. **Did not STOP after creating `change.md`** (the `/10x-new` skill prints the next-step prompt and waits). Chose: continue to handoff + commit. Rejected: waiting for a human. Why: the run's agent contract forbids a human in the loop. What would change it: the orchestrator running this step interactively.
2. **Title in Polish** („Cofnięcie błędnego importu”, the roadmap `### S-02` heading) instead of the skill's humanised id „Undo import”. Why: context docs and commit log are Polish; the roadmap heading is canonical. What would change it: a repo convention requiring English `change.md` titles.
3. **Notes carry the verified roadmap corrections and design-kit binding** instead of the skill's placeholder comment. Why: the run step requires them in `change.md`. What would change it: a separate `frame.md`/`research.md` mandated for them.
4. **Scope narrowed: the import list is not S-02 work** — it already ships in `src/pages/imports/index.astro` (S-01). Rejected: re-building or restyling the list. Why: observed in the repo; "one view" rule. What would change it: research finding the shipped list misses a roadmap field (it shows date, account, range, debit count — all four).
5. **"No migration expected"** — `imports: authenticated delete own` policy + `transactions_import_account_fkey … on delete cascade` already exist. Rejected: planning a `delete_import` RPC now. Why: one RLS-scoped `delete from imports where id = …` is atomic with the cascade. What would change it: research needing the deleted range/count returned atomically for the success message, or a race with a concurrent import.
6. ~~"Wzorce i sumy" half treated as satisfied by construction~~ — **superseded 2026-09-27 by decision 9**: S-03 did ship before S-02 merged, which was this decision's stated reversal condition.
7. **DESIGN-GAP rows not yet added to `context/foundation/design-kit.md`**; listed above as expected gaps. Why: `/10x-new` writes only `change.md`; plan decides placeholders. What would change it: the orchestrator requiring gaps registered at identity time.
8. **Next step `/10x-research`**, not the skill's default `/10x-plan`. Why: open choices remain (endpoint shape, toast vs `InlineAlert`, title placeholder). What would change it: the orchestrator skipping research when `change.md` settles scope.
9. **(Refresh 2026-09-27) "Wzorce i sumy" half is now in scope as an observable proof**, not by construction. Chose: smoke steps after delete (`/patterns` loses „Kawiarnia smoke” → empty view; after re-import it returns). Rejected: a pgTAP-only proof (patterns are app-side, not SQL) and a new unit test (`derivePatterns` is pure over its input; the delete path does not touch it). Why: `/patterns` now derives from `transactions` on read (`loadPatterns`). What would change it: patterns becoming materialised (a table/cache) — then a cascade/pgTAP proof on that table would be required.
10. **(Refresh) Expected gap 3 (body copy promising recalculation) dropped.** Why: after S-03 the sentence is true; verbatim prototype copy needs no gap row. What would change it: S-04/S-05 adding persisted per-pattern state that an import delete would *not* recalculate.
11. **(Refresh) Edited `change.md` in place; did not rerun `/10x-new`'s creation**, which would fail/overwrite on the existing folder. Kept `created: 2026-09-25`, `status: new`, bumped `updated`. Why: the run step asks for a refresh; history of decisions 1–8 stays auditable. What would change it: the orchestrator asking for a fresh identity file.
12. **(Refresh) No new decision on endpoint shape / toast vs `InlineAlert`.** Why: S-03 added no precedent that settles them (no new API route, no toast); left to `/10x-research`. What would change it: a shared toast or `DELETE`-style route appearing on `main` before research.
