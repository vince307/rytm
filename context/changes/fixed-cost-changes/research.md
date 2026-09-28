---
date: 2026-09-28T18:23:39+02:00
researcher: Claude (research step, autonomous run 2026-09-28-s05-s06-s07)
git_commit: 08463b6
branch: feat/fixed-cost-changes
repository: Rytm
topic: "S-06 fixed-cost-changes — change/new semantics, fixture adequacy, kit binding for /fixed"
tags: [research, patterns, fixed, fixture, design-kit, FR-012, US-04]
status: complete
last_updated: 2026-09-28
last_updated_by: Claude (research step)
---

# Research: S-06 `fixed-cost-changes`

**Date**: 2026-09-28T18:23:39+02:00 · **Git Commit**: 08463b6 · **Branch**: feat/fixed-cost-changes · **Repository**: Rytm

Anchors are `file` + symbol / heading (run rule: no line numbers).

## Research Question

Derived from `change.md` (no human in the loop): (1) which rule decides „zmieniła kwotę” and „nowy” for a fixed
pattern, including the edge cases the PRD is silent on (double charge, D5 flip on a large rise, lapsed pattern,
previous occurrence months back, single-month data); (2) how the F-02 fixture is made to show a price change in the
reference month and what that ripples into; (3) where the pure function lives and what it consumes; (4) which kit
parts bind `/fixed`, which copy exists, and which DESIGN-GAPs the plan must register.

## Summary

- **No schema work.** Everything is derivable from `loadPatternData` (`src/lib/patterns/load.ts`) → `patterns` +
  `rows`; thresholds play no part (roadmap S-06 risk „niezależne od progów”).
- **Rule (recommended, PRD-backed where the PRD speaks):** candidates = `MerchantPattern` with `type === "fixed"`
  and `!excluded`. Reference month R = `referenceMonth(rows)` (`src/lib/patterns/over-limit.ts`); comparison month
  P = calendar predecessor of R. **Changed** = pattern has ≥1 occurrence in R and its last occurrence (order
  `byOccurredThenId`) has a different amount than the occurrence immediately before it (any delta, sign kept).
  **New** = ≥1 occurrence in R and 0 in P (D6 literal). New wins over changed (disjoint sections). **Unchanged** =
  the rest with ≥1 occurrence in R. **Lapsed** (0 occurrences in R) = in no section (PRD silent → gap).
  **No comparison month** = no transaction of the user at all in P → „Nowe” section shows a message instead of
  rows; „Zmieniły kwotę” still computed (US-04 AC only constrains the new list).
- **Fixture:** no fixed pattern changes amount in R = 2026-08 today (table below). Recommended **option B**: T11
  `kinoteka` gets a second step 55,99 → 59,99 zł on 2026-08-17. Blast radius: `scripts/fixture-ing.mjs`
  (`TRAP_SERIES` T11 entry + `TRAPS.T11` label + comment), regenerated `test/fixtures/ing/*` (main CSV, `expected.json`,
  `README.md`), `test/unit/ing-parser.test.ts` sum `6497147` → `6497547` (two assertions), and the fixture note in
  `context/foundation/import-formats.md` („jedną podwyżką ~12%”). Kinoteka stays `fixed`, median stays 5299. Smoke
  and pgTAP do not read the fixture.
- **Two PRD contradictions/silences the plan must carry as decisions:** (i) FR-012 „niezależnie od tolerancji” vs
  `d5Type` — a rise beyond D5 tolerance turns the pattern `frequent` and it drops off `/fixed`; (ii) D5 makes every
  single-occurrence merchant `fixed`, so on real data every one-off merchant in R lands in „Nowe w tym miesiącu”.
  The fixture hides (ii) (its generator asserts T16 is the only pattern with `firstMonth` = last month).
- **Kit:** one bound view, `prototype/app.js` `fixedCosts()`; 4 `fixedCosts.*` keys + 2 badge keys exist; row copy
  („poprzednio”, „pierwsze wystąpienie ·”, „N pozycje”), decrease display, empty section, single-month message,
  no-fixed-pattern state and lapsed patterns are gaps (next free id **G34**).

