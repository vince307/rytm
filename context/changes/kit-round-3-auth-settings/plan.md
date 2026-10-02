# Auth, account settings and public pages on kit round 3 (S-12) — Implementation Plan

## Overview

Bind the public pages (landing, how it works, for who + site header/footer), the auth screens (login, register,
reset, confirm-email, reset/new), the account settings (`/settings` + delete dialog) and the app shell (demo strip,
header) to design kit round 3: kit copy instead of `copyExtra` stand-ins, the round-3 visual panels, a phone-only
„Dla kogo” footer link (C1/G20), the collapsed password form, sign-out on the settings screen (C2), a permanent demo
note in the app shell, `paper` fields with 8 px radius (C3/G32/F11), and a `.modal` max-height (F8). Presentation
only: validation, `MIN_PASSWORD_LENGTH`, the server checks in `api/auth/{password,delete,reset/new}.ts`, the demo
guards, the query-param contract, the sign-out redirect and `checkOrigin` stay the same. No migration.

## Current State Analysis

Source: `research.md` (§1–§7, Code References) and `change.md` (claims table), re-checked in this step against `src/`
and `design/rytm-os/react-kit/docs/content.json`. Anchors are symbols.

- `src/pages/{index,how-it-works,for-who}.astro` read `copyExtra.landing/howItWorks/forWho`; every leaf is
  byte-identical to `copy.*` at the same path. `src/pages/patterns/[...key].astro` also reads
  `copyExtra.howItWorks.sequenceOver` (sequence legend) and `copyExtra.auth.saving` (twice).
- `src/components/marketing/SiteFooter.astro` has only „Prywatność” / „Kontakt”; `SiteHeader.astro` keeps „Dla kogo”
  visible below 560 px (`max-[559px]:text-xs`, header `max-[559px]:h-[68px]`).
- `src/layouts/AppLayout.astro` takes `title`/`active` only; all 8 pages using it are in `PROTECTED_ROUTES`, so
  `Astro.locals.user` is always set. No demo strip exists. `AppHeader.astro` holds the only sign-out
  (`copyExtra.app.exit` „Wyjdź” → `POST /api/auth/signout` → 302 `/`). `Sidebar.astro`/`MobileNav.astro` read
  `copyExtra.app.*` (exact copies; `settingsLong` = `copy.app.settings`).
- `src/pages/settings.astro` (header `DESIGN-GAP: G23/G24/G37`) reads `copyExtra.settings/auth`, renders
  `NewPasswordForm` always open inside the „Hasło” `SettingsRow` with `serverError` inside the form, a success alert
  above the panel, no „Sesja” row. `error=demo-password|demo-delete` → `copyExtra.settings.demoLocked`.
- `src/components/settings/DeleteAccountDialog.tsx` reopens on `serverError` (`useState(Boolean(serverError))`),
  concatenates body + hint in one `DialogDescription`, carries a stale `G24` comment, and its `delete-confirm` input
  is `rounded-lg bg-white`. Disabled predicate: `currentPassword.length === 0 || confirmation.trim() !==
  DELETE_CONFIRM_WORD` (the server re-checks both).
- `src/components/auth/FormField.tsx` input: `rounded-lg` (14 px) + `bg-white`; rendered only by `SignInForm`,
  `SignUpForm`, `ResetForm`, `NewPasswordForm`, `DeleteAccountDialog`. No `disabled` prop.
- `src/components/app/Panel.astro` danger variant uses `border-excess` (comment: K15 no token); round 3
  `--rytm-danger-line` = line. Used only by `settings.astro`.
- `src/components/ui/dialog.tsx` `DialogContent`: no `max-h`/`overflow` (F8), `p-[31px]`.
- `src/pages/reset/new.astro`: visual `copyExtra.auth.resetVisual` (lead is the `/reset` lead), expired state = one
  error alert + button, labels `copyExtra.auth.{newPassword,repeatPassword,passwordsDiffer}`, demo error
  `copyExtra.settings.demoLocked`. `confirm-email.astro` reuses `registerVisual` (K13). `ResendButton.tsx` renders
  `${label} (${left}s)`; kit `confirmEmail.resendCountdown` = „Wyślij ponownie za {seconds} s”.
- `login.astro` `?deleted=1` → `copyExtra.auth.deletedLogin` „Konto zostało usunięte.”.
- `src/components/app/InfoAlert.tsx` (S-13) exists: React twin of `InlineAlert` kind info.
- Register `context/foundation/design-kit.md`: last K id `K33`, last G id `G38`.
- Smoke matcher: raw-HTML `contains` / `notContains`, `location` prefix. Island props serialize the same strings, so
  island-content assertions must match the rendered node (`>text<`). `>Dla kogo<` is also the header nav link, so a
  footer assertion needs a footer-only needle.

## Desired End State

- `/`, `/how-it-works`, `/for-who` read `copy.*` only; footer shows „Dla kogo” first on a phone (≤ 559 px), hidden on
  desktop; the header hides „Dla kogo” ≤ 559 px with the kit's tighter nav, plus a ≤ 359 px tier.
- Every app page: no „Wyjdź” in the header; for the demo account a strip under the header with `app.demoNotice`
  („Wspólne konto demo — niektóre działania są wyłączone.”), absent for anyone else.
- `/settings`: eyebrow/title/lead from `settings.*`; one result alert above the panels for every outcome
  (`passwordSuccess`, `passwordInvalid`, `saveError`, `demoPasswordBlocked`, `deleteError`, `demoDeleteBlocked`);
  „Hasło” row = „••••••••” + „Zmień hasło” that opens the form (current / new with „Pokaż” / repeat, „Zapisz hasło”
  + „Anuluj”); „Przetwarzanie danych” row; „Sesja” row with „Wyloguj się” (POST `/api/auth/signout`, 302 `/`); danger
  panel with `border-line`.
- Delete dialog: eyebrow/title/body (K15), current password (`settings.deletePassword`), separate „Wpisz **USUŃ**,
  aby potwierdzić.” line, `USUŃ` input, muted „Przycisk uaktywni się po wpisaniu USUŃ.” while disabled, button
  `settings.deleteButton`; on a server error the dialog stays closed and the page alert shows; for the demo account
  the password input and button are disabled and an info alert `demoDeleteBlocked` follows the button. Dialog scrolls
  inside `calc(100vh - 32px)`.
- Auth screens: `copy.auth.*` / `authStates.*` / `confirmEmail.*` / `resetNew.*`; `/login?deleted=1` shows
  `settings.deletedNotice`; confirm-email and reset/new have their own visual panels (K13 verbatim from `app.js`);
  reset/new expired = eyebrow „Link wygasł” + h1 `resetNew.expired` + lead + error alert + button; reset/new demo
  error = `settings.demoPasswordBlocked`; resend countdown „Wyślij ponownie za 60 s” at load, counting down. Fields `bg-paper`, 8 px radius.
