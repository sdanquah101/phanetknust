import { updateSession } from "@phanet/supabase/middleware";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  return updateSession(request, { protect: ["/team"], publicPaths: ["/login", "/no-access", "/auth"] });
}

// Only the team area and auth pages need a session; the public shop stays fast and cookie-free.
export const config = { matcher: ["/team/:path*", "/login", "/no-access", "/auth/:path*", "/account/:path*"] };
