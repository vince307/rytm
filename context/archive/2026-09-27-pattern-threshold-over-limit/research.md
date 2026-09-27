---
date: 2026-09-27T21:16:13+02:00
researcher: Claude (research step, autonomous run 2026-09-27-s03-s02-s04)
git_commit: 7409a20c48d35dcf27f00172f63bca3b8154989a
branch: feat/pattern-threshold-over-limit
repository: Rytm
topic: "S-04 pattern-threshold-over-limit — over-limit rules, „w tym miesiącu”, type flip, threshold storage, detail route/read, kit binding"
tags: [research, patterns, thresholds, over-limit, supabase, rls, pgtap, design-kit]
status: complete
last_updated: 2026-09-27
last_updated_by: Claude (research step)
---

# Research: S-04 `pattern-threshold-over-limit`

**Date**: 2026-09-27T21:16:13+02:00 · **Git Commit**: `7409a20` · **Branch**: `feat/pattern-threshold-over-limit` · **Repository**: Rytm

## Research Question

Derived from `change.md` (Notes → „Next”, roadmap corrections, triggered follow-ups), no human asked:

1. PRD business logic for the three threshold kinds (count / sum / accepted amount): which transactions are flagged
   „ponad próg” and what amount counts toward „ponad progiem w tym miesiącu”.
2. What „w tym miesiącu” means.
3. What happens to a stored threshold when D5 flips a pattern fixed↔frequent.
4. Threshold storage: the migration + pgTAP pattern to copy for a new per-user table.
5. Detail route and lookup by `merchantKey`; widened read (dates, raw description); keyset paging (S-03 F2).
6. Kit binding: prototype views/components, existing shared components, exact kit copy vs gaps.
7. A unit oracle for the over-limit rules.

## Summary

- **PRD rule (Business Logic → „Wynik”)** defines all three kinds; for the *count* kind it agrees with US-01, for the
  *sum* and *fixed* kinds it counts only the part above the threshold, while US-01 AC / US-05 AC define the monthly
  total as the sum of the full amounts of flagged transactions. **The PRD contradicts itself for sum and fixed** — the
  plan must pick one; recommendation below (Business Logic „nadwyżka”, i.e. excess part).
- **„w tym miesiącu” is undefined in the PRD.** Using today's calendar month conflicts with the determinism guardrail
  and would show nothing for the synthetic fixture (imported rows span 2025-09…2026-08; today is 2026-09-27).
  Recommendation: the **latest calendar month present in the user's transactions**, with a month selector (kit
  `select`) over the months present, via a `?month=YYYY-MM` query param.
- **Type flip: PRD silent.** Recommendation: keep the stored row; apply it only when its kind matches the current
  D5 type (`count`/`sum` ↔ `frequent`, `amount` ↔ `fixed`); a mismatched threshold yields no „ponad próg” and the
  editor shows it as inactive (DESIGN-GAP state).
- **Storage**: copy `imports`/`transactions` conventions from `20260923165530_domain_imports_transactions.sql`, but
  `pattern_thresholds` is the **first mutable table** — it needs an UPDATE policy and must not copy the
  `revoke update, maintain` line of `20260924122144_transactions_import_account_fk.sql`. Upsert needs SELECT + INSERT +
  UPDATE policies.
- **Detail read**: patterns are grouped in JS (`derivePatterns`), so a single pattern cannot be filtered in SQL — the
  detail re-runs the full paged read and picks by key. Hence widening `loadPatterns`' select (`occurred_on`) and doing
  S-03 F2 keyset paging together is justified. No dynamic route exists yet in `src/pages`; `merchantKey` can contain
  spaces, diacritics, dots and (unverified) `/`.
- **Kit**: detail = `patternDetail()` + `thresholdEditor()` in `design/rytm-os/prototype/app.js`; kit copy covers
  `patternDetail.*`, `threshold.*`, `patterns.columns`; about 20 rendered strings exist only in `app.js` (K11 class).
  Next free gap ids: **K21**, **G31**. Prototype "over" marks are hard-coded and internally inconsistent — not an
  oracle.

## Detailed Findings

### 1. Over-limit rules (PRD)

Source `context/foundation/prd.md`, section **Business Logic → „Wynik”** (verbatim):

