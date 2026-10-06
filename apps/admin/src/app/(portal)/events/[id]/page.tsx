import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, ConfirmSubmit, Field, Input, Label, PageHeader, Select, SubmitButton, Textarea } from "@phanet/ui";
import { createClient } from "@phanet/supabase/server";
import type { Event, Program } from "@phanet/supabase/types";
import { Flash, type FlashParams } from "@/components/Flash";
import { isUuid, toLocalInput } from "@/lib/form";
import { deleteEvent, saveEvent } from "../actions";

export default async function EventEditPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<FlashParams> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const isNew = id === "new";
  if (!isNew && !isUuid(id)) notFound();
  const supabase = await createClient();
  const [{ data: programRows }, eventRes] = await Promise.all([
    supabase.from("programs").select("id, name").order("sort_order"),
    isNew ? Promise.resolve({ data: null }) : supabase.from("events").select("*").eq("id", id).maybeSingle(),
  ]);
  const programs = (programRows ?? []) as Pick<Program, "id" | "name">[];
  const event = (eventRes.data as Event | null) ?? null;
  if (!isNew && !event) notFound();

  return (
    <>
      <PageHeader eyebrow="Events" title={isNew ? "New event" : event!.title} actions={<Link href="/events" className="btn btn-ice btn-sm">← All events</Link>} />
      <Flash ok={sp.ok} error={sp.error} />
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] items-start">
        <Card>
          <form action={saveEvent} className="flex flex-col gap-4">
            <input type="hidden" name="id" value={event?.id ?? ""} />
            <Field label="Title"><Input name="title" defaultValue={event?.title ?? ""} placeholder="Youth Sunday" required /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Slug" hint="Leave blank to generate."><Input name="slug" defaultValue={event?.slug ?? ""} placeholder="youth-sunday-2026" /></Field>
              <Field label="Program">
                <Select name="program_id" defaultValue={event?.program_id ?? ""}>
                  <option value="">— None —</option>
                  {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </Select>
              </Field>
            </div>
            <Field label="Description"><Textarea name="description" defaultValue={event?.description ?? ""} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Starts"><Input name="starts_at" type="datetime-local" defaultValue={toLocalInput(event?.starts_at)} required /></Field>
              <Field label="Ends"><Input name="ends_at" type="datetime-local" defaultValue={toLocalInput(event?.ends_at)} /></Field>
            </div>
            <Field label="Location"><Input name="location" defaultValue={event?.location ?? ""} placeholder="Great Hall" /></Field>
            <div className="grid gap-4 sm:grid-cols-3 items-end">
              <Field label="Academic year"><Input name="academic_year" defaultValue={event?.academic_year ?? ""} placeholder="2026/2027" /></Field>
              <Field label="Semester">
                <Select name="semester" defaultValue={event?.semester ? String(event.semester) : ""}>
                  <option value="">—</option><option value="1">Semester 1</option><option value="2">Semester 2</option>
                </Select>
              </Field>
              <label className="option-row flex items-center gap-3 cursor-pointer">
                <input type="checkbox" name="is_public" className="check" defaultChecked={event?.is_public ?? true} />
                <span className="font-bold text-sm">Public on the site</span>
              </label>
            </div>
            <Field label="Cover image"><input type="file" name="cover" accept="image/*" className="input" /></Field>
            <div><SubmitButton pendingText="Saving…">{isNew ? "Create event" : "Save changes"}</SubmitButton></div>
          </form>
        </Card>
        <div className="flex flex-col gap-6">
          <Card className="flex flex-col gap-3">
            <Label tone="orange">Cover</Label>
            {event?.cover_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={event.cover_url} alt={event.title} className="w-full aspect-[4/3] object-cover rounded-card" />
            ) : (
              <div className="aspect-[4/3] rounded-card bg-ice grid place-items-center text-sm text-muted">No cover yet</div>
            )}
          </Card>
          {event && (
            <Card className="flex flex-col gap-3">
              <Label tone="orange">Danger zone</Label>
              <p className="text-sm text-muted">Deleting also removes attendance marked for this event.</p>
              <form action={deleteEvent}>
                <input type="hidden" name="id" value={event.id} />
                <ConfirmSubmit variant="danger" size="sm" message={`Delete "${event.title}" and its attendance records?`}>Delete event</ConfirmSubmit>
              </form>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
