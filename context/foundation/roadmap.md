---
project: Rytm
version: 1
status: draft
created: 2026-09-21
updated: 2026-09-23
prd_version: 1
main_goal: quality
top_blocker: none
milestone_id: first-over-limit-month
milestone_seq: 1
milestone_status: open
---

# Roadmap: Rytm

> Derived from `context/foundation/prd.md` (v1) + auto-researched codebase baseline.
> Edit-in-place; archive when superseded.
> Slices below are listed in dependency order. The "At a glance" table is the index.

## Milestone

**M-1: Pierwszy miesiąc ponad progiem** — Status: open

- **Intent:** Cały 6-krokowy przepływ MVP działa od końca do końca: logowanie → import CSV z ING → lista wzorców → próg na wzorcu → „ponad próg” z sumą miesiąca → zmiany kwot i nowe wzorce stałe; na prawdziwym wyciągu lokalnie i na syntetycznym zestawie publicznie.
- **Source materials:** `context/foundation/prd.md` (v1); pomocniczo `context/foundation/import-formats.md` (D1–D9), blok `## Forward: technical-roadmap` w `shape-notes.md`.
- **Done when:** every F-NN and S-NN below is `done`.
- **Scope anchors:** FR-001–FR-014, FR-019 (wszystkie konieczne); US-01–US-05. FR-018 (Santander) poza kamieniem milowym — patrz `## Parked`.

## Vision recap

Pieniądze cicho uciekają z konta, a kategoryzacja banku nie odpowiada na pytania „co było zbędne?” i „co się powtarza i rośnie?”. Rytm wgrywa CSV z ING, normalizuje opisy do sprzedawców, wykrywa wzorce stałe (sprzedawca + podobna kwota) i częste (sam sprzedawca) i pozwala ustawić własny próg na wzorcu. To, co w miesiącu przekracza próg, dostaje etykietę „ponad próg” i jest zsumowane. Kluczowe założenie produktu, bez którego Rytm nie różniłby się od budżetu per kategoria: „zbędne” to nadwyżka powtórzeń ponad próg ustawiony przez użytkownika na konkretnym sprzedawcy, nie kategoria.

## North star

**S-04: Użytkownik ustawia próg na wzorcu i widzi transakcje „ponad próg” oraz sumę „ponad progiem w tym miesiącu”** — to pierwsze kryterium sukcesu PRD; dopiero tutaj reguła spotyka prawdziwe transakcje, więc dopiero tutaj widać, czy jakość wykrywania i progów (cel `quality`) daje odpowiedź, której użytkownik zaufa.

> Gwiazda przewodnia to najmniejszy przepływ od końca do końca, którego dowiezienie udowadnia główną hipotezę produktu — umieszczona tak wcześnie, jak pozwalają jej wymagania wstępne, bo reszta ma znaczenie tylko wtedy, gdy ten przepływ działa.

## At a glance

| ID   | Change ID                    | Outcome (user can …)                                                                                        | Prerequisites | PRD refs                               | Status   |
| ---- | ---------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------- | -------------------------------------- | -------- |
| F-01 | domain-schema-rls            | (foundation) pierwsza migracja: importy, transakcje, wzorce z RLS per konto i kaskadą                       | —             | FR-002, FR-019, NFR izolacja           | ready    |
| F-02 | synthetic-ing-fixture        | (foundation) syntetyczny wyciąg ING z pułapkami jako fixture testów i seed demo                             | —             | FR-014, NFR prywatność                 | ready    |
| S-01 | ing-csv-import               | wgrać CSV z ING (jeden rachunek, obciążenia), zobaczyć wynik importu; nakładający się zakres jest odrzucony | F-01, F-02    | US-01, FR-003, FR-005, FR-002          | proposed |
| S-02 | undo-import                  | zobaczyć listę importów i cofnąć błędny import wraz z jego transakcjami                                     | S-01          | US-02, FR-004                          | proposed |
| S-03 | merchant-patterns            | zobaczyć listę wzorców: sprzedawca, typ, liczba wystąpień, suma, kwota dla stałych                          | S-01, F-02    | US-01, FR-006, FR-007                  | proposed |
| S-04 | pattern-threshold-over-limit | otworzyć wzorzec, zobaczyć jego transakcje, ustawić próg i zobaczyć „ponad próg” z sumą miesiąca            | S-03          | US-01, FR-008, FR-010, FR-011          | proposed |
| S-05 | durable-pattern-decisions    | scalić, wykluczyć, zmienić typ i nazwę wzorca, a decyzje przetrwają kolejny import                          | S-03          | US-03, FR-009                          | proposed |
| S-06 | fixed-cost-changes           | zobaczyć, które wzorce stałe zmieniły kwotę i które są nowe względem poprzedniego miesiąca                  | S-03          | US-04, FR-012                          | proposed |
| S-07 | over-limit-trend             | zobaczyć sumę „ponad progiem” per miesiąc według dzisiejszych progów                                        | S-04          | US-05, FR-013                          | proposed |
| S-08 | settings-account             | zobaczyć swoje konto, zmienić hasło i samodzielnie usunąć konto wraz z danymi                               | —             | FR-001, FR-019, NFR prawo do usunięcia | done     |
| S-09 | public-demo-seed             | wejść na publiczną instancję i zobaczyć zaimportowany syntetyczny wyciąg bez prawdziwych danych             | F-02, S-03    | FR-014, NFR prywatność                 | proposed |

