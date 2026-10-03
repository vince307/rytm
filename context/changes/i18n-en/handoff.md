# Handoff — `i18n-en` (slice S-16)

Written by the `/10x-implement i18n-en phase 3` step of run `2026-10-03-i18n-en`. Phase 3 (copy channel `getCopy(locale)`) is committed `3461cbc`; `change.md` stays `implementing`. The one thing not to get wrong (unchanged): the middleware keeps `locals.locale` pinned to `pl` and `getCopy("en")` returns PL until Phase 5 — PL must stay byte-identical at every phase boundary.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/i18n-en`, cut from `main` at `b973428` |
| Commits | the 6 docs commits + p1 `ace542d` + p2 `1def5ed` + p3 `3461cbc` + handoff/SHA-stamp docs commits |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | 37 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean per `tree-clean.sh` after the commit (allow-listed `?? design/prompts/2026-10-03-gaps-round-4.md` untouched) |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `src/content/copy.ts` | `KitCopy`, `Widen`, `CopyExtra`, non-exported `copyExtraPl` (+ new `config` and `landing.heroAmount` leaves), `getCopy(locale)` (EN = PL pair until P5), `getMonths(locale)`; no `copy` / `copyExtra` value exports |
| 25 `.astro` files (pages, layouts, `Brand`, nav, footer/header, `ExcludedPatterns`, `RestoreForm`) | `const { copy, copyExtra } = getCopy(Astro.locals.locale)` |
| `src/pages/{home,fixed,patterns/[...key]}.astro` | months via `getMonths(locale)` |
| `src/lib/config-status.ts`, `src/layouts/Layout.astro`, `src/pages/index.astro` | banner strings and hero amount from `copyExtra` (`ConfigStatus` carries `messageKey` / `docsLabelKey`) |
| `src/components/imports/ImportWizard.tsx`, `src/lib/import/presentation.ts` | props typed `KitCopy[...]` / `CopyExtra[...]` |
| `test/unit/{kit-contract,sequence-label,import-presentation,patterns-table}.test.ts` | `getCopy("pl")` |
| `context/changes/i18n-en/plan.md`, `handoff.md` | Progress 3.1-3.7 ticked with SHA; this file |

## 3. Verification

| Command | Result |
| --- | --- |
| `npm run lint` | 0 errors (baseline 0) |
| `npx astro check` | 0 errors (baseline 0; 168 files incl. context/design js) |
| `npm run fixture:check` | ing OK, santander OK |
| `npm test` | 408 passed, 28 files (baseline 408 / 28, Δ0) |
| greps (value exports/imports, `monthNames)` in pages, `Uwaga`/`Dokumentacja`/`842,60` outside `src/content`) | all empty |
| `npm run build` | OK |
| `npx supabase db reset && npx supabase test db` | Files=6, Tests=119, PASS (Δ0) |
| `npm run smoke` (port 4398) | 196 PASS / 0 FAIL (baseline 196, Δ0) |
| Break 1: `getMonths.nominative` from `Object.values` | smoke "home lead names the reference month" red, unit suite not red; restored. Meta-check: only the live page read is guarded (kit-contract pins `Object.keys` on the raw kit, not `getMonths`) — P4 parity test or a `getMonths` unit case would close it |
| Break 2: `import { copy }` re-added in `Brand.astro` | `astro check` 1 error (ts2305); restored. Proves the value export is gone |

## 4. Next command

`/10x-implement i18n-en phase 4`

## 5. Open

- Phases: P4 `src/content/en/kit.ts` + `test/unit/i18n-parity.test.ts` (consider adding a `getMonths` unit case there); P5 `src/content/en/extra.ts`, middleware `resolveLocale`, `auth-rules.ts` `DELETE_CONFIRM_WORDS`; P6 `LocaleSwitch.astro`, `src/pages/api/locale.ts`; P7 sweep + visual gate.
- Manual-only rows still open: `[reviewer]` 1.7, 2.7, 3.8, 4.8, 5.8, 6.7, 7.7; `[visual]` 6.8, 7.8, 7.9; `[human]` 7.10.
- DESIGN-GAPs to register in `design-kit.md`: K42 (P4/P5, incl. the landing hero amount comment in `copy.ts` which names "register row with K42"), K43 (P6). K41 is already taken by round 4.
- Follow-ups: P6 closes `AuthLayout.astro` `visual.title` weight and `index.astro` steps head; P7 writes `follow-ups/review-fixes.md`.
- Caveats: `prettier --write src` rewrites `src/styles/brand.css`; macOS `sed -i` needs `''`, use python for edits; zsh word-splitting breaks `[...key]` paths (use `-z | xargs -0`).
- Smoke stays 196 until P5 adds EN steps. No migration.

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
