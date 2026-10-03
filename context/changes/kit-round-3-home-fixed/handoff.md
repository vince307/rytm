# Handoff — `kit-round-3-home-fixed` (slice S-15)

Written by the `/10x-plan` step of autonomous run `2026-10-02-kit-round-3`. `plan.md` (5 phases, 42 Progress rows) and
`plan-brief.md` are on disk; no code touched. The next agent must not get wrong: the plan departs from NO PRD clause
(the PRD names neither the removed `/home` total nor the import panel) — every kit departure and product-visible
choice is gathered in `[human]` row 5.11, and `/fixed` deliberately shows ONE message per state (no comparison →
only `fixedCosts.noComparison`), which is a plan decision, not a kit literal.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/kit-round-3-home-fixed`, cut from `main` at `1bf6a5c` (after S-14) |
| Commits | 3 — `… change identity (autonomous run)`, `… research`, `docs(kit-round-3-home-fixed): plan` |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `planned` (set by `metadata-guard.mjs mark-planned`) |
| `## Progress` rows remaining | 42 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `context/changes/kit-round-3-home-fixed/plan.md` | Full plan: current state, desired end state, 5 phases (Intent/Contract per change, automated + manual criteria, deliberate breaks), testing strategy, known risks, 17 autonomous decisions, `## Progress` |
| `context/changes/kit-round-3-home-fixed/plan-brief.md` | Two-page brief (key decisions, phases at a glance) |
| `context/changes/kit-round-3-home-fixed/change.md` | frontmatter `status: preparing → planned` |
| `context/foundation/roadmap.md` | S-15 `Status` → `planning` (At a glance + slice body) |
| `context/changes/kit-round-3-home-fixed/handoff.md` | this file |

## 3. Verification

| Command | Result |
| --- | --- |
| Success Criteria ↔ Progress mapping (awk count per phase) | P1 7+1, P2 6+2, P3 7+1, P4 6+1, P5 7+4 = 42 rows, one-to-one |
| `metadata-guard.mjs mark-planned` | `{"changed":true}` |
| `copyExtra` vs `content.json` byte-identical scan (node, read-only) | 33 colliding leaves today; plan removes or rebinds all but the 6 role exceptions listed in P5 item 2 |

Docs-only step: no suite run (nothing in `src/`, `scripts/`, `supabase/`, `test/` changed). Baseline for the
implement steps (inherited, unverified here): `main` at `1bf6a5c` — lint 0; astro check 0 / 162 files; fixture OK;
vitest 375 / 26 files; build OK; pgTAP 119 PASS; smoke 192 / 0. Each phase measures it on the branch first.

## 4. Next command

`/10x-plan-review kit-round-3-home-fixed`

## 5. Open

- Phases: P1 error boundaries + `monthIndex` (`src/pages/fixed.astro`, `src/pages/patterns/[...key].astro`,
  `src/lib/format.ts`); P2 dashboard body (`PanelTitle.astro`, `FixedSummary.astro`, `HomeStats.fixedNew`, delete
  `ImportPanel.astro`); P3 trend (`InfoPanel.astro`, `trendBarHeight` 8 %, `TrendChart` chips/names); P4 `/fixed`
  (`src/lib/patterns/fixed-view.ts` `fixedNotices` / `deltaText`, `FixedSection`); P5 audit + guard in
  `test/unit/kit-contract.test.ts`, 3 rebinds outside S-15, register K38–K41 / G39, follow-ups file, visual gate.
- Smoke: + 3 steps net (P2 lead step, P3 two trend steps); re-pins listed by step name in each phase.
- Manual rows (human checklist): 1.8, 2.7, 3.8, 4.7, 5.8 `[reviewer]`; 2.8, 5.9, 5.10 `[visual]`; 5.11 `[human]`
  (removed total and import panel, rises-only „Podrożały”, one-offs in „Nowe”, chip key text + removed hint panel,
  min bar 12 → 8 %, conditional zero note, one `/fixed` message without comparison, „kosztów” form; K38–K41, G39 to the
  kit author).
- Plan-review attention points: `>0 pozycji<` / `>1 koszt<` needle uniqueness (P2/P4 smoke); `Object.keys(monthNames)`
  order dependence (P2); the `ROLE_EXCEPTIONS` list must be confirmed by running the guard (P5); register ids K38–K41 /
  G39 are "next free at plan time".
- No migration. No `DESIGN-GAP` added in this step (P2–P4 add K38–K40, G39 comments).

## 6. Autonomous decisions

1. **0 questions, MEDIUM complexity.** Chosen: decide every open point from research. Rejected: interview. Why: run
   contract rule 1; research gave a recommendation for each. Would change: a product owner available.
2. **`/fixed` one message per state; empty sections drop their list panel; `unchangedEmpty` joins the after-sections
   block** (plan decisions 6–7). Rejected: kit-literal both messages / in-section lines. Why: a „no change” line without
   a comparison month misleads; the kit never draws an empty list panel. Would change: visual gate or a kit state.
3. **Nominative months derived from `copy.patternDetail.monthNames` keys** (decision 9). Rejected: keep
   `copyExtra.home.monthsNominative`. Why: the milestone audit requires no leaf with a kit equivalent. Would change: the
   kit reshaping `monthNames`.
4. **Byte-identical leaves outside S-15 rebound in P5, not filed** (decision 10). Why: zero visible change. Would
   change: a rebind needing more than one prop → follow-up with `Trigger:`.
5. **Durable audit as a unit guard with reasoned `ROLE_EXCEPTIONS`** (decisions 11–12). Rejected: one-off manual audit;
   binding role-different keys across namespaces. Would change: kit adding shared `components.*` keys.
6. **Research recommendations adopted as-is**: card + total removed (`fixedTotalMinor` dropped), import panel removed,
   „Podrożały” rises only, legend chips conditional with `trend.noThreshold`, min bar 8 %, `PanelTitle` narrow reach,
   no sections under a `/fixed` error. Each is listed with its reversal condition in `plan.md` § Autonomous decisions;
   the product-visible ones sit on `[human]` row 5.11.
