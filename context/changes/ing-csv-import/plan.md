# S-01 Import wyciągu ING — plan implementacji

## Overview

Pierwszy pionowy wycinek domeny: użytkownik wgrywa plik CSV z ING, wybiera jeden rachunek, widzi podsumowanie (zakres, liczba obciążeń, pominięte wpływy), potwierdza i dostaje ekran wyniku z przejściem do wzorców. Plik jest parsowany w przeglądarce i nigdy nie trafia na serwer; do serwera idą wyłącznie obciążenia wybranego rachunku, zapisywane atomowo przez RPC. Nakładający się zakres dat tego samego rachunku jest odrzucany (FR-005), a użytkownik widzi tylko własne importy (FR-002).

## Current State Analysis

Źródło: `context/changes/ing-csv-import/research.md`.

- Warstwa danych gotowa: `imports`/`transactions` z RLS (select/insert/delete dla `authenticated`, bez update), kaskadą z `auth.users` i wykluczeniem `imports_no_overlap` na `(user_id, account_number, daterange '[]')` → SQLSTATE `23P01` (`supabase/migrations/20260923165530_domain_imports_transactions.sql:15-94`, `20260924122144_transactions_import_account_fk.sql:10-22`). Brak funkcji zapisującej import razem z transakcjami — odłożone do S-01 (`context/archive/2026-09-23-domain-schema-rls/plan.md:36`).
- Parsera w `src/` brak. Referencyjny czytnik dialektu ING (cp1250, łagodne cudzysłowy T19, preambuła, nagłówek szukany) jest w `scripts/fixture-ing-check.mjs:52-286`; wyrocznia liczb w `test/fixtures/ing/expected.json`. Test runnera brak.
- UI: tylko statyczny krok 1 (`src/pages/imports/new.astro`, przycisk `disabled`) i pusty stan `/imports`. Kit definiuje kroki 1–3, wynik i listę (`design/rytm-os/prototype/app.js:56-63`), ale krok 3 nie ma stanu „zakres wolny → potwierdź”, a ekran wyniku zakłada wzorce (S-03).
- Wzorzec interakcji: wyspa React z natywnym `<form method="POST">`, endpoint z zod i `context.redirect("…?error=<kod>")`, mapowanie kodu na copy w stronie (`src/pages/api/auth/delete.ts`, `src/components/settings/DeleteAccountDialog.tsx`).
- `src/middleware.ts:4,20` chroni `/imports/*`, ale nie `/api/imports` — endpoint sprawdza użytkownika sam.

## Desired End State

- `/imports/new`: wybór lub upuszczenie pliku → parsowanie w przeglądarce → błąd formatu inline albo krok 2 (wybór rachunku, domyślnie ten z największą liczbą wierszy) → krok 3 (rachunek, zakres z preambuły, liczba obciążeń, pominięte wpływy) z blokującym błędem nakładania albo przyciskiem „Importuj N obciążeń” → `/imports/result?id=…`.
- `/imports` pokazuje listę własnych importów tylko do odczytu (data importu, rachunek, zakres, liczba obciążeń).
- Import pliku głównego fixture na rachunek główny zapisuje 206 transakcji o sumie 6 497 147 groszy; ponowny import tego pliku albo pliku `-overlap` na ten sam rachunek jest odrzucony bez zmian w bazie; plik `-no-header` → „Nieznany format pliku”, plik `-currency` → „Waluta inna niż PLN”.
- Weryfikacja: `npm test` (parser vs `expected.json`), `npx supabase test db` (RPC), `npm run smoke` (endpoint), ręczny przegląd zrzutów stanów względem kitu.

### Key Discoveries:

- Wykluczenie w bazie jest jedyną gwarancją FR-005; sprawdzenie w kroku 3 to UX (`…domain_imports_transactions.sql:28-32`).
- Wzorzec RPC: `delete_own_account` (`supabase/migrations/20260921120000_delete_own_account.sql:10-28`) — tu `security invoker`, żeby działały RLS i domyślne `user_id = auth.uid()`.
- Kolejność kolumn, reguły cudzysłowów i warunki odrzucenia: `context/foundation/import-formats.md` (reguły ING 1–8) + `scripts/fixture-ing-check.mjs`.
- `Stepper` jest użyty wyłącznie w `src/pages/imports/new.astro`; `ServerError.tsx` jest już reactowym odpowiednikiem `InlineAlert` w wariancie błędu.
- `copy.components.error` = „Błąd — sprawdź plik CSV.” (`content.json:267`) — ogólny błąd z kitu.

