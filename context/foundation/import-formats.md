---
project: "Rytm"
context_type: greenfield
created: 2026-09-18
updated: 2026-09-18
source: "analiza prawdziwych eksportów CSV (lokalnie, pliki nie trafiają do repo)"
banks:
  - id: ing
    name: "ING Bank Śląski"
    status: mvp
  - id: santander
    name: "Santander Bank Polska"
    status: after-ing-flow
---

# Formaty importu — Rytm

Kontrakt wejścia dla parsera CSV. Opisuje **kształt** eksportów obu banków i decyzje podjęte 2026-09-18 po analizie prawdziwych plików (1 plik ING za 12 miesięcy, 2 pliki Santander: PLN za 8,5 miesiąca i USD). Żadne dane z tych plików nie są tu ani w repo — zgodnie z guardrailem prywatności z `shape-notes.md`.

## Decyzje (Q&A 2026-09-18)

| # | Temat | Decyzja |
|---|---|---|
| D1 | Wiele rachunków w jednym pliku ING | Import obejmuje **jeden rachunek**, wybierany przy imporcie (domyślnie ten z największą liczbą transakcji). Wiersze pozostałych rachunków są pomijane. |
| D2 | Uznania i zwroty | Import bierze **tylko obciążenia** (kwota < 0). Uznania i zwroty (`Zwrot transakcji BLIK`, `ZWROT PŁATNOŚCI KARTĄ`) są pomijane — sumy zawyżone o zwrócone kwoty (rząd kilku przypadków/rok), akceptowane uproszczenie. |
| D3 | Operatorzy płatności (PayPro, PayU, Cashbill, Autopay) | Gdy kontrahent jest operatorem płatności, **sprzedawcą staje się domena z końcówki pola Tytuł** (ING). Allegro pozostaje sprzedawcą nieprzezroczystym. Zmienia założenie z rundy Sokratesa o FR-017. |
| D4 | Santander | Wchodzi do MVP **dopiero po pierwszym działającym przepływie ING**, tylko jeśli zostanie czas. Plik USD = fixture testu „waluta ≠ PLN → odrzuć”. |
| D5 | Tolerancja wzorca stałego | **15% od mediany kwot LUB ±10 zł, co większe.** Na prawdziwych danych: abonamenty telekom 5–6%, streaming z podwyżką 12%, pierwszy sprzedawca „częsty” 44%. |
| D6 | „Poprzedni okres” (FR-012) | **Poprzedni miesiąc kalendarzowy.** Nowy wzorzec stały = ma wystąpienie w bieżącym miesiącu, nie miał w poprzednim. |
| D7 | Zakres importu (FR-005) | **Z nagłówka pliku, gdy jest; inaczej z dat transakcji.** ING: jawny zakres z preambuły. Santander: start z nagłówka, koniec = data eksportu z nagłówka. Zakres pokazany użytkownikowi przed potwierdzeniem importu. |
| D8 | Przelewy między własnymi bankami | **Nic w parserze** — wykluczenie wzorca przez FR-009 (trwałe). Pułapka trafia do seeda. |
| D9 | Konto firmowe jako źródło | Persona bez zmian; wydatki osobiste są na tym koncie. Skutek: D1 + wykluczenie opłat urzędowych przez FR-009. |

## ING Bank Śląski — `Lista_transakcji_nr_<dok>_<ddmmyy>.csv`

Status: **MVP**. Weryfikacja bramki dnia pierwszego: pozytywna.

| Cecha | Wartość |
|---|---|
| Kodowanie | **cp1250** (Windows-1250), bez BOM, CRLF |
| Separator | `;` |
| Cudzysłów pól | `"` — parser CSV z `quotechar='"'` |
| Pułapka | Nr rachunku i Nr transakcji są dodatkowo ujęte w apostrofy `'…'` (trik pod Excela) i mają spacje na końcu — apostrofy i białe znaki trzeba zdjąć, to **nie** jest cudzysłów CSV |
| Kwota | `-116,85` — przecinek dziesiętny, bez separatora tysięcy, minus = obciążenie |
| Daty | `YYYY-MM-DD`; dwie kolumny: `Data transakcji` (używana) i `Data księgowania` (różnią się w ~1,5% wierszy) |
| Waluta | kolumna `Waluta` przy każdej kwocie; w eksporcie konta PLN zawsze `PLN` |
| Pola wielowierszowe | brak (0 na 791 wierszy) |
| Liczba kolumn | 21 (ostatnie 6 puste) — stała dla każdego wiersza danych |
| Zakres jednego eksportu | użytkownik wybiera ręcznie; **12 miesięcy w jednym pliku** potwierdzone |

### Struktura pliku

