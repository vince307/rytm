# Syntetyczny wyciąg ING (fixture F-02)

Plik wygenerowany przez `scripts/fixture-ing.mjs` — nie edytuj ręcznie.

## Pochodzenie

Kształt plików pochodzi z `context/foundation/import-formats.md` i ze strukturalnego porównania z prawdziwym
eksportem (tylko maski pól, cudzysłowy i liczniki — bez wartości):

- cp1250 bez BOM, końce linii LF, separator `;`, 21 pól w wierszu danych i nagłówku (pola 15–20 puste);
- preambuła o zmiennej długości (17 linii + 1 na rachunek; nagłówek w linii 18 + n): nagłówek banku, `Dokument nr …`, `Wygenerowany dnia: …`,
  `Dane Użytkownika:`, `Wybrane rachunki:` (`"<nazwa> (PLN)";;"<numer>";`), `Zakres dat:` / `Liczba transakcji:`,
  `Suma uznań (N):` / `Suma obciążeń (N):` (kwoty bez znaku, bez cudzysłowu); przy 2 rachunkach nagłówek kolumn
  od `"Data transakcji"` jest w linii 20 — parser ma go szukać, nie liczyć linii;
- mieszane cudzysłowy: daty, kwota, waluta, `Nr rachunku` (`'<cyfry> '`) i `Nr transakcji` (`'<18 cyfr>'`) bez `"`;
  `Dane kontrahenta` ze spacją na początku i na końcu, `Tytuł` ze spacją na początku, `Szczegóły` z dwiema spacjami po typie
  (`PRZ SP Ref SP: <ref> ` przy split payment), `Konto` = nazwa rachunku bez ` (PLN)`;
- cudzysłów wewnątrz `Dane kontrahenta` nie jest podwajany (`" PHU "NAZWA" … "`) — pole kończy `"` przed `;` lub końcem linii;
- `TR.BLIK` prawie zawsze bez `Nr rachunku` i `Nazwa banku`; stopka `"Dokument ma charakter informacyjny…";` po 2 pustych liniach.

Wszystkie nazwy, numery, kwoty i daty są wymyślone — żadna wartość nie pochodzi z prawdziwego wyciągu
(jedyny prawdziwy napis to nagłówek banku w linii 1).

## Pliki

| Plik | Oczekiwany wynik |
|---|---|
| `Lista_transakcji_nr_0000123456_010926.csv` | ok; rachunek domyślny `Rachunek Firmowy Główny`, 234 wierszy, import 206 obciążeń, suma 64975,47 zł |
| `Lista_transakcji_nr_0000123457_011026-overlap.csv` | reject (`overlap`): zakres nachodzi na główny wyciąg przy tym samym numerze rachunku; odrzucenie dopiero po zaimportowaniu głównego (FR-005, `imports_no_overlap`); wiersze danych: 7, zakres 2026-08-01 – 2026-09-30 |
| `Lista_transakcji_nr_0000098765_011024-no-header.csv` | reject (`no-header`): brak wiersza nagłówka `"Data transakcji"` — preambuła przechodzi wprost w wiersze danych (reguła 1); wiersze danych: 4, zakres 2024-09-01 – 2024-09-30 |
| `Lista_transakcji_nr_0000099876_021124-currency.csv` | reject (`currency`): jeden wiersz z `Waluta` = `EUR` (reguła 5); wiersze danych: 4, zakres 2024-10-01 – 2024-10-31 |
| `expected.json` | klucz odpowiedzi: `files`, `rows` (każdy wiersz danych plików `ok`), `patterns` (oczekiwane wzorce) |

Zakres głównego wyciągu: 2025-09-01 – 2026-08-31; rachunki: Rachunek Firmowy Główny (222), Rachunek VAT (12).

## Klucz odpowiedzi (`expected.json`)

- `rows[]` — w kolejności pliku; `line` = numer linii w pliku (od 1), `bankTxId` = `Nr transakcji` bez `'` i spacji,
  `amountMinor` w groszach ze znakiem jak w pliku, `imported`/`skipReason` (`credit` | `other-account`) wg D1/D2
  przy rachunku domyślnym, `rawMerchant` wg reguły 7 (tylko importowane), `pattern` = klucz oczekiwanego wzorca.
- `patterns[]` — liczone tylko z importowanych wierszy; `sumMinor`/`medianMinor` jako kwoty dodatnie,
  `type` wg D5 (`tolerance`), `resolvedBy`: `import` (reguła 7 / D3), `normalization` (FR-006),
  `user-merge` / `user-exclude` (decyzje FR-009), `rawMerchants` = surowi sprzedawcy scaleni we wzorzec.
- `files[].accounts[]` — `name` jak w kolumnie `Konto`, `preambleName` jak w preambule (z ` (PLN)`), `number` bez spacji;
  `imported.sumMinor` — suma importowanych obciążeń (dodatnia).
- `files[].expect` — `ok` albo `reject` z `reason`: `overlap` (zakres nachodzi na plik z `overlapsWith` przy tym
  samym numerze rachunku — odrzucenie dopiero po zaimportowaniu tamtego), `no-header` (brak wiersza
  `"Data transakcji"`), `currency` (`Waluta` ≠ `PLN`). Plik `reject` nie importuje niczego (`imported.count` = 0),
  a jego wiersze nie trafiają do `rows[]` ani `patterns[]`; poza swoją wadą ma ten sam kształt co główny wyciąg.

