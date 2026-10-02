---
project: Rytm
version: 2
status: draft
created: 2026-09-21
updated: 2026-10-02
prd_version: 1
main_goal: quality
top_blocker: none
milestone_id: kit-round-3
milestone_seq: 3
milestone_status: open
---

# Roadmap: Rytm

> Derived from `context/foundation/prd.md` (v1) + `context/foundation/import-formats.md` + auto-researched codebase baseline.
> Edit-in-place; archive when superseded.
> Slices below are listed in dependency order. The "At a glance" table is the index.

## Milestone

**M-3: Runda 3 kitu — aplikacja bez placeholderów** — Status: open

- **Intent:** Każdy ekran aplikacji wygląda i mówi tak, jak zaprojektował to autor kitu „Rytm — Oś” w rundzie 3: teksty pochodzą z `content.json`, stany pochodzą z prototypu, a placeholdery `DESIGN-GAP` zbudowane po stronie kodu znikają tam, gdzie kit dał już odpowiedź.
- **Source materials:** dostawa rundy 3 (lokalnie, poza repozytorium: `context/runs/2026-10-02-kit-round-3/kit-delivery/` — `react-kit/` → `design/rytm-os/react-kit/` i `design/rytm-os/prototype/`, `rytm-os/` → `design/rytm-os/brand-pack/`; pliki w korzeniu dostawy i `rytm-os-views-html/` to duplikaty); brief rundy 3 `design/prompts/2026-10-02-gaps-round-3.md`; rejestr luk `context/foundation/design-kit.md` (pozycje K11–K26, G20, G23–G37). PRD bez zmian — gdy kit koliduje z PRD, wygrywa PRD.
- **Done when:** every F-NN and S-NN below is `done`.
- **Scope anchors:** FR-001, FR-003–FR-005, FR-007–FR-013, FR-018, FR-019 (zmienia się prezentacja, nie reguły); bez migracji.

## Vision recap

Rytm wgrywa CSV z banku, normalizuje opisy do sprzedawców, wykrywa wzorce stałe i częste i pozwala ustawić własny próg na wzorcu; to, co w miesiącu go przekracza, dostaje etykietę „ponad próg” i jest zsumowane. M-1 dowiózł cały przepływ dla ING Bank Śląski. M-2 dodaje drugie źródło danych — Santander Bank Polska — bez zmiany reguły: wzorzec to sprzedawca, niezależnie od banku, z którego przyszła transakcja. M-3 nie zmienia reguły: przenosi aplikację na rundę 3 kitu — ostatnie placeholdery zbudowane po stronie kodu ustępują decyzjom autora identyfikacji.

## North star

**S-13: Import i historia importów według rundy 3 kitu** — import to wejście do produktu i miejsce, gdzie kit jest dziś najbardziej nieaktualny (Santander „wkrótce”, trzy różne odrzucenia pod jednym „nieznany format”, wynik importu bez nagłówka z kitu); jego przejście na rundę 3 dowodzi, że kit i aplikacja znów mówią jednym głosem.

> Gwiazda przewodnia to najmniejszy przepływ od końca do końca, którego dowiezienie udowadnia główną hipotezę kamienia milowego — umieszczona tak wcześnie, jak pozwalają jej wymagania wstępne, bo reszta ma znaczenie tylko wtedy, gdy ten przepływ działa.

## At a glance

| ID   | Change ID                  | Outcome (user can …)                                                                                                                               | Prerequisites | PRD refs                                 | Status  |
| ---- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ---------------------------------------- | ------- |
| F-04 | kit-round-3-intake         | (foundation) runda 3 kitu jest w `design/rytm-os/`, aplikacja na nowym `content.json` i tokenach działa bez regresji                               | —             | — (kit)                                  | done |
| S-12 | kit-round-3-auth-settings  | przejść logowanie, rejestrację, reset hasła i ustawienia konta (zmiana hasła, usunięcie, wylogowanie, konto demo) w wersji rundy 3 kitu            | F-04          | FR-001, FR-019                           | pending |
| S-13 | kit-round-3-imports        | wgrać plik z ING lub Santandera, zobaczyć wynik, odrzucenia i historię importów (z cofnięciem) w wersji rundy 3 kitu                               | F-04          | FR-003, FR-004, FR-005, FR-018           | planning |
| S-14 | kit-round-3-patterns       | przeglądać wzorce, szczegół z progiem i dialog akcji (scal, zmień nazwę, typ, wyklucz) we wszystkich stanach rundy 3 kitu                         | F-04          | FR-007, FR-008, FR-009, FR-010, FR-011   | pending |
| S-15 | kit-round-3-home-fixed     | zobaczyć przegląd, trend „ponad progiem” i koszty stałe ze wszystkimi stanami (puste, brak porównania, błąd odczytu) w wersji rundy 3 kitu          | F-04          | FR-011, FR-012, FR-013                   | pending |

