# Syntetyczny wyciąg ING (fixture F-02)

Plik wygenerowany przez `scripts/fixture-ing.mjs` — nie edytuj ręcznie.

## Pochodzenie

Kształt plików pochodzi z `context/foundation/import-formats.md` i ze strukturalnego porównania z prawdziwym
eksportem (tylko maski pól, cudzysłowy i liczniki — bez wartości):

- cp1250 bez BOM, końce linii LF, separator `;`, 21 pól w wierszu danych i nagłówku (pola 15–20 puste);
- preambuła o zmiennej długości (18 linii + 1 na rachunek): nagłówek banku, `Dokument nr …`, `Wygenerowany dnia: …`,
  `Dane Użytkownika:`, `Wybrane rachunki:` (`"<nazwa> (PLN)";;"<numer> ";`), `Zakres dat:` / `Liczba transakcji:`,
  `Suma uznań (N):` / `Suma obciążeń (N):` (kwoty bez znaku, bez cudzysłowu); przy 2 rachunkach nagłówek kolumn
  od `"Data transakcji"` jest w linii 20 — parser ma go szukać, nie liczyć linii;
- mieszane cudzysłowy: daty, kwota, waluta, `Nr rachunku` (`'<cyfry> '`) i `Nr transakcji` (`'<18 cyfr>'`) bez `"`;
  `Dane kontrahenta` ze spacją na końcu, `Tytuł` ze spacją na początku, `Szczegóły` z dwiema spacjami po typie
  (`PRZ SP Ref SP: <ref> ` przy split payment), `Konto` = nazwa rachunku bez ` (PLN)`;
- `TR.BLIK` prawie zawsze bez `Nr rachunku` i `Nazwa banku`; stopka `Dokument ma charakter informacyjny…`.

Wszystkie nazwy, numery, kwoty i daty są wymyślone — żadna wartość nie pochodzi z prawdziwego wyciągu
(jedyny prawdziwy napis to nagłówek banku w linii 1).

## Pliki

| Plik | Oczekiwany wynik |
|---|---|
| `Lista_transakcji_nr_0000123456_010926.csv` | ok; rachunek domyślny `Rachunek Firmowy Główny`, 231 wierszy, import 203 obciążeń, suma 64763,97 zł |
| `expected.json` | klucz odpowiedzi: `files`, `rows` (każdy wiersz danych), `patterns` (oczekiwane wzorce) |

Zakres głównego wyciągu: 2025-09-01 – 2026-08-31; rachunki: Rachunek Firmowy Główny (219), Rachunek VAT (12).

## Klucz odpowiedzi (`expected.json`)

- `rows[]` — w kolejności pliku; `line` = numer linii w pliku (od 1), `bankTxId` = `Nr transakcji` bez `'` i spacji,
  `amountMinor` w groszach ze znakiem jak w pliku, `imported`/`skipReason` (`credit` | `other-account`) wg D1/D2
  przy rachunku domyślnym, `rawMerchant` wg reguły 7 (tylko importowane), `pattern` = klucz oczekiwanego wzorca.
- `patterns[]` — liczone tylko z importowanych wierszy; `sumMinor`/`medianMinor` jako kwoty dodatnie,
  `type` wg D5 (`tolerance`), `resolvedBy`: `import` (reguła 7 / D3), `normalization` (FR-006),
  `user-merge` / `user-exclude` (decyzje FR-009), `rawMerchants` = surowi sprzedawcy scaleni we wzorzec.
- `files[].accounts[]` — `name` jak w kolumnie `Konto`, `preambleName` jak w preambule (z ` (PLN)`), `number` bez spacji;
  `imported.sumMinor` — suma importowanych obciążeń (dodatnia).

## Pułapki

Wiersze pułapki: `rows[]` z danym identyfikatorem w `traps`; wzorce: `patterns[]` z tym identyfikatorem.

