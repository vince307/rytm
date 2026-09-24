# Syntetyczny wyciąg ING (F-02) — Plan Brief

> Full plan: `context/changes/synthetic-ing-fixture/plan.md`

## What & Why

Do repo trafia syntetyczny wyciąg CSV z ING, który odwzorowuje **kształt** prawdziwego eksportu wraz ze znanymi pułapkami (warianty sprzedawcy, operatorzy płatności, PayPal/Allegro, podwyżka abonamentu, nowy wzorzec, wiele rachunków, uznania i zwroty). Prawdziwego wyciągu nie wolno commitować (NFR prywatność), więc ten plik jest jedynym legalnym materiałem testów parsera (S-01), wykrywania wzorców (S-03, S-05, S-06) i demo publicznego (S-09).

## Starting Point

Nie ma parsera ani runnera testów jednostkowych. `.gitignore` już przepuszcza `test/fixtures/**/*.csv`, a `import-formats.md` opisuje format ING, reguły importu (D1–D9) i listę kształtów do odwzorowania. Prawdziwy wyciąg leży tylko lokalnie w `data/`.

## Desired End State

`test/fixtures/ing/` zawiera wyciąg 12-miesięczny (2 rachunki, ~200 wierszy, pułapki T01–T18), trzy pliki błędów (nachodzący zakres, brak nagłówka, waluta ≠ PLN), `expected.json` z oczekiwanym wynikiem dla każdego wiersza i każdego wzorca oraz README. Deterministyczny generator odtwarza je bajt w bajt, a `npm run fixture:check` w CI pilnuje zgodności z generatorem, z kontraktem formatu i z D1/D2/D5.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) |
| --- | --- | --- |
| Forma fixture | Generator Node bez zależności + commitowane pliki | Pułapka to jedna deklaracja, a regeneracja dowodzi determinizmu; cp1250/LF/apostrofy nie psują się w edytorze. |
| Kodowanie cp1250 | Własna tablica znaków PL, bez `iconv-lite` | Wystarcza ~21 znaków, a znak spoza tablicy przerywa generowanie. |
| Klucz odpowiedzi | `expected.json` per wiersz i per wzorzec (typ, `resolvedBy`) | S-01/S-03 dostają gotowe asercje, a jakość normalizacji staje się liczbą. |
| Zakres plików | Główny 12 mies. + 3 pliki błędów | Wystarcza na trend (S-07), medianę D5 i ścieżki odrzucenia z S-01. |
| Seed bazy | Nie — tylko CSV | Jedna ścieżka zapisu (parser S-01), bez drugiej implementacji parsowania w SQL. |
| Weryfikacja | `fixture:check` w jobie `ci` + lokalny `fixture:shape` | Determinizm i kontrakt pilnowane w CI; realizm sprawdzany na prawdziwym pliku bez wypisywania danych. |

## Scope

**In scope:**

- `scripts/fixture-ing.mjs` (generator), `scripts/fixture-ing-check.mjs`, `scripts/fixture-ing-shape.mjs`
- `test/fixtures/ing/`: główny CSV, 3 pliki błędów, `expected.json`, `README.md`
- Skrypty npm `fixture:ing` / `fixture:check` / `fixture:shape`, `.prettierignore`, krok w CI
- Korekta komentarza w `supabase/seed.sql` i odesłanie w `import-formats.md`

**Out of scope:**

- Parser, UI importu, zapis do bazy (S-01); normalizacja i wykrywanie w kodzie (S-03)
- Dane domeny w `seed.sql` i konto demo (S-09)
- Runner testów jednostkowych, nowe zależności, fixture Santandera
- Jakiekolwiek wartości z prawdziwego wyciągu

## Architecture / Approach

Pułapki są danymi w generatorze: sprzedawca, szablon opisu, rachunek, harmonogram, kwoty, ID pułapki i oczekiwany wynik. `generate()` rozwija je w wiersze, dodaje zasiany szum, składa preambułę i stopkę, koduje do cp1250 i w tym samym przebiegu tworzy `expected.json`. `fixture:check` porównuje wynik `generate()` z bajtami na dysku. Potem niezależnie dekoduje pliki z dysku i sprawdza kontrakt formatu oraz samospójność manifestu.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Generator, główny wyciąg i klucz odpowiedzi | Główny CSV z T01–T18, `expected.json`, README, `fixture:ing` | Oczekiwane grupy i typy przesądzają wynik S-03; korekta przez edycję deklaracji |
| 2. Pliki błędów i bramka CI | 3 pliki `reject`, `fixture:check` w CI, lokalny `fixture:shape`, poprawki dokumentów | Lint-staged/Prettier przepisuje wygenerowane pliki (mitygacja: `.prettierignore`) |

**Prerequisites:** brak (F-02 nie zależy od F-01). Do ręcznego kroku 2.7 potrzebny jest prawdziwy wyciąg w `data/`, tylko lokalnie.
**Estimated effort:** ~1–2 sesje, 2 fazy.

## Open Risks & Assumptions

- Oczekiwany wynik normalizacji w `expected.json` (T01 = scalenie przez użytkownika, T02/T03 = automatyczna normalizacja) to założenie produktowe. S-03 może je skorygować w generatorze.
- Fixture odwzorowuje kształty opisane w `import-formats.md`. Rozjazdy z prawdziwym plikiem wychodzą dopiero w `fixture:shape` (krok ręczny).

## Success Criteria (Summary)

- S-01 może napisać parser i jego testy bez prawdziwego wyciągu, na plikach `ok` i `reject` z `expected.json`.
- Każda pułapka z `import-formats.md` i FR-014 ma w pliku rozpoznawalne wiersze i oczekiwany wynik.
- CI odrzuca ręczną edycję fixture i każde złamanie determinizmu.
