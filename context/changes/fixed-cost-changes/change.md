---
change_id: fixed-cost-changes
title: Zmiany kwot i nowe wzorce stałe względem poprzedniego miesiąca (S-06)
status: impl_reviewed
created: 2026-09-28
updated: 2026-09-28
archived_at: null
---

## Notes

Zmiany kwot i nowe wzorce stałe (roadmap S-06).

Outcome (roadmap `### S-06`): użytkownik widzi, które wzorce stałe zmieniły kwotę względem ostatniego wystąpienia
(każda zmiana, także w tolerancji) i które są nowe względem poprzedniego miesiąca kalendarzowego; przy danych z
jednego miesiąca widzi komunikat o braku miesiąca do porównania. PRD: FR-012 (resolved 2026-09-18: „poprzedni okres”
= poprzedni miesiąc kalendarzowy, D6; tolerancja D5 = max(15% mediany, 10 zł)), US-04 (Netflix 43 → 49 zł na liście
zmian kwoty; nowy sprzedawca w tolerancji, nieobecny w poprzednim miesiącu, oznaczony jako nowy), AC: każda zmiana
względem ostatniego wystąpienia raportowana — także obniżka i zmiana w tolerancji; wzorzec stały bez zmiany nie
pojawia się na liście zmian; „nowy” = brak wystąpień w poprzednim miesiącu kalendarzowym (D6); jeden miesiąc danych
→ lista nowych pusta z komunikatem, nie „wszystko jest nowe”. Kryterium sukcesu 2 (primary): „dla wzorców stałych
aplikacja wskazuje, które podrożały i które są nowe względem poprzedniego okresu”. `import-formats.md` D6: „Nowy
wzorzec stały = ma wystąpienie w bieżącym miesiącu, nie miał w poprzednim.”

### Roadmap claims checked against the repo at `main` `3706508` (2026-09-28, after S-03, S-04, S-05 shipped)

