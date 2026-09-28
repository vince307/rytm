# Handoff — `fixed-cost-changes` (slice S-06)

Written by the `implement` step (`/10x-implement fixed-cost-changes phase 2`, autonomous run
`2026-09-28-s05-s06-s07`). Phase 2 (`fixedOverview` — the pure change/new rule, unit-tested, no caller) is
implemented, gated and committed. The one thing the next agent must not get wrong: **`derivePatterns` keys on
the normalized/lower-cased display name, not on `expected.json`'s hand-authored oracle slugs** — T16's real key is
`"siłownia ruch"` (name `"SIŁOWNIA RUCH"`) and T08's is `"jan przykładowy"` (not `"silownia-ruch"` /
`"przelew-konto-osobiste"`); `test/unit/fixed-overview.test.ts`'s F-02 case asserts the real keys.

## 1. State

| Item | Value |
|---|---|
| Branch | `feat/fixed-cost-changes`, cut from `main` at `3706508` |
| Commits | 9 on this branch: identity, research, plan, plan review, fixture (p1, `e0d8e4d`), phase-1-sha docs (`9362e4e`), phase-1 handoff (`48604cb`), `feat(fixed-cost-changes): fixedOverview — the pure change/new rule (p2)` (`d827e00`), phase-2-sha docs (`f77de29`) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` (unchanged this step) |
| Roadmap | S-06 `in-progress` (unchanged this step — already set by phase 1) |
| `## Progress` rows remaining | 23 (`grep -c '^- \[ \]' plan.md`): Phase 1 automated done, 1.8 `[reviewer]` open; Phase 2 automated (2.1–2.8) done this step, 2.9 `[reviewer]` open; Phases 3–4 (22 rows) untouched |
| Working tree | clean after both commits (`.claude/skills/10x-autonomous-run/scripts/tree-clean.sh` → `CLEAN`) |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/lib/patterns/fixed.ts` (new) | `fixedOverview(patterns, rows)` — the pure FR-012/US-04/D6 rule. Header comment states R/P, `hasComparison`, the candidate filter, "new wins over changed", the double-charge rule (latest occurrence in R vs its immediate predecessor in any month) and the lapsed/excluded/frequent exclusion. Imports only `over-limit.ts`, `view.ts`, `@/types` |
| `src/lib/patterns/over-limit.ts` | `previousMonth(yearMonth)` added beside `monthOf` — calendar predecessor, plain string arithmetic |
| `src/lib/patterns/view.ts` | `patternTxs` / `indexById` changed from module-private to `export` (signatures unchanged); header comment names `fixed.ts` as a consumer — no duplicated join |
| `src/lib/format.ts` | `formatSignedMoney(minor)` added — `"+6,00 zł"` / `"−4,00 zł"` (U+2212) / `"0,00 zł"`, built on `formatMoney` |
| `test/unit/fixed-overview.test.ts` (new) | 16 cases: rise/decrease/unchanged, double charge (rise-first, rise-second, up-then-down), new, new-wins-over-changed, gap-month, one-month, excluded/frequent/pinned/lapsed, no-rows, same-day id tiebreak + shuffle, section order, and the F-02 fixture (kinoteka `+400`, `siłownia ruch` new, `jan przykładowy`/`kawa-testowa.pl`/`muzykalnia` unchanged, `kurs-przyklad.pl`/`phu "przykład" jan testowy` absent) |
| `test/unit/format.test.ts` | `formatSignedMoney` cases (600, −400, 0, 123456) added after the `formatMoney` describe block |
| `test/unit/over-limit.test.ts` | `previousMonth` cases (`2026-08`→`2026-07`, `2026-01`→`2025-12`, `2026-10`→`2026-09`) added after `referenceMonth` |
| `context/changes/fixed-cost-changes/plan.md` | Progress 2.1–2.8 ticked with sha `d827e00` (appended in the follow-up docs commit `f77de29`, same convention as phase 1); 2.9 (`[reviewer]`) left open |
| `context/changes/fixed-cost-changes/handoff.md` | This file |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/fixed-cost-changes` (observed) |
| `npm test` | 213 passed, 12 files — baseline 190/11 (plan Phase 1 baseline), delta +23 tests / +1 file (observed, twice — after writing and after the deliberate-break restores) |
| `npm run lint` | 0 errors (observed; one `lint:fix` pass needed for two prettier wraps, then clean) |
| `npx astro check` | 0 errors, 122 files — baseline 120/0 (plan: +2 expected, `fixed.ts` + `fixed-overview.test.ts`), delta 0 errors (observed) |
| `npm run fixture:check` | OK (observed) |
| `npm run build` | passes (observed) |
| `npx supabase db reset && npx supabase test db` | Files=5, Tests=102, Result: PASS — baseline 102/5, delta 0 (observed, sandbox disabled; no DB mutation happened this phase, so one reset sufficed) |
| `ASTRO_DEV_BACKGROUND=1 npx astro dev --port 4398` + `npm run smoke` | 111 PASS / 0 FAIL — baseline 111, delta 0 (observed twice, sandbox disabled); port 4398 killed after each run |
| Deliberate break 2.5 (D6 window): `new` condition changed from "no occurrence in P" to "no occurrence before R at all" | case 8 ("new wins…") FAILed (expected `new` row, got none); case 7 (plain new, no earlier occurrence at all) stayed green — meta-check confirmed the red isolates the P-window, not new-detection itself. Restored; suite green again |
| Deliberate break 2.6 (double charge): the change loop reduced to comparing only the last tx in R with its immediate predecessor | case 4 (rise on the *first* of two R charges) FAILed (expected a changed row, got none); cases 1 and 5 (single-occurrence rise, rise-on-second) stayed green — meta-check confirmed the red isolates "latest change among R's occurrences", not the rule generally. Restored; suite green again |
| Deliberate break 2.7 (exclusion): dropped `!pattern.excluded` from the candidate filter (kept `type !== "fixed"`) | case 11's excluded pattern appeared in `changed` alongside `pinned`; the `frequent` twin stayed absent — meta-check confirmed the red is the exclusion filter, not the type filter. Restored; suite green again |
| Deliberate break 2.8 (comparison guard): `hasComparison` hardcoded to `true` | cases 9 and 10 (gap-month, one-month) FAILed on `hasComparison`; case 16 (F-02 fixture, which does have a real P) stayed green — meta-check confirmed the red proves the gap/one-month guard, not the fixture path. Restored; suite green again |
| Post-restore re-run: lint / test / astro check / fixture:check / build / pgTAP / smoke | all green again (observed, matches the row above) |

