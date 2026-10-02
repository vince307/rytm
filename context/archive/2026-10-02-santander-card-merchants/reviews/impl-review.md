<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Santander card merchants (S-11)

- **Plan**: context/changes/santander-card-merchants/plan.md
- **Scope**: Full plan
- **Reviewed phases**: 1, 2, 3, 4
- **Date**: 2026-10-02
- **Verdict**: APPROVED
- **Findings**: 0 critical, 1 warning (fixed), 3 observations

Run `2026-10-01-m2-santander`, autonomous step (no human in the loop; decisions in `handoff.md` §6). Branch
`feat/santander-card-merchants`, reviewed range `main...HEAD` at `1a7ffa0`, fix commit `6baf3fd`.

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS |
| Scope Discipline | PASS |
| Safety & Quality | PASS |
| Architecture | PASS |
| Pattern Consistency | WARNING (F1, fixed) |
| Success Criteria | PASS |

## Evidence (observed in this step)

**Suites, against the contract baseline (`main` 9f63fd9, after S-10):**

| Suite | Baseline | Branch (after fix `6baf3fd`) | Delta |
| --- | --- | --- | --- |
| `npm run lint` | 0 errors | 0 errors | Δ0 |
| `npx astro check` | 0 errors, 144 files | 0 errors, 147 files | +3 files (`santander-card.ts`, `santander-card.test.ts`, `santander-patterns.test.ts`); 144 + 3 = 147 |
| `npm run fixture:check` | ing + santander OK | ing + santander OK | Δ0 |
| `npx vitest run` | 291 passed, 18 files | 335 passed, 20 files | +44 tests, +2 files (291 + 44 = 335) |
| `npm run build` | OK | OK | — |
| `npx supabase db reset && npx supabase test db` | Files=6, Tests=119, PASS | Files=6, Tests=119, PASS | Δ0 (no migration) |
| smoke on `astro dev :4398` | 147 PASS / 0 FAIL | 151 PASS / 0 FAIL | +4 (two imports, the cross-bank join, `Bankomat`); 147 + 4 = 151 |

Smoke ran before the fix commit; `6baf3fd` changes only comments in two files, after which lint, astro check, vitest
(335) and build were re-run green.

**Deliberate breaks re-executed by the reviewer** (each restored with `git checkout`, tree clean, vitest back to 335):

1. `santander-card.ts` `BLIK_GATE` loosened to the bare `^Wypłata BLIK ` prefix (the plan-review F1 hole) → exactly 1
   red: the ING-shaped BLIK title → `null` case. Meta-check: the only guard is that unit case; the ING key-text pin
   cannot see it (no ING BLIK withdrawal in the ING fixture) — as the plan says.
2. `santanderCardMerchant` city block disabled (`if (false && …)`) → 24 red: the city/code unit cases in
   `santander-card.test.ts` plus, in `santander-patterns.test.ts`, the fixture partition, aggregates, display names
   and both cross-bank cases. Meta-check: the cross-bank tests go red independently of the unit cases, so the oracle
   (not just the hand-written cases) proves the city rule is what joins ING and Santander.

**ING keys byte-identical to `main`:** (a) the pin test `ING merchant keys — text pin (S-11)` in
`test/unit/patterns.test.ts` is green; (b) direct comparison — `merchantKey(rawMerchant(...))` and
`normalizeMerchant(rawMerchant(...))` computed with `main`'s `merchant.ts` and with the branch's, over every
transaction of every parseable ING fixture file: 212 rows, 0 key or display differences; plus 3 synthetic ING-shaped
titles (BLIK withdrawal with `Nr transakcji`, card payment, transfer), 0 differences.

**Real PLN export (local only, counts only; harness in the session scratchpad, loads the repo modules):**

