---
change_id: kit-round-3-patterns
title: Wzorce, szczegół wzorca i dialog akcji według rundy 3 kitu
status: impl_reviewed
created: 2026-10-03
updated: 2026-10-03
archived_at: null
---

## Notes

Slice **S-14** (milestone M-3), roadmap `context/foundation/roadmap.md` `### S-14`. PRD: FR-007, FR-008, FR-009,
FR-010, FR-011 — presentation changes, not rules (M-3 scope anchor; PRD wins over kit copy, `[human]` row when they
collide). Branch `feat/kit-round-3-patterns`, cut from `main` at `5ed97f4` (after S-12). Written by the autonomous
run `2026-10-02-kit-round-3`, step `/10x-new`.

Views: `/patterns` (`src/pages/patterns.astro`, `PatternsTable.tsx`, `ExcludedPatterns.astro`), `/patterns/<key>`
(`src/pages/patterns/[...key].astro`, `ThresholdEditor.tsx`, `MonthSelect.tsx`), the actions dialog
(`PatternActionsDialog.tsx`, shared `src/components/ui/dialog.tsx`).

**Migration expected: no.** The kit's rename limit 60 (K31) would be a schema change (CHECK
`display_name … between 1 and 100` in `20260928120000_pattern_decisions.sql`); the slice keeps 100 and fills
`renameLong {n}` = 100 (F-04 follow-up, design-kit.md K31 „S-14 wypełnia `{n}` = 100”).

## Roadmap claims vs repo now

The `### S-14` block was written at plan time (2026-10-02, before F-04/S-13/S-12 shipped). Checked against the
branch on 2026-10-03:

| Roadmap claim | Repo now | Correction |
| --- | --- | --- |
| User sees a „Kwota” column for fixed patterns | Column exists (S-03). F-04 maps the kit headers onto the app body order via `tableHeaders` (`src/lib/patterns/table-columns.ts` `BODY_ORDER`: Suma before Kwota) | S-14 swaps the body cells to kit order (Kwota before Suma), then deletes `tableHeaders` and updates `test/unit/table-columns.test.ts` (F-04 follow-up) |
| „Pokaż więcej” on the list | Not built; `PatternsTable.tsx` header comment `DESIGN-GAP: G28 … „Pokaż więcej” … is S-14`. Kit `patterns()` shows `visible.slice(0,3)`, `showMorePatterns()` reveals all, button removed | New behaviour; page size is a plan decision (kit's 3 is demo data). Count line stays the full total; sort/search must act on the whole list (roadmap Risk stands) |
| Visible focus on search and sort | `field-styles.ts` `field` already has a focus-within ring (`ring-ink/8`) under `DESIGN-GAP: G29` | Rebind to the kit rule `.search-field:focus-within,.select-field:focus-within` (border ink + `0 0 0 3px var(--rytm-focus-ring)`, `rgba(32,47,64,.12)`); drop the G29 comment. Not new behaviour — a token/value change |
| Detail: „nie znaleziono” and „miesiąc bez wystąpień” states | Both exist since S-04 as app placeholders (`copyExtra.patterns.detailMissing` / `monthEmpty`, `DESIGN-GAP: G31` in `[...key].astro`) | Rebind to `patternDetail.notFound` / `noOccurrences`; layout from kit views `pattern-not-found.html` / `pattern-no-occurrences.html` |
| Sum with month declension | Exists: `fillMonthLocative(x.sumLabel, month, x.monthsLocative)` (F-04 helper, „we wrześniu”) | Rebind template to `patternDetail.sumLabel`; locatives stay through `fillMonthLocative` — kit `monthNames` gives „w wrześniu” (K30) |
| Sequence description for screen readers | Exists: `copyExtra.patterns.sequenceSummary` „{n} {occurrences}, {over} ponad próg” with plural forms | Kit `patternDetail.sequenceSummary` „{within} wystąpień w ramach progu, {over} ponad próg.” has no plural forms („1 wystąpień”) — research decides: kit string vs keeping plural (likely a new K-row) |
| Threshold validation and save error | Exist: `copyExtra.patterns.thresholdInvalid` (names the decimals rule), `thresholdSaveError` | Rebind to `threshold.invalid` / `threshold.saveError` (K32: `patternDetail.thresholdError/thresholdInvalid` are duplicates — read `threshold.*`). Kit `invalid` drops the „two decimals” hint — research checks the validator stays the same |
| Merge with picker and „no patterns” state | Exist since S-05: `mergeLabel`, `mergeSubmit`, `mergeNone` (G33 placeholders) | Rebind to `patternActions.mergeTitle/mergeLead/mergeEmpty/mergeInvalid`; kit views `pattern-actions-merge-empty.html`, `pattern-actions-merge-error.html` |
| Rename with validation | Exists: `renameLabel/renameHint/renameSubmit`, `nameInvalid` „…najwyżej 100 znaków.”; `parseDisplayName` caps at 100 | Rebind to `renameTitle/renamePlaceholder/renameLong` with `{n}` = 100 (not `renameMaxLength` 60, K31); kit view `pattern-actions-rename-error.html` |
| Type change and exclude | Exist (S-05), toasts in `copyExtra` (K22) | Rebind to `patternActions.typeChanged/excludedToast/eyebrow/title/lead/closeLabel` |
| Merged variants with undo | Exist: `mergedLabel` „Scalone warianty”, `unmerge`, `unmerged` toast | Rebind to `patternActions.mergedVariants` „Połączone nazwy” / `undoMerge`; the kit has no „Scalenie cofnięte.” key — stays `copyExtra` (gap row) |
| Risk items: K11 (patterns), K17, K21, K22, G28, G29, G31, G33 | design-kit.md round-3 table: K17/K22/G28/G29 `delivered`, K21/G31/G33 `partial`, K11 `partial` | Also in play: K31 (rename limit), K32 (duplicate keys), K30 (locative); G32 remainder via S-12 F1. G33 open point: `patternActions.lead` points to non-existent „ustawienia wzorca” — PRD/app have no such screen (decision for research) |
| (not in roadmap) status badges | Kit `patternRows()` renders `badge(p.status)` „nowy” / „zmiana kwoty” in the Ponad-progiem cell; copy `components.new/changed`; tokens `.rytm-badge--new/changed`. App omits them (`DESIGN-GAP: G28`), `Badge` has only `tone="new"` | Kit now draws them and `fixedOverview` drives them — candidate scope (S-06 follow-up, triggered); decided below |
| (not in roadmap) merchant mark token | `merchant-mark.ts` uses `bg-paper-soft`; kit `--rytm-merchant-mark: var(--rytm-paper-soft)` | Same colour — value already matches; only the comment's „nearest token” wording changes (G28) |
| No migration | Confirmed: no kit item needs schema; K31 kept at 100 | — |

## Kit binding

Kit views (`design/rytm-os/prototype/views/`, rendered by `prototype/app.js` `patterns()`, `patternRows()`,
`showMorePatterns()`, `patternDetail()`, `thresholdEditor()`, `modal('patternActions'|…)`; CSS `prototype/styles.css`):

| View | App target |
| --- | --- |
| `patterns.html` | `/patterns` list: kit column order, „Pokaż więcej”, status badges, focus-within, merchant mark, „Wykluczone” |
| `patterns-empty.html` | `/patterns` empty state (`emptyView('patterns')`) |
| `pattern-wolt.html` | `/patterns/<key>` detail, threshold editor, sequence, transactions |
| `pattern-not-found.html` | detail „nie znaleziono” |
| `pattern-no-occurrences.html` | detail month without occurrences |
| `pattern-actions.html` | actions dialog (merge / type / rename / exclude) |
| `pattern-actions-merge-empty.html` | merge picker with no candidates |
| `pattern-actions-merge-error.html` | merge rejected |
| `pattern-actions-rename-error.html` | rename too long |

`content.json` keys bound: `patterns.*` (`title`, `description`, `columns`, `searchPlaceholder`, `sortOptions`,
`countForms`, `showMore`, `excluded`, `merchantMark`); `patternDetail.*` (`back`, `sumLabel`, `transactions`,
`rawDescription`, `notFound`, `noOccurrences`, `sequenceSummary`, `typeFixed`, `typeFrequent`, `monthSelect`,
`sequenceWithin`, `sequenceOver`; `monthNames` NOT read — K30, `thresholdError/thresholdInvalid` NOT read — K32);
`threshold.*` (all 17 keys); `patternActions.*` (except `renameMaxLength` — K31, and the `error*` duplicates — K32);
`components.new/changed/success/error/excluded`. Full `copyExtra.patterns` → `content.json` map: research.md of
`context/archive/2026-10-02-kit-round-3-intake/`.

Expected to stay `copyExtra` (kit has no key; each keeps or gets a `DESIGN-GAP` + gap row): `unmerged` toast,
`thresholdSum` (`{amount} / miesiąc`), `upload` „+ Wgraj CSV” and `sortPrefix` (literal in `app.js`), `detailEyebrow`,
`overInMonth` (G31 „ponad progiem” outside the reference month unresolved), plural forms for occurrences — research
confirms each against `content.json`. No kit view → `DESIGN-GAP`, never invented.

## Follow-ups triggered

Grep of `context/archive/*/follow-ups/review-fixes.md` `Trigger:` lines naming S-14 or a condition S-14 meets:

| Source | Item | Trigger | Take |
| --- | --- | --- | --- |
| `2026-10-02-kit-round-3-intake` | Kit column order (K17), drop `tableHeaders` | S-14 | **In scope** |
| same | Rename `{n}` = 100, not 60 (K31) | S-14 | **In scope** (no migration) |
| same | `--rytm-focus-ring` focus-within (G29) | S-14 | **In scope** |
| same | Month template → `fillMonthLocative` (K30) | any slice touching a month template | **In scope** — `sumLabel`/`overInMonth` stay on the helper |
| `2026-10-03-kit-round-3-auth-settings` F1 | `field-styles.ts` `field` `rounded-lg` → `rounded-[8px]`; drop G32 comments in `ThresholdEditor` / `PatternActionsDialog` | S-14 | **In scope** — `field` is read only by `PatternsTable` and `MonthSelect` (pattern views) — no blast radius outside S-14 |
| same F2 | `DialogContent` → kit `.modal` round 3: 26 px padding (≤ 560 px: 22×18), radius 12 | S-14 | **In scope** — shared; visual gate must shoot all three dialogs (patterns actions, `DeleteImportDialog`, `DeleteAccountDialog`) |
| `2026-09-27-pattern-threshold-over-limit` F3 | One shared `focusRing` / `fieldFocusWithin` export from `field-styles.ts` (button, BackLink, PatternsTable) | next change that alters the focus ring | **In scope** — G29 alters it; one export, screenshots of touched views |
| same F11 / `2026-09-28-durable-pattern-decisions` F4 remainder | 8 px kit field sweep; `fieldBox` wrapper duplicated in `PatternActionsDialog` | next UI change to a form-field view / third 8 px field | **In scope** together with S-12 F1 |
| `2026-09-28-durable-pattern-decisions` F5 | Rename field prefilled with the derived name freezes it as `display_name` | next change to `PatternActionsDialog` / G33 kit round drawing the rename field | **In scope** — kit draws `renamePlaceholder` „Nowa nazwa”; pass stored `displayName`, empty when null |
| same F6 / `2026-09-28-over-limit-trend` | Excluded source can be merged (`validateMerge`) | next change to `/patterns/<key>` or product feedback | **Out of scope** — a rule change (M-3 changes presentation, not rules); stays open |
| same F7 | `unmerge` not scoped to root | a UI that lists chain members / wrong success in visual gate | **Out of scope** unless the visual gate reproduces it |
| same F9 | pgTAP coverage of `pattern_decisions` | next migration touching `pattern_decisions` | **Not triggered** (no migration) |
| `2026-09-28-fixed-cost-changes` | `/patterns` status badges „nowy” / „zmiana kwoty” + `Badge` `tone="changed"` (G28) | next change to `/patterns` or `PatternsTable.tsx` | **In scope** — kit round 3 draws them (`components.new/changed`, `.rytm-badge--new/changed`); driven by `fixedOverview`, no new rule |
| same | Badge `new` tint vs kit `#EFE4D1` | kit providing a new/changed token, or the G28 `changed` tone | **In scope** — `--rytm-badge-soft` exists (F-04 note says S-15 for the `/fixed` tint; S-14 adds it to `Badge` once, both views benefit) |
| same / `2026-09-28-over-limit-trend` | `patternTxs` id drift becomes a 500 on `/patterns` (no `try`) | next change touching those pages | **In scope, small** — wrap the pure assembly in `try`/`catch` → `components.error` like `/home` |
| `2026-09-28-over-limit-trend` | Month-index parse in two styles | next change touching `patterns/[...key].astro` | **Already resolved for patterns** (`fillMonthLocative` in `src/lib/format.ts`); only `home.astro` `monthIndex` remains — S-15 |
| same | Panel-title markup inline in six places | next change that adds a panel title | **Conditional** — only if S-14 adds a panel title |
| `2026-09-28-fixed-cost-changes` | Panel radius 20 px vs kit 12 px | global-token pass on radii, or next change to `Panel.astro` | **Out of scope** unless the plan touches `Panel.astro`; `PatternsTable` `rounded-xl` is part of the same app-wide decision |
| `2026-09-27-pattern-threshold-over-limit` F4 / S-05 open | Threshold endpoints redirect an invalid form to `/patterns` | next change touching `threshold.ts` / `threshold/delete.ts` | **Conditional** — only if S-14 edits those endpoints (copy rebind should not) |
| `2026-10-03-kit-round-3-auth-settings` F3 | Landing section head on phone | next slice touching public pages | **Not triggered** |

## Autonomous decisions

1. **Next step `/10x-research`, not `/10x-plan`.** Chosen: research. Rejected: plan directly (the skill default).
   Why: most of the roadmap's "new" behaviour already exists as app placeholders; the work is a key-by-key rebind
   across the whole `copyExtra.patterns` block, the smoke strings that pin them (`scripts/smoke.mjs`), and three
   shared-component touches (dialog, field, focus ring) whose blast radius needs a file-level map. The orchestrator
   also names research. What would change it: a complete copyExtra→content.json map for patterns already in a
   handoff (the intake research.md has one, but it predates S-12/S-13 edits to `copy.ts`).
2. **Status badges „nowy” / „zmiana kwoty” in scope.** Chosen: include. Rejected: leave the G28 omission. Why: kit
   round 3 draws them in `patternRows()` with content.json copy and tokens, `fixedOverview` already computes the sets
   (no rule change), and the S-06 follow-up triggers on this change. What would change it: research finding that
   `fixedOverview` cannot run on the `/patterns` data without a second read, or the plan exceeding a sensible size —
   then split into a follow-up with `Trigger: S-15`.
3. **Rename limit 100, not 60; no migration.** Chosen: `{n}` = 100. Rejected: 60 (schema change, existing names up to
   100 would violate a tighter CHECK; contradicts "no migrations" for M-3). Why: F-04 follow-up and design-kit.md K31
   already record it. What would change it: the author/maintainer choosing 60 in round 4 — then an expand/contract
   migration in its own change.
4. **Shared dialog padding/radius (S-12 F2) in scope, despite touching `/imports` and `/settings` dialogs.** Chosen:
   include, gated by screenshots of all three dialogs. Rejected: one-view-only. Why: the follow-up names S-14
   explicitly; it is a global-token alignment to the kit `.modal`, not a redesign. What would change it: the visual
   gate showing a regression in a non-pattern dialog that cannot be fixed by the shared rule.
5. **Out of scope: S-05 F6 (excluded source merge) and F7 (unmerge scoping).** Why: rule changes; M-3 changes
   presentation. What would change it: the visual gate or product feedback reproducing a wrong outcome.
6. **`patternActions.lead` („…w ustawieniach wzorca”, G33).** Not decided here — research checks whether the detail
   page reads as „ustawienia wzorca”; if not, keep the kit string with a `[human]` row or keep `copyExtra` wording.
   Recorded so the plan decides explicitly.
