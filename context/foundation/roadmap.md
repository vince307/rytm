---
project: Rytm
version: 2
status: draft
created: 2026-09-21
updated: 2026-10-01
prd_version: 1
main_goal: quality
top_blocker: none
milestone_id: second-bank-santander
milestone_seq: 2
milestone_status: open
---

# Roadmap: Rytm

> Derived from `context/foundation/prd.md` (v1) + `context/foundation/import-formats.md` + auto-researched codebase baseline.
> Edit-in-place; archive when superseded.
> Slices below are listed in dependency order. The "At a glance" table is the index.

## Milestone

**M-2: Drugi bank — Santander** — Status: open

- **Intent:** Użytkownik z kontem w Santander Bank Polska wgrywa jego eksport CSV na tych samych zasadach co ING, a jego transakcje — także kartowe — trafiają do tych samych, poprawnie zgrupowanych wzorców co transakcje z ING.
- **Source materials:** `context/foundation/prd.md` (v1) — kolejna transza: jedyne wymaganie poza M-1, FR-018; kontrakt formatu w `context/foundation/import-formats.md` (sekcja Santander, D2, D4, D7, „Wykrywanie formatu”).
- **Done when:** every F-NN and S-NN below is `done`.
- **Scope anchors:** FR-018 (nice-to-have), stosowane według reguł FR-003–FR-007 i FR-014 (prywatność: syntetyczny fixture zamiast prawdziwego wyciągu).

## Vision recap

Rytm wgrywa CSV z banku, normalizuje opisy do sprzedawców, wykrywa wzorce stałe i częste i pozwala ustawić własny próg na wzorcu; to, co w miesiącu go przekracza, dostaje etykietę „ponad próg” i jest zsumowane. M-1 dowiózł cały przepływ dla ING Bank Śląski. M-2 dodaje drugie źródło danych — Santander Bank Polska — bez zmiany reguły: wzorzec to sprzedawca, niezależnie od banku, z którego przyszła transakcja.

## North star

**S-11: Transakcje kartowe z Santandera trafiają do właściwych wzorców** — przy celu `quality` drugi bank ma wartość dopiero wtedy, gdy jego transakcje grupują się poprawnie; sam import bez tego daje listę wzorców z opisami kart zamiast sprzedawców.

> Gwiazda przewodnia to najmniejszy przepływ od końca do końca, którego dowiezienie udowadnia główną hipotezę kamienia milowego — umieszczona tak wcześnie, jak pozwalają jej wymagania wstępne, bo reszta ma znaczenie tylko wtedy, gdy ten przepływ działa.

## At a glance

| ID   | Change ID                   | Outcome (user can …)                                                                                                        | Prerequisites | PRD refs                       | Status   |
| ---- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------- | ------------------------------ | -------- |
| F-03 | synthetic-santander-fixture | (foundation) w repozytorium jest syntetyczny eksport Santander PLN z pułapkami formatu i opisów oraz plik USD do odrzucenia | —             | FR-018, FR-014, NFR prywatność | ready    |
| S-10 | santander-csv-import        | wgrać plik CSV z Santandera i zobaczyć wynik importu na tych samych zasadach co ING                                         | F-03          | FR-018, FR-004, FR-005         | proposed |
| S-11 | santander-card-merchants    | zobaczyć transakcje kartowe z Santandera we właściwych wzorcach sprzedawców, wspólnych z ING                                | S-10, F-03    | FR-018, FR-006, FR-007         | proposed |

## Baseline

What's already in place in the codebase as of `2026-10-01` (auto-researched + user-confirmed). M-1 (F-01, F-02, S-01–S-09) is done.
Foundations below assume these are present and do NOT re-scaffold them.

- **Frontend:** present — strony Astro i wyspy React (`src/pages/*`, `src/components/imports/ImportWizard.tsx`); kreator importu woła wprost parser ING i zawsze pokazuje krok wyboru rachunku.
- **Backend / API:** present — trasy API Astro (`src/pages/api/imports.ts`, `patterns/*`, `auth/*`); zapis importu wyłącznie przez RPC `import_ing_statement`.
- **Data:** present — migracje z RLS per operację i pgTAP w CI. Pod Santandera: `bank_tx_id` jest już opcjonalne, a `imports_no_overlap` liczy nakładanie per rachunek, bez banku; `imports.source` dopuszcza tylko `'ing'`, brak numeru wiersza (`lp`) jako klucza dla banku bez ID transakcji.
- **Auth:** present — Supabase auth, `src/middleware.ts`, strażnik konta demo (S-09).
- **Deploy / infra:** present — CI `ci` → `smoke` → `deploy` z migracjami stosowanymi przez CI, Vercel `fra1`.
- **Observability:** partial — tylko `console.*` po stronie serwera, bez trackera błędów (świadomie lekko, Parked z M-1).
- **Import pipeline (dla M-2):** tylko ING — parser `src/lib/import/ing.ts` (cp1250, `;`, preambuła wielu rachunków) bez wykrywania formatu; schemat payloadu wymaga 18-cyfrowego ID transakcji ING i nazwy rachunku; `rawMerchant()` w `src/lib/patterns/merchant.ts` czyta kolumny ING, `normalizeMerchant()` jest neutralne względem banku; fixture i generator tylko dla ING; copy kitu mówi „Santander wkrótce”.
- **Poza repozytorium:** prawdziwy eksport Santander PLN leży lokalnie u autora — służy wyłącznie do kształtowania syntetycznego fixture (kształty, nie dane), jak w F-02.

