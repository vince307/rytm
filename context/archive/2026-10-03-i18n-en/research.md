---
date: 2026-10-03T20:07:29+0200
researcher: Claude (autonomous run 2026-10-03-i18n-en, step /10x-research)
git_commit: d0800ce6b757dc0056f8eca8a6417ca8c3c0171a
branch: feat/i18n-en
repository: Rytm
topic: "i18n-en — how to give the whole UI an EN locale (cookie + Accept-Language) without changing PL, resolving the open unknowns (a)–(g) of change.md / handoff §5"
tags: [research, i18n, copy, format, middleware, kit-contract, smoke]
status: complete
last_updated: 2026-10-03
last_updated_by: Claude (autonomous run 2026-10-03-i18n-en)
---

# Research: i18n-en — EN locale and language switch

**Date**: 2026-10-03T20:07:29+0200
**Researcher**: Claude (autonomous run, fresh session)
**Git Commit**: d0800ce (branch `feat/i18n-en`, = main `b973428` + 3 docs commits)
**Branch**: feat/i18n-en
**Repository**: Rytm

## Research Question

Derived from `context/changes/i18n-en/change.md` § "Design claims vs repo now" and `handoff.md` §5 (no human asked):
(a) EN month nominatives vs `patternDetail.monthNames` Polish keys under `satisfies KitCopy`; (b) `fillMonthLocative` EN
path; (c) client-side formatting in islands; (d) `formatIsoDate` / `formatRangeShort` for `en-GB`; (e) the shape of the
405 kit leaves + `copyExtra` the EN dictionary must mirror; (f) `DELETE_CONFIRM_WORD` per locale (A4); (g) smoke steps
for the switch. Plus: any hard-coded Polish UI outside the dictionary, and whether the design's type gate works as written.

**PRD**: silent on interface languages (grep of `context/foundation/prd.md` for `język|language|english|angielsk` finds
only FR-018 "Santander Bank Polska"). Scope comes from the owner-approved `design.md` and roadmap `### S-16` — no PRD
section to cite; nothing in the PRD contradicts an EN locale.

## Summary

1. **The design's `CopyExtra = typeof copyExtraPl` does not compile for EN.** `copyExtra` in `src/content/copy.ts` is
   declared `as const`, so every leaf is a string *literal* type; an EN object `satisfies typeof copyExtra` fails on
   every string (observed: `tsc --strict` on a scratch reproduction — `Type '"cat"' is not assignable to type '"kot"'`).
   Needed: a recursive widening type (`Widen<T>`: string → `string`, number → `number`, tuples/objects mapped) —
   verified in the same scratch file: it accepts EN strings, keeps `readonly [string, string, string]` (so `plural()`
   still type-checks) and **rejects a 2-element forms tuple** (`Source has 2 element(s) but target requires 3`). Island
   props typed `typeof copyExtra.imports` (`ImportWizard.tsx` `ImportWizardLabels.imports`) and `typeof copy.imports`
   must move to `CopyExtra["imports"]` / `KitCopy["imports"]` the same way.
2. **(a) monthNames:** `KitCopy = typeof content` (JSON import) types `patternDetail.monthNames` as an object with the 12
   Polish keys, so EN must keep those keys. Resolution (recommended): EN `monthNames` = PL keys → **English month names**
   as values; the app stops reading nominatives via `Object.keys` and gets all month tables from one locale-aware helper
   (PL: nominative = `Object.keys(kit monthNames)`, locative = `Object.values`, genitive = `copyExtra.home.monthsGenitive`;
   EN: all three = `Object.values(en monthNames)` / EN `monthsGenitive` = English names). No kit edit, no relaxed type.
3. **(b) `fillMonthLocative`:** works for EN unchanged *only by accident* — its `"w {month}"` branch is skipped when the
   EN template does not contain that substring, but "Now {month}"-style EN strings would match it. Recommend a `locale`
   parameter: PL path unchanged, EN path = plain `{month}` replace.
