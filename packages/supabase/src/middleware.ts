import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { cookieDomain, supabaseAnonKey, supabaseUrl } from "./env";

export type ProtectOptions = {
  /** Paths (prefix match) that require a signed-in user. */
  protect?: string[];
  /** Paths that are always public even under a protected prefix. */
  publicPaths?: string[];
  loginPath?: string;
};

/**
 * Refresh the Supabase session cookie on every request and optionally redirect
 * signed-out users away from protected paths. Role checks happen in layouts
 * via `requireRoles`, where we can query the database.
 */
export async function updateSession(request: NextRequest, opts: ProtectOptions = {}) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(supabaseUrl(), supabaseAnonKey(), {
    cookieOptions: { domain: cookieDomain(), path: "/", sameSite: "lax", secure: process.env.NODE_ENV === "production" },
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (all) => {
        all.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        all.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;
  const loginPath = opts.loginPath ?? "/login";
  const isPublic = (opts.publicPaths ?? []).some((p) => pathname === p || pathname.startsWith(p + "/"));
  const isProtected = (opts.protect ?? []).some((p) => pathname === p || pathname.startsWith(p + "/") || p === "/");

  if (!user && isProtected && !isPublic && pathname !== loginPath && !pathname.startsWith("/auth")) {
    const url = request.nextUrl.clone();
    url.pathname = loginPath;
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return response;
}

export const middlewareMatcher = ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)"];
