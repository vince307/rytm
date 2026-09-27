# Próg na wzorcu i „ponad próg” (S-04 `pattern-threshold-over-limit`) Implementation Plan

## Overview

Let a signed-in user open one merchant pattern at `/patterns/<key>`, see its transactions month by month (FR-008),
set / change / remove one threshold on it (FR-010 — frequent: count per month or sum per month; fixed: accepted
amount) and immediately see which transactions are „ponad próg” and the sum „ponad progiem w tym miesiącu”
(FR-011). `/patterns` gains the kit's Próg / Ponad progiem columns and the row link. Thresholds are the first
per-user **mutable** table (`pattern_thresholds`, keyed `user_id + merchant_key`, never `import_id`), so they
survive an import delete (US-02 AC). The over-limit rule is a pure, deterministic function with its own unit
oracle; the pattern read is widened once (dates) and moved to keyset paging (S-03 follow-up F2).

## Current State Analysis

Source: `context/changes/pattern-threshold-over-limit/research.md` (code + PRD + kit reading), re-checked here
against the files named below.

- **Patterns are derived on read, no table.** `src/lib/patterns/load.ts` `loadPatterns` pages every debit
  (`collectPages`, offset `.range()`, `count: "exact"`), selecting only `id, amount_minor, counterparty, title`;
  `src/lib/patterns/derive.ts` `derivePatterns` groups by `merchantKey` and keeps only `transactionIds`;
  `d5Type` recomputes the type on every read, so an import or undo can flip fixed ↔ frequent.
- **No threshold storage, no over-limit computation, no detail route.** Migrations hold only `imports` /
  `transactions` (immutable: no UPDATE policy, `revoke update, maintain` in
  `20260924122144_transactions_import_account_fk.sql`). `src/pages/` has no dynamic route; `src/middleware.ts`
  `PROTECTED_ROUTES` already protects `/patterns/…`. `test/fixtures/ing/expected.json` has no threshold oracle.
- **Identity.** `src/lib/patterns/merchant.ts` `merchantKey` = normalized name lower-cased (`pl-PL`): real keys
  hold spaces, diacritics and dots (`kawa-testowa.pl`, `kawiarnia smoke` in the smoke payload); an inner `/` is not
  excluded. `transactions.id` is `bigint identity` (read as `String(row.id)`), `occurred_on` a `date`.
- **List.** `src/pages/patterns.astro` maps `MerchantPattern` → `PatternListItem` for the island
  `src/components/patterns/PatternsTable.tsx` (`DESIGN-GAP: G28` — Próg / Ponad progiem, row link + arrow omitted
  until S-04; `columns.slice(0, 4)` + K17 `amountColumn`; field classes `field` / `control` inlined, G29).
- **Shared UI.** `src/components/app/Badge.tsx` tones `fixed | frequent` only (comment: further tones with S-04);
  `src/components/ui/button.tsx` `buttonVariants` has `text` + size `inline` (S-02 follow-up F5: reserved for
  „Usuń próg”); `Panel.astro`, `PageTitle.astro`, `InlineAlert.astro`; `src/components/auth/SubmitButton.tsx`
  (`pending` prop for native POST); `src/components/Glyph.tsx` has `arrow`, `arrow-left`. No back link, sequence,
  input-with-suffix or toast component (the how-it-works sequence is inlined as `rClip` in
  `src/pages/how-it-works.astro`).
- **Write-route precedent.** `src/pages/api/imports/delete.ts` `POST` + pure helper `src/lib/import/delete.ts`
  (guard → formData → zod → query → redirect-with-status); CSRF via Astro `security.checkOrigin` (default).
- **Kit.** `design/rytm-os/prototype/app.js` `patternDetail`, `thresholdEditor`, `patternRows`; copy keys
  `patternDetail.*`, `threshold.*`, `patterns.columns[4..5]`, `components.success`, `dashboard.stats[0].label`;
  ~20 rendered strings exist only in `app.js` (K11 class). Next free gap ids **K21**, **G31**. Prototype „over”
  marks are hard-coded — not an oracle.
- **Proof harnesses.** `scripts/smoke.mjs` `steps` (status / location prefix / `contains` / `notContains`); the smoke
  user owns, after the re-import step, one May-2026 import with two fixed one-occurrence patterns: „Sklep smoke”
  12,99 zł (2026-05-04) and „Kawiarnia smoke” 45,50 zł (2026-05-20). pgTAP style:
  `supabase/tests/database/import_delete.test.sql` / `domain_rls.test.sql`.

## Desired End State

- `/patterns` rows link to `/patterns/<encodeURIComponent(key)>` (name + arrow „Otwórz wzorzec”); columns Próg
  („4 × / miesiąc”, „55,00 zł”, „—”) and Ponad progiem (reference-month over-limit sum in `excess-text`, or „—”).
- `/patterns/<key>` renders the kit detail: back link, type eyebrow, name, type lead, month total („Suma w maju”,
  sum, „N wystąpień”) plus the month's „ponad progiem” sum, the threshold panel with an editor (kind switch for
  frequent, value with suffix, note, „Ustaw próg” / „Zapisz próg”, „Usuń próg”), the month panel (month select over
  the months present, sequence marks with over-limit ones in `excess`), and the month's transactions (date, raw
  description, amount, „ponad próg” badge).
- Saving redirects back with „Sukces — próg zapisany.”; removing with „Próg usunięty.”; an invalid value with an
  error line; unknown key → 404 not-found state; read failure → error line.
- Reference month = latest calendar month present in the user's transactions (`?month=YYYY-MM` selects another).
- Verified by: pgTAP +22 (new file), vitest +3 files, smoke +16, screenshots of every named state.

### Key Discoveries:

- PRD **contradicts itself** on the over amount for sum/fixed kinds (Business Logic „nadwyżka” vs US-01 AC) — decided
  in Autonomous decisions 1; the count kind (US-01 Wolt) is identical under both readings.
- `pattern_thresholds` is the first mutable table: PostgREST upsert needs SELECT + INSERT + UPDATE policies; do
  **not** copy `revoke update` from the transactions follow-up migration.
- Grouping happens in JS, so the detail must run the full read and pick by key — one widened, keyset-paged read
  serves both list and detail.
- A smoke `contains: "5,50 zł"` would also match „45,50 zł”; over-limit money assertions use the text node form
  (`">5,50 zł<"`). Badge / list assertions likewise use `>…<` so serialized island props cannot satisfy them (the
  trap documented by the existing „patterns proposes a type” step).

## What We're NOT Doing

- No `/home` „Ponad progiem w tym miesiącu” stat card and no trend (S-07 / home slice) — one view.
- No pattern actions („Akcje” button, `modal('patternActions')`: merge, type change, rename, exclude — S-05), no
  status badges `nowy` / `zmiana kwoty` (S-06), no excluded section, no „Pokaż więcej”.
- No dialog (delete-threshold has no confirm in the kit) → the shared-dialog-geometry / S-01 F9 follow-ups stay
  untriggered.
- No toast component — results use redirect + `InlineAlert` (S-02 G30 precedent).
- No server-side check that the posted `kind` matches the pattern's current D5 type (would need the full read on
  every write); the evaluator ignores a mismatched kind instead.
- No `updated_at` column / trigger; no history of threshold changes; thresholds apply retroactively to every month
  (PRD „według dzisiejszych progów”).
- No refactor of `how-it-works.astro` / `ImportWizard.tsx` onto the new shared `SequenceMark` / `BackLink` (other
  views); noted as a follow-up.
- No normalizer change (`normalizeMerchant` rule order is load-bearing — a change would orphan stored thresholds).
- No manual deploy phase: the run's Ship step pushes the migration (`npx supabase db push`) before merge.

## Implementation Approach

Six small phases, each independently green on the full local gate and committed on green by a fresh agent:
storage first (migration + pgTAP), then pure logic with its oracle, then the read path (keyset + widened select +
view models) with no visible change, then the detail view read-only, then the write path (endpoints + editor),
then the list columns and row link. Baseline for every delta is the post-S-02 `main` (`a6a8b18`, agent contract):
lint 0 · astro check 0 errors (93 files) · vitest 78/78 (5 files) · fixture:check OK · build OK · pgTAP 54
(3 files) · smoke 61 PASS. Each phase re-measures its own starting point and writes `baseline + delta`.

Local gate (every phase):

```bash
npm run lint && npx astro check && npm test && npm run fixture:check && npm run build
npx supabase db reset && npx supabase test db
ASTRO_DEV_BACKGROUND=1 npx astro dev --port 4398 --ignore-lock &   # then
BASE_URL=http://localhost:4398 npm run smoke                        # then: lsof -ti :4398 | xargs kill
```

(Docker / `127.0.0.1:54321` commands run with the sandbox disabled; never port 4321.)

## Critical Implementation Details

