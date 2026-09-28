<!-- PLAN-REVIEW-REPORT -->
# Plan Review: Zmiany kwot i nowe wzorce stałe (S-06 `fixed-cost-changes`)

- **Plan**: `context/changes/fixed-cost-changes/plan.md`
- **Mode**: Deep (verification done directly against the code by the review step; no sub-agent)
- **Date**: 2026-09-28
- **Verdict**: SOUND (after the two fixes applied below)
- **Findings**: 0 critical · 2 warnings · 4 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| End-State Alignment | PASS |
| Lean Execution | PASS |
| Architectural Fitness | PASS |
| Blind Spots | WARNING (F1) |
| Plan Completeness | WARNING (F2) |

## Grounding

Grounding: 7/7 paths ✓ (`src/pages/fixed.astro`, `src/lib/patterns/{view,over-limit,load}.ts`, `src/lib/format.ts`,
`src/components/app/Badge.tsx`, `scripts/fixture-ing.mjs`, `scripts/smoke.mjs`), 9/9 symbols ✓ (`referenceMonth`,
`monthOf`, `byOccurredThenId` exported; `patternTxs` / `indexById` private in `view.ts` as stated; `formatMoney` plain
space before „zł”; `d5Type`; `PROTECTED_ROUTES` has `/fixed`; kit `content.json` `fixedCosts.{title,changed,new,unchanged}`,
`emptyViews.fixed.title`, `components.new` = „nowy”), brief↔plan ✓. Progress↔Phase 1:1 (P1 7+1, P2 8+1, P3 8+1, P4
8+4), one `## Progress` at the end, no checkboxes in phase blocks ✓. No `docs/reference/contract-surfaces.md`, no
`context/foundation/lessons.md`.

### Claims verified against the code

- **Decision 17 (smoke reuses the smoke user's state), read from `scripts/smoke.mjs` `steps` and payloads — holds.**
  After „home renders empty state for signed-in user”: no import → `referenceMonth` null → pre-import view. After
  „patterns list the re-imported merchant”: May only (`importPayload`: Sklep 1299 05-04, Kawiarnia 4550 05-20), both
  single-occurrence → D5 `fixed`, no P rows → no comparison, both „Bez zmian”, changed empty. After „later import
  keeps the exclusion”: Sklep merged into Kawiarnia (pinned `fixed`, renamed „Kawiarnia Rytm”, excluded) + June
  (`importPayloadJune`) → only Piekarnia (800, 06-10, one occurrence → fixed, none in May) is listed, as new. After
  „unmerged pattern has its own detail again” (restore + unmerge; rename and pin stay on key `kawiarnia smoke`):
  R 2026-06, P 2026-05 — Kawiarnia Rytm 4550 → 4700 = `+1,50 zł`, meta „20.06.2026 · poprzednio 45,50 zł”; Sklep
  1299/1299 unchanged; Piekarnia new, „pierwsze wystąpienie · 10.06.2026”. Deliberate break 4.7 also holds: with
  `!excluded` dropped the merged Kawiarnia (06-20 4700 vs predecessor 06-04 1299) lands in „Zmieniły kwotę” and
  `>Kawiarnia Rytm<` appears.
- **Fixture arithmetic — holds.** `expected.json` main-file imported rows: 206, Σ 6 497 147 (recomputed); the
  kinoteka 2026-08-17 row (5599) is imported and lives only in `Lista_transakcji_nr_0000123456_010926.csv` (no other
  fixture CSV has kinoteka) → +400 → **6 497 547**. CSV preamble „Suma obciążeń (210): 67193,47” → 67197,47 (saldo is
  hidden — no running-balance ripple; BLIK numbers come from the PRNG, not amounts → no id drift). Median of
  4999×6, 5599×5, 5999 = (4999+5599)/2 = 5299; tolerance max(795, 1000) = 1000; max |a−m| = 700 → `fixed`; 6400 →
  1101 > 1000 → generator `expectType` throws (break 1.6 valid). KINOTEKA `fixedAmountMinor` = median → 5299 stays.
- **Unit case 16 — holds.** Recomputing D5 over the 31 derived groups (oracle groups with user merges split by raw
  merchant): fixed = kinoteka, przelew-konto-osobiste, muzykalnia, kawa-testowa.pl (all charged 07 and 08),
  silownia-ruch (08 only), phu-przyklad (last 06), kurs-przyklad.pl (last 03) — exactly the plan's changed / new /
  unchanged / absent split. Fixture ids are numeric `bankTxId` strings, so `byOccurredThenId`'s `BigInt` works.

### Follow-ups whose `Trigger:` names this slice

`grep "Trigger" context` for S-06 / fixed-cost / `/fixed`: none in any `follow-ups/review-fixes.md`. The only item
naming S-06 is design-kit row **G28** (`/patterns` badges „nowy” / „zmiana kwoty”, „(S-06)”): deferred with a
convincing reason (one view + global tokens, CLAUDE.md contract) and carried as a Phase 4 follow-up with a `Trigger:`.
S-05's „monthly sums skip `excluded`” (Trigger S-07) is honoured anyway (`!excluded` candidate filter, unit case 11,
smoke). F11 / F3 correctly not triggered (no form field, no focus ring).

