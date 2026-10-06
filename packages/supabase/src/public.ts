import { createClient as createBareClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseAnonKey, supabaseUrl } from "./env";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let client: SupabaseClient<any, "public", any> | undefined;

/**
 * Cookie-free anon client for PUBLIC data (programs, products, settings…).
 * Safe inside `unstable_cache` / ISR because it never touches request cookies.
 * Only rows that anon RLS policies allow are visible.
 */
export function createPublicClient() {
  if (client) return client;
  client = createBareClient(supabaseUrl(), supabaseAnonKey(), { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
  return client;
}
