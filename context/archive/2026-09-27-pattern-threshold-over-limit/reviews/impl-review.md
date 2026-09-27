<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Próg na wzorcu i „ponad próg” (S-04 `pattern-threshold-over-limit`)

- **Plan**: context/changes/pattern-threshold-over-limit/plan.md
- **Scope**: Full plan
- **Reviewed phases**: 1, 2, 3, 4, 5, 6
- **Date**: 2026-09-27
- **Verdict**: APPROVED (after the in-review fixes F1–F2; the remaining warnings are queued in `follow-ups/review-fixes.md`)
- **Findings**: 0 critical, 4 warnings, 6 observations

Diff reviewed: `a6a8b18..HEAD` on `feat/pattern-threshold-over-limit` (37 files). Every file the plan names was
changed; there were no unplanned code files (only `context/foundation/roadmap.md` and `design-kit.md`, both
expected). Two read-only subagents did the work in parallel: plan-drift/seams and security/patterns. The
reviewer re-ran every suite, checked the live DB and did the deliberate breaks personally.

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS (two small documented drifts: `BackLink` uses `text-ink` per kit `.back-link`, not the plan's `text-muted`; Phase 3 left the `patterns.astro` call site untouched because the `"patterns" in result` guard already accepted the wider shape) |
| Scope Discipline | PASS |
| Safety & Quality | PASS |
| Architecture | PASS |
| Pattern Consistency | WARNING (F3) |
| Success Criteria | PASS |

## Verification (observed in this step, against the post-S-02 baseline `a6a8b18`)

| Command | Result | Baseline + delta |
|---|---|---|
| `npm run lint` | exit 0 | 0 + 0 |
| `npx astro check` | 0 errors, 109 files | 93 + 16 files (new routes/components/libs/tests), errors 0 + 0 |
| `npm run fixture:check` | OK | OK |
| `npm test` | 141/141, 8 files | 78/78 (5) + 63 tests / +3 files (`over-limit`, `threshold-form`, `pattern-view`) = 141 (8) |
| `npm run build` | OK | OK |
| `npx supabase db reset && npx supabase test db` | PASS, 76 tests, 4 files | 54 (3) + 22 (`pattern_thresholds.test.sql`) = 76 (4) |
| smoke on :4398 (`ASTRO_DEV_BACKGROUND=1 npx astro dev --port 4398 --ignore-lock`) | 77 PASS | 61 + 16 (4 in P4, 9 in P5, 3 in P6) = 77 |

The full gate was re-run after the F1/F2 edits (comments and docs only): lint 0, astro check 0/109, vitest 141/141,
fixture OK, build OK, smoke 77 PASS. The :4398 server was killed afterwards. :4321 (the maintainer's pid 773) was
never touched.

### Deliberate breaks (re-executed by the reviewer)

1. **Amount boundary**: in `over-limit.ts` `overLimit`, changed `tx.amountMinor > threshold.value` to `>=`.
   - Result: vitest 1 failed / 140 passed. The failing case is „fixed amount 49,00: only the transaction strictly
     over carries the excess”. After `git checkout` the suite is 141/141 again.
   - Meta-check: the 55,00 → 6,00 excess still computes under `>=`. The red comes from the zero entry for the
     49,00 transaction, so the test pins the strict boundary and the "only positive entries" contract, not the
     arithmetic.
2. **Auth guard on the save endpoint**: in `src/pages/api/patterns/threshold.ts` `POST`, removed the
   `if (!user) redirect("/login")` branch.
   - Result: smoke 76 PASS / 1 FAIL. The failing step is „threshold save without a session goes to login”
     → `302 /patterns/kawiarnia%20smoke?error=save`. After the restore, smoke is 77 PASS again.
   - Meta-check: even without the guard the anonymous upsert was refused by the DB (anon has no grants, so the
     redirect was `error=save` and no row was written). So the step proves the app-side guard runs first, and the
     break incidentally shows the DB layer holds on its own (defence in depth).

### Migration against the LIVE local DB (after `db reset`, two real accounts via GoTrue + PostgREST)

This is production-bound, so it was checked with two freshly signed-up accounts, A and B, using `curl` against
`127.0.0.1:54321`:

| Probe | Result |
|---|---|
| A insert own (no `user_id`) | 201. The row's `user_id` is A (default `auth.uid()`) |
| A upsert `on_conflict=user_id,merchant_key` (the app's path) | 200. Same `id`, kind/value updated in place |
| B select all / B select `user_id=eq.A` | `[]` / `[]` |
| B PATCH A's `wolt` | 200 `[]` (0 rows) |
| B DELETE A's `wolt` | 200 `[]` (0 rows) |
| B insert with `user_id` = A | 403 / 42501 RLS |
| B upsert A's key with `user_id` = A | 403 / 42501 RLS |
| B moves own row to `user_id` = A | 403 / 42501 (update `with check`) |
| A re-read after B's attempts | unchanged (`sum`, 5000) |
| anon select / anon insert | 401 / 42501 permission denied (no grants) |
| A `rpc/delete_own_account` → as `postgres`: A's rows / A's `auth.users` / B's rows | 0 / 0 / 1 (cascade; B untouched) |
| Grants (`information_schema.role_table_grants`) | `authenticated` DELETE, INSERT, SELECT, UPDATE only (no TRUNCATE/TRIGGER/REFERENCES); `anon` none |
| Policies | 4, one per command, all `{authenticated}` |
| Constraints | kind check, value 1..100000000, key length 1..500, `unique(user_id, merchant_key)`, FK `ON DELETE CASCADE` |
| Server | PostgreSQL 17.6. `revoke … maintain` uses the same syntax as the already-shipped `20260924122144_transactions_import_account_fk.sql` |

Verdict: no defect. The migration is safe to `db push`.

### Security of the two write endpoints

`src/pages/api/patterns/threshold.ts` and `src/pages/api/patterns/threshold/delete.ts`:

- **Auth guard**: `createClient` + `getUser()` → `/login`, identical to `api/imports/delete.ts`. Proven by
  break 2 above.
- **Input validation**: zod `thresholdSaveSchema` / `thresholdDeleteSchema`. The save endpoint also runs
  `parseThresholdValue` before any write.
- **`user_id`**: never taken from the form. `z.object` strips unknown keys, and the payload is `{merchant_key, kind, value}`.
- **CSRF**: Astro's default `security.checkOrigin`, the same posture as the imports endpoints. Observed: a
  cross-origin POST to either endpoint returns **403**, and a same-origin anonymous POST returns 302 `/login`.
- **Open redirect**: none. `thresholdRedirect` → `patternHref` → `/patterns/${encodeURIComponent(key)}`, so
  `//evil.com` becomes `/patterns/%2F%2Fevil.com`. `month` is regex-validated and fed through `URLSearchParams`,
  and the status params are fixed values.
- **XSS**: no `set:html` / `dangerouslySetInnerHTML`.

### `[reviewer]` Progress rows closed by this review

- **1.8**: Per-operation, per-role policies. Update has `using` + `with check`. No `import_id`. The cascade FK is
  present and there is no `revoke update`. Confirmed in the file and in the live `pg_policy` / `pg_constraint`.
- **1.9**: pgTAP assertions map to the proofs as follows:
  - 12–17 RLS
  - 3–7 upsert path
  - 19 US-02 survival
  - 20–21 FR-019 cascade
  - 2 TRUNCATE revoked

  The phase-1 handoff (`1d722cb`) records that the update-policy break reddened 5–7 and the cascade break
  reddened 20.
- **2.8**: The oracle cases trace to PRD „Wynik”, US-01 (Wolt count 4) and decisions 1/3/17/18. None copies the
  prototype's hard-coded marks.
- **3.7**: No `count: "exact"` in `load.ts`. `collectPages` is bounded by `MAX_PAGES`. `/patterns` was not changed
  in P3.
- **4.9**: Every string comes from `copy` / `copyExtra`. The only literals are the `" · "` joiner (decision 16) and
  the kit's own „—”. K21 matches `app.js` byte for byte, and the only new placeholders are the G31 ones.
- **4.10**: The Phase-4 diff of `PatternsTable.tsx` is only the `field-styles` import.
- **5.9**: The endpoints mirror `api/imports/delete.ts`. No write happens without zod + `parseThresholdValue`, and
  the client never sends `user_id`.
- **5.10**: Checked by static reading. The kind buttons are `type="button"` with `aria-pressed`. „Usuń próg” is
  `type="submit" form={deleteFormId}` pointing at a sibling form. The save button shows pending text
  (`copyExtra.auth.saving`). The browser keyboard walk-through is left to the visual step.
- **6.11**: K21 matches byte for byte. The `design-kit.md` G31 row did not describe every placeholder until F1
  fixed it; it now does.

The `[visual]` rows 6.8, 6.9 and 6.10 and the `[human]` row 6.12 stay open.

## Findings

### F1 — Gap register stale / incomplete (G2, G31)

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: context/foundation/design-kit.md, rows G2 and G31
- **Detail**: Two problems:
  - G2 still said the editor „w fazie 5” was pending.
  - G31 still said „faza 6 doda kolumnę” in the future tense, and it lacked the Phase 6 contract's note that the
    list's „Ponad progiem” column shows the reference month without a month label. That row was needed for 6.11.
- **Fix**: Rewrite the G2 status to "editor delivered in faza 5". Replace the G31 future-tense clause and add the
  missing note.
- **Decision**: FIXED (in the review-fix commit)

### F2 — Seam: stale comments contradicting later phases

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: `src/pages/patterns/[...key].astro` header; `src/lib/patterns/view.ts` header + `patternDetail` doc
- **Detail**: The comments contradict what later phases did:
  - The detail header still said "read-only — the editor arrives with Phase 5", but P5 wired `ThresholdEditor`.
  - `view.ts` claimed the reference month is "computed once here … never recomputed". In fact
    `[...key].astro` calls `referenceMonth(patternsResult.rows)` itself.

  Behaviour is consistent (the same function over the same full read), but the comments would mislead the next
  editor.
- **Fix**: Reword the three comments to describe the actual flow.
- **Decision**: FIXED (in the review-fix commit)

### F3 — Focus-ring class strings duplicated across phases

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Pattern Consistency
- **Location**:
  - `src/components/app/BackLink.astro`
  - `src/components/patterns/PatternsTable.tsx` `focusRing`
  - `src/components/patterns/ThresholdEditor.tsx` (input-suffix wrapper)
  - `src/components/ui/button.tsx` `buttonVariants`
- **Detail**: Two class strings are re-typed instead of shared:
  - The visible-focus ring `outline-none focus-visible:ring-[3px] focus-visible:ring-ink/15` is a literal in 3
    places.
  - `ThresholdEditor`'s suffix wrapper re-types the `field-styles.field` focus-within ring, even though P4
    created `field-styles.ts` precisely to stop that. A later token change will miss copies.
- **Fix**: Export `focusRing` (and a `fieldFocusWithin`) from `src/components/app/field-styles.ts` and import it
  in the three call sites.
  - Strength: One source, matching the G29 intent of `field-styles.ts`.
  - Tradeoff: Touches `BackLink.astro` and `button.tsx` (shared, outside S-04's view), so it needs its own
    screenshot check.
  - Confidence: HIGH — mechanical.
  - Blind spot: `tailwind-merge` ordering in `buttonVariants`.
- **Decision**: DEFERRED → `follow-ups/review-fixes.md` F3

### F4 — Invalid form with a usable key silently lands on `/patterns`

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Safety & Quality (UX)
- **Location**: `src/pages/api/patterns/threshold.ts` `POST`; `src/lib/patterns/threshold-form.ts` `thresholdSaveSchema`
- **Detail**: Any `safeParse` failure redirects to `/patterns` with no message. That happens when the key is
  longer than 500 characters (zod and the DB cap it, but `transactions.counterparty` is not capped, so such a
  pattern gets a detail page and an editor) or when `value` is missing. No data risk.
- **Fix**: Parse `key` first. If it is usable but the rest fails, redirect `thresholdRedirect(key, "error-value", month)`.
  Hide or disable the editor for keys longer than 500.
  - Strength: The user sees why the save failed.
  - Tradeoff: Splits the schema and needs new unit cases.
  - Confidence: MED.
  - Blind spot: No real merchant name longer than 500 characters has been observed.
- **Decision**: DEFERRED → `follow-ups/review-fixes.md` F4

### F5 — `loadThresholds` unpaged; arbitrary keys accepted

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: `src/lib/patterns/thresholds.ts` `loadThresholds`
- **Detail**: This is the plan's Known risk. Past PostgREST `max_rows`, rows drop silently. The effect is
  self-inflicted and RLS-scoped.
- **Fix**: Reuse `collectPages` if it is ever observed.
- **Decision**: RECORDED (follow-ups F5)

### F6 — `keyFromPath` double-decode of a literal `%XX` key

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: `src/lib/patterns/path.ts` `keyFromPath`
- **Detail**: This is the plan's Known risk. A key containing a literal `%XX` escape opens not-found (404). The
  failure is graceful and never a 500.
- **Fix**: A slug/id column, if it is ever observed.
- **Decision**: RECORDED

### F7 — Two list-item shapes; `listOverview().referenceMonth` discarded

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Architecture
- **Location**: `src/lib/patterns/view.ts` `PatternListOverviewItem` vs `src/types.ts` `PatternListItem`; `src/pages/patterns.astro`
- **Detail**: `patterns.astro` re-merges `listOverview` items by key through a second `Map`, and the returned
  `referenceMonth` is unused on the list. `PatternThresholdRow` (P1) has no importer.
- **Fix**: Let `listOverview` return island-ready items when S-05/S-06 next touch the list.
- **Decision**: RECORDED

### F8 — Save pending state never resets (bfcache)

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality (UX)
- **Location**: `src/components/patterns/ThresholdEditor.tsx` (`saving` state)
- **Detail**: After a submit, navigating back via bfcache can show a disabled „Zapisywanie…” button.
- **Fix**: Reset on `pageshow` with `persisted`. The visual step can confirm whether it reproduces.
- **Decision**: RECORDED (follow-ups F8)

### F9 — Smoke step order shifted by P5

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: `scripts/smoke.mjs` `steps`
- **Detail**: P4's „pattern detail of an unknown key is not found” now runs after the removal steps, because P5
  inserted its steps „after no threshold yet” literally. The steps are independent, so this is harmless.
- **Fix**: None.
- **Decision**: RECORDED

### F10 — Subagent claim "pgTAP lacks a TRUNCATE check" was false

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: `supabase/tests/database/pattern_thresholds.test.sql` assertion 2
- **Detail**: Assertion 2 checks `has_table_privilege('authenticated', …, 'TRUNCATE')`, and the live grants
  confirm it. Recorded so no one "fixes" it twice.
- **Fix**: None.
- **Decision**: DISMISSED

## Autonomous decisions

1. **Fixed F1 and F2 in-review; deferred F3 and F4.**
   - Chosen: fix F1/F2, defer F3/F4.
   - Rejected: fixing F3 now (it touches the shared `button.tsx` / `BackLink.astro` outside S-04's one view and
     would need its own screenshot pass). Rejected: fixing F4 now (it splits the validation contract and needs
     new unit cases plus an editor state the kit lacks; no data risk).
   - Why: the step rules say to fix a WARNING when it is cheap and local; F1/F2 are comment/doc-only.
   - Would change: the visual step finding a focus ring that differs between copies (then F3 becomes a defect),
     or a real merchant key longer than 500 characters appearing.
2. **Verdict APPROVED despite 4 warnings.**
   - Chosen: APPROVED.
   - Rejected: NEEDS ATTENTION.
   - Why: two warnings are fixed and two are LOW-risk, queued with triggers. All six dimensions are PASS apart
     from Pattern Consistency.
   - Would change: an open CRITICAL, or F3/F4 left unqueued.
3. **5.10 (keyboard) ticked from static reading plus the rendered markup contract.**
   - Chosen: tick 5.10 without a browser walk-through.
   - Rejected: leaving it open.
   - Why: every clause of 5.10 is visible in code, and the visual step still exercises `link-focus` and the
     editor states.
   - Would change: the visual step finding `aria-pressed` or the delete target wrong in a browser.
4. **Triage done in place (no AskUserQuestion)**: decisions are written into each finding's `Decision:` field.
   Would change: a maintainer asking for interactive triage.
5. **Review-fix commit uses the step's `fix(...)` message even though no CRITICAL was found.**
   - Why: it carries the F1/F2 fixes; the message still describes them truthfully.
   - Would change: the orchestrator requiring `docs(...)` for comment-only fixes.

MERGE: CLEAR — no open CRITICAL, all automated criteria met on a re-run gate (lint 0, check 0, vitest 141, pgTAP 76, smoke 77), migration verified on the live DB
