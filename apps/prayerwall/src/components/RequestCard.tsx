import { Badge } from "@phanet/ui";
import type { PrayerPublic } from "@phanet/supabase/types";
import { relativeTime } from "@/lib/time";
import { PrayButton } from "./PrayButton";

export function RequestCard({ request }: { request: PrayerPublic }) {
  return (
    <article className="card p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <Badge tone="good">{request.category}</Badge>
      </div>
      <h3 className="font-bold text-[17px] leading-snug text-deep">{request.topic}</h3>
      {request.body && <p className="text-sm text-muted line-clamp-4 whitespace-pre-line">{request.body}</p>}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-ice">
        <div className="flex items-center gap-2 text-xs text-muted">
          <span>Added {relativeTime(request.created_at)}</span>
          {request.status === "answered" && <Badge tone="mint">Answered</Badge>}
        </div>
        <PrayButton id={request.id} count={request.pray_count} />
      </div>
    </article>
  );
}
