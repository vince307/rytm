---
date: 2026-09-25T22:41:40+0200
researcher: Claude (research step, autonomous run 2026-09-25-roadmap-all)
git_commit: a007ca5f111fd6f6f583a063ff88e2a1170197fe
branch: feat/merchant-patterns
repository: Rytm
topic: "S-03 merchant-patterns — what exists to derive merchant patterns, and what the plan must decide"
tags: [research, merchant-patterns, normalization, supabase, fixture-oracle, design-kit]
status: complete
last_updated: 2026-09-25
last_updated_by: Claude (research step)
---

# Research: S-03 `merchant-patterns`

**Date**: 2026-09-25T22:41:40+0200
**Researcher**: Claude (research step, autonomous run `2026-09-25-roadmap-all`)
**Git Commit**: `a007ca5` (branch tip; `main` base `d11f3ef`)
**Branch**: `feat/merchant-patterns`
**Repository**: Rytm

Anchors are **symbols** (function, constant, policy, key), not line numbers — run contract rule.

## Research Question

Scoped from `change.md` + roadmap `### S-03` (no human asked — see handoff § 6): for the slice "user sees a list of
detected merchant patterns (normalized merchant, operator domain, fixed/frequent type, occurrences, sum, fixed amount;
each transaction in exactly one pattern)":

1. What schema/RPCs does S-03 read or write, and is a new table needed?
2. What services exist in `src/lib/` and what is missing (merchant extraction, normalization, D5, money formatting)?
3. What exactly does the F-02 oracle (`test/fixtures/ing/expected.json`) demand of S-03, given merges/excludes are S-05?
4. Which kit view/CSS/copy does `/patterns` bind to, which shared components exist, and what is missing?

## Summary

