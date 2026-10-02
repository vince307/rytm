# Handoff — `santander-card-merchants` (slice S-11)

Written by the `/10x-implement` Phase 3 step of run `2026-10-01-m2-santander`. Phase 3 (code tokens, `Wypłata BLIK`)
is implemented, gated and committed. The next agent must trust that rule 4's `NR`/`NO` guard only protects 1–2-digit
numbers (a kept `NR 123` still loses `123` to the global `STORE_NUMBER` rule) — that is a **documented, accepted
risk**, not a bug to "complete" while touching `santander-card.ts` for Phase 4.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/santander-card-merchants`, cut from `main` at `9f63fd9` |
| Commits | 11 on the branch (`main..HEAD`): change identity, research, plan, plan review, `feat(…): safety net … (p1)` (`35f89ae`), `chore(…): record phase 1 sha` (`1ab577d`), `docs(…): phase 1 handoff` (`ceaf6b4`), `feat(…): Santander card step … (p2)` (`5205a19`), `chore(…): record phase 2 sha` (`d9c805c`), `docs(…): phase 2 handoff` (`4c1d772`), `feat(santander-card-merchants): code tokens and BLIK withdrawals (p3)` (`9137d9e`), `chore(santander-card-merchants): record phase 3 commit sha in Progress` (`36186f0`) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | 14 (`grep -c '^- \[ \]' plan.md`); Phase 3's 4 automated rows (3.1–3.4) ticked with sha `9137d9e`; 3.5 (`[reviewer]`) left unticked — not mine to verify |
| Working tree | clean (`git status --porcelain` empty), `git branch --show-current` = `feat/santander-card-merchants` |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `src/lib/patterns/santander-card.ts` | Extended. Added `BLIK_GATE` (`^Wypłata BLIK .+:\d{11}$`) as an independent top-level gate checked when `CARD_GATE` doesn't match (`"Wypłata BLIK"` or `null`); added `dropCodeTokens` (rule 4) — drops a non-first store/till-code token (`CODE_TOKEN`, `K_DOT_TOKEN`, bare `#`) unless the previous token is `NR`/`NO` (`NR_GUARD`), strips trailing digits from a glued `<word><digits>` token (`GLUED_DIGITS`), never empties the tail. Called between the existing city rule and the final join. Header comment extended to name Phase 3 and the BLIK gate's rationale. |
| `src/lib/patterns/merchant.ts` | Unchanged this phase (confirmed by reading it — `rawMerchant` already calls `santanderCardMerchant` first and short-circuits on non-null; the new BLIK gate needs no new caller). |
| `test/unit/santander-card.test.ts` | Extended. New `describe` "rule 4 (code tokens)" (8 `it.each` rows + 2 dedicated `it`s: same-key-across-cities, NR-guard 1–2-digit differentiation) and "BLIK withdrawal gate" (fixture `:<11 digits>` shape, real ` ref:<11 digits>` shape, same-key-across-counterparties via `merchantKey`, ING-shaped title → `null`). Synthetic values only. |
| `test/unit/santander-patterns.test.ts` | Extended. One new `it`: "ST06 (Wypłata BLIK withdrawals) is its own pattern, not merged into Bankomat" — pins the oracle's ST06 id-set to a non-`Bankomat`-named pattern, independent of the existing 35-group/id-set assertion. |
| `context/changes/santander-card-merchants/plan.md` | `## Progress` 3.1–3.4 ticked, each stamped `— 9137d9e`. |
| `context/runs/2026-10-01-m2-santander/private/p3-multi-tail-keys.txt`, `p3-card-keys-sorted.txt` | New (gitignored, never committed — confirmed absent from `git status --porcelain` and from the commit diff). Real-PLN-export over-merge labelling and the full sorted card-key list, written this step per the contract's "labelling lives in the private workspace" rule. |
| `context/changes/santander-card-merchants/handoff.md` | This file. |

`roadmap.md` was not touched this phase (already `in-progress`; sync runs once at entry, not per phase).

## 3. Verification

