---
date: 2026-09-24T21:58:11+0200
researcher: Claude (Opus 5.5) z vince307
git_commit: 2f07c1a
branch: main
repository: Rytm
topic: "S-01 ing-csv-import — co istnieje, czego brakuje i jakie decyzje czekają na plan importu CSV z ING"
tags: [research, import, csv, ing, supabase, rls, design-kit, fixture]
status: complete
last_updated: 2026-09-24
last_updated_by: Claude (Opus 5.5)
---

# Research: S-01 ing-csv-import

**Date**: 2026-09-24T21:58:11+0200
**Researcher**: Claude (Opus 5.5) z vince307
**Git Commit**: 2f07c1a (drzewo robocze: nieśledzony tylko `context/changes/ing-csv-import/`)
**Branch**: main
**Repository**: Rytm

## Research Question

Co baza kodu, fundamenty F-01/F-02 i kit projektowy dają wycinkowi S-01 („wgrać CSV z ING, wybrać jeden rachunek, tylko obciążenia, zobaczyć wynik; nakładający się zakres odrzucony; użytkownik widzi tylko własne importy” — `context/foundation/roadmap.md:112`), czego brakuje i jakie wybory musi rozstrzygnąć `/10x-plan`.

## Summary

- **Warstwa danych jest gotowa, brakuje zapisu atomowego.** Tabele `imports` i `transactions` z RLS, kaskadą i wykluczeniem nakładających się zakresów istnieją (`supabase/migrations/20260923165530_domain_imports_transactions.sql:15-94`). Nie istnieje żadna funkcja SQL zapisująca import razem z transakcjami — F-01 świadomie zostawił to S-01 (`context/archive/2026-09-23-domain-schema-rls/plan.md:36`).
- **Odrzucanie nakładania działa w bazie, ale per rachunek, nie per użytkownik.** `imports_no_overlap` porównuje `(user_id, account_number, daterange '[]')` (`…domain_imports_transactions.sql:28-32`); PRD FR-005 mówi tylko „istniejący import” (`context/foundation/prd.md:138`). To jedyna rozbieżność kontraktu do potwierdzenia.
- **Parsera w `src/` nie ma**, ale istnieje referencyjny czytnik dialektu ING w `scripts/fixture-ing-check.mjs:52-286` i wyrocznia `test/fixtures/ing/expected.json` (dla pliku głównego: 206 obciążeń importowanych, 6 497 147 groszy). Test runnera w repo nie ma — wybór należy do S-01 (`context/archive/2026-09-24-synthetic-ing-fixture/plan.md:40,267`).
- **UI istnieje tylko jako statyczny krok 1** (`src/pages/imports/new.astro:1-33`, przycisk `disabled`); brak stron `/imports/new/account`, `/imports/new/summary`, `/imports/result`. Kit definiuje wszystkie cztery ekrany (`design/rytm-os/prototype/app.js:57-63`), ale krok 3 w prototypie ma **tylko stan błędu nakładania — bez przycisku potwierdzenia importu** (`app.js:61`), a większość copy kroków 2–3 i wyniku nie ma kluczy w `content.json`.
- **Otwarte decyzje dla planu:** zakres wykluczenia (per rachunek vs per użytkownik), gdzie parsować i jak przenieść stan między krokami 1–3, luka przycisku „Importuj” w kroku 3, komunikat dla braku nagłówka, test runner, limity wielkości/czasu.

## Detailed Findings

### 1. Warstwa danych (F-01)

