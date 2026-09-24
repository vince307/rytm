# Syntetyczny wyciąg ING (F-02) — plan implementacji

## Overview

Do repozytorium trafia deterministyczny, syntetyczny wyciąg CSV z ING Bank Śląski, wiernie odwzorowujący **kształt** prawdziwego eksportu (`context/foundation/import-formats.md`), ze wszystkimi pułapkami z sekcji „Kształty do seeda” i z FR-014. Obok niego leżą trzy małe pliki błędów oraz maszynowy klucz odpowiedzi `expected.json`. Całość generuje jeden skrypt Node bez zależności, a CI pilnuje, że plik na dysku jest dokładnie tym, co generator wytwarza, i że spełnia kontrakt formatu. To jedyny legalny materiał testowy dla S-01 (parser), S-03 (normalizacja i typ wzorca), S-05/S-06 (scalanie, podwyżka, nowy wzorzec) i S-09 (demo publiczne) — prawdziwy wyciąg nie może trafić do repo (NFR prywatność, guardrail determinizm).

## Current State Analysis

- Parser nie istnieje (powstaje w S-01); w repo nie ma runnera testów jednostkowych — są tylko `npm run smoke` (`scripts/smoke.mjs`) i pgTAP (`supabase/tests/database/domain_rls.test.sql`).
- `.gitignore:15-17` blokuje `*.csv` z wyjątkami `!test/fixtures/**/*.csv` i `!fixtures/**/*.csv` — ścieżka fixture jest już przewidziana, katalog `test/` nie istnieje.
- Prawdziwy wyciąg leży lokalnie w `data/Lista_transakcji_nr_…_180926.csv` (ignorowany przez `*.csv`); może służyć wyłącznie do lokalnego porównania **struktury**.
- Schemat F-01 (`supabase/migrations/20260923165530_domain_imports_transactions.sql`): `imports(source='ing', account_number, account_name, period_start, period_end)` z wykluczeniem nakładających się zakresów per rachunek; `transactions(occurred_on, amount_minor > 0, bank_tx_id, counterparty, title, details, account_number)`, unikalność `(user_id, account_number, bank_tx_id)`. To wyznacza, co parser wyciągnie z wiersza i co manifest musi przewidywać.
- `supabase/seed.sql:7` zapowiada: „Domain data (FR-014 synthetic CSV) arrives with the first migration” — komentarz jest nieaktualny wobec decyzji, że F-02 nie seeduje bazy.
- CI (`.github/workflows/ci.yml`, job `ci`): `npm ci → astro sync → lint → astro check → build`. Brak `.prettierignore`; lint-staged formatuje `*.{json,md}` Prettierem.
- Roadmapa F-02: nieznana „które kształty opisów z prawdziwego wyciągu trzeba odwzorować” — owner user, nieblokująca; rozstrzyga ją lokalny skrypt porównania kształtu (Faza 2).

## Desired End State

- `test/fixtures/ing/` zawiera: główny wyciąg (12 miesięcy, 2 rachunki: główny i VAT, ~200 wierszy danych), trzy pliki błędów (zakres nachodzący na główny, brak wiersza `"Data transakcji"`, waluta ≠ `PLN`), `expected.json` i `README.md`.
- Każdy plik CSV jest w cp1250 bez BOM, CRLF, `;`, 21 kolumn w wierszach danych, z 20-wierszową preambułą i stopką jak w `import-formats.md`; `Liczba transakcji` w preambule == liczba wierszy danych.
- `npm run fixture:ing` regeneruje pliki bajt w bajt identycznie (brak `Date.now`, brak niezasianego `Math.random`).
- `npm run fixture:check` przechodzi w jobie `ci` i zawodzi, gdy plik na dysku różni się od wyjścia generatora albo łamie kontrakt formatu lub manifestu.
- `npm run fixture:shape` (tylko lokalnie) porównuje strukturę fixture z prawdziwym wyciągiem w `data/` i wypisuje wyłącznie statystyki struktury, nigdy danych.

Weryfikacja: `npm run fixture:check && git diff --exit-code test/fixtures` po `npm run fixture:ing`; `npm run lint`; job `ci` zielony.

