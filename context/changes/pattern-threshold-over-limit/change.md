---
change_id: pattern-threshold-over-limit
title: Próg na wzorcu i „ponad próg” (S-04)
status: impl_reviewed
created: 2026-09-27
updated: 2026-09-27
archived_at: null
---

## Notes

Próg na wzorcu i „ponad próg” (roadmap S-04).

Outcome (roadmap `### S-04`): użytkownik otwiera wzorzec, widzi składające się na niego transakcje (FR-008), ustawia,
zmienia i usuwa próg (FR-010 — częsty: liczba wystąpień lub suma na miesiąc; stały: akceptowana kwota) i natychmiast
widzi transakcje oznaczone „ponad próg” oraz sumę „ponad progiem w tym miesiącu” (FR-011). PRD: US-01 (Wolt 4/mies.,
Netflix 43 zł; „wzorzec częsty bez progu nie generuje «ponad próg»”; suma = suma kwot oznaczonych w miesiącu),
US-02 AC „progi przetrwają usunięcie importu — przypisane do sprzedawcy, nie do importu”, Business Logic (definicja
nadwyżki: próg liczbowy — chronologicznie od (próg+1)-szej transakcji w miesiącu; próg kwotowy — suma miesiąca minus
próg, oznaczone od transakcji, przy której suma narastająco przekracza próg; stały — kwota wystąpienia minus
akceptowana kwota, gdy dodatnia), guardrail „determinizm” (ten sam CSV + te same progi = ta sama suma).

### Roadmap claims checked against the repo at `main` `a6a8b18` (2026-09-27, after S-03 and S-02 shipped)

| Roadmap claim (plan-time) | Repo now | Correction |
|---|---|---|
| Prerequisite S-03 done | Shipped (`4425f8c`, archive `2026-09-25-merchant-patterns`). Patterns are **derived on read**, no table: `loadPatterns` (`src/lib/patterns/load.ts`) pages every debit, `derivePatterns` (`src/lib/patterns/derive.ts`) groups by `merchantKey`; `MerchantPattern` (`src/types.ts`) already carries `key` and `transactionIds` | holds — but S-04 builds on a **derived** pattern: there is no pattern row to hang a threshold on. The threshold's identity is `merchantKey` + `user_id` (S-02 invariant) |
| „otworzyć wzorzec” | No `/patterns/[key]` route. `PatternsTable` rows are not links (`DESIGN-GAP: G28` — row link / arrow omitted because detail did not exist) | S-04 adds the detail route **and** re-enables the row link on `/patterns`. `merchantKey` = `normalizeMerchant(raw).toLocaleLowerCase("pl-PL")` — may hold spaces, dots, diacritics; not a slug. URL encoding / lookup-by-key is a research question |
| „zobaczyć jego transakcje” (FR-008) | `derivePatterns` keeps only `transactionIds`; `loadPatterns` selects `id, amount_minor, counterparty, title` — no `booking_date`/raw description in the read | the detail view needs dates (per-month grouping, chronological order for the count rule) and the raw description (kit „opis surowy · kwota”) → loader must select more columns, or a second per-pattern read |
| „ustawić, zmienić i usunąć próg” — thresholds persist | No threshold storage anywhere: migrations are `delete_own_account`, `domain_imports_transactions`, `transactions_import_account_fk`, `import_ing_statement` only | **migration required** (see below) — the roadmap block does not say so; S-03's roadmap line claimed a pattern table that was never built, so S-04 is the first slice that stores per-pattern user state |
| „ponad próg” + „suma ponad progiem w tym miesiącu” | Nothing computes it. `test/fixtures/ing/expected.json` has keys `schema, tolerance, files, rows, patterns` — **no threshold/over-limit oracle** | the rule needs its own unit oracle (hand-built cases incl. US-01 Wolt 4/mies. and the three Business-Logic kinds); F-02 cannot serve as acceptance oracle here |
| „w tym miesiącu” | PRD never pins which month; data are historical imports (fixture spans 2025-09…2026-0x). The calendar month of *today* may hold zero transactions | **open unknown** (roadmap says „Unknowns: —”) — current calendar month vs latest month present in the pattern/data; kit detail has a month selector („maj 2026 / kwi / mar”) and the label `patternDetail.sumLabel` „Suma w maju” with the month baked in. Decide in research/plan |
| Pattern type is stable enough to key a threshold kind | Type is D5-derived per read (`d5Type`); a new import (or undo, S-02) can flip a pattern fixed↔frequent; user type change is S-05 | **risk not in roadmap**: a stored `count`/`sum` threshold on a pattern that becomes `fixed` (or `amount` on one that becomes `frequent`). Plan must define behaviour (ignore mismatched kind vs keep + show) |
| Parallel with S-02, S-05, S-06, S-08 | S-02, S-08 done; S-05, S-06 not started | holds; S-05 will add its own per-merchant decisions table — S-04's table should not pre-empt it (keep thresholds separate, same key shape) |
| Blockers: — | S-03 follow-up F2 (keyset paging in `collectPages`) has its trigger fired and names S-04 | not a blocker, but a candidate in scope (see follow-ups) |
| „Gwiazda przewodnia: domyka pierwsze kryterium sukcesu PRD” | `/home` is still `EmptyState` only; the kit's „Ponad progiem w tym miesiącu” stat card lives on `/home` (`dashboard.stats[0]`) | S-04 closes the criterion on the pattern detail (and the list column); the `/home` stat is **not** in this slice (one view) — note for S-07/home slice |

