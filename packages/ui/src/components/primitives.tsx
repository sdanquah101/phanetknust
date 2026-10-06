import * as React from "react";
import Link from "next/link";
import { cn } from "../cn";
import { Fluid } from "./atmosphere";
import { Crest } from "./crest";

/* ---------- Logo / wordmark ---------- */
export function Logo({ text = "PHANET KNUST", className, href, light = true }: { text?: string; className?: string; href?: string; light?: boolean }) {
  const inner = (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <Crest size={34} />
      <span className={cn("wordmark", light ? "text-white" : "text-deep")}>{text}</span>
    </span>
  );
  return href ? <Link href={href} className="no-underline">{inner}</Link> : inner;
}

/* ---------- Script accent ---------- */
export function Script({ children, peach = false, className }: { children: React.ReactNode; peach?: boolean; className?: string }) {
  return <span className={cn("script", peach ? "text-peach" : "text-white", className)}>{children}</span>;
}

/* ---------- Buttons ---------- */
type Variant = "orange" | "white" | "blue" | "ice" | "ghost" | "outline-blue" | "danger";
type Size = "sm" | "md" | "lg";
const variantClass: Record<Variant, string> = {
  orange: "btn-orange", white: "btn-white", blue: "btn-blue", ice: "btn-ice", ghost: "btn-ghost", "outline-blue": "btn-outline-blue", danger: "btn-danger",
};
const sizeClass: Record<Size, string> = { sm: "btn-sm", md: "", lg: "btn-lg" };

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size };
export function Button({ variant = "orange", size = "md", className, type = "button", ...rest }: ButtonProps) {
  return <button type={type} className={cn("btn", variantClass[variant], sizeClass[size], className)} {...rest} />;
}
export function ButtonLink({ variant = "orange", size = "md", className, href, ...rest }: React.ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link href={href} className={cn("btn", variantClass[variant], sizeClass[size], className)} {...rest} />;
}

/* ---------- Badges & labels ---------- */
export type BadgeTone = "good" | "warn" | "mint" | "orange" | "white" | "glass";
export function Badge({ tone = "good", className, children }: { tone?: BadgeTone; className?: string; children: React.ReactNode }) {
  return <span className={cn("badge", `badge-${tone}`, className)}>{children}</span>;
}
export function Label({ children, tone = "muted", className }: { children: React.ReactNode; tone?: "muted" | "orange" | "peach" | "white"; className?: string }) {
  const t = tone === "orange" ? "label-caps-orange" : tone === "peach" ? "label-caps-peach" : tone === "white" ? "label-caps text-white" : "label-caps text-muted";
  return <div className={cn(t, className)}>{children}</div>;
}
export function VerseBadge({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("verse-badge", className)}>{children}</span>;
}

/* ---------- Cards ---------- */
export function Card({ className, children, tone = "white", ...rest }: React.HTMLAttributes<HTMLDivElement> & { tone?: "white" | "blue" | "orange" | "ice" | "glass" }) {
  const t = tone === "white" ? "card" : tone === "blue" ? "card-blue" : tone === "orange" ? "card-orange" : tone === "ice" ? "card-ice" : "glass";
  return <div className={cn(t, "p-6", className)} {...rest}>{children}</div>;
}

export function StatCard({ label, value, sub, tone = "white", className }: { label: string; value: React.ReactNode; sub?: React.ReactNode; tone?: "white" | "blue" | "orange"; className?: string }) {
  return (
    <Card tone={tone} className={cn("flex flex-col gap-3", className)}>
      <Label tone={tone === "white" ? "orange" : "peach"}>{label}</Label>
      <div className="num-lg md:text-[34px]">{value}</div>
      {sub && <div className={cn("text-xs font-medium", tone === "white" ? "text-muted" : "text-white")}>{sub}</div>}
    </Card>
  );
}

