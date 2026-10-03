# Handoff — `i18n-en` (slice S-16)

Written by the `/10x-implement i18n-en phase 7` step of run `2026-10-03-i18n-en`. Phase 7 (seam sweep, follow-ups, K44 register row) is committed `ce7a1f0`; `change.md` is `implemented`. The one thing not to get wrong: rows 7.8/7.9 screenshots were NOT captured here — the visual-gate step owns them, and PL shots need `rytm-locale=pl`.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/i18n-en`, cut from `main` at `b973428` |
| Commits | docs commits + p1 `ace542d` + p2 `1def5ed` + p3 `3461cbc` + p4 `269b4df` + p5 `5374856` + p6 `570cf20` + p7 `ce7a1f0` + handoff docs commits |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implemented` |
| `## Progress` rows remaining | 11 (`grep -c '^- \[ \]' plan.md`): all manual, see §5 |
| Working tree | clean per `tree-clean.sh` after the handoff commit (allow-listed `?? design/prompts/2026-10-03-gaps-round-4.md` untouched) |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `src/content/copy.ts` | hero amount comment now `DESIGN-GAP: K44` |
| `context/foundation/design-kit.md` | K44 row (landing mock-up amount literal) |
| `context/changes/i18n-en/follow-ups/review-fixes.md` | new: 2 closed, 5 open items each with `Trigger:` |
| `context/changes/i18n-en/plan.md`, `change.md`, `handoff.md` | Progress 7.1-7.6 ticked with SHA; status; this file |

## 3. Verification

| Command | Result |
| --- | --- |
| `npm run lint` | 0 errors, 0 warnings |
| `npx astro check` | 0 errors (3 hints, as before) |
| `npm run fixture:check` | ing OK, santander OK |
| `npm test` | 430 passed (baseline 430, +0), 30 files |
| `npm run build` | OK |
| `npx supabase db reset && npx supabase test db` | Files=6, Tests=119, PASS (Δ0) |
| `npm run smoke` (port 4398) | 205 PASS / 0 FAIL (baseline 205, +0; cumulative +10 over 195); last step `locale=pl` |
| `git diff main -- design/ src/styles/brand.css` | empty |
| Break: `<span>Zapisz</span>` then `<span>Usuń</span>` appended to `LocaleSwitch.astro` | diacritic grep: 0 hits for `Zapisz` (not caught), 1 hit for `Usuń` (caught); restored. Meta-check: the sweep catches diacritic words only; a diacritic-free Polish literal passes it |

## 4. Next command

`/10x-impl-review i18n-en`

## 5. Open

- Manual rows still open: `[reviewer]` 1.7, 2.7, 3.8, 4.8, 5.8, 6.7, 7.7; `[visual]` 6.8, 7.8, 7.9; `[human]` 7.10.
- The diacritic sweep misses Polish words without diacritics (e.g. `Zapisz`); the EN visual gate is the backstop.
- DESIGN-GAPs: K42, K43, K44 registered in `design-kit.md` (`open · S-16`); every `DESIGN-GAP` id in `src` has a row.
- Follow-ups: `context/changes/i18n-en/follow-ups/review-fixes.md` (PanelTitle sweep, S-14 F7, E2E setup, EN copy replacement, K42-K44 to the kit author).
- Visual gate watch: `LocaleSwitch` placements (`SiteFooter`, `AuthLayout` corner, `/settings` Panel) and bilingual title at 400 px (decision 13 trigger); a hydration warning in an EN `PatternsTable` becomes the E2E follow-up trigger.
- Roadmap row S-16 still `planning`; archive flips it.
- `checkOrigin` stays default (follow-up `2026-09-25-undo-import` F3).
- Caveats: `prettier --write src` rewrites `src/styles/brand.css`; prettier on `design-kit.md` realigns the whole table.
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
31. **Exec mode: implement in this context** (comment, register row, follow-ups file). Would change: n/a.
32. **Commit message `feat(i18n-en): Seam sweep, follow-ups and register (p7)` approved as drafted** (plan title is longer, includes the visual gate that is not this step's).
33. **Hero amount gap gets its own row K44**, not K42 (K42 is "kit has no EN copy"; the PL amount literal is a separate kit gap). Comment `DESIGN-GAP: K44` in `copy.ts` `copyExtra.landing`. Would change: the owner wanting it folded into K42.
34. **`design-kit.md` row inserted by hand, not prettier-formatted** (prettier realigns the whole table, 123-line diff). Would change: a repo-wide table reformat.
35. **Seam greps found no code change**: one `INTL_TAG`, one `LOCALE_COOKIE`, one `getMonths`, one `Widen`, no `DELETE_CONFIRM_WORD`/`lang="pl"` mention; "Phase N" comments are older slices' own phase numbers (S-05, S-10, S-11), not this slice's. Diacritic hits outside `src/content/` are data or comments: `format.ts` (`zł`, `wrześniu` PL-only branch), `auth-rules.ts` (`USUŃ`), `santander.ts` regex, a `[...key].astro` comment.
36. **Roadmap row S-16 left at `planning`**: archive owns the `done` flip; not touched. Would change: the orchestrator wanting `in-progress` mid-run.
37. **Rows 7.7 [reviewer], 7.8, 7.9 [visual], 7.10 [human] left unticked** (not mine). `change.md` set to `implemented` per the last-phase epilogue even with those open.

