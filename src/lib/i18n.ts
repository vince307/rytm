export type Locale = "pl" | "en";

export const LOCALES: readonly Locale[] = ["pl", "en"];
export const DEFAULT_LOCALE: Locale = "pl";
export const LOCALE_COOKIE = "rytm-locale";
export const INTL_TAG: Record<Locale, string> = { pl: "pl-PL", en: "en-GB" };

export function isLocale(v: unknown): v is Locale {
  return typeof v === "string" && (LOCALES as readonly string[]).includes(v);
}

/** Cookie wins; else the highest-q supported primary subtag of Accept-Language; else the default. */
export function resolveLocale(cookieValue: string | undefined, acceptLanguage: string | null): Locale {
  if (isLocale(cookieValue)) return cookieValue;
  if (!acceptLanguage) return DEFAULT_LOCALE;

  let best: { locale: Locale; q: number } | null = null;
  for (const part of acceptLanguage.split(",")) {
    const [tag, ...params] = part.trim().split(";");
    const primary = tag.trim().toLowerCase().split("-")[0];
    if (!isLocale(primary)) continue;
    let q = 1;
    for (const p of params) {
      const m = /^\s*q\s*=\s*([0-9.]+)\s*$/i.exec(p);
      if (m) q = Number(m[1]);
    }
    if (!(q > 0)) continue;
    if (!best || q > best.q) best = { locale: primary, q };
  }
  return best ? best.locale : DEFAULT_LOCALE;
}
