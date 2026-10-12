import { ButtonLink, PublicHeader } from "@phanet/ui";
import { ACADEMY_URL } from "@/lib/links";

export const SITE_NAV = [
  { href: "/", label: "Home", exact: true },
  { href: "/about", label: "About" },
  { href: "/programs", label: "Programs" },
  { href: "/gallery", label: "Gallery" },
  { href: "/shop", label: "Shop" },
  { href: ACADEMY_URL, label: "Academy", external: true },
];

/** White header with a kente bar above it. Pass tone="dark" only on a dark woven hero. */
export function SiteHeader({ tone = "light" }: { tone?: "light" | "dark" }) {
  return (
    <PublicHeader
      tone={tone}
      items={SITE_NAV}
      cta={<ButtonLink href="/give" size="sm" variant={tone === "light" ? "black" : "orange"}>Give</ButtonLink>}
    />
  );
}
