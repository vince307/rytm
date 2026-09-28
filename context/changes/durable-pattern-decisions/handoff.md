# Handoff — `durable-pattern-decisions` (slice S-05)

Written by the `new` step (2026-09-28, autonomous run `2026-09-28-s05-s06-s07`). The slice has an identity
(`change.md`, status `new`) with the roadmap claims checked against `main` `f252112`, the kit binding, the expected
migration and the triggered follow-ups; no code yet. What the next agent must not get wrong: S-05 builds on **S-04's**
shipped code (detail route, `pattern_thresholds`, `appliesTo`), not only on S-03 as the roadmap says, and the F-02
oracle already encodes the S-05 answers (`sportowo` `user-merge`, `przelew-konto-osobiste` `user-exclude`).

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/durable-pattern-decisions`, cut from `main` at `f252112` (confirmed with `git branch --show-current`) |
| Commits on branch | 1 — `docs(durable-pattern-decisions): change identity (autonomous run)` |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `new` |
| `## Progress` rows remaining | n/a — no `plan.md` yet |
| Working tree | Clean after the commit (`tree-clean.sh` printed `CLEAN` before this step) |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `context/changes/durable-pattern-decisions/change.md` | Change identity: outcome + PRD refs, roadmap claim / repo now / correction table, migration expectation, design-kit binding (views, keys, candidate DESIGN-GAPs), triggered follow-ups, `## Autonomous decisions` |
| `context/changes/durable-pattern-decisions/handoff.md` | This file |

## 3. Verification

Docs-only step; no suites run (nothing executable changed). Baseline on `main` `f252112` per the agent contract
(inherited, unverified here): lint 0 · astro check 0 errors (109 files) · vitest 141 (8 files) · pgTAP 76 (4 files) ·
smoke 77 PASS.

| Command | Result |
| --- | --- |
| `git branch --show-current` | `feat/durable-pattern-decisions` |
| `.claude/skills/10x-autonomous-run/scripts/tree-clean.sh` (before writing) | `CLEAN` |
| Claims in `change.md` | Read from source this step: `src/lib/patterns/{load,derive,merchant,thresholds,view,over-limit}.ts`, `supabase/migrations/20260927200000_pattern_thresholds.sql`, `test/fixtures/ing/expected.json` (`resolvedBy` values), `test/unit/patterns.test.ts` `expectedGroups`, `design/rytm-os/prototype/app.js` (`modal`, `patternDetail`, `patterns`, `applyPatternState`, `restorePattern`), `content.json` `patternActions` |

## 4. Next command

`/10x-research durable-pattern-decisions`

## 5. Open

Research questions (from `change.md`):

- Decision storage shape (one `pattern_decisions` table vs alias table + attributes) and where decisions enter
  `derivePatterns` (`src/lib/patterns/derive.ts`) — merge must regroup before count/sum/D5 type.
- Merge semantics: surviving key, fate of the absorbed key's `pattern_thresholds` row, chains, merging into an
  excluded pattern, undo (kit promises reversal, shows no UI).
- User-pinned type vs S-04 `appliesTo` (`src/lib/patterns/over-limit.ts`) — keep or reset a mismatched threshold;
  `fixedAmountMinor` for a pinned-fixed pattern out of tolerance.
- Exclusion in `listOverview` / `patternDetail` (`src/lib/patterns/view.ts`) so S-06/S-07 inherit it.
- US-03 durability proof with one importable fixture file (undo + re-import, the `Rachunek VAT` account, or a split
  unit test).

Follow-ups triggered (detail in `change.md` table): S-04 F5 `loadThresholds` paging (in scope); shared dialog geometry
`src/components/ui/dialog.tsx` `DialogContent` + S-01 F9 + undo-import F4 (fires with the actions dialog; scope to
plan); S-04 F11 field radius (fires; local 8 px likely). Candidate DESIGN-GAPs (merge picker, inline rename, type-change
confirm, K11-class modal strings, undo, pending/error states) — not registered yet; G4 in
`context/foundation/design-kit.md` overstates delivery.

## 6. Autonomous decisions

See `change.md` `## Autonomous decisions` (not stopping after identity; research before plan; migration yes with a
one-table lean; detail as primary view; G4 partially delivered; dialog follow-up scope deferred to plan; Polish title) —
each with chosen / rejected / why / what would change the answer.
