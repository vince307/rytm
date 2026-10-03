---
change_id: kit-round-3-auth-settings
title: Auth, account settings and public pages bound to design kit round 3
status: archived
created: 2026-10-03
updated: 2026-10-03
archived_at: 2026-10-03T11:14:47Z
---

## Notes

Roadmap S-12 (`kit-round-3-auth-settings`), milestone M-3 (kit round 3: the app without placeholders). Third slice of
run `2026-10-02-kit-round-3` (`F-04 → S-13 → S-12 → S-14 → S-15`). F-04 shipped (PR #19, `2a8f89d`) and S-13 shipped
(PR #20, `60e92e1`), so `design/rytm-os/` IS round 3 and is read-only for this slice. PRD refs: FR-001 (sign up, sign
in), FR-019 (delete the account and all its data); the demo parts also touch FR-014. The presentation changes and the
rules stay the same: same validation, `MIN_PASSWORD_LENGTH` 6, the server-side current-password and `USUŃ` checks in
`api/auth/delete.ts`, the demo guards in `api/auth/{password,delete,reset/new}.ts`, and `checkOrigin`.

Outcome (roadmap): the user goes through sign-in, sign-up, e-mail confirmation, reset and set-new-password with the
round-3 visual panels. In settings the user changes the password (current + new + repeat) with success and error
states, signs out from the settings screen, and deletes the account through a dialog with the current password and
`USUŃ`, then sees a note on `/login`. On the demo account the user sees a permanent note about blocked actions. The
public pages (landing, how it works, for who, the last one also from the footer on a phone) use copy from
`content.json`.

**Migration expected: no.** Nothing the kit draws needs a new value: the e-mail comes from `locals.user`, the demo
flag from `isDemoEmail(locals.user.email, DEMO_EMAIL)` (`src/lib/demo.ts`), and sign-out is the existing
`POST /api/auth/signout`. No table, column, RPC or policy changes.

### Roadmap claims checked against the repo (branch `feat/kit-round-3-auth-settings` = `main` `60e92e1`)

| Roadmap claim (plan-time) | Repo now | Correction |
| --- | --- | --- |
| Auth screens get the round-3 visual panels | `login`/`register`/`reset` read `copyExtra.auth.{loginVisual,registerVisual,resetVisual}`, which are byte-identical to `copy.auth.*Visual` now. `confirm-email.astro` reuses `registerVisual`, and `reset/new.astro` reuses `resetVisual` (K13 comments). The kit draws its own panels, but only in `app.js`: `confirmEmail()` has „Jeszcze jeden krok” / „Twój rytm zaczyna się od jasności.” / „Potwierdź adres e-mail, aby dokończyć tworzenie konta.”, and `resetNew()` has „Spokojnie” / „Hasło można ustawić na nowo.” / „Wybierz nowe hasło, aby wrócić do swojego rytmu.” | Three panels are a pure rebind to `copy.auth.*Visual`. The confirm-email panel and the reset/new panel need new `copyExtra.auth` entries copied verbatim from `app.js`, because K13 is still partial (no content.json key). The panel layout (`AuthLayout`) stays as it is |
| Reset / set new password in round 3 | `reset/new.astro` covers form / expired / success. The kit's expired state has more copy, all in `app.js`: eyebrow „Link wygasł”, h1 „Ten link już wygasł.”, lead „Dla bezpieczeństwa link do zmiany hasła działa przez ograniczony czas.”, error alert „Wyślij nowy link, aby kontynuować.”. The app shows only the alert `resetNew.expired`. Success: `doneEyebrow`/`resetSuccessLead` match `app.js` but have no content.json key | Expired state: adopt the kit layout (eyebrow + h1 from `resetNew.expired` + lead + alert). The strings that have no key go to `copyExtra` verbatim (K11 note). `saveNewPassword`, `doneEyebrow`, `resetSuccessLead`, `resetNewError`, `confirmedLogin`, `occupiedOr`, `resent`, `resendError` stay in `copyExtra` (no round-3 key) |
| Settings password change: current + new + repeat, with success and error states | Already works (S-08 + G23/G24 placeholders): `NewPasswordForm` with `current`, `?password=changed`, `?error=current-password|password|demo-password`. All copy comes from `copyExtra.settings`/`copyExtra.auth`. Round 3 now has `settings.{changePassword,currentPassword,newPassword,repeatPassword,passwordSuccess,passwordInvalid,saveError}`. The kit hides the form behind the „Zmień hasło” button, with „Zapisz hasło” + „Anuluj” and a masked „••••••••” value (strings only in `app.js`) | A copy rebind plus a layout question: always-open form (today) vs. the kit's toggle (→ research/plan). `?error=password` → `settings.saveError` (kit `settings-error.html`) instead of `copyExtra.auth.resetNewError`. K32: the slice reads `settings.*` (not `authStates.*`) on `/settings` and records that choice |
| Sign out from the settings screen (C2) | Not present. Sign-out exists only as the `AppHeader` button `copyExtra.app.exit` „Wyjdź” (→ `POST /api/auth/signout` → redirect `/`). The kit `settings()` has a „Sesja” row with „Wyloguj się” (`settings.logout`) that links to `#/login` | New row: a POST form to the existing endpoint. „Sesja” has no key, so it goes to `copyExtra` (K15 note). Open questions for research: keep or drop the header „Wyjdź” (`app.exit` is still a content.json key), and whether the redirect target `/` changes (smoke asserts `location: "/"`, so the plan says no) |
| Delete dialog with current password + `USUŃ`; button disabled until valid; server confirmation not weakened | Already works: `DeleteAccountDialog` disables the button on `currentPassword.length === 0 \|\| confirmation.trim() !== DELETE_CONFIRM_WORD`, and `api/auth/delete.ts` re-checks both. Copy is `copyExtra.settings.deleteDialog*` (verbatim from `app.js`, no round-3 key). Round 3 adds `settings.{deletePassword,deleteConfirm,deleteButton,deleteDisabledHelp,deleteError}`. Inputs use `bg-white` and `rounded-lg` (14 px) | Copy rebind, plus `deleteDisabledHelp` (new visible help). The eyebrow/title/body stay in `copyExtra` (K15). The client lock is presentation only: the server check stays, and the smoke `delete` steps without `current` / with a wrong password stay red-by-design |
| Note on `/login` after deletion | Works: `?deleted=1` → `copyExtra.auth.deletedLogin` „Konto zostało usunięte.” (= `settings.deleteSuccess`). The kit `login-deleted.html` and `settings.deletedNotice` have the longer „Konto zostało usunięte. Możesz zalogować się ponownie lub utworzyć nowe konto.” | Rebind to `settings.deletedNotice` (the kit view text). The smoke `contains: "Konto zostało usunięte."` still matches as a substring |
| Demo account: permanent note about blocked actions | **Not present.** `/settings` shows the refusal only after a refused POST (`copyExtra.settings.demoLocked`). The app shell has no strip. The kit has three: (a) `appShell()` `.demo-notice` strip under the header on every app view, (b) `settings.demoPasswordBlocked`/`demoDeleteBlocked` (toast/inline in the modal), (c) disabled delete fields. There is a text conflict: the `app.js` strip says „Wspólne konto demo — dodawanie i cofanie importów, zmiana hasła oraz usunięcie konta są wyłączone.”, while `content.json` `app.demoNotice` says „Wspólne konto demo — niektóre działania są wyłączone.” `settings.demoNotice` is never rendered by the kit | New presentation behaviour, same server guards. The demo strip lives in `AppLayout` (shared shell): the page passes `isDemoEmail(...)` or the layout computes it. Text: read `app.demoNotice` (content.json wins over `app.js`, as S-13 did with `demoImportBlocked`). New K-row for the author. `/reset/new?error=demo` keeps a placeholder: G37 is an app gap with no kit copy, `copyExtra.settings.demoLocked` → research whether `settings.demoPasswordBlocked` fits |
| Public pages use `content.json` copy | `index`/`how-it-works`/`for-who` read `copyExtra.landing/howItWorks/forWho`. **Every leaf is byte-identical at the same path in `copy.*`** (checked leaf by leaf on 2026-10-03) | Pure rebind, no visual change. `copyExtra.howItWorks.sequenceOver` is also read by `patterns/[...key].astro` (S-14's file) and `copyExtra.auth.saving` by the same file. Either repoint those two reads (one-line, no visual change) or keep the keys until S-14 (→ plan) |
| „Dla kogo” reachable from the footer on a phone (C1, G20) | `SiteFooter.astro` has only „Prywatność” and „Kontakt”. No `footer.forWho` link. `SiteHeader.astro` keeps „Dla kogo” visible below 560 px (only `text-xs`). The kit hides it in the header (`.nav a:nth-child(2)` < 560) and shows `.footer-forwho` only on a phone | Add the footer link (`copy.footer.forWho`, phone-only, first in the list, as `app.js` `footer()`), and align the header with the kit's < 560 rule (→ research: confirm the round-3 `styles.css` media rule) |
| Items: K11 (auth, landing, howItWorks, forWho), K13, K14, K15, G20, G23, G24, G32, G37 (settings part) | The `design-kit.md` round-3 table assigns K13, K14, K15, G20, G23, G24, G32, G37 (with S-13) and K11 to S-12. Not in the roadmap: **K27** (the 4 restored `authStates`, follow-up `Trigger: S-12`), **K32** (duplicates `settings.*Password` vs `authStates.*Password`, `settings.confirmation` vs `deleteConfirm`), **`confirmEmail.resendCountdown`** („Wyślij ponownie za {seconds} s”, delivered with no K/G row; `ResendButton` builds `${label} (${left}s)`), **C3 fields on `paper`** (`--rytm-field`: `FormField` and the `DeleteAccountDialog` input use `bg-white`) | Add K27 (no move: the author did not add new homes, keep `kit-contract.test.ts`), K32 (read `settings.*` on `/settings`, record it), `resendCountdown`, and C3/G32 to scope. G37 on `/reset/new` stays a placeholder (kit has no copy) |
| Parallel with S-13/S-14/S-15; Unknowns: — | S-13 is done. The `PageTitle.astro` stacking below 560 px (Backlog note) is already shipped (`max-[559px]:flex-col`) | Nothing left from the Backlog note. New unknowns: (1) the demo-strip text conflict above, (2) the settings password form layout (toggle vs open), (3) the sign-out redirect target |
| Bez migracji (contract: "no migrations expected") | Confirmed (see above) | none |

### Kit bindings (design/rytm-os/prototype/, content.json)

Views (rendered by `prototype/app.js` `auth()`, `resetPage()`, `resetNew()`, `confirmEmail()`, `settings()`,
`modal('deleteAccount')`, `appShell()` (demo strip), `landing()`, `howItWorks()`, `forWho()`, `header()`, `footer()`;
routes in `react-kit/docs/routes.md`):

| Kit view | App surface |
| --- | --- |
| `views/login.html`, `login-confirmed.html`, `login-deleted.html` | `src/pages/login.astro` + `SignInForm.tsx` |
| `views/register.html`, `register-occupied.html` | `src/pages/register.astro` + `SignUpForm.tsx` |
| `views/confirm-email.html` | `src/pages/confirm-email.astro` + `ResendButton.tsx` |
| `views/reset.html` | `src/pages/reset.astro` + `ResetForm.tsx` |
| `views/reset-new.html`, `reset-new-expired.html`, `reset-new-success.html` | `src/pages/reset/new.astro` + `NewPasswordForm.tsx` |
| `views/settings.html`, `settings-password-success.html`, `settings-password-invalid.html`, `settings-error.html`, `settings-delete-error.html`, `settings-demo.html` | `src/pages/settings.astro` + `NewPasswordForm.tsx` + `DeleteAccountDialog.tsx`; the demo strip in `src/layouts/AppLayout.astro` |
| `views/landing.html` (= `index.html`), `how-it-works.html`, `for-who.html` | `src/pages/{index,how-it-works,for-who}.astro`, `SiteHeader.astro`, `SiteFooter.astro` |

content.json keys this slice binds: `auth.{login,register,fields,loginVisual,registerVisual,resetVisual,optional,
namePlaceholder,emailPlaceholder,passwordPlaceholder,forgotPassword,terms,noAccount,createIt,haveAccount,resetEyebrow,
sendInstructions,backToLogin}`, `authStates.*` (incl. the K27 four and `passwordMismatch`), `confirmEmail.*` (incl.
`resendCountdown`), `resetNew.*`, `settings.{title,eyebrow,lead,data,logout,changePassword,currentPassword,newPassword,
repeatPassword,passwordSuccess,passwordInvalid,saveError,deleteTitle,deleteBody,deletePassword,deleteConfirm,
deleteButton,deleteDisabledHelp,deleteError,deletedNotice,demoPasswordBlocked,demoDeleteBlocked}`, `app.{demoNotice,
settings}`, `landing.*`, `howItWorks.*`, `forWho.*`, `footer.{copyright,privacy,contact,forWho}`, `navigation.*`.
`settings.dangerBorder` / `--rytm-danger-line` and `--rytm-field` are tokens (C2/C3), not copy.

Kit gaps the slice keeps in `copyExtra` (text in `app.js` only, no content.json key, no new gap invented):
`settings.{loginData,dataLabel,dangerEyebrow,deleteDialogEyebrow,deleteDialogTitle,deleteDialogBody}` (K15),
„Sesja”, „Zapisz hasło”, „Anuluj” (if the toggle is adopted), the confirm-email and reset/new visual panels (K13), the
reset/new expired eyebrow/lead/alert, and `auth.{confirmedLogin,occupiedOr,saveNewPassword,doneEyebrow,
resetSuccessLead,resetNewError,resent,resendError}`. Each gets a K11/K13/K15 note in `design-kit.md`. **No kit view
is missing**, so no new `DESIGN-GAP` is expected. The only app state without kit copy is G37 on `/reset/new`, which
stays a placeholder. Stale `DESIGN-GAP` comments to remove or rewrite: `settings.astro` header (G23/G24/G37),
`DeleteAccountDialog.tsx` (G24: the kit modal now draws the password field), the `copy.ts` G23/G24/G24-login/K11
blocks that become empty.

### Open follow-ups whose Trigger this slice meets

| Follow-up (archive file, symbol) | Trigger | Take |
| --- | --- | --- |
| K27 — the 4 restored `authStates` may move to round-3 homes. Source: `2026-10-02-kit-round-3-intake` § S-12 | "S-12" | **Fired, no work**: round 3 has no other home for `loginError`/`resetTitle`/`resetBody`/`checkInbox`, so they stay in `authStates` (intake patch). `test/unit/kit-contract.test.ts` stays as it is. The design-kit.md K27 row stays "partial — author restores at source" |
| S-04 F11 — app-wide `rounded-lg` (14 px) vs kit 8 px fields (`FormField.tsx`, `field-styles.ts` `field`). Sources: `2026-09-27-pattern-threshold-over-limit`, `2026-09-28-durable-pattern-decisions` | "the next UI change to a view with a form field, or a design-kit round that names field radii" | **Fired, in scope for the slice's own components**: `FormField.tsx` (every auth form + settings) and the `DeleteAccountDialog` `USUŃ` input → 8 px. `field-styles.ts` `field` (the `/patterns` toolbar, `MonthSelect`) is S-14's view: leave it, and re-point the follow-up at S-14. A named field-radius token is a global-token change, so research checks whether `global.css` can define one without moving `rounded-lg` elsewhere |
| G32/C3 — field background `paper` (`--rytm-field`). Source: design-kit.md round-3 table → S-12 | slice assignment | **In scope**: `FormField.tsx` and the `DeleteAccountDialog` input `bg-white` → `bg-paper` (`--rytm-field` = `--rytm-paper`, no new Tailwind name). `ThresholdEditor` already uses `bg-paper` |
| S-04 F3 — one shared focus-ring class (`button.tsx`, `BackLink.astro`, `PatternsTable.tsx`). Source: `2026-09-27-pattern-threshold-over-limit` | "the next change that alters the focus ring or the `ink` token" | **Not fired unless the plan adopts `--rytm-focus-ring`** (rgba .12) for `FormField` (today `ring-ink/8` = kit `.field input:focus` .08, which round 3 did not change). The intake follow-up gives `--rytm-focus-ring` to S-14 (G29). Recommendation: S-12 keeps `.field input:focus` as is and does not take the shared-class sweep |
| Shared dialog geometry / close icon / F8 no `max-h` (`src/components/ui/dialog.tsx`). Sources: `2026-09-25-undo-import`, `2026-09-28-durable-pattern-decisions` | "next change that touches a dialog" / "a dialog with more content" | **Geometry already resolved** (S-13 recorded `DialogContent` = kit `.modal`). The close icon is still cross-view, so it stays out. **F8 is borderline**: `DeleteAccountDialog` gains `deleteDisabledHelp` and, on demo, an info alert. The visual gate checks the mobile delete dialog at a short viewport and fixes it only if it clips |
| DeleteAccountDialog bfcache (`2026-09-28-durable-pattern-decisions`) | "a user or the visual step reproducing an actual stuck state on `/settings` after Back" | **Watch in the visual gate**: if the plan adds a manual pending flag (e.g. for `NewPasswordForm` or the logout button), use `usePageShowReset` as the other dialogs do |
| S-13 F7 — demo-locked wizard „Wybierz inny plik” | "… or S-12 (demo strip)" | **Already resolved** in S-13's visual gate (`ImportWizard` hides `chooseOtherButton` when locked). The trigger reminds S-12 that the demo strip must not clash with the S-13 import notes: the strip is shell-level, and the import pages keep their own inline notes, as the kit does |
| F3 CSRF relies on `security.checkOrigin`. Source: `2026-09-25-undo-import` | invariant | Binding: the new logout form on `/settings` is a plain POST. Do not touch `checkOrigin` |
| Any slice touching a month template → `fillMonthLocative`. Source: intake | condition | **Not fired**: auth/settings/public copy has no `{month}` |
| Prettier must not reformat the kit. Source: intake | "runs `npm run format` …" | Binding: never `npm run format`, never stage `design/**` or `src/styles/brand.css` |

## Autonomous decisions

1. **Next step `/10x-research`, not `/10x-plan`.** Chosen: research (the orchestrator also names it). Open questions
   that need a source-backed sweep before planning:
   - the per-use-site `copyExtra.auth/settings` → round-3 key map (K32: which duplicate to read);
   - toggle vs. always-open password form;
   - the `AppLayout` demo-strip wiring (does every app page have `locals.user.email`?);
   - the header „Wyjdź” fate;
   - the round-3 `styles.css` rules for `.nav` < 560, `.footer-forwho` and `.settings-row.logout-row`;
   - which smoke/unit assertions pin the old copy (`Konto zostało usunięte.`, `Hasło zostało zmienione.`, `Link jest
     w drodze.`, `>Odzyskaj dostęp.<`).

   Rejected: a direct plan, because the roadmap misses K27, K32, `resendCountdown`, C3 and the strip text conflict.
   Would change: a research.md already on disk.
2. **No migration.** The demo flag, the e-mail and sign-out already exist. Rejected: a per-user "demo" column (the
   rule is `DEMO_EMAIL`, an env var). Would change: the kit drawing a value the app does not store (none found).
3. **Demo strip text = `content.json` `app.demoNotice`, not the longer `app.js` sentence.** content.json is the copy
   contract (`copy` = kit JSON), and S-13 set the precedent (`importFlow.demoImportBlocked` over `app.js`). Record a
   K-row for the author. Rejected: copying the `app.js` sentence into `copyExtra`. Would change: the author fixing
   `app.demoNotice` in round 4, or the plan finding that the short text hides which actions are blocked in a way the
   PRD (FR-014) forbids (it does not say).
4. **The demo strip is in scope even though `AppLayout` is shared.** The kit draws it in `appShell()`, the roadmap
   outcome demands a permanent note, and S-13's F7 trigger names "S-12 (demo strip)". It is global chrome, not a
   neighbouring view's redesign. Rejected: a settings-only note (`settings.demoNotice`, which the kit never renders).
   Would change: the plan finding that `AppLayout` cannot read the user without a per-page prop. Then the strip
   renders from the pages S-12 owns plus a follow-up for S-14/S-15.
5. **Field radius and background swept only in the slice's own components** (`FormField`, the `DeleteAccountDialog`
   input). `field-styles.ts` (patterns toolbar) stays S-14's. Rejected: a global `--radius` change (it moves every
   `rounded-lg` card and button). Would change: research showing `FormField` is also rendered on S-14/S-15 views (then
   their visual gates inherit the change, which is acceptable because it moves toward the kit).
6. **K27 left in place.** There is no new home in round 3. Would change: the author adding the keys elsewhere.
7. **Sign-out redirect stays `/`.** The kit links to `#/login`, but that is a prototype hash link, and the smoke pins
   `location: "/"`. Rejected: changing the endpoint behaviour in a presentation slice. Would change: research finding
   a routes.md rule that names the post-logout destination.
