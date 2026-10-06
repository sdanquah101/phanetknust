"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, getSession } from "@phanet/supabase/server";
import { PORTAL_ROLES, canAccess } from "@phanet/supabase/roles";

export type AssignResult = { ok: true; count: number } | { ok: false; error: string };

/** Set members.leader_id for the chosen members (database/admin via RLS). */
export async function assignSheep(leaderId: string, memberIds: string[]): Promise<AssignResult> {
  const session = await getSession();
  if (!session || !canAccess(session.roles, PORTAL_ROLES.database)) return { ok: false, error: "You don't have access to do that." };
  const ids = Array.from(new Set(memberIds.filter((x) => typeof x === "string" && x && x !== leaderId)));
  if (!leaderId || !ids.length) return { ok: false, error: "Pick at least one member." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("members").update({ leader_id: leaderId }).in("id", ids).select("id");
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/leaders/${leaderId}`);
  revalidatePath("/leaders");
  revalidatePath("/members");
  return { ok: true, count: data?.length ?? 0 };
}

export async function unassignSheepAction(formData: FormData) {
  const session = await getSession();
  const leaderId = String(formData.get("leader_id") ?? "");
  const memberId = String(formData.get("member_id") ?? "");
  const back = leaderId ? `/leaders/${leaderId}` : "/leaders";
  if (!session || !canAccess(session.roles, PORTAL_ROLES.database)) redirect("/no-access");
  if (!memberId) redirect(`${back}?error=${encodeURIComponent("Missing member.")}`);
  const supabase = await createClient();
  const { error } = await supabase.from("members").update({ leader_id: null }).eq("id", memberId);
  if (error) redirect(`${back}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(back);
  revalidatePath("/leaders");
  redirect(`${back}?ok=${encodeURIComponent("Unassigned.")}`);
}
