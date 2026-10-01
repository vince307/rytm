# Synthetic Santander fixture (F-03) — Plan Brief

> Full plan: `context/changes/synthetic-santander-fixture/plan.md`
> Research: `context/changes/synthetic-santander-fixture/research.md`

## What & Why

The repo gains a synthetic Santander Bank Polska CSV export (PLN) that reproduces the real export's shape and traps,
a USD-account file for the currency rejection, an answer key and a CI consistency gate "like ING". S-10 (parser,
import) and S-11 (card-merchant grouping, cross-bank merchant) need measurable test material, and privacy rules out a
real statement in the repo.

## Starting Point

ING has the full pattern: `scripts/fixture-ing.mjs` (generator), `fixture-ing-check.mjs` (CI gate via
`npm run fixture:check`), `fixture-ing-shape.mjs` (local structure comparator). Nothing Santander exists yet; the
Santander section of `import-formats.md` is partly wrong against the real export (Lp order, header dates, quoting,
BLIK/transfer/`Oplata za` shapes).

## Desired End State

`test/fixtures/santander/` holds a main PLN export (≈180 rows, 2026-03-01 → 2026-08-31, two cards, traps ST01–ST14),
a 3-row USD reject file, `expected.json` and a generated README, all produced byte-exact by
`npm run fixture:santander`. `npm run fixture:check` checks both banks (CI step unchanged); a local-only
`fixture:shape:santander` compares structure with the real export without printing values or file names;
`import-formats.md` matches reality.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Gate layout | Aggregator `scripts/fixture-check.mjs` over both `check()`s | One gate name, both banks reported, ING script untouched | Research |
| Cross-bank merchant | `pizzeria-trzy-sery` (ASCII card tail) | Real card tails are ASCII; a diacritic would force S-11 to re-key ING | Research |
| Shape comparator | In scope, separate `fixture:shape:santander` | Mitigates „fixture zbyt czysty”; never prints file names (they embed the account number) | Research + Plan |
| Reject files | USD only, no overlap file | Roadmap names only USD; S-10 re-imports the main file for overlap | Research |
| `Wypłata BLIK` | Own pattern from col 3 (rule 5) | Current contract; S-11 may change it via the generator | Plan |
| `Oplata za …` | Recurring `fixed` debit, not a "bank fee" | Fee status not provable from shape | Research |
| Trap ids | `ST01–ST14` | Distinct from ING `T01–T19` and roadmap `S-NN` | Plan |
| Doc corrections | Phase 3, after the comparator | The comparator confirms what the doc states | Plan |

## Scope

**In scope:** Santander generator, fixture files, `expected.json`, README, Santander check, two-bank aggregator,
`.gitattributes`, npm scripts, shape comparator, `import-formats.md` Santander section, one CLAUDE.md command line.

**Out of scope:** parser/detection/import (S-10), card normalization and cross-bank keying (S-11), any change to ING
scripts or `test/fixtures/ing/`, DB/seed/UI/copy, new CI step, new dependencies, any value from the real exports.

## Architecture / Approach

Per-bank copy of the ING design: traps as data in the generator → one `generate()` run builds CSV + manifest + README;
the check compares bytes with `generate()` and then re-reads the files from disk with its own reader (format, D2, D5,
D7, trap coverage, cross-bank slug present in the ING oracle). The aggregator runs both banks; the shape tool reuses
the Santander reader and prints masks only.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Generator and fixture files | `fixture-santander.mjs`, 4 fixture files, `.gitattributes`, `fixture:santander` | Fixture too clean or a real value slips in (reviewer overlap scan) |
| 2. Santander check and the two-bank gate | `fixture-santander-check.mjs`, `fixture-check.mjs`, repointed `fixture:check` | Check asserting facts the real export lacks (balance chain, strict order) |
| 3. Shape comparator, format doc and seam sweep | `fixture:shape:santander`, corrected `import-formats.md`, CLAUDE.md line, sweep | Leaking a file name / value in the comparator output |

**Prerequisites:** real exports at the run-contract paths (sandbox disabled to read); branch `feat/synthetic-santander-fixture`.
**Estimated effort:** 3 small implement sessions, docs-and-scripts only.

## Open Risks & Assumptions

- Synthetic shapes rest on an aggregate scan; Phase 3's comparator may force generator tweaks (regenerate + recheck).
- S-11 will need city-tail stripping to join `PIZZERIA TRZY SERY KRAKOW` with the ING raw — intended, declared as ST10.
- `Wypłata BLIK` as its own pattern is a provisional product call S-11 may revisit.

## Success Criteria (Summary)

- `npm run fixture:check` green for both banks in CI; byte edits or semantic drift in the Santander fixture turn it red.
- S-10/S-11 can assert parser output and grouping against `test/fixtures/santander/expected.json`, ING oracle unchanged.
- No value from the real exports anywhere in the repo.
