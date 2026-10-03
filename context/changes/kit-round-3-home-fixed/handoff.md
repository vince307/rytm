# Handoff — `kit-round-3-home-fixed` (slice S-15)

Written by the `/10x-new` step of autonomous run `2026-10-02-kit-round-3`. The change folder exists with
`change.md` (identity, roadmap-claims-vs-repo table, kit binding, triggered follow-ups, autonomous decisions); no
code touched. The next agent must not get wrong: the round-3 kit dashboard has ONE stat card, a full-width trend and
a „Koszty stałe” summary panel and NO import panel (`prototype/app.js` `dashboard()`) — the app today still has two
cards + `ImportPanel`; and the closing phase audits every `copyExtra` namespace, not only home/fixed.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/kit-round-3-home-fixed`, cut from `main` at `1bf6a5c` (after S-14) |
| Commits | 1 — `docs(kit-round-3-home-fixed): change identity (autonomous run)` |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `new` |
| `## Progress` rows remaining | n/a — no `plan.md` yet |
| Working tree | clean after the commit (only the two files below were added) |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `context/changes/kit-round-3-home-fixed/change.md` | identity + `## Roadmap claims vs repo now`, `## Kit binding`, `## Follow-ups triggered`, `## Autonomous decisions` |
| `context/changes/kit-round-3-home-fixed/handoff.md` | this file |

## 3. Verification

Docs-only step; no suite run (nothing in `src/`, `scripts/`, `supabase/` changed). Baseline for later steps
(inherited, unverified here): contract line, `main` at `1bf6a5c` — lint 0; astro check 0 / 162 files; fixture OK;
vitest 375 / 26 files; build OK; pgTAP 119 PASS; smoke 192 / 0. Repo facts in `change.md` were read from the branch
in this step (`src/pages/home.astro`, `src/pages/fixed.astro`, `src/content/copy.ts`, `content.json`,
`prototype/app.js` `dashboard()` / `trendChart()` / `fixedCosts()` / `emptyView()`, `prototype/styles.css`,
`scripts/smoke.mjs` greps).

## 4. Next command

`/10x-research kit-round-3-home-fixed`

## 5. Open

- Research must map, key by key: every `copyExtra.home` / `copyExtra.fixed` / `copyExtra.emptyViews` entry →
  `content.json` key or „no key” (`src/content/copy.ts`); then the same for `auth`, `imports`, `patterns`,
  `settings` (closing audit, decision 7). Known byte-identical duplicates: `copyExtra.home.emptyEyebrow/emptyTitle/
  emptyLead/emptyIllustrationAlt` = `home.*`; `copyExtra.home.lead` = `dashboard.descriptionNoName`;
  `copyExtra.home.deltaFoot` = `dashboard.stats[0].foot`; `copyExtra.fixed.itemForms` = `fixedCosts.itemForms`;
  `copyExtra.fixed.eyebrow` = `app.fixedLong`.
- Open mappings for research: trend legend (`.trend-zero-note` / `.trend-no-threshold` literals vs `trend.zeroMarker`
  / `trend.noThreshold` / `trend.gridLabel` / `trend.amountLabel`), `TrendChart` min bar height (`trendBarHeight` 12 %
  vs kit 8 %), whether the `copyExtra.home.noThreshold` info panel survives, „· wzrost / · spadek” suffix vs
  `fixedCosts.decreased`, `.info-panel` placement for `noComparison` / `noChanges` / `noNew` on `/fixed`.
- Smoke strings that will move (`scripts/smoke.mjs`): „>Nie ma poprzedniego miesiąca do porównania.<”,
  „>Żaden koszt stały nie zmienił kwoty w tym miesiącu.<”, „>Dodaj najnowszy wyciąg<” (×2), „Ustaw próg na wzorcu…”,
  „względem”, the „Koszty stałe” card total/„podrożała” assertions.
- Follow-ups in scope (detail in `change.md` § Follow-ups triggered): `fixed.astro` `try` + `fixedCosts.readError`;
  S-14 F8 (`patterns/[...key].astro` `try`); S-14 F9 (`home.astro` stale comment); `FixedSection` `compact` prop;
  `monthIndex` into `src/lib/format.ts`; narrow `PanelTitle.astro`; close G36 follow-up (C5). Out of scope: one-off
  merchants as „nowy” (`d5Type`), D5 flip, Panel radius.
- `[human]` candidates: removed `/home` fixed-cost total (A2), removed import panel (A3), one-off merchants in the new
  „Nowe” count.
- No migration expected. No `DESIGN-GAP` added in this step.

## 6. Autonomous decisions

Full text with reversal conditions in `change.md` § Autonomous decisions. Summary:

1. Next step `/10x-research` (not the skill's default `/10x-plan`) — key-by-key copy map + smoke pins needed. Would
   change: an up-to-date copyExtra→content.json map already on disk.
2. One stat card; the fixed-cost total leaves `/home` (kit `.stats-single`). Would change: maintainer wanting the
   total back → card with `DESIGN-GAP`.
3. `ImportPanel` leaves `/home` (absent from round-3 `dashboard()`). Would change: research finding it in any round-3
   home view / `routes.md`.
4. S-14 F8 in scope (follow-up names S-15). Would change: plan size → new follow-up.
5. `PanelTitle.astro` adopted only on `/home` + `FixedSection`. Would change: kit `.panel-title` vs `.section-label`
   not fitting one component.
6. One-off merchants as „nowy” out of scope (rule). Would change: visual gate showing the „Nowe” count misleading.
7. Closing audit covers all `copyExtra` namespaces; non-identical rebinds outside S-15 views become follow-ups. Would
   change: nothing short of the maintainer narrowing M-3's closing criterion.
