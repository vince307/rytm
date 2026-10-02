# Import wizard, result and history on kit round 3 (S-13) — Implementation Plan

## Overview

Bind the import wizard (`/imports/new`), the import result (`/imports/result`) and the import history
(`/imports` + delete dialog) to design kit round 3: kit copy instead of `copyExtra` stand-ins, one message per
rejection (too large / too many / inconsistent / currency / empty / overlap with `{range}`), the bank in its own cell
and the account as `{account_name} · •• {tail}` on all three surfaces, the round-3 result layout with a not-found
state, kit wording for every delete outcome, and up-front demo notes. Presentation and client-side classification
only: server rules, limits, query parameters and guards stay the same. No migration.

## Current State Analysis

Source: `research.md` (§1–§8, Code References) and `change.md` (claims table), re-checked in this step against
`src/` and the kit. Anchors are symbols.

- `src/components/imports/ImportWizard.tsx` reads almost every string from `copyExtra.imports` (`labels.imports`).
  Four rejections use `importErrors.unknownFormat` as a stand-in (`DESIGN-GAP: G27`): `readStatement` (file size),
  the step-3 `blocking` chain (`chosen.debits > MAX_DEBITS`, `!payloadValid`) and `serverMessage`
  (`pageError.kind === "invalid"`). `src/lib/import/detect.ts` `readImportFile` does the same for size;
  `FileError = "unknownFormat" | "wrongCurrency" | "empty"`.
- `src/pages/imports/new.astro` overrides the kit `supported` / `unknownFormat` with `copyExtra` versions
  (`DESIGN-GAP: K26`, stale: round 3 names both banks).
- Step 3 grid: Rachunek (`accountLabel()` „ING · {name}” + tail), Zakres, Obciążenia, Pominięte wpływy. No Bank cell.
  Button `copyExtra.imports.confirm` / `importing` (stale `G25`). Overlap = `overlapPrefix` + range + `overlapTail`
  (stale `K16`).
- `src/pages/imports/index.astro`: no Bank column; account = `accountLabel()` without tail (no `account_number` in
  the select); status `x.deleted / deleteMissing / deleteError / demoLocked` (stale `G30`, `G37`); dialog labels
  from `copyExtra.imports.deleteDialog*`, `{range}` long form.
- `src/pages/imports/result.astro`: eyebrow `resultEyebrow`, h1 `resultTitle` (= kit h1), lead = `accountLabel()` +
  long range, one stat. Malformed / missing / foreign id → 302 `/imports`. Stale `G26` comment.
- `src/lib/import/banks.ts` `accountLabel()` + `test/unit/banks.test.ts` (4 cases) exist only for the bank-prefixed
  label the kit retires. `src/pages/home.astro` reads `copyExtra.imports.choose` (same text as `copy.imports.choose`).
- Demo: only API routes read `DEMO_EMAIL`. `supabase/seed.sql` gives the demo user zero imports, so the first
  import is allowed (`demoImportAllowed(0)`); smoke "demo first import is accepted (or already present)" needs that.
- Kit `prototype/styles.css` has `.result-icon` / `.result-state` / `.summary-grid` but no desktop rule for
  `.result-layout` / `.result-meta` (only `@media(max-width:560px){.result-meta{grid-template-columns:1fr 1fr}}`).
- No React component test infrastructure (no jsdom / testing-library): unit tests cover pure modules only, so the
  label and message logic must live in a pure module to be unit-tested.
- Smoke pins that change: `>Santander · Rachunek<` (list), `Santander · Rachunek` (result),
  `Nie znaleziono tego importu` ×2, 302 `/imports` for a deleted import's result. Smoke account tails: both payloads
  end in `…0099` (`•• 0099`); names „Konto smoke” (ING) and „Rachunek” (Santander).

## Desired End State

- Wizard step 1: kit `importFlow.supported`, chip „{file} · Rozpoznano format ING Bank Śląski.”, every rejection its
  own kit message with limits filled („Plik przekracza limit 5 MB. …”, „…ponad 5000 obciążeń…”, „Plik jest
  niespójny: …”); server `?error=invalid` shows `inconsistent`; `?error=demo` shows `importFlow.demoImportBlocked`.
- Step 3: one 4-cell grid Bank / Rachunek / Zakres dat / Obciążenia do importu for both the free and the overlapping
  range; „Importuj N obciążeń” / „Importowanie…” from `importFlow`; overlap from `importErrors.overlap` with the
  range as a link to `/imports`.
- `/imports`: columns Data importu / Bank / Rachunek / Zakres dat / Obciążenia / action; account
  „Konto smoke · •• 0099”, „Rachunek · •• 0099”; status lines `deleteSuccess` / `deleteError` / `notFound` /
  `demoDeleteBlocked`; dialog „Usunąć import z zakresu 01.05–31.05.2026?”, kit body, demo note + disabled button.
- `/imports/result`: icon, eyebrow „Import gotowy.”, h1 „Dodaliśmy N obciążeń.”, `result-meta` panel Bank /
  Rachunek / Zakres dat / Transakcje, actions; a malformed or unknown id renders the kit not-found state (200).
- Demo account with ≥ 1 import: info note + disabled picker (and blocked drop) on step 1, so step 3 is never reached.
- `copyExtra.imports` holds only K11 / K19 / K28 placeholders, each with a register note; no stale `DESIGN-GAP`
  for K16, K19 (except the eyebrow), K20, K26, G25, G26, G27, G30, G37 in import code; one new `G38` row + comment.

