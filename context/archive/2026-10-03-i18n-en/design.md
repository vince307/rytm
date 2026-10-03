# i18n-en — projekt (spec)

Data: 2026-10-03 · Status: zatwierdzony w rozmowie, do przeglądu pisemnego

## Cel

Aplikacja dostępna w dwóch językach — polskim (domyślny) i angielskim — z przełącznikiem języka
widocznym na każdej stronie. Zmienia się wyłącznie interfejs; dane (PLN, wyciągi ING/Santander) bez zmian.

**Kryteria sukcesu**

- Każdy widok (marketing, auth, aplikacja) renderuje się w całości po angielsku po wybraniu EN — brak
  polskich stringów UI poza danymi użytkownika.
- Wybór języka przetrwa przeładowanie i nawigację; pierwsza wizyta respektuje `Accept-Language`.
- Wersja PL renderuje się identycznie jak przed zmianą (refactor bez zmiany zachowania).
- Brak klucza w EN to błąd kompilacji, nie pusta etykieta.

## Decyzje (z rozmowy)

| # | Decyzja | Wybór |
|---|---------|-------|
| D1 | Źródło treści EN | Własne tłumaczenie w repo, oznaczone `DESIGN-GAP`; docelowo podmiana na wersję z kitu |
| D2 | Wybór locale | Ciasteczko `rytm-locale` + `Accept-Language` przy pierwszej wizycie; URL-e bez zmian, bez prefiksu `/en` |
| D3 | Przełącznik | Wszędzie: stopka `MarketingLayout`, `AuthLayout`, sekcja w `/settings` |
| D4 | Formatowanie EN | Pełne `en-GB` (separatory, daty, liczba mnoga), waluta zapisywana `52.99 zł` |
| D5 | Mechanizm | Własny typowany słownik, bez biblioteki i18n |

Odrzucone: prefiks w URL (SEO liczy się tylko dla landingu, a koszt przeróbki auth/middleware/redirectów
jest wysoki); zapis języka w profilu DB (można dodać później bez przeróbek); Paraglide/i18next (drugie
źródło prawdy obok `content.json`, przepisanie ~30 konsumentów na klucze).

## Architektura

### Przepływ locale

- `src/lib/i18n.ts` — `type Locale = "pl" | "en"`, `LOCALES`, `DEFAULT_LOCALE = "pl"`,
  `resolveLocale(cookieValue, acceptLanguage): Locale` — kolejność: ciasteczko → `Accept-Language`
  (pierwszy pasujący język) → `pl`. Nieznana wartość ciasteczka = brak ciasteczka.
- `src/middleware.ts` — ustawia `context.locals.locale` (typ w `src/env.d.ts`) na każdym żądaniu,
  przed logiką `PROTECTED_ROUTES`.
- `src/layouts/Layout.astro` — `<html lang={Astro.locals.locale}>`.
- `POST /api/locale` (`prerender = false`, zod `z.enum(["pl","en"])`) — ustawia ciasteczko
  `rytm-locale` (1 rok, `path=/`, `SameSite=Lax`, `httpOnly` — czyta je tylko serwer) i przekierowuje 303 z powrotem na
  ścieżkę z `Referer`, jeśli jest tego samego originu; inaczej `/`. Brak otwartego przekierowania.

### Słownik

- `src/content/copy.ts` — zamiast stałych `copy` / `copyExtra` eksportuje
  `getCopy(locale): { copy: KitCopy; copyExtra: CopyExtra }`, gdzie `KitCopy = typeof content`
  (kit JSON) i `CopyExtra = typeof copyExtraPl`.
- `pl` → kit `content.json` 1:1 + dzisiejsze `copyExtra` (bez zmian treści).
- `en` → `src/content/en/kit.ts` (`satisfies KitCopy`) + `src/content/en/extra.ts`
  (`satisfies CopyExtra`). Każdy plik EN zaczyna się komentarzem
  `// DESIGN-GAP: K42 — kit has no EN copy; own translation, replace when the kit ships one.`
  Przełącznik języka = osobna luka K43.
- Polska gramatyka (`monthsGenitive`, odmiany typu „kosztów”) jest danymi słownika — EN ma swoje
  odpowiedniki (np. nazwy miesięcy w mianowniku), a szablony z placeholderami zachowują te same
  placeholdery.

### Konsumenci

- Strony i komponenty `.astro`: `const { copy, copyExtra } = getCopy(Astro.locals.locale)`.
- Wyspy React: dostają potrzebny wycinek `copy` i `locale` w propsach (nie importują `copy`
  bezpośrednio — kod klienta nie zna locale serwera). ~30 plików importuje dziś `@/content/copy`.

