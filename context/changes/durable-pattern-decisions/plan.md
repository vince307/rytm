# Trwałe decyzje o wzorcach (S-05 `durable-pattern-decisions`) Implementation Plan

## Overview

Let a signed-in user merge one pattern into another, exclude a pattern from the analysis (and restore it), pin its
type (stały / częsty) and rename it — from the kit's „Akcje” dialog on the pattern detail (FR-009, US-03). Every
decision is one row per `(user_id, merchant_key)` in a new table `pattern_decisions` (never `import_id`), applied
**inside `derivePatterns`, before grouping**, so a later import re-derives into the same merged / pinned / renamed /
excluded pattern with no further edit, and a deleted import leaves the decisions in place (US-02 AC). An excluded
pattern generates no „ponad próg” and moves from the `/patterns` table into the kit's collapsible „Wykluczone”
section. The slice also closes the follow-ups that fire on it: S-04 F5 (paged threshold read), S-04 impl-review F7
(island-ready list items), undo-import F4 + S-04 F8 (bfcache pending reset) and the shared dialog geometry (G24).

## Current State Analysis

Source: `context/changes/durable-pattern-decisions/research.md` (code, PRD, kit, fixture), re-checked here against
the files named below at `main` `f252112`.

- **Patterns are derived per request, no pattern table.** `src/lib/patterns/load.ts` `loadPatterns` pages every
  debit by keyset (`collectPages`, `.order("id")` + `.gt("id", afterId)`) and returns `{ patterns:
  derivePatterns(rows), rows }`. `src/lib/patterns/derive.ts` `derivePatterns(rows)` groups by
  `merchantKey(rawMerchant(counterparty, title))`; name = most frequent `normalizeMerchant` variant (tie →
  code-point smallest); `type = d5Type(amounts)`; `fixedAmountMinor = type === "fixed" ? medianMinor : null`; sort by
  sum desc, name (`pl`), key. There is no input for any user decision.
- **Two consumers, same duplicated read.** `src/pages/patterns.astro` and `src/pages/patterns/[...key].astro` each
  run `Promise.all([loadPatterns, loadThresholds])` and handle the error pair by hand; the list re-merges
  `listOverview` items by key through a second `Map` (S-04 impl-review F7).
- **Thresholds.** `src/lib/patterns/thresholds.ts` `loadThresholds` is an **unpaged** `select("merchant_key, kind,
  value")` (S-04 F5 — trigger names S-05). `src/lib/patterns/view.ts` `listOverview` / `patternDetail` apply a stored
  threshold only when `appliesTo(threshold, pattern.type)` (`src/lib/patterns/over-limit.ts`); `ThresholdEditor`
  picks its kinds from the `type` prop. So every consumer already follows the derived `type` — a pinned type emitted
  by `derivePatterns` needs no other change (research §3).
- **Write precedent.** `src/pages/api/patterns/threshold.ts` `POST` (guard → formData → zod → upsert `onConflict:
  "user_id,merchant_key"` → redirect with a status param built by `src/lib/patterns/threshold-form.ts`
  `thresholdRedirect` / `src/lib/patterns/path.ts` `patternHref`). Its invalid-form branch redirects silently to
  `/patterns` (S-04 F4 — not to be copied).
- **Migration precedent.** `supabase/migrations/20260927200000_pattern_thresholds.sql` (per-operation policies for
  `authenticated`, keeps UPDATE for upserts, revokes `truncate, trigger, references, maintain`, `anon` revoked) and
  `supabase/tests/database/pattern_thresholds.test.sql` (`plan(22)`).
- **Detail page.** `src/pages/patterns/[...key].astro` renders a bare `<div class="mb-[22px]"><BackLink/></div>` where
  the kit has `.detail-top` + `.detail-actions`; result lines are redirect params → `InlineAlert` (S-04 decision 15,
  no Toast component). Unknown key → 404 + `x.detailMissing` (G31).
- **List.** `src/components/patterns/PatternsTable.tsx` carries `DESIGN-GAP: G28` for the excluded section; footer =
  visible row count. The empty state renders when there are no patterns.
- **Shared UI.** `src/components/ui/dialog.tsx` `DialogContent` = `max-w-[440px] p-[22px] rounded-xl`, overlay
  `bg-ink/40`, no side margin at 400 px — diverges from kit `.modal` (480 px, padding 31, radius 13; backdrop
  `rgba(32,47,64,.44)` + padding 20). Consumers: `src/components/settings/DeleteAccountDialog.tsx`,
  `src/components/imports/DeleteImportDialog.tsx` (its `pending` state never resets on bfcache restore — undo-import
  F4; `ThresholdEditor` `saving` has the same bug — S-04 F8). Icons `merge`, `switch`, `edit`, `exclude`, `more` are
  in `ICON_NAMES` (`src/content/copy.ts`). `src/components/hooks/` does not exist yet.
- **Kit.** `design/rytm-os/prototype/app.js` `patternDetail()` (`.detail-actions` ghost button `icon('more')`
  „Akcje” → `modal('patternActions')`: eyebrow „Akcje na wzorcu”, h2 „Zarządzaj wzorcem.”, lead, `.modal-actions`
  with four ghost buttons that only fire toasts), `applyPatternState` (`.inline-alert.info.excluded-banner`
  „Wykluczony z analizy” + text-button „Przywróć”), `patterns()` (`.excluded-section` / `.excluded-toggle` /
  `.excluded-list` `.list-item`, meta „Wykluczony z analizy”, „Przywróć”). Copy keys `patternActions.{merge,
  changeType, rename, exclude, restore, excluded, restored}` exist in `content.json` (reachable as
  `copy.patternActions`); the modal texts, „Akcje”, „Wykluczone” and the toasts exist only in `app.js` (K11 class).
  No merge picker, rename field, merge undo or pending / error state exists in the kit. Next free gap ids **K22**,
  **G33**.
- **Oracle.** `test/fixtures/ing/expected.json`: 30 oracle groups; `sportowo` (`resolvedBy: "user-merge"`, raw keys
  `sportowo` and `sportowo.pl`, 8 occurrences) and `przelew-konto-osobiste` (`resolvedBy: "user-exclude"`, a hand
  slug — the real `merchantKey` is whatever key `derivePatterns` gives that group). `test/unit/patterns.test.ts`
  `expectedGroups` splits `user-merge` back by raw merchant (31 groups) because no decisions exist yet.
- **Smoke user.** After „pattern detail drops the over-limit mark after removal” the smoke user owns one May-2026
  import: „Sklep smoke” 12,99 zł (2026-05-04) and „Kawiarnia smoke” 45,50 zł (2026-05-20), no threshold. The runner
  (`scripts/smoke.mjs` `steps`) checks `status`, `location` (prefix), `contains`, `notContains`.

## Desired End State

- `/patterns/<key>` has the kit `.detail-top`: back link left, ghost button „Akcje” right (full width ≤ 560 px). It
  opens the kit dialog („Akcje na wzorcu” / „Zarządzaj wzorcem.” / lead) with „Scal z…”, „Zmień typ”, „Zmień nazwę”,
  „Wyklucz z analizy”. „Zmień typ” and „Wyklucz z analizy” act on click; „Scal z…” reveals a select of the other
  analysed patterns + „Scal”; „Zmień nazwę” reveals a text field + „Zapisz nazwę”.
- A merged pattern shows the union of its components (count, sums, D5 type, over-limit), lists its merged variants
  with „Cofnij scalenie”, and the absorbed key's URL redirects to it. A pinned type holds across imports; a renamed
  pattern shows the new name on the list and the detail; an excluded pattern shows the kit banner „Wykluczony z
  analizy” + „Przywróć”, has no „ponad próg” anywhere, and appears in the list's „Wykluczone” section instead of the
  table.
- Every decision redirects back with a result line (kit toast text where the kit has one, placeholder otherwise); an
  invalid merge / name shows an error line on the detail.
- Decisions persist per merchant key: a second, non-overlapping import joins the merged pattern and keeps the pinned
  type, name and exclusion (US-03); deleting an import keeps them (US-02 AC).
- Verified by: pgTAP +26 (new file), vitest +3 files, smoke +34, screenshots of every named state.

### Key Discoveries:

- Decisions must act **before grouping**: resolving each row's key to its root key first is what makes „liczba i suma
  scalonego = suma składników” and „każda transakcja liczy się raz” hold by construction (`derivePatterns`).
- A partial single-row upsert (`upsert({ merchant_key, excluded: true })`) makes PostgREST emit `on conflict do update
  set` for the sent columns only — untouched decisions survive. pgTAP proves the SQL; smoke proves it through
  PostgREST („rename keeps the exclusion”).
- The fixture already carries the S-05 acceptance oracle (`user-merge`, `user-exclude`), so the durability proof needs
  no new fixture file: unit derive with decisions = oracle 30 groups, a date-split derive, a smoke second import.
- Smoke assertions on island content use the `>text<` form (agent contract); the detail's heading, banner and
  merged-variants list are SSR Astro, the „Akcje” label is rendered in its own `<span>`.

## What We're NOT Doing

- No `/home` stat, no monthly trend (S-07) and no fixed-cost change badges `nowy` / `zmiana kwoty` (S-06). S-05 only
  exposes `excluded` on `MerchantPattern`; S-07 must drop excluded patterns from any monthly sum it builds.
- No „przywrócony” badge / „Przywrócony do analizy” list state and no `excluded` / `new` Badge tones: after the SSR
  redirect a restored pattern is back in the table, so there is no row to badge (G33 notes it).
- No return to the automatic (D5) type once pinned — „Zmień typ” toggles the pinned type (G33). No history / audit of
  decisions, no `updated_at` (S-04 decision 5).
- No separate „ustawienia wzorca” screen (the kit lead names one; the dialog and detail are that place — G33).
- No change to `normalizeMerchant` (rule order is load-bearing; a change would orphan thresholds, decisions and
  `merged_into` values).
- No change to the threshold endpoints' silent invalid-form redirect (S-04 F4 stays open; the new endpoint does not
  copy it). No app-wide field-radius sweep (S-04 F11 stays open; new fields use kit 8 px locally). No change to
  `DeleteAccountDialog`'s pending handling (not named by F4).
