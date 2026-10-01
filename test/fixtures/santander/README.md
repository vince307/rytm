# Syntetyczny wyciąg Santander (fixture F-03)

Plik wygenerowany przez `scripts/fixture-santander.mjs` — nie edytuj ręcznie.

## Pochodzenie

Kształt plików pochodzi z `context/foundation/import-formats.md` (sekcja „Santander Bank Polska”) i z
agregowanego porównania struktury z prawdziwymi eksportami (maski pól, cudzysłowy, liczniki, same
wartości logiczne — bez wartości):

- UTF-8 bez BOM, końce linii LF, separator `,`, 9 pól w każdym wierszu (nagłówek i dane), ostatnie puste;
- nagłówek: data eksportu (`YYYY-MM-DD`), data początku zakresu (`DD-MM-YYYY`), numer rachunku z wiodącym
  `'` w grupach (2 + 6×4 cyfry), właściciel (jedno pole bez przecinka), waluta, saldo początkowe/końcowe
  w cudzysłowie, liczba wierszy danych;
- dane: data księgowania, data operacji (**używana** jako `occurredOn`), opis, kontrahent, nr rachunku
  kontrahenta, kwota w cudzysłowie, saldo po operacji w cudzysłowie, `Lp`, (puste); kol. 2/3 w cudzysłowie
  tylko gdy zawierają przecinek, bez escapowania `"`;
- opis kartowy: `DOP. VISA <maska> PŁATNOŚĆ KARTĄ <kwota.> <WALUTA> <końcówka ASCII>` (też ZWROT i
  WYPŁATA Z BANKOMATU); `Zakup BLIK`/`Wypłata BLIK <tekst>:<11 cyfr>`; przelewy i `Oplata za …`;
- `Lp` 1..N rosnąco w kolejności pliku, wiersze ≈ od najnowszej daty księgowania z nielicznymi inwersjami;
  saldo liczone w prawdziwym porządku chronologicznym (data księgowania, data operacji, `Lp` malejąco),
  nie w kolejności pliku — plik nie ma gładkiego łańcucha sald w swojej własnej kolejności.

Wszystkie nazwy, adresy, numery i kwoty są wymyślone — żadna wartość nie pochodzi z prawdziwego wyciągu.

## Pliki

| Plik | Oczekiwany wynik |
|---|---|
| `historia_2026-08-31_61109012340001111222233334.csv` | ok; 180 wierszy, import 177 obciążeń, suma 11958,68 zł, okres 2026-03-01 – 2026-08-31 |
| `historia_2026-08-31_77109056780009998887776665.csv` | reject (`currency`): waluta rachunku to USD, nie PLN; 3 wiersze |
| `expected.json` | klucz odpowiedzi: `files`, `rows`, `patterns`, `crossBank` |

## Pułapki

Wiersze pułapki: `rows[]` z danym identyfikatorem w `traps`; wzorce: `patterns[]` z tym identyfikatorem.
ST12/ST13 są cechami pliku (przesunięcie dat / nagłówek), nie osobnym sprzedawcą — oznaczone na jednym
reprezentatywnym wierszu każda.

| ID | Pułapka | Oczekiwany wynik | Linie w głównym pliku |
|---|---|---|---|
| ST01 | Ten sam sprzedawca płacony dwiema kartami na jednym koncie | jeden wzorzec; maska karty poza sprzedawcą | 33, 65, 108, 148, 174 |
| ST02 | Ta sama sieć, różne numery placówek w końcówce opisu kartowego | jeden wzorzec, resolvedBy normalization | 36, 114, 145, 179 |
| ST03 | Ten sam sprzedawca zapisany dwojako przez operatora karty (`MARKA *Marka App` vs `MARKA APPS …`), stała kwota | jeden wzorzec stały (fixed), resolvedBy user-merge | 12, 37, 68, 105, 140, 172 |
| ST04 | Wypłaty z bankomatu kartą pod ≥ 2 adresami | rawMerchant = adres (regex); jeden wzorzec częsty `bankomat` dopiero po normalizacji S-11 | 25, 98, 167 |
| ST05 | Zakup BLIK z kontrahentem w kol. 3; jeden wiersz z domenopodobnym tokenem w opisie | rawMerchant = kol. 3 (reguła 5); reguła D3 (domena) nieużywana | 42, 111, 165 |
| ST06 | Wypłata BLIK (wypłata gotówki przez BLIK) | rawMerchant = kol. 3; własny wzorzec, nie scalany z `bankomat` | 62, 137 |
| ST07 | Przelewy: `Przelew środków`, `Przelew na telefon`, dowolny tytuł z przecinkiem w kol. 2 (cudzysłów) | rawMerchant = kol. 3 w każdym wierszu | 26, 101, 158 |
| ST08 | Zwrot płatności kartą (kwota dodatnia) | pominięty, skipReason credit (D2) | 82 |
| ST09 | Uznania niebędące zwrotem (przelewy przychodzące), jedno z przecinkiem w kol. 3 (cudzysłów) | pominięte, skipReason credit | 20, 151 |
| ST10 | Sprzedawca między bankami: końcówka kartowa `PIZZERIA TRZY SERY KRAKOW` (ASCII), ≥ 3 wiersze, obie karty | pattern `pizzeria-trzy-sery` = slug z fixture ING; wpis crossBank | 40, 95, 171 |
| ST11 | Powtarzalne obciążenie `Oplata za …`, ta sama kwota co miesiąc | jeden wzorzec stały (fixed) | 19, 47, 84, 118, 152, 180 |
| ST12 | Data księgowania ≠ data operacji na większości wierszy; porządek pliku z sąsiadującymi inwersjami | `occurredOn` = data operacji (kol. 1) | 3 |
| ST13 | Nagłówek: dwa formaty dat, numer rachunku z wiodącym `'`, kwoty w cudzysłowie, kol. 7 == liczba wierszy | okres = kol. 1 nagłówka → kol. 0 nagłówka (D7) | 2 |
| ST14 | Plik rachunku walutowego USD | plik odrzucony, reason currency | 2, 3, 4 |

Pozostałe wiersze to szum kartowy/przelewowy z zasianego PRNG — też mają wpisy w `rows[]` i `patterns[]`.

## Polecenia

- `npm run fixture:santander` — regeneruje wszystkie pliki w tym katalogu (deterministycznie, bajt w bajt).
- `npm run fixture:check` — porównuje pliki z wyjściem generatora i sprawdza kontrakt formatu (ING i Santander).
- `npm run fixture:shape:santander` — lokalnie porównuje strukturę z prawdziwym wyciągiem w `data/` (tylko statystyki).

## Zasada zmian

Zmiana fixture = zmiana deklaracji w `scripts/fixture-santander.mjs` + `npm run fixture:santander`. Nie
edytuj CSV ani `expected.json` ręcznie.
