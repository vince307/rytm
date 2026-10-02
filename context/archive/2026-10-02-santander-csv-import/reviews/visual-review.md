# Visual review — `santander-csv-import` (`/imports`, `/imports/new`, `/imports/result`)

Step: visual gate of run `2026-10-01-m2-santander`, 2026-10-02, branch `feat/santander-csv-import`. Compared
`src/pages/imports/{index,new,result}.astro` and `src/components/imports/ImportWizard.tsx` against
`design/rytm-os/prototype/views/{imports,imports-empty,imports-new,imports-account,imports-summary,imports-result}.html`
(`app.js` `importsNew()` / `uploadReady` / `importAccount` / `importSummary` / `importResult`, `styles.css`).
Screenshots, accounts and the state table: `../screenshots/README.md`.

## Capture method

- **PNG set:** Playwright 1.55 (installed outside the repo) driving headless system Chrome, desktop 1440×900 and
  mobile 400×812, full page. One fresh account per viewport was registered through `/register` on `astro dev
  --port 4399`. All data came in through the real `/imports/new` wizard from the synthetic fixtures only
  (`test/fixtures/santander/`, `test/fixtures/ing/`) plus one repo image as the unknown-format file. The real
  exports were not opened. Kit frames come from the prototype over `file://`. Result: 13 app states × 2 + 6 kit
  frames × 2 = 38 PNGs, 0 NOT CAPTURED.
- **Claude-in-Chrome:** the browser selected at preflight was inherited. `tabs_context_mcp` worked, and the agent
  never selected or switched a browser. It used its own tab and closed it afterwards. In headed Chrome it signed in
  to the desktop visual account, uploaded the Santander fixture with `file_upload` and saw step 1 render the chip
  "… · rozpoznano format Santander" and the both-bank `supported` line, matching the PNG. Synthetic `Tab` key
  presses from the extension did not move focus (`document.activeElement` stayed `BODY`), so the keyboard path was
  measured in Playwright instead (decision 2 in the handoff).
- Why the PNGs come from Playwright: Chrome screenshots are not written to the repo (same split as the S-06 and
  S-07 gates).

## States (rows 5.6, 6.6): 13 states × 2 viewports

| State | Verdict |
| --- | --- |
| list empty | Matches `kit-imports-empty` text for text. Regression context only. |
| step 1 empty | Kit `imports-new` layout (eyebrow, h1, lead, back link, stepper, dashed drop panel, upload tile, "Wybierz plik"). The kit line "ING … Santander wkrótce" is replaced by the K26 both-bank `supported` line. |
| step 1 unknown format | Kit `.import-errors` pattern: bold headline + body + "Wybierz inny plik". Copy is the K26 both-bank `unknownFormat`. |
| step 1 USD | "**Waluta inna niż PLN.** Wybierz plik rachunku prowadzonego w PLN." (kit `importErrors.wrongCurrency`) + "Wybierz inny plik". |
| step 1 ING ready | Chip "Lista_transakcji_… · rozpoznano format ING" + "Dalej". Regression unchanged apart from the per-bank key. |
| step 1 Santander ready | Chip "historia_2026-08-31_…3334.csv · rozpoznano format Santander" + "Dalej". At 400 px the long file name wraps inside the chip (`overflow-wrap:anywhere`) and the page does not scroll sideways. |
| step 2 Santander | Kit `imports-account` row pattern with one account preselected: "Rachunek · •• 3334", "Santander Bank Polska · 187 transakcji", "wybrane", Wstecz / Dalej ↗. |
| step 3 Santander ready | Kit `imports-summary` `dl` grid: "Santander · Rachunek · •• 3334", 01.03–31.08.2026, 184 transakcje, 3 transakcje skipped, "Importuj 184 obciążenia ↗" (G25 placeholder). One column at 400 px. |
| step 3 Santander overlap | After the first Santander import: the alert "Ten zakres nachodzi na istniejący import: 1 marca – 31 sierpnia 2026. …" with the range linked to `/imports`, then "Wybierz inny plik" / "Wróć do importów". No import button. |
| step 3 ING ready | Regression: "ING · Rachunek Firmowy Główny · •• 0001", 206 / 16, "Importuj 206 obciążeń". |
| result Santander | "Dodaliśmy 184 obciążenia.", lead "Santander · Rachunek · 1 marca – 31 sierpnia 2026", stat 184 transakcje, "Zobacz wzorce ↗" / "Przejdź do przeglądu". This is the G26 layout, and the kit h1 is absent by design. |
| result ING | "Dodaliśmy 206 obciążeń.", "ING · Rachunek Firmowy Główny · 1 września 2025 – 31 sierpnia 2026". Regression unchanged. |
| list ING + Santander | Kit `imports` table: Data importu / Rachunek / Zakres dat / Obciążenia / "Usuń import". Rows "ING · Rachunek Firmowy Główny" (206) and "Santander · Rachunek" (01.03–31.08.2026, 184). At 400 px the table scrolls inside its panel, and the page stays at 400 px (the kit frame itself overflows to 553 px). |

