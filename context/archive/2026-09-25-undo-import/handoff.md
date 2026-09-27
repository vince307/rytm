# Handoff — `undo-import` (slice S-02)

Written by the visual-gate step (2026-09-27, autonomous run). `VISUAL: PASS`: every `[visual]` state of plan rows
2.9/2.10 captured on desktop 1440 px and 400 px against the kit, two discrepancies fixed in `8013681`; `## Progress`
is fully ticked. The next agent must not get this wrong: the dialog-geometry difference vs kit `.modal` (440 vs 480 px,
0 vs 20 px mobile margin) is the **shared** `DialogContent` used by `/settings` too — carry it as a follow-up at archive,
do not restyle it inside this slice.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/undo-import`, cut from `main` at `d11f3ef`; `main` `4425f8c` (S-03) merged in as `9eb6dd6` |
| Commits this step | 2 on top of `97daa22`: `8013681` `fix(undo-import): poprawki z bramki wizualnej — …`, then `docs(undo-import): bramka wizualna` carrying this file |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `impl_reviewed` (unchanged — the visual gate has no status of its own) |
| `## Progress` rows remaining | 0 (`grep -c '^- \[ \]' plan.md`) — 2.9 and 2.10 ticked `visual gate (8013681)` |
| Working tree | clean apart from the maintainer's ` M .gitignore` and `?? .claude/skills/10x-autonomous-run/` (never staged) |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `src/pages/imports/index.astro` | Fix 1: action cell no longer `text-right` (kit `td` is left-aligned) |
| `src/components/imports/DeleteImportDialog.tsx` | Fix 2: `DialogContent` `onOpenAutoFocus` focuses the dialog, not the danger submit |
| `context/changes/undo-import/screenshots/*.png` | 16 app PNGs (7 states × desktop/400 px + `table-scrolled-mobile`, `dialog-focus-close-desktop`) + 4 kit frames (`kit-default-*`, `kit-dialog-open-*`) |
| `context/changes/undo-import/screenshots/README.md` | State table, account/fixture setup, measurements |
| `context/changes/undo-import/reviews/visual-review.md` | Review report; ends with the `VISUAL:` line |
| `context/foundation/design-kit.md` | G24 row: correction — kit modal has a 20 px margin at 400 px (`.modal-backdrop` padding); the 0 px is the app's shared `DialogContent` |
| `context/changes/undo-import/plan.md` | `## Progress` 2.9, 2.10 ticked |
| `context/changes/undo-import/handoff.md` | This file |

## 3. Verification

Baseline: `main` `4425f8c` — lint 0 · astro check 0 errors (89 files) · vitest 72/72 (4 files) · pgTAP 44 · smoke 48.
All observed in this step, after the fixes:

| Command | Result |
| --- | --- |
| `npm run lint` | 0 errors (Δ0) |
| `npx astro check` | 0 errors, 93 files (+4, unchanged from impl-review) |
| `npm run fixture:check` / `npm run build` | OK / Complete |
| `npm test` | 78/78, 5 files (+6 / +1, unchanged) |
| `BASE_URL=http://localhost:4398 npm run smoke` | 61/61 PASS, 0 FAIL (+13, unchanged from impl-review) |
| `npx supabase test db` | not run — no schema change in this step (54/54 at impl-review, inherited, unverified here) |
| raw-colour grep over `DeleteImportDialog.tsx`, `imports/index.astro` | no hits |
| Live keyboard probe (Playwright, desktop + 400 px) | Tab → trigger `:focus-visible`; Enter → focus on `[role=dialog]`; Tab trap „Usuń import” ↔ „Zamknij”; Esc → focus back on trigger. Before fix 2 the initial focus was the danger submit |

Dev servers: `astro dev` on :4399 (capture) and :4398 (smoke), plus a `python3 -m http.server 4398` for kit frames —
all killed (`lsof -ti :4398 -ti :4399` empty); :4321 untouched. No deliberate break this step (visual fixes only; the
keyboard probe before/after is the red/green: initial focus moved from the submit to the dialog).

