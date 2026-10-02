# Bramka wizualna — `santander-card-merchants` (`/patterns`, `/patterns/<klucz>`, `/fixed`)

Źródło: `http://localhost:4399` (lokalny `astro dev` + lokalne Supabase), 2026-10-02. Zrzuty PNG: Playwright 1.55
(zainstalowany poza repo, w scratchpadzie sesji), headless systemowy Chrome (`channel: "chrome"`), skrypt poza repo.
Claude-in-Chrome (przeglądarka wybrana na preflight, dziedziczona, nigdy nie przełączana) posłużył do kontroli
szczegółu pizzerii w maju w prawdziwym Chrome — patrz `../reviews/visual-review.md`. Klatki kitu z
`file://…/design/rytm-os/prototype/views/{patterns,pattern-wolt,fixed}.html`. Pasek `astro dev` ukryty
wstrzykniętym stylem. Desktop 1280×900, mobile 400×812, `deviceScaleFactor` 1, każdy zrzut `fullPage`; na
mobilnych zrzutach dolna nawigacja (`position: fixed`) wypada na dole viewportu, nie na dole strony.

## Konta i dane

Dwa świeże lokalne konta przez `/register` (`visual-s11-<szerokość>-<ts>@rytm.local`), jedno na viewport; nigdy
seedowe `test@rytm.local`. Dane wyłącznie przez kreator `/imports/new` (plik → Dalej → Dalej → „Importuj N
obciążeń”), wyłącznie syntetyczne fixture'y, w tej kolejności:

1. ING: `test/fixtures/ing/Lista_transakcji_nr_0000123456_010926.csv` → „Dodaliśmy 206 obciążeń.”
2. Santander PLN: `test/fixtures/santander/historia_2026-08-31_61109012340001111222233334.csv` → „Dodaliśmy 184 obciążenia.”

Prawdziwe eksporty nie były otwierane. Po bramce `npx supabase db reset` (0 kont `visual-%`, 0 transakcji).

## Stany

| Stan | desktop | mobile | Jak osiągnięty / co widać | kit |
| --- | --- | --- | --- | --- |
| lista wzorców (ING + Santander) | `patterns-list-desktop.png` | `patterns-list-mobile.png` | `/patterns` po obu importach; jeden wiersz „PIZZERIA TRZY SERY” 10 · 777,87 zł, „Bankomat” 3 · 750,00 zł, „Wypłata BLIK” osobno | `kit-patterns-*` |
| lista filtrowana „pizzeria” | `patterns-filtered-pizzeria-desktop.png` | `patterns-filtered-pizzeria-mobile.png` | wpisane „pizzeria” w „Szukaj sprzedawcy”; 1 wiersz, stopka „1 wzorzec · wszystkie miesiące” | `kit-patterns-*` |
| szczegół pizzerii (miesiąc domyślny) | `pattern-pizzeria-desktop.png` | `pattern-pizzeria-mobile.png` | klik w wiersz z listy filtrowanej → `/patterns/pizzeria%20trzy%20sery`; sierpień: 1 wystąpienie (ING) 67,07 zł; selektor miesięcy: 8 miesięcy z obu banków | `kit-pattern-wolt-*` |
| szczegół pizzerii, maj 2026 (oba banki) | `pattern-pizzeria-may-desktop.png` | `pattern-pizzeria-may-mobile.png` | `?month=2026-05`; 2 wystąpienia, 171,10 zł: 26.05 ING (BLIK) 99,10 zł + 22.05 Santander (karta) 72,00 zł | `kit-pattern-wolt-*` |
| szczegół `Bankomat` (miesiąc domyślny) | `pattern-bankomat-desktop.png` | `pattern-bankomat-mobile.png` | `/patterns/bankomat`; sierpień bez wystąpień → „Brak wystąpień w tym miesiącu.” (G31) | `kit-pattern-wolt-*` |
| szczegół `Bankomat`, lipiec 2026 | `pattern-bankomat-july-desktop.png` | `pattern-bankomat-july-mobile.png` | `?month=2026-07`; 1 wystąpienie 250,00 zł, surowy opis wypłaty z bankomatu | `kit-pattern-wolt-*` |
| koszty stałe | `fixed-desktop.png` | `fixed-mobile.png` | `/fixed`: „Zmieniły kwotę” 4, „Nowe w tym miesiącu” 3, „Bez zmian” 4 — pozycje z obu banków | `kit-fixed-*` |
| klatki kitu | `kit-{patterns,pattern-wolt,fixed}-{desktop,mobile}.png` | | prototyp `views/*.html` | — |

## Zmierzone

- `document.documentElement.scrollWidth` = szerokość viewportu (1280 / 400) we wszystkich 14 zrzutach aplikacji.
  Klatka kitu `kit-patterns-mobile` ma 772 px przy 400 (kit przewija stronę); aplikacja przewija tabelę wewnątrz
  panelu (sprzed tego slice'u).
- Klawiatura (Playwright, desktop): lista — fokus początkowy `body`, Tab: nawigacja → „+ Wgraj CSV” → wyszukiwarka →
  sortowanie → nazwa sprzedawcy → „Otwórz wzorzec”; wszystkie `:focus-visible`. Enter na wierszu → szczegół, fokus
  `body`; Tab: „Wróć do wzorców” → „Akcje” → przełącznik progu → pole → „Ustaw próg” → selektor miesiąca. Dialog
  „Akcje”: fokus na kontenerze, nie na „Wyklucz z analizy”; Esc zamyka, fokus wraca na „Akcje”.
