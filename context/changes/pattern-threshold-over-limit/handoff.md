# Handoff — `pattern-threshold-over-limit` (slice S-04)

Written by the `impl-review` step (2026-09-27, autonomous run `2026-09-27-s03-s02-s04`). The review covered the full plan (phases 1–6) and ended `MERGE: CLEAR`. No CRITICAL findings were raised. Two warnings were fixed in `b617899`; two were queued in `follow-ups/review-fixes.md`. `change.md` is now `impl_reviewed`.

What the next agent must not get wrong: only the three `[visual]` rows (6.8–6.10) and the `[human]` row 6.12 are still open. The visual step must capture the screenshots on a **freshly registered account** that imported the synthetic fixture, on port **4399**. It must not use the seeded `test@rytm.local` account or port 4321.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/pattern-threshold-over-limit`, cut from `main` at `a6a8b18`. Confirmed with `git branch --show-current` before any edit |
| Commits on branch | 21 from earlier steps (identity … `3f036d9` epilogue, `b201d40` phase-6 handoff), then this step's `b617899` `fix(...): poprawki z przeglądu implementacji`, then this step's docs commit (review report, follow-ups, Progress ticks, `change.md`, this handoff) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `impl_reviewed` |
| `## Progress` rows remaining | 4 (`grep -c '^- \[ \]' plan.md`): 6.8, 6.9 and 6.10 `[visual]`; 6.12 `[human]` |
| Working tree | Clean apart from the maintainer's ` M .gitignore` and `?? .claude/skills/10x-autonomous-run/`. Neither was staged |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `context/changes/pattern-threshold-over-limit/reviews/impl-review.md` | Full-plan review. Contains the verdict table, the observed gate, the live-DB RLS table, the endpoint security check, the deliberate breaks, the `[reviewer]` row closures and findings F1–F10 with decisions. Ends with the `MERGE:` line |
| `context/changes/pattern-threshold-over-limit/follow-ups/review-fixes.md` | Deferred items F3 (shared focus-ring class), F4 (invalid form with a usable key lands on `/patterns`), F5 (`loadThresholds` paging) and F8 (editor pending state after bfcache). Each has a `Trigger:` line |
| `context/changes/pattern-threshold-over-limit/plan.md` | `[reviewer]` rows 1.8, 1.9, 2.8, 3.7, 4.9, 4.10, 5.9, 5.10 and 6.11 set to `[x] … — impl-review 2026-09-27` |
| `context/changes/pattern-threshold-over-limit/change.md` | `status: impl_reviewed` |
| `src/pages/patterns/[...key].astro` | (F2, `b617899`) Header comment no longer says "read-only — editor arrives with Phase 5" |
| `src/lib/patterns/view.ts` | (F2, `b617899`) The header and the `patternDetail` doc now describe the real flow: `referenceMonth(rows)` is called by both the list and the detail |
| `context/foundation/design-kit.md` | (F1, `b617899`) G2 status says the editor was delivered in faza 5. G31 has the future-tense clause replaced and gains a note that the list's „Ponad progiem” column shows the reference month without a month label |
| `context/changes/pattern-threshold-over-limit/handoff.md` | This file |

## 3. Verification

Everything below was observed in this step. Baseline is the post-S-02 `main` at `a6a8b18`: lint 0 · astro check 0 errors (93 files) · vitest 78/78 (5 files) · pgTAP 54 (3 files) · smoke 61 PASS.

| Command | Result |
| --- | --- |
| `npm run lint` | exit 0 (baseline 0, delta 0) |
| `npx astro check` | 0 errors, 109 files (baseline 93 files, +16) |
| `npm run fixture:check` | OK |
| `npm test` | 141/141, 8 files (baseline 78, 5 files; +63 tests, +3 files) |
| `npm run build` | OK |
| `npx supabase db reset && npx supabase test db` | PASS, 76 tests, 4 files (baseline 54, 3 files; +22, +1 file) |
| `BASE_URL=http://localhost:4398 npm run smoke` | 77 PASS (baseline 61; +16 = 4 in P4 + 9 in P5 + 3 in P6). Run 3 times: initial, after restoring break 2, and after the F1/F2 edits |
| After the F1/F2 edits | lint 0 · check 0/109 · vitest 141 · fixture OK · build OK · smoke 77. pgTAP was not re-run because nothing DB-facing changed |
| Live DB (after `db reset`, two real accounts via GoTrue + PostgREST) | See the `reviews/impl-review.md` table. B cannot read, update or delete A's threshold (0 rows). B cannot insert, upsert or move a row with `user_id` = A (42501). anon select and insert → 42501. `delete_own_account` cascades A's rows to 0 and leaves B's row. `authenticated` holds only S/I/U/D. 4 per-command policies. PG 17.6 |
| CSRF | A cross-origin POST to `/api/patterns/threshold` returns 403, and so does one to `/api/patterns/threshold/delete`. A same-origin anonymous POST returns 302 `/login` |
| Ports | :4398 was started with `ASTRO_DEV_BACKGROUND=1 npx astro dev --port 4398 --ignore-lock` and killed after the last run (`lsof` shows it free). :4321 (pid 773) was never touched |

**Deliberate breaks (re-executed here):**

- **Break 1** in `over-limit.ts` `overLimit`: changed the amount rule from `>` to `>=`.
  - Result: vitest showed 1 failure („fixed amount 49,00: only the transaction strictly over carries the excess”); after restoring, 141/141.
  - Meta-check: the red comes from a zero entry for the 49,00 transaction, not from the excess arithmetic. So the break proves the strict boundary.
