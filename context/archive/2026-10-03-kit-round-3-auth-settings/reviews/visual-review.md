# Visual review — `kit-round-3-auth-settings` (S-12: public pages, auth screens, settings, demo strip)

Step: visual gate of run `2026-10-02-kit-round-3`, 2026-10-03, branch `feat/kit-round-3-auth-settings`, Progress row
8.6. The gate covers every state the plan's Phase 8 `[visual]` row lists. Each one is captured at 1280 px and 400 px
and compared with the round-3 kit frames in `prototype/views/` plus the kit `deleteAccount` modal (normal and demo).
It also had to decide impl-review observation F4, the double line above the „Sesja” row. The state table, accounts
and files are in `../screenshots/README.md`.

## Capture method

- **PNG set:** Playwright 1.55, installed outside the repo, driving headless system Chrome on
  `astro dev --port 4399`. The script lives in the scratchpad. Shots: 41 app states × 2 viewports = 82 PNGs, plus
  `landing-360`, two close-ups of the „Sesja” row (2×) and two short-viewport dialog shots (400×640, 400×460); 133 PNGs in all.
  Kit side: 23 frames × 2 widths (20 views, the settings form opened with `togglePasswordForm()`, and
  `openModal('deleteAccount')` with `demoMode` off and on). 0 NOT CAPTURED. Each shot waits until no animation is
  running. Every shot also records `scrollWidth`, a check for `undefined` and for an unfilled `{…}` in `innerText`,
  and, when a dialog is open, its rect, `scrollHeight` and focused element.
- **Claude-in-Chrome:** the preflight browser was inherited, and no browser was selected or switched. The agent
  opened its own tab, signed in as the test user and clicked „Zmień hasło” on `/settings`. Result:
  `aria-expanded="true"`, and Tab moved focus from the toggle straight into `#current` (the form follows the toggle in
  DOM order). It took a headed screenshot of the open form, then closed the tab. The first try (JS `focus()` + Enter)
  did not reach the page. The extension's synthetic key did not count as a user gesture, so the toggle was clicked.
- **Data and cleanup:** every state was reached through the product or by URL. The URL states are the redirect
  targets of the POST endpoints. Two throwaway accounts were registered (one per width), used for confirm-email, then
  deleted through the real dialog, which landed on `/login?deleted=1`. The seeded test and demo accounts were never
  deleted. The ING import made on the test account for the `max-h` check was removed by `npx supabase db reset`,
  which ran before and after the closing smoke.

## States: 41 × 2 viewports

| Group | Verdict |
| --- | --- |
| Public pages + header/footer (C1/G20) | `/`, `/how-it-works`, `/for-who` match the kit copy and layout. „Dla kogo” at 1280 px: header link visible, footer link hidden. At 400 px it is the reverse: header link hidden, footer link visible and first („Dla kogo · Prywatność · Kontakt”), as in kit `landing` mobile. `scrollWidth` = viewport at 1280, 400 and 360 px (`/`, `/how-it-works`, `/for-who`, `/login`), so the ≤ 359 px header tier holds. One pre-existing layout difference on the landing page is follow-up F3 (below). |
| Login (plain, `confirmed`, `deleted`, `error`), register (plain, `occupied`, `error`) | Same as kit `login*` / `register*`: split visual panel, kit copy, `paper` fields with 8 px radius (C3). `?deleted=1` shows the long `settings.deletedNotice`, the kit `login-deleted` text, both by URL and after a real deletion. „occupied” shows the error alert with „Zaloguj się” / „Nie pamiętam hasła” links. |
| Confirm-email (with and without cookie, `resent`, `error`) | Own visual panel „Jeszcze jeden krok / Twój rytm zaczyna się od jasności.” (K13), same as kit `confirm-email`. With `?resent=1`, the button reads **„Wyślij ponownie za 60 s”** at load, then „59 s” one tick later (observed in the browser, not inherited). Without the pending cookie, no resend button appears and „Wróć do logowania” becomes the primary button. |
| Reset, `?sent=1`, reset/new (form, expired, success, demo error) | Same as kit `reset`, `reset-new`, `reset-new-expired`, `reset-new-success`. Expired: eyebrow „Link wygasł”, „Ten link już wygasł.”, lead, error alert, „Wyślij nowy link ↗”, the kit order. `?error=demo` (demo session) shows „Na wspólnym koncie demo zmiana hasła jest wyłączona.” |
| `/settings` default, form open, client validation error | Kit `settings`: one panel with E-mail / Hasło „••••••••” + „Zmień hasło” / Przetwarzanie danych / Sesja „Wyloguj się”, then the danger panel with a `line` border. The open form has Obecne hasło, Nowe hasło + „Pokaż”, Powtórz hasło, „Zapisz hasło” and „Anuluj”. A short password gives „Hasło musi mieć co najmniej 6 znaków.” under the field. „Anuluj” unmounts the form, and reopening shows empty fields. Two differences from the kit were fixed (see Discrepancies 1–2). |
| `/settings` result alerts | One alert between the title and the panel per param, as in kit `settings-*`: `password=changed` success, „Hasło zostało zmienione.”; `current-password` / `delete-password` error, „Obecne hasło jest nieprawidłowe.”; `password` error, „Nie udało się zapisać zmian. Spróbuj ponownie.”; `delete` error, „Nie udało się usunąć konta. Spróbuj ponownie.”. Demo refusals render as info, errors as error. |
| Delete dialog: empty, filled | Kit `deleteAccount` order: eyebrow, „Usunąć konto bez śladu?”, body, Obecne hasło, „Wpisz **USUŃ**, aby potwierdzić.”, `USUŃ` input, muted „Przycisk uaktywni się po wpisaniu USUŃ.”, danger button. Empty: the button is disabled (`disabled = true`) and the help line shows. Filled: the button is enabled and the help line is gone. **Keyboard:** initial focus is on `#delete-current`, never on the destructive button. Esc closes the dialog and returns focus to the „Usuń konto” trigger. |
| Dialog height (F8) | 400×640: the dialog (476 px) fits whole, so nothing is clipped. 400×460: the dialog is capped at 428 px (= 460 − 32), `overflow-y: auto`, and scrolls by 50 px to reach the button (`settings-delete-400x460-scrolled.png`). Regression check at 400 px: the import delete dialog (286 px) and the pattern-actions dialog with the „Scal z…” picker revealed (572 px of 812) both sit fully inside the viewport. |
| Demo account | The strip „● Wspólne konto demo — niektóre działania są wyłączone.” sits under the header on `/home`, `/settings` and `/imports/new`, the kit `.demo-notice` look. It is absent for the test user (`home-test`). On `/imports/new` the strip and the S-13 info note („…dodawanie i cofanie importów jest wyłączone.”) are separate, distinct blocks and do not clash. The demo dialog has the password field disabled, the button disabled even with `USUŃ` typed, and the info note after the button, as in kit `deleteAccount` with `demoMode`. The strip's short text is plan decision 5 (`[human]` 8.8, K34). |

