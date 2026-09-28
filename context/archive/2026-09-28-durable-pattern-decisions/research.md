---
date: 2026-09-28T13:59:37+0200
researcher: Claude (research step, autonomous run 2026-09-28-s05-s06-s07)
git_commit: 6fb9bd28cab22be2b7b235ed42247c28979eed43
branch: feat/durable-pattern-decisions
repository: Rytm
topic: "S-05 durable-pattern-decisions — storage shape, derivation hook, merge/type/exclude/rename semantics, US-03 durability proof, kit binding"
tags: [research, patterns, derive, over-limit, supabase, rls, design-kit, S-05]
status: complete
last_updated: 2026-09-28
last_updated_by: Claude (research step)
---

# Research: durable pattern decisions (S-05)

**Date**: 2026-09-28T13:59:37+0200 · **Commit**: `6fb9bd2` · **Branch**: `feat/durable-pattern-decisions` · **Repo**: Rytm

## Research Question

Derived from `change.md` (`## 5. Open` of the `new` handoff): (1) decision storage shape and where decisions enter
`derivePatterns`; (2) merge semantics — surviving key, absorbed key's threshold, chains, merge into an excluded
pattern, undo; (3) user-pinned type vs S-04 `appliesTo`, `fixedAmountMinor` of a pinned-fixed pattern; (4) exclusion
in `listOverview` / `patternDetail` so S-06/S-07 inherit it; (5) the US-03 durability proof with one importable
fixture file; (6) kit binding, shared components, exact copy vs gaps; (7) scope of triggered follow-ups.

## Summary

- **Storage: one table `pattern_decisions` keyed `(user_id, merchant_key)`** is sufficient. A merge is many-to-one
  but each absorbed key has exactly one outgoing edge, so a nullable `merged_into` column on the absorbed key's row
  expresses it; no alias table is needed. Columns: `merged_into text null`, `excluded boolean not null default false`,
  `pinned_type text null check in ('fixed','frequent')`, `display_name text null`, plus the `pattern_thresholds`
  identity/RLS/grant pattern (`supabase/migrations/20260927200000_pattern_thresholds.sql`).
- **Hook point: `derivePatterns` (`src/lib/patterns/derive.ts`) gets a decisions map** and resolves each row's
  `merchantKey(raw)` to its root key **before** grouping, so `occurrences`, `sumMinor`, `medianMinor`, `d5Type` and
  `transactionIds` are computed on the union (AC „każda transakcja liczy się raz”). Type = `pinned_type ?? d5Type`,
  name = `display_name ?? most-frequent variant`, and the pattern carries `excluded`. `loadPatterns` is the only
  caller besides tests (checked: `src/pages/patterns.astro`, `src/pages/patterns/[...key].astro`,
  `test/unit/patterns.test.ts`, `test/unit/pattern-view.test.ts`).
- **Pinned type needs no threshold reset**: `appliesTo` / `listOverview` / `patternDetail` / `ThresholdEditor`
  already key on the pattern's effective `type`; if `derivePatterns` emits the pinned type, a mismatched stored
  threshold is hidden (S-04 decision 3) and returns on un-pin / re-pin. `fixedAmountMinor` stays `medianMinor` for a
  pinned-fixed pattern (the existing `type === "fixed" ? medianMinor : null` rule, no tolerance check).
- **Exclusion lives on `MerchantPattern.excluded`** and is honoured in `listOverview` and `patternDetail`
  (`src/lib/patterns/view.ts`): threshold `null`, `overMinor` 0. S-06/S-07 read the same derived patterns.
- **Durability proof**: the fixture's second account (`Rachunek VAT`) cannot prove US-03 (its 12 rows are paired
  transfers/`T18` debits with `rawMerchant: null` in `expected.json`, none of them `sportowo` or `przelew-konto-
  osobiste`). Recommended proof = (a) unit test: `derivePatterns` with decisions over the fixture reproduces the
  oracle's 30 groups, and a date split (rows before/after a cut-off, derived separately with the same decisions,
  then together) shows later rows join the merged pattern; (b) smoke: a **second synthetic, non-overlapping import**
  (the smoke script already builds its own payload, `importPayload` in `scripts/smoke.mjs`) after the decisions, plus
  the existing undo+re-import path; (c) pgTAP: decisions survive `delete from imports`. No new fixture file.
