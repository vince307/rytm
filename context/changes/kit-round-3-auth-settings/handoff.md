# Handoff — `kit-round-3-auth-settings` (slice S-12)

Written by the `/10x-implement … phase 4` step of run `2026-10-02-kit-round-3`. Phases 1–4 are committed and green. The next agent must not miss that the password form is now collapsed in `SettingsPasswordRow`, and that `copyExtra.settings` still holds `currentPassword`, `deleteError`, `deleting`, `close` and the dialog copy for `DeleteAccountDialog` (rebound in P5), and `demoLocked` for `reset/new.astro` (P7); no existing smoke assertion may be edited.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/kit-round-3-auth-settings`, cut from `main` at `60e92e1` (after S-13) |
| Commits | 12 on the branch: identity, research, plan, plan review, p1 (464bfef), p1 handoff, p2 (b10c8d9), p2 handoff, p3 (42430cc), p3 handoff, p4 `feat(…): Collapsed password form (p4)` (4688697), this handoff |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | 33 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `src/components/settings/SettingsPasswordRow.tsx` | new island: masked „••••••••” + ghost „Zmień hasło” (`aria-expanded`/`aria-controls`), form below, closed by default |
| `src/components/auth/NewPasswordForm.tsx` | optional `cancel` prop (ghost „Anuluj” next to submit); `/reset/new` unchanged |
| `src/pages/settings.astro` | password row replaced by the island |
| `src/content/copy.ts` | `copyExtra.settings.savePassword`, `cancel` |
| `scripts/smoke.mjs` | +1 step `settings password form starts closed` |
| `plan.md`, `handoff.md` | Progress rows 4.1–4.4 ticked with SHA |

## 3. Verification

| Command | Result |
| --- | --- |
| `npm run lint` | 0 errors (baseline 0) |
| `npx astro check` | 0 errors, 3 hints (157 files) |
| `npm run fixture:check` | ing OK, santander OK |
| `npm test` | 353 passed / 23 files (baseline 352, +1 from P3, P4 Δ0) |
| `npm run build` | OK |
| `npx supabase db reset` + `test db` | Files=6, Tests=119 PASS (Δ0) |
| `npm run smoke` (port 4398) | 177 PASS / 0 FAIL (post-p3 176, +1; run baseline 166) |
| Deliberate break | initial open state `true`: only `settings password form starts closed` red; restored via `git checkout`, green. Meta-check: proves the default state only; open/cancel/aria-expanded are client-side (visual row 8.6, reviewer 4.5) |

## 4. Next command

`/10x-implement kit-round-3-auth-settings phase 5`

## 5. Open

- Manual rows, as a checklist:
  - [ ] [reviewer] rows 1.6, 2.6, 3.7, 4.5, 5.7, 6.6, 7.8, 8.7 (3.7: one alert per param; demo refusals `info`, errors `error`; logout is a plain POST — `src/pages/settings.astro` `notice`)
  - [ ] [visual] 8.6 (all states, desktop + ~400 px, incl. pattern-actions dialog `max-h`)
  - [ ] [human] 8.8: accept header sign-out removal, collapsed password form, dialog closing on error, short demo strip text, redirect `/` vs PRD, longer deleted notice; send K34 to the kit author
- The island duplicates `SettingsRow.astro` grid classes (Astro component cannot render in React); keep them in sync if the row changes.
- Until P5 the delete error shows twice (page alert + dialog `serverError`) — intermediate, as planned.
- Danger-panel row: the „Sesja” row has `border-t border-line`; the preceding row's bottom border also draws (kit does the same with `!important` bottom 0 only on the logout row itself) — check in the visual gate.
- Roadmap item S-12 not flipped to `in-progress` (orchestrator owns roadmap).
- Follow-ups for P8 in `follow-ups/review-fixes.md` as in plan; known risks as in plan § Known risks.
- Invariants: never `npm run format`, never stage `design/**` or `src/styles/brand.css`, never touch `checkOrigin`.
- No `DESIGN-GAP` added.

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