## Baseline

What's already in place in the codebase as of `2026-10-02` (auto-researched). M-1 (F-01, F-02, S-01–S-09) and M-2 (F-03, S-10, S-11) are done.
Foundations below assume these are present and do NOT re-scaffold them.

- **Cały produkt działa** — logowanie, import ING i Santandera, wzorce, progi, „ponad próg”, trend, koszty stałe, ustawienia, konto demo; CI `ci` → `smoke` → `deploy`.
- **Kit w repozytorium: runda 2** — `design/rytm-os/` (read-only), `scripts/sync-kit.sh` kopiuje assety do `public/rytm/` i `brand.css` do `src/styles/brand.css`; `src/content/copy.ts` importuje `content.json` wprost z `design/rytm-os/react-kit/docs/` (`copy`) i trzyma luki w `copyExtra` (216 tekstów, K11).
- **Placeholdery** — `grep -rn "DESIGN-GAP" src/`; każdy ma wiersz w `context/foundation/design-kit.md` (`kit_round: 2`).
- **Dostawa rundy 3 (poza repozytorium)** — `context/runs/2026-10-02-kit-round-3/kit-delivery/`; `content.json` 146 → 345 kluczy, `brand.css` + 8 tokenów semantycznych (bez nowych kolorów), prototyp 28 → 60 widoków, `copy-map.md`, CHANGELOG „Runda 3” z odpowiedziami C1–C6. Assety bez zmian. Znane pułapki przyjęcia: usunięte 4 klucze używane przez aplikację (`authStates.loginError`, `resetTitle`, `resetBody`, `checkInbox` — jak K12 w rundzie 2); `dashboard.stats` ma 2 karty (aplikacja czyta `stats[2]`); `patterns.columns` ma 7 kolumn (tabela renderuje 6); szablony `{month}`/`{n}` w kluczach dziś renderowanych dosłownie (`fixedCosts.new`, `trend.tooShort`, `authStates.passwordTooShort`, `resetNew.lead`); autor nie widział `copy.ts`, więc 55 tekstów `copyExtra` zmieniło nazwę klucza, a 90 brzmienie albo zniknęło.

## Foundations

### F-04: Przyjęcie rundy 3 kitu

- **Outcome:** (foundation) dostawa rundy 3 jest przeniesiona do `design/rytm-os/` w strukturze kitu (react-kit, prototype, brand-pack, CHANGELOG), z łatką przyjęcia przywracającą klucze używane przez aplikację; `scripts/sync-kit.sh` zsynchronizował `brand.css` (nowe tokeny dostępne jako nazwy Tailwind, jeśli są potrzebne); aplikacja na nowym `content.json` działa bez regresji (żadnego `undefined`, surowego `{n}`/`{month}` ani rozjechanej tabeli); `design-kit.md` mówi `kit_round: 3`, każda pozycja K/G rundy 3 ma status (dostarczona / częściowo / pominięta) i slice M-3, który ją wdraża.
- **Change ID:** kit-round-3-intake
- **PRD refs:** — (kit; FR bez zmian)
- **Unlocks:** S-12, S-13, S-14, S-15 (każdy wiąże swoje ekrany z prototypem i kluczami rundy 3)
- **Prerequisites:** dostawa w `context/runs/2026-10-02-kit-round-3/kit-delivery/` (lokalnie u orkiestratora)
- **Parallel with:** —
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Najpierw, bo `copy.ts` importuje `content.json` wprost z kitu — podmiana plików i utrzymanie aplikacji na zielono muszą wejść jednym merge'em; ryzyko — cicha regresja copy na ekranach (klucz istnieje, ale zmienił znaczenie), łagodzone smoke + przeglądem ekranów, których dotykają zmienione klucze.
- **Status:** done

## Slices

### S-12: Auth i ustawienia według rundy 3 kitu

