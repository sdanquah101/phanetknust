/*
 * Supabase settings. Both naming schemes are accepted:
 *   new:    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (sb_publishable_…)  /  SUPABASE_SECRET_KEY (sb_secret_…)
 *   legacy: NEXT_PUBLIC_SUPABASE_ANON_KEY (eyJ…)                     /  SUPABASE_SERVICE_ROLE_KEY (eyJ…)
 * Each NEXT_PUBLIC_ variable is referenced directly so Next.js can inline it into the browser bundle.
 */
let warned = false;
function warnOnce(what: string) {
  if (warned || process.env.NODE_ENV !== "production") return;
  warned = true;
  console.error(`[phanet] ${what} is not set. Add it in Netlify → Site configuration → Environment variables, then redeploy with "Clear cache".`);
}

export function supabaseUrl() {
  const v = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!v) warnOnce("NEXT_PUBLIC_SUPABASE_URL");
  return v ?? "http://localhost:54321";
}
export function supabaseAnonKey() {
  const v = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!v) warnOnce("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)");
  return v ?? "public-anon-key";
}
/** Server-only secret key (bypasses row-level security). */
export function supabaseSecretKey(): string | undefined {
  return process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || undefined;
}
export function cookieDomain(): string | undefined {
  const d = process.env.NEXT_PUBLIC_COOKIE_DOMAIN;
  return d && d.trim() ? d.trim() : undefined;
}
export const isConfigured = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY));
