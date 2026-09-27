# Handoff — `pattern-threshold-over-limit` (slice S-04)

Written by the `implement phase 6` step (2026-09-27, autonomous run `2026-09-27-s03-s02-s04`). Phase 6 (the plan's
last phase — `/patterns` columns and row link) is implemented, committed and the plan's epilogue has run:
`change.md` is now `status: implemented`. The next agent (`/10x-impl-review`) must not get this wrong: every
`- [x]` Progress row across all six phases is automated-criteria-only; **14 `[reviewer]`/`[visual]`/`[human]` rows
remain `[ ]` on purpose** (1.8–1.9, 2.8, 3.7, 4.9–4.10, 5.9–5.10, 6.8–6.12) — this step never ticks them, per its
own rules, and they are the review's actual job, not a residue to clean up.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/pattern-threshold-over-limit`, cut from `main` at `a6a8b18` (confirmed with `git branch --show-current` before any edit) |
| Commits on branch | 21, in order: change identity, research, plan, plan review, phase 1 feat (`6e5c08c`) + sha-record + handoff, phase 2 feat (`dac4eff`) + sha-record + handoff, phase 3 feat (`3e45b8c`) + sha-record + handoff, phase 4 feat (`85c0bcc`) + sha-record + handoff, phase 5 feat (`2cd7246`) + sha-record (`fd84ad6`) + handoff (`5123782`), `feat(...): patterns columns and row link (p6)` (`81d31d7`), `chore(...): close out plan (epilogue)` (`3f036d9`) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implemented` (flipped by this step's epilogue) |
| `## Progress` rows remaining | 14 (`grep -c '^- \[ \]' plan.md`) — all `[reviewer]`/`[visual]`/`[human]`: 1.8, 1.9, 2.8, 3.7, 4.9, 4.10, 5.9, 5.10 (carried from earlier phases), 6.8, 6.9, 6.10, 6.11, 6.12 (this phase's manual rows). Every automated row in the plan (1.1–1.7, 2.1–2.7, 3.1–3.6, 4.1–4.8, 5.1–5.8, 6.1–6.7) is `[x]` with a commit sha |
| Working tree | clean apart from the maintainer's ` M .gitignore` and `?? .claude/skills/10x-autonomous-run/` (neither staged nor committed) |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `src/types.ts` | `PatternListItem` (already `Omit<MerchantPattern, "transactionIds" \| "medianMinor">`) now intersected with `{ threshold: Threshold \| null; overMinor: number }` |
| `src/pages/patterns.astro` | Reads `loadPatterns` and `loadThresholds` via `Promise.all` (either error fails the whole list, same branch as before); merges `listOverview(patternsResult.patterns, patternsResult.rows, thresholds)` by key into each `PatternListItem`; `tableCopy.columns` is now all six `copy.patterns.columns` (was `.slice(0, 4)`), plus `thresholdCount`, `thresholdSum`, `openPattern` |
| `src/components/patterns/PatternsTable.tsx` | Header order: `columns[0..3]` (Sprzedawca/Typ/Wystąpienia/Suma) + `amountColumn` (K17 „Kwota”) + `columns[4..6]` (Próg/Ponad progiem) + an empty `<th>` for the arrow. Name cell is now `<a href={patternHref(p.key)}>` (kit `.table-name`, visible focus ring — same `outline-none focus-visible:ring-[3px] focus-visible:ring-ink/15` class used by `BackLink.astro`/`buttonVariants`, G29 precedent). New `thresholdLabel()` helper: `count` → `x.thresholdCount` („{n} × / miesiąc”), `amount` → `formatMoney`, `sum` → `x.thresholdSum` („{amount} / miesiąc”), none → „—”. Ponad progiem cell: `overMinor > 0` → `text-excess-text font-extrabold` `formatMoney`, else „—”. Arrow cell: `.icon-button`-shaped link, `aria-label={copy.openPattern}`, `Glyph name="arrow"`. Header comment (`DESIGN-GAP: G28`) narrowed to what still stays out (status badges S-06, excluded section + „Pokaż więcej” S-05) |
| `src/content/copy.ts` | `copyExtra.patterns` (K21 block) gains `thresholdCount: "{n} × / miesiąc"`, `openPattern: "Otwórz wzorzec"`; (G31 block) gains `thresholdSum: "{amount} / miesiąc"` (placeholder — the kit's `patternRows()` sample data never shows a `sum`-kind threshold) |
| `context/foundation/design-kit.md` | K21 row: **Faza 6** note (`thresholdCount`, `openPattern`). G28 row: **Faza 6 (dostarczone)** note — columns + row link delivered, gap narrowed to S-05/S-06 items only. G31 row: **Faza 6** note (`thresholdSum`) |
| `scripts/smoke.mjs` | +3 steps between "pattern detail shows the over-limit sum" and "threshold is removed" (key `kawiarnia smoke`, threshold changed to 40 zł in Phase 5): "patterns list shows the threshold" (`>40,00 zł<`), "patterns list shows the over-limit sum" (`>5,50 zł<`), "patterns list links the pattern detail" (`href="/patterns/kawiarnia%20smoke"`) |
| `context/changes/pattern-threshold-over-limit/plan.md` | Phase 6 `## Progress` rows 6.1–6.7 → `[x] … — 81d31d7` (6.8–6.12 `[reviewer]`/`[visual]`/`[human`, untouched) |
| `context/changes/pattern-threshold-over-limit/change.md` | `status: implemented` (epilogue) |
| `context/changes/pattern-threshold-over-limit/handoff.md` | This file |

## 3. Verification

Contract baseline (post-S-02 `main` `a6a8b18`): lint 0 · astro check 0 errors (93 files) · vitest 78/78 (5 files) ·
pgTAP 54 (3 files) · smoke 61 PASS. Phase 5 baseline on this branch: astro check 109 files, vitest 141/141
(8 files), pgTAP 76/76 (4 files), smoke 74 PASS. All commands run and observed in this step, on this branch:

| Command | Result — baseline (post-S-02) + delta |
| --- | --- |
| `git branch --show-current` | `feat/pattern-threshold-over-limit` — confirmed before any edit |
| `npm run lint` | 0 errors (baseline 0, delta 0) — one round of `eslint --fix` needed on `scripts/smoke.mjs` (Prettier multi-line-array reformatting on the 3 new smoke steps); re-checked clean after |
| `npx astro check` | 0 errors, 109 files (baseline 93, delta +16; Phase 5 109, delta 0 this phase — no new files, only edits) |
| `npm test` | 141/141, 8 files (baseline 78/78 5 files, delta +63 tests/+3 files cumulative; Phase 5 141/8, delta 0 — Phase 6 adds no unit-test file, per plan) |
| `npm run fixture:check` | OK |
| `npm run build` | OK (`.vercel/output/` emitted) |
| `npx supabase db reset && npx supabase test db` | PASS — 76/76 (4 files) (baseline 54/3 files, delta +22; Phase 5 76/4, delta 0 — this phase touches no migration) |
| `BASE_URL=http://localhost:4398 npm run smoke` | 77 PASS (baseline 61, delta +16; Phase 5 74, delta +3 — this phase's own 3 new steps) — run three times total (baseline check, under the deliberate break, and the final confirmation); port 4398 killed after the last run, 4321 (maintainer's own `astro dev`, pid 773, unchanged throughout) never touched |
| `grep -rnE "#[0-9a-fA-F]{3,6}\b\|\[#"` over `PatternsTable.tsx`, `patterns.astro` | empty |
| `grep -n "DESIGN-GAP"` in the touched files, and the Faza 6 notes in `design-kit.md`'s K21/G28/G31 rows | all present |

**Deliberate break (6.6 — Próg cell source)**: staged the phase's real files first (`git add`, confirmed via
`git status --porcelain` that only the two maintainer paths stayed dirty), then in `PatternsTable.tsx` replaced
`{thresholdLabel(p.threshold, copy)}` with a literal `{"—"}` in the Próg `<td>`. Re-ran the full smoke suite
against the live dev server: "patterns list shows the threshold" went red (200, missing `>40,00 zł<`) while
"patterns list shows the over-limit sum" and "patterns list links the pattern detail" stayed green — exactly the
plan's meta-check: the over-limit sum and the row link live in separate cells fed by separate props, so the break
proves the Próg cell specifically renders `p.threshold` (the island receives the threshold as the number `4000`,
never the string „40,00 zł”, so only the rendered cell can satisfy the step), not an accidental pass from a
neighbouring assertion. Restored via `git checkout -- src/components/patterns/PatternsTable.tsx` (file was staged
before the break, never modified after restoring); `git diff` confirmed empty.

