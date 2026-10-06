import { PortalShell, SidebarUser } from "@phanet/ui";
import { requireRoles } from "@phanet/supabase/server";
import { PORTAL_ROLES } from "@phanet/supabase/roles";
import { signOutAction } from "@phanet/supabase/actions";
import { BRAND } from "@/lib/brand";

const NAV = [
  { href: "/team", label: "Dashboard", exact: true },
  { href: "/team/requests", label: "Requests" },
  { href: "/team/items", label: "Stock" },
  { href: "/team/movements", label: "Movements" },
  { href: "/", label: "View shop ↗", external: true },
];
const MOBILE = [
  { href: "/team", label: "Home", exact: true },
  { href: "/team/requests", label: "Requests" },
  { href: "/team/items", label: "Stock" },
  { href: "/team/movements", label: "Moves" },
];

export default async function TeamLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRoles(PORTAL_ROLES.welfare, { next: "/team" });
  const name = session.profile?.full_name ?? session.user.email ?? "Team";
  const role = session.roles.includes("admin") ? "Admin" : "Welfare team";
  return (
    <PortalShell
      variant="exec"
      brand={BRAND}
      items={NAV}
      mobileItems={MOBILE}
      footer={
        <SidebarUser
          name={name}
          role={role}
          action={<form action={signOutAction}><button className="btn btn-ghost btn-sm">Sign out</button></form>}
        />
      }
      topRight={<form action={signOutAction}><button className="btn btn-ice btn-sm">Sign out</button></form>}
    >
      {children}
    </PortalShell>
  );
}
