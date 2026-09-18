# UI Foundation (kit → Astro, slice 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the starter UI with Rytm's brand foundation, marketing pages, auth pages, app shell and empty dashboard, built from `design/rytm-os/` with no mock data.

**Architecture:** The kit's `brand.css` tokens are imported first and mapped into Tailwind 4 `@theme inline`; shadcn's palette variables are re-pointed at them. Layouts from the vanilla-JS prototype are transcribed into Astro components (static) and three React forms (interactive). Copy is read straight from the kit's `content.json`; strings the kit lacks live in one `copyExtra` object and are reported as kit gaps.

**Tech Stack:** Astro 7.3 (SSR, `@astrojs/vercel`), React 19 islands, Tailwind 4 (`@tailwindcss/vite`), shadcn `button.tsx` (cva), Supabase auth via `@supabase/ssr`, zod 4.

**Spec:** `docs/superpowers/specs/2026-09-18-ui-foundation-design.md`

## Global Constraints

- Never edit anything under `design/` (kit is read-only; gaps go to `context/foundation/design-kit.md`).
- Colors only from `--rytm-*` tokens (via Tailwind theme names `ink`, `paper`, `paper-soft`, `excess`, `excess-text`, `muted`, `line`, `green`, plus opacity modifiers like `bg-ink/8`); no raw hex outside `src/styles/brand.css`. Prototype hex values are ignored (K6).
- Font: Manrope only (`font-sans` → `--rytm-font`). Headings weight 700–800, UI 500–700.
- Copy from `src/content/copy.ts` (`copy` = kit `content.json`, `copyExtra` = kit-missing strings). No string literals for user-facing text in components/pages.
- Routes exactly as `design/rytm-os/react-kit/docs/routes.md`: `/`, `/how-it-works`, `/for-who`, `/login`, `/register`, `/reset`, `/home`, `/patterns`, `/fixed`, `/imports`, `/imports/new`, `/settings`; plus `/confirm-email`. API stays under `/api/auth/*`.
- Astro components for static markup; React only for the three auth forms. Class merging via `cn()` from `@/lib/utils`. Path alias `@/*`.
- Kit CSS classes used as-is where they exist in `brand.css`: `.rytm-icon`, `.rytm-badge--*`, `.rytm-mark`.
- Breakpoints: sidebar → bottom nav below 900 px (`max-[899px]:`), single column below 560 px (`max-[559px]:`). Container 1180 px. Panel radius 20 px (`rounded-[20px]`), controls 14 px (`rounded-[14px]`), inputs/buttons 9 px (`rounded-[9px]`).
- MVP is light-only (G15): no `.dark` block, no `dark:` utilities.
- Gate before every commit: `npm run lint && npx astro check && npm run build`.
- Node 22.14 (`.nvmrc`); npm needs `--cache "$TMPDIR/npm-cache"` on this machine if `~/.npm/_cacache` is not writable.
- Do not push to `main` during the plan (a push deploys production). Push once at the end when told.

## Verification tooling used by every task

There is no unit-test runner in this repo (by decision: `AGENTS.md` → Testing). Tasks verify with:

1. `npx astro check` — types across `.astro`/`.ts`/`.tsx`.
2. `npm run build` — SSR build must succeed.
3. HTTP assertions against the dev server. Start it once per task in the background:
   ```bash
   ASTRO_TELEMETRY_DISABLED=1 npm run dev -- --port 4321 > "$TMPDIR/dev.log" 2>&1 &
   for i in $(seq 1 30); do curl -sf -o /dev/null http://localhost:4321/ && break; sleep 1; done
   ```
   and stop it with `npx astro dev stop` (or kill the PID). Assertions are `curl -s http://localhost:4321/<path> | grep -c "<marker>"` (expect ≥ 1) and `curl -s -o /dev/null -w '%{http_code} %{redirect_url}' http://localhost:4321/<path>`.
4. `scripts/smoke.mjs` — the auth flow. It needs a Supabase whose e-mail confirmations are **off**: locally `npx supabase start` (Docker) and `.env` pointing at it; otherwise let CI run it (the `smoke` job does exactly that). Never run it against the hosted project in `.env` — it creates real users.

If the sandbox blocks `listen` on a port, run the dev-server commands outside the sandbox.

## File structure

| Path                                                                                                          | Responsibility                                                                                                                                          |
| ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scripts/sync-kit.sh`                                                                                         | copies `react-kit/assets` → `public/rytm/` and `react-kit/styles/brand.css` → `src/styles/brand.css` (font URL rewritten). Re-run on every kit delivery |
| `public/rytm/**`                                                                                              | kit assets, verbatim                                                                                                                                    |
| `src/styles/brand.css`                                                                                        | kit tokens + kit classes (generated by the script, committed)                                                                                           |
| `src/styles/global.css`                                                                                       | `@import "./brand.css"`, Tailwind, `@theme inline` token map, shadcn variables re-pointed, base layer                                                   |
| `src/content/copy.ts`                                                                                         | `copy` (kit JSON) + `copyExtra` (kit-missing strings, K11) + `IconName` type                                                                            |
| `src/components/Icon.astro`                                                                                   | `<svg class="rytm-icon"><use href="/rytm/icons/ui/ui.svg#id">`                                                                                          |
| `src/components/Brand.astro`                                                                                  | logo link (mark + wordmark), `tone: "ink" \| "paper"`                                                                                                   |
| `src/components/marketing/SiteHeader.astro`, `SiteFooter.astro`                                               | marketing chrome                                                                                                                                        |
| `src/components/app/AppHeader.astro`, `Sidebar.astro`, `MobileNav.astro`                                      | app chrome                                                                                                                                              |
| `src/components/app/PageTitle.astro`, `Panel.astro`, `InlineAlert.astro`, `EmptyState.astro`, `Stepper.astro` | app building blocks                                                                                                                                     |
| `src/layouts/Layout.astro`                                                                                    | `<html lang="pl">`, head, favicon, OG, config banner                                                                                                    |
| `src/layouts/MarketingLayout.astro`, `AuthLayout.astro`, `AppLayout.astro`                                    | the three shells                                                                                                                                        |
| `src/pages/*.astro`                                                                                           | one file per route (see Global Constraints)                                                                                                             |
| `src/pages/api/auth/{signin,signup,signout,reset}.ts`                                                         | form endpoints (zod-validated)                                                                                                                          |
| `src/components/auth/*.tsx`                                                                                   | `FormField`, `PasswordToggle`, `SubmitButton`, `ServerError`, `SignInForm`, `SignUpForm`, `ResetForm`                                                   |
| `src/components/ui/button.tsx`                                                                                | cva variants `primary`, `ghost`, `amber` (kit `.btn-*`)                                                                                                 |
| `src/middleware.ts`                                                                                           | protected routes + logged-in redirect from auth routes                                                                                                  |
| `scripts/smoke.mjs`                                                                                           | auth-flow smoke with new routes and `contains` assertions                                                                                               |
| `context/foundation/design-kit.md`                                                                            | K11, G17, G18, G19 rows                                                                                                                                 |

Deleted: `src/pages/dashboard.astro`, `src/pages/auth/*`, `src/components/Welcome.astro`, `src/components/Topbar.astro`, `src/components/ui/LibBadge.astro`, `public/favicon.png`, `public/template.png`.

---

### Task 1: Kit assets, tokens and Tailwind theme

**Files:**

- Create: `scripts/sync-kit.sh`, `public/rytm/**` (generated), `src/styles/brand.css` (generated)
- Modify: `src/styles/global.css` (replace whole file), `src/layouts/Layout.astro`
- Delete: `public/favicon.png`, `public/template.png`

**Interfaces:**

- Produces: Tailwind color names `ink`, `paper`, `paper-soft`, `excess`, `excess-text`, `muted`, `line`, `green`; `font-sans`; CSS classes from the kit: `.rytm-icon`, `.rytm-badge--{fixed,frequent,excess,excluded,new,changed}`, `.rytm-mark`; asset URLs under `/rytm/…`; `Layout` props `{ title: string; description?: string }`.

- [ ] **Step 1: Write the sync script**

```bash
cat > scripts/sync-kit.sh <<'SH'
#!/usr/bin/env bash
# Copies the design kit's React handoff into the app. Re-run after every kit delivery.
# design/ is read-only; this script only reads from it.
set -euo pipefail
cd "$(dirname "$0")/.."
KIT=design/rytm-os/react-kit
rm -rf public/rytm
mkdir -p public/rytm
cp -R "$KIT/assets/." public/rytm/
find public/rytm -name .DS_Store -delete
# brand.css verbatim, except the font path now points at public/rytm.
sed 's#url("../assets/fonts/Manrope-Variable.ttf")#url("/rytm/fonts/Manrope-Variable.ttf")#' "$KIT/styles/brand.css" > src/styles/brand.css
echo "kit synced: $(find public/rytm -type f | wc -l | tr -d ' ') assets, src/styles/brand.css"
SH
chmod +x scripts/sync-kit.sh && ./scripts/sync-kit.sh
```

Expected: `kit synced: N assets, src/styles/brand.css` and `grep -c '/rytm/fonts/Manrope-Variable.ttf' src/styles/brand.css` → `1`.

- [ ] **Step 2: Replace `src/styles/global.css`**

```css
@import "./brand.css";
@import "tailwindcss";
@import "tw-animate-css";

/* shadcn variables re-pointed at the kit tokens (MVP is light-only, G15). */
:root {
  --radius: 14px;
  --background: var(--rytm-paper);
  --foreground: var(--rytm-ink);
  --card: #fff;
  --card-foreground: var(--rytm-ink);
  --popover: #fff;
  --popover-foreground: var(--rytm-ink);
  --primary: var(--rytm-ink);
  --primary-foreground: var(--rytm-paper);
  --secondary: var(--rytm-paper-soft);
  --secondary-foreground: var(--rytm-ink);
  --muted: var(--rytm-paper-soft);
  --muted-foreground: var(--rytm-muted);
  --accent: var(--rytm-paper-soft);
  --accent-foreground: var(--rytm-ink);
  --destructive: var(--rytm-excess-text);
  --border: var(--rytm-line);
  --input: var(--rytm-line);
  --ring: var(--rytm-ink);
}

@theme inline {
  --font-sans: var(--rytm-font);
  --color-ink: var(--rytm-ink);
  --color-paper: var(--rytm-paper);
  --color-paper-soft: var(--rytm-paper-soft);
  --color-excess: var(--rytm-excess);
  --color-excess-text: var(--rytm-excess-text);
  --color-muted: var(--rytm-muted);
  --color-line: var(--rytm-line);
  --color-green: var(--rytm-green);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 6px);
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  html {
    @apply bg-paper text-ink font-sans antialiased;
  }
  body {
    @apply m-0 min-w-80;
  }
  h1,
  h2,
  h3 {
    @apply font-bold;
  }
  button,
  input {
    font: inherit;
  }
}
```

Note: `--color-muted` is the kit's text color (#606E7C); shadcn's `bg-muted` surface is intentionally not exposed — use `bg-paper-soft`. `text-muted-foreground` still works for shadcn components.

- [ ] **Step 3: Rewrite `src/layouts/Layout.astro`**

```astro
---
import "../styles/global.css";
import Banner from "@/components/Banner.astro";
import { missingConfigs } from "@/lib/config-status";
import { copy } from "@/content/copy";

interface Props {
  title: string;
  description?: string;
}