- `copyExtra` keeps only keys with a reader and a K-note: `auth.{confirmedLogin,occupiedOr,saveNewPassword,
  doneEyebrow,resetSuccessLead,resetNewError,resent,resendError,saving}` + new K13/K15 literals,
  `settings.{loginData,dataLabel,dangerEyebrow,deleteDialogEyebrow,deleteDialogTitle,deleteDialogBody,close,deleting}`
  + new „Sesja”/„Zapisz hasło”/„Anuluj”, `emptyViews.body`. `copyExtra.landing/howItWorks/forWho/app` gone.

### Key Discoveries:

- `AppLayout` can call `isDemoEmail(Astro.locals.user?.email, DEMO_EMAIL)` itself (`DEMO_EMAIL` from
  `astro:env/server`, as `imports/new.astro` does) — no per-page prop.
- Radix `DialogContent` is not server-rendered while closed, so dialog content (demo note, disabled help) cannot be
  proven by smoke → visual gate + reviewer rows. The settings toggle island IS server-rendered closed, so „Zmień
  hasło” and the absence of the `current` input are smoke-provable.
- `settings.passwordSuccess` / `deletedNotice` keep the existing smoke substrings („Hasło zostało zmienione.”,
  „Konto zostało usunięte.”) — no existing assertion needs editing.
- K32 duplicates are byte-identical, so the chosen namespace changes no rendered text.

## What We're NOT Doing

- No server/endpoint change: `api/auth/*` redirects, query params (`?password=changed`, `?error=…`, `DEMO_ERROR`),
  `signout` → `/` stay; no migration, RLS, RPC; no `checkOrigin` change.
- No kit `?state=` params; no toast component (the page alert replaces the kit toast).
- `src/components/app/field-styles.ts` `field` (patterns toolbar, `MonthSelect`) — S-14 (follow-up re-pointed).
- `DialogContent` padding / mobile radius changes and the close icon — follow-up `Trigger: S-14`.
- Shared focus-ring class (S-04 F3) — not fired (`focus:ring-ink/8` = kit `.field input:focus`).
- K27 keys stay in `authStates` (no round-3 home); `kit-contract.test.ts` K27 pins unchanged.
- `copyExtra.emptyViews.body` and `copyExtra.auth.saving` stay (read by S-14/S-15 views).
- Change e-mail (kit „Zmień” on the e-mail row) stays unrendered (parked).
- Editing anything under `design/rytm-os/`, `src/styles/brand.css`; `npm run format`.

## Implementation Approach

Eight small phases (seven code phases plus the register/sweep/visual phase), each green on its own and each removing the `copyExtra` keys whose last reader it rebinds
(`grep` proves no reader is left): public pages (P1), app-shell demo strip (P2), settings page copy + result alerts +
sign-out row (P3), password toggle (P4), delete dialog (P5), auth screens login/register/reset + field styling (P6),
confirm-email + reset/new + resend countdown (P7), then register + seam sweep + visual gate (P8). The header „Wyjdź”
goes in P3, together with the „Sesja” row that replaces it, so no commit leaves the app without sign-out. New UI
components: `DemoNotice.astro` (P2), `SettingsPasswordRow.tsx` (P4) — one per phase at most.

## Critical Implementation Details

**Result alerts on `/settings`.** One `notice` per request, computed from the app's params in this precedence:
`password=changed` → success `passwordSuccess`; `error=current-password` and `delete-password` → `passwordInvalid`;
`password` → `saveError`; `demo-password` → `demoPasswordBlocked`; `delete` → `deleteError`; `demo-delete` →
`demoDeleteBlocked` (errors as kind `error`, demo refusals as kind `info`, matching the kit's `.inline-alert.info` in
the demo modal). Rendered with `InlineAlert` between `PageTitle` and the first panel (kit `settings()` places it
between `.dash-title` and the panel). Neither the password form nor the dialog receives `serverError` any more.

**Demo dialog.** `demo` comes from the page (`isDemoEmail(...)`), never from the client. Password input disabled,
`USUŃ` input enabled, button disabled regardless of input, `InfoAlert` with `demoDeleteBlocked` after the button
(kit order). The server guard in `api/auth/delete.ts` stays the protection; smoke `demo account deletion is refused`
POSTs directly and must stay green.

**Footer smoke needle.** The footer „Dla kogo” assertion must not be satisfiable by the header's `>Dla kogo<`; the P1
deliberate break (remove the footer link, header untouched) must turn it red. Pick the needle accordingly (e.g. the
footer link plus its following „Prywatność” sibling as rendered), never a bare `Dla kogo`.

## Phase 1: Public pages and site chrome

### Overview

Pure copy rebind of the three public pages, the phone-only footer link and the kit's header rules below 560 px.
No new UI component.

### Changes Required:

#### 1. Public pages copy

**File**: `src/pages/index.astro`, `src/pages/how-it-works.astro`, `src/pages/for-who.astro`,
`src/pages/patterns/[...key].astro`, `src/content/copy.ts`

**Intent**: Read the kit keys that now exist; drop the stand-ins.

**Contract**: `x = copyExtra.landing|howItWorks|forWho` → `copy.landing|howItWorks|forWho` (same leaf names);
`patterns/[...key].astro` sequence legend → `copy.patternDetail.sequenceOver` (same text „Ponad próg”; its
`copyExtra.auth.saving` reads stay). Delete `copyExtra.landing`, `copyExtra.howItWorks`, `copyExtra.forWho`.

#### 2. Footer and header

**File**: `src/components/marketing/SiteFooter.astro`, `src/components/marketing/SiteHeader.astro`

**Intent**: C1/G20 — „Dla kogo” moves from the phone header to the phone footer, as kit `footer()` / `.nav` rules.

**Contract**: footer: first link `copy.footer.forWho` → `/for-who`, `hidden` above 559 px, inline ≤ 559 px; ≤ 559 px
the footer is a column (gap 7 px, line-height 1.45, bottom padding 22 px) with the links in a flex row gap 13 px
(kit 560 px block). Header ≤ 559 px: „Dla kogo” hidden, height 64 px, nav gap 5 px, links/buttons 11 px with kit
button padding 8/9 px; new ≤ 359 px tier: gap 3 px, 10 px, padding 7/6 px. Keep the app's `max-[559px]`/`max-[899px]`
convention (decision 6).

#### 3. Smoke

**File**: `scripts/smoke.mjs`

