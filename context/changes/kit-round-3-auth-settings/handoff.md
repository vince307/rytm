# Handoff — `kit-round-3-auth-settings` (slice S-12)

Written by the `/10x-implement … phase 5` step of run `2026-10-02-kit-round-3`. Phases 1–5 are committed and green. The next agent must not miss that `copyExtra.settings` still holds `deleting`, `close`, the dialog eyebrow/title/body (read by `settings.astro`) and `demoLocked` (for `reset/new.astro`, P7); `copyExtra.settings.{currentPassword,deleteError}` are gone and the `/settings` page no longer reads `copyExtra.auth.passwordPlaceholder` or `settings.confirmation`; no existing smoke assertion may be edited.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/kit-round-3-auth-settings`, cut from `main` at `60e92e1` (after S-13) |
| Commits | 14 on the branch: identity, research, plan, plan review, p1 (464bfef), p1 handoff, p2 (b10c8d9), p2 handoff, p3 (42430cc), p3 handoff, p4 (4688697), p4 handoff, p5 `feat(…): Delete dialog on kit round 3 (p5)` (9edcdf5), this handoff |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | 27 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `src/components/settings/DeleteAccountDialog.tsx` | kit `modal('deleteAccount')`: no `serverError`/G24, closed by default, `demo` prop, confirm line split at `USUŃ` (`aria-describedby` target), `paper`/8 px input, `deleteDisabledHelp`, `InfoAlert` demo note |
| `src/components/auth/FormField.tsx` | optional `disabled` prop (+ muted disabled style) |
| `src/components/ui/dialog.tsx` | `DialogContent` `max-h-[calc(100vh-32px)] overflow-auto` (kit round-3 `.modal`) |
| `src/pages/settings.astro` | `demo` from `isDemoEmail`, new labels (`deleteButton`, `deleteConfirm`, `deletePassword`, `deleteDisabledHelp`, `demoDeleteBlocked`), `deleteError` const removed |
| `src/content/copy.ts` | `copyExtra.settings.{currentPassword,deleteError}` removed |
| `scripts/smoke.mjs` | +3 steps: delete error, wrong-password delete error, demo delete refusal (anchored `>…<`) |
| `plan.md`, `handoff.md` | Progress rows 5.1–5.6 ticked with SHA |

## 3. Verification

| Command | Result |
| --- | --- |
| `npm run lint` | 0 errors (baseline 0) |
| `npx astro check` | 0 errors, 3 hints |
| `npm run fixture:check` | ing OK, santander OK |
| `npm test` | 353 passed / 23 files (baseline 352, +1 from P3, P5 Δ0) |
| `npm run build` | OK |
| `npx supabase db reset` + `test db` | Files=6, Tests=119 PASS (Δ0) |
| `npm run smoke` (port 4398) | 180 PASS / 0 FAIL (post-p4 177, +3; run baseline 166, +14) |
| Deliberate break A | temp steps requesting `/settings` without `?error=demo-delete`: bare needle PASS (the text sits in the serialized `demoNote` prop), anchored `>…<` needle FAIL; temp steps reverted. Meta-check: proves why the anchor is mandatory; the real step requests the param and is anchored |
| Deliberate break B | `api/auth/delete.ts` confirm `.refine` made always true: `delete without confirm word is rejected` red (302 `/login?deleted=1`, plus a cascade of later steps because the smoke user got deleted); restored with `git checkout`, `db reset`, full gate green. Meta-check: the server `USUŃ` check is the guard, independent of the client lock (red came from the endpoint, not the UI) |

## 4. Next command

`/10x-implement kit-round-3-auth-settings phase 6`

## 5. Open

- Manual rows, as a checklist:
  - [ ] [reviewer] rows 1.6, 2.6, 3.7, 4.5, 5.7, 6.6, 7.8, 8.7 (5.7: `src/pages/api/auth/delete.ts` untouched in the final diff; demo flag from the page only; `aria-describedby` on `#delete-confirm` names the confirm line and the help while shown)
  - [ ] [visual] 8.6 (all states, desktop + ~400 px, incl. pattern-actions dialog `max-h` and the delete dialog in demo/locked/unlocked states)
  - [ ] [human] 8.8: accept header sign-out removal, collapsed password form, dialog closed on error (alert on the page), short demo strip text, redirect `/` vs PRD, longer deleted notice; send K34 to the kit author
- P6 may delete `copyExtra.auth.passwordPlaceholder` once its last reader is gone (`/settings` no longer reads it); P7 owns `demoLocked`.
- `FormField` disabled styling is Tailwind-only (kit defines none); no DESIGN-GAP added.
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
