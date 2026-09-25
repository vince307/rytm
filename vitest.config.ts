/// <reference types="vitest/config" />
// getViteConfig applies the Astro project's Vite config, so the `@/*` alias from tsconfig works in tests.
import { getViteConfig } from "astro/config";

export default getViteConfig({
  test: {
    include: ["test/unit/**/*.test.ts"],
  },
});
