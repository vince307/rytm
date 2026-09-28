# Review follow-ups — `over-limit-trend` (S-07)

Written by the Phase 4 implement step (`/10x-implement over-limit-trend phase 4`, autonomous run
`2026-09-28-s05-s06-s07`), per plan Phase 4 §3. Records what carries forward with a `Trigger:` line for the next
slice/change to pick up.

## Open — carried forward

- **S-05 F6 — `validateMerge` lets an excluded source re-enter via a merge.** The trend shows the re-entry faithfully
  (only the root pattern's decision applies, S-05 decision 4) — the trend is correct given the current merge rule,
  but the rule itself is still not fixed. Fixing it touches `validateMerge` and the decision dialog on
  `/patterns/<key>` — another view, out of scope for a one-view change. Trigger: product feedback, or the next change
  to `/patterns/<key>`.
- **`/patterns` and `/fixed` still let a `patternTxs` id-drift throw become a 500** — only `/home` wraps the pure
  assembly in `try`/`catch` (S-06 follow-up, plan decision 11: one view, not retrofitted here either). Trigger: the
  next change touching those pages or `loadPatternData`.
- **„Rozpoznane wydatki” and „Co wraca najczęściej” (G36) not rendered** — the PRD defines neither the sum nor the
  selection rule (`[human]` S-05 7.9 still open); the dashboard stats grid stays two columns and the trend panel full
  width until one of them is answered. Trigger: `[human]` S-05 7.9 answered, or the kit author defining the selection
  rule for „Co wraca najczęściej”.
- **Long histories**: the trend's bars keep `min-w-[44px]` and scroll inside the panel rather than compress further.
  Fine on the fixture's 12 months; unverified past ~24. Trigger: an account with > 24 months of data, or usability
  feedback on the scroll.
- **S-06 „one-off merchants are D5-fixed” now also inflates the `/home` „Koszty stałe” value** (plan review F3): a
  merchant seen once is classified `fixed` by `d5Type`'s trivial-tolerance rule and its amount lands in `Σ /fixed`,
  the same noise S-06's own follow-up named for the pattern list. Consistent with `/fixed` by construction — the fix
  belongs to the classifier (`derivePatterns`), not this card. Trigger: `[human]` row 4.11 answered against a
  different Σ rule, or product feedback on real data.

## From this phase's own implementation (not a review finding, recorded for completeness)

- **`ImportPanel.astro` reuses the `muted/55` → kit `#9da9aa` mapping** `TrendChart.astro` already established for the
  bar/gridline grey (G35 note) rather than introducing a second nearest-token guess for the dashed border. Same
  reasoning, not a new decision.