- No merge from the list (the kit puts every action on the detail) and no multi-select merge.
- No manual deploy phase: the run's Ship step runs `npx supabase db push` before merge.

## Implementation Approach

Seven small phases, each independently green on the full local gate and committed on green by a fresh agent:
storage (migration + pgTAP) → pure derivation with decisions and its oracle → the read path (paged reads, one
pattern-data read, absorbed-key redirect) with no visible change → the write endpoint and the US-03 smoke → the
shared dialog / bfcache fix on its own (cross-view screenshots) → the detail UI → the list UI + seam sweep. At most
two new UI components per phase. Baseline for every delta (agent contract, `main` `f252112`): lint 0 · astro check
0 errors (109 files) · fixture:check OK · vitest 141 (8 files) · build OK · pgTAP 76 (4 files) · smoke 77 PASS. Each
phase re-measures its own starting point and writes `baseline + delta`.

Local gate (every phase):

```bash
npm run lint && npx astro check && npm run fixture:check && npm test && npm run build
npx supabase db reset && npx supabase test db
ASTRO_DEV_BACKGROUND=1 npx astro dev --port 4398 --ignore-lock &   # then
BASE_URL=http://localhost:4398 npm run smoke                        # then: lsof -ti :4398 | xargs kill
```

(Docker / `127.0.0.1:54321` commands run with the sandbox disabled; never port 4321. After Phase 1:
`npm run db:types`.)

## Critical Implementation Details

- **Key resolution order.** `derivePatterns` resolves each row's own `merchantKey` to its **root** (follow
  `mergedInto` until a key without one) and groups by the root. Only the root's decision applies to the group
  (`excluded`, `pinnedType`, `displayName`); an absorbed key's own decision fields and threshold stay stored but inert,
  and return on „Cofnij scalenie”. A cycle (only reachable through races or crafted POSTs — the endpoint accepts only
  a current root as target) resolves every key on the cycle to the **code-point-smallest key of the cycle**, so the
  result stays deterministic and input-order independent.
- **Partial upserts.** Every decision write sends only `merchant_key` plus the one column it changes, with `onConflict:
  "user_id,merchant_key"`; never spread a full decision object (it would reset the other decisions to defaults).
  „Cofnij scalenie” is an `update … set merged_into = null` on the absorbed key's row.
- **Merge is the only write that reads.** It needs the current roots to reject self-merge, unknown / absorbed targets
  and excluded targets; all other actions write blind (S-04 decision 7 precedent).
- **Absorbed-key URL.** The detail resolves the requested key through the decisions before looking it up; a key whose
  root differs and exists → `302` to `patternHref(root)`; otherwise the existing 404 state.

## Phase 1: `pattern_decisions` table and its proofs

### Overview

Persist one decision row per (user, merchant key) under per-operation RLS, proven by a new pgTAP file; regenerate
types. No app code reads it yet.

### Changes Required:

#### 1. Migration

**File**: `supabase/migrations/20260928120000_pattern_decisions.sql` (new)

**Intent**: The per-user decision store (FR-009); survives import deletion (no `import_id`), cascades from the
account, mutable in place (upserts need UPDATE).

**Contract**: header comment citing FR-009 / US-03 / US-02 AC / FR-019, the keep-UPDATE reasoning of
`20260927200000_pattern_thresholds.sql`, and that a merge is stored on the **absorbed** key's row. Table
`public.pattern_decisions`: `id bigint generated always as identity primary key`; `user_id uuid not null default
auth.uid() references auth.users(id) on delete cascade`; `merchant_key text not null check (char_length(merchant_key)
between 1 and 500)`; `merged_into text null check (merged_into is null or char_length(merged_into) between 1 and
500)`; `excluded boolean not null default false`; `pinned_type text null check (pinned_type in ('fixed',
'frequent'))`; `display_name text null check (display_name is null or char_length(display_name) between 1 and 100)`;
`created_at timestamptz not null default now()`; `unique (user_id, merchant_key)`; `check (merged_into is null or
merged_into <> merchant_key)` (named `pattern_decisions_no_self_merge`). `comment on table`. RLS enabled; four
policies for `authenticated` named `"pattern_decisions: authenticated <select|insert|update|delete> own"`, each
`(select auth.uid()) = user_id` (update: `using` + `with check`). `revoke all … from anon`; `revoke truncate,
trigger, references, maintain … from authenticated` — **not** `update`. No function changes.

#### 2. pgTAP proof

**File**: `supabase/tests/database/pattern_decisions.test.sql` (new)

**Intent**: RLS isolation per operation, the partial-upsert path the app uses, constraints, import-delete survival,
account-delete cascade.

**Contract**: style of `pattern_thresholds.test.sql` (`begin; … select plan(26); … select * from finish();
rollback;`, users A/B with fixed UUIDs, A owns one import with one transaction inserted as `postgres`). Assertions:
1. RLS enabled on `pattern_decisions`.
2. `authenticated` lacks TRUNCATE.
3. As A: insert `('sportowo.pl', merged_into 'sportowo')` without `user_id` → `lives_ok`.
4. As A: that row's `user_id` is A.
5. As A: insert `('sportowo', display_name 'Sportowo')` → `lives_ok`.
6. As A: `insert (merchant_key, excluded) values ('sportowo', true) on conflict (user_id, merchant_key) do update set
   excluded = excluded.excluded` → `lives_ok`.
7. As A: `sportowo` has `excluded = true` **and** `display_name = 'Sportowo'` (the partial upsert kept the other
   column).
8. As A: `update … set pinned_type = 'fixed' where merchant_key = 'sportowo'` returns 1 row.
9. As A: plain insert of a second `sportowo` → 23505.
10. Self-merge (`merchant_key = merged_into`) → 23514.
11. `pinned_type = 'weekly'` → 23514.
12. `display_name = ''` → 23514.
13. `display_name` of 101 characters → 23514.
14. `merchant_key = ''` → 23514.
15. `merged_into = ''` → 23514.
16. As B: sees 0 rows of A.
17. As B: update of A's row → 0 rows.
18. As B: delete of A's row → 0 rows.
19. As B: insert with `user_id` = A → 42501.
20. As B: own `sportowo` row → `lives_ok` (keys are per user).
21. As B: moving own row to `user_id` = A → 42501.
22. As A: `sportowo` still `excluded`, `pinned_type = 'fixed'`, `display_name = 'Sportowo'` (B changed nothing).
23. As A: deleting A's import leaves both decision rows (US-02 AC).
24. As A: `select public.delete_own_account()`; then as `postgres`: 0 rows with `user_id` = A.
25. As `postgres`: B's row still exists.
26. `anon` insert → 42501.

#### 3. Types

**Files**: `src/db/database.types.ts` (generated — `npm run db:types`), `src/types.ts`

**Contract**: `PatternDecisionRow = Tables<"pattern_decisions">` beside `PatternThresholdRow`.

### Success Criteria:

#### Automated Verification:

- `npx supabase db reset && npx supabase test db` — pgTAP baseline 76 (4 files) + 26 = 102 (5 files), all pass
- `npm run db:types` regenerates `src/db/database.types.ts` with `pattern_decisions`; `git diff` of that file shows only the new table
- `npm run lint` 0 errors; `npx astro check` 0 errors (baseline 109 files, record the count); `npm test` 141 (delta 0); `npm run fixture:check` OK; `npm run build` passes
- `BASE_URL=http://localhost:4398 npm run smoke` — 77 PASS (delta 0)
- Deliberate break (update policy, scratch edit + `db reset`): drop the update policy → assertions 6–8 FAIL; restored → green. Meta-check: assertions 3 and 5 (plain inserts) stay green, so the red proves the partial-upsert path reaches the UPDATE policy
- Deliberate break (self-merge check removed) → assertion 10 FAILs; restored → green. Meta-check: 11–15 stay green, so the red is the named check, not a generic constraint failure
- Deliberate break (FK without `on delete cascade`) → assertion 24 FAILs; restored → green. Meta-check: the count runs as `postgres`, so the red proves the cascade, not an RLS filter
- Migration file name matches `^[0-9]{14}_[a-z_]+\.sql$` and sorts after `20260927200000_pattern_thresholds.sql`

#### Manual Verification:

- [reviewer] Policies per operation and per role (`authenticated` only), update has `using` + `with check`, no `import_id`, `user_id` FK `on delete cascade`, no `revoke update`
- [reviewer] pgTAP 16–21 read as RLS proofs, 6–7 as the partial upsert, 23 as US-02 survival, 24–25 as FR-019 cascade; the handoff records which break proved which

**Implementation Note**: proceed on green automated criteria; `[reviewer]` rows are closed by `/10x-impl-review`.

---

## Phase 2: Decisions in derivation and view models (pure, with fixture oracle)

### Overview

`derivePatterns` takes the decisions; `listOverview` / `patternDetail` honour `excluded`. No caller passes decisions
yet, so the app is unchanged.

### Changes Required:

#### 1. Types

**File**: `src/types.ts`

