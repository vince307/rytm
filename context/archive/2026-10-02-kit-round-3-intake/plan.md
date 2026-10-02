# Kit round 3 intake (F-04) — Implementation Plan

## Overview

The round-3 design-kit delivery replaces round 2 in `design/rytm-os/` (react-kit, prototype, brand-pack, CHANGELOG),
with an intake patch restoring the 4 `authStates` keys the app reads and the delivery dropped; `scripts/sync-kit.sh`
re-syncs `src/styles/brand.css` (+8 tokens). The app is kept green on the new `content.json` by minimal,
presentation-only adaptations (no redesign — S-12…S-15 bind views), guarded by a kit-contract unit test and new smoke
steps, and `context/foundation/design-kit.md` moves to `kit_round: 3` with every K/G item's status and adopting
slice. No migration.

## Current State Analysis

Source: `research.md` (§1–§6, Register matrix) and `change.md` (claims table), re-checked in this step by `grep` over
`src/` and `diff -rq` of the delivery vs the repo kit. Anchors are symbols.

- `src/content/copy.ts` imports `design/rytm-os/react-kit/docs/content.json` as `copy`; `copyExtra` holds gap
  strings (K11). Replacing the JSON is the whole risk surface.
- **Breaks on the swap** (all in `copy.*` reads; `copyExtra` reads are unaffected):
  1. Removed keys: `src/pages/login.astro` `s.loginError`; `src/pages/reset.astro` `s.resetTitle`, `s.resetBody`,
     `s.checkInbox`. JSON is typed, so `astro check` catches these.
  2. `src/pages/home.astro` second `StatCard` reads `copy.dashboard.stats[2].label` — round 3 has 2 cards
     („Ponad progiem w tym miesiącu”, „Koszty stałe”). Not a type error (`T[]`, no `noUncheckedIndexedAccess`).
  3. `src/components/patterns/PatternsTable.tsx` `<thead>`: `copy.columns.slice(0, 4)` + `copy.amountColumn` +
     `copy.columns.slice(4, 6)`; round-3 `patterns.columns` = Sprzedawca, Typ, Wystąpienia, **Kwota**, Suma, Próg,
     Ponad progiem → silent mislabel, „Ponad progiem” dropped. Body cell order today: Sprzedawca, Typ, Wystąpienia,
     Suma, Kwota, Próg, Ponad progiem (kit indices 0,1,2,4,3,5,6).
  4. Raw placeholders: `fixedCosts.new` „Nowe w {month}” (`fixed.astro` `FixedSection title`), `trend.tooShort`
     „…po {n} miesiącach danych.” (`home.astro` `TrendChart note`, smoke asserts the filled sentence),
     `authStates.passwordTooShort` „…co najmniej {n} znaków.” (`register.astro`, `settings.astro`,
     `reset/new.astro` → `SignUpForm` / `NewPasswordForm` / settings form), `resetNew.lead` (`reset/new.astro`
     `r.lead`).
  5. Meaning shift: `components.error` becomes a read-failure line (resolves K18 for the 4 read-failure sites with a
     `DESIGN-GAP: K18` comment: `home.astro`, `patterns.astro`, `fixed.astro`, `patterns/[...key].astro`) but misfits
     `imports/new.astro` `genericError` (wizard save failure, `ImportWizard.tsx` `pageError.kind === "failed"`).
- `home.astro` also hardcodes `result.trend.months.length < 3`; kit `trend.minimumMonths` = 3 (PRD agrees).
- `src/lib/auth-rules.ts` `MIN_PASSWORD_LENGTH` = 6 is the enforced rule (zod in the auth endpoints); kit
  `authStates.passwordMinLength` = `resetNew.passwordMinLength` = 6 agree.
- Month locatives: `copyExtra.patterns.monthsLocative` (used by `patterns/[...key].astro` `monthLocative` →
  `sumLabel`, `overInMonth`) yields „w wrześniu” in September — Polish needs „we wrześniu” (the kit's own `app.js`
  writes „we wrześniu”). Today is 2026-10-02: the latest data month of real users is September, so `/fixed` would
  show the defect immediately.