### Formatowanie

- `src/lib/format.ts` — każda funkcja przyjmuje `locale`; formatery `Intl.*` zapamiętane per locale
  (`pl-PL` / `en-GB`). Kwota: liczba w formacie locale + ` zł` (`52,99 zł` / `52.99 zł`).
  `PluralRules` per locale; formy wyrazów z słownika danego języka.
- `src/lib/patterns/merchant.ts` — `toLocaleLowerCase("pl-PL")` zostaje: to normalizacja danych, nie UI.

### Przełącznik

- Komponent `LocaleSwitch.astro` — `<form method="post" action="/api/locale">` z dwoma przyciskami
  `PL` / `EN` (aktywny oznaczony `aria-current`/`aria-pressed`), działa bez JS. Tylko tokeny kitu
  (`ink`, `muted`, `line`); komentarz `DESIGN-GAP` — kit nie rysuje przełącznika.
- Umieszczenie: stopka `MarketingLayout`, róg `AuthLayout`, sekcja „Język / Language” w `/settings`.
- Etykiety przełącznika w słowniku (`copyExtra`), nazwy języków w ich własnym języku („Polski”, „English”).

## Zakres

**W zakresie:** całe `content.json` + `copyExtra` po angielsku, `<title>`/meta stron, przełącznik,
formatowanie, wiersze `DESIGN-GAP` w `context/foundation/design-kit.md` (K42 — brak EN w kicie;
K43 — brak przełącznika w kicie; numery do potwierdzenia przy implementacji, jeśli kit doda luki wcześniej).

**Poza zakresem:** e-maile Supabase (domyślne szablony, po angielsku dla obu języków), nazwy
kontrahentów/opisy z wyciągów (dane), parsery ING/Santander, zapis języka w profilu, prefiksy URL.

**Do sprawdzenia w researchu:** czy endpointy API lub `auth-rules.ts` zawierają zaszyte polskie stringi
widoczne dla użytkownika (założenie: zwracają kody, tekst z copy) — jeśli tak, przenieść do słownika.
Czy wyspy React mają dziś inny kanał dostępu do copy niż import.

## Obsługa błędów

- Nieprawidłowa wartość w `/api/locale` → 400 (zod), ciasteczko bez zmian.
- Uszkodzone/nieznane ciasteczko → traktowane jak brak, fallback na `Accept-Language` → `pl`.
- Zewnętrzny lub brakujący `Referer` → przekierowanie na `/`.

## Testy

- **Typy:** `satisfies KitCopy` / `CopyExtra` wymusza kompletność kształtu EN (`npm run lint`/`tsc`).
- **Unit (Vitest, `test/unit/`):**
  - `resolveLocale` — ciasteczko > `Accept-Language` > `pl`; nieznane wartości; `en-US,en;q=0.9`.
  - `format.ts` dla obu locale — `52,99 zł` / `52.99 zł`, daty, liczba mnoga.
  - kit-contract test rozszerzony: EN ma te same klucze, długości tablic i placeholdery co PL.
- **API:** `/api/locale` — poprawna wartość ustawia ciasteczko i 303; zła → 400; obcy `Referer` → `/`.
- **E2E (Playwright przez `/10x-e2e`, jeśli skonfigurowany):** przełączenie na EN na landingu →
  `lang="en"` i angielski nagłówek; zalogowany widok po angielsku; wybór przetrwa przeładowanie.
- **Smoke:** `npm run smoke` nadal zielony (PL domyślne).

## Fazy

1. **Infrastruktura** — `i18n.ts`, middleware, `locals.locale`, `/api/locale`, `lang`, `format.ts`
   z parametrem `locale`. PL bez widocznej zmiany.
2. **Przepięcie konsumentów** — ~30 plików na `getCopy(locale)`, propsy w wyspach React.
3. **Tłumaczenie EN** — `src/content/en/{kit,extra}.ts` + rozszerzony test kontraktu.
4. **Przełącznik** — `LocaleSwitch.astro` w trzech miejscach, wiersze `DESIGN-GAP` w `design-kit.md`.
5. **Bramka wizualna EN** — kluczowe widoki (landing, login, home, patterns, fixed, imports, settings)
   pod kątem długości angielskich tekstów vs układ.

Fazy 1–2 to refactor bez zmiany zachowania — mogą trafić do main przed tłumaczeniem.
