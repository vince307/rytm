---
change_id: kit-round-3-intake
title: Design kit round 3 taken into design/rytm-os/ with the app green on the new content.json
status: preparing
created: 2026-10-02
updated: 2026-10-02
archived_at: null
---

## Notes

Roadmap F-04 (`kit-round-3-intake`), milestone M-3 (kit round 3 — app without placeholders), first slice of the run
`2026-10-02-kit-round-3` (`F-04 → S-13 → S-12 → S-14 → S-15`). Outcome: the round-3 delivery lives in
`design/rytm-os/` in the kit's structure (react-kit, prototype, brand-pack, CHANGELOG), with an intake patch restoring
keys the app uses; `scripts/sync-kit.sh` re-synced `src/styles/brand.css`; the app on the new `content.json` shows no
`undefined`, no raw `{n}`/`{month}` and no mislabelled table; `context/foundation/design-kit.md` says `kit_round: 3`
and every round-3 K/G item has a status (delivered / partial / skipped) and the M-3 slice that adopts it.
PRD refs: none (kit only; FR unchanged). The only slice allowed to write into `design/rytm-os/` (agent contract § This
run). Precedent: round-2 intake `2ad7d14` (separate `design: …` commit, K12 intake patch, design-kit.md update).

Delivery (gitignored, orchestrator's disk): `context/runs/2026-10-02-kit-round-3/kit-delivery/`. Mapping:
`react-kit/{docs,styles,assets,README.md}` → `design/rytm-os/react-kit/`; `react-kit/prototype/` →
`design/rytm-os/prototype/`; `rytm-os/` → `design/rytm-os/brand-pack/`; `CHANGELOG.md` → `design/rytm-os/CHANGELOG.md`.
Root-level `content.json` / `brand.css` / `routes.md` / `copy-map.md` verified byte-identical (`cmp`) to their
`react-kit/` copies; `rytm-os-views-html/` = `react-kit/prototype/` minus `README.md` — ignored.

**Migration expected: no.** Copy, tokens and kit files only; no table, column, RPC or policy is touched.

### Roadmap claims checked against the repo (branch `feat/kit-round-3-intake` = `main` 577b163 + roadmap commit)

| Roadmap claim (plan-time) | Repo / delivery now | Correction |
| --- | --- | --- |
| Kit in repo is round 2; `copy.ts` imports `content.json` straight from `design/rytm-os/react-kit/docs/` | true (`src/content/copy.ts` line 1 import; `design-kit.md` `kit_round: 2`) | none |
| `copyExtra` holds 216 texts | 216 leaves (arrays counted once), 11 namespaces | none |
| `content.json` 146 → 345 keys | 146 → 345 leaves (arrays counted once; 209 → 410 counting array items) | none — metric named |
| `brand.css` + 8 semantic tokens, no new colours | 8 added (`--rytm-accent/field/focus-ring/sequence/sequence-soft/merchant-mark/badge-soft/danger-line`); 6 alias existing tokens, 2 are `rgba()` of `ink` / `excess` at .12 / .18 (no new hue). `rytm-tokens.css` unchanged | "no new colours" holds as hue; `focus-ring` / `badge-soft` are new alpha values |
| Prototype 28 → 60 views | 28 → 60 **files** in `prototype/views/` incl. `index.html` + `README.md` (26 → 58 view pages); no view removed | count is files, not views |
| Assets unchanged | `react-kit/assets` and `prototype/assets` byte-identical (`diff -rq`) | none; `sync-kit.sh` will only rewrite `brand.css` |
| 4 removed keys the app uses: `authStates.loginError`, `resetTitle`, `resetBody`, `checkInbox` | confirmed: `login.astro` (`s.loginError`), `reset.astro` (`s.resetTitle`, `s.resetBody`, `s.checkInbox`). The delivery removes 10 two-level keys in total; the other 6 (`auth.confirmEmailTitle/Body`, `auth.resetNewTitle`, `auth.resetExpired`, `dashboard.patterns`, `importFlow.overlap`) have 0 uses in `src/` — K14/K16 asked for their removal | none for the 4; the other 6 need no patch (`copy-map.md` says never re-add them) |
| `dashboard.stats` has 2 cards (app reads `stats[2]`) | confirmed: `home.astro` `stats[2].label` → `undefined` label on the „Koszty stałe” card; `stats[0]` also read in `patterns/[...key].astro` | none |
| `patterns.columns` has 7 columns (table renders 6) | 7 (new „Kwota” at index 3). Worse than "rozjechana": `PatternsTable.tsx` slices `columns.slice(0,4)` / `slice(4,6)`, so headers silently shift („Kwota” over Suma, „Suma” over Próg, „Ponad progiem” dropped) | risk is a **silent mislabel**, not a visible break |
| Templates rendered literally: `fixedCosts.new`, `trend.tooShort`, `authStates.passwordTooShort`, `resetNew.lead` | confirmed (`fixed.astro`, `home.astro`, `SignUpForm`/`NewPasswordForm`/`settings.astro`, `reset/new.astro` `r.lead`). Kit supplies `resetNew.passwordMinLength` / `authStates.passwordMinLength` = 6 | none |
| (not in roadmap) other existing keys whose value changed | 15 changed in total. Beyond the 7 above: **`components.error`** now „Nie udało się wczytać danych…” — the app also uses it as the wizard's save-failure `genericError` (`imports/new.astro`) → meaning shift; `components.info` gains `{n}` (no app use); `dashboard.description`, `patternDetail.sumLabel`, `trend.current`, `importFlow.result`, `importErrors.overlap` (unused or read from `copyExtra`); `importFlow.supported` / `importErrors.unknownFormat` now name both banks (app overrides with `copyExtra` today) | add `components.error` to the regression list |
| 55 `copyExtra` texts renamed, 90 reworded or gone | not re-measured here (needs a key-by-key diff of `copyExtra` vs the new `content.json`) | → `/10x-research`; F-04 does not migrate `copyExtra` (later slices bind per view) |
| `sync-kit.sh` syncs `brand.css`; new tokens "as Tailwind names if needed" | script works unchanged (font-path `sed` line still matches). CLAUDE.md allows only 8 Tailwind colour names | see Autonomous decision 3 |

### Kit bindings (design/rytm-os/prototype/, content.json)

F-04 binds **no new view**: it keeps existing screens working on the new kit. Views whose rendering the new keys
touch (regression check, not redesign): `views/login.html`, `views/reset.html`, `views/reset-new.html`,
`views/register.html`, `views/home.html`, `views/patterns.html`, `views/fixed.html`, `views/imports-new.html`,
`views/settings.html`.

| Key | Bound how in F-04 | Gap |
| --- | --- | --- |
| `authStates.loginError/resetTitle/resetBody/checkInbox` | intake patch (restore verbatim, K12 precedent) or move readers to round-3 equivalents — plan decides | none |
| `dashboard.stats` (2 cards) | `home.astro` reads the „Koszty stałe” card at its new index | none |
| `patterns.columns` (7) | table keeps its 6 rendered columns with correct labels; the „Kwota” column itself is K17 → S-14 | none |
| `fixedCosts.new`, `trend.tooShort`, `authStates.passwordTooShort`, `resetNew.lead` | placeholders filled (`{month}`, `{n}` from `passwordMinLength` / the trend minimum) | none |
| `components.error` | used where it still means "read failed"; wizard save-failure keeps a fitting string — plan decides | possible K-row if no round-3 key fits |
| `design-kit.md` register | `kit_round: 3`, each K11–K26 / G20 / G23–G37 item → status + adopting slice (S-12…S-15) | — |

No kit view is missing for F-04's outcome → no new `DESIGN-GAP` expected.

### Open follow-ups whose Trigger names a kit round / design-kit

| Follow-up (archive file, symbol) | Trigger | Take |
| --- | --- | --- |
| Field radius 14 px vs kit 8 px — `2026-09-27-pattern-threshold-over-limit` and `2026-09-28-durable-pattern-decisions` (`field-styles.ts` `field`/`control`, `FormField.tsx`) | "a design-kit round that names field radii" | **not fired**: round 3 names no field radius (prototype `styles.css` diff has no field `border-radius`). Stays open; S-12/S-14 touch fields and may pick it up under "next UI change to a view with a form field" |
| `Badge` tone `new` tint — `2026-09-28-fixed-cost-changes` (`Badge`, G34) | "the kit author providing a `new`/`changed` token" | **fired**: `--rytm-badge-soft` + `.badge.new,.badge.changed{background:var(--rytm-badge-soft)}`. F-04 only syncs the token; adoption in S-15 (`/fixed`) |
| G36 „Rozpoznane wydatki” / „Co wraca najczęściej” — `2026-09-28-over-limit-trend` | "the kit author defining the selection rule" | **fired (resolved by omission)**: CHANGELOG C5 omits both permanently. F-04 closes G36 in `design-kit.md`; no code change (S-15 confirms the two-card grid) |
| Focus ring duplicated — `2026-09-27-pattern-threshold-over-limit` (`field-styles.ts` `focusRing`) | "the next change that alters the focus ring or the `ink` token" | related, not fired by F-04 (sync adds `--rytm-focus-ring`, alters nothing rendered). Goes with whichever of S-12/S-14 adopts the token |
| Panel radius 20 px vs 12 px — `2026-09-28-fixed-cost-changes` (`Panel.astro`) | "a global-token pass on radii, or the next change to `Panel.astro`" | not fired (round 3 adds no radius token) |

## Autonomous decisions

1. **Next step `/10x-research`, not `/10x-plan`.** Chosen research because the `copyExtra` ↔ round-3 key map (55
   renamed / 90 reworded is unverified) and the full list of app reads of changed keys need a source-backed sweep
   before a plan. Rejected direct plan: the identity-time sweep already found one unlisted meaning shift
   (`components.error`), so the roadmap's list is incomplete. Would change: research already on disk.
2. **Scope of the intake patch: restore only keys removed AND used (the 4 `authStates`), verbatim, as in K12;
   adapt the app — not the kit — for changed shapes (`stats` index, `columns`, templates).** Rejected: patching
   `stats`/`columns`/template values back to round 2 in the kit (would revert the author's decisions and leave
   later slices binding to a kit that is not round 3). Would change: research shows a round-3 key already carries the
   same text for one of the 4 (then point the reader there instead of restoring), or the plan finds an app-side
   adaptation larger than presentation.
3. **No new Tailwind colour names in F-04.** The 8 new tokens arrive in `src/styles/brand.css` via `sync-kit.sh`;
   CLAUDE.md restricts colours to 8 Tailwind names, so exposing e.g. `badge-soft` is a rule change that belongs to the
   slice that first needs it (S-14/S-15), together with the CLAUDE.md line. Rejected: mapping all 8 now (unused
   utilities, rule change without a consumer). Would change: the plan finds an F-04 regression fix that needs one.
4. **G36 closed in F-04's `design-kit.md` update** (C5 = permanent omission), other follow-ups left to their slices.
   Would change: PRD / `[human]` S-05 7.9 answered in favour of rendering them.
