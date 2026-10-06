"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, getSession } from "@phanet/supabase/server";
import { PORTAL_ROLES, canAccess } from "@phanet/supabase/roles";
import { slugify } from "@phanet/supabase/format";
import type { Event } from "@phanet/supabase/types";

const str = (fd: FormData, k: string) => {
  const v = fd.get(k);
  const s = typeof v === "string" ? v.trim() : "";
  return s ? s : null;
};
const err: (path: string, message: string) => never = (path, message) => redirect(`${path}?error=${encodeURIComponent(message)}`);

function toIso(v: string | null): string | null {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

function readEvent(fd: FormData): { row: Partial<Event> } | { error: string } {
  const title = str(fd, "title");
  if (!title) return { error: "Give the event a title." };
  const starts_at = toIso(str(fd, "starts_at"));
  if (!starts_at) return { error: "Pick a valid start date and time." };
  const ends_at = toIso(str(fd, "ends_at"));
  if (ends_at && ends_at < starts_at) return { error: "The end time must come after the start." };
  const sem = str(fd, "semester");
  return {
    row: {
      title,
      program_id: str(fd, "program_id"),
      description: str(fd, "description"),
      starts_at,
      ends_at,
      location: str(fd, "location"),
      is_public: fd.get("is_public") === "on",
      academic_year: str(fd, "academic_year"),
      semester: sem === "1" ? 1 : sem === "2" ? 2 : null,
    },
  };
}

async function requireDatabase() {
  const session = await getSession();
  if (!session || !canAccess(session.roles, PORTAL_ROLES.database)) redirect("/no-access");
  return session;
}

export async function createEventAction(formData: FormData) {
  const session = await requireDatabase();
  const parsed = readEvent(formData);
  if ("error" in parsed) err("/events/new", parsed.error);
  const supabase = await createClient();
  const slug = `${slugify(parsed.row.title ?? "event")}-${Date.now().toString(36)}`;
  const { data, error } = await supabase.from("events").insert({ ...parsed.row, slug, created_by: session.user.id }).select("id").single();
  if (error || !data) err("/events/new", error?.message ?? "Could not create the event.");
  revalidatePath("/events");
  revalidatePath("/");
  redirect(`/events/${(data as { id: string }).id}?ok=${encodeURIComponent("Event created.")}`);
}

export async function updateEventAction(formData: FormData) {
  await requireDatabase();
  const id = str(formData, "id");
  if (!id) err("/events", "Missing event.");
  const parsed = readEvent(formData);
  if ("error" in parsed) err(`/events/${id}/edit`, parsed.error);
  const supabase = await createClient();
  const { error } = await supabase.from("events").update(parsed.row).eq("id", id);
  if (error) err(`/events/${id}/edit`, error.message);
  revalidatePath("/events");
  revalidatePath(`/events/${id}`);
  redirect(`/events/${id}?ok=${encodeURIComponent("Event saved.")}`);
}

export async function deleteEventAction(formData: FormData) {
  await requireDatabase();
  const id = str(formData, "id");
  if (!id) err("/events", "Missing event.");
  const supabase = await createClient();
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) err(`/events/${id}`, error.message);
  revalidatePath("/events");
  revalidatePath("/");
  redirect(`/events?ok=${encodeURIComponent("Event deleted.")}`);
}
