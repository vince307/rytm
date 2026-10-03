# Handoff — `kit-round-3-auth-settings` (slice S-12)

Written by the visual-gate step of run `2026-10-02-kit-round-3`; final pre-merge state set by the ship step (archive + PR). Result: `VISUAL: PASS`. Every state in the [visual]
row 8.6 was captured at 1280 + 400 px against the round-3 kit. The gate made two kit-alignment fixes in the settings
password form (`d84b1ad`) and kept F4 as kit-exact. Next: archive, then ship. There are no migrations.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/kit-round-3-auth-settings`, cut from `main` at `60e92e1` (after S-13) |
| Commits | 30 on the branch after this step's final docs commit. This step added `d84b1ad` (fix), `0682a3a` + `24d8754` (screenshots, parts 1–2) and the final `docs(…): bramka wizualna` (README, review, plan tick, follow-up F3, register K34 note, this handoff) |
| Pushed / PR / merged | PR/CI/merge/deploy recorded in context/runs/2026-10-02-kit-round-3/run-log.md (branch already on origin since the slice was parked, tip then `e804e59`) |
| `change.md` status | `archived` (ship step, `/10x-archive`) |
| `## Progress` rows remaining | 1 (`grep -c '^- \[ \]' plan.md`): [human] 8.8 |
| Working tree | clean after the docs commit; dev servers on 4398/4399 killed; local DB reset |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `src/components/settings/SettingsPasswordRow.tsx` | fix: open form wrapper `border-t` (kit `.settings-password-form`), was `border-b`; comment updated |
| `src/components/auth/NewPasswordForm.tsx` | fix: `SubmitButton` `showArrow={false}` in the `cancel` (settings) branch only — kit „Zapisz hasło” has no ↗ |
| `context/changes/kit-round-3-auth-settings/screenshots/*.png` | 133 PNGs: 41 app states × 2 widths, `landing-360`, 2 „Sesja” close-ups, 2 short-viewport dialog shots, 23 kit frames × 2 |
| `context/changes/kit-round-3-auth-settings/screenshots/README.md` | state table (state · file · how reached · kit frame), accounts, capture method |
| `context/changes/kit-round-3-auth-settings/reviews/visual-review.md` | verdicts per group, F4 verdict, discrepancies + fixes, observations, `VISUAL: PASS` line |
| `context/changes/kit-round-3-auth-settings/plan.md` | [visual] row 8.6 ticked (`visual-review d84b1ad`) |
| `context/changes/kit-round-3-auth-settings/follow-ups/review-fixes.md` | new F3: landing steps head does not stack at 400 px (pre-existing), with a `Trigger:` line |
| `context/foundation/design-kit.md` | row K34: note on the kit's stretched/underlined „Wyloguj się” `<a>` + app resolution |
| `context/changes/kit-round-3-auth-settings/handoff.md` | this file |

## 3. Verification

All of it was observed in this step on the branch. Baseline = the contract line (`main` `60e92e1`, after S-13).

| Command | Result |
| --- | --- |
| Visual capture (Playwright 1.55, headless system Chrome, :4399) | 82 app PNGs + extras, 0 NOT CAPTURED; `scrollWidth` = viewport in every shot (1280/400, and 360 for 4 public pages); no `undefined`, no unfilled `{…}` |
| Claude-in-Chrome (inherited browser, own tab, closed) | `/settings` „Zmień hasło” → `aria-expanded="true"`, Tab → `#current`; headed screenshot matched the PNG |
| Dialog measurements | delete dialog initial focus `#delete-current` (never the danger button); Esc → focus back on „Usuń konto”; 400×460: height 428 = 460−32, `overflow-y: auto`, scrolls 50 px; import dialog and pattern-actions + merge picker fit at 400×812 |
| Resend countdown | „Wyślij ponownie za 60 s” at load on `?resent=1`, then „59 s” (both widths) |
| `npm run lint` | 0 errors (baseline 0, Δ0) |
| `npx astro check` | 0 errors, 157 files (baseline 155, +2 from the slice; the fix adds 0) |
| `npm test` | 354 passed / 23 files (baseline 352, +2 from the slice) |
| `npm run build` | OK |
| `npx supabase db reset` → `npm run smoke` (:4398) | 184 PASS / 0 FAIL (baseline 166, +18 from the slice); server killed; then `db reset` again |
| `npx supabase test db` | Files=6, Tests=119, PASS (Δ0) |
| `npm run fixture:check` | not run in this step: no fixture or parser changed. Last observed by the impl-review step (inherited, unverified here) |
| Deliberate break | none in this step. The fix is presentational (border side, arrow), so no automated check covers it. The before/after screenshots (`settings-form-open-*` re-shot after `d84b1ad`) are the proof |