**Contract**: +3: `how-it-works renders` `>Trzy spokojne kroki.<`; `for-who renders` `>Rytm pasuje do Twojego
tempa.<`; `landing footer links for-who` (footer-only needle, see Critical Implementation Details).

### Success Criteria:

#### Automated Verification:

- `npm test`: baseline, 0 failed
- Smoke baseline + 3 PASS, 0 FAIL; no existing assertion edited
- `grep -rn "copyExtra\.\(landing\|howItWorks\|forWho\)" src` empty
- Deliberate break: remove the footer link → the footer smoke step red while the header still renders „Dla kogo”; restore. Meta-check recorded: proves the needle is footer-only, not the CSS visibility (visual row)
- Full local gate vs baseline (lint, astro check, fixture:check, vitest, build, pgTAP Δ0, smoke + 3)

#### Manual Verification:

- [reviewer] Public pages read only `copy.*`; header/footer classes match the kit 560/360 rules within the app's breakpoint convention

---

## Phase 2: Demo strip in the app shell

### Overview

The kit `appShell()` `.demo-notice` strip for the shared demo account, and the `app.*` rebind except `exit` (P3).
One new UI component: `DemoNotice.astro`.

### Changes Required:

#### 1. Demo strip

**File**: `src/components/app/DemoNotice.astro` (new), `src/layouts/AppLayout.astro`

**Intent**: A permanent note on every app view for the demo account (roadmap outcome, CHANGELOG § Runda 3).

**Contract**: `DemoNotice` renders kit `.demo-notice`: full-width under `AppHeader`, `bg-paper-soft`, bottom
`border-line`, 13 px `text-ink`, centred, padding 11/24 px, a 7 px `bg-green` dot before the text; text prop.
`AppLayout` computes `demo = isDemoEmail(Astro.locals.user?.email, DEMO_EMAIL)` and renders
`<DemoNotice text={copy.app.demoNotice} />` only when `demo`; `main` top padding 26 px when the strip shows (kit
`.demo-notice~.dash-body .dash-main`).

#### 2. App navigation copy

**File**: `src/components/app/Sidebar.astro`, `src/components/app/MobileNav.astro`, `src/content/copy.ts`

**Contract**: `copyExtra.app.{overview,patternsLong,fixedLong,sidebarView,sidebarData,importsLong,navLabel}` →
`copy.app.*`; `settingsLong` → `copy.app.settings`. Delete those keys; `copyExtra.app.exit` stays until P3.

#### 3. Smoke

**File**: `scripts/smoke.mjs`

**Contract**: +3: in the demo block after `demo user signs in`: `demo home shows the demo note` and `demo settings
shows the demo note` (`>Wspólne konto demo — niektóre działania są wyłączone.<`); in the test-user block: `home has
no demo note for the test user` (`notContains` the same node).

### Success Criteria:

#### Automated Verification:

- `npm test`: Phase 1 count, 0 failed
- Smoke Phase 1 count + 3 PASS, 0 FAIL
- `grep -n "settingsLong\|sidebarView\|navLabel" src/content/copy.ts` empty
- Deliberate break: `demo` hard-coded `false` → both demo-note steps red; `true` → the test-user `notContains` red; restore. Meta-check recorded: the server-guard demo steps stay green in both breaks, so the new steps prove the shell gating only
- Full local gate vs baseline (smoke + 6)

#### Manual Verification:

- [reviewer] `DemoNotice` uses only Tailwind color names; the strip does not duplicate the import pages' own demo notes (S-13 F7)

---

## Phase 3: Settings copy, result alerts and the sign-out row

### Overview

`/settings` reads `settings.*` (K32), every result shows one alert above the panels, the „Sesja” row replaces the
header „Wyjdź”, the danger panel border becomes `line`. The password form stays open in this phase (P4 collapses
it). No new UI component.

### Changes Required:

#### 1. Settings page

**File**: `src/pages/settings.astro`, `src/content/copy.ts`

**Intent**: Kit copy and kit alert placement; C2 sign-out.

**Contract**: `PageTitle` eyebrow/lead `settings.eyebrow/lead`; row labels `auth.fields.email/password`; password
form labels `settings.{currentPassword,newPassword,repeatPassword}`, `authStates.passwordMismatch`,
`auth.passwordPlaceholder`; notice per Critical Implementation Details (password and delete outcomes, both in this
phase — the dialog still gets its own `serverError` until P5, so delete errors show twice in this phase only; P5
removes the dialog copy). New row after „Przetwarzanie danych”: label `copyExtra.settings.session` „Sesja” (K15
note), ghost button `settings.logout` in `<form method="POST" action="/api/auth/signout">`, kit `.logout-row` (top
border `line`, no bottom border). Header comment rewritten (no stale G23/G24/G37). Delete `copyExtra.settings.
{eyebrow,lead,emailLabel,passwordLabel,changePassword,currentPasswordWrong,passwordChanged}` and any key left without
a reader (`demoLocked` stays until P7: `reset/new.astro`; `currentPassword`, `deleteError` stay until P5).

#### 2. Header and danger panel

**File**: `src/components/app/AppHeader.astro`, `src/components/app/Panel.astro`, `src/content/copy.ts`

**Contract**: remove the sign-out form from `AppHeader` (brand + month stay); delete `copyExtra.app.exit` (and
`copyExtra.app` if empty). `Panel` danger `border-excess` → `border-line`, comment → round-3 `--rytm-danger-line`.

#### 3. Kit contract + smoke

**File**: `test/unit/kit-contract.test.ts`, `scripts/smoke.mjs`

**Contract**: kit-contract: the `settings.*` keys this slice reads exist and are non-empty (`logout`,
`passwordSuccess`, `passwordInvalid`, `saveError`, `demoPasswordBlocked`, `demoDeleteBlocked`, `deleteError`,
`deletePassword`, `deleteConfirm`, `deleteButton`, `deleteDisabledHelp`, `deletedNotice`) and `settings.deleteConfirm`
contains `DELETE_CONFIRM_WORD`. Smoke +4: `settings offers sign-out` `>Wyloguj się<`; `home header has no exit
button` `notContains` `>Wyjdź<`; `settings shows the save error` (`/settings?error=password`, `>Nie udało się zapisać
zmian. Spróbuj ponownie.<`); `settings shows the demo password refusal` (`/settings?error=demo-password`, `>Na
wspólnym koncie demo zmiana hasła jest wyłączona.<`).

### Success Criteria:

#### Automated Verification:

- `npm test`: Phase 2 count + new kit-contract cases, 0 failed
- Smoke Phase 2 count + 4 PASS, 0 FAIL; the 3 `signout …` steps still 302 `/`
- `grep -n "DESIGN-GAP" src/pages/settings.astro` empty; `grep -rn "copyExtra.app" src` empty
- Deliberate break: `error=password` mapped back to `copyExtra.auth.resetNewError` → the save-error step red; restore
- Deliberate break: remove the „Sesja” form → `settings offers sign-out` red; restore. Meta-check recorded: the step proves the button renders, not that it signs out — the signout endpoint steps prove the POST
- Full local gate vs baseline (smoke + 10)

#### Manual Verification:

- [reviewer] Exactly one alert renders per param; demo refusals are `info`, errors `error`; logout form is a plain POST (no `checkOrigin` change)

---

## Phase 4: Collapsed password form

### Overview

The kit's toggle: „••••••••” + „Zmień hasło” opens the form with „Zapisz hasło” + „Anuluj”. One new UI component:
`SettingsPasswordRow.tsx`.

### Changes Required:

#### 1. Toggle island

**File**: `src/components/settings/SettingsPasswordRow.tsx` (new), `src/components/auth/NewPasswordForm.tsx`

**Intent**: Kit `settings()` + `togglePasswordForm()`; the open state lives in the island.

**Contract**: `SettingsPasswordRow({ labels, formLabels })` renders the row value `<strong>••••••••</strong>` (the
masked value = `copy.auth.passwordPlaceholder`) and a ghost button `settings.changePassword` (`aria-expanded`,
`aria-controls`); when open, below the row, `NewPasswordForm` with `current`, `action="/api/auth/password"`, submit
„Zapisz hasło”, and a new optional `cancel?: { label: string; onCancel: () => void }` prop on `NewPasswordForm`
rendering a ghost button next to submit (kit `.form-actions`: flex, gap 10 px, wrap, margin-top 12 px). Cancel
closes and clears the fields (unmount). Closed by default in every state (kit state views). Kit
`.settings-password-form`: top border `line`, padding 18 px 0, fields max-width 460 px. `/reset/new` usage of
`NewPasswordForm` unchanged (no `cancel`). If a manual pending flag is introduced, wire `usePageShowReset`.

#### 2. Page and copy

**File**: `src/pages/settings.astro`, `src/content/copy.ts`

**Contract**: the „Hasło” `SettingsRow` content → `<SettingsPasswordRow client:load …>`. New `copyExtra.settings.
{savePassword: "Zapisz hasło", cancel: "Anuluj"}` verbatim from `app.js` `settings()` (K15 note).

#### 3. Smoke

**File**: `scripts/smoke.mjs`

**Contract**: +1: `settings password form starts closed` — `/settings` contains `>Zmień hasło<` and `notContains`
`id="current"`. Note in a comment that `settings fills the password minimum` now matches the serialized prop only.

### Success Criteria:

#### Automated Verification:

- `npm test`: Phase 3 count, 0 failed
- Smoke Phase 3 count + 1 PASS, 0 FAIL
- Deliberate break: initial open state `true` → the new step red (`id="current"` rendered); restore. Meta-check recorded: proves the default state only; open/cancel behaviour is client-side (visual row)
- Full local gate vs baseline (smoke + 11)

#### Manual Verification:

- [reviewer] `NewPasswordForm` on `/reset/new` renders as before; cancel unmounts the form (no stale values); `aria-expanded` follows the state

---

## Phase 5: Delete dialog on kit round 3

### Overview

Kit modal copy and order, `deleteDisabledHelp`, demo state, closed on server error, `paper`/8 px input, `.modal`
max-height. No new UI component (reuses `InfoAlert`).

### Changes Required:

#### 1. Dialog

**File**: `src/components/settings/DeleteAccountDialog.tsx`, `src/components/auth/FormField.tsx`

**Intent**: Kit `modal('deleteAccount')`; server-error alerts live on the page (P3).

**Contract**: remove `serverError` (and `ServerError`); `useState(false)`. Order: eyebrow, title,
`DialogDescription` = body only; form: password `FormField` (`settings.deletePassword`), a `<p>` with
`settings.deleteConfirm` split at `DELETE_CONFIRM_WORD` (bold word, `id` = the confirm input's
`aria-describedby`), `USUŃ` input (`bg-paper`, `rounded-[8px]`), muted 12 px help `settings.deleteDisabledHelp`
shown while the button is disabled (added to `aria-describedby`), danger button `settings.deleteButton`. New props
`demo: boolean`, `labels.demoNote`, `labels.disabledHelp`: when `demo`, password field disabled, button disabled,
help hidden, `InfoAlert` `demoNote` after the button. `FormField` gains an optional `disabled` prop. Remove the
stale `G24` comment.

#### 2. Page wiring and modal height

**File**: `src/pages/settings.astro`, `src/components/ui/dialog.tsx`, `src/content/copy.ts`

**Contract**: page passes `demo = isDemoEmail(Astro.locals.user?.email, DEMO_EMAIL)` and the new labels
(`settings.demoDeleteBlocked`, `settings.deleteDisabledHelp`), trigger + confirm `settings.deleteButton`, h2 stays
`settings.deleteTitle`; the dialog's `passwordPlaceholder` → `copy.auth.passwordPlaceholder` and its confirm line →
`settings.deleteConfirm` (no `copyExtra.auth.passwordPlaceholder` / `settings.confirmation` read left on `/settings`,
so P6/P7 can delete `copyExtra.auth.passwordPlaceholder`; plan review F2). `DialogContent` gains `max-h-[calc(100vh-32px)] overflow-auto` (kit round-3 `.modal`; closes
F8 — padding unchanged). Delete `copyExtra.settings.{currentPassword,deleteError}` if unread.

#### 3. Smoke

**File**: `scripts/smoke.mjs`

**Contract**: +3 (test user): `settings shows the delete error` (`?error=delete`, `>Nie udało się usunąć konta.
Spróbuj ponownie.<`), `settings shows the wrong-password delete error` (`?error=delete-password`, `>Obecne hasło jest
nieprawidłowe.<`), `settings shows the demo delete refusal` (`?error=demo-delete`, `>Na wspólnym koncie demo
usunięcie konta jest wyłączone.<` — the same text sits in the dialog's serialized `demoNote` prop, so the `>…<`
anchors are mandatory).

### Success Criteria:

#### Automated Verification:

- `npm test`: Phase 4 count, 0 failed
- Smoke Phase 4 count + 3 PASS, 0 FAIL; existing delete steps (missing `current`, wrong password, demo refused, success → `/login?deleted=1`) unchanged and green
- `grep -n "G24\|serverError" src/components/settings/DeleteAccountDialog.tsx` empty
- Deliberate break: bare-text needle (no `>`) for the demo-delete step passes for a page WITHOUT `?error=demo-delete` → proves why the anchor is needed; restore the anchored needle and confirm it is red without the param. Meta-check recorded
- Deliberate break: remove the server `USUŃ` check in `api/auth/delete.ts` → smoke `delete without confirm word is rejected` red (proves the client lock did not become the only guard); restore, then `npx supabase db reset` (the break deletes a smoke user)
- Full local gate vs baseline (smoke + 14)

#### Manual Verification:

- [reviewer] Server checks in `api/auth/delete.ts` untouched; demo flag comes from the page only; `aria-describedby` names the hint and the help

---

## Phase 6: Login, register, reset and field styling

### Overview

Rebind the three form screens to kit keys, the deleted-account note to `settings.deletedNotice`, and the C3/F11
field look in `FormField`. No new UI component.

### Changes Required:

#### 1. Pages

**File**: `src/pages/login.astro`, `src/pages/register.astro`, `src/pages/reset.astro`, `src/content/copy.ts`

**Contract**: `copyExtra.auth.{loginVisual,registerVisual,resetVisual,forgotPassword,emailPlaceholder,
passwordPlaceholder,noAccount,createIt,optional,namePlaceholder,terms,haveAccount,backToLogin,resetEyebrow,
sendInstructions}` → `copy.auth.*`; reset sent state `checkInboxEyebrow/Title` → `confirmEmail.eyebrow/title`;
`?deleted=1` → `settings.deletedNotice`. Delete the rebound keys and `deletedLogin` (+ its `G24` comment) when
unread (`resetVisual`/`registerVisual`/`passwordPlaceholder` may still be read by P7 pages — remove in P7 then).

#### 2. Field styling

**File**: `src/components/auth/FormField.tsx`

**Contract**: input `rounded-lg bg-white` → `rounded-[8px] bg-paper` (kit `.field input` radius 8 px, round-3
`--rytm-field` = paper); focus ring unchanged.

#### 3. Smoke

**File**: `scripts/smoke.mjs`

**Contract**: +1: `login shows the full deleted notice` (`/login?deleted=1`, rendered node of
`settings.deletedNotice`). Existing `login shows the deleted state` stays (substring).

### Success Criteria:

#### Automated Verification:

- `npm test`: Phase 5 count, 0 failed
- Smoke Phase 5 count + 1 PASS, 0 FAIL; auth smoke steps (sign-in, sign-up, occupied, reset) unchanged and green
- `grep -n "bg-white\|rounded-lg" src/components/auth/FormField.tsx` empty
- Deliberate break: `?deleted=1` mapped back to `settings.deleteSuccess` → the new step red, the old substring step green; restore. Meta-check recorded: shows the old step could not detect this rebind
- Full local gate vs baseline (smoke + 15)

#### Manual Verification:

- [reviewer] Login/register/reset read only `copy.*` plus K11 keys; no other `bg-white` field left in the slice's components

---

## Phase 7: Confirm-email, reset/new and the resend countdown

### Overview

Own visual panels (K13), the kit's expired layout, the demo refusal on `/reset/new` with kit copy (closes G37),
`resetNew` labels from `authStates.*` (K32), and the kit countdown template. No new UI component.

### Changes Required:

#### 1. Confirm-email and resend

**File**: `src/pages/confirm-email.astro`, `src/components/auth/ResendButton.tsx`, `src/content/copy.ts`

**Contract**: visual = new `copyExtra.auth.confirmEmailVisual` {„Jeszcze jeden krok”, „Twój rytm zaczyna się od
jasności.”, „Potwierdź adres e-mail, aby dokończyć tworzenie konta.”} (verbatim `app.js` `confirmEmail()`, K13
note). `ResendButton` gains `countdown: string` (template) and renders `countdown.replace("{seconds}",
String(left))` while counting; page passes `copy.confirmEmail.resendCountdown`. The island server-renders its initial
state, so on `?resent=1` with the pending cookie the SSR HTML already holds „Wyślij ponownie za 60 s”
(`RESEND_COOLDOWN_SECONDS` = 60; plan review F1).

#### 2. Reset/new

**File**: `src/pages/reset/new.astro`, `src/content/copy.ts`

**Contract**: visual = new `copyExtra.auth.resetNewVisual` (`resetVisual` eyebrow/title + lead „Wybierz nowe hasło,
aby wrócić do swojego rytmu.”, K13). Expired: eyebrow `copyExtra.auth.expiredEyebrow` „Link wygasł”, h1
`resetNew.expired`, lead `copyExtra.auth.expiredLead` „Dla bezpieczeństwa link do zmiany hasła działa przez
ograniczony czas.”, error alert `copyExtra.auth.expiredAlert` „Wyślij nowy link, aby kontynuować.”, button
`resetNew.sendNew` (all verbatim `app.js` `resetNew('expired')`, K11 note). Labels `authStates.{newPassword,
repeatPassword,passwordMismatch}`; `?error=demo` → `settings.demoPasswordBlocked`. Delete `copyExtra.settings.
demoLocked` and its `G37` comment, `copyExtra.auth.{newPassword,repeatPassword,passwordsDiffer}` and any key left
unread (`resetVisual`, `registerVisual`, `passwordPlaceholder` if P6 left them).

#### 3. Kit contract + smoke

**File**: `test/unit/kit-contract.test.ts`, `scripts/smoke.mjs`

**Contract**: kit-contract: `confirmEmail.resendCountdown` contains `{seconds}`; `authStates.{newPassword,
repeatPassword,passwordMismatch}` non-empty. Smoke +3: `reset/new expired shows the kit layout` (`/reset/new`
without session, `>Link wygasł<` and the lead node); `confirm-email shows its own panel` (`>Jeszcze jeden krok<`);
`confirm-email resent shows the kit countdown` (`/confirm-email?resent=1` placed right after `signup creates account`,
while the smoke cookie jar still holds `rytm-pending-email`; `>Wyślij ponownie za 60 s<` — the serialized prop holds
only the `{seconds}` template, so the filled node is island content, not props). Existing `reset/new without a
session is expired` stays.

### Success Criteria:

#### Automated Verification:

- `npm test`: Phase 6 count + new kit-contract cases, 0 failed
- Smoke Phase 6 count + 3 PASS, 0 FAIL
- `grep -rn "demoLocked\|passwordsDiffer\|DESIGN-GAP: G37" src` empty
- Deliberate break: `confirmEmail.resendCountdown` placeholder renamed in a test copy of the object (or the assertion pointed at `{n}`) → kit-contract red; restore. Meta-check recorded: proves the template key, not `ResendButton` rendering (client-only → visual row)
- Deliberate break: expired branch without the eyebrow → the new expired step red; restore
- Deliberate break: `ResendButton` back to `${label} (${left}s)` → `confirm-email resent shows the kit countdown` red; restore. Meta-check recorded: proves the SSR initial state; the tick-down stays client-only (visual row)
- Full local gate vs baseline (smoke + 18)