## 4. Next command

`/10x-implement fixed-cost-changes phase 3`

## 5. Open

- **Key naming lesson** (see intro): any Phase 3/4 code or test referencing fixture pattern identities by name must
  use `derivePatterns`' real keys (`merchantKey` output — normalized display name, lower-cased), never
  `expected.json`'s oracle slugs. Confirmed this step: `kinoteka` and `kawa-testowa.pl`/`muzykalnia`/
  `kurs-przyklad.pl` happen to coincide (domain-like counterparties), but `siłownia ruch`, `jan przykładowy` and
  `phu "przykład" jan testowy` do not.
- **Manual-only Progress rows carried forward (human checklist, unchanged from phase 1 handoff):** 1.8
  `[reviewer]`, 2.9 `[reviewer]` (this phase, still open), 3.9, 4.9 `[reviewer]` — `/10x-impl-review`; 4.10
  `[human]` — product owner confirms plan decision 7 (D5 flip); 4.11, 4.12 `[visual]` — the Visual step.
- **Phase 3 starts here**: `src/pages/fixed.astro` still renders the static `PageTitle` + `ViewEmpty` placeholder
  unconditionally — `fixedOverview` has no caller yet. Phase 3 contract (plan): `createClient` → `loadPatternData`
  → `fixedOverview(patterns, rows)`, two new components (`FixedSection.astro`, `FixedRow.astro`), the "Zmieniły
  kwotę" and "Bez zmian" sections, copy gaps K23/G34, and 6 new smoke steps.
