# Handoff schema

`context/changes/<change-id>/handoff.md` (after `/10x-archive`:
`context/archive/<created>-<change-id>/handoff.md`) is the **interface between
steps**. Every step rewrites it before returning and commits it on `feat/<change-id>`.
A step whose handoff fails this schema is a **failed step** — the orchestrator greps for
the six headings (`gates.md`) and re-dispatches once before parking the slice.

It is also the ONLY memory between steps: every step is a fresh agent. §4 must name the
literal next step so a new session can start from it (and the orchestrator can resume a
parked slice from it, even in another session). The ship step writes the final pre-merge
state before pushing (§1 "PR/merge/deploy recorded in the run log", §4 `none — shipped`) —
after the merge it is on `main` and must not commit, so an archived handoff would stay stale.

## Required headings — exact text, in this order

```markdown
# Handoff — `<change-id>` (slice <S-NN>)

<1–3 sentences: which step wrote this, what state the slice is in, and the one
thing the next agent must not get wrong.>

## 1. State
## 2. Artifacts
## 3. Verification
## 4. Next command
## 5. Open
## 6. Autonomous decisions
```

Verifier check:

```bash
for h in '## 1\. State' '## 2\. Artifacts' '## 3\. Verification' \
         '## 4\. Next command' '## 5\. Open' '## 6\. Autonomous decisions'; do
  grep -q "^$h" <dir>/handoff.md || echo "MISSING: $h"
done
```

## What each section must contain

**## 1. State** — a table: branch (`feat/<id>`, cut from `main` at `<sha>`); commit
count and range; pushed? PR? merged? (with URL/sha once they exist); `change.md`
status; `## Progress` rows remaining (`grep -c '^- \[ \]' plan.md`); working tree clean?

**## 2. Artifacts** — `path | what it is`, every file this step wrote or changed.

**## 3. Verification** — `command | result`, **observed in this step**, with the
baseline named: `smoke 44/44 (baseline 41, +3)`. A suite not run: say so and why.
Deliberate breaks go here: what was broken, that it went red, that it was restored,
and the meta-check (does the break prove what it appears to?).

**## 4. Next command** — one line: the literal next step, or `none — shipped`.

**## 5. Open** — carried risks, manual-only Progress rows (as a human checklist),
`DESIGN-GAP`s added, follow-ups (pointing at `follow-ups/review-fixes.md`). Each
names a file and a **symbol**, never a line number.

**## 6. Autonomous decisions** — every decision made in place of asking a human:
chosen, rejected, **why**, and **what would change the answer**. The reversal
condition is not optional.

## Rules

- Symbols, not line numbers.
- Zero-context reader: assume no transcript exists.
- Do not inherit claims: a green the previous handoff asserts and this step did not
  observe is re-run or marked "inherited, unverified".
