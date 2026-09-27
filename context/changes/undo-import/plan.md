# Cofnięcie błędnego importu (S-02 `undo-import`) Implementation Plan

## Overview

Let a signed-in user delete one of their own imports from `/imports` — the kit's fifth, unlabelled column
„Usuń import” opens the kit `deleteImport` dialog, a form POST deletes the import under RLS, the database cascade
removes its transactions, and the user lands back on `/imports` with a result line. Patterns on `/patterns` are
derived on read, so they drop the deleted transactions with no extra code; re-importing the same range is accepted
because the overlap exclusion and the `bank_tx_id` unique key only see live rows. The slice adds **no migration**;
its weight is in the proofs (pgTAP, smoke, unit) and in the kit binding.

## Current State Analysis

Source: `context/changes/undo-import/research.md` (live-DB probe + code reading), re-checked here by reading the files.

- **Database already does the work.** `imports: authenticated delete own` policy and
  `transactions_import_account_fkey … on delete cascade` exist in migrations and in the live local DB; an RLS
  delete of a foreign or missing id returns **0 rows and no error** (probe in research §2). No pgTAP test deletes a
  user's *own* import (only „B deletes no imports of A” and the account-deletion cascade in
  `supabase/tests/database/domain_rls.test.sql`).
- **No delete endpoint.** `src/pages/api/imports.ts` exports only `POST` (save). The destructive-POST precedent is
  `src/pages/api/auth/delete.ts` `POST` (formData + zod + `getUser()` guard + redirect-with-status + `console.error`).
  `/api/*` is not in `src/middleware.ts` `PROTECTED_ROUTES`; endpoints guard themselves.
- **List page is read-only.** `src/pages/imports/index.astro` renders error / empty / table (4 columns); `rows`
  already carry `id`; its header comment says the „Usuń import” column arrives with S-02. No query-param handling.
- **Shared UI exists, one piece missing.** `src/components/ui/dialog.tsx` (shadcn new-york on kit tokens) +
  `src/components/settings/DeleteAccountDialog.tsx` are the full dialog precedent; `SubmitButton` shows its pending
  text only when the caller passes `pending` (native POST never sets `useFormStatus`). `InlineAlert.astro` covers
  success/error lines. `buttonVariants` has no variant for the kit's `.text-button.danger` (transparent, 12 px,
  weight 800, `--amber-dark` = `excess-text`, padding 5 px 0). No Toast component anywhere in `src/components`.
- **Kit binding.** `prototype/app.js` `imports()` (5th column button), `modal('deleteImport')` (eyebrow „Cofnij
  import”, h2 „Usunąć import z maja?”, body „Wzorce wykryte w tym imporcie zostaną przeliczone. Tę decyzję można
  cofnąć przez ponowny import.”, one `.btn.btn-danger` „Usuń import”, close `aria-label="Zamknij"`, no cancel),
  `showToast('Import usunięty w prototypie.','success')`. `content.json` has **none** of these strings;
  `copyExtra.imports` has no delete keys.
- **Proof harnesses.** `scripts/smoke.mjs` `steps` runner supports `status` / `location` (prefix) / `contains`
  only — no negative match; `importResultPath` holds the smoke import's `/imports/result?id=<uuid>`. The slot is
  after step „import with an invalid payload is rejected” (smoke user owns exactly one import there).
  `supabase/tests/database/import_rpc.test.sql` shows the RPC-fixture style (users A/B inserted into `auth.users`,
  role switch via `set local role authenticated` + `request.jwt.claims`).
- **Readers of deleted rows.** Only `src/lib/patterns/load.ts` `collectPages` pages `transactions`; a delete during
  its read ends in the error state („patterns read ended short of count”), never a partial list.
  `src/pages/imports/result.astro` redirects to `/imports` for an id it cannot read.

## Desired End State

- `/imports` table has a fifth, unlabelled column; each row's text button „Usuń import” opens a dialog whose title
  names that import's range („Usunąć import 1 – 31 maja 2026?”), with the kit eyebrow, body and one danger button.
