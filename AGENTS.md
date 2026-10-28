# Repository Guidelines

Rytm is an Astro 7 SSR app (React 19 islands, Tailwind 4, shadcn/ui, Supabase auth) that imports ING bank CSV exports and surfaces recurring spend patterns; it runs as a Docker container (Node 22, `@astrojs/node`) on the owner's VPS at `https://rytm.ariom.cloud`, behind Caddy. Details in `@CLAUDE.md`; this file adds the rules that live outside it.

## Hard rules

- `design/rytm-os/` is the UI/UX source of truth. Never edit files there and never invent UI. Anything missing gets a new `Gn` row in the gap register of `@context/foundation/design-kit.md`; an unavoidable stopgap is built from kit tokens only and marked `// DESIGN-GAP: Gn`.
- Real bank exports never enter the repo: `*.csv` and `data/real/` are gitignored; only `test/fixtures/**/*.csv` is allowed.
- `context/archive/` is immutable. Contracts in `context/foundation/` (`prd.md`, `tech-stack.md`, `design-kit.md`, `shape-notes.md`, `import-formats.md`) are edited in place, never copied with dates.
- Secrets only in `.env` (gitignored) locally and in the server env file `/opt/apps/rytm/.env` in production — never in the image (`.dockerignore` drops `.env*`). `SUPABASE_URL` and `SUPABASE_KEY` are server-only via `astro:env/server`.
- Before committing, run the CI gate locally: `npm run lint && npx astro check && npm run build` (`@.github/workflows/ci.yml`).
- Humans only (or CI): `ssh apps-deploy@… rollback rytm`, secret rotation, server or project changes.

## Commands

- `npm run dev` — Node dev server; `node dist/server/entry.mjs` runs a production build, `docker build -t rytm:local .` the image
- `npm run lint` / `npm run lint:fix` — ESLint (type-checked, astro, react, jsx-a11y)
- `npx astro check` — type-checks `.astro` files; part of the CI gate
- `npm run build` — SSR production build via `@astrojs/node` standalone (emits `dist/server/entry.mjs`)
- `npm run smoke` — auth-flow smoke test against a running server (`BASE_URL`, default `http://localhost:4321`); never against production
- `./scripts/sync-kit.sh` — re-copy the kit after a new design delivery

Pre-commit: husky + lint-staged (`eslint --fix`, `prettier --write`).

## Structure

- `src/pages/` — routes. API routes under `src/pages/api/` export uppercase `GET`/`POST`, set `prerender = false`, validate input with zod.
- `src/components/` — `.astro` for static content, `.tsx` only when interactive. shadcn/ui primitives in `src/components/ui/`, feature groups in `src/components/{marketing,app,auth}/`.
- `src/lib/` — helpers and services (`supabase.ts`, `utils.ts` with `cn()`); `src/middleware.ts` guards `PROTECTED_ROUTES`.
- `src/content/copy.ts` — kit copy (`copy` = kit JSON, `copyExtra` = kit-missing strings).
- `context/` — product contracts; `design/` — the kit; `supabase/` — config, `migrations/` and `seed.sql` (local/CI test account `test@rytm.local`, see `@CLAUDE.md`).

## Style

Formatting: `@.prettierrc.json` (enforced by lint-staged). Import through the `@/` alias. React components `PascalCase.tsx`; shadcn primitives lowercase (`button.tsx`). Merge Tailwind classes with `cn()`, never by string concatenation. Migration naming and RLS rules: `@CLAUDE.md`.

## Testing

No unit test runner yet. `scripts/smoke.mjs` is the only automated check; run it after dependency upgrades (CI: `smoke` job in `@.github/workflows/ci.yml`, against `astro dev` + local Supabase).

## Deployment

Production ships only from the `deploy` job in `@.github/workflows/ci.yml` (push to `main`, after `ci` + `smoke`); the same job applies hosted Supabase migrations (`supabase db push`) before the VPS deploy (`ghcr.io/vince307/rytm:<sha>` via the `apps-deploy` forced command over Tailscale), so nobody pushes migrations by hand. There are no preview deploys. Current state and secret inventory: `@context/deployment/deploy-plan.md`.

## Commits

Imperative one-line subject, Polish or English, optional area prefix (`design: …`). Remote `origin` is GitHub; a push to `main` deploys production, so keep `main` green.
