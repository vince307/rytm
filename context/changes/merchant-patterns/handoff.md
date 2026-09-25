# Handoff — `merchant-patterns` (slice S-03)

Written by the `research` step (`/10x-research merchant-patterns`). `research.md` is written and `change.md` moved
`new → preparing`; nothing is implemented. The one thing the next agent must not get wrong: **the oracle is a
partition, not key strings** — `expected.json` pattern keys are hand-authored slugs (`zus`, `przelew-wlasny-vat`);
S-03 must reproduce the grouping of the 206 imported rows (31 groups: T01 `sportowo` stays split until S-05), and
aggregating in TS over a plain select silently truncates at `max_rows = 1000`.

## 1. State

| Item | Value |
|---|---|
| Branch | `feat/merchant-patterns`, cut from `main` at `d11f3ef` |
| Commits | 3 on top of `d11f3ef` after this step (`d11f3ef..HEAD`): 2 × `change identity`, 1 × `docs(merchant-patterns): research` |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `preparing` (set by `metadata-guard.mjs mark-researched`) |
| `## Progress` rows remaining | n/a — no `plan.md` yet |
| Working tree | clean apart from the maintainer's `.gitignore` and `.claude/skills/10x-autonomous-run/` (never staged) |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/merchant-patterns/research.md` | Research: schema/RPCs, `src/lib` gaps, oracle analysis (partition, merges, types), kit binding, shared components, 10 open plan choices |
| `context/changes/merchant-patterns/change.md` | Frontmatter only: `status: preparing`, `updated: 2026-09-25` (via metadata guard) |
| `context/changes/merchant-patterns/handoff.md` | This handoff |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/merchant-patterns` (observed before writing) |
| `python3` over `test/fixtures/ing/expected.json` | 206 imported rows (main file only), 32 distinct `rawMerchant`, 30 patterns, 0 imported rows without pattern, no raw merchant in 2 patterns; merges = T03 + T01 only; 7 fixed / 23 frequent — observed |
| `grep max_rows supabase/config.toml` | `max_rows = 1000` — observed |
| `grep -c transactions supabase/seed.sql` | 0 — seed has no transactions, observed |
| `grep` for `merchant`, `NumberFormat`, `zł`, `amount_minor` in `src/` | no merchant logic, no money formatter — observed |
| `metadata-guard.mjs inspect` → `mark-researched` | `changed: true`, status `preparing` — observed |
| lint / astro check / vitest / build / pgTAP / smoke | not run — docs-only step, no code touched. Run baseline (inherited, unverified here): lint 0, astro check 0/0/0, vitest 32/32, pgTAP 44/44, smoke 46/46 |

## 4. Next command

`/10x-plan merchant-patterns`

## 5. Open

Plan must decide (details in `research.md` § Open Questions):

- **Storage**: derived-on-read (no migration) vs a patterns table; evidence favors derived keyed by a deterministic merchant key. Risk carried to S-05: changing normalization re-keys merchants.
- **Aggregation site** vs `max_rows = 1000` (`supabase/config.toml`): SQL view/RPC (+ pgTAP), explicit paging, or hybrid (SQL groups by raw fields, TS normalizes). `transactions` has no update grant (`20260924122144_transactions_import_account_fk.sql`), so no stored merchant column without a new grant.
- **Normalization rule set** minimum proven by the fixture: collapse, rule 7/D3 (port `rawMerchant` + `OPERATORS` from `scripts/fixture-ing.mjs`), strip URL scheme/`www.`, cut address at `UL.`/`AL.`, legal forms, store numbers (T03), doubled name (T02); must not merge T06 vs T08.
- **T01 auto-merge or not** (changes oracle: 31 vs 30 groups; generator edit, never hand-edit `expected.json`).
- **Fixed amount** = median (`medianMinor`) vs last amount — DESIGN-GAP, no kit column/key.
- DESIGN-GAP candidates (next ids **K17 / G28** in `context/foundation/design-kit.md`): fixed-amount column; `stały`/`częsty` badge copy (`copyExtra`); row link to detail (S-04); Próg/Ponad progiem columns; table foot + „Pokaż więcej”; badge background hex (`.rytm-badge--*` in `src/styles/brand.css`) vs token-only rule.
- Missing shared components: Badge, table (inline in `src/pages/imports/index.astro` `cell`/`head`), merchant mark, search/sort (React island). Money formatter missing in `src/lib/format.ts`.
- `scripts/smoke.mjs` check "patterns renders empty view" must stay green for 0-transaction users.
- Screenshot gate needs the fixture imported for `test@rytm.local` (seed has none).
- Real-data risk: every one-off debit becomes a 1× „stały” pattern (oracle `silownia-ruch`) — roadmap Unknown, owner user.

## 6. Autonomous decisions

- **Scoped the research myself instead of AskUserQuestion.** Chosen: the four questions in `research.md` § Research Question, taken from `change.md` "Next" line + roadmap `### S-03` + the step brief (schema/RPCs, `src/lib`, kit views, shared components). Rejected: widening to S-04/S-05 design. Why: no human; one slice per change. Would change: a maintainer message narrowing or widening scope.
- **Worked locally instead of delegating to 2–4 sub-agents.** Why: this session has no Agent/Task tool; all areas were small enough to read directly, and the brief warns about a research step that died waiting on agents. Would change: an available sub-agent tool and a larger codebase.
- **Anchored on symbols, not `file:line`** (skill format asks for lines). Why: run contract rule overrides. Would change: contract change.
- **Recommended, not decided, the storage model** (derived-on-read favored). Why: research answers facts; plan owns the trade-off. Would change: evidence that S-04/S-05 need row ids before merchant keys exist.
- **Stated the S-03 oracle as 31 groups** (T01 split). Why: `expected.json` marks T01 `user-merge` (S-05) and change.md scoped merges/excludes out. Would change: the plan choosing auto-merge (then 30, generator `resolvedBy` flipped).
- **Status `complete`** on `research.md`. Why: every scoped question has observed evidence; remaining items are product/design choices, not gaps. Would change: finding a consumer this search missed (searched `src/`, `supabase/`, `scripts/`, `test/unit/`, `context/archive/*/plan.md`).
