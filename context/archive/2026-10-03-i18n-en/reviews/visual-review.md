# Visual review — `i18n-en` (S-16: English interface, language switch in three places)

Step: visual gate of run `2026-10-03-i18n-en`, 2026-10-03, branch `feat/i18n-en`, Progress rows 6.8, 7.8, 7.9. Every
state of the plan's `[visual]` rows captured in EN (`rytm-locale=en`) and PL (`rytm-locale=pl`) at 1440 px and 400 px;
PL views compared with the kit frames and, as text, with `main` (`b973428`). State table, accounts and files:
`../screenshots/README.md`.

## Capture method

- **PNG set:** Playwright 1.55 (outside the repo) driving headless system Chrome on `astro dev --port 4399`; 37 app
  states → 75 PNGs, plus 7 kit frames × 2 = 14; 89 in all, 0 NOT CAPTURED. Each shot records `lang`, `scrollWidth` vs
  viewport, `undefined`/`NaN`/unfilled `{…}` in `innerText`, and elements clipped or past the right edge; all console
  errors/warnings and page errors were collected for every page.
- **PL copy diff:** `main` (`git archive main`, outside the repo) ran on `:4398` against the same local Supabase and the
  same session; `document.body.innerText` lines of each PL page compared with the branch.
- **Claude-in-Chrome (headed cross-check):** preflight browser inherited (nothing selected or switched); own tab on
  `:4399/login`. That Chrome sends `pl-PL`, so the first visit rendered PL (`lang="pl"`, „Zaloguj się”) — the
  `Accept-Language` rule. Mouse click on EN → same URL `/login`, `lang="en"`, „Log in”. A second extension click on PL
  did not register (twice, centre of the 32×26 button); a DOM `click()` on the PL button submitted the form → `/login`,
  `lang="pl"`. Tab closed; that Chrome keeps `rytm-locale=pl` for `localhost`, the same language its `pl-PL` gives.
  Keyboard path proven in Playwright (below).
- **Data and cleanup:** product UI (register, wizard import, threshold editor, exclude dialog, recovery mail from
  Mailpit) plus one `POST /api/imports` in the smoke format for the one-month account; `npx supabase db reset` at the
  end. `:4398` / `:4399` killed, `:4321` never touched.

## Language switch (rows 6.8, 7.8)

| Place                                | Keyboard focus                                                                                                    | Enter                               | Mouse back                           |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------- | ------------------------------------ |
| SiteFooter on `/`                    | EN focused, Shift+Tab → PL, `:focus-visible` true, 3 px `ink/15` ring visible in `en-switch-footer` (both widths) | → `/`, `lang="pl"`                  | click EN → `/`, `lang="en"`          |
| AuthLayout corner on `/login`        | same, `en-switch-auth`; from PL: Tab → EN, `pl-switch-auth`                                                       | → `/login`, `pl` (and `en` from PL) | back to the start locale on `/login` |
| `/settings` panel „Język / Language” | same, `en-switch-settings`                                                                                        | → `/settings`, `pl`                 | → `/settings`, `en`                  |

The active button carries the ink border and ink text, the inactive one `line`/`muted`, `aria-pressed` matches. At
400 px the auth corner sits above the form (top right of the paper pane), the footer switch stays on the link row, the
settings panel keeps title left / switch right — nothing wraps or overlaps.

## EN states (row 7.8)

| Group                       | Verdict                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public + auth pages         | Landing, how it works, for who, login (default and `?error=1`), register (default and `?error=occupied` alert with two links), confirm e-mail, reset, reset/new (real recovery form and `?state=expired`): all `lang="en"`, layout as PL; the longest strings („Money slips away in a rhythm. Rytm shows you that rhythm.”, „You can set your password again.”, the occupied alert) wrap inside their columns at 400 px; full-width buttons hold their labels on one line. |
| `/home`                     | With data: lead „Your August in one calm view.”, accent card **548.59 zł**, foot „+548.59 zł compared to July”, 12 trend bars „Sept 25 … Aug 26” (en-GB short month), legend „total over the limit” / „A thin line means 0.00 zł”, „Fixed costs” Gone up 1 cost / New 1 cost. One month: „Your May in one calm view.”. Empty: kit `home-empty` layout in EN.                                                                                                               |
| `/patterns`, detail         | Table headers „Merchant · Type · Occurrences · Amount · Total · Limit · Over the limit” fit at 1440 px; limit cell „3 × / month”, over-limit 548.59 zł. At 400 px the table scrolls inside its panel exactly as the PL table does (pre-existing design, no page scroll). Excluded section „Excluded · 1 pattern”. Detail: editor „Count per month / Total per month”, „Save limit / Remove limit”, 2 of 5 rows badged „over the limit”.                                    |
| `/fixed`                    | Changes: KINOTEKA 59.99 zł „+4.00 zł · increase”, „New in August” SIŁOWNIA RUCH, „Unchanged · 3 items”. No comparison: „No previous month to compare with.”, sections with counts only.                                                                                                                                                                                                                                                                                    |
| `/imports`                  | List, empty, wizard file step, overlap (client-side check on step 3: alert with linked range „1 September 2025 – 31 August 2026” and „Choose another file / Back to imports” side by side at 400 px), result „We added 206 debits.”.                                                                                                                                                                                                                                       |
| `/settings` + delete dialog | Panel labels in EN; dialog „Delete the account without a trace?”, initial focus on „Current password” (not on the destructive button), `DELETE` typed + a password → „Delete account” enabled (both widths); dialog closed with Esc, never submitted.                                                                                                                                                                                                                      |