| Roadmap claim (plan-time) | Repo now | Correction |
|---|---|---|
| Prerequisite: S-03 (only) | S-03, S-04 **and S-05** shipped. Patterns are still **derived on read** (no pattern table): `loadPatternData` (`src/lib/patterns/load.ts`) pages transactions + thresholds + decisions, then `derivePatterns(rows, decisions)` (`src/lib/patterns/derive.ts`) — merge resolved to the root before grouping, `type = decision?.pinnedType ?? d5Type(amounts)`, `excluded` flag, `displayName` | S-06 builds on **S-05's decided patterns**: a pinned-`fixed` pattern counts as fixed, a pinned-`frequent` does not; an **excluded** pattern must not appear on `/fixed` (FR-017 note / S-05 decision 9: „excluded from every monthly sum”); a merged pattern's change/new status is computed over the union of its components. Consume `loadPatternData` → `MerchantPattern[]`, never re-derive |
| „zobaczyć, które wzorce stałe zmieniły kwotę…” (a view) | `src/pages/fixed.astro` is a **static placeholder**: `PageTitle` + `ViewEmpty` („Wgraj pierwszy wyciąg”) rendered **unconditionally**, even for an account with data. No computation of changes/new anywhere in `src/lib/` | The whole view is unbuilt: data read, a pure change/new function in `src/lib/patterns/` (unit-testable like `listOverview`), and the kit's `fixedCosts()` layout. The pre-import empty view stays for accounts with no transactions |
| „względem poprzedniego miesiąca kalendarzowego” / kit „Nowe w tym miesiącu” | `referenceMonth(rows)` (`src/lib/patterns/over-limit.ts`) = latest month present in the user's data; `monthOf` exists. Maintainer binding for this run (agent contract, Step 0): „w tym miesiącu” = **latest month in the data**, not the calendar month | reuse `referenceMonth` as „ten miesiąc” and its predecessor month as the comparison month — the same reference month `/patterns` uses, so the two views never disagree |
| „każda zmiana względem ostatniego wystąpienia, także w tolerancji” | Nothing computes a per-occurrence delta; `MerchantPattern` carries only `medianMinor` / `fixedAmountMinor` and `transactionIds` | needs the pattern's rows ordered (`byOccurredThenId`), last occurrence in the reference month vs the occurrence before it. **Open for research/plan:** a fixed pattern charged twice in the reference month; a rise large enough to leave D5 tolerance flips the pattern to `frequent` (`d5Type`) and it would **drop off** `/fixed` exactly when it matters most (US-04 AC says report changes in tolerance „także”, implying out-of-tolerance ones too) |
| Unknowns: — | Several product/UX choices neither PRD nor kit answer: where a fixed pattern **absent** from the reference month goes (fixture: `kurs-przyklad.pl` last 2026-03, `phu-przyklad` last 2026-06) — „Bez zmian”, omitted, or its own state; decrease display; single-month state copy | **open unknowns** for research/plan (see Design kit binding gaps) |
| Risk: „fixture F-02 musi zawierać podwyżkę subskrypcji i nowy wzorzec” | Both traps exist in `test/fixtures/ing/expected.json`: **T16** `silownia-ruch` (fixed, single occurrence 2026-08-05, `firstMonth` 2026-08 — the generator asserts it is the *only* pattern new in the last month) and **T11** `kinoteka` (fixed, 49,99 → 55,99 zł). **But T11's rise is on 2026-03-17**, and every later month is 55,99. Reference month = 2026-08 → kinoteka's last (2026-08-17, 55,99) equals its previous (2026-07-17, 55,99). No fixed pattern changes amount in 2026-08 (`phu-przyklad` T19 changed 71,50 → 69,00 on 2026-06-02, outside the reference month) | **Risk is half-realised:** the fixture proves „nowe” (T16) end to end, but at the reference month the **„Zmieniły kwotę” list is empty on the fixture** — US-04's headline case and the visual gate's `changed` state cannot be shown from the one importable file. Resolution belongs to research/plan (see Autonomous decisions: lean = move/add T11's rise into 2026-08 in `scripts/fixture-ing.mjs`, regenerate, update `test/unit/ing-parser.test.ts` hardcoded `6497147` sum; unit tests on crafted rows cover decrease / in-tolerance / double-charge regardless) |
| Parallel with S-04, S-05, S-07, S-09 | S-04, S-05 done. S-07 (over-limit trend) comes after S-06 in this run and owns `/home` stats | holds; the kit `/home` stat card „Koszty stałe · N pozycje podrożały” is **not** bound here (one view) — S-06 should expose its computation as a pure function S-07/`/home` can call later |
| Risk: „niezależne od progów” | True — thresholds (`pattern_thresholds`) play no part in FR-012 | holds; `/fixed` needs only `patterns` + `rows` from `loadPatternData` |

### Migration

**No migration expected.** FR-012 is a pure function of the user's transactions and S-05 decisions, both already
read by `loadPatternData`; nothing new is stored (the kit has no dismiss/acknowledge action on a change, and
„nowy”/„zmiana kwoty” are recomputed on every read, like the patterns themselves). Would change: a plan choosing to
persist a per-user „seen” state or a snapshot of last month's amounts (neither is required by US-04 — rejected in
advance as state that could disagree with the derived view). No pgTAP / `db:types` / `db push` work then.

### Design kit binding

Views (`design/rytm-os/prototype/`, rendered by `app.js`; `views/*.html` are shells):

- `views/fixed.html` → `app.js` `fixedCosts()`: `.dash-title` (eyebrow „Koszty stałe”, h1 „Co zmieniło się samo?”,
  lead „Rytm porównuje miesiące kalendarzowe i pokazuje różnice.”), then three `.fixed-section`s each with a
  `.section-label` (h2 + count „2 pozycje” / „1 pozycja” / „3 pozycje”) and a `.fixed-list.panel` of `.fixed-row`s:
  - „Zmieniły kwotę”: `.merchant` (`.merchant-mark` + name + `small` „20.05.2026 · poprzednio 49,00 zł”) and
    `.fixed-change` (current amount `span` + delta `b` „+6,00 zł”, amber-dark).
  - „Nowe w tym miesiącu”: meta „pierwsze wystąpienie · 15.05.2026”, amount + `badge('nowy','new')`.
  - „Bez zmian”: `.fixed-list.panel.compact`, name + amount only.
  **Primary (and only) view of this slice.** G5 in `design-kit.md` is „delivered · `/fixed`”.
