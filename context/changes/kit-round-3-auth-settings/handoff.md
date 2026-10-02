# Handoff — `kit-round-3-auth-settings` (slice S-12)

Written by the `/10x-implement … phase 2` step of run `2026-10-02-kit-round-3`. Phases 1 and 2 are committed and green. The next agent must not miss that the header „Wyjdź” (`copyExtra.app.exit`) is removed in Phase 3 together with the new „Sesja” sign-out row (never split them), and that no existing smoke assertion may be edited.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/kit-round-3-auth-settings`, cut from `main` at `60e92e1` (after S-13) |
| Commits | 8 on the branch: identity, research, plan, plan review, p1 (464bfef), p1 handoff, p2 `feat(…): Demo strip in the app shell (p2)` (b10c8d9), this handoff |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | 43 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `src/components/app/DemoNotice.astro` | new kit `.demo-notice` strip (paper-soft, line border, green dot, text prop) |
| `src/layouts/AppLayout.astro` | `demo = isDemoEmail(user.email, DEMO_EMAIL)`; renders `DemoNotice` with `copy.app.demoNotice`; `main` top padding 26 px when shown, else 35 px |
| `src/components/app/Sidebar.astro`, `MobileNav.astro` | read `copy.app.*` (`settings` replaces `settingsLong`) |
| `src/content/copy.ts` | `copyExtra.app` now only `exit` (removed sidebarView, sidebarData, patternsLong, fixedLong, importsLong, settingsLong, overview, navLabel) |
| `scripts/smoke.mjs` | +3 steps: `demo home shows the demo note`, `demo settings shows the demo note`, `home has no demo note for the test user` |
| `plan.md`, `change.md`, `handoff.md` | Progress rows 2.1–2.5 ticked with SHA |

## 3. Verification

| Command | Result |
| --- | --- |
| `npm run lint` | 0 errors (baseline 0) |
| `npx astro check` | 0 errors, 3 hints |
| `npm run fixture:check` | ing OK, santander OK |
| `npm test` | 352 passed / 23 files (baseline 352, Δ0) |
| `npm run build` | OK |
| `npx supabase db reset` + `test db` | Files=6, Tests=119 PASS (baseline 119, Δ0) |
| `npm run smoke` (port 4398) | 172 PASS / 0 FAIL (post-p1 169, +3; run baseline 166) |
| grep `settingsLong\|sidebarView\|navLabel` in copy.ts | empty |
| Deliberate break | `demo` hard-coded `false`: both demo-note steps red (only those). `true`: `home has no demo note for the test user` red (only). Restored via `git checkout`, smoke green again. Meta-check: the server-guard demo steps (password/delete/import refusals) stayed green in both breaks, so the new steps prove the shell gating only. A first sed attempt failed to apply (no break), redone with a regex script |

## 4. Next command

`/10x-implement kit-round-3-auth-settings phase 3`

## 5. Open

- Manual rows, as a checklist:
  - [ ] [reviewer] rows 1.6, 2.6, 3.7, 4.5, 5.7, 6.6, 7.8, 8.7 (2.6: `DemoNotice` uses only Tailwind color names; no clash with the import pages' own demo notes — `src/pages/imports/{index,new}.astro` still render their own demo note)
  - [ ] [visual] 8.6 (all states, desktop + ~400 px, incl. pattern-actions dialog `max-h`)
  - [ ] [human] 8.8: accept header sign-out removal, collapsed password form, dialog closing on error, short demo strip text, redirect `/` vs PRD, longer deleted notice; send K34 to the kit author
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
