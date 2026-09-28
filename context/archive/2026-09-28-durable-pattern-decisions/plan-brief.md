# Trwałe decyzje o wzorcach (S-05) — Plan Brief

> Full plan: `context/changes/durable-pattern-decisions/plan.md`
> Research: `context/changes/durable-pattern-decisions/research.md`

## What & Why

The user can merge one pattern into another, exclude a pattern from the analysis (and restore it), pin its type and
rename it (FR-009). US-03: those decisions must survive the next import without re-editing, and an excluded pattern
must never produce „ponad próg”. Without durable decisions every monthly import would undo the user's fixes to the
normaliser.

## Starting Point

Patterns are derived per request from the user's debits (`derivePatterns`, grouped by `merchantKey`); S-04 added
per-merchant thresholds and the pattern detail. Nothing stores a user decision; the kit's „Akcje” dialog exists only as
toast stubs.

## Desired End State

The detail has the kit „Akcje” dialog (merge picker, type toggle, rename field, exclude). A merged pattern shows the
combined count and sum and lists its variants with „Cofnij scalenie”; an absorbed key's URL redirects to it. An
excluded pattern shows the kit banner with „Przywróć”, has no „ponad próg”, and sits in `/patterns`' „Wykluczone”
section. A second import joins the merged pattern and keeps the type, name and exclusion.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Storage | One `pattern_decisions` row per (user, merchant key), no `import_id` | One outgoing merge edge per key; survives import delete | Research |
| Where decisions apply | Inside `derivePatterns`, before grouping | Sums / counts / D5 are then computed on the union by construction | Research |
| Merge direction | Current pattern is absorbed into the chosen target; target key survives | Keeps routes and threshold of the target; matches the oracle `sportowo.pl → sportowo` | Plan |
| Chains / cycles | Resolved at read; a cycle → its smallest key; writes accept only a non-excluded current root | Single-row writes, deterministic reads | Plan |
| Type pin | „Zmień typ” pins the other type; no reset of thresholds; no return to auto | All S-04 consumers already follow `pattern.type` | Research + Plan |
| Exclusion | Zero over-limit everywhere; threshold kept and visible; row moves to „Wykluczone” | PRD AC; restore brings the threshold back | Plan |
| „suma miesięczna” | Excluded from every „ponad próg” sum; S-07 must skip excluded patterns | Only monthly sum the PRD defines; ambiguous → `[human]` 7.9 | Plan |
| Undo | Restore (kit), clear name, toggle type, „Cofnij scalenie” (G33) | A mistaken merge must be reversible | Plan |
| Write path | One `POST /api/patterns/decision` with an `action` union, key parsed first, single-column upserts | One guard; untouched decisions survive | Plan |
| Read path | `loadPatternData` = three parallel keyset reads, derive after | One entry point for pages, merge check, S-06/S-07 | Plan |
| Follow-ups | S-04 F5, F7, F8 + undo-import F4 + G24 dialog geometry folded; S-04 F4 / F11 left open | They fire on this slice; the rest are other views | Research + Plan |
| Durability proof | Unit fixture oracle + date split, smoke second import, pgTAP survival | No new fixture file needed | Research |

## Scope

**In scope:** migration + pgTAP; derivation with decisions; paged threshold/decision reads; decision endpoint; detail
actions dialog, excluded banner, merged variants; list excluded section; shared dialog geometry; bfcache pending reset;
K22 / G33 gap rows.

**Out of scope:** `/home` stats and trend (S-07), fixed-cost badges (S-06), „przywrócony” badge, automatic-type
option, decision history, normaliser changes, threshold-endpoint F4, app-wide field radius (F11).

## Architecture / Approach

`pattern_decisions` (RLS per operation) → `loadDecisions` (keyset) → `loadPatternData` →
`derivePatterns(rows, decisions)` resolves each row's key to its root, applies the root's pin / name / exclusion →
`listOverview` / `patternDetail` zero over-limit for excluded patterns → pages. Writes: dialog / banner / list forms →
`POST /api/patterns/decision` → single-column upsert → redirect with a result param → `InlineAlert`.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. `pattern_decisions` + pgTAP | Table, RLS, partial-upsert and cascade proofs, types | Partial upsert needs the UPDATE policy |
| 2. Derivation with decisions | `resolveKey`, pin / name / exclusion, fixture oracle, date split | Cycle handling determinism |
| 3. Paged reads + one read | `loadDecisions`, paged thresholds (F5), `loadPatternData`, F7, absorbed redirect | No decisions yet → redirect proven by unit only |
| 4. Decision endpoint + US-03 smoke | Six actions, key-first parsing, 26 smoke steps incl. second import | PostgREST partial-upsert semantics |
| 5. Dialog geometry + bfcache hook | Kit `.modal` geometry, `usePageShowReset` (F4, F8) | Cross-view change on `/settings`, `/imports` |
| 6. Detail actions | `PatternActionsDialog`, `RestoreForm`, banner, merged variants, K22 / G33 | Invented flows stay placeholders |
| 7. List excluded section + seam sweep | `ExcludedPatterns`, list result line, follow-ups file | All-excluded list state |

**Prerequisites:** S-04 on `main` (it is); local Supabase running; `npm run db:types` after Phase 1.
**Estimated effort:** 7 implement sessions (one fresh agent per phase), then visual gate and review.

## Open Risks & Assumptions

- Normaliser drift now orphans thresholds, decisions and `merged_into` values.
- A merged variant whose rows were all deleted cannot be unmerged from the UI until its rows return.
- `[human]` 7.9: the product owner may read „suma miesięczna” as a spending total — S-07 must then exclude too.

## Success Criteria (Summary)

- After merge + rename + exclude + type pin, a second import lands in the merged pattern with the same name, type and
  exclusion — no re-editing (smoke steps 17–21).
- An excluded pattern shows no „ponad próg” on the detail or the list, and restoring it brings its threshold back.
- pgTAP 102, smoke 111, vitest +3 files, all green on every phase.