- **Storage**: only `public.imports` and `public.transactions` exist (plus RPCs `import_ing_statement`,
  `delete_own_account`). Transactions keep raw `counterparty` / `title` / `details`; nothing merchant-related is stored.
  Patterns can be derived deterministically from `transactions` alone. The PRD pins later decisions and thresholds to the
  **merchant, not the import** (`prd.md`, assumption "Trwałe decyzje o wzorcach (FR-009) i progi (FR-010) przetrwają
  usunięcie importu"), so a stable, deterministic **merchant key string** is the identity S-04/S-05 need — a table in
  S-03 is not forced by any consumer found. Decision belongs to the plan (see Open Questions).
- **Row-limit trap**: `supabase/config.toml` `[api] max_rows = 1000`; PRD `data_volume: small # tysiące transakcji per
  konto`. A plain `.from("transactions").select(...)` aggregated in TypeScript silently truncates at 1000 rows. Either
  aggregate in SQL (view/RPC, security invoker) or page explicitly.
- **Merchant extraction (rule 7 / D3) does not exist in `src/`**. Its only implementation is `rawMerchant()` +
  `OPERATORS` in `scripts/fixture-ing.mjs`; D5 exists as `d5Type()`/`median()` there and again as `median()` +
  `checkPatterns()` in `scripts/fixture-ing-check.mjs`. The app has no normalizer and no money formatter.
- **Oracle**: 206 imported rows (main file only), 32 distinct `rawMerchant` strings, 30 `patterns[]`. Exactly two raw
  pairs are merged by the oracle: T03 (`MINIMARKET PRZYSTANEK 0412 …` + `… 1187 …`, `resolvedBy: normalization`) and
  T01 (`sportowo.pl …` + `SPORTOWO SP. Z O.O. …`, `resolvedBy: user-merge` → S-05). So S-03's normalization must merge
  T03 and keep every other raw merchant apart; the S-03 target partition is **31 groups** (or 30 if the plan decides
  to auto-merge T01 and moves its declaration to `normalization` in the generator).
- **UI**: `/patterns` is the empty-state stub (`src/pages/patterns.astro` → `ViewEmpty`). Kit view = `app.js`
  `patterns()` / `patternRows()` / `bindInteractions()`; CSS `.toolbar`, `.search-field`, `.select-field`,
  `.table-panel`, `.table-name`, `.merchant-mark`, `.badge.fixed|.frequent`, `.table-foot`. `src/` has `Panel`,
  `PageTitle`, `ViewEmpty`, `InlineAlert`, `Icon`, `buttonVariants`; it has **no** shared Badge, table, merchant-mark or
  search/sort component. The only existing table (`src/pages/imports/index.astro`) is inline markup with local
  `cell`/`head` class strings.

## Detailed Findings

### 1. Schema and RPCs (read side of S-03)

- `supabase/migrations/20260923165530_domain_imports_transactions.sql`: `public.transactions` columns
  `id bigint identity`, `user_id` (FK `auth.users` on delete cascade), `import_id`, `account_number`, `occurred_on
  date`, `amount_minor bigint check (> 0)` (debit in grosze, positive), `bank_tx_id`, `counterparty text not null`,
  `title text not null default ''`, `details text`. Indexes `transactions_user_id_occurred_on_idx (user_id,
  occurred_on)`, `transactions_import_id_idx`, unique `transactions_bank_tx_key`.
- RLS on both tables: policies `"transactions: authenticated select own"` / `insert own` / `delete own` (same trio for
  imports); no update policy; `anon` revoked; `authenticated` loses `truncate, trigger, references`.
- `20260924122144_transactions_import_account_fk.sql`: FK `transactions_import_account_fkey (import_id, user_id,
  account_number) → imports` on delete cascade; `revoke update, maintain … from authenticated` (immutable facts).
  Consequence: a derived merchant key **cannot** be written back into `transactions` by the app role without a new
  grant/policy — relevant if the plan wants a stored per-transaction merchant column.
- `20260924224014_import_ing_statement.sql`: `import_ing_statement(text, text, date, date, jsonb) returns uuid`,
  `security invoker`, execute granted to `authenticated` only. Stores `counterparty`/`title`/`details` as sent.
- `src/lib/import/ing.ts` `parseIngStatement` sets `counterparty: v[2].trim()` and `title: v[3].trim()` — internal
  runs of spaces are **kept** (e.g. `sportowo.pl   UL. BIEGOWA 7    GDYNIA`); rule 7 collapses them, so S-03 must too.
- `src/db/database.types.ts`: `Tables.imports`, `Tables.transactions`; `Functions.delete_own_account`,
  `Functions.import_ing_statement`. No views. `src/types.ts` exports only `ImportRow`, `TransactionRow`.
- Import deletion (S-02, not merged in this run) cascades transactions → a derived model recomputes for free; a stored
  pattern table would need its own cleanup/cascade story.
- `supabase/seed.sql` inserts only `auth.users` / `auth.identities` (0 matches for `transactions`) → the screenshot gate
  needs the fixture imported (UI wizard or RPC) for `test@rytm.local`.
- pgTAP: `supabase/tests/database/domain_rls.test.sql`, `import_rpc.test.sql`. A new SQL view/function would need its
  own pgTAP proof (RLS isolation: user B sees none of A's patterns).

### 2. Services in `src/lib/`

- Present: `auth-rules.ts`, `config-status.ts`, `format.ts`, `supabase.ts` (`createClient(headers, cookies)`),
  `utils.ts` (`cn`), `import/ing.ts` (`parseIngStatement`, `buildImportPayload`), `import/schema.ts`
  (`importPayloadSchema`).
- `format.ts` exports `formatMonthYear`, `formatDate`, `plural`, `formatRangeShort`, `formatRangeLong`,
  `formatAccountTail`. **No money formatter**; the kit uses `money = value => toLocaleString('pl-PL',
  {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' zł'` in `app.js`. `plural()` covers "N wzorców".
- Absent (searched `src/` for `merchant`, `NumberFormat`, `zł`, `amount_minor`): no merchant extraction, no
  normalization, no D5, no pattern types in `src/types.ts`.
- Reference logic to port (not import — scripts are Node-only, outside `src/`):
  - `scripts/fixture-ing.mjs` `OPERATORS = ["PayPro", "PayU", "Cashbill", "Autopay", "ING Pay"]`; `rawMerchant(counterparty,
    title)`: if counterparty (lowercased) contains an operator → last whitespace token of the `Tytuł` tail after
    `Nr transakcji \d+`, else `collapse(counterparty)`; `collapse = s.trim().replace(/\s+/g, " ")`.
  - `TOLERANCE` `{pct: 15, minMinor: 1000}`; `median()` (even count = mean of the two middle values); `d5Type()`:
    fixed iff every amount within `max(median*15%, 1000)` of the median.
  - `scripts/fixture-ing-check.mjs` `checkPatterns()` re-derives `occurrences`, `sumMinor`, `medianMinor`
    (`Math.round`), `firstMonth` per pattern and validates D5 in both directions.
- `test/unit/ing-parser.test.ts` shows the oracle-reading pattern (`readFileSync(new URL("expected.json", FIXTURES))`),
  runnable in Vitest via `@/*` alias — a pure TS normalizer in `src/lib/` is directly testable against the fixture;
  logic in SQL would be testable only through pgTAP or a running DB.

### 3. What the oracle demands (F-02 → S-03)

Observed with `python3` over `test/fixtures/ing/expected.json` (this step):

- `files`: main file `imported.count 206`, `sumMinor 6497147`; the three reject files import 0 rows.
- `rows[]` where `imported`: 206, each with `rawMerchant` (rule 7) and `pattern`; 0 imported rows lack a pattern.
- 32 distinct `rawMerchant` → 30 distinct `pattern`; no raw merchant maps to two patterns.
- Merges in the oracle (exactly these two): `minimarket-przystanek` ← 2 raws (T03, normalization), `sportowo` ← 2 raws
  (T01, user-merge). Everything else is 1 raw → 1 pattern.
- Operator cases (T04/T05) are already resolved inside `rawMerchant`: `kawa-testowa.pl`, `ksiegarnia-przyklad.pl`,
  `apteka-przyklad.pl`, `kurs-przyklad.pl` (`resolvedBy: import` — i.e. rule 7, which the app has **not** implemented),
  `https://www.bilety-przyklad.pl` → `bilety-przyklad.pl` (normalization must strip scheme/`www.`), and T05
  `AUTOPAY S.A. UL. PRZYKŁADOWA 9 SOPOT` (operator, empty tail) → `autopay`, which must stay separate from the
  Autopay-with-domain row `kurs-przyklad.pl`.
- Near-collisions normalization must **not** merge: T06 `PRZYKŁADOWA FIRMA JAN PRZYKŁADOWY UL. TESTOWA …` vs T08
  `JAN PRZYKŁADOWY UL. TESTOWA …`; `URZĄD SKARBOWY W PRZYKŁADOWIE` (T09) vs ZUS; `KINO ŚWIATŁO …` vs `KINOTEKA …`.
- Types: 7 fixed (`kawa-testowa.pl`, `kinoteka` (T11, +12% rise, median 5299, tolerance 1000), `kurs-przyklad.pl`,
  `muzykalnia`, `phu-przyklad`, `przelew-konto-osobiste`, `silownia-ruch` (1 occurrence)), 23 frequent. Since
  `sportowo` is frequent as a merged group, the plan must recompute D5 for its two halves separately in S-03's
  31-group expectation (not read `type` from the merged entry).
- Keys are hand-authored slugs (`zus` from `ZAKŁAD UBEZPIECZEŃ SPOŁECZNYCH`, `przelew-wlasny-vat` from the owner's
  name) — **no algorithm is expected to reproduce them**. The testable contract is the **partition** of the 206
  rows (+ per-group occurrences/sum/median/type), not the key strings.
- The fixture plan allows S-03 to correct the oracle only by editing the generator declarations (`TRAP_SERIES`,
  `resolvedBy`/`pattern`), never `expected.json` by hand
  (`context/archive/2026-09-24-synthetic-ing-fixture/plan.md`, contract section on `pattern`/`type`/`resolvedBy`).
- `silownia-ruch` (1 occurrence, fixed) shows one-off merchants are patterns in the oracle; with FR-007 "każda
  transakcja liczy się raz", every debit lands in some pattern, so on real data single-purchase merchants will appear
  as 1× "stały". Inference: likely the dominant row count on real statements (roadmap Unknown: grouping quality on a
  real statement).

### 4. Kit binding and shared components

- Kit view `design/rytm-os/prototype/app.js` `patterns()`: `.dash-title` (eyebrow "Wzorce wydatków", h1, lead, primary
  "+ Wgraj CSV"), `.toolbar` with `#patternSearch` and `#patternSort` (options sum/count/name), `.panel.table-panel >
  .table-wrap > table#patternsTable` with 7 header cells (Sprzedawca, Typ, Wystąpienia, Suma, Próg, Ponad progiem,
  empty), `.table-foot` ("5 wzorców · wszystkie miesiące" + "Pokaż więcej"), then `.excluded-section` (S-05).
  `patternRows()` renders `.table-name` link `#/patterns/:id` with `.merchant-mark` (first letter), `badge(type,
  'fixed'|'frequent')`, count, `money(sum)`, threshold, excess + status badge, `.icon-button` arrow. `bindInteractions()`
  filters by lowercase substring and sorts desc by sum/count or `localeCompare` by name — client-side.
- Kit data objects carry an `amount` field (fixed amount) that no column renders — confirms the FR-007 gap.
- `content.json` `patterns`: `title`, `description`, `columns` (6: Sprzedawca, Typ, Wystąpienia, Suma, Próg, Ponad
  progiem), `searchPlaceholder`, `sortOptions` (suma, liczba, nazwa). `components`: `excluded`, `new`, `changed`,
  `success`, `error`, `info` — no `stały`/`częsty`. `src/content/copy.ts` has `copyExtra.patterns.eyebrow` only.
- CSS in `design/rytm-os/prototype/styles.css`: `.badge.fixed{background:#dfe7e4;color:var(--green)}`,
  `.badge.frequent{background:#e2e7ec;color:var(--ink)}`, `.merchant-mark{background:#e5e9e8;…}`. `src/styles/brand.css`
  (synced) has `.rytm-badge--fixed` (`#DFE7E4`) / `--frequent` (`#E2E7EC`) — raw hex, not among the 8 Tailwind
  color names in `src/styles/global.css` `@theme inline` (`ink`, `paper`, `paper-soft`, `excess`, `excess-text`,
  `muted`, `line`, `green`). Using the `.rytm-badge--*` classes or `bg-green/15`-style opacity (as `InlineAlert` does)
  are the two token-safe routes; the plan picks one.
- Shared components in `src/components/`: `app/{AppHeader, EmptyState, InlineAlert, MobileNav, PageTitle, Panel,
  SettingsRow, Sidebar, Stepper, ViewEmpty}`, `app/nav.ts`, `Icon.astro` (sprite `/rytm/icons/ui/ui.svg`, sizes
  15/16/17/20/28), `ui/{button, dialog}` (shadcn new-york), `auth/*`, `imports/ImportWizard.tsx`,
  `settings/DeleteAccountDialog.tsx`. Missing for this view: Badge, data table (head/cell classes live inline in
  `imports/index.astro` as `cell`/`head` constants), merchant mark, search field, sort select. Search/sort needs a
  React island (convention: React only for interactivity) or server-side query params.
- `scripts/smoke.mjs` asserts `/patterns` returns 200 containing "Wgraj pierwszy wyciąg" for a fresh user — the
  empty state must survive for users with 0 transactions.
- Design-kit register `context/foundation/design-kit.md`: last K id **K16**, last G id **G27** → new rows start at
  K17 / G28. G26 (`/imports/result` without pattern stats) is closable by S-03 but is a second view (plan decides).

## Code References

- `supabase/migrations/20260923165530_domain_imports_transactions.sql` — `public.transactions`, RLS policies, grants
- `supabase/migrations/20260924122144_transactions_import_account_fk.sql` — `transactions_import_account_fkey`, `revoke update`
- `supabase/migrations/20260924224014_import_ing_statement.sql` — `import_ing_statement`
- `supabase/config.toml` — `[api] max_rows = 1000`
- `src/lib/import/ing.ts` — `parseIngStatement` (`counterparty`, `title` trim only), `buildImportPayload`
- `src/lib/format.ts` — `plural`, date formatters; no money formatter
- `src/pages/patterns.astro` — empty-state stub
- `src/pages/imports/index.astro` — only in-app table (`cell`, `head` class constants), RLS read pattern + error branch
- `src/pages/imports/result.astro` — `DESIGN-GAP: G26`
- `scripts/fixture-ing.mjs` — `OPERATORS`, `rawMerchant`, `collapse`, `TOLERANCE`, `median`, `d5Type`, `TRAP_SERIES`, `NOISE_POOL`, `buildPatterns`
- `scripts/fixture-ing-check.mjs` — `checkPatterns`, `median`
- `test/unit/ing-parser.test.ts` — fixture/oracle loading pattern for Vitest
- `design/rytm-os/prototype/app.js` — `patterns`, `patternRows`, `bindInteractions`, `money`, `badge`
- `design/rytm-os/prototype/styles.css` — `.badge.*`, `.toolbar`, `.table-*`, `.merchant-mark`
- `design/rytm-os/react-kit/docs/content.json` — `patterns`, `components`
- `src/styles/global.css` — `@theme inline` color names; `src/styles/brand.css` — `.rytm-badge--*`

## Architecture Insights

- Established shape for a read view: Astro page calls `createClient(Astro.request.headers, Astro.cookies)`, reads under
  RLS, logs errors server-side and shows `InlineAlert` `copy.components.error` instead of the empty state on failure
  (`imports/index.astro`). S-03 should follow it.
- Business logic that must match the fixture lives best as a pure TS module in `src/lib/` (like `import/ing.ts`),
  asserted in Vitest against `expected.json`. If aggregation moves to SQL for the row-limit reason, the normalizer
  still has to run somewhere deterministic — a hybrid (SQL returns per-raw-merchant aggregates `counterparty`,
  `title`-tail, amounts array; TS normalizes and merges) keeps the oracle test in Vitest. Inference, not observed.
- Immutability of `transactions` (no update grant) argues against materializing a merchant column on it in S-03.

## Historical Context (from prior changes)

- `context/archive/2026-09-23-domain-schema-rls/plan.md` — "Tabele sprzedawców/wzorców (S-03) … każdy wycinek dodaje
  własną migrację" → the roadmap's "S-03 adds its own migration" originates here as scope-out wording, not as a
  requirement derived from a consumer. Verdict: **partial** — a migration is needed only if S-03 stores something.
- `context/archive/2026-09-24-ing-csv-import/plan.md` — "Wyliczanie sprzedawcy (reguła 7 / D3, `rawMerchant`),
  normalizacja, wzorce … (S-03). Zapisujemy surowe `counterparty`/`title`/`details`." Verdict: **supported** by the
  code (`parseIngStatement`).
- `context/archive/2026-09-24-synthetic-ing-fixture/plan.md` — fixture is "jedyny legalny materiał testowy" for S-03;
  oracle corrections go through the generator. Verdict: **supported** (`buildPatterns` derives `patterns[]` from
  declarations).
- `change.md` claim "T04 `resolvedBy: import` but no app code extracts the domain" — **supported** (no `OPERATORS`
  or equivalent in `src/`).

## Related Research

- Not applicable — no earlier `research.md` in `context/changes/**` or `context/archive/**` covers normalization.

## Open Questions (for `/10x-plan` — choices, not missing evidence)

1. **Storage**: derived-on-read (no migration) vs a `merchant_patterns` table. Evidence favors derived: no consumer
   needs rows yet; S-04/S-05 can key on `(user_id, merchant_key)`. Risk: changing normalization later re-keys
   merchants and orphans S-04/S-05 rows keyed by the old string → S-05 must own a mapping/migration story.
2. **Where aggregation runs** given `max_rows = 1000`: SQL view/RPC (needs pgTAP), explicit paging in TS, or the hybrid
   above.
3. **Normalization rules** (FR-006): minimum set proven by the fixture = collapse whitespace, rule 7/D3 operator tail,
   strip URL scheme/`www.`, cut address from ` UL. `/` AL. ` (case-insensitive), cut legal forms (`SP. Z O.O.`, `S.A.`,
   `SA`, `S.A.R.L. …`), drop store-number tokens (T03), collapse a doubled name (T02). Over-merge guard: fixture must
   still yield exactly the S-03 partition.
4. **T01 auto-merge?** Case-folding + stripping `.pl` and legal forms makes `sportowo.pl` and `SPORTOWO SP. Z O.O.`
   collide. Either keep them apart (oracle as is, 31 groups) or merge and flip the generator's `resolvedBy` to
   `normalization` (30 groups, S-05 loses its merge demo). Product-visible.
5. **"Kwota dla stałych"**: median (what the oracle stores as `medianMinor`; 52,99 zł for `kinoteka`, never actually
   charged) vs last amount (55,99 zł; what S-06 compares). No kit column/key → DESIGN-GAP (K17/G28).
6. **Display name**: normalized key vs a title-cased label derived from it; kit rows show brand-cased names.
7. **Columns Próg / Ponad progiem, row link to detail, excluded section, table foot/"Pokaż więcej"**: omit until
   S-04/S-05 or render placeholders — each omission is a DESIGN-GAP row.
8. **Badge copy** `stały` / `częsty`: absent from `content.json` → `copyExtra` + K-row.
9. **G26** on `/imports/result`: in or out (one-view rule says out).
10. **Operator list location** (PRD Open Question 2): constant in `src/lib/` (mirrors `OPERATORS`) vs config/table.
