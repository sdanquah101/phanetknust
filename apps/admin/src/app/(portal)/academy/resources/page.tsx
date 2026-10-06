import Link from "next/link";
import { Badge, Card, EmptyState, PageHeader, SubmitButton, Table } from "@phanet/ui";
import { createClient } from "@phanet/supabase/server";
import { fmtDate } from "@phanet/supabase/format";
import type { Resource } from "@phanet/supabase/types";
import { Flash, type FlashParams } from "@/components/Flash";
import { toggleResource } from "../actions";

export default async function ResourcesPage({ searchParams }: { searchParams: Promise<FlashParams> }) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.from("resources").select("*").order("sort_order").order("created_at", { ascending: false });
  const resources = (data ?? []) as Resource[];
  return (
    <>
      <PageHeader
        eyebrow="Academy"
        title="Library &"
        script="resources"
        actions={
          <>
            <Link href="/academy" className="btn btn-ice btn-sm">← Courses</Link>
            <Link href="/academy/resources/new" className="btn btn-orange btn-sm">+ New resource</Link>
          </>
        }
      />
      <Flash ok={sp.ok} error={sp.error} />
      {resources.length === 0 ? (
        <EmptyState title="The library is empty." body="Upload PDFs and audio messages, or link YouTube sermons, for students to download." action={<Link href="/academy/resources/new" className="btn btn-orange btn-sm">Add a resource</Link>} />
      ) : (
        <Card>
          <Table>
            <thead>
              <tr><th>Resource</th><th>Type</th><th>Links</th><th>Added</th><th>Status</th><th /></tr>
            </thead>
            <tbody>
              {resources.map((r) => (
                <tr key={r.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      {r.cover_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.cover_url} alt="" className="w-10 h-12 rounded-xl object-cover flex-none" />
                      ) : (
                        <span className="w-10 h-12 rounded-xl bg-ice flex-none" />
                      )}
                      <div className="min-w-0">
                        <div className="font-bold truncate">{r.title}</div>
                        <div className="text-xs text-muted truncate">{r.author ?? "—"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="capitalize">{r.kind}</td>
                  <td className="text-xs">
                    <div className="flex flex-wrap gap-1">
                      {r.file_url && <a href={r.file_url} target="_blank" rel="noreferrer" className="pill pill-ice !py-1 !px-2.5 no-underline">File</a>}
                      {r.youtube_url && <a href={r.youtube_url} target="_blank" rel="noreferrer" className="pill pill-ice !py-1 !px-2.5 no-underline">YouTube</a>}
                      {!r.file_url && !r.youtube_url && <span className="text-muted">—</span>}
                    </div>
                  </td>
                  <td className="whitespace-nowrap">{fmtDate(r.created_at)}</td>
                  <td>{r.is_published ? <Badge tone="mint">Published</Badge> : <Badge tone="warn">Hidden</Badge>}</td>
                  <td className="text-right whitespace-nowrap">
                    <div className="inline-flex gap-2">
                      <form action={toggleResource}>
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="is_published" value={r.is_published ? "false" : "true"} />
                        <SubmitButton variant="ice" size="sm">{r.is_published ? "Hide" : "Publish"}</SubmitButton>
                      </form>
                      <Link href={`/academy/resources/${r.id}`} className="btn btn-blue btn-sm">Edit</Link>
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
