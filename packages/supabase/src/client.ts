"use client";
import { createBrowserClient } from "@supabase/ssr";
import { cookieDomain, supabaseAnonKey, supabaseUrl } from "./env";

let client: ReturnType<typeof createBrowserClient> | undefined;

/** Browser Supabase client. Cookie domain is shared across *.phaneteers.com. */
export function createClient() {
  if (client) return client;
  client = createBrowserClient(supabaseUrl(), supabaseAnonKey(), {
    cookieOptions: { domain: cookieDomain(), path: "/", sameSite: "lax", secure: process.env.NODE_ENV === "production" },
  });
  return client;
}