- Confirming POSTs `id` to `/api/imports/delete`; the import and its transactions are gone; the browser lands on
  `/imports?deleted=1` with a success line above the list (or above the empty view if it was the last import).
- A malformed, missing or foreign id lands on `/imports?error=missing` (nothing deleted, error line); a database
  failure lands on `/imports?error=delete`; no session → `/login`.
- `/patterns` no longer lists the deleted import's merchants; importing the same file again is accepted and the
  merchants come back.
- Verified by: pgTAP +10 (own delete cascades, others untouched, same range + same `bank_tx_id`s re-importable,
  foreign/missing id deletes nothing, anon denied); smoke +12; vitest +1 file; screenshots of every named state.

### Key Discoveries:

- RLS turns a foreign id into a silent 0-row delete — the endpoint must ask for the deleted rows back
  (`.delete().eq("id", id).select("id")`) and branch on the count (research §2, live probe).
- `src/pages/api/auth/delete.ts` `POST` — the pattern to copy for guard, parsing, logging and redirect.
- `src/pages/settings.astro` / `src/pages/login.astro` `deleted` — query-param status → `InlineAlert` precedent.
- `src/components/settings/DeleteAccountDialog.tsx` — dialog + native form + `SubmitButton variant="danger"
  showArrow={false}` precedent; the new dialog passes `pending` itself.
- `scripts/smoke.mjs` runner has no negative match — `notContains` must be added before the patterns-gone proof
  can be expressed.

## What We're NOT Doing

- No migration, no `delete_import` RPC — one RLS-scoped delete is atomic with the cascade.
- No `DELETE` HTTP verb — unreachable from a native form and from the smoke runner.
- No Toast component — result feedback reuses `InlineAlert` (gap row G30).
- No change to `/patterns`, `/imports/result`, `/imports/new` or the list's four existing columns.
- No keyset paging in `collectPages` (S-03 follow-up F2 names S-02 as its trigger): the current loop already turns
  a mid-read delete into the error state, never wrong numbers; left in
  `context/archive/2026-09-25-merchant-patterns/follow-ups/review-fixes.md`.
- No reopening of the dialog on error (unlike `/settings`): the page does not know which row failed; the error line
  sits above the list.
- No bulk delete, no undo-of-delete (the kit body says re-import is the way back).
- No new copy beyond the gap-registered placeholders listed in Phase 2.

## Implementation Approach

Two phases, server first. Phase 1 lands the endpoint with its decision logic in a small pure helper, proves the
database behaviour in pgTAP and the HTTP behaviour in smoke (delete → patterns gone → re-import accepted), without
any UI. Phase 2 binds the kit: shared text-button variant, `DeleteImportDialog` island per row, status lines on
`/imports`, copy + DESIGN-GAP rows, and the smoke steps that read the new status line. Each phase ends on the full
local gate measured against the post-S-03 baseline (`4425f8c`): lint 0 · astro check 0 errors (89 files) ·
vitest 72/72 (4 files) · fixture:check OK · build OK · pgTAP 44 · smoke 48 PASS.

## Critical Implementation Details

- **Distinguishing "deleted" from "not found"**: an RLS-filtered delete never errors. The endpoint must request the
  deleted row back with `.select("id")` on the delete and treat an empty array as `missing`. A plain
  `{ error }`-only check would report success for someone else's id — the Phase 1 deliberate break targets exactly
  this.
- **Smoke ordering**: the delete steps run while the smoke user owns exactly one import; the re-import step must
  run before any later step that assumes an import exists, and must update `importResultPath`. The seeded user
  (`test@rytm.local`) is never touched — the later „patterns renders empty view” step relies on it having no data.
- **Negative match**: the patterns-gone step asserts both the empty title (`contains`) and the absence of
  „Kawiarnia smoke” (`notContains`). The absence alone would also pass on the `/patterns` error state; the empty
  title alone would not show that the merchant row is gone for the right reason.

## Phase 1: Delete endpoint and its proofs

### Overview

