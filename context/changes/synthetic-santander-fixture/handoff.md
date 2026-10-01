# Handoff — `synthetic-santander-fixture` (slice F-03)

Written by the `/10x-implement … phase 3` step (autonomous run, final phase). Phase 3 (shape comparator, format doc,
seam sweep) is implemented, gated green and committed; `change.md` is now `implemented`. All automated Progress rows
are `[x]`; six manual rows (`[reviewer]`/`[human]`, carried from Phases 1–2 plus Phase 3's own) are still `[ ]` —
unticked on purpose, not verified by this step.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/synthetic-santander-fixture`, cut from `main` at `5e61822` |
| Commits | 11 on the branch: `24ad875` identity, `1d7c4d5` research, `0b514cb` plan, `56f48e5` plan review, `5301ea4` phase-1 impl, phase-1 handoff, `c9efa9a` phase-2 impl, `509627b` phase-2 handoff, `f28cf54` this step's phase-3 implementation, `8fa3415` this step's epilogue commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implemented` (flipped by this step's epilogue commit) |
| `## Progress` rows remaining | 6 (`grep -c '^- \[ \]' plan.md`): 1.8, 1.9 (Phase 1, `[reviewer]`), 2.8 (Phase 2, `[reviewer]`), 3.7, 3.8 (Phase 3, `[reviewer]`), 3.9 (Phase 3, `[human]`) — all manual, none of them mine to tick |
| Working tree | clean after this step's two commits (`f28cf54` phase-3 + `8fa3415` epilogue); `git status --porcelain` empty |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `scripts/fixture-santander-shape.mjs` | New. `npm run fixture:shape:santander [-- dir]` (default `data/`, empty-string arg never resolves to cwd). Local-only, never a CI gate: exits 0 with a message when the dir or `historia_*.csv` files are absent. Reuses `parseLine`/`toMinor`/`DMY`/`YMD`/`CARD` imported from `fixture-santander-check.mjs` (no second reader). Groups sides by currency — `fixture PLN`/`fixture USD` (from `expected.json`) and `real N (<CUR>)` (position-only label, currency sniffed from the file's own header, never the file name) — and diffs structure-only metrics within each currency group: BOM/CR/final-newline/UTF-8-validity, `""` count, masked header, field-count and quoting-signature distributions, description-kind distribution, card-tail ASCII/single-space/token-count/`*` shares, distinct card-mask count, BLIK `:<11 digits>` suffix share, booking-vs-operation date shares, adjacent inversion share, credits share, col3/col4 fill-by-kind, col4 masks, header col7==rows, header col6==Lp1 balance. Tolerance 5 percentage points, same style as `fixture-ing-shape.mjs`. Never prints a file name or a raw value — proven by a deliberate break (below) |
| `package.json` | `+"fixture:shape:santander": "node scripts/fixture-santander-shape.mjs"` |
| `context/foundation/import-formats.md` (Santander section) | Corrected per research.md § Real export: `Lp` 1..N ascending in file order (not "malejąco"), rows ≈ newest-first with adjacent inversions (not strict); header's two date formats (`YYYY-MM-DD` col 0, `DD-MM-YYYY` col 1) + grouped `'`-account mask spelled out; col 6 (balance) added to the quoted-amount rule; card-tail ASCII/no-diacritics + single-space/2–7-token note; `Wypłata BLIK` row + the `:<11 digits>` suffix on both BLIK kinds; free-title transfer shape (comma → quoted); `Oplata za …` recurring debit (explicitly **not** asserted as a bank fee); col 4 (counterparty account) grouping shape; the ATM regex line + import rule 5 reworded so `rawMerchant` = address text and the "bankomat" pattern name is only an S-11 normalization result, matching the fixture manifest; a new "Niezmienniki nagłówka" paragraph listing the balance-chain/unique-max-date/filename invariants the check script enforces, with an explicit note that the file carries no file-order balance chain; a pointer to `test/fixtures/santander/README.md` for the full ST01–ST14 trap list. `updated: 2026-10-02`. No value from the real exports |
| `CLAUDE.md` | One new Commands bullet: `fixture:ing`/`fixture:santander` (regenerate), `fixture:check` (both banks, CI), `fixture:shape`/`fixture:shape:santander` (local-only, never a gate) |
| `context/changes/synthetic-santander-fixture/plan.md` | Phase 3 `#### Automated` rows 3.1–3.6 ticked with sha `f28cf54` |
| `context/changes/synthetic-santander-fixture/change.md` | `status: implementing` → `implemented`, `updated: 2026-10-02` (epilogue commit `8fa3415`) |

Not touched this phase: `scripts/fixture-santander.mjs` (generator), `scripts/fixture-santander-check.mjs` (check),
`scripts/fixture-ing*.mjs`, `test/fixtures/**` (no regeneration needed a code change — see Verification), CI
workflow, `supabase/**`.

## 3. Verification

| Command | Result |
| --- | --- |
| `git branch --show-current` | `feat/synthetic-santander-fixture` (observed) |
| `node scripts/fixture-santander-shape.mjs` (no arg) | exit 0, "no historia_\*.csv in …/data" (observed; data/ has none) |
| `npm run fixture:shape:santander -- ""` | exit 0, same message — confirms empty-string arg does not resolve to cwd (observed) |
| Privacy smoke: copied the fixture's main CSV into a scratch dir renamed `historia_2026-01-01_<26 invented digits>.csv`, ran the tool against that dir | exit 0; output grepped for `[0-9]{26}` and `historia_` — no match (observed). Output showed "No structural differences" for PLN (the copy is byte-identical to the fixture it's compared against) and a one-sided USD section, exactly as expected |
| Deliberate break (criterion 3.3): edited the real-file label line in `fixture-santander-shape.mjs` to interpolate the (unprinted) file name, re-ran against the same scratch dir | red — the same privacy grep now matched the leaked `historia_2026-01-01_…csv` string in the output (observed, `GATE break-check: PASS`); restored the file from a pre-edit scratchpad backup (`cp`, not git — the file was untracked at that point) and re-ran → grep clean again (observed). Meta-check: proves the grep catches a real leak, not merely that the tool happens not to leak one |
| Real-export run (contract-mandated: "run it against the real PLN export … output that is counts/shapes") | **Could not complete** — `readdirSync`/`ls` against `/Users/kamilp/Downloads/historia_cvs_2026-09-18/` returns `EPERM: operation not permitted` even with the Bash sandbox disabled (direct `readFileSync` of a named file in that dir *does* succeed, so this is a macOS directory-listing/TCC restriction on this host, not the Claude Code sandbox and not a tool bug — see `ARTIFACT GAP` below). The scratch-copy test above exercises the same code path (reader + masking + diffing) end-to-end and proves no name/value leak; only the live comparison against the real file's own shape differences is unverified |
| `npm run fixture:santander` (regenerate, no generator change this phase) | exit 0, `git status --porcelain test/fixtures/santander` empty after — determinism unaffected (observed) |
| `npm run fixture:check` | `fixture:check ing OK` + `fixture:check santander OK` (observed; unaffected by this phase, no generator/check files touched) |
| `npm run lint` | 0 errors (observed; baseline Δ0 — one eslint --fix pass on the new script before commit, no findings left) |
| `npx astro check` | 0 errors, 137 files (observed; baseline-after-phase-2 136, +1 is the new `.mjs` file in the count, same pattern as phases 1–2) |
| `npm test` | 256 passed, 15 files (observed, baseline Δ0 — no new Vitest file per plan) |
| `npm run build` | OK (observed, baseline Δ0) |
| `npx supabase db reset && npx supabase test db` | pgTAP Files=5, Tests=102, Result PASS (observed, baseline Δ0; sandbox disabled per contract) |
| `astro dev --port 4398` + `npm run smoke` | all smoke steps passed (observed, baseline Δ0; sandbox disabled per contract); port 4398 killed afterward, confirmed clear (`lsof -ti :4398` empty) |

