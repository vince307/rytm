# Próg na wzorcu i „ponad próg” (S-04) — Plan Brief

> Full plan: `context/changes/pattern-threshold-over-limit/plan.md`
> Research: `context/changes/pattern-threshold-over-limit/research.md`

## What & Why

A user opens one merchant pattern, sees its transactions month by month, sets / changes / removes one threshold
(frequent: count or sum per month; fixed: accepted amount) and immediately sees which transactions are „ponad próg”
and the sum „ponad progiem w tym miesiącu”. This closes the PRD's first success criterion (FR-008, FR-010, FR-011,
US-01) — the „north star” of milestone M-1.

## Starting Point

Patterns are derived on read (`loadPatterns` → `derivePatterns`, keyed by `merchantKey`); there is no detail route,
no threshold storage and no over-limit computation. `/patterns` omits the kit's Próg / Ponad progiem columns and the
row link (G28). The pattern read uses offset paging (S-03 follow-up F2 open) and does not select dates.

## Desired End State

`/patterns/<key>` renders the kit detail (month total, over-limit sum, threshold editor, month select with sequence
marks, transactions with „ponad próg” badges); saving/removing redirects back with a result line; `/patterns` shows
Próg and Ponad progiem and links every row. Thresholds live in `pattern_thresholds` (per user + merchant key), survive
import deletion and cascade with the account.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Over amount, sum / fixed kinds | Excess part (monthSum − S; amount − A); count = full amounts | PRD Business Logic defines „nadwyżka” this way; **decided against US-01 AC's literal text** | Research → Plan |
| „w tym miesiącu” | Latest month in the user's data; `?month=` for others | Imports are historical; wall clock would show nothing and breaks determinism | Research → Plan |
| Type flip | Keep row, apply only when kind matches D5 type | Reads stay side-effect free; flip back restores | Research → Plan |
| Storage | `pattern_thresholds` (user_id FK cascade, merchant_key, kind, value), unique per pattern, 4 RLS policies incl. UPDATE | First mutable table; upsert needs SELECT+INSERT+UPDATE | Research → Plan |
| Route | `patterns/[...key].astro`, key from raw pathname, `encodeURIComponent` links | Keys hold spaces, dots, diacritics, maybe `/` | Plan |
| Writes | Form POST `/api/patterns/threshold` (+ `/delete`), redirect + `InlineAlert` | Mirrors `api/imports/delete.ts`; no toast component | Plan |
| Read path | Keyset paging (F2), `count` dropped, `occurred_on` added | Detail and list share one read; touching it once | Research → Plan |
| Boundaries | Strict (> S, > A, from N+1-th); tie-break `(occurred_on, id)` numeric | Deterministic, pinned by oracle cases | Plan |
| Copy | Kit strings from `app.js` → `copyExtra` (K21); undefined states → placeholders (G31) | Never invent UI; gaps registered with the code | Plan |

## Scope

**In scope:** migration + pgTAP; pure over-limit rule with unit oracle; keyset read; detail route; threshold editor
and endpoints; list columns + row link; shared `Badge` excess tone, `BackLink`, `SequenceMark`, `MonthSelect`,
`field-styles`; K21 / G31 gap rows.

**Out of scope:** `/home` stat and trend (S-07), pattern actions / exclusion (S-05), status badges (S-06), dialogs,
toast, threshold history, refactoring other views onto the new shared pieces, normalizer changes, manual deploy.

## Architecture / Approach

`loadPatterns` (keyset) + `loadThresholds` → pure `view.ts` (`listOverview`, `patternDetail`) built on
`over-limit.ts` (`overLimit`, `appliesTo`, `referenceMonth`) → SSR Astro pages with two small islands
(`MonthSelect`, `ThresholdEditor`). Writes are native form POSTs that upsert/delete under RLS and redirect with a
status param.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Table + pgTAP | `pattern_thresholds`, 22 assertions, `db:types` | Copying `revoke update` from the immutable tables |
| 2. Pure rule + oracle | `over-limit.ts`, `threshold-form.ts`, `path.ts`, 2 test files | Boundary / tie-break drift |
| 3. Read path | Keyset `collectPages`, dates, `loadThresholds`, `view.ts` | Silent change to `/patterns` |
| 4. Detail (read-only) | `/patterns/<key>` kit layout, states, K21/G31, +4 smoke | Key round-trip through the router |
| 5. Editor + endpoints | Save / remove, result lines, +8 smoke | Nested forms; app vs DB validation |
| 6. List columns | Próg, Ponad progiem, row link, +3 smoke, screenshots | Serialized island props satisfying smoke |

**Prerequisites:** S-03 and S-02 merged (done, `a6a8b18`); local Supabase in Docker; `db push` by the Ship step before merge.
**Estimated effort:** six implement sessions (one per phase), then impl-review and the visual gate.

## Open Risks & Assumptions

- The two product calls (excess part; reference month) are reversible in one module each; a `[human]` row asks the
  product owner to confirm them.
- `Astro.url.pathname` is assumed percent-encoded; the smoke proves a space key, units cover `%` and `/`.
- A future `normalizeMerchant` change would orphan stored thresholds.

## Success Criteria (Summary)

- Setting „4 × / miesiąc” on a frequent pattern marks the 5th+ transactions of each month and sums them; an accepted
  amount marks only the part above it.
- Thresholds persist per merchant, survive an import delete, and vanish with the account (pgTAP).
- Gate: pgTAP 54 → 76, smoke 61 → 76, vitest +3 files, lint/check 0 — with deliberate breaks recorded per phase.