## Streams

Navigation aid — groups items that share a Prerequisites chain. Canonical ordering still lives in the dependency graph below; this table is the proposed reading order across parallel tracks.

| Stream | Theme                  | Chain                             | Note                                                                                                                     |
| ------ | ---------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| A      | Import                 | `F-01` → `S-01` → `S-02`          | Otwiera warstwę danych (inwestycja `data`) i dostarcza wejście dla wszystkich pozostałych wycinków.                      |
| B      | Reguła progu           | `F-02` → `S-03` → `S-04` → `S-07` | Prowadzi do gwiazdy przewodniej S-04; dołącza do strumienia A w S-01. Fixture F-02 jest bramką jakości normalizacji.     |
| C      | Decyzje i koszty stałe | `S-05` → `S-06`                   | Dwa niezależne wycinki nad listą wzorców; dołącza do strumienia B w S-03.                                                |
| D      | Konto i demo           | `S-08` → `S-09`                   | Prywatność i prawo do usunięcia; S-08 nie ma wymagań wstępnych i może iść równolegle od zaraz; S-09 dołącza do B w S-03. |

## Baseline

What's already in place in the codebase as of `2026-09-21` (auto-researched + user-confirmed).
Foundations below assume these are present and do NOT re-scaffold them.

- **Frontend:** present — Astro 7 SSR + React 19 + Tailwind 4 (`package.json`), 13 stron w `src/pages`, layouty aplikacji i auth, kit UI podpięty (`public/rytm`, `src/styles/brand.css`), puste widoki `/patterns`, `/fixed`, `/imports` z rundy 2 kitu.
- **Backend / API:** partial — wyłącznie endpointy auth (`src/pages/api/auth/*.ts`); brak endpointów domenowych (import, wzorce, progi).
- **Data:** absent — brak `supabase/migrations/`, seed tylko `auth.users`; brak `src/types.ts` i `src/lib/services/`; zero kodu CSV.
- **Auth:** present — Supabase SSR (`src/lib/supabase.ts`), middleware z `PROTECTED_ROUTES` (`src/middleware.ts`), pełny przepływ rejestracji, potwierdzenia e-mail, resetu hasła zweryfikowany na produkcji (FR-001 dostarczone).
- **Deploy / infra:** present — Vercel `fra1` (`vercel.json`), GitHub Actions `ci` → `smoke` → `deploy` (`.github/workflows/ci.yml`), produkcja od 2026-09-18, hostowany projekt Supabase zlinkowany.
- **Observability:** absent — brak biblioteki logowania ani śledzenia błędów; `console.error` w endpointach auth i logi runtime Vercela (retencja 1 h).

## Foundations

### F-01: Schemat domeny z izolacją per konto