- `imports` (`supabase/migrations/20260923165530_domain_imports_transactions.sql:15-33`): `id uuid`, `user_id default auth.uid()` → `auth.users on delete cascade`, `source check in ('ing')`, `account_number` (numer z preambuły, bez spacji), `account_name`, `period_start`, `period_end`, `check (period_end >= period_start)` (:25), wykluczenie `imports_no_overlap` na gist z `btree_gist` w schemacie `extensions` (:13, :28-32). Zakres zamknięty `'[]'` — wspólny jeden dzień to konflikt.
- `transactions` (:38-56): `occurred_on date`, `amount_minor bigint check (> 0)` — obciążenie zapisywane jako dodatnia wartość w groszach, `bank_tx_id text` nullable, `counterparty`, `title default ''`, `details` nullable, `account_number` kopiowany z importu. Migracja uzupełniająca `20260924122144_transactions_import_account_fk.sql:10-22` zastąpiła FK kompozytowym `(import_id, user_id, account_number) → imports` z kaskadą i odebrała `update` rolom `authenticated` (:11-14, :16-20, :22).
- Indeksy: częściowy unikat `(user_id, account_number, bank_tx_id) where bank_tx_id is not null` (:61-63) — siatka bezpieczeństwa, nie deduplikacja (PRD FR-005: „nie ma deduplikacji transakcji”, `prd.md:138`); `(import_id)`, `(user_id, occurred_on)` (:65-66).
- RLS (:69-94): osobne polityki select/insert/delete dla `authenticated` z `(select auth.uid()) = user_id`; brak polityk update; `anon` bez uprawnień (:96).
- **Wyścig:** wykluczenie jest sprawdzane przy insercie pod blokadą indeksu, więc dwa równoległe importy tego samego rachunku i zakresu nie mogą oba przejść; przegrany dostaje SQLSTATE `23P01`. Sprawdzenie aplikacyjne przed zapisem służy tylko ładniejszemu komunikatowi w kroku 3.
- **Brak zapisu atomowego.** Jedyna funkcja SQL to `delete_own_account()` (`supabase/migrations/20260921120000_delete_own_account.sql:10-28`): `plpgsql security definer set search_path = ''`, strażnik `auth.uid() is null`, `revoke … from public, anon; grant … to authenticated`, wywołanie `supabase.rpc(...)` w `src/pages/api/auth/delete.ts:43`. supabase-js nie ma transakcji wielu zapytań, więc „odrzucony import nie zmienia listy importów” (`prd.md` US-02 AC) wymaga albo RPC, albo kompensującego usunięcia importu (kaskada sprząta transakcje, ale to nie jest atomowe). Wniosek (nie zapisany w repo): RPC `security invoker` przyjmujący pola importu + `jsonb` transakcji zachowuje RLS i domyślne `user_id`, w odróżnieniu od wzorca `definer`.
- Typy: `src/db/database.types.ts:8-97` (generowany; nowe RPC wymaga `npm run db:types`), `src/types.ts:1-4` ma tylko `ImportRow`, `TransactionRow`. Klient: `src/lib/supabase.ts:6-22` (anon key + sesja z ciasteczek → RLS działa; zwraca `null` bez env). Katalog `src/lib/services/` nie istnieje; w sprawdzonym `src/` nic nie odczytuje ani nie zapisuje `imports`/`transactions`.
- pgTAP: `supabase/tests/database/domain_rls.test.sql` (`plan(28)`, :10) pokrywa m.in. izolację między kontami (:41-73), nakładanie o jeden dzień → `23P01` i inny rachunek → OK (:92-102), duplikat `bank_tx_id` → `23505` (:105-109), `amount 0` → `23514` (:124-128). Nie pokrywa: nowego RPC (atomowość, granty, anon), `period_end < period_start`, `source`.
- `supabase/config.toml:18` `max_rows = 1000` ogranicza **odczyty** PostgREST (istotne dla list transakcji w S-02/S-03), nie inserty.

### 2. Format i fixture (F-02)

