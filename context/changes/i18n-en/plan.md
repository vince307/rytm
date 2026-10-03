# English locale and language switch (S-16) — Implementation Plan

## Overview

Give the whole interface a second locale, English, next to Polish (the default), with a no-JS PL / EN switch in
the public footer, the auth layout and a `/settings` section. The locale lives in the `rytm-locale` cookie
(1 year, httpOnly), the first visit honours `Accept-Language`, URLs do not change. Copy comes from a typed
dictionary per locale (`getCopy(locale)`), formatting from `src/lib/format.ts` with `pl-PL` / `en-GB` per locale.
User data (merchants, statement descriptions, PLN amounts as `zł`) stays as it is. Polish renders byte-identical to
today. **No migration.**

## Current State Analysis

Source: `research.md` (Summary 1–9, Detailed Findings), `change.md` (claims table, A4–A6), `design.md`, re-checked in
this step. Anchors are symbols.

- `src/content/copy.ts`: `copy = content` (kit JSON `design/rytm-os/react-kit/docs/content.json`), `copyExtra = {…}
  as const` (namespaces `auth home imports patterns fixed settings emptyViews`), `ICON_NAMES` / `IconName`
  (locale-free). 30 `src` files import it: 27 value imports (pages, `Layout`, `AppLayout`, `Sidebar`, `MobileNav`,
  `ViewEmpty`, `Brand`, `Icon`, `SiteHeader`, `SiteFooter`, `ExcludedPatterns`, `RestoreForm`), 3 type-only
  (`Glyph.tsx`, `ImportWizard.tsx`, `src/lib/import/presentation.ts`). Tests importing it: `kit-contract.test.ts`,
  `patterns-table.test.ts`, `sequence-label.test.ts`, `import-presentation.test.ts`.
- Islands never import copy at runtime — every island gets its slice as props from the `.astro` page. Only
  `PatternsTable.tsx` (`formatMoney`, `plural`) and `ImportWizard.tsx` (`formatRangeLong`, `formatRangeShort`,
  `plural`) format on the client; `ThresholdEditor.tsx` pre-fills through `formatThresholdInput` (decimal comma).
- `src/lib/format.ts`: module-level `pl-PL` `Intl` instances (`shortDate`, `pluralRules`, `monthShort`, `monthAxis`,
  `dayMonth`, `money`) + one inline in `formatMonthYear`; `formatRangeShort` / `formatIsoDate` are string splits
  (`DD.MM.YYYY`); `formatMoney` appends ` zł`; `fillMonthLocative` holds Polish grammar („we” before „wrześniu”,
  `w {month}`). Library consumers: `sequence-label.ts` `sequenceLabel`, `fixed-view.ts` `deltaText`
  (`presentation.ts` uses only the locale-free `formatAccountTail`).
- Months: kit `patternDetail.monthNames` is an object whose KEYS are Polish nominatives and VALUES locatives;
  `home.astro` reads `Object.keys(...)`, `fixed.astro` / `patterns/[...key].astro` read `Object.values(...)`;
  genitives are `copyExtra.home.monthsGenitive`.
- Typing: `copyExtra` is `as const`, so `satisfies typeof copyExtra` rejects every EN string; a recursive `Widen<T>`
  accepts EN strings, keeps `readonly [string, string, string]` tuples and rejects a 2-tuple (research scratch run).
  `KitCopy = typeof content` types JSON arrays as mutable `string[]` — catches missing / extra keys, not lengths or
  placeholders. `npm run lint` does not type-check `.astro`; `npx astro check` does.
- Hard-coded Polish outside the dictionary: `Layout.astro` `<html lang="pl">`, banner `Uwaga:` and fallback
  `"Dokumentacja"`; `config-status.ts` `message` / `docsLabel`; `index.astro` hero amount `3 842,60 zł` (pl-PL
  `formatMoney` would print `3842,60 zł`, so it stays a string); `auth-rules.ts` `DELETE_CONFIRM_WORD = "USUŃ"` (read by
  `DeleteAccountDialog.tsx` `confirmParts`, `settings.astro` placeholder, `api/auth/delete.ts` zod `refine`,
  `kit-contract.test.ts`, 5 smoke posts; no DB check).
- `src/middleware.ts` `onRequest`: Supabase user, then `PROTECTED_ROUTES` / `AUTH_ROUTES` redirects; `App.Locals` in
  `src/env.d.ts` has only `user`. Cookie pattern to copy: `api/auth/signup.ts` (`path: "/"`, `httpOnly`,
  `sameSite: "lax"`, `secure` on https, `maxAge`). `astro.config.mjs` keeps Astro's default `checkOrigin`. No
  `Cache-Control` / ISR anywhere → no shared caching across cookies.
- `scripts/smoke.mjs` `request(path, { method, form })`: one shared cookie jar, sends `Origin`, never `Referer` or
  `Accept-Language` (Node fetch sends `accept-language: *`). Steps are one ordered array `steps`.
- No unit test exercises an API route; route logic is tested through pure helpers + smoke (pattern kept here).
- Register `context/foundation/design-kit.md`: highest K = K41, highest G = G39 → K42 (no EN copy in kit), K43 (no
  language switcher).
- No Playwright config (decision A5 in `change.md`: no E2E setup in this slice).

## Desired End State

- `Astro.locals.locale` (`"pl" | "en"`) on every request: `rytm-locale` cookie → `Accept-Language` (first supported
  tag by q-value; `*`, `q=0` and unknown tags do not match) → `pl`. `<html lang>` follows it.
- `getCopy(locale)` returns `{ copy: KitCopy; copyExtra: CopyExtra }`; `pl` = kit JSON + today's `copyExtra`
  (unchanged bytes), `en` = `src/content/en/kit.ts` (`satisfies KitCopy`) + `src/content/en/extra.ts`
  (`satisfies CopyExtra`), each headed by the K42 `DESIGN-GAP` comment. No `copy` / `copyExtra` value export is left.
- Every locale-sensitive formatter takes a required `locale`; EN prints `52.99 zł`, `1 May`, `May 2026`,
  `01/05/2026`, `Sept 26`, `[one, other, other]` plurals; PL output is unchanged.
- `POST /api/locale` (zod `z.enum(["pl","en"])`) sets the cookie and 303s to the same-origin `Referer` path, else
  `/`; invalid value → 400, cookie untouched. `LocaleSwitch.astro` (PL / EN buttons, `aria-pressed`, works without JS)
  sits in `SiteFooter`, the `AuthLayout` corner and a „Język / Language” section in `/settings`.
