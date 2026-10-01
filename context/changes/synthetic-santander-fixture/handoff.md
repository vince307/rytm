# Handoff — `synthetic-santander-fixture` (slice F-03)

Written by the `/10x-plan` step: `plan.md` (3 code phases, `## Progress` 25 rows) and `plan-brief.md` exist,
`change.md` is `planned`, roadmap F-03 is `planning`. The next agent must not let the plan touch
`scripts/fixture-ing*.mjs` or `test/fixtures/ing/` (byte-exact ING fixture), and no value from the real exports may
enter the plan, the repo or a report.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/synthetic-santander-fixture`, cut from `main` at `5e61822` |
| Commits | 3 on the branch (`24ad875` identity, `1d7c4d5` research, this step `docs(synthetic-santander-fixture): plan`) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `planned` (set by `metadata-guard.mjs mark-planned`) |
| `## Progress` rows remaining | 25 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the commit (only this step's five files staged) |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `context/changes/synthetic-santander-fixture/plan.md` | Plan: 3 phases (generator + files; check + two-bank aggregator; shape comparator + `import-formats.md` + seam sweep), `## Autonomous decisions`, `## Progress` |
| `context/changes/synthetic-santander-fixture/plan-brief.md` | Two-page brief |
| `context/changes/synthetic-santander-fixture/change.md` | Frontmatter `status: preparing → planned` |
| `context/foundation/roadmap.md` | F-03 status `ready → planning` (at-a-glance row and body) |
| `context/changes/synthetic-santander-fixture/handoff.md` | This file |

## 3. Verification

| Command | Result |
| --- | --- |
| `git branch --show-current` | `feat/synthetic-santander-fixture` (observed) |
| `metadata-guard.mjs inspect` / `mark-planned` | observed: change.md hash matched, `changed: true` |
| Progress ↔ Success Criteria mapping | observed: P1 7+2, P2 7+1, P3 6+2 = 25 rows, one-to-one |
| lint, astro check, fixture:check, vitest, build, pgTAP, smoke | Not run — docs-only step, no code touched. Baseline (inherited, unverified): see run contract |

## 4. Next command

`/10x-plan-review synthetic-santander-fixture`

## 5. Open

- Manual-only Progress rows (all `[reviewer]`, implement/impl-review agents can do them; reading the real exports
  needs the sandbox disabled): 1.8 trap coverage, 1.9 privacy overlap scan, 2.8 check rules vs real export,
  3.7 shape comparison on the real exports, 3.8 doc/README agreement.
- No `[human]` rows: the plan does not deviate from PRD FR-018/FR-014 text.
- For S-11 (not this slice): city-tail stripping to join `PIZZERIA TRZY SERY KRAKOW` (Santander ST10) with the ING raw
  in `normalizeMerchant` (`src/lib/patterns/merchant.ts`); `Wypłata BLIK` currently its own pattern (ST06).
- For S-10 (not this slice): kit copy `importFlow.supported` / `importErrors.unknownFormat` still say Santander
  „wkrótce”; `src/lib/import/schema.ts` requires the ING 18-digit ID; `imports.source` allows only `'ing'`.
- No DESIGN-GAP, no migration, no follow-ups file.

## 6. Autonomous decisions

Full table in `plan.md` § Autonomous decisions. Key ones:

- **0 user questions (MEDIUM complexity)** — research settled every solution choice; would change with a product
  owner available.
- **Aggregator `scripts/fixture-check.mjs`** over a `&&` chain or second CI step — both banks reported, CI and ING
  script untouched; would change if importing the ING check gained side effects.
- **Shared merchant `pizzeria-trzy-sery`** (ASCII) — would change if the maintainer wants S-11 to fold diacritics.
- **Shape comparator in scope as `fixture:shape:santander`** — would change if the research scan is judged enough.
- **USD reject only, no overlap file** — would change if S-10's plan needs a distinct overlapping range.
- **`Wypłata BLIK` = own pattern by rule 5** (not merged into `bankomat`) — would change if S-11 classes it ATM-like.
- **Trap ids `ST01–ST14`, period 2026-03-01 → 2026-08-31 (≈180 rows), invented account with bank code `1090`, test
  BIN `411111`** — would change if S-11 needs a longer series or detection relies on checksums.
- **Planned without sub-agents** — research.md already mapped every file the plan touches.