Server-side deletion of one own import by id, with not-found handling, proven at DB, HTTP and unit level.

### Changes Required:

#### 1. Delete outcome helper

**File**: `src/lib/import/delete.ts` (new)

**Intent**: Keep the endpoint's branching (parse id → delete result → redirect target) pure and unit-testable, so
the 0-rows-means-missing rule is proven without a server.

**Contract**: `deleteImportSchema = z.object({ id: z.uuid() })`;
`deleteImportRedirect(result: { data: { id: string }[] | null; error: { code?: string; message: string } | null }):
"/imports?deleted=1" | "/imports?error=missing" | "/imports?error=delete"` — error → `delete`; `data` empty or null
→ `missing`; otherwise `deleted=1`. Exported constants for the three targets.

#### 2. Endpoint

**File**: `src/pages/api/imports/delete.ts` (new; coexists with `src/pages/api/imports.ts` → route `/api/imports/delete`)

**Intent**: Form POST that deletes one import of the caller under RLS; the cascade removes its transactions.

**Contract**: `export const prerender = false`; `POST` only. Guard exactly as `src/pages/api/auth/delete.ts`
(`createClient` null or no `getUser()` user → `/login`). `Object.fromEntries(await context.request.formData())`
inside try/catch (non-form body → invalid); `deleteImportSchema.safeParse` failure → `/imports?error=missing`.
`supabase.from("imports").delete().eq("id", id).select("id")`; on `error` log with the existing
`// eslint-disable-next-line no-console` + `console.error("imports delete failed", error.code, error.message)`;
redirect to `deleteImportRedirect(result)`.

#### 3. Unit test

**File**: `test/unit/import-delete.test.ts` (new)

**Intent**: Pin the schema and the three outcomes.

**Contract**: schema accepts a v4 uuid, rejects `"not-a-uuid"`, `""`, missing `id`; redirect: error → `delete`
(even with rows), `[]` → `missing`, `null` → `missing`, one row → `deleted=1`.

#### 4. pgTAP proof

**File**: `supabase/tests/database/import_delete.test.sql` (new)

**Intent**: Prove the owner path the app uses (role `authenticated`, RLS on): own delete cascades, nothing else is
touched, the freed range and `bank_tx_id`s are re-importable, foreign/missing ids delete nothing, anon is denied.

**Contract**: `begin; … select plan(10); … rollback;` in the `import_rpc.test.sql` style (users A/B with fixed UUIDs,
imports created through `public.import_ing_statement`). A owns import A1 (account X, 2026-05-01..05-31, two rows
with `bank_tx_id`s) and A2 (account Y); B owns B1. Assertions:
1. A deletes A1 → exactly 1 row returned (`with d as (delete … returning 1) select count(*) from d`).
2. A sees 0 transactions with `import_id` = A1.
3. A2 and its transactions are unchanged.
4. A re-imports account X, same range, same `bank_tx_id`s → `lives_ok` (would be 23P01 / 23505 while A1 lived).
5. The re-import holds the same number of transactions.
6. B deletes A2 by id → 0 rows.
7. As A, A2 still exists.
8. B deletes a random, non-existent uuid → 0 rows, no error.
9. B1 and its transactions still exist (as B).
10. `anon` deleting from `imports` → `throws_ok` `42501`.

#### 5. Smoke — runner and delete path

**File**: `scripts/smoke.mjs`

**Intent**: Prove the whole HTTP path against the real server + DB: not-found, delete, patterns gone, result URL
gone, re-import accepted, patterns back, anonymous rejected.

