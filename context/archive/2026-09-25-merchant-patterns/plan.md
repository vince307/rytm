# Merchant patterns list (S-03) Implementation Plan

> Written by the `plan` step of autonomous run `2026-09-25-roadmap-all` (no human in the loop — every choice a human
> would have made is recorded in `handoff.md` § 6 with its reversal condition). Anchors are **symbols**, never line
> numbers (run contract).

## Overview

The signed-in user opens `/patterns` and sees every merchant pattern detected from their imported debits: merchant
(normalized from the bank description, with the merchant's domain for payments made through a payment operator),
the app-proposed type `stały` / `częsty` (D5), number of occurrences, sum, and the amount for fixed patterns. Every
transaction lands in exactly one pattern (FR-006, FR-007, guardrail "determinizm", roadmap `### S-03`).

Patterns are **derived on read** by a pure TypeScript module in `src/lib/patterns/` from the user's `transactions`
rows — no migration, no stored pattern state. The module is proven against the F-02 oracle
(`test/fixtures/ing/expected.json`) in Vitest.

## Current State Analysis

(From `research.md`, verified again in this step where marked.)

- Storage: only `public.imports` and `public.transactions` (+ RPCs `import_ing_statement`, `delete_own_account`).
  `transactions` keeps raw `counterparty` / `title` / `details`, `amount_minor` (positive grosze, debits only),
  `occurred_on`. RLS: select/insert/delete own; **no update grant** (`20260924122144_transactions_import_account_fk.sql`)
  — a merchant column cannot be written back by the app role.
- `supabase/config.toml` `[api] max_rows = 1000` (hosted default is also 1000): a plain `.select()` silently
  truncates, which would break "every transaction counts once" for any user above 1000 debits.
- `src/lib/import/ing.ts` `parseIngStatement` keeps internal runs of spaces in `counterparty` (`v[2].trim()` only).
- Merchant extraction (rule 7 / D3), normalization and D5 exist **only** in the fixture scripts:
  `scripts/fixture-ing.mjs` (`OPERATORS`, `rawMerchant`, `collapse`, `TOLERANCE`, `median`, `d5Type`) and
  `scripts/fixture-ing-check.mjs` (`checkPatterns`, `median`). `src/` has none of it and no money formatter
  (`src/lib/format.ts` has `plural` and date formatters).
- Oracle (observed with `python3` + a scratch prototype in this step): 206 imported rows in the main file,
  32 distinct `rawMerchant`, 30 `patterns[]`. The only merges are T03 (`minimarket-przystanek`, `normalization`) and
  T01 (`sportowo`, `user-merge` → S-05). The oracle's keys are hand-authored slugs — the testable contract is the
  **partition** of rows plus per-group occurrences / sum / median / type, not key strings.
- A scratch prototype of the rule set below (applied to the oracle's `rawMerchant`) produced **31 groups**, zero
  over-merges and exactly one split (`sportowo` → `sportowo.pl` + `SPORTOWO`) — the intended S-03 partition.
- UI: `src/pages/patterns.astro` is the empty-state stub (`PageTitle` + `ViewEmpty`, `copy.emptyViews.patterns`).
  Kit view: `design/rytm-os/prototype/app.js` `patterns()` / `patternRows()` / `bindInteractions()`; CSS
  `.toolbar`, `.search-field`, `.select-field`, `.table-panel`, `.table-name`, `.merchant-mark`, `.badge.fixed`,
  `.badge.frequent`, `.table-foot` in `prototype/styles.css`. The only in-app table is inline markup in
  `src/pages/imports/index.astro` (`cell` / `head` class constants). React icon markup exists only as a private
  `Glyph` inside `src/components/imports/ImportWizard.tsx`.
- `scripts/smoke.mjs` step "patterns renders empty view" (seeded user, 0 transactions) must stay green.

## Desired End State

- A user with imported debits sees on `/patterns`: kit title block, a toolbar (search by merchant, sort by
  suma / liczba / nazwa), and a table Sprzedawca · Typ · Wystąpienia · Suma · Kwota, with a foot "N wzorców ·
  wszystkie miesiące". Default order: sum descending.
- For the synthetic fixture imported into one account, the table has **31 rows** whose occurrences add up to 206
  and whose sums add up to 6 497 147 grosze (64 971,47 zł); `KINOTEKA` shows `stały` and `52,99 zł`;
  `MINIMARKET PRZYSTANEK` is one row with 8 occurrences; `sportowo.pl` and `SPORTOWO` are two rows (merge = S-05).
- A user with no transactions still sees the existing empty view; a failed read shows the kit's generic error, never
  the empty state and never a partial list.
- Verify: `npm test` (oracle suite), `npm run smoke` (+2 steps), the Visual step's screenshots of the named states.

### Key Discoveries:

- `scripts/fixture-ing.mjs` `rawMerchant` — rule 7/D3 reference: operator (case-insensitive substring of
  `counterparty`) → last whitespace token of the `Tytuł` tail after `Nr transakcji \d+`; empty tail → collapsed
  counterparty (T05 `AUTOPAY …` stays its own merchant).
- `test/unit/ing-parser.test.ts` — oracle-loading pattern (`readFileSync(new URL("expected.json", FIXTURES))`),
  `parseIngStatement` + `buildImportPayload` produce exactly the rows the DB stores.
- `src/components/app/InlineAlert.astro` — precedent for mapping the kit's raw badge/alert hexes onto Tailwind
  names: `#dfe7e4` → `bg-green/15 text-green`, `#e2e7ec` → `bg-ink/8 text-ink` (the same hexes as `.badge.fixed` /
  `.badge.frequent`).
- `src/components/app/Stepper.tsx` — precedent for a React component rendered statically from Astro and inside an
  island.
- `src/pages/imports/index.astro` — read-view shape to follow: `createClient(Astro.request.headers, Astro.cookies)`,
  RLS read, server-side `console.error` + `InlineAlert kind="error"` with `copy.components.error` on failure.
- `context/foundation/design-kit.md` register: last ids K16 / G27 → new rows K17 / G28.

## What We're NOT Doing

- No migration, no `merchant_patterns` table, no stored merchant column, no new RPC/view → no new pgTAP file
  (pgTAP stays at its baseline). S-04/S-05 add their own tables keyed by `(user_id, merchant key)`.
- No user merge / rename / exclude / type change (S-05): `sportowo.pl` and `SPORTOWO` stay two patterns;
  `JAN PRZYKŁADOWY` (T08) stays a visible pattern.
- No auto-merge of T01 (no TLD stripping); no edit to `scripts/fixture-ing.mjs` or `expected.json`.
- No thresholds, "Ponad progiem", row link / arrow to a pattern detail, status badges `nowy` / `zmiana kwoty`,
  excluded section (S-04 / S-05 / S-06) — recorded as DESIGN-GAP G28.
- No "Pokaż więcej" button (the kit's button only toasts "To już wszystkie wzorce."; the list is not paginated).
- No change to `/home` ("Co wraca najczęściej") or `/imports/result` (G26 stays open) — one view per change.
- No operator list in config/DB (PRD Open Question 2): a constant in `src/lib/patterns/merchant.ts`.
- No manual deploy / hosted DB / preview phase — the run's Ship step owns push, PR, `db push`, merge, deploy.

## Implementation Approach

Three phases, each green on its own: (1) the pure domain module proven against the oracle, (2) the paged read of the
user's transactions plus money formatting, (3) the `/patterns` view bound to the kit. Logic lives in `src/lib/`
(testable in Vitest without a DB); the page only composes. Search and sort run client-side in one React island
exactly as the kit's `bindInteractions()` does; the server renders the initial (sum-desc) table so the page is
complete without JS.

## Critical Implementation Details

- **Row limit.** The loader must page with `.range()` ordered by `id`, advance the offset by the number of rows
  **actually returned**, and stop when the collected count reaches the `count: "exact"` total from the first page
  (or a page comes back empty). Never stop on "page shorter than requested" — with `max_rows` below the requested
  page size that silently truncates. Any page error fails the whole read (no partial list).
- **Rule order in normalization is load-bearing** (scheme/`www.` → address cut → legal-form cut → store-number tokens
  → doubled name → whitespace). The Vitest oracle partition pins it; changing a rule re-keys merchants, which will
  matter once S-04/S-05 store rows by key.
- **The oracle is a partition, not strings.** Compare sets of `bankTxId` per group; never assert the oracle's slug
  keys (`zus`, `przelew-wlasny-vat`) against computed keys.
- **Island payload.** Pass the island only the slim list items (key, name, type, occurrences, sum, fixed amount) and
  the copy strings it renders — never transaction rows or the whole `content.json`.

## Phase 1: Merchant normalization and pattern derivation

### Overview

A pure, deterministic module that turns transaction-like inputs into patterns, proven against the F-02 oracle.

### Changes Required:

#### 1. Merchant extraction and normalization

**File**: `src/lib/patterns/merchant.ts` (new)

**Intent**: Port rule 7 / D3 from the fixture generator into the app and add FR-006 normalization, so the same
bank description always yields the same merchant key and display name.

**Contract**:
- `OPERATORS: readonly string[]` = `["PayPro", "PayU", "Cashbill", "Autopay", "ING Pay"]` (mirror of
  `scripts/fixture-ing.mjs` `OPERATORS`; comment points at `import-formats.md` rule 7 / D3 and PRD Open Question 2).
- `rawMerchant(counterparty: string, title: string): string` — identical behaviour to the generator's `rawMerchant`
  (operator substring match case-insensitive; tail after `Nr transakcji \d+`; last whitespace token; else collapsed
  counterparty).
- `normalizeMerchant(raw: string): string` — display form, case preserved, applied in this order:
  1. collapse whitespace, trim; Unicode NFC;
  2. strip a leading `http://` / `https://` and a leading `www.`, and trailing `/`;
  3. cut from the first ` UL. ` / ` AL. ` token to the end (case-insensitive);
  4. cut from the first legal-form token to the end (case-insensitive; list below);
  5. drop whitespace tokens that are all digits with ≥ 3 digits (store numbers, T03);
  6. if the token sequence starts with a sequence repeated twice (`X X …`), keep one copy (T02);
  7. collapse and trim again; if the result is empty, fall back to the collapsed raw.
- `merchantKey(raw: string): string` = `normalizeMerchant(raw).toLocaleLowerCase("pl-PL")`.
- Legal-form cut (tricky regex, alternation order matters — `S.A.R.L.` before `S.A.`):

  ```ts
  const LEGAL_FORM = /\s(SP\.\s?Z\s?O\.\s?O\.|SP\.\s?J\.|SP\.\s?K\.|S\.A\.R\.L\.|S\.C\.A|S\.C\.|S\.A\.|SA)(\s|$).*/i;
  ```

#### 2. Pattern derivation (D5)

**File**: `src/lib/patterns/derive.ts` (new)

**Intent**: Group transactions by merchant key, compute aggregates and the proposed type, deterministically and
independently of input order.

**Contract**:
- `TOLERANCE = { pct: 15, minMinor: 1000 }` (D5, `import-formats.md`); `median(values: number[]): number`
  (even count = mean of the two middle values); `d5Type(amounts: number[]): PatternType` — `fixed` iff every
  amount is within `max(median × 15%, 1000)` of the median (inclusive), else `frequent`; one occurrence → `fixed`.
- `derivePatterns(rows: readonly PatternSource[]): MerchantPattern[]`:
  - key = `merchantKey(rawMerchant(counterparty, title))`; every input row is in exactly one output pattern;
  - `name` = `normalizeMerchant` of the group's raw variant with the most rows; tie → the code-point-smallest
    normalized string;
  - `occurrences`, `sumMinor`, `medianMinor = Math.round(median)`, `type`,
    `fixedAmountMinor = type === "fixed" ? medianMinor : null`, `transactionIds` (sorted);
  - output order: `sumMinor` desc → `name` `localeCompare(…, "pl")` → `key`.

#### 3. Shared types

**File**: `src/types.ts`

**Intent**: Pattern DTOs shared by the loader, the page and the island.

**Contract**: `PatternType = "fixed" | "frequent"`; `PatternSource { id: string; amountMinor: number;
counterparty: string; title: string }`; `MerchantPattern { key; name; type; occurrences; sumMinor; medianMinor;
fixedAmountMinor: number | null; transactionIds: string[] }`; `PatternListItem` = `MerchantPattern` without
`transactionIds` and `medianMinor` (the island payload).

#### 4. Oracle and rule tests

**File**: `test/unit/patterns.test.ts` (new)

**Intent**: Prove the module against the F-02 oracle and pin each rule, including the merges that must **not**
happen.

**Contract** (named cases):
- `fixture partition`: parse the main fixture with `parseIngStatement` → `buildImportPayload(statement,
  MAIN_ACCOUNT)` → `PatternSource` (`id` = `bankTxId`) → `derivePatterns`. Expected partition = `expected.json`
  imported rows grouped by `pattern`, except groups with `resolvedBy: "user-merge"` split by `rawMerchant`.
  Assert: 31 groups; each group's `transactionIds` equals exactly one expected group's `bankTxId` set; union = 206
  ids, no duplicates; total `sumMinor` = the main file's `imported.sumMinor`.
- `fixture aggregates`: for every non-user-merge group, `occurrences` / `sumMinor` / `medianMinor` / `type` equal
  the oracle `patterns[]` entry; both halves of `sportowo` are `frequent` (medians 15949.5 / 12740, spreads > D5
  tolerance); `fixedAmountMinor` is set for exactly the 7 oracle `fixed` patterns (`KINOTEKA` → 5299).
- `rule 7 / D3`: operator + domain tail → domain (T04); operator with empty tail → collapsed counterparty (T05);
  `ing pay` matched case-insensitively; non-operator → collapsed counterparty.
- `normalization`: one row per rule (scheme/`www.`, `UL.`/`AL.` cut, each legal form, store-number tokens, doubled
  name, whitespace); **non-merges**: T06 `PRZYKŁADOWA FIRMA JAN PRZYKŁADOWY …` ≠ T08 `JAN PRZYKŁADOWY …`;
  `sportowo.pl …` ≠ `SPORTOWO SP. Z O.O. …`; `KINO ŚWIATŁO …` ≠ `KINOTEKA …`; `URZĄD SKARBOWY …` ≠ `ZAKŁAD
  UBEZPIECZEŃ SPOŁECZNYCH`.
- `D5 boundary`: exactly at tolerance → `fixed`, one grosz over → `frequent`; the 10 zł floor for a small median;
  even-count median; single occurrence → `fixed`.
- `determinism`: a shuffled copy of the fixture input yields a deep-equal result.

### Success Criteria:

#### Automated Verification:

- Vitest passes with the new suite: `npm test` (baseline 32 tests / 3 files; delta +1 file, all new tests green)
- Lint clean: `npm run lint` (baseline 0 errors, delta 0)
- Types clean: `npx astro check` (baseline 0/0/0, delta 0)
- Fixture untouched and valid: `npm run fixture:check` OK and `git diff --quiet -- test/fixtures scripts/fixture-ing.mjs`
- Build passes: `npm run build`
- Deliberate break: removing the store-number rule makes `fixture partition` fail (32 groups), restored → green

#### Manual Verification:

- Reviewer reads `normalizeMerchant` against the rule list above and finds no rule the fixture does not justify
  or the plan does not name

**Implementation Note**: autonomous run — the Implement step proceeds on green automated criteria; manual rows stay
as the human checklist in `handoff.md` § 5.

---

## Phase 2: Reading the user's patterns

### Overview

A paged, RLS-scoped read of all the user's debits feeding `derivePatterns`, and a money formatter.

### Changes Required:

#### 1. Paged loader

**File**: `src/lib/patterns/load.ts` (new)

**Intent**: Read every transaction of the signed-in user despite `max_rows`, then derive patterns; fail as a whole
on any error.

**Contract**:
- `PAGE_SIZE = 1000`.
- `collectPages<T>(fetchPage: (from: number, to: number) => Promise<{ rows: T[]; count: number | null;
  error: unknown }>): Promise<{ rows: T[] } | { error: unknown }>` — pure paging loop per Critical Implementation
  Details (offset advances by rows returned; stop at `count` or empty page; first error aborts).
- `loadPatterns(supabase: SupabaseClient<Database>): Promise<{ patterns: MerchantPattern[] } | { error: unknown }>`
  — adapter: `from("transactions").select("id, amount_minor, counterparty, title", { count: "exact" })
  .order("id").range(from, to)`, maps rows to `PatternSource` (`id: String(row.id)`), calls `derivePatterns`.
  RLS scopes rows to the caller; no `user_id` filter needed (same as `imports/index.astro`).

#### 2. Money formatter

**File**: `src/lib/format.ts`

**Intent**: Kit `money()` (`app.js`) for grosze.

**Contract**: `formatMoney(minor: number): string` — `(minor / 100).toLocaleString("pl-PL", { minimumFractionDigits:
2, maximumFractionDigits: 2 }) + " zł"` via a module-level `Intl.NumberFormat`; e.g. `5299` → `52,99 zł`,
`150000` → `1500,00 zł`, `1234567` → `12 345,67 zł` (U+00A0 group separator; pl-PL does not group 4 digits).

#### 3. Tests

**Files**: `test/unit/patterns.test.ts` (loader cases), `test/unit/format.test.ts` (`formatMoney`)

**Contract**: `collectPages` with a fake `fetchPage` capped at 3 rows over 7 rows and a requested page of 1000 →
all 7 rows (proves the `max_rows` trap is handled); error on the second page → `{ error }`, no rows; `count: 0` →
empty, one call. `formatMoney` for the three examples above.

### Success Criteria:

#### Automated Verification:

- `npm test` green (baseline after Phase 1 + new loader/format cases)
- `npm run lint` 0 errors; `npx astro check` 0/0/0
- `npm run build` passes
- Deliberate break: `collectPages` stopping on a short page makes the capped-fake case fail, restored → green

---

## Phase 3: `/patterns` view bound to the kit

### Overview

Replace the stub with the kit's patterns view for users with data; keep the empty and error states.

### Changes Required:

#### 1. Shared Badge

**File**: `src/components/app/Badge.tsx` (new)

**Intent**: Kit `.badge` as a shared component (missing-shared-component charge); used here for `fixed` /
`frequent`, reusable by S-04–S-06.

**Contract**: `Badge({ tone: "fixed" | "frequent", children })`; kit metrics (min-height 23 px, pill, 3 px 8 px,
11 px, weight 800, no wrap); colors only via Tailwind names — `fixed`: `bg-green/15 text-green`, `frequent`:
`bg-ink/8 text-ink` (InlineAlert precedent for the same kit hexes). No other tones until a slice needs them.

#### 2. Shared React icon

**Files**: `src/components/Glyph.tsx` (new), `src/components/imports/ImportWizard.tsx`

**Intent**: Move the private `Glyph` out of `ImportWizard` so the island reuses it instead of a third copy of the
sprite markup (accidental-architecture charge).

**Contract**: `Glyph({ name: IconName; size?: number; className?: string })`, same markup as `Icon.astro`;
`ImportWizard` imports it, behaviour unchanged.

#### 3. Patterns table island

**File**: `src/components/patterns/PatternsTable.tsx` (new)

**Intent**: Kit `patterns()` toolbar + table + foot, with `bindInteractions()` behaviour (filter by lowercase
substring of the name, sort `suma` / `liczba` desc or `nazwa` `localeCompare("pl")`, ties by the Phase 1 order).

**Contract**: props `{ patterns: PatternListItem[]; copy: { searchPlaceholder; sortOptions; columns; amountColumn;
typeLabels; footer } }`. Toolbar: `.search-field` (Glyph `search`, input with `aria-label` = placeholder) and
`.select-field` (Glyph `sort`, `<select>` with "Sortuj: suma|liczba|nazwa" built from `copy.patterns.sortOptions`);
stacks < 560 px as the kit does. Table (`.table-panel` > `.table-wrap` overflow auto): Sprzedawca (`.table-name`
without link: `.merchant-mark` with the first letter/digit of the name, upper-cased, + name), Typ (`Badge`),
Wystąpienia, Suma (`formatMoney`), Kwota (`formatMoney(fixedAmountMinor)` or `—`). Foot (`.table-foot`): count of
the **visible** rows + `plural()` + " · wszystkie miesiące". Head/cell classes mirror `imports/index.astro`
`head` / `cell`. Colors only via Tailwind names. Rendered with `client:load` (SSR gives the sum-desc table).

#### 4. Page

**File**: `src/pages/patterns.astro`

**Intent**: Three states like `imports/index.astro`: error → `PageTitle` + `InlineAlert kind="error"`
`copy.components.error` (also when `createClient` returns `null` — unconfigured env; unlike `imports/index.astro`,
which renders that as empty, a missing client here is an error, because the slice rule is "never the empty state on
a failed read"); zero patterns → current empty view unchanged; otherwise `PageTitle` (eyebrow
`copyExtra.patterns.eyebrow`, `copy.patterns.title`, lead `copy.patterns.description`, primary link "+ Wgraj CSV" →
`/imports/new` via `buttonVariants({ variant: "primary" })`) + `PatternsTable`.

**Contract**: `const supabase = createClient(Astro.request.headers, Astro.cookies)`; `null` → error state without
calling the loader; otherwise `loadPatterns(supabase)` (its parameter stays a non-null `SupabaseClient<Database>`); logs errors server-side with
the existing `eslint-disable-next-line no-console` pattern; maps `MerchantPattern` → `PatternListItem`.

#### 5. Copy and design-kit register

**Files**: `src/content/copy.ts`, `context/foundation/design-kit.md`

**Intent**: Copy only via `copy` / `copyExtra`; every string or element the kit does not give is a registered gap.

**Contract**:
- `copyExtra.patterns` gains, verbatim from `prototype/app.js`, under a `DESIGN-GAP: K11` comment:
  `upload: "+ Wgraj CSV"`, `typeLabels: { fixed: "stały", frequent: "częsty" }`, `sortPrefix: "Sortuj: "`,
  `footer: "{n} {patterns} · wszystkie miesiące"` with `patternForms: ["wzorzec", "wzorce", "wzorców"]`.
  (Reuse a `content.json` key instead if one holds the exact string.)
- `copyExtra.patterns.amountColumn: "Kwota"` under `DESIGN-GAP: K17`.
- `design-kit.md`: **K17** (kit table has no "kwota dla stałych" column, FR-007 requires it; placeholder column
  "Kwota" = median of the fixed pattern, `—` for frequent; author delivers column + key); **G28** (patterns list
  before thresholds/detail/exclusion: columns Próg / Ponad progiem, row link + arrow to `#/patterns/:id`,
  status badges, excluded section and "Pokaż więcej" omitted until S-04/S-05/S-06; placeholder = the S-03 table);
  **K18** (the kit has no copy for a failed read of a list: `components.error` „Błąd — sprawdź plik CSV.” points
  at a CSV the user did not touch; placeholder = that key, as `imports/index.astro` already does; author delivers a
  generic read-error line) with a `DESIGN-GAP: K18` comment at the error branch of `patterns.astro`;
  K11 row notes the new `copyExtra.patterns` strings; all three added to "Do rundy 3". `DESIGN-GAP: K17` / `G28`
  comments at the omission points in `PatternsTable.tsx`.

#### 6. Smoke

**File**: `scripts/smoke.mjs`

**Intent**: Prove the list path against the real server + DB for the smoke user's 2-debit import.

**Contract**: after "import result renders the debit count": `patterns lists imported merchants` → `/patterns`
200 contains `Kawiarnia smoke`; `patterns proposes a type` → 200 contains `>stały<` (each smoke merchant has one
occurrence → `fixed` per D5). Match the **rendered** badge text node, never the bare word: the island's
`typeLabels` copy is serialized into the `<astro-island props="…">` attribute, so a bare `stały` would pass even with
no fixed row rendered. "patterns renders empty view" (seeded user) unchanged — it requires the seeded user to have
**no** transactions (see the Visual-step account note under Manual Verification).

### Success Criteria:

#### Automated Verification:

- `npm run lint` 0 errors; `npx astro check` 0/0/0
- `npm test` green (no regression from Phase 2)
- `npm run fixture:check` OK
- `npm run build` passes
- `npx supabase db reset && npx supabase test db` — pgTAP at baseline (44/44 on `main`), delta 0 (no schema change)
- `BASE_URL=http://localhost:4398 npm run smoke` — baseline (46 on `main`) + 2 new steps, all PASS
- `grep -rnE "#[0-9a-fA-F]{3,6}\b|\[#" src/components/patterns src/components/app/Badge.tsx` finds no raw colors

#### Manual Verification:

- Screenshots (Visual step; a **freshly registered local account** — local signup needs no confirmation — with the
  main fixture CSV imported via `/imports/new` on `astro dev --port 4398`; never import into the seeded
  `test@rytm.local`, whose zero transactions the smoke step "patterns renders empty view" depends on — if it happens,
  `npx supabase db reset` before the next smoke run; `pusty` uses the seeded user): `lista` (1440 px, default sort suma), `lista-mobile` (375 px), `wyszukiwanie`
  (term `kin` → `KINO ŚWIATŁO`, `KINOTEKA`, foot "2 wzorce"), `sortowanie-nazwa`, `pusty` (user with no imports),
  `brak-wyników` (term with no match: empty body, foot "0 wzorców"); `błąd` is code-reviewed only (no safe way to
  force a read error locally)
- On the fixture: 31 rows, `KINOTEKA` `stały` 52,99 zł, `MINIMARKET PRZYSTANEK` 8×, `sportowo.pl` and `SPORTOWO`
  as two rows, no row named after a payment operator except `AUTOPAY` (operator without domain, T05)

**Implementation Note**: the Visual step performs the screenshot row; the Implement step proceeds on green
automated criteria.

---

## Testing Strategy

### Unit Tests:

- Oracle partition and aggregates (Phase 1), rules and non-merges, D5 boundaries, determinism.
- Paging loop against a capped fake (Phase 2), `formatMoney`.

### Integration Tests:

- `scripts/smoke.mjs` +2 steps (list renders a merchant and a type for a real import); the existing empty-view step
  guards users with no transactions. pgTAP unchanged (no schema change — existing RLS isolation of `transactions`
  is what scopes the loader).

### Manual Testing Steps:

1. `npx supabase start`, `ASTRO_DEV_BACKGROUND=1 npx astro dev --port 4398 --ignore-lock`.
2. Register a fresh local account (not `test@rytm.local` — see Phase 3 Manual Verification), import `test/fixtures/ing/Lista_transakcji_nr_0000123456_010926.csv` (main
   account), open `/patterns`: 31 rows, foot "31 wzorców · wszystkie miesiące".
3. Type `kin`, switch sort to `nazwa`, resize to 375 px.
4. Kill the dev server (`lsof -ti :4398 | xargs kill`).

## Performance Considerations

PRD `data_volume: small` (thousands of debits per account): a few 1000-row pages and an in-memory group per request.
No caching. If a real account grows past ~20k debits, move grouping to SQL (see reversal conditions in the handoff).

## Migration Notes

None — no schema change. Import deletion (S-02) cascades transactions, so derived patterns follow automatically.
S-04/S-05 will store rows keyed by `merchantKey`; changing normalization after that re-keys merchants and needs a
mapping step in that slice.

## References

- Research: `context/changes/merchant-patterns/research.md`
- Change identity and kit binding: `context/changes/merchant-patterns/change.md`
- Rules: `context/foundation/import-formats.md` (rule 7, D3, D5); PRD FR-006, FR-007
- Reference logic: `scripts/fixture-ing.mjs` (`rawMerchant`, `OPERATORS`, `median`, `d5Type`),
  `scripts/fixture-ing-check.mjs` (`checkPatterns`)
- Read-view pattern: `src/pages/imports/index.astro`; oracle test pattern: `test/unit/ing-parser.test.ts`
- Kit: `design/rytm-os/prototype/app.js` (`patterns`, `patternRows`, `bindInteractions`, `money`, `badge`),
  `design/rytm-os/prototype/styles.css`, `design/rytm-os/react-kit/docs/content.json` (`patterns`)

## Known risks

Recorded by `/10x-plan-review` (`reviews/plan-review.md`, OBSERVATIONs F5–F7); none blocks implementation.

- **Merchant mark casing** (F5): the kit's `patternRows()` renders `p.name[0]` as-is; the plan's "first letter/digit,
  upper-cased" is a small unregistered deviation (visible only for lower-case names such as `kawa-testowa.pl`). The
  implementer either follows the kit literally or registers the upper-casing in the G28 row — not both silently.
- **Offset paging under concurrent deletes** (F6): `collectPages` advances by offset; an import deleted in another
  tab mid-read (S-02 undo) shifts later pages and can skip rows without an error. Negligible at `data_volume: small`;
  keyset paging (`.gt("id", lastId).order("id").limit(PAGE_SIZE)`, stop on an empty page) removes the class and the
  per-page `count: "exact"`. Revisit if S-02 lands before this ships or a skipped row is ever observed.
- **Real-statement over-merge / split** (F7): rule 4's bare `SA` token and rule 5's "≥ 3-digit token" cut can merge
  distinct real merchants (`PIZZA 365` → `PIZZA`); long legal forms (`SPÓŁKA Z OGRANICZONĄ …`), card processors and
  unlisted operators can split them. The oracle cannot see these; the roadmap Unknown (owner user) and S-05 user
  merges are the correction path. The roadmap `### S-03` Risk line still says S-03 adds a migration — the plan
  deliberately does not (handoff § 6); the archive step should correct the roadmap text.

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Merchant normalization and pattern derivation

#### Automated

- [x] 1.1 Vitest passes with the new suite: `npm test` (baseline 32 tests / 3 files; delta +1 file, all new tests green) — 5ae9f36
- [x] 1.2 Lint clean: `npm run lint` (baseline 0 errors, delta 0) — 5ae9f36
- [x] 1.3 Types clean: `npx astro check` (baseline 0/0/0, delta 0) — 5ae9f36
- [x] 1.4 Fixture untouched and valid: `npm run fixture:check` OK and `git diff --quiet -- test/fixtures scripts/fixture-ing.mjs` — 5ae9f36
- [x] 1.5 Build passes: `npm run build` — 5ae9f36
- [x] 1.6 Deliberate break: removing the store-number rule makes `fixture partition` fail (32 groups), restored → green — 5ae9f36

#### Manual

- [x] 1.7 Reviewer reads `normalizeMerchant` against the rule list above and finds no rule the fixture does not justify or the plan does not name

### Phase 2: Reading the user's patterns

#### Automated

- [x] 2.1 `npm test` green (baseline after Phase 1 + new loader/format cases) — dc3c6d6
- [x] 2.2 `npm run lint` 0 errors; `npx astro check` 0/0/0 — dc3c6d6
- [x] 2.3 `npm run build` passes — dc3c6d6
- [x] 2.4 Deliberate break: `collectPages` stopping on a short page makes the capped-fake case fail, restored → green — dc3c6d6

### Phase 3: `/patterns` view bound to the kit

#### Automated

- [x] 3.1 `npm run lint` 0 errors; `npx astro check` 0/0/0 — 23e700d
- [x] 3.2 `npm test` green (no regression from Phase 2) — 23e700d
- [x] 3.3 `npm run fixture:check` OK — 23e700d
- [x] 3.4 `npm run build` passes — 23e700d
- [x] 3.5 `npx supabase db reset && npx supabase test db` — pgTAP at baseline (44/44 on `main`), delta 0 (no schema change) — 23e700d
- [x] 3.6 `BASE_URL=http://localhost:4398 npm run smoke` — baseline (46 on `main`) + 2 new steps, all PASS — 23e700d
- [x] 3.7 `grep -rnE "#[0-9a-fA-F]{3,6}\b|\[#" src/components/patterns src/components/app/Badge.tsx` finds no raw colors — 23e700d

#### Manual

- [x] 3.8 Screenshots (Visual step): `lista`, `lista-mobile`, `wyszukiwanie`, `sortowanie-nazwa`, `pusty`, `brak-wyników`; `błąd` code-reviewed only
- [x] 3.9 On the fixture: 31 rows, `KINOTEKA` `stały` 52,99 zł, `MINIMARKET PRZYSTANEK` 8×, `sportowo.pl` and `SPORTOWO` as two rows, no operator-named row except `AUTOPAY` — 23e700d