> Nadwyżka jest liczona tak: próg liczbowy — chronologicznie od (próg+1)-szej transakcji w miesiącu; próg kwotowy —
> suma miesiąca minus próg, oznaczone są transakcje od tej, przy której suma narastająco przekracza próg; wzorzec
> stały — kwota wystąpienia minus akceptowana kwota, gdy dodatnia. Wzorzec bez progu nie generuje nic „ponad próg”.

Same paragraph: „transakcje „ponad próg” i suma „ponad progiem w tym miesiącu” per miesiąc (trend, **według
dzisiejszych progów**)” → a threshold applies retroactively to every month, not from the day it was set.

**US-01 AC**: „Suma „ponad progiem” = suma kwot transakcji oznaczonych „ponad próg” w danym miesiącu.” US-01 Then:
„5.–n-te zamówienie Wolt w każdym miesiącu” (threshold 4). FR-011 resolution note: chronological from the
(threshold+1)-th transaction.

| Kind (pattern type) | Flagged (PRD) | Over amount — Business Logic | Over amount — US-01 AC | Agree? |
|---|---|---|---|---|
| `count` N (frequent) | month's transactions in chronological order from index N+1 | (implicit) full amounts of flagged | Σ full amounts of flagged | yes |
| `sum` S (frequent) | from the transaction at which the running month total first exceeds S, and all later ones | monthSum − S (when > 0) | Σ full amounts of flagged (crossing tx counted whole) | **no** |
| `amount` A (fixed) | PRD does not say explicitly; natural reading: each occurrence with amount > A | Σ (amount − A) over those | Σ full amounts of flagged | **no** |

Recommendation for the plan: **per-transaction `overMinor`** = full amount for `count`; for `sum` the crossing
transaction carries `runningTotal − S` and later ones their full amount (so Σ overMinor = monthSum − S exactly); for
`amount` each flagged occurrence carries `amount − A`. Monthly „ponad progiem” = Σ overMinor. This satisfies Business
Logic literally and keeps US-01's Wolt example (count kind) identical. Rejected: full amounts for all kinds (would
report a 55 zł Netflix charge as 55 zł over when the accepted amount is 49 zł, contradicting „kwota wystąpienia minus
akceptowana kwota”). Would change: a maintainer reading US-01 AC as normative.

Edge rules the PRD does not state (plan must fix, recommendation): running total „przekracza” = strictly greater
than S (a month summing exactly to S has no over-limit); `amount` flag when amount > A strictly; count N with ≤ N
transactions → nothing.

**Chronology tie-break**: `transactions.occurred_on` is a `date` (`src/db/database.types.ts` `transactions.Row`);
several same-day transactions are possible. The rule needs a deterministic secondary key; recommend
`(occurred_on, id)` — `id` is `bigint generated always as identity`, and `import_ing_statement` inserts the payload
array in order, so the same CSV gives the same relative order (determinism guardrail holds). Would change: a need for
order independent of insert order (then `bank_tx_id`, nullable → fallback to id).

### 2. „w tym miesiącu”

PRD sections checked: Success Criteria (Primary: „sumę „ponad progiem w tym miesiącu”” — undefined), US-01 („w każdym
miesiącu”, „w danym miesiącu”), US-04 („w bieżącym miesiącu”, D6 vs „poprzednim miesiącu kalendarzowym”), US-05 AC
(„Niepełny bieżący miesiąc jest pokazywany na równi z pełnymi”), FR-013 („dla wszystkich miesięcy obecnych w danych”),
Business Logic → „Gdzie użytkownik spotyka regułę” („w bieżącym miesiącu … jak wygląda ta suma w poprzednich
miesiącach. Reguła jest deterministyczna — ten sam CSV i te same progi dają ten sam wynik.”). **None pins which month
is „this” month.** Month granularity = calendar month (US-04/D6).

Evidence against today's calendar month: the fixture's imported rows (`test/fixtures/ing/expected.json`,
`rows[].occurredOn` where `imported`) cover 12 months 2025-09…2026-08 (13–23 rows each); today (2026-09-27) is not
among them, so every pattern would show 0 over-limit. The data are bank-statement imports, always historical; and
clock-dependence weakens the determinism guardrail.

Kit evidence: `patternDetail()` has a month `<select>` (`maj 2026 / kwi 2026 / mar 2026`, no handler) and
`patternDetail.sumLabel` „Suma w maju” with the month baked in.