**Contract**: expectation shape gains optional `notContains` (a 200 body must **not** include it); the failure log
prints it. Header comment's scope line mentions delete. New steps directly after „import with an invalid payload is
rejected”, in this order:
1. „import delete of an unknown id is not found” — POST `/api/imports/delete` `{ id: "00000000-0000-4000-8000-000000000000" }` → 302 `/imports?error=missing`.
2. „import delete of a malformed id is not found” — `{ id: "not-a-uuid" }` → 302 `/imports?error=missing`.
3. „import is deleted” — `{ id: <uuid parsed from importResultPath> }` → 302 `/imports?deleted=1`.
4. „patterns drop the deleted import” — GET `/patterns` → 200, contains „Wzorce pojawią się po pierwszym imporcie.”, notContains „Kawiarnia smoke”.
5. „deleted import result goes back to the list” — GET `importResultPath` → 302 `/imports`.
6. „same range is imported again after delete” — POST `/api/imports` `importPayload` → 302 `/imports/result?id=` (updates `importResultPath`).
7. „patterns list the re-imported merchant” — GET `/patterns` → 200 contains „Kawiarnia smoke”.
8. next to „import without a session goes to login”: „import delete without a session goes to login” — anonymous POST → 302 `/login`.

### Success Criteria:

#### Automated Verification:

- `npm test` — baseline 72/72 (4 files) + 1 file, all new cases green, delta 0 failures
- `npm run lint` 0 errors (baseline 0, delta 0); `npx astro check` 0 errors (baseline 0 / 89 files, delta +2 files)
- `npm run fixture:check` OK and `npm run build` passes
- `npx supabase db reset && npx supabase test db` — pgTAP baseline 44 + 10 = 54, all pass
- `BASE_URL=http://localhost:4398 npm run smoke` — baseline 48 + 8 = 56 PASS
- Deliberate break (endpoint): drop `.select("id")` and redirect `deleted=1` whenever `error` is null → smoke step „import delete of an unknown id is not found” FAILs and the unit `[] → missing` case FAILs; restored → green. Meta-check: RLS still refused the foreign row, so the red proves the app branch, not RLS
- Deliberate break (cascade, uncommitted scratch edit of the pgTAP file): before assertion 1, as `postgres`, replace `transactions_import_account_fkey` with `on delete restrict` → assertion 1 throws / 2 FAILs; restored → green. Meta-check: proves the test observes the cascade itself, not an RLS filter hiding rows
- Deliberate break (smoke runner): temporarily make step 4 `notContains` „Wzorce” → FAIL; restored → PASS. Meta-check: proves `notContains` is evaluated, so the real patterns-gone assertion can fail
- `git diff --stat main -- supabase/migrations` is empty (no migration)

#### Manual Verification:

- [reviewer] `src/pages/api/imports/delete.ts` guard/parse/log mirror `src/pages/api/auth/delete.ts`; no path deletes without the returning select
- [reviewer] pgTAP assertion 6/8 (foreign/missing id) are read as RLS proofs and assertion 1–5 as the owner cascade proof; the handoff records which break proved which

**Implementation Note**: Implement proceeds to Phase 2 on green automated criteria; `[reviewer]` rows are closed by
`/10x-impl-review`.

---

## Phase 2: `/imports` delete action bound to the kit

### Overview

The fifth column, the dialog, the result lines, the copy and the gap register — one view (`/imports`) plus one
shared button variant.

### Changes Required:

#### 1. Shared text-button variant

**File**: `src/components/ui/button.tsx`

**Intent**: Kit `.text-button` / `.text-button.danger` as a shared variant (missing-shared-component charge; S-04's
„Usuń próg” will reuse it).

**Contract**: `variant` gains `text: "bg-transparent text-ink font-extrabold text-xs"` and
`"text-danger": "bg-transparent text-excess-text font-extrabold text-xs"`; `size` gains
`inline: "px-0 py-[5px] rounded-sm"`. Base focus ring unchanged (keyboard focus visible). Colors only via Tailwind
names. Existing variants untouched.

#### 2. Dialog island

**File**: `src/components/imports/DeleteImportDialog.tsx` (new)

**Intent**: Kit `modal('deleteImport')` for one row, modelled on `DeleteAccountDialog`.

