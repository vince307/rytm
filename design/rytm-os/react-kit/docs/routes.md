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

## Runda 3 — stany danych, formularzy i importu

W prototypie każdy poniższy stan ma osobny HTML w `prototype/views/`; trasy z parametrami pozostają osiągalne również przez hash routing.

| Trasa | Widok / stan |
| --- | --- |
| `/login?deleted=1` | Potwierdzenie usunięcia konta |
| `/home?demo=1` | Wspólne konto demo z widoczną notą o ograniczeniach |
| `/settings?state=password-success` | Hasło zmienione |
| `/settings?state=password-invalid` | Nieprawidłowe obecne hasło |
| `/settings?state=error` | Ogólny błąd zapisu ustawień |
| `/settings?state=delete-error` | Błąd usunięcia konta |
| `/settings?demo=1` | Konto demo z wyłączonymi akcjami |
| `/patterns/missing` | Wzorzec niedostępny po cofnięciu importu |
| `/patterns/wolt?month=gru-2025` | Miesiąc bez wystąpień; podsumowanie sekwencji dla czytników ekranu |
| `/patterns/wolt?modal=actions` | Dialog czterech akcji wzorca z listą połączonych nazw i cofnięciem scalenia |
| `/patterns/wolt?modal=merge-empty` | Dialog scalania bez dostępnych wzorców |
| `/patterns/wolt?modal=merge-error` | Błąd scalania |
| `/patterns/wolt?modal=rename-error` | Walidacja za długiej nazwy |
| `/fixed?state=no-month` | Brak miesiąca porównawczego |
| `/fixed?state=no-changes` | Brak zmienionych kosztów stałych |
| `/fixed?state=no-new` | Brak nowych kosztów stałych |
| `/fixed?state=error` | Błąd odczytu kosztów stałych |
| `/imports/new?error=unknown` | Nieznany format |
| `/imports/new?error=currency` | Waluta inna niż PLN |
| `/imports/new?error=empty` | Brak obciążeń |
| `/imports/new?error=large` | Plik powyżej limitu rozmiaru |
| `/imports/new?error=many` | Zbyt wiele obciążeń |
| `/imports/new?error=inconsistent` | Niespójny zakres albo liczba wierszy |
| `/imports/new/summary?error=overlap` | Blokujący konflikt zakresu istniejącego importu |
| `/imports/result?status=waiting` | Oczekiwanie na wynik importu |
| `/imports/result?status=error` | Błąd zapisu importu |
| `/imports/result?status=not-found` | Nie znaleziono importu |
| `/imports?status=deleted` | Import usunięty |
| `/imports?status=error` | Błąd cofnięcia importu |
| `/imports?status=not-found` | Import niedostępny |

Wyniki cofnięcia importu są komunikatem w treści historii importów, zgodnie z charakterem przekierowania serwerowego. „Pokaż więcej” rozwija listę wzorców; prototyp używa pięciu danych przykładowych, a rzeczywista liczba powinna wynikać z wyniku API.
