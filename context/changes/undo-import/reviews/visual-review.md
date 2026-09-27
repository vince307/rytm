# Visual review — `undo-import` (`/imports`: akcja usunięcia, dialog, linie statusu)

Step: visual gate of run `2026-09-27-s03-s02-s04`, 2026-09-27, branch `feat/undo-import`. Compared `/imports`
(`src/pages/imports/index.astro`, `src/components/imports/DeleteImportDialog.tsx`, shared `src/components/ui/dialog.tsx`
`DialogContent`, `src/components/ui/button.tsx` `text-danger`/`danger`) against `design/rytm-os/prototype/views/imports.html`
and `modal('deleteImport')` (`app.js` `imports()`, `modal()`; `styles.css` `.import-table`, `table`, `.text-button.danger`,
`.modal-backdrop`, `.modal`, `.btn-danger`). Screenshots and the state table: `../screenshots/README.md`.

## Capture method

Playwright library (npx cache) driving headless system Chrome, script outside the repo; Claude-in-Chrome not used
(needs a human to pick a browser). Fresh local account with two non-overlapping imports of the main fixture account
(93 + 113 debits); `success` and `empty-after-last-delete` came from real deletes through the dialog.

## States (plan 2.9)

| State | Captured | Verdict |
| --- | --- | --- |
| `default` | desktop + 400 px | kit layout: eyebrow/h1/lead + „+ Nowy import”, panel with five columns, empty 5th `th` |
| `dialog-open` | desktop + 400 px | eyebrow „Cofnij import”, h2 with the real range (K19 `{range}`), body, one danger button, close X — as kit |
| `success` | desktop + 400 px | `InlineAlert success` „Import usunięty.” under `PageTitle`, one row left (G30/K20) |
| `error` | desktop + 400 px | `InlineAlert error` `deleteError` above the table (G30) |
| `not-found` | desktop + 400 px | `InlineAlert error` `deleteMissing` above the table (G30) |
| `empty-after-last-delete` | desktop + 400 px | status line above the kit empty view (`ViewEmpty`) |
| `trigger-focus` | desktop + 400 px | visible 3 px `ink/15` ring on „Usuń import” |
| pending „Usuwanie…” | not captured | code-reviewed only, as the plan states |

## Checks

- **Layout / components**: table cells 16×17 px, 11 px uppercase muted headers, 13 px body — value-for-value with
  kit `th,td`; action is `Button variant="text-danger" size="inline"` = kit `.text-button.danger` (12 px, 800,
  `amber-dark` → `excess-text`, `padding:5px 0`). Status lines reuse `InlineAlert` (kit `.inline-alert`).
- **Tokens**: `grep -nE "#[0-9a-fA-F]{3,6}\b|\[#"` over `DeleteImportDialog.tsx` and `imports/index.astro`: no hits;
  on screen only `ink`/`paper`/`paper-soft`/`excess-text`/`muted`/`line`/`green`.
- **Copy**: every string rendered comes from `copy` / `copyExtra.imports` (K19 verbatim, K20/G30 placeholders);
  the dialog title uses `formatRangeLong` („1 marca – 31 sierpnia 2026”).
- **Keyboard path** (after fix): Tab → „Usuń import” (visible focus) → Enter opens → focus on the dialog → Tab cycles
  „Usuń import” ↔ „Zamknij” inside the trap → Esc closes → focus back on the trigger with `:focus-visible`. Same on
  400 px.
- **Mobile (plan 2.10)**: page never scrolls horizontally at 400 px; the table (549 px) scrolls inside the panel and
  the fifth column is reachable (`table-scrolled-mobile.png`). Dialog at 400 px: `left: 0`, width 400 — identical to
  the G24 measurement for `/settings`, so „no worse than G24” holds.

## Fixes on this branch (`8013681`)

1. `src/pages/imports/index.astro` — the action cell was `text-right`; kit `td` is left-aligned (the „Usuń import”
   in `kit-default-desktop.png` starts at the column's left edge). Removed `text-right`, kept `whitespace-nowrap`.
   The plan's Phase 2 contract said „right-aligned” — the kit wins (source of truth).
2. `src/components/imports/DeleteImportDialog.tsx` — Radix auto-focused the first tabbable element, i.e. the danger
   submit „Usuń import”: Enter on the trigger followed by a second Enter deleted the import. `onOpenAutoFocus` now
   focuses the dialog itself (title announced via `aria-labelledby`); the kit defines no focus management, so this is
   the WAI-ARIA APG default for destructive dialogs, not a new visual.

## Observations (not fixed, not blocking)

1. **Dialog geometry vs kit** — shared `DialogContent` is 440 px / padding 22 px / `rounded-xl`, kit `.modal` is 480 px /
   31 px / 13 px, and the kit's `.modal-backdrop{padding:20px}` keeps a 20 px margin at 400 px where the app has 0.
   Pre-existing since S-01 (`/settings` `DeleteAccountDialog` uses the same component); fixing it here would restyle a
   neighbouring view. The G24 row in `context/foundation/design-kit.md` wrongly said the kit modal also touches the
   edges — corrected in this step (now points at `DialogContent` as the app-side discrepancy). Candidate follow-up for
   the archive step: align `DialogContent` with kit `.modal` for both dialogs.
2. Long ranges wrap the h2 to two lines („Usunąć import 1 marca – 31 sierpnia 2026?”) — the kit's hard-coded
   „z maja” is short; wrapping is correct behaviour, K19 already records the placeholder.
3. PageTitle at 400 px keeps „+ Nowy import” beside the h1 (same as the S-03 observation on `/patterns`; shared).

## Gate after fixes (baseline = `main` `4425f8c`: lint 0 · astro check 89 files · vitest 72/4 · smoke 48)

lint 0 errors (Δ0); `astro check` 0 errors, 93 files (+4, unchanged from impl-review); `fixture:check` OK;
`npm test` 78/78, 5 files (+6 / +1, unchanged); build Complete; smoke on :4398 61 PASS / 0 FAIL (+13, unchanged from
impl-review). `supabase test db` not run — no schema change in this step.

VISUAL: PASS — all seven named states captured desktop 1440 + 400 px against the kit; two real discrepancies (action alignment, destructive initial focus) fixed in 8013681; dialog geometry is the pre-existing shared DialogContent/G24 difference, now recorded correctly