- `views/fixed-empty.html` → `emptyView('fixed')`: the pre-import empty view — already rendered by `fixed.astro`
  (`ViewEmpty`); stays for accounts with no transactions.
- `views/components.html` — reference: `badge('nowy','new')`, `badge('zmiana kwoty','changed')` (K9: amber for both
  in `brand.css`; prototype `.badge.new` is `#e2e7ec` — use the Tailwind names only).
- Styles: `prototype/styles.css` `.fixed-section`, `.section-label`, `.fixed-list`, `.fixed-row`, `.fixed-change`,
  `.compact .fixed-row`; mobile (≤560 px) `.fixed-list{padding:0 14px}`, `.fixed-change` stacked column.
- Not bound (other slices / one-view rule): the `/patterns` status badges `nowy` / `zmiana kwoty` in
  `patternRows()` (G28 — `PatternsTable.tsx` header `DESIGN-GAP: G28` names S-06; see Autonomous decisions), the
  `/home` stat card „Koszty stałe … pozycje podrożały” (S-07 / `/home`).

Keys (`design/rytm-os/react-kit/docs/content.json`, via `copy` in `src/content/copy.ts`):

- `fixedCosts.title` „Co zmieniło się samo?” (already the `AppLayout` title), `fixedCosts.changed` „Zmieniły kwotę”,
  `fixedCosts.new` „Nowe w tym miesiącu”, `fixedCosts.unchanged` „Bez zmian”.
- `components.new` „nowy”, `components.changed` „zmiana kwoty” (badges).
- `emptyViews.fixed.title` / `.lead`, `emptyViews.cta`, `emptyViews.button` (already rendered, pre-import state).
- Existing `copyExtra.fixed.eyebrow` „Koszty stałe” and `copyExtra.fixed.lead` „Rytm porównuje miesiące
  kalendarzowe i pokazuje różnice.” (K11, already in `copy.ts`).

DESIGN-GAPs expected (register in `context/foundation/design-kit.md` when the plan fixes what renders; next free id
after G33; never invent):

- **Single-month state** (US-04 AC: „nie ma poprzedniego miesiąca do porównania”) — no kit state, no copy.
- **Empty section** — data present but nothing changed / nothing new in the reference month; kit always shows rows.
- **Account with transactions but no fixed pattern** (all frequent/excluded) — `fixed-empty` is pre-import only.
- **Price decrease** — kit shows only „+6,00 zł” in amber; sign/colour of a drop undefined (AC requires decreases).
- **Row copy only in `app.js`** (K11-class → `copyExtra`): section counts with Polish plurals („pozycja / pozycje /
  pozycji”), „poprzednio”, „pierwsze wystąpienie ·”.
- **Fixed pattern absent from the reference month** (lapsed subscription) — kit has no section for it.
- **Read error state** — kit none; `/patterns.astro` already renders an `InlineAlert` on a failed
  `loadPatternData` (reuse that shape, same class as G30/G31).
- **Row link to the pattern detail** — kit `.fixed-row`s are not links; do not add one unless the plan registers it.

### Open follow-ups whose trigger names this slice (or fires on it)

Grep of `context/archive/*/follow-ups/review-fixes.md` for `S-06` / `fixed-cost-changes` / `/fixed`: **no follow-up
names this slice.** Conditional triggers checked:

| Follow-up | Source | Take |
|---|---|---|
| S-04 **F11** — app-wide 14 px field radius vs kit 8 px; Trigger: „next UI change to a view with a form field” | `2026-09-28-durable-pattern-decisions/follow-ups/review-fixes.md` (carried from S-04) | **Not triggered** — kit `fixedCosts()` has no form field (no month select, no search). Fires only if the plan adds a month picker (kit has none — would itself be a gap) |
| S-04 **F3** — focus ring re-typed in `BackLink.astro`, `PatternsTable.tsx`, `ThresholdEditor.tsx`; Trigger: change to the focus ring / `ink` token or an a11y pass | `2026-09-27-pattern-threshold-over-limit/follow-ups/review-fixes.md` | Not triggered (no focus-ring change; kit rows are not interactive). If the plan makes rows links, import the ring from `field-styles.ts`, do not re-type a fourth copy |
| S-05 **F6** — excluded pattern merged as a source re-enters the analysis; Trigger: S-07 or product feedback | S-05 follow-ups | Not triggered, but relevant: an excluded-then-merged source's rows would count in the target's change/new status. Consistent with S-05 decision 4; no work |
| S-05 — monthly sums must skip `pattern.excluded`; Trigger: S-07 | S-05 follow-ups | Names S-07, but the rule binds S-06 too: filter `excluded` patterns out of every `/fixed` section |
| **G28** (design-kit row, not a review-fixes follow-up) — `/patterns` status badges `nowy`/`zmiana kwoty` „(S-06)”; `DESIGN-GAP: G28` in `PatternsTable.tsx` header | `context/foundation/design-kit.md` G28 | **Deferred** (one view + global tokens): S-06 delivers `/fixed`; the list badges become a small follow-up change that reuses S-06's pure function. See Autonomous decisions |

