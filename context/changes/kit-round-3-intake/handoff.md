# Handoff — `kit-round-3-intake` (slice F-04)

Written by the `/10x-new` step: change identity only, no code or kit files touched. The next agent must not trust the
roadmap's list of broken keys as complete — `change.md` adds `components.error` (meaning shift) and the silent
`patterns.columns` header shift; the delivery is gitignored and lives only on the orchestrator's disk.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/kit-round-3-intake`, cut from `main` at `577b163` (+ roadmap commit `78386c1`) |
| Commits this step | 1 (`docs(kit-round-3-intake): change identity (autonomous run)`) |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `new` |
| `## Progress` rows remaining | n/a — no `plan.md` yet |
| Working tree | clean after commit (only the two files below written) |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `context/changes/kit-round-3-intake/change.md` | identity, roadmap-claim table (claim / repo now / correction), kit bindings, kit-triggered follow-ups, autonomous decisions |
| `context/changes/kit-round-3-intake/handoff.md` | this file |

## 3. Verification

| Command | Result |
| --- | --- |
| `git branch --show-current` | `feat/kit-round-3-intake` |
| node leaf count of old vs delivery `content.json` | 146 → 345 (arrays as one leaf); 15 existing keys changed value; 10 two-level keys removed |
| `grep` of `src/` for each removed key | 4 used (`authStates.loginError/resetTitle/resetBody/checkInbox`), 6 unused |
| `copyExtra` leaf count (node strip-types) | 216 |
| `diff -rq` assets (react-kit, prototype) | identical |
| `cmp` delivery root duplicates vs `react-kit/` | identical |
| lint / astro check / tests / build / pgTAP / smoke | not run — docs-only step, no code changed (baseline in agent contract, inherited, unverified) |

## 4. Next command

`/10x-research kit-round-3-intake`

## 5. Open

- Research must produce: full map of app reads of changed/removed `content.json` keys (`src/content/copy.ts` `copy`,
  page-level aliases like `const s = copy.authStates`), and the `copyExtra` → round-3 key map (roadmap's "55 renamed /
  90 reworded" unverified).
- Known regressions on swap: `home.astro` `copy.dashboard.stats[2]`; `PatternsTable.tsx` `columns.slice(0,4)` /
  `slice(4,6)` header shift; literal `{month}`/`{n}` in `fixed.astro` (`fixedCosts.new`), `home.astro`
  (`trend.tooShort`), auth forms (`passwordTooShort`), `reset/new.astro` (`r.lead`); `imports/new.astro`
  `genericError: copy.components.error` meaning shift; `login.astro`/`reset.astro` read 4 removed `authStates` keys.
- Follow-ups fired by round 3: `Badge` `new` tint (→ S-15, `--rytm-badge-soft`); G36 closed by CHANGELOG C5 (record in
  `design-kit.md`). Not fired: field radius 8 px, panel radius. Related: `field-styles.ts` focus ring (`--rytm-focus-ring`).
  Details: `change.md` § Open follow-ups.
- No `DESIGN-GAP` added. Migration expected: no.

## 6. Autonomous decisions

See `change.md` § Autonomous decisions (1 research before plan; 2 intake patch only restores removed+used keys,
app adapts to changed shapes; 3 no new Tailwind colour names in F-04; 4 G36 closed here). Each lists what would
change the answer.
