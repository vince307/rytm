# Visual review — `kit-round-3-patterns` (S-14: patterns list, pattern detail, actions dialog, shared field/dialog styles)

Step: visual gate of run `2026-10-02-kit-round-3`, 2026-10-03, branch `feat/kit-round-3-patterns`, Progress rows 8.6
and 8.7. Every state the plan's Phase 8 `[visual]` rows list is captured at 1280 px and 400 px and compared with the
round-3 kit frames. The gate also had to decide impl-review observation F5 (phone dialog title vs close glyph). The
state table, accounts and files are in `../screenshots/README.md`.

## Capture method

- **PNG set:** Playwright 1.55 (outside the repo) driving headless system Chrome on `astro dev --port 4399`. 35 app
  states × 2 viewports = 70 PNGs, plus 17 kit frames × 2 = 34; 104 in all, 0 NOT CAPTURED. Each shot records
  `scrollWidth`, a check for `undefined` / an unfilled `{…}` in `innerText`, the focused element with
  `:focus-visible`, and for dialogs the rects of the dialog, its title and its close button.
- **Claude-in-Chrome:** the preflight browser was inherited (no browser selected or switched); the agent opened its
  own tab, signed in as the seeded test user on :4399, and on `/patterns/allegro` clicked „Akcje”: initial focus was
  the dialog element itself (`DIV role=dialog`), Tab moved to „Scal z…” with `:focus-visible`, Esc closed the dialog
  and the ring sat on the „Akcje” trigger (focus returned). Tab closed afterwards. A first scripted `requestSubmit()`
  on the login form did not sign in; typing into the fields did.
- **Why both:** the extension's screenshots cannot be written to the change folder, so the PNG set comes from the
  fallback script; Chrome proved the keyboard path in a real headed browser (same split as S-12).
- **Data and cleanup:** everything reached through the product or by redirect-target URL (see README). Test data:
  one ING import, one threshold, one merge, one exclusion on `test@rytm.local`, two throwaway accounts. Removed by
  `npx supabase db reset`, run before and after the closing smoke. :4398 / :4399 killed, :4321 never touched.

## States

| Group | Verdict |
| --- | --- |
| List default / expanded | Kit `patterns`: toolbar (search + „Sortuj: suma”), columns Sprzedawca · Typ · Wystąpienia · Kwota · Suma · Próg · Ponad progiem, foot „29 wzorców · wszystkie miesiące” + „Pokaż więcej”. 10 rows, the button reveals the remaining 19 in the same sum order and disappears. Badges sit after the „—” in Ponad progiem as in kit: „zmiana kwoty” on KINOTEKA (17.08.2026 59,99 zł vs 55,99 zł before, the same pair `/fixed` shows), „nowy” on SIŁOWNIA RUCH (first seen 05.08.2026). At 400 px the table scrolls inside its panel, as kit mobile does. |
| Search / focus | „kino” narrows to KINO ŚWIATŁO + KINOTEKA, count line „2 wzorce”, no button. Search and sort fields focused by keyboard show the ink border + ring (`:focus-visible` true). |
| Excluded | „Wykluczone · 1 wzorzec” toggle under the table; open, the apteka-przyklad.pl row with „Przywróć” on the right. |
| Empty states | Kit `patterns-empty` / `fixed-empty` / `imports-empty`: eyebrow, title, lead, panel with ink mark, „Wgraj pierwszy wyciąg”, CTA „Wgraj CSV ↗”. Panel was left-aligned; fixed (Discrepancy 1). |
| Detail with threshold | Kit `pattern-wolt`: back link + „Akcje”, type chip + „WZORZEC”, name, lead; hero „Suma w sierpniu 1040,10 zł · 5 wystąpień”; threshold panel (switch, field, note, „Zapisz próg” + „Usuń próg”); sequence 3 ink + 2 excess marks with „W ramach progu / Ponad próg”; transactions with „ponad próg” chips on the 4th and 5th. |
| Detail other states | No threshold: „brak ustawionego progu”, „Ustaw próg”. `?error=value` → „Wpisz próg większy od zera.” (K36) inside the threshold panel; `?error=save` → save error. No occurrences (sie 2026): info line „Brak wystąpień w tym miesiącu.” + „Brak transakcji do pokazania w wybranym miesiącu.” (K37), as kit. Not found: „Nie znaleziono wzorca.” / „Mógł zniknąć po cofnięciu importu.” / „Wróć do wzorców”, now centred like kit. Merged: „Połączone nazwy · sportowo.pl · Cofnij scalenie” at the bottom of the transactions panel (decision 9). Excluded: banner „Wykluczony z analizy” with „Przywróć” at the right edge. Month select and threshold field show the focus ring. |
| Action errors | `?error=merge` „Nie można scalić tych wzorców.”, `?error=name`, `?error=decision`: one error alert under the back link (decision 4 — page alert, not in-dialog; `[human]` 8.9). |
| Actions dialog | Kit `patternActions`: eyebrow „AKCJE NA WZORCU”, „Zarządzaj wzorcem.”, lead, four full-width ghost buttons with icons. „Scal z…” reveals „Scal wzorce” + kit `mergeLead` + „Wzorzec” select + „Scal wzorce”; „Zmień nazwę” reveals „Zmień nazwę wzorca”, „Nowa nazwa” with placeholder ALLEGRO and empty value (F5 of the plan), hint, „Zapisz”. Merge-empty: info alert „Nie ma innych wzorców do scalenia.” + disabled „Scal wzorce”, as kit `mergeEmpty`. Initial focus on the dialog, never on „Wyklucz z analizy”. Heights at 400 px: 421 / 618 / 615 / 591 px of 812, nothing clipped. |
| Shared styles (8.7) | `/imports` delete dialog (eyebrow „COFNIJ IMPORT”, two-line title with the range, „Usuń import”, initial focus on the dialog) and `/settings` delete dialog (initial focus `#delete-current`, button enabled only with password + `USUŃ`) use the new 26 px / phone 22×18 px padding and 13 / 12 px radius; fields 8 px. `/settings` default and password form unchanged in layout. `/fixed` „nowy” badge in the excess tint, „+4,00 zł” on KINOTEKA. Keyboard focus on „Ustaw próg” and „Wróć do wzorców” shows the same ink/15 ring as before. |

