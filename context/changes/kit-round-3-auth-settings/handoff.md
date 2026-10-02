# Handoff — `kit-round-3-auth-settings` (slice S-12)

Written by the `/10x-implement … phase 1` step of run `2026-10-02-kit-round-3`. Phase 1 (public pages and site chrome) is committed and green. The next agent must not miss that the header „Wyjdź” is removed in Phase 3 together with the new „Sesja” sign-out row (never split them), and that no existing smoke assertion may be edited.

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/kit-round-3-auth-settings`, cut from `main` at `60e92e1` (after S-13) |
| Commits | 6 on the branch: identity, research, plan, plan review, `feat(…): Public pages and site chrome (p1)` (464bfef), this handoff |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | 48 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `src/pages/{index,how-it-works,for-who}.astro` | read `copy.landing/howItWorks/forWho` |
| `src/pages/patterns/[...key].astro` | sequence legend reads `copy.patternDetail.sequenceOver` |
| `src/content/copy.ts` | `copyExtra.landing/howItWorks/forWho` removed |
| `src/components/marketing/SiteFooter.astro` | phone-only „Dla kogo” link first, kit column footer ≤ 559 px |
| `src/components/marketing/SiteHeader.astro` | „Dla kogo” hidden ≤ 559 px, kit nav gaps/sizes, new ≤ 359 px tier |
| `scripts/smoke.mjs` | +3 steps: how-it-works renders, for-who renders, landing footer links for-who (needle `>Dla kogo</a><a href="#"`) |
| `context/changes/kit-round-3-auth-settings/plan.md`, `change.md`, `handoff.md` | Progress rows 1.1–1.5 ticked with SHA; status implementing |

## 3. Verification

| Command | Result |
| --- | --- |
| `npm run lint` | 0 errors (baseline 0) |
| `npx astro check` | 0 errors (baseline 0) |
| `npm run fixture:check` | ing OK, santander OK |
| `npm test` | 352 passed / 23 files (baseline 352, Δ0) |
| `npm run build` | OK |
| `npx supabase db reset` + `test db` | Files=6, Tests=119 PASS (baseline 119, Δ0) |
| `npm run smoke` (port 4398) | 169 PASS / 0 FAIL (baseline 166, +3) |
| Deliberate break | footer „Dla kogo” anchor removed: smoke step `landing footer links for-who` went red (only failure), header still rendered `>Dla kogo<` (grep count 1); restored, smoke green again. Meta-check: proves the needle is footer-only, not the CSS visibility (visual row 8.6). A first break attempt (removing only the opening tag) gave 500s on all pages — invalid, discarded |

## 4. Next command

`/10x-implement kit-round-3-auth-settings phase 2`

## 5. Open

- Manual rows, as a checklist:
  - [ ] [reviewer] rows 1.6, 2.6, 3.7, 4.5, 5.7, 6.6, 7.8, 8.7
  - [ ] [visual] 8.6 (all states, desktop + ~400 px, incl. pattern-actions dialog `max-h`)
  - [ ] [human] 8.8: accept header sign-out removal, collapsed password form, dialog closing on error, short demo strip text, redirect `/` vs PRD, longer deleted notice; send K34 to the kit author
- Roadmap item S-12 was not flipped to `in-progress` (docs/best-effort step skipped; orchestrator owns roadmap).
- Follow-ups for P8 in `follow-ups/review-fixes.md` as in plan; known risks as in plan § Known risks.
- Invariants: never `npm run format`, never stage `design/**` or `src/styles/brand.css`, never touch `checkOrigin`.
- No `DESIGN-GAP` added.

## 6. Autonomous decisions

1. **Implemented in this context, no subagent; commit message approved as proposed.** Why: contract forbids questions and the phase was small. Would change: a phase touching many files.
2. **Footer needle `>Dla kogo</a><a href="#"`.** Rejected: a bare `Dla kogo` (header satisfies it). Why: compressed HTML puts the next footer link right after; header's is followed by `/login`. Would change: footer link order or HTML compression off.
3. **Used `eslint --fix` on touched files only (Prettier formatting via the eslint plugin), not `npm run format`.** Would change: a repo-wide format policy.
4. **Header/footer use the app's `max-[559px]`/`max-[359px]` convention (plan decision 6).** Would change: a visual-gate mismatch at exactly 560/360 px.
5. **Roadmap status sync skipped.** Why: orchestrator manages run state; avoids touching a foundation file in a slice commit. Would change: the orchestrator expecting `in-progress` in the roadmap.