## What We're NOT Doing

- Usuwanie importu i przycisk „Usuń import” na liście (S-02).
- Wyliczanie sprzedawcy (reguła 7 / D3, `rawMerchant`), normalizacja, wzorce i statystyki wzorców na ekranie wyniku (S-03). Zapisujemy surowe `counterparty`/`title`/`details`.
- Santander i wykrywanie jego formatu (FR-018).
- Zmiana wykluczenia na „per użytkownik” — zostaje per rachunek; FR-005 zostaje doprecyzowane w PRD.
- Parsowanie po stronie serwera, staging sparsowanych wierszy, przechowywanie pliku (NFR retencji).
- Tabela `import_errors` z rejestru ryzyk infrastruktury.
- Osobne kroki pod URL-ami `/imports/new/account` i `/imports/new/summary` — kroki 2–3 żyją w stanie wyspy na `/imports/new`; odświeżenie wraca do kroku 1.
- Ostrzeżenia „importuj mimo niespójności” — każdy niespójny plik jest odrzucany.
- Test screenshotowy w CI (repo go nie ma); bramka wizualna jest ręczna.

## Implementation Approach

Od bazy w górę: najpierw kontrakt zapisu (RPC + pgTAP), potem czysty parser z testami na fixture, potem endpoint i strony serwerowe (wynik, lista) sprawdzone smoke'iem, na końcu wyspa kreatora i luki kitu. Parser jest czystym modułem TS bez importów Node, używanym przez wyspę w przeglądarce i przez testy Vitest. Schemat zod payloadu jest wspólny dla klienta (budowa) i endpointu (walidacja). Baza jest ostatnią linią obrony: RLS (FR-002), wykluczenie (FR-005), `amount_minor > 0`, daty w zakresie importu (sprawdzane w RPC).

## Critical Implementation Details

**State sequencing** — endpoint po `23P01` nie zna kolidującego zakresu z samego błędu; zamiast parsować `error.details`, robi jeden odczyt `imports` tego rachunku z nakładającym się zakresem (RLS) i przekazuje `from`/`to` w przekierowaniu, żeby komunikat pokazał prawdziwe daty.

**User experience spec** — po przekierowaniu z błędem stan wyspy jest utracony; błąd z serwera (`?error=`) pokazuje się w kroku 1 jako alert nad strefą uploadu, z akcjami „Wybierz inny plik” / „Wróć do importów”.

## Faza 1: RPC zapisu atomowego

### Overview

Jedna funkcja SQL zapisuje import i jego transakcje w jednej transakcji; odrzucenie (nakładanie, data poza zakresem, pusty lub za duży zestaw) nie zostawia żadnych wierszy.

### Changes Required:

#### 1. Migracja RPC

**File**: `supabase/migrations/<YYYYMMDDHHmmss>_import_ing_statement.sql`

**Intent**: Dodać `public.import_ing_statement`, która wstawia wiersz `imports` (`source = 'ing'`) i wszystkie transakcje z `jsonb`, zwracając id importu. Działa jako wywołujący, więc RLS, domyślne `user_id` i wykluczenie obowiązują bez ręcznych sprawdzeń.

**Contract**: `import_ing_statement(p_account_number text, p_account_name text, p_period_start date, p_period_end date, p_transactions jsonb) returns uuid`, `language plpgsql security invoker set search_path = ''`. Elementy tablicy: `{occurred_on, amount_minor, bank_tx_id, counterparty, title, details}`. Przed insertami: `auth.uid()` niepuste; `jsonb_array_length` w 1..5000; każda `occurred_on` w `[p_period_start, p_period_end]` — inaczej `raise` z SQLSTATE `22023`. Błędy `23P01`/`23505`/`23514` przechodzą bez zmian. `comment on function`, `revoke execute … from public, anon`, `grant execute … to authenticated`. Nagłówek migracji opisuje FR-005 per rachunek i atomowość.