## Detailed Findings

### 1. Requirements text (what binds, what is silent)

- `context/foundation/prd.md` FR-012: „Dla wzorców stałych aplikacja pokazuje, które zmieniły kwotę (każda zmiana
  względem ostatniego wystąpienia, niezależnie od tolerancji) i które są nowe względem poprzedniego okresu.” Note:
  previous period = previous calendar month (D6); tolerance D5.
- `prd.md` `### US-04` AC: every change vs last occurrence reported — also a decrease and an in-tolerance change;
  unchanged fixed pattern not on the change list; „Nowy” = no occurrence in the previous calendar month (D6); one
  month of data → new list empty with a message „nie ma poprzedniego miesiąca do porównania” (not „wszystko jest
  nowe”). Given clause: „import obejmujący co najmniej dwa pełne miesiące kalendarzowe”.
- `prd.md` `## Success Criteria` / Primary bullet 2: „które podrożały i które są nowe względem poprzedniego okresu”.
- `context/foundation/import-formats.md` D6: „Nowy wzorzec stały = ma wystąpienie w bieżącym miesiącu, nie miał w
  poprzednim.” D5: max(15% of median, 10 zł).
- `context/foundation/roadmap.md` `### S-06`: outcome as in `change.md`; Unknowns „—”; risk: fixture F-02 must
  contain a subscription rise and a new pattern „inaczej wynik jest nieweryfikowalny”.
- Maintainer binding (agent contract, Step 0): „w tym miesiącu” = latest month in the user's data.

PRD silences / contradictions, with the recommendation for the plan:

| Case | PRD | Recommendation | Why |
|---|---|---|---|
| (a) Double charge in R | silent | compare R's last occurrence with the occurrence directly before it, even if that is in R; row shows the last one | literal „względem ostatniego wystąpienia”; one row per pattern as in the kit |
| (b) Rise beyond D5 tolerance | **contradiction**: FR-012 „niezależnie od tolerancji” vs D5 typing in `d5Type` (`derive.ts`) — the pattern becomes `frequent` and leaves `/fixed` | accept for S-06 (type comes from `derivePatterns`, same as `/patterns`), mitigation = S-05 pin (`PatternDecision.pinnedType = "fixed"`); record as follow-up | re-typing only on `/fixed` would make the two views disagree on a pattern's type; US-04's own example (43 → 49 zł) is inside tolerance |
| (c) Lapsed fixed pattern (0 in R) | silent | in no section; register gap | kit „Bez zmian” lists current costs; putting `phu-przyklad` (last 2026-06) there would claim it was charged |
| (d) Previous occurrence months back | FR-012 measures change against the last occurrence at any distance; D6 measures „new” against P only → a pattern absent in P but present earlier is both | **new wins**, sections disjoint | D6 is the resolved PRD rule for „nowy”; kit shows a pattern once |
| (e) „Bez zmian” content | silent | fixed, not excluded, ≥1 occurrence in R, neither changed nor new | follows from (c) |
| Single month | AC covers the new list only | message when the user has **no transaction in P** (covers both one month of data and a gap month); change list still computed | a gap month would otherwise mark every fixed pattern in R „nowy” — exactly what the AC forbids |
| One-off merchants | D5: „one occurrence is `fixed`” (`d5Type` doc comment) → every single-occurrence merchant in R is a „new fixed pattern” | out of scope to change D5; record as product risk / follow-up (Trigger: product feedback or S-07) | changing D5 ripples into S-03/S-04/S-05 typing; fixture cannot show it |

### 2. Existing code the function builds on

- `loadPatternData` (`src/lib/patterns/load.ts`) returns `{ patterns, rows, thresholds, decisions }` or `{ error }`;
  `patterns` already have decisions applied (`derivePatterns`, `src/lib/patterns/derive.ts`): merge resolved to the
  root before grouping, `type = decision?.pinnedType ?? d5Type(amounts)`, `excluded`, `displayName`.
