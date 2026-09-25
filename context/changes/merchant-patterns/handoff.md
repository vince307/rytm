# Handoff — `merchant-patterns` (slice S-03)

Written by the `plan` step (`/10x-plan merchant-patterns`). `plan.md` + `plan-brief.md` are written, `change.md`
moved `preparing → planned`, roadmap S-03 → `planning`; nothing is implemented. The one thing the next agent must not
get wrong: **the oracle is a partition, and the S-03 target is 31 groups** (T01 `sportowo.pl` / `SPORTOWO` stay
apart until S-05) — and the loader must page past `max_rows = 1000` by advancing on rows actually returned.

## 1. State

| Item | Value |
|---|---|
| Branch | `feat/merchant-patterns`, cut from `main` at `d11f3ef` |
| Commits | 4 on top of `d11f3ef` after this step (`d11f3ef..HEAD`): 2 × change identity, research, `docs(merchant-patterns): plan` |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `planned` (via `metadata-guard.mjs mark-planned`) |
| `## Progress` rows remaining | 20 of 20 (`grep -c '^- \[ \]' plan.md`) — 17 automated, 3 manual |
| Working tree | clean apart from the maintainer's `.gitignore` and `.claude/skills/10x-autonomous-run/` (never staged) |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/merchant-patterns/plan.md` | 3-phase plan: (1) `src/lib/patterns/merchant.ts` + `derive.ts` + Vitest oracle suite, (2) paged `load.ts` + `formatMoney`, (3) `/patterns` view (Badge, Glyph, `PatternsTable` island, copy, K17/G28, smoke +2, screenshot row); ends with `## Progress` |
| `context/changes/merchant-patterns/plan-brief.md` | Two-page brief with the Key Decisions table |
| `context/changes/merchant-patterns/change.md` | Frontmatter only: `status: planned`, `updated: 2026-09-25` |
| `context/foundation/roadmap.md` | S-03 status `proposed → planning` (At a glance row + body `Status`) |
| `context/changes/merchant-patterns/handoff.md` | This handoff |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/merchant-patterns` — observed before writing |
| `npm run lint` | 0 errors — observed on branch (baseline for Phase 1) |
| `npx astro check` | 0 errors / 0 warnings / 0 hints — observed |
| `npm run fixture:check` | OK — observed |
| `npx vitest run` | 32/32 tests, 3 files — observed |
| Scratch prototype of the planned rule set over `expected.json` `rawMerchant` (`$TMPDIR`, not committed) | 31 groups, 0 over-merges, 1 split = `sportowo` (intended) — observed; supports Phase 1 criterion "31 groups" |
| `node -e` pl-PL money format | `1500,00` / `12 345,67` (U+00A0) / `52,99` — observed; the plan's `formatMoney` examples come from this |
| Plan structure | 1 `## Progress`; Success Criteria bullets 7 / 4 / 9 = 20 Progress rows, one-to-one |
| `npm run build`, `npx supabase test db`, `npm run smoke` | not run — docs-only step, no code touched. Inherited, unverified here: build OK, pgTAP 44/44, smoke 46/46 (run baseline on `main`) |

## 4. Next command

`/10x-plan-review merchant-patterns`

## 5. Open

- Manual Progress rows (human checklist after the run):
  - [ ] 1.7 read `normalizeMerchant` (`src/lib/patterns/merchant.ts`) against the plan's rule list
  - [ ] 3.8 screenshots `lista`, `lista-mobile`, `wyszukiwanie`, `sortowanie-nazwa`, `pusty`, `brak-wyników` (Visual step; needs the main fixture CSV imported for `test@rytm.local` — seed has no transactions)
  - [ ] 3.9 fixture list: 31 rows, `KINOTEKA` `stały` 52,99 zł, `MINIMARKET PRZYSTANEK` 8×, two `sportowo` rows
- DESIGN-GAPs the implement step must register in `context/foundation/design-kit.md`: **K17** (no "Kwota" column/key
  in the kit; placeholder = median) and **G28** (Próg / Ponad progiem, row link + arrow, status badges, excluded
  section, "Pokaż więcej" omitted until S-04/S-05/S-06); K11 row gains the new `copyExtra.patterns` strings.
