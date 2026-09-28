# Handoff — `durable-pattern-decisions` (slice S-05)

The visual gate step wrote this handoff on 2026-09-28, in autonomous run `2026-09-28-s05-s06-s07`. It captured every `[visual]` state of rows 5.8 and 7.10 at 1440 px and 400 px, checked bfcache (5.9) in real Chrome, and hand-checked the US-03 walk-through (7.11). It fixed three real discrepancies in `c14f75a`. The result is `VISUAL: PASS`.

**What the next agent must not get wrong:** the next step is `/10x-archive`, then ship. The hosted `npx supabase db push` IS due, because the migration `20260928120000_pattern_decisions` must reach the hosted DB before the merge.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/durable-pattern-decisions` (confirmed with `git branch --show-current`), cut from `main` at `f252112` |
| Commits on branch | 29 ahead of `f252112` (`git log --oneline f252112..HEAD`). This step added `c14f75a` `fix(durable-pattern-decisions): poprawki z bramki wizualnej` and `docs(durable-pattern-decisions): bramka wizualna` (this commit, with the screenshots) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `impl_reviewed` (unchanged; `/10x-archive` stamps it) |
| `## Progress` rows remaining | 1 (`grep -c '^- \[ \]' plan.md`): `[human]` 7.9 |
| Working tree | clean after this commit |
| Local DB | `npx supabase db reset` run at the end, so the visual accounts are gone. pgTAP 102 PASS afterwards |
| Dev servers | :4398 and :4399 killed (`lsof -ti :4398 -ti :4399` empty). :4321 untouched |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `src/components/patterns/PatternActionsDialog.tsx` | Fixes from the visual gate. `actionButton` = `w-full justify-start`: the kit `.modal-actions` buttons are full width. `pending` is now the action in flight (`"merge" \| "type" \| "rename" \| "exclude" \| null`): every submit is disabled, and only the pressed one shows `copy.saving`. The header comment on `actionButton` is corrected |
| `src/components/app/InlineAlert.astro` | Optional `bodyClass` prop, merged onto the content `<span>` with `class:list` |
| `src/pages/patterns/[...key].astro` | The excluded banner passes `bodyClass="flex flex-1 flex-wrap items-center justify-between …"`, so „Przywróć” sits on the row's right edge (kit `.excluded-banner`) |
| `context/changes/durable-pattern-decisions/screenshots/*.png` | 58 real PNGs: 22 states × desktop/mobile = 44 app shots, plus 14 kit frames (`kit-*`) |
| `context/changes/durable-pattern-decisions/screenshots/README.md` | Method, accounts, the state table (state · desktop · mobile · how reached · kit), and measurements |
| `context/changes/durable-pattern-decisions/reviews/visual-review.md` | Verdicts, the hand-checked number, keyboard, bfcache, fixes, gate, observations. Ends with `VISUAL: PASS — …` |
| `context/changes/durable-pattern-decisions/plan.md` | `[visual]` rows 5.8, 5.9, 7.10 and 7.11 ticked with evidence. Row 6.9 annotated as confirmed in the browser |
| `context/changes/durable-pattern-decisions/follow-ups/review-fixes.md` | F8 annotated with the gate's measurement: not triggered at 400×812 |
| `context/changes/durable-pattern-decisions/handoff.md` | This file |

## 3. Verification

Baseline (`main` `f252112`): lint 0 · astro check 0 errors (109 files) · fixture:check OK · vitest 141 (8 files) · build OK · pgTAP 76 (4 files) · smoke 77.

