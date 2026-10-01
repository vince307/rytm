# Handoff — `synthetic-santander-fixture` (slice F-03)

Written by the `/10x-implement … phase 2` step (autonomous run, implement step). Phase 2 (Santander check and the
two-bank gate) is implemented, gated green and committed. The next agent must not change `fixture:check`'s
semantics or its CLI output format (`fixture:check <bank> OK`) without re-checking CI expectations, and must treat
`scripts/fixture-ing*.mjs` / `test/fixtures/ing/` as still untouched (byte-exact, unchanged this phase too).

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/synthetic-santander-fixture`, cut from `main` at `5e61822` |
| Commits | 8 on the branch (`24ad875` identity, `1d7c4d5` research, `0b514cb` plan, `56f48e5` plan review, `5301ea4` phase-1 implementation, phase-1 handoff commit, `c9efa9a` this step's phase-2 implementation, plus this handoff commit) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` (unchanged) |
| `## Progress` rows remaining | 10 (`grep -c '^- \[ \]' plan.md`): 2 Phase 1 `[reviewer]` (unchanged from phase 1) + 1 Phase 2 `[reviewer]` + 9 Phase 3 |
| Working tree | clean after this step's two commits (phase-2 commit + this handoff commit) |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `scripts/fixture-santander-check.mjs` | `export async function check()`; also exports `parseLine`, `toMinor`, `DMY`/`YMD`, `CARD`, `rawMerchantOf` for Phase 3's shape comparator. Byte-compares disk against `generate()`; independently re-reads each CSV (UTF-8, LF, 9-field lines, header/data-row quoting, header invariants — opening/closing, Lp 1 unique max booking date + adjacent inversion above a 10-row threshold, file-name ↔ header col 0/col 2); re-derives D2 (debits-only) and rule 5 (`rawMerchant`) from the parsed rows against `expected.json`; runs the D5 fixed/frequent check; confirms every `ST01`–`ST14` id has ≥ 1 row; confirms the `pizzeria-trzy-sery` `crossBank` entry exists in both this fixture's `patterns[]` and the ING oracle's, with matching `type`; confirms the USD file trips only `reason: currency` and the PLN file trips none |
| `scripts/fixture-check.mjs` | Aggregator: imports `check` from both per-bank scripts, runs both unconditionally, prints `fixture:check <bank> OK` or that bank's error list, exits 1 if either bank has errors |
| `package.json` | `"fixture:check"` repointed from `node scripts/fixture-ing-check.mjs` to `node scripts/fixture-check.mjs`; `fixture:ing`/`fixture:santander`/`fixture:shape` unchanged |
| `context/changes/synthetic-santander-fixture/plan.md` | Phase 2 `#### Automated` rows 2.1–2.7 ticked with sha `c9efa9a` (written in this handoff commit, same chicken-and-egg reason as Phase 1) |
| `context/changes/synthetic-santander-fixture/handoff.md` | This file |

Not touched this phase (confirmed via `git status --porcelain` before staging): `change.md`, `scripts/fixture-ing*.mjs`, `scripts/fixture-santander.mjs`, `test/fixtures/**`, `.github/workflows/ci.yml`, `context/foundation/roadmap.md` (F-03 was already flipped to `in-progress` in Phase 1).

## 3. Verification

