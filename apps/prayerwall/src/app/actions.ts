"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@phanet/supabase/server";
import { isCategory } from "@/lib/categories";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Adds an anonymous request via rpc submit_prayer_request and lands on /added/[code]. */
export async function submitRequestAction(formData: FormData) {
  const topic = String(formData.get("topic") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const category = String(formData.get("category") ?? "General").trim() || "General";

  let error: string | null = null;
  if (topic.length < 3) error = "Give your request a short topic (at least 3 characters).";
  else if (topic.length > 120) error = "Keep the topic under 120 characters.";
  else if (body.length > 1500) error = "Keep the details under 1,500 characters.";
  else if (!isCategory(category)) error = "Pick a category from the list.";
  if (error) redirect(`/?error=${encodeURIComponent(error)}#add`);

  let code: string | null = null;
  try {
    const supabase = await createClient();
    const { data, error: rpcError } = await supabase.rpc("submit_prayer_request", {
      p_topic: topic,
      p_body: body || null,
      p_category: category,
    });
    if (rpcError) throw rpcError;
    code = typeof data === "string" && data.trim() ? data.trim().toUpperCase() : null;
  } catch (e) {
    console.error("submit_prayer_request failed", e);
  }
  if (!code) redirect(`/?error=${encodeURIComponent("We couldn't add your request just now. Please try again.")}#add`);

  revalidatePath("/");
  redirect(`/added/${encodeURIComponent(code)}`);
}

/** Increments pray_count via rpc pray_for and returns the new count (0 when nothing changed). */
export async function prayAction(id: string): Promise<number> {
  if (typeof id !== "string" || !UUID_RE.test(id)) return 0;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("pray_for", { p_id: id });
    if (error) return 0;
    return Number(data ?? 0) || 0;
  } catch {
    return 0;
  }
}