## 4. Next command

`/10x-archive undo-import`, then ship (push `feat/undo-import`, PR, CI, merge — no `db push`, no migration)

## 5. Open

- **Follow-up for the archive step** (write into `follow-ups/review-fixes.md`): shared `src/components/ui/dialog.tsx`
  `DialogContent` differs from kit `.modal`/`.modal-backdrop` — 440 px / `p-[22px]` / `rounded-xl` vs 480 px / 31 px /
  13 px, and 0 px vs 20 px side margin at 400 px; affects `/settings` `DeleteAccountDialog` and `/imports`
  `DeleteImportDialog`. G24 row now states this correctly.
- **Local data left behind**: three `visual-undo-<timestamp>@rytm.local` accounts in the local Supabase (every capture run
  ended by deleting both its imports, so they hold no data) — local only, gone on `db reset`.
- **Carried from impl-review** (in `reviews/impl-review.md`): F3 CSRF relies on Astro's default `security.checkOrigin`;
  F4 `DeleteImportDialog` `pending` never resets on bfcache restore; F5 `buttonVariants` `text` unused until S-04;
  F6 S-03 follow-up F2 (`src/lib/patterns/load.ts` `collectPages`) to be restated at archive.
- **Carried, still open**: S-01 follow-up F9 (shared close icon, `src/components/ui/dialog.tsx` vs
  `src/components/Glyph.tsx` `Glyph`).
- **DESIGN-GAPs**: none added; K19, K20, G30 (implement) verified on screen; G24 row corrected.
- **Invariant for S-04/S-05**: persisted pattern decisions/thresholds key on `merchantKey` + `user_id`, never `import_id`.

## 6. Autonomous decisions

1. **Action column left-aligned (kit) instead of right-aligned (plan Phase 2 contract).** Rejected: keep the plan's
   `text-right`. Why: the kit is the source of truth and `kit-default-desktop.png` shows the text button at the
   column's left edge. What would change it: a kit revision aligning `.text-button` actions right.
2. **Initial focus on the dialog, not the danger button.** Rejected: Radix default (first tabbable = submit) and
   focusing „Zamknij”. Why: Enter-Enter from the trigger deleted an import; focusing the container announces the title
   and keeps the one-button kit layout untouched; container focus avoids a visible ring on the X at open. What would
   change it: the kit author defining focus order for modals.
3. **Did not change shared `DialogContent` geometry.** Rejected: restyling it to kit `.modal` now. Why: the plan's
   bar is „no worse than G24” (met: identical), and the change restyles `/settings` — one view + global tokens. What
   would change it: an explicit follow-up slice or the maintainer accepting a cross-view dialog fix.
4. **Imports seeded via `POST /api/imports` with payloads from the real parser** (split of the main fixture at
   2026-03-01) instead of clicking through the wizard twice. Why: the plan asks for two non-overlapping imports of the
   main account, the wizard cannot split one file; the payload path is the same one the wizard posts. What would
   change it: a visual row for the wizard itself (it is S-01's view).
5. **Captured `trigger-focus` on both viewports and an extra `dialog-focus-close-desktop`** as evidence for the
   keyboard path. What would change it: nothing — additive.

## 7. Archive step (2026-09-27, ship agent)

- `/10x-archive` warned: 4 Progress rows (1.10, 1.11, 2.9, 2.10/2.11) carry their SHA as `— <step> (<sha>)` instead of a
  bare ` — <sha>` suffix. **Chosen**: Continue archiving. Rejected: Resume implementation / Cancel. Why: every row is
  ticked, both phases are covered by `reviews/impl-review.md` (Reviewed phases: 1, 2), all SHAs are ancestors of HEAD;
  the warning is format only. What would change it: a pending row or a missing SHA.
- Follow-ups restated in `follow-ups/review-fixes.md` (`9da6508`), including S-03 F2 (trigger fired) — the S-03 archive
  is read-only, so it is restated here rather than ticked there.
