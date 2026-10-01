# Handoff — `synthetic-santander-fixture` (slice F-03)

Written by the `/10x-new` step: the change identity exists (`change.md`, status `new`) with a roadmap-claims table
checked against the repo and an aggregate-only shape scan of the real Santander exports. The next agent must not
copy any value from the real exports into the repo — and must treat the four `import-formats.md` corrections in
`change.md` as part of this slice's scope.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/synthetic-santander-fixture`, cut from `main` at `5e61822` |
| Commits | 1 on the branch (this step: `docs(synthetic-santander-fixture): change identity (autonomous run)`) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `new` |
| `## Progress` rows remaining | n/a — no `plan.md` yet |
| Working tree | clean after the commit (only this step's two files staged) |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `context/changes/synthetic-santander-fixture/change.md` | Change identity: scope, kit binding (none), migration (none), roadmap-claim → repo-now → correction table, triggered follow-ups (none), autonomous decisions |
| `context/changes/synthetic-santander-fixture/handoff.md` | This file |

## 3. Verification

| Command | Result |
| --- | --- |
| `git branch --show-current` | `feat/synthetic-santander-fixture` (observed) |
| Aggregate shape scan of the two real exports (scratchpad scripts, outside the repo) | Observed: 9 fields/row, UTF-8 no BOM, LF; header col 7 == rows; Lp ascending 1..N; header col 0 `YYYY-MM-DD`, col 1 `DD-MM-YYYY`; 2 card masks; `Wypłata BLIK` present; USD file = card rows only |
| `grep -rn Trigger context/archive/*/follow-ups/review-fixes.md` | No trigger names F-03 / Santander / second bank |
| lint, astro check, fixture:check, vitest, build, pgTAP, smoke | Not run — docs-only step, no code touched. Baseline (inherited, unverified): see run contract |

## 4. Next command

`/10x-research synthetic-santander-fixture`

## 5. Open

- Research questions for the next step: (a) how to extend `scripts/fixture-ing-check.mjs` (`FIXTURE_DIR` hard-wired,
  „no extra files” rule) so `npm run fixture:check` covers `test/fixtures/santander/` with no new CI step; (b) which
  merchant declared in `scripts/fixture-ing.mjs` becomes the cross-bank shared merchant (S-11) and what normalized key
  `test/fixtures/ing/expected.json` gives it; (c) whether a Santander `fixture:shape` analogue of
  `scripts/fixture-ing-shape.mjs` is in scope (roadmap risk „fixture zbyt czysty”); (d) `.gitattributes` needs
  `test/fixtures/santander/** -text`.
- `import-formats.md` Santander section corrections (listed in `change.md` table): Lp order, header date formats,
  `Wypłata BLIK` / bank fee / free-title transfer shapes, col 6 always quoted.
- For S-10, not this slice: `importFlow.supported` and `importErrors.unknownFormat` in
  `design/rytm-os/react-kit/docs/content.json` still announce Santander as „wkrótce”.
- Reading the real exports requires the sandbox disabled (`~/Downloads` is denied by the sandbox).
- No DESIGN-GAP added. No follow-ups file.

## 6. Autonomous decisions

- **Next step research, not plan** — chosen because the doc-vs-export reconciliation, the gate layout for a second
  bank and the shared-merchant pick need codebase grounding; would change if the orchestrator chain mandates plan.
- **`import-formats.md` corrections in this slice** — rejected deferring to S-10 (two truths for the parser); would
  change if the maintainer froze the doc as the 2026-09-18 Q&A record.
- **One `npm run fixture:check` for both banks** (provisional) — rejected a second CI step; would change if coupling
  to the ING check script makes a shared entry point riskier.
- **D3/BLIK unknown answered from the real export** (col 3 = counterparty; one domain-tailed trap) — would change if
  the user states another expectation.
- **Real exports read with sandbox disabled**, aggregate output only — contract names those paths; would change if
  the exports move under an allowed path.
