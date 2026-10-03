<!-- PLAN-REVIEW-REPORT -->
# Plan Review: Auth, account settings and public pages on kit round 3 (S-12)

- **Plan**: `context/changes/kit-round-3-auth-settings/plan.md`
- **Mode**: Deep (codebase checks done inline by the reviewer, not delegated to a sub-agent; see Autonomous decisions)
- **Date**: 2026-10-03
- **Verdict**: SOUND (after triage; REVISE-level items were narrow and are fixed in plan.md)
- **Findings**: 0 critical, 2 warnings, 4 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| End-State Alignment | PASS |
| Lean Execution | PASS |
| Architectural Fitness | PASS |
| Blind Spots | WARNING |
| Plan Completeness | WARNING |

## Grounding

Grounding: 13/13 paths ✓ (`AppLayout.astro`, `AppHeader.astro`, `Panel.astro`, `DeleteAccountDialog.tsx`,
`FormField.tsx`, `NewPasswordForm.tsx`, `ResendButton.tsx`, `ui/dialog.tsx`, `SiteFooter.astro`, `SiteHeader.astro`,
`InfoAlert.tsx`, `kit-contract.test.ts`, `lib/demo.ts`); symbols ✓ (`isDemoEmail(email, demoEmail)`, `DEMO_EMAIL`
from `astro:env/server` as in `imports/{index,new}.astro`, `DEMO_ERROR`, `RESEND_COOLDOWN_SECONDS` = 60,
`PROTECTED_ROUTES` covers all 8 `AppLayout` pages); 30/30 content.json keys the plan binds exist with the stated text
(`patternDetail.sequenceOver`, `footer.forWho`, `app.demoNotice`, every `settings.*` read, `confirmEmail.resendCountdown`
with `{seconds}`, `authStates.*`, `resetNew.*`); brief↔plan ✓ (phases, decisions, scope agree; brief count updated).
Progress↔Phase: 1:1 for all 8 phases after the edits (6/6/7/5/7/6/8/8 = 53 rows).

## Claims checked against the code

- `copy.app` holds every `Sidebar`/`MobileNav` read (`overview`, `patternsLong`, `fixedLong`, `sidebarView`,
  `sidebarData`, `importsLong`, `navLabel`, `settings` for `settingsLong`) — P2 rebind is exact.
- `InlineAlert.astro` compiles to `<span …>${slot}</span>` (checked in the built `_render.func`), so the plan's
  `>text<` needles for page alerts match the rendered node.
- `FormField` is rendered only by the auth forms + `NewPasswordForm` + `DeleteAccountDialog`; `field-styles.ts` only
  mentions it in a comment — P6's 8 px/paper change does not leak into `/patterns` (S-14 stays untouched).
- `Panel variant="danger"` is used only by `settings.astro`.
- `DialogContent` is shared by `DeleteAccountDialog`, `DeleteImportDialog`, `PatternActionsDialog`; none of them has
  a non-portaled absolutely positioned child, so `overflow-auto` cannot clip a dropdown.
- Smoke: the three signout steps POST `/api/auth/signout` directly (not via the header form) and pin `location: "/"`;
  removing the header form cannot turn them red. Delete guards (`delete without confirm word`, `without current
  password`, `wrong current password`, `demo account deletion is refused`) POST directly — the P5 UI change cannot
  weaken them, and P5's deliberate break proves the server `USUŃ` check still bites.
- `settings fills the password minimum` stays green after P4 because `SettingsPasswordRow` receives the filled
  `passwordTooShort` label as a serialized prop (plan Known risks records it no longer proves the field renders).
- Smoke keeps a cookie jar (`storeCookies`/`cookieHeader`), which is what makes F1's fix possible.

## Follow-ups whose Trigger names this slice

All dispositioned in `change.md` § Open follow-ups and the plan: intake K27 (`Trigger: S-12`, fired, no move — no
round-3 home; correct), S-04 F11 field radius (fired; `FormField` + dialog input in P5/P6, `field-styles.ts`
re-pointed to S-14 in P8 — justified, it is S-14's view), G32/C3 paper fields (P6), S-04 F3 focus ring (not fired —
`focus:ring-ink/8` unchanged; correct), durable-pattern-decisions F8 dialog `max-h` (fired, P5), DeleteAccountDialog
bfcache (watch item; P4 wires `usePageShowReset` if a pending flag appears), S-13 F7 (already resolved), undo-import
F3 `checkOrigin` (binding invariant, honoured: logout is a plain POST). Nothing missing.

## PRD scrutiny

PRD `### Konto` has only FR-001 and FR-019; password change, sign-out placement, the demo account strip and the
public pages are not in the PRD's text. `## Access Control` says an anonymous user sees nothing but the login screen,
while the landing is public since S-01 and sign-out lands on `/` — pre-existing, unchanged by this slice, and named on
`[human]` row 8.8 (decision 7). Header „Wyjdź” removal, collapsed (now explicitly JS-only) form, dialog closing on
error, short demo text, longer deleted notice: all product-visible, all on row 8.8. None overturned — each follows
the kit and none contradicts the PRD. No UI change weakens a server check: `api/auth/{password,delete,reset/new}.ts`
and `checkOrigin` are out of scope by contract, and the demo flag comes only from the server (`isDemoEmail` in the
page/layout).