#### Manual Verification:

- [reviewer] `/reset/new?error=demo` (recovery session on the demo account) shows `demoPasswordBlocked`; `ResendButton` countdown reads „Wyślij ponownie za 60 s” at load on `?resent=1` and counts down

---

## Phase 8: Gap register, seam sweep and visual gate

### Overview

Register statuses and the new kit-author row, follow-ups, a sweep for seams left by P1–P7, and the screenshot gate.
No product behaviour change.

### Changes Required:

#### 1. Register

**File**: `context/foundation/design-kit.md`

**Contract**: round-3 table: K11 (auth/landing/howItWorks/forWho) — S-12 part adopted, kept `copyExtra.auth/settings`
keys listed; K13 partial (confirm-email + reset/new panels only in `app.js`); K14, K15 (danger border now
`--rytm-danger-line`; eyebrow/dialog strings + „Sesja”/„Zapisz hasło”/„Anuluj” still `app.js`-only), G20, G23, G24,
G32, G37 (settings + reset/new) → adopted in S-12; K27 stays partial (fired, no move); K32 note: `/settings` reads
`settings.*`, `/reset/new` reads `authStates.*`. New row `K34` for the kit author: demo-strip text three-way conflict
(`appShell()` literal vs `app.demoNotice` vs unrendered `settings.demoNotice`; app uses `app.demoNotice`);
`settings.deleteDisabledHelp` has no placement in `app.js` (app: under the `USUŃ` input); unrendered keys
`settings.logoutDecision`, `settings.deleteCurrentPassword`, `settings.deleteSuccess`; reset/new expired copy and K13
panels only in `app.js`. Round-4 list gains K34.

#### 2. Seam sweep

**File**: `src/content/copy.ts`, `src/pages/{settings,login,register,reset,confirm-email,index,how-it-works,
for-who}.astro`, `src/pages/reset/new.astro`, `src/components/{auth,settings,marketing,app}/*`, `scripts/smoke.mjs`

**Intent**: Leave no half-removed seam from P1–P7.

**Contract**: every remaining `copyExtra.auth/settings` key has a reader (grep per key); no duplicated helper (one
param→notice mapping on `/settings`; no second masked-value constant; no copy of the field classes outside
`FormField` + the dialog input); no stale comment naming „Wyjdź”, `deletedLogin`, `demoLocked`, `K13 — reuses`,
`G23/G24/G37/G20/G32` in the slice's files; header comments of `settings.astro`, `reset/new.astro`,
`confirm-email.astro`, `Panel.astro`, `DeleteAccountDialog.tsx` describe round 3; `smoke.mjs` comments match.

#### 3. Follow-ups

**File**: `context/changes/kit-round-3-auth-settings/follow-ups/review-fixes.md` (new)

**Contract**: (a) S-04 F11 remainder: `field-styles.ts` `field` → 8 px / paper, `Trigger: S-14`; (b) `DialogContent`
kit padding 26 px / mobile 22×18 px + 12 px radius, `Trigger: S-14`; (c) a „Resolved in S-12” note for the
archived `2026-09-28-durable-pattern-decisions` F8 (`DialogContent` scroll, closed by P5) and S-04 F11's `FormField` /
dialog-input part, so later trigger greps see them closed (archives stay read-only); plus anything the visual gate
defers, each with a `Trigger:` line.

### Success Criteria:

#### Automated Verification:

- Every `copyExtra.auth` / `copyExtra.settings` key has ≥ 1 reader outside `copy.ts` (scripted grep, zero unused)
- Seam greps empty in `src/`: `copyExtra.app`, `copyExtra.landing`, `copyExtra.howItWorks`, `copyExtra.forWho`, `deletedLogin`, `demoLocked`, `DESIGN-GAP: (G20|G23|G24|G32|G37)`
- `git diff --stat main -- design/ src/styles/brand.css` empty
- Deliberate break: re-add `copyExtra.settings.demoLocked` → the unused-key grep reports it; restore (meta-check: proves the grep guards a half-removed seam, not a test)
- Full local gate vs baseline (smoke + 18)

#### Manual Verification:

- [visual] Screenshots at 1280 px and ~400 px on `astro dev` :4399 (test account; demo account for demo states), compared with kit views: `/` (`landing.html`, footer „Dla kogo” only at 400 px, header without it), `/how-it-works`, `/for-who`; `/login`, `?confirmed=1`, `?deleted=1`, `?error=…` (login error); `/register`, `?error=occupied`; `/confirm-email` (with and without the pending cookie, `?resent=1` countdown, `?error`); `/reset`, `?sent=1`; `/reset/new` form, expired, `?success=1`; `/settings` default (form closed), form open, form open with a client validation error, `?password=changed`, `?error=current-password`, `?error=password`, `?error=delete`, `?error=delete-password`; delete dialog open — empty (help visible, button disabled), filled (button enabled), and at a ~400×640 viewport (F8 scroll); demo account: `/home` and `/settings` with the strip, `?error=demo-password`, `?error=demo-delete`, delete dialog demo state (password disabled, info note); `/imports/new` on the demo account (strip + S-13 note do not clash); `max-h` regression check at 400 px: one import delete dialog and the pattern-actions dialog with the merge picker revealed; no `undefined`, no raw `{…}`, no horizontal scroll at 360 px header tier
- [reviewer] Seam sweep complete; register rows match this plan; follow-ups carry `Trigger:` lines
- [human] Accept S-12 product-visible choices: header „Wyjdź” removed (sign-out only on `/settings`, decision 3); password form collapsed behind „Zmień hasło”, so it needs JavaScript (decision 2, Known risks); delete dialog closes on a server error and the alert shows on the page (decision 4); demo strip shows the short `app.demoNotice`, not the kit `app.js` sentence listing the blocked actions (decision 5); sign-out still redirects to `/` despite the PRD `## Access Control` line (decision 7); `/login?deleted=1` shows the longer `settings.deletedNotice` — and send K34 to the kit author

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual
confirmation from the human that the manual testing was successful before proceeding.

---

## Testing Strategy

### Unit Tests:

- `kit-contract.test.ts`: `settings.*` keys read on `/settings` + `deleteConfirm` contains `DELETE_CONFIRM_WORD`
  (P3); `confirmEmail.resendCountdown` `{seconds}`, `authStates.{newPassword,repeatPassword,passwordMismatch}` (P7).
  K27 pins unchanged. No React component test infrastructure exists, so island behaviour is covered by smoke
  (server-rendered state) and the visual gate (client state).

