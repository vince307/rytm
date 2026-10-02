# Handoff — `kit-round-3-imports` (slice S-13)

Written by the `/10x-implement … phase 4` step. Phase 4 is committed (`623db9e`) and green; `change.md` is
`implementing`. The one thing the next agent must not get wrong: the wizard still reads `copyExtra.imports.demoLocked`
(G37) and must keep working until Phase 5 rebinds it to `importFlow.demoImportBlocked`.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/kit-round-3-imports`, cut from `main` at `2a8f89d` (F-04 merged) |
| Commits | `6e369ff` identity, `8720f42` research, `60f4fae` plan, `ef3aee2` plan review, `bf10335` P1, `47b2c55` handoff p1, `2cc8922` P2, `a80964a` handoff p2, `621f36e` P3, `0bd76b6` handoff p3, `623db9e` P4, + this handoff/Progress-SHA commit |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | 17 of 40 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `src/pages/imports/result.astro` | rewritten: select adds `account_number`; success = icon, eyebrow `importFlow.result`, h1 `resultTitle`, `Panel` with a 4-column grid (Bank / Rachunek / Zakres dat / Transakcje), actions; malformed id or no row = 200 kit not-found (`imports.notFound` + ghost link `imports.back`); count read error keeps `components.error`; `DESIGN-GAP: G38` |
| `src/content/copy.ts` | removed `copyExtra.imports.accountLabel` (K26) and `resultEyebrow`; added `transactionsLabel` ("Transakcje", K11); G26 comment reworded to K11 for `resultTitle`; `debitForms`, `transactionForms`, `toPatterns`, `toOverview` kept (read by result / wizard) |
| `src/lib/import/banks.ts`, `test/unit/banks.test.ts` | `accountLabel()` and its 4 cases deleted (`BANK_SOURCES` / `isBankSource` stay) |
| `src/lib/import/presentation.ts` | two comments no longer name `accountLabel()` |
| `scripts/smoke.mjs` | "deleted import result shows not-found" (200 `>Nie znaleziono importu.<`), "santander import result names the bank" now `>Santander Bank Polska<`; +2: "import result of a malformed id shows not-found", "santander import result shows the account" (`>Rachunek · •• 0099<`) |
| `context/foundation/design-kit.md` | new gap row G38, status row G38 (open, S-13), round-4 list item 8; Prettier re-aligned the tables, so the diff is wide but only those three lines are content |
| `context/changes/kit-round-3-imports/plan.md`, `handoff.md` | Progress 4.1-4.5 ticked with SHA; this file |

## 3. Verification

| Command | Result (observed this step) |
| --- | --- |
| `npm run lint` | 0 errors (baseline 0) |
| `npx astro check` | 0 errors, 3 hints (baseline 0 errors) |
| `npm run fixture:check` | ing OK, santander OK |
| `npm test` | 351 passed / 23 files (baseline 347 / 22; Δ vs P3 = -4, the `accountLabel` cases) |
| `npm run build` | OK |
| `npx supabase db reset && npx supabase test db` | Files=6, Tests=119, PASS (Δ0) |
| `npm run smoke` (port 4398) | 164 PASS / 0 FAIL (baseline 157, +7; P3 162, +2) |
| grep `accountLabel(` in `src test`; `DESIGN-GAP: G38` in `result.astro` | empty; one hit |
| Break: missing row redirects to `/imports` again (302) | 2 smoke steps FAIL (deleted import result, malformed id), both `302 /imports`; restored with `git checkout -- result.astro` → green. Meta-check: the malformed id and a deleted/foreign id reach the same `!imported` branch (a foreign id through RLS finding no row); RLS itself is proven by pgTAP isolation, not this smoke |
| End state | dev server on 4398 killed; `db reset` run after the break and after the smoke runs |

## 4. Next command

`/10x-implement kit-round-3-imports phase 5`

## 5. Open

- **Manual-only rows (human checklist):** [reviewer] 1.7, 2.7, 3.7, 4.6, 5.5, 6.7; [visual] 6.6; [human] 6.8.
- **DESIGN-GAP added:** G38 (`src/pages/imports/result.astro`, row in `context/foundation/design-kit.md`); K11 `transactionsLabel` in `copyExtra.imports`.
- **Not exercised in smoke:** the result `countFailed` branch and the `?id=` of another user (RLS → same not-found path) — pgTAP covers isolation.
- **Still to rebind (later phases):** wizard `x.demoLocked` (G37, P5); `copyExtra.imports.demoLocked` stays until then.
- **Roadmap:** S-13 row in `context/foundation/roadmap.md` untouched (orchestrator-owned).
- **Risks:** unchanged (`plan.md` `## Known risks`: `submitting` has no bfcache reset).
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
7. **Phase 4 not-found built from `Panel` + h1 + ghost link, no icon or error alert.**
   - Why: kit `imports-result-not-found.html` is `.panel.result-state` with h1 and a ghost button only.
   - Would change: a kit not-found view with an icon.
8. **Eyebrow is `importFlow.result` ("Import gotowy.", with the dot) as the plan says, not the prototype's dotless text.**
   - Would change: the maintainer preferring the dotless kit prototype string (needs a `copyExtra` key).
