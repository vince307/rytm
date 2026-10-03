<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: English locale and language switch (S-16)

- **Plan**: context/changes/i18n-en/plan.md
- **Scope**: Full plan
- **Reviewed phases**: 1, 2, 3, 4, 5, 6, 7
- **Date**: 2026-10-03
- **Verdict**: NEEDS ATTENTION before fixes → APPROVED after fixes (`1dbab76`)
- **Findings**: 1 critical (fixed) 3 warnings (1 fixed, 2 recorded) 5 observations

Reviewed autonomously (run `2026-10-03-i18n-en`): no AskUserQuestion; triage per the run contract (CRITICAL → fix,
WARNING → fix if cheap else follow-up with `Trigger:`, OBSERVATION → record).

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS (after F1 fix; was FAIL — P3 `getMonths` contract drift) |
| Scope Discipline | PASS |
| Safety & Quality | WARNING (F3 caching posture, recorded) |
| Architecture | PASS |
| Pattern Consistency | PASS |
| Success Criteria | PASS |

## Suites (re-run in this step, after fixes)

Baseline (contract, `d2b8d49`): lint 0; astro check 0 errors (166 files); fixture:check OK; vitest 387 / 27 files;
build OK; pgTAP Files=6 Tests=119 PASS; smoke 195 PASS / 0 FAIL.

