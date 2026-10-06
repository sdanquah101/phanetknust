import Link from "next/link";
import { PAGE_SIZE } from "@/lib/queries";

export function Pager({ page, total, href }: { page: number; total: number; href: (page: number) => string }) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (pages <= 1) return null;
  return (
    <nav className="flex items-center justify-center gap-3 text-sm" aria-label="Pages">
      {page > 1 ? (
        <Link href={href(page - 1)} className="btn btn-ghost btn-sm">
          ← Newer
        </Link>
      ) : (
        <span className="btn btn-ghost btn-sm opacity-50" aria-disabled>← Newer</span>
      )}
      <span className="pill pill-glass">
        Page {page} of {pages}
      </span>
      {page < pages ? (
        <Link href={href(page + 1)} className="btn btn-ghost btn-sm">
          Older →
        </Link>
      ) : (
        <span className="btn btn-ghost btn-sm opacity-50" aria-disabled>Older →</span>
      )}
    </nav>
  );
}
