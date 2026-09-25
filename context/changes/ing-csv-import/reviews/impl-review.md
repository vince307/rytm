<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: S-01 Import wyciągu ING

- **Plan**: context/changes/ing-csv-import/plan.md
- **Scope**: Full plan
- **Reviewed phases**: 1, 2, 3, 4
- **Date**: 2026-09-25
- **Verdict**: APPROVED
- **Findings**: 0 critical, 2 warnings, 7 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS |
| Scope Discipline | PASS |
| Safety & Quality | WARNING |
| Architecture | PASS |
| Pattern Consistency | WARNING |
| Success Criteria | PASS |

Success criteria re-run in this review (2026-09-25, local Supabase, own dev server on :4398): `npx supabase db reset` OK; `npx supabase test db` PASS (2 files, 42 tests); `npm run db:types` → `import_ing_statement` present, generated file unchanged; `npm run lint` OK; `npm test` 32/32; `npm run fixture:check` OK; `npx astro check` 0 errors; `npm run build` OK; `npm run smoke` 46/46; DESIGN-GAP G25–G27/K16: 7 in `src`, rows in `design-kit.md`. Manual rows 3.4–3.5 and 4.4–4.9 verified in Chrome — evidence in `screenshots/README.md`.

Checked and clean: no XSS sinks (`set:html` / `dangerouslySetInnerHTML`), CSRF covered by Astro 7 `security.checkOrigin` default, no open redirect (fixed paths, `URLSearchParams`, `z.iso.date()` on `from`/`to`), endpoint authenticates itself (`getUser` → `/login`), RPC `security invoker` + `search_path=''` + grants + pgTAP 42501, atomicity tested (23505 rollback), only the chosen account's debits leave the browser, no N+1 on the list, colors only from repo tokens, copy only from `copy.ts`. No DRIFT/MISSING against the plan; known adaptations (format.ts extended, UTF-8 rejection, `stepBack`, ServerError slot, eslint `returns` off for `.astro` because the rule crashes on frontmatter `return`) are consistent with plan intent.

## Findings

### F1 — Double submit is not guarded; second POST shows a false overlap error

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Safety & Quality
- **Location**: src/components/imports/ImportWizard.tsx:415-429 (`SubmitButton` → src/components/auth/SubmitButton.tsx:28)
- **Detail**: `SubmitButton` disables itself only via `useFormStatus().pending`, which React 19 sets for forms whose `action` is a function; this form is a native `method="POST" action="/api/imports"` navigation, so the button most likely never disables and "Importowanie…" never shows. A double click sends two POSTs: the first saves, the second hits `imports_no_overlap` and the browser lands on `?error=overlap` with the range just imported — the user is told the import failed although it succeeded. No data corruption (the exclusion constraint serialises it). Same pattern in DeleteAccountDialog/auth forms, but harmless there. Not yet reproduced in the browser (≈80% confidence).
- **Fix A ⭐ Recommended**: Track a local `submitting` flag set in the form's `onSubmit` and pass it to `SubmitButton` via its existing `disabled` prop (plus show `pendingText`).
  - Strength: Minimal, local to the wizard; keeps the native POST + redirect pattern the plan chose.
  - Tradeoff: If the navigation is cancelled (Back), the flag stays set until remount — acceptable, the island resets on page load.
  - Confidence: HIGH — plain React state, no dependency on React form-action semantics.
  - Blind spot: Other forms using `SubmitButton` keep the latent issue.
