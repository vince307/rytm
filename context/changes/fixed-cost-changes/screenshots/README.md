# Bramka wizualna — `fixed-cost-changes` (`/fixed`, „Koszty stałe”)

Źródło: `http://localhost:4399` (lokalny `astro dev` + lokalne Supabase), 2026-09-28. Zrzuty PNG: Playwright 1.55
(zainstalowany poza repo, w scratchpadzie sesji), headless systemowy Chrome (`channel: "chrome"`), skrypt i CSV-y
w scratchpadzie (nie w repo). Claude-in-Chrome (przeglądarka wybrana na preflight, dziedziczona, nigdy nie
przełączana) posłużył do przejścia US-04 w prawdziwym Chrome — patrz `../reviews/visual-review.md`. Klatki kitu
z `file://…/design/rytm-os/prototype/views/{fixed,fixed-empty}.html`. Pasek `astro dev` ukryty wstrzykniętym stylem.
Desktop 1440×900, mobile 400×812, `deviceScaleFactor` 1, każdy zrzut `fullPage`. Na mobilnych zrzutach `fullPage`
dolna nawigacja (`position: fixed`) wypada w środku strony — artefakt zrzutu całej strony (jak w poprzednich
bramkach). Repo nie ma testu screenshotowego — to nie są baseline'y. Wszystkie zrzuty aplikacji powstały **po**
poprawkach tej bramki (`29c4829`).

## Konta (świeże, lokalne, przez `/register`; nigdy seedowe `test@rytm.local`)

Każdy stan = osobne konto `visual-fixed-<stan>-<ts>@rytm.local`, dane wyłącznie przez kreator `/imports/new`
(plik → Dalej → Dalej → „Importuj N obciążeń”). Pliki „crafted” to podzbiory syntetycznego fixture'u F-02
(`Lista_transakcji_nr_0000123456_010926.csv`) zbudowane skryptem poza repo: te same wiersze, poprawione `Zakres dat`
i `Liczba transakcji` (pola sum w preambule nie są czytane przez parser i zostały bez zmian), zapisane w cp1250.

| Konto         | Plik                                                                                                                                                                          | Obciążenia | Decyzje w UI                                                                                                                                                                      |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| pre           | —                                                                                                                                                                             | 0          | —                                                                                                                                                                                 |
| overview      | fixture główny                                                                                                                                                                | 206        | po zrzucie `fixed-overview`: `kinoteka` → „Akcje” → „Wyklucz z analizy” (→ `fixed-excluded`); potem w Claude-in-Chrome „Przywróć” w banerze (przejście US-04 w prawdziwym Chrome) |
| no-comparison | tylko 2026-08                                                                                                                                                                 | 20         | —                                                                                                                                                                                 |
| gap-month     | 2026-06 + 2026-08 (lipiec pusty)                                                                                                                                              | 38         | —                                                                                                                                                                                 |
| decrease      | 2026-07 + 2026-08, KINOTEKA 17.08 `-59,99` → `-50,99`                                                                                                                         | 37         | —                                                                                                                                                                                 |
| double-charge | 2026-07 + 2026-08 + drugi KINOTEKA 24.08.2026 `-59,99` (nowy `Nr transakcji`)                                                                                                 | 38         | —                                                                                                                                                                                 |
| no-fixed      | 2026-07 + 2026-08, tylko STACJA PALIW DROGOWSKAZ, KINO ŚWIATŁO, KINOTEKA                                                                                                      | 13         | `/patterns`: DROGOWSKAZ i KINO ŚWIATŁO „częsty”, KINOTEKA „stały” → „Wyklucz z analizy”                                                                                           |
| long-name     | 2026-07 + 2026-08 + „PRZEDSIĘBIORSTWO USŁUG TELEKOMUNIKACYJNYCH I INTERNETOWYCH SZEROKOPASMOWY ŚWIAT SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ” 12.07 `-89,00` / 12.08 `-94,00` | 39         | —                                                                                                                                                                                 |

`fixed-read-error`: konto overview; `REVOKE SELECT ON public.transactions FROM authenticated` (`docker exec … psql`,
poza transakcją — żądanie HTTP idzie innym połączeniem, więc `BEGIN … ROLLBACK` nie wywoła błędu na stronie), zrzut,
a potem `npx supabase db reset` w tym samym kroku. Po resecie: `has_table_privilege('authenticated',
'public.transactions','select')` = `t`, 0 kont `visual-%`. Po smoke'u drugi `db reset` (seed przywrócony).

## Stany

