# Handoff — `santander-card-merchants` (slice S-11)

Written by the `/10x-new` step of run `2026-10-01-m2-santander`. The change identity exists (`change.md`, status
`new`) with a measured gap against the F-03 oracle; no code has changed. The next agent must not let any new
normalisation rule reach ING raws: `test/unit/patterns.test.ts` checks only the ING partition, so a consistent
re-key of ING merchants would stay green while orphaning saved thresholds/decisions (stored by `merchant_key` text).

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/santander-card-merchants`, cut from `main` at `9f63fd9` |
| Commits | 1 on the branch (`docs(santander-card-merchants): change identity (autonomous run)`) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `new` |
| `## Progress` rows remaining | n/a — no `plan.md` yet |
| Working tree | clean after the commit (only the two files below changed) |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `context/changes/santander-card-merchants/change.md` | Identity: scope, measured gap (37 keys vs 34 oracle groups; splits ST02 city, ST04 ATM, ST03 expected user-merge; ST10 cross-bank not joined), ING key protection, kit bindings (no gap), roadmap-claim table, triggered follow-ups, 6 autonomous decisions, research questions Q1–Q4 |
| `context/changes/santander-card-merchants/handoff.md` | This file |

## 3. Verification

| Command | Result |
| --- | --- |
| `git branch --show-current` | `feat/santander-card-merchants` |
| Probe: current `merchantKey(rawMerchant(raw, ""))` (copy of `src/lib/patterns/merchant.ts` in `$TMPDIR`, `node --experimental-strip-types`) over the 184 imported rows of `test/fixtures/santander/expected.json` | 37 keys vs 34 oracle groups, 0 over-merges; splits `siec-przyklad`, `bankomat`, `marka` (expected); ING pizzeria key `pizzeria trzy sery` vs Santander `pizzeria trzy sery krakow` |
| `grep "VISA"` on the ING fixture CSVs | 0 matches — the Santander card title never occurs in ING data |
| lint / astro check / vitest / build / pgTAP / smoke | **not run** — docs-only step, no code changed. Baseline (inherited, unverified here): contract line for `main` 9f63fd9 |

## 4. Next command

`/10x-research santander-card-merchants`

## 5. Open

- Research questions Q1–Q4 in `change.md` § Open questions for research (city recognition, real-tail aggregates,
  ATM rule location in `src/lib/patterns/merchant.ts` `rawMerchant`, display name via `src/lib/patterns/derive.ts`
  `topVariant`).
- In scope by decision: S-10 F4 — `src/lib/import/banks.ts` `accountLabel` → `template.replace("{name}", () => name)`
  plus a test in `test/unit/banks.test.ts`.
- [human] rows carried, not owned by an agent:
  - [ ] F-03 3.9 — confirm the oracle's product calls (`Wypłata BLIK` own pattern, ST03 user-merge, `Oplata za …`
        fixed); reversible in `scripts/fixture-santander.mjs` `buildST06`/`buildST03`/`buildST11`.
  - [ ] S-10 6.11 — accept that S-11 re-keys Santander card patterns (no key migration, `change.md` decision 3).
  - [ ] S-10 6.8 — owner imports the real Santander PLN export locally.
- Adjacent, plan decides: merchant-patterns F3 (`normalizeMerchant` tests for `S.C.A` / `http://`).
- DESIGN-GAP: none added. Migration: none expected.
- ARTIFACT GAP: none.

## 6. Autonomous decisions

1. **Next step `/10x-research`, not `/10x-plan`.** Rejected: plan directly, frame. Why: city recognition and the
   gating point need codebase grounding and an aggregate real-tail check. Would change: the orchestrator mandating
   plan next.
2. **Santander rules gated on the card `title` (`DOP. VISA …`).** Rejected: global rules (re-key ING raws ending in a
   city or carrying quotes); gating on `imports.source` (extra join). Would change: a non-card Santander row needing
   the same rules, or an ING title matching the card regex.
3. **No key migration for thresholds/decisions on raw-tail Santander patterns.** Rejected: SQL re-key migration
   (re-implements the normaliser in SQL; unsafe in the deploy window). Would change: owner rejecting 6.11 or evidence
   of such rows in production.
4. **`bankomat` name is normalisation data, no DESIGN-GAP.** Would change: research finding it rendered as UI
   chrome → K27 + `copyExtra`.
5. **S-10 F4 taken into scope.** Rejected: waiting for the file to be touched. Would change: plan judging it a
   distraction → follow-up row with a concrete trigger.
6. **Real exports not opened in this step.** Research may, under the contract's privacy rules.
