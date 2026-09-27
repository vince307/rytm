# Handoff — `pattern-threshold-over-limit` (slice S-04)

Written by the `research` step (2026-09-27, autonomous run `2026-09-27-s03-s02-s04`). `research.md` answers the
seven grounding questions from `change.md`; `change.md` status is now `preparing`. The next agent must not get this
wrong: the PRD **contradicts itself** on the over-limit amount for the sum and fixed kinds (Business Logic „nadwyżka”
= excess part vs US-01 AC = full flagged amounts), and „w tym miesiącu” is **not** today's month by default —
research recommends the latest month present in the user's data (the fixture ends 2026-08). The plan must decide both
explicitly.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/pattern-threshold-over-limit`, cut from `main` at `a6a8b18` (confirmed with `git branch --show-current`) |
| Commits on branch | 2: `docs(pattern-threshold-over-limit): change identity (autonomous run)`, `docs(pattern-threshold-over-limit): research` |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `preparing` (set by `metadata-guard.mjs mark-researched`) |
| `## Progress` rows remaining | n/a — no `plan.md` yet |
| Working tree | clean apart from the maintainer's ` M .gitignore` and `?? .claude/skills/10x-autonomous-run/` (never staged) |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `context/changes/pattern-threshold-over-limit/research.md` | Source-backed findings: PRD over-limit rules per kind + contradiction, month semantics, type-flip rule, migration/pgTAP pattern for `pattern_thresholds`, detail route/read + keyset paging, kit binding and copy gaps, unit-oracle cases, open questions, autonomous decisions |
| `context/changes/pattern-threshold-over-limit/change.md` | Frontmatter only: `status: new` → `preparing`, `updated` |
| `context/changes/pattern-threshold-over-limit/handoff.md` | This file |

## 3. Verification

Docs-only step; no code or schema touched. Baseline (agent contract, `main` `a6a8b18`, inherited, unverified here):
lint 0 · astro check 0 errors (93 files) · vitest 78/78 (5 files) · pgTAP 54 (3 files) · smoke 61 PASS.

| Command | Result |
| --- | --- |
| `git branch --show-current` | `feat/pattern-threshold-over-limit` |
| `node` over `test/fixtures/ing/expected.json` imported `rows[].occurredOn` | 12 months 2025-09…2026-08; none in 2026-09 (today) |
| `grep` pgTAP `plan(` in `supabase/tests/database/` | 28 + 16 + 10 = 54 (matches baseline) |
| `metadata-guard.mjs mark-researched` | `changed: true`, status `preparing` |
| Suites (lint, check, test, build, smoke, pgTAP) | not run — no code or schema change in this step |
| Live-DB experiment | none (not needed; see research `## Autonomous decisions`) |

## 4. Next command

`/10x-plan pattern-threshold-over-limit`

## 5. Open

- **Decisions for the plan** (research `## Open Questions`): (1) sum/fixed over amount — excess part (recommended)
  vs full amounts; (2) reference month — latest month in user data + `?month=YYYY-MM` select (recommended) vs
  wall-clock; (3) route `src/pages/patterns/[key].astro` vs `[...key]` vs `?key=` — `merchantKey`
  (`src/lib/patterns/merchant.ts` `merchantKey`) may hold spaces, diacritics, dots, possibly `/`; (4) `updated_at`
  (no trigger precedent) or none; (5) list „Próg” cell format for the sum kind (no kit string).
- **Type flip** (PRD silent): recommended keep-but-ignore a threshold whose `kind` mismatches the D5 type
  (`src/lib/patterns/derive.ts` `d5Type`).
- **Migration**: first mutable table — needs an UPDATE policy; do **not** copy `revoke update, maintain` from
  `20260924122144_transactions_import_account_fk.sql`. Upsert needs SELECT + INSERT + UPDATE policies. New pgTAP file,
  `npm run db:types`, `npx supabase db push` before merge (ship step).
- **Read**: detail must run the full read (`src/lib/patterns/load.ts` `loadPatterns`) and pick by key; widen select
  with `occurred_on`; raw description = counterparty/title (not `details`, which is the ING „Szczegóły” type); S-03 F2
  keyset paging in `collectPages` recommended in scope.
- **Kit/components**: `src/components/app/Badge.tsx` `Badge` lacks an `excess` tone; `src/components/ui/button.tsx`
  `buttonVariants` `text` exists (closes F5); no shared input-with-suffix, back link, sequence or select component;
  no toast (use redirect + `InlineAlert` `components.success`). ~20 rendered strings only in `app.js` → K11 rows in
  `copyExtra`; next free gap ids **K21, G31**. Prototype over-marks are hard-coded — not an oracle.
- **Follow-ups**: `context/archive/2026-09-25-undo-import/follow-ups/review-fixes.md` (F2 keyset, F5 `text`,
  invariant `merchantKey` + `user_id`); dialog geometry not triggered unless the plan adds a dialog.

## 6. Autonomous decisions

Recorded in full in `research.md` `## Autonomous decisions`. In short:

1. **Research scope derived from `change.md`**, no question asked. Would change: a maintainer narrowing scope.
2. **Over amount = excess part for sum/fixed** (recommendation, rejected full amounts). Why: Business Logic is the
   specific „nadwyżka” definition. Would change: maintainer declaring US-01 AC normative.
3. **„w tym miesiącu” = latest month in user data** (rejected wall-clock, per-pattern latest). Why: determinism
   guardrail, historical imports. Would change: product decision for the wall-clock month.
4. **Type flip = keep row, ignore mismatched kind** (rejected delete / convert). Would change: S-05 requiring reset.
5. **No live-DB experiment.** Would change: plan choosing a trigger or RPC.
6. **Next = `/10x-plan`** (research answers the grounding questions). Would change: a new blocking unknown.
