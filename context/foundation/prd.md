---
project: "Rytm"
version: 1
status: draft
created: 2026-09-18
context_type: greenfield
product_type: web-app
target_scale:
  users: large          # aspiracja po MVP (do 10 tys.); persona MVP to jeden użytkownik — autor. Reguła jest per konto, skala nie zmienia reguły.
  qps: low
  data_volume: small    # tysiące transakcji per konto
timeline_budget:
  mvp_weeks: 6          # acknowledged 2026-09-16: 6 tygodni po godzinach wymaga stałej dyscypliny; opcje scope-down odrzucone
  hard_deadline: 2026-11-04
  after_hours_only: true
---

# PRD — Rytm

## Vision & Problem Statement

**Pain.** Pieniądze cicho uciekają z konta. Bank (ING Bank Śląski, konto w PLN) kategoryzuje transakcje, ale nie odpowiada na dwa pytania: „które wydatki były zbędne?” i „co się powtarza i cicho rośnie?”. Moment bólu: koniec miesiąca — spojrzenie na saldo i poczucie, że coś ucieka, bez konkretnej odpowiedzi co. Koszt dziś: eksport CSV/PDF i ręczna analiza w arkuszu, która jest męką i w praktyce się nie dzieje; kategoryzacja banku nie budzi zaufania i nie daje odpowiedzi. Rodzaj problemu: dane uwięzione w wyciągu (informacja jest w CSV, ale bez narzędzia niedostępna), paraliż decyzyjny (saldo bez odpowiedzi „co przestać robić”), brak zaufania do istniejącego narzędzia (kategorie banku odpowiadają na inne pytanie).

**Insight.** „Zbędne” to nadwyżka powtórzeń ponad własny próg, nie kategoria. Kawa nie jest zbędna; piąta kawa w tygodniu jest. Kategorie i budżety liczą sumy per kategoria — nie widzą częstotliwości względem progu, który użytkownik sam ustawia na konkretnym wzorcu (sprzedawcy). Stąd dwa typy wzorców: **stały** (sprzedawca + podobna kwota — subskrypcje, opłaty, raty; interesuje zmiana kwoty i nowe wzorce) i **częsty** (sam sprzedawca niezależnie od kwoty — Wolt, kawa; interesuje liczba wystąpień lub suma w miesiącu).

## User & Persona

Jeden nazwany użytkownik: autor projektu. Osoba z kontem w ING Bank Śląski (PLN), która sama kontroluje swoje wydatki, nie ufa kategoryzacji banku i sięga po narzędzie pod koniec miesiąca (lub po pobraniu nowego wyciągu), żeby zobaczyć, gdzie ucieka pieniądz i co przestać robić. Wszystkie decyzje projektowe pierwszej wersji są pod ten jeden wyciąg i te nawyki; nie ma persony drugorzędnej.

Adnotacja do `target_scale.users: large`: to aspiracja po MVP, nie persona. MVP jest dla autora; otwarta rejestracja zostaje, ale nic w MVP nie jest budowane pod skalę — reguła jest per konto i per wyciąg, nic nie jest liczone między kontami, więc skala to koszt hostingu, nie zmiana reguły.

## Success Criteria

### Primary
- Użytkownik wgrywa CSV z ING, ustawia próg na wzorcu i widzi nadwyżkę ponad próg jako „ponad próg” z sumą „ponad progiem w tym miesiącu” — cały 6-krokowy przepływ działa na prawdziwym wyciągu (lokalnie) i na syntetycznym zestawie (publicznie).
- Dla wzorców stałych aplikacja wskazuje, które podrożały i które są nowe względem poprzedniego okresu.

### Secondary
- Trend miesięczny „ponad progiem” na ≥ 3 miesiącach: po kilku importach widać, czy suma „ponad progiem” maleje z miesiąca na miesiąc — dowód, że narzędzie zmienia zachowanie.

