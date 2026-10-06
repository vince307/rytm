// @ts-check
import { defineConfig, envField } from "astro/config";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import vercel from "@astrojs/vercel";

// https://astro.build/config
export default defineConfig({
  output: "server",
  integrations: [react(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
  adapter: vercel(),
  env: {
    schema: {
      SUPABASE_URL: envField.string({ context: "server", access: "secret", optional: true }),
      SUPABASE_KEY: envField.string({ context: "server", access: "secret", optional: true }),
      DEMO_EMAIL: envField.string({ context: "server", access: "secret", optional: true }),
      // Bearer secret for /api/keep-alive, sent by .github/workflows/keep-alive.yml. Vercel Production scope; must
      // match the CRON_SECRET repository secret. Optional so builds pass without it; the route fails closed (401).
      CRON_SECRET: envField.string({ context: "server", access: "secret", optional: true }),
    },
  },
});