- **Outcome:** Użytkownik przechodzi logowanie, rejestrację, potwierdzenie e-maila, reset i ustawienie nowego hasła z panelami wizualnymi rundy 3, a w ustawieniach zmienia hasło (obecne + nowe + powtórz) ze stanami sukcesu i błędu, wylogowuje się z ekranu ustawień, usuwa konto przez dialog z obecnym hasłem i wpisaniem `USUŃ`, po czym widzi notę na `/login`; na koncie demo widzi stałą notę o zablokowanych akcjach. Strony publiczne (landing, jak działa, dla kogo — także ze stopki na telefonie) używają copy z `content.json`.
- **Change ID:** kit-round-3-auth-settings
- **PRD refs:** FR-001, FR-019
- **Prerequisites:** F-04
- **Parallel with:** S-13, S-14, S-15 (różne ekrany; run i tak serializuje)
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Rusza formularze uwierzytelniania i destrukcyjny dialog — smoke auth musi zostać zielony, a blokada przycisku usunięcia nie może osłabić potwierdzenia po stronie serwera. Pozycje: K11 (auth, landing, howItWorks, forWho), K13, K14, K15, G20, G23, G24, G32, G37 (część ustawień).
- **Status:** pending

### S-13: Import i historia importów według rundy 3 kitu

- **Outcome:** Użytkownik wgrywa plik z ING albo Santandera i widzi copy dla obu banków, krok podsumowania z bankiem, rachunkiem bez nazwiska („Rachunek · •• końcówka” dla Santandera), zakresem i przyciskiem „Importuj N obciążeń” ze stanem oczekiwania, wynik importu w układzie rundy 3, osobne odrzucenia (plik za duży, za dużo obciążeń, plik niespójny, waluta, pusty, nakładający się zakres z `{range}`), a w historii importów — bank, dialog usunięcia z `{range}` i komunikaty inline po usunięciu (sukces, błąd, nie znaleziono); na koncie demo widzi notę zamiast akcji.
- **Change ID:** kit-round-3-imports
- **PRD refs:** FR-003, FR-004, FR-005, FR-018
- **Prerequisites:** F-04
- **Parallel with:** S-12, S-14, S-15
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Gwiazda przewodnia M-3; kreator importu jest największą wyspą React — rozdzielenie trzech odrzuceń dziś zlanych w „nieznany format” wymaga, by serwer i klient zwracały rozróżnialne kody bez zmiany reguł walidacji. Pozycje: K11 (imports), K16, K18 (importy), K19, K20, K26, G25, G26, G27, G30, G37 (część importów).
- **Status:** planning

### S-14: Wzorce, szczegół i akcje według rundy 3 kitu

- **Outcome:** Użytkownik przegląda listę wzorców z kolumną „Kwota” dla stałych, „Pokaż więcej” i widocznym fokusem wyszukiwania i sortowania; w szczególe widzi stany „nie znaleziono” i „miesiąc bez wystąpień”, sumę z odmianą miesiąca, opis sekwencji dla czytników ekranu, walidację i błąd zapisu progu; w dialogu akcji scala (z wyborem wzorca i stanem „brak wzorców”), zmienia nazwę (z walidacją), typ i wyklucza, widzi scalone warianty z cofnięciem.
- **Change ID:** kit-round-3-patterns
- **PRD refs:** FR-007, FR-008, FR-009, FR-010, FR-011
- **Prerequisites:** F-04
- **Parallel with:** S-12, S-13, S-15
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Paginacja „Pokaż więcej” to nowe zachowanie listy — nie może zmienić sortowania ani sum. Pozycje: K11 (patterns), K17, K21, K22, G28, G29, G31, G33.
- **Status:** pending

### S-15: Przegląd, trend i koszty stałe według rundy 3 kitu

- **Outcome:** Użytkownik widzi przegląd w układzie rundy 3 (karta „Ponad progiem”, trend na pełną szerokość, zestawienie kosztów stałych; bez „Rozpoznanych wydatków” i „Co wraca najczęściej” — decyzja C5), leady i stopki kart z `{month}`/`{delta}`/`{n}` i odmianą, trend z sumami nad słupkami, znacznikiem zera i opisem „brak progu”, a w „Kosztach stałych” — licznik z prawdziwą formą mnogą, spokojny kolor obniżki, osobne komunikaty pustych sekcji, braku miesiąca porównawczego i błędu odczytu (inny niż pusty stan).
- **Change ID:** kit-round-3-home-fixed
- **PRD refs:** FR-011, FR-012, FR-013
- **Prerequisites:** F-04
- **Parallel with:** S-12, S-13, S-14
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Ostatni, bo zbiera resztki `copyExtra` (`home`, `fixed`, `app`) — jego ostatnia faza sprawdza, czy `copyExtra` zawiera już tylko to, czego kit naprawdę nie dał. Pozycje: K11 (home, fixed, app), K18 (przegląd, koszty stałe), K23, K24, K25, G34, G35, G36.
- **Status:** pending

