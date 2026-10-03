# Handoff — `i18n-en` (slice S-16)

Written by the `/10x-plan i18n-en` step of run `2026-10-03-i18n-en`. `plan.md` (7 code phases, 56 Progress rows) and `plan-brief.md` are written; `change.md` is `planned`, roadmap S-16 `planning`. The one thing not to get wrong: the middleware keeps `locals.locale` pinned to `pl` and `getCopy("en")` returns PL until Phase 5 — PL must stay byte-identical at every phase boundary (smoke baseline steps unchanged).

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/i18n-en`, cut from `main` at `b973428` |
| Commits | 5 on the branch: `d2b8d49`, `7c5bf13`, `d0800ce`, `5859e7b` + this step's `docs(i18n-en): plan` |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `planned` (via `metadata-guard.mjs mark-planned`) |
| `## Progress` rows remaining | 56 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean per `tree-clean.sh` after the commit (allow-listed `?? design/prompts/2026-10-03-gaps-round-4.md` untouched) |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `context/changes/i18n-en/plan.md` | Full plan: 7 phases, success criteria as baseline + delta, deliberate breaks, `## Autonomous decisions` (17), `## Progress` |
| `context/changes/i18n-en/plan-brief.md` | Two-page brief |
| `context/changes/i18n-en/change.md` | Frontmatter `status: planned` |
| `context/foundation/roadmap.md` | S-16 At a glance row and `### S-16` Status → `planning` |
| `context/changes/i18n-en/handoff.md` | This file |

## 3. Verification

| Command | Result |
| --- | --- |
| `git branch --show-current` | `feat/i18n-en` |
| `metadata-guard.mjs mark-planned` | `{"changed":true}`; `status: planned` |
| Progress ↔ Success Criteria mapping | 1:1 per phase (P1 7, P2 7, P3 8, P4 8, P5 8, P6 8, P7 10 = 56) |
| lint / astro check / vitest / build / pgTAP / smoke | **not run** — docs-only step, no product code changed. Baseline inherited, unverified here: lint 0; astro check 0 (166 files); vitest 387 (27 files); pgTAP 119; smoke 195 PASS — Phase 1 measures it on the branch |

## 4. Next command

`/10x-plan-review i18n-en`

## 5. Open

- Phases: P1 locale plumbing (`src/lib/i18n.ts` `resolveLocale`); P2 `format.ts` required `locale`; P3 `getCopy` / `getMonths` in `src/content/copy.ts`, exports dropped; P4 `src/content/en/kit.ts` + `test/unit/i18n-parity.test.ts`; P5 `src/content/en/extra.ts`, middleware `resolveLocale`, `auth-rules.ts` `DELETE_CONFIRM_WORDS` / `isDeleteConfirmWord`; P6 `src/components/LocaleSwitch.astro`, `src/pages/api/locale.ts`, `i18n.ts` `localeRedirectTarget`, K42/K43 rows; P7 seam sweep + visual gate.
- Smoke: net + 10 (P1 + 1, P5 + 2, P6 + 7); EN steps last, last step switches back to `pl` (shared cookie jar in `scripts/smoke.mjs` `request`).
- Visual gates: PL shots need `rytm-locale=pl` from P5 on (a browser with `Accept-Language: en-*` gets EN).
- Manual-only rows (human checklist): `[reviewer]` 1.7, 2.7, 3.8, 4.8, 5.8, 6.7, 7.7; `[visual]` 6.8, 7.8 (EN matrix), 7.9 (PL); `[human]` 7.10 — accept own EN translation (K42), switch design K43 with bilingual „Język / Language” title, `USUŃ` or `DELETE`, `Accept-Language` first visit, parity test instead of compile error for array lengths/placeholders (departs from `design.md` success criterion), default Supabase e-mails; send K42–K43 to the kit author.
- DESIGN-GAPs to add: K42 (P4/P5), K43 (P6) in `context/foundation/design-kit.md`.
- Follow-ups: P6 closes `AuthLayout.astro` `visual.title` weight and `index.astro` steps head < 560 px; P7 writes `follow-ups/review-fixes.md` re-arming `PanelTitle` sweep, S-14 F7, E2E setup trigger, K42 replacement.
- Roadmap Backlog Handoff row for S-16 still names `/10x-research` as next step (status column is not there) — archive step updates the row.
- No migration.

## 6. Autonomous decisions

1. **Complexity HIGH, 0 questions asked.** Rejected: interview. Why: contract forbids AskUserQuestion; design + research decided everything with recommendations. Would change: an owner available.
2. **Seven phases, ≤ 1 new UI component each** (design had 5). Rejected: design's 5. Why: fresh agent per phase; P4 (~405 strings) is a phase on its own; formatting and copy channel split so each is independently green. Would change: phase cost much lower than expected.
3. **Locale pinned `pl` until P5.** Rejected: resolve from P1. Why: no mixed PL copy + EN numbers between phases. Would change: phases shipping separately.
4. **Drop `copy`/`copyExtra` value exports; `KitCopy = typeof content`; `CopyExtra = Widen<…>`; month helper `getMonths(locale)`.** Rejected: PL aliases, `DeepReadonly`, relaxing `KitCopy`. Why: compile gate for missed consumers; kit untouched. Would change: kit shipping EN data.
5. **Hero amount and banner strings into the dictionary; threshold input EN decimal in scope; delete word per locale with server accepting either (A4).** Why: success criterion „no Polish UI strings”, PL bytes unchanged. Would change: owner wanting one delete word or the PL hero via `formatMoney`.
6. **Bilingual „Język / Language” `/settings` title, visible `PL`/`EN`.** Rejected: translated title. Why: findable in any language, design's literal. Would change: visual gate showing it crowded at 400 px.
7. **One departure from `design.md`** (lengths/placeholders by test, not compiler) → `[human]` 7.10. **No departure from the PRD** (silent on languages).
