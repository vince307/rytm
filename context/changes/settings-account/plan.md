# Settings account (S-08) Implementation Plan

## Overview

Widok `/settings` przestaje być placeholderem: użytkownik widzi swój e-mail, zmienia hasło formularzem w aplikacji, czyta notę o przetwarzaniu danych i samodzielnie usuwa konto po wpisaniu „USUŃ”. Usunięcie kasuje wiersz w `auth.users` (a przez kaskadę wszystkie przyszłe dane domenowe), kończy sesję i sprawia, że stare hasło przestaje działać, a e-mail jest znów wolny. Domyka FR-001 (konto), FR-019 i NFR „prawo do usunięcia”; roadmapa S-08.

## Current State Analysis

- `src/pages/settings.astro:1-12` renderuje `PageTitle` + `InlineAlert info` z `copyExtra.stub.info` („Ten widok pojawi się po pierwszym imporcie wyciągu.”), oznaczone `DESIGN-GAP: G18`; `design-kit.md:125` potwierdza, że `/settings` nie potrzebuje stanu pustego, a placeholder ma zniknąć razem z G11.
- Kit (G11, `design/rytm-os/prototype/app.js:64`) definiuje ekran: eyebrow „Ustawienia / konto”, h1 „Twoje konto.”, panel „Dane logowania” z wierszami `E-mail | adres | „Zmień”` (martwy przycisk), `Hasło | •••••••• | „Zmień hasło” → #/reset`, `Przetwarzanie danych | nota`; panel `.danger-panel` „Strefa destrukcyjna” / „Usuń konto” / `.btn-danger`; modal (`app.js:66`) „Usunięcie konta” / „Usunąć konto bez śladu?” / input `USUŃ` / przycisk „Usuń konto”. Kit **nie ma**: formularza zmiany hasła w aplikacji, stanu sukcesu/błędu usunięcia, blokady przycisku na wpisany tekst, stanu sukcesu/błędu zmiany hasła.
- Copy: `content.json:248-254` (`copy.settings.title/data/deleteTitle/deleteBody/confirmation`) pokrywa 5 stringów; nagłówki paneli, etykiety wierszy, „Zmień hasło”, „Strefa destrukcyjna” i cały modal istnieją tylko w `app.js` → K11 (`design-kit.md:95`). `copyExtra.settings` (`src/content/copy.ts:75`) ma dziś tylko `eyebrow` i `lead`.
- Auth: `src/lib/supabase.ts` tworzy klienta SSR z kluczem **publishable** (`deploy-plan.md:55`); brak `service_role` w `astro.config.mjs` env schema i w inwentarzu sekretów. Kasowanie `auth.users` wymaga uprawnień admina → potrzebna funkcja `security definer` w bazie. `supabase/migrations/` nie istnieje; projekt lokalny nie jest `supabase link`-owany; migracje na hostowaną bazę są human-only (`deploy-plan.md:75`).
- `config.toml`: `secure_password_change = false` (updateUser nie wymaga reautoryzacji), `minimum_password_length = 6` (`MIN_PASSWORD_LENGTH` w `src/lib/auth-rules.ts:1`), `jwt_expiry = 3600`.
- Wzorce do reużycia: endpoint `src/pages/api/auth/reset/new.ts` (zod + `updateUser` + redirect `?error=1`), `NewPasswordForm.tsx` (walidacja klienta, `FormField`/`PasswordToggle`/`SubmitButton`/`ServerError`), `/login?confirmed=1` → `InlineAlert success` (`src/pages/login.astro:9-18`), `signout.ts`.
- Komponenty: `button.tsx` ma `primary|ghost|amber` (brak `danger`; kit `.btn-danger` = `--amber-dark` = token `excess-text`, w `global.css:22` już zmapowany jako `--destructive`); `src/components/ui/` ma tylko `button.tsx` (brak Dialog); `Panel.astro` ma tylko `class`; brak komponentu wiersza ustawień.
- Smoke (`scripts/smoke.mjs`): 24 kroki, tworzy `smoke-<ts>@example.com` i nigdy go nie usuwa; CI (`ci.yml` job `smoke`) uruchamia `supabase start` (stosuje migracje z folderu) + `astro dev`.
- Roadmapa (`roadmap.md:254`) parkuje zmianę adresu e-mail — przycisk „Zmień” nie jest renderowany.

## Desired End State

