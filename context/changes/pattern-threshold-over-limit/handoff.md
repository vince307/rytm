# Handoff — `pattern-threshold-over-limit` (slice S-04)

Written by the `implement phase 5` step (2026-09-27, autonomous run `2026-09-27-s03-s02-s04`). Phase 5 (threshold
editor and write endpoints) is implemented and committed, both automated criteria groups green. The next agent
(Phase 6 — `/patterns` columns and row link) must not get this wrong: `src/pages/patterns/[...key].astro` now
renders `<ThresholdEditor client:load .../>` (no more static note) plus a redirect-driven result `InlineAlert`
above it; `ThresholdEditor` already exports its exact `copy` shape (`ThresholdEditorCopy`) and `src/lib/patterns/
threshold-form.ts` already has everything Phase 6 needs for formatting (`formatThresholdInput`) — Phase 6 only
touches `src/types.ts`, `src/pages/patterns.astro` and `src/components/patterns/PatternsTable.tsx`, nothing in
this phase's files.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/pattern-threshold-over-limit`, cut from `main` at `a6a8b18` (confirmed with `git branch --show-current` before any edit) |
| Commits on branch | 19, in order: change identity, research, plan, plan review, `feat(...): pattern_thresholds table and its proofs (p1)` (`6e5c08c`) + sha-record + phase-1 handoff, `feat(...): over-limit rule, input parsing and path helpers (p2)` (`dac4eff`) + sha-record + phase-2 handoff, `feat(...): keyset read, widened select, thresholds read and view models (p3)` (`3e45b8c`) + sha-record + phase-3 handoff, `feat(...): pattern detail view, read-only (p4)` (`85c0bcc`) + sha-record + phase-4 handoff, `feat(...): threshold editor and write endpoints (p5)` (`2cd7246`), `chore(...): record phase 5 commit sha in progress` (`fd84ad6`) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` (unchanged this phase — one phase remains) |
| `## Progress` rows remaining | 20 (`grep -c '^- \[ \]' plan.md`); Phase 5's 8 automated rows (5.1–5.8) are `[x]` with `— 2cd7246`; Phase 5's 2 `[reviewer]` rows (5.9, 5.10) left `[ ]` — not this step's to tick; carried unticked from before: 1.8, 1.9, 2.8, 3.7, 4.9, 4.10 (all `[reviewer]`); Phase 6 not yet started: 6.1–6.12 (all `[ ]`) |
| Working tree | clean apart from the maintainer's ` M .gitignore` and `?? .claude/skills/10x-autonomous-run/` (neither staged nor committed) |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `src/pages/api/patterns/threshold.ts` | New. `POST`, `prerender = false`. Guard exactly as `src/pages/api/imports/delete.ts` (no client / no user → `/login`); formData in try/catch (parse failure or no usable key → `/patterns`); `thresholdSaveSchema.safeParse`; `parseThresholdValue(kind, rawValue)` → `null` → `thresholdRedirect(key, "error-value", month)`; `supabase.from("pattern_thresholds").upsert({ merchant_key: key, kind, value }, { onConflict: "user_id,merchant_key" })`; error → `console.error("threshold save failed", code, message)` + `"error-save"`; else `"saved"`. No kind-vs-type check (plan decision 7) |
| `src/pages/api/patterns/threshold/delete.ts` | New. Same guard/parse/log shape, `thresholdDeleteSchema`; `.delete().eq("merchant_key", key)` (RLS scopes it to the caller); error → log + `"error-save"`; otherwise `"removed"` — idempotent (plan decision 8): an absent threshold also redirects to `removed` |
| `src/components/patterns/ThresholdEditor.tsx` | New. Props `{ patternKey; type; threshold; month; copy: ThresholdEditorCopy }`. Fixed → one non-interactive `.threshold-switch` option (`copy.acceptedAmount`); frequent → two real `type="button" aria-pressed` toggle buttons (`countPerMonth` / `sumPerMonth`), local `useState<"count"\|"sum">` defaulted from the stored threshold's kind. Value input keyed on the active kind (`key={activeKind}`) so `defaultValue` resets correctly when the toggle switches (React `defaultValue` is initial-only); `inputMode` numeric/decimal; suffix `×`/`zł`; label "Kwota"/"Liczba wystąpień" (sum reuses "Kwota" per decision 11). Note = `copy.active`/`copy.empty`. Save `<form method="POST" action="/api/patterns/threshold">` with hidden `key`/`kind`/`month`, `onSubmit={() => setSaving(true)}` (mirrors `DeleteImportDialog.tsx` — `useFormStatus()` stays false for a native POST-to-URL, so pending is caller-tracked). "Usuń próg" is a plain `Button type="submit" form={deleteFormId}` (React `useId()`) targeting a **sibling** `<form id={deleteFormId}>` (hidden `key`/`month`) — forms cannot nest |
| `src/pages/patterns/[...key].astro` | Threshold panel's Phase-4 static note replaced by `editorCopy` (assembled from `copy.threshold.*` + `copyExtra.patterns.*`) and `<ThresholdEditor client:load patternKey={key} type={pattern.type} threshold={detail.threshold} month={month} copy={editorCopy} />`. New `resultAlert` computed from `Astro.url.searchParams` (`saved` → success `copy.components.success`; `removed` → success `x.thresholdRemoved`; `error=value` → error `x.thresholdInvalid`; `error=save` → error `x.thresholdSaveError`), rendered as an `InlineAlert` above the editor inside the same panel |
| `src/content/copy.ts` | `copyExtra.patterns` (K21 block) gains `setThreshold`, `thresholdRemoved`, `valueLabel: { amount, count }`, `suffix: { money, count }`; (G31 block) gains `thresholdInvalid`, `thresholdSaveError`. `copy.threshold.{acceptedAmount,countPerMonth,sumPerMonth,empty,active,save,remove}` already existed in `content.json` (kit source) — not a gap, used as-is |
| `context/foundation/design-kit.md` | K21 row: appended a **Faza 5** note (`setThreshold`, `thresholdRemoved`, `valueLabel`, `suffix` landed in `copyExtra.patterns`) and a clause in column 1 about the field label/suffix/"Ustaw próg"/removal toast gaps. G31 row: appended a **Faza 5** note (`thresholdInvalid`, `thresholdSaveError`) and clauses in column 1 about the validation/save-failure states, the sum-kind field reuse, and the mismatched-kind-renders-as-none behaviour |
| `scripts/smoke.mjs` | +9 steps, all on key `kawiarnia smoke` (fixed, 45,50 zł), inserted between "pattern detail has no threshold yet" and "pattern detail of an unknown key is not found": "threshold with a zero value is rejected" (`error=value`), "threshold is saved" (30 zł), "threshold is changed" (40 zł — proves the upsert `onConflict` path through real PostgREST per plan-review F1), "pattern detail confirms the saved threshold", "pattern detail marks the over-limit transaction", "pattern detail shows the over-limit sum" (`>5,50 zł<`), "threshold is removed", "pattern detail drops the over-limit mark after removal". Plus, next to the other anonymous steps: "threshold save without a session goes to login" |
| `context/changes/pattern-threshold-over-limit/plan.md` | Phase 5 `## Progress` rows 5.1–5.8 → `[x] … — 2cd7246` (5.9, 5.10 `[reviewer]`, untouched) |
| `context/changes/pattern-threshold-over-limit/handoff.md` | This file |

