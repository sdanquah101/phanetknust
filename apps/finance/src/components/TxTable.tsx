import Link from "next/link";
import { EmptyState, Table } from "@phanet/ui";
import { fmtDate, money } from "@phanet/supabase/format";
import { CHANNEL_LABELS } from "@phanet/supabase/types";
import type { TxRow, TxTotals } from "@/lib/queries";
import { counterparty } from "@/lib/finance";
import { StatusBadge } from "./StatusBadge";

export function Amount({ tx }: { tx: Pick<TxRow, "kind" | "amount"> }) {
  return <span className={tx.kind === "income" ? "amt-in" : "amt-out"}>{tx.kind === "income" ? "+" : "−"}{money(tx.amount)}</span>;
}

/** Ledger table. Rows link to the transaction detail. */
export function TxTable({ rows, totals, compact = false, emptyTitle = "Nothing here yet", emptyBody }: { rows: TxRow[]; totals?: TxTotals; compact?: boolean; emptyTitle?: string; emptyBody?: string }) {
  if (!rows.length) return <EmptyState title={emptyTitle} body={emptyBody ?? "Record income or an expense and it will show up here."} />;
  return (
    <Table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Member / note</th>
          {!compact && <th>Category</th>}
          <th>Type</th>
          <th className="hidden md:table-cell">Channel</th>
          {!compact && <th className="hidden md:table-cell">Program</th>}
          <th className="text-right">Amount</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((t) => (
          <tr key={t.id}>
            <td className="whitespace-nowrap text-muted">{fmtDate(t.occurred_at)}</td>
            <td>
              <Link href={`/transactions/${t.id}`} className="font-semibold hover:underline">{counterparty(t)}</Link>
              {t.description && counterparty(t) !== t.description && <div className="text-xs text-muted line-clamp-1">{t.description}</div>}
            </td>
            {!compact && <td className="text-muted">{t.category}</td>}
            <td className="capitalize">{t.kind}</td>
            <td className="hidden md:table-cell text-muted">{CHANNEL_LABELS[t.channel]}</td>
            {!compact && <td className="hidden md:table-cell text-muted">{t.programs?.name ?? "—"}</td>}
            <td className="text-right whitespace-nowrap"><Amount tx={t} /></td>
            <td><StatusBadge tx={t} /></td>
          </tr>
        ))}
      </tbody>
      {totals && (
        <tfoot>
          <tr>
            <td colSpan={compact ? 4 : 6} className="text-xs text-muted">
              {totals.count} {totals.count === 1 ? "entry" : "entries"} · In <span className="amt-in">{money(totals.income)}</span> · Out <span className="amt-out">{money(totals.expense)}</span>
              {totals.pending > 0 && <> · Pending {money(totals.pending)}</>}
            </td>
            <td className="text-right font-bold whitespace-nowrap">{money(totals.income - totals.expense)}</td>
            <td className="text-xs text-muted">net</td>
          </tr>
        </tfoot>
      )}
    </Table>
  );
}
