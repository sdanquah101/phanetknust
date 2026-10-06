import Link from "next/link";
import { Avatar, Badge, Notice, type BadgeTone } from "@phanet/ui";
import type { Followup, Member, TransferRequest } from "@phanet/supabase/types";
import { fmtDate } from "@phanet/supabase/format";
import { KIND_LABELS, NOT_LINKED_MESSAGE, fullName, whatsappLink } from "@/lib/queries";

export function NotLinked() {
  return <Notice tone="peach">{NOT_LINKED_MESSAGE}</Notice>;
}

const KIND_TONE: Record<Followup["kind"], BadgeTone> = { call: "good", visit: "orange", text: "good", prayer: "mint", meeting: "warn", other: "good" };
export function KindBadge({ kind }: { kind: Followup["kind"] }) {
  return <Badge tone={KIND_TONE[kind] ?? "good"}>{KIND_LABELS[kind] ?? kind}</Badge>;
}

const STATUS_TONE: Record<TransferRequest["status"], BadgeTone> = { pending: "warn", approved: "mint", rejected: "orange" };
export function StatusBadge({ status }: { status: TransferRequest["status"] }) {
  return <Badge tone={STATUS_TONE[status] ?? "good"}>{status}</Badge>;
}

/** Small name + code line with avatar, linking to the sheep profile. */
export function SheepChip({ m, size = "md" }: { m: Member; size?: "sm" | "md" }) {
  return (
    <Link href={`/sheep/${m.id}`} className="inline-flex items-center gap-2 no-underline text-deep hover:text-royal">
      <Avatar name={fullName(m)} className={size === "sm" ? "!w-7 !h-7 !text-[10px]" : undefined} />
      <span className="font-semibold text-sm">{fullName(m)}</span>
    </Link>
  );
}

export function ContactLinks({ m }: { m: Member }) {
  const wa = whatsappLink(m);
  return (
    <div className="flex flex-wrap gap-2">
      {m.phone && <a href={`tel:${m.phone}`} className="pill pill-ice !py-1.5 !px-3 text-xs no-underline">Call</a>}
      {wa && <a href={wa} target="_blank" rel="noreferrer" className="pill pill-ice !py-1.5 !px-3 text-xs no-underline">WhatsApp</a>}
    </div>
  );
}

export function DateLine({ d }: { d: string | null | undefined }) {
  return <span className="text-xs text-muted">{fmtDate(d)}</span>;
}