## 3. Verification

Baseline (agent contract, post-S-02 `main` `a6a8b18`): lint 0 · astro check 0 errors (93 files) · vitest 78/78
(5 files) · pgTAP 54 (3 files) · smoke 61 PASS. Phase 4 baseline on this branch: astro check 106 files, vitest
141/141 (8 files), pgTAP 76/76 (4 files), smoke 65 PASS. All commands run and observed in this step, on this
branch:

| Command | Result |
| --- | --- |
| `git branch --show-current` | `feat/pattern-threshold-over-limit` — confirmed before any edit |
| `npm run lint` | 0 errors (delta 0) — one round of `eslint --fix` needed on `ThresholdEditor.tsx` (Prettier class-order + one `prefer-optional-chain`, fixed by hand: `threshold?.kind === activeKind` instead of `threshold && threshold.kind === activeKind`); re-checked clean after |
| `npx astro check` | 0 errors, 109 files (Phase 4 baseline 106, delta +3 — `threshold.ts`, `threshold/delete.ts`, `ThresholdEditor.tsx`) |
| `npm test` | 141/141, 8 files (Phase 4 baseline 141/8, delta 0 — this phase adds no unit-test file, per plan) |
| `npm run fixture:check` | OK |
| `npm run build` | OK (`.vercel/output/` emitted) |
| `npx supabase db reset && npx supabase test db` | PASS — 76/76 (4 files), delta 0 (this phase touches no migration) |
| `BASE_URL=http://localhost:4398 npm run smoke` | 74 PASS (65 + 9, delta 0 beyond the phase's own additions) — run four times total (baseline check, under each of the two deliberate breaks, and the final confirmation); port 4398 killed after the last run, 4321 (maintainer's own `astro dev`, pid 773, unchanged throughout) never touched |
| `grep -rnE "#[0-9a-fA-F]{3,6}\b\|\[#"` over `ThresholdEditor.tsx`, `[...key].astro`, both endpoint files | empty |
| `grep -n "DESIGN-GAP: K21\|DESIGN-GAP: G31"` in `copy.ts`, and the Faza 5 notes in `design-kit.md`'s K21/G31 rows | all present |

