---
project: "Rytm"
context_type: greenfield
created: 2026-09-18
updated: 2026-10-02
source: "analiza prawdziwych eksportów CSV (lokalnie, pliki nie trafiają do repo)"
banks:
  - id: ing
    name: "ING Bank Śląski"
    status: mvp
  - id: santander
    name: "Santander Bank Polska"
    status: mvp
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
| Kodowanie | **cp1250** (Windows-1250), bez BOM, **LF**, znak nowej linii na końcu pliku |
| Separator | `;` |
| Cudzysłów pól | **mieszany, stały per pole** — `"…"` przy polach tekstowych (Dane kontrahenta, Tytuł, Nazwa banku, Szczegóły, Konto, etykiety preambuły); daty, Nr rachunku, Nr transakcji, kwota, waluta i puste pola bez cudzysłowu. Parser CSV z `quotechar='"'` obsługuje oba |
| Cudzysłów w polu | Cudzysłów wewnątrz pola nie jest escapowany — pole kończy `"` przed `;` lub końcem linii (np. `" FIRMA "NAZWA" SP. Z O.O. MIASTO "`, 3 na 791 wierszy, w Dane kontrahenta). Każdy inny `"` w polu to zwykły znak; `""` to dwa znaki, nie escape. Standardowy parser CSV (RFC 4180) takie pole rozbije — czytać łagodnie (T19) |
| Pułapka | Nr rachunku i Nr transakcji są ujęte w apostrofy `'…'` (trik pod Excela; bez `"`) — to **nie** jest cudzysłów CSV. Nr transakcji: `'<18 cyfr>'` bez spacji; Nr rachunku: `'<26 cyfr> '` albo `'<7 cyfr>\<5 cyfr> '` ze spacją na końcu, puste w większości wierszy `TR.BLIK`. Apostrofy i białe znaki trzeba zdjąć |
| Białe znaki | Dane kontrahenta ze spacją na początku i na końcu, Tytuł ze spacją na początku, Szczegóły `<TYP>␣␣` albo `<TYP> Ref SP: <ref>␣` — przyciąć przed użyciem |
| Kwota | `-116,85` — przecinek dziesiętny, bez separatora tysięcy, minus = obciążenie |
| Daty | `YYYY-MM-DD`; dwie kolumny: `Data transakcji` (używana) i `Data księgowania` (różnią się w ~1,5% wierszy) |
| Waluta | kolumna `Waluta` przy każdej kwocie; w eksporcie konta PLN zawsze `PLN` |
| Pola wielowierszowe | brak (0 na 791 wierszy) |
| Liczba kolumn | 21 — stała dla nagłówka i każdego wiersza danych; nagłówek ma 15 nazw + 6 pustych pól (15–20) |
| Zakres jednego eksportu | użytkownik wybiera ręcznie; **12 miesięcy w jednym pliku** potwierdzone |

### Struktura pliku

```
preambuła (17 + n linii, n = liczba rachunków; puste linie między blokami):
  "Lista transakcji";;;;;"<nagłówek banku>";…
  "Dokument nr <10 cyfr>_<ddmmyy>";
  "Wygenerowany dnia: YYYY-MM-DD, HH:MM";…
  "Dane Użytkownika:";  +  "<właściciel> , <adres>";
  "Wybrane rachunki:";  +  n × "<nazwa> (PLN)";;"<numer w grupach>";
  "Zastosowane kryteria wyboru";;;;;"Podsumowanie";;
  "Zakres dat:";"YYYY-MM-DD - YYYY-MM-DD";"Typy transakcji:";"wszystkie";;"Liczba transakcji:";N;
  ;;;;;"Suma uznań (N):";<kwota>;PLN;…
  "Ukryto saldo po transakcji";;;;;"Suma obciążeń (N):";<kwota bez znaku>;PLN;…
linia 18 + n    nagłówek kolumn — zaczyna się od "Data transakcji" (przy 2 rachunkach: linia 20)
dalej           dane — każdy wiersz zaczyna się od daty YYYY-MM-DD (bez cudzysłowu)
koniec          2 puste linie + "Dokument ma charakter informacyjny, nie stanowi dowodu księgowego"; (+ znak nowej linii)
```

Parser: szukaj wiersza zaczynającego się od `"Data transakcji"` — długość preambuły zależy od liczby rachunków. Wiersze danych rozpoznawać po regexie daty w pierwszej kolumnie; wszystko inne po nagłówku to stopka.

