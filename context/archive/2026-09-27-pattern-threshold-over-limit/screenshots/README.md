# Bramka wizualna — `pattern-threshold-over-limit` (`/patterns` kolumny Próg / Ponad progiem, `/patterns/<key>`)

Źródło: `http://localhost:4399` (lokalny `astro dev` + lokalne Supabase), zrzuty z 2026-09-27 przez Playwright
(biblioteka 1.55 z cache `npx`, headless systemowy Chrome, `channel: "chrome"`; skrypty poza repo, w scratchpadzie
sesji). Claude-in-Chrome nie był użyty (wymaga wyboru przeglądarki przez człowieka). Prototyp kitu serwowany lokalnie
z `design/rytm-os/` (`python3 -m http.server 4398`, tylko na czas zrzutów). Pasek narzędzi `astro dev` ukryty stylem
wstrzykniętym w trakcie zrzutu. Na zrzutach mobilnych `fullPage` dolna nawigacja (`position: fixed`) wypada w środku
strony — to artefakt zrzutu całej strony, tak samo w kicie (`kit-pattern-wolt-mobile.png`).

Pliki to prawdziwe PNG; stany strony `fullPage: true`, `editor-*` to zrzut samego panelu „Próg wzorca”, `link-focus-*`
i `list-table-scrolled-mobile` — sam viewport. Repo nie ma testu screenshotowego, więc nie są baseline'em. Wszystkie
zrzuty aplikacji powstały **po** poprawkach tej bramki (`0a6973d` wyrównanie do kitu, `b72601a` tło pola na `paper` + G32).

Konto: świeże lokalne `visual-threshold-<timestamp>@rytm.local`, zarejestrowane przez formularz `/register` (nigdy
seedowe `test@rytm.local`), z jednym importem głównego wyciągu fixture'u `Lista_transakcji_nr_0000123456_010926.csv`
(rachunek `Rachunek Firmowy Główny`, 206 obciążeń, 2025-09-01 – 2026-08-31) — payload zbudowany
`parseIngStatement` + `buildImportPayload` z `src/lib/import/ing.ts` i wysłany `POST /api/imports`. Miesiąc odniesienia
= 2026-08 (najpóźniejszy w danych). Progi ustawione przez prawdziwy formularz edytora:

| Wzorzec | Typ | Próg | Jak ustawiony |
| --- | --- | --- | --- |
| `stacja paliw drogowskaz` | częsty | liczba 2 / miesiąc | myszą |
| `kino światło` | częsty | suma 100,00 zł / miesiąc | tylko klawiaturą (Tab → „Suma na miesiąc”, Spacja, Tab, „100”, Enter) |
| `kawa-testowa.pl` | stały | kwota 35,00 zł | myszą |
| `kinoteka` | stały | kwota 50 → usunięty | zapis myszą, „Usuń próg” klawiaturą (Tab, Enter) |
| `allegro` | częsty | „abc” → odrzucone | myszą (`?error=value`) |

## Stany (plan 6.8 / 6.9 / 6.10)

