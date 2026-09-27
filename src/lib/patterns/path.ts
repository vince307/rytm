// One place for the pattern key ↔ URL mapping (S-04 Autonomous decision 4). The detail route is a rest route
// (`[...key].astro`) so a key containing `/` still matches; `keyFromPath` reads the raw, percent-encoded pathname
// (`Astro.url.pathname`), never `Astro.params`, which would already have decoded (and so mis-split) a `/`.

/** `/patterns/<encodeURIComponent(key)>`, optionally with `month` (always first) and other query params. */
export function patternHref(key: string, params?: Record<string, string>, month?: string): string {
  const search = new URLSearchParams();
  if (month) search.set("month", month);
  if (params) {
    for (const [name, value] of Object.entries(params)) search.set(name, value);
  }
  const query = search.toString();
  return `/patterns/${encodeURIComponent(key)}${query ? `?${query}` : ""}`;
}

const PREFIX = "/patterns/";

/** Strips the `/patterns/` prefix and decodes once; `null` for an empty or non-matching segment. A pathname
 * that is not itself percent-encoded (already decoded by the runtime) is not valid UTF-8 percent-encoding, so
 * `decodeURIComponent` throws and the raw segment is used as-is — correct either way. */
export function keyFromPath(pathname: string): string | null {
  if (!pathname.startsWith(PREFIX)) return null;
  const segment = pathname.slice(PREFIX.length);
  if (!segment) return null;
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}