**Contract**: props `{ id: string; range: string; describedBy: string; labels: { action; eyebrow; title; body;
pending; close } }`. Trigger: `Button variant="text-danger" size="inline"` with `labels.action` and
`aria-describedby={describedBy}` (the row's range cell id — distinguishes rows for screen readers without new
copy). `DialogContent closeLabel={labels.close}`: eyebrow div (`text-excess-text` as in `DeleteAccountDialog`),
`DialogTitle` = `labels.title.replace("{range}", range)`, `DialogDescription` = `labels.body`,
`<form method="POST" action="/api/imports/delete">` with hidden `id`, `onSubmit` sets local `pending`,
`SubmitButton variant="danger" size="default" showArrow={false} pendingText={labels.pending} pending={pending}` =
`labels.action`. No cancel button (kit has none; close X, Esc, overlay close).

#### 3. Page

**File**: `src/pages/imports/index.astro`

**Intent**: Add the fifth column and the post-delete status lines; keep the three existing states.

**Contract**: header comment updated (column delivered by S-02). Read `deleted` (`searchParams.has("deleted")`) and
`error` (`"missing" | "delete"`) from `Astro.url`. A status block (`InlineAlert kind="success"` `x.deleted`, or
`kind="error"` `x.deleteMissing` / `x.deleteError`, `DESIGN-GAP: G30` comment) renders directly under `PageTitle`
in **all three** states (after the last delete the empty state shows it). Table: fifth `<th>` empty (kit), row cell
with `DeleteImportDialog client:load` (right-aligned, `whitespace-nowrap`); the range `<td>` gets
`id={`import-range-${r.id}`}`. `rows` also carry `rangeLong` (`formatRangeLong`) for the dialog title.

#### 4. Copy and design-kit register

**Files**: `src/content/copy.ts`, `context/foundation/design-kit.md`

**Intent**: Every string via `copyExtra.imports`; every kit gap registered.

**Contract**: `copyExtra.imports` gains:
- under `// DESIGN-GAP: K19` — verbatim from `prototype/app.js` `imports()` / `modal('deleteImport')`:
  `deleteAction: "Usuń import"`, `deleteDialogEyebrow: "Cofnij import"`,
  `deleteDialogBody: "Wzorce wykryte w tym imporcie zostaną przeliczone. Tę decyzję można cofnąć przez ponowny import."`,
  `close: "Zamknij"`; and `deleteDialogTitle: "Usunąć import {range}?"` (kit h2 „Usunąć import z maja?” has the
  month baked in; `{range}` = `formatRangeLong`, K16 precedent).
- under `// DESIGN-GAP: K20` — `deleted: "Import usunięty."` (kit toast „Import usunięty w prototypie.” minus the
  prototype narration).
- under `// DESIGN-GAP: G30` — `deleting: "Usuwanie…"` (same placeholder as `copyExtra.settings.deleting`, G24),
  `deleteError: "Nie udało się usunąć importu. Spróbuj ponownie."` (pattern of `copyExtra.settings.deleteError`),
  `deleteMissing: "Nie znaleziono tego importu — mógł zostać już usunięty."`.

`design-kit.md`: **K19** (delete action + dialog copy only in `app.js`; h2 hardcoded month; placeholder `{range}`;
author adds keys to `content.json` with a range placeholder), **K20** (toast text is prototype narration; placeholder
„Import usunięty.”; author delivers the shippable line), **G30** (result states of import deletion: toast has no
repo counterpart and the flow is a server redirect → `InlineAlert` above the list; no copy for failure, not-found or
pending; author delivers toast-or-inline decision + copy); K11 row notes the new `copyExtra.imports` keys; G9 status
note „S-02: kolumna usuwania + modal”; all three appended to „Do rundy 3”.

#### 5. Smoke — status lines

**File**: `scripts/smoke.mjs`

**Intent**: Prove the page renders the result of a delete and the empty state after the last delete.

**Contract**: after step „import delete of a malformed id is not found”: „imports shows the not-found line” — GET
`/imports?error=missing` → 200 contains „Nie znaleziono tego importu”. After „import is deleted”: „imports shows the
deletion above the empty list” — GET `/imports?deleted=1` → 200 contains „Import usunięty.”; „imports is empty after
the last delete” — GET `/imports` → 200 contains „Nie masz jeszcze żadnego importu.”, notContains „Konto smoke”.
Before the re-import: none. After „patterns list the re-imported merchant”: „imports lists the delete action” — GET
`/imports` → 200 contains „Usuń import”.