### Key Discoveries:

- Kontrakt formatu i reguły importu ING: `context/foundation/import-formats.md` (sekcje „ING Bank Śląski”, „Reguły importu ING” 1–8, „Kształty do seeda”), decyzje D1–D9.
- Wyjątek na fixture w `.gitignore:15-17`; ścieżka `test/fixtures/ing/` nie wymaga zmian `.gitignore`.
- Kolumny docelowe parsera: `supabase/migrations/20260923165530_domain_imports_transactions.sql` (`amount_minor bigint > 0`, `bank_tx_id`, `counterparty`, `title`, `details`).
- Tolerancja wzorca stałego D5: „15% od mediany kwot LUB ±10 zł, co większe” — manifest i check liczą ją identycznie.
- Node nie ma enkodera cp1250 (`TextDecoder('windows-1250')` tylko dekoduje) — generator koduje przez własną tablicę.

## What We're NOT Doing

- Parser CSV, UI importu, zapis transakcji do bazy — S-01.
- Normalizacja sprzedawców i wykrywanie wzorców w kodzie aplikacji — S-03 (manifest opisuje tylko **oczekiwany** wynik).
- Wiersze domeny w `supabase/seed.sql` i konto demo na produkcji — dane w bazie powstają przez prawdziwy import (S-01) i S-09.
- Runner testów jednostkowych (Vitest itp.) — decyzja należy do S-01; weryfikacja F-02 to skrypt Node bez zależności.
- Nowe zależności (`iconv-lite` itp.).
- Fixture Santandera (plik USD z D4) — Santander jest poza kamieniem milowym (Parked).
- Jakiekolwiek kopiowanie wartości z prawdziwego wyciągu (nazw, kwot, numerów, dat) — odwzorowujemy wyłącznie kształty.

## Implementation Approach

Pułapki są **danymi** w generatorze: każda to deklaracja (sprzedawca, szablon opisu, rachunek, harmonogram dat, lista kwot, identyfikator pułapki, oczekiwany wynik). Generator rozwija je w wiersze, dosypuje deterministyczny „szum” (drobne zakupy BLIK, przelewy) z zasianego PRNG, sortuje, nadaje numery transakcji, składa preambułę/stopkę i koduje do cp1250. Ten sam przebieg wytwarza `expected.json`, więc klucz odpowiedzi nie może rozjechać się z plikiem. `fixture:check` wywołuje generator w pamięci, porównuje bajty z dyskiem, a potem niezależnie (dekodując pliki z dysku) sprawdza kontrakt formatu i spójność manifestu z D1/D2/D5.

## Critical Implementation Details

**Determinizm i Prettier.** `expected.json` i `README.md` w `test/fixtures/ing/` byłyby przeformatowane przez lint-staged (`prettier --write` na `*.{json,md}`), co złamałoby porównanie bajtów w `fixture:check`. Dodaj `.prettierignore` z wpisem `test/fixtures/` (Prettier 3 czyta równolegle `.gitignore` i `.prettierignore`, więc dotychczasowe ignorowanie się nie zmienia) albo porównuj w checku tylko pliki CSV i `expected.json` wygenerowany tym samym `JSON.stringify(…, null, 2) + "\n"` — preferowany jest `.prettierignore`.

**Kodowanie cp1250.** Tablica musi pokryć co najmniej polskie litery i znaki używane w preambule/stopce; znak spoza tablicy ma przerwać generowanie błędem, a nie wyemitować `?`. Check weryfikuje round-trip: `TextDecoder('windows-1250')` na bajtach z dysku == tekst źródłowy generatora.

```
ą B9  ć E6  ę EA  ł B3  ń F1  ó F3  ś 9C  ź 9F  ż BF
Ą A5  Ć C6  Ę CA  Ł A3  Ń D1  Ó D3  Ś 8C  Ź 8F  Ż AF
„ 84  ” 94  – 96   (ASCII 0x00–0x7F bez zmian)
```