- Carried risks: real-statement grouping quality (roadmap Unknown, owner user); one-off debits become 1× `stały`
  patterns; changing `normalizeMerchant` after S-04/S-05 store rows by key re-keys merchants (those slices own the
  mapping); `błąd` state is code-reviewed only (no safe way to force a read error locally).
- S-04 / S-05 planning input: pattern identity = `merchantKey` string (`src/lib/patterns/merchant.ts`), no row id.

## 6. Autonomous decisions

- **Skipped the complexity/budget confirmation and every AskUserQuestion round**; decided each open choice from
  `research.md` § Open Questions myself. Why: no human in the loop (contract rule 1); research + change.md settled
  the facts, only design choices remained. Would change: a maintainer message reopening any row below.
- **Storage = derived on read, no migration** (rejected: `merchant_patterns` table as the roadmap Risk line
  suggests; SQL view/RPC). Why: no consumer needs pattern rows in S-03, `transactions` is immutable to the app role,
  S-02 undo cascades for free, and a pure TS module is testable against the oracle in Vitest. Would change: S-04/S-05
  planning showing they need a stable row id before a merchant key exists, or a requirement to query patterns from SQL.
- **Aggregation site = paged TS read** (rejected: SQL aggregation/`jsonb_agg` RPC + pgTAP; hybrid SQL-by-raw +
  TS-normalize — operator rows differ per transaction in `title`, so SQL grouping by raw fields would not shrink the
  set). Why: PRD `data_volume: small`, few 1000-row pages. Would change: real accounts above ~20k debits or a
  measured `/patterns` latency problem.
- **T01 not auto-merged → 31 groups** (rejected: strip TLDs and flip the generator's `resolvedBy` to
  `normalization`, 30 groups). Why: the oracle declares `user-merge` (S-05's demo), and TLD stripping risks silent
  over-merge on real data. Would change: maintainer preferring auto-merge, or S-05 dropping user merge.
- **"Kwota dla stałych" = median** (rejected: last amount by date — "latest" has no decided tie-break for same-day
  rows; mean). Why: order-independent, equals oracle `medianMinor`, D5 defines "stały" around the median. Would
  change: S-06 or the maintainer wanting the current price shown (then last amount with an explicit tie-break).
- **Display name = normalized string with bank casing, from the most frequent raw variant** (rejected: title-casing,
  raw key). Why: deterministic, no invented casing. Would change: kit/author delivering a naming rule.
- **Search/sort included as one React island** (rejected: omit until later; server-side `?q=&sort=` form — the kit
  filters live, without a submit button). Would change: a maintainer wanting S-03 without JS interactivity.
- **Omitted kit parts for later slices and registered them as G28 instead of placeholders** (Próg / Ponad progiem,
  row link to a detail that would 404, excluded section, "Pokaż więcej" that only toasts). Would change: S-04 landing
  first, or the author asking for placeholder columns.
- **Extract `Glyph` from `ImportWizard` into `src/components/Glyph.tsx`** (rejected: a second private copy). Why:
  accidental-architecture charge; `ImportWizard` behaviour unchanged. Would change: impl-review finding the
  refactor touches wizard behaviour.
- **No new pgTAP** (the task brief requires pgTAP only with a migration). Phase 3 still runs `supabase test db` as
  baseline + 0. Would change: any SQL object added during implementation.
- **Operator list = constant in `src/lib/patterns/merchant.ts`** (PRD Open Question 2; rejected: config/DB table).
  Would change: a real statement showing an unlisted operator often enough to need user-editable config.
- **Committed plan artifacts and the roadmap sync** although the 10x-plan skill says `/10x-plan` does not commit.
  Why: run contract requires each docs step to commit (`docs(<id>): plan`). Would change: contract change.
- **Plan written in English** like `research.md` and this handoff; UI strings stay Polish (kit copy). Would change:
  maintainer preference for Polish plans.
- **Next command = `/10x-plan-review`** per the run's fixed chain (new → research → plan → plan-review → implement).
