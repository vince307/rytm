# Handoff — `santander-card-merchants` (slice S-11)

Written by the `/10x-implement` Phase 2 step of run `2026-10-01-m2-santander`. Phase 2 (Santander card step — ATM,
quotes, city) is implemented, gated and committed. The next agent must trust that rule 4 (code tokens) and the
`Wypłata BLIK` rule are **deliberately absent** from `src/lib/patterns/santander-card.ts` — that is Phase 3, not a
gap to "complete" while touching this file for something else.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/santander-card-merchants`, cut from `main` at `9f63fd9` |
| Commits | 9 on the branch (`main..HEAD`): `… change identity`, `… research`, `… plan`, `… plan review`, `feat(…): safety net … (p1)` (`35f89ae`), `chore(…): record phase 1 sha` (`1ab577d`), `docs(…): phase 1 handoff` (`ceaf6b4`), `feat(santander-card-merchants): Santander card step — ATM, quotes, city (p2)` (`5205a19`), `chore(santander-card-merchants): record phase 2 commit sha in Progress` (`d9c805c`) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | 18 (`grep -c '^- \[ \]' plan.md`); Phase 2's 6 automated rows (2.1–2.6) ticked with sha `5205a19`; 2.7 ([reviewer]) left unticked — not mine to verify |
| Working tree | clean (`git status --porcelain` empty), `git branch --show-current` = `feat/santander-card-merchants` |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `src/lib/patterns/santander-card.ts` | New. `santanderCardMerchant(counterparty, title)`: `null` unless `title` matches the Santander card gate (mirrors `src/lib/import/santander.ts` `CARD`'s prefix+kinds only, a deliberate independent copy); ATM kind → `"Bankomat"`; payment kind → quotes→spaces, collapse, split, then up-to-3-pop positional city strip (min 1 token, `CITY_PREFIX` set of 15 two-word-city prefixes). Rule 4 (code tokens) and `Wypłata BLIK` intentionally not implemented — Phase 3. |
| `src/lib/patterns/merchant.ts` | `rawMerchant` now calls `santanderCardMerchant` first and short-circuits on non-null, before the rule 7 / D3 operator check; header comment names the Santander step. |
| `test/unit/santander-card.test.ts` | New. Synthetic-only unit cases for every contract bullet (2-/1-token tail, 2-word city, truncated second word, near-miss, repeated city, quotes mid-tail/start, mixed case, ATM dot-less `UL`, card-mask invariance, `null` for refund/BLIK/transfer/ING-style title, `null` for every ING main-fixture title). |
| `test/unit/santander-patterns.test.ts` | New. Mirrors `patterns.test.ts`'s F-02 convention for the F-03 Santander oracle: 35 derived patterns = 35 split-back oracle groups (34 patterns, ST03 user-merge split by raw), 184 ids, sum 1342109; aggregates match for every non-user-merge group; 4 named display names; cross-bank ST10 key equality and a combined-sources `PIZZERIA TRZY SERY` pattern holding both banks' ids. |
| `context/changes/santander-card-merchants/plan.md` | `## Progress` 2.1–2.6 ticked, each stamped `— 5205a19`. |
| `context/changes/santander-card-merchants/handoff.md` | This file. |

`roadmap.md` was not touched this phase (already `in-progress` from Phase 1; sync runs once at entry, not per phase).

## 3. Verification

All observed in this step, on `feat/santander-card-merchants` after the Phase 2 edits, before the commit (gate order
per the implement skill's ritual). Code was written by a delegated subagent (per Phase 1's decision #1: Phase 2 is
large enough to delegate); I read every touched file in full and ran every gate myself.