After the restore: re-ran `npm run lint`, `npx astro check`, `npm test`, `npm run fixture:check`, `npm run build`,
and the full smoke suite once more end-to-end — all green, as tabulated above — before committing. `npx supabase
db reset && npx supabase test db` was run once, before staging (this phase touches no migration or DB-facing
code, so it was not re-run under the break, which only touched a React component).

## 4. Next command

`/10x-impl-review pattern-threshold-over-limit`

## 5. Open

- **Manual-only Progress rows, not ticked here** (leave for `/10x-impl-review` and the visual gate):
  - `[reviewer]` carried from earlier phases, unchanged this step: 1.8, 1.9 (`pattern_thresholds` migration / pgTAP
    mapping), 2.8 (over-limit oracle traceability), 3.7 (`load.ts` keyset/no-`count`), 4.9, 4.10 (detail-view copy
    and `PatternsTable` diff-is-import-only), 5.9, 5.10 (threshold endpoints precedent match, editor keyboard).
  - `[reviewer]` new this phase: 6.11 — K21 strings (`thresholdCount`, `openPattern`) byte-for-byte with
    `prototype/app.js` `patternRows()`; `thresholdSum` is explicitly a G31 placeholder (the kit's sample patterns
    never show a `sum`-kind threshold, so there is no byte-for-byte source to match) — flagged here so the
    reviewer does not go looking for one.
  - `[visual]` new this phase: 6.8 (all 15 named screenshot states — none captured by this step; the plan's
    screenshot list spans every phase's states, not just Phase 6's), 6.9 (mobile ~400 px stacking + table scroll
    with the arrow column reachable), 6.10 (dotted key `kawa-testowa.pl` and a spaces/diacritics key opening detail
    from the list link — the smoke suite proves `kawiarnia smoke`'s link renders; it does not click through a
    browser, so this is genuinely unverified, not just unticked).
  - `[human]` carried, unchanged: 6.12 — product owner confirms Autonomous decisions 1 (excess part for sum/fixed,
    against US-01 AC) and 2 (reference month = latest month in the data). Nothing this phase touches
    `over-limit.ts` or `referenceMonth`; the list's `overMinor` is read straight from `listOverview`, which was
    Phase 3 code, unchanged.
