# Cofnięcie błędnego importu (S-02) — Plan Brief

> Full plan: `context/changes/undo-import/plan.md`
> Research: `context/changes/undo-import/research.md`

## What & Why

A user who imported the wrong statement can delete that import from `/imports`; its transactions go with it, the
patterns stop counting them, and the same range can be imported again (US-02, FR-004, FR-005).

## Starting Point

The import list, the RLS delete policy and the import → transactions cascade already exist (S-01, domain schema);
patterns are derived on read (S-03). Missing: an endpoint, the kit's fifth column + dialog, result feedback, and
proofs that an own delete cascades and frees the range.

## Desired End State

Each row on `/imports` has „Usuń import”; the kit dialog names the import's range; confirming deletes it and shows
„Import usunięty.” above the list (or above the empty view). A foreign, missing or malformed id deletes nothing and
shows a not-found line. `/patterns` drops the merchants; re-importing is accepted.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Schema change | None | Policy + cascade verified in migrations and live DB | Research |
| Endpoint | `POST /api/imports/delete`, form field `id` (`z.uuid()`) | Native form + smoke runner speak urlencoded POST; mirrors `auth/delete` | Research → Plan |
| Not-found | Returning `.select("id")`; 0 rows / bad id → `?error=missing` | RLS makes a foreign delete a silent 0-row success | Research → Plan |
| Feedback | Redirect + `InlineAlert`, no Toast | Server-redirect flow; `/settings` precedent; gap G30 | Plan |
| Dialog title | „Usunąć import {range}?” (`formatRangeLong`) | Kit h2 hardcodes „z maja”; K16 precedent; gap K19 | Plan |
| Success copy | „Import usunięty.” | Kit toast minus prototype narration; gap K20 | Plan |
| Button | Shared `text` / `text-danger` variants in `buttonVariants` | Kit `.text-button` is shared (S-04 reuses) | Plan |
| Proofs | New pgTAP file (10), smoke +12, vitest +1 file | change.md requires cascade, re-import and not-found proofs | Research → Plan |
| F2 keyset paging | Deferred | Mid-read delete already ends in the error state | Plan |

## Scope

**In scope:** delete endpoint + pure outcome helper; pgTAP delete proof; smoke `notContains` + delete/patterns/
re-import/not-found/anon steps; `/imports` fifth column, `DeleteImportDialog`, status lines; `copyExtra.imports`
keys; gap rows K19, K20, G30.

**Out of scope:** migrations/RPC, `DELETE` verb, Toast component, bulk delete, changes to `/patterns` or other
import screens, keyset paging.

## Architecture / Approach

Form in the dialog → `POST /api/imports/delete` → `getUser()` guard → zod id → RLS delete returning `id` → cascade
removes transactions → `deleteImportRedirect` picks `/imports?deleted=1` | `?error=missing` | `?error=delete` →
`/imports` renders an `InlineAlert` under the title in every state. `/patterns` needs no change.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Delete endpoint and its proofs | Endpoint, helper, unit + pgTAP + 8 smoke steps | Reporting success for a 0-row RLS delete |
| 2. `/imports` delete action bound to the kit | Column, dialog, status lines, copy, gap rows, 4 smoke steps, screenshots | Invented copy slipping in outside K19/K20/G30 |

**Prerequisites:** local Supabase running; branch `feat/undo-import` at post-S-03 `main`.
**Estimated effort:** ~1 session, 2 phases.

## Open Risks & Assumptions

- Placeholder copy (K20, G30) stays until kit round 3.
- One island per row assumes short import lists.
- Hosted DB assumed identical to local migrations (no `db push` needed).

## Success Criteria (Summary)

- Deleting an import removes it and its transactions; `/patterns` reflects it; re-import accepted.
- Foreign/missing ids never report success.
- Gate: lint 0 · astro check 0 · vitest +1 file green · pgTAP 44 → 54 · smoke 48 → 60 · every UI state screenshotted.
