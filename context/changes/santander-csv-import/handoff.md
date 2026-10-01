# Handoff — `santander-csv-import` (slice S-10)

The `/10x-implement santander-csv-import phase 3` step of autonomous run `2026-10-01-m2-santander` implemented
Phase 3 (source-aware payload schema + `banks.ts` + the endpoint calling `import_statement`). It is committed and
the local gate is green. The next agent must not get this wrong: **`bankTxId` is now `string | null`** on
`ImportPayload["transactions"][number]` — any new code reading it (Phase 4's Santander reader, Phase 6's wizard
wiring) must handle `null` explicitly; four pre-existing unit test fixtures (`fixed-overview`, `home-stats`,
`over-limit-trend`, `patterns`) needed a one-line adaptation (`t.bankTxId ?? ""`) because they reused `bankTxId` as
a stand-in `PatternSource.id` — the real app never does this (`src/lib/patterns/load.ts` uses the transaction row's
own `id`), so this was a test-only ripple, not a product change.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/santander-csv-import`, cut from `main` at `1fed366` |
| Commits | 12 on top of `1fed366`: identity (`d2f2a86`), research (`e5f54f9`), plan (`396ea97`), plan review (`e576f3d`), Phase 1 fix (`b7880c3`), Phase 1 SHA backfill (`00c4400`), Phase 1 handoff (`03f4d08`), Phase 2 migration+RPC+pgTAP+types (`b7f29e1`), Phase 2 SHA backfill (`e9d14d8`), Phase 2 handoff (`d9a09fb`), **this step**: Phase 3 payload+endpoint (`2afa395`), Phase 3 SHA backfill (`208ff48`) |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `implementing` (unchanged) |
| `## Progress` rows remaining | 27 (`grep -c '^- \[ \]' plan.md`; was 32, -5 for Phase 3's automated rows) |
| Working tree | clean (`bash .claude/skills/10x-autonomous-run/scripts/tree-clean.sh` → `CLEAN`) |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `src/lib/import/banks.ts` (new) | `BANK_SOURCES = ["ing", "santander"]`, `BankSource`, `isBankSource` — the one source of truth for the supported banks |
| `src/lib/import/schema.ts` | `importPayloadSchema` gains `source: z.enum(BANK_SOURCES).default("ing")` (stale tab with no `source` parses as ING); `bankTxId` is now `.nullable()`; a third `.refine()` enforces non-null for `ing`, null for `santander`. Header comment updated to name `import_statement` |
| `src/lib/import/ing.ts` | `buildImportPayload` return literal gains `source: "ing"`; nothing else changed |
| `src/pages/api/imports.ts` | Calls `supabase.rpc("import_statement", { p_source: p.source, …​ })` instead of `import_ing_statement`; header comment updated. Every redirect / error-code mapping unchanged |
| `test/unit/schema.test.ts` | 5 new cases: stale-tab default → `ing`, unknown source rejected, Santander payload with null `bankTxId` accepted, Santander payload with an 18-digit id rejected, ING payload with a null id rejected. `payload()` factory gains `source: "ing"` |
| `test/unit/{fixed-overview,home-stats,over-limit-trend,patterns}.test.ts` | One-line adaptation each: `id: t.bankTxId` → `id: t.bankTxId ?? ""` (with a comment) — `bankTxId`'s widened type otherwise fails `astro check` against `PatternSource.id: string`. ING fixture data never actually produces `null` here |
| `scripts/smoke.mjs` | Additions only (`git diff main` shows no removed lines): `santanderPayload` / `santanderInvalidPayload` constants + `santanderResultPath`, and 5 new steps inserted between "signin re-created account" and "delete re-created account (cleanup)" — save, result debit count, patterns list (`>Santander smoke<`, the rendered node), overlap rejection, invalid-id rejection |
| `context/changes/santander-csv-import/plan.md` | `## Progress` 3.1–3.5 ticked with `— 2afa395`; no other section touched |
| `context/changes/santander-csv-import/handoff.md` | This file |