- **Key from the raw path, not `Astro.params`.** The detail route is a rest route (`[...key].astro`) so a key with
  `/` (sent as `%2F`) still matches; the key itself is read from `Astro.url.pathname` (percent-encoded) and decoded
  once with `decodeURIComponent` — `encodeURIComponent` / `decodeURIComponent` round-trip any string exactly. If the
  runtime hands an already-decoded pathname, a throwing decode falls back to the raw segment. The smoke key
  `kawiarnia smoke` (space) proves the path end-to-end.
  *Plan review (verified in `node_modules/astro` 7.3.2):* the runtime runs `decodeURI` on the pathname until it stops
  changing (`core/util/pathname.js` `validateAndDecodePathname`), then writes it back through the URL setter, which
  re-encodes spaces and non-ASCII — so `Astro.url.pathname` reads `kawiarnia%20smoke`, and `%2F` / `%3F` / `%23`
  survive (`decodeURI` never decodes reserved characters). `Astro.params.key` would be `"kawiarnia smoke"` but
  `"a%2Fb"` for `a/b` — hence the pathname, not params. A literal `%` in a key reaches `keyFromPath` as a bare `%`
  (the decode throws → raw fallback, correct). Only a key holding a literal `%XX` escape is double-decoded (Known
  risks).
- **Nested forms.** The threshold editor's save form and the „Usuń próg” delete form cannot nest; the delete form is
  a sibling `<form id=…>` and the „Usuń próg” button inside `.threshold-actions` targets it with the `form`
  attribute.
- **Chronology.** Over-limit order is `(occurred_on asc, id asc)` with `id` compared numerically (`BigInt`), not as a
  string („10” < „9”). Display order in the transactions list is the reverse (kit shows newest first) — computed
  after the over-limit pass, never before.
- **Upsert.** Client never sends `user_id` (column default `auth.uid()`); upsert conflicts on
  `user_id,merchant_key`, which requires the SELECT + INSERT + UPDATE policies — pgTAP proves the exact
  `insert … on conflict (user_id, merchant_key) do update` statement as `authenticated`.

## Phase 1: `pattern_thresholds` table and its proofs

### Overview

Persist one threshold per (user, merchant key) under per-operation RLS, proven by a new pgTAP file; regenerate
types. No app code reads it yet.

### Changes Required:

#### 1. Migration

**File**: `supabase/migrations/20260927200000_pattern_thresholds.sql` (new)

**Intent**: The first per-user mutable table; survives import deletion (no `import_id`), cascades from the account.

**Contract**: header comment citing FR-010 / FR-011 / US-02 AC / FR-019 and why it has an UPDATE policy (unlike
`imports` / `transactions`). Table `public.pattern_thresholds`: `id bigint generated always as identity primary
key`; `user_id uuid not null default auth.uid() references auth.users(id) on delete cascade`; `merchant_key text not
null check (char_length(merchant_key) between 1 and 500)`; `kind text not null check (kind in
('count','sum','amount'))`; `value bigint not null check (value > 0 and value <= 100000000)` (count as integer;
`sum` / `amount` in grosze, ≤ 1 000 000 zł); `created_at timestamptz not null default now()`; `unique (user_id,
merchant_key)` (named `pattern_thresholds_user_id_merchant_key_key`). `comment on table`. RLS enabled; four policies
for `authenticated`, named `"pattern_thresholds: authenticated <select|insert|update|delete> own"`, each with
`(select auth.uid()) = user_id` (update: both `using` and `with check`). `revoke all … from anon`; `revoke truncate,
trigger, references, maintain … from authenticated` — **not** `update`. No function changes (`delete_own_account`
deletes only `auth.users`).

#### 2. pgTAP proof

**File**: `supabase/tests/database/pattern_thresholds.test.sql` (new)

**Intent**: Prove RLS isolation per operation, the upsert path the app uses, constraints, survival of an import
delete and the account-delete cascade.

**Contract**: `begin; create extension if not exists pgtap …; select plan(22); … select * from finish(); rollback;`,
users A/B with fixed UUIDs in `auth.users` (style of `import_delete.test.sql`), A owns one import with one
transaction (inserted as `postgres`). Assertions:
1. RLS enabled on `pattern_thresholds`.
2. `authenticated` lacks TRUNCATE.
3. As A: insert `('wolt','count',4)` without `user_id` → `lives_ok`.
4. As A: the row's `user_id` is A (default `auth.uid()`).
5. As A: `insert … on conflict (user_id, merchant_key) do update set kind = excluded.kind, value = excluded.value`
   with `('wolt','sum',50000)` → `lives_ok`.
6. As A: exactly one `wolt` row, now `sum` / 50000 (updated in place).
7. As A: `update … set value = 3 where merchant_key = 'wolt'` returns 1 row.
8. As A: plain insert of a second `wolt` → `throws_ok` 23505.
9. `kind = 'weekly'` → 23514.
10. `value = 0` → 23514.
11. `merchant_key = ''` → 23514.
12. As B: sees 0 rows of A.
13. As B: update of A's row → 0 rows (`with u as (update … returning 1) select is(count(*), 0::bigint …)`).
14. As B: delete of A's row → 0 rows.
15. As B: insert with `user_id` = A → 42501.
16. As B: own `wolt` row → `lives_ok` (keys are per user).
17. As B: moving own row to `user_id` = A (`update … set user_id = A`) → 42501 (update `with check`).
18. As A: value still 3 (B changed nothing).
19. As A: deleting A's import (cascade removes its transaction) leaves A's threshold in place (US-02 AC).
20. As A: `select public.delete_own_account()`; then as `postgres`: 0 thresholds with `user_id` = A remain.
21. As `postgres`: B's `wolt` row still exists.
22. `anon` insert → 42501.

#### 3. Types

**Files**: `src/db/database.types.ts` (generated — `npm run db:types`, never hand-edited), `src/types.ts`

**Intent**: Typed access for later phases.

**Contract**: `PatternThresholdRow = Tables<"pattern_thresholds">` beside `ImportRow` / `TransactionRow`.

### Success Criteria:

#### Automated Verification:

- `npx supabase db reset && npx supabase test db` — pgTAP baseline 54 (3 files) + 22 = 76 (4 files), all pass
- `npm run db:types` regenerates `src/db/database.types.ts` with `pattern_thresholds`; `git diff` of that file shows only the new table
- `npm run lint` 0 errors; `npx astro check` 0 errors (baseline 93 files, record the new count); `npm test` 78/78 (delta 0); `npm run fixture:check` OK; `npm run build` passes
- `BASE_URL=http://localhost:4398 npm run smoke` — 61 PASS (delta 0)
- Deliberate break (update policy, scratch edit + `db reset`): drop the update policy → assertions 5–7 FAIL (upsert/update); restored → green. Meta-check: insert-only assertions stay green, so the red proves the test reaches the UPDATE policy, not just INSERT
- Deliberate break (cascade, scratch edit): FK without `on delete cascade` → assertion 20 FAILs (delete_own_account errors or leaves rows); restored → green. Meta-check: proves the cascade, not an RLS filter hiding A's rows (the count runs as `postgres`)
- Migration file name matches `^[0-9]{14}_[a-z_]+\.sql$` and sorts after `20260924224014_import_ing_statement.sql`

#### Manual Verification:

- [reviewer] Every policy is per operation and per role (`authenticated` only), update has `using` + `with check`, no `import_id`, `user_id` FK `on delete cascade`; no `revoke update`
- [reviewer] pgTAP assertions 12–17 are read as RLS proofs, 3–7 as the app's upsert path, 19 as US-02 survival, 20–21 as FR-019 cascade; handoff records which break proved which

**Implementation Note**: proceed on green automated criteria; `[reviewer]` rows are closed by `/10x-impl-review`.

---

## Phase 2: Over-limit rule, input parsing and path helpers (pure, with unit oracle)

### Overview

The whole FR-011 rule and every parsing/encoding decision as pure functions, pinned by hand-built unit cases. No
DB, no UI.

### Changes Required:

#### 1. Over-limit rule

**File**: `src/lib/patterns/over-limit.ts` (new)

**Intent**: Deterministic per-transaction over amount and per-month sums for one pattern (PRD Business Logic
„Wynik”, decisions 1, 3, 17, 18).

**Contract**:
- `type ThresholdKind = "count" | "sum" | "amount"`; `interface Threshold { kind: ThresholdKind; value: number }`
  (exported from `src/types.ts`); `interface DatedTx { id: string; occurredOn: string; amountMinor: number }`.
- `appliesTo(threshold, type): boolean` — `count`/`sum` ↔ `frequent`, `amount` ↔ `fixed`.
- `monthOf(isoDate): string` (`YYYY-MM`); `referenceMonth(rows: { occurredOn: string }[]): string | null` (latest
  month, `null` for no rows).
- `overLimit(txs, threshold | null, type): { byTx: Map<string, number>; byMonth: Map<string, number> }` — only
  positive entries. Per calendar month, transactions in `(occurredOn, BigInt(id))` ascending order:
  `count N`: the (N+1)-th and later carry their full amount; `sum S`: the first transaction whose running total is
  **strictly** greater than S carries `running − S`, later ones their full amount (so the month total = monthSum −
  S); `amount A`: each transaction with amount **strictly** greater than A carries `amount − A`. Null or
  non-applicable threshold → empty maps. Output independent of input order.

