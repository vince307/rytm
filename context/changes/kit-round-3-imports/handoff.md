# Handoff — `kit-round-3-imports` (slice S-13)

Written by the `/10x-research` step. `research.md` answers all eight open questions from the `/10x-new` handoff with
source anchors. No product code was touched. The one thing the next agent must not get wrong: the kit draws the
account as `{account_name} · •• {tail}` with the bank in its own cell. That retires the bank-prefixed `accountLabel()`
on all three surfaces. Also, `.result-layout` / desktop `.result-meta` have **no kit CSS**, so one new gap row +
`DESIGN-GAP` is needed. That contradicts `change.md`'s "no new DESIGN-GAP expected".

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/kit-round-3-imports`, cut from `main` at `2a8f89d` (F-04 merged) |
| Commits | 2 on the branch: `6e369ff` change identity, + `docs(kit-round-3-imports): research` (this step) |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `preparing` (set by `metadata-guard.mjs mark-researched`) |
| `## Progress` rows remaining | n/a: no `plan.md` yet |
| Working tree | clean after the commit, except the maintainer allow-list (`tree-clean.sh`) |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `context/changes/kit-round-3-imports/research.md` | Research covering: the `copyExtra.imports` → round-3 key map per use site, summary/skipped credits, account label (ING + C6), rejection split (`FileError.tooLarge`, server `invalid` → `inconsistent`), demo note rules, result page (`result-meta`, not-found, kit CSS gap), history, and the smoke/unit pins that change |
| `context/changes/kit-round-3-imports/change.md` | frontmatter only: `status: new → preparing` |
| `context/changes/kit-round-3-imports/handoff.md` | This file |

## 3. Verification

| Command | Result |
| --- | --- |
| `git branch --show-current` | `feat/kit-round-3-imports` |
| `node` dump of `content.json` `importFlow` / `importErrors` / `imports` / `app` / `components` | keys cited in `research.md` §1. `limits` = 5 / 5000 |
| `node` search of every `content.json` leaf for 19 `app.js`-only import strings | 0 hits, except `importFlow.result` „Import gotowy.” |
| `grep result-meta\|result-layout design/rytm-os/prototype/styles.css` | the only match is inside `@media(max-width:560px)` → kit CSS gap |
| `grep -rln DEMO_EMAIL src` | API routes plus `src/lib/demo.ts` only, no page or layout |
| `grep` of `scripts/smoke.mjs` and `test/unit/*` | pins listed in `research.md` §7 |
| lint / astro check / vitest / build / pgTAP / smoke | not run: research-only step, no code changed. Baseline per agent contract is inherited and unverified: lint 0, astro check 0/152, vitest 347/22, build OK, pgTAP 6/119, smoke 157/0 |

## 4. Next command

`/10x-plan kit-round-3-imports`

## 5. Open

- **New gap row needed** (plan adds it): kit `prototype/styles.css` has no desktop rule for `.result-layout` /
  `.result-meta`. Add a row to `context/foundation/design-kit.md` (next free id) plus a `DESIGN-GAP` comment in
  `src/pages/imports/result.astro`, and build from `.summary-grid`.
- **Demo note gating:** show the up-front note only when `isDemoEmail(...) && !demoImportAllowed(existing.length)`
  (`src/lib/demo.ts`). The seed demo account has 0 imports, and smoke "demo first import is accepted" needs the path
  open. The delete modal note is unconditional on demo.
- **Smoke steps to rewrite in the phase that changes them** (`scripts/smoke.mjs`):
  - „imports list names the bank”
  - „santander import result names the bank”
  - „imports shows the not-found line” ×2
  - „deleted import result goes back to the list”, if the kit not-found state is adopted

  New smoke steps are needed for the demo notes (match the rendered node `>text<`).
- **Unit pins:** `test/unit/detect.test.ts` oversized → `tooLarge`. `test/unit/banks.test.ts` `accountLabel` changes
  if the function is removed. `test/unit/kit-contract.test.ts` gains the import placeholders and limits.
- **Cross-view consumer:** `src/pages/home.astro` reads `copyExtra.imports.choose`. Keep the key, or rebind it to
  `copy.imports.choose` (same text).
- **Plan choices** (`research.md` § Open Questions 1–6): `formatRecognised {bank}`, short or long delete `{range}`,
  `accountLead` text, not-found for a malformed id, the fate of `accountLabel()`, and which K32 duplicate key to read.
- **Global `app.demoNotice` strip:** left to S-12 (roadmap S-12 outcome). S-13 does the import-local notes only.
- Follow-ups: no `follow-ups/review-fixes.md` for this slice yet. F8 dialog `max-h` is checked at the visual gate
  (demo note in the delete modal).

## 6. Autonomous decisions

1. **ING account label = the file's real `account_name`, and `importFlow.accountDefaultING` stays unused.** Rejected:
   rendering „Konto główne” for every ING import. Why: `import-formats.md` row 14 makes the name a file fact, and
   `importPayloadSchema` forbids an empty name, so the key has no reachable use. Not a PRD contradiction, so no
   `[human]` row. Would change: the kit author stating that the ING label must be generic (for example, for privacy).
2. **Drop „Pominięte wpływy / zwroty”, and use one 4-cell grid for both summary branches.** Rejected: keeping the
   cell from the kit's stale overlap branch. Why: FR-003/FR-018/D2 do not require the count, and CHANGELOG
   § Runda 3 names the four cells. Would change: a PRD amendment requiring skipped credits to be shown.
3. **Server `invalid` → `importErrors.inconsistent`, with no server code split.** Rejected: a new error code per
   cause. Why: the case is only reachable by bypassing the client schema check. Would change: a client path found
   that posts a payload the client did not validate.
4. **Save failure stays in the wizard (`?error=failed`), not on `/imports/result?status=error`.** Why: same message,
   with the retry one click away, and no new route state. Would change: the visual gate or a reviewer requiring the
   kit's result-page placement.
5. **Recommended: adopt the kit not-found state on `/imports/result` and rewrite the smoke step.** This is a
   deliberate presentation change from the kit, not an assertion edited to hide a regression. Would change: the plan
   choosing to keep the redirect, which is also valid. The plan decides.
6. **Research done locally, without parallel sub-agents.** Why: about 2,000 lines across 15 files plus the kit, all
   read directly, so delegation would only have duplicated reads. Would change: a wider scope (for example,
   cross-slice views).
