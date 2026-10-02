# Handoff — `kit-round-3-auth-settings` (slice S-12)

Written by the `/10x-implement … phase 6` step of run `2026-10-02-kit-round-3`. Phases 1–6 are committed and green. The next agent must not miss that `copyExtra.auth` still holds `registerVisual`, `resetVisual` and `passwordPlaceholder` (read by `confirm-email.astro` / `reset/new.astro`, remove in P7 once unread) and `copyExtra.settings.demoLocked` (P7); no existing smoke assertion may be edited.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/kit-round-3-auth-settings`, cut from `main` at `60e92e1` (after S-13) |
| Commits | 16 on the branch: identity, research, plan, plan review, p1–p5 with handoffs, p6 `feat(…): Login, register, reset and field styling (p6)` (40d78f6), this handoff |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | 21 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `src/pages/login.astro`, `register.astro`, `reset.astro` | rebound to `copy.auth.*` (visual, placeholders, links, terms, optional) and `copy.confirmEmail.{eyebrow,title}`; `?deleted=1` reads `copy.settings.deletedNotice` |
| `src/components/auth/FormField.tsx` | input `rounded-[8px] bg-paper` |
| `src/content/copy.ts` | removed from `copyExtra.auth`: `loginVisual`, `optional`, `namePlaceholder`, `emailPlaceholder`, `forgotPassword`, `terms`, `noAccount`, `createIt`, `haveAccount`, `resetEyebrow`, `sendInstructions`, `backToLogin`, `checkInboxEyebrow/Title`, `deletedLogin` (+ G24 comment) |
| `scripts/smoke.mjs` | +1 step `login shows the full deleted notice` (anchored `>…<`) |
| `plan.md`, `handoff.md` | Progress rows 6.1–6.5 ticked with SHA |

## 3. Verification

| Command | Result |
| --- | --- |
| `npm run lint` | 0 errors (baseline 0) |
| `npx astro check` | 0 errors, 3 hints |
| `npm run fixture:check` | ing OK, santander OK |
| `npm test` | 353 passed / 23 files (P5 count 353, Δ0; run baseline 352) |
| `npm run build` | OK |
| `npx supabase db reset` + `test db` | Files=6, Tests=119 PASS (Δ0) |
| `npm run smoke` (port 4398) | 181 PASS / 0 FAIL (P5 180, +1; run baseline 166, +15) |
| `grep "bg-white\|rounded-lg" FormField.tsx` | empty |
| Deliberate break | `login.astro` `?deleted=1` mapped to `settings.deleteSuccess`: `login shows the full deleted notice` FAIL, old `login shows the deleted state` PASS; restored with `git checkout`, `db reset`, full gate green. Meta-check: shows the old substring step cannot detect this rebind; the new anchored step does |

## 4. Next command

`/10x-implement kit-round-3-auth-settings phase 7`

## 5. Open

- Manual rows, as a checklist:
  - [ ] [reviewer] rows 1.6, 2.6, 3.7, 4.5, 5.7, 6.6, 7.8, 8.7 (6.6: login/register/reset read only `copy.*` plus K11 keys; no other `bg-white` field in the slice's components — note `src/components/settings/*` and `NewPasswordForm` use `FormField`)
  - [ ] [visual] 8.6 (all states, desktop + ~400 px)
  - [ ] [human] 8.8: accept header sign-out removal, collapsed password form, dialog closed on error, short demo strip text, redirect `/` vs PRD, longer deleted notice; send K34 to the kit author
- P7 owns removal of `copyExtra.auth.{registerVisual,resetVisual,passwordPlaceholder}` once `confirm-email.astro` and `reset/new.astro` read kit keys, and `settings.demoLocked`.
- `/settings` reads `copy.auth.passwordPlaceholder` (kit key, not `copyExtra`).
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