Page level: in all 70 app shots `scrollWidth` equals the viewport (1280 / 400); `innerText` has no `undefined` and no
unfilled `{…}`. Colours are the existing tokens.

## Hand-checked number

STACJA PALIW DROGOWSKAZ, reference month sie 2026, threshold „Liczba na miesiąc” = 3 (set through the editor). August
transactions in date order: 01.08 84,76 · 03.08 120,65 · 10.08 286,10 · 18.08 244,18 · 29.08 304,41 zł.
- Hero „Suma w sierpniu”: 84,76 + 120,65 + 286,10 + 244,18 + 304,41 = **1040,10 zł**, „5 wystąpień” — matches.
- Over-limit for `count` (rule in `src/lib/patterns/over-limit.ts`: transactions after the N-th in the month carry
  their full amount): 4th + 5th = 244,18 + 304,41 = **548,59 zł** — matches the list's „Ponad progiem” cell, the
  detail hero „Ponad progiem w tym miesiącu” and the two „ponad próg” chips; the sequence shows 3 ink + 2 excess marks.

## F5 — phone dialog title vs close glyph: verdict

**No overlap; no change.** At 400 px the close glyph is 17×17 at x 347–364, y 214–231 (pattern actions), and the
title box starts at y 245 — the row the glyph shares is the short eyebrow („AKCJE NA WZORCU”, „COFNIJ IMPORT”,
„USUNIĘCIE KONTA”). The title's box runs to x 365 but sits 14 px below the glyph; the longest title, the import
dialog's two-line „Usunąć import z zakresu 01.09.2025–31.08.2026?”, starts at y 321 under a glyph ending at y 307.
Kit `.modal` has the same structure (eyebrow beside `.modal-close`, title below). F5 is closed; no `DialogTitle`
padding added.

## Discrepancies and fixes (commit `d70e3a0`)

1. **Empty-view panel not centred.** Round 3 added `.view-empty{margin-left:auto;margin-right:auto}` to
   `prototype/styles.css` (intake `7188f7f`); `ViewEmpty.astro` kept the round-2 left-aligned 720 px panel, so
   `/patterns`, `/fixed`, `/imports` empty states and the pattern not-found panel sat at the left of the content area
   while the kit centres them. `ViewEmpty` now adds `mx-auto` (comment cites the kit rule). Re-shot:
   `patterns-empty`, `fixed-empty`, `imports-empty`, `detail-not-found` at both widths. No new gap row (the kit
   draws it).

After the fix: lint 0 errors; astro check 0 errors / 0 warnings / 3 hints; vitest 375 / 375 (26 files; baseline 354
/ 23, Δ +21 / +3 from the slice, Δ0 from this fix); build OK; `db reset` → smoke on :4398 192 PASS / 0 FAIL
(baseline 184 + 8, Δ0 from this fix); `db reset` again at the end.

## Observations (not fixed, not blocking)

1. **Kit threshold field renders white.** Kit `.input-suffix input` has no background, so the UA white shows inside
   the `--rytm-field` (paper) box, and the „×” suffix gets a grey UA strip. The app paints the whole box paper
   (`fieldBox`), which is the token the kit declares. Kept.
2. **Kit not-found heading is larger.** Kit puts an `h1` in `.view-empty`, whose only heading rule targets `h2`, so
   the h1 falls back to the global h1 size. The app keeps the view-empty heading size on its `h1`
   (`headingLevel="h1"`, decision 11). Kept.
3. **Hero „Ponad progiem w tym miesiącu”** on the detail page (absent from kit `pattern-wolt`) predates S-14 (on
   `main`), not touched here.
4. **Plan decisions visible and expected:** merge/rename revealed in place rather than separate kit modals
   (decision 3), merged variants under the transactions panel rather than inside the dialog (decision 9), action
   errors as page alerts (decision 4), merge-empty as `InfoAlert` with icon vs the kit's bordered `info-panel`. All
   are in `[human]` 8.9.
5. **Fixed mobile nav** covers mid-page content in `fullPage` mobile shots — capture artefact; the kit frames show
   the same.

VISUAL: PASS — all 35 [visual] states of rows 8.6/8.7 captured at 1280 + 400 px (70 PNGs, Playwright) plus 17 kit frames; Chrome cross-check of the actions dialog keyboard path (initial focus on dialog, Esc returns focus); no undefined, no unfilled {…}, no page-level horizontal scroll; hand-checked 1040,10 / 548,59 zł; empty-view centring fixed (d70e3a0); F5 no overlap, closed
