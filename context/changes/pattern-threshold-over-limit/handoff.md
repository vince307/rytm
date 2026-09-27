# Handoff — `pattern-threshold-over-limit` (slice S-04)

Written by the `new` step (2026-09-27, autonomous run `2026-09-27-s03-s02-s04`). The change folder exists with
`change.md` (status `new`): roadmap claims checked against `main` `a6a8b18`, kit views/keys bound, triggered
follow-ups listed. The next agent must not get this wrong: patterns are **derived on read** (no pattern table), so a
threshold keys on `merchantKey` + `user_id` in a **new migrated table**, never on `import_id` — and „w tym miesiącu”
is still undecided.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/pattern-threshold-over-limit`, cut from `main` at `a6a8b18` (confirmed with `git branch --show-current`) |
| Commits this step | 1: `docs(pattern-threshold-over-limit): change identity (autonomous run)` |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `new` |
| `## Progress` rows remaining | n/a — no `plan.md` yet |
| Working tree | clean apart from the maintainer's ` M .gitignore` and `?? .claude/skills/10x-autonomous-run/` (never staged) |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `context/changes/pattern-threshold-over-limit/change.md` | Identity; roadmap claim ↔ repo ↔ correction table; migration verdict; kit views and `content.json` keys bound; expected DESIGN-GAPs; triggered follow-ups; autonomous decisions |
| `context/changes/pattern-threshold-over-limit/handoff.md` | This file |

## 3. Verification

Docs-only step; no code touched. Baseline (from the agent contract, `main` `a6a8b18`, inherited, unverified here):
lint 0 · astro check 0 errors (93 files) · vitest 78/78 (5 files) · pgTAP 54 (3 files) · smoke 61 PASS.

| Command | Result |
| --- | --- |
| `git branch --show-current` | `feat/pattern-threshold-over-limit` |
| `ls supabase/migrations` | 4 migrations, none stores thresholds or patterns → migration needed |
| `grep` over `src/lib/patterns/load.ts` `loadPatterns` | selects `id, amount_minor, counterparty, title` only — no date/description for the detail |
| `expected.json` top-level keys | `schema, tolerance, files, rows, patterns` — no threshold oracle |
| Suites (lint, check, test, build, smoke, pgTAP) | not run — no code or schema change in this step |

## 4. Next command

`/10x-research pattern-threshold-over-limit`

## 5. Open

- **Research questions** (in `change.md` Notes): (1) „ponad progiem w tym miesiącu” = calendar month of today vs
  latest month in the data vs a month selector (kit `patternDetail()` has a month `<select>`, `patternDetail.sumLabel`
  bakes „maju”); (2) detail route and lookup by `merchantKey` (`src/lib/patterns/merchant.ts` `merchantKey` is a
  lowercased display name — spaces/diacritics, not a slug); (3) widened read (booking date, raw description) and
  whether to do S-03 F2 keyset paging in `collectPages` at the same time; (4) threshold table shape, `kind`
  constraints, and behaviour when D5 (`d5Type`) flips a pattern's type under a stored threshold; (5) a unit oracle for
  the three Business-Logic over-limit rules (count, sum, fixed amount), since `test/fixtures/ing/expected.json` has none.
- **Follow-ups** (`context/archive/2026-09-25-undo-import/follow-ups/review-fixes.md`): S-03 F2 keyset paging
  (trigger fired, names S-04 — recommended in scope); F5 `buttonVariants` `text` → „Usuń próg” (in scope); invariant
  `merchantKey` + `user_id` (binding); shared dialog geometry / F9 close icon only if the plan adds a dialog.
- **DESIGN-GAPs**: none registered yet; candidates listed in `change.md` (badge „ponad próg” label, month-baked
  `sumLabel`, detail strings only in `app.js`, over-limit monthly sum on the detail, editor validation/pending/error
  states, unknown-key detail).
- **Hosted DB**: the migration needs `npx supabase db push` before merge (ship step, maintainer's standing authorisation).

## 6. Autonomous decisions

Recorded in full in `change.md` `## Autonomous decisions`. In short:

1. **Did not stop after `change.md`** — no human in the loop. Would change: a maintainer pause.
2. **Next = `/10x-research`**, not `/10x-plan`. Why: five grounding questions. Would change: research already on disk.
3. **Migration = yes, separate thresholds table keyed `(user_id, merchant_key)`**, shape left to plan. Rejected: a
   shared S-05 decisions table, user metadata. Would change: research showing S-05 merge needs one shared identity table.
4. **Primary view = pattern detail**; `/patterns` touched only for row link + Próg / Ponad progiem columns; `/home`
   stat and trend out. Would change: the plan cutting the list columns.
5. **S-03 F2 keyset paging recommended in scope.** Would change: the list read staying untouched.
6. **DESIGN-GAPs as candidates, not registered.** Would change: the contract requiring rows at `new`.
