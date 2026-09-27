# Handoff — `merchant-patterns` (slice S-03)

Written by the `impl-review` step (`/10x-impl-review merchant-patterns`, full plan, phases 1–3). Verdict APPROVED,
`MERGE: CLEAR`; one WARNING fixed in code (`collectPages`), one deferred to `follow-ups/review-fixes.md`; `change.md`
is `impl_reviewed`. The slice has UI (`/patterns`). The one thing the next agent must not get wrong: **never import
the fixture into the seeded `test@rytm.local`** — smoke step "patterns renders empty view" needs it empty; use a fresh
local account for the `lista` screenshots (the review step ran `npx supabase db reset`, so earlier fixture accounts
are gone).

## 1. State

| Item                         | Value                                                                                                                                                                     |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Branch                       | `feat/merchant-patterns`, cut from `main` at `d11f3ef`                                                                                                                    |
| Commits                      | 13 on top of `d11f3ef` (`d11f3ef..HEAD`): previous 11 + `5935e11` `fix(merchant-patterns): poprawki z przeglądu implementacji` + this step's `docs(merchant-patterns): …` |
| Pushed / PR / merged         | no / no / no                                                                                                                                                              |
| `change.md` status           | `impl_reviewed` (updated 2026-09-27)                                                                                                                                      |
| `## Progress` rows remaining | 1 (`grep -c '^- \[ \]' plan.md`) — 3.8 screenshots (Visual step)                                                                                                          |
| Working tree                 | clean apart from the maintainer's ` M .gitignore` and `?? .claude/skills/10x-autonomous-run/` (never staged)                                                              |

## 2. Artifacts

| Path                                                           | What it is                                                                                            |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `context/changes/merchant-patterns/reviews/impl-review.md`     | review report (APPROVED; F1–F8; gate arithmetic; reviewer breaks); ends with the `MERGE:` line        |
| `context/changes/merchant-patterns/follow-ups/review-fixes.md` | deferred items: F2 keyset paging, F3 tests, F5/F6/F7 tidy                                             |
| `src/lib/patterns/load.ts`                                     | `collectPages`: an empty page before the first page's `count` is reached now returns `{ error }` (F1) |
| `test/unit/patterns.test.ts`                                   | `collectPages` case `fails instead of returning a partial list when pages end short of the count`     |
| `context/changes/merchant-patterns/plan.md`                    | Progress 1.7 ticked (reviewer read of `normalizeMerchant`)                                            |
| `context/changes/merchant-patterns/change.md`                  | `status: impl_reviewed`, `updated: 2026-09-27`                                                        |
| `context/changes/merchant-patterns/handoff.md`                 | this file                                                                                             |

## 3. Verification

All observed in this step, on this branch. Baseline = `main` at `d11f3ef` (`agent-contract.md`).

| Command                                                                                             | Result                                                                                           |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `npm run lint`                                                                                      | 0 errors / 0 warnings (baseline 0, delta 0) — before and after the fix                           |
| `npx astro check`                                                                                   | 0/0/0, 89 files (baseline 82, +7 new source/test files)                                          |
| `npm run fixture:check` + `git diff --quiet d11f3ef..HEAD -- test/fixtures scripts/fixture-ing.mjs` | OK, fixture untouched                                                                            |
| `npm test`                                                                                          | 71/71 before fix → 72/72 after, 4 files (baseline 32/3: +39 implement, +1 review = +40; +1 file) |
| `npm run build`                                                                                     | Complete, before and after the fix                                                               |
| `npx supabase db reset && npx supabase test db`                                                     | 44/44, 2 files, PASS (baseline 44, delta 0 — no schema change)                                   |
| `BASE_URL=http://localhost:4398 npm run smoke`                                                      | 48 PASS / 0 FAIL before and after the fix (baseline 46, +2); :4398 killed after, :4321 untouched |