**Kotwica czasu.** Zakres głównego wyciągu to stałe `2025-09-01 – 2026-08-31`, data generowania w preambule i w nazwie pliku stała (`…_010926.csv`). Nowy wzorzec stały (S-06, D6) ma wystąpienia wyłącznie w ostatnim miesiącu kalendarzowym zakresu (2026-08), podwyżka abonamentu następuje w środku zakresu.

## Phase 1: Generator, główny wyciąg i klucz odpowiedzi

### Overview

Powstaje generator z deklaracjami wszystkich pułapek, główny wyciąg 12-miesięczny, `expected.json` i opis fixture. Po tej fazie S-01 i S-03 mają plik i asercje.

### Changes Required:

#### 1. Generator

**File**: `scripts/fixture-ing.mjs`

**Intent**: Deterministycznie wytwarza wszystkie pliki fixture ING i manifest z jednej deklaracji pułapek; w Fazie 1 — tylko główny wyciąg i `expected.json`.

**Contract**:
- Eksportuje funkcję `generate()` zwracającą mapę `ścieżka względna → Uint8Array|string` (bez zapisu na dysk) — używa jej też `fixture:check`; uruchomiony jako CLI zapisuje mapę do `test/fixtures/ing/`.
- Zero zależności, tylko `node:` moduły; PRNG zasiany stałą (np. mulberry32); brak odczytu zegara.
- Plik główny: nazwa w kształcie `Lista_transakcji_nr_<dok>_<ddmmyy>.csv` z fikcyjnym numerem dokumentu; preambuła 20 wierszy (nazwa dokumentu, data generowania, fikcyjny właściciel, `Wybrane rachunki:` z 2 rachunkami: nazwa ;; fikcyjny numer, `Zakres dat:`;`"2025-09-01 - 2026-08-31"`, `Liczba transakcji:`;N, sumy uznań/obciążeń), wiersz 21 = nagłówek kolumn od `"Data transakcji"` (21 nazw zgodnie z tabelą kolumn w `import-formats.md`), wiersze danych, puste wiersze + stopka `"Dokument ma charakter informacyjny…"`.
- Wiersz danych: 21 pól w `"…"`, `;`, CRLF; `Nr rachunku` i `Nr transakcji` w `'…'` ze spacjami na końcu; kwota z przecinkiem dziesiętnym bez separatora tysięcy; `Waluta` = `PLN`; kolumny 10–13 i 15–20 puste; `Konto` = nazwa rachunku; ~1,5% wierszy z `Data księgowania` ≠ `Data transakcji`; wielokrotne spacje w `Dane kontrahenta`.
- Pułapki (każda z identyfikatorem w manifeście; wartości fikcyjne, dobrane przez implementującego):

  | ID | Pułapka | Oczekiwany wynik (manifest) |
  |---|---|---|
  | T01 | Ten sam sprzedawca w dwóch zapisach (`marka.pl ADRES Miasto` vs `MARKA SP. Z O.O. ul. Adres Miasto`) | jeden wzorzec docelowy, `resolvedBy: user-merge` |
  | T02 | Nazwa sklepu zdublowana w kontrahencie (`SKLEP X SKLEP X Miasto`) | jeden wzorzec, `resolvedBy: normalization` |
  | T03 | Sieć z numerem placówki, dwie placówki | dwa surowe sprzedawcy → jeden wzorzec, `resolvedBy: normalization` |
  | T04 | Operator płatności (PayPro/PayU/Cashbill/Autopay/ING Pay) z domeną sprzedawcy w końcówce `Tytułu` BLIK | surowy sprzedawca = domena (D3), `resolvedBy: import` |
  | T05 | Operator bez domeny w `Tytule` | surowy sprzedawca = kontrahent ze zwiniętymi spacjami (reguła 7, fallback) |
  | T06 | Przelew własny między rachunkami w pliku: para ± tej samej kwoty, to samo `Nr transakcji`, różne `Konto` | na rachunku głównym obciążenie importowane, strona drugiego rachunku pominięta (D1); klucz `(Nr transakcji, Konto)` unikalny |
  | T07 | Split payment VAT (`PRZ SP Ref SP: …`) — para na rachunku głównym i VAT | jw. |
  | T08 | Powtarzalny przelew na własne konto w innym banku (D8) | wzorzec, `resolvedBy: user-exclude` |
  | T09 | Opłaty US/ZUS — powtarzalne, zmienna kwota | typ `frequent` |
  | T10 | Abonament ze stałą kwotą | typ `fixed` |
  | T11 | Abonament z jedną podwyżką ~12% | jeden wzorzec `fixed` przy D5 |
  | T12 | Sprzedawca z rozrzutem ~45% | typ `frequent` |
  | T13 | Zwrot BLIK (kwota dodatnia, `Zwrot transakcji BLIK … Nr zwrotu …`) | pominięty, `skipReason: credit` (D2) |
  | T14 | PayPal jako pośrednik | sprzedawca nieprzezroczysty (FR-014) |
  | T15 | Allegro | sprzedawca nieprzezroczysty (D3) |
  | T16 | Nowy wzorzec stały tylko w ostatnim miesiącu | `fixed`, pierwsze wystąpienie 2026-08 (D6) |
  | T17 | Uznania (wynagrodzenie, przelew przychodzący) | pominięte, `skipReason: credit` |
  | T18 | Wiersze rachunku VAT poza parami T06/T07 | pominięte, `skipReason: other-account` (D1) |

  Do tego szum: zakupy `TR.BLIK`, `PRZELEW`, `P.BLIK` w proporcjach zbliżonych do `import-formats.md` (TR.BLIK ~60%, PRZELEW ~20%), tak by rachunek główny miał wyraźnie najwięcej wierszy (domyślny wybór z D1).

