import Link from "next/link";
import { Avatar, Badge, cn } from "@phanet/ui";
import { STATUS_TONE } from "@/lib/constants";

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={STATUS_TONE[status] ?? "good"}>{status}</Badge>;
}

/** Photo (signed URL) or initials. */
export function MemberAvatar({ name, src, className }: { name: string; src?: string | null; className?: string }) {
  return <Avatar name={name} src={src ?? undefined} className={className} />;
}
export function MemberAvatarLarge({ name, src }: { name: string; src?: string | null }) {
  return (
    <span className="avatar !w-28 !h-28 md:!w-36 md:!h-36 !text-3xl shadow-card" title={name}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} />
      ) : (
        name.trim().split(/\s+/).slice(0, 2).map((s) => s[0]?.toUpperCase() ?? "").join("")
      )}
    </span>
  );
}

/** Simple ?page= pagination. `make(page)` builds the href. */
export function Pagination({ page, pages, total, make }: { page: number; pages: number; total: number; make: (p: number) => string }) {
  if (pages <= 1) return <div className="text-xs text-muted">{total} member{total === 1 ? "" : "s"}</div>;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
      <span>Page {page} of {pages} · {total} members</span>
      <div className="flex gap-2">
        {page > 1 ? <Link href={make(page - 1)} className="btn btn-ice btn-sm">← Previous</Link> : <span className="btn btn-ice btn-sm opacity-50">← Previous</span>}
        {page < pages ? <Link href={make(page + 1)} className="btn btn-blue btn-sm">Next →</Link> : <span className="btn btn-ice btn-sm opacity-50">Next →</span>}
      </div>
    </div>
  );
}

/** Horizontal CSS bar list for breakdowns. */
export function Bars({ rows, total, orange }: { rows: { key: string; count: number }[]; total: number; orange?: boolean }) {
  if (!rows.length) return <p className="text-sm text-muted">Nothing to show yet.</p>;
  const max = Math.max(...rows.map((r) => r.count), 1);
  return (
    <ul className="flex flex-col gap-2.5">
      {rows.map((r) => (
        <li key={r.key} className="text-sm">
          <div className="flex justify-between gap-3 mb-1">
            <span className="font-semibold truncate">{r.key}</span>
            <span className="text-muted">{r.count}{total ? ` · ${Math.round((r.count / total) * 100)}%` : ""}</span>
          </div>
          <div className="h-2 rounded-pill bg-ice overflow-hidden">
            <div className={cn("h-full rounded-pill", orange ? "bg-tangerine" : "bg-royal")} style={{ width: `${Math.max(3, (r.count / max) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-6">
      <div className="label-caps-orange mb-4">{title}</div>
      <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">{children}</dl>
    </div>
  );
}
export function Item({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] font-bold tracking-[.14em] uppercase text-muted">{label}</dt>
      <dd className="text-sm font-medium mt-0.5 break-words">{value || <span className="text-muted">—</span>}</dd>
    </div>
  );
}
