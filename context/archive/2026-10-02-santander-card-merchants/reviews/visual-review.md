# Visual review — `santander-card-merchants` (`/patterns`, `/patterns/<key>`, `/fixed`)

Step: visual gate of run `2026-10-01-m2-santander`, 2026-10-02, branch `feat/santander-card-merchants`, Progress row
4.6. Compared `src/pages/patterns.astro`, `src/pages/patterns/[...key].astro`, `src/pages/fixed.astro` (with
`src/components/patterns/PatternsTable.tsx`) against `design/rytm-os/prototype/views/{patterns,pattern-wolt,fixed}.html`.
Screenshots, accounts and the state table: `../screenshots/README.md`.

## Capture method

- **PNG set:** Playwright 1.55 (installed outside the repo) driving headless system Chrome, desktop 1280×900 and
  mobile 400×812, full page. One fresh account per viewport was registered through `/register` on `astro dev
  --port 4399`. Both synthetic fixtures came in through the real `/imports/new` wizard: ING main file (206 debits),
  then Santander main PLN file (184 debits). The real exports were not opened. Kit frames come from the prototype
  over `file://`. Result: 7 app states × 2 + 3 kit frames × 2 = 20 PNGs, 0 NOT CAPTURED.
- **Claude-in-Chrome:** the browser selected at preflight was inherited (`tabs_context_mcp` worked, no browser was
  selected or switched). The agent opened its own tab, signed in to the desktop visual account, and opened the
  pizzeria detail for May 2026. Headed Chrome rendered the same state as the PNG: "Suma w maju 171,10 zł",
  "2 wystąpienia", two marks, "maj 2026". The tab was closed afterwards.
- Why the PNGs come from Playwright: Chrome screenshots are not written to the repo, and Chrome's synthetic Tab
  presses do not move focus (S-10 gate), so the keyboard path was measured in Playwright too.

## States (row 4.6): 7 states × 2 viewports

| State | Verdict |
| --- | --- |
| `/patterns` list | Kit `patterns` table pattern: eyebrow, h1 "To, co wraca.", lead, "+ Wgraj CSV", search + sort, columns Sprzedawca / Typ / Wystąpienia / Suma / Kwota / Próg / Ponad progiem, arrow cell, footer. Exactly **one** "PIZZERIA TRZY SERY" row (10 · 777,87 zł), plus "Bankomat" (3 · 750,00 zł), "Wypłata BLIK" (2 · 250,00 zł) as its own pattern, "SIEC SPOZYWCZA DELTA", and "ABONAMENT SIEC PRZYKLAD" (stały). At 400 px the table scrolls inside its panel, and the page stays at 400 px. The kit frame overflows to 772 px. |
| list filtered "pizzeria" | One row, footer "1 wzorzec · wszystkie miesiące". No second pizzeria row (the cross-bank join holds in the UI). |
| pizzeria detail (default month) | Kit `pattern-wolt` layout: back link, "Akcje", type eyebrow, h1, month sum, threshold panel, occurrences panel with marks, "Transakcje z wyciągu". August holds 1 ING occurrence (67,07 zł). The month select lists 8 months spanning both banks (lis 2025 … sie 2026). |
| pizzeria detail, May 2026 | **One pattern holds both banks**: 26.05 ING BLIK line 99,10 zł and 22.05 Santander card line 72,00 zł, sum 171,10 zł, 2 marks. The long raw Santander line wraps inside the row at 400 px. |
| `Bankomat` detail (default month) | August has no withdrawal, so the page shows "Brak wystąpień w tym miesiącu." This is the existing G31 gap (`DESIGN-GAP: G31` in `[...key].astro`), not new. |
| `Bankomat` detail, July 2026 | 1 occurrence, 250,00 zł, the raw ATM line. The month select shows sie/lip/maj/mar 2026, matching the 3 oracle withdrawals plus the reference month. |
| `/fixed` | Kit `fixed` sections "Zmieniły kwotę" (4), "Nowe w tym miesiącu" (3), "Bez zmian" (4), with merchant tile, date · "poprzednio", amount, delta pill / "nowy". The ING items (e.g. KINOTEKA, MUZYKALNIA) and Santander items (e.g. DROGERIA PRZYKLAD, ABONAMENT SIEC PRZYKLAD) sit side by side. |

