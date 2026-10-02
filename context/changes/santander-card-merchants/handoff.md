# Handoff — `santander-card-merchants` (slice S-11)

Written by the `/10x-implement` Phase 4 step (last phase) of run `2026-10-01-m2-santander`. All 4 plan phases are
implemented, gated and committed; `change.md` is now `implemented`. The next agent must not treat this as "done":
9 manual Progress rows ([reviewer]/[visual]/[human], listed in §5) are still open — this step surfaced them per the
contract but did not and could not verify any of them itself.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/santander-card-merchants`, cut from `main` at `9f63fd9` |
| Commits | 13 on the branch (`main..HEAD`): change identity, research, plan, plan review, `feat(…): safety net … (p1)` (`35f89ae`), `chore(…): record phase 1 sha` (`1ab577d`), `docs(…): phase 1 handoff` (`ceaf6b4`), `feat(…): Santander card step … (p2)` (`5205a19`), `chore(…): record phase 2 sha` (`d9c805c`), `docs(…): phase 2 handoff` (`4c1d772`), `feat(…): code tokens and BLIK withdrawals (p3)` (`9137d9e`), `chore(…): record phase 3 sha` (`36186f0`), `docs(…): phase 3 handoff` (`415944f`), `feat(santander-card-merchants): end-to-end proof, docs and seam sweep (p4)` (`2c4d989`), `chore(santander-card-merchants): close out plan (epilogue)` (`5bc2a49`) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implemented` |
| `## Progress` rows remaining | 9 (`grep -c '^- \[ \]' plan.md`) — all manual, none mine: 1.6, 2.7, 3.5 (carried from earlier phases) + 4.6–4.11 (this phase: `[visual]` 4.6, `[reviewer]` 4.7, `[human]` 4.8–4.11) |
| Working tree | clean (`git status --porcelain` empty; `.claude/skills/10x-autonomous-run/scripts/tree-clean.sh` prints `CLEAN`), `git branch --show-current` = `feat/santander-card-merchants` |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `scripts/smoke.mjs` | Extended. New `santanderCardPayload` (2 card payments to one merchant in 2 cities + 2 ATM withdrawals at 2 addresses, June 2026, on the already-used re-created account `22222200000000000000000099`, disjoint from the May payload) and `ingPizzeriaPayload` (ING, new account `11111100000000000000000097`, one debit, fresh `bankTxId` `000000000000000010`). 4 new steps inserted between "santander import with a bank transaction id is rejected" and "delete re-created account (cleanup)": both imports saved, `/patterns` contains `>PIZZERIA SMOKE<` and notContains `>PIZZERIA SMOKE KRAKOW<`/`>PIZZERIA SMOKE WARSZAWA<`, `/patterns` contains `>Bankomat<` and notContains `>UL SMOKOWA 5 KRAKOW<`. All synthetic values; diff vs `main` is additions-only (verified). |
| `context/foundation/import-formats.md` | Extended. Rule-5/ATM "bankomat" wording switched from future ("dopiero po normalizacji S-11") to present, two spots. BLIK end-shape note added (real exports end ` ref:<11 cyfr>`, fixture ends bare `:<11 cyfr>` — shape only, no value). New `### Normalizacja sprzedawcy (S-11)` paragraph after rule 7: title gate, rule order, min-1-token, `Bankomat`/`Wypłata BLIK`, ASCII-only cross-bank join, pointing at `santander-card.ts`. |
| `CLAUDE.md` | `npm test` bullet extended to name the Santander merchant-pattern partition/cross-bank join test and the ING key-text pin. |
| `src/lib/import/santander.ts` | `rawMerchantOf` comment extended: normalisation of the card/ATM tail happens read-time in the patterns layer (`santander-card.ts`, S-11), not in this reader. |
| `context/changes/santander-card-merchants/plan.md` | `## Progress` 4.1–4.5 ticked, stamped `— 2c4d989`. |
| `context/changes/santander-card-merchants/change.md` | `status: implemented`. |
| `context/changes/santander-card-merchants/handoff.md` | This file. |

`roadmap.md` was not touched this phase (sync runs once at entry, already `in-progress`; `/10x-archive` flips it to `done` later).

## 3. Verification

