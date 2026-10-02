# Handoff — `kit-round-3-imports` (slice S-13)

Written by the `/10x-implement … phase 5` step. Phase 5 is committed (`63e0da2`) and green; `change.md` is
`implementing`. The one thing the next agent must not get wrong: Phase 6 owns the gap register (G37 is now resolved by kit key `importFlow.demoImportBlocked`; K33 step-3 demo note is unreachable and must be recorded, not built) and the `[visual]`/`[human]` rows are not agent-tickable.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/kit-round-3-imports`, cut from `main` at `2a8f89d` (F-04 merged) |
| Commits | `6e369ff` identity, `8720f42` research, `60f4fae` plan, `ef3aee2` plan review, `bf10335` P1, `47b2c55` handoff p1, `2cc8922` P2, `a80964a` handoff p2, `621f36e` P3, `0bd76b6` handoff p3, `623db9e` P4, `a8d9098` handoff p4, `63e0da2` P5, + this handoff/Progress-SHA commit |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | 13 of 40 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `src/pages/imports/new.astro` | computes `demoLocked` = `isDemoEmail(...) && !demoImportAllowed(error ? 1 : existing.length)` (fail closed on a read error); passes `demoLocked` and `flow.demoImportBlocked` to the wizard |
| `src/components/imports/ImportWizard.tsx` | new prop `demoLocked`; step 1 shows `InfoAlert` above the drop zone, "Wybierz plik" disabled, `handleFile` returns early (blocks picker and drop); `pageError.kind === "demo"` renders `flow.demoImportBlocked`, or nothing when `demoLocked` (sentence shown once) |
| `src/content/copy.ts` | removed `copyExtra.imports.demoLocked` (G37 comment gone); settings' own `demoLocked` untouched |
| `scripts/smoke.mjs` | +2: "demo import wizard shows the demo note" (after demo first import), "test user import wizard has no demo note" (`notContains`), both on the rendered node `>...<` |
| `context/changes/kit-round-3-imports/plan.md`, `handoff.md` | Progress 5.1-5.4 ticked with SHA; this file |

## 3. Verification

| Command | Result (observed this step) |
| --- | --- |
| `npm run lint` | 0 errors (baseline 0) |
| `npx astro check` | 0 errors, 3 hints (baseline 0 errors) |
| `npm run fixture:check` | ing OK, santander OK |
| `npm test` | 351 passed / 23 files (baseline 347 / 22, +4 vs baseline; delta vs P4 = 0) |
| `npm run build` | OK |
| `npx supabase db reset && npx supabase test db` | Files=6, Tests=119, PASS (Δ0) |
| `npm run smoke` (port 4398) | fresh `db reset`: All smoke steps passed (demo first import accepted); second run 166 PASS / 0 FAIL (baseline 157, +9; P4 164, +2) |
| grep `x.demoLocked` in `src` | only `src/pages/settings.astro` (settings' own key) |
| Break 1: `demoLocked` hard-coded `false` | "demo import wizard shows the demo note" FAIL; restored |
| Break 2: `demoLocked` hard-coded `true` | "test user import wizard has no demo note" FAIL; restored; final smoke green |
| First break attempt | my regex did not match the single-line declaration, so nothing changed and the suite stayed green (meta-check caught it); redone with `sed` on the line |
| Meta-check | "demo second import is refused" and "demo import undo is refused" stayed PASS in both breaks, so the new steps prove the page gating, not the server guard |
| End state | dev server on 4398 killed; `db reset` + pgTAP PASS run after the breaks |

## 4. Next command

`/10x-implement kit-round-3-imports phase 6`

## 5. Open

- **Manual-only rows (human checklist):** [reviewer] 1.7, 2.7, 3.7, 4.6, 5.5, 6.7; [visual] 6.6; [human] 6.8.
- **DESIGN-GAP:** none added in P5. G37 (`copyExtra.imports.demoLocked`) is retired; P6 must update its status row in `context/foundation/design-kit.md`. Kit step-3 demo note (K33) is not built: with picker and drop blocked, a locked demo user cannot reach step 3 — P6 records it.
- **Not exercised:** drag and drop block in a browser (code path is `handleFile` early return; no unit/smoke harness for it) — [reviewer] 5.5.
- **Roadmap:** S-13 row in `context/foundation/roadmap.md` untouched (orchestrator-owned).
- **Risks:** `plan.md` `## Known risks`: `ImportWizard` `submitting` has no bfcache reset; P6 visual gate decides.
- **Follow-ups:** none; `follow-ups/review-fixes.md` not created.

## 6. Autonomous decisions

1. **Execution mode: implemented in this context, not delegated.**
   - Why: one fresh agent per step; no human to ask.
   - Would change: a phase too large for the ~300k budget.
2. **Skipped the manual-confirmation gate and commit-message prompt; used the plan's phase title.**
   - Why: contract rule 1; `[reviewer]` row 5.5 left unticked.
   - Would change: a maintainer present to confirm.
3. **Drag and drop is blocked inside `handleFile` (`demoLocked` early return) rather than a separate `onDrop` guard.**
   - Why: one choke point covers picker, drop and any future caller.
   - Would change: needing a drop-zone visual state for the locked case (kit has none).
4. **When `demoLocked` and `?error=demo` coincide, `ServerError` gets no message (the InfoAlert carries the sentence once).**
   - Rejected: showing it twice.
   - Would change: a kit state that shows both.
5. **`demoImportBlocked` handed to the wizard through `labels.flow` (added to the `Pick` union), not a new prop.**
   - Would change: the label moving out of `importFlow`.
6. **Smoke demo step placed after "demo first import is accepted (or already present)"**, so the account has an import whether this run created it or an earlier one did.
   - Would change: the demo seed shipping with an import (then the step would not depend on order).
7. **Prettier run on the touched files only.**
