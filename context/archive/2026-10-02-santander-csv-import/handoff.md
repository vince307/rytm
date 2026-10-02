# Handoff — `santander-csv-import` (slice S-10)

The visual gate step of autonomous run `2026-10-01-m2-santander` captured all 13 imports states named by Progress
rows 5.6 and 6.6. Each was taken at 1440 px and 400 px through the real wizard with synthetic fixtures, against
the 6 kit frames. It found no discrepancy, changed no code, and ticked 5.6 and 6.6. **Verdict `VISUAL: PASS`.**
The next agent must not get this wrong: the branch adds migration `20261002120000_import_statement_source.sql`.
The CI `deploy` job applies it after merge. Nobody runs `db push` by hand, and until then a PR preview cannot
import (do not "fix" it).

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/santander-csv-import`, cut from `main` at `1fed366` |
| Commits | 25 on top of `1fed366` (`1fed366..HEAD`); this step: one docs commit `docs(santander-csv-import): bramka wizualna`, no fix commit |
| Pushed / PR / merged | PR/CI/merge/deploy recorded in `context/runs/2026-10-01-m2-santander/run-log.md` (ship step: archive → push → PR → CI → merge; the CI `deploy` job applies the migration) |
| `change.md` status | `archived` (ship step, `/10x-archive`; folder moved to `context/archive/2026-10-02-santander-csv-import/`) |
| `## Progress` rows remaining | 4 (`grep -c '^- \[ \]' plan.md`): 6.8–6.11 `[human]` |
| Working tree | clean after the docs commit (`tree-clean.sh` → `CLEAN`) |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `context/changes/santander-csv-import/reviews/visual-review.md` | Visual review: capture method, 13 state verdicts, hand-checked number, keyboard path, observations; ends with `VISUAL: PASS — …` |
| `context/changes/santander-csv-import/screenshots/*.png` | 38 PNGs: 13 app states × desktop/mobile + 6 kit frames (`kit-imports*`) × desktop/mobile |
| `context/changes/santander-csv-import/screenshots/README.md` | State table (state · desktop · mobile · what is visible · kit), accounts, data, measurements |
| `context/changes/santander-csv-import/plan.md` | `## Progress` 5.6 and 6.6 ticked `— visual gate (1440 + 400 px, screenshots/)`; no Phase text touched |
| `context/changes/santander-csv-import/handoff.md` | This file |

## 3. Verification

Baseline (contract, `main` `1fed366`): lint 0; astro check 0 (137 files); fixture:check OK; vitest 256/15 files;
build OK; pgTAP Files=5 Tests=102 PASS; smoke 140/0.

| Command | Result (observed in this step) |
| --- | --- |
| `git branch --show-current` | `feat/santander-csv-import` |
| Playwright capture (system Chrome, outside the repo) on `astro dev :4399` | 38 OK / 0 NOT CAPTURED; `scrollWidth` = viewport (1440/400) in all 26 app shots |
| Claude-in-Chrome (inherited browser, own tab, closed) | Signed in, `file_upload` of the Santander fixture, step 1 chip "rozpoznano format Santander" rendered in headed Chrome; extension `Tab` keys did not move focus → keyboard path done in Playwright |
| Keyboard path (Playwright) | Step 2/3 focus → `h1`; step 3 Tab → Wstecz before the import button; delete dialog opens with focus on the container, Esc returns focus to "Usuń import"; no dialog confirmed, no `alert`/`confirm` |
| Hand-checked number | `expected.json` 187 rows − 3 credits = 184, Σ = 1342109 gr = 13 421,09 zł; screen 184 (steps 3 + result); local DB for both visual accounts `count 184`, `sum 1342109` |
| `npm run lint` | 0 errors (baseline 0, Δ0) |
| `npm test` | 291 passed, 18 files (baseline 256/15, +35; unchanged vs impl-review) |
| `astro check`, `fixture:check`, build, pgTAP, smoke | Not re-run: this step changed no code (docs and PNGs only); last observed by impl-review in `1452729`, inherited, unverified here |
| `npx supabase db reset` (sandbox disabled) | Done after the gate; 0 `visual-%` accounts left |
| Ports | `:4399` dev server killed; `lsof -ti :4398 -ti :4399` empty; `:4321` untouched |
| Deliberate break | None: no code changed, so there was no new protection to prove |

## 4. Next command

