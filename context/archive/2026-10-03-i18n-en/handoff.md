# Handoff — `i18n-en` (slice S-16)

Written by the archive + ship step of run `2026-10-03-i18n-en` (final pre-merge state; earlier: visual gate `VISUAL: PASS`, no code changed). Archived with `[human]` 7.10 open — it is the maintainer's post-run checklist, listed in the PR under „Do decyzji właściciela produktu”, not a blocker.

## 1. State

| Item                         | Value                                                                                                                                 |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Branch                       | `feat/i18n-en`, cut from `main` at `b973428`                                                                                          |
| Commits                      | docs + p1 `ace542d` … p7 `ce7a1f0` + fix `1dbab76` + impl-review docs `15707b7` + this docs commit (`docs(i18n-en): bramka wizualna`) |
| Pushed / PR / merged         | PR/CI/merge/deploy recorded in context/runs/2026-10-03-i18n-en/run-log.md                                                             |
| `change.md` status           | `archived` (`chore(archive): close i18n-en`)                                                                                          |
| `## Progress` rows remaining | 1 (`grep -c '^- \[ \]' plan.md`): `[human]` 7.10                                                                                      |
| Working tree                 | clean per `tree-clean.sh` after the commit (allow-listed `?? design/prompts/2026-10-03-gaps-round-4.md` untouched)                    |

## 2. Artifacts

| Path                                               | What it is                                                                                             |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `context/changes/i18n-en/screenshots/*.png`        | 89 PNGs: 75 app (29 EN + 8 PL states × 1440/400, `en-patterns-one-month` desktop only) + 14 kit frames |
| `context/changes/i18n-en/screenshots/README.md`    | state · file · how reached, accounts and data                                                          |
| `context/changes/i18n-en/reviews/visual-review.md` | gate report, ends `VISUAL: PASS — …`                                                                   |
| `context/changes/i18n-en/plan.md`                  | rows 6.8, 7.8, 7.9 ticked                                                                              |
| `context/changes/i18n-en/handoff.md`               | this file                                                                                              |

## 3. Verification

Baseline (contract, `d2b8d49`): lint 0; astro check 0 (166 files); fixture OK; vitest 387; build OK; pgTAP 6/119; smoke 195. No code changed in this step, so the suites were not re-run; the impl-review step's observed results stand (vitest 434 = +47, smoke 205 = +10, pgTAP Δ0).

| Check                                                            | Result                                                                                                                                               |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 75 app PNGs, Playwright on `:4399`                               | 0 NOT CAPTURED; `scrollWidth` = viewport in all; no `undefined`/`NaN`/unfilled `{…}`; every page `lang` matches the cookie                           |
| Console on every EN and PL page                                  | 0 errors, 0 warnings, 0 page errors (incl. `PatternsTable`, `ImportWizard`) — no hydration mismatch                                                  |
| Switch in footer `/`, auth corner `/login`, `/settings`          | keyboard focus `:focus-visible` with ring; Enter → other locale on the same path; mouse click back → start locale on the same path (18/18 checks OK) |
| EN `/home` with ING fixture + limit 3 on STACJA PALIW DROGOWSKAZ | lead „Your August in one calm view.”; `548.59 zł` = 244.18 + 304.41                                                                                  |
| EN one-month account                                             | „Your May in one calm view.”; `52.99 zł` from `amountMinor` 5299                                                                                     |
| Delete dialog EN                                                 | initial focus on „Current password”; `DELETE` + password enables the button; never submitted                                                         |
| PL text vs `main` b973428 (`:4398`, same data)                   | only `PL`/`EN` and `Język / Language` added; nothing removed on `/`, `/login`, `/home`, `/patterns`, `/fixed`, `/imports`, `/settings`               |
| Claude-in-Chrome headed                                          | `pl-PL` browser → PL first visit; click EN → `/login` EN; PL restored → `/login` PL; tab closed                                                      |
| Cleanup                                                          | `:4398`/`:4399` killed, `:4321` untouched; `npx supabase db reset` at the end                                                                        |

## 4. Next command

`none — shipped`

## 5. Open

- Manual row (human checklist): `[ ]` 7.10 `[human]` accept S-16 product choices (own EN translation K42, switch design K43 with bilingual „Język / Language”, `USUŃ` or `DELETE`, `Accept-Language` first visit, parity test instead of compile error for lengths/placeholders, default Supabase e-mails) and send K42–K43 to the kit author.
- Follow-ups `context/changes/i18n-en/follow-ups/review-fixes.md`: F2 `Vary`/`Cache-Control` in `src/middleware.ts` `onRequest`; F3 EN default account names in DB; F4 "e-mail"/"email" — hydration trigger did not fire in this gate; plus p7 items (PanelTitle, S-14 F7, E2E setup, EN copy replacement, K42-K44 to the kit author).
- DESIGN-GAPs: K42, K43, K44 (`design-kit.md`, `open · S-16`); none added here.
- Observations (visual-review): shared `focusRing` low contrast (app-wide); tables scroll inside panels at 400 px in both locales (pre-existing).
- The maintainer's Chrome now holds `rytm-locale=pl` for `localhost` (cookies ignore ports, so `:4321` sees it too) — same language its `pl-PL` gives; clear it to retest the first-visit rule there.
- Roadmap S-16 `done` (At a glance, `### S-16`, `## Done`, Backlog Handoff row refreshed with the open follow-up triggers). No migration.

## 6. Autonomous decisions

1. **Playwright for the PNG set, Chrome as headed cross-check.** Rejected: Chrome-only. Why: 37 states × 2 widths, a 400 px viewport and keyboard modality need a scripted browser (the extension missed one of two clicks and cannot go below ~587 px). Would change: an extension that sends key events and narrow viewports reliably.
2. **1440 px desktop, not the plan's 1280.** Why: the step brief and `visual-capture.mjs` default say 1440; nothing at 1280 is a different breakpoint. Would change: a layout breakpoint between 1280 and 1440.
3. **PL "byte-for-byte" proven by a rendered-text diff against `main` on `:4398`** (from `git archive`, outside the repo, no worktree). Rejected: eyeballing screenshots. Why: catches any one-word copy change. Would change: nothing; line-set diff misses pure reordering — none expected from a dictionary swap.
4. **One-month account seeded with `POST /api/imports`** (the smoke path) instead of a one-month CSV. Why: the fixture spans 12 months; there is no one-month CSV. Would change: a one-month fixture file.
5. **`/reset/new` form reached through the real recovery mail (Mailpit)**, password not changed. Would change: nothing.
6. **Overlap shot taken without reload.** The overlap check is client-side on step 3, so a reload would lose it. Would change: a server-side overlap URL state.
7. **Chrome left on `rytm-locale=pl`** rather than deleting the cookie. Why: the extension blocks `document.cookie`; PL matches the browser's language. Would change: the maintainer wanting no cookie.
8. **Archive despite one pending `[human]` row (7.10) and 7 SHA-less `[reviewer]`/`[visual]` rows.** Rejected: waiting for the maintainer. Why: the pending row is manual-only (archive recommends continuing), the SHA-less rows are review/visual checks with no diff, every recorded SHA is an ancestor of the branch and `gh pr merge --merge` keeps them — no repoint. Would change: an automated row still open, or a squash merge.
