# Follow-ups — kit-round-3-patterns (S-14)

Each item carries a `Trigger:` line; later slices grep for it.

- [ ] **S-05 F6 — an excluded pattern can be merged as the source** (`validateMerge` checks only the target; see
  `context/archive/2026-09-28-durable-pattern-decisions/follow-ups/review-fixes.md`). Not a presentation change, so S-14
  left it.
  Trigger: rule changes or product feedback on merge behaviour.
- [ ] **S-05 F7 — `unmerge` is not scoped to the root** (`src/pages/api/patterns/decision.ts`, same archive file).
  Trigger: rule changes or product feedback on merge behaviour.
- [ ] **`fixed.astro` `try`** — the `/fixed` read keeps its own error handling; adopt the kit boundary with the page.
  Trigger: S-15
- [ ] **Panel radius 20 vs 12** — kit panels use 20, the app `Panel` 12; one global radius pass, not a per-view edit.
  Trigger: global radius pass (kit round 4 or maintainer preference)
- [ ] **In-dialog decision errors / separate modal views** — the kit draws merge, merge-empty and rename as separate
  modal views and errors inside the dialog; the app reveals forms in place and shows results as page alerts (G33).
  Trigger: kit round 4 or maintainer preference
- [ ] **K35–K37 to the kit author** — plural forms in `patternDetail.sequenceSummary`, `threshold.invalid` omits the
  range/decimals rule, no key for the transactions-panel literal (register rows K35–K37).
  Trigger: kit round 4
