# Handoff — `kit-round-3-home-fixed` (slice S-15)

Written by the `/10x-implement … phase 1` step of autonomous run `2026-10-02-kit-round-3`. Phase 1 is committed (`6108b70`),
all gates green. The next agent must not get wrong: Phase 2 starts from the branch as committed — `monthIndex` is now exported
from `src/lib/format.ts` and `copyExtra.patterns.monthsLocative` is gone (locatives = `Object.values(copy.patternDetail.monthNames)`).

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/kit-round-3-home-fixed`, cut from `main` at `1bf6a5c` (after S-14) |
| Commits | 5 docs/feat — 4 docs commits + `6108b70 feat(kit-round-3-home-fixed): Granice błędów i jeden indeks miesięcy (p1)` (+ this handoff commit) |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | 35 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `src/lib/format.ts` | new `monthIndex(yearMonth)`; `fillMonthLocative` uses it |
| `src/pages/home.astro` | local `monthIndex` deleted, imports the shared one; `leadFor` comment names `fillMonthLocative` (F9) |
| `src/pages/fixed.astro` | `try/catch` around `fixedOverview`; error alert uses `copy.fixedCosts.readError`; locatives from kit |
| `src/pages/patterns/[...key].astro` | assembly `try/catch` (`assemblyError`, `pageError`, hoisted `let`s for the template-read bindings; `target`/`refMonth`/`overCount` are `const` inside the `try`, lint `no-useless-assignment`) |
| `src/content/copy.ts` | `copyExtra.patterns.monthsLocative` and its precedent comment removed |
| `test/unit/format.test.ts`, `test/unit/kit-contract.test.ts` | `monthIndex` cases (+3); locative pin on `copy.patternDetail.monthNames` |
| `plan.md`, `change.md` | rows 1.1–1.7 ticked with `6108b70`; status `implementing` |

## 3. Verification

| Command | Result |
| --- | --- |
| `npm run lint` | 0 errors (baseline 0) |
| `npx astro check` | Result (162 files): 0 errors, 0 warnings, 3 hints (baseline 0 errors / 162 files) |
| `npm run fixture:check` | ing OK, santander OK |
| `npm test` | 378 passed / 26 files (baseline 375, +3) |
| `npm run build` | OK |
| `npx supabase db reset && npx supabase test db` | Files=6, Tests=119 PASS (Δ0) |
| `npm run smoke` on :4398 | 192 PASS / 0 FAIL (baseline 192, Δ0) |
| Break: throw in `fixed.astro` `try` | `/fixed` 200 with „Nie udało się wczytać kosztów stałych. Odśwież widok.”; restored. Meta-check: throw is in assembly after a good read, so it proves the boundary, not `loadPatternData`'s error path |
| Break: throw in `[...key].astro` `try` | `/patterns/kawiarnia%20smoke` 200 with `copy.components.error`, no `<dialog`; restored (clean run: 404) |
| Break: `monthIndex` unshifted | 8 format cases red; restored, 33/33 green |

Probed with curl as the seeded test user (needs `Origin` header on the signin POST). Dev server on :4398 killed.

## 4. Next command

`/10x-implement kit-round-3-home-fixed phase 2`

## 5. Open

- Manual rows left: 1.8 `[reviewer]` (both `try` blocks wrap assembly only; redirects/404 unchanged), plus 2.7, 3.8, 4.7, 5.8
  `[reviewer]`; 2.8, 5.9, 5.10 `[visual]`; 5.11 `[human]`.
- Carried risks: `plan.md` § Known risks (no page render test; read errors only via deliberate breaks).
- Locally, the 404 check in `[...key].astro` moved below the `try` and now keys on `pageError`.
- No migration, no `DESIGN-GAP` added, no follow-ups written.

## 6. Autonomous decisions

1. **Exec mode: implemented in this context, not delegated.** Why: Phase 1 is small and file-local. Would change: a larger phase.
2. **Commit message in Polish, approved as drafted** (contract: messages in Polish). Would change: maintainer preference.
3. **`target`, `refMonth`, `overCount` made `const` inside the `try` instead of hoisted `let`s.** Rejected: hoisting all (the plan's
   wording) — ESLint `no-useless-assignment` fails, and the template does not read them. Would change: a template use of any of the three.
4. **Break probes placed at the top of each `try`** (the plan asked for a throw inside it). Would change: a need to prove a specific helper.
