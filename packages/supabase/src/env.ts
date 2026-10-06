export function supabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://localhost:54321";
}
export function supabaseAnonKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "public-anon-key";
}
export function cookieDomain(): string | undefined {
  const d = process.env.NEXT_PUBLIC_COOKIE_DOMAIN;
  return d && d.trim() ? d.trim() : undefined;
}
export const isConfigured = () => Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
