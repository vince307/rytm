# Handoff — `i18n-en` (slice S-16)

Written by the `/10x-new i18n-en` step (refresh) of run `2026-10-03-i18n-en`. The change identity is fixed, S-16 is on the roadmap (`ready`), and every plan-time claim of `design.md` is checked against the repo in `change.md` § "Design claims vs repo now". The one thing not to get wrong: `content.json` `patternDetail.monthNames` has Polish nominatives as **keys**, so `satisfies KitCopy` cannot give EN English nominatives there — research must resolve it without editing the kit.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/i18n-en`, cut from `main` at `b973428` |
| Commits | 3 on the branch: `d2b8d49`, `7c5bf13` (owner, pre-run) + this step's `docs(i18n-en): change identity (autonomous run)` |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `new` |
| `## Progress` rows remaining | n/a — no `plan.md` yet |
| Working tree | clean per `.claude/skills/10x-autonomous-run/scripts/tree-clean.sh` after the commit (allow-listed `?? design/prompts/2026-10-03-gaps-round-4.md` untouched) |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `context/changes/i18n-en/change.md` | Identity refreshed: frontmatter + owner Notes kept verbatim; added slice/views/keys/migration (none), "Design claims vs repo now" table (15 rows), triggered follow-ups table, `## Autonomous decisions` (6) |
| `context/foundation/roadmap.md` | S-16 `i18n-en`: `## At a glance` row (`ready`), `### S-16` block (PRD refs: none — PRD silent on languages; prerequisites S-12…S-15), `## Backlog Handoff` row |
| `context/changes/i18n-en/handoff.md` | This file |

## 3. Verification

| Command | Result |
| --- | --- |
| `git branch --show-current` | `feat/i18n-en` |
| `grep -rln "@/content/copy" src \| wc -l` | 30 (27 value imports, 3 type-only: `Glyph.tsx`, `ImportWizard.tsx`, `lib/import/presentation.ts`) |
| `grep -rn 'client:' src` | 13 island sites, all get copy via props |
| `grep -oP '\bK\d+\b' context/foundation/design-kit.md` | highest K41, highest G39 → K42/K43 free |
| node walk of `content.json` | 28 top-level keys, 405 string leaves, 14 placeholders; non-ASCII keys only in `patternDetail.monthNames` |
| `grep` Polish literals in `src/pages/api/**` | none user-visible (codes only); exceptions outside API listed in change.md (`DELETE_CONFIRM_WORD`, `config-status.ts`, `index.astro` hero amount) |
| lint / astro check / vitest / build / pgTAP / smoke | **not run** — docs-only step, no code changed. Baseline (inherited, unverified here): lint 0 errors; astro check 0 errors (166 files); vitest 387 passed (27 files); pgTAP 119; smoke 195 PASS |

## 4. Next command

`/10x-research i18n-en`

## 5. Open

- Research questions (from change.md corrections): (a) EN month nominatives vs `patternDetail.monthNames` Polish keys under `satisfies KitCopy` — read sites `home.astro` (`Object.keys`), `fixed.astro`, `patterns/[...key].astro` (`Object.values`); (b) `fillMonthLocative` (`src/lib/format.ts`) EN path; (c) client-side formatting in `ImportWizard.tsx` and `PatternsTable.tsx` (need a `locale` prop); (d) `formatIsoDate`/`formatRangeShort` string-split formats for `en-GB`; (e) full map of 405 kit leaves + `copyExtra` to EN, placeholders preserved; (f) `DELETE_CONFIRM_WORD` per locale (decision A4); (g) smoke steps for the switch.
- Visual gates from now on: a browser sending `Accept-Language: en-*` gets EN on first visit — PL shots need `rytm-locale=pl`.
- DESIGN-GAPs to add during implementation: K42 (kit has no EN copy), K43 (kit has no language switcher) in `context/foundation/design-kit.md`.
- Triggered follow-ups in scope: `AuthLayout.astro` visual title weight (S-15 Open); `index.astro` steps head stacking < 560 px (S-12 F3); month templates through `fillMonthLocative` (F-04); `copyExtra` additions reviewed against `content.json` (S-15 Open). Deferred (re-armed): `PanelTitle` sweep in `settings.astro`/`patterns/[...key].astro`; S-14 F7 `fieldBox` in `FormField.tsx`/`DeleteAccountDialog.tsx`. Sources: `context/archive/2026-10-03-kit-round-3-home-fixed/follow-ups/review-fixes.md`, `context/archive/2026-10-03-kit-round-3-auth-settings/follow-ups/review-fixes.md`, `context/archive/2026-10-03-kit-round-3-patterns/follow-ups/review-fixes.md`, `context/archive/2026-10-02-kit-round-3-intake/follow-ups/review-fixes.md`.
- No migration expected.

## 6. Autonomous decisions

1. **Refresh in place** — kept frontmatter and owner Notes, appended sections. Rejected: skill create path (would error on existing folder). Why: folder pre-existed by owner. Would change: nothing.
2. **S-16 outside any milestone, `ready`** — rejected reopening M-3 / opening M-4. Why: owner decision names only the three roadmap rows; prerequisites all `done`. Would change: owner wanting a language milestone → `/10x-roadmap` opens M-4.
3. **Next = `/10x-research`, not `/10x-plan`** — why: `monthNames` key conflict, 13 `format.ts` consumers incl. client-side, 405-leaf EN map need source-backed mapping. Would change: nothing at this point.
4. **`USUŃ` word (A4)** — UI shows locale word (EN `DELETE`), server accepts either. Rejected: `USUŃ` in EN; server checks only request locale. Why: untypeable `Ń`, cookie switch race. Would change: word found in a DB/RPC check, or owner wanting one word.
5. **No Playwright setup (A5)** — unit + smoke + EN visual gate instead. Why: design conditions E2E on an existing config; none exists. Would change: a browser-only risk found in research → follow-up for `/10x-e2e-setup`.
6. **`config-status.ts` banner translated** — cheap, meets "no Polish UI". Would change: plan showing it never renders outside local dev.