- Kontrakt parsera: `context/foundation/import-formats.md` — reguły ING 1–8 (sekcja „Reguły importu ING”), wykrywanie formatu (sekcja „Wykrywanie formatu”), decyzje D1 (jeden rachunek, domyślnie z największą liczbą wierszy), D2 (tylko kwoty < 0), D3 (operatorzy płatności → domena z końcówki Tytułu), D7 (zakres z preambuły).
- Pliki w `test/fixtures/ing/` (cp1250, bez BOM, LF, `;`; generowane przez `scripts/fixture-ing.mjs`, README.md:3):
  - główny `Lista_transakcji_nr_0000123456_010926.csv`: 234 wiersze danych, 2 rachunki (`Rachunek Firmowy Główny` 222 wiersze, `Rachunek VAT` 12), zakres 2025-09-01 – 2026-08-31; wg `expected.json`: rachunek domyślny = główny, 206 obciążeń importowanych o sumie 6 497 147 groszy, pominięte: 16 uznań + 12 wierszy innego rachunku;
  - `…-overlap.csv` (ten sam numer rachunku, 2026-08-01 – 2026-09-30) — odrzucony tylko po wcześniejszym imporcie pliku głównego;
  - `…-no-header.csv` (brak wiersza `"Data transakcji"`) i `…-currency.csv` (jeden wiersz `EUR`) — każdy łamie dokładnie jeden warunek.
- Pułapki T01–T19 opisane w `test/fixtures/ing/README.md:55-75`; dla parsera S-01 kluczowe: T19 (niepodwojony `"` w `Dane kontrahenta`, linie 81, 148, 214), T06/T07 (para ± tego samego `Nr transakcji` na dwóch rachunkach), T13/T17 (uznania pomijane), T04/T05 (operator płatności).
- Referencyjny czytnik do przeniesienia lub zgodności: `scripts/fixture-ing-check.mjs` — `decodeCp1250` (:52, `TextDecoder('windows-1250')`), `parseLine` (:64-90, łagodny dialekt: `"` zamyka pole tylko przed `;`/końcem linii), `toMinor` (:92), wyszukanie nagłówka (:163), rachunki z preambuły (:123-135), `Zakres dat`/`Liczba transakcji` (:139-149), `bankTxId` (:214), domyślny rachunek (:259-260), powody pominięcia (:286), warunki odrzucenia (:352-365). Plik jest `.mjs` poza `src/`, niekonsumowany przez aplikację.
- Bramka CI: `.github/workflows/ci.yml:21` `npm run fixture:check` (w zadaniu `ci`, po lincie). Test runnera brak — `package.json` nie ma vitest/jest ani skryptu `node --test`; `test/` zawiera tylko `fixtures/`.
- Zależności: brak bibliotek CSV/iconv w `package.json`. Node 22.14.0 (`.nvmrc`) z pełnym ICU dekoduje `windows-1250` (zweryfikowane lokalnie przez agenta); przeglądarkowy `TextDecoder` też obsługuje windows-1250 (standard WHATWG Encoding) — parsowanie po stronie klienta jest technicznie możliwe. Pełnego ICU w runtime Vercel nie zweryfikowano (oczekiwane dla oficjalnych buildów Node ≥ 13; do potwierdzenia preview deployem).

### 3. Kit projektowy i obecne strony