### Migration

**Yes.** Thresholds must persist per user and survive import deletion (US-02 AC). Expected shape (to be fixed in
plan): one table (e.g. `pattern_thresholds`) with `user_id uuid not null references auth.users(id) on delete cascade`,
`merchant_key text not null`, `kind` (`count` | `sum` | `amount`), a positive value (count integer / amount in
grosze), `unique (user_id, merchant_key)`, RLS enabled with granular per-operation (`select`/`insert`/`update`/
`delete`) policies for `authenticated`, **no** `import_id` (S-02 invariant). pgTAP proof in
`supabase/tests/database/` (RLS isolation, cascade on account delete, survival of import delete, constraints), then
`npm run db:types`. `db push` to hosted before merge (ship step).

### Design kit binding

Views (`design/rytm-os/prototype/`):

- `views/pattern-wolt.html` → `app.js` `patternDetail(id)` + `thresholdEditor(p)`: `.detail-top` (`.back-link`),
  `.detail-heading` (eyebrow `badge(type)` + „wzorzec”, h1 name, type lead), `.detail-total` („Suma w maju”, sum,
  „N wystąpień”), `.detail-grid` > panel „Próg wzorca” (`.threshold-editor`: `.threshold-switch` /
  `.threshold-option`, `.threshold-fields` + `.input-suffix`, `.threshold-note`, `.threshold-actions` with
  `btn-primary` + `text-button` „Usuń próg”) and panel „Wystąpienia w miesiącu” (`.select-field.small` month select,
  `.sequence-large` `.seq`/`.seq.over`, `.sequence-labels`), `.transactions-panel` (list with
  `badge('ponad próg','excess')`). **Primary view of this slice.**
- `views/patterns.html` → `patternRows()`: the `Próg` / `Ponad progiem` columns and the row link + `.icon-button`
  arrow to `#/patterns/:id` — secondary: only what is needed to open a pattern and see its threshold / over-limit
  (lifts the matching `DESIGN-GAP: G28` omissions).
- Not bound (other slices): `.detail-actions` „Akcje” button + `modal('patternActions')` (S-05), status badges
  `nowy` / `zmiana kwoty` (S-06), `.excluded-section` / `applyPatternState` (S-05), `/home` stats and `trendChart()`
  (S-07 / home), `views/components.html` (reference only for `badge('ponad próg','excess')` and
  `inline-alert success` „Sukces — próg zapisany.”).

Keys (`design/rytm-os/react-kit/docs/content.json`, via `copy` in `src/content/copy.ts`):

- `patternDetail.back`, `patternDetail.sumLabel` („Suma w maju” — month baked in, see gaps),
  `patternDetail.transactions`, `patternDetail.rawDescription`.
- `threshold.acceptedAmount`, `threshold.countPerMonth`, `threshold.sumPerMonth`, `threshold.empty`,
  `threshold.active`, `threshold.save`, `threshold.remove`.
- `patterns.columns[4]` „Próg”, `patterns.columns[5]` „Ponad progiem”.
- `components.success` („Sukces — próg zapisany.”) — candidate for the save-confirmation state.
- `howItWorks.explanation[2]` / K1 — the label is „ponad próg” / „ponad progiem w tym miesiącu” (FR-011), never
  „spalone”/„nadwyżka”.
- Existing, reused: `copyExtra.patterns.typeLabels` (K11), `copyExtra.patterns.amountColumn` (K17).

DESIGN-GAPs expected (register in `context/foundation/design-kit.md` when the plan fixes what renders, never invent):

- **„ponad próg” badge label** — rendered by `badge('ponad próg','excess')` in `app.js`; `content.json`
  `components` has only `excluded`/`new`/`changed` → K11-class gap (`copyExtra`).
- **`patternDetail.sumLabel` „Suma w maju”** — month hard-coded (same class as K16); needs a month-parametrised label.
- **Detail strings only in `app.js`**: panel titles „Próg wzorca”, „Wystąpienia w miesiącu”; status „aktywny” /
  „brak ustawionego progu”; field labels „Kwota” / „Liczba wystąpień”; suffixes „zł” / „×”; button „Ustaw próg”
  (no-threshold state); sequence label „W ramach progu” (`copyExtra` already has `sequenceThreshold` „Twój próg” /
  `sequenceOver` „Ponad próg” for how-it-works); type leads „Sprzedawca o stałej, powtarzalnej kwocie.” /
  „Sprzedawca, który wraca niezależnie od kwoty.”; „N wystąpień”; toasts „Próg zapisany.” / „Próg usunięty.”; list
  cell formats „4 × / miesiąc”, „55,00 zł”.
- **„Ponad progiem w tym miesiącu” on the detail** — kit detail shows only the pattern's month sum + sequence; the
  labelled monthly over-limit sum exists only on `/home` (`dashboard.stats[0].label`). Where the detail shows it is a
  gap to decide in plan (reuse that label vs placeholder).
