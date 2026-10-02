# Handoff — `kit-round-3-intake` (slice F-04)

Written by the `/10x-research` step: research is on disk, no product or kit file touched. The next agent must not
treat `copy.dashboard.stats[2]` / `patterns.columns` as caught by `astro check` — JSON arrays type as `T[]`, so the
index breaks are runtime-only; and the 4 `authStates` texts have NO round-3 key (a sub-agent claim that they were
"folded into resetNew/confirmEmail" was checked and rejected).

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/kit-round-3-intake`, cut from `main` at `577b163` (+ roadmap commit `78386c1`) |
| Commits this step | 1 (`docs(kit-round-3-intake): research`) on top of `a92237e` |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `preparing` (set by `metadata-guard.mjs mark-researched`) |
| `## Progress` rows remaining | n/a — no `plan.md` yet |
| Working tree | clean after commit (only the files below written) |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `context/changes/kit-round-3-intake/research.md` | breaks + minimal fixes, round-2→3 key diff, `copyExtra`→round-3 map, file-copy mechanics, K/G register matrix, kit-vs-PRD contradictions |
| `context/changes/kit-round-3-intake/change.md` | frontmatter only: `status: preparing`, `updated` |
| `context/changes/kit-round-3-intake/handoff.md` | this file |

## 3. Verification

| Command | Result |
| --- | --- |
| `git branch --show-current` | `feat/kit-round-3-intake` |
| Node diff of old vs delivery `content.json` (arrays of scalars = 1 leaf) | 197 → 385 leaves; 20 removed (10 keys, 5 used-by-app reads in 4 keys + `stats[2]`); 18 changed |
| Node map of 216 `copyExtra` leaves vs delivery | 127 verbatim (71 same path, 56 other key), 16 same name/new wording, 73 no counterpart |
| `grep -o copy.<path>` over `src/` | every kit access path listed; readers of changed keys in research.md §1 |
| `diff` src/styles/brand.css vs sed(kit brand.css) | in sync → sync-kit adds only the 8 tokens |
| `diff -rq` assets / prototype / brand-pack | assets identical; prototype +32 views +README, 3 changed; brand-pack 1 file (`karta-stylu.md`) |
| lint / astro check / tests / build / pgTAP / smoke | not run — research only, no code changed (baseline in agent contract, inherited, unverified) |

## 4. Next command

`/10x-plan kit-round-3-intake`

## 5. Open

- Plan must cover (research.md §3): restore `authStates.loginError/resetTitle/resetBody/checkInbox` (readers `login.astro`, `reset.astro`); `home.astro` `StatCard` → `stats[1].label`, keep `copyExtra.home.risen` feet (kit „{n} {items} podrożały” wrong for n=1; smoke `>1 pozycja podrożała<`); `PatternsTable.tsx` header from 7 kit labels mapped to current body order (Suma before Kwota), drop `copyExtra.patterns.amountColumn`; fill `{month}` in `fixed.astro` `copy.fixedCosts.new` (locative), `{n}` in `copy.trend.tooShort` (`trend.minimumMonths`), `passwordTooShort` + `resetNew.lead` (`MIN_PASSWORD_LENGTH`); wizard `genericError` → new `copyExtra.imports.saveError` „Nie udało się zapisać importu. Spróbuj ponownie.” (round-3 `app.js` `status==='error'`); remove `DESIGN-GAP: K18` comments at the 6 read-failure sites.
- Pre-commit prettier reformats `design/**/*.{json,css,md}` — compare delivery vs kit by parsed JSON; run `sync-kit.sh` after the kit file is in place so `src/styles/brand.css` matches.
- `design-kit.md`: `kit_round: 3`, matrix in research.md § Register matrix; new K-rows for: stats foot grammar, import save-failure copy not in `content.json`, `authStates` dropped twice (K12 partial), rename limit 60 vs app/DB 100 (`decision-form.ts` `parseDisplayName`, migration CHECK) → S-14, „w wrześniu” locative (pre-existing in `copyExtra.patterns.monthsLocative`), new duplicate keys; G36 closed (C5).
- Follow-ups from change.md § Open follow-ups unchanged (Badge `new` tint → S-15; field radius / panel radius not fired).
- No `DESIGN-GAP` added. Migration expected: no.

## 6. Autonomous decisions

1. **Scope derived from change.md without asking** — five questions (breaks, 55/90 claim, authStates restore, file copy, register matrix). Would change: a human scoping F-04 differently (e.g. migrating `copyExtra` in F-04).
2. **Recommend keeping change.md decision 2 (intake patch for the 4 `authStates`)** over `copyExtra.auth`. Why: no round-3 key holds the texts, the round-3 prototype still renders them, K12 precedent, readers unchanged. Would change: the plan requiring `design/rytm-os/` to stay byte-faithful to the delivery → `copyExtra.auth`.
3. **Recommend index-mapped table header (no visual change) in F-04, kit column order in S-14.** Why: F-04 is "no redesign"; reordering body cells is K17 adoption. Would change: the plan judging a two-cell swap trivial enough to take the kit order now.
4. **Wizard save failure uses the prototype's „Nie udało się zapisać importu…” via `copyExtra`** rather than `authStates.genericError` / `settings.saveError`. Why: exact meaning, verbatim kit text. Would change: the author adding a `content.json` key.
5. **Rejected the sub-agent's "do not adopt `trend.tooShort`"** — the app already shows it only as a note beside all bars (FR-013 satisfied), unchanged since round 2. Would change: a reading of FR-013 that forbids the note.
