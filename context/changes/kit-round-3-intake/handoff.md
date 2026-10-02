# Handoff — `kit-round-3-intake` (slice F-04)

Written by the `/10x-plan-review` step: verdict PROCEED, `plan.md` fixed in place (byte-faithful kit copy, two stale
comments added to the seam sweep, `## Known risks`), no product or kit file touched. The next agent must NOT run
prettier on `design/` or `src/styles/brand.css` (neither is prettier-formatted; the husky hook is not installed here)
— copy the delivery byte for byte and patch `content.json` with the Node `JSON.stringify(obj, null, 2) + "\n"`
round-trip (plan § Critical Implementation Details).

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/kit-round-3-intake`, cut from `main` at `577b163` (+ roadmap commit `78386c1`) |
| Commits this step | 1 (`docs(kit-round-3-intake): plan review`) on top of `dcd27e8` |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `plan_reviewed` |
| `## Progress` rows remaining | 24 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after commit |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `context/changes/kit-round-3-intake/reviews/plan-review.md` | review report: 1 critical, 1 warning, 3 observations; `VERDICT: PROCEED` |
| `context/changes/kit-round-3-intake/plan.md` | F1: no-prettier byte-faithful copy (Current State, End State, Critical Implementation Details, P1 §1/§2, criteria + Progress 1.1/1.2); F2: P3 seam sweep names `ImportWizard.tsx` `genericError` doc and `TrendChart.astro` header comment; new `## Known risks` |
| `context/changes/kit-round-3-intake/plan-brief.md` | P1 risk cell updated for F1 |
| `context/changes/kit-round-3-intake/change.md` | `status: plan_reviewed` |
| `context/changes/kit-round-3-intake/handoff.md` | this file |

## 3. Verification

| Command | Result |
| --- | --- |
| `git branch --show-current` | `feat/kit-round-3-intake` |
| Node leaf diff round-2 kit vs delivery `content.json` | 41 changed/removed leaves; every one the app reads is covered by the plan; others unread in `src/` (grep) |
| `diff` kit vs delivery `react-kit/styles/brand.css`; `sed(font path) kit brand.css \| cmp - src/styles/brand.css` | exactly the 8 `--rytm-*` token lines; `src/styles/brand.css` in sync byte for byte |
| `npx prettier --check` on kit `styles.css`, `brand.css`, `content.json`, `routes.md`, `src/styles/brand.css` | all warn → not prettier-formatted (basis of F1) |
| `git config core.hooksPath`; `.git/hooks`; `package.json` `prepare` | unset; only samples; no `prepare` → husky inactive; CI has no prettier step |
| `JSON.stringify(JSON.parse(delivery content.json), null, 2) + "\n" === file` | true → Node patch is byte-preserving |
| `diff` round-2 vs delivery `prototype/styles.css` \| grep radius | no field/panel radius change → field-radius / panel-radius follow-ups not fired |
| lint / astro check / tests / build / pgTAP / smoke | not run — review only, no code changed (baseline in agent contract, inherited, unverified) |

## 4. Next command

`/10x-implement kit-round-3-intake phase 1`

## 5. Open

- Manual Progress rows (human checklist): 1.8 `[reviewer]` kit equals delivery byte for byte except the 4 restored strings; 2.8 `[reviewer]` kit-contract assertions map to real reads; 3.6 `[visual]` screenshots desktop + ~400 px (`/login?error=1`, `/reset`, `/reset?sent=1`, `/register` short password, `/home`, `/patterns`, `/fixed`, `/settings` short password); 3.7 `[reviewer]` seam sweep / register / follow-ups; 3.8 `[human]` accept kit-text deviations (`fillMonthLocative` „we wrześniu”, `tableHeaders` body order, `copyExtra.imports.saveError`, 4 `authStates` restored in kit) and send round-4 K-rows to the author.
- Known risks (plan `## Known risks`): git hooks active in another checkout would prettier-reformat staged `design/**` — check `git show --stat HEAD -- design src/styles` after the p1 commit; `.prettierignore` for `design/` + `src/styles/brand.css` is a follow-up candidate for Phase 3 `follow-ups/review-fixes.md`. Reader-side index reads in `home.astro` `StatCard` guarded only by grep + kit-contract `stats[1]` pin + visual row.
- The delivery folder is outside git (`context/runs/2026-10-02-kit-round-3/kit-delivery/`, present at review time); if missing at implement time → `ARTIFACT GAP`.
- Follow-ups are created in Phase 3 (`follow-ups/review-fixes.md`, Triggers S-12/S-14/S-15). No `DESIGN-GAP` added. Migration: no.

## 6. Autonomous decisions

1. **F1 fixed as byte-faithful copy, not „prettier everything consistently”.** Rejected: formatting kit + `brand.css` together (idempotent too, but rewrites whole author files, breaks the „8 token lines” contract and the raw delivery diff). Would change: the maintainer installing the hook repo-wide / adding a CI prettier gate without a `design/` ignore.
2. **`.prettierignore` not added in F-04** — tooling change outside the slice; recorded as Known risk + follow-up candidate. Would change: the p1 commit actually getting reformatted by a hook.
3. **Verdict PROCEED, no phase split/merge** — P1 cannot be green kit-only (`copy.ts` imports the JSON, smoke pins the filled trend sentence); each phase fits one agent. Would change: P1 implement running past context hygiene (then split app adaptations from kit copy is still impossible — split helpers/tests out instead).
4. **No product decision overturned**; kit-text deviations already in `[human]` 3.8; PRD agrees on 3 months / password length 6. Would change: PRD edit to the trend minimum or password rule.
5. **No sub-agent for Step 3** — the riskiest claims were file-local and verified directly (leaf diff, grep, `cmp`). Would change: a plan touching shared modules with wide blast radius.