Page level: in all 82 app shots, `scrollWidth` equals the viewport width (1280 / 400). `innerText` contains no
`undefined` and no unfilled `{…}`. Colours are the existing tokens; no view introduces a raw colour. No numeric view
is in scope (no amounts are computed on these screens), so no number needs a hand-check.

## F4 — double line above „Sesja”: verdict

**Kept, kit-exact.** Kit `settings()` renders the same thing: `.settings-row` „Przetwarzanie danych” keeps its
`border-bottom`, and `.logout-row` adds `border-top`. `kit-settings-*` shows the same 2 px divider. In the 2×
close-up (`settings-session-row-zoom-*`) it reads as a slightly heavier rule that sets the session row apart from the
data rows. It does not read as a rendering fault. No change and no follow-up.

## Discrepancies and fixes (commit `d84b1ad`)

1. **Password form border on the wrong side.** Kit `.settings-password-form` has `border-top: 1px solid line` and no
   bottom border, so the open form sits under a 2 px rule and runs straight into „Przetwarzanie danych”. The app had
   `border-b`, which put a single line above the form and an extra one below it. The plan contract (P4) also says
   „top border”. `SettingsPasswordRow` now uses `border-t`. Re-shot as `settings-form-open-*` /
   `settings-form-invalid-*`.
2. **„Zapisz hasło ↗”.** Kit `settings()` draws `<button class="btn btn-primary">Zapisz hasło</button>` with no arrow.
   `NewPasswordForm` now passes `showArrow={false}` in the settings (cancel) branch only. „Zapisz nowe hasło ↗” on
   `/reset/new` is unchanged.

After the fixes: lint 0 errors; astro check 0 errors (157 files, Δ0 vs the impl-review step); vitest 354/354; build
OK; `db reset` → smoke on :4398 184 PASS / 0 FAIL (baseline 166 + 18, unchanged by the fix); pgTAP Files=6,
Tests=119 PASS. The settings states were re-captured after the fix.

## Observations (not fixed, not blocking)

1. **Kit „Wyloguj się” is a stretched, underlined `<a>`.** In kit `settings()` it is `<a class="btn btn-ghost">` that
   fills grid column 2, and its text is underlined, which looks like a prototype artifact. The app renders the
   standard ghost button inside a POST form (plain sign-out without JS). Appended to register row K34 for the kit
   author.
2. **Landing steps head does not stack at 400 px** (pre-existing, not touched by S-12). Recorded as follow-up F3 in
   `follow-ups/review-fixes.md`.
3. **Known follow-up F2 is visible.** `DialogContent` has 31 px padding and a close X; the kit `.modal` has 26 px
   padding. This is S-14's follow-up.
4. **Alert tints are token approximations** of the kit hex values (info `ink/8` vs `#e2e7ec`, as noted in S-13). The
   kit `appShell()` demo strip text differs from the app's (decision 5, `[human]` 8.8).
5. **Fixed mobile nav in full-page shots.** In `fullPage` mobile shots the fixed bottom nav covers mid-page content.
   That is a capture artifact, and the kit frames show the same thing.

VISUAL: PASS — all 41 [visual] states of row 8.6 captured at 1280 + 400 px (82 PNGs, Playwright) plus 360 px tier, 400×640/400×460 dialog and 23 kit frames; Chrome cross-check of the password toggle; no undefined, no unfilled {…}, no page-level horizontal scroll, initial dialog focus off the destructive button, max-h scroll proven; password-form border and „Zapisz hasło” arrow fixed (d84b1ad); F4 double line kept as kit-exact
