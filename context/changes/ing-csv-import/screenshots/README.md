# Bramka wizualna — `ing-csv-import` Faza 4

Źródło: `http://localhost:4398` (lokalny `astro dev` + lokalne Supabase), zrzuty z 2026-09-25 przez Claude-in-Chrome, konto jednorazowe `chrome-wizard-1@rytm.local` (usunięte po sesji). Pliki: `test/fixtures/ing/*.csv`.

Obie szerokości renderowano w `<iframe>` o dokładnej szerokości (1280 px i 375 px) na stronie tego samego originu — okno Chrome na tej maszynie ma stałe `innerWidth` 1512 px i nie schodzi poniżej ~587 px. Dokument w ramce ma prawdziwy viewport, więc breakpointy działają normalnie. Zrzuty desktop są pomniejszone (560 px szerokości) — wystarczają do oceny kompozycji, nie jako baseline (repo nie ma testu screenshotowego).

## Stany

| Stan                                                 | 1280 px                             | 375 px                             |
| ---------------------------------------------------- | ----------------------------------- | ---------------------------------- |
| Krok 1 — pusty                                       | `step1-empty-desktop.png`           | `step1-empty-mobile.png`           |
| Krok 1 — plik gotowy (rozpoznano format ING)         | `step1-ready-desktop.png`           | `step1-ready-mobile.png`           |
| Krok 1 — nieznany format (`-no-header`)              | `step1-unknown-format-desktop.png`  | `step1-unknown-format-mobile.png`  |
| Krok 1 — waluta inna niż PLN (`-currency`)           | `step1-wrong-currency-desktop.png`  | `step1-wrong-currency-mobile.png`  |
| Krok 1 — błąd serwera: nakładanie (`?error=overlap`) | `step1-server-overlap-desktop.png`  | `step1-server-overlap-mobile.png`  |
| Krok 1 — błąd serwera: `?error=failed`               | `step1-server-failed-desktop.png`   | `step1-server-failed-mobile.png`   |
| Krok 2 — wybór rachunku                              | `step2-desktop.png`                 | `step2-mobile.png`                 |
| Krok 3 — gotowy (rachunek VAT, G25)                  | `step3-ready-desktop.png`           | `step3-ready-mobile.png`           |
| Krok 3 — nakładanie (`-overlap`)                     | `step3-overlap-desktop.png`         | `step3-overlap-mobile.png`         |
| Wynik (G26)                                          | `result-desktop.png`                | `result-mobile.png`                |
| Lista importów                                       | `list-desktop.png`                  | `list-mobile.png`                  |

Nie zrzucono: krok 3 „brak obciążeń” (`importErrors.empty`) — żaden plik fixture nie ma rachunku bez obciążeń.

## Co potwierdzono (wiersze 4.4–4.9)

- **4.4** Plik główny, rachunek główny: krok 1 → 2 → 3 („206 transakcji”, pominięte „16 transakcji”) → wynik „Dodaliśmy 206 obciążeń.”; w bazie 206 wierszy o sumie 6 497 147 groszy; lista: `01.09.2025–31.08.2026`, 206.
- **4.5** `-overlap` na tym samym koncie: krok 3 z blokującym alertem „…istniejący import: 1 września 2025 – 31 sierpnia 2026…”, bez przycisku importu, akcje „Wybierz inny plik” / „Wróć do importów”.
- **4.6** `-no-header` → „Nieznany format pliku.”, `-currency` → „Waluta inna niż PLN.”; „Wybierz inny plik” wywołuje `click()` na ukrytym `input[type=file]` (natywny wybór pliku — sprawdzone przechwyceniem wywołania, okna systemowego automat nie widzi).
- **4.7** Rachunek VAT z pliku głównego: krok 3 bez blokady mimo tego samego zakresu, wynik „Dodaliśmy 4 obciążenia.”, lista pokazuje dwa importy.
- **4.8** Żaden z 11 stanów nie ma poziomego przewijania strony w 375 px ani 1280 px (`scrollWidth == clientWidth`). Tabela listy w 375 px przewija się w swoim panelu (`overflow:auto`), jak `.table-wrap` w prototypie. Brak surowych kolorów w nowych komponentach — tylko tokeny repo. Układ zgodny z `prototype/app.js:56–63`; alerty formatu pod strefą uploadu, jak w prototypie (w 375 px częściowo poniżej zgięcia — uwaga do rundy 3 kitu).
- **4.9** Parsowanie pliku głównego (52 KB) i przejście do kroku 2 oraz zapis 206 obciążeń do ekranu wyniku mieszczą się w ~1–2 s oczekiwania automatu, bez widocznego opóźnienia.
