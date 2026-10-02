# Handoff — `kit-round-3-intake` (slice F-04)

Written by the `/10x-implement … phase 3` step (last phase): Phase 3 is committed (`d54c0e3`), rows 3.1–3.5 ticked with the SHA, `change.md` status `implemented`. Rows 1.8, 2.8, 3.6, 3.7, 3.8 are manual and NOT ticked. Do not run prettier on `design/` or `src/styles/brand.css`.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/kit-round-3-intake`, cut from `main` at `577b163` (+ roadmap commit `78386c1`) |
| Commits this step | `d54c0e3` `feat(kit-round-3-intake): Rejestr braków rundy 3, follow-upy, sprzątanie szwów (p3)` + one epilogue/handoff commit |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `implemented` |
| `## Progress` rows remaining | 5 (`grep -c '^- \[ \]' plan.md`): 1.8 `[reviewer]`, 2.8 `[reviewer]`, 3.6 `[visual]`, 3.7 `[reviewer]`, 3.8 `[human]` |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `context/foundation/design-kit.md` | `kit_round: 3`, kit contents updated, new § „Runda 3 — status rejestru” (K11–K26, G20, G23–G37), new rows K27–K32, § „Do rundy 4” replaces „Do rundy 3” |
| `context/changes/kit-round-3-intake/follow-ups/review-fixes.md` | new: 4 entries (S-14, S-15, S-12, month templates), each with `Trigger:` |
| `src/components/imports/ImportWizard.tsx` | `genericError` doc now names `copyExtra.imports.saveError` (K28) |
| `src/components/home/TrendChart.astro` | header comment: round-3 `trend.current`, C4 |
| `src/components/patterns/PatternsTable.tsx` | header comment: „Pokaż więcej” is S-14 |
| `src/content/copy.ts`, `src/pages/home.astro` | K25 comments reworded (templates kept until kit foot is grammatical, K29) |
| `context/changes/kit-round-3-intake/{plan.md,change.md,handoff.md}` | Progress 3.1–3.5 + SHA, status, this file |

## 3. Verification

| Command | Result |
| --- | --- |
| `npm run lint` | 0 errors |
| `npx astro check` | 0 errors (152 files; p2 152, Δ0) |
| `npm run fixture:check` | OK (ing + santander) |
| `npm test` | 347 passed / 22 files (baseline 335 / 20; Δ0 vs p2) |
| `npm run build` | OK |
| `npx supabase db reset && npx supabase test db` | Files=6, Tests=119 PASS (Δ0) |
| `npm run smoke` on :4398 | 157 PASS / 0 FAIL (baseline 151, +6, Δ0 vs p2); server killed |
| Seam grep `monthsLocative\[\|amountColumn\|stats\[2\]\|Rozpoznane wydatki\|K18` in `src` | empty |
| Register id check (K11–K26, G20, G23–G37 each have a row starting with a round-3 status) | no MISSING |
| `git diff --stat 7188f7f -- design` | empty (design/ untouched in p2–p3) |
| Break: `amountColumn: "Kwota"` re-added to `copyExtra.patterns` | seam grep reported it; restored via `git checkout`, grep empty. Meta-check: `astro check` would not flag an extra key; the grep is the only guard against a half-removed seam |

## 4. Next command

`/10x-impl-review kit-round-3-intake`

## 5. Open

- Manual rows: 1.8 `[reviewer]`, 2.8 `[reviewer]`, 3.6 `[visual]` (screenshots desktop + ~400 px of the listed states — not taken in this step), 3.7 `[reviewer]` (seam sweep + register vs research matrix + follow-up `Trigger:` lines — done, not ticked), 3.8 `[human]` (accept kit-text deviations: „we wrześniu” (K30), header order until S-14, `copyExtra.imports.saveError` (K28), 4 restored `authStates` (K27); send K27–K32 to the kit author).
- `home.astro`/`copy.ts` still carry `DESIGN-GAP: K24` comment (kit now delivers `dashboard.descriptionNoName`; S-15 adopts). `.prettierignore` for `design/` + `brand.css` remains a follow-up candidate.
- Design-kit.md register row bodies for K/G ids were not rewritten per row; the round-3 status lives in the new table (the old rows keep their history).
- No migration, no new `DESIGN-GAP`. Roadmap F-04 row untouched (archive updates it).

## 6. Autonomous decisions

1. **Execution mode: in this context**, no subagent (AskUserQuestion forbidden). Would change: context nearing 300k.
2. **Commit message approved as drafted** (Polish). Would change: a maintainer-specified subject.
3. **Round-3 status as a new table in `design-kit.md`**, not edits inside each wide legacy row. Rejected: per-row edits (huge cells, noisy diff). Would change: a reviewer wanting status in the original rows.
4. **New K-rows numbered K27–K32** (a)–(f) in plan order. Would change: the author's own numbering in round 4.
5. **content.json size stated as 414 JSON leaves** (measured in this step; research's 385 counted the raw delivery differently). Would change: an agreed counting convention.
6. **Epilogue run with 5 manual rows open** per the step instruction; status `implemented`.