4. **(c) client formatting:** exactly 2 islands call `@/lib/format` — `PatternsTable.tsx` (`formatMoney`, `plural`,
   SSR + hydrate) and `ImportWizard.tsx` (`formatRangeLong`, `formatRangeShort`, `plural`, post-interaction states).
   Both need a `locale` prop. Plus `ThresholdEditor.tsx` pre-fills via `formatThresholdInput` (`55,50`, decimal comma);
   the parser `parseThresholdValue` already accepts `.` and `,` — EN pre-fill should emit `55.50`.
5. **(d) dates:** `en-GB` Intl gives `01/05/2026` (Node 22.14 observed); keep `formatIsoDate`/`formatRangeShort` as
   string splits with a per-locale separator (`.` vs `/`) — no time-zone risk introduced. Node 22 en-GB short September
   is `Sept` (`formatMonthAxis` → `Sept 26`).
6. **(e) kit shape:** 405 string leaves, 18 arrays, 9 numeric leaves (must stay equal in EN), 6 `{month}`/`{year}`
   templates. `satisfies KitCopy` catches missing/extra keys but not array length (`string[]`) or placeholders → the
   EN-parity unit test is the real gate for those.
7. **(f) `USUŃ`:** no DB/RPC check (grep of `supabase/migrations` for `USUŃ|DELETE_CONFIRM|confirm`: no hit). The word is
   used in 4 src files + 5 smoke posts + 1 test. A4 (locale word in UI, server accepts either) is implementable;
   `settings.deleteConfirm` (kit, "Wpisz USUŃ, aby potwierdzić.") must contain the EN word in EN.
8. **(g) smoke:** `request()` in `scripts/smoke.mjs` shares one cookie jar across all steps, sends `Origin` but no
   `Referer`, and Node fetch sends `accept-language: *` (observed). A `rytm-locale=en` cookie set mid-run would make
   every later PL assertion fail → EN steps go last (or switch back to `pl`), and `request()` needs an optional
   `headers` argument for `Accept-Language` / `Referer` cases.
9. **Hard-coded Polish outside the dictionary** (inspected: diacritic grep + capitalised-literal grep over
   `src/**/*.{astro,tsx,ts}` excluding `src/content/` and comments): `Layout.astro` banner `<strong>Uwaga:</strong>` and
   fallback `"Dokumentacja"`; `config-status.ts` `message` / `docsLabel`; `index.astro` hero literal `3 842,60 zł`;
   `format.ts` ` zł` suffix and `"wrześniu"`; `auth-rules.ts` `DELETE_CONFIRM_WORD`. The rest are data (Santander
   merchant names / regexes, ING header names). **Hero literal:** `formatMoney(384260)` in pl-PL gives `3842,60 zł`
   (pl-PL does not group 4 digits — observed), so routing it through `formatMoney` would change PL → move it to the
   dictionary as a string instead.

No migration (locale is cookie-only). No prerendered pages (`grep "prerender = true" src` empty), so `Astro.locals`
exists on every page.

## Detailed Findings

### Copy channel (`src/content/copy.ts`)

- `copy` = `content` imported from `design/rytm-os/react-kit/docs/content.json`; `copyExtra = { … } as const` (sections
  `auth home imports patterns fixed settings emptyViews`); `ICON_NAMES` / `IconName` locale-free.
- Consumers (from change.md, re-confirmed): 30 files import `@/content/copy`; 3 are type-only (`Glyph.tsx` `IconName`,
  `ImportWizard.tsx` `typeof copy`/`copyExtra`, `src/lib/import/presentation.ts` `type ImportErrors = typeof
  copy.importErrors`). These must switch to `KitCopy` / `CopyExtra` types once the value exports go.
- Tests read the constants directly: `test/unit/kit-contract.test.ts`, `patterns-table.test.ts`,
  `sequence-label.test.ts` import `copy` / `copyExtra`. **Plan must decide**: drop the `copy`/`copyExtra` value exports
  (tests use `getCopy("pl")`; a forgotten page then fails to compile — safest against EN leaking PL) or keep them as PL
  aliases (fewer edits, but a missed consumer silently stays Polish). Recommendation: drop.
- Typing experiment (scratch file, `tsc --strict --ignoreConfig`): `as const` + `satisfies typeof pl` → error per
  string; `Widen<typeof pl>` → OK; `Widen` with a 2-tuple → error. EN kit object must **not** be `as const` against
  `KitCopy` (JSON arrays are mutable `string[]`; a `readonly` tuple would not be assignable) — or `KitCopy` is defined
  as `DeepReadonly<typeof content>`; plan picks one.