- **Known risks, still live** (from `plan.md` `## Known risks`, unchanged by this phase): pathname decoding /
  double-decode of a literal `%XX` (Phase 4), unbounded threshold rows self-inflicted by RLS (Phase 5, now exercised
  in real code). Phase 6 adds no new risk — it only reads what Phases 1–5 already wrote (`loadThresholds`,
  `listOverview`), never a new write path.
- **New DESIGN-GAPs this phase**: extended `K21` (`thresholdCount`, `openPattern`) and `G31` (`thresholdSum`) in
  `src/content/copy.ts`; `G28`'s status column in `design-kit.md` moved from "placeholder" to "delivered for S-04"
  (the row itself stays open — it is a shared, multi-slice gap that S-05/S-06 will further narrow). No new numbered
  "Do rundy 3" item added, consistent with Phases 4–5's precedent (items 19/20 already describe the whole feature's
  copy/state gaps, not per-phase).
- **This is the plan's last phase.** There is no Phase 7. The plan's own epilogue ran (see `## 6`): `change.md` is
  `implemented`. The 14 open rows above are exactly what `/10x-impl-review` and the run's visual-gate step exist to
  close — nothing here is a phase left undone.

## 6. Autonomous decisions

1. **Implemented Phase 6 directly in this context rather than delegating to a subagent.** Chosen: read every file
   the plan names (`types.ts`, `patterns.astro`, `PatternsTable.tsx`, `view.ts`, `load.ts`, `path.ts`, `copy.ts`,
   `design-kit.md`, `app.js` `patternRows()`, `styles.css` `.table-name`/`.icon-button`) directly, then edit.
   Rejected: dispatching a fresh `general-purpose` subagent per the skill's default. Why: Phase 6 is small
   (6 files, no new symbols, no migration) and this session had already read every dependency while resolving the
   handoff/plan chain — delegating would have meant a second agent re-reading the same files with no saved cost.
   Would change: a much larger phase, or one this session had not already gathered the context for.
2. **Never called `AskUserQuestion`** (exec-mode choice, commit-message approval, stragglers prompt). Chosen: decide
   and proceed per the step rules, recorded here. Why: the step's rules explicitly override the skill's interactive
   defaults for this run. Would change: a maintainer message reinstating interactive gates.
3. **Header cell order built as `columns[0..3]` + `amountColumn` (K17) + `columns[4..6]`, not a single flat array.**
   Chosen: keep the existing K17 insertion pattern (a separate `<th>{copy.amountColumn}</th>` between the kit's own
   columns) rather than restructuring `copy.patterns.columns` to already contain "Kwota" in the middle. Rejected:
   splicing "Kwota" into a new copy array assembled in `patterns.astro`. Why: `copy.patterns.columns` is kit source
   (`content.json`) — inserting a non-kit column into it would blur which strings are kit-verbatim vs. the app's own
   K17 gap; the existing Phase 3 precedent already solved this by keeping the insertion at the render site. Would
   change: nothing — this mirrors the untouched Phase 3/4/5 pattern exactly.