| Stan                       | desktop (1440×900)                | mobile (400×812)                 | Jak osiągnięty                                                                                                                           | kit                    |
| -------------------------- | --------------------------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| `fixed-pre-import`         | `fixed-pre-import-desktop.png`    | `fixed-pre-import-mobile.png`    | konto bez importu                                                                                                                        | `kit-fixed-empty-*`    |
| `fixed-overview` (= US-04) | `fixed-overview-desktop.png`      | `fixed-overview-mobile.png`      | fixture: Zmieniły 1 (KINOTEKA +4,00), Nowe 1 (SIŁOWNIA RUCH), Bez zmian 3                                                                | `kit-fixed-*`          |
| `fixed-no-comparison`      | `fixed-no-comparison-desktop.png` | `fixed-no-comparison-mobile.png` | jeden miesiąc: „Żaden koszt stały nie zmienił kwoty…”, „Nie ma poprzedniego miesiąca do porównania.”, Bez zmian 13                       | — (G34)                |
| `fixed-gap-month`          | `fixed-gap-month-desktop.png`     | `fixed-gap-month-mobile.png`     | czerwiec + sierpień: Zmieniły 3 (ZUS −75,88, US −152,00, KINOTEKA +4,00 vs czerwiec), Nowe = komunikat braku porównania                  | — (G34)                |
| `fixed-decrease`           | `fixed-decrease-desktop.png`      | `fixed-decrease-mobile.png`      | KINOTEKA 50,99 zł, `−5,00 zł` w `green` (`rgb(46,92,80)` = `#2E5C50`)                                                                    | — (G34)                |
| `fixed-double-charge`      | `fixed-double-charge-desktop.png` | `fixed-double-charge-mobile.png` | dwa obciążenia KINOTEKA w sierpniu (17.08 59,99, 24.08 59,99): wiersz pokazuje zmianę z 17.08 (+4,00), nie ukrytą za niezmienionym 24.08 | —                      |
| `fixed-excluded`           | `fixed-excluded-desktop.png`      | `fixed-excluded-mobile.png`      | KINOTEKA wykluczona przez dialog S-05: „Zmieniły kwotę · 0 pozycji” + pusta linia                                                        | — (G34)                |
| `fixed-no-fixed`           | `fixed-no-fixed-desktop.png`      | `fixed-no-fixed-mobile.png`      | same wzorce częste + jeden wykluczony stały: trzy puste linie, „0 pozycji” ×3                                                            | — (G34)                |
| `fixed-read-error`         | `fixed-read-error-desktop.png`    | `fixed-read-error-mobile.png`    | REVOKE (patrz wyżej): `InlineAlert` error „Błąd — sprawdź plik CSV.” pod tytułem (K18, jak `/patterns`)                                  | — (K18)                |
| `fixed-long-name`          | `fixed-long-name-desktop.png`     | `fixed-long-name-mobile.png`     | nazwa 110+ znaków w „Zmieniły kwotę”; przy 400 px nazwa się zawija, kolumna kwot 94,00 zł / +5,00 zł w pionie (`.fixed-change` ≤ 560 px) | `kit-fixed-mobile.png` |

## Zmierzone (`getBoundingClientRect`, computed style, piksele PNG)

- Każdy stan: `scrollWidth` = szerokość viewportu (1440 / 400) — brak poziomego przewijania.
- Wiersze: zwykły 70 px, kompaktowy 55 px (kit `.fixed-row` 70 / `.compact` 55); szerokość listy 974 px (desktop) /
  334 px (400 px) — padding 20 / 14 px jak kit `.fixed-list`.
- Delta wzrostu: `rgb(126,87,38)` = `#7E5726` (`excess-text`), 13 px, 700 — identycznie jak kit `.fixed-change b`.
- Odznaka `nowy`: tło `#E7DCC9` (aplikacja, `bg-excess/25` na `paper`) vs `#EFE4D1` (kit), tekst `#7E5726` w obu,
  11 px, padding 3/8 px, radius pełny — notatka G34.
- Znak sprzedawcy: 30×30, radius **8 px** po poprawce (przed: 14 px z `rounded-lg` motywu; kit 8 px).
- `fixed-long-name` mobile, przed poprawką: kolumna kwot ściśnięta do „94,00 / zł” i „+5,00 / zł”, a ZUS „1512,30 / zł”
  (wiersz 166 px). Po poprawce kwoty w jednej linii, wiersz ZUS 70 px (był 73), długi wiersz 166 px przez samą
  zawiniętą nazwę.
