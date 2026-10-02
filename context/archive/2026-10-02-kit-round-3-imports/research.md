---
date: 2026-10-02T22:55:35+02:00
researcher: Claude (autonomous run 2026-10-02-kit-round-3, research step)
git_commit: 6e369ff3602a990613365b229778645442aa617a
branch: feat/kit-round-3-imports
repository: Rytm
topic: "S-13 kit-round-3-imports — binding the import wizard, result and history to kit round 3"
tags: [research, imports, design-kit, copy, demo, ImportWizard, DeleteImportDialog]
status: complete
last_updated: 2026-10-02
last_updated_by: Claude (autonomous run, research step)
---

# Research: S-13 `kit-round-3-imports`

**Date**: 2026-10-02T22:55:35+02:00 · **Git Commit**: `6e369ff` · **Branch**: `feat/kit-round-3-imports` · **Repository**: Rytm

## Research Question

From `change.md` § Autonomous decisions 1 and `handoff.md` §5: (1) map every `copyExtra.imports.*` use site to a
round-3 key or keep it as a K11 placeholder; (2) may step 3 drop „Pominięte wpływy / zwroty”; (3) ING account label —
kit `importFlow.accountDefaultING` vs the file's `account_name`; (4) C6 Santander label in history / result / summary;
(5) how the pages learn about the demo account and whether the up-front note is safe; (6) what the server's
`?error=invalid` shows and whether `FileError` gains `tooLarge`; (7) result page `result-meta` and the `not-found`
state; (8) which smoke / unit assertions pin today's strings. Research only — no product code.

## Summary

- **Every kit field maps to an existing column; no migration.** The history and result pages must add
  `account_number` to their `select` (today `src/pages/imports/index.astro` and `result.astro` select `source,
  account_name, period_*` only) to render `formatAccountTail`.
- **Account label (Q3/Q4): the kit draws `{account_name} · •• {tail}` with the bank in its own cell/column**, in
  `app.js` `imports()` (table: Bank column + „Konto główne · •• 4821” / „Rachunek · •• 1094”), `importSummary()`
  non-overlap branch and `importResult()`. So the bank-prefixed `accountLabel()` template (`src/lib/import/banks.ts`
  `accountLabel`, `copyExtra.imports.accountLabel` „ING · {name}”) is superseded on all three surfaces; the bank comes
  from `copy.imports.bankName[source]`. Santander's stored `account_name` is „Rachunek”, so C6 („Rachunek · •• 1094”)
  falls out with no special case. **ING: use the file's real account name** (`import-formats.md` § ING row 14 „Konto
  — nazwa rachunku”, preamble `"<nazwa> (PLN)"`; FR-003/D1 pick one named account) — „Konto główne” in
  `importFlow.accountDefaultING` is the kit's sample value, not a rule; the PRD is silent on a default label and the
  schema forbids an empty name (`importPayloadSchema` `accountName: z.string().min(1)`), so the key has no reachable
  use. Not a PRD contradiction → no `[human]` row; record as "kit sample key, unused".
- **Skipped credits (Q2): dropping the cell is allowed.** PRD FR-003 requires the result to show „liczba
  transakcji, zakres dat”; FR-018 „tylko obciążenia”; `import-formats.md` D2 says credits are skipped — none requires
  showing their count. The kit's current (non-overlap) summary has no such cell; only the stale overlap branch of
  `app.js` `importSummary()` still draws „Pominięte wpływy / zwroty” and „ING · Konto główne · •• 4821” (pre-C6
  leftovers). Recommendation: one summary grid for both branches = Bank / Rachunek / Zakres dat / Obciążenia do
  importu; the overlap alert below it. `importFlow.oneAccount` („…tylko obciążenia”) already tells the user credits
  are left out.