### Guardrails
- Prywatność: prawdziwe wyciągi nigdy nie trafiają do repozytorium ani do publicznego demo; publiczny URL i testy działają wyłącznie na syntetycznym zestawie CSV.
- Determinizm: ten sam CSV + te same progi = ta sama lista wzorców i ta sama suma; użytkownik rozumie, co zdecydowało o etykiecie „ponad próg”.
- Import nie dubluje transakcji: ponowne wgranie nakładającego się zakresu nie zawyża sum.
- Czas od wgrania CSV do listy wzorców liczony w sekundach, nie minutach, dla wyciągu z kilku miesięcy.

## User Stories

### US-01: Użytkownik znajduje wydatki ponad próg w wyciągu z ING

- **Given** zalogowany użytkownik bez importów
- **When** wgrywa CSV z ING za 3 miesiące, na wzorcu częstym „Wolt” ustawia próg 4/miesiąc, a na wzorcu stałym „Netflix” akceptowaną kwotę 43 zł
- **Then** widzi listę wzorców (stałe/częste, liczba, suma), 5.–n-te zamówienie Wolt w każdym miesiącu oznaczone „ponad próg”, sumę „ponad progiem w tym miesiącu”, a Netflix — jeśli zmienił kwotę — na liście zmian kwoty

#### Acceptance Criteria
- Wzorzec częsty bez progu nie generuje transakcji „ponad próg”.
- Suma „ponad progiem” = suma kwot transakcji oznaczonych „ponad próg” w danym miesiącu.
- Ten sam CSV + te same progi dają identyczny wynik; ponowny import tego samego zakresu jest odrzucony (brak duplikatów).

### US-02: Użytkownik cofa błędny import

- **Given** zalogowany użytkownik z jednym importem obejmującym styczeń–marzec
- **When** wgrywa plik za luty–kwiecień, a następnie na liście importów usuwa import styczeń–marzec i wgrywa plik za luty–kwiecień ponownie
- **Then** pierwsza próba jest odrzucona z komunikatem o nakładającym się zakresie; po usunięciu importu jego transakcje znikają ze wzorców i sum; ponowne wgranie jest przyjęte

#### Acceptance Criteria
- Odrzucony import nie zmienia listy importów, wzorców ani sum.
- Po usunięciu importu lista importów, wzorce i sumy „ponad progiem” nie zawierają jego transakcji; wzorzec bez transakcji znika z listy.
- Trwałe decyzje o wzorcach (FR-009) i progi (FR-010) przetrwają usunięcie importu — są przypisane do sprzedawcy, nie do importu. *(założenie przyjęte 2026-09-18)*

> Pokrywa FR-004, FR-005.

### US-03: Decyzje użytkownika o wzorcach przetrwają kolejny import

- **Given** zalogowany użytkownik po imporcie za styczeń–marzec; na liście dwa warianty opisu tego samego sprzedawcy jako dwa wzorce częste oraz „przelew między własnymi bankami” jako wzorzec
- **When** scala oba warianty w jeden, nadaje mu nazwę, wyklucza przelew własny z analizy i zmienia typ wybranego wzorca z „częsty” na „stały”, a potem wgrywa import za kwiecień–czerwiec
- **Then** lista pokazuje jeden scalony wzorzec z połączoną liczbą i sumą pod nową nazwą; przelew własny nie bierze udziału w regule; zmieniony typ obowiązuje; transakcje z nowego importu trafiają do scalonego wzorca, a wykluczenie i typ pozostają bez ponownej edycji

#### Acceptance Criteria
- Po scaleniu każda transakcja liczy się raz; liczba i suma scalonego wzorca = suma składników.
- Wykluczony wzorzec nie generuje „ponad próg” i nie wchodzi do sumy miesięcznej.
- Kolejny import stosuje scalenie, nazwę, wykluczenie i typ automatycznie.

> Pokrywa FR-006, FR-007, FR-009.

### US-04: Użytkownik widzi, które wzorce stałe zmieniły kwotę i które są nowe

