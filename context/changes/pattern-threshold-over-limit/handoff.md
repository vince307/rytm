# Handoff — `pattern-threshold-over-limit` (slice S-04)

Written by the `plan` step (2026-09-27, autonomous run `2026-09-27-s03-s02-s04`). `plan.md` (6 code phases, 56
Progress rows) and `plan-brief.md` are on disk; `change.md` is `planned`, roadmap S-04 is `planning`. The next agent
must not get this wrong: the plan **decides against PRD US-01 AC's literal text** (over amount = excess part for sum /
fixed kinds) and reads „w tym miesiącu” as the **latest month in the user's data**, not the wall clock — review those
two against PRD Business Logic „Wynik”, not against the prototype's hard-coded marks.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/pattern-threshold-over-limit`, cut from `main` at `a6a8b18` (confirmed with `git branch --show-current`) |
| Commits on branch | 3: change identity, research, `docs(pattern-threshold-over-limit): plan` (this step) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `planned` (`metadata-guard.mjs mark-planned`) |
| `## Progress` rows remaining | 56 (`grep -c '^- \[ \]' plan.md`); 0 done |
| Working tree | clean apart from the maintainer's ` M .gitignore` and `?? .claude/skills/10x-autonomous-run/` (never staged) |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `context/changes/pattern-threshold-over-limit/plan.md` | Full plan: current state, 6 phases (Intent / Contract, success criteria as baseline + delta, deliberate breaks with meta-checks), testing strategy, 23 autonomous decisions, known risks, `## Progress` |
| `context/changes/pattern-threshold-over-limit/plan-brief.md` | Two-page brief: key decisions table, phases at a glance, risks |
| `context/changes/pattern-threshold-over-limit/change.md` | Frontmatter `status: preparing` → `planned` |
| `context/foundation/roadmap.md` | S-04 status `proposed` → `planning` (At-a-glance row + body) |
| `context/changes/pattern-threshold-over-limit/handoff.md` | This file |

## 3. Verification

Docs-only step; no code or schema touched. Baseline (agent contract, `main` `a6a8b18`, inherited, unverified here):
lint 0 · astro check 0 errors (93 files) · vitest 78/78 (5 files) · pgTAP 54 (3 files) · smoke 61 PASS.

| Command | Result |
| --- | --- |
| `git branch --show-current` | `feat/pattern-threshold-over-limit` |
| `grep -c '^- \[ \]' plan.md` | 56 — each phase's Success Criteria bullets map 1:1 to its Progress rows (P1 7+2, P2 7+1, P3 6+1, P4 8+2, P5 8+2, P6 7+5) |
| `metadata-guard.mjs inspect` / `mark-planned` | change.md hash matched; `changed: true`, status `planned` |
| Source re-checks | `load.ts` `collectPages`/`loadPatterns`, `derive.ts`, `merchant.ts`, `types.ts`, `patterns.astro`, `PatternsTable.tsx`, `Badge.tsx`, `button.tsx`, `SubmitButton.tsx`, migrations, `smoke.mjs` steps, kit `app.js` `patternDetail`/`thresholdEditor`/`patternRows`, `content.json` keys, `styles.css` rules — read in this step |
| Suites (lint, check, test, build, smoke, pgTAP) | not run — no code or schema change in this step |

Planned gate end state: pgTAP 54 → 76 (+22, new file), smoke 61 → 76 (+15), vitest +3 files, lint / check 0.

## 4. Next command

`/10x-plan-review pattern-threshold-over-limit`

## 5. Open

- **Product calls to review** (plan `## Autonomous decisions` 1, 2): excess part vs US-01 AC; reference month = latest
  month in data. Both reversible in one module (`src/lib/patterns/over-limit.ts` `overLimit` / `referenceMonth`).
  Progress row 6.12 `[human]` asks the product owner to confirm.
- **Route risk**: `src/pages/patterns/[...key].astro` reads the key from `Astro.url.pathname` via `keyFromPath`
  (`src/lib/patterns/path.ts`); if the runtime pre-decodes, the Phase 4 deliberate break says so (record in handoff).
- **Migration**: `supabase/migrations/20260927200000_pattern_thresholds.sql` — first mutable table (UPDATE policy,
  no `revoke update`); Ship step runs `npx supabase db push` before merge.
- **Manual-only Progress rows** (human checklist):
  - [reviewer] 1.8 policies / FK shape; 1.9 pgTAP proof mapping; 2.8 oracle traceability; 3.7 keyset loop bounded, no count;
    4.9 copy byte-for-byte + G31-only placeholders; 4.10 `PatternsTable` unchanged but import; 5.9 endpoints mirror
    `api/imports/delete.ts`; 5.10 keyboard on the editor; 6.11 K21 / G31 register.
  - [visual] 6.8 screenshots desktop 1440 + ~400 px: `list-with-thresholds`, `detail-default`, `editor-count`,
    `editor-sum`, `editor-amount`, `over-limit-marked`, `no-threshold`, `empty-month`, `saved`, `removed`,
    `error-value`, `error-read`, `not-found`, `month-other`, `link-focus`; 6.9 ~400 px stacking / table scroll;
    6.10 dotted and spaced/diacritic keys open from the list.
  - [human] 6.12 product owner confirms decisions 1 and 2.
- **DESIGN-GAPs to add in code phases** (not yet in `context/foundation/design-kit.md`): **K21** (detail / editor / list
  strings only in `app.js`, month-baked `sumLabel`), **G31** (not-found, empty month, over-limit sum on the detail,
  validation / save errors, sum-kind field, mismatched kind, sequence colours, list month label); G28 / G2 status notes.
- **Follow-ups**: S-03 F2 keyset paging is **closed by Phase 3**; F5 `text` button variant **used by Phase 5**
  (`context/archive/2026-09-25-undo-import/follow-ups/review-fixes.md`). New follow-up candidate: move
  `src/pages/how-it-works.astro` `rClip` and `src/components/imports/ImportWizard.tsx` back link onto the new shared
  `SequenceMark` / `BackLink`.

## 6. Autonomous decisions

All 23 are in `plan.md` `## Autonomous decisions` (chosen, rejected, why, what would change the answer). The ones
that matter most:

1. **Excess part for sum / fixed, full amount for count — against PRD US-01 AC's literal text**, following Business
   Logic „Wynik”. Would change: product owner declaring US-01 AC normative.
2. **Reference month = latest month in the user's transactions** (departs from the literal „bieżący miesiąc”). Would
   change: regular monthly imports / product choice of the wall clock.
3. **Type flip: keep row, ignore mismatched kind.** Would change: S-05 user-pinned types needing a reset.
4. **Rest route + raw-path key decode.** Would change: a slug column.
5. **Keyset paging in scope, `count` dropped.** Would change: evidence of missed rows under `gt("id")`.
6. **Six small code phases, no deploy phase; gap rows land with the code.** Would change: a phase not independently
   green, or the orchestrator requiring gaps at plan time.
7. **Step-level**: no `AskUserQuestion` (contract rule 1) — the skill's complexity / budget / structure confirmations
   were decided here (complexity HIGH, 0 questions: research + contract settled every input). Would change: a
   maintainer message in the run folder.