### Kolumny (indeks od 0)

| Idx | Nazwa | Użycie |
|---|---|---|
| 0 | Data transakcji | data transakcji |
| 1 | Data księgowania | ignorowana |
| 2 | Dane kontrahenta | **główne źródło sprzedawcy**; nazwa + adres, wielokrotne spacje, spacja na początku i na końcu, czasem niepodwojony `"` w środku (T19) |
| 3 | Tytuł | spacja na początku; dla BLIK: `Płatność BLIK dd.mm.yyyy Nr transakcji NNN <domena sprzedawcy>` — końcówka to sprzedawca, gdy kontrahent jest operatorem płatności (D3) |
| 4 | Nr rachunku | kontrahenta; w `'…'` ze spacją na końcu; puste w większości `TR.BLIK` (wtedy puste też pole 5) |
| 5 | Nazwa banku | ignorowana |
| 6 | Szczegóły | typ: `TR.BLIK` (63%), `PRZELEW` (21%), `P.BLIK` (przelew na telefon), `PRZ SP Ref SP: …` (split payment VAT) |
| 7 | Nr transakcji | `'<18 cyfr>'`; **ID stabilne tylko w parze `(Nr transakcji, Konto)`** — samo ID powtarza się dla dwóch stron przelewu własnego i split payment |
| 8 | Kwota transakcji (waluta rachunku) | kwota |
| 9 | Waluta | walidacja `PLN` |
| 10–13 | Kwota blokady / Kwota płatności w walucie (+ waluty) | puste w eksporcie PLN; blokady nie występują w pliku |
| 14 | Konto | **nazwa rachunku** (jak w preambule, bez ` (PLN)`) — klucz filtra D1 |
| 15–20 | (bez nazwy) | zawsze puste |

### Reguły importu ING

1. Dekoduj cp1250 → UTF-8. Odrzuć z komunikatem, jeśli brak wiersza `"Data transakcji"`.
2. Odczytaj z preambuły: listę rachunków (`"<nazwa> (PLN)";;"<numer>"` → nazwa → numer bez spacji), zakres dat i liczbę transakcji — obie w jednej linii (`"Zakres dat:"` w polu 0–1, `"Liczba transakcji:"`;N w polu 5–6, N bez cudzysłowu); kontrola parsowania: liczba wierszy danych == N.
3. Zaproponuj rachunek (najwięcej wierszy), użytkownik potwierdza (D1). Pomiń wiersze innych rachunków.
4. Pomiń kwoty ≥ 0 (D2).
5. Waluta ≠ `PLN` → odrzuć plik z komunikatem.
6. Klucz transakcji: `(Nr transakcji, Konto)` po zdjęciu `'` i spacji.
7. Sprzedawca surowy: jeśli `Dane kontrahenta` pasuje do listy operatorów (`PayPro`, `PayU`, `Cashbill`, `Autopay`, `ING Pay` — lista konfigurowalna), weź ostatni token `Tytułu` po `Nr transakcji NNN`; inaczej `Dane kontrahenta` ze zwiniętymi spacjami (D3). Normalizacja właściwa — FR-006, poza tym dokumentem.
8. Zakres importu = `Zakres dat` z preambuły (D7).

### Kształty do seeda (bez danych)

Odwzorowane w syntetycznym fixture `test/fixtures/ing/` — identyfikatory pułapek T01–T19 i wiersze w `test/fixtures/ing/README.md`.

- Ten sam sprzedawca w dwóch zapisach: `marka.pl ADRES Miasto` vs `MARKA SP. Z O.O. ul. Adres Miasto`.
- Nazwa sklepu zdublowana w polu kontrahenta (`SKLEP X SKLEP X Miasto`).
- Sieć z numerem placówki w nazwie (dwie placówki tej samej sieci = dwa surowe sprzedawcy).
- Operator płatności z domeną sprzedawcy w Tytule (D3) oraz operator bez domeny.
- Przelew własny między rachunkami w jednym pliku (para ± tej samej kwoty, to samo ID, różne `Konto`).
- Split payment VAT (para na rachunku głównym i VAT).
- Przelew na własne konto w innym banku, powtarzalny (D8).
- Opłaty urzędowe (US/ZUS) — powtarzalne, zmienna kwota: muszą wyjść jako „częsty”, nie „stały”.
- Abonament ze stałą kwotą; abonament z dwiema podwyżkami — ~12% w 2026-03, potem +4 zł w miesiącu referencyjnym 2026-08 (obie w tolerancji D5, musi zostać jednym wzorcem stałym; druga podwyżka to przypadek „zmiana kwoty” S-06); sprzedawca z rozrzutem ~45% (musi być „częsty”).
- Zwrot BLIK (kwota dodatnia, tytuł `Zwrot transakcji BLIK … Nr zwrotu …`) — pomijany (D2).

