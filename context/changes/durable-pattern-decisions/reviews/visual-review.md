# Visual review — `durable-pattern-decisions` (`/patterns/<key>` actions dialog, excluded banner, merged variants; `/patterns` „Wykluczone”; `/settings` + `/imports` dialogs)

Step: visual gate of run `2026-09-28-s05-s06-s07`, 2026-09-28, branch `feat/durable-pattern-decisions`. Compared
`PatternActionsDialog.tsx`, `RestoreForm.astro`, `ExcludedPatterns.astro`, `src/pages/patterns/[...key].astro`,
`src/pages/patterns.astro` and the shared `src/components/ui/dialog.tsx` (consumers `DeleteAccountDialog`,
`DeleteImportDialog`) against `design/rytm-os/prototype/app.js` (`patternDetail()`, `modal()`, `applyPatternState()`,
`patterns()`) and `prototype/styles.css` (`.modal*`, `.modal-actions`, `.detail-top`, `.detail-actions`,
`.excluded-*`, `.inline-alert`). Screenshots, accounts and the state table: `../screenshots/README.md`.

## Capture method

- **PNG set:** Playwright 1.55 (outside the repo) driving headless system Chrome, desktop 1440×900 + mobile 400×812,
  two fresh accounts registered through `/register` on `astro dev --port 4399`, data imported through the
  `/imports/new` wizard, every decision made through the product UI. Kit frames from the prototype on :4398.
- **Claude-in-Chrome:** the browser selected at preflight (inherited, `tabs_context_mcp` worked, never
  selected/switched) was used for the bfcache check (row 5.9) in real, headed Chrome, in its own tab, closed after.
  Why not for the PNGs: see `## Autonomous decisions` in the handoff.

## States

Plan rows 5.8 (2 states) and 7.10 (20 states), each desktop + 400 px = 44 app PNGs, plus 14 kit frames. All 22
states captured; verdicts:

| State | Verdict |
| --- | --- |
| `detail-actions-closed` | kit `.detail-top`: back link left, ghost „Akcje” (`more` glyph) right; at 400 px the column stacks and the button is 364 px = full width (kit `.detail-actions .btn{width:100%}`) |
| `actions-dialog` | kit `modal('patternActions')`: eyebrow „Akcje na wzorcu” (`excess-text`), h2 26 px, lead, four ghost buttons with `merge`/`switch`/`edit`/`exclude`, left-aligned, full width after fix 1 |
| `merge-picker` / `rename-field` | G33 forms under their toggle: label, 8 px field, primary submit; rename prefilled with the current name, hint under the field |
| `merge-none` | „Scal z…” disabled + „Brak innych wzorców do scalenia.” |
| `rename-error` / `merge-error` / `decision-error` | `InlineAlert error` under `.detail-top` with `x.nameInvalid` / `x.mergeInvalid` / `x.decisionError` |
| `pending` | after fix 2: only the pressed submit reads „Zapisywanie…”; the other submits are disabled with their own labels |
| `merged-result` | „Wzorce scalone.”, h1 SPORTOWO, „Scalone warianty” → `sportowo.pl` + „Cofnij scalenie” |
| `absorbed-redirect` | `/patterns/sportowo.pl` → 302 → `/patterns/sportowo`, 200 |
| `renamed-result` / `typed-result` / `unmerged-result` | success lines; h1 „Sportowo”; KAWIARNIA FILIŻANKA badge „stały” + „Akceptowana kwota” editor; `sportowo.pl` back as its own pattern |
| `excluded-banner` / `restored-result` | kit `.excluded-banner` („Wykluczony z analizy” + „Przywróć” on the right, after fix 3) above the heading; restore → banner gone + „Wzorzec przywrócony do analizy.” |
| `list-excluded-closed` / `-open` | kit `.excluded-section`: arrow −90° closed / 0° open, „Wykluczone” 800 + „1 wzorzec” 500, panel list with mark, name, „Wykluczony z analizy”, „Przywróć”; the excluded pattern is not in the table (29 rows) |
| `list-restored` | „Wzorzec przywrócony do analizy.” above the table, section gone |
| `list-all-excluded` | table header + footer „0 wzorców · wszystkie miesiące”, section „4 wzorce” (G33) |
| `settings-delete-dialog` / `imports-delete-dialog` (5.8) | 480 px at 1440 (x 480), x 20 / 360 px at 400 (20 px margin), padding 31, radius 13; close button (right 19 / top 18) clear of the eyebrow text |

## Hand-checked number (US-03 walk-through, row 7.11)

Merged `sportowo` against the fixture rows (`test/fixtures/ing/expected.json`, imported debits):

- `SPORTOWO SP. Z O.O.`: 154,90 + 59,99 + 349,00 + 99,90 = **663,79 zł**, 4 occurrences
- `sportowo.pl UL. BIEGOWA 7`: 129,00 + 259,00 + 74,50 + 189,99 = **652,49 zł**, 4 occurrences
- merged: 663,79 + 652,49 = **1316,28 zł**, 4 + 4 = **8** (oracle `sportowo` `sumMinor` 131628, 8 raw rows)

On screen (`list-excluded-open-*`): row „Sportowo | częsty | 8 | 1316,28 zł” (new name, D5 re-type częsty). Own
transfer „JAN PRZYKŁADOWY” only in „Wykluczone” (not among the 29 table rows). KAWIARNIA FILIŻANKA pinned: „stały”,
Kwota 25,66 zł = the oracle median 2566. ✓

