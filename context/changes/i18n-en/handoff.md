# Handoff — `i18n-en` (slice S-16)

Written by the `/10x-plan-review i18n-en` step of run `2026-10-03-i18n-en`. Verdict PROCEED: the plan holds against the code; 1 critical + 2 warnings were fixed in `plan.md` (no phase added/split, 56 Progress rows unchanged); `change.md` is `plan_reviewed`. The one thing not to get wrong (unchanged): the middleware keeps `locals.locale` pinned to `pl` and `getCopy("en")` returns PL until Phase 5 — PL must stay byte-identical at every phase boundary.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/i18n-en`, cut from `main` at `b973428` |
| Commits | 6 on the branch: `d2b8d49`, `7c5bf13`, `d0800ce`, `5859e7b`, `274da7c` + this step's `docs(i18n-en): plan review` |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` |
| `## Progress` rows remaining | 56 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean per `tree-clean.sh` after the commit (allow-listed `?? design/prompts/2026-10-03-gaps-round-4.md` untouched) |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `context/changes/i18n-en/reviews/plan-review.md` | Review report: 6 findings (F1 critical, F2–F3 warnings, F4–F6 observations), triage decisions, `VERDICT: PROCEED` |
| `context/changes/i18n-en/plan.md` | Edited: P4 parity `ALLOWED_PL_TOKENS` + `USUŃ`→`DELETE` rule; P5 composite signed-in smoke step; P5 kit-contract covers 3 `USUŃ` keys; P6 adds `"Język"` to the allow-list; P3 widened import grep; 2 Known risks |
| `context/changes/i18n-en/change.md` | Frontmatter `status: plan_reviewed` |
| `context/changes/i18n-en/handoff.md` | This file |

## 3. Verification

| Command | Result |
| --- | --- |
| `git branch --show-current` | `feat/i18n-en` |
| `ls` of 15 plan paths; greps for `DELETE_CONFIRM_WORD`, `<html lang`, `monthNames` reads, `@/lib/format` importers, island mounts, `pl-PL`/`Intl` outside `format.ts` | all match the plan |
| node walk of `content.json` for `Śląski` | `importFlow.supported`, `importErrors.unknownFormat`, `imports.bankName.ing` (→ F1) |
| `scripts/smoke.mjs` `steps` tail | last step „signout seeded user” (→ F2) |
| widened P3 import grep on today's tree | 31 hits (all import forms incl. `import type { copy }`), must be 0 after P3 |
| `wc -c content.json` / `copy.ts` | 20 910 / 9 616 bytes — P4 fits one fresh agent |
| Progress ↔ Success Criteria | 1:1, 56 rows |
| lint / astro check / vitest / build / pgTAP / smoke | **not run** — docs-only step. Baseline inherited, unverified: lint 0; astro check 0 (166 files); vitest 387 (27 files); pgTAP 119; smoke 195 PASS — Phase 1 measures it on the branch |

## 4. Next command

`/10x-implement i18n-en phase 1`

## 5. Open

- Phases: P1 `src/lib/i18n.ts` `resolveLocale` + `locals.locale` pinned; P2 `format.ts` required `locale`; P3 `getCopy` / `getMonths` in `src/content/copy.ts`; P4 `src/content/en/kit.ts` + `test/unit/i18n-parity.test.ts` (`ALLOWED_PL_TOKENS`); P5 `src/content/en/extra.ts`, middleware `resolveLocale`, `auth-rules.ts` `DELETE_CONFIRM_WORDS` / `isDeleteConfirmWord`; P6 `LocaleSwitch.astro`, `src/pages/api/locale.ts`, `i18n.ts` `localeRedirectTarget`, K42/K43 rows; P7 seam sweep + visual gate.
- Smoke: net + 10 (P1 + 1, P5 + 2 incl. one composite sign-in → `/settings` → sign-out step, P6 + 7); EN steps last, last step switches back to `pl`.
- Visual gates: PL shots need `rytm-locale=pl` from P5 on.
- Manual-only rows (human checklist): `[reviewer]` 1.7, 2.7, 3.8, 4.8, 5.8, 6.7, 7.7; `[visual]` 6.8, 7.8, 7.9; `[human]` 7.10 — accept own EN translation (K42), switch design K43 with „Język / Language” title, `USUŃ` or `DELETE`, `Accept-Language` first visit, parity test instead of compile error for lengths/placeholders, default Supabase e-mails; send K42–K43 to the kit author.
- DESIGN-GAPs to add: K42 (P4/P5), K43 (P6) in `context/foundation/design-kit.md`.
- Follow-ups: P6 closes `AuthLayout.astro` `visual.title` weight and `index.astro` steps head < 560 px; P7 writes `follow-ups/review-fixes.md` re-arming `PanelTitle` sweep, S-14 F7, E2E setup trigger, K42 replacement.
- Roadmap Backlog Handoff row for S-16 still names `/10x-research` — archive step updates it.
- No migration.

## 6. Autonomous decisions

1. **Triage by this step, no questions.** Chosen: apply the single obvious fix for F1–F4. Rejected: leaving them as Known risks. Why: each was one-line with no trade-off. Would change: a fix with a real trade-off.
2. **Diacritics allow-list = exact tokens** (`zł`, `ING Bank Śląski`, P6 `Język`). Rejected: dropping the diacritics case, or excluding whole keys. Why: the bank name is a proper noun in 3 kit leaves; exact tokens keep the case able to catch real Polish. Would change: the kit adding more Polish proper nouns (extend the list, never by key).
3. **Composite smoke step for the signed-in EN view.** Rejected: separate sign-in/sign-out steps. Why: the run ends signed out and P6's `GET /login` needs a signed-out jar; composite keeps all cumulative counts. Would change: the runner gaining sub-assertions.
4. **Direct greps instead of the skill's verification sub-agent.** Why: every risky claim was a single grep / node walk. Would change: a claim needing a cross-module trace.
5. **No product decision overturned.** PRD silent on languages; all owner-design choices are in `[human]` 7.10. Would change: an owner objection.
