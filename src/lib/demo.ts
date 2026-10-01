// Shared public demo account (S-09, FR-014): the account whose e-mail equals DEMO_EMAIL may browse and tune
// patterns, but not change its password, delete itself, undo an import or add a second one. The endpoints read
// DEMO_EMAIL from `astro:env/server` and pass it in, so this module stays pure (Vitest loads it without Astro).

/** True when `email` is the configured demo address (trimmed, case-insensitive); never when either is empty. */
export function isDemoEmail(email: string | undefined | null, demoEmail: string | undefined): boolean {
  const a = email?.trim().toLowerCase();
  const b = demoEmail?.trim().toLowerCase();
  if (!a || !b) {
    return false;
  }
  return a === b;
}

/** The demo account may import only while it is empty — the owner's first (re)seed after a reset. */
export function demoImportAllowed(existingImports: number): boolean {
  return existingImports === 0;
}

/** Where a refused action sends the demo account; each page shows the refusal in its existing error slot. */
export const DEMO_ERROR = {
  password: "/settings?error=demo-password",
  delete: "/settings?error=demo-delete",
  undo: "/imports?error=demo",
  import: "/imports/new?error=demo",
  resetNew: "/reset/new?error=demo",
} as const;
