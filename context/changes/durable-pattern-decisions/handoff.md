# Handoff — `durable-pattern-decisions` (slice S-05)

Written by the `research` step (2026-09-28, autonomous run `2026-09-28-s05-s06-s07`). Research is on disk
(`research.md`, status `complete`); no product code yet, `change.md` is `preparing`. What the next agent must not get
wrong: decisions must be applied **inside `derivePatterns` before grouping** (merge regroups, pin overrides `d5Type`),
and every S-04 consumer (`appliesTo`, `listOverview`, `patternDetail`, `ThresholdEditor`) already follows the
derived `type` — so no threshold reset is needed for a pinned type.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/durable-pattern-decisions`, cut from `main` at `f252112` (confirmed with `git branch --show-current`) |
| Commits on branch | 2 — `docs(durable-pattern-decisions): change identity (autonomous run)`, `docs(durable-pattern-decisions): research` |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `preparing` (set by `metadata-guard.mjs mark-researched`) |
| `## Progress` rows remaining | n/a — no `plan.md` yet |
| Working tree | Clean after the commit |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `context/changes/durable-pattern-decisions/research.md` | Research: storage shape, derivation hook, merge/type/exclude/rename semantics, migration + pgTAP shape, durability proof, kit binding, gaps, follow-up scope, open plan choices |
| `context/changes/durable-pattern-decisions/change.md` | Frontmatter only: `status: new → preparing`, `updated` |
| `context/changes/durable-pattern-decisions/handoff.md` | This file |

## 3. Verification

Docs-only step; no suites run (nothing executable changed). Baseline on `main` `f252112` per the agent contract
(inherited, unverified): lint 0 · astro check 0 (109 files) · vitest 141 (8 files) · pgTAP 76 (4 files) · smoke 77 PASS.

| Command | Result |
| --- | --- |
| `git branch --show-current` | `feat/durable-pattern-decisions` |
| `grep -rl "loadPatterns\|loadThresholds\|listOverview\|derivePatterns" src test scripts` | consumers: `src/pages/patterns.astro`, `src/pages/patterns/[...key].astro`, `test/unit/patterns.test.ts`, `test/unit/pattern-view.test.ts` (+ the lib files themselves) |
| Python read of `test/fixtures/ing/expected.json` | 30 oracle patterns (`normalization` 24, `import` 4, `user-merge` 1 `sportowo`, `user-exclude` 1 `przelew-konto-osobiste`); `Rachunek VAT` rows: 12, all `skipReason: other-account`, `rawMerchant: null` — cannot prove US-03 |
| No live DB experiment | none needed; schema follows `pattern_thresholds` |

## 4. Next command

`/10x-plan durable-pattern-decisions`

## 5. Open

Plan choices (evidence in `research.md` `## Open Questions`):

- Read ordering: pass decisions into `loadPatterns` (`src/lib/patterns/load.ts`) vs derive in the page after
  `Promise.all`; page the decisions read and `loadThresholds` (`src/lib/patterns/thresholds.ts`, must add `id` to the
  select) through `collectPages` — closes S-04 F5.
- Merge: surviving key = target; chains resolved at read with a cycle guard; absorbed key's threshold/decisions kept
  inert; picker = non-excluded roots (native select, kit `.select-field`); absorbed-key URL → redirect to root (rec.).
- Undo of merge/type/rename: no kit UI (modal lead promises it) → DESIGN-GAP, minimal or deferred.
- Rename cap (rec. 1–100), all-default decision row delete-or-keep, partial single-row upsert must keep untouched
  columns — assert in smoke (rename after exclude keeps `excluded`).
- Durability proof: unit test with decisions over the fixture = oracle 30 groups (update `expectedGroups` in
  `test/unit/patterns.test.ts`) + date-split derive; smoke second synthetic non-overlapping import after decisions
  (`scripts/smoke.mjs` `importPayload` pattern); pgTAP survival of `delete from imports` + cascade.
- Candidate DESIGN-GAPs from **G33** / K22: merge picker, rename field, type-change confirm, exclude confirm, undo,
  pending/error states, merged-pattern marking, absorbed-key URL; amend G4 status in `context/foundation/design-kit.md`;
  K11 strings only in `app.js` (modal eyebrow/h2/lead, „Akcje”, „Wykluczone”, count forms, „Przywrócony do analizy”,
  „przywrócony”, four toasts) go to `copyExtra`.
- `src/components/app/Badge.tsx` lacks `excluded` / `new` tones (kit `.badge.excluded`).
- Follow-ups firing: S-04 F5 (paging), dialog geometry G24 + undo-import F4 on `src/components/ui/dialog.tsx`
  `DialogContent` (rec. shared fix, re-screenshot `DeleteAccountDialog` / `DeleteImportDialog`), S-04 F11 (new fields
  local 8 px), S-04 impl-review F7 (`listOverview` island-ready items — fold).
- Known risk: normalizer drift (`src/lib/patterns/merchant.ts` `normalizeMerchant`) now orphans rows in two tables and
  `merged_into` values.

## 6. Autonomous decisions

- **Question derived from `change.md` without asking** (skill would ask when undefined). Chosen: the seven unknowns
  in `change.md` / previous §5. Would change: a maintainer re-scoping S-05.
- **One table, not alias + attributes.** Chosen: `pattern_decisions` with nullable `merged_into`. Rejected: separate
  alias table. Why: each absorbed key has exactly one outgoing edge; one paged read, one RLS set. Would change: a
  requirement to merge a key into several targets or to keep merge history.
- **No threshold reset on type pin.** Chosen: keep-but-ignore (S-04 decision 3). Rejected: delete on pin. Why: all
  consumers already follow derived `type`; un-pin restores. Would change: the maintainer wanting a pin to clear the
  threshold explicitly.
- **„suma miesięczna” = monthly over-limit sum.** Why: the only monthly sum PRD „Wynik” defines. Rejected: a general
  spending total (none exists or is specified). Would change: a PRD clarification naming a total spend figure.
- **Durability proof without a new fixture file** (unit split + smoke second synthetic import + pgTAP). Rejected: the
  VAT account (no matching merchants) and a new fixture CSV. Would change: the plan needing a browser-level US-03 demo
  on fixture data.
- **Recommend shared `DialogContent` fix over a local wrapper.** Why: two consumers, kit is the contract, a wrapper is
  accidental architecture. Would change: plan refusing the cross-view re-screenshot cost.
- **Kit worker delegated** (one general-purpose read-only agent for `app.js` / `styles.css` / `dialog.tsx` /
  `design-kit.md`); code, PRD and fixture read in the main context.
