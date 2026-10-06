import Link from "next/link";
import { Avatar, Badge, Button, Card, EmptyState, Input, PageHeader, Toast } from "@phanet/ui";
import { fmtDate } from "@phanet/supabase/format";
import type { Followup } from "@phanet/supabase/types";
import { fullName, getLeaderContext, listMyFollowups, listMySheep, listReportsForWeek, weekStartIso, whatsappLink } from "@/lib/queries";
import { NotLinked } from "@/components/bits";

export default async function SheepPage({ searchParams }: { searchParams: Promise<{ q?: string; ok?: string; error?: string }> }) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const { leaderMemberId, supabase } = await getLeaderContext();
  if (!leaderMemberId) {
    return (
      <>
        <PageHeader eyebrow="Shepherding" title="My" script="sheep" />
        <NotLinked />
      </>
    );
  }

  const [sheep, followups, reports] = await Promise.all([
    listMySheep(supabase, leaderMemberId, q),
    listMyFollowups(supabase, leaderMemberId),
    listReportsForWeek(supabase, leaderMemberId, weekStartIso()),
  ]);
  const last = new Map<string, Followup>();
  for (const f of followups) if (!last.has(f.sheep_id)) last.set(f.sheep_id, f);
  const reported = new Set(reports.map((r) => r.sheep_id));

  return (
    <>
      <PageHeader eyebrow="Shepherding" title="My" script="sheep" actions={<span className="pill pill-ice">{sheep.length} {sheep.length === 1 ? "member" : "members"}</span>} />
      <Toast message={sp.ok} tone="mint" />
      <Toast message={sp.error} tone="peach" />

      <form method="get" className="flex flex-col sm:flex-row gap-2">
        <Input name="q" defaultValue={q} placeholder="Search by name, code or phone" aria-label="Search my sheep" />
        <div className="flex gap-2">
          <Button type="submit" variant="blue">Search</Button>
          {q && <Link href="/sheep" className="btn btn-ice">Clear</Link>}
        </div>
      </form>

      {sheep.length === 0 ? (
        <EmptyState title={q ? "No one matches" : "No sheep assigned yet"} body={q ? "Try a shorter search." : "Ask the admin to assign members to you from the Database portal."} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sheep.map((m) => {
            const name = fullName(m);
            const lf = last.get(m.id);
            const wa = whatsappLink(m);
            return (
              <Card key={m.id} className="flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <Avatar name={name} className="!w-12 !h-12 !text-sm" />
                  <div className="min-w-0 flex-1">
                    <Link href={`/sheep/${m.id}`} className="font-bold text-deep no-underline hover:text-royal block truncate">{name}</Link>
                    <div className="text-xs text-muted">{m.member_code}</div>
                  </div>
                  {reported.has(m.id) ? <Badge tone="mint">Reported</Badge> : <Badge tone="warn">No report</Badge>}
                </div>
                <dl className="text-sm text-muted grid gap-1">
                  <div>{[m.programme, m.year_of_study ? `Year ${m.year_of_study}` : null].filter(Boolean).join(" · ") || "Programme not set"}</div>
                  <div>{[m.hall, m.room ? `Room ${m.room}` : null].filter(Boolean).join(" · ") || "Hall not set"}</div>
                  <div className="text-xs">Last follow-up: <span className="font-semibold text-deep">{lf ? fmtDate(lf.occurred_at) : "none yet"}</span></div>
                </dl>
                <div className="flex flex-wrap gap-2 mt-auto">
                  {m.phone && <a href={`tel:${m.phone}`} className="pill pill-ice !py-1.5 !px-3 text-xs no-underline">{m.phone}</a>}
                  {wa && <a href={wa} target="_blank" rel="noreferrer" className="pill pill-ice !py-1.5 !px-3 text-xs no-underline">WhatsApp</a>}
                  <Link href={`/followups/new?sheep=${m.id}`} className="pill pill-orange !py-1.5 !px-3 text-xs no-underline ml-auto">Log follow-up</Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