Page level: in all 75 app shots `scrollWidth` equals the viewport; no `undefined`, `NaN` or unfilled `{…}`. The only
clipped elements reported are text-less decorative spans (auth/landing circles inside `overflow-hidden`) and the
dialog's `sr-only` „Close” — not discrepancies. **Console: 0 errors, 0 warnings, 0 page errors** on `:4399` across every
EN and PL page, including the `PatternsTable` and `ImportWizard` islands — no hydration mismatch, so follow-up F4's
trigger did not fire.

## PL states (row 7.9)

Text diff branch vs `main` (lines of `innerText`, same data, same session):

| Page                                       | Added on the branch            | Removed |
| ------------------------------------------ | ------------------------------ | ------- |
| `/` (signed in and anonymous)              | `PL`, `EN` (footer switch)     | —       |
| `/login`                                   | `PL`, `EN` (auth corner)       | —       |
| `/home`, `/patterns`, `/fixed`, `/imports` | —                              | —       |
| `/settings`                                | `Język / Language`, `PL`, `EN` | —       |

So PL copy is unchanged apart from the switch. Against the kit frames: same layout, tokens and copy as before the slice;
the auth visual title is now bold (kit `.auth-copy h1`) and the landing steps head stacks at 400 px (kit) — the two
planned follow-ups. The new „Język / Language” panel and the switch are K43 (no kit frame).

## Hand-checked numbers

- **548.59 zł (EN `/home`).** STACJA PALIW DROGOWSKAZ, August 2026: 01.08 84.76 · 03.08 120.65 · 10.08 286.10 ·
  18.08 244.18 · 29.08 304.41 zł (detail page). Limit 3 per month → the 4th and 5th count: 244.18 + 304.41 =
  **548.59 zł**; July has ≤ 3 → 0, so the foot reads +548.59 zł. Rendered `548.59 zł`: dot decimal, space, `zł`.
- **52.99 zł (EN `/patterns`, one-month account).** Kawiarnia VG `amountMinor` 5299 → **52.99 zł**; thousands use a
  comma (`1,500.00 zł`, `20,015.11 zł`).
- **Month lead.** August is the latest month of the ING fixture (2025-09 … 2026-08) → „Your August”; the one-month
  account's only month is May → „Your May”. Both English nominatives (the impl-review fix `1dbab76` holds with data).

## Discrepancies and fixes

None. No code changed in this step, so the local gate was not re-run (the impl-review step's results stand: lint 0,
astro check 0, vitest 434, build OK, pgTAP 6/119, smoke 205).

## Observations (not fixed, not blocking)

1. **Focus ring is subtle.** The switch uses the shared `focusRing` (3 px `ink/15` box-shadow), the same as every other
   control; visible on `paper`, but low contrast. App-wide token, not S-16.
2. **„Sept” on the trend axis** is en-GB CLDR for September; rendered in SSR only (no hydration).
3. **Tables scroll inside their panel at 400 px** (`/patterns`, `/imports`) in both locales — pre-existing.
4. **Merchant names, account names and statement descriptions stay Polish in EN** — bank data (impl-review O3/O5).
5. **Chrome extension** registered one of two mouse clicks on the small switch button; Playwright's real mouse and
   keyboard events worked every time — an extension quirk, not a product bug.

VISUAL: PASS — all [visual] states of rows 6.8/7.8/7.9 captured in EN and PL at 1440 + 400 px (75 app PNGs + 14 kit frames, Playwright; headed Chrome cross-check of the switch on /login); switch keyboard-focusable with visible ring and returns to the same page in footer, auth corner and settings; PL text identical to main apart from the switch; EN /home with data reads „Your August” and 548.59 zł; 0 console errors, no page-level overflow
