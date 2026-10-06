import { PageHeader, Toast } from "@phanet/ui";
import { createClient } from "@phanet/supabase/server";
import { listPrograms } from "@/lib/queries";
import { EventForm } from "@/components/EventForm";
import { createEventAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewEventPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const sp = await searchParams;
  const supabase = await createClient();
  const programs = await listPrograms(supabase);
  return (
    <>
      <PageHeader eyebrow="Events" title="New" script="event" />
      <Toast message={sp.error} tone="peach" />
      <EventForm action={createEventAction} programs={programs} />
    </>
  );
}
