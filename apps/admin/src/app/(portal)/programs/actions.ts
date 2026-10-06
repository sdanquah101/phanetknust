"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@phanet/supabase/server";
import { slugify } from "@phanet/supabase/format";
import { done, errMsg, fail } from "@/lib/flash";
import { bool, file, isUuid, num, opt, str } from "@/lib/form";
import { extOf, uploadPublic } from "@/lib/storage";

export async function saveProgram(formData: FormData) {
  const id = str(formData, "id");
  const isNew = !isUuid(id);
  const back = isNew ? "/programs/new" : `/programs/${id}`;
  const name = str(formData, "name");
  if (!name) fail(back, "Give the program a name.");
  const slug = slugify(str(formData, "slug") || name);
  if (!slug) fail(back, "The slug can't be empty.");
  const supabase = await createClient();
  const row: Record<string, unknown> = {
    slug,
    name,
    tagline: opt(formData, "tagline"),
    description: opt(formData, "description"),
    schedule_label: opt(formData, "schedule_label"),
    location: opt(formData, "location"),
    sort_order: Math.round(num(formData, "sort_order", 0)),
    is_active: bool(formData, "is_active"),
  };
  const cover = file(formData, "cover");
  if (cover) {
    try {
      row.cover_url = await uploadPublic(supabase, "site", `programs/${slug}.${extOf(cover)}`, cover);
    } catch (e) {
      fail(back, errMsg(e));
    }
  }
  if (isNew) {
    const { data, error } = await supabase.from("programs").insert(row).select("id").single();
    if (error) fail(back, error.message.includes("duplicate") ? "That slug is already used by another program." : error.message);
    revalidatePath("/programs");
    done(`/programs/${(data as { id: string }).id}`, "Program created.");
  }
  const { error } = await supabase.from("programs").update(row).eq("id", id);
  if (error) fail(back, error.message.includes("duplicate") ? "That slug is already used by another program." : error.message);
  revalidatePath("/programs");
  revalidatePath(back);
  done(back, "Program saved.");
}

export async function deleteProgram(formData: FormData) {
  const id = str(formData, "id");
  if (!isUuid(id)) fail("/programs", "Unknown program.");
  const supabase = await createClient();
  const { error } = await supabase.from("programs").delete().eq("id", id);
  if (error) fail(`/programs/${id}`, error.message);
  revalidatePath("/programs");
  done("/programs", "Program deleted.");
}

export async function toggleProgram(formData: FormData) {
  const id = str(formData, "id");
  const active = bool(formData, "is_active");
  if (!isUuid(id)) fail("/programs", "Unknown program.");
  const supabase = await createClient();
  const { error } = await supabase.from("programs").update({ is_active: active }).eq("id", id);
  if (error) fail("/programs", error.message);
  revalidatePath("/programs");
  done("/programs", active ? "Program is now visible." : "Program hidden from the site.");
}
