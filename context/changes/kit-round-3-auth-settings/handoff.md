# Handoff — `kit-round-3-auth-settings` (slice S-12)

Written by the `/10x-new` step of run `2026-10-02-kit-round-3`. The slice has an identity (`change.md`, status `new`)
with the roadmap claims checked against the repo, the kit bindings and the triggered follow-ups. No code was touched.
The next agent must not trust the roadmap's item list: `change.md` § "Roadmap claims checked" adds K27, K32,
`confirmEmail.resendCountdown`, C3 fields on `paper` and a demo-strip text conflict (`app.js` vs `app.demoNotice`).

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/kit-round-3-auth-settings`, cut from `main` at `60e92e1` (after S-13) |
| Commits | 1 on the branch after this step: `docs(kit-round-3-auth-settings): change identity (autonomous run)` |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `new` |
| `## Progress` rows remaining | n/a (no `plan.md` yet) |
| Working tree | clean after the commit (only the two files below were staged, by explicit path) |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `context/changes/kit-round-3-auth-settings/change.md` | Change identity: outcome, migration verdict (no), roadmap claim → repo → correction table, kit views and content.json keys bound, `copyExtra` gaps kept, triggered follow-ups with scope takes, 7 autonomous decisions |
| `context/changes/kit-round-3-auth-settings/handoff.md` | This file |

## 3. Verification

| Command | Result |
| --- | --- |
| `git branch --show-current` | `feat/kit-round-3-auth-settings` |
| Leaf-by-leaf compare of `copyExtra.{auth,settings,app,landing,howItWorks,forWho,emptyViews}` vs `content.json` (node script, not committed) | `landing`/`howItWorks`/`forWho`/`auth.*Visual`/placeholders/`app.*` except `settingsLong` are byte-identical at the same path. 14 leaves moved to another key. 16 have no round-3 key (listed in `change.md`) |
| `grep -n 'Trigger:' context/archive/*/follow-ups/review-fixes.md` | 10 entries assessed in `change.md` § "Open follow-ups" |
| lint / astro check / vitest / build / pgTAP / smoke | **Not run**: a docs-only step, no code changed. Baseline (inherited from the contract, unverified here): `main` `60e92e1` lint 0, astro check 0 (155 files), vitest 352, pgTAP 119, smoke 166/0 |

## 4. Next command

`/10x-research kit-round-3-auth-settings`

## 5. Open

- Research questions (from `change.md` decision 1):
  - the per-use-site `copyExtra.auth/settings` → round-3 key map (K32 duplicate choice);
  - password form: the kit's toggle („Zmień hasło” → „Zapisz hasło”/„Anuluj”) vs. always open;
  - `src/layouts/AppLayout.astro` demo-strip wiring (`isDemoEmail`, `DEMO_EMAIL` from `astro:env/server`);
  - the fate of the `AppHeader` „Wyjdź” (`copyExtra.app.exit`);
  - the round-3 `styles.css` rules for `.nav` < 560 px, `.footer-forwho`, `.logout-row`;
  - the smoke strings in `scripts/smoke.mjs` that pin auth/settings copy.
- Cross-file reads to handle: `src/pages/patterns/[...key].astro` reads `copyExtra.auth.saving` and
  `copyExtra.howItWorks.sequenceOver`. Repoint them to `copy.threshold.saving` / `copy.howItWorks.sequenceOver`, or
  keep those keys.
- New K-row expected in `context/foundation/design-kit.md`: the `app.js` `appShell()` demo strip text differs from
  `content.json` `app.demoNotice`.
- G37 on `/reset/new` (`copyExtra.settings.demoLocked`) stays a placeholder: the kit has no copy for it.
- Follow-up S-04 F11 (field radius): S-12 sweeps `FormField.tsx` + the `DeleteAccountDialog` input only.
  `src/components/app/field-styles.ts` `field` stays open and should be re-pointed at S-14 at archive.
- Follow-up F8 (`src/components/ui/dialog.tsx` `DialogContent` has no `max-h`): the visual gate checks the mobile
  delete dialog with `deleteDisabledHelp` + the demo alert.
- No `DESIGN-GAP` was added in this step.

## 6. Autonomous decisions

See `change.md` § Autonomous decisions (each with its reversal condition). In short:

1. The next step is research, not plan. The roadmap item list missed K27/K32/`resendCountdown`/C3 and the strip conflict. Reversal: a research.md already on disk.
2. No migration. Reversal: the kit drawing a value the app does not store.
3. The demo strip text comes from `app.demoNotice` (content.json), not the `app.js` sentence. Reversal: the author fixing the key, or the PRD requiring the list of blocked actions.
4. The demo strip goes in the shared `AppLayout`. Reversal: the layout cannot read the user without per-page props.
5. Field radius 8 px and `bg-paper` only in the slice's own field components. Reversal: `FormField` found on S-14/S-15 views (acceptable, it moves toward the kit).
6. K27 keys stay in `authStates`. Reversal: the author adds new homes.
7. The sign-out redirect stays `/`. Reversal: a routes.md rule naming the post-logout destination.
