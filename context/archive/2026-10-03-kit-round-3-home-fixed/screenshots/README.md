# Bramka wizualna — `kit-round-3-home-fixed` (S-15)

Źródło: `http://localhost:4399` (lokalny `astro dev` + lokalne Supabase), 2026-10-03, gałąź `feat/kit-round-3-home-fixed`.
PNG robił Playwright 1.55 (poza repo, `$TMPDIR/pw`) w headless systemowym Chrome (`channel: "chrome"`); skrypty w
scratchpadzie. Desktop 1280×900, mobile 400×812, `deviceScaleFactor` 1, `fullPage` (stan fokusu: sam viewport). Pasek
`astro dev` ukryty. Klatki kitu: `file://…/design/rytm-os/prototype/views/*.html` (ikony sprite'a nie renderują się z
`file://` — artefakt podglądu). Na `fullPage` mobile stały dolny pasek nawigacji zasłania środek strony — artefakt zrzutu,
kit wygląda tak samo. 22 stany × 2 szerokości = 44 PNG aplikacji + 14 klatek kitu × 2 = 28; razem 72.

`home-data`, `home-demo`, `home-one-month`, `home-full` zrobione ponownie po poprawce `c9574d7` (5 px pod wartością
słupka). Pozostałe zrzuty `/home` mają tylko słupki zerowe albo kadr fokusu — poprawka ich nie zmienia widocznie.

## Konta i dane

- `test@rytm.local` (seed): import syntetycznego ING przez kreator `/imports/new`. Najpierw bez progu (`home-no-threshold`),
  potem przez edytor próg „Liczba na miesiąc” = 3 na STACJA PALIW DROGOWSKAZ.
- `demo@rytm.local` (seed, `DEMO_EMAIL`): import ING przez kreator, bez progu.
- `vg15-{empty,one,full,nochg,nonew}-<ts>@rytm.local` (rejestracja) + `POST /api/imports` (format smoke, nagłówek `Origin`):
  - `one`: maj 2026 — Sklep smoke 12,99, Kawiarnia smoke 45,50 (jeden miesiąc);
  - `full`: maj — Sklep 12,99, Kawiarnia 45,50, Siłownia 129,00; czerwiec — Sklep 12,99, Kawiarnia 47,00, Siłownia 99,00, Piekarnia 8,00;
  - `nochg`: maj — Sklep 12,99; czerwiec — Sklep 12,99, Piekarnia 8,00;
  - `nonew`: maj — Kawiarnia 45,50; czerwiec — Kawiarnia 47,00;
  - `empty`: bez importu.
- Błędy odczytu: `revoke select on public.transactions from authenticated`, trzy zrzuty, potem `npx supabase db reset`.
  Na koniec kroku drugi `db reset` (po smoke) — wszystkie dane testowe usunięte.

## Stany (desktop `-desktop.png`, mobile `-mobile.png`)

| Stan | plik | Jak osiągnięty | kit |
| --- | --- | --- | --- |
| `/home` z progiem, 12 miesięcy, słupek sie 26 + słupki zerowe (notka zera) | `home-data` | test, po progu | `kit-home`, `kit-home-no-name` |
| `/home` bez progu (obie notki legendy, same zera) | `home-no-threshold` | test, przed progiem | `kit-home-no-name` |
| `/home` fokus „Zobacz zmiany” | `home-focus-fixed-link` | Shift+Tab + focus, potem Enter → `/fixed` | — |
| `/home` jeden miesiąc (bez stopki delty, `tooShort`, 0 kosztów / 0 kosztów) | `home-one-month` | `one` | — |
| `/home` dwa miesiące: Podrożały 1 (tylko wzrost), Nowe 1 | `home-full` | `full` | `kit-home-no-name` |
| `/home` Podrożały 0 · Nowe 1 / Podrożały 1 · Nowe 0 | `home-no-changes`, `home-no-new` | `nochg`, `nonew` | — |
| `/home` przed importem | `home-empty` | `empty` | `kit-home-empty` |
| `/home` demo | `home-demo` | demo | `kit-home-demo` |
| `/home` błąd odczytu | `home-read-error` | revoke | — |
| `/fixed` ING (wszystkie sekcje danych z fiksturki) | `fixed-ing` | test | `kit-fixed` |
| `/fixed` wzrost + spadek, nowy, bez zmian | `fixed-full` | `full` | `kit-fixed` |
| `/fixed` bez miesiąca porównania | `fixed-one-month` | `one` | `kit-fixed-no-month` |
| `/fixed` bez zmian kwot | `fixed-no-changes` | `nochg` | `kit-fixed-no-changes` |
| `/fixed` bez nowych + pusta „Bez zmian” | `fixed-no-new` | `nonew` | `kit-fixed-no-new` |
| `/fixed` przed importem | `fixed-empty` | `empty` | `kit-fixed-empty` |
| `/fixed` błąd odczytu | `fixed-read-error` | revoke | `kit-fixed-error` |
| szczegół wzorca — błąd odczytu | `detail-read-error` | revoke, `/patterns/stacja paliw drogowskaz` | — |
| `/reset/new` panel wizualny (bez sesji → wygasły) | `reset-new`, `reset-new-expired` | wylogowany | `kit-reset-new`, `kit-reset-new-expired` |
| tytuł wyniku importu | `import-result` | `/imports/result?id=…` (import ING) | `kit-imports-result` |
| krok rachunku Santander | `santander-account-step` | kreator, fiksturka Santander, „Dalej” | `kit-imports-account` |