- `/settings` (zalogowany) renderuje: `PageTitle` z kitu, panel „Dane logowania” (wiersz E-mail bez przycisku, wiersz Hasło z formularzem zmiany, wiersz Przetwarzanie danych z `copy.settings.data`), panel destrukcyjny z przyciskiem `danger` otwierającym dialog; dialog blokuje potwierdzenie, dopóki input ≠ `USUŃ`.
- `POST /api/auth/password` zmienia hasło po weryfikacji obecnego; użytkownik zostaje zalogowany i widzi `/settings?password=changed`.
- `POST /api/auth/delete` z `confirm=USUŃ` kasuje konto przez RPC `delete_own_account`, czyści cookies i przekierowuje na `/login?deleted=1` (nota „Konto zostało usunięte.”); po tym stare hasło nie loguje, `/home` przekierowuje na `/login`, a rejestracja tym e-mailem jest przyjęta.
- Smoke: cały cykl udowodniony automatycznie (patrz Faza 1) i zielony w CI; użytkownik smoke jest sprzątany.
- Luki kitu zarejestrowane w `design-kit.md` (K15, G23, G24) z komentarzami `DESIGN-GAP` w kodzie; `copyExtra.stub` usunięte.
- Migracja zastosowana lokalnie, w CI i na hostowanej bazie (krok human-only), `deploy-plan.md` i `CLAUDE.md` opisują ścieżkę migracji.

### Key Discoveries:

- `getUser()` w middleware (`src/middleware.ts:12`) pyta serwer Supabase przy każdym żądaniu, więc po skasowaniu wiersza JWT w cookie natychmiast przestaje logować; mimo to endpoint czyści cookies `signOut({ scope: "local" })`, bo `signOut()` bez scope próbuje unieważnić sesję na serwerze i zwróci błąd dla nieistniejącego użytkownika.
- `signInWithPassword` na kliencie SSR zapisuje nową sesję do cookies przez `setAll`; weryfikacja obecnego hasła musi użyć jednorazowego klienta z pustymi `getAll`/no-op `setAll`, żeby nie podmienić sesji użytkownika.
- `supabase start` stosuje wszystkie migracje z `supabase/migrations/` przy starcie (CI job `smoke` dostaje funkcję bez zmian w workflow); lokalnie po dodaniu migracji trzeba uruchomić `npx supabase migration up` (lub `db reset`).
- Kolory tylko przez tokeny (`CLAUDE.md`): `danger` = `bg-excess-text text-paper`; obramowanie panelu destrukcyjnego (kit `#d9c2a0`) = `border-excess` (najbliższy token; różnica odnotowana w K15).
- `SubmitButton` (`src/components/auth/SubmitButton.tsx`) ma sztywno `variant="primary" size="full"`; dialog potrzebuje `danger`.

## What We're NOT Doing

- Zmiana adresu e-mail (roadmapa: parked; przycisk „Zmień” z kitu nie jest renderowany).
- Klucz `service_role` na Vercelu / `auth.admin.deleteUser` (odrzucone w wywiadzie na rzecz RPC).
- Link „Zmień hasło” do `/reset` z kitu (zastąpiony formularzem w aplikacji — decyzja użytkownika; `/reset` pozostaje dostępny dla niezalogowanych).
- Reautoryzacja e-mailem (`secure_password_change`), MFA, wylogowanie innych sesji po zmianie hasła.
- Tabele domenowe, RLS, kaskady — to F-01 (`domain-schema-rls`); ta migracja tworzy wyłącznie funkcję.
- Ekran „konto usunięte” inny niż nota na `/login`; e-mail pożegnalny; okres karencji / soft delete.
- Test screenshotowy w CI (repo go nie ma — zrzuty ręczne w folderze zmiany).
- Wiersz „Wyloguj” w panelu (kit trzyma „Wyjdź” w nagłówku; G11 w `design-kit.md:118` wymaga logowania jako elementu ekranu — rozbieżność odnotowana w K15, bez zmiany UI).

## Implementation Approach

Kontrakt przed pikselami. Faza 1 dostarcza backend (migracja + dwa endpointy) i dowód w smoke — endpointy przyjmują zwykłe formularze POST, więc są testowalne bez UI. Faza 2 buduje widok z kitu na współdzielonych komponentach (wariant `danger`, shadcn Dialog, `SettingsRow`, wariant `Panel`), wypełnia copy i rejestruje luki kitu, kończąc bramką screenshotową. Faza 3 to wdrożenie: `supabase link` + `db push` (człowiek), preview, produkcja z `main`, dokumentacja.

Kontrakt parametrów zapytania (jedno źródło stanów widoku, jak `/login?confirmed=1`):

| URL                                | Stan                                                                         |
| ---------------------------------- | ---------------------------------------------------------------------------- |
| `/settings?password=changed`       | `InlineAlert success` „Hasło zostało zmienione.”                             |
| `/settings?error=current-password` | `ServerError` w formularzu: „Obecne hasło jest nieprawidłowe.”              |
| `/settings?error=password`         | `ServerError` w formularzu: `copyExtra.auth.resetNewError` (walidacja/API)   |
| `/settings?error=delete`           | `InlineAlert error` przy panelu destrukcyjnym: „Nie udało się usunąć konta.” |
| `/login?deleted=1`                 | `InlineAlert success` „Konto zostało usunięte.”                              |

