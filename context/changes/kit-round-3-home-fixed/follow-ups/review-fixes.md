# Follow-ups — `kit-round-3-home-fixed` (S-15)

Written by the Phase 5 step (`/10x-implement kit-round-3-home-fixed phase 5`). Each open item carries a `Trigger:` line.

## Closed in S-15

- `/fixed` assembly `try` -> `components.error` / `fixedCosts.readError` — `6108b70` (P1).
- S-14 F8 (`/patterns/<key>` assembly `try`) — `6108b70` (P1).
- One `monthIndex` helper for the two month-index parsers — `6108b70` (P1).
- S-14 F9 (`home.astro` comment citing a non-existent `patterns.astro` `sumLabel`) — rewritten in `7934a98` (P2).
- F-04 § S-15: card feet moot (second card removed, `7934a98`); badge tint done in S-14 P2; `noComparison` string moved to the kit key (`e875337`, P4).
- G36 tick: kit decision C5, no code (register row closed by F-04, annotated in P5).
- `copyExtra` audit: duplicates of `content.json` removed (`imports.debitForms`, `imports.santanderAccountName`, `auth.resetNewVisual.eyebrow/title`, the four unread `home.empty*` leaves); guard case in `test/unit/kit-contract.test.ts`.

## Open

- **`PanelTitle` for `settings.astro` and `patterns/[...key].astro` (x3)** — still hand-rolled headings. Trigger: next slice touching those views.
- **One-off merchants count as „nowy” on `/home` and `/fixed`** (`d5Type` classifies a merchant seen once as fixed). Trigger: `d5Type` rule change, or product feedback on real data.
- **K38, K39, K40, K41, G39** — kit gaps recorded in `context/foundation/design-kit.md`. Trigger: kit round 4.
- **Guard test catches byte-identical duplicates only** — a `copyExtra` string with the same meaning but different text stays a reviewer judgment. Trigger: next `copyExtra` addition.
