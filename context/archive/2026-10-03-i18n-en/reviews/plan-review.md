<!-- PLAN-REVIEW-REPORT -->
# Plan Review: English locale and language switch (S-16)

- **Plan**: context/changes/i18n-en/plan.md
- **Mode**: Deep (codebase verified by direct greps in this session; no sub-agent — see Autonomous decisions)
- **Date**: 2026-10-03
- **Verdict**: SOUND after triage (REVISE before: 1 critical, 2 warnings — all fixed in plan.md)
- **Findings**: 1 critical, 2 warnings, 3 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| End-State Alignment | PASS |
| Lean Execution | PASS |
| Architectural Fitness | PASS |
| Blind Spots | WARNING (F2, F3 — fixed) |
| Plan Completeness | FAIL → PASS after F1 fix |

## Grounding

15/15 paths ✓ (`src/lib/format.ts`, `src/middleware.ts`, `src/env.d.ts`, `src/layouts/{Layout,AuthLayout}.astro`,
`SiteFooter.astro`, `config-status.ts`, `auth-rules.ts`, `api/auth/delete.ts`, `DeleteAccountDialog.tsx`,
`threshold-form.ts`, `sequence-label.ts`, `fixed-view.ts`, `kit-contract.test.ts`, `scripts/smoke.mjs`);
symbols ✓ (`DELETE_CONFIRM_WORD` in 4 src files + 1 test, `missingConfigs`, `<html lang="pl">` only in `Layout.astro`,
`Object.keys/values(…monthNames)` in exactly `home.astro` / `fixed.astro` / `patterns/[...key].astro`, `@/lib/format`
importers = the plan's list + `presentation.ts` (locale-free) + `format.test.ts`, island mounts `patterns.astro`
`PatternsTable`, `patterns/[...key].astro` `ThresholdEditor`, `imports/new.astro` `ImportWizard`; no other `pl-PL` /
`Intl` / `toLocale*` outside `format.ts` except `merchant.ts` normalisation); brief↔plan ✓ (7 phases, same decisions).
Progress↔Phase ✓: one `## Progress`, 7/7 phase headings, 56 rows map 1:1 to success-criteria bullets, no checkboxes in
phase bodies.

## Findings

### F1 — Parity diacritics rule rejects a correct translation

- **Severity**: ❌ CRITICAL
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 4 §2 Parity test (and Phase 6 §2 bilingual title)
- **Detail**: The rule „no EN string matches `/[ąćęłńóśźż…]/` after removing `zł`” cannot pass with a faithful
  translation: kit leaves `importFlow.supported`, `importErrors.unknownFormat` and `imports.bankName.ing` carry the
  proper name `ING Bank Śląski` (node walk of `content.json`), and P6's identical-in-both `locale.sectionTitle`
  „Język / Language” contains `ę`. The P4 agent would either transliterate the bank name (wrong) or invent an
  exception ad hoc; P6 said only „the parity test allows these identical leaves” without a mechanism.
- **Fix**: Named allow-list `ALLOWED_PL_TOKENS = ["zł", "ING Bank Śląski"]` in P4, `"Język"` added in P6; P4 kit
  contract says keep `ING Bank Śląski` verbatim; Known risk notes the list must stay exact tokens.
- **Decision**: FIXED (plan.md Phase 4 §1–2, Phase 6 §2, Known risks)

### F2 — P5 signed-in smoke step would break P6's `/login` step

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 5 §2 Resolution on (smoke)
- **Detail**: `scripts/smoke.mjs` `steps` ends with „signout seeded user”, so the jar has no session when the EN steps
  run; the plan's „after signing in … if the jar holds no session” left the sign-out unstated. If the step signs in
  and does not sign out, P6's „English persists on the next page” (`GET /login`) gets the middleware's `AUTH_ROUTES`
  302 → `/home` and goes red for a reason unrelated to i18n. Adding separate sign-in / sign-out steps would also
  change every cumulative smoke count.
- **Fix**: One composite step: sign in `seeded` → `GET /settings` with the header (step result) → sign out; smoke
  counts unchanged (+2 in P5). Known risk: on red, rerun the three requests by hand.
