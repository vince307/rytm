# Handoff — `pattern-threshold-over-limit` (slice S-04)

Written by the visual-gate step (2026-09-27, autonomous run `2026-09-27-s03-s02-s04`). All 15 named states were captured at 1440 px and 400 px on a fresh account with the synthetic fixture; three real kit discrepancies were fixed (`0a6973d`, `b72601a`) and the gate ended `VISUAL: PASS`. What the next agent must not get wrong: the Ship step must `npx supabase db push` the new migration `20260927200000_pattern_thresholds.sql` to the hosted project **before** merging — the detail and list read `pattern_thresholds` and fail without it.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/pattern-threshold-over-limit`, cut from `main` at `a6a8b18`. Confirmed with `git branch --show-current` before any edit |
| Commits on branch | earlier steps up to `d73e39e` (impl-review handoff), then this step: `0a6973d` `fix(...): zgodność z kitem z bramki wizualnej`, `b72601a` `fix(...): tło pola progu na tokenie paper (DESIGN-GAP: G32)`, then the docs commit `docs(...): bramka wizualna` |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `archived` (archive step 2026-09-27; folder moved to `context/archive/2026-09-27-pattern-threshold-over-limit/`, roadmap S-04 → done) |
| `## Progress` rows remaining | 1 (`grep -c '^- \[ \]' plan.md`): 6.12 `[human]` |
| Working tree | Clean apart from the maintainer's ` M .gitignore` and `?? .claude/skills/10x-autonomous-run/`. Neither was staged |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `context/changes/pattern-threshold-over-limit/reviews/visual-review.md` | Visual gate report: states, hand-checked over-limit arithmetic, token/copy/keyboard/mobile checks, fixes, observations; ends with the `VISUAL:` line |
| `context/changes/pattern-threshold-over-limit/screenshots/` | 35 app PNGs (15 states × desktop/mobile + extras) and 4 kit PNGs (`kit-patterns-*`, `kit-pattern-wolt-*`); `README.md` = account set-up and state table |
| `src/components/patterns/PatternsTable.tsx` | (`0a6973d`) name link may wrap — arrow column fits at 1440 px |
| `src/components/patterns/ThresholdEditor.tsx` | (`0a6973d`, `b72601a`) `switchBase` and the value box follow kit `.threshold-option` / `.input-suffix` (8 px radius, weight 400, bolder suffix); box stays `bg-paper` with `DESIGN-GAP: G32` |
| `src/pages/patterns/[...key].astro` | (`0a6973d`) transaction row: description `min-w-0`, amount `shrink-0` + `whitespace-nowrap` |
| `context/foundation/design-kit.md` | (`b72601a`) new gap row G32 (field background `--white` has no token) + round-3 item 21 |
| `context/changes/pattern-threshold-over-limit/follow-ups/review-fixes.md` | new F11 (app-wide `rounded-lg` 14 px vs kit 8 px fields) |
| `context/changes/pattern-threshold-over-limit/plan.md` | 6.8, 6.9, 6.10 ticked `— visual gate 2026-09-27` |
| `context/changes/pattern-threshold-over-limit/handoff.md` | This file |

## 3. Verification

Observed in this step. Baseline: post-S-02 `main` `a6a8b18` — lint 0 · astro check 0 errors (93 files) · vitest 78/78 (5 files) · pgTAP 54 (3 files) · smoke 61 PASS.

| Command | Result |
| --- | --- |
| `npm run lint` | 0 errors (Δ0) — after `b72601a` |
| `npx astro check` | 0 errors, 109 files (+16) |
| `npm test` | 141/141, 8 files (+63, +3 files) |
| `npm run fixture:check` | OK |
| `npm run build` | Complete |
| `BASE_URL=http://localhost:4398 npm run smoke` | 77 PASS / 0 FAIL (+16), run after `0a6973d` and again after `b72601a` |
| `npx supabase test db` | not run — no schema change in this step (inherited 76 from impl-review, unverified here) |
| Screenshots | 15 states × 1440/400 on :4399, fresh account `visual-threshold-<ts>@rytm.local`, fixture import 206 debits; all re-captured after the last fix |
| Hand-checked over-limit | count (stacja, 2/mies., 08.2026): 286,10+244,18+304,41 = 834,69 zł = list + detail; sum (kino, 100 zł, 07.2026): 40,66+35,61+51,98 = 128,25 → 28,25 zł = detail; amount (kawa-testowa.pl, 35 zł): 39,00−35,00 = 4,00 zł = list + detail |
| `error-read` forcing | `revoke select on public.pattern_thresholds from authenticated` for one request, then `grant`; verified afterwards `authenticated` = DELETE,INSERT,SELECT,UPDATE |
| Ports | :4399 (dev) and :4398 (kit http.server, then smoke dev) started by this step and killed; `lsof` shows both free. :4321 never touched |

