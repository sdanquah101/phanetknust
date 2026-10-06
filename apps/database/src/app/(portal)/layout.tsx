import { requireRoles } from "@phanet/supabase/server";
import { PORTAL_ROLES } from "@phanet/supabase/roles";
import { Shell } from "@/components/Shell";

export const dynamic = "force-dynamic";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRoles(PORTAL_ROLES.database);
  return <Shell session={session}>{children}</Shell>;
}