| State | All keys | Card keys | Keys merging ≥ 2 raw tails | Over-merged keys | Split merchants |
| --- | --- | --- | --- | --- | --- |
| `main` | 239 | — | — | — | — |
| Phase 2 code (`5205a19`) | 227 (plan R4: 227) | 212 (R4: 212) | 11 | 0 (P2 partition refines P3's) | — |
| HEAD | 193 (plan R10: 193) | 179 (R10: 179) | 15 (68 distinct tails) | **0** | **6** (10 extra keys) (R10: ≤ 6) |

Every one of the 15 multi-tail keys was judged by the reviewer tail by tail: each holds one merchant (chain outlets in
different towns or tills, one streaming subscription under rotating ids, ATM addresses → `Bankomat`, BLIK ATM
addresses → `Wypłata BLIK`). The labelling is in the private workspace
(`context/runs/2026-10-01-m2-santander/private/ir-multi-tail-keys.txt*`, gitignored), extending the Phase 3 files.
Splits were counted against the research labelling; the 6 residual splits are descriptor styles the plan accepts
(fixable with the existing merge, K22).

**No migration, no new write endpoint:** `git diff --name-only main...HEAD` touches nothing under `supabase/` or
`src/pages/`; pgTAP Δ0.

**Privacy:** the branch diff was grepped (case-insensitive) against 22 merchant names from the private labelling —
0 hits.

## Findings

### F1 — Seam: Phase 3 widened the Santander step, Phase 2 comments still said card/ATM only

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: `src/lib/patterns/merchant.ts` (file header, `rawMerchant` doc); `src/lib/patterns/santander-card.ts` (file header, rule-4 comment above `CODE_TOKEN`)
- **Detail**: Phase 3 added `BLIK_GATE`, so `santanderCardMerchant` also claims `Wypłata BLIK` rows (not card rows),
  but the Phase 2 comments in `merchant.ts` said it returns non-null "only for a Santander card/ATM row's title" — a
  later phase silently widening an earlier contract. `santander-card.ts`'s header cited "import-formats.md Santander
  rules 1–5" (those are the reader's rules, not the card step's), and the rule-4 comment credited the code-token rule
  to plan review F2 (F2 is the first-token exemption).
- **Fix**: Comment-only rewrite naming `Wypłata BLIK` and the plan's rule set.
- **Decision**: FIXED — `6baf3fd`

### F2 — `dropCodeTokens` empty-result fallback is unreachable

- **Severity**: 🔵 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: `src/lib/patterns/santander-card.ts` `dropCodeTokens`
- **Detail**: Because the first token is never dropped, `kept` is empty only when the input is empty; the
  `[...tokens]` fallback (plan rule 4 "keep the tokens from step 3") never fires for real input. Harmless defensive code.
- **Fix**: None needed; keep as a guard should the first-token exemption ever be removed.
- **Decision**: ACCEPTED

### F3 — `BLIK_GATE` protection for ING is shape-based and unmeasured on real ING data

- **Severity**: 🔵 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: `src/lib/patterns/santander-card.ts` `BLIK_GATE`
- **Detail**: An ING title ending in `:<11 digits>` and starting `Wypłata BLIK ` would be re-keyed to `wypłata blik`.
  No real ING export is among the run's inputs; the ING fixture has no BLIK withdrawal. Already the plan's decision 15
  reversal condition.
- **Fix**: None now; plan decision 15 / plan-review F1 cover it.
- **Decision**: ACCEPTED (recorded)

### F4 — Smoke ran before the comment-only fix commit

- **Severity**: 🔵 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: `scripts/smoke.mjs` (151 PASS observed at `1a7ffa0`)
- **Detail**: `6baf3fd` changes comments only (no executable line), so smoke/pgTAP were not re-run after it;
  lint, astro check, vitest and build were.
- **Fix**: None; the ship step's CI re-runs everything.
- **Decision**: ACCEPTED

## Plan adherence (summary)

Every planned file is in the diff and matches its contract: `test/unit/patterns.test.ts` (`ING_KEYS` pin over every
distinct oracle raw, F3 `normalizeMerchant` rows), `src/lib/import/banks.ts` `accountLabel` (function replacement)
+ `test/unit/banks.test.ts`, `src/lib/patterns/santander-card.ts` `santanderCardMerchant` (rule order ATM → quotes →
city with three single-`if` pops → `dropCodeTokens` → join; `BLIK_GATE` only when `CARD_GATE` fails), the hook in
`rawMerchant`, both new test files, `scripts/smoke.mjs` (additions only), `import-formats.md`, `CLAUDE.md`. Unplanned
diff entries are docs only (`roadmap.md` status sync, change-dir artifacts) plus the `santander.ts` `rawMerchantOf`
comment the seam sweep asked for. `What We're NOT Doing` held: no fixture, generator, kit, migration or reader change.

## [reviewer] Progress rows

1.6, 2.7, 3.5, 4.7 performed in this step and ticked (all pass; 4.7 after F1's fix). Remaining open: 4.6 [visual],
4.8–4.11 [human].

MERGE: CLEAR — 0 open CRITICAL, every automated criterion met and all suites green at baseline + delta (vitest +44, smoke +4, others Δ0), real export 193/179 keys with 0 over-merges and 6 splits, ING keys byte-identical to main; only the [visual] 4.6 gate and [human] rows remain.
