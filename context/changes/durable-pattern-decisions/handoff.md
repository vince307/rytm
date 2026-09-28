# Handoff — `durable-pattern-decisions` (slice S-05)

Written by the `plan-review` step (2026-09-28, autonomous run `2026-09-28-s05-s06-s07`). Verdict PROCEED; plan.md
patched in place (2 CRITICAL, 1 WARNING fixed); `change.md` is `plan_reviewed`. No product code yet. What the next
agent must not get wrong: `InlineAlert` result lines are asserted in smoke as **bare text** (its slot renders
`<span> text </span>`), never `>text<`; and Phase 2 must also add `excluded: pattern.excluded` to the hand-built
`PatternListItem` literal in `src/pages/patterns.astro` or `astro check` goes red.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/durable-pattern-decisions`, cut from `main` at `f252112` (confirmed with `git branch --show-current`) |
| Commits on branch | 4 — change identity, research, plan, `docs(durable-pattern-decisions): plan review` (this step) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` |
| `## Progress` rows remaining | 65 (`grep -c '^- \[ \]' plan.md`), unchanged by the review: 52 automated, 8 `[reviewer]`, 4 `[visual]`, 1 `[human]` |
| Working tree | Clean after the commit |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `context/changes/durable-pattern-decisions/reviews/plan-review.md` | Plan review: 6 findings (2 CRITICAL, 1 WARNING, 3 OBSERVATION), grounding, PRD check, `VERDICT: PROCEED` |
| `context/changes/durable-pattern-decisions/plan.md` | Patched: Phase 2 §5 (page literal), Phase 4 smoke step 3 (explicit key), Phase 6 §1 (dialog `copy` prop scope) + §5 (bare-text result line + negative control), Phase 7 §3 (S-01 F9 closed) + §5 (bare-text restore line + negative control, inline-text rule), Known risks (+2) |
| `context/changes/durable-pattern-decisions/change.md` | `status: planned → plan_reviewed` |
| `context/changes/durable-pattern-decisions/handoff.md` | This file |

## 3. Verification

Docs-only step; no suites run (nothing executable changed). Baseline on `main` `f252112` per the agent contract
(inherited, unverified): lint 0 · astro check 0 (109 files) · vitest 141 (8 files) · pgTAP 76 (4 files) · smoke 77.

| Command / check | Result |
| --- | --- |
| `git branch --show-current` | `feat/durable-pattern-decisions` |
| Grounding (paths, symbols, importers of `loadPatterns` / `loadThresholds` / `listOverview`, `MerchantPattern` literals, `DialogContent` consumers) | all present; blast radius = the two pattern pages + `test/unit/pattern-view.test.ts` literals + `patterns.astro` `PatternListItem` literal (F2) |
| `InlineAlert.astro` compiled output (sub-agent, `@astrojs/compiler`, compact) | `<span> text </span>` → `>text<` never matches (F1) |
| Smoke arithmetic vs `derive.ts` `d5Type` / `view.ts` `patternDetail` (reference month) | 58,49 · częsty · 5,50 · 59,99 · 7,00 · merged-name tie „Kawiarnia smoke” — all consistent |
| Progress↔Phase | 7/7 phases, 65 rows, 1:1; no checkbox in phase blocks |

## 4. Next command

`/10x-implement durable-pattern-decisions phase 1`

## 5. Open

- Manual Progress rows (post-implement checklist): `[reviewer]` 1.9, 1.10, 2.9, 3.8, 4.9, 6.8, 6.9, 7.8;
  `[visual]` 5.8, 5.9, 7.10, 7.11; `[human]` 7.9 — product owner confirms plan decision 9 („nie wchodzi do sumy
  miesięcznej” = excluded from every „ponad próg” sum and from any S-07 monthly total).
- Gap ids reserved for implement: K22, G33; G4 / G24 / G28 rows updated in Phases 5–7 (`context/foundation/design-kit.md`).
- Follow-ups the plan closes: S-04 F5 (`thresholds.ts` `loadThresholds`), S-04 F7 (`view.ts` `listOverview`), S-04 F8 +
  undo-import F4 (`usePageShowReset`), G24 (`dialog.tsx` `DialogContent`), S-01 F9 (already met — recorded only).
  Left open, re-queued in Phase 7's `follow-ups/review-fixes.md`: S-04 F4, F11 (trigger fired, deferral accepted —
  review F5), `DeleteAccountDialog` bfcache, S-07 „monthly sums must skip `pattern.excluded`”.
- Carried risks (plan `## Known risks`): normalizer drift (`merchant.ts` `normalizeMerchant`); Phase 3 break 3.7
  unguarded until Phase 4's 4.7; smoke text-anchor rule.

## 6. Autonomous decisions

- **Triage without a human** (agent contract rule 1): CRITICAL F1 / F2 and WARNING F3 fixed in plan.md; OBSERVATIONS
  F4 / F5 accepted, F6 recorded. Rejected: leaving F1 to implement (Phase 6 / 7 smoke would be red on correct code).
  Would change: `InlineAlert` rendering its slot inline (then `>text<` works and the negative controls are redundant).
- **F1 fix shape: bare text + negative control** rather than changing `InlineAlert` markup. Why: a shared component
  change is cross-view for a smoke convenience; existing InlineAlert steps already use bare text. Would change: a
  later slice normalising `InlineAlert` whitespace.
- **F5: F11 deferral accepted.** Why: the app-wide field-radius token touches views outside this slice (one view +
  global tokens); new fields use kit 8 px locally as S-04 did. Would change: the maintainer asking for the sweep now.
- **No product decision overturned**; decision 6 (type toggle, no automatic) and decision 9 (`[human]` 7.9) checked
  against FR-009 / US-03 and kept. Would change: the product owner reading „zmienić typ” as including „automatycznie”.
