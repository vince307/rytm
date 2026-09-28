# Visual gate — how a UI slice is screenshotted and judged

Runs after `/10x-impl-review` says `MERGE: CLEAR`, for every slice that adds or changes a view. It is not
cosmetic: in the 2026-09-27 run it caught a destructive-button focus bug (Enter-Enter deleted an import) and a
column pushed off-screen, both missed by code review.

## Capture — Claude-in-Chrome first, Playwright fallback

### 1. Claude-in-Chrome (first choice)

The browser is chosen **once, at preflight, by the maintainer** (SKILL.md Step 1): the orchestrator calls
`list_connected_browsers`; with more than one connected it asks with AskUserQuestion (one option per browser +
"Open a confirmation screen in every connected Chrome extension…") and calls `select_browser` / `switch_browser`.
The selection is per session and **subagents inherit it** (verified 2026-09-28: a subagent saw the chosen browser
`inUse: true` and `tabs_context_mcp` worked without asking).

The visual agent:
- loads the Chrome tools in ONE ToolSearch call (`tabs_context_mcp, tabs_create_mcp, navigate, computer,
  read_page, resize_window, javascript_tool, tabs_close_mcp`);
- calls `tabs_context_mcp` first, opens its OWN tab (`tabs_create_mcp`), closes it at the end;
- never calls `select_browser` / `switch_browser` / AskUserQuestion — if a Chrome tool says several browsers are
  connected and none is selected, or the extension does not answer after 2 tries, it switches to the fallback and
  records why under `## Autonomous decisions`;
- never triggers `alert`/`confirm` dialogs (they freeze the extension);
- mobile: the Chrome window cannot go below ~587 px on this machine — use a same-origin `<iframe>` at 400 px
  (recipe: `context/archive/2026-09-21-settings-account/screenshots/README.md`, incl. the JPEG→PNG note).

### 2. Playwright (fallback — no human needed)

`scripts/visual-capture.mjs` drives headless **system** Chrome (`channel: "chrome"`): registers a fresh local
account (or signs in), runs setup steps (e.g. upload the fixture through the import wizard), then captures each
named shot at each viewport, desktop 1440×900 and mobile 400×812. Header of the script = full spec format.

```bash
npm i --prefix "$TMPDIR/pw" playwright@1.55          # outside the repo; not a dependency
PW_DIR="$TMPDIR/pw" node .claude/skills/10x-autonomous-run/scripts/visual-capture.mjs "$TMPDIR/spec.json"
```

Keep `spec.json` and any extra script OUTSIDE the repo. A registered account may land on `/confirm-email`; locally
the session is already active (confirmations off), so protected routes render — check one PNG to be sure.

## States and data

- Every state named by the plan's `[visual]` rows, desktop + mobile, plus the matching kit frames from
  `design/rytm-os/prototype/views/*.html` (named `kit-<state>-…`).
- Data: a fresh local account + the synthetic ING fixture (`test/fixtures/ing/`) through the real UI. Reach states
  through the product (set a threshold in the editor, delete through the dialog), never by writing to the DB.
- **Error states**: prefer a code path the app already has (invalid input, missing id). If a state is only
  reachable by breaking the DB, do it inside a transaction you roll back — never revoke grants / drop policies and
  "restore later" (the 2026-09-27 run did; the orchestrator had to re-verify grants). If you must mutate the local
  DB outside a transaction, end the step with `npx supabase db reset`. Unreachable → code-reviewed only, say so.

## Judge

Compare against the prototype: layout, component patterns, tokens (`ink/paper/paper-soft/excess/excess-text/
muted/line/green` only), copy from `src/content/copy.ts`, visible focus, keyboard path (tab order, Enter/Esc,
focus return, **initial focus never on a destructive action**). For numeric views, hand-check one number against
the rule and write the arithmetic in the review. Fix real discrepancies on the branch (then re-run lint, astro
check, npm test, build, smoke); what the kit lacks → gap row in `context/foundation/design-kit.md` +
`DESIGN-GAP` comment, never invented.

## Output

`<change dir>/screenshots/*.png` + `README.md` (table: state · desktop · mobile · how reached), and
`reviews/visual-review.md` ending with exactly one line:

```
VISUAL: PASS — <reason> | VISUAL: GAPS — <what> | VISUAL: NOT-CAPTURED — <why>
```

GAPS and NOT-CAPTURED do not block shipping; they are reported. **Never fake a screenshot.**
