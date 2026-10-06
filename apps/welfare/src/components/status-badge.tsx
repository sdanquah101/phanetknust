import { Badge, type BadgeTone, cn } from "@phanet/ui";
import { STATUS_LABEL, type RequestStatus } from "@/lib/status";

const TONE: Record<RequestStatus, BadgeTone> = { pending: "warn", approved: "good", ready: "orange", collected: "mint", declined: "white" };

export function StatusBadge({ status, className }: { status: RequestStatus; className?: string }) {
  return (
    <Badge tone={TONE[status]} className={cn(status === "declined" && "!bg-ice !text-muted", className)}>
      {STATUS_LABEL[status]}
    </Badge>
  );
}