- **Given** zalogowany użytkownik z importem obejmującym co najmniej dwa pełne miesiące kalendarzowe; „Netflix” to wzorzec stały z kwotą 43 zł w poprzednim miesiącu
- **When** w bieżącym miesiącu Netflix pobrał 49 zł, a pojawił się sprzedawca z kwotą w tolerancji, którego nie było w poprzednim miesiącu kalendarzowym
- **Then** Netflix jest na liście zmian kwoty (43 → 49 zł), a nowy sprzedawca jest oznaczony jako nowy wzorzec stały względem poprzedniego miesiąca

#### Acceptance Criteria
- Każda zmiana kwoty względem ostatniego wystąpienia jest raportowana — także obniżka i zmiana mieszcząca się w tolerancji (15% mediany lub ±10 zł).
- Wzorzec stały bez zmiany kwoty nie pojawia się na liście zmian.
- „Nowy” = brak wystąpień w poprzednim miesiącu kalendarzowym (D6).
- Gdy dane obejmują tylko jeden miesiąc, lista nowych wzorców jest pusta z komunikatem, że nie ma poprzedniego miesiąca do porównania (nie: „wszystko jest nowe”). *(założenie przyjęte 2026-09-18)*

> Pokrywa FR-012.

### US-05: Użytkownik widzi trend „ponad progiem” według dzisiejszych progów

- **Given** zalogowany użytkownik z importem 12 miesięcy i progiem 4/miesiąc na wzorcu częstym „Wolt”
- **When** otwiera widok trendu, a następnie zmienia próg Wolt na 6/miesiąc i w końcu usuwa próg
- **Then** widzi sumę „ponad progiem” dla każdego z 12 miesięcy; po zmianie progu wszystkie miesiące (także historyczne) są przeliczone według 6; po usunięciu progu Wolt nie wnosi nic do żadnego miesiąca

#### Acceptance Criteria
- Suma per miesiąc = suma kwot transakcji „ponad próg” ze wszystkich wzorców z progiem w tym miesiącu.
- Miesiąc bez transakcji ponad progiem pokazuje 0, nie brak wartości.
- Trend liczony wyłącznie według bieżących progów — nie ma sposobu odtworzenia sumy sprzed zmiany progu (non-goal: wersjonowanie progów).
- Niepełny bieżący miesiąc jest pokazywany na równi z pełnymi, bez oznaczenia. *(założenie przyjęte 2026-09-18; ryzyko zgłoszone przez Sokratesa przy FR-013)*

> Pokrywa FR-010, FR-013.

## Functional Requirements

MVP flow (pierwsza sesja, klik po kliku), który spinają poniższe FR:

1. Użytkownik loguje się.
2. Wgrywa plik CSV z ING (jeden plik).
3. Widzi listę wykrytych wzorców: sprzedawca, typ (stały / częsty), liczba wystąpień, suma, dla stałych — kwota.
4. Na wybranym wzorcu ustawia próg (częsty: liczba wystąpień lub suma w miesiącu; stały: akceptowana kwota).
5. Widzi nadwyżkę ponad próg oznaczoną jako „ponad próg” i sumę „ponad progiem w tym miesiącu”.
6. Dla wzorców stałych widzi, które podrożały i które są nowe.

### Konto
- FR-001: Użytkownik może założyć konto i zalogować się. Priority: must-have
  > Socrates: Counter-arguments considered: "single user — full registration is cost without value; a config-file password would do" and "login forces server-side data; a local model avoids the privacy problem". Resolution: kept as written — public URL + private data makes login necessary.
- FR-002: Zalogowany użytkownik widzi wyłącznie własne importy, wzorce i progi. Priority: must-have
  > Socrates: Counter-arguments considered: "isolation without a second user is an untestable promise" and "multi-account complicates the demo seed". Resolution: kept as written — isolation is the natural consequence of login.
