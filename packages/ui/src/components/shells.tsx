import * as React from "react";
import { cn } from "../cn";
import { Blobs, Logo, Label } from "./primitives";
import { PillNav, SidebarNav, TabBar, type NavItem } from "./nav";

/** Public shell: blue ground, glass pill nav, orange CTA slot on the right. */
export function PublicHeader({ items, cta, brand = "PHANET KNUST", home = "/" }: { items: NavItem[]; cta?: React.ReactNode; brand?: string; home?: string }) {
  return (
    <header className="container-page pt-6 relative z-10">
      <div className="flex items-center justify-between gap-4">
        <Logo text={brand} href={home} />
        <div className="hidden md:block"><PillNav items={items} /></div>
        <div className="flex items-center gap-2">{cta}</div>
      </div>
      <div className="md:hidden mt-4"><PillNav items={items} /></div>
    </header>
  );
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
      <Blobs variant="ice" />
      <div className="relative flex gap-6 p-3 md:p-5 min-h-dvh">
        <aside className={cn("sidebar hidden lg:flex w-[260px] flex-none sticky top-5 self-start max-h-[calc(100dvh-40px)]", variant === "exec" && "sidebar-exec")}>
          <div className="px-3 pb-4 pt-1"><Logo text={brand} /></div>
          <SidebarNav items={items} />
          <div className="mt-auto pt-6 flex flex-col gap-4">
            {promo}
            {footer}
          </div>
        </aside>
        <div className="flex-1 min-w-0 pb-28 lg:pb-8">
          <div className="lg:hidden flex items-center justify-between mb-5 px-1">
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
    <div className="card-orange p-4 rounded-[20px]">
      <Label tone="white" className="mb-1 !text-[10px]">{label}</Label>
      <div className="script text-[18px] leading-tight">{children}</div>
    </div>
  );
  return href ? <a href={href} className="no-underline block">{body}</a> : body;
}

export function SidebarUser({ name, role, action }: { name: string; role?: string; action?: React.ReactNode }) {
  return (
    <div className="px-3 text-xs">
      <div className="text-white/70">Signed in as</div>
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
      <div className="container-page py-8 flex flex-wrap items-center justify-between gap-4 text-xs text-white/85 border-t border-white/15">
        <span className="wordmark text-white">{brand}</span>
        <div className="flex flex-wrap gap-5">
          {links.map((l) => <a key={l.href} href={l.href} className="hover:text-white">{l.label}</a>)}
        </div>
        <span>{note ?? `Kumasi, Ghana · ${new Date().getFullYear()}`}</span>
      </div>
    </footer>
  );
}