### Product decisions vs PRD

- Decision 7 (D5 flip — a rise beyond tolerance turns the pattern `frequent`, it leaves `/fixed`) contradicts the
  literal FR-012 „niezależnie od tolerancji”, but FR-012's own resolution note says tolerance is „used only to detect
  the fixed pattern”, so it is a genuine reading choice, not clearly wrong → not overturned; `[human]` row 4.10 names
  it, follow-up planned. Decision 3 (latest change among R's occurrences) is a strict superset of „względem ostatniego
  wystąpienia” — PASS. Decision 5 (gap month = no comparison) widens the one-month AC without violating it — PASS.

## Findings

### F1 — Smoke `>text<` anchors break if the formatter wraps an element

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Critical Implementation Details („Single-string rendering”); Phase 3 §5, Phase 4 §6
- **Detail**: The plan makes each asserted string „the only child of its element”, but the pre-commit hook runs
  `eslint --fix` with `eslint-plugin-prettier` (`eslint.config.js`), which wraps long elements onto three lines; Astro
  then renders `<small> 20.06.2026 · … </small>` and every `>text<` anchor fails — the exact `InlineAlert` trap the
  agent contract records (S-05 plan-review F1). Every negative anchor is paired with a positive one on the same
  render, so this surfaces as red smoke rather than a false green, but it costs a debugging round.
- **Fix**: Critical Implementation Details now says: keep `{expr}` on the tag's line, check the served HTML before
  asserting, fall back to bare text (no island on `/fixed`) keeping each positive / negative pair.
- **Decision**: FIXED (plan.md)

### F2 — Seam-sweep grep forbids the `DESIGN-GAP: G34` the plan itself puts in `Badge.tsx`

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 4 Success Criteria (seam-sweep greps) / Progress 4.8
- **Detail**: Phase 4 §1 maps the `new` tone as a G34 / K9 item and §3 lists „`new` badge token mapping” under G34, so
  the natural comment in `Badge.tsx` is `DESIGN-GAP: G34`; criterion 4.8 required G34 / K23 markers only in `copy.ts`
  and `fixed.astro` → a correct implementation would fail its own gate.
- **Fix**: Criterion and Progress 4.8 allow `Badge.tsx`.
- **Decision**: FIXED (plan.md)

### F3 — D5 flip hides the largest rises (US-04's headline case at scale)

- **Severity**: 💡 OBSERVATION
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: End-State Alignment
- **Location**: Autonomous decision 7, Progress 4.10
- **Detail**: See „Product decisions vs PRD”. Kept; `[human]` 4.10 and the Phase 4 follow-up carry it; the pin remedy
  is proven by unit case 11 (pinned out-of-tolerance pattern is reported).
- **Decision**: RECORDED

### F4 — Decision 17 and fixture numbers verified

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Current State Analysis („Smoke user state”, „Fixture”), Phase 1, Phase 2 case 16
- **Detail**: See „Claims verified against the code” — all derived by reading `scripts/smoke.mjs` and recomputing over
  `expected.json`, not by running smoke; the implement step's smoke run is the first execution.
- **Decision**: RECORDED

### F5 — `bg-excess/25` is a loose match for the kit's `#EFE4D1`

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Architectural Fitness
- **Location**: Phase 4 §1 (Badge tone)
- **Detail**: Over `paper` #F2F1EC, `excess` #C79D62 at 25 % ≈ #E7DCCA, at 20 % ≈ #E9E0D0 (closer to #EFE4D1). `/25`
  keeps one mapping with `InlineAlert`; acceptable.
- **Fix**: Recorded in plan `## Known risks`; the visual step compares with the kit.
- **Decision**: RECORDED

### F6 — Phase sizing

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Lean Execution
- **Location**: Implementation Approach
- **Detail**: Four phases, each independently green (P1 fixture + two test literals; P2 pure module with no caller;
  P3 page + 2 components + 6 smoke; P4 section + badge tone + 4 smoke + follow-ups). Each fits one fresh agent; no
  split / merge; Progress unchanged (38 rows).
- **Decision**: RECORDED

VERDICT: PROCEED — rule, fixture arithmetic and smoke-state derivation hold against the code; two low-impact gate defects fixed in plan.md, D5 flip stays on the `[human]` row.
