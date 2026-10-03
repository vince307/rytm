# Handoff — `kit-round-3-home-fixed` (slice S-15)

Written by the `/10x-implement … phase 5` step of autonomous run `2026-10-02-kit-round-3`. All five phases are committed (P5 `ab93627`), `change.md` is `implemented`; only `[reviewer]` / `[visual]` / `[human]` rows are open. The next agent must not get wrong: the visual gate (5.9, 5.10) has NOT been run — no screenshot exists.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/kit-round-3-home-fixed`, cut from `main` at `1bf6a5c` (after S-14) |
| Commits | P1 `6108b70`, P2 `7934a98`, P3 `bcf364a`, P4 `e875337`, P5 `ab93627 feat(kit-round-3-home-fixed): Audyt copyExtra, rejestr luk i szwy kitu (p5)` (+ handoff/epilogue commit) |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `implemented` |
| `## Progress` rows remaining | 9 (`grep -c '^- \[ \]' plan.md`), all manual: 1.8, 2.7, 3.8, 4.7, 5.8 `[reviewer]`; 2.8, 5.9, 5.10 `[visual]`; 5.11 `[human]` |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `src/content/copy.ts` | removed `imports.debitForms`, `imports.santanderAccountName`, `auth.resetNewVisual.eyebrow/title` (kit keys now) and the four unread `home.empty*` leaves |
| `src/components/imports/ImportWizard.tsx` | `readStatement(file, kit.santanderAccountName)` (kit `imports`) |
| `src/pages/imports/result.astro` | `plural(n, flow.debitForms as [string, string, string])` |
| `src/pages/reset/new.astro` | `visual={{ ...copy.auth.resetVisual, lead: x.resetNewVisual.lead }}` (K13 lead kept) |
| `test/unit/kit-contract.test.ts` | new guard case: no `copyExtra` leaf equals a kit string, `ROLE_EXCEPTIONS` with reasons (5 entries) |
| `context/foundation/design-kit.md` | round-3 rows K11/K18/K23/K24/K25/G34/G35/G36/K29/K30 updated; new K38-K41, G39; „Do rundy 4” item 11 |
| `context/changes/kit-round-3-home-fixed/follow-ups/review-fixes.md` | closed items with commits, open items with `Trigger:` |
| `scripts/smoke.mjs` | one comment re-pointed (`copy.imports.santanderAccountName`); no step change |
| `plan.md`, `change.md` | rows 5.1-5.7 ticked with `ab93627`; status `implemented` |

## 3. Verification

| Command | Result |
| --- | --- |
| `npm run lint` | 0 errors (baseline 0) |
| `npx astro check` | Result (166 files): 0 errors, 0 warnings, 3 hints (baseline 162 files / 0 errors) |
| `npm run fixture:check` | ing OK, santander OK |
| `npm test` | 387 passed / 27 files (P4 386, +1 guard case; baseline 375 / 26 files, cumulative +12) |
| `npm run build` | OK |
| `npx supabase db reset && npx supabase test db` | Files=6, Tests=119 PASS (Δ0) |
| `npm run smoke` on :4398 | 195 PASS / 0 FAIL, "All smoke steps passed" (baseline 192, cumulative +3, Δ0 this phase) |
| `git diff --stat main -- design src/styles/brand.css` | empty |
| Seam greps (`ImportPanel`, `fixedTotalMinor`, `risenFootFor`, `DESIGN-GAP: K24/G34`) | empty in `src/`; every `DESIGN-GAP` id in `src/` (G31 G33 G38 K11 K13 K19 K21 K23 K25 K35-K40 plus G39) has a register row. `noThreshold` remains only as a `TrendChart` prop name |
| Break 1: `copyExtra.home.probe = "Bez zmian"` | guard case red (`home.probe`), restored. Meta-check: catches byte-identical duplicates only; same meaning with different text stays a reviewer row |
| Break 2: unread `copyExtra.fixed.unused` | NOT caught by a bare-name grep (`unused` matches unrelated source); caught by the access-tail grep (`\.key` or destructured name in braces) -> `NOREADER fixed.unused`; restored. The access-tail grep prints nothing on the real tree. Generic leaves checked by hand: `fixedSummary.*`, `fixed.delta`, `next`, `selected`, `saving`, `cancel`, `close`, `deleting` |

Dev server on :4398 killed; local DB reset before smoke. Leaf-reader script lived in `$TMPDIR`, not committed.

## 4. Next command

`/10x-impl-review kit-round-3-home-fixed`

## 5. Open

- Manual rows (human checklist): 1.8, 2.7, 3.8, 4.7, 5.8 `[reviewer]`; 2.8, 5.9, 5.10 `[visual]` (every `/home` and `/fixed` state, rebound views `/reset/new`, import result title, Santander account step: confirm no change); 5.11 `[human]` (product-visible choices, send K38-K41 and G39 to the kit author).
- `DESIGN-GAP`s with register rows: K38, K39, K40, K41 (no code comment, orphan kit keys), G39.
- Follow-ups: `context/changes/kit-round-3-home-fixed/follow-ups/review-fixes.md` (PanelTitle for `settings.astro` and `patterns/[...key].astro`, one-off merchants as „nowy”, kit round 4, guard-test limit).
- Carried risk: `plan.md` § Known risks (no page render test). Rebinds were byte-identical; no component API change beyond reading `kit` instead of `x` in `ImportWizard`.
- `Badge.tsx` comment still says „G34 delivered” (not a `DESIGN-GAP` marker; left).

## 6. Autonomous decisions

1. **Implemented in this context, not delegated.** Why: small, file-local phase. Would change: a larger phase.
2. **Deleted the four unread `copyExtra.home.empty*` leaves** (found by the new guard: byte-equal to `copy.home.empty*`, `home.astro` already reads the kit). Rejected: adding them to `ROLE_EXCEPTIONS`. Would change: the kit dropping those keys.
3. **`result.astro` casts `flow.debitForms` to a 3-tuple** like `new.astro` does. Would change: `plural` accepting `readonly string[]`.
4. **Leaf-reader check keys on the access tail**, not the bare name (plan F6), after the bare-name version missed the planted leaf. Would change: a typed accessor that makes unread leaves a compile error.
5. **Register edits one row per Edit; K41 added as an app-side no-op row** (orphan keys only). Would change: the kit author's reply.
6. **Commit message in Polish, approved as drafted; epilogue + handoff in one docs commit.** Would change: maintainer preference.
