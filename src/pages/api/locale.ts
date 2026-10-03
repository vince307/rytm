import type { APIRoute } from "astro";
import { z } from "zod";
import { LOCALES, LOCALE_COOKIE, localeRedirectTarget } from "@/lib/i18n";

export const prerender = false;

const LOCALE_MAX_AGE = 60 * 60 * 24 * 365;

const schema = z.object({ locale: z.enum(LOCALES as [string, ...string[]]) });

// Public (no auth guard): the language is a browser preference. Astro's default `checkOrigin` guards the POST
// the same way as the other form endpoints; the redirect target is same-origin only.
export const POST: APIRoute = async ({ request, cookies, url, redirect }) => {
  const form = await request.formData().catch(() => null);
  const parsed = schema.safeParse({ locale: form?.get("locale") });
  if (!parsed.success) return new Response(null, { status: 400 });

  cookies.set(LOCALE_COOKIE, parsed.data.locale, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: url.protocol === "https:",
    maxAge: LOCALE_MAX_AGE,
  });
  return redirect(localeRedirectTarget(request.headers.get("referer"), url.origin), 303);
};