## Critical Implementation Details

**Kolejność w `/api/auth/delete`:** najpierw `getUser()` (401-równoważne → redirect `/login`), potem walidacja `confirm`, potem `rpc("delete_own_account")`, dopiero po sukcesie `signOut({ scope: "local" })`. Odwrotna kolejność (signOut przed RPC) zostawia konto i wylogowuje użytkownika bez komunikatu.

**Bezpieczeństwo funkcji:** `security definer` + `set search_path = ''` + `revoke execute … from public, anon` + `grant execute … to authenticated`; ciało kasuje wyłącznie `auth.users where id = auth.uid()` i rzuca wyjątek, gdy `auth.uid()` jest null. Bez tego revoke każda rola (w tym `anon`) mogłaby wywołać funkcję — nieszkodliwie (uid null), ale wbrew zasadzie najmniejszych uprawnień.

**Weryfikacja obecnego hasła** tworzy po stronie Supabase nową sesję/refresh token dla użytkownika (efekt uboczny `signInWithPassword`); jest to akceptowane — jednorazowy klient nie zapisuje jej w cookies, a token wygasa. Wykrycie użytkownika: `user.email` z sesji, nie z formularza.

---

## Phase 1: Kontrakt konta (backend + smoke)

### Overview

Migracja z funkcją RPC, dwa endpointy POST, stała słowa potwierdzenia, rozszerzony smoke udowadniający zmianę hasła i usunięcie konta. Po tej fazie `/settings` nadal renderuje placeholder — endpointy są wywoływane przez smoke i `curl`.

### Changes Required:

#### 1. Migracja: funkcja kasująca własne konto

**File**: `supabase/migrations/20260921120000_delete_own_account.sql` (nowy; format nazwy z `CLAUDE.md`)

**Intent**: Dać zalogowanemu użytkownikowi możliwość skasowania własnego wiersza w `auth.users` bez klucza `service_role`; kaskady Supabase (`auth.identities`, `auth.sessions`, `auth.refresh_tokens`) i przyszłe FK `on delete cascade` z F-01 robią resztę.

**Contract**: `public.delete_own_account() returns void`, `language plpgsql security definer set search_path = ''`; rzuca `exception` gdy `auth.uid() is null`; `delete from auth.users where id = auth.uid()`; `revoke execute on function public.delete_own_account() from public, anon; grant execute … to authenticated;`. Komentarz `comment on function` z odniesieniem do FR-019. Brak nowych tabel (reguła RLS z `CLAUDE.md` nie ma zastosowania — zapisać to w komentarzu migracji).

#### 2. Stała słowa potwierdzenia

**File**: `src/lib/auth-rules.ts`

**Intent**: Jedno źródło słowa „USUŃ” dla klienta (blokada przycisku) i serwera (walidacja).

**Contract**: `export const DELETE_CONFIRM_WORD = "USUŃ";` obok `MIN_PASSWORD_LENGTH`.

#### 3. Endpoint zmiany hasła

**File**: `src/pages/api/auth/password.ts` (nowy)

**Intent**: Zmienić hasło zalogowanego użytkownika po sprawdzeniu obecnego, bez wylogowania.

**Contract**: `export const prerender = false; export const POST`. Formularz `current`, `password`, `confirm`; zod: `password.min(MIN_PASSWORD_LENGTH)`, `password === confirm`, `current.min(1)`. Kolejność: brak klienta/użytkownika → `302 /login`; zod fail → `302 /settings?error=password`; weryfikacja obecnego hasła jednorazowym klientem (`createServerClient` z `cookies: { getAll: () => [], setAll() {} }`, `signInWithPassword({ email: user.email, password: current })`) → błąd → `302 /settings?error=current-password`; `supabase.auth.updateUser({ password })` na kliencie sesji → błąd → `console.error` (jak `reset/new.ts`) + `302 /settings?error=password`; sukces → `302 /settings?password=changed`. Jednorazowy klient dostaje własny helper w `src/lib/supabase.ts`: `createStatelessClient()` zwracający `null` bez env (ten sam wzorzec co `createClient`).

#### 4. Endpoint usunięcia konta

**File**: `src/pages/api/auth/delete.ts` (nowy)

**Intent**: Samoobsługowe usunięcie konta (FR-019) z potwierdzeniem słowem.

**Contract**: `POST`, formularz `confirm`. Brak użytkownika → `302 /login`; `confirm !== DELETE_CONFIRM_WORD` (po `trim()`) → `302 /settings?error=delete`; `supabase.rpc("delete_own_account")` błąd → `console.error("auth/delete failed", …)` + `302 /settings?error=delete`; sukces → `supabase.auth.signOut({ scope: "local" })` → `302 /login?deleted=1`.

