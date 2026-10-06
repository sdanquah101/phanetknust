import { Badge, Card, ConfirmSubmit, SubmitButton, Textarea } from "@phanet/ui";
import { fmtDateTime } from "@phanet/supabase/format";
import type { WelfareRequest } from "@phanet/supabase/types";
import { decideRequestAction } from "@/app/team/(portal)/requests/actions";
import type { RequestItemRow } from "@/lib/queries";
import { whatsappLink } from "@/lib/status";
import { StatusBadge } from "./status-badge";

export function RequestCard({ request, items, back, compact = false }: { request: WelfareRequest; items: RequestItemRow[]; back: string; compact?: boolean }) {
  const r = request;
  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono font-bold text-royal">{r.code}</span>
            <StatusBadge status={r.status} />
          </div>
          <div className="text-lg font-bold mt-1">{r.requester_name}</div>
          <div className="text-xs text-muted">{fmtDateTime(r.created_at)}{r.hall_room ? ` · ${r.hall_room}` : ""}</div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <a href={`tel:${r.phone.replace(/\s+/g, "")}`} className="btn btn-ice btn-sm">Call {r.phone}</a>
          <a href={whatsappLink(r.phone)} target="_blank" rel="noreferrer" className="btn btn-outline-blue btn-sm">WhatsApp</a>
        </div>
      </div>

      <ul className="flex flex-wrap gap-2">
        {items.length === 0 && <li className="text-sm text-muted">No items recorded.</li>}
        {items.map((it) => (
          <li key={it.item_id} className="pill pill-ice">
            <span className="font-bold">{it.qty}×</span> {it.welfare_items?.name ?? "Item"} <span className="text-muted">({it.welfare_items?.unit ?? "pc"})</span>
          </li>
        ))}
      </ul>

      {r.note && <p className="text-sm text-muted"><span className="font-bold text-deep">Note:</span> {r.note}</p>}
      {r.decision_note && <p className="text-sm text-muted"><span className="font-bold text-deep">Team note:</span> {r.decision_note}</p>}

      <Actions request={r} back={back} compact={compact} />
    </Card>
  );
}

function Actions({ request: r, back, compact }: { request: WelfareRequest; back: string; compact: boolean }) {
  if (r.status === "collected") return <Badge tone="mint" className="self-start">Done</Badge>;
  if (r.status === "declined") return null;
  return (
    <div className="flex flex-wrap gap-2 items-start pt-2 border-t border-ice">
      {r.status === "pending" && (
        <>
          <form action={decideRequestAction}>
            <input type="hidden" name="id" value={r.id} />
            <input type="hidden" name="status" value="approved" />
            <input type="hidden" name="back" value={back} />
            <SubmitButton size="sm" pendingText="Approving…">Approve</SubmitButton>
          </form>
          <details className="group">
            <summary className="btn btn-ice btn-sm list-none cursor-pointer">Decline…</summary>
            <form action={decideRequestAction} className="mt-3 flex flex-col gap-2 max-w-sm">
              <input type="hidden" name="id" value={r.id} />
              <input type="hidden" name="status" value="declined" />
              <input type="hidden" name="back" value={back} />
              <Textarea name="note" placeholder={compact ? "Reason (shown to the member)" : "Why are we declining? This is shown to the member."} className="min-h-[70px]" />
              <ConfirmSubmit variant="danger" size="sm" message={`Decline ${r.code}? Stock goes back on the shelf.`}>Decline and return stock</ConfirmSubmit>
            </form>
          </details>
        </>
      )}
      {r.status === "approved" && (
        <form action={decideRequestAction}>
          <input type="hidden" name="id" value={r.id} />
          <input type="hidden" name="status" value="ready" />
          <input type="hidden" name="back" value={back} />
          <SubmitButton size="sm" pendingText="Saving…">Mark ready for pickup</SubmitButton>
        </form>
      )}
      {r.status === "ready" && (
        <form action={decideRequestAction}>
          <input type="hidden" name="id" value={r.id} />
          <input type="hidden" name="status" value="collected" />
          <input type="hidden" name="back" value={back} />
          <SubmitButton variant="blue" size="sm" pendingText="Saving…">Mark collected</SubmitButton>
        </form>
      )}
    </div>
  );
}
