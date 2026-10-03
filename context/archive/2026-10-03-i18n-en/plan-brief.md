# English locale and language switch (S-16) — Plan Brief

> Full plan: `context/changes/i18n-en/plan.md`
> Research: `context/changes/i18n-en/research.md`

## What & Why

Rytm gets a second interface language, English, next to Polish (default), with a PL / EN switch on every page
family. The owner decided it on 2026-10-03 (`design.md`, roadmap `### S-16`); the PRD is silent on languages. Only
the interface changes — merchants, statement text and PLN amounts stay as they are.

## Starting Point

All UI copy comes from one channel (`src/content/copy.ts`: kit `content.json` + `copyExtra`), read by 30 files; islands
already get copy as props. Formatting is hard-coded `pl-PL` in `src/lib/format.ts`; Polish grammar sits partly in code
(`fillMonthLocative`, `monthNames` keys as nominatives, `USUŃ`). No locale concept exists.

## Desired End State

A visitor whose browser prefers English sees the whole app in English on first visit; anyone can switch with PL / EN
buttons (footer, auth corner, „Język / Language” section in `/settings`), and the choice survives reload and
navigation (`rytm-locale` cookie). EN uses `en-GB` dates, numbers and plurals with `52.99 zł`. Polish renders exactly
as before.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Locale storage | Cookie `rytm-locale` + `Accept-Language`, no URL prefix, no DB | Cheapest path, no auth/redirect rework | Design D2 |
| Mechanism | Own typed dictionary `getCopy(locale)`, no library | One source of truth next to `content.json` | Design D5 |
| `copyExtra` type | `Widen<typeof copyExtraPl>` | `as const` literal types reject every EN string | Research |
| Value exports | `copy` / `copyExtra` dropped | A forgotten consumer fails `astro check` instead of staying Polish | Plan |
| Months | EN `monthNames` keeps PL keys with English values; one `getMonths(locale)` | Kit type stays strict, kit untouched | Research |
| Formatters | Required `locale` parameter, `Intl` cached per locale | Compiler lists every caller | Plan |
| Hero amount | Dictionary string per locale | `formatMoney` would change PL output | Research |
| Delete word | UI shows `USUŃ` / `DELETE`; server accepts either | `Ń` untypeable on most keyboards | change.md A4 |
| Switch | No-JS form, `PL` / `EN`, bilingual section title | Findable whatever language is showing | Design D3 / Plan |
| E2E | None; unit + smoke + visual gate | No browser-only risk found | change.md A5 |
| Locale before P5 | Pinned `pl` | No mixed PL copy with EN numbers between phases | Plan |

## Scope

**In scope:** every `content.json` and `copyExtra` leaf in English, `<html lang>`, titles/meta, formatting, switch +
`/api/locale`, delete word per locale, banner/hero literals into the dictionary, K42/K43 register rows, two triggered
layout follow-ups (auth title weight, landing steps head < 560 px).

**Out of scope:** Supabase e-mails, statement data, parsers, URL prefixes, DB-stored locale, i18n library,
Playwright setup, `PanelTitle` sweep, S-14 F7 field box, any edit under `design/`.

## Architecture / Approach

Middleware resolves `locals.locale` (cookie → `Accept-Language` → `pl`); `Layout` sets `lang`; every `.astro` reads
`getCopy(Astro.locals.locale)` and passes `locale` to formatters and to the three formatting islands
(`PatternsTable`, `ImportWizard`, `ThresholdEditor`). `POST /api/locale` sets the cookie and 303s to the same-origin
`Referer`. A parity unit test guards what `satisfies` cannot (array lengths, placeholders, diacritics).

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Locale plumbing | `i18n.ts`, `locals.locale` (pinned `pl`), `<html lang>` | None visible |
| 2. Locale-aware formatting | `format.ts` + libs + 3 islands take `locale` | A PL string changing |
| 3. Copy channel | `getCopy`, exports dropped, 30 consumers, literals moved | Missed consumer (compile gate) |
| 4. EN kit dictionary | `en/kit.ts` (~405 strings) + parity test | Translation volume |
| 5. EN extra + resolution live | `en/extra.ts`, `Accept-Language` on, `USUŃ`/`DELETE` | Smoke cookie jar ordering |
| 6. Switch + `/api/locale` | `LocaleSwitch.astro` ×3 places, endpoint, K42/K43 | Open redirect |
| 7. Seam sweep + visual gate | Leftovers, follow-ups, EN + PL screenshots | Long EN strings vs layout |

**Prerequisites:** S-12…S-15 done; local Supabase running for the gate.
**Estimated effort:** 7 fresh-agent phases; P4 is the largest (pure data).

## Open Risks & Assumptions

- `PatternsTable` en-GB money on SSR vs hydration assumed identical (inference) — a mismatch triggers an E2E follow-up.
- The diacritic sweep misses Polish words without diacritics; the EN visual gate is the backstop.
- Translation quality is human-owned (`[human]` 7.10).

## Success Criteria (Summary)

- Every view renders fully in English after switching (or with an English browser), and the choice persists.
- Polish views unchanged: smoke baseline steps all still pass, PL format cases unchanged.
- A missing EN key, a short tuple, a dropped placeholder or a Polish letter in EN fails CI.
