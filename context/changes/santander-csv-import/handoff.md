# Handoff — `santander-csv-import` (slice S-10)

The `/10x-implement santander-csv-import phase 1` step of autonomous run `2026-10-01-m2-santander` implemented
Phase 1 (shape comparator fix, F-03 F9, and the R1 metric). It is committed and the local gate is green. The next
agent must not get this wrong: Phase 1 touched **scripts only** — no product code, no migration — so Phases 2–6
start from an unmodified `src/`, `supabase/`, and `test/` tree. The real-export comparison in `## 3` found one new,
explained, non-blocking difference; read it before assuming F9 is fully quiet on real data.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/santander-csv-import`, cut from `main` at `1fed366` |
| Commits | 6 on top of `1fed366`: identity (`d2f2a86`), research (`e5f54f9`), plan (`396ea97`), plan review (`e576f3d`), **this step**: Phase 1 fix (`b7880c3`), Phase 1 SHA backfill (`00c4400`) |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `implementing` (flipped from `plan_reviewed` at entry to this step) |
| `## Progress` rows remaining | 38 (`grep -c '^- \[ \]' plan.md`; was 43, -5 for Phase 1's automated rows) |
| Working tree | clean (`bash .claude/skills/10x-autonomous-run/scripts/tree-clean.sh` → `CLEAN`) |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `scripts/fixture-santander-shape.mjs` | `same()`: a distribution key present on only one side is now always a difference (tolerance stays for keys on both sides) — closes F-03 F9. `shape()`: splits lines on `/\r?\n/`; `'"" occurrences: share'` now counts parsed quoted-empty fields as a share of lines, replacing the old absolute `text.match(/""/g)` count. New metrics `"operation date before header start: share"` and `"booking date before header start: share"` (R1 guard), from the parsed header col 1 against each row's col 1 / col 0. |
| `context/changes/santander-csv-import/plan.md` | `## Progress` 1.1–1.5 ticked with `— b7880c3`/`— 00c4400`; no other section touched. |
| `context/changes/santander-csv-import/change.md` | `status: plan_reviewed → implementing`, `updated: 2026-10-02`. |
| `context/foundation/roadmap.md` | S-10's `## At a glance` row and item body `Status: planning → in-progress` (roadmap-sync step, best effort, ran clean — roadmap had no pre-existing dirty state). |
| `context/changes/santander-csv-import/handoff.md` | This file. |

## 3. Verification