- Trasy kitu (`design/rytm-os/react-kit/docs/routes.md`): `/imports`, `/imports/new`, `/imports/new/account`, `/imports/new/summary`, `/imports/result`. Układy w `design/rytm-os/prototype/app.js`: lista (:56), krok 1 + stan „plik wybrany” (:57, :59), krok 2 wybór rachunku (:60), krok 3 podsumowanie (:61), wynik (:63).
- **Krok 3 (`app.js:61`) renderuje wyłącznie stan nakładania:** siatka podsumowania (Rachunek / Zakres dat / Obciążenia do importu / Pominięte wpływy / zwroty), alert błędu i akcje „Wybierz inny plik” / „Wróć do importów”. Przycisk „Importuj 64 obciążenia” usunięto razem z K8 (`context/foundation/design-kit.md:92`), a stanu „zakres wolny → potwierdź” kit nie dostarczył. To jest luka projektowa, nie decyzja produktowa.
- Ekran wyniku (`app.js:63`) pokazuje liczbę wzorców („znaleźliśmy 12 wzorców”, statystyki transakcje / wzorców / koszty stałe) — wzorców nie ma przed S-03, więc S-01 nie ma skąd wziąć tych liczb.
- Copy w `design/rytm-os/react-kit/docs/content.json`: `importFlow.*` (:232-241), `importErrors.overlap|unknownFormat|wrongCurrency|empty|chooseOther|back` (:323-329), `emptyViews.imports.*` (:317-321). Uwagi: `importFlow.overlap` (:240) to nieaktualne zdanie o deduplikacji sprzeczne z K8/K10 (`design-kit.md:92,94`); `importErrors.overlap` (:324) ma zaszyte daty „1 marca – 31 maja 2026” — wymaga interpolacji zakresu; **brak** klucza dla braku wiersza nagłówka (tylko `unknownFormat`). `copyExtra.imports` w `src/content/copy.ts:64-74` ma eyebrow/tytuł/lead/`dropTitle`/`choose`/`newImport`.
- Copy renderowane przez prototyp, ale bez klucza w `content.json` ani `copyExtra` (wg przeglądu agenta): „rozpoznano format ING” (krok 1), cały krok 2 (eyebrow, h1 „Wybierz rachunek.”, lead, „wybrane”, „Wstecz”/„Dalej”, liczebniki „N transakcje”), eyebrow/h1/etykiety siatki kroku 3, eyebrow/zdanie/etykiety/CTA wyniku, nagłówki tabeli `/imports`. Reguła repo: takie copy idzie do `copyExtra` z komentarzem `DESIGN-GAP`, a brakujący element do rejestru luk — następne ID **G25**, konflikty **K16** (`design-kit.md:107,133`; ostatnie istniejące G24).
- Stan kodu: `src/pages/imports/index.astro:1-13` (tylko `ViewEmpty`), `src/pages/imports/new.astro:1-33` (statyczny krok 1, `Stepper current={1}`, przycisk nieaktywny — komentarz :13), `src/pages/patterns.astro:1-13` (pusty widok). Komponenty wielokrotnego użytku w `src/components/app/`: `Stepper`, `InlineAlert` (error z `role=alert`), `Panel`, `PageTitle`, `ViewEmpty`, `EmptyState`, `Icon` (ikony `upload`, `warning`, `success`, `arrow` — `copy.ts:138-158`). Brak komponentów: wybór rachunku, siatka podsumowania, statystyki wyniku, tabela importów. shadcn: tylko `src/components/ui/button.tsx` i `dialog.tsx`.

### 4. Wzorzec przepływów, trasy i ochrona

- Formularze auth to wyspy React opakowujące natywny `<form method="POST" action="/api/...">`, bez `fetch` (np. `src/components/auth/SignUpForm.tsx:50`); stan oczekiwania przez `useFormStatus` (`SubmitButton.tsx:28-31`). Endpointy: `prerender = false`, `formData()` + zod `safeParse`, błąd → `context.redirect("/strona?error=<kod>")` (`src/pages/api/auth/signup.ts:8-44`), mapowanie kodu na copy we frontmatterze strony (`src/pages/register.astro:7-9,36`, `settings.astro:17-24`).
- Stan między krokami w auth: httpOnly ciasteczko `rytm-pending-email` (`signup.ts:51-57`, stałe `src/lib/auth-rules.ts:9-11`). Ciasteczko (~4 KB) nie pomieści sparsowanych wierszy — przy przepływie serwerowym przez trasy 1→2→3 potrzebny jest staging albo ponowne przesłanie pliku; przy przepływie w jednej wyspie React stan żyje w pamięci przeglądarki.
- `src/middleware.ts:4,19-20`: ochrona po prefiksie obejmuje `/imports/new/*` i `/imports/result`, ale **nie** `/api/imports*` — endpoint musi sam sprawdzić `context.locals.user` lub `supabase.auth.getUser()` (wzorzec `src/pages/api/auth/password.ts:19-28`).

### 5. Ograniczenia niefunkcjonalne

