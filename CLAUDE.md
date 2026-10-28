# Rules for AI

## Hard rules

- Never run `npm run smoke` against production (it creates real users).
- **Supabase migrations**: `supabase/migrations/` using naming format `YYYYMMDDHHmmss_short_description.sql`. Always enable RLS on new tables with granular per-operation, per-role policies. Every table holding a user's data needs a `user_id` FK to `auth.users(id)` with `on delete cascade` (never `set null`, never a bare uuid) — account deletion (`delete_own_account`) removes only the `auth.users` row and relies on the cascade. Migrations must be backward-compatible with the deploy currently in production: the `deploy` job pushes the schema minutes before the new code goes live, so the old code runs on the new schema meanwhile. A drop or rename of anything live code uses goes expand → deploy → contract over two merges.
- **Design kit**: `design/rytm-os/` is read-only; assets via `scripts/sync-kit.sh` → `public/rytm/` + `src/styles/brand.css`; colors only via the Tailwind names `ink`/`paper`/`paper-soft`/`excess`/`excess-text`/`muted`/`line`/`green`; copy from `src/content/copy.ts` (`copy` = kit JSON, `copyExtra` = kit gaps K11); missing UI → gap row in `context/foundation/design-kit.md` + `DESIGN-GAP` comment, never invented.
- Env vars: `SUPABASE_URL`, `SUPABASE_KEY`, optional `DEMO_EMAIL` (shared demo account guard, `src/lib/demo.ts`; unset = no demo account) (copy `.env.example` to `.env`, gitignored). `.env.example` already holds the local-Supabase values, so a fresh clone runs against Docker, never production. In production they live in the server's env file `/opt/apps/rytm/.env` (never in the image or the repo), read at runtime through `astro:env/server`; `SUPABASE_URL` there is `http://kong:8000` (internal Docker network address of the self-hosted stack `rytm-supabase`; anon key as `SUPABASE_KEY`), while e-mailed links go to `https://rytm.ariom.cloud/auth/v1/...`. `CRON_SECRET` is optional and only used by the smoke test (no scheduled keep-alive any more)
- Production deploys only from the CI `deploy` job. Rollback is `ssh apps-deploy@<host> rollback rytm` (back to the previous good image), run by the owner or from CI only — never from an agent session; `status rytm` shows the tags and health. Neither touches Supabase

## Commands