- **Fix B**: Make `SubmitButton` itself robust (listen to the parent form's `submit` event) so every form benefits.
  - Strength: Fixes the shared component once for all forms.
  - Tradeoff: Touches auth and settings forms outside S-01 scope; needs re-verifying them.
  - Confidence: MED — broader blast radius.
  - Blind spot: Behaviour of forms that intentionally re-enable after client-side validation.
- **Decision**: FIXED (Fix A) — `submitting` flag in the wizard form `onSubmit` + optional `pending` prop on SubmitButton

### F2 — Wizard does not run the shared payload schema before step 3

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: src/components/imports/ImportWizard.tsx (payload built via `buildImportPayload`); src/lib/import/schema.ts:3-5, :17
- **Detail**: `schema.ts` is documented as "one schema for both sides", but the island never calls `importPayloadSchema`. Constraints enforced only server-side: `bankTxId` `^\d{18}$` (parser only strips `'`/whitespace), text fields ≤ 500, `accountName` ≤ 200. A real file violating them shows a ready step 3, then comes back as `?error=invalid` → "Nieznany format pliku" on step 1.
- **Fix**: In step 3 run `importPayloadSchema.safeParse(payload)`; on failure show the blocking `unknownFormat` alert (G27) instead of the import button.
- **Decision**: FIXED — `importPayloadSchema.safeParse` in step 3; failure blocks with `unknownFormat` (DESIGN-GAP: G27)

### F3 — Request body size: url-encoded JSON, no size check, Vercel 4.5 MB ceiling

- **Severity**: 💬 OBSERVATION
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Safety & Quality
- **Location**: src/pages/api/imports.ts:25; src/lib/import/schema.ts:10; ImportWizard.tsx:415
- **Detail**: The form posts JSON as `application/x-www-form-urlencoded`; quotes/braces/colons triple and Polish letters grow ×6, so a realistic 5000-debit import is ~2 MB (plan estimated ~1 MB) and the schema's worst case exceeds Vercel's 4.5 MB body limit → raw 413 instead of the wizard's error. `formData()` is read with no size guard (bounded on Vercel, unbounded locally).
- **Fix**: Set `encType="multipart/form-data"` on the form (no percent-encoding) and note the 4.5 MB platform ceiling next to `MAX_DEBITS`.
  - Strength: One attribute; the endpoint's `formData()` reads multipart unchanged.
  - Tradeoff: Worst-case schema payload can still exceed 4.5 MB (3 × 500-char fields × 5000).
  - Confidence: MED — size arithmetic not measured on a real 5000-row file.
  - Blind spot: Real ING statements rarely approach 5000 debits for the MVP.
- **Decision**: FIXED — wizard form posts `multipart/form-data`; 4.5 MB Vercel ceiling documented at `MAX_DEBITS`

### F4 — `formData()` on a non-form body returns 500

- **Severity**: 💬 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/pages/api/imports.ts:25
- **Detail**: `await context.request.formData()` throws on e.g. `Content-Type: application/json` (same-origin); the endpoint answers an unhandled 500 instead of `?error=invalid`. Same shape in `delete.ts`.
- **Fix**: Move `formData()` inside the existing try/catch and redirect to `?error=invalid`.
- **Decision**: FIXED — `formData()` moved inside the try/catch → `?error=invalid`

### F5 — Read errors render as "no data" (list, overlap ranges, result count)

- **Severity**: 💬 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/pages/imports/index.astro:17-26; src/pages/imports/new.astro:13-18; src/pages/imports/result.astro:29-30
- **Detail**: A failed `imports` read on `/imports` shows the empty state ("Nie masz jeszcze żadnego importu"); on `/imports/new` it silently disables the step-3 overlap check (DB still enforces it); on the result page a failed count renders "Dodaliśmy 0 obciążeń." The plan specified no error states and the kit has none.
- **Fix**: Render `copy.components.error` on list/result read errors (log as now); leave `new.astro` relying on the DB constraint.
- **Decision**: FIXED — `/imports` and `/imports/result` show `copy.components.error` on a failed read; `new.astro` left to the DB constraint

### F6 — pgTAP misses the `auth.uid() is null` and >5000 branches

- **Severity**: 💬 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: supabase/tests/database/import_rpc.test.sql
- **Detail**: Both 22023 branches of `import_ing_statement` are untested; everything else follows `domain_rls.test.sql`.
- **Fix**: Add two assertions (authenticated role without `sub` → 22023; 5001-element array → 22023) and bump `plan()`.
- **Decision**: FIXED — two pgTAP assertions (no `auth.uid()` → 22023, 5001 elements → 22023), `plan(16)`

### F7 — `invalid` → `unknownFormat` mapping lacks its DESIGN-GAP G27 marker

- **Severity**: 💬 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: src/components/imports/ImportWizard.tsx:228-229
- **Detail**: G27 in `design-kit.md` lists the rejected payload as a placeholder case, and the other G27 uses (L65, L374) carry `// DESIGN-GAP: G27`; this one does not, so the gap is not traceable from the code.
- **Fix**: Add `// DESIGN-GAP: G27` on the mapping.
- **Decision**: FIXED — `// DESIGN-GAP: G27` added at the `invalid` mapping

### F8 — Text length limits exist only in zod, not in the database

- **Severity**: 💬 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: supabase/migrations/20260924224014_import_ing_statement.sql:66-75 (tables from 20260923165530)
- **Detail**: `counterparty`/`title`/`details` ≤ 500 and `account_name` ≤ 200 are enforced only by the endpoint's schema; a direct RPC/PostgREST call by an authenticated user can store longer values in their own RLS-scoped rows. Pre-existing at table level, not a regression.
- **Fix**: If the limits matter, add `check (char_length(...) <= N)` constraints in a follow-up migration (pair with S-03, which touches these columns).
- **Decision**: DEFERRED — follow-ups/review-fixes.md (CHECK constraints with S-03)

### F9 — Third inline copy of the sprite-icon markup (`Glyph`)

- **Severity**: 💬 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: src/components/imports/ImportWizard.tsx:81-90
- **Detail**: `Glyph` duplicates the `<svg><use href="/rytm/icons/ui/ui.svg#…">` markup already inlined in `ServerError.tsx` and `ui/dialog.tsx`; `Icon.astro` is unusable in islands.
- **Fix**: Extract a shared `src/components/Icon.tsx` when the next island needs icons (S-02/S-03); not blocking.
- **Decision**: DEFERRED — follow-ups/review-fixes.md (shared Icon.tsx with S-02/S-03)