### Success Criteria:

#### Automated Verification:

- `npm run lint` 0 errors; `npx astro check` 0 errors (Phase 1 files + 1, delta 0 errors)
- `npm test` green (Phase 1 count, delta 0)
- `npm run fixture:check` OK; `npm run build` passes
- `npx supabase db reset && npx supabase test db` — 54, delta 0 from Phase 1
- `BASE_URL=http://localhost:4398 npm run smoke` — Phase 1 (56) + 4 = 60 PASS
- Deliberate break: remove the status block from `imports/index.astro` → „imports shows the deletion above the empty list” and „imports shows the not-found line” FAIL; restored → PASS. Meta-check: the strings appear only in that block (grep the rendered body: not in island props, since the page passes no status copy to `DeleteImportDialog`)
- `grep -rnE "#[0-9a-fA-F]{3,6}\b|\[#" src/components/imports/DeleteImportDialog.tsx src/components/ui/button.tsx src/pages/imports/index.astro` finds no raw colors
- `grep -n "DESIGN-GAP: K19\|DESIGN-GAP: K20\|DESIGN-GAP: G30" src/content/copy.ts src/pages/imports/index.astro` finds each id, and `design-kit.md` has rows K19, K20, G30

#### Manual Verification:

- [visual] Screenshots, desktop 1440 px and mobile ~400 px, on `astro dev --port 4399` with a freshly registered local account holding two imports of the main fixture account split by range (never the seeded `test@rytm.local`): `default` (list with the fifth column), `dialog-open` (title with the real range), `success` (`?deleted=1`, one import left), `error` (`?error=delete`), `not-found` (`?error=missing`), `empty-after-last-delete` (`?deleted=1` with no imports), `trigger-focus` (keyboard focus on „Usuń import”); pending „Usuwanie…” is code-reviewed only (native POST, too short to capture)
- [visual] At ~400 px the dialog does not touch the screen edges worse than the G24 measurement and the table scrolls inside its panel with the fifth column reachable
- [reviewer] `copyExtra.imports` K19 strings match `prototype/app.js` byte for byte; placeholders are only the ones listed under K20/G30

**Implementation Note**: the Visual step performs the `[visual]` rows; Implement proceeds on green automated
criteria.

---

## Testing Strategy

### Unit Tests:

- `test/unit/import-delete.test.ts`: uuid schema; redirect outcomes (error, empty, null, one row).

### Integration Tests:

- pgTAP `import_delete.test.sql` (10): owner cascade, isolation of other imports and users, re-import of the same
  range + `bank_tx_id`s, foreign/missing id → 0 rows, anon 42501.
- Smoke (+12 over both phases): not-found (unknown, malformed), delete, patterns gone, deleted result URL → list,
  re-import accepted, patterns back, anonymous → login, status lines and empty list on `/imports`, action rendered.

### Manual Testing Steps:

1. `npx supabase start`; `ASTRO_DEV_BACKGROUND=1 npx astro dev --port 4399 --ignore-lock`.
2. Register a fresh local account; import the fixture's main account twice with two non-overlapping ranges.
3. Open `/imports`, press „Usuń import” on one row with the keyboard, confirm; see „Import usunięty.” and one row.
4. `/patterns` no longer counts the deleted range; re-import it — accepted.
5. Delete the last import → empty view with the success line. Kill the server (`lsof -ti :4399 | xargs kill`).

## Performance Considerations

One indexed delete by primary key; the cascade touches at most 5000 transactions (import cap). No caching.

## Migration Notes

None. The hosted DB already has the policy and cascade (same migrations as local) — no `db push` needed for this
slice. Invariant carried to S-04/S-05: persisted pattern decisions/thresholds key on `merchantKey` + `user_id`,
never `import_id`, so an import delete never orphans or cascades them.

