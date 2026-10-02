# Handoff — `santander-csv-import` (slice S-10)

The `/10x-implement santander-csv-import phase 5` step of autonomous run `2026-10-01-m2-santander` implemented
Phase 5 (bank name on the imports list and the result). It is committed and the local gate is green. The next agent
must not get this wrong: **`copyExtra.imports.accountLabel` is now `{ ing, santander }`, not a bare string** — any
new code reading it must go through `accountLabel()` (`src/lib/import/banks.ts`) or index by bank, never
`.replace("{name}", …)` on the object directly. `ImportWizard.tsx` still only emits ING labels
(`x.accountLabel.ing`, a one-line compile fix) — **Phase 6 wires the real detected bank into the wizard**, not
this step.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/santander-csv-import`, cut from `main` at `1fed366` |
| Commits | 16 on top of `1fed366` (see Phase 4 handoff for 1–14), **this step**: Phase 5 copy+pages+helper (`c186c67`), Phase 5 SHA backfill (`8a72a56`) |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `implementing` (unchanged) |
| `## Progress` rows remaining | 16 (`grep -c '^- \[ \]' plan.md`; was 21, -5 for Phase 5's automated rows) |
| Working tree | clean (`bash .claude/skills/10x-autonomous-run/scripts/tree-clean.sh` → `CLEAN`) |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `src/lib/import/banks.ts` | New export `accountLabel(templates: Record<BankSource, string>, source: string, name: string): string` — fills `{name}` in the template keyed by `source`; an unknown source falls back to the `ing` template so a row can never crash. `BANK_SOURCES`/`BankSource`/`isBankSource` (from Phase 3) unchanged |
| `src/content/copy.ts` | `copyExtra.imports.accountLabel` becomes `{ ing: "ING · {name}", santander: "Santander · {name}" }` (`// DESIGN-GAP: K26`); new key `santanderAccountName: "Rachunek"` (`// DESIGN-GAP: K26`) — the Santander export's header col 3 (owner's name) is never read or stored (R2); "Rachunek" is a neutral stand-in |
| `src/pages/imports/index.astro` | Selects `source` alongside `account_name`; each row's `account` cell now reads `accountLabel(x.accountLabel, i.source, i.account_name)` instead of the old `.replace("{name}", …)` |
| `src/pages/imports/result.astro` | Selects `source`; the lead line uses `accountLabel(x.accountLabel, imported.source, imported.account_name)` |
| `src/components/imports/ImportWizard.tsx` | One-line fix only: `fill(x.accountLabel, …)` → `fill(x.accountLabel.ing, …)` (step-3 summary account row) — keeps compiling against the new per-bank shape; still ING-only, intentionally — Phase 6 wires the detected bank in |
| `test/unit/banks.test.ts` (new) | `BANK_SOURCES`/`isBankSource` sanity; `accountLabel` fills ING, fills Santander, falls back to `ing` for an unknown source (6 cases) |
| `scripts/smoke.mjs` | Two new steps in the re-created-account Santander block: `"imports list names the bank"` (`/imports` contains `>Santander · Rachunek<`, a rendered `<td>` text node — no island on this page) and `"santander import result names the bank"` (result page contains `Santander · Rachunek`) |
| `context/changes/santander-csv-import/plan.md` | `## Progress` 5.1–5.5 ticked with `— c186c67`; no other section touched |
| `context/changes/santander-csv-import/handoff.md` | This file |

## 3. Verification

