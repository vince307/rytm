# Bramka wizualna — `kit-round-3-intake` (F-04)

Źródło: `http://localhost:4399` (lokalny `astro dev` + lokalne Supabase), 2026-10-02, gałąź `feat/kit-round-3-intake`
(kod jak w `66ab103`). Zrzuty PNG: Playwright 1.55 (zainstalowany poza repo), headless systemowy Chrome
(`channel: "chrome"`), skrypt poza repo. Claude-in-Chrome (przeglądarka wybrana na preflight, dziedziczona, nigdy nie
przełączana) posłużył do kontroli `/fixed` i karty „Koszty stałe” w prawdziwym Chrome — patrz
`../reviews/visual-review.md`. Klatki kitu rundy 3 z `file://…/design/rytm-os/prototype/views/*.html`. Pasek
`astro dev` ukryty wstrzykniętym stylem. Desktop 1280×900, mobile 400×812, `deviceScaleFactor` 1, każdy zrzut
`fullPage`; na mobilnych zrzutach dolna nawigacja (`position: fixed`) wypada na dole viewportu, nie na dole strony.

## Konta i dane

Stany wylogowane: świeży kontekst przeglądarki, bez konta (rejestracja z hasłem „abc” nie dochodzi do serwera —
walidacja klienta). Stany zalogowane: dwa świeże lokalne konta przez `/register`
(`visual-f04-<szerokość>-<ts>@rytm.local`), jedno na viewport; nigdy seedowe `test@rytm.local`. Dane wyłącznie przez
kreator `/imports/new` z syntetycznym fixture'em ING `test/fixtures/ing/Lista_transakcji_nr_0000123456_010926.csv`
→ „Importuj 206 obciążeń” → „Dodaliśmy 206 obciążeń.” Po bramce `npx supabase db reset` (0 kont `visual-%`).

## Stany

| Stan | desktop | mobile | Jak osiągnięty / co widać | kit |
| --- | --- | --- | --- | --- |
| logowanie, błąd | `login-error-desktop.png` | `login-error-mobile.png` | `/login?error=1`; alert „Nie rozpoznaliśmy tego e-maila i hasła. Spróbuj ponownie.” | `kit-login-*` |
| reset, formularz | `reset-desktop.png` | `reset-mobile.png` | `/reset`; „Odzyskaj dostęp.” | `kit-reset-*` |
| reset, wysłano | `reset-sent-desktop.png` | `reset-sent-mobile.png` | `/reset?sent=1`; „Link jest w drodze.”, „Wróć do logowania” | `kit-reset-*` |
| rejestracja, za krótkie hasło | `register-short-password-desktop.png` | `register-short-password-mobile.png` | `/register`, hasło „abc”, „Utwórz konto” → „Hasło musi mieć co najmniej 6 znaków.” | `kit-register-*` |
| przegląd | `home-desktop.png` | `home-mobile.png` | `/home`; karty „Ponad progiem w tym miesiącu” 0,00 zł i „Koszty stałe” 1752,98 zł · „1 pozycja podrożała”; trend 12 miesięcy (wrz 25 … sie 26) z podpowiedzią „Ustaw próg…” (brak progów) | `kit-home-*` |
| wzorce | `patterns-desktop.png` | `patterns-mobile.png` | `/patterns`; 7 nagłówków w kolejności ciała: Sprzedawca / Typ / Wystąpienia / Suma / Kwota / Próg / Ponad progiem; 31 wzorców | `kit-patterns-*` |
| koszty stałe | `fixed-desktop.png` | `fixed-mobile.png` | `/fixed`; „Zmieniły kwotę” 1, „Nowe w sierpniu” 1, „Bez zmian” 3 | `kit-fixed-*` |
| ustawienia, za krótkie nowe hasło | `settings-short-password-desktop.png` | `settings-short-password-mobile.png` | `/settings`, obecne hasło konta, nowe/powtórzone „abc”, „Zmień hasło” → „Hasło musi mieć co najmniej 6 znaków.” | `kit-settings-password-invalid-*` |
| klatki kitu | `kit-{login,reset,register,home,patterns,fixed,settings-password-invalid}-{desktop,mobile}.png` | | prototyp rundy 3 `views/*.html` | — |

## Zmierzone

- `document.documentElement.scrollWidth` = szerokość viewportu (1280 / 400) we wszystkich 16 zrzutach aplikacji.
- `document.body.innerText` bez `undefined` i bez nieuzupełnionych `{n}` / `{month}` / `{…}` we wszystkich 16 zrzutach.
