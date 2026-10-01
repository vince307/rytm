<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Synthetic Santander fixture (F-03)

- **Plan**: context/changes/synthetic-santander-fixture/plan.md
- **Scope**: Full plan
- **Reviewed phases**: 1, 2, 3
- **Date**: 2026-10-02
- **Verdict**: NEEDS ATTENTION before fixes → APPROVED after fixes (`a936cfd`). The one critical finding and eight of the nine warnings are fixed. One warning goes to follow-ups.
- **Findings**: 1 critical, 9 warnings, 1 observation group
- **Method**: two sub-agents (plan drift; safety and patterns) plus this step's own checks.
  - Every suite was re-run.
  - The shape comparator, and the check's format rules, were run against the real exports with the sandbox disabled, using the symlink dir from the run contract. Output was counts and masks only.
  - The privacy overlap scan reported counts only.
- **Not applicable**: this slice has no migration, no write endpoint, no UI and no `src/` change. The RLS, endpoint and visual checks were skipped for that reason.

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS after fixes (F3/F4/F5 were drift) |
| Scope Discipline | PASS — ING scripts, `test/fixtures/ing`, CI and `src/` are untouched. The only extra change is the `roadmap.md` F-03 status bump in p1, which is benign. |
| Safety & Quality | PASS after fixes (F7 privacy path echo, F8) |
| Architecture | PASS — there is one reader (`parseLine` in `fixture-santander-check.mjs`), and the aggregator is a separate script. |
| Pattern Consistency | PASS — the CLI guard, exit codes and output style match the ING scripts. |
| Success Criteria | PASS — the gate is green, and the five `[reviewer]` rows were performed and ticked. Row 3.9 `[human]` stays open on purpose. |

## Findings

### F1 — Real export has `"` inside unquoted fields; reader, doc and fixture all said impossible

- **Severity**: ❌ CRITICAL
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Plan Adherence / Success Criteria (row 3.7)
- **Location**:
  - `scripts/fixture-santander-check.mjs` `parseLine`
  - `scripts/fixture-santander.mjs` `bare`
  - `context/foundation/import-formats.md` Santander quoting row
- **Detail**: The comparator showed 10 unparseable real PLN lines.
  - Masked classification: every one is a card description (col 2, unquoted) whose tail holds a merchant name in `"…"`. That is about 2% of rows, with varying spacing: `"X"`, `" X"`, `"X Y"`.
  - `parseLine` threw "quote inside a bare field", and the doc called this "naruszenie formatu".
  - The fixture never contained such a line.
  - Consequence: an S-10 parser built to the doc and the fixture would reject or mis-split real rows, and nothing in the repo would catch it. This is exactly the roadmap's "fixture zbyt czysty" risk.
  - The "header col 7 ≠ row count" difference was a knock-on effect: the comparator counted only parsed rows.
- **Fix**:
  - `parseLine`: a `"` opens a quoted field only at field start, and a bare field may hold `"` elsewhere.
  - `bare`: allows `"` except as the first character.
  - New trap **ST15** (`buildST15`): `PUB "POD KOGUTEM" KRAKOW` ×2 and `KINO " NOVA" SALA DUZA GDANSK`. `rawMerchant` keeps the quotes, and S-11 normalizes them.
  - Doc and README now state the dialect is not strict RFC 4180.
  - Comparator gained the metric "rows with a quote inside a bare field".
  - Deliberate break: re-adding the strict throw to `parseLine` turned `fixture:check` santander red on lines 44/65/146. Restoring it made the check green.
- **Decision**: FIXED (`a936cfd`)

### F2 — Data-row col 4 grouped `4×6 + 2`, real export groups `2 + 6×4`

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**:
  - `scripts/fixture-santander.mjs` `groupDigits`
  - `scripts/fixture-santander-check.mjs` `isGroupedDigits`
  - `import-formats.md` (said "po 4 cyfry")
- **Detail**: The comparator reported a col4 mask difference: in the real file 100% of filled col 4 is `9{2} 9{4}×6`, the same grouping as header col 2. A detection or regex written to the fixture would miss every real counterparty account.
- **Fix**: `groupDigits` now emits 2+6×4, and `groupAccount` reuses it. `isGroupedDigits` became `GROUPED_ACCOUNT` `/^\d{2}( \d{4}){6}$/`. The doc and the README line are corrected.
- **Decision**: FIXED