| Suite | Observed | Delta vs baseline |
| --- | --- | --- |
| `npm run lint` | 0 errors, 0 warnings | Δ0 |
| `npx astro check` | 0 errors, 0 warnings, 3 hints (174 files) | +8 files (`i18n.ts`, `locale.ts`, `LocaleSwitch.astro`, `en/*.ts`, 3 tests) |
| `npm run fixture:check` | ing OK, santander OK | Δ0 |
| `npm test` | 434 passed, 30 files | +47 (= 430 at p7 + 4 added here: 1 `getMonths` EN nominative, 3 `localeRedirectTarget` `//`-branch); +3 files |
| `npm run build` | Complete | — |
| `npx supabase db reset && npx supabase test db` | Files=6, Tests=119, PASS | Δ0 |
| smoke (port 4398) | 205 PASS / 0 FAIL, ends `locale switch returns to Polish` | +10 (P1 +1, P5 +2, P6 +7 — the plan's net) |
| `git diff main...HEAD --stat -- supabase/` | empty | no migration, as expected |

## Deliberate breaks (re-executed here)

1. **F1 test before fix**: the new case `getMonths("en").nominative[8] === "September"` ran red on the unfixed
   `getMonths` (`expected 'wrzesień' to be 'September'`), green after. Meta-check: proves the helper; the live
   render (demo account, `rytm-locale=en`) now reads "Your May in one calm view." vs PL "Twój maj w jednym spokojnym
   widoku." — the page reads only through `getMonths`.
2. **`localeRedirectTarget` `//` guard removed** (`|| target.startsWith("//")`): the two new same-origin cases
   (`/\evil.example`, `/a/..//evil.example`, both normalised to `//evil.example` by the URL parser) went red; the
   foreign-origin and userinfo cases stayed green (proved by the origin check, not this guard). Restored, `git diff`
   empty. Meta-check: before this step nothing covered the `//` branch — the old `//evil.example/` case is rejected by
   `new URL` throwing, not by the guard.

## Endpoint probes (dev server :4398)

- `POST /api/locale` with `Origin: https://evil.example` → 403 (Astro `checkOrigin`, same as other POSTs).
- `Referer: …/a%0d%0aSet-Cookie:x=1` → `Location: /a%0d%0aSet-Cookie:x=1` (stays percent-encoded, no header split);
  cookie `rytm-locale=en; Max-Age=31536000; Path=/; HttpOnly; SameSite=Lax` (signup pattern; `secure` on https).
- `POST /api/auth/delete` anonymous → 302 `/login`; signed-in with correct password and `confirm=delete` (lowercase) →
  302 `/settings?error=delete`, account intact (`/settings` 200). `user_id` comes only from `auth.uid()` in the RPC.

## EN completeness (dev :4398, `rytm-locale=en`)

Rendered `/`, `/how-it-works`, `/for-who`, `/login`, `/register`, `/reset`, `/reset/new`, `/confirm-email` (anon) and
`/home`, `/patterns`, `/fixed`, `/imports`, `/imports/new`, `/settings` (test user, empty; demo user, with data). Every
page `<html lang="en">`. Diacritic hits outside `<script>`/`<style>`: only `zł` amounts (`3,842.60 zł`, `45.50 zł`, …),
`ING Bank Śląski` (proper name) and `Język / Language` (bilingual title) — all allow-listed. A non-diacritic Polish
word scan (zapisz, anuluj, wyloguj, ustawienia, …) on visible text and `aria-label`/`title`/`placeholder`/`alt`: 0 hits.
PL default: `/`, `/login`, `/home`, `/settings` with no `Accept-Language` and with `Accept-Language: *` → `lang="pl"`,
Polish titles ("Zobacz swój rytm", "Przegląd miesiąca", "Twoje konto.").

## [reviewer] rows

| Row | Result |
| --- | --- |
| 1.7 | PASS — `i18n.ts` has no imports; `locals.locale` set synchronously in `onRequest` before `createClient` |
| 2.7 | PASS — no `pl-PL` default, no defaulted `locale` param, time zones (`Europe/Warsaw`, `UTC`) as on main, islands add only `locale` |
| 3.8 | PASS after F1 — `copyExtraPl` = main's `copyExtra` + `config`/`locale`/`landing`; months only via `getMonths`; `ImportWizard` props via `KitCopy`/`CopyExtra` |
| 4.8 | PASS — no invented key, placeholders grammatical; nits in F4/O-rows |
| 5.8 | PASS — `getCopy("en")` `toEqual({kitEn, extraEn})`; dialog + server use `auth-rules.ts`; `extraEn` Polish only in the allow-listed native names/title |
| 6.7 | PASS — `border-line`/`text-muted`/`border-ink`/`text-ink` + `focusRing` (`ring-ink/15`); plain POST form; `aria-pressed` on active; no open redirect (probed) |
| 7.7 | PASS after fixes — orphan `config.docs` removed, stale dialog comments fixed, K44 comment in both dictionaries; follow-ups carry `Trigger:` |

## Findings

### F1 — EN `/home` lead shows the Polish month nominative

- **Severity**: ❌ CRITICAL
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: src/content/copy.ts `getMonths`
- **Detail**: P3 contract: EN nominative = `Object.values` of EN `monthNames`. Code used `Object.keys` for every locale; EN keys are the Polish nominatives (`satisfies KitCopy`), so `home.astro` `leadFor` rendered "Your wrzesień in one calm view." Unit test checked only genitive/locative; smoke has no EN `/home` step; the p7 diacritic sweep was on source, not on a data-bearing EN render.
- **Fix**: `nominative: locale === "pl" ? Object.keys(monthNames) : Object.values(monthNames)` + unit case.
- **Decision**: FIXED — `1dbab76`

### F2 — Orphan leaf `copyExtra.config.docs` and stale comments

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence (P7 seam rule "no leaf without a reader")
- **Location**: src/content/copy.ts `copyExtraPl.config.docs`, src/content/en/extra.ts `extraEn.config.docs`, src/components/settings/DeleteAccountDialog.tsx `Props.confirmWord` doc + header comment, src/content/en/extra.ts `landing`
- **Detail**: `docsLabelKey` is required, so the old `?? "Dokumentacja"` fallback became dead and the leaf had no reader. Dialog comments named `confirmWordS[locale]` and "the `USUŃ` word". Register K44 says the comment sits on the leaf in both languages; EN lacked it.
- **Fix**: removed the leaf in both dictionaries; comments now name `DELETE_CONFIRM_WORDS[locale]` / `USUŃ` / `DELETE`; K44 comment added in `extraEn.landing`.
- **Decision**: FIXED — `1dbab76`

### F3 — Locale-varying HTML without `Vary` / `Cache-Control: private`

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Safety & Quality
- **Location**: src/middleware.ts `onRequest`
- **Detail**: The response now depends on the `rytm-locale` cookie and `Accept-Language`; no response sets `Vary`. No `Cache-Control`/`s-maxage`/prerendered page exists and Vercel does not edge-cache SSR responses, so nothing leaks today.
- **Fix**: set `Vary: Cookie, Accept-Language` (or `Cache-Control: private`) in the middleware when caching is introduced.
  - Strength: defence in depth for a future cache.
  - Tradeoff: touches every response; no observable benefit now.
  - Confidence: MED — depends on future hosting choices.
  - Blind spot: Vercel CDN defaults for function responses not re-verified against current docs.
- **Decision**: DEFERRED — `follow-ups/review-fixes.md` F2 with `Trigger:`

### F4 — ICU-driven hydration risk in EN islands

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/components/patterns/PatternsTable.tsx, src/components/imports/ImportWizard.tsx (`formatRangeLong`, `formatMoney`)
- **Detail**: Node 22 vs browser CLDR can differ for en-GB (e.g. `Sep`/`Sept`); worst case a text-hydration warning. Same class of risk existed for pl. Already the plan's known risk and the E2E follow-up trigger.
- **Fix**: watch in the visual gate (hydration warning in console) — existing follow-up "E2E setup" covers it.
- **Decision**: RECORDED — existing follow-up trigger

### O1 — `copyExtraPl` exported (plan: not exported)

- **Severity**: OBSERVATION · **Location**: src/content/copy.ts `copyExtraPl` · Only reader is `i18n-parity.test.ts` (handoff decision 20). **Decision**: ACCEPTED

### O2 — `z.enum(LOCALES as [string, ...string[]])` widens to `string`

- **Severity**: OBSERVATION · **Location**: src/pages/api/locale.ts `schema` · Validation correct; only the type is wide. **Decision**: ACCEPTED (handoff decision 26)

### O3 — EN imports store English default account names

- **Severity**: OBSERVATION · **Location**: `kitEn.importFlow.accountDefaultING`, `extraEn.imports.santanderAccountName` · **Decision**: follow-up F3

### O4 — EN "e-mail" vs "email"; `kitEn.mobileNav.fixed` = "Fixed" terse

- **Severity**: OBSERVATION · **Location**: src/content/en/kit.ts, src/content/en/extra.ts · **Decision**: follow-up F4 (row 7.10)

### O5 — Santander pattern names (`Bankomat`, `Wypłata BLIK`) stay Polish in EN

- **Severity**: OBSERVATION · **Location**: src/lib/patterns/santander-card.ts · Data by the plan's "What We're NOT Doing". **Decision**: ACCEPTED

MERGE: CLEAR — the one CRITICAL (EN month nominative) is fixed in 1dbab76 with a red-then-green unit case, all suites green (vitest +47, smoke +10, pgTAP Δ0), all [reviewer] rows pass; warnings recorded with triggers.
