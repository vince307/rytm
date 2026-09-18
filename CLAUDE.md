# Rules for AI

This file provides guidance to AI Agent when working with code in this repository.

## Commands

- `npm run dev` — start dev server (Node; Astro's Vite dev server). There is no `astro preview` — the Vercel adapter does not support it; test a production build via a preview deploy (`npx vercel`)
- `npm run build` — production build (SSR via `@astrojs/vercel`, emits `.vercel/output/`)
- `npm run lint` — ESLint with type-checked rules
- `npm run lint:fix` — auto-fix lint issues
- `npm run format` — Prettier (includes prettier-plugin-astro + prettier-plugin-tailwindcss)
- `npm run smoke` — dependency-free auth-flow smoke test (`scripts/smoke.mjs`) against a running server, `BASE_URL` env (default `http://localhost:4321`). Run after dependency upgrades; CI runs it against `astro dev` with a local Supabase. Never run it against production (it creates real users).

Pre-commit hooks: husky + lint-staged runs `eslint --fix` on `*.{ts,tsx,astro}` and `prettier --write` on `*.{json,css,md}`.

## Architecture

**Astro 7 SSR app** with React 19 islands, Tailwind 4, Supabase auth, and shadcn/ui components. Deployed to Vercel (Node.js 22 functions, single region `fra1` pinned in `vercel.json`).

### Rendering mode

Full server-side rendering (`output: "server"` in astro.config.mjs). All pages are server-rendered by default. API routes must export `const prerender = false`.

### Auth flow

- `src/lib/supabase.ts` — creates a Supabase SSR client using `@supabase/ssr` with cookie-based sessions. Uses `astro:env/server` for `SUPABASE_URL` and `SUPABASE_KEY` (server-only secrets declared in astro.config.mjs `env.schema`).
- `src/middleware.ts` — runs on every request, resolves the current user, attaches to `context.locals.user`. Redirects unauthenticated users away from routes listed in `PROTECTED_ROUTES`.
- API endpoints: `src/pages/api/auth/{signin,signup,signout}.ts`
- Auth pages: `src/pages/auth/{signin,signup,confirm-email}.astro`
- Protected page example: `src/pages/dashboard.astro`

### Key conventions

- **Path alias**: `@/*` maps to `./src/*` (tsconfig paths).
- **Astro components** for static content/layout; **React components** only when interactivity is needed.
- **Tailwind class merging**: use the `cn()` helper from `@/lib/utils` (clsx + tailwind-merge) for conditional/merged class names. Do not concatenate class strings manually.
- **shadcn/ui**: components live in `src/components/ui/`, "new-york" style variant. Install new ones with `npx shadcn@latest add [name]`.
- **API routes**: use uppercase `GET`, `POST` exports; validate input with zod.
- **Supabase migrations**: `supabase/migrations/` using naming format `YYYYMMDDHHmmss_short_description.sql`. Always enable RLS on new tables with granular per-operation, per-role policies.
- **React**: no Next.js directives ("use client" etc.). Extract hooks to `src/components/hooks/`.
- **Services/helpers** go in `src/lib/` (or `src/lib/services/` for extracted business logic).
- **Shared types** (entities, DTOs) go in `src/types.ts`.

### Environment

- Node.js v22.14.0 (see `.nvmrc`)
- Env vars: `SUPABASE_URL`, `SUPABASE_KEY` (copy `.env.example` to `.env`, gitignored). On Vercel they are project env vars (`vercel env ls`), read at runtime through `astro:env/server`
- Local Supabase: `npx supabase start` (requires Docker)
- Production deploy: push to `main` → GitHub Actions `deploy` job (`vercel deploy --prebuilt --prod`). Vercel's Git integration is disabled for `main` (`vercel.json`) and only builds previews for other branches/PRs
- Preview deploy from a working tree: `npx vercel` (Vercel Authentication gates previews by default). Never run `vercel --prod` by hand except for an emergency; rollback is `vercel rollback` / `vercel promote <url>` (human-only)
- Deployment state and secret inventory: `context/deployment/deploy-plan.md`

## CI

GitHub Actions workflow (`.github/workflows/ci.yml`), on every push and PR to `main`:

- `ci` — `astro sync`, lint, `astro check`, build (needs `SUPABASE_URL` / `SUPABASE_KEY` repository secrets)
- `smoke` — local Supabase + `astro dev` + `npm run smoke`
- `deploy` — push to `main` only, after `ci` and `smoke` are green: `vercel pull` → `npm run build` → `vercel deploy --prebuilt --prod` (needs `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` secrets)
