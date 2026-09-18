---
project: "Rytm"
context_type: greenfield
created: 2026-09-16
updated: 2026-09-18
checkpoint:
  current_phase: 8
  phases_completed: [1, 2, 3, 4, 5, 6, 7]
  gray_areas_resolved:
    - topic: "pain category"
      decision: "data trapped in the statement + decision paralysis + no trust in bank categorisation"
    - topic: "core insight"
      decision: "unnecessary = surplus of repetitions above the user's own threshold, not a category"
    - topic: "primary persona scope"
      decision: "one named user: the author"
    - topic: "access model"
      decision: "login; multiple independent accounts, each sees only its own data; no roles, no sharing"
    - topic: "MVP scope vs timeline"
      decision: "full 6-step flow kept (two pattern types, thresholds, price changes); user committed to a 6-week after-hours MVP"
    - topic: "overlapping imports"
      decision: "reject an import whose date range overlaps an existing one; no dedup heuristics"
    - topic: "pattern type precedence"
      decision: "a merchant has exactly one type (app proposes, user can change); a transaction counts once"
    - topic: "persistence of user decisions on patterns"
      decision: "merge / exclude / type / rename are durable and applied to subsequent imports"
    - topic: "label wording"
      decision: "neutral 'ponad próg' and 'ponad progiem w tym miesiącu' instead of 'zbędne' / 'spalone'"
    - topic: "tolerance vs price change"
      decision: "tolerance only detects the fixed pattern; any amount change vs last occurrence is reported"
    - topic: "thresholds applied retroactively"
      decision: "accepted simplification: threshold = 'how I judge today'; trend is history vs today's threshold; threshold versioning is a non-goal"
    - topic: "optional suggestions (multi-file import, opaque intermediaries flag)"
      decision: "both dropped; intermediaries count as ordinary merchants, exclusion via FR-009 remains"
    - topic: "surplus for count threshold"
      decision: "chronological: from the (threshold+1)-th transaction in the month"
    - topic: "surplus for sum threshold"
      decision: "month sum minus threshold; transactions marked from the one at which the running sum crosses the threshold"
    - topic: "surplus for fixed pattern"
      decision: "occurrence amount minus accepted amount, when positive"
    - topic: "privacy commitments"
      decision: "source CSV not retained after import; account deletion removes all data; transaction data never leaves the product"
    - topic: "target scale"
      decision: "large (up to 10k) as aspiration; MVP serves the author, open registration stays; rule is per-account so scale does not change it"
    - topic: "non-goals"
      decision: "brainstorming list adopted verbatim; threshold versioning added per FR-013 resolution"
    - topic: "ING export format (day-one gate, 2026-09-18)"
      decision: "verified on a real 12-month export: cp1250, ';', 20-line preamble with explicit date range, stable key (Nr transakcji, Konto); details in import-formats.md"
    - topic: "multiple accounts in one ING file"
      decision: "import one account chosen at import time (default: most transactions); other accounts' rows skipped"
    - topic: "credits and refunds"
      decision: "import debits only (amount < 0); credits and refunds skipped — accepted overstatement"
    - topic: "payment operators (PayPro/PayU/Cashbill/Autopay)"
      decision: "merchant = domain at the end of ING 'Tytuł'; operator is not the merchant; Allegro stays opaque"
    - topic: "Santander (second bank; previously called Erste)"
      decision: "PLN CSV verified; enters MVP only after the ING flow works, if time remains"
    - topic: "fixed-pattern amount tolerance"
      decision: "15% of median OR ±10 PLN, whichever is larger — calibrated on real data"
    - topic: "previous period for new fixed patterns"
      decision: "previous calendar month"
    - topic: "import date range for FR-005"
      decision: "from file header when present (ING preamble; Santander start + export date), otherwise min–max of transaction dates"
    - topic: "transfers between own banks"
      decision: "nothing in the parser; durable exclusion via FR-009; trap goes into the seed"
    - topic: "business account as source"
      decision: "persona unchanged — personal spending lives on that account; effect is the account filter + FR-009 exclusion of tax/ZUS"
  frs_drafted: 14
  quality_check_status: accepted
---

# Shape notes — Rytm

## Seed idea (verbatim)