- FR-019: Użytkownik może usunąć swoje konto; usunięcie usuwa wszystkie jego dane (importy, transakcje, wzorce i decyzje o wzorcach, progi). Priority: must-have
  > Added 2026-09-18 (OQ 4): NFR „prawo do usunięcia” zakładał zdolność, której nie było w FR; domknięte jako must-have — samoobsługowe, nie operacja operatora.

### Import
- FR-003: Użytkownik może wgrać plik CSV z ING Bank Śląski (PLN) i zobaczyć wynik importu (liczba transakcji, zakres dat). Priority: must-have
  > Socrates: Counter-arguments considered: "ING format unverified — day-one gate not yet done (cp1250, multi-line headers)" and "one bank is a single point of failure". Resolution: kept as written — one external dependency is a deliberate choice.
- FR-004: Użytkownik może zobaczyć listę importów i cofnąć błędny import, usuwając go wraz z jego transakcjami. Priority: must-have
  > Socrates: Counter-argument considered: "deleting an import is CRUD for reviewers, not for the user". Resolution: kept as must-have, reframed as "undo a wrong import" (wrong file / wrong range) — a real need, not a checklist item.
- FR-005: Import, którego zakres dat zachodzi na istniejący import, jest odrzucany z komunikatem; nie ma deduplikacji transakcji. Priority: must-have
  > Socrates: Counter-argument considered: "ING may not give a stable transaction ID — dedup by date+amount+description is fragile (two identical coffees the same day collapse into one)". Resolution: FR rewritten — overlapping ranges are rejected instead of deduplicated; the no-duplicates guardrail is satisfied by construction.
  > Verified 2026-09-18: ING has a stable key `(Nr transakcji, Konto)`; Santander has none — the rejection rule is right for both. Import range comes from the file header when present (see `import-formats.md`, D7). The import covers one account (chosen at import time) and debits only (D1, D2).
- FR-018: Użytkownik może wgrać plik CSV z Santander Bank Polska (PLN) na tych samych zasadach co ING (wynik importu, lista importów, odrzucanie nakładających się zakresów, tylko obciążenia). Priority: nice-to-have
  > Added 2026-09-18 (OQ 3, D4): poza MVP — wchodzi dopiero po działającym przepływie ING, jeśli zostanie czas. Format PLN CSV zweryfikowany (`import-formats.md`); brak stabilnego klucza transakcji nie przeszkadza, bo FR-005 odrzuca zakresy zamiast deduplikować.

### Wzorce
- FR-006: Aplikacja normalizuje opis transakcji do sprzedawcy. Priority: must-have
  > Socrates: Counter-arguments considered: "this is the whole project hidden in one line (pre-mortem)" and "without a quality definition it cannot be frozen — endless tuning". Resolution: kept as written — normalisation is the core; FR-009 covers its errors.
- FR-007: Aplikacja wykrywa wzorce stałe (sprzedawca + kwota w tolerancji) i częste (sam sprzedawca); każdy sprzedawca ma dokładnie jeden typ (aplikacja proponuje: kwoty w tolerancji → stały, inaczej częsty), każda transakcja liczy się raz. Lista pokazuje: sprzedawca, typ, liczba wystąpień, suma, kwota (dla stałych). Priority: must-have
  > Socrates: Counter-argument considered: "the same merchant can be both fixed and frequent — double counting". Resolution: FR rewritten — one type per merchant, app proposes, user can change (FR-009); a transaction counts once.
- FR-008: Użytkownik może zobaczyć transakcje składające się na wzorzec. Priority: must-have
  > Socrates: Counter-argument considered: "a diagnostic screen, not value — the CSV shows the same". Resolution: kept as must-have — the label "ponad próg" without its constituent transactions is a black box; the determinism guardrail must be visible to the user.
- FR-009: Użytkownik może scalić dwa wzorce w jeden, wykluczyć wzorzec z analizy, zmienić typ wzorca (stały/częsty) i zmienić nazwę sprzedawcy; te decyzje są trwałe i stosowane do kolejnych importów. Priority: must-have
  > Socrates: Counter-argument considered: "a merge must survive the next import — otherwise the user re-merges every month". Resolution: FR extended — decisions are durable mapping rules, not one-off edits. Absorbed FR-015 (rename) after its own round: "same mechanics as durable merge, nearly free" — promoted to must-have.

