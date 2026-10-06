"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { Followup } from "@phanet/supabase/types";
import { getLeaderContext, getMySheep, NOT_LINKED_MESSAGE } from "@/lib/queries";
import { parseFollowup, safeBack, str, orNull, withMsg } from "@/lib/followup-input";

function revalidateAll(sheepId?: string, followupId?: string) {
  revalidatePath("/");
  revalidatePath("/sheep");
  revalidatePath("/followups");
  if (sheepId) revalidatePath(`/sheep/${sheepId}`);
  if (followupId) revalidatePath(`/followups/${followupId}`);
}

/** Insert a follow-up for one of my sheep. `back` is where errors go; success goes to the sheep page or the new follow-up. */
export async function createFollowupAction(formData: FormData) {
  const back = safeBack(formData.get("back"), "/followups/new");
  const { session, leaderMemberId, supabase } = await getLeaderContext();
  if (!leaderMemberId) redirect(withMsg(back, "error", NOT_LINKED_MESSAGE));
  const parsed = parseFollowup(formData);
  if ("error" in parsed) redirect(withMsg(back, "error", parsed.error));
  const sheep = await getMySheep(supabase, leaderMemberId, parsed.input.sheep_id);
  if (!sheep) redirect(withMsg(back, "error", "That member isn't one of your sheep."));

  const { data, error } = await supabase
    .from("followups")
    .insert({ ...parsed.input, leader_id: leaderMemberId, created_by: session.user.id })
    .select("id")
    .single();
  if (error) redirect(withMsg(back, "error", error.message));

  revalidateAll(parsed.input.sheep_id);
  const target = back.startsWith("/sheep/") ? back : `/followups/${(data as { id: string }).id}`;
  redirect(withMsg(target, "ok", "Follow-up logged. Well done, shepherd."));
}

export async function updateFollowupAction(formData: FormData) {
  const id = str(formData.get("id"));
  const back = `/followups/${id}`;
  const { leaderMemberId, supabase } = await getLeaderContext();
  if (!leaderMemberId) redirect(withMsg(back, "error", NOT_LINKED_MESSAGE));
  const parsed = parseFollowup(formData);
  if ("error" in parsed) redirect(withMsg(back, "error", parsed.error));

  const { data: existing } = await supabase.from("followups").select("id, leader_id, sheep_id").eq("id", id).maybeSingle();
  const row = existing as Pick<Followup, "id" | "leader_id" | "sheep_id"> | null;
  if (!row || row.leader_id !== leaderMemberId) redirect(withMsg(back, "error", "You can only edit your own follow-ups."));

  const { sheep_id: _ignored, ...fields } = parsed.input; // the sheep cannot be changed on edit
  void _ignored;
  const { error } = await supabase.from("followups").update(fields).eq("id", id).eq("leader_id", leaderMemberId);
  if (error) redirect(withMsg(back, "error", error.message));
  revalidateAll(row.sheep_id, id);
  redirect(withMsg(back, "ok", "Follow-up updated."));
}

export async function deleteFollowupAction(formData: FormData) {
  const id = str(formData.get("id"));
  const { leaderMemberId, supabase } = await getLeaderContext();
  if (!leaderMemberId) redirect(withMsg("/followups", "error", NOT_LINKED_MESSAGE));
  const { data: existing } = await supabase.from("followups").select("id, leader_id, sheep_id").eq("id", id).maybeSingle();
  const row = existing as Pick<Followup, "id" | "leader_id" | "sheep_id"> | null;
  if (!row || row.leader_id !== leaderMemberId) redirect(withMsg(`/followups/${id}`, "error", "You can only delete your own follow-ups."));
  const { error } = await supabase.from("followups").delete().eq("id", id).eq("leader_id", leaderMemberId);
  if (error) redirect(withMsg(`/followups/${id}`, "error", error.message));
  revalidateAll(row.sheep_id, id);
  redirect(withMsg("/followups", "ok", "Follow-up deleted."));
}

export async function shareFollowupAction(formData: FormData) {
  const id = str(formData.get("id"));
  const shared_with = str(formData.get("shared_with"));
  const note = orNull(str(formData.get("note")));
  const back = `/followups/${id}`;
  const { session, leaderMemberId, supabase } = await getLeaderContext();
  if (!leaderMemberId) redirect(withMsg(back, "error", NOT_LINKED_MESSAGE));
  if (!shared_with) redirect(withMsg(back, "error", "Pick a leader to share with."));
  if (shared_with === leaderMemberId) redirect(withMsg(back, "error", "That's you. Pick another leader."));
  const { error } = await supabase.from("followup_shares").upsert({ followup_id: id, shared_with, note, shared_by: session.user.id }, { onConflict: "followup_id,shared_with" });
  if (error) redirect(withMsg(back, "error", error.message));
  revalidatePath(back);
  revalidatePath("/followups");
  redirect(withMsg(back, "ok", "Shared. They'll see it on their dashboard."));
}

export async function unshareFollowupAction(formData: FormData) {
  const id = str(formData.get("id"));
  const shared_with = str(formData.get("shared_with"));
  const back = `/followups/${id}`;
  const { leaderMemberId, supabase } = await getLeaderContext();
  if (!leaderMemberId) redirect(withMsg(back, "error", NOT_LINKED_MESSAGE));
  const { error } = await supabase.from("followup_shares").delete().eq("followup_id", id).eq("shared_with", shared_with);
  if (error) redirect(withMsg(back, "error", error.message));
  revalidatePath(back);
  revalidatePath("/followups");
  redirect(withMsg(back, "ok", "Share removed."));
}