- File copy: assets byte-identical; react-kit changes `README.md`, `docs/content.json`, `docs/routes.md`,
  `styles/brand.css`, adds `docs/copy-map.md`; prototype 3 changed + 33 added (32 views + `README.md`), 0 removed;
  brand-pack only `dokumentacja/karta-stylu.md`; `CHANGELOG.md` gains „Runda 3”. The committed kit is the author's
  bytes, NOT prettier-formatted (`npx prettier --check` warns on `prototype/styles.css`, `react-kit/styles/brand.css`,
  `docs/content.json`, `docs/routes.md`; `src/styles/brand.css` too): the husky hook is not installed in this checkout
  (no `core.hooksPath`, no `prepare` script, only `*.sample` in `.git/hooks`) and CI has no prettier gate. Round 2
  (`2ad7d14`) therefore committed the delivery verbatim. `src/styles/brand.css` today = `sed(font path)` of the kit
  `brand.css` byte for byte (plan review, `cmp`).

## Desired End State

- `design/rytm-os/` = the round-3 delivery under the agent-contract mapping, byte for byte; the only difference is
  the 4 restored `authStates` keys in `react-kit/docs/content.json`.
- `scripts/sync-kit.sh` is idempotent on the committed tree (`git status` clean after a re-run);
  `src/styles/brand.css` carries the 8 new `--rytm-*` tokens; no Tailwind colour name added.
- Every screen reading a changed key renders the right text: „Koszty stałe” card label, 7 correctly ordered table
  headers incl. „Ponad progiem”, „Nowe w maju” / „Nowe we wrześniu”, „Trend pojawi się po 3 miesiącach danych.”,
  „Hasło musi mieć co najmniej 6 znaków.”, the restored login/reset texts, and the wizard save failure
  „Nie udało się zapisać importu. Spróbuj ponownie.”. No `undefined`, no raw `{n}` / `{month}`.
- `test/unit/kit-contract.test.ts` fails on the next kit intake if any key, index or placeholder the app reads goes
  missing; smoke has a step per fixed break that is visible in server HTML.
- `design-kit.md` says `kit_round: 3`; each K11–K26 / G20 / G23–G37 row has a round-3 status and adopting slice;
  new K-rows for the round-4 author list; G36 and K18 closed.

### Key Discoveries:

- JSON arrays type as `T[]`: index reads (`stats[2]`, `columns.slice`) are invisible to `astro check` — only a
  runtime/unit guard catches them (research Architecture Insights).
- Template filling convention is chained `.replace("{x}", …)` at the page (`home.astro` `leadFor`, `fixed.astro`
  `countText`); no shared formatter — F-04 adds only the month-locative helper, because three call sites need the
  same preposition rule.
- The 4 `authStates` texts have no round-3 key (value search over all 385 leaves) and the round-3 prototype still
  renders them → restore (K12 precedent), not repoint.
- `smoke.mjs` already asserts „Trend pojawi się po 3 miesiącach danych.” and `>1 pozycja podrożała<`, so Phase 1's
  gate fails if the trend template is left unfilled or the card feet are switched to the kit's foot template.

## What We're NOT Doing

- Migrating `copyExtra` to round-3 keys (127 verbatim matches, 89 not) — each of S-12…S-15 binds its own views.
- Kit column order for the patterns table (Kwota before Suma) — K17 adoption is S-14.
- Kit card feet `dashboard.stats[1].foot` „{n} {items} podrożały” (wrong for n = 1) — keep `copyExtra.home.risen`;
  K-row for the author, S-15.
- Rename limit 60 (kit) vs 100 (app/DB) — S-14 (follow-up).
- Exposing any of the 8 new tokens as Tailwind colour names (change.md decision 3); Badge `new` tint — S-15.
- Any new view, component, layout change, `DESIGN-GAP` comment, migration or RLS change.
- Editing the kit beyond the 4-key intake patch; `routes.md` / `copy-map.md` content stays the author's.

## Implementation Approach

Phase 1 swaps the kit and adapts the app in the same commit, because `copy.ts` imports the JSON directly — a kit-only
phase cannot be green (smoke asserts the filled trend sentence). Phase 2 adds guards that would have caught every
break (kit-contract unit test, smoke steps) and removes the stale K18 comments. Phase 3 updates the gap register,
docs and follow-ups, sweeps the seams and takes the screenshots.

## Critical Implementation Details

