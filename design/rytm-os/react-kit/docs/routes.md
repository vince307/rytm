# Trasy

| Trasa | Widok | Główne CTA |
| --- | --- | --- |
| `/` | Landing page | Zobacz swój rytm |
| `/how-it-works` | Jak działa | Zacznij od swojego CSV |
| `/for-who` | Dla kogo | Sprawdź swój rytm |
| `/login` | Logowanie | Zaloguj się |
| `/register` | Rejestracja | Utwórz konto |
| `/home` | Dashboard | Wgraj CSV |
| `/home-empty` | Pusty dashboard | Wgraj CSV |
| `/patterns` | Wzorce wydatków | Otwórz wzorzec |
| `/patterns/:id` | Szczegół wzorca | Ustaw próg |
| `/fixed` | Koszty stałe | — |
| `/imports` | Historia importów | Nowy import |
| `/imports/new` | Import — plik CSV | Wybierz plik |
| `/imports/new/account` | Import — rachunek | Dalej |
| `/imports/new/summary` | Import — podsumowanie | Importuj obciążenia |
| `/imports/result` | Wynik importu | Zobacz wzorce |
| `/settings` | Ustawienia / konto | Usuń konto |
| `/reset` | Reset hasła | Wyślij instrukcję |
| `/components` | Biblioteka UI | — |

W istniejącym prototypie trasy są obsługiwane przez hash routing. W React Routerze można użyć tych samych ścieżek bez prefiksu `#`.

## Runda 2 — dodatkowe stany

- `#/reset/new` — ustaw nowe hasło
- `#/reset/new?state=expired` — wygasły link
- `#/reset/new?success=1` — sukces zmiany hasła
- `#/confirm-email` — potwierdzenie adresu e-mail
- `#/login?confirmed=1` — e-mail potwierdzony
- `#/register?error=occupied` — zajęty adres e-mail
- `#/patterns-empty`, `#/fixed-empty`, `#/imports-empty` — puste widoki przed pierwszym importem
- `#/home-no-name` — dashboard bez imienia użytkownika
