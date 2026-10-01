# Follow-ups z przeglądu implementacji — `synthetic-santander-fixture`

Źródło: `reviews/impl-review.md` (2026-10-02). Ustalenia F1–F8 naprawiono w `a936cfd`. Poniżej są ustalenia odłożone.

## F9 — komparator kształtu ukrywa wariant obecny tylko po jednej stronie

Trigger: S-10 santander-csv-import (lub następne uruchomienie `npm run fixture:shape:santander` na nowym eksporcie)

- **Gdzie**: `scripts/fixture-santander-shape.mjs`, funkcja `same`, metryka `"" occurrences` i podział linii w `shape`.
- **Co**:
  - Rozkłady (sygnatura cudzysłowów, maski kol. 4, liczba pól) są porównywane z tolerancją 5 pp na klucz. Wariant obecny tylko w prawdziwym pliku, w mniej niż 5% wierszy, wychodzi jako „=”.
  - Cudzysłów w polu bez cudzysłowu (F1) wyszedł na jaw tylko dlatego, że czytnik rzucał wyjątek.
  - `""` liczy też puste pola w cudzysłowie i jest liczbą bezwzględną.
  - Plik z CRLF dałby kilka różnic z jednej przyczyny.
- **Propozycja**:
  - Klucz rozkładu obecny tylko po jednej stronie traktować jako różnicę. Tolerancję zostawić dla udziałów.
  - `""` liczyć tylko wewnątrz wartości w cudzysłowie, jako udział linii.
  - Dzielić linie po `/\r?\n/` (CR jest już raportowany osobno).

## O1 — `fixture-ing-shape.mjs`: ścieżka w niezłapanym błędzie `readdirSync`

Trigger: następna zmiana dotykająca `scripts/fixture-ing-shape.mjs` (skrypty ING były w F-03 zamrożone bajtowo)

- **Gdzie**: `scripts/fixture-ing-shape.mjs`, wywołanie `readdirSync` na najwyższym poziomie oraz komunikat „does not exist”.
- **Co**: przekazanie pliku zamiast katalogu kończy się niezłapanym ENOTDIR. Stos wypisuje pełną ścieżkę, a nazwa prawdziwego eksportu ING też może nieść numer rachunku.
- **Propozycja**: to samo co w `fixture-santander-shape.mjs` po `a936cfd`: `try/catch` wypisujący tylko `e.code` i komunikaty bez echa ścieżki.
