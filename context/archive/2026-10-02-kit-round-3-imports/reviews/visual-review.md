# Visual review — `kit-round-3-imports` (S-13: import history, delete dialog, wizard, result)

Step: visual gate of run `2026-10-02-kit-round-3`, 2026-10-02/03, branch `feat/kit-round-3-imports`, Progress row
6.6. The gate covers every state the plan's Phase 6 `[visual]` row lists. Each one is captured at 1280 px and
400 px and compared with the round-3 kit frames `prototype/views/imports*.html` plus the kit `deleteImport` modal.
The gate also had to decide follow-ups F7 and F8 from `reviews/impl-review.md`. The state table, accounts and files
are in `../screenshots/README.md`.

## Capture method

- **PNG set:** Playwright 1.55, installed outside the repo, driving headless system Chrome on
  `astro dev --port 4399`. The script lives in the scratchpad. Shots: 32 app states × 2 viewports = 64 PNGs, plus
  38 kit frames (17 views and 2 dialog variants, each at 2 widths). 0 NOT CAPTURED. Each shot waits until no
  animation is running. The first pass caught the Radix dialog mid fade-in, so the dialog was re-shot.
- **Data:** everything went through the product. As `test@rytm.local`, the ING main and Santander fixtures were
  imported through the wizard and later deleted through the dialog. As `demo@rytm.local`, the first ING import went
  through the wizard (allowed while the account is empty). The rejection files were the repo's `no-header` and
  `currency` ING fixtures plus three files generated in the scratchpad, never in the repo: a Santander file with one
  credit (empty), 6 MB of junk (too large) and a Santander file with 5100 debits (too many). Error query states
  (`?error=…`) were opened by URL. Those URLs are the redirect targets of the POST endpoints. The not-found result
  used a random uuid.
- **Claude-in-Chrome:** the preflight browser was inherited, and no browser was selected or switched. The agent
  opened its own tab, signed in as the test user and fed the fixture to the hidden file input through
  `DataTransfer`. Vite serves the file at `/@fs/…`. It ran the wizard through to the result page; headed Chrome shows
  the same Santander result as the PNG. It then went Back to check bfcache (F8, below) and closed the tab. Headless
  Playwright never restores from bfcache: its Back reloads `/imports/new` at step 1. Only headed Chrome could show F8.
- **Cleanup:** `npx supabase db reset` after the gate's runs and again after the final smoke.

## States: 32 × 2 viewports

| Group | Verdict |
| --- | --- |
| History list (ING + Santander) | Same as kit `imports`: 6 columns Data importu / Bank / Rachunek / Zakres dat / Obciążenia / action. Rows read „ING Bank Śląski · Rachunek Firmowy Główny · •• 0001 · 01.09.2025–31.08.2026 · 206” and „Santander Bank Polska · Rachunek · •• 3334 · 01.03–31.08.2026 · 184”. At 400 px the table scrolls inside its panel and the page stays 400 px wide, as in the kit. |
| Empty, `?deleted=1`, `?error=delete / missing / demo` | Kit texts in an InlineAlert above the list or empty view: „Import usunięty.”, „Nie udało się usunąć importu. Spróbuj ponownie.”, „Nie znaleziono importu.” and the demo note. The kit uses a toast and the app an inline alert (accepted precedent). |
| Delete dialog, normal | Kit modal: eyebrow „Cofnij import”, „Usunąć import z zakresu 01.03–31.08.2026?”, body text, one danger button, close X. **Keyboard:** Enter on the row trigger opens the dialog with focus on the dialog itself (`activeElement` = dialog), not on the danger button. Esc closes it and returns focus to the „Usuń import” trigger. |
| Delete dialog, demo | Disabled danger button (`disabled = true`) plus the info note „Na wspólnym koncie demo cofanie importów jest wyłączone.”, as in kit `deleteImport` with `demoMode`. **Plan F8 (clipping at 400 px): no clipping.** The dialog sits inside 400×812 with its whole content visible. |
| Wizard step 1: empty, chip, four rejections | Kit `imports-new` and `imports-error-*` layout: dashed drop zone, Stepper, „Wróć do importów”. The chip reads „Lista_transakcji_nr_0000123456_010926.csv · Rozpoznano format ING Bank Śląski. Dalej →”. The rejections show the kit `importErrors` texts with a bold first sentence and „Wybierz inny plik”. Too large: „…5 MB…” with `{maxMb}` filled. |
| Step 1 server errors (`invalid`, `failed`, `demo`, `overlap&from&to`) | ServerError above the drop zone. Overlap reads „Ten zakres nachodzi na istniejący import: 1 września 2025 – 31 sierpnia 2026.” with the range linked to `/imports`, then the app tail. Tail links „Wybierz inny plik” and „Wróć do importów”. |
| Step 2 | Kit `imports-account`: radio list „Rachunek Firmowy Główny · •• 0001 / ING Bank Śląski · 222 transakcje” (selected, „wybrane”) and „Rachunek VAT · •• 0002 · 12 transakcji”, plus Wstecz / Dalej ↗. The lead text is the app's (K33, `[human]` 6.8). |
| Step 3: ready (ING, Santander), overlap, too many | Kit `imports-summary` grid with Bank / Rachunek / Zakres dat / Obciążenia do importu and „Importuj 206 obciążeń” / „Importuj 184 obciążenia”. Overlap and too-many („Plik zawiera ponad 5000 obciążeń. Podziel wyciąg na mniejsze zakresy.”) replace the form with the alert plus „Wybierz inny plik” / „Wróć do importów”, as kit `imports-overlap` / `imports-error-many` do. The kit's static progress bar is not built; the app shows „Importowanie…” on the button. |
| Result ING, Santander, not-found | Placeholder layout (G38): icon, eyebrow „Import gotowy.”, „Dodaliśmy 206 obciążeń.” / „Dodaliśmy 184 obciążenia.”, a 4-column meta panel (2 columns below 560 px) and „Zobacz wzorce ↗” / „Przejdź do przeglądu”. Santander shows „Rachunek · •• 3334”. Not-found matches kit `imports-result-not-found`. |
| Demo: list, locked step 1, `?error=demo`, locked + overlap | Step 1 has a disabled „Wybierz plik” (`isDisabled` = true) and the InfoAlert „Na wspólnym koncie demo dodawanie i cofanie importów jest wyłączone.”. With `?error=demo` the sentence appears once. Locked + overlap: see F7. |