All observed in this step, on `feat/santander-card-merchants` after the Phase 3 edits, before the commit (gate order
per the implement skill's ritual). Code was written by a delegated `general-purpose` subagent (decision 1 below); I
read every touched file in full and ran every gate myself.

| Command | Result |
| --- | --- |
| `npx vitest run` (criterion 3.1, first pass) | 335 passed (20 files) — baseline (post-Phase-2) 320 + Δ15 (8 it.each + 2 `it` rule-4 cases, 4 BLIK-gate `it`s, 1 ST06-own-pattern `it` = 15) |
| `git diff --exit-code main -- test/fixtures scripts/fixture-ing.mjs scripts/fixture-ing-check.mjs scripts/fixture-ing-shape.mjs src/lib/import/santander.ts` | exit 0 — empty |
| Deliberate break 1 (criterion 3.2): removed the `NR` guard (`const guarded = false`) | `test/unit/santander-card.test.ts`: **1 failed** — exactly `the NR guard protects a 1-2 digit number from being dropped as a code token` (`"SKLEP NR 12"` → `"SKLEP NR"`, collapsing with the `NR 7` case); the other 30 cases in the file stayed green. Meta-check holds: matches the plan's prediction exactly, no wider blast radius this time (unlike Phase 2's break 1) — the `NR` guard is narrowly load-bearing for exactly this one case, as the plan says. Restored via `git checkout -- src/lib/patterns/santander-card.ts`; re-ran: 31 passed |
| Deliberate break 2 (criterion 3.3): BLIK rule returns `"Bankomat"` instead of `"Wypłata BLIK"` | `test/unit/santander-patterns.test.ts`: **3 of 6 failed** — the new ST06-own-pattern assertion (as predicted), **and** the 35-group fixture-partition test (35→34, since the BLIK rows now merge into the existing `Bankomat` group) and the aggregates test (`no oracle group for Bankomat`, since the merged group's id-set no longer matches any single oracle group). Meta-check holds: wider blast radius than the plan's one-line prediction is not a weakness (contract rule 5 precedent from Phase 2) — a merge that changes pattern *shape* necessarily also breaks the shape-level tests, which is stronger evidence the suite catches the regression, not weaker. Restored via `git checkout -- src/lib/patterns/santander-card.ts`; re-ran: 39 passed (both files) |
| `npm run lint` | 0 errors, first pass (no fix needed this phase — the subagent's code matched the repo's lint conventions, including the existing `no-non-null-assertion` convention) |
| `npx astro check` | 0 errors, 0 warnings, 0 hints, **147 files** — unchanged from Phase 2 baseline (no new files this phase, only edits) |
| `npm run fixture:check` | `fixture:check ing OK`, `fixture:check santander OK` — unchanged |
| `npm test` (re-run, confirming no regression after the break/restore cycles) | 335 passed (20 files) — Δ0 vs the first pass above |
| `npm run build` | server build OK, Vercel adapter bundling OK (pre-existing sitemap `site`-option warning, unrelated, same as Phase 2) |
| `npx supabase db reset` then `npx supabase test db` (sandbox disabled — Docker) | 7 migrations applied (unchanged set since S-10); pgTAP `Files=6, Tests=119, Result: PASS` — Δ0, no schema touched |
| `astro dev --port 4398` + `BASE_URL=http://localhost:4398 npm run smoke` (sandbox disabled — network) | `All smoke steps passed`, 147 PASS / 0 FAIL — Δ0 vs baseline; dev server killed afterward, `lsof -ti :4398 -ti :4399` empty |
| Real PLN export measurement (local only, sandbox disabled; symlink dir from the agent contract; jiti-loaded `parseSantanderStatement`/`buildSantanderPayload`/`rawMerchant`/`merchantKey` from this branch's own `src/`), run twice: once for counts, once grouping distinct raw card tails by resulting key for the over-merge judgment | debit rows 466; **all keys 193; card keys 179** — exact match to the plan's R10 target (193/179/0 over). **Over-merge check performed this step** (unlike Phase 2, where the private labelling was unavailable): 14 card keys have more than one distinct raw tail merged into them; I judged all 14 by eye (chain/branch names of national retail and fast-food chains and found **0 over-merges** (no two unrelated merchants sharing a key). Separately scanned the 179 sorted card keys for likely split merchants (under-merge): ~4 candidates (one fast-food chain across 5 keys — comma and truncated/aggregator city shapes not recognised by the city rule; one convenience chain across 3 keys (store-format and legal-entity billing), one streaming subscription across 2 keys (legal-entity vs card-tail shape), one catering service across 2 keys — a `Sp. z o.o` variant the `LEGAL_FORM` regex likely doesn't match byte-for-byte), within the plan's "≤ 6 split" R10 prediction. Full labelling written to `context/runs/2026-10-01-m2-santander/private/p3-multi-tail-keys.txt` (never committed, never quoted beyond counts here). Harness scripts deleted from the repo root after use; no file name, raw value, account number or merchant name printed to this report. |

Full local gate: **green**, matches contract baseline with the expected vitest-count delta, astro-check file count
unchanged (no new files this phase), everything else Δ0.

## 4. Next command

`/10x-implement santander-card-merchants phase 4`

## 5. Open

- Carried from Phase 1/2/plan-review, unchanged: Known risks in `plan.md` (min-1-token merge risk; `CITY_PREFIX` pop
  leaving one generic word; cityless `<AGG> *<MERCHANT>` tails; ASCII-only cross-bank join). The `NR`/`NO` guard risk
  (`santander-card.ts` `NR_GUARD`, `normalizeMerchant` `STORE_NUMBER` in `src/lib/patterns/merchant.ts`) is now
  **implemented as specified and confirmed partial by design** (deliberate break 1 above) — not a gap, the documented
  behaviour.
- `## Progress` rows **1.6**, **2.7** (unticked, not mine, carried) and **3.5 [reviewer]** (Phase 3, new) — "Real-
  export measurement ≈ R10 (193 / 179 / 0 over, ≤ 6 split), counts only": **193/179/0-over confirmed this step** with
  an actual over-merge judgment (not just counts, unlike Phase 2); the ~4-split-merchant estimate is this step's own
  independent scan, not cross-checked against research's original labelling (not present in `private/` at the start
  of this step — my `p3-multi-tail-keys.txt` is now that labelling for Phase 4 or a reviewer to reuse/extend).
- [human] rows (Phase 4, unchanged, not due yet): 4.8 F-03 3.9, 4.9 S-10 6.11, 4.10 real-export owner check, 4.11
  min-1-token acceptance.
- Follow-ups: `follow-ups/review-fixes.md` FU1–FU5 unchanged.
- Phase 4 next: smoke end-to-end proof (`scripts/smoke.mjs` Santander+ING join, ATM pattern), docs
  (`import-formats.md`, `CLAUDE.md`), seam sweep (comments, stale wording, `TODO` greps) — see plan.md Phase 4
  verbatim. Phase 4 is the plan's last phase; its manual-verification gate message must surface the still-pending
  manual rows from Phases 1–3 (1.6, 2.7, 3.5) per the implement skill's "batched cross-phase manual checks" rule.
- DESIGN-GAP: none. Migration: none.
- ARTIFACT GAP: none — the real PLN export (via the contract's symlink dir) was readable and matched the predicted
  R10 counts exactly; the over-merge judgment was completed this step (see §3), closing the gap Phase 2 had left
  open for this phase.

## 6. Autonomous decisions

1. **Exec mode: delegated Phase 3 to a `general-purpose` subagent**, writing the gate stack (lint/typecheck/
   fixture:check/vitest/build/pgTAP/smoke/deliberate breaks/staging/commit) and the real-export over-merge check
   myself. Rejected: implementing in this context. Why: kept this session's context lean for the gate stack and the
   real-export measurement (a new over-merge judgment, not just counts this time); consistent with Phase 2's same
   decision for a phase of comparable size (one new rule + a new gate + synthetic test cases across two files).
   Would change: a phase small enough to implement in one shot without a subagent round-trip.
2. **Never called `AskUserQuestion`** (exec mode, commit-message approval, dirty-path prompt — none occurred this
   phase since the tree stayed clean of unrelated dirt, next-phase decision) — run contract rule 1. Decided and
   proceeded each time; recorded here instead.
3. **Verified the subagent's work before trusting its `TOUCHED` list and `STATUS: completed` claim**: read
   `santander-card.ts` in full (both the gate logic and the new `dropCodeTokens` helper), both new test-file diffs,
   and re-confirmed `merchant.ts` needed no change, before running any gate (contract rule 5). The subagent could
   not run tests itself (per its own hard boundary) and instead hand-traced every case — I independently verified
   with the actual gate stack (deliberate breaks, vitest) rather than trusting the hand-trace.
4. **Performed the real-export over-merge check myself this step**, unlike Phase 2 (which reported counts only
   because the private labelling was unavailable). Chosen: grouped all card rows' raw `counterparty` tails by their
   resulting key, flagged the 14 keys with more than one distinct raw tail, and judged each by eye (chain/brand
   recognition) for same-merchant-vs-over-merge; separately scanned the full sorted key list for likely split
   merchants (under-merge). Rejected: reporting counts only again (the task instructions for this step explicitly
   require the over-merge check, not merely the plan's own fallback permission). Why: the private workspace was
   empty at the start of this step, and this step's token budget and sandbox access (the symlink dir, Docker/network
   already disabled) made it practical to do properly rather than defer again. Would change: nothing — this is now
   done; a future step should reuse `p3-multi-tail-keys.txt` rather than re-deriving.
5. **Judged the ~4 observed split merchants as within the plan's "≤ 6 split" R10 target** without cross-checking
   research's original (now-vanished) labelling. Rejected: treating the lack of a cross-check as an `ARTIFACT GAP`
   — the export itself was readable and the counts matched exactly; only the *original* labelling artifact was
   missing, and the plan anticipates a step producing a fresh one. Would change: a future reviewer finding my
   4-merchant estimate significantly off from a reconstructed original labelling — then this file's estimate should
   be corrected, not trusted blindly.