**Recommendation**: reference month = latest calendar month present in the **user's** transactions (global, so the
`/patterns` „Ponad progiem” column and the later `/home` stat compare the same month across patterns); detail offers
a month select over months in which the pattern occurs (plus the reference month), SSR via `?month=YYYY-MM`,
defaulting to the reference month. Rejected: today's month (empty for historical data, clock-dependent); per-pattern
latest month (list column would mix months). Would change: a maintainer deciding „this month” is the wall-clock month
(e.g. once regular monthly imports are the norm).

### 3. Type flip under a stored threshold

PRD: FR-007 „każdy sprzedawca ma dokładnie jeden typ (aplikacja proponuje …)”; FR-009/US-03 user type change = S-05.
Type is recomputed on every read by `d5Type` (`src/lib/patterns/derive.ts` `derivePatterns`), so an import or undo
can flip it. PRD, roadmap S-04 and S-05 are **silent** on the threshold on flip.

Recommendation: store `kind` explicitly; the evaluator applies a threshold only if `kind` is compatible with the
current type (`count`,`sum` ↔ `frequent`; `amount` ↔ `fixed`). Incompatible → no „ponad próg” (consistent with
„Wzorzec bez progu nie generuje nic”), the row is **kept** (flip back restores it), the editor shows „brak
ustawionego progu”-like state plus a DESIGN-GAP note, and saving a compatible kind overwrites it (unique key). Rejected:
delete on flip (reads would need to write); convert kinds (no meaningful mapping count→amount). Would change: S-05
introducing user-pinned type (then flips stop for pinned patterns; rule still valid).

### 4. Storage — migration and pgTAP pattern to copy

`supabase/migrations/` holds 4 files; the only tables are `imports` and `transactions`
(`20260923165530_domain_imports_transactions.sql`). Conventions:

- `user_id uuid not null default auth.uid() references auth.users(id) on delete cascade` — client never sends
  `user_id`.
- `created_at timestamptz not null default now()`; **no `updated_at` column or trigger** anywhere.
- Inline unnamed checks (`amount_minor bigint not null check (amount_minor > 0)`, `source … check (source in
  ('ing'))`); `comment on table` citing FR numbers; index names `<table>_<cols>_idx`.
- RLS: `alter table … enable row level security`; policies named `"<table>: authenticated <op> own"` with
  `using ((select auth.uid()) = user_id)` / `with check (…)`; `revoke all … from anon`; `revoke truncate, trigger,
  references … from authenticated`. `20260924122144_transactions_import_account_fk.sql` adds `revoke update, maintain
  … from authenticated` because those tables are immutable — **do not copy for thresholds**.
- `delete_own_account` (`20260921120000_delete_own_account.sql`): `security definer`, deletes only the `auth.users`
  row → a new table with the FK needs no function change. `import_ing_statement` (security invoker) touches only
  `imports`/`transactions`.

Recommended DDL shape (plan to fix): `pattern_thresholds (id bigint generated always as identity primary key, user_id
… as above, merchant_key text not null check (char_length(merchant_key) between 1 and 500), kind text not null check
(kind in ('count','sum','amount')), value bigint not null check (value > 0), created_at, updated_at timestamptz not
null default now(), unique (user_id, merchant_key))` — one threshold per pattern (FR-010 „liczba wystąpień **lub**
suma”); `value` = integer count for `count`, grosze for `sum`/`amount`. **No `import_id`** (S-02 invariant; US-02 AC
„progi przetrwają usunięcie importu — są przypisane do sprzedawcy, nie do importu”). Four policies select / insert /
update (using + with check) / delete for `authenticated`. PostgREST `upsert(…, { onConflict: "user_id,merchant_key" })`
needs SELECT + INSERT + UPDATE policies. `updated_at` without a trigger must be set by the writer — or dropped
(existing tables have none).

pgTAP (`supabase/tests/database/`): `domain_rls.test.sql` plan(28), `import_rpc.test.sql` plan(16),
`import_delete.test.sql` plan(10) = 54 (matches contract baseline). Structure `begin; create extension if not exists
pgtap …; select plan(n); … select * from finish(); rollback;`; users inserted into `auth.users` with fixed UUIDs
`aaaaaaaa-…`/`bbbbbbbb-…`; impersonation inline: `set local role authenticated; select
set_config('request.jwt.claims', '{"sub":"…","role":"authenticated"}', true);`, anon via `reset role; set local role
anon;`. Idioms: `throws_ok(…, '42501' …)`, `lives_ok`, `is((select count(*) …), 0::bigint …)`, `with d as (delete …
returning 1) select is(count(*), 0::bigint …) from d`. New file recommended (`pattern_thresholds.test.sql`): RLS on,
own CRUD, B cannot see/update/delete A's (0 rows) nor insert with A's `user_id` (42501), unique 23505, kind/value
checks 23514, upsert updates in place, anon 42501, cascade on `delete_own_account()`, survival after deleting an
import. Then `npm run db:types` and a `PatternThresholdRow = Tables<"pattern_thresholds">` alias in `src/types.ts`
(beside `ImportRow`, `TransactionRow`).