const { title, description = copy.brand.ogSentence } = Astro.props;
const fullTitle = `${title} — ${copy.brand.name}`;
const ogImage = new URL("/rytm/social/rytm-og-1200x630.png", Astro.url.origin).toString();
---

<!doctype html>
<html lang="pl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#202F40" />
    <meta name="description" content={description} />
    <meta property="og:title" content={fullTitle} />
    <meta property="og:description" content={description} />
    <meta property="og:image" content={ogImage} />
    <meta property="og:type" content="website" />
    <link rel="icon" type="image/svg+xml" href="/rytm/favicon/favicon.svg" />
    <link rel="alternate icon" href="/rytm/favicon/favicon.ico" />
    <title>{fullTitle}</title>
  </head>
  <body>
    {missingConfigs.map((cfg) => (
      <Banner variant="error">
        <strong>Uwaga:</strong> {cfg.message}
        {cfg.docsUrl && (
          <>
            {" "}
            <a href={cfg.docsUrl} target="_blank" rel="noopener noreferrer">
              {cfg.docsLabel ?? "Dokumentacja"}
            </a>
            .
          </>
        )}
      </Banner>
    ))}
    <slot />
  </body>
</html>
```

`@/content/copy` is created in Task 2; create a minimal stub now so this compiles:

```ts
// src/content/copy.ts (temporary; Task 2 replaces it)
import content from "../../design/rytm-os/react-kit/docs/content.json";
export const copy = content;
```

- [ ] **Step 4: Restyle `src/components/Banner.astro` with tokens** (replace the `<style>` block)

```astro
<style>
  .banner {
    padding: 0.75rem 1rem;
    font-size: 0.875rem;
    text-align: center;
    border-bottom: 1px solid var(--rytm-line);
    background: var(--rytm-paper-soft);
    color: var(--rytm-ink);
  }
  .banner :global(a) {
    color: inherit;
    text-decoration: underline;
    font-weight: 600;
  }
  .banner--error {
    color: var(--rytm-excess-text);
  }
</style>
```

- [ ] **Step 5: Delete starter public assets and verify**

```bash
git rm -q public/favicon.png public/template.png
npx astro check && npm run build
```

Expected: 0 errors (pages still use the old `Layout` without `title` — `dashboard.astro`, `index.astro` pass `title` or none: `index.astro` passes none → astro check error "title is required"). Fix by giving `index.astro` `<Layout title="Start">` for now (it is rewritten in Task 6).

Start the dev server (see "Verification tooling") and assert:

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:4321/rytm/fonts/Manrope-Variable.ttf   # 200
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:4321/rytm/favicon/favicon.svg          # 200
curl -s http://localhost:4321/ | grep -c 'lang="pl"'                                             # 1
curl -s http://localhost:4321/ | grep -c '/rytm/favicon/favicon.svg'                             # 1
```

- [ ] **Step 6: Commit**

```bash
git add scripts/sync-kit.sh public/rytm src/styles src/layouts/Layout.astro src/components/Banner.astro src/content/copy.ts src/pages/index.astro
git commit -m "ui: kit assets, brand tokens and Tailwind theme"
```

---

### Task 2: Copy module, Icon and Brand components, button variants

**Files:**

- Modify: `src/content/copy.ts` (replace stub), `src/components/ui/button.tsx`
- Create: `src/components/Icon.astro`, `src/components/Brand.astro`

**Interfaces:**

- Produces: `copy` (typed kit JSON), `copyExtra` (below), `type IconName`, `Icon` props `{ name: IconName; size?: 15 | 16 | 17 | 20 | 28; class?: string }`, `Brand` props `{ tone?: "ink" | "paper"; href?: string }`, `buttonVariants({ variant: "primary" | "ghost" | "amber", size?: "default" | "lg" | "full" })`.

- [ ] **Step 1: Write `src/content/copy.ts`**

```ts
import content from "../../design/rytm-os/react-kit/docs/content.json";

/** Kit copy — `design/rytm-os/react-kit/docs/content.json`, read-only. */
export const copy = content;

/**
 * Strings the prototype renders but content.json does not contain (design-kit.md K11).
 * Taken verbatim from design/rytm-os/prototype/app.js. Remove entries as the author adds keys.
 */
export const copyExtra = {
  auth: {
    loginVisual: {
      eyebrow: "Twój rytm",
      title: "Wróć do swojego rytmu.",
      lead: "Twoje wzorce wydatków czekają na kolejny miesiąc.",
    },
    registerVisual: {
      eyebrow: "Twój rytm",
      title: "Zacznij widzieć więcej.",
      lead: "Jedno konto, jeden spokojny widok Twoich wydatków.",
    },
    resetVisual: {
      eyebrow: "Spokojnie",
      title: "Hasło można ustawić na nowo.",
      lead: "Wyślemy Ci prostą instrukcję na adres przypisany do konta.",
    },
    optional: "opcjonalne",
    namePlaceholder: "np. Ola",
    emailPlaceholder: "ty@przyklad.pl",
    passwordPlaceholder: "••••••••",
    rememberMe: "Zapamiętaj mnie",
    forgotPassword: "Nie pamiętam hasła",
    terms: "Zakładając konto akceptujesz regulamin.",
    noAccount: "Nie masz jeszcze konta?",
    createIt: "Utwórz je",
    haveAccount: "Masz już konto?",
    resetEyebrow: "Nie pamiętam hasła",
    sendInstructions: "Wyślij instrukcję",
    backToLogin: "Wróć do logowania",
    checkInboxEyebrow: "Sprawdź skrzynkę",
    checkInboxTitle: "Link jest w drodze.",
    // DESIGN-GAP: G19 — confirm-e-mail page has no kit copy; reuses the reset "check inbox" composition.
    confirmEmailTitle: "Sprawdź skrzynkę.",
    confirmEmailBody: "Wysłaliśmy link aktywacyjny na podany adres e-mail. Kliknij go, aby dokończyć rejestrację.",
    // DESIGN-GAP: G16 — kit has no generic registration error copy.
    registerError: "Nie udało się utworzyć konta. Sprawdź adres e-mail i spróbuj ponownie.",
  },
  home: {
    emptyEyebrow: "Przegląd miesiąca",
    emptyTitle: "Zacznij od pierwszego importu.",
    emptyLead: "Rytm pokaże Ci wzorce, kiedy dostanie pierwszy wyciąg.",
    uploadCta: "+ Wgraj CSV",
  },
  imports: {
    eyebrow: "Importy CSV",
    title: "Twoje źródła danych.",
    lead: "Każdy import możesz cofnąć. Plik CSV nie jest przechowywany po imporcie.",
    newEyebrow: "Nowy import",
    newLead: "Wybierzesz jeden rachunek z pliku. Import obejmuje tylko obciążenia.",
    back: "Wróć do importów",
    dropTitle: "Upuść plik CSV tutaj",
    choose: "Wybierz plik",
  },
  patterns: { eyebrow: "Wzorce wydatków" },
  fixed: { eyebrow: "Koszty stałe", lead: "Rytm porównuje miesiące kalendarzowe i pokazuje różnice." },
  settings: { eyebrow: "Ustawienia / konto", lead: "Sprawdź dane i ustawienia prywatności." },
  app: {
    exit: "Wyjdź",
    sidebarView: "Widok",
    sidebarData: "Dane",
    patternsLong: "Wzorce wydatków",
    fixedLong: "Koszty stałe",
    importsLong: "Importy CSV",
    settingsLong: "Ustawienia",
    overview: "Przegląd",
  },
  landing: {
    stepsEyebrow: "Bez arkusza",
    stepsTitle: "Trzy kroki do jasności.",
    stepsNote: "Wystarczy jeden wieczór w miesiącu.",
    heroCardTop: "Twój miesiąc",
    heroCardSub: "wydatki rozpoznane",
    ctaTitle: ["Zobacz, gdzie cicho", "ucieka pieniądz."],
    ctaButton: "Utwórz konto",
  },
  howItWorks: {
    sequenceCaption: "Jedna granica, wiele powrotów",
    sequenceThreshold: "Twój próg",
    sequenceOver: "Ponad próg",
    stepsEyebrow: "Od pliku do obrazu",
    stepsTitle: "Trzy spokojne kroki.",
    stepsNote: "Bez ręcznego kategoryzowania.",
  },
  forWho: {
    cardsEyebrow: "Brzmi znajomo?",
    cardsTitle: "Rytm pasuje do Twojego tempa.",
    secondaryCta: "Zobacz jak działa",
  },
  // DESIGN-GAP: G18 — no kit copy for a view that is not available yet.
  stub: { info: "Ten widok pojawi się po pierwszym imporcie wyciągu." },
} as const;

export const ICON_NAMES = [
  "overview",
  "patterns",
  "fixed",
  "import",
  "settings",
  "upload",
  "merge",
  "switch",
  "exclude",
  "edit",
  "search",
  "sort",
  "close",
  "arrow",
  "arrow-left",
  "more",
  "warning",
  "success",
  "info",
] as const;
export type IconName = (typeof ICON_NAMES)[number];
```

- [ ] **Step 2: Create `src/components/Icon.astro`**

```astro
---
import type { IconName } from "@/content/copy";
import { cn } from "@/lib/utils";

interface Props {
  name: IconName;
  size?: 15 | 16 | 17 | 20 | 28;
  class?: string;
}

const { name, size = 16, class: className } = Astro.props;
---

<svg
  class={cn("rytm-icon inline-block shrink-0 align-[-0.18em]", className)}
  width={size}
  height={size}
  viewBox="0 0 24 24"
  aria-hidden="true"
>
  <use href={`/rytm/icons/ui/ui.svg#${name}`}></use>
</svg>
```

- [ ] **Step 3: Create `src/components/Brand.astro`** (mark geometry is the kit's, from `prototype/app.js` `mark()`)

```astro
---
import { copy } from "@/content/copy";
import { cn } from "@/lib/utils";

interface Props {
  tone?: "ink" | "paper";
  href?: string;
}

const { tone = "ink", href = "/" } = Astro.props;
---

<a
  href={href}
  class={cn(
    "inline-flex items-center gap-[13px] text-[22px] font-extrabold tracking-[-0.04em] no-underline max-[559px]:text-xl",
    tone === "paper" ? "text-paper" : "text-ink",
  )}
>
  <svg class="block h-[31px] w-[27px]" viewBox="0 0 32 32" aria-hidden="true">
    <path fill="currentColor" fill-rule="evenodd" d="M5 29V3h13l9 9-8 8 9 9h-8l-9-9v9zm6-21v8h5l4-4-4-4z"></path>
  </svg>
  <span>{copy.brand.name}</span>
