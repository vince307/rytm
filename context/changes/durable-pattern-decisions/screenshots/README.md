# Bramka wizualna — `durable-pattern-decisions` (`/patterns`, `/patterns/<key>`, dialogi `/settings` i `/imports`)

Źródło: `http://localhost:4399` (lokalny `astro dev` + lokalne Supabase), 2026-09-28. Zrzuty PNG: Playwright 1.55
(zainstalowany poza repo w `$TMPDIR/pw`), headless systemowy Chrome (`channel: "chrome"`), skrypty w scratchpadzie
sesji. Claude-in-Chrome (przeglądarka wybrana na preflight) posłużył do sprawdzenia bfcache (5.9) w prawdziwym,
nie-headless Chrome — patrz `../reviews/visual-review.md`. Prototyp kitu serwowany lokalnie z `design/rytm-os/`
(`python3 -m http.server 4398`, tylko na czas zrzutów kitu). Pasek `astro dev` ukryty stylem wstrzykniętym przez
`addInitScript`. Desktop 1440×900, mobile 400×812, `deviceScaleFactor` 1. Stany strony — `fullPage`; stany z
otwartym dialogiem — sam viewport (dialog jest `position: fixed`). Na mobilnych zrzutach `fullPage` dolna nawigacja
(`position: fixed`) wypada w środku strony — artefakt zrzutu całej strony (tak samo w poprzednich bramkach).
Repo nie ma testu screenshotowego — to nie są baseline'y. Wszystkie zrzuty aplikacji powstały **po** poprawkach tej
bramki (`c14f75a`).

## Konta (świeże, lokalne, przez formularz `/register`; nigdy seedowe `test@rytm.local`)

- **A** — `visual-decisions-a-<ts>@rytm.local`, jeden import głównego wyciągu fixture'u
  `Lista_transakcji_nr_0000123456_010926.csv` przez kreator `/imports/new` (plik → Dalej → Dalej → „Importuj 206
  obciążeń”), 30 wzorców. Wszystkie decyzje przez dialog „Akcje” / „Przywróć” / „Cofnij scalenie” w UI:
  1. `sportowo.pl` → „Scal z…” → `SPORTOWO` → „Scal” (`?merged=1` na `/patterns/sportowo`);
  2. `/patterns/sportowo` → „Zmień nazwę” → „Sportowo” → „Zapisz nazwę”;
  3. `kawiarnia filiżanka` (częsty) → „Zmień typ” → stały;
  4. `jan przykładowy` (przelew na konto osobiste) → „Wyklucz z analizy”; „Przywróć” w banerze (klawiaturą: fokus +
     Enter); ponownie „Wyklucz z analizy”;
  5. `/patterns` → „Wykluczone” → „Przywróć”; na końcu „Cofnij scalenie” na `/patterns/sportowo`.
- **B** — `visual-decisions-b-<ts>@rytm.local`, jeden import `Lista_transakcji_nr_0000123457_011026-overlap.csv`
  (na świeżym koncie bez nakładania, 4 wzorce: ZUS, `kawa-testowa.pl`, MUZYKALNIA, KAWIARNIA FILIŻANKA). Trzy
  pierwsze wykluczone przez dialog → czwarty nie ma celów scalenia (`merge-none`); potem wykluczony czwarty
  (`list-all-excluded`). Na B także dialogi `/settings` i `/imports` (5.8) oraz bfcache (5.9, Claude-in-Chrome).

Po sesji `npx supabase db reset` (konta i dane wizualne usunięte).

## Stany

