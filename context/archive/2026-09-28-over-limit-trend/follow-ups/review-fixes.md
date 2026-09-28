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
  bar/gridline grey rather than introducing a second nearest-token guess for the dashed border. Same reasoning, not a
  new decision. (The G35 row did not name `#9da9aa` until the implementation review amended it — impl review F2.)

## From the implementation review (2026-09-28, `reviews/impl-review.md`)

- **Panel-title markup is inline in six places** (`<h2 class="text-[17px] tracking-[-0.03em]">` in `home.astro`,
  `FixedSection.astro`, `patterns/[...key].astro` ×3, `settings.astro`; some with `m-0`), and `home.astro` repeats the
  title + muted-range header row `FixedSection.astro` already has (kit `.panel-title` / `.section-label`). A shared
  `PanelTitle.astro` in `src/components/app/` would remove it, but touches four other views — out of scope for a
  one-view change (impl review F4). Trigger: the next change that adds a panel title, or a `/10x-ui` pass over the
  app shell.
- **Month-index parse in two styles**: `home.astro` `monthIndex` (`Number(ym.split("-")[1]) - 1`) and
  `patterns/[...key].astro` (`Number(m.slice(5, 7)) - 1`) index the `copyExtra` declension tables. One
  `monthIndex(yearMonth)` in `src/lib/format.ts` would serve both (impl review F3 — `home.astro`'s own two copies
  were merged in the review fix). Trigger: the next change touching `patterns/[...key].astro` or adding a third
  declension table.