### Months (unknowns a, b)

- `home.astro` `nominatives = Object.keys(copy.patternDetail.monthNames)` → `leadFor` (`dashboard.descriptionNoName`
  "Twój {month} w jednym spokojnym widoku."); `deltaFootFor` uses `h.monthsGenitive[monthIndex(...)]` in
  `dashboard.stats[0].foot` ("{delta} względem {month}").
- `fixed.astro` `fillMonthLocative(copy.fixedCosts.new, …, Object.values(copy.patternDetail.monthNames))`;
  `patterns/[...key].astro` `monthLocatives = Object.values(...)` for `patternDetail.sumLabel` and
  `copyExtra.patterns.overInMonth`.
- Kit `{month}` templates (node walk of content.json): `dashboard.description`, `dashboard.stats.0.foot`,
  `dashboard.descriptionNoName`, `patternDetail.sumLabel`, `fixedCosts.new`; `{year}`: `footer.copyright`.
- `kit-contract.test.ts` pins `Object.values(...)[8] === "wrześniu"` and `Object.keys(...)` nominatives — PL-only
  assertions that must stay; the EN parity test adds "12 EN month names".
- Follow-up F-04 ("month templates through `fillMonthLocative`, never a page-local lookup") is satisfied by the shared
  helper in Summary 2–3; `"Suma w {month}"` → EN e.g. "Total in {month}" → plain replace.
- In English the nominative, "locative" and "genitive" slots are the same word ("in May", "vs April", "Your May…"),
  so EN `copyExtra.home.monthsGenitive` = English month names (shape kept, 12 entries).

### Formatting (`src/lib/format.ts`, unknowns c, d)

- Module-level `Intl` instances: `shortDate`, `pluralRules`, `monthShort`, `monthAxis`, `dayMonth`, `money`; plus
  inline in `formatMonthYear`. All `pl-PL`. String-split: `formatRangeShort`, `formatIsoDate`. Locale-free:
  `formatAccountTail`, `monthIndex`.
- Observed Node 22.14 en-GB: `formatMonthYear` → `May 2026`; `shortDate` → `01/05/2026`; `monthShort` → `May 2026`
  (pl `maj 2026`); `monthAxis` Sept → `Sept 26`; `dayMonth` → `1 May`; money `3,842.60`, `1,234,567.50`;
  `PluralRules("en-GB")` → `one` for 1, `other` for 0/2/5/22 → EN forms tuple `[one, other, other]`.
- Time zones (`Europe/Warsaw` / `UTC`) stay per function — they describe the data, not the language.
- Library consumers needing `locale`: `src/lib/patterns/sequence-label.ts` `sequenceLabel` (calls `plural`),
  `src/lib/patterns/fixed-view.ts` `deltaText` (calls `formatSignedMoney`). **Correction to change.md**:
  `src/lib/import/presentation.ts` only uses `formatAccountTail` (locale-free) — it needs only the type import change.
- Hydration: `PatternsTable` formats money in SSR (Node ICU) and on the client (browser ICU) — same pattern as today in
  pl-PL; en-GB `NumberFormat` 2-decimal output is stable across engines (inference, not observed in a browser).
  `ImportWizard` `formatRangeLong` renders only in the overlap error state after a user action (`overlapMessage`), so
  no SSR/client mismatch there. No browser-only risk found → A5 (no Playwright in this slice) stands.

### Locale flow (middleware, Layout, API)

- `src/middleware.ts` `onRequest`: Supabase user → `PROTECTED_ROUTES` / `AUTH_ROUTES` redirects; `src/env.d.ts`
  `App.Locals` has only `user`. Locale resolution goes first (cookie-only, cheap).
- `src/layouts/Layout.astro`: `<html lang="pl">` hard-coded; banner literals `Uwaga:` / `"Dokumentacja"` next to
  `cfg.message` from `config-status.ts`.