#### 5. Smoke: pełny cykl konta

**File**: `scripts/smoke.mjs`

**Intent**: Udowodnić zmianę hasła i usunięcie konta w CI na lokalnym Supabase i przy okazji sprzątać użytkownika smoke.

**Contract**: dodać `const password2 = "Smoke-Test-Passw0rd-2!"`. Nowe kroki wstawione po `home renders empty state for signed-in user` (użytkownik smoke zalogowany):
- `settings renders account e-mail` → `GET /settings` 200, `contains: email`
- `password change rejects wrong current password` → `POST /api/auth/password {current:"wrong", password: password2, confirm: password2}` → `302 /settings?error=current-password`
- `password change rejects short password` → `{current: password, password:"abc", confirm:"abc"}` → `302 /settings?error=password`
- `password change succeeds` → `{current: password, password: password2, confirm: password2}` → `302 /settings?password=changed`
- `settings shows password changed` → `GET /settings?password=changed` 200, `contains: "Hasło zostało zmienione."`
- `delete without confirm word is rejected` → `POST /api/auth/delete {confirm:"usuń"}` → `302 /settings?error=delete`
Istniejące kroki `login redirects signed-in user` … `register shows the occupied state` zostają; `signin rejects wrong password` przed nimi jest bez zmian. Po `register shows the occupied state` dodać:
- `signin rejects the old password` → `{email, password}` → `302 /login?error=1`
- `signin accepts the new password` → `{email, password: password2}` → `302 /home`
- `delete with confirm word removes the account` → `{confirm:"USUŃ"}` → `302 /login?deleted=1`
- `login shows the deleted state` → `GET /login?deleted=1` 200, `contains: "Konto zostało usunięte."`
- `home redirects after deletion` → `302 /login`
- `signin after deletion is rejected` → `{email, password: password2}` → `302 /login?error=1`
- `signup after deletion is accepted again` → `302 /confirm-email`
- `signin re-created account` → `{email, password}` → `302 /home`
- `delete re-created account (cleanup)` → `302 /login?deleted=1`
Potem dotychczasowe kroki `seeded test user signs in` … `signout seeded user`. Kroki z `contains` wymagają, żeby strona renderowała copy — do czasu Fazy 2 dwa kroki (`settings shows password changed`, `login shows the deleted state`) będą czerwone; Faza 1 kończy się z nimi jako jedynymi FAIL, Faza 2 je domyka. Zaktualizować komentarz w `CLAUDE.md` „must be N/N PASS” (liczba kroków po zmianie: 24 + 15 = 39).

### Success Criteria:

#### Automated Verification:

- Migracja stosuje się na czystej bazie: `npx supabase db reset` kończy się bez błędu, a `psql`/`supabase db query` `select proname from pg_proc where proname = 'delete_own_account'` zwraca wiersz
- Rola `anon` nie może wywołać funkcji: `curl -X POST $SUPABASE_URL/rest/v1/rpc/delete_own_account -H "apikey: $SUPABASE_KEY"` zwraca 401/403 (nie 200/204)
- `npm run lint` i `npx astro check` przechodzą
- `npm run smoke` na `npm run dev` + lokalnym Supabase: wszystkie kroki poza dwoma `contains` z Fazy 2 PASS (37/39)
  > Nota z implementacji (2026-09-22): krok `settings renders account e-mail` również zależy od widoku z Fazy 2 (placeholder nie drukuje adresu), więc oczekiwany wynik Fazy 1 to 36/39 — trzy kroki `contains` czerwone, wszystkie domknięte w 2.2.

#### Manual Verification:

- W Supabase Studio (`:54323`) po kroku `delete with confirm word removes the account` nie ma wiersza dla `smoke-<ts>@example.com` w `auth.users` ani w `auth.identities`
- Log dev-serwera nie zawiera `auth/delete failed` ani `auth/password failed` z przebiegu smoke

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 2: Widok ustawień (komponenty + copy + luki kitu)

### Overview

Współdzielone komponenty (wariant `danger`, Dialog, `SettingsRow`, wariant `Panel`), copy do `copyExtra`, strona `/settings` z kitu, nota `/login?deleted=1`, rejestr luk, bramka screenshotowa.

### Changes Required:

#### 1. Wariant `danger` przycisku

**File**: `src/components/ui/button.tsx`

**Intent**: Kit `.btn-danger` (`--amber-dark` na białym tekście) jako współdzielony wariant zamiast klas ad hoc.

**Contract**: `variant.danger: "bg-excess-text text-paper hover:bg-excess-text/90 hover:-translate-y-px"`; reszta bez zmian.