#### 2. Test pgTAP

**File**: `supabase/tests/database/import_rpc.test.sql`

**Intent**: Udowodnić atomowość i uprawnienia RPC.

**Contract**: przypadki — sukces zwraca uuid, a liczba transakcji = liczba elementów; drugi import nakładający się na ten sam rachunek → `23P01`, a liczba importów/transakcji bez zmian; import innego rachunku w tym samym zakresie → OK; transakcja z datą poza zakresem → `22023`, brak wiersza `imports`; pusta tablica → `22023`; `anon` → `42501`; import użytkownika A niewidoczny dla B.

#### 3. Typy i PRD

**File**: `src/db/database.types.ts` (generowany), `context/foundation/prd.md`

**Intent**: Wygenerować typy z nowym RPC (`npm run db:types`) i dopisać pod FR-005 notę, że nakładanie liczone jest per rachunek (numer z preambuły), zgodnie z D1 i F-01.

**Contract**: `Database["public"]["Functions"]["import_ing_statement"]`; nota `> Clarified 2026-09-24 (S-01): …` pod FR-005.

### Success Criteria:

#### Automated Verification:

- Migracja stosuje się na czystej bazie: `npx supabase db reset`
- Testy bazy przechodzą, w tym nowy plik: `npx supabase test db`
- Typy zawierają `import_ing_statement`: `npm run db:types && grep -q import_ing_statement src/db/database.types.ts`
- Lint przechodzi: `npm run lint`

#### Manual Verification:

- Nagłówek migracji i komentarz funkcji jasno opisują atomowość, granty i FR-005 per rachunek

**Implementation Note**: Po automatycznej weryfikacji zatrzymaj się na ręczne potwierdzenie przed kolejną fazą.

---

## Faza 2: Parser ING i testy jednostkowe

### Overview

Czysty moduł parsujący bajty pliku ING do struktury wyciągu i budujący payload importu, sprawdzony Vitestem na czterech plikach fixture względem `expected.json`.

### Changes Required:

#### 1. Parser

**File**: `src/lib/import/ing.ts`

**Intent**: Przenieść reguły ING 1–8 z `import-formats.md` (z czytnikiem z `scripts/fixture-ing-check.mjs` jako wzorcem dialektu) do modułu bez importów Node, działającego w przeglądarce i w testach.

**Contract**:
- `parseIngStatement(bytes: Uint8Array): { ok: true; statement: IngStatement } | { ok: false; error: "unknown-format" | "wrong-currency" }`.
- `IngStatement = { accounts: { name, number, rows, debits, credits }[]; defaultAccountNumber; period: { start, end }; rows: { account, occurredOn, amountMinor /* ze znakiem */, bankTxId, counterparty, title, details }[] }`.
- Dekodowanie `TextDecoder("windows-1250")`. `unknown-format`, gdy: pierwsza linia nie zaczyna się od `"Lista transakcji"`; brak `"Wybrane rachunki:"`, `"Zakres dat:"`/`"Liczba transakcji:"` albo wiersza `"Data transakcji"`; wiersz danych nie ma 21 pól albo ma nieparsowalną datę lub kwotę (`-?\d+,\d{2}`); `Konto` spoza preambuły; liczba wierszy ≠ `Liczba transakcji`; data poza `Zakres dat`. Dopiero przy poprawnej strukturze: `Waluta` ≠ `PLN` w dowolnym wierszu → `wrong-currency`.
- Pola: `bankTxId` bez `'` i białych znaków; `counterparty`/`title`/`details` przycięte na brzegach (wnętrze bez zmian, T19 zachowuje `"`). Domyślny rachunek = najwięcej wierszy (D1).
- `buildImportPayload(statement, accountNumber): ImportPayload` — tylko wiersze tego rachunku z `amountMinor < 0`, kwota jako wartość bezwzględna, kolejność z pliku.

#### 2. Wspólny schemat payloadu

**File**: `src/lib/import/schema.ts`

**Intent**: Jeden schemat zod dla budowy (klient) i walidacji (endpoint), z limitami z decyzji planu.

