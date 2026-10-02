# Kit round 3 intake (F-04) — Plan Brief

> Full plan: `context/changes/kit-round-3-intake/plan.md`
> Research: `context/changes/kit-round-3-intake/research.md`

## What & Why

The design-kit author delivered round 3 (345 kit keys, 8 new tokens, 60 prototype view files, decisions C1–C6).
`src/content/copy.ts` imports the kit's `content.json` directly, so swapping it in breaks the app in five places
(removed keys, a shifted card index, a silently mislabelled table, raw `{n}`/`{month}`, one meaning shift). F-04 takes
the kit in, keeps every screen correct without redesign, and registers what later slices (S-12…S-15) adopt.

## Starting Point

Round 2 lives in `design/rytm-os/`; the delivery sits outside git in
`context/runs/2026-10-02-kit-round-3/kit-delivery/`. `design-kit.md` says `kit_round: 2`.

## Desired End State

`design/rytm-os/` is round 3 plus a 4-key intake patch; `brand.css` carries the new tokens; every screen shows the
right text (no `undefined`, no placeholders, 7 correctly labelled table columns, „we wrześniu”); a kit-contract
unit test and 6 smoke steps guard the next intake; `design-kit.md` is `kit_round: 3` with each K/G item's status and
adopting slice.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| 4 dropped `authStates` keys | Restore verbatim in the kit (intake patch) | No round-3 key holds them; K12 precedent; readers unchanged | Research |
| Table header | Kit labels in today's body order (`tableHeaders`) | No redesign in F-04; kit order is S-14 (K17) | Research |
| Wizard save failure | `copyExtra.imports.saveError` from round-3 `app.js` | `components.error` now means a read failure | Research |
| Month preposition | Shared `fillMonthLocative` → „we wrześniu” | Users' latest month is September today; one helper for 3 sites | Plan |
| `{n}` sources | `trend.minimumMonths` (3), `MIN_PASSWORD_LENGTH` (6), pinned by test | One source each; tests catch kit/app drift | Plan |
| Card feet | Keep `copyExtra.home` | Kit foot is ungrammatical for n = 1 | Research |
| Phase cut | Kit swap + app adaptation in one phase | A kit-only phase is red (smoke asserts the filled trend text) | Plan |
| Index-read guard | Kit-contract unit test + grep | `astro check` cannot see JSON index reads | Plan |

## Scope

**In scope:** kit copy + intake patch, token sync, minimal reader fixes, month helper, header mapping, kit-contract
test, 6 smoke steps, K18 comment removal, `design-kit.md` round 3, follow-ups, seam sweep, screenshots.

**Out of scope:** `copyExtra` migration, kit column order, kit card feet, rename limit, new Tailwind colours, any new
view/component, migrations.

## Architecture / Approach

Kit JSON → `copy` (typed import) → pages/components. Removed keys surface in `astro check`; index reads and
placeholders do not, hence the unit kit-contract test and smoke. Templates filled at the page with `.replace`, the
month preposition in one `src/lib/format.ts` helper.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Round-3 kit in place, app adapted | Kit + patch + tokens, all reads correct, helpers with unit tests | Prettier run on `design/` / `brand.css` rewriting whole files (kit copied byte for byte, no prettier — plan review F1) |
| 2. Regression guards and K18 cleanup | Kit-contract test, smoke +6, stale comments gone | Reader-side index reads stay unguarded (recorded) |
| 3. Gap register round 3, follow-ups, seam sweep | `design-kit.md` round 3, follow-ups, screenshots | Register drift from the research matrix |

**Prerequisites:** the delivery folder on disk (else `ARTIFACT GAP`); local Supabase for pgTAP/smoke.
**Estimated effort:** small — 3 phases, no UI component, no migration.
