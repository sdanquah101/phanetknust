import * as React from "react";
import { Blobs, ButtonLink, HeroCurve, PublicHeader, type NavItem } from "@phanet/ui";
import { BRAND } from "@/lib/brand";
import { SiteFooter } from "./SiteFooter";

const NAV: NavItem[] = [
  { href: "/", label: "Wall" },
  { href: "/testimonies", label: "Testimonies" },
  { href: "/share", label: "Share a testimony" },
];

/**
 * With `hero`, the header and hero sit on dark woven cloth and the page continues on cream.
 * Without it, the whole page stays on the dark ground.
 */
export function Shell({ children, hero }: { children: React.ReactNode; hero?: React.ReactNode }) {
  const header = (
    <PublicHeader
      items={NAV}
      brand={BRAND}
      cta={
        <ButtonLink href="/#add" size="sm">
          + Add a request
        </ButtonLink>
      }
    />
  );
  if (hero) {
    return (
      <div className="min-h-dvh flex flex-col bg-cream">
        <div className="ground-blue">
          <Blobs />
          {header}
          <div className="container-page relative py-10 md:py-16">{hero}</div>
          <HeroCurve />
        </div>
        <main className="container-page relative flex-1 flex flex-col gap-14 md:gap-20 py-12 md:py-16">{children}</main>
        <SiteFooter />
      </div>
    );
  }
  return (
    <div className="ground-blue min-h-dvh flex flex-col">
      <Blobs />
      {header}
      <main className="container-page relative z-10 flex-1 flex flex-col gap-12 md:gap-16 py-10 md:py-14">{children}</main>
      <SiteFooter />
    </div>
  );
}
