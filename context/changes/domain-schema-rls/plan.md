# Domain schema RLS (F-01) Implementation Plan

## Overview

Pierwsza migracja domenowa Rytmu: tabele `imports` i `transactions` należące do konta, z RLS per operację i per rolę, kaskadą z `auth.users` (FR-019) i regułą FR-005 („import, którego zakres dat zachodzi na istniejący import tego samego rachunku, jest odrzucany”) wymuszaną przez bazę. Izolację kont (FR-002), kaskadę i odrzucanie zakresów udowadniają testy pgTAP uruchamiane w CI. Klient Supabase dostaje wygenerowane typy, a migracja trafia na hostowaną bazę przez `db push`. Roadmapa F-01; odblokowuje S-01 (import ING).

## Current State Analysis

- Jedyna migracja to `supabase/migrations/20260921120000_delete_own_account.sql`: funkcja `security definer` kasująca wiersz `auth.users` wołającego (`:10-22`), z komentarzem, że przyszłe tabele domenowe z `on delete cascade` usuną resztę (`:3-4`). Execute tylko dla `authenticated` (`:27-28`).
- Reguła migracji w `CLAUDE.md:6`: RLS na każdej nowej tabeli z politykami per operację i per rolę; każda tabela z danymi użytkownika ma `user_id` FK do `auth.users(id)` `on delete cascade` (F3, 2026-09-23).
- Rejestr migracji na hostowanej bazie istnieje (`npx supabase migration list` pokazuje `20260921120000` lokalnie i zdalnie), projekt jest `supabase link`-owany na maszynie właściciela — `db push` zastosuje tylko nowy plik (`context/deployment/deploy-plan.md:55`).
- Lokalna baza ma `pgtap` 1.3.3 i `btree_gist` 1.7 (`pg_available_extensions`); `auth.uid()` czyta `request.jwt.claim.sub` albo `request.jwt.claims ->> 'sub'`, więc testy mogą symulować zalogowanego użytkownika przez `set_config('request.jwt.claims', …)` + `set local role authenticated`. `supabase test db` jest wbudowane w CLI.
- CI (`.github/workflows/ci.yml:30-60`, job `smoke`): `supabase start` bez studio/storage/realtime itd. stosuje migracje z folderu, potem `astro dev` + `npm run smoke`. Brak kroku testów bazy.
- Kształt danych wejściowych: `context/foundation/import-formats.md` — ING: jeden rachunek na import (D1), tylko obciążenia (D2), klucz `(Nr transakcji, Konto)` (kol. 7 + kol. 14), zakres z preambuły `Zakres dat` (D7), preambuła mapuje nazwę rachunku na numer („Wybrane rachunki:”), kwota `-116,85`. Santander (po D4) nie ma ID transakcji.
- `src/lib/supabase.ts:5-20` tworzy `createServerClient` bez generyka typów bazy; `src/types.ts` nie istnieje; brak `src/db/`.
- `supabase/seed.sql` tworzy tylko konto testowe `11111111-1111-4111-8111-111111111111` (auth-only do czasu danych syntetycznych — F-02/S-09).
- `context/foundation/lessons.md` nie istnieje.

## Desired End State

- `supabase/migrations/<ts>_domain_imports_transactions.sql` tworzy `public.imports` i `public.transactions` z RLS, kaskadą, ograniczeniem wykluczenia zakresów per rachunek i częściowym unikalnym kluczem transakcji; zastosowana lokalnie, w CI i na hostowanej bazie.
- `npx supabase test db` przechodzi lokalnie i w CI (nowy krok joba `smoke`), dowodząc: konto B nie widzi, nie wstawia pod cudze `user_id`, nie kasuje wierszy konta A; `anon` nie widzi nic; `update` jest zabroniony; `delete_own_account()` kasuje wszystkie importy i transakcje wołającego i nic cudzego; nakładający się zakres tego samego rachunku jest odrzucony, innego rachunku przyjęty; duplikat klucza transakcji odrzucony.
- `src/db/database.types.ts` wygenerowany z lokalnej bazy; `createClient` zwraca klienta typowanego `Database`; `src/types.ts` eksportuje aliasy wierszy `ImportRow` / `TransactionRow`.
- `CLAUDE.md` opisuje `npx supabase test db` i generowanie typów; roadmapa F-01 mówi „importy i transakcje” (wzorce → S-03).

### Key Discoveries:

- Tożsamość rachunku do reguły FR-005 = **numer** rachunku z preambuły, nie nazwa z kolumny `Konto` (`import-formats.md:80`) — nazwę można zmienić w bankowości i wtedy nakładający się import tego samego rachunku by przeszedł. Nazwa jest przechowywana wyłącznie do wyświetlania.
- Zakresy są domknięte obustronnie: import 01.01–31.03 i import 31.03–30.06 tego samego rachunku to konflikt (`daterange(start, end, '[]')`).
- Ograniczenie wykluczenia z `=` na `uuid`/`text` wymaga `btree_gist`; na Supabase rozszerzenia trzymamy w schemacie `extensions` (tam jest już `pgcrypto` — `supabase/seed.sql:21`).
- `delete_own_account()` działa jako właściciel funkcji, więc w teście pgTAP da się wywołać ją pod symulowanym JWT i sprawdzić kaskadę od końca do końca (FR-019), zamiast kasować `auth.users` ręcznie.

## What We're NOT Doing

- Tabele sprzedawców/wzorców (S-03), progów (S-04) i trwałych decyzji (S-05) — każdy wycinek dodaje własną migrację według tej samej reguły RLS + kaskady.
- Atomowy zapis importu z transakcjami (RPC/transakcja) i jakikolwiek endpoint lub UI importu — S-01, gdzie zapada decyzja o przepływie uploadu.
- Polityki `update` na `imports` i `transactions` — to niezmienne fakty; korekta = usunięcie importu (S-02) i ponowny import.
- Sprawdzenie w bazie, że data transakcji mieści się w zakresie importu (wymagałoby triggera) — walidacja parsera w S-01.
- Przechowywanie numeru rachunku kontrahenta, nazwy banku, kolumn blokad/walut i pełnego wiersza CSV (minimalizacja danych; NFR retencji).
- Dane domenowe w `supabase/seed.sql` (F-02 / S-09).
- Obsługa Santandera poza tym, że `bank_tx_id` jest opcjonalne (FR-018 poza kamieniem milowym).
- Kontrola dryfu wygenerowanych typów w CI.

## Implementation Approach

Najpierw kontrakt bazy i jego dowód (Faza 1), bo to jedyna część, której pomyłka kosztuje migrację naprawczą na produkcji; potem powierzchnia TypeScript i dokumentacja (Faza 2), na końcu ręczny `db push` i weryfikacja na hostowanej bazie (Faza 3). Izolacja jest egzekwowana wyłącznie przez RLS — aplikacja nie filtruje po `user_id` jako zabezpieczenia, tylko jako zapytanie.

## Critical Implementation Details

- **Kolejność względem produkcji**: `npx supabase db push` (krok człowieka) musi przejść **przed** pushem na `main` zmiany, która zależy od tabel (`CLAUDE.md`). Ta zmiana sama nie używa tabel w aplikacji, ale typy i testy zakładają ich istnienie — Faza 3 wykonuje `db push` przed pushem commitów faz 1–2.
- **Spójność właściciela**: `transactions` ma własne `user_id` (reguła F3) _oraz_ złożony FK `(import_id, user_id) → imports(id, user_id)`, który wymaga `unique (id, user_id)` na `imports`. Bez złożonego FK klient z RLS mógłby wstawić transakcję z własnym `user_id` pod cudzy import (polityka `insert` sprawdza tylko `user_id`).

## Phase 1: Schemat i testy izolacji

### Overview

Migracja z dwiema tabelami, RLS, kaskadą i regułą FR-005 w bazie; testy pgTAP dowodzące izolacji, kaskady i ograniczeń; krok `supabase test db` w CI.

### Changes Required:

#### 1. Migracja domenowa

**File**: `supabase/migrations/<YYYYMMDDHHmmss>_domain_imports_transactions.sql` (nowy; format nazwy z `CLAUDE.md:6`)

**Intent**: Utworzyć warstwę danych dla S-01/S-02: import jednego rachunku z zakresem dat i jego obciążenia, należące do konta i kasowane z kontem. Nagłówek pliku w stylu istniejącej migracji wyjaśnia FR-002/FR-005/FR-019 i dlaczego nie ma polityk `update`.

**Contract**:

- `create extension if not exists btree_gist with schema extensions;`
- `public.imports`:
  - `id uuid primary key default gen_random_uuid()`
  - `user_id uuid not null default auth.uid() references auth.users(id) on delete cascade`
  - `source text not null check (source in ('ing'))`
  - `account_number text not null` (numer rachunku z preambuły, znormalizowany: bez spacji), `account_name text not null`
  - `period_start date not null`, `period_end date not null`, `check (period_end >= period_start)`
  - `created_at timestamptz not null default now()`
  - `unique (id, user_id)` (cel złożonego FK)
  - `constraint imports_no_overlap exclude using gist (user_id with =, account_number with =, daterange(period_start, period_end, '[]') with &&)` — FR-005 per rachunek; nazwa constraintu jest kontraktem dla S-01 (mapuje błąd `23P01` na komunikat „nakładający się zakres”)
- `public.transactions`:
  - `id bigint generated always as identity primary key`
  - `user_id uuid not null default auth.uid() references auth.users(id) on delete cascade`
  - `import_id uuid not null`, `foreign key (import_id, user_id) references public.imports(id, user_id) on delete cascade`
  - `account_number text not null` (kopia z importu, potrzebna do unikalności klucza)
  - `occurred_on date not null` (ING `Data transakcji`)
  - `amount_minor bigint not null check (amount_minor > 0)` — obciążenie w groszach jako liczba dodatnia (`-116,85` → `11685`)
  - `bank_tx_id text` (ING `Nr transakcji` po zdjęciu `'` i spacji; `null` dla banków bez ID)
  - `counterparty text not null` (ING `Dane kontrahenta`), `title text not null default ''` (ING `Tytuł`), `details text` (ING `Szczegóły`)
  - `created_at timestamptz not null default now()`
  - `unique index transactions_bank_tx_key on (user_id, account_number, bank_tx_id) where bank_tx_id is not null`
  - indeksy `(import_id)` i `(user_id, occurred_on)`
- RLS: `enable row level security` na obu tabelach. Dla roli `authenticated` osobne polityki `select`, `insert`, `delete`, każda z warunkiem `(select auth.uid()) = user_id` (`using` / `with check`). Brak polityk `update` i brak polityk dla `anon` (domyślnie zabronione). `revoke all on public.imports, public.transactions from anon;` jako druga warstwa.
- `comment on table` dla obu tabel (FR/decyzja w jednym zdaniu).

#### 2. Testy pgTAP

**File**: `supabase/tests/database/domain_rls.test.sql` (nowy)

**Intent**: Dowód FR-002, FR-005, FR-019 na poziomie bazy, uruchamiany przez `npx supabase test db`, który kolejne wycinki rozszerzają o swoje tabele.

**Contract**: plik w transakcji z `rollback` na końcu (`begin; select plan(N); … select * from finish(); rollback;`), `create extension if not exists pgtap with schema extensions`. Setup jako `postgres`: dwóch użytkowników w `auth.users` (stałe UUID, inne niż seed), po jednym imporcie i transakcji na koncie A. Symulacja sesji: `set local role authenticated` + `set_config('request.jwt.claims', '{"sub":"<uuid>","role":"authenticated"}', true)`; `anon` przez `set local role anon`. Przypadki (każdy jako asercja pgTAP):

- RLS włączone na obu tabelach (`pg_class.relrowsecurity`).
- Konto B: `select` z obu tabel zwraca 0 wierszy konta A; `insert` importu z `user_id` A → błąd; `insert` transakcji pod import A z `user_id` B → błąd (złożony FK); `delete` wierszy A → 0 usuniętych.
- Konto A: widzi swoje wiersze; `update` na obu tabelach → 0 wierszy/błąd (brak polityki).
- `anon`: `select` z obu tabel → błąd uprawnień.
- FR-005: drugi import A tego samego `account_number` z zakresem stykającym się jednym dniem → `throws_ok` z SQLSTATE `23P01`; import innego `account_number` w tym samym zakresie → `lives_ok`.
- Duplikat `(account_number, bank_tx_id)` na koncie A → `23505`; dwie transakcje z `bank_tx_id null` → `lives_ok`.
- `amount_minor <= 0` → `23514`.
- FR-019: jako konto A `select public.delete_own_account()`, potem jako `postgres`: 0 importów i transakcji A, dane B nietknięte.

#### 3. Krok testów bazy w CI

**File**: `.github/workflows/ci.yml` (job `smoke`)

**Intent**: Regresja RLS lub kaskady zatrzymuje deploy tak samo jak czerwony smoke.

**Contract**: nowy krok `supabase test db` zaraz po „Start local Supabase”, przed buildem i smoke. Wykluczone usługi (`-x …`) zostają bez zmian — testy potrzebują tylko bazy.

### Success Criteria:

#### Automated Verification:

- `npx supabase db reset` stosuje obie migracje i seed bez błędów
- `npx supabase test db` przechodzi (wszystkie asercje pgTAP)
- `npm run smoke` 41/41 PASS (bez regresji auth/usunięcia konta)
- `npm run lint` i `npx astro check` przechodzą

#### Manual Verification:

- Przegląd SQL migracji: każda tabela ma `user_id` z kaskadą, RLS włączone, polityki `select`/`insert`/`delete` tylko dla `authenticated`, brak `update`
- W Studio (`:54323`) widać obie tabele z RLS „enabled” i ograniczenie `imports_no_overlap`

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 2: Typowany klient i dokumentacja

### Overview

Kod aplikacji widzi nowe tabele z typami; dokumentacja i roadmapa odpowiadają temu, co faktycznie powstało.

### Changes Required:

#### 1. Wygenerowane typy bazy

**File**: `src/db/database.types.ts` (nowy, generowany)

**Intent**: Jedno źródło typów wierszy dla S-01+, zamiast ręcznych interfejsów.

**Contract**: wynik `npx supabase gen types typescript --local --schema public`; plik nie jest edytowany ręcznie (komentarz w nagłówku, jeśli generator go nie dodaje — dopisany przez skrypt, nie ręcznie). Skrypt `db:types` w `package.json` z tym poleceniem przekierowanym do pliku.

#### 2. Typowany klient

**File**: `src/lib/supabase.ts`

**Intent**: `createClient` i klient bezstanowy używają generyka `Database`, więc `supabase.from("imports")` jest typowane.

**Contract**: `createServerClient<Database>(…)` w obu fabrykach; sygnatury eksportów bez zmian.

#### 3. Aliasy encji

**File**: `src/types.ts` (nowy)

**Intent**: Konwencja z `CLAUDE.md` („Shared types go in `src/types.ts`”).

**Contract**: `export type ImportRow = Tables<"imports">` i `TransactionRow = Tables<"transactions">` (helper `Tables` z wygenerowanego pliku).

#### 4. Dokumentacja i roadmapa

**File**: `CLAUDE.md`, `context/foundation/roadmap.md`

**Intent**: Agenci i człowiek wiedzą, jak uruchomić testy bazy i odświeżyć typy; roadmapa nie obiecuje w F-01 wzorców.

**Contract**:

- `CLAUDE.md` `## Commands`: `npx supabase test db` (pgTAP w `supabase/tests/database/`, CI job `smoke`) i `npm run db:types` (po każdej migracji). W `### Environment` przy migracjach: nowa tabela = nowy plik testu lub rozszerzenie `domain_rls.test.sql`.
- `roadmap.md` F-01 `Outcome`: „tabele importów i transakcji” zamiast „importów, transakcji i wzorców sprzedawców”; S-03 `Risk` lub `Outcome` bez zmian merytorycznych poza dopiskiem, że S-03 dodaje własną migrację tabeli sprzedawców/wzorców.

### Success Criteria:

#### Automated Verification:

- `npm run db:types` odtwarza `src/db/database.types.ts` bez różnic w `git diff`
- `npm run lint`, `npx astro check` i `npm run build` przechodzą
- `npm run smoke` 41/41 PASS

#### Manual Verification:

- `CLAUDE.md` i roadmapa opisują stan po zmianie (przegląd treści)

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 3: Wdrożenie na hostowaną bazę

### Overview

Migracja trafia na produkcję przez rejestr migracji, potem commity faz 1–2 idą na `main` i przechodzą CI z nowym krokiem testów bazy.

### Changes Required:

#### 1. `db push` (krok człowieka)

**File**: — (operacja na hostowanej bazie)

**Intent**: Zastosować migrację na produkcji przed pushem kodu, który ją zakłada (`CLAUDE.md`).

**Contract**: `npx supabase db push` na zlinkowanym projekcie `psqbtvooufapkatpkxlw`; potem `npx supabase migration list` pokazuje nowy plik lokalnie i zdalnie.

#### 2. Weryfikacja na produkcji i inwentarz

**File**: `context/deployment/deploy-plan.md`

**Intent**: Stan wdrożenia zapisany tam, gdzie reszta inwentarza.

**Contract**: wpis z datą: nazwa migracji, `db push` wykonany, wynik zapytania weryfikacyjnego o `relrowsecurity` i `pg_policies` dla obu tabel, SHA deployu. Testów pgTAP **nie** uruchamiamy na produkcji (`test db --linked`) — wstawiają użytkowników do `auth.users`, nawet jeśli w transakcji wycofywanej na końcu.

### Success Criteria:

#### Automated Verification:

- GitHub Actions `ci` → `smoke` (z krokiem `supabase test db`) → `deploy` zielone na `main`

#### Manual Verification:

- `npx supabase migration list` pokazuje nową migrację po obu stronach
- Na hostowanej bazie obie tabele mają RLS włączone i polityki `select`/`insert`/`delete` dla `authenticated` (Studio lub zapytanie do `pg_policies`)
- Produkcyjny `/settings` → usunięcie jednorazowego konta nadal kończy się `/login?deleted=1` (kaskada nie blokuje `delete_own_account`)
- `deploy-plan.md` opisuje stan po wdrożeniu

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Testing Strategy

### Unit Tests:

- Brak — zmiana nie dodaje logiki TS.

### Integration Tests:

- pgTAP `supabase/tests/database/domain_rls.test.sql`: izolacja dwóch kont na obu tabelach i czterech operacjach, `anon`, FR-005 per rachunek z granicą jednodniową, unikalność klucza ING, dodatnia kwota, kaskada przez `delete_own_account()`.
- `npm run smoke`: regresja auth i usunięcia konta (bez nowych kroków).

### Manual Testing Steps:

1. `npx supabase db reset` → Studio: tabele, RLS, constraint `imports_no_overlap`.
2. Na produkcji: `migration list`, `pg_policies`, cykl usunięcia jednorazowego konta.

## Performance Considerations

Tysiące transakcji na konto (PRD `data_volume: small`). Indeks `(user_id, occurred_on)` obsługuje zapytania miesięczne S-03/S-04/S-07; `(import_id)` przyspiesza kaskadę przy usuwaniu importu (S-02). Polityki używają `(select auth.uid())`, żeby Postgres liczył uid raz na zapytanie.

## Migration Notes

Tabele są nowe i puste na produkcji — brak migracji danych. Wycofanie przed pojawieniem się danych: nowa migracja `drop table public.transactions, public.imports;` (bez ręcznych zmian na hostowanej bazie poza rejestrem).

## References

- Roadmapa: `context/foundation/roadmap.md` (F-01, S-01..S-05)
- PRD: `context/foundation/prd.md` (FR-002, FR-005, FR-019, Access Control)
- Kształt danych: `context/foundation/import-formats.md` (D1, D2, D3, D7; kolumny ING)
- Wzorzec migracji: `supabase/migrations/20260921120000_delete_own_account.sql`
- Poprzednia zmiana: `context/archive/2026-09-21-settings-account/` (F3 z przeglądu → reguła kaskady)

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Schemat i testy izolacji

#### Automated

- [x] 1.1 `npx supabase db reset` stosuje obie migracje i seed bez błędów — 10929f3
- [x] 1.2 `npx supabase test db` przechodzi (wszystkie asercje pgTAP) — 10929f3
- [x] 1.3 `npm run smoke` 41/41 PASS (bez regresji auth/usunięcia konta) — 10929f3
- [x] 1.4 `npm run lint` i `npx astro check` przechodzą — 10929f3

#### Manual

- [x] 1.5 Przegląd SQL migracji: user_id z kaskadą, RLS, polityki select/insert/delete tylko dla authenticated, brak update — 10929f3
- [x] 1.6 Studio pokazuje obie tabele z RLS enabled i constraint `imports_no_overlap` — 10929f3

### Phase 2: Typowany klient i dokumentacja

#### Automated

- [x] 2.1 `npm run db:types` odtwarza `src/db/database.types.ts` bez różnic — d8ad8bb
- [x] 2.2 `npm run lint`, `npx astro check` i `npm run build` przechodzą — d8ad8bb
- [x] 2.3 `npm run smoke` 41/41 PASS — d8ad8bb

#### Manual

- [x] 2.4 `CLAUDE.md` i roadmapa opisują stan po zmianie — d8ad8bb

### Phase 3: Wdrożenie na hostowaną bazę

#### Automated

- [x] 3.1 GitHub Actions `ci` → `smoke` (z `supabase test db`) → `deploy` zielone na `main` — 80f3873

#### Manual

- [x] 3.2 `npx supabase migration list` pokazuje nową migrację po obu stronach — 80f3873
- [x] 3.3 Hostowana baza: RLS i polityki select/insert/delete dla authenticated na obu tabelach — 80f3873
- [x] 3.4 Produkcyjne usunięcie jednorazowego konta nadal kończy się `/login?deleted=1` — 80f3873
- [x] 3.5 `deploy-plan.md` opisuje stan po wdrożeniu — 80f3873