## Backlog Handoff

| Roadmap ID | Change ID                 | Suggested issue title                                   | Ready for `/10x-plan` | Notes |
| ---------- | ------------------------- | ------------------------------------------------------- | --------------------- | ----- |
| F-04       | kit-round-3-intake        | Przyjęcie rundy 3 kitu bez regresji aplikacji           | done                  | Zarchiwizowane 2026-10-02 → `context/archive/2026-10-02-kit-round-3-intake/`; follow-upy z `Trigger:` w `follow-ups/review-fixes.md` |
| S-12       | kit-round-3-auth-settings | Auth i ustawienia według rundy 3 kitu                   | yes                   | F-04 zarchiwizowane; `grep -n 'Trigger: S-12' context/archive/2026-10-02-kit-round-3-intake/follow-ups/review-fixes.md` |
| S-13       | kit-round-3-imports       | Import i historia importów według rundy 3 kitu          | yes                   | F-04 zarchiwizowane; `grep -n 'Trigger: S-13' context/archive/2026-10-02-kit-round-3-intake/follow-ups/review-fixes.md` |
| S-14       | kit-round-3-patterns      | Wzorce, szczegół i akcje według rundy 3 kitu            | yes                   | F-04 zarchiwizowane; `grep -n 'Trigger: S-14' context/archive/2026-10-02-kit-round-3-intake/follow-ups/review-fixes.md` |
| S-15       | kit-round-3-home-fixed    | Przegląd, trend i koszty stałe według rundy 3 kitu      | yes                   | F-04 zarchiwizowane; `grep -n 'Trigger: S-15' context/archive/2026-10-02-kit-round-3-intake/follow-ups/review-fixes.md` |

## Open Roadmap Questions

1. **Wybór mechanizmu logowania** (email+hasło / OAuth / passwordless) — decyzja po wyborze stacku. Owner: user. Block: none — w kodzie działa e-mail + hasło (Supabase); PRD wymaga aktualizacji, nie decyzji.
2. **Lista operatorów płatności** dla ekstrakcji sprzedawcy z `Tytuł` (D3 w `import-formats.md`) — start: PayPro, PayU, Cashbill, Autopay, ING Pay; rozszerzana w miarę importów. Owner: user. Block: none (dla Santandera patrz Unknown w F-03).

## Parked

- **Integracja z API banków / otwarta bankowość** — Why parked: PRD §Non-Goals; jedyne wejście to plik CSV.
- **Kategoryzacja wydatków i limity na kategorię** — Why parked: PRD §Non-Goals; reguła działa na wzorcach sprzedawcy.
- **Wiele walut i przeliczanie kursów** — Why parked: PRD §Non-Goals; tylko PLN (plik Santander w USD jest odrzucany, nie przeliczany).
- **Rozbijanie transakcji z pośredników na składowe** — Why parked: PRD §Non-Goals; pośrednicy liczą się jak sprzedawcy, wykluczenie przez FR-009.
- **OCR paragonów** — Why parked: PRD §Non-Goals.
- **Wykresy inne niż lista i suma per miesiąc** — Why parked: PRD §Non-Goals.
- **Alerty i coach AI** — Why parked: PRD §Non-Goals; reguła jest deterministyczna.
- **Wielu użytkowników w jednym gospodarstwie domowym** — Why parked: PRD §Non-Goals.
- **Wersjonowanie progów w czasie** — Why parked: PRD §Non-Goals (rozstrzygnięcie FR-013: próg znaczy „jak oceniam dziś”).
- **Santander na publicznym koncie demo** — Why parked: strażnik S-09 pozwala kontu demo na jeden import (syntetyczny wyciąg ING); demo dowodzi przepływu, drugi bank nie zmienia reguły (wywiad M-2).
- **Banki inne niż ING i Santander** — Why parked: PRD zna tylko te dwa formaty; inny bank wraca jako nowe FR.
- **Zmiana adresu e-mail w ustawieniach** — Why parked: kit ma przycisk bez zdefiniowanego przepływu, PRD tego nie wymaga; wraca jako luka kitu, nie wycinek.
- **Utrwalanie błędów importu w bazie i biblioteka logowania** — Why parked: NFR „best-effort, bez SLA”; inwestycja w observability lekka; pozycja z rejestru ryzyk `infrastructure.md`.
- **Pełna użyteczność mobilna, tryb offline, wiele regionów, budowanie pod skalę** — Why parked: PRD §Non-Goals (niefunkcjonalne).

