"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, getSession } from "@phanet/supabase/server";
import { PORTAL_ROLES, canAccess } from "@phanet/supabase/roles";

export async function decideTransferAction(formData: FormData) {
  const session = await getSession();
  if (!session || !canAccess(session.roles, PORTAL_ROLES.database)) redirect("/no-access");
  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  if (!id || (decision !== "approved" && decision !== "rejected")) redirect(`/transfers?error=${encodeURIComponent("Invalid decision.")}`);
  const supabase = await createClient();
  const { error } = await supabase.rpc("decide_transfer", { p_id: id, p_decision: decision });
  if (error) redirect(`/transfers?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/transfers");
  revalidatePath("/members");
  revalidatePath("/leaders");
  redirect(`/transfers?ok=${encodeURIComponent(decision === "approved" ? "Transfer approved. The sheep now has a new leader." : "Transfer rejected.")}`);
}