- **Kit**: the actions dialog exists in the kit (`app.js` `modal` default branch) but its four buttons are toast
  stubs; merge picker, rename input, type-change confirm, exclude confirm and merge undo have no kit UI → DESIGN-GAPs.
  Exclude/restore (banner + „Wykluczone” section) is fully specified. Highest registered ids: **G32**, **K21**.

## Detailed Findings

### 1. Current derivation and read path (observed)

- `loadPatterns` (`src/lib/patterns/load.ts`) pages `transactions` by keyset through `collectPages` and returns
  `{ patterns: derivePatterns(rows), rows }`.
- `derivePatterns` groups by `merchantKey(rawMerchant(counterparty, title))`; name = most frequent
  `normalizeMerchant` variant (tie → code-point smallest); `type = d5Type(amounts)`;
  `fixedAmountMinor = type === "fixed" ? medianMinor : null`; sort by sum desc, name (`pl`), key.
- `loadThresholds` (`src/lib/patterns/thresholds.ts`) is an **unpaged** `select("merchant_key, kind, value")` — it
  does not even select `id`, so reusing `collectPages` (S-04 F5) needs `id` added to the select plus `.order("id")`
  / `.gt("id", afterId)`, mirroring `loadPatterns`.
- Both pages call `Promise.all([loadPatterns, loadThresholds])`; a decisions read is a third parallel read — but
  `derivePatterns` needs decisions **before** deriving, so `loadPatterns` must either receive decisions or the pages
  derive after both reads resolve. Inference: simplest is `loadPatterns` returning raw rows and the caller calling
  `derivePatterns(rows, decisions)`, or `loadPatterns(supabase, decisions)` after an awaited decisions read (one
  extra round trip). Plan choice.

### 2. Merge semantics (recommendations; PRD states only the AC)

PRD FR-009 / US-03 AC fix only: merged count and sum = sum of components; each transaction counts once; later
imports apply the merge. PRD is **silent** on surviving key, thresholds, chains, undo.

- **Surviving key = the target's key** (the pattern the user merges *into*). Routes (`patternHref`), thresholds and
  the root's decisions stay addressable by it. The oracle's hand slug for the merged group is `sportowo`, which
  matches the real key of `SPORTOWO SP. Z O.O. …` (legal form stripped by `normalizeMerchant` → `sportowo`); the
  other variant keys to `sportowo.pl` (existing test asserts names `["SPORTOWO", "sportowo.pl"]`). So the natural
  oracle decision is `sportowo.pl → sportowo`.
- **Chains**: resolve at read time — follow `merged_into` until a key with no outgoing edge; guard cycles with a
  visited set (on a cycle, stop at the first repeated key — deterministic because the map is keyed). At write time,
  accept only a target that is a current root (a pattern the user can see) and ≠ source; merging B into C when
  A→B exists leaves A→B→C, resolved at read. This keeps each write a single-row upsert.
- **Absorbed key's own decisions/threshold**: keep the rows; while merged they are inert (the group uses the root's
  `excluded` / `pinned_type` / `display_name` and the root's threshold). Same keep-but-ignore principle as S-04
  decision 3 (research `context/archive/2026-09-27-pattern-threshold-over-limit/research.md`, „Recommended
  keep-but-ignore on type flip … flip back restores”). Undo of the merge restores them.
