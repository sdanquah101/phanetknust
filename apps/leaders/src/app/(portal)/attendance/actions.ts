"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { Attendance } from "@phanet/supabase/types";
import { getLeaderContext, listMySheep, NOT_LINKED_MESSAGE } from "@/lib/queries";
import { str, withMsg } from "@/lib/followup-input";

/** Insert attendance for newly checked sheep; delete my own marks for unchecked sheep. */
export async function markAttendanceAction(formData: FormData) {
  const eventId = str(formData.get("event_id"));
  const back = eventId ? `/attendance?event=${eventId}` : "/attendance";
  if (!eventId) redirect(withMsg("/attendance", "error", "Pick an event first."));

  const { session, leaderMemberId, supabase } = await getLeaderContext();
  if (!leaderMemberId) redirect(withMsg(back, "error", NOT_LINKED_MESSAGE));

  const sheep = await listMySheep(supabase, leaderMemberId);
  const sheepIds = new Set(sheep.map((s) => s.id));
  const checked = new Set(formData.getAll("present").map((v) => String(v)).filter((id) => sheepIds.has(id)));

  const { data: existingRows } = await supabase.from("attendance").select("id, member_id, marked_by").eq("event_id", eventId).in("member_id", Array.from(sheepIds));
  const existing = (existingRows ?? []) as Pick<Attendance, "id" | "member_id" | "marked_by">[];
  const present = new Set(existing.map((a) => a.member_id));

  const toInsert = Array.from(checked).filter((id) => !present.has(id)).map((member_id) => ({ event_id: eventId, member_id, marked_by: session.user.id, method: "leader" as const }));
  const toDelete = existing.filter((a) => !checked.has(a.member_id) && a.marked_by === session.user.id).map((a) => a.id);

  if (toInsert.length) {
    const { error } = await supabase.from("attendance").insert(toInsert);
    if (error) redirect(withMsg(back, "error", error.message));
  }
  if (toDelete.length) {
    const { error } = await supabase.from("attendance").delete().in("id", toDelete);
    if (error) redirect(withMsg(back, "error", error.message));
  }

  revalidatePath("/attendance");
  revalidatePath("/sheep");
  const parts = [toInsert.length ? `${toInsert.length} marked present` : null, toDelete.length ? `${toDelete.length} unmarked` : null].filter(Boolean);
  redirect(withMsg(back, "ok", parts.length ? `Saved: ${parts.join(", ")}.` : "No changes to save."));
}