No deliberate break in this step (visual gate; the fixes are presentational and covered by the screenshots).

## 4. Next command

Archived by the Ship step (`chore(archive): close pattern-threshold-over-limit`). Remaining Ship actions: push, PR, CI green, **`npx supabase db push` of `20260927200000_pattern_thresholds.sql` to the hosted project before merge**, merge, production deploy.

## 5. Open

**Post-run human checklist:**

- [ ] 6.12 [human] Product owner confirms plan Autonomous decisions 1 and 2:
  - Decision 1: excess part for sum/fixed (against the literal US-01 AC) — `src/lib/patterns/over-limit.ts` `overLimit`.
  - Decision 2: reference month = latest month present in the data — `src/lib/patterns/over-limit.ts` `referenceMonth`.

**DESIGN-GAPs added:** G32 — field background `--white` has no brand token; `ThresholdEditor.tsx` value box (comment `DESIGN-GAP: G32`); `FormField.tsx` / `DeleteAccountDialog.tsx` already use `bg-white` (pre-existing, untouched).

**Follow-ups** (`follow-ups/review-fixes.md`): F3 (shared focus ring — the copies render identically, still a cleanup), F4, F5, F8 (bfcache pending state — not reproduced in headless Chrome, stays open), new F11 (`global.css` `--radius` / `field-styles.ts` `field` vs kit 8 px).

**Observations from the gate** (`reviews/visual-review.md`): `error-read` shows the K18 CSV copy; header over-sum shows amber „0,00 zł” without a threshold; `?month` outside the pattern's months falls back to the reference month (`view.ts` `patternDetail`).

**Known risks carried** (unchanged): `keyFromPath` double-decodes a literal `%XX` key (404, never 500); `loadThresholds` no paging; normalizer drift orphans thresholds (`normalizeMerchant`); **migration must be `db push`ed before merge**.

## 6. Autonomous decisions

1. **Forced `error-read` with a temporary grant revoke, not by stopping Supabase or editing code.**
   - Rejected: `supabase stop` (would also break the maintainer's :4321), a code-level forced error (a fake state).
   - Why: a real read error through the real code path, reversible in one statement, verified restored.
   - Would change: a shared/hosted DB (never do this there) or the maintainer asking for Supabase-down specifically.
2. **Captured `empty-month` on a pattern with no occurrences in the reference month**, not via `?month=<missing month>`.
   - Why: decision 14 makes a missing `?month` fall back to the reference month, so that URL never shows the empty state.
   - Would change: the product wanting any month selectable (then `patternDetail` must accept it).
3. **Fixed the editor styling to the kit's 8 px / weight 400 only inside `ThresholdEditor`; left shared `field-styles.ts` / `FormField` at 14 px (F11).**
   - Why: one view + global tokens; the shared field radius affects neighbouring views and needs its own screenshots.
   - Would change: the author naming a field radius token, or the maintainer approving the sweep.
4. **Reverted `bg-white` to `bg-paper` + G32 instead of matching the kit's `#fff`.**
   - Why: CLAUDE.md allows only the eight brand colour names; the kit's `--white` has no token, so it is a gap, not a value to copy.
   - Would change: G32 delivered (a token in `brand.css`) or a rule update allowing `white`.
5. **Removed `whitespace-nowrap` from the list name link rather than hiding a column or shrinking fonts.**
   - Why: kit `.merchant` wraps; real names are long; the arrow is S-04's new affordance and must be visible at 1440.
   - Would change: the kit specifying truncation (`…`) for long merchant names.
6. **Imported the fixture via `POST /api/imports` with a payload from `parseIngStatement` + `buildImportPayload`** (as the S-02 visual gate did), while the account registration and every threshold action went through the UI.
   - Why: the import wizard is not the view under test; same parser code path.
   - Would change: a requirement that the visual gate exercise the wizard too.
7. **Archived with 6.12 `[human]` still open** (Ship step, `/10x-archive` warning: 1 pending, 0 automated / 1 manual; 11 `[reviewer]`/`[visual]` rows carry no SHA by design; all 6 phase SHAs are ancestors of HEAD, no repoint).
   - Rejected: blocking the archive or the ship until the product owner answers.
   - Why: 6.12 is a post-run product-owner confirmation of two recorded decisions, not a defect; it stays visible here in §5 and in the PR body.
   - Would change: the product owner rejecting decision 1 or 2 — then a new change reopens `over-limit.ts`.

ARTIFACT GAP: none.