- **Break 2** in `api/patterns/threshold.ts` `POST`: removed the `if (!user)` guard.
  - Result: smoke went to 76 PASS / 1 FAIL („threshold save without a session goes to login” → 302 `?error=save`); after restoring, 77 PASS.
  - Meta-check: the DB still refused the anonymous upsert, since anon has no grants. The step therefore proves the app guard runs first, and it also showed that the DB layer holds independently.

## 4. Next command

Visual gate (`/10x-ui` screenshot gate) for `/patterns` and the pattern detail view `/patterns/<key>`. It performs Progress rows 6.8, 6.9 and 6.10 as specified in `plan.md` Phase 6 Manual Verification: the 15 named states at desktop 1440 px and mobile ~400 px, on `astro dev --port 4399`, using a fresh account that imported the synthetic ING fixture.

## 5. Open

**Human / visual checklist:**

- [ ] 6.8 [visual] Screenshots of all 15 states at 1440 px and at ~400 px: `list-with-thresholds`, `detail-default`, `editor-count`, `editor-sum`, `editor-amount`, `over-limit-marked`, `no-threshold`, `empty-month`, `saved`, `removed`, `error-value`, `error-read`, `not-found`, `month-other`, `link-focus`.
- [ ] 6.9 [visual] At ~400 px the detail stacks without horizontal scroll. The table scrolls inside its panel, and the arrow column (`PatternsTable.tsx`, arrow cell) is reachable.
- [ ] 6.10 [visual] A dotted key (`kawa-testowa.pl`) and a key with spaces or diacritics open their detail from the list link (`patternHref` → `[...key].astro` `keyFromPath`).
- [ ] 6.12 [human] The product owner confirms plan Autonomous decisions 1 and 2:
  - Decision 1: the excess part for sum/fixed, which goes against the literal US-01 AC. It lives in `over-limit.ts` `overLimit`.
  - Decision 2: the reference month is the latest month present in the data. It lives in `over-limit.ts` `referenceMonth`.

**Worth checking during the visual step:**

- The F8 bfcache „Zapisywanie…” stuck state in `ThresholdEditor.tsx` (the `saving` state).
- Whether the three focus-ring copies from F3 look identical in the `link-focus` state.

**Follow-ups** (`follow-ups/review-fixes.md`):

- F3: shared focus-ring class, in `field-styles.ts`.
- F4: `thresholdSaveSchema` and the endpoints' silent `/patterns` redirect.
- F5: `loadThresholds` paging.
- F8: `ThresholdEditor` pending reset.

**Known risks carried from the plan** (unchanged):

- `keyFromPath` double-decodes a key that contains a literal `%XX`. The result is a 404 not-found state, never a 500.
- `loadThresholds` has no paging.
- Normalizer drift orphans thresholds (`normalizeMerchant`).
- **Migration** `20260927200000_pattern_thresholds.sql` must be `db push`ed by the Ship step before merge. It was verified clean on the live local DB (PG 17). It depends on the MAINTAIN privilege syntax that `20260924122144_transactions_import_account_fk.sql` already shipped.

**DESIGN-GAPs:** none added. G2 and G31 were updated (F1).

## 6. Autonomous decisions

1. **Fixed warnings F1 and F2 in place; deferred F3 and F4 to follow-ups.**
   - Chosen: fix F1/F2 now, queue F3/F4.
   - Rejected: fixing F3 now, because it edits the shared `button.tsx` and `BackLink.astro` outside this slice's view and needs its own screenshots. Rejected: fixing F4 now, because it would change the validation contract, needs new tests and adds an editor state the kit does not define.
   - Why: the step rules say to fix a WARNING when it is cheap and local. F1 and F2 are comment- and doc-only.
   - Would change: the visual step showing the focus-ring copies diverging (F3 becomes a defect), or a real key longer than 500 characters (F4).
2. **Did not call AskUserQuestion for the skill's "How would you like to proceed?" or for triage.**
   - Chosen: triage inline, with decisions written into each finding's `Decision:` field.
   - Why: no human in the loop (agent contract, rule 1).
   - Would change: the maintainer reinstating interactive triage.
3. **Ticked 5.10 (keyboard) from static reading, without a browser run.**
   - Why: every clause is visible in `ThresholdEditor.tsx`: `aria-pressed`, `type="button"`, the `form={deleteFormId}` sibling form and `pendingText`. The visual `link-focus` and editor states still render them.
   - Would change: the visual step finding a keyboard defect. In that case, reopen 5.10.
4. **Dismissed the subagent's "pgTAP lacks a TRUNCATE check" claim (F10).**
   - Why: assertion 2 checks it, and the live grants confirm it.
   - Would change: nothing.
5. **Verified the migration through PostgREST with two real signed-up accounts rather than only via pgTAP.**
   - Why: this is the path the app and production use. pgTAP already covers the SQL-level statements.
   - Would change: nothing. The two views agree.
6. **Used the step's `fix(...)` commit message for comment/doc-only fixes.**
   - Why: the step names that message for review fixes.
   - Would change: an orchestrator rule that reserves `fix(...)` for CRITICAL fixes only.

ARTIFACT GAP: none. The contract, prior handoff, plan, plan-review, change and every changed file were on disk. The phase-1 break record was read from `1d722cb`.