- **Rejections (Q6): client-side copy split + one `FileError` member.** `FileError` (`src/lib/import/detect.ts`)
  gains `"tooLarge"`; `readImportFile` and `ImportWizard.tsx` `readStatement` return it for size; step 3's `blocking`
  chain maps `chosen.debits > MAX_DEBITS` → `importErrors.tooMany` and `!payloadValid` → `importErrors.inconsistent`,
  filled from `importErrors.limits` (`{maxMb}` = 5, `{maxTransactions}` = 5000; equal to `MAX_FILE_BYTES` 5 MiB and
  `MAX_DEBITS` 5000 in `src/lib/import/schema.ts`). Server `?error=invalid` (`src/pages/api/imports.ts` `POST`, any
  `importPayloadSchema` failure) → show `importErrors.inconsistent`: it is reachable only by bypassing the same
  schema the client runs (`payloadValid`), so no server code split is needed. `readStatement`'s `catch` (an
  unreadable `arrayBuffer`) stays `unknownFormat`.
- **Demo (Q5): the pages must compute the guard themselves; the up-front note must respect the first-import
  exception.** Today only API routes read `DEMO_EMAIL` (`src/pages/api/imports.ts`, `api/imports/delete.ts`,
  `api/auth/{password,delete,reset/new}.ts`); no page or layout does. `supabase/seed.sql` creates the demo user with
  **no imports**, so on a fresh local DB the POST guard lets the first import through (`demoImportAllowed(0)`). The
  wizard note and disabled buttons must therefore show only when `isDemoEmail(Astro.locals.user?.email, DEMO_EMAIL)
  && !demoImportAllowed(existing.length)` — `new.astro` already loads the caller's imports as `existing`; on a read
  error fail closed like the endpoint (`count ?? 1`). The delete-modal note has no exception (undo is always refused).
  Smoke step "demo first import is accepted (or already present)" depends on the button path staying open on an
  empty demo account.
- **Result page (Q7):** h1 „Dodaliśmy {n} {debits}.” already equals the kit; add the `result-meta` panel (Bank /
  Rachunek / Zakres dat / Transakcje). **Kit CSS gap found:** `prototype/styles.css` defines `.result-icon` but no
  desktop rule for `.result-layout` or `.result-meta` — only `@media(max-width:560px){.result-meta{grid-template-columns:1fr 1fr}}`.
  The panel's desktop layout is undefined → a new gap row + `DESIGN-GAP` comment is needed (the `change.md` claim
  "no new DESIGN-GAP expected" does not hold). Nearest kit pattern: `.summary-grid` (label 12 px muted, value
  14 px bold). `not-found`: kit draws `result-state` with h1 `imports.notFound` + ghost „Wróć do importów”; today
  `result.astro` redirects a missing/foreign id to `/imports` (smoke pins that 302).
- **Pinned strings (Q8):** smoke pins `>Santander · Rachunek<` (imports list) and `Santander · Rachunek` (result),
  `Nie znaleziono tego importu` (×2), the 302 `/imports` for a deleted import's result — all change. Unit
  `test/unit/detect.test.ts` "rejects an oversized buffer as unknownFormat" and `test/unit/banks.test.ts`
  `accountLabel` pin the current behaviour. Strings that stay identical: `Dodaliśmy 2 obciążenia.`,
  `Import usunięty.`, `>Usuń import<`, `Nie masz jeszcze żadnego importu.`

## Detailed Findings

### 1. `copyExtra.imports` → round-3 key map (per use site)

Kit copy dumped from `design/rytm-os/react-kit/docs/content.json` (`importFlow`, `importErrors`, `imports`,
`emptyViews.imports`, `components.error`, `app.demoNotice`). "Keep" = no content.json key carries the text (checked
by a full-string search of every content.json leaf for: Dodaliśmy, Transakcje, Wróć do importu, Obciążenia do
importu, Sprawdź przed importem, Wybierz rachunek, krok, Cofnij import, Data importu, Obciążenia, Zobacz wzorce,
Przejdź do przeglądu, wybrane, Dalej, Właściciel, Pominięte, transakcja, rachunki, „Wybierz inny plik albo” — zero
hits except `importFlow.result`).

