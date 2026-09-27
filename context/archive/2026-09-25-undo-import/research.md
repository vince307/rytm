---
date: 2026-09-27T20:02:55+02:00
researcher: Claude (autonomous run 2026-09-27-s03-s02-s04, step /10x-research)
git_commit: 7c82bf298692b37e7a1064ad488cb826ab666d0d
branch: feat/undo-import
repository: Rytm
topic: "S-02 undo-import — what exists for deleting one import, proving the cascade, and the kit's dialog/toast"
tags: [research, imports, rls, cascade, pgtap, smoke, patterns, design-kit, dialog]
status: complete
last_updated: 2026-09-27
last_updated_by: Claude (autonomous run, /10x-research)
---

# Research: S-02 undo-import

**Date**: 2026-09-27T20:02:55+02:00
**Researcher**: Claude (autonomous run, supervised step)
**Git Commit**: `7c82bf2` (local branch; not pushed — no permalinks)
**Branch**: feat/undo-import
**Repository**: Rytm

## Research Question

Derived from `change.md` (roadmap claims + open proofs), no human interview (see Autonomous decisions):

1. How are `POST /api/imports` and the `/imports` pages built — which patterns (zod, `prerender`, auth check, redirect-with-status) does a delete endpoint copy?
2. Do the RLS delete policy and the import → transactions cascade exist in the migrations **and** in the live local DB, and does an own delete free the range and `bank_tx_id`s for re-import?
3. Which pgTAP tests exist to extend, and what is the smoke script's structure / slot for delete → `/patterns` empty → re-import?
4. How does `/patterns` derive from `transactions`; does anything else read these tables?
5. What does the kit give for the delete action, modal, toast, danger button; what shared Dialog/Toast components exist in `src/components`; which copy is missing (→ DESIGN-GAP)?

## Summary

- **No migration is needed.** In the live local DB (`supabase_db_rytm`, migrations `20260921120000…20260924224014` applied) `imports` has the policy `imports: authenticated delete own` (`using ((select auth.uid()) = user_id)`), `authenticated` holds `DELETE` on both tables, and exactly one FK points at `imports`: `transactions_import_account_fkey` `(import_id, user_id, account_number) → imports ON DELETE CASCADE`. A rolled-back probe as `authenticated` showed: stranger `delete from imports` → 0 rows; owner delete of the one import → 1 row, 206 → 0 transactions; `import_ing_statement` with the same range and same 206 `bank_tx_id`s → succeeds (206 rows again). Data restored by `ROLLBACK` (1 import / 206 tx before and after).
- **Endpoint pattern to copy** is `src/pages/api/auth/delete.ts` `POST` (form POST, zod, `getUser()` guard, redirect with `?error=` / success flag) combined with `src/pages/api/imports.ts` `POST` (same guard, `console.error` logging). HTML forms and `scripts/smoke.mjs` `request` send only urlencoded POST, so a `DELETE` verb is not reachable from the kit's form-based flow.
- **Kit**: the delete action is `.text-button.danger` „Usuń import” in the 5th, unlabelled column of `prototype/app.js` `imports()`; the dialog is `modal('deleteImport')` with **one** `.btn.btn-danger` button (no cancel) and close `aria-label="Zamknij"`; success feedback is `showToast('Import usunięty w prototypie.','success')`. `content.json` has **no** key for any of these strings. The repo has `ui/dialog.tsx` (+ `DeleteAccountDialog.tsx` as a full precedent) but **no Toast** component.
- **Proof gaps confirmed**: no pgTAP test deletes a user's own import (only „B deletes no imports of A” and the account-deletion cascade in `domain_rls.test.sql`); smoke has no delete step. Smoke slot: after step „import with an invalid payload is rejected” (user holds exactly one import there).
- **Baselines observed on this branch**: vitest 72/72 (4 files); smoke has 48 step entries (static count of `steps`). lint/astro check/build/pgTAP/smoke runtime not run (research step).

## Detailed Findings

### 1. Existing import endpoint and pages (patterns to copy)

