# Handoff — `kit-round-3-home-fixed` (slice S-15)

Written by the visual-gate step of autonomous run `2026-10-02-kit-round-3`. `VISUAL: PASS`; [visual] rows 2.8, 5.9, 5.10 ticked; one fix (`c9574d7`, trend value 5 px bottom margin — F5 decided). The next agent must not get wrong: only the `[human]` row 5.11 stays open — it is a maintainer checklist, not a blocker for archive/ship; no migrations.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/kit-round-3-home-fixed`, cut from `main` at `1bf6a5c` (after S-14) |
| Commits | P1 `6108b70` … P5 `ab93627`, review fix `fcc4554`, review docs `1657af6`; this step: fix `c9574d7`, screenshots `0e89f25` + `f30be8f`, + docs commit `docs(kit-round-3-home-fixed): bramka wizualna` |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `impl_reviewed` (unchanged) |
| `## Progress` rows remaining | 1 (`grep -c '^- \[ \]' plan.md`): 5.11 `[human]` |
| Working tree | clean after the docs commit |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `src/components/home/TrendChart.astro` | value `span` `mb-[5px]` (kit `.trend-value`) + header comment on nowrap vs kit wrap (`c9574d7`) |
| `context/changes/kit-round-3-home-fixed/screenshots/*.png` | 72 PNGs: 22 app states × 1280/400 + 14 kit frames × 2 |
| `context/changes/kit-round-3-home-fixed/screenshots/README.md` | state table, accounts, data, how each state was reached |
| `context/changes/kit-round-3-home-fixed/reviews/visual-review.md` | verdicts, hand-checked numbers, F5 verdict, observations, `VISUAL:` line |
| `context/changes/kit-round-3-home-fixed/follow-ups/review-fixes.md` | + auth visual heading weight follow-up (`Trigger:`) |
| `context/changes/kit-round-3-home-fixed/plan.md` | rows 2.8, 5.9, 5.10 ticked |

## 3. Verification

Observed in this step after `c9574d7`; baseline `main` 1bf6a5c (after S-14).

| Command | Result |
| --- | --- |
| `npm run lint` | 0 errors (baseline 0) |
| `npx astro check` | 0 errors, 0 warnings, 3 hints, 166 files (baseline 162, +4 from the slice, Δ0 from this fix) |
| `npm test` | 387 passed / 27 files (baseline 375 / 26, +12 / +1; Δ0 from this fix) |
| `npm run build` | OK |
| `npx supabase db reset` → smoke on :4398 | 195 PASS / 0 FAIL, „All smoke steps passed” (baseline 192, +3; Δ0 from this fix) |
| Visual gate | 44 app PNGs + 28 kit PNGs, 0 NOT CAPTURED; every app shot `scrollWidth` = viewport, no `undefined` / `{…}`; value→bar gap measured 5 px at 1280 and 400 after the fix |
| Hand-check | trend sie 26 = 244,18 + 304,41 = 548,59 zł (STACJA PALIW, count threshold 3, fixture rows); Podrożały 1 / Nowe 1 on the two-month account |
| Read-error states | `revoke select on public.transactions from authenticated` → 3 shots → `npx supabase db reset` immediately; second `db reset` after smoke |
| pgTAP | not re-run (no schema or SQL change in this step; last run Files=6, Tests=119 PASS in impl review) |
| Dev servers | :4398 and :4399 killed (`lsof` empty); :4321 untouched |

## 4. Next command

`/10x-archive kit-round-3-home-fixed then ship (no migrations)`

## 5. Open

- [ ] 5.11 `[human]` accept S-15 product-visible choices (removed `/home` total and `ImportPanel`, rises-only „Podrożały”, one-offs in „Nowe”, chip text `trend.noThreshold`, bar min 8 %, conditional zero note, one `/fixed` message without comparison, „kosztów”) and send K38–K41, G39 to the kit author.
- Follow-ups: `context/changes/kit-round-3-home-fixed/follow-ups/review-fixes.md` — new: `AuthLayout.astro` visual title weight (kit `.auth-copy h1` bold), `Trigger:` next slice touching `AuthLayout.astro`.
- Observations (no code): app-wide `paper-soft` for both page and `InfoPanel` (kit `#edf0ef` vs `#e8ecea`); „Import gotowy.” full stop from `content.json`; F4 `Badge.tsx` header comment; F7 nav reaches the wizard through `/imports`.
- Carried risk: `/home` and `/fixed` have no render test (`plan.md` § Known risks); the visual gate covers them once.
- No `DESIGN-GAP` added in this step.

## 6. Autonomous decisions

1. **F5: kept `whitespace-nowrap`, adopted kit `margin-bottom:5px`.** Rejected: kit's ≤ 560 px `white-space:normal` (the app's axis scrolls; values never collide — min gap 21 px at 400 px — and the kit's wrap makes two-line values that overlap the range label). Would change: a kit round that drops the scrolling axis, or values clipping at a narrower width.
2. **Read errors reached by revoking a grant, then `db reset` at once.** Rejected: transaction rollback (a dev-server request runs on its own connection and cannot see an uncommitted revoke). Would change: an app-level fault-injection path.
3. **Keyboard path proven in Playwright, not Chrome.** The extension's `Tab` key events did not reach the page (`keydown` listener logged nothing); Chrome kept as headed render cross-check. Would change: an extension that delivers key events — then repeat the focus check headed.
4. **Small two-month accounts via `POST /api/imports` (smoke payload format, `Origin` header) instead of the wizard.** Why: the ING fixture cannot produce one-month / no-changes / no-new states; the endpoint is the wizard's own submit target. Would change: fixtures for those states.
5. **Auth visual heading weight filed, not fixed.** Why: pre-existing on `main`, shared by every auth page; S-15 only changed the prop source. Would change: the maintainer wanting it in this slice.
6. **Ticked 2.8, 5.9, 5.10.** Each listed state captured at both widths and compared. Would change: a state found missing from the plan list.
