# Visual review — `kit-round-3-home-fixed` (S-15: `/home` one card + trend + „Koszty stałe”, `/fixed`, rebound views)

Step: visual gate of run `2026-10-02-kit-round-3`, 2026-10-03, branch `feat/kit-round-3-home-fixed`, Progress rows 2.8,
5.9, 5.10. Every state the plan's `[visual]` rows list is captured at 1280 px and 400 px and compared with the round-3
kit frames; the gate also decides impl-review F5 (trend value `whitespace-nowrap` / no bottom margin vs kit
`.trend-value`). State table, accounts and files: `../screenshots/README.md`.

## Capture method

- **PNG set:** Playwright 1.55 (outside the repo) driving headless system Chrome on `astro dev --port 4399`. 22 app
  states × 2 viewports = 44 PNGs, plus 14 kit frames × 2 = 28; 72 in all, 0 NOT CAPTURED. Each shot records
  `scrollWidth`, `undefined` / unfilled `{…}` in `innerText`, and for the trend the bar values, axis labels, scroll box
  widths, whether the last bar is in view, values wider than their column, and the smallest gap between two values.
- **Claude-in-Chrome:** the preflight browser was inherited (nothing selected or switched); own tab, signed in as the
  seeded user on :4399, `/home` rendered as in the PNGs (headed cross-check). The extension's key events did not reach
  the page (a `keydown` listener logged nothing after two `Tab` presses), so the keyboard path was proven in
  Playwright instead: Shift+Tab then focus on „Zobacz zmiany” → `:focus-visible` true at both widths, ring visible in
  `home-focus-fixed-link`, Enter → `/fixed`. Tab closed.
- **Data and cleanup:** product UI (wizard import, threshold editor) plus `POST /api/imports` in the smoke payload
  format for the small two-month accounts; read errors by revoking `select` on `public.transactions` from
  `authenticated`, followed by `npx supabase db reset` straight after the three shots, and again after the closing
  smoke. :4398 / :4399 killed, :4321 never touched.

## States

