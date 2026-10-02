# Bramka wizualna — `santander-csv-import` (`/imports`, `/imports/new`, `/imports/result`)

Źródło: `http://localhost:4399` (lokalny `astro dev` + lokalne Supabase), 2026-10-02. Zrzuty PNG: Playwright 1.55
(zainstalowany poza repo, w scratchpadzie sesji), headless systemowy Chrome (`channel: "chrome"`), skrypt poza repo.
Claude-in-Chrome (przeglądarka wybrana na preflight, dziedziczona, nigdy nie przełączana) posłużył do kontroli
kroku 1 z plikiem Santander w prawdziwym Chrome — patrz `../reviews/visual-review.md`. Klatki kitu z
`file://…/design/rytm-os/prototype/views/imports*.html`. Pasek `astro dev` ukryty wstrzykniętym stylem.
Desktop 1440×900, mobile 400×812, `deviceScaleFactor` 1, każdy zrzut `fullPage`; na mobilnych zrzutach dolna
nawigacja (`position: fixed`) wypada na dole viewportu. Repo nie ma testu screenshotowego — to nie są baseline'y.

## Konta i dane

Dwa świeże lokalne konta przez `/register` (`visual-s10-<szerokość>-<ts>@rytm.local`), jedno na viewport; nigdy
seedowe `test@rytm.local`. Dane wyłącznie przez kreator `/imports/new` (plik → Dalej → Dalej → „Importuj N
obciążeń”), wyłącznie syntetyczne fixture'y:

- Santander PLN: `test/fixtures/santander/historia_2026-08-31_61109012340001111222233334.csv`
- Santander USD: `test/fixtures/santander/historia_2026-08-31_77109056780009998887776665.csv`
- ING: `test/fixtures/ing/Lista_transakcji_nr_0000123456_010926.csv`
- „nieznany format”: obraz `public/rytm/social/rytm-og-1200x630.png`

Kolejność na każdym koncie: lista pusta → krok 1 pusty → obraz → USD → ING → Santander → krok 2 → krok 3 →
import Santander (wynik) → ponownie Santander do kroku 3 (nakładanie) → ING do kroku 3 → import ING (wynik) →
lista. Po bramce `npx supabase db reset` (0 kont `visual-%`).

## Stany

| Stan | desktop | mobile | Co widać | kit |
| --- | --- | --- | --- | --- |
| lista pusta | `imports-list-empty-desktop.png` | `imports-list-empty-mobile.png` | „Nie masz jeszcze żadnego importu.” | `kit-imports-empty-*` |
| krok 1 pusty | `wizard-step1-empty-desktop.png` | `wizard-step1-empty-mobile.png` | linia `supported` z oboma bankami (K26) | `kit-imports-new-*` |
| krok 1 nieznany format | `wizard-step1-unknown-desktop.png` | `wizard-step1-unknown-mobile.png` | „**Nieznany format pliku.** Obsługujemy: ING Bank Śląski i Santander Bank Polska.” + „Wybierz inny plik” | `kit-imports-new-*` (`.import-errors`) |
| krok 1 USD | `wizard-step1-usd-desktop.png` | `wizard-step1-usd-mobile.png` | „**Waluta inna niż PLN.** …” + „Wybierz inny plik” | `kit-imports-new-*` |
| krok 1 ING gotowy | `wizard-step1-ing-ready-desktop.png` | `wizard-step1-ing-ready-mobile.png` | chip „… · rozpoznano format ING”, „Dalej” | — (kit `uploadReady`) |
| krok 1 Santander gotowy | `wizard-step1-santander-ready-desktop.png` | `wizard-step1-santander-ready-mobile.png` | chip „historia_… · rozpoznano format Santander”, „Dalej” | — (kit `uploadReady`, K26) |
| krok 2 Santander | `wizard-step2-santander-desktop.png` | `wizard-step2-santander-mobile.png` | „Rachunek · •• 3334”, „Santander Bank Polska · 187 transakcji”, „wybrane” | `kit-imports-account-*` |
| krok 3 Santander gotowy | `wizard-step3-santander-ready-desktop.png` | `wizard-step3-santander-ready-mobile.png` | „Santander · Rachunek · •• 3334”, 01.03–31.08.2026, 184 / 3 transakcje, „Importuj 184 obciążenia” | `kit-imports-summary-*` (G25) |
| krok 3 Santander nakładanie | `wizard-step3-santander-overlap-desktop.png` | `wizard-step3-santander-overlap-mobile.png` | „Ten zakres nachodzi na istniejący import: 1 marca – 31 sierpnia 2026. …”, „Wybierz inny plik” / „Wróć do importów” | `kit-imports-summary-*` |
| krok 3 ING gotowy | `wizard-step3-ing-ready-desktop.png` | `wizard-step3-ing-ready-mobile.png` | regresja ING: „ING · Rachunek Firmowy Główny · •• …”, „Importuj 206 obciążeń” | `kit-imports-summary-*` |
| wynik Santander | `result-santander-desktop.png` | `result-santander-mobile.png` | „Dodaliśmy 184 obciążenia.”, „Santander · Rachunek · 1 marca – 31 sierpnia 2026”, 184 transakcje | `kit-imports-result-*` (G26) |
| wynik ING | `result-ing-desktop.png` | `result-ing-mobile.png` | „Dodaliśmy 206 obciążeń.”, „ING · Rachunek Firmowy Główny · 1 września 2025 – 31 sierpnia 2026” | `kit-imports-result-*` (G26) |
| lista ING + Santander | `imports-list-desktop.png` | `imports-list-mobile.png` | dwa wiersze: „ING · Rachunek Firmowy Główny” 206, „Santander · Rachunek” 01.03–31.08.2026 184 | `kit-imports-*` |
| klatki kitu | `kit-imports{,-empty,-new,-account,-summary,-result}-{desktop,mobile}.png` | | prototyp `views/imports*.html` | — |

## Zmierzone

- `document.documentElement.scrollWidth` = szerokość viewportu (1440 / 400) we wszystkich 26 zrzutach aplikacji.
  Klatka kitu `kit-imports-mobile` ma 553 px przy 400 (kit sam przewija stronę); aplikacja przewija tabelę wewnątrz
  panelu (`overflow-auto`, sprzed tego slice'u).
- Fokus po wejściu w krok 2 i 3: nagłówek `h1` (`tabIndex=-1`), nigdy przycisk. Na liście i w kroku 1 fokus
  początkowy: `body`.
