import Link from "next/link";
import { Badge, Card, EmptyState, PageHeader, StatCard, Toast } from "@phanet/ui";
import { greeting } from "@phanet/supabase/format";
import { getSession } from "@phanet/supabase/server";
import { RequestCard } from "@/components/request-card";
import { countRequests, getRequestItems, listAllItems, listMovements, listRequests } from "@/lib/queries";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const sp = await searchParams;
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [session, pending, readyCount, items, issued] = await Promise.all([
    getSession(),
    listRequests("pending", 8),
    countRequests("ready"),
    listAllItems(),
    listMovements({ since: monthStart, limit: 1000 }),
  ]);
  const itemsByRequest = await getRequestItems(pending.map((r) => r.id));
  const low = items.filter((i) => i.is_active && i.qty_available <= 3);
  const issuedThisMonth = issued.filter((m) => m.reason === "issued" && m.delta < 0).reduce((s, m) => s + Math.abs(m.delta), 0);
  const pendingCount = pending.length >= 8 ? await countRequests("pending") : pending.length;

  return (
    <>
      <PageHeader eyebrow={greeting(session?.profile?.full_name)} title="Welfare" script="desk" actions={<Link href="/team/items" className="btn btn-orange btn-sm">Add stock</Link>} />
      <Toast message={sp.ok} tone="mint" />
      <Toast message={sp.error} tone="peach" />

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <StatCard label="Pending requests" value={pendingCount} tone="orange" sub="waiting on you" />
        <StatCard label="Ready for pickup" value={readyCount} tone="blue" sub="after Saturday’s gathering" />
        <StatCard label="Items low" value={low.length} sub="3 or fewer left" />
        <StatCard label="Issued this month" value={issuedThisMonth} sub="units given out" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] items-start">
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl">Pending requests</h2>
            <Link href="/team/requests?status=pending" className="text-sm font-bold text-royal">See all →</Link>
          </div>
          {pending.length === 0 ? (
            <EmptyState title="All caught up" body="No one is waiting right now." />
          ) : (
            pending.map((r) => <RequestCard key={r.id} request={r} items={itemsByRequest[r.id] ?? []} back="/team" compact />)
          )}
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl">Running low</h2>
            <Link href="/team/items" className="text-sm font-bold text-royal">Stock →</Link>
          </div>
          {low.length === 0 ? (
            <EmptyState title="Shelves look good" body="Nothing is running low." />
          ) : (
            <Card className="flex flex-col divide-y divide-ice !p-2">
              {low.map((i) => (
                <Link key={i.id} href={`/team/items/${i.id}`} className="flex items-center justify-between gap-3 px-4 py-3 no-underline text-deep hover:bg-row rounded-[16px]">
                  <div className="min-w-0">
                    <div className="font-bold truncate">{i.name}</div>
                    <div className="text-xs text-muted">{i.category}</div>
                  </div>
                  <Badge tone={i.qty_available === 0 ? "warn" : "good"}>{i.qty_available} {i.unit} left</Badge>
                </Link>
              ))}
            </Card>
          )}
        </section>
      </div>
    </>
  );
}
