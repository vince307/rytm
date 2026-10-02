# Santander CSV import (S-10) — Plan Brief

> Full plan: `context/changes/santander-csv-import/plan.md`
> Research: `context/changes/santander-csv-import/research.md`

## What & Why

The user uploads a Santander Bank Polska PLN CSV, and the app imports it "na tych samych zasadach co ING" (FR-018):
- it recognises the format by itself;
- it imports debits only;
- it rejects other currencies and ranges that overlap an import of the same account (FR-005);
- it names the bank on the list and the result;
- the transactions reach the patterns.

This is roadmap M-2, slice 2 of 3. The fixture came from F-03, and card-merchant normalisation is left to S-11.

## Starting Point

- Only ING is supported. The database allows `source = 'ing'` only, and `import_ing_statement` hard-codes it.
- The payload requires an 18-digit bank id, which Santander lacks.
- The wizard calls only `parseIngStatement`, and the copy says "Santander wkrótce".
- The synthetic Santander fixture is the test oracle: 187 rows, 184 debits and a per-row `rawMerchant`.

## Desired End State

- The Santander main fixture goes through steps 1→2→3 and saves 184 debits with `source = 'santander'` and null bank
  ids.
- The list reads "Santander · Rachunek", and the patterns show card merchants by their raw card tail.
- The USD file is rejected with the existing currency message. A re-import is blocked as an overlap.
- ING behaves exactly as before. Its RPC, pgTAP file and smoke steps have no diff.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Write path | New `import_statement(p_source, …)`, old ING RPC untouched, explicit revoke from anon | The only shape that keeps the live five-key call valid during the deploy window | Research |
| Payload | `source` enum defaulting to `ing`, `bankTxId` 18 digits for ING / null for Santander | A stale tab without `source` must still import ING | Research → Plan |
| Lp | Not stored, `bank_tx_id` null (**deviates from import-formats rule 7 wording**, `[human]` 6.9) | Lp restarts per export and would collide in the cross-import unique index | Research → Plan |
| Account name | Generic "Rachunek" from `copyExtra`, injected into the pure reader; never the owner name in header col 3 | Privacy, and no invented UI (`[human]` 6.10) | Plan |
| Reader structure | `santander.ts` + `detect.ts` (Santander strict UTF-8 first, else unchanged ING) + shared `common.ts` | Smallest wizard change; the ING reader stays as it is | Research → Plan |
| Merchant | `counterparty` = rule-5 raw merchant; tails normalised in S-11 | `rawMerchant` reads only `counterparty` | Research |
| R1 / balances | Whole-file reject on an out-of-period operation date; no balance-chain check | 0 violations in the real exports; not in the import rules | Research |
| Step 2 | Kept for one account (preselected), no G-row | The wizard already does this | Research |
| Kit copy | K26: per-bank copy in `copyExtra`, both-bank `supported` / `unknownFormat` injected in `new.astro` | The kit is read-only and says "wkrótce" | Plan |
| Smoke | Santander steps in the fresh "re-created account" block; ING steps byte-identical | No existing assertion can shift | Plan |

## Scope

**In scope:**
- F-03 F9 comparator fix plus an R1 metric.
- Migration, pgTAP and types.
- Schema and endpoint.
- Santander reader and detector.
- List and result labels.
- Wizard wiring.
- K26.
- `import-formats.md` and `CLAUDE.md` notes.
- Seam sweep.

**Out of scope:**
- Card-tail normalisation and cross-bank grouping (S-11).
- Dropping `import_ing_statement`.
- Persisting Lp, and a balance check.
- Skipping step 2.
- Santander on the demo account.
- Editing the kit, the fixtures or the ING tests.

## Architecture / Approach

The browser parses the file and the server re-validates it, as for ING:

1. `detectStatement` picks the bank.
2. A bank reader builds `{accounts, period, rows}`.
3. `buildPayload` posts the debits with `source`.
4. `POST /api/imports` re-validates with zod and calls `import_statement` (security invoker). RLS,
   `imports_no_overlap` and the period check guard the write.

Pages map `imports.source` to the bank label through one helper (`banks.ts`).

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Comparator F9 + R1 | Shape tool reports one-sided variants and R1 shares | A real-only variant forcing a reader change |
| 2. Database | Widened check, `import_statement`, pgTAP, types | Default anon EXECUTE on a new function |
| 3. Payload + endpoint | Source-aware schema, endpoint on new RPC, 5 smoke steps | Breaking stale-tab ING posts |
| 4. Reader + detector | `santander.ts`, `detect.ts`, `common.ts`, fixture tests | ST15 dialect; detection order |
| 5. List + result | Per-bank label, 2 smoke steps, K26 starts | Copy-key shape change touching the wizard |
| 6. Wizard + K26 + sweep | Wizard on the detector, testable `readImportFile`, kit register, docs, sweep | Visual regressions in the ING flow |

**Prerequisites:** F-03 merged (it is), Docker + local Supabase, and the run contract's symlink dir for Phase 1's
manual row.
**Estimated effort:** 6 small phases, one fresh agent each. Phases 4 and 6 are the largest.

## Open Risks & Assumptions

- S-11 re-keys Santander pattern keys when it normalises the tails. Thresholds and decisions saved in between would
  be orphaned (accepted).
- R1 is guarded only by a manual comparator run on future exports.
- After a `vercel rollback`, Santander imports show as "ING · Rachunek" (cosmetic).

## Success Criteria (Summary)

- A Santander PLN export imports in three steps and shows on the list and in the patterns under the bank's name.
- A wrong currency, an overlap and an unknown file are each rejected with a clear message.
- ING is untouched: the same smoke, the same RPC, and green pgTAP.
