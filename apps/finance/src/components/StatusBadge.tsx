import { Badge, cn } from "@phanet/ui";
import type { Transaction } from "@phanet/supabase/types";
import { statusLabel } from "@/lib/finance";

/** paid/counted/approved → good · pending → warn · rejected → warn + ember · paid expense → mint */
export function StatusBadge({ tx, className }: { tx: Pick<Transaction, "kind" | "status">; className?: string }) {
  if (tx.kind === "expense" && tx.status === "paid") return <Badge tone="mint" className={className}>{statusLabel(tx)}</Badge>;
  if (tx.status === "pending") return <Badge tone="warn" className={className}>{statusLabel(tx)}</Badge>;
  if (tx.status === "rejected") return <Badge tone="warn" className={cn("!text-ember", className)}>{statusLabel(tx)}</Badge>;
  return <Badge tone="good" className={className}>{statusLabel(tx)}</Badge>;
}

export function BudgetStatusBadge({ status }: { status: string }) {
  if (status === "active") return <Badge tone="mint">Active</Badge>;
  if (status === "closed") return <Badge tone="good">Closed</Badge>;
  return <Badge tone="warn">Draft</Badge>;
}
