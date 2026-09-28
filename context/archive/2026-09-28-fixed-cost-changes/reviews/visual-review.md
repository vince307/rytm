# Visual review — `fixed-cost-changes` (`/fixed`, „Koszty stałe”)

Step: visual gate of run `2026-09-28-s05-s06-s07`, 2026-09-28, branch `feat/fixed-cost-changes`. Compared
`src/pages/fixed.astro`, `src/components/fixed/FixedSection.astro`, `src/components/fixed/FixedRow.astro`,
`src/components/app/Badge.tsx` (tone `new`) and `src/components/patterns/merchant-mark.ts` against
`design/rytm-os/prototype/views/fixed.html`, `fixed-empty.html`, `app.js` `fixedCosts()` and `styles.css`
(`.fixed-section`, `.section-label`, `.fixed-list`, `.fixed-row`, `.fixed-change`, `.compact`, `.merchant-mark`,
`.badge.new`). Screenshots, accounts and the state table: `../screenshots/README.md`.

## Capture method

- **PNG set:** Playwright 1.55 (outside the repo) driving headless system Chrome, desktop 1440×900 + mobile 400×812,
  full page. Eight fresh accounts registered through `/register` on `astro dev --port 4399`. All data came in through
  the `/imports/new` wizard: the F-02 fixture, or subsets of it crafted outside the repo. Decisions were made through
  the S-05 „Akcje” dialog. Kit frames come from the prototype over `file://`.
- **Claude-in-Chrome:** the browser selected at preflight was inherited: `tabs_context_mcp` worked, and the agent
  never selected or switched a browser. It used its own tab and closed it afterwards. In real headed Chrome it signed
  in to the overview account, pressed „Przywróć” on the excluded KINOTEKA banner, and read `/fixed` for the US-04
  walk-through. It also checked the keyboard and landmark facts listed below.

## States (row 4.11) — 10 states × 2 viewports = 20 app PNGs + 4 kit frames

| State                 | Verdict                                                                                                                                                                                              |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fixed-pre-import`    | Matches `kit-fixed-empty` text for text: eyebrow, title, lead, „Wgraj pierwszy wyciąg” panel, „Wgraj CSV ↗”.                                                                                         |
| `fixed-overview`      | Kit `fixedCosts()` layout. Section label h2 17 px + muted count. Panel rows 70 / 55 px (compact). Mark, name 13 px, meta 11 px muted. Amount + bold amber delta. `nowy` badge.                       |
| `fixed-no-comparison` | „Zmieniły kwotę · 0 pozycji” + empty line. „Nowe” shows „Nie ma poprzedniego miesiąca do porównania.” (US-04 AC), never „nowy” rows. Bez zmian 13.                                                   |
| `fixed-gap-month`     | July is empty, so there is no comparison: the no-comparison message shows. Changes are still measured against the previous occurrence (KINOTEKA vs June 55,99).                                      |
| `fixed-decrease`      | `−5,00 zł` uses U+2212 and `green` `#2E5C50`. ZUS `−487,15 zł` is also green (G34, plan decision 12).                                                                                                |
| `fixed-double-charge` | Two August charges (17.08 59,99, 24.08 59,99). The row reports 17.08 „poprzednio 55,99 zł” +4,00. The rise on the first charge is not hidden behind the unchanged second one (plan Key Discoveries). |
| `fixed-excluded`      | KINOTEKA gone. „Zmieniły kwotę · 0 pozycji” + „Żaden koszt stały nie zmienił kwoty w tym miesiącu.”                                                                                                  |
| `fixed-no-fixed`      | Three sections, three muted empty lines, „0 pozycji” ×3 (plan decision 11).                                                                                                                          |
| `fixed-read-error`    | Title block + `InlineAlert` error. Same component and copy as `/patterns` (K18).                                                                                                                     |
| `fixed-long-name`     | After fix 1, the name wraps. At 400 px the amount/delta column stacks (`.fixed-change` column, `align-items:end`) and never splits.                                                                  |

Page-level: no horizontal scroll in any shot (`scrollWidth` = viewport). The mobile bottom nav marks „Stałe” active.

## Hand-checked number (row 4.12, US-04 walk-through)

Fixture oracle `test/fixtures/ing/expected.json` `rows[]`, pattern `kinoteka`, imported:
2026-08-17 `-5999` (line 27), 2026-07-17 `-5599` (line 49).

- R = 2026-08 (latest month in the data), P = 2026-07. KINOTEKA has an occurrence in P, so it is not new.
- The latest R occurrence that differs from its predecessor: 17.08 **59,99 zł** vs 17.07 **55,99 zł** →
  delta = 5999 − 5599 = **+400 gr = +4,00 zł**.
- On screen (Playwright and real Chrome): „KINOTEKA · 17.08.2026 · poprzednio 55,99 zł · 59,99 zł · +4,00 zł”. ✓
- `silownia-ruch`: one imported row (line 36), 2026-08-05, 129,00 zł. P has transactions and it has none, so it is new:
  „pierwsze wystąpienie · 05.08.2026 · 129,00 zł · nowy”. ✓
