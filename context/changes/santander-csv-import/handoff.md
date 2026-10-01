# Handoff — `santander-csv-import` (slice S-10)

The `/10x-implement santander-csv-import phase 4` step of autonomous run `2026-10-01-m2-santander` implemented
Phase 4 (pure Santander reader + format detector, tested against `expected.json`). It is committed and the local
gate is green. The next agent must not get this wrong: **`detectStatement`/`buildPayload` exist but are not wired
into the wizard yet** — `ImportWizard.tsx` still calls `parseIngStatement` directly; Phase 6 does the wiring.
`santander.ts`'s reader never reads header col 3 (the owner's name) — the account's display name is injected via
`opts.accountName`, which Phase 5/6 will set from `copyExtra.imports.santanderAccountName` ("Rachunek").

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/santander-csv-import`, cut from `main` at `1fed366` |
| Commits | 14 on top of `1fed366`: … (see Phase 3 handoff for 1–12), **this step**: Phase 4 reader+detector (`c339cfe`), Phase 4 SHA backfill (`043a67b`) |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `implementing` (unchanged) |
| `## Progress` rows remaining | 21 (`grep -c '^- \[ \]' plan.md`; was 27, -6 for Phase 4's automated rows) |
| Working tree | clean (`bash .claude/skills/10x-autonomous-run/scripts/tree-clean.sh` → `CLEAN`) |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `src/lib/import/common.ts` (new) | `toMinor`/`isDate` moved out of `ing.ts`; `ParseError` (`"unknown-format" \| "wrong-currency"`) and `StatementAccount` (`name, number, rows, debits, credits`) — shared by both readers |
| `src/lib/import/santander.ts` (new) | `parseSantanderStatement(bytes, { accountName })`: strict UTF-8 decode, 9-field/col-8-empty structural check, header validation (col 0 `YYYY-MM-DD`, col 1 valid `DD-MM-YYYY`, col 2 `'<26 grouped digits>`, col 7 integer == row count, start ≤ export date), per-row date/amount validation, R1 (operation date outside `[header col 1, header col 0]` → `unknown-format`), currency check only once structure holds (rule 2). `rawMerchantOf`: CARD regex tail, else col 3, else col 2 (rule 5). `buildSantanderPayload`: debits only (D2), absolute amounts in file order, `bankTxId: null` (rule 7), period from the header. The line dialect (`parseLine`) is a deliberate independent copy of `scripts/fixture-santander-check.mjs`'s — same ST15 behaviour (a bare field may hold an unescaped `"`), no `""` escape. Also exports `looksLikeSantander(bytes)`, the cheap rule-1-only check `detect.ts` uses |
| `src/lib/import/detect.ts` (new) | `detectStatement(bytes, { santanderAccountName })`: tries Santander first (`looksLikeSantander`); once matched, a later Santander failure (`unknown-format`/`wrong-currency`) is final and never falls through to `parseIngStatement`. Returns `{ ok: true; bank: "ing" \| "santander"; statement }` (a discriminated union, not the loosely-typed shape the plan's prose sketched — needed so `buildPayload` can narrow and dispatch) or `{ ok: false; error }`. `buildPayload(detected, accountNumber)` dispatches to `buildImportPayload` or `buildSantanderPayload` |
| `src/lib/import/ing.ts` | No behaviour change: `toMinor`/`isDate` now imported from `common.ts` (local copies deleted); `IngAccount = StatementAccount`, `IngParseError = ParseError` (type aliases, so every existing `IngAccount`/`IngParseError` use site keeps compiling unchanged) |
| `test/unit/santander-parser.test.ts` (new) | Main fixture: one account/period/row-counts (187/184/3), payload (184 debits, sum 1342109, `source: "santander"`, every `bankTxId` null, schema-valid), per-debit-row date/amount/`rawMerchant` in file order against `expected.json`, the three ST15 rows. A **synthetic** single-row test pins rule 5's CARD-before-col-3 priority — the real fixture can never exercise this ordering, since a card row's col 3 is always empty (enforced by the generator), so testing against the fixture alone would make deliberate break 1 (below) invisible. USD → `wrong-currency`. Five `unknown-format` variants: one data row removed (header col 7 mismatch), one operation date moved before the header start (R1, via a targeted first-two-fields string replace — dates never contain a comma, so this is safe even though later fields are comma-quoted), a hand-built `""` escape attempt, the ING fixture's cp1250 bytes, and the main fixture with one multi-byte UTF-8 character corrupted (simulating a cp1250 re-save) |
| `test/unit/detect.test.ts` (new) | Both fixtures route to the right bank; the Santander USD fixture stays `wrong-currency` (not `unknown-format` — proves rule 1 matched and the Santander path was final); empty and random bytes → `unknown-format`; `buildPayload` dispatches correctly for both banks |
| `context/changes/santander-csv-import/plan.md` | `## Progress` 4.1–4.6 ticked with `— c339cfe`; no other section touched |
| `context/changes/santander-csv-import/handoff.md` | This file |

## 3. Verification

| Command | Result (observed in this step) |
| --- | --- |
| `git branch --show-current` | `feat/santander-csv-import` (confirmed before starting) |
| `npx vitest run test/unit/santander-parser.test.ts test/unit/detect.test.ts` | 12 + 6 = 18 passed, 2 files |
| `npm run lint` | Two passes needed prettier fixes (new test/code files); `npm run lint:fix` resolved both; final: 0 errors (baseline 0) |
| `npx astro check` | 0 errors, 0 warnings, 143 files (baseline 138 — +5 for `common.ts`, `santander.ts`, `detect.ts`, `santander-parser.test.ts`, `detect.test.ts`) |
| `npm run fixture:check` | `fixture:check ing OK`, `fixture:check santander OK` (Δ0, expected — Phase 4 doesn't touch the fixtures) |
| `npm test` | 279 passed, 17 files (baseline 261/15 — Δ+18: 12 santander-parser + 6 detect) |
| `npm run build` | OK |
| `npx supabase db reset && npx supabase test db` (sandbox disabled: Docker) | Files=6, Tests=119, **Result: PASS** (baseline Files=6/Tests=119 after Phase 2/3 — Δ0, expected: Phase 4 doesn't touch the database) |
| `astro dev --port 4398` + `npm run smoke` (sandbox disabled: network) | 145 PASS / 0 FAIL, run twice (once before, once after the deliberate-break/restore cycle) — unchanged from Phase 3 baseline (Δ0, expected: Phase 4 doesn't touch the endpoint or smoke) |
| **Deliberate break 1** (4.3): swapped `rawMerchantOf` to check `counterparty` before the CARD regex. First attempt against the real fixture alone stayed **green** — every card row in the fixture has an empty col 3 (enforced by the generator and the oracle's own `"card row must have col 3/col 4 empty"` assertion), so the priority is structurally unobservable there. Added a synthetic single-row test (atypical: CARD-matching description with a non-empty col 3) specifically to pin the order; re-broke → that one test went red (`expected "TEST MERCHANT", received "ATYPICAL COUNTERPARTY"`), the other 11 stayed green; restored → 12/12 green. **Meta-check**: the first (vacuous) attempt is itself the meta-check finding — it shows the fixture-only tests do NOT prove rule 5's priority, only the synthetic test does | red → green confirmed, after fixing a vacuous first attempt |
| **Deliberate break 2** (4.4): made the bare-field branch of `parseLine` throw on an embedded `"` (ING's dialect). The whole suite failed to collect (`parseOk` at module scope threw `unknown-format`) — the main fixture genuinely contains the ST15 shape (3 rows), so breaking it is not vacuous; restored → 12/12 green | red → green confirmed; meta-check holds (the break's blast radius — failing to even parse the main fixture — proves the fixture really needs the lenient bare-field rule) |
| **Deliberate break 3** (4.5): a literal "ING first, fall through to Santander" swap left the USD case correct by accident (ING's `parseIngStatement` cleanly rejects the ASCII-only USD file as `unknown-format`, so the detector still fell through to Santander and still got `wrong-currency` — same final answer). Rewrote the break as the plan's `unknown-format` text implies: ING first, and on reaching Santander, discard its actual error and report a generic `unknown-format` regardless of what Santander found. That isolated exactly the predicted case: "USD → wrong-currency, not unknown-format" went red, the other 5 `detect.test.ts` cases stayed green; restored → 6/6 green | red → green confirmed, after correcting a break that didn't match the described symptom |
| Final `lsof -ti :4398 -ti :4399` | Clear — dev server killed after the gate |

## 4. Next command

`/10x-implement santander-csv-import phase 5`

## 5. Open

**Carried from Phase 1/2/3 handoffs, unchanged:** S-11 re-keys Santander card patterns; R1 guarded only by the Phase 1
shape metric (run once by hand against both real exports) — note R1 is now also *enforced* inside the reader itself
(`santander.ts`'s per-row check), so this carried risk is only about whether a *future* real export could sit outside
the fixed boundary, not about whether the current rule is implemented; rollback shows "ING · Rachunek"; the PR preview
(production DB) cannot import until merge (plan-review F2 — **binding through Phase 6**: do not read a failed preview
import as a regression, do not add a fallback to `import_ing_statement`); Santander `title` holds the masked card
number (own data, RLS); the pgTAP volatile-function-in-WHERE hazard from Phase 2's handoff (no new pgTAP this phase,
so not re-triggered).

**Settled this step (with evidence, not argument):**
- Phase 3's open item — "the reader must build its payload with `bankTxId: null` on every transaction" — is done:
  `buildSantanderPayload` hard-codes `bankTxId: null`, proven by `test/unit/santander-parser.test.ts`'s
  "builds a payload with 184 debits … every bankTxId null" case, which also asserts the payload passes
  `importPayloadSchema`.

**New from this step:**
- `detect.ts`'s `DetectResult` type is a discriminated union (`{ ok: true; bank: "ing"; statement: IngStatement }
  | { ok: true; bank: "santander"; statement: SantanderStatement } | { ok: false; error: ParseError }`), not the
  looser `{ accounts; defaultAccountNumber; period }` shape the plan's Phase 4 §3 prose sketched. The looser shape
  cannot carry `statement.rows` (bank-specific), which `buildPayload`/Phase 6's wizard need — this is a judgment
  call filling in an implementation detail the plan left open, not a deviation from any tested contract point.
- `looksLikeSantander` (exported from `santander.ts`) is the "rule 1 only" cheap check `detect.ts` uses to decide
  fall-through. It re-decodes and re-parses line 1 independently of the full reader — acceptable cost at Santander's
  real-world file sizes (≤ ~500 rows), not shared code with `readStatement`'s own line-1 validation (deliberately: a
  wrong early-return here only ever shows up as a detection-order bug, caught by `detect.test.ts`, never as a parse
  bug).
- `santander.ts` validates **both** data-row date columns (col 0 booking date and col 1 operation date) for shape
  and calendar validity, even though only col 1 (`occurredOn`) is stored — matching the oracle script's stricter
  reading of "Any data-row date is invalid" (plural) rather than the narrower reading (col 1 only). Phase 4.7's
  reviewer check should confirm this reading is the intended one; if not, col 0 validation is one `isValidDmy` call
  to remove.

**Manual-only Progress rows (checklist, unchanged except the new one below):**

- 1.6 [reviewer] Real-export comparison — recorded finding in Phase 1 handoff; still unticked (not mine to tick).
- 2.7 [reviewer] Migration review — recorded finding in Phase 2 handoff; still unticked (not mine to tick).
- 3.6 [reviewer] ING smoke steps byte-identical; stale-tab default covered by them — still unticked.
- **4.7 [reviewer] Reader vs rules 1–6; no real-export value in code or tests** — new this phase: everything in
  `santander.ts`/the tests uses only the synthetic fixture and hand-built literal CSVs (no real-export data was
  opened in this step); still unticked (not mine to tick).
- 5.6 [visual] List and result.
- 6.6 [visual] Every wizard state at 1280 and ~400 px.
- 6.7 [reviewer] Full local Santander import.
- 6.8 **[human]** Import the owner's real export locally.
- 6.9 **[human]** Accept the rule-7 deviation (Lp not stored).
- 6.10 **[human]** Accept the K26 wording, including "Rachunek".
- 6.11 **[human]** Accept that S-11 re-keys Santander card patterns.

**DESIGN-GAP to add in implement:** K26 (Phases 5–6), unchanged — not due yet.

**Follow-ups:** none new. No new follow-up file.

## 6. Autonomous decisions

1. **`DetectResult`'s type is a discriminated union over the full `IngStatement`/`SantanderStatement`, not the
   plan's sketched `{ accounts; defaultAccountNumber; period }` shape.**
   - Chosen: `{ ok: true; bank: "ing"; statement: IngStatement } | { ok: true; bank: "santander"; statement:
     SantanderStatement } | { ok: false; error: ParseError }`.
   - Rejected: the plan's literal prose shape, which only guarantees `accounts`/`defaultAccountNumber`/`period`.
   - Why: `buildPayload` must dispatch to `buildImportPayload` or `buildSantanderPayload`, both of which need the
     bank-specific `statement.rows`; the narrower shape would lose that field entirely. The discriminated union
     still exposes everything the plan named (both statement shapes include `accounts`/`defaultAccountNumber`/
     `period` via `StatementAccount`), so no caller loses access to what the plan promised.
   - What would change it: a reviewer insisting the detector's public type literally match the plan's prose over
     keeping `buildPayload` dispatchable — would need a second, separate "summary" type instead.
2. **Both data-row date columns (col 0 and col 1) are validated for calendar correctness**, not only the stored
   col 1.
   - Chosen: validate both via `isValidDmy` (shape + real-calendar-date), matching the oracle script's `readStatement`
     which validates col 0 the same way col 1 is validated.
   - Rejected: validating only col 1 (the one actually mapped to `occurredOn`) — a stricter reading of the plan's
     "Any data-row date is invalid" bullet would allow this, since col 0 is never read.
   - Why: the oracle (the Phase 4 contract's named reference) treats col 0 as a real invariant-bearing date, not an
     unchecked value; a malformed booking date is exactly the kind of row the format contract would want rejected
     even though the app discards the column afterwards.
   - What would change it: 4.7's reviewer check disagreeing, or a real export (checked only via the Phase 1 shape
     metric, not here) showing a malformed-but-otherwise-valid booking date that should be tolerated.
3. **Deliberate break 1 needed a second, synthetic test before it was observable** (see `## 3`).
   - Chosen: add the synthetic single-row test to `santander-parser.test.ts` as part of this phase's test suite
     (not a throwaway probe), since it pins a real behavioural contract point (rule 5's priority) that the fixture
     alone cannot exercise, and leaving it out would mean rule 5's ordering has zero test coverage going forward.
   - Rejected: accepting the break as "vacuously unobservable, therefore fine" and moving on without adding
     coverage.
   - Why: a break that reveals a gap in test coverage, rather than confirming existing coverage, must be closed
     before the phase can honestly claim the deliberate-break criterion passed.
   - What would change it: nothing — this is now permanent test coverage, not a one-off decision.
4. **Deliberate break 3 was rewritten from a literal order-swap (which left the USD case correct by accident) to
   the error-discarding variant the plan's described symptom implies** (see `## 3`).
   - Chosen: "ING first; on reaching Santander, discard its real error and report `unknown-format`
     unconditionally" — matches "the USD case returns `unknown-format`" exactly.
   - Rejected: the literal "ING first, else Santander" swap — it happened to produce the *same* final answer for
     the USD fixture (ING cleanly fails as `unknown-format`, Santander is then tried and still correctly reports
     `wrong-currency`), so it could not have gone red for the predicted reason.
   - Why: a deliberate break must actually exercise the invariant it claims to; the literal swap did not, and using
     it anyway would have been a passing meta-check for the wrong reason.
   - What would change it: nothing — the corrected break is the one recorded as this phase's 4.5.
