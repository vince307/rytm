# Settings account (S-08) — Plan Brief

> Full plan: `context/changes/settings-account/plan.md`

## What & Why

Widok `/settings` przestaje być placeholderem: użytkownik widzi swój e-mail, zmienia hasło formularzem w aplikacji, czyta notę o przetwarzaniu danych i samodzielnie usuwa konto po wpisaniu „USUŃ”. Domyka FR-019 i NFR „prawo do usunięcia” (samoobsługowo, nie przez operatora) oraz wycinek S-08 roadmapy — jedyny konieczny wycinek bez wymagań wstępnych.

## Starting Point

`/settings` renderuje `InlineAlert` „Ten widok pojawi się po pierwszym imporcie wyciągu.”; kit (G11) ma gotowy ekran i dialog „USUŃ”, ale bez formularza zmiany hasła i bez stanów wyniku. Aplikacja ma tylko klucz publishable Supabase, brak `supabase/migrations/`, brak komponentu Dialog i wariantu `danger`; smoke tworzy użytkownika, którego nigdy nie sprząta.

## Desired End State

Zalogowany użytkownik na `/settings` widzi panel „Dane logowania” (e-mail, formularz obecne/nowe/powtórz hasło, nota o danych) i „Strefę destrukcyjną” z dialogiem, którego przycisk działa dopiero po wpisaniu `USUŃ`. Po usunięciu ląduje na `/login` z notą „Konto zostało usunięte.”, stare hasło nie loguje, e-mail jest wolny. Cały cykl jest udowodniony w smoke (39 kroków) i działa na produkcji.

## Key Decisions Made

| Decision                    | Choice                                                                          | Why (1 sentence)                                                                                              | Source  |
| --------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------- |
| Zmiana hasła                | Formularz w aplikacji (obecne + nowe + powtórz), użytkownik zostaje zalogowany  | Wybór użytkownika ponad linkiem kitu do `/reset`; zgłoszone jako luka kitu G23                               | Plan    |
| Mechanizm usunięcia         | Migracja z funkcją `delete_own_account()` (`security definer`), RPC sesją       | Bez nowego sekretu na Vercelu; działa lokalnie, w CI i kaskadowo z przyszłymi tabelami F-01                   | Plan    |
| Stan po usunięciu           | `signOut({scope:"local"})` → `/login?deleted=1` z notą                          | Powtarza wzorzec `/login?confirmed=1`; jedno zdanie copy spoza kitu (G24)                                     | Plan    |
| Zakres smoke                | Pełny cykl: zmiana hasła, odrzucenie bez słowa, usunięcie, stare hasło, re-signup | Dowodzi FR-019 w CI i sprząta użytkownika smoke                                                               | Plan    |
| Słowo potwierdzenia         | `DELETE_CONFIRM_WORD = "USUŃ"` w `auth-rules.ts`, sprawdzane po obu stronach   | Klient blokuje przycisk, serwer nie ufa klientowi                                                             | Plan    |
| Dialog                      | shadcn `dialog` (Radix) przestylowany na tokeny                                 | Pierwszy współdzielony primitive modalny; focus trap i a11y za darmo; system projektowy już w repo             | Plan    |
| Zmiana e-maila              | Przycisk „Zmień” z kitu nie jest renderowany                                    | Roadmapa parkuje tę funkcję                                                                                   | Roadmap |
| Weryfikacja obecnego hasła  | `signInWithPassword` jednorazowym klientem bez cookies, potem `updateUser`      | `secure_password_change=false`, a `updateUser` sam nie sprawdza obecnego hasła                                | Plan    |

## Scope

**In scope:** migracja z funkcją RPC; `POST /api/auth/password` i `POST /api/auth/delete`; wariant `danger`, Dialog, `SettingsRow`, wariant `Panel`; rozszerzenie `NewPasswordForm` i `SubmitButton`; copy K11 + DESIGN-GAP w `copyExtra`; strona `/settings`; nota na `/login?deleted=1`; wiersze K15/G23/G24 w `design-kit.md`; zrzuty ekranu stanów; smoke 39 kroków; `db push` (człowiek), preview, dokumentacja.

**Out of scope:** zmiana e-maila; klucz `service_role`; link „Zmień hasło” do `/reset`; reautoryzacja/MFA; tabele domenowe i RLS (F-01); soft delete / karencja; test screenshotowy w CI; wiersz „Wyloguj” w panelu.

## Architecture / Approach

Kontrakt przed pikselami. Endpointy przyjmują zwykłe formularze POST i odpowiadają redirectem z parametrem stanu (`?password=changed`, `?error=current-password|password|delete`, `/login?deleted=1`), więc smoke testuje je bez UI. Kasowanie: sesja użytkownika → `rpc("delete_own_account")` → funkcja `security definer` (`execute` tylko `authenticated`, kasuje wyłącznie `auth.uid()`) → kaskady Supabase → lokalne wyczyszczenie cookies. Widok: Astro (`Panel`, `SettingsRow`, `PageTitle`) + dwie wyspy React (`NewPasswordForm` z polem obecnego hasła, `DeleteAccountDialog` na shadcn Dialog).

## Phases at a Glance

| Phase                       | What it delivers                                                          | Key risk                                                                       |
| --------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| 1. Kontrakt konta           | Migracja, dwa endpointy, stała `USUŃ`, smoke 37/39 (2 kroki copy czekają) | Funkcja z niewłaściwymi uprawnieniami (revoke/grant) lub błędna kolejność RPC → signOut |
| 2. Widok ustawień           | Komponenty współdzielone, copy, `/settings`, nota na `/login`, luki kitu, zrzuty; smoke 39/39 | Przestylowanie shadcn Dialog poza tokeny; copy spoza kitu bez rejestracji |
| 3. Wdrożenie                | `link` + `db push` (człowiek), preview, produkcja, `deploy-plan.md`/`CLAUDE.md` | Merge przed `db push` → produkcyjne `?error=delete`                            |

**Prerequisites:** Docker + `npx supabase start` lokalnie; `SUPABASE_DB_PASSWORD` w `.env` do `supabase link` (Faza 3, człowiek); dostęp do Supabase Dashboard do weryfikacji.
**Estimated effort:** ~3 sesje (po jednej na fazę); Faza 3 zawiera krok ręczny właściciela.

## Open Risks & Assumptions

- Kaskada `auth.users` → `auth.identities/sessions/refresh_tokens` to standardowy schemat Supabase Auth; sprawdzane w Studio w Fazie 1 (1.5).
- `signInWithPassword` przy weryfikacji obecnego hasła tworzy po stronie serwera sesję, której nie zapisujemy — akceptowany efekt uboczny.
- Kit może w rundzie 3 dostarczyć własny formularz zmiany hasła (G23) — wtedy kompozycja może wymagać korekty, kontrakt endpointu nie.
- Zmiana kolejności kroków smoke: użytkownik smoke jest usuwany przed logowaniem seeded usera; dwa kroki `contains` są czerwone między Fazą 1 a 2 (zaplanowane).

## Success Criteria (Summary)

- Użytkownik zmienia hasło na `/settings` bez wylogowania; nowe hasło loguje, stare nie.
- Użytkownik usuwa konto po wpisaniu `USUŃ`; ląduje na `/login` z notą, stare hasło nie loguje, e-mail jest wolny, konto nie istnieje w Supabase.
- `npm run smoke` 39/39 lokalnie i w CI; produkcja przechodzi ten sam cykl ręcznie na jednorazowym koncie.