### Progi i reguła
- FR-010: Użytkownik może ustawić, zmienić i usunąć próg na wzorcu (częsty: liczba wystąpień lub suma na miesiąc; stały: akceptowana kwota). Priority: must-have
  > Socrates: Counter-arguments considered: "two threshold kinds for frequent patterns (count OR sum) are two rules — pick one" and "manual thresholds need discipline you don't have (plan-B risk)". Resolution: kept as written — the threshold is the user's only input into the rule.
- FR-011: Aplikacja oznacza nadwyżkę ponad próg etykietą „ponad próg” i sumuje ją w widoku „ponad progiem w tym miesiącu”. Priority: must-have
  > Socrates: Counter-arguments considered: "'surplus' for a count threshold is ambiguous — which transactions: last or most expensive?" and "'zbędne' is a moral label — trust erodes when it marks something needed". Resolution: label renamed from „zbędne” / „spalone” to neutral „ponad próg” / „ponad progiem w tym miesiącu”. Which transactions count as surplus for a count threshold → Open Questions.
  > Resolved (shape checkpoint): chronological — from the (threshold+1)-th transaction in the month; sum threshold and fixed-pattern surplus defined in Business Logic.
- FR-012: Dla wzorców stałych aplikacja pokazuje, które zmieniły kwotę (każda zmiana względem ostatniego wystąpienia, niezależnie od tolerancji) i które są nowe względem poprzedniego okresu. Priority: must-have
  > Socrates: Counter-arguments considered: "'previous period' is undefined with one import" and "a price rise inside the tolerance is invisible — tolerance and 'got pricier' conflict". Resolution: FR rewritten — tolerance is used only to detect the fixed pattern; any amount change vs the last occurrence is reported.
  > Resolved 2026-09-18: "previous period" = previous calendar month (D6). Tolerance = 15% of median OR ±10 PLN, whichever is larger (D5).
- FR-013: Użytkownik widzi sumę „ponad progiem” per miesiąc dla wszystkich miesięcy obecnych w danych (trend), liczoną według dzisiejszych progów. Priority: must-have
  > Socrates: Counter-arguments considered: "today's thresholds applied retroactively — the trend is an artefact of the threshold, not of behaviour" and "a partial current month deflates the last point". Resolution: accepted simplification — the threshold means "how I judge today"; threshold versioning goes to Non-Goals.

### Dane demo
- FR-014: Publiczna instancja działa na syntetycznym zestawie CSV (seed), bez prawdziwych wyciągów; seed zawiera realistyczne pułapki: warianty opisów tego samego sprzedawcy, pośredników (PayPal/Allegro/BLIK), subskrypcję z podwyżką, nowy wzorzec. Priority: must-have
  > Socrates: Counter-arguments considered: "a synthetic set won't reproduce the dirt of real descriptions — pretty demo, broken product" and "seed is work that isn't a feature". Resolution: FR extended — the seed must carry realistic traps, built from the shapes (not the data) of the real statement.

### Dropped in the Socratic round

Numery FR-015–FR-017 są wycofane i nie są używane ponownie; nowe wymagania numerowane od FR-018.

- FR-015 (rename merchant) — merged into FR-009 as must-have.
- FR-016 (multi-file import) — removed: ING gives one export per chosen range (12 months); returns to Open Questions only if the export range turns out to be short.
- FR-017 (opaque-intermediary flag) — removed: intermediaries are half the statement; excluding them makes the monthly sum falsely low. They count as ordinary merchants ("Allegro 8×" is a frequent-pattern signal); exclusion via FR-009 remains a user option; splitting them into components stays a non-goal.
  > Amended 2026-09-18: in the ING export, BLIK payments through payment operators (PayPro/PayU/Cashbill/Autopay) carry the real merchant's domain at the end of `Tytuł`. Normalisation (FR-006) uses that domain as the merchant, so operators do not appear as patterns (D3 in `import-formats.md`). Allegro remains opaque and is handled as before.