- **Threshold-editor states the kit does not define**: validation error (0, negative, non-integer count), pending
  save, save/delete failure, kind switch for a frequent pattern with a stored threshold of the other kind, and the
  type-flip mismatch above.
- **Detail for an unknown / vanished key** (pattern gone after undo-import, foreign key in URL) — no kit state (G30
  class).

### Open follow-ups whose trigger names S-04

| Follow-up | Source | Take |
|---|---|---|
| S-03 F2 — keyset paging in `loadPatterns` / `collectPages` (`src/lib/patterns/load.ts`); trigger fired by S-02, „take it in S-04 (it reads the same patterns) or as its own small change” | `context/archive/2026-09-25-undo-import/follow-ups/review-fixes.md` (restates `2026-09-25-merchant-patterns` F2) | **In scope, recommended.** S-04 must widen the same read (dates, raw description) and add a per-pattern read; changing the read once, with keyset paging, is cheaper than touching it twice. Plan phase 1 candidate; drop only if research shows the read is replaced wholesale |
| F5 — `buttonVariants` `text` (`src/components/ui/button.tsx`) unused until S-04 „Usuń próg” | same file | **In scope** — kit `.threshold-actions` renders „Usuń próg” as `.text-button`; the plan reuses the `text` variant (closes F5) |
| Invariant: persisted thresholds key on `merchantKey` + `user_id`, never `import_id` | same file | **Binding** on the migration |
| Shared dialog geometry / S-01 F9 shared close icon — trigger „next change that touches a dialog” | same file | **Not triggered unless S-04 adds a dialog.** Kit threshold editor is inline (no modal); delete-threshold has no confirm dialog in the kit. Stays out; re-evaluate if the plan adds a dialog |
| F4 `pending` on bfcache, F3 CSRF `checkOrigin` | same file | Not S-04 triggers; F3 applies as a rule — the new threshold POST routes rely on `security.checkOrigin` like the other POSTs |
| S-01 F8 (DB text length checks, „do S-03”), S-03 F3/F5/F6/F7 | `2026-09-24-ing-csv-import`, `2026-09-25-merchant-patterns` | Do not name S-04; F6 (`/patterns` error-branch logging) and F5 (`columns.slice`) sit in `patterns.astro`, which S-04 touches — fold only if trivial, otherwise leave |

Next: `/10x-research pattern-threshold-over-limit` — month semantics of „w tym miesiącu”, detail route key/encoding,
widened read + keyset paging, threshold storage shape and the type-flip rule, and a unit oracle for the three
over-limit kinds need grounding before a plan.

## Autonomous decisions

Made by the `new` step of run `2026-09-27-s03-s02-s04` in place of asking a human.

- **Did not STOP after `change.md`** (the 10x-new skill says display the next step and wait). Chosen: continue to
  handoff and commit. Rejected: waiting. Why: no human in the loop (agent contract, rule 1). Would change: a maintainer
  message pausing the run.
- **Next step = `/10x-research`, not the skill's default `/10x-plan`.** Why: five grounding questions (month
  semantics, route key, widened read, storage + type flip, oracle) — and the orchestrator named it. Rejected
  `/10x-frame`: FR-008/010/011 framing is not suspect. Would change: research already on disk.
- **Migration = yes, one separate thresholds table keyed `(user_id, merchant_key)`**, recorded as expected, shape
  left to plan. Rejected: a generic per-merchant decisions table shared with S-05 (would pre-empt S-05's design and
  widen this slice); storing thresholds in `auth.users` metadata (no RLS granularity, no cascade story). Why: CLAUDE.md
  Supabase rules + S-02 invariant. Would change: research finding S-05 must land in the same table to keep one
  identity for a merged pattern (then a `merchant_patterns` decision table becomes S-04's).
- **Primary view = pattern detail (`pattern-wolt.html`); `/patterns` changed only for the row link and the Próg /
  Ponad progiem columns.** Rejected: `/home` „Ponad progiem w tym miesiącu” stat (other view; home is still the
  empty-state stub) and the trend (S-07). Why: one view + global tokens; the outcome „otworzyć wzorzec” requires the
  list to link. Would change: the plan finding the list columns too costly for one slice (then list gets only the
  link, columns move to S-06/S-07 with a G28 note).
- **Keyset-paging follow-up (S-03 F2) recommended in scope.** Why: S-04 rewrites the same read. Would change:
  research showing the detail uses a separate filtered query and the list read stays untouched.
- **DESIGN-GAPs listed as candidates, not registered** in `context/foundation/design-kit.md`. Why: ids are assigned
  when the plan fixes what renders; `new` writes identity only (same as S-03). Would change: the contract requiring gap
  rows at `new`.
- **„w tym miesiącu” left open** rather than decided here. Why: it is a product/UX choice with kit evidence both ways
  (month select vs baked-in „maj”); research should read fixture month spans and the kit first. Would change: nothing
  at this step.
- **Title in Polish**, matching the repo's log and S-03's change. Would change: a maintainer preference for English.