## References

- Research: `context/changes/undo-import/research.md`
- Change identity and kit binding: `context/changes/undo-import/change.md`
- Endpoint precedent: `src/pages/api/auth/delete.ts` `POST`, `src/pages/api/imports.ts` `POST`
- Dialog precedent: `src/components/settings/DeleteAccountDialog.tsx`, `src/components/ui/dialog.tsx`
- Status precedent: `src/pages/settings.astro`, `src/pages/login.astro`
- Kit: `design/rytm-os/prototype/app.js` (`imports`, `modal`, `showToast`), `design/rytm-os/prototype/styles.css` (`.text-button`, `.btn-danger`, `.modal`)
- pgTAP style: `supabase/tests/database/import_rpc.test.sql`; smoke: `scripts/smoke.mjs` `steps`

## Autonomous decisions

1. **Endpoint = `POST /api/imports/delete` with form field `id`**. Rejected: `DELETE` verb on `/api/imports` (native
   form cannot send it; smoke runner is urlencoded POST only), a `delete_import` RPC (one RLS delete is already atomic
   with the cascade). Why: matches the dialog's native form and the `auth/delete` precedent. What would change it: a
   fetch-based client pattern landing in the repo, or needing a multi-statement delete.
2. **Not-found = returning select, one code for malformed / missing / foreign id** (`?error=missing`). Rejected:
   treating 0 rows as success (would confirm a delete that never happened), separate codes for malformed vs foreign
   (leaks nothing useful; foreign must look like missing). What would change it: a need to audit tampering attempts.
3. **Feedback = redirect + `InlineAlert` above the list**, not a new Toast. Why: server-redirect flow, precedent in
   `/settings` and `/login`, no new component or client state. Gap G30 registers the deviation from the kit toast.
   What would change it: a shared Toast landing on `main`, or the kit author choosing the toast for server results.
4. **Dialog title placeholder `„Usunąć import {range}?”` with `formatRangeLong`** (e.g. „Usunąć import 1 – 31 maja
   2026?”). Rejected: keeping „z maja” (false for most imports), adding the account (not in the kit h2; the account is
   in the row). Gap K19. What would change it: the kit author delivering a title key with a placeholder.
5. **Success line „Import usunięty.”** = kit toast minus „w prototypie”, no range. Rejected: using the toast verbatim
   (prototype narration), naming the range (would need range params in the redirect URL; not in the kit). Gap K20.
   What would change it: the author's shippable toast text.
6. **Error / not-found / pending copy are placeholders** following the `/settings` G24 pattern („Nie udało się …
   Spróbuj ponownie.”, „Usuwanie…”), registered as G30. What would change it: author copy in round 3.
7. **Shared `text` / `text-danger` button variants + `inline` size** in `buttonVariants` instead of local classes.
   Why: kit `.text-button` is a shared pattern (S-04 „Usuń próg” reuses it); contract rule "importable components in
   the repo". What would change it: the variant never being reused by S-04 — then fold it back.
8. **One dialog island per row (`client:load`)**, not one page-level dialog fed by row clicks. Why: mirrors
   `DeleteAccountDialog`, keeps each trigger a real button with its own form; imports lists are short (a few per
   month). What would change it: lists with dozens of rows where hydration cost shows.
9. **No dialog reopen on error**; error line above the list. Why: the redirect does not carry which row failed and a
   failed delete leaves the row in place for retry. What would change it: review finding the retry path unclear.
10. **Trigger distinguished for screen readers via `aria-describedby` → range cell**, not an `aria-label` with new
    copy. Why: no invented copy. What would change it: an accessibility review requiring a full label.
11. **F2 keyset paging deferred** despite naming S-02 as trigger. Why: `collectPages` already fails the read on a
    mid-read delete (error state, never wrong totals); one view per slice. What would change it: an observed
    „patterns read ended short of count” log, or impl-review judging the error state too frequent.
