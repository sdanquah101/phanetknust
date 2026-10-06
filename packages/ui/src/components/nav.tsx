"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "../cn";

export type NavItem = { href: string; label: string; icon?: React.ReactNode; external?: boolean; exact?: boolean };

function isActive(pathname: string, item: NavItem) {
  if (item.external) return false;
  if (item.exact || item.href === "/") return pathname === item.href;
  return pathname === item.href || pathname.startsWith(item.href + "/");
}

/** Glass pill nav for public pages. */
export function PillNav({ items, className }: { items: NavItem[]; className?: string }) {
  const pathname = usePathname();
  return (
    <nav className={cn("nav-glass max-w-full overflow-x-auto scrollbar-none", className)} aria-label="Primary">
      {items.map((it) =>
        it.external ? (
          <a key={it.href} href={it.href} className="nav-item">{it.label}</a>
        ) : (
          <Link key={it.href} href={it.href} className="nav-item" aria-current={isActive(pathname, it) ? "page" : undefined}>{it.label}</Link>
        ),
      )}
    </nav>
  );
}

/** Sidebar nav list for portals. */
export function SidebarNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <div className="flex flex-col gap-1.5">
      {items.map((it) =>
        it.external ? (
          <a key={it.href} href={it.href} className="sidebar-item">{it.icon}{it.label}</a>
        ) : (
          <Link key={it.href} href={it.href} className="sidebar-item" aria-current={isActive(pathname, it) ? "page" : undefined}>{it.icon}{it.label}</Link>
        ),
      )}
    </div>
  );
}

/** Floating pill tab bar for mobile portals. */
export function TabBar({ items, className }: { items: NavItem[]; className?: string }) {
  const pathname = usePathname();
  return (
    <nav className={cn("tabbar", className)} aria-label="Sections">
      {items.map((it) => (
        <Link key={it.href} href={it.href} className="tabbar-item" aria-current={isActive(pathname, it) ? "page" : undefined}>{it.label}</Link>
      ))}
    </nav>
  );
}

/** Phone menu: a button that opens a full-width panel with every link. */
export function MobileMenu({ items, cta }: { items: NavItem[]; cta?: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => { setOpen(false); }, [pathname]);
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);
  return (
    <div className="md:hidden">
      <button type="button" className="btn btn-ghost btn-sm !px-3" aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen((o) => !o)}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
          {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>
      {open && (
        <div id="mobile-menu" className="absolute left-4 right-4 top-[76px] z-50 card p-3 flex flex-col fade-up">
          {items.map((it) => {
            const active = isActive(pathname, it);
            const cls = cn("rounded-[14px] px-4 py-3 font-semibold text-[15px] no-underline", active ? "bg-ice text-royal" : "text-deep hover:bg-row");
            return it.external
              ? <a key={it.href} href={it.href} className={cls}>{it.label} ↗</a>
              : <Link key={it.href} href={it.href} className={cls} aria-current={active ? "page" : undefined}>{it.label}</Link>;
          })}
          {cta && <div className="p-2 pt-3">{cta}</div>}
        </div>
      )}
    </div>
  );
}