- `MerchantPattern` (`src/types.ts`) has `transactionIds` but no dates/amounts per occurrence; `PatternSource`
  (`src/types.ts`) carries `id`, `amountMinor` (positive grosze — `transactions.amount_minor > 0` check in
  `supabase/migrations/20260923165530_domain_imports_transactions.sql`), `occurredOn`. Joining `transactionIds` to
  `rows` by id is what `view.ts`'s private `patternTxs` / `indexById` already do.
- `referenceMonth`, `monthOf`, `byOccurredThenId` (`src/lib/patterns/over-limit.ts`) — `byOccurredThenId` compares
  ids numerically (BigInt), the same order `/patterns` detail uses.
- `src/lib/patterns/view.ts`: pure view-models (`listOverview`, `patternDetail`, `detailTarget`), tested in
  `test/unit/pattern-view.test.ts`. A new pure function (e.g. `fixedOverview(patterns, rows)`) belongs there or in a
  sibling module, tested with crafted rows the same way. It should be exported so S-07's `/home` stat card
  („Koszty stałe · N pozycje podrożały”) can reuse it.
- No code computes a per-occurrence delta or „new” today (checked: `src/lib/patterns/*`, `src/pages/*`).
- `src/pages/fixed.astro` renders `PageTitle` + `ViewEmpty` unconditionally. `src/pages/patterns.astro` shows the
  page shape to copy: `loadPatternData` error → `console.error` + `InlineAlert kind="error"` with
  `copy.components.error` (`DESIGN-GAP: K18`); no patterns → empty view.

### 3. Fixture (`scripts/fixture-ing.mjs` → `test/fixtures/ing/`)

Fixed patterns in `expected.json` (main file, imported rows; R = 2026-08, P = 2026-07):

| Pattern (trap) | Last two occurrences (grosze) | In R / in P | Outcome under the rule |
|---|---|---|---|
| `kawa-testowa.pl` (T04) | 07-02 3900, 08-02 3900 | 1 / 1 | unchanged |
| `kinoteka` (T11) | 07-17 5599, 08-17 5599 | 1 / 1 | unchanged (rise was 2026-03) |
| `muzykalnia` (T10) | 07-08 2499, 08-08 2499 | 1 / 1 | unchanged |
| `przelew-konto-osobiste` (T08) | 07-11 150000, 08-11 150000 | 1 / 1 | unchanged, but user-excluded in the T08 scenario → hidden when excluded |
| `silownia-ruch` (T16) | single, 08-05 12900 | 1 / 0 | **new** |
| `kurs-przyklad.pl` (T04) | 02-02, 03-02 19900 | 0 / 0 | lapsed |
| `phu-przyklad` (T19) | 02-24 7150, 06-02 6900 | 0 / 0 | lapsed (its change is in 2026-06) |

No fixed pattern appears in R and is absent in P while present earlier, so case (d) is not exercised by the fixture
(unit tests must cover it).

How T11 is built: `TRAP_SERIES` entry `traps: ["T11"]`, `monthly(17, [...Array(6).fill(4999), ...Array(6).fill(5599)])`,
`expectType: "fixed"`, label `TRAPS.T11` „Abonament z jedną podwyżką ~12%”. Amounts do not consume the seeded RNG
(`mulberry32(SEED)` in `generate()` feeds only `blik()` and `noiseSeries`); ids and dates depend on order/`seq`, not
amounts; the CSV has no running balance. So changing T11's amounts changes only those rows' amount fields, the main
CSV preamble `Suma obciążeń`, `expected.json` (`amountMinor` of those rows, `files[MAIN].imported.sumMinor`, the
kinoteka pattern's `sumMinor`/`medianMinor`) and `README.md`. Generation is byte-deterministic (`GENERATED_ON`
constant); CI's `fixture:check` fails on any drift, so regenerated files must be committed. Generator assertions:
`buildPatterns` checks `expectType` against D5; the D6 check (`newInLast` vs `t16`) uses `firstMonth` only —
unaffected.

