---
date: 2026-10-03T00:38:03+02:00
researcher: Claude (autonomous run 2026-10-02-kit-round-3, research step)
git_commit: af9744b2fdd31eee670385230ea28371557eff98
branch: feat/kit-round-3-auth-settings
repository: Rytm
topic: "S-12 kit-round-3-auth-settings — the open questions change.md leaves for the plan"
tags: [research, design-kit, auth, settings, demo, copy, AppLayout, SiteFooter, DeleteAccountDialog]
status: complete
last_updated: 2026-10-03
last_updated_by: Claude (autonomous research step)
---

# Research: S-12 `kit-round-3-auth-settings`: open questions for the plan

**Date**: 2026-10-03T00:38:03+02:00
**Git Commit**: `af9744b` (branch `feat/kit-round-3-auth-settings`, equal to `main` `60e92e1` plus the change-identity commit)
**Repository**: Rytm

## Research Question

Questions come from `change.md` § Autonomous decisions 1 and from `handoff.md` §5 of the `/10x-new` step:

1. Map each `copyExtra.auth/settings/app/landing/howItWorks/forWho` use-site to its round-3 key, and say which duplicate to read for K32.
2. Decide whether the settings password form follows the kit's toggle or stays always open.
3. Work out how `AppLayout` gets the demo strip, and which text it shows.
4. Decide what happens to the `AppHeader` „Wyjdź” button, and where sign-out redirects.
5. Read the round-3 `styles.css` rules for `.nav` < 560 px, `.footer-forwho`, `.logout-row`, `.demo-notice`, fields and `.modal`.
6. List the smoke and unit assertions that pin auth/settings copy.
7. Repoint the cross-file reads in `patterns/[...key].astro`, plus the smaller items: `resendCountdown`, `deleteDisabledHelp`, C3 fields, G37 on `/reset/new`, F8 dialog height.

Anchors are file + symbol. Kit paths are relative to `design/rytm-os/`. The prototype `prototype/app.js` puts each render function on one long line, so the anchors there are function names.

## Summary

- **No migration and no endpoint change.** Every value the kit draws already exists: `Astro.locals.user.email`, `isDemoEmail` + `DEMO_EMAIL` (`src/lib/demo.ts`), and `POST /api/auth/signout`. The server checks stay as they are: `api/auth/password.ts`, `api/auth/delete.ts`, `api/auth/reset/new.ts` and `checkOrigin`.
- **Copy:** 61 `copyExtra` leaves in the slice's namespaces are byte-identical to a `copy.*` key, and one more is a rename (`app.settingsLong` → `app.settings`). 16 leaves have no round-3 key and stay in `copyExtra`. A further set of `app.js`-only literals is new to the app (K13/K15). The plan rebinds the exact leaves and deletes them from `copyExtra`. Three reads sit outside the slice and constrain that deletion (§1.5).
- **K32:** `/settings` reads `settings.*`. `/reset/new` reads `authStates.{newPassword,repeatPassword,passwordMismatch}`. Both duplicates are byte-identical, so the choice changes no rendered text.
- **Password form:** the kit uses a toggle. The form is closed by default, behind a „Zmień hasło” button next to a masked „••••••••”, and opens with „Zapisz hasło” + „Anuluj”. Result alerts sit *above the panel*, not inside the form, and the form is closed in every state view. The PRD is silent on this. Recommendation: adopt the toggle.
- **Demo strip:** `AppLayout` can compute `isDemoEmail(Astro.locals.user?.email, DEMO_EMAIL)` itself, with no per-page prop. All 8 pages that use it are protected routes. The kit's strip is an `app.js` literal that matches neither content.json key. Recommendation: use `app.demoNotice` and record a K-row.
- **Sign-out:** the kit app header has no logout. C2 puts it in Settings, and content.json even carries `settings.logoutDecision` „Wylogowanie jest dostępne na ekranie Ustawienia.” Recommendation: drop the header „Wyjdź”, add the „Sesja” row, and keep the redirect `/`. Smoke pins `/` 3 times, and the PRD and routes.md are silent.
- **New facts beyond change.md:**
  - (a) Round-3 `styles.css` gives `.modal` a `max-height: calc(100vh - 32px); overflow: auto`, so F8 now has a kit source.
  - (b) `settings.deleteDisabledHelp` is in content.json but **not rendered anywhere in `app.js`** (no placement).
  - (c) In the kit's demo modal the password field is `disabled`, the button stays disabled, and an info alert `demoDeleteBlocked` follows the button.
  - (d) `settings.demoPasswordBlocked` fits the `/reset/new?error=demo` state, so G37's last placeholder can close with kit copy.