12. **Proof layout**: new pgTAP file (not an extension of `import_rpc.test.sql`) so the delete proof has its own
    `plan()`; smoke uses the smoke user's single import and restores it by re-import, so later steps are unchanged.
    What would change it: smoke steps after the slot starting to depend on the first import's id.

13. **Gap rows K19/K20/G30 and the `copyExtra.imports` keys land in Phase 2**, together with the `DESIGN-GAP`
    comments, not in this docs commit. Why: the register and `copy.ts` must never point at code that does not exist
    yet, and unused copy keys would fail review. What would change it: the orchestrator requiring gaps registered at
    plan time.

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Delete endpoint and its proofs

#### Automated

- [ ] 1.1 `npm test` — baseline 72/72 (4 files) + 1 file, all new cases green, delta 0 failures
- [ ] 1.2 `npm run lint` 0 errors (baseline 0, delta 0); `npx astro check` 0 errors (baseline 0 / 89 files, delta +2 files)
- [ ] 1.3 `npm run fixture:check` OK and `npm run build` passes
- [ ] 1.4 `npx supabase db reset && npx supabase test db` — pgTAP baseline 44 + 10 = 54, all pass
- [ ] 1.5 `BASE_URL=http://localhost:4398 npm run smoke` — baseline 48 + 8 = 56 PASS
- [ ] 1.6 Deliberate break (endpoint): drop `.select("id")`, redirect `deleted=1` when `error` is null → smoke „import delete of an unknown id is not found” and unit `[] → missing` FAIL; restored → green; meta-check recorded
- [ ] 1.7 Deliberate break (cascade, scratch pgTAP edit): FK replaced with `on delete restrict` → assertion 1/2 red; restored → green; meta-check recorded
- [ ] 1.8 Deliberate break (smoke runner): step „patterns drop the deleted import” with `notContains` „Wzorce” → FAIL; restored → PASS
- [ ] 1.9 `git diff --stat main -- supabase/migrations` is empty (no migration)

#### Manual

- [ ] 1.10 [reviewer] `src/pages/api/imports/delete.ts` guard/parse/log mirror `src/pages/api/auth/delete.ts`; no path deletes without the returning select
- [ ] 1.11 [reviewer] pgTAP assertions 6/8 read as RLS proofs and 1–5 as the owner cascade proof; handoff records which break proved which

### Phase 2: `/imports` delete action bound to the kit

#### Automated

- [ ] 2.1 `npm run lint` 0 errors; `npx astro check` 0 errors (Phase 1 files + 1, delta 0 errors)
- [ ] 2.2 `npm test` green (Phase 1 count, delta 0)
- [ ] 2.3 `npm run fixture:check` OK; `npm run build` passes
- [ ] 2.4 `npx supabase db reset && npx supabase test db` — 54, delta 0 from Phase 1
- [ ] 2.5 `BASE_URL=http://localhost:4398 npm run smoke` — Phase 1 (56) + 4 = 60 PASS
- [ ] 2.6 Deliberate break: status block removed from `imports/index.astro` → „imports shows the deletion above the empty list” and „imports shows the not-found line” FAIL; restored → PASS; meta-check recorded
- [ ] 2.7 No raw colors: `grep -rnE "#[0-9a-fA-F]{3,6}\b|\[#"` over `DeleteImportDialog.tsx`, `button.tsx`, `imports/index.astro` is empty
- [ ] 2.8 `DESIGN-GAP: K19` / `K20` / `G30` comments present in code and rows K19, K20, G30 in `design-kit.md`

#### Manual

- [ ] 2.9 [visual] Screenshots desktop 1440 px + mobile ~400 px: `default`, `dialog-open`, `success`, `error`, `not-found`, `empty-after-last-delete`, `trigger-focus`; pending code-reviewed only
- [ ] 2.10 [visual] At ~400 px the dialog margins are no worse than G24 and the fifth column is reachable by scrolling inside the panel
- [ ] 2.11 [reviewer] `copyExtra.imports` K19 strings match `prototype/app.js` byte for byte; only K20/G30 placeholders are new
