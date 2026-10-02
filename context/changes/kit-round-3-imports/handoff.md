# Handoff — `kit-round-3-imports` (slice S-13)

Written by the `/10x-implement … phase 3` step. Phase 3 is committed (`621f36e`) and green; `change.md` is
`implementing`. The one thing the next agent must not get wrong: `result.astro` still reads `copyExtra.imports`
(`accountLabel()`, `resultTitle`, `resultEyebrow`, `debitForms`, `transactionForms`, `toPatterns`, `toOverview`) and the
smoke step "santander import result names the bank" still pins the old `Santander · Rachunek` — both are Phase 4's.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/kit-round-3-imports`, cut from `main` at `2a8f89d` (F-04 merged) |
| Commits | `6e369ff` identity, `8720f42` research, `60f4fae` plan, `ef3aee2` plan review, `bf10335` P1, `47b2c55` handoff p1, `2cc8922` P2, `a80964a` handoff p2, `621f36e` P3, + this handoff/Progress-SHA commit |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | 22 of 40 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `src/components/app/InfoAlert.tsx` | new React twin of `InlineAlert.astro` kind `info` (`role="status"`, `Glyph info`), for the dialog now and the wizard in P5 |
| `src/components/imports/DeleteImportDialog.tsx` | kit copy via labels; `fillTemplate` for the title; new `demo` prop and `labels.demoNote` → `InfoAlert` + disabled danger button; `usePageShowReset` and `onOpenAutoFocus` kept |
| `src/pages/imports/index.astro` | select adds `account_number`; columns Data importu / Bank / Rachunek / Zakres dat / Obciążenia; `bankDisplayName` + `accountDisplay`; kit status lines (`deleteSuccess`, `notFound`, `deleteError`, `demoDeleteBlocked`); `demo = isDemoEmail(…)` passed to each dialog; dialog `range` = `formatRangeShort`; G30/G37 comments gone |
| `src/content/copy.ts` | removed from `copyExtra.imports`: `eyebrow`, `title`, `lead`, `newImport`, `deleteAction`, `deleteDialogTitle`, `deleteDialogBody`, `close`, `deleted`, `deleting`, `deleteError`, `deleteMissing`, `table.account/range`; kept `table.importedOn/debits` (K11), `deleteDialogEyebrow` (K19), `demoLocked` (wizard, P5) |
| `scripts/smoke.mjs` | 3 rewritten (`>Santander Bank Polska<`, not-found `Nie znaleziono importu.` ×2), +2 (`>Rachunek · •• 0099<`, `>Bank</th>`) |
| `context/changes/kit-round-3-imports/plan.md`, `handoff.md` | Progress 3.1–3.6 ticked with SHA; this file |

## 3. Verification

| Command | Result (observed this step) |
| --- | --- |
| `npm run lint` | 0 errors (baseline 0) |
| `npx astro check` | 0 errors (baseline 0) |
| `npm run fixture:check` | ing OK, santander OK |
| `npm test` | 355 passed / 23 files (baseline 347 / 22; Δ vs P2 = 0, no unit cases planned) |
| `npm run build` | OK |
| `npx supabase db reset && npx supabase test db` | Files=6, Tests=119, PASS (Δ0) |
| `npm run smoke` (port 4398) | 162 PASS / 0 FAIL (baseline 157, +5; P2 160, +2) |
| grep `G30\|G37\|deleteMissing\|deleteDialogTitle` in `src/pages/imports`, `src/components/imports`, `src/content/copy.ts` | only the wizard's G37 (P5), `copyExtra.imports.demoLocked` (P5) and settings' own keys remain |
| Break 1: `account_number` dropped from the history select | `/imports` 500 → 4 smoke steps FAIL (not-found line, delete action, bank, tail); restored → green. Meta-check: proves the select feeds the account cell at runtime (the 500 comes from `accountDisplay` on `undefined`); `astro check` output was not captured for this break, so the smoke steps are the proof |
| Break 2: `notFound` status mapped to `deleteError` | 2 not-found smoke steps FAIL; restored → green. Meta-check: proves the status mapping; the `>Bank</th>` step was not broken separately (needle is the header's own node, `Bank` appears nowhere else on the list) |
| End state | dev server on 4398 killed; `db reset` run after the breaks |

## 4. Next command

`/10x-implement kit-round-3-imports phase 4`

## 5. Open

- **Manual-only rows (human checklist):** [reviewer] 1.7, 2.7, 3.7, 4.6, 5.5, 6.7; [visual] 6.6; [human] 6.8.
- **Not provable by smoke:** the demo note inside the delete dialog (Radix does not render a closed dialog) → visual row 6.6.
- **Still to rebind (later phases):** `result.astro` reads `copyExtra.imports` incl. `accountLabel()` (P4, then `src/lib/import/banks.ts` `accountLabel` + its 4 tests go); wizard `x.demoLocked` (G37, P5); `copyExtra.imports.accountLabel` carries the K26 comment until P4.
- **Smoke pin left for P4:** "santander import result names the bank" (`Santander · Rachunek`) and the `Dodaliśmy …` / result-redirect steps.
- **Roadmap:** S-13 row in `context/foundation/roadmap.md` untouched (orchestrator-owned).
- **Risks:** unchanged (`plan.md` `## Known risks`: `submitting` has no bfcache reset). F7 (`>Bank<`) handled with the `>Bank</th>` needle.
- **Follow-ups:** none; `follow-ups/review-fixes.md` not created.

## 6. Autonomous decisions

1. **Execution mode: implemented in this context, not delegated.**
   - Why: one fresh agent per step; no human to ask.
   - Would change: a phase too large for the ~300k budget.
2. **Skipped the manual-confirmation gate and commit-message prompt; used the plan's phase title.**
   - Why: contract rule 1; `[reviewer]` row 3.7 left unticked.
   - Would change: a maintainer present to confirm.
3. **Kept `copyExtra.imports.demoLocked`, `deleteDialogEyebrow`, `table.importedOn/debits`; reworded the G37 comment to "wizard only (P5 rebinds it)".**
   - Why: the wizard still reads `demoLocked` until P5; the other two have no kit key (K19/K11).
   - Would change: the kit adding keys (K33).
4. **Bank-column smoke needle is `>Bank</th>` instead of the plan's `>Bank<`.**
   - Why: plan review F7 asked for a header-node anchor if the short needle is weak; `>Bank</th>` cannot match the island or nav.
   - Would change: a kit table markup that changes the header tag.
5. **Dialog `InfoAlert` and disabled button are driven by `isDemoEmail` only** (as planned, decision 11), computed in `index.astro` from `astro:env/server` `DEMO_EMAIL`.
   - Would change: the server allowing undo for the demo account.
6. **Prettier run on the touched files only** (not `npm run format`).
   - Would change: nothing.
