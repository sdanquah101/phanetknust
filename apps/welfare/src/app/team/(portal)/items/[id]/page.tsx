import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Card, EmptyState, Field, Input, Label, PageHeader, Select, SubmitButton, Table, Textarea, Toast } from "@phanet/ui";
import { fmtDateTime } from "@phanet/supabase/format";
import { getItem, listCategories, listMovements, profileNames } from "@/lib/queries";
import { adjustStockAction, updateItemAction } from "../actions";

const REASON_LABEL: Record<string, string> = { donation: "Donation", purchase: "Purchase", issued: "Issued", adjustment: "Adjustment", returned: "Returned" };

export default async function ItemPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const item = await getItem(id);
  if (!item) notFound();
  const [categories, moves] = await Promise.all([listCategories(), listMovements({ itemId: id, limit: 100 })]);
  const names = await profileNames(moves.map((m) => m.by_user));

  return (
    <>
      <PageHeader
        eyebrow={item.category}
        title={item.name}
        actions={<Link href="/team/items" className="btn btn-ice btn-sm">← All stock</Link>}
      />
      <Toast message={sp.ok} tone="mint" />
      <Toast message={sp.error} tone="peach" />

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card tone="blue" className="flex flex-col gap-2">
          <Label tone="peach">In stock</Label>
          <div className="num-lg">{item.qty_available} <span className="text-base font-semibold text-white">{item.unit}</span></div>
        </Card>
        <Card className="flex flex-col gap-2">
          <Label tone="orange">Max per request</Label>
          <div className="num-lg">{item.max_per_request}</div>
        </Card>
        <Card className="flex flex-col gap-2 col-span-2">
          <Label tone="orange">In the shop</Label>
          <div>{item.is_active ? <Badge tone="good">Visible</Badge> : <Badge tone="white" className="!bg-ice !text-muted">Hidden</Badge>}</div>
          <p className="text-xs text-muted">Members see this item when it is active and has stock.</p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 items-start">
        <Card className="flex flex-col gap-4">
          <h2 className="text-xl">Adjust stock</h2>
          <form action={adjustStockAction} className="flex flex-col gap-4">
            <input type="hidden" name="id" value={item.id} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Direction">
                <Select name="direction" defaultValue="in">
                  <option value="in">Add (+)</option>
                  <option value="out">Remove (−)</option>
                </Select>
              </Field>
              <Field label={`Units (${item.unit})`}><Input name="amount" type="number" min={1} step={1} defaultValue={1} required /></Field>
            </div>
            <Field label="Reason">
              <Select name="reason" defaultValue="donation">
                <option value="donation">Donation</option>
                <option value="purchase">Purchase</option>
                <option value="adjustment">Adjustment (count / damage)</option>
                <option value="returned">Returned</option>
              </Select>
            </Field>
            <Field label="Note (optional)"><Textarea name="note" placeholder="e.g. From Sunday donation drive" className="min-h-[70px]" /></Field>
            <SubmitButton pendingText="Saving…">Record movement</SubmitButton>
          </form>
        </Card>

        <Card className="flex flex-col gap-4">
          <h2 className="text-xl">Edit item</h2>
          <form action={updateItemAction} className="flex flex-col gap-4" encType="multipart/form-data">
            <input type="hidden" name="id" value={item.id} />
            <Field label="Name"><Input name="name" defaultValue={item.name} required minLength={2} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Category">
                <Input name="category" list="categories" defaultValue={item.category} />
                <datalist id="categories">{categories.map((c) => <option key={c} value={c} />)}</datalist>
              </Field>
              <Field label="Unit"><Input name="unit" defaultValue={item.unit} /></Field>
            </div>
            <Field label="Max per request"><Input name="max_per_request" type="number" min={1} max={50} step={1} defaultValue={item.max_per_request} required /></Field>
            <div className="flex items-center gap-3">
              {item.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.image_url} alt={item.name} className="w-16 h-16 rounded-[14px] object-cover bg-row" />
              ) : (
                <span className="w-16 h-16 rounded-[14px] bg-row grid place-items-center"></span>
              )}
              <Field label="Replace photo" className="flex-1"><Input name="image" type="file" accept="image/*" className="!py-2.5" /></Field>
            </div>
            {item.image_url && (
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="remove_image" className="check" /> Remove current photo</label>
            )}
            <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" name="is_active" className="check" defaultChecked={item.is_active} /> Show in the shop</label>
            <SubmitButton variant="blue" pendingText="Saving…">Save changes</SubmitButton>
          </form>
        </Card>
      </div>

      <Card className="!p-4 md:!p-6 flex flex-col gap-3">
        <h2 className="text-xl">Movement history</h2>
        {moves.length === 0 ? (
          <EmptyState title="No movements yet" body="Donations, purchases and issued requests will show up here." />
        ) : (
          <Table>
            <thead><tr><th>When</th><th>Change</th><th>Reason</th><th>Note</th><th>By</th></tr></thead>
            <tbody>
              {moves.map((m) => (
                <tr key={m.id}>
                  <td className="text-muted whitespace-nowrap">{fmtDateTime(m.created_at)}</td>
                  <td className={m.delta >= 0 ? "amt-in" : "amt-out"}>{m.delta > 0 ? `+${m.delta}` : m.delta}</td>
                  <td><Badge tone={m.delta >= 0 ? "good" : "warn"}>{REASON_LABEL[m.reason] ?? m.reason}</Badge></td>
                  <td className="text-muted">{m.note ?? "—"}</td>
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
