# Handoff — `kit-round-3-auth-settings` (slice S-12)

Written by the `/10x-plan` step of run `2026-10-02-kit-round-3`. `plan.md` (8 phases, 52 Progress rows) and
`plan-brief.md` are on disk; no code was touched. The reviewer must not miss that the header „Wyjdź” is removed in
Phase 3 together with the new „Sesja” sign-out row (never split them), and that dialog/toggle client states are
provable only by the visual gate.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/kit-round-3-auth-settings`, cut from `main` at `60e92e1` (after S-13) |
| Commits | 3 on the branch after this step: change identity, research, `docs(kit-round-3-auth-settings): plan` |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `planned` (set by `metadata-guard.mjs mark-planned`) |
| `## Progress` rows remaining | 52 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the commit (5 files staged by explicit path) |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `context/changes/kit-round-3-auth-settings/plan.md` | Implementation plan: 8 phases, Critical Implementation Details, 15 autonomous decisions, `## Progress` |
| `context/changes/kit-round-3-auth-settings/plan-brief.md` | Two-page brief |
| `context/changes/kit-round-3-auth-settings/change.md` | Frontmatter `status: preparing` → `planned` |
| `context/foundation/roadmap.md` | S-12 status `pending` → `planning` (At a glance row + body), `updated` 2026-10-03 |
| `context/changes/kit-round-3-auth-settings/handoff.md` | This file |

## 3. Verification

| Command | Result |
| --- | --- |
| `git branch --show-current` | `feat/kit-round-3-auth-settings` |
| Success Criteria ↔ Progress mapping (python count per phase) | 1:1 for all 8 phases (6/6/7/5/7/6/7/8) |
| `metadata-guard.mjs inspect` / `mark-planned` | OK, `changed: true` |
| `node -e` read of `content.json` `settings`/`authStates`/`confirmEmail`/`footer`/`resetNew`/`app.demoNotice` | Every key the plan binds exists; K32 pairs byte-identical; `settings.deleteCurrentPassword`/`logoutDecision`/`deleteSuccess` unrendered (→ K34) |
| `grep` of `design-kit.md` ids | Last K = `K33`, last G = `G38` → new row `K34` |
| `grep` of `scripts/smoke.mjs` | `delete without confirm word is rejected` exists (P5 break target); signout `/` pinned ×3; `>Dla kogo<` also in header (footer needle must be footer-only) |
| lint / astro check / vitest / build / pgTAP / smoke | **Not run**: docs-only step. Baseline inherited from the contract, unverified here: `main` `60e92e1` lint 0, astro check 0 (155 files), vitest 352, pgTAP 119, smoke 166/0 |

## 4. Next command

`/10x-plan-review kit-round-3-auth-settings`

## 5. Open

- Phases (each a fresh implement agent, ≤ 1 new UI component):
  - P1 public pages + header/footer (smoke +3).
  - P2 `DemoNotice.astro` in `AppLayout` (+3).
  - P3 settings copy, page alerts, „Sesja” row, header „Wyjdź” removed, danger `border-line` (+4).
  - P4 `SettingsPasswordRow.tsx` toggle (+1).
  - P5 delete dialog: help line, demo state, closed on error, `DialogContent` max-height (+3).
  - P6 login/register/reset + `FormField` paper/8 px (+1).
  - P7 confirm-email/reset-new panels, expired layout, countdown, G37 closed (+2).
  - P8 register K34, follow-ups, seam sweep, visual gate. Net smoke +17.
- Manual rows, as a checklist:
  - [ ] [reviewer] rows 1.6, 2.6, 3.7, 4.5, 5.7, 6.6, 7.7, 8.7
  - [ ] [visual] 8.6 (every state listed in Phase 8, desktop + ~400 px)
  - [ ] [human] 8.8: accept the header sign-out removal, collapsed password form, dialog closing on error, short demo
    strip text, redirect `/` vs PRD `## Access Control`, longer deleted notice; send K34 to the kit author
- Follow-ups P8 will file in `follow-ups/review-fixes.md`: `field-styles.ts` `field` → 8 px/paper (`Trigger: S-14`),
  `DialogContent` kit padding/mobile radius (`Trigger: S-14`).
- Known risks: `settings fills the password minimum` matches serialized props only once the form is collapsed; P3
  shows a delete error twice until P5 (intermediate).
- Invariants: never `npm run format`, never stage `design/**` or `src/styles/brand.css`, never touch `checkOrigin`.
- No `DESIGN-GAP` added in this step.

## 6. Autonomous decisions

Full table: `plan.md` § Autonomous decisions (15 rows). Headlines:

1. **MEDIUM complexity, 0 questions.** Research recommended an answer for every open choice. Would change: a product
   owner being available.
2. **Kit password toggle, closed by default.** Rejected: always open. Would change: maintainer reversing via 8.8.
3. **Header „Wyjdź” removed in the same phase as the „Sesja” row.** Rejected: keeping both, or removing it in P2.
   Why: C2, and no commit without sign-out. Would change: maintainer finding sign-out too hidden.
4. **Delete dialog stays closed on a server error; one page alert for every outcome.** Rejected: reopening (today).
   Would change: reviewer requiring retry inside the dialog.
5. **Demo strip = `app.demoNotice`.** Rejected: the `app.js` literal. Would change: kit author fixing it (K34).
6. **Sign-out redirect `/` unchanged.** Rejected: `/login`. Would change: maintainer resolving the PRD Access Control
   tension toward `/login`.
7. **No decision departs from the PRD's literal text.** The PRD is silent on these surfaces. Product-visible choices
   sit on `[human]` row 8.8.
8. **Roadmap sync committed with the plan.** The skill leaves it for the first implement commit, but the run contract
   requires a clean tree after each step. Would change: the orchestrator preferring the skill's default.
