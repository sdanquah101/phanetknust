import { PortalShell, SidebarUser, type NavItem } from "@phanet/ui";
import { signOutAction } from "@phanet/supabase/actions";
import type { Session } from "@phanet/supabase/server";
import { PORTAL_ROLES, ROLE_LABELS, canAccess } from "@phanet/supabase/roles";
import { BRAND } from "@/lib/brand";

const FULL_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", exact: true },
  { href: "/members", label: "Members" },
  { href: "/events", label: "Events" },
  { href: "/attendance", label: "Attendance" },
  { href: "/leaders", label: "Leaders" },
  { href: "/transfers", label: "Transfers" },
  { href: "/data", label: "Import / Export" },
];
const FULL_MOBILE: NavItem[] = [
  { href: "/", label: "Home", exact: true },
  { href: "/members", label: "Members" },
  { href: "/events", label: "Events" },
  { href: "/attendance", label: "Mark" },
  { href: "/leaders", label: "Leaders" },
];
const LIMITED_ITEMS: NavItem[] = [{ href: "/attendance", label: "Attendance" }];

function roleLabel(roles: string[]) {
  if (roles.includes("admin")) return "Admin";
  const r = (["database", "usher", "leader"] as const).find((x) => roles.includes(x));
  return r ? ROLE_LABELS[r] : undefined;
}

/** Portal chrome shared by the (portal) and (attendance) route groups. */
export function Shell({ session, children }: { session: Session; children: React.ReactNode }) {
  const full = canAccess(session.roles, PORTAL_ROLES.database);
  const name = session.profile?.full_name ?? session.user.email ?? "Member";
  return (
    <PortalShell
      brand={BRAND}
      variant="exec"
      items={full ? FULL_ITEMS : LIMITED_ITEMS}
      mobileItems={full ? FULL_MOBILE : LIMITED_ITEMS}
      footer={
        <SidebarUser
          name={name}
          role={roleLabel(session.roles)}
          action={
            <form action={signOutAction}>
              <button className="btn btn-ghost btn-sm">Sign out</button>
            </form>
          }
        />
      }
      topRight={
        <form action={signOutAction}>
          <button className="btn btn-ice btn-sm">Sign out</button>
        </form>
      }
    >
      {children}
    </PortalShell>
  );
}