## Milestone History

(Append-only. Empty on the very first milestone.)

- **M-1: Pierwszy miesiąc ponad progiem** (`first-over-limit-month`) — closed 2026-10-01. Cały przepływ MVP działa od końca do końca (logowanie → import CSV z ING → wzorce → progi → „ponad próg” i trend miesięcy → zmiany kosztów stałych, konto i usunięcie), lokalnie na prawdziwym wyciągu i publicznie na koncie demo z syntetycznym wyciągiem; 2 fundamenty + 9 wycinków.
- **M-2: Drugi bank — Santander** (`second-bank-santander`) — closed 2026-10-02. Eksport CSV z Santander Bank Polska (PLN) importuje się na zasadach ING, a transakcje kartowe, wypłaty z bankomatu i ten sam sprzedawca z obu banków trafiają do wspólnych wzorców; 1 fundament + 2 wycinki.

## Done

(Empty on first generation. `/10x-archive` appends an entry here — and flips that item's `Status` to `done` — when a change whose `Change ID` matches the item is archived. Do NOT pre-populate.)

- **S-08: Użytkownik może zobaczyć swoje konto (e-mail, zmiana hasła, nota o przetwarzaniu danych) i samodzielnie usunąć konto po potwierdzeniu; usunięcie kasuje wszystkie jego dane bez śladu, a ponowne logowanie tym hasłem jest niemożliwe.** — Archived 2026-09-23 → `context/archive/2026-09-21-settings-account/`. Lesson: —.
- **F-01: (foundation) pierwsza migracja istnieje i jest zastosowana lokalnie i na hostowanej bazie: tabele importów i transakcji należą do konta (RLS per operację, per rolę) i kasują się kaskadowo z kontem; ustalona jest ścieżka „migracja lokalnie → `db push` na produkcję”.** — Archived 2026-09-24 → `context/archive/2026-09-23-domain-schema-rls/`. Lesson: —.
- **F-02: (foundation) w repozytorium istnieje syntetyczny plik CSV w formacie ING (zgodny z `import-formats.md`) z realistycznymi pułapkami: warianty opisów tego samego sprzedawcy, pośrednicy (PayPal/Allegro/BLIK przez operatorów), subskrypcja z podwyżką, nowy wzorzec, wiele rachunków, uznania i zwroty do pominięcia; służy jako fixture testów parsera i wykrywania oraz jako materiał seedu demo.** — Archived 2026-09-24 → `context/archive/2026-09-24-synthetic-ing-fixture/`. Lesson: —.
- **S-01: Użytkownik może wgrać plik CSV z ING (wybierając jeden rachunek, tylko obciążenia), zobaczyć wynik importu (liczba transakcji, zakres dat) i wejść na listę wzorców; plik, którego zakres dat zachodzi na istniejący import, jest odrzucony z komunikatem; użytkownik widzi wyłącznie własne importy.** — Archived 2026-09-25 → `context/archive/2026-09-24-ing-csv-import/`. Lesson: —.
- **S-03: Użytkownik może zobaczyć listę wykrytych wzorców: sprzedawca (znormalizowany z opisu, z domeną sprzedawcy dla płatności przez operatorów), typ stały/częsty zaproponowany przez aplikację, liczba wystąpień, suma, kwota dla stałych; każda transakcja liczy się w dokładnie jednym wzorcu.** — Archived 2026-09-27 → `context/archive/2026-09-25-merchant-patterns/`. Lesson: —.
- **S-02: Użytkownik może zobaczyć listę importów (data, rachunek, zakres, liczba obciążeń) i usunąć błędny import wraz z jego transakcjami; po usunięciu wzorce i sumy nie zawierają jego transakcji, a ponowne wgranie tego zakresu jest przyjęte.** — Archived 2026-09-27 → `context/archive/2026-09-25-undo-import/`. Lesson: —.
- **S-04: Użytkownik może otworzyć wzorzec, zobaczyć składające się na niego transakcje, ustawić, zmienić i usunąć próg (częsty: liczba wystąpień lub suma na miesiąc; stały: akceptowana kwota) i natychmiast zobaczyć transakcje oznaczone „ponad próg” oraz sumę „ponad progiem w tym miesiącu”.** — Archived 2026-09-27 → `context/archive/2026-09-27-pattern-threshold-over-limit/`. Lesson: —.
- **S-05: Użytkownik może scalić dwa wzorce w jeden, wykluczyć wzorzec z analizy, zmienić jego typ i nazwę sprzedawcy; decyzje są stosowane automatycznie do kolejnych importów, a wykluczony wzorzec nie generuje „ponad próg”.** — Archived 2026-09-28 → `context/archive/2026-09-28-durable-pattern-decisions/`. Lesson: —.
- **S-06: Użytkownik może zobaczyć, które wzorce stałe zmieniły kwotę względem ostatniego wystąpienia (każda zmiana, także w tolerancji) i które są nowe względem poprzedniego miesiąca kalendarzowego; przy danych z jednego miesiąca widzi komunikat o braku miesiąca do porównania.** — Archived 2026-09-28 → `context/archive/2026-09-28-fixed-cost-changes/`. Lesson: —.
- **S-07: Użytkownik może zobaczyć sumę „ponad progiem” dla każdego miesiąca obecnego w danych, liczoną według dzisiejszych progów; zmiana lub usunięcie progu przelicza wszystkie miesiące, miesiąc bez nadwyżki pokazuje 0.** — Archived 2026-09-28 → `context/archive/2026-09-28-over-limit-trend/`. Lesson: —.
- **S-09: Użytkownik (recenzent) może wejść na publiczną instancję, zalogować się na konto demo i zobaczyć zaimportowany syntetyczny wyciąg z wzorcami; żaden prawdziwy wyciąg nie trafia do repozytorium ani na publiczny URL.** — Archived 2026-10-01 → `context/archive/2026-09-30-public-demo-seed/`. Lesson: —.
- **F-03: (foundation) w repozytorium jest syntetyczny eksport Santander PLN z pułapkami formatu i opisów oraz plik USD do odrzucenia** — Archived 2026-10-02 → `context/archive/2026-10-01-synthetic-santander-fixture/`. Lesson: —.
- **S-10: Użytkownik może wgrać plik CSV z Santander Bank Polska (PLN): aplikacja sama rozpoznaje format, pokazuje wynik importu (liczba obciążeń, zakres od daty z nagłówka do daty eksportu) i dodaje import do listy importów z nazwą banku; plik w innej walucie i zakres nakładający się na istniejący import tego rachunku są odrzucane z komunikatem, uznania i zwroty są pomijane, a transakcje trafiają do wzorców.** — Archived 2026-10-02 → `context/archive/2026-10-02-santander-csv-import/`. Lesson: —.
- **S-11: Użytkownik może zobaczyć transakcje kartowe z Santandera we właściwych wzorcach: opis płatności kartą daje sprzedawcę bez numeru karty i numeru placówki, płatności obiema kartami jednego rachunku trafiają do tego samego wzorca, wypłaty z bankomatu tworzą jeden wzorzec, a ten sam sprzedawca z ING i z Santandera jest jednym wzorcem.** — Archived 2026-10-02 → `context/archive/2026-10-02-santander-card-merchants/`. Lesson: —.
- **F-04: (foundation) dostawa rundy 3 jest przeniesiona do `design/rytm-os/` w strukturze kitu (react-kit, prototype, brand-pack, CHANGELOG), z łatką przyjęcia przywracającą klucze używane przez aplikację; `scripts/sync-kit.sh` zsynchronizował `brand.css` (nowe tokeny dostępne jako nazwy Tailwind, jeśli są potrzebne); aplikacja na nowym `content.json` działa bez regresji (żadnego `undefined`, surowego `{n}`/`{month}` ani rozjechanej tabeli); `design-kit.md` mówi `kit_round: 3`, każda pozycja K/G rundy 3 ma status (dostarczona / częściowo / pominięta) i slice M-3, który ją wdraża.** — Archived 2026-10-02 → `context/archive/2026-10-02-kit-round-3-intake/`. Lesson: —.
