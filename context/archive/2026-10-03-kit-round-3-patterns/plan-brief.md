# Patterns, pattern detail and the actions dialog on kit round 3 (S-14) — Plan Brief

> Full plan: `context/changes/kit-round-3-patterns/plan.md`
> Research: `context/changes/kit-round-3-patterns/research.md`

## What & Why

Slice S-14 of milestone M-3 binds the three pattern surfaces (`/patterns`, `/patterns/<key>`, the actions dialog) to
design kit round 3. Most behaviour already exists behind `copyExtra` placeholders; the kit now draws it, so the app
reads kit copy and layout. M-3 changes presentation, not rules.

## Starting Point

The list renders Suma before Kwota through a `tableHeaders` mapping, has no status badges or „Pokaż więcej”, and
500s if assembly throws. The detail page and dialog read ~45 `copyExtra.patterns` leaves; the rename field prefills
the derived name (F5); three dialogs share a round-2 `DialogContent`.

## Desired End State

Kit column order, „nowy” / „zmiana kwoty” badges, a 10-row page with „Pokaż więcej” after search and sort, an
error alert instead of a 500. The detail page uses kit copy, a plural-aware `role="img"` sequence label, and the kit
not-found and no-occurrences states. The dialog draws the kit merge, merge-empty and rename sections without
freezing the derived name. All three dialogs get the kit round-3 padding.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| „Pokaż więcej” | 10 rows after filter + sort; count on the filtered list; stays expanded on search | Keeps the roadmap Risk (no change to sorting or sums) and every smoke row (at most 2 rows in smoke) | Research / Plan |
| Dialog structure | In-place sections with kit headings and states | Smaller than kit modal navigation; PRG and smoke unchanged | Plan |
| Merge/rename errors | Page alert after redirect (unchanged) | S-12 precedent: one alert slot | Plan |
| Rename field (F5) | Value = stored name or empty; placeholder = shown name | Untouched save never freezes or clears a name | Research / Plan |
| `sequenceSummary` | `copyExtra` template with plurals (K35) | Kit JSON says „1 wystąpień”; its own prototype pluralises | Research |
| `threshold.invalid` | Kit string, validator unchanged (K36) | Kit is the copy source; PRD silent on the message | Research |
| Status badges | One `fixedOverview` on the same read | Kit draws them; no rule change, no second read | Research |
| Focus ring | One export, ink/15 unchanged | Kit has no focus rule; zero visual change site-wide | Research |
| Rename limit | 100, no migration | Schema CHECK 1–100; M-3 has no migrations (K31) | Change / Research |
| Phases | 8 small phases (plan review merged dialog geometry into 4), no new UI component | Each phase runs as a fresh agent and must be green on its own | Plan |

## Scope

**In scope:** column order, list copy, `/patterns` `try`, badges + `Badge` tones, „Pokaż więcej”, toolbar field +
`focusRing` / `fieldBox` exports, detail copy + sequence label, not-found / no-occurrences / merged variants, dialog
copy + rename fix + result lines, `DialogContent` geometry, register rows K35–K37, seam sweep, visual gate.

**Out of scope:** endpoints and rules (`validateMerge` F6, `unmerge` F7, validators), migrations, kit modal
navigation, toasts, `/fixed` and `/home` (S-15), app-wide panel radius.

## Architecture / Approach

Presentation in `.astro` pages and React islands; copy reaches islands only through typed props. New pure helpers
in `src/lib/patterns/` (`list-view.ts`, `status.ts`, `sequence-label.ts`) carry the testable rules. Island rendering
is proven by `renderToStaticMarkup` tests; page-rendered strings by smoke (`>text<` for island nodes).

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Columns + list copy + `try` | Kit order, `tableHeaders` gone, no 500 | Smoke cannot see order (props) → render test |
| 2. Status badges | „nowy” / „zmiana kwoty”, `Badge` `changed` | `/fixed` tint changes too (intended) |
| 3. „Pokaż więcej” | 10-row page after filter + sort | Slicing before filtering |
| 4. Field + focus + fieldBox + dialog geometry | 8 px toolbar, one focus source, kit padding in 3 dialogs, close glyph on `Glyph` | Site-wide button classes must stay identical; visual change on `/imports`, `/settings` |
| 5. Detail copy + sequence | Kit keys, plural `role="img"` label | Changed meaning (`within`, not all occurrences) |
| 6. Detail states | Not-found, no-occurrences, merged variants | `ViewEmpty` callers must stay identical |
| 7. Dialog | Kit sections, F5 fix, result lines | Result strings leaking into island props |
| 8. Register + sweep + visual | Rows closed, follow-ups, screenshots | Missing data for the badge state |

**Prerequisites:** local Supabase, synthetic ING fixture import (more than 10 merchants) for the visual gate.
**Estimated effort:** 8 implement sessions, each with the full local gate.

## Open Risks & Assumptions

- Render tests prove the island markup, not hydration; the visual gate closes the gap.
- `ui/` importing `focusRing` from `app/field-styles.ts` is an accepted layering inversion.
- The no-occurrences state may have no deterministic smoke data; the visual row covers it.

## Success Criteria (Summary)

- Every pattern state matches its kit view at 1280 and ~400 px, and the other dialogs show no regression.
- Smoke baseline + 8 (or + 9), vitest green, pgTAP unchanged, no `copyExtra.patterns` leaf without a reader.
- The maintainer accepts or reverses the product-visible choices in `[human]` row 8.9.
