# Auth, account settings and public pages on kit round 3 (S-12) — Plan Brief

> Full plan: `context/changes/kit-round-3-auth-settings/plan.md`
> Research: `context/changes/kit-round-3-auth-settings/research.md`

## What & Why

Bind the public pages, auth screens, `/settings` (+ delete dialog) and the app shell to design kit round 3 so the
milestone M-3 promise holds: no placeholders, kit copy, the round-3 decisions C1 (for-who in the phone footer), C2
(sign-out on the settings screen) and C3 (paper fields), plus a permanent note for the shared demo account.

## Starting Point

Most strings come from `copyExtra` stand-ins that round 3 now ships as real keys (61 exact leaves). The password form
is always open, sign-out lives only in the app header („Wyjdź”), the demo account sees a refusal only after a refused
POST, fields are white with 14 px radius, and the footer has no „Dla kogo”.

## Desired End State

Every surface reads `copy.*` except a short list of K11/K13/K15 keys the kit still lacks. `/settings` shows one alert
above the panels for every outcome, a collapsed password form, a „Sesja” row with „Wyloguj się”, and a kit delete
dialog (help line, demo state, closes on server error). Demo users see `app.demoNotice` under the header on every
app page. Auth screens have their own visual panels, the kit expired layout and countdown. Server rules unchanged.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Password form | Kit toggle, closed by default | Kit draws it in `settings()` and 5 state views | Research → Plan |
| Header „Wyjdź” | Removed; sign-out row on `/settings` (same phase) | C2, kit header has no logout | Research → Plan |
| Result alerts | One page-level alert; dialog no longer reopens on error | Kit `deleteAccountAction()` / `settings()` placement | Research → Plan |
| Demo strip text | `app.demoNotice` (short) | content.json over `app.js` (S-13 precedent); K34 row | Research |
| Sign-out redirect | `/` unchanged | Smoke pins it ×3; PRD/routes silent | Research |
| `/reset/new` demo error | `settings.demoPasswordBlocked` (closes G37) | Kit copy for exactly that refusal | Research |
| `deleteDisabledHelp` | Under the `USUŃ` input while disabled | Key without a drawing; K34 row | Research → Plan |
| F8 | `DialogContent` max-height now; padding → S-14 | Kit-backed, invisible unless overflow | Research |
| K32 | `/settings` → `settings.*`, `/reset/new` → `authStates.*` | Each screen's own namespace, identical text | Research |
| Phase size | 8 phases, ≤ 1 new UI component each | Fresh agent per phase, small and green | Plan |

## Scope

**In scope:** public pages + header/footer, demo strip, `/settings` copy/alerts/toggle/sign-out/danger border, delete
dialog, login/register/reset, confirm-email, reset/new, resend countdown, `FormField` paper + 8 px, `.modal`
max-height, register rows (K34), follow-ups.

**Out of scope:** endpoints, query params, migrations, `checkOrigin`; `field-styles.ts` and dialog padding (S-14);
shared focus-ring class; K27 moves; change e-mail; anything under `design/rytm-os/`.

## Architecture / Approach

Page-level param → content-key mapping (as S-13 did); the shell computes the demo flag from `locals.user` +
`DEMO_EMAIL`; islands get labels as props. Each phase deletes the `copyExtra` keys whose last reader it rebinds.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Public pages and site chrome | `copy.*` rebind, phone footer „Dla kogo”, header < 560/360 | Footer needle colliding with the header link |
| 2. Demo strip | `DemoNotice` in `AppLayout`, `app.*` rebind | Strip shown to non-demo users |
| 3. Settings copy, alerts, sign-out | `settings.*`, page alerts, „Sesja” row, header „Wyjdź” gone | Sign-out regressions (smoke pins `/`) |
| 4. Collapsed password form | `SettingsPasswordRow` toggle, „Zapisz hasło”/„Anuluj” | Field proof moves to props only |
| 5. Delete dialog | Kit order, help line, demo state, max-height | Weakening the server check (break proves it holds) |
| 6. Login/register/reset + fields | Rebind, deleted notice, paper/8 px fields | Auth smoke |
| 7. Confirm-email, reset/new, countdown | K13 panels, expired layout, G37 closed | Recovery-session states only visual |
| 8. Register, sweep, visual gate | K34, follow-ups, seam greps, screenshots | Missed seams |

**Prerequisites:** F-04 and S-13 merged (done); local Supabase running; baseline from the contract re-measured.
**Estimated effort:** ~8 implement sessions (one fresh agent per phase), smoke + 18 net (plan review F1 added the SSR countdown step).

## Open Risks & Assumptions

- Client-only states (open form, dialog contents, countdown) are proven only by the visual gate.
- `DialogContent` max-height also reaches the import/pattern dialogs (no visible change expected).
- P3 briefly shows a delete error twice until P5 (never shipped).

## Success Criteria (Summary)

- A user walks sign-in → settings (change password, sign out, delete) → `/login` note on kit copy, all server checks
  intact and the auth smoke green.
- The demo account sees its note on every app page; others never do.
- No stale `copyExtra` key or `DESIGN-GAP` for the slice's items remains; the maintainer accepts the `[human]` row.