#### 2. Klucz odpowiedzi

**File**: `test/fixtures/ing/expected.json` (generowany)

**Intent**: Maszynowy kontrakt, na którym S-01 i S-03 budują asercje; „jakość normalizacji mierzona na znanych pułapkach” staje się liczbą.

**Contract** (kształt, od którego zależą S-01/S-03 i `fixture:check`):

```json
{
  "schema": 1,
  "tolerance": { "pct": 15, "minMinor": 1000, "rule": "D5: max(15% mediany, 10 zł)" },
  "files": {
    "<plik>": {
      "expect": "ok",
      "reason": null,
      "accounts": [{ "name": "…", "number": "…", "rows": 0 }],
      "defaultAccount": "…",
      "period": { "start": "2025-09-01", "end": "2026-08-31" },
      "declaredCount": 0,
      "imported": { "count": 0, "sumMinor": 0 }
    }
  },
  "rows": [
    {
      "file": "…", "line": 22, "bankTxId": "…", "account": "…",
      "occurredOn": "YYYY-MM-DD", "amountMinor": -11685,
      "traps": ["T04"], "imported": true, "skipReason": null,
      "rawMerchant": "…", "pattern": "…"
    }
  ],
  "patterns": [
    {
      "key": "…", "type": "fixed", "resolvedBy": "normalization",
      "traps": ["T11"], "occurrences": 12, "sumMinor": 0,
      "medianMinor": 0, "firstMonth": "2025-09"
    }
  ]
}
```

`imported`/`skipReason` (`credit` | `other-account`) wynikają z D1/D2 przy domyślnym rachunku; `rawMerchant` z reguły 7; `pattern`/`type`/`resolvedBy` to zamierzony wynik po normalizacji i ewentualnych decyzjach użytkownika (S-03 może go skorygować edycją deklaracji w generatorze, nie ręczną edycją JSON). Kwoty w groszach, `amountMinor` ze znakiem jak w pliku.

#### 3. Opis fixture

**File**: `test/fixtures/ing/README.md` (generowany albo pisany ręcznie — jeśli ręcznie, check go pomija)

**Intent**: Człowiek wie, co jest w plikach, skąd kształty i jak regenerować.

**Contract**: Sekcje: pochodzenie (kształty z `import-formats.md`, zero danych z prawdziwego wyciągu), tabela pułapek T01–T18 z odesłaniem do `expected.json`, pliki i ich oczekiwany wynik, polecenia `npm run fixture:ing` / `fixture:check` / `fixture:shape`, zasada „zmiana fixture = zmiana deklaracji w generatorze + regeneracja”.

