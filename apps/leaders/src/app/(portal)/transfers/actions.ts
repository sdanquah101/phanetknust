"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getLeaderContext, getMySheep, listLeaders, NOT_LINKED_MESSAGE } from "@/lib/queries";
import { orNull, str, withMsg } from "@/lib/followup-input";

export async function requestTransferAction(formData: FormData) {
  const sheep_id = str(formData.get("sheep_id"));
  const to_leader = str(formData.get("to_leader"));
  const reason = orNull(str(formData.get("reason")));
  const back = sheep_id ? `/transfers/new?sheep=${sheep_id}` : "/transfers/new";

  const { session, leaderMemberId, supabase } = await getLeaderContext();
  if (!leaderMemberId) redirect(withMsg(back, "error", NOT_LINKED_MESSAGE));
  if (!sheep_id) redirect(withMsg(back, "error", "Pick a sheep to transfer."));
  if (!to_leader) redirect(withMsg(back, "error", "Pick the leader to transfer to."));
  if (to_leader === leaderMemberId) redirect(withMsg(back, "error", "That's you. Pick another leader."));

  const [sheep, leaders] = await Promise.all([getMySheep(supabase, leaderMemberId, sheep_id), listLeaders(supabase)]);
  if (!sheep) redirect(withMsg(back, "error", "That member isn't one of your sheep."));
  if (!leaders.some((l) => l.id === to_leader)) redirect(withMsg(back, "error", "That leader isn't on the list."));

  const { data: pending } = await supabase.from("transfer_requests").select("id").eq("sheep_id", sheep_id).eq("status", "pending").limit(1);
  if ((pending ?? []).length) redirect(withMsg(back, "error", "There's already a pending transfer for this member."));

  const { error } = await supabase.from("transfer_requests").insert({ sheep_id, from_leader: leaderMemberId, to_leader, reason, created_by: session.user.id });
  if (error) redirect(withMsg(back, "error", error.message));

  revalidatePath("/transfers");
  redirect(withMsg("/transfers", "ok", "Transfer requested. The database team will review it."));
}
