# Visual review — `over-limit-trend` (`/home`, „Przegląd miesiąca”)

Step: visual gate of run `2026-09-28-s05-s06-s07`, 2026-09-28, branch `feat/over-limit-trend`. Compared
`src/pages/home.astro`, `src/components/home/TrendChart.astro`, `StatCard.astro` and `ImportPanel.astro` against
`design/rytm-os/prototype/views/home-no-name.html` (`#/home-no-name`), `home-empty.html`, `app.js` `dashboard()` /
`trendChart()` and `styles.css` (`.trend`, `.monthly-trend`, `.tbar`, `.legend`, `.info-panel`, `.panel-title`).
Screenshots, accounts and the state table: `../screenshots/README.md`.

## Capture method

- **PNG set:** Playwright 1.55 (outside the repo) driving headless system Chrome, desktop 1440×900 + mobile 400×812,
  full page. Seven fresh accounts were registered through `/register` on `astro dev --port 4399`. All data came in
  through the `/imports/new` wizard: the F-02 fixture, or month subsets of it crafted outside the repo. Thresholds were
  set in the `/patterns/<key>` editor, and the exclusion went through the S-05 „Akcje” dialog. Kit frames come from the
  prototype over `file://`. `home-kit-compare` puts the kit frame and the app frame side by side; it is built from
  those two real PNGs.
- **Claude-in-Chrome:** the browser selected at preflight was inherited. `tabs_context_mcp` worked, and the agent
  never selected or switched a browser. It used its own tab and closed it afterwards. In real headed Chrome it signed
  in to a fresh fixture account and ran the whole US-05 walk-through (row 4.13) through the threshold editor. It also
  checked the 400 px scroll start in a same-origin iframe.
- Why PNGs come from Playwright: Chrome screenshots are not written to the repo. The worked example (S-06) split the
  work the same way.

## States (row 4.12): 9 states × 2 viewports = 18 app PNGs + 2 kit frames × 2

| State                | Verdict                                                                                                                                                                                                                                  |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `home-pre-import`    | Matches `kit-home-empty` text for text: eyebrow, „Zacznij od pierwszego importu.”, lead, the empty panel with its illustration, and „Wgraj CSV ↗”.                                                                                        |
| `home-no-threshold`  | 12 months, every bar 0,00 zł as a 2 px stub. Stat 0,00 zł, foot „0,00 zł względem lipca”. The no-threshold hint shows on the kit `.info-panel`.                                                                                             |
| `home-fixture-trend` | Kit `dashboard()` layout minus the parts G35/G36 remove („niepełny”, amber bar, „Rozpoznane wydatki”, „Co wraca najczęściej”). Stat 955,34 zł, „+646,35 zł względem lipca”, „Koszty stałe” 1752,98 zł · „1 pozycja podrożała”, import panel. |
| `home-one-month`     | One bar (sie 26, 955,34 zł), the „Trend pojawi się po 3 miesiącach danych.” panel, no delta foot.                                                                                                                                         |
| `home-two-months`    | lip 26 308,99 / sie 26 955,34 zł. The tooShort panel still shows, and so does the delta foot „+646,35 zł względem lipca”.                                                                                                                 |
| `home-gap-month`     | Only cze 26 (41,24 zł) and sie 26 (955,34 zł). July has no bar and there is no delta foot (decision 2 / plan review F1).                                                                                                                  |
| `home-excluded`      | The only thresholded pattern (`kino światło`) is excluded, so every month shows 0,00 zł and the hint appears (`hasThreshold` false).                                                                                                     |
| `home-read-error`    | Title block plus `InlineAlert` error „Błąd — sprawdź plik CSV.”: the same K18 stand-in as `/patterns` and `/fixed`. No partial view.                                                                                                     |
| `home-kit-compare`   | Side by side at both widths. After the fix the chart geometry matches `.monthly-trend` (see Fix).                                                                                                                                        |

Page level: `scrollWidth` equals the viewport width in every shot (1440 / 400). Every bar's sum fits inside its column
at both widths (kit-width columns are 67 px on desktop and 44 px at 400 px; the widest sum is 43 px). At 400 px a
12-month axis scrolls inside the panel (G35), and after the fix it opens on the newest months.

## Hand-checked number: `sie 26` bar = 955,34 zł

The threshold was set through the UI: `stacja paliw drogowskaz` → „Liczba na miesiąc” → 1 → „Ustaw próg”. The other
threshold, `kino światło` count 1, adds 0 to August because it has only one August row, 14.08 68,99 zł, and that row
is within the limit.

Fixture rows for STACJA PALIW DROGOWSKAZ in 2026-08, in order (`overLimit` count rule: the first `value` rows are
within the limit, the rest are fully over):

| # | date       | amount     | status |
| - | ---------- | ---------- | ------ |
| 1 | 2026-08-01 | 84,76 zł   | within |
| 2 | 2026-08-03 | 120,65 zł  | over   |
| 3 | 2026-08-10 | 286,10 zł  | over   |
| 4 | 2026-08-18 | 244,18 zł  | over   |
| 5 | 2026-08-29 | 304,41 zł  | over   |

