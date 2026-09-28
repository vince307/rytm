---
change_id: durable-pattern-decisions
title: Trwałe decyzje o wzorcach — scalenie, wykluczenie, typ, nazwa (S-05)
status: planned
created: 2026-09-28
updated: 2026-09-28
archived_at: null
---

## Notes

Trwałe decyzje o wzorcach (roadmap S-05).

Outcome (roadmap `### S-05`): użytkownik może scalić dwa wzorce w jeden, wykluczyć wzorzec z analizy, zmienić jego typ
(stały/częsty) i nazwę sprzedawcy; decyzje są stosowane automatycznie do kolejnych importów, a wykluczony wzorzec nie
generuje „ponad próg”. PRD: FR-009 (decyzje = trwałe reguły mapowania, nie jednorazowe edycje; wchłonięte FR-015
rename), US-03 (dwa warianty jednego sprzedawcy scalone i nazwane, przelew własny wykluczony, typ częsty → stały, potem
import kwiecień–czerwiec: nowe transakcje trafiają do scalonego wzorca, wykluczenie i typ bez ponownej edycji), AC:
„po scaleniu każda transakcja liczy się raz; liczba i suma scalonego = suma składników”, „wykluczony wzorzec nie
generuje «ponad próg» i nie wchodzi do sumy miesięcznej”; PRD założenie z 2026-09-18 i US-02 AC: decyzje (jak progi)
przetrwają usunięcie importu — przypisane do sprzedawcy, nie do importu.

### Roadmap claims checked against the repo at `main` `f252112` (2026-09-28, after S-03, S-02, S-04 shipped)