### Key Discoveries:

- The kit draws the account as `{account_name} · •• {tail}` with the bank in its own cell (`app.js` `imports()`,
  `importSummary()` non-overlap branch, `importResult()`); Santander's stored name is „Rachunek”, so C6
  („Rachunek · •• 1094”) needs no special case.
- `importErrors.limits` (5 / 5000) equals `MAX_FILE_BYTES` (5 MiB) and `MAX_DEBITS` (5000) in
  `src/lib/import/schema.ts`; a kit-contract pin keeps them equal.
- Radix `DialogContent` is not server-rendered while closed, so the demo note inside the delete dialog cannot be
  proven by smoke (only serialized props would match — the false positive the contract warns about) → visual gate.
- The wizard island IS server-rendered at step 1, so step-1 notes and server-error messages are smoke-provable by
  their rendered node (`>text<`).

## What We're NOT Doing

- No server change: `src/pages/api/imports.ts` keeps `?error=invalid|overlap|failed|demo`; no error-code split; query
  parameters stay the app's (`?deleted=1`, `?error=missing|delete|demo`), not the kit's `?status=`.
- No migration, RLS or RPC change; no `security.checkOrigin` change; no new POST.
- The global `app.demoNotice` strip in `AppLayout` — S-12.
- Save failure stays in the wizard (`?error=failed` + `saveError`), not on `/imports/result?status=error`.
- `result-waiting`: no app surface (the POST is a server redirect; the button's pending text is the waiting state).
- `src/components/ui/dialog.tsx` close icon (S-01 F9), `ServerError.tsx` inline sprite, field radius (S-04 F11).
- `importFlow.accountDefaultING` („Konto główne”) stays unused — ING shows the file's real account name.
- Editing anything under `design/rytm-os/`; `npm run format`.

## Implementation Approach

A pure module `src/lib/import/presentation.ts` comes first (Phase 1) so every surface shares one label/message
function and unit tests pin them. Then each surface moves separately, each phase green on its own: wizard step 1 and
rejections (P1), wizard steps 2–3 (P2), history + dialog (P3), result (P4), demo notes in the wizard (P5), register
+ seam sweep + visual gate (P6). Each phase removes the `copyExtra.imports` keys whose last reader it rebinds
(`grep` proves no reader is left); `accountLabel()` goes in P4, when its last reader goes. New UI components: one
(`InfoAlert`, P3). Smoke assertions on island content match the rendered node.

## Critical Implementation Details

**Template filling.** `fillTemplate` uses a function replacement (as `accountLabel()` does today, S-10 F4) so an
account name containing `$&` / `$1` renders verbatim; unknown placeholders stay literal (today's `fill` behaviour).

**Overlap message.** `importErrors.overlap` = „Ten zakres nachodzi na istniejący import: {range}.” — split the
template at `{range}` and render the range (`formatRangeLong`, unchanged) as `<a href="/imports">`, then
`copyExtra.imports.overlapTail`. When the endpoint could not read the colliding range (no `from`/`to`), drop
„: {range}” and end the sentence with „.” (today's behaviour), then the tail.

**Demo gating.** Wizard note = `isDemoEmail(Astro.locals.user?.email, DEMO_EMAIL) &&
!demoImportAllowed(existingCount)` where `existingCount` is the length of `new.astro`'s `existing`, and on a read
error fail closed (the endpoint's `count ?? 1`; `existing` is `data ?? []`, so `existing.length` alone would be 0
and fail OPEN — use `error ? 1 : existing.length`). When `demoLocked` and `?error=demo` coincide, show the sentence
once (the `InfoAlert`; no second copy in `ServerError`). Delete dialog note = `isDemoEmail(...)` only (undo is always
refused). The server guards remain the protection; the UI only disables. Drag & drop must also be blocked when the
note shows (the drop zone calls `handleFile`).

## Phase 1: Shared presentation helpers, wizard step 1 and rejection messages

### Overview

Introduce the pure presentation module, give each rejection its own kit message, and bind wizard step 1 to kit copy.
No new UI component.

### Changes Required:

#### 1. Presentation module

**File**: `src/lib/import/presentation.ts` (new), `test/unit/import-presentation.test.ts` (new)

**Intent**: One place for the strings every import surface derives, so they are unit-tested and never drift between
the wizard, the list and the result.

**Contract**: `fillTemplate(template: string, values: Record<string, string | number>): string`;
`bankDisplayName(names: Record<BankSource, string>, source: string): string` (unknown source → `ing`, like
`accountLabel()` today); `accountDisplay(name: string, accountNumber: string): string` → `"{name} · •• {last4}"` via
`formatAccountTail`; `fileErrorMessage(errors: typeof copy.importErrors, error: FileError): string` (fills `{maxMb}`
from `errors.limits` for `tooLarge`). Unit cases: `$&` name verbatim, unknown placeholder kept, unknown source,
Santander „Rachunek · •• 0099”, `tooLarge` → „Plik przekracza limit 5 MB. Wybierz mniejszy plik.”, `tooMany` filled
„…ponad 5000 obciążeń…” (exported helper or `fillTemplate` on `errors.tooMany` with `errors.limits`).

#### 2. `FileError` gains `tooLarge`

**File**: `src/lib/import/detect.ts`, `test/unit/detect.test.ts`

**Intent**: Size is its own rejection, not `unknownFormat`.

**Contract**: `FileError = "unknownFormat" | "wrongCurrency" | "empty" | "tooLarge"`; `readImportFile` returns
`tooLarge` for `bytes.length > MAX_FILE_BYTES`. The oversized-buffer test asserts `tooLarge` (renamed; behaviour
change by design). Remove the `G27` comments.

#### 3. Wizard step 1 and rejection wiring

**File**: `src/components/imports/ImportWizard.tsx`, `src/pages/imports/new.astro`, `src/pages/home.astro`

**Intent**: Step 1 reads kit keys; each rejection shows its own message.

**Contract**:
- `new.astro` passes `copy.importFlow` / `copy.importErrors` / `copy.imports` unmodified (drop the `K26` override
  and its comment); `ImportWizardLabels` gains the kit `imports` object next to the `copyExtra` placeholders (shape
  is the implementer's; the rule: kit text from `copy.*`, only K11/K28 placeholders from `copyExtra.imports`).
- `readStatement` returns `tooLarge` for `file.size > MAX_FILE_BYTES`; its `catch` stays `unknownFormat`.
- Step 1 file errors render `fileErrorMessage(...)` through `Headline`.
- Step 3 `blocking`: `> MAX_DEBITS` → `importErrors.tooMany` filled with `limits`; `!payloadValid` →
  `importErrors.inconsistent` (both via `Headline`). Server `pageError.kind === "invalid"` → `inconsistent`.
- Step-1 copy: `newEyebrow`, `newLead`, `back`, `dropTitle`, `choose`, `supported` from kit; chip =
  `{fileName} · ` + `copy.imports.formatRecognised` with `{bank}` = `copy.imports.bankName[bank]`.
- `home.astro` CTA → `copy.imports.choose`.
- Remove from `copyExtra.imports` every key this phase leaves without a reader (expected: `supported`,
  `unknownFormat`, `formatRecognised`, `newEyebrow`, `newLead`, `dropTitle`, `choose`; keep any still read by
  `index.astro` / `result.astro`).

#### 4. Kit contract + smoke

**File**: `test/unit/kit-contract.test.ts`, `scripts/smoke.mjs`

**Intent**: Fail the next kit intake if the rejection keys or limits drift; prove the server-rendered step-1 text.

**Contract**: kit-contract: `importErrors.tooLarge` has `{maxMb}`, `tooMany` has `{maxTransactions}`,
`limits.maxMb * 1024 * 1024 === MAX_FILE_BYTES`, `limits.maxTransactions === MAX_DEBITS`, `formatRecognised` has
`{bank}`, `bankName` has `ing` and `santander`. Smoke +2: `/imports/new` (signed-in test user) contains
`>Obsługujemy pliki CSV z ING Bank Śląski i Santander Bank Polska w PLN.<`; `/imports/new?error=invalid` contains
`>Plik jest niespójny:` (the `<strong>` node from `Headline`).

### Success Criteria:

#### Automated Verification:

- `npm test`: baseline + import-presentation cases + kit-contract cases, detect oversized case now `tooLarge`, 0 failed
- Smoke baseline + 2 PASS, 0 FAIL; no existing assertion edited
- `grep -n "G27\|K26" src/components/imports src/lib/import src/pages/imports` empty
- Deliberate break: `readImportFile` returns `unknownFormat` for size → detect test red; restore. Meta-check recorded: proves the library path only — the wizard's own `file.size` check has no unit test (reviewer row)
- Deliberate break: `new.astro` maps `invalid` back to `unknownFormat` → the new `?error=invalid` smoke step red; restore
- Full local gate vs baseline (lint, astro check, fixture:check, vitest, build, pgTAP Δ0, smoke + 2)

#### Manual Verification:

- [reviewer] Wizard `readStatement` returns `tooLarge` before reading the file; every step-1 string comes from `copy.*` except K11/K28 placeholders; removed `copyExtra` keys have no reader

---

## Phase 2: Wizard steps 2–3 on kit round 3

### Overview

Step 2 and step 3 copy and the 4-cell summary grid. No new UI component.

### Changes Required:

#### 1. Step 2

**File**: `src/components/imports/ImportWizard.tsx`

**Intent**: Kit keys where they exist.

**Contract**: `<small>` bank = `copy.imports.bankName[bank]`; back button = `copy.importFlow.back`; title, eyebrow,
lead, `accountForms`, `selected`, `transactionForms`, `next` stay `copyExtra` (K11). `accountLead` keeps the app
text (decision 4).

#### 2. Step 3 summary and submit

**File**: `src/components/imports/ImportWizard.tsx`

**Intent**: The kit's non-overlap summary for both branches; kit button copy; kit overlap template.

**Contract**: `<dl>` = Bank (`importFlow.bank` → `bankDisplayName`), Rachunek (`importFlow.accountLabel` →
`accountDisplay(chosen.name, chosen.number)`), Zakres dat (`importFlow.rangeLabel` → `formatRangeShort`),
Obciążenia do importu (`copyExtra.imports.summary.debits` → count + `transactionForms`). „Pominięte wpływy /
zwroty” removed. Submit label `fillTemplate(importFlow.importButton, { n, debits: plural(n, importFlow.debitForms) })`,
pending `importFlow.waiting`, back `importFlow.back`. Overlap per Critical Implementation Details (used by step 3
and by the server `overlap` error). Remove the `G25` / `K16` comments and the `copyExtra.imports` keys left without
a reader (expected: `confirm`, `importing`, `overlapPrefix`, `summary.account/range/skipped`, `stepBack`; `bankName`
and `debitForms` only if `index.astro` / `result.astro` no longer read them — otherwise P3/P4 remove them).

#### 3. Smoke

**File**: `scripts/smoke.mjs`

**Contract**: +1: `/imports/new?error=overlap&from=2026-05-01&to=2026-05-31` contains
`>Ten zakres nachodzi na istniejący import:` (the `ServerError` `<span>` node — the bare text also sits in the
island's serialized `importErrors.overlap` prop, so it must carry the leading `>`) and the rendered link node `>1 maja – 31 maja 2026<` (what
`formatRangeLong` returns for that range; if React SSR splits the sentence with `<!-- -->` markers, assert the two
nodes separately, never loosen to bare text that the island's props also contain).

### Success Criteria:

#### Automated Verification:

- `npm test`: Phase 1 count, 0 failed
- Smoke Phase 1 count + 1 PASS, 0 FAIL
- `grep -n "accountLabel(\|summary.skipped\|overlapPrefix\|G25\|K16" src/components/imports` empty
- Deliberate break: overlap template filled without the link (plain range text) → the new smoke step red; restore
- Deliberate break: `accountDisplay` returns the bank-prefixed form → import-presentation test red; restore. Meta-check recorded: proves the helper, not that step 3 calls it (step 3 is client-only → visual row)
- Full local gate vs baseline (smoke + 3)

#### Manual Verification:

- [reviewer] Step 3 renders one grid for free and overlapping ranges; `importButton` pluralised with `importFlow.debitForms`; no-range overlap fallback reads as one sentence

---

## Phase 3: Import history and delete dialog

### Overview

Bank column, account with tail, kit delete outcomes, kit dialog copy, demo note in the dialog. One new UI component:
`InfoAlert`.

### Changes Required:

#### 1. React info alert

**File**: `src/components/app/InfoAlert.tsx` (new)

**Intent**: React twin of `InlineAlert.astro` kind `info` (kit `.inline-alert.info`) for the islands (dialog now,
wizard in P5).

**Contract**: `InfoAlert({ children, className })` — `role="status"`, `bg-ink/8 text-ink`, info icon via
`@/components/Glyph`, same spacing classes as `InlineAlert.astro`.

#### 2. History page

**File**: `src/pages/imports/index.astro`

**Intent**: Kit table and kit status lines.

**Contract**: select adds `account_number`; columns Data importu (`copyExtra` K11) / Bank (`importFlow.bank`, value
`bankDisplayName`) / Rachunek (`importFlow.accountLabel`, value `accountDisplay`) / Zakres dat
(`importFlow.rangeLabel`) / Obciążenia (`copyExtra` K11) / action. Title block from `copy.imports.eyebrow/title/
lead/newImport`. Status: `?deleted` → `imports.deleteSuccess`, `missing` → `imports.notFound`, `delete` →
`imports.deleteError`, `demo` → `imports.demoDeleteBlocked`. Page computes `demo = isDemoEmail(Astro.locals.user?.
email, DEMO_EMAIL)` and passes it to each dialog. `range` passed to the dialog = `formatRangeShort` (kit sample).
Remove the `G30` / `G37` comments.

#### 3. Delete dialog

**File**: `src/components/imports/DeleteImportDialog.tsx`

**Intent**: Kit copy and the demo state; keep `usePageShowReset` and `onOpenAutoFocus`.

**Contract**: labels from `imports.delete/deleteTitle/deleteBody/deleteWaiting/deleteClose` (+ `copyExtra`
`deleteDialogEyebrow`, K19 partial); title via `fillTemplate(title, { range })`; new props `demo: boolean` and
`labels.demoNote` = `copy.imports.demoDeleteBlocked` (kit `modal('deleteImport')` text) → `InfoAlert` between body and form, danger button `disabled` when `demo`.

#### 4. Copy and smoke

**File**: `src/content/copy.ts`, `scripts/smoke.mjs`

**Contract**: remove `copyExtra.imports` keys left without a reader (expected: `deleteAction`, `deleteDialogTitle`,
`deleteDialogBody`, `close`, `deleting`, `deleted`, `deleteError`, `deleteMissing`, `table.account/range`, `eyebrow`,
`title`, `lead`, `newImport` if no other reader). Smoke: rewrite „imports list names the bank” →
`>Santander Bank Polska<`; „imports shows the not-found line” ×2 → `Nie znaleziono importu.`; add „imports list shows
the account tail” `>Rachunek · •• 0099<` and „imports list has the bank column” `>Bank<` (+2). Each rewrite is a
deliberate presentation change from the kit, named in the commit message.

### Success Criteria:

#### Automated Verification:

- `npm test`: Phase 2 count, 0 failed
- Smoke Phase 2 count + 2 PASS (3 rewritten), 0 FAIL
- `grep -n "G30\|G37\|deleteMissing\|deleteDialogTitle" src/pages/imports src/components/imports src/content/copy.ts` shows no import-delete hit (settings `G37` and `copyExtra.settings.demoLocked` untouched)
- Deliberate break: drop `account_number` from the select → astro check or the tail smoke step red; restore
- Deliberate break: `missing` mapped to `deleteError` → not-found smoke steps red; restore
- Full local gate vs baseline (smoke + 5)

#### Manual Verification:

- [reviewer] Dialog keeps `usePageShowReset` + `onOpenAutoFocus`; danger button disabled only for the demo account; server guard untouched

---

## Phase 4: Import result in the round-3 layout

### Overview

`result-meta` panel, kit eyebrow, kit not-found state, retire `accountLabel()`. No new UI component (the panel is
markup in the page).

### Changes Required:

#### 1. Result page

**File**: `src/pages/imports/result.astro`

**Intent**: Kit `importResult()` success layout and the kit not-found state.

**Contract**: select adds `account_number`. Success: icon, eyebrow `importFlow.result`, h1 `resultTitle` (K11,
unchanged text), panel with Bank / Rachunek / Zakres dat (`formatRangeShort`) / Transakcje (`copyExtra` K11 label,
value `n` + `transactionForms`), actions `toPatterns` / `toOverview` (K11). The old lead line and single stat go.
Panel built from `Panel` + the `.summary-grid` pattern (label 12 px muted, value 14 px bold), 4 columns desktop,
2 columns ≤ 559 px (kit media rule), with `// DESIGN-GAP: G38` (kit has no desktop `.result-layout` /
`.result-meta`). Not-found: a malformed id or no row → 200 with kit `result-state`: h1 `imports.notFound`, ghost link
`imports.back` → `/imports` (`!supabase` keeps the redirect). Count read error keeps `components.error`. Remove the
`G26` comment.

#### 2. Retire the bank-prefixed label

**File**: `src/lib/import/banks.ts`, `test/unit/banks.test.ts`, `src/content/copy.ts`

**Contract**: delete `accountLabel()` and its `describe` block (`BANK_SOURCES` / `isBankSource` tests stay); delete
`copyExtra.imports.accountLabel`, `resultEyebrow` and any key left without a reader (`bankName`, `debitForms`
if unread).

#### 3. Smoke

**File**: `scripts/smoke.mjs`

**Contract**: rewrite „deleted import result goes back to the list” → „deleted import result shows not-found”
(200, `>Nie znaleziono importu.<`); rewrite „santander import result names the bank” → `>Santander Bank Polska<`;
add „santander import result shows the account” `>Rachunek · •• 0099<` and „import result of a malformed id shows
not-found” (`/imports/result?id=nope`, 200, `>Nie znaleziono importu.<`) (+2).

#### 4. Gap register row

**File**: `context/foundation/design-kit.md`

**Contract**: new row `G38` (next free id): kit `prototype/styles.css` has no desktop rule for `.result-layout` /
`.result-meta`; placeholder from `.summary-grid` + `.result-state`; adopting slice S-13; round-4 list item.

### Success Criteria:

#### Automated Verification:

- `npm test`: Phase 3 count − 4 (`accountLabel` cases removed), 0 failed
- Smoke Phase 3 count + 2 PASS (2 rewritten), 0 FAIL
- `grep -rn "accountLabel(" src test` empty; `grep -n "DESIGN-GAP: G38" src/pages/imports/result.astro` one hit
- Deliberate break: restore the 302 redirect for a missing row → the not-found smoke steps red; restore. Meta-check recorded: the foreign-id case reaches the same branch through RLS (no row) — proven by pgTAP isolation, not this smoke
- Full local gate vs baseline (smoke + 7)

#### Manual Verification:

- [reviewer] G38 row and `DESIGN-GAP: G38` comment match; FR-003 still met (count + range on the result)

---

## Phase 5: Demo notes in the wizard

### Overview

Up-front demo state on step 1 (step 3 is unreachable when locked — plan review F4), kit copy for the post-refusal message. Reuses `InfoAlert`; no new
component.

### Changes Required:

#### 1. Page gating

**File**: `src/pages/imports/new.astro`

**Contract**: `demoLocked` per Critical Implementation Details (import `DEMO_EMAIL` from `astro:env/server`,
`isDemoEmail` / `demoImportAllowed` from `@/lib/demo`), passed to the wizard as a prop.

#### 2. Wizard

**File**: `src/components/imports/ImportWizard.tsx`

**Contract**: when `demoLocked`: step 1 shows `InfoAlert` with `importFlow.demoImportBlocked` above the drop zone,
„Wybierz plik” disabled, `onDrop` ignores the file. Step 3 is not changed: with the picker and drop blocked a
locked demo user cannot reach it (and an unlocked one must not be blocked), so the kit's step-3 demo note has no
reachable state — recorded in K33 (P6), not built. `pageError.kind === "demo"` → `importFlow.demoImportBlocked` (remove `G37` comment). Delete
`copyExtra.imports.demoLocked` (settings' own `demoLocked` untouched).

#### 3. Smoke

**File**: `scripts/smoke.mjs`

**Contract**: +2, placed after „demo first import is accepted (or already present)”: demo `/imports/new` contains
`>Na wspólnym koncie demo dodawanie i cofanie importów jest wyłączone.<`; and, in the test-user block, `/imports/new`
`notContains` that rendered node (`>…<`).

### Success Criteria:

#### Automated Verification:

- `npm test`: Phase 4 count, 0 failed
- Smoke Phase 4 count + 2 PASS, 0 FAIL; „demo first import is accepted (or already present)” still green on a fresh `db reset`
- Deliberate break: `demoLocked` hard-coded `false` → demo note smoke step red; `true` → test-user `notContains` red; restore. Meta-check recorded: the server-guard steps („demo second import is refused”) stay green in both breaks, so the new steps prove the page gating, not the guard
- Full local gate vs baseline (smoke + 9)

#### Manual Verification:

- [reviewer] A fresh demo account (0 imports) still sees an enabled wizard; drag & drop is blocked when locked; a select error fails closed (`error ? 1 : existing.length`)

---

## Phase 6: Gap register, seam sweep and visual gate

### Overview

Register statuses, K11 notes for the kept placeholders, kit-author rows, stale-comment and duplicate sweep, the
screenshot gate. No product behaviour change.

### Changes Required:

#### 1. Register

**File**: `context/foundation/design-kit.md`

**Contract**: round-3 status table: K16, K20, K26, G25, G26, G27, G30 → adopted in S-13; K19 partial (eyebrow
„Cofnij import” only in `app.js`); G37 imports part adopted (global strip → S-12); K32 note: S-13 reads
`importFlow.accountLabel` and `imports.santanderAccountName`. K11 note lists the kept `copyExtra.imports` keys.
New row `K33` for the kit author: `formatRecognised {bank}` has no short bank name; `app.js` `importSummary()`
overlap branch still pre-C6 („ING · Konto główne”, „Pominięte wpływy / zwroty”); `accountLead` text wrong for a
one-account file; eyebrow „Import gotowy” vs `importFlow.result` „Import gotowy.”; `app.js` step-1 demo note „dodawanie importów”
vs `importFlow.demoImportBlocked` „dodawanie i cofanie importów”; `app.js` „ponad 5 000” vs `limits` rendering
„5000”; step-3 demo note unreachable once step 1 is locked. Round-4 list gains G38 and K33.

#### 2. Seam sweep

**File**: `src/content/copy.ts`, `src/components/imports/*`, `src/pages/imports/*`, `src/lib/import/*`

**Intent**: Leave no half-removed seam from P1–P5.

**Contract**: every remaining `copyExtra.imports` key has a reader (grep per key); no duplicated helper (`fill` in
the wizard replaced by `fillTemplate`; no second account/bank formatter); no stale comment naming `accountLabel()`,
„Santander wkrótce”, `unknownFormat stands in`, K16/K20/K26/G25/G26/G27/G30 in import code; `smoke.mjs` comments
naming `copyExtra.imports.accountLabel` updated; header comments of `ImportWizard.tsx`, `result.astro`,
`index.astro` describe the round-3 behaviour.

#### 3. Follow-ups

**File**: `context/changes/kit-round-3-imports/follow-ups/review-fixes.md` (only if something is deferred)

**Contract**: each entry carries `Trigger: <slice id | condition>` (e.g. F8 dialog `max-h` if the visual gate shows
clipping it does not fix).

### Success Criteria:

#### Automated Verification:

- Seam greps empty: `accountLabel`, `overlapPrefix`, `deleteMissing`, `unknownFormat stands in`, `Santander wkrótce`, `DESIGN-GAP: (K16|K20|K26|G25|G26|G27|G30)` in `src/`
- Every `copyExtra.imports` key has ≥ 1 reader outside `copy.ts` (scripted grep, zero unused)
- `git diff --stat main -- design/` empty
- Deliberate break: re-add `copyExtra.imports.accountLabel` → the unused-key grep reports it; restore (meta-check: proves the grep guards against a half-removed seam, not a test)
- Full local gate vs baseline (smoke + 9)

#### Manual Verification:

- [visual] Screenshots at 1280 px and ~400 px on `astro dev` :4399 (test account, ING main + Santander fixtures imported, deleted afterwards; demo account for demo states), compared with kit views: `/imports` list with an ING and a Santander row (`imports.html`), empty list (`imports-empty.html`), `?deleted=1` (`imports-deleted.html`), `?error=delete` (`imports-delete-error.html`), `?error=missing` (`imports-not-found.html`), `?error=demo`; delete dialog open — normal and demo (disabled button + note, check F8 clipping at 400 px); `/imports/new` step 1 — empty, file recognised (chip), unknown format, wrong currency, empty file, too large (> 5 MB file), too many (generated > 5000-debit CSV in the scratchpad, never committed; else record N/A with the unit pin), `?error=invalid` (inconsistent), `?error=failed`, `?error=demo`, `?error=overlap&from&to`, demo locked; step 2 (account picker); step 3 — ready, overlap (step-3 demo locked is unreachable, see P5); `/imports/result` — ING success, Santander success („Rachunek · •• …”), not-found; no `undefined`, no raw `{…}`, no horizontal scroll
- [reviewer] Seam sweep complete; register rows match this plan; follow-ups carry `Trigger:` lines
- [human] Accept S-13 kit deviations (kit text, not PRD): app `accountLead` kept; chip names the full bank name; eyebrow with a period from `importFlow.result`; tooMany / inconsistent shown on step 3, not step 1; save failure stays in the wizard; delete `{range}` short form; ING shows the file's account name, not „Konto główne”; summary drops „Pominięte wpływy / zwroty” (kit round 3, decision 8); result of an unknown id is a 200 not-found page instead of the 302 (decision 5) — and send G38 + K33 to the kit author

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual
confirmation from the human that the manual testing was successful before proceeding.

---

## Testing Strategy

### Unit Tests:

- `import-presentation.test.ts`: `fillTemplate` (`$&`, unknown placeholder), `bankDisplayName` (both banks, unknown
  source), `accountDisplay` (ING name, Santander „Rachunek”, spaces in the number), `fileErrorMessage` (all four
  `FileError`s, `{maxMb}` filled), `tooMany` filled.
- `detect.test.ts`: oversized buffer → `tooLarge`.
- `kit-contract.test.ts`: rejection placeholders, limits = schema constants, `formatRecognised {bank}`, `bankName`,
  `importErrors.overlap {range}`, `imports.deleteTitle {range}`, `importFlow.importButton {n}{debits}`.
- `banks.test.ts`: `accountLabel` cases removed in P4.

### Integration Tests:

- Smoke: + 9 net (P1 +2, P2 +1, P3 +2, P4 +2, P5 +2), 5 rewritten (P3 3, P4 2) as deliberate kit presentation
  changes; server-contract steps unchanged.
- pgTAP unchanged (no schema change).

### Manual Testing Steps:

1. `npx supabase start`, `ASTRO_DEV_BACKGROUND=1 npx astro dev --port 4399 --ignore-lock`, sign in as the test user.
2. Import the ING main and Santander fixtures; walk the wizard states, the list, the dialog, the result; provoke each
   rejection with a crafted file (scratchpad only).
3. Sign in as the demo user (after its first import) for the demo states; delete test imports; kill the dev server.

## Known risks

- (plan review F6) `ImportWizard` has no `pageshow`/bfcache reset for `submitting` (`DeleteImportDialog` has
  `usePageShowReset`). Back from `/imports/result` may restore a disabled „Importowanie…” button. Pre-existing, not
  in scope; if the visual gate reproduces it, apply `usePageShowReset` in the wizard (P6) or file a follow-up with
  `Trigger:` (matches the `2026-09-27-pattern-threshold-over-limit` follow-up condition).
- (plan review F7) `>Bank<` (P3) is a short needle; the P3 deliberate break must show it red without the column,
  otherwise anchor it on the header cell's rendered node.

## Performance Considerations

None — string formatting at render; the history select gains one column.

## Migration Notes

None. Rollback = revert the merge.

## Autonomous decisions

Recorded in place of the skill's questions (run contract rule 1). No decision departs from the PRD's literal text;
the kit-text departures are collected in the Phase 6 `[human]` row.

| # | Decision | Chosen | Rejected | Why | What would change it |
| --- | --- | --- | --- | --- | --- |
| 1 | Complexity / questions | MEDIUM, 0 questions | Interview | Research answered every open question with a recommendation; remaining choices are reversible presentation | A product owner available |
| 2 | `formatRecognised {bank}` | `imports.bankName[bank]` („Rozpoznano format ING Bank Śląski.”) | Short „ING” / „Santander” (no key) | Only kit key available; copy rule forbids invented text | Kit adds a short bank name (K33) |
| 3 | Delete title `{range}` | `formatRangeShort` („01.05–31.05.2026”) | `formatRangeLong` (today) | Kit sample uses the short form; same format as the list's range column | Visual gate finds the short form ambiguous across years |
| 4 | `accountLead` | Keep the app text (count + D1 default) | Kit `app.js` „Ten plik zawiera rachunki. Właściciel…” | Neither has a `content.json` key; the kit text is wrong for a one-account file and drops the D1 default rule | Kit adds a key (K33) |
| 5 | Result not-found | Malformed and unknown id → 200 kit state; `!supabase` keeps the redirect | Keep the 302 | Kit draws the state (`imports-result-not-found.html`); one branch for "no such import" | Reviewer requires a 404 status |
| 6 | `accountLabel()` | Remove with its tests (P4) | Keep as fallback | No reader left; unknown-source fallback moves to `bankDisplayName` | A surface still needing a bank-prefixed label |
| 7 | K32 duplicates | `importFlow.accountLabel` for every „Rachunek” label; `imports.santanderAccountName` for the stored name | `imports.accountLabel`, `importFlow.accountSantander`, `imports.accountSantander` | One group with `importFlow.bank` / `rangeLabel`; the Santander key keeps today's key name | Kit removes the chosen duplicate |
| 8 | Skipped credits cell | Dropped; one 4-cell grid for both branches | Keep it | Not required by FR-003/FR-018/D2; CHANGELOG § Runda 3 names four cells | PRD amendment requiring the count |
| 9 | Server `invalid` | `importErrors.inconsistent`, no server split | New error codes | Reachable only by bypassing the same schema the client runs | A client path posting an unvalidated payload |
| 10 | Save failure placement | Wizard `?error=failed` | `/imports/result?status=error` | Same message, retry one click away, no new route state | Visual gate / reviewer requires kit placement |
| 11 | Demo note gating | `isDemoEmail && !demoImportAllowed(n)` in the wizard; dialog note on `isDemoEmail` | Note for every demo visit | Seed demo has 0 imports and smoke needs the first import open | Seed starting with an import |
| 12 | Phase size | 6 phases, ≤ 1 new UI component each | Fewer, larger phases | Contract: each phase implemented by a fresh agent, small and green | — |
| 13 | ING account label | File's real `account_name`; `importFlow.accountDefaultING` unused | „Konto główne” for every ING import | Name is a file fact (`import-formats.md` row 14); schema forbids empty names | Kit author says the label must be generic |

## References

- Change identity: `context/changes/kit-round-3-imports/change.md`
- Research: `context/changes/kit-round-3-imports/research.md`
- Kit: `design/rytm-os/prototype/app.js` (`imports`, `importsNew`, `uploadReady`, `importAccount`, `importSummary`,
  `importResult`, `modal('deleteImport')`), `design/rytm-os/prototype/styles.css`, `design/rytm-os/CHANGELOG.md`
  § Runda 3, `design/rytm-os/react-kit/docs/content.json`
- Register: `context/foundation/design-kit.md`
- Format example: `context/archive/2026-10-02-kit-round-3-intake/plan.md`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Shared presentation helpers, wizard step 1 and rejection messages

#### Automated

- [x] 1.1 npm test: baseline + import-presentation and kit-contract cases, detect oversized case tooLarge, 0 failed — bf10335
- [x] 1.2 Smoke baseline + 2 PASS, 0 FAIL, no existing assertion edited — bf10335
- [x] 1.3 No G27/K26 comment left in import code — bf10335
- [x] 1.4 Deliberate break: size → unknownFormat in readImportFile turns detect test red, restored, meta-check recorded — bf10335
- [x] 1.5 Deliberate break: invalid → unknownFormat turns the ?error=invalid smoke step red, restored — bf10335
- [x] 1.6 Full local gate vs baseline, smoke + 2 — bf10335

#### Manual

- [ ] 1.7 [reviewer] readStatement returns tooLarge before reading; step-1 copy from copy.*; removed keys have no reader

### Phase 2: Wizard steps 2–3 on kit round 3

#### Automated

- [ ] 2.1 npm test: Phase 1 count, 0 failed
- [ ] 2.2 Smoke Phase 1 count + 1 PASS, 0 FAIL
- [ ] 2.3 No accountLabel( / summary.skipped / overlapPrefix / G25 / K16 in src/components/imports
- [ ] 2.4 Deliberate break: overlap range without the link turns the overlap smoke step red, restored
- [ ] 2.5 Deliberate break: bank-prefixed accountDisplay turns import-presentation red, restored, meta-check recorded
- [ ] 2.6 Full local gate vs baseline, smoke + 3

#### Manual

- [ ] 2.7 [reviewer] One summary grid for both branches; importButton plural; no-range overlap fallback is one sentence

### Phase 3: Import history and delete dialog

#### Automated

- [ ] 3.1 npm test: Phase 2 count, 0 failed
- [ ] 3.2 Smoke Phase 2 count + 2 PASS (3 rewritten), 0 FAIL
- [ ] 3.3 No import-delete G30/G37/deleteMissing/deleteDialogTitle left; settings untouched
- [ ] 3.4 Deliberate break: account_number dropped from the select turns astro check or the tail smoke step red, restored
- [ ] 3.5 Deliberate break: missing → deleteError turns the not-found smoke steps red, restored
- [ ] 3.6 Full local gate vs baseline, smoke + 5

#### Manual

- [ ] 3.7 [reviewer] Dialog keeps usePageShowReset and onOpenAutoFocus; disabled only for demo; server guard untouched

### Phase 4: Import result in the round-3 layout

#### Automated

- [ ] 4.1 npm test: Phase 3 count − 4 accountLabel cases, 0 failed
- [ ] 4.2 Smoke Phase 3 count + 2 PASS (2 rewritten), 0 FAIL
- [ ] 4.3 No accountLabel( in src or test; one DESIGN-GAP: G38 in result.astro
- [ ] 4.4 Deliberate break: 302 redirect restored for a missing row turns the not-found smoke steps red, restored, meta-check recorded
- [ ] 4.5 Full local gate vs baseline, smoke + 7

#### Manual

- [ ] 4.6 [reviewer] G38 row matches the comment; FR-003 count and range still on the result

### Phase 5: Demo notes in the wizard

#### Automated

- [ ] 5.1 npm test: Phase 4 count, 0 failed
- [ ] 5.2 Smoke Phase 4 count + 2 PASS, 0 FAIL, demo first import still green after db reset
- [ ] 5.3 Deliberate break: demoLocked false / true turns the demo and test-user smoke steps red, restored, meta-check recorded
- [ ] 5.4 Full local gate vs baseline, smoke + 9

#### Manual

- [ ] 5.5 [reviewer] Fresh demo account sees an enabled wizard; drag and drop blocked when locked

### Phase 6: Gap register, seam sweep and visual gate

#### Automated

- [ ] 6.1 Seam greps empty (accountLabel, overlapPrefix, deleteMissing, stand-in comments, stale DESIGN-GAP ids)
- [ ] 6.2 Every copyExtra.imports key has a reader
- [ ] 6.3 Phase leaves design/ untouched
- [ ] 6.4 Deliberate break: re-added copyExtra.imports.accountLabel caught by the unused-key grep, restored
- [ ] 6.5 Full local gate vs baseline, smoke + 9

#### Manual

- [ ] 6.6 [visual] Screenshots desktop + ~400 px of every listed state, compared with the kit views
- [ ] 6.7 [reviewer] Seam sweep complete; register matches the plan; follow-ups carry Trigger lines
- [ ] 6.8 [human] Accept S-13 kit-text deviations and send G38 + K33 to the kit author
