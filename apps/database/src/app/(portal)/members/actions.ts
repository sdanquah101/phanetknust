"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient, createClient, getSession, type Db } from "@phanet/supabase/server";
import { PORTAL_ROLES, canAccess } from "@phanet/supabase/roles";
import type { Member } from "@phanet/supabase/types";
import { GENDERS, PHOTO_BUCKET, REGIONS, RESIDENCE_TYPES, STATUSES, YEARS } from "@/lib/constants";

const str = (fd: FormData, k: string) => {
  const v = fd.get(k);
  const s = typeof v === "string" ? v.trim() : "";
  return s ? s : null;
};
const oneOf = <T extends readonly string[]>(v: string | null, list: T): T[number] | null => (v && (list as readonly string[]).includes(v) ? v : null);
const isDate = (v: string | null) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);
const err: (path: string, message: string) => never = (path, message) => redirect(`${path}?error=${encodeURIComponent(message)}`);

async function requireDatabase() {
  const session = await getSession();
  if (!session || !canAccess(session.roles, PORTAL_ROLES.database)) redirect("/no-access");
  return session;
}

/** Validate the shared MemberForm. Returns the row or an error message. */
function readMember(fd: FormData): { row: Partial<Member> } | { error: string } {
  const first_name = str(fd, "first_name");
  const last_name = str(fd, "last_name");
  if (!first_name || !last_name) return { error: "First and last name are required." };
  const email = str(fd, "email");
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: "That email doesn't look right." };
  const status = oneOf(str(fd, "membership_status"), STATUSES) ?? "active";
  const baptized = str(fd, "baptized");
  const row: Partial<Member> = {
    first_name, last_name,
    other_names: str(fd, "other_names"),
    gender: oneOf(str(fd, "gender"), GENDERS),
    dob: isDate(str(fd, "dob")),
    phone: str(fd, "phone"),
    whatsapp: str(fd, "whatsapp"),
    email,
    programme: str(fd, "programme"),
    college: str(fd, "college"),
    year_of_study: oneOf(str(fd, "year_of_study"), YEARS),
    hall: str(fd, "hall"),
    room: str(fd, "room"),
    residence_type: oneOf(str(fd, "residence_type"), RESIDENCE_TYPES),
    hometown: str(fd, "hometown"),
    region: oneOf(str(fd, "region"), REGIONS),
    emergency_contact_name: str(fd, "emergency_contact_name"),
    emergency_contact_phone: str(fd, "emergency_contact_phone"),
    membership_status: status,
    joined_at: isDate(str(fd, "joined_at")),
    baptized: baptized === "yes" ? true : baptized === "no" ? false : null,
    department: str(fd, "department"),
    leader_id: str(fd, "leader_id"),
    notes: str(fd, "notes"),
  };
  return { row };
}

