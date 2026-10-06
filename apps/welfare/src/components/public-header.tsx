import { ButtonLink, PublicHeader } from "@phanet/ui";
import { BRAND } from "@/lib/brand";

export const PUBLIC_NAV = [
  { href: "/", label: "Shop" },
  { href: "/track", label: "Track a request" },
  { href: "/#how", label: "How it works", external: true },
];

export function WelfareHeader() {
  return <PublicHeader brand={BRAND} items={PUBLIC_NAV} cta={<ButtonLink href="/team" variant="ghost" size="sm">Team login</ButtonLink>} />;
}
