# UI foundation — kit → Astro app (slice 1)

**Date:** 2026-09-18 · **Status:** approved in brainstorming · **Kit round:** 1 (`design/rytm-os/`, contract in `context/foundation/design-kit.md`)

## Goal

Replace the starter UI with Rytm's own, built from the design kit, for the parts that can be real today: brand foundation, marketing pages, auth, the app shell and the empty dashboard. No data model, no import logic, no mock data. Later slices add the data screens on top of this shell.

Decisions taken in brainstorming (2026-09-18):

| Decision         | Choice                                                                                                                                                            |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Scope            | Foundation + shell + auth + empty `/home` (+ 4 stub app pages, inert `/imports/new` step 1)                                                                       |
| Styling          | `brand.css` tokens mapped into Tailwind 4 `@theme`; shadcn palette replaced by kit tokens; layouts transcribed from the prototype, never copied 1:1               |
| Routes           | Kit routes from `react-kit/docs/routes.md`; starter routes removed                                                                                                |
| Auth             | Email + password on Supabase (closes PRD OQ #1). Reset e-mail wired, "set new password" page deferred (G17); the "Nie pamiętam hasła" link stays hidden until G17 |
| Marketing header | Identical for anonymous and logged-in users (kit has one variant); middleware sends a logged-in user from `/login`/`/register` to `/home`                         |

## 1. Foundation

### Assets

- `react-kit/assets/{brand,favicon,fonts,icons,illustrations,social}` → `public/rytm/` verbatim (re-copyable when the author ships a new kit round; keep a `scripts/sync-kit.sh` doing the copy).
- Remove starter `public/favicon.png`. Favicon: `/rytm/favicon/favicon.svg` + `/rytm/favicon/favicon.ico`. OG image: `/rytm/social/rytm-og-1200x630.png`.

### Tokens and Tailwind

- `src/styles/brand.css` = kit `brand.css` with one change: font URL → `/rytm/fonts/Manrope-Variable.ttf`. Everything else (tokens, `.rytm-mark`, `.rytm-badge--*`, `.rytm-icon`) untouched.
- `src/styles/global.css`: `@import "./brand.css"` first, then Tailwind. `@theme` exposes the tokens:
  `--color-ink`, `--color-paper`, `--color-paper-soft`, `--color-excess`, `--color-excess-text`, `--color-muted`, `--color-line`, `--color-green` (each `var(--rytm-*)`), `--font-sans: var(--rytm-font)`.
- shadcn variables re-pointed: `--background`→paper, `--foreground`/`--primary`/`--ring`→ink, `--primary-foreground`→paper, `--muted`→paper-soft, `--muted-foreground`→muted, `--border`/`--input`→line, `--card`→`#fff` (prototype panels are white on paper), `--radius: 14px`. `--destructive` kept for form validation only. Dark-mode block removed (G15: MVP light only).
- Structural constants transcribed from `prototype/styles.css`: container 1180 px, panel radius 20 px / controls 14 px, breakpoints 900 px (sidebar → bottom nav) and 560 px (single column). Color values in the prototype are ignored (K6).

### Copy

- `src/content/copy.ts`: `import content from "../../design/rytm-os/react-kit/docs/content.json"` (typed `as const`) re-exported as `copy`, plus `copyExtra` for strings the prototype renders but `content.json` lacks (K11, see §5). Components receive copy through props; no string literals in components.
- Footer year is rendered dynamically (K7).

### Icons

- `src/components/Icon.astro`: `<svg class="rytm-icon" width height aria-hidden><use href={`/rytm/icons/ui/ui.svg#${id}`}/></svg>`; `id` typed as a union of the 19 sprite symbols; sizes 15/16/17/20 as used in the prototype.

### Layout

- `src/layouts/Layout.astro`: `lang="pl"`, `<title>{title} — Rytm</title>`, meta description = `brand.ogSentence`, `theme-color #202F40`, OG tags, favicon links. Config-status `Banner` retained (dev diagnostics) and restyled with tokens.

## 2. Shells

- `src/layouts/MarketingLayout.astro`: `SiteHeader` (brand, "Jak działa", "Dla kogo", ghost "Zaloguj się", primary "Zacznij") + `<slot/>` + `SiteFooter` (copyright with year, Prywatność, Kontakt → `#` as in kit).
- `src/layouts/AppLayout.astro` (`dash-shell`): `AppHeader` (brand, muted current-month label formatted `MMMM yyyy` in `pl-PL`, ghost "Wyjdź" = `<form method="post" action="/api/auth/signout">`), `Sidebar` (label "Widok": Przegląd `/home`, Wzorce wydatków `/patterns`, Koszty stałe `/fixed`; label "Dane": Importy CSV `/imports`; bottom: Ustawienia `/settings`; active = `Astro.url.pathname` startsWith), `<main class="dash-main"><slot/></main>`, `MobileNav` (bottom bar < 900 px, labels from `mobileNav.*`, icons overview/patterns/fixed/import/settings).
- Shells are Astro-only; responsive behaviour is CSS (`hidden max-[899px]:flex` etc.).

## 3. Pages and routes

| Route                                          | Layout      | Kit source                | Behaviour                                                                                                                                                                            |
| ---------------------------------------------- | ----------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/`                                            | Marketing   | `landing()`               | static; hero card (mini stats, bars, rhythm row) is decorative CSS transcribed from the prototype                                                                                    |
| `/how-it-works`                                | Marketing   | `howItWorks()`            | static (sequence card, process grid, explanation cards)                                                                                                                              |
| `/for-who`                                     | Marketing   | `forWho()`                | static (audience hero + quote, A/B/C cards, closing)                                                                                                                                 |
| `/login`                                       | `AuthShell` | `auth('login')`           | `SignInForm` (React) → `POST /api/auth/signin` → redirect `/home`; error = kit inline alert with `authStates.loginError`                                                             |
| `/register`                                    | `AuthShell` | `auth('register')`        | `SignUpForm` (React): optional name (`fields.name` + "opcjonalne"), e-mail, password → `POST /api/auth/signup` → `/confirm-email`                                                    |
| `/reset`                                       | `AuthShell` | `resetPage()`             | `ResetForm` (React) → `POST /api/auth/reset` → always renders "Sprawdź skrzynkę" (no enumeration). Reachable by URL only until G17                                                   |
| `/confirm-email`                               | `AuthShell` | — (G19)                   | "check inbox" composition reused from `/reset` with register wording                                                                                                                 |
| `/home`                                        | App         | `dashboard(empty=true)`   | title block "Zacznij od pierwszego importu." + `EmptyState` (illustration `rytm-pusty-stan-jasny.svg`, `emptyState.*`, CTA "Wgraj CSV" → `/imports/new`). Always empty in this slice |
| `/imports/new`                                 | App         | `importsNew()`            | step 1 of 3 static: `Stepper`, title `importFlow.title`, `supported` note, file field; primary button disabled (inert until the import slice)                                        |
| `/patterns`, `/fixed`, `/imports`, `/settings` | App         | title blocks of each view | stubs: `PageTitle` from the kit view + `InlineAlert info` with placeholder copy (`DESIGN-GAP: G18`)                                                                                  |

Removed: `src/pages/dashboard.astro`, `src/pages/auth/*`, `Welcome.astro`, `Topbar.astro`, `ui/LibBadge.astro`, starter hero copy.

`src/middleware.ts`: `PROTECTED_ROUTES = ["/home", "/patterns", "/fixed", "/imports", "/settings"]`; `AUTH_ROUTES = ["/login", "/register"]` redirect to `/home` when a user exists. `signin.ts` redirects to `/home`; `signup.ts` to `/confirm-email`; `signout.ts` to `/`. New `src/pages/api/auth/reset.ts` (zod `{ email }`, `supabase.auth.resetPasswordForEmail(email, { redirectTo: <origin>/reset/new })`, always 200/redirect to `/reset?sent=1`).

## 4. Components

Astro (static): `Brand` (logo/sygnet variants granat/bialy), `Icon`, `SiteHeader`, `SiteFooter`, `AppHeader`, `Sidebar`, `MobileNav`, `PageTitle` (eyebrow + h1 + lead + optional action slot = prototype `dash-title`), `Panel`, `InlineAlert` (success/error/info, icon + text), `EmptyState`, `Stepper`, `AuthShell` (visual aside with white brand + eyebrow in `--rytm-excess`, headline, lead; form column).
React (interactive only): `SignInForm`, `SignUpForm`, `ResetForm` + existing `FormField`, `PasswordToggle`, `SubmitButton`, `ServerError` restyled to the kit `.field` / `.inline-alert` look. shadcn `button.tsx` variants: `primary` (ink bg, paper text), `ghost` (transparent, ink text, line border on hover) — the kit's `btn-primary` / `btn-ghost`; arrow suffix `↗` where the prototype has it.

Rules: Tailwind utilities reference theme colors only (`bg-ink`, `text-muted`, `border-line`…); no raw hex outside `brand.css`; kit classes `rytm-badge--*`, `rytm-icon`, `rytm-mark` used as-is; copy via props; `cn()` for class merging.

## 5. Kit conflicts and gaps to register (`context/foundation/design-kit.md`)

| ID   | Type        | Entry                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ---- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| K11  | conflict    | `content.json` lacks copy that the prototype renders: auth visual panels ("Zacznij widzieć więcej." / "Wróć do swojego rytmu." + leads), empty-dashboard title and lead, reset page headings ("Nie pamiętam hasła", "Odzyskaj dostęp." is present but "Hasło można ustawić na nowo." is not), "Sprawdź skrzynkę / Link jest w drodze.", imports page title. Taken from the prototype into `copyExtra`; author to add keys |
| G17  | open        | "Set new password" page for the Supabase reset link (`/reset/new`); until delivered the "Nie pamiętam hasła" link is hidden                                                                                                                                                                                                                                                                                               |
| G18  | placeholder | Copy + composition for an app view that is not available yet (stub pages) — `DESIGN-GAP: G18`                                                                                                                                                                                                                                                                                                                             |
| G19  | placeholder | Confirm-e-mail page after registration; reuses the reset "check inbox" composition — `DESIGN-GAP: G19`                                                                                                                                                                                                                                                                                                                    |
| note | —           | shadcn `--destructive` retained for form-validation text only; kit has no error color beyond the `error` alert                                                                                                                                                                                                                                                                                                            |

## 6. Verification

- `npm run lint && npx astro check && npm run build` clean.
- `scripts/smoke.mjs` updated: `/` 200; `/home` anonymous → 302 `/login`; signup → 302 `/confirm-email`; signin → 302 `/home`; `/home` signed-in 200 contains `emptyState.title`; signout → 302 `/`; `/login` signed-in → 302 `/home`. CI `smoke` job keeps running it.
- Visual check in Chrome at 1280 / 900 / 560 px against `design/rytm-os/prototype/index.html` for `#/`, `#/login`, `#/register`, `#/home-empty`, `#/imports/new`; differences either fixed or recorded as gaps.
- `npx vercel` preview deploy for a phone click-through.

## Out of scope

Data model and migrations, CSV import, patterns/thresholds/fixed-costs/imports/settings screens with data, dark mode (G15), OAuth, `/reset/new` (G17), Santander (FR-018).
