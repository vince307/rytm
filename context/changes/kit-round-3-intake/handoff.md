# Handoff — `kit-round-3-intake` (slice F-04)

Written by the visual-gate step. `VISUAL: PASS`: all 8 states of row 3.6 were captured at 1280 and 400 px against the
round-3 kit frames. One doc-only fix landed in `0bb4588`: the register's `/home` row now describes the kit view.
`change.md` stays `impl_reviewed`. Next is archive, then ship. The slice has no migrations. Never run prettier on
`design/` or `src/styles/brand.css`.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/kit-round-3-intake`, cut from `main` at `577b163` (+ roadmap commit `78386c1`) |
| Commits this step | `0bb4588` `fix(kit-round-3-intake): wiersz /home w rejestrze zgodny z widokiem kitu rundy 3`, plus the `docs(kit-round-3-intake): bramka wizualna` commit |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `impl_reviewed` (archive sets the final status) |
| `## Progress` rows remaining | 1 (`grep -c '^- \[ \]' plan.md`): 3.8 `[human]` |
| Working tree | clean after the docs commit; ports 4398/4399 free; local DB reset (0 `visual-%` accounts) |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `context/changes/kit-round-3-intake/reviews/visual-review.md` | Gate report: states, hand-checked number, fix, observations, `VISUAL: PASS` line |
| `context/changes/kit-round-3-intake/screenshots/*.png` | 30 PNGs: 8 app states × desktop/mobile + 7 kit frames × desktop/mobile |
| `context/changes/kit-round-3-intake/screenshots/README.md` | State table (state · desktop · mobile · how reached · kit frame), accounts, measurements |
| `context/foundation/design-kit.md` | The `/home` row in „Widoki i trasy w kicie” is corrected. Kit round 3 has 1 card „Ponad progiem”, a full-width trend and a „Koszty stałe” panel (C5). The app keeps 2 cards until S-15 (`0bb4588`) |
| `context/changes/kit-round-3-intake/plan.md` | Row 3.6 ticked |

## 3. Verification

| Command | Result |
| --- | --- |
| Playwright capture on `astro dev :4399` (script outside repo) | 30/30 PNGs, 0 NOT CAPTURED. ING fixture import „Dodaliśmy 206 obciążeń.” for each viewport |
| `scrollWidth` vs viewport, 16 app shots | equal (1280 / 400) in all |
| `innerText` scan for `undefined`, `{n}`, `{month}`, `{…}` | none in 16 app shots |
| Claude-in-Chrome (inherited browser, own tab, closed) | `/fixed` matches the PNG: same sections and amounts, `scrollWidth` = `innerWidth` |
| Hand check „Koszty stałe” | oracle Aug 2026 fixed rows 5999+150000+2499+12900+3900 = 175298 gr = 1752,98 zł ✓. Kinoteka 5599→5999 = +4,00 zł, 1 risen ✓ |
| `npx supabase db reset` | done after the gate; `auth.users like 'visual-%'` = 0 |
| lint / astro check / vitest / build / pgTAP / smoke | not re-run: the only change is a sentence in `context/foundation/design-kit.md` (no code). Last observed figures are inherited from the impl-review step, unverified here: lint 0, astro check 0/152, vitest 347/22, build OK, pgTAP 6/119, smoke 157/0 |

## 4. Next command

`/10x-archive kit-round-3-intake then ship (no migrations)`

## 5. Open

- [ ] 3.8 `[human]` Accept the kit-text deviations and send K27–K32 to the kit author. Deviations: „we wrześniu” (K30); header body order (Suma before Kwota) until S-14; `copyExtra.imports.saveError` (K28); the 4 restored `authStates` (K27).
- Visual observations, each owned by a later slice (details in `reviews/visual-review.md`):
  - S-15: `/home` round-3 layout, with 1 card and a „Koszty stałe” panel in `src/pages/home.astro`.
  - S-14: Kwota before Suma (`tableHeaders` / `BODY_ORDER`) and „Pokaż więcej” / „Wykluczone” in `PatternsTable`.
  - S-12: form fields on `paper` (C3) in `FormField`.
- F6 accepted: the `referenceMonth ?? ""` type escape in `src/pages/fixed.astro`. F7 accepted: `DESIGN-GAP: K24` in `home.astro` `leadFor`, moved to S-15.
- Follow-ups in `follow-ups/review-fixes.md` (S-14, S-15, S-12, month templates, `.prettierignore`), each with a `Trigger:` line.
- No migration and no new `DESIGN-GAP`. The roadmap F-04 row is untouched; archive updates it.

## 6. Autonomous decisions

1. **The PNG set came from Playwright, with one Claude-in-Chrome cross-check (`/fixed`).** Rejected: a Chrome-only gate, because Chrome screenshots are not written to the repo and the 400 px view needs the iframe workaround. This is the same split as the S-11 gate. Would change: Chrome tooling that saves screenshots into the repo.
2. **Register-row error fixed in-branch** (doc-only `fix(...)` commit), not queued. The row was introduced by `d279eef` in this slice and would mislead S-15. Would change: a fix touching code, which would need the full gate re-run.
3. **`/home`, `/patterns`, field-colour deltas against the round-3 kit judged as expected, not as discrepancies.** Plan row 3.6 requires „same layout as before the swap (no redesign)”, and each delta has an owning slice (S-12/S-14/S-15). Would change: a plan requiring round-3 layout in F-04.
4. **Keyboard path not re-measured.** The diff adds or moves no focusable element. Would change: any markup or interaction change in the diff.
5. **Full local gate not re-run after `0bb4588`.** It is a single markdown sentence outside `src/`. Would change: the orchestrator's gate requiring a fresh run before ship (the ship step runs CI anyway).
