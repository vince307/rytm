# Bramka wizualna — `over-limit-trend` (`/home`, „Przegląd miesiąca”)

Źródło: `http://localhost:4399` (lokalny `astro dev` + lokalne Supabase), 2026-09-28. Zrzuty PNG: Playwright 1.55
(zainstalowany poza repo), headless systemowy Chrome (`channel: "chrome"`), skrypty i przycięte CSV-y w scratchpadzie
sesji (nie w repo). Claude-in-Chrome (przeglądarka wybrana na preflight, dziedziczona, nigdy nie przełączana) posłużył
do przejścia US-05 (wiersz 4.13) w prawdziwym Chrome — patrz `../reviews/visual-review.md`. Klatki kitu z
`file://…/design/rytm-os/prototype/views/{home-no-name,home-empty}.html`. Pasek `astro dev` ukryty wstrzykniętym
stylem. Desktop 1440×900, mobile 400×812, `deviceScaleFactor` 1, każdy zrzut `fullPage`; na mobilnych zrzutach dolna
nawigacja (`position: fixed`) wypada w środku strony — artefakt zrzutu całej strony (jak w poprzednich bramkach).
Repo nie ma testu screenshotowego — to nie są baseline'y. **Wszystkie zrzuty aplikacji powstały po poprawce tej
bramki (`c095e37`).**

## Konta (świeże, lokalne, przez `/register`; nigdy seedowe `test@rytm.local`)

Jedno konto na stan (`visual-home-<stan>-<ts>@rytm.local`), oba viewporty z tego samego konta. Dane wyłącznie przez
kreator `/imports/new` (plik → Dalej → Dalej → „Importuj N obciążeń”), progi przez edytor na `/patterns/<klucz>`
(„Liczba na miesiąc” → wartość → „Ustaw próg”), wykluczenie przez dialog S-05 „Akcje” → „Wyklucz z analizy”.
Pliki przycięte = podzbiory miesięcy syntetycznego fixture'u F-02 (`Lista_transakcji_nr_0000123456_010926.csv`):
te same wiersze, poprawione `Zakres dat` i `Liczba transakcji`, zapisane w cp1250.

| Stan                 | Plik                                   | Progi / decyzje w UI                                                |
| -------------------- | -------------------------------------- | ------------------------------------------------------------------- |
| `home-pre-import`    | —                                      | —                                                                   |
| `home-no-threshold`  | fixture (12 miesięcy)                  | brak                                                                |
| `home-fixture-trend` | to samo konto co wyżej                 | `kino światło` liczba 1, `stacja paliw drogowskaz` liczba 1         |
| `home-one-month`     | tylko 2026-08 (21 wierszy)             | `stacja paliw drogowskaz` liczba 1                                  |
| `home-two-months`    | 2026-07 + 2026-08 (40)                 | `kino światło` 1, `stacja paliw drogowskaz` 1                       |
| `home-gap-month`     | 2026-06 + 2026-08, lipiec pusty (42)   | `kino światło` 1, `stacja paliw drogowskaz` 1                       |
| `home-excluded`      | fixture                                | `kino światło` 1, potem „Akcje” → „Wyklucz z analizy” na tym wzorcu |
| `home-read-error`    | konto `home-fixture-trend`             | `REVOKE SELECT ON public.transactions FROM authenticated` (niżej)   |

`home-read-error`: `docker exec supabase_db_rytm psql … REVOKE …` poza transakcją (żądanie HTTP idzie innym
połączeniem, więc `BEGIN … ROLLBACK` nie wywoła błędu na stronie), zrzut, potem `npx supabase db reset` w tym samym
kroku. Po resecie: `has_table_privilege('authenticated','public.transactions','select')` = `t`, 0 kont `visual-%`.
Po smoke'u drugi `db reset` (seed przywrócony).

## Stany

| Stan                 | desktop                          | mobile                          | Co widać                                                                                                   | kit                   |
| -------------------- | -------------------------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------- | --------------------- |
| `home-pre-import`    | `home-pre-import-desktop.png`    | `home-pre-import-mobile.png`    | „Zacznij od pierwszego importu.” + panel pustego stanu, „Wgraj CSV ↗” — tekst w tekst jak kit              | `kit-home-empty-*`    |
| `home-no-threshold`  | `home-no-threshold-desktop.png`  | `home-no-threshold-mobile.png`  | 12 słupków 0,00 zł (2 px kikut), stat 0,00 zł, stopka „0,00 zł względem lipca”, podpowiedź braku progu     | —  (G35)              |
| `home-fixture-trend` | `home-fixture-trend-desktop.png` | `home-fixture-trend-mobile.png` | 12 podpisanych słupków, stat 955,34 zł, „+646,35 zł względem lipca”, „Koszty stałe” 1752,98 zł · 1 pozycja | `kit-home-no-name-*`  |
| `home-one-month`     | `home-one-month-desktop.png`     | `home-one-month-mobile.png`     | 1 słupek sie 26 955,34 zł, panel „Trend pojawi się po 3 miesiącach danych.”, brak stopki delty             | kit `.info-panel`     |
| `home-two-months`    | `home-two-months-desktop.png`    | `home-two-months-mobile.png`    | lip 26 308,99 / sie 26 955,34 zł, panel tooShort, stopka „+646,35 zł względem lipca”                       | kit `.info-panel`     |
| `home-gap-month`     | `home-gap-month-desktop.png`     | `home-gap-month-mobile.png`     | tylko cze 26 41,24 / sie 26 955,34 zł (brak słupka lipca), panel tooShort, brak stopki delty              | — (G35)               |
| `home-excluded`      | `home-excluded-desktop.png`      | `home-excluded-mobile.png`      | jedyny wzorzec z progiem wykluczony: 12 × 0,00 zł + podpowiedź braku progu                                 | — (G35)               |
| `home-read-error`    | `home-read-error-desktop.png`    | `home-read-error-mobile.png`    | tytuł + `InlineAlert` „Błąd — sprawdź plik CSV.” (K18, jak `/patterns`, `/fixed`)                          | — (K18)               |
| `home-kit-compare`   | `home-kit-compare-desktop.png`   | `home-kit-compare-mobile.png`   | zestawienie obok siebie: `kit-home-no-name-*` (lewo) i `home-fixture-trend-*` (prawo), złożone z PNG-ów     | `kit-home-no-name-*`  |

## Zmierzone (`getBoundingClientRect`, `scrollWidth`)

- Każdy stan, oba viewporty: `document.documentElement.scrollWidth` = szerokość viewportu (1440 / 400) — brak
  poziomego przewijania strony.
- Każda suma na słupku mieści się w swojej kolumnie (`fits` dla 12/12, 2/2, 1/1): desktop kolumna 67 px, 400 px
  kolumna 44 px, najszersza suma („955,34 zł”, „308,99 zł”) 43 px.
- 400 px, 12 miesięcy: panel przewija się wewnątrz (`clientWidth` 328 / `scrollWidth` 625) i otwiera się na końcu osi —
  widoczne mar 26 … sie 26 (przed poprawką: wrz 25 … lut 26, miesiąc referencyjny poza ekranem).
- Geometria po poprawce: linia bazowa (`border-b` `<ol>`) = spód słupków (y 665 na desktopie), etykiety miesięcy
  6 px pod nią, legenda 31 px pod linią bazową (kit `.legend` `margin-top:31px`), linia siatki 100 px od góry `<ol>`
  (kit `.trend:before` `top:50%` z 200 px). Przed poprawką linia bazowa leżała pod etykietami.
