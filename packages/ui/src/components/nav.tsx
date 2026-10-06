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
