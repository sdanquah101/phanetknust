"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@phanet/supabase/server";
import { done, fail } from "@/lib/flash";
import { bool, isUuid, str } from "@/lib/form";

const back = (tab: string) => (tab === "testimonies" ? "/prayerwall?tab=testimonies" : "/prayerwall");

export async function setRequestHidden(formData: FormData) {
  const id = str(formData, "id");
  const hidden = bool(formData, "is_hidden");
  if (!isUuid(id)) fail(back("requests"), "Unknown request.");
  const supabase = await createClient();
  const { error } = await supabase.from("prayer_requests").update({ is_hidden: hidden }).eq("id", id);
  if (error) fail(back("requests"), error.message);
  revalidatePath("/prayerwall");
  done(back("requests"), hidden ? "Request hidden from the wall." : "Request is back on the wall.");
}

export async function deleteRequest(formData: FormData) {
  const id = str(formData, "id");
  if (!isUuid(id)) fail(back("requests"), "Unknown request.");
  const supabase = await createClient();
  const { error } = await supabase.from("prayer_requests").delete().eq("id", id);
  if (error) fail(back("requests"), error.message);
  revalidatePath("/prayerwall");
  done(back("requests"), "Request and its testimonies deleted.");
}

export async function setTestimonyHidden(formData: FormData) {
  const id = str(formData, "id");
  const hidden = bool(formData, "is_hidden");
  if (!isUuid(id)) fail(back("testimonies"), "Unknown testimony.");
  const supabase = await createClient();
  const { error } = await supabase.from("testimonies").update({ is_hidden: hidden }).eq("id", id);
  if (error) fail(back("testimonies"), error.message);
  revalidatePath("/prayerwall");
  done(back("testimonies"), hidden ? "Testimony hidden." : "Testimony visible again.");
}

export async function deleteTestimony(formData: FormData) {
  const id = str(formData, "id");
  if (!isUuid(id)) fail(back("testimonies"), "Unknown testimony.");
  const supabase = await createClient();
  const { error } = await supabase.from("testimonies").delete().eq("id", id);
  if (error) fail(back("testimonies"), error.message);
  revalidatePath("/prayerwall");
  done(back("testimonies"), "Testimony deleted.");
}