- `src/pages/api/imports.ts` — only `POST` export; `export const prerender = false`; `createClient(context.request.headers, context.cookies)` → `null` ⇒ redirect `/login`; `supabase.auth.getUser()` no user ⇒ `/login`; body read via `context.request.formData().get("payload")` in try/catch; zod `importPayloadSchema.safeParse`; errors as redirects `/imports/new?error=invalid|overlap|failed`; unexpected DB errors logged with `// eslint-disable-next-line no-console` + `console.error("imports failed", error?.code, error?.message)`; success ⇒ `/imports/result?id=`.
- `src/pages/api/auth/delete.ts` `POST` — destructive precedent: local `schema = z.object(...)`, `Object.fromEntries(await context.request.formData())`, failure ⇒ `/settings?error=delete`, success ⇒ `/login?deleted=1`.
- `src/middleware.ts` `PROTECTED_ROUTES` = `/home`, `/patterns`, `/fixed`, `/imports`, `/settings` (prefix match `route/`). `/api/...` is **not** in it — API routes guard themselves with `getUser()` (as both endpoints above do); smoke step „import without a session goes to login” proves this for `/api/imports`.
- `src/pages/imports/index.astro` — reads `.from("imports").select("id, account_name, period_start, period_end, created_at, transactions(count)").order("created_at", { ascending: false })`; three states: error (`InlineAlert kind="error"` + `copy.components.error`), empty (`ViewEmpty`), table with 4 `<th>` (`x.table.importedOn/account/range/debits`). `rows` already carry `id` (unused today) and `range` via `formatRangeShort`. Header comment: „the "Usuń import" column arrives with S-02”. No query-param handling today.
- `src/pages/imports/result.astro` — `z.uuid().safeParse(Astro.url.searchParams.get("id"))`; missing/other user's id ⇒ `Astro.redirect("/imports")`. So a deleted import's result URL degrades to the list (no change needed).
- Status-after-redirect precedent: `src/pages/settings.astro` reads `?password=changed` → `InlineAlert kind="success"`, `?error=delete|delete-password` → `DeleteAccountDialog` `serverError` (reopens the dialog); `src/pages/login.astro` `deleted = Astro.url.searchParams.has("deleted")` → `InlineAlert kind="success"` (`copyExtra.auth.deletedLogin`, gap G24).
- Inference (not verified at runtime): Astro's `security.checkOrigin` default applies to form POSTs; no override in `astro.config.mjs` (grep for `checkOrigin`/`security` found none). Smoke's `request` sends `Origin: BASE_URL`, so a new form POST works under smoke the same way as `/api/imports`.

### 2. RLS + cascade — migrations vs live DB

Migrations:
- `supabase/migrations/20260923165530_domain_imports_transactions.sql` — `imports.user_id … references auth.users(id) on delete cascade`; `imports_no_overlap exclude using gist (user_id =, account_number =, daterange(period_start, period_end,'[]') &&)`; RLS enabled on both tables; policies `… select own`, `… insert own`, `… delete own` per table, `to authenticated`; `revoke all … from anon`.
- `supabase/migrations/20260924122144_transactions_import_account_fk.sql` — replaces the FK with `transactions_import_account_fkey (import_id, user_id, account_number) references imports (id, user_id, account_number) on delete cascade`; `revoke update, maintain … from authenticated`.
- `supabase/migrations/20260924224014_import_ing_statement.sql` — `import_ing_statement(p_account_number text, p_account_name text, p_period_start date, p_period_end date, p_transactions jsonb) returns uuid`, `security invoker`.

Live local DB (observed via `docker exec supabase_db_rytm psql`, sandbox disabled):
- `pg_policies` for `public`: exactly 6 policies (select/insert/delete × imports/transactions), all `{authenticated}`; delete quals `(( SELECT auth.uid() AS uid) = user_id)`.
- Grants to `authenticated` on both tables: `DELETE,INSERT,SELECT` (no UPDATE); no grant rows for `anon`. `relrowsecurity = t` on both.
- FKs referencing `imports` or `transactions`: exactly one — `transactions_import_account_fkey`, `confdeltype = c`. No triggers on either table.
- `supabase_migrations.schema_migrations`: the 4 versions above.
- Probe (single transaction, `ROLLBACK`): as `authenticated` with `sub` = unknown uuid, `delete from imports` → 0; as owner `cb65b96f-…` (only account with data locally), delete own import → 1, owner-visible transactions 0; `import_ing_statement` with same account/range and the 206 original rows → non-null id, 206 transactions. After rollback: 1 import / 206 transactions.
- Consequence for the endpoint: an RLS-filtered delete of a foreign or non-existent id is **0 rows, no error**. To tell "deleted" from "not found", the call needs `.select("id")` (returning; `imports: authenticated select own` exists) or `{ count: "exact" }`.

### 3. Tests to extend

