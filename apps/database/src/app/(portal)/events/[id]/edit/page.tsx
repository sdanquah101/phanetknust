import { notFound } from "next/navigation";
import { ButtonLink, PageHeader, Toast } from "@phanet/ui";
import { createClient } from "@phanet/supabase/server";
import { getEvent, listPrograms } from "@/lib/queries";
import { EventForm } from "@/components/EventForm";
import { updateEventAction } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditEventPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const supabase = await createClient();
  const [event, programs] = await Promise.all([getEvent(supabase, id), listPrograms(supabase)]);
  if (!event) notFound();
  return (
    <>
      <PageHeader eyebrow="Events" title={event.title} script="edit" actions={<ButtonLink href={`/events/${id}`} variant="ice" size="sm">← Back</ButtonLink>} />
      <Toast message={sp.error} tone="peach" />
      <EventForm action={updateEventAction} programs={programs} event={event} />
    </>
  );
}
