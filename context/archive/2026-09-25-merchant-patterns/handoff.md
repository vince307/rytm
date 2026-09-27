# Handoff — `merchant-patterns` (slice S-03)

Written by the visual-gate step (screenshots of `/patterns` vs `design/rytm-os/prototype/views/patterns.html`). Verdict
`VISUAL: PASS`; two real discrepancies fixed in `PatternsTable` (invisible toolbar focus, non-token native search clear
button) and registered as gap G29; all Progress rows ticked. The one thing the next agent must not get wrong: the
archive step must still correct the roadmap `### S-03` Risk line (it promises a migration this slice never added).

## 1. State

| Item                         | Value                                                                                                                                                           |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Branch                       | `feat/merchant-patterns`, cut from `main` at `d11f3ef`                                                                                                          |
| Commits                      | 15 on top of `d11f3ef` (`d11f3ef..HEAD`): previous 13 + `fix(merchant-patterns): widoczny fokus pól paska wzorców` + `docs(merchant-patterns): bramka wizualna` |
| Pushed / PR / merged         | no / no / no                                                                                                                                                    |
| `change.md` status           | `impl_reviewed` (unchanged; archive sets the next status)                                                                                                       |
| `## Progress` rows remaining | 0 (`grep -c '^- \[ \]' plan.md`) — 3.8 ticked by this step                                                                                                      |
| Working tree                 | clean apart from the maintainer's ` M .gitignore` and `?? .claude/skills/10x-autonomous-run/` (never staged)                                                    |

## 2. Artifacts

| Path                                                         | What it is                                                                                                                 |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `context/changes/merchant-patterns/reviews/visual-review.md` | visual review: states, checks, fixes, observations; ends with the `VISUAL:` line                                           |
| `context/changes/merchant-patterns/screenshots/README.md`    | state table (desktop 1440 / mobile 375 / kit) and how they were captured                                                   |
| `context/changes/merchant-patterns/screenshots/*.png`        | 18 PNGs: 12 app states, 2 focus frames, 6 kit frames                                                                       |
| `src/components/patterns/PatternsTable.tsx`                  | `field`: `focus-within` border `ink` + 3 px ring `ink/8`; `control`: native search cancel button hidden; `DESIGN-GAP: G29` |
| `context/foundation/design-kit.md`                           | gap row G29 (focus state of the toolbar fields)                                                                            |
| `context/changes/merchant-patterns/plan.md`                  | Progress 3.8 ticked                                                                                                        |
| `context/changes/merchant-patterns/handoff.md`               | this file                                                                                                                  |

## 3. Verification

All observed in this step, on this branch, after the fix. Baseline = `main` at `d11f3ef` (`agent-contract.md`).

| Command                                        | Result                                                                                                           |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `npm run lint`                                 | 0 errors / 0 warnings (baseline 0, Δ0)                                                                           |
| `npx astro check`                              | 0/0/0, 89 files (baseline 82, +7 — same as impl-review)                                                          |
| `npm run fixture:check`                        | OK                                                                                                               |
| `npm test`                                     | 72/72, 4 files (baseline 32/3, +40 / +1 — same as impl-review)                                                   |
| `npm run build`                                | Complete                                                                                                         |
| `BASE_URL=http://localhost:4398 npm run smoke` | 48 PASS / 0 FAIL (baseline 46, +2); run twice (second to count); :4398 killed after                              |
| `npx supabase test db`                         | not run — no schema or DB change in this step (impl-review: 44/44)                                               |
| Focus check (Playwright, after fix)            | focused search / select wrapper border `rgb(32, 47, 64)` (`ink`) + 3 px ring; before: `outline: none`, no shadow |

No deliberate break: the fix is CSS only and there is no screenshot test to turn red; the before/after evidence is the
measured computed style and the re-captured frames. Servers :4397 (kit static), :4398, :4399 killed; :4321 untouched.

## 4. Next command

`/10x-archive merchant-patterns`, then ship (push, PR, CI, merge per the Ship step).

## 5. Open

- Manual Progress rows: none left.
- `DESIGN-GAP`s: G29 added (`PatternsTable` `field` / `control`); unchanged K17 (`PatternsTable` Kwota column), K18
  (`patterns.astro` error branch), G28 (`PatternsTable` header comment).
- Observations from `reviews/visual-review.md` (not fixed): `PageTitle` on 375 px squeezes the lead beside the button
  (shared component, kit `.dash-title` does the same); `brak-wyników` has no message beyond „0 wzorców” (needs kit copy).
- Follow-ups: `follow-ups/review-fixes.md` — F2 keyset paging in `loadPatterns` / `collectPages`, F3
  `normalizeMerchant` cases, F5/F6/F7 tidy.
- Carried risks: plan Known risks F7 (over-merge on real statements); roadmap `### S-03` Risk line still promises a
  migration — archive step corrects it.
- Local DB: a throwaway account `visual-patterns-<timestamp>@rytm.local` with the fixture import remains in local
  Supabase (local only; gone on the next `npx supabase db reset`). `test@rytm.local` was not imported into.
- S-04 / S-05 input: pattern identity = `merchantKey` (`src/lib/patterns/merchant.ts`).

## 6. Autonomous decisions

- **Playwright instead of Claude-in-Chrome.** The Chrome tool demanded a human choice between two connected browsers
  (contract forbids `AskUserQuestion`; picking one myself could act in the maintainer's live browser). Rejected:
  selecting a browser unilaterally. Used the Playwright library from the `npx` cache with system Chrome
  (`channel: "chrome"`, no browser download), which reached every authenticated state. Would change: one browser
  connected, or the orchestrator naming a `deviceId`.
- **Mobile at 375 px, not 400 px.** Plan row 3.8 names 375 px; headless allows it without the iframe trick. Would
  change: the contract requiring 400 px frames.
- **Visible focus fixed with the kit's `.field input:focus` pattern + gap G29**, not left as an observation. Why: WCAG
  2.4.7 failure on the view's only controls; the pattern already exists in the kit and in `FormField`, so nothing is
  invented. Rejected: leaving the kit's `outline:0` verbatim. Would change: the kit author delivering a different focus
  state for toolbar fields.
- **Native search clear button hidden** rather than switching to `type="text"`: keeps the `searchbox` role; the blue
  cancel glyph is a non-token colour absent from the kit's plain input. Would change: the kit adding a clear control.
- **`PageTitle` narrow lead on mobile not fixed**: shared across views; one-view scope. Would change: a restyle of the
  shared header being in scope.
- **Fix committed separately** as `fix(merchant-patterns): widoczny fokus pól paska wzorców`, docs as
  `docs(merchant-patterns): bramka wizualna`. Would change: a single-commit convention for the visual step.
- **`VISUAL: PASS`** (not GAPS): every named state captured; the remaining differences are pre-registered gaps
  (G28, K17) scheduled for S-04–S-06. Would change: counting registered-but-unfilled gaps as open visual gaps.
