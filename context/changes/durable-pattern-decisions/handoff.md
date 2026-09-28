# Handoff — `durable-pattern-decisions` (slice S-05)

Written by the `implement` step, Phase 7 (2026-09-28, autonomous run `2026-09-28-s05-s06-s07`) — the **last**
plan phase. Phase 7 (excluded section on `/patterns`, seam sweep) is green and committed; `change.md` status is
now `implemented`. **What the next agent must not get wrong**: implementation is done, but every `[reviewer]`
row from Phases 1–6 (1.9/1.10, 2.9, 3.8, 4.9, 6.8/6.9), the `[visual]` rows from Phases 5 and 7 (5.8/5.9, 7.10/7.11)
and the `[human]` row 7.9 are still open (`- [ ]`) by design — this step only ticked its own automated rows plus
7.8 (seam sweep, explicitly assigned to the implement step by this run's step brief, not the general `[reviewer]`
delegation). The next step is `/10x-impl-review`, not another implement phase.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/durable-pattern-decisions` (confirmed with `git branch --show-current`), cut from `main` at `f252112` |
| Commits on branch | 25 total ahead of `f252112`. Phases 1–6 as recorded in the prior handoff, plus this step: **Phase 7 `feat(durable-pattern-decisions): excluded section on /patterns and seam sweep (p7)` (`71eaccb`)**, **`docs(durable-pattern-decisions): record phase 7 commit sha in Progress` (`8ac53f1`)**, and this handoff commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | **`implemented`** (flipped this step — was `implementing`) |
| `## Progress` rows | 12 pending (`grep -c '^- \[ \]' plan.md`) — all `[reviewer]`/`[visual]`/`[human]`, carried from every phase (1.9/1.10, 2.9, 3.8, 4.9, 5.8/5.9, 6.8/6.9, 7.9, 7.10, 7.11); none are mine to tick |
| Working tree | Clean after this handoff commit (`git status --short` empty) |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `src/components/patterns/ExcludedPatterns.astro` | New. Pure Astro (no island): kit `.excluded-section` without its client-side toggle script — a native `<details class="group">`/`<summary>` opens/closes via CSS (`group-open:` variant), no JS. Renders nothing when `patterns.length === 0`. Summary = `Icon name="arrow" size={14}` (rotated −90°/0° via `group-open:rotate-0`) + `copyExtra.patterns.excludedToggle` ("Wykluczone") + `<span>{n} {plural(...)}</span>`. Body: a plain bordered wrapper (not the shared `Panel` — see its own code comment for why: overriding `Panel`'s `p-[22px]` with `px-5 py-0` is order-dependent under `tailwind-merge`) listing each excluded pattern (merchant mark, name, `copy.patternActions.excluded` meta text, `RestoreForm back="list"`). Items are not links (kit) |
| `src/components/patterns/merchant-mark.ts` | New. Shared `merchantMark` class string (the kit's `.merchant-mark` square) — extracted from `PatternsTable.tsx` so it and `ExcludedPatterns.astro` never drift apart (seam sweep) |
| `src/components/Icon.astro` | Changed. `size` prop union widened from `15\|16\|17\|20\|28` to include `14` (the kit's `icon('arrow',14)` on the excluded-toggle) — reused rather than duplicating the sprite-rendering SVG markup in `ExcludedPatterns.astro` |
| `src/components/patterns/PatternsTable.tsx` | Changed. Uses the shared `merchantMark` constant instead of an inline class string; header comment updated (`DESIGN-GAP: G28` now names only status badges (S-06) and "Pokaż więcej" — the excluded section is delivered). Behaviour unchanged: still renders whatever `patterns` prop it is given (the caller now passes only non-excluded items) |
| `src/pages/patterns.astro` | Changed. Splits `items` into `visibleItems` (`!p.excluded`, passed to `PatternsTable`) and `excludedItems` (`{key,name}[]`, passed to the new `ExcludedPatterns`); the empty-state branch still keys off the unfiltered `items.length` (an all-excluded account is not "no patterns"). New `resultAlert` (`InlineAlert`) above the table for `?restored=1` (`copy.patternActions.restored`) / `?error=decision` (`copyExtra.patterns.decisionError`) — mirrors the detail page's `decisionAlert` from Phase 6 |
| `src/content/copy.ts` | Changed. `copyExtra.patterns` gains `excludedToggle: "Wykluczone"` (verbatim, kit `patterns()`'s excluded-toggle text), placed after the K22 block's `close` key with its own provenance comment |
| `src/lib/patterns/decisions.ts`, `src/lib/patterns/thresholds.ts` | Changed. Header comments referenced a function named `loadPatterns` (never existed under that name in this codebase — the actual shared helper is `collectPages`) — reworded, closing the seam-sweep grep (`grep -rn "PatternListOverviewItem\|loadPatterns\b" src test`, no other change |
| `scripts/smoke.mjs` | Changed. +3 steps after Phase 6's own additions: "patterns list shows the excluded section" (after "excluded pattern shows the banner"), "excluded pattern leaves the table" (same GET), "list confirms a restore" (after "restored pattern drops the banner", GET `/patterns?restored=1`) |
| `context/foundation/design-kit.md` | Changed. G28 row: faza-7 addendum (excluded section delivered; gap now only status badges + "Pokaż więcej"). G33 row: faza-7 addendum (all-excluded list state, native `<details>` toggle, no "przywrócony" badge — decision 16). "Do rundy 3" item 22 (K22): added the new `excludedToggle` key to the list of copy the kit author still needs to promote to `content.json` |
| `context/changes/durable-pattern-decisions/follow-ups/review-fixes.md` | New. Records what this slice closed (S-04 F5/F7/F8, undo-import F4, G24 geometry, S-01 F9 shared close icon — the last one verified already met on `main`, no code change) and what carries forward, each with a `Trigger:` line: S-04 F4 (threshold endpoints), F11 (field radius, incl. `DeleteAccountDialog`'s modal input), a checked-not-fixed note on "DeleteAccountDialog bfcache" (no manual `pending` flag exists there to get stuck — see the file for the evidence), and S-07 ("monthly sums must skip `pattern.excluded`") |
| `context/changes/durable-pattern-decisions/plan.md` | Phase 7 `## Progress` rows `7.1`–`7.8` ticked `[x]` with ` — 71eaccb` and observed numbers/meta-check recorded inline (7.8 ticked as the implement step's own seam-sweep verification, per this run's explicit step brief); `7.9`/`7.10`/`7.11` left `[ ]` (`[human]`/`[visual]`, not mine) |
| `context/changes/durable-pattern-decisions/change.md` | `status: implementing` → `status: implemented` |
| `context/changes/durable-pattern-decisions/handoff.md` | This file |

## 3. Verification

Baseline for this phase (measured on this branch before Phase 7, i.e. Phase 6's own result): lint 0 · astro check 0
errors (118 files) · vitest 190 (11 files) · fixture:check OK · build OK · pgTAP 102 (5 files) · smoke 108 PASS.

| Command / check | Result |
| --- | --- |
| `git branch --show-current` | `feat/durable-pattern-decisions` |
| `npm run lint` | 0 errors (delta 0) — one prettier formatting error and one `astro/prefer-class-list-directive` warning surfaced while writing `ExcludedPatterns.astro`, fixed with `npx eslint --fix` before the final pass |
| `npx astro check` | 0 errors, 0 warnings, 0 hints, **120** files (delta +2 — `ExcludedPatterns.astro`, `merchant-mark.ts`) |
| `npm run fixture:check` | OK |
| `npm test` | **190** passed, **11** files (delta 0 — no new unit test file this phase, matches the plan) |
| `npm run build` | passes |
| `npx supabase db reset && npx supabase test db` | pgTAP **102** (5 files), all pass (delta 0 — Phase 7 touches no migration) |
| `BASE_URL=http://localhost:4398 npm run smoke` (`ASTRO_DEV_BACKGROUND=1 npx astro dev --port 4398`) | **111** PASS (108 + 3, matches plan target "108 + 3 = 111"), run clean before and after the deliberate break |
| `grep -rn "PatternListOverviewItem\|loadPatterns\b" src test` | empty |
| `grep -rn "DESIGN-GAP: G28" src` | matches only `PatternsTable.tsx`'s updated comment |
| `grep -rnE "#[0-9a-fA-F]{3,6}\b\|\[#" src/components/patterns/ExcludedPatterns.astro src/components/patterns/merchant-mark.ts src/pages/patterns.astro` | empty (dropped a literal `#e5e9e8` from `merchant-mark.ts`'s own comment mid-phase — kept only in `design-kit.md`, matching the existing convention of no raw hex in `src/`) |

Deliberate break (plan criterion 7.6, on `src/pages/patterns.astro`, restored immediately after its own smoke run,
full gate re-confirmed green afterward):

1. `<PatternsTable client:load patterns={visibleItems} ...>` changed to `patterns={items}` (unfiltered — excluded
   patterns fed back into the table). Result: "excluded pattern leaves the table" FAILed (1/111 red — the excluded
   row's `href="/patterns/kawiarnia%20smoke"` reappeared in the table); every other step — including "patterns
   list shows the excluded section" and "list confirms a restore" — stayed PASS. Restored → 111/111 PASS.
   **Meta-check**: the still-green "patterns list shows the excluded section" step (asserts the excluded pattern's
   *name* renders on the page) proves the break didn't remove the excluded pattern from the read or the excluded
   section — it specifically proves the table row (the only element on the page that can carry an `href`) stopped
   filtering `excluded`, which is exactly what the automated criterion asks to isolate ("the section has no links,
   so only a table row can carry the href").

No `BEGIN … ROLLBACK` DB experiment was needed this phase (no migration touched, no local DB mutation made outside
the app's own normal POST flow through the API, which smoke already exercises); pgTAP was re-run once (before any
code change) to confirm delta 0, matching "Phase 7 touches no migration".

## 4. Next command

`/10x-impl-review durable-pattern-decisions`

## 5. Open

- Manual `## Progress` rows not touched this phase (all carried, none are mine): `[reviewer]` 1.9, 1.10 (Phase 1),
  2.9 (Phase 2), 3.8 (Phase 3), 4.9 (Phase 4), 6.8/6.9 (Phase 6 — every string from `copy`/`copyExtra` byte-for-byte
  with `app.js` for K22, no new primitives beyond `DialogContent`/`Button`/`SubmitButton`/`Glyph`/
  `usePageShowReset`, keyboard reachability); `[visual]` 5.8/5.9 (Phase 5, dialog geometry screenshots), 7.10/7.11
  (Phase 7, the full screenshot list + the fixture US-03 walk-through — see plan Phase 7 Manual Verification for
  the exact shot list); `[human]` 7.9 (product owner confirms decision 9 — already answered in substance by the
  maintainer's Step-0 product decision recorded in the agent contract, but the row itself stays unticked, as the
  plan asks, pending an explicit human pass).
- Gap ids: G28 and G33 both amended this phase (see Artifacts above); K22's "Do rundy 3" ask grew by one key.
  `design-kit.md` still lists G33 overall as `placeholder` (the dialog's merge picker, rename field, direct-submit
  type/exclude, pending/error states and merged-variants list remain placeholder copy/layout, not kit-delivered —
  only the excluded-list-specific behaviours this phase touched are settled). No new gap ids reserved.
- `follow-ups/review-fixes.md` is now the authoritative record of what carries into S-06/S-07 and beyond — read it
  before assuming any earlier-slice follow-up is still open or closed; do not re-derive that list from memory.
- Carried risks (plan `## Known risks`, unchanged this phase): normalizer drift (`src/lib/patterns/merchant.ts`
  `normalizeMerchant`) still open; PostgREST partial-upsert semantics — proven Phase 1 (pgTAP) + Phase 4 (smoke);
  smoke text-anchor rule (`InlineAlert.astro` renders `<span> text </span>` — bare text, never `>text<`; a second
  discovered instance from Phase 6 — prettier-plugin-astro reformats a ≥2-attribute single-expression-child element
  onto three lines — is why every `item-name`-class row this phase keeps to one attribute).
- This is the **last plan phase**. No further `/10x-implement durable-pattern-decisions phaseN` calls are expected;
  the next step is the impl review, then (per the agent contract) the visual gate, archive, and the ship chain for
  S-05 before S-06 starts on the same branch discipline.

## 6. Autonomous decisions

- **Ran Phase 7's work directly rather than through the interactive `/10x-implement` UX** (no `AskUserQuestion`),
  same substitute as Phases 1–6: read the plan's Phase 7 section in full, applied its contract by hand (implement
  → plan-criteria checks → deliberate break/meta-check → full repo-wide gate → commit → sha-writeback docs commit
  → change.md status flip → this handoff). Rejected: invoking the Skill tool and answering its prompts myself —
  the agent contract (rule 1) forbids `AskUserQuestion` outright. Would change: a non-interactive skill entry
  point.
- **Ticked plan row 7.8 (`[reviewer]`, seam sweep) as done**, departing from the otherwise-strict "never tick a
  `[reviewer]`/`[visual]`/`[human]` row" rule. Why: this run's own step brief explicitly named the seam sweep as
  "yours" (the implement step's), separately from the general `[reviewer]` delegation the same brief also states —
  read as a deliberate, per-run carve-out for this one row, not a license to tick any other manual row. Did the
  actual verification (grep-checked, kit rows re-read) rather than rubber-stamping. Would change: a stricter
  reading that treats "yours" as scoped only to *doing* the sweep, not *ticking the box* — in that case 7.8 should
  revert to `[ ]` and the box left for `/10x-impl-review` to tick after independently re-checking the same
  evidence this handoff already lays out.
- **`ExcludedPatterns`'s list container is a plain styled `<div>`, not the shared `Panel` component**, despite the
  plan calling it "Panel-styled". Why: `Panel`'s own padding (`p-[22px]`) and the plan's required override
  (`px-5 py-0`) are both arbitrary-value Tailwind utilities on the same CSS property; a `node -e` check against
  this repo's actual `tailwind-merge` confirmed `twMerge` does **not** dedupe `p-[22px]` against `px-5 py-0` (both
  survive in the class list, so which one wins depends on Tailwind's generated stylesheet order, not source order
  — untestable/fragile). A plain wrapper with the same visual classes (`rounded-xl border border-line bg-paper`)
  sidesteps the ambiguity entirely. Would change: `Panel.astro` growing a `padding` prop/variant instead of a bare
  `class` escape hatch — then this should switch to it for consistency.
- **`Icon.astro`'s `size` union widened to add `14` rather than duplicating the sprite `<svg>` markup inline in
  `ExcludedPatterns.astro`.** Why: the codebase's own convention (`Glyph.tsx` for React islands, `Icon.astro` for
  server components) already centralises the sprite reference; the kit's `icon('arrow',14)` is a legitimate,
  used value, and every prior size in the union was added the same way (as call sites needed it — confirmed by
  grepping every existing `<Icon size={...}>` call before adding). Would change: a reviewer preferring the union
  stay closed and a one-off inline SVG instead — a two-line revert.
- **Reused `RestoreForm.astro` verbatim with `back="list"`** (built in Phase 6 anticipating this exact call site)
  rather than writing a second, list-specific restore form. No alternative considered — this was the whole reason
  Phase 6's own handoff named the `back` prop's purpose explicitly. Would change: nothing found.
- **Stale-comment fix scope limited to the two `loadPatterns`-name occurrences the seam-sweep grep actually
  flagged** (`decisions.ts`, `thresholds.ts`), not a broader comment audit. Why: the plan's own automated criterion
  (7.7) names exactly this grep as the bar; going further risks touching prose outside this phase's diff surface
  for no verifiable gain. Would change: `/10x-impl-review` finding another stale reference this grep pattern
  doesn't catch (e.g. a differently-cased or partially-quoted mention).
