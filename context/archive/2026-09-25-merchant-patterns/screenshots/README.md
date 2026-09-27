# Bramka wizualna — `merchant-patterns` (`/patterns`)

Źródło: `http://localhost:4399` (lokalny `astro dev` + lokalne Supabase), zrzuty z 2026-09-27 przez Playwright
(bibliotekę z cache `npx`, headless systemowy Chrome, `channel: "chrome"`). Claude-in-Chrome nie był użyty: do sesji
podłączone są dwie przeglądarki, a narzędzie wymaga wyboru przez człowieka (patrz `reviews/visual-review.md`).
Prototyp kitu serwowany lokalnie z `design/rytm-os/` (`python3 -m http.server`, tylko do zrzutów). Pasek narzędzi
`astro dev` ukryty stylem wstrzykniętym w trakcie zrzutu — nie jest częścią aplikacji.

Pliki to prawdziwe PNG z viewportu (bez konwersji JPEG), `fullPage: true`. Wystarczają do oceny kompozycji; repo nie
ma testu screenshotowego, więc nie są baseline'em.

Konta: `lista` / `wyszukiwanie` / `sortowanie-nazwa` / `brak-wyników` — świeże lokalne konto
`visual-patterns-<timestamp>@rytm.local` z zaimportowanym `test/fixtures/ing/Lista_transakcji_nr_0000123456_010926.csv`
przez `/imports/new` (206 obciążeń). `pusty` — seedowe `test@rytm.local` (bez importu; smoke tego wymaga).

## Stany

| Stan                                 | desktop (1440×900)                                                                               | mobile (375×812)              | kit (prototyp)                                                      |
| ------------------------------------ | ------------------------------------------------------------------------------------------------ | ----------------------------- | ------------------------------------------------------------------- |
| `lista` — 31 wierszy, sort. suma     | `lista-desktop.png`                                                                              | `lista-mobile.png`            | `kit-lista-desktop.png`, `kit-lista-mobile.png`                     |
| `wyszukiwanie` — `kin`               | `wyszukiwanie-desktop.png`                                                                       | `wyszukiwanie-mobile.png`     | `kit-wyszukiwanie-desktop.png`, `kit-wyszukiwanie-mobile.png` (`w`) |
| `sortowanie-nazwa`                   | `sortowanie-nazwa-desktop.png`                                                                   | `sortowanie-nazwa-mobile.png` | — (kit ma ten sam `select`)                                         |
| `brak-wyników` — `zzzz`              | `brak-wynikow-desktop.png`                                                                       | `brak-wynikow-mobile.png`     | — (kit nie ma tego stanu; plan: pusta treść, stopka „0 wzorców”)    |
| `pusty` — konto bez importu          | `pusty-desktop.png`                                                                              | `pusty-mobile.png`            | `kit-pusty-desktop.png`, `kit-pusty-mobile.png`                     |
| fokus klawiatury — pole wyszukiwania | `fokus-szukaj-desktop.png`                                                                       | —                             | —                                                                   |
| fokus klawiatury — sortowanie        | `fokus-sortowanie-desktop.png`                                                                   | —                             | —                                                                   |
| `błąd`                               | not captured — tylko przegląd kodu (plan 3.8; brak bezpiecznego sposobu wywołania błędu odczytu) | —                             | —                                                                   |

Zrzuty `brak-wynikow-*`, `fokus-*` i pozostałe powstały **po** poprawkach tej bramki (G29): widoczny fokus pól paska
i brak natywnego przycisku czyszczenia `type="search"`.

## Zmierzone w trakcie zrzutów

- `lista`: 31 wierszy, stopka „31 wzorców · wszystkie miesiące”, pierwszy wiersz `ZAKŁAD UBEZPIECZEŃ SPOŁECZNYCH`
  20 015,11 zł; `KINOTEKA` `stały` 635,88 zł / Kwota 52,99 zł; brak poziomego przewijania strony (tabela przewija się
  wewnątrz panelu na 375 px, jak kitowe `.table-wrap{overflow:auto}`).
- `wyszukiwanie` `kin`: 2 wiersze `KINO ŚWIATŁO`, `KINOTEKA`, stopka „2 wzorce · wszystkie miesiące”.
- `sortowanie-nazwa`: `ADAM TESTOWY`, `ALLEGRO`, `apteka-przyklad.pl` (porównanie `localeCompare(…, "pl")`).
- `brak-wyników`: 0 wierszy, stopka „0 wzorców · wszystkie miesiące”.
- `pusty`: h1 „Wzorce pojawią się po pierwszym imporcie.”, karta `ViewEmpty` z CTA „Wgraj CSV ↗” — zgodne z
  `kit-pusty-*`.
- Ścieżka Tab (desktop): logo → Wyjdź → 5 linków nawigacji → „+ Wgraj CSV” → wyszukiwanie → sortowanie → koniec
  strony. Po poprawce obramowanie opakowania pola w fokusie = `rgb(32, 47, 64)` (`ink`) + pierścień 3 px `ink/8`.
