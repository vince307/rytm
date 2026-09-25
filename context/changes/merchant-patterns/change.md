---
change_id: merchant-patterns
title: Lista wykrytych wzorców sprzedawców (S-03)
status: implemented
created: 2026-09-25
updated: 2026-09-25
archived_at: null
---

## Notes

Lista wykrytych wzorców sprzedawców (roadmap S-03).

Outcome (roadmap `### S-03`): użytkownik widzi listę wykrytych wzorców — sprzedawca (znormalizowany z opisu, z domeną
sprzedawcy dla płatności przez operatorów), typ stały/częsty zaproponowany przez aplikację, liczba wystąpień, suma,
kwota dla stałych; każda transakcja liczy się w dokładnie jednym wzorcu. PRD: US-01, FR-006, FR-007, guardrail
„determinizm”, Open Question 2 (lista operatorów). Reguły: `context/foundation/import-formats.md` D3 (operatorzy),
D5 (tolerancja stałego: max(15% mediany, 10 zł) od mediany), reguła 7 (sprzedawca surowy).

### Roadmap claims checked against the repo at `main` `d11f3ef` (2026-09-25)

| Claim (plan-time) | Repo now | Verdict |
|---|---|---|
| Prerequisite S-01 (import) done | `import_ing_statement()` RPC, `/imports/new` wizard, `/imports/result` shipped (archive `2026-09-24-ing-csv-import`) | holds |
| Prerequisite F-02 (fixture) done; „F-02 daje mierzalny wynik” | `test/fixtures/ing/expected.json` has `patterns[]` (30 keys; `resolvedBy`: 24 `normalization`, 4 `import`, 1 `user-merge`, 1 `user-exclude`; types 7 fixed / 23 frequent; occurrences 1–15) and `rows[].pattern` for all 206 imported debits; `npm run fixture:check` validates D5 against rows | holds — this is S-03's acceptance oracle |
| „z domeną sprzedawcy dla płatności przez operatorów” is a normalization concern | **Correction:** S-01 stores the raw ING `Dane kontrahenta` in `transactions.counterparty` (`buildImportPayload` in `src/lib/import/ing.ts` copies `v[2].trim()`), i.e. the operator name, not the domain. `expected.json` labels T04 `resolvedBy: "import"`, but no app code extracts the domain. Reference logic exists only in the fixture generator: `rawMerchant()` + `OPERATORS` in `scripts/fixture-ing.mjs`. S-03 must implement D3 itself (from `counterparty` + `title`), not assume import did it | corrected |
| „S-03 dodaje własną migrację tabeli sprzedawców/wzorców” | Only `imports`, `transactions` (+ `import_ing_statement`, `delete_own_account`) exist; no merchant/pattern table. But FR-007 + determinism are satisfiable as a pure function over `transactions` (no stored state), which also survives S-02 undo-import (import delete cascades transactions) without recompute. A table is only unavoidable once S-05 stores user decisions | **open — decide in research/plan**; not a given |
| Parallel with S-02 | S-02 `undo-import` failed at its `new` step in this run (branch `feat/undo-import` exists, unmerged). S-03 does not read anything S-02 would add | holds; no dependency |
| User-merge / user-exclude patterns | `sportowo` (T01) is one pattern in `expected.json` only after a user merge; T08 only disappears after user exclude — both are S-05. In S-03 T01 must show as **two** patterns and T08 as a visible pattern | scope note for the test oracle |
| `/patterns` view exists | `src/pages/patterns.astro` is the empty-state stub only (`ViewEmpty` + `copy.emptyViews.patterns`); sidebar/mobile nav already link `/patterns` | holds — S-03 replaces the stub for users with data |

### Design kit binding

Views (`design/rytm-os/prototype/`):

- `views/patterns.html` → `app.js` `patterns()` + `patternRows()` + `bindInteractions()` (search/sort): `.dash-title`,
  `.toolbar` (`.search-field`, `.select-field`), `.panel.table-panel` > `.table-wrap` > `table`, `.table-name` +
  `.merchant-mark`, `badge(type, 'fixed'|'frequent')`, `.table-foot`. **Primary view of this slice.**