| Command / check | Result (observed this step, after `c14f75a`) |
| --- | --- |
| `npm run lint` | 0 errors, 0 warnings (Δ0). A transient `astro/prefer-class-list-directive` warning from the first `InlineAlert` edit was fixed before the commit |
| `npx astro check` | 0 errors, 120 files (+11) |
| `npm run fixture:check` | OK |
| `npm test` | 190 passed, 11 files (+49 / +3) |
| `npm run build` | Complete |
| smoke (`ASTRO_DEV_BACKGROUND=1 npx astro dev --port 4398 --ignore-lock`) | 111 PASS / 0 FAIL (+34). Server killed afterwards |
| `npx supabase db reset && npx supabase test db` | Files=5, Tests=102, PASS (+26) |
| Visual: `DialogContent` geometry (3 dialogs) | 1440: x 480, w 480, padding 31, radius 13. 400: x 20, w 360. The close button is clear of the eyebrow text |
| Visual: keyboard | Initial focus is on the dialog, or the password input for delete-account — never a destructive action. Tab cycles inside the dialog. Esc closes and focus returns to the trigger |
| Visual: bfcache (Claude-in-Chrome, headed) | „Zapisz próg” and „Usuń import”: back restores from bfcache (the marker survived) and neither button is stuck pending |
| Hand check (7.11) | Sportowo 8 × / 1316,28 zł = SPORTOWO 663,79 (4) + sportowo.pl 652,49 (4); oracle `sumMinor` 131628 |

Deliberate breaks: none in this step, because the fixes are visual. What proves them is the before/after shots. The first captures showed content-width buttons and three „Zapisywanie…” labels, which were overwritten by the re-capture on a fresh account. The measured widths and pending labels before and after are quoted in `reviews/visual-review.md`.

## 4. Next command

`/10x-archive durable-pattern-decisions`, then ship: push, PR, CI, then `npx supabase db push` of `20260928120000_pattern_decisions` to the hosted DB before the merge, then merge and deploy.

## 5. Open

Human checklist, left unticked in `plan.md` `## Progress`:

- [ ] 7.9 [human] The product owner confirms decision 9: „nie wchodzi do sumy miesięcznej” = excluded from every „ponad próg” sum and from any S-07 monthly total.

Follow-ups, in `follow-ups/review-fixes.md`: F4–F9 from `/10x-impl-review` are unchanged. F8 (`DialogContent` has no scroll) is annotated as not triggered at 400×812. The carried items are unchanged: S-04 F4 threshold endpoints, F11 field radius, `DeleteAccountDialog` bfcache, S-07 must skip `pattern.excluded`.

Visual observations, not fixed (details in `reviews/visual-review.md`):

- The merged pattern's header month total is 0 when its last occurrence predates the reference month (S-04 decision 14).
- The kit puts the excluded banner above the back link; the plan puts it under `.detail-top`, and the plan was kept.
- The app modal keeps a 1 px border (416 vs 418 px buttons).

No new DESIGN-GAP ids.

Carried risks: normalizer drift (`normalizeMerchant`), and the circular import between `load.ts` and `decisions.ts` / `thresholds.ts` (`collectPages`), which is harmless.

## 6. Autonomous decisions

- **Playwright captured the PNG set; Claude-in-Chrome was used for bfcache only.**
  - Why: Chrome screenshots are viewport-only JPEGs, the window cannot go below ~587 px (mobile needs the iframe workaround), and 44 app shots plus 14 kit frames with measurements are reproducible from a script. Real headed Chrome was the right tool for bfcache, which headless Chrome did not restore in the S-04 gate.
  - Rejected: all shots through Claude-in-Chrome.
  - Would change: a Chrome capture path that saves full-page PNGs at 400 px.
- **The `pending` state was frozen, not held on the network.**
  - Why: holding the POST with `page.route` blocked page evaluation and screenshots until timeout. Instead, a bubble-phase `window` `submit` listener runs `preventDefault()` after React's handler has set `pending`. The state shown is the product's own; nothing was posted.
  - Would change: a need to show the server-side wait itself.
- **The accidental centring of the kit banner text was not copied.** With three flex items under `space-between`, the kit centres the text. The intent (restore at the right edge) was copied, and the text stays by its icon.
  - Would change: the design owner confirming the centred text is intended.
- **`InlineAlert` got a `bodyClass` prop** rather than the banner duplicating the alert markup. It is one optional prop, and the other consumers are unchanged.
  - Would change: a second layout need, which would argue for a dedicated banner component.
- **`rename-error` was reached through `?error=name`**, because the input's `maxLength=100` stops the UI from sending an over-long name. The endpoint's own rejection is proven by smoke („long name”).
- **Row 6.9 was left ticked and annotated as browser-confirmed.** The browser check matched the code-inspection claim.