Next: `/10x-research fixed-cost-changes` — the change/new semantics (last vs previous occurrence inside/outside the
reference month, double charge, D5-flip on a large rise, lapsed fixed patterns), the fixture adequacy fix (moving
T11's rise vs crafted-row tests only, and the ripple into `expected.json` / `ing-parser.test.ts` / smoke), where the
pure function lives next to `listOverview`, and the gap list need grounding before a plan.

## Autonomous decisions

Made by the `new` step of run `2026-09-28-s05-s06-s07` in place of asking a human.

- **Did not STOP after `change.md`** (the 10x-new skill says display the next step and wait). Chosen: continue to
  handoff and commit. Rejected: waiting. Why: no human in the loop (agent contract, rule 1). Would change: a
  maintainer message pausing the run.
- **Next step = `/10x-research`, not the skill's default `/10x-plan`.** Why: the fixture does not exhibit a price
  change in the reference month, and the change semantics (double charge, D5 flip, lapsed patterns) need code and
  fixture grounding; the orchestrator named it. Rejected `/10x-frame`: FR-012 framing is settled (D5, D6 resolved in
  the PRD). Would change: research already on disk.
- **Migration = no.** Chosen: derive change/new on read from `loadPatternData`. Rejected: storing a snapshot or a
  „seen” flag. Why: no kit action needs state; stored state could disagree with the derived patterns after an
  undo-import or a merge. Would change: the plan finding a requirement to acknowledge/dismiss a change.
- **„Ten miesiąc” = `referenceMonth(rows)` (latest month in the data), comparison month = its calendar
  predecessor.** Why: maintainer binding of 2026-09-28 for „w tym miesiącu” (S-07), and `/patterns` already uses the
  same reference month. Rejected: the wall-clock calendar month (empty view for anyone whose last import is older).
  Would change: the maintainer revising that binding.
- **Fixture lean: make T11's rise land in the reference month** (move the rise to 2026-08, or add a second step
  there) in `scripts/fixture-ing.mjs`, regenerate `expected.json`, update the hardcoded import sum in
  `test/unit/ing-parser.test.ts`; plus unit tests on crafted rows for decrease / in-tolerance / double charge.
  Rejected: crafted-row unit tests only — the visual gate and smoke would never render a non-empty „Zmieniły kwotę”
  from real data, and the roadmap's own risk says the result is then unverifiable. Rejected: a second import file —
  a new importable file widens the parser/overlap oracle (`expected.json` `files`) for one trap. Left to research/plan to confirm
  the ripple (the new rise must stay inside D5 tolerance so kinoteka stays `fixed`). Would change: research finding
  the ripple touches S-03/S-04/S-05 oracles broadly (then crafted-row units + a smoke that builds its own rows).
- **`/patterns` status badges (G28) deferred, not in scope.** Rejected: rendering `nowy`/`zmiana kwoty` in
  `PatternsTable` in this slice. Why: one view + global tokens; US-04 is satisfied by `/fixed`. Would change: the plan
  showing it is a one-prop addition from the same pure function *and* the visual step re-screenshots `/patterns`
  anyway — then fold it in.
- **Candidate DESIGN-GAPs listed, not registered.** Why: ids are assigned when the plan fixes what renders (same as
  S-03/S-04/S-05 `new`). Would change: the contract requiring gap rows at `new`.
- **Title in Polish**, matching the repo's log and earlier slices. Would change: a maintainer preference for English.