#### 2. Threshold input and redirects

**File**: `src/lib/patterns/threshold-form.ts` (new)

**Intent**: Parse the editor's form and format stored values, with the endpoint's redirect targets, so validation
is proven without a server.

**Contract**:
- `thresholdSaveSchema = z.object({ key: z.string().min(1).max(500), kind: z.enum(["count","sum","amount"]), value:
  z.string(), month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).optional() })`;
  `thresholdDeleteSchema` = `key` + optional `month`.
- `parseThresholdValue(kind, raw): number | null` — strips spaces (incl. NBSP); `count`: `^\d+$`, 1–999; `sum` /
  `amount`: `^\d{1,7}([.,]\d{1,2})?$` → grosze (integer arithmetic, no float rounding: „55,1” → 5510), 1 grosz –
  100 000 000 grosze. Anything else (0, negative, letters, 3 decimals, empty) → `null`.
- `formatThresholdInput(threshold): string` — count → `"4"`; money → `"55"` when whole, else `"55,50"`.
- `thresholdRedirect(key, status: "saved" | "removed" | "error-value" | "error-save", month?)` →
  `patternHref(key, { saved: "1" } | { removed: "1" } | { error: "value" } | { error: "save" }, month)`.

#### 3. Detail path

**File**: `src/lib/patterns/path.ts` (new)

**Intent**: One place for the key ↔ URL mapping (decision 4).

**Contract**: `patternHref(key, params?: Record<string,string>, month?: string): string` →
`/patterns/${encodeURIComponent(key)}` plus a query string (`month` first when given);
`keyFromPath(pathname): string | null` — strips the `/patterns/` prefix, rejects empty, `decodeURIComponent` once
(on throw: the raw segment).

#### 4. Unit tests

**Files**: `test/unit/over-limit.test.ts`, `test/unit/threshold-form.test.ts` (new; path helpers tested in the
latter)

**Intent**: The oracle — hand-built cases, not the prototype's hard-coded marks.

**Contract**: over-limit cases:
1. US-01 Wolt: frequent, `count 4`, six May orders on six days → orders 5–6 flagged with full amounts; May total =
   their sum.
2. Months reset: April 5 orders, May 3, `count 4` → only April's 5th flagged.
3. `count N` with exactly N → nothing.
4. `sum 100,00 zł`, amounts 40 / 40 / 30 / 20 zł → third carries 10,00, fourth 20,00; month total 30,00 = 130 − 100.
5. Sum exactly 100,00 → nothing (strict).
6. Fixed, `amount 49,00`: 55,00 → 6,00; 49,00 → nothing; 45,00 → nothing.
7. Same-day tie: two transactions on one day, ids `"9"` and `"10"`, `count 1` → `"10"` flagged (numeric id order),
   also with the input reversed.
8. Mismatch: `count` on fixed → empty; `amount` on frequent → empty.
9. No threshold → empty.
10. Determinism: a shuffled copy of case 4 + 6 inputs → identical maps.
11. `referenceMonth`: latest month across years (`2025-12` vs `2026-01`); empty → `null`.
Form cases: `parseThresholdValue` accepts `"4"`, `"55"`, `"55,5"` (5550), `"55.50"`, `"1 000"` (money), rejects `"0"`,
`"-5"`, `"4.5"` (count), `"55,555"`, `""`, `"abc"`, `"1000"` (count > 999); `formatThresholdInput` round-trips with
the parser; schema rejects an empty key, unknown kind, month `2026-13`; `patternHref` / `keyFromPath` round-trip
`"kawiarnia smoke"`, `"restauracja pod przykładem"`, `"kawa-testowa.pl"`, `"a/b"`, `"100%"`; `keyFromPath` of
`"/patterns/"` → `null`.

### Success Criteria:

#### Automated Verification:

- `npm test` — Phase 1 count (78, 5 files) + 2 files, every new case green, delta 0 failures (record the new total)
- `npm run lint` 0 errors; `npx astro check` 0 errors (Phase 1 file count + 5, record it)
- `npm run fixture:check` OK; `npm run build` passes
- `npx supabase db reset && npx supabase test db` — 76 (delta 0 from Phase 1)
- `BASE_URL=http://localhost:4398 npm run smoke` — 61 PASS (delta 0)
- Deliberate break (boundary): `>` → `>=` in the sum rule → case 5 FAILs; restored → green. Meta-check: case 4 stays green, so the red pins the boundary, not the arithmetic
- Deliberate break (tie-break): compare ids as strings → case 7 FAILs; restored → green. Meta-check: proves numeric id order is observed (a string compare passes with single-digit ids)

#### Manual Verification:

- [reviewer] Each oracle case is traceable to PRD Business Logic „Wynik” / US-01 or to an Autonomous decision (1, 3, 17, 18); none copies the prototype's hard-coded marks

**Implementation Note**: proceed on green automated criteria.

---

## Phase 3: Keyset read, widened select, thresholds read and view models

### Overview

One read serves list and detail: keyset-paged (F2), with `occurred_on`, plus the thresholds read and pure view
models. `/patterns` renders exactly as before.

### Changes Required:

#### 1. Keyset paging and widened read

**File**: `src/lib/patterns/load.ts`

**Intent**: Close S-03 follow-up F2 (a delete mid-read no longer shifts pages) and carry dates for the detail.

**Contract**: `collectPages<T extends { id: number }>(fetchPage: (afterId: number | null) => Promise<{ rows: T[];
error: unknown }>)` — first call `null`, then the last row's `id`; stops on an empty page (a short page is **not**
the end — server caps may sit below `PAGE_SIZE`); any error fails the whole read; more than `MAX_PAGES` (exported,
1000) pages → error. No `count` query (decision 9). `loadPatterns` selects `id, amount_minor, counterparty, title,
occurred_on`, `.order("id").limit(PAGE_SIZE)` plus `.gt("id", afterId)` after the first page, and returns `{
patterns, rows }` where `rows: PatternSource[]`. Header comment updated (keyset; why no count).

#### 2. Types

**File**: `src/types.ts`

**Contract**: `PatternSource` gains `occurredOn: string` (`YYYY-MM-DD`); `Threshold` / `ThresholdKind` already live
in `src/types.ts` since Phase 2 (Phase 2 declares them there, never locally); `PatternListItem` unchanged in this
phase.

#### 3. Thresholds read

**File**: `src/lib/patterns/thresholds.ts` (new)

**Intent**: RLS-scoped read of the caller's thresholds keyed by merchant key.

**Contract**: `loadThresholds(supabase): Promise<{ thresholds: Map<string, Threshold> } | { error: unknown }>` —
`select merchant_key, kind, value`; a row whose `kind` is not one of the three is skipped (DB check makes it
unreachable). No paging: one row per pattern, far below `max_rows` (comment says so).

#### 4. View models

**File**: `src/lib/patterns/view.ts` (new)

**Intent**: Pure assembly of what the list and the detail render, unit-testable without a DB.

**Contract**:
- `listOverview(patterns, rows, thresholds): { referenceMonth: string | null; items: Array<{ key; threshold:
  Threshold | null; overMinor: number }> }` — `threshold` only when `appliesTo`; `overMinor` = reference-month total.
