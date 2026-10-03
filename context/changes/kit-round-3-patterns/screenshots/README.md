# Bramka wizualna — `kit-round-3-patterns` (S-14)

Źródło: `http://localhost:4399` (lokalny `astro dev` + lokalne Supabase), 2026-10-03, gałąź `feat/kit-round-3-patterns`.
PNG robił Playwright 1.55 (zainstalowany poza repo, `$TMPDIR/pw`) w headless systemowym Chrome (`channel: "chrome"`);
skrypty leżą w scratchpadzie. Desktop 1280×900, mobile 400×812, `deviceScaleFactor` 1, `fullPage` dla widoków
(dialogi i stany fokusu: sam viewport). Pasek `astro dev` ukryty; przed zrzutem skrypt czeka na koniec animacji.
Klatki kitu: `file://…/design/rytm-os/prototype/views/*.html` (merge / rename / deleteImport / deleteAccount przez
`openModal(...)`); ikony sprite'a kitu nie renderują się z `file://` — to artefakt podglądu, nie kitu.
Stany pustego widoku (`patterns-empty`, `fixed-empty`, `imports-empty`, `detail-not-found`) są zrobione po poprawce
`d70e3a0`. 35 stanów × 2 szerokości = 70 PNG aplikacji + 17 klatek kitu × 2 = 34; razem 104.

## Konta i dane

- `test@rytm.local` (seed): import syntetycznego ING (`test/fixtures/ing/Lista_transakcji_nr_0000123456_010926.csv`)
  przez kreator `/imports/new` → 31 wzorców. Przez UI: próg „Liczba na miesiąc” = 3 na STACJA PALIW DROGOWSKAZ,
  „Scal z…” sportowo.pl → SPORTOWO, „Wyklucz z analizy” na apteka-przyklad.pl (zostaje 29 wzorców na liście).
- `visual-s14-empty-<ts>@rytm.local` (rejestracja): stany puste.
- `visual-s14-single-<ts>@rytm.local` (rejestracja + jeden POST `/api/imports` z jednym sprzedawcą „Kwiaciarnia
  Bratek”, jak w smoke): jedyny wzorzec → „Scal z…” bez celów (merge-empty).
- Stany wyników i błędów (`?saved=1`, `?error=value|save|merge|name|decision`) przez URL — to cele przekierowań
  endpointów POST. Na koniec `npx supabase db reset` (dwa razy: przed i po smoke), co usunęło import i oba konta.

## Stany (desktop `-desktop.png`, mobile `-mobile.png`)

| Stan | plik | Jak osiągnięty | kit |
| --- | --- | --- | --- |
| lista domyślna (10 wierszy, „Pokaż więcej”, Wykluczone zwinięte) | `patterns-default` | `/patterns` | `kit-patterns` |
| lista rozwinięta, odznaki „zmiana kwoty” (KINOTEKA) i „nowy” (SIŁOWNIA RUCH) | `patterns-expanded` | „Pokaż więcej” | `kit-patterns` |
| wyszukiwanie poniżej rozmiaru strony | `patterns-search` | „kino” → 2 wzorce, bez przycisku | — |
| fokus wyszukiwania / sortowania | `patterns-search-focus`, `patterns-sort-focus` | Tab + focus | — |
| „Wykluczone” otwarte | `patterns-excluded-open` | rozwinięcie + `summary` | `kit-patterns` |
| pusta lista / puste `/fixed` / puste `/imports` | `patterns-empty`, `fixed-empty`, `imports-empty` | konto bez importu | `kit-patterns-empty`, `kit-fixed-empty`, `kit-imports-empty` |
| szczegół z progiem i znacznikami „ponad próg”, sekwencja | `detail-threshold` | STACJA PALIW, sie 2026 | `kit-pattern-detail` |
| zapisany próg | `detail-threshold-saved` | `?month=2026-08&saved=1` | — |
| bez progu | `detail-no-threshold` | ALLEGRO | — |
| `?error=value` / `?error=save` | `detail-error-value`, `detail-error-save` | URL | — |
| miesiąc bez wystąpień | `detail-no-occurrences` | PRZYKŁADOWA FIRMA JAN PRZYKŁADOWY (sie 2026) | `kit-pattern-no-occurrences` |
| nie znaleziono | `detail-not-found` | `/patterns/nie ma takiego wzorca` | `kit-pattern-not-found` |
| scalone warianty | `detail-merged` | SPORTOWO po scaleniu | `kit-pattern-actions` (lista w dialogu kitu) |
| baner wykluczenia | `detail-excluded` | apteka-przyklad.pl | — |
| fokus miesiąca / pola progu | `detail-month-focus`, `detail-threshold-focus` | Tab + focus | — |
| błędy akcji: merge / name / decision | `detail-error-merge`, `detail-error-name`, `detail-error-decision` | URL | `kit-pattern-actions-merge-error`, `kit-pattern-actions-rename-error` |
| dialog akcji: domyślny / „Scal z…” / „Zmień nazwę” | `dialog-default`, `dialog-merge`, `dialog-rename` | „Akcje” → przycisk | `kit-pattern-actions`, `kit-pattern-actions-merge`, `kit-pattern-actions-rename` |
| dialog: scalenie bez celów | `dialog-merge-empty` | konto z jednym wzorcem | `kit-pattern-actions-merge-empty` |
| `/imports` dialog usunięcia importu | `imports-delete-dialog` | „Usuń import” (bez wysyłki) | `kit-imports-delete-dialog` |
| `/settings`, formularz hasła otwarty | `settings`, `settings-form-open` | URL, „Zmień hasło” | `kit-settings` |
| dialog usunięcia konta: pusty / wypełniony | `settings-delete-dialog`, `settings-delete-dialog-filled` | „Usuń konto” (bez wysyłki) | `kit-settings-delete-dialog` |
| `/fixed` z odznaką „nowy” | `fixed` | URL | `kit-fixed` |
| fokus: przycisk główny / link powrotu | `focus-primary-button`, `focus-back-link` | Tab + focus na „Ustaw próg” / „Wróć do wzorców” | — |
