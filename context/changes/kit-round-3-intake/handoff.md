# Handoff — `kit-round-3-intake` (slice F-04)

Written by the `/10x-implement … phase 1` step: Phase 1 is committed (`7188f7f`), Progress rows 1.1–1.7 ticked with the SHA,
1.8 `[reviewer]` left open. The next agent must NOT run prettier on `design/` or `src/styles/brand.css` (byte-faithful kit;
`git show --stat HEAD -- design src/styles` after p1 showed no reformatting, brand.css +8).

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/kit-round-3-intake`, cut from `main` at `577b163` (+ roadmap commit `78386c1`) |
| Commits this step | `7188f7f` `feat(kit-round-3-intake): Runda 3 kitu na miejscu, aplikacja dostosowana (p1)` (+ this handoff commit) |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | 17 (`grep -c '^- \[ \]' plan.md`): 1.8 `[reviewer]`, all of Phases 2 and 3 |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `design/rytm-os/**` | round-3 delivery copied byte for byte per the contract mapping; only `react-kit/docs/content.json` differs (4 restored `authStates` keys: `loginError`, `resetTitle`, `resetBody`, `checkInbox`, appended at the end of `authStates`) |
| `src/styles/brand.css` | via `scripts/sync-kit.sh`: +8 `--rytm-*` tokens; `public/rytm` unchanged |
| `src/lib/format.ts`, `test/unit/format.test.ts` | `fillMonthLocative` („we wrześniu”) + 5 cases |
| `src/lib/patterns/table-columns.ts`, `test/unit/table-columns.test.ts` | `tableHeaders` (kit indices 0,1,2,4,3,5,6) + 1 test |
| `src/components/patterns/PatternsTable.tsx`, `src/pages/patterns.astro`, `src/content/copy.ts` | `<thead>` maps `tableHeaders`; `amountColumn` prop/copy removed; `copyExtra.imports.saveError` added |
| `src/pages/{home,fixed,register,settings,imports/new}.astro`, `src/pages/reset/new.astro`, `src/pages/patterns/[...key].astro` | `stats[1]`, `trend.minimumMonths` + `{n}`, `fillMonthLocative`, `{n}` ← `MIN_PASSWORD_LENGTH`, `genericError` ← `copyExtra.imports.saveError` |
| `context/changes/kit-round-3-intake/{plan.md,change.md,handoff.md}` | Progress 1.1–1.7 ticked + SHA; status `implementing` |

## 3. Verification

| Command | Result |
| --- | --- |
| `diff -rq` delivery vs kit, per mapping | only `react-kit/docs/content.json` differs; parsed diff: the 4 `authStates` keys absent in delivery, present in kit |
| `bash scripts/sync-kit.sh` re-run | idempotent (no new changes); `git diff src/styles/brand.css` = 8 token lines |
| `grep -rnE "stats\[[2-9]\]\|columns\.slice\|amountColumn" src` | empty |
| `npm run lint` | 0 errors |
| `npx astro check` | 0 errors (151 files; baseline 149, +2 new files) |
| `npm run fixture:check` | OK (ing, santander) |
| `npm test` | 341 passed / 21 files (baseline 335 / 20, +6 tests, +1 file; `format.test.ts` +5, `table-columns.test.ts` +1) |
| `npm run build` | OK |
| `npx supabase db reset && npx supabase test db` | Files=6, Tests=119 PASS (Δ0) |
| `npm run smoke` on :4398 | 151 PASS / 0 FAIL (baseline 151, Δ0); dev server killed |
| Break 1: delete `authStates.loginError` | `astro check` red at `login.astro` (`s.loginError`); restored via `git checkout` → green. Meta-check: astro check guards removed keys only — with `home.astro` reading `stats[2]` it stays green (0 errors, verified), hence Phase 2 kit-contract test |
| Break 2: `fillMonthLocative` always writes `w ` | 2 September cases red (Nowe we wrześniu, Suma we wrześniu); restored → 30 passed. Meta-check: the May/January cases stay green, so the break isolates exactly the preposition rule |

## 4. Next command

`/10x-implement kit-round-3-intake phase 2`

## 5. Open

- Manual rows: 1.8 `[reviewer]` kit equals delivery except the 4 restored strings (checked by me with `diff -rq`, not ticked — reviewer's); 2.8 `[reviewer]`; 3.6 `[visual]`; 3.7 `[reviewer]`; 3.8 `[human]` (kit-text deviations: „we wrześniu”, `tableHeaders` body order, `copyExtra.imports.saveError`, 4 restored `authStates`).
- Phase 2/3 still to do: kit-contract test, 6 smoke steps, K18 `DESIGN-GAP` comments removal (`home.astro`, `patterns.astro`, `fixed.astro`, `patterns/[...key].astro`), `CLAUDE.md` `npm test` line; Phase 3 seam sweep includes stale comments in `home.astro` (K25 header naming the third card), `copy.ts` K25, `PatternsTable.tsx` file header, `ImportWizard.tsx` `genericError` doc, `TrendChart.astro` header.
- `/fixed` reads `result.overview.referenceMonth ?? ""` (type is `string | null`; non-null in the rendering branch).
- Roadmap F-04 row status is `planning` (non-standard value); I left `roadmap.md` untouched (orchestrator/archive own it). Known risks in plan unchanged: `.prettierignore` for `design/` + `src/styles/brand.css` is a Phase 3 follow-up candidate. No `DESIGN-GAP` added; no migration.

## 6. Autonomous decisions

1. **Execution mode: in this context, no subagent** (AskUserQuestion forbidden). Rejected: delegate. Would change: context nearing 300k.
2. **Commit message approved as drafted** (Polish, per contract). Would change: a maintainer-specified subject.
3. **Ran `prettier --write` only on `src/pages/fixed.astro` and `home.astro`** (ordinary src files my edits left unformatted), never on `design/` or `brand.css`. Would change: nothing.
4. **Roadmap `in-progress` flip skipped** — the F-04 row says `planning`, not the template's `ready`; orchestrator manages roadmap. Would change: a contract line asking the implement step to flip it.
5. **Rows 1.1–1.7 ticked, 1.8 left** per the `[reviewer]` rule, though I verified it with `diff -rq`.
