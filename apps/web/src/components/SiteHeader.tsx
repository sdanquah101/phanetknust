import { ButtonLink, PublicHeader } from "@phanet/ui";
import { ACADEMY_URL } from "@/lib/links";

export function SiteHeader() {
  return (
    <PublicHeader
      items={[
        { href: "/", label: "Home", exact: true },
        { href: "/about", label: "About" },
        { href: "/programs", label: "Programs" },
        { href: "/shop", label: "Shop" },
        { href: ACADEMY_URL, label: "Academy", external: true },
      ]}
      cta={<ButtonLink href="/give" size="sm">Give</ButtonLink>}
    />
  );
}