No live-DB experiment was run (not needed: policy behaviour follows from the existing policies and PostgREST upsert
semantics; the plan's pgTAP file proves it).

### 5. Detail route, lookup and read

- `src/pages/` has **no dynamic route** (`patterns.astro`, `imports/{index,new,result}.astro`, …). Middleware
  `PROTECTED_ROUTES` matches `path.startsWith("/patterns/")` (`src/middleware.ts` `onRequest`) → a detail route is
  protected with no change.
- `merchantKey` (`src/lib/patterns/merchant.ts`) = `normalizeMerchant(raw).toLocaleLowerCase("pl-PL")`: may hold
  spaces, Polish diacritics, dots (`kawa-testowa.pl`-style domains from operator tails). `normalizeMerchant` strips
  scheme/`www.`/trailing slashes only, so an inner `/` is not excluded (not observed in the fixture; unverified for real
  data). The fixture's `patterns[].key` values are hand-authored slugs, not runtime keys (comment in
  `test/unit/patterns.test.ts`). Recommendation: link with `encodeURIComponent(key)` and resolve by exact key after
  decoding; the plan must prove a key with a space/diacritic (and `/`) round-trips — `src/pages/patterns/[...key].astro`
  (rest param) or `?key=` avoids the `/` risk. Unknown key → not-found state (no kit state; G30-class gap).
- `loadPatterns` (`src/lib/patterns/load.ts`) selects `id, amount_minor, counterparty, title` only; grouping happens in
  JS (`derivePatterns`), so the detail must run the full read and pick `pattern.key === key`. The detail needs
  `occurred_on` (month grouping, chronology). Kit „opis surowy” shows e.g. `WOLT*WARSAW` — i.e. counterparty/title;
  the `details` column is the ING „Szczegóły” type (`TR.BLIK`, `PRZELEW`; `context/foundation/import-formats.md` column
  6), **not** the raw description. `PatternSource`/`MerchantPattern` (`src/types.ts`) keep only `transactionIds` → the
  plan needs per-transaction data on the detail (e.g. keep source rows or re-index by id).
- **S-03 F2 keyset paging** (`context/archive/2026-09-25-undo-import/follow-ups/review-fixes.md`): replace offset
  `.range()` in `collectPages` with `.gt("id", lastId).order("id").limit(PAGE_SIZE)`, `count` on first page only,
  stop on an empty page, bound the loop. Both reads (list and detail) go through it → in scope. Index: `transactions`
  PK on `id`; RLS filters `user_id` (index `transactions_user_id_occurred_on_idx` exists).
- Thresholds read: one `select merchant_key, kind, value from pattern_thresholds` (RLS-scoped) merged into patterns by
  key — list needs all, detail one.
- Writes: mirror `src/pages/api/imports/delete.ts` `POST` (createClient → `getUser` → formData → zod `safeParse` →
  query → redirect with a status param); `security.checkOrigin` covers CSRF (follow-up F3 rule).

### 6. Kit binding

Prototype (`design/rytm-os/prototype/app.js`; views `pattern-wolt.html`, `patterns.html` are 20-line shells setting
`location.hash`):

- `patternDetail(id)`: `.detail-top` (`a.back-link` + `arrow-left` 15, „Wróć do wzorców”; `.detail-actions` „Akcje” —
  S-05, out), `.detail-heading` (eyebrow `badge(type)` + „ wzorzec”, h1, lead „Sprzedawca o stałej, powtarzalnej
  kwocie.” / „Sprzedawca, który wraca niezależnie od kwoty.”, `.detail-total` „Suma w maju” / money / „N
  wystąpień”), `.detail-grid` (panel „Próg wzorca” + span „aktywny” / „brak ustawionego progu” + editor; panel
  „Wystąpienia w miesiącu” + `.select-field.small` + `.sequence-large` `.seq`/`.seq.over` + `.sequence-labels` „W
  ramach progu” / „Ponad próg”), `.transactions-panel` („Transakcje z wyciągu”, „opis surowy · kwota”, rows date /
  raw / money + `badge('ponad próg','excess')`).
