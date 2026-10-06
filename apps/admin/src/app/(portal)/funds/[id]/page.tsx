import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, ConfirmSubmit, Label, PageHeader } from "@phanet/ui";
import { createClient } from "@phanet/supabase/server";
import type { GivingFund } from "@phanet/supabase/types";
import { Flash, type FlashParams } from "@/components/Flash";
import { isUuid } from "@/lib/form";
import { FundForm } from "../FundForm";
import { deleteFund } from "../actions";

export default async function FundEditPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<FlashParams> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  if (!isUuid(id)) notFound();
  const supabase = await createClient();
  const { data } = await supabase.from("giving_funds").select("*").eq("id", id).maybeSingle();
  const fund = data as GivingFund | null;
  if (!fund) notFound();
  return (
    <>
      <PageHeader eyebrow="Giving funds" title={fund.name} actions={<Link href="/funds" className="btn btn-ice btn-sm">← All funds</Link>} />
      <Flash ok={sp.ok} error={sp.error} />
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] items-start">
        <Card><FundForm fund={fund} /></Card>
        <Card className="flex flex-col gap-3">
          <Label tone="orange">Danger zone</Label>
          <p className="text-sm text-muted">Past giving keeps its category; only the option disappears from the Give page. Prefer closing the fund.</p>
          <form action={deleteFund}>
            <input type="hidden" name="id" value={fund.id} />
            <ConfirmSubmit variant="danger" size="sm" message={`Delete "${fund.name}"?`}>Delete fund</ConfirmSubmit>
          </form>
        </Card>
      </div>
    </>
  );
}