## 4. Next command

`/10x-impl-review synthetic-santander-fixture`

## 5. Open

- **`ARTIFACT GAP`**: the manual step "run `fixture:shape:santander` against the real export dir, sandbox disabled"
  (plan § Manual Testing Steps item 3, feeding reviewer row 3.7) could not be executed from this session —
  `readdirSync('/Users/kamilp/Downloads/historia_cvs_2026-09-18')` and plain `ls` both return `EPERM` even with
  `dangerouslyDisableSandbox: true`, while `readFileSync` of an individual named file in the same directory
  succeeds. This points at a macOS per-directory TCC restriction on this host/process (Downloads folder
  protection), not Claude Code's own sandbox and not a defect in `fixture-santander-shape.mjs` — the tool's logic
  was proven end-to-end against a scratch copy of the fixture CSV (§3). Whoever does the real-export comparison
  (reviewer row 3.7, or a human with Full Disk Access / Terminal Downloads permission) can run
  `npm run fixture:shape:santander -- /Users/kamilp/Downloads/historia_cvs_2026-09-18` directly; no code change
  should be needed.
- Manual-only Progress rows, left untouched (not verified by this step): 1.8, 1.9 (Phase 1, `[reviewer]`), 2.8
  (Phase 2, `[reviewer]`), 3.7, 3.8 (Phase 3, `[reviewer]`), 3.9 (Phase 3, `[human]`, product-owner confirmation of
  `Wypłata BLIK`/ST03/`Oplata za …` oracle calls).
