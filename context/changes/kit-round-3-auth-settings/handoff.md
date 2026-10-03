# Handoff — `kit-round-3-auth-settings` (slice S-12)

Written by the `/10x-implement … phase 8` step (resume after stalled agents) of run `2026-10-02-kit-round-3`. All 8 phases are committed and green; `change.md` is `implemented`. The next agent must not miss that the [visual] row 8.6 (all listed states, 1280 + ~400 px) is still undone and is a separate step.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/kit-round-3-auth-settings`, cut from `main` at `60e92e1` (after S-13) |
| Commits | 24 on the branch; this step: WIP `e804e59` reviewed and kept, p8 `feat(…): Gap register, seam sweep and visual gate (p8)` (8546343), epilogue `chore(…): close out plan (epilogue)` (32ab4bf), this handoff |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implemented` |
| `## Progress` rows remaining | 10 (`grep -c '^- \[ \]' plan.md`), all [reviewer]/[visual]/[human] |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `context/foundation/design-kit.md` | round-3 table: K11/K13/K14/K15/G20/G23/G24/G32/G37 rows name S-12 (from WIP `e804e59`, kept); G37 status cleaned to `delivered`; K32 note; K34 moved after K33, status `open (do autora, runda 4)`; „Do rundy 4” item 7 marks G37 closed, new item 10 K34 |
| `context/changes/kit-round-3-auth-settings/follow-ups/review-fixes.md` | new: F1 `field-styles.ts` `field` radius (Trigger: S-14), F2 `DialogContent` padding/radius (Trigger: S-14), „Resolved in S-12” for archived durable-pattern-decisions F8 and S-04 F11 `FormField`/dialog part |
| `src/pages/login.astro` | stale `G24:` comment on `deleted` rewritten to round 3 (`login-deleted.html`, `settings.deletedNotice`) |
| `src/components/settings/DeleteAccountDialog.tsx` | round-3 header comment above `CONFIRM_ID` |
| `plan.md`, `change.md` | rows 8.1–8.5 ticked with `8546343`; status `implemented` |

## 3. Verification

| Command | Result |
| --- | --- |
| unused-key grep (each `copyExtra.auth`/`settings` key needs a `\.<key>\b` reader in `src` outside `copy.ts`) | `unused=0` |
| seam grep `copyExtra.(app\|landing\|howItWorks\|forWho)`, `deletedLogin` | empty |
| seam grep `demoLocked`, `DESIGN-GAP: G32` | hits only outside the slice: `ImportWizard` prop `demoLocked` (S-13), G32 comments in `ThresholdEditor`/`PatternActionsDialog` (S-14, follow-up F1) — decision 27 |
| `git diff --stat main -- design/ src/styles/brand.css` | empty |
| `npm run lint` | 0 errors (baseline 0) |
| `npx astro check` | 0 errors, 0 warnings, 3 hints |
| `npm run fixture:check` | ing OK, santander OK |
| `npm test` | 354 passed / 23 files (run baseline 352, +2; Δ0 vs P7) |
| `npm run build` | OK |
| `npx supabase db reset` + `test db` | Files=6, Tests=119 PASS (Δ0) |
| `npm run smoke` (port 4398) | 184 PASS / 0 FAIL (run baseline 166, +18; Δ0 vs P7); server killed |
| Break | re-added `copyExtra.settings.demoLocked` → grep printed `UNUSED copyExtra.settings.demoLocked`, `unused=1`; restored by `git checkout`, `unused=0`. Meta-check: proves the grep catches a key with no reader (the `ImportWizard` `demoLocked` prop is not a `.demoLocked` access, so it cannot mask it); it is a grep guard, not a test. The sed also inserted the key in `copyExtra.patterns` (not scanned); both reverted by the same checkout |

## 4. Next command

`/10x-impl-review kit-round-3-auth-settings`

## 5. Open

- Manual rows, as a checklist:
  - [ ] [reviewer] rows 1.6, 2.6, 3.7, 4.5, 5.7, 6.6, 7.8, 8.7 (8.7: seam sweep, register vs plan, follow-ups `Trigger:` lines)
  - [ ] [visual] 8.6 — every state listed in plan Phase 8 Manual Verification, 1280 + ~400 px on :4399, incl. `max-h` check of the import delete dialog and the pattern-actions dialog with the merge picker
  - [ ] [human] 8.8: accept header sign-out removal, collapsed password form (JS-only), dialog closed on error, short demo strip text, redirect `/` vs PRD, longer deleted notice; send K34 to the kit author
- Follow-ups: `follow-ups/review-fixes.md` F1, F2 (both `Trigger: S-14`); anything the visual gate defers goes there too.
- Known risks as in plan § Known risks (password form needs JS; same alert for `current-password` / `delete-password`).
- Invariants: never `npm run format`, never stage `design/**` or `src/styles/brand.css`, never touch `checkOrigin`.
- Roadmap item S-12 not flipped (orchestrator owns roadmap).

## 6. Autonomous decisions