Aplikacja webowa dla jednej osoby, która wgrywa CSV z wyciągu bankowego (ING Bank Śląski, tylko PLN) i chce zobaczyć, gdzie cicho ucieka pieniądz. Aplikacja normalizuje opisy transakcji do sprzedawcy i wykrywa dwa typy wzorców: stałe (sprzedawca + podobna kwota) i częste (sam sprzedawca). Użytkownik ustawia próg na wzorcu, a reguła oznacza nadwyżkę jako zbędną i sumuje ją miesięcznie; dla wzorców stałych pokazuje zmiany kwoty i nowe wzorce. Zaakceptowane zmiany po kontroli: dwa typy wzorców od razu, syntetyczny zestaw CSV jako artefakt pierwszego tygodnia, prawdziwe wyciągi zostają lokalnie. Poza zakresem: API banków, kategorie i budżety, wiele walut, rozbijanie transakcji z pośredników (PayPal, Allegro, BLIK), OCR, alerty, AI. Nierozstrzygnięte: obsługa Erste (zależna od formatu eksportu), dokładna tolerancja kwoty dla wzorców stałych, zakres historii potrzebny, by trend miesięczny miał sens.

> 2026-09-18: wszystkie trzy rozstrzygnięte na prawdziwych eksportach — patrz Open Questions i `import-formats.md`. „Erste” okazało się Santander Bank Polska.

## Vision & Problem Statement

**Pain.** Pieniądze cicho uciekają z konta. Bank (ING Bank Śląski, konto w PLN) kategoryzuje transakcje, ale nie odpowiada na dwa pytania: „które wydatki były zbędne?” i „co się powtarza i cicho rośnie?”. Moment bólu: koniec miesiąca — spojrzenie na saldo i poczucie, że coś ucieka, bez konkretnej odpowiedzi co. Koszt dziś: eksport CSV/PDF i ręczna analiza w arkuszu, która jest męką i w praktyce się nie dzieje; kategoryzacja banku nie budzi zaufania i nie daje odpowiedzi.

Rodzaj problemu: dane uwięzione w wyciągu (informacja jest w CSV, ale bez narzędzia niedostępna), paraliż decyzyjny (saldo bez odpowiedzi „co przestać robić”), brak zaufania do istniejącego narzędzia (kategorie banku odpowiadają na inne pytanie).

**Insight.** „Zbędne” to nadwyżka powtórzeń ponad własny próg, nie kategoria. Kawa nie jest zbędna; piąta kawa w tygodniu jest. Kategorie i budżety liczą sumy per kategoria — nie widzą częstotliwości względem progu, który użytkownik sam ustawia na konkretnym wzorcu (sprzedawcy). Stąd dwa typy wzorców: **stały** (sprzedawca + podobna kwota — subskrypcje, opłaty, raty; interesuje zmiana kwoty i nowe wzorce) i **częsty** (sam sprzedawca niezależnie od kwoty — Wolt, kawa; interesuje liczba wystąpień lub suma w miesiącu).

## User & Persona

Jeden nazwany użytkownik: autor projektu. Osoba z kontem w ING Bank Śląski (PLN), która sama kontroluje swoje wydatki, nie ufa kategoryzacji banku i sięga po narzędzie pod koniec miesiąca (lub po pobraniu nowego wyciągu), żeby zobaczyć, gdzie ucieka pieniądz i co przestać robić. Wszystkie decyzje projektowe pierwszej wersji są pod ten jeden wyciąg i te nawyki; nie ma persony drugorzędnej.

## Access Control

Logowanie (email + hasło / OAuth / passwordless — mechanizm do wyboru po PRD). Aplikacja ma publiczny URL, a dane (wyciągi, wzorce, progi) są prywatne — niezalogowany użytkownik nie widzi niczego poza ekranem logowania.

Model płaski, wielokontowy: każde konto jest właścicielem wyłącznie własnych importów, wzorców i progów. Brak ról (admin/member), brak zaproszeń, brak współdzielenia danych między kontami. Najmniejszy model dostępu, który czyni MVP użytecznym: jedno konto autora; wiele kont to izolacja danych, nie druga persona.

## MVP flow (first session, click by click)

1. Użytkownik loguje się.
2. Wgrywa plik CSV z ING (jeden plik).
3. Widzi listę wykrytych wzorców: sprzedawca, typ (stały / częsty), liczba wystąpień, suma, dla stałych — kwota.
4. Na wybranym wzorcu ustawia próg (częsty: liczba wystąpień lub suma w miesiącu; stały: akceptowana kwota).
5. Widzi nadwyżkę ponad próg oznaczoną jako „ponad próg” i sumę „ponad progiem w tym miesiącu” (nazwy zmienione w rundzie Sokratesa, FR-011; wcześniej „zbędne” / „spalone”).
6. Dla wzorców stałych widzi, które podrożały i które są nowe.

