import type { Leader } from "@/content/leaders";

/** Collapsible leadership gallery. Native <details>, so it works without JavaScript; closed photos aren't downloaded. */
export function Leadership({ leaders }: { leaders: Leader[] }) {
  if (leaders.length === 0) return null;
  return (
    <details className="group card overflow-hidden">
      <summary className="flex items-center justify-between gap-4 p-6 md:p-8 cursor-pointer list-none [&::-webkit-details-marker]:hidden select-none">
        <div>
          <div className="label-caps-orange mb-1">The people who serve</div>
          <h2 className="t-h2 text-deep">Leadership</h2>
        </div>
        <span className="flex items-center gap-3">
          <span className="hidden sm:inline t-small text-muted">{leaders.length} leaders</span>
          <span className="w-12 h-12 rounded-full bg-ice text-royal grid place-items-center transition-transform duration-300 group-open:rotate-180" aria-hidden>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
          </span>
        </span>
      </summary>
      <div className="px-6 pb-8 md:px-8 md:pb-10">
        <ul className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          {leaders.map((l, i) => (
            <li key={l.photo} className="flex flex-col gap-3">
              <div className="aspect-[3/4] rounded-[20px] overflow-hidden bg-[linear-gradient(180deg,#1c6cf2,#0a46e8)] shadow-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={l.photo}
                  alt={l.name ? `${l.name}${l.role ? `, ${l.role}` : ""}` : `PHANET KNUST leader ${i + 1}`}
                  width={720}
                  height={960}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
              </div>
              {(l.name || l.role) && (
                <div className="px-1">
                  {l.name && <div className="font-bold text-deep leading-tight">{l.name}</div>}
                  {l.role && <div className="t-small text-muted leading-snug mt-0.5">{l.role}</div>}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}