</a>
```

- [ ] **Step 4: Rewrite `src/components/ui/button.tsx` variants** (keep the component function as is; replace `buttonVariants`)

```tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[9px] border-0 text-sm font-bold transition-all duration-150 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 outline-none focus-visible:ring-[3px] focus-visible:ring-ink/15",
  {
    variants: {
      variant: {
        primary: "bg-ink text-paper hover:bg-ink/90 hover:-translate-y-px",
        ghost: "bg-transparent text-ink border border-line hover:border-ink",
        amber: "bg-excess text-ink hover:bg-excess/90",
      },
      size: {
        default: "px-[18px] py-3",
        lg: "h-[47px] px-[18px]",
        full: "h-[47px] w-full px-[18px]",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  },
);
```

- [ ] **Step 5: Verify**

```bash
npx astro check && npm run build
```

Expected: 0 errors. (Existing `SubmitButton` passes `className` only, so the variant change compiles; its look is fixed in Task 3.)

- [ ] **Step 6: Commit**

```bash
git add src/content/copy.ts src/components/Icon.astro src/components/Brand.astro src/components/ui/button.tsx
git commit -m "ui: copy module, Icon and Brand components, kit button variants"
```

---

### Task 3: Auth form primitives in kit style

**Files:**

- Modify: `src/components/auth/FormField.tsx`, `PasswordToggle.tsx`, `SubmitButton.tsx`, `ServerError.tsx`

**Interfaces:**

- Produces: `FormField` props `{ id; name?; label; type?; value; onChange; placeholder?; error?; hint?; endContent?; optionalLabel?: string; autoComplete?: string }` (no `icon` prop any more), `PasswordToggle { visible; onToggle; showLabel: string; hideLabel: string }`, `SubmitButton { pendingText; children }`, `ServerError { message?: string | null }` (renders the kit `inline-alert error`).

- [ ] **Step 1: Rewrite `FormField.tsx`** (kit `.field`)

```tsx
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  id: string;
  name?: string;
  label: string;
  optionalLabel?: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  error?: string;
  hint?: ReactNode;
  endContent?: ReactNode;
}

export function FormField({
  id,
  name,
  label,
  optionalLabel,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
  error,
  hint,
  endContent,
}: FormFieldProps) {
  return (
    <div className="my-[15px] grid gap-2">
      <label htmlFor={id} className="text-[13px] font-bold">
        {label}
        {optionalLabel && <span className="text-muted ml-1.5 font-medium">{optionalLabel}</span>}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name ?? id}
          type={type}
          value={value}
          autoComplete={autoComplete}
          aria-invalid={error ? true : undefined}
          onChange={(e) => {
            onChange(e.target.value);
          }}
          placeholder={placeholder}
          className={cn(
            "text-ink placeholder:text-muted/70 focus:border-ink focus:ring-ink/8 w-full rounded-lg border bg-white px-3.5 py-[13px] transition-colors outline-none focus:ring-[3px]",
            error ? "border-excess-text" : "border-line",
            endContent && "pr-11",
          )}
        />
        {endContent}
      </div>
      {error ? <p className="text-excess-text text-xs font-semibold">{error}</p> : hint}
    </div>
  );
}
```

- [ ] **Step 2: Rewrite `PasswordToggle.tsx`** (no lucide; the kit sprite has no eye icon — text toggle, which the kit's `/components` page also uses for secondary actions)

```tsx
interface PasswordToggleProps {
  visible: boolean;
  onToggle: () => void;
  showLabel: string;
  hideLabel: string;
}

export function PasswordToggle({ visible, onToggle, showLabel, hideLabel }: PasswordToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="text-muted hover:text-ink absolute top-1/2 right-3 -translate-y-1/2 text-xs font-bold"
      aria-pressed={visible}
    >
      {visible ? hideLabel : showLabel}
    </button>
  );
}
```

Add to `copyExtra.auth` in `src/content/copy.ts`: `showPassword: "Pokaż", hidePassword: "Ukryj",` (DESIGN-GAP: G16 — no kit copy for the toggle).

- [ ] **Step 3: Rewrite `SubmitButton.tsx`**

```tsx
import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

interface SubmitButtonProps {
  pendingText: string;
  children: ReactNode;
}

export function SubmitButton({ pendingText, children }: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" size="full" disabled={pending}>
      {pending ? pendingText : children}
      {!pending && <span aria-hidden="true">↗</span>}
    </Button>
  );
}
```

- [ ] **Step 4: Rewrite `ServerError.tsx`** (kit `.inline-alert.error`; the warning icon comes from the sprite via `<use>` — works inside React too)

```tsx
interface ServerErrorProps {
  message?: string | null;
}

