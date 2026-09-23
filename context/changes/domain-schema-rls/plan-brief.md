# Domain schema RLS (F-01) — Plan Brief

> Full plan: `context/changes/domain-schema-rls/plan.md`

## What & Why

Rytm nie ma jeszcze żadnej tabeli domenowej, a 12 z 15 koniecznych FR stoi na warstwie danych. F-01 tworzy pierwszą migrację — importy i transakcje należące do konta — tak, żeby izolacja kont (FR-002), „usunięcie konta usuwa wszystkie dane” (FR-019) i „nakładający się import jest odrzucany” (FR-005) były gwarantowane przez bazę, a nie przez dyscyplinę kodu aplikacji. Odblokowuje S-01 (import ING).

## Starting Point

Jedyna migracja to `delete_own_account()` (S-08), która kasuje wiersz `auth.users` i liczy na przyszłe kaskady. `CLAUDE.md` od F3 wymaga `user_id` z `on delete cascade` na każdej tabeli z danymi użytkownika. Rejestr migracji na hostowanej bazie działa; w repo nie ma testów bazy, tylko HTTP-owy smoke.

## Desired End State

Tabele `imports` i `transactions` istnieją lokalnie, w CI i na produkcji, z RLS per operację dla `authenticated`, bez dostępu `anon`, z kaskadą z konta. Testy pgTAP w CI udowadniają, że drugie konto nie widzi ani nie zmienia cudzych danych, że `delete_own_account()` kasuje wszystko wołającego, i że nakładający się zakres tego samego rachunku jest odrzucony. Kod aplikacji ma typowanego klienta Supabase gotowego dla S-01.

## Key Decisions Made

| Decision             | Choice                                                                                                       | Why (1 sentence)                                                                                                              |
| -------------------- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| Zakres tabel         | Tylko `imports` + `transactions`                                                                             | Tabelę sprzedawców/wzorców projektuje S-03, gdy znana jest normalizacja — bez zgadywania klucza, który potem trzeba migrować. |
| Znaczenie FR-005     | Nakładanie **per rachunek bankowy**, zakresy domknięte                                                       | Duplikat jest możliwy tylko w obrębie rachunku (klucz ING `(Nr transakcji, Konto)`), a D1 pozwala importować wiele rachunków. |
| Tożsamość rachunku   | Numer z preambuły, nie nazwa                                                                                 | Nazwę rachunku można zmienić w bankowości — wtedy duplikat by przeszedł.                                                      |
| Przechowywane pola   | Data, kwota, klucz, rachunek, surowe `Dane kontrahenta`/`Tytuł`/`Szczegóły`; bez numeru rachunku kontrahenta | Normalizację (S-03) i listę operatorów (OQ2) da się przeliczyć bez ponownego importu, przy minimalizacji danych.              |
| Kwoty                | `amount_minor bigint` > 0 (grosze obciążenia)                                                                | Dokładne sumy w JS i SQL — wprost wspiera guardrail determinizmu.                                                             |
| Test izolacji        | pgTAP (`supabase test db`) jako krok CI                                                                      | Testuje dokładnie warstwę F-01 bez endpointów domenowych; kolejne wycinki dopisują swoje tabele.                              |
| Zmiany wierszy       | Brak polityk `update`                                                                                        | Import i transakcja to fakty; korekta = usunięcie importu (S-02) i ponowny import.                                            |
| Spójność właściciela | Złożony FK `(import_id, user_id)`                                                                            | Polityka `insert` sprawdza tylko `user_id` — bez złożonego FK dałoby się podpiąć transakcję pod cudzy import.                 |

## Scope

**In scope:**

- Migracja `imports` + `transactions` (RLS, kaskada, `imports_no_overlap`, unikalny klucz ING, dodatnia kwota)
- Testy pgTAP i krok `supabase test db` w CI
- Wygenerowane typy, `createServerClient<Database>`, `src/types.ts`, skrypt `db:types`
- `CLAUDE.md`, roadmapa F-01, `db push` i wpis w `deploy-plan.md`

**Out of scope:**

- Tabele wzorców, progów, decyzji (S-03, S-04, S-05)
- Atomowy zapis importu, endpointy i UI importu (S-01)
- Polityki `update`, trigger „data w zakresie importu”, seed domenowy, Santander, kontrola dryfu typów w CI

## Architecture / Approach

Izolacja mieszka w Postgresie: każda tabela ma `user_id` → `auth.users` z kaskadą i polityki `(select auth.uid()) = user_id`; FR-005 to ograniczenie wykluczenia `gist` na `(user_id, account_number, daterange)`, którego nazwę S-01 mapuje na komunikat dla użytkownika. Testy pgTAP symulują JWT dwóch kont i wywołują prawdziwe `delete_own_account()`. Aplikacja dostaje tylko typy — żadnej logiki domenowej w tej zmianie.

## Phases at a Glance

| Phase                             | What it delivers                                 | Key risk                                                                                              |
| --------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| 1. Schemat i testy izolacji       | Migracja + pgTAP + krok CI                       | Błąd w kluczach/ograniczeniach wyjdzie dopiero przy danych produkcyjnych — dlatego testy przed pushem |
| 2. Typowany klient i dokumentacja | Typy, klient `<Database>`, `CLAUDE.md`, roadmapa | Wygenerowany plik może łamać lint/astro check                                                         |
| 3. Wdrożenie na hostowaną bazę    | `db push`, weryfikacja polityk, zielony deploy   | `db push` to krok człowieka i musi poprzedzić push na `main`                                          |

**Prerequisites:** lokalna Supabase (Docker), `supabase link` na maszynie właściciela (jest), dostęp do `db push`.
**Estimated effort:** ~1–2 sesje w 3 fazach.

## Open Risks & Assumptions

- Zakłada, że numer rachunku z preambuły ING jest stabilny między eksportami (nazwa nie jest); weryfikowane w S-01 na prawdziwym pliku.
- Brak triggera „data transakcji w zakresie importu” — poprawność zależy od parsera S-01.
- Kolejne wycinki muszą pamiętać o rozszerzeniu testów pgTAP dla swoich tabel (zapisane w `CLAUDE.md`).

## Success Criteria (Summary)

- Drugie konto nie widzi ani nie zmienia cudzych importów i transakcji — udowodnione w CI przy każdym pushu.
- Usunięcie konta kasuje wszystkie jego importy i transakcje; nakładający się import tego samego rachunku jest odrzucony przez bazę.
- S-01 może zacząć od typowanego `supabase.from("imports")` na produkcji.