## Santander Bank Polska — `historia_<YYYY-MM-DD>_<nr rachunku>.csv`

Status: **MVP** (S-10, po pierwszym przepływie ING jak zakładało D4). Uwaga: w rozmowach ten bank bywał nazywany „Erste” — kod banku w IBAN (`1090`) i układ pliku wskazują na Santander Bank Polska.

| Cecha | Wartość |
|---|---|
| Kodowanie | UTF-8, bez BOM, LF |
| Separator | `,` |
| Cudzysłów pól | `"` — przy kwocie (kol. 5) **i** saldzie po operacji (kol. 6), bo przecinek dziesiętny; w kol. 2/kol. 3 tylko gdy zawierają przecinek. Bez escapowania `""`. **Nie ściśle RFC 4180:** `"` otwiera pole w cudzysłowie tylko na początku pola; pole **bez** cudzysłowu może zawierać `"` w środku (nazwa sprzedawcy w cudzysłowie w końcówce opisu kartowego, ≈ 2% wierszy, różne odstępy: `"X"`, `" X"`, `"X Y"`) — parser nie może takiego wiersza odrzucić (fixture: ST15) |
| Pułapka | Nr rachunku w wierszu nagłówka (kol. 2) z wiodącym `'`, w grupach (2 + 6×4 cyfry, 26 cyfr łącznie, spacje między grupami) |
| Kwota | `"-24,31"` — przecinek dziesiętny, bez separatora tysięcy, minus = obciążenie |
| Daty | `DD-MM-YYYY` w wierszach danych; kol. 0 = data księgowania, kol. 1 = data operacji (**używana**; różnią się w ~90% wierszy — karty księgują z opóźnieniem 1–3 dni; kol. 0 ≥ kol. 1 na każdym wierszu). Nagłówek ma **dwa różne formaty** w jednym wierszu: kol. 0 (data eksportu) `YYYY-MM-DD`, kol. 1 (początek zakresu) `DD-MM-YYYY` |
| Waluta | tylko w wierszu nagłówka (kol. 4) — `PLN` / `USD` / … |
| Nagłówek kolumn | **brak** |
| ID transakcji | **brak** — tylko `Lp` (1..N **rosnąco w kolejności pliku**, sekwencyjne w obrębie eksportu). Wiersze są ≈ od najnowszej daty księgowania, **nie ściśle** — zdarzają się sąsiadujące inwersje (realnie ~8% sąsiednich par); `Lp` 1 ma zawsze unikalnie najwyższą datę księgowania w pliku. Potwierdza FR-005: bez dedupu, odrzucanie nakładających się zakresów |
| Pola wielowierszowe | brak |
| Liczba kolumn | 9 (ostatnia pusta) |

### Struktura pliku

```
wiersz 1     nagłówek: data eksportu (YYYY-MM-DD), data początku zakresu (DD-MM-YYYY),
             'nr rachunku (grupowany, wiodący '), właściciel (jedno pole, bez przecinka),
             waluta, saldo początkowe (w cudzysłowie), saldo końcowe (w cudzysłowie),
             liczba wierszy danych, (puste)
wiersze 2..  dane: data księgowania (DD-MM-YYYY), data operacji (DD-MM-YYYY), opis,
             kontrahent, nr rachunku kontrahenta (grupowany, bez wiodącego '), kwota
             (w cudzysłowie), saldo po operacji (w cudzysłowie), lp, (puste)
```

Koniec zakresu **nie występuje** w nagłówku → D7: koniec = data eksportu (kol. 0 nagłówka).