- `change.md` is now `implemented` even though those six manual rows are open — per this run's explicit instruction
  ("run the epilogue → status implemented, even with [reviewer]/[visual]/[human] rows open"); see §6.
- Known risks from `plan.md § Known risks` (S-10 partial-overlap fixture; the real export's balance chain is
  cleaner in the fixture by construction) are unchanged by this phase — still open for S-10.
- No `DESIGN-GAP`, no migration, no follow-ups file (unchanged from Phases 1–2).
- Next slice per the run contract: S-10 `santander-csv-import`.

## 6. Autonomous decisions

- **Implemented Phase 3 directly in this session rather than delegating to a subagent.** Chosen: direct
  implementation. Rejected: the skill's recommended subagent delegation. Why: same reasoning as Phases 1–2 — the
  shape tool's metrics and the doc corrections are tightly coupled to the exact format contract Phase 2 already
  encoded (`DMY`/`YMD`/`CARD` regexes, the header-invariant list) and to research.md's real-export findings; a
  fresh subagent would have had to re-derive that grounding from scratch. What would change it: a phase with more
  independent, loosely-coupled changes.
- **Skipped every `AskUserQuestion` prompt the skill specifies (exec-mode choice, commit-message approval, dirty-path
  prompt, next-phase decision, stragglers-at-epilogue).** Chosen: decide and proceed, record here. Why: the run
  contract's hard rule 1 forbids `AskUserQuestion` in this run; this task's own instructions name the epilogue
  stragglers case explicitly ("even with [reviewer]/[visual]/[human] rows open"). What would change it: a future
  run contract that re-enables human-in-the-loop prompts.
- **Treated the real-export shape-comparison run as a best-effort verification step, not a hard blocker, when it
  hit an OS-level `EPERM` outside the Claude Code sandbox.** Chosen: record as `ARTIFACT GAP`, proceed with the
  phase (the scratch-copy test already proves the tool's logic and its privacy guarantee end-to-end). Rejected:
  blocking the whole phase on an environment permission this session cannot grant itself, or weakening the privacy
  test to work around it. Why: the automated Phase 3 success criteria (3.1–3.6) do not require reading the real
  directory; only the `[reviewer]`-tagged manual row 3.7 does, and that row was never going to be ticked by this
  step regardless. What would change it: Full Disk Access (or equivalent) granted to the process running these
  Bash commands, or the real export copied to a path the sandbox/TCC already permits (the run contract does not
  authorize moving it, so this step did not attempt that).
- **`Oplata za …` stays an unlabeled recurring debit in the corrected doc, not called a "bank fee."** Chosen: match
  research.md's own finding ("not provable from shape"). Rejected: adopting `change.md`'s earlier "bank fee"
  framing. Why: plan § Changes Required #4 explicitly requires this ("change.md claims that the plan refined
  (`Oplata za` "bank fee") not repeated in the new docs"); carried forward unchanged from the plan's own decision
  table. What would change it: a product owner confirming the fee framing (feeds reviewer row 3.9, already
  deferred).
- **Shape-comparator currency grouping uses the real file's own sniffed header currency, never the file name or a
  hard-coded expectation.** Chosen: `currencyOf()` reads and parses just the first line's col 4. Rejected: assuming
  one real PLN file and one real USD file by position (the plan's two named exports) or reading the file name's
  date to infer anything. Why: keeps the tool honest if a reviewer points it at a directory with a different mix,
  and never needs the file name for anything. What would change it: a future requirement to compare more than two
  currencies at once, which this grouping already supports without change.