#### 4. Skrypty npm i ignorowanie Prettiera

**File**: `package.json`, `.prettierignore`

**Intent**: Jedno polecenie do regeneracji; wygenerowane pliki nie są przepisywane przez lint-staged.

**Contract**: `"fixture:ing": "node scripts/fixture-ing.mjs"`; `.prettierignore` z `test/fixtures/`.

### Success Criteria:

#### Automated Verification:

- Generator tworzy pliki: `npm run fixture:ing` kończy się kodem 0 i zapisuje główny wyciąg oraz `expected.json` do `test/fixtures/ing/`
- Determinizm: drugie `npm run fixture:ing` nie zmienia plików (`git diff --exit-code test/fixtures` po `git add`)
- Kodowanie: `node -e` dekodujący plik przez `TextDecoder('windows-1250')` znajduje wiersz zaczynający się od `"Data transakcji"` i polskie znaki w preambule; w bajtach brak BOM, każda linia kończy się CRLF
- CSV trafia do gita mimo `*.csv`: `git check-ignore test/fixtures/ing/*.csv` nie zwraca nic
- Lint przechodzi: `npm run lint`

#### Manual Verification:

- Główny wyciąg otwarty w edytorze z kodowaniem Windows-1250 wygląda jak eksport ING (preambuła, nagłówek, stopka, apostrofy w numerach)
- Każda pułapka T01–T18 ma w pliku rozpoznawalne wiersze i odpowiadające im wpisy w `expected.json`
- Żadna nazwa, kwota, numer ani data nie pochodzi z prawdziwego wyciągu

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 2: Pliki błędów i bramka CI

### Overview

Generator dostaje trzy pliki błędów; powstaje `fixture:check` podpięty do CI i lokalny `fixture:shape`; dokumenty odsyłają do fixture.

### Changes Required:

#### 1. Pliki błędów

**File**: `scripts/fixture-ing.mjs` (rozszerzenie), wynik w `test/fixtures/ing/`

**Intent**: S-01 ma gotowe przypadki odrzucenia z kitu importu bez dopisywania fixture.

**Contract**: Trzy małe pliki (kilka–kilkanaście wierszy), każdy z wpisem w `expected.json` → `files` z `expect: "reject"` i `reason`:
- `overlap` — ten sam numer rachunku głównego, zakres zachodzący na główny (np. `2026-08-01 – 2026-09-30`), plik poza tym poprawny; odrzucenie następuje dopiero po zaimportowaniu głównego (FR-005, `imports_no_overlap`).
- `no-header` — preambuła bez wiersza `"Data transakcji"` (reguła 1).
- `currency` — co najmniej jeden wiersz z `Waluta` ≠ `PLN` (reguła 5).

Nazwy plików rozróżnialne sufiksem (np. `…-overlap.csv`), wszystkie spełniają wyjątek `.gitignore`.

#### 2. Kontrola fixture

**File**: `scripts/fixture-ing-check.mjs`, `package.json`

**Intent**: CI łapie ręczną edycję fixture, złamanie determinizmu i rozjazd z kontraktem formatu lub D1/D2/D5.

**Contract**: `"fixture:check": "node scripts/fixture-ing-check.mjs"`; kod wyjścia ≠ 0 z listą błędów. Sprawdza:
1. Wynik `generate()` == bajty na dysku dla każdego pliku (i brak nadmiarowych plików w `test/fixtures/ing/` poza `README.md`, jeśli pisany ręcznie).
2. Dla plików `ok`, niezależnie z dysku: brak BOM, CRLF, dekodowanie cp1250 i round-trip, nagłówek od `"Data transakcji"`, 21 pól w każdym wierszu danych, regex daty w kolumnie 0, `Liczba transakcji` == liczba wierszy danych, zakres z preambuły obejmuje daty wierszy, apostrofy w kolumnach 4 i 7.
3. Manifest: każdy wiersz danych ma wpis w `rows`; `imported` zgodne z D1 (domyślny rachunek = najwięcej wierszy) i D2 (kwota < 0); `imported.count`/`sumMinor` zgodne z wierszami; każdy wzorzec `fixed` ma wszystkie kwoty w tolerancji D5 od mediany, każdy `frequent` z ≥ 2 wystąpieniami ma co najmniej jedną poza tolerancją; T16 ma `firstMonth` = ostatni miesiąc zakresu; każda pułapka T01–T18 występuje w co najmniej jednym wierszu.
4. Dla plików `reject`: istnienie warunku z `reason` (brak nagłówka / waluta ≠ PLN / zakres nachodzi na główny przy tym samym numerze rachunku).

