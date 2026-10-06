import { handleAuthCallback } from "@phanet/supabase/callback";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  return handleAuthCallback(request);
}
