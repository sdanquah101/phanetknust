import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, ConfirmSubmit, Label, PageHeader } from "@phanet/ui";
import { createClient } from "@phanet/supabase/server";
import type { Resource } from "@phanet/supabase/types";
import { Flash, type FlashParams } from "@/components/Flash";
import { isUuid } from "@/lib/form";
import { ResourceForm } from "../ResourceForm";
import { deleteResource } from "../../actions";

export default async function ResourceEditPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<FlashParams> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const isNew = id === "new";
  if (!isNew && !isUuid(id)) notFound();
  let resource: Resource | null = null;
  if (!isNew) {
    const supabase = await createClient();
    const { data } = await supabase.from("resources").select("*").eq("id", id).maybeSingle();
    resource = data as Resource | null;
    if (!resource) notFound();
  }
  return (
    <>
      <PageHeader eyebrow="Resources" title={isNew ? "New resource" : resource!.title} actions={<Link href="/academy/resources" className="btn btn-ice btn-sm">← All resources</Link>} />
      <Flash ok={sp.ok} error={sp.error} />
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] items-start">
        <Card><ResourceForm resource={resource} /></Card>
        {resource && (
          <div className="flex flex-col gap-6">
            <Card className="flex flex-col gap-3">
              <Label tone="orange">Preview</Label>
              {resource.cover_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={resource.cover_url} alt={resource.title} className="w-full aspect-[3/4] max-h-80 object-cover rounded-card" />
              ) : (
                <div className="aspect-[3/4] max-h-60 rounded-card bg-ice grid place-items-center text-sm text-muted">No cover yet</div>
              )}
              <div className="flex flex-wrap gap-2 text-sm">
                {resource.file_url && <a href={resource.file_url} target="_blank" rel="noreferrer" className="btn btn-ice btn-sm">Open file</a>}
                {resource.youtube_url && <a href={resource.youtube_url} target="_blank" rel="noreferrer" className="btn btn-ice btn-sm">Open on YouTube</a>}
              </div>
            </Card>
            <Card className="flex flex-col gap-3">
              <Label tone="orange">Danger zone</Label>
              <form action={deleteResource}>
                <input type="hidden" name="id" value={resource.id} />
                <ConfirmSubmit variant="danger" size="sm" message={`Delete "${resource.title}"?`}>Delete resource</ConfirmSubmit>
              </form>
            </Card>
          </div>
        )}
      </div>
    </>
  );
}