- `supabase/tests/database/domain_rls.test.sql` — `plan(28)`; users A/B inserted into `auth.users` directly; role switch `set local role authenticated` + `set_config('request.jwt.claims', '{"sub":…,"role":"authenticated"}', true)`; delete-related: „B deletes no transactions of A”, „B deletes no imports of A” (`with d as (delete … returning 1)`), and the FR-019 block (`delete_own_account()` removes A's imports/transactions, B's survive).
- `supabase/tests/database/import_rpc.test.sql` — `plan(16)`; calls `public.import_ing_statement(...)` positionally with a snake_case jsonb array; covers success, overlap 23P01, 22023 validation, missing `sub`, B isolation, anon 42501.
- **Missing**: owner deletes own import → its transactions gone, other imports/B untouched → same range + same `bank_tx_id`s re-insertable. Natural home: `import_rpc.test.sql` (already has the RPC fixture) or a new `supabase/tests/database/import_delete.test.sql`. pgTAP total 44 = 28 + 16 (inherited from baseline; not re-run here).
- `scripts/smoke.mjs` — dependency-free; `jar` cookie Map; `request(path, {method, form})` with `redirect: "manual"`, urlencoded body only, `Origin` header; `steps` = array of `[name, run, expected]` with `{status, location? (startsWith), contains? (body.includes on 200)}`. Import payload = `importPayload` constant (account `…0099` „Konto smoke”, 2026-05-01..05-31, „Sklep smoke” 1299 + „Kawiarnia smoke” 4550); `importResultPath` captured from the first import's `Location`. Import/patterns steps: „import is saved and shows its result”, „import result renders the debit count”, „patterns lists imported merchants” (contains „Kawiarnia smoke”), „patterns proposes a type”, „import of an overlapping range is rejected”, „import with an invalid payload is rejected”, later „import without a session goes to login” and „patterns renders empty view” (seeded user, contains „Wgraj pierwszy wyciąg”). 48 step entries.
- Slot: directly after „import with an invalid payload is rejected” — the smoke user still has exactly one import. The import id is available only via `importResultPath` (`?id=`) — parse it for the delete form. Assertions after delete: `/patterns` 200 contains „Wzorce pojawią się po pierwszym imporcie.” (page-specific empty title; „Wgraj pierwszy wyciąg” is shared with other empty views) and must **not** contain „Kawiarnia smoke” — the `steps` runner has no `notContains`, so a small extension of the expectation shape is required; then re-post `importPayload` → 302 `/imports/result?id=`, `/patterns` contains „Kawiarnia smoke”. A cross-user negative (delete someone else's id) is better in pgTAP; smoke can assert an invalid id is rejected.
- `test/unit/`: `format.test.ts`, `ing-parser.test.ts`, `patterns.test.ts`, `schema.test.ts`; `npm test` → 72 passed (observed).

### 4. `/patterns` derivation and other readers

- `src/lib/patterns/load.ts` `loadPatterns` → `collectPages` pages `.from("transactions").select("id, amount_minor, counterparty, title", { count: "exact" }).order("id").range(...)` (`PAGE_SIZE` 1000, no filter, RLS scopes rows) and passes rows to `derivePatterns`. An empty page before `total` ⇒ `Error("patterns read ended short of count")` → error state, never a partial list. Nothing materialised ⇒ a cascade-deleted transaction cannot reappear.
- `src/pages/patterns.astro` — states: error (`InlineAlert` + `copy.components.error`), empty (`items.length === 0`: title „Wzorce pojawią się po pierwszym imporcie.”, `ViewEmpty` „Wgraj pierwszy wyciąg” → `/imports/new`), list (`PatternsTable`).
- Other readers of `imports`/`transactions` in `src/` (grep for `.from("imports")`, `.from("transactions")`, `transactions(count)`, rpc names): `src/pages/imports/index.astro`, `src/pages/imports/result.astro`, `src/pages/imports/new.astro` (overlap pre-check read), `src/pages/api/imports.ts`, `src/lib/patterns/load.ts`; `src/pages/api/auth/delete.ts` touches them only through `delete_own_account`. Only `collectPages` pages `transactions` — the concurrency note in handoff holds for this inspected set.

### 5. Design kit, shared components, copy

Kit (`design/rytm-os/prototype/`, read-only):
- `app.js` `imports()` — empty `<th></th>`, row cell `<button class="text-button danger" onclick="openModal('deleteImport')">Usuń import</button>`.
- `app.js` `modal('deleteImport')` — `.modal-backdrop#modal[role=dialog][aria-modal=true] > .modal`; `.modal-close` `aria-label="Zamknij"`; `.eyebrow` „Cofnij import”; `h2` „Usunąć import z maja?”; `p` „Wzorce wykryte w tym imporcie zostaną przeliczone. Tę decyzję można cofnąć przez ponowny import.”; single `.btn.btn-danger` „Usuń import” → `closeModal(); showToast('Import usunięty w prototypie.','success')`. No cancel button, no Esc/focus handling in the prototype.
- `app.js` `toast(kind)` — `.toast.<kind>[role=status]` + icon + span + close `aria-label="Zamknij"`; `showToast` removes it after 3400 ms. `styles.css`: `.toast` fixed bottom-right on `--ink`; `.text-button.danger` / `.btn-danger` use `--amber-dark` = `--rytm-excess-text` (→ Tailwind `excess-text`); `.modal` 480px, `--paper`, radius 13px, padding 31px.
- `react-kit/docs/content.json` — no key containing „Cofnij”, „usunięty”, „Zamknij”, toast/dialog delete copy; nearest hits are `threshold.remove` „Usuń próg” and `settings.deleteTitle` „Usuń konto”.

Repo components:
- `src/components/ui/` contains `button.tsx` and `dialog.tsx` only. `buttonVariants` variant `danger` = `bg-excess-text text-paper …` (matches `.btn-danger`). `DialogContent` requires `closeLabel` (sr-only).
- `src/components/settings/DeleteAccountDialog.tsx` — `Dialog`/`DialogTrigger` (`Button variant="danger"`), `DialogContent`, `DialogTitle`, `DialogDescription`, eyebrow div `text-excess-text`; native `<form method="POST" action="/api/auth/delete">`; reopens when `serverError` is set; `ServerError` inside the form; `SubmitButton variant="danger" showArrow={false}`. `SubmitButton` pending = `useFormStatus().pending || pending` prop — with a native POST `useFormStatus` stays false, so pending text shows only if the caller passes `pending`.
- `src/components/app/InlineAlert.astro` (`kind: success|error|info`; `role=alert` for error), `src/components/auth/ServerError`.
- **No Toast/Sonner/AlertDialog** anywhere in `src/components` (inspected: `src/components/**`).
- `src/content/copy.ts` `copyExtra.imports` — no delete keys; precedent for verbatim dialog copy: `copyExtra.settings.deleteDialogEyebrow/Title/Body`, `close` „Zamknij”, `deleteError`, `deleting`. DESIGN-GAP comment format: `// DESIGN-GAP: K16 — …` (TS), `{/* DESIGN-GAP: G24 — … */}` (JSX).
- `context/foundation/design-kit.md`: highest K = **K18**, highest G = **G29**; G9 („Ekran „Importy CSV” + cofnięcie importu”) status `delivered · /imports`.

Copy/UI missing from the kit → DESIGN-GAP (plan decides wording/placeholder, never invents product copy beyond the kit):
1. **K-row (K11-type)**: „Usuń import”, „Cofnij import”, dialog body, „Zamknij” exist only in `app.js` → `copyExtra.imports` verbatim.
2. **Dialog title month** „Usunąć import z maja?” — hardcoded month; needs a real-range placeholder (precedent K16 `overlapPrefix` + `formatRangeLong`).
3. **Success toast text** „Import usunięty w prototypie.” — the words „w prototypie” are prototype-only; the shippable text is not in the kit. New finding, not in `change.md`'s expected gaps.
4. **No delete-failure copy** and no pending state for the dialog button (precedents K18 / G24 / `copyExtra.settings.deleteError`, `deleting`).
5. **No toast component** in the repo; kit toast is client-side and timed while the delete is a redirect-based form POST.

## Code References

- `src/pages/api/imports.ts` `POST` — auth guard, formData+zod, redirect-with-error, logging pattern
- `src/pages/api/auth/delete.ts` `POST` — destructive form POST precedent
- `src/pages/imports/index.astro` — list; rows carry `id`; 4 columns
- `src/pages/imports/result.astro` — `z.uuid()` id parsing, redirect to `/imports` when missing
- `src/pages/settings.astro`, `src/pages/login.astro` `deleted` — status via query params + `InlineAlert`
- `src/middleware.ts` `PROTECTED_ROUTES`
- `supabase/migrations/20260923165530_domain_imports_transactions.sql` — policies `imports: authenticated delete own`, `imports_no_overlap`
- `supabase/migrations/20260924122144_transactions_import_account_fk.sql` — `transactions_import_account_fkey … on delete cascade`
- `supabase/migrations/20260924224014_import_ing_statement.sql` — `import_ing_statement`
- `supabase/tests/database/domain_rls.test.sql`, `import_rpc.test.sql`
- `scripts/smoke.mjs` — `request`, `steps`, `importPayload`, `importResultPath`
- `src/lib/patterns/load.ts` `loadPatterns`, `collectPages`; `src/pages/patterns.astro`
- `design/rytm-os/prototype/app.js` `imports()`, `modal('deleteImport')`, `toast`, `showToast`
- `src/components/ui/dialog.tsx` `DialogContent`; `src/components/ui/button.tsx` `buttonVariants`; `src/components/settings/DeleteAccountDialog.tsx`; `src/components/auth/SubmitButton`; `src/components/app/InlineAlert.astro`
- `src/content/copy.ts` `copyExtra.imports`, `copyExtra.settings`
- `src/lib/format.ts` `formatRangeLong`, `formatRangeShort`

## Architecture Insights

- The DB already enforces everything S-02 needs; the change is app-side: one endpoint, one column + dialog, one status display, and proofs (pgTAP + smoke).
- Endpoint options (for `/10x-plan`): (a) new `src/pages/api/imports/delete.ts` `POST` with form field `id` (zod `z.uuid()`), coexisting with `src/pages/api/imports.ts` — recommended: matches form-based dialog, smoke's urlencoded `request`, and the CLAUDE.md rule „uppercase GET/POST”; (b) `DELETE` export in `api/imports.ts` — rejected: unreachable from a native `<form>`, needs fetch + client redirect, smoke has no JSON/DELETE path. RPC `delete_import` — not needed: one RLS delete is atomic with the cascade; the range for a success message can be read with `.select("period_start, period_end")` on the same delete (returning).
- Result feedback options: (a) redirect `/imports?deleted=1` (+ optional range params) → `InlineAlert kind="success"` above the list, `?error=delete` → `InlineAlert kind="error"` — matches `settings.astro`/`login.astro` and needs no new component; (b) new shared Toast mirroring kit `.toast` — adds a component and client state to a server-redirect flow. (a) is the cheaper, precedent-backed choice; either needs a DESIGN-GAP row (kit shows a toast).
- Dialog: a `DeleteImportDialog` island modelled on `DeleteAccountDialog` (one per row, or one shared dialog fed the row's id/range). The kit dialog has no confirmation input and a single danger button.

## Historical Context (from prior changes)

- `context/archive/2026-09-24-ing-csv-import/` (S-01) — shipped the list, endpoint and `import_ing_statement` (supported: files observed above).
- `context/archive/2026-09-23-domain-schema-rls/` — created policies/cascades (supported by live DB).
- `context/archive/2026-09-21-settings-account/` — `DeleteAccountDialog` + `/api/auth/delete` precedent (supported).
- `context/archive/2026-09-25-merchant-patterns/` (S-03) — patterns derived on read, no migration (supported: `load.ts`, migration list unchanged).
- `change.md` claims re-scored: „No migration expected” — supported; „pgTAP has only cross-account delete check” — supported (plus FR-019 account cascade); expected gap 3 dropped — supported; expected gaps 1/2/4/5 — supported, plus new gap on toast text „w prototypie”.

## Related Research

Not applicable — no earlier `research.md` for this change.

## Open Questions

- Success-feedback surface (InlineAlert vs new Toast) and dialog title placeholder wording — plan decision, each with a DESIGN-GAP row.
- Whether the success message names the deleted range (needs returning `period_start, period_end` from the delete) — plan decision.
- Smoke runner needs a negative-contains expectation (`notContains` or equivalent) — plan decides the shape.

## Autonomous decisions

1. **Research question derived from `change.md`** (roadmap claims + open proofs + the orchestrator's coverage list) instead of asking. Rejected: waiting for a human (contract forbids). What would change it: an interactive run narrowing scope.
2. **Probed the live DB inside `BEGIN … ROLLBACK`** as `authenticated` (owner + stranger) instead of reading catalogs only. Rejected: running `supabase db reset`/`test db` (would wipe the maintainer's local data; not needed to answer). Why: catalog shows policy+FK, only a probe shows the re-import works. What would change it: the orchestrator wanting a clean-DB pgTAP run in research.
3. **Recommended (not decided) POST form endpoint + InlineAlert feedback**; left the final choice to `/10x-plan`. Why: research does not approve design. What would change it: a shared Toast landing on `main` first.
4. **Registered toast text „Import usunięty w prototypie.” as a new gap** rather than using it verbatim. Why: „w prototypie” is prototype narration, not product copy. What would change it: the kit author confirming the string is intended.
5. **Two Explore workers** (kit/components; smoke/pgTAP/patterns) + local work on endpoint/migrations/DB. Decisive strings/variants re-checked locally by grep.
