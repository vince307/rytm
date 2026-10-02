# Handoff — `santander-csv-import` (slice S-10)

The `/10x-implement santander-csv-import phase 6` step of autonomous run `2026-10-01-m2-santander` implemented
Phase 6 (wizard wiring, kit gaps and seam sweep) — the plan's last phase. It is committed, the epilogue ran, and
`change.md.status` is now `implemented`. **The next agent (impl-review) must not get this wrong:** every remaining
`## Progress` row is `[reviewer]/[visual]/[human]` — manual verification this run step deliberately did not perform
(per the run contract, those rows are never mine to tick). `/10x-impl-review` should review the automated work across
all six phases; it is not blocked by those open rows, and should not flip them to `[x]` either — only a human/visual
step observing the actual check may do that.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/santander-csv-import`, cut from `main` at `1fed366` |
| Commits | 21 on top of `1fed366` (Phases 1–5: see earlier handoffs). **This step**: Phase 6 implementation (`3971a17`), epilogue (`f61a2ab`) |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `implemented` (flipped from `implementing` by this step's epilogue) |
| `## Progress` rows remaining | 11, all `[reviewer]`/`[visual]`/`[human]` (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean (`bash .claude/skills/10x-autonomous-run/scripts/tree-clean.sh` → `CLEAN`) |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `src/lib/import/detect.ts` | New export `readImportFile(bytes, { santanderAccountName }): { detected } \| { error: FileError }` and new type `FileError = "unknownFormat" \| "wrongCurrency" \| "empty"`. Checks `bytes.length > MAX_FILE_BYTES` (G27), dispatches to `detectStatement`, maps a parse failure to the wizard's error kind, and maps "every account has 0 debits" to `empty`. `detectStatement`/`buildPayload`/`DetectResult` (already built in Phase 4) unchanged |
| `src/content/copy.ts` | `formatRecognised` and `bankName` become `{ ing, santander }` objects (were bare strings); new keys `supported` and `unknownFormat` under `copyExtra.imports`, both naming both banks; all four tagged `// DESIGN-GAP: K26` |
| `src/pages/imports/new.astro` | Injects `flow.supported = copyExtra.imports.supported` and `errors = { ...copy.importErrors, unknownFormat: copyExtra.imports.unknownFormat }` into the wizard's labels — every use site (including the G27 stand-ins) now names both banks, kit JSON untouched |
| `src/components/imports/ImportWizard.tsx` | `readStatement` is now a thin wrapper: keeps the `file.size > MAX_FILE_BYTES` check on the `File` object (before `file.arrayBuffer()`) as the task required, then calls `readImportFile`. `Loaded` holds `detected: Extract<DetectResult, { ok: true }>` instead of a bare `IngStatement`. The step-1/2/3 guard now also checks `!loaded` so `bank = loaded.detected.bank` narrows cleanly. Step 1 chip: `x.formatRecognised[bank]`; step 2 `<small>`: `x.bankName[bank]`; step 3 account value: `` `${accountLabel(x.accountLabel, bank, chosen.name)} · ${formatAccountTail(chosen.number)}` ``. Payload built via `buildPayload(loaded.detected, chosen.number)`. Removed the direct `ing.ts` imports (`buildImportPayload`, `parseIngStatement`, `IngParseResult`, `IngStatement`) |
| `test/unit/detect.test.ts` | New `describe("readImportFile", …)`: Santander main → `bank === "santander"`; ING main → `"ing"`; USD → `{ error: "wrongCurrency" }`; an oversized buffer (`MAX_FILE_BYTES + 1`) → `{ error: "unknownFormat" }`; a synthetic one-row, all-credit Santander statement (invented bytes, no real-export value) → `{ error: "empty" }` |
| `context/foundation/design-kit.md` | New conflict-table row **K26** (after K25): the kit's "Santander wkrótce" wording vs FR-018/S-10; resolution names every `copyExtra.imports` key this slice added/changed. New item **30** under "### Do rundy 3": the author's two remaining `content.json` edits + removing "Santander wkrótce" from `app.js` |
| `context/foundation/import-formats.md` | Santander rule 7 rewritten: `Lp` is not stored (was "klucz wewnętrzny = (import_id, lp)", stale — no `lp` column exists). "Wykrywanie formatu" reject line now names both banks; added a paragraph on the detection order (Santander tried first, a matched Santander failure never falls through to ING). Frontmatter `banks.santander.status` and the Santander section's own `Status:` line changed from `after-ing-flow` / "po pierwszym przepływie ING" to `mvp` / "MVP (S-10, …)" |
| `CLAUDE.md` | `npm test` line now says "ING and Santander statement parsers … the format detector" instead of only "ING parser" |
| `context/changes/santander-csv-import/plan.md` | `## Progress` 6.1–6.5 ticked with `— 3971a17`; no Phase block text touched |
| `context/changes/santander-csv-import/change.md` | `status: implemented` (epilogue) |
| `context/changes/santander-csv-import/handoff.md` | This file |

