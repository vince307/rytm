# Handoff — `kit-round-3-auth-settings` (slice S-12)

Written by the `/10x-research` step of run `2026-10-02-kit-round-3`. Research is complete: `research.md` answers every
open question from `change.md`. No code was touched. The plan must not miss three findings:

- `settings.deleteDisabledHelp` has **no placement** in the kit's `app.js`.
- The `app.js` demo strip text matches **neither** `app.demoNotice` nor `settings.demoNotice`.
- Round-3 `.modal` now defines `max-height`, so F8 has a kit source.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/kit-round-3-auth-settings`, cut from `main` at `60e92e1` (after S-13) |
| Commits | 2 on the branch after this step: `docs(kit-round-3-auth-settings): change identity (autonomous run)`, then `docs(kit-round-3-auth-settings): research` |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `preparing` (set by `metadata-guard.mjs mark-researched`) |
| `## Progress` rows remaining | n/a (no `plan.md` yet) |
| Working tree | clean after the commit (3 files staged by explicit path) |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `context/changes/kit-round-3-auth-settings/research.md` | Source-backed answers to the 7 open questions, covering: the copy map (exact / rename / kept / new literals), K32 choice, password toggle, demo strip wiring and text, sign-out, round-3 CSS rules, test pins, smaller items, and 6 choices for the plan |
| `context/changes/kit-round-3-auth-settings/change.md` | Frontmatter only: `status` `new` → `preparing`, `updated` 2026-10-03 |
| `context/changes/kit-round-3-auth-settings/handoff.md` | This file |

## 3. Verification

| Command | Result |
| --- | --- |
| `git branch --show-current` | `feat/kit-round-3-auth-settings` |
| `grep -rn "copyExtra" src/` + alias reads + node leaf compare against `content.json` (throwaway script in `$TMPDIR`, not committed) | 61 exact leaves, 1 rename (`app.settingsLong` → `app.settings`), 16 with no key. 3 reads sit outside the slice: `patterns/[...key].astro` reads `auth.saving` twice and `howItWorks.sequenceOver` once; `patterns`/`fixed`/`imports/index` read `emptyViews.body` |
| `grep -c deleteDisabledHelp design/rytm-os/prototype/app.js` | `0` (the key has no placement) |
| `grep -rln FormField src` | Used only by the auth forms + `DeleteAccountDialog`, so the field sweep stays in S-12 views |
| `grep -rn 'variant="danger"' src` (Panel) | Used only by `settings.astro` |
| `metadata-guard.mjs inspect` / `mark-researched` | OK, `changed: true` |
| lint / astro check / vitest / build / pgTAP / smoke | **Not run**: a docs-only step with no code changed. Baseline (inherited from the contract, unverified here): `main` `60e92e1` lint 0, astro check 0 (155 files), vitest 352, pgTAP 119, smoke 166/0 |

## 4. Next command

`/10x-plan kit-round-3-auth-settings`

## 5. Open

Choices the plan makes and records. The recommendations are in `research.md` § Open Questions:

1. **Password form toggle:** recommended. The island owns the open state, with „Zapisz hasło”/„Anuluj” in `copyExtra`, and every result alert moves above the panel. Also close `DeleteAccountDialog` on server error, as the kit's `deleteAccountAction` does.
2. **Demo strip:** shown in `src/layouts/AppLayout.astro` via `isDemoEmail(Astro.locals.user?.email, DEMO_EMAIL)`, with text `app.demoNotice`. Add a new K-row for the three-way text conflict.
3. **`deleteDisabledHelp` placement** under the `USUŃ` input; record it as a K-row.
4. **`src/components/ui/dialog.tsx` `DialogContent`:** add `max-h-[calc(100vh-32px)] overflow-auto` now (closes F8). The kit's padding change goes to a follow-up with `Trigger: S-14`.
5. **`src/pages/patterns/[...key].astro`:** repoint `copyExtra.howItWorks.sequenceOver` → `copy.patternDetail.sequenceOver`. `copyExtra.auth.saving` stays.
6. **Header breakpoints:** keep `max-[559px]` and optionally add `max-[359px]`.

Facts the plan must carry:

- Settings and demo:
  - **Revision of change.md:** G37 on `/reset/new` closes with `settings.demoPasswordBlocked`, so the `copyExtra.settings.demoLocked` placeholder can go.
  - **Header:** remove the `AppHeader.astro` „Wyjdź” form. Add the „Sesja” row (`settings.logout`, POST `/api/auth/signout`). The redirect stays `/`, which 3 smoke steps pin.
  - **Panel border:** `src/components/app/Panel.astro` `variantClass` danger `border-excess` → `border-line` (round-3 `--rytm-danger-line`).
- Copy:
  - **K32:** `/settings` reads `settings.*`; `/reset/new` reads `authStates.{newPassword,repeatPassword,passwordMismatch}`.
  - **`resendCountdown`:** `src/components/auth/ResendButton.tsx` takes the `confirmEmail.resendCountdown` template.
  - **New tests:** add `kit-contract.test.ts` assertions for the new reads (`resendCountdown` `{seconds}`, `settings.*`). Add smoke steps for the demo strip (demo user on `/home` + `/settings`, absent for the test user), the logout row, and the footer `Dla kogo`.
  - **Stale `DESIGN-GAP` comments:** `settings.astro` header, and `DeleteAccountDialog.tsx` G24.
- Follow-ups and invariants:
  - **S-04 F11:** re-point `src/components/app/field-styles.ts` `field` at S-14 when this slice is archived.
  - **Invariants:** never `npm run format`, never stage `design/**` or `src/styles/brand.css`, never touch `checkOrigin`.
- PRD note: the PRD is silent on password change, sign-out, the demo account and the public pages. Its `## Access Control` line „niezalogowany użytkownik nie widzi niczego poza ekranem logowania” contradicts the public pages. This is recorded only, with no action in this slice.
- No `DESIGN-GAP` was added in this step.

## 6. Autonomous decisions

1. **Scope came from `change.md` decision 1 plus `handoff.md` §5. No question was asked.** Rejected: a broader audit (for example `emptyViews` on S-14/S-15 views). Would change: the plan finding a slice surface not covered.
2. **Recommend `/reset/new?error=demo` → `settings.demoPasswordBlocked`, revising change.md's "stays a placeholder".** The text describes exactly that refusal and is kit copy. Rejected: keeping `copyExtra.settings.demoLocked`, whose wording differs from every content.json key. Would change: the author adding a dedicated `/reset/new` demo key, or the plan judging "settings" wording wrong on an auth screen.
3. **Recommend dropping the header „Wyjdź”.** Reasons: C2, `settings.logoutDecision`, the kit's `appHeader()` has no logout, and smoke does not pin it. Rejected: keeping both. Would change: a maintainer finding sign-out too hidden on phones (MobileNav „Konto” reaches it in one tap).
4. **Sign-out redirect stays `/`.** Reasons: smoke pins it 3 times, and routes.md and the PRD are silent. Would change: a routes.md rule, or the maintainer resolving the PRD Access Control tension toward `/login`.
5. **Recommend the `DialogContent` max-height now, padding later.** The max-height is invisible on desktop and fixes clipping. The padding change visibly alters S-13/S-14 dialogs. Would change: S-14's plan already sweeping dialog geometry, in which case it takes both.
