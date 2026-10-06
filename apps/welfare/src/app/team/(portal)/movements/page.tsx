import Link from "next/link";
import { Badge, Card, EmptyState, PageHeader, Table } from "@phanet/ui";
import { fmtDateTime } from "@phanet/supabase/format";
import { listMovements, profileNames } from "@/lib/queries";

const REASON_LABEL: Record<string, string> = { donation: "Donation", purchase: "Purchase", issued: "Issued", adjustment: "Adjustment", returned: "Returned" };

export default async function MovementsPage() {
  const moves = await listMovements({ limit: 200 });
  const names = await profileNames(moves.map((m) => m.by_user));
  const totalIn = moves.filter((m) => m.delta > 0).reduce((s, m) => s + m.delta, 0);
  const totalOut = moves.filter((m) => m.delta < 0).reduce((s, m) => s + Math.abs(m.delta), 0);

  return (
    <>
      <PageHeader eyebrow="Welfare" title="Stock" script="movements" actions={<Link href="/team/items" className="btn btn-ice btn-sm">Stock →</Link>} />
      <Card className="!p-4 md:!p-6 flex flex-col gap-3">
        <div className="flex flex-wrap gap-4 text-xs text-muted">
          <span>Last {moves.length} movements</span>
          <span className="amt-in text-royal font-bold">+{totalIn} in</span>
          <span className="text-ember font-bold">−{totalOut} out</span>
        </div>
        {moves.length === 0 ? (
          <EmptyState title="No movements yet" body="Every donation, purchase and issued request lands here." />
        ) : (
          <Table>
            <thead><tr><th>When</th><th>Item</th><th>Change</th><th>Reason</th><th>Note</th><th>By</th></tr></thead>
            <tbody>
              {moves.map((m) => (
                <tr key={m.id}>
                  <td className="text-muted whitespace-nowrap">{fmtDateTime(m.created_at)}</td>
                  <td><Link href={`/team/items/${m.item_id}`} className="font-bold text-deep no-underline">{m.welfare_items?.name ?? "Item"}</Link></td>
                  <td className={m.delta >= 0 ? "amt-in" : "amt-out"}>{m.delta > 0 ? `+${m.delta}` : m.delta} <span className="text-muted font-normal">{m.welfare_items?.unit ?? ""}</span></td>
                  <td><Badge tone={m.delta >= 0 ? "good" : "warn"}>{REASON_LABEL[m.reason] ?? m.reason}</Badge></td>
                  <td className="text-muted max-w-[260px] truncate">{m.note ?? "—"}</td>
                  <td className="text-muted">{m.by_user ? names[m.by_user] ?? "Team" : "Shop"}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