#### 2. Dialog (shadcn)

**File**: `src/components/ui/dialog.tsx` (nowy, `npx shadcn@latest add dialog` — dodaje zależność `@radix-ui/react-dialog`)

**Intent**: Pierwszy współdzielony primitive modalny w repo (kit G14 „modal z wariantem destrukcyjnym”); Radix daje focus trap, `aria-modal`, Escape, klik w tło.

**Contract**: Po instalacji przestylować wygenerowane klasy na tokeny kitu: overlay `bg-ink/40`, content `rounded-xl border border-line bg-paper p-[22px] max-w-[440px]`; `DialogContent` przyjmuje `closeLabel: string` (sr-only tekst przycisku X — „Zamknij” z copy, nie hardcode „Close”). Żadnych innych komponentów shadcn w tej zmianie.

#### 3. `SubmitButton` z wariantem

**File**: `src/components/auth/SubmitButton.tsx`

**Intent**: Dialog i formularz hasła używają tego samego przycisku z `useFormStatus`, ale w innym wariancie/rozmiarze.

**Contract**: opcjonalne props `variant?: ButtonVariant` (domyślnie `"primary"`) i `size?` (domyślnie `"full"`), oraz `showArrow?: boolean` (domyślnie `true`; dialog usunięcia nie pokazuje `↗`). Istniejące wywołania bez zmian.

#### 4. Formularz zmiany hasła

**File**: `src/components/auth/NewPasswordForm.tsx`

**Intent**: Reużyć istniejącą walidację i pola zamiast drugiego formularza hasła.

**Contract**: nowe props `action?: string` (domyślnie `/api/auth/reset/new`) i `current?: { label: string }` — gdy podane, renderuje pierwsze pole `id="current"`, `autoComplete="current-password"`, wymagane (`labels.passwordRequired`-podobny komunikat: użyć `copy.authStates.passwordRequired`), przed „Nowe hasło”. `labels` rozszerzone o opcjonalne `currentRequired`. `/reset/new.astro` nie zmienia zachowania.

#### 5. Wiersz ustawień i panel destrukcyjny

**File**: `src/components/app/SettingsRow.astro` (nowy), `src/components/app/Panel.astro`

**Intent**: Kit `.settings-row` (grid `190px 1fr auto`, min-h 70px, dolna linia, etykieta muted 12px; ≤900 px: `1fr auto`, etykieta na całą szerokość) i `.danger-panel` jako komponenty, nie klasy inline na stronie.

**Contract**: `SettingsRow` props `label: string`; sloty: default (treść) i nazwany `action` (opcjonalny, prawa kolumna); ostatni wiersz bez dolnej linii (`last:border-b-0`). `Panel` dostaje `variant?: "default" | "danger"`; `danger` = `border-excess flex items-center justify-between gap-5 max-[899px]:flex-col max-[899px]:items-start` (kit: obramowanie `#d9c2a0` → najbliższy token `excess`; K15).

#### 6. Dialog usunięcia konta

**File**: `src/components/settings/DeleteAccountDialog.tsx` (nowy, React island `client:load`)

**Intent**: Przycisk „Usuń konto” → dialog z kitu; potwierdzenie aktywne tylko po wpisaniu `USUŃ`.

**Contract**: props `labels` (trigger, eyebrow, title, body, confirmationHint, placeholder, confirm, pending, close), `serverError?: string | null`. Wewnątrz `<form method="POST" action="/api/auth/delete">` z `<input name="confirm">`; przycisk potwierdzenia `SubmitButton variant="danger" size="default" showArrow={false}` z `disabled={value.trim() !== DELETE_CONFIRM_WORD || pending}` (import z `@/lib/auth-rules`). Gdy `serverError`, dialog otwiera się od razu z `ServerError` nad inputem (stan `?error=delete`). Input nie ma autouzupełniania (`autoComplete="off"`), `aria-describedby` na paragraf z podpowiedzią.

#### 7. Copy

**File**: `src/content/copy.ts`, `src/pages/login.astro`

**Intent**: Stringi prototypu (K11) i stany spoza kitu (DESIGN-GAP) w jednym miejscu; usunięcie `stub`.

