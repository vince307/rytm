# Visual review — `pattern-threshold-over-limit` (`/patterns` Próg / Ponad progiem + row link, `/patterns/<key>`)

Step: visual gate of run `2026-09-27-s03-s02-s04`, 2026-09-27, branch `feat/pattern-threshold-over-limit`. Compared
`/patterns` (`src/components/patterns/PatternsTable.tsx`) and the detail (`src/pages/patterns/[...key].astro`,
`ThresholdEditor.tsx`, `MonthSelect.tsx`, shared `BackLink.astro`, `SequenceMark.astro`, `Badge.tsx`, `InlineAlert.astro`)
against `design/rytm-os/prototype/views/patterns.html` and `pattern-wolt.html` (`app.js` `patterns()`, `patternRows()`,
`patternDetail()`, `thresholdEditor()`; `styles.css` `.threshold-*`, `.input-suffix`, `.sequence-large`, `.merchant`,
`th,td`). Screenshots, account set-up and the state table: `../screenshots/README.md`.

## Capture method

Playwright library (npx cache, 1.55) driving headless system Chrome; scripts outside the repo (session scratchpad);
Claude-in-Chrome not used. Fresh account registered through `/register` on `astro dev --port 4399`, one import of the
synthetic main fixture (206 debits). All thresholds were set, changed, removed and rejected through the real editor
form (one of them keyboard-only). Reference month = 2026-08. Kit prototype served from `design/rytm-os/` on :4398
only while capturing.

## States (plan 6.8)

| State | Captured | Verdict |
| --- | --- | --- |
| `list-with-thresholds` | desktop + 400 px | Próg „2 × / miesiąc”, „100,00 zł / miesiąc”, „35,00 zł”, else „—”; Ponad progiem 834,69 zł / 4,00 zł in `excess-text` 800, else „—”; kit columns + arrow |
| `detail-default` | desktop + 400 px | kit layout: back link, badge + „wzorzec” eyebrow, h1 44 px, lead, month total right, two panels, transactions |
| `editor-count` / `editor-sum` / `editor-amount` | desktop + 400 px | kit `thresholdEditor()`: switch (frequent) or single „Akceptowana kwota” (fixed), label, value + suffix „×”/„zł”, note, „Zapisz próg” + „Usuń próg” |
| `over-limit-marked` | desktop + 400 px | 3 of 5 marks `excess`, 3 „ponad próg” badges on the right rows, „Ponad progiem w tym miesiącu 834,69 zł” |
| `no-threshold` | desktop + 400 px | „brak ustawionego progu”, empty note copy, only „Ustaw próg” |
| `empty-month` | desktop + 400 px | „Brak wystąpień w tym miesiącu.” (G31), 0,00 zł / 0 wystąpień |
| `saved` / `removed` / `error-value` | desktop + 400 px | `InlineAlert` success / success / error inside the threshold panel, above the editor (G31) |
| `error-read` | desktop + 400 px | back link + `InlineAlert error` `copy.components.error` (K18 reuse, pre-recorded) |
| `not-found` | desktop + 400 px | HTTP 404, back link + `InlineAlert info` `detailMissing` (G31) |
| `month-other` | desktop + 400 px | „Suma w lipcu 128,25 zł”, „Ponad progiem w lipcu 28,25 zł” |
| `link-focus` | desktop + 400 px | 3 px `ink/15` ring on the row link and on the arrow; the two copies render identically (F3 not a defect) |

## Over-limit arithmetic, checked by hand against the fixture (DB rows of the visual account)

- **count** — `stacja paliw drogowskaz`, threshold 2 / month, August 2026, chronological `(occurredOn, id)`:
  01.08 84,76 · 03.08 120,65 · 10.08 286,10 · 18.08 244,18 · 29.08 304,41. Occurrences 3–5 are over, full amount
  (decision 1): 286,10 + 244,18 + 304,41 = **834,69 zł**. On screen: list „834,69 zł”, detail „834,69 zł”, month sum
  84,76+120,65+286,10+244,18+304,41 = 1040,10 zł, 3 amber marks after 2 grey, badges on 10.08, 18.08, 29.08. ✓
- **sum** — `kino światło`, 100,00 zł / month, July 2026: 07.07 40,66 → 40,66; 09.07 35,61 → 76,27 (≤ 100);
  24.07 51,98 → 128,25 > 100 → excess 128,25 − 100,00 = **28,25 zł** on that transaction. On screen: „Ponad progiem
  w lipcu 28,25 zł”, „Suma w lipcu 128,25 zł”. August has one 68,99 → 0,00 zł, list „—”. ✓
- **amount** — `kawa-testowa.pl`, 35,00 zł, August: 39,00 − 35,00 = **4,00 zł**. List and detail „4,00 zł”. ✓

## Checks

- **Layout / components** (computed styles, kit vs app at 1440): back link 13 px 800; h1 44 px; total 28 px; switch
  12 px, padding 9/11; note 13 px/1.55 muted, margin 17; primary button 14 px 700, padding 12/18, radius 9; „Usuń próg”
  12 px 800, padding 5/0 (kit `.text-button`); month select 34 px high, 126 px wide. Sequence marks 27 px vs kit
  `.sequence-large .seq` 25 px and mark colour `muted` vs kit raw `#728393` — both already under G31.
