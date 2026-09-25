# Handoff — `merchant-patterns` (slice S-03)

Written by the `new` step (`/10x-new merchant-patterns`). The change folder and `change.md` exist with every S-03 roadmap
claim checked against the repo; nothing is implemented. The one thing the next agent must not get wrong: **the operator
domain (D3) is NOT extracted at import** — `transactions.counterparty` holds the raw ING `Dane kontrahenta`; S-03 must
derive the merchant from `counterparty` + `title` itself (reference: `rawMerchant()` in `scripts/fixture-ing.mjs`).

## 1. State

| Item | Value |
|---|---|
| Branch | `feat/merchant-patterns`, cut from `main` at `d11f3ef` (pulled, up to date with `origin/main`) |
| Commits | 2 on top of `d11f3ef` (`d11f3ef..HEAD`), both `docs(merchant-patterns): change identity (autonomous run)` — the second (retry 2/2) adds `## Autonomous decisions` to `change.md` |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `new` |
| `## Progress` rows remaining | n/a — no `plan.md` yet |
| Working tree | clean apart from the maintainer's `.gitignore` and `.claude/skills/10x-autonomous-run/` (never staged) |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/merchant-patterns/change.md` | Change identity: outcome, roadmap-claim verification table (corrections), design-kit views and `content.json` keys bound, expected DESIGN-GAPs (badge-label gap now confirmed), `## Autonomous decisions` |
| `context/changes/merchant-patterns/handoff.md` | This handoff |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/merchant-patterns` (observed before writing) |
| kebab-case + uniqueness of `merchant-patterns` in `context/changes/`, `context/archive/` | OK (no collision) |
| `grep -c '^## Autonomous decisions' change.md` | 1 (retry 2/2 fix) — observed |
| `content.json` `components` / `patterns` read | no `stały`/`częsty` badge key — gap confirmed, observed |
| `python3` read of `test/fixtures/ing/expected.json` | 30 patterns (24 normalization / 4 import / 1 user-merge / 1 user-exclude), 206 imported rows — observed |
| lint / astro check / vitest / build / pgTAP / smoke | not run — docs-only step, no code touched; baseline on `main` per run log (inherited, unverified here): lint 0, astro check 0/0/0, vitest 32/32, pgTAP 44/44, smoke 46/46 |

## 4. Next command

`/10x-research merchant-patterns`

## 5. Open

- **Storage decision** (roadmap claims a new merchants/patterns table): derived-on-read over `transactions` vs stored table — resolve in research/plan; see `change.md` table. Reversal pressure comes from S-05 (durable decisions need a table keyed by merchant).
- **Test oracle**: `expected.json` `patterns[]` merges T01 (`sportowo`) and excludes nothing; S-03 must expect T01 as two patterns (user-merge is S-05) and T08 (`przelew-konto-osobiste`) visible.
- **DESIGN-GAP candidates** (to be registered at plan/implement in `context/foundation/design-kit.md`, next id after K16 / G27): fixed-amount column („kwota dla stałych”, FR-007) absent from `patterns.columns`; `stały`/`częsty` badge copy only in `app.js` (confirmed absent from `content.json` `components`); row link to detail (S-04) not yet available; table-foot copy only in `app.js`.
- **G26** (`src/pages/imports/result.astro`, frontmatter comment): S-03 could restore `importFlow.result` + pattern stat — plan decides.
- Open Question 2 (operator list) — start list `PayPro, PayU, Cashbill, Autopay, ING Pay` (`OPERATORS` in `scripts/fixture-ing.mjs`); where the app's list lives is a plan decision.

## 6. Autonomous decisions

- **Did not STOP after creating `change.md`** (skill says display next step and wait). Chosen: continue to verification + commit per the run's contract. Rejected: waiting for a human. Why: no human in the loop. Would change: a maintainer message pausing the run.
- **Next step = `/10x-research`, not the skill's default `/10x-plan`.** Why: three unresolved grounding questions (D3 not done at import, derived vs stored patterns, oracle adaptation for S-05-only resolutions) need codebase research before a plan. Rejected `/10x-frame`: the framing (FR-007 list) is not suspect. Would change: if the orchestrator's fixed chain skips research, `/10x-plan` can read `change.md` directly.
- **Title in Polish** (`Lista wykrytych wzorców sprzedawców (S-03)`), matching the repo's Polish commit/log language. Would change: a maintainer preference for English titles.
- **Did not pre-decide the storage model**; recorded the roadmap's "own migration" claim as open rather than correct/incorrect. Why: it is a design trade-off, not a fact check. Would change: research showing S-04/S-05 need per-pattern ids now (then a table is warranted in S-03).
- **Did not register DESIGN-GAP rows yet** — listed as candidates only. Why: `new` writes identity, not kit edits; gap ids should be assigned when the plan fixes what the view renders. Would change: the contract requiring gaps at `new`.
- **Retry 2/2: kept the existing folder and added a second commit** rather than amending the first. Why: the previous attempt's `change.md` lacked `## Autonomous decisions`; a new commit keeps history append-only (no rewrite). Rejected: `git commit --amend`. Would change: the orchestrator requiring exactly one commit per docs step (then squash at Ship).
