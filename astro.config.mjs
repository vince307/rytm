// @ts-check
import { defineConfig, envField } from "astro/config";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import node from "@astrojs/node";

// https://astro.build/config
export default defineConfig({
  site: "https://rytm.ariom.cloud",
  output: "server",
  integrations: [react(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
  // Standalone Node server (dist/server/entry.mjs) in a container on the VPS, behind Caddy (TLS) — Dockerfile.
  adapter: node({ mode: "standalone" }),
  // Caddy reaches the container over plain HTTP on 127.0.0.1:4402 and sends X-Forwarded-Proto/-Host. Astro trusts
  // those headers only for hosts listed here; without it context.url is http://…, so the CSRF origin check answers
  // 403 to every form POST from https://rytm.ariom.cloud and e-mailed links point at http://.
  // scripts/check-proxy-origin.mjs (CI smoke job) guards both.
  security: {
    allowedDomains: [{ hostname: "rytm.ariom.cloud", protocol: "https" }],
  },
  env: {
    schema: {
      SUPABASE_URL: envField.string({ context: "server", access: "secret", optional: true }),
      SUPABASE_KEY: envField.string({ context: "server", access: "secret", optional: true }),
      DEMO_EMAIL: envField.string({ context: "server", access: "secret", optional: true }),
      // Bearer secret for /api/keep-alive, sent by .github/workflows/keep-alive.yml. Server .env on the VPS; must
      // match the CRON_SECRET repository secret. Optional so builds pass without it; the route fails closed (401).
      CRON_SECRET: envField.string({ context: "server", access: "secret", optional: true }),
    },
  },
});
