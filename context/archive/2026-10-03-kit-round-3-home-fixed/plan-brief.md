# Overview, trend and fixed costs on kit round 3 (S-15) — Plan Brief

> Full plan: `context/changes/kit-round-3-home-fixed/plan.md`
> Research: `context/changes/kit-round-3-home-fixed/research.md`

## What & Why

Bind `/home` and `/fixed` to design kit round 3 and close milestone M-3. The kit redrew the dashboard (one stat card,
full-width trend, a „Koszty stałe” summary instead of a second card and an import panel) and gave `/fixed` its own
state messages and read-error line; the app still shows the round-1/2 layout and placeholder copy. As the last M-3
slice it also proves that `copyExtra` holds only what the kit truly does not provide.

## Starting Point

`/home` renders two stat cards (over-limit sum + fixed-cost total), the trend with an info-panel hint, and
`ImportPanel`; copy partly from `copyExtra` duplicates of kit keys. `/fixed` has no `try`, in-section placeholder
empty lines and no delta suffixes. `/patterns/<key>` still lacks an assembly `try` (S-14 F8).

## Desired End State

`/home`: one accent card, the trend with kit legend chips (zero note and „Brak ustawionego progu” only when true),
named bars and the 8 % minimum, and a „Koszty stałe” panel („Zobacz zmiany” → `/fixed`, „Podrożały · N koszty”,
„Nowe · N koszty”). `/fixed`: kit read-error alert, one message per state in kit places, „+1,50 zł · wzrost”. Every
`copyExtra` leaf is a true gap, enforced by a unit test; the gap register matches the code.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Second card / total | Removed, `fixedTotalMinor` dropped | Kit `.stats-single`; PRD silent | Research (A2) / Plan |
| Import panel | Removed | No round-3 home view draws it; entry kept elsewhere | Research (A3) |
| „Podrożały” | Rises only | The label means „went up” | Research |
| Legend chips | Conditional; `trend.noThreshold` key; hint panel gone | Always-on would be false; key over literal | Research / Plan |
| Min bar height | 8 % | Kit geometry | Research |
| `/fixed` messages | One per state; `noComparison` under title, others after sections | Kit placement; no misleading „no change” without a comparison | Plan |
| Nominative months | Derived from `patternDetail.monthNames` keys | Kit already has them | Plan |
| Outside-S-15 duplicates | Rebound in P5 (3 byte-identical leaves) | Zero visible change, cheaper than tracking | Plan |
| Audit durability | `copyExtra` guard unit test with reasoned exceptions | A future duplicate fails CI | Plan |
| PRD departures | None | PRD names neither element removed | Research §2 |

## Scope

**In scope:** `/home` body and trend, `/fixed` states and copy, `/patterns/<key>` and `/fixed` error boundaries,
shared `monthIndex`, `PanelTitle` / `FixedSummary` / `InfoPanel` components, smoke re-pins, `copyExtra` audit + guard,
gap register (K38–K41, G39), follow-ups file, visual gate.

**Out of scope:** any rule (`fixedOverview`, `d5Type`, thresholds, endpoints), migrations, `PanelTitle` in settings /
pattern detail, `/home` error copy, `design/` and `brand.css`, `npm run format`.

## Architecture / Approach

Pages keep their single read (`loadPatternData`) and pure assembly inside one `try`; new figures come from results
already computed (`fixedRisen`, `fixedOverview().new.length`); state rules and delta text move into a pure
`fixed-view.ts` so they are unit-tested; Astro components stay presentational and read copy only through props.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Error boundaries + month index | `/fixed` and detail `try`, kit read-error copy, one `monthIndex`, F9 | `try` swallowing a redirect (they are returns) |
| 2. Dashboard body | One card, `PanelTitle`, `FixedSummary`, no import panel, home copy rebinds | Smoke re-pins described removed UI |
| 3. Trend | Conditional chips, bar names, kit geometry, `InfoPanel` | Chips/notes in one text node for smoke |
| 4. `/fixed` | Message rule, info panels, delta suffixes, kit copy | State smoke never reaches → unit helper |
| 5. Closing audit + visual gate | Guard test, 3 rebinds, register, seam sweep, follow-ups, screenshots | Missing a same-meaning key the guard cannot see |

**Prerequisites:** F-04, S-12, S-13, S-14 merged (true); local Supabase + Docker for the gate.
**Estimated effort:** 5 implement sessions (one fresh agent per phase) + review and visual gate.

## Open Risks & Assumptions

- No render test for the two pages; wiring rests on smoke needles + visual gate.
- Nominatives depend on `monthNames` key order (pinned by a kit-contract case).
- One-off merchants still inflate „Nowe” — accepted, `[human]` row.

## Success Criteria (Summary)

- `/home` and `/fixed` match the round-3 kit views in every reachable state at 1280 and ~400 px.
- No assembly throw on `/home`, `/fixed`, `/patterns/<key>` becomes a 500.
- `copyExtra` contains only true gaps (guard test green), and the register lists what goes to kit round 4.
