# Handoff — `santander-card-merchants` (slice S-11)

Written by the `/10x-impl-review` step of run `2026-10-01-m2-santander`. The full plan (phases 1–4) is reviewed:
`MERGE: CLEAR`, one WARNING fixed (`6baf3fd`, comments only), `change.md` is `impl_reviewed`. The next agent must
not skip the visual gate (Progress row 4.6) — it is the one non-human row still open, and it needs the ING and
Santander main fixtures imported on the local test account and deleted afterwards.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/santander-card-merchants`, cut from `main` at `9f63fd9` |
| Commits | 15 on the branch (`main..HEAD`): the 13 listed by the Phase 4 handoff (identity … `5bc2a49` epilogue, `1a7ffa0` phase 4 handoff), then `6baf3fd` `fix(santander-card-merchants): poprawki z przeglądu implementacji`, then this step's `docs(santander-card-merchants): przegląd implementacji` |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `impl_reviewed` |
| `## Progress` rows remaining | 5 (`grep -c '^- \[ \]' plan.md`): 4.6 `[visual]`, 4.8–4.11 `[human]` |
| Working tree | clean after this step's commit (`tree-clean.sh` → `CLEAN`), branch confirmed with `git branch --show-current` |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `context/changes/santander-card-merchants/reviews/impl-review.md` | Full-plan implementation review (phases 1, 2, 3, 4): verdict APPROVED, findings F1 WARNING (fixed), F2–F4 OBSERVATION (accepted), evidence tables, last line `MERGE: CLEAR — …` |
| `src/lib/patterns/merchant.ts` | F1 fix (`6baf3fd`): file header and `rawMerchant` doc now say the Santander step claims card payment, ATM and `Wypłata BLIK` titles (Phase 3 widened it). Comments only |
| `src/lib/patterns/santander-card.ts` | F1 fix (`6baf3fd`): header cites the plan's rules 1–5 and `import-formats.md` § Normalizacja sprzedawcy; rule-4 comment above `CODE_TOKEN` credits research R10 (first-token exemption = plan review F2). Comments only |
| `context/changes/santander-card-merchants/plan.md` | `## Progress` [reviewer] rows 1.6, 2.7, 3.5, 4.7 ticked |
| `context/changes/santander-card-merchants/change.md` | `status: impl_reviewed` |
| `context/changes/santander-card-merchants/handoff.md` | This file |
| `context/runs/2026-10-01-m2-santander/private/ir-multi-tail-keys.txt` (+ `.keys`, `.splits`) | Gitignored, never committed: the reviewer's over-merge labelling of the real export. Cited by existence and counts only |

## 3. Verification

All observed in this step. Baseline = contract line (`main` 9f63fd9, after S-10).

| Command | Result |
| --- | --- |
| `npm run lint` | 0 errors (Δ0); re-run after `6baf3fd`: 0 errors |
| `npx astro check` | 0 errors, 147 files (baseline 144, +3 new TS files); re-run after the fix: same |
| `npm run fixture:check` | `ing OK`, `santander OK` (Δ0) |
| `npx vitest run` | 335 passed, 20 files (baseline 291 / 18, +44 tests / +2 files); re-run after the fix: 335 |
| `npm run build` | OK (pre-existing sitemap `site` warning); re-run after the fix: OK |
| `npx supabase db reset && npx supabase test db` (sandbox disabled) | `Files=6, Tests=119, Result: PASS` (Δ0) |
| `astro dev --port 4398` + `BASE_URL=http://localhost:4398 npm run smoke` (sandbox disabled) | `All smoke steps passed`, 151 PASS / 0 FAIL (baseline 147, +4); run at `1a7ffa0`, before the comment-only fix; server killed, `lsof -ti :4398` empty |
| Deliberate break 1: `BLIK_GATE` → bare `^Wypłata BLIK ` | 1 red (ING-shaped BLIK title → `null`); restored → 335. Meta: only that unit case guards it; the ING pin cannot (no ING BLIK withdrawal in the fixture) |
| Deliberate break 2: city block in `santanderCardMerchant` disabled | 24 red, incl. Santander partition, aggregates, names and both cross-bank tests; restored → 335. Meta: the oracle itself (not only hand-written cases) proves the city rule makes the join |
| ING byte-identity: `main`'s `merchant.ts` vs the branch's over every parseable ING fixture row | 212 rows, 0 key or display differences; 3 synthetic ING-shaped titles, 0 differences; pin test green |
| Real PLN export, Phase 2 code (`5205a19`), counts only | 227 keys / 212 card keys (plan R4 227/212) |
| Real PLN export, HEAD, counts only | 193 keys / 179 card keys (plan R10 193/179); 15 keys merge ≥ 2 raw tails (68 tails) — each judged by the reviewer: **0 over-merges**; **6 split merchants** (10 extra keys), within R10's ≤ 6 |
| `git diff --name-only main...HEAD` under `supabase/` or `src/pages/` | empty — no migration, no new endpoint |
| Branch diff grepped against 22 private merchant names | 0 hits |

