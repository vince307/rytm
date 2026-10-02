# Follow-ups — `kit-round-3-intake` (F-04)

Each entry carries a `Trigger:` line; later slices grep for it.

## S-14 — pattern table order, rename limit, focus ring

Trigger: S-14

- Table in the kit column order (K17: Sprzedawca / Typ / Wystąpienia / Suma / Kwota / Próg / Ponad progiem); F-04 only maps header labels through `tableHeaders` in the app's body order.
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