| ID | Pułapka | Oczekiwany wynik | Linie w głównym pliku |
|---|---|---|---|
| T01 | Ten sam sprzedawca w dwóch zapisach (`sportowo.pl …` vs `SPORTOWO SP. Z O.O. …`) | jeden wzorzec, user-merge | 50, 75, 106, 126, 132, 167, 195, 216, 242 |
| T02 | Nazwa sklepu zdublowana w kontrahencie (`PIEKARNIA KŁOSEK PIEKARNIA KŁOSEK …`) | jeden wzorzec, normalization | 43, 93, 142, 170, 203, 249 |
| T03 | Sieć z numerem placówki, dwie placówki (`MINIMARKET PRZYSTANEK 0412/1187`) | jeden wzorzec, normalization | 28, 62, 101, 137, 155, 182, 213, 240 |
| T04 | Operator płatności z domeną sprzedawcy w końcówce `Tytułu` BLIK | surowy sprzedawca = domena (D3), import | 40, 58, 60, 66, 80, 87, 102, 115, 122, 144, 145, 146, 161, 162, 165, 177, 188, 196, 209, 212, 230, 233, 251 |
| T05 | Operator bez domeny w `Tytule` (Autopay) | surowy sprzedawca = kontrahent ze zwiniętymi spacjami | 114, 198 |
| T06 | Przelew własny między rachunkami: para ±, to samo `Nr transakcji`, różne `Konto` | obciążenie na głównym importowane, strona VAT pominięta (D1) | 69, 70, 150, 151, 222, 223 |
| T07 | Split payment VAT (`PRZ SP Ref SP: …`), para na głównym i VAT | obciążenie na głównym importowane, strona VAT pominięta (D1) | 63, 64, 128, 129, 178, 179, 236, 237 |
| T08 | Powtarzalny przelew na własne konto w innym banku (D8) | wzorzec, user-exclude | 30, 51, 73, 96, 116, 138, 156, 169, 189, 206, 225, 243 |
| T09 | Opłaty US/ZUS, powtarzalne, zmienna kwota | frequent | 23, 31, 47, 52, 65, 74, 90, 97, 112, 117, 133, 139, 148, 157, 166, 171, 180, 190, 200, 207, 218, 226, 239, 244 |
| T10 | Abonament ze stałą kwotą | fixed | 33, 54, 76, 98, 118, 141, 158, 172, 192, 210, 228, 247 |
| T11 | Abonament z jedną podwyżką ~12% | jeden wzorzec fixed przy D5 | 27, 49, 67, 91, 113, 134, 149, 168, 183, 202, 221, 241 |
| T12 | Sprzedawca z rozrzutem ~45% | frequent | 22, 48, 81, 109, 125, 153, 176, 197, 220, 234 |
| T13 | Zwrot BLIK (kwota dodatnia, `Zwrot transakcji BLIK … Nr zwrotu …`) | pominięty, skipReason credit (D2) | 126, 184 |
| T14 | PayPal jako pośrednik | sprzedawca nieprzezroczysty (FR-014) | 38, 119, 163, 227 |
| T15 | Allegro | sprzedawca nieprzezroczysty (D3) | 42, 95, 147, 184, 193, 201, 245 |
| T16 | Nowy wzorzec stały tylko w ostatnim miesiącu | fixed, firstMonth 2026-08 (D6) | 36 |
| T17 | Uznania (przelew przychodzący, P.BLIK przychodzący) | pominięte, skipReason credit | 37, 57, 79, 85, 100, 121, 143, 159, 175, 194, 208, 211, 231, 250 |
| T18 | Wiersze rachunku VAT poza parami T06/T07 | pominięte, skipReason other-account (D1) | 45, 110, 154, 164, 215 |

Pozostałe wiersze to szum (`TR.BLIK`, `P.BLIK`) z zasianego PRNG — też mają wpisy w `rows[]` i `patterns[]`.

## Polecenia

- `npm run fixture:ing` — regeneruje wszystkie pliki w tym katalogu (deterministycznie, bajt w bajt).
- `npm run fixture:check` — porównuje pliki z wyjściem generatora i sprawdza kontrakt formatu oraz manifestu.
- `npm run fixture:shape` — lokalnie porównuje strukturę z prawdziwym wyciągiem w `data/` (wypisuje tylko statystyki).

## Zasada zmian

Zmiana fixture = zmiana deklaracji w `scripts/fixture-ing.mjs` + `npm run fixture:ing`. Nie edytuj CSV ani
`expected.json` ręcznie — `fixture:check` odrzuci każdą różnicę względem generatora.
