# Handoff — `i18n-en` (slice S-16)

Written by the `/10x-implement i18n-en phase 5` step of run `2026-10-03-i18n-en`. Phase 5 (EN extra dictionary, locale resolution live, delete word per locale) is committed `5374856`; `change.md` stays `implementing`. The one thing not to get wrong: English is now live for any visitor with `Accept-Language: en` and no cookie, but there is no switch or `/api/locale` until Phase 6, and the final smoke step must stay the P6 `locale=pl` return.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/i18n-en`, cut from `main` at `b973428` |
| Commits | docs commits + p1 `ace542d` + p2 `1def5ed` + p3 `3461cbc` + p4 `269b4df` + p5 `5374856` + handoff/SHA-stamp docs commits |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | 23 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean per `tree-clean.sh` after the handoff commit (allow-listed `?? design/prompts/2026-10-03-gaps-round-4.md` untouched) |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `src/content/en/extra.ts` | `extraEn` (`satisfies CopyExtra`), K42 header |
| `src/content/copy.ts` | `copyExtraPl` exported; `getCopy("en")` = `{ kitEn, extraEn }` |
| `src/middleware.ts` | `resolveLocale(cookie, Accept-Language)` live |
| `src/lib/auth-rules.ts` | `DELETE_CONFIRM_WORDS`, `isDeleteConfirmWord` |
| `src/pages/api/auth/delete.ts`, `src/pages/settings.astro`, `src/components/settings/DeleteAccountDialog.tsx` | shared word source; dialog `confirmWord` prop |
| `scripts/smoke.mjs` | `request()` takes `headers`; 2 EN steps appended last |
| `test/unit/i18n-parity.test.ts`, `test/unit/kit-contract.test.ts`, `test/unit/auth-rules.test.ts` | extra parity, getCopy/getMonths cases, per-locale delete word, helper cases |
| `context/changes/i18n-en/plan.md`, `handoff.md` | Progress 5.1-5.7 ticked with SHA; this file |

## 3. Verification

| Command | Result |
| --- | --- |
| `npm run lint` | 0 errors (baseline 0) |
| `npx astro check` | 0 errors (172 files; baseline 0) |
| `npm run fixture:check` | ing OK, santander OK |
| `npm test` | 425 passed, 30 files (baseline 416 / 29, +9 / +1) |
| `npm run build` | OK |
| `npx supabase db reset && npx supabase test db` | Files=6, Tests=119, PASS (Δ0) |
| `npm run smoke` (port 4398) | 198 PASS / 0 FAIL (baseline 196, +2) |
| Break 1: middleware locale pinned to `pl` | both Accept-Language smoke steps red; restored. Meta-check: proves resolution is read from the header (no cookie in jar), not just the dictionary |
| Break 2: `isDeleteConfirmWord` checks only `USUŃ` | "accepts either locale's word" red (DELETE case); restored. Meta-check: the PL case stayed green, so the red is exactly the EN word |
| Break 3: 2-entry `costForms` tuple in `extraEn` | `astro check` 2 errors (tuple length); restored |

## 4. Next command

`/10x-implement i18n-en phase 6`

## 5. Open

- Phases: P6 `LocaleSwitch.astro`, `src/pages/api/locale.ts` + `localeRedirectTarget` (P6 adds `"Język"` to `ALLOWED_PL_TOKENS` in `i18n-parity.test.ts`), 7 smoke steps ending with `locale=pl`; P7 sweep + visual gate.
- Manual-only rows still open: `[reviewer]` 1.7, 2.7, 3.8, 4.8, 5.8, 6.7, 7.7; `[visual]` 6.8, 7.8, 7.9; `[human]` 7.10.
- DESIGN-GAPs to register in `design-kit.md`: K42 (headers now in `en/kit.ts`, `en/extra.ts`, hero amount comment in `copy.ts`; register row P6/P7), K43 (P6). K41 is taken.
- Follow-ups: P6 closes `AuthLayout.astro` `visual.title` weight and `index.astro` steps head; P7 writes `follow-ups/review-fixes.md`.
- Composite smoke step "signed-in view follows Accept-Language": on red, rerun its three requests by hand.
- Caveats: `prettier --write src` rewrites `src/styles/brand.css`; macOS `sed -i` needs `''`; zsh word-splitting breaks `[...key]` paths.
- No migration.

## 6. Autonomous decisions


1. **Exec mode: implement in this context.** Rejected: subagent. Why: mechanical edits across ~25 files, regex-assisted. Would change: a phase needing design judgement.
2. **Commit message `feat(i18n-en): Locale-aware formatting (p2)` approved as drafted**, no prompt. Would change: an owner naming convention.
3. **Manual row 2.7 left unticked**: `[reviewer]`, not mine.
4. **EN `plural` mapping**: `one` → forms[0], `few` → forms[1], else forms[2] exactly per plan; EN dictionaries (P4) must carry `[one, other, other]`. Would change: a locale with other categories.
5. **EN date separator `/`** also applied to `formatRangeShort` (`01/05–28/05/2026`), plan only named `formatIsoDate`; consistent with `formatDate` output of `en-GB`. Would change: the owner wanting dots in EN ranges.
6. **`PatternsTable` render test** (`patterns-table.test.ts`) got `locale: "pl"` — not in the plan's file list but a required prop consequence (minor adaptation).
7. **Exec mode: implement in this context** (regex-assisted migration of 25 `.astro` files). Would change: a phase needing design judgement.
8. **Commit message `feat(i18n-en): Copy channel getCopy(locale) (p3)` approved as drafted.**
9. **`ConfigStatus` keeps typed `messageKey` / `docsLabelKey`** (literal keys into `copyExtra.config`) instead of a generic string key, so a missing key is a compile error. Would change: more config statuses with different messages.
10. **Hero amount DESIGN-GAP comment carries no K-number** (K41 is taken; K42 reserved for P4/P5 register row). Would change: the register row getting another number.
11. **`home.astro` genitive months still read `copyExtra.home.monthsGenitive`**; only nominative/locative moved to `getMonths` (the plan's listed reads). Would change: P5 wanting one source.
12. **Manual row 3.8 left unticked**: `[reviewer]`, not mine.
13. **Exec mode: implement in this context** (single data file + test). Would change: n/a.
14. **Commit message `feat(i18n-en): EN kit dictionary (p4)` approved as drafted.**
15. **Translation choices**: greeting "Hello, Ola." (no time-of-day, PL "Dzień dobry"), "over the limit" for "ponad próg", "limit" for "próg/granica", money examples `284.40 zł` / `1,920 zł`. Would change: the `[human]` row 7.10 reviewer wanting other wording.
16. **K42 register row not written in P4** (plan places the register in P7). Would change: owner wanting it at the first EN file.
17. **Manual row 4.8 left unticked**: `[reviewer]`, not mine.
18. **Exec mode: implement in this context** (one data file + wiring). Would change: n/a.
19. **Commit message `feat(i18n-en): EN extra dictionary, locale resolution live, delete word per locale (p5)` approved as drafted.**
20. **`copyExtraPl` now exported** from `copy.ts` (parity test needs it; plan said "copyExtraPl vs extraEn"). Would change: a test-only accessor preferred.
21. **`DELETE_CONFIRM_WORD` removed**, replaced by `DELETE_CONFIRM_WORDS` + `isDeleteConfirmWord`; the dialog gets a `confirmWord` prop. kit-contract now asserts all three `settings.*` strings carry the word per locale. Would change: owner wanting the PL constant kept.
22. **Smoke landing needle** is `>Rytm shows you that rhythm.<` (headline[1] rendered as its own node). Would change: landing markup change.
23. **`getMonths` unit case added** (closes the P3 gap). Manual row 5.8 left unticked: `[reviewer]`, not mine.
