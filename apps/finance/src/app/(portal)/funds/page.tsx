import Link from "next/link";
import { Badge, Card, EmptyState, Field, Input, Label, Notice, PageHeader, SubmitButton, Table, Textarea, Toast } from "@phanet/ui";
import { createClient, getSession } from "@phanet/supabase/server";
import { money, pct } from "@phanet/supabase/format";
import { getPeriod, listFunds, listTxForYear } from "@/lib/queries";
import { canManageFunds } from "@/lib/finance";
import { createFundAction, toggleFundAction, updateFundAction } from "./actions";

export default async function FundsPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string; edit?: string }> }) {
  const sp = await searchParams;
  const [session, supabase] = await Promise.all([getSession(), createClient()]);
  const roles = session?.roles ?? [];
  const manage = canManageFunds(roles);
  const period = await getPeriod(supabase);
  const [funds, txs] = await Promise.all([listFunds(supabase), listTxForYear(supabase, period.year, { kind: "income" })]);
  const collected = new Map<string, number>();
  for (const t of txs) collected.set(t.category, (collected.get(t.category) ?? 0) + Number(t.amount));
  const editing = sp.edit ? funds.find((f) => f.id === sp.edit) : undefined;
  const total = funds.reduce((s, f) => s + (collected.get(f.slug) ?? 0), 0);

  return (
    <>
      <PageHeader eyebrow={`Finance · ${period.year}`} title="Giving" script="funds" />
      <Toast message={sp.ok} tone="mint" />
      <Toast message={sp.error} tone="peach" />
      {!manage && <Notice tone="ice">Funds are edited by the finance head or an admin. You can see them here and record income against them.</Notice>}

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card className="min-w-0">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div><Label tone="orange">Funds</Label><h2 className="text-xl">{money(total)} <span className="text-sm text-muted font-medium">collected this year</span></h2></div>
          </div>
          {funds.length ? (
            <Table>
              <thead><tr><th>Fund</th><th className="hidden md:table-cell">Slug</th><th className="text-right">Target</th><th className="text-right">Collected</th><th>Active</th>{manage && <th />}</tr></thead>
              <tbody>
                {funds.map((f) => {
                  const got = collected.get(f.slug) ?? 0;
                  const p = f.target_amount ? pct(got, Number(f.target_amount)) : null;
                  return (
                    <tr key={f.id}>
                      <td>
                        <div className="font-semibold">{f.name}</div>
                        {f.description && <div className="text-xs text-muted line-clamp-1">{f.description}</div>}
                        {p !== null && <div className="h-1.5 rounded-pill bg-ice overflow-hidden mt-2 max-w-[160px]"><div className="h-full rounded-pill bg-tangerine" style={{ width: `${Math.min(100, p)}%` }} /></div>}
                      </td>
                      <td className="hidden md:table-cell text-muted font-mono text-xs">{f.slug}</td>
                      <td className="text-right text-muted">{f.target_amount ? `${money(f.target_amount, { compact: true })}${p !== null ? ` · ${p}%` : ""}` : "—"}</td>
                      <td className="text-right amt-in"><Link href={`/transactions?kind=income&category=${f.slug}`} className="hover:underline">{money(got)}</Link></td>
                      <td>
                        {manage ? (
                          <form action={toggleFundAction}>
                            <input type="hidden" name="id" value={f.id} />
                            <input type="hidden" name="to" value={String(!f.is_active)} />
                            <button type="submit" className={`badge ${f.is_active ? "badge-mint" : "badge-warn"}`} aria-label={f.is_active ? `Pause ${f.name}` : `Activate ${f.name}`}>{f.is_active ? "Active" : "Paused"}</button>
                          </form>
                        ) : (
                          <Badge tone={f.is_active ? "mint" : "warn"}>{f.is_active ? "Active" : "Paused"}</Badge>
                        )}
                      </td>
                      {manage && <td className="text-right"><Link href={`/funds?edit=${f.id}`} className="btn btn-ice btn-sm">Edit</Link></td>}
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          ) : (
            <EmptyState title="No giving funds" body="Add Offering, Tithe and other funds so members can give to them." />
          )}
        </Card>

        {manage && (
          <Card>
            <Label tone="orange" className="mb-1">{editing ? "Edit fund" : "New fund"}</Label>
            <h2 className="text-xl mb-4">{editing ? editing.name : "Add a giving fund"}</h2>
            <form action={editing ? updateFundAction : createFundAction} className="flex flex-col gap-4" key={editing?.id ?? "new"}>
              {editing && <input type="hidden" name="id" value={editing.id} />}
              <Field label="Name"><Input name="name" defaultValue={editing?.name ?? ""} placeholder="Building fund" required /></Field>
              {editing ? (
                <Field label="Slug" hint="Slugs are fixed once income is recorded against them."><Input value={editing.slug} readOnly disabled /></Field>
              ) : (
                <Field label="Slug" hint="Lowercase, used as the income category. Leave blank to make one from the name."><Input name="slug" placeholder="building-fund" /></Field>
              )}
              <Field label="Description"><Textarea name="description" defaultValue={editing?.description ?? ""} className="!min-h-[80px]" placeholder="What is this fund for?" /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Target (GH₵)"><Input name="target_amount" type="number" inputMode="decimal" step="0.01" min="0" defaultValue={editing?.target_amount ?? ""} placeholder="Optional" /></Field>
                <Field label="Sort order"><Input name="sort_order" type="number" defaultValue={editing?.sort_order ?? funds.length + 1} /></Field>
              </div>
              <div className="flex items-center gap-3">
                <SubmitButton variant="blue" pendingText="Saving…">{editing ? "Save fund" : "Add fund"}</SubmitButton>
                {editing && <Link href="/funds" className="btn btn-ice">Cancel</Link>}
              </div>
            </form>
          </Card>
        )}
      </div>
    </>
  );
}
