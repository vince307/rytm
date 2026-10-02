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

## Runda 3 — spójność kitu i brakujące stany aplikacji

### Copy i tokeny (K11–K26, G28–G29, G31–G35)

- Uzupełniono `docs/content.json` o teksty z obiektów `copyExtra`, brakujące klucze `patternActions.*` i `authStates.*`, treści ustawień, dashboardu, importów, strony głównej, podstron informacyjnych oraz stanów pustych.
- Ujednolicono nazwy namespace'ów dla e-maila aktywacyjnego i ustawienia nowego hasła: używane są `confirmEmail.*` oraz `resetNew.*`.
- Teksty z wartościami zmiennymi przyjmują placeholdery, a liczebniki mają tablice trzech form. Dodano odmianę miesięcy w miejscowniku, limity importu, nazwy banków i etykiety rachunków.
- Stały wzorzec pokazuje kolumnę „Kwota”; lista wzorców ma „Pokaż więcej” i token tła znaku sprzedawcy. Wyszukiwanie i sortowanie otrzymały widoczny fokus.
- Dashboard pokazuje kartę „Ponad progiem”, pełnoszeroki trend i zestawienie kosztów stałych. Puste dane i błąd odczytu dostały odrębne komunikaty.
- Wykres ma sumy nad słupkami, znacznik zera, opis „brak progu” oraz neutralny wygląd aktualnego miesiąca. Brak flagi „niepełny”.
- Szczegół wzorca obsługuje zniknięty wzorzec, miesiąc bez wystąpień, etykietę sumy w poprawnym przypadku gramatycznym i opis sekwencji dla AT. Edytor progu pokazuje walidację oraz błąd zapisu.
- Dialog akcji wzorca zawiera wybór do scalenia, stan braku opcji, walidację nazwy, nazwy połączone i cofnięcie scalenia.
- „Koszty stałe” mają osobne komunikaty braku zmian/nowych pozycji, braku miesiąca porównawczego i błędu odczytu. Spadek ma spokojny kolor zielony; nowe/podwyższone pozycje korzystają z tokenu bursztynowego.
- Pola używają tła `paper`. Dodano semantyczne tokeny dla sekwencji, markera sprzedawcy, odznak, fokusu i obramowania strefy usuwania.

### Formularze i przepływy (G23–G30, G37)

- Ustawienia zawierają zmianę hasła: obecne, nowe i powtórzone hasło, sukces, walidację oraz błędy. Wylogowanie znajduje się w ustawieniach.
- Dialog usunięcia konta wymaga obecnego hasła i wpisania `USUŃ`; przycisk pozostaje wyłączony do chwili poprawnego wpisu. Logowanie pokazuje informację po usunięciu konta.
- Rejestracja przechodzi do ekranu potwierdzenia adresu e-mail. Potwierdzenie i reset hasła mają pełny panel wizualny, a ponowne wysłanie pokazuje odliczanie.
- Podsumowanie importu pokazuje nazwę banku, rachunek bez nazwiska, zakres i liczebnik obciążeń; ma konflikt zakresu, przycisk importu i stan oczekiwania. Wynik pokazuje bank, rachunek, zakres i liczbę dodanych obciążeń.
- Rozpoznawane są ING Bank Śląski i Santander Bank Polska. Stany odrzucenia obejmują walutę, pusty plik, limit 5 MB, ponad 5000 obciążeń oraz niespójne dane.
- Wyniki cofnięcia importu są komunikatami inline w historii importów: usunięto, błąd i brak importu. Przyjęto taki układ, bo przepływ przekierowuje do listy.
- Konto demo ma stałą notę oraz blokady dodawania/cofania importów, zmiany hasła i usunięcia konta.
- Zaktualizowano prototyp HTML i osobne pliki stanów w `prototype/views/`; trasy są opisane w `docs/routes.md`.

### Decyzje C1–C6

1. „Dla kogo” pozostaje dostępne z telefonu przez stopkę.
2. Wylogowanie znajduje się na ekranie ustawień.
3. Pola formularzy używają `paper`.
4. Bieżący miesiąc nie dostaje oznaczenia „niepełny”.
5. „Rozpoznane wydatki” i „Co wraca najczęściej” są trwale pominięte, ponieważ produkt nie definiuje ich reguł.
6. Konto Santandera nazywa się „Rachunek · •• 1094”; imię i nazwisko właściciela nie są prezentowane.

### Zakres i ograniczenia

- Zakładki pozostają pominięte, bo żadna z projektowanych list i widoków ich nie potrzebuje; „Pokaż więcej” realizuje wymaganie rozwijania listy wzorców.
- Widoki i akcje prototypu używają syntetycznych danych; nie parsują CSV ani nie zapisują zmian na serwerze.
- Workspace nie zawiera wskazanych w briefie `context/`, `src/content/copy.ts` ani `design/rytm-os/`. Runda została opracowana na dostępnym eksporcie `dist/` i przekazana do dostępnego `outputs/rytm-os/react-kit/`.
- Rejestr kluczy i mapowanie namespace'ów `copyExtra` → `content.json` zapisano w `react-kit/docs/copy-map.md`.
