# Bramka wizualna — `kit-round-3-auth-settings` (S-12)

Źródło: `http://localhost:4399` (lokalny `astro dev` + lokalne Supabase), 2026-10-03, gałąź
`feat/kit-round-3-auth-settings`. Zrzuty stanów formularza hasła są po poprawce `d84b1ad`. PNG robił Playwright 1.55
(zainstalowany poza repo) w headless systemowym Chrome (`channel: "chrome"`), skrypt leży w scratchpadzie. Desktop
1280×900, mobile 400×812, `deviceScaleFactor` 1, `fullPage` (dialogi: sam viewport). Przed zrzutem skrypt czeka, aż
skończą się animacje. Pasek `astro dev` jest ukryty. Claude-in-Chrome (przeglądarka z preflightu, nieprzełączana)
sprawdził otwieranie formularza hasła i ścieżkę Tab w prawdziwym Chrome. Klatki kitu pochodzą z
`file://…/design/rytm-os/prototype/views/*.html`. Formularz kitu otwiera `togglePasswordForm()`, a dialog kitu
`openModal('deleteAccount')`, w wersji demo z `demoMode=true`.

## Konta i dane

- `test@rytm.local` (seed): ustawienia, dialog usunięcia (bez wysyłki), `/reset/new` z sesją (formularz). Do
  sprawdzenia `max-h`: import ING przez kreator, potem dialog importu i dialog akcji wzorca z odsłoniętym „Scal z…”.
- `demo@rytm.local` (seed, `DEMO_EMAIL`): pasek demo, refusale demo, dialog demo, `/imports/new`, `/reset/new?error=demo`.
- Konta jednorazowe `visual-s12-<ts>@rytm.local` (po jednym na szerokość): rejestracja → `/confirm-email` z cookie, potem
  `?resent=1` i `?error=1`. Na końcu każde konto usunięto przez dialog („Obecne hasło” + `USUŃ`), co dało
  `/login?deleted=1`. Na koniec dwa razy `npx supabase db reset`.
- Stany błędów (`?error=…`, `?password=changed`) skrypt otwiera przez URL. To są cele przekierowań endpointów POST.

## Stany (desktop `-desktop.png`, mobile `-mobile.png`)

| Stan | plik | Jak osiągnięty | kit |
| --- | --- | --- | --- |
| landing (stopka „Dla kogo” tylko na telefonie) | `landing` | `/` | `kit-landing` |
| jak to działa / dla kogo | `how-it-works`, `for-who` | URL | `kit-how-it-works`, `kit-for-who` |
| landing przy 360 px | `landing-360.png` | viewport 360×760 | — |
| logowanie: zwykłe, `?confirmed=1`, `?deleted=1`, `?error=1` | `login`, `login-confirmed`, `login-deleted`, `login-error` | URL | `kit-login`, `kit-login-confirmed`, `kit-login-deleted` |
| logowanie po prawdziwym usunięciu konta | `login-deleted-real` | dialog usunięcia, konto jednorazowe | `kit-login-deleted` |
| rejestracja, `?error=occupied`, `?error=1` | `register`, `register-occupied`, `register-error` | URL | `kit-register`, `kit-register-occupied` |
| confirm-email z cookie | `confirm-email` | rejestracja | `kit-confirm-email` |
| confirm-email `?resent=1` (odliczanie) | `confirm-email-resent` | URL z cookie; „Wyślij ponownie za 60 s” → „59 s” | `kit-confirm-email` |
| confirm-email `?error=1` z cookie / bez cookie | `confirm-email-error`, `confirm-email-nocookie-error` | URL | — |
| confirm-email bez cookie | `confirm-email-nocookie` | URL anonimowo | — |
| reset, `?sent=1` | `reset`, `reset-sent` | URL | `kit-reset` |
| reset/new: formularz, wygasły, `?success=1` | `reset-new-form`, `reset-new-expired`, `reset-new-success` | sesja testowa / anonimowo / URL | `kit-reset-new`, `kit-reset-new-expired`, `kit-reset-new-success` |
| reset/new `?error=demo` | `demo-reset-new-error` | sesja demo | — |
| przegląd (konto testowe, bez paska) | `home-test` | `/home` | — |
| ustawienia: domyślne (formularz zamknięty) | `settings` | `/settings` | `kit-settings` |
| formularz otwarty / błąd walidacji klienta | `settings-form-open`, `settings-form-invalid` | „Zmień hasło”; hasło „abc” → „Zapisz hasło” | `kit-settings-form-open` |
| `?password=changed` | `settings-password-changed` | URL | `kit-settings-password-success` |
| `?error=current-password` / `delete-password` | `settings-error-current-password`, `settings-error-delete-password` | URL | `kit-settings-password-invalid` |
| `?error=password` | `settings-error-password` | URL | `kit-settings-error` |
| `?error=delete` | `settings-error-delete` | URL | `kit-settings-delete-error` |
| wiersz „Sesja” z bliska (F4), 2× | `settings-session-row-zoom` | `/settings` | `kit-settings` |
| dialog usunięcia: pusty / wypełniony | `settings-delete-empty`, `settings-delete-filled` | „Usuń konto”; hasło + `USUŃ` | `kit-settings-delete-dialog` |
| dialog przy 400×640 / 400×460 (przewinięty) | `settings-delete-400x640.png`, `settings-delete-400x460-scrolled.png` | krótki viewport | — |
| demo: przegląd i ustawienia z paskiem | `demo-home`, `demo-settings` | konto demo | `kit-home-demo`, `kit-settings-demo` |
| demo `?error=demo-password` / `demo-delete` | `demo-settings-error-demo-password`, `demo-settings-error-demo-delete` | URL | — |
| demo: dialog usunięcia | `demo-settings-delete-dialog` | hasło wyłączone, przycisk wyłączony, notka info | `kit-settings-delete-dialog-demo` |
| demo `/imports/new` (pasek + notka S-13) | `demo-imports-new` | URL | — |
| `max-h`: dialog importu / akcje wzorca ze „Scal z…” | `maxh-import-dialog`, `maxh-pattern-actions-merge` | import ING, `/patterns/<klucz>` → „Akcje” → „Scal z…” | — |