**Contract**: `interface PatternDecision { mergedInto: string | null; excluded: boolean; pinnedType: PatternType |
null; displayName: string | null }`. `MerchantPattern` gains `excluded: boolean` and `merged: { key: string; name:
string }[]` (absorbed keys that have rows in this group, sorted by key; `name` = that key's most frequent variant).
`PatternListItem` additionally omits `merged` (it keeps `excluded`).

#### 2. Derivation

**File**: `src/lib/patterns/derive.ts`

**Intent**: Apply the decisions before grouping (Critical Implementation Details), so every aggregate is computed on
the union.

**Contract**: `resolveKey(key: string, decisions: ReadonlyMap<string, PatternDecision>): string` — follows
`mergedInto` to the root; a cycle → the code-point-smallest key on the cycle. `derivePatterns(rows, decisions:
ReadonlyMap<string, PatternDecision> = new Map())` — groups by `resolveKey(merchantKey(raw), decisions)`; `name =
decision.displayName ?? most-frequent variant over the union`; `type = decision.pinnedType ?? d5Type(amounts)`;
`fixedAmountMinor = type === "fixed" ? medianMinor : null` (unchanged rule, also for a pinned-fixed pattern outside
the tolerance); `excluded = decision.excluded ?? false`; `merged` as above. Only the root's decision is read. Sort
unchanged (by the display name). Header comment names the S-05 rule.

#### 3. View models

**File**: `src/lib/patterns/view.ts`

**Intent**: „Wykluczony wzorzec nie generuje «ponad próg»” in the one place both views read.

**Contract**: `listOverview`: an excluded pattern keeps its applicable `threshold` but `overMinor` is 0.
`patternDetail`: an excluded pattern keeps `threshold` (the panel still shows it — decision 8) but runs no over-limit
pass — `overMinor` 0, `sequence` all `false`, every transaction `overMinor` 0. Header comment updated.

#### 4. Unit tests

**Files**: `test/unit/patterns.test.ts`, `test/unit/pattern-decisions.test.ts` (new), `test/unit/pattern-view.test.ts`

**Contract**:
- `patterns.test.ts`: the existing F-02 block stays as is (no decisions → 31 groups). New block „derivePatterns with
  the fixture decisions”: decisions `sportowo.pl → sportowo` and `excluded` on the real key of the oracle's
  `przelew-konto-osobiste` group → the partition equals the oracle's 30 groups (a new `oracleGroups()` helper that
  does not split `user-merge`); `sportowo` has the oracle's occurrence count and sum (= the sum of its two components
  without decisions) and `merged` lists `sportowo.pl`; the excluded group has `excluded: true`; determinism under a
  shuffle.
- `pattern-decisions.test.ts`: `resolveKey` direct, chain `a → b → c`, unknown key, 2-cycle and 3-cycle (every key on
  the cycle → smallest), cycle entered from a tail; `derivePatterns`: pinned type overrides D5 both ways;
  `displayName` wins over variants; an absorbed key's own `excluded` / `pinnedType` / `displayName` are ignored;
  **US-03 date split**: rows before a cut-off and all rows derived with the same decisions — the later rows of the
  absorbed raw merchant land in the merged group, the pinned `fixed` holds although D5 over all rows says `frequent`,
  the name and `excluded` hold.
- `pattern-view.test.ts`: excluded pattern with an applicable threshold → list `overMinor` 0 while the same pattern
  non-excluded is > 0; detail keeps `threshold`, `overMinor` 0, all-`false` `sequence`, all transaction `overMinor` 0.
  Existing `MerchantPattern` literals gain `excluded: false`, `merged: []`.

#### 5. List page literal (keeps this phase green)

**File**: `src/pages/patterns.astro`

**Contract**: `PatternListItem = Omit<MerchantPattern, …>` now requires `excluded`, so the page's hand-built
`PatternListItem` literal (the `overviewByKey` re-merge, removed in Phase 3) gains `excluded: pattern.excluded` —
otherwise `npx astro check` is red in this phase (plan review F2). No other change to the page.

### Success Criteria:

#### Automated Verification:

- `npm test` — Phase 1 count (141, 8 files) + 1 file, every new case green, 0 failures (record the new total)
- `npm run lint` 0 errors; `npx astro check` 0 errors (record the count)
- `npm run fixture:check` OK; `npm run build` passes
- `npx supabase db reset && npx supabase test db` — 102 (delta 0)
- `BASE_URL=http://localhost:4398 npm run smoke` — 77 PASS (delta 0)
- Deliberate break (chains): make `resolveKey` follow one hop only → the chain case FAILs; restored → green. Meta-check: the direct-merge fixture case stays green, so the red proves chain resolution, not merging itself
- Deliberate break (pin): compute `type = d5Type(amounts)` ignoring `pinnedType` → the date-split and pin cases FAIL; restored → green. Meta-check: the fixture partition case stays green, so the red isolates the pin
- Deliberate break (exclusion): drop the `excluded` check in `listOverview` → the excluded-list case FAILs; restored → green. Meta-check: the non-excluded twin stays > 0, proving the threshold does apply and only exclusion zeroes it

#### Manual Verification:

- [reviewer] Only the root's decision is read in `derivePatterns`; no decision is applied after grouping; the cycle rule is deterministic and documented in the header comment

**Implementation Note**: proceed on green automated criteria.

---

## Phase 3: Paged reads, one pattern-data read, absorbed-key redirect

### Overview

Read decisions and thresholds through keyset paging (F5), serve both pages from one entry point that derives with the
decisions, return island-ready list items (F7) and redirect an absorbed key. No decisions exist yet → no visible
change.

### Changes Required:

#### 1. Decisions read

**File**: `src/lib/patterns/decisions.ts` (new)

**Contract**: `loadDecisions(supabase): Promise<{ decisions: Map<string, PatternDecision> } | { error: unknown }>` —
`collectPages` over `select("id, merchant_key, merged_into, excluded, pinned_type, display_name")`, `.order("id")
.limit(PAGE_SIZE)` + `.gt("id", afterId)`; a `pinned_type` outside the two types is read as `null` (defensive, as
`loadThresholds` skips unknown kinds).

#### 2. Thresholds read paged

**File**: `src/lib/patterns/thresholds.ts`

**Intent**: Close S-04 F5.

**Contract**: same keyset shape, selecting `id` too; the „does not page” comment replaced. `collectPages`' MAX_PAGES
error text in `load.ts` made read-neutral („paged read exceeded MAX_PAGES …”).

#### 3. One pattern-data read

**File**: `src/lib/patterns/load.ts`

**Intent**: One entry point for both pages, the merge endpoint (Phase 4), S-06 and S-07.

**Contract**: `loadPatternData(supabase): Promise<{ patterns: MerchantPattern[]; rows: PatternSource[]; thresholds:
Map<string, Threshold>; decisions: Map<string, PatternDecision> } | { error: unknown }>` — the transactions, threshold
and decision reads in parallel (`Promise.all`), any error fails the whole read, then `derivePatterns(rows,
decisions)`. `loadPatterns` is removed (its read becomes a private helper); header comment updated.

#### 4. View helpers

**Files**: `src/lib/patterns/view.ts`, `src/types.ts`

**Intent**: F7 — the page stops re-merging by key; the detail's lookup is pure and testable.

**Contract**: `listOverview(patterns, rows, thresholds): { referenceMonth: string | null; items: PatternListItem[] }`
(island-ready, carries `excluded`); `PatternListOverviewItem` removed. `detailTarget(key, patterns, decisions):
{ kind: "found"; pattern } | { kind: "redirect"; key: string } | { kind: "missing" }` — `redirect` when
`resolveKey(key)` differs from `key` and that root is among `patterns`.

#### 5. Pages

**Files**: `src/pages/patterns.astro`, `src/pages/patterns/[...key].astro`

**Contract**: both call `loadPatternData` (unconfigured client → the existing error branch). List: `items =
listOverview(…).items` — no second `Map`; rendering unchanged (excluded rows still in the table until Phase 7). Detail:
`detailTarget` → `found` renders as today (threshold from `thresholds.get(pattern.key)`), `redirect` →
`Astro.redirect(patternHref(target.key), 302)`, `missing` → the 404 state.

#### 6. Unit tests

**File**: `test/unit/pattern-view.test.ts`

**Contract**: `detailTarget`: plain key found; absorbed key → redirect to its root (also via a chain); absorbed key
whose root has no rows → missing; unknown key → missing. `listOverview` returns full `PatternListItem`s in pattern
order.

### Success Criteria:

#### Automated Verification:

- `npm test` — Phase 2 count + the new cases, 0 failures (record the total)
- `npm run lint` 0 errors; `npx astro check` 0 errors (record the count)
- `npm run fixture:check` OK; `npm run build` passes
- `npx supabase db reset && npx supabase test db` — 102 (delta 0)
- `BASE_URL=http://localhost:4398 npm run smoke` — 77 PASS (delta 0; proves the list, the detail and the threshold steps still read through the three paged reads against a real PostgREST)
- Deliberate break (redirect): make `detailTarget` return `missing` instead of `redirect` → the absorbed-key cases FAIL; restored → green. Meta-check: smoke stays green under the break (no decision rows exist yet), so only the unit case proves it until Phase 4's „absorbed pattern redirects” step
- Deliberate break (derive input): pass `new Map()` instead of `decisions` to `derivePatterns` in `loadPatternData` → build and unit tests stay green; record that nothing catches it yet and that Phase 4's smoke step „merged pattern sums its components” is the guard (re-checked there)

#### Manual Verification:

- [reviewer] `loadThresholds` and `loadDecisions` both page through `collectPages` with `.order("id")` and `.gt("id", afterId)`; no page calls `loadThresholds` / `loadPatterns` directly any more; `patterns.astro` has no second `Map` (F7)

**Implementation Note**: proceed on green automated criteria.

---

## Phase 4: Decision endpoint and the US-03 durability smoke

### Overview

One form-POST endpoint for all six decisions, its pure parser, and the smoke run that makes the decisions, imports a
second month and checks nothing needs re-editing. No UI yet — smoke posts directly.

### Changes Required:

#### 1. Form parsing and redirects

**File**: `src/lib/patterns/decision-form.ts` (new)

**Intent**: Validation and redirect targets provable without a server; key parsed first (S-04 F4 lesson).

**Contract**:
- `decisionKeySchema = z.object({ key: z.string().min(1).max(500) })` (parsed first, `passthrough`).
- `decisionSchema` = discriminated union on `action`: `merge` (`target` 1–500), `unmerge` (`source` 1–500), `type`
  (`type` ∈ `fixed` | `frequent`), `rename` (`name` string), `exclude`, `restore` (optional `back: "list"`).
- `parseDisplayName(raw): string | null | "invalid"` — trim; empty → `null` (clears the override); > 100 characters →
  `"invalid"`.
- `validateMerge(patterns, source, target): boolean` — both are current roots (in `patterns`), `target !== source`,
  target not excluded.
- `decisionRedirect(key, status, back?)` with statuses `merged | unmerged | typed | renamed | excluded | restored |
  error-merge | error-name | error-decision` → `patternHref(key, { <status param> })` (`merged=1`, …,
  `error=merge|name|decision`); `back === "list"` → `/patterns?restored=1` / `/patterns?error=decision`.