- **Smoke anchors** (Phase 3+, unchanged from phase 1 handoff): use `>text<`; if `eslint --fix` wraps an element in
  `FixedRow.astro` / `FixedSection.astro`, switch to bare text keeping each positive/negative pair (plan review F1,
  agent-contract smoke-assertion note). `/fixed` has no island, so no serialized-props false positive either way.
- **DESIGN-GAPs to add with the code (Phase 3–4, unchanged):** K23 (`copyExtra.fixed` row copy), G34 (states, incl.
  `Badge.tsx` `new` tone), G5 amended, K9 note.
- **Follow-ups to write in Phase 4** (`context/changes/fixed-cost-changes/follow-ups/review-fixes.md`, does not
  exist yet): D5 flip, one-off merchants as „nowy”, G28 `/patterns` badges, S-07 `/home` „N pozycje podrożały” from
  `fixedOverview().changed`.
- No new risk introduced by this phase; `Known risks` in plan.md (D5 flip, one-off merchants, astro-check count,
  smoke text anchors, badge `new` tint) all still apply unchanged to later phases.

## 6. Autonomous decisions

- **Exec mode: implemented Phase 2 directly in this context, not delegated to a subagent.** Rejected: delegating
  per the skill's default `AskUserQuestion` prompt (forbidden by the agent contract). Why: the pure-function phase
  is self-contained (one new file, two small exports, unit tests) and doing it directly let me verify all four
  deliberate breaks and their meta-checks firsthand. Would change: Phase 3, which adds two Astro components and
  touches the page — delegation becomes the better default there per the phase-1 handoff's own note.
- **Fixture test keys taken from the actual `derivePatterns` output, not `expected.json`'s oracle slugs.** Rejected:
  writing the F-02 unit case against the oracle's `key` strings on the assumption they'd match `MerchantPattern.key`
  (they didn't for two of five patterns under test). Why: `patterns.test.ts`'s own header comment already warns the
  oracle's keys are hand-authored slugs, never the real grouping key; I verified the real keys by running the
  fixture through `derivePatterns` directly (a throwaway test, discarded) before writing the assertions. Would
  change: nothing — this is a factual correction, not a judgment call.
- **Deliberate-break edits applied directly to `src/lib/patterns/fixed.ts` and restored via `Edit`, not
  `git checkout --`.** Why: the agent contract prohibits `git checkout --` on a file holding uncommitted phase work
  (which `fixed.ts` was, being new/untracked at break time); restoring the exact prior string by hand is byte-exact
  here since I wrote the original. Would change: nothing binds this differently for a later phase's breaks.
- **SHA-append done as a separate follow-up docs commit** (`f77de29`), matching phase 1's precedent and the run's
  stated allowance. Rejected: leaving 2.1–2.8 without a sha. Why: consistent with the established pattern on this
  branch; the phase commit itself cannot know its own sha in advance. Would change: nothing binds this either way
  for Phase 3, which could fold the sha line into its own phase-start edit instead if preferred.
- **No `change.md` / roadmap edit this step.** Why: both already reflect `implementing` / `in-progress` from Phase
  1; no phase-boundary transition (e.g. to `plan_reviewed`, or a status change) applies mid-plan. Would change: a
  contract rule requiring a per-phase `updated` bump on `change.md` (none found).
- **Dirty-path check before staging: none found.** `git status --porcelain` after all edits and after each restore
  showed only the 7 files this phase touched (plus, before the follow-up commit, only `plan.md`) — no
  `AskUserQuestion` needed, no unrelated dirty paths to report; `tree-clean.sh` confirmed `CLEAN` before the
  handoff was written.
