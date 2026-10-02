# Handoff — `kit-round-3-imports` (slice S-13)

Written by the `/10x-new` step. The slice has an identity (`change.md`, status `new`), a roadmap-claim correction
table, the kit views and content.json keys it binds, and the triggered follow-ups. No code has been touched. The one
thing the next agent must not get wrong: `design/rytm-os/` is round 3 and **read-only**. The kit's dropped-key
traps are already handled by F-04. Bind to `copy.*` where a key exists, and keep `copyExtra` only for text the kit
has in `app.js` alone.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/kit-round-3-imports`, cut from `main` at `2a8f89d` (F-04 merged) |
| Commits this step | 1: `docs(kit-round-3-imports): change identity (autonomous run)` |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `new` |
| `## Progress` rows remaining | n/a: no `plan.md` yet |
| Working tree | clean after the commit (`tree-clean.sh`) |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `context/changes/kit-round-3-imports/change.md` | Identity, outcome, migration verdict (no), roadmap claim → repo now → correction table, kit view ↔ app surface map, bound content.json keys, `copyExtra` keepers, stale `DESIGN-GAP`s to remove, triggered follow-ups, autonomous decisions |
| `context/changes/kit-round-3-imports/handoff.md` | This file |

## 3. Verification

| Command | Result |
| --- | --- |
| `git branch --show-current` | `feat/kit-round-3-imports` |
| `node -e` dump of `content.json` `importFlow` / `importErrors` / `imports` / `app` | keys listed in `change.md` § Kit bindings, `importErrors.limits` = 5 MB / 5000, matches `MAX_FILE_BYTES` / `MAX_DEBITS` in `src/lib/import/schema.ts` |
| `grep -rn DESIGN-GAP src/` (import files) | K16, K19, K20, K26, G25, G26, G27 (×5 incl. `detect.ts`), G30, G37 — all listed in `change.md` |
| `grep Trigger: context/archive/*/follow-ups/review-fixes.md` | 9 entries assessed in `change.md` § Open follow-ups |
| lint / astro check / vitest / build / pgTAP / smoke | not run: docs-only step. Baseline per agent contract (inherited, unverified): lint 0, astro check 0/152, vitest 347/22, build OK, pgTAP 6/119, smoke 157/0 |

## 4. Next command

`/10x-research kit-round-3-imports`

## 5. Open

Research questions (from `change.md` decision 1):

- Map each `copyExtra.imports.*` use site (`src/pages/imports/{index,new,result}.astro`,
  `src/components/imports/{ImportWizard,DeleteImportDialog}.tsx`, `src/lib/import/banks.ts` `accountLabel`) to its
  round-3 key, or keep it as a K11 placeholder.
- Step 3 summary: may the kit's drop of „Pominięte wpływy / zwroty” stand? Check it against FR-003 and
  `import-formats.md`.
- ING account label: the kit's `importFlow.accountDefaultING` „Konto główne” vs the file's `account_name`. If PRD and
  kit disagree, PRD wins (`[human]` row).
- C6 Santander label „Rachunek · •• tail” in the history, result and summary: `formatAccountTail` exists in
  `src/lib/format.ts`.
- Demo note shown up front: `isDemoEmail` / `demoImportAllowed` in `src/lib/demo.ts`.
- Server `?error=invalid` (`src/pages/api/imports.ts` `POST`): which message, and whether `FileError` in
  `src/lib/import/detect.ts` gains `tooLarge`.
- Result page: the kit `result-meta` panel, and the `not-found` state vs today's redirect to `/imports`.
- Which `scripts/smoke.mjs` and `test/unit/*` assertions pin today's `copyExtra` import strings. Smoke matches the
  rendered node `>text<`.

Follow-ups: there is no `follow-ups/review-fixes.md` for this slice yet. Archive follow-ups assessed in `change.md`;
none needs work beyond the scope above. F8 dialog `max-h` is checked at the visual gate.
No `DESIGN-GAP` added.

## 6. Autonomous decisions

1. Next step `/10x-research`, not `/10x-plan`. The roadmap item list was wrong twice (K18 already done, four
   `unknownFormat` stand-ins rather than three), so a plan needs source-backed mapping. Would change: research
   already on disk.
2. K18 dropped from S-13 and K28 + C6 added, following the later `design-kit.md` round-3 table. Would change:
   research finding an imports read-failure path still on non-kit copy.
3. No migration. Every kit field maps to existing `imports` columns. Would change: a kit value the CSV holds but the
   app discards.
4. Demo note up front is in scope; server guards are unchanged. Would change: a disabled button turning out wrong
   on a fresh demo DB (the seed's first import).
5. Dialog-geometry and bfcache follow-ups recorded as already resolved, after checking `dialog.tsx` `DialogContent`
   and `DeleteImportDialog` `usePageShowReset`. Would change: the visual gate measuring a mismatch.
