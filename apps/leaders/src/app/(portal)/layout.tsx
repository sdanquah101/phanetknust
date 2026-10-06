import { PortalShell, SidebarPromo, SidebarUser } from "@phanet/ui";
import { requireRoles } from "@phanet/supabase/server";
import { PORTAL_ROLES } from "@phanet/supabase/roles";
import { signOutAction } from "@phanet/supabase/actions";
import { BRAND } from "@/lib/brand";

const items = [
  { href: "/", label: "Home" },
  { href: "/sheep", label: "My sheep" },
  { href: "/followups", label: "Follow-ups" },
  { href: "/reports", label: "Weekly report" },
  { href: "/attendance", label: "Attendance" },
  { href: "/transfers", label: "Transfers" },
];
const mobileItems = [
  { href: "/", label: "Home" },
  { href: "/sheep", label: "Sheep" },
  { href: "/followups", label: "Follow-ups" },
  { href: "/reports", label: "Report" },
];

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRoles(PORTAL_ROLES.leaders);
  const name = session.profile?.full_name ?? session.user.email ?? "Leader";
  return (
    <PortalShell
      brand={BRAND}
      variant="exec"
      items={items}
      mobileItems={mobileItems}
      promo={<SidebarPromo label="THEME 2026/27">Despise not thy youth</SidebarPromo>}
      footer={
        <SidebarUser
          name={name}
          role="Executive"
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