- **Outcome:** (foundation) pierwsza migracja istnieje i jest zastosowana lokalnie i na hostowanej bazie: tabele importów, transakcji i wzorców sprzedawców należą do konta (RLS per operację, per rolę) i kasują się kaskadowo z kontem; ustalona jest ścieżka „migracja lokalnie → `db push` na produkcję”.
- **Change ID:** domain-schema-rls
- **PRD refs:** FR-002, FR-019, NFR „prawo do usunięcia”, Access Control (model płaski, wielokontowy)
- **Unlocks:** S-01 (bez tabel nie ma importu), S-08 (kaskada czyni „usunięcie usuwa wszystkie dane” prawdą bez kodu aplikacyjnego), ścieżka weryfikacji izolacji FR-002 (test: drugie konto nie widzi cudzych importów)
- **Prerequisites:** —
- **Parallel with:** F-02, S-08
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Sekwencjonowane pierwsze, bo warstwa danych jest `absent`, a niesie 12 z 15 koniecznych FR; zakres ograniczony do encji potrzebnych przez S-01 i S-03 (progi i decyzje użytkownika dochodzą w S-04 i S-05), żeby nie budować całej warstwy przed pierwszym widocznym przepływem.
- **Status:** ready

### F-02: Syntetyczny wyciąg ING z pułapkami

- **Outcome:** (foundation) w repozytorium istnieje syntetyczny plik CSV w formacie ING (zgodny z `import-formats.md`) z realistycznymi pułapkami: warianty opisów tego samego sprzedawcy, pośrednicy (PayPal/Allegro/BLIK przez operatorów), subskrypcja z podwyżką, nowy wzorzec, wiele rachunków, uznania i zwroty do pominięcia; służy jako fixture testów parsera i wykrywania oraz jako materiał seedu demo.
- **Change ID:** synthetic-ing-fixture
- **PRD refs:** FR-014, NFR „prywatność danych źródłowych”, guardrail „determinizm”
- **Unlocks:** S-01 (parser weryfikowany bez prawdziwego wyciągu w repo), S-03 (jakość normalizacji mierzona na znanych pułapkach), S-05, S-06 (scalanie wariantów, podwyżka subskrypcji, nowy wzorzec), S-09 (seed publicznej instancji)
- **Prerequisites:** —
- **Parallel with:** F-01, S-08
- **Blockers:** —
- **Unknowns:**
  - Które kształty opisów z prawdziwego wyciągu (lokalnie) trzeba odwzorować, żeby fixture nie był „ładnym demo, zepsutym produktem”? — Owner: user. Block: no.
- **Risk:** Cel `quality` i guardrail prywatności: bez fixture każdy test importu musiałby biec na prawdziwym pliku, którego nie wolno commitować; fixture zbudowany z kształtów (nie danych) prawdziwego wyciągu jest jedynym legalnym materiałem CI.
- **Status:** ready

## Slices

### S-01: Import wyciągu ING

- **Outcome:** Użytkownik może wgrać plik CSV z ING (wybierając jeden rachunek, tylko obciążenia), zobaczyć wynik importu (liczba transakcji, zakres dat) i wejść na listę wzorców; plik, którego zakres dat zachodzi na istniejący import, jest odrzucony z komunikatem; użytkownik widzi wyłącznie własne importy.
- **Change ID:** ing-csv-import
- **PRD refs:** US-01, FR-003, FR-005, FR-002, NFR retencja („plik CSV nie jest przechowywany po imporcie”), NFR czas („sekundy, nie minuty”)
- **Prerequisites:** F-01, F-02
- **Parallel with:** S-08
- **Blockers:** —
- **Unknowns:**
  - Czy parsowanie kilkunastu miesięcy mieści się w budżecie czasu żądania na Vercelu bez pracy w tle (ryzyko z `infrastructure.md`)? — Owner: user. Block: no (mierzone na fixture w trakcie planowania).
- **Risk:** Pierwszy wycinek pionowy: integruje upload, parser, tabele i kit importu (`/imports/new`, kroki 1–3, błędy formatu) od razu; odrzucanie zakresów zamiast deduplikacji spełnia guardrail „import nie dubluje” przez konstrukcję.
- **Status:** proposed

### S-02: Cofnięcie błędnego importu

