<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Auth, account settings and public pages on kit round 3 (S-12)

- **Plan**: context/changes/kit-round-3-auth-settings/plan.md
- **Scope**: Full plan
- **Reviewed phases**: 1, 2, 3, 4, 5, 6, 7, 8
- **Date**: 2026-10-03
- **Verdict**: APPROVED
- **Findings**: 0 critical, 1 warning (fixed), 3 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS |
| Scope Discipline | PASS |
| Safety & Quality | PASS |
| Architecture | PASS |
| Pattern Consistency | PASS |
| Success Criteria | PASS |

## Auth-sensitive checks (sign-in, sign-out, password change, account deletion)

- `git diff main...HEAD -- src/pages/api src/pages/auth src/middleware.ts src/lib astro.config.mjs supabase` is empty:
  no endpoint, zod schema, current-password check (`api/auth/password.ts`, `api/auth/delete.ts`), `USUŃ` check, demo
  guard, auth callback `next` allow-list (`src/lib/auth-rules.ts`), middleware guard or `checkOrigin` changed.
- No migration (no change under `supabase/`); pgTAP Δ0.
- `user_id` is never read from a form: no endpoint touched; the forms post only `current`/`password`/`confirm`/`confirmation`.
- Sign-out: the new „Sesja” row in `settings.astro` is the same plain `<form method="POST" action="/api/auth/signout">`
  the removed `AppHeader` form was — same CSRF posture (`checkOrigin`), same 302 `/` (smoke `signout …` steps green).
  No open redirect: the redirect target is the endpoint's constant.
- Demo flag: `isDemoEmail(Astro.locals.user?.email, DEMO_EMAIL)` computed server-side in `AppLayout.astro` and
  `settings.astro`; `DeleteAccountDialog` `demo` disables the client only, the server guard stays (smoke
  `demo account deletion is refused` green).
- Delete dialog `locked` predicate keeps both client conditions; the server re-checks both (P5 break B proved it).

## Findings

### F1 — Masked password value hard-coded in the page

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: src/pages/settings.astro (`SettingsPasswordRow` prop `masked`)
- **Detail**: Plan P4 contract says the masked value = `copy.auth.passwordPlaceholder`; the page passed the literal
  `"••••••••"` (same text), bypassing `copy.ts` (CLAUDE.md copy rule) and creating the second masked-value constant the
  P8 sweep forbids.
- **Fix**: `masked={copy.auth.passwordPlaceholder}`.
- **Decision**: FIXED — commit `11eeeed`; smoke 184/0, lint, astro check, build re-run green.

### F2 — `aria-controls` names an element that is absent while closed

- **Severity**: 💬 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: src/components/settings/SettingsPasswordRow.tsx (`SettingsPasswordRow`, toggle `Button`)
- **Detail**: `aria-controls="settings-password-form"` while the form is unmounted (closed by default). Valid ARIA
  in practice (screen readers ignore a missing target), but some audits flag it. Unmounting is what the plan asks for
  (cancel clears the fields).
- **Fix**: set `aria-controls` only when `open`. Not applied (cosmetic a11y; visual/a11y pass can pick it up).
- **Decision**: RECORDED

### F3 — `SettingsPasswordRow` mirrors `SettingsRow` classes

- **Severity**: 💬 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Architecture
- **Location**: src/components/settings/SettingsPasswordRow.tsx vs src/components/app/SettingsRow.astro
- **Detail**: The row grid classes are duplicated because an Astro component cannot render inside a React island
  (implement decision 9, commented in the file). A change to `SettingsRow` must be mirrored by hand.
- **Fix**: none now; extract a shared class constant if a third row variant appears.
- **Decision**: RECORDED

### F4 — Logout row shows two adjacent 1 px lines

- **Severity**: 💬 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: src/pages/settings.astro („Sesja” `SettingsRow` with `class="border-t border-line"`)
- **Detail**: The „Przetwarzanie danych” row keeps its `border-b` and the logout row adds `border-t`. This is a
  faithful copy of the kit (`.settings-row{border-bottom}` + `.logout-row{border-top}` in
  `design/rytm-os/prototype/styles.css`), so not drift; the visual gate (row 8.6) decides whether it reads as a
  doubled line.
- **Fix**: none (kit-exact).
- **Decision**: RECORDED

## Success criteria

All Automated rows 1.1–8.5 re-observed on the branch (see handoff §3). Manual [reviewer] rows 1.6, 2.6, 3.7, 4.5,
5.7, 6.6, 7.8, 8.7 performed in this review and ticked. Pending: [visual] 8.6, [human] 8.8.

MERGE: CLEAR — no open critical, every automated criterion and [reviewer] row passes, all suites green (smoke baseline 166 +18, vitest 352 +2, pgTAP Δ0); [visual] 8.6 and [human] 8.8 remain as separate steps.