## Foundations

### F-03: Syntetyczny eksport Santandera

- **Outcome:** (foundation) w repozytorium jest syntetyczny plik CSV w formacie Santander Bank Polska (zgodny z `import-formats.md`) z pułapkami: dwie karty na jednym rachunku, ta sama sieć z różnymi numerami placówek, ten sam sprzedawca zapisany dwojako przez operatora kart, wypłata z bankomatu, BLIK, przelewy, zwrot płatności kartą do pominięcia, sprzedawca obecny też w fixture ING; obok plik konta USD do testu odrzucenia waluty, oczekiwany wynik i kontrola spójności jak dla ING.
- **Change ID:** synthetic-santander-fixture
- **PRD refs:** FR-018, FR-014, NFR „prywatność danych źródłowych”
- **Unlocks:** S-10 (parser i import weryfikowane bez prawdziwego wyciągu w repo), S-11 (jakość grupowania kart mierzona na znanych pułapkach)
- **Prerequisites:** prawdziwy eksport Santander PLN dostępny lokalnie u autora, poza repozytorium
- **Parallel with:** —
- **Blockers:** —
- **Unknowns:**
  - Czy płatności BLIK przez operatorów (PayU, PayPro…) w eksporcie Santandera niosą domenę sprzedawcy, jak w ING (D3)? — Owner: user. Block: no (sprawdzane na prawdziwym eksporcie przy kształtowaniu fixture).
- **Risk:** Najpierw, bo cel `quality` wymaga mierzenia parsera i grupowania na znanych pułapkach, a prywatność wyklucza prawdziwy wyciąg w repo; ryzyko — fixture zbyt czysty względem prawdziwych opisów, łagodzone kształtowaniem z prawdziwego eksportu.
- **Status:** ready

## Slices

### S-10: Import CSV z Santandera

- **Outcome:** Użytkownik może wgrać plik CSV z Santander Bank Polska (PLN): aplikacja sama rozpoznaje format, pokazuje wynik importu (liczba obciążeń, zakres od daty z nagłówka do daty eksportu) i dodaje import do listy importów z nazwą banku; plik w innej walucie i zakres nakładający się na istniejący import tego rachunku są odrzucane z komunikatem, uznania i zwroty są pomijane, a transakcje trafiają do wzorców.
- **Change ID:** santander-csv-import
- **PRD refs:** FR-018, FR-004, FR-005
- **Prerequisites:** F-03
- **Parallel with:** —
- **Blockers:** —
- **Unknowns:**
  - Jak kreator i lista importów pokazują bank i pomijają wybór rachunku przy pliku z jednym rachunkiem, skoro kit zapowiada Santandera tylko jako „wkrótce”? — Owner: user. Block: no (luka kitu w `design-kit.md`, rozstrzygana w planie).
- **Risk:** Przed gwiazdą przewodnią, bo bez zaimportowanych danych nie ma czego grupować; ryzyko — import ING musi działać bez zmian po uogólnieniu zapisu importu (migracja wstecznie zgodna, smoke ING bez zmian).
- **Status:** proposed

### S-11: Transakcje kartowe Santandera we właściwych wzorcach

- **Outcome:** Użytkownik może zobaczyć transakcje kartowe z Santandera we właściwych wzorcach: opis płatności kartą daje sprzedawcę bez numeru karty i numeru placówki, płatności obiema kartami jednego rachunku trafiają do tego samego wzorca, wypłaty z bankomatu tworzą jeden wzorzec, a ten sam sprzedawca z ING i z Santandera jest jednym wzorcem.
- **Change ID:** santander-card-merchants
- **PRD refs:** FR-018, FR-006, FR-007
- **Prerequisites:** S-10, F-03
- **Parallel with:** —
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Gwiazda przewodnia M-2 — normalizacja to rdzeń produktu (FR-006), a opisy kartowe Santandera mają inny kształt niż ING; ryzyko — zmiana normalizacji przesuwa istniejące wzorce ING, więc oczekiwany wynik fixture ING musi pozostać bez zmian.
- **Status:** proposed

## Backlog Handoff

| Roadmap ID | Change ID                   | Suggested issue title                                    | Ready for `/10x-plan` | Notes                                       |
| ---------- | --------------------------- | -------------------------------------------------------- | --------------------- | ------------------------------------------- |
| F-03       | synthetic-santander-fixture | Syntetyczny eksport Santander PLN z pułapkami + plik USD | yes                   | Run `/10x-plan synthetic-santander-fixture` |
| S-10       | santander-csv-import        | Import CSV z Santander Bank Polska                       | no                    | Czeka na F-03                               |
| S-11       | santander-card-merchants    | Transakcje kartowe Santandera we właściwych wzorcach     | no                    | Czeka na S-10                               |

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
