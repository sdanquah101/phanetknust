import Link from "next/link";
import { EmptyState, PageHeader, Toast } from "@phanet/ui";
import { RequestCard } from "@/components/request-card";
import { getRequestItems, listRequests } from "@/lib/queries";
import { STATUS_LABEL, isStatus, type RequestStatus } from "@/lib/status";

const TABS: (RequestStatus | "all")[] = ["pending", "approved", "ready", "collected", "declined", "all"];

export default async function RequestsPage({ searchParams }: { searchParams: Promise<{ status?: string; ok?: string; error?: string }> }) {
  const sp = await searchParams;
  const status: RequestStatus | "all" = sp.status === "all" ? "all" : isStatus(sp.status) ? sp.status : "pending";
  const requests = await listRequests(status);
  const itemsByRequest = await getRequestItems(requests.map((r) => r.id));
  const back = `/team/requests?status=${status}`;

  return (
    <>
      <PageHeader eyebrow="Welfare" title="Requests" script={status === "all" ? "all" : STATUS_LABEL[status].split(" ")[0].toLowerCase()} />
      <Toast message={sp.ok} tone="mint" />
      <Toast message={sp.error} tone="peach" />

      <div className="flex gap-2 flex-wrap">
        {TABS.map((t) => (
          <Link key={t} href={`/team/requests?status=${t}`} className="chip !py-2.5 !px-4 text-[13px]" data-selected={t === status}>
            {t === "all" ? "All" : STATUS_LABEL[t]}
          </Link>
        ))}
      </div>

      {requests.length === 0 ? (
        <EmptyState title={status === "pending" ? "Nothing waiting" : "No requests here"} body={status === "pending" ? "New requests from the shop will show up here." : "Try another tab."} />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {requests.map((r) => <RequestCard key={r.id} request={r} items={itemsByRequest[r.id] ?? []} back={back} />)}
        </div>
      )}
    </>
  );
}
