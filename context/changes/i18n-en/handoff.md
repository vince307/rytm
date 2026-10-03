# Handoff — `i18n-en` (slice S-16)

Written by the `/10x-implement i18n-en phase 1` step of run `2026-10-03-i18n-en`. Phase 1 (locale plumbing) is committed `ace542d`; `change.md` is `implementing`. The one thing not to get wrong (unchanged): the middleware keeps `locals.locale` pinned to `pl` and `getCopy("en")` returns PL until Phase 5 — PL must stay byte-identical at every phase boundary.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/i18n-en`, cut from `main` at `b973428` |
| Commits | 7 on the branch: the 6 docs commits + `ace542d` (`feat(i18n-en): Locale plumbing (p1)`) + this handoff commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | 50 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean per `tree-clean.sh` after the commit (allow-listed `?? design/prompts/2026-10-03-gaps-round-4.md` untouched) |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `src/lib/i18n.ts` | New: `Locale`, `LOCALES`, `DEFAULT_LOCALE`, `LOCALE_COOKIE`, `INTL_TAG`, `isLocale`, `resolveLocale` (pure, no copy/Astro import) |
| `test/unit/i18n.test.ts` | New: 8 table-driven `resolveLocale` cases |
| `src/env.d.ts` | `App.Locals.locale` |
| `src/middleware.ts` | `onRequest` sets `locals.locale = DEFAULT_LOCALE` first, before `createClient` |
| `src/layouts/Layout.astro` | `<html lang={Astro.locals.locale}>` |
| `scripts/smoke.mjs` | New step „landing declares the page language” |
| `context/changes/i18n-en/plan.md`, `change.md`, `handoff.md` | Progress 1.1–1.6 ticked with SHA; status; this file |

## 3. Verification

| Command | Result |
| --- | --- |
| `npm run lint` | 0 errors (baseline 0) |
| `npx astro check` | 0 errors (baseline 0) |
| `npm run fixture:check` | ing OK, santander OK |
| `npm test` | 395 passed, 28 files (baseline 387 / 27, +8 / +1) |
| `npm run build` | OK |
| `npx supabase db reset && npx supabase test db` | Files=6, Tests=119, PASS (Δ0) |
| `npm run smoke` (port 4398) | 196 PASS / 0 FAIL (baseline 195, +1) |
| Break 1: `resolveLocale` ignores the cookie | 2 cases red (cookie `en`; cookie `pl` + `en-US`), 393 green; restored. Meta-check: the first attempt used BSD `sed` that did not apply and stayed green — redone with python, red as expected |
| Break 2: `locals.locale = "en"` in the middleware | smoke „landing declares the page language” FAIL, all else green; restored. Meta-check: proves Layout reads `locals`, not the resolution rule (the unit test's job) |

## 4. Next command

`/10x-implement i18n-en phase 2`

## 5. Open

- Phases: P2 `format.ts` required `locale` + `INTL_TAG`; P3 `getCopy` / `getMonths` in `src/content/copy.ts`; P4 `src/content/en/kit.ts` + `test/unit/i18n-parity.test.ts`; P5 `src/content/en/extra.ts`, middleware `resolveLocale`, `auth-rules.ts` `DELETE_CONFIRM_WORDS`; P6 `LocaleSwitch.astro`, `src/pages/api/locale.ts`; P7 sweep + visual gate.
- Manual-only rows still open: `[reviewer]` 1.7 (i18n.ts pure — it is; middleware adds no await before Supabase — it does not), 2.7, 3.8, 4.8, 5.8, 6.7, 7.7; `[visual]` 6.8, 7.8, 7.9; `[human]` 7.10.
- DESIGN-GAPs to add: K42 (P4/P5), K43 (P6) in `context/foundation/design-kit.md`.
- Follow-ups: P6 closes `AuthLayout.astro` `visual.title` weight and `index.astro` steps head; P7 writes `follow-ups/review-fixes.md`.
- Smoke now 196; P2 Δ0 per plan wording of that phase's cumulative count.
- No migration.

## 6. Autonomous decisions

1. **Exec mode: implement in this context.** Rejected: delegating to a subagent. Why: the phase is ~6 small files. Would change: a phase touching dozens of files.
2. **Commit message `feat(i18n-en): Locale plumbing (p1)` approved as drafted**, no prompt. Would change: an owner naming convention.
3. **Manual row 1.7 left unticked** though I observed both facts; it is `[reviewer]`, not mine.
4. **Table-driven test (`it.each`)** instead of 8 shorthand `it`s: lint rule `no-confusing-void-expression` forbids the shorthand. Would change: the rule being relaxed.
5. **Roadmap sync skipped**: S-16 has no roadmap row yet (owner decision in change.md Notes).
