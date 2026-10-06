import "server-only";
import { createAdminClient, type Db } from "@phanet/supabase/server";

export const hasServiceRole = () => Boolean(process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY);

/** Secret-key client or null when SUPABASE_SECRET_KEY / SUPABASE_SERVICE_ROLE_KEY is missing. Auth user management only. */
export function adminClient(): Db | null {
  try {
    return createAdminClient();
  } catch {
    return null;
  }
}
export const NO_SERVICE_ROLE = "SUPABASE_SECRET_KEY is not set on this deployment, so user accounts can't be created or deleted from here. Add it in the host's environment variables.";