#### 2. Endpoint

**File**: `src/pages/api/patterns/decision.ts` (new)

**Intent**: Write one decision for the caller.

**Contract**: `export const prerender = false`; `POST`; guard as `src/pages/api/patterns/threshold.ts`; formData in
try/catch; no usable `key` → `/patterns`; key usable but `decisionSchema` fails → `error-decision` on the key's detail.
Per action, table `pattern_decisions`, `onConflict: "user_id,merchant_key"`, only the named column:
- `merge`: `loadPatternData`; read error → `error-decision`; `!validateMerge` → `error-merge` (source detail); else
  upsert `{ merchant_key: key, merged_into: target }` → `merged` on the **target**'s detail.
- `unmerge`: `update({ merged_into: null }).eq("merchant_key", source)` → `unmerged` on `key`'s detail (idempotent).
- `type`: upsert `{ merchant_key: key, pinned_type: type }` → `typed`.
- `rename`: `parseDisplayName` → `"invalid"` → `error-name`; else upsert `{ merchant_key: key, display_name }` →
  `renamed`.
- `exclude` / `restore`: upsert `{ merchant_key: key, excluded: true | false }` → `excluded` / `restored` (`back`
  honoured).
Any DB error → `console.error("pattern decision failed", action, code, message)` + `error-decision`. The client never
sends `user_id`.

#### 3. Unit tests

**File**: `test/unit/decision-form.test.ts` (new)

**Contract**: schema accepts each action and rejects an unknown action, a missing `target` / `source`, a type
`weekly`, a 501-char key; `parseDisplayName` („  Sportowo  ” → „Sportowo”, „” and „   ” → `null`, 100 chars ok, 101 →
`"invalid"`); `validateMerge` (ok; self; unknown target; absorbed target not among roots; excluded target; unknown
source); `decisionRedirect` for every status incl. `back: "list"` and a key with a space.

#### 4. Smoke

**File**: `scripts/smoke.mjs`

**Intent**: US-03 end to end over HTTP, including the partial upsert and a later import.

**Contract**: a second payload `importPayloadJune` (same account, 2026-06-01 – 2026-06-30, new `bankTxId`s):
„Sklep smoke” 12,99 zł (2026-06-04), „Piekarnia smoke” 8,00 zł (2026-06-10), „Kawiarnia smoke” 47,00 zł
(2026-06-20). After „pattern detail drops the over-limit mark after removal”, all POSTs to `/api/patterns/decision`:
1. „decision with an unknown action is rejected” — `{ key: "kawiarnia smoke", action: "nope" }` → 302
   `/patterns/kawiarnia%20smoke?error=decision`.
2. „merge into itself is rejected” — `{ key: "sklep smoke", action: "merge", target: "sklep smoke" }` → 302
   `/patterns/sklep%20smoke?error=merge`.
3. „pattern is merged” — `{ key: "sklep smoke", action: "merge", target: "kawiarnia smoke" }` → 302
   `/patterns/kawiarnia%20smoke?merged=1` (merged name stays „Kawiarnia smoke”: 1 : 1 variant tie → code-point
   smallest).
4. „merged pattern sums its components” — GET `/patterns/kawiarnia%20smoke` → 200 contains `>58,49 zł<`.
5. „merged pattern is re-typed by D5” — same → contains `>częsty<` (12,99 / 45,50 are outside the 10 zł tolerance).
6. „absorbed pattern redirects to the merged one” — GET `/patterns/sklep%20smoke` → 302 `/patterns/kawiarnia%20smoke`.
7. „patterns list shows one merged row” — GET `/patterns` → 200 notContains `>Sklep smoke<`.
8. „type is pinned” — `{ key: "kawiarnia smoke", action: "type", type: "fixed" }` → 302 `…?typed=1`.
9. „pinned type shows on the detail” — contains `>stały<`.
10. „threshold on the pinned type is saved” — POST `/api/patterns/threshold` `{ key: "kawiarnia smoke", kind:
    "amount", value: "40" }` → 302 `…?saved=1`.
11. „pinned type takes the amount threshold” — detail contains `>5,50 zł<`.
12. „pattern is excluded” — `action: "exclude"` → 302 `…?excluded=1`.
13. „excluded pattern has no over-limit” — detail contains `>stały<`, notContains `>5,50 zł<`.
14. „rename with an over-long name is rejected” — `action: "rename"`, 101 × „a” → 302 `…?error=name`.
15. „pattern is renamed” — `name: "Kawiarnia Rytm"` → 302 `…?renamed=1`.
16. „rename keeps the exclusion” — detail contains `>Kawiarnia Rytm<`, notContains `>5,50 zł<` (a full-row upsert
    would have reset `excluded` and brought 5,50 back).
17. „import after the decisions is saved” — POST `/api/imports` `importPayloadJune` → 302 `/imports/result?id=`.
18. „later import joins the merged pattern” — detail contains `>59,99 zł<` (June: 12,99 + 47,00).
19. „later import keeps the pinned type” — contains `>stały<` (D5 over the four amounts says częsty).
20. „later import keeps the name” — detail contains `>Kawiarnia Rytm<`.
21. „later import keeps the exclusion” — detail notContains `>7,00 zł<`.
22. „pattern is restored” — `action: "restore"` → 302 `…?restored=1`.
23. „restored pattern shows its over-limit again” — detail contains `>7,00 zł<` (47,00 − 40,00; the threshold was
    kept).
24. „merge is undone” — `{ key: "kawiarnia smoke", action: "unmerge", source: "sklep smoke" }` → 302 `…?unmerged=1`.
25. „unmerged pattern has its own detail again” — GET `/patterns/sklep%20smoke` → 200 contains `>Sklep smoke<`.
Next to the anonymous steps: 26. „decision without a session goes to login” — anonymous POST → 302 `/login`.
(Phase 6 and 7 insert their steps between these.)

### Success Criteria:

#### Automated Verification:

- `npm test` — Phase 3 count + 1 file, 0 failures (record the total)
- `npm run lint` 0 errors; `npx astro check` 0 errors (record the count)
- `npm run fixture:check` OK; `npm run build` passes
- `npx supabase db reset && npx supabase test db` — 102 (delta 0)
- `BASE_URL=http://localhost:4398 npm run smoke` — 77 + 26 = 103 PASS
- Deliberate break (partial upsert): make the rename upsert send `{ merchant_key, display_name, excluded: false }` → „rename keeps the exclusion” FAILs; restored → PASS. Meta-check: „pattern is renamed” still PASSes, so the red proves the untouched column survives, not that rename works
- Deliberate break (read applies decisions): pass `new Map()` to `derivePatterns` in `loadPatternData` → steps 4, 5, 13, 16 FAIL while the writes (steps 3, 8, 12, 15) PASS; restored → PASS. Meta-check: steps 6, 9 and 11 stay green (the redirect reads the decisions map directly, and „Kawiarnia smoke” alone is D5-fixed), so only the merged sum, the D5 re-type, the exclusion and the name prove the decisions reach derivation (closes Phase 3's unguarded break)
- Deliberate break (merge validation): return `true` from `validateMerge` → step 2 FAILs (the DB self-merge check answers `error-decision`, not `error-merge`); restored → PASS. Meta-check: the DB would refuse too, so only the redirect difference proves the app-side validation ran

#### Manual Verification:

- [reviewer] The endpoint mirrors the threshold endpoint (guard, parse, log, redirect) but parses `key` first; every write sends one decision column; the client never sends `user_id`; `merge` is the only action that reads

**Implementation Note**: proceed on green automated criteria.

---

## Phase 5: Shared dialog geometry and bfcache pending reset

### Overview

Before a third dialog lands, bring the shared `DialogContent` to the kit `.modal` geometry (G24) and add one hook that
resets a pending state on a bfcache restore (undo-import F4, S-04 F8). Visible on `/settings` and `/imports` only.

### Changes Required:

#### 1. Dialog geometry

**File**: `src/components/ui/dialog.tsx`

**Intent**: The kit is the contract; a slice-local wrapper would be accidental architecture (two consumers).

**Contract**: overlay `bg-ink/44` with the kit's 20 px viewport margin; content `w-[calc(100%-40px)] max-w-[480px]
rounded-[13px] p-[31px]` (values from `prototype/styles.css` `.modal`, `.modal-backdrop`, `.modal-close` — re-read
there, including the close button offset); header comment cites the kit selectors and G24.

#### 2. Pending reset hook

**File**: `src/components/hooks/usePageShowReset.ts` (new)

**Contract**: pure `onPersistedPageShow(target: EventTarget, callback: () => void): () => void` — calls `callback`
on a `pageshow` event whose `persisted` is `true`, returns the cleanup; `usePageShowReset(reset: () => void)` wires it
to `window` in a `useEffect`.

#### 3. Consumers

**Files**: `src/components/imports/DeleteImportDialog.tsx`, `src/components/patterns/ThresholdEditor.tsx`

**Contract**: `usePageShowReset(() => { setPending(false) })` / `setSaving(false)`. Nothing else changes.

#### 4. Tests and register

**Files**: `test/unit/page-show-reset.test.ts` (new), `context/foundation/design-kit.md`

**Contract**: persisted `pageshow` → callback once; non-persisted → none; after cleanup → none (a plain
`EventTarget` + `Object.assign(new Event("pageshow"), { persisted })`). G24 row: „S-05 (faza 5): `DialogContent` =
kit `.modal` geometry (480 / 31 / 13, 20 px margin)”.

### Success Criteria:

#### Automated Verification:

- `npm test` — Phase 4 count + 1 file, 0 failures (record the total)
- `npm run lint` 0 errors; `npx astro check` 0 errors (record the count)
- `npm run fixture:check` OK; `npm run build` passes
- `npx supabase db reset && npx supabase test db` — 102 (delta 0)
- `BASE_URL=http://localhost:4398 npm run smoke` — 103 PASS (delta 0)
- Deliberate break: ignore `persisted` in `onPersistedPageShow` → the non-persisted case FAILs; restored → green. Meta-check: the persisted case stays green, so the red proves the filter, not the listener
- No raw colours in `dialog.tsx` (`grep -nE "#[0-9a-fA-F]{3,6}\b|\[#"` empty; the shadow's existing `rgba(32,47,64,…)` is the only literal and stays as it was)

#### Manual Verification:

- [visual] Screenshots, desktop 1440 px and mobile ~400 px: `settings-delete-dialog` (open), `imports-delete-dialog` (open) — 480 px wide on desktop, 20 px side margin at 400 px, close button not overlapping the eyebrow
- [visual] bfcache: submit „Usuń import”, go back — the button is not stuck on its pending text; same for „Zapisz próg”

**Implementation Note**: proceed on green automated criteria; the Visual step performs the `[visual]` rows.

---

## Phase 6: Pattern detail actions, excluded banner, merged variants

### Overview

The kit's „Akcje” button and dialog on real decisions, the excluded banner with restore, the merged-variants list
with „Cofnij scalenie”, and the decision result lines. Two new components.

### Changes Required:

#### 1. Actions dialog

**File**: `src/components/patterns/PatternActionsDialog.tsx` (new)

**Intent**: Kit `modal('patternActions')` wired to `POST /api/patterns/decision`.

**Contract**: props `{ patternKey; type: PatternType; name: string; excluded: boolean; mergeTargets: { key: string;
name: string }[]; copy: {…} }`. Trigger: `Button variant="ghost"` with `Glyph more` + `<span>{copy.actions}</span>`
(full width ≤ 560 px, kit `.detail-actions .btn`). `DialogContent`: eyebrow `x.actionsEyebrow` (the
`text-excess-text` eyebrow style of `DeleteImportDialog`), `DialogTitle` `x.actionsTitle`, `DialogDescription`
`x.actionsLead`, `.modal-actions` grid (gap 8, mt 22, left-aligned `Button variant="ghost"`, icons `merge`,
`switch`, `edit`, `exclude`):
- „Scal z…” (`copy.patternActions.merge`) → reveals a form: label `x.mergeLabel`, native `<select name="target">` of
  `mergeTargets` (8 px radius, F11), submit `x.mergeSubmit`; no targets → the button is `disabled` and
  `x.mergeNone` is shown under it.
- „Zmień typ” (`copy.patternActions.changeType`) → a form submitting `type` = the other type directly.
- „Zmień nazwę” (`copy.patternActions.rename`) → reveals a form: label `x.renameLabel`, `<input name="name"
  maxLength={100}>` prefilled with `name` (kit `.modal-input`: 8 px radius, padding 13, margin 4 0 16), hint
  `x.renameHint`, submit `x.renameSubmit`.
- „Wyklucz z analizy” (`copy.patternActions.exclude`) → a form submitting `exclude` directly; omitted when
  `excluded`.
Each form: `method="POST" action="/api/patterns/decision"`, hidden `key` + `action`; submit via `SubmitButton`
with `pending` + `copyExtra.auth.saving`, reset with `usePageShowReset`. Opening focuses the dialog (as
`DeleteImportDialog`).
The `copy` prop carries only the strings the dialog renders — never the result-line strings (`x.merged`,
`x.unmerged`, …): those are asserted in smoke as bare text (plan review F1), which the island's serialized props
would otherwise satisfy.

#### 2. Restore form

**File**: `src/components/patterns/RestoreForm.astro` (new)

**Contract**: props `{ patternKey: string; back?: "list" }`; a `<form method="POST" action="/api/patterns/decision">`
with hidden `key`, `action=restore`, optional `back`, and a `Button`-styled (`buttonVariants({ variant: "text",
size: "inline" })`) submit `copy.patternActions.restore`. Shared by the banner (here) and the list section (Phase 7).

#### 3. Detail page

**File**: `src/pages/patterns/[...key].astro`

**Contract**:
- `.detail-top`: `BackLink` left, `PatternActionsDialog client:load` right (flex space-between, mb 22; ≤ 560 px
  column). `mergeTargets` = `patterns` other than this one, non-excluded, sorted by name (`pl`).
- Result line under `.detail-top` from `Astro.url.searchParams`: `merged` → success `x.merged`; `unmerged` → success
  `x.unmerged`; `typed` → success `x.typeChanged`; `renamed` → success `x.renamed`; `excluded` → success
  `x.excludedToast`; `restored` → success `copy.patternActions.restored`; `error=merge|name|decision` → error
  `x.mergeInvalid` / `x.nameInvalid` / `x.decisionError`.
- Excluded: kit banner above the heading — `InlineAlert kind="info"` whose content is `<span>{copy.patternActions.
  excluded}</span>` + `RestoreForm` (mb 18).
- Merged variants (only when `pattern.merged` is non-empty): under the lead, `x.mergedLabel` and one row per
  variant — its name + a form (hidden `key` = root, `action=unmerge`, `source`) with text button `x.unmerge`.
- Header comment: the „minus the Akcje menu (S-05)” note replaced.

#### 4. Copy and gap register

**Files**: `src/content/copy.ts`, `context/foundation/design-kit.md`

**Contract**: `copyExtra.patterns` gains
- under `// DESIGN-GAP: K22` — verbatim from `prototype/app.js`: `actions: "Akcje"`, `actionsEyebrow: "Akcje na
  wzorcu"`, `actionsTitle: "Zarządzaj wzorcem."`, `actionsLead: "Decyzje dotyczą wszystkich kolejnych miesięcy. Możesz
  je później odwrócić w ustawieniach wzorca."`, `typeChanged: "Typ wzorca zmieniony."`, `excludedToast: "Wzorzec
  wykluczony z analizy."`.
- under `// DESIGN-GAP: G33` — placeholders: `mergeLabel: "Scal z wzorcem"`, `mergeSubmit: "Scal"`, `mergeNone:
  "Brak innych wzorców do scalenia."`, `renameLabel: "Nazwa sprzedawcy"`, `renameHint: "Pusta nazwa przywraca nazwę z
  wyciągu."`, `renameSubmit: "Zapisz nazwę"`, `merged: "Wzorce scalone."`, `unmerged: "Scalenie cofnięte."`,
  `renamed: "Nazwa zmieniona."`, `mergedLabel: "Scalone warianty"`, `unmerge: "Cofnij scalenie"`, `mergeInvalid: "Nie
  można scalić z tym wzorcem."`, `nameInvalid: "Nazwa może mieć najwyżej 100 znaków."`, `decisionError: "Nie udało
  się zapisać decyzji. Spróbuj ponownie."`.
`design-kit.md`: **K22** (strings of the actions dialog and toasts rendered only in `app.js`; the prototype-narration
toasts „Tryb scalania jest gotowy do podpięcia.” / „Możesz zmienić nazwę inline.” are not product copy and are not
used), **G33** (what the kit does not define for FR-009: merge picker, rename field + validation, direct-submit type
change / exclude, pending / error states, result lines instead of toasts, merged-variants list and merge undo, the
„ustawienia wzorca” named by the lead = this dialog / detail, no way back to the automatic type, absorbed-key URL
redirect, excluded pattern keeping a visible threshold); **G4** status amended („S-05: menu + dialog, wykluczenie /
przywrócenie wdrożone; scalanie, zmiana nazwy i typu jako placeholdery G33”); both appended to „Do rundy 3”.

#### 5. Smoke

**File**: `scripts/smoke.mjs`

**Contract**: inserted into the Phase 4 run:
- after step 3: „merge confirms the result” — GET `/patterns/kawiarnia%20smoke?merged=1` → 200 contains the bare
  `Wzorce scalone.` (`InlineAlert` renders its slot as `<span> text </span>` — whitespace inside the span, so a
  `>text<` anchor never matches; existing InlineAlert smoke steps use bare text too); „detail offers the actions” —
  GET `/patterns/kawiarnia%20smoke` → contains `>Akcje<` **and** notContains `Wzorce scalone.` (the negative control
  proving the bare string is not in any island's props);
- after step 4: „merged pattern lists its variant” — contains `>Cofnij scalenie<`;
- after step 16: „excluded pattern shows the banner” — contains `>Wykluczony z analizy<`;
- after step 23: „restored pattern drops the banner” — notContains `>Wykluczony z analizy<`.

### Success Criteria:

#### Automated Verification:

- `npm run lint` 0 errors; `npx astro check` 0 errors (record the count)
- `npm test` — Phase 5 count, 0 failures
- `npm run fixture:check` OK; `npm run build` passes
- `npx supabase db reset && npx supabase test db` — 102 (delta 0)
- `BASE_URL=http://localhost:4398 npm run smoke` — 103 + 5 = 108 PASS
- Deliberate break: render the banner regardless of `pattern.excluded` → „restored pattern drops the banner” FAILs while „excluded pattern shows the banner” PASSes; restored → PASS. Meta-check: proves the banner follows the stored flag, not merely that it renders
- No raw colours in the new components and the changed page; every new key carries `DESIGN-GAP: K22` / `G33`; `design-kit.md` has rows K22, G33 and the amended G4

#### Manual Verification:

- [reviewer] Every string from `copy` / `copyExtra`; K22 byte-for-byte with `prototype/app.js`; only G33 placeholders new; the dialog reuses `DialogContent`, `Button`, `SubmitButton`, `Glyph`, `usePageShowReset` (no new primitives)
- [reviewer] Keyboard: trigger, the four actions, the revealed select / input and their submits are reachable; Esc and the close button close the dialog; each form posts exactly one action

**Implementation Note**: proceed on green automated criteria; screenshots happen in the Visual step after Phase 7.

---

## Phase 7: Excluded section on `/patterns` and seam sweep

### Overview

Lift the last G28 omission this slice owns: excluded patterns leave the table for the kit's collapsible „Wykluczone”
section with „Przywróć”; the list shows the restore result. Then sweep the seams the earlier phases left.

### Changes Required:

#### 1. Excluded section

**File**: `src/components/patterns/ExcludedPatterns.astro` (new)

**Intent**: Kit `patterns()` `.excluded-section` without JS.

**Contract**: props `{ patterns: { key: string; name: string }[] }`; renders nothing when empty. A `<details>` (mt
16) whose `<summary>` is the kit `.excluded-toggle` (`Icon arrow` 14 rotated −90° closed / 0° open, `x.excludedToggle`
„Wykluczone”, `<span>` „{n} {plural(n, x.patternForms)}”), then a `Panel`-styled list (padding 0 20): per pattern the
merchant mark (first character, `bg-paper-soft`, as `PatternsTable`), `item-name`, meta
`copy.patternActions.excluded`, and `RestoreForm back="list"`. Items are not links (kit).

#### 2. List page

**Files**: `src/pages/patterns.astro`, `src/components/patterns/PatternsTable.tsx`

**Contract**: table gets `items.filter((p) => !p.excluded)`; `ExcludedPatterns` below it gets the excluded ones. The
empty state renders only when there are **no** patterns at all; all patterns excluded → the table with its footer „0
wzorców” plus the section (G33). Result line above the table: `?restored=1` → success `copy.patternActions.restored`;
`?error=decision` → error `x.decisionError`. `PatternsTable` header comment: G28 now lists only the status badges
(S-06) and „Pokaż więcej”.

#### 3. Copy, register, follow-ups

**Files**: `src/content/copy.ts`, `context/foundation/design-kit.md`,
`context/changes/durable-pattern-decisions/follow-ups/review-fixes.md` (new)

**Contract**: K22 block gains `excludedToggle: "Wykluczone"`; G33 row extended (all-excluded list, `<details>` for the
toggle, no „przywrócony” badge); G28 row status „S-05: sekcja wykluczonych dostarczona”. The follow-ups file records
what S-05 closed (S-04 F5, F7, F8; undo-import F4; G24 geometry; S-01 F9 shared close icon — already met on `main`, `DialogContent` uses the kit sprite `#close`, recorded as closed with no code change) and what stays open, each with a `Trigger:` line
(S-04 F4 threshold endpoints, F11 field radius incl. `DeleteAccountDialog`'s modal input, DeleteAccountDialog bfcache,
S-07: „monthly sums must skip `pattern.excluded`”).

#### 4. Seam sweep

**Intent**: Nothing half-migrated leaves the branch.

**Contract**: over every file this change touched: no duplicated helper or class string introduced by two phases
(e.g. the merchant-mark classes of `PatternsTable` and `ExcludedPatterns`, the 8 px field classes of
`ThresholdEditor` and `PatternActionsDialog`, the status-param maps of `threshold-form.ts` and `decision-form.ts`) —
extract to `src/components/app/field-styles.ts` / a shared helper or record why not; no stale comment (`load.ts`,
`thresholds.ts`, `view.ts`, `[...key].astro`, `PatternsTable.tsx`, `Badge.tsx` headers); no stale kit row (G4, G24,
G28, G33, K22 agree with what renders); no unused export (`PatternListOverviewItem`, `loadPatterns`).

#### 5. Smoke

**File**: `scripts/smoke.mjs`

**Contract**: after Phase 6's „excluded pattern shows the banner”:
1. „patterns list shows the excluded section” — GET `/patterns` → 200 contains `>Kawiarnia Rytm<` and notContains
   the bare `Wzorzec przywrócony do analizy.` (negative control for step 3: the string is in no island prop).
2. „excluded pattern leaves the table” — same → notContains `href="/patterns/kawiarnia%20smoke"`.
After „restored pattern drops the banner”: 3. „list confirms a restore” — GET `/patterns?restored=1` → contains the
bare `Wzorzec przywrócony do analizy.` (an `InlineAlert` result line — never a `>text<` anchor, plan review F1).
Astro text asserted with `>text<` (`>Kawiarnia Rytm<`, `>Cofnij scalenie<`, `>Wykluczony z analizy<`) must sit inline
in its element (`<div class="item-name">{name}</div>`), not on its own line.

### Success Criteria:

#### Automated Verification:

- `npm run lint` 0 errors; `npx astro check` 0 errors (record the count)
- `npm test` — Phase 6 count, 0 failures (final: baseline 141 + the S-05 cases, 8 + 3 files)
- `npm run fixture:check` OK; `npm run build` passes
- `npx supabase db reset && npx supabase test db` — 102 (+26 over the baseline 76, 5 files)
- `BASE_URL=http://localhost:4398 npm run smoke` — 108 + 3 = 111 PASS (+34 over the baseline 77)
- Deliberate break: pass all items (excluded included) to `PatternsTable` → „excluded pattern leaves the table” FAILs while „patterns list shows the excluded section” PASSes; restored → PASS. Meta-check: the section has no links, so only a table row can carry the href
- Seam sweep: `grep -rn "PatternListOverviewItem\|loadPatterns\b" src test` empty; `grep -rn "DESIGN-GAP: G28" src` matches only the updated comment; `grep -rnE "#[0-9a-fA-F]{3,6}\b|\[#"` over the new components empty

#### Manual Verification:

- [reviewer] Seam sweep done: duplicated helpers / classes extracted or justified, stale comments and kit rows (G4, G24, G28, G33, K22) match the code, the follow-ups file lists every closed and open item with a `Trigger:`
- [human] Product owner confirms decision 9: „nie wchodzi do sumy miesięcznej” is met by excluding the pattern from every „ponad próg” sum (and, in S-07, from any monthly total) — PRD FR-017's note reads „suma miesięczna” as a spending total that does not exist yet; reversible in `view.ts` / S-07 only
- [visual] Screenshots, desktop 1440 px and mobile ~400 px, on `astro dev --port 4399` with a freshly registered local account that imported the synthetic ING fixture (`npm run fixture:ing`; never the seeded `test@rytm.local`): `detail-actions-closed` (`.detail-top`, full-width button at 400 px), `actions-dialog`, `merge-picker`, `merge-none` (account with one analysed pattern), `rename-field`, `rename-error` (`?error=name`), `merge-error` (`?error=merge`), `decision-error` (`?error=decision`), `pending` (a submit in flight), `merged-result` (`?merged=1` + merged-variants list), `unmerged-result`, `typed-result`, `renamed-result`, `excluded-banner` (`?excluded=1`), `restored-result`, `absorbed-redirect` (the absorbed key's URL lands on the root), `list-excluded-closed`, `list-excluded-open`, `list-restored` (`?restored=1`), `list-all-excluded`
- [visual] The fixture's US-03 walk-through on screen: merge `sportowo.pl` into `sportowo`, rename it, exclude the own-transfer pattern, pin a częsty pattern to stały — the list shows one merged row with the combined count and sum under the new name, the own transfer only in „Wykluczone”, the pinned type on its row

**Implementation Note**: the Visual step performs the `[visual]` rows; `[human]` stays open on the post-run checklist.

---

## Testing Strategy

### Unit Tests:

- `test/unit/pattern-decisions.test.ts` — `resolveKey` (direct, chain, cycles), pin both ways, display name, inert
  absorbed decisions, US-03 date split.
- `test/unit/patterns.test.ts` — fixture with decisions = the oracle's 30 groups, merged aggregates = sum of
  components, excluded flag, determinism; the no-decision block unchanged.
- `test/unit/pattern-view.test.ts` — exclusion zeroes over-limit but keeps the threshold; `detailTarget`;
  island-ready `listOverview`.
- `test/unit/decision-form.test.ts` — schema per action, `parseDisplayName`, `validateMerge`, `decisionRedirect`.
- `test/unit/page-show-reset.test.ts` — persisted / non-persisted / cleanup.

### Integration Tests:

- pgTAP `pattern_decisions.test.sql` (26): RLS per operation, partial upsert keeps untouched columns, constraints
  (self-merge, type, name length), import-delete survival, account-delete cascade, anon denied.
- Smoke (+34): rejected action / self-merge / long name, merge + sum + D5 re-type + absorbed redirect + list row, pin
  + amount threshold, exclude + zero over-limit + banner + list section + table exit, rename keeps exclusion, second
  import joins the merge and keeps type / name / exclusion, restore brings the over-limit back, unmerge, result
  lines, anonymous POST.

### Manual Testing Steps:

1. `npx supabase start`; `ASTRO_DEV_BACKGROUND=1 npx astro dev --port 4399 --ignore-lock`.
2. Register a fresh local account; import the synthetic fixture CSV (`npm run fixture:ing`).
3. Open `sportowo.pl` → „Akcje” → „Scal z…” → `SPORTOWO` → the root shows 8 occurrences and „Scalone warianty”.
4. „Zmień nazwę” → „Sportowo”; open the own-transfer pattern → „Wyklucz z analizy” → banner; `/patterns` →
   „Wykluczone (1 wzorzec)” → „Przywróć”.
5. Pin a częsty pattern to stały; set an accepted amount; check „ponad próg”. Undo the merge. Kill the server
   (`lsof -ti :4399 | xargs kill`).

## Performance Considerations

Each list / detail view now runs three keyset-paged reads in parallel (transactions, thresholds, decisions) — the
latter two are one row per touched merchant. Chain resolution is a map walk per distinct key. The merge POST runs the
full read once. No caching.

## Migration Notes

New table only; no data to move. Ship step: `npx supabase db push` to the hosted project **before** merge (agent
contract); `src/db/database.types.ts` is committed in Phase 1. Invariant kept: decisions key on `merchant_key` +
`user_id`, never `import_id`. Carried risk: a change to `normalizeMerchant` re-keys merchants and orphans thresholds,
decisions **and** `merged_into` values (no re-key migration exists).

## References

- Research: `context/changes/durable-pattern-decisions/research.md`; identity: `change.md`
- PRD: `context/foundation/prd.md` (FR-009, US-03, US-02 AC, FR-017 note, Business Logic „Wynik”)
- Derive / read: `src/lib/patterns/derive.ts` `derivePatterns`, `src/lib/patterns/load.ts` `collectPages` /
  `loadPatterns`, `src/lib/patterns/thresholds.ts` `loadThresholds`, `src/lib/patterns/view.ts` `listOverview` /
  `patternDetail`
- Write precedent: `src/pages/api/patterns/threshold.ts` `POST`, `src/lib/patterns/threshold-form.ts`
- Migration / pgTAP precedent: `supabase/migrations/20260927200000_pattern_thresholds.sql`,
  `supabase/tests/database/pattern_thresholds.test.sql`
- Kit: `design/rytm-os/prototype/app.js` (`patternDetail`, `modal`, `applyPatternState`, `restorePattern`,
  `patterns`), `design/rytm-os/prototype/styles.css` (`.detail-top`, `.detail-actions`, `.modal*`, `.excluded-*`,
  `.list-item`), `design/rytm-os/react-kit/docs/content.json` (`patternActions`)
- Follow-ups: `context/archive/2026-09-27-pattern-threshold-over-limit/follow-ups/review-fixes.md` (F4, F5, F8, F11),
  `context/archive/2026-09-27-pattern-threshold-over-limit/reviews/impl-review.md` (F7),
  `context/archive/2026-09-25-undo-import/follow-ups/review-fixes.md` (F4, dialog geometry, key invariant)
- Format example: `context/archive/2026-09-27-pattern-threshold-over-limit/plan.md`

## Autonomous decisions

Made by the plan step of run `2026-09-28-s05-s06-s07` in place of asking a human.

1. **One table `pattern_decisions`, one row per (user, merchant key)**, nullable `merged_into` / `pinned_type` /
   `display_name`, `excluded` boolean (research). Rejected: an alias table + an attribute table (each absorbed key has
   exactly one outgoing edge). Would change: merging one key into several targets, or keeping merge history.
2. **Merge direction: the pattern whose detail runs „Scal z…” is absorbed into the chosen target; the target's key
   survives** (routes, threshold, root decisions stay addressable). Redirect lands on the target. Rejected: the
   current pattern survives (the kit's „Scal z…” reads as „merge [this] with…”, and keeping the chosen target's key is
   what the fixture oracle names — `sportowo.pl → sportowo`). Would change: usability feedback that users expect to
   stay on the current pattern.
3. **Chains resolved at read; a cycle resolves to its code-point-smallest key; the write accepts only a current,
   non-excluded root ≠ source.** Merge is the only write that runs the full read — a departure from S-04 decision 7,
   because a wrong merge hides a merchant, whereas a wrong threshold kind is merely ignored. Would change: a merge
   read becoming slow at real volumes.
4. **Absorbed key's own decisions and threshold are kept and inert**; „Cofnij scalenie” brings them back (S-04
   decision 3's keep-but-ignore). Rejected: deleting or moving them on merge. Would change: users expecting the
   absorbed threshold to carry over to the root.
5. **Absorbed-key URL → 302 to the root.** Rejected: 404 (a bookmarked or listed link would dead-end). Would change:
   a need to show the absorbed variant's own history.
6. **Pinned type: „Zmień typ” pins the other type; a pin equal to D5 is still stored; no way back to automatic.**
   Threshold keep-but-ignore (no reset — research §3); `fixedAmountMinor` = median for a pinned-fixed pattern.
   Rejected: a three-way control (no kit UI). Would change: the kit adding an „automatycznie” option.
7. **Rename is display-only**: trimmed, empty clears the override, ≤ 100 characters (DB check 1–100), collisions with
   another pattern's name allowed (identity is the key; merge is the tool for duplicates). Would change: a real name
   longer than 100 characters.
8. **Exclusion zeroes every over-limit figure but keeps the threshold visible and editable on the detail** (panel
   still „aktywny”); excluded patterns leave the table for „Wykluczone”; the footer counts analysed patterns; the
   empty state shows only when there are no patterns at all. Rejected: hiding the threshold (the restore would then
   look like it invented one). Would change: review finding an „aktywny” threshold on an excluded pattern confusing.
9. **„nie wchodzi do sumy miesięcznej” = excluded from every „ponad próg” sum now, and S-07 must skip excluded
   patterns in any monthly total it builds** (`MerchantPattern.excluded` is the shared flag). PRD „Wynik” defines only
   the monthly over-limit sum, but FR-017's note speaks of a „monthly sum” that intermediaries would make „falsely
   low” — a spending total the app does not have yet. Not against the PRD text, but ambiguous → `[human]` row 7.9.
   Would change: the product owner naming a total spending figure for S-07.
10. **Undo: exclude → „Przywróć” (kit); rename → clear the field; type → pin the other type; merge → „Cofnij
    scalenie” on the root's merged-variants list (G33 placeholder).** Rejected: deferring merge undo (a mistaken merge
    would hide a merchant with no way back; the kit lead promises reversal). Would change: the kit delivering the
    „ustawienia wzorca” screen.
11. **One endpoint `POST /api/patterns/decision` with an `action` union**; key parsed first (S-04 F4 lesson);
    single-column upserts; rows never deleted (an all-default row is harmless). Rejected: six routes (six copies of
    the guard), deleting default rows (a second write path to test). Would change: a JSON client.
12. **`loadPatternData` as the single read** (three parallel paged reads, derive after). Rejected: passing decisions
    into `loadPatterns` (a serial round trip) and per-page `Promise.all` (S-06 / S-07 would copy it). Would change:
    a page needing patterns without thresholds at scale.
13. **Follow-ups folded:** S-04 F5 (paging both reads), F7 (island-ready `listOverview`), F8 + undo-import F4 (one
    `usePageShowReset` hook), G24 geometry as a shared `DialogContent` fix in its own phase with re-screenshots.
    Left open: S-04 F4 (threshold endpoints), F11 (app-wide field radius; new fields use 8 px locally),
    `DeleteAccountDialog` bfcache. Would change: the maintainer refusing the cross-view re-screenshot (then Phase 5
    drops the geometry part and G24 stays open).
14. **Dialog: the four kit buttons; „Zmień typ” and „Wyklucz z analizy” submit on click** (the dialog is the
    confirmation, and the kit toasts right after the click); **„Scal z…” and „Zmień nazwę” reveal an inline field**
    (G33); the exclude button is omitted while excluded (the banner restores). Rejected: nested confirm dialogs
    (invented UI). Would change: the kit drawing the merge / rename flows.
15. **Results via redirect + `InlineAlert`** (S-04 decision 15): kit toast texts verbatim where they are product copy
    (K22), kit key `patternActions.restored`, placeholders otherwise (G33); the prototype-narration toasts are not
    used. Would change: a shared Toast component on `main`.
16. **No „przywrócony” badge / restored list state, no new Badge tones** — nothing renders them after an SSR
    redirect. Would change: an in-place (client-side) restore.
17. **„Wykluczone” is a native `<details>`** in Astro (no island); items are not links (kit). Would change: an
    accessibility review preferring the kit's button toggle.
18. **Durability proof = unit (fixture oracle + date split) + smoke second synthetic import + pgTAP survival**, no
    new fixture file (research). Would change: a browser-level US-03 demo on fixture data (the `[visual]` walk-through
    covers the screen part).
19. **Seven phases, ≤ 2 new UI components each** (Phase 6: `PatternActionsDialog`, `RestoreForm`; Phase 7:
    `ExcludedPatterns`); the shared dialog fix isolated so its cross-view screenshots are one gate. Would change: an
    implementer finding a phase not independently green (merge it with the next).
20. **The kit lead „Możesz je później odwrócić w ustawieniach wzorca.” renders verbatim**; the „ustawienia wzorca” are
    this dialog and detail (G33). Would change: kit copy naming the real place.
21. **Merge picker = other non-excluded roots, sorted by display name (`pl`)**; none → „Scal z…” disabled + note
    (G33). Would change: users with hundreds of patterns needing search.
22. **Gap rows K22 / G33 land with the code (Phases 6–7)**, as in S-04 decision 22. Would change: the orchestrator
    requiring gap rows at plan time.
23. **Decision → PRD literal:** no decision here contradicts the PRD's literal text; decision 9 interprets an
    ambiguous phrase and carries the only `[human]` row. Would change: the plan review reading FR-009's „zmienić typ”
    as requiring a return to the automatic type.

## Known risks

- **Normalizer drift** now orphans three kinds of stored values (thresholds, decisions, `merged_into`).
- **Crafted decision rows** for keys the user does not have are accepted (except merge); self-inflicted under RLS and
  now paged, so they cannot truncate the read.
- **A merged variant whose rows were all deleted** disappears from „Scalone warianty”, so its merge cannot be undone
  from the UI until its rows return (they then rejoin the root, as intended).
- **PostgREST partial-upsert semantics** are relied on for every decision write; proven by pgTAP 6–7 and smoke
  „rename keeps the exclusion” — a supabase-js change to `upsert` column handling would surface there.
- **Astro check file count** is recorded, not asserted — only the error delta gates.
- **Phase 3's derive-input break (3.7) is unguarded until Phase 4** (no decision rows exist before the endpoint);
  accepted — Phase 4's break 4.7 re-runs it against smoke steps 4, 5, 13, 16 (plan review F4).
- **Smoke text anchors** (plan review F1): `>text<` only for text inline in its element (React island nodes, inline
  Astro expressions); `InlineAlert` result lines are asserted as bare text, each paired with a negative control on a
  page without the result param, so an island's serialized props cannot satisfy them.

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: `pattern_decisions` table and its proofs

#### Automated

- [x] 1.1 `npx supabase db reset && npx supabase test db` — pgTAP 76 (4 files) + 26 = 102 (5 files), all pass — 1e2ea9b
- [x] 1.2 `npm run db:types` regenerates `src/db/database.types.ts` with `pattern_decisions`; diff shows only the new table — 1e2ea9b
- [x] 1.3 `npm run lint` 0; `npx astro check` 0 errors (count recorded); `npm test` 141 (delta 0); `npm run fixture:check` OK; `npm run build` passes — 1e2ea9b
- [x] 1.4 `BASE_URL=http://localhost:4398 npm run smoke` — 77 PASS (delta 0) — 1e2ea9b
- [x] 1.5 Deliberate break (update policy dropped) → assertions 6–8 FAIL; restored → green; meta-check recorded — 1e2ea9b
- [x] 1.6 Deliberate break (self-merge check removed) → assertion 10 FAILs; restored → green; meta-check recorded — 1e2ea9b
- [x] 1.7 Deliberate break (FK without cascade) → assertion 24 FAILs; restored → green; meta-check recorded — 1e2ea9b
- [x] 1.8 Migration file name matches `^[0-9]{14}_[a-z_]+\.sql$` and sorts after `20260927200000_pattern_thresholds.sql` — 1e2ea9b

#### Manual

- [ ] 1.9 [reviewer] Policies per operation and role, update `using` + `with check`, no `import_id`, cascade FK, no `revoke update`
- [ ] 1.10 [reviewer] pgTAP assertions mapped to RLS / partial upsert / survival / cascade; handoff records which break proved which

### Phase 2: Decisions in derivation and view models (pure, with fixture oracle)

#### Automated

- [x] 2.1 `npm test` — Phase 1 count (141, 8 files) + 1 new file = 158 (9 files), every new case green, 0 failures — c2b63b4
- [x] 2.2 `npm run lint` 0; `npx astro check` 0 errors (110 files, +1 from the new test file — `tsconfig.json` includes `**/*`) — c2b63b4
- [x] 2.3 `npm run fixture:check` OK; `npm run build` passes — c2b63b4
- [x] 2.4 `npx supabase db reset && npx supabase test db` — 102 (5 files), delta 0 — c2b63b4
- [x] 2.5 `BASE_URL=http://localhost:4398 npm run smoke` — 77 PASS (delta 0) — c2b63b4
- [x] 2.6 Deliberate break (`resolveKey` one hop only, no loop) → chain, 2-cycle, 3-cycle cases in `pattern-decisions.test.ts` FAIL (3 tests); restored → green (54/54). Meta-check: `patterns.test.ts`'s direct single-hop merge case (`sportowo.pl → sportowo`) stayed green throughout, so the red isolates multi-hop/cycle resolution, not merging itself — c2b63b4
- [x] 2.7 Deliberate break (`type = d5Type(amounts)`, `pinnedType` ignored) → "a pinned type overrides D5 both ways" and the US-03 date-split case FAIL (2 tests); restored → green. Meta-check: the F-02 fixture partition case (`derivePatterns — F-02 oracle`) stayed green, so the red isolates the pin, not derivation generally — c2b63b4
- [x] 2.8 Deliberate break (`excluded` check dropped from `listOverview`'s early return) → the new excluded-list case FAILs (`overMinor` 2000 instead of 0); restored → green. Meta-check: the non-excluded twin (`wolt`, `overMinor` 2000 in the untouched test) stayed green throughout, proving the threshold does apply and only exclusion zeroes it — c2b63b4

#### Manual

- [ ] 2.9 [reviewer] Only the root's decision is read; nothing applied after grouping; cycle rule deterministic and documented

### Phase 3: Paged reads, one pattern-data read, absorbed-key redirect

#### Automated

- [x] 3.1 `npm test` — Phase 2 count (158, 9 files) + 7 new cases = 165 passed, 9 files, 0 failures — _pending commit_
- [x] 3.2 `npm run lint` 0; `npx astro check` 0 errors, 0 warnings, 0 hints (111 files, +1 from the new `decisions.ts`) — _pending commit_
- [x] 3.3 `npm run fixture:check` OK; `npm run build` passes — _pending commit_
- [x] 3.4 `npx supabase db reset && npx supabase test db` — 102 (5 files), delta 0 (no migration this phase; `npm run db:types` confirmed no diff) — _pending commit_
- [x] 3.5 `BASE_URL=http://localhost:4398 npm run smoke` — 77 PASS (delta 0) — _pending commit_
- [x] 3.6 Deliberate break (`detailTarget`'s redirect branch always returns `{ kind: "missing" }`) → `pattern-view.test.ts`'s two absorbed-key cases FAIL ("redirects to its root", "resolves through a chain"; 19/21 passed in that file); every other `detailTarget`/`listOverview` case stayed green. Restored → 21/21 green. Meta-check: the "unknown key" and "key with no decision" cases stayed green throughout, so the red isolates the redirect branch specifically, not key lookup in general — _pending commit_
- [x] 3.7 Deliberate break (`loadPatternData` passes `new Map()` instead of `decisions` to `derivePatterns`) → `npm run lint`, `npx astro check`, `npm test` (165/165) and `npm run build` **all stayed green** — confirmed uncaught, exactly as the plan's own criterion states; restored → unchanged green. This is the plan's flagged gap, not a regression: Phase 4's smoke step "merged pattern sums its components" is the guard — _pending commit_

#### Manual

- [ ] 3.8 [reviewer] Both small reads page via `collectPages` (`order id`, `gt id`); pages use only `loadPatternData`; no second `Map` in `patterns.astro`

### Phase 4: Decision endpoint and the US-03 durability smoke

#### Automated

- [ ] 4.1 `npm test` — Phase 3 count + 1 file, 0 failures
- [ ] 4.2 `npm run lint` 0; `npx astro check` 0 errors (count recorded)
- [ ] 4.3 `npm run fixture:check` OK; `npm run build` passes
- [ ] 4.4 `npx supabase db reset && npx supabase test db` — 102 (delta 0)
- [ ] 4.5 `BASE_URL=http://localhost:4398 npm run smoke` — 77 + 26 = 103 PASS
- [ ] 4.6 Deliberate break (rename upsert sends `excluded: false`) → „rename keeps the exclusion” FAILs; restored → PASS; meta-check recorded
- [ ] 4.7 Deliberate break (empty decisions into `derivePatterns`) → steps 4, 5, 13, 16 FAIL, writes PASS; restored → PASS; meta-check recorded
- [ ] 4.8 Deliberate break (`validateMerge` always `true`) → „merge into itself is rejected” FAILs; restored → PASS; meta-check recorded

#### Manual

- [ ] 4.9 [reviewer] Endpoint parses `key` first, one decision column per write, no client `user_id`, only `merge` reads

### Phase 5: Shared dialog geometry and bfcache pending reset

#### Automated

- [ ] 5.1 `npm test` — Phase 4 count + 1 file, 0 failures
- [ ] 5.2 `npm run lint` 0; `npx astro check` 0 errors (count recorded)
- [ ] 5.3 `npm run fixture:check` OK; `npm run build` passes
- [ ] 5.4 `npx supabase db reset && npx supabase test db` — 102 (delta 0)
- [ ] 5.5 `BASE_URL=http://localhost:4398 npm run smoke` — 103 PASS (delta 0)
- [ ] 5.6 Deliberate break (`persisted` ignored) → non-persisted case FAILs; restored → green; meta-check recorded
- [ ] 5.7 No raw colours added to `dialog.tsx`

#### Manual

- [ ] 5.8 [visual] Screenshots desktop 1440 px + mobile ~400 px: `settings-delete-dialog`, `imports-delete-dialog` — 480 px desktop, 20 px margin at 400 px, close button clear of the eyebrow
- [ ] 5.9 [visual] bfcache back-navigation leaves neither „Usuń import” nor „Zapisz próg” stuck on its pending text

### Phase 6: Pattern detail actions, excluded banner, merged variants

#### Automated

- [ ] 6.1 `npm run lint` 0; `npx astro check` 0 errors (count recorded)
- [ ] 6.2 `npm test` — Phase 5 count, 0 failures
- [ ] 6.3 `npm run fixture:check` OK; `npm run build` passes
- [ ] 6.4 `npx supabase db reset && npx supabase test db` — 102 (delta 0)
- [ ] 6.5 `BASE_URL=http://localhost:4398 npm run smoke` — 103 + 5 = 108 PASS
- [ ] 6.6 Deliberate break (banner ignores `excluded`) → „restored pattern drops the banner” FAILs; restored → PASS; meta-check recorded
- [ ] 6.7 No raw colours in new components / changed page; `DESIGN-GAP: K22` / `G33` on every new key; rows K22, G33 and amended G4 in `design-kit.md`

#### Manual

- [ ] 6.8 [reviewer] Every string from `copy` / `copyExtra`; K22 byte-for-byte with `app.js`; only G33 placeholders new; no new primitives
- [ ] 6.9 [reviewer] Keyboard: trigger, four actions, revealed fields and submits reachable; Esc / close work; each form posts one action

### Phase 7: Excluded section on `/patterns` and seam sweep

#### Automated

- [ ] 7.1 `npm run lint` 0; `npx astro check` 0 errors (count recorded)
- [ ] 7.2 `npm test` — Phase 6 count, 0 failures (final total recorded against baseline 141)
- [ ] 7.3 `npm run fixture:check` OK; `npm run build` passes
- [ ] 7.4 `npx supabase db reset && npx supabase test db` — 102 (+26 over baseline 76)
- [ ] 7.5 `BASE_URL=http://localhost:4398 npm run smoke` — 108 + 3 = 111 PASS (+34 over baseline 77)
- [ ] 7.6 Deliberate break (excluded items fed to the table) → „excluded pattern leaves the table” FAILs; restored → PASS; meta-check recorded
- [ ] 7.7 Seam-sweep greps: no `PatternListOverviewItem` / `loadPatterns`; `DESIGN-GAP: G28` only in the updated comment; no raw colours in new components

#### Manual

- [ ] 7.8 [reviewer] Seam sweep: duplicated helpers / classes extracted or justified; stale comments and kit rows (G4, G24, G28, G33, K22) match the code; follow-ups file complete with `Trigger:` lines
- [ ] 7.9 [human] Product owner confirms decision 9: „nie wchodzi do sumy miesięcznej” = excluded from every „ponad próg” sum and from any S-07 monthly total
- [ ] 7.10 [visual] Screenshots desktop 1440 px + mobile ~400 px: `detail-actions-closed`, `actions-dialog`, `merge-picker`, `merge-none`, `rename-field`, `rename-error`, `merge-error`, `decision-error`, `pending`, `merged-result`, `unmerged-result`, `typed-result`, `renamed-result`, `excluded-banner`, `restored-result`, `absorbed-redirect`, `list-excluded-closed`, `list-excluded-open`, `list-restored`, `list-all-excluded`
- [ ] 7.11 [visual] Fixture US-03 walk-through: merged `sportowo` row with combined count and sum under the new name, own transfer only in „Wykluczone”, pinned type on its row
