---
title: Autonomous roadmap run — the process (Rytm, v2 supervised)
status: binding
created: 2026-09-25
updated: 2026-09-28
derived_from: 10xDevs context/runs/2026-08-22-autonomous-five/ (v1 source); Rytm runs 2026-09-25-roadmap-all (v1, 0 shipped) and 2026-09-27-s03-s02-s04 (v2, 3 shipped, 0 retries)
---

# Autonomous roadmap run

One command takes N roadmap slices through the full 10x chain and **ships each to production**, with no human in
the loop after the rules are agreed, and leaves artifacts complete enough that an outsider can answer *what was
built, why that way, what was rejected, what was verified and with what, and what is still open* without reading a
transcript.

## 1. Roles

**The orchestrator** (the session the maintainer typed into) agrees the rules, prepares branches, dispatches one
fresh agent per step, checks every gate itself, keeps the run log and the orchestration notes, and reports. It never
writes product code and never reads a subagent transcript.

**Every step** runs in a fresh agent context (no SendMessage continuation, no fork), reads its input from disk
(contract → `handoff.md` → what it points at), writes and commits its artifact, rewrites the handoff, returns
≤12 lines ending in `STATUS: …`. Consequence: *nothing important may exist only in an agent's context*. An agent
that needs something not on disk reports `ARTIFACT GAP:` — the orchestrator fixes the artifact type, not the prompt.

## 2. The chain, per slice

```
git switch -c feat/<id> main                       (orchestrator)
/10x-new          → change.md (roadmap claims verified against the repo NOW)
/10x-research     → research.md
/10x-plan         → plan.md (+ ## Progress; small code phases; owner-tagged manual rows)
/10x-plan-review  → reviews/plan-review.md, ends VERDICT: PROCEED|RETHINK
/10x-implement N  → one fresh agent per phase, one commit per phase, only on green
/10x-impl-review  → reviews/impl-review.md, ends MERGE: CLEAR|BLOCKED
visual gate       → screenshots/ + reviews/visual-review.md, ends VISUAL: … (UI slices)
/10x-archive      → folder to context/archive/, roadmap row → done
ship              → push, PR, CI green, supabase db push (if migrations), merge, deploy watched
```

**The chain must not be shortened.** Reviews stopped real defects in every run: a PIN-bypass and a test that
passed regardless of the bug (v1 source); a status message invisible after deleting the last import, a
destructive-button initial focus, stale inter-phase comments (v2).

## 3. Why supervised, not a Workflow script (v1 → v2)

v1 ran the chain as a JS Workflow with an independent low-effort verifier agent per gate. On 2026-09-25 it shipped
nothing: (1) a gate required an empty `git status` while the contract allowed the maintainer's two uncommitted
entries — a finished, green implementation failed on the contradiction; (2) a verifier read the wrong tree and
reported a handoff missing that was on the branch. A script cannot ask "is this failure real?"; a supervisor can.
v2 keeps everything else from v1 (chain, handoff schema, contract, machine lines, ship authorisation, serial
slices) and moves gate judgement to the orchestrator (`gates.md`).

## 4. Serial, and why

The roadmap is nearly a chain (S-01 → S-02/S-03 → S-04/S-05/S-06/S-09 → S-07) and all slices share ONE local
Supabase: a neighbour's `db reset` would wipe another's test data mid-run and look like a product bug. Shipping
each slice before the next starts means every slice is planned against the code that is actually on `main`.

## 5. Implement per phase

One fresh agent per plan phase, with `## Progress` rows (+ SHA) and the handoff as the resume point. A two-phase
implement in one agent hit 287k tokens (close to the ~300k hygiene line); per phase, 170–320k each. UI phases cost
~2× logic phases — plans keep them to ≤ ~2 new components. Per-phase work leaves seams (stale comments, a helper
copied 3×): the last phase carries a seam-sweep row and the impl-review looks for them.

## 6. Adaptations without which the 10x skills do not run autonomously

1. **`AskUserQuestion` is banned after Step 0.** Decide, record under `## Autonomous decisions` with a **reversal
   condition**. Product contradictions (PRD vs PRD) become `[human]` Progress rows and a PR section
   „Do decyzji właściciela produktu” — the run proceeds on a recorded, reversible choice.
