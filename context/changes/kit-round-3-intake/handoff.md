# Handoff — `kit-round-3-intake` (slice F-04)

Written by the `/10x-plan` step: `plan.md` (3 code phases, `## Progress` 24 rows) and `plan-brief.md` are on disk, no
product or kit file touched. The next agent must not accept a kit-only Phase 1: `copy.ts` imports the kit JSON
directly and smoke asserts the filled trend sentence, so kit swap and app adaptation are one phase by design
(decision 9); and `astro check` does not catch JSON index reads (`stats[2]`) — only the kit-contract test/grep do.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/kit-round-3-intake`, cut from `main` at `577b163` (+ roadmap commit `78386c1`) |
| Commits this step | 1 (`docs(kit-round-3-intake): plan`) on top of `305a261` |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `planned` (`metadata-guard.mjs mark-planned`) |
| `## Progress` rows remaining | 24 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after commit |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `context/changes/kit-round-3-intake/plan.md` | full plan: P1 kit + intake patch + token sync + reader fixes (`fillMonthLocative`, `tableHeaders`); P2 kit-contract test, smoke +6, K18 comments; P3 `design-kit.md` round 3, follow-ups, seam sweep, screenshots; `## Autonomous decisions` (11) |
| `context/changes/kit-round-3-intake/plan-brief.md` | two-page brief |
| `context/changes/kit-round-3-intake/change.md` | `status: planned` |
| `context/foundation/roadmap.md` | F-04 status `pending` → `planning` (At a glance + body) |
| `context/changes/kit-round-3-intake/handoff.md` | this file |

## 3. Verification

| Command | Result |
| --- | --- |
| `git branch --show-current` | `feat/kit-round-3-intake` |
| `grep -rnE "stats\[|columns|amountColumn|fixedCosts\.new|tooShort|passwordTooShort|genericError|K18|loginError|resetTitle|resetBody|checkInbox" src` | every reader named in the plan found; `DESIGN-GAP: K18` at 4 sites (`home.astro`, `patterns.astro`, `fixed.astro`, `patterns/[...key].astro`) — research said 6, plan uses the observed 4 |
| Node read of delivery `content.json` | `patterns.columns` 7 (Kwota idx 3), `dashboard.stats` 2 labels, `trend.minimumMonths` 3, `authStates.passwordMinLength` 6, `fixedCosts.new` „Nowe w {month}”; `authStates` has no `loginError/resetTitle/resetBody/checkInbox` |
| `diff -rq` delivery `react-kit/docs` and `rytm-os` vs repo | content.json, routes.md differ, copy-map.md new; brand-pack only `karta-stylu.md` |
| Plan Success Criteria ↔ Progress | 1:1 (P1 8, P2 8, P3 8) |
| lint / astro check / tests / build / pgTAP / smoke | not run — plan only, no code changed (baseline in agent contract, inherited, unverified) |

## 4. Next command

`/10x-plan-review kit-round-3-intake`

## 5. Open

- Manual Progress rows (human checklist): 1.8 `[reviewer]` kit equals delivery except 4 strings; 2.8 `[reviewer]` kit-contract assertions map to real reads; 3.6 `[visual]` screenshots desktop + ~400 px (`/login?error=1`, `/reset`, `/reset?sent=1`, `/register` short password, `/home`, `/patterns`, `/fixed`, `/settings` short password); 3.7 `[reviewer]` seam sweep / register / follow-ups; 3.8 `[human]` accept kit-text deviations (`fillMonthLocative` „we wrześniu”, `tableHeaders` body order, `copyExtra.imports.saveError`, 4 `authStates` restored in kit) and send round-4 K-rows to the author.
- Known unguarded seam (recorded in plan P2 break 2): reader-side index reads in `home.astro` `StatCard` — guarded only by grep + kit-contract `stats[1]` pin + visual row.
- The delivery folder is outside git; if missing at implement time → `ARTIFACT GAP`.
- Follow-ups are created in Phase 3 (`follow-ups/review-fixes.md`, Triggers S-12/S-14/S-15). No `DESIGN-GAP` added. Migration: no.

## 6. Autonomous decisions

1. **0 questions, MEDIUM** — research recommended a minimal fix per break. Would change: a product owner available.
2. **Intake patch for the 4 `authStates`** (not `copyExtra.auth`). Would change: a byte-faithful-kit rule.
3. **`tableHeaders` maps kit labels to the current body order**; kit order left to S-14. Would change: S-14 dropped from the run.
4. **Shared `fillMonthLocative` with „we wrześniu”**, applied to `/fixed` and the pattern detail (`sumLabel`, `overInMonth`) — deviates from the kit's literal „w wrześniu” (kit text, not PRD; `[human]` 3.8). Would change: the author fixing the template.
5. **`{n}` from `trend.minimumMonths` and `MIN_PASSWORD_LENGTH`**, kit numbers pinned equal by the kit-contract test. Would change: PRD changing the trend minimum, or kit/app disagreement (app wins).
6. **Kit swap + app adaptation in one phase, commit `feat(…): … (p1)`** instead of the round-2 separate `design:` commit. Would change: nothing short of `copy.ts` no longer importing the kit JSON.
7. **Index-read guard = unit test + grep**, not `noUncheckedIndexedAccess`. Would change: a repo-wide hardening change.
8. No decision departs from the PRD's literal text; kit-text departures are grouped in `[human]` 3.8.