- Lapsed: `kurs-przyklad.pl` last 2026-03-02 and `phu-przyklad` last 2026-06-02, neither in R. Both are absent from the
  page (Chrome `innerText` has no match). ✓
- Counts: „1 pozycja” / „1 pozycja” / „3 pozycje” = 1 / 1 / 3 rendered rows. ✓ (The kit's own frame says „3 pozycje”
  over 2 rows, which is a kit inconsistency and was not copied.)
- Decrease check (crafted): 5099 − 5599 = −500 → „−5,00 zł”. ✓

## Keyboard / semantics (real Chrome)

- `<main>` has **0 focusable elements**: rows are not links (plan: no row link, no dismiss). The Tab path is the
  shell only: sidebar and mobile nav, whose active entry has `aria-current="page"`, and „Wyjdź”.
- One `h1` („Co zmieniło się samo?”) and three `h2` section titles in kit order. The mark is `aria-hidden`.

## Tokens / copy

- `grep -nE "#[0-9a-fA-F]{3,6}\b|\[#"` over `src/components/fixed`, `src/pages/fixed.astro` and `merchant-mark.ts`:
  no hits. Colours are the token names only.
- Every visible string comes from `copy` / `copyExtra` (G34, K23). This step added no strings.
- `Badge` `new`: text `#7E5726` = kit. The background is `#E7DCC9` vs the kit's `#EFE4D1` (pixel samples). As planned,
  this is a G34 note in `context/foundation/design-kit.md`, not a new token.

## Fixes on this branch — `29c4829`

1. **`FixedRow.astro`, long name at 400 px:** the name column did not shrink, so the amount column was squeezed and
   money broke before the currency: „94,00 / zł”, „+5,00 / zł”, and ZUS „1512,30 / zł”. The kit never hits this
   because its sample names are short. Fix: name column `min-w-0`, amount column `shrink-0 whitespace-nowrap`. The
   compact row also got the `gap-5` / `max-[559px]:gap-3` gap, which it lacked, so a long name cannot touch the
   amount.
2. **`merchant-mark.ts` `merchantMark`:** `rounded-lg` resolves to 14 px because the app theme sets `--radius: 14px`,
   so the mark rendered almost round. Kit `.merchant-mark` is 8 px. Fix: `rounded-[8px]`. It is shared, so the
   `/patterns` table and the „Wykluczone” list now match the kit too, in the same direction.

Gate after the fixes. Baseline is the agent contract, `main` `3706508`: lint 0 · astro check 120 files · vitest 190/11 ·
pgTAP 102/5 · smoke 111.

| Check                           | Result                                               |
| ------------------------------- | ---------------------------------------------------- |
| lint                            | 0 errors (Δ0)                                        |
| `astro check`                   | 0 errors, 124 files (+4, unchanged from impl-review) |
| `fixture:check`                 | OK                                                   |
| `npm test`                      | 213 passed, 12 files (+23 / +1, unchanged)           |
| build                           | Complete                                             |
| smoke on :4398                  | 121 PASS / 0 FAIL (+10, unchanged)                   |
| `db reset` + `supabase test db` | Files=5, Tests=102, PASS (+0)                        |

## Observations (not fixed, not blocking)

1. **Panel radius** is 20 px (`rounded-xl` under `--radius: 14px`) vs the kit `.panel` 12 px. It is app-wide
   (`Panel.astro`, `ExcludedPatterns`, `PatternsTable`), and `/fixed` stays consistent with it. Logged in
   `follow-ups/review-fixes.md` with a `Trigger:`.
2. **JAN PRZYKŁADOWY 1500,00 zł** („przelew na konto osobiste”, T08) is listed under „Bez zmian”. It is D5-fixed in
   the fixture, and the user's remedy is S-05 exclusion (the S-05 visual gate excluded it for the same reason). This
   is correct per rule.
3. **One-off merchants listed as „nowy”** show clearly on two-month data (`fixed-decrease`: PIZZERIA, MINIMARKET,
   ADAM TESTOWY, PAYPAL). This is the existing follow-up (plan decision 8).
4. **The read-error copy** („Błąd — sprawdź plik CSV.”) is the generic `copy.components.error` shared with `/patterns`
   (K18). It reads oddly for a read failure, but it is not S-06's to change.
5. **The page background** is `paper-soft` `#E8ECEA` vs the kit's `.dash-shell` `#EDF0EF`. This comes from the app
   shell (pre-S-06), not from this view.

VISUAL: PASS — all 10 [visual] states (4.11) captured desktop 1440 + 400 px against 4 kit frames, US-04 walk-through (4.12) hand-checked (KINOTEKA 5999 − 5599 = +4,00 zł vs 55,99 zł; SIŁOWNIA RUCH nowy 05.08.2026; lapsed absent; 1/1/3 rows) in Playwright and real Chrome; two real discrepancies (amounts splitting before „zł” at 400 px, 14 px merchant-mark radius) fixed in 29c4829
