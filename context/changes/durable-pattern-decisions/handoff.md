# Handoff — `durable-pattern-decisions` (slice S-05)

Written by the `implement` step, Phase 5 (2026-09-28, autonomous run `2026-09-28-s05-s06-s07`). Phase 5 (shared
dialog geometry + bfcache pending reset, G24 / undo-import F4 / S-04 F8) is fully green and committed. The shared
`DialogContent`/`DialogOverlay` (`src/components/ui/dialog.tsx`) now match the kit `.modal`/`.modal-backdrop`
exactly (480 px / 31 px padding / 13 px radius, `bg-ink/44`, 20 px viewport margin baked into the content's own
`w-[calc(100%-40px)]` rather than the overlay's padding — the two Radix nodes are siblings inside the portal, not
parent/child, so centring has to live on the content, not a `grid place-items-center` on the overlay). New
`usePageShowReset` hook (`src/components/hooks/`) resets a stuck `pending`/`saving` state on a bfcache restore,
wired into `DeleteImportDialog` and `ThresholdEditor`. **What the next agent must not get wrong**: this phase
touches nothing on `/patterns/[...key].astro` or the decision endpoint — Phase 6 is the first phase to actually
wire the dialog geometry and the bfcache hook onto a *new* consumer (`PatternActionsDialog`); when it builds that
component it should reuse `usePageShowReset` the same way, not reinvent a bfcache fix. The `[visual]` rows 5.8/5.9
(screenshots + manual bfcache back-navigation check) are explicitly not mine and are still `[ ]` — do not tick them.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/durable-pattern-decisions` (confirmed with `git branch --show-current`), cut from `main` at `f252112` |
| Commits on branch | 15 — change identity, research, plan, plan review, Phase 1 (`1e2ea9b` + sha-record `272232b`), Phase 1 handoff (`17e3137`), Phase 2 (`c2b63b4` + sha-record `a89ce59`), Phase 2 handoff (`8f3f5f9`), Phase 3 (`b1010f3` + sha-record `3000e75`), Phase 3 handoff (`f7eb960`), Phase 4 (`61145cf` + sha-record `c2626db`), Phase 4 handoff (`79da179`), **Phase 5 `feat(durable-pattern-decisions): shared dialog geometry and bfcache pending reset (p5)` (`f468f68`)**, **`docs(durable-pattern-decisions): record phase 5 commit sha in Progress` (`1b27113`)** |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` (unchanged — only flips once, at Phase 1 entry) |
| `## Progress` rows | 38 done / 27 pending (`grep -c '^- \[ \]' plan.md`) — includes this phase's own `[visual]` rows 5.8, 5.9 still `[ ]` (not mine) |
| Working tree | Clean after the two commits (`git status --short` empty) |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `src/components/ui/dialog.tsx` | Changed. `DialogOverlay`: `bg-ink/40` → `bg-ink/44` (exact match to kit `rgba(32,47,64,.44)` — `--ink` is `#202F40`, confirmed by grep in `src/styles/brand.css`). `DialogContent`: `max-w-[440px] p-[22px] rounded-xl` → `w-[calc(100%-40px)] max-w-[480px] p-[31px] rounded-[13px]` (values read directly from `design/rytm-os/prototype/styles.css` `.modal-backdrop`/`.modal`). The 20 px kit viewport margin is expressed via the content's own `calc(100%-40px)` width, not overlay padding/grid, because `DialogOverlay` and `DialogPrimitive.Content` are portal siblings in this Radix structure, not parent/child — centring an overlay-level `grid place-items-center` would not affect the content at all. Header comment updated, written without a literal hex value so the plan's own `grep -nE "#[0-9a-fA-F]{3,6}..."` criterion stays a true negative. Border and shadow literal untouched (not named by the plan's contract) |
| `src/components/hooks/usePageShowReset.ts` | New. `onPersistedPageShow(target: EventTarget, callback): () => void` — pure, DOM-free (takes any `EventTarget`), adds a `pageshow` listener that calls `callback` only when `event.persisted` is `true`, returns the cleanup. `usePageShowReset(reset: () => void)` — thin `useEffect` wiring it to `window` |
| `src/components/imports/DeleteImportDialog.tsx` | Changed. `usePageShowReset(() => setPending(false))` added next to the existing `pending` state (undo-import F4) |
| `src/components/patterns/ThresholdEditor.tsx` | Changed. `usePageShowReset(() => setSaving(false))` added next to the existing `saving` state (S-04 F8) |
| `test/unit/page-show-reset.test.ts` | New, 3 cases: persisted `pageshow` → callback called once; non-persisted → callback not called; after `cleanup()` → callback not called even on a persisted event. Uses a plain `new EventTarget()` + `Object.assign(new Event("pageshow"), { persisted })` — no jsdom, matches the plan's contract and this repo's Node-only vitest environment (no jsdom/testing-library dependency exists) |
| `context/foundation/design-kit.md` | G24 row: appended the S-05 faza 5 delivery note (dialog geometry now matches the kit, closing the 400 px side-margin discrepancy the row itself named; `usePageShowReset` note) |
| `context/changes/durable-pattern-decisions/plan.md` | Phase 5 `## Progress` rows `5.1`–`5.7` ticked `[x]` with ` — f468f68` and the **observed** numbers/meta-check recorded inline (§3 below has the same detail); `5.8`/`5.9` left `[ ]` (`[visual]`, not mine) |
| `context/changes/durable-pattern-decisions/handoff.md` | This file |

## 3. Verification

Baseline for this phase (measured on this branch before Phase 5, i.e. Phase 4's own result): lint 0 · astro check 0
errors (114 files) · fixture:check OK · vitest 187 (10 files) · build OK · pgTAP 102 (5 files) · smoke 103 PASS.

| Command / check | Result |
| --- | --- |
| `git branch --show-current` | `feat/durable-pattern-decisions` |
| `npm run lint` | 0 errors (delta 0) |
| `npx astro check` | 0 errors, 0 warnings, 0 hints, **116** files (delta +2 — `usePageShowReset.ts`, `page-show-reset.test.ts`) |
| `npm run fixture:check` | OK |
| `npm test` | **190** passed, **11** files (baseline 187/10 + 3 new cases in 1 new file, delta +3/+1 file) |
| `npm run build` | passes |
| `npx supabase db reset && npx supabase test db` | pgTAP 102 (5 files), all pass (delta 0 — Phase 5 touches no migration) |
| `BASE_URL=http://localhost:4398 npm run smoke` (`ASTRO_DEV_BACKGROUND=1 npx astro dev --port 4398`) | **103** PASS (delta 0), run clean before and after the deliberate break |
| `grep -nE "#[0-9a-fA-F]{3,6}\b\|\[#" src/components/ui/dialog.tsx` | empty (plan criterion 5.7) |

Deliberate break (plan criterion 5.6, on `src/components/hooks/usePageShowReset.ts`, restored immediately after
its own test run, full gate re-confirmed green afterward):

1. `onPersistedPageShow`'s handler changed to call `callback()` unconditionally, dropping the
   `if ((event as PageTransitionEvent).persisted)` guard → `test/unit/page-show-reset.test.ts` "does not call the
   callback on a non-persisted pageshow" FAILs (1/190 — `expected 1 to be +0`). Restored → 190/190 PASS.
   **Meta-check**: the other two cases in the same file ("calls the callback once on a persisted pageshow", "stops
   listening after cleanup") stayed green throughout the break, so the red isolates the `persisted` filter
   specifically — not the listener registration or the cleanup function, both of which the break left untouched.

No `BEGIN … ROLLBACK` DB experiment was needed this phase (no migration touched, and no other local DB mutation was
made); pgTAP was re-run once (before any code change) to confirm delta 0, matching the "Phase 5 touches no
migration" expectation — not re-run a second time after the break since the break was pure TypeScript with no DB
surface.

## 4. Next command

`/10x-implement durable-pattern-decisions phase 6`

## 5. Open

- Manual Progress rows not touched this phase (carried from earlier handoffs, plus this phase's own):
  `[reviewer]` 1.9, 1.10 (Phase 1), 2.9 (Phase 2), 3.8 (Phase 3), 4.9 (Phase 4 — endpoint contract review); **5.8,
  5.9** (this phase's own, `[visual]` — screenshots `settings-delete-dialog`/`imports-delete-dialog` at 1440 px and
  ~400 px, and a manual bfcache back-navigation check on `/settings` "Zapisz próg" and `/imports` "Usuń import").
  Carried forward from the plan text: 6.8, 6.9, 7.8 (`[reviewer]`); `[visual]` 7.10, 7.11; `[human]` 7.9 (product
  owner confirms plan decision 9 — already answered by the maintainer's Step-0 product decision recorded in the
  agent contract, but the row itself stays unticked pending Phase 7).
- Gap ids still reserved for later phases: K22, G33 (Phase 6). G24 itself is now closed for the dialog-geometry part
  of its note (see `context/foundation/design-kit.md`); the row's other named gaps (password/deletion result-state
  copy) were already delivered in an earlier slice and are unaffected by this phase.
- Carried risks (plan `## Known risks`, unchanged): normalizer drift (`src/lib/patterns/merchant.ts`
  `normalizeMerchant`) still open; PostgREST partial-upsert semantics — proven in Phase 1 (pgTAP) and Phase 4
  (smoke); smoke text-anchor rule (`InlineAlert.astro` renders `<span> text </span>` — bare text, never `>text<`) —
  still relevant starting Phase 6's `patternActions` toasts, not yet exercised by anything this phase added (no new
  `InlineAlert` result line was touched — this phase's dialogs render no result text of their own).
- **New this phase, not in the plan text**: `DialogOverlay` and `DialogPrimitive.Content` are portal *siblings* in
  this Radix version, not parent/child, which the plan's prose ("overlay `bg-ink/44` with the kit's 20 px viewport
  margin; content `w-[calc(100%-40px)] max-w-[480px] …`") already implicitly assumes (it puts the margin math on
  the content, not the overlay) — flagging explicitly here because a first pass at this phase tried adding
  `grid place-items-center p-5` to the overlay to "add the margin there" and had to be reverted (it has zero visual
  effect on a sibling node); Phase 6, if it ever touches `dialog.tsx` again, should not re-attempt that.
- `src/components/hooks/` did not exist before this phase (research.md noted it); it now holds exactly one file,
  `usePageShowReset.ts`. Phase 6's plan section does not name a new hook, so no further additions are expected
  there, but if one is needed this is the established location.

## 6. Autonomous decisions

- **Ran the phase's work directly rather than through the interactive `/10x-implement` UX** (no `AskUserQuestion`,
  no `TaskCreate`/`TaskUpdate` todo list) — same substitute as Phases 1–4: read the plan's Phase 5 section in full,
  applied its contract by hand (implement → plan-criteria checks → deliberate break/meta-check → full repo-wide
  gate → commit → sha-writeback docs commit). Rejected: invoking the Skill tool and answering its prompts myself —
  the agent contract (rule 1) forbids `AskUserQuestion` outright. Would change: a non-interactive skill entry
  point.
- **Put the kit's 20 px viewport margin entirely on `DialogContent`'s width (`w-[calc(100%-40px)]`) rather than on
  `DialogOverlay` as padding + grid centring**, even though the plan's prose phrase "overlay `bg-ink/44` with the
  kit's 20 px viewport margin" could be read as asking for overlay-level padding. Why: `DialogOverlay` and
  `DialogPrimitive.Content` are rendered as siblings inside `DialogPortal` (not nested), so any padding/grid
  centring added to the overlay has no effect on the separately-positioned (`fixed top-1/2 left-1/2` +
  transform) content — verified by reading the actual component tree before editing, and by the plan's own explicit
  content contract (`w-[calc(100%-40px)] max-w-[480px] rounded-[13px] p-[31px]`), which already encodes the margin
  into the content's width. Would change: nothing — the plan's own two clauses (overlay clause, content clause)
  are consistent once read against the actual Radix structure; only the prose's placement of "20 px viewport
  margin" next to "overlay" briefly suggested the wrong node.
- **Reworded the `dialog.tsx` header comment to avoid a literal hex value (`#202F40`)** rather than leaving a
  human-readable colour reference. Why: the plan's own automated criterion 5.7 is a literal
  `grep -nE "#[0-9a-fA-F]{3,6}\b|\[#"` over the whole file with no comment exception, and a first pass's comment
  (`--ink is #202F40`) made that grep non-empty although it changed no rendered colour — the grep is a blunt
  instrument by design (plan text: "the shadow's existing `rgba(32,47,64,…)` is the only literal and stays as it
  was"), so satisfying it literally was preferred over arguing the comment doesn't count. Would change: if the
  criterion is ever revised to exclude comments, the more readable hex-bearing wording could return.
- **No `npm run db:types` run this phase.** Why: Phase 5's plan section names no migration and touches no table;
  the automated-verification list for this phase (unlike Phase 1's) does not call for it, and `git status` after
  `supabase db reset` confirms no schema drift was introduced. Would change: if a future review wants it run
  defensively on every phase regardless of migration touch, that's a contract change to the plan/agent-contract
  text, not something to infer here.
