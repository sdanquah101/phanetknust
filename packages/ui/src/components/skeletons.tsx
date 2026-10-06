import * as React from "react";
import { cn } from "../cn";
import { Logo } from "./primitives";

export function Skeleton({ className, light }: { className?: string; light?: boolean }) {
  return <div className={cn("skeleton", light && "skeleton-light", className)} aria-hidden />;
}

/** Full-page loading state for public (blue) pages. Use as app/loading.tsx. */
export function HeroSkeleton({ brand = "PHANET KNUST" }: { brand?: string }) {
  return (
    <div className="ground-blue min-h-dvh" role="status" aria-label="Loading">
      <div className="container-page pt-6 flex items-center justify-between">
        <Logo text={brand} />
        <Skeleton light className="h-11 w-72 rounded-pill hidden md:block" />
        <Skeleton light className="h-10 w-20 rounded-pill" />
      </div>
      <div className="container-page grid gap-10 lg:grid-cols-2 items-center pt-14">
        <div className="flex flex-col gap-5">
          <Skeleton light className="h-8 w-56 rounded-pill" />
          <Skeleton light className="h-16 w-4/5" />
          <Skeleton light className="h-16 w-3/5" />
          <Skeleton light className="h-5 w-2/3 mt-2" />
          <div className="flex gap-3 mt-4"><Skeleton light className="h-14 w-44 rounded-pill" /><Skeleton light className="h-14 w-44 rounded-pill" /></div>
        </div>
        <Skeleton light className="aspect-square max-w-[420px] w-full rounded-[44px] justify-self-center lg:justify-self-end" />
      </div>
    </div>
  );
}

/** Loading state for content inside a PortalShell. Use as (portal)/loading.tsx. */
export function PortalSkeleton() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-label="Loading">
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-3"><Skeleton className="h-3 w-32" /><Skeleton className="h-10 w-64" /></div>
        <Skeleton className="h-10 w-36 rounded-pill" />
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-card" />)}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Skeleton className="h-80 rounded-card" />
        <div className="flex flex-col gap-6"><Skeleton className="h-36 rounded-card" /><Skeleton className="h-36 rounded-card" /></div>
      </div>
    </div>
  );
}

/** Loading state for the ice-ground content below a hero (shop grids, lists). */
export function GridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Loading">
      {Array.from({ length: count }).map((_, i) => <Skeleton key={i} className="h-64 rounded-card" />)}
    </div>
  );
}