## Timeline budget

- `mvp_weeks: 6`
- Pierwszy przepływ (kroki 2–3: CSV → lista wzorców) szacowany na 4–6 wieczorów; pozostałe kroki, login, zarządzanie wzorcami/importami i testy dopełniają 6 tygodni.

## Timeline acknowledgment

Acknowledged on 2026-09-16: 6-week MVP requires sustained dedication; user accepted. Scope-down options were shown (only frequent patterns in v1; no price-change view; single account) and rejected — the full 6-step flow stays.

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

## Functional Requirements

### Konto
- FR-001: Użytkownik może założyć konto i zalogować się. Priority: must-have
  > Socrates: Counter-arguments considered: "single user — full registration is cost without value; a config-file password would do" and "login forces server-side data; a local model avoids the privacy problem". Resolution: kept as written — public URL + private data makes login necessary.
- FR-002: Zalogowany użytkownik widzi wyłącznie własne importy, wzorce i progi. Priority: must-have
  > Socrates: Counter-arguments considered: "isolation without a second user is an untestable promise" and "multi-account complicates the demo seed". Resolution: kept as written — isolation is the natural consequence of login.

### Import
- FR-003: Użytkownik może wgrać plik CSV z ING Bank Śląski (PLN) i zobaczyć wynik importu (liczba transakcji, zakres dat). Priority: must-have
  > Socrates: Counter-arguments considered: "ING format unverified — day-one gate not yet done (cp1250, multi-line headers)" and "one bank is a single point of failure". Resolution: kept as written — one external dependency is a deliberate choice.
- FR-004: Użytkownik może zobaczyć listę importów i cofnąć błędny import, usuwając go wraz z jego transakcjami. Priority: must-have
  > Socrates: Counter-argument considered: "deleting an import is CRUD for reviewers, not for the user". Resolution: kept as must-have, reframed as "undo a wrong import" (wrong file / wrong range) — a real need, not a checklist item.
- FR-005: Import, którego zakres dat zachodzi na istniejący import, jest odrzucany z komunikatem; nie ma deduplikacji transakcji. Priority: must-have
  > Socrates: Counter-argument considered: "ING may not give a stable transaction ID — dedup by date+amount+description is fragile (two identical coffees the same day collapse into one)". Resolution: FR rewritten — overlapping ranges are rejected instead of deduplicated; the no-duplicates guardrail is satisfied by construction.
  > Verified 2026-09-18: ING has a stable key `(Nr transakcji, Konto)`; Santander has none — the rejection rule is right for both. Import range comes from the file header when present (see `import-formats.md`, D7). The import covers one account (chosen at import time) and debits only (D1, D2).

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
- FR-012: Dla wzorców stałych aplikacja pokazuje, które zmieniły kwotę (każda zmiana względem ostatniego wystąpienia, niezależnie od tolerancji) i które są nowe względem poprzedniego okresu. Priority: must-have
  > Socrates: Counter-arguments considered: "'previous period' is undefined with one import" and "a price rise inside the tolerance is invisible — tolerance and 'got pricier' conflict". Resolution: FR rewritten — tolerance is used only to detect the fixed pattern; any amount change vs the last occurrence is reported.
  > Resolved 2026-09-18: "previous period" = previous calendar month (D6). Tolerance = 15% of median OR ±10 PLN, whichever is larger (D5).
- FR-013: Użytkownik widzi sumę „ponad progiem” per miesiąc dla wszystkich miesięcy obecnych w danych (trend), liczoną według dzisiejszych progów. Priority: must-have
  > Socrates: Counter-arguments considered: "today's thresholds applied retroactively — the trend is an artefact of the threshold, not of behaviour" and "a partial current month deflates the last point". Resolution: accepted simplification — the threshold means "how I judge today"; threshold versioning goes to Non-Goals.

### Dane demo
- FR-014: Publiczna instancja działa na syntetycznym zestawie CSV (seed), bez prawdziwych wyciągów; seed zawiera realistyczne pułapki: warianty opisów tego samego sprzedawcy, pośredników (PayPal/Allegro/BLIK), subskrypcję z podwyżką, nowy wzorzec. Priority: must-have
  > Socrates: Counter-arguments considered: "a synthetic set won't reproduce the dirt of real descriptions — pretty demo, broken product" and "seed is work that isn't a feature". Resolution: FR extended — the seed must carry realistic traps, built from the shapes (not the data) of the real statement.

