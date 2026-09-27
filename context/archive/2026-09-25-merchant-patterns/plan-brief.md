# Merchant patterns list (S-03) — Plan Brief

> Full plan: `context/changes/merchant-patterns/plan.md`
> Research: `context/changes/merchant-patterns/research.md`

## What & Why

The user opens `/patterns` and sees every merchant pattern hidden in their imported debits: merchant (normalized from
the bank description; the real merchant's domain when a payment operator sits in between), the proposed type
`stały` / `częsty`, occurrences, sum, and the amount for fixed patterns — each transaction in exactly one pattern.
This is the product's core (FR-006 "cały projekt ukryty w jednej linii", FR-007) and the first place the grouping
quality becomes visible.

## Starting Point

Imports (S-01) store raw `counterparty` / `title` / amount per debit; nothing merchant-related exists in `src/`.
Rule 7 / D3 and D5 live only in the fixture generator (`scripts/fixture-ing.mjs`), whose `expected.json` is the
acceptance oracle. `/patterns` is an empty-state stub.

## Desired End State

For the synthetic fixture the page shows 31 rows (occurrences sum to 206), `KINOTEKA` `stały` 52,99 zł,
`MINIMARKET PRZYSTANEK` as one row of 8, `sportowo.pl` and `SPORTOWO` as two rows (user merge is S-05), with kit
search and sort. Users without data keep the empty view; a failed read shows an error, never a partial list.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Storage | Derived on read, no migration | No consumer needs pattern rows yet; survives S-02 undo for free; S-04/S-05 key on `(user_id, merchant key)` | Research → Plan |
| Row limit (`max_rows = 1000`) | Paged read in TS, offset by rows returned, stop at exact count | Keeps all logic in Vitest-testable TS; no SQL + pgTAP surface | Plan |
| Normalization rules | Rule 7/D3 + scheme/`www.`, `UL.`/`AL.` cut, legal forms, store numbers, doubled name | Minimum set the fixture proves; prototype gave 31 groups, 0 over-merges | Research → Plan |
| T01 `sportowo` | Not auto-merged (no TLD stripping) | Oracle marks it `user-merge` (S-05); conservative grouping avoids silent over-merge | Research → Plan |
| "Kwota dla stałych" | Median (`medianMinor`) | Order-independent, equals the oracle, D5 is defined around it; "latest" needs a tie-break nobody decided | Plan |
| Display name | Normalized, case preserved, from the most frequent raw variant | Deterministic without inventing brand casing | Plan |
| Search / sort | One React island, client-side, as kit `bindInteractions()` | Kit behaviour; SSR renders the default sum-desc table | Plan |
| Badge colors | `bg-green/15` / `bg-ink/8` (Tailwind names) | Same kit hexes `InlineAlert` already maps this way | Plan |
| Kit parts for later slices | Próg / Ponad progiem, row link, excluded section, "Pokaż więcej" omitted → G28 | One view, no dead links to the S-04 detail | Plan |
| Amount column | Placeholder "Kwota" → K17 | FR-007 requires it; kit table has no column or key | Research → Plan |
| Operator list | Constant in `src/lib/patterns/merchant.ts` | PRD Open Question 2 not needed as config yet | Plan |

## Scope

**In scope:** `src/lib/patterns/{merchant,derive,load}.ts`, pattern types in `src/types.ts`, `formatMoney`,
Vitest oracle suite, shared `Badge` and `Glyph`, `PatternsTable` island, `/patterns` page, `copyExtra` +
`design-kit.md` K17/G28, smoke +2.

**Out of scope:** migration/pgTAP, merge/exclude/rename/type change (S-05), thresholds and detail (S-04), fixed-cost
changes (S-06), `/home` widget, `/imports/result` G26, generator/oracle edits, deploy (Ship step).

## Architecture / Approach

`patterns.astro` → `loadPatterns(supabase)` pages `transactions` under RLS → `derivePatterns` (rule 7 →
`normalizeMerchant` → `merchantKey` → group → D5) → slim `PatternListItem[]` → `PatternsTable` island (toolbar,
table, foot). All logic is pure TS in `src/lib/patterns/`, proven against `expected.json` as a **partition**
(sets of `bankTxId`), never against its hand-authored slug keys.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Merchant normalization and pattern derivation | Pure module + oracle suite (31 groups, aggregates, non-merges, D5 edges, determinism) | Rule order / over-merge on real data |
| 2. Reading the user's patterns | Paged loader immune to `max_rows`, `formatMoney` | Stopping on a short page truncates silently |
| 3. `/patterns` view bound to the kit | Badge, Glyph, island, page, copy + gap rows, smoke +2, screenshot row | Kit deviations not registered as gaps |

**Prerequisites:** S-01 and F-02 merged (yes, `main` `d11f3ef`); local Supabase + Docker for Phase 3 smoke/pgTAP.
**Estimated effort:** ~1 implement session across 3 phases.

## Open Risks & Assumptions

- Real-statement grouping quality is unknown (roadmap Unknown, owner user): card processors (`MARKA *Marka App`),
  unlisted operators or new legal forms may split or merge merchants; S-05 user decisions are the correction path.
- Every one-off debit becomes a 1× `stały` pattern (oracle `silownia-ruch`) — likely many rows on real data.
- Changing normalization after S-04/S-05 store rows by key re-keys merchants; those slices own the mapping.

## Success Criteria (Summary)

- The fixture yields the oracle partition (31 groups) with matching counts, sums, medians and types in Vitest.
- `/patterns` shows the list for a user with data (smoke +2), the empty view without data, an error on failure.
- Screenshots of `lista`, `lista-mobile`, `wyszukiwanie`, `sortowanie-nazwa`, `pusty`, `brak-wyników` pass the Visual step.
