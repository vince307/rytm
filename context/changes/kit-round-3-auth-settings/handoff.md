# Handoff — `kit-round-3-auth-settings` (slice S-12)

Written by the `/10x-implement … phase 7` step of run `2026-10-02-kit-round-3`. Phases 1–7 are committed and green. The next agent must not miss that phase 8 owns the gap register, the seam sweep and the visual gate, and that no existing smoke assertion may be edited.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/kit-round-3-auth-settings`, cut from `main` at `60e92e1` (after S-13) |
| Commits | 18 on the branch: identity, research, plan, plan review, p1–p6 with handoffs, p7 `feat(…): Confirm-email, reset/new and the resend countdown (p7)` (df93ec3), this handoff |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | 15 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `src/pages/confirm-email.astro` | own visual `copyExtra.auth.confirmEmailVisual`; passes `countdown={c.resendCountdown}` |
| `src/components/auth/ResendButton.tsx` | new `countdown` prop, renders the `{seconds}` template |
| `src/pages/reset/new.astro` | `resetNewVisual`; kit expired layout (eyebrow, h1, lead, alert, button); `?error=demo` -> `copy.settings.demoPasswordBlocked`; labels from `authStates.*`; placeholder from `copy.auth.passwordPlaceholder` |
| `src/pages/register.astro` | visual rebound to kit `copy.auth.registerVisual` (it still read the `copyExtra` copy) |
| `src/content/copy.ts` | added `copyExtra.auth.{confirmEmailVisual,resetNewVisual,expiredEyebrow,expiredLead,expiredAlert}`; removed `registerVisual`, `resetVisual`, `passwordPlaceholder`, `newPassword`, `repeatPassword`, `passwordsDiffer`, `settings.demoLocked` (+ G37 comment) |
| `test/unit/kit-contract.test.ts` | +1 `it` (resendCountdown `{seconds}`, authStates keys) |
| `scripts/smoke.mjs` | +3 steps: `reset/new expired shows the kit layout`, `confirm-email shows its own panel`, `confirm-email resent shows the kit countdown` |
| `plan.md`, `handoff.md` | Progress rows 7.1–7.7 ticked with SHA |

## 3. Verification

| Command | Result |
| --- | --- |
| `npm run lint` | 0 errors (baseline 0) |
| `npx astro check` | 0 errors, 3 hints (155 files baseline; 157 now) |
| `npm run fixture:check` | ing OK, santander OK |
| `npm test` | 354 passed / 23 files (P6 353, +1; run baseline 352, +2) |
| `npm run build` | OK |
| `npx supabase db reset` + `test db` | Files=6, Tests=119 PASS (Δ0) |
| `npm run smoke` (port 4398) | 184 PASS / 0 FAIL (P6 181, +3; run baseline 166, +18) |
| `grep G37 / settings.demoLocked / x.passwordsDiffer src` | empty (the plan's bare `demoLocked\|passwordsDiffer` grep also matches the unrelated `ImportWizard` prop `demoLocked` and the `NewPasswordForm` label `passwordsDiffer`, which are not copy keys) |
| Break 1 | kit-contract assertion pointed at `{n}`: new `it` red (1 failed), restored. Meta-check: proves the template key only, not `ResendButton` rendering |
| Break 2 | expired branch without `{x.expiredEyebrow}`: `reset/new expired shows the kit layout` FAIL, restored. Meta-check: the old `Ten link już wygasł.` step stays green, the new anchored step catches it |
| Break 3 | `ResendButton` back to `${label} (${left}s)`: `confirm-email resent shows the kit countdown` FAIL, restored. Meta-check: proves the SSR initial state; the tick-down is client-only (visual row) |
| After breaks | `git checkout` restored, `db reset` run, dev server on 4398 killed |

## 4. Next command

`/10x-implement kit-round-3-auth-settings phase 8`

## 5. Open

- Manual rows, as a checklist:
  - [ ] [reviewer] rows 1.6, 2.6, 3.7, 4.5, 5.7, 6.6, 7.8, 8.7 (7.8: `/reset/new?error=demo` shows `demoPasswordBlocked`; countdown reads „Wyślij ponownie za 60 s” at load on `?resent=1` and ticks down)
  - [ ] [visual] 8.6 (all states, desktop + ~400 px)
  - [ ] [human] 8.8: accept header sign-out removal, collapsed password form, dialog closed on error, short demo strip text, redirect `/` vs PRD, longer deleted notice; send K34 to the kit author
- DESIGN-GAP comments added in `copyExtra.auth` (K13 visuals, K11 expired strings); P8 owns the gap-register rows in `context/foundation/design-kit.md`.
- `copyExtra.auth.{newPassword,repeatPassword,passwordsDiffer}` are gone; `NewPasswordForm` still takes a `passwordsDiffer` label, now fed `authStates.passwordMismatch` on both pages.
- Follow-ups for P8 in `follow-ups/review-fixes.md` as in plan; known risks as in plan § Known risks.
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