- `views/patterns-empty.html` → `emptyView('patterns')` — already implemented; stays for users with no transactions.
- Not bound here (later slices): `views/pattern-wolt.html` / `patternDetail()` (S-04), `.excluded-section` and
  `applyPatternState` (S-05), columns `Próg` / `Ponad progiem` and status badges `nowy`/`zmieniony` (S-04 / S-06),
  `/home` „Co wraca najczęściej” (one view per change).

Keys (`design/rytm-os/react-kit/docs/content.json`, via `copy` in `src/content/copy.ts`):

- `patterns.title`, `patterns.description`, `patterns.columns[0..3]` (Sprzedawca, Typ, Wystąpienia, Suma),
  `patterns.searchPlaceholder`, `patterns.sortOptions`.
- `emptyViews.patterns.title`, `emptyViews.patterns.lead`, `emptyViews.cta`, `emptyViews.button` (existing empty state).
- `copyExtra.patterns.eyebrow` (existing, K11 gap copy).
- Candidate: `importFlow.result` + a pattern-count stat on `/imports/result` to close **G26** — decide in plan.

DESIGN-GAPs expected (register in `context/foundation/design-kit.md` when planned, never invent):

- **Kwota dla stałych** — FR-007 requires it, but the kit table's columns are Sprzedawca/Typ/Wystąpienia/Suma/Próg/Ponad
  progiem; no amount column and no key for it.
- **Type badge labels** — prototype renders `stały` / `częsty` from `data.patterns[].type` in `app.js`; checked:
  `content.json` `components` holds only `excluded`/`new`/`changed`/`back`, and `mobileNav.fixed` = „Stałe” is a nav
  label, not a badge — **confirmed gap** (copy goes to `copyExtra`, K-row).
- **Row link target** — kit rows link to `#/patterns/:id` (detail, S-04); without detail the link would 404.
- **Table foot** „5 wzorców · wszystkie miesiące” and „Pokaż więcej” live only in `app.js`, not `content.json`.

Next: `/10x-research merchant-patterns` — normalization rules (FR-006, D3, T02/T03), storage decision (derived vs
table), and the fixture-oracle test design need grounding before a plan.

## Autonomous decisions

Made by the `new` step of run `2026-09-25-roadmap-all` in place of asking a human.

- **Did not STOP after `change.md`** (the 10x-new skill says display the next step and wait). Chosen: continue to
  verification, handoff and commit. Rejected: waiting. Why: the run has no human in the loop (agent contract, rule 1).
  Would change: a maintainer message pausing the run.
- **Folder already existed (uniqueness check would error).** Chosen: work inside the existing
  `context/changes/merchant-patterns/` — it was written by this same run's earlier attempt (commit
  `docs(merchant-patterns): change identity (autonomous run)`), not by an unrelated change. Rejected: a new id
  (e.g. `merchant-patterns-2`), which would split the slice. Would change: the folder belonging to a different slice
  or to an archived change.
- **Next step = `/10x-research`, not the skill's default `/10x-plan`.** Why: three grounding questions — D3 domain
  extraction absent at import, derived-vs-stored patterns, adapting the `expected.json` oracle to S-03 (no user
  merge/exclude) — need codebase research. Rejected `/10x-frame`: the FR-007 framing is not suspect. Would change: the
  orchestrator's fixed chain skipping research (then `/10x-plan` reads this file directly).
- **Title in Polish**, matching the repo's Polish log. Would change: a maintainer preference for English titles.
- **Storage model left open** (roadmap claims an own migration). Why: a design trade-off, not a fact check; a pure
  derivation over `transactions` satisfies FR-007 + determinism and survives S-02 undo. Rejected: correcting the
  roadmap to "no table" now. Would change: research showing S-04/S-05 need stable per-pattern ids already in S-03.
- **DESIGN-GAPs listed as candidates, not registered** in `context/foundation/design-kit.md`. Why: gap ids should be
  assigned when the plan fixes what the view renders; `new` writes identity only. Would change: the contract
  requiring gap rows at `new`.
- **Scope = `/patterns` table only** (one view + global tokens). Rejected: `/home` „Co wraca najczęściej”, pattern
  detail, excluded section. Why: CLAUDE.md "one view"; those belong to S-04/S-05. Would change: the roadmap moving
  the home widget into S-03's outcome.
