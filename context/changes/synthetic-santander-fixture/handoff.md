# Handoff — `synthetic-santander-fixture` (slice F-03)

Written by the `/10x-impl-review synthetic-santander-fixture` step of the autonomous run, which reviewed the full plan
(phases 1–3). One critical finding and eight warnings were fixed in `a936cfd`, and the review verdict is
`MERGE: CLEAR`. The next agent must not get this wrong: the Santander CSV dialect is **not strict RFC 4180**. A bare
(unquoted) field may contain `"` (trap ST15), and data-row col 4 is grouped `2 + 6×4`, like header col 2. S-10's
parser must follow `scripts/fixture-santander-check.mjs` `parseLine` and `import-formats.md`, not the plan's
original quoting text.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/synthetic-santander-fixture`, cut from `main` at `5e61822` |
| Commits | 13 on the branch. The last two are `a936cfd` (`fix(...)`: review fixes) and the `docs(...)` commit for this review (report, follow-ups, plan rows, change status, this handoff). |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `impl_reviewed` |
| `## Progress` rows remaining | 1 (`grep -c '^- \[ \]' plan.md`): 3.9 `[human]` |
| Working tree | clean after the docs commit |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `scripts/fixture-santander-check.mjs` | `parseLine` accepts `"` inside a bare field (a quote opens a quoted field only at field start). `isGroupedDigits` = `GROUPED_ACCOUNT` (2+6×4). `checkCrossBank` asserts that the entry `type` equals both oracles' type and errors on a missing or empty `crossBank`. The ≥ 2 card-mask rule now applies only to the main file (`INVERSION_ROW_THRESHOLD` block). |
| `scripts/fixture-santander.mjs` | Changes in this step: <ul><li>`bare` allows a non-leading `"`.</li><li>`groupDigits` emits 2+6×4 and `groupAccount` reuses it.</li><li>New trap `ST15` with `buildST15`.</li><li>`ONE_OFF_CARD`/`oneOffCards` widen card tails to 2–7 tokens.</li><li>`CARD_NOISE_POOL` gains 2- and 5-token tails, plus a second two-word city.</li><li>`buildST11` uses an invented counterparty instead of the bank name.</li><li>The `crossBank` entry gets `type`.</li><li>`buildUsdFile` uses one card with 2-token tails.</li><li>The README template gets lines for the in-field quote and the col 4 grouping.</li></ul> |
| `scripts/fixture-santander-shape.mjs` | Changes in this step: <ul><li>`readdirSync` is guarded and prints only the error code; no message echoes the path.</li><li>"header col 7 == row count" counts every data line.</li><li>The Lp 1 check uses file line 2.</li><li>New metric: "rows with a quote inside a bare field".</li></ul> |
| `scripts/fixture-check.mjs` | In `checkAll`, a bank whose check throws is reported as an error, and the other bank is still reported. |
| `test/fixtures/santander/*` | Regenerated: main file 187 rows, the USD file, `expected.json` and `README.md`. |
| `context/foundation/import-formats.md` | Santander quoting row (not strict RFC, ST15), col 4 grouping 2+6×4, trap list ST01–ST15 |
| `context/changes/synthetic-santander-fixture/reviews/impl-review.md` | Review report, F1–F9 + O1, ends `MERGE: CLEAR — …` |
| `context/changes/synthetic-santander-fixture/follow-ups/review-fixes.md` | F9 (comparator one-sided variants, `Trigger: S-10 …`), O1 (`fixture-ing-shape.mjs` path guard, `Trigger: next change touching it`) |
| `context/changes/synthetic-santander-fixture/plan.md` | `[reviewer]` rows 1.8, 1.9, 2.8, 3.7, 3.8 ticked (`a936cfd (impl review)`) |
| `context/changes/synthetic-santander-fixture/change.md` | `status: impl_reviewed` |

## 3. Verification

All results below were observed in this step. Baseline is from the contract: lint 0, astro check 0 (133 files),
fixture:check OK, vitest 256/15, build OK, pgTAP 5/102 PASS, smoke 140/0.