**Contract**: `importPayloadSchema` — `accountNumber` (`^\d{26}$`), `accountName` (1..200), `periodStart`/`periodEnd` (ISO date, start ≤ end), `transactions` (1..5000) z `occurredOn` w zakresie, `amountMinor` (int > 0), `bankTxId` (`^\d{18}$`), `counterparty`/`title`/`details` (string, max 500). Stałe `MAX_FILE_BYTES = 5 * 1024 * 1024`, `MAX_DEBITS = 5000`. Typ `ImportPayload = z.infer<…>`.

#### 3. Formatowanie

**File**: `src/lib/format.ts`

**Intent**: Polskie liczebniki i zakresy dat potrzebne w krokach 2–3, na wyniku i liście.

**Contract**: `plural(n, [one, few, many])` na `Intl.PluralRules("pl-PL")`; `formatRangeShort(start, end)` → `01.05–28.05.2026` (pełne daty `01.09.2025–31.08.2026`, gdy lata się różnią); `formatRangeLong(start, end)` → `1 marca – 31 maja 2026` (rok przy obu datach, gdy się różnią); `formatAccountTail(number)` → `•• 4821`.

#### 4. Vitest

**File**: `package.json`, `vitest.config.ts`, `test/unit/ing-parser.test.ts`, `test/unit/format.test.ts`, `.github/workflows/ci.yml`, `CLAUDE.md`

**Intent**: Dodać runner (devDependency `vitest`, konfiguracja przez `getViteConfig` z `astro/config`, żeby działał alias `@/*`), testy parsera na fixture i krok CI.

**Contract**: skrypt `"test": "vitest run"`; CI `ci` job: `- run: npm test` po `fixture:check`; `CLAUDE.md` → Commands: `npm test`. Testy parsera:
- plik główny: 2 rachunki, `defaultAccountNumber` = `11111100000000000000000001`, `period` 2025-09-01..2026-08-31; payload: 206 transakcji, suma 6 497 147; `occurredOn`/`bankTxId`/`|amountMinor|` zgodne z `expected.json.rows` (`imported: true`) w kolejności;
- wiersze T19 (linie 81, 148, 214): `counterparty` zawiera wewnętrzny `"`;
- rachunek VAT: payload zawiera tylko jego obciążenia (4);
- `-overlap` parsuje się poprawnie (odrzucenie jest w bazie);
- `-no-header` → `unknown-format`; `-currency` → `wrong-currency`;
- plik główny bez jednego wiersza danych → `unknown-format`; bajty UTF-8 / losowe → `unknown-format`;
- payload pliku głównego przechodzi `importPayloadSchema`.

### Success Criteria:

#### Automated Verification:

- Testy jednostkowe przechodzą: `npm test`
- Bramka fixture nadal przechodzi: `npm run fixture:check`
- Lint i typy przechodzą: `npm run lint && npx astro check`

#### Manual Verification:

- Parser nie importuje modułów Node (przegląd importów w `src/lib/import/ing.ts`)

**Implementation Note**: Po automatycznej weryfikacji zatrzymaj się na ręczne potwierdzenie przed kolejną fazą.

---

## Faza 3: Endpoint, wynik i lista importów

### Overview

Serwerowa ścieżka zapisu i odczytu: endpoint wołający RPC z mapowaniem błędów, strona wyniku i lista importów tylko do odczytu, sprawdzone smoke'iem.

### Changes Required:

#### 1. Endpoint importu

**File**: `src/pages/api/imports.ts`

**Intent**: Przyjąć formularz z polem `payload` (JSON), zweryfikować użytkownika i schemat, wywołać RPC i przekierować.

**Contract**: `export const prerender = false`; `POST`. Brak klienta lub użytkownika → `/login`. `JSON.parse` + `importPayloadSchema.safeParse` nieudane → `/imports/new?error=invalid`. RPC `23P01` → odczyt nakładającego się importu tego rachunku → `/imports/new?error=overlap&from=<start>&to=<end>`. Inny błąd → `console.error` (wzorzec z `delete.ts`) i `/imports/new?error=failed`. Sukces → `/imports/result?id=<uuid>`.

#### 2. Strona wyniku

