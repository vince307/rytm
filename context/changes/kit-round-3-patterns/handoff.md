# Handoff — `kit-round-3-patterns` (slice S-14)

Written by the `/10x-new` step of autonomous run `2026-10-02-kit-round-3`. The change folder exists with
`change.md` (identity, roadmap-vs-repo corrections, kit binding, triggered follow-ups, decisions); no research or
plan yet. The one thing not to get wrong: most S-14 "outcomes" already exist as `copyExtra` placeholders (S-04/S-05) —
this slice is a rebind to round-3 keys plus „Pokaż więcej”, kit column order, status badges and shared-style fixes,
with **no migration** (rename limit stays 100, K31).

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/kit-round-3-patterns`, cut from `main` at `5ed97f4` |
| Commits | 1 on the branch after this step (`docs(kit-round-3-patterns): change identity (autonomous run)`) |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `new` |
| `## Progress` rows remaining | n/a — no `plan.md` yet |
| Working tree | clean after the commit (`tree-clean.sh`) |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `context/changes/kit-round-3-patterns/change.md` | Identity; `## Roadmap claims vs repo now` (claim / repo now / correction); `## Kit binding` (9 kit views, content.json keys); `## Follow-ups triggered` (in/out of scope); `## Autonomous decisions` |
| `context/changes/kit-round-3-patterns/handoff.md` | This file |

## 3. Verification

| Command | Result |
| --- | --- |
| `git branch --show-current` | `feat/kit-round-3-patterns` |
| `ls context/changes context/archive` | no existing `kit-round-3-patterns` — id unique |
| `grep -n "Trigger:" context/archive/*/follow-ups/review-fixes.md` | read; triggered items tabulated in `change.md` |
| Code suites (lint, astro check, vitest, build, pgTAP, smoke) | not run — docs-only step, no code changed. Baseline (inherited, unverified): `main` at `5ed97f4`, vitest 354, pgTAP 119, smoke 184 PASS |

## 4. Next command

`/10x-research kit-round-3-patterns`

## 5. Open

- Research must produce the key-by-key map `copyExtra.patterns` → `content.json` (`patterns`, `patternDetail`,
  `threshold`, `patternActions`, `components.new/changed`) against `src/content/copy.ts` as it is now, and list the
  smoke strings in `scripts/smoke.mjs` that pin pattern copy.
- Open copy decisions for research/plan: `patternDetail.sequenceSummary` lacks plural forms; `threshold.invalid`
  drops the decimals hint; `patternActions.lead` refers to non-existent „ustawienia wzorca” (G33); no kit key for
  the „Scalenie cofnięte.” toast; `thresholdSum`; `overInMonth` (G31).
- „Pokaż więcej” page size — kit `patterns()` uses `slice(0,3)` on demo data; plan decides; must not change sort,
  search or the count line (roadmap Risk).
- Shared touches with a cross-view blast radius: `src/components/ui/dialog.tsx` `DialogContent` (S-12 F2 — also
  `DeleteImportDialog`, `DeleteAccountDialog`); focus-ring export in `src/components/app/field-styles.ts` reaching
  `src/components/ui/button.tsx` `buttonVariants` and `src/components/app/BackLink.astro` (S-04 F3).
- Follow-ups carried, out of scope: S-05 F6 (`validateMerge` excluded source), S-05 F7 (`unmerge` scoping) —
  `context/archive/2026-09-28-durable-pattern-decisions/follow-ups/review-fixes.md`.
- No `DESIGN-GAP` added in this step.

## 6. Autonomous decisions

See `change.md` `## Autonomous decisions` (6 entries). Summary: research before plan (rebind breadth + shared
components; changes if a current map existed); status badges in scope (changes if `fixedOverview` needs a second
read on `/patterns`); rename limit 100, no migration (changes if round 4 picks 60 — then its own expand/contract
change); shared dialog padding in scope with all-dialog screenshots (changes on an unfixable regression elsewhere);
S-05 F6/F7 out (rule changes; changes on a reproduced wrong outcome); `patternActions.lead` left to research.