- `patternDetail(pattern, rows, threshold, referenceMonth, requestedMonth?)` → `{ months: string[]` (months with
  occurrences ∪ reference month, descending) `; month` (`requestedMonth` when in `months`, else reference month)
  `; threshold: Threshold | null` (applicable only) `; sumMinor; count; overMinor; sequence: boolean[]`
  (chronological, `true` = over) `; transactions: Array<{ id; occurredOn; counterparty; title; amountMinor;
  overMinor }>` (the month's rows, newest first) `}`.

#### 5. List page call site

**File**: `src/pages/patterns.astro`

**Intent**: Consume the new `loadPatterns` result shape; no visible change.

**Contract**: destructure `patterns` from the result; rendering unchanged.

#### 6. Unit tests

**Files**: `test/unit/patterns.test.ts` (rewrite the `collectPages` block; fixture mapping gains `occurredOn`),
`test/unit/pattern-view.test.ts` (new)

**Contract**: `collectPages`: capped server (short pages continue until empty; calls carry the last id), later-page
error fails as a whole, no rows → exactly one call, a row deleted between pages does **not** fail the read (every
remaining row returned once), a fetch that never returns an empty page stops with an error after `MAX_PAGES`.
View: reference month across patterns; mismatched threshold → `null` + `overMinor` 0; requested month not present →
reference month; a month without occurrences of this pattern → `count` 0, empty `sequence` / `transactions`;
transactions newest first while `sequence` is chronological.

### Success Criteria:

#### Automated Verification:

- `npm test` — Phase 2 count + 1 file; the rewritten `collectPages` cases and the view cases green; the F-02 fixture cases unchanged and green
- `npm run lint` 0 errors; `npx astro check` 0 errors (record file count)
- `npm run fixture:check` OK; `npm run build` passes
- `npx supabase db reset && npx supabase test db` — 76 (delta 0)
- `BASE_URL=http://localhost:4398 npm run smoke` — 61 PASS (delta 0; proves the list still reads through keyset paging against a real PostgREST)
- Deliberate break (keyset): make `fetchPage` ignore `afterId` in the „deleted between pages” test's fake by switching `collectPages` back to offset arithmetic (`rows.length`) → that case FAILs (skipped or duplicated row); restored → green. Meta-check: the capped-server case alone passes under both schemes, so only the mid-read-delete case distinguishes keyset from offset

#### Manual Verification:

- [reviewer] No `count: "exact"` remains in `load.ts`; the loop is bounded by `MAX_PAGES`; `/patterns` markup is byte-identical in intent (only the call site changed)

**Implementation Note**: proceed on green automated criteria.

---

## Phase 4: Pattern detail view (read-only)

### Overview

`/patterns/<key>` bound to the kit `patternDetail()`, without the editor: heading, month total and over-limit sum,
threshold panel status, month panel (select + sequence), transactions, not-found and error states, plus the shared
pieces it needs and their copy / gap rows.

### Changes Required:

#### 1. Route

**File**: `src/pages/patterns/[...key].astro` (new)

**Intent**: SSR detail; the key comes from the raw path (Critical Implementation Details).

**Contract**: `keyFromPath(Astro.url.pathname)`; `null` → redirect `/patterns`. `Promise.all([loadPatterns,
loadThresholds])`; either error → back link + `InlineAlert kind="error"` `copy.components.error` (`DESIGN-GAP:
K18`, as the list) + `console.error("pattern detail failed", …)`. Key not among patterns → `Astro.response.status =
404`, back link + `InlineAlert kind="info"` `x.detailMissing` (`DESIGN-GAP: G31`). Found → `patternDetail(…,
Astro.url.searchParams.get("month"))` and the kit layout (all SSR Astro except the month select):
- `.detail-top`: `BackLink` → `/patterns`, `copy.patternDetail.back`. (No „Akcje” — S-05.)
- `.detail-heading`: eyebrow `Badge tone={type}` + `x.detailEyebrow` („ wzorzec”); `h1` name; lead
  `x.typeLeads[type]`; `.detail-total` right-aligned: `x.sumLabel` with `{month}` = `x.monthsLocative[m]`, strong
  `formatMoney(sumMinor)`, small `{count} {plural(count, x.occurrenceForms)}`; below it the over-limit line
  (`DESIGN-GAP: G31`): label `copy.dashboard.stats[0].label` („Ponad progiem w tym miesiącu”) when `month ===
  referenceMonth`, else `x.overInMonth` („Ponad progiem w {month}”), value in its own element
  (`text-excess-text font-extrabold`) = `formatMoney(overMinor)`.
- `.detail-grid` (two columns ≥ 900 px, stacked below): `Panel` „Próg wzorca” (`x.thresholdPanel`) with status span
  `x.thresholdActive` / `x.thresholdNone`; body placeholder slot for Phase 5's editor (renders
  `copy.threshold.empty` / `copy.threshold.active` note meanwhile). `Panel` „Wystąpienia w miesiącu”
  (`x.occurrencesPanel`) with `MonthSelect`, `.sequence-large` of `SequenceMark` (`over` per `sequence`), and
  `.sequence-labels` `x.sequenceWithin` / `copyExtra.howItWorks.sequenceOver`; a month with no occurrences shows
  `x.monthEmpty` (`DESIGN-GAP: G31`) instead of the marks.
- `.transactions-panel`: `Panel` title `copy.patternDetail.transactions`, span `copy.patternDetail.rawDescription`;
  rows: date (`DD.MM.YYYY` from the ISO date, no time zone), raw description (`counterparty`, plus ` · title` when
  `title` is non-empty — decision 16), `formatMoney(amountMinor)`, and `Badge tone="excess"` `x.overBadge` („ponad
  próg”) when `overMinor > 0`.

#### 2. Shared components

**Files**: `src/components/app/Badge.tsx`, `src/components/app/BackLink.astro` (new),
`src/components/app/SequenceMark.astro` (new), `src/components/app/field-styles.ts` (new),
`src/components/patterns/MonthSelect.tsx` (new), `src/components/patterns/PatternsTable.tsx`

**Intent**: Missing-shared-component charges resolved once, on existing Tailwind names only.

**Contract**:
- `Badge` tone `excess`: `bg-excess text-ink` (kit `.badge.excess`); header comment updated.
- `BackLink.astro` props `{ href; label }`: kit `.back-link` — `Icon arrow-left` 15 + label, `text-muted`,
  visible focus ring as `buttonVariants` base.
- `SequenceMark.astro` props `{ over?: boolean; size?: "sm" | "md" }`: the kit `r` clip-path mark
  (`clip-path:polygon(0 0,57% 0,100% 43%,62% 66%,100% 100%,55% 100%,30% 70%,30% 100%,0 100%)`), `bg-muted` (kit
  `#728393`, no token — nearest name) / `bg-excess` when over; 27 px, 20 px ≤ 559 px; `aria-hidden`; the sequence
  wrapper carries a visually hidden summary for screen readers (count + over count, e.g. `x.sequenceSummary`
  „{n} wystąpień, {over} ponad próg” — G31 placeholder).
- `field-styles.ts`: `field` / `control` class strings moved verbatim out of `PatternsTable.tsx` (G29 comment moves
  with them); `PatternsTable` imports them (no visual change).
- `MonthSelect.tsx` props `{ months: { value: string; label: string }[]; value: string; label: string }`: kit
  `.select-field.small` — a `<form method="get">` whose `<select name="month">` calls `form.requestSubmit()` on
  change; `aria-label` = `x.occurrencesPanel`; option labels `formatMonthShort` („maj 2026”).

#### 3. Formatting

**File**: `src/lib/format.ts`

**Contract**: `formatMonthShort("2026-05")` → „maj 2026” (`Intl` pl-PL `month: "short", year: "numeric"`, UTC);
`formatIsoDate("2026-05-20")` → „20.05.2026” (string split, no time zone). Unit cases added to
`test/unit/format.test.ts`.

#### 4. Copy and gap register

**Files**: `src/content/copy.ts`, `context/foundation/design-kit.md`

**Intent**: Every rendered string via `copy` / `copyExtra.patterns`; every kit gap registered.

**Contract**: `copyExtra.patterns` gains
- under `// DESIGN-GAP: K21` — verbatim from `prototype/app.js` `patternDetail` / `thresholdEditor` / `patternRows` /
  `showToast`: `detailEyebrow: " wzorzec"`, `typeLeads: { fixed: "Sprzedawca o stałej, powtarzalnej kwocie.",
  frequent: "Sprzedawca, który wraca niezależnie od kwoty." }`, `thresholdPanel: "Próg wzorca"`, `thresholdActive:
  "aktywny"`, `thresholdNone: "brak ustawionego progu"`, `occurrencesPanel: "Wystąpienia w miesiącu"`,
  `sequenceWithin: "W ramach progu"`, `overBadge: "ponad próg"`, `occurrenceForms: ["wystąpienie", "wystąpienia",
  "wystąpień"]` (kit shows only „wystąpień”); and the month-parametrised `sumLabel: "Suma w {month}"` with
  `monthsLocative` (12 Polish locative forms: „styczniu” … „grudniu”; May reproduces the kit's „Suma w maju” byte for
  byte).
- under `// DESIGN-GAP: G31` — placeholders: `detailMissing: "Nie znaleziono tego wzorca — mógł zniknąć po
  usunięciu importu."`, `monthEmpty: "Brak wystąpień w tym miesiącu."`, `overInMonth: "Ponad progiem w {month}"`,
  `sequenceSummary: "{n} {occurrences}, {over} ponad próg"`.

`design-kit.md`: **K21** (detail / editor / list strings rendered only in `app.js`; `patternDetail.sumLabel` has the
month baked in → `{month}` + locative table; author adds keys), **G31** (states and pieces of the pattern detail and
threshold editor the kit does not define — not-found, month without occurrences, over-limit sum on the detail
(label reused from `dashboard.stats[0]` for the reference month, placeholder otherwise), sequence summary for screen
readers, `.seq` colour `#728393` / labels `#aebbc1` without tokens → `muted`; Phase 5 and 6 extend the row); G2 / G28
status notes „S-04: szczegół wzorca”; both appended to „Do rundy 3”.

#### 5. Smoke

**File**: `scripts/smoke.mjs`

**Intent**: Prove the route, the key round-trip (space) and the states over HTTP.