## Non-Functional Requirements

- Prywatność danych źródłowych: prawdziwe wyciągi nie trafiają do repozytorium ani do publicznej instancji; publiczny URL działa wyłącznie na syntetycznym zestawie.
- Retencja: oryginalny plik CSV nie jest przechowywany po zakończeniu importu — pozostają wyłącznie sparsowane transakcje.
- Prawo do usunięcia: usunięcie konta usuwa wszystkie dane użytkownika bez śladu w magazynie operatora.
- Dane transakcji nie opuszczają produktu — żadna usługa trzecia nie otrzymuje treści transakcji do analizy.
- Determinizm: ten sam plik CSV i te same progi dają identyczną listę wzorców i identyczne sumy przy każdym uruchomieniu.
- Czas od wgrania CSV do listy wzorców liczony w sekundach, nie minutach, dla wyciągu obejmującego kilka–kilkanaście miesięcy; przy dłuższym przetwarzaniu użytkownik widzi ciągły postęp.
- Urządzenia: pełna użyteczność na desktopie w aktualnych wersjach głównych przeglądarek; podstawowe widoki (lista wzorców, suma miesięczna) używalne na telefonie.
- Dostępność: best-effort, bez SLA — narzędzie osobiste używane raz w miesiącu.

## Business Logic

Każda transakcja jest przypisana do dokładnie jednego wzorca sprzedawcy (stałego albo częstego), a to, co w miesiącu przekracza próg ustawiony przez użytkownika na tym wzorcu, jest oznaczone „ponad próg” i zsumowane.

**Wejścia** (widoczne dla użytkownika): plik CSV z ING Bank Śląski (PLN); progi ustawione per wzorzec — dla wzorca częstego liczba wystąpień na miesiąc albo suma na miesiąc, dla wzorca stałego akceptowana kwota; trwałe decyzje użytkownika o wzorcach (scalenie, wykluczenie, zmiana typu, zmiana nazwy). Opis transakcji jest normalizowany do sprzedawcy; sprzedawca, którego kwoty mieszczą się w tolerancji, jest proponowany jako wzorzec stały, pozostali jako częsty; użytkownik może zmienić typ. Wykluczony wzorzec nie bierze udziału w regule.

**Wynik**: lista wzorców (sprzedawca, typ, liczba wystąpień, suma, kwota dla stałych) z podglądem transakcji; transakcje „ponad próg” i suma „ponad progiem w tym miesiącu” per miesiąc (trend, według dzisiejszych progów); dla wzorców stałych — każda zmiana kwoty względem ostatniego wystąpienia (niezależnie od tolerancji) i wzorce nowe względem poprzedniego okresu. Nadwyżka jest liczona tak: próg liczbowy — chronologicznie od (próg+1)-szej transakcji w miesiącu; próg kwotowy — suma miesiąca minus próg, oznaczone są transakcje od tej, przy której suma narastająco przekracza próg; wzorzec stały — kwota wystąpienia minus akceptowana kwota, gdy dodatnia. Wzorzec bez progu nie generuje nic „ponad próg”.

**Gdzie użytkownik spotyka regułę**: po imporcie widzi listę wzorców; ustawia próg na wzorcu i natychmiast widzi, które transakcje i jaka kwota są ponad progiem w bieżącym miesiącu oraz jak wygląda ta suma w poprzednich miesiącach. Reguła jest deterministyczna — ten sam CSV i te same progi dają ten sam wynik.

## Access Control

Logowanie; mechanizm nierozstrzygnięty — patrz Open Questions. Aplikacja ma publiczny URL, a dane (wyciągi, wzorce, progi) są prywatne — niezalogowany użytkownik nie widzi niczego poza ekranem logowania. Rejestracja jest otwarta.