```
wiersze 1–20   preambuła: nazwa dokumentu, data generowania, dane właściciela,
               „Wybrane rachunki:” (nazwa rachunku ;; numer — 1..n wierszy),
               „Zakres dat:”;"YYYY-MM-DD - YYYY-MM-DD", „Liczba transakcji:”;N,
               suma uznań / obciążeń
wiersz 21      nagłówek kolumn — zaczyna się od "Data transakcji"
wiersze 22..   dane — każdy wiersz zaczyna się od daty YYYY-MM-DD
koniec         puste wiersze + "Dokument ma charakter informacyjny…"
```

Parser: szukaj wiersza zaczynającego się od `"Data transakcji"`, nie liczyć na stałe 20 wierszy preambuły. Wiersze danych rozpoznawać po regexie daty w pierwszej kolumnie; wszystko inne po nagłówku to stopka.

### Kolumny (indeks od 0)

| Idx | Nazwa | Użycie |
|---|---|---|
| 0 | Data transakcji | data transakcji |
| 1 | Data księgowania | ignorowana |
| 2 | Dane kontrahenta | **główne źródło sprzedawcy**; nazwa + adres, wielokrotne spacje |
| 3 | Tytuł | dla BLIK: `Płatność BLIK dd.mm.yyyy Nr transakcji NNN <domena sprzedawcy>` — końcówka to sprzedawca, gdy kontrahent jest operatorem płatności (D3) |
| 4 | Nr rachunku | kontrahenta; w `'…'` |
| 5 | Nazwa banku | ignorowana |
| 6 | Szczegóły | typ: `TR.BLIK` (63%), `PRZELEW` (21%), `P.BLIK` (przelew na telefon), `PRZ SP Ref SP: …` (split payment VAT) |
| 7 | Nr transakcji | **ID stabilne tylko w parze `(Nr transakcji, Konto)`** — samo ID powtarza się dla dwóch stron przelewu własnego i split payment |
| 8 | Kwota transakcji (waluta rachunku) | kwota |
| 9 | Waluta | walidacja `PLN` |
| 10–13 | Kwota blokady / Kwota płatności w walucie (+ waluty) | puste w eksporcie PLN; blokady nie występują w pliku |
| 14 | Konto | **nazwa rachunku** — klucz filtra D1 |

### Reguły importu ING

1. Dekoduj cp1250 → UTF-8. Odrzuć z komunikatem, jeśli brak wiersza `"Data transakcji"`.
2. Odczytaj z preambuły: listę rachunków (nazwa → numer), zakres dat, liczbę transakcji (do kontroli poprawności parsowania: liczba wierszy danych == N).
3. Zaproponuj rachunek (najwięcej wierszy), użytkownik potwierdza (D1). Pomiń wiersze innych rachunków.
4. Pomiń kwoty ≥ 0 (D2).
5. Waluta ≠ `PLN` → odrzuć plik z komunikatem.
6. Klucz transakcji: `(Nr transakcji, Konto)` po zdjęciu `'` i spacji.
7. Sprzedawca surowy: jeśli `Dane kontrahenta` pasuje do listy operatorów (`PayPro`, `PayU`, `Cashbill`, `Autopay`, `ING Pay` — lista konfigurowalna), weź ostatni token `Tytułu` po `Nr transakcji NNN`; inaczej `Dane kontrahenta` ze zwiniętymi spacjami (D3). Normalizacja właściwa — FR-006, poza tym dokumentem.
8. Zakres importu = `Zakres dat` z preambuły (D7).

### Kształty do seeda (bez danych)

- Ten sam sprzedawca w dwóch zapisach: `marka.pl ADRES Miasto` vs `MARKA SP. Z O.O. ul. Adres Miasto`.
- Nazwa sklepu zdublowana w polu kontrahenta (`SKLEP X SKLEP X Miasto`).
- Sieć z numerem placówki w nazwie (dwie placówki tej samej sieci = dwa surowe sprzedawcy).
- Operator płatności z domeną sprzedawcy w Tytule (D3) oraz operator bez domeny.
- Przelew własny między rachunkami w jednym pliku (para ± tej samej kwoty, to samo ID, różne `Konto`).
- Split payment VAT (para na rachunku głównym i VAT).
- Przelew na własne konto w innym banku, powtarzalny (D8).
- Opłaty urzędowe (US/ZUS) — powtarzalne, zmienna kwota: muszą wyjść jako „częsty”, nie „stały”.
- Abonament ze stałą kwotą; abonament z jedną podwyżką ~12% (musi zostać jednym wzorcem stałym przy D5); sprzedawca z rozrzutem ~45% (musi być „częsty”).
- Zwrot BLIK (kwota dodatnia, tytuł `Zwrot transakcji BLIK … Nr zwrotu …`) — pomijany (D2).

## Santander Bank Polska — `historia_<YYYY-MM-DD>_<nr rachunku>.csv`

Status: **po pierwszym przepływie ING** (D4). Uwaga: w rozmowach ten bank bywał nazywany „Erste” — kod banku w IBAN (`1090`) i układ pliku wskazują na Santander Bank Polska.

