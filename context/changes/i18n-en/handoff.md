# Handoff — `i18n-en` (slice S-16)

Written by the `/10x-implement i18n-en phase 6` step of run `2026-10-03-i18n-en`. Phase 6 (language switch, `/api/locale`, K42/K43 register rows, two layout follow-ups) is committed `570cf20`; `change.md` stays `implementing`. The one thing not to get wrong: P7 must not leave Polish leaks in EN and the final smoke step must stay the `locale=pl` return.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/i18n-en`, cut from `main` at `b973428` |
| Commits | docs commits + p1 `ace542d` + p2 `1def5ed` + p3 `3461cbc` + p4 `269b4df` + p5 `5374856` + p6 `570cf20` + handoff docs commits |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | 17 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean per `tree-clean.sh` after the handoff commit (allow-listed `?? design/prompts/2026-10-03-gaps-round-4.md` untouched) |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `src/pages/api/locale.ts` | public `POST`, zod `z.enum(LOCALES)` → 400, cookie flags as signup, 303 to `localeRedirectTarget` |
| `src/lib/i18n.ts` | `localeRedirectTarget(referer, origin)` |
| `src/components/LocaleSwitch.astro` | no-JS form, `PL`/`EN` buttons, `aria-pressed`, `DESIGN-GAP: K43` |
| `src/components/marketing/SiteFooter.astro`, `src/layouts/AuthLayout.astro`, `src/pages/settings.astro` | switch placements; AuthLayout `visual.title` now `font-bold` |
| `src/pages/index.astro` | steps section head stacks below 560 px |
| `src/content/copy.ts`, `src/content/en/extra.ts` | `copyExtra.locale` in both dictionaries |
| `context/foundation/design-kit.md` | K42, K43 rows |
| `scripts/smoke.mjs` | 7 switch steps appended, last = `locale=pl` |
| `test/unit/i18n.test.ts`, `test/unit/i18n-parity.test.ts` | 5 `localeRedirectTarget` cases; `"Język"` allowed token |
| `context/changes/i18n-en/plan.md`, `handoff.md` | Progress 6.1-6.6 ticked with SHA; this file |

## 3. Verification

| Command | Result |
| --- | --- |
| `npm run lint` | 0 errors, 0 warnings (baseline 0) |
| `npx astro check` | 0 errors |
| `npm run fixture:check` | ing OK, santander OK |
| `npm test` | 430 passed (baseline 425, +5), 30 files |
| `npm run build` | OK |
| `npx supabase db reset && npx supabase test db` | Files=6, Tests=119, PASS (Δ0) |
| `npm run smoke` (port 4398) | 205 PASS / 0 FAIL (baseline 198, +7) |
| Break 1: `localeRedirectTarget` returns the referer for a foreign origin | unit case "foreign origin" red (12 other cases green) and smoke "ignores a foreign referer" red (303 to `https://example.com/x`); restored. Meta-check: only the foreign-origin case failed, so the red is the origin guard, not the parser |
| Break 2: `z.enum(LOCALES)` replaced by `z.string()` | smoke "rejects an unknown value" red (303, not 400), all else green; restored. Meta-check: the cookie value `xx` would still resolve to `pl`, so the status is the only observable proof |

## 4. Next command

`/10x-implement i18n-en phase 7`

## 5. Open

- Phases: P7 seam sweep, `follow-ups/review-fixes.md`, visual gate in both locales (PL shots need `rytm-locale=pl`); P7 notes `AuthLayout` title weight and landing steps head as closed (done here in P6).
- Manual-only rows still open: `[reviewer]` 1.7, 2.7, 3.8, 4.8, 5.8, 6.7, 7.7; `[visual]` 6.8, 7.8, 7.9; `[human]` 7.10.
- DESIGN-GAPs: K42 and K43 registered in `design-kit.md` (status `open · S-16`); comments in `en/kit.ts`, `en/extra.ts`, `copy.ts` (`copyExtra.locale`), `LocaleSwitch.astro`.
- Switch looks unverified visually (`LocaleSwitch` in the `SiteFooter` span, absolute top-right corner of `AuthLayout` main, `/settings` panel before the danger zone): row 6.8 and the P7 gate own it; the bilingual title crowding at 400 px is the decision-13 trigger.
- `checkOrigin` stays default (follow-up `2026-09-25-undo-import` F3).
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
24. **Exec mode: implement in this context** (small component, endpoint, wiring). Would change: n/a.
25. **Commit message `feat(i18n-en): Language switch and /api/locale (p6)` approved as drafted.**
26. **`z.enum(LOCALES as [string, ...string[]])`** because `LOCALES` is typed `readonly Locale[]`, not a tuple. Would change: `LOCALES` becoming a tuple.
27. **`LocaleSwitch` uses `class:list={cn(...)}`** (lint rule `astro/prefer-class-list-directive` rejects `class={cn()}`); the `cn()` merge is kept. Would change: the rule being relaxed.
28. **Footer / auth / settings placement details** (switch inside the right footer span with `ml-[18px]`; auth corner `absolute top-4 right-4` on a `relative` main; settings Panel with title left, switch right) are my layout choice within the plan's placements, to be judged by row 6.8. Would change: the visual gate.
29. **Landing steps head**: `max-[559px]:flex-col items-start gap-2` on the flex row (the plan said "stacks below 560 px"). Would change: the visual gate showing a gap mismatch with the kit.
30. **Rows 6.7 and 6.8 left unticked**: `[reviewer]` / `[visual]`, not mine.