### Dropped in the Socratic round
- FR-015 (rename merchant) — merged into FR-009 as must-have.
- FR-016 (multi-file import) — removed: ING gives one export per chosen range; returns to Open Questions only if the export range turns out to be short.
- FR-017 (opaque-intermediary flag) — removed: intermediaries are half the statement; excluding them makes the monthly sum falsely low. They count as ordinary merchants ("Allegro 8×" is a frequent-pattern signal); exclusion via FR-009 remains a user option; splitting them into components stays a non-goal.
  > Amended 2026-09-18: in the ING export, BLIK payments through payment operators (PayPro/PayU/Cashbill/Autopay) carry the real merchant's domain at the end of `Tytuł`. Normalisation (FR-006) uses that domain as the merchant, so operators do not appear as patterns (D3 in `import-formats.md`). Allegro remains opaque and is handled as before.

## User Stories

### US-01: Użytkownik znajduje wydatki ponad próg w wyciągu z ING

- **Given** zalogowany użytkownik bez importów
- **When** wgrywa CSV z ING za 3 miesiące, na wzorcu częstym „Wolt” ustawia próg 4/miesiąc, a na wzorcu stałym „Netflix” akceptowaną kwotę 43 zł
- **Then** widzi listę wzorców (stałe/częste, liczba, suma), 5.–n-te zamówienie Wolt w każdym miesiącu oznaczone „ponad próg”, sumę „ponad progiem w tym miesiącu”, a Netflix — jeśli zmienił kwotę — na liście zmian kwoty

#### Acceptance Criteria
- Wzorzec częsty bez progu nie generuje transakcji „ponad próg”.
- Suma „ponad progiem” = suma kwot transakcji oznaczonych „ponad próg” w danym miesiącu.
- Ten sam CSV + te same progi dają identyczny wynik; ponowny import tego samego zakresu jest odrzucony (brak duplikatów).

## Business Logic

Każda transakcja jest przypisana do dokładnie jednego wzorca sprzedawcy (stałego albo częstego), a to, co w miesiącu przekracza próg ustawiony przez użytkownika na tym wzorcu, jest oznaczone „ponad próg” i zsumowane.

**Wejścia** (widoczne dla użytkownika): plik CSV z ING Bank Śląski (PLN); progi ustawione per wzorzec — dla wzorca częstego liczba wystąpień na miesiąc albo suma na miesiąc, dla wzorca stałego akceptowana kwota; trwałe decyzje użytkownika o wzorcach (scalenie, wykluczenie, zmiana typu, zmiana nazwy). Opis transakcji jest normalizowany do sprzedawcy; sprzedawca, którego kwoty mieszczą się w tolerancji, jest proponowany jako wzorzec stały, pozostali jako częsty; użytkownik może zmienić typ. Wykluczony wzorzec nie bierze udziału w regule.

**Wynik**: lista wzorców (sprzedawca, typ, liczba wystąpień, suma, kwota dla stałych) z podglądem transakcji; transakcje „ponad próg” i suma „ponad progiem w tym miesiącu” per miesiąc (trend, według dzisiejszych progów); dla wzorców stałych — każda zmiana kwoty względem ostatniego wystąpienia (niezależnie od tolerancji) i wzorce nowe względem poprzedniego okresu. Nadwyżka jest liczona tak: próg liczbowy — chronologicznie od (próg+1)-szej transakcji w miesiącu; próg kwotowy — suma miesiąca minus próg, oznaczone są transakcje od tej, przy której suma narastająco przekracza próg; wzorzec stały — kwota wystąpienia minus akceptowana kwota, gdy dodatnia. Wzorzec bez progu nie generuje nic „ponad próg”.

**Gdzie użytkownik spotyka regułę**: po imporcie widzi listę wzorców; ustawia próg na wzorcu i natychmiast widzi, które transakcje i jaka kwota są ponad progiem w bieżącym miesiącu oraz jak wygląda ta suma w poprzednich miesiącach. Reguła jest deterministyczna — ten sam CSV i te same progi dają ten sam wynik.

## Non-Functional Requirements

