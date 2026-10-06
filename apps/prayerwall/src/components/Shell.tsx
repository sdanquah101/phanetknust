import * as React from "react";
import { Blobs, ButtonLink, PublicHeader, type NavItem } from "@phanet/ui";
import { BRAND } from "@/lib/brand";
import { SiteFooter } from "./SiteFooter";

const NAV: NavItem[] = [
  { href: "/", label: "Wall" },
  { href: "/testimonies", label: "Testimonies" },
  { href: "/share", label: "Share a testimony" },
];

/** The whole app lives on the blue ground. */
export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="ground-blue min-h-dvh flex flex-col">
      <Blobs />
      <PublicHeader
        items={NAV}
        brand={BRAND}
        cta={
          <ButtonLink href="/#add" size="sm">
            + Add a request
          </ButtonLink>
        }
      />
      <main className="container-page relative z-10 flex-1 flex flex-col gap-12 md:gap-16 py-10 md:py-14">{children}</main>
      <SiteFooter />
    </div>
  );
}