- Delete-account confirmation: the dialog shows the current locale's word (`USUŃ` / `DELETE`), the server accepts
  either.
- An EN parity unit test pins: same key set, same array lengths, same placeholder set per leaf, equal numbers, no
  Polish diacritics in EN strings (allow-list `zł`).
- K42 / K43 rows in the register; smoke covers the switch and the `Accept-Language` path and still ends PL.

### Key Discoveries:

- The copy switch is page-side only: islands receive copy as props already, so only the three formatting islands
  need a `locale` prop.
- EN `patternDetail.monthNames` must keep the Polish keys (`satisfies KitCopy`) with English values; the app reads
  month tables only through one locale-aware helper, never `Object.keys` / `Object.values` in a page.
- In English nominative, locative and genitive are the same word, so EN `monthsGenitive` = English month names and
  EN `fillMonthLocative` is a plain `{month}` replace.
- Smoke shares one cookie jar: once a step sets `rytm-locale=en`, every later PL assertion would fail — EN steps run
  last and the final step switches back to `pl`.

## What We're NOT Doing

- No URL prefix (`/en`), no locale in the DB profile, no i18n library (design D2, D5).
- No translation of Supabase e-mails (default templates), merchant names, statement descriptions, parser output or
  Santander merchant labels (`"Wypłata BLIK"`, `"Bankomat"`) — data.
- No change to data normalisation: `merchant.ts` `toLocaleLowerCase("pl-PL")`, `localeCompare(…, "pl")` in
  `derive.ts`, `list-view.ts`, `patterns/[...key].astro` stay.
- No edit under `design/rytm-os/` or `src/styles/brand.css`; no `npm run format`.
- No Playwright / `/10x-e2e-setup` (A5); no migration, RLS, pgTAP or `db:types` change.
- Not triggered here (stay open, re-armed): `PanelTitle` sweep for `settings.astro` / `patterns/[...key].astro`
  (the new `/settings` section copies the existing `<h2>` markup); S-14 F7 `FormField` / `DeleteAccountDialog`
  field box.

## Implementation Approach

Seven small phases, each green on its own and committed by a fresh agent. P1–P3 are a refactor with zero visible
change (locale pinned to `pl` in the middleware until P5). P4 adds the EN kit dictionary as pure data guarded by the
parity test. P5 adds the EN extra dictionary, turns locale resolution on (`Accept-Language` reaches EN) and makes the
delete word per locale. P6 adds the only new UI component (`LocaleSwitch.astro`) and `/api/locale`, plus the two
triggered layout follow-ups. P7 is the seam sweep, register, follow-ups and the visual gate in both locales.

Every phase measures the baseline on the branch before editing and reports `baseline + delta` (never absolute
counts), runs at least one deliberate break with a meta-check, and runs the full local gate: `npm run lint`,
`npx astro check`, `npm run fixture:check`, `npm test`, `npm run build`, `npx supabase db reset && npx supabase test db`,
smoke on port 4398 (`ASTRO_DEV_BACKGROUND=1 npx astro dev --port 4398 --ignore-lock`, `BASE_URL=http://localhost:4398
npm run smoke`, then `lsof -ti :4398 | xargs kill`) — Docker / network commands with the sandbox disabled.

## Critical Implementation Details

**Locale stays `pl` until P5.** P1 adds `resolveLocale` and its tests, but the middleware assigns
`DEFAULT_LOCALE` until P5 wires it in — otherwise a browser with `Accept-Language: en-*` would see Polish copy with
`en-GB` numbers between phases. `getCopy("en")` returns the PL dictionaries until P5 (P3 comment names it); P4's EN
kit is imported only by the parity test until P5.

**Required `locale` parameters.** Every locale-sensitive function in `format.ts`, `sequenceLabel`, `deltaText`,
`fillMonthLocative`, `formatThresholdInput` takes `locale: Locale` as a required parameter (no default), so
`astro check` / `tsc` finds every caller. `formatMonthYear(date, locale)` loses its `new Date()` default; callers pass
`new Date()`.

**Smoke ordering and anchors.** EN steps go at the end of `steps`, the last step `POST /api/locale locale=pl`. EN
needles match the rendered node (`>text<`), never bare text (island props carry the same strings). PL visual shots
need `rytm-locale=pl` (a browser with `Accept-Language: en-*` gets EN from P5 on).

**`Widen<T>` and `KitCopy`.** `CopyExtra = Widen<typeof copyExtraPl>` (string → `string`, number → `number`, readonly
tuples kept element-wise, objects mapped); `KitCopy = typeof content`, so `en/kit.ts` is a plain object (not
`as const`) `satisfies KitCopy`. Island props typed `typeof copy.x` / `typeof copyExtra.x` move to `KitCopy["x"]` /
`CopyExtra["x"]`.

## Phase 1: Locale plumbing

### Overview

The locale type, resolution and cookie name, `Astro.locals.locale` (pinned `pl`) and `<html lang>`. No visible change.

### Changes Required:

#### 1. Locale module

**File**: `src/lib/i18n.ts` (new), `test/unit/i18n.test.ts` (new)

**Intent**: One home for the locale vocabulary and the pure resolution rule (design „Przepływ locale”).

**Contract**: `type Locale = "pl" | "en"`, `LOCALES`, `DEFAULT_LOCALE = "pl"`, `LOCALE_COOKIE = "rytm-locale"`,
`INTL_TAG: Record<Locale, string>` (`pl-PL`, `en-GB`), `isLocale(v: unknown): v is Locale`,
`resolveLocale(cookieValue: string | undefined, acceptLanguage: string | null): Locale` — cookie if `isLocale`, else
the highest-q supported primary subtag of `Accept-Language` (`q=0` excluded, `*` ignored), else `pl`. Tests (8, one
per row): cookie `en` → `en`; cookie `pl` + `en-US` header → `pl`; cookie `xx` + `en-US,en;q=0.9` → `en`;
`pl,en;q=0.5` → `pl`; `*` → `pl`; both absent → `pl`; `de-DE,en;q=0.8` → `en`; `en;q=0,pl;q=0.5` → `pl`.

#### 2. Locals, middleware, layout

**File**: `src/env.d.ts`, `src/middleware.ts`, `src/layouts/Layout.astro`, `scripts/smoke.mjs`

**Intent**: Every page can read the locale; the document declares its language.

**Contract**: `App.Locals.locale: import("@/lib/i18n").Locale`; `onRequest` sets `context.locals.locale =
DEFAULT_LOCALE` first, before `createClient` (comment: „resolveLocale from Phase 5”); `<html lang={Astro.locals.locale}>`.
New smoke step „landing declares the page language” (after „landing renders”): contains `<html lang="pl"`.

