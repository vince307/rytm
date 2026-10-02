# Follow-ups — `kit-round-3-intake` (F-04)

Each entry carries a `Trigger:` line; later slices grep for it.

## S-14 — pattern table order, rename limit, focus ring

Trigger: S-14

- Table in the kit column order (K17: Sprzedawca / Typ / Wystąpienia / Kwota / Suma / Próg / Ponad progiem — „Kwota” before „Suma”); F-04 only maps header labels through `tableHeaders` (`src/lib/patterns/table-columns.ts` `BODY_ORDER`) to the app's body order (Suma before Kwota). Swap the body cells in `PatternsTable`, then drop `tableHeaders` and update `test/unit/table-columns.test.ts`.
- Rename limit `{n}` = 100 (app `parseDisplayName` and the DB CHECK), not the kit's `renameMaxLength` 60 (K31).
- Adopt `--rytm-focus-ring` (`:focus-within`, G29) — focus-ring follow-up of `2026-09-27-pattern-threshold-over-limit`.

## S-15 — card feet, badge tint, noComparison string

Trigger: S-15

- Card feet stay `copyExtra.home.risen` until the kit foot is grammatical for n = 1 (K29).
- `Badge` `new` tint via `--rytm-badge-soft`.
- `fixed.noComparison` smoke string moves with the copy.

## S-12 — auth and settings rebinding

Trigger: S-12

- Rebinding may move the 4 restored `authStates` (K27) to their round-3 homes if the author adds them; `test/unit/kit-contract.test.ts` pins the current keys.

## Any slice touching a month template

Trigger: any slice touching a month template

- Use `fillMonthLocative`, never a local locative read; the kit's „w wrześniu” is wrong (K30), the helper writes „we wrześniu”.

## Prettier must not reformat the kit

Trigger: the next change that installs the husky hook in a checkout, adds a CI prettier gate, or runs `npm run format`

- `design/rytm-os/**` and `src/styles/brand.css` are the author's bytes (not prettier-formatted); `lint-staged` would rewrite them on commit. Add both to `.prettierignore` (plan review F1 of `kit-round-3-intake`, impl review F3).
