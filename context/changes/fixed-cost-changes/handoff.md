# Handoff — `fixed-cost-changes` (slice S-06)

Written by the `implement` step (`/10x-implement fixed-cost-changes phase 3`, autonomous run
`2026-09-28-s05-s06-s07`). Phase 3 (`/fixed` view: „Zmieniły kwotę” and „Bez zmian” sections) is implemented, gated
and committed. The one thing the next agent must not get wrong: **the page is a 3-way discriminated union
(`{error} | {referenceMonth: null} | {overview}`), not a 2-way check** — `"referenceMonth" in result` (empty/no-data
branch) must stay distinct from `"error" in result`, and the content branch only ever reads `result.overview` after
both narrow away; the „Nowe w tym miesiącu” section (Phase 4) slots into the same `overview` object (`overview.new`
is already computed by `fixedOverview`, just unread by the page until then).

## 1. State

| Item | Value |
|---|---|
| Branch | `feat/fixed-cost-changes`, cut from `main` at `3706508` |
| Commits | 11 on this branch: identity, research, plan, plan review, fixture (p1, `e0d8e4d`), phase-1-sha docs (`9362e4e`), phase-1 handoff (`48604cb`), `feat(fixed-cost-changes): fixedOverview — the pure change/new rule (p2)` (`d827e00`), phase-2-sha docs (`f77de29`), phase-2 handoff (`3f1d8e1`), `feat(fixed-cost-changes): /fixed view — Zmieniły kwotę i Bez zmian (p3)` (`a8e8b0c`) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` (unchanged this step — no phase-boundary transition applies mid-plan) |
| Roadmap | S-06 `in-progress` (unchanged this step) |
| `## Progress` rows remaining | 15 (`grep -c '^- \[ \]' plan.md`): 1.8 `[reviewer]`, 2.9 `[reviewer]` (both carried, still open), Phase 3 automated (3.1–3.8) done this step, 3.9 `[reviewer]` open, Phase 4 (4.1–4.12, 12 rows) untouched |
| Working tree | clean after the commit (`.claude/skills/10x-autonomous-run/scripts/tree-clean.sh` → `CLEAN`) |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/components/fixed/FixedSection.astro` (new) | Kit `.fixed-section` (title/count header + panel-look list wrapper reusing `ExcludedPatterns.astro`'s shape, not `Panel`); `hasRows` false renders one muted empty-line `<p>` instead of the slot. `compact` prop accepted (kit parity, marks the wrapper) but the actual row-height difference lives in `FixedRow`'s own `compact` prop, since slotted rows can't be resized after the fact — documented in the header comment |
| `src/components/fixed/FixedRow.astro` (new) | Kit `.fixed-row`, shared by all three sections. Compact branch (`ExcludedPatterns`-style: mark + name + plain amount, no meta, no slot) vs. full branch (mark + name + optional `<small>` meta + `.fixed-change` wrapper with amount and a slot for the delta / Phase-4 badge). Reuses `merchantMark` from `merchant-mark.ts` |
| `src/pages/fixed.astro` | Real data replaces the unconditional placeholder: `createClient` → `loadPatternData` → `fixedOverview`, 3-way `result` union (error / empty / overview, see intro), `FixedSection`/`FixedRow` for "Zmieniły kwotę" (signed delta, `text-excess-text` rise / `text-green` decrease) and "Bez zmian" (compact). `deltaClass` helper and `<b>` kept on one line deliberately (comment) so prettier's 120-char wrap never splits the smoke-asserted delta text across lines (the `InlineAlert` trap named in the agent contract) |
| `src/content/copy.ts` | `copyExtra.fixed` gains `itemForms`, `count`, `previously` (`DESIGN-GAP: K23`, verbatim from `app.js` `fixedCosts()`) and `changedEmpty`, `unchangedEmpty` (`DESIGN-GAP: G34`, placeholders) |
| `context/foundation/design-kit.md` | New rows **K23** (row/section copy only in `app.js`) and **G34** (states the kit's `fixedCosts()` doesn't define: empty section, decrease colour, no-comparison message, error state, and the `new`/`changed` badge tone actually being amber per a later CSS rule — K9); **G5** status amended from stale `delivered · /fixed` to `S-06 (faza 3, 2026-09-28): wdrożone`; both appended to „Do rundy 3” (items 24, 25) |
| `scripts/smoke.mjs` | 6 new steps (pre-import view, one-month no-change + unchanged-rows, changed-amount + previous-amount, anonymous redirect) reusing the existing smoke user's May/June imports — no new payload. Header comment updated. **Test-runner change**: `contains` now also accepts a string array (all must match) — needed because two Phase-3 steps prove two facts from one GET (row name + section header; previous-amount line + renamed pattern) and the plan's `[reviewer]` row would otherwise force splitting them into extra named steps that break the phase's stated smoke-count math (111+6=117) |
| `context/changes/fixed-cost-changes/plan.md` | Progress 3.1–3.8 ticked with sha `a8e8b0c` (in the phase commit itself this time — no follow-up sha commit needed since this handoff carries the plan.md edit and the sha was already known); 3.9 (`[reviewer]`) left open |
| `context/changes/fixed-cost-changes/handoff.md` | This file |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/fixed-cost-changes` (observed) |
| `npm run lint` | 0 errors (observed; one `lint:fix` pass needed for two prettier attribute-wrap fixes, then clean — confirmed the fixed `<b>`/delta-class lines stayed single-line, not the risky text-wrap) |
| `npx astro check` | 124 files, 0 errors — baseline 122/0 (phase 2), delta +2 files (`FixedSection.astro`, `FixedRow.astro`), 0 errors (observed) |
| `npm run fixture:check` | OK (observed) |
| `npm test` | 213 passed, 12 files — baseline 213/12 (phase 2), delta 0 (observed, twice — after writing and after the deliberate-break restores) |
| `npm run build` | passes (observed) |
| `npx supabase db reset && npx supabase test db` | Files=5, Tests=102, Result: PASS — baseline 102/5, delta 0 (observed, sandbox disabled) |
| `ASTRO_DEV_BACKGROUND=1 npx astro dev --port 4398` + `npm run smoke` | 117/117 PASS — baseline 111, delta +6, matches the plan's `111 + 6 = 117` target exactly (observed three times: clean, after each deliberate-break restore; sandbox disabled; port 4398 killed after each run) |
| Deliberate break 3.6 (delta): `formatSignedMoney(row.deltaMinor)` → `formatMoney(row.deltaMinor)` | "fixed lists a changed amount" FAILed (`>+1,50 zł<` missing — rendered `1,50 zł`, no sign); "fixed shows the previous amount" stayed PASS — meta-check confirmed the red isolates the signed formatter reaching the page, not the row rendering at all. Restored; suite green again |
| Deliberate break 3.7 (pre-import branch): `"referenceMonth" in result ?` → `false ?` | "fixed shows the pre-import view" FAILed — as a 500 (accessing `result.overview` when `result` was actually `{referenceMonth: null}`), not a text mismatch, but still a clean FAIL against the expected 200; "fixed with one month lists no change" (a real-data step) stayed PASS — meta-check confirmed the red is specifically the removed empty-data branch, not a general breakage. Restored; suite green again |
| Post-restore re-run: lint / astro check / fixture:check / test / build / pgTAP / smoke | all green again (observed, matches the rows above) |
| Seam checks | `grep -nE "#[0-9a-fA-F]{3,6}\b|\[#"` over `src/components/fixed/*.astro`, `src/pages/fixed.astro` — empty; `grep -n "DESIGN-GAP"` over the same files + `copy.ts` — every new key carries `K23` or `G34` (observed) |