- **Outcome:** Użytkownik może zobaczyć listę importów (data, rachunek, zakres, liczba obciążeń) i usunąć błędny import wraz z jego transakcjami; po usunięciu wzorce i sumy nie zawierają jego transakcji, a ponowne wgranie tego zakresu jest przyjęte.
- **Change ID:** undo-import
- **PRD refs:** US-02, FR-004
- **Prerequisites:** S-01
- **Parallel with:** S-03, S-08
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Zamyka US-02 zaraz po imporcie, zanim powstaną progi i decyzje; założenie PRD (decyzje i progi przypisane do sprzedawcy, nie do importu) zostaje sprawdzone dopiero w S-05.
- **Status:** proposed

### S-03: Lista wzorców sprzedawców

- **Outcome:** Użytkownik może zobaczyć listę wykrytych wzorców: sprzedawca (znormalizowany z opisu, z domeną sprzedawcy dla płatności przez operatorów), typ stały/częsty zaproponowany przez aplikację, liczba wystąpień, suma, kwota dla stałych; każda transakcja liczy się w dokładnie jednym wzorcu.
- **Change ID:** merchant-patterns
- **PRD refs:** US-01, FR-006, FR-007, guardrail „determinizm”, Open Question 2 (lista operatorów)
- **Prerequisites:** S-01, F-02
- **Parallel with:** S-02, S-08
- **Blockers:** —
- **Unknowns:**
  - Jaka jakość grupowania wychodzi na prawdziwym wyciągu (nie na fixture)? — Owner: user. Block: no (sprawdzane lokalnie po implementacji; błędy naprawia S-05).
- **Risk:** Rdzeń produktu („cały projekt ukryty w jednej linii” FR-006); sekwencjonowane zaraz po imporcie, żeby największa niewiadoma wyszła przed budową progów, a F-02 daje mierzalny wynik zamiast wrażenia.
- **Status:** proposed

### S-04: Próg na wzorcu i „ponad próg”

- **Outcome:** Użytkownik może otworzyć wzorzec, zobaczyć składające się na niego transakcje, ustawić, zmienić i usunąć próg (częsty: liczba wystąpień lub suma na miesiąc; stały: akceptowana kwota) i natychmiast zobaczyć transakcje oznaczone „ponad próg” oraz sumę „ponad progiem w tym miesiącu”.
- **Change ID:** pattern-threshold-over-limit
- **PRD refs:** US-01, FR-008, FR-010, FR-011, Business Logic (definicja nadwyżki dla trzech rodzajów progu)
- **Prerequisites:** S-03
- **Parallel with:** S-02, S-05, S-06, S-08
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Gwiazda przewodnia: domyka pierwsze kryterium sukcesu PRD; sekwencjonowana zaraz po S-03, bo wszystko dalej (trend, decyzje) tylko rozszerza tę regułę.
- **Status:** proposed

### S-05: Trwałe decyzje o wzorcach

- **Outcome:** Użytkownik może scalić dwa wzorce w jeden, wykluczyć wzorzec z analizy, zmienić jego typ i nazwę sprzedawcy; decyzje są stosowane automatycznie do kolejnych importów, a wykluczony wzorzec nie generuje „ponad próg”.
- **Change ID:** durable-pattern-decisions
- **PRD refs:** US-03, FR-009
- **Prerequisites:** S-03
- **Parallel with:** S-04, S-06, S-07, S-09
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Naprawia błędy normalizacji z S-03 rękami użytkownika; decyzje jako trwałe reguły mapowania (nie jednorazowe edycje) to jedyny sposób, by nie scalać co miesiąc od nowa.
- **Status:** proposed

### S-06: Zmiany kwot i nowe wzorce stałe

- **Outcome:** Użytkownik może zobaczyć, które wzorce stałe zmieniły kwotę względem ostatniego wystąpienia (każda zmiana, także w tolerancji) i które są nowe względem poprzedniego miesiąca kalendarzowego; przy danych z jednego miesiąca widzi komunikat o braku miesiąca do porównania.
- **Change ID:** fixed-cost-changes
- **PRD refs:** US-04, FR-012, kryterium sukcesu 2
- **Prerequisites:** S-03
- **Parallel with:** S-04, S-05, S-07, S-09
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Drugie kryterium sukcesu PRD; niezależne od progów, więc może iść równolegle z S-04, ale fixture F-02 musi zawierać podwyżkę subskrypcji i nowy wzorzec, inaczej wynik jest nieweryfikowalny.
- **Status:** proposed

