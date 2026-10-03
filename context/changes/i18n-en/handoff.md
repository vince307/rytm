# Handoff — `i18n-en` (slice S-16)

Written by the `/10x-research i18n-en` step of run `2026-10-03-i18n-en`. Research is complete (`research.md`, status `complete`); `change.md` is `preparing`. The one thing not to get wrong: `copyExtra` is `as const`, so the design's `CopyExtra = typeof copyExtraPl` makes every EN string a type error — the plan needs a recursive `Widen<T>` type (verified in a scratch `tsc` run: accepts EN strings, keeps `[one, few, many]` tuples, rejects a 2-tuple).

## 1. State

| Item | Value |
| --- | --- |
| Branch | `feat/i18n-en`, cut from `main` at `b973428` |
| Commits | 4 on the branch: `d2b8d49`, `7c5bf13` (owner), `d0800ce` (new step) + this step's `docs(i18n-en): research` |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `preparing` (set by `metadata-guard.mjs mark-researched`) |
| `## Progress` rows remaining | n/a — no `plan.md` yet |
| Working tree | clean per `tree-clean.sh` after the commit (allow-listed `?? design/prompts/2026-10-03-gaps-round-4.md` untouched) |

## 2. Artifacts

| Path | What it is |
| --- | --- |
| `context/changes/i18n-en/research.md` | Source-backed answers to unknowns (a)–(g), typing experiment, hard-coded-Polish sweep, EN dictionary shape, 6 open plan decisions |
| `context/changes/i18n-en/change.md` | Frontmatter only: `status: new → preparing`, `updated` (via `metadata-guard.mjs`) |
| `context/changes/i18n-en/handoff.md` | This file |

## 3. Verification

| Command | Result |
| --- | --- |
| `git branch --show-current` | `feat/i18n-en` |
| scratch `tsc --strict --ignoreConfig` (`as const` vs `Widen<T>`) | naive `satisfies typeof pl` → 5 errors; `Widen` → OK; `Widen` with 2-tuple → error (expected) |
| Node 22.14 `Intl` en-GB probe | `May 2026`, `01/05/2026`, `Sept 26`, `1 May`, `3,842.60`; PluralRules en-GB `one`/`other`; pl-PL `3842,60` (no 4-digit grouping) |
| Node `fetch` default headers | `accept-language: *`, no `Referer` |
| node walk of `content.json` | 405 strings, 18 arrays, 9 numeric leaves, 6 `{month}`/`{year}` templates |
| `grep` `supabase/migrations` for `USUŃ\|DELETE_CONFIRM\|confirm` | no hit → word not in DB |
| lint / astro check / vitest / build / pgTAP / smoke | **not run** — research-only step, no product code changed. Baseline inherited, unverified here: lint 0; astro check 0 (166 files); vitest 387 (27 files); pgTAP 119; smoke 195 PASS |

## 4. Next command

`/10x-plan i18n-en`

## 5. Open

- Plan decisions (research.md "Open Questions"): drop vs keep `copy`/`copyExtra` value exports in `src/content/copy.ts` (recommend drop; tests `kit-contract.test.ts`, `patterns-table.test.ts`, `sequence-label.test.ts` → `getCopy("pl")`); `KitCopy` mutable vs `DeepReadonly`; month helper in `src/lib/format.ts` (replace `home.astro` `nominatives = Object.keys(...)`; EN `patternDetail.monthNames` = PL keys → English names); `fillMonthLocative` gets `locale`; homes for hero literal (`index.astro`, keep PL string `3 842,60 zł` — `formatMoney` would change it), `Layout.astro` banner `Uwaga:`/`"Dokumentacja"`, `config-status.ts` strings, switch labels (new `copyExtra` keys); `formatThresholdInput` EN decimal point; smoke `request()` `headers` option + EN steps last, reset to `pl`.
- Correction to change.md: `src/lib/import/presentation.ts` needs only the type import change (uses locale-free `formatAccountTail`); locale threads through `sequence-label.ts` `sequenceLabel` and `fixed-view.ts` `deltaText`.
- Islands needing a `locale` prop: `PatternsTable.tsx`, `ImportWizard.tsx`; `ThresholdEditor.tsx` if EN pre-fill is in scope; `DeleteAccountDialog.tsx` gets a `confirmWord` prop (A4).
- Visual gates: a browser with `Accept-Language: en-*` gets EN on first visit — PL shots need `rytm-locale=pl`.
- DESIGN-GAPs to add during implementation: K42 (no EN copy in kit), K43 (no language switcher) in `context/foundation/design-kit.md`.
- Triggered follow-ups (unchanged from change.md): `AuthLayout.astro` visual title weight; `index.astro` steps head < 560 px; deferred `PanelTitle` sweep and S-14 F7 `fieldBox`.
- No migration expected.

## 6. Autonomous decisions

1. **Scope derived from change.md (a)–(g), no question asked.** Rejected: re-scoping. Why: the contract forbids AskUserQuestion and change.md lists the unknowns. Would change: the owner adding a locale or URL prefix.
2. **Researched locally, no sub-agents.** Rejected: 2–4 parallel workers. Why: targeted questions over ~15 known files; sequential greps answered each faster than delegation. Would change: a scope needing a sweep of unknown areas.
3. **Recommend EN `monthNames` with PL keys + English values and a month helper.** Rejected: relaxing `KitCopy` for one key; a separate `copyExtra.monthsNominative` in both locales (PL copy would duplicate kit keys). Why: keeps `satisfies KitCopy` strict and the kit untouched. Would change: the kit shipping EN month data.
4. **Recommend keeping the hero amount a dictionary string.** Rejected: `formatMoney(locale)`. Why: pl-PL output `3842,60 zł` differs from today's `3 842,60 zł` → PL regression. Would change: owner accepting the PL change.
5. **A4 and A5 confirmed, not reopened.** Why: no DB check of `USUŃ`; no browser-only risk found (`ImportWizard` range formatting is post-interaction; `PatternsTable` money formatting is already SSR+client today). Would change: a hydration mismatch observed in the EN visual gate → follow-up for `/10x-e2e-setup`.
