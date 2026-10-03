# Handoff — `kit-round-3-patterns` (slice S-14)

Written by the `/10x-research` step of autonomous run `2026-10-02-kit-round-3`. `research.md` answers every open
question from `change.md`. The slice is a copy rebind (56 `copyExtra.patterns` leaves: 25 identical, 18 stay, 13
need a decision) plus kit column order, „Pokaż więcej”, status badges, and a `try` on `/patterns`. There is no
migration. The one thing not to get wrong: apply „Pokaż więcej” **after** the client-side filter and sort, and keep
the count line on the whole filtered list. Never copy the kit's `showMorePatterns()`, which ignores search and sort.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/kit-round-3-patterns`, cut from `main` at `5ed97f4` |
| Commits | 2 on the branch after this step (`… change identity`, `docs(kit-round-3-patterns): research`) |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `preparing` (set by `metadata-guard.mjs mark-researched`) |
| `## Progress` rows remaining | n/a: no `plan.md` yet |
| Working tree | clean after the commit (`tree-clean.sh`) |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `context/changes/kit-round-3-patterns/research.md` | Research covering: §1 copy map (identical / stays / decide); §2 smoke + unit pins; §3 kit layout and behaviour (list, „Pokaż więcej”, badges, detail states, actions dialog); §4 copy decisions; §5 shared-component blast radius; §6 status badges + `/patterns` 500; Open Questions = plan choices |
| `context/changes/kit-round-3-patterns/change.md` | frontmatter only: `status: preparing`, `updated: 2026-10-03` |
| `context/changes/kit-round-3-patterns/handoff.md` | This file |

## 3. Verification

| Command | Result |
| --- | --- |
| `git branch --show-current` | `feat/kit-round-3-patterns` |
| `metadata-guard.mjs inspect` / `mark-researched` | `changed: true` |
| grep of `content.json` for the 11 „stays” literals (§1.2) | only „Scal wzorce” (`mergeTitle`) found |
| `src/styles/brand.css` `:root` | `--rytm-focus-ring` = ink/12, `--rytm-badge-soft` = excess/18 (exact) |
| `src/styles/global.css` | `--radius-lg` = 14px, so `field` `rounded-lg` ≠ 8px |
| Code suites (lint, astro check, vitest, build, pgTAP, smoke) | not run: research only, no code changed. Baseline inherited, unverified: `main` at `5ed97f4`, vitest 354, pgTAP 119, smoke 184 PASS |

## 4. Next command

`/10x-plan kit-round-3-patterns`

## 5. Open

- Plan choices (research.md § Open Questions):
  - the „Pokaż więcej” page size (≥ 4 so every smoke merchant renders) and collapse-on-search;
  - the actions dialog: in-place sections vs kit separate views (`PatternActionsDialog.tsx`);
  - the rename field (`defaultValue={name}` → kit placeholder / stored `displayName` only, follow-up F5);
  - the not-found layout (`ViewEmpty.astro` vs `Panel`);
  - the sequence a11y (`role="img"` aria-label vs the `sr-only` span in `[...key].astro`).
- New `design-kit.md` rows for the plan to add: K35 (`patternDetail.sequenceSummary` lacks plural forms; the app
  keeps a `copyExtra` template, §4.1), K36 (`threshold.invalid` omits the range/decimals rule of
  `parseThresholdValue`, §4.2). Narrow the G33 note: `patternActions.lead` read as the detail page (§4.3).
- Tests to update with the change: `test/unit/table-columns.test.ts` (dropped with `tableHeaders`) and
  `test/unit/kit-contract.test.ts` (the 7-columns test, and the `sumLabel` placeholder → `copy.patternDetail.sumLabel`).
- Shared blast radius:
  - `DialogContent` (3 dialogs, visual gate on all three);
  - `Badge` `new` tint (also `/fixed`);
  - `focusRing` export: keep ink/15 to stay at zero visual change site-wide (`buttonVariants`).
- Out of scope, carried: S-05 F6 (`validateMerge` excluded source), F7 (`unmerge` scoping); `fixed.astro` `try`
  (S-15).
- No `DESIGN-GAP` added in this step (research only).

## 6. Autonomous decisions

1. **`sequenceSummary`: keep plurals in `copyExtra`.** Rejected: the kit string („1 wystąpień”). Why: the JSON key is
   ungrammatical and the kit's own `app.js` pluralises; this follows the K29 precedent. What would change it: the
   maintainer accepting the kit string for screen-reader-only text, or round 4 adding forms.
2. **`threshold.invalid`: adopt the kit string; the validator is unchanged.** Rejected: keep the more precise
   `copyExtra` text. Why: the kit is the copy source, and PRD FR-010 is silent on the message. What would change
   it: user feedback that the message misleads on out-of-range input; then use the K36 answer.
3. **`patternActions.lead`: adopt it, with no `[human]` row.** Why: it is byte-identical to the current text, and
   the detail page hosting the dialog is the reversal surface. What would change it: a separate pattern-settings
   screen entering scope.
4. **Focus-ring consolidation keeps ink/15.** Rejected: unify on `--rytm-focus-ring` (.12). Why: the kit has no
   button or link focus rule, and a site-wide change is outside one-view scope. What would change it: the kit
   adding a `:focus-visible` rule.
5. **Status badges: one extra `fixedOverview` call on the same `loadPatternData` result.** No second read, so
   `change.md` decision 2 holds. What would change it: `fixedOverview` cost on large data showing in the build or
   smoke timing.