/** Upload a photo to member-photos/<id>/<ts>.<ext>; returns the path or an error. Skips silently when no file. */
async function uploadPhoto(supabase: Db, memberId: string, file: FormDataEntryValue | null): Promise<{ path?: string; error?: string; skipped?: boolean }> {
  if (!(file instanceof File) || file.size === 0) return { skipped: true };
  if (!file.type.startsWith("image/")) return { error: "The photo must be an image file." };
  if (file.size > 5 * 1024 * 1024) return { error: "The photo must be 5 MB or smaller." };
  const extFromName = file.name.split(".").pop()?.toLowerCase();
  const ext = extFromName && /^[a-z0-9]{2,5}$/.test(extFromName) ? extFromName : (file.type.split("/")[1] ?? "jpg").replace("jpeg", "jpg");
  const path = `${memberId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(path, file, { upsert: true, contentType: file.type });
  if (error) return { error: `Photo upload failed: ${error.message}` };
  return { path };
}

export async function createMemberAction(formData: FormData) {
  const session = await requireDatabase();
  const parsed = readMember(formData);
  if ("error" in parsed) err("/members/new", parsed.error);
  const supabase = await createClient();
  const { data, error } = await supabase.from("members").insert({ ...parsed.row, created_by: session.user.id }).select("id").single();
  if (error || !data) err("/members/new", error?.message ?? "Could not save the member.");
  const id = (data as { id: string }).id;
  let note = "Member added.";
  const up = await uploadPhoto(supabase, id, formData.get("photo"));
  if (up.path) await supabase.from("members").update({ photo_path: up.path }).eq("id", id);
  else if (up.error) note = `Member added, but ${up.error.toLowerCase()}`;
  revalidatePath("/members");
  revalidatePath("/");
  redirect(`/members/${id}?ok=${encodeURIComponent(note)}`);
}

export async function updateMemberAction(formData: FormData) {
  await requireDatabase();
  const id = str(formData, "id");
  if (!id) err("/members", "Missing member.");
  const parsed = readMember(formData);
  if ("error" in parsed) err(`/members/${id}/edit`, parsed.error);
  const supabase = await createClient();
  const { data: before } = await supabase.from("members").select("photo_path").eq("id", id).maybeSingle();
  const up = await uploadPhoto(supabase, id, formData.get("photo"));
  if (up.error) err(`/members/${id}/edit`, up.error);
  const row = up.path ? { ...parsed.row, photo_path: up.path } : parsed.row;
  const { error } = await supabase.from("members").update(row).eq("id", id);
  if (error) err(`/members/${id}/edit`, error.message);
  const old = (before as { photo_path: string | null } | null)?.photo_path;
  if (up.path && old && old !== up.path) await supabase.storage.from(PHOTO_BUCKET).remove([old]);
  revalidatePath("/members");
  revalidatePath(`/members/${id}`);
  redirect(`/members/${id}?ok=${encodeURIComponent("Changes saved.")}`);
}

/** "Change photo" on the profile page. */
export async function updatePhotoAction(formData: FormData) {
  await requireDatabase();
  const id = str(formData, "id");
  if (!id) err("/members", "Missing member.");
  const supabase = await createClient();
  const up = await uploadPhoto(supabase, id, formData.get("photo"));
  if (up.skipped) err(`/members/${id}`, "Choose a photo first.");
  if (up.error) err(`/members/${id}`, up.error);
  const { data: before } = await supabase.from("members").select("photo_path").eq("id", id).maybeSingle();
  const { error } = await supabase.from("members").update({ photo_path: up.path }).eq("id", id);
  if (error) err(`/members/${id}`, error.message);
  const old = (before as { photo_path: string | null } | null)?.photo_path;
  if (old && old !== up.path) await supabase.storage.from(PHOTO_BUCKET).remove([old]);
  revalidatePath(`/members/${id}`);
  revalidatePath("/members");
  redirect(`/members/${id}?ok=${encodeURIComponent("Photo updated.")}`);
}

export async function deleteMemberAction(formData: FormData) {
  await requireDatabase();
  const id = str(formData, "id");
  if (!id) err("/members", "Missing member.");
  const supabase = await createClient();
  const { data: before } = await supabase.from("members").select("photo_path").eq("id", id).maybeSingle();
  const { error } = await supabase.from("members").delete().eq("id", id);
  if (error) err(`/members/${id}`, error.message);
  const old = (before as { photo_path: string | null } | null)?.photo_path;
  if (old) await supabase.storage.from(PHOTO_BUCKET).remove([old]);
  revalidatePath("/members");
  revalidatePath("/");
  redirect(`/members?ok=${encodeURIComponent("Member deleted.")}`);
}

/** Admin only: find the auth user by email and set members.user_id. */
export async function linkAccountAction(formData: FormData) {
  const session = await getSession();
  const id = str(formData, "id");
  if (!id) err("/members", "Missing member.");
  if (!session || !session.roles.includes("admin")) err(`/members/${id}`, "Only the admin can link login accounts.");
  const email = str(formData, "email")?.toLowerCase();
  if (!email) err(`/members/${id}`, "Enter the account's email.");

  const supabase = await createClient();
  let userId: string | null = null;
  // Profiles mirror auth.users and staff can read them; try there first.
  const { data: prof } = await supabase.from("profiles").select("id").ilike("email", email).maybeSingle();
  userId = (prof as { id: string } | null)?.id ?? null;
  if (!userId) {
    try {
      const admin = createAdminClient();
      for (let page = 1; page <= 20 && !userId; page++) {
        const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
        if (error) break;
        const hit = data.users.find((u) => u.email?.toLowerCase() === email);
        if (hit) userId = hit.id;
        if (data.users.length < 200) break;
      }
    } catch {
      /* service role key missing: fall through */
    }
  }
  if (!userId) err(`/members/${id}`, `No login account found for ${email}. Ask them to sign in once first.`);

  const { error } = await supabase.from("members").update({ user_id: userId }).eq("id", id);
  if (error) err(`/members/${id}`, error.code === "23505" ? "That account is already linked to another member." : error.message);
  revalidatePath(`/members/${id}`);
  redirect(`/members/${id}?ok=${encodeURIComponent(`Linked to ${email}.`)}`);
}

export async function unlinkAccountAction(formData: FormData) {
  const session = await getSession();
  const id = str(formData, "id");
  if (!id) err("/members", "Missing member.");
  if (!session || !session.roles.includes("admin")) err(`/members/${id}`, "Only the admin can unlink accounts.");
  const supabase = await createClient();
  const { error } = await supabase.from("members").update({ user_id: null }).eq("id", id);
  if (error) err(`/members/${id}`, error.message);
  revalidatePath(`/members/${id}`);
  redirect(`/members/${id}?ok=${encodeURIComponent("Account unlinked.")}`);
}
