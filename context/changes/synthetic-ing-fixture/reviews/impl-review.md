<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Syntetyczny wyciąg ING (F-02)

- **Plan**: context/changes/synthetic-ing-fixture/plan.md
- **Scope**: Full plan
- **Reviewed phases**: 1, 2
- **Date**: 2026-09-24
- **Verdict**: NEEDS ATTENTION
- **Findings**: 0 critical, 3 warnings, 3 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | WARNING |
| Scope Discipline | PASS |
| Safety & Quality | WARNING |
| Architecture | PASS |
| Pattern Consistency | PASS |
| Success Criteria | PASS |

Kod odpowiada planowi razem z adaptacjami zatwierdzonymi przez użytkownika w trakcie implementacji: struktura z prawdziwego eksportu (LF, mieszane cudzysłowy, zmienna preambuła, spacje, stopka) i pułapka T19. Wszystkie kryteria automatyczne przechodzą, a CI na PR #1 jest zielone. Pułapki T01–T19 zgadzają się z `expected.json`. Zakres „NOT doing” zachowany: bez nowych zależności, bez wierszy w seedzie, bez kodu parsera.

## Findings

### F1 — fixture:shape może wypisać nazwę prawdziwego pliku przy błędzie I/O

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: scripts/fixture-ing-shape.mjs:264
- **Detail**: `readFileSync(path.join(dir, name))` dla prawdziwych plików działa przed blokiem `try` (l.266–272). Wyjątek I/O, np. EACCES, EISDIR albo plik usunięty w trakcie, kończy proces domyślnym komunikatem Node z pełną ścieżką, a nazwa pliku zawiera numer dokumentu i datę. Guard, który wypisuje tylko `e.name`, obejmuje wyłącznie `shape()`.
- **Fix**: Przenieść odczyty do `try` i przy błędzie wypisać tylko `real N` oraz `e.code`, exit 1.
- **Decision**: FIXED

### F2 — katalog data/ nie jest w całości ignorowany przez git

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: .gitignore:14-15
- **Detail**: Ignorowane są tylko `*.csv` i `data/real/`. Nagłówek `fixture-ing-shape.mjs` mówi „default data/, gitignored”, ale eksport w innym formacie (xlsx, pdf, MT940) albo notatka w `data/` trafiłyby do commitu. To łamie NFR prywatności danych źródłowych.
- **Fix**: Dodać `data/` do `.gitignore`.
- **Decision**: FIXED

### F3 — plan i brief nie odnotowują zatwierdzonych adaptacji kontraktu

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: context/changes/synthetic-ing-fixture/plan.md:20,80-81,215,306; plan-brief.md:21
- **Detail**: Plan nadal mówi o CRLF, nagłówku w wierszu 21, każdym polu w `"…"` i `line: 22` w przykładzie. Wiersz Progress 1.3 jest odhaczony z tekstem „każda linia kończy się CRLF”, a zacommitowane pliki mają LF zgodnie z decyzją użytkownika. Kto przeczyta plan bez tej rozmowy, uzna implementację za rozjechaną, a to jest źródło prawdy dla S-01 i przyszłych przeglądów.
- **Fix**: Dopisać do plan.md sekcję „Deviations”: kontrakt z porównania struktury, LF, T19, 1.3 zweryfikowane dla LF, odesłanie do `import-formats.md`. W plan-brief.md poprawić „CRLF” na „LF”.
- **Decision**: FIXED

### F4 — README podaje złą długość preambuły (o jedną linię za dużo)

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: scripts/fixture-ing.mjs:1102 (→ test/fixtures/ing/README.md:11)
- **Detail**: README mówi „18 linii + 1 na rachunek”, co przy 2 rachunkach daje 20. Plik ma 19 linii preambuły, a nagłówek jest w linii 20, co zgadza się z `import-formats.md:56` („17 + n”). Komentarz w check.mjs:162 jest dwuznaczny, ale jego kod jest poprawny.
- **Fix**: W generatorze zmienić tekst na „17 linii + 1 na rachunek; nagłówek w linii 18 + n”, potem regenerować.
- **Decision**: FIXED

### F5 — .gitattributes chroni tylko CSV, a check porównuje bajty także w JSON i MD

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: .gitattributes:2
- **Detail**: Na klonie z `core.autocrlf=true` (Windows) `expected.json` i `README.md` dostaną CRLF i `fixture:check` przestanie przechodzić. Runner Ubuntu w CI tego problemu nie ma.
- **Fix**: Zmienić regułę na `test/fixtures/ing/** -text`.
- **Decision**: FIXED

### F6 — pusty argument fixture:shape rozwiązuje się do bieżącego katalogu

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: scripts/fixture-ing-shape.mjs:13
- **Detail**: `process.argv[2] ?? …`: pusty string (np. `"$DIR"` z nieustawioną zmienną) daje `path.resolve("")` = cwd zamiast wartości domyślnej. Podczas przeglądu subagent przez nieustawioną zmienną uruchomił skrypt bez argumentu i ten przeczytał `data/`. Wyjście było zamaskowane, więc maskowanie zadziałało, ale przypadkowe uruchomienia są realne.
- **Fix**: Użyć `||` zamiast `??`, żeby pusty argument dawał katalog domyślny.
- **Decision**: FIXED