## 3. Verification

| Command | Result (observed in this step) |
| --- | --- |
| `git branch --show-current` | `feat/santander-csv-import` (confirmed before starting) |
| `npx vitest run test/unit/detect.test.ts` | 11 passed (6 pre-existing + 5 new `readImportFile` cases), 1 file |
| `npm run lint` | 2 prettier errors on the new wizard line and the new test string; `npm run lint:fix` resolved both; final: 0 errors (baseline 0) |
| `npx astro check` | 0 errors, 0 warnings, 144 files (baseline 144 — Δ0, no new files this phase) |
| `npm run fixture:check` | `fixture:check ing OK`, `fixture:check santander OK` (Δ0, Phase 6 doesn't touch the fixtures) |
| `npm test` | 290 passed, 18 files (baseline 285/18 — Δ+5: the five new `readImportFile` cases, no new file) |
| `npm run build` | OK |
| `npx supabase db reset && npx supabase test db` (sandbox disabled: Docker) | Files=6, Tests=119, **Result: PASS** (baseline Files=6/Tests=119 — Δ0, expected: Phase 6 touches no migration) |
| `astro dev --port 4398` + `npm run smoke` (sandbox disabled: network) | 147 PASS / 0 FAIL (baseline 147, Δ0 — the plan's own Phase 6 criterion is "smoke (+7)" against the *contract* baseline, i.e. unchanged from Phase 5; smoke drives `/api/imports` directly and never exercises the wizard island, so the wizard rewiring adds no new smoke step), run twice (after the fix, after the break-restore) |
| **Deliberate break** (6.4): `src/lib/import/detect.ts`'s `readImportFile` body replaced `detectStatement(bytes, opts)` with a call that only ever tries `parseIngStatement(bytes)` (wrapping its result into a `DetectResult`-shaped value on success), bypassing the Santander branch entirely. Ran `npx vitest run test/unit/detect.test.ts`: 3 of the 5 new cases went **red** — "classifies the Santander main fixture as santander" (got `{ error: "unknownFormat" }` instead of a `detected` result — the Santander bytes fail ING's own format check and are never retried against Santander), "maps the Santander USD fixture to wrongCurrency" (got `unknownFormat` instead), and "maps a Santander file whose rows are all credits to empty" (got `unknownFormat` instead); the ING-fixture and oversized-buffer cases stayed green (they never reach the Santander branch anyway). Restored via `git checkout -- src/lib/import/detect.ts` (file was already staged, so this reset to the exact pre-break content); re-ran — 11/11 green. **Meta-check**: all three Santander-dependent cases went red together, not just the one the task description names ("Santander main → santander") — confirming the test suite is exercising the detector dispatch itself (every Santander input path), not one lucky assertion that happened to depend on it | red → green confirmed |
| Final `lsof -ti :4398 -ti :4399` | Clear — dev server killed after the gate |

## 4. Next command

`/10x-impl-review santander-csv-import`

## 5. Open

**Carried from Phase 1–5 handoffs, unchanged:** S-11 re-keys Santander card patterns; R1 guarded only by the Phase 1
shape metric (run once by hand against both real exports); rollback shows "ING · Rachunek"; the PR preview
(production DB) cannot import until merge (plan-review F2 — do not read a failed preview import as a regression, do
not add a fallback to `import_ing_statement`); Santander `title` holds the masked card number (own data, RLS).

**Settled this step (with evidence, not argument):** none carried forward as open — Phase 5's open items (plan-review
F1, `accountLabel()`'s `as const` typing note) were already resolved in Phase 5 itself per its own handoff; this step
found nothing new of that kind.

**New from this step:** none — every Phase 6 contract point (`readStatement` wrapper shape, `Loaded.detected`,
per-bank chip/`<small>`/account-label render points, `readImportFile`'s three-way classification) matched the plan's
wording exactly; no deviation to record.

**Manual-only Progress rows (checklist, unchanged plus the Phase 6 set below) — none of these are mine to tick:**

- 1.6 `[reviewer]` Real-export comparison — recorded finding in Phase 1 handoff; still unticked.
- 2.7 `[reviewer]` Migration review — recorded finding in Phase 2 handoff; still unticked.
- 3.6 `[reviewer]` ING smoke steps byte-identical; stale-tab default covered by them — still unticked.
- 4.7 `[reviewer]` Reader vs rules 1–6; no real-export value in code or tests — still unticked.
- 5.6 `[visual]` List and result screenshots vs kit — still unticked.
- 6.6 `[visual]` Every wizard state (step 1 empty/Santander ready/ING ready/unknown/USD; step 2 Santander; step 3
  Santander ready/overlap; result; list) at 1280 px and ~400 px vs kit — not run (no browser driver in this step's
  scope).
- 6.7 `[reviewer]` Full local Santander import through the wizard; ING import/delete still work — not run.
- 6.8 **[human]** Owner imports their real Santander PLN export locally; count/range match the bank.
- 6.9 **[human]** Accept the rule-7 deviation (`Lp` not stored).
- 6.10 **[human]** Accept the K26 wording, including "Rachunek".
- 6.11 **[human]** Accept that S-11 re-keys Santander card patterns.

**DESIGN-GAP:** K26 now has 6 code hits (`src/content/copy.ts` ×5, `src/pages/imports/new.astro` ×1) plus the
`design-kit.md` register row and "Do rundy 3" item 30 — the plan's "≥ 2 hits, Phase 6 completes it" criterion is
closed; no further K26 work remains for this slice.

**Follow-ups:** none new. No new `follow-ups/review-fixes.md` file (none existed for this slice before this step
either).

**ARTIFACT GAP:** none — every file the plan's Phase 6 referenced existed and was readable.

## 6. Autonomous decisions

1. **Narrowing `bank` for steps 2–3: widen the step-1 early-return guard to `!loaded` rather than deriving `bank`
   from a freshly re-checked `loaded?.detected.bank`.**
   - Chosen: `if (step === 1 || !loaded || !statement || !chosen) { … }`, then `const bank = loaded.detected.bank;`
     immediately after, relying on TypeScript's narrowing of the literal `loaded` reference.
   - Rejected: non-null-asserting (`loaded!.detected.bank`) without widening the guard.
   - Why: the guard already existed for `statement`/`chosen` (both derived from `loaded`); adding `!loaded` to the
     same condition is redundant at runtime (statement/chosen are only ever defined when loaded is) but is the only
     way to get the type-checker to narrow `loaded` itself for the rest of the function, with no runtime behaviour
     change and no new control-flow path.
   - What would change it: a future refactor collapsing `statement`/`chosen`/`bank` into one destructure at the top
     of the function — purely cosmetic, not required here.
2. **`readImportFile`'s synthetic "all credits" Santander fixture (Phase 6 unit test) is hand-built bytes, not a new
   fixture file.**
   - Chosen: a two-line literal string (header + one credit row) encoded inline in `test/unit/detect.test.ts`,
     satisfying rules 1–3 (9 fields, header shape, row-count check) with an invented account number and amount.
   - Rejected: adding a new file under `test/fixtures/santander/` for a single edge case already covered
     structurally by the existing main/USD fixtures.
   - Why: the plan's Phase 6 contract names this exact case ("a Santander file whose rows are all credits →
     `empty`") without asking for a fixture file, and the run contract's privacy guardrail is irrelevant here since
     every value is invented, not derived from the real exports.
   - What would change it: a later phase/slice needing more Santander edge-case fixtures for reasons beyond this one
     test, at which point promoting it to a shared fixture file would be worth the move.
3. **Proceeded to the epilogue (`change.md.status: implemented`) with 11 `[reviewer]`/`[visual]`/`[human]` Progress
   rows still open, per the run contract's explicit instruction for this step** (not the skill's own default, which
   would ask `AskUserQuestion` / "Pause").
   - Chosen: flip `change.md` to `implemented`, run the epilogue commit, report stragglers in §5 rather than pausing.
   - Rejected: pausing per the skill's stragglers prompt.
   - Why: the orchestrator's task explicitly named this outcome ("run the skill's epilogue → status implemented,
     even with [reviewer]/[visual]/[human] rows open") and forbade `AskUserQuestion` in this run.
   - What would change it: a future run step (or a human) explicitly asking for `/10x-implement` to be re-entered to
     resolve one of those rows before `/10x-impl-review` — nothing in this step's scope required that.