**Niezmienniki nagłówka** (sprawdzane przez `scripts/fixture-santander-check.mjs`, każdy potwierdzony na prawdziwym eksporcie PLN i USD): saldo początkowe (kol. 5) + Σ kwot wszystkich wierszy danych == saldo końcowe (kol. 6); saldo wiersza `Lp N` minus jego kwota == saldo początkowe; `Lp` 1 ma unikalnie maksymalną datę księgowania w pliku (więc jest chronologicznie ostatni, niezależnie od sposobu rozstrzygania remisów); saldo wiersza `Lp` 1 (kol. 6) == saldo końcowe nagłówka; data w nazwie pliku == kol. 0 nagłówka, a 26 cyfr z nazwy pliku == cyfry kol. 2 nagłówka (bez `'` i spacji). Salda liczone są w prawdziwym porządku chronologicznym (data księgowania, potem data operacji, `Lp` malejąco jako remis) — **nie** w kolejności pliku; plik nie ma gładkiego łańcucha sald we własnej kolejności, więc żadna reguła importu/kontroli nie może tego zakładać.

### Opis transakcji kartowej (kol. 2) — parser regex

```
DOP. VISA <6 cyfr>******<4 cyfry> PŁATNOŚĆ KARTĄ <kwota> <WALUTA> <sprzedawca i miasto>
DOP. VISA …                        ZWROT PŁATNOŚCI KARTĄ <kwota> <WALUTA> <sprzedawca>     → kwota dodatnia, pomijany (D2)
DOP. VISA …                        WYPŁATA Z BANKOMATU KARTĄ <kwota> <WALUTA> <adres>      → rawMerchant = tekst adresu (ten sam regex);
                                                                                               wzorzec „bankomat” to wynik normalizacji (S-11), nie reguły 5
Zakup BLIK <operator/sprzedawca>:<11 cyfr>                                                  → kontrahent w kol. 3; `:<11 cyfr>` jest stałą końcówką opisu
Wypłata BLIK <tekst>:<11 cyfr>                                                              → wypłata gotówki przez BLIK, kontrahent w kol. 3, ta sama `:<11 cyfr>` końcówka;
                                                                                               własny wzorzec, **nie** scalany z „bankomat”; prawdziwe eksporty kończą się
                                                                                               ` ref:<11 cyfr>`, fixture bare `:<11 cyfr>` — kształt końcówki (`:<11 cyfr>`)
                                                                                               jest ten sam, nigdy prawdziwa wartość
Przelew środków / Przelew na telefon / dowolny tytuł (np. faktura/opłata z `/`-separowanymi    → sprzedawca = kol. 3 (kontrahent); tytuł z przecinkiem
  identyfikatorami, w cudzysłowie gdy zawiera przecinek)                                        wychodzi w kol. 2 w cudzysłowie
Oplata za <coś> (ten sam kontrahent/rachunek/tytuł co miesiąc, stała kwota)                 → sprzedawca = kol. 3; wzorzec stały (fixed) po D5 —
                                                                                               **nie** zakładać, że to opłata bankowa (nieudowadnialne z samego kształtu)
```

Końcówka opisu kartowego (sprzedawca/adres) jest **ASCII, bez polskich znaków diakrytycznych**, z pojedynczymi spacjami (2–7 tokenów) — istotne dla łączenia sprzedawców między bankami (S-11). Kwota w opisie ma kropkę dziesiętną, w kol. 5 przecinek; są zgodne (0 rozjazdów na 438 kart). Na jednym rachunku mogą być **dwie karty** (różne końcówki) — numer karty nie jest częścią sprzedawcy. Kol. 3/kol. 4 są puste na każdym wierszu kartowym (w tym bankomatowym); dla BLIK i przelewów kol. 4 (nr rachunku kontrahenta), gdy wypełniona, jest grupowana tak jak nagłówkowa kol. 2 (2 + 6×4 cyfry, spacje między grupami), ale bez cudzysłowu i bez wiodącego `'`.

### Reguły importu Santander

