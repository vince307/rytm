# Handoff — `merchant-patterns` (slice S-03)

Written by the `plan-review` step (`/10x-plan-review merchant-patterns`, deep). Verdict **SOUND after fixes**
(REVISE before: 0 critical, 4 LOW-impact warnings, all fixed in `plan.md`; 3 observations recorded under
`plan.md` `## Known risks`). Nothing is implemented. The one thing the next agent must not get wrong: **never import
the fixture into the seeded `test@rytm.local`** — the smoke step "patterns renders empty view" needs it empty; use a
freshly registered local account for data states, and assert the smoke type badge as `>stały<`, not the bare word.

## 1. State

| Item | Value |
|---|---|
| Branch | `feat/merchant-patterns`, cut from `main` at `d11f3ef` |
| Commits | 5 on top of `d11f3ef` after this step (`d11f3ef..HEAD`): 2 × change identity, research, plan, `docs(merchant-patterns): plan review` |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `plan_reviewed` |
| `## Progress` rows remaining | 20 of 20 (`grep -c '^- \[ \]' plan.md`) — 17 automated, 3 manual; titles unchanged |
| Working tree | clean apart from the maintainer's `.gitignore` and `.claude/skills/10x-autonomous-run/` (never staged) |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/merchant-patterns/reviews/plan-review.md` | Plan review report (`<!-- PLAN-REVIEW-REPORT -->`), F1–F7 with decisions |
| `context/changes/merchant-patterns/plan.md` | Fixes F1–F4 applied in Phase 3 (§4 null client → error, §5 K18 gap row, §6 smoke asserts `>stały<`, Manual Verification + Manual Testing Steps use a fresh account); new `## Known risks` (F5–F7) before `## Progress` |
| `context/changes/merchant-patterns/change.md` | Frontmatter `status: planned → plan_reviewed` |
| `context/changes/merchant-patterns/handoff.md` | This handoff |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/merchant-patterns` — observed before writing |
| Scratch end-to-end prototype (`node --experimental-strip-types`, copy of `src/lib/import/ing.ts` + the plan's `rawMerchant` / 7-rule `normalizeMerchant`, in `$TMPDIR`, not committed): main fixture CSV → `parseIngStatement` → `buildImportPayload(MAIN_ACCOUNT)` | 206 rows, 0 `rawMerchant` mismatches vs `expected.json`, **31 groups**, only split = `sportowo` / `sportowo.pl`, no over-merge — observed; confirms Phase 1 criterion independently of the plan step's prototype |
| `python3` over `expected.json` | main file imported 206 rows / 6 497 147 grosze, all on `Rachunek Firmowy Główny`; `patterns[]` 30 — observed |
| `npx vitest run` | 32/32 tests, 3 files — observed (= run baseline, delta 0; docs-only step) |
| Plan structure | 1 `## Progress`, last section; Phase 1/2/3 criteria 7/4/9 ↔ Progress 1.1–1.7 / 2.1–2.4 / 3.1–3.9; no checkboxes in phase blocks — observed |
| `npm run lint`, `astro check`, `build`, `supabase test db`, `smoke` | not run — docs-only step, no code touched. Inherited, unverified here: lint 0, astro check 0/0/0, build OK, pgTAP 44/44, smoke 46/46 (run baseline on `main`) |

## 4. Next command

`/10x-implement merchant-patterns`

## 5. Open

- Manual Progress rows (human checklist after the run):
  - [ ] 1.7 read `normalizeMerchant` (`src/lib/patterns/merchant.ts`) against the plan's rule list
  - [ ] 3.8 screenshots `lista`, `lista-mobile`, `wyszukiwanie`, `sortowanie-nazwa`, `pusty`, `brak-wyników` (Visual step; **fresh local account** with the main fixture imported; `pusty` = seeded user)
  - [ ] 3.9 fixture list: 31 rows, `KINOTEKA` `stały` 52,99 zł, `MINIMARKET PRZYSTANEK` 8×, two `sportowo` rows
- DESIGN-GAPs the implement step must register in `context/foundation/design-kit.md`: **K17** (Kwota column),
  **K18** (no generic read-error copy; `components.error` stands in — comment in `src/pages/patterns.astro` error
  branch), **G28** (later-slice parts omitted); K11 row gains the new `copyExtra.patterns` strings.
- Known risks (plan.md `## Known risks`): merchant-mark casing vs kit `patternRows()` (F5 — follow the kit or register
  in G28); offset paging in `collectPages` can skip rows under a concurrent delete (F6 — keyset paging is the fix if
  it matters); real-data over-merge by the `SA` / ≥ 3-digit rules in `normalizeMerchant` (F7). Roadmap `### S-03`
  Risk line still promises a migration — archive step should correct it.
- S-04 / S-05 planning input: pattern identity = `merchantKey` string (`src/lib/patterns/merchant.ts`), no row id.

## 6. Autonomous decisions

- **Triaged every finding myself** instead of the skill's AskUserQuestion loop (contract rule 1): WARNINGs F1–F4
  fixed in `plan.md` (each had one obvious fix); OBSERVATIONs F5–F7 recorded only. Would change: a maintainer
  reopening any finding in `reviews/plan-review.md`.
- **Verdict SOUND (after fixes), not REVISE.** Why: all four warnings were LOW impact and are now in the plan; no
  dimension FAILs; the riskiest claim (31-group partition) re-derived end to end. Rejected RETHINK: the derived-on-read
  approach and the oracle-as-partition test design hold. Would change: implement finding the partition differs from
  31 on the real parser path, or S-04/S-05 needing stored pattern ids now.
- **F3: null Supabase client → error state**, rejected: empty state as in `imports/index.astro`. Why: the slice's
  own rule "a failed read never shows the empty state". Would change: the maintainer wanting parity with the imports
  list.
- **F4: new K18 row** rather than folding the error copy into G28. Why: it is a copy gap (K-series), not a missing
  element. Would change: the kit author delivering a generic read-error key.
- **F5 left to the implementer** (follow kit or register), rejected: prescribing one. Why: cosmetic, both are within
  the rules. Would change: impl-review preferring one form.
- **F6 not fixed** (offset paging kept), rejected: rewriting Phase 2 to keyset paging. Why: the plan's loop is
  correct for the stated volume and its deliberate-break test is already designed; keyset is an improvement, not a
  fix. Would change: S-02 undo shipping first, or any observed skipped row.
- **No sub-agent** for Step 3 (the skill asks for one): this step's toolset has no agent tool, so the codebase
  verification ran inline. Would change: an agent tool being available.
- **`change.md` status set by a direct frontmatter edit** — no metadata guard exists for `plan_reviewed`. Would
  change: a guard script for this transition.