| Group | Verdict |
| --- | --- |
| `/home` card + summary (2.8) | Kit `home-no-name`: eyebrow, „Dzień dobry.”, lead „Twój sierpień w jednym spokojnym widoku.”, „+ Wgraj CSV” right; ONE accent card (260–380 px column) „Ponad progiem w tym miesiącu” 548,59 zł with foot „+548,59 zł względem lipca”; trend panel; „Koszty stałe” panel with „Zobacz zmiany” and Podrożały / Nowe rows side by side at 1280, stacked at 400 — as kit. |
| Trend with threshold | 12 bars wrz 25 → sie 26, only sie 26 non-zero (full height), eleven 2 px `bg-line` zero bars, dashed gridline at 50 %, legend „suma ponad progiem” + zero note at the right. Kit draws 8 bars and its tallest value overlaps the panel's range label (kit has no room above a 100 % bar); the app's value sits inside the 200 px area — kept. |
| Trend without threshold | All zero, legend shows dot + zero note + „Brak ustawionego progu” (`trend.noThreshold`, `[human]` 5.11 vs kit „Brak progu”). At 400 px the three legend items wrap to two lines each — kit mobile wraps the same three items the same way. |
| One month | No delta foot, single bar „maj 26”, info panel „Trend pojawi się po 3 miesiącach danych.”, „0 kosztów / 0 kosztów”. |
| Two months | `full`: Podrożały „1 koszt” (Kawiarnia rose; Siłownia fell and is not counted — rises only, `[human]` 5.11), Nowe „1 koszt”; `nochg` 0 / 1; `nonew` 1 / 0. |
| 12-month axis at 400 px | Scroll box 625 px in a 328 px panel, opens at its end: the last bar (sie 26) is in view, the oldest months are off to the left. |
| Empty / demo / read error | Empty: kit `home-empty` (eyebrow, „Zacznij od pierwszego importu.”, illustration panel, „Wgraj CSV ↗”). Demo: demo strip above the page, data view (kit `home-demo` uses a named greeting — the app has no names, decision of S-12). Read error: title + error alert only, no partial view. |
| `/fixed` all sections | Kit `fixed`: „Zmieniły kwotę · 2 pozycje” with Siłownia „99,00 zł −30,00 zł · spadek” (green) and Kawiarnia „47,00 zł +1,50 zł · wzrost” (amber), meta „15.06.2026 · poprzednio 129,00 zł”; „Nowe w czerwcu · 1 pozycja” with „nowy” badge and „pierwsze wystąpienie · 18.06.2026”; „Bez zmian · 1 pozycja” compact row. Same at 400 px with amount above delta. The ING account shows the fixture's KINOTEKA change and SIŁOWNIA RUCH new as in S-14. |
| `/fixed` states | No comparison: one info panel „Brak poprzedniego miesiąca do porównania.” under the title, sections keep heading + count only (kit `fixed-no-month` keeps the sample rows — kit sample data). No changes: „W tym miesiącu nie zmieniły się żadne koszty stałe.” under the sections. No new + empty „Bez zmian”: two panels. Empty: kit `fixed-empty` panel, centred. Read error: `fixedCosts.readError` alert, no list (kit `fixed-error` keeps sample rows under the alert; the app's rule is never a partial list — S-06). |
| Pattern detail read error | Back link „Wróć do wzorców” + error alert, no 500. |
| Rebound views (5.10) | `/reset/new` visual panel: eyebrow „SPOKOJNIE”, „Hasło można ustawić na nowo.”, lead — text as kit. Import result: „Dodaliśmy 206 obciążeń.” (plural from the kit forms). Santander account step: „Rachunek · • • 3334” (kit `santanderAccountName`). No layout change from the rebinds. |

Page level: in all 44 app shots `scrollWidth` equals the viewport (1280 / 400); `innerText` has no `undefined` and no
unfilled `{…}`. Colours are the existing tokens.

## Hand-checked numbers

- **Trend, sie 26 = 548,59 zł.** STACJA PALIW DROGOWSKAZ in the ING fixture, August 2026: 01.08 84,76 · 03.08 120,65 ·
  10.08 286,10 · 18.08 244,18 · 29.08 304,41 zł. Threshold „Liczba na miesiąc” = 3: transactions after the 3rd carry
  their full amount → 244,18 + 304,41 = **548,59 zł** — matches the bar, the card and the foot (+548,59 zł vs lipiec).
  Every other month has ≤ 3 such rows (wrz 25: 2, lip 26: 2, others 1, none in paź/lis 25 and cze 26) → 0,00 zł bars.
- **„Koszty stałe”, account `full`.** Kawiarnia 45,50 → 47,00 (+1,50, rise), Siłownia 129,00 → 99,00 (−30,00, fall),
  Sklep 12,99 → 12,99, Piekarnia only in June. Podrożały = rises only = **1 koszt**; Nowe = **1 koszt** — matches.

## F5 — trend value spacing / wrap: verdict

**`whitespace-nowrap` kept; kit `margin-bottom:5px` adopted (commit `c9574d7`).** At 400 px the 12-month axis scrolls
(625 px box in a 328 px panel) and no value is wider than its 44 px column (`valueOverflow` 0 in every trend shot); the
smallest gap between neighbouring values is 21 px at 400 px and 39 px at 1280 px. Kit's ≤ 560 px
`white-space:normal; line-height:1.1` exists because the kit squeezes 8 bars into the viewport with no scroll; it
breaks „284,00 zł” onto two lines and pushes the tallest value into the panel's range label (`kit-home-no-name-mobile`).
With a scrolling axis that rule would only make values two-line, so it stays out. The missing 5 px was real: before
the fix the full-height bar's value sat ≈ 2 px above the bar; after it the measured value→bar gap is exactly 5 px at
both widths. The component's header comment records both halves.

## Discrepancies and fixes

1. **Trend value bottom margin** — `TrendChart.astro` value `span` gained `mb-[5px]` (kit `.trend-value`), commit
   `c9574d7`. Re-shot `home-data`, `home-demo`, `home-one-month`, `home-full` at both widths.

After the fix: lint 0 errors; astro check 0 errors / 0 warnings / 3 hints (166 files, Δ0 vs impl review); vitest 387 /
387 (27 files, Δ0); build OK; `db reset` → smoke on :4398 195 PASS / 0 FAIL (Δ0); `db reset` again at the end.

## Observations (not fixed, not blocking)

1. **Auth visual heading weight.** `AuthLayout.astro` renders the visual title as a `<p>` at normal weight; kit
   `.auth-copy h1` is bold (UA `h1`). Pre-existing on `main`, shared by every auth page, not touched by S-15's rebind
   (only the `visual` prop source changed). Filed in `../follow-ups/review-fixes.md` with a `Trigger:`.
2. **Page background vs info panel on `/fixed`.** Kit `.dash-shell` is `#edf0ef`, `.info-panel` `#e8ecea`; the app maps
   both to `paper-soft`, so on `/fixed` the info panel's fill equals the page and only the ink left border shows.
   App-wide token mapping (no `#edf0ef` token), pre-existing; the border carries the panel. No gap row — the same
   observation applies to every app view, not to S-15.
3. **Import result eyebrow „Import gotowy.”** keeps the full stop of `content.json` `result`; the kit view drops it
   while rendering. Pre-existing, outside S-15.
4. **Kit sample rows under `fixed-error` / `fixed-no-month`** are kit sample data; the app's one-message / no-partial
   rules are plan decisions (`[human]` 5.11).
5. **Fixed mobile nav** covers mid-page content in `fullPage` mobile shots — capture artefact; kit frames show the same.

VISUAL: PASS — all 22 [visual] states of rows 2.8/5.9/5.10 captured at 1280 + 400 px (44 PNGs, Playwright) plus 14 kit frames; Chrome headed cross-check of /home (keyboard proven in Playwright: focus-visible on „Zobacz zmiany”, Enter → /fixed); no undefined, no unfilled {…}, no page-level horizontal scroll; hand-checked 548,59 zł trend and Podrożały 1 / Nowe 1; F5 decided — nowrap kept, kit 5 px margin adopted (c9574d7)
