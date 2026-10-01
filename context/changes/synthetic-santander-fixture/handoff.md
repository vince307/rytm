# Handoff — `synthetic-santander-fixture` (slice F-03)

Written by the `/10x-plan-review` step: verdict PROCEED, four warnings fixed in `plan.md`, `change.md` is
`plan_reviewed`. The next agent must not let the plan touch `scripts/fixture-ing*.mjs` or `test/fixtures/ing/`
(byte-exact ING fixture), and no value from the real exports may enter the repo, a commit or a report.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/synthetic-santander-fixture`, cut from `main` at `5e61822` |
| Commits | 4 on the branch (`24ad875` identity, `1d7c4d5` research, `0b514cb` plan, this step `docs(synthetic-santander-fixture): plan review`) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` |
| `## Progress` rows remaining | 26 (`grep -c '^- \[ \]' plan.md`; +1 = new `[human]` row 3.9) |
| Working tree | clean after the commit (only this step's four files staged) |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `context/changes/synthetic-santander-fixture/reviews/plan-review.md` | Plan review: 0 critical, 4 warnings (fixed), 3 observations, S-10/S-11 fitness, `VERDICT: PROCEED` |
| `context/changes/synthetic-santander-fixture/plan.md` | Fixes: ST04 ATM raw contract, header invariants paragraph + check 2 rules, S-11 over-merge noise + ST10 type, `crossBank` type check, Phase 3 doc line, `[human]` criterion + Progress 3.9, `## Known risks` |
| `context/changes/synthetic-santander-fixture/change.md` | `status: planned → plan_reviewed` |
| `context/changes/synthetic-santander-fixture/handoff.md` | This file |

## 3. Verification

| Command | Result |
| --- | --- |
| `git branch --show-current` | `feat/synthetic-santander-fixture` (observed) |
| Grounding (`ls -l` 9 paths, grep 6 symbols, ING oracle via `node -e`) | all present (observed) |
| `git grep fixture:check / fixture-ing-check` outside context | only `ci.yml`, `CLAUDE.md`, `package.json`, ING comments (observed) |
| Follow-up triggers naming F-03/Santander/fixture | none (observed, grep over `context/archive/*/follow-ups/`) |
| Real-export invariant scan (sandbox disabled, scratchpad script, booleans/counts only) | opening+Σ==closing, closing==Lp1, LpN balance−amount==opening, unique max booking on Lp1, file name ↔ header: all true on both files; no clean balance chain in file/booking order (observed) |
| Progress ↔ criteria | 9+8+9 = 26, one-to-one (observed) |
| lint, astro check, fixture:check, vitest, build, pgTAP, smoke | Not run — docs-only step. Baseline (inherited, unverified): see run contract |

## 4. Next command

`/10x-implement synthetic-santander-fixture phase 1`

## 5. Open

- Manual-only Progress rows: `[reviewer]` 1.8 trap coverage, 1.9 privacy overlap scan, 2.8 check rules vs real export,
  3.7 shape comparison on the real exports (list the cleaner balance chain as explained), 3.8 doc/README agreement —
  agent-doable, reading the real exports needs the sandbox disabled. `[human]` 3.9 product calls (`Wypłata BLIK` own
  pattern, ST03 user-merge, `Oplata za …` fixed) — stays open for the maintainer.
- Known risks in `plan.md` § Known risks: S-10 partial overlap needs a test-built variant; fixture balances cleaner
  than real.
- For S-11 (not this slice): city-tail stripping in `normalizeMerchant` (`src/lib/patterns/merchant.ts`) for ST10;
  ATM → `bankomat` mapping is S-11 normalization (ST04, plan review F1).
- For S-10 (not this slice): kit copy `importFlow.supported` / `importErrors.unknownFormat` say Santander „wkrótce”;
  `src/lib/import/schema.ts` requires the ING 18-digit ID; `imports.source` allows only `'ing'`.
- No DESIGN-GAP, no migration, no follow-ups file.

## 6. Autonomous decisions

- **ATM raw = address tail, `bankomat` via S-11 normalization** (rejected: parser maps to „bankomat”, as the doc's
  regex arrow says). Why: roadmap gives the ATM outcome to S-11 and the raw keeps information. Would change if S-11's
  plan prefers a parser rule — then generator, manifest and doc change together.
- **Product calls kept, `[human]` row added** (rejected: overturning them). None contradicts PRD FR-006/FR-009/FR-018;
  reversible by editing the generator. Would change if the maintainer answers 3.9 otherwise.
- **No sub-agent for codebase verification** (rejected: the skill's single sub-agent). Every risky claim was a
  one-command check done directly. Would change for a plan touching many modules.
- **Real exports opened for boolean invariant checks only** — to ground F2; no value printed. Would change if the
  contract forbade review steps from opening them (it allows "later steps that must re-check a shape").
- **Verdict PROCEED, not RETHINK** — approach is the proven ING pattern; issues were local. Would change if the
  aggregator could not import ING `check()` without side effects (verified it can).
