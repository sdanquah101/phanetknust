"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@phanet/supabase/server";
import { slugify } from "@phanet/supabase/format";
import { done, errMsg, fail } from "@/lib/flash";
import { bool, file, isUuid, num, opt, str, toIso } from "@/lib/form";
import { extOf, uploadPublic } from "@/lib/storage";

export async function saveEvent(formData: FormData) {
  const id = str(formData, "id");
  const isNew = !isUuid(id);
  const back = isNew ? "/events/new" : `/events/${id}`;
  const title = str(formData, "title");
  if (!title) fail(back, "Give the event a title.");
  const starts_at = toIso(opt(formData, "starts_at"));
  if (!starts_at) fail(back, "Pick a start date and time.");
  const ends_at = toIso(opt(formData, "ends_at"));
  if (ends_at && ends_at < starts_at) fail(back, "The end must come after the start.");
  const slugRaw = str(formData, "slug");
  const slug = slugRaw ? slugify(slugRaw) : slugify(`${title}-${starts_at.slice(0, 10)}`);
  const program_id = str(formData, "program_id");
  const semesterRaw = num(formData, "semester", 0);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const row: Record<string, unknown> = {
    title,
    slug: slug || null,
    program_id: isUuid(program_id) ? program_id : null,
    description: opt(formData, "description"),
    starts_at,
    ends_at,
    location: opt(formData, "location"),
    is_public: bool(formData, "is_public"),
    academic_year: opt(formData, "academic_year"),
    semester: semesterRaw === 1 || semesterRaw === 2 ? semesterRaw : null,
  };
  const cover = file(formData, "cover");
  if (cover) {
    try {
      row.cover_url = await uploadPublic(supabase, "site", `events/${slug || Date.now()}.${extOf(cover)}`, cover);
    } catch (e) {
      fail(back, errMsg(e));
    }
  }
  const dup = (m: string) => (m.includes("duplicate") ? "That slug is already used by another event." : m);
  if (isNew) {
    const { data, error } = await supabase.from("events").insert({ ...row, created_by: user?.id ?? null }).select("id").single();
    if (error) fail(back, dup(error.message));
    revalidatePath("/events");
    done(`/events/${(data as { id: string }).id}`, "Event created.");
  }
  const { error } = await supabase.from("events").update(row).eq("id", id);
  if (error) fail(back, dup(error.message));
  revalidatePath("/events");
  revalidatePath(back);
  done(back, "Event saved.");
}

export async function deleteEvent(formData: FormData) {
  const id = str(formData, "id");
  if (!isUuid(id)) fail("/events", "Unknown event.");
  const supabase = await createClient();
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) fail(`/events/${id}`, error.message);
  revalidatePath("/events");
  done("/events", "Event deleted.");
}