### S-07: Trend „ponad progiem”

- **Outcome:** Użytkownik może zobaczyć sumę „ponad progiem” dla każdego miesiąca obecnego w danych, liczoną według dzisiejszych progów; zmiana lub usunięcie progu przelicza wszystkie miesiące, miesiąc bez nadwyżki pokazuje 0.
- **Change ID:** over-limit-trend
- **PRD refs:** US-05, FR-013, kryterium sukcesu drugorzędne
- **Prerequisites:** S-04
- **Parallel with:** S-05, S-06, S-09
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Rozszerza regułę z S-04 na wszystkie miesiące; ostatni w strumieniu, bo zmienia zachowanie użytkownika dopiero po kilku importach, a niepełny bieżący miesiąc świadomie nie jest oznaczany (założenie PRD).
- **Status:** proposed

### S-08: Konto i usunięcie konta

- **Outcome:** Użytkownik może zobaczyć swoje konto (e-mail, zmiana hasła, nota o przetwarzaniu danych) i samodzielnie usunąć konto po potwierdzeniu; usunięcie kasuje wszystkie jego dane bez śladu, a ponowne logowanie tym hasłem jest niemożliwe.
- **Change ID:** settings-account
- **PRD refs:** FR-001, FR-019, NFR „prawo do usunięcia”
- **Prerequisites:** —
- **Parallel with:** F-01, F-02, S-01, S-02, S-03, S-04
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Jedyny konieczny wycinek bez wymagań wstępnych, więc naturalny kandydat do pracy równoległej od zaraz; reguła „każda tabela domenowa kasuje się kaskadowo z kontem” musi obowiązywać w F-01 i każdym późniejszym wycinku, inaczej FR-019 przestanie być prawdą wraz z pierwszą nową tabelą.
- **Status:** done

### S-09: Publiczna instancja na syntetycznym wyciągu

- **Outcome:** Użytkownik (recenzent) może wejść na publiczną instancję, zalogować się na konto demo i zobaczyć zaimportowany syntetyczny wyciąg z wzorcami; żaden prawdziwy wyciąg nie trafia do repozytorium ani na publiczny URL.
- **Change ID:** public-demo-seed
- **PRD refs:** FR-014, NFR „prywatność danych źródłowych”, kryterium sukcesu 1 („na syntetycznym zestawie publicznie”)
- **Prerequisites:** F-02, S-03, dostęp do hostowanej bazy (`db push` / seed konta demo)
- **Parallel with:** S-05, S-06, S-07
- **Blockers:** —
- **Unknowns:**
  - Jak zasilić konto demo na produkcji, skoro `db push` nie stosuje `seed.sql`? — Owner: user. Block: no (rozstrzyga `/10x-plan`).
- **Risk:** Zamyka guardrail prywatności po stronie publicznej; sekwencjonowany po S-03, bo demo bez wzorców nie pokazuje nic, a po każdym kolejnym wycinku wystarczy ponowny import tego samego fixture.
- **Status:** proposed

## Backlog Handoff

| Roadmap ID | Change ID                    | Suggested issue title                                       | Ready for `/10x-plan` | Notes                                 |
| ---------- | ---------------------------- | ----------------------------------------------------------- | --------------------- | ------------------------------------- |
| F-01       | domain-schema-rls            | Pierwsza migracja: schemat domeny z RLS i kaskadą           | yes                   | Run `/10x-plan domain-schema-rls`     |
| F-02       | synthetic-ing-fixture        | Syntetyczny wyciąg ING z pułapkami (fixture + seed)         | yes                   | Run `/10x-plan synthetic-ing-fixture` |
| S-01       | ing-csv-import               | Import wyciągu ING z odrzucaniem nakładających się zakresów | no                    | Czeka na F-01, F-02                   |
| S-02       | undo-import                  | Lista importów i cofnięcie błędnego importu                 | no                    | Czeka na S-01                         |
| S-03       | merchant-patterns            | Lista wzorców sprzedawców (normalizacja + typ)              | no                    | Czeka na S-01, F-02                   |
| S-04       | pattern-threshold-over-limit | Próg na wzorcu i etykieta „ponad próg” z sumą miesiąca      | no                    | Gwiazda przewodnia; czeka na S-03     |
| S-05       | durable-pattern-decisions    | Scalanie, wykluczanie, typ i nazwa wzorca (trwałe)          | no                    | Czeka na S-03                         |
| S-06       | fixed-cost-changes           | Zmiany kwot i nowe wzorce stałe vs poprzedni miesiąc        | no                    | Czeka na S-03                         |
| S-07       | over-limit-trend             | Trend „ponad progiem” per miesiąc                           | no                    | Czeka na S-04                         |
| S-08       | settings-account             | Konto: e-mail, zmiana hasła, usunięcie konta                | yes                   | Run `/10x-plan settings-account`      |
| S-09       | public-demo-seed             | Konto demo z syntetycznym wyciągiem na produkcji            | no                    | Czeka na F-02, S-03                   |