4. **`thresholdLabel()` is a module-level pure function taking `(threshold, copy)`, not inlined JSX or a `useMemo`
   per row.** Chosen: a plain function, called once per visible row during render. Rejected: `useMemo` (no
   expensive computation — string interpolation and one `formatMoney` call — so memoizing would add complexity for
   no measurable benefit) or inlining the three-way branch directly in JSX (would duplicate the branch across two
   call sites once list sorting re-renders, and is harder to unit-exercise by eye during review). Why: matches the
   file's existing style (`footer` is computed the same way, as a plain expression, not a helper — but the Próg
   branch has three cases vs. `footer`'s two string replaces, so a named function reads clearer). Would change: a
   future need to unit-test this in isolation (currently only exercised through the smoke suite and the deliberate
   break) would justify extracting it to `src/lib/patterns/` — not done here since the plan scoped it as
   `PatternsTable.tsx`-local.
5. **The visible-focus ring class (`outline-none focus-visible:ring-[3px] focus-visible:ring-ink/15`) was copied
   as a literal string, not extracted to a shared constant/util.** Chosen: inline `focusRing` constant local to
   `PatternsTable.tsx`, matching the same literal already inlined in `BackLink.astro` and `buttonVariants` (G29
   precedent — each of those three places defines its own copy of this string, none imports from another). Rejected:
   creating a new shared `visibleFocusRing` export in `field-styles.ts` or `utils.ts`. Why: no existing precedent
   does this extraction (checked all three usages: `button.tsx`, `BackLink.astro`, and now `PatternsTable.tsx`), so
   introducing one now would be an unplanned refactor outside Phase 6's scope. Would change: a future accessibility
   pass that explicitly asks to de-duplicate this pattern across the codebase.
6. **`thresholdSum`'s G31 placeholder text ("{amount} / miesiąc") was accepted as specified in the plan without
   re-deriving it from the kit.** Chosen: use the plan's literal string. Rejected: inventing a different format.
   Why: the plan's Phase 6 contract names this exact string, and the kit genuinely has no `sum`-kind threshold
   example to check it against (confirmed by re-reading `patternRows()` and the kit's sample `data.patterns` — every
   sample threshold is either a count or a money amount). Would change: nothing — this is the plan's own explicit
   instruction, not a judgment call this step made.
7. **Split the phase into two commits** (`81d31d7` feat, then the plan epilogue's `3f036d9` chore), matching the
   skill's own two-commit shape for a plan's last phase (feat commit can't carry its own sha; the epilogue commit
   records it). Chosen: two commits. Rejected: leaving the sha-suffix edit and the `change.md` flip uncommitted
   (violates the "clean apart from the two maintainer paths" contract), `--amend` (forbidden). Why: the sha can only
   be known after the commit exists, and this run's step explicitly asked for the epilogue to run. Would change: a
   revised skill/contract deferring all sha-writing differently.
8. **Proceeded straight to the epilogue despite 14 open `[reviewer]`/`[visual]`/`[human]` rows**, rather than
   stopping at the skill's "stragglers" `AskUserQuestion`. Chosen: proceed (flip `change.md` to `implemented`, run
   the epilogue commit). Rejected: pausing without flipping status. Why: this step's own instructions explicitly say
   "run the skill's epilogue (status → implemented) even though [reviewer]/[visual]/[human] rows stay open — they
   belong to later steps" — a direct, unambiguous instruction, not a judgment call. Would change: nothing; this is
   the step prompt's literal text.

ARTIFACT GAP: none — `agent-contract.md`, `handoff.md` (prior, Phase 5), `plan.md` (including `reviews/plan-review.md`),
`change.md`, and every file Phase 6's plan section names or depends on (`src/lib/patterns/view.ts` `listOverview`,
`src/lib/patterns/load.ts` `loadPatterns`, `src/lib/patterns/thresholds.ts` `loadThresholds`,
`src/lib/patterns/path.ts` `patternHref`, `src/types.ts`, `src/content/copy.ts`, `context/foundation/design-kit.md`,
`context/foundation/roadmap.md`, `design/rytm-os/prototype/app.js` `patternRows()`, `design/rytm-os/prototype/
styles.css` `.table-name`/`.icon-button`, `design/rytm-os/react-kit/docs/content.json`, `scripts/smoke.mjs`,
`src/components/app/BackLink.astro` and `src/components/ui/button.tsx` as the visible-focus-ring precedent,
`src/components/Glyph.tsx` and its `IconName` union in `src/content/copy.ts`) were present and readable.
