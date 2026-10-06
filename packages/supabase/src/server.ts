import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient as createBareClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cookieDomain, supabaseAnonKey, supabaseSecretKey, supabaseUrl } from "./env";
import { canAccess, type Role } from "./roles";
import type { Profile } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Db = SupabaseClient<any, "public", any>;

/** Server component / server action / route handler client bound to the request cookies. */
export async function createClient(): Promise<Db> {
  const store = await cookies();
  return createServerClient(supabaseUrl(), supabaseAnonKey(), {
    cookieOptions: { domain: cookieDomain(), path: "/", sameSite: "lax", secure: process.env.NODE_ENV === "production" },
    cookies: {
      getAll: () => store.getAll(),
      setAll: (all) => {
        try {
          all.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          /* called from a Server Component; middleware refreshes the session instead */
        }
      },
    },
  });
}

/** Service-role client. Server only. Bypasses RLS — use for admin tasks and webhooks. */
export function createAdminClient(): Db {
  const key = supabaseSecretKey();
  if (!key) throw new Error("SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY) is not set");
  return createBareClient(supabaseUrl(), key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export type Session = {
  user: { id: string; email?: string | null };
  profile: Profile | null;
  roles: Role[];
};

/** Current user + profile + roles, or null when signed out. */
export async function getSession(): Promise<Session | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const [{ data: profile }, { data: roleRows }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", user.id),
  ]);
  return {
    user: { id: user.id, email: user.email },
    profile: (profile as Profile | null) ?? null,
    roles: ((roleRows ?? []) as { role: Role }[]).map((r) => r.role),
  };
}

/**
 * Gate a page: redirects to login when signed out, to /no-access when the user lacks a role.
 * `allowed` empty means admin only.
 */
export async function requireRoles(allowed: readonly Role[], opts: { loginPath?: string; next?: string } = {}): Promise<Session> {
  const session = await getSession();
  if (!session) redirect(`${opts.loginPath ?? "/login"}${opts.next ? `?next=${encodeURIComponent(opts.next)}` : ""}`);
  if (!canAccess(session.roles, allowed)) redirect("/no-access");
  return session;
}

export async function requireUser(opts: { loginPath?: string; next?: string } = {}): Promise<Session> {
  const session = await getSession();
  if (!session) redirect(`${opts.loginPath ?? "/login"}${opts.next ? `?next=${encodeURIComponent(opts.next)}` : ""}`);
  return session;
}