## 4. Next command

`none — shipped`

## 5. Open

- Manual rows, as a checklist:
  - [ ] [human] 8.8: accept the header sign-out removal, the collapsed password form (JS-only), the dialog staying closed on error, the short demo strip text, the redirect to `/` vs the PRD, and the longer deleted notice; send K34 to the kit author
- Follow-ups in `follow-ups/review-fixes.md`: F1 (`field-styles.ts` `field`) and F2 (`DialogContent` padding/radius), both `Trigger: S-14`. New F3: `src/pages/index.astro` steps section head should stack below 560 px. Trigger: the next slice that touches the public pages.
- Register `context/foundation/design-kit.md` K34 now also notes the kit `settings()` „Wyloguj się” `<a>` artifact.
- Review observations carried: F2 `SettingsPasswordRow` `aria-controls` names an unmounted element while closed; F3 `SettingsPasswordRow` mirrors the `SettingsRow` classes by hand. F4 is closed: kit-exact, kept.
- Known risks as in plan § Known risks (password form needs JS; same alert for `current-password` / `delete-password`).
- Invariants: never run `npm run format`, never stage `design/**` or `src/styles/brand.css`, never touch `checkOrigin`.
- No `DESIGN-GAP` added. Roadmap item S-12 flipped to `done` by `/10x-archive` in the ship step; Backlog Handoff refreshed.
- Restated triggers: F1, F2 `Trigger: S-14`; F3 `Trigger: the next slice that touches the public pages` (`grep -n 'Trigger:' context/archive/2026-10-03-kit-round-3-auth-settings/follow-ups/review-fixes.md`).

## 6. Autonomous decisions

1. **Playwright for the PNG set, Claude-in-Chrome as a cross-check.** Why: 41 states × 2 widths, a 400 px width the
   Chrome window cannot reach, and full-page shots. This follows the S-13 precedent. Rejected: Chrome-only (would need
   an iframe for every mobile state). Would change: a Chrome window able to go to 400 px, or a state only headed
   Chrome can show (for example bfcache).
2. **F4 kept as is.** Why: kit `.settings-row` border-bottom + `.logout-row` border-top produce the same 2 px rule in
   the kit frame, and it reads as an intentional divider. Would change: the kit author removing one border, or the
   maintainer finding it heavy (`[human]`).
3. **Fixed the form border side and the „Zapisz hasło” arrow.** Why: both are visible deviations from kit
   `settings()`, and the border also deviates from the plan's P4 contract. Each is a one-line change. Rejected:
   recording them as observations. Would change: nothing.
4. **Kit's stretched underlined „Wyloguj się” `<a>` not copied.** Why: it looks like a prototype artifact (link
   underline on a `.btn`). The app keeps the standard ghost button inside a POST form. Noted in K34. Would change:
   the kit author confirming that a full-width sign-out is intended.
5. **Landing steps head (not stacking at 400 px) deferred as follow-up F3.** Why: the layout predates S-12 (P1 only
   rebinds copy), and the plan's scope rule is one view and no neighbouring redesign. There is no overflow. Would
   change: the orchestrator treating it as an S-12 regression.
6. **`/reset/new` form and demo error captured on a normal sign-in session, not a recovery link.** Why: the page
   needs only `locals.user` (impl-review decision 6). Would change: the page starting to depend on the recovery AMR.
7. **Two throwaway accounts registered and deleted through the real dialog.** Why: the confirm-email cookie states
   need a fresh signup, and deleting through the product also exercises the real `/login?deleted=1` path. A DB reset
   ran afterwards anyway. Would change: nothing.
8. **Archived with [human] 8.8 open (ship step).** `/10x-archive` warned `1 Progress item still pending (0 automated,
   1 manual)`; chosen: Continue archiving. Why: the open row is a product-owner acceptance, listed in the PR body under
   „Do decyzji właściciela produktu” as a post-run checklist; every automated, reviewer and visual row is ticked with a
   SHA reachable from the branch tip (merge commit keeps them in `main` history, so no SHA repoint). Rejected: Resume
   implementation (nothing left for an agent). Would change: an automated row left open, or the maintainer requiring
   human sign-off before merge.