- **Tokens**: `grep -nE "#[0-9a-fA-F]{3,6}\b|\[#|rgb\("` over the changed view files: no hits. Colour classes only
  `ink`/`paper`/`paper-soft`/`excess`/`excess-text`/`muted`/`line`/`green` (a transient `bg-white` from this step was
  reverted to `paper` and recorded as G32, see Fixes).
- **Copy**: every visible string on the list and detail comes from `copy` / `copyExtra` (K21 / G31 as reviewed in 6.11);
  the headers read „Suma w sierpniu”, „Ponad progiem w tym miesiącu” (`copy.dashboard.stats[0].label`) and „Ponad
  progiem w lipcu” for a non-reference month.
- **Keyboard path**: detail — Tab reaches „Wróć do wzorców” → „Liczba na miesiąc” → „Suma na miesiąc” → value → „Zapisz
  próg” → „Usuń próg”, all `:focus-visible`; Space toggles `aria-pressed`; Enter in the value submits; Tab+Enter on
  „Usuń próg” submits the sibling delete form (`?removed=1`). After each redirect focus is on `body` (full page load);
  the status line is the first thing in the threshold panel. List — search → sort → row link → arrow; Enter on the
  arrow opens the detail. Plan row 5.10 (ticked statically in impl-review) is confirmed in the browser.
- **F8 (bfcache „Zapisywanie…”)**: Back after a save showed „Ustaw próg”, not a stuck pending button, in headless
  Chrome — not reproduced; F8 stays an open observation (headless Chrome may not restore from bfcache).
- **Mobile (6.9)**: no horizontal page scroll on the list and on every detail state at 400 px; the detail stacks
  heading → totals → threshold panel → month panel → transactions; the list table (924 px) scrolls inside its 363 px
  panel and the arrow is reachable (`right` 365 < 400, `list-table-scrolled-mobile.png`).
- **Dotted / diacritic keys (6.10)**: list-link clicks open `kawa-testowa.pl`, `kino światło` and `piekarnia kłosek
  łódź` with 200 and the right h1.

## Fixes on this branch

`0a6973d`:
1. `PatternsTable.tsx` — the name link had `whitespace-nowrap`; with real names („ZAKŁAD UBEZPIECZEŃ SPOŁECZNYCH”)
   the table was 1091 px in a 1014 px panel at 1440, so the new arrow column sat behind a horizontal scroll on desktop.
   Kit `.merchant` does not forbid wrapping; removed → table 1014 = panel.
2. `ThresholdEditor.tsx` — switch buttons were bold and 14 px radius (app `rounded-lg`), kit `.threshold-option` is
   weight 400, radius 8 px; the value box was radius 14 px, kit `.input-suffix` 8 px; the suffix was forced
   `font-normal`, kit `b` renders bolder (900 in the 700 label). Aligned all four.
3. `[...key].astro` — at 400 px real raw descriptions (far longer than the kit's „WOLT*WARSAW”) squeezed the amount
   into „304,41 / zł” on two lines; the description column is now `min-w-0`, the amount column `shrink-0` +
   `whitespace-nowrap`.

`b72601a`: the kit `.input-suffix` background is `--white` (#fff), which has no brand token. A first fix used
`bg-white` (as the older `FormField`); reverted to `bg-paper` with `DESIGN-GAP: G32` and a new G32 row + round-3 item
in `context/foundation/design-kit.md` rather than widen the token set.

## Observations (not fixed, not blocking)

1. App-wide `rounded-lg` = 14 px while kit fields are 8 px (`field-styles.ts` `field` → `/patterns` toolbar and
   `MonthSelect`, `FormField`). Pre-existing, shared across views → follow-up **F11** in `follow-ups/review-fixes.md`.
2. `error-read` reuses „Błąd — sprawdź plik CSV.” — misleading on a detail page, but it is the recorded K18 gap.
3. The header over-sum shows „0,00 zł” in `excess-text` also for a pattern with no threshold or no occurrences (G31
   placeholder area; the kit shows no over-sum in the detail header at all).
4. `empty-month` is reachable only for the reference month: `patternDetail` falls back from a `?month` outside the
   pattern's months to the reference month (S-04 decision 14), so e.g. `?month=2026-06` for `stacja…` shows August.
5. The transactions panel of an empty month is an empty panel under its heading (kit defines no such state; G31).

## Gate after fixes (baseline = post-S-02 `main` `a6a8b18`: lint 0 · astro check 93 files · vitest 78/5 · smoke 61)

lint 0 errors (Δ0); `astro check` 0 errors, 109 files (+16, unchanged from impl-review); `fixture:check` OK;
`npm test` 141/141, 8 files (+63 / +3, unchanged); build Complete; smoke on :4398 77 PASS / 0 FAIL (+16, unchanged),
run after each fix commit. `supabase test db` not run — no schema change in this step; the temporary `revoke select`
used for `error-read` was restored and verified (`authenticated` = DELETE,INSERT,SELECT,UPDATE).

VISUAL: PASS — all 15 named states captured desktop 1440 + 400 px against the kit with hand-checked over-limit numbers; three real discrepancies (arrow column hidden at 1440, editor switch/field styling, wrapped amounts at 400 px) fixed in 0a6973d, the kit's untokened white field recorded as G32 (b72601a)
