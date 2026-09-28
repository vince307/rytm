# Review follow-ups — `fixed-cost-changes` (S-06)

Written by the Phase 4 implement step (`/10x-implement fixed-cost-changes phase 4`, autonomous run
`2026-09-28-s05-s06-s07`), per plan Phase 4 §4. Records what carries forward with a `Trigger:` line for the next
slice/change to pick up.

## Open — carried forward

- **D5 flip hides an out-of-tolerance rise from `/fixed`** (FR-012 „niezależnie od tolerancji” vs. plan decision 7 /
  `fixed.ts`'s header comment: a rise large enough to leave D5 tolerance flips the pattern to `frequent` in
  `derivePatterns` and it silently leaves the candidate set — no row anywhere reports it). Mitigation already
  shipped: pinning the type (S-05, `POST /api/patterns/decision` `action: "type"`) keeps a pattern `fixed`
  regardless of `d5Type`. Trigger: `[human]` row 4.10 answered „must show” (against the plan's default), or product
  feedback that a headline price hike went unreported.
- **One-off merchants are D5-fixed and list as „nowy” on real data** (`d5Type` treats a single occurrence as within
  tolerance trivially — proven in this phase's own smoke fixture, "Piekarnia smoke"). On a real statement this will
  crowd „Nowe w tym miesiącu” with genuinely one-off purchases, not recurring costs. Trigger: product feedback, or
  S-07's `/home` stat card surfacing the same noise.
- **`/patterns` status badges (`nowy` / `zmiana kwoty`, G28)** — `PatternsTable.tsx`'s header still carries
  `DESIGN-GAP: G28` for these; `fixedOverview` (this change) is the exact pure function that would drive them
  (`changed`/`new` row `key`s), plus a `Badge` `tone="changed"` (not yet added — only `new` shipped this phase).
  Trigger: the next change to `/patterns` or `PatternsTable.tsx`.
- **S-07 `/home` „Koszty stałe · N pozycje podrożały”** = `fixedOverview(patterns, rows).changed.filter((r) => r.deltaMinor > 0).length`
  („podrożały” counts rises only — `changed` also holds decreases; plan Phase 4 §4 contract, corrected by the
  implementation review, which found the unfiltered `.changed.length` here).
  Reuse `fixedOverview` directly — do not re-derive the change/new rule. Trigger: S-07.

## From this phase's own implementation (not a review finding, recorded for completeness)

- **`Badge` tone `changed` still unimplemented** — only `tone="new"` was added this phase (`bg-excess/25
  text-excess-text`); `changed` is explicitly deferred to the G28 follow-up above, per the plan's Phase 4 §1
  contract ("`changed` stays unimplemented until the `/patterns` badges").

## From the implementation review (2026-09-28)

- **A pattern/row drift throws past the error branch** — `view.ts` `patternTxs` throws on a `transactionIds` entry
  missing from the read; `fixed.astro` calls `fixedOverview` (and `patterns.astro` calls `listOverview`) inside the
  result IIFE without a `try`, so that programming error becomes a 500, not the `InlineAlert` error line. Inherited
  shape from `/patterns`, not new in S-06. Trigger: a 500 on `/fixed` or `/patterns` in production logs, or the next
  change touching `loadPatternData`.
- **`FixedSection` `compact` prop only adds an unstyled `compact` class** (prototype-markup parity; row height lives in
  `FixedRow` `compact`). Harmless. Trigger: the next `/fixed` change — drop the prop or give it meaning.

## From the visual gate (2026-09-28)

- **Panel radius 20 px vs the kit's 12 px** — the theme maps `--radius` to 14 px, so `rounded-xl` = 20 px. `Panel.astro`,
  `ExcludedPatterns.astro`, `PatternsTable.tsx` and `FixedSection.astro` all use `rounded-xl` for the kit `.panel`
  (`border-radius:12px`). App-wide, not S-06 — `/fixed` stays consistent with the other panels. The merchant mark
  (`merchant-mark.ts` `merchantMark`) was fixed to 8 px in this gate (`29c4829`). Trigger: a global-token pass on
  radii, or the next change to `Panel.astro`.
- **`Badge` tone `new` tint** — rendered `#E7DCC9` (`bg-excess/25` over `paper`) vs the kit's `#EFE4D1`
  (measured from pixels on `fixed-overview-desktop.png` / `kit-fixed-desktop.png`). Recorded in G34; no new token
  (plan Known risks). Trigger: the kit author providing a `new` / `changed` token, or the G28 `changed` tone.