- **Decision**: FIXED (plan.md Phase 5 §2, Known risks)

### F3 — `USUŃ` lives in three kit leaves, plan pins one

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 4 §1–2, Phase 5 §3
- **Detail**: Besides `settings.deleteConfirm` (the hint `DeleteAccountDialog` `confirmParts` splits on the word),
  `settings.confirmation` and `settings.deleteDisabledHelp` (rendered as `disabledHelp` from `settings.astro`) contain
  `USUŃ`. Only `deleteConfirm` was pinned to `DELETE`, so an EN „Type USUŃ…” help line would pass every gate and the
  diacritics case would be the only, accidental, catch.
- **Fix**: Parity rule „every EN leaf whose PL counterpart contains `USUŃ` contains `DELETE`”; kit-contract per-locale
  check covers all three keys.
- **Decision**: FIXED (plan.md Phase 4 §1–2, Phase 5 §3)

### F4 — Phase 3 import grep missed `import type { copy }`

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 3 Success Criteria (3.3)
- **Detail**: `grep "import { copy\|copyExtra }"` misses `import type { copy } from "@/content/copy"`
  (`src/lib/import/presentation.ts`). `astro check` would still catch it once the export goes.
- **Fix**: Widened to `grep -rnE "import (type )?\{[^}]*\b(copy|copyExtra)\b[^}]*\} from \"@/content/copy\""` — today
  hits all 31 import lines (verified), must be empty after P3.
- **Decision**: FIXED

### F5 — Phase sizing checked; no split or merge

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Lean Execution
- **Location**: Phases 3–4
- **Detail**: `content.json` is 20.9 KB (~7k tokens), `copy.ts` 9.6 KB; reading PL + writing EN + the parity test is
  well inside one fresh agent's context, so P4 stands alone without a split. P3 (31 import lines, 3 type-only
  importers, 4 tests, 3 literal moves) is mechanical and compile-gated — one agent. Each phase is independently green
  because locale stays pinned `pl` until P5 and `getCopy("en")` returns PL until P5.
- **Fix**: none.
- **Decision**: RECORDED

### F6 — Triggered follow-ups all accounted for

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: End-State Alignment
- **Location**: What We're NOT Doing, Phase 6 §3, Phase 7 §2
- **Detail**: `grep "Trigger:"` over `context/archive/*/follow-ups/review-fixes.md`: month template (P3 `getMonths` +
  P2 `fillMonthLocative(locale)`) included; `AuthLayout` title weight and landing steps head < 560 px included (P6);
  `copyExtra` duplicate guard kept PL-only (P3); `checkOrigin` kept (P6). Deferred with reasons that hold against the
  code: `PanelTitle` sweep (only a new section copying the existing `<h2>`), S-14 F7 field box (trigger literally
  fires — `DeleteAccountDialog` props change — but no styling changes; re-armed in P7). Product decisions (own EN
  translation, `Accept-Language` first visit, `USUŃ`/`DELETE`, bilingual title, test-not-compiler for lengths) are
  owner-design or PRD-silent and all named in `[human]` 7.10; none clearly wrong, none overturned.
- **Fix**: none.
- **Decision**: RECORDED

## Triage summary

Fixed: F1, F2, F3, F4 (4) · Recorded: F5, F6 (2). Progress rows unchanged (56); no phase added, split or merged.

## Autonomous decisions

1. **Triage done by this step, no AskUserQuestion** (run contract rule 1). Every CRITICAL/WARNING had one obvious
   fix → applied in plan.md. Would change: a fix with a real trade-off (then `## Known risks`).
2. **Codebase verification by direct greps, not a sub-agent.** Why: the 5 riskiest claims (smoke jar/session order,
   USUŃ reach, diacritics in kit data, import forms, dictionary size) were each one grep/node walk. Would change: a
   claim needing a cross-module trace.
3. **Composite smoke step over separate sign-in/sign-out steps** (F2). Why: keeps every cumulative count in the plan
   and handoff valid. Would change: the runner gaining per-step sub-assertions.

VERDICT: PROCEED — approach verified against the code; one critical (parity allow-list) and two warnings (smoke session, USUŃ keys) fixed in plan.md; phases sized for one fresh agent each.
