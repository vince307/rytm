# Bramka wizualna — `kit-round-3-imports` (S-13)

Źródło: `http://localhost:4399` (lokalny `astro dev` + lokalne Supabase), 2026-10-02/03, gałąź
`feat/kit-round-3-imports` (kod jak w `5707d1a`, czyli po poprawkach z bramki). Zrzuty PNG: Playwright 1.55
(zainstalowany poza repo), headless systemowy Chrome (`channel: "chrome"`), skrypt w scratchpadzie (poza repo).
Claude-in-Chrome (przeglądarka wybrana na preflight, dziedziczona, nigdy nie przełączana) posłużył do sprawdzenia
bfcache (F8) i ekranu wyniku w prawdziwym Chrome — patrz `../reviews/visual-review.md`. Klatki kitu rundy 3 z
`file://…/design/rytm-os/prototype/views/imports*.html`, dialog kitu przez `openModal('deleteImport')` (z
`demoMode=true` dla wersji demo). Pasek `astro dev` ukryty wstrzykniętym stylem. Desktop 1280×900, mobile 400×812,
`deviceScaleFactor` 1, `fullPage`; przed każdym zrzutem czekamy, aż skończą się animacje (`document.getAnimations()`),
żeby dialog nie był złapany w połowie wejścia.

## Konta i dane

- Konto testowe z seeda `test@rytm.local` (zgodnie z planem). Dane wyłącznie przez kreator `/imports/new`:
  ING główny (`Lista_transakcji_nr_0000123456_010926.csv`, 206 obciążeń) i Santander
  (`historia_2026-08-31_61109012340001111222233334.csv`, 184 obciążenia). Oba importy usunięte na koniec przez dialog.
- Konto demo `demo@rytm.local` (`DEMO_EMAIL` w `.env`): pierwszy import ING przez kreator (dozwolony, bo konto
  puste), potem stany demo. Importu demo nie da się cofnąć przez UI, więc na koniec `npx supabase db reset`.
- Pliki odrzuceń: fixture'y repo (`…-no-header.csv` → nieznany format, `…-currency.csv` → zła waluta) oraz trzy
  pliki wygenerowane w scratchpadzie (nigdy w repo): Santander z jednym wpływem (pusty), 6 MB śmieci (za duży),
  Santander z 5100 obciążeniami (za dużo).

## Stany (32 × 2 widoki = 64 PNG + 38 klatek kitu)

