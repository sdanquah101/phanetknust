import Link from "next/link";
import { Badge, Card, Disclosure, EmptyState, PageHeader, SubmitButton, Table } from "@phanet/ui";
import { createClient } from "@phanet/supabase/server";
import { money } from "@phanet/supabase/format";
import type { GivingFund } from "@phanet/supabase/types";
import { Flash, type FlashParams } from "@/components/Flash";
import { FundForm } from "./FundForm";
import { toggleFund } from "./actions";

export default async function FundsPage({ searchParams }: { searchParams: Promise<FlashParams> }) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.from("giving_funds").select("*").order("sort_order").order("name");
  const funds = (data ?? []) as GivingFund[];

  return (
    <>
      <PageHeader eyebrow="Giving" title="Funds people" script="sow into" />
      <Flash ok={sp.ok} error={sp.error} />
      <Disclosure label="New fund" title="Add a giving option" description="Funds are the choices on the Give page, like tithe, offering or building." defaultOpen={funds.length === 0}>
        <FundForm />
      </Disclosure>
      {funds.length === 0 ? (
          <EmptyState title="No funds yet." body="Funds are the options on the Give page: tithe, offering, building, missions…" />
        ) : (
          <Card>
            <Table>
              <thead>
                <tr><th>Fund</th><th>Target</th><th className="hidden xl:table-cell">Order</th><th>Status</th><th /></tr>
              </thead>
              <tbody>
                {funds.map((f) => (
                  <tr key={f.id}>
                    <td className="min-w-[16rem]">
                      <div className="font-bold">{f.name}</div>
                      <div className="text-xs text-muted truncate">{f.slug}{f.description ? ` · ${f.description}` : ""}</div>
                    </td>
                    <td className="whitespace-nowrap">{f.target_amount ? money(f.target_amount) : "—"}</td>
                    <td className="hidden xl:table-cell">{f.sort_order}</td>
                    <td>{f.is_active ? <Badge tone="mint">Open</Badge> : <Badge tone="warn">Closed</Badge>}</td>
                    <td className="text-right whitespace-nowrap">
                      <div className="inline-flex gap-2">
                        <form action={toggleFund}>
                          <input type="hidden" name="id" value={f.id} />
                          <input type="hidden" name="is_active" value={f.is_active ? "false" : "true"} />
                          <SubmitButton variant="ice" size="sm">{f.is_active ? "Close" : "Open"}</SubmitButton>
                        </form>
                        <Link href={`/funds/${f.id}`} className="btn btn-blue btn-sm">Edit</Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>
        )}
    </>
  );
}
