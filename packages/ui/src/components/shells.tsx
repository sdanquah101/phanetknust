import * as React from "react";
import { cn } from "../cn";
import { Blobs, Logo, Label } from "./primitives";
import { MobileMenu, PillNav, SidebarNav, TabBar, type NavItem } from "./nav";
import { KenteBar, KenteCloth } from "./kente";

/**
 * Public header: crest + wordmark, pill nav on desktop, menu button on phones.
 * `tone="dark"` sits on a dark woven hero (white text); `tone="light"` sits on white with a kente bar above.
 */
export function PublicHeader({ items, cta, brand = "PHANET KNUST", home = "/", tone = "dark" }: { items: NavItem[]; cta?: React.ReactNode; brand?: string; home?: string; tone?: "dark" | "light" }) {
  const light = tone === "light";
  return (
    <>
      {light && <KenteBar />}
      <header className={cn("container-page relative z-30", light ? "py-4 md:py-5 border-b border-line bg-white/95 text-deep" : "pt-5 md:pt-6 text-white")}>
        <div className="flex items-center justify-between gap-4">
          <Logo text={brand} href={home} light={!light} />
          <div className="hidden md:block"><PillNav items={items} /></div>
          <div className="flex items-center gap-2">
            {cta}
            <MobileMenu items={items} tone={tone} />
          </div>
        </div>
      </header>
    </>
  );
}

/** Woven edge between a dark hero and the page below (was a curve). Props kept for compatibility. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function HeroCurve({ fill, rim = true }: { fill?: string; rim?: boolean }) {
  return <KenteCloth seed={11} stripWidth={56} motion={false} className="hero-curve h-3 md:h-4" />;
}

/** Portal shell: ice page, rounded blue sidebar inset 20px, content on the right. */
export function PortalShell({
  brand, items, children, footer, promo, variant = "member", mobileItems, topRight,
}: {
  brand: string; items: NavItem[]; children: React.ReactNode; footer?: React.ReactNode;
  promo?: React.ReactNode; variant?: "member" | "exec"; mobileItems?: NavItem[]; topRight?: React.ReactNode;
}) {
  return (
    <div className="ground-ice min-h-dvh relative overflow-x-clip">
      <KenteBar className="lg:hidden" />
      <div className="relative flex min-h-dvh">
        <aside className={cn("sidebar hidden lg:flex w-[264px] flex-none sticky top-0 h-dvh overflow-y-auto", variant === "exec" && "sidebar-exec")}>
          <KenteBar className="-mx-4 mb-5 flex-none" />
          <div className="px-2 pb-5"><Logo text={brand} /></div>
          <SidebarNav items={items} />
          <div className="mt-auto pt-6 flex flex-col gap-4">
            {promo}
            {footer}
          </div>
        </aside>
        <div className="flex-1 min-w-0 px-4 pt-5 md:px-8 md:pt-8 pb-28 lg:pb-10">
          <div className="lg:hidden flex items-center justify-between mb-6">
            <Logo text={brand} light={false} />
            {topRight}
          </div>
          <main className="flex flex-col gap-6 max-w-[1180px]">{children}</main>
        </div>
      </div>
      {mobileItems && (
        <div className="lg:hidden fixed bottom-4 left-4 right-4 z-40"><TabBar items={mobileItems} /></div>
      )}
    </div>
  );
}

/** Themed promo block for the bottom of the sidebar. */
export function SidebarPromo({ label, children, href }: { label: string; children: React.ReactNode; href?: string }) {
  const body = (
    <div className="border-t-4 border-gold bg-white/5 p-4">
      <Label tone="peach" className="mb-1 !text-[10px]">{label}</Label>
      <div className="font-extrabold text-[18px] leading-tight text-white">{children}</div>
    </div>
  );
  return href ? <a href={href} className="no-underline block">{body}</a> : body;
}

export function SidebarUser({ name, role, action }: { name: string; role?: string; action?: React.ReactNode }) {
  return (
    <div className="px-3 text-xs">
      <div className="text-white">Signed in as</div>
      <div className="font-bold text-white truncate">{name}{role ? ` · ${role}` : ""}</div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/** Blue hero header for small public apps (prayer wall, welfare). */
export function BlueHero({ children, className, nav }: { children: React.ReactNode; className?: string; nav?: React.ReactNode }) {
  return (
    <section className={cn("ground-blue", className)}>
      <Blobs />
      {nav}
      <div className="container-page relative py-12 md:py-16">{children}</div>
    </section>
  );
}

export function Footer({ brand = "PHANET KNUST", links = [], note }: { brand?: string; links?: { href: string; label: string }[]; note?: string }) {
  return (
    <footer className="ground-blue">
      <KenteCloth seed={21} stripWidth={64} className="h-[56px]" />
      <div className="container-page py-10 flex flex-wrap items-center justify-between gap-6 text-sm text-white">
        <Logo text={brand} />
        <div className="flex flex-wrap gap-5">
          {links.map((l) => <a key={l.href} href={l.href} className="hover:underline">{l.label}</a>)}
        </div>
        <span>{note ?? `Kumasi, Ghana · ${new Date().getFullYear()}`}</span>
      </div>
    </footer>
  );
}