### Success Criteria:

#### Automated Verification:

- `npm test`: baseline + 8 (`i18n.test.ts`), 0 failed
- Smoke baseline + 1 PASS, 0 FAIL
- `grep -n 'lang="pl"' src/layouts/Layout.astro` empty
- Deliberate break: `resolveLocale` ignores the cookie → the cookie cases red; restored
- Deliberate break: `locals.locale = "en"` in the middleware → smoke „landing declares the page language” red; restored; meta-check recorded (proves Layout reads locals, not the resolution rule — that is the unit test's job)
- Full local gate vs baseline (lint 0, astro check 0, fixture:check OK, vitest + 8, build OK, pgTAP Δ0, smoke + 1)

#### Manual Verification:

- [reviewer] `i18n.ts` has no copy import and no Astro import (pure, unit-testable); the middleware change adds no await before the Supabase call

---

## Phase 2: Locale-aware formatting

### Overview

`format.ts` and its library and island consumers take `locale`; PL output byte-identical, EN output `en-GB`. No new
component; `locale` is always `pl` at runtime in this phase.

### Changes Required:

#### 1. Formatters

**File**: `src/lib/format.ts`, `test/unit/format.test.ts`

**Intent**: Design „Formatowanie” — memoised `Intl` per locale, EN branches for the string-split dates and the month
template.

**Contract**: `formatMonthYear(date, locale)`, `formatDate(ts, locale)`, `plural(n, forms, locale)` (category `one` →
`forms[0]`, `few` → `forms[1]`, anything else → `forms[2]`), `formatRangeShort(start, end, locale)`,
`formatIsoDate(iso, locale)` (PL `DD.MM.YYYY`, EN `DD/MM/YYYY`, still a string split), `formatMonthShort`,
`formatMonthAxis`, `formatRangeLong`, `formatMoney(minor, locale)` (locale number + ` zł`), `formatSignedMoney`,
`fillMonthLocative(template, yearMonth, locatives, locale)` (PL path unchanged incl. „we wrześniu”; EN: replace
`{month}` with `locatives[monthIndex]`, no „w” rewriting). `Intl` instances cached in a `Map` keyed by locale;
time zones unchanged. `formatAccountTail`, `monthIndex` untouched. Tests: every existing PL case gets the `"pl"`
argument with its expected string unchanged; one EN case per function above (e.g. `formatMoney(384260,"en")` →
`3,842.60 zł`, `formatMonthAxis("2026-09","en")` → `Sept 26`, `plural(1|2|5, …, "en")`, `fillMonthLocative("Total in
{month}", "2026-09", en, "en")` → `Total in September`).

#### 2. Library consumers and threshold input

**File**: `src/lib/patterns/sequence-label.ts`, `src/lib/patterns/fixed-view.ts`, `src/lib/patterns/threshold-form.ts`,
their tests

**Intent**: Locale threads through the libraries that format.

**Contract**: `sequenceLabel(…, locale)`, `deltaText(…, locale)`, `formatThresholdInput(threshold, locale)` (EN emits
`55.50`; `parseThresholdValue` already accepts both separators — unchanged). Existing tests pass `"pl"`; one EN case
for `formatThresholdInput`.

#### 3. Page and island callers

**File**: every `@/lib/format` caller (`AppHeader.astro`, `ExcludedPatterns.astro`, `fixed.astro`, `home.astro`,
`imports/index.astro`, `imports/result.astro`, `index.astro`, `patterns/[...key].astro`), `PatternsTable.tsx`,
`ImportWizard.tsx`, `ThresholdEditor.tsx` and the pages that mount them

**Intent**: Pages pass `Astro.locals.locale`; the three formatting islands get a `locale: Locale` prop from their page.

**Contract**: island props `locale: Locale` (serialisable string); no other prop change.

### Success Criteria:

#### Automated Verification:

- `npm test`: Phase 1 count + the added EN cases (number reported), 0 failed; `git diff` of the test files shows no changed PL expected string
- Smoke Phase 1 count PASS, 0 FAIL (Δ0)
- `grep -n '"pl-PL"' src/lib/format.ts` empty (tags come from `INTL_TAG`)
- Deliberate break: `INTL_TAG.en = "pl-PL"` → EN cases red, PL cases green; restored; meta-check recorded (proves the locale reaches `Intl`, not the callers)
- Deliberate break: drop the `locale` argument at one page call site → `npx astro check` red; restored (proves the required parameter is the gate)
- Full local gate vs baseline, smoke + 1 cumulative

#### Manual Verification:

- [reviewer] No formatter keeps a `pl-PL` default; time zones untouched; island props add only `locale`

---

## Phase 3: Copy channel `getCopy(locale)`

### Overview

The dictionary becomes per-locale behind `getCopy`, the value exports go, every consumer reads
`getCopy(Astro.locals.locale)`, and the hard-coded Polish outside the dictionary moves in. No visible change;
`getCopy("en")` still returns PL.

### Changes Required:

#### 1. Dictionary module and types

**File**: `src/content/copy.ts`

**Intent**: Research Open Questions 1–2 (drop exports, `KitCopy = typeof content`).

**Contract**: `type KitCopy = typeof content`; `type Widen<T>`; `const copyExtraPl = {…} as const` (not exported,
bytes unchanged); `type CopyExtra = Widen<typeof copyExtraPl>`; `getCopy(locale: Locale): { copy: KitCopy;
copyExtra: CopyExtra }` over a `Record<Locale, …>` whose `en` entry is the PL pair with a comment „EN dictionaries
from Phase 5”. `ICON_NAMES` / `IconName` unchanged. No `export const copy` / `copyExtra`.

#### 2. Month tables

**File**: `src/content/copy.ts`, `src/pages/home.astro`, `src/pages/fixed.astro`, `src/pages/patterns/[...key].astro`

**Intent**: Research Open Question 3 — one locale-aware source for month names (binding follow-up „month templates
through `fillMonthLocative`, never a page-local lookup”).

**Contract**: `getMonths(locale): { nominative: readonly string[]; locative: readonly string[]; genitive: readonly
string[] }` — PL: `Object.keys(monthNames)`, `Object.values(monthNames)`, `copyExtra.home.monthsGenitive`; EN (from
P5): `Object.values` of EN `monthNames` for nominative and locative, EN `monthsGenitive`. The three pages stop calling
`Object.keys` / `Object.values` on `monthNames`.

#### 3. Consumers

**File**: the 27 value importers, `Glyph.tsx`, `ImportWizard.tsx`, `src/lib/import/presentation.ts`, the 4 tests

**Intent**: Every view reads its locale's copy; a forgotten consumer fails to compile.

**Contract**: `.astro`: `const { copy, copyExtra } = getCopy(Astro.locals.locale)`; type-only importers use `KitCopy`
/ `CopyExtra` / `IconName`; tests use `getCopy("pl")`. The S-15 duplicate guard in `kit-contract.test.ts` keeps
running on `getCopy("pl")` only.

#### 4. Strings outside the dictionary

**File**: `src/layouts/Layout.astro`, `src/lib/config-status.ts`, `src/pages/index.astro`, `src/content/copy.ts`

**Intent**: Research Summary 9 — every Polish UI string comes from the dictionary.

**Contract**: new `copyExtra` leaves (bytes = today's literals): `config: { warning: "Uwaga:", docs: "Dokumentacja",
supabaseMissing: <today's message>, supabaseDocs: <today's docsLabel> }` under a comment naming it app chrome with no
kit key; `landing: { heroAmount: "3 842,60 zł" }` under `DESIGN-GAP` comment for the kit literal. `ConfigStatus`
carries no copy (`name`, `configured`, `docsUrl`, a message key); `Layout.astro` renders the strings from `getCopy`.
Each new leaf passes the duplicate guard (no kit string with the same bytes).

### Success Criteria:

#### Automated Verification:

- `npm test`: Phase 2 count PASS (Δ0), 0 failed
- Smoke Phase 2 count PASS, 0 FAIL (Δ0 — PL bytes unchanged)
- `grep -rn "export const copy\b\|export const copyExtra" src/content/copy.ts` empty; `grep -rnE "import (type )?\{[^}]*\b(copy|copyExtra)\b[^}]*\} from \"@/content/copy\"" src test` empty; `grep -rn "monthNames)" src/pages` empty
- `grep -n "Uwaga\|Dokumentacja\|842,60" src --include=*.astro --include=*.ts -r | grep -v src/content/` empty
- Deliberate break: `getMonths("pl").nominative` built from values → smoke „home lead names the reference month” red; restored; meta-check recorded
- Deliberate break: re-add `import { copy }` in one page → `npx astro check` red; restored (proves the export is gone, so EN cannot silently fall back to PL)
- Full local gate vs baseline, smoke + 1 cumulative

#### Manual Verification:

- [reviewer] `copyExtraPl` bytes unchanged apart from the moved literals; no page reads `monthNames` directly; island props typed via `KitCopy` / `CopyExtra`

---

## Phase 4: EN kit dictionary

### Overview

`src/content/en/kit.ts` — the English translation of every `content.json` leaf — and the parity test. Pure data; not
yet wired (`getCopy("en")` still PL).

### Changes Required:

#### 1. EN kit copy

**File**: `src/content/en/kit.ts` (new)

**Intent**: Design D1 — own translation, marked K42.

**Contract**: first line `// DESIGN-GAP: K42 — kit has no EN copy; own translation, replace when the kit ships one.`;
`export const kitEn = {…} satisfies KitCopy` (plain object). Same 28 top-level keys, every placeholder kept
(`{month} {delta} {n} {items} {within} {over} {amount} {debits} {year} {seconds} {range} {maxMb} {maxTransactions}
{bank}`), numbers equal, forms tuples as `[one, other, other]` (`["cost","costs","costs"]`), `patternDetail.monthNames`
= Polish keys → English month names, every leaf whose PL text contains `USUŃ` says `DELETE` instead, `ING Bank Śląski`
kept verbatim (proper name), money examples written `52.99 zł`.
Voice: short, calm, second person, like the kit; brand name `Rytm` untranslated.

#### 2. Parity test

**File**: `test/unit/i18n-parity.test.ts` (new)

**Intent**: The gate `satisfies` cannot give (array length, placeholders).

**Contract**: cases over `content` vs `kitEn`: same leaf-path set; same length for every array; per string leaf the
same set of `{placeholder}` tokens; numeric leaves equal; no EN string matches `/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/` after removing
the allow-list `ALLOWED_PL_TOKENS = ["zł", "ING Bank Śląski"]` (currency and the bank's proper name — kit leaves
`importFlow.supported`, `importErrors.unknownFormat` and the bank-name map carry it; never transliterate it; P6 adds
`"Język"` for the bilingual section title); 12 EN month names, `monthNames` keys equal to PL; every EN leaf whose PL
counterpart contains `USUŃ` contains `DELETE` (kit: `settings.confirmation`, `settings.deleteConfirm`,
`settings.deleteDisabledHelp`). (P5 extends the file to `copyExtra`.)

### Success Criteria:

#### Automated Verification:

- `npm test`: Phase 3 count + the parity cases (number reported), 0 failed
- Smoke Phase 3 count PASS, 0 FAIL (Δ0)
- `npx astro check` / `tsc` accept `kitEn satisfies KitCopy`
- Deliberate break: drop `{month}` from one EN template → placeholder case red; restored
- Deliberate break: remove one entry of an EN `steps` array → array-length case red while `astro check` stays green; restored; meta-check recorded (proves the test, not the type, guards lengths)
- Deliberate break: put `ł` in one EN string → diacritics case red; restored
- Full local gate vs baseline, smoke + 1 cumulative

#### Manual Verification:

- [reviewer] Translation reads naturally, keeps every placeholder in a grammatical position, no key invented

---

## Phase 5: EN extra dictionary, locale resolution live, delete word per locale

### Overview

`src/content/en/extra.ts`, `getCopy("en")` returns EN, the middleware resolves the locale (EN reachable via
`Accept-Language`), the delete-account word per locale (decision A4). No new component.

### Changes Required:

#### 1. EN extra copy and wiring

**File**: `src/content/en/extra.ts` (new), `src/content/copy.ts`, `test/unit/i18n-parity.test.ts`

**Intent**: Complete EN; `Widen` makes a missing key or a wrong tuple length a compile error.

**Contract**: K42 header line; `export const extraEn = {…} satisfies CopyExtra`; `monthsGenitive` = English month
names; forms `[one, other, other]`; `config` / `landing.heroAmount` (`3,842.60 zł`) translated. `getCopy("en")` →
`{ copy: kitEn, copyExtra: extraEn }`; `getMonths("en")` per P3 contract. Parity test extended to `copyExtraPl` vs
`extraEn` (leaf paths, placeholders, diacritics).

#### 2. Resolution on

**File**: `src/middleware.ts`, `scripts/smoke.mjs`

**Intent**: Design D2 — cookie, then `Accept-Language`, then `pl`.

**Contract**: `context.locals.locale = resolveLocale(context.cookies.get(LOCALE_COOKIE)?.value,
context.request.headers.get("accept-language"))`. `request()` gains an optional `headers` object merged after the
defaults. New smoke steps at the end of `steps`: „first visit honours Accept-Language” (`GET /` with
`Accept-Language: en-GB,en;q=0.9`): contains `<html lang="en"` and the EN landing headline as `>…<`; „signed-in view
follows Accept-Language” — one composite step (the run's last baseline step is „signout seeded user”, so the jar
holds no session): `POST /api/auth/signin` with `seeded`, then `GET /settings` with the same header (its response is
the step's result), then `POST /api/auth/signout`; expects 200 and the EN settings title as `>…<`. Signing out inside
the step matters: P6's „English persists on the next page” GETs `/login`, which a live session redirects to `/home`.

#### 3. Delete word per locale

**File**: `src/lib/auth-rules.ts`, `src/pages/api/auth/delete.ts`, `src/pages/settings.astro`,
`src/components/settings/DeleteAccountDialog.tsx`, `test/unit/kit-contract.test.ts`, a unit test for the helper

**Intent**: Decision A4 — `Ń` is untypeable on most non-Polish keyboards; either word proves intent.

**Contract**: `DELETE_CONFIRM_WORDS: Record<Locale, string>` (`USUŃ`, `DELETE`), `isDeleteConfirmWord(v: string):
boolean` (exact match against either); `/api/auth/delete` zod `refine(isDeleteConfirmWord)`; the dialog takes a
`confirmWord` prop (lock state and `confirmParts` split use it, no client import of the constant); `settings.astro`
passes `DELETE_CONFIRM_WORDS[locale]` as prop and placeholder. Unit cases: `USUŃ` true, `DELETE` true, `usuń` false,
`delete` false, `` false. Kit-contract: each locale's `settings.confirmation`, `settings.deleteConfirm` and
`settings.deleteDisabledHelp` contain its word (the dialog splits `deleteConfirm` on the word to bold it).

### Success Criteria:

#### Automated Verification:

- `npm test`: Phase 4 count + the extra parity and `isDeleteConfirmWord` cases (number reported), 0 failed
- Smoke Phase 4 count + 2 PASS, 0 FAIL (the 5 `USUŃ` posts unchanged)
- `grep -rn "DELETE_CONFIRM_WORD\b" src test` empty; `grep -n "DEFAULT_LOCALE" src/middleware.ts` empty
- Deliberate break: middleware back to `DEFAULT_LOCALE` → both new smoke steps red; restored; meta-check recorded
- Deliberate break: `isDeleteConfirmWord` checks only `USUŃ` → `DELETE` case red, smoke green (no EN delete post); restored — meta-check: smoke cannot prove the EN word, the unit case does
- Deliberate break: one `extraEn` forms tuple with 2 entries → `npx astro check` red; restored (proves `Widen` keeps tuple length)
- Full local gate vs baseline, smoke + 3 cumulative

#### Manual Verification:

- [reviewer] `getCopy("en")` returns only EN objects; dialog and server agree on the word source; no PL string in `extraEn`

---

## Phase 6: Language switch and `/api/locale`

### Overview

The switch on every page family, the endpoint, the K42 / K43 register rows, and the two triggered layout follow-ups
in files this phase touches. New UI component: `LocaleSwitch.astro` (1).

### Changes Required:

#### 1. Endpoint

**File**: `src/pages/api/locale.ts` (new), `src/lib/i18n.ts`, `test/unit/i18n.test.ts`

**Intent**: Design „POST /api/locale” — set the cookie, return where the user was, no open redirect.

**Contract**: `export const prerender = false`; `POST` parses form `locale` with `z.enum(LOCALES)` → 400 on failure
(cookie untouched); `cookies.set(LOCALE_COOKIE, locale, { path: "/", httpOnly: true, sameSite: "lax", secure: https,
maxAge: 31536000 })`; `redirect(localeRedirectTarget(request.headers.get("referer"), url.origin), 303)`.
Pure `localeRedirectTarget(referer, origin): string` in `i18n.ts` → path + search of a same-origin referer, else `/`.
Unit cases: same-origin `/settings?x=1` → `/settings?x=1`; foreign origin → `/`; missing → `/`; malformed → `/`;
`//evil.example/` path-looking referer → `/`. Default `checkOrigin` stays (follow-up `2026-09-25-undo-import` F3).

#### 2. Switch component and placements

**File**: `src/components/LocaleSwitch.astro` (new), `src/components/marketing/SiteFooter.astro`,
`src/layouts/AuthLayout.astro`, `src/pages/settings.astro`, `src/content/copy.ts`, `src/content/en/extra.ts`

**Intent**: Design D3 — no-JS switch, kit tokens only.

**Contract**: `DESIGN-GAP: K43` comment; `<form method="post" action="/api/locale">` with two `button name="locale"`
(`value="pl"` / `"en"`, visible `PL` / `EN`, `lang` + `aria-label` the language's own name, active one
`aria-pressed="true"`); props `locale`, `labels`, `class?` (`cn`); colours `ink` / `muted` / `line` only, focus ring
as in existing buttons. New `copyExtra.locale = { label, pl: "Polski", en: "English", sectionTitle: "Język /
Language" }` in both dictionaries (native names and the bilingual title identical in both; `label` translated; the
parity diacritics case adds `"Język"` to `ALLOWED_PL_TOKENS`). Placement:
end of `SiteFooter`; top-right corner of the `AuthLayout` form column; a `/settings` section copying the existing
section markup (`Panel` + `<h2>`), placed before the danger zone. The P5 parity test allows these identical leaves.

#### 3. Triggered follow-ups

**File**: `src/layouts/AuthLayout.astro`, `src/pages/index.astro`

**Intent**: Follow-ups armed for „next slice touching `AuthLayout.astro`” and „next slice touching the public pages”.

**Contract**: `visual.title` gets the kit `.auth-copy h1` bold weight; the landing steps section head stacks below
560 px (kit breakpoint). Both noted as closed in P7.

#### 4. Register and smoke

**File**: `context/foundation/design-kit.md`, `scripts/smoke.mjs`

**Contract**: K42 (no EN copy; files `src/content/en/*.ts`), K43 (no language switcher; `LocaleSwitch.astro`) rows.
Smoke steps appended after the P5 steps, in order: „locale switch rejects an unknown value” (`POST locale=xx` → 400);
„locale switch sets English” (`POST locale=en`, no Referer → 303 `/`, jar gets `rytm-locale=en`); „landing renders in
English after the switch” (`<html lang="en"` + EN headline `>…<` + `>EN<` button with `aria-pressed="true"`); „English
persists on the next page” (`GET /login` → EN login heading `>…<`); „locale switch returns to a same-origin page”
(`POST locale=en` with `Referer: BASE_URL/how-it-works` → 303 `/how-it-works`); „locale switch ignores a foreign
referer” (`Referer: https://example.com/x` → 303 `/`); „locale switch returns to Polish” (`POST locale=pl` → 303, then
`GET /` contains `<html lang="pl"` and „Zobacz swój rytm”) — last step of the run.

### Success Criteria:

#### Automated Verification:

- `npm test`: Phase 5 count + 5 (`localeRedirectTarget`), 0 failed
- Smoke Phase 5 count + 7 PASS, 0 FAIL
- `grep -n "K42\|K43" context/foundation/design-kit.md` shows both rows; `grep -rn "DESIGN-GAP: K4[23]" src` hits `en/kit.ts`, `en/extra.ts`, `LocaleSwitch.astro`
- Deliberate break: `localeRedirectTarget` returns the full referer → foreign-origin unit case and smoke „ignores a foreign referer” red; restored; meta-check recorded
- Deliberate break: `z.enum(LOCALES)` replaced by `z.string()` → smoke „locale switch rejects an unknown value” red (303, not 400); restored; meta-check recorded (an unknown cookie value would still resolve to `pl`, so the 400 status is the observable proof)
- Full local gate vs baseline, smoke + 10 cumulative

#### Manual Verification:

- [reviewer] Switch uses Tailwind colour names only, works with JS disabled, `aria-pressed` on the active button; no open redirect; cookie flags match the signup pattern
- [visual] Quick look 1280 and ~400 px: footer, auth corner and `/settings` section in PL and EN (full matrix in P7)

---

## Phase 7: Seam sweep, follow-ups and visual gate

### Overview

Close the slice: leftovers from earlier phases, the register, follow-ups, and the visual gate in both locales.

### Changes Required:

#### 1. Seam sweep

**File**: whatever the greps hit

**Intent**: Earlier phases each changed one layer; remove what they left behind.

**Contract**: no duplicated helpers (one `INTL_TAG`, one month helper, one cookie constant, no second `Widen`), no
stale comments (`"resolveLocale from Phase 5"`, `"EN dictionaries from Phase 5"`, any comment still naming
`copy` / `copyExtra` exports, `DELETE_CONFIRM_WORD` or `lang="pl"`), no `copyExtraPl` leaf without a reader
(grep the access tail), every `DESIGN-GAP` id in `src` has a register row, no Polish UI literal outside
`src/content/` (`grep -rnP "[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]" src --include=*.astro --include=*.tsx --include=*.ts` minus
`src/content/` and the recorded data files `merchant.ts`, `santander-*`, ING header names, comments).

#### 2. Follow-ups and register

**File**: `context/changes/i18n-en/follow-ups/review-fixes.md` (new), `context/foundation/design-kit.md`

**Contract**: closed: `AuthLayout` title weight, landing steps head < 560 px; re-armed with `Trigger:` lines:
`PanelTitle` sweep, S-14 F7 field box, E2E setup (`Trigger: hydration mismatch seen in an EN island, or the next
slice adding a browser-only risk`), EN copy replacement (`Trigger: kit ships EN copy (K42)`).

### Success Criteria:

#### Automated Verification:

- `npm test`: Phase 6 count PASS (Δ0 unless the sweep adds a case — reported), 0 failed
- Smoke Phase 6 count PASS, 0 FAIL
- Seam greps above empty (or each remaining hit named as data in the phase report)
- `git diff main -- design/ src/styles/brand.css` empty
- Deliberate break: add a Polish literal (`"Zapisz"`) to one `.astro` outside `src/content/` → the diacritic sweep grep does not catch it (no diacritic); add `"Usuń"` → caught; restored; meta-check recorded (the grep catches diacritic words only — say so in `## 5. Open`)
- Full local gate vs baseline, smoke + 10 cumulative

#### Manual Verification:

- [reviewer] Seam sweep complete; follow-ups carry `Trigger:` lines; register matches code
- [visual] Screenshots EN, desktop 1280 + ~400 px: `/`, `/how-it-works`, `/for-who`, `/login` (default and error), `/register` (default and `?error=occupied`), `/confirm-email`, `/reset`, `/reset/new` (form and `?state=expired`), `/home` (data with threshold and ≥ 3 months, one month, pre-import empty), `/patterns` (list, excluded section), `/patterns/<key>` (detail with threshold editor open), `/fixed` (changes and no-comparison), `/imports` (list and empty), `/imports/new` (file step, overlap error), `/imports/result`, `/settings` (with Language section, delete dialog open with `DELETE` typed); the switch with keyboard focus in footer, auth corner and settings — long EN strings vs layout
- [visual] Screenshots PL (`rytm-locale=pl` cookie), desktop 1280 + ~400 px: `/`, `/login`, `/home`, `/patterns`, `/fixed`, `/imports`, `/settings` — byte-for-byte same copy as before the slice apart from the switch, the bold auth title and the stacked landing steps head
- [human] Accept S-16 product choices: own EN translation (K42) and its voice; switch design and placement (K43) with bilingual „Język / Language” section title; delete confirmation accepts `USUŃ` or `DELETE`; first visit follows `Accept-Language` (a browser in English sees EN on first visit); the type gate catches missing keys while array lengths and placeholders are guarded by the parity test (design said „compile error”); Supabase e-mails stay default; send K42–K43 to the kit author

## Testing Strategy

### Unit Tests:

- New: `i18n.test.ts` (`resolveLocale` 8 cases, `localeRedirectTarget` 5), `i18n-parity.test.ts` (kit + extra:
  paths, lengths, placeholders, numbers, diacritics, months, delete word), `isDeleteConfirmWord` cases.
- Extended: `format.test.ts` (EN case per formatter, PL cases unchanged), `threshold-form`, `sequence-label`,
  `fixed-view` (locale argument), `kit-contract.test.ts` (`getCopy("pl")`, per-locale delete word).

### Integration Tests:

- Smoke + 10 net: P1 + 1 (`lang="pl"`), P5 + 2 (`Accept-Language`), P6 + 7 (switch). EN steps last, the run ends PL.
  pgTAP unchanged.

### Manual Testing Steps:

1. `npx supabase start`; import the synthetic ING fixture for the test user; `ASTRO_DEV_BACKGROUND=1 npx astro dev
   --port 4399 --ignore-lock`.
2. Switch to EN in the footer; walk the P7 EN list at 1280 and ~400 px; set `rytm-locale=pl` and walk the PL list.
3. Kill the dev server (`lsof -ti :4399 | xargs kill`).

## Known risks

- No render test for pages: wiring proven by smoke needles, the parity test and the visual gate.
- `PatternsTable` formats money in SSR (Node ICU) and on hydration (browser ICU); en-GB 2-decimal output is expected
  identical (inference) — a hydration warning in the EN visual gate becomes the E2E follow-up trigger.
- The diacritic sweep misses Polish words without diacritics; the EN visual gate is the backstop.
- Translation quality is not machine-checkable; the `[human]` row owns it.
- Plan review (2026-10-03): the parity diacritics rule needs an explicit allow-list (`zł`, `ING Bank Śląski`, P6
  `Język`); widening it beyond proper names / the bilingual title would let real Polish leak into EN — keep it to
  exact tokens.
- Plan review: the composite P5 smoke step hides which sub-request failed; on red, the implementer reruns the three
  requests by hand before touching code.

## Performance Considerations

Negligible: `Intl` instances cached per locale (two at most per formatter), one cookie read per request, dictionaries
are static imports.

## Migration Notes

None. Rollback = revert the merge; an `rytm-locale` cookie left in browsers is ignored by the old code.

## Autonomous decisions

Recorded in place of the skill's questions (run contract rule 1). **No decision departs from the PRD's literal text**
(the PRD is silent on interface languages). One decision departs from `design.md`'s literal text — the success
criterion „Brak klucza w EN to błąd kompilacji” holds for keys and `copyExtra` tuples, but kit array lengths and
placeholders are guarded by a unit test, not the compiler — named in `[human]` row 7.10.

| # | Decision | Chosen | Rejected | Why | What would change it |
| --- | --- | --- | --- | --- | --- |
| 1 | Complexity / questions | HIGH, 0 questions | Interview | design + research decided everything else with recommendations | A product owner available |
| 2 | `copy` / `copyExtra` value exports | Dropped; tests use `getCopy("pl")` | Keep as PL aliases | A missed consumer then fails `astro check` instead of staying Polish in EN | — |
| 3 | `KitCopy` | `typeof content`, EN kit a plain object | `DeepReadonly` | Fewer types; JSON arrays are mutable already | A consumer needing readonly tuples |
| 4 | `CopyExtra` | `Widen<typeof copyExtraPl>` | design's `typeof copyExtraPl` | `as const` literal types reject every EN string (research scratch run) | — |
| 5 | Month names | EN `monthNames` = PL keys → English values; one `getMonths(locale)` | Relax `KitCopy` for one key; a separate nominative table | Keeps `satisfies KitCopy` strict and the kit untouched | Kit ships EN month data |
| 6 | `fillMonthLocative` | `locale` parameter, EN plain replace | Unchanged function | Its „w {month}” branch would fire on EN strings by accident | — |
| 7 | Locale before P5 | Pinned `pl` in middleware; `getCopy("en")` = PL until P5 | Resolve from P1 | No mixed PL copy + EN numbers between phases | Phases shipped separately to prod (they are not) |
| 8 | Required `locale` params | Required everywhere, no default | `locale = "pl"` default | The compiler lists every caller | — |
| 9 | Threshold input EN decimal | In scope (`55.50`) | Follow-up | One function; parser already accepts both | — |
| 10 | Hero amount | Dictionary string (`3 842,60 zł` / `3,842.60 zł`) | `formatMoney(locale)` | pl-PL `formatMoney` prints `3842,60 zł` → PL regression | Owner accepts the PL change |
| 11 | Banner / config strings | Moved to `copyExtra.config` | Leave operator-only Polish | Success criterion „no Polish UI strings” is cheap here (A6) | Banner removed from the app |
| 12 | Delete word (A4) | Dialog shows the locale's word; server accepts `USUŃ` or `DELETE` | `USUŃ` in EN; server checks only request locale | `Ń` untypeable on most keyboards; a cookie switch mid-dialog must not reject a correct entry | Owner wants one word |
| 13 | Switch labels | Visible `PL` / `EN`, native names as `aria-label` / `lang`, bilingual section title „Język / Language” in both locales | Translated section title | A user who cannot read the current language still finds it (design's literal title) | Visual gate shows the bilingual title crowded at 400 px |
| 14 | E2E (A5) | No Playwright; smoke + unit + visual gate | `/10x-e2e-setup` now | No browser-only risk found; setup is its own infra change | Hydration mismatch in EN gate → follow-up trigger |
| 15 | API route test | Pure `localeRedirectTarget` unit + smoke | Route-level unit test | Repo tests no route directly; same split as other routes | A test harness for routes appears |
| 16 | Triggered follow-ups | Auth title weight and landing steps stack done in P6; `PanelTitle` and F7 re-armed | All in; all out | Two are one class each in files P6 edits; two are visual sweeps unrelated to i18n | — |
| 17 | Phase size | 7 phases, ≤ 1 new UI component per phase | Design's 5 phases | Contract: fresh agent per phase; P4 (≈ 405 strings) alone is a full phase | — |

## References

- Change identity and design: `context/changes/i18n-en/change.md`, `context/changes/i18n-en/design.md`
- Research: `context/changes/i18n-en/research.md`
- Roadmap: `context/foundation/roadmap.md` `### S-16`
- Kit copy: `design/rytm-os/react-kit/docs/content.json`; register `context/foundation/design-kit.md`
- Follow-ups consumed: `context/archive/2026-10-02-kit-round-3-intake/follow-ups/review-fixes.md` (month template),
  `context/archive/2026-10-03-kit-round-3-home-fixed/` (auth title weight, duplicate guard, `PanelTitle`),
  `context/archive/2026-10-03-kit-round-3-auth-settings/` F3 (landing steps head),
  `context/archive/2026-10-03-kit-round-3-patterns/` F7, `context/archive/2026-09-25-undo-import/` F3 (`checkOrigin`)
- Format example: `context/archive/2026-10-03-kit-round-3-home-fixed/plan.md`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Locale plumbing

#### Automated

- [x] 1.1 npm test: baseline + 8 i18n cases, 0 failed — ace542d
- [x] 1.2 Smoke baseline + 1 PASS, 0 FAIL — ace542d
- [x] 1.3 No hard-coded lang="pl" left in Layout.astro — ace542d
- [x] 1.4 Deliberate break: resolveLocale ignoring the cookie turns the cookie cases red, restored — ace542d
- [x] 1.5 Deliberate break: locals.locale = "en" turns the lang smoke step red, restored, meta-check recorded — ace542d
- [x] 1.6 Full local gate vs baseline, smoke + 1 — ace542d

#### Manual

- [ ] 1.7 [reviewer] i18n.ts pure; middleware adds no await before Supabase

### Phase 2: Locale-aware formatting

#### Automated

- [x] 2.1 npm test: Phase 1 count + EN format cases, 0 failed, no PL expected string changed — 1def5ed
- [x] 2.2 Smoke Phase 1 count PASS, 0 FAIL, Δ0 — 1def5ed
- [x] 2.3 No pl-PL literal left in format.ts — 1def5ed
- [x] 2.4 Deliberate break: INTL_TAG.en = pl-PL turns EN cases red, PL green, restored, meta-check recorded — 1def5ed
- [x] 2.5 Deliberate break: missing locale argument at a page call site turns astro check red, restored — 1def5ed
- [x] 2.6 Full local gate vs baseline, smoke + 1 cumulative — 1def5ed

#### Manual

- [ ] 2.7 [reviewer] No pl-PL default in any formatter; time zones untouched; islands add only locale

### Phase 3: Copy channel getCopy(locale)

#### Automated

- [x] 3.1 npm test: Phase 2 count PASS, Δ0, 0 failed — 3461cbc
- [x] 3.2 Smoke Phase 2 count PASS, 0 FAIL, Δ0 — 3461cbc
- [x] 3.3 No copy/copyExtra value export or import, no page-local monthNames read — 3461cbc
- [x] 3.4 No banner, config or hero literal left outside src/content — 3461cbc
- [x] 3.5 Deliberate break: PL nominatives from values turns the home lead smoke step red, restored, meta-check recorded — 3461cbc
- [x] 3.6 Deliberate break: re-added copy import turns astro check red, restored — 3461cbc
- [x] 3.7 Full local gate vs baseline, smoke + 1 cumulative — 3461cbc

#### Manual

- [ ] 3.8 [reviewer] copyExtraPl bytes unchanged apart from moved literals; month reads only via getMonths; island props via KitCopy/CopyExtra

### Phase 4: EN kit dictionary

#### Automated

- [x] 4.1 npm test: Phase 3 count + parity cases, 0 failed — 269b4df
- [x] 4.2 Smoke Phase 3 count PASS, 0 FAIL, Δ0 — 269b4df
- [x] 4.3 astro check accepts kitEn satisfies KitCopy — 269b4df
- [x] 4.4 Deliberate break: dropped placeholder turns the placeholder case red, restored — 269b4df
- [x] 4.5 Deliberate break: shortened EN array turns the length case red while astro check stays green, restored, meta-check recorded — 269b4df
- [x] 4.6 Deliberate break: Polish diacritic in EN turns the diacritics case red, restored — 269b4df
- [x] 4.7 Full local gate vs baseline, smoke + 1 cumulative — 269b4df

#### Manual

- [ ] 4.8 [reviewer] EN translation natural, placeholders grammatical, no invented key

### Phase 5: EN extra dictionary, locale resolution live, delete word per locale

#### Automated

- [x] 5.1 npm test: Phase 4 count + extra parity and isDeleteConfirmWord cases, 0 failed (416 -> 425, +9) — 5374856
- [x] 5.2 Smoke Phase 4 count + 2 PASS, 0 FAIL (196 -> 198) — 5374856
- [x] 5.3 No DELETE_CONFIRM_WORD and no pinned DEFAULT_LOCALE in middleware left — 5374856
- [x] 5.4 Deliberate break: middleware pinned to pl turns both Accept-Language steps red, restored, meta-check recorded — 5374856
- [x] 5.5 Deliberate break: USUŃ-only check turns the DELETE case red, restored, meta-check recorded — 5374856
- [x] 5.6 Deliberate break: 2-entry extraEn forms tuple turns astro check red, restored — 5374856
- [x] 5.7 Full local gate vs baseline, smoke + 3 cumulative — 5374856

#### Manual

- [ ] 5.8 [reviewer] getCopy("en") EN only; dialog and server share the word source; no PL string in extraEn

### Phase 6: Language switch and /api/locale

#### Automated

- [x] 6.1 npm test: Phase 5 count + 5 localeRedirectTarget cases, 0 failed
- [x] 6.2 Smoke Phase 5 count + 7 PASS, 0 FAIL
- [x] 6.3 K42 and K43 register rows and DESIGN-GAP comments present
- [x] 6.4 Deliberate break: full-referer redirect turns the foreign-origin unit case and smoke step red, restored, meta-check recorded
- [x] 6.5 Deliberate break: z.string() instead of z.enum turns the reject smoke step red, restored, meta-check recorded
- [x] 6.6 Full local gate vs baseline, smoke + 10 cumulative

#### Manual

- [ ] 6.7 [reviewer] Switch tokens only, no-JS, aria-pressed; no open redirect; cookie flags match signup
- [ ] 6.8 [visual] Quick look 1280 and ~400 px of footer, auth corner and settings section in PL and EN

### Phase 7: Seam sweep, follow-ups and visual gate

#### Automated

- [ ] 7.1 npm test: Phase 6 count PASS, 0 failed
- [ ] 7.2 Smoke Phase 6 count PASS, 0 FAIL
- [ ] 7.3 Seam greps empty or each hit named as data
- [ ] 7.4 Slice leaves design/ and brand.css untouched
- [ ] 7.5 Deliberate break: Polish literal outside src/content checked against the sweep grep, restored, meta-check recorded
- [ ] 7.6 Full local gate vs baseline, smoke + 10 cumulative

#### Manual

- [ ] 7.7 [reviewer] Seam sweep complete, follow-ups carry Trigger lines, register matches code
- [ ] 7.8 [visual] EN screenshots desktop + ~400 px of every listed view and state, switch focus in all three places
- [ ] 7.9 [visual] PL screenshots desktop + ~400 px with rytm-locale=pl, copy unchanged apart from the switch and the two follow-ups
- [ ] 7.10 [human] Accept S-16 product choices (own EN translation K42, switch design K43 with bilingual section title, USUŃ or DELETE, Accept-Language first visit, parity test instead of compile error for lengths and placeholders, default Supabase e-mails) and send K42–K43 to the kit author