| Stan | desktop | mobile | Jak osiągnięty | kit |
| --- | --- | --- | --- | --- |
| historia, pusta | `imports-empty-desktop.png` | `imports-empty-mobile.png` | `/imports`, konto bez importów | `kit-imports-empty-*` |
| historia, ING + Santander | `imports-list-desktop.png` | `imports-list-mobile.png` | po dwóch importach | `kit-imports-*` |
| `?deleted=1` (lista) | `imports-deleted-desktop.png` | `imports-deleted-mobile.png` | dialog → „Usuń import” (pierwszy z dwóch) | `kit-imports-deleted-*` |
| `?deleted=1` (pusta) | `imports-deleted-empty-desktop.png` | `imports-deleted-empty-mobile.png` | usunięcie ostatniego importu | — |
| `?error=delete` | `imports-error-delete-desktop.png` | `imports-error-delete-mobile.png` | URL (cel przekierowania POST delete) | `kit-imports-delete-error-*` |
| `?error=missing` | `imports-error-missing-desktop.png` | `imports-error-missing-mobile.png` | URL | `kit-imports-not-found-*` |
| `?error=demo` | `imports-error-demo-desktop.png` | `imports-error-demo-mobile.png` | URL, konto testowe | — |
| dialog usunięcia | `dialog-normal-desktop.png` | `dialog-normal-mobile.png` | fokus na „Usuń import”, Enter | `kit-imports-dialog-*` |
| krok 1, pusty | `new-step1-empty-desktop.png` | `new-step1-empty-mobile.png` | `/imports/new` | `kit-imports-new-*` |
| krok 1, rozpoznany (chip) | `new-step1-recognised-desktop.png` | `new-step1-recognised-mobile.png` | plik ING | `kit-imports-new-*` |
| krok 1, nieznany format | `new-step1-unknown-desktop.png` | `new-step1-unknown-mobile.png` | `…-no-header.csv` | `kit-imports-error-unknown-*` |
| krok 1, zła waluta | `new-step1-currency-desktop.png` | `new-step1-currency-mobile.png` | `…-currency.csv` | `kit-imports-error-currency-*` |
| krok 1, pusty plik | `new-step1-empty-file-desktop.png` | `new-step1-empty-file-mobile.png` | Santander z samym wpływem | `kit-imports-error-empty-*` |
| krok 1, za duży | `new-step1-too-large-desktop.png` | `new-step1-too-large-mobile.png` | plik 6 MB | `kit-imports-error-large-*` |
| `?error=invalid` | `new-error-invalid-desktop.png` | `new-error-invalid-mobile.png` | URL (odrzucony POST) | `kit-imports-error-inconsistent-*` |
| `?error=failed` | `new-error-failed-desktop.png` | `new-error-failed-mobile.png` | URL | — (K28) |
| `?error=demo` (konto testowe) | `new-error-demo-desktop.png` | `new-error-demo-mobile.png` | URL | — |
| `?error=overlap&from&to` | `new-error-overlap-desktop.png` | `new-error-overlap-mobile.png` | URL | `kit-imports-overlap-*` |
| krok 2, wybór rachunku | `new-step2-account-desktop.png` | `new-step2-account-mobile.png` | ING, 2 rachunki | `kit-imports-account-*` |
| krok 3, gotowy (ING) | `new-step3-ready-desktop.png` | `new-step3-ready-mobile.png` | „Importuj 206 obciążeń” | `kit-imports-summary-*` |
| krok 3, gotowy (Santander) | `new-step3-santander-desktop.png` | `new-step3-santander-mobile.png` | „Importuj 184 obciążenia” | `kit-imports-summary-*` |
| krok 3, nakładanie | `new-step3-overlap-desktop.png` | `new-step3-overlap-mobile.png` | ING ponownie po imporcie | `kit-imports-overlap-*` |
| krok 3, za dużo | `new-step3-too-many-desktop.png` | `new-step3-too-many-mobile.png` | Santander 5100 obciążeń | `kit-imports-error-many-*` |
| wynik ING | `result-ing-desktop.png` | `result-ing-mobile.png` | po imporcie | `kit-imports-result-*` |
| wynik Santander | `result-santander-desktop.png` | `result-santander-mobile.png` | po imporcie; „Rachunek · •• 3334” | `kit-imports-result-*` |
| wynik, nie znaleziono | `result-not-found-desktop.png` | `result-not-found-mobile.png` | `?id=00000000-0000-4000-8000-000000000000` | `kit-imports-result-not-found-*` |
| demo, historia | `demo-imports-list-desktop.png` | `demo-imports-list-mobile.png` | konto demo z importem | — |
| demo, dialog | `demo-dialog-desktop.png` | `demo-dialog-mobile.png` | przycisk wyłączony + notka | `kit-imports-dialog-demo-*` |
| demo, `/imports?error=demo` | `demo-imports-error-demo-desktop.png` | `demo-imports-error-demo-mobile.png` | URL | — |
| demo, krok 1 zablokowany | `demo-new-locked-desktop.png` | `demo-new-locked-mobile.png` | `/imports/new` | — |
| demo, `?error=demo` | `demo-new-error-demo-desktop.png` | `demo-new-error-demo-mobile.png` | URL; zdanie tylko raz (InfoAlert) | — |
| demo, zablokowany + `?error=overlap` | `demo-new-locked-overlap-desktop.png` | `demo-new-locked-overlap-mobile.png` | URL; po poprawce F7 bez „Wybierz inny plik” | — |
| klatki kitu | `kit-imports*-{desktop,mobile}.png` | | prototyp rundy 3 `views/imports*.html` (17) + dialog normalny/demo | — |

Nieosiągalne (zgodnie z planem): krok 3 demo zablokowany (P5) — konto demo jest blokowane już w kroku 1.

## Zmierzone

- `document.documentElement.scrollWidth` = szerokość viewportu (1280 / 400) we wszystkich 64 zrzutach aplikacji.
- `document.body.innerText` bez `undefined` i bez nieuzupełnionych `{…}` we wszystkich 64 zrzutach.
- Dialog przy 400 px mieści się w viewporcie: `getBoundingClientRect` tuż po otwarciu (jeszcze w trakcie animacji
  zoom-in) 29–371 × 233–579 (demo) i 29–371 × 269–543 (normalny) przy 400×812; na zrzucie po animacji ok. 20–380 px
  szerokości — brak przycięcia.
