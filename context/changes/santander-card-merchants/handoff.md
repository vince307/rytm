# Handoff — `santander-card-merchants` (slice S-11)

Written by the `/10x-plan-review` step of run `2026-10-01-m2-santander`. Verdict PROCEED; `plan.md` amended in place
(BLIK gate tightened, first token never a code token, single-`if` city pops, three risks recorded); `change.md` is
`plan_reviewed`; no product code changed. The next agent must implement the rule order exactly as in plan.md
§ Critical Implementation Details — including `BLIK_GATE` = `^Wypłata BLIK .+:\d{11}$`, not a bare `startsWith`.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/santander-card-merchants`, cut from `main` at `9f63fd9` |
| Commits | 4 on the branch after this step's commit (`… change identity (autonomous run)`, `… research`, `… plan`, `docs(santander-card-merchants): plan review`) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` |
| `## Progress` rows remaining | 29 (`grep -c '^- \[ \]' plan.md`), unchanged — no phase split or merge |
| Roadmap | S-11 `planning` (unchanged) |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `context/changes/santander-card-merchants/reviews/plan-review.md` | Review report: 3 warnings, 2 observations, over-merge audit, `VERDICT: PROCEED` |
| `context/changes/santander-card-merchants/plan.md` | Critical Implementation Details rules 3/4 + BLIK gate, Phase 3 contract/tests, Phase 4 [human] min-1 bullet, Known risks (+3 bullets), Autonomous decisions row 15 |
| `context/changes/santander-card-merchants/follow-ups/review-fixes.md` | FU4 extended to the `CITY_PREFIX` pop |
| `context/changes/santander-card-merchants/change.md` | `status: plan_reviewed` |
| `context/changes/santander-card-merchants/handoff.md` | This file |

## 3. Verification

| Command | Result |
| --- | --- |
| `git branch --show-current` | `feat/santander-card-merchants` |
| Research probe (`<scratchpad>/probe/measure.ts` logic, copy `m2.ts` + `rules2.ts`) on fixture + real PLN export, counts only | R10 reproduces: fixture 35 keys / 0 splits / 0 over; real 193 keys / 0 over-merged / 6 split merchants (10 extra) |
| Same, first-token guard (applied) | unchanged 193 / 0 / 6 |
| Same, prefix pop needing ≥ 2 left / `NR` glue (rejected) | 194 / 0 / 7 each (+1 split) |
| Tightened `BLIK_GATE` | matches 3/3 real and 2/2 fixture `Wypłata BLIK` titles |
| `merchantKey("SKLEP NR 123")` (probe copy of `merchant.ts`) | `sklep nr` — F3 confirmed |
| Oracle checks (node over `expected.json`) | main file 184 imported / 1342109; 2-word-city groups single-raw; all 32 ING raws in the main file |
| `grep -c '^- \[ \]' plan.md` | 29 |
| lint / astro check / vitest / build / pgTAP / smoke | **not run** — review only, no code changed. Baseline inherited, unverified: contract line for `main` 9f63fd9 |

## 4. Next command

`/10x-implement santander-card-merchants phase 1`

## 5. Open

- Known risks in plan.md: `NR` guard partial for ≥ 3 digits (`normalizeMerchant` `STORE_NUMBER`); `CITY_PREFIX` pop
  can leave one generic word; cityless `<AGG> *<MERCHANT>` tails; min 1; ASCII-only cross-bank join.
- Real-export measurement harness: `<scratchpad>/probe/` (`measure.ts`, `rules.ts`, `labels.json`, plus this step's
  `m2.ts` / `rules2.ts` with the review variants). Counts only, never in the repo.
- [human] rows (plan Phase 4):
  - [ ] 4.8 F-03 3.9 — confirm the oracle's product calls.
  - [ ] 4.9 S-10 6.11 — accept re-keying of Santander card patterns.
  - [ ] 4.10 Owner imports the real Santander PLN export locally and checks the patterns (S-10 6.8).
  - [ ] 4.11 Accept min 1 token (and the `CITY_PREFIX` pop to one word) over min 2.
- Follow-ups: `follow-ups/review-fixes.md` FU1–FU5 (FU4 extended).
- DESIGN-GAP: none. Migration: none.
- ARTIFACT GAP: none.

## 6. Autonomous decisions

1. **Triage done in-plan, no questions.** Rejected: interactive triage. Why: run contract rule 1. Would change: a
   human available.
2. **F1 fixed: `BLIK_GATE` = `^Wypłata BLIK .+:\d{11}$`.** Rejected: `startsWith("Wypłata BLIK ")`. Why: the phrase
   is not bank-specific and the ING pin cannot see an ING BLIK withdrawal (none in the fixture). Would change: a real
   ING `Wypłata BLIK` title ending in `:` + 11 digits.
3. **F2 fixed: first token never dropped as a code token.** Why: closes the brand-number class at zero measured cost.
   Would change: a real chain whose descriptor starts with a store code.
4. **F3 accepted, not fixed (no `NR123` glue).** Why: +1 real split against the private labelling and an uglier
   name; same behaviour exists for ING. Would change: an observed `NR <≥3 digits>` over-merge.
5. **F4: prefix pop kept at min 1 (R10), wording made single-`if`.** Why: tightening costs +1 split and no over-merge
   was measured either way. Would change: owner rejecting [human] 4.11 → FU4.
6. **No phase split/merge.** Why: each phase is independently green and one-agent sized (Phase 4 is the largest:
   smoke + docs + sweep + visual). Would change: Phase 4 running past the context budget → split the visual gate out.
