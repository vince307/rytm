# Handoff — `santander-card-merchants` (slice S-11)

Written by the `/10x-implement` Phase 1 step of run `2026-10-01-m2-santander`. Phase 1 (safety net) is implemented,
gated and committed; no Santander normalisation rule exists yet (that is Phase 2). The next agent must trust the
`ING_KEYS` pin in `test/unit/patterns.test.ts` as the literal text to preserve — it is pre-generated data, not a
helper to "simplify" into a dynamic computation (that would make the pin a tautology).

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/santander-card-merchants`, cut from `main` at `9f63fd9` |
| Commits | 6 on the branch: `… change identity`, `… research`, `… plan`, `… plan review`, `feat(santander-card-merchants): safety net — ING key-text pin, accountLabel fix (p1)` (`35f89ae`), `chore(santander-card-merchants): record phase 1 commit sha in Progress` (`1ab577d`) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | 24 (`grep -c '^- \[ \]' plan.md`); Phase 1's 5 automated rows (1.1–1.5) ticked with sha `35f89ae`; 1.6 ([reviewer]) left unticked — not mine to verify |
| Roadmap | S-11 flipped `planning` → `in-progress` in `context/foundation/roadmap.md` (At-a-glance row + content block), committed in `35f89ae` |
| Working tree | clean (`git status --porcelain` empty), `git branch --show-current` = `feat/santander-card-merchants` |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `test/unit/patterns.test.ts` | New `describe("ING merchant keys — text pin (S-11)")`: literal `ING_KEYS` record (32 distinct ING-oracle raw merchants → key, generated via a `jiti`-loaded run of `merchantKey(rawMerchant(...))` on this branch before any rule change, never hand-typed) plus two coverage/equality tests; two new `normalizeMerchant` `it.each` rows closing `context/archive/2026-09-25-merchant-patterns/follow-ups/review-fixes.md` F3 (standalone `S.C.A`, `http://` scheme) |
| `src/lib/import/banks.ts` | `accountLabel`: `template.replace("{name}", name)` → `template.replace("{name}", () => name)` (S-10 follow-up F4 — a `$&`/`$1` account name no longer expands) |
| `test/unit/banks.test.ts` | New case: `accountLabel` with a name containing `$&`/`$1` renders verbatim |
| `context/changes/santander-card-merchants/plan.md` | `## Progress` 1.1–1.5 ticked, each stamped `— 35f89ae` |
| `context/changes/santander-card-merchants/change.md` | `status: implementing` |
| `context/foundation/roadmap.md` | S-11 `Status` → `in-progress` (At a glance + content block) |
| `context/changes/santander-card-merchants/handoff.md` | This file |

## 3. Verification

All observed in this step, on `feat/santander-card-merchants` after the Phase 1 edits, before the commit (gate order
per the implement skill's ritual).

| Command | Result |
| --- | --- |
| `npx vitest run test/unit/patterns.test.ts test/unit/banks.test.ts` (criterion 1.1, first pass) | 55 passed |
| `git diff --exit-code main -- test/fixtures scripts src/lib/patterns` (criterion 1.4) | exit 0 — empty, no rule/fixture/script touched |
| Deliberate break 1 (criterion 1.2): `merchantKey` → `.replace(/ /g, "-")` | F-02 `fixture partition` test: 1 passed, 47 skipped (stayed green); new ING pin test: 1 **failed** (`'stacja-paliw-drogowskaz'` ≠ `'stacja paliw drogowskaz'`) — meta-check holds: the partition cannot see a consistent key rename, the pin can. Restored via `git checkout -- src/lib/patterns/merchant.ts`; re-ran `patterns.test.ts`: 48 passed |
| Deliberate break 2 (criterion 1.3): `accountLabel` reverted to `template.replace("{name}", name)` | `banks.test.ts`: new `$&`/`$1` case **failed** (`'ING · Konto {name} $1 Testowe'` ≠ `'ING · Konto $& $1 Testowe'`); restored via `git checkout -- src/lib/import/banks.ts`; re-ran: 7 passed |
| `npm run lint` | first run: 1 error (`non-nullable-type-assertion-style` on the pin test); fixed to a type-guarded `.filter`, then a prettier formatting error on the same line, fixed; final run: 0 errors (attempt 2/2 convergent) |
| `npx astro check` (criterion 1.5) | 0 errors, 0 warnings, 0 hints, 144 files — unchanged vs baseline |
| `npm run fixture:check` | `fixture:check ing OK`, `fixture:check santander OK` — unchanged vs baseline |
| `npm test` | 296 passed (18 files) — baseline 291 + Δ5 (2 ING-pin tests + 2 `normalizeMerchant` F3 rows + 1 `accountLabel` F4 case), file count unchanged |
| `npm run build` | server build OK, Vercel adapter bundling OK (pre-existing sitemap `site`-option warning, unrelated) |
| `npx supabase db reset` then `npx supabase test db` (sandbox disabled — Docker) | all 6 migrations applied; pgTAP `Files=6, Tests=119, Result: PASS` — unchanged vs baseline (Δ0, no schema touched) |
| `astro dev --port 4398` + `BASE_URL=http://localhost:4398 npm run smoke` (sandbox disabled — network) | `All smoke steps passed`, 147 PASS / 0 FAIL — unchanged vs baseline (Δ0); dev server killed afterward, `lsof -ti :4398 -ti :4399` empty |

Full local gate: **green**, matches contract baseline with the expected vitest delta, everything else Δ0.

## 4. Next command

`/10x-implement santander-card-merchants phase 2`

## 5. Open

- Carried from the plan-review handoff, unchanged (not touched in Phase 1): Known risks in `plan.md` (`NR` guard
  partial for ≥ 3 digits in `normalizeMerchant` `STORE_NUMBER`; `CITY_PREFIX` pop leaving one generic word; cityless
  `<AGG> *<MERCHANT>` tails; min-1-token merge risk; ASCII-only cross-bank join).
- `## Progress` row **1.6 [reviewer]** — not ticked, not mine: "`ING_KEYS` generated from pre-change code, no
  real-export value." True by construction (generated via `scratchpad/gen-ing-keys.mjs`, a `jiti`-loaded run of
  `rawMerchant`/`merchantKey` over the ING fixture only, deleted after use, never touched the real export symlink
  dir) but needs the human/reviewer tick, not an implementer self-tick.