#### 3. Bramka CI

**File**: `.github/workflows/ci.yml`

**Intent**: Fixture jest pilnowane jak lint.

**Contract**: W jobie `ci` krok `- run: npm run fixture:check` po `npm run lint`.

#### 4. Lokalne porównanie kształtu

**File**: `scripts/fixture-ing-shape.mjs`, `package.json`

**Intent**: Rozstrzyga nieznaną z roadmapy („które kształty trzeba odwzorować”) bez wycieku danych: porównuje strukturę fixture z prawdziwym wyciągiem.

**Contract**: `"fixture:shape": "node scripts/fixture-ing-shape.mjs"`; czyta `data/Lista_transakcji_*.csv` (brak pliku → komunikat i kod 0, więc nigdy nie jest bramką CI). Dla obu stron wypisuje wyłącznie: BOM/końce linii, numer wiersza nagłówka, etykiety preambuły z białej listy (`Wybrane rachunki:`, `Zakres dat:`, `Liczba transakcji:` …) bez wartości, liczbę kolumn, liczbę rachunków, rozkład typów `Szczegóły` (klasy z białej listy: `TR.BLIK`, `PRZELEW`, `P.BLIK`, `PRZ SP`, inne), udział wierszy z różnymi datami, udział uznań, obecność apostrofów/spacji w kolumnach 4 i 7, udział wierszy z operatorem płatności w kontrahencie; oraz różnice między stronami. Nigdy nie wypisuje kontrahentów, tytułów, kwot, numerów ani dat.

#### 5. Dokumenty

**File**: `supabase/seed.sql`, `context/foundation/import-formats.md`

**Intent**: Usunąć nieaktualną zapowiedź i wskazać, gdzie żyją kształty.

**Contract**: Komentarz `seed.sql:7` → dane domeny nie są seedowane; fixture w `test/fixtures/ing/`, dane w bazie przez import (S-01) i konto demo (S-09). W `import-formats.md`, sekcja „Kształty do seeda” (ING): jedna linia odsyłająca do `test/fixtures/ing/README.md` (identyfikatory T01–T18).

### Success Criteria:

#### Automated Verification:

- Kontrola przechodzi: `npm run fixture:check` kończy się kodem 0
- Kontrola łapie zmianę: po ręcznej zmianie jednego bajtu w głównym CSV `npm run fixture:check` kończy się kodem ≠ 0 (potem `git checkout` pliku)
- Pliki błędów istnieją z wpisami `expect: "reject"` dla `overlap`, `no-header`, `currency` w `expected.json`
- `npm run fixture:shape` bez pliku w `data/` kończy się kodem 0 z komunikatem
- Lint przechodzi: `npm run lint`
- Job `ci` w GitHub Actions jest zielony z krokiem `fixture:check`

#### Manual Verification:

- `npm run fixture:shape` na prawdziwym wyciągu lokalnie: wyjście nie zawiera żadnych danych (nazw, kwot, numerów, dat), a różnice struktury są zrozumiałe lub naprawione w generatorze
- `README.md` fixture pozwala osobie spoza projektu znaleźć wiersze danej pułapki i zregenerować pliki

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Testing Strategy

### Unit Tests:

- Brak runnera jednostkowego (decyzja S-01). Rolę testów pełni `fixture:check`: bajtowe porównanie z generatorem, kontrakt formatu i samospójność manifestu z D1/D2/D5.

### Integration Tests:

- Pośrednio w S-01/S-03: parser i wykrywanie będą asertowane na `expected.json`.

### Manual Testing Steps:

1. `npm run fixture:ing`, otworzyć główny CSV w edytorze z kodowaniem Windows-1250; porównać wzrokowo z układem z `import-formats.md`.
2. Dla 3 losowych pułapek znaleźć wiersze po `traps` w `expected.json` i sprawdzić je w pliku.
3. `npm run fixture:shape` lokalnie z prawdziwym plikiem w `data/`; upewnić się, że wyjście nie zawiera danych.

## Performance Considerations

Brak — kilkaset wierszy, generacja w milisekundach. Fixture jest też materiałem do pomiaru czasu parsowania w S-01 (nieznana z roadmapy), ale pomiar należy do S-01.

## Migration Notes

Brak zmian schematu i danych w bazie.

## References

- Roadmapa: `context/foundation/roadmap.md` — F-02 (`synthetic-ing-fixture`), konsumenci S-01, S-03, S-05, S-06, S-09
- Kontrakt formatu: `context/foundation/import-formats.md` (D1–D9, reguły importu ING, kształty do seeda)
- PRD: `context/foundation/prd.md` — FR-014, NFR prywatność danych źródłowych, guardrail determinizm
- Schemat: `supabase/migrations/20260923165530_domain_imports_transactions.sql`, `supabase/migrations/20260924122144_transactions_import_account_fk.sql`
- Wyjątek fixture: `.gitignore:15-17`
- CI: `.github/workflows/ci.yml` (job `ci`)

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Generator, główny wyciąg i klucz odpowiedzi

#### Automated

- [x] 1.1 Generator tworzy pliki: `npm run fixture:ing` kończy się kodem 0 i zapisuje główny wyciąg oraz `expected.json` do `test/fixtures/ing/` — 4b3a3a0
- [x] 1.2 Determinizm: drugie `npm run fixture:ing` nie zmienia plików (`git diff --exit-code test/fixtures` po `git add`) — 4b3a3a0
- [x] 1.3 Kodowanie: `node -e` dekodujący plik przez `TextDecoder('windows-1250')` znajduje wiersz zaczynający się od `"Data transakcji"` i polskie znaki w preambule; w bajtach brak BOM, każda linia kończy się CRLF — 4b3a3a0
- [x] 1.4 CSV trafia do gita mimo `*.csv`: `git check-ignore test/fixtures/ing/*.csv` nie zwraca nic — 4b3a3a0
- [x] 1.5 Lint przechodzi: `npm run lint` — 4b3a3a0

#### Manual

- [x] 1.6 Główny wyciąg otwarty w edytorze z kodowaniem Windows-1250 wygląda jak eksport ING (preambuła, nagłówek, stopka, apostrofy w numerach) — 4b3a3a0
- [x] 1.7 Każda pułapka T01–T18 ma w pliku rozpoznawalne wiersze i odpowiadające im wpisy w `expected.json` — 4b3a3a0
- [x] 1.8 Żadna nazwa, kwota, numer ani data nie pochodzi z prawdziwego wyciągu — 4b3a3a0

### Phase 2: Pliki błędów i bramka CI

#### Automated

- [x] 2.1 Kontrola przechodzi: `npm run fixture:check` kończy się kodem 0
- [x] 2.2 Kontrola łapie zmianę: po ręcznej zmianie jednego bajtu w głównym CSV `npm run fixture:check` kończy się kodem ≠ 0 (potem `git checkout` pliku)
- [x] 2.3 Pliki błędów istnieją z wpisami `expect: "reject"` dla `overlap`, `no-header`, `currency` w `expected.json`
- [x] 2.4 `npm run fixture:shape` bez pliku w `data/` kończy się kodem 0 z komunikatem
- [x] 2.5 Lint przechodzi: `npm run lint`
- [ ] 2.6 Job `ci` w GitHub Actions jest zielony z krokiem `fixture:check`

#### Manual

- [x] 2.7 `npm run fixture:shape` na prawdziwym wyciągu lokalnie: wyjście nie zawiera żadnych danych (nazw, kwot, numerów, dat), a różnice struktury są zrozumiałe lub naprawione w generatorze
- [x] 2.8 `README.md` fixture pozwala osobie spoza projektu znaleźć wiersze danej pułapki i zregenerować pliki