- NFR retencji: „oryginalny plik CSV nie jest przechowywany po zakończeniu importu” (`prd.md:182`) — wyklucza trzymanie surowego pliku w Supabase Storage/tabeli poza czasem importu.
- NFR czasu: „sekundy, nie minuty” dla kilku–kilkunastu miesięcy (`prd.md:186`); niewiadoma roadmapy o budżecie czasu Vercela (`roadmap.md` S-01 Unknowns) — do zmierzenia na pliku głównym fixture (234 wiersze, 52 305 B).
- Vercel Hobby: 4,5 MB ciała żądania, 300 s maks. czasu (`context/foundation/infrastructure.md:34`); rejestr ryzyk zaleca walidację rozmiaru po stronie klienta z komunikatem (copy do rejestru luk) oraz limit wierszy i twardy budżet czasu w handlerze (`infrastructure.md:101,104`).

## Code References

- `supabase/migrations/20260923165530_domain_imports_transactions.sql:15-33` — tabela `imports`, `imports_no_overlap` (:28-32)
- `supabase/migrations/20260923165530_domain_imports_transactions.sql:38-66` — tabela `transactions` i indeksy
- `supabase/migrations/20260924122144_transactions_import_account_fk.sql:10-22` — FK kompozytowy, odebrany `update`
- `supabase/migrations/20260921120000_delete_own_account.sql:10-28` — jedyny wzorzec funkcji SQL/RPC
- `supabase/tests/database/domain_rls.test.sql:92-102` — test nakładania per rachunek
- `src/lib/supabase.ts:6-22` — klient SSR z RLS
- `src/middleware.ts:4,19-20` — `PROTECTED_ROUTES`, dopasowanie prefiksem
- `src/pages/api/auth/signup.ts:8-57`, `src/pages/api/auth/password.ts:19-28` — wzorzec endpointu (zod, redirect z kodem, auth w endpoincie)
- `src/pages/imports/new.astro:1-33`, `src/pages/imports/index.astro:1-13` — obecne strony
- `src/content/copy.ts:64-74` — `copyExtra.imports`
- `scripts/fixture-ing-check.mjs:52-365` — referencyjny czytnik i warunki odrzucenia
- `test/fixtures/ing/README.md:55-75`, `test/fixtures/ing/expected.json` — pułapki i wyrocznia
- `design/rytm-os/prototype/app.js:56-63` — układy ekranów importu
- `design/rytm-os/react-kit/docs/content.json:232-241,323-329` — copy importu i błędów

## Architecture Insights

- Baza jest ostatnią linią obrony dla FR-002 (RLS) i FR-005 (wykluczenie); aplikacja mapuje `23P01` na `importErrors.overlap`, a sprawdzenie w kroku 3 jest tylko UX.
- Transakcje są niezmienne (brak `update`), korekta = usuń import (S-02) + importuj ponownie.
- Jedna ścieżka zapisu danych domenowych: wyłącznie przez import (F-02 plan: brak wierszy domenowych w seedzie).
- Parser ma dwie niezależne wyrocznie: `import-formats.md` (reguły) i `expected.json` (liczby) — test parsera może porównać wynik z `expected.json.rows[]` bez prawdziwego wyciągu.

## Historical Context (from prior changes)

- `context/archive/2026-09-23-domain-schema-rls/plan.md:28` + `plan-brief.md:22` — wykluczenie **per rachunek** jest świadomą decyzją F-01 (D1 pozwala importować kilka rachunków z jednego pliku osobno). Werdykt: nadal obowiązuje w kodzie; nieuzgodnione z literą FR-005.
- `…domain-schema-rls/plan.md:36` — atomowy zapis, endpoint i UI odłożone do S-01. Werdykt: aktualne.
- `…domain-schema-rls/plan.md:38` — sprawdzenie, że data transakcji mieści się w zakresie importu, to walidacja parsera S-01 (bez triggera). Werdykt: aktualne.
- `…domain-schema-rls/plan.md:39` — nie przechowujemy numeru rachunku kontrahenta, nazwy banku, kolumn walut/blokad ani pełnego wiersza. Werdykt: aktualne.
- `…domain-schema-rls/plan-brief.md:62` — stabilność numeru rachunku z preambuły między eksportami do sprawdzenia w S-01 na prawdziwym pliku. Werdykt: otwarte.
- `context/archive/2026-09-24-synthetic-ing-fixture/plan-brief.md:65` — S-01 pisze parser i testy na `expected.json` bez prawdziwego wyciągu. `plan.md:40,267` — wybór test runnera należy do S-01. `plan.md:281` — pomiar czasu parsowania należy do S-01. `plan.md:296-306` — sekcja „Deviations” jest wiążąca wobec wcześniejszych bloków faz. Werdykt: aktualne.
- `context/foundation/design-kit.md:92,94` (K8, K10) — kit usunął przycisk importu przy nakładaniu i zdanie o deduplikacji; K11 (:95) copy spoza `content.json` → `copyExtra`, otwarte do rundy 3.