## Detailed Findings

### 1. Copy map (question 1)

Coverage: `grep -rn "copyExtra" src/` (56 hits outside `copy.ts`) plus alias reads (`const x = copyExtra.auth`, etc.) per slice file, and a leaf-by-leaf byte comparison of `copyExtra` in `src/content/copy.ts` against `design/rytm-os/react-kit/docs/content.json`. The components (`src/components/auth/**`, `settings/DeleteAccountDialog.tsx`, `marketing/*`, `src/layouts/*`) read no `copyExtra`. They get every string as a prop from the pages.

#### 1.1 Exact match, rebind to `copy.*` and delete from `copyExtra`

| Use-site (file → symbol) | `copyExtra` key | Round-3 key |
| --- | --- | --- |
| `index.astro` (`x = copyExtra.landing`) | `landing.{headlineEmphasis,heroCardTop,heroCardSub,stepsEyebrow,stepsTitle,stepsNote,ctaTitle,ctaButton}` | `landing.*` same names |
| `how-it-works.astro` (`x = copyExtra.howItWorks`) | `howItWorks.{sequenceCaption,sequenceThreshold,sequenceOver,stepsEyebrow,stepsTitle,stepsNote}` | `howItWorks.*` same names |
| `for-who.astro` (`x = copyExtra.forWho`) | `forWho.{primaryCta,secondaryCta,quoteLines,quoteStrong,cardsEyebrow,cardsTitle}` | `forWho.*` same names |
| `Sidebar.astro`, `MobileNav.astro`, `AppHeader.astro` | `app.{overview,patternsLong,fixedLong,sidebarView,sidebarData,importsLong,navLabel,exit}` | `app.*` same names |
| `Sidebar.astro` | `app.settingsLong` „Ustawienia” | **`app.settings`** (rename) |
| `login.astro`, `register.astro`, `reset.astro`, `confirm-email.astro`, `reset/new.astro` | `auth.{loginVisual,registerVisual,resetVisual,forgotPassword,emailPlaceholder,passwordPlaceholder,noAccount,createIt,optional,namePlaceholder,terms,haveAccount,backToLogin,resetEyebrow,sendInstructions}` | `auth.*` same names |
| `reset.astro` sent state | `auth.checkInboxEyebrow` / `checkInboxTitle` | `confirmEmail.eyebrow` / `confirmEmail.title` (same text, other namespace) |
| `reset/new.astro` + `settings.astro` `NewPasswordForm` labels | `auth.passwordsDiffer` | `authStates.passwordMismatch` |
| `login.astro` `?deleted` | `auth.deletedLogin` „Konto zostało usunięte.” | `settings.deleteSuccess` exact. **Recommended instead:** `settings.deletedNotice` „Konto zostało usunięte. Możesz zalogować się ponownie lub utworzyć nowe konto.”, the text `app.js` `applyAuthState` renders for `?deleted` (kit `views/login-deleted.html`) |
| `settings.astro` (`x = copyExtra.settings`) | `settings.{eyebrow,lead,changePassword,deleteError}` | `settings.*` same names |
| `settings.astro` | `settings.currentPassword` | `settings.currentPassword` (password form), `settings.deletePassword` (dialog). K32 |
| `settings.astro` | `settings.passwordChanged` | `settings.passwordSuccess` |
| `settings.astro` | `settings.currentPasswordWrong` | `settings.passwordInvalid` |
| `settings.astro` | `settings.emailLabel` / `passwordLabel` „E-mail” / „Hasło” | `auth.fields.email` / `auth.fields.password` (same text). The kit settings rows render them as literals |
| `settings.astro` | `settings.close` „Zamknij” | no `settings.*` key. The same text is in `patternActions.close` / `imports.deleteClose`. Keep it in `copyExtra` (clearer than borrowing another view's key) |
| `settings.astro` | `settings.deleting` „Usuwanie…” | same text in `imports.deleteWaiting` only. Keep it in `copyExtra` (same reasoning) |

#### 1.2 No round-3 key, stays in `copyExtra` (16 leaves)

`auth.{confirmedLogin,occupiedOr,saveNewPassword,doneEyebrow,resetSuccessLead,resetNewError,resent,resendError,saving}`, `settings.{loginData,dataLabel,dangerEyebrow,deleteDialogEyebrow,deleteDialogTitle,deleteDialogBody}`, `emptyViews.body`.

- `auth.saving` „Zapisywanie…” has the same text in `threshold.saving` / `patternActions.saving`, which are domain-unrelated. Keep it.
- `settings.demoLocked` is superseded (§3.3).

#### 1.3 New `app.js`-only literals the slice must add to `copyExtra` verbatim (K11/K13/K15 notes)

- `confirmEmail()` visual panel: „Jeszcze jeden krok” / „Twój rytm zaczyna się od jasności.” / „Potwierdź adres e-mail, aby dokończyć tworzenie konta.” (K13).
- `resetNew()` visual: eyebrow „Spokojnie” and h1 „Hasło można ustawić na nowo.” equal `auth.resetVisual`. The lead differs: „Wybierz nowe hasło, aby wrócić do swojego rytmu.” instead of `auth.resetVisual.lead`. So `/reset/new` needs its own visual object: `{...resetVisual, lead: <app.js lead>}` or a full `copyExtra.auth.resetNewVisual` (K13).
- `resetNew('expired')`: eyebrow „Link wygasł”, lead „Dla bezpieczeństwa link do zmiany hasła działa przez ograniczony czas.”, error alert „Wyślij nowy link, aby kontynuować.”. The h1 is `resetNew.expired` and the button `resetNew.sendNew`.
- `settings()`: „Sesja”, „Zapisz hasło”, „Anuluj” (K15). The e-mail row's „Zmień” stays unrendered (`settings.astro` comment „change e-mail parked”).

#### 1.4 K32: which duplicate

| Surface | Read | Rejected duplicate | Why |
| --- | --- | --- | --- |
| `/settings` password form + dialog | `settings.{currentPassword,newPassword,repeatPassword,passwordSuccess,passwordInvalid,saveError,deletePassword,deleteConfirm,deleteError}` | `authStates.*Password`, `settings.confirmation` | `settings.*` is the screen's own namespace, and `deleteConfirm`/`deletePassword` are the round-3 additions that sit next to `deleteButton`/`deleteDisabledHelp`. Every pair is byte-identical (verified), so nothing renders differently |
| `/reset/new` | `authStates.{newPassword,repeatPassword,passwordMismatch}` | `settings.*` | The recovery screen is not settings. `resetNew.*` has no field labels |

`settings.deleteButton` „Usuń konto” equals `settings.deleteTitle`. Use `deleteButton` for the trigger and the confirm button, and `deleteTitle` for the danger-panel h2. Record the K32 choice in `design-kit.md`.

#### 1.5 Reads outside the slice

| File → symbol | Read | Option |
| --- | --- | --- |
| `src/pages/patterns/[...key].astro`, `ThresholdEditor` and decision-dialog props `saving:` | `copyExtra.auth.saving` | No change needed: the key stays (§1.2) |
| `src/pages/patterns/[...key].astro`, sequence legend `<b>` | `copyExtra.howItWorks.sequenceOver` | If `copyExtra.howItWorks` is deleted, repoint to `copy.patternDetail.sequenceOver` „Ponad próg” (exact, and the detail view's own key). This is a one-line change with no visual effect. Recommended over keeping a dead namespace for one read |
| `patterns.astro`, `fixed.astro`, `imports/index.astro` `<ViewEmpty body>` | `copyExtra.emptyViews.body` | Out of scope (S-14/S-15 views). Keep the key |

### 2. Settings password form: toggle vs. always open (question 2)

- **Kit** (`prototype/app.js` `settings()` + `togglePasswordForm()`):
  - Row `.settings-row.password-row` contains „Hasło” | `<strong>••••••••</strong>` | ghost button „Zmień hasło”.
  - Below it, `<form id="settingsPasswordForm" class="settings-password-form" hidden>` holds the current, new (with the „Pokaż” toggle) and repeat fields, then `.form-actions` with primary „Zapisz hasło” + ghost „Anuluj”.
  - The toggle is DOM-only (`f.hidden = !f.hidden`).
  - Styles (`prototype/styles.css`): `.settings-password-form{border-top:1px solid var(--line);padding:18px 0}`, `.settings-password-form .field{max-width:460px}`, `.form-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:12px}`.
- **States:** `settings()` computes a single `notice` from `?state=`. It renders it as `.inline-alert` **between `.dash-title` and the panel**, and every state view (`settings-password-success/-invalid/-error/-delete-error.html`) shows the form *closed*.
- **App today:** `settings.astro` renders `NewPasswordForm` always open inside the „Hasło” `SettingsRow`, and passes `serverError` into the form (`ServerError`). The success alert already sits above the panel.
- **PRD:** silent on the form layout. Under `## Functional Requirements` → `### Konto`, the PRD has only FR-001 and FR-019. Password change is not mentioned anywhere in `prd.md`.
- **Recommendation:** adopt the toggle. The kit draws it in `settings()` and in 5 state views. Specifics:
  - **Island:** a small island owns the open state (a `SettingsPasswordRow`, or a `collapsible` prop on `NewPasswordForm`).
  - **Field reuse:** reuse `NewPasswordForm` fields with `submit` = „Zapisz hasło” and a cancel button.
  - **Result alerts:** move every result alert (`passwordSuccess`, `passwordInvalid`, `saveError`, `demoPasswordBlocked`, `deleteError`) to the page-level slot above the panel. This is the same slot as today's success alert, rendered with `InlineAlert`.
- **Mapping app errors to kit copy:**
  - `?error=current-password` → `settings.passwordInvalid`.
  - `?error=password` → `settings.saveError`. `api/auth/password.ts` returns it for an invalid payload, for `verifyPassword` returning `null`, and for an `updateUser` failure, so a generic save error fits. The client-side validation still catches short or mismatched passwords before submit.
  - `?error=delete-password` → `settings.passwordInvalid`.
  - `?error=delete` → `settings.deleteError`.
- **Query params stay the app's.** The kit uses `?state=password-success|password-invalid|error|delete-error`. The app's own params are pinned by smoke and by `test/unit/demo.test.ts` (`DEMO_ERROR`). Do not rename them.
- **Delete-error placement:** `DeleteAccountDialog` reopens on `serverError` (`useState(Boolean(serverError))`). The kit closes the modal and shows the alert above the panel (`deleteAccountAction()` → `#/settings?state=delete-error`). Recommendation: follow the kit (page alert, dialog closed). The only cost is that the user reopens the dialog to retry.
- **Smoke impact:** `settings fills the password minimum` (`contains: "co najmniej 6 znaków"`, `notContains: "{n}"`) matches raw HTML. The string is in the island's serialized props (`labels.passwordTooShort`) even if the closed form does not render it, so the step stays green either way. It no longer proves the field is rendered, so note that in the plan.

### 3. Demo account (question 3)

#### 3.1 Wiring

- `src/layouts/AppLayout.astro` takes only `title`/`active` today. It is used by exactly 8 pages: `home`, `patterns`, `patterns/[...key]`, `fixed`, `imports/index`, `imports/new`, `imports/result`, `settings`. All 8 fall under `PROTECTED_ROUTES` in `src/middleware.ts`, so `Astro.locals.user` is set whenever the layout renders.
- `DEMO_EMAIL` is a server secret (`astro.config.mjs` `env.schema`, `envField.string({ context: "server", access: "secret", optional: true })`). `.astro` pages already import it from `astro:env/server` (`imports/index.astro`, `imports/new.astro`).
- The layout can therefore do `const demo = isDemoEmail(Astro.locals.user?.email, DEMO_EMAIL)` with no new prop. Change.md decision 4's reversal condition does not fire.

#### 3.2 Strip markup and text

- Kit `appShell()`: `<div class="demo-notice">` sits between `appHeader()` and `.dash-body` on every app view while `demoMode` is on. `routes.md` § Runda 3 lists `/home?demo=1` „Wspólne konto demo z widoczną notą o ograniczeniach” and `/settings?demo=1`.
- Styles (`prototype/styles.css`): `.demo-notice{padding:11px 24px;background:var(--paper2);border-bottom:1px solid var(--line);font-size:13px;color:var(--ink);text-align:center}`, `.demo-notice:before{… 7px green dot, margin:0 9px 1px 0}`, `.demo-notice~.dash-body .dash-main{padding-top:26px}`. All map to Tailwind names: `bg-paper-soft`, `border-line`, `text-ink`, `bg-green`.
- **Text conflict (three candidates):**
  - `appShell()` literal: „Wspólne konto demo — dodawanie i cofanie importów, zmiana hasła oraz usunięcie konta są wyłączone.”
  - `app.demoNotice`: „Wspólne konto demo — niektóre działania są wyłączone.”
  - `settings.demoNotice`: „To jest wspólne konto demo. Zmiana hasła i usunięcie konta są wyłączone.” `app.js` never renders it.
- **PRD:** has no demo-*account* concept. Under `### Dane demo`, FR-014 covers only the synthetic seed. The PRD neither requires nor forbids listing the blocked actions. `CHANGELOG.md` § Runda 3 says „Konto demo ma stałą notę oraz blokady…” without a wording.
- **Recommendation:** use `app.demoNotice`. It is the content.json key in the shell namespace, which matches the S-13 precedent of content.json over `app.js`. Add a K-row noting the three-way conflict.

#### 3.3 Demo on `/settings` and `/reset/new`

- **Kit `submitPasswordChange()`:** in demo mode, the password form stays enabled and submit shows the toast `settings.demoPasswordBlocked`. The app has no toast, but the server refusal `?error=demo-password` gives an equivalent. Map it to `settings.demoPasswordBlocked` in the page alert.
- **Kit `modal('deleteAccount')` in demo mode:**
  - The password input is `disabled`.
  - The `USUŃ` input stays enabled.
  - The button stays disabled.
  - `<div class="inline-alert info">` `settings.demoDeleteBlocked` follows the button.
- **Recommendation for the dialog:** the page passes `demo` to `DeleteAccountDialog`, which mirrors the kit. This is presentation only: `api/auth/delete.ts` keeps its `isDemoEmail` guard, and the smoke step `demo account deletion is refused` POSTs directly. `?error=demo-delete` maps to `settings.demoDeleteBlocked`.
- **`/reset/new?error=demo`** (`reset/new.astro` reads `copyExtra.settings.demoLocked` today): `settings.demoPasswordBlocked` „Na wspólnym koncie demo zmiana hasła jest wyłączona.” describes exactly that refusal. Recommendation: use it, delete `copyExtra.settings.demoLocked`, and mark the G37 `/reset/new` remainder as closed by kit copy. This revises change.md, which kept a placeholder.
- **F7 (S-13):** the strip is shell-level, and the import pages keep their own inline notes, as `app.js` does. The smoke step `test user import wizard has no demo note` asserts `notContains` the import note text. `app.demoNotice` is different text, so the step stays valid.

### 4. „Wyjdź” and the sign-out redirect (question 4)

- The kit's `appHeader()` holds `brand()` + `<span class="muted">maj 2026</span>` only, with no logout. C2 (`CHANGELOG.md` § Runda 3): „Wylogowanie znajduje się na ekranie ustawień.” content.json has `settings.logoutDecision` „Wylogowanie jest dostępne na ekranie Ustawienia.” (not rendered). `app.exit` „Wyjdź” is still a key, but nothing in `app.js` uses it.
- **Smoke:** no step asserts „Wyjdź”. The coverage grep for „Wyjdź” in `scripts/smoke.mjs` found none.
- **Recommendation:**
  - Remove the `AppHeader.astro` sign-out form.
  - Add the `.settings-row.logout-row` to `settings.astro` as „Sesja” | ghost button `settings.logout` in a `<form method="POST" action="/api/auth/signout">`. `/settings` stays reachable from `Sidebar` („Ustawienia”) and `MobileNav` („Konto”).
  - Styles: `.logout-row{border-top:1px solid var(--line);border-bottom:0!important}`.
- **Redirect:** `src/pages/api/auth/signout.ts` `POST` redirects to `/`. Smoke pins `location: "/"` in 3 steps (`signout clears session`, `signout demo user`, `signout seeded user`), and `location` is a prefix match, so `/login` would fail them. `routes.md` names no post-logout destination, and the PRD never mentions sign-out. The kit's `href="#/login"` is a prototype hash link. Recommendation: keep `/`.
- **PRD tension (recorded, not acted on):** `## Access Control` says „niezalogowany użytkownik nie widzi niczego poza ekranem logowania”. That contradicts the existence of the public pages, which arguably favours `/login`. It is a PRD inconsistency that predates this slice.

### 5. Round-3 styles for public chrome, fields and the modal (question 5)

- **`.nav`:**
  - `@media(max-width:900px)`: `.nav a:nth-child(1){display:none}`. „Jak działa” is already hidden via `max-[899px]:hidden` in `SiteHeader.astro`.
  - Several `@media(max-width:560px)` blocks: `.nav a:nth-child(2){display:none}` (hides „Dla kogo”), `.nav{gap:6px}` then `gap:5px`, `.nav a{font-size:11px;white-space:nowrap}`, `.nav .btn{padding:8px 9px;font-size:11px}`, `.site-header{height:64px}`.
  - `@media(max-width:360px)`: `.nav{gap:3px}`, `.nav a{font-size:10px}`, `.nav .btn{padding:7px 6px;font-size:10px}`.
  - The kit has no `559px` query. The app's convention is `max-[559px]`/`max-[899px]` (`SiteHeader.astro`, `SiteFooter.astro`, `PageTitle.astro`), which differs from the kit only at exactly 560/900 px.
  - Today `SiteHeader.astro` keeps „Dla kogo” at `max-[559px]:text-xs`, and the header height is `max-[559px]:h-[68px]`.
- **`.footer-forwho`:**
  - `.footer-forwho{display:none!important}` by default.
  - In the 560 px block: `.footer{display:flex;flex-direction:column;gap:7px;line-height:1.45;padding-bottom:22px}`, `.footer>span:last-child{display:flex;gap:13px}`, `.footer a{margin:0}`, `.footer .footer-forwho{display:inline!important}`.
  - Kit `footer()` order: „Dla kogo” (first, `#/for-who`), „Prywatność”, „Kontakt”. Keys: `footer.forWho`, `privacy`, `contact`.
  - `SiteFooter.astro` today has no for-who link and uses `max-[559px]:block max-[559px]:leading-loose`.
- **Fields (C3, G32, S-04 F11):**
  - `.field input{…border-radius:8px…}`, plus the round-3 override `.field input,.input-suffix,.modal-input,.password-control,.field select{background:var(--rytm-field)}`. `--rytm-field: var(--rytm-paper)` is already in `src/styles/brand.css`, so the Tailwind name is `bg-paper`.
  - `.modal-input` has radius 8px.
  - `FormField` (`src/components/auth/FormField.tsx`) and the `DeleteAccountDialog` `delete-confirm` input use `rounded-lg` (= `--radius` 14px in `src/styles/global.css`) and `bg-white`.
  - **`FormField` is rendered only by** `SignInForm`, `SignUpForm`, `ResetForm`, `NewPasswordForm` and `DeleteAccountDialog`. `field-styles.ts` names it only in a comment (coverage: `grep -rln FormField src`). So the sweep stays inside S-12's views.
  - **Recommendation for the radius:** use `rounded-[8px]`, which is already used 4 times in `src/`. Do not add a global radius token, since the kit defines none and changing `--radius` would move every `rounded-lg`.
- **Focus ring:** `.field input:focus` stays the literal `rgba(32,47,64,.08)` in round 3. Only `.search-field`/`.select-field` use `--rytm-focus-ring`. `FormField` `focus:ring-ink/8` already matches, so S-04 F3 does not fire.
- **`.modal` (F8):**
  - Round-3 rule: `.modal{width:min(480px,100%);max-height:calc(100vh - 32px);overflow:auto;padding:26px}`, `.modal-backdrop{padding:16px}`, `.modal .btn[disabled]{opacity:.55;cursor:not-allowed}`, and on mobile `.modal{padding:22px 18px;border-radius:12px}`.
  - `src/components/ui/dialog.tsx` `DialogContent` has no `max-h`/`overflow` and keeps `p-[31px]`.
  - Recommendation: add `max-h-[calc(100vh-32px)] overflow-auto` to `DialogContent`. It is now a kit-backed shared rule, closes F8, and moves all four dialogs toward the kit. **The padding changes are not recommended for this slice:** they would visibly change the `/imports` and `/patterns` dialogs, so they become a follow-up with `Trigger: S-14`.
- **`.danger-panel` (C2/K15):** round 3 overrides the border to `var(--rytm-danger-line)` = `--rytm-line`. `src/components/app/Panel.astro` `variantClass` uses `border-excess` today (comment: kit `#d9c2a0` had no token, K15). It should move to `border-line`. `Panel variant="danger"` is used only by `settings.astro` (grep for `variant="danger"`). `.btn-danger` = excess-text background.

### 6. Tests that pin this slice (question 6)

- **`scripts/smoke.mjs`** (matcher: raw-HTML `includes`, `location` prefix). Steps whose text or targets the slice could move:
  - `login shows e-mail confirmed state` „E-mail potwierdzony” (`copyExtra.auth.confirmedLogin`, kept).
  - `confirm-email renders` „Link jest w drodze.”.
  - `reset page uses the round-3 copy` `>Odzyskaj dostęp.<` + „Podaj e-mail, którego używasz w Rytmie.”.
  - `login error shows the restored kit message`.
  - `reset/new without a session is expired` „Ten link już wygasł.” (stays: it is `resetNew.expired`, the h1 in the new layout).
  - `settings renders account e-mail`.
  - `settings fills the password minimum` (see §2).
  - `settings shows password changed` „Hasło zostało zmienione.” (= `settings.passwordSuccess`).
  - `login shows the deleted state` „Konto zostało usunięte.”: a substring of `settings.deletedNotice`, so it stays green.
  - The 3 signout steps (`/`).
  - The demo POST steps and the `/settings?error=…` / `/login?deleted=1` targets.
- **Not covered by smoke:** „Wyjdź”, the footer links, `/how-it-works`, `/for-who`, `/api/auth/resend`, the demo strip, `/reset?sent=1`, `/reset/new?success`, and the `/settings` error copy. The plan should add assertions for the new surfaces: the demo strip on `/home` + `/settings` for the demo user (matching `>…<` if it is not inside an island), its absence for the test user, the `Wyloguj się` row on `/settings`, and the footer `Dla kogo` on `/`.
- **`test/unit/kit-contract.test.ts`:**
  - It pins `copy.authStates.{loginError,resetTitle,resetBody,checkInbox}` (K27), `authStates.passwordTooShort` and `resetNew.lead` containing `{n}`, and `authStates.passwordMinLength === MIN_PASSWORD_LENGTH`.
  - It has no `settings.*`/`confirmEmail.*`/`app.*`/`footer.*` assertions. Per the file's own rule (each assertion maps to a real read), the slice should add `confirmEmail.resendCountdown` containing `{seconds}` (the app fills it) and the `settings.*` keys it starts reading.
- **`test/unit/demo.test.ts`** pins `DEMO_ERROR` URLs, which are unchanged. **`page-show-reset.test.ts`**: `usePageShowReset` is not used by auth/settings components today. If a manual pending flag is added (e.g. the logout button), wire it the same way (bfcache follow-up).
- **pgTAP:** `delete_own_account` is exercised in `domain_rls.test.sql`, `pattern_decisions.test.sql` and `pattern_thresholds.test.sql`. Untouched, since there is no schema change.

### 7. Smaller items (question 7)

- **`resendCountdown`:**
  - `ResendButton.tsx` renders `${label} (${left}s)`.
  - The kit's `startResend()` renders `Wyślij ponownie za ${n} s`, i.e. `confirmEmail.resendCountdown` „Wyślij ponownie za {seconds} s”.
  - Pass the template as a prop and `.replace("{seconds}", String(left))`. `RESEND_COOLDOWN_SECONDS` (60) matches the kit's `n=60`.
  - Not pinned by smoke.
- **`deleteDisabledHelp`** „Przycisk uaktywni się po wpisaniu USUŃ.”: a content.json key with no placement in `app.js` (`grep -c deleteDisabledHelp prototype/app.js` = 0).
  - Recommendation: render it as muted help text under the `USUŃ` input while the button is disabled, and wire it into `aria-describedby`.
  - Record the placement as a K-row ("key without a drawing"). That is a kit-copy gap, not invented UI, so it needs no `DESIGN-GAP` view.
- **Dialog copy:** eyebrow, title and body stay in `copyExtra` (K15). The kit dialog body puts `Wpisz <strong>USUŃ</strong>, aby potwierdzić.` in a separate `<p>` after the password field. Today's dialog concatenates `body + hint` in one `DialogDescription`, so splitting it follows the kit.
- **Stale `DESIGN-GAP` comments:**
  - `settings.astro` header (G23/G24/G37 are now delivered).
  - `DeleteAccountDialog.tsx` „G24 — the kit modal has only the confirmation word”: false since round 3, which draws the password field.
  - The `copy.ts` blocks whose leaves move out.
- **Danger zone copy:** the h2 is `settings.deleteTitle`, the body `settings.deleteBody`, and the eyebrow „Strefa destrukcyjna” stays in `copyExtra`.

## Code References

- `src/layouts/AppLayout.astro` (frontmatter `Props`): where the demo strip and its `isDemoEmail` call go.
- `src/middleware.ts` `PROTECTED_ROUTES`, `onRequest`: guarantee `locals.user` on every AppLayout page.
- `src/lib/demo.ts` `isDemoEmail`, `DEMO_ERROR`.
- `src/components/app/AppHeader.astro`: the sign-out form to remove.
- `src/pages/settings.astro` (`passwordError`, `deleteError`, `NewPasswordForm`/`DeleteAccountDialog` labels).
- `src/components/auth/NewPasswordForm.tsx` `NewPasswordForm` (`current`, `serverError`), `FormField.tsx` `FormField` (input `className`).
- `src/components/settings/DeleteAccountDialog.tsx` `DeleteAccountDialog` (`disabled` predicate, `delete-confirm` input, G24 comment).
- `src/components/auth/ResendButton.tsx` `ResendButton`.
- `src/components/ui/dialog.tsx` `DialogContent`.
- `src/components/marketing/SiteHeader.astro`, `SiteFooter.astro`.
- `src/pages/reset/new.astro` (expired branch, `serverError`), `src/pages/confirm-email.astro` (`visual`), `src/pages/login.astro` (`?deleted`).
- `src/pages/patterns/[...key].astro`: `copyExtra.auth.saving` (2 reads), `copyExtra.howItWorks.sequenceOver` (1 read).
- `src/pages/api/auth/signout.ts` `POST` → `/`. `src/pages/api/auth/password.ts` `POST` error redirects.
- `src/content/copy.ts` `copyExtra`. `design/rytm-os/react-kit/docs/content.json` `settings`, `authStates`, `confirmEmail`, `resetNew`, `app`, `footer`.
- `design/rytm-os/prototype/app.js` `settings`, `togglePasswordForm`, `submitPasswordChange`, `modal('deleteAccount')`, `deleteAccountAction`, `appShell`, `appHeader`, `confirmEmail`, `startResend`, `resetNew`, `applyAuthState`, `header`, `footer`.
- `design/rytm-os/prototype/styles.css` `.settings-password-form`, `.form-actions`, `.logout-row`, `.demo-notice`, `.footer-forwho`, `.nav`, `.field input`, `.modal`.
- `scripts/smoke.mjs` `steps` (names quoted in §6). `test/unit/kit-contract.test.ts`, `test/unit/demo.test.ts`.

## Architecture Insights

- The app keeps its own query-param contract (`?password=changed`, `?error=…`, `DEMO_ERROR`) where the kit uses `?state=`. The rebinding happens at the page level, mapping param to content key. S-13 did the same.
- The copy rule works in tiers: content.json key, then `copyExtra` verbatim from `app.js` with a K-note, then a `DESIGN-GAP`. This slice needs no new `DESIGN-GAP`. The `deleteDisabledHelp` placement and the demo-strip text are K-rows.
- Shell-level chrome (`AppLayout`, `DialogContent`) is touched only where the kit draws a global rule: the demo strip, and `.modal` max-height. View-specific geometry stays with each view's slice.

## Historical Context (from prior changes)

- `context/archive/2026-10-02-kit-round-3-imports/` (S-13): set the content.json-over-`app.js` precedent (`importFlow.demoImportBlocked`) and the F7 note about the demo strip. Supported: the strip does not clash, see §3.3.
- `context/archive/2026-10-02-kit-round-3-intake/` (F-04): K27 intake patch, `kit-contract.test.ts`. K27 fires with no work, since round 3 has no new homes for the 4 keys (change.md, supported).
- S-04 follow-ups F3/F11 (`2026-09-27-pattern-threshold-over-limit`): F11 fires for `FormField` + the dialog input only, and `field-styles.ts` `field` is re-pointed at S-14. F3 does not fire (§5).
- `2026-09-28-durable-pattern-decisions`: F8 `DialogContent` has no `max-h`. Round 3 now supplies the rule (§5).
- Change.md claim "G37 on `/reset/new` stays a placeholder (kit has no copy)": **partly contradicted**. The kit has no `/reset/new` demo view, but `settings.demoPasswordBlocked` is the exact refusal text (§3.3).
- Change.md claim "the kit's expired/success copy is in `app.js` only": supported.

## Related Research

- `context/archive/2026-10-02-kit-round-3-imports/research.md` (sister slice, same run).

## Open Questions

No research question is left open. These are choices the plan makes and records as autonomous decisions:

1. Toggle adoption (recommended yes), and whether `DeleteAccountDialog` closes on server error as the kit does (recommended yes).
2. Demo strip text `app.demoNotice` (recommended) vs. the `app.js` literal. Add a K-row either way.
3. `deleteDisabledHelp` placement (recommended: under the `USUŃ` input while disabled) as a K-row.
4. `DialogContent` max-height now (recommended) with padding deferred to S-14.
5. Repoint `patterns/[...key].astro` `sequenceOver` to `copy.patternDetail.sequenceOver` (recommended) vs. keep `copyExtra.howItWorks`.
6. Header breakpoints: keep the app's `max-[559px]` convention (recommended) vs. the kit's exact 560/360 px values. The 360 px tier can be added as `max-[359px]`.
