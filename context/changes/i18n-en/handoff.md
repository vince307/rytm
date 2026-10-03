# Handoff — `i18n-en` (slice S-16)

Written by the `/10x-implement i18n-en phase 4` step of run `2026-10-03-i18n-en`. Phase 4 (EN kit dictionary + parity test) is committed `269b4df`; `change.md` stays `implementing`. The one thing not to get wrong: `kitEn` is imported only by the parity test — `getCopy("en")` still returns PL and the middleware still pins `pl` until Phase 5.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/i18n-en`, cut from `main` at `b973428` |
| Commits | docs commits + p1 `ace542d` + p2 `1def5ed` + p3 `3461cbc` + p4 `269b4df` + handoff/SHA-stamp docs commits |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | 30 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean per `tree-clean.sh` after the handoff commit (allow-listed `?? design/prompts/2026-10-03-gaps-round-4.md` untouched) |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `src/content/en/kit.ts` | `kitEn` (`satisfies KitCopy`), K42 DESIGN-GAP header; all 28 top-level keys, placeholders kept, `[one, other, other]` forms, `monthNames` = PL keys to English values, `DELETE` in the three `USUŃ` leaves, money `284.40 zł` / `1,920 zł` |
| `test/unit/i18n-parity.test.ts` | 8 cases: leaf-path set, array lengths, placeholders, numerics, diacritics (allow-list `ALLOWED_PL_TOKENS` = `zł`, `ING Bank Śląski`), 12 months, DELETE, forms tuples |
| `context/changes/i18n-en/plan.md`, `handoff.md` | Progress 4.1-4.7 ticked with SHA; this file |

## 3. Verification

| Command | Result |
| --- | --- |
| `npm run lint` | 0 errors (baseline 0) |
| `npx astro check` | 0 errors (170 files; baseline 0) |
| `npm run fixture:check` | ing OK, santander OK |
| `npm test` | 416 passed, 29 files (baseline 408 / 28, +8 / +1) |
| `npm run build` | OK |
| `npx supabase db reset && npx supabase test db` | Files=6, Tests=119, PASS (Δ0) |
| `npm run smoke` (port 4398) | "All smoke steps passed" (count not tallied; no smoke change in P4, baseline 196 / Δ0 expected) |
| Break 1: dropped `{month}` from `dashboard.description` | placeholder case red; restored |
| Break 2: `importFlow.steps` shortened to 2 | leaf-path and array-length cases red, `astro check` stayed 0 errors; restored. Meta-check: the test, not the type, guards array lengths (as the plan states) |
| Break 3: `ł` in `settings.title` | diacritics case red; restored |

## 4. Next command

`/10x-implement i18n-en phase 5`

## 5. Open

- Phases: P5 `src/content/en/extra.ts` (`satisfies CopyExtra`, K42 header), `getCopy("en")` returns EN, middleware `resolveLocale` live, `auth-rules.ts` `DELETE_CONFIRM_WORDS`, parity test extended to `copyExtra`, EN smoke steps last + final `locale=pl` step; P6 `LocaleSwitch.astro`, `src/pages/api/locale.ts` (P6 adds `"Język"` to `ALLOWED_PL_TOKENS`); P7 sweep + visual gate.
- Manual-only rows still open: `[reviewer]` 1.7, 2.7, 3.8, 4.8, 5.8, 6.7, 7.7; `[visual]` 6.8, 7.8, 7.9; `[human]` 7.10.
- DESIGN-GAPs to register in `design-kit.md`: K42 (header comments now in `en/kit.ts`; register row P5/P7, incl. the landing hero amount comment in `copy.ts`), K43 (P6). K41 is taken.
- Follow-ups: P6 closes `AuthLayout.astro` `visual.title` weight and `index.astro` steps head; P7 writes `follow-ups/review-fixes.md`.
- Break 1 of P3 gap (`getMonths` only guarded by smoke) still open: add a `getMonths` unit case in P5 if cheap.
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
