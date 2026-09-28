# Handoff — `fixed-cost-changes` (slice S-06)

Written by the `new` step (`/10x-new fixed-cost-changes`, autonomous run `2026-09-28-s05-s06-s07`). The slice has
its identity file with roadmap corrections, kit binding and follow-up triage; nothing else exists yet. The one thing
the next agent must not get wrong: **the F-02 fixture has no fixed-cost price change in the reference month
(2026-08)** — T11 `kinoteka` rose on 2026-03-17 — so „Zmieniły kwotę” is empty on the fixture as it stands; research
must settle how US-04's headline case is proved (lean: move T11's rise into 2026-08).

## 1. State

| Item | Value |
|---|---|
| Branch | `feat/fixed-cost-changes`, cut from `main` at `3706508` |
| Commits | 1 on this branch after this step: `docs(fixed-cost-changes): change identity (autonomous run)` |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `new` |
| `## Progress` rows remaining | n/a — no `plan.md` yet |
| Working tree | clean after the commit (`.claude/skills/10x-autonomous-run/scripts/tree-clean.sh`) |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/fixed-cost-changes/change.md` | Change identity: PRD refs (US-04, FR-012, success criterion 2, D5/D6), roadmap-claim-vs-repo table, migration verdict (none), kit binding (`fixedCosts()` view, `fixedCosts.*` / `components.new|changed` keys), candidate DESIGN-GAPs, follow-up triage, `## Autonomous decisions` |
| `context/changes/fixed-cost-changes/handoff.md` | This file |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/fixed-cost-changes` (observed) |
| Fixture analysis: `python3` over `test/fixtures/ing/expected.json` rows, main account, fixed patterns | 7 fixed patterns; T16 `silownia-ruch` single occurrence 2026-08-05 (new ✓); T11 `kinoteka` 49,99 × 6 (2025-09…2026-02) then 55,99 × 6 (2026-03…2026-08) — last two occurrences equal; only last-vs-previous change is `phu-przyklad` (T19) on 2026-06-02, outside 2026-08; `przelew-konto-osobiste` (T08) fixed but `user-exclude` |
| `grep` of `context/archive/*/follow-ups/review-fixes.md` for `S-06`/`fixed-cost`/`/fixed` | no match |
| lint / astro check / tests / build / pgTAP / smoke | **not run** — docs-only step, no code changed. Baseline on `main` `3706508` per agent contract (inherited, unverified): vitest 190, pgTAP 102, smoke 111 |

## 4. Next command

`/10x-research fixed-cost-changes`

## 5. Open

- **Fixture adequacy (roadmap risk, half-realised):** `scripts/fixture-ing.mjs` T11 (`kinoteka`) rise is in 2026-03;
  research decides whether to move/add it into 2026-08 (ripple: `test/fixtures/ing/expected.json`, hardcoded sum
  `6497147` in `test/unit/ing-parser.test.ts`, the generator's D6 assertion near `newInLast`, smoke) and keep it inside
  D5 tolerance so the pattern stays `fixed`.
- **Semantics to settle in research/plan:** double charge in the reference month; a rise beyond D5 tolerance flips
  `d5Type` to `frequent` and removes the pattern from `/fixed`; fixed patterns absent from the reference month
  (`kurs-przyklad.pl`, `phu-przyklad`); excluded patterns (`MerchantPattern.excluded`) filtered from every section;
  pinned type (`PatternDecision.pinnedType`) respected via `derivePatterns`.
- **Candidate DESIGN-GAPs (not yet registered in `context/foundation/design-kit.md`, next id after G33):** single-month
  state, empty section, data-but-no-fixed-pattern, price decrease display, K11-class row copy (plurals, „poprzednio”,
  „pierwsze wystąpienie”), lapsed fixed pattern, read error state, row link to detail.
- **G28 `/patterns` status badges** (`src/components/patterns/PatternsTable.tsx` header `DESIGN-GAP: G28`) deferred —
  see `change.md` Autonomous decisions.
- No review-fixes follow-up names S-06; F11 / F3 conditional triggers not fired unless the plan adds a form field or
  interactive rows.

## 6. Autonomous decisions

Recorded in full in `context/changes/fixed-cost-changes/change.md` `## Autonomous decisions`. Summary:

- Did not stop after `change.md` (no human in the loop). Would change: a maintainer pause.
- Next = `/10x-research`, not `/10x-plan`: fixture gap + unsettled semantics. Would change: research already on disk.
- Migration = none (derived on read). Would change: a requirement to persist a „seen”/snapshot state.
- „Ten miesiąc” = `referenceMonth(rows)` (maintainer binding 2026-09-28); comparison = its calendar predecessor.
  Would change: the maintainer revising the binding.
- Fixture lean = move T11's rise into 2026-08 + crafted-row unit tests; rejected units-only and a second import file.
  Would change: research showing the ripple breaks S-03/S-04/S-05 oracles broadly.
- `/patterns` G28 badges deferred (one view). Would change: plan showing a one-prop addition and `/patterns` being
  re-screenshotted anyway.
- DESIGN-GAPs listed, not registered until the plan fixes what renders. Would change: contract requiring rows at `new`.
