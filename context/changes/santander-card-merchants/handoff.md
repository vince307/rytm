# Handoff — `santander-card-merchants` (slice S-11)

Written by the visual-gate step of run `2026-10-01-m2-santander`. Progress row 4.6 is captured and ticked with
`VISUAL: PASS` and no fixes. Every non-human row is now closed, and the slice is ready for `/10x-archive` and then
ship. The next agent must not tick the four `[human]` rows (4.8–4.11). They go into the PR body as a checklist.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/santander-card-merchants`, cut from `main` at `9f63fd9` |
| Commits | 19 on the branch (`main..HEAD`): the 18 before this step (… `6baf3fd` impl-review fixes, `1d3284f` `docs(santander-card-merchants): przegląd implementacji`), then this step's `docs(santander-card-merchants): bramka wizualna` |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `impl_reviewed` (unchanged; `/10x-archive` stamps it) |
| `## Progress` rows remaining | 4 (`grep -c '^- \[ \]' plan.md`): 4.8–4.11 `[human]` |
| Working tree | clean after this step's commit; branch confirmed with `git branch --show-current` |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `context/changes/santander-card-merchants/reviews/visual-review.md` | Visual review of row 4.6: capture method, 7 states, hand-checked pizzeria number, keyboard path, observations; last line `VISUAL: PASS — …` |
| `context/changes/santander-card-merchants/screenshots/*.png` | 20 PNGs: 7 app states × {desktop 1280, mobile 400} + kit `patterns`, `pattern-wolt`, `fixed` × 2 |
| `context/changes/santander-card-merchants/screenshots/README.md` | State table (state · desktop · mobile · how reached · kit), accounts, data, measurements |
| `context/changes/santander-card-merchants/plan.md` | `## Progress` row 4.6 `[visual]` ticked (`— visual-review`) |
| `context/changes/santander-card-merchants/handoff.md` | This file |

## 3. Verification

All observed in this step. Baseline = contract line (`main` 9f63fd9, after S-10).

| Command | Result |
| --- | --- |
| `astro dev --port 4399` + Playwright 1.55 capture (outside repo), two fresh `visual-s11-*@rytm.local` accounts | ING main import "Dodaliśmy 206 obciążeń.", Santander main import "Dodaliśmy 184 obciążenia." on each account; 20/20 PNGs, 0 NOT CAPTURED; `scrollWidth` = viewport in all 14 app shots |
| Claude-in-Chrome (inherited browser, own tab, closed) | Pizzeria detail for May 2026 rendered "171,10 zł", "2 wystąpienia", same as the PNG |
| Hand-check (oracles `test/fixtures/{ing,santander}/expected.json`) | pizzeria 7 + 3 = 10 occurrences, 55087 + 22700 = 77787 gr = 777,87 zł = on-screen list row ✓; May 9910 + 7200 = 171,10 zł ✓; Bankomat 3 / 750,00 zł ✓ |
| Keyboard path (Playwright, desktop) | list → search → sort → row links all `:focus-visible`; Enter on row leads to the detail; "Akcje" dialog's initial focus is on the container, not on "Wyklucz z analizy"; Esc closes it and focus returns to "Akcje" |
| `lsof -ti :4398 -ti :4399` after kill | empty (port 4321 untouched) |
| `npx supabase db reset` (sandbox disabled) + read-only count | 0 `visual-%` users, 0 transactions |
| lint / astro check / vitest / build / pgTAP / smoke | **not re-run**: no code changed in this step (docs + PNGs only). Last observed run is in the impl-review handoff: vitest 335, smoke 151/0 |

## 4. Next command

`/10x-archive santander-card-merchants`, then ship (no migration in this branch).

## 5. Open

- **Human checklist** (none agent-closable; carry into the PR body):
  - [ ] 4.8 F-03 3.9: confirm the oracle's product calls (`Wypłata BLIK` own pattern, ST03 user-merge, `Oplata za …` fixed)
  - [ ] 4.9 S-10 6.11: accept re-keying of Santander card patterns (239 → 193 real keys); saved thresholds/decisions on old keys are orphaned
  - [ ] 4.10 Owner imports the real Santander PLN export locally and checks the patterns
  - [ ] 4.11 Accept min 1 token over min 2 (`santander-card.ts` `santanderCardMerchant` city pops)
- Visual observations (not blocking, all predate S-11): the list table scrolls inside its panel at 400 px
  (`PatternsTable` wrapper); the `Bankomat` detail opens on an empty reference month (G31, `DESIGN-GAP: G31` in
  `src/pages/patterns/[...key].astro`); raw Santander lines show the masked card (synthetic in fixtures).
- Carried risks (plan Known risks): min-1 generic-name merge; `CITY_PREFIX` pop leaving one word; cityless
  `<AGG> *<MERCHANT>` tails; ASCII-only cross-bank join; partial `NR_GUARD`; `BLIK_GATE` unmeasured on real ING.
- Follow-ups: `follow-ups/review-fixes.md` FU1–FU5 unchanged (each has a `Trigger:` line); none added.
- DESIGN-GAP: none added. Migration: none. ARTIFACT GAP: none.

## 6. Autonomous decisions

1. **Desktop width 1280, not 1440.** Plan row 4.6 names 1280 px, and the brief allowed 1280–1440. Rejected: 1440
   (S-10's choice). Would change: a gate rule fixing 1440.
2. **Added two month-specific detail shots** (pizzeria `?month=2026-05`, Bankomat `?month=2026-07`) beside the
   default-month ones. Why: the default reference month (August) shows only an ING pizzeria line and an empty
   Bankomat, so it cannot show the cross-bank join. May is the one month with both an ING and a Santander pizzeria
   payment. Would change: nothing — the default-month shots are kept as well.
3. **Reached the pizzeria detail by clicking the filtered row**, not by the oracle slug. The app key is the
   normalized text (`pizzeria%20trzy%20sery`), so `/patterns/pizzeria-trzy-sery` is not-found by design. Would
   change: a key-format change in `src/lib/patterns/path.ts`.
4. **PNGs from Playwright, Chrome as a spot check** (S-10 precedent): Chrome screenshots do not land in the repo,
   and extension Tab presses do not move focus. Would change: a Chrome capture that writes files.
5. **`npx supabase db reset` at the end** even though all data came in through the product. Why: it removes the
   visual accounts and imports, so the next step's smoke and pgTAP start clean. Would change: nothing.
6. **Full gate not re-run.** No executable file changed. Would change: any fix (then lint, astro check, npm test,
   build and smoke would be re-run).