### Integration Tests:

- Smoke: + 18 net (P1 +3, P2 +3, P3 +4, P4 +1, P5 +3, P6 +1, P7 +3), no existing assertion edited; server-contract
  steps (signout `/`, delete guards, demo refusals) unchanged.
- pgTAP unchanged (no schema change).

### Manual Testing Steps:

1. `npx supabase start`, `ASTRO_DEV_BACKGROUND=1 npx astro dev --port 4399 --ignore-lock`.
2. Walk the public pages and auth screens at 1280 and ~400 px; trigger each `/settings` param by URL.
3. Sign in as the test user: open/cancel the password form, open the delete dialog (do not submit). Sign in as the
   demo user for the strip and demo states. Kill the dev server.

## Known risks

- Collapsing the form removes the only rendered proof of the password fields from smoke (`settings fills the
  password minimum` then matches serialized props only) — accepted; P4 adds the closed-state step, the visual gate
  covers the open state.
- `DialogContent` max-height applies to the S-13/S-14 dialogs too; invisible unless content overflows (kit-backed
  rule). The visual gate checks one import dialog and the pattern-actions dialog with the merge picker revealed (the
tallest shared dialog) at 400 px for regressions (plan review F5).
- P3 shows a delete error twice (page alert + reopened dialog) until P5 lands — intermediate only, never shipped.
- Without JavaScript the collapsed password form cannot be opened (today it degrades to a plain POST); the delete
  dialog was already JS-only (S-08 impl-review). Accepted as the kit's own toggle behaviour; sign-out stays a plain
  POST form that works without JS. Product-visible → part of `[human]` row 8.8 (plan review F3).
- `?error=current-password` and `?error=delete-password` render the same page alert („Obecne hasło jest
  nieprawidłowe.”) with no hint which form failed — kit copy has one string for both; recorded, not changed (plan
  review F4).

## Performance Considerations

None — copy and class changes; one `isDemoEmail` string compare per app render.

## Migration Notes

None. Rollback = revert the merge.

## Autonomous decisions

Recorded in place of the skill's questions (run contract rule 1). No decision departs from the PRD's literal text
(the PRD is silent on password change, sign-out, the demo account and the public pages); the product-visible choices
are collected in the Phase 8 `[human]` row.

| # | Decision | Chosen | Rejected | Why | What would change it |
| --- | --- | --- | --- | --- | --- |
| 1 | Complexity / questions | MEDIUM, 0 questions | Interview | Research answered every open question with a recommendation; remaining choices are reversible presentation | A product owner available |
| 2 | Password form | Kit toggle, closed by default, „Zapisz hasło”/„Anuluj” in `copyExtra` | Always open (today) | Kit draws it in `settings()` and 5 state views | Maintainer finds the extra click harmful (reverse via the `[human]` row) |
| 3 | Header „Wyjdź” | Removed; „Sesja” row on `/settings` | Keep both | C2, `settings.logoutDecision`, kit `appHeader()` has no logout; MobileNav „Konto” reaches settings in one tap | Maintainer finds sign-out too hidden |
| 4 | Delete server error | Dialog stays closed, page alert | Reopen the dialog (today) | Kit `deleteAccountAction()` → `settings?state=delete-error`; one alert slot for every outcome | Reviewer requires retry inside the dialog |
| 5 | Demo strip text | `app.demoNotice` | `appShell()` literal; `settings.demoNotice` | content.json over `app.js` (S-13 precedent); shell namespace | Kit author fixes the text (K34) |
| 6 | Header breakpoints | App `max-[559px]` + new `max-[359px]` tier with kit values | Kit exact 560/360 | App convention; differs only at exactly 560/360 px | A visual-gate mismatch at those widths |
| 7 | Sign-out redirect | `/` (unchanged) | `/login` | Smoke pins `/` ×3; routes.md and PRD silent; kit `#/login` is a prototype hash link | Maintainer resolves the PRD Access Control tension toward `/login` |
| 8 | `/reset/new?error=demo` | `settings.demoPasswordBlocked` (closes G37) | Keep `copyExtra.settings.demoLocked` | Kit copy describing exactly that refusal | Kit adds a dedicated reset/new demo key |
| 9 | `deleteDisabledHelp` | Muted help under the `USUŃ` input while disabled, in `aria-describedby`; K34 row | Not rendered | Key delivered without a drawing; placing kit copy is not inventing UI | Kit author draws a placement |
| 10 | F8 | `DialogContent` max-height now, padding → follow-up S-14 | Both now; neither | Max-height invisible unless overflow; padding visibly changes other views' dialogs | S-14 plan sweeps dialog geometry anyway |
| 11 | `sequenceOver` read in `patterns/[...key].astro` | Repoint to `copy.patternDetail.sequenceOver` | Keep `copyExtra.howItWorks` alive | Same text, the view's own key, lets the namespace go | — |
| 12 | K32 | `/settings` → `settings.*`; `/reset/new` → `authStates.*` | The other duplicate | Each screen's own namespace; byte-identical | Kit removes a duplicate |
| 13 | `/login?deleted=1` | `settings.deletedNotice` (longer) | `settings.deleteSuccess` | Kit view `login-deleted.html` text; smoke substring still matches | Maintainer prefers the short note |
| 14 | Field styling scope | `FormField` + dialog input only (`rounded-[8px] bg-paper`) | Global `--radius`; `field-styles.ts` | Global radius moves every card/button; `field-styles.ts` is S-14's view | — |
| 15 | Phase size | 8 phases, ≤ 1 new UI component each; header removal paired with the sign-out row | Fewer larger phases | Contract: fresh agent per phase, small and green; no commit without sign-out | — |

## References

- Change identity: `context/changes/kit-round-3-auth-settings/change.md`
- Research: `context/changes/kit-round-3-auth-settings/research.md`
- Kit: `design/rytm-os/prototype/app.js` (`settings`, `togglePasswordForm`, `modal('deleteAccount')`,
  `deleteAccountAction`, `appShell`, `appHeader`, `confirmEmail`, `startResend`, `resetNew`, `applyAuthState`,
  `header`, `footer`), `design/rytm-os/prototype/styles.css` (`.settings-password-form`, `.form-actions`,
  `.logout-row`, `.demo-notice`, `.footer-forwho`, `.nav`, `.field input`, `.modal`), `design/rytm-os/CHANGELOG.md`
  § Runda 3, `design/rytm-os/react-kit/docs/content.json`