- `thresholdEditor(p)`: `.threshold-switch` options „Akceptowana kwota” (fixed) or „Liczba na miesiąc” + „Suma na
  miesiąc” (frequent); field label „Kwota” / „Liczba wystąpień”, `.input-suffix` suffix „zł” / „×” (no variant drawn
  for the sum kind); note `threshold.empty` / `threshold.active`; `btn-primary` „Ustaw próg” / „Zapisz próg”;
  `.text-button` „Usuń próg”; toasts „Próg zapisany.” / „Próg usunięty.”.
- `patternRows()`: name as `<a class="table-name" href="#/patterns/:id">`, cells count, sum, threshold string („4 × /
  miesiąc”, „55,00 zł”, „—”), `.excess-value` money or „—”, status badge (S-06), `.icon-button` „Otwórz wzorzec” with
  `arrow`.
- Prototype over-marks are **hard-coded** (`seq` over when `i >= 4` regardless of threshold; transaction flags fixed
  booleans, 2 of 6) and disagree with each other and with `excess` (Wolt `excess: 84.0`) → not an oracle.

`content.json` keys present (`design/rytm-os/react-kit/docs/content.json`): `patternDetail.{back, sumLabel („Suma w
maju”), transactions, rawDescription}`, `threshold.{acceptedAmount, countPerMonth, sumPerMonth, empty, active, save
(„Zapisz próg”), remove}`, `patterns.columns` (6: …, „Próg”, „Ponad progiem”), `components.success` („Sukces — próg
zapisany.”), `dashboard.stats[0].label` („Ponad progiem w tym miesiącu”). **Rendered only in `app.js`** (K11-class →
`copyExtra`): „Ustaw próg”, „Próg zapisany.”, „Próg usunięty.”, „Próg wzorca”, „aktywny”, „brak ustawionego progu”,
„Wystąpienia w miesiącu”, „W ramach progu”, „Kwota”, „Liczba wystąpień”, „zł”/„×”, „× / miesiąc”, „ wzorzec”, both
type leads, „N wystąpień”, badge „ponad próg”, „Otwórz wzorzec”. No kit string for the sum-kind field/suffix or list
format; month-baked `sumLabel` is K16-class. `copyExtra.howItWorks` already has `sequenceThreshold` „Twój próg” and
`sequenceOver` „Ponad próg”. Next free ids in `context/foundation/design-kit.md`: **K21, G31**; G2 (detail) and G3
(threshold editor) are marked „delivered” in the kit; G28 is the list placeholder this slice lifts.

Shared components (`src/components/`): `app/Badge.tsx` `Badge` — tones only `fixed | frequent` (comment: „Further
tones arrive with S-04–S-06”) → add `excess`. `ui/button.tsx` `buttonVariants` has `text` (closes F5) and size
`inline`. `app/Panel.astro`, `app/PageTitle.astro`, `app/InlineAlert.astro` (Astro only; no toast component → success
via redirect + `InlineAlert kind="success"` with `components.success`). **Missing**: input-with-suffix, back link
(inlined in `imports/ImportWizard.tsx`), sequence (inlined `rClip` in `pages/how-it-works.astro`; kit `.seq` colours
`#728393`/`#aebbc1` have no token → map to existing names or gap), generic select (field classes inlined in
`patterns/PatternsTable.tsx`, G29 focus fix). `PatternsTable` carries `DESIGN-GAP: G28`, `G29`, `K17`; its copy uses
`columns.slice(0, 4)` + `amountColumn`.

### 7. Unit oracle

`test/fixtures/ing/expected.json` top-level keys `schema, tolerance, files, rows, patterns` — no threshold oracle; no
Wolt/Netflix in the fixture (grep of `rows[].pattern`). Recommend a pure module (e.g. `src/lib/patterns/over-limit.ts`)
taking `{ occurredOn, amountMinor, id }[]` + `{ kind, value }` + type → per-transaction `overMinor` and per-month sums,
tested with hand-built cases: US-01 Wolt (count 4, 6 orders in a month → orders 5–6 flagged, full amounts), sum
crossing (partial first), exact-equal sum (nothing), fixed 49 zł accepted vs 55 zł charge (6,00 zł), same-day tie-break,
mismatched kind (nothing), no threshold (nothing), input-order independence (determinism). Optionally one fixture
pattern (e.g. a 12-occurrence frequent one) with a threshold for an end-to-end sanity number.