| Stan | desktop (1440×900) | mobile (400×812) | kit (prototyp) |
| --- | --- | --- | --- |
| `list-with-thresholds` — Próg dla count/sum/amount, Ponad progiem 834,69 zł / 4,00 zł / „—” | `list-with-thresholds-desktop.png` | `list-with-thresholds-mobile.png`, `list-table-scrolled-mobile.png` (panel przewinięty do strzałki) | `kit-patterns-desktop.png`, `kit-patterns-mobile.png` |
| `detail-default` — `kino światło`, bez `?month`, sierpień | `detail-default-desktop.png` | `detail-default-mobile.png` | `kit-pattern-wolt-desktop.png`, `kit-pattern-wolt-mobile.png` |
| `editor-count` — `stacja…`, „2” | `editor-count-desktop.png` | `editor-count-mobile.png` | panel „Próg wzorca” w `kit-pattern-wolt-*` |
| `editor-sum` — `kino światło`, „Suma na miesiąc” aktywne, „100,00” | `editor-sum-desktop.png` | `editor-sum-mobile.png` | — (kit renderuje tylko przełącznik) |
| `editor-amount` — `kawa-testowa.pl`, „Akceptowana kwota”, „35,00 zł” | `editor-amount-desktop.png` (+ `detail-amount-desktop.png`) | `editor-amount-mobile.png` (+ `detail-amount-mobile.png`) | — (kit: wariant `stały` w `thresholdEditor`) |
| `over-limit-marked` — 3 z 5 znaków `excess`, 3 odznaki „ponad próg”, 834,69 zł | `over-limit-marked-desktop.png` | `over-limit-marked-mobile.png` | `kit-pattern-wolt-*` |
| `no-threshold` — `kinoteka` po usunięciu: „brak ustawionego progu”, „Ustaw próg” | `no-threshold-desktop.png` | `no-threshold-mobile.png` | — |
| `empty-month` — `przykładowa firma jan przykładowy`, `?month=2026-08` (brak wystąpień) | `empty-month-desktop.png` | `empty-month-mobile.png` | — (G31) |
| `saved` — `?month=2026-08&saved=1` | `saved-desktop.png` | `saved-mobile.png` | — (kit: toast, G30/G31) |
| `removed` — `?month=2026-08&removed=1` | `removed-desktop.png` | `removed-mobile.png` | — (kit: toast) |
| `error-value` — `?month=2026-08&error=value` | `error-value-desktop.png` | `error-value-mobile.png` | — (G31) |
| `error-read` — wymuszony błąd odczytu | `error-read-desktop.png` | `error-read-mobile.png` | — (K18) |
| `not-found` — `/patterns/nie-ma-takiego-wzorca`, HTTP 404 | `not-found-desktop.png` | `not-found-mobile.png` | — (G31) |
| `month-other` — `kino światło` `?month=2026-07`: „Ponad progiem w lipcu 28,25 zł” | `month-other-desktop.png` | `month-other-mobile.png` | — (G31) |
| `link-focus` — Tab na link wiersza, potem na strzałkę | `link-focus-row-desktop.png`, `link-focus-arrow-desktop.png` | `link-focus-row-mobile.png`, `link-focus-arrow-mobile.png` | — (kit nie definiuje fokusu) |

`error-read`: na czas jednego żądania `revoke select on public.pattern_thresholds from authenticated` w lokalnej bazie
(→ `loadThresholds` zwraca błąd 42501, strona pokazuje `InlineAlert error`), zaraz potem `grant select … to
authenticated`; po przywróceniu uprawnienia `authenticated` = `DELETE,INSERT,SELECT,UPDATE` (sprawdzone). Kod
aplikacji nie był zmieniany na potrzeby zrzutu, Supabase nie był zatrzymywany.

## Zmierzone w trakcie zrzutów

- Brak poziomego przewijania strony: `scrollWidth` = szerokość viewportu na liście i na każdym szczególe (1440 i 400).
- Lista 1440 px (po poprawce): tabela 1014 px = panel 1014 px, strzałka widoczna bez przewijania (przed poprawką
  tabela 1091 px w panelu 1014 px — strzałka ukryta za przewijaniem na desktopie).
- Lista 400 px: tabela 924 px w panelu 363 px (`overflow-auto`), po przewinięciu (`scrollLeft` 561) strzałka ma
  `right` = 365 < 400 — osiągalna.
- 6.10: klik linku z listy otwiera szczegół (200, poprawny `h1`) dla `kawa-testowa.pl` (kropka),
  `kino%20%C5%9Bwiat%C5%82o` (spacja + diakrytyki) i `piekarnia%20k%C5%82osek%20%C5%82%C3%B3d%C5%BA`.
- Klawiatura, szczegół: Tab → … → „Wróć do wzorców” → „Liczba na miesiąc” → „Suma na miesiąc” → pole wartości →
  „Zapisz próg” → „Usuń próg”; każdy z `:focus-visible`. Enter w polu wysyła formularz; po przekierowaniu fokus
  wraca na `body` (pełne przeładowanie, linia statusu nad edytorem).
- Klawiatura, lista: Tab → wyszukiwanie → sortowanie → link wiersza → strzałka „Otwórz wzorzec” (pierścień 3 px
  `ink/15`), Enter na strzałce otwiera szczegół.