Deliberate breaks (reviewer's own):

- `normalizeMerchant` without rule 6 (`dropDoubledPrefix`) → 1 red (`PIEKARNIA KŁOSEK PIEKARNIA KŁOSEK ŁÓDŹ` case),
  restored via `git checkout --` → green. Meta-check: `fixture partition` stayed green because the fixture only has
  the doubled T02 form — rule 6 affects the display name, not the partition; recorded as F3.
- F1 fix reverted (`git stash` of `load.ts`) → the new partial-list case red; restored → 72/72. Meta-check: the fake
  reports `count` 7 then serves 5 rows, the exact concurrent-delete shape; only the new check turns it green.

## 4. Next command

Visual gate for `merchant-patterns`: screenshots of `/patterns` against `design/rytm-os/prototype/views/patterns.html` → `context/changes/merchant-patterns/screenshots/` + `reviews/visual-review.md` (dev server on :4399)

## 5. Open

- Manual Progress rows (human / Visual-step checklist):
  - [ ] 3.8 screenshots `lista` (1440 px), `lista-mobile` (375 px), `wyszukiwanie` (`kin` → `KINO ŚWIATŁO`,
        `KINOTEKA`, foot "2 wzorce"), `sortowanie-nazwa`, `pusty` (seeded `test@rytm.local`), `brak-wyników`; `błąd`
        code-reviewed only. For `lista`: register a fresh local account (no confirmation locally) and import
        `test/fixtures/ing/Lista_transakcji_nr_0000123456_010926.csv` via `/imports/new` — expect 31 rows, foot
        „31 wzorców · wszystkie miesiące”.
- Follow-ups: `follow-ups/review-fixes.md` — F2 keyset paging in `loadPatterns` / `collectPages` (trigger: S-02
  undo-import landing), F3 `normalizeMerchant` test cases (`S.C.A`, `http://`), F5/F6/F7 tidy (`tableCopy` slice,
  error log shape in `patterns.astro`, `GlyphProps` size union).
- DESIGN-GAPs (unchanged by this step): K17 (`PatternsTable` Kwota column), K18 (`patterns.astro` error branch),
  G28 (`PatternsTable` header comment).
- Carried risks: plan Known risks F7 (over-merge by `LEGAL_FORM` bare `SA` / `STORE_NUMBER` on real statements);
  roadmap `### S-03` Risk line still promises a migration — the archive step should correct it.
- S-04 / S-05 input: pattern identity = `merchantKey` (`src/lib/patterns/merchant.ts`).

## 6. Autonomous decisions

- **Triage without AskUserQuestion** (contract rule 1): every finding decided in place, recorded in the report's
  `Decision:` fields. Would change: a maintainer pausing the run to triage.
- **F1 fixed in code (WARNING, cheap and local)**: empty page before `count` → `{ error }` in `collectPages`.
  Rejected: full keyset rewrite now (changes the plan's pinned paging contract and tests; deferred as F2). Why: turns
  a silent partial list — a FR-007 violation — into the page's existing error state for ~4 lines. Would change: the
  maintainer preferring stale-but-complete reads over an error when an import is deleted mid-read.
- **F2 deferred to follow-ups, not fixed**: no defect with PostgREST today, `data_volume: small`. Would change:
  S-02 shipping first, or a `patterns read ended short of count` log appearing.
- **F3–F8 recorded only (OBSERVATIONs)**. Would change: the contract requiring observations to be fixed.
- **Ticked Progress 1.7** after reading `normalizeMerchant` against the plan's rule list (rules 1→7 in order, regex
  verbatim, no unnamed rule). Would change: a human reviewer disagreeing that rule 6 is "justified by the fixture"
  when it only changes the display name (F3).
- **Did not re-verify 3.9 visually**; accepted implement's HTTP evidence, corroborated by the 2 green smoke steps.
  Would change: the Visual step finding different fixture values.
- **Fix commit uses the CRITICAL message** `fix(merchant-patterns): poprawki z przeglądu implementacji` for a WARNING
  fix — the step rules name no other message. Would change: a message convention for warning fixes.
- **Overall verdict APPROVED** (two dimensions WARNING, ≤ 2 warnings, one fixed). Would change: the contract counting
  observations toward NEEDS ATTENTION.
- **Next command written as prose, not a slash command**: no `/10x-visual` skill exists; the run's pipeline names the
  step "Visual gate". Would change: a dedicated visual skill being added.
