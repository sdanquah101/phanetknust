import Link from "next/link";
import { Badge, Card, EmptyState, PageHeader, SubmitButton, Table } from "@phanet/ui";
import { createClient } from "@phanet/supabase/server";
import type { Program } from "@phanet/supabase/types";
import { Flash, type FlashParams } from "@/components/Flash";
import { toggleProgram } from "./actions";

export default async function ProgramsPage({ searchParams }: { searchParams: Promise<FlashParams> }) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.from("programs").select("*").order("sort_order").order("name");
  const programs = (data ?? []) as Program[];

  return (
    <>
      <PageHeader eyebrow="Main site" title="Programs &" script="ministries" actions={<Link href="/programs/new" className="btn btn-orange btn-sm">+ New program</Link>} />
      <Flash ok={sp.ok} error={sp.error} />
      {programs.length === 0 ? (
        <EmptyState title="No programs yet." body="Programs are the recurring gatherings on the main site: dawn prayer, Bible study, Sunday service…" action={<Link href="/programs/new" className="btn btn-orange btn-sm">Add the first</Link>} />
      ) : (
        <Card>
          <Table>
            <thead>
              <tr><th>Program</th><th>Schedule</th><th className="hidden xl:table-cell">Location</th><th className="hidden 2xl:table-cell">Order</th><th>Status</th><th /></tr>
            </thead>
            <tbody>
              {programs.map((p) => (
                <tr key={p.id}>
                  <td className="min-w-[16rem]">
                    <div className="flex items-center gap-3">
                      {p.cover_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.cover_url} alt="" className="w-12 h-12 rounded-2xl object-cover flex-none" />
                      ) : (
                        <span className="w-12 h-12 rounded-2xl bg-ice flex-none" />
                      )}
                      <div className="min-w-0">
                        <div className="font-bold truncate">{p.name}</div>
                        <div className="text-xs text-muted truncate">/{p.slug}{p.tagline ? ` · ${p.tagline}` : ""}</div>
                      </div>
                    </div>
                  </td>
                  <td className="min-w-[9rem] text-sm">{p.schedule_label ?? "—"}</td>
                  <td className="hidden xl:table-cell text-sm"><div className="truncate">{p.location ?? "—"}</div></td>
                  <td className="hidden 2xl:table-cell">{p.sort_order}</td>
                  <td>{p.is_active ? <Badge tone="mint">Live</Badge> : <Badge tone="warn">Hidden</Badge>}</td>
                  <td className="text-right whitespace-nowrap">
                    <div className="inline-flex gap-2">
                      <form action={toggleProgram}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="is_active" value={p.is_active ? "false" : "true"} />
                        <SubmitButton variant="ice" size="sm">{p.is_active ? "Hide" : "Show"}</SubmitButton>
                      </form>
                      <Link href={`/programs/${p.id}`} className="btn btn-blue btn-sm">Edit</Link>
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
