# Bramka wizualna — `settings-account` Faza 2

Źródło: `http://localhost:4399` (lokalny `astro dev` + lokalne Supabase), zrzuty z 2026-09-22 przez Claude-in-Chrome. Konto na zrzutach: `test@rytm.local` (seed) — wiersze 2.7/2.8 zweryfikowano na koncie jednorazowym, nie na seedzie.

## Stany

| Stan                             | desktop (1534×784)                            | mobile (400×780)                             |
| -------------------------------- | --------------------------------------------- | -------------------------------------------- |
| `/settings` — góra               | `settings-default-desktop.png`                | `settings-default-mobile.png`                |
| `/settings` — dół (panel destr.) | `settings-default-lower-desktop.png`          | `settings-default-lower-mobile.png`          |
| `?password=changed`              | `settings-password-changed-desktop.png`       | `settings-password-changed-mobile.png`       |
| `?error=current-password`        | `settings-error-current-password-desktop.png` | `settings-error-current-password-mobile.png` |
| `?error=delete` (dialog + błąd)  | `settings-error-delete-desktop.png`           | `settings-error-delete-mobile.png`           |
| Dialog, pusty input (nieaktywny) | `settings-dialog-empty-desktop.png`           | `settings-dialog-empty-mobile.png`           |
| Dialog z `USUŃ` (aktywny)        | `settings-dialog-confirm-desktop.png`         | `settings-dialog-confirm-mobile.png`         |
| `/login?deleted=1`               | `login-deleted-desktop.png`                   | `login-deleted-mobile.png`                   |

Stan domyślny zajmuje dwie klatki, bo strona jest wyższa niż obszar zrzutu.

## Jak powstał wariant mobile 400 px

Okna Chrome na tej maszynie nie da się zwęzić poniżej `innerWidth` 587 px, więc klatki mobilne renderowano w `<iframe>` o szerokości 400 px na stronie tego samego originu (tymczasowy `public/__mobile-preview.html`, usunięty po sesji — nigdy nie commitowany). Dokument w ramce ma prawdziwy viewport 400×780, więc media queries `max-[899px]` działają normalnie; potwierdzone `matchMedia('(max-width: 899px)').matches === true`.

**Format**: pipeline zrzutów zapisuje JPEG; pliki `.png` powstały przez `sips -s format png`, więc nie są bezstratne. Wystarczają do oceny kompozycji; nie nadają się na baseline testu screenshotowego (repo go nie ma — patrz „What We're NOT Doing” w planie).

## Co potwierdzono (wiersze 2.5–2.9)

- **2.5** Kompozycja zgodna z kitem (`prototype/app.js:64,66`): eyebrow, `Twoje konto.`, panel „Dane logowania” z wierszami E-mail / Hasło / Przetwarzanie danych, panel `STREFA DESTRUKCYJNA` w obramowaniu `excess` z przyciskiem `excess-text`, dialog z eyebrow + tytułem + podpowiedzią i `USUŃ` w `<strong>`.
- **2.6** Tab z „Zmień hasło” dochodzi do „Usuń konto” jednym skokiem; Enter otwiera dialog; fokus ląduje w inpucie (wpisany znak trafia do pola); Escape zamyka; fokus wraca na przycisk wyzwalający. Blokada przycisku: `usuń` i `XUSUŃ` → nieaktywny, `USUŃ` → aktywny (porównanie dokładne).
- **2.7** Zmiana hasła formularzem w przeglądarce → `/settings?password=changed`, użytkownik pozostaje zalogowany; po wylogowaniu stare hasło → `/login?error=1`, nowe → `/home`.
- **2.8** Usunięcie dialogiem → `/login?deleted=1` z notą; `/home` → `/login`; hasło usuniętego konta → `/login?error=1`; ponowna rejestracja tego samego adresu → `/confirm-email`, logowanie → `/home`. Konto testowe posprzątane (0 wierszy `manual-verify-%` w `auth.users`/`auth.identities`).
- **2.9** 400 px: wiersze zwijają się do jednej kolumny (etykieta nad treścią), panel destrukcyjny w kolumnie, dialog mieści się w ekranie (400×348 w viewporcie 400×780), `/login` układa hero nad formularzem, dolna nawigacja mobilna widoczna.

## Obserwacje do rundy 3 (nie blokują Fazy 2)

1. **Modal bez marginesu bocznego na 400 px** — dialog ma `left: 0` i `width: 400`, czyli dotyka obu krawędzi ekranu. Kit `.modal` (`min(480px,100%)`) zachowuje się tak samo, więc marginesu nie wymyślano — zapisane jako luka w `design-kit.md` (G24).
2. **Wartość inputu potwierdzenia przeżywa zamknięcie dialogu** — po wpisaniu znaku, zamknięciu Escape i ponownym otwarciu pole nadal zawiera poprzedni tekst. Bez wpływu na bezpieczeństwo (porównanie jest dokładne, a przycisk pozostaje nieaktywny), ale użytkownik widzi stary wpis.
3. **Odstępy w wierszu E-mail na 400 px** — między etykietą „E-mail” a adresem jest duża przerwa (efekt `min-h-[70px]` przy zwiniętej kolumnie), a etykieta następnego wiersza przylega do linii oddzielającej.
4. **Pierścień fokusa** `focus-visible:ring-[3px] ring-ink/15` jest subtelny na ciemnym przycisku `danger`. Styl bazowy przycisku istniał przed tą zmianą — wariant `danger` tylko go dziedziczy.

## Dogrywka F1 (2026-09-23) — hasło w dialogu usunięcia

Źródło: `http://localhost:4321` (lokalny `astro dev` + lokalne Supabase), Claude-in-Chrome, desktop 1512×717, konto `test@rytm.local`. Po impl-review F1 dialog ma pole „Obecne hasło” (luka G24), więc klatki `settings-dialog-*` i `settings-error-delete-*` powyżej pokazują dialog sprzed tej zmiany.

| Stan                                                                   | desktop                                |
| ---------------------------------------------------------------------- | -------------------------------------- |
| Dialog, puste pola (przycisk nieaktywny, fokus na haśle)               | `f1-dialog-empty-desktop.png`          |
| Dialog z samym `USUŃ`, bez hasła (przycisk nadal nieaktywny)           | `f1-dialog-word-only-desktop.png`      |
| `?error=delete-password` (dialog + „Obecne hasło jest nieprawidłowe.”) | `f1-error-delete-password-desktop.png` |

Potwierdzone: po wpisaniu `USUŃ` bez hasła `button[type=submit].disabled === true`. Stan z wpisanym hasłem (przycisk aktywny) nie ma klatki — agent nie wpisuje haseł w przeglądarce; ścieżkę pokrywa smoke („delete with password and confirm word removes the account”). Wariant mobile 400 px nie był powtarzany.