All observed in this step, on `feat/santander-card-merchants` after the Phase 4 edits, before the commit. Code was
written by a delegated `general-purpose` subagent (decision 1 below); I read every touched file in full (diffs
reviewed against the plan's exact contract) and ran every gate myself.

| Command | Result |
| --- | --- |
| `npm run lint` | 0 errors |
| `npx astro check` | 0 errors, 0 warnings, 0 hints, 147 files — unchanged from Phase 3 baseline |
| `npm run fixture:check` | `fixture:check ing OK`, `fixture:check santander OK` |
| `npx vitest run` (first pass) | 335 passed (20 files) — Δ0 vs Phase 3 baseline (Phase 4 adds no new vitest files/cases, only smoke + docs) |
| `git diff --exit-code main -- test/fixtures scripts/fixture-ing.mjs scripts/fixture-ing-check.mjs scripts/fixture-ing-shape.mjs design/` | exit 0 — empty (criterion 4.4) |
| Seam greps (criterion 4.3) | `grep -rn "DOP\. VISA" src/lib/patterns` → one file (`santander-card.ts`) only; `grep -rn "S-11 will\|dopiero po normalizacji S-11" src scripts/smoke.mjs context/foundation/import-formats.md` → empty (after the docs edit); `grep -rn "TODO" src/lib/patterns test/unit/santander-card.test.ts test/unit/santander-patterns.test.ts` → empty; `grep -n "K27\|G38" context/foundation/design-kit.md` → empty (no kit row needed) |
| `astro dev --port 4398` + `BASE_URL=http://localhost:4398 npm run smoke` (criterion 4.1, sandbox disabled — network) | `All smoke steps passed`, **151 PASS / 0 FAIL** = baseline 147 + Δ4 (the two new imports + the two new `/patterns` assertions) |
| `git diff main -- scripts/smoke.mjs \| grep '^-' \| grep -v '^---'` | empty — diff vs `main` is additions-only |
| Deliberate break (criterion 4.2): `src/lib/patterns/merchant.ts` `rawMerchant` — `const card = null as string \| null; // DELIBERATE BREAK` instead of calling `santanderCardMerchant` | smoke: exactly the 2 new steps failed (`patterns join the santander and ing pizzeria rows into one merchant`, `patterns join the santander atm withdrawals into one Bankomat pattern`), 149 PASS / 2 FAIL. **Meta-check holds**: matches the plan's prediction exactly, narrow blast radius — no other smoke step touches Santander-card normalisation, so skipping the step breaks only what it's supposed to protect. Restored via `git checkout -- src/lib/patterns/merchant.ts` (staged version); re-ran: 151 PASS / 0 FAIL |
| `npm test` (re-run, confirming no regression after the break/restore cycle) | 335 passed (20 files) — Δ0 |
| `npm run build` | server build OK, Vercel adapter bundling OK (pre-existing sitemap `site`-option warning, unrelated, same as every earlier phase) |
| `npx supabase db reset` then `npx supabase test db` (sandbox disabled — Docker) | 7 migrations applied (unchanged set since S-10); pgTAP `Files=6, Tests=119, Result: PASS` — Δ0 |
| `BASE_URL=http://localhost:4398 npm run smoke` (re-run after `db reset`, criterion 4.5 final confirmation) | `All smoke steps passed`, 151 PASS / 0 FAIL; dev server killed afterward, `lsof -ti :4398 -ti :4399` empty |
| `npx prettier --check context/foundation/import-formats.md` | warns (unformatted) — **confirmed pre-existing on `main`** via `git stash` + re-check (not introduced this phase; `.md` prettier is not part of `npm run lint` or any gate) |

Full local gate: **green**, matches contract baseline with vitest/pgTAP/astro-check at Δ0 and smoke at baseline+4, as
the plan's criterion 4.5 requires.

## 4. Next command

`/10x-impl-review santander-card-merchants`

## 5. Open

- Carried from Phases 1–3, unchanged: Known risks in `plan.md` (min-1-token merge risk; `CITY_PREFIX` pop leaving
  one generic word; cityless `<AGG> *<MERCHANT>` tails; ASCII-only cross-bank join; the `NR`/`NO` guard's partial
  protection against `normalizeMerchant`'s `STORE_NUMBER`). None of these needed touching in Phase 4.
- `## Progress` manual rows, all open, none mine to tick:
  - **1.6** `[reviewer]` `ING_KEYS` generated from pre-change code, no real-export value — carried from Phase 1.
  - **2.7** `[reviewer]` Real-export measurement ≈ R4 (227/212/0 over) — carried from Phase 2.
  - **3.5** `[reviewer]` Real-export measurement ≈ R10 (193/179/0 over, ≤ 6 split) — carried from Phase 3, confirmed
    with an actual over-merge judgment in that phase's handoff.
  - **4.6** `[visual]` Screenshots at 1280px and ~400px: `/patterns` list, filtered "pizzeria", pattern detail of
    `PIZZERIA TRZY SERY` and `Bankomat`, `/fixed` — vs kit `patterns.html`/`pattern-wolt.html`/`fixed.html`. Needs
    the local test account with the ING + Santander main fixtures imported (deleted afterward); belongs to the
    orchestrator's visual gate, not an implement step.
  - **4.7** `[reviewer]` Seam sweep complete, rule order matches Critical Implementation Details, no real-export
    value anywhere in the diff. I performed my own seam sweep this step (§3 greps + reading every touched file +
    the subagent's own sweep, reported in its hand-back) but this row is explicitly `[reviewer]`-gated by the plan,
    so I left it unticked rather than self-certifying.
  - **4.8–4.11** `[human]`: F-03 3.9 (confirm oracle's product calls), S-10 6.11 (accept Santander re-keying),
    owner imports the real PLN export and checks patterns (S-10 6.8), accept min-1-token over min-2 (decision 3).
    None due to this step; human-only by design.
- Follow-ups: `follow-ups/review-fixes.md` FU1–FU5 unchanged — reviewed this step (seam-sweep item 6), none
  triggered by Phase 4's changes (no fixture edits, no operator-rule changes, no re-key).
- DESIGN-GAP: none (confirmed by seam sweep, `K27`/`G38` grep empty). Migration: none.
- ARTIFACT GAP: none. No real Santander export was opened this step (Phase 4 touches no real-data path); the
  private workspace (`context/runs/2026-10-01-m2-santander/private/p3-*.txt`) was left untouched, not re-read, not
  quoted.
- Plan completion: every `## Progress` row across all 4 phases is now either `[x]` (automated, with a sha) or an
  open manual row (`[reviewer]`/`[visual]`/`[human]`). No `- [ ]` automated row remains. `/10x-impl-review` (next
  command) should review the whole plan (no phase number given), since this was the last phase.

## 6. Autonomous decisions

1. **Exec mode: delegated Phase 4 to a `general-purpose` subagent**, writing the smoke/doc/seam-sweep edits myself
   verifying and the gate stack (lint/typecheck/fixture:check/vitest/build/pgTAP/smoke/deliberate break/staging/
   commit/epilogue) myself. Rejected: implementing in this context. Why: consistent with Phases 2–3's same
   decision; kept this session's context lean for the gate stack, which for the last phase also includes the
   epilogue. Before dispatching I did my own research (traced `santanderCardMerchant`, `rawMerchant`,
   `PatternsTable.tsx`'s rendering, the exact tail/title shapes needed) and handed the subagent the worked-out
   payload values and docs line numbers directly in its prompt, rather than letting it re-derive them — this
   avoided a likely failure mode (getting the `counterparty`/`title` split wrong for the synthetic card rows).
   Would change: a phase small enough to implement in one shot without the research-first step.
2. **Never called `AskUserQuestion`** (exec mode, manual-verification pause, commit-message approval, dirty-path
   prompt, straggler-rows prompt at the plan-completion epilogue — none of these fired as interactive prompts this
   phase) — run contract rule 1. Decided and proceeded each time; recorded here instead. Specifically: proceeded
   straight to the epilogue commit with 9 manual rows still open, per this task's explicit instruction ("even with
   [reviewer]/[visual]/[human] rows open"), rather than the skill's default "Pause" straggler option.
3. **Verified the subagent's work before trusting its `TOUCHED`/`STATUS: completed` claim**: read the full diff of
   all 4 touched files against the plan's exact contract text (smoke payload values, docs paragraph content, the
   `rawMerchantOf` comment), re-derived the merchant-normalisation trace by hand (city-pop, code-token drop) to
   confirm the chosen synthetic values ("PIZZERIA SMOKE" in two cities, two ATM addresses) actually produce the
   needles the smoke assertions check for — before running any gate. The subagent's own uncertainties (prettier
   pre-existing warning, the smoke header-comment convention, the "shared helper" seam-sweep judgment) were each
   independently checked here (git stash re-check for the prettier claim; read both test files to confirm the
   loaders are oracle-specific, not duplicated).
4. **Confirmed the prettier `import-formats.md` warning is pre-existing on `main`** (via `git stash` + re-check)
   rather than treating it as a lint gate failure — it's not: `npm run lint` is ESLint only, and `.md` prettier is
   not in any of this plan's success criteria or the contract's verification gate. Rejected: running
   `npx prettier --write` on the file as a drive-by fix (out of Phase 4's scope; the plan does not ask for it).
   Would change: a future phase that actually touches `.md` prettier formatting as part of its contract.
5. **Proceeded to the epilogue commit immediately after the phase-4 commit**, in the same step, rather than
   stopping after p4 and waiting for a separate step to run the epilogue. Why: the run contract's context-hygiene
   rule (write handoff and return at ~300k) wasn't yet triggered, and the task instructions explicitly say "after
   it is committed run the skill's epilogue → status implemented". Would change: nothing — this is what the task
   asked for.
