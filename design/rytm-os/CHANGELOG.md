# Rytm — changelog

## Runda 1 · dogenerowanie brakujących elementów UI

### Zmienione (A1–A7)

- Ujednolicono komunikat na **„ponad progiem”** / **„ponad progiem w tym miesiącu”** w landing page, instrukcji i dashboardzie.
- Panel importu mówi, że plik CSV **nie jest przechowywany po imporcie**.
- How it works opisuje regułę miesięczną; usunięto obietnicę rytmu tygodniowego.
- Dashboard zastąpił wykres dni wykresem miesięcznej sumy „ponad progiem”, z oznaczeniem bieżącego niepełnego miesiąca.
- Pole imienia w rejestracji jest opcjonalne.
- Tokeny prototypu korzystają z kanonicznych wartości `brand.css`: `#606E7C`, `#CED3D5`, `#E8ECEA` oraz nazw `--rytm-*`.
- Rok w stopce jest wyliczany dynamicznie.

### Dodane widoki i komponenty

- `#/patterns` — tabela wzorców z badge'ami, wyszukiwaniem, sortowaniem i przejściem do szczegółu.
- `#/patterns/:id` — szczegół sprzedawcy, sekwencja wystąpień, transakcje i edytor progu.
- Akcje wzorca: scalanie, zmiana typu, zmiana nazwy i wykluczenie z analizy w dialogu.
- `#/fixed` — koszty stałe: zmieniona kwota, nowe i bez zmian.
- Trend miesięczny z legendą i stanem „po 3 miesiącach”.
- `#/imports`, `#/imports/new`, `#/imports/new/account`, `#/imports/new/summary`, `#/imports/result` — przepływ importu CSV z wyborem rachunku, zakresem dat, obciążeniami, wpływami, konfliktem zakresu, postępem i wynikiem.
- `#/home-empty` — pusty dashboard z istniejącą ilustracją pustego stanu.
- `#/settings` — konto, prywatność i destrukcyjna sekcja usunięcia konta z dialogiem.
- Mobilna nawigacja dolna poniżej 900 px.
- `#/components` — biblioteka badge'y, alertów, formularzy, skeletonu i dialogu.
- `#/reset` — reset hasła, stan formularza i ekran „sprawdź skrzynkę”.
- `assets/icons/ui/ui.svg` — zestaw ikon liniowych 16/20 px.

### Pominięte świadomie

- Brak prawdziwego parsowania CSV, backendu, deduplikacji i trwałego zapisu — prototyp używa danych syntetycznych.
- Operacje destrukcyjne i akcje wzorców pokazują bezpieczne stany dialogów/toastów, ale nie modyfikują danych.
- Pełny dark mode nie jest wdrażany w tej rundzie; pozostają ciemne powierzchnie marki i warianty ikony aplikacji.
- Paginacja nie jest potrzebna przy syntetycznych pięciu wzorcach; przycisk „Pokaż więcej” demonstruje miejsce na późniejszy komponent.

## Runda 2 — poprawki po wdrożeniu

- Naprawiono nakładający się import: błąd blokujący, zakres istniejącego importu i akcje „Wybierz inny plik” / „Wróć do importów”.
- Ujednolicono badge „nowy” i „zmiana kwoty” z bursztynowym kanonem marki.
- Dodano neutralne powitanie dashboardu bez imienia.
- Dodano klucze rundy 2 do `content.json`.
- Dodano `#/reset/new`, `#/confirm-email`, potwierdzenie e-maila po logowaniu, stany zajętego adresu i walidacji auth.
- Dodano puste widoki wzorców, kosztów stałych i importów.
- Dodano komunikaty błędów nieznanego formatu, waluty innej niż PLN oraz pustego pliku.
- Dodano sekcję wykluczonych wzorców z odwracalną akcją „Przywróć”.
- Dodano responsywne reguły nagłówka, stopki i `.section-head` dla 320–560 px.
- `tabs` i paginacja pozostają odłożone: żaden z nowych ekranów nie wymaga zakładek ani paginacji.