**File**: `src/pages/imports/result.astro`

**Intent**: Pokazać wynik zapisanego importu (FR-003) z odczytu przez RLS; cudzy lub nieistniejący `id` → przekierowanie na `/imports`.

**Contract**: odczyt `imports` po `id` + `count` transakcji (`head: true`). Układ z `app.js:63` (`result-state`): ikona sukcesu, eyebrow „Import gotowy”, h1 „Dodaliśmy N obciążeń.”, lead z nazwą rachunku i `formatRangeLong`, jedna statystyka „transakcje”, CTA „Zobacz wzorce ↗” (`/patterns`) i „Przejdź do przeglądu” (`/home`). Statystyki wzorców i h1 `importFlow.result` pominięte — `DESIGN-GAP: G26`.

#### 3. Lista importów

**File**: `src/pages/imports/index.astro`

**Intent**: Gdy użytkownik ma importy, zamiast pustego stanu pokazać tabelę z `app.js:56` bez kolumny akcji; pusty stan bez zmian, gdy importów brak.

**Contract**: odczyt `imports` (RLS) + liczby transakcji per import, sortowanie po `created_at desc`. Nagłówek z `copyExtra.imports` (eyebrow/title/lead) i przyciskiem „+ Nowy import”. Kolumny: Data importu, Rachunek (`ING · <nazwa>`), Zakres dat (`formatRangeShort`), Obciążenia. Nagłówki kolumn → `copyExtra` (K11).

#### 4. Smoke

**File**: `scripts/smoke.mjs`, `CLAUDE.md`

**Intent**: Sprawdzić ścieżkę zapisu end-to-end na świeżo zarejestrowanym koncie lokalnym: import przyjęty, ten sam zakres odrzucony, niepoprawny payload odrzucony, anonim przekierowany.

**Contract**: nowe kroki po zalogowaniu (mały syntetyczny payload w kodzie skryptu, 2 transakcje): POST `/api/imports` → 302 na `/imports/result?id=`; GET tej strony → 200 z liczbą; ponowny POST → 302 z `error=overlap&from=`; POST `payload=not-json` → `error=invalid`; POST bez sesji → `/login`. `CLAUDE.md`: zaktualizować oczekiwaną liczbę kroków smoke („must be N/N PASS”).

### Success Criteria:

#### Automated Verification:

- Smoke przechodzi na lokalnej bazie: `npm run dev` + `npm run smoke`
- Lint, typy i build: `npm run lint && npx astro check && npm run build`
- Testy jednostkowe i bazy nadal przechodzą: `npm test && npx supabase test db`

#### Manual Verification:

- `/imports/result?id=<cudze id>` (drugie konto) przekierowuje na `/imports`
- `/imports` drugiego konta nie pokazuje importów pierwszego (FR-002)

**Implementation Note**: Po automatycznej weryfikacji zatrzymaj się na ręczne potwierdzenie przed kolejną fazą.

---

## Faza 4: Kreator importu i luki kitu

### Overview

Wyspa React prowadząca przez kroki 1–3 według kitu, z błędami formatu, wyborem rachunku, blokadą nakładania i potwierdzeniem; luki kitu zapisane w rejestrze.

### Changes Required:

#### 1. Stepper jako komponent współdzielony

**File**: `src/components/app/Stepper.tsx` (zamiast `Stepper.astro`)

**Intent**: Jeden stepper dla strony Astro i wyspy — przenieść markup 1:1 do React, usunąć wersję Astro.

**Contract**: `Stepper({ steps: readonly string[]; current: number })`, ten sam wygląd i `aria-current="step"`.

#### 2. Wyspa kreatora

**File**: `src/components/imports/ImportWizard.tsx`, `src/pages/imports/new.astro`

**Intent**: Strona renderuje zakresy istniejących importów użytkownika (RLS) i błąd z `?error=`, wyspa (`client:load`) prowadzi kroki na podstawie `parseIngStatement` i `buildImportPayload`.

