# Santander card merchants (S-11) — Plan Brief

Full plan: [plan.md](plan.md) · Research: [research.md](research.md) · Identity: [change.md](change.md)

## What & Why

Santander card payments currently form one pattern per town, per store code and per ATM address, and a merchant seen
in both banks shows twice. S-11 (north star of M-2) makes a Santander card row land in the right merchant pattern,
shared with ING, without moving a single ING pattern key (saved thresholds/decisions are stored by key text).

## Starting Point

S-10 stores the card tail (`<merchant> <city>`) in `counterparty` and the full description in `title`.
`derivePatterns` builds key and display from `rawMerchant(counterparty, title)`. On the oracle: 37 keys vs 35
groups, no cross-bank join. On the real export: 239 keys, 17 merchants split over 56 extra keys, 0 over-merges.

## Desired End State

Oracle 35/35, 0 splits, 0 over-merges, `pizzeria trzy sery` joined with ING; names without city or quotes; one
`Bankomat` pattern. Real export (local counts only) ≈ 193 keys, 0 over-merges. ING key text pinned and unchanged.

## Key Decisions Made

| Decision | Choice | Why |
| --- | --- | --- |
| Where the rules live | New `src/lib/patterns/santander-card.ts`, first step of `rawMerchant` | Key and display agree; reader and stored data untouched |
| Gate | Santander card title (`DOP. VISA … PŁATNOŚĆ KARTĄ / WYPŁATA Z BANKOMATU KARTĄ`), `Wypłata BLIK` prefix | 0 matches in ING; protects ING keys |
| City | Positional: last token + 2-word prefix list + repeated city | Gazetteer covers 37 % of real rows |
| Minimum tokens | 1 ([human] row) | Oracle slugs, 0 real over-merges; min 2 is the fallback |
| Store/till codes | D3 token shape + `NR` guard | Only variant with 0 over-merges and fewest splits |
| ATM / BLIK withdrawal | `Bankomat` / `Wypłata BLIK`, each one pattern, never merged | Outcome + real-only split; oracle-neutral |
| Saved rows on old keys | Orphaned, no migration ([human] 6.11) | SQL re-key would duplicate the normaliser |
| Adjacent | S-10 F4 `accountLabel`, merchant-patterns F3 tests, `import-formats.md` BLIK `ref:` note | Cheap, assigned or found by research |

## Scope

**In scope:** title-gated Santander step (ATM, quotes, city, code tokens, BLIK withdrawal); ING key-text pin;
Santander oracle partition + cross-bank tests; smoke join + ATM; docs; seam sweep; F4/F3.

**Out of scope:** reader / stored `counterparty`; global normaliser rules; diacritic folding; brand lists; ST03;
re-keying saved rows; Santander BLIK via operators; demo account; any UI or kit change.

## Architecture / Approach

`rawMerchant(counterparty, title)` → `santanderCardMerchant` (null unless gated) → unchanged
`normalizeMerchant` / `merchantKey`. Rule order is load-bearing: ATM → quotes → city → code tokens → join.

## Phases at a Glance

| Phase | What | Proof |
| --- | --- | --- |
| 1 | ING key-text pin, F3 cases, `accountLabel` fix | Dashed-key break: partition green, pin red |
| 2 | Santander step: ATM, quotes, city; oracle + cross-bank tests | 35/0/0, join; real ≈ R4 |
| 3 | Code tokens + `NR` guard, `Wypłata BLIK` | Unit cases; real ≈ R10 (193, 0 over) |
| 4 | Smoke join + `Bankomat`, docs, seam sweep, screenshots | Smoke + 4; visual gate |

**Prerequisites:** S-10 and F-03 merged (done); local Supabase for smoke/pgTAP; contract symlink dir for the local
real measurement.
**Estimated effort:** 4 small phases, one agent session each.

## Open Risks & Assumptions

- min 1 can merge a generic one-word name across towns irreversibly ([human] 4.11).
- Cross-bank join is ASCII-only; real join rate unmeasured (follow-up).
- 6 real merchants stay split (descriptor styles) — fixable by user merge.

## Success Criteria (Summary)

Oracle partition 35/0/0 with the cross-bank join; ING key text unchanged; real export ≈ 193 keys with 0 over-merges
(local counts); smoke shows one pizzeria and one `Bankomat` pattern across banks; full local gate green each phase.