## Keyboard

- Actions dialog: opening focuses the dialog itself (`[role=dialog]`), never an action — including „Wyklucz z
  analizy”. Tab: „Scal z…” → „Zmień typ” → „Zmień nazwę” → „Wyklucz z analizy” → „Zamknij” → wraps (focus trap). Esc
  closes, focus returns to „Akcje”; Enter on „Akcje” reopens. Same at 400 px. Row 6.9 (ticked by code inspection in
  impl-review) is confirmed in the browser.
- `DeleteAccountDialog`: initial focus on the password input, `DeleteImportDialog`: on the dialog — neither on the
  destructive button. Esc closes both, focus returns to „Usuń konto” / „Usuń import”.
- Banner „Przywróć” is focusable and Enter submits it (`?restored=1`). List `<summary>` opens with Enter.

## bfcache (row 5.9, real Chrome through Claude-in-Chrome)

- **„Zapisz próg”** (`/patterns/muzykalnia`, value 20 → `?saved=1`) then `history.back()`: the page came from bfcache
  (a `window` marker set before the submit survived). The editor button reads its idle label, not disabled.
- **„Usuń import”** (confirmed → `/imports?deleted=1`) then back: restored from bfcache (marker survived), the dialog
  is still open, and its button reads „Usuń import”, enabled — not „Usuwanie…”. `usePageShowReset` (as changed in
  `9de439b`) works.
- Side observation: the bfcache page shows the deleted import's row with the dialog open. Pressing it again hits
  the idempotent delete (S-04 decision 8). This is not a defect of this slice.

## Tokens / copy

- `grep -nE "#[0-9a-fA-F]{3,6}\b|\[#"` over the three changed files: no hits. Colour classes only from the token set.
- Every visible string comes from `copy` / `copyExtra` (K22 / G33 as reviewed in 6.8). No new strings in this step.

## Fixes on this branch — `c14f75a`

1. **`PatternActionsDialog.tsx` `actionButton`:** the four action buttons were content-width (110–180 px). Kit
   `.modal-actions` buttons are the grid items and stretch to 418 px. Here the grid items are the `<div>` / `<form>`
   wrappers, so the header comment's claim was wrong. Fixed: `w-full justify-start`.
2. **`PatternActionsDialog.tsx` `pending`:** one boolean shared by all forms, so a merge relabelled „Zmień typ” and
   „Wyklucz z analizy” to „Zapisywanie…” as well (three identical pending buttons). Now
   `pending: "merge" | "type" | "rename" | "exclude" | null`: every submit is disabled while one posts, and only the
   pressed one shows the pending text. `usePageShowReset` resets it to `null`.
3. **Excluded banner (`[...key].astro` + `InlineAlert.astro`):** „Przywróć” wrapped onto a second line under the text
   at both widths. Kit `.excluded-banner{justify-content:space-between}` keeps it on the row's right edge.
   - `InlineAlert` gained an optional `bodyClass` (merged onto its content `<span>` with `class:list`). The banner
     passes `flex flex-1 flex-wrap items-center justify-between`.
   - The kit's accidental centring of the text (three flex items under `space-between`) is not copied. The text stays
     by its icon.

Gate after the fixes (baseline `main` `f252112`: lint 0 · astro check 109 files · vitest 141/8 · pgTAP 76/4 ·
smoke 77):

| Check                             | Result                                                                   |
| --------------------------------- | ------------------------------------------------------------------------ |
| lint                              | 0 errors, 0 warnings (Δ0)                                                |
| `astro check`                     | 0 errors, 120 files (+11, unchanged from the impl-review)                |
| `fixture:check`                   | OK                                                                       |
| `npm test`                        | 190 passed, 11 files (+49 / +3, unchanged)                               |
| build                             | Complete                                                                 |
| smoke on :4398                    | 111 PASS / 0 FAIL (+34, unchanged)                                       |
| `db reset` + `supabase test db`   | Files=5, Tests=102, PASS (+26). Run at the end, after the visual accounts |

## Observations (not fixed, not blocking)

1. The detail header shows „Suma w sierpniu 0,00 zł / 0 wystąpień” for merged SPORTOWO, whose last occurrence is
   in July. The reference month is the latest month in the user's data. This is S-04 behaviour (empty-month,
   decision 14), not S-05. The merged count and sum are visible on the list.
2. The excluded pattern's header still shows „Ponad progiem w tym miesiącu 0,00 zł” in `excess-text`. This is the
   S-04 visual-review observation 3 (G31), and it is correct: exclusion zeroes the over-limit.
3. The kit shows the banner at the top of `.dash-main`, above the back link. The plan (Phase 6) puts it above the
   heading, under `.detail-top`. It was kept as planned.
4. F8 (no scroll in `DialogContent`): at 400×812 the tallest state (`rename-field`) is 596 px and fits. It stays open
   for viewports lower than about 650 px.
5. The app modal keeps its pre-S-05 1 px `border-line`, so buttons are 416 px vs the kit's 418 px.

VISUAL: PASS — all 22 [visual] states (5.8 + 7.10) captured desktop 1440 + 400 px against 14 kit frames, bfcache (5.9) verified in real Chrome, US-03 walk-through hand-checked (Sportowo 8 × / 1316,28 zł = 663,79 + 652,49); three real discrepancies (content-width action buttons, shared pending label, wrapped „Przywróć”) fixed in c14f75a
