---
change_id: kit-round-3-imports
title: Import wizard, result and import history bound to design kit round 3
status: implemented
created: 2026-10-02
updated: 2026-10-02
archived_at: null
---

## Notes

Roadmap S-13 (`kit-round-3-imports`), milestone M-3 (kit round 3: app without placeholders). North star of the
milestone. Second slice of run `2026-10-02-kit-round-3` (`F-04 → S-13 → S-12 → S-14 → S-15`); F-04 shipped
(PR #19, `2a8f89d`), so `design/rytm-os/` IS round 3 and is read-only for this slice. PRD refs: FR-003, FR-004,
FR-005, FR-018. The presentation changes and the rules stay the same: same validation, same limits (5 MB / 5000
debits), same overlap rule, same demo guards.

Outcome (roadmap): the user uploads an ING or Santander file and sees copy for both banks. The summary step shows
the bank, the account without the owner's name („Rachunek · •• końcówka” for Santander), the range and an
„Importuj N obciążeń” button with a pending state. The import result uses the round-3 layout. Each rejection has
its own message: file too large, too many debits, inconsistent file, currency, empty file, overlapping range with
`{range}`. The import history shows the bank, the delete dialog with `{range}`, and inline messages after a delete
(success, error, not found). On the demo account the user sees a note instead of the actions.

**Migration expected: no.** Every value the kit draws is already stored. The bank is `imports.source`. The account
tail is `imports.account_number` (26 digits, already rendered by `formatAccountTail` in the wizard). The account
name is `imports.account_name`, and Santander rows hold „Rachunek” from `copyExtra.imports.santanderAccountName`.
The range is `period_start/period_end`. No table, column, RPC or policy changes.

### Roadmap claims checked against the repo (branch `feat/kit-round-3-imports` = `main` `2a8f89d`)

| Roadmap claim (plan-time) | Repo now | Correction |
| --- | --- | --- |
| North star: kit says Santander „wkrótce” | F-04 shipped round 3. `content.json` `importFlow.supported` and `importErrors.unknownFormat` now name both banks. The app still overrides them with `copyExtra.imports.supported/unknownFormat` (`imports/new.astro`, stale `DESIGN-GAP: K26` comment that says „Santander wkrótce”) | The problem is gone in the kit. S-13 only has to drop the override and read `copy.*` (both texts differ slightly: „wyciągi” vs „pliki CSV”, „Obsługujemy:” vs „Obsługujemy”) |
| Three rejections merged under one „nieznany format” | **Four** stand-ins use `unknownFormat`, all marked `DESIGN-GAP: G27`. In `ImportWizard.tsx`: `readStatement` (size), the step-3 `blocking` chain (`MAX_DEBITS`, `!payloadValid`) and `pageError.kind === "invalid"` (server). In `detect.ts`: `readImportFile` (size). The client already tells all three cases apart. Only the message is shared | Copy-only on the client: map them to `importErrors.tooLarge/tooMany/inconsistent` with `{maxMb}`/`{maxTransactions}` from `importErrors.limits`. The limits already match (`MAX_FILE_BYTES` 5 MiB, `MAX_DEBITS` 5000) |
| Risk: server and client must return distinguishable codes | Server returns `?error=invalid` for any `importPayloadSchema` failure. That is only reachable by bypassing the client checks, which run the same schema (`payloadValid`). `FileError` is `"unknownFormat" \| "wrongCurrency" \| "empty"`: size goes through `unknownFormat` | Server code split is optional. `FileError` needs a `tooLarge` member. Server `invalid` → `inconsistent` copy, or keep it separate (→ research/plan) |
| Result screen has no kit heading | `result.astro` has a placeholder h1 `copyExtra.imports.resultTitle` („Dodaliśmy {n} {debits}.”) and eyebrow `resultEyebrow`. One stat. A stale `DESIGN-GAP: G26` comment says „before patterns exist (S-03)”. Kit `importResult()` uses the eyebrow „Import gotowy” and the same h1 „Dodaliśmy 64 obciążenia.”, plus a `result-meta` panel with Bank / Rachunek / Zakres dat / Transakcje. `content.json` `importFlow.result` = „Import gotowy.” | The h1 text matches the kit already. The gap is the `result-meta` layout, the bank and account-tail cells, and the kit `not-found` state (today a missing id redirects to `/imports`) |
| Summary: bank, account without name, range, „Importuj N obciążeń”, pending | Step 3 shows Rachunek (`accountLabel` „ING · {name}” / „Santander · {name}” + tail), Zakres, Obciążenia, Pominięte wpływy. The button `copyExtra.imports.confirm` and the pending text `importing` already exist (`DESIGN-GAP: G25`, stale). There is no „Bank” cell | Add the Bank cell, the kit account label („Rachunek · •• 1094”, C6) and drop „Pominięte wpływy / zwroty”, which the kit's non-overlap summary does not draw (→ research: PRD/FR-003 says nothing about skipped credits). Move the button and pending text to `importFlow.importButton/debitForms/waiting` |
| Overlap with `{range}` | Done by hand: `overlapPrefix` + range + `overlapTail` (`copyExtra`, stale `DESIGN-GAP: K16`). Kit `importErrors.overlap` = „Ten zakres nachodzi na istniejący import: {range}.” | Fill the kit template. The kit draws the range as a link to `/imports` plus the tail „Wybierz inny plik albo wróć do importów.” The tail is not a content.json key, so it stays in `copyExtra` (→ research) |
| History: bank, delete dialog with `{range}`, inline messages | `imports/index.astro` has no Bank column. Account = `accountLabel` with no tail. The dialog reads `copyExtra.imports.deleteDialog*`. Inline status works for `deleted` / `missing` / `delete` / `demo` (`DESIGN-GAP: G30`, `G37`) | Add the Bank column (`imports.bankName.*`) and the account tail. Rebind to `imports.delete/deleteTitle/deleteBody/deleteClose/deleteWaiting/deleteSuccess/deleteError/notFound/demoDeleteBlocked`. Eyebrow „Cofnij import” is only in `app.js` (K19 partial), so it stays in `copyExtra` |
| Demo: note instead of actions | The app shows the demo refusal only **after** a refused POST (`?error=demo` on `/imports` and `/imports/new`). The kit shows an info `inline-alert` up front, on `/imports/new`, the summary and the delete modal, with disabled buttons | New presentation behaviour: the page must know `isDemoEmail(locals.user.email, DEMO_EMAIL)`. Server guards stay unchanged. Watch for the demo seed's first-import exception (`demoImportAllowed`) |
| Items: K11 (imports), K16, **K18 (imports)**, K19, K20, K26, G25, G26, G27, G30, G37 | `design-kit.md` round-3 table assigns K16, K19, K20, K26, G25, G26, G27, G30, G37 (imports part) to S-13. **K18 → „F-04 / S-15”**: `imports/index.astro` and `result.astro` already read `copy.components.error` for a read failure | K18 is already done for imports, so drop it from S-13. Add **K28** (`copyExtra.imports.saveError`; S-13 adopts it only if the kit adds a key, so it stays a placeholder) and the C6 account label |
| Bez migracji | confirmed (see above) | none |

### Kit bindings (design/rytm-os/prototype/, content.json)

Views (rendered by `prototype/app.js` `imports()`, `importsNew()`, `uploadReady()`, `importAccount()`,
`importSummary()`, `importResult()`, `modal('deleteImport')`, `startImport()`, `deleteImportAction()`; routes in
`react-kit/docs/routes.md` § Runda 3):

| Kit view | App surface |
| --- | --- |
| `views/imports.html`, `imports-empty.html`, `imports-deleted.html`, `imports-delete-error.html`, `imports-not-found.html` | `src/pages/imports/index.astro` + `DeleteImportDialog.tsx` |
| `views/imports-new.html`, `imports-error-{unknown,currency,empty,large,many,inconsistent}.html` | `ImportWizard.tsx` step 1 (`src/pages/imports/new.astro`) |
| `views/imports-account.html` | `ImportWizard.tsx` step 2 |
| `views/imports-summary.html`, `imports-overlap.html` | `ImportWizard.tsx` step 3 |
| `views/imports-result.html`, `imports-result-error.html`, `imports-result-not-found.html`, `imports-result-waiting.html` | `src/pages/imports/result.astro`; save failure today lands in the wizard (`?error=failed`) |

content.json keys this slice binds: `importFlow.{title,steps,supported,oneAccount,result,accountLabel,importButton,
debitForms,waiting,back,rangeLabel,bank,accountSantander,accountDefaultING,demoImportBlocked}`,
`importErrors.{overlap,unknownFormat,wrongCurrency,empty,chooseOther,back,tooLarge,tooMany,inconsistent,limits}`,
`imports.{eyebrow,title,lead,newEyebrow,newLead,back,dropTitle,choose,newImport,formatRecognised,bankName,
accountLabel,santanderAccountName,delete,deleteTitle,deleteBody,deleteSuccess,deleteError,notFound,deleteWaiting,
demoDeleteBlocked,deleteClose}`, `emptyViews.imports`, `components.error`.

Kit gaps the slice keeps in `copyExtra` (text in `app.js` only, no content.json key; no new gap invented):
`stepEyebrow`, `accountTitle`, `accountLead` (the kit writes „Ten plik zawiera rachunki. Właściciel konta nie jest
wyświetlany.”, which differs from the app → research), `accountForms`, `selected`, `summaryTitle`, `summary.debits`,
`overlapTail`, `resultEyebrow`, `transactionForms`, `toPatterns`, `toOverview`, `next`, `deleteDialogEyebrow`
(K19), `saveError` (K28), the table header `importedOn`/`debits`. Each needs a K11 note in `design-kit.md`.
`result-waiting` has no counterpart: the POST is a server redirect, so the waiting state is the button's pending
text. The plan records this as "kit state with no app surface", not as a gap. **No kit view is missing**, so no new
`DESIGN-GAP` is expected. Stale `DESIGN-GAP` comments to remove: `K16`, `K19` (in part), `K20`, `K26`, `G25`, `G26`,
`G27`, `G30`, `G37` (import part) in `copy.ts`, `ImportWizard.tsx`, `detect.ts`, `imports/{index,new,result}.astro`.

Known kit duplicates (K32): `imports.accountLabel` vs `importFlow.accountLabel`, and `imports.santanderAccountName`
vs `importFlow.accountSantander` vs `imports.accountSantander`. Read one and record which.

### Open follow-ups whose Trigger this slice meets

| Follow-up (archive file, symbol) | Trigger | Take |
| --- | --- | --- |
| Any slice touching a month template: use `fillMonthLocative`. Source: `2026-10-02-kit-round-3-intake` | "any slice touching a month template" | **Probably not fired**: the import copy has `{range}` / `{n}` / `{bank}`, no `{month}`. Ranges come from `formatRangeShort/Long`. Binding for the plan if research finds a month form |
| Shared dialog geometry vs kit `.modal`, `src/components/ui/dialog.tsx` `DialogContent`. Source: `2026-09-25-undo-import` | "next change that touches a dialog" | **Fired (S-13 touches `DeleteImportDialog`) but already resolved**: `DialogContent` is now `max-w-[480px] p-[31px] rounded-[13px] w-[calc(100%-40px)]`. Stale entry, no work. The visual gate confirms it |
| S-01 F9 shared close icon (`dialog.tsx` inline `<svg>` vs `Glyph`). Source: `2026-09-25-undo-import` | folded into the dialog change above | **Out of scope**: cross-view (settings and pattern-actions dialogs share it), and nothing renders differently. Leave it open |
| F4 `DeleteImportDialog` pending on bfcache. Source: `2026-09-25-undo-import` | "the dialog change above" | **Already resolved**: `usePageShowReset` in `DeleteImportDialog`. Keep it when rebinding labels |
| F3 CSRF relies on `security.checkOrigin`. Source: `2026-09-25-undo-import` | an invariant, not a trigger | Binding: do not touch `checkOrigin`. Any new POST in this slice keeps Astro's default |
| S-04 F11 field radius 14 px vs kit 8 px (`field-styles.ts`, `FormField.tsx`). Sources: `2026-09-27-pattern-threshold-over-limit`, `2026-09-28-durable-pattern-decisions` | "the next UI change to a view with a form field, or a design-kit round naming field radii" | **Not fired here**: the import views have no text field (hidden file input, account radio cards). Owned by S-12/S-14 |
| F8 `DialogContent` has no `max-h`/scroll. Source: `2026-09-28-durable-pattern-decisions` | "a dialog with more content" | **Borderline**: the demo note inside the delete modal (kit) adds one line. The visual gate checks the mobile delete dialog. Fix only if it clips |
| ing-csv-import F9 shared React icon component | "przy następnej wyspie z ikonami" | **Mostly done**: `ImportWizard` uses `@/components/Glyph`. `ServerError.tsx` and `dialog.tsx` still inline the sprite. Out of scope (cross-view) |
| Prettier must not reformat the kit. Source: `2026-10-02-kit-round-3-intake` | "runs `npm run format` / installs husky / CI prettier gate" | Binding: never `npm run format`. lint-staged only touches staged `*.{json,css,md}`, so never stage `design/**` |

## Autonomous decisions

1. **Next step `/10x-research`, not `/10x-plan`.** Chosen: research. Some questions need a source-backed sweep
   before a plan can be written:
   - the exact `copyExtra.imports` → round-3 key map, per use site;
   - whether the summary may drop „Pominięte wpływy / zwroty”;
   - the ING account label (kit „Konto główne · •• 4821” from `importFlow.accountDefaultING` vs the file's real
     account name);
   - how the page learns it is on the demo account;
   - what the server returns for `invalid`;
   - which smoke and unit assertions pin the old copy.

   Rejected: direct plan. The roadmap's item list was already wrong twice (K18, the count of stand-ins), so it is
   not a safe plan input. Would change: a research.md already on disk, or the orchestrator naming plan as next.
2. **K18 removed from S-13's scope, K28 and C6 added.** Chosen to follow `design-kit.md`'s round-3 table over the
   roadmap's risk line, because the table was written later (F-04) with code evidence. Rejected: re-adopting
   `components.error` here (already done). Would change: research finding an imports read-failure path that still
   shows non-kit copy.
3. **No migration.** Every kit field maps to an existing column (`source`, `account_number`, `account_name`, period).
   Rejected: storing a "display account label" column. It can be derived at render time, and the data rule says
   the owner's name is never stored. Would change: the kit requiring a value the CSV holds but the app discards
   (e.g. an ING account nickname is already `account_name`; nothing else found).
4. **Demo note up front is in scope** (new presentation, same server guards). The roadmap outcome says „widzi notę
   zamiast akcji” and the kit draws it up front. Rejected: keeping the refusal only after the POST. Would change:
   the plan finding that the demo seed's first-import exception makes a disabled button wrong on a fresh demo DB
   (then the note shows only when `demoImportAllowed` is false).
5. **Stale follow-ups (dialog geometry, bfcache F4) recorded as resolved, not re-done.** Verified against
   `src/components/ui/dialog.tsx` `DialogContent` and `DeleteImportDialog` `usePageShowReset`. Would change: the
   visual gate measuring the delete modal off the kit `.modal` frame.
