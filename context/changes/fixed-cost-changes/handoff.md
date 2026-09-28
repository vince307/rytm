# Handoff — `fixed-cost-changes` (slice S-06)

Written by the `research` step (`/10x-research fixed-cost-changes`, autonomous run `2026-09-28-s05-s06-s07`).
`research.md` settles the change/new rule, the fixture fix and the kit gaps; no product code exists yet. The one thing
the next agent must not get wrong: **the fixture must be changed (option B: T11 `kinoteka` 55,99 → 59,99 zł on
2026-08-17) or „Zmieniły kwotę” is empty on real data** — and „nowy” wins over „zmienił kwotę”, sections disjoint.

## 1. State

| Item | Value |
|---|---|
| Branch | `feat/fixed-cost-changes`, cut from `main` at `3706508` |
| Commits | 2 on this branch after this step: `docs(fixed-cost-changes): change identity (autonomous run)`, `docs(fixed-cost-changes): research` |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `preparing` (set by `metadata-guard.mjs mark-researched`) |
| `## Progress` rows remaining | n/a — no `plan.md` yet |
| Working tree | clean after the commit (`.claude/skills/10x-autonomous-run/scripts/tree-clean.sh`) |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/fixed-cost-changes/research.md` | Research: PRD text + silences table with recommendations, rule for changed/new/unchanged/lapsed/no-comparison-month, fixture option table (A vs B, ripple), kit binding, gap list (next id G34) |
| `context/changes/fixed-cost-changes/change.md` | Frontmatter only: status `new` → `preparing`, `updated` 2026-09-28 |
| `context/changes/fixed-cost-changes/handoff.md` | This file |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/fixed-cost-changes` (observed) |
| `python3` over `test/fixtures/ing/expected.json` (imported rows, fixed patterns, R=2026-08, P=2026-07) | 7 fixed patterns; changed in R: none; new in R: `silownia-ruch` (T16); lapsed: `kurs-przyklad.pl`, `phu-przyklad` (observed) |
| D5 arithmetic for T11 options | A: median 4999, gap 600 ≤ 1000 → fixed, sum −3000; B: median 5299, gap 700 ≤ 1000 → fixed, sum +400 (computed) |
| `grep -c 6497147 test/unit/ing-parser.test.ts` | 2 (observed) |
| `grep` `scripts/smoke.mjs` for fixture use | none — inline payloads only (observed) |
| lint / astro check / tests / build / pgTAP / smoke | **not run** — docs-only step. Baseline on `main` `3706508` per agent contract (inherited, unverified): vitest 190, pgTAP 102, smoke 111 |

## 4. Next command

`/10x-plan fixed-cost-changes`

## 5. Open

- **Fixture change (plan phase 1 candidate):** `scripts/fixture-ing.mjs` `TRAP_SERIES` T11 entry →
  `4999×6, 5599×5, 5999×1`; update `TRAPS.T11` label + comment; `npm run fixture:ing`; commit regenerated
  `test/fixtures/ing/*`; `test/unit/ing-parser.test.ts` sum `6497147` → `6497547` (2 assertions);
  `context/foundation/import-formats.md` fixture note „jedną podwyżką ~12%”. `test/unit/patterns.test.ts` KINOTEKA
  5299 unchanged under B.
- **Pure function:** `(patterns, rows)` → sections, in `src/lib/patterns/view.ts` (next to `listOverview`) or a
  sibling; exported for S-07 `/home` stat card; unit tests on crafted rows for decrease, in-tolerance change, double
  charge in R, absent-in-P-present-earlier (new wins), no transactions in P (message), excluded, pinned type.
- **Carried product risks (record as follow-ups in the plan):** D5 flip hides an out-of-tolerance rise from `/fixed`
  (`d5Type`, FR-012 „niezależnie od tolerancji” contradiction; mitigation S-05 pin); every one-off merchant is
  `fixed` by D5 and would list as „nowy” on real data.
- **DESIGN-GAPs to register from G34** in `context/foundation/design-kit.md`: no-comparison-month message, empty
  section, data-but-no-fixed-pattern, decrease display, K11 row copy (`copyExtra.fixed.*`, new „pozycja” plural
  tuple, signed-delta formatter in `src/lib/format.ts`), lapsed patterns hidden, read error (`InlineAlert` + K18).
- **Badge tones** `new`/`changed` (`src/components/app/Badge.tsx` header names S-06) — no Tailwind token for kit
  `#EFE4D1`; map to allowed names. G28 `/patterns` badges still deferred.
- **Smoke for `/fixed`** needs its own two-month inline payload in `scripts/smoke.mjs`.

## 6. Autonomous decisions

- **Scope derived from `change.md`** instead of asking (rule 1). Would change: a maintainer question list.
- **Fixture option B over A.** Chosen: second step 5599 → 5999 in 2026-08. Rejected A (move the rise): changes the
  asserted median 5299 → 4999 and the displayed „Kwota” in archived screenshots; rejected crafted-rows-only: roadmap
  risk says unverifiable. Why: one test edit, even-count median case kept, gives an in-tolerance change in R. Would
  change: the maintainer wanting the fixture's R change to mirror the PRD's ~12% example (then A).
- **Double charge → last vs immediately previous occurrence (may be in R).** Rejected: last-in-R vs last-before-R.
  Why: literal FR-012 „względem ostatniego wystąpienia”. Would change: kit author showing a double-charge state.
- **New wins over changed; lapsed shown nowhere.** Why: D6 is the resolved rule for „nowy”; kit shows each pattern
  once; „Bez zmian” implies charged this month. Would change: kit adding a lapsed section or a combined row.
- **No-comparison-month = no user transaction in P** (not „only one month of data”). Why: a gap month would
  otherwise make everything „nowy”, which the AC forbids. Would change: PRD stating the literal one-month rule only.
- **Accept D5 flip and one-off-as-fixed for S-06, as follow-ups.** Rejected: typing on pre-R history on `/fixed`
  only. Why: `/fixed` and `/patterns` must agree on type; D5 change ripples into S-03–S-05. Would change: maintainer
  product feedback.
