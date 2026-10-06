"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@phanet/supabase/server";
import { STATUS_LABEL, isStatus } from "@/lib/status";

const UUID = /^[0-9a-f-]{36}$/i;

function safeBack(v: FormDataEntryValue | null) {
  const s = typeof v === "string" ? v : "";
  return s.startsWith("/team") ? s : "/team/requests";
}
function withParam(path: string, key: "ok" | "error", msg: string) {
  const url = new URL(path, "http://x");
  url.searchParams.set(key, msg);
  return url.pathname + url.search;
}

export async function decideRequestAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  const back = safeBack(formData.get("back"));

  if (!UUID.test(id)) redirect(withParam(back, "error", "That request could not be found."));
  if (!isStatus(status) || status === "pending") redirect(withParam(back, "error", "Bad status."));

  const supabase = await createClient();
  const { error } = await supabase.rpc("decide_welfare_request", { p_id: id, p_status: status, p_note: note || null });
  if (error) redirect(withParam(back, "error", error.message));

  revalidatePath("/team");
  revalidatePath("/team/requests");
  revalidatePath("/team/items");
  revalidatePath("/team/movements");
  redirect(withParam(back, "ok", `Request marked ${STATUS_LABEL[status].toLowerCase()}.`));
}