**Deliberate break 1 (5.6 — app-side validation bypass)**: staged the phase's real files first (`git add`,
confirmed via `git status --porcelain` that only the two maintainer paths stayed dirty), then in `threshold.ts`
replaced `const value = parseThresholdValue(kind, rawValue);` / `if (value === null)` with `const value =
Number(rawValue);` / `if (Number.isNaN(value))` (comment marking it a deliberate break). Re-ran the full smoke
suite against the live dev server: "threshold with a zero value is rejected" went red — `302
…?error=save` instead of `…?error=value` (the DB's `value > 0` check still rejected the raw `0`, but through the
save path, not the value path) — exactly the plan's meta-check: the DB alone would also refuse 0, so only the
*redirect target* distinguishes app-side validation from DB-only rejection, and it flipped. A second, unplanned
step also went red as a direct side effect ("pattern detail shows the over-limit sum" — `Number(rawValue)` skips
the zł→grosze conversion too, so "40" was stored as 40 grosze instead of 4 000, and the over-limit math no longer
lands on 5,50 zł); recorded here for completeness, not claimed as the meta-check target. Restored via `git
checkout -- src/pages/api/patterns/threshold.ts` (file was staged before the break, never modified after
restoring); `git diff` confirmed empty.

**Deliberate break 2 (5.7 — over mark/sum source)**: in `[...key].astro`, changed `patternDetail(pattern,
patternsResult.rows, threshold, refMonth, …)` to pass a literal `null` in the threshold's place. Re-ran the smoke
suite: "pattern detail marks the over-limit transaction" and "pattern detail shows the over-limit sum" went red
(200, but missing the expected markers), while "pattern detail confirms the saved threshold" (the `?saved=1`
line) stayed green — proving the badge/sum are computed from the evaluated threshold passed into `patternDetail`,
not incidentally satisfied by the saved-line render, exactly as the plan's meta-check asks. Restored via `git
checkout -- "src/pages/patterns/[...key].astro"`; `git diff` confirmed empty.

After both restores: re-ran `npm run lint`, `npx astro check`, `npm test`, `npm run fixture:check`, `npm run
build`, `npx supabase db reset && npx supabase test db`, and the full smoke suite once more end-to-end — all green,
as tabulated above — before committing.

## 4. Next command

`/10x-implement pattern-threshold-over-limit phase 6`

## 5. Open

- **Manual-only Progress rows, not ticked here** (leave for `/10x-impl-review`): `[reviewer]` 5.9 (endpoints mirror
  `api/imports/delete.ts`; no write without zod + `parseThresholdValue`; no client `user_id` — verified true in
  this step by re-reading both endpoint files against the precedent, but the row itself is a reviewer checkbox per
  the step rules, so left `[ ]`) and 5.10 (keyboard: kind-switch `aria-pressed`, "Usuń próg" submits only the
  delete form, pending text on save — not exercised with a real keyboard/AT this step, only read against the
  markup); carried from earlier phases: 1.8, 1.9, 2.8, 3.7, 4.9, 4.10.
- **Carried from plan-review, unchanged**: `[human]` Progress 6.12 (product owner confirms Autonomous decisions 1
  and 2 against the PRD's literal wording). Nothing new triggers it this phase — the save/delete endpoints do not
  recompute `overMinor`/`sumMinor`, they only store `{kind, value}`; `over-limit.ts`/`referenceMonth` are
  unchanged since Phase 2/3. Known risks in `plan.md` (pathname decoding, double-decode of a literal `%XX`,
  unbounded threshold rows, normalizer drift) — the "unbounded threshold rows" risk is now live code, not just a
  documented risk: `threshold.ts`'s save endpoint accepts any `key` with no pattern-existence check (plan decision
  7), confirmed by reading the endpoint — self-inflicted only, since RLS scopes rows to the caller (unchanged
  assessment from the plan, now exercised in real code rather than only anticipated).
- **New DESIGN-GAPs this phase**: extended `K21` and `G31` in `src/content/copy.ts` (`copyExtra.patterns` — same
  blocks Phase 4 opened; new keys `setThreshold`, `thresholdRemoved`, `valueLabel`, `suffix` under K21,
  `thresholdInvalid`, `thresholdSaveError` under G31). Both rows in `context/foundation/design-kit.md` extended
  with a **Faza 5** note; no new numbered "Do rundy 3" items added (the existing K21/G31 items already cover this
  round's additions by reference — re-checked against `context/foundation/design-kit.md`'s "Do rundy 3" section,
  items 19/20 already describe "copy szczegółu wzorca / edytora progu" and "stany … edytora progu" broadly enough
  to cover the Phase 5 keys without a new entry).
- **Next symbols to build (Phase 6)**: `src/types.ts` (`PatternListItem` gains `threshold: Threshold | null` and
  `overMinor: number`), `src/pages/patterns.astro` (loads thresholds beside patterns via `Promise.all`, merges
  `listOverview(...)`), `src/components/patterns/PatternsTable.tsx` (header order gains Próg/Ponad progiem/arrow
  columns; name cell becomes a link via `patternHref`; uses `x.thresholdCount`/`x.thresholdSum`/`x.openPattern` —
  new K21/G31 keys Phase 6 must add), plus 3 new smoke steps inserted between "pattern detail shows the over-limit
  sum" and "threshold is removed" (per plan Phase 6 §4 and this handoff's smoke-steps list above) — plan Phase 6.

## 6. Autonomous decisions

1. **`defaultValue` on the value `<input>` is reset via `key={activeKind}`, not a controlled `value` +
   `onChange`.** Chosen: an uncontrolled input re-keyed on the active kind, so switching the frequent toggle
   remounts a fresh input with the new kind's own stored value (or empty). Rejected: a controlled input with
   `useState<string>` (would need to duplicate `formatThresholdInput`'s formatting logic into a change handler for
   no benefit, since the value only needs to *reset* on kind switch, never validate live — the server does that).
   Why: matches the plan's literal wording ("defaultValue = formatThresholdInput when the stored kind equals the
   active kind, else empty") most directly, and native `<input>` behaviour (free typing, IME, paste) is preserved
   exactly. Would change: a future requirement for live client-side validation feedback while typing.
2. **`ThresholdEditor` takes a fully-assembled `copy: ThresholdEditorCopy` prop, not a `copy`/`copyExtra` import
   inside the component.** Chosen: props-in, matching `PatternsTable`'s `copy: PatternsTableCopy` precedent
   (`MonthSelect` takes only a `label` string, no full copy object, since it needs just one string). Rejected:
   importing `copy`/`copyExtra` directly inside `ThresholdEditor.tsx` (the pattern `MonthSelect` avoids, and no
   existing island imports `copy` directly). Why: keeps every island's copy dependency visible at its call site in
   the `.astro` page, consistent with the one existing precedent that assembles a same-shaped object
   (`PatternsTable`). Would change: nothing — settled by the existing precedent, not a reversible product choice.
3. **Delete form's hidden inputs use React `useId()` for `deleteFormId`, not a fixed string.** Chosen: `useId()`.
   Rejected: a hardcoded id like `"threshold-delete-form"` (would work today — exactly one `ThresholdEditor`
   renders per page — but collides if the detail page ever renders two, or if `ThresholdEditor` is reused
   elsewhere). Why: negligible cost, removes a latent collision risk. Would change: nothing.
4. **The unplanned second red in deliberate break 1** (`pattern detail shows the over-limit sum` failing
   alongside the plan's named target) **was recorded, not treated as a distinct meta-check finding.** Chosen:
   note it in §3 as a side effect of the same break. Rejected: writing a third, separate meta-check narrative for
   it (the plan names only one target step for 5.6). Why: it is a direct, mechanical consequence of the same
   bypassed conversion (`Number("40")` = 40, not 4000), not an independent signal about a different code path — it
   would be misleading to present it as proving something new. Would change: a reviewer wanting every incidental
   red explained with its own meta-check, not just the plan's named one.
5. **Never called `AskUserQuestion`.** Chosen: decide and proceed per the step rules; recorded here instead. Why:
   the step's rules override the skill's interactive defaults for this run. Would change: a maintainer message
   reinstating interactive gates for this run.
6. **Split the phase into two commits** (`2cd7246` feat, then `fd84ad6` chore appending the commit's own SHA),
   mirroring Phases 1–4. Chosen: two commits. Rejected: leaving the SHA-suffix edit uncommitted (violates the
   "clean apart from the two maintainer paths" contract), `--amend` (forbidden). Why: the SHA can only be known
   after the commit exists. Would change: a revised skill/contract deferring all SHA-writing to the epilogue, or
   accepting a dirty `plan.md` between phases.
7. **Left Progress rows 5.9 and 5.10 `[reviewer]` unticked**, per the step's explicit instruction that rows tagged
   `[reviewer]`/`[visual]`/`[human]` are never mine to check, even though I independently verified 5.9's claim
   (re-read both endpoint files against `api/imports/delete.ts`) while implementing. Would change: nothing — hard
   rule from the step prompt, not a judgment call.
8. **Did not add a new "Do rundy 3" numbered item to `design-kit.md` for the Phase 5 copy additions.** Chosen:
   extend the existing K21/G31 rows and their existing "Do rundy 3" items (19, 20) in place. Rejected: a new
   numbered item per phase. Why: items 19/20 already describe "copy szczegółu wzorca / edytora progu" and "stany …
   edytora progu" at the level of the whole feature, not per-phase — re-reading their text confirmed the Phase 5
   keys are additional instances of the same already-described gap, not a new category. Would change: the
   register's own convention turning out to expect one item per delivering phase (not observed in Phases 1–4,
   which also extended existing items rather than adding new ones for incremental copy).

ARTIFACT GAP: none — `agent-contract.md`, `handoff.md` (prior, Phase 4), `plan.md`, `reviews/plan-review.md`,
`change.md`, and every file this phase's plan section names or depends on from earlier phases
(`src/lib/patterns/threshold-form.ts`, `over-limit.ts`, `view.ts`, `thresholds.ts`, `path.ts`, `src/types.ts`,
`src/content/copy.ts`, `context/foundation/design-kit.md`, `design/rytm-os/prototype/app.js` and `styles.css`,
`design/rytm-os/react-kit/docs/content.json`, `scripts/smoke.mjs`, `src/middleware.ts`,
`src/pages/api/imports/delete.ts` and `src/lib/import/delete.ts` as the write-route precedent,
`src/components/imports/DeleteImportDialog.tsx` as the native-POST pending-state precedent, existing shared
components `Panel.astro`/`InlineAlert.astro`/`button.tsx`/`SubmitButton.tsx`/`field-styles.ts`) were present and
readable.
