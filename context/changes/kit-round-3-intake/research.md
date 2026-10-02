---
date: 2026-10-02T21:49:13+02:00
researcher: Claude (autonomous run 2026-10-02-kit-round-3, research step)
git_commit: a92237e
branch: feat/kit-round-3-intake
repository: Rytm
topic: "F-04 kit-round-3-intake — what breaks when the round-3 delivery replaces design/rytm-os/, and how each break is resolved"
tags: [research, design-kit, content-json, copy, kit-round-3, intake]
status: complete
last_updated: 2026-10-02
last_updated_by: Claude (autonomous run, research step)
---

# Research: F-04 `kit-round-3-intake`

**Date**: 2026-10-02T21:49:13+02:00
**Researcher**: Claude (autonomous run 2026-10-02-kit-round-3, research step)
**Git Commit**: a92237e
**Branch**: feat/kit-round-3-intake
**Repository**: Rytm

## Research Question

Derived from `change.md` § Notes, § Open follow-ups and `handoff.md` § 5 (no human asked):

1. Which app reads of `content.json` keys break or change meaning when the round-3 `content.json` replaces the round-2 one, and what is the minimal fix for each (no redesign — later slices bind views)?
2. Is the roadmap's "55 `copyExtra` texts renamed, 90 reworded or gone" true? What is the `copyExtra` → round-3 key map?
3. For the 4 removed-and-used `authStates` keys: does a round-3 key carry the same text (→ repoint) or must they be restored (intake patch)?
4. What does the file copy itself involve (mapping, `sync-kit.sh`, tokens, formatting hooks)?
5. Status of every round-3 K/G register item and its adopting slice (S-12…S-15), plus kit-vs-PRD contradictions.

All measurements below were taken in this step with Node scripts over the two `content.json` files and `src/content/copy.ts`
(scratch scripts, not committed). Leaves are counted with arrays of scalars as ONE leaf and arrays of objects expanded
per item (this is why the counts here, 197 → 385, differ from `change.md`'s 146 → 345 which collapsed arrays of objects too;
both are the same files, different metric).

## Summary

- **The swap causes 4 kinds of render break plus 1 meaning shift (items 1–5 below; checked against every `copy.*` access path in `src/`)**, all in code reading `copy.*` (kit) — no
  `copyExtra` read breaks, because `copyExtra` is a separate object that F-04 does not touch:
  1. `src/pages/login.astro` `s.loginError`, `src/pages/reset.astro` `s.resetTitle` / `s.resetBody` / `s.checkInbox` → `undefined` (keys removed).
  2. `src/pages/home.astro` second `StatCard` `copy.dashboard.stats[2].label` → `undefined` (stats now has 2 cards; „Koszty stałe” is `stats[1]`). TypeScript will NOT catch it: `tsconfig.json` extends `astro/tsconfigs/strict` without `noUncheckedIndexedAccess`, so `stats[2]` type-checks.
  3. `src/components/patterns/PatternsTable.tsx` header: `copy.columns.slice(0, 4)` + `copy.amountColumn` + `copy.columns.slice(4, 6)` renders „Sprzedawca, Typ, Wystąpienia, **Kwota, Kwota**, Suma, Próg” over body cells „…, Suma, kwota, próg, ponad progiem” — a silent mislabel, „Ponad progiem” dropped.
  4. Literal placeholders: `fixedCosts.new` („Nowe w {month}”, `fixed.astro`), `trend.tooShort` („…po {n} miesiącach…”, `home.astro`), `authStates.passwordTooShort` (props of `SignUpForm` via `register.astro`, `NewPasswordForm` via `reset/new.astro`, settings password form via `settings.astro`), `resetNew.lead` (`reset/new.astro` `r.lead`).
  5. Meaning shift: `components.error` becomes „Nie udało się wczytać danych. Odśwież widok lub spróbuj ponownie.” — this now **fits** the 6 read-failure uses (it resolves K18) but **misfits** `imports/new.astro` `genericError` (wizard save failure, `ImportWizard.tsx` `pageError.kind === "failed"`).