## 3. Verification

| Command | Result (observed in this step) |
| --- | --- |
| `git branch --show-current` | `feat/santander-csv-import` (confirmed before starting) |
| `npx vitest run test/unit/schema.test.ts test/unit/ing-parser.test.ts` | 26 passed, 2 files — confirms the new schema cases and that `ing-parser.test.ts` needed no change beyond what `buildImportPayload` itself now returns |
| `npm run lint` | First pass: 2 prettier errors (new code); `npm run lint:fix` resolved both; final: 0 errors (baseline 0) |
| `npx astro check` | First pass: 4 errors in 4 unrelated test fixtures (`PatternSource.id` no longer assignable from widened `bankTxId`) — fixed with `?? ""` (see `## 2`); final: 0 errors, 0 warnings, 138 files (baseline 137 files, 0 errors — +1 for `banks.ts`) |
| `npm run fixture:check` | `fixture:check ing OK`, `fixture:check santander OK` (Δ0, expected — Phase 3 doesn't touch the fixtures) |
| `npm test` | 261 passed, 15 files (baseline 256/15 — Δ+5, the new schema cases) |
| `npm run build` | OK |
| `npx supabase db reset && npx supabase test db` (sandbox disabled: Docker) | Files=6, Tests=119, **Result: PASS** (baseline Files=6/Tests=119 after Phase 2 — Δ0, expected: Phase 3 doesn't touch the database) |
| `astro dev --port 4398` + `npm run smoke` (sandbox disabled: network) | 145 PASS / 0 FAIL (baseline 140/0 — Δ+5, the new Santander smoke steps) |
| `git diff main -- scripts/smoke.mjs` | Only added lines (`grep '^-'` on the diff, excluding the `---` header, is empty) |
| **Deliberate break 1** (3.3): endpoint hard-coded `p_source: "mbank"` instead of `p.source`; re-ran smoke → the Santander save step (and, as a side effect of hard-coding unconditionally, every ING import step too — `23514` on any source) failed red with `?error=failed`; restored the file (byte-diff confirmed identical to staged); re-ran smoke → 145/0 again. **Meta-check** (plan's own text): reverting the call to `import_ing_statement` instead would NOT have gone red for Santander (it accepts a null `bank_tx_id`) — so this break specifically proves `p_source` reaches the database, not that the stored value is `'santander'` (that's pgTAP 2.1 and, later, the Phase 5 list step) | red → green confirmed; meta-check holds |
| **Deliberate break 2** (3.4): deleted the third `.refine()` in `schema.ts` (the per-bank `bankTxId` rule); `npx vitest run test/unit/schema.test.ts` → exactly the two predicted cases failed red ("rejects a santander payload carrying an 18-digit bankTxId", "rejects an ing payload with a null bankTxId"), the other 10 stayed green; restored the file (byte-diff confirmed identical); re-ran → 12/12 green | red → green confirmed |
| Final `lsof -ti :4398 -ti :4399` | Clear — dev server killed after the gate |

## 4. Next command

`/10x-implement santander-csv-import phase 4`

## 5. Open

**Carried from Phase 1/2 handoffs, unchanged:** S-11 re-keys Santander card patterns; R1 guarded only by the Phase 1
shape metric (run once by hand against both real exports); rollback shows "ING · Rachunek"; the PR preview
(production DB) cannot import until merge (Known risks, plan-review F2 — **binding through Phase 6**: do not read a
failed preview import as a regression, do not add a fallback to `import_ing_statement`); Santander `title` holds the
masked card number (own data, RLS); the pgTAP volatile-function-in-WHERE hazard from Phase 2's handoff (no new
pgTAP this phase, so not re-triggered, but still relevant if Phase 4+ adds any).

**New from this step:**
- `ImportTransaction.bankTxId` is `string | null` everywhere now, not just for the Santander path. Phase 4's reader
  (`src/lib/import/santander.ts`, not yet created) must build its payload with `bankTxId: null` on every
  transaction (rule 7) — the schema refine already enforces this per `source`, but the reader itself must emit it
  correctly or every Santander payload will fail validation with `error=invalid`.
- The smoke Santander account number `"22222200000000000000000099"` and counterparty `"Santander smoke"` are now
  reserved identifiers in `scripts/smoke.mjs` — Phase 5/6 smoke additions (if any) should pick different literals to
  avoid collisions if they touch the same account.

**Manual-only Progress rows (checklist, unchanged except the new one below):**

- 1.6 [reviewer] Real-export comparison — recorded finding in Phase 1 handoff; still unticked (not mine to tick).
- 2.7 [reviewer] Migration review — recorded finding in Phase 2 handoff; still unticked (not mine to tick).
- **3.6 [reviewer] ING smoke steps byte-identical; stale-tab default covered by them** — new this phase: confirmed
  by `git diff main -- scripts/smoke.mjs` (additions only, see `## 3`) and by the new schema test "parses a payload
  without source as ing (stale-tab default)"; still unticked (not mine to tick).
- 4.7 [reviewer] Reader vs rules 1–6.
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

1. **Execution mode: implemented Phase 3 directly in this context rather than delegating to a subagent.**
   - Chosen: write and verify the code myself, in this session.
   - Rejected: dispatch a `general-purpose` subagent per the skill's "delegate" option.
   - Why: the agent-contract run rule forbids `AskUserQuestion` (which the skill would otherwise use to ask exec
     mode), and I am already the single fresh agent assigned to this whole phase; delegating would add a
     round-trip and a second context for no benefit at this phase's size (4 production files + 5 test files).
   - What would change it: a phase large enough that keeping this context lean mattered more than the round-trip
     cost — not the case here.
2. **The per-bank `bankTxId` refine also widened `bankTxId` to `string | null` for ING**, which broke 4 unrelated
   test fixtures at `astro check` (`fixed-overview`, `home-stats`, `over-limit-trend`, `patterns` — all used
   `t.bankTxId` as a stand-in `PatternSource.id`).
   - Chosen: fix each with `id: t.bankTxId ?? ""` plus a one-line comment, since ING's reader never actually
     produces `null` (confirmed by reading `ing.ts`) and the real app computes `PatternSource.id` from the
     transaction row's own `id`, never from `bankTxId` (`src/lib/patterns/load.ts`), so this stand-in was always
     test-local shorthand.
   - Rejected: a non-null assertion (`t.bankTxId!`) — blocked by `@typescript-eslint/no-non-null-assertion`
     (confirmed by running lint); leaving the type narrower for ING-only (e.g. a conditional type keyed on
     `source`) — not worth the complexity for 4 test call sites.
   - Why: smallest, most honest fix; no production code or behavior changed, only 4 test fixtures.
   - What would change it: a future phase needing `bankTxId` type-narrowed by `source` at the type level (e.g. a
     discriminated union) — not needed by this plan.
3. **Deliberate break 1 (3.3) broke every import, not only Santander's**, because hard-coding `p_source: "mbank"`
   is unconditional.
   - Chosen: accept this as proving the plan's intended thing (p_source reaches the database) even though the
     blast radius was wider than "the Santander save step" alone; the plan's own meta-check text anticipates this
     exact shape of break and names precisely what it does and doesn't prove.
   - Rejected: scoping the break to apply only when `p.source === "santander"` (e.g. `p_source: p.source === "santander" ? "mbank" : p.source`) to isolate the blast radius.
   - Why: the plan's literal break text is "the endpoint passes `p_source: "mbank"` instead of `p.source`" —
     unconditional, matching what I did; a scoped version would be a different, invented break not asked for.
   - What would change it: a future phase's break-check needing a narrower blast radius for its own reasons.