Tokens: no colour outside the named tokens was introduced by this slice. The diff on these views is copy and label
plumbing only (`accountLabel()`, `formatRecognised[bank]`, `bankName[bank]`). Page level:
`scrollWidth` = viewport width (1440 / 400) in all 26 app shots.

## Hand-checked number: Santander result = 184 debits, 13 421,09 zł

`test/fixtures/santander/expected.json` → `files["historia_2026-08-31_61109012340001111222233334.csv"]`:
`declaredCount` 187, `imported.count` 184, `imported.sumMinor` 1342109. Independent recount from `expected.json`
`rows[]` for that file: 187 rows, 3 with `skipReason: "credit"`, so 187 − 3 = **184** imported, and Σ|`amountMinor`|
of the imported rows = 1 342 109 gr = **13 421,09 zł**.

On screen: step 2 "187 transakcji", step 3 "Obciążenia do importu 184 transakcje" and "Pominięte wpływy / zwroty 3
transakcje", result "Dodaliśmy 184 obciążenia." with stat 184. Read-only query against the local DB for both visual
accounts: `source = santander`, `account_name = Rachunek`, `count = 184`, `sum(amount_minor) = 1342109`. ✓ The ING
control gives 206 rows and 6497547 gr on both accounts.

## Keyboard path (Playwright, real key events, desktop account)

- `/imports/new` initial focus is `body`. Tab order: shell links → "Wróć do importów" → "Wybierz plik" → chip "Dalej",
  all `:focus-visible`.
- Enter on "Dalej" leads to step 2, where focus moves to `h1` "Wybierz rachunek.". Tab order: radio → Wstecz → Dalej ↗.
  ArrowDown moves the radio selection. Enter on Dalej leads to step 3, where focus is on `h1` "Sprawdź przed
  importem." and the next Tab goes to **Wstecz** first, then the import button. Initial focus is never on the
  submitting button. Enter on Wstecz leads back to step 2 with focus on `h1`.
- The overlap step 3 has no destructive or submitting action; focus is on `h1`.
- `/imports` initial focus is `body`. Enter on "Usuń import" opens `DeleteImportDialog` with focus on the **dialog
  container**, not the destructive "Usuń import" button. Tab goes to "Usuń import" and then "Zamknij". Esc closes
  the dialog, and focus returns to the trigger. The delete was never confirmed, and no `alert`/`confirm` was
  triggered.

## Discrepancies and fixes

None found. No code was changed, so the full gate was not re-run. The handoff records what was re-observed (lint, vitest).

## Observations (not fixed, not blocking)

1. **The list at 400 px** scrolls the table inside the panel, so the "Obciążenia" column is cut at the edge until
   the user scrolls. This predates S-10 (the `overflow-auto` wrapper in `index.astro` is unchanged by this slice), and the kit frame
   overflows the whole page instead.
2. **"Santander · Rachunek" carries no account tail on the list.** Two Santander accounts would be told apart only
   by range. This is already the `[human]` row 6.10 (K26 wording) and decision 5 of the plan.
3. **The result page omits the kit h1 "Wzorce są już widoczne." and the pattern stats.** This predates the slice and
   is tracked as G26.
4. **The step 1 chip shows the full Santander file name, which contains the synthetic account number.** For a real
   export this is the user's own file name, shown only in their own browser and never sent. It behaves the same as
   ING.

VISUAL: PASS — all 13 [visual] states of rows 5.6/6.6 captured at 1440 + 400 px (26 app PNGs) against 6 kit frames, no page-level horizontal scroll, keyboard path and initial focus safe (step 3 → h1, delete dialog → container), Santander result 187 − 3 = 184 debits / 13 421,09 zł hand-checked against expected.json and the DB; no fixes needed
