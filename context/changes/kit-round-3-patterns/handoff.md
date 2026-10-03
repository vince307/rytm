# Handoff — `kit-round-3-patterns` (slice S-14)

Written by the `/10x-implement … phase 4` step of autonomous run `2026-10-02-kit-round-3`. Phases 1-4 are committed
(`5956c76`, `8518cde`, `4eb395d`, `cab9aca`); next is phase 5. The one thing not to get wrong: the P4 pins are class-string
pins (pixels belong to visual rows 8.6 / 8.7), and `ui/` now imports `focusRing` from `app/field-styles` (accepted, row 4.7).

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/kit-round-3-patterns`, cut from `main` at `5ed97f4` |
| Commits | `5956c76 (p1)`, `8518cde (p2)`, `4eb395d (p3)`, `cab9aca feat(kit-round-3-patterns): … (p4)` + handoff commits |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | 33 (`grep -c '^- \[ \]' plan.md`); 4.1-4.6 ticked with `cab9aca`; 4.7 `[reviewer]` open |
| Working tree | clean after the handoff commit (`tree-clean.sh`) |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `src/components/app/field-styles.ts` | `field` round 3 (`rounded-[8px]`, `ring-ink/12`, `focus-within:text-ink`), new `focusRing` and `fieldBox` exports; G29 comment gone |
| `src/components/ui/button.tsx`, `src/components/app/BackLink.astro` | compose `focusRing` (BackLink via `class:list`) |
| `src/components/ui/dialog.tsx` | exported `dialogContentClass` (p-[26px], w-[calc(100%-32px)], ≤559px 22/18 + 12px radius); close button composes `focusRing`, icon is `Glyph` |
| `src/components/patterns/{PatternsTable,ThresholdEditor,PatternActionsDialog}.tsx` | local ring const removed / box composes `fieldBox`; G32 comments gone |
| `src/components/patterns/merchant-mark.ts`, `src/pages/patterns.astro` | comments rewritten (no G28) |
| `test/unit/kit-contract.test.ts` | + 1 case pinning field / focusRing (incl. `buttonVariants`) / fieldBox / dialogContentClass |

## 3. Verification

| Command | Result |
| --- | --- |
| `npm run lint` | 0 errors, 0 warnings (one `class:list` warning fixed) |
| `npx astro check` | 0 errors, 0 warnings, 3 hints |
| `npm run fixture:check` | ing OK, santander OK |
| `npm test` | 370 passed / 25 files (P3 369 / 25, +1) |
| `npm run build` | OK |
| `npx supabase db reset && test db` | Files=6, Tests=119 PASS (baseline 119, Δ0), run unsandboxed |
| `npm run smoke` on 4398 | 185 PASS / 0 FAIL (P3 185, Δ0); dev server killed, :4398/:4399 free |
| `grep G29\|G32 src` / `focus-visible:ring-ink/15 src` | empty / only `field-styles.ts` |
| Break A: `field` back to `rounded-lg` | kit-contract new case red; restored by `git checkout --` |
| Break B: dialog `p-[26px]` → `p-[31px]` | same case red; restored. Meta: one `it` covers both, each break turns it red alone; it pins class strings, not pixels (rows 8.6 / 8.7) |

## 4. Next command

`/10x-implement kit-round-3-patterns phase 5`

## 5. Open

- Manual-only rows, not mine: `[reviewer]` 1.7, 2.6, 3.7, 4.7, 5.7, 6.6, 7.7, 8.8; `[visual]` 8.6, 8.7; `[human]` 8.9.
- Register: `design-kit.md` G28/G29/G32/G34/K9 rows not edited (P8 owns the register); K35–K37 rows in P5/P6, G33 in P7.
- Not unified (outside plan): `FormField.tsx` and `DeleteAccountDialog.tsx` still carry their own `ring-ink/8` input classes; not `fieldBox` users (no group focus-within).
- Carried: `plural` widened to `readonly string[]` (P1); keep „—” in Kwota when `fixedAmountMinor` is null; kit shows 3 rows before „Pokaż więcej”, plan says 10 (followed).
- Roadmap `S-14` status not touched (orchestrator-owned).

## 6. Autonomous decisions

1. **Execution mode: in this context.** Rejected: subagent — phase is small. Would change if a phase exceeds the context budget.
2. **Commit message approved as drafted** (Polish subject per contract).
3. **`button.tsx` base string became a template literal** (`${focusRing}`) rather than `cn()` wrapping; class set unchanged. Would change if a reviewer prefers `cn`.
4. **`BackLink` uses `class:list`** (lint rule `astro/prefer-class-list-directive`) instead of `cn()`.
5. **Dialog padding of the backdrop (16 px)** realised by `w-[calc(100%-32px)]` on the content, since the overlay is `fixed inset-0` without padding; same visual result. Would change if visual row 8.7 shows otherwise.
6. **Break B meta**: one pin test covers both breaks; accepted since each break alone turns it red.
7. **No step asked the user** (run contract rule 1).
