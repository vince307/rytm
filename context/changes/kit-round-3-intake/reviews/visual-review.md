# Visual review — `kit-round-3-intake` (F-04: auth states, `/home`, `/patterns`, `/fixed`, `/settings`)

Step: visual gate of run `2026-10-02-kit-round-3`, 2026-10-02, branch `feat/kit-round-3-intake`, Progress row 3.6.
The slice swaps in round 3 of the design kit and re-binds copy (no redesign). The gate checks that every state the
plan's `[visual]` row lists still renders in its pre-swap layout with the new copy: no `undefined`, no unfilled
`{n}`/`{month}`, no page-level horizontal scroll. Each state was compared with the round-3 kit frames `login`,
`reset`, `register`, `home`, `patterns`, `fixed` and `settings-password-invalid`. Screenshots, accounts and the state
table are in `../screenshots/README.md`.

## Capture method

- **PNG set:** Playwright 1.55, installed outside the repo, driving headless system Chrome. Desktop was 1280×900 and
  mobile 400×812, full page, on `astro dev --port 4399`. Auth states were captured logged out. App states used one
  fresh account per viewport, registered through `/register`. The synthetic ING main fixture went in through the
  real `/imports/new` wizard ("Dodaliśmy 206 obciążeń."). Result: 8 app states × 2 + 7 kit frames × 2 = 30 PNGs,
  0 NOT CAPTURED.
- **Claude-in-Chrome:** the browser chosen at preflight was inherited. `tabs_context_mcp` worked, and no browser was
  selected or switched. The agent opened its own tab and signed in to the desktop visual account through
  `/api/auth/signin`. It opened `/fixed`, where headed Chrome showed the same state as the PNG: "Zmieniły kwotę" /
  "Nowe w sierpniu" / "Bez zmian", amounts 59,99 (poprzednio 55,99, +4,00) · 129,00 · 1500,00 · 39,00 · 24,99 zł,
  and `scrollWidth` 1512 = `innerWidth`. The tab was closed afterwards.
- The PNGs come from Playwright because Chrome screenshots are not written to the repo.

## States (row 3.6): 8 states × 2 viewports

| State | Verdict |
| --- | --- |
| `/login?error=1` | AuthLayout split, the same as kit `login`. The inline alert reads "Nie rozpoznaliśmy tego e-maila i hasła. Spróbuj ponownie." above the form. |
| `/reset` | Kit `reset` layout: "Odzyskaj dostęp." form, side panel "Hasło można ustawić na nowo." |
| `/reset?sent=1` | Sent state: eyebrow "Sprawdź skrzynkę", h1 "Link jest w drodze.", "Wróć do logowania". |
| `/register`, 3-char password | Field error "Hasło musi mieć co najmniej 6 znaków.": `{n}` is filled with 6 and the field is marked invalid. The kit `register` layout includes "Imię opcjonalne". |
| `/home` | Pre-swap layout: two stat cards, "Ponad progiem w tym miesiącu" 0,00 zł ("0,00 zł względem lipca") and "Koszty stałe" 1752,98 zł ("1 pozycja podrożała"). Then the 12-month trend (wrz 25 … sie 26) with the no-threshold hint, and the import panel. The < 3-month trend note does not apply, because the fixture spans 12 months. See observation 1 for the kit difference. |
| `/patterns` | 7 headers, labels mapped to body order: Sprzedawca / Typ / Wystąpienia / Suma / Kwota / Próg / Ponad progiem. "Ponad progiem" is present. Each header sits over its own values (JAN PRZYKŁADOWY: Suma 18 000,00 zł, Kwota 1500,00 zł). At 400 px the table scrolls inside its panel and the page stays at 400. |
| `/fixed` | Kit `fixed` sections. The second title is now "Nowe w sierpniu" (`fillMonthLocative`), replacing "Nowe w tym miesiącu". |
| `/settings`, short new password | Kit `settings-password-invalid` state: error "Hasło musi mieć co najmniej 6 znaków." under "Nowe hasło", with `{n}` filled. |

Page level: `scrollWidth` equals the viewport width (1280 / 400) in all 16 app shots. `innerText` contains no
`undefined` and no `{…}` placeholder in any of them. Tokens: no view markup changed beyond copy bindings. The
colours seen are the existing token set.

## Hand-checked number: "Koszty stałe" = 1752,98 zł, "1 pozycja podrożała"

Oracle `test/fixtures/ing/expected.json` gives the fixed-type patterns. Their imported rows in the reference month
2026-08, in grosze, are:
kinoteka 5999 + przelew-konto-osobiste (JAN PRZYKŁADOWY) 150000 + muzykalnia 2499 + silownia-ruch 12900 +
kawa-testowa.pl 3900 = **175298 gr = 1752,98 zł** ✓. Both cards and the `/fixed` amounts show this.

Change vs 2026-07: kinoteka 5599 → 5999, so **+400 gr = +4,00 zł**, 1 item risen ✓ ("1 pozycja podrożała", "+4,00
zł"). silownia-ruch is absent in July, so it is new ✓ ("Nowe w sierpniu" 1, "pierwsze wystąpienie · 05.08.2026").
The other 3 items are unchanged ✓ ("Bez zmian" 3).

## Keyboard path

Not re-measured. The slice changes copy strings and one header-label mapping. No focusable element, dialog or
destructive action was added or moved (impl-review: diff limited to `copy.ts`, `format.ts`, `table-columns.ts` and
copy reads in pages). The S-11 gate's keyboard measurements on `/patterns` still describe the same DOM order.

## Discrepancies and fixes

1. **Register row `/home` in `context/foundation/design-kit.md` described the kit view wrongly.** It said "2
   stat-cardy (C5) … lista wzorców". The round-3 kit frame `home.html` shows one "Ponad progiem" card, a full-width
   trend and a "Koszty stałe" summary panel (Podrożały / Nowe, "Zobacz zmiany"). `dashboard.stats` still has 2
   entries, and the second one feeds the panel. C5 drops "Rozpoznane wydatki" / "Co wraca najczęściej". The row was
   rewritten to describe the kit, plus the app's state until S-15. Fixed in `0bb4588` (doc only, no code, so the
   gate was not re-run).

No app-side discrepancy against row 3.6: every state is in its pre-swap layout with the round-3 copy.

## Observations (not fixed, not blocking; each owned by a later slice)

1. **`/home` layout differs from the round-3 kit** (2 cards + import panel vs 1 card + "Koszty stałe" panel). The
   plan forbids a redesign in F-04. Roadmap S-15's outcome adopts the round-3 layout.
2. **`/patterns` column order is Suma before Kwota; the kit has Kwota before Suma.** This is the accepted
   `tableHeaders` mapping. Follow-up S-14 in `follow-ups/review-fixes.md` swaps the body cells. It is also part of
   the 3.8 `[human]` row.
3. **Form fields render white, while round-3 C3 says fields use `paper`.** This is visible on `/login`,
   `/register` and `/settings`. It belongs to S-12 (auth/settings rebinding), not F-04.
4. **Kit patterns frame shows "Pokaż więcej" and "Wykluczone"; the app lists all 31 patterns.** This is S-14
   territory (round-3 change list).

VISUAL: PASS — all 8 states of row 3.6 captured at 1280 + 400 px (16 app PNGs, Playwright) against 7 round-3 kit frames, Chrome cross-check of /fixed; no undefined, no unfilled {n}/{month}, no page-level horizontal scroll; "Koszty stałe" 5999+150000+2499+12900+3900 = 1752,98 zł hand-checked against the ING oracle; one register-row text fix (0bb4588), layout deltas to the round-3 kit belong to S-12/S-14/S-15
