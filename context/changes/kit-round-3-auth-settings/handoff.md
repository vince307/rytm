# Handoff — `kit-round-3-auth-settings` (slice S-12)

Written by the `/10x-implement … phase 3` step of run `2026-10-02-kit-round-3`. Phases 1–3 are committed and green. The next agent must not miss that `copyExtra.settings` still holds `currentPassword`, `deleteError`, `deleting`, `close` and the dialog copy for `DeleteAccountDialog` (rebound in P5), and `demoLocked` for `reset/new.astro` (P7); no existing smoke assertion may be edited.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/kit-round-3-auth-settings`, cut from `main` at `60e92e1` (after S-13) |
| Commits | 10 on the branch: identity, research, plan, plan review, p1 (464bfef), p1 handoff, p2 (b10c8d9), p2 handoff, p3 `feat(…): Settings copy, result alerts and the sign-out row (p3)` (42430cc), this handoff |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | 37 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `src/pages/settings.astro` | reads `settings.*`, `auth.fields`, `authStates`; one `notice` per request via `InlineAlert` (success / error / info); new „Sesja” row with POST sign-out form; no DESIGN-GAP header |
| `src/components/app/AppHeader.astro` | sign-out form removed (brand + month only) |
| `src/components/app/Panel.astro` | danger variant `border-line` |
| `src/components/app/SettingsRow.astro` | optional `class` prop |
| `src/content/copy.ts` | `copyExtra.app` deleted; `copyExtra.settings` trimmed, `session` „Sesja” added |
| `test/unit/kit-contract.test.ts` | +1 case: `settings.*` keys read on `/settings`, `deleteConfirm` contains `DELETE_CONFIRM_WORD` |
| `scripts/smoke.mjs` | +4 steps: `settings offers sign-out`, `home header has no exit button`, `settings shows the save error`, `settings shows the demo password refusal` |
| `plan.md`, `handoff.md` | Progress rows 3.1–3.6 ticked with SHA |

## 3. Verification

| Command | Result |
| --- | --- |
| `npm run lint` | 0 errors (baseline 0) |
| `npx astro check` | 0 errors, 3 hints (156 files) |
| `npm run fixture:check` | ing OK, santander OK |
| `npm test` | 353 passed / 23 files (baseline 352, +1) |
| `npm run build` | OK |
| `npx supabase db reset` + `test db` | Files=6, Tests=119 PASS (baseline 119, Δ0) |
| `npm run smoke` (port 4398) | 176 PASS / 0 FAIL (post-p2 172, +4; run baseline 166) |
| grep `DESIGN-GAP` in settings.astro; grep `copyExtra.app` in src | both empty |
| Deliberate break 1 | `error=password` mapped to `copyExtra.auth.resetNewError`: only `settings shows the save error` red; restored via `git checkout`, green |
| Deliberate break 2 | „Sesja” row removed: only `settings offers sign-out` red; restored, green. Meta-check: proves the button renders, not that it signs out; the three `signout …` steps (302 `/`) prove the POST |

## 4. Next command

`/10x-implement kit-round-3-auth-settings phase 4`

## 5. Open

- Manual rows, as a checklist:
  - [ ] [reviewer] rows 1.6, 2.6, 3.7, 4.5, 5.7, 6.6, 7.8, 8.7 (3.7: one alert per param; demo refusals `info`, errors `error`; logout is a plain POST — `src/pages/settings.astro` `notice`)
  - [ ] [visual] 8.6 (all states, desktop + ~400 px, incl. pattern-actions dialog `max-h`)
  - [ ] [human] 8.8: accept header sign-out removal, collapsed password form, dialog closing on error, short demo strip text, redirect `/` vs PRD, longer deleted notice; send K34 to the kit author
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