**Contract**: after „patterns list the re-imported merchant”:
1. „pattern detail renders the month total” — GET `/patterns/kawiarnia%20smoke` → 200 contains „Suma w maju”.
2. „pattern detail has no threshold yet” — same URL → 200 contains `>brak ustawionego progu<`.
3. „pattern detail of an unknown key is not found” — GET `/patterns/nie%20ma%20takiego` → `status: 404` (the runner
   reads bodies only for 200; the not-found copy is covered by the `[visual]` `not-found` screenshot).
Next to „import without a session goes to login”: 4. „pattern detail without a session goes to login” — anonymous
GET `/patterns/kawiarnia%20smoke` → 302 `/login`.

### Success Criteria:

#### Automated Verification:

- `npm run lint` 0 errors; `npx astro check` 0 errors (record file count)
- `npm test` — Phase 3 count + the new format cases, delta 0 failures
- `npm run fixture:check` OK; `npm run build` passes
- `npx supabase db reset && npx supabase test db` — 76 (delta 0)
- `BASE_URL=http://localhost:4398 npm run smoke` — 61 + 4 = 65 PASS
- Deliberate break (key round-trip): drop the `decodeURIComponent` in `keyFromPath` (the key stays `kawiarnia%20smoke`) → „pattern detail renders the month total” FAILs (404) and the unit round-trip case FAILs; restored → PASS. Meta-check: if the smoke stays green, the runtime hands a pre-decoded pathname and the fallback is doing the work — record that in the handoff (the break then proves the unit helper only, not the end-to-end path)
- No raw colours: `grep -rnE "#[0-9a-fA-F]{3,6}\b|\[#"` over the new / changed components and `[...key].astro` is empty
- `grep -n "DESIGN-GAP: K21\|DESIGN-GAP: G31"` finds each id in `copy.ts` and `[...key].astro`, and `design-kit.md` has rows K21, G31

#### Manual Verification:

- [reviewer] Every string on the page comes from `copy` / `copyExtra`; K21 strings match `prototype/app.js` byte for byte; placeholders are only the G31 ones
- [reviewer] `PatternsTable` renders identically after the `field-styles.ts` move (diff is an import only)

**Implementation Note**: the threshold panel body is a temporary note until Phase 5; screenshots happen in the
visual step after Phase 6.

---

## Phase 5: Threshold editor and write endpoints

### Overview

Save / change / remove a threshold from the detail: two form-POST endpoints, the editor island, the result lines.

### Changes Required:

#### 1. Save endpoint

**File**: `src/pages/api/patterns/threshold.ts` (new)

**Intent**: Upsert the caller's threshold for one key.

**Contract**: `export const prerender = false`; `POST` only; guard as `src/pages/api/imports/delete.ts` (no client /
no user → `/login`); formData in try/catch; `thresholdSaveSchema.safeParse` — no usable key → `/patterns`; kind /
value invalid (`parseThresholdValue` → `null`) → `thresholdRedirect(key, "error-value", month)`.
`supabase.from("pattern_thresholds").upsert({ merchant_key: key, kind, value }, { onConflict:
"user_id,merchant_key" })`; error → `console.error("threshold save failed", code, message)` + `"error-save"`;
else `"saved"`. No kind-vs-type check (decision 7).

#### 2. Delete endpoint

**File**: `src/pages/api/patterns/threshold/delete.ts` (new)

**Intent**: Remove the caller's threshold for one key.

**Contract**: same guard / parsing with `thresholdDeleteSchema`; `.delete().eq("merchant_key", key)`; error → log +
`"error-save"`; otherwise `"removed"` — idempotent: removing an absent threshold also lands on `removed`
(decision 8).

#### 3. Editor island

**File**: `src/components/patterns/ThresholdEditor.tsx` (new)

**Intent**: Kit `thresholdEditor(p)` on real state.

**Contract**: props `{ patternKey; type: PatternType; threshold: Threshold | null; month: string; copy: {…} }`.
`.threshold-switch`: fixed → one option `copy.threshold.acceptedAmount` (kind `amount`); frequent → `countPerMonth`
(`count`) and `sumPerMonth` (`sum`) as `aria-pressed` buttons (`type="button"`), active = stored kind or `count`;
kit classes mapped to tokens (active: `border-ink bg-ink text-paper`; idle: `border-line text-muted`).
Save form `method="POST" action="/api/patterns/threshold"` with hidden `key`, `kind`, `month`; field label
`x.valueLabel.amount` („Kwota”) for `amount` and `sum` (decision 11) / `x.valueLabel.count` („Liczba wystąpień”);
input-with-suffix (kit `.input-suffix`: `border-line rounded-lg bg-paper`, suffix `text-muted`; focus-within ring as
`field-styles`) `name="value"`, `inputMode` `numeric` / `decimal`, `placeholder="—"`, `defaultValue` =
`formatThresholdInput` when the stored kind equals the active kind, else empty; suffix `x.suffix.money` („zł”) /
`x.suffix.count` („×”). Note `copy.threshold.empty` / `.active`. `.threshold-actions`: `SubmitButton variant="primary"
size="default" showArrow={false} pending={…} pendingText={copyExtra.auth.saving}` with `x.setThreshold` („Ustaw
próg”) when no threshold else `copy.threshold.save`; when a threshold exists, `Button variant="text" size="inline"
type="submit" form={deleteFormId}` `copy.threshold.remove`, the delete form a sibling (hidden `key`, `month`).

#### 4. Detail page wiring and result lines

**File**: `src/pages/patterns/[...key].astro`

**Contract**: the threshold panel renders `ThresholdEditor client:load`. Above the editor (inside the panel), from
`Astro.url.searchParams`: `saved` → `InlineAlert success` `copy.components.success` („Sukces — próg zapisany.”);
`removed` → `InlineAlert success` `x.thresholdRemoved` („Próg usunięty.”, K21 verbatim toast); `error=value` →
`InlineAlert error` `x.thresholdInvalid`; `error=save` → `InlineAlert error` `x.thresholdSaveError` (both G31).
A stored threshold whose kind does not apply renders exactly as „no threshold” (decision 3).

#### 5. Copy and gap register

**Files**: `src/content/copy.ts`, `context/foundation/design-kit.md`

**Contract**: K21 block gains `setThreshold: "Ustaw próg"`, `thresholdRemoved: "Próg usunięty."`, `valueLabel: {
amount: "Kwota", count: "Liczba wystąpień" }`, `suffix: { money: "zł", count: "×" }`; G31 block gains
`thresholdInvalid: "Podaj wartość większą od zera — liczbę całkowitą lub kwotę z najwyżej dwoma miejscami po
przecinku."`, `thresholdSaveError: "Nie udało się zapisać progu. Spróbuj ponownie."`. G31 row extended: validation /
save-failure / pending states, sum-kind field reusing „Kwota” / „zł”, mismatched stored kind shown as „brak
ustawionego progu”, result via `InlineAlert` instead of the kit toast (G30 precedent).

#### 6. Smoke

**File**: `scripts/smoke.mjs`

**Contract**: after „pattern detail has no threshold yet”, on key `kawiarnia smoke` (fixed, 45,50 zł):
1. „threshold with a zero value is rejected” — POST `/api/patterns/threshold` `{ key: "kawiarnia smoke", kind:
   "amount", value: "0" }` → 302 `/patterns/kawiarnia%20smoke?error=value`.
2. „threshold is saved” — `value: "30"` → 302 `/patterns/kawiarnia%20smoke?saved=1`.
2a. „threshold is changed” — same key and kind, `value: "40"` → 302 `/patterns/kawiarnia%20smoke?saved=1` (the
   `upsert … onConflict: "user_id,merchant_key"` update path through the real PostgREST — pgTAP proves only the SQL
   statement; steps 5 and the Phase 6 list steps then read `>5,50 zł<`, which a non-updated 30 zł threshold would
   render as `>15,50 zł<`, so they also prove the row was updated in place, not duplicated).
3. „pattern detail confirms the saved threshold” — GET `/patterns/kawiarnia%20smoke?saved=1` → 200 contains
   „Sukces — próg zapisany.”.
4. „pattern detail marks the over-limit transaction” — GET `/patterns/kawiarnia%20smoke` → 200 contains
   `>ponad próg<`.
5. „pattern detail shows the over-limit sum” — same → 200 contains `>5,50 zł<`.
6. „threshold is removed” — POST `/api/patterns/threshold/delete` `{ key: "kawiarnia smoke" }` → 302
   `/patterns/kawiarnia%20smoke?removed=1`.
7. „pattern detail drops the over-limit mark after removal” — GET → 200 contains `>brak ustawionego progu<`,
   notContains `>ponad próg<`.
Next to the anonymous steps: 8. „threshold save without a session goes to login” — anonymous POST → 302 `/login`.
(Phase 6 inserts its list steps between 5 and 6.)

### Success Criteria:

#### Automated Verification:

- `npm run lint` 0 errors; `npx astro check` 0 errors (record file count)
- `npm test` — Phase 4 count, delta 0 failures
- `npm run fixture:check` OK; `npm run build` passes
- `npx supabase db reset && npx supabase test db` — 76 (delta 0)
- `BASE_URL=http://localhost:4398 npm run smoke` — 65 + 9 = 74 PASS
- Deliberate break (app validation): in the save endpoint, send the raw string through `Number()` instead of `parseThresholdValue` → „threshold with a zero value is rejected” FAILs (the DB check rejects 0 → `?error=save`, not `?error=value`); restored → PASS. Meta-check: the DB would also refuse 0, so only the redirect difference proves the app-side validation ran
- Deliberate break (over mark): make the detail pass `threshold: null` into `patternDetail` → steps 4–5 FAIL while step 3 still PASSes; restored → PASS. Meta-check: proves the badge/sum come from the evaluated threshold, not from the saved-line render
- No raw colours in `ThresholdEditor.tsx` and the changed page; `DESIGN-GAP: K21` / `G31` comments present for the new keys

#### Manual Verification:

- [reviewer] Endpoints mirror `src/pages/api/imports/delete.ts` (guard, parse, log, redirect); no path writes without zod + `parseThresholdValue`; client never sends `user_id`
- [reviewer] Keyboard: kind switch buttons reachable and `aria-pressed` correct; „Usuń próg” submits only the delete form; pending text appears on save

**Implementation Note**: proceed on green automated criteria.

---

## Phase 6: `/patterns` columns and row link

### Overview

Lift the G28 omissions this slice owns: Próg, Ponad progiem, row link and arrow.

### Changes Required:

#### 1. List data

**Files**: `src/types.ts`, `src/pages/patterns.astro`

**Contract**: `PatternListItem` gains `threshold: Threshold | null` and `overMinor: number`; the page loads
thresholds beside patterns (`Promise.all`; thresholds error → the existing error branch) and merges
`listOverview(…)`. `tableCopy.columns` = all six `copy.patterns.columns`; adds `thresholdCount`, `thresholdSum`,
`openPattern`.

#### 2. Table

**File**: `src/components/patterns/PatternsTable.tsx`

**Intent**: Kit `patternRows()` columns and links.

**Contract**: header order Sprzedawca, Typ, Wystąpienia, Suma, Kwota (K17), Próg, Ponad progiem, empty `<th>`
(arrow). Name cell = `<a href={patternHref(p.key)}>` (kit `.table-name`, focus ring visible). Próg cell: `count` →
`x.thresholdCount` („{n} × / miesiąc”, K21 verbatim format), `amount` → `formatMoney(value)`, `sum` →
`x.thresholdSum` („{amount} / miesiąc”, G31 placeholder), none → „—”. Ponad progiem: `overMinor > 0` →
`text-excess-text font-extrabold` `formatMoney`, else „—” (reference month — decision 10). Arrow cell: kit
`.icon-button` link `aria-label={x.openPattern}` („Otwórz wzorzec”, K21) with `Glyph arrow`. Header comment:
G28 now lists only what stays omitted (status badges S-06, excluded section S-05, „Pokaż więcej”).

#### 3. Copy and gap register

**Files**: `src/content/copy.ts`, `context/foundation/design-kit.md`

**Contract**: K21 block gains `thresholdCount: "{n} × / miesiąc"`, `openPattern: "Otwórz wzorzec"`; G31 block gains
`thresholdSum: "{amount} / miesiąc"`. G28 row status: „S-04: kolumny Próg / Ponad progiem i link wiersza
dostarczone”; G31 row notes the list column shows the reference month without a month label.

#### 4. Smoke

**File**: `scripts/smoke.mjs`

**Contract**: between „pattern detail shows the over-limit sum” and „threshold is removed”:
1. „patterns list shows the threshold” — GET `/patterns` → 200 contains `>40,00 zł<`.
2. „patterns list shows the over-limit sum” — contains `>5,50 zł<`.
3. „patterns list links the pattern detail” — contains `href="/patterns/kawiarnia%20smoke"`.

### Success Criteria:

#### Automated Verification:

- `npm run lint` 0 errors; `npx astro check` 0 errors (record file count)
- `npm test` — Phase 5 count, delta 0 failures
- `npm run fixture:check` OK; `npm run build` passes
- `npx supabase db reset && npx supabase test db` — 76 (delta 0 from Phase 1; +22 over the S-02 baseline)
- `BASE_URL=http://localhost:4398 npm run smoke` — 74 + 3 = 77 PASS (+16 over the S-02 baseline 61)
- Deliberate break: render „—” in the Próg cell unconditionally → „patterns list shows the threshold” FAILs; restored → PASS. Meta-check: the island props carry the threshold as the number `4000`, never „40,00 zł”, so only the rendered cell can satisfy the step
- No raw colours in `PatternsTable.tsx`; `DESIGN-GAP: G28` comment updated; K21 / G31 keys used by the table carry their comments

#### Manual Verification:

- [visual] Screenshots, desktop 1440 px and mobile ~400 px, on `astro dev --port 4399` with a freshly registered local account that imported the synthetic ING fixture (`npm run fixture:ing`; never the seeded `test@rytm.local`), thresholds set on at least one pattern of each kind: `list-with-thresholds` (Próg for count, sum and amount, Ponad progiem values and „—”), `detail-default` (reference month, no `?month`), `editor-count`, `editor-sum`, `editor-amount`, `over-limit-marked` (sequence marks + „ponad próg” badges + over sum), `no-threshold` („brak ustawionego progu”, „Ustaw próg”), `empty-month` (a `?month` where the pattern has no occurrences), `saved` (`?saved=1`), `removed` (`?removed=1`), `error-value` (`?error=value`), `error-read` (detail with Supabase stopped or a forced error), `not-found` (unknown key), `month-other` (non-reference month: „Ponad progiem w …”), `link-focus` (keyboard focus on a row link and the arrow)
- [visual] At ~400 px the detail stacks (heading, total, panels, transactions) without horizontal page scroll; the table scrolls inside its panel with the arrow column reachable
- [visual] A dotted key (`kawa-testowa.pl`) and a key with spaces / diacritics open their detail from the list link
- [reviewer] `copyExtra.patterns` K21 strings match `prototype/app.js` byte for byte; placeholders are only the G31 ones; `design-kit.md` K21 / G31 rows describe every placeholder
- [human] Product owner confirms decisions 1 (excess part for sum / fixed, against US-01 AC) and 2 (reference month = latest month in the data) — reversible by changing `over-limit.ts` / `referenceMonth` only

**Implementation Note**: the Visual step performs the `[visual]` rows; `[human]` stays open on the post-run checklist.

---

## Testing Strategy

### Unit Tests:

- `test/unit/over-limit.test.ts` — the oracle (11 cases above): count / sum / amount rules, month reset, strict
  boundaries, numeric-id tie-break, mismatch, no threshold, determinism, reference month.
- `test/unit/threshold-form.test.ts` — value parsing / formatting, schema, path helpers round-trip.
- `test/unit/pattern-view.test.ts` — list overview and detail view models.
- `test/unit/patterns.test.ts` — keyset `collectPages` (rewritten block), fixture cases with `occurredOn`.
- `test/unit/format.test.ts` — `formatMonthShort`, `formatIsoDate`.

### Integration Tests:

- pgTAP `pattern_thresholds.test.sql` (22): RLS per operation, upsert path, constraints, import-delete survival,
  account-delete cascade, anon denied.
- Smoke (+16): detail renders, no-threshold, not-found, anonymous detail; zero value rejected, save, change (upsert
  conflict path through PostgREST), saved line,
  over mark, over sum, list threshold, list over sum, list link, remove, mark gone, anonymous save.

### Manual Testing Steps:

1. `npx supabase start`; `ASTRO_DEV_BACKGROUND=1 npx astro dev --port 4399 --ignore-lock`.
2. Register a fresh local account; import the synthetic fixture CSV (`npm run fixture:ing` output).
3. Open a frequent pattern from `/patterns`; set „Liczba na miesiąc” below its busiest month; see marks, badges and
   the sum; switch to „Suma na miesiąc”; switch months.
4. Open a fixed pattern; set an accepted amount below its amount; see the over part; remove the threshold.
5. Back on `/patterns`: Próg and Ponad progiem columns match the details. Kill the server (`lsof -ti :4399 | xargs kill`).

## Performance Considerations

One keyset-paged read of all debits per page view (as today, plus one `date` column and one extra empty-page
request), plus one small thresholds select. The detail re-runs the full read (grouping is in JS); at MVP volumes
(thousands of rows) this is a few pages. No caching.

## Migration Notes

New table only; no data to move. Ship step: `npx supabase db push` to the hosted project **before** merge (agent
contract), then `npm run db:types` is already committed. Invariant kept: thresholds key on `merchant_key` +
`user_id`, never `import_id`. Risk carried: a future change to `normalizeMerchant` re-keys merchants and orphans
thresholds (header comment of `merchant.ts`).

## References

