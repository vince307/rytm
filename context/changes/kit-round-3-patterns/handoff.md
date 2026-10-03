# Handoff — `kit-round-3-patterns` (slice S-14)

Written by the `/10x-implement … phase 2` step of autonomous run `2026-10-02-kit-round-3`. Phases 1 and 2 are committed
(`5956c76`, `8518cde`); next is phase 3. The one thing not to get wrong: the badge sits in the „Ponad progiem” cell
after the value (`PatternRow.status`), computed server-side in `patterns.astro` — the island never derives it.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/kit-round-3-patterns`, cut from `main` at `5ed97f4` |
| Commits | `5956c76 … (p1)`, `8518cde feat(kit-round-3-patterns): Odznaki statusu i tony Badge (p2)` + handoff commits |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | 45 (`grep -c '^- \[ \]' plan.md`); 2.1–2.5 ticked with `8518cde`, 2.6 `[reviewer]` left open |
| Working tree | clean after the handoff commit (`tree-clean.sh`) |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `src/components/app/Badge.tsx` | tone `changed`; `new` and `changed` = `bg-excess/18 text-excess-text`; G34 comment rewritten |
| `src/lib/patterns/status.ts` | new: `patternStatuses(fixedOverview(...))` → `Map<key, "new" | "changed">`, new wins |
| `src/components/patterns/PatternsTable.tsx` | exports `PatternRow` (= `PatternListItem & { status }`); `statusLabels` in copy; badge in Ponad progiem cell; G28 comment now only „Pokaż więcej” |
| `src/pages/patterns.astro` | one `fixedOverview` call inside the P1 `try`, rows mapped with `status`; `statusLabels` = `copy.components.new/changed` |
| `test/unit/pattern-status.test.ts` | new, 3 cases |
| `test/unit/patterns-table.test.ts` | + badge render case; fixtures carry `status` |

## 3. Verification

| Command | Result |
| --- | --- |
| `npm run lint` | 0 errors |
| `npx astro check` | 0 errors, 0 warnings, 3 hints |
| `npm run fixture:check` | ing OK, santander OK |
| `npm test` | 359 passed / 24 files (P1 355 / 23: +3 status, +1 table render, +1 file) |
| `npm run build` | OK |
| `npx supabase db reset && test db` | Files=6, Tests=119 PASS (Δ0) |
| `npm run smoke` on 4398 | 184 PASS / 0 FAIL (Δ0 vs P1 and baseline) |
| Break: `patternStatuses` returns empty map + `PatternsTable` ignores `status` | 3 tests red (2 status, 1 render), restored with `git checkout --`, 6/6 green after. Meta: smoke would stay green on this break (seed data has no status rows), which is why the unit/render tests carry the proof |

## 4. Next command

`/10x-implement kit-round-3-patterns phase 3`

## 5. Open

- Manual-only rows, not mine: `[reviewer]` 1.7, 2.6, 3.7, 4.7, 5.7, 6.6, 7.7, 8.8; `[visual]` 8.6, 8.7; `[human]` 8.9.
- Register: `design-kit.md` G28/G34/K9 rows not edited in P2 (P8 owns the register); `/fixed` „nowy” tint 25 → 18 % is intended.
- `DESIGN-GAP: G28` header in `PatternsTable.tsx` now names only „Pokaż więcej” (P3 removes it).
- Carried: `plural` widened to `readonly string[]` (P1); keep „—” in Kwota when `fixedAmountMinor` is null; K35–K37 register rows in P5/P6, G33 in P7.
- Roadmap `S-14` status not touched (orchestrator-owned).

## 6. Autonomous decisions

1. **Execution mode: in this context.** Rejected: subagent — phase is small. Would change if a phase exceeds the context budget.
2. **Badge wrapper `<span class="ml-2 inline-block">`** for the gap between value and badge (kit inline order) instead of a flex cell. Rejected: flex on the `<td>` (breaks table-cell layout). Would change if the visual gate shows misalignment.
3. **Commit message approved as drafted** (Polish subject per contract).
4. **Smoke run twice** (second only to count PASS lines): both 184 PASS.
5. **No step asked the user** (run contract rule 1).
