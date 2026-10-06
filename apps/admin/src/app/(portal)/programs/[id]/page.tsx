import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, ConfirmSubmit, Field, Input, Label, PageHeader, SubmitButton, Textarea } from "@phanet/ui";
import { createClient } from "@phanet/supabase/server";
import type { Program } from "@phanet/supabase/types";
import { Flash, type FlashParams } from "@/components/Flash";
import { isUuid } from "@/lib/form";
import { deleteProgram, saveProgram } from "../actions";

export default async function ProgramEditPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<FlashParams> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const isNew = id === "new";
  if (!isNew && !isUuid(id)) notFound();
  let program: Program | null = null;
  if (!isNew) {
    const supabase = await createClient();
    const { data } = await supabase.from("programs").select("*").eq("id", id).maybeSingle();
    program = data as Program | null;
    if (!program) notFound();
  }

  return (
    <>
      <PageHeader eyebrow="Programs" title={isNew ? "New program" : program!.name} actions={<Link href="/programs" className="btn btn-ice btn-sm">← All programs</Link>} />
      <Flash ok={sp.ok} error={sp.error} />
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] items-start">
        <Card>
          <form action={saveProgram} className="flex flex-col gap-4">
            <input type="hidden" name="id" value={program?.id ?? ""} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name"><Input name="name" defaultValue={program?.name ?? ""} placeholder="Dawn Prayer" required /></Field>
              <Field label="Slug" hint="Leave blank to generate from the name."><Input name="slug" defaultValue={program?.slug ?? ""} placeholder="dawn-prayer" /></Field>
            </div>
            <Field label="Tagline"><Input name="tagline" defaultValue={program?.tagline ?? ""} placeholder="Start the day on your knees" /></Field>
            <Field label="Description"><Textarea name="description" defaultValue={program?.description ?? ""} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Schedule label"><Input name="schedule_label" defaultValue={program?.schedule_label ?? ""} placeholder="MON–FRI · 5:30AM" /></Field>
              <Field label="Location"><Input name="location" defaultValue={program?.location ?? ""} placeholder="Katanga Hall chapel" /></Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 items-end">
              <Field label="Sort order"><Input name="sort_order" type="number" defaultValue={program?.sort_order ?? 0} /></Field>
              <label className="option-row flex items-center gap-3 cursor-pointer">
                <input type="checkbox" name="is_active" className="check" defaultChecked={program?.is_active ?? true} />
                <span className="font-bold text-sm">Visible on the site</span>
              </label>
            </div>
            <Field label="Cover image" hint="JPG/PNG/WebP. Uploads to the site bucket as programs/<slug>."><input type="file" name="cover" accept="image/*" className="input" /></Field>
            <div><SubmitButton pendingText="Saving…">{isNew ? "Create program" : "Save changes"}</SubmitButton></div>
          </form>
        </Card>
        <div className="flex flex-col gap-6">
          <Card className="flex flex-col gap-3">
            <Label tone="orange">Cover</Label>
            {program?.cover_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={program.cover_url} alt={program.name} className="w-full aspect-[4/3] object-cover rounded-card" />
            ) : (
              <div className="aspect-[4/3] rounded-card bg-ice grid place-items-center text-sm text-muted">No cover yet</div>
            )}
          </Card>
          {program && (
            <Card className="flex flex-col gap-3">
              <Label tone="orange">Danger zone</Label>
              <p className="text-sm text-muted">Deleting removes the program from the site. Events linked to it stay, unlinked.</p>
              <form action={deleteProgram}>
                <input type="hidden" name="id" value={program.id} />
                <ConfirmSubmit variant="danger" size="sm" message={`Delete "${program.name}"? This can't be undone.`}>Delete program</ConfirmSubmit>
              </form>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
