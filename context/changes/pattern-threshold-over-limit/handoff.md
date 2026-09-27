# Handoff — `pattern-threshold-over-limit` (slice S-04)

Written by the `implement phase 4` step (2026-09-27, autonomous run `2026-09-27-s03-s02-s04`). Phase 4
(pattern detail view, read-only) is implemented and committed, both automated criteria groups green. The next
agent (Phase 5 — threshold editor and write endpoints) must not get this wrong: the detail route
(`src/pages/patterns/[...key].astro`) currently renders a **static note** (`copy.threshold.empty` /
`copy.threshold.active`) inside the "Próg wzorca" `Panel` where the editor belongs — Phase 5 replaces that note
with `<ThresholdEditor client:load .../>`, it does not add a second panel. The route already computes and holds
everything the editor needs in scope: `pattern`, `detail.threshold` (already filtered through `appliesTo` —
Phase 5 passes this, not the raw stored threshold, decision 3), `month`, and `key`.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/pattern-threshold-over-limit`, cut from `main` at `a6a8b18` (confirmed with `git branch --show-current` before any edit) |
| Commits on branch | 17, in order: change identity, research, plan, plan review, `feat(...): pattern_thresholds table and its proofs (p1)` (`6e5c08c`) + sha-record + phase-1 handoff, `feat(...): over-limit rule, input parsing and path helpers (p2)` (`dac4eff`) + sha-record + phase-2 handoff, `feat(...): keyset read, widened select, thresholds read and view models (p3)` (`3e45b8c`) + sha-record + phase-3 handoff, `feat(...): pattern detail view, read-only (p4)` (`85c0bcc`), `chore(...): record phase 4 commit sha in progress` (`31ee3a2`) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` (unchanged this phase — two phases remain) |
| `## Progress` rows remaining | 28 (`grep -c '^- \[ \]' plan.md`); Phase 4's 8 automated rows (4.1–4.8) are `[x]` with `— 85c0bcc`; Phase 4's 2 `[reviewer]` rows (4.9, 4.10) left `[ ]` — not this step's to tick; carried unticked from before: 1.8, 1.9, 2.8, 3.7 (all `[reviewer]`) |
| Working tree | clean apart from the maintainer's ` M .gitignore` and `?? .claude/skills/10x-autonomous-run/` (neither staged nor committed) |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `src/pages/patterns/[...key].astro` | New. The detail route: `keyFromPath(Astro.url.pathname)` (`null` → redirect `/patterns`); `Promise.all([loadPatterns, loadThresholds])` (sequential `if (supabase) {...} else {...}` assignment, not a ternary-destructured `Promise.all` tuple, to keep the two result types unambiguous); read error → back link + `InlineAlert kind="error"` `copy.components.error` + `console.error("pattern detail failed", …)`; key not found → `Astro.response.status = 404` + `InlineAlert kind="info"` `x.detailMissing`; found → `patternDetail(pattern, rows, threshold, refMonth, ?month)` and the kit layout (heading with type badge + eyebrow + lead, right-aligned month total + over-limit line, two-column grid — threshold-status panel with a static note, occurrences panel with `MonthSelect` + `SequenceMark` sequence or `x.monthEmpty`, transactions panel with date/raw-description/amount/`Badge tone="excess"`) |
| `src/components/app/BackLink.astro` | New. Kit `.back-link` (icon `arrow-left` 15 + label). **ADAPT**: implemented `text-ink` (kit CSS's actual `.back-link` colour, and the existing "Wróć do importów" link in `ImportWizard.tsx` already uses `text-ink`), not the plan's literal `text-muted` — see Autonomous decision 1. Visible focus ring added (`buttonVariants` base), which the kit itself omits |
| `src/components/app/SequenceMark.astro` | New. Kit `.seq` clip-path mark; `bg-excess`/`bg-muted` per `over`; `size="md"` (27px, 20px ≤559px, matching `.sequence-large .seq`) / `size="sm"` (fixed 20px, unused this phase). No literal kit hex in the file (moved the `#728393`/`#aebbc1` mention out of the comment to satisfy the phase's own "no raw colours" grep — see Autonomous decision 2) |
| `src/components/app/field-styles.ts` | New. `field` / `control` class strings moved verbatim out of `PatternsTable.tsx` (G29 comment moved with them) |
| `src/components/patterns/MonthSelect.tsx` | New. `<form method="get">` (no `action` — submits to the current `/patterns/<key>` path) wrapping a `<select name="month">`; `onChange` calls `event.currentTarget.form?.requestSubmit()`; `aria-label` from the `label` prop; uses `field`/`control` from `field-styles.ts` |
| `src/components/app/Badge.tsx` | Gains tone `excess` (`bg-excess text-ink`, kit `.badge.excess`); header comment updated |
| `src/components/patterns/PatternsTable.tsx` | `field`/`control` consts replaced by an import from `field-styles.ts`; no other change (confirmed by re-reading the diff: import line only) |
| `src/lib/format.ts` | Gains `formatIsoDate` (`2026-05-20` → `20.05.2026`, plain string split) and `formatMonthShort` (`2026-05` → `maj 2026`, `Intl` pl-PL `month:"short"`, UTC — verified no dot in any of the 12 Polish short month forms via a throwaway `node -e`) |
| `test/unit/format.test.ts` | +4 cases: `formatIsoDate` (1), `formatMonthShort` (3: May, January, a December that is not the same numeral as the year) |
| `src/content/copy.ts` | `copyExtra.patterns` gains the K21 block (`detailEyebrow`, `typeLeads`, `thresholdPanel`, `thresholdActive`, `thresholdNone`, `occurrencesPanel`, `sequenceWithin`, `overBadge`, `occurrenceForms`, `sumLabel` + `monthsLocative` 12-entry table) and the G31 block (`detailMissing`, `monthEmpty`, `overInMonth`, `sequenceSummary`) |
| `context/foundation/design-kit.md` | New row **K21** (detail/editor/list strings only in `app.js`, `sumLabel`'s baked-in month) and **G31** (states the kit doesn't define); G2 and G28 status cells gain an S-04-phase-4 note; two new numbered items (19, 20) appended to "Do rundy 3" |
| `scripts/smoke.mjs` | +4 steps: "pattern detail renders the month total" (after "patterns list the re-imported merchant"), "pattern detail has no threshold yet", "pattern detail of an unknown key is not found" (404, body not asserted per the runner's own 200-only body policy), and "pattern detail without a session goes to login" (next to "import without a session goes to login") |
| `context/changes/pattern-threshold-over-limit/plan.md` | Phase 4 `## Progress` rows 4.1–4.8 → `[x] … — 85c0bcc` (4.9, 4.10 `[reviewer]`, untouched) |
| `context/changes/pattern-threshold-over-limit/handoff.md` | This file |

## 3. Verification

Baseline (agent contract, post-S-02 `main` `a6a8b18`): lint 0 · astro check 0 errors (93 files) · vitest 78/78
(5 files) · pgTAP 54 (3 files) · smoke 61 PASS. Phase 3 baseline on this branch: astro check 101 files, vitest
137/137 (8 files), pgTAP 76/76 (4 files), smoke 61 PASS. All commands run and observed in this step, on this
branch:

| Command | Result |
| --- | --- |
| `git branch --show-current` | `feat/pattern-threshold-over-limit` — confirmed before any edit |
| `npm run lint` | 0 errors (delta 0) — one round of `eslint --fix` was needed for Prettier formatting of the new `.astro`/`.mjs` files; re-checked clean after |
| `npx astro check` | 0 errors, 106 files (Phase 3 baseline 101, delta +5 — `[...key].astro`, `BackLink.astro`, `SequenceMark.astro` plus two more the checker counts) |
| `npm test` | 141/141, 8 files (Phase 3 baseline 137/8, delta +4 tests / 0 files — the new `format.test.ts` cases) |
| `npm run fixture:check` | OK |
| `npm run build` | OK (`.vercel/output/` emitted) |
| `npx supabase db reset && npx supabase test db` | PASS — 76/76 (4 files), delta 0 (this phase touches no migration) — run twice (once before, once after the deliberate break/restore cycle), both green |
| `BASE_URL=http://localhost:4398 npm run smoke` | 65 PASS (61 + 4, delta 0 beyond the phase's own additions) — run three times total (baseline check, under the deliberate break, and the final confirmation); port 4398 killed after each run, 4321 (maintainer's own `astro dev`, pid unchanged throughout) never touched |
| `grep -rnE "#[0-9a-fA-F]{3,6}\b\|\[#"` over the new/changed files | empty (one hit inside a `SequenceMark.astro` comment on the first pass — reworded to describe the gap without the literal hex, see Autonomous decision 2) |
| `grep -n "DESIGN-GAP: K21\|DESIGN-GAP: G31"` in `copy.ts` / `[...key].astro`, and K21/G31 rows in `design-kit.md` | all present |

**Deliberate break (4.6 — key round-trip)**: staged the phase's real files first (`git add`, confirmed via
`git status --porcelain` that only the two maintainer paths stayed dirty), then in the worktree only replaced
`keyFromPath`'s `return decodeURIComponent(segment);` with `return segment;` (comment marking it a deliberate
break). Ran `npx vitest run test/unit/threshold-form.test.ts`: went red — 4 of the `patternHref`/`keyFromPath`
round-trip cases failed (space, `/`, `%` all stayed percent-encoded instead of round-tripping). **Then re-ran the
end-to-end path**: restarted `astro dev --port 4398` with the broken file loaded and ran the full smoke suite —
"pattern detail renders the month total" also went red (`404` instead of `200`), confirming the break reaches the
real route, not just the unit fallback (the plan's own meta-check note: had this smoke step stayed green, it would
mean the Astro runtime hands a pre-decoded pathname and the `catch` fallback in `keyFromPath` was doing the work
instead of the primary `decodeURIComponent` path — that did **not** happen here; the primary path is exercised).
Restored via `git checkout -- src/lib/patterns/path.ts` (file was never staged this phase, so this resets it
exactly to the committed Phase-2 version); `git diff src/lib/patterns/path.ts` confirmed empty. Re-ran `npm test`
(141/141) and `npm run lint` (clean) after restoring, then re-ran the full gate end-to-end once more (lint, astro
check, fixture:check, build, db reset + test db, dev + smoke) before committing — all green, as tabulated above.

## 4. Next command

`/10x-implement pattern-threshold-over-limit phase 5`

## 5. Open

- **Manual-only Progress rows, not ticked here** (leave for `/10x-impl-review`): `[reviewer]` 4.9 (every string
  from `copy`/`copyExtra`; K21 byte-for-byte with `app.js`; only G31 placeholders new) and 4.10 (`PatternsTable`
  unchanged apart from the `field-styles.ts` import — verified true in this step by re-reading the diff, but the
  row itself is a reviewer checkbox per the step rules, so left `[ ]`); carried from earlier phases: 1.8, 1.9,
  2.8, 3.7.
- **Carried from plan-review, unchanged**: `[human]` Progress 6.12 (product owner confirms Autonomous decisions 1
  and 2 against the PRD's literal wording) — Phase 4 renders `detail.overMinor`/`detail.sumMinor` computed by
  Phase 2/3's `over-limit.ts`/`view.ts`, unchanged this phase, so nothing new is at risk here. Known risks in
  `plan.md` (pathname decoding, double-decode of a literal `%XX`, unbounded threshold rows, normalizer drift) —
  none newly triggered; the pathname-decoding risk was actively exercised (not just documented) by this phase's
  4.6 break/smoke pairing, and behaves as the plan's Critical Implementation Details describe (percent-encoded
  pathname, not pre-decoded).
- **New DESIGN-GAPs this phase**: `K21` (`src/content/copy.ts`, `copyExtra.patterns` — verbatim `app.js` strings
  the kit's `content.json` lacks) and `G31` (`src/content/copy.ts` same block, plus two comments in
  `src/pages/patterns/[...key].astro` — the not-found state and the month-with-no-occurrences state). Both rows
  added to `context/foundation/design-kit.md` (K21/G31 tables) and appended to "Do rundy 3" (items 19, 20).
- **Next symbols to build (Phase 5)**: `src/pages/api/patterns/threshold.ts` (new, `POST`, upsert on
  `(user_id, merchant_key)`), `src/pages/api/patterns/threshold/delete.ts` (new, `POST`, idempotent delete),
  `src/components/patterns/ThresholdEditor.tsx` (new, replaces the static note in
  `src/pages/patterns/[...key].astro`'s "Próg wzorca" `Panel`), plus `copyExtra.patterns` K21/G31 growth
  (`setThreshold`, `thresholdRemoved`, `valueLabel`, `suffix`, `thresholdInvalid`, `thresholdSaveError`) and 9 new
  smoke steps — plan Phase 5.

## 6. Autonomous decisions

1. **`BackLink.astro` uses `text-ink`, not the plan's literal `text-muted`.** Chosen: `text-ink`, matching (a) the
   kit's own `.back-link` CSS rule in `design/rytm-os/prototype/styles.css` (`color:var(--ink)`, verified by
   reading the file directly, not inferred), and (b) the existing "Wróć do importów" back-link in
   `src/components/imports/ImportWizard.tsx` (`className="text-ink inline-flex items-center gap-1.5 …"`), which
   is the only precedent for this exact UI pattern already in the codebase. Rejected: the plan's literal
   `text-muted` wording. Why: the plan cites "kit `.back-link`" as its source for this line, but that source
   itself says `ink`, and a sibling implementation already renders it that way — treated as a Minor
   (styling-attribute) drafting slip rather than a considered design choice, per the "design kit is source of
   truth" project rule, which outranks a plan's incidental wording when the two conflict. Would change: a
   reviewer or the plan author confirming `text-muted` was in fact deliberate (e.g. to visually de-emphasise the
   detail page's back link versus the wizard's), in which case only this one class changes.
2. **Moved the `#728393` / `#aebbc1` hex mention out of `SequenceMark.astro`'s comment** and pointed to
   `design-kit.md` instead. Chosen: describe the gap without embedding the literal hex. Rejected: leaving the hex
   in the comment (the precedent in `src/components/app/Panel.astro`'s own header comment, `// Kit border
   #d9c2a0 has no token`, does exactly this and predates this phase unflagged). Why: Phase 4's own Success
   Criteria include an *automated* `grep -rnE "#[0-9a-fA-F]{3,6}\b|\[#"` check scoped to "new / changed
   components and `[...key].astro`" that must return empty — `SequenceMark.astro` is new this phase, so it falls
   inside that scope and the literal grep would otherwise fail this phase's own gate, even though the intent
   (documenting an un-tokenized kit colour, not using it as a style value) is identical to the accepted
   `Panel.astro` precedent. Would change: the plan's grep being scoped to exclude comments (e.g.
   `grep -v '^\s*//'`), which would make the original wording pass too.
3. **Implemented Phase 4 directly in this context rather than delegating to a subagent**, despite it being
   flagged in the plan as "the largest phase" (route + 4 shared components + copy + gap rows + 4 smoke steps).
   Chosen: write every file myself. Rejected: delegate-to-subagent (the pattern used successfully in Phases 2–3
   for smaller, pure-logic phases). Why: this phase's correctness hinges on tight, cross-file agreement between
   the kit's literal markup (`design/rytm-os/prototype/app.js`/`styles.css`), the exact `copy`/`copyExtra` keys,
   and the view-model contract from Phase 3 (`patternDetail`'s field names) — reading all of that once myself and
   writing directly against it was cheaper and less error-prone than writing a summary of it into a subagent
   prompt and then verifying the subagent's output against the same sources anyway. Would change: a future phase
   this size that is *not* UI/kit-fidelity-sensitive (e.g. a second pure-logic phase), where delegation's context
   savings would dominate.
4. **Never called `AskUserQuestion`.** Chosen: decide and proceed per the step rules; recorded here instead. Why:
   the step's rules override the skill's interactive defaults for this run. Would change: a maintainer message
   reinstating interactive gates for this run.
5. **Split the phase into two commits** (`85c0bcc` feat, then `31ee3a2` chore appending the commit's own SHA),
   mirroring Phases 1–3. Chosen: two commits. Rejected: leaving the SHA-suffix edit uncommitted (violates the
   "clean apart from the two maintainer paths" contract), `--amend` (forbidden). Why: the SHA can only be known
   after the commit exists. Would change: a revised skill/contract deferring all SHA-writing to the epilogue, or
   accepting a dirty `plan.md` between phases.
6. **Left Progress rows 4.9 and 4.10 `[reviewer]` unticked**, per the step's explicit instruction that rows
   tagged `[reviewer]`/`[visual]`/`[human]` are never mine to check, even though I independently verified 4.10's
   claim (re-read the `PatternsTable.tsx` diff: it is import-only) while implementing. Would change: nothing —
   hard rule from the step prompt, not a judgment call.
7. **Used a `let`/`if`-`else` pair instead of a ternary-destructured `Promise.all` tuple** for
   `patternsResult`/`thresholdsResult` in `[...key].astro`. Chosen: explicit `Awaited<ReturnType<typeof
   loadPatterns>>` typed `let`s, assigned inside an `if (supabase) {...} else {...}`. Rejected: `const [a, b] =
   supabase ? await Promise.all([...]) : [{error}, {error}]` (the pattern I drafted first). Why: the else-branch
   plain-array literal and the `Promise.all` tuple-typed branch do not obviously unify to the same tuple shape
   under TypeScript's inference rules for a conditional expression destructured immediately; rather than rely on
   that inference working out (it likely does, via per-position element-type union, but I did not want the
   phase's `astro check` gate to be the first place that gets tested), the explicit form removes the ambiguity
   entirely at the cost of four extra lines. Would change: nothing — this is a settled implementation choice, not
   a reversible product decision.

ARTIFACT GAP: none — `agent-contract.md`, `handoff.md` (prior, Phase 3), `plan.md`, `reviews/plan-review.md`,
`change.md`, and every file the plan's Phase 4 section names or that Phase 4 depends on from earlier phases
(`src/lib/patterns/view.ts`, `over-limit.ts`, `thresholds.ts`, `load.ts`, `path.ts`, `src/types.ts`,
`src/content/copy.ts`, `context/foundation/design-kit.md`, `design/rytm-os/prototype/app.js` and `styles.css`,
`scripts/smoke.mjs`, `src/middleware.ts`, `src/pages/api/imports/delete.ts` as the write-route precedent, existing
shared components `Panel.astro`/`PageTitle.astro`/`InlineAlert.astro`/`Icon.astro`/`Glyph.tsx`/`button.tsx`/
`SubmitButton.tsx`) were present and readable.