| Command | Result |
| --- | --- |
| `npx vitest run` (criterion 2.1, first pass) | 320 passed (20 files) |
| `git diff --exit-code main -- test/fixtures scripts/fixture-ing.mjs scripts/fixture-ing-check.mjs scripts/fixture-ing-shape.mjs src/lib/import/santander.ts` (criterion 2.5) | exit 0 — empty |
| Deliberate break 1 (criterion 2.2): `CARD_GATE.exec(title) ?? [title, "PŁATNOŚĆ KARTĄ"]` (gate always matches) | `test/unit/patterns.test.ts`: **8 failed** incl. the ING key-text pin (`merchantKey(rawMerchant(...))` no longer matches `ING_KEYS`) and the F-02 fixture partition (every ING row now also routes through the Santander rules, reshaping its key) — meta-check holds: the pin goes red as required; the partition going red too does not contradict the plan (it only claims the pin is the necessary direct signal, not that the partition must stay green for *this* break — unlike Phase 2's break 3). Restored via `git checkout -- src/lib/patterns/santander-card.ts`; re-ran: 48 passed |
| Deliberate break 2 (criterion 2.3): dropped the whole city-rule block, tail joined with no pops | `test/unit/santander-patterns.test.ts`: **5 of 7 failed** — fixture partition (ST02 city split), cross-bank ST10 key, combined-sources join; restored; re-ran: 7 passed |
| Deliberate break 3 (criterion 2.4): `CITY_PREFIX = new Set([])` | `test/unit/santander-card.test.ts`: exactly the **3** 2-word-city unit cases failed (`SUCHA BESKIDZKA`, `NOWY TA`, the near-miss); `test/unit/santander-patterns.test.ts` stayed green (oracle's 2-word-city groups are all single-raw, confirmed by plan-review grounding) — matches the plan's own meta-check prediction exactly; restored; re-ran: 24 passed (both files) |
| `npm run lint` | first run: 5 errors (prettier formatting ×4, `non-nullable-type-assertion-style` on `tokens.pop()!` after `lint:fix` converted the original `as string` into a forbidden `!`); fixed by replacing `pop()!` with an index-read + separate `pop()`; final run: 0 errors (attempt 2/2 convergent) |
| `npx astro check` | 0 errors, 0 warnings, 0 hints, **147 files** (baseline 144 + 3 new files) |
| `npm run fixture:check` | `fixture:check ing OK`, `fixture:check santander OK` — unchanged |
| `npm test` (re-run after lint fix) | 320 passed (20 files) — baseline 296 (post-Phase-1) + Δ24 (santander-card.test.ts 24 cases + santander-patterns.test.ts 7 cases, net of the pre-existing 7... — file counts: +2 files, +24 tests) |
| `npm run build` | server build OK, Vercel adapter bundling OK (pre-existing sitemap `site`-option warning, unrelated) |
| `npx supabase db reset` then `npx supabase test db` (sandbox disabled — Docker) | 7 migrations applied (unchanged set since S-10); pgTAP `Files=6, Tests=119, Result: PASS` — Δ0, no schema touched |
| `astro dev --port 4398` + `BASE_URL=http://localhost:4398 npm run smoke` (sandbox disabled — network) | `All smoke steps passed`, 147 PASS / 0 FAIL — Δ0 vs baseline; dev server killed afterward, `lsof -ti :4398 -ti :4399` empty |
| Real PLN export measurement (local only, counts only, sandbox disabled; symlink dir from the agent contract; jiti-loaded `parseSantanderStatement` + `buildSantanderPayload` + `rawMerchant`/`merchantKey` from this branch's own `src/`) | debit rows 466; **all keys 227; card keys 212** — exact match to the plan's R4 target (227/212/0 over). No over-merge count: the private judgement labelling from the research step lived in *that* step's own session scratchpad and is not present in this fresh session (plan.md explicitly allows "report key counts only" in that case — not an `ARTIFACT GAP`, since the export itself was readable). Harness script deleted after use; no file name or value ever printed or recorded. |

Full local gate: **green**, matches contract baseline with the expected vitest/astro-check-file-count deltas,
everything else Δ0.

## 4. Next command

`/10x-implement santander-card-merchants phase 3`

## 5. Open

- Carried from Phase 1/plan-review, unchanged: Known risks in `plan.md` (`NR` guard partial for ≥ 3 digits in
  `normalizeMerchant` `STORE_NUMBER`; `CITY_PREFIX` pop leaving one generic word; cityless `<AGG> *<MERCHANT>` tails;
  min-1-token merge risk; ASCII-only cross-bank join).
- `## Progress` row **1.6 [reviewer]** (Phase 1) and **2.7 [reviewer]** (Phase 2) — neither ticked, neither mine:
  1.6 = "`ING_KEYS` generated from pre-change code, no real-export value" (true by construction, needs human/reviewer
  tick); 2.7 = "Real-export measurement ≈ R4 (227 / 212 / 0 over), counts only" — **227/212 confirmed this step**; the
  "0 over" half is unverifiable here (no private labelling available this session) and needs either a reviewer
  re-measurement with labelling, or acceptance that the fixture's 0-over-merge proof plus the exact R4 key-count match
  stands in for it.
- [human] rows (Phase 4, unchanged, not due yet): 4.8 F-03 3.9, 4.9 S-10 6.11, 4.10 real-export owner check, 4.11
  min-1-token acceptance.
- Follow-ups: `follow-ups/review-fixes.md` FU1–FU5 unchanged.
- Phase 3 next: add rule 4 (code tokens, `NR`/`NO` guard) and the `Wypłata BLIK` rule to
  `src/lib/patterns/santander-card.ts`; new cases in `test/unit/santander-card.test.ts` and
  `test/unit/santander-patterns.test.ts`; real-export target ≈ R10 (193 / 179 / 0 over, ≤ 6 split) — see plan.md
  Phase 3 verbatim.
- DESIGN-GAP: none. Migration: none.
- ARTIFACT GAP: none — the real PLN export (via the contract's symlink dir) was readable and matched the predicted
  R4 counts exactly; only the over-merge *grading* (not the export) was unavailable this session, which plan.md
  anticipates and permits.

## 6. Autonomous decisions

1. **Exec mode: delegated Phase 2 to a `general-purpose` subagent**, writing the gate stack (lint/typecheck/
   fixture:check/vitest/build/pgTAP/smoke/deliberate breaks/staging/commit) myself. Rejected: implementing in this
   context (Phase 1's own decision #1 flagged Phase 2/3 as "larger — may delegate then": one new module, one hook
   edit, two new test files spanning the Santander *and* ING fixtures). Why: kept this session's context lean for
   the gate stack and the real-export measurement that follow. Would change: a phase whose Changes Required are
   smaller than Phase 2's — implement in-context then.
2. **Never called `AskUserQuestion`** (exec mode, commit-message approval, dirty-path prompt, next-phase decision) —
   run contract rule 1. Decided and proceeded each time; recorded here instead.
3. **Verified the subagent's work before trusting its `TOUCHED` list and `STATUS: completed` claim**: read
   `santander-card.ts`, the `merchant.ts` hook, and both new test files in full myself before running any gate
   (contract rule 5, "verify, do not inherit"). Found the code matched the plan's Critical Implementation Details
   exactly (gate regex, `CITY_PREFIX` set, 3-pop order, min-1 floor) with no adaptations needed.
4. **Lint fix required a manual follow-up**: `npm run lint:fix` auto-fixed 4 prettier issues but turned the
   subagent's `tokens.pop() as string` into `tokens.pop()!`, which trips `@typescript-eslint/no-non-null-assertion`.
   Fixed by reading the last token via index before popping (`const city = tokens[tokens.length - 1]; tokens.pop();`)
   instead of re-adding a type assertion. Rejected: disabling the rule inline (never weaken a lint rule to pass).
   Would change: nothing — this is the repo's existing no-non-null-assertion convention.
5. **Real-export over-merge count not produced.** The plan's harness reference (research's `probe/measure.ts`) and
   its "private judgement labelling... kept in the session scratchpad" were artifacts of the *research* step's own
   session, which (per the run contract) no longer exists in this fresh session. Rejected: fabricating a labelling or
   skipping the real-export measurement entirely. Chosen: built a fresh, minimal jiti-loaded harness in this
   session's scratchpad that imports this branch's actual `parseSantanderStatement` / `buildSantanderPayload` /
   `rawMerchant` / `merchantKey` against the real PLN export (via the contract's symlink dir, sandbox disabled),
   printed only `all keys` / `card keys` counts, deleted the harness after one run, and recorded the gap honestly
   under § 5 rather than ticking 2.7 myself (it is a `[reviewer]` row). Why: plan.md explicitly anticipates and
   permits this ("If the scratchpad harness/labelling is missing, report key counts only and say so"). Would change:
   if a future step restores the labelling (e.g. the orchestrator re-seeds it into a shared location outside any one
   session's scratchpad), re-run with full over-merge grading.
6. **Deliberate break 1's actual blast radius is wider than the plan's one-line prediction** (it also reddened the
   F-02 ING partition test and four `rawMerchant` rule-7 unit tests, not only the pin) — recorded verbatim in § 3
   rather than silently narrowing the observed failure to match the plan's wording, per contract rule 5. This does
   not weaken the meta-check: the pin going red is what the criterion requires, and a wider blast radius is not
   evidence the break under-tests anything.
