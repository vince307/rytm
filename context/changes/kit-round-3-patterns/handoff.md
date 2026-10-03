# Handoff — `kit-round-3-patterns` (slice S-14)

Written by the `/10x-implement … phase 5` step of autonomous run `2026-10-02-kit-round-3`. Phases 1-5 are committed
(`5956c76`, `8518cde`, `4eb395d`, `cab9aca`, `c8b16bf`); next is phase 6. The one thing not to get wrong: smoke label
assertion depends on the fixture (May: 1 occurrence, over threshold 40 zł → „0 wystąpień … 1 wystąpienie”); the
smoke step must stay between „threshold is changed” and „threshold is removed”.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/kit-round-3-patterns`, cut from `main` at `5ed97f4` |
| Commits | `5956c76 (p1)`, `8518cde (p2)`, `4eb395d (p3)`, `cab9aca (p4)`, `c8b16bf feat(kit-round-3-patterns): … (p5)` + handoff commits |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | 27 (`grep -c '^- \[ \]' plan.md`); 5.1-5.6 ticked with `c8b16bf`; 5.7 `[reviewer]` open |
| Working tree | clean after the handoff commit (`tree-clean.sh`) |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `src/lib/patterns/sequence-label.ts` (new), `test/unit/sequence-label.test.ts` (new, 5 cases) | pure `sequenceLabel(count, over, template, forms)`, `within = count − over` |
| `src/pages/patterns/[...key].astro` | detail rebound to `copy.patternDetail.*` / `copy.threshold.*`; sequence container `role="img"` + `aria-label`, `sr-only` span gone; K36 DESIGN-GAP comment |
| `src/content/copy.ts` | deleted leaves typeLeads, thresholdPanel/Active/None, valueLabel, suffix, occurrencesPanel, sequenceWithin, thresholdInvalid/SaveError; `sequenceSummary` = K35 template |
| `scripts/smoke.mjs` | + `pattern detail shows the kit invalid-threshold line`, + `pattern detail labels the sequence` |
| `context/foundation/design-kit.md` | rows K35, K36 (prettier re-aligned the table widths, so the diff is wide) |
| `test/unit/kit-contract.test.ts` | `sumLabel` assertion repointed to `copy.patternDetail.sumLabel` |

## 3. Verification

| Command | Result |
| --- | --- |
| `npm run lint` | 0 errors, 0 warnings |
| `npx astro check` | 0 errors, 0 warnings, 3 hints (162 files) |
| `npm run fixture:check` | ing OK, santander OK |
| `npm test` | 375 passed / 26 files (P4 370 / 25, +5 cases, +1 file) |
| `npm run build` | OK |
| `npx supabase db reset && test db` | Files=6, Tests=119 PASS (baseline 119, Δ0), run unsandboxed |
| `npm run smoke` on 4398 | 187 PASS / 0 FAIL (P4 185, +2); dev server killed, :4398/:4399 free |
| `grep copyExtra.patterns.(thresholdInvalid\|thresholdSaveError\|typeLeads\|thresholdPanel\|occurrencesPanel) src` | empty (also no `x.valueLabel/suffix/sequenceWithin/thresholdActive/None`) |
| Break A: `within = count` | sequence-label unit red (2 cases) and smoke label step red; restored. Meta: the unit test and the smoke step each fail alone, so both guard the formula, not just the template |
| Break B: `error=value` message → old text | invalid-threshold smoke step red (only that one); restored. Meta: asserts the exact kit string, not mere presence of an alert |

## 4. Next command

`/10x-implement kit-round-3-patterns phase 6`

## 5. Open

- Manual-only rows, not mine: `[reviewer]` 1.7, 2.6, 3.7, 4.7, 5.7, 6.6, 7.7, 8.8; `[visual]` 8.6, 8.7; `[human]` 8.9.
- Register: K35/K36 added (P5). K37 in P6, G33 in P7; G28/G29/G32/G34/K9 rows left to P8.
- Plan said smoke + 3 in the full gate row 5.6; only the 2 new steps exist in this phase (185 → 187), recorded as met.
- Not unified (outside plan): `FormField.tsx` and `DeleteAccountDialog.tsx` still carry their own `ring-ink/8` input classes.
- Carried: `plural` widened to `readonly string[]` (P1); keep „—” in Kwota when `fixedAmountMinor` is null; kit shows 3 rows before „Pokaż więcej”, plan says 10 (followed).
- Roadmap `S-14` status not touched (orchestrator-owned).

## 6. Autonomous decisions

1. **Execution mode: in this context** (small phase); the Skill tool was not invoked, the skill steps were followed from the plan directly. Would change if a phase exceeds the context budget.
2. **Commit message** drafted in Polish per contract, no prompt.
3. **`typeLeads` replaced by an inline ternary** on `pattern.type` (`typeFixed` / `typeFrequent`) rather than a helper map. Would change if P6 needs the same map.
4. **Smoke label expectation** is „0 wystąpień w ramach progu, 1 wystąpienie ponad próg” (computed from the fixture: one May occurrence of 45,50 zł against a 40 zł threshold), not the plan's example. Would change if the fixture changes.
5. **Smoke +2 not +3** in the gate row (see §5).
6. **No step asked the user** (run contract rule 1).