## Related Research

- Nie dotyczy: archiwalne zmiany F-01 i F-02 nie mają `research.md` (sprawdzone listingi `context/archive/2026-09-23-domain-schema-rls/` i `context/archive/2026-09-24-synthetic-ing-fixture/`).

## Open Questions

Decyzje dla `/10x-plan` (fakty wyżej; to są wybory, nie luki w dowodach):

1. **Zakres odrzucania nakładania:** zostawić per rachunek (stan bazy, decyzja F-01) czy zaostrzyć do per użytkownik (litera FR-005 — nowa migracja + zmiana testu `domain_rls.test.sql:98-102`)? Rekomendacja: per rachunek, doprecyzować FR-005 w PRD — inaczej użytkownik nie zaimportuje drugiego rachunku z tego samego pliku (D1).
2. **Gdzie parsować i jak nieść stan kroków 1→2→3:**
   (a) jedna wyspa React: parsowanie w przeglądarce (wspólny moduł parsera w `src/lib/`), kroki jako stan komponentu, do serwera trafiają tylko obciążenia wybranego rachunku jako JSON, serwer waliduje zod i woła RPC — plik nigdy nie opuszcza przeglądarki (NFR retencji z definicji), ciało żądania małe; kosztem jest odejście od tras `/imports/new/account|summary` z kitu (kroki w jednym URL-u) i zaufanie do danych klienta ograniczone do własnego konta (RLS).
   (b) parsowanie na serwerze z przesłaniem pliku raz i tymczasowym stagingiem (tabela z TTL) między trasami — zgodne z trasami kitu, ale wymaga sprzątania i zderza się z NFR retencji.
   (c) parsowanie na serwerze przy każdym kroku z ponownym przesłaniem pliku — bez stanu, ale plik wędruje trzy razy.
3. **Luka kroku 3:** stan „zakres wolny” nie ma w kicie przycisku potwierdzenia (`app.js:61`). Wymaga wiersza G25 + `DESIGN-GAP` i tymczasowego przycisku zgodnego z kitem (np. przywrócenie wzorca „Importuj N obciążeń” sprzed K8) — do potwierdzenia przez autora kitu.
4. **Ekran wyniku bez wzorców:** liczby wzorców/kosztów stałych nie istnieją przed S-03 — pokazać tylko transakcje i zakres (FR-003) i odnotować lukę/rozbieżność.
5. **Brak nagłówka `"Data transakcji"`:** zmapować na `importErrors.unknownFormat` czy dodać lukę na osobny komunikat?
6. **Test runner:** vitest vs `node --test` (bez zależności) — dla testów parsera na `expected.json`; CI dopina go obok `fixture:check`.
7. **Limity:** maksymalny rozmiar pliku (walidacja klienta poniżej 4,5 MB) i maks. liczba wierszy; copy komunikatu → rejestr luk.
8. **Walidacja spójności pliku:** czy odrzucać plik, gdy liczba wierszy danych ≠ `Liczba transakcji` z preambuły albo data transakcji wypada poza `Zakres dat` — i jakim komunikatem (kit nie ma klucza).

Luki w dowodach (nie blokują planu): pełne ICU w runtime Vercel (potwierdzić preview deployem); stabilność numeru rachunku między eksportami (prawdziwy plik, lokalnie).
