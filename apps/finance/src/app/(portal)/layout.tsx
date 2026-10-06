import { PortalShell, SidebarPromo, SidebarUser } from "@phanet/ui";
import { requireRoles } from "@phanet/supabase/server";
import { PORTAL_ROLES } from "@phanet/supabase/roles";
import { signOutAction } from "@phanet/supabase/actions";
import { BRAND } from "@/lib/brand";
import { highestRoleLabel } from "@/lib/finance";

const ITEMS = [
  { href: "/", label: "Overview" },
  { href: "/transactions", label: "Transactions" },
  { href: "/approvals", label: "Approvals" },
  { href: "/budgets", label: "Budgets" },
  { href: "/programs", label: "Programs" },
  { href: "/funds", label: "Funds" },
  { href: "/reports", label: "Reports" },
];
const MOBILE = [
  { href: "/", label: "Overview" },
  { href: "/transactions", label: "Ledger" },
  { href: "/approvals", label: "Approvals" },
  { href: "/budgets", label: "Budgets" },
];

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRoles(PORTAL_ROLES.finance);
  const name = session.profile?.full_name || session.user.email || "Finance team";
  return (
    <PortalShell
      brand={BRAND}
      variant="exec"
      items={ITEMS}
      mobileItems={MOBILE}
      promo={<SidebarPromo label="THEME 2026/27">Despise not thy youth</SidebarPromo>}
      footer={
        <SidebarUser
          name={name}
          role={highestRoleLabel(session.roles)}
          action={<form action={signOutAction}><button className="btn btn-ghost btn-sm">Sign out</button></form>}
        />
      }
    >
      {children}
    </PortalShell>
  );
}