Model płaski, wielokontowy: każde konto jest właścicielem wyłącznie własnych importów, wzorców i progów. Brak ról (admin/member), brak zaproszeń, brak współdzielenia danych między kontami. Najmniejszy model dostępu, który czyni MVP użytecznym: jedno konto autora; wiele kont to izolacja danych, nie druga persona.

## Non-Goals

Z listy zaakceptowanej przed sesją (jeden do jednego):
- Integracja z API banków / otwarta bankowość — jedyne wejście to plik CSV na dysku.
- Kategoryzacja wydatków i limity na kategorię — reguła działa na wzorcach sprzedawcy, nie na kategoriach; to inne pytanie niż „co się powtarza”.
- Wiele walut i przeliczanie kursów — twarda reguła: tylko PLN.
- Rozbijanie transakcji z pośredników (PayPal, Allegro, BLIK) na składowe — pośrednicy liczą się jak zwykli sprzedawcy; użytkownik może ich wykluczyć.
- OCR paragonów — brak wejścia innego niż CSV.
- Wykresy inne niż lista i suma — MVP pokazuje listy i sumy per miesiąc.
- Alerty i coach AI — brak powiadomień, brak AI w produkcie; reguła jest deterministyczna.
- Wielu użytkowników w jednym gospodarstwie domowym — brak współdzielenia danych między kontami.

Wynikające z rundy Sokratesa:
- Wersjonowanie progów w czasie — próg znaczy „jak oceniam dziś”; trend jest liczony według dzisiejszych progów (rozstrzygnięcie FR-013).

Nice-to-have poza MVP (żeby nikt nie zakładał, że jest w zakresie):
- Import z Santander Bank Polska (FR-018) — dopiero po działającym przepływie ING, jeśli zostanie czas.

Niefunkcjonalne (wyprowadzone z NFR i ram; dopisane 2026-09-18, OQ 6):
- Brak SLA dostępności — best-effort; narzędzie osobiste używane raz w miesiącu.
- Brak trybu offline — produkt działa pod publicznym URL i wymaga połączenia.
- Brak wielu regionów / wysokiej dostępności — jedna instancja wystarcza dla persony i skali MVP.
- Brak certyfikacji compliance poza podstawową ochroną danych opisaną w NFR (retencja CSV, prawo do usunięcia, dane nie opuszczają produktu).
- Brak pełnej użyteczności mobilnej — na telefonie tylko podstawowe widoki (lista wzorców, suma miesięczna); pełna użyteczność jest desktopowa.
- Brak budowania pod skalę — `target_scale.users: large` to aspiracja; nic w MVP nie jest projektowane pod 10 tys. użytkowników.

## Open Questions

1. **Wybór mechanizmu logowania** (email+hasło / OAuth / passwordless) — decyzja po wyborze stacku. Owner: user. Block: no (blokuje implementację FR-001, nie PRD).
2. **Lista operatorów płatności** dla ekstrakcji sprzedawcy z `Tytuł` (D3 w `import-formats.md`) — start: PayPro, PayU, Cashbill, Autopay, ING Pay; rozszerzana w miarę importów. Owner: user. Block: no.

Zamknięte przed PRD (2026-09-18, na prawdziwych eksportach; decyzje D1–D9 w `context/foundation/import-formats.md`): format eksportu ING, drugi bank (Santander, nie Erste), tolerancja kwoty dla wzorców stałych (15% mediany lub ±10 PLN), zakres historii (jeden eksport = 12 miesięcy), definicja „poprzedniego okresu” (poprzedni miesiąc kalendarzowy).

Zamknięte w przeglądzie PRD (2026-09-18): Santander → FR-018 nice-to-have poza MVP; usunięcie konta → FR-019 must-have; niefunkcjonalne non-goals → dopisane do Non-Goals z NFR i ram; pokrycie user stories → US-02..US-05 dopisane z trzema przyjętymi założeniami (oznaczone w Acceptance Criteria).