- **Roadmap claim 55 / 90 is approximately right**: of 216 `copyExtra` leaves, 127 appear byte-identical somewhere in round-3 `content.json` (71 at the same path, 56 under a different key), 89 do not appear verbatim (16 have a same-named key with different wording, 73 have no counterpart by text or name). F-04 does not migrate them; the full map is below for S-12…S-15.
- **The 4 removed `authStates` texts have no round-3 key** (searched by value across all 385 leaves); the round-3 prototype still renders all four verbatim in `prototype/app.js` (auth screen `#authError`, reset screen and its sent state). So they must be restored — intake patch per K12 precedent (change.md decision 2), or `copyExtra.auth` (K11 convention). The author was asked in round 2 (K12) to restore 8 keys at source; round 3 restored the 4 `patternActions.*` but not the 4 `authStates.*` → K12 is **partial**.
- **Wizard save-failure copy exists in the round-3 prototype**: `app.js` `#/imports/result?status=error` renders „Nie udało się zapisać importu. Spróbuj ponownie.” (not in `content.json`) — the exact meaning of `genericError`.
- **File copy is mechanical**: assets byte-identical (`diff -rq` empty), `src/styles/brand.css` is in sync with the round-2 kit today, so `scripts/sync-kit.sh` will only add the 8 `--rytm-*` tokens (no Tailwind colour changes; `global.css` shadcn `--accent` does not collide with `--rytm-accent`). Prototype: 32 view files added under `prototype/views/` plus `prototype/README.md`, 0 removed. Pre-commit `lint-staged` runs `prettier --write` on `*.{json,css,md}` including `design/**` (no `.prettierignore` entry), so committed kit bytes will be reformatted — round 2 (`2ad7d14`) shows the same; verify by parsed JSON, not `cmp`.
- **No migration**, no smoke assertion changes needed if templates are filled with the same values (smoke asserts „Trend pojawi się po 3 miesiącach danych.”, „Suma w maju” — the latter reads `copyExtra`).

## Detailed Findings

### 1. Round-2 → round-3 `content.json` diff (kit keys)

Measured: 197 → 385 leaves; 20 removed, 18 changed value; new top-level namespaces `imports`, `app`, `home`, `stub`.

**Removed (20 leaves = 10 keys)** — app use checked by `grep` of `src/` for every key:

| Key | Used by app? |
| --- | --- |
| `authStates.loginError` | yes — `login.astro` `serverError={hasError ? s.loginError : null}` |
| `authStates.resetTitle` | yes — `reset.astro` `AuthLayout title` and `<h1>` |
| `authStates.resetBody` | yes — `reset.astro` lead `<p>` |
| `authStates.checkInbox` | yes — `reset.astro` sent state `<p>` |
| `dashboard.stats[2]` (label/value/foot) | yes — `home.astro` `copy.dashboard.stats[2].label` |
| `auth.confirmEmailTitle/Body`, `auth.resetNewTitle`, `auth.resetExpired`, `dashboard.patterns[]`, `importFlow.overlap` | no (0 hits); `copy-map.md` forbids re-adding `auth.confirmEmail*`/`auth.resetNew*`/`auth.resetExpired` |

**Changed value (18)** and what reads them:

| Key | Round 3 value | App read | Effect |
| --- | --- | --- | --- |
| `dashboard.stats[1].label` | „Koszty stałe” (was „Rozpoznane wydatki”) | none today | becomes the correct source for the 2nd card |
| `dashboard.stats[1].value/foot` | sample / „{n} {items} podrożały” | none | see §4 (grammar) |
| `dashboard.stats[0].foot` | „{delta} względem {month}” | none (app uses `copyExtra.home.deltaFoot`, identical text) | none |
| `dashboard.description` | „…w {month}.” | none | none |
| `patterns.columns` | 7 items, „Kwota” at index 3 | `PatternsTable.tsx` via `patterns.astro` `columns: copy.patterns.columns` | mislabel (§3) |
| `patternDetail.sumLabel` | „Suma w {month}” | none (detail uses `copyExtra.patterns.sumLabel`) | none |
| `fixedCosts.new` | „Nowe w {month}” | `fixed.astro` `FixedSection title={copy.fixedCosts.new}` | literal `{month}` |
| `trend.current` | „Bieżący miesiąc” | none (`TrendChart.astro` omits the legend entry, G35) | none |
| `trend.tooShort` | „…po {n} miesiącach danych.” | `home.astro` `TrendChart note=` | literal `{n}` |
| `importFlow.supported` | both banks | none (`imports/new.astro` overrides with `copyExtra.imports.supported`) | none |
| `importFlow.result` | „Import gotowy.” | none (`imports/result.astro` uses `copyExtra`, G26) | none |
| `components.error` | „Nie udało się wczytać danych. Odśwież widok lub spróbuj ponownie.” | 7 sites (below) | meaning shift |
| `components.info` | „…po {n} miesiącach.” | none | none |
| `authStates.passwordTooShort` | „…co najmniej {n} znaków.” | `register.astro`, `settings.astro` (`a.passwordTooShort`), `reset/new.astro` | literal `{n}` |
| `resetNew.lead` | same template | `reset/new.astro` `r.lead` | literal `{n}` |
| `importErrors.overlap` | „…import: {range}.” | none (`ImportWizard.tsx` `overlapMessage` uses `copyExtra.imports.overlapPrefix`); `imports/new.astro` spreads `copy.importErrors` into `errors` but the overlap key is not rendered | none |
| `importErrors.unknownFormat` | both banks | overridden in `imports/new.astro` by `copyExtra.imports.unknownFormat` | none |