**Order of the kit copy (byte-faithful, no prettier).** Copy the delivery byte for byte (`cp`/`rsync`, skip
`.DS_Store`) → apply the intake patch with Node (`JSON.parse` → add the 4 keys → `JSON.stringify(obj, null, 2) +
"\n"`; verified in plan review to reproduce the delivery's `content.json` bytes exactly, so only the 4 lines change)
→ run `scripts/sync-kit.sh`. **Never run prettier on `design/` or `src/styles/brand.css`** (`npm run format` included):
neither is prettier-formatted today, and formatting would rewrite whole files (minified `prototype/styles.css`,
`brand.css`) and break the „8 token lines” contract. A re-run of `sync-kit.sh` leaves `git status` clean. Comparing
delivery vs kit: `diff -rq` the raw delivery against `design/rytm-os/` per mapping. Ignore the delivery's root-level
duplicates and `rytm-os-views-html/` (agent contract). The delivery lives outside git — if
`context/runs/2026-10-02-kit-round-3/kit-delivery/` is missing, report `ARTIFACT GAP` and stop.

**Month preposition.** Polish uses „we” before a locative starting with „w” + consonant — of the 12 month
locatives only „wrześniu”. The helper replaces the literal `w {month}` with `we wrześniu` for September and
`w <locative>` otherwise; a template without `w {month}` gets only `{month}` replaced.

## Phase 1: Round-3 kit in place, app adapted

### Overview

Copy the delivery, apply the intake patch, sync tokens, and make every read of a changed key render correctly. One
`feat(kit-round-3-intake): … (p1)` commit containing kit files + app edits (precedent `2ad7d14` kept kit files in one
commit; here the app edits must ride with it to stay green).

### Changes Required:

#### 1. Kit files

**File**: `design/rytm-os/react-kit/`, `design/rytm-os/prototype/`, `design/rytm-os/brand-pack/`,
`design/rytm-os/CHANGELOG.md`

**Intent**: Bring round 3 in under the contract mapping (`kit-delivery/react-kit/{docs,styles,assets,README.md}` →
`react-kit/`; `kit-delivery/react-kit/prototype/` → `prototype/`; `kit-delivery/rytm-os/` → `brand-pack/`;
`kit-delivery/CHANGELOG.md` → `CHANGELOG.md`), byte for byte per Critical Implementation Details (no prettier). No
file is removed (the delivery removes none). Skip `.DS_Store`.

**Contract**: `design/rytm-os/` equals the raw delivery byte for byte except `react-kit/docs/content.json`.

#### 2. Intake patch

**File**: `design/rytm-os/react-kit/docs/content.json`

**Intent**: Restore the 4 keys the app reads and round 3 dropped, verbatim from round 2 (K12 precedent).

**Contract**: `authStates.loginError` „Nie rozpoznaliśmy tego e-maila i hasła. Spróbuj ponownie.”,
`authStates.resetTitle` „Odzyskaj dostęp.”, `authStates.resetBody` „Podaj e-mail, którego używasz w Rytmie.”,
`authStates.checkInbox` „Jeśli konto istnieje, wysłaliśmy instrukcję zmiany hasła.” (take the exact strings from
`git show main:design/rytm-os/react-kit/docs/content.json`), written by the Node round-trip in Critical
Implementation Details. Parsed diff vs the delivery = exactly these 4 added leaves; `diff` of the files = 4 added
lines (+ the comma on the preceding line).

#### 3. Token sync

**File**: `src/styles/brand.css`, `public/rytm/` (via `scripts/sync-kit.sh`)

**Intent**: Re-run the existing script; it adds the 8 tokens (`--rytm-accent/field/focus-ring/sequence/
sequence-soft/merchant-mark/badge-soft/danger-line`); assets are identical.

**Contract**: `git diff --stat -- public/rytm` empty; `src/styles/brand.css` diff = the 8 token lines (plus
formatting of nothing else). `src/styles/global.css` `@theme` unchanged.

#### 4. Month-locative helper

**File**: `src/lib/format.ts`, `test/unit/format.test.ts`

**Intent**: One place for „w/we <month locative>” so `/fixed` and the pattern detail never print „w wrześniu”.

**Contract**: `export function fillMonthLocative(template: string, yearMonth: string, locatives: readonly string[]):
string` — `yearMonth` is `YYYY-MM`; replaces `w {month}` per Critical Implementation Details, otherwise `{month}`.
Unit cases: May → „Nowe w maju”, September → „Nowe we wrześniu”, a template without the preposition, `Suma w
{month}` for January and September.

#### 5. Page and component adaptations

**File**: `src/pages/home.astro`, `src/pages/fixed.astro`, `src/pages/patterns/[...key].astro`,
`src/pages/register.astro`, `src/pages/settings.astro`, `src/pages/reset/new.astro`, `src/pages/imports/new.astro`,
`src/pages/patterns.astro`, `src/components/patterns/PatternsTable.tsx`, `src/lib/patterns/table-columns.ts` (new),
`test/unit/table-columns.test.ts` (new), `src/content/copy.ts`

**Intent / Contract** per read:
- `home.astro`: second `StatCard` label ← `copy.dashboard.stats[1].label`; feet unchanged (`copyExtra.home`). Trend
  note condition and text use `copy.trend.minimumMonths` (`< minimumMonths`, `tooShort.replace("{n}",
  String(minimumMonths))`).
- `fixed.astro`: `FixedSection` „Nowe” title ← `fillMonthLocative(copy.fixedCosts.new, overview.referenceMonth,
  copyExtra.patterns.monthsLocative)` (the branch rendering sections has a non-null `referenceMonth`).
- `patterns/[...key].astro`: `sumLabel` and `overInMonth` switch from the local `monthLocative` to
  `fillMonthLocative`; drop `monthLocative` if no other use remains.
- `register.astro`, `settings.astro`, `reset/new.astro`: pass `passwordTooShort` with `{n}` ← `MIN_PASSWORD_LENGTH`;
  `reset/new.astro` `r.lead` likewise. Components unchanged.
- `imports/new.astro`: `genericError` ← new `copyExtra.imports.saveError` „Nie udało się zapisać importu. Spróbuj
  ponownie.” with a one-line comment naming its source (round-3 `prototype/app.js`, import result `status ===
  'error'`; not in `content.json` — K-row in Phase 3).
- `src/lib/patterns/table-columns.ts`: `export function tableHeaders(columns: readonly string[]): string[]` returns
  the kit labels in the table's body order (kit indices 0,1,2,4,3,5,6) with a header comment: kit order is S-14
  (K17). Unit test: round-3 `copy.patterns.columns` → Sprzedawca, Typ, Wystąpienia, Suma, Kwota, Próg, Ponad
  progiem.
- `PatternsTable.tsx`: `<thead>` maps `tableHeaders(copy.columns)` (same `<th>` classes per position as today:
  first four left, the rest as before); drop the `amountColumn` prop and its doc; update the `columns` doc comment
  to the 7 round-3 labels. `patterns.astro` stops passing `amountColumn`; remove `copyExtra.patterns.amountColumn`.

### Success Criteria:

#### Automated Verification:

- Delivery vs kit: raw delivery `diff -rq` against each mapped `design/rytm-os/` tree → only `react-kit/docs/content.json`; a Node parsed-JSON diff of that file → exactly the 4 added `authStates` leaves
- `bash scripts/sync-kit.sh && git status --porcelain -- src/styles public/rytm design` → shows nothing beyond the files already changed in this phase, and `git diff -- src/styles/brand.css` = exactly the 8 added token lines (re-run after the commit → empty; idempotent; no prettier on these files)
- `grep -rnE "stats\[[2-9]\]|columns\.slice|amountColumn" src` → nothing
- `npm test`: baseline + the new `format` and `table-columns` cases, 0 failed
- Deliberate break 1: delete `authStates.loginError` from `content.json` → `npx astro check` red at `login.astro`; restore → green (meta-check: proves `astro check` guards removed keys only — it stays green when `home.astro` reads `stats[2]`, which is why Phase 2 adds the kit-contract test)
- Deliberate break 2: make `fillMonthLocative` always write `w ` → the September cases go red; restore → green
- Full local gate vs baseline (contract): lint 0 errors, astro check 0 errors, fixture:check OK, vitest + delta, build OK, pgTAP Δ0, smoke Δ0 (all existing assertions incl. „Trend pojawi się po 3 miesiącach danych.” and `>1 pozycja podrożała<` still pass)

#### Manual Verification:

- [reviewer] No kit file other than `content.json` differs from the delivery in content; the 4 restored strings are byte-equal to `main`'s round-2 values; no file under `design/` removed

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 2: Regression guards and K18 cleanup

### Overview

A unit test that pins every kit key, index and placeholder the app reads, smoke steps for each break visible in
server HTML, and removal of the 4 `DESIGN-GAP: K18` comments (K18 delivered by `components.error`).

### Changes Required:

#### 1. Kit-contract test

**File**: `test/unit/kit-contract.test.ts` (new)

**Intent**: The next kit intake fails `npm test` instead of rendering `undefined` or a raw placeholder.

**Contract**: imports `copy` from `@/content/copy` and `MIN_PASSWORD_LENGTH` from `@/lib/auth-rules`; asserts:
the 4 restored `authStates` keys are non-empty strings; `copy.dashboard.stats` has ≥ 2 entries with non-empty
`label` and `stats[1].label` is „Koszty stałe” (the card the app renders second); `patterns.columns` has exactly 7
labels and `tableHeaders` returns 7; templates contain their placeholders — `fixedCosts.new` and
`copyExtra.patterns.sumLabel` contain `w {month}`, `trend.tooShort` / `authStates.passwordTooShort` /
`resetNew.lead` contain `{n}`; `trend.minimumMonths === 3` (PRD § Success Criteria „≥ 3 miesiące”);
`authStates.passwordMinLength === MIN_PASSWORD_LENGTH`; `copyExtra.patterns.monthsLocative` has 12 entries.
A header comment says what to do when it goes red on an intake (adapt the reader or patch the kit — never edit the
assertion to match, CLAUDE.md red-test rule).

#### 2. Smoke steps

**File**: `scripts/smoke.mjs`

**Intent**: Prove the fixed breaks end to end through server HTML.

**Contract** (6 new steps, rendered-node needles `>…<` for island content per the agent contract; added lines only):
- anonymous, near „login offers password reset”: `/reset` contains `>Odzyskaj dostęp.<` and `Podaj e-mail, którego
  używasz w Rytmie.`; `/login?error=1` contains `>Nie rozpoznaliśmy tego e-maila i hasła. Spróbuj ponownie.<`;
  `/register` contains `co najmniej 6 znaków` and notContains `{n}` (the text lives only in island props — no
  rendered node exists until the user types, so the props are the asserted surface).
- signed-in: `/settings` contains `co najmniej 6 znaków`, notContains `{n}`; after the May import, next to „fixed
  with one month lists no change”: `/fixed` contains `>Nowe w maju<`, notContains `{month}`; next to „patterns list
  the re-imported merchant”: `/patterns` contains `>Ponad progiem<` (the header cell the round-3 slice dropped).

#### 3. K18 comments

**File**: `src/pages/home.astro`, `src/pages/patterns.astro`, `src/pages/fixed.astro`,
`src/pages/patterns/[...key].astro`

**Intent**: The kit now has read-failure copy; the `DESIGN-GAP: K18` comments are stale. Replace each with nothing
or a short non-gap comment if the surrounding code needs one. Markup and copy unchanged.

**Contract**: `grep -rn "K18" src` → nothing.

#### 4. CLAUDE.md

**File**: `CLAUDE.md`

**Contract**: the `npm test` line also names the kit-contract test (keys, indices and placeholders the app reads
from `content.json`).

### Success Criteria:

#### Automated Verification:

- `npm test`: Phase 1 count + the kit-contract cases, 0 failed
- Smoke against `astro dev` on :4398: baseline + 6 PASS, 0 FAIL; `git diff main -- scripts/smoke.mjs` shows only added lines
- Deliberate break 1: in `content.json` drop `patterns.columns[3]` („Kwota”) → kit-contract and `table-columns` tests red; restore → green
- Deliberate break 2: revert `home.astro` to `stats[2]` → kit-contract stays green and astro check stays green (meta-check: nothing automated catches the reader side of an index read — record it; the Phase 1 grep `stats\[[2-9]\]` and the kit-contract `stats[1]` pin are the guard, plus the visual row); restore
- Deliberate break 3: revert `fixed.astro` to the raw `copy.fixedCosts.new` → the `/fixed` smoke step goes red; restore → green (meta-check: `fixed.astro` is plain Astro, so the needle cannot be satisfied by island props)
- `grep -rn "K18" src` → nothing; `grep -rn "DESIGN-GAP" src | wc -l` = baseline − 4
- Full local gate vs baseline: lint, astro check, fixture:check, vitest + delta, build, pgTAP Δ0, smoke + 6

#### Manual Verification:

- [reviewer] Every kit-contract assertion maps to a real read in `src/` (no assertion on a key the app does not use)

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 3: Gap register round 3, follow-ups, seam sweep

### Overview

`design-kit.md` describes the round-3 kit and every register item's status and adopting slice; follow-ups for later
slices are written; seams from Phases 1–2 are swept; screenshots taken.

### Changes Required:

#### 1. Gap register

**File**: `context/foundation/design-kit.md`

**Intent**: Later slices find in one place what round 3 delivered and what they adopt.

**Contract**:
- Frontmatter `kit_round: 3` (+ `updated`); § „Zawartość `design/rytm-os/`” updated (content.json key count as
  research measured, `docs/copy-map.md`, `routes.md`, prototype 58 view pages / 60 files in `views/`, CHANGELOG up
  to „Runda 3” with decisions C1–C6, intake patch note).
- Each K11–K26 / G20 / G23–G37 row gets its round-3 status and adopting slice per research § Register matrix
  (delivered / partial / resolved-by-decision, slice S-12…S-15 or F-04); K12 → partial (round 3 restored
  `patternActions.*`, dropped the 4 `authStates` again — re-restored at intake); K17 → F-04 labels, S-14 order;
  K18 → delivered, comments removed in F-04; G36 → closed (C5 permanent omission).
- New K-rows (next free numbers) for the round-4 author list: (a) the 4 `authStates` keys dropped twice; (b) import
  save-failure copy only in `app.js`, not in `content.json` (`copyExtra.imports.saveError`); (c)
  `dashboard.stats[1].foot` „{n} {items} podrożały” wrong for n = 1 (S-15); (d) `patternDetail.monthNames` /
  `w {month}` give „w wrześniu” — app writes „we wrześniu” (F-04 helper); (e) rename limit 60 vs app/DB 100 (S-14);
  (f) new duplicate keys (`patternDetail.thresholdError` vs `threshold.saveError`, `patternActions.error*` vs
  `mergeInvalid/renameLong/saveError`, `settings.*Password` vs `authStates.*Password`, `settings.confirmation` vs
  `deleteConfirm`, `imports.accountLabel` vs `importFlow.accountLabel`).
- A short list „Dostarczone bez wiersza K/G” (`patterns.showMore` S-14, C6 Santander account label S-13,
  `confirmEmail.resendCountdown` S-12, `trend.amountLabel/zeroMarker/gridLabel` S-15, import-result
  waiting/error/not-found views S-13) and the „lista do rundy 4” replacing the round-3 list.

#### 2. Follow-ups

**File**: `context/changes/kit-round-3-intake/follow-ups/review-fixes.md` (new)

**Contract**: one entry each, with `Trigger:` lines: S-14 — table in kit column order (K17), rename limit `{n}` =
100 not 60, adopt `--rytm-focus-ring` (focus-ring follow-up of `2026-09-27-pattern-threshold-over-limit`);
S-15 — card feet stay `copyExtra.home.risen` until the kit foot is grammatical, Badge `new` tint via
`--rytm-badge-soft`, `fixed.noComparison` smoke string moves with the copy; S-12 — auth/settings rebinding may move
the 4 restored `authStates` to their round-3 homes if the author adds them; any slice touching a month template —
use `fillMonthLocative`.

#### 3. Seam sweep

**File**: everything touched in Phases 1–2

**Contract**:
- One month-locative helper: no remaining local `monthLocative` / inline `monthsLocative[...]` reads in `src/`
  outside `fillMonthLocative` callers.
- One table-header mapping (`tableHeaders`); no `amountColumn` anywhere in `src/`.
- Doc comments that describe changed kit values: `ImportWizard.tsx` `genericError` prop doc (says
  `copy.components.error`; now `copyExtra.imports.saveError`), `TrendChart.astro` header comment quoting
  `trend.current` as „bieżący, niepełny…” (round 3: „Bieżący miesiąc”; the app does not read the key — say so or
  drop the quote).
- No stale comment naming `stats[2]`, „Rozpoznane wydatki”, a 6-column table, `kit_round: 2` / „runda 2” as the
  current kit, or K18 as open — in `src/`, `CLAUDE.md`, `design-kit.md`; `home.astro` header comment and the
  `copy.ts` K25 comment updated if they name the third card.
- `roadmap.md` F-04 baseline lines untouched (archive updates them); no `TODO` added.

### Success Criteria:

#### Automated Verification:

- `grep -n "^kit_round: 3" context/foundation/design-kit.md` → 1 line; every register id K11–K26, G20, G23–G37 appears with a round-3 status (a Node/grep check listing ids without „runda 3” / round-3 status → empty)
- Seam greps: `grep -rnE "monthsLocative\[|amountColumn|stats\[2\]|Rozpoznane wydatki" src` → nothing; `grep -rn "K18" src` → nothing
- `git diff --exit-code <Phase 1 commit sha> -- design/` (Phases 2–3 do not touch the kit)
- Deliberate break: re-add `amountColumn` to `copyExtra.patterns` → the seam grep reports it; restore (meta-check: proves the grep is the guard against a half-removed seam, not a test)
- Full local gate vs baseline: lint, astro check, fixture:check, vitest (Phase 2 count), build, pgTAP Δ0, smoke + 6

#### Manual Verification:

- [visual] Screenshots at 1280 px and ~400 px on `astro dev` :4399, local test account with the ING main fixture imported (deleted afterwards): `/login?error=1` (error line), `/reset` (form) and `/reset?sent=1` (sent state), `/register` after submitting a 3-character password (error „…co najmniej 6 znaków.”), `/home` (two stat cards, „Koszty stałe” label; trend note when < 3 months), `/patterns` (7 headers in body order incl. „Ponad progiem”), `/fixed` („Nowe w <miesiąc>” section title), `/settings` password form after a too-short new password — compared with kit `login.html`, `reset.html`, `register.html`, `home.html`, `patterns.html`, `fixed.html`, `settings.html`: same layout as before the swap (no redesign), no `undefined`, no `{n}`/`{month}`, no horizontal scroll
- [reviewer] Seam sweep complete; register rows match research § Register matrix; follow-ups each carry a `Trigger:`
- [human] Accept the kit deviations taken in F-04 (kit text, not PRD): „we wrześniu” instead of the kit's „w wrześniu”; table headers in the app's body order until S-14; wizard save failure from `app.js` via `copyExtra`; the 4 `authStates` restored into the kit at intake — and send the new K-rows (round-4 list) to the kit author

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Testing Strategy

### Unit Tests:

- `fillMonthLocative` (May, September, no preposition, `Suma w {month}`).
- `tableHeaders` (round-3 columns → body order).
- Kit contract: restored keys, `stats` length/label, 7 columns, placeholders present, `minimumMonths`,
  `passwordMinLength`, 12 locatives.

### Integration Tests:

- Smoke +6: `/reset`, `/login?error=1`, `/register`, `/settings`, `/fixed` „Nowe w maju”, `/patterns` „Ponad
  progiem”; every existing assertion unchanged.
- pgTAP unchanged (no schema change).

### Manual Testing Steps:

1. `npx supabase start`, `ASTRO_DEV_BACKGROUND=1 npx astro dev --port 4399 --ignore-lock`, sign in as the test user.
2. Import the ING main fixture; walk `/home`, `/patterns`, `/fixed`, `/settings`; sign out; walk `/login?error=1`,
   `/reset`, `/reset?sent=1`, `/register`.
3. Delete the import; take the screenshots listed in Phase 3; kill the dev server.

## Known risks

- **Git hooks inactive here, active elsewhere.** If a checkout has husky installed, `lint-staged` would run
  `prettier --write` on staged `design/**/*.{json,css,md}` and reformat the kit on commit. Mitigation: the implement
  step checks `git show --stat HEAD -- design src/styles` after the p1 commit (line counts ≈ delivery, `brand.css`
  +8); a `.prettierignore` entry for `design/` + `src/styles/brand.css` is the durable fix but a tooling change
  outside F-04 — follow-up candidate (plan review F1).
- **Reader-side index reads** (`home.astro` `StatCard` `stats[n]`) stay unguarded by `astro check`; guard = grep +
  kit-contract `stats[1]` pin + visual row (Phase 2 break 2).

## Performance Considerations

None — string replacement at render.

## Migration Notes

None. Rollback = revert the merge (kit and app move together; `copy.ts` imports the kit JSON directly).

## Autonomous decisions

Recorded in place of the skill's questions (run contract rule 1). Nothing here departs from the PRD's literal text;
the kit-text departures are collected in the Phase 3 `[human]` row.

| # | Decision | Chosen | Rejected | Why | What would change it |
| --- | --- | --- | --- | --- | --- |
| 1 | Complexity / questions | MEDIUM, 0 questions | Interview | Research resolved every break with a recommended minimal fix | A product owner available |
| 2 | 4 removed `authStates` | Intake patch into the kit, verbatim (K12) | `copyExtra.auth` + repoint 2 pages | No round-3 key holds them, prototype still renders them, readers unchanged, precedent | A rule that `design/rytm-os/` must be byte-faithful to the delivery |
| 3 | Patterns table header | 7 kit labels mapped to today's body order via `tableHeaders` | Kit order now (swap body cells) | F-04 is no-redesign; body reorder is K17 adoption owned by S-14 | S-14 dropped from the run (then take kit order here) |
| 4 | Wizard save failure | `copyExtra.imports.saveError` from round-3 `app.js` | `components.error` (now a read-failure line); `authStates.genericError` | Exact meaning, verbatim kit text | The author adding a `content.json` key |
| 5 | Month preposition | Shared `fillMonthLocative` with „we wrześniu”, applied to `/fixed` and the pattern detail | Kit-literal „w wrześniu”; fix only `/fixed` | Real users' latest month is September today; one helper avoids a duplicated locative read | The author fixing the template (e.g. `{inMonth}`) — then bind to it |
| 6 | Trend minimum | `copy.trend.minimumMonths` for condition and text, pinned at 3 by the kit-contract test | Hardcoded `3` | One source, PRD agrees on 3 | PRD changing the minimum (then the pin moves with the PRD, not the kit) |
| 7 | Password `{n}` source | `MIN_PASSWORD_LENGTH` (enforced rule); kit number pinned equal by test | Kit `passwordMinLength` | The app constant is what zod enforces; the test catches drift | Kit and app disagreeing → app wins, K-row |
| 8 | Card feet | Keep `copyExtra.home` feet | Kit `stats[].foot` templates | Kit foot is ungrammatical for n = 1; smoke pins `>1 pozycja podrożała<` | A grammatical kit foot (S-15) |
| 9 | Phase cut | Kit + app adaptation in one phase | Kit-only phase first | `copy.ts` imports the JSON; smoke asserts the filled trend sentence, so a kit-only phase is red | — |
| 10 | Guard for index reads | Unit kit-contract test + seam grep | Enabling `noUncheckedIndexedAccess` | The TS flag would ripple through unrelated code; out of F-04's scope | A later hardening change taking the flag repo-wide |
| 11 | Commit type for the kit swap | `feat(…): … (p1)` per run contract | Separate `design:` commit (round-2 precedent) | Contract fixes one commit per phase, and the kit swap cannot be green alone | — |

## References

- Research: `context/changes/kit-round-3-intake/research.md`
- Identity / claims: `context/changes/kit-round-3-intake/change.md`
- Round-2 intake precedent: commit `2ad7d14`
- Run contract: `context/runs/2026-10-02-kit-round-3/agent-contract.md`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Round-3 kit in place, app adapted

#### Automated

- [x] 1.1 Raw delivery vs kit diff shows only content.json, parsed diff = 4 restored authStates leaves — 7188f7f
- [x] 1.2 sync-kit.sh re-run is idempotent, brand.css diff = 8 token lines, no prettier on kit files — 7188f7f
- [x] 1.3 Grep for stats[2+], columns.slice, amountColumn in src is empty — 7188f7f
- [x] 1.4 npm test: baseline + format and table-columns cases, 0 failed — 7188f7f
- [x] 1.5 Deliberate break: removed authStates.loginError turns astro check red, restored — 7188f7f
- [x] 1.6 Deliberate break: fillMonthLocative without „we” turns September cases red, restored — 7188f7f
- [x] 1.7 Full local gate vs baseline, smoke Δ0 — 7188f7f

#### Manual

- [x] 1.8 [reviewer] Kit content equals the delivery except the 4 restored strings; nothing under design/ removed — impl review (diff -rq + parsed diff: 4 added leaves, byte-equal to main)

### Phase 2: Regression guards and K18 cleanup

#### Automated

- [x] 2.1 npm test: Phase 1 count + kit-contract cases, 0 failed — 3507260
- [x] 2.2 Smoke baseline + 6 PASS, 0 FAIL; smoke diff only added lines — 3507260
- [x] 2.3 Deliberate break: dropping patterns.columns[3] turns kit-contract and table-columns red, restored — 3507260
- [x] 2.4 Deliberate break: home.astro back to stats[2] — meta-check recorded (no automated reader-side guard), restored — 3507260
- [x] 2.5 Deliberate break: raw fixedCosts.new turns the /fixed smoke step red, restored — 3507260
- [x] 2.6 No K18 in src; DESIGN-GAP count = baseline − 4 — 3507260
- [x] 2.7 Full local gate vs baseline, smoke + 6 — 3507260

#### Manual

- [x] 2.8 [reviewer] Every kit-contract assertion maps to a real read in src/ — impl review (passwordMinLength is the deliberate drift pin of plan decision 7; overInMonth pin added in d279eef)

### Phase 3: Gap register round 3, follow-ups, seam sweep

#### Automated

- [x] 3.1 design-kit.md says kit_round: 3 and every register id has a round-3 status — d54c0e3
- [x] 3.2 Seam greps (monthsLocative[, amountColumn, stats[2], Rozpoznane wydatki, K18) empty — d54c0e3
- [x] 3.3 Phase 3 leaves design/ untouched — d54c0e3
- [x] 3.4 Deliberate break: re-added amountColumn caught by the seam grep, restored — d54c0e3
- [x] 3.5 Full local gate vs baseline, smoke + 6 — d54c0e3

#### Manual

- [x] 3.6 [visual] Screenshots desktop + ~400 px of every listed state, compared with the kit views — reviews/visual-review.md (VISUAL: PASS), register fix 0bb4588
- [x] 3.7 [reviewer] Seam sweep complete; register matches research matrix; follow-ups carry Trigger lines — impl review, fixes d279eef
- [ ] 3.8 [human] Accept F-04 kit-text deviations and send the round-4 K-rows to the kit author
