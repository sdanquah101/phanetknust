import Link from "next/link";
import { Badge, Card, EmptyState, Field, Input, PageHeader, Select, SubmitButton, Table, Toast } from "@phanet/ui";
import { listAllItems, listCategories } from "@/lib/queries";
import { createItemAction, toggleItemAction } from "./actions";

export default async function ItemsPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const sp = await searchParams;
  const [items, categories] = await Promise.all([listAllItems(), listCategories()]);

  return (
    <>
      <PageHeader eyebrow="Welfare" title="Stock" script="shelf" />
      <Toast message={sp.ok} tone="mint" />
      <Toast message={sp.error} tone="peach" />

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr] items-start">
        <Card className="!p-4 md:!p-6">
          {items.length === 0 ? (
            <EmptyState title="No items yet" body="Add your first item on the right. It shows in the shop once it's active and in stock." />
          ) : (
            <Table>
              <thead>
                <tr><th>Item</th><th>Category</th><th>Qty</th><th>Max / request</th><th>Shop</th><th></th></tr>
              </thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.id} className={i.is_active ? "" : "opacity-60"}>
                    <td>
                      <Link href={`/team/items/${i.id}`} className="flex items-center gap-3 no-underline text-deep">
                        <span className="w-9 h-9 rounded-[12px] bg-row overflow-hidden grid place-items-center flex-none">
                          {i.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={i.image_url} alt="" className="w-full h-full object-cover" />
                          ) : null}
                        </span>
                        <span className="font-bold">{i.name}</span>
                      </Link>
                    </td>
                    <td className="text-muted">{i.category}</td>
                    <td>
                      <span className={i.qty_available <= 3 ? "text-ember font-bold" : "font-bold"}>{i.qty_available}</span> <span className="text-muted">{i.unit}</span>
                    </td>
                    <td className="text-muted">{i.max_per_request}</td>
                    <td>
                      <form action={toggleItemAction}>
                        <input type="hidden" name="id" value={i.id} />
                        <input type="hidden" name="is_active" value={i.is_active ? "false" : "true"} />
                        <button type="submit" className="inline-flex items-center gap-2 text-xs font-bold" aria-label={i.is_active ? `Hide ${i.name} from the shop` : `Show ${i.name} in the shop`}>
                          <span className={`relative inline-block w-9 h-5 rounded-pill transition ${i.is_active ? "bg-royal" : "bg-ice"}`}>
                            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition ${i.is_active ? "left-[18px]" : "left-0.5"}`} />
                          </span>
                          {i.is_active ? <Badge tone="good">Active</Badge> : <Badge tone="white" className="!bg-ice !text-muted">Hidden</Badge>}
                        </button>
                      </form>
                    </td>
                    <td className="text-right"><Link href={`/team/items/${i.id}`} className="btn btn-ice btn-sm">Edit</Link></td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>

        <Card className="flex flex-col gap-4">
          <h2 className="text-xl">Add item</h2>
          <form action={createItemAction} className="flex flex-col gap-4" encType="multipart/form-data">
            <Field label="Name"><Input name="name" placeholder="Gari" required minLength={2} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Category">
                <Input name="category" list="categories" placeholder="Groceries" defaultValue="Groceries" />
                <datalist id="categories">{categories.map((c) => <option key={c} value={c} />)}</datalist>
              </Field>
              <Field label="Unit"><Input name="unit" placeholder="pc, bag, tin, sachet" defaultValue="pc" /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Opening qty"><Input name="qty_available" type="number" min={0} step={1} defaultValue={0} required /></Field>
              <Field label="Max per request"><Input name="max_per_request" type="number" min={1} max={50} step={1} defaultValue={2} required /></Field>
            </div>
            <Field label="Opening stock came from">
              <Select name="reason" defaultValue="donation">
                <option value="donation">Donation</option>
                <option value="purchase">Purchase</option>
                <option value="adjustment">Adjustment</option>
              </Select>
            </Field>
            <Field label="Photo (optional)" hint="JPG or PNG, under 5MB."><Input name="image" type="file" accept="image/*" className="!py-2.5" /></Field>
            <SubmitButton pendingText="Adding…">Add to shelf</SubmitButton>
          </form>
        </Card>
      </div>
    </>
  );
}
