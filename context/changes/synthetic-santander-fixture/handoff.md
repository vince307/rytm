# Handoff — `synthetic-santander-fixture` (slice F-03)

Written by the `/10x-research` step: `research.md` answers the gate layout, the cross-bank merchant, the shape
comparator scope and re-checks the real-export shapes against `import-formats.md`; `change.md` is now `preparing`.
The next agent must not copy any value from the real exports, and must not modify `scripts/fixture-ing*.mjs` or
`test/fixtures/ing/` (byte-exact ING fixture; S-11 risk „ING expected must stay unchanged”).

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/synthetic-santander-fixture`, cut from `main` at `5e61822` |
| Commits | 2 on the branch (`24ad875` change identity; this step: `docs(synthetic-santander-fixture): research`) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `preparing` (set by `metadata-guard.mjs mark-researched`) |
| `## Progress` rows remaining | n/a — no `plan.md` yet |
| Working tree | clean after the commit (only this step's three files staged) |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `context/changes/synthetic-santander-fixture/research.md` | Research: gate options, cross-bank merchant pick, shape-comparator scope, real-export shape table vs `import-formats.md`, plumbing, open questions |
| `context/changes/synthetic-santander-fixture/change.md` | Frontmatter only: `status: new → preparing`, `updated` |
| `context/changes/synthetic-santander-fixture/handoff.md` | This file |

## 3. Verification

| Command | Result |
| --- | --- |
| `git branch --show-current` | `feat/synthetic-santander-fixture` (observed) |
| Two aggregate-only shape scans of the real exports (scratchpad scripts, sandbox disabled, masks + counts only) | Observed: PLN 1+483 rows, USD 1+3; card tails ASCII single-spaced 438/438; booking ≥ operation always; 41/482 adjacent booking-date inversions; 0 `""` escapes; BLIK 6 rows all with col 3/4 filled; `Oplata za` 8 rows one counterparty |
| `node -e` on `test/fixtures/ing/expected.json` | Oracle keys are hand slugs (`pizzeria-trzy-sery` etc.), no `merchantKey` field |
| lint, astro check, fixture:check, vitest, build, pgTAP, smoke | Not run — docs-only step, no code touched. Baseline (inherited, unverified): see run contract |

## 4. Next command

`/10x-plan synthetic-santander-fixture`

## 5. Open

- Plan decisions recommended in `research.md` (§ Summary): aggregator `scripts/fixture-check.mjs` importing `check()`
  from `scripts/fixture-ing-check.mjs` and a new `scripts/fixture-santander-check.mjs`; generator
  `scripts/fixture-santander.mjs` (`generate()`); shared merchant slug `pizzeria-trzy-sery` (`NOISE_POOL` in
  `scripts/fixture-ing.mjs`); local-only `fixture-santander-shape.mjs` that never prints file names (real names embed
  the account number); `.gitattributes` += `test/fixtures/santander/** -text`.
- `import-formats.md` Santander-section corrections (table in `research.md` § Real export): Lp order, header date
  formats + grouped account mask, col 6 quoting, card tail ASCII, `Wypłata BLIK` + `:<11 digits>` suffix, free-title
  shape, `Oplata za` as a recurring debit (not asserted as a bank fee — refines `change.md`).
- For S-11 (not this slice): real card tails have no Polish letters; a diacritic-bearing cross-bank merchant would need
  folding in `normalizeMerchant` (`src/lib/patterns/merchant.ts`), which re-keys stored ING decisions.
- For S-10 (not this slice): `importFlow.supported` / `importErrors.unknownFormat` in
  `design/rytm-os/react-kit/docs/content.json` still say Santander „wkrótce”; `src/lib/import/schema.ts` requires the
  ING 18-digit ID; `imports.source` allows only `'ing'`.
- Reading the real exports requires the sandbox disabled (`~/Downloads`). No DESIGN-GAP. No follow-ups file.

## 6. Autonomous decisions

- **Shared merchant `pizzeria-trzy-sery`** — rejected `kawiarnia-filizanka` (diacritic forces S-11 folding/re-keying)
  and T10/T11 merchants (trap interplay). Would change if the maintainer wants S-11 to handle diacritics now.
- **Aggregator over `&&` chain** for `fixture:check` — both banks reported in one run; would change if the plan
  prefers zero new files (the `&&` chain is an acceptable fallback).
- **`fixture:shape` analogue recommended in scope (local-only)** — mitigates roadmap risk „fixture zbyt czysty”;
  would change if the plan treats this research scan as sufficient and defers the tool.
- **`Oplata za` not called a bank fee** — shape shows one counterparty, filled col 3/4, identical title; a fee claim is
  not provable without values. Would change if the owner confirms it is a bank fee.
- **No Santander overlap reject file required** — roadmap F-03 names only the USD reject; S-10 can re-import the main
  file. Would change if the plan wants an S-10 overlap fixture now.
- **Research done locally, no sub-agents** — the scope was four concrete files plus two aggregate scans; delegation
  would not have added coverage. Would change for a wider codebase question.