- Research: `context/changes/pattern-threshold-over-limit/research.md`; identity: `change.md`
- PRD: `context/foundation/prd.md` (Business Logic „Wynik”, US-01, US-02 AC, FR-008/010/011)
- Read / derive: `src/lib/patterns/load.ts` `collectPages` / `loadPatterns`, `src/lib/patterns/derive.ts`
  `derivePatterns` / `d5Type`, `src/lib/patterns/merchant.ts` `merchantKey`
- Write precedent: `src/pages/api/imports/delete.ts` `POST`, `src/lib/import/delete.ts`
- Migration / pgTAP precedent: `supabase/migrations/20260923165530_domain_imports_transactions.sql`,
  `supabase/tests/database/import_delete.test.sql`
- Kit: `design/rytm-os/prototype/app.js` (`patternDetail`, `thresholdEditor`, `patternRows`, `badge`),
  `design/rytm-os/prototype/styles.css` (`.detail-*`, `.threshold-*`, `.input-suffix`, `.seq`, `.sequence-*`,
  `.badge.excess`, `.excess-value`, `.icon-button`), `design/rytm-os/react-kit/docs/content.json`
- Follow-ups: `context/archive/2026-09-25-undo-import/follow-ups/review-fixes.md` (F2 keyset — closed here, F5
  `text` variant — used here, key invariant)
- Format example: `context/archive/2026-09-25-undo-import/plan.md`

## Autonomous decisions

Made by the plan step of run `2026-09-27-s03-s02-s04` in place of asking a human.

1. **Over amount = excess part for `sum` and `amount`; full amount for `count`.** Chosen per-transaction `overMinor`
   (sum: crossing transaction carries `running − S`, later ones full; amount: `amount − A`). **This decides against
   the literal text of PRD US-01 AC** („suma kwot transakcji oznaczonych”) for the sum and fixed kinds, and follows
   PRD Business Logic „Wynik” („suma miesiąca minus próg”, „kwota wystąpienia minus akceptowana kwota”). Rejected:
   full flagged amounts for every kind (reports a 55 zł charge as 55 zł over a 49 zł accepted amount). Why: Business
   Logic is the specific definition of „nadwyżka”; the US-01 Wolt example (count) is identical under both. Would
   change: the product owner declaring US-01 AC normative → only `overLimit` and cases 4 / 6 change.
2. **„w tym miesiącu” = latest calendar month present in the user's transactions**, one global reference month;
   `?month=YYYY-MM` selects another month on the detail. **This departs from the literal „bieżący miesiąc” wording**
   in PRD Business Logic / US-04, which the PRD never pins to the wall clock. Rejected: wall-clock month (empty for
   historical imports — the fixture ends 2026-08, today is 2026-09 — and clock-dependent against the determinism
   guardrail); per-pattern latest month (the list column would mix months). Would change: regular monthly imports
   becoming the norm, or the product owner choosing the wall-clock month → only `referenceMonth` changes.
3. **Type flip: keep the stored row, apply it only when its kind matches the current D5 type**; a mismatched row
   renders as „brak ustawionego progu” and is overwritten by the next save. Rejected: delete on flip (reads would
   write), convert kinds (no meaningful count → amount mapping), showing the stale threshold (needs copy the kit
   lacks). Would change: S-05 user-pinned types requiring an explicit reset.
4. **Route `src/pages/patterns/[...key].astro`, link `encodeURIComponent(key)`, key read from `Astro.url.pathname`
   and decoded once.** Rejected: `[key]` (a `/` in a key breaks matching), `?key=` (kit URL is `#/patterns/:id`).
   Would change: a slug column (would need storage) or the runtime decoding pathnames (fallback already in
   `keyFromPath`).
5. **No `updated_at`**; `created_at` only. Rejected: writer-set `updated_at` (no reader, no trigger precedent, easy to
   forget). Would change: a feature that shows when a threshold changed.
6. **One threshold per pattern** (`unique (user_id, merchant_key)`; FR-010 „liczba wystąpień **lub** suma”).
   Would change: the PRD allowing count and sum together.
7. **Form-POST endpoints `POST /api/patterns/threshold` and `POST /api/patterns/threshold/delete`**, redirect with a
   status param; the save does not re-derive the pattern to check kind vs type. Rejected: fetch/JSON API (no
   precedent), a server-side type check (full read on every write; the evaluator already ignores a mismatch).
   Would change: a client-side editor needing JSON responses.
8. **Delete is idempotent** (absent threshold → `?removed=1`). Rejected: a not-found branch (S-02 style) — nothing is
   lost and the page shows the true state after redirect. Would change: auditing needs.
9. **S-03 F2 keyset paging in scope, `count` query dropped**; stop on an empty page, bounded by `MAX_PAGES`.
   Rejected: keeping offset (touching the read twice), keeping `count` (no longer detects anything useful under
   keyset). Would change: evidence that PostgREST ordering by `id` with `gt` misses rows (it cannot under RLS on a PK).
10. **List „Ponad progiem” = the reference month's over-limit sum**, no month label (G31). Rejected: all-months total
    (FR-011 names the month). Would change: the kit author adding a column label with the month.
11. **Sum kind reuses „Kwota” / „zł”** for its field (kit draws no sum variant); list cell „{amount} / miesiąc”
    placeholder (G31). Would change: kit delivering sum-kind copy.
12. **Detail shows the over-limit sum under the month total**, labelled with `dashboard.stats[0].label` („Ponad
    progiem w tym miesiącu”) for the reference month and a placeholder „Ponad progiem w {month}” otherwise (G31).
    Rejected: omitting it (FR-011 needs the sum where the threshold is set), a new stat card (invented UI). Would
    change: the kit placing the sum elsewhere on the detail.
13. **`sumLabel` = „Suma w {month}” with a 12-entry Polish locative table** (K21); May reproduces the kit string.
    Rejected: nominative („Suma w maj”) or a numeric month. Would change: kit key with a placeholder.
14. **Default month = reference month even when the pattern has no occurrences there**; that month shows the
    `monthEmpty` placeholder (G31); the select lists the pattern's months plus the reference month. Rejected:
    defaulting to the pattern's own latest month (detail and list would disagree). Would change: review finding the
    empty default confusing for rare patterns.
15. **Result feedback via redirect + `InlineAlert` inside the threshold panel**; success uses the kit's
    `components.success`, removal the kit toast text „Próg usunięty.”. Rejected: a Toast component. Would change: a
    shared Toast landing on `main`.
16. **Raw description = `counterparty`, plus „ · title” when the title is non-empty.** Rejected: counterparty only
    (operator payments would show just „PayU” under a merchant named from the title), `details` (it is the ING
    transaction type). Would change: kit author defining „opis surowy” precisely.
17. **Chronology tie-break `(occurred_on, id)`**, id numeric. Determinism holds because `import_ing_statement`
    inserts the payload in file order. Would change: a need for order independent of insert order (`bank_tx_id`).
18. **Strict boundaries**: sum over only when the running total **exceeds** S; amount over only when **greater** than
    A; count N flags from the (N+1)-th. Would change: product owner reading „przekracza” as ≥.
19. **Month select = small island submitting a GET form on change** (no JS → select without auto-submit). Rejected:
    links per month (kit draws a select). Would change: accessibility review requiring an explicit submit button.
20. **Sequence colours**: kit `#728393` → `muted`, `#aebbc1` labels → `muted`, over → `excess`; the „Ponad próg” label
    uses `excess-text` for contrast. Registered in G31. Would change: tokens for these kit values.
21. **Six code phases, no deploy phase**; storage → pure logic → read → detail → write → list. Would change: an
    implementer finding a phase not independently green (then merge it with the next).
22. **Gap rows K21 / G31 and `copyExtra` keys land with the code (Phases 4–6)**, not in this docs commit — the
    register must not point at code that does not exist. Would change: the orchestrator requiring gaps at plan time.
23. **Value bounds**: count 1–999; money 0,01 – 1 000 000 zł; DB check `value > 0 and value <= 100000000`. Would
    change: real data exceeding them.
24. **Plan review (2026-09-27) upheld decisions 1–3 against the PRD** and added one smoke step („threshold is
    changed”, Phase 5) so the FR-010 „zmienić” path is proven through PostgREST, not only in SQL. Decision 1 follows
    PRD Business Logic „Wynik”, which defines the „nadwyżka” amount explicitly per kind; US-01 AC's „suma kwot
    transakcji oznaczonych” is compatible if „kwota” is read as the flagged over amount, and identical for the count
    example it illustrates. Decision 2: PRD „Gdzie użytkownik spotyka regułę” says „w bieżącym miesiącu oraz … w
    poprzednich miesiącach” without pinning the clock; for historical CSV imports the latest data month is the only
    non-empty, deterministic reading. Would change: the product owner answering `[human]` row 6.12 otherwise.

## Known risks

- **`Astro.url.pathname` decoding** is asserted by smoke only for a space; `%` and `/` keys are covered by unit tests
  of `keyFromPath` and the `[visual]` dotted-key row, not end-to-end.
