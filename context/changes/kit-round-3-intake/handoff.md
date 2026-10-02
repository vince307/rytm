# Handoff — `kit-round-3-intake` (slice F-04)

Written by the `/10x-implement … phase 2` step: Phase 2 is committed (`3507260`), Progress rows 2.1–2.7 ticked with the SHA, 2.8 `[reviewer]` and 1.8 `[reviewer]` left open. The next agent must NOT run prettier on `design/` or `src/styles/brand.css` (byte-faithful kit).

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/kit-round-3-intake`, cut from `main` at `577b163` (+ roadmap commit `78386c1`) |
| Commits this step | `3507260` `feat(kit-round-3-intake): Straże regresji i sprzątanie K18 (p2)` (+ this handoff commit, which also carries the SHA suffixes on rows 2.1–2.7) |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | 10 (`grep -c '^- \[ \]' plan.md`): 1.8 `[reviewer]`, 2.8 `[reviewer]`, all 8 of Phase 3 |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `test/unit/kit-contract.test.ts` | new: 6 cases pinning the 4 `authStates` keys, `stats` ≥ 2 with `stats[1]` = „Koszty stałe”, 7 `patterns.columns` + `tableHeaders`, `{month}`/`{n}` placeholders, `trend.minimumMonths` = 3, `passwordMinLength` = `MIN_PASSWORD_LENGTH`, 12 `monthsLocative` |
| `scripts/smoke.mjs` | +6 steps, added lines only (reset copy, login error, register `{n}`, settings `{n}`, fixed „Nowe w maju”, patterns „Ponad progiem”) |
| `src/pages/{home,patterns,fixed}.astro`, `src/pages/patterns/[...key].astro` | 4 `DESIGN-GAP: K18` comments removed |
| `CLAUDE.md` | `npm test` line names the kit-contract test |
| `context/changes/kit-round-3-intake/{plan.md,handoff.md}` | Progress 2.1–2.7 ticked + SHA |

## 3. Verification

| Command | Result |
| --- | --- |
| `npm run lint` | 0 errors |
| `npx astro check` | 0 errors (152 files; baseline 149; p1 151, +1 new test file) |
| `npm run fixture:check` | OK |
| `npm test` | 347 passed / 22 files (baseline 335 / 20; +12 tests, +2 files in total; p2 alone +6 / +1) |
| `npm run build` | OK |
| `npx supabase db reset && npx supabase test db` | Files=6, Tests=119 PASS (Δ0) |
| `npm run smoke` on :4398 | 157 PASS / 0 FAIL (baseline 151, +6); dev server killed |
| `grep -rn K18 src`; `grep -rn DESIGN-GAP src \| wc -l` | empty; 52 (was 56, −4) |
| `git diff main -- scripts/smoke.mjs` | 0 removed lines |
| Break 1: drop „Kwota” from `patterns.columns` in `content.json` | kit-contract (7 columns) and `table-columns` red; restored via `git checkout` → green. Meta-check: both fail on the column count/order, which is exactly what the break removes |
| Break 2: `home.astro` `stats[1].label` → `stats[2].label` | `astro check` 0 errors and kit-contract 6/6 green, as predicted: nothing automated guards the reader-side index; the guard is the Phase 1 grep `stats\[[2-9]\]`, the `stats[1]` pin of the kit and the visual row; restored |
| Break 3: `fixed.astro` section title → raw `copy.fixedCosts.new` | smoke `fixed fills the month in the new section title` FAIL (only that step); restored → all steps pass. Meta-check: `fixed.astro` is plain Astro, so the needle is not satisfiable by island props |

## 4. Next command

`/10x-implement kit-round-3-intake phase 3`

## 5. Open

- Manual rows: 1.8 `[reviewer]`; 2.8 `[reviewer]` (every kit-contract assertion maps to a real read: `login.astro`/`reset.astro` authStates, `home.astro` stats, `PatternsTable.tsx` columns, `fixed.astro`/`[...key].astro` `{month}`, trend `tooShort`/`minimumMonths`, `register.astro`/`settings.astro`/`reset/new.astro` `{n}` — I checked, not ticked); 3.6 `[visual]`; 3.7 `[reviewer]`; 3.8 `[human]`.
- The `/settings` smoke step asserts the password-minimum text from island props (no rendered node exists until typing); same for `/register`.
- Phase 3 to do: gap register round 3 (`context/foundation/design-kit.md` `kit_round: 3`), follow-ups, seam sweep (stale comments in `home.astro` K25 header, `copy.ts` K25, `PatternsTable.tsx` header, `ImportWizard.tsx` `genericError` doc, `TrendChart.astro` header); `.prettierignore` for `design/` + `brand.css` stays a follow-up candidate.
- No `DESIGN-GAP` added; no migration. Roadmap F-04 row untouched (status `planning`).

## 6. Autonomous decisions

1. **Execution mode: in this context, no subagent** (AskUserQuestion forbidden). Rejected: delegate. Would change: context nearing 300k.
2. **Commit message approved as drafted** (Polish). Would change: a maintainer-specified subject.
3. **Smoke `/register` step placed after the anonymous login steps** (signed-in users are redirected from `/register`). Would change: smoke order restructuring.
4. **K18 comments deleted outright**, not replaced by a non-gap comment (surrounding code is self-explanatory). Would change: a reviewer asking for a pointer to `components.error`.
5. **Rows 2.1–2.7 ticked, 2.8 left** per the `[reviewer]` rule. Break 3 was run against the live `astro dev` (HMR) rather than a restart.