- Cookie pattern to copy: `api/auth/signup.ts` `context.cookies.set(PENDING_EMAIL_COOKIE, …, { path: "/", httpOnly:
  true, sameSite: "lax", secure: context.url.protocol === "https:", maxAge })`; cookie names live in `auth-rules.ts`
  (`PENDING_EMAIL_COOKIE = "rytm-pending-email"`) → `rytm-locale` constant belongs next to it or in `i18n.ts`.
- `astro.config.mjs` sets no `security`/`checkOrigin` → Astro default origin check applies to `POST /api/locale`.
- Caching: `vercel.json` has no headers/ISR; no `Cache-Control` set in `src/` (grep) → SSR responses are not shared
  across cookies; no `Vary` work needed in this inspected config.
- `resolveLocale` must treat `*` (Node fetch default, observed) and unknown tags as no match → `pl`; parse q-values
  (`en-US,en;q=0.9` → `en`; `pl,en;q=0.5` → `pl`).

### Delete confirmation word (unknown f)

- `auth-rules.ts` `DELETE_CONFIRM_WORD = "USUŃ"`; read by `DeleteAccountDialog.tsx` (lock state, `confirmParts =
  labels.confirmationHint.split(DELETE_CONFIRM_WORD)`, bold word), `settings.astro` (placeholder), `api/auth/delete.ts`
  (zod `.refine(v => v === DELETE_CONFIRM_WORD)`), `kit-contract.test.ts` (`s.deleteConfirm` contains the word),
  `scripts/smoke.mjs` (5 posts with `confirm: "USUŃ"`).
- For A4: the word becomes a dialog prop (`confirmWord`), server accepts a set `{USUŃ, DELETE}`; EN
  `settings.deleteConfirm` must contain `DELETE`; parity test asserts each locale's hint contains its word. Smoke's 5
  `USUŃ` posts keep working; add one EN-word post.

### Smoke (unknown g)

- `request(path, { method, form })` → headers `Cookie`, `Origin`, content type; shared `jar` (`storeCookies` honours
  `max-age=0`). Steps are one ordered array `steps`.
- Proposed steps (plan decides): `POST /api/locale locale=en` (no Referer) → 303 `/` + `rytm-locale=en`; `GET /` →
  `lang="en"` + EN heading as `>text<`; `GET /login` still EN (persistence); `POST locale=xx` → 400; `POST` with foreign
  `Referer` → `/`; `GET /` with `Accept-Language: en-GB` and no cookie → EN (needs helper `headers` + a jar-less
  request); finally `POST locale=pl` so any later step sees PL; one signed-in EN view (e.g. `/settings` with `DELETE`).

### EN dictionary shape (unknown e)

- Kit: 405 string leaves under 28 top-level keys; arrays (18): `landing.headline[2] steps[3] ctaTitle[2]`,
  `howItWorks.headline[2] steps[3] explanation[3]`, `forWho.headline[2] cards[3] quoteLines[2]`, `dashboard.stats[2]`,
  `patterns.columns[7] sortOptions[3] countForms[3]`, `patternActions.mergeForms[3]`, `fixedCosts.itemForms[3]
  unchangedForms[3]`, `importFlow.steps[3] debitForms[3]`. Numbers (9, must equal PL): `patternActions.renameMaxLength=60`,
  `fixedCosts.counts.{changed=2,new=1,unchanged=2}`, `trend.minimumMonths=3`, `authStates.passwordMinLength=6`,
  `resetNew.passwordMinLength=6`, `importErrors.limits.{maxMb=5,maxTransactions=5000}`.
- `copyExtra` tuples (`costForms`, `transactionForms`, `accountForms`, `occurrenceForms`, `monthsGenitive[12]`) are
  length-checked by `Widen`; kit arrays are not → parity test: same key set, same array lengths, same placeholder set per
  leaf, equal numbers, no Polish diacritics in EN strings except data-like `zł`.
- New `copyExtra` keys this slice adds (switch labels, banner, hero amount): the S-15 duplicate guard
  (`kit-contract.test.ts` "keeps copyExtra free of strings the kit already ships") must keep running on the PL
  dictionary only.

## Code References

- `src/content/copy.ts` — `copy`, `copyExtra` (`as const`), `ICON_NAMES`, `IconName`
- `src/lib/format.ts` — `formatMonthYear`, `formatDate`, `plural`, `formatRangeShort`, `formatIsoDate`,
  `formatMonthShort`, `formatMonthAxis`, `formatRangeLong`, `formatMoney`, `formatSignedMoney`, `fillMonthLocative`
