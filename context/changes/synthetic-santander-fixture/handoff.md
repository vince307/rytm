# Handoff — `synthetic-santander-fixture` (slice F-03)

Written by the `/10x-implement … phase 1` step (autonomous run, implement step). Phase 1 (generator + fixture
files) is implemented, gated green and committed. The next agent must not repoint `fixture:check` yet (it stays
ING-only until Phase 2's aggregator) and must not touch `scripts/fixture-ing*.mjs` / `test/fixtures/ing/`.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/synthetic-santander-fixture`, cut from `main` at `5e61822` |
| Commits | 6 on the branch (`24ad875` identity, `1d7c4d5` research, `0b514cb` plan, `56f48e5` plan review, `5301ea4` this step's phase-1 implementation, plus this handoff commit) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | 19 (`grep -c '^- \[ \]' plan.md`): 2 Phase 1 `[reviewer]` + 8 Phase 2 + 9 Phase 3 |
| Working tree | clean after this step's two commits (phase-1 commit + this handoff commit) |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `scripts/fixture-santander.mjs` | Generator: `export function generate()` + CLI guard, traps ST01–ST14 as data, seeded `mulberry32`, builds the main PLN CSV, the USD reject CSV, `expected.json` and `README.md` together |
| `test/fixtures/santander/historia_2026-08-31_61109012340001111222233334.csv` | Main PLN export, 180 data rows, every trap ST01–ST14 except ST14 itself (USD) |
| `test/fixtures/santander/historia_2026-08-31_77109056780009998887776665.csv` | USD reject file, 3 card rows, ST14 |
| `test/fixtures/santander/expected.json` | Answer key: `schema`, `bank`, `tolerance`, `crossBank` (`pizzeria-trzy-sery` → ING oracle), `files`, `rows`, `patterns` |
| `test/fixtures/santander/README.md` | Generated: origin, format summary, trap table with line numbers, files, commands |
| `package.json` | `"fixture:santander": "node scripts/fixture-santander.mjs"` added; `fixture:check` **not** repointed (still ING-only) |
| `.gitattributes` | `test/fixtures/santander/** -text` added, with a comment (ING's line left untouched) |
| `context/changes/synthetic-santander-fixture/plan.md` | Phase 1 `#### Automated` rows 1.1–1.7 ticked with sha `5301ea4` (this handoff commit adds the sha suffix, written after the phase commit per the implement ritual) |
| `context/changes/synthetic-santander-fixture/change.md` | `status: plan_reviewed → implementing` |
| `context/foundation/roadmap.md` | F-03's `Status` (`## At a glance` row + item body) `planning → in-progress` |
| `context/changes/synthetic-santander-fixture/handoff.md` | This file |

## 3. Verification

| Command | Result |
| --- | --- |
| `git branch --show-current` | `feat/synthetic-santander-fixture` (observed) |
| `npm run fixture:santander` | exit 0, writes exactly 4 files (observed) |
| Determinism (`git add` then regenerate, `git status --porcelain test/fixtures/santander`) | unchanged after a second run (observed) |
| Deliberate break (criterion 1.3): `SEED` changed → regenerate | `git diff --exit-code test/fixtures/santander` exit 1 (red, observed); `SEED` restored → regenerate → exit 0 (clean, observed). Meta-check: proves the committed bytes are tied to the generator's seed, not merely present — matches the plan's own framing of this check |
| Shape smoke (`node -e`, quote-aware field count) | main CSV: no BOM, no `\r`, trailing LF, 9 fields/line, header col 7 (`180`) == data rows, header col 4 `PLN`; USD file: header col 4 `USD`, col 7 (`3`) == 3 rows (observed) |
| Header invariants (`node -e` over the generated main CSV) | opening(5000000) + Σamounts(-1036368) == closing(3963632); `Lp N` balance − amount == opening; `Lp 1` booking date strictly greater than every other row's; booking ≥ operation on every row (0 violations) — all observed true |
| Ratios (main file, informational — Phase 2 owns the tolerance bands) | adjacent booking-date inversions 14/179 = 7.8% (target ≈8%); booking==operation 10.6% (target ≈10%); card-kind rows 88.9% (target 85–90%) — observed |
| Every trap ST01–ST14 has rows + manifest entries | observed via `node -e` over `expected.json`: each id has ≥1 `rows[]` entry with matching `line`s; `crossBank` entry `pizzeria-trzy-sery` present in both `patterns[]` (type `frequent`, matches the ING oracle's) |
| `git check-ignore test/fixtures/santander/*.csv` | prints nothing (observed) |
| `git check-attr text test/fixtures/santander/expected.json` | `unset` (observed, matches the ING fixture's own `unset`) |
| ING untouched (`git diff --exit-code main -- scripts/fixture-ing*.mjs test/fixtures/ing .github/workflows/ci.yml`) | exit 0, no diff (observed) |
| `npm run lint` | 0 errors (observed; fixed 3 real findings in the new script — `TextEncoder` import, `no-control-regex`, `prefer-for-of` — plus prettier auto-fixes, baseline Δ0) |
| `npx astro check` | 0 errors, 134 files (baseline 133; +1 is the new `.mjs`, astro check doesn't lint it but the count line moved) (observed) |
| `npm run fixture:check` | OK, ING-only as expected this phase (observed, baseline Δ0) |
| `npm test` | 256 passed, 15 files (observed, baseline Δ0 — no new Vitest file this phase per plan) |
| `npm run build` | OK (observed, baseline Δ0) |
| `npx supabase db reset && npx supabase test db` | pgTAP Files=5, Tests=102, Result PASS (observed, baseline Δ0; sandbox disabled per contract for Docker/`127.0.0.1`) |
| `astro dev --port 4398` + `npm run smoke` | all smoke steps passed (observed, baseline Δ0; sandbox disabled per contract); port 4398 killed afterward, confirmed clear |

## 4. Next command

`/10x-implement synthetic-santander-fixture phase 2`

## 5. Open

- Manual-only Progress rows from Phase 1, left untouched (not verified by this step, `[reviewer]`): 1.8 (every trap
  has recognisable rows; main file matches the real-export shape) and 1.9 (privacy overlap scan vs the real exports).
- Phase 2/3 rows (8 + 9) remain pending as planned; no Phase-2 work started.
- `scripts/fixture-santander.mjs`: ST12 (date-shift/inversion) and ST13 (header shape) are file-level traits with no
  natural single merchant, so each was tagged onto one representative row (`orderMain`'s first interior inversion,
  and the `anchorHigh` row that anchors `Lp 1`/closing balance) rather than left untagged — an autonomous call, see
  §6. Phase 2's `checkPatterns`-equivalent should treat these two ids as file-level, not merchant-level, when it
  asserts "every trap id has a row".
- Known risks from `plan.md § Known risks` (S-10 partial-overlap fixture, cleaner balance chain than the real
  export) are unchanged by this phase — still open for S-10/3.7.
- No `DESIGN-GAP`, no migration, no follow-ups file (unchanged from the plan-review handoff).

## 6. Autonomous decisions

- **Implemented Phase 1 directly in this session rather than delegating to a subagent.** Chosen: direct
  implementation. Rejected: the skill's recommended subagent delegation. Why: the trap table, format invariants and
  cross-bank pattern consistency are tightly coupled (one wrong date or amount breaks a header invariant several
  functions away); a fresh subagent would have had to re-derive the same reasoning from the plan text with no
  guarantee of matching the ordering/balance scheme already reasoned through here. What would change it: a phase
  with more independent, loosely-coupled changes.
- **ST12/ST13 tagged onto one representative row each**, not left absent from `rows[].traps`. Rejected: leaving
  them untagged (they are file/header-level traits, not a merchant). Why: Phase 1's own criterion 1.8 asks that every
  trap ST01–ST14 have "matching `traps` entries in `expected.json`", and Phase 2's check-rule wording ("every `TRAPS`
  id appears in ≥ 1 row") reads literally over `rows[]`. What would change it: a Phase 2 implementer deciding these
  two ids should instead be asserted only against `files[]`/header shape, in which case the tag can be dropped from
  the row and the assertion moved.
- **Noise/date ratios tuned to the plan's "≈" targets, not asserted in code.** Chosen: verified post-generation via
  `node -e` (7.8% inversions, 10.6% equal dates, 88.9% card share — all within the plan's stated bands). Rejected:
  hard-coding a tolerance check into the generator itself. Why: Phase 1's own success criteria only ask for the
  shapes to be "recognisable"; exact tolerance bands are Phase 2's `fixture-santander-check.mjs` job (D5-style
  tolerance, not a generator-time assertion). What would change it: Phase 2 finding these ratios too far from the
  real export's to pass its own bands — regenerate with adjusted noise parameters.
- **`resolvedBy` picked per trap from `{normalization, user-merge, import}` without a product-owner check beyond
  the plan's own three fixed points (ST03 `user-merge`, ST04/ST10 `normalization`).** For ST05/ST06/ST07/ST09/ST11
  (clean raw merchant needing no further normalization) chose `import`; for noise card merchants chose
  `normalization` (plausible need to drop a trailing descriptor). Why: the plan leaves these to "the implementer"
  (Phase 1 trap table, ST05/ST06 cells have no `resolvedBy` column). What would change it: S-11's plan assigning a
  different `resolvedBy` after designing the actual normalization rules — the oracle is a declared intent, not yet
  checked against real normalization code.
- **The SHA suffix on Phase 1's Progress rows (`5301ea4`) is written back in this handoff commit, not the phase
  commit itself.** Why: the phase commit's own sha cannot be known before it exists (chicken-and-egg); this matches
  the archived ING fixture's precedent (`context/archive/2026-09-24-synthetic-ing-fixture/plan.md`, where phase 1's
  rows carry phase 1's sha but that edit necessarily landed in a later commit). What would change it: a contract
  revision requiring a dedicated empty-diff-tolerant intermediate commit instead.