| `copyExtra.imports.*` | Use site | Round-3 binding | Note |
| --- | --- | --- | --- |
| `eyebrow`, `title`, `lead`, `newEyebrow`, `newLead`, `back`, `dropTitle`, `choose`, `newImport` | `imports/index.astro`, `ImportWizard.tsx` step 1; `choose` also `src/pages/home.astro` | `copy.imports.*` same names, identical text | `home.astro` (S-15 view) reads `copyExtra.imports.choose` → either keep the key until S-15 or rebind home to `copy.imports.choose` (same text, one-token change) |
| `supported`, `unknownFormat` (+ `DESIGN-GAP: K26` override in `new.astro`) | `new.astro` → wizard | `copy.importFlow.supported`, `copy.importErrors.unknownFormat` | Texts differ: kit „Obsługujemy pliki CSV z ING…”, „Obsługujemy ING…” (no colon). `app.js` `importsNew()` still says „wyciągi” — content.json wins. Remove override + K26 comment |
| `formatRecognised` {ing,santander} | wizard step 1 chip | `copy.imports.formatRecognised` „Rozpoznano format {bank}.” | `{bank}` has no short-name key; `app.js` `uploadReady()` writes „rozpoznano format ING”. Recommend `{bank}` = `copy.imports.bankName[bank]` → „Rozpoznano format ING Bank Śląski.” (only available key; reversible at the visual gate) |
| `bankName` | wizard step 2 `<small>` | `copy.imports.bankName` | identical |
| `accountLabel` {ing,santander} + `banks.ts` `accountLabel()` | wizard step 3, `index.astro`, `result.astro` | **replaced** by Bank cell `copy.imports.bankName[source]` + `{account_name} · formatAccountTail(account_number)`; column/term label `copy.importFlow.accountLabel` „Rachunek” | K32 duplicate: `imports.accountLabel` = `importFlow.accountLabel` = „Rachunek”; pick `importFlow.accountLabel` for the wizard and `imports.accountLabel` for history/result, or one for all — record which. `accountLabel()` and its test become dead → remove both or keep for unknown `source` fallback (bankName needs the same `isBankSource` fallback) |
| `santanderAccountName` „Rachunek” | wizard `readStatement(…, x.santanderAccountName)` → stored `account_name` | `copy.imports.santanderAccountName` (K32: also `imports.accountSantander`, `importFlow.accountSantander`) | Value is persisted in `imports.account_name` and sent by smoke payloads — text must stay „Rachunek” (it does in all three keys) |
| `stepEyebrow`, `accountTitle`, `accountLead`, `accountForms`, `selected`, `summaryTitle`, `next`, `stepBack`, `transactionForms` | wizard steps 2–3 | keep (K11); `stepBack` → `copy.importFlow.back` „Wstecz” | `accountLead`: kit „Ten plik zawiera rachunki. Właściciel konta nie jest wyświetlany.” vs app „Ten plik zawiera {n} {accounts}. Domyślnie zaznaczyliśmy…”. D1 (default = most rows) is a real rule the kit lead drops; recommend kit text verbatim (no content.json key either way; the default selection is visible as „wybrane”), record it |
| `summary.account/range/debits/skipped` | wizard step 3 | `importFlow.accountLabel`, `importFlow.rangeLabel`, new `importFlow.bank`; `debits` keep (K11); `skipped` **drop** | see Q2 |
| `overlapPrefix` (K16) + `overlapTail` | `overlapMessage` | `copy.importErrors.overlap` with `{range}` = link to `/imports` (`formatRangeLong`); `overlapTail` keep (K11) | No-range fallback (endpoint could not read the colliding import): fill `{range}` with nothing is wrong; recommend dropping the „: {range}” part only in that branch (today's `replace(/:$/, ".")` trick) |
| `confirm`, `importing`, `debitForms` (G25) | step 3 submit | `copy.importFlow.importButton`, `.waiting`, `.debitForms` | identical text |
| `resultEyebrow` | `result.astro` | `copy.importFlow.result` „Import gotowy.” | `app.js` eyebrow has no period; content.json value has one. Recommend the key (copy rule), reversible at the visual gate |
| `resultTitle` | `result.astro` h1 | keep (K11) | text equals kit h1 |
| `toPatterns`, `toOverview` | `result.astro` | keep (K11) | |
| `table.importedOn/account/range/debits` | `index.astro` | `account` → `imports.accountLabel`, `range` → `importFlow.rangeLabel`; add Bank → `importFlow.bank`; `importedOn`, `debits` keep (K11) | |
| `deleteAction`, `deleteDialogTitle`, `deleteDialogBody`, `close`, `deleting` | `index.astro` → `DeleteImportDialog` | `copy.imports.delete`, `deleteTitle` („Usunąć import z zakresu {range}?”), `deleteBody` (shorter: second sentence dropped), `deleteClose`, `deleteWaiting` | `{range}`: kit sample „01.05–31.05.2026” = short form → `formatRangeShort`, not today's `formatRangeLong` (decide at plan; short matches the kit sample) |
| `deleteDialogEyebrow` „Cofnij import” | dialog | keep (K19 partial) | |
| `deleted` (K20), `deleteError`, `deleteMissing` (G30) | `index.astro` status | `copy.imports.deleteSuccess`, `deleteError`, `notFound` „Nie znaleziono importu.” | `deleteMissing` text changes → smoke pins |
| `demoLocked` (G37) | `index.astro` `?error=demo`, wizard `?error=demo` | `/imports` → `copy.imports.demoDeleteBlocked`; wizard → `copy.importFlow.demoImportBlocked` | `copyExtra.settings.demoLocked` (settings, reset/new) is a different key — not touched |
| `saveError` (K28) | wizard `genericError` | keep (K28 placeholder) | |

Query parameters stay the app's (`?deleted=1`, `?error=missing|delete|demo`, `/imports/new?error=…`); the kit's
`?status=` names are prototype routing (`routes.md` § Runda 3). Changing them would change the server contract and
smoke for no user-visible gain.

### 2. Step 3 summary and „Pominięte wpływy / zwroty”

- PRD `context/foundation/prd.md` FR-003 („wynik importu (liczba transakcji, zakres dat)”), FR-005 note („debits
  only (D1, D2)”), FR-018 („tylko obciążenia”). `import-formats.md` D2: credits skipped, accepted simplification.
  No FR or NFR requires showing the skipped count → kit may drop it.
- Kit `app.js` `importSummary()`: non-overlap = Bank / Rachunek / Zakres dat / Obciążenia do importu; overlap branch
  still the pre-round-3 grid (Rachunek „ING · Konto główne · •• 4821”, „Pominięte wpływy / zwroty”). CHANGELOG
  § Runda 3 G23–G30: „Podsumowanie importu pokazuje nazwę banku, rachunek bez nazwiska, zakres i liczebnik
  obciążeń” — the four-cell grid is the stated intent; the overlap branch is an inconsistency inside the kit, not a
  second design. Recommend one grid for both.
- The kit's debit value uses `transactionWord` („64 transakcje”) while the button uses `debitWord`; the app already
  does the same (`x.transactionForms` / `x.debitForms`).

### 3. Rejections and the server `invalid`

- `src/lib/import/detect.ts` `FileError = "unknownFormat" | "wrongCurrency" | "empty"`; `readImportFile` returns
  `unknownFormat` for `bytes.length > MAX_FILE_BYTES` (G27 comment). `ImportWizard.tsx` `readStatement` same for
  `file.size` (G27 comment). Step 1 renders `errors[fileError]` via `Headline` → adding `tooLarge` to `FileError`
  and to the `errors` labels makes the lookup type-check; `tooLarge` needs `{maxMb}` filled before render (the other
  three have no placeholder), so a `fill(errors.tooLarge, errors.limits)` step is needed at the lookup.
- Step 3 `blocking` in `ImportWizard.tsx`: overlap → empty → `> MAX_DEBITS` (G27) → `!payloadValid` (G27).
  Kit views `imports-error-many.html` / `imports-error-inconsistent.html` show these on step 1 (`importsNew(state)`);
  the app detects them only once an account is chosen (per-account counts, D1). Showing them in step 3 with the
  same copy is a placement difference, not a gap — recommend keep, record.
- `src/pages/api/imports.ts` `POST`: `?error=invalid` for a non-form body, missing/unparseable `payload` or any
  schema failure. Kit `importErrors.tooMany` text says „ponad {maxTransactions}” — `importPayloadSchema`
  `.max(MAX_DEBITS)` also yields `invalid`, but the wizard blocks that case first. Recommend `invalid` →
  `importErrors.inconsistent` (remove G27 comment); no new server code.
- `importErrors.limits.maxTransactions` = 5000 and the kit view writes „5 000”; filling `{maxTransactions}` with the
  number gives „5000”. Polish thousands spacing via `Intl.NumberFormat("pl-PL")` gives „5000” too (pl-PL does not
  group 4 digits — `src/lib/format.ts` comment on `money`). Accept „5000”.

### 4. Demo account

- `src/lib/demo.ts`: `isDemoEmail(email, demoEmail)`, `demoImportAllowed(existingImports)` (`=== 0`), `DEMO_ERROR`.
  Endpoints import `DEMO_EMAIL` from `astro:env/server`; `src/middleware.ts` sets `context.locals.user`, so a page can
  call `isDemoEmail(Astro.locals.user?.email, DEMO_EMAIL)` (unit-tested in `test/unit/demo.test.ts`).
- `supabase/seed.sql`: demo user `22222222-…`, no import rows (“rows reach the database only through a real import”).
- Kit notes: `importsNew()` info alert + disabled „Wybierz plik”; `importSummary()` disabled import button + info
  alert below; `modal('deleteImport')` info alert + disabled danger button (`imports.demoDeleteBlocked`). `app.js`
  inline text for the wizard is „Na wspólnym koncie demo dodawanie importów jest wyłączone.” but content.json
  `importFlow.demoImportBlocked` is „…dodawanie i cofanie importów…” → use the key.
- The global `app.demoNotice` strip (`app.js` `appShell` `.demo-notice`) is assigned to S-12 by the roadmap S-12
  outcome („na koncie demo widzi stałą notę o zablokowanych akcjach”); `design-kit.md` G37 row says „S-12 + S-13”.
  Recommend S-13 does the import-local notes only and leaves the AppLayout strip to S-12 (cross-view).
- `InlineAlert.astro` already has `kind: "info"` (`bg-ink/8 text-ink`, info icon). The wizard (React) uses
  `ServerError` (`src/components/auth/ServerError.tsx`, props `message`/`children`/`className`, hard-coded error
  tone, `role="alert"`, warning icon) → the island needs an info variant (React twin of `InlineAlert` kind `info`);
  `DeleteImportDialog` likewise.
- Disabled native buttons: the server guard remains the protection; the island also has the file input and drag &
  drop (`onDrop` → `handleFile`) — disabling „Wybierz plik” alone leaves drop open. Recommend blocking at step 3's
  submit (kit: disabled import button) and on the picker; a dropped file reaching step 3 still cannot submit.

### 5. Result page

- `src/pages/imports/result.astro`: redirects to `/imports` when the id is malformed, the client is missing, or RLS
  finds no row; `countError` → `components.error`. Kit: success `result-layout` (icon, eyebrow, h1, `result-meta`,
  hero-actions), `status=error` (save failure + „Wróć do importu” — text only in `app.js`), `not-found`
  (`result-state` h1 „Nie znaleziono importu.” = `imports.notFound`, ghost „Wróć do importów” = `imports.back`),
  `waiting` (no app surface: the POST is a server redirect; the waiting state is the button's `importFlow.waiting`).
- Save failure: the app redirects to `/imports/new?error=failed` and shows `saveError` in the wizard with the picker
  one click away. Moving it to `/imports/result?status=error` would add a route state for the same message. Recommend
  keep the wizard placement; record as a layout difference.
- `not-found`: recommend rendering the kit state for a well-formed id that RLS does not find (200 + `notFound`);
  malformed id may keep the redirect or show the same state (plan decides). Smoke step "deleted import result goes
  back to the list" (`{ status: 302, location: "/imports" }`) pins today's behaviour and must be rewritten in the
  same phase — it is a deliberate presentation change from the kit, not a test edited to hide a regression.
- Kit CSS: `.result-icon` exists; `.result-layout` and desktop `.result-meta` are absent (`prototype/styles.css`,
  133 lines searched; the only `result-meta` rule is inside `@media(max-width:560px)`). → new gap row in
  `context/foundation/design-kit.md` (next free id after K32 / G37) + `DESIGN-GAP` comment; build from `.summary-grid`
  and the existing centred result section.

### 6. History (`/imports`)

- `index.astro` selects `id, source, account_name, period_start, period_end, created_at, transactions(count)` → add
  `account_number`. Kit table columns: Data importu / Bank / Rachunek / Zakres dat / Obciążenia / (action).
- Status `InlineAlert` stays (kit: inline alert in content, `routes.md` „Wyniki cofnięcia importu są komunikatem w
  treści historii importów”) — the G30 comment's „the kit shows a toast” is stale.
- `DeleteImportDialog` keeps `usePageShowReset` and `onOpenAutoFocus` (undo-import F4, visual-gate decision); its
  labels interface gains a demo note / disabled flag.

### 7. Assertions pinning today's copy

| Test | Pin | Changes? |
| --- | --- | --- |
| `scripts/smoke.mjs` "imports list names the bank" | `>Santander · Rachunek<` | yes → e.g. `>Santander Bank Polska<` and `>Rachunek · •• <tail><` |
| smoke "santander import result names the bank" | `Santander · Rachunek` | yes |
| smoke "imports shows the not-found line" / "…above the empty list" | `Nie znaleziono tego importu` | yes → `Nie znaleziono importu.` |
| smoke "deleted import result goes back to the list" | 302 `/imports` | yes if the kit not-found state is adopted |
| smoke "import result renders the debit count" | `Dodaliśmy 2 obciążenia.` | no |
| smoke "imports shows the deletion above the empty list" | `Import usunięty.` | no |
| smoke "imports lists the delete action" | `>Usuń import<` | no |
| smoke "import with an invalid payload is rejected" | 302 `/imports/new?error=invalid` | no (server unchanged) |
| smoke demo steps | redirects only (`?error=demo`) | no; no page-content assertion for demo exists — the new up-front notes need new smoke steps (demo signs in, `/imports/new` shows `>…demoImportBlocked…<` only after its first import) |
| `test/unit/detect.test.ts` "rejects an oversized buffer as unknownFormat before any parsing" | `error: "unknownFormat"` | yes → `tooLarge` (behaviour change by design) |
| `test/unit/banks.test.ts` `accountLabel` (4 cases) | bank-prefixed template | yes if `accountLabel()` is removed |
| `test/unit/kit-contract.test.ts` | no import keys today | add: `importErrors.overlap` has `{range}`, `tooLarge` `{maxMb}`, `tooMany` `{maxTransactions}`, `deleteTitle` `{range}`, `importButton` `{n}`/`{debits}`, `formatRecognised` `{bank}`, `limits` = 5 / 5000 equal to `MAX_FILE_BYTES` / `MAX_DEBITS` |

### 8. Follow-ups whose trigger fires

Re-checked from `change.md` § Open follow-ups: month template — no `{month}` in any import key bound above (not
fired). Dialog geometry (`src/components/ui/dialog.tsx` `DialogContent`) — already kit-sized; F8 `max-h` borderline
with the demo note in the delete modal (visual gate). `checkOrigin` invariant — no new POST is needed.

## Code References

- `src/components/imports/ImportWizard.tsx` — `readStatement`, `overlapMessage`, `blocking`, `serverMessage`, `ImportWizardLabels`
- `src/components/imports/DeleteImportDialog.tsx` — `DeleteImportLabels`, `usePageShowReset`
- `src/pages/imports/index.astro` — `select(...)`, `rows`, `status`
- `src/pages/imports/new.astro` — `labels` (K26 override), `serverError`, `existing`
- `src/pages/imports/result.astro` — redirects, `title`, `lead`
- `src/lib/import/detect.ts` — `FileError`, `readImportFile`
- `src/lib/import/banks.ts` — `accountLabel`, `isBankSource`
- `src/lib/import/schema.ts` — `MAX_FILE_BYTES`, `MAX_DEBITS`, `importPayloadSchema`
- `src/lib/demo.ts` — `isDemoEmail`, `demoImportAllowed`, `DEMO_ERROR`
- `src/pages/api/imports.ts` `POST`, `src/pages/api/imports/delete.ts` `POST`
- `src/lib/format.ts` — `formatAccountTail`, `formatRangeShort`, `formatRangeLong`
- `src/content/copy.ts` — `copyExtra.imports`
- `design/rytm-os/prototype/app.js` — `imports`, `importsNew`, `uploadReady`, `importAccount`, `importSummary`, `importResult`, `modal('deleteImport')`, `appShell`
- `design/rytm-os/prototype/styles.css` — `.summary-grid`, `.result-icon`, `.result-state`, `.inline-alert.info`, media rule `.result-meta`
- `scripts/smoke.mjs`, `test/unit/{detect,banks,kit-contract,demo}.test.ts`

## Architecture Insights

- Bank identity is a column-level fact now (`imports.source` → `bankName`), not part of the account label; this
  removes the only consumer of the per-bank template machinery added in S-10 Phase 5.
- The server stays the guarantee for every rule (overlap `imports_no_overlap`, schema, demo guards); all S-13 changes
  are presentation and client-side classification. No new endpoint, no new POST.
- Copy-source rule: content.json key wins over `app.js` inline text where they differ (`demoImportBlocked`,
  `supported`, `importFlow.result`).

## Historical Context (from prior changes)

- `context/archive/2026-10-02-santander-csv-import/plan.md` — introduced per-bank `accountLabel` / `formatRecognised`
  / `bankName` and the neutral „Rachunek” Santander name (owner name in header col 3 never read). Still valid:
  owner name never stored. Superseded: bank-prefixed label (kit round 3 moves the bank to its own cell).
- `context/archive/2026-09-30-public-demo-seed/plan.md` — `copyExtra.imports.demoLocked`, refusal shown after the
  POST; first import allowed while empty. Still valid: guards. Superseded: post-refusal-only presentation.
- `context/archive/2026-09-25-undo-import/` — delete dialog, F4 bfcache (`usePageShowReset`), dialog geometry.
- `context/archive/2026-10-02-kit-round-3-intake/` — F-04 intake; `design-kit.md` round-3 table assigning K16, K19,
  K20, K26, G25, G26, G27, G30, G37 (imports) to S-13.

## Related Research

- `context/archive/2026-10-02-santander-csv-import/research.md`, `context/archive/2026-09-24-ing-csv-import/research.md` — import pipeline background.

## Open Questions

Choices for `/10x-plan` (recommendations above; none blocks):
1. `formatRecognised {bank}` value — `bankName` (recommended) vs a short „ING”/„Santander” form (no key).
2. Delete-title `{range}` — short (kit sample) vs long (today).
3. `accountLead` — kit text verbatim (recommended) vs app's D1-explaining text.
4. Result `not-found` for a malformed id — render state or keep redirect.
5. Fate of `accountLabel()` + `banks.test.ts` — remove vs keep as fallback.
6. K32 — which of the duplicate `accountLabel` / Santander-name keys is read (record in `design-kit.md`).
No PRD-vs-kit contradiction found → no `[human]` row needed.
