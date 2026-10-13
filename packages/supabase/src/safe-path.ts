/**
 * Redirect targets that come from a link or a form (`?next=`, a hidden `next` field)
 * must stay on this site. Checking only for a leading "/" is not enough: browsers
 * read "/\evil.com" as "//evil.com", and tabs or newlines are stripped before parsing.
 * Returns a same-site path, or the fallback.
 */
export function safePath(value: unknown, fallback = "/"): string {
  if (typeof value !== "string" || value.length === 0 || value.length > 2048) return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  // Backslashes and control characters can turn a path into another host.
  if (/[\\\u0000-\u001f\u007f]/.test(value)) return fallback;
  const base = "https://same-site.invalid";
  try {
    const url = new URL(value, base);
    if (url.origin !== base) return fallback;
    const path = `${url.pathname}${url.search}${url.hash}`;
    // "/..//evil.com" normalises to "//evil.com", which would leave the site.
    if (path.startsWith("//")) return fallback;
    return path;
  } catch {
    return fallback;
  }
}