- [human] rows (Phase 4, unchanged, not due yet): 4.8 F-03 3.9, 4.9 S-10 6.11, 4.10 real-export owner check, 4.11
  min-1-token acceptance.
- Follow-ups: `follow-ups/review-fixes.md` FU1–FU5 unchanged.
- Phase 2 next: implement `src/lib/patterns/santander-card.ts` (ATM/quotes/city rules 1–3 and 5), hook it into
  `src/lib/patterns/merchant.ts` `rawMerchant`, new `test/unit/santander-card.test.ts` and
  `test/unit/santander-patterns.test.ts` — see plan.md Phase 2 verbatim.
- DESIGN-GAP: none. Migration: none.
- ARTIFACT GAP: none — both real-export paths and the symlink dir named in the agent contract were not needed for
  Phase 1 (no normalisation rule written yet).

## 6. Autonomous decisions

1. **Exec mode: implemented directly in this context, no subagent delegation.** Rejected: delegating Phase 1 to a
   general-purpose subagent. Why: the phase is three small, tightly-coupled edits (one new test describe block, one
   one-line production fix plus its test) in files I had to read in full anyway to generate the literal `ING_KEYS`
   pin; delegation would have cost a round trip for no context saved. Would change: a later phase whose Changes
   Required span many unfamiliar files (Phase 2/3 are larger — may delegate then).
2. **Never called `AskUserQuestion`** (exec-mode choice, commit-message approval, dirty-path prompt, next-phase
   decision) — run contract rule 1. Decided and proceeded each time; recorded here instead.
3. **`ING_KEYS` generated via a throwaway `jiti` script, run from the repo root as `./__gen-ing-keys.mjs` and
   deleted immediately after capturing its stdout.** Rejected: computing the pin dynamically inside the test (would
   make the assertion `merchantKey(rawMerchant(x)) === merchantKey(rawMerchant(x))`, a tautology that can never pin
   anything) or hand-typing the 32 values from memory (error-prone, and the reviewer row 1.6 explicitly asks this
   not be hand-typed). Would change: nothing — this is what the plan's Contract literally specifies.
4. **Two commits instead of one** (`35f89ae` feat, `1ab577d` chore) **for this phase.** The task line says "ONE
   commit… (p1)"; the implement skill's own ritual writes the commit sha back into `## Progress` *after* the commit
   exists (a chicken-and-egg it accepts by design, normally absorbed into the next phase's commit in a continuing
   session). Since this run hands off between phases as separate fresh-agent steps and the orchestrator's
   `tree-clean.sh` defines "clean" with no allowance for a dangling sha-stamp diff, I added one small `chore` commit
   purely to persist the sha stamp, rather than leave the tree dirty or open a step boundary on an uncommitted
   change. Rejected: leaving `plan.md`'s sha stamps uncommitted (would fail the next step's clean-tree precondition
   and `git branch --show-current` entry checks); amending `35f89ae` (global rule: never amend unless asked). Would
   change: an explicit run-contract clarification that the sha stamp may ride uncommitted into the next phase's
   session.
5. **Roadmap sync applied** (S-11 `planning` → `in-progress`), folded into the `35f89ae` commit (the roadmap file
   was not pre-dirty, so per the skill's own rule it joins the phase's touched-file set). Why: `roadmap.md` has the
   exact `Change ID: santander-card-merchants` match and the skill requires this sync once at entry if the file
   exists. Would change: nothing — mechanical per the skill's own rules.