### F3 — Card tails only 3–4 tokens (real 2–7); planned one-off card merchants missing

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence (noise contract)
- **Location**: `scripts/fixture-santander.mjs` `CARD_NOISE_POOL`, `ONE_OFF_CARD`/`oneOffCards`
- **Detail**:
  - Comparator token-count spread was real 2–7 (about 11% two-token, about 22% five-token) against fixture 3–4.
  - The plan asked for one-off card merchants, but the drift agent found no card pattern with `occurrences: 1`.
  - S-11's city stripping would never meet a 2-token tail, the over-strip case, or a long tail.
- **Fix**:
  - Five pool entries added: two 2-token and three 5-token.
  - `MYJNIA … KRAKOW` → `… BIALA PODLASKA`, which adds a second two-word city.
  - Four fixed-date one-off rows added (2/5/6/7 tokens) outside the RNG.
  - Result: the PLN comparator reports **No structural differences**.
- **Decision**: FIXED

### F4 — ST11 used a real bank's name and a bank-fee title, contradicting the doc

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence (privacy "every value invented"; plan decision "`Oplata za` not a bank fee")
- **Location**: `scripts/fixture-santander.mjs` `buildST11`
- **Detail**: The counterparty was the bank's legal name and the title was an account-maintenance fee, so the oracle asserted what `import-formats.md` says not to assume.
- **Fix**: The counterparty is now the invented `WSPOLNOTA MIESZKANIOWA PRZYKLAD` with title `Oplata za miejsce postojowe`, under pattern `wspolnota-mieszkaniowa-przyklad`. It is still a `fixed` recurring debit.
- **Decision**: FIXED

### F5 — `crossBank` entry carried no `type`; empty `crossBank` passed silently

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence (plan review F3 contract)
- **Location**: `scripts/fixture-santander.mjs` `generate`; `scripts/fixture-santander-check.mjs` `checkCrossBank`
- **Fix**:
  - The entry now has `"type": "frequent"`.
  - The check asserts that the entry type equals both the Santander and the ING oracle pattern types, and it errors on a missing or empty `crossBank`.
  - Deliberate break: setting the entry type to `fixed` and regenerating turned the check red with two crossBank errors. Restoring it made the check green.
- **Decision**: FIXED

### F6 — Check asserted ≥ 2 card masks on the USD reject file; the real USD export has one card

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria (row 2.8: "no rule asserts a fact the real export does not have")
- **Location**: `scripts/fixture-santander-check.mjs` `readStatement`; `scripts/fixture-santander.mjs` `buildUsdFile`
- **Detail**:
  - This step ran `readStatement` (a scratch copy with the export added) against both real exports and printed masked error classes only.
  - The only rule failure was "fewer than 2 distinct card masks" on the USD file.
  - The comparator also flagged the USD masks and tail token counts.
- **Fix**:
  - The ≥ 2-mask rule moved under `INVERSION_ROW_THRESHOLD` and is now a main-file trait.
  - The USD fixture uses one card with 2-token tails, still with one `*` and one `_`.
  - After the fix: 0 rule errors on both real exports, and **No structural differences** in USD.
- **Decision**: FIXED

### F7 — Shape tool: path could leak via uncaught `readdirSync`/echo; false col 7 / Lp 1 metrics

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality (privacy)
- **Location**: `scripts/fixture-santander-shape.mjs` top-level dir handling, `shape`
- **Detail**:
  - Passing a real export file instead of its directory threw an uncaught ENOTDIR whose stack shows the full path, which embeds the account number.
  - The "does not exist" message echoed the path.
  - "header col 7 == row count" counted only parsed rows.
  - "header col 6 == Lp 1" used the first parsed row rather than line 2.
- **Fix**: `readdirSync` is wrapped and prints only `e.code`, and no message echoes the path. Col 7 is compared with every data line, and the Lp 1 check uses `parsed[1]`. Verified: passing a renamed 26-digit file prints `cannot list the given directory (ENOTDIR)` with no digits.
- **Decision**: FIXED