| Option | Amounts | D5 | Sum delta | Test edits |
|---|---|---|---|---|
| A: move the rise to 2026-08 | 4999 × 11, 5599 × 1 | median 4999, tol 1000, max gap 600 → fixed | −3000 | `ing-parser.test.ts` 6497147 → 6494147 (×2); `patterns.test.ts` KINOTEKA `fixedAmountMinor` 5299 → 4999 |
| **B: second step in 2026-08** | 4999 × 6, 5599 × 5, 5999 × 1 | median 5299, tol 1000, max gap 700 → fixed | +400 | `ing-parser.test.ts` 6497147 → 6497547 (×2) |

Recommendation **B**: keeps the even-count median case (5299, asserted in `test/unit/patterns.test.ts`) and every
archived S-03/S-04 screenshot value (52,99 zł), and gives R a +4,00 zł in-tolerance change (the AC's „zmiana
mieszcząca się w tolerancji”). Cost: T11 label/comment and the `import-formats.md` fixture note („jedną podwyżką
~12%”) must say two rises. Not affected (checked): `scripts/smoke.mjs` (inline payloads only), `supabase/tests/database/*`,
`scripts/fixture-ing-check.mjs` (recomputes, no hardcoded T11 values), `test/unit/{format,over-limit,pattern-view,pattern-decisions}.test.ts`
(crafted data). Archive docs mention old sums — historical, not edited. A decrease is not in the fixture under either
option → crafted-row unit test (`phu-przyklad`'s 2026-06 decrease is outside R).

Smoke: builds its own payloads (`importPayload`, `importPayloadJune` in `scripts/smoke.mjs`), so a `/fixed` smoke
check needs its own two-month payload (e.g. a merchant at 43,00 then 49,00 zł) — per contract, assert the text with
the trigger and its absence without it.

### 4. Kit binding and copy

- `design/rytm-os/prototype/app.js` `fixedCosts()`: `.dash-title` (eyebrow „Koszty stałe”, h1 „Co zmieniło się
  samo?”, lead „Rytm porównuje miesiące kalendarzowe i pokazuje różnice.”) + three `section.fixed-section`, each
  `.section-label` (h2 + count) + `.fixed-list.panel` of `.fixed-row`:
  changed row = `.merchant-mark` + name + `small` „20.05.2026 · poprzednio 49,00 zł” + `.fixed-change`
  (`span` current amount, `b` „+6,00 zł”); new row = `small` „pierwsze wystąpienie · 15.05.2026”, amount +
  `badge('nowy','new')`; „Bez zmian” = `.panel.compact`, name + amount. The kit's count „3 pozycje” over 2 rendered
  rows is a kit inconsistency (use the real count).
- `prototype/styles.css`: `.fixed-section{margin:22px 0}`, `.section-label` (h2 17px, span 12px muted),
  `.fixed-list{padding:0 20px}`, `.fixed-row{min-height:70px; border-bottom line}`, `.fixed-row small` 11px muted,
  `.fixed-change{gap:14px}` with `b` amber-dark 13px, `.compact .fixed-row{min-height:55px}`; ≤560px:
  `.fixed-list{padding:0 14px}`, `.fixed-change` stacked column. Badges `.badge.new,.badge.changed` amber tint (K9).
- Copy present: `copy.fixedCosts.{title,changed,new,unchanged}`, `copy.components.{new,changed}`,
  `copy.emptyViews.fixed.*`, `copyExtra.fixed.{eyebrow,lead}` (`src/content/copy.ts`). Plural tuples exist
  (`patternForms`, `occurrenceForms`, …) but **no „pozycja” tuple**.
- Formatters (`src/lib/format.ts`): `plural`, `formatMoney` („52,99 zł”), `formatIsoDate` („20.05.2026”). **No signed
  delta formatter** („+6,00 zł” / decrease) — needs adding.
- Shared components: `PageTitle.astro`, `Panel.astro`, `InlineAlert.astro`, `ViewEmpty.astro`, `merchantMark`
  (`src/components/patterns/merchant-mark.ts`), `Badge.tsx` (tones `fixed|frequent|excess`; its header says
  „Further tones (`new` / `changed`) arrive with S-06”). The kit's `.badge.changed` colour (#EFE4D1 on amber-dark)
  has no Tailwind token — plan must map it to allowed names (`excess`/`excess-text` tint), as `brand.css` K9 does.
  Nothing in `src/` renders `.fixed-row` markup today.

DESIGN-GAPs to register (next free id **G34**, row format of `## Rejestr braków` in `context/foundation/design-kit.md`):
single-month / no-comparison-month message; empty section (data but nothing changed/new); account with transactions
but no fixed pattern; decrease display (sign + colour); K11-class row copy (counts with „pozycja/pozycje/pozycji”,
„poprzednio”, „pierwsze wystąpienie ·”) → `copyExtra.fixed.*`; lapsed fixed patterns not shown; read-error state
(reuse `/patterns` `InlineAlert` + K18). G28 (`/patterns` badges) remains open unless the plan folds it in.

## Code References

- `src/lib/patterns/load.ts` `loadPatternData` — single read; patterns + rows.
- `src/lib/patterns/derive.ts` `derivePatterns`, `d5Type`, `TOLERANCE`, `median` — typing, D5 flip.
- `src/lib/patterns/over-limit.ts` `referenceMonth`, `monthOf`, `byOccurredThenId`.
- `src/lib/patterns/view.ts` `listOverview`, `patternDetail` — pure view-model pattern to follow.
- `src/types.ts` `MerchantPattern`, `PatternSource`, `PatternDecision`.
- `src/pages/fixed.astro` (placeholder), `src/pages/patterns.astro` (error/empty shape).
- `scripts/fixture-ing.mjs` `TRAP_SERIES` (T11), `TRAPS.T11`, `buildPatterns` (`newInLast` D6 check).
- `test/unit/ing-parser.test.ts` (sum 6497147), `test/unit/patterns.test.ts` (KINOTEKA 5299).
- `design/rytm-os/prototype/app.js` `fixedCosts()`, `badge`; `prototype/styles.css` `.fixed-*`.
- `src/content/copy.ts` `copyExtra.fixed`; `src/lib/format.ts` `plural`, `formatMoney`, `formatIsoDate`.

## Architecture Insights

Patterns are derived on read, decisions applied inside `derivePatterns`; every view picks the same reference month
from the full read (`referenceMonth(rows)`), so `/fixed` and `/patterns` cannot disagree on „this month” or on a
pattern's type. The S-06 function should take `(patterns, rows)` and stay DB-free.

## Historical Context (from prior changes)

- S-04 (`context/archive/2026-09-27-pattern-threshold-over-limit/`) — reference month = latest month in data
  (decision 2), stale threshold after a D5 flip (decision 3): same flip mechanism as case (b).
- S-05 (`context/archive/2026-09-28-durable-pattern-decisions/`) — pinned type and exclusion applied before
  grouping; excluded patterns leave every monthly sum (follow-up naming S-07, binds S-06 too).
- Grep of `context/archive/*/follow-ups/review-fixes.md` for `S-06`/`/fixed`: no follow-up names this slice
  (inherited from the `new` step, not re-run).

## Related Research

- `context/archive/2026-09-28-durable-pattern-decisions/research.md`, `context/archive/2026-09-27-pattern-threshold-over-limit/research.md`.

## Open Questions

- Product: accept (b) D5 flip hiding a large rise, and one-off merchants as „new fixed” — recommended accepted with
  follow-ups; a maintainer could instead require typing on pre-R history.
- Kit author: decrease colour/sign, single-month message copy, lapsed-pattern section.