| Command | Result |
| --- | --- |
| `npm run lint` | 0 errors (Δ0) |
| `npx astro check` | 0 errors, 137 files. That is baseline 133 + 4 new `.mjs` scripts from this slice; Δ0 errors. |
| `npm run fixture:check` | `ing OK`, `santander OK` |
| `npm test` | 256 passed, 15 files (Δ0) |
| `npm run build` | OK (Δ0) |
| `npx supabase db reset && npx supabase test db` | Files=5, Tests=102, PASS (Δ0). Run after the first batch of fixes; the later edits touched only `scripts/`, fixtures and docs. |
| `astro dev :4398` + `npm run smoke` | 140 PASS / 0 FAIL, "All smoke steps passed" (Δ0). Port 4398 killed afterwards and confirmed clear. |
| Determinism | Two consecutive `npm run fixture:santander` runs produced identical md5 for all 4 files. |
| ING untouched | `git diff --exit-code main -- scripts/fixture-ing*.mjs test/fixtures/ing .github/workflows/ci.yml` exits 0 |
| `npm run fixture:shape:santander -- <contract symlink dir>` (sandbox off) | Before the fixes: 4 PLN differences and 2 USD differences. After the fixes: **No structural differences** for both PLN and USD. Output grep for `[0-9]{26}` or `historia_2` returned 0. |
| Check's `readStatement` on both real exports (scratch copy, masked error classes) | Before F6: 1 rule failure (≥ 2 card masks on USD). After the fix: 0 errors on both exports. |
| Privacy overlap scan (fixture CSV col 2/col 3 tokens vs real col 2/col 3 tokens; counts only) | 0 hits for runs of ≥ 8 digits, 0 card-mask hits. 2 full-field hits, both format strings. The remaining alphabetic overlaps are generic words or cities, and no merchant bigram is shared. |
| Deliberate break A | Re-added the strict "quote inside a bare field" throw to `parseLine`. Santander went red on ST15 lines 44/65/146; restoring it went green. Meta-check: this proves the fixture now carries the real export's in-field quote, rather than the check merely tolerating it. |
| Deliberate break B | Set `crossBank[0].type` to `fixed` and regenerated. Red with 2 errors (one against the Santander pattern, one against the ING oracle) even though the bytes matched. Restoring and regenerating went green. Meta-check: this proves the new entry-type rule reads both oracles. |
| Privacy break | Passed a renamed file containing a 26-digit number as the dir. Output was `cannot list the given directory (ENOTDIR)` with no digits; the old code threw uncaught with the path. |

## 4. Next command

`/10x-archive synthetic-santander-fixture`, then ship. There is no UI in this slice, so there is no visual gate.

## 5. Open

- [ ] **3.9 `[human]`**: the product owner should confirm the oracle's product calls S-11 is measured against:
  - `Wypłata BLIK` is its own pattern.
  - ST03 is resolved by user-merge.
  - `Oplata za …` is `fixed`.

  All three are reversible by editing `scripts/fixture-santander.mjs` (`buildST06`, `buildST03`, `buildST11`) and regenerating. This row does not block the merge.
- Follow-ups in `follow-ups/review-fixes.md`:
  - F9: `fixture-santander-shape.mjs` `same`, `Trigger: S-10`.
  - O1: `fixture-ing-shape.mjs` `readdirSync` path guard.
- For S-10:
  - Parse with `parseLine` semantics; ST15 lines must import.
  - Col 4 is grouped 2+6×4.
  - `expected.json` `files[].account` holds ungrouped digits.
  - ST11 is now `wspolnota-mieszkaniowa-przyklad`.
  - The main file now has 187 rows.
- Known risks (plan § Known risks) are unchanged: a partial overlap needs a test-built variant in S-10, and the fixture's balance chain is cleaner than the real one by design.
- No `DESIGN-GAP` and no migration.

## 6. Autonomous decisions

- **F1 classified CRITICAL and fixed in the fixture, rather than recorded as a simplification.**
  - Chosen: the new trap ST15 plus a lenient `parseLine`.
  - Rejected: listing it as an explained difference.
  - Why: S-10 builds its parser to the doc and the fixture. Both said a bare `"` is invalid, yet about 2% of real rows carry one. That is a fixture defect that misleads S-10, which is the roadmap risk this slice exists to mitigate.
  - What would change it: a real-export sample showing these rows are corrupt exports rather than a stable shape.
- **Token-count spread fixed by tuning the noise pool until the comparator matched (within 5 pp).**
  - Chosen: pool tuning plus RNG-free one-off rows.
  - Rejected: recording "deliberate simplification".
  - Why: 2-token and 5+-token tails are exactly the cases S-11's city stripping must survive, and the change cost a few pool lines.
  - What would change it: S-11 choosing a merchant key that ignores token structure.
- **USD fixture changed to one card; the ≥ 2-mask rule is now main-file only.**
  - Rejected: keeping two cards in USD.
  - Why: row 2.8 forbids rules the real export violates, and the reject path needs only header col 4.
  - What would change it: a real multi-card USD export.
- **ST11 counterparty and title replaced with invented ones.**
  - Why: "every value invented", and the doc's "do not assume a bank fee".
  - What would change it: the product owner confirming fee semantics (row 3.9).
- **Plan body not edited for the superseded quoting text.**
  - Chosen: record the supersession in `reviews/impl-review.md` O1 and in this handoff.
  - Why: the plan is the historical contract, and the review is the amendment.
  - What would change it: an archive rule requiring plan addenda.
- **Row 3.9 `[human]` treated as non-blocking for `MERGE: CLEAR`.**
  - Why: it is a reversible product confirmation, not an acceptance criterion this slice can satisfy autonomously, and the run contract forbids asking.
  - What would change it: the orchestrator's gate treating `[human]` rows as merge blockers.
- **Opened the real exports (via the contract's symlink dir, sandbox disabled), read-only, counts and masks only.**
  - Why: rows 1.9, 2.8 and 3.7 require it.
  - Scratch scripts lived in `$TMPDIR`; nothing was copied into the repo.
