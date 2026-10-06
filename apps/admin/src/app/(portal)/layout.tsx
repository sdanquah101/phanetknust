import { PORTAL_ROLES } from "@phanet/supabase/roles";
import { requireRoles } from "@phanet/supabase/server";
import { signOutAction } from "@phanet/supabase/actions";
import { PortalShell, SidebarUser, type NavItem } from "@phanet/ui";
import { BRAND } from "@/lib/brand";

const items: NavItem[] = [
  { href: "/", label: "Overview" },
  { href: "/users", label: "Users & access" },
  { href: "/site", label: "Site content" },
  { href: "/programs", label: "Programs" },
  { href: "/events", label: "Events" },
  { href: "/shop", label: "Shop" },
  { href: "/academy", label: "Academy" },
  { href: "/prayerwall", label: "Prayer wall" },
  { href: "/funds", label: "Giving funds" },
];
const mobileItems: NavItem[] = [
  { href: "/", label: "Overview" },
  { href: "/users", label: "Users" },
  { href: "/site", label: "Site" },
  { href: "/academy", label: "Academy" },
];

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRoles(PORTAL_ROLES.admin);
  const name = session.profile?.full_name ?? session.user.email ?? "Admin";
  return (
    <PortalShell
      brand={BRAND}
      variant="exec"
      items={items}
      mobileItems={mobileItems}
      footer={
        <SidebarUser
          name={name}
          role="Admin"
          action={
            <form action={signOutAction}>
              <button className="btn btn-ghost btn-sm">Sign out</button>
            </form>
          }
        />
      }
    >
      {children}
    </PortalShell>
  );
}