| Command | Result (observed in this step) |
| --- | --- |
| `git branch --show-current` | `feat/santander-csv-import` (confirmed before starting) |
| `npx vitest run test/unit/banks.test.ts` | 6 passed, 1 file |
| `npm run lint` | One prettier error on the new `scripts/smoke.mjs` block; `npm run lint:fix` resolved it; final: 0 errors (baseline 0) |
| `npx astro check` | 0 errors, 0 warnings, 144 files (baseline 143 — +1 for `banks.test.ts`) |
| `npm run fixture:check` | `fixture:check ing OK`, `fixture:check santander OK` (Δ0, expected — Phase 5 doesn't touch the fixtures) |
| `npm test` | 285 passed, 18 files (baseline 279/17 — Δ+6/+1: `banks.test.ts`) |
| `npm run build` | OK |
| `npx supabase db reset && npx supabase test db` (sandbox disabled: Docker) | Files=6, Tests=119, **Result: PASS** (baseline Files=6/Tests=119 — Δ0, expected: Phase 5 doesn't touch the database) |
| `astro dev --port 4398` + `npm run smoke` (sandbox disabled: network) | 147 PASS / 0 FAIL (baseline 140, +7: +5 from Phase 3 unchanged, +2 new this phase), run three times (before break, after break, after restore) |
| **Deliberate break** (5.3): `src/pages/imports/index.astro`'s row mapping hard-coded `accountLabel(x.accountLabel, "ing", i.account_name)` instead of reading `i.source`. Ran the full smoke suite (steps are session-sequential, can't isolate one): `"imports list names the bank"` went **red** (`FAIL … -> 200`, the step's `contains` check failed), `"santander import result names the bank"` stayed **green** (result.astro was untouched by this break — proves the two new steps are independent, not one masking the other). Restored via `git checkout -- src/pages/imports/index.astro` (file was already staged, so this reset to the exact pre-break content); re-ran smoke twice → 147/147 green both times. **Meta-check**: the break only touches the list page's rendering, not `accountLabel()` itself or the result page — the list step going red in isolation (while the result step and every ING-path step stayed green) confirms it is testing *that page's* use of `source`, not something upstream (schema/endpoint/helper), and confirms the plan's own meta-check note: the list has no island, so this is genuinely the rendered `<td>` text, not a serialized prop | red → green confirmed |
| Final `lsof -ti :4398 -ti :4399` | Clear — dev server killed after the gate |

## 4. Next command

`/10x-implement santander-csv-import phase 6`

## 5. Open

**Carried from Phase 1–4 handoffs, unchanged:** S-11 re-keys Santander card patterns; R1 guarded only by the Phase 1
shape metric (run once by hand against both real exports); rollback shows "ING · Rachunek"; the PR preview
(production DB) cannot import until merge (plan-review F2 — **binding through Phase 6**: do not read a failed preview
import as a regression, do not add a fallback to `import_ing_statement`); Santander `title` holds the masked card
number (own data, RLS).

**Settled this step (with evidence, not argument):**
- Plan-review F1 ("Smoke Santander payload's `accountName` unspecified, but Phase 5 asserts 'Santander · Rachunek'")
  was already fixed in Phase 3's smoke contract (`accountName: "Rachunek"` pinned in `santanderPayload`) — verified
  in this step by reading `scripts/smoke.mjs` before editing; no action needed here, the new Phase 5 steps rely on
  that existing value and both passed.

**New from this step:**
- `accountLabel()`'s signature is `(templates: Record<BankSource, string>, source: string, name: string)`, matching
  the plan's contract exactly (Phase 5 § Changes Required #2) — no deviation to record.
- `copy.ts`'s `accountLabel` object is `as const` (inherited from the top-level `copyExtra` literal), so its values
  are literal string types, not `string`. Passing it to `accountLabel()`'s `Record<BankSource, string>` parameter
  type-checks because TS assignability ignores the extra narrowing/readonly here — flagging only because a future
  reviewer tightening `accountLabel()`'s signature to `Readonly<Record<BankSource, string>>` would be a no-op, not
  a fix for a real gap.

**Manual-only Progress rows (checklist, unchanged except the new one below):**

- 1.6 [reviewer] Real-export comparison — recorded finding in Phase 1 handoff; still unticked (not mine to tick).
- 2.7 [reviewer] Migration review — recorded finding in Phase 2 handoff; still unticked (not mine to tick).
- 3.6 [reviewer] ING smoke steps byte-identical; stale-tab default covered by them — still unticked.
- 4.7 [reviewer] Reader vs rules 1–6; no real-export value in code or tests — still unticked.
- **5.6 [visual] List and result** — new this phase: screenshots at 1280 px and ~400 px of the list (one ING +
  one Santander row) and both result screens, compared with kit `imports.html` / `imports-result.html`; not run
  (no browser driver in this step's scope) — still unticked, not mine to tick.
- 6.6 [visual] Every wizard state at 1280 and ~400 px.
- 6.7 [reviewer] Full local Santander import.
- 6.8 **[human]** Import the owner's real export locally.
- 6.9 **[human]** Accept the rule-7 deviation (Lp not stored).
- 6.10 **[human]** Accept the K26 wording, including "Rachunek".
- 6.11 **[human]** Accept that S-11 re-keys Santander card patterns.

**DESIGN-GAP added in this step:** K26 — two hits in `src/content/copy.ts` (`accountLabel`, `santanderAccountName`);
Phase 6 § Changes Required #5 still owes the `design-kit.md` register row and the remaining code hits (expects
≥ 2 total at the end of Phase 6, this step already provides 2).

**Follow-ups:** none new. No new follow-up file.

## 6. Autonomous decisions

1. **Where to place the deliberate break (5.3): the list page's row mapping, not `accountLabel()` itself.**
   - Chosen: break `src/pages/imports/index.astro` to pass a literal `"ing"` instead of `i.source`.
   - Rejected: breaking `accountLabel()` internally (e.g. making it always return the `ing` template) — would also
     turn the Phase 5 unit tests red, muddying which layer the break (and the smoke step) is actually proving.
   - Why: the plan's own wording ("the list ignores `source`") describes the page's behaviour, not the helper's;
     breaking at the page layer isolates the smoke assertion to exactly what it claims to guard, and keeping
     `accountLabel()` itself intact let the result-page step stay green as an independent confirmation.
   - What would change it: a reviewer wanting the break to also exercise `accountLabel()`'s fallback path directly
     — that path already has its own unit-test coverage (`banks.test.ts`'s "falls back … for an unknown source"),
     so this was judged redundant rather than missing.
2. **`ImportWizard.tsx`'s one-line fix uses `x.accountLabel.ing` (hard-coded), not a new per-bank lookup.**
   - Chosen: literal `.ing` access, with a comment that Phase 6 replaces it.
   - Rejected: wiring `accountLabel()` into the wizard now, ahead of schedule.
   - Why: the plan's Phase 5 § Changes Required #1 says exactly this ("The wizard's single use of `accountLabel`
     becomes `accountLabel.ing`, so ING renders the same. Phase 6 makes it per-bank.") — not a judgment call, a
     literal instruction.
   - What would change it: nothing — this is the plan's own contract point, settled already.
