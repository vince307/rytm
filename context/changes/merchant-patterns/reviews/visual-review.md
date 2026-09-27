# Visual review — `merchant-patterns` (`/patterns`)

Step: visual gate of run `2026-09-27-s03-s02-s04`, 2026-09-27, branch `feat/merchant-patterns`. Compared `/patterns`
(`src/pages/patterns.astro`, `src/components/patterns/PatternsTable.tsx`, `src/components/app/Badge.tsx`) against
`design/rytm-os/prototype/views/patterns.html` / `patterns-empty.html` (`app.js` `patterns`, `patternRows`,
`emptyView`, `bindInteractions`; `styles.css` `.toolbar`, `.search-field`, `.select-field`, `table`, `.table-foot`,
`.merchant-mark`, `.badge`). Screenshots and the state table: `../screenshots/README.md`.

## Capture method

Claude-in-Chrome was not usable: two Chrome browsers are connected and the tool refuses to act until a human picks one
(`AskUserQuestion`, forbidden by the run contract). Fallback: Playwright library (npx cache) driving headless system
Chrome — it logs in, registers, uploads and types, so every authenticated state in plan row 3.8 was captured for real.
Mobile is a true 375 px viewport (no iframe trick needed headless).

## States (plan 3.8)

| State              | Captured         | Verdict                                                                   |
| ------------------ | ---------------- | ------------------------------------------------------------------------- |
| `lista`            | desktop + 375 px | matches kit layout; omitted columns are registered gaps (G28, K17)        |
| `lista-mobile`     | 375 px           | toolbar stacks, table scrolls inside the panel, foot stacks — as kit ≤560 |
| `wyszukiwanie`     | desktop + 375 px | `kin` → `KINO ŚWIATŁO`, `KINOTEKA`, foot „2 wzorce”                       |
| `sortowanie-nazwa` | desktop + 375 px | alphabetical, Polish collation                                            |
| `pusty`            | desktop + 375 px | identical composition and copy to `patterns-empty.html`                   |
| `brak-wyników`     | desktop + 375 px | per plan: empty body, foot „0 wzorców”; kit has no such state             |
| `błąd`             | not captured     | code-reviewed only, as the plan states (`InlineAlert` + K18)              |

## Checks

- **Layout / components**: eyebrow „Wzorce wydatków”, h1 „To, co wraca.”, lead, primary „+ Wgraj CSV” on the right;
  toolbar 330 px search + 180 px select, 43 px high, 10 px gap; panel `rounded-xl` with `th`/`td` 16×17 px padding,
  11 px uppercase muted headers, 30 px `merchant-mark` radius 8 px, pill badges; foot 13×17 px, 12 px muted — Tailwind
  classes read value-for-value against `styles.css` and confirmed side by side in the screenshots. Kit's mobile render overflows horizontally (`kit-lista-mobile.png`); the app does not
  (table scrolls inside `.table-wrap` equivalent) — the app follows the kit's intent, not its bug.
- **Tokens**: `PatternsTable`/`Badge` use only `ink`/`paper`/`paper-soft`/`muted`/`line`/`green` (+ opacity);
  `grep -nE "#[0-9a-fA-F]{3,6}\b|\[#"` over both files: no hits. One non-token colour found on screen — the browser's
  blue native clear button of `input type="search"` (`brak-wynikow-desktop.png` before the fix) — **fixed** (below).
- **Copy**: every visible string from `copy.patterns` / `copy.emptyViews` / `copyExtra.patterns` /
  `copyExtra.emptyViews`; foot plural forms correct at 0, 2, 31.
- **Money**: `formatMoney` = pl-PL, same as kit `money()` (so „8755,00 zł” vs „20 015,11 zł” grouping is the locale
  rule in both; not a discrepancy).
- **Keyboard path**: Tab reaches logo → Wyjdź → nav → „+ Wgraj CSV” → search → sort, in visual order; rows hold no
  interactive element yet (row link is G28).
- **Visible focus**: before the fix the search input and sort select had `outline: none` and no wrapper style — focus
  was invisible. The kit itself defines none for `.search-field`/`.select-field` (it copies `outline:0`). **Fixed** by
  borrowing the kit's own `.field input:focus` pattern (border `ink` + 3 px ring `ink/8`, same as `FormField`) through
  `focus-within` on the wrapper; measured after the fix: wrapper border `rgb(32, 47, 64)` + 3 px ring on both
  controls (`fokus-szukaj-desktop.png`, `fokus-sortowanie-desktop.png`). Registered as gap **G29** in
  `context/foundation/design-kit.md` + `DESIGN-GAP: G29` in `PatternsTable`.

## Fixes on this branch

- `src/components/patterns/PatternsTable.tsx` — `field`: `focus-within:border-ink focus-within:ring-[3px]
focus-within:ring-ink/8 transition-colors`; `control`: `[&::-webkit-search-cancel-button]:appearance-none`.
- `context/foundation/design-kit.md` — row G29.

## Observations (not fixed, not blocking)

1. PageTitle on 375 px keeps the button beside the lead, so the lead wraps into a narrow column (`lista-mobile.png`).
   `PageTitle` is shared by every app view and the kit `.dash-title` does the same at ≤900 px — out of scope (one
   view + global tokens).
2. `brak-wyników` shows only the header row and „0 wzorców” — as planned; a friendlier no-match message would need kit
   copy (not invented).

## Gate after fixes (baseline = `main` `d11f3ef`)

lint 0 errors (Δ0); `astro check` 0/0/0, 89 files (+7 vs 82, unchanged from impl-review); `fixture:check` OK;
`npm test` 72/72, 4 files (+40 / +1, unchanged from impl-review); build Complete; smoke on :4398 48 PASS / 0 FAIL
(+2). `supabase test db` not run — no schema change in this step.

VISUAL: PASS — all six named states captured desktop + 375 px against the kit; two real discrepancies (invisible toolbar focus, non-token native search clear button) fixed and registered as G29; remaining differences are registered gaps G28/K17
