# Autonomous run (supervised) — <<<TITLE>>>, <<<DATE>>>

Source: `context/foundation/roadmap.md`, slices <<<SLICES>>>.
Standing brief: `agent-contract.md` (same folder). Process: `.claude/skills/10x-autonomous-run/references/process.md`.
Orchestration journal: `orchestration-notes.md` (same folder).

**Written by the orchestrator only.** Gitignored — never committed.

## Rules agreed with the maintainer (<<<DATE>>>)

- Scope/order: <<<SLICES — and which ones resume from which step>>>
- How far: <<<full ship | stop at PR>>>
- On failure: <<<park and continue independents | stop the run>>>
- Screenshots: Claude-in-Chrome on "<<<BROWSER NAME>>>" (selected by the maintainer), Playwright fallback.
- Clean tree = `scripts/tree-clean.sh`. Never: force-push, direct push to main, `--no-verify`, `vercel --prod`,
  smoke on prod, rollback, hosted `db reset`, touching :4321.

## Baseline on main — measured, not assumed

| | value |
|---|---|
| `main` | `<<<SHA>>>` |
| `scripts/baseline.sh` | <<<BASELINE LINE>>> |
| Last `main` CI run | <<<RUN ID — conclusion>>> |
| Rule-file validation | <<<PASS — N files, N paths>>> |

Re-baselined after each ship: see the log lines below (and the contract's baseline line).

## Slices

<one short paragraph per slice: outcome, prerequisites, fresh or resumed (from which step), kit views, migration?>

## Status

| Slice | new | research | plan | plan-review | implement | impl-review | visual | archive | ship | PR |
|---|---|---|---|---|---|---|---|---|---|---|
| S-NN `<id>` | — | — | — | — | — | — | — | — | — | |

Legend: — pending · ✓ done · ! needs attention · ✗ failed · ⤼ skipped (prerequisite failed)

## Run log

- **<<<DATE>>>** — Run opened. Preflight … Baseline …

## Environment traps hit in this run

## Decisions worth a second look

> Cross-slice calls, product decisions left as `[human]` rows, and the per-slice autonomous decisions whose
> reversal condition the maintainer may want to trigger.

---

# RUN COMPLETE — <<<DATE>>> · N shipped · N failed · N skipped

| Slice | PR | Merge commit | Migrations pushed | Deploy | Review | Visual |
|---|---|---|---|---|---|---|

Human checklist: <[human] rows, follow-ups, DESIGN-GAPs>. Skill proposal: <file or "none">.