- **Merge into an excluded pattern**: the root's `excluded` applies to the union. Recommend the picker lists only
  non-excluded roots (an excluded pattern's detail shows the banner; offering merges into it is a UX trap). Plan decides.
- **Display name of a merged group**: `display_name` of the root if set, else the existing most-frequent-variant rule
  over the union (US-03 has the user name it explicitly).
- **Undo**: the modal lead promises „Możesz je później odwrócić w ustawieniach wzorca”; no such UI exists in the kit
  (`app.js`) and PRD does not require undo. Data model supports it (clear `merged_into` / `pinned_type` /
  `display_name`). Recommend: exclude has restore (kit-provided); undo of merge / type / rename = DESIGN-GAP, minimal
  or deferred per plan.
- **URL of an absorbed key** (`/patterns/sportowo.pl` after merge): today a missing key renders `x.detailMissing`
  with 404 (G31). Recommend redirect to the root's detail (key resolution is already in hand).

### 3. Type pin vs S-04 thresholds

- `appliesTo(threshold, type)` (`src/lib/patterns/over-limit.ts`), `listOverview` and `patternDetail` compare the
  stored kind with `pattern.type`; `ThresholdEditor` picks the kind from its `type` prop (`activeKind`). All read the
  derived `type` — so emitting `pinned_type ?? d5Type(amounts)` from `derivePatterns` makes every consumer follow the
  pin with no other change. S-04's "would change: user-pinned types requiring an explicit reset" is **not triggered**:
  a mismatched row is hidden, re-pinning restores it, saving a new threshold upserts over it.
- A pin equal to the current D5 type must still be stored (it must survive a later flip — US-03 „typ pozostaje bez
  ponownej edycji”).
- Recommend exposing `typeSource: "auto" | "user"` (or `pinned: boolean`) on `MerchantPattern` for any UI that needs
  it (none in the kit; optional).

### 4. Exclusion

- „nie wchodzi do sumy miesięcznej”: PRD Business Logic „Wynik” defines only the monthly *over-limit* sum („suma
  «ponad progiem w tym miesiącu» per miesiąc”); NFR „podstawowe widoki (lista wzorców, suma miesięczna)” refers to
  the same `/home` stat. PRD is otherwise **silent** on a general spending total. Recommendation: excluded ⇒
  `overMinor` 0 and threshold `null` in `listOverview` / `patternDetail`; S-07 sums only non-excluded patterns. Keep
  the threshold row (restore brings it back).
- List: kit `patterns()` filters excluded rows out of the table into `.excluded-section`; `PatternsTable.tsx` carries
  `DESIGN-GAP: G28` for it. Detail: kit `applyPatternState` shows `.inline-alert.info.excluded-banner`
  („Wykluczony z analizy” + „Przywróć”).
- Footer count / sort of the table: plan must decide whether the footer counts only analysed patterns (kit counts the
  table rows).

### 5. Rename

- Display override only; key unchanged. Validation: trim; empty = clear the override (fall back to derived name);
  cap length (recommend DB `check (char_length(display_name) between 1 and 100)` — plan picks the cap). Name collision
  with another pattern: allowed (identity is the key; merge is the tool for true duplicates).
- Kit: „Zmień nazwę” toast „Możesz zmienić nazwę inline.” — no input, so the form is a gap. Kit `.modal-input`
  (radius 8, padding 13, margin 4 0 16) exists in `styles.css` and fits a rename field inside the dialog.

### 6. Migration shape (pattern = `20260927200000_pattern_thresholds.sql` + `pattern_thresholds.test.sql`)

```
pattern_decisions(
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  merchant_key text not null check (char_length(merchant_key) between 1 and 500),
  merged_into text null check (merged_into is null or char_length(merged_into) between 1 and 500),
  excluded boolean not null default false,
  pinned_type text null check (pinned_type in ('fixed','frequent')),
  display_name text null check (display_name is null or char_length(display_name) between 1 and 100),
  created_at / updated_at timestamptz,
  unique (user_id, merchant_key),
  check (merged_into is null or merged_into <> merchant_key)
)
```

RLS on, four per-operation policies for `authenticated` (`(select auth.uid()) = user_id`), `revoke all … from anon`,
`revoke truncate, trigger, references, maintain … from authenticated` — keep UPDATE (upsert). No `import_id`
(invariant `context/archive/2026-09-25-undo-import/follow-ups/review-fixes.md`). pgTAP (mirror
`pattern_thresholds.test.sql`, `plan(22)`): RLS enabled, own insert/upsert/update, cross-user select/update/delete 0
rows and insert with foreign `user_id` rejected, check constraints (self-merge, bad type, length), survival of
`delete from imports`, cascade on `delete_own_account`, anon denied. Then `npm run db:types`.

Write path: one POST route per action or one route with `action` enum; each is a single-row upsert
`onConflict: "user_id,merchant_key"` carrying only the changed column. Plan must verify (smoke) that a partial upsert
leaves other columns intact (e.g. rename after exclude keeps `excluded`) — SQL `on conflict do update` sets only the
columns PostgREST sends for a single-row upsert; not verified live in this step. A row whose attributes are all
default after a restore/clear may be deleted or left — plan choice (a leftover default row is harmless).
Error redirects: parse `key` first and redirect back to the detail with an error param — do not copy the silent
`/patterns` redirect of `src/pages/api/patterns/threshold.ts` (S-04 F4).

### 7. Kit binding (worker report, verified anchors)

- `design/rytm-os/prototype/app.js` `modal(type)` default branch: `.modal-close` (aria „Zamknij”), eyebrow „Akcje na
  wzorcu”, h2 „Zarządzaj wzorcem.”, lead „Decyzje dotyczą wszystkich kolejnych miesięcy. Możesz je później odwrócić w
  ustawieniach wzorca.”, `.modal-actions` 4× `.btn.btn-ghost` (icons merge/switch/edit/exclude) → `closeModal()` +
  toast: „Tryb scalania jest gotowy do podpięcia.”, „Typ wzorca zmieniony.”, „Możesz zmienić nazwę inline.”,
  „Wzorzec wykluczony z analizy.”. Opened from `patternDetail()` `.detail-top` `.detail-actions` btn-ghost
  `icon('more')` „Akcje”.
- `applyPatternState` / `restorePattern`: banner above; restored list item meta „Przywrócony do analizy” +
  `badge('przywrócony','new')`, toast „Wzorzec przywrócony do analizy.”.
- `patterns()` excluded section: `button.excluded-toggle` (icon arrow rotated −90° closed / 0 open, „ Wykluczone ”,
  `<span>1 wzorzec</span>`) → `div.excluded-list.panel` → `.list-item` (`.merchant-mark`, `.item-name`,
  `.item-meta` „Wykluczony z analizy”, `.text-button` „Przywróć”).
- Copy in `content.json` (reachable as `copy.*` in `src/content/copy.ts`, unused in `src/` today):
  `patternActions.{merge,changeType,rename,exclude,restore,excluded,restored}`, `components.excluded`.
  **Only in `app.js`** (K11-class → `copyExtra`): „Akcje”, „Akcje na wzorcu”, „Zarządzaj wzorcem.”, the lead,
  „Wykluczone”, the „N wzorzec/wzorce/wzorców” count, „Przywrócony do analizy”, „przywrócony”, and the four toasts.
- Styles (`prototype/styles.css`): `.modal` width min(480px,100%), radius 13, padding 31; `.modal-backdrop`
  rgba(32,47,64,.44) + padding 20; `.modal-actions` grid gap 8, mt 22, buttons left-aligned; `.modal-input` radius 8;
  `.detail-top` flex space-between mb 22 (≤560 px column, `.detail-actions .btn` full width); `.excluded-section`
  mt 16; `.excluded-list` padding 0 20 inside `.panel`; `.excluded-banner` mb 18; `.badge.excluded` #e3e2df on muted.
- Shared components: `src/components/ui/dialog.tsx` `DialogContent` = `max-w-[440px] p-[22px] rounded-xl` (20 px via
  `--radius: 14px`) + border; overlay `bg-ink/40` — diverges from kit `.modal` (G24). Consumers:
  `src/components/settings/DeleteAccountDialog.tsx`, `src/components/imports/DeleteImportDialog.tsx`.
  `src/components/app/Badge.tsx` tones: fixed / frequent / excess only — no `excluded` / `new` tone (needed for
  `components.excluded` / „przywrócony”). No select/combobox/popover in `src/components/ui/`; `MonthSelect.tsx` is a
  native `<select>` styled with `field-styles.ts` — kit also uses native `.select-field`, so a merge picker as a
  native select inside the dialog is kit-consistent. Icons merge/switch/edit/exclude/more/arrow/info/close exist in
  `public/rytm/icons/ui/ui.svg` and in `ICON_NAMES`.
- Detail page (`src/pages/patterns/[...key].astro`): top is a bare `<div class="mb-[22px]"><BackLink/></div>` — the
  slot for `.detail-top` + `.detail-actions`; results go through query params → `InlineAlert` (`resultAlert`), the
  G30/G31 precedent (no Toast component). Decision results should follow it.

### 8. Candidate DESIGN-GAPs (next free id G33; K22)

Merge target picker; rename field + validation/error; type-change confirmation and threshold statement; exclude
confirmation; undo of merge/type/rename („ustawienia wzorca” absent); pending/error states of decision POSTs;
merged-pattern marking on the detail; absorbed-key URL. G4's status („delivered · 4 akcje + dialog”) overstates the
kit — the plan should amend G4 or add rows. K11: the app.js-only strings above.

### 9. Follow-ups in scope

- S-04 **F5** (`loadThresholds` paging) — fires; page both reads through `collectPages` (needs `id` selected).
- Dialog geometry (G24) + undo-import F4 (bfcache pending reset) — fires with the actions dialog. Two consumers exist,
  so a shared `DialogContent` fix to kit geometry means re-screenshotting `/settings` and `/imports` dialogs; a local
  wrapper would be accidental architecture. Recommend the shared fix (kit is the contract; two consumers, small).
- S-04 **F11** field radius — new fields use kit 8 px locally like `ThresholdEditor` (`rounded-[8px]`).
- S-04 impl-review **F7** (`listOverview` returns island-ready items; two list-item shapes) — fix explicitly
  targets "when S-05/S-06 next touch the list"; S-05 touches `listOverview` for exclusion, so fold it.

## Code References

- `src/lib/patterns/derive.ts` `derivePatterns`, `d5Type`, `median` — grouping hook
- `src/lib/patterns/load.ts` `loadPatterns`, `collectPages`, `PAGE_SIZE` — read/paging
- `src/lib/patterns/thresholds.ts` `loadThresholds` — unpaged (F5)
- `src/lib/patterns/over-limit.ts` `appliesTo`, `overLimit`, `referenceMonth`
- `src/lib/patterns/view.ts` `listOverview`, `patternDetail`, `PatternListOverviewItem`
- `src/lib/patterns/merchant.ts` `merchantKey`, `normalizeMerchant` (rule order load-bearing)
- `src/lib/patterns/path.ts` `patternHref`, `keyFromPath`; `src/lib/patterns/threshold-form.ts` schemas/redirects
- `src/pages/api/patterns/threshold.ts` `POST` — upsert/redirect shape to mirror
- `src/pages/patterns.astro`, `src/pages/patterns/[...key].astro` — the two consumers
- `src/types.ts` `MerchantPattern`, `PatternListItem`, `PatternType`
- `supabase/migrations/20260927200000_pattern_thresholds.sql`, `supabase/tests/database/pattern_thresholds.test.sql`
- `test/unit/patterns.test.ts` `expectedGroups` (splits `user-merge`, 31 groups), `test/fixtures/ing/expected.json`
- `scripts/smoke.mjs` `importPayload`, threshold and import-delete steps

## Architecture Insights

Patterns are pure, derived per request; persisted state (thresholds, now decisions) is keyed by merchant key and
applied at read. That makes „stosowane do kolejnych importów” structural: no write happens at import time. The cost
is the known normalizer-drift risk (`merchant.ts` header) now covering two tables and `merged_into` values.

## Historical Context (from prior changes)

- `context/archive/2026-09-27-pattern-threshold-over-limit/research.md` / `plan.md` — keep-but-ignore on type flip
  (decision 3); "would change: S-05 user-pinned types requiring an explicit reset" — not triggered (§3).
- `context/archive/2026-09-27-pattern-threshold-over-limit/change.md` — thresholds deliberately kept out of a shared
  decisions table; S-05 adds its own.
- `context/archive/2026-09-27-pattern-threshold-over-limit/follow-ups/review-fixes.md` F5; `reviews/impl-review.md` F7.
- `context/archive/2026-09-25-undo-import/follow-ups/review-fixes.md` — merchant-key invariant; dialog/F4 follow-ups.
- `context/archive/2026-09-23-domain-schema-rls/plan.md` — "każdy wycinek dodaje własną migrację według tej samej
  reguły RLS + kaskady".

## Related Research

`context/archive/2026-09-27-pattern-threshold-over-limit/research.md`, `context/archive/2026-09-25-merchant-patterns/`.

## Open Questions (plan decisions, not missing evidence)

1. Read ordering: decisions passed into `loadPatterns` vs derive in the page after `Promise.all`.
2. Undo UI for merge/type/rename (gap) — minimal in S-05 or deferred with a follow-up.
3. Picker contents (non-excluded roots only?) and absorbed-key URL (redirect vs 404).
4. Rename length cap; whether an all-default decision row is deleted.
5. Shared `DialogContent` fix now (recommended) vs local wrapper.
6. Partial single-row upsert preserving untouched columns — assert in smoke during implement.
