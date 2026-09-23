import { createServerClient, parseCookieHeader } from "@supabase/ssr";
import type { AstroCookies } from "astro";
import { SUPABASE_URL, SUPABASE_KEY } from "astro:env/server";

export function createClient(requestHeaders: Headers, cookies: AstroCookies) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return null;
  }
  return createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() {
        return parseCookieHeader(requestHeaders.get("Cookie") ?? "");
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookies.set(name, value, options);
        });
      },
    },
  });
}

/**
 * Client with no cookie access: verifies a password (`signInWithPassword`) without reading or
 * writing the caller's session cookies, so a check never replaces the current session.
 */
function createStatelessClient() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return null;
  }
  return createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll: () => [],
      // eslint-disable-next-line @typescript-eslint/no-empty-function -- intentionally drops the tokens signInWithPassword would set
      setAll() {},
    },
  });
}

/**
 * Checks the signed-in user's password before a sensitive action (password change, account
 * deletion). The check mints a real GoTrue session, which is revoked straight away with
 * `scope: "local"` so it never lingers in `auth.sessions`; the caller's own session is untouched.
 * Returns `null` when Supabase is not configured.
 */
export async function verifyPassword(email: string, password: string): Promise<boolean | null> {
  const verifier = createStatelessClient();
  if (!verifier) {
    return null;
  }
  const { error } = await verifier.auth.signInWithPassword({ email, password });
  if (error) {
    return false;
  }
  await verifier.auth.signOut({ scope: "local" });
  return true;
}