- `npm run dev` — start dev server (Node; Astro's Vite dev server)
- `npm run build` — production build (SSR via `@astrojs/node` standalone, emits `dist/server/entry.mjs` + `dist/client/`)
- `npm run start` (= `node dist/server/entry.mjs`) — run the production build; it reads `HOST`/`PORT` and the Supabase env from the process environment, not from `.env`: `set -a; . ./.env; set +a; HOST=127.0.0.1 PORT=4402 npm run start`
- `docker build -t rytm:local .` — the production image (`Dockerfile`, port 4402, health `GET /api/health`); CI builds and pushes it as `ghcr.io/vince307/rytm:<sha>`
- `node scripts/check-proxy-origin.mjs` — proves the built server behind Caddy-style `X-Forwarded-*` headers sees `https://rytm.ariom.cloud` (no 403 on form POSTs, e-mailed `redirect_to` on the public origin); `BASE_URL` (loopback only, default `http://127.0.0.1:4402`), `PUBLIC_ORIGIN`; needs the local Supabase with Mailpit. CI runs it in the `smoke` job. Creates and deletes an account — never against production
- `npm run lint` — ESLint with type-checked rules
- `npm run lint:fix` — auto-fix lint issues
- `npm run format` — Prettier (includes prettier-plugin-astro + prettier-plugin-tailwindcss)
- `npm run smoke` — dependency-free auth-flow smoke test (`scripts/smoke.mjs`) against a running server, `BASE_URL` env (default `http://localhost:4321`). Run after dependency upgrades; CI runs it against `astro dev` with a local Supabase.
- `npm test` — Vitest unit tests in `test/unit/` (ING and Santander statement parsers against their `test/fixtures/*/expected.json`, the format detector, import payload schema, formatting, the Santander merchant-pattern partition against the oracle plus the cross-bank join, the ING merchant key-text pin guarding against a silent rename — S-11, and the kit-contract test pinning the keys, indices and placeholders the app reads from `content.json`); config `vitest.config.ts` via Astro's `getViteConfig`, so the `@/*` alias works. CI runs it in the `ci` job after `fixture:check`.
- `npm run fixture:ing` / `fixture:santander` — regenerate each bank's synthetic fixture under `test/fixtures/<bank>/` (deterministic, byte-exact); `fixture:check` — the CI gate, covers both banks in one run; `fixture:shape` / `fixture:shape:santander` — local-only structure comparison against a real export (`data/`, gitignored), never a CI gate, prints masks/shares only.
- `npx supabase test db` — pgTAP database tests in `supabase/tests/database/` (RLS isolation, cascade, constraints) against the local Supabase; CI runs it in the `smoke` job before the smoke test.
- `npm run db:types` — regenerate `src/db/database.types.ts` (typed `Database` for the Supabase client, row aliases in `src/types.ts`) from the local Supabase; run after every migration, never edit the file by hand.

Pre-commit hooks: husky + lint-staged runs `eslint --fix` on `*.{ts,tsx,astro}` and `prettier --write` on `*.{json,css,md}`.

## Architecture

**Astro 7 SSR app** with React 19 islands, Tailwind 4, Supabase auth, and shadcn/ui components. Deployed as a Docker container (Node 22, `@astrojs/node` standalone) on the owner's VPS at `https://rytm.ariom.cloud`: Caddy terminates TLS and proxies to `127.0.0.1:4402`; `security.allowedDomains` in `astro.config.mjs` makes Astro trust Caddy's `X-Forwarded-Proto`/`-Host` for that host only (without it form POSTs get 403 and e-mailed links point at `http://`). `GET /api/health` is the container health check and must never touch Supabase.

### Rendering mode

Full server-side rendering (`output: "server"` in astro.config.mjs). All pages are server-rendered by default. API routes must export `const prerender = false`.

### Auth flow

- `src/lib/supabase.ts` — creates a Supabase SSR client using `@supabase/ssr` with cookie-based sessions. Uses `astro:env/server` for `SUPABASE_URL` and `SUPABASE_KEY` (server-only secrets declared in astro.config.mjs `env.schema`).
- `src/middleware.ts` — runs on every request, resolves the current user, attaches to `context.locals.user`. Redirects unauthenticated users away from routes listed in `PROTECTED_ROUTES`.
- API endpoints: `src/pages/api/auth/{signin,signup,signout,reset,resend}.ts`, `src/pages/api/auth/reset/new.ts` (set password for the recovery session, then sign out)
- `src/pages/auth/callback.ts` — landing point of every e-mailed link (PKCE `?code=` + `sb_flow_id`): exchanges the code for a session and continues to `next` (`/home` or `/reset/new`, allow-listed in `src/lib/auth-rules.ts`). A failed exchange (other browser, expired) falls back to `/login?confirmed=1` or `/reset/new?state=expired` — the e-mail is confirmed on Supabase's `/verify` regardless
- Signup stores the address in the `rytm-pending-email` cookie (httpOnly, 15 min) so `/confirm-email` can offer "Wyślij ponownie" (`/api/auth/resend`, 60 s cooldown mirrored client-side); an existing address answers `/register?error=occupied` (Supabase returns a placeholder user with no identities when confirmations are on, `user_already_exists` when off)
- Auth pages: `src/pages/{login,register,reset,confirm-email}.astro`, `src/pages/reset/new.astro` (AuthLayout)
- Protected pages: `/home`, `/patterns`, `/fixed`, `/imports`, `/settings` (AppLayout); middleware also sends signed-in users from `/login` and `/register` to `/home`

### Key conventions

- **Path alias**: `@/*` maps to `./src/*` (tsconfig paths).
- **Astro components** for static content/layout; **React components** only when interactivity is needed.
- **Tailwind class merging**: use the `cn()` helper from `@/lib/utils` (clsx + tailwind-merge) for conditional/merged class names. Do not concatenate class strings manually.
- **shadcn/ui**: components live in `src/components/ui/`, "new-york" style variant. Install new ones with `npx shadcn@latest add [name]`.
- **API routes**: use uppercase `GET`, `POST` exports; validate input with zod.
- **React**: no Next.js directives ("use client" etc.). Extract hooks to `src/components/hooks/`.
- **Services/helpers** go in `src/lib/` (or `src/lib/services/` for extracted business logic).
- **Shared types** (entities, DTOs) go in `src/types.ts`.

### Environment

- Node.js v22.14.0 (see `.nvmrc`)
- Local Supabase: start Docker Desktop, then `npx supabase start` (project `rytm`; API `:54321`, Studio `:54323`, Mailpit `:54324`). `supabase/seed.sql` runs on every `start` / `db reset` and creates the confirmed test account `test@rytm.local` / `Rytm-Test-Passw0rd!` (fixed UUID `11111111-1111-4111-8111-111111111111`); it also creates the demo account `demo@rytm.local` / `Rytm-Demo-Passw0rd!` (UUID `22222222-2222-4222-8222-222222222222`), guarded because `.env.example` sets `DEMO_EMAIL=demo@rytm.local` (`astro dev` reads `DEMO_EMAIL` from `.env`, not from the launching shell); local signup needs no email confirmation (`enable_confirmations = false`). Seed is local/CI only — `db push` never applies it
- First local run: `npx supabase start` → `npm run dev` → `npm run smoke` (must end with `All smoke steps passed`, including "seeded test user signs in")
- Migrations: `npx supabase start` applies everything in `supabase/migrations/`; after pulling new ones run `npx supabase migration up` (or `db reset`). Production is the self-hosted stack `rytm-supabase` on the VPS (the hosted project `psqbtvooufapkatpkxlw` is retired). It is reached only by the CI `deploy` job after the merge: `tar --format=ustar -C supabase -cf - migrations | ssh apps-deploy@$DEPLOY_HOST migrate rytm --dry-run`, then the same without `--dry-run`, then `migrations rytm` (the "Migration ledger" step, JSON `{version,name}` list). No Supabase CLI, `SUPABASE_ACCESS_TOKEN` or `SUPABASE_DB_PASSWORD` is involved; nobody applies migrations to production by hand or from an agent session. Migration files must not contain a backslash (the server rejects them; `test/unit/migrations-no-backslash.test.ts` catches it in the PR). A failed migration stops the deploy; fix forward in a new PR. Database backups are taken by `ariom-db-backup` (ariom-infra). `migration repair` and a production database reset are owner-only, done as root on the VPS via `docker exec`. Migrations never apply `seed.sql` (seed is local/CI only). A new table needs its pgTAP proof: a new file in `supabase/tests/database/` or an extension of `domain_rls.test.sql`
- Production deploy: push to `main` → `ci` + `smoke` + `image` (push `ghcr.io/vince307/rytm:<sha>`) → `deploy` job: Tailscale → `ssh apps-deploy@… status rytm` → self-hosted migrations (`migrate rytm --dry-run`, `migrate rytm`, `migrations rytm`) → `login rytm` / `deploy rytm <sha>` / `logout rytm` (forced-command dispatcher from the `ariom-infra` repo; it health-checks and falls back to the last good image) → `curl https://rytm.ariom.cloud/api/health`. There are no preview deploys
- Deployment state and secret inventory: `context/deployment/deploy-plan.md`

## CI

CI gate and production deploy job: `@.github/workflows/ci.yml` (`ci` → `smoke` + `image` → `deploy` on push to `main`; `deploy` needs `DEPLOY_HOST`, `DEPLOY_SSH_KEY`, `DEPLOY_KNOWN_HOSTS`, `TS_OAUTH_CLIENT_ID`, `TS_OAUTH_SECRET` on the `production` environment; no Supabase secrets, all listed in `context/deployment/deploy-plan.md`).
<!-- BEGIN @przeprogramowani/10x-cli -->

## Zestaw narzędzi AI 10xDevs — Moduł 3, Lekcja 4 (testy E2E)

**W przypadku testów E2E używaj dwóch umiejętności M3L4 w tej kolejności:**

1. **`/10x-e2e-setup`** — jednorazowa konfiguracja: konfiguracja Playwright (`webServer`,
   projekt uwierzytelniania `setup`, `storageState`), zielony test seed oraz `context/foundation/test-stack.md`.
2. **`/10x-e2e`** — pętla dla każdego ryzyka: ryzyko → eksploracja uruchomionej aplikacji za pomocą
   `playwright-cli` → generowanie → przegląd względem pięciu antywzorców → ponowne zapytanie po nazwie → weryfikacja poprzez celowe wprowadzenie błędu.

Katalogi `references/` umiejętności zawierają pełne reguły, antywzorce, wzorzec seed oraz
szablon promptu.

Kilka twardych zasad obowiązujących jeszcze przed wywołaniem umiejętności:

- **Lokatory:** najpierw `getByRole` / `getByLabel` / `getByText`; `getByTestId`
  tylko wtedy, gdy atrybuty dostępności są niejednoznaczne. Nigdy selektory CSS, XPath
  ani struktura DOM.
- **Nigdy `page.waitForTimeout()`.** Czekaj na stan: `toBeVisible()`,
  `waitForURL()`, `waitForResponse()`.
- **Niezależność testów + czyszczenie.** Każdy test uruchamia się samodzielnie — własna konfiguracja,
  akcja, asercja i czyszczenie; unikalne identyfikatory (sufiks timestamp), aby równoległe uruchomienia
  i ponowne uruchomienia nie kolidowały.

Dwie granice, które należy jasno rozróżniać:

- **DOM (snapshot) jest domyślny.** Vision (`--caps=vision`) stanowi uzupełnienie dla
  ryzyk wyłącznie wizualnych (układ, z-index, animacja); do regresji pikselowych preferuj
  deterministyczne narzędzia (`toHaveScreenshot`, Argos, Lost Pixel). Wybór/koszt modelu VLM
  to temat debugowania (Lekcja 5), a nie testowania.
- **Czerwony test jest sygnałem, a nie obowiązkiem.** Zmieniony selektor → zaktualizuj
  lokator w sprawdzonym diffie. Zmienione zachowanie biznesowe → test wykrył
  błąd; nigdy nie edytuj asercji, aby je dopasować. Naprawianie nieudanych testów to Lekcja 5.

<!-- END @przeprogramowani/10x-cli -->