## Code References

- `src/lib/patterns/load.ts` `loadPatterns`, `collectPages`, `PAGE_SIZE` — read to widen + keyset (F2)
- `src/lib/patterns/derive.ts` `derivePatterns`, `d5Type`, `TOLERANCE` — type derivation, flip source
- `src/lib/patterns/merchant.ts` `merchantKey`, `normalizeMerchant` — threshold identity
- `src/types.ts` `PatternSource`, `MerchantPattern`, `PatternListItem`, `ImportRow`, `TransactionRow`
- `src/pages/patterns.astro` (list; `tableCopy`, K18 branch) · `src/components/patterns/PatternsTable.tsx` `PatternsTable`
- `src/pages/api/imports/delete.ts` `POST` — write-route pattern · `src/middleware.ts` `PROTECTED_ROUTES`
- `supabase/migrations/20260923165530_domain_imports_transactions.sql`, `20260924122144_transactions_import_account_fk.sql`,
  `20260921120000_delete_own_account.sql`, `20260924224014_import_ing_statement.sql`
- `supabase/tests/database/domain_rls.test.sql`, `import_delete.test.sql`, `import_rpc.test.sql`
- `design/rytm-os/prototype/app.js` `patternDetail`, `thresholdEditor`, `patternRows`, `badge`
- `src/components/app/Badge.tsx` `Badge`; `src/components/ui/button.tsx` `buttonVariants`

## Architecture Insights

Patterns are a pure read-time projection; the only persisted pattern state after S-04 is a `(user_id, merchant_key)`
row. That makes the over-limit computation a pure function of (transactions, thresholds, reference month) —
deterministic and unit-testable without the DB — and keeps key stability (`normalizeMerchant` rule order, noted in
`merchant.ts` header) load-bearing: a normalizer change silently orphans stored thresholds.

## Historical Context (from prior changes)

- `context/archive/2026-09-25-merchant-patterns/` — derived-on-read decision, G28 omissions reserved for S-04, F2
  keyset follow-up (supported; still open).
- `context/archive/2026-09-25-undo-import/follow-ups/review-fixes.md` — invariant „key on `merchantKey` + `user_id`,
  never `import_id`” (supported); F2 trigger fired naming S-04 (supported); F5 `text` variant reserved for „Usuń próg”
  (supported: variant exists, unused).

## Related Research

- `context/archive/2026-09-25-merchant-patterns/research.md`, `context/archive/2026-09-25-undo-import/research.md`
  (both exist; not re-read — findings above are from source).

## Open Questions (for the plan to decide)

1. Sum/fixed over amount: excess part (recommended) vs full flagged amounts (US-01 AC literal).
2. Reference month: latest month in user data (recommended) vs wall-clock month; month selector scope.
3. Route shape `[key]` vs `[...key]` vs `?key=`; prove a key with space/diacritic (and `/`) round-trips.
4. `updated_at` column (needs writer-set value, no trigger precedent) or none.
5. List „Próg” cell format for the sum kind (no kit string) → gap row.

## Autonomous decisions

Made by the research step in place of asking a human.

- **Scope = the seven questions above, derived from `change.md`**, no clarifying question. Rejected: asking. Why:
  agent contract rule 1. Would change: a maintainer narrowing scope.
- **Recommended „excess part” for sum/fixed kinds** (Business Logic over US-01 AC). Why: Business Logic is the specific
  definition („nadwyżka … minus próg / minus akceptowana kwota”); the count example of US-01 is unaffected. Would
  change: maintainer confirming US-01 AC wording as normative.
- **Recommended reference month = latest month in user data.** Why: determinism guardrail, historical imports, fixture
  would otherwise show nothing. Would change: product decision for wall-clock month.
- **Recommended keep-but-ignore on type flip.** Why: reads stay side-effect free; flip back restores. Would change: S-05
  design requiring threshold reset on user type change.
- **No live-DB experiment.** Why: behaviour is determined by existing policies; pgTAP in implement will prove it.
  Would change: plan choosing an unfamiliar mechanism (trigger, RPC).
- **Delegated PRD, schema and kit reading to three parallel read-only workers**; decisive quotes (PRD Business Logic,
  Badge tones, button `text` variant, G2/G3 rows, gap ids) re-checked locally.
