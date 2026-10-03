# Bramka wizualna — `i18n-en` (S-16)

Źródło: `http://localhost:4399` (lokalny `astro dev` + lokalne Supabase), 2026-10-03, gałąź `feat/i18n-en`. PNG robił
Playwright 1.55 (poza repo) w headless systemowym Chrome (`channel: "chrome"`); skrypt w scratchpadzie. Desktop
1440×900, mobile 400×812, `deviceScaleFactor` 1, `fullPage` (stany fokusu, dialog i sekcja „Excluded”: sam viewport).
Pasek `astro dev` ukryty. Język wymuszony ciasteczkiem `rytm-locale=en` / `rytm-locale=pl` w kontekście przeglądarki.
Klatki kitu: `file://…/design/rytm-os/prototype/views/*.html` (PL; ikony sprite'a nie renderują się z `file://`). Na
`fullPage` mobile stały dolny pasek nawigacji zasłania środek strony — artefakt zrzutu, kit wygląda tak samo.

37 stanów aplikacji (29 EN + 8 PL) → 75 PNG (`en-patterns-one-month` tylko desktop — dowód kwoty) + 7 klatek kitu × 2
= 14; razem 89.

## Konta i dane

- `test@rytm.local` (seed): import syntetycznego ING (`Lista_transakcji_nr_0000123456_010926.csv`) przez kreator w EN;
  próg „Count per month” = 3 na STACJA PALIW DROGOWSKAZ przez edytor; „Exclude from analysis” na URZĄD SKARBOWY W
  PRZYKŁADOWIE przez dialog akcji; plik `…-overlap.csv` przez kreator (błąd nakładania, stan po stronie klienta).
- `vg16-one-<ts>@rytm.local` (rejestracja w EN) + `POST /api/imports` (format smoke): maj 2026 — Sklep VG 12,99,
  Kawiarnia VG 52,99.
- `vg16-empty-<ts>@rytm.local` (rejestracja w EN), bez importu.
- `/reset/new` z formularzem: „I forgot my password” dla `test@rytm.local`, link z Mailpit (`:54324`) → `/auth/callback`
  → `/reset/new` (hasło niezmienione).
- Na koniec `npx supabase db reset` — wszystkie dane testowe usunięte.

## Stany EN (`rytm-locale=en`)

| Stan                                                  | plik                                                       | Jak osiągnięty                                                                                      |
| ----------------------------------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| landing                                               | `en-landing`                                               | wylogowany                                                                                          |
| how it works / for who                                | `en-how-it-works`, `en-for-who`                            | wylogowany                                                                                          |
| login domyślny / błąd                                 | `en-login`, `en-login-error`                               | złe hasło przez formularz → `?error=1`                                                              |
| register domyślny / zajęty                            | `en-register`, `en-register-occupied`                      | `/register?error=occupied`                                                                          |
| confirm e-mail                                        | `en-confirm-email`                                         | wejście bezpośrednie                                                                                |
| reset                                                 | `en-reset`                                                 | wylogowany                                                                                          |
| reset/new formularz / wygasły                         | `en-reset-new-form`, `en-reset-new-expired`                | link z Mailpit / `?state=expired`                                                                   |
| `/home` z progiem, 12 miesięcy                        | `en-home-data`                                             | test                                                                                                |
| `/home` jeden miesiąc                                 | `en-home-one-month`                                        | `one`                                                                                               |
| `/home` przed importem                                | `en-home-empty`                                            | `empty`                                                                                             |
| `/patterns` lista                                     | `en-patterns-list`                                         | test                                                                                                |
| `/patterns` sekcja wykluczonych                       | `en-patterns-excluded`                                     | test, przewinięte do „Excluded”                                                                     |
| `/patterns` jednego miesiąca (kwota 52.99 zł)         | `en-patterns-one-month` (desktop)                          | `one`                                                                                               |
| szczegół wzorca z edytorem progu                      | `en-pattern-detail-editor`                                 | test, STACJA PALIW DROGOWSKAZ                                                                       |
| `/fixed` zmiany / bez porównania                      | `en-fixed-changes`, `en-fixed-no-comparison`               | test / `one`                                                                                        |
| `/imports` lista / pusta                              | `en-imports-list`, `en-imports-empty`                      | test / `empty`                                                                                      |
| `/imports/new` krok pliku / nakładanie                | `en-imports-new-file`, `en-imports-new-overlap`            | test                                                                                                |
| `/imports/result`                                     | `en-imports-result`                                        | po imporcie ING                                                                                     |
| `/settings` z sekcją języka                           | `en-settings`                                              | test                                                                                                |
| dialog usuwania z wpisanym `DELETE`                   | `en-settings-delete-dialog`                                | test, hasło `not-submitted`, NIE wysłany, Esc                                                       |
| przełącznik z fokusem: stopka / róg auth / ustawienia | `en-switch-footer`, `en-switch-auth`, `en-switch-settings` | focus EN → Shift+Tab → PL (`:focus-visible`), Enter → PL na tej samej stronie, klik EN → z powrotem |

## Stany PL (`rytm-locale=pl`)

| Stan                                    | plik             | kit                         |
| --------------------------------------- | ---------------- | --------------------------- |
| landing                                 | `pl-landing`     | `kit-landing`               |
| login                                   | `pl-login`       | `kit-login`                 |
| `/home` z danymi                        | `pl-home`        | `kit-home` (`home-no-name`) |
| `/patterns`                             | `pl-patterns`    | `kit-patterns`              |
| `/fixed`                                | `pl-fixed`       | `kit-fixed`                 |
| `/imports`                              | `pl-imports`     | `kit-imports`               |
| `/settings`                             | `pl-settings`    | `kit-settings`              |
| przełącznik w rogu auth z fokusem na EN | `pl-switch-auth` | —                           |