| Command | Result (observed in this step) |
| --- | --- |
| `git branch --show-current` | `feat/santander-csv-import` (confirmed before starting) |
| `node --check scripts/fixture-santander-shape.mjs` | OK |
| `npm run fixture:shape:santander -- <scratch dir, fixture PLN file renamed historia_2026-01-01_<26 nines>.csv>` | exit 0; prints both R1 metrics (0% / 0%); output greped for `\d{26}` and `historia_` — no match |
| One-sided variant (one row's col-4 mask changed to a shape absent from the fixture, 0.5% of rows) | reported `≠ col4 masks` (new key on the "real" side only) |
| **Deliberate break (1.3)**: staged the fix, then reverted `same()` in the worktree to the old key-by-key tolerance only (no presence check) | the same 0.5% one-sided variant printed `= col4 masks` again (red — the old bug reproduced) |
| Restore | `git checkout -- scripts/fixture-santander-shape.mjs` (exact reset to the staged fix); re-ran → `≠ col4 masks` again (green). Meta-check: the break toggled only the presence rule, not `TOLERANCE_PP`, so this proves the new rule catches it, not the tolerance value |
| `npm run fixture:check` | `fixture:check ing OK`, `fixture:check santander OK` |
| `git diff --exit-code main -- scripts/fixture-ing-shape.mjs test/fixtures` | exit 0 (unchanged) |
| `npm run lint` | 0 errors (baseline: 0) |
| `npx astro check` | 0 errors, 0 warnings, 137 files (baseline: 137 files, 0 errors) |
| `npm test` | 256 passed, 15 files (baseline 256/15 — Δ0) |
| `npm run build` | OK |
| `npx supabase db reset && npx supabase test db` (sandbox disabled: Docker) | Files=5, Tests=102, Result: PASS (baseline Files=5 Tests=102 — Δ0) |
| `astro dev --port 4398` + `npm run smoke` (sandbox disabled: network) | 140 PASS / 0 FAIL (baseline 140/0 — Δ0); dev server killed after (`lsof -ti :4398 -ti :4399` clear) |
| Real-export comparison (sandbox disabled, run-contract symlink dir), **[reviewer] row 1.6 — not ticked by me** | Output is aggregates only (no file name, no 26-digit number). Both R1 shares (`operation/booking date before header start`) are **0%** on both real files — R1 stays closed. One new difference on the PLN side: `≠ row quoting signature`, a key `BBQ__QQB_` at 2.3% of real rows, absent from the fixture. **Explained, not a STOP**: position 2 (description) is quoted only when it contains a comma (Santander's own quoting rule); some real card rows have a merchant tail with a comma (e.g. a city separated by `,`). `description kind` is unchanged (still `card` on both sides) and the card-tail metrics (ASCII/single-space/`*`/token-count shares) are all unchanged, so the CARD regex still matches and the tail still parses as plain ASCII tokens. Phase 4's ported `parseLine` already parses a quoted field with an embedded comma correctly (it reads to the closing `"`, not to the first `,`), and rule 5's capture `(.+)$` is comma-agnostic — so Phase 4 needs no contract change for this. USD side: `No structural differences.` |

## 4. Next command

`/10x-implement santander-csv-import phase 2`

## 5. Open

**Carried from plan-review handoff, unchanged** (plan.md § Known risks): S-11 re-keys Santander card patterns;
R1 guarded only by the Phase 1 shape metric run by hand (now also run once against both real exports, see `## 3`);
rollback shows "ING · Rachunek"; the PR preview (production DB) cannot import until merge; Santander `title` holds
the masked card number (own data, RLS).

**New from this step:**
- The real PLN export has card rows whose merchant tail contains a comma (≈2.3% of real rows), which Santander's
  own comma-quoting rule renders as a quoted description field. Confirmed harmless for Phase 4 (see `## 3`), but
  worth a positive test case in `test/unit/santander-parser.test.ts` if the fixture doesn't already cover a
  comma-in-tail card row — check `expected.json`/`README.md` traps (ST01–ST15) for one before assuming a gap.

**Manual-only Progress rows (checklist, unchanged except 1.6 now has a recorded finding):**

- **1.6 [reviewer]** Real-export comparison — run in this step (see `## 3` above) with no STOP trigger, but left
  unticked per the run contract ("Rows tagged [reviewer]/[visual]/[human] are NOT yours"). A reviewer should read
  the `## 3` finding and tick it if satisfied.
- 2.7 [reviewer] Migration review.
- 3.6 [reviewer] ING smoke steps byte-identical.
- 4.7 [reviewer] Reader vs rules 1–6.
- 5.6 [visual] List and result.
- 6.6 [visual] Every wizard state at 1280 and ~400 px.
- 6.7 [reviewer] Full local Santander import.
- 6.8 **[human]** Import the owner's real export locally.
- 6.9 **[human]** Accept the rule-7 deviation (Lp not stored).
- 6.10 **[human]** Accept the K26 wording, including "Rachunek".
- 6.11 **[human]** Accept that S-11 re-keys Santander card patterns.

**DESIGN-GAP to add in implement:** K26 (Phases 5–6), unchanged — not due yet.

**Follow-ups:** F-03 F9 closed by this phase. No new follow-up file.

## 6. Autonomous decisions

1. **Implemented Phase 1 directly in this context, not delegated to a subagent.**
   - Chosen: write the scripts-only diff here. Rejected: dispatch a `general-purpose` subagent.
   - Why: one file, ~40 lines, no product code or migration — the overhead of a dispatch/return round-trip was
     not worth it, and this step is already a fresh, lean agent.
   - What would change it: Phase 1 growing to touch product code too.
2. **Commit type `fix`, not `feat`.**
   - Chosen: `fix(santander-csv-import): shape comparator closes F9, adds R1 metric (p1)`.
   - Rejected: `feat`.
   - Why: this closes a hidden bug in a dev-only comparator and adds a diagnostic metric; it changes no
     user-visible product behaviour.
   - What would change it: nothing — this is a style call, not a correctness one.
3. **Added a second, small `chore` commit (`00c4400`) to backfill the Progress SHA suffix.**
   - Chosen: commit the SHA-annotated `plan.md` separately, right after the phase commit.
   - Rejected: leaving `plan.md`'s SHA suffixes dirty in the worktree for Phase 2 to pick up, as `references/SKILL.md`'s
     ritual literally describes (SHA is written back *after* the commit it refers to, chicken-and-egg).
   - Why: `agent-contract.md` and `.claude/skills/10x-autonomous-run/scripts/tree-clean.sh` define "clean tree" with
     an **empty** allow-list — this run has a fresh agent per step, so a step cannot rely on the next step's agent
     to silently inherit known-dirty files the way a single long-lived interactive session would.
   - What would change it: `tree-clean.sh` growing an allow-list entry for this exact pattern, or the orchestrator
     explicitly saying a dirty `plan.md` between phases is acceptable.
4. **Did not tick Progress 1.6, but ran its command anyway.**
   - Chosen: run the real-export comparator under the contract's symlink dir (sandbox disabled) to verify Phase 1's
     fix is safe against real data, record the finding in `## 3`/`## 5`, leave the checkbox `- [ ]`.
   - Rejected: skipping the real-export run entirely (leaving F9 unverified against real data); ticking the box
     myself.
   - Why: the run contract allows "later steps that must re-check a shape" to open the real exports, and Phase 1's
     own plan text says the comparator "is then re-run against the real exports" — but the contract separately
     says `[reviewer]` rows are never mine to tick, and judging "is every difference explained" is exactly a
     reviewer judgment call.
   - What would change it: the contract naming implementer-run real-export checks as self-tickable.
5. **Classified the new `row quoting signature` real-only difference as explained, not a STOP.**
   - Chosen: record it as explained in `## 3`/`## 5`, proceed to Phase 2.
   - Rejected: treating it as the Phase 1 manual criterion's STOP condition ("otherwise STOP: the reader contract
     changes").
   - Why: the difference is fully accounted for by Santander's own comma-quoting rule, and neither `description
     kind` nor any card-tail metric shifted — so the card regex and rule-5 extraction are unaffected. The dialect
     `parseLine` Phase 4 will port already closes a quoted field on its closing `"`, not on an internal comma.
   - What would change it: a reviewer or Phase 4 finding a real card tail where the comma sits *inside* the part
     rule 5 extracts (not just before the closing quote) — then the regex capture would need a look.
