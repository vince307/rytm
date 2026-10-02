# Import wizard, result and history on kit round 3 (S-13) — Plan Brief

> Full plan: `context/changes/kit-round-3-imports/plan.md`
> Research: `context/changes/kit-round-3-imports/research.md`

## What & Why

Kit round 3 (shipped in F-04) now draws every import screen: both banks, a separate message per rejection, the bank
in its own cell, the account as „{nazwa} · •• końcówka”, a round-3 result panel, kit delete outcomes and demo
notes. The app still shows stand-ins (`copyExtra`, four rejections sharing „Nieznany format pliku”). S-13 binds the
three import surfaces to the kit without touching any rule.

## Starting Point

`ImportWizard.tsx` reads `copyExtra.imports`; size / too-many / inconsistent / server-invalid all show
`unknownFormat`. `/imports` has no Bank column and no account tail; `/imports/result` has one stat and redirects an
unknown id. The bank-prefixed `accountLabel()` („Santander · Rachunek”) labels all three surfaces. Demo refusals
appear only after a refused POST.

## Desired End State

Each rejection has its own kit message with limits filled (5 MB / 5000). Step 3, the history table and the result
panel show Bank / Rachunek („Konto smoke · •• 0099”, „Rachunek · •• 0099”) / Zakres dat. The result page uses the
round-3 layout and renders a not-found state. Every delete outcome uses kit copy. The demo account sees a note and
disabled actions up front. `copyExtra.imports` keeps only true kit gaps.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Migration | None | Every value is already stored (`source`, `account_number`, `account_name`, period) | Research |
| Account label | `{account_name} · •• tail`, bank in own cell; `accountLabel()` removed | Kit draws it so on all three surfaces; C6 falls out | Research / Plan |
| ING name | File's real account name, `accountDefaultING` unused | Name is a file fact; schema forbids empty | Research |
| Skipped credits | Dropped; one 4-cell grid | No FR requires it; CHANGELOG names four cells | Research |
| Server `invalid` | Shows `inconsistent`, no server split | Only reachable by bypassing the client's schema | Research |
| Result not-found | 200 kit state for malformed/unknown id | Kit draws it; smoke rewritten deliberately | Plan |
| Demo gating | Wizard note only when demo has ≥ 1 import | Seed demo starts empty; first import must stay open | Research |
| `accountLead` | Keep the app text | Kit text wrong for one account, drops D1 | Plan |
| Delete `{range}` | Short form | Kit sample, same as the list column | Plan |
| K32 | `importFlow.accountLabel`, `imports.santanderAccountName` | One label group; keeps today's stored-name key | Plan |
| Missing kit CSS | New `G38` + `DESIGN-GAP` for `.result-layout`/`.result-meta` | Kit has only a mobile rule | Research |

## Scope

**In scope:** wizard steps 1–3 copy and rejections, history table + delete dialog, result page, demo notes on
imports, `presentation.ts` helpers + unit tests, kit-contract pins, smoke updates, register rows (G38, K33).

**Out of scope:** server/API/query-param changes, migrations, global `app.demoNotice` strip (S-12), save-failure
on the result page, dialog close icon / `ServerError` sprite, field radius, `design/rytm-os/` edits.

## Architecture / Approach

A pure module `src/lib/import/presentation.ts` (`fillTemplate`, `bankDisplayName`, `accountDisplay`,
`fileErrorMessage`) feeds the wizard island, the history page and the result page. `FileError` gains `tooLarge`.
Pages compute the demo flag from `isDemoEmail` / `demoImportAllowed` and pass it to the islands; a small React
`InfoAlert` mirrors `InlineAlert.astro` kind `info`. Each phase removes the `copyExtra` keys it leaves unread.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Helpers + step 1 + rejections | `presentation.ts`, `tooLarge`, per-rejection messages, kit step-1 copy | Wizard size path has no unit test |
| 2. Wizard steps 2–3 | 4-cell summary, kit button and overlap template | Step 3 is client-only (visual proof) |
| 3. History + dialog | Bank column, tail, kit statuses, `InfoAlert`, demo dialog | Closed dialog not in SSR HTML |
| 4. Result page | `result-meta`, not-found state, `accountLabel()` retired, G38 | Smoke rewrites must stay deliberate |
| 5. Demo notes in wizard | Up-front note, disabled picker/drop/button | Must not block the seed's first import |
| 6. Register + seam sweep + visual | Register statuses, K33, greps, screenshots | Many states to capture |

**Prerequisites:** F-04 merged (`2a8f89d`); local Supabase; branch `feat/kit-round-3-imports`.
**Estimated effort:** 6 small implement sessions + one visual gate.

## Open Risks & Assumptions

- React SSR may split the overlap sentence with `<!-- -->`; smoke asserts rendered nodes separately.
- „too many debits” needs a generated > 5000-debit CSV for the screenshot; fallback is N/A + unit pin.
- F8 (`DialogContent` without `max-h`) may clip with the demo note at 400 px; fix or follow-up at the visual gate.

## Success Criteria (Summary)

- Every import rejection, summary, list row, result and delete outcome reads kit round-3 copy; no `undefined` or raw `{…}`.
- Smoke + 9 net (5 deliberate rewrites), vitest + presentation cases, pgTAP Δ0, full gate green each phase.
- Visual gate PASS at 1280 px and ~400 px for every listed state.