| Roadmap claim (plan-time) | Repo now | Correction |
|---|---|---|
| Prerequisite: S-03 (only) | S-03 shipped; **S-04 also shipped** (archive `2026-09-27-pattern-threshold-over-limit`): detail route `src/pages/patterns/[...key].astro`, `pattern_thresholds` table (`20260927200000_pattern_thresholds.sql`), `listOverview` / `patternDetail` in `src/lib/patterns/view.ts`, `overLimit` / `appliesTo` in `src/lib/patterns/over-limit.ts` | S-05 builds on **S-04 too**: the kit puts „Akcje” on the detail (`.detail-actions`), and exclusion / type change must act on S-04's over-limit path. Not a blocker — both done |
| „scalić dwa wzorce w jeden” | No merge anywhere. Patterns are **derived on read**, no pattern table: `loadPatterns` (`src/lib/patterns/load.ts`, keyset paging) → `derivePatterns` (`src/lib/patterns/derive.ts`) groups by `merchantKey` (`src/lib/patterns/merchant.ts`); identity = `merchantKey` | a merge is a stored rule `merchant_key → target key` applied **inside/before** `derivePatterns` grouping (count, sum, D5 type, median recomputed on the union — AC „każda transakcja liczy się raz”). Open: which key survives (target's), what happens to the absorbed key's threshold, chains (A→B, B→C), merging into an excluded pattern |
| F-02 fixture as oracle | `test/fixtures/ing/expected.json` already carries the S-05 answers: pattern `sportowo` `resolvedBy: "user-merge"` (trap T01, two raw merchants, 8 occ., 1 316,28 zł) and `przelew-konto-osobiste` `resolvedBy: "user-exclude"` (T08, fixed, 12 occ.). `test/unit/patterns.test.ts` `expectedGroups` currently **splits `user-merge` back** by raw merchant (31 groups) | S-05 gets a ready acceptance oracle: with the merge decision applied the partition must equal the oracle's 30 groups; exclusion drops T08 from over-limit. No fixture change expected |
| „wykluczyć wzorzec z analizy” | Nothing. `listOverview` / `patternDetail` compute over-limit for every pattern with an applicable threshold | exclusion must zero the pattern in `overLimit` consumers and move it out of the main list into the kit's collapsible „Wykluczone” section (`PatternsTable.tsx` still carries `DESIGN-GAP: G28` for it). „nie wchodzi do sumy miesięcznej”: no monthly over-limit total exists yet outside the detail header (the `/home` stat is still `EmptyState`) — the rule must live in the shared view/over-limit layer so S-07 inherits it |
| „zmienić typ” | Type is `d5Type(amounts)` per read. S-04 decision 3: a threshold row applies only when its `kind` matches the current type (`appliesTo`); a mismatch renders „brak ustawionego progu”. S-04 recorded „Would change: S-05 user-pinned types requiring an explicit reset” | a user-pinned type overrides D5 for good (survives imports that would flip it). Plan must decide the threshold consequence of a user type change (keep row and let `appliesTo` hide it — S-04 behaviour — vs delete/reset). `fixedAmountMinor` for a pinned-fixed pattern whose amounts are out of tolerance must be defined (median as today?) |
| „zmienić nazwę sprzedawcy” | Display `name` = most frequent normalized variant (`derivePatterns`); key is the lower-cased normalized name; routes link by `encodeURIComponent(key)` | rename is a **display override only** — the key (and so thresholds, links, merges) must not change. Open: empty/whitespace name, length cap (same 500-char class as S-04 F4), name colliding with another pattern's name |
| „decyzje stosowane automatycznie do kolejnych importów” | Holds almost for free: patterns re-derive on every read, so a decision keyed on `(user_id, merchant_key)` (never `import_id` — S-02 invariant) applies to any later import. **But** the fixture has one importable file (`…010926.csv`; the other three are rejects — overlap, no-header, currency), so „import kwiecień–czerwiec” cannot be replayed with a second non-overlapping file | prove durability by (a) undo-import + re-import of the fixture (S-02) and (b) the second account in the same file (`Rachunek VAT`, 12 rows) or a unit test that derives with decisions over a split row set. Research picks the proof; no new fixture file unless research shows none of these proves US-03 |
| „wykluczony wzorzec nie generuje „ponad próg”” | `overLimit` has no exclusion input; thresholds of an excluded pattern stay in `pattern_thresholds` | exclusion check at the view layer (`listOverview`, `patternDetail`) — keep the threshold row (restore brings it back) is the likely rule; plan decides |
| Parallel with S-04, S-06, S-07, S-09 | S-04 done. S-06 (fixed-cost changes) and S-07 (over-limit trend) come **after** S-05 in this run and both read type + exclusion | holds; S-05 must expose the decided type / excluded flag through the shared derive/view layer (not per page) so S-06 and S-07 pick it up without re-implementing it |
| Unknowns: — | Several product/UX choices the kit does not answer: undo of a merge (kit modal text „Możesz je później odwrócić w ustawieniach wzorca” — no such settings UI), undo of a type pin, merge target picker, threshold fate on merge/type change | **open unknowns** for research/plan (see Design kit binding gaps) |
| Risk: decisions as durable mapping rules | Holds. Added risk from S-04 Known risks: normalizer drift (`normalizeMerchant` rule change) re-keys merchants and orphans stored rows — now two tables of them | carry as Known risk; `merchant.ts` header already warns „Rule order … is load-bearing” |

### Migration

**Yes.** Decisions must persist per user, keyed on the merchant, and survive import deletion. Expected (shape fixed
in plan): new table(s) with `user_id uuid not null default auth.uid() references auth.users(id) on delete cascade`,
`merchant_key text not null` (1–500 chars, same as `pattern_thresholds`), the decision columns — merge target key,
`excluded`, pinned type (`fixed` | `frequent`), display name — `unique (user_id, merchant_key)`, **no** `import_id`,
RLS enabled with granular per-operation (`select`/`insert`/`update`/`delete`) policies for `authenticated`, grants
like `pattern_thresholds` (keep UPDATE for upserts, revoke `truncate, trigger, references, maintain`, revoke all from
`anon`). pgTAP proof in `supabase/tests/database/` (RLS isolation, cascade on account delete, survival of import
delete, constraints incl. self-merge), then `npm run db:types`; `npx supabase db push` before merge (ship step).
One table vs one-per-decision is a plan choice (see Autonomous decisions).

### Design kit binding

Views (`design/rytm-os/prototype/`, rendered by `app.js`; `views/*.html` are shells):

- `views/pattern-wolt.html` → `app.js` `patternDetail(id)`: the `.detail-top` `.detail-actions` button
  „Akcje” (`icon('more')`, `btn-ghost`) → `modal('patternActions')`: eyebrow „Akcje na wzorcu”, h2 „Zarządzaj
  wzorcem.”, lead „Decyzje dotyczą wszystkich kolejnych miesięcy. Możesz je później odwrócić w ustawieniach
  wzorca.”, `.modal-actions` with four `btn-ghost` buttons (icons `merge`, `switch`, `edit`, `exclude`). And
  `applyPatternState('#/patterns/excluded-coffee')`: `.inline-alert.info.excluded-banner` „Wykluczony z analizy” +
  `text-button` „Przywróć”. **Primary view of this slice.**
- `views/patterns.html` → `patterns()`: `.excluded-section` / `.excluded-toggle` („Wykluczone” + count) /
  `.excluded-list` with `.list-item` (merchant mark, name, meta „Wykluczony z analizy”, `text-button` „Przywróć”),
  `restorePattern()` (meta „Przywrócony do analizy” + `badge('przywrócony','new')`, toast). Secondary: lifts the
  `DESIGN-GAP: G28` excluded-section omission in `PatternsTable.tsx`; the list row shows the decided name/type.
- `views/components.html` — reference only: `badge('wykluczony','excluded')`, `modal` via „Otwórz dialog”.
- Styles: `prototype/styles.css` `.excluded-*`, `.excluded-banner`, `.modal*`, `.modal-actions`, `.detail-actions`
  (mobile: full-width). Icons `merge`/`switch`/`edit`/`exclude`/`more` exist in `public/rytm/icons/ui/ui.svg`.
- Not bound (other slices): `nowy` / `zmiana kwoty` badges (S-06), „Pokaż więcej” (stays G28), `/home` stats and
  trend (S-07).

Keys (`design/rytm-os/react-kit/docs/content.json`, via `copy` in `src/content/copy.ts`):

- `patternActions.merge` „Scal z…”, `.changeType` „Zmień typ”, `.rename` „Zmień nazwę”, `.exclude` „Wyklucz z
  analizy”, `.restore` „Przywróć”, `.excluded` „Wykluczony z analizy”, `.restored` „Wzorzec przywrócony do analizy.”
  (the first four were restored verbatim at intake — K12).
- `components.excluded` „wykluczony” (badge).
- `patterns.description` „Każdy sprzedawca ma jeden typ. Możesz zmienić go w dowolnym momencie.” (already rendered).
- Existing, reused: `copyExtra.patterns.typeLabels` (K11), `patternDetail.back`.

DESIGN-GAPs expected (register in `context/foundation/design-kit.md` when the plan fixes what renders; never invent).
Note: **G4 is marked „delivered · 4 akcje + dialog” but the prototype's four buttons only fire toasts** — „Tryb
scalania jest gotowy do podpięcia.” / „Możesz zmienić nazwę inline.” — so the flows behind them are gaps:

- **Merge target picker** — no dialog/list to choose the second pattern (G4 row claims one; prototype has none).
- **Inline rename** — no input, save/cancel, validation or error state.
- **Type change** — no confirmation, no statement of what happens to an existing threshold; the kit toast
  „Typ wzorca zmieniony.” is only in `app.js` (K11-class, `copyExtra`).
- **Exclude confirmation / result** — toast „Wzorzec wykluczony z analizy.” only in `app.js` (K11-class).
- **Modal strings only in `app.js`**: eyebrow „Akcje na wzorcu”, h2 „Zarządzaj wzorcem.”, lead, button „Akcje”;
  excluded-section toggle „Wykluczone” + „N wzorzec/wzorce/wzorców”; badge „przywrócony” (K11-class).
- **Undo of merge / type pin / rename** — the modal lead promises reversal „w ustawieniach wzorca”; no such UI.
  Only exclude has a restore path in the kit.
- **Pending / error states** of every decision POST (same class as G30/G31).
- **Merged pattern on the detail** — kit shows one raw-description list; nothing marks which variants were merged.

### Open follow-ups whose trigger names this slice (or fires on it)

| Follow-up | Source | Take |
|---|---|---|
| S-04 **F5** — `loadThresholds` has no paging; **Trigger: „S-05 adding its own per-merchant table (reuse the paging there)”** | `context/archive/2026-09-27-pattern-threshold-over-limit/follow-ups/review-fixes.md` | **In scope.** The decisions read is a second unpaged per-merchant read of the same class; page both through `collectPages` (keyset on `id`) in one phase — cheap, and it closes F5 |
| Invariant: persisted decisions/thresholds key on `merchantKey` + `user_id`, never `import_id` („Invariant for S-04/S-05”) | `context/archive/2026-09-25-undo-import/follow-ups/review-fixes.md` | **Binding** on the migration |
| Shared dialog geometry vs kit `.modal` (`src/components/ui/dialog.tsx` `DialogContent`, G24) + S-01 F9 shared close icon; **Trigger: „next change that touches a dialog”** | same undo-import file | **Fires if S-05 adds the `patternActions` dialog (it should — kit binds a modal).** Take: fix `DialogContent` geometry to the kit (480 px / 31 px / 13 px radius, 20 px backdrop margin) only if the plan accepts re-screenshotting `/settings` `DeleteAccountDialog` and `/imports` `DeleteImportDialog`; otherwise a slice-local wrapper is *accidental architecture* — prefer the shared fix, decided in plan |
| undo-import **F4** — dialog `pending` not reset on bfcache restore; Trigger: user report or the dialog change above | same undo-import file | Rides with the dialog decision: if the shared dialog is touched, add the `pageshow` reset there; new S-05 dialogs must not repeat the bug |
| S-04 **F11** — app-wide `rounded-lg` (14 px) vs kit 8 px fields; **Trigger: „next UI change to a view with a form field”** | S-04 follow-ups | **Fires** (rename input, merge picker). Take: new S-05 fields follow kit 8 px locally like `ThresholdEditor`; the app-wide field-radius sweep stays its own change (one view + global tokens) unless research shows a token change touches only `field-styles.ts` |
| S-04 **F4** — key > 500 chars / invalid form lands silently on `/patterns` | S-04 follow-ups | Not triggered, but S-05 adds POST routes with the same key cap — they must not copy the silent redirect (parse key first, redirect back to the detail with an error state) |
| undo-import **F3** — CSRF relies on `security.checkOrigin` | undo-import follow-ups | Applies as a rule to the new decision POSTs; no work |
| S-04 F3 (focus ring), F8 (threshold bfcache); S-03 F3/F5/F6/F7; S-01 F8/F9 | various | Do not name S-05. S-03 F5/F6 sit in `src/pages/patterns.astro`, which S-05 touches — fold only if trivial |

Next: `/10x-research durable-pattern-decisions` — decision storage shape and where decisions enter derivation, merge
semantics (surviving key, thresholds, chains, undo), type-pin vs S-04 `appliesTo`, the US-03 durability proof with a
single importable fixture file, and the dialog/field follow-up scope need grounding before a plan.

## Autonomous decisions

Made by the `new` step of run `2026-09-28-s05-s06-s07` in place of asking a human.

- **Did not STOP after `change.md`** (the 10x-new skill says display the next step and wait). Chosen: continue to
  handoff and commit. Rejected: waiting. Why: no human in the loop (agent contract, rule 1). Would change: a
  maintainer message pausing the run.
- **Next step = `/10x-research`, not the skill's default `/10x-plan`.** Why: merge semantics, type-pin interaction
  with S-04 thresholds, derivation hook point and the durability proof all need code/fixture grounding; the
  orchestrator named it. Rejected `/10x-frame`: FR-009 framing is not suspect (the PRD already argued it). Would
  change: research already on disk.
- **Migration = yes; table shape left to plan**, with a lean toward **one `pattern_decisions` table keyed
  `(user_id, merchant_key)`** holding nullable merge target / pinned type / display name and an `excluded` flag.
  Rejected (for now): four tables (four reads, four RLS sets for one identity); folding decisions into
  `pattern_thresholds` (S-04 deliberately kept thresholds separate; mixing mutable decision columns into a table whose
  row existence means „a threshold is set” breaks `loadThresholds`). Why: one identity per merchant, one paged read.
  Would change: research showing merge needs a many-to-one alias table distinct from per-pattern attributes (then two
  tables: aliases + attributes).
- **Primary view = pattern detail (actions menu + excluded banner); `/patterns` changes only for the excluded section
  and decided name/type.** Rejected: a separate „ustawienia wzorca” screen (kit has none) and `/home`. Why: one view +
  global tokens; the kit puts every action on the detail. Would change: the plan finding that merge needs a picker on
  the list (kit gives no picker either way).
- **G4 treated as partially delivered** (menu + exclude/restore yes; merge picker, inline rename, type-change confirm
  no) and listed as candidate gaps, not registered yet. Why: ids are assigned when the plan fixes what renders (same as
  S-03/S-04 `new`). Would change: the contract requiring gap rows at `new`.
- **Dialog-geometry follow-up recorded as fired but its scope (shared fix vs local) left to plan.** Why: it is
  cross-view (touches `/settings`, `/imports`) — the plan must weigh one-view discipline against accidental
  architecture. Would change: the maintainer accepting the cross-view fix outright (then shared).
- **Title in Polish**, matching the repo's log and earlier slices. Would change: a maintainer preference for English.