Page level: in all 64 app shots, `scrollWidth` equals the viewport width (1280 / 400). `innerText` contains no
`undefined` and no unfilled `{…}`. Colours are the existing tokens; no view introduces a raw colour.

## Hand-checked numbers

- **„Importuj 206 obciążeń” / list „206”** (ING main, account Rachunek Firmowy Główny). Fixture
  `test/fixtures/ing/README.md` gives 234 rows and 206 debits for the default account. The step-2 counts add up:
  222 transactions on the main account + 12 on the VAT account = **234** ✓. 206 is the debit subset of those 222
  (credits skipped, D2) ✓. Polish plural: 206 ends in 6, so it takes the many-form „obciążeń” ✓.
- **Santander „184 obciążenia”**. The fixture README gives 187 rows and 184 debits ✓. 184 ends in 4 and is not
  12–14, so it takes the few-form „obciążenia” ✓. Masked account: header `'61 1090 1234 0001 1112 2223 3334` → last
  four digits **3334** ✓. Range: header start 01-03-2026, export date 2026-08-31 → **01.03–31.08.2026** ✓ (same
  year, so the short form).

## Discrepancies and fixes (commit `5707d1a`)

1. **F7 — reproduced, fixed.** On the locked demo account with `?error=overlap`, the alert's „Wybierz inny plik”
   was enabled (Playwright `isDisabled()` = false) right next to the disabled „Wybierz plik”. Clicking it opened the
   picker, and the wizard then silently dropped the file. `ImportWizard` now renders `chooseOtherButton` in the
   step-1 ServerError only when `!demoLocked`, so only „Wróć do importów” remains. Re-shot as
   `demo-new-locked-overlap-*`: the button is absent.
2. **F8 — reproduced in headed Chrome, fixed.** Path: import → `/imports/result` → Back. Chrome restored
   `/imports/new` from bfcache at step 3 with „Importowanie…” and „Wstecz” both disabled. The user was stuck there.
   `ImportWizard` now calls `usePageShowReset(() => setSubmitting(false))`, the same hook `DeleteImportDialog` uses.
   Re-checked in Chrome after the fix: Back shows „Importuj 206 obciążeń” and „Wstecz” enabled. A second click lands
   on `/imports/new?error=overlap&from=2025-09-01&to=2026-08-31`, so the server guard holds and nothing is imported
   twice.
3. **`.dash-title` did not stack below 560 px.** Round-3 kit `styles.css` (≤560 px block) sets
   `.dash-title{flex-direction:column;align-items:flex-start}`. The rule is new in round 3 and absent at `577b163`.
   On `/imports` the app kept „+ Nowy import” beside a wrapped two-line title, and in the wizard „Wróć do importów”
   sat beside the title. The kit places both below the lead. The fix adds `max-[559px]:flex-col` to `PageTitle.astro`
   and to the wizard's `StepTitle` twin. `PageTitle` is shared, so `/home`, `/patterns`, `/fixed` and `/settings`
   were checked at 400 px after the change. „+ Wgraj CSV” now sits under the lead, as in their kit frames, and
   `scrollWidth` stays 400.
4. **Kit-internal copy mismatch (doc only).** The `app.js` drop-zone lead reads „Obsługujemy wyciągi ING…”, but
   `content.json` `importFlow.supported` reads „Obsługujemy pliki CSV z ING…”. The app follows `content.json`. The
   mismatch is appended to register row K33 in `context/foundation/design-kit.md` for the kit author.

After the fixes: lint 0, astro check 0 errors (155 files), vitest 352/352, build OK, pgTAP PASS, smoke 166/0. The
app states were re-captured after a DB reset (64 PNGs, same measurements).

## Observations (not fixed, not blocking)

1. The kit's step-3 frame shows a static „Importowanie…” progress bar. The app shows the pending state on the
   submit button. The kit has no real progress source, and a native form POST has none either.
2. Alert tints are token approximations of the kit's hex values: ServerError uses `excess`, and InfoAlert uses
   `ink/8` against kit `#e2e7ec`. Both are shared components from earlier slices.
3. The result page meta panel remains the G38 placeholder. The kit has no desktop rules, so its frame renders
   unstyled.

VISUAL: PASS — all 32 [visual] states of row 6.6 captured at 1280 + 400 px (64 PNGs, Playwright) against 17 kit frames + kit dialog (normal/demo), Chrome cross-check of the result and bfcache; no undefined, no unfilled {…}, no page-level horizontal scroll, dialog not clipped at 400 px; F7 and F8 reproduced and fixed, .dash-title stacking below 560 px fixed (5707d1a); 222+12=234 rows / 206 debits and Santander 184 hand-checked against the fixture READMEs