**Contract**: props `{ labels, existing: { accountNumber, periodStart, periodEnd }[], serverError?: { kind: "overlap" | "invalid" | "failed"; from?; to? } }`.
- Krok 1 (`app.js:57,59`): strefa uploadu z `copyExtra.imports.dropTitle`, `importFlow.supported`, przycisk „Wybierz plik” (ukryty `<input type="file" accept=".csv">`) i upuszczanie pliku. Plik > `MAX_FILE_BYTES` → `unknownFormat` (G27). Po sukcesie wiersz „<nazwa pliku> · rozpoznano format ING” i „Dalej”. Błędy (`importErrors.unknownFormat|wrongCurrency|empty` — `empty`, gdy plik nie ma żadnych obciążeń) jako alerty z `import-errors` z przyciskiem `importErrors.chooseOther`. Błąd serwera: `overlap` → `importErrors.overlap` z interpolowanym zakresem, `invalid` → `unknownFormat`, `failed` → `copy.components.error`.
- Krok 2 (`app.js:60`): radio `.account-option` per rachunek (`<nazwa> · formatAccountTail`, „ING Bank Śląski · N transakcji”), domyślny zaznaczony z plakietką „wybrane”, „Wstecz” / „Dalej ↗”. Pokazywany zawsze, także przy jednym rachunku.
- Krok 3 (`app.js:61`): siatka Rachunek / Zakres dat / Obciążenia do importu / Pominięte wpływy / zwroty (uznania wybranego rachunku). Jeśli zakres nachodzi na `existing` tego rachunku → alert nakładania z linkiem do `/imports` i akcje „Wybierz inny plik” / „Wróć do importów”. Jeśli rachunek nie ma obciążeń → `importErrors.empty`. Jeśli > `MAX_DEBITS` → `unknownFormat` (G27). Inaczej `<form method="POST" action="/api/imports">` z ukrytym `payload` i przyciskiem „Importuj N obciążeń” (`DESIGN-GAP: G25`, stan oczekiwania przez `SubmitButton`).
- Alerty przez `ServerError` (lub jego rozszerzenie o slot akcji), kolory wyłącznie z tokenów repo.

#### 3. Copy

**File**: `src/content/copy.ts`

**Intent**: Dodać do `copyExtra.imports` teksty, które prototyp renderuje, a `content.json` nie ma (K11), oraz placeholdery luk z komentarzami `DESIGN-GAP`.

**Contract**: dosłownie z `app.js`: `formatRecognised` („rozpoznano format ING”), `next` („Dalej”), `back` kroku 2 („Wstecz”), `stepEyebrow` („Nowy import · krok {n} z 3”), `accountTitle` („Wybierz rachunek.”), `accountLead`, `selected` („wybrane”), `bankName` („ING Bank Śląski”), `summaryTitle` („Sprawdź przed importem.”), etykiety siatki, `overlapTail` („Wybierz inny plik albo wróć do importów.”), `resultEyebrow` („Import gotowy”), `toPatterns`, `toOverview`, nagłówki tabeli listy, formy liczebników „transakcja/transakcje/transakcji”. Placeholdery: `// DESIGN-GAP: G25` `confirm` („Importuj {n}”) + formy „obciążenie/obciążenia/obciążeń”; `// DESIGN-GAP: G26` h1 wyniku; `// DESIGN-GAP: K16` prefiks komunikatu nakładania do interpolacji (`importErrors.overlap` ma zaszytą datę).

#### 4. Rejestr luk

**File**: `context/foundation/design-kit.md`

**Intent**: Zapisać luki odkryte w S-01 dla autora kitu (runda 3).

**Contract**: wiersze `G25` (stan „zakres wolny” kroku 3 bez przycisku potwierdzenia — placeholder „Importuj N obciążeń”), `G26` (ekran wyniku przed istnieniem wzorców — bez statystyk wzorców, h1 zastępczy), `G27` (komunikaty: plik za duży / za dużo obciążeń / plik niespójny — tymczasowo `unknownFormat`), wszystkie `placeholder`; konflikt `K16` (`importErrors.overlap` z zaszytą datą, `importFlow.overlap` nieaktualne po K8/K10); pozycje w „Do rundy 3”.

### Success Criteria:

#### Automated Verification:

- Lint, typy i build: `npm run lint && npx astro check && npm run build`
- Testy jednostkowe, bazy i smoke nadal przechodzą: `npm test && npx supabase test db && npm run smoke`
- Luki są zarejestrowane: `grep -c "DESIGN-GAP: G2[5-7]\|DESIGN-GAP: K16" -r src` > 0 oraz wiersze G25–G27 i K16 w `context/foundation/design-kit.md`

#### Manual Verification:

- Pełny przepływ na pliku głównym fixture (rachunek główny): krok 1 → 2 → 3 → wynik „206”, lista pokazuje import z zakresem 01.09.2025–31.08.2026
- Plik `-overlap` na tym samym koncie → krok 3 pokazuje blokujący błąd z zakresem „1 września 2025 – 31 sierpnia 2026”, bez przycisku importu
- Pliki `-no-header` i `-currency` → właściwe alerty w kroku 1; „Wybierz inny plik” otwiera wybór pliku
- Rachunek VAT z pliku głównego importuje się osobno (4 obciążenia), mimo tego samego zakresu
- Bramka wizualna: zrzuty każdego stanu (krok 1: pusty, plik gotowy, 3 błędy formatu, błąd serwera; krok 2; krok 3: gotowy, nakładanie, brak obciążeń; wynik; lista) w 1280 px i 375 px porównane z prototypem kitu — bez poziomego przewijania, kolory tylko z tokenów
- Od wyboru pliku do kroku 2 i od potwierdzenia do wyniku mija ułamek sekundy do kilku sekund dla pliku głównego (NFR czasu)

**Implementation Note**: Po automatycznej weryfikacji zatrzymaj się na ręczne potwierdzenie; następnie `/10x-impl-review`.

---

## Testing Strategy

### Unit Tests:

- Parser na czterech plikach fixture względem `expected.json` (liczby, kolejność, klucze, T19, rachunek VAT, powody odrzucenia) oraz pliki uszkodzone (brak wiersza, zły encoding).
- Formatowanie: liczebniki dla 1, 2, 5, 12, 22, 206; zakresy w tym samym i różnych latach; końcówka numeru rachunku.
- Schemat payloadu: limit 5000, data poza zakresem, kwota ≤ 0, zły numer rachunku.

### Integration Tests:

- pgTAP: atomowość RPC, wykluczenie per rachunek, granty, izolacja kont.
- Smoke: endpoint z sesją i bez, sukces, nakładanie, zły payload, strona wyniku.

### Manual Testing Steps:

1. Zaloguj się kontem testowym, wejdź na `/imports/new`, wgraj plik główny fixture, przejdź kroki, potwierdź; sprawdź wynik i listę.
2. Wgraj ponownie plik główny i plik `-overlap` — krok 3 blokuje z zakresem istniejącego importu.
3. Wgraj plik główny, wybierz rachunek VAT, zaimportuj — lista pokazuje dwa importy.
4. Wgraj `-no-header`, `-currency` i dowolny plik > 5 MB — alerty w kroku 1.
5. Zaloguj się drugim kontem — `/imports` pusty, `/imports/result?id=<id z kroku 1>` przekierowuje.
6. Zrzuty wszystkich stanów w 1280 px i 375 px obok prototypu kitu.

## Performance Considerations

Parsowanie odbywa się w przeglądarce, więc budżet CPU Vercela obejmuje tylko walidację zod i jedno RPC. Plik główny (52 KB, 234 wiersze) jest ~100× poniżej limitu 5 MB; limit 5000 obciążeń ogranicza wielkość RPC i ciała żądania (~1 MB). Odczyt listy importów liczy transakcje per import — przy MVP kilka–kilkanaście importów, bez paginacji.

## Migration Notes

Nowa migracja dodaje tylko funkcję; tabele bez zmian. Produkcja: `npx supabase db push` (krok człowieka) **przed** merge'em zmiany, zgodnie z `CLAUDE.md`. Wycofanie: `drop function public.import_ing_statement` w kolejnej migracji; dane zapisane przez funkcję zostają poprawnymi wierszami.

## References