1. Wykryj format po pierwszym wierszu: 9 pól, kol. 0 = `YYYY-MM-DD`, kol. 2 zaczyna się od `'`.
2. Waluta (kol. 4 nagłówka) ≠ `PLN` → odrzuć plik z komunikatem (fixture: plik konta USD).
3. Kontrola: liczba wierszy danych == kol. 7 nagłówka.
4. Pomiń kwoty ≥ 0 (D2).
5. Sprzedawca surowy: regex powyżej dla `DOP. VISA …` (dla WYPŁATA Z BANKOMATU KARTĄ to tekst adresu — wzorzec „bankomat” pojawia się po normalizacji S-11, nie w tej regule); inaczej kol. 3, a gdy pusta — kol. 2.
6. Zakres importu: start = kol. 1 nagłówka, koniec = kol. 0 nagłówka (D7).
7. Brak ID: `Lp` **nie jest** przechowywane (S-10 decyzja 4 — restartuje się per eksport, a `bank_tx_id` jest `null` dla Santandra). FR-005 (odrzucenie nachodzących zakresów importu per rachunek) jest wystarczającą ochroną bez klucza per wiersz.

### Normalizacja sprzedawcy (S-11)

Reguły 1–5 powyżej dają surowy tekst; normalizacja sprzedawcy kartowego żyje w warstwie wzorców
(`src/lib/patterns/santander-card.ts`), nie w czytniku, i działa tylko na wierszach, których `title` pasuje do
bramki opisu kartowego `DOP. VISA …` (ta sama maska/akcja co w regexie powyżej). Wiersz bankomatowy (`WYPŁATA Z
BANKOMATU KARTĄ`) zawsze daje jeden wzorzec `Bankomat`, niezależnie od adresu; `Wypłata BLIK` (własna bramka na
końcówce `:<11 cyfr>`) zawsze daje jeden wzorzec `Wypłata BLIK`, niezależnie od kontrahenta. Dla płatności kartą
kolejność reguł jest ustalona i ma znaczenie: cudzysłowy zamieniane na spacje, potem miasto (pozycyjnie, od końca
końcówki, zawsze min. 1 token), potem kody sklepu/kasy (z wyjątkiem pierwszego tokenu i tokenu po `NR`/`NO`).
Scalanie sprzedawcy między bankami (ING ↔ Santander) działa tylko dla nazw ASCII — końcówka kartowa Santandra jest
ASCII (patrz wyżej), ING zachowuje polskie znaki diakrytyczne, więc wspólny klucz powstaje tylko wtedy, gdy nazwa
sprzedawcy po obu stronach jest bez diakrytyków. Pełne reguły i regexy: `santander-card.ts` (nie powtarzane tu).

### Kształty do seeda (dodatkowe)

- Ta sama sieć z różnymi numerami placówek w opisie kartowym.
- Ten sam sprzedawca zapisany dwojako przez operatora kart (`MARKA *Marka App` vs `Marka Apps Miasto`).
- Wypłata z bankomatu (nie jest sprzedawcą w sensie reguły — użytkownik wyklucza przez FR-009 albo seed pokazuje ją jako wzorzec „częsty”).
- Pełna lista pułapek (ST01–ST15) z liniami w fixture: `test/fixtures/santander/README.md` (generowany przez
  `npm run fixture:santander`, zawsze aktualny po regeneracji).

## Wykrywanie formatu

| Sygnał | Format |
|---|---|
| Pierwszy wiersz zaczyna się od `"Lista transakcji"` (po dekodowaniu cp1250) | ING |
| Pierwszy wiersz: 9 pól rozdzielonych `,`, pole 0 = `YYYY-MM-DD`, pole 2 zaczyna się od `'` | Santander |
| Inaczej | odrzuć: „Nieznany format pliku. Obsługujemy: ING Bank Śląski i Santander Bank Polska.” (S-10) |

Santander jest sprawdzany pierwszy (ścisły UTF-8 + reguła 1 na wierszu 1); dopiero gdy nie pasuje, próbowany jest
czytnik ING bez zmian. Po dopasowaniu reguły 1 późniejszy błąd Santandra (`unknown-format` / `wrong-currency`) jest
ostateczny i nigdy nie wpada do czytnika ING: plik Santandra zapisany ponownie w cp1250 zostaje odrzucony jako
`unknown-format` — tak samo jak ponownie zapisany plik ING — a nie błędnie odczytany jako ING.

## Co pozostaje otwarte

- Lista operatorów płatności do D3 (start: PayPro, PayU, Cashbill, Autopay, ING Pay) — rozszerzana w miarę importów.
- Czy ING pozwala wyeksportować więcej niż 12 miesięcy — nieistotne dla MVP (12 wystarcza na trend), do sprawdzenia przy pierwszym imporcie dłuższej historii.