`components.error` readers (all `copy.components.error`): `home.astro`, `patterns.astro`, `fixed.astro`, `imports/index.astro`,
`patterns/[...key].astro`, `imports/result.astro` (count could not be read) — all read failures, each with a
`DESIGN-GAP: K18` comment saying the kit had no read-failure copy; plus `imports/new.astro` `genericError` (save failure).

Type-level effects of the new shape (checked): `ImportWizardLabels.errors: typeof copy.importErrors` absorbs the new
keys incl. the `limits` object (spread stays valid); `authStates.passwordMinLength` / `resetNew.passwordMinLength` /
`trend.minimumMonths` are numbers — no code iterates a `copy` namespace (`grep Object.(values|entries|keys)(copy` → 0 hits).
No unit test imports `@/content/copy` (only `src/lib/import/banks.ts` reads `copyExtra`, unaffected).

### 2. Removed `authStates` keys — restore vs repoint

- Value search over all 385 round-3 leaves: none of „Nie rozpoznaliśmy tego e-maila i hasła. Spróbuj ponownie.”, „Odzyskaj dostęp.”, „Podaj e-mail, którego używasz w Rytmie.”, „Jeśli konto istnieje, wysłaliśmy instrukcję zmiany hasła.” is present.
- All four are rendered verbatim by the round-3 `prototype/app.js` (login `#authError` inline alert; reset form h1 + p; reset submit's sent state).
- `design-kit.md` K12: round 2 intake restored 8 keys verbatim and asked the author to restore them at source. Round 3 has `patternActions.merge/changeType/rename/exclude` but not the 4 `authStates` → K12 partial.
- Recommendation: keep change.md decision 2 — intake patch, restore the 4 verbatim in `design/rytm-os/react-kit/docs/content.json` `authStates`, readers unchanged, K12 row updated („round 3: patternActions delivered, authStates dropped again — re-restored at intake”). Alternative (equally valid, K11 convention „prototype renders it, content.json lacks it”): move to `copyExtra.auth` and repoint 2 pages. The intake patch is preferred because it keeps reader code unchanged in F-04 and S-12 rebinds auth anyway; it would flip if the plan wants `design/rytm-os/` byte-faithful to the delivery (then `copyExtra`).

### 3. Minimal fixes for each break (presentation only)

| Break | Minimal fix (F-04) | Source for the value |
| --- | --- | --- |
| `stats[2].label` | read `copy.dashboard.stats[1].label` | round-3 `dashboard.stats[1].label` „Koszty stałe” |
| card feet | keep `copyExtra.home.deltaFoot` / `risen` + `risenForms` | kit `stats[1].foot` „{n} {items} podrożały” is grammatical only for plural forms 2–4 („1 pozycja podrożały” with `fixedCosts.itemForms`); smoke asserts `>1 pozycja podrożała<` (`scripts/smoke.mjs` „home counts fixed costs that rose”) → new K-row for the author, adopt in S-15 |
| table header | render the 7 kit labels; to keep F-04 free of a layout change, map them to the current body order (Sprzedawca, Typ, Wystąpienia, **Suma**, **Kwota**, Próg, Ponad progiem = kit indices 0,1,2,4,3,5,6) and drop `copyExtra.patterns.amountColumn` from the header; kit order (Kwota before Suma) is S-14's (K17) | `patterns.columns` |
| `fixedCosts.new` | `.replace("{month}", <locative of overview reference month>)` | `copyExtra.patterns.monthsLocative` (already used by `patterns/[...key].astro` `monthLocative`) or kit `patternDetail.monthNames` (nominative→locative map); „Nowe w maju” for May |
| `trend.tooShort` | `.replace("{n}", String(copy.trend.minimumMonths))` | kit `trend.minimumMonths` = 3; PRD § Success Criteria → Secondary („Trend … na ≥ 3 miesiącach”) agrees; `home.astro` also hardcodes `< 3` in the `note=` condition — may switch to `minimumMonths` |
| `passwordTooShort`, `resetNew.lead` | `.replace("{n}", String(MIN_PASSWORD_LENGTH))` at the 3 page call sites / `r.lead` | `src/lib/auth-rules.ts` `MIN_PASSWORD_LENGTH` = 6 (enforced by `api/auth/signup.ts`, `api/auth/password.ts`, `api/auth/reset/new.ts` zod); kit `passwordMinLength` = 6 agrees; PRD silent on length → the app constant is the rule, kit number is documentation |
| `components.error` in wizard | `genericError` ← new `copyExtra.imports.saveError` „Nie udało się zapisać importu. Spróbuj ponownie.” (verbatim from round-3 `app.js` `status==='error'`), with a K-row (content.json lacks it); the 6 read-failure sites keep `components.error` and their `DESIGN-GAP: K18` comments can go (K18 delivered) | round-3 prototype `app.js` |

Smoke impact: with the values above every currently asserted string renders identically (`Trend pojawi się po 3 miesiącach danych.`,
`Suma w maju` from `copyExtra`, `>1 pozycja podrożała<`, `>Ponad progiem w tym miesiącu<`). A new smoke assertion is
worth adding for each fixed break (e.g. `/home` contains `>Koszty stałe<` card label, `/fixed` with data contains no `{month}`,
`/reset` contains `Odzyskaj dostęp.`), using the `>text<` rule for island content (agent contract).

### 4. `copyExtra` → round-3 map (for S-12…S-15; F-04 does not migrate)

216 leaves: **71** byte-identical at the same path (e.g. all `auth.loginVisual/registerVisual/resetVisual`, most of
`imports.*` header copy, `app.*` except `settingsLong`, `landing`/`howItWorks`/`forWho` additions); **56** byte-identical at a
different path; **16** same key name, different wording; **73** without counterpart by text or key name.

Renamed (byte-identical, different key) — the 56, grouped:
- auth → `confirmEmail.eyebrow/title` (`checkInboxEyebrow/Title`), `authStates.newPassword/repeatPassword/passwordMismatch` (`newPassword`, `repeatPassword`, `passwordsDiffer`), `settings.deleteSuccess` (`deletedLogin`), `threshold.saving` (`saving`).
- home → `dashboard.descriptionNoName` (`lead`), `dashboard.stats[0].foot` (`deltaFoot`).
- imports → `importFlow.accountLabel/rangeLabel/debitForms/back/importButton/waiting` (`table.account`/`summary.account`, `table.range`/`summary.range`, `debitForms`, `stepBack`, `confirm`, `importing`), `imports.delete/deleteClose/deleteSuccess/deleteWaiting` (`deleteAction`, `close`, `deleted`, `deleting`).
- patterns → `app.patternsLong` (`eyebrow`), `patterns.countForms` (`patternForms`), `patterns.excluded` (`excludedToggle`), `patternDetail.typeFixed/typeFrequent/monthSelect/sequenceWithin/sumLabel/noOccurrences/thresholdError` (`typeLeads.*`, `occurrencesPanel`, `sequenceWithin`, `sumLabel`, `monthEmpty`, `thresholdSaveError`), `threshold.title/noThreshold/activeLabel/amount/count/unitCurrency/unitCount` (`thresholdPanel`, `thresholdNone`, `thresholdActive`, `valueLabel.*`, `suffix.*`), `patternActions.eyebrow/title/lead/typeChanged/excludedToast/close/merged/undoMerge` (`actions*`, `typeChanged`, `excludedToast`, `close`, `merged`, `unmerge`).
- fixed → `app.fixedLong` (`eyebrow`), `fixedCosts.itemForms` (`itemForms`).
- settings → `auth.fields.email/password` (`emailLabel`, `passwordLabel`), `settings.passwordSuccess`, `settings.passwordInvalid`, `imports.deleteWaiting` (`deleting`), `patternActions.close` (`close`).
- app → `app.settings` (`settingsLong`).
- Coincidental value matches to watch (same text, different meaning): `patterns.amountColumn` „Kwota” ↔ `threshold.amount`; `fixed.eyebrow` ↔ `dashboard.stats[1].label`.

Reworded under a related key (16 by name, plus semantically paired ones found by reading the namespaces), notable:
`fixed.noComparison` „Nie ma poprzedniego…” → `fixedCosts.noComparison` „Brak poprzedniego miesiąca do porównania.” (smoke
asserts the old text — S-15 must update the smoke string with the copy); `patterns.renamed` → `patternActions.renamed`
„Nazwa wzorca zmieniona.”; `patterns.mergeInvalid` → `patternActions.mergeInvalid`; `patterns.thresholdInvalid` →
`patternDetail.thresholdInvalid`/`threshold.invalid` „Wpisz próg większy od zera.”; `patterns.sequenceSummary` →
`patternDetail.sequenceSummary` (new placeholders `{within}`/`{over}`); `patterns.mergeNone` → `patternActions.mergeEmpty`;
`patterns.nameInvalid` → `patternActions.renameLong` („maksymalnie {n} znaków”, `renameMaxLength` 60 — see §6);
`patterns.decisionError` → `patternActions.saveError`; `patterns.detailMissing` → `patternDetail.notFound`;
`fixed.changedEmpty`/`newEmpty` → `fixedCosts.noChanges`/`noNew`; `imports.formatRecognised.{ing,santander}` →
`imports.formatRecognised` template „Rozpoznano format {bank}.”; `imports.accountLabel.{ing,santander}` → `imports.accountLabel`
„Rachunek” / `importFlow.accountSantander` (C6); `imports.deleteDialogTitle/Body` → `imports.deleteTitle` „Usunąć import z
zakresu {range}?” / `deleteBody` (shortened); `imports.deleteMissing` → `imports.notFound`; `imports.demoLocked` →
`importFlow.demoImportBlocked` / `imports.demoDeleteBlocked`; `settings.demoLocked` → `settings.demoNotice` /
`demoPasswordBlocked` / `demoDeleteBlocked`; `auth.deletedLogin` also ↔ `settings.deletedNotice` (longer); `home.noThreshold` ↔
`trend.noThreshold` „Brak ustawionego progu” (smoke asserts the copyExtra text — S-15); `emptyViews.body` ↔ per-view
`emptyViews.{patterns,fixed,imports}.lead`.

No round-3 key found (kept in `copyExtra` until the author adds them): month declension tables (`home.monthsNominative`,
`home.monthsGenitive`; locative exists as `patternDetail.monthNames`), `imports.stepEyebrow/accountTitle/accountLead/
accountForms/selected/summaryTitle/summary.debits/summary.skipped/overlapTail/resultTitle/transactionForms/toPatterns/
toOverview/resultEyebrow/next`, `patterns.upload/sortPrefix/footer/typeLabels/setThreshold/thresholdRemoved/overBadge/
thresholdCount/thresholdSum/openPattern/occurrenceForms/overInMonth/mergeLabel/mergeSubmit/renameLabel/renameHint/
renameSubmit/unmerged/mergedLabel`, `fixed.previously/firstSeen/unchangedEmpty`, `settings.loginData/dataLabel/
dangerEyebrow/deleteDialog*`, `auth.confirmedLogin/occupiedOr/saveNewPassword/doneEyebrow/resetSuccessLead/resetNewError/
resent/resendError`. Several are in the round-3 prototype `app.js` / views as rendered text (not checked one by one) — each
slice checks its own views.

### 5. File copy, tokens, formatting

- Mapping (agent contract § This run): `kit-delivery/react-kit/{docs,styles,assets,README.md}` → `design/rytm-os/react-kit/`; `react-kit/prototype/` → `design/rytm-os/prototype/`; `rytm-os/` → `design/rytm-os/brand-pack/`; `CHANGELOG.md` → `design/rytm-os/CHANGELOG.md`.
- Diff of trees (`diff -rq`): react-kit changes `README.md`, `docs/content.json`, `docs/routes.md`, `styles/brand.css`, adds `docs/copy-map.md`; assets identical. Prototype: 3 changed files (`app.js`, `styles.css`, `views/index.html`), 33 added (`prototype/README.md` + 32 view files: `fixed-error/no-changes/no-month/no-new`, `home-demo`, 13 `imports-*`, `login-deleted`, 6 `pattern-*`, `reset-new-expired/success`, 5 `settings-*`), 0 removed. Brand pack: only `dokumentacja/karta-stylu.md` differs.
- `src/styles/brand.css` equals `sed(font path)` of the round-2 kit `brand.css` today, so `scripts/sync-kit.sh` will add exactly the 8 tokens `--rytm-accent/field/focus-ring/sequence/sequence-soft/merchant-mark/badge-soft/danger-line` and rewrite `public/rytm/` with identical assets. No Tailwind `@theme` change is needed (change.md decision 3).
- `package.json` `lint-staged`: `*.{json,css,md}` → `prettier --write`; `.prettierignore` lists only `test/fixtures/`; `eslint.config.js` ignores `design/**`. Committing `design/**` reformats JSON/CSS/MD (round-2 commit `2ad7d14` content.json diff shows the reformat). Acceptable (precedent); the plan's check that "delivery == kit" must compare parsed JSON / ignore whitespace, and `src/styles/brand.css` must be produced after the reformatted kit file lands (or both reformatted consistently) so `sync-kit.sh` stays idempotent.
- Precedent `2ad7d14`: one `design: …` commit containing kit files + intake patch + `design-kit.md` update.

### 6. K/G register status (round 3) and contradictions

See § Register matrix below (from a read-only sub-agent over `design-kit.md`, the delivery and `roadmap.md`; its
claims that touch F-04 were re-checked here, one rejected). Contradictions found directly in this step:

- **Rename max length**: kit `patternActions.renameMaxLength` = 60 and `renameLong` „…maksymalnie {n} znaków” vs app `src/lib/patterns/decision-form.ts` `parseDisplayName` (> 100 → invalid) and DB `supabase/migrations/20260928120000_pattern_decisions.sql` `display_name` CHECK `char_length … between 1 and 100`. PRD FR-009 is silent on length. Recommendation for S-14: the app/DB 100 wins (changing it is a schema change, not presentation); fill `{n}` with 100; `[human]`-row the discrepancy for the author.
- **Trend „niepełny”**: PRD US-05 AC („Niepełny bieżący miesiąc jest pokazywany na równi z pełnymi, bez oznaczenia”) now agrees with kit C4 and `trend.current` „Bieżący miesiąc” — G35's "niepełny" conflict is resolved by the kit.
- **`dashboard.stats[1].foot`** grammar (above) — kit defect, not a PRD conflict.

Further contradictions from the sub-agent, verified here:

- **Locative „wrześniu”**: kit `patternDetail.monthNames.wrzesień` = „wrześniu” → „Suma w wrześniu”; the kit's own `app.js` uses „we wrześniu”. The app has the same defect today (`copyExtra.patterns.monthsLocative`), so F-04 filling `fixedCosts.new` with it yields „Nowe w wrześniu” in September. Pre-existing; K-row for the author, fix with the slice that owns month templates (S-14/S-15) — or F-04 handles the „w”/„we” preposition if the plan wants zero new defects.
- **`trend.tooShort` vs FR-013** (PRD § Functional Requirements → Progi i reguła, FR-013 „dla wszystkich miesięcy obecnych w danych”): the text „Trend pojawi się po {n} miesiącach” suggests hiding, but `home.astro` renders every month's bar and adds the text only as an info note (`TrendChart.astro` `note`) — same behaviour and wording as round 2. Not a new conflict; F-04 keeps it. Sub-agent's "do not adopt" is rejected as overstated.
- **Demo `/reset/new` refusal** has no kit copy (app `DEMO_ERROR.resetNew` in `src/lib/demo.ts`) — G37 remainder for S-12.
- **Sub-agent claim rejected**: it states `authStates.resetTitle/resetBody/checkInbox` were "folded into `resetNew.*`/`confirmEmail.*`". The value search finds none of the three texts in round 3 (`confirmEmail.title` „Link jest w drodze.” is the old `copyExtra.auth.checkInboxTitle`, a different string from `authStates.checkInbox`). All 4 need restoring.

### Register matrix (round 3)

| id | Status | Evidence (round-3 key / view / decision) | Adopting slice |
| --- | --- | --- | --- |
| K11 | partial | most `copyExtra` namespaces delivered (§4); missing: how-it-works explain band, `/fixed` lead, many wizard/pattern strings (§4 "No round-3 key") | S-12…S-15 by screen |
| K12 | partial | `patternActions.merge/changeType/rename/exclude` back; 4 `authStates` dropped again | F-04 (intake patch) |
| K13 | partial | panels drawn in `app.js` `confirmEmail()`/`resetNew()`, copy not in `content.json` | S-12 |
| K14 | delivered | `auth.confirmEmail*`/`resetNew*`/`resetExpired` removed; `copy-map.md` | S-12 |
| K15 | partial | `--rytm-danger-line`, `settings.dangerBorder`, `settings.logout` (C2); „Dane logowania”, „Strefa destrukcyjna” etc. only in `app.js` | S-12 |
| K16 | delivered | `importErrors.overlap` „…{range}.”; `importFlow.overlap` removed | S-13 |
| K17 | delivered | `patterns.columns[3]` „Kwota” | F-04 header labels; S-14 order |
| K18 | delivered | `components.error` (read failure), `fixedCosts.readError` | F-04 (drop K18 comments) / S-15 |
| K19 | partial | `imports.delete/deleteTitle/deleteBody/deleteClose`; eyebrow „Cofnij import” only in `app.js` | S-13 |
| K20 | delivered | `imports.deleteSuccess` | S-13 |
| K21 | partial | `patternDetail.*`, `threshold.*` delivered; missing „Ustaw próg”, occurrence plurals, type eyebrow | S-14 |
| K22 | delivered | `patternActions.eyebrow/title/lead/typeChanged/excludedToast/closeLabel` | S-14 |
| K23 | partial | `fixedCosts.itemForms`; row meta („poprzednio”, „pierwsze wystąpienie”) missing | S-15 |
| K24 | delivered | `dashboard.descriptionNoName` | S-15 |
| K25 | partial | `dashboard.stats[].foot` templates; no genitive months; „podrożały” wrong for n=1 | S-15 |
| K26 | delivered | `importFlow.supported`, `importErrors.unknownFormat`, `imports.bankName.*` | S-13 |
| G20 | resolved-by-decision | C1 (footer link) | S-12 |
| G23 | delivered | `settings.currentPassword/newPassword/repeatPassword`, `settings.html` | S-12 |
| G24 | delivered | `settings.passwordSuccess/passwordInvalid/saveError/deleteError/deletedNotice`, `login-deleted.html` | S-12 |
| G25 | delivered | `importFlow.importButton/waiting`, `imports-summary.html` | S-13 |
| G26 | delivered | `importFlow.result`, `imports-result*.html` | S-13 |
| G27 | delivered | `importErrors.tooLarge/tooMany/inconsistent/limits` (5 MB / 5000) | S-13 |
| G28 | delivered | `--rytm-merchant-mark`, `patterns.showMore/merchantMark` | S-14 |
| G29 | delivered | `styles.css` `:focus-within` with `--rytm-focus-ring` | S-14 |
| G30 | delivered | `imports.deleteError/notFound/deleteWaiting`, `imports-deleted/delete-error/not-found.html` | S-13 |
| G31 | partial | `patternDetail.notFound/noOccurrences/sequenceSummary`, `threshold.invalid/saveError`, `--rytm-sequence*`; off-month „ponad progiem” label not addressed | S-14 |
| G32 | resolved-by-decision | C3, `--rytm-field` | S-12 |
| G33 | partial | merge picker, `mergeEmpty`, `renameLong`, `mergedVariants`, `undoMerge`; `patternActions.lead` refers to a non-existent "ustawienia wzorca" | S-14 |
| G34 | delivered | `fixedCosts.noChanges/noNew/noComparison/readError/decreased`, `--rytm-badge-soft` | S-15 |
| G35 | resolved-by-decision | C4; grid line still raw `#d2d7d8` | S-15 |
| G36 | resolved-by-decision | C5 (permanent omission) | F-04 closes the row |
| G37 | delivered (app gap: demo `/reset/new`) | `app.demoNotice`, `settings.demo*`, `imports.demoDeleteBlocked`, `importFlow.demoImportBlocked` | S-12 + S-13 |

Delivered without a K/G row (record in `design-kit.md` so slices find them): „Pokaż więcej” (`patterns.showMore`, S-14),
C6 Santander account label (S-13), resend countdown `confirmEmail.resendCountdown` (S-12), new trend pieces
`trend.amountLabel/zeroMarker/gridLabel` (S-15), import-result waiting/error/not-found views (S-13), new duplicate keys
(`patternDetail.thresholdError` vs `threshold.saveError`, `patternActions.error*` vs `mergeInvalid/renameLong/saveError`,
`settings.*Password` vs `authStates.*Password`, `settings.confirmation` vs `deleteConfirm`, `imports.accountLabel` vs
`importFlow.accountLabel`) — a K14-like K-row. CHANGELOG § Runda 3 „Zakres i ograniczenia” says the author worked
without `copy.ts` / `design/rytm-os/` (from a `dist/` export), which explains the dropped keys.

## Code References

- `src/content/copy.ts` `copy`, `copyExtra` — kit import and gap strings
- `src/pages/login.astro` `s.loginError`; `src/pages/reset.astro` `s.resetTitle`, `s.resetBody`, `s.checkInbox`
- `src/pages/home.astro` `StatCard` (`copy.dashboard.stats[2].label`), `TrendChart note=` (`copy.trend.tooShort`), `deltaFootFor`, `risenFootFor`
- `src/components/patterns/PatternsTable.tsx` `<thead>` (`copy.columns.slice`, `copy.amountColumn`)
- `src/pages/fixed.astro` `FixedSection title={copy.fixedCosts.new}`
- `src/pages/register.astro`, `src/pages/settings.astro`, `src/pages/reset/new.astro` — `passwordTooShort` props, `r.lead`
- `src/components/auth/SignUpForm.tsx`, `NewPasswordForm.tsx` — `labels.passwordTooShort`, `MIN_PASSWORD_LENGTH`
- `src/lib/auth-rules.ts` `MIN_PASSWORD_LENGTH`
- `src/pages/imports/new.astro` `genericError: copy.components.error`; `src/components/imports/ImportWizard.tsx` `ImportWizardLabels`, `serverMessage` (`pageError.kind === "failed"`)
- `src/pages/patterns/[...key].astro` `monthLocative`, `overLabel` (`copy.dashboard.stats[0].label`, unchanged value)
- `src/lib/patterns/decision-form.ts` `parseDisplayName`
- `scripts/sync-kit.sh`; `scripts/smoke.mjs` steps „home shows the trend without a threshold”, „home counts fixed costs that rose”, „fixed without a previous month says so”, „pattern detail renders the month total”
- Delivery: `kit-delivery/react-kit/docs/{content.json,copy-map.md}`, `kit-delivery/CHANGELOG.md` § Runda 3, `kit-delivery/react-kit/prototype/app.js`

## Architecture Insights

- `copy` is the raw JSON module: shape changes surface only at runtime unless the index is out of a tuple type; JSON arrays infer as `T[]`, so index reads (`stats[2]`, `columns.slice`) are the blind spot. A plan check that greps for numeric index reads into `copy.*` covers it (today: `home.astro` `stats[0]`/`stats[2]`, `patterns/[...key].astro` `stats[0]`, `PatternsTable.tsx` `columns.slice`, `sortOptions[i]`).
- Template filling convention is chained `.replace("{x}", …)` at the page (`home.astro` `leadFor`, `fixed.astro` `countText`, `patterns/[...key].astro` `sumLabel`); no shared formatter exists — F-04 follows it.

## Historical Context (from prior changes)

- `2ad7d14` (round-2 intake): single `design:` commit, 8 keys restored verbatim (K12), `design-kit.md` → `kit_round: 2`. Supported as precedent.
- `context/foundation/design-kit.md` K18 (no read-failure copy), K17 (Kwota column), K25 (card feet samples), G35 (trend) — each resolved or partially resolved by round 3 as above.

## Related Research

Not applicable (no earlier research on kit intake under `context/changes/**` or `context/archive/**` was needed beyond the precedent commit).

## Open Questions

- Restore the 4 `authStates` in the kit (intake patch) vs `copyExtra.auth` — recommendation above; plan decides.
- Table header: index-mapped labels (no visual change) vs kit order now — recommendation: index-mapped in F-04, kit order in S-14.
- New K-rows for the author (round 4): `dashboard.stats[1].foot` grammar; import save-failure copy missing from `content.json`; `authStates` 4 keys dropped twice; rename limit 60 vs 100; „w wrześniu” locative; new duplicate keys.