1. **Implemented in this context, no subagent; commit message approved as proposed.** Why: contract forbids questions; the phase was small. Would change: a phase touching many files.
2. **Strip dot as an inline `span` (`size-[7px] rounded-full bg-green`) directly before the text instead of a CSS `:before`.** Rejected: a global stylesheet rule. Why: Tailwind-only, kit dimensions kept. Would change: the visual gate showing misalignment.
3. **`main` padding switches via `class:list` (`pt-[26px]` vs `pt-[35px]`) rather than a sibling selector.** Why: the strip is not a DOM sibling of `main`. Would change: a layout refactor.
4. **Smoke delta +3 as in the plan's Smoke contract (row text says "+ 6" for the full gate, read as total of the steps listed; there are 3).** Would change: the orchestrator expecting 175.
5. **Used `eslint --fix` on touched files only, not `npm run format`.** Would change: a repo-wide format policy.
6. **`SettingsRow` got an optional `class` prop for the logout row's top border instead of a new component.** Rejected: a global `.logout-row` rule. Why: Tailwind-only, one prop. Would change: the visual gate showing a doubled line.
7. **Dialog `serverError` kept in P3, fed from `settings.passwordInvalid/deleteError/demoDeleteBlocked`.** Why: plan says the dialog keeps its error until P5. Would change: nothing.
8. **Kit-contract test +1 `it` case (all keys in one loop), smoke +4 as in plan.** Would change: the orchestrator expecting a per-key count.
9. **Island renders the whole password row (not just its value) because the form must span the row below it; classes mirrored from `SettingsRow`.** Rejected: island inside `SettingsRow` (form would sit in the grid cell). Would change: the visual gate showing misalignment.
10. **Submit uses `size="default"` in cancel mode (kit `.form-actions` buttons are content-width), full width otherwise.** Would change: kit showing full-width.
11. **Commit message approved as proposed; implemented in this context.** Would change: nothing.
12. **Dialog error alerts live only on the page; dialog opens closed (`useState(false)`), `serverError` and the G24 comment removed.** Why: plan P5. Would change: nothing.
13. **Help line `aria-describedby` is added only while the help `<p>` is rendered (`showHelp`); input margin switches `mb-2`/`mb-4` with it.** Rejected: always-present id. Why: no dangling reference in demo/unlocked state. Would change: the visual gate showing a spacing jump.
14. **In demo the button is locked regardless (`locked = demo || …`), help hidden, `InfoAlert` after the button; the `USUŃ` input stays enabled per the plan.** Would change: kit showing it disabled.
15. **`FormField` disabled style `disabled:opacity-60 disabled:cursor-not-allowed` (kit gives no disabled field style; Tailwind-only, no DESIGN-GAP row).** Would change: the reviewer wanting a gap row.
16. **Deliberate break B removed the whole `.refine` (to `() => true`) rather than only the word.** Meta-check: the red cascade (10 FAIL) is the broken delete actually deleting the smoke user, subsequent steps losing their session; the targeted step `delete without confirm word is rejected` is red. Restored by `git checkout`, `db reset` run. Would change: nothing.
17. **Smoke +3 (177 → 180), not +14: the +14 in row 5.6 is the plan's cumulative total from the run baseline 166 (166+14=180).** Would change: the orchestrator expecting a different count.
18. **Implemented in this context, commit message as proposed; ran only `eslint --fix` on touched files.** Would change: nothing.
19. **Kept `copyExtra.auth.{registerVisual,resetVisual,passwordPlaceholder}`** because `confirm-email.astro` / `reset/new.astro` still read them (plan: remove in P7); `reset.astro` itself now reads kit `copy.auth.resetVisual` (identical text). Would change: P7 scope.
20. **Deliberate break needed a live smoke run (two runs: first output truncated by my grep, rerun captured the red).** Would change: nothing.
21. **Smoke +1 (180 → 181) = plan's +15 from run baseline 166; no kit-contract unit cases added (plan assigns them to P7 row 7.1).** Would change: the orchestrator expecting a unit delta now.
22. **Implemented in this context, commit message as proposed; ran only `eslint --fix` on touched files.** Would change: nothing.
23. **`register.astro` rebound to `copy.auth.registerVisual` (kit, identical text) because removing the `copyExtra` key broke `astro check`; handoff P6 had listed only `confirm-email` as its reader.** Would change: nothing.
24. **Row 7.3 ticked on the intent (no copy key or G37 comment left), not on the literal grep, which also hits the unrelated `ImportWizard` `demoLocked` prop and `NewPasswordForm` `passwordsDiffer` label.** Would change: the reviewer wanting those renamed.
25. **Smoke +3 (181 -> 184) = plan's +18 from run baseline 166; the expired step asserts the lead node too, as an array `contains`.** Would change: the orchestrator expecting a different count.
26. **Kept the WIP `e804e59` register rows (they match the Phase 8 contract); fixed only K34 position/status, the G37 status cell and the „Do rundy 4” list.** Rejected: redoing the rows. Would change: the reviewer finding a row that contradicts the plan.
27. **Row 8.2 ticked on intent: the remaining `demoLocked` / `DESIGN-GAP: G32` hits are in S-13/S-14 files (an `ImportWizard` prop; pattern-view field comments tracked by follow-up F1), not slice seams.** Rejected: renaming S-13's prop or removing S-14's gap comments (out of scope, one view per slice). Would change: the reviewer reading the plan grep as repo-wide literal.
28. **Implemented in this context, no subagent; commit and epilogue messages as proposed; manual-confirmation gate skipped per contract (manual rows left open).** Would change: nothing.
29. **The unused-key grep lives only in this step's scratch (`$TMPDIR/unused.sh`), not in the repo** — plan asks for a scripted grep as a phase criterion, not a CI guard. Would change: the reviewer wanting it in `kit-contract.test.ts`.
