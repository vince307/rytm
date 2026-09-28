# Handoff — `fixed-cost-changes` (slice S-06)

Written by the visual gate step (autonomous run `2026-09-28-s05-s06-s07`). Every `[visual]` state of rows 4.11 and 4.12
was captured at 1440 px and 400 px against the kit frames, and the US-04 walk-through was hand-checked. Two real
discrepancies were fixed in `29c4829`. The result is `VISUAL: PASS`. What the next agent must not get wrong: the next
step is `/10x-archive fixed-cost-changes`, then ship. **No hosted `db push` is due**, because this change has no
migration. The `[human]` row 4.10 stays open on the post-run checklist.

## 1. State

| Item                         | Value                                                                                                                                                                                                                                                               |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Branch                       | `feat/fixed-cost-changes` (confirmed with `git branch --show-current`), cut from `main` at `3706508`                                                                                                                                                                |
| Commits                      | 18 on this branch after this step. This step added `29c4829` `fix(fixed-cost-changes): kwoty /fixed nie łamią się przed „zł”, znak sprzedawcy z promieniem 8 px jak w kicie` and the `docs(fixed-cost-changes): bramka wizualna` commit, which carries this handoff |
| Pushed / PR / merged         | no / none / no                                                                                                                                                                                                                                                      |
| `change.md` status           | `impl_reviewed` (unchanged; `/10x-archive` stamps it)                                                                                                                                                                                                               |
| Roadmap                      | S-06 `in-progress` (unchanged; `/10x-archive` flips it)                                                                                                                                                                                                             |
| `## Progress` rows remaining | 1 (`grep -c '^- \[ \]' plan.md`): 4.10 `[human]`                                                                                                                                                                                                                    |
| Working tree                 | clean after the docs commit                                                                                                                                                                                                                                         |
| Local DB                     | `npx supabase db reset` run twice: after the read-error REVOKE and after the smoke. Seed restored, 0 `visual-%` accounts, `authenticated` SELECT on `transactions` = `t`                                                                                            |
| Dev servers                  | :4398 and :4399 killed (`lsof` empty). :4321 was never touched                                                                                                                                                                                                      |

## 2. Artifacts