## Open Roadmap Questions

1. **Wybór mechanizmu logowania** (email+hasło / OAuth / passwordless) — decyzja po wyborze stacku. Owner: user. Block: none — w kodzie działa już e-mail + hasło (Supabase); PRD wymaga aktualizacji, nie decyzji.
2. **Lista operatorów płatności** dla ekstrakcji sprzedawcy z `Tytuł` (D3 w `import-formats.md`) — start: PayPro, PayU, Cashbill, Autopay, ING Pay; rozszerzana w miarę importów. Owner: user. Block: S-03 (nie blokuje planowania; lista startowa wystarcza).

## Parked

- **Integracja z API banków / otwarta bankowość** — Why parked: PRD §Non-Goals; jedyne wejście to plik CSV.
- **Kategoryzacja wydatków i limity na kategorię** — Why parked: PRD §Non-Goals; reguła działa na wzorcach sprzedawcy.
- **Wiele walut i przeliczanie kursów** — Why parked: PRD §Non-Goals; tylko PLN.
- **Rozbijanie transakcji z pośredników na składowe** — Why parked: PRD §Non-Goals; pośrednicy liczą się jak sprzedawcy, wykluczenie przez S-05.
- **OCR paragonów** — Why parked: PRD §Non-Goals.
- **Wykresy inne niż lista i suma per miesiąc** — Why parked: PRD §Non-Goals.
- **Alerty i coach AI** — Why parked: PRD §Non-Goals; reguła jest deterministyczna.
- **Wielu użytkowników w jednym gospodarstwie domowym** — Why parked: PRD §Non-Goals.
- **Wersjonowanie progów w czasie** — Why parked: PRD §Non-Goals (rozstrzygnięcie FR-013: próg znaczy „jak oceniam dziś”).
- **Import z Santander Bank Polska (FR-018)** — Why parked: PRD nice-to-have poza MVP; dopiero po działającym przepływie ING.
- **Zmiana adresu e-mail w ustawieniach** — Why parked: kit ma przycisk bez zdefiniowanego przepływu, PRD tego nie wymaga (wywiad); wraca jako luka kitu, nie wycinek.
- **Utrwalanie błędów importu w bazie i biblioteka logowania** — Why parked: NFR „best-effort, bez SLA”; inwestycja w observability lekka (wywiad); pozycja z rejestru ryzyk `infrastructure.md`.
- **Pełna użyteczność mobilna, tryb offline, wiele regionów, budowanie pod skalę** — Why parked: PRD §Non-Goals (niefunkcjonalne).

## Milestone History

(Append-only. Empty on the very first milestone.)

## Done

(Empty on first generation. `/10x-archive` appends an entry here — and flips that item's `Status` to `done` — when a change whose `Change ID` matches the item is archived. Do NOT pre-populate.)

- **S-08: Użytkownik może zobaczyć swoje konto (e-mail, zmiana hasła, nota o przetwarzaniu danych) i samodzielnie usunąć konto po potwierdzeniu; usunięcie kasuje wszystkie jego dane bez śladu, a ponowne logowanie tym hasłem jest niemożliwe.** — Archived 2026-09-23 → `context/archive/2026-09-21-settings-account/`. Lesson: —.