- `src/pages/home.astro` — `nominatives`, `leadFor`, `deltaFootFor`, `costsText`
- `src/pages/fixed.astro` — `fillMonthLocative(copy.fixedCosts.new, …)`
- `src/pages/patterns/[...key].astro` — `monthLocatives`, `sumLabel`, `overLabel`
- `src/components/patterns/PatternsTable.tsx` — `formatMoney`, `plural` (client)
- `src/components/imports/ImportWizard.tsx` — `ImportWizardLabels`, `overlapMessage`, `plural` (client)
- `src/lib/patterns/threshold-form.ts` — `parseThresholdValue` (accepts `.`/`,`), `formatThresholdInput` (emits `,`)
- `src/lib/patterns/sequence-label.ts` — `sequenceLabel`; `src/lib/patterns/fixed-view.ts` — `deltaText`
- `src/lib/auth-rules.ts` — `DELETE_CONFIRM_WORD`, `PENDING_EMAIL_COOKIE`
- `src/components/settings/DeleteAccountDialog.tsx` — `confirmParts`, `locked`; `src/pages/api/auth/delete.ts` — `schema`
- `src/middleware.ts` — `onRequest`; `src/env.d.ts` — `App.Locals`; `src/layouts/Layout.astro` — `<html lang>`, banner
- `src/lib/config-status.ts` — `configStatuses`; `src/pages/index.astro` — hero amount literal, `formatMonthYear()`
- `scripts/smoke.mjs` — `request`, `jar`, `storeCookies`, `steps`
- `test/unit/kit-contract.test.ts` — month, placeholder, `deleteConfirm`, duplicate-guard assertions

## Architecture Insights

- Islands already receive copy only as props (no runtime `@/content/copy` import in any `.tsx`), so the copy switch is
  page-side; islands change only where they format or are typed against `typeof copy…`.
- Polish grammar lives in three places: dictionary data (`monthsGenitive`, forms tuples), kit key structure
  (`monthNames` keys), and code (`fillMonthLocative` "we", `plural`'s `pl-PL` rules). A single
  `months(locale)`/`fillMonth(locale, …)` helper in `format.ts` contains all of it.
- Data normalisation stays Polish by design: `merchant.ts` `toLocaleLowerCase("pl-PL")`, `derive.ts` /
  `list-view.ts` `localeCompare(…, "pl")`, Santander merchant labels `"Wypłata BLIK"` / `"Bankomat"`.

## Historical Context (from prior changes)

- `context/archive/2026-10-02-kit-round-3-intake/` — month templates must go through `fillMonthLocative` (supported;
  binding for EN).
- `context/archive/2026-10-03-kit-round-3-home-fixed/` — duplicate guard catches byte-identical `copyExtra` only
  (supported; guard stays PL-only).
- `context/archive/2026-09-25-undo-import/` F3 — CSRF via default `checkOrigin` (supported; `astro.config.mjs` unchanged).
- No prior change researched i18n (grep of `context/archive/**` for `i18n|angielsk|english` hits only "Title in
  Polish" naming decisions).

## Related Research

- `context/archive/2026-10-03-kit-round-3-patterns/research.md` — PatternsTable client search/sort (`localeCompare("pl")`).

## Open Questions (for `/10x-plan` to decide — evidence above)

1. Drop vs keep the `copy`/`copyExtra` value exports (recommend drop; tests → `getCopy("pl")`).
2. `KitCopy` as `typeof content` (EN object not `as const`) vs `DeepReadonly` — either works; pick one.
3. Month helper API (`monthNames(locale)` returning `{ nominative, locative, genitive }`) and EN `monthNames` values =
   English names under PL keys — recommended over relaxing `KitCopy`.
4. Where the hero amount, banner strings and switch labels live (`copyExtra` new keys; each with a K42 note).
5. EN `formatThresholdInput` decimal point — in scope (one function) or recorded as follow-up.
6. Smoke helper extension (`headers` option, jar-less call) and ordering (EN steps last, reset to `pl`).
