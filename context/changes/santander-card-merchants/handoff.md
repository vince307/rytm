# Handoff — `santander-card-merchants` (slice S-11)

Written by the `/10x-plan` step of run `2026-10-01-m2-santander`. `plan.md` (4 code phases, 29 Progress rows) and
`plan-brief.md` are written; `change.md` is `planned`; no product code changed. The next agent must not let any rule
escape the Santander title gate — ING key text is pinned in Phase 1 precisely because the ING partition test cannot
see a consistent re-key.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/santander-card-merchants`, cut from `main` at `9f63fd9` |
| Commits | 3 on the branch after this step's commit (`docs(santander-card-merchants): change identity (autonomous run)`, `… research`, `… plan`) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `planned` (via `.claude/skills/10x-plan/scripts/metadata-guard.mjs mark-planned`) |
| `## Progress` rows remaining | 29 (`grep -c '^- \[ \]' plan.md`) |
| Roadmap | S-11 `proposed → planning` (At a glance + body) |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `context/changes/santander-card-merchants/plan.md` | Plan: 4 phases, rule order in Critical Implementation Details, autonomous decisions table, Progress |
| `context/changes/santander-card-merchants/plan-brief.md` | Two-page brief |
| `context/changes/santander-card-merchants/follow-ups/review-fixes.md` | FU1–FU5 with `Trigger:` lines (BLIK operator, ST06 second address, diacritics, min 2, re-key saved rows) |
| `context/changes/santander-card-merchants/change.md` | Frontmatter `status: planned` |
| `context/foundation/roadmap.md` | S-11 status `planning` |
| `context/changes/santander-card-merchants/handoff.md` | This file |

## 3. Verification

| Command | Result |
| --- | --- |
| `git branch --show-current` | `feat/santander-card-merchants` |
| `grep -c '^- \[ \]' plan.md` | 29 = every Success Criteria bullet (P1 6, P2 7, P3 5, P4 11) |
| `metadata-guard.mjs mark-planned` | `{"changed":true}` |
| Read of research probe (`<scratchpad>/probe/rules.ts`) | Confirms the exact R10 rule order the plan specifies |
| lint / astro check / vitest / build / pgTAP / smoke | **not run** — plan only, no code changed. Baseline inherited, unverified: contract line for `main` 9f63fd9 |

## 4. Next command

`/10x-plan-review santander-card-merchants`

## 5. Open

- Plan phases: (1) ING key-text pin + F3 + S-10 F4; (2) `src/lib/patterns/santander-card.ts` `santanderCardMerchant`
  ATM/quotes/city + oracle/cross-bank tests; (3) code tokens + `NR` guard + `Wypłata BLIK`; (4) smoke join + `Bankomat`,
  docs, seam sweep, visual gate.
- Real-export measurement is local only, via the research probe harness in the session scratchpad (`probe/`, private
  labelling `labels.json` there) — counts only, never in the repo. If the scratchpad is gone, report key counts only.
- [human] rows (plan Phase 4):
  - [ ] 4.8 F-03 3.9 — confirm the oracle's product calls.
  - [ ] 4.9 S-10 6.11 — accept re-keying of Santander card patterns.
  - [ ] 4.10 Owner imports the real Santander PLN export locally and checks the patterns (S-10 6.8).
  - [ ] 4.11 Accept min 1 token over min 2 (`santander-card.ts` city rule).
- Follow-ups: `follow-ups/review-fixes.md` FU1–FU5.
- DESIGN-GAP: none. Migration: none.
- ARTIFACT GAP: none.

## 6. Autonomous decisions

1. **0 questions, MEDIUM.** Rejected: interview. Why: research measured every rule on both datasets. Would change: an
   owner available.
2. **Research's R10 rule set adopted verbatim, split into Phase 2 (R4) and Phase 3 (code tokens + BLIK).** Rejected:
   one rules phase. Why: each phase independently green and measurable. Would change: R4 not reproducing on the real
   export.
3. **min 1, with a [human] row.** Rejected: min 2. Why: oracle slugs, 0 real over-merges. Would change: a wrong
   cross-town merge observed → FU4.
4. **`Wypłata BLIK` one pattern taken in.** Why: real-only split, oracle-neutral, `import-formats.md` "nie scalany z
   bankomat" still holds. Would change: owner wanting per-ATM BLIK.
5. **New module `santander-card.ts` with a local gate regex** (not an export of `santander.ts` `CARD`). Why: patterns
   layer independent of the import layer, S-10 precedent of deliberate copies. Would change: the descriptor format
   changing.
6. **Display names `Bankomat` / `Wypłata BLIK`, no DESIGN-GAP.** Why: derived data in the name slot. Would change:
   the label rendered as UI chrome.
7. **Adjacent fixes taken: S-10 F4, merchant-patterns F3, `import-formats.md` BLIK `ref:` note.** Why: cheap,
   assigned or found by research. Would change: a reviewer judging them scope creep.
8. **No deviation from the PRD, `import-formats.md` or the F-03 partition**; oracle slug text is not matched
   literally (partition is the contract, per `change.md`). Would change: the owner reading slugs as key text.
9. **Roadmap and `change.md` edits committed with the plan** (the skill leaves them for implement; the run contract
   requires a committed docs step). Would change: the orchestrator preferring an uncommitted roadmap edit.
