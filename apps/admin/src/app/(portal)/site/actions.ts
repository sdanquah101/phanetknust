"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@phanet/supabase/server";
import { done, fail } from "@/lib/flash";
import { lines, str } from "@/lib/form";
import { SETTINGS } from "@/lib/settings";

export async function saveSetting(formData: FormData) {
  const key = str(formData, "key");
  const def = SETTINGS.find((s) => s.key === key);
  if (!def) fail("/site", "Unknown setting.");
  const value: Record<string, unknown> = {};
  for (const f of def.fields) {
    const raw = str(formData, f.name);
    value[f.name] = f.type === "lines" ? lines(raw) : raw;
  }
  const supabase = await createClient();
  const { error } = await supabase.from("site_settings").upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) fail("/site", error.message);
  revalidatePath("/site");
  done(`/site#${key}`, `${def.title} saved.`);
}
