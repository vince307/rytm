# S-01 Import wyciągu ING — Plan Brief

> Full plan: `context/changes/ing-csv-import/plan.md`
> Research: `context/changes/ing-csv-import/research.md`

## What & Why

Użytkownik wgrywa CSV z ING, wybiera jeden rachunek, sprawdza podsumowanie i importuje jego obciążenia; nakładający się zakres tego samego rachunku jest odrzucany. To pierwszy pionowy wycinek domeny (US-01, FR-002, FR-003, FR-005) — bez niego nie ma danych dla wzorców (S-03) ani cofania importu (S-02).

## Starting Point

Tabele `imports`/`transactions` z RLS, kaskadą i wykluczeniem nakładania per rachunek już są (F-01), jest syntetyczny wyciąg z wyrocznią `expected.json` (F-02). Brakuje zapisu atomowego, parsera w `src/`, test runnera i UI poza statycznym krokiem 1.

## Desired End State

Na `/imports/new` plik jest parsowany w przeglądarce, kreator prowadzi przez kroki 1–3 kitu, a potwierdzenie zapisuje import atomowo i pokazuje `/imports/result`. `/imports` pokazuje własne importy (bez usuwania). Plik główny fixture daje 206 obciążeń / 6 497 147 gr; ponowny import tego zakresu jest odrzucony z datami istniejącego importu.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Zakres FR-005 | Nakładanie per rachunek (stan bazy), FR-005 doprecyzowane w PRD | Zgodne z D1 i decyzją F-01; drugi rachunek z pliku da się zaimportować | Research + Plan |
| Miejsce parsowania | W przeglądarce, jedna wyspa na `/imports/new`, do serwera tylko JSON obciążeń | Plik nigdy nie opuszcza przeglądarki (NFR retencji), brak stagingu i limitu 4,5 MB | Plan |
| Zapis | RPC `import_ing_statement`, `security invoker` | Atomowość („odrzucony import niczego nie zmienia”) przy zachowaniu RLS | Research + Plan |
| Wysyłka | Natywny form POST z ukrytym `payload`, redirect z `?error=` | Idiom repo (formularze auth), bez `fetch` | Plan |
| Nakładanie w kroku 3 | Zakresy istniejących importów renderowane serwerowo do propsów wyspy; baza (`23P01`) jako ostatnia linia | Blokujący stan kitu przed kliknięciem bez dodatkowego API | Plan |
| Luki kitu | G25 przycisk „Importuj N obciążeń”, G26 wynik bez statystyk wzorców, G27 komunikaty limitów, K16 zaszyta data | Przepływ działa end-to-end, luki jawne dla autora kitu | Plan |
| Niespójny plik | Każda niespójność struktury → „Nieznany format pliku” | Nigdy częściowy import; zero nowego copy | Plan |
| Testy parsera | Vitest (`getViteConfig`), `npm test` w CI | TS + alias `@/*` bez sztuczek, gotowe dla S-03 | Plan |
| Limity | 5 MB pliku (klient), 5000 obciążeń (zod + RPC) | ~10× ponad realne użycie, chroni RPC i CPU | Plan |
| Lista `/imports` | Tabela tylko do odczytu już w S-01 | Pusty stan po imporcie byłby fałszywy; usuwanie zostaje w S-02 | Plan |

## Scope

**In scope:** RPC + pgTAP; parser ING (`src/lib/import/`), schemat zod, formatowanie; Vitest + CI; `POST /api/imports`; `/imports/result`; lista `/imports` tylko do odczytu; kreator kroków 1–3; `Stepper` jako komponent React; copy w `copyExtra`; wiersze G25–G27, K16; nota FR-005 w PRD; kroki smoke.

**Out of scope:** usuwanie importu (S-02); sprzedawca/normalizacja/wzorce (S-03); Santander; staging i parsowanie serwerowe; osobne URL-e kroków 2–3; tabela `import_errors`; test screenshotowy w CI.

## Architecture / Approach

Przeglądarka: `File` → `parseIngStatement` (cp1250, reguły ING 1–8) → wybór rachunku → `buildImportPayload` → sprawdzenie nakładania na `existing` → form POST `payload`. Serwer: `/api/imports` (auth, zod) → `rpc("import_ing_statement")` → baza (RLS, wykluczenie, daty w zakresie) → redirect na wynik albo `?error=overlap&from&to|invalid|failed`.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. RPC zapisu atomowego | Funkcja SQL + pgTAP + typy + nota FR-005 | Uprawnienia `invoker` przy insert…returning pod RLS |
| 2. Parser ING i testy | `src/lib/import/`, `format.ts`, Vitest na fixture | Łagodny dialekt (T19) i zgodność z `expected.json` |
| 3. Endpoint, wynik, lista | `/api/imports`, `/imports/result`, lista, smoke | Mapowanie `23P01` na zakres istniejącego importu |
| 4. Kreator i luki kitu | Wyspa kroków 1–3, `Stepper.tsx`, copy, G25–G27/K16 | Wierność kitowi przy placeholderach luk |

**Prerequisites:** lokalny Supabase (`npx supabase start`), F-01 i F-02 zamknięte; przed merge'em `npx supabase db push` (człowiek).
**Estimated effort:** ~3–4 sesje w 4 fazach.

## Open Risks & Assumptions

- Serwer ufa parsowaniu klienta — tylko w obrębie własnego konta (RLS); zod i RPC pilnują kształtu, kwot i dat.
- Pełne ICU (`windows-1250`) jest w przeglądarkach z definicji standardu; w Node testów potwierdzone lokalnie.
- Stabilność numeru rachunku z preambuły między eksportami — do sprawdzenia na prawdziwym pliku lokalnie.
- Placeholdery G25/G26 mogą się zmienić po rundzie 3 kitu.

## Success Criteria (Summary)

- Użytkownik importuje prawdziwy i syntetyczny wyciąg ING w kilka sekund i widzi liczbę obciążeń oraz zakres.
- Ponowny import tego samego zakresu rachunku jest odrzucony z komunikatem, bez zmian w danych.
- Drugie konto nie widzi cudzych importów; `npm test`, `supabase test db` i smoke przechodzą w CI.