`none — shipped`. Open [human] rows 6.8–6.11 are the owner's post-run checklist (§5), listed in the PR under „Do decyzji właściciela produktu”; they do not block the archive. Next slice: S-11 `santander-card-merchants` (`/10x-new`).

## 5. Open

- **[human] checklist:** 6.8 owner imports their real Santander PLN export locally (count/range match); 6.9 accept
  the rule-7 deviation (Lp not stored); 6.10 accept K26 wording incl. "Rachunek"; 6.11 accept that S-11 re-keys
  Santander card patterns.
- **Carried risks:** PR preview cannot import until merge (production DB has no `import_statement` yet; no fallback,
  per review F5 / plan-review F2). After a `vercel rollback`, Santander imports read "ING · Rachunek". R1 is guarded
  only by the hand-run shape metric. Santander `title` keeps the masked card number (own data, RLS).
- **Visual observations (not blocking):** at 400 px the `/imports` table scrolls inside its panel. This predates the
  slice: the `overflow-auto` wrapper in `src/pages/imports/index.astro` is unchanged, and the kit frame overflows
  the page. The Santander list label has no account tail (row 6.10). The result h1/pattern stats are absent (G26,
  pre-existing).
- **Restated for S-11 (Trigger: S-11):** F4 `banks.ts` `accountLabel` → `replace("{name}", () => name)`; row 6.11 re-keying of Santander card patterns (saved thresholds/decisions keyed by `merchant_key`); restated in roadmap `## Backlog Handoff` row S-11.
- **Earlier observations still open:** F3 (`import_statement.test.sql` anon call assert proves table grants); F4
  (`banks.ts` `accountLabel` string replacement expands `$&`; switch to `() => name` when S-11 touches the file).
- **Follow-ups:** none new; no `follow-ups/review-fixes.md`.
- **DESIGN-GAP:** none added (K26, G25, G26, G27 already cover every state captured).
- **ARTIFACT GAP:** none.

## 6. Autonomous decisions

1. **PNGs from Playwright, Claude-in-Chrome for a headed spot check.**
   - Chosen: Playwright headless system Chrome for the 38 PNGs; Claude-in-Chrome for one real-browser upload of the Santander fixture.
   - Rejected: Chrome-only capture.
   - Why: Chrome screenshots are not written to the repo, and 26 multi-step states need scripted, repeatable navigation (same split as the S-06/S-07 gates).
   - What would change it: a Chrome tool that saves PNGs into the repo.
2. **Keyboard path measured in Playwright, not in Claude-in-Chrome.**
   - Chosen: Playwright `keyboard.press` with `document.activeElement` / `:focus-visible` read after every key.
   - Rejected: Chrome extension `key` actions.
   - Why: the extension's `Tab` presses (14×, twice, after clicking the page) left focus on `BODY`, so they proved nothing.
   - What would change it: an extension build whose key events move focus.
3. **Desktop at 1440 px rather than 1280 px.**
   - Chosen: 1440×900, the gate script's default.
   - Rejected: a second 1280 capture.
   - Why: the brief allows 1280–1440; the layouts are fluid with `max-w` panels, and the 899 px breakpoint lies below both widths.
   - What would change it: a breakpoint between 1280 and 1440 in these views.
4. **No re-run of astro check, build, pgTAP or smoke.**
   - Chosen: lint + vitest only, as a sanity check.
   - Rejected: the full gate.
   - Why: the brief requires the full gate after fixes, and none were made; the diff of this step is docs and PNGs.
   - What would change it: any source change in this step.
5. **`db reset` after the gate.**
   - Chosen: reset.
   - Rejected: leaving the two visual accounts.
   - Why: the accounts and imports were written outside a transaction (through the product); the reset keeps the next step's pgTAP and smoke clean.
   - What would change it: nothing; it is cheap and it is the contract rule.
6. **Archive despite 4 open `[human]` rows (6.8–6.11).**
   - Chosen: `/10x-archive` "Continue archiving" (the skill recommends it when only manual rows are pending).
   - Rejected: "Resume implementation" / waiting for the owner.
   - Why: no automated row is open, impl-review covers phases 1–6 with `MERGE: CLEAR`, the visual gate is `PASS`; the four rows are owner acceptances (real-export import, rule-7 deviation, K26 wording, S-11 re-keying) that cannot be done by an agent and are listed in the PR as „Do decyzji właściciela produktu”. Every Progress SHA is an ancestor of the branch and the merge is `--merge` (no squash), so no SHA repointing.
   - What would change it: an open automated row, a CRITICAL finding, or a squash merge policy.