## Pułapki

Wiersze pułapki: `rows[]` z danym identyfikatorem w `traps`; wzorce: `patterns[]` z tym identyfikatorem.

| ID | Pułapka | Oczekiwany wynik | Linie w głównym pliku |
|---|---|---|---|
| T01 | Ten sam sprzedawca w dwóch zapisach (`sportowo.pl …` vs `SPORTOWO SP. Z O.O. …`) | jeden wzorzec, user-merge | 50, 75, 107, 127, 133, 169, 197, 219, 245 |
| T02 | Nazwa sklepu zdublowana w kontrahencie (`PIEKARNIA KŁOSEK PIEKARNIA KŁOSEK …`) | jeden wzorzec, normalization | 43, 94, 143, 172, 205, 252 |
| T03 | Sieć z numerem placówki, dwie placówki (`MINIMARKET PRZYSTANEK 0412/1187`) | jeden wzorzec, normalization | 28, 62, 102, 138, 157, 184, 216, 243 |
| T04 | Operator płatności z domeną sprzedawcy w końcówce `Tytułu` BLIK | surowy sprzedawca = domena (D3), import | 40, 58, 60, 66, 80, 88, 103, 116, 123, 145, 146, 147, 163, 164, 167, 179, 190, 198, 211, 215, 233, 236, 254 |
| T05 | Operator bez domeny w `Tytule` (Autopay) | surowy sprzedawca = kontrahent ze zwiniętymi spacjami | 115, 200 |
| T06 | Przelew własny między rachunkami: para ±, to samo `Nr transakcji`, różne `Konto` | obciążenie na głównym importowane, strona VAT pominięta (D1) | 69, 70, 152, 153, 225, 226 |
| T07 | Split payment VAT (`PRZ SP Ref SP: …`), para na głównym i VAT | obciążenie na głównym importowane, strona VAT pominięta (D1) | 63, 64, 129, 130, 180, 181, 239, 240 |
| T08 | Powtarzalny przelew na własne konto w innym banku (D8) | wzorzec, user-exclude | 30, 51, 73, 97, 117, 139, 158, 171, 191, 208, 228, 246 |
| T09 | Opłaty US/ZUS, powtarzalne, zmienna kwota | frequent | 23, 31, 47, 52, 65, 74, 91, 98, 113, 118, 134, 140, 150, 159, 168, 173, 182, 192, 202, 209, 221, 229, 242, 247 |
| T10 | Abonament ze stałą kwotą | fixed | 33, 54, 76, 99, 119, 142, 160, 174, 194, 212, 231, 250 |
| T11 | Abonament z dwiema podwyżkami (~12%, potem +4 zł) | jeden wzorzec fixed przy D5 | 27, 49, 67, 92, 114, 135, 151, 170, 185, 204, 224, 244 |
| T12 | Sprzedawca z rozrzutem ~45% | frequent | 22, 48, 82, 110, 126, 155, 178, 199, 223, 237 |
| T13 | Zwrot BLIK (kwota dodatnia, `Zwrot transakcji BLIK … Nr zwrotu …`) | pominięty, skipReason credit (D2) | 127, 186 |
| T14 | PayPal jako pośrednik | sprzedawca nieprzezroczysty (FR-014) | 38, 120, 165, 230 |
| T15 | Allegro | sprzedawca nieprzezroczysty (D3) | 42, 96, 149, 186, 195, 203, 248 |
| T16 | Nowy wzorzec stały tylko w ostatnim miesiącu | fixed, firstMonth 2026-08 (D6) | 36 |
| T17 | Uznania (przelew przychodzący, P.BLIK przychodzący) | pominięte, skipReason credit | 37, 57, 79, 86, 101, 122, 144, 161, 177, 196, 210, 213, 234, 253 |
| T18 | Wiersze rachunku VAT poza parami T06/T07 | pominięte, skipReason other-account (D1) | 45, 111, 156, 166, 218 |
| T19 | Cudzysłów w nazwie kontrahenta bez escapowania (ING nie podwaja `"`) | parser czyta pole łagodnie: `"` zamyka pole tylko przed `;` lub końcem linii; wzorzec, normalization | 81, 148, 214 |

Pozostałe wiersze to szum (`TR.BLIK`, `P.BLIK`) z zasianego PRNG — też mają wpisy w `rows[]` i `patterns[]`.

## Polecenia

- `npm run fixture:ing` — regeneruje wszystkie pliki w tym katalogu (deterministycznie, bajt w bajt).
- `npm run fixture:check` — porównuje pliki z wyjściem generatora i sprawdza kontrakt formatu oraz manifestu.
- `npm run fixture:shape` — lokalnie porównuje strukturę z prawdziwym wyciągiem w `data/` (wypisuje tylko statystyki).

## Zasada zmian

Zmiana fixture = zmiana deklaracji w `scripts/fixture-ing.mjs` + `npm run fixture:ing`. Nie edytuj CSV ani
`expected.json` ręcznie — `fixture:check` odrzuci każdą różnicę względem generatora.
