# Handoff — `kit-round-3-auth-settings` (slice S-12)

Written by the `/10x-plan-review` step of run `2026-10-02-kit-round-3`. Verdict PROCEED; 0 critical, 2 warnings and
4 observations are all triaged into `plan.md` (now 53 Progress rows, smoke net +18). The next agent must not miss
that the header „Wyjdź” is removed in Phase 3 together with the new „Sesja” sign-out row (never split them), and that
no existing smoke assertion may be edited.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/kit-round-3-auth-settings`, cut from `main` at `60e92e1` (after S-13) |
| Commits | 4 on the branch after this step: change identity, research, plan, `docs(kit-round-3-auth-settings): plan review` |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` |
| `## Progress` rows remaining | 53 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the commit (5 files staged by explicit path) |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `context/changes/kit-round-3-auth-settings/reviews/plan-review.md` | Plan review report: grounding, code-checked claims, follow-up and PRD scrutiny, F1–F6 with decisions, VERDICT |
| `context/changes/kit-round-3-auth-settings/plan.md` | Triage edits: P5 rebinds dialog placeholder/confirm line (F2); P7 smoke +3 with SSR countdown step and new break row 7.6 (F1); gates +18; Known risks: JS-only password form (F3), shared wrong-password alert (F4), pattern-actions dialog in the `max-h` check (F5); P8 follow-ups item (c) (F6); `[human]` 8.8 text |
| `context/changes/kit-round-3-auth-settings/plan-brief.md` | Smoke count +17 → +18 |
| `context/changes/kit-round-3-auth-settings/change.md` | `status: planned` → `plan_reviewed` |
| `context/changes/kit-round-3-auth-settings/handoff.md` | This file |

## 3. Verification

| Command | Result |
| --- | --- |
| `git branch --show-current` | `feat/kit-round-3-auth-settings` |
| `ls -l` of 13 plan paths | all exist |
| `node -e` read of 30 content.json keys the plan binds | all exist with the plan's text (`RESEND_COOLDOWN_SECONDS` = 60, `resendCountdown` has `{seconds}`) |
| Built `_render.func` `InlineAlert` template | `<span …>${slot}</span>` — `>text<` needles valid for page alerts |
| `grep` of `scripts/smoke.mjs` | signout steps POST directly (`location: "/"` ×3); delete guards POST directly; cookie jar present (enables F1's step) |
| `grep` of `FormField` / `DialogContent` / `Panel variant="danger"` users | blast radius as the plan states (FormField not used by `field-styles.ts`; danger Panel only on `/settings`; 3 dialogs, no non-portaled overflow child) |
| Progress ↔ Success Criteria (python count per phase) | 1:1: 6/6/7/5/7/6/8/8 = 53 |
| lint / astro check / vitest / build / pgTAP / smoke | **Not run**: docs-only step. Baseline inherited from the contract, unverified here: `main` `60e92e1` lint 0, astro check 0 (155 files), vitest 352, pgTAP 119, smoke 166/0 |

## 4. Next command

`/10x-implement kit-round-3-auth-settings phase 1`

## 5. Open

- Phases (each a fresh implement agent, ≤ 1 new UI component): P1 public pages + header/footer (smoke +3); P2
  `DemoNotice.astro` in `AppLayout` (+3); P3 settings copy, page alerts, „Sesja” row, header „Wyjdź” removed, danger
  `border-line` (+4); P4 `SettingsPasswordRow.tsx` toggle (+1); P5 delete dialog incl. placeholder rebind (+3); P6
  login/register/reset + `FormField` paper/8 px (+1); P7 confirm-email/reset-new panels, expired layout, countdown
  SSR step, G37 closed (+3); P8 register K34, follow-ups, seam sweep, visual gate. Net smoke +18.
- Manual rows, as a checklist:
  - [ ] [reviewer] rows 1.6, 2.6, 3.7, 4.5, 5.7, 6.6, 7.8, 8.7
  - [ ] [visual] 8.6 (every state listed in Phase 8, desktop + ~400 px, incl. pattern-actions dialog `max-h` check)
  - [ ] [human] 8.8: accept header sign-out removal, collapsed (JS-only) password form, dialog closing on error, short
    demo strip text, redirect `/` vs PRD `## Access Control`, longer deleted notice; send K34 to the kit author
- Follow-ups P8 files in `follow-ups/review-fixes.md`: `field-styles.ts` `field` → 8 px/paper (`Trigger: S-14`),
  `DialogContent` kit padding/mobile radius (`Trigger: S-14`), „Resolved in S-12” notes for durable-pattern-decisions
  F8 and the `FormField` part of S-04 F11.
- Known risks (plan § Known risks): `settings fills the password minimum` matches serialized props only after P4; P3
  shows a delete error twice until P5; no-JS users cannot open the password form; same alert for both
  wrong-password outcomes.
- Invariants: never `npm run format`, never stage `design/**` or `src/styles/brand.css`, never touch `checkOrigin`.
- No `DESIGN-GAP` added in this step.

## 6. Autonomous decisions

1. **Codebase verification done inline, not via the skill's sub-agent.** Rejected: one general-purpose sub-agent.
   Why: the riskiest claims were a dozen targeted greps/reads; doing them directly kept the evidence in this report.
   Would change: a plan touching many modules where blast-radius search needs a broad sweep.
2. **F1 fixed by adding a smoke step (+18) rather than only correcting „59 s”.** Why: the claim "client-only" was
   wrong, and the SSR state is cheap to pin with a deliberate break. Would change: the pending cookie being cleared
   before any point the step could run (then keep it visual-only and correct the text).
3. **F3 (JS-only password form) recorded, not overturned.** Rejected: keeping the form open. Why: the kit draws the
   toggle in `settings()` and 5 state views; the delete dialog already needs JS; the PRD is silent. Would change: the
   maintainer rejecting it on `[human]` row 8.8, or an accessibility requirement for no-JS operation.
4. **No PRD-driven overturn.** Every product-visible choice is kit-backed and named on row 8.8; the PRD Access Control
   tension (public landing, sign-out to `/`) predates this slice. Would change: the maintainer resolving it toward
   `/login`.
5. **Triage done in place of the skill's interactive questions** (contract rule 1): WARNINGs had obvious fixes →
   fixed; OBSERVATIONs fixed when one line, else recorded. Would change: a human available for triage.