## 4. Next command

Visual gate for the patterns views (Progress row 4.6, `.claude/skills/10x-autonomous-run/references/visual-gate.md`) — then `/10x-archive santander-card-merchants` and ship.

## 5. Open

- **4.6 `[visual]`** — screenshots at 1280 px and ~400 px: `/patterns` list (one `PIZZERIA TRZY SERY`, `Bankomat`,
  `PUB POD KOGUTEM`, `SIEC PRZYKLAD`), filtered "pizzeria", detail of `PIZZERIA TRZY SERY` and `Bankomat`, `/fixed`,
  vs kit `patterns.html` / `pattern-wolt.html` / `fixed.html`; ING main + Santander main fixtures imported on the
  local test account, deleted afterwards.
- **Human checklist** (none agent-closable):
  - [ ] 4.8 F-03 3.9: confirm the oracle's product calls (`Wypłata BLIK` own pattern, ST03 user-merge, `Oplata za …` fixed)
  - [ ] 4.9 S-10 6.11: accept re-keying of Santander card patterns (239 → 193 real keys); saved thresholds/decisions on old keys orphaned
  - [ ] 4.10 Owner imports the real Santander PLN export locally and checks the patterns
  - [ ] 4.11 Accept min 1 token over min 2 (`santander-card.ts` `santanderCardMerchant` city pops)
- Carried risks (plan Known risks): min-1 generic-name merge; `CITY_PREFIX` pop leaving one word; cityless
  `<AGG> *<MERCHANT>` tails; ASCII-only cross-bank join; partial `NR_GUARD` (≥ 3 digits dropped by `normalizeMerchant`
  `STORE_NUMBER`); `BLIK_GATE` unmeasured on real ING (review F3).
- Follow-ups: `follow-ups/review-fixes.md` FU1–FU5 unchanged (each has a `Trigger:` line); no new follow-up from this
  review (F2–F4 are accepted observations).
- DESIGN-GAP: none. Migration: none. ARTIFACT GAP: none.

## 6. Autonomous decisions

1. **F1 (stale seam comments) fixed in this step rather than filed.** Rejected: a follow-up row. Why: comment-only,
   two files, cheap; a later phase widening an earlier contract without updating its comment is the seam class this
   review hunts. Would change: a fix touching executable code (then the full gate incl. smoke would be re-run first).
2. **Did not re-run smoke/pgTAP after `6baf3fd`.** Why: the commit changes no executable line (lint, astro check,
   vitest and build were re-run). Would change: any non-comment change in the fix.
3. **Ticked [reviewer] 2.7 from a re-measurement of the Phase 2 commit's code**, loaded from `git show 5205a19` into
   the session scratchpad (no checkout), and judged its 0 over-merges by refinement: HEAD only adds rules that merge
   further, so any Phase 2 over-merge would persist at HEAD, where every multi-tail key was judged one merchant.
   Would change: a Phase 3 rule that splits what Phase 2 merged (none — rule 4 and `BLIK_GATE` only coarsen).
4. **Over-merge judgment by the reviewer, tail by tail, over all 15 multi-tail keys**, rather than relying on the
   Phase 3 private files. Would change: nothing — the counts matched the Phase 3 claim.
5. **No `AskUserQuestion`; the skill's triage was done in place** (run contract rule 1): WARNING → fix,
   OBSERVATIONs → recorded as ACCEPTED in the report. Would change: a human present to triage.