| Path                                                            | What it is                                                                                                                                                              |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/fixed/FixedRow.astro`                           | fix 1: name column `min-w-0`, amount column `shrink-0 whitespace-nowrap`, compact row gets a gap. The header comment records why                                        |
| `src/components/patterns/merchant-mark.ts`                      | fix 2: `merchantMark` `rounded-lg` (14 px under the theme) → `rounded-[8px]` (kit `.merchant-mark`). It is shared with `PatternsTable.tsx` and `ExcludedPatterns.astro` |
| `context/changes/fixed-cost-changes/screenshots/*.png`          | 20 app PNGs (10 states × desktop/mobile) + 4 kit frames (`kit-fixed-*`, `kit-fixed-empty-*`)                                                                            |
| `context/changes/fixed-cost-changes/screenshots/README.md`      | accounts, crafted files, how each state was reached, measurements                                                                                                       |
| `context/changes/fixed-cost-changes/reviews/visual-review.md`   | verdicts per state, hand check, keyboard, fixes, gate. Ends with the `VISUAL: PASS — …` line                                                                            |
| `context/changes/fixed-cost-changes/plan.md`                    | `[visual]` rows 4.11 and 4.12 ticked with notes + `29c4829`                                                                                                             |
| `context/changes/fixed-cost-changes/follow-ups/review-fixes.md` | new section „From the visual gate”: panel radius 20 vs 12 px, `Badge` `new` tint. Each has a `Trigger:`                                                                 |
| `context/foundation/design-kit.md`                              | G34 row: measured `nowy` tint `#E7DCC9` vs kit `#EFE4D1`, recorded as a note with no new token                                                                          |
| `context/changes/fixed-cost-changes/handoff.md`                 | this file                                                                                                                                                               |

## 3. Verification

Everything below was observed in this step, on the final code including `29c4829`. Baseline is the agent contract,
`main` `3706508`.

| Command                                         | Result                                                                                                                                                                                                                                                       |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm run lint`                                  | 0 errors (baseline 0, +0)                                                                                                                                                                                                                                    |
| `npx astro check`                               | 0 errors, 124 files (baseline 120, +4; unchanged from impl-review)                                                                                                                                                                                           |
| `npm run fixture:check`                         | OK                                                                                                                                                                                                                                                           |
| `npm test`                                      | 213 passed, 12 files (baseline 190 / 11, +23 / +1)                                                                                                                                                                                                           |
| `npm run build`                                 | Complete                                                                                                                                                                                                                                                     |
| `npx supabase db reset && npx supabase test db` | Files=5, Tests=102, PASS (baseline 102, +0); sandbox disabled                                                                                                                                                                                                |
| smoke on `astro dev --port 4398`                | 121 PASS / 0 FAIL (baseline 111, +10)                                                                                                                                                                                                                        |
| Visual capture                                  | Playwright headless system Chrome: 10 states × 1440/400 px, `scrollWidth` = viewport in every shot. Claude-in-Chrome (inherited browser): US-04 walk-through + keyboard/semantics                                                                            |
| Hand check (4.12)                               | KINOTEKA 17.08 5999 − 17.07 5599 = +400 gr → „+4,00 zł”, „poprzednio 55,99 zł” (oracle `expected.json` lines 27/49). SIŁOWNIA RUCH 05.08.2026 129,00 „nowy”. `kurs-przyklad.pl` (last 2026-03) and `phu-przyklad` (last 2026-06) absent. Counts 1/1/3 = rows |
| Before/after fix 1                              | before: at 400 px, „94,00 / zł”, „+5,00 / zł”, ZUS „1512,30 / zł” (ZUS row 73 px). After: single-line amounts, ZUS row 70 px                                                                                                                                 |
| Before/after fix 2                              | computed `border-radius` of the mark: 14 px before, 8 px after (kit 8 px)                                                                                                                                                                                    |
| Deliberate breaks                               | none in this step: the fixes are visual, and the before/after measurements above prove them                                                                                                                                                                  |

## 4. Next command

`/10x-archive fixed-cost-changes` then ship. No hosted `npx supabase db push` is due, because there is no migration
(`git diff --name-only main...HEAD -- supabase/` is empty).

## 5. Open

- **`[human]` 4.10**: the product owner confirms plan decision 7. A D5 flip drops an out-of-tolerance rise from
  `/fixed`, and the remedy is to pin it. This goes on the post-run checklist.
- **Follow-ups** (`follow-ups/review-fixes.md`):
  - D5 flip.
  - One-off merchants in „Nowe”, clearly visible in `fixed-decrease`.
  - G28 `/patterns` badges + `Badge` `changed` tone.
  - S-07 stat card = `fixedOverview(...).changed.filter((r) => r.deltaMinor > 0)`.
  - `view.ts` `patternTxs` throw → 500.
  - `FixedSection` `compact` prop dead.
  - **new:** panel radius (`Panel.astro` / `FixedSection.astro` `rounded-xl` = 20 px vs kit 12 px).
  - **new:** `Badge` `new` tint.
- **Observations** (`reviews/visual-review.md`), none blocking:
  - JAN PRZYKŁADOWY (T08 own transfer) under „Bez zmian”; the user's remedy is exclusion.
  - The read-error copy is the generic `copy.components.error` (K18).
  - The page background comes from the app shell.
- **Fix 2 reaches `/patterns`**: `merchantMark` is shared, so the `/patterns` table and „Wykluczone” marks are now 8 px.
  This follows the kit, but there is no new `/patterns` screenshot. Smoke is green.
- No DESIGN-GAP added. The G34 row is only extended with the measured tint.

## 6. Autonomous decisions

- **Playwright for the PNG set, Claude-in-Chrome for the walk-through and semantics.**
  - Why: Chrome screenshots are viewport-only JPEGs. The window cannot go below ~587 px, and 24 full-page PNGs with
    measurements are reproducible from a script. Real Chrome confirmed the rendered text and focus facts
    independently.
  - Rejected: all shots through Claude-in-Chrome.
  - Would change: a Chrome capture path that saves full-page PNGs at 400 px.
- **Crafted CSVs are subsets of the F-02 fixture, imported through the wizard.**
  - Why: the fixture alone cannot show one month, a gap month, a decrease, a double charge, a long name or an
    all-frequent account.
  - What was edited: `Zakres dat` and `Liczba transakcji` were rewritten; the preamble sums were left stale because the
    parser does not read them. One amount, one duplicated row and two long-name rows were added. Everything went
    through the product's import path, and nothing was written to the DB.
  - Rejected: `POST /api/imports` with a hand-built payload, because the wizard is the product path.
  - Would change: a generator option in `scripts/fixture-ing.mjs` for these shapes.
- **Read error via `REVOKE SELECT ON public.transactions FROM authenticated` outside a transaction, then
  `npx supabase db reset`.**
  - Why: the page's request uses its own connection, so an uncommitted `BEGIN … ROLLBACK` never reaches it. The agent
    contract allows this with a same-step reset, and the grant was verified restored.
  - Would change: an app-level fault-injection path.
- **Fix 2 (the shared `merchantMark` radius) applied here rather than deferred.**
  - Why: the constant's own comment claims to be „the kit's merchant-mark square”, and it rendered 14 px, which is a
    bug against its stated intent. The change moves all three consumers toward the kit.
  - Rejected: a `/fixed`-only override, which would make the marks disagree across views.
  - Would change: the maintainer preferring the rounder mark, in which case revert the one class.
- **Panel radius not fixed.** The same theme cause makes every app panel 20 px. Changing it only in `FixedSection`
  would make `/fixed` disagree with every other panel, and changing `Panel.astro` is a global redesign outside
  „one view”. It went to follow-ups instead.
  - Would change: a global radius-token pass.
- **`Badge` `new` tint left as a G34 note**, following the plan's Known risks: a mismatch is a note, not a new token.
  - Would change: the kit author supplying the token.
- **Kit frame's „3 pozycje” over 2 rows not copied.** The app counts the rows it renders.
  - Would change: nothing; this is a kit inconsistency.