**Contract**: `copyExtra.settings` rozszerzone o (verbatim z `app.js:64,66`): `loginData: "Dane logowania"`, `emailLabel: "E-mail"`, `passwordLabel: "Hasło"`, `dataLabel: "Przetwarzanie danych"`, `changePassword: "Zmień hasło"`, `dangerEyebrow: "Strefa destrukcyjna"`, `deleteDialogEyebrow: "Usunięcie konta"`, `deleteDialogTitle: "Usunąć konto bez śladu?"`, `deleteDialogBody: "Ta decyzja usunie wszystkie importy, wzorce i progi."`, `close: "Zamknij"`; oraz z komentarzem `// DESIGN-GAP: G23/G24 — states the kit does not define`: `currentPassword: "Obecne hasło"`, `passwordChanged: "Hasło zostało zmienione."`, `currentPasswordWrong: "Obecne hasło jest nieprawidłowe."`, `deleteError: "Nie udało się usunąć konta. Spróbuj ponownie."`, `deleting: "Usuwanie…"`; `copyExtra.auth.deletedLogin: "Konto zostało usunięte."`. Usunąć `copyExtra.stub` i komentarz nad nim. `login.astro`: `const deleted = params.has("deleted")` → `InlineAlert success` z `x.deletedLogin` (ten sam blok co `confirmed`). Tekst dialogu łączy `deleteDialogBody` + `copy.settings.confirmation` (kit: „Wpisz USUŃ, aby potwierdzić.” ze `<strong>`).

#### 8. Strona `/settings`

**File**: `src/pages/settings.astro`

**Intent**: Kompozycja z kitu na powyższych komponentach; stany z parametrów zapytania.

**Contract**: `Astro.locals.user!.email` (middleware gwarantuje użytkownika); `PageTitle` bez zmian; `Panel` „Dane logowania” (`h2` jak `.panel-title`) z `SettingsRow`: E-mail (bez akcji; komentarz `// roadmap: change e-mail parked — kit button not rendered`), Hasło (treść: `NewPasswordForm client:load action="/api/auth/password" current={…}`, `serverError` z `?error=current-password|password`), Przetwarzanie danych (`copy.settings.data`); nad panelem `InlineAlert success` dla `?password=changed`; `Panel variant="danger"` z eyebrow, `h2 copy.settings.deleteTitle`, `p copy.settings.deleteBody` i `DeleteAccountDialog client:load` (`serverError` dla `?error=delete`). Usunąć komentarz `DESIGN-GAP: G18`; dodać `// DESIGN-GAP: G23 (in-app password form), G24 (delete/password result states)`.

#### 9. Rejestr luk kitu

**File**: `context/foundation/design-kit.md`

**Intent**: Wartości i decyzje spoza kitu trafiają do repo z linią wskazującą źródło, nie do czatu.

**Contract**: (a) w tabeli konfliktów nowy wiersz **K15**: copy `/settings` i modalu tylko w `app.js` (lista kluczy z pkt 7), `.btn-danger`/`.danger-panel` mapowane na tokeny `excess-text`/`excess` (kit `#d9c2a0` nie ma tokenu), G11 wymaga „wylogowania” w ekranie, a prototyp trzyma je w nagłówku — zostawione jak w prototypie. (b) rejestr braków: **G23** „Formularz zmiany hasła w aplikacji (`/settings`)” — kit linkuje do `#/reset`; aplikacja renderuje obecne/nowe/powtórz (decyzja produktowa 2026-09-21), potrzebna kompozycja i copy; **G24** „Stany wyniku na `/settings` i `/login?deleted=1`” — sukces/błąd zmiany hasła, błąd usunięcia, nota po usunięciu, blokada przycisku na `USUŃ`. (c) „Do rundy 3”: dopisać K15, G23, G24. (d) wiersz `/settings` w inwentarzu widoków: dopisać „wdrożone 2026-09-21 (G11 + G23/G24)”; G18: usunąć zdanie o `copyExtra.stub`.

#### 10. Zrzuty ekranu (bramka wizualna)

**File**: `context/changes/settings-account/screenshots/*.png` (nowy folder)

**Intent**: Każdy stan widoku obejrzany przed przeglądem; repo nie ma testu screenshotowego, więc bez baseline’ów.

**Contract**: zrzuty desktop (≥1100 px) i mobile (400 px) dla: `/settings` domyślny, `?password=changed`, `?error=current-password`, `?error=delete` (dialog otwarty z błędem), dialog otwarty z pustym inputem (przycisk nieaktywny), dialog z wpisanym `USUŃ` (aktywny), `/login?deleted=1`. Nazwy plików `settings-<stan>-<desktop|mobile>.png`.

### Success Criteria:

#### Automated Verification:

- `npm run lint`, `npx astro check`, `npm run build` przechodzą
- `npm run smoke` PASS 39/39 (w tym `settings shows password changed` i `login shows the deleted state`)
- `grep -rn "copyExtra.stub" src/` zwraca 0 wyników; `grep -rn "DESIGN-GAP: G18" src/pages/settings.astro` zwraca 0
- `grep -c "USUŃ" src/` — słowo występuje wyłącznie w `src/lib/auth-rules.ts` (klient i serwer importują stałą)

#### Manual Verification:

- Zrzuty ekranu z pkt 10 istnieją i odpowiadają kompozycji kitu (`app.js:64,66`): układ wierszy, panel destrukcyjny oddzielony, dialog z eyebrow/tytułem/podpowiedzią
- Klawiatura: Tab dochodzi do „Usuń konto”, Enter otwiera dialog, fokus ląduje w inpucie, Escape zamyka, fokus wraca na przycisk; przycisk potwierdzenia jest nieaktywny dla `usuń`/`USUN`/pustego i aktywny dla `USUŃ`
- Zmiana hasła w przeglądarce: po sukcesie użytkownik pozostaje zalogowany na `/settings` z notą; po wylogowaniu nowe hasło loguje, stare nie
- Usunięcie w przeglądarce: ląduje na `/login?deleted=1`, `/home` przekierowuje na `/login`, rejestracja tym samym e-mailem przechodzi
- Mobile 400 px: wiersze zwijają się do jednej kolumny, panel destrukcyjny w kolumnie, dialog mieści się w ekranie

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 3: Wdrożenie produkcyjne i dokumentacja

### Overview

Funkcja trafia na hostowaną bazę (human-only), zmiana przechodzi preview → `main` → produkcja, a dokumenty operacyjne opisują ścieżkę migracji.

### Changes Required:

#### 1. Migracja na hostowanej bazie (człowiek)

**File**: — (operacja poza repo: `npx supabase link --project-ref psqbtvooufapkatpkxlw` z `SUPABASE_DB_PASSWORD` z `.env`, potem `npx supabase db push`)

**Intent**: Bez funkcji na produkcji `POST /api/auth/delete` kończy się `?error=delete`; push jest human-only (`deploy-plan.md:75`) i musi poprzedzić merge do `main`.

**Contract**: `db push` stosuje wyłącznie `20260921120000_delete_own_account.sql`; `seed.sql` nie jest stosowany. `supabase/.temp/` (tworzony przez `link`) dodać do `.gitignore`, jeśli `link` go utworzy.

#### 2. Preview deploy i weryfikacja

**File**: — (`npx vercel` z drzewa roboczego)

**Intent**: Sprawdzić produkcyjny build z hostowanym Supabase przed merge; `astro preview` nie działa z adapterem Vercel.

**Contract**: na preview (z Vercel Authentication, ręcznie w przeglądarce): założyć konto testowe `rytm-s08-<data>@…` własnym adresem, potwierdzić e-mail, zmienić hasło, usunąć konto; potwierdzić w Supabase Dashboard → Authentication → Users brak wiersza. Nigdy `npm run smoke` przeciwko preview/produkcji (`CLAUDE.md`).

#### 3. Dokumentacja operacyjna

**File**: `context/deployment/deploy-plan.md`, `CLAUDE.md`

**Intent**: Inwentarz stanu wdrożenia zna pierwszą migrację; instrukcje dla agentów opisują, jak migracje trafiają lokalnie i na produkcję.

**Contract**: `deploy-plan.md`: zaktualizować zdanie „No migrations exist yet … not `supabase link`ed” (linia 55), dodać wpis rundy (data, `db push` pierwszej migracji, kto), pozycja human-only bez zmian. `CLAUDE.md` → Environment: „migracje stosują się przy `npx supabase start`; po pobraniu nowych: `npx supabase migration up`; na produkcję wyłącznie człowiek: `supabase db push` przed merge zmiany, która ich wymaga”; smoke „must be 39/39 PASS”.

### Success Criteria:

#### Automated Verification:

- GitHub Actions `ci` → `smoke` → `deploy` zielone na `main` (`gh run watch`)
- `curl -s -o /dev/null -w "%{http_code}" https://rytm-phi.vercel.app/settings` zwraca 302 (redirect na `/login`) po wdrożeniu

#### Manual Verification:

- Na hostowanej bazie (Supabase Dashboard → Database → Functions) istnieje `public.delete_own_account`
- Na aliasie produkcyjnym pełny cykl z pkt 2 przechodzi na jednorazowym koncie testowym, a konto znika z listy użytkowników
- `deploy-plan.md` i `CLAUDE.md` opisują stan po wdrożeniu (migracja, link, 39 kroków smoke)

---

## Testing Strategy

### Unit Tests:

- Repo nie ma runnera unit testów (tylko lint, `astro check`, smoke) — nie dodajemy go w tej zmianie; walidacja zod i logika przycisku są pokryte przez smoke i test ręczny.

### Integration Tests:

- `scripts/smoke.mjs` (Faza 1, pkt 5): zmiana hasła (błędne obecne, za krótkie, sukces), stare hasło nie działa, nowe działa, odrzucenie bez słowa, usunięcie, brak sesji, brak logowania, e-mail wolny, sprzątanie.
- Test uprawnień funkcji przez REST jako `anon` (Faza 1, kryteria automatyczne).

### Manual Testing Steps:

1. `npx supabase start` → `npx supabase migration up` → `npm run dev` → `npm run smoke` (39/39).
2. Zaloguj się jako `test@rytm.local`, wejdź na `/settings`, zmień hasło na nowe, wyloguj, zaloguj nowym, przywróć stare (żeby seed pozostał zgodny) — lub `npx supabase db reset`.
3. Załóż drugie konto, usuń je przez dialog: sprawdź `/login?deleted=1`, `/home` → `/login`, ponowna rejestracja tym e-mailem przechodzi.
4. Klawiatura i czytnik ekranu w dialogu (fokus, Escape, `aria-modal`).
5. Widok 400 px.

## Performance Considerations

Bez wpływu: dwa dodatkowe żądania do Supabase per akcja (weryfikacja hasła + update; RPC + local signOut). Rate limit Supabase `sign_in_sign_ups` (30/5 min per IP) obejmuje weryfikację obecnego hasła — wystarczające dla narzędzia osobistego.

## Migration Notes

Pierwsza migracja w repo. Lokalnie: `npx supabase migration up` (lub `db reset`). CI: automatycznie przez `supabase start`. Produkcja: `supabase link` + `db push` przez człowieka **przed** merge do `main`; wycofanie = `drop function public.delete_own_account()` nową migracją (nie edycją istniejącej). Endpoint bez funkcji degraduje do `?error=delete` z logiem — nie psuje reszty aplikacji.

## References

- Roadmap S-08: `context/foundation/roadmap.md` (linie 53, 199-208)
- PRD FR-019 / NFR: `context/foundation/prd.md:130-131,183`
- Kit ekranu i modalu: `design/rytm-os/prototype/app.js:64,66`; copy `design/rytm-os/react-kit/docs/content.json:248-254`; brief G11 `design/prompts/2026-09-18-gaps-round-1.md:73`
- Rejestr luk: `context/foundation/design-kit.md:95,118,121,125`
- Wzorce: `src/pages/api/auth/reset/new.ts`, `src/components/auth/NewPasswordForm.tsx`, `src/pages/login.astro:9-18`, `scripts/smoke.mjs`
- Stan wdrożenia i sekrety: `context/deployment/deploy-plan.md:55-76`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Kontrakt konta (backend + smoke)

#### Automated

- [x] 1.1 Migracja stosuje się na czystej bazie i funkcja `delete_own_account` istnieje — 8c9ded6
- [x] 1.2 Rola `anon` nie może wywołać funkcji przez REST — 8c9ded6
- [x] 1.3 `npm run lint` i `npx astro check` przechodzą — 8c9ded6
- [x] 1.4 `npm run smoke` 37/39 (tylko dwa kroki `contains` z Fazy 2 czerwone) — 8c9ded6

#### Manual

- [x] 1.5 Użytkownik smoke nie istnieje w `auth.users`/`auth.identities` po usunięciu — 8c9ded6
- [x] 1.6 Log dev-serwera bez `auth/delete failed` / `auth/password failed` — 8c9ded6

### Phase 2: Widok ustawień (komponenty + copy + luki kitu)

#### Automated

- [x] 2.1 `npm run lint`, `npx astro check`, `npm run build` przechodzą — d8d2594
- [x] 2.2 `npm run smoke` PASS 39/39 — d8d2594
- [x] 2.3 Brak `copyExtra.stub` i `DESIGN-GAP: G18` w `src/` — d8d2594
- [x] 2.4 Słowo `USUŃ` tylko w `src/lib/auth-rules.ts` — d8d2594

#### Manual

- [x] 2.5 Zrzuty ekranu wszystkich stanów zgodne z kompozycją kitu — f744e6c
- [x] 2.6 Klawiatura i blokada przycisku w dialogu — f744e6c
- [x] 2.7 Zmiana hasła w przeglądarce (pozostaje zalogowany; nowe loguje, stare nie) — f744e6c
- [x] 2.8 Usunięcie w przeglądarce (`/login?deleted=1`, `/home` → `/login`, ponowna rejestracja) — f744e6c
- [x] 2.9 Widok mobile 400 px — f744e6c

### Phase 3: Wdrożenie produkcyjne i dokumentacja

#### Automated

- [x] 3.1 GitHub Actions `ci` → `smoke` → `deploy` zielone na `main` — 97fa999
- [x] 3.2 Produkcyjny `/settings` odpowiada 302 na `/login` — 97fa999

#### Manual

- [x] 3.3 Funkcja `delete_own_account` istnieje na hostowanej bazie — 97fa999
- [ ] 3.4 Pełny cykl na produkcji na jednorazowym koncie, konto znika
- [x] 3.5 `deploy-plan.md` i `CLAUDE.md` opisują stan po wdrożeniu — 97fa999