/* ---------- Progress ring ---------- */
export function ProgressRing({ pct, size = 84, ice = false, className, children }: { pct: number; size?: number; ice?: boolean; className?: string; children?: React.ReactNode }) {
  const p = Math.max(0, Math.min(100, Math.round(pct)));
  return (
    <div className={cn("ring", ice && "ring-ice", className)} style={{ width: size, height: size, ["--pct" as string]: p }} role="img" aria-label={`${p}%`}>
      <span>{children ?? `${p}%`}</span>
    </div>
  );
}

/* ---------- Atmosphere ---------- */
export function Blobs({ variant = "blue" }: { variant?: "blue" | "ice" }) {
  if (variant === "ice") {
    return (
      <>
        <div className="blob blob-sky blob-drift" style={{ width: 520, height: 520, top: -200, right: -160, opacity: 0.45 }} />
        <div className="blob blob-orange" style={{ width: 360, height: 360, bottom: -180, left: -120, opacity: 0.25 }} />
      </>
    );
  }
  return <Fluid />;
}

export function Ticker({ items, className }: { items: string[]; className?: string }) {
  const row = [...items, ...items];
  return (
    <div className={cn("ticker py-4", className)} aria-hidden>
      <div className="ticker-track">
        {row.map((t, i) => (
          <span key={i} className="inline-flex items-center gap-10">{t} <span>✦</span></span>
        ))}
      </div>
    </div>
  );
}

/* ---------- Avatars ---------- */
export function initials(name?: string | null) {
  if (!name) return "?";
  return name.trim().split(/\s+/).slice(0, 2).map((s) => s[0]?.toUpperCase() ?? "").join("");
}
export function Avatar({ name, src, className, peach }: { name?: string | null; src?: string | null; className?: string; peach?: boolean }) {
  return (
    <span className={cn("avatar", peach && "avatar-peach", className)} title={name ?? undefined}>
      {src ? <img src={src} alt={name ?? ""} /> : initials(name)}
    </span>
  );
}

/* ---------- Forms ---------- */
export function Field({ label, hint, children, className }: { label: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("field", className)}>
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </label>
  );
}
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { glass?: boolean }>(function Input({ className, glass, ...rest }, ref) {
  return <input ref={ref} className={cn("input", glass && "input-glass", className)} {...rest} />;
});
export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className, ...rest }, ref) {
  return <select ref={ref} className={cn("select", className)} {...rest} />;
});
export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement> & { glass?: boolean }>(function Textarea({ className, glass, ...rest }, ref) {
  return <textarea ref={ref} className={cn("textarea", glass && "input-glass", className)} {...rest} />;
});

/* ---------- Empty state / notice ---------- */
export function EmptyState({ title, body, action, className }: { title: string; body?: string; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("card-ice p-10 text-center flex flex-col items-center gap-3", className)}>
      <div className="font-bold text-lg">{title}</div>
      {body && <p className="text-sm text-muted max-w-sm">{body}</p>}
      {action}
    </div>
  );
}
export function Notice({ tone = "ice", children, className }: { tone?: "ice" | "peach" | "orange" | "mint"; children: React.ReactNode; className?: string }) {
  return <div className={cn("notice", `notice-${tone}`, className)}>{children}</div>;
}

/* ---------- Page header for portals ---------- */
export function PageHeader({ eyebrow, title, script, actions, className }: { eyebrow?: string; title: React.ReactNode; script?: string; actions?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-4", className)}>
      <div>
        {eyebrow && <Label tone="orange" className="mb-2">{eyebrow}</Label>}
        <h1 className="text-[32px] md:text-[40px] text-deep">
          {title} {script && <span className="script text-royal text-[1.15em]">{script}</span>}
        </h1>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

/* ---------- Table helpers ---------- */
export function Table({ className, ...rest }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto scrollbar-none -mx-2 px-2">
      <table className={cn("table", className)} {...rest} />
    </div>
  );
}
