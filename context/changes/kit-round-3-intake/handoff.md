# Handoff — `kit-round-3-intake` (slice F-04)

Written by the `/10x-impl-review kit-round-3-intake` step: review APPROVED, `MERGE: CLEAR`, 2 warnings + 3 observations fixed in `d279eef`, `change.md` status `impl_reviewed`. Next is the visual gate (row 3.6) — never run prettier on `design/` or `src/styles/brand.css`.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/kit-round-3-intake`, cut from `main` at `577b163` (+ roadmap commit `78386c1`) |
| Commits this step | `d279eef` `fix(kit-round-3-intake): poprawki z przeglądu implementacji` + the `docs(kit-round-3-intake): przegląd implementacji` commit |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `impl_reviewed` |
| `## Progress` rows remaining | 2 (`grep -c '^- \[ \]' plan.md`): 3.6 `[visual]`, 3.8 `[human]` |
| Working tree | clean after the docs commit |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `context/changes/kit-round-3-intake/reviews/impl-review.md` | review report (F1–F7, evidence table, `MERGE: CLEAR`) |
| `context/changes/kit-round-3-intake/follow-ups/review-fixes.md` | S-14 entry: kit column order corrected (Kwota before Suma); new entry „Prettier must not reformat the kit” with `Trigger:` |
| `src/content/copy.ts` | `copyExtra.home.deltaFoot` comment regains `DESIGN-GAP: K25 / K29` |
| `test/unit/kit-contract.test.ts` | pins `copyExtra.patterns.overInMonth` contains `w {month}` |
| `context/foundation/design-kit.md` | `/home` row in „Widoki i trasy w kicie” → round 3 (2 cards, C4/C5); K17, K18, G36 legacy rows point to „Runda 3 — status rejestru” |
| `context/changes/kit-round-3-intake/plan.md` | rows 1.8, 2.8, 3.7 ticked |
| `context/changes/kit-round-3-intake/change.md` | status `impl_reviewed` |

## 3. Verification

| Command | Result |
| --- | --- |
| `npm run lint` | 0 errors (Δ0) |
| `npx astro check` | 0 errors, 152 files (baseline 149, +3) |
| `npm run fixture:check` | OK (ing + santander) |
| `npm test` | 347 passed / 22 files (baseline 335 / 20, +12 / +2) — before and after `d279eef` |
| `npm run build` | OK |
| `npx supabase db reset && npx supabase test db` | Files=6, Tests=119 PASS (Δ0); no DB change since |
| smoke on :4398 | 157 PASS / 0 FAIL (baseline 151, +6), re-run after `d279eef`: same; server killed, :4398/:4399 free |
| Delivery vs kit (`diff -rq` per mapping, `cmp` CHANGELOG) | only `content.json`; parsed diff = 4 added `authStates` leaves, byte-equal to `main` |
| `scripts/sync-kit.sh` re-run | tree clean (idempotent) |
| Break 1: `BODY_ORDER` → identity | `table-columns.test.ts` red, restored green. Meta: kit-contract stays green (lengths only) — the table-columns test is the mapping's guard |
| Break 2: `register.astro` unfilled `passwordTooShort` | smoke step red, restored green. Meta: island props carry the text; `notContains "{n}"` proves the fill |
| Migration / endpoints | none in the diff — two-account RLS check not applicable |

## 4. Next command

`visual gate (kit-round-3-intake), then /10x-archive kit-round-3-intake`

## 5. Open

- [ ] 3.6 `[visual]` screenshots 1280 px + ~400 px of the states listed in plan.md Phase 3 (`/login?error=1`, `/reset`, `/reset?sent=1`, `/register` short password, `/home`, `/patterns`, `/fixed`, `/settings` short password) vs kit views.
- [ ] 3.8 `[human]` accept kit-text deviations („we wrześniu” K30, header body order until S-14, `copyExtra.imports.saveError` K28, 4 restored `authStates` K27) and send K27–K32 to the kit author.
- F6 accepted: `src/pages/fixed.astro` `referenceMonth ?? ""` type escape (unreachable). F7 accepted: `DESIGN-GAP: K24` in `home.astro` `leadFor` / `copyExtra.home.lead` → S-15.
- Follow-ups in `follow-ups/review-fixes.md` (S-14, S-15, S-12, month templates, `.prettierignore`), each with `Trigger:`.
- No migration, no new `DESIGN-GAP` beyond restoring the K25/K29 marker. Roadmap F-04 row untouched (archive updates it).

## 6. Autonomous decisions

1. **Warnings fixed in-branch, one `fix(...)` commit**, though none was CRITICAL. Rejected: queue them as follow-ups (F1 would misdirect S-14). Would change: a fix larger than text/comment/one assertion.
2. **Row 2.8 ticked although `authStates.passwordMinLength` has no reader in `src/`** — it is the plan's deliberate drift pin (decision 7). Would change: the maintainer wanting kit-contract strictly read-only.
3. **Restored `DESIGN-GAP: K25 / K29` marker** (count 50 → 51) rather than accept its removal. Would change: a convention that `copyExtra` entries need no marker.
4. **Legacy register rows get a pointer, not a rewrite** (keeps p3 decision 3). Would change: a reviewer wanting status in the original rows.
5. **Register-vs-research check delegated to one read-only subagent**; drift, seams and safety checked directly (diff is small, no endpoint, no migration).
