# Handoff — `durable-pattern-decisions` (slice S-05)

Written by the `implement` step, Phase 6 (2026-09-28, autonomous run `2026-09-28-s05-s06-s07`). Phase 6 (pattern
detail actions, excluded banner, merged variants) is fully green and committed. The kit's „Akcje” dialog
(`PatternActionsDialog.tsx`) is now wired to `POST /api/patterns/decision` on `/patterns/<key>` — merge picker,
direct-submit type change, rename field, direct-submit exclude — plus the excluded-pattern banner (`RestoreForm.astro`)
and the merged-variants list with „Cofnij scalenie”. **What the next agent must not get wrong**: Phase 7 still owes
the `/patterns` list its own excluded section (`ExcludedPatterns.astro`, G28/G33) and the seam sweep — the excluded
pattern still shows in the main table on `/patterns` today (only the detail page and its banner are done this
phase); do not assume G28/G4 are fully closed — `design-kit.md` still lists G33 as `placeholder`, not `delivered`.
The `[reviewer]` rows 6.8/6.9 are explicitly not mine and are still `[ ]` — do not tick them.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/durable-pattern-decisions` (confirmed with `git branch --show-current`), cut from `main` at `f252112` |
| Commits on branch | 21 total ahead of `f252112` — change identity, research, plan, plan review, Phase 1 (`1e2ea9b` + sha-record `272232b`) + handoff (`17e3137`), Phase 2 (`c2b63b4` + sha-record `a89ce59`) + handoff (`8f3f5f9`), Phase 3 (`b1010f3` + sha-record `3000e75`) + handoff (`f7eb960`), Phase 4 (`61145cf` + sha-record `c2626db`) + handoff (`79da179`), Phase 5 (`f468f68` + sha-record `1b27113`) + handoff (`13cdb11`), **Phase 6 `feat(durable-pattern-decisions): pattern detail actions, excluded banner, merged variants (p6)` (`a268bb4`)**, **`docs(durable-pattern-decisions): record phase 6 commit sha in Progress` (`8d5932f`)** |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` (unchanged — only flips once, at Phase 1 entry) |
| `## Progress` rows | 20 pending (`grep -c '^- \[ \]' plan.md`) — includes this phase's own `[reviewer]` rows 6.8, 6.9 still `[ ]` (not mine) |
| Working tree | Clean after the two commits (`git status --short` empty) |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `src/components/patterns/PatternActionsDialog.tsx` | New. Default-exported React island (kit `modal('patternActions')` wired to real writes): trigger `Button variant="ghost"` (`Glyph more` + `<span>{copy.actions}</span>`); reveals for „Scal z…” (native `<select name="target">` of `mergeTargets`, disabled + `mergeNone` note when there are no candidates) and „Zmień nazwę” (`<input name="name" maxLength={100}>` prefilled with the current name); direct-submit forms for „Zmień typ” (hidden `type` = the other `PatternType`) and „Wyklucz z analizy” (omitted when already `excluded`). One `pending` state shared across all forms + `usePageShowReset` (Phase 5 hook, reused, not reinvented). `copy` prop carries only the strings the dialog itself renders — never `merged`/`unmerged`/… result-line strings (plan review F1: those must stay absent from the island's serialized props for the smoke negative control) |
| `src/components/patterns/RestoreForm.astro` | New. Pure SSR `<form method="POST" action="/api/patterns/decision">` (hidden `key`, `action=restore`, optional `back`), submit styled via `buttonVariants({ variant: "text", size: "inline" })`. Shared by the detail page's excluded banner now; the `/patterns` „Wykluczone” section (Phase 7) reuses it with `back="list"` |
| `src/components/auth/SubmitButton.tsx` | Changed. Added an optional `className` prop, passed through to the underlying `Button` — needed so `PatternActionsDialog`'s four `.modal-actions` buttons can left-align (`justify-start`) instead of the component's default `justify-center`; every existing caller is unaffected (prop is optional, unused elsewhere) |
| `src/pages/patterns/[...key].astro` | Changed. `.detail-top` now holds `BackLink` + `PatternActionsDialog client:load` (flex, space-between, ≤560px column); `mergeTargets` computed from `dataResult.patterns` (non-self, non-excluded, sorted `pl`); a new `decisionAlert` (separate from the existing threshold-only `resultAlert`) renders under `.detail-top` for `merged/unmerged/typed/renamed/excluded/restored/error=merge\|name\|decision`; excluded banner (`InlineAlert kind="info"` + `RestoreForm`) above the heading section when `pattern.excluded`; merged-variants list (name + „Cofnij scalenie” form) under the type lead when `pattern.merged.length > 0`. Header comment updated |
| `src/content/copy.ts` | Changed. `copyExtra.patterns` gains, under `DESIGN-GAP: K22` (verbatim from `app.js`): `actions`, `actionsEyebrow`, `actionsTitle`, `actionsLead`, `typeChanged`, `excludedToast`, `close`; under `DESIGN-GAP: G33` (placeholders): `mergeLabel`, `mergeSubmit`, `mergeNone`, `renameLabel`, `renameHint`, `renameSubmit`, `merged`, `unmerged`, `renamed`, `mergedLabel`, `unmerge`, `mergeInvalid`, `nameInvalid`, `decisionError` |
| `scripts/smoke.mjs` | Changed. +5 steps inserted into the existing Phase 4 run: „merge confirms the result” (after „pattern is merged”), „detail offers the actions” (negative control — `>Akcje<` present, bare `Wzorce scalone.` absent), „merged pattern lists its variant” (after „merged pattern sums its components”), „excluded pattern shows the banner” (after „rename keeps the exclusion”), „restored pattern drops the banner” (after „restored pattern shows its over-limit again”) |
| `context/foundation/design-kit.md` | Changed. New K22 row (conflicts/copy table, after K21); new G33 row (gap register, after G32); G4 status amended (S-05 faza 6 delivery note); both K22 and G33 appended to „Do rundy 3” as items 22–23 |
| `context/changes/durable-pattern-decisions/plan.md` | Phase 6 `## Progress` rows `6.1`–`6.7` ticked `[x]` with ` — a268bb4` and the **observed** numbers/meta-check recorded inline; `6.8`/`6.9` left `[ ]` (`[reviewer]`, not mine) |
| `context/changes/durable-pattern-decisions/handoff.md` | This file |

## 3. Verification

Baseline for this phase (measured on this branch before Phase 6, i.e. Phase 5's own result): lint 0 · astro check 0
errors (116 files) · fixture:check OK · vitest 190 (11 files) · build OK · pgTAP 102 (5 files) · smoke 103 PASS.

| Command / check | Result |
| --- | --- |
| `git branch --show-current` | `feat/durable-pattern-decisions` |
| `npm run lint` | 0 errors (delta 0) — two `astro/prefer-class-list-directive` warnings surfaced along the way (raw `class={expr}` on a `<button>`) and were fixed with `class:list`, not left as warnings |
| `npx astro check` | 0 errors, 0 warnings, 0 hints, **118** files (delta +2 — `PatternActionsDialog.tsx`, `RestoreForm.astro`) |
| `npm run fixture:check` | OK |
| `npm test` | **190** passed, **11** files (delta 0 — no new unit test file this phase, matches the plan's automated criteria) |
| `npm run build` | passes |
| `npx supabase db reset && npx supabase test db` | pgTAP 102 (5 files), all pass (delta 0 — Phase 6 touches no migration) |
| `BASE_URL=http://localhost:4398 npm run smoke` (`ASTRO_DEV_BACKGROUND=1 npx astro dev --port 4398`) | **108** PASS (103 + 5, matches plan), run clean before and after the deliberate break |
| `grep -nE "#[0-9a-fA-F]{3,6}\b\|\[#" src/components/patterns/PatternActionsDialog.tsx src/components/patterns/RestoreForm.astro "src/pages/patterns/[...key].astro"` | empty (plan criterion 6.7) |

Deliberate break (plan criterion 6.6, on `src/pages/patterns/[...key].astro`, restored immediately after its own
smoke run, full gate re-confirmed green afterward):

1. `{pattern.excluded && (` guarding the excluded banner changed to `{true && (` (banner renders unconditionally).
   Result: „restored pattern drops the banner” FAILed (`expected 200 notContains:>Wykluczony z analizy<`), 1/108
   red; every other step — including „excluded pattern shows the banner” — stayed PASS. Restored → 108/108 PASS.
   **Meta-check**: the still-green sibling step (the excluded-state assertion) proves the break didn't just make the
   banner vanish or the page 500 — it specifically proves the banner now ignores the stored `excluded` flag, which
   is exactly what the automated criterion asks to isolate.

No `BEGIN … ROLLBACK` DB experiment was needed this phase (no migration touched, no other local DB mutation made
outside the app's own normal POST/DELETE flow through the API, which smoke already exercises); pgTAP was re-run
once (before any code change) to confirm delta 0, matching the "Phase 6 touches no migration" expectation.

## 4. Next command

`/10x-implement durable-pattern-decisions phase 7`

## 5. Open

- Manual Progress rows not touched this phase (carried from earlier handoffs, plus this phase's own):
  `[reviewer]` 1.9, 1.10 (Phase 1), 2.9 (Phase 2), 3.8 (Phase 3), 4.9 (Phase 4), 5.8/5.9 are `[visual]` not
  `[reviewer]` (Phase 5, still open, carried); **6.8, 6.9** (this phase's own, `[reviewer]` — every string from
  `copy`/`copyExtra` byte-for-byte with `app.js` for K22, no new primitives beyond `DialogContent`/`Button`/
  `SubmitButton`/`Glyph`/`usePageShowReset`; keyboard reachability of the trigger, four actions, revealed
  select/input and their submits, Esc/close). Carried forward from the plan text: 7.8 (`[reviewer]`); `[visual]`
  7.10, 7.11; `[human]` 7.9 (product owner confirms plan decision 9 — already answered by the maintainer's Step-0
  product decision recorded in the agent contract, but the row itself stays unticked pending Phase 7).
- Gap ids: K22 and G33 now both registered in `design-kit.md` (status `placeholder` for G33 — the dialog's merge
  picker, rename field, direct-submit type/exclude, pending/error states and merged-variants list are all
  placeholder copy/layout, not kit-delivered; K22's `close` key is new, the four action-button labels were already
  in `content.json` per K12). No further gap ids reserved for Phase 7 — G28 is the one it amends (excluded section
  + „Pokaż więcej”).
- Carried risks (plan `## Known risks`, unchanged): normalizer drift (`src/lib/patterns/merchant.ts`
  `normalizeMerchant`) still open; PostgREST partial-upsert semantics — proven in Phase 1 (pgTAP) and Phase 4
  (smoke), exercised again this phase by „rename keeps the exclusion” (unchanged, still green); smoke text-anchor
  rule (`InlineAlert.astro` renders `<span> text </span>` — bare text, never `>text<`) — this phase discovered a
  second instance of the same class of bug: **`prettier-plugin-astro` reformats any Astro element with ≥2
  attributes and a single-expression child onto three lines** (`<tag attr1 attr2>\n  {expr}\n</tag>`), which
  reintroduces the exact whitespace problem for elements that *are* asserted with `>text<` (not InlineAlert's own
  bare-text convention) — e.g. the „Cofnij scalenie” / „Przywróć” buttons. Fixed here by dropping the redundant
  `type="submit"` attribute (the HTML default inside a `<form>`) so each button has only one attribute
  (`class:list`) and prettier leaves it inline; documented in both `RestoreForm.astro` and `[...key].astro` next to
  the affected buttons. **Any future single-line `>text<` element in this codebase that needs a second attribute
  should extract the class to a local `const` and use `class:list={[theConst]}` (still one attribute) or otherwise
  keep the attribute count at 1** — worth folding into the agent contract's smoke text-anchor rule if this recurs a
  third time.
- `/patterns` list still shows the excluded pattern in the main table (Phase 7's `ExcludedPatterns.astro` +
  `PatternsTable` filter are what move it into „Wykluczone” — not done yet). Anyone visually inspecting `/patterns`
  before Phase 7 lands should expect this.

## 6. Autonomous decisions

- **Ran the phase's work directly rather than through the interactive `/10x-implement` UX** (no `AskUserQuestion`,
  no `TaskCreate`/`TaskUpdate` todo list) — same substitute as Phases 1–5: read the plan's Phase 6 section in full,
  applied its contract by hand (implement → plan-criteria checks → deliberate break/meta-check → full repo-wide
  gate → commit → sha-writeback docs commit). Rejected: invoking the Skill tool and answering its prompts myself —
  the agent contract (rule 1) forbids `AskUserQuestion` outright. Would change: a non-interactive skill entry point.
- **Added an optional `className` prop to the shared `SubmitButton`** rather than building a one-off unstyled
  submit button for `PatternActionsDialog`'s four left-aligned actions, or wrapping each `SubmitButton` in an extra
  `<div>` to override layout from outside. Why: `SubmitButton` had no styling escape hatch and the kit's
  `.modal-actions .btn{justify-content:flex-start}` genuinely needs it; the prop is optional and backward
  compatible (every other caller passes nothing, behaviour unchanged — verified: `npm test` stayed at 190/190 and
  `grep -rn "SubmitButton" src` shows no other call site touched). Would change: if a reviewer prefers composition
  (e.g. a `ButtonGroup` wrapper) over a prop, this is a one-line revert.
- **"No targets → disable the toggle button itself and show `mergeNone` under it" rather than "disable the reveal
  but still let the button open an empty-select form"**, reading the plan's ambiguous "no targets → the button is
  `disabled`" as referring to the „Scal z…” toggle, not a hypothetical always-rendered submit button inside a
  reveal that would then never show (since revealing is gated on `canMerge` too). Why: simpler state machine (no
  select with zero `<option>`s ever reaches the DOM) and matches "why is this disabled" UX better (the note sits
  right where the user would click). Would change: if `mergeTargets` can legitimately be non-empty but every
  candidate is somehow invalid at submit time (race with another tab), the endpoint's own `validateMerge` still
  catches it server-side (`error=merge`) — this client-side gate is a convenience, not the source of truth.
- **Result line under `.detail-top` (`decisionAlert`) is a second, separate alert from the existing
  threshold-only `resultAlert` inside the threshold `Panel`**, not one merged alert covering both families of
  query params. Why: the plan names the decision alert's location as "under `.detail-top`" explicitly, distinct
  from the threshold panel's own `mb-4` slot documented in Phase 4's plan section; the two query-param families are
  mutually exclusive by construction (a single redirect sets exactly one of `saved/removed/error=value\|save` or
  `merged/unmerged/typed/renamed/excluded/restored/error=merge\|name\|decision`), so there is never a rendering
  conflict, and keeping them as two named variables/render sites matches "one thing per concern" better than one
  `if/else` chain across twelve mutually exclusive branches. Would change: nothing found conflicting; this is
  read straight off the plan's own two separate paragraphs (Phase 4 "Result lines" vs Phase 6 "Result line under
  `.detail-top`").
- **Placed the merged-variants list "under the lead" as a child of the same left-column `<div>` that holds the
  eyebrow/h1/lead**, rather than as a new top-level section after `.detail-heading`. Why: the plan's own phrase
  "under the lead" (the `<p>{x.typeLeads[...]}</p>` element) is more specific than "after the heading section",
  and nesting it there keeps it visually attached to "what this pattern is" rather than floating between the
  heading and the two-column `.detail-grid`. Would change: a screenshot review (Phase 7's `[visual]` rows) finding
  it visually cramped against the sum/count column on the right at ≤899px — the plan's own responsive class
  (`max-[899px]:flex-col`) already stacks the columns there, so it should read fine, but this wasn't screenshotted
  this phase (Phase 6's own Implementation Note: "screenshots happen in the Visual step after Phase 7").