- **Double decode** for a key containing a literal `%XX` escape (e.g. `abc%41`): Astro 7.3.2 repeatedly
  `decodeURI`s the pathname before routing (plan review, `validateAndDecodePathname`), so such a key opens a
  different or missing pattern (404 not-found state). Not seen in the fixture (keys come from bank descriptions); a
  slug / id column would remove it (decision 4).
- **Unbounded threshold rows**: the save endpoint accepts any `key` (no pattern-existence check, decision 7), so a
  user can craft POSTs that store thresholds for keys they do not have; `loadThresholds` does not page, so beyond the
  PostgREST `max_rows` cap rows would be silently dropped. Self-inflicted only (RLS scopes rows to the caller); fix
  with keyset paging in `loadThresholds` if ever observed.
- **Normalizer drift** orphans stored thresholds (no re-key migration exists).
- **Astro check file count** is recorded, not asserted — only the error delta gates.

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: `pattern_thresholds` table and its proofs

#### Automated

- [x] 1.1 `npx supabase db reset && npx supabase test db` — pgTAP baseline 54 (3 files) + 22 = 76 (4 files), all pass — 6e5c08c
- [x] 1.2 `npm run db:types` regenerates `src/db/database.types.ts` with `pattern_thresholds`; diff shows only the new table — 6e5c08c
- [x] 1.3 `npm run lint` 0; `npx astro check` 0 errors (file count recorded); `npm test` 78/78 (delta 0); `npm run fixture:check` OK; `npm run build` passes — 6e5c08c
- [x] 1.4 `BASE_URL=http://localhost:4398 npm run smoke` — 61 PASS (delta 0) — 6e5c08c
- [x] 1.5 Deliberate break (update policy dropped) → assertions 5–7 FAIL; restored → green; meta-check recorded — 6e5c08c
- [x] 1.6 Deliberate break (FK without cascade) → assertion 20 FAILs; restored → green; meta-check recorded — 6e5c08c
- [x] 1.7 Migration file name matches `^[0-9]{14}_[a-z_]+\.sql$` and sorts after `20260924224014_import_ing_statement.sql` — 6e5c08c

#### Manual

- [ ] 1.8 [reviewer] Policies per operation and role, update `using` + `with check`, no `import_id`, cascade FK, no `revoke update`
- [ ] 1.9 [reviewer] pgTAP assertions mapped to RLS / upsert / survival / cascade proofs; handoff records which break proved which

### Phase 2: Over-limit rule, input parsing and path helpers (pure, with unit oracle)

#### Automated

- [x] 2.1 `npm test` — Phase 1 count + 2 files, every new case green, delta 0 failures — dac4eff
- [x] 2.2 `npm run lint` 0; `npx astro check` 0 errors (file count recorded) — dac4eff
- [x] 2.3 `npm run fixture:check` OK; `npm run build` passes — dac4eff
- [x] 2.4 `npx supabase db reset && npx supabase test db` — 76 (delta 0) — dac4eff
- [x] 2.5 `BASE_URL=http://localhost:4398 npm run smoke` — 61 PASS (delta 0) — dac4eff
- [x] 2.6 Deliberate break (sum boundary `>` → `>=`) → case 5 FAILs; restored → green; meta-check recorded — dac4eff
- [x] 2.7 Deliberate break (ids compared as strings) → case 7 FAILs; restored → green; meta-check recorded — dac4eff

#### Manual

- [ ] 2.8 [reviewer] Each oracle case traceable to PRD „Wynik” / US-01 or an Autonomous decision; none copies prototype marks

### Phase 3: Keyset read, widened select, thresholds read and view models

#### Automated

- [x] 3.1 `npm test` — Phase 2 count + 1 file; keyset `collectPages` and view cases green; F-02 fixture cases unchanged and green — 3e45b8c
- [x] 3.2 `npm run lint` 0; `npx astro check` 0 errors (file count recorded) — 3e45b8c
- [x] 3.3 `npm run fixture:check` OK; `npm run build` passes — 3e45b8c
- [x] 3.4 `npx supabase db reset && npx supabase test db` — 76 (delta 0) — 3e45b8c
- [x] 3.5 `BASE_URL=http://localhost:4398 npm run smoke` — 61 PASS (delta 0) — 3e45b8c
- [x] 3.6 Deliberate break (offset arithmetic back in `collectPages`) → „deleted between pages” case FAILs; restored → green; meta-check recorded — 3e45b8c

#### Manual

- [ ] 3.7 [reviewer] No `count: "exact"` in `load.ts`; loop bounded by `MAX_PAGES`; `/patterns` changed only at the call site

### Phase 4: Pattern detail view (read-only)

#### Automated

- [ ] 4.1 `npm run lint` 0; `npx astro check` 0 errors (file count recorded)
- [ ] 4.2 `npm test` — Phase 3 count + format cases, delta 0 failures
- [ ] 4.3 `npm run fixture:check` OK; `npm run build` passes
- [ ] 4.4 `npx supabase db reset && npx supabase test db` — 76 (delta 0)
- [ ] 4.5 `BASE_URL=http://localhost:4398 npm run smoke` — 61 + 4 = 65 PASS
- [ ] 4.6 Deliberate break (decode dropped in `keyFromPath`) → „pattern detail renders the month total” and the unit round-trip FAIL; restored → PASS; meta-check recorded
- [ ] 4.7 No raw colours in new / changed components and `[...key].astro`
- [ ] 4.8 `DESIGN-GAP: K21` / `G31` in `copy.ts` and `[...key].astro`; rows K21, G31 in `design-kit.md`

#### Manual

- [ ] 4.9 [reviewer] Every string from `copy` / `copyExtra`; K21 byte-for-byte with `app.js`; only G31 placeholders new
- [ ] 4.10 [reviewer] `PatternsTable` unchanged apart from the `field-styles.ts` import

### Phase 5: Threshold editor and write endpoints

#### Automated

- [ ] 5.1 `npm run lint` 0; `npx astro check` 0 errors (file count recorded)
- [ ] 5.2 `npm test` — Phase 4 count, delta 0 failures
- [ ] 5.3 `npm run fixture:check` OK; `npm run build` passes
- [ ] 5.4 `npx supabase db reset && npx supabase test db` — 76 (delta 0)
- [ ] 5.5 `BASE_URL=http://localhost:4398 npm run smoke` — 65 + 9 = 74 PASS
- [ ] 5.6 Deliberate break (`Number()` instead of `parseThresholdValue`) → „threshold with a zero value is rejected” FAILs; restored → PASS; meta-check recorded
- [ ] 5.7 Deliberate break (detail passes `threshold: null`) → over mark / over sum steps FAIL, saved line PASSes; restored → PASS; meta-check recorded
- [ ] 5.8 No raw colours in `ThresholdEditor.tsx` / changed page; `DESIGN-GAP` comments for the new keys

#### Manual

- [ ] 5.9 [reviewer] Endpoints mirror `api/imports/delete.ts`; no write without zod + `parseThresholdValue`; no client `user_id`
- [ ] 5.10 [reviewer] Keyboard: kind switch `aria-pressed`, „Usuń próg” submits only the delete form, pending text on save

### Phase 6: `/patterns` columns and row link

#### Automated

- [ ] 6.1 `npm run lint` 0; `npx astro check` 0 errors (file count recorded)
- [ ] 6.2 `npm test` — Phase 5 count, delta 0 failures
- [ ] 6.3 `npm run fixture:check` OK; `npm run build` passes
- [ ] 6.4 `npx supabase db reset && npx supabase test db` — 76 (+22 over the S-02 baseline)
- [ ] 6.5 `BASE_URL=http://localhost:4398 npm run smoke` — 74 + 3 = 77 PASS (+16 over the S-02 baseline 61)
- [ ] 6.6 Deliberate break (Próg cell always „—”) → „patterns list shows the threshold” FAILs; restored → PASS; meta-check recorded
- [ ] 6.7 No raw colours in `PatternsTable.tsx`; `DESIGN-GAP: G28` updated; K21 / G31 comments on the table keys

#### Manual

- [ ] 6.8 [visual] Screenshots desktop 1440 px + mobile ~400 px: `list-with-thresholds`, `detail-default`, `editor-count`, `editor-sum`, `editor-amount`, `over-limit-marked`, `no-threshold`, `empty-month`, `saved`, `removed`, `error-value`, `error-read`, `not-found`, `month-other`, `link-focus`
- [ ] 6.9 [visual] At ~400 px the detail stacks without horizontal page scroll; table scrolls inside its panel with the arrow column reachable
- [ ] 6.10 [visual] Dotted key (`kawa-testowa.pl`) and a key with spaces / diacritics open their detail from the list link
- [ ] 6.11 [reviewer] K21 strings byte-for-byte with `app.js`; only G31 placeholders new; `design-kit.md` rows describe every placeholder
- [ ] 6.12 [human] Product owner confirms decisions 1 (excess part, against US-01 AC) and 2 (reference month = latest month in data)
