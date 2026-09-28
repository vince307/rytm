# Handoff — `durable-pattern-decisions` (slice S-05)

Written by the `plan` step (2026-09-28, autonomous run `2026-09-28-s05-s06-s07`). `plan.md` (7 code phases, 65
Progress rows, all open) and `plan-brief.md` are on disk; `change.md` is `planned`, roadmap S-05 is `planning`. No
product code yet. What the next agent must not get wrong: decisions are applied **inside `derivePatterns`, before
grouping**, only the **root's** decision applies, and every decision write is a **single-column** upsert (never a full
decision object) — smoke „rename keeps the exclusion” is the guard.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/durable-pattern-decisions`, cut from `main` at `f252112` (confirmed with `git branch --show-current`) |
| Commits on branch | 3 — change identity, research, `docs(durable-pattern-decisions): plan` (this step) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `planned` (`metadata-guard.mjs mark-planned`) |
| `## Progress` rows remaining | 65 (`grep -c '^- \[ \]' plan.md`): 52 automated, 8 `[reviewer]`, 4 `[visual]`, 1 `[human]` |
| Working tree | Clean after the commit |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `context/changes/durable-pattern-decisions/plan.md` | Implementation plan: 7 phases, Critical Implementation Details, 23 Autonomous decisions, Known risks, `## Progress` |
| `context/changes/durable-pattern-decisions/plan-brief.md` | Two-page brief (decisions table, phases at a glance) |
| `context/changes/durable-pattern-decisions/change.md` | Frontmatter `status: preparing → planned` |
| `context/foundation/roadmap.md` | S-05 status `proposed → planning` (table + body), frontmatter `updated` |
| `context/changes/durable-pattern-decisions/handoff.md` | This file |

## 3. Verification

Docs-only step; no suites run (nothing executable changed). Baseline on `main` `f252112` per the agent contract
(inherited, unverified): lint 0 · astro check 0 (109 files) · vitest 141 (8 files) · pgTAP 76 (4 files) · smoke 77.

| Command | Result |
| --- | --- |
| `git branch --show-current` | `feat/durable-pattern-decisions` |
| Python check: Success Criteria bullets per phase vs `## Progress` rows | 1:1 for all 7 phases (auto/manual: 8/2, 8/1, 7/1, 8/1, 7/2, 7/2, 7/4) |
| `metadata-guard.mjs inspect` → `mark-planned --expected-sha256 e855e529…` | `{"changed":true}`; `change.md` `status: planned` |
| Code anchors read for the plan | `derive.ts`, `load.ts`, `thresholds.ts`, `view.ts`, `path.ts`, `threshold-form.ts`, `api/patterns/threshold{,/delete}.ts`, both pattern pages, `PatternsTable.tsx`, `dialog.tsx`, `Badge.tsx`, `DeleteImportDialog.tsx`, `Glyph.tsx` / `ICON_NAMES`, `scripts/smoke.mjs` runner, `pattern_thresholds` migration, kit `app.js` (`modal`, `patternDetail`, `patterns`, `applyPatternState`, `restorePattern`), `content.json` `patternActions`, `design-kit.md` G4 / G24 / G28 / K21 / G31–G32 |

Target deltas the plan sets: pgTAP 76 → 102 (+26, 5 files); smoke 77 → 111 (+34: P4 +26, P6 +5, P7 +3); vitest 141
+ new cases, 8 → 11 files; astro check 0 errors (count recorded per phase).

## 4. Next command

`/10x-plan-review durable-pattern-decisions`

## 5. Open

- Manual Progress rows (post-implement checklist): `[reviewer]` 1.9, 1.10, 2.9, 3.8, 4.9, 6.8, 6.9, 7.8;
  `[visual]` 5.8 (`/settings` + `/imports` dialogs after the shared geometry fix), 5.9 (bfcache), 7.10 (20 named
  states, desktop + ~400 px), 7.11 (fixture US-03 walk-through); `[human]` 7.9 — product owner confirms decision 9
  („nie wchodzi do sumy miesięcznej” = excluded from every „ponad próg” sum and from any S-07 monthly total).
- Gap ids reserved for implement: **K22** (app.js-only dialog/toast strings), **G33** (FR-009 flows the kit does not
  define); **G4** status to amend, **G24** / **G28** rows updated in Phases 5 / 7.
- Follow-ups the plan closes: S-04 F5 (`src/lib/patterns/thresholds.ts` `loadThresholds` paging, Phase 3), S-04 impl-review
  F7 (`src/lib/patterns/view.ts` `listOverview`, Phase 3), S-04 F8 + undo-import F4 (`usePageShowReset`, Phase 5),
  G24 dialog geometry (`src/components/ui/dialog.tsx` `DialogContent`, Phase 5). Left open (recorded in Phase 7's
  `follow-ups/review-fixes.md`): S-04 F4 (threshold endpoints), F11 (field radius), `DeleteAccountDialog` bfcache,
  and a new one for S-07 („monthly sums must skip `pattern.excluded`”).
- Risk for the plan review to weigh: Phase 3's deliberate break 3.7 (empty decisions into `derivePatterns`) is
  knowingly uncaught until Phase 4 smoke; Phase 4 step list relies on `>text<` anchors being unambiguous
  (`>7,00 zł<` vs `>47,00 zł<`) — verified by reasoning, not run.
- Known risk carried: normalizer drift (`src/lib/patterns/merchant.ts` `normalizeMerchant`) orphans thresholds,
  decisions and `merged_into` values.

## 6. Autonomous decisions

The plan's `## Autonomous decisions` (1–23) holds the product/design choices; the ones worth a second look:

- **Merge direction** (plan decision 2): the pattern on whose detail „Scal z…” runs is absorbed; the target survives.
  Rejected: the current pattern surviving. Why: target key keeps routes/threshold and matches the oracle
  `sportowo.pl → sportowo`. Would change: usability feedback that users expect to stay on the current pattern.
- **Merge undo built now** (decision 10, G33 placeholder „Cofnij scalenie”), not deferred. Why: a mistaken merge
  otherwise hides a merchant irrecoverably. Would change: the kit delivering „ustawienia wzorca”.
- **Merge is the only write that reads** (decision 3), departing from S-04 decision 7. Would change: merge read cost.
- **Excluded pattern keeps its threshold visible** (decision 8). Would change: review finding it confusing.
- **Shared `DialogContent` fix in its own phase** (decision 13) with `/settings` + `/imports` re-screenshots. Would
  change: the maintainer refusing cross-view changes (drop the geometry part, G24 stays open).
- **Plan step-level decisions:** no question budget / AskUserQuestion (agent contract rule 1) — every open choice from
  research `## Open Questions` 1–6 decided in the plan; skill's "do not commit" overridden by the contract (docs
  steps commit their artifacts), so `roadmap.md` is committed here rather than with Phase 1. Would change: an
  orchestrator instruction to leave the roadmap edit for implement.
- **No decision against the PRD's literal text** (decision 23); the single `[human]` row covers the ambiguous
  „suma miesięczna”. Would change: plan review reading FR-009 „zmienić typ” as requiring an automatic-type option.