export function ServerError({ message }: ServerErrorProps) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="bg-excess/25 text-excess-text mb-2 flex items-start gap-2 rounded-lg px-[13px] py-3 text-[13px] leading-snug"
    >
      <svg className="rytm-icon mt-px shrink-0" width={16} height={16} viewBox="0 0 24 24" aria-hidden="true">
        <use href="/rytm/icons/ui/ui.svg#warning" />
      </svg>
      <span>{message}</span>
    </div>
  );
}
```

- [ ] **Step 5: Verify**

```bash
npx astro check
```

Expected: errors only in `SignInForm.tsx` / `SignUpForm.tsx` (they still pass `icon=` and the old `PasswordToggle` props). That is the input for Task 4 — do not fix them here. `npm run build` may also fail for the same reason; that is acceptable for this task only.

- [ ] **Step 6: Commit**

```bash
git add src/components/auth/FormField.tsx src/components/auth/PasswordToggle.tsx src/components/auth/SubmitButton.tsx src/components/auth/ServerError.tsx src/content/copy.ts
git commit -m "ui: auth form primitives in kit style"
```

---

### Task 4: Routes contract — middleware, API redirects, smoke test

**Files:**

- Modify: `src/middleware.ts`, `src/pages/api/auth/signin.ts`, `signup.ts`, `signout.ts`, `scripts/smoke.mjs`
- Create: `src/pages/api/auth/reset.ts`

**Interfaces:**

- Produces: `POST /api/auth/signin` → `302 /home` or `302 /login?error=1`; `POST /api/auth/signup` (fields `email`, `password`, optional `name`) → `302 /confirm-email` or `302 /register?error=1`; `POST /api/auth/signout` → `302 /`; `POST /api/auth/reset` (field `email`) → always `302 /reset?sent=1`. Middleware: anonymous on `/home|/patterns|/fixed|/imports|/settings` → `302 /login`; signed-in on `/login|/register` → `302 /home`.

- [ ] **Step 1: Update `scripts/smoke.mjs` to the new contract (this is the failing test)**

Replace the `request` helper's return and the `steps` array:

```js
async function request(path, { method = "GET", form } = {}) {
  const response = await fetch(BASE_URL + path, {
    method,
    redirect: "manual",
    headers: {
      Cookie: cookieHeader(),
      Origin: BASE_URL,
      ...(form ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    body: form ? new URLSearchParams(form).toString() : undefined,
  });
  storeCookies(response);
  const body = response.status === 200 ? await response.text() : "";
  return { status: response.status, location: response.headers.get("location") ?? "", body };
}

const steps = [
  ["landing renders", () => request("/"), { status: 200, contains: "Zobacz swój rytm" }],
  ["login renders", () => request("/login"), { status: 200, contains: "Zaloguj się" }],
  ["home redirects anonymous user", () => request("/home"), { status: 302, location: "/login" }],
  ["settings redirects anonymous user", () => request("/settings"), { status: 302, location: "/login" }],
  [
    "signup creates account",
    () => request("/api/auth/signup", { method: "POST", form: { email, password } }),
    { status: 302, location: "/confirm-email" },
  ],
  [
    "signin rejects wrong password",
    () => request("/api/auth/signin", { method: "POST", form: { email, password: "wrong" } }),
    { status: 302, location: "/login?error=1" },
  ],
  [
    "signin accepts correct password",
    () => request("/api/auth/signin", { method: "POST", form: { email, password } }),
    { status: 302, location: "/home" },
  ],
  [
    "home renders empty state for signed-in user",
    () => request("/home"),
    { status: 200, contains: "Nie masz jeszcze żadnego importu." },
  ],
  ["login redirects signed-in user", () => request("/login"), { status: 302, location: "/home" }],
  [
    "reset always says check inbox",
    () => request("/api/auth/reset", { method: "POST", form: { email: "nobody@example.com" } }),
    { status: 302, location: "/reset?sent=1" },
  ],
  ["signout clears session", () => request("/api/auth/signout", { method: "POST" }), { status: 302, location: "/" }],
  ["home redirects after signout", () => request("/home"), { status: 302, location: "/login" }],
];
```

and the check inside the loop:

```js
const ok =
  actual.status === expected.status &&
  (expected.location === undefined || actual.location.startsWith(expected.location)) &&
  (expected.contains === undefined || actual.body.includes(expected.contains));
```

Update the first comment line to: `// Smoke test: proves the built app, the Vercel adapter and the Supabase auth flow still work together.` (already says that) and the expected line printout to include `expected.contains ?? ""`.

- [ ] **Step 2: Run it to see it fail** (dev server up, local Supabase running — or skip to CI later and continue)

```bash
BASE_URL=http://localhost:4321 npm run smoke
```

Expected: `FAIL` on "login renders" (404), "home redirects" (`/dashboard`-era routes), etc.

- [ ] **Step 3: Rewrite `src/middleware.ts`**

```ts
import { defineMiddleware } from "astro:middleware";
import { createClient } from "@/lib/supabase";

const PROTECTED_ROUTES = ["/home", "/patterns", "/fixed", "/imports", "/settings"];
const AUTH_ROUTES = ["/login", "/register"];

export const onRequest = defineMiddleware(async (context, next) => {
  const supabase = createClient(context.request.headers, context.cookies);

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    context.locals.user = user ?? null;
  } else {
    context.locals.user = null;
  }

  const path = context.url.pathname;
  const isProtected = PROTECTED_ROUTES.some((route) => path === route || path.startsWith(`${route}/`));
  const isAuthRoute = AUTH_ROUTES.includes(path);

  if (isProtected && !context.locals.user) {
    return context.redirect("/login");
  }
  if (isAuthRoute && context.locals.user) {
    return context.redirect("/home");
  }

  return next();
});
```

- [ ] **Step 4: Rewrite the API routes with zod**

`src/pages/api/auth/signin.ts`:

```ts
import type { APIRoute } from "astro";
import { z } from "zod";
import { createClient } from "@/lib/supabase";

export const prerender = false;

const schema = z.object({ email: z.string().trim().email(), password: z.string().min(1) });

export const POST: APIRoute = async (context) => {
  const form = Object.fromEntries(await context.request.formData());
  const parsed = schema.safeParse(form);
  const supabase = createClient(context.request.headers, context.cookies);
  if (!parsed.success || !supabase) {
    return context.redirect("/login?error=1");
  }
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return context.redirect("/login?error=1");
  }
  return context.redirect("/home");
};
```

`src/pages/api/auth/signup.ts`:

```ts
import type { APIRoute } from "astro";
import { z } from "zod";
import { createClient } from "@/lib/supabase";

export const prerender = false;

const schema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6),
  name: z
    .string()
    .trim()
    .max(80)
    .optional()
    .transform((v) => (v ? v : undefined)),
});

export const POST: APIRoute = async (context) => {
  const form = Object.fromEntries(await context.request.formData());
  const parsed = schema.safeParse(form);
  const supabase = createClient(context.request.headers, context.cookies);
  if (!parsed.success || !supabase) {
    return context.redirect("/register?error=1");
  }
  const { email, password, name } = parsed.data;
  const { error } = await supabase.auth.signUp({ email, password, options: name ? { data: { name } } : undefined });
  if (error) {
    return context.redirect("/register?error=1");
  }
  return context.redirect("/confirm-email");
};
```

`src/pages/api/auth/signout.ts`: add `export const prerender = false;` after the imports; body unchanged (redirects to `/`).

`src/pages/api/auth/reset.ts`:

```ts
import type { APIRoute } from "astro";
import { z } from "zod";
import { createClient } from "@/lib/supabase";

export const prerender = false;

const schema = z.object({ email: z.string().trim().email() });

// Always answers "check your inbox" — never reveals whether the account exists.
export const POST: APIRoute = async (context) => {
  const form = Object.fromEntries(await context.request.formData());
  const parsed = schema.safeParse(form);
  const supabase = createClient(context.request.headers, context.cookies);
  if (parsed.success && supabase) {
    // /reset/new is the G17 page (not built yet); the link in the e-mail 404s until it ships.
    const redirectTo = new URL("/reset/new", context.url.origin).toString();
    await supabase.auth.resetPasswordForEmail(parsed.data.email, { redirectTo });
  }
  return context.redirect("/reset?sent=1");
};
```

- [ ] **Step 5: Verify what can be verified now**

```bash
npx astro check
curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' http://localhost:4321/home        # 302 http://localhost:4321/login
curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' -X POST -d 'email=nobody@example.com' http://localhost:4321/api/auth/reset   # 302 …/reset?sent=1
```

(`/login` itself is still 404 until Task 5; the smoke run stays red until Tasks 5–7 land.)

- [ ] **Step 6: Commit**

```bash
git add scripts/smoke.mjs src/middleware.ts src/pages/api/auth
git commit -m "auth: kit routes in middleware and API redirects, zod validation, reset endpoint, smoke contract"
```

---

### Task 5: Auth pages — AuthLayout, login, register, reset, confirm-email

**Files:**

- Create: `src/layouts/AuthLayout.astro`, `src/pages/login.astro`, `src/pages/register.astro`, `src/pages/reset.astro`, `src/pages/confirm-email.astro`, `src/components/auth/ResetForm.tsx`
- Modify: `src/components/auth/SignInForm.tsx`, `SignUpForm.tsx`
- Delete: `src/pages/auth/signin.astro`, `signup.astro`, `confirm-email.astro`

**Interfaces:**

- Consumes: `FormField`, `PasswordToggle`, `SubmitButton`, `ServerError` (Task 3), `copy`/`copyExtra` (Task 2), `Brand` (Task 2), `buttonVariants` (Task 2).
- Produces: `AuthLayout` props `{ title: string; visual: { eyebrow: string; title: string; lead: string } }`; forms receive all copy as a `labels` prop (serializable — they are islands).

- [ ] **Step 1: Create `src/layouts/AuthLayout.astro`** (prototype `.auth-shell`)

```astro
---
import Layout from "@/layouts/Layout.astro";
import Brand from "@/components/Brand.astro";

interface Props {
  title: string;
  visual: { eyebrow: string; title: string; lead: string };
}

const { title, visual } = Astro.props;
---

<Layout title={title}>
  <div class="grid min-h-screen grid-cols-2 max-[899px]:grid-cols-1">
    <aside class="relative overflow-hidden bg-ink p-[52px] text-paper max-[899px]:min-h-[290px] max-[899px]:p-7">
      <span
        class="pointer-events-none absolute -right-[260px] -bottom-[190px] size-[580px] rounded-full border border-paper/15"
        aria-hidden="true"
      ></span>
      <Brand tone="paper" />
      <div class="absolute bottom-[68px] left-[52px] max-w-[430px] max-[899px]:static max-[899px]:mt-[62px]">
        <div class="text-xs font-extrabold tracking-[0.14em] text-excess uppercase">{visual.eyebrow}</div>
        <h1 class="my-[18px] text-[52px] leading-[0.98] tracking-[-0.07em] max-[899px]:text-[37px]">{visual.title}</h1>
        <p class="leading-relaxed text-paper/75">{visual.lead}</p>
      </div>
    </aside>
    <main class="flex items-center justify-center p-[42px] max-[899px]:px-[25px] max-[899px]:py-[45px]">
      <div class="w-full max-w-[390px]">
        <slot />
      </div>
    </main>
  </div>
</Layout>
```

- [ ] **Step 2: Rewrite `SignInForm.tsx`**

```tsx
import React, { useState } from "react";
import { FormField } from "@/components/auth/FormField";
import { PasswordToggle } from "@/components/auth/PasswordToggle";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { ServerError } from "@/components/auth/ServerError";

export interface SignInLabels {
  email: string;
  password: string;
  emailPlaceholder: string;
  passwordPlaceholder: string;
  showPassword: string;
  hidePassword: string;
  submit: string;
  pending: string;
  emailRequired: string;
  passwordRequired: string;
}

interface Props {
  labels: SignInLabels;
  serverError?: string | null;
}

export default function SignInForm({ labels, serverError }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  function validate() {
    const next: typeof errors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = labels.emailRequired;
    if (!password) next.password = labels.passwordRequired;
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    if (!validate()) e.preventDefault();
  }

  return (
    <form method="POST" action="/api/auth/signin" onSubmit={handleSubmit} noValidate>
      <ServerError message={serverError} />
      <FormField
        id="email"
        type="email"
        autoComplete="email"
        label={labels.email}
        value={email}
        onChange={(v) => {
          setEmail(v);
          setErrors((p) => ({ ...p, email: undefined }));
        }}
        placeholder={labels.emailPlaceholder}
        error={errors.email}
      />
      <FormField
        id="password"
        type={showPassword ? "text" : "password"}
        autoComplete="current-password"
        label={labels.password}
        value={password}
        onChange={(v) => {
          setPassword(v);
          setErrors((p) => ({ ...p, password: undefined }));
        }}
        placeholder={labels.passwordPlaceholder}
        error={errors.password}
        endContent={
          <PasswordToggle
            visible={showPassword}
            onToggle={() => {
              setShowPassword(!showPassword);
            }}
            showLabel={labels.showPassword}
            hideLabel={labels.hidePassword}
          />
        }
      />
      <div className="mt-2 mb-[22px]">
        <SubmitButton pendingText={labels.pending}>{labels.submit}</SubmitButton>
      </div>
    </form>
  );
}
```

Add to `copyExtra.auth` in `copy.ts` (DESIGN-GAP: G16 — kit has no field-validation copy): `emailRequired: "Podaj poprawny adres e-mail.", passwordRequired: "Podaj hasło.", passwordTooShort: "Hasło musi mieć co najmniej 6 znaków.", signingIn: "Logowanie…", creating: "Tworzenie konta…", sending: "Wysyłanie…"`.

- [ ] **Step 3: Rewrite `SignUpForm.tsx`** (optional name, no confirm-password — the kit form has none)

```tsx
import React, { useState } from "react";
import { FormField } from "@/components/auth/FormField";
import { PasswordToggle } from "@/components/auth/PasswordToggle";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { ServerError } from "@/components/auth/ServerError";

const MIN_PASSWORD_LENGTH = 6;

export interface SignUpLabels {
  name: string;
  optional: string;
  namePlaceholder: string;
  email: string;
  password: string;
  emailPlaceholder: string;
  passwordPlaceholder: string;
  showPassword: string;
  hidePassword: string;
  terms: string;
  submit: string;
  pending: string;
  emailRequired: string;
  passwordTooShort: string;
}

interface Props {
  labels: SignUpLabels;
  serverError?: string | null;
}

export default function SignUpForm({ labels, serverError }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  function validate() {
    const next: typeof errors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = labels.emailRequired;
    if (password.length < MIN_PASSWORD_LENGTH) next.password = labels.passwordTooShort;
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    if (!validate()) e.preventDefault();
  }

  return (
    <form method="POST" action="/api/auth/signup" onSubmit={handleSubmit} noValidate>
      <ServerError message={serverError} />
      <FormField
        id="name"
        autoComplete="given-name"
        label={labels.name}
        optionalLabel={labels.optional}
        value={name}
        onChange={setName}
        placeholder={labels.namePlaceholder}
      />
      <FormField
        id="email"
        type="email"
        autoComplete="email"
        label={labels.email}
        value={email}
        onChange={(v) => {
          setEmail(v);
          setErrors((p) => ({ ...p, email: undefined }));
        }}
        placeholder={labels.emailPlaceholder}
        error={errors.email}
      />
      <FormField
        id="password"
        type={showPassword ? "text" : "password"}
        autoComplete="new-password"
        label={labels.password}
        value={password}
        onChange={(v) => {
          setPassword(v);
          setErrors((p) => ({ ...p, password: undefined }));
        }}
        placeholder={labels.passwordPlaceholder}
        error={errors.password}
        endContent={
          <PasswordToggle
            visible={showPassword}
            onToggle={() => {
              setShowPassword(!showPassword);
            }}
            showLabel={labels.showPassword}
            hideLabel={labels.hidePassword}
          />
        }
      />
      <p className="text-muted my-[11px] mb-[22px] text-xs">{labels.terms}</p>
      <SubmitButton pendingText={labels.pending}>{labels.submit}</SubmitButton>
    </form>
  );
}
```

- [ ] **Step 4: Create `ResetForm.tsx`**

```tsx
import React, { useState } from "react";
import { FormField } from "@/components/auth/FormField";
import { SubmitButton } from "@/components/auth/SubmitButton";

export interface ResetLabels {
  email: string;
  emailPlaceholder: string;
  submit: string;
  pending: string;
  emailRequired: string;
}

export default function ResetForm({ labels }: { labels: ResetLabels }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();

  function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError(labels.emailRequired);
      e.preventDefault();
    }
  }

  return (
    <form method="POST" action="/api/auth/reset" onSubmit={handleSubmit} noValidate>
      <FormField
        id="email"
        type="email"
        autoComplete="email"
        label={labels.email}
        value={email}
        onChange={(v) => {
          setEmail(v);
          setError(undefined);
        }}
        placeholder={labels.emailPlaceholder}
        error={error}
      />
      <div className="mt-2">
        <SubmitButton pendingText={labels.pending}>{labels.submit}</SubmitButton>
      </div>
    </form>
  );
}
```

- [ ] **Step 5: Create `src/pages/login.astro`**

```astro
---
import AuthLayout from "@/layouts/AuthLayout.astro";
import SignInForm from "@/components/auth/SignInForm";
import { copy, copyExtra } from "@/content/copy";

const hasError = Astro.url.searchParams.has("error");
const a = copy.auth;
const x = copyExtra.auth;
---

<AuthLayout title={a.login.title} visual={x.loginVisual}>
  <div class="text-xs font-extrabold tracking-[0.14em] text-excess-text uppercase">{a.login.eyebrow}</div>
  <h1 class="mt-4 mb-2 text-[34px] tracking-[-0.06em]">{a.login.title}</h1>
  <p class="mb-7 text-sm text-muted">{a.login.description}</p>
  <SignInForm
    client:load
    serverError={hasError ? copy.authStates.loginError : null}
    labels={{
      email: a.fields.email,
      password: a.fields.password,
      emailPlaceholder: x.emailPlaceholder,
      passwordPlaceholder: x.passwordPlaceholder,
      showPassword: x.showPassword,
      hidePassword: x.hidePassword,
      submit: copy.navigation.login,
      pending: x.signingIn,
      emailRequired: x.emailRequired,
      passwordRequired: x.passwordRequired,
    }}
  />
  {/* "Nie pamiętam hasła" link intentionally absent until G17 (set-new-password page) exists — see design-kit.md. */}
  <p class="text-center text-[13px] text-muted">
    {x.noAccount}{" "}
    <a href="/register" class="font-bold text-excess-text">
      {x.createIt}
    </a>
  </p>
</AuthLayout>
```

- [ ] **Step 6: Create `src/pages/register.astro`**

```astro
---
import AuthLayout from "@/layouts/AuthLayout.astro";
import SignUpForm from "@/components/auth/SignUpForm";
import { copy, copyExtra } from "@/content/copy";

const hasError = Astro.url.searchParams.has("error");
const a = copy.auth;
const x = copyExtra.auth;
---

<AuthLayout title={a.register.title} visual={x.registerVisual}>
  <div class="text-xs font-extrabold tracking-[0.14em] text-excess-text uppercase">{a.register.eyebrow}</div>
  <h1 class="mt-4 mb-2 text-[34px] tracking-[-0.06em]">{a.register.title}</h1>
  <p class="mb-7 text-sm text-muted">{a.register.description}</p>
  <SignUpForm
    client:load
    serverError={hasError ? x.registerError : null}
    labels={{
      name: a.fields.name,
      optional: x.optional,
      namePlaceholder: x.namePlaceholder,
      email: a.fields.email,
      password: a.fields.password,
      emailPlaceholder: x.emailPlaceholder,
      passwordPlaceholder: x.passwordPlaceholder,
      showPassword: x.showPassword,
      hidePassword: x.hidePassword,
      terms: x.terms,
      submit: a.register.title,
      pending: x.creating,
      emailRequired: x.emailRequired,
      passwordTooShort: x.passwordTooShort,
    }}
  />
  <p class="mt-[22px] text-center text-[13px] text-muted">
    {x.haveAccount}{" "}
    <a href="/login" class="font-bold text-excess-text">
      {copy.navigation.login}
    </a>
  </p>
</AuthLayout>
```

- [ ] **Step 7: Create `src/pages/reset.astro`** (two states: form, and `?sent=1`)

```astro
---
import AuthLayout from "@/layouts/AuthLayout.astro";
import ResetForm from "@/components/auth/ResetForm";
import { buttonVariants } from "@/components/ui/button";
import { copy, copyExtra } from "@/content/copy";

const sent = Astro.url.searchParams.has("sent");
const s = copy.authStates;
const x = copyExtra.auth;
---

<AuthLayout title={s.resetTitle} visual={x.resetVisual}>
  {sent ? (
    <>
      <div class="text-xs font-extrabold tracking-[0.14em] text-excess-text uppercase">{x.checkInboxEyebrow}</div>
      <h1 class="mt-4 mb-2 text-[34px] tracking-[-0.06em]">{x.checkInboxTitle}</h1>
      <p class="mb-7 text-sm text-muted">{s.checkInbox}</p>
      <a href="/login" class={buttonVariants({ variant: "primary", size: "full" })}>
        {x.backToLogin}
      </a>
    </>
  ) : (
    <>
      <div class="text-xs font-extrabold tracking-[0.14em] text-excess-text uppercase">{x.resetEyebrow}</div>
      <h1 class="mt-4 mb-2 text-[34px] tracking-[-0.06em]">{s.resetTitle}</h1>
      <p class="mb-7 text-sm text-muted">{s.resetBody}</p>
      <ResetForm
        client:load
        labels={{
          email: copy.auth.fields.email,
          emailPlaceholder: x.emailPlaceholder,
          submit: x.sendInstructions,
          pending: x.sending,
          emailRequired: x.emailRequired,
        }}
      />
      <p class="mt-[22px] text-center text-[13px] text-muted">
        <a href="/login" class="font-bold text-excess-text">
          {x.backToLogin}
        </a>
      </p>
    </>
  )}
</AuthLayout>
```

- [ ] **Step 8: Create `src/pages/confirm-email.astro`** (DESIGN-GAP: G19)

```astro
---
// DESIGN-GAP: G19 — no kit screen for "confirm your e-mail"; reuses the reset "check inbox" composition.
import AuthLayout from "@/layouts/AuthLayout.astro";
import { buttonVariants } from "@/components/ui/button";
import { copyExtra } from "@/content/copy";

const x = copyExtra.auth;
---

<AuthLayout title={x.confirmEmailTitle} visual={x.registerVisual}>
  <div class="text-xs font-extrabold tracking-[0.14em] text-excess-text uppercase">{x.checkInboxEyebrow}</div>
  <h1 class="mt-4 mb-2 text-[34px] tracking-[-0.06em]">{x.confirmEmailTitle}</h1>
  <p class="mb-7 text-sm text-muted">{x.confirmEmailBody}</p>
  <a href="/login" class={buttonVariants({ variant: "primary", size: "full" })}>
    {x.backToLogin}
  </a>
</AuthLayout>
```

- [ ] **Step 9: Delete the starter auth pages and verify**

```bash
git rm -q -r src/pages/auth
npx astro check && npm run build
```

Dev server assertions:

```bash
curl -s http://localhost:4321/login | grep -c 'Zaloguj się'                         # ≥ 2 (title + button)
curl -s http://localhost:4321/login | grep -c 'Nie pamiętam hasła'                  # 0  (hidden until G17)
curl -s 'http://localhost:4321/login?error=1' | grep -c 'Nie rozpoznaliśmy'         # 1
curl -s http://localhost:4321/register | grep -c 'opcjonalne'                       # 1
curl -s 'http://localhost:4321/reset?sent=1' | grep -c 'Link jest w drodze'         # 1
curl -s http://localhost:4321/confirm-email | grep -c 'DESIGN-GAP'                  # 0  (comment must not leak into HTML)
```

- [ ] **Step 10: Commit**

```bash
git add src/layouts/AuthLayout.astro src/pages/login.astro src/pages/register.astro src/pages/reset.astro src/pages/confirm-email.astro src/components/auth src/content/copy.ts
git commit -m "ui: auth pages from the kit (login, register, reset, confirm-email)"
```

---

### Task 6: Marketing pages — MarketingLayout, landing, how-it-works, for-who

**Files:**

- Create: `src/components/marketing/SiteHeader.astro`, `SiteFooter.astro`, `src/layouts/MarketingLayout.astro`, `src/pages/how-it-works.astro`, `src/pages/for-who.astro`
- Modify: `src/pages/index.astro` (replace)
- Delete: `src/components/Welcome.astro`, `src/components/Topbar.astro`, `src/components/ui/LibBadge.astro`

**Interfaces:**

- Consumes: `Brand`, `buttonVariants`, `copy`, `copyExtra`.
- Produces: `MarketingLayout` props `{ title: string; description?: string }`; shared class strings `eyebrow` / `h1` patterns as used below.

- [ ] **Step 1: `SiteHeader.astro`** (identical for anonymous and signed-in users — decision 2026-09-18)

```astro
---
import Brand from "@/components/Brand.astro";
import { buttonVariants } from "@/components/ui/button";
import { copy } from "@/content/copy";
import { cn } from "@/lib/utils";

const nav = copy.navigation;
---

<header class="flex h-[78px] items-center justify-between border-b border-ink/10 max-[559px]:h-[68px]">
  <Brand />
  <nav class="flex items-center gap-[27px] max-[899px]:gap-[13px]">
    <a href="/how-it-works" class="text-sm font-semibold text-muted hover:text-ink max-[899px]:hidden">
      {nav.howItWorks}
    </a>
    <a href="/for-who" class="text-sm font-semibold text-muted hover:text-ink max-[559px]:text-xs">
      {nav.forWho}
    </a>
    <a href="/login" class={cn(buttonVariants({ variant: "ghost" }), "max-[559px]:text-xs")}>
      {nav.login}
    </a>
    <a href="/register" class={cn(buttonVariants({ variant: "primary" }), "max-[559px]:text-xs")}>
      {nav.start}
    </a>
  </nav>
</header>
```

- [ ] **Step 2: `SiteFooter.astro`** (year rendered dynamically — K7)

```astro
---
import { copy } from "@/content/copy";

const f = copy.footer;
const year = new Date().getFullYear();
---

<footer class="flex justify-between border-t border-line py-7 text-xs text-muted max-[559px]:block max-[559px]:leading-loose">
  <span>{f.copyright.replace("{year}", String(year))}</span>
  <span>
    <a href="#" class="ml-[18px] text-muted no-underline max-[559px]:mr-[15px] max-[559px]:ml-0">
      {f.privacy}
    </a>
    <a href="#" class="ml-[18px] text-muted no-underline max-[559px]:mr-[15px] max-[559px]:ml-0">
      {f.contact}
    </a>
  </span>
</footer>
```

- [ ] **Step 3: `MarketingLayout.astro`**

```astro
---
import Layout from "@/layouts/Layout.astro";
import SiteHeader from "@/components/marketing/SiteHeader.astro";
import SiteFooter from "@/components/marketing/SiteFooter.astro";

interface Props {
  title: string;
  description?: string;
}

const { title, description } = Astro.props;
---

<Layout title={title} description={description}>
  <div class="min-h-screen">
    <div class="mx-auto max-w-[1180px] px-[34px] max-[559px]:px-5">
      <SiteHeader />
      <main>
        <slot />
      </main>
      <SiteFooter />
    </div>
  </div>
</Layout>
```

- [ ] **Step 4: `src/pages/index.astro`** (prototype `landing()`; hero card is decorative CSS)

```astro
---
import MarketingLayout from "@/layouts/MarketingLayout.astro";
import { buttonVariants } from "@/components/ui/button";
import { copy, copyExtra } from "@/content/copy";

const l = copy.landing;
const x = copyExtra.landing;
const eyebrow = "text-xs font-extrabold tracking-[0.14em] text-excess-text uppercase";
const barHeights = ["32%", "49%", "41%", "65%", "54%", "72%", "88%", "62%"];
---

<MarketingLayout title={l.primaryCta} description={l.description}>
  <section class="grid grid-cols-[1.05fr_0.95fr] items-center gap-20 py-[88px] pb-[100px] max-[899px]:grid-cols-1 max-[899px]:gap-[45px] max-[899px]:pt-[55px]">
    <div>
      <div class={eyebrow}>{l.eyebrow}</div>
      <h1 class="my-[17px] mb-6 max-w-[700px] text-[clamp(46px,6.3vw,82px)] leading-[0.98] tracking-[-0.075em] max-[559px]:text-[50px]">
        {l.headline[0]}
        <br />
        <span class="text-excess-text">{l.headline[1]}</span>
      </h1>
      <p class="mb-8 max-w-[520px] text-lg leading-relaxed text-muted max-[559px]:text-base">{l.description}</p>
      <div class="flex items-center gap-3 max-[559px]:flex-col max-[559px]:items-stretch">
        <a href="/register" class={buttonVariants({ variant: "primary" })}>
          {l.primaryCta} <span aria-hidden="true">↗</span>
        </a>
        <a href="/how-it-works" class={buttonVariants({ variant: "ghost" })}>
          {l.secondaryCta}
        </a>
      </div>
      <div class="mt-[17px] text-xs text-muted">{l.note}</div>
    </div>
    <div
      class="relative overflow-hidden rounded-[20px] bg-ink p-7 text-paper shadow-[0_18px_48px_rgba(32,47,64,0.08)] max-[899px]:max-w-[560px]"
      aria-hidden="true"
    >
      <span class="absolute -right-10 -bottom-[120px] size-[290px] rounded-full border border-paper/15"></span>
      <div class="flex items-center justify-between text-xs text-paper/80">
        <span>{x.heroCardTop}</span>
        <span>{new Intl.DateTimeFormat("pl-PL", { month: "long", year: "numeric" }).format(new Date())}</span>
      </div>
      <div class="mt-[35px] mb-2 text-[42px] font-bold tracking-[-0.06em]">3 842,60 zł</div>
      <div class="text-xs text-paper/60">{x.heroCardSub}</div>
      <div class="mt-[30px] flex h-[145px] items-end gap-[11px] border-b border-paper/15 px-3.5">
        {barHeights.map((h, i) => (
          <i class:list={["w-6 rounded-t", i >= 6 ? "bg-excess" : "bg-paper/30"]} style={`height:${h}`}></i>
        ))}
      </div>
      <div class="mt-[23px] flex gap-[9px]">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <i
            class:list={["size-5", i >= 5 ? "bg-excess" : "bg-paper/35"]}
            style="clip-path:polygon(0 0,55% 0,100% 42%,63% 66%,100% 100%,54% 100%,30% 70%,30% 100%,0 100%)"
          ></i>
        ))}
      </div>
    </div>
  </section>

  <section class="pt-[30px] pb-[100px]">
    <div class="mb-7 flex items-end justify-between">
      <div>
        <div class={eyebrow}>{x.stepsEyebrow}</div>
        <h2 class="mt-2.5 text-[38px] tracking-[-0.06em] max-[559px]:text-[31px]">{x.stepsTitle}</h2>
      </div>
      <span class="text-muted">{x.stepsNote}</span>
    </div>
    <div class="grid grid-cols-3 gap-4 max-[899px]:grid-cols-1">
      {l.steps.map((s) => (
        <article class="border-t-2 border-ink pt-5 pr-2 pb-2.5">
          <h3 class="mb-2.5 text-lg">
            {s.number} — {s.title}
          </h3>
          <p class="text-sm leading-relaxed text-muted">{s.body}</p>
        </article>
      ))}
    </div>
  </section>

  <section class="-mx-[34px] bg-ink py-[55px] text-paper max-[559px]:-mx-5">
    <div class="mx-auto flex max-w-[1180px] items-center justify-between gap-[30px] px-[34px] max-[899px]:block max-[559px]:px-5">
      <h2 class="text-[35px] tracking-[-0.06em] max-[559px]:text-[30px]">
        {x.ctaTitle[0]}
        <br />
        {x.ctaTitle[1]}
      </h2>
      <a href="/register" class={buttonVariants({ variant: "amber" }) + " max-[899px]:mt-[22px]"}>
        {x.ctaButton}
      </a>
    </div>
  </section>
</MarketingLayout>
```

Note: the hero card's amount "3 842,60 zł" is the kit's decorative sample (same as the prototype); it is not data. Keep it as a literal inside `aria-hidden`.

- [ ] **Step 5: `src/pages/how-it-works.astro`** (prototype `howItWorks()`)

```astro
---
import MarketingLayout from "@/layouts/MarketingLayout.astro";
import { buttonVariants } from "@/components/ui/button";
import { copy, copyExtra } from "@/content/copy";

const h = copy.howItWorks;
const x = copyExtra.howItWorks;
const eyebrow = "text-xs font-extrabold tracking-[0.14em] text-excess-text uppercase";
const rClip = "clip-path:polygon(0 0,57% 0,100% 43%,62% 66%,100% 100%,55% 100%,30% 70%,30% 100%,0 100%)";
---

<MarketingLayout title={copy.navigation.howItWorks} description={h.description}>
  <section class="grid grid-cols-[1.05fr_0.95fr] items-center gap-[90px] py-[86px] pb-[92px] max-[899px]:grid-cols-1 max-[899px]:gap-[35px] max-[899px]:pt-[55px]">
    <div>
      <div class={eyebrow}>{h.eyebrow}</div>
      <h1 class="my-[17px] mb-6 text-[clamp(48px,6.4vw,78px)] leading-[0.98] tracking-[-0.075em]">
        {h.headline[0]}
        <br />
        <span class="text-excess-text">{h.headline[1]}</span>
      </h1>
      <p class="mb-[30px] max-w-[520px] text-lg leading-relaxed text-muted">{h.description}</p>
      <a href="/register" class={buttonVariants({ variant: "primary" })}>
        {h.primaryCta} <span aria-hidden="true">↗</span>
      </a>
    </div>
    <div
      class="flex min-h-[270px] flex-col justify-center rounded-2xl bg-ink p-[31px] text-paper shadow-[0_18px_48px_rgba(32,47,64,0.08)]"
      aria-hidden="true"
    >
      <div class="text-xs font-extrabold tracking-[0.13em] text-paper/70 uppercase">{x.sequenceCaption}</div>
      <div class="my-[46px] mb-5 flex items-center gap-[13px]">
        {[0, 1, 2].map(() => (
          <span class="size-[27px] bg-paper/45" style={rClip}></span>
        ))}
        <i class="mx-[5px] h-[51px] border-l border-paper/55"></i>
        {[0, 1].map(() => (
          <span class="size-[27px] bg-excess" style={rClip}></span>
        ))}
      </div>
      <div class="flex justify-between text-xs text-paper/65">
        <span>{x.sequenceThreshold}</span>
        <b class="text-excess">{x.sequenceOver}</b>
      </div>
    </div>
  </section>

  <section class="pt-[30px] pb-[100px]">
    <div class="mb-7 flex items-end justify-between">
      <div>
        <div class={eyebrow}>{x.stepsEyebrow}</div>
        <h2 class="mt-2.5 text-[38px] tracking-[-0.06em] max-[559px]:text-[31px]">{x.stepsTitle}</h2>
      </div>
      <span class="text-muted">{x.stepsNote}</span>
    </div>
    <div class="grid grid-cols-3 gap-3.5 max-[899px]:grid-cols-1">
      {h.steps.map((s) => (
        <article class="flex min-h-[285px] flex-col rounded-xl border border-line bg-paper-soft p-[25px]">
          <span class="text-xs font-extrabold tracking-[0.12em] text-excess-text">{s.number}</span>
          <h3 class="mt-3 text-[21px] tracking-[-0.04em]">{s.title}</h3>
          <p class="mt-2.5 text-sm leading-relaxed text-muted">{s.body}</p>
          <span class="mt-auto pt-5 text-xs font-bold text-ink">{s.caption}</span>
        </article>
      ))}
    </div>
  </section>

  <section class="pb-[100px]">
    <div class="grid grid-cols-3 gap-4 max-[899px]:grid-cols-1 max-[899px]:gap-5">
      {h.explanation.map((e) => (
        <article class="border-t-2 border-ink pt-5 pr-2 pb-2.5">
          <h3 class="mb-2.5 text-lg">{e.title}</h3>
          <p class="text-sm leading-relaxed text-muted">{e.body}</p>
        </article>
      ))}
    </div>
  </section>
</MarketingLayout>
```

- [ ] **Step 6: `src/pages/for-who.astro`** (prototype `forWho()`)

```astro
---
import MarketingLayout from "@/layouts/MarketingLayout.astro";
import { buttonVariants } from "@/components/ui/button";
import { copy, copyExtra } from "@/content/copy";

const w = copy.forWho;
const x = copyExtra.forWho;
const eyebrow = "text-xs font-extrabold tracking-[0.14em] text-excess-text uppercase";
---

<MarketingLayout title={copy.navigation.forWho} description={w.description}>
  <section class="grid grid-cols-[1.05fr_0.95fr] items-center gap-[90px] py-[86px] pb-[92px] max-[899px]:grid-cols-1 max-[899px]:gap-[35px] max-[899px]:pt-[55px]">
    <div>
      <div class={eyebrow}>{w.eyebrow}</div>
      <h1 class="my-[17px] mb-6 text-[clamp(48px,6.4vw,78px)] leading-[0.98] tracking-[-0.075em]">
        {w.headline[0]}
        <br />
        <span class="text-excess-text">{w.headline[1]}</span>
      </h1>
      <p class="mb-[30px] max-w-[520px] text-lg leading-relaxed text-muted">{w.description}</p>
      <div class="flex items-center gap-3 max-[559px]:flex-col max-[559px]:items-stretch">
        <a href="/register" class={buttonVariants({ variant: "primary" })}>
          {copy.navigation.start} <span aria-hidden="true">↗</span>
        </a>
        <a href="/how-it-works" class={buttonVariants({ variant: "ghost" })}>
          {x.secondaryCta}
        </a>
      </div>
    </div>
    <blockquote class="flex items-start gap-5 rounded-2xl border border-line bg-paper-soft p-8 max-[899px]:max-w-[560px]">
      <span
        class="grid size-11 shrink-0 place-items-center rounded-xl bg-ink text-lg font-extrabold text-paper"
        aria-hidden="true"
      >
        R
      </span>
      <p class="text-2xl leading-tight tracking-[-0.03em]">
        <span class="font-medium text-muted">„{w.quote.split(". ")[0]}.</span>
        <br />
        <strong>{w.quote.split(". ")[1]}”</strong>
      </p>
    </blockquote>
  </section>

  <section class="pt-[30px] pb-[100px]">
    <div class="mb-7">
      <div class={eyebrow}>{x.cardsEyebrow}</div>
      <h2 class="mt-2.5 text-[38px] tracking-[-0.06em] max-[559px]:text-[31px]">{x.cardsTitle}</h2>
    </div>
    <div class="grid grid-cols-3 gap-3.5 max-[899px]:grid-cols-1">
      {w.cards.map((c) => (
        <article class="flex flex-col rounded-xl border border-line bg-paper-soft p-[25px]">
          <span class="text-xs font-extrabold tracking-[0.12em] text-excess-text">{c.index}</span>
          <h3 class="mt-3 text-[21px] tracking-[-0.04em]">{c.title}</h3>
          <p class="mt-2.5 text-sm leading-relaxed text-muted">{c.body}</p>
          <a href="/register" class="mt-auto pt-5 text-sm font-bold text-ink">
            {c.link} <span aria-hidden="true">↗</span>
          </a>
        </article>
      ))}
    </div>
    <p class="mt-12 max-w-[640px] text-lg leading-relaxed text-muted">{w.closing}</p>
  </section>
</MarketingLayout>
```

- [ ] **Step 7: Delete starter components and verify**

```bash
git rm -q src/components/Welcome.astro src/components/Topbar.astro src/components/ui/LibBadge.astro
npx astro check && npm run build
```

Dev server assertions:

```bash
curl -s http://localhost:4321/ | grep -c 'Zobacz swój rytm'                 # ≥ 1
curl -s http://localhost:4321/ | grep -c "© $(date +%Y) Rytm"                # 1
curl -s http://localhost:4321/how-it-works | grep -c 'Najpierw wzorzec'      # 1
curl -s http://localhost:4321/for-who | grep -c 'wiedzieć bez liczenia'      # 1
curl -s http://localhost:4321/ | grep -c 'bg-cosmic'                         # 0
```

- [ ] **Step 8: Commit**

```bash
git add src/components/marketing src/layouts/MarketingLayout.astro src/pages/index.astro src/pages/how-it-works.astro src/pages/for-who.astro
git commit -m "ui: marketing pages from the kit (landing, how it works, for who)"
```

---

### Task 7: App shell and empty home

**Files:**

- Create: `src/components/app/AppHeader.astro`, `Sidebar.astro`, `MobileNav.astro`, `PageTitle.astro`, `Panel.astro`, `InlineAlert.astro`, `EmptyState.astro`, `src/layouts/AppLayout.astro`, `src/pages/home.astro`
- Delete: `src/pages/dashboard.astro`

**Interfaces:**

- Consumes: `Brand`, `Icon`, `buttonVariants`, `copy`, `copyExtra`, `Astro.locals.user`.
- Produces: `AppLayout` props `{ title: string; active: NavKey }` with `type NavKey = "home" | "patterns" | "fixed" | "imports" | "settings"` (exported from `Sidebar.astro`); `PageTitle` props `{ eyebrow: string; title: string; lead?: string }` + default slot for the right-hand action; `Panel` (slot, optional `class`); `InlineAlert` props `{ kind: "success" | "error" | "info" }` + slot; `EmptyState` props `{ title: string; body: string; cta: string; href: string; illustration: string }`.

- [ ] **Step 1: `Sidebar.astro`**

```astro
---
import Icon from "@/components/Icon.astro";
import type { IconName } from "@/content/copy";
import { copyExtra } from "@/content/copy";
import { cn } from "@/lib/utils";

export type NavKey = "home" | "patterns" | "fixed" | "imports" | "settings";

interface Props {
  active: NavKey;
}

const { active } = Astro.props;
const a = copyExtra.app;
const link =
  "flex items-center gap-[11px] rounded-lg px-3 py-[11px] text-[13px] font-bold text-muted no-underline hover:bg-paper-soft hover:text-ink";
const activeLink = "bg-paper-soft text-ink";
const label = "mx-3 mt-5 mb-[9px] text-[11px] font-extrabold tracking-[0.13em] text-muted uppercase";
const items: { key: NavKey; href: string; text: string; icon: IconName }[] = [
  { key: "home", href: "/home", text: a.overview, icon: "overview" },
  { key: "patterns", href: "/patterns", text: a.patternsLong, icon: "patterns" },
  { key: "fixed", href: "/fixed", text: a.fixedLong, icon: "fixed" },
];
---

<aside class="relative min-h-[calc(100vh-72px)] border-r border-line bg-paper px-4 py-7 max-[899px]:hidden">
  <div class={label}>{a.sidebarView}</div>
  {items.map((i) => (
    <a
      href={i.href}
      class={cn(link, active === i.key && activeLink)}
      aria-current={active === i.key ? "page" : undefined}
    >
      <Icon name={i.icon} size={17} />
      <span>{i.text}</span>
    </a>
  ))}
  <div class={label}>{a.sidebarData}</div>
  <a
    href="/imports"
    class={cn(link, active === "imports" && activeLink)}
    aria-current={active === "imports" ? "page" : undefined}
  >
    <Icon name="import" size={17} />
    <span>{a.importsLong}</span>
  </a>
  <div class="absolute right-4 bottom-[25px] left-4">
    <a
      href="/settings"
      class={cn(link, active === "settings" && activeLink)}
      aria-current={active === "settings" ? "page" : undefined}
    >
      <Icon name="settings" size={17} />
      <span>{a.settingsLong}</span>
    </a>
  </div>
</aside>
```

- [ ] **Step 2: `MobileNav.astro`** (bottom bar < 900 px; labels from `copy.mobileNav`)

```astro
---
import Icon from "@/components/Icon.astro";
import type { NavKey } from "@/components/app/Sidebar.astro";
import type { IconName } from "@/content/copy";
import { copy } from "@/content/copy";
import { cn } from "@/lib/utils";

interface Props {
  active: NavKey;
}

const { active } = Astro.props;
const m = copy.mobileNav;
const items: { key: NavKey; href: string; text: string; icon: IconName }[] = [
  { key: "home", href: "/home", text: m.overview, icon: "overview" },
  { key: "patterns", href: "/patterns", text: m.patterns, icon: "patterns" },
  { key: "fixed", href: "/fixed", text: m.fixed, icon: "fixed" },
  { key: "imports", href: "/imports", text: m.imports, icon: "import" },
  { key: "settings", href: "/settings", text: m.settings, icon: "settings" },
];
---

<nav
  class="fixed inset-x-0 bottom-0 z-20 hidden justify-around border-t border-line bg-paper px-1 pt-2 pb-[calc(8px+env(safe-area-inset-bottom))] shadow-[0_-8px_25px_rgba(32,47,64,0.07)] max-[899px]:flex"
  aria-label="Nawigacja aplikacji"
>
  {items.map((i) => (
    <a
      href={i.href}
      class={cn(
        "grid justify-items-center gap-[3px] rounded-[7px] px-2 py-1 text-[10px] font-bold text-muted no-underline",
        active === i.key && "bg-paper-soft text-ink",
      )}
      aria-current={active === i.key ? "page" : undefined}
    >
      <Icon name={i.icon} size={17} />
      <span>{i.text}</span>
    </a>
  ))}
</nav>
```

The `aria-label` value is the prototype's; add `navLabel: "Nawigacja aplikacji"` to `copyExtra.app` and use it instead of the literal.

- [ ] **Step 3: `AppHeader.astro`**

```astro
---
import Brand from "@/components/Brand.astro";
import { buttonVariants } from "@/components/ui/button";
import { copyExtra } from "@/content/copy";

const month = new Intl.DateTimeFormat("pl-PL", { month: "long", year: "numeric" }).format(new Date());
---

<header class="flex h-[72px] items-center justify-between border-b border-line bg-paper px-[30px] max-[899px]:px-[18px]">
  <Brand href="/home" />
  <div class="flex items-center gap-4">
    <span class="text-sm text-muted">{month}</span>
    <form method="POST" action="/api/auth/signout">
      <button type="submit" class={buttonVariants({ variant: "ghost" })}>
        {copyExtra.app.exit}
      </button>
    </form>
  </div>
</header>
```

- [ ] **Step 4: `AppLayout.astro`**

```astro
---
import Layout from "@/layouts/Layout.astro";
import AppHeader from "@/components/app/AppHeader.astro";
import Sidebar, { type NavKey } from "@/components/app/Sidebar.astro";
import MobileNav from "@/components/app/MobileNav.astro";

interface Props {
  title: string;
  active: NavKey;
}

const { title, active } = Astro.props;
---

<Layout title={title}>
  <div class="min-h-screen bg-paper-soft">
    <AppHeader />
    <div class="mx-auto grid max-w-[1440px] grid-cols-[230px_1fr] max-[899px]:grid-cols-1">
      <Sidebar active={active} />
      <main class="w-full max-w-[1100px] px-[42px] pt-[35px] pb-[60px] max-[899px]:px-[18px] max-[899px]:pt-[26px] max-[899px]:pb-[88px]">
        <slot />
      </main>
    </div>
    <MobileNav active={active} />
  </div>
</Layout>
```

If `astro check` rejects `import Sidebar, { type NavKey } from "…Sidebar.astro"`, move `NavKey` to `src/components/app/nav.ts` (`export type NavKey = …`) and import it from there in all three files.

- [ ] **Step 5: `PageTitle.astro`, `Panel.astro`, `InlineAlert.astro`, `EmptyState.astro`**

```astro
---
// PageTitle.astro — prototype .dash-title
interface Props {
  eyebrow: string;
  title: string;
  lead?: string;
}
const { eyebrow, title, lead } = Astro.props;
---

<div class="mb-7 flex items-end justify-between gap-5 max-[899px]:items-start">
  <div>
    <div class="text-xs font-extrabold tracking-[0.14em] text-excess-text uppercase">{eyebrow}</div>
    <h1 class="mt-2 mb-1 text-[37px] tracking-[-0.07em] max-[899px]:text-[31px]">{title}</h1>
    {lead && <p class="text-sm text-muted">{lead}</p>}
  </div>
  <slot />
</div>
```

```astro
---
// Panel.astro — prototype .panel
import { cn } from "@/lib/utils";
interface Props {
  class?: string;
}
const { class: className } = Astro.props;
---

<section class={cn("rounded-xl border border-line bg-paper p-[22px] max-[559px]:p-[17px]", className)}>
  <slot />
</section>
```

```astro
---
// InlineAlert.astro — prototype .inline-alert
import Icon from "@/components/Icon.astro";
import { cn } from "@/lib/utils";
interface Props {
  kind: "success" | "error" | "info";
}
const { kind } = Astro.props;
const tone = { success: "bg-green/15 text-green", error: "bg-excess/25 text-excess-text", info: "bg-ink/8 text-ink" }[
  kind
];
const icon = { success: "success", error: "warning", info: "info" } as const;
---

<div
  role={kind === "error" ? "alert" : "status"}
  class={cn("flex items-start gap-[9px] rounded-lg px-[13px] py-3 text-[13px] leading-snug", tone)}
>
  <Icon name={icon[kind]} size={16} class="mt-px" />
  <span>
    <slot />
  </span>
</div>
```

```astro
---
// EmptyState.astro — prototype .empty-dashboard
import Panel from "@/components/app/Panel.astro";
import { buttonVariants } from "@/components/ui/button";
interface Props {
  title: string;
  body: string;
  cta: string;
  href: string;
  illustration: string;
  illustrationAlt: string;
}
const { title, body, cta, href, illustration, illustrationAlt } = Astro.props;
---

<Panel class="flex flex-col items-center p-[35px] text-center">
  <img src={illustration} alt={illustrationAlt} class="h-auto w-[min(460px,100%)]" />
  <h2 class="mb-[7px] text-[25px] tracking-[-0.05em]">{title}</h2>
  <p class="mb-5 max-w-[470px] text-sm leading-[1.55] text-muted">{body}</p>
  <a href={href} class={buttonVariants({ variant: "primary" })}>
    {cta} <span aria-hidden="true">↗</span>
  </a>
</Panel>
```

Add `emptyIllustrationAlt: "Dokument czekający na import"` to `copyExtra.home` (prototype alt text).

- [ ] **Step 6: `src/pages/home.astro`** (always the empty state in this slice)

```astro
---
import AppLayout from "@/layouts/AppLayout.astro";
import PageTitle from "@/components/app/PageTitle.astro";
import EmptyState from "@/components/app/EmptyState.astro";
import { copy, copyExtra } from "@/content/copy";

const h = copyExtra.home;
const e = copy.emptyState;
---

<AppLayout title={copy.dashboard.eyebrow} active="home">
  <PageTitle eyebrow={h.emptyEyebrow} title={h.emptyTitle} lead={h.emptyLead} />
  <EmptyState
    title={e.title}
    body={e.body}
    cta={e.cta}
    href="/imports/new"
    illustration="/rytm/illustrations/rytm-pusty-stan-jasny.svg"
    illustrationAlt={h.emptyIllustrationAlt}
  />
</AppLayout>
```

- [ ] **Step 7: Delete `dashboard.astro`, verify**

```bash
git rm -q src/pages/dashboard.astro
npx astro check && npm run build
```

Dev-server assertions need a signed-in session; use the smoke test if local Supabase is up, otherwise assert the redirect and inspect the markup by temporarily hitting `/home` through the smoke flow in CI. Minimum local check:

```bash
curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' http://localhost:4321/home   # 302 http://localhost:4321/login
```

- [ ] **Step 8: Commit**

```bash
git add src/components/app src/layouts/AppLayout.astro src/pages/home.astro src/content/copy.ts
git commit -m "ui: app shell (header, sidebar, mobile nav) and empty home"
```

---

### Task 8: Import step 1 (inert) and the four stub pages

**Files:**

- Create: `src/components/app/Stepper.astro`, `src/pages/imports/new.astro`, `src/pages/imports/index.astro`, `src/pages/patterns.astro`, `src/pages/fixed.astro`, `src/pages/settings.astro`

**Interfaces:**

- Consumes: `AppLayout`, `PageTitle`, `Panel`, `InlineAlert`, `Icon`, `buttonVariants`, `copy`, `copyExtra`.
- Produces: `Stepper` props `{ steps: readonly string[]; current: number }` (1-based).

- [ ] **Step 1: `Stepper.astro`** (prototype `.import-flow`)

```astro
---
import { cn } from "@/lib/utils";
interface Props {
  steps: readonly string[];
  current: number;
}
const { steps, current } = Astro.props;
---

<ol class="-mt-[7px] mb-6 flex max-w-[620px] list-none items-center p-0">
  {steps.map((label, i) => (
    <>
      {i > 0 && <span class="mx-3.5 h-px flex-1 bg-line max-[559px]:mx-2" aria-hidden="true"></span>}
      <li
        class={cn(
          "flex items-center gap-2 text-xs whitespace-nowrap text-muted",
          i + 1 === current && "font-extrabold text-ink",
        )}
        aria-current={i + 1 === current ? "step" : undefined}
      >
        <b
          class={cn(
            "grid size-[25px] place-items-center rounded-full border border-line",
            i + 1 === current && "border-ink bg-ink text-paper",
          )}
        >
          {i + 1}
        </b>
        <span class="max-[559px]:hidden">{label}</span>
      </li>
    </>
  ))}
</ol>
```

- [ ] **Step 2: `src/pages/imports/new.astro`** (step 1, inert until the import slice)

```astro
---
import AppLayout from "@/layouts/AppLayout.astro";
import PageTitle from "@/components/app/PageTitle.astro";
import Panel from "@/components/app/Panel.astro";
import Stepper from "@/components/app/Stepper.astro";
import Icon from "@/components/Icon.astro";
import { buttonVariants } from "@/components/ui/button";
import { copy, copyExtra } from "@/content/copy";

const f = copy.importFlow;
const x = copyExtra.imports;
---

<AppLayout title={f.title} active="imports">
  <PageTitle eyebrow={x.newEyebrow} title={f.title} lead={x.newLead}>
    <a href="/imports" class="inline-flex items-center gap-1.5 text-[13px] font-extrabold text-ink no-underline">
      <Icon name="arrow-left" size={15} /> {x.back}
    </a>
  </PageTitle>
  <Stepper steps={f.steps} current={1} />
  <Panel class="flex min-h-[360px] flex-col items-center justify-center border-dashed border-muted text-center">
    <div class="grid size-[60px] place-items-center rounded-[13px] bg-ink text-paper">
      <Icon name="upload" size={28} />
    </div>
    <h2 class="mt-[22px] mb-2 text-[23px] tracking-[-0.04em]">{x.dropTitle}</h2>
    <p class="mb-[22px] text-[13px] text-muted">{f.supported}</p>
    {/* Inert in slice 1: the import backend does not exist yet. Enabled by the import slice. */}
    <button type="button" class={buttonVariants({ variant: "primary" })} disabled>
      {x.choose}
    </button>
  </Panel>
</AppLayout>
```

- [ ] **Step 3: The four stubs** (DESIGN-GAP: G18). `src/pages/patterns.astro`:

```astro
---
// DESIGN-GAP: G18 — placeholder body for a view that is not available yet.
import AppLayout from "@/layouts/AppLayout.astro";
import PageTitle from "@/components/app/PageTitle.astro";
import InlineAlert from "@/components/app/InlineAlert.astro";
import { copy, copyExtra } from "@/content/copy";
---

<AppLayout title={copy.patterns.title} active="patterns">
  <PageTitle eyebrow={copyExtra.patterns.eyebrow} title={copy.patterns.title} lead={copy.patterns.description} />
  <InlineAlert kind="info">{copyExtra.stub.info}</InlineAlert>
</AppLayout>
```

`src/pages/fixed.astro` — same shape with `title={copy.fixedCosts.title}`, `active="fixed"`, `eyebrow={copyExtra.fixed.eyebrow}`, `lead={copyExtra.fixed.lead}`.

`src/pages/imports/index.astro` — `title={copyExtra.imports.title}`, `active="imports"`, `eyebrow={copyExtra.imports.eyebrow}`, `lead={copyExtra.imports.lead}`, and inside `PageTitle` the action slot: `<a href="/imports/new" class={buttonVariants({ variant: "primary" })}>+ {copy.navigation.start}</a>` — no: the kit's button text is "+ Nowy import"; add `newImport: "+ Nowy import"` to `copyExtra.imports` and use it.

`src/pages/settings.astro` — `title={copy.settings.title}`, `active="settings"`, `eyebrow={copyExtra.settings.eyebrow}`, `lead={copyExtra.settings.lead}`.

- [ ] **Step 4: Verify**

```bash
npx astro check && npm run build
for p in /patterns /fixed /imports /imports/new /settings; do curl -s -o /dev/null -w "$p %{http_code} %{redirect_url}\n" http://localhost:4321$p; done
```

Expected: every line `302 http://localhost:4321/login` (anonymous). Signed-in rendering is covered by the smoke run in CI (`/home`) and the visual check in Task 9.

- [ ] **Step 5: Commit**

```bash
git add src/components/app/Stepper.astro src/pages/imports src/pages/patterns.astro src/pages/fixed.astro src/pages/settings.astro src/content/copy.ts
git commit -m "ui: inert import step 1 and stub app pages"
```

---

### Task 9: Gap register, docs, full gate, visual check, preview

**Files:**

- Modify: `context/foundation/design-kit.md`, `CLAUDE.md`, `AGENTS.md`, `README.md.scaffold`

- [ ] **Step 1: Register gaps and conflicts in `context/foundation/design-kit.md`**

Append to the "Nowe konflikty" table:

```
| K11 | `content.json` nie zawiera copy, które prototyp renderuje: panele wizualne auth („Zacznij widzieć więcej.”, „Wróć do swojego rytmu.” + leady), tytuł i lead pustego dashboardu, nagłówki resetu i „Sprawdź skrzynkę / Link jest w drodze.”, tytuł/lead widoku importów, etykiety sidebaru, sekcje landing/how-it-works/for-who poza hero | copy ma pochodzić z `content.json` (reguła 4) | Tymczasowo w `src/content/copy.ts` → `copyExtra` (dosłownie z `prototype/app.js`). Autor dodaje klucze do `content.json`; wtedy `copyExtra` się kurczy. |
```

Append to the gap register:

```
| G17 | **Strona „ustaw nowe hasło”** (`/reset/new`) dla linku z e-maila Supabase | FR-001, reset hasła | ekran w `auth-shell`: nowe hasło + powtórzenie, stan błędu, sukces → `/login` | open · do dostarczenia link „Nie pamiętam hasła” jest ukryty na `/login` |
| G18 | **Widok niedostępny / pusty widok aplikacji** (wzorce, koszty stałe, importy, ustawienia przed danymi) | stuby tras w slice 1 | copy + kompozycja stanu „ten widok pojawi się po pierwszym imporcie” | placeholder · `InlineAlert info` z copy w `copyExtra.stub`, `DESIGN-GAP: G18` |
| G19 | **Ekran „potwierdź e-mail”** po rejestracji | FR-001 (Supabase wysyła link aktywacyjny) | copy + kompozycja; może reużyć „Sprawdź skrzynkę” z `/reset` | placeholder · `src/pages/confirm-email.astro`, `DESIGN-GAP: G19` |
```

Update the G16 row's status text to add: `slice 1 używa placeholderów: komunikaty walidacji pól, „Pokaż/Ukryj” hasło, ogólny błąd rejestracji (`copyExtra.auth`)`.

Add to "Do rundy 2": `8. **G17** — strona „ustaw nowe hasło”. 9. **G18** — stan „widok niedostępny”. 10. **G19** — ekran „potwierdź e-mail”. 11. **K11** — brakujące klucze w content.json.`

- [ ] **Step 2: Update the rules files**

`CLAUDE.md`: in _Auth flow_ replace the two page lines with `- Auth pages: src/pages/{login,register,reset,confirm-email}.astro (AuthLayout)` and `- Protected pages: /home, /patterns, /fixed, /imports, /settings (AppLayout); middleware also sends signed-in users from /login and /register to /home`; add under _Key conventions_: `- **Design kit**: design/rytm-os/ is read-only; assets via scripts/sync-kit.sh → public/rytm/ + src/styles/brand.css; colors only via the Tailwind names ink/paper/paper-soft/excess/excess-text/muted/line/green; copy from src/content/copy.ts (copy = kit JSON, copyExtra = kit gaps K11); missing UI → gap row in context/foundation/design-kit.md + DESIGN-GAP comment, never invented.`

`AGENTS.md`: in _Structure_ add `src/content/copy.ts` and `src/components/{marketing,app,auth}/`; in _Commands_ add `./scripts/sync-kit.sh — re-copy the kit after a new design delivery`.

`README.md.scaffold`: nothing (starter doc).

- [ ] **Step 3: Full gate**

```bash
npm run lint && npx astro check && npm run build
```

Expected: all clean. If lint flags `no-console` or unused imports in the new files, fix them (no rule changes).

- [ ] **Step 4: Smoke** — run locally only if Docker + local Supabase are available:

```bash
npx supabase start   # then point .env at API_URL/ANON_KEY it prints (keep the hosted values in .env.hosted for later)
npm run build && ASTRO_TELEMETRY_DISABLED=1 npm run dev -- --port 4321 &
BASE_URL=http://localhost:4321 npm run smoke
```

Expected: `All smoke steps passed`. Otherwise rely on the CI `smoke` job after the push.

- [ ] **Step 5: Visual check** (Chrome, side by side with `design/rytm-os/prototype/index.html`): `/` vs `#/`, `/login` vs `#/login`, `/register` vs `#/register`, `/home` (signed in) vs `#/home-empty`, `/imports/new` vs `#/imports/new`, at widths 1280 / 900 / 560. Fix spacing/size mismatches in the component classes; record anything that cannot be matched without inventing as a new gap row.

- [ ] **Step 6: Commit and preview**

```bash
git add context/foundation/design-kit.md CLAUDE.md AGENTS.md
git commit -m "docs: register kit gaps K11/G17–G19, update rules for the UI foundation"
npx vercel   # preview deploy; Vercel Authentication gates it — open the printed URL while logged in to Vercel
```

Report the preview URL. Push to `main` only when the user says so (it deploys production).

---

## Self-review

- **Spec coverage**: §1 Foundation → Task 1 (assets, tokens, Layout) + Task 2 (copy, Icon); §2 Shells → Task 6 (marketing), Task 5 (auth shell), Task 7 (app); §3 Pages → Tasks 5, 6, 7, 8; middleware/API → Task 4; §4 Components → Tasks 2, 3, 7, 8; §5 gaps → Task 9; §6 verification → smoke in Task 4, visual + preview in Task 9. Removals of starter files spread across Tasks 1, 5, 6, 7.
- **Placeholders**: none; every code step has content. The two "same shape" stub pages in Task 8 Step 3 list every differing prop explicitly.
- **Type consistency**: `NavKey` exported from `Sidebar.astro` and consumed by `MobileNav.astro`/`AppLayout.astro` (fallback file named if Astro rejects the type re-export); `IconName` from `copy.ts` used by `Icon.astro`, `Sidebar.astro`, `MobileNav.astro`; `buttonVariants` variants `primary|ghost|amber`, sizes `default|lg|full` used consistently; `copyExtra` keys added incrementally (`auth.showPassword/hidePassword/emailRequired/passwordRequired/passwordTooShort/signingIn/creating/sending`, `app.navLabel`, `home.emptyIllustrationAlt`, `imports.newImport`) are all named where introduced.