- Prywatność danych źródłowych: prawdziwe wyciągi nie trafiają do repozytorium ani do publicznej instancji; publiczny URL działa wyłącznie na syntetycznym zestawie.
- Retencja: oryginalny plik CSV nie jest przechowywany po zakończeniu importu — pozostają wyłącznie sparsowane transakcje.
- Prawo do usunięcia: usunięcie konta usuwa wszystkie dane użytkownika bez śladu w magazynie operatora.
- Dane transakcji nie opuszczają produktu — żadna usługa trzecia nie otrzymuje treści transakcji do analizy.
- Determinizm: ten sam plik CSV i te same progi dają identyczną listę wzorców i identyczne sumy przy każdym uruchomieniu.
- Czas od wgrania CSV do listy wzorców liczony w sekundach, nie minutach, dla wyciągu obejmującego kilka–kilkanaście miesięcy; przy dłuższym przetwarzaniu użytkownik widzi ciągły postęp.
- Urządzenia: pełna użyteczność na desktopie w aktualnych wersjach głównych przeglądarek; podstawowe widoki (lista wzorców, suma miesięczna) używalne na telefonie.
- Dostępność: best-effort, bez SLA — narzędzie osobiste używane raz w miesiącu.

## Product framing

- `product_type: web-app`
- `target_scale.users: large` (do 10 tys.) — **aspiracja po MVP**; MVP jest dla autora, ale otwarta rejestracja zostaje. Sokrates (100× skali): reguła jest per konto i per wyciąg, nic nie jest liczone między kontami — skala to koszt hostingu, nie zmiana reguły. `qps: low`, `data_volume: small` (tysiące transakcji per konto).
- `timeline_budget`: `mvp_weeks: 6`, `hard_deadline: 2026-11-04`, `after_hours_only: true`

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

## Open Questions

Closed 2026-09-18 after analysing real exports (details and decisions D1–D9 in `context/foundation/import-formats.md`):

1. ~~**Format eksportu ING**~~ — **closed.** cp1250, `;`, 20-line preamble with explicit date range and account list, stable key `(Nr transakcji, Konto)`, one export = 12 months. Gate passed.
2. ~~**Obsługa Erste**~~ — **closed.** The second bank is Santander Bank Polska (not Erste); it exports a PLN CSV. Enters MVP only after the ING flow works, if time remains (D4).
3. ~~**Tolerancja kwoty dla wzorców stałych**~~ — **closed.** 15% of median OR ±10 PLN, whichever is larger (D5).
4. ~~**Zakres historii**~~ — **closed.** One ING export holds 12 months; the trend works from the first import; FR-016 does not return.
5. ~~**Definicja „poprzedniego okresu”**~~ — **closed.** Previous calendar month (D6).
6. **Wybór mechanizmu logowania** (email+hasło / OAuth / passwordless) — decyzja po wyborze stacku.
7. **Lista operatorów płatności** dla ekstrakcji sprzedawcy z `Tytuł` (D3) — start: PayPro, PayU, Cashbill, Autopay, ING Pay; rozszerzana w miarę importów. Owner: user.

## Forward: tech-stack

Informacyjne, poza schematem PRD — do przejęcia przez wybór stacku:
- Znajomość: 10 lat full stack JS (Node, React), wdrożenia na Heroku i Vercel, bazy danych relacyjne.
- Brainstorming wskazywał „Vercel + Postgres” jako naturalne dopasowanie — to preferencja z doświadczenia, nie decyzja.
- Syntetyczny zestaw CSV jako artefakt pierwszego tygodnia: testy, demo, seed publicznej instancji.

## Forward: technical-roadmap

- Pierwszy kamień milowy (z oceny pomysłu): CSV z ING → lista wzorców z liczbą wystąpień i sumą — odsłania największą niewiadomą (jakość grupowania na prawdziwych danych).
- Test z perspektywy użytkownika: „wgrywam CSV, ustawiam próg, widzę nadwyżkę” (US-01) na syntetycznym zestawie.
- Plan B (tylko jeśli bramka formatu ING wypadnie źle): „Karencja zakupowa” — sekcja 4a pliku brainstormingu.

## Quality cross-check

Run 2026-09-16 — all six greenfield items present (Access Control, Business Logic one-sentence rule, project artifacts, timeline-cost acknowledgment, Non-Goals; preserved behavior n/a). Status: accepted. Noted, not a gap: `target_scale: large` is an aspiration while the primary persona is a single user — nothing in the MVP is built for scale.