- Register: `context/foundation/design-kit.md`
- Format example: `context/archive/2026-10-02-kit-round-3-imports/plan.md`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Public pages and site chrome

#### Automated

- [x] 1.1 npm test: baseline, 0 failed — 464bfef
- [x] 1.2 Smoke baseline + 3 PASS, 0 FAIL, no existing assertion edited — 464bfef
- [x] 1.3 No copyExtra.landing / howItWorks / forWho reader left in src — 464bfef
- [x] 1.4 Deliberate break: footer link removed turns the footer smoke step red while the header keeps Dla kogo, restored, meta-check recorded — 464bfef
- [x] 1.5 Full local gate vs baseline, smoke + 3 — 464bfef

#### Manual

- [ ] 1.6 [reviewer] Public pages read only copy.*; header/footer match the kit 560/360 rules

### Phase 2: Demo strip in the app shell

#### Automated

- [x] 2.1 npm test: Phase 1 count, 0 failed — b10c8d9
- [x] 2.2 Smoke Phase 1 count + 3 PASS, 0 FAIL — b10c8d9
- [x] 2.3 No settingsLong / sidebarView / navLabel left in copy.ts — b10c8d9
- [x] 2.4 Deliberate break: demo false / true turns the demo-note and test-user steps red, restored, meta-check recorded — b10c8d9
- [x] 2.5 Full local gate vs baseline, smoke + 6 — b10c8d9

#### Manual

- [ ] 2.6 [reviewer] DemoNotice uses Tailwind color names only; no clash with the import pages' demo notes

### Phase 3: Settings copy, result alerts and the sign-out row

#### Automated

- [x] 3.1 npm test: Phase 2 count + new kit-contract cases, 0 failed — 42430cc
- [x] 3.2 Smoke Phase 2 count + 4 PASS, 0 FAIL, signout steps still 302 / — 42430cc
- [x] 3.3 No DESIGN-GAP in settings.astro, no copyExtra.app reader in src — 42430cc
- [x] 3.4 Deliberate break: error=password back to resetNewError turns the save-error step red, restored — 42430cc
- [x] 3.5 Deliberate break: Sesja form removed turns the sign-out step red, restored, meta-check recorded — 42430cc
- [x] 3.6 Full local gate vs baseline, smoke + 10 — 42430cc

#### Manual

- [ ] 3.7 [reviewer] One alert per param; demo refusals info, errors error; logout is a plain POST

### Phase 4: Collapsed password form

#### Automated

- [x] 4.1 npm test: Phase 3 count, 0 failed — 4688697
- [x] 4.2 Smoke Phase 3 count + 1 PASS, 0 FAIL — 4688697
- [x] 4.3 Deliberate break: initial open state true turns the closed-form step red, restored, meta-check recorded — 4688697
- [x] 4.4 Full local gate vs baseline, smoke + 11 — 4688697

#### Manual

- [ ] 4.5 [reviewer] reset/new form unchanged; cancel unmounts the form; aria-expanded follows the state

### Phase 5: Delete dialog on kit round 3

#### Automated

- [x] 5.1 npm test: Phase 4 count, 0 failed — 9edcdf5
- [x] 5.2 Smoke Phase 4 count + 3 PASS, 0 FAIL, existing delete steps unchanged and green — 9edcdf5
- [x] 5.3 No G24 / serverError left in DeleteAccountDialog.tsx — 9edcdf5
- [x] 5.4 Deliberate break: bare-text demo-delete needle shown to pass without the param, anchored needle red without it, meta-check recorded — 9edcdf5
- [x] 5.5 Deliberate break: server USUŃ check removed turns delete without confirm word is rejected red, restored, db reset — 9edcdf5
- [x] 5.6 Full local gate vs baseline, smoke + 14 — 9edcdf5

#### Manual

- [ ] 5.7 [reviewer] delete.ts server checks untouched; demo flag from the page only; aria-describedby names hint and help

### Phase 6: Login, register, reset and field styling

#### Automated

- [x] 6.1 npm test: Phase 5 count, 0 failed — 40d78f6
 — 40d78f6- [x] 6.2 Smoke Phase 5 count + 1 PASS, 0 FAIL, auth steps unchanged and green
 — 40d78f6- [x] 6.3 No bg-white / rounded-lg left in FormField.tsx
 — 40d78f6- [x] 6.4 Deliberate break: deleted=1 back to deleteSuccess turns the new step red, old step green, restored, meta-check recorded
 — 40d78f6- [x] 6.5 Full local gate vs baseline, smoke + 15
 — 40d78f6
#### Manual

- [ ] 6.6 [reviewer] Login/register/reset read only copy.* plus K11 keys; no other bg-white field in the slice

### Phase 7: Confirm-email, reset/new and the resend countdown

#### Automated

- [ ] 7.1 npm test: Phase 6 count + new kit-contract cases, 0 failed
- [ ] 7.2 Smoke Phase 6 count + 3 PASS, 0 FAIL
- [ ] 7.3 No demoLocked / passwordsDiffer / DESIGN-GAP: G37 left in src
- [ ] 7.4 Deliberate break: resendCountdown placeholder pin turns kit-contract red, restored, meta-check recorded
- [ ] 7.5 Deliberate break: expired branch without the eyebrow turns the expired step red, restored
- [ ] 7.6 Deliberate break: ResendButton old template turns the countdown smoke step red, restored, meta-check recorded
- [ ] 7.7 Full local gate vs baseline, smoke + 18

#### Manual

- [ ] 7.8 [reviewer] reset/new demo error shows demoPasswordBlocked; resend countdown reads Wyślij ponownie za 60 s at load

### Phase 8: Gap register, seam sweep and visual gate

#### Automated

- [ ] 8.1 Every copyExtra.auth / settings key has a reader
- [ ] 8.2 Seam greps empty (copyExtra.app/landing/howItWorks/forWho, deletedLogin, demoLocked, stale DESIGN-GAP ids)
- [ ] 8.3 Phase leaves design/ and brand.css untouched
- [ ] 8.4 Deliberate break: re-added copyExtra.settings.demoLocked caught by the unused-key grep, restored
- [ ] 8.5 Full local gate vs baseline, smoke + 18

#### Manual

- [ ] 8.6 [visual] Screenshots desktop + ~400 px of every listed state, compared with the kit views
- [ ] 8.7 [reviewer] Seam sweep complete; register matches the plan; follow-ups carry Trigger lines
- [ ] 8.8 [human] Accept S-12 product-visible choices (header sign-out removed, collapsed password form (JS-only), dialog closes on error, short demo strip text, redirect / vs PRD Access Control, longer deleted notice) and send K34 to the kit author
