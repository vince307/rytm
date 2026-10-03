# Handoff — `i18n-en` (slice S-16)

Written by the `/10x-impl-review i18n-en` step of run `2026-10-03-i18n-en`. Review done, one CRITICAL (EN `/home` lead showed the Polish month) fixed in `1dbab76`; `change.md` is `impl_reviewed`; `MERGE: CLEAR`. The one thing not to get wrong: the visual gate must check `/home` in EN **with data** (demo account or an imported fixture) — the empty state hides the month lead, which is how the bug slipped through.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/i18n-en`, cut from `main` at `b973428` |
| Commits | docs + p1 `ace542d` … p7 `ce7a1f0` + fix `1dbab76` + this docs commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `impl_reviewed` |
| `## Progress` rows remaining | 4 (`grep -c '^- \[ \]' plan.md`): `[visual]` 6.8, 7.8, 7.9; `[human]` 7.10 |
| Working tree | clean per `tree-clean.sh` after the commit (allow-listed `?? design/prompts/2026-10-03-gaps-round-4.md` untouched) |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `src/content/copy.ts` | `getMonths`: EN nominative from `Object.values`; `copyExtraPl.config.docs` removed (orphan) |
| `src/content/en/extra.ts` | `config.docs` removed; `DESIGN-GAP: K44` comment on `landing` |
| `src/components/settings/DeleteAccountDialog.tsx` | stale comments (`confirmWordS`, "the `USUŃ` word") corrected |
| `test/unit/i18n-parity.test.ts` | case `getMonths("en").nominative` |
| `test/unit/i18n.test.ts` | 3 `localeRedirectTarget` cases for the `//` guard and userinfo |
| `context/changes/i18n-en/reviews/impl-review.md` | review report, ends `MERGE: CLEAR — …` |
| `context/changes/i18n-en/follow-ups/review-fixes.md` | review section: F1 closed, F2-F4 open with `Trigger:` |
| `context/changes/i18n-en/plan.md`, `change.md`, `handoff.md` | `[reviewer]` rows 1.7-7.7 ticked; status; this file |

## 3. Verification

Baseline (contract, `d2b8d49`): lint 0; astro check 0 (166 files); fixture OK; vitest 387; build OK; pgTAP 6/119; smoke 195.

| Command | Result |
| --- | --- |
| `npm run lint` | 0 errors, 0 warnings |
| `npx astro check` | 0 errors (174 files, +8; 3 hints) |
| `npm run fixture:check` | ing OK, santander OK |
| `npm test` | 434 passed, 30 files (baseline 387, +47; +4 in this step) |
| `npm run build` | Complete |
| `npx supabase db reset && npx supabase test db` | Files=6, Tests=119, PASS (Δ0) |
| smoke on :4398 | 205 PASS / 0 FAIL (baseline 195, +10); last step `locale switch returns to Polish` |
| `git diff main...HEAD --stat -- supabase/` | empty (no migration) |
| EN render, 14 views with `rytm-locale=en` (test + demo user) | all `lang="en"`; diacritics only `zł`, `ING Bank Śląski`, `Język / Language`; 0 non-diacritic Polish words |
| PL default (no header, `Accept-Language: *`) on `/`, `/login`, `/home`, `/settings` | `lang="pl"`, Polish titles |
| Probes | `/api/locale` foreign Origin 403; CRLF referer stays encoded in `Location`; cookie HttpOnly/Lax/1y/Path=/; `/api/auth/delete` anon → `/login`, lowercase `delete` → `?error=delete`, account intact |
| Break 1: `getMonths` unfixed vs new EN-nominative case | red (`'wrzesień'` ≠ `'September'`), green after fix; live demo `/home` EN reads "Your May in one calm view." |
| Break 2: `localeRedirectTarget` without `startsWith("//")` | 2 new same-origin `//` cases red, restored (`git diff` empty). Meta-check: the old `//evil.example/` case was proved by `new URL` throwing, not the guard |

## 4. Next command

`visual gate (S-16 i18n-en: EN + PL views, switch in 3 places)`

## 5. Open

- Manual rows: `[visual]` 6.8, 7.8 (EN, incl. `/home` with data — check the month lead and console hydration warnings in `PatternsTable` / `ImportWizard`), 7.9 (PL with `rytm-locale=pl`); `[human]` 7.10.
- Follow-ups `context/changes/i18n-en/follow-ups/review-fixes.md`: F2 `Vary`/`Cache-Control` in `src/middleware.ts` `onRequest`; F3 EN default account names stored in DB; F4 "e-mail"/"email" spelling; plus the p7 items (PanelTitle, S-14 F7, E2E setup, EN copy replacement, K42-K44 to the kit author).
- DESIGN-GAPs: K42, K43, K44 (`design-kit.md`, `open · S-16`); comments now in both dictionaries for K44.
- Diacritic sweep misses diacritic-free Polish; this step's render scan of a word list found none.
- Roadmap row S-16 still `planning`; archive flips it. No migration. `checkOrigin` default.

## 6. Autonomous decisions

1. **F1 is CRITICAL, fixed here.** Rejected: WARNING + follow-up. Why: user-visible Polish in EN on the main view, an unmet P3 contract. Would change: nothing.
2. **Orphan `config.docs` removed rather than wired back as a fallback.** Rejected: restore `?? copyExtra.config.docs`. Why: `docsLabelKey` is required, a fallback would be dead code; plan P7 forbids leaves without a reader. Would change: an optional docs label in `ConfigStatus`.
3. **K44 comment added to `extraEn.landing`** to match the register row text "w obu językach". Would change: register row reworded instead.
4. **`Vary`/`private` deferred** (follow-up F2). Why: no cache anywhere, every SSR response uncached on Vercel. Would change: any cache header or prerendered page.
5. **Hydration risk recorded, not fixed** — existing E2E follow-up trigger covers it. Would change: a warning seen in the visual gate.
6. **All seven `[reviewer]` rows ticked** — 3.8 and 7.7 only after `1dbab76`. Would change: a reviewer reading the translation more strictly than "natural, grammatical" (row 7.10 is the human's).
7. **No subagent re-review after fixes**; I re-ran every suite instead. Would change: a fix touching more than copy/test files.