| Command | Result |
| --- | --- |
| `git branch --show-current` | `feat/synthetic-santander-fixture` (observed) |
| `node scripts/fixture-santander-check.mjs` (standalone) | exit 0, `fixture:check (santander) OK …` (observed) |
| `node scripts/fixture-check.mjs` (standalone, == `npm run fixture:check`) | exit 0, `fixture:check ing OK` + `fixture:check santander OK` (observed) |
| Deliberate break 1 (bytes, criterion 2.2): flipped one digit byte inside a card-amount description in the main Santander CSV | red — santander FAILED with both the byte-diff line and an independent `description amount != |col 5|` finding; ing stayed OK; file restored from a pre-break copy → clean (`fixture:check` exit 0 again) (observed). Meta-check: the independent re-read catches the same break two ways (byte compare + format re-derivation), neither path trusts the generator |
| Deliberate break 2 (semantics, criterion 2.3): in `scripts/fixture-santander.mjs`'s `rowToManifest`, forced the ST08 refund row to `imported: true, skipReason: null` and regenerated (byte-identical disk/generator, since both came from the same edited generator) | red — santander FAILED on exactly the D2 re-derivation (`imported/skipReason true/null, D2 gives false/credit` + the pattern-must-be-set-for-imported-rows check), while the byte-equality check passed; `git checkout -- scripts/fixture-santander.mjs` + regenerate restored byte-for-byte clean fixture → `fixture:check` exit 0 (observed). Meta-check: proves the check re-derives D2 independently of the generator's own manifest output — the exact failure mode a byte-compare-only check would miss |
| Deliberate break 3 (aggregation, criterion 2.4): flipped one byte in the middle of the ING main CSV (`Lista_transakcji_nr_0000123456_010926.csv`) | red — `fixture:check ing FAILED` (byte-diff), `fixture:check santander OK` printed alongside it in the same run (proves both banks always run, one's failure never short-circuits the other); file restored from a pre-break copy → both OK again (observed) |
| `node scripts/fixture-ing-check.mjs` (standalone, criterion 2.5) | exit 0, unchanged message (observed) |
| `git diff --exit-code -- .github/workflows/ci.yml` (criterion 2.6) | exit 0, no diff (observed) |
| `git diff --exit-code main -- scripts/fixture-ing.mjs scripts/fixture-ing-check.mjs scripts/fixture-ing-shape.mjs test/fixtures/ing` | exit 0, no diff (observed) |
| `npm run lint` | 0 errors (observed; prettier auto-fix only on the new check script, no real lint findings — baseline Δ0) |
| `npx astro check` | 0 errors, 136 files (baseline-after-phase-1 134; +2 is the two new `.mjs` files — astro check doesn't lint them but the count line moved, same as phase 1's note) (observed) |
| `npm run fixture:check` | OK for both banks (observed; this is the phase's own gate, now Δ0-stable going forward) |
| `npm test` | 256 passed, 15 files (observed, baseline Δ0 — no new Vitest file this phase per plan) |
| `npm run build` | OK (observed, baseline Δ0) |
| `npx supabase db reset && npx supabase test db` | pgTAP Files=5, Tests=102, Result PASS (observed, baseline Δ0; sandbox disabled per contract for Docker/`127.0.0.1`) |
| `astro dev --port 4398` + `npm run smoke` | all smoke steps passed (observed, baseline Δ0; sandbox disabled per contract); port 4398 killed afterward, confirmed clear |

## 4. Next command

`/10x-implement synthetic-santander-fixture phase 3`

## 5. Open

- Manual-only Progress rows, left untouched (not verified by this step, `[reviewer]`): 1.8, 1.9 (carried from
  Phase 1, unchanged) and 2.8 ("check rules assert only facts the real export has" — Phase 2's own manual row).
- Phase 3 rows (9) remain pending as planned; no Phase-3 work started.
- The "Lp 1 unique maximum booking date + ≥ 1 adjacent inversion" check applies the inversion half only to files
  with more than 10 data rows (`INVERSION_ROW_THRESHOLD` in `fixture-santander-check.mjs`) — an autonomous call,
  see §6; the USD reject file (3 rows, strictly descending by design) is correctly exempted, the 180-row main
  file is correctly held to it.
- The check's `crossBank` validation reads the ING oracle (`test/fixtures/ing/expected.json`) by the path named
  in the Santander `expected.json`'s `crossBank[].oracle` field, not a hard-coded path — Phase 3's shape tool
  should not need to touch this.
- Known risks from `plan.md § Known risks` (S-10 partial-overlap fixture, cleaner balance chain than the real
  export) are unchanged by this phase — still open for S-10/3.7.
- No `DESIGN-GAP`, no migration, no follow-ups file (unchanged from Phase 1's handoff).

## 6. Autonomous decisions

- **Implemented Phase 2 directly in this session rather than delegating to a subagent.** Chosen: direct
  implementation. Rejected: the skill's recommended subagent delegation. Why: same reasoning as Phase 1 — the
  format-contract checks, D2/D5 re-derivation and the crossBank cross-file lookup are tightly coupled to the exact
  shapes the Phase 1 generator produced; a fresh subagent would have had to re-derive that grounding from the plan
  text alone. What would change it: a phase with more independent, loosely-coupled changes.
- **Adjacent-inversion check gated on `rows.length > 10`, not on the file name.** Chosen: a row-count threshold.
  Rejected: hard-coding the main file's name, or requiring the inversion check on every file. Why: the plan's own
  criterion parenthetically scopes this to "(main file)"; the USD reject file is deliberately built strictly
  descending (`orderSimple`, no inversions possible at 3 rows) so a universal requirement would make the reject
  file illegal. A row-count threshold expresses the real distinguishing property (enough rows to need the
  real-export's noisy ordering) without naming a specific file, keeping the check honest if a future phase adds a
  second small reject file. What would change it: a future fixture adding a second *large* reject file that is
  legitimately strictly ordered — the threshold would then need an explicit per-file override.
- **`crossBank` entries are checked for matching `type` between the two oracles' `patterns[]`, not for a `type`
  field on the `crossBank` entry itself.** Chosen: look up `patterns[].type` on both sides by `key`. Rejected: a
  literal reading of Phase 1's plan text ("the `crossBank` entry records `"type": "frequent"`"), which would
  require a `type` field directly on the `crossBank` array entry. Why: the Phase 1 generator (already committed,
  gated green, reviewed) does not emit such a field on `crossBank` entries — only on `patterns[]` — and Phase 1's
  own handoff §3 already describes the check as "matches the ING oracle's" via `patterns[]`, confirming this
  reading was the intended one. Re-deriving via `patterns[]` matches the committed data; adding a `type` field to
  `crossBank` now would be an undiscussed generator change outside this phase's scope. What would change it: the
  maintainer deciding the `crossBank` schema itself should carry `type` — that edit belongs to the generator
  (Phase 1 territory) plus a regeneration, not this check.
- **Extra re-derivation of `kind` and `card` on manifest rows, beyond what Phase 2's plan text lists.** Chosen:
  independently derive `kind` (via the `CARD` regex / `Zakup BLIK` / `Wypłata BLIK` / `Przelew` prefixes) and
  `card` (last 4 of the matched mask) and compare against `expected.json`'s `rows[].kind`/`.card`. Rejected:
  checking only the fields the plan's bullet list names (lp/bookedOn/occurredOn/amountMinor/rawMerchant/imported/
  skipReason/pattern). Why: cheap, format-contract-derivable, independent-of-the-generator checks in the same
  spirit as the rest of this script; they passed clean against the already-reviewed Phase 1 fixture with no
  adjustment needed, so no risk was taken on. What would change it: a future hand-edit of `expected.json`'s `kind`
  field for a legitimate reason this derivation doesn't anticipate — would need either fixing the derivation or
  dropping this extra check.
- **The SHA suffix on Phase 2's Progress rows (`c9efa9a`) is written back in this handoff commit, not the phase
  commit itself** — same chicken-and-egg reason, and same precedent, as Phase 1's handoff §6.
