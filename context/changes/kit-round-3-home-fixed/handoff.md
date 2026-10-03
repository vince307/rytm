# Handoff — `kit-round-3-home-fixed` (slice S-15)

Written by the `/10x-plan-review` step of autonomous run `2026-10-02-kit-round-3`. Verdict PROCEED (SOUND after fixes):
four warnings fixed in `plan.md`, no phase resized, no code touched. The next agent must not get wrong: Phase 1 now ALSO
rebinds `copyExtra.patterns.monthsLocative` to `Object.values(copy.patternDetail.monthNames)` (plan review F1) and the
`[...key].astro` `try` follows the hoisted-`let` / `pageError` contract in Critical Implementation Details (F2).

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/kit-round-3-home-fixed`, cut from `main` at `1bf6a5c` (after S-14) |
| Commits | 4 — `… change identity`, `… research`, `… plan`, `docs(kit-round-3-home-fixed): plan review` |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `plan_reviewed` |
| `## Progress` rows remaining | 42 (`grep -c '^- \[ \]' plan.md`; unchanged — row 1.3 title extended) |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `context/changes/kit-round-3-home-fixed/reviews/plan-review.md` | Review report: 0 critical, 4 warnings (F1–F4, fixed), 3 observations (F5 recorded, F6/F7 fixed); ends `VERDICT: PROCEED — …` |
| `context/changes/kit-round-3-home-fixed/plan.md` | Triage edits: P1 §1 locatives rebind + files + criterion/Progress 1.3 (F1); Critical Implementation Details `[...key].astro` `try` contract (F2); P3 §2/§3 string props + criterion 3.3 grep (F3); P4 criterion 4.3 grep (F4); one-text-node list adds `>Podrożały<` / `>Nowe<` (F7); Known risks leaf-grep note (F6); P5 §2 `ROLE_EXCEPTIONS`, §3 K30 note, decision 12 (F1) |
| `context/changes/kit-round-3-home-fixed/change.md` | `status: planned → plan_reviewed` |
| `context/changes/kit-round-3-home-fixed/handoff.md` | this file |

## 3. Verification

| Command | Result |
| --- | --- |
| `git branch --show-current` | `feat/kit-round-3-home-fixed` |
| `ls -l` of 9 plan paths; grep of named symbols | all present; new files absent as expected |
| `node` read of `content.json` keys the plan binds | every key exists with the plan's text; `patternDetail.monthNames` keys = nominatives, values = locatives |
| esbuild-bundled `copy.ts` collision scan (read-only, `$TMPDIR`) | 33 colliding leaves today; after P1–P5 only the 5 role exceptions; new S-15 literals collide with nothing |
| `grep -c '^- \[ \]' plan.md` | 42 (before and after edits) |
| Follow-up trigger grep (`context/archive/*/follow-ups/review-fixes.md`) | every `Trigger: S-15` item and every met condition included or justified moot |

Docs-only step: no suite run (no change in `src/`, `scripts/`, `supabase/`, `test/`). Baseline for implement (inherited,
unverified here): `main` at `1bf6a5c` — lint 0; astro check 0 / 162 files; fixture OK; vitest 375 / 26 files; build OK;
pgTAP 119 PASS; smoke 192 / 0. Each phase measures it on the branch first.

## 4. Next command

`/10x-implement kit-round-3-home-fixed phase 1`

## 5. Open

- Phase 1 scope (after review): `monthIndex` in `src/lib/format.ts` (`fillMonthLocative`, `home.astro`); `fixed.astro` `try` +
  `fixedCosts.readError`; `[...key].astro` `try` with `assemblyError` / `pageError` and hoisted `let`s; F9 comment in `home.astro`
  `leadFor`; locatives from `copy.patternDetail.monthNames` (delete `copyExtra.patterns.monthsLocative`, re-pin
  `kit-contract.test.ts` „has a locative for each of the 12 months”).
- Manual rows (human checklist): 1.8, 2.7, 3.8, 4.7, 5.8 `[reviewer]`; 2.8, 5.9, 5.10 `[visual]`; 5.11 `[human]` (removed `/home`
  total and import panel, rises-only „Podrożały”, one-offs in „Nowe”, chip key text + removed hint panel, min bar 12 → 8 %,
  conditional zero note, one `/fixed` message without comparison, „kosztów” form; K38–K41, G39 to the kit author).
- Carried risks: `plan.md` § Known risks (no page render test; `Object.keys` order pinned by kit-contract; repeated
  `>0 pozycji<` / `>1 koszt<` needles; read errors only via deliberate breaks; P5 leaf-reader grep must key on access tails).
- No migration. No `DESIGN-GAP` added in this step.

## 6. Autonomous decisions

1. **Verified the risky claims inline instead of spawning the skill's sub-agent.** Why: the claims were few and file-local
   (`[...key].astro`, `copy.ts` collisions, smoke data); reading them directly was cheaper and gave file evidence. Would change:
   a plan with wide blast radius across modules.
2. **F1: rebind `monthsLocative` in P1, not keep it as a role exception.** Rejected: correct only the exception's reason. Why: it
   is byte-identical to the kit and decision 9 already derives nominatives from the same object; P1 touches all three readers.
   Would change: the kit changing `monthNames` values away from plain locatives.
3. **F2 fixed with `assemblyError` + `pageError` and hoisted `let`s.** Rejected: an IIFE returning a result object (redirect
   `return`s inside it would not leave the page). Would change: a refactor of the page into a pure assembly helper.
4. **No phase split/merge (F5).** Why: `[visual]`/`[reviewer]` rows belong to the visual-gate and impl-review steps; P2/P5
   implement work is small per item. Would change: an implement step returning `NEEDS_CONTINUATION` on P2 or P5.
5. **No product decision overturned.** Why: FR-011/012/013 figures unchanged; removals are PRD-silent and already on `[human]`
   5.11. Would change: maintainer feedback on 5.11.