## Findings

### F1 — Resend countdown is SSR-provable, but the plan routes it to the visual gate with a wrong expected value

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 7 §1 + §3, Success Criteria 7.4 meta-check, Manual 7.7, Desired End State
- **Detail**: `ResendButton` initialises `left` with `justSent ? RESEND_COOLDOWN_SECONDS : 0`; React SSR renders that
  initial state, so `/confirm-email?resent=1` (with the `rytm-pending-email` cookie the smoke jar already holds after
  `signup creates account`) contains „Wyślij ponownie za 60 s” in the HTML. The plan called the countdown
  "client-only → visual row" and expected „59 s” (the value only after one tick).
- **Fix**: add smoke step `confirm-email resent shows the kit countdown` (`>Wyślij ponownie za 60 s<`, after signup) and
  a deliberate break (old `${label} (${left}s)` template → red); fix the expected text to 60 s at load. Smoke net
  +17 → +18.
- **Decision**: FIXED — P7 smoke +3, new criterion/Progress row 7.6 (old 7.6/7.7 → 7.7/7.8), gates in P7/P8 and
  Testing Strategy → +18, brief updated.

### F2 — Dialog still reads `copyExtra.auth.passwordPlaceholder` / `settings.confirmation` after P5

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 5 §2 (page wiring); Phases 6/7 key deletion; Desired End State `copyExtra` list
- **Detail**: `settings.astro` passes the dialog `passwordPlaceholder: xa.passwordPlaceholder` and
  `confirmationHint: s.confirmation`. P5 names `settings.deleteConfirm` for the confirm line but never rebinds the
  placeholder, while P6/P7 plan to delete `copyExtra.auth.passwordPlaceholder` "when unread" and the End State list
  no longer contains it. The P8 "every key has a reader" grep would not flag it (it would have a reader), so the
  key would silently survive against the End State.
- **Fix**: P5 rebinds the dialog placeholder to `copy.auth.passwordPlaceholder` and the confirm line to
  `settings.deleteConfirm`, leaving no `copyExtra.auth.passwordPlaceholder` / `settings.confirmation` read on `/settings`.
- **Decision**: FIXED — P5 §2 contract.

### F3 — Collapsed password form loses the no-JS path

- **Severity**: 💡 OBSERVATION
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Blind Spots
- **Location**: Phase 4; Known risks; `[human]` row 8.8
- **Detail**: today `NewPasswordForm` SSRs open and degrades to a plain POST; behind a client toggle the form cannot
  be opened without JavaScript. The delete dialog was already JS-only (S-08 impl-review). The kit draws the toggle,
  so following it is defensible; sign-out remains a plain POST form.
- **Fix**: accept as the kit's behaviour; record in Known risks and name it on the `[human]` row.
  - Strength: no deviation from the kit; one more client island is consistent with the delete dialog.
  - Tradeoff: no-JS users cannot change the password in-app (reset-by-e-mail still works).
  - Confidence: HIGH — read from `NewPasswordForm` / plan P4 contract.
  - Blind spot: none significant.
- **Decision**: FIXED (recorded) — Known risks bullet; `[human]` 8.8 text and Phase 8 manual bullet mention JS-only.

### F4 — Same alert for both "wrong current password" outcomes

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Critical Implementation Details — Result alerts on `/settings`
- **Detail**: `?error=current-password` and `?error=delete-password` both map to `settings.passwordInvalid` above
  the panels; with the dialog closed (decision 4) the user is not told which form failed. Kit copy has one string.
- **Fix**: record only (Known risks); revisit if the maintainer reverses decision 4 on row 8.8.
- **Decision**: FIXED (recorded) — Known risks bullet.

### F5 — `max-h` regression check names only an import dialog

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Known risks; Phase 8 [visual]
- **Detail**: the tallest shared dialog is `PatternActionsDialog` with the merge picker revealed (durable-pattern-decisions
  F8 measured 574–596 px); a shared `DialogContent` change should be checked there too.
- **Fix**: add the pattern-actions dialog (merge picker revealed, 400 px) to the visual list and Known risks.
- **Decision**: FIXED.

### F6 — Archived follow-ups closed by this slice are not marked closed anywhere greppable

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 8 §3 Follow-ups
- **Detail**: P5 closes durable-pattern-decisions F8 and P5/P6 close the `FormField`/dialog part of S-04 F11, but the
  archives are read-only and their `Trigger:` lines would keep firing for later slices.
- **Fix**: P8's `follow-ups/review-fixes.md` carries a „Resolved in S-12” note for both.
- **Decision**: FIXED — P8 §3 item (c).

## Triage summary

Fixed: F1, F2, F5, F6 · Recorded in plan (Known risks / `[human]`): F3, F4 · Dismissed: none.
Phase sizing: each phase ≤ 1 new UI component, independently green (P3 pairs the header removal with the „Sesja” row
so no commit lacks sign-out; P3's double delete alert is intermediate and removed in P5). No split or merge needed.

VERDICT: PROCEED — approach is kit-faithful and keeps every server check and the smoke auth flow untouched; two narrow gaps (SSR-provable countdown, a leftover placeholder read) are fixed in plan.md.