| Stan | desktop (1440×900) | mobile (400×812) | Jak osiągnięty | kit |
| --- | --- | --- | --- | --- |
| `detail-actions-closed` | `detail-actions-closed-desktop.png` | `detail-actions-closed-mobile.png` | A, `/patterns/sportowo.pl`; przycisk „Akcje” 99 px po prawej / 364 px (pełna szerokość) przy 400 | `kit-pattern-detail-*` |
| `actions-dialog` | `actions-dialog-desktop.png` | `actions-dialog-mobile.png` | klik „Akcje” | `kit-actions-dialog-*` |
| `merge-picker` | `merge-picker-desktop.png` | `merge-picker-mobile.png` | „Scal z…” (30 celów) | — (G33) |
| `merge-none` | `merge-none-desktop.png` | `merge-none-mobile.png` | B, jedyny niewykluczony wzorzec: „Scal z…” nieaktywne + „Brak innych wzorców do scalenia.” | — (G33) |
| `rename-field` | `rename-field-desktop.png` | `rename-field-mobile.png` | „Zmień nazwę” (pole z „sportowo.pl”) | — (G33) |
| `rename-error` | `rename-error-desktop.png` | `rename-error-mobile.png` | `?error=name` (pole ma `maxLength=100`, więc UI tego nie wywoła) | — (G33) |
| `merge-error` | `merge-error-desktop.png` | `merge-error-mobile.png` | `?error=merge` | — (G33) |
| `decision-error` | `decision-error-desktop.png` | `decision-error-mobile.png` | `?error=decision` | — (G33) |
| `pending` | `pending-desktop.png` | `pending-mobile.png` | „Scal z…” → `SPORTOWO` → „Scal”; nawigację formularza zatrzymał wstrzyknięty `window` listener `submit` (faza bąbelkowa, po handlerze Reacta) — nic nie zostało wysłane | — (G33) |
| `merged-result` | `merged-result-desktop.png` | `merged-result-mobile.png` | prawdziwe scalenie → `/patterns/sportowo?merged=1`, „Scalone warianty: sportowo.pl · Cofnij scalenie” | — (G33) |
| `absorbed-redirect` | `absorbed-redirect-desktop.png` | `absorbed-redirect-mobile.png` | GET `/patterns/sportowo.pl` → 302 → `/patterns/sportowo` (łańcuch przekierowań z Playwright) | — (G33) |
| `renamed-result` | `renamed-result-desktop.png` | `renamed-result-mobile.png` | `/patterns/sportowo?renamed=1`, h1 „Sportowo” | — (G33) |
| `typed-result` | `typed-result-desktop.png` | `typed-result-mobile.png` | `kawiarnia filiżanka?typed=1`, odznaka „stały”, edytor „Akceptowana kwota” | kit toast „Typ wzorca zmieniony.” (K22) |
| `excluded-banner` | `excluded-banner-desktop.png` | `excluded-banner-mobile.png` | `jan przykładowy?excluded=1` | `kit-excluded-banner-*` |
| `restored-result` | `restored-result-desktop.png` | `restored-result-mobile.png` | „Przywróć” w banerze (Enter) → `?restored=1` | kit toast (K22) |
| `list-excluded-closed` | `list-excluded-closed-desktop.png` | `list-excluded-closed-mobile.png` | A, `/patterns`, 29 wierszy + „Wykluczone 1 wzorzec” | `kit-patterns-excluded-closed-*` |
| `list-excluded-open` (= US-03 walk-through) | `list-excluded-open-desktop.png` | `list-excluded-open-mobile.png` | klik `<summary>` | `kit-patterns-excluded-open-*` |
| `list-restored` | `list-restored-desktop.png` | `list-restored-mobile.png` | „Przywróć” w sekcji → `/patterns?restored=1` | — |
| `list-all-excluded` | `list-all-excluded-desktop.png` | `list-all-excluded-mobile.png` | B, 4 z 4 wykluczone: tabela „0 wzorców” + sekcja „4 wzorce” (otwarta) | — (G33) |
| `unmerged-result` | `unmerged-result-desktop.png` | `unmerged-result-mobile.png` | „Cofnij scalenie” → `/patterns/sportowo?unmerged=1` | — (G33) |
| `settings-delete-dialog` (5.8) | `settings-delete-dialog-desktop.png` | `settings-delete-dialog-mobile.png` | B, `/settings` → „Usuń konto” (tylko otwarcie; niczego nie potwierdzono) | `kit-settings-delete-dialog-*` |
| `imports-delete-dialog` (5.8) | `imports-delete-dialog-desktop.png` | `imports-delete-dialog-mobile.png` | B, `/imports` → „Usuń import” (otwarcie) | `kit-imports-delete-dialog-*` |

## Zmierzone w trakcie zrzutów (`getBoundingClientRect`, computed style)

- Każdy stan: `scrollWidth` = szerokość viewportu (1440 / 400) — brak poziomego przewijania strony.
- `DialogContent` (akcje, usunięcie konta, usunięcie importu): desktop x 480, szerokość **480**, padding 31 px,
  radius 13 px; mobile x **20**, szerokość 360 (margines 20 px z obu stron); overlay `ink` / 0.44. Kit `.modal`:
  480 / 360 przy x 20 — zgodne. Przycisk zamknięcia 17×17 przy `top 18 / right 19`; tekst eyebrow kończy się na
  x 651 / 644 / 625 (desktop) i 191 / 184 / 165 (mobile), zamknięcie zaczyna się na x 923 / 343 — bez kolizji.
- Najwyższy dialog na 400×812: `rename-field` 596 px (dół 704 < 812) — mieści się; F8 (brak przewijania na
  niskich ekranach) pozostaje otwarte dla viewportów niższych niż ~650 px.
- Przyciski akcji w dialogu po poprawce: pełna szerokość kolumny, 416 px (desktop, x 512–928) / 296 px (mobile,
  x 52–348) wobec kitu 418 / 298 — różnica 2 px to 1 px obramowania `border-line` modalu aplikacji (kit `.modal` go
  nie ma; obramowanie sprzed S-05).