120,65 + 286,10 = 406,75 · + 244,18 = 650,93 · + 304,41 = **955,34 zł**, plus 0,00 from kino = **955,34 zł**. On screen:
the `sie 26` bar reads 955,34 zł and the „Ponad progiem w tym miesiącu” stat reads 955,34 zł (Playwright
`innerText`). ✓ This matches the plan's expected stat.

## US-05 walk-through (row 4.13), real Chrome, fresh fixture account

- Count 1 → paź 25 **49,13**, maj 26 **133,47**, cze 26 **41,24**, lip 26 **87,59**, the other 8 months 0,00 zł.
  Hand check lip 26: 07.07 40,66 (within), 09.07 35,61 + 24.07 51,98 = 87,59 ✓. Stat 0,00 zł, foot „−87,59 zł względem
  lipca”.
- Count 2 → maj 26 **98,22**, lip 26 **51,98**, every other month 0,00 (paź 25 and cze 26 dropped to 0,00: each has
  exactly 2 rows) ✓.
- „Usuń próg” (the page confirms „Próg usunięty.”) → all 12 months 0,00 zł, hint shown ✓.
- „niepełny” is absent from the page body at every step ✓. `<main>` has 2 focusable elements („+ Wgraj CSV”, „Wybierz
  plik”) and one `h1`.

## Fix on this branch: `c095e37`

**`TrendChart.astro`: chart geometry and the 400 px scroll start.** This settles impl review F6.

1. **Baseline position:** in the kit `.monthly-trend` the 200 px bar area carries `border-bottom`, so the bars stand
   on the line and the `data-day` labels hang 22 px below it. The app put `h-[200px]` on each `<li>` including the
   amount and label, so the baseline ran *under the month labels*, detached from the bars. This was visible in the
   first capture. The fix puts `h-[200px]` and `border-b` on the `<ol>`, makes the labels `absolute -bottom-[22px]` in
   a `pb-[22px]` wrapper, sets the gridline to `top-[100px]` (kit 50 % of 200) and the legend to `mt-[9px]`, which is
   31 px from the baseline as in the kit.
2. **Scroll start at ~400 px:** 12 months overflow the 328 px panel. The panel opened on wrz 25 … lut 26, so the
   reference month (sie 26), the one the stat card above reports, was off-screen. The fix adds `flex-row-reverse` on
   the scroll box, so it opens at the end of the axis (mar 26 … sie 26 visible). DOM and reading order are unchanged,
   the page itself does not scroll horizontally, and desktop is unaffected (`min-w-full`).

`TrendChart` has one consumer (`src/pages/home.astro`), so there is no other view to re-shoot. G35 in
`context/foundation/design-kit.md` was amended. Every app PNG was captured after the fix.

Gate after the fix. Baseline is the agent contract, `main` `c0b0068`: lint 0 · astro check 124 files · vitest 213/12 ·
pgTAP 102/5 · smoke 121.

| Check                           | Result                                           |
| ------------------------------- | ------------------------------------------------ |
| lint                            | 0 errors, 0 warnings (Δ0)                        |
| `astro check`                   | 0 errors, 131 files (+7, unchanged from review)  |
| `fixture:check`                 | OK                                               |
| `npm test`                      | 246 passed, 14 files (+33 / +2, unchanged)       |
| build                           | Complete                                         |
| `db reset` + `supabase test db` | Files=5, Tests=102, PASS (+0)                    |
| smoke on :4398                  | 131 PASS / 0 FAIL (+10, unchanged)               |

## Observations (not fixed, not blocking)

1. **Panel title `m-0`** (from the handoff): Tailwind preflight already zeroes `h2` margins, so the kit's
   `.panel-title h2{margin:0}` holds without the class. The title-to-chart spacing (`mb-5`, 20 px) equals the kit's
   `.panel-title` `margin-bottom:20px`. Nothing to fix.
2. **Wide bars with 1–2 months** (`home-one-month`, `home-gap-month`): bars are `flex-1`, the same as the kit `.tbar`,
   so two months fill the panel width. This follows the kit rule. The kit has no short-history frame.
3. **The amount label above every bar** takes about 15 px of the 200 px column, so the tallest bar is about 185 px vs
   200 px in the kit. This is a consequence of G35's visible sum per bar, which is already recorded.
4. **Header month vs lead month:** the shell shows „wrzesień 2026” (calendar), while the lead says „Twój sierpień…”
   (latest month in the data, the maintainer binding). This comes from the AppLayout shell and predates S-07.
5. **Panel radius 20 px vs kit 12 px, page background `paper-soft`:** these are app-wide and already tracked as S-06
   follow-ups.

VISUAL: PASS — all 9 [visual] states (4.12) captured desktop 1440 + 400 px against 2 kit frames, US-05 walk-through (4.13) exact in real Chrome, sie 26 = 120,65 + 286,10 + 244,18 + 304,41 = 955,34 zł hand-checked; chart baseline/labels geometry (F6) and 400 px scroll start fixed in c095e37, no page-level horizontal scroll