Tokens: this slice changes no view file. Its diff is limited to `src/lib/patterns/*` and tests, and no file under
`src/pages/` or `src/components/` changed (impl-review). Colours seen are the existing token set. Page level:
`scrollWidth` = viewport width (1280 / 400) in all 14 app shots.

## Hand-checked number: pizzeria = 10 occurrences, 777,87 zł

Oracles (`patterns[]` entry `pizzeria-trzy-sery` in each file):
- `test/fixtures/ing/expected.json`: `occurrences` 7, `sumMinor` 55087.
- `test/fixtures/santander/expected.json`: `occurrences` 3, `sumMinor` 22700. Its `crossBank` names this pattern
  with `oracle: test/fixtures/ing/expected.json`.

Independent recount from `rows[]` (imported rows of the two main files, `pattern = pizzeria-trzy-sery`):
- ING: 6707 + 11012 + 9910 + 6755 + 5479 + 4780 + 10444 = 55087 gr (7 rows).
- Santander: 11000 + 7200 + 4500 = 22700 gr (3 rows).

Total: 7 + 3 = **10** occurrences, and 55087 + 22700 = 77787 gr = **777,87 zł**. On screen, the list row and the
filtered row both show "10 · 777,87 zł" ✓.

Cross-check, May 2026: ING 9910 + Santander 7200 = 17110 gr = 171,10 zł, and the detail shows "171,10 zł · 2
wystąpienia" ✓. Bankomat: Santander 25000 + 30000 + 20000 = 75000 gr = 750,00 zł with 3 occurrences (ING has none),
and the list shows "3 · 750,00 zł" ✓.

The app's pattern key is the normalized merchant text (`/patterns/pizzeria%20trzy%20sery`). The oracle's
`pizzeria-trzy-sery` is the oracle's own slug label, not a URL, so a direct `/patterns/pizzeria-trzy-sery` gives the
not-found state. This is expected, not a defect.

## Keyboard path (Playwright, real key events, desktop account)

- `/patterns`: initial focus is `body`. Tab order: shell links → "+ Wgraj CSV" → "Szukaj sprzedawcy" → "Sortuj:" →
  per row the merchant link, then "Otwórz wzorzec". All are `:focus-visible`. After typing "pizzeria", Tab reaches the
  single pizzeria row.
- Enter on the pizzeria link leads to the detail page, where initial focus is `body`. Tab order: "Wróć do wzorców" →
  "Akcje" → "Liczba na miesiąc" / "Suma na miesiąc" → threshold input → "Ustaw próg" → month select.
- Enter on "Akcje" opens the dialog with focus on the **dialog container**, not on "Wyklucz z analizy". Tab order:
  "Scal z…" → "Zmień typ" → "Zmień nazwę" → "Wyklucz z analizy". Esc closes the dialog, and focus returns to
  "Akcje". No action was confirmed, and no `alert`/`confirm` was triggered.

## Discrepancies and fixes

None found. No code was changed, so the full gate was not re-run.

## Observations (not fixed, not blocking)

1. **The list at 400 px** scrolls the table inside its panel, so the Suma column is cut at the edge until the user
   scrolls. This predates S-11 (same as the S-10 gate's observation 1).
2. **The `Bankomat` detail opens on the reference month (August), which has no withdrawal**, so the first view is
   empty (G31). This is a general behaviour of sparse patterns and predates S-11.
3. **The Santander raw line shows the masked card number** (`DOP. VISA …******NNNN`). This is the user's own bank
   text, by design "opis surowy". The fixture uses synthetic masks.

VISUAL: PASS — all 7 states of row 4.6 captured at 1280 + 400 px (14 app PNGs) against 3 kit frames, one cross-bank pizzeria pattern (ING + Santander lines in one detail), no page-level horizontal scroll, keyboard path and dialog initial focus safe; pizzeria 7 + 3 = 10 occurrences / 550,87 + 227,00 = 777,87 zł hand-checked against both oracles; no fixes needed