### F8 — Aggregator aborted on a throwing bank check

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: `scripts/fixture-check.mjs` `checkAll`
- **Detail**: If one bank's `check()` threw, the other bank was never reported. The exit code stayed non-zero, so CI was safe. The header comment promises both banks are reported.
- **Fix**: A try/catch per bank records `check threw: …` as that bank's error.
- **Decision**: FIXED

### F9 — Comparator tolerance hides a structural variant present on one side only

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Safety & Quality (the comparator is the "too clean" guard)
- **Location**: `scripts/fixture-santander-shape.mjs` `same`; metric `"" occurrences`; line split
- **Detail**:
  - Distribution keys are compared with 5 pp per key, so a quoting signature, col 4 mask or field count that exists only in the real file at under 5% compares as equal. F1 surfaced only because the strict reader threw.
  - `"" occurrences` is an absolute count and also counts empty quoted fields.
  - A CRLF file would show one cause as several differences.
- **Fix**: For the signature, mask and field-count distributions, treat a key present on one side only as a difference; keep the tolerance for shares. Count `""` only inside quoted values. Split on `/\r?\n/`.
  - Strength: it would have caught F1 directly.
  - Tradeoff: more differences that a reviewer has to explain on each run.
  - Confidence: MED — not run against the real file in this step.
  - Blind spot: rare real variants may then need an explicit "explained" list.
- **Decision**: DEFERRED → `follow-ups/review-fixes.md`

### O1 — Observations (recorded, no action)

- **Severity**: OBSERVATION
- **Detail**:
  - The stale "like the real reader will be in Phase 2" comment above `countFields` is fixed.
  - `expected.json` `files[].account` holds 26 ungrouped digits, while the plan sketch said "grouped". This is self-consistent, and S-10 should compare digits.
  - The shape tool re-declares `AMOUNT`/`dmyIso` instead of importing them. This is small and harmless.
  - `context/foundation/roadmap.md` F-03 `ready → in-progress` is an implement-workflow bump.
  - The card split is about 51/49 against the plan's ≈ 55/45. The comparator shows no difference from the real file.
  - Plan § Critical Implementation Details "Quoting … the generator must refuse a value containing `"`" is **superseded by F1/ST15**. The plan body is kept as written, and this review is the record.
  - `scripts/fixture-ing-shape.mjs` has the same unguarded `readdirSync`. ING scripts are byte-frozen in this slice, so this goes to follow-ups.
- **Decision**: RECORDED

## Reviewer rows performed by this step

- **1.8**: ST01–ST15 each have rows and `traps` entries (drift agent and the generated README trap table). The PLN comparator against the real export reports no structural differences. ✓
- **1.9**: Overlap scan of fixture CSV col 2/col 3 tokens against real col 2/col 3 tokens:
  - 0 long-digit (≥ 8) hits and 0 card-mask hits.
  - 2 full-field hits, both format strings (`Przelew środków`, `Przelew na telefon`).
  - The remaining alphabetic overlaps are generic Polish words or city names, and no merchant bigram is shared. ✓
- **2.8**: The check's format rules run against both real exports give 0 errors after F6. No file-order balance chain or strict date order is asserted. ✓
- **3.7**: `npm run fixture:shape:santander -- <symlink dir>`: the output has no file name and no 26-digit run. The 4 PLN differences seen first were F1 (×2), F2 and F3, all fixed. USD was F6, fixed. Final result: **No structural differences** for PLN and USD. ✓
- **3.8**: `import-formats.md` and the README agree with each other and with research after F1/F2. Neither carries a real value (scan above). ✓
- **3.9** `[human]`: left open. It is the product owner's call and is reversible by editing the generator. It does not block the merge.

MERGE: CLEAR — the 1 critical and 8 of 9 warnings are fixed in `a936cfd`. The full gate is green with Δ0 against baseline. All five `[reviewer]` rows were performed and pass. The remaining warning (F9) is a follow-up, and row 3.9 `[human]` is a reversible product confirmation.