| Cecha | Wartość |
|---|---|
| Kodowanie | UTF-8, bez BOM, LF |
| Separator | `,` |
| Cudzysłów pól | `"` — tylko przy kwotach (bo przecinek dziesiętny) i polach zawierających przecinek |
| Pułapka | Nr rachunku w wierszu nagłówka z wiodącym `'` |
| Kwota | `"-24,31"` — przecinek dziesiętny, minus = obciążenie |
| Daty | `DD-MM-YYYY`; kol. 0 = data księgowania, kol. 1 = data operacji (**używana**; różnią się w ~90% wierszy — karty księgują z opóźnieniem 1–3 dni) |
| Waluta | tylko w wierszu nagłówka (kol. 4) — `PLN` / `USD` / … |
| Nagłówek kolumn | **brak** |
| ID transakcji | **brak** — tylko `Lp` (1..N, malejąco po dacie księgowania, sekwencyjne w obrębie eksportu). Potwierdza FR-005: bez dedupu, odrzucanie nakładających się zakresów |
| Pola wielowierszowe | brak |
| Liczba kolumn | 9 (ostatnia pusta) |

### Struktura pliku

```
wiersz 1     nagłówek: data eksportu, data początku zakresu, 'nr rachunku, właściciel,
             waluta, saldo początkowe, saldo końcowe, liczba wierszy, (puste)
wiersze 2..  dane: data księgowania, data operacji, opis, kontrahent, nr rachunku
             kontrahenta, kwota, saldo po operacji, lp, (puste)
```

Koniec zakresu **nie występuje** w nagłówku → D7: koniec = data eksportu (kol. 0 nagłówka).

### Opis transakcji kartowej (kol. 2) — parser regex

```
DOP. VISA <6 cyfr>******<4 cyfry> PŁATNOŚĆ KARTĄ <kwota> <WALUTA> <sprzedawca i miasto>
DOP. VISA …                        ZWROT PŁATNOŚCI KARTĄ <kwota> <WALUTA> <sprzedawca>     → kwota dodatnia, pomijany (D2)
DOP. VISA …                        WYPŁATA Z BANKOMATU KARTĄ <kwota> <WALUTA> <adres>      → sprzedawca „bankomat”
Zakup BLIK <operator/sprzedawca>                                                            → kontrahent w kol. 3
Przelew środków / Przelew na telefon / dowolny tytuł                                        → sprzedawca = kol. 3 (kontrahent)
```

Kwota w opisie ma kropkę dziesiętną, w kol. 5 przecinek; są zgodne (0 rozjazdów na 438 kart). Na jednym rachunku mogą być **dwie karty** (różne końcówki) — numer karty nie jest częścią sprzedawcy.

### Reguły importu Santander

1. Wykryj format po pierwszym wierszu: 9 pól, kol. 0 = `YYYY-MM-DD`, kol. 2 zaczyna się od `'`.
2. Waluta (kol. 4 nagłówka) ≠ `PLN` → odrzuć plik z komunikatem (fixture: plik konta USD).
3. Kontrola: liczba wierszy danych == kol. 7 nagłówka.
4. Pomiń kwoty ≥ 0 (D2).
5. Sprzedawca surowy: regex powyżej dla `DOP. VISA …`; inaczej kol. 3, a gdy pusta — kol. 2.
6. Zakres importu: start = kol. 1 nagłówka, koniec = kol. 0 nagłówka (D7).
7. Brak ID: klucz wewnętrzny = `(import_id, lp)`.

### Kształty do seeda (dodatkowe)

- Ta sama sieć z różnymi numerami placówek w opisie kartowym.
- Ten sam sprzedawca zapisany dwojako przez operatora kart (`MARKA *Marka App` vs `Marka Apps Miasto`).
- Wypłata z bankomatu (nie jest sprzedawcą w sensie reguły — użytkownik wyklucza przez FR-009 albo seed pokazuje ją jako wzorzec „częsty”).

## Wykrywanie formatu

| Sygnał | Format |
|---|---|
| Pierwszy wiersz zaczyna się od `"Lista transakcji"` (po dekodowaniu cp1250) | ING |
| Pierwszy wiersz: 9 pól rozdzielonych `,`, pole 0 = `YYYY-MM-DD`, pole 2 zaczyna się od `'` | Santander |
| Inaczej | odrzuć: „Nieznany format pliku. Obsługiwane: eksport CSV z ING Bank Śląski” (+ Santander po D4) |

## Co pozostaje otwarte

- Lista operatorów płatności do D3 (start: PayPro, PayU, Cashbill, Autopay, ING Pay) — rozszerzana w miarę importów.
- Czy ING pozwala wyeksportować więcej niż 12 miesięcy — nieistotne dla MVP (12 wystarcza na trend), do sprawdzenia przy pierwszym imporcie dłuższej historii.
