# Handoff — `santander-card-merchants` (slice S-11)

Written by the `/10x-research` step of run `2026-10-01-m2-santander`. `research.md` answers Q1–Q4 with measurements on
the oracle AND the real PLN export (counts only); `change.md` is `preparing`; no product code changed. The next agent
must not plan a closed city list or a fix to the global `ADDRESS` regex: real tails end mostly in villages and the real
ATM address has no `UL.` dot — the rules are positional, title-gated, applied to the raw merchant in
`src/lib/patterns/merchant.ts` `rawMerchant` so key and display agree, and must keep 0 over-merges.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/santander-card-merchants`, cut from `main` at `9f63fd9` |
| Commits | 2 on the branch after this step's commit (`docs(santander-card-merchants): change identity (autonomous run)`, `docs(santander-card-merchants): research`) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `preparing` (via `metadata-guard.mjs mark-researched`) |
| `## Progress` rows remaining | n/a — no `plan.md` yet |
| Working tree | clean after the commit (only `research.md`, `change.md`, `handoff.md` changed) |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `context/changes/santander-card-merchants/research.md` | Research: current pipeline, Q1 city (positional + 2-word prefix + repeated city), Q2 real shapes and code-token rules D0–D3, variant table R0–R11 on fixture + real export, Q3 location (title-gated in `rawMerchant`), Q4 display, ING protection, open questions |
| `context/changes/santander-card-merchants/change.md` | Frontmatter only: `status: new → preparing`, `updated` |
| `context/changes/santander-card-merchants/handoff.md` | This file |

## 3. Verification

| Command | Result |
| --- | --- |
| `git branch --show-current` | `feat/santander-card-merchants` |
| Probe (scratchpad, not committed): copy of `merchant.ts` + title-gated pre-normaliser, `node --experimental-strip-types`, over the 184 imported oracle rows | R0 (current) 37 keys / 2 splits; **R10 (recommended) 35 keys = 35 split-back oracle groups, 0 splits, 0 over-merges, cross-bank key = ING `pizzeria trzy sery`** |
| Same probe over the real PLN export (sandbox disabled, symlink dir; counts only) | 432 card-payment rows, 229 distinct payment tails; R0 239 keys / 0 over / 17 merchants split (56 extra); **R10 193 keys / 0 over / 6 split (10 extra)** vs 183 merchants by private labelling |
| Closed-list check (real) | top-~60 Polish cities cover 8 of 57 distinct last tokens, 158 of 432 rows |
| ING gate check: `iconv -f cp1250` + grep `DOP. VISA` / `Wypłata BLIK` over the 4 ING fixture CSVs | 0 matches each |
| lint / astro check / vitest / build / pgTAP / smoke | **not run** — research only, no code changed. Baseline inherited, unverified: contract line for `main` 9f63fd9 |
| Live DB | not touched (no question needed it) |

## 4. Next command

`/10x-plan santander-card-merchants`

## 5. Open

- Plan inputs (from `research.md` § Summary / Open Questions):
  - Rule set R10 in `src/lib/patterns/merchant.ts` `rawMerchant` (or a sibling called from it), gated on the title:
    card-payment kind → quotes out, drop last token (min1), 2-word-city prefix, repeated city, code-token rule D3 with
    `NR` guard; ATM kind → `bankomat`; `Wypłata BLIK` → one pattern (recommended, plan decides).
  - Where the card regex lives: export from `src/lib/import/santander.ts` `CARD` vs a local regex (plan decides).
  - Tests: Santander partition vs `expected.json` (mirror `test/unit/patterns.test.ts` `expectedGroups`), cross-bank
    join, ING key-text pin, unit cases for each D3 token shape (synthetic values only).
- In scope by `change.md` decision 5: S-10 F4 — `src/lib/import/banks.ts` `accountLabel` → `replace("{name}", () => name)`
  + `test/unit/banks.test.ts`.
- Candidate follow-ups (plan writes them to `follow-ups/review-fixes.md` with a `Trigger:` if not taken):
  Santander BLIK through a payment operator (merchant = operator); `import-formats.md` § Santander BLIK end-shape
  (` ref:<11 digits>` in the real export vs `:<11 digits>` in the doc); fixture ST06 with a second ATM address
  (`scripts/fixture-santander.mjs` `buildST06`).
- [human] rows carried, not owned by an agent:
  - [ ] F-03 3.9 — confirm the oracle's product calls (`Wypłata BLIK` own pattern, ST03 user-merge, `Oplata za …` fixed).
  - [ ] S-10 6.11 — accept that S-11 re-keys Santander card patterns (real-export scale: 239 → 193 keys).
  - [ ] S-10 6.8 — owner imports the real Santander PLN export locally (and checks no wrong cross-town merge, min1).
- Adjacent, plan decides: merchant-patterns F3 (`normalizeMerchant` tests for `S.C.A` / `http://`).
- DESIGN-GAP: none added (`bankomat` is merchant-name data, `change.md` decision 4 holds). Migration: none expected.
- ARTIFACT GAP: none.

## 6. Autonomous decisions

1. **Scope taken from `change.md` Q1–Q4, no interview.** Rejected: asking the owner. Why: the contract forbids it and
   `change.md` defines the questions. Would change: the orchestrator adding a question.
2. **Positional city stripping recommended over a closed list.** Rejected: gazetteer. Why: covers ~37 % of real rows,
   misses truncated 2-word cities. Would change: real data from another account where the last token is often not a
   place (e.g. many online merchants without a city).
3. **min1 recommended over min2.** Why: matches the oracle slugs and 0 over-merges on real data (min2 costs 6 more keys).
   Would change: an observed wrong merge of a generic one-word name across towns → switch to min2.
4. **Code-token rule D3 recommended over D1/D2.** Why: the only variant with 0 over-merges and the fewest splits on real
   data. Would change: a real tail where a brand token matches the code shape (`^[A-Z]{0,2}\d…`), causing an over-merge.
5. **`Wypłata BLIK` → one pattern recommended (beyond `change.md` scope).** Why: real-only split by ATM address,
   oracle-neutral (ST06 stays its own pattern). Would change: owner wanting per-ATM BLIK withdrawals, or the plan
   judging it scope creep → follow-up row.
6. **Over/under-merge on real data graded against a private judgement labelling** kept in the session scratchpad, never
   in the repo (privacy rule). Would change: the owner's own labelling disagreeing (e.g. the two-locality delicatessen
   counted as two merchants → 1 over-merge from R2 on).
7. **No live-DB experiment.** Why: no research question needed DB state (keys are read-time derived). Would change: a
   question about stored thresholds/decisions on Santander keys.