2. **The agent triages reviews.** CRITICAL → fix; WARNING → fix if obvious, else Known risks / follow-ups with a
   `Trigger:`; OBSERVATION → record.
3. **RETHINK parks the slice**, the plan untouched for a human.
4. **~300k context is hygiene**: write the handoff, return `NEEDS_CONTINUATION`.
5. **Return ≤12 lines.**
6. **Manual rows carry an owner**: `[reviewer]` (impl-review performs), `[visual]` (visual gate performs),
   `[human]` (post-run checklist; does not block archive).

## 7. Files that carry the state

| File | Written by | Why |
|---|---|---|
| `<change dir>/handoff.md` | every step, rewritten, committed | the interface between steps |
| `context/runs/<run-id>/agent-contract.md` | orchestrator (baseline line rewritten after every ship) | invariants every agent reads |
| `context/runs/<run-id>/run-log.md` | orchestrator | rules agreed, status, decisions, traps |
| `context/runs/<run-id>/orchestration-notes.md` | orchestrator | how the run was driven + "Skill change:" proposals |

`context/runs/` is gitignored; change folders (handoffs, reviews, screenshots) are committed and archived.

## 8. Gates

- **Checked by the orchestrator** (`gates.md`), 1–2 commands per step, never self-reported; a failure is first
  judged real or false. Real → one re-dispatch; twice → park.
- **Merge gate** = `MERGE: CLEAR|BLOCKED — <reason>` at the end of impl-review. BLOCKED iff ≥1 open CRITICAL, an
  unmet success criterion, or a red suite. Warnings never block.
- **Visual gate** ends `VISUAL: PASS|GAPS|NOT-CAPTURED`; only a missing file blocks. The orchestrator opens one
  screenshot itself.
- **Ship gate** on GitHub and Supabase: PR merged, merge-sha run ci + smoke + deploy green, roadmap row done,
  `migration list` local = remote, main clean (`scripts/tree-clean.sh`).

## 9. Verification discipline and environment traps

1. **Deliberate break + meta-check** — does the break prove what it appears to?
2. **Baseline + delta**, against the latest shipped `main` (re-measured after every ship), never absolute counts.
3. **Observed, not remembered**; the orchestrator re-runs the fast suites (vitest, pgTAP) at implement gates.
4. **Symbols, never line numbers.**
5. **Sandbox blocks `127.0.0.1:54321`, Docker and `gh`** (gh shows x509 / OSStatus -26276) — run those unsandboxed.
6. **Dev servers**: :4398 (gates/smoke), :4399 (visual), started with
   `ASTRO_DEV_BACKGROUND=1 npx astro dev --port <p> --ignore-lock`. :4321 is the maintainer's: never use, never kill.
   Kill with `lsof -ti :4398 -ti :4399 | xargs kill` (macOS rejects `:A :B`).
7. **Screenshots**: Claude-in-Chrome with the browser the maintainer selected at Step 0 (subagents inherit it);
   Playwright fallback. Chrome windows cannot go below ~587 px — 400 px via a same-origin iframe.
8. **Local DB**: experiments inside `BEGIN … ROLLBACK`; anything else ends with `supabase db reset`.
9. **Hosted DB before merge** — `main` deploys on merge; code must find its schema.
10. **`supabase status`** output changed in CLI 2.117 — probe `127.0.0.1:54321` with curl instead.

## 10. Ship — authorised 2026-09-25, reconfirmed 2026-09-27

The maintainer authorised the run to push, open PRs, run `npx supabase db push` against project
`psqbtvooufapkatpkxlw`, merge to `main` and watch the production deploy. Limits that still hold: no force-push, no
direct push to `main`, no `--no-verify`, no merge on a red/pending check, no `vercel --prod`, no smoke against
production, no hosted `db reset`, and **rollback stays human** (`vercel rollback` / `vercel promote`).

## 11. Definition of done

An outsider reading only `context/runs/<run-id>/`, the archived change folders and the PRs can answer what was
built, why, what was rejected, what was verified with what, and what is still open — without opening a transcript.
