# Handoff — `kit-round-3-patterns` (slice S-14)

Written by the `/10x-implement … phase 6` step of autonomous run `2026-10-02-kit-round-3`. Phases 1-6 are committed
(`5956c76`, `8518cde`, `4eb395d`, `cab9aca`, `c8b16bf`, `cd8a99f`); next is phase 7. The one thing not to get wrong: smoke
`request()` now reads 404 bodies too (needed for the not-found needle); the smoke label step still sits between „threshold is
changed” and „threshold is removed”.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/kit-round-3-patterns`, cut from `main` at `5ed97f4` |
| Commits | `5956c76 (p1)`, `8518cde (p2)`, `4eb395d (p3)`, `cab9aca (p4)`, `c8b16bf (p5)`, `cd8a99f (p6)` + handoff commits |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | 22 (`grep -c '^- \[ \]' plan.md`); 6.1-6.5 ticked with `cd8a99f`; 6.6 `[reviewer]` open |
| Working tree | clean after the handoff commit (`tree-clean.sh`) |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `src/components/app/ViewEmpty.astro` | `icon?`, `headingLevel?` (h1/h2, default h2), `arrow?` (default true); defaults keep old markup |
| `src/pages/patterns/[...key].astro` | not-found = `ViewEmpty` h1 (title = `notFound` split after first „. ”), no `.detail-top`; kit no-occurrences block; `noTransactions` line; merged variants moved to bottom of transactions panel (`Połączone nazwy`, per-variant `Cofnij scalenie`); G31 comment only on `overLabel` |
| `src/content/copy.ts` | deleted `detailMissing`, `monthEmpty`, `mergedLabel`, `unmerge`; + `noTransactions` (K37); G31 comment kept on `overInMonth` |
| `scripts/smoke.mjs` | `request()` reads 404 bodies; + `unknown pattern shows the kit not-found panel`, + `merged pattern titles its variants` |
| `context/foundation/design-kit.md` | row K37 |

## 3. Verification

| Command | Result |
| --- | --- |
| `npm run lint` | 0 errors |
| `npx astro check` | 0 errors (162 files) |
| `npm run fixture:check` | ing OK, santander OK |
| `npm test` | 375 passed / 26 files (P5 375, Δ0; no new unit cases) |
| `npm run build` | OK |
| `npx supabase db reset && test db` | Files=6, Tests=119 PASS (baseline 119, Δ0), unsandboxed |
| `npm run smoke` on 4398 | 189 PASS / 0 FAIL (P5 187, +2); dev server killed, :4398/:4399 free |
| grep `detailMissing\|monthEmpty\|mergedLabel\|x.unmerge`, G31 in detail page | no readers; G31 only on `overInMonth` |
| Break: `notFoundTitle` = whole unsplit string | not-found smoke step red (only that one); restored, green. Meta: needle `>Nie znaleziono wzorca.<` fails on the unsplit title, so the step proves the split, not just the 404 status |

## 4. Next command

`/10x-implement kit-round-3-patterns phase 7`

## 5. Open

- Manual-only rows, not mine: `[reviewer]` 1.7, 2.6, 3.7, 4.7, 5.7, 6.6, 7.7, 8.8; `[visual]` 8.6, 8.7; `[human]` 8.9.
- Register: K35-K37 added (P5-P6). G33 in P7; G28/G29/G32/G34/K9 and G31 rows left to P8.
- No-occurrences state has no smoke step (data-dependent, plan Known risks); the visual row covers it. Smoke +2, not +3.
- ViewEmpty default markup identical by construction (`{cta}` + `{" "}` + arrow span); not diffed byte-for-byte — reviewer row 6.6.
- Not unified (outside plan): `FormField.tsx` and `DeleteAccountDialog.tsx` keep their own `ring-ink/8` input classes.
- Carried: `plural` widened to `readonly string[]` (P1); „—” in Kwota when `fixedAmountMinor` is null; kit shows 3 rows before „Pokaż więcej”, plan says 10 (followed).
- Roadmap `S-14` status not touched (orchestrator-owned).

## 6. Autonomous decisions

1. **Execution mode: in this context** (small phase); Skill tool not invoked, plan followed directly. Would change if a phase exceeds the context budget.
2. **Commit message** drafted in Polish per contract, no prompt.
3. **Smoke `request()` widened to read 404 bodies** rather than adding a second helper; no existing step expected an empty 404 body. Would change if a step needs to assert an empty body.
4. **Merged variants rendered as rows (name + own button)**, not the kit's `<ul>` + single button — plan decision 9 (per-variant undo) kept.
5. **Not-found uses no icon and `arrow={false}`** (kit view has neither), as the plan specified.
6. **No step asked the user** (run contract rule 1).