- Research: `context/changes/ing-csv-import/research.md`
- Kontrakt formatu: `context/foundation/import-formats.md` (reguły ING 1–8, D1, D2, D7)
- Wyrocznia: `test/fixtures/ing/expected.json`, `test/fixtures/ing/README.md`
- Czytnik referencyjny: `scripts/fixture-ing-check.mjs:52-286`
- Wzorzec RPC: `supabase/migrations/20260921120000_delete_own_account.sql:10-28`
- Wzorzec endpointu: `src/pages/api/auth/delete.ts`
- Kit: `design/rytm-os/prototype/app.js:56-63`, `design/rytm-os/react-kit/docs/content.json:232-241,323-329`
- F-01: `context/archive/2026-09-23-domain-schema-rls/plan.md:28-39`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: RPC zapisu atomowego

#### Automated

- [x] 1.1 Migracja stosuje się na czystej bazie: `npx supabase db reset` — 0025ea2
- [x] 1.2 Testy bazy przechodzą, w tym nowy plik: `npx supabase test db` — 0025ea2
- [x] 1.3 Typy zawierają `import_ing_statement`: `npm run db:types && grep -q import_ing_statement src/db/database.types.ts` — 0025ea2
- [x] 1.4 Lint przechodzi: `npm run lint` — 0025ea2

#### Manual

- [x] 1.5 Nagłówek migracji i komentarz funkcji jasno opisują atomowość, granty i FR-005 per rachunek — 0025ea2

### Phase 2: Parser ING i testy jednostkowe

#### Automated

- [ ] 2.1 Testy jednostkowe przechodzą: `npm test`
- [ ] 2.2 Bramka fixture nadal przechodzi: `npm run fixture:check`
- [ ] 2.3 Lint i typy przechodzą: `npm run lint && npx astro check`

#### Manual

- [ ] 2.4 Parser nie importuje modułów Node (przegląd importów w `src/lib/import/ing.ts`)

### Phase 3: Endpoint, wynik i lista importów

#### Automated

- [ ] 3.1 Smoke przechodzi na lokalnej bazie: `npm run dev` + `npm run smoke`
- [ ] 3.2 Lint, typy i build: `npm run lint && npx astro check && npm run build`
- [ ] 3.3 Testy jednostkowe i bazy nadal przechodzą: `npm test && npx supabase test db`

#### Manual

- [ ] 3.4 `/imports/result?id=<cudze id>` (drugie konto) przekierowuje na `/imports`
- [ ] 3.5 `/imports` drugiego konta nie pokazuje importów pierwszego (FR-002)

### Phase 4: Kreator importu i luki kitu

#### Automated

- [ ] 4.1 Lint, typy i build: `npm run lint && npx astro check && npm run build`
- [ ] 4.2 Testy jednostkowe, bazy i smoke nadal przechodzą: `npm test && npx supabase test db && npm run smoke`
- [ ] 4.3 Luki są zarejestrowane: `grep -c "DESIGN-GAP: G2[5-7]\|DESIGN-GAP: K16" -r src` > 0 oraz wiersze G25–G27 i K16 w `context/foundation/design-kit.md`

#### Manual

- [ ] 4.4 Pełny przepływ na pliku głównym fixture (rachunek główny): krok 1 → 2 → 3 → wynik „206”, lista pokazuje import z zakresem 01.09.2025–31.08.2026
- [ ] 4.5 Plik `-overlap` na tym samym koncie → krok 3 pokazuje blokujący błąd z zakresem „1 września 2025 – 31 sierpnia 2026”, bez przycisku importu
- [ ] 4.6 Pliki `-no-header` i `-currency` → właściwe alerty w kroku 1; „Wybierz inny plik” otwiera wybór pliku
- [ ] 4.7 Rachunek VAT z pliku głównego importuje się osobno (4 obciążenia), mimo tego samego zakresu
- [ ] 4.8 Bramka wizualna: zrzuty każdego stanu (krok 1: pusty, plik gotowy, 3 błędy formatu, błąd serwera; krok 2; krok 3: gotowy, nakładanie, brak obciążeń; wynik; lista) w 1280 px i 375 px porównane z prototypem kitu — bez poziomego przewijania, kolory tylko z tokenów
- [ ] 4.9 Od wyboru pliku do kroku 2 i od potwierdzenia do wyniku mija ułamek sekundy do kilku sekund dla pliku głównego (NFR czasu)
