# Handoff — `kit-round-3-imports` (slice S-13)

Written by the `/10x-plan` step. `plan.md` (6 phases, 40 Progress rows) and `plan-brief.md` are on disk and
`change.md` is `planned`. No product code was touched. The one thing the next agent must not get wrong: the five
smoke rewrites (P3 ×3, P4 ×2) are deliberate kit presentation changes named in the plan. They are not assertions
edited to hide a regression. Every other existing smoke assertion must stay byte-identical.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/kit-round-3-imports`, cut from `main` at `2a8f89d` (F-04 merged) |
| Commits | 3 on the branch: `6e369ff` change identity, `8720f42` research, + `docs(kit-round-3-imports): plan` (this step) |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `planned` (`metadata-guard.mjs mark-planned`) |
| `## Progress` rows remaining | 40 of 40 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the commit, except the maintainer allow-list (`tree-clean.sh`) |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `context/changes/kit-round-3-imports/plan.md` | Full plan: 6 phases, `## Autonomous decisions` (13 rows), `## Progress` |
| `context/changes/kit-round-3-imports/plan-brief.md` | Two-page brief |
| `context/changes/kit-round-3-imports/change.md` | frontmatter `status: preparing → planned` |
| `context/foundation/roadmap.md` | S-13 status `pending → planning` (At a glance row + item body) |
| `context/changes/kit-round-3-imports/handoff.md` | This file |

## 3. Verification

| Command | Result |
| --- | --- |
| `git branch --show-current` | `feat/kit-round-3-imports` |
| `metadata-guard.mjs inspect` / `mark-planned` | `changed: true`, status `planned` |
| Success Criteria ↔ Progress mapping (manual count per phase) | P1 6+1, P2 6+1, P3 6+1, P4 5+1, P5 4+1, P6 5+3 = 40 rows, one-to-one |
| Spot checks against code | `ImportWizard.tsx` (`readStatement`, `blocking`, `serverMessage`), `index.astro`/`result.astro` selects, `copy.ts` `copyExtra.imports`, kit `content.json` `importFlow`/`importErrors`/`imports`, `app.js` `importResult`/`modal('deleteImport')`, `styles.css` (no desktop `.result-meta`), smoke pins and tails (`…0099`), `formatRangeLong` output form |
| lint / astro check / vitest / build / pgTAP / smoke | not run: plan-only step, no code changed. Baseline per the agent contract is inherited and unverified: lint 0, astro check 0/152, vitest 347/22, build OK, pgTAP 6/119, smoke 157/0. Phase 1 must measure it on the branch |

## 4. Next command

`/10x-plan-review kit-round-3-imports`

## 5. Open

- **Phases** (each implemented by a fresh agent):
  - P1: helpers + step 1 + rejections
  - P2: wizard steps 2–3
  - P3: history + dialog (+ `InfoAlert`)
  - P4: result + G38
  - P5: demo notes in the wizard
  - P6: register, seam sweep, visual gate
- **New gap ids the plan introduces:**
  - `G38`: kit has no desktop `.result-layout` / `.result-meta` CSS. Row and `DESIGN-GAP` comment land in P4.
  - `K33`: kit-author list. Row lands in P6.
- **Manual-only rows (human checklist):**
  - [reviewer] 1.7, 2.7, 3.7, 4.6, 5.5, 6.7
  - [visual] 6.6: every listed state at desktop and ~400 px. The "too many" state needs a generated CSV in the
    scratchpad; if none is available, record N/A with the unit pin.
  - [human] 6.8: accept the S-13 kit-text deviations and send G38 + K33 to the kit author.
- **Risks:**
  - React SSR may split the overlap sentence with `<!-- -->` markers. If so, smoke asserts the rendered nodes
    separately.
  - The demo note inside the closed Radix dialog is not in the SSR HTML, so it has visual-gate proof only.
  - F8 (`DialogContent` has no `max-h`) may clip at 400 px.
- **Follow-ups:** no `follow-ups/review-fixes.md` for this slice yet. P6 creates it only if it defers something.

## 6. Autonomous decisions

The full table is in `plan.md` § Autonomous decisions. The decisions that bind implementers most:

1. **No questions; complexity MEDIUM.**
   - Why: research resolved every open point.
   - Would change: a product owner being available.
2. **Server `invalid` shows `importErrors.inconsistent`; no server change.**
   - Why: the case is reachable only by bypassing the client's schema.
   - Would change: finding an unvalidated client path.
3. **Result page: a malformed or unknown id renders the kit not-found state (200).** The 302 is rejected.
   - Why: the kit draws this state.
   - Would change: a reviewer requiring 404.
4. **`accountLead` keeps the app text, not the kit's `app.js` sentence.**
   - Why: neither has a key, and the kit text is wrong for a one-account file.
   - Would change: the kit adding a key.
5. **Delete-title `{range}` uses the short form; the chip uses the full bank name.**
   - Why: the kit sample, and the only key available.
   - Would change: the visual gate or K33.
6. **K32: read `importFlow.accountLabel` and `imports.santanderAccountName`.**
   - Would change: the kit removing those duplicates.
7. **No PRD-literal departure, so no PRD `[human]` row.** The kit-text deviations are collected in [human] row 6.8.
   - Would change: a reviewer reading FR-003 as requiring the skipped-credit count.