## 4. Next command

`/10x-implement fixed-cost-changes phase 4`

## 5. Open

- **3-way union, not 2-way** (see intro) — Phase 4 adds the "Nowe w tym miesiącu" `FixedSection` between the two
  existing ones inside the same `overview` content branch; `overview.new` and `overview.hasComparison` are already
  computed, just unread by `fixed.astro` until Phase 4 reads them.
- **`FixedSection`'s `compact` prop is accepted but not consumed for styling** (documented in its own header
  comment) — the wrapper padding is identical either way per the plan contract; row height comes from `FixedRow`'s
  own `compact` prop, set per-row at the call site in `fixed.astro`. Not a stale prop: it exists for kit-markup
  parity and is genuinely referenced (added to the wrapper's `class:list`), just with no corresponding CSS rule.
- **`scripts/smoke.mjs`'s `contains` field now accepts `string | string[]`** (backward-compatible; every existing
  entry still passes a plain string) — Phase 4's plan-listed step "fixed marks a new pattern" also needs two
  positive `contains` values (`>pierwsze wystąpienie · 10.06.2026<` and `>nowy<`); use the array form for it rather
  than splitting into two named steps (would break the phase's stated `117 + 4 = 121` smoke-count math).
- **Manual-only Progress rows carried forward (human checklist, unchanged):** 1.8 `[reviewer]`, 2.9 `[reviewer]`,
  3.9 `[reviewer]` (this phase, still open) — `/10x-impl-review`; 4.9 `[reviewer]`; 4.10 `[human]` — product owner
  confirms plan decision 7 (D5 flip); 4.11, 4.12 `[visual]` — the Visual step.
- **DESIGN-GAPs added this step**: K23 (`copyExtra.fixed` row/section copy) and G34 (states the kit doesn't define)
  registered in `design-kit.md`, both also appended to „Do rundy 3” (items 24, 25); G5 status amended. **Phase 4
  still needs**: K23 gains `firstSeen`; G34 gains `newEmpty`/`noComparison` and the `Badge` `new`-tone note; K9 note
  ("S-06: `Badge` tone `new` → `excess`/25 + `excess-text`") per plan Phase 4 item 1/3.
- **Phase 4 starts here**: `Badge.tsx` needs a `new` tone (`bg-excess/25 text-excess-text`, plan contract); the
  header comment's "Further tones (`new` / `changed`) arrive with S-06" line becomes stale once that lands — the
  seam-sweep grep `grep -rn "Further tones" src` (plan 4.8) will still find it in `fixed.astro`'s own header comment
  too if not removed there — check both files.
- **Smoke anchors** (Phase 4, unchanged guidance): use `>text<`; if `eslint --fix` ever wraps an element in
  `FixedRow.astro` / `FixedSection.astro` / `fixed.astro`, switch to bare text or a short pre-computed helper (as
  done here for the delta `<b>`) — never leave a multi-line wrap on a smoke-asserted element.
- **Follow-ups file** (`context/changes/fixed-cost-changes/follow-ups/review-fixes.md`) still does not exist — Phase
  4 creates it (plan item 4).
- No new risk introduced by this phase; `Known risks` in plan.md (D5 flip, one-off merchants, astro-check count,
  smoke text anchors, badge `new` tint) all still apply unchanged to Phase 4.

## 6. Autonomous decisions

- **Exec mode: implemented Phase 3 directly in this context, not delegated to a subagent.** Rejected: delegating
  per the skill's default `AskUserQuestion` prompt (forbidden by the agent contract). Why: the phase-2 handoff
  flagged Phase 3 (two new Astro components + the page) as the point where delegation becomes the better default,
  but doing it directly let me verify the exact single-line-rendering risk (prettier wrap → broken `>text<` anchor)
  firsthand while writing the components, rather than reviewing it after the fact. Would change: Phase 4, which is
  smaller (no new component) — could go either way.
- **`result` typed as a 3-way discriminated union (`{error}|{referenceMonth:null}|{overview}`), computed via an
  IIFE, mirroring `patterns.astro`'s `{error}|{patterns}` pattern extended to a third case** — chosen over a plain
  `FixedOverview | null` local (would conflate "read failed" with `overview.referenceMonth === null`, a valid
  `FixedOverview` shape for "no rows"), and over destructuring `overview` fields into un-typed locals before the
  template (patterns.astro's style, but this page needs the whole nested `changed`/`unchanged` arrays inline in
  JSX, not scalar fields). Why: TypeScript narrows `"x" in union` checks reliably inside nested JSX ternaries in
  this codebase already (patterns.astro's own precedent); `astro check` confirmed 0 errors. Would change: nothing
  binds this differently for Phase 4's third branch (adds a `FixedSection` read from the same `result.overview`,
  no new union member needed).
- **`FixedSection`'s `compact` prop kept in the type per the plan's literal contract, but applied only as a
  kit-parity wrapper class, not a styling difference** (see §5). Rejected: dropping the prop entirely (contradicts
  the plan's explicit Props shape); rejected: threading it into a CSS-cascade `:global()` selector to actually
  resize slotted `FixedRow`s from the section (over-engineered — `FixedRow`'s own `compact` prop, also in the plan
  contract, already does this per-row, and duplicating the mechanism two ways would be exactly the kind of
  duplicated-logic the Phase-4 seam sweep looks for). Would change: a future section needing genuinely different
  compact-wrapper styling.
- **`scripts/smoke.mjs`'s `contains` extended to accept `string | string[]`**, backward-compatible. Rejected:
  splitting steps 3 ("fixed with one month lists unchanged patterns") and 5 ("fixed shows the previous amount")
  each into two named steps to keep `contains` single-valued — would raise the smoke count above the plan's stated
  `111 + 6 = 117` and drift from the plan's named step list (6 items, not 8). Why: the plan explicitly names each
  step as proving two facts ("contains X and Y"); extending the harness is the smaller, more faithful change.
  Would change: a reviewer preferring the step-count math over a harness change (then split the two steps and
  update the phase's smoke-count line instead).
- **Deliberate-break 3.7 manifested as a 500, not a text-mismatch FAIL.** Accepted as satisfying the plan's
  "FAILs" requirement (the harness compares `status` first; 500 ≠ expected 200 is an unambiguous FAIL) rather than
  reworking the break to avoid the runtime error. Why: forcing a text-only failure mode would have meant breaking
  something less precisely targeted at "the pre-import branch is gone"; the 500 is in fact stronger evidence that
  the branch was removed (the empty-state's `overview` shape has no `.changed`/`.unchanged` to read). Would change:
  a reviewer wanting every deliberate break to fail via content mismatch specifically, never a 5xx.
- **No `change.md` / roadmap edit this step**, same reasoning as phase 2 (no phase-boundary status transition
  applies mid-plan). Would change: a contract rule requiring a per-phase `updated` bump on `change.md` (none
  found).
- **sha appended directly in this step's own `plan.md` edit, not a separate follow-up docs commit** (unlike phases
  1–2, which used a follow-up commit because the phase commit couldn't know its own sha in advance). Why: this
  handoff commit is written after the phase commit exists, so its sha (`a8e8b0c`) is already known when editing
  `plan.md` — folding it into the handoff commit avoids an extra empty-diff-adjacent commit. Would change: nothing
  binds this either way; phase-2's handoff explicitly flagged this as an open choice for Phase 3.
