"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@phanet/supabase/server";
import { ROLES, type Role } from "@phanet/supabase/roles";
import type { MemberSearchRow } from "@phanet/supabase/types";
import { adminClient, NO_SERVICE_ROLE } from "@/lib/admin";
import { done, errMsg, fail, withFlash } from "@/lib/flash";
import { isUuid, str } from "@/lib/form";
import { LINKS } from "@/lib/links";

const isRole = (r: string): r is Role => (ROLES as readonly string[]).includes(r);
const pickRoles = (fd: FormData) => Array.from(new Set(fd.getAll("roles").map(String).filter(isRole)));

async function grantRoles(userId: string, roles: Role[]) {
  if (!roles.length) return;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from("user_roles").upsert(
    roles.map((role) => ({ user_id: userId, role, granted_by: user?.id ?? null })),
    { onConflict: "user_id,role" },
  );
  if (error) throw new Error(error.message);
}

/** Invite by email (Supabase sends the invite link). */
export async function inviteUser(formData: FormData) {
  const email = str(formData, "email").toLowerCase();
  const full_name = str(formData, "full_name");
  const roles = pickRoles(formData);
  if (!email || !email.includes("@")) fail("/users", "Enter a valid email address.");
  if (!full_name) fail("/users", "Enter the person's full name.");
  const admin = adminClient();
  if (!admin) fail("/users", NO_SERVICE_ROLE);
  let newId = "";
  try {
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, { data: { full_name }, redirectTo: `${LINKS.admin}/auth/callback?next=${encodeURIComponent("/account/password")}` });
    if (error) throw new Error(error.message);
    newId = data.user.id;
    await grantRoles(newId, roles);
  } catch (e) {
    fail("/users", errMsg(e));
  }
  revalidatePath("/users");
  redirect(withFlash(`/users/${newId}`, { ok: `Invitation sent to ${email}.` }));
}

/** Create a confirmed account with a password (no email sent). */
export async function createUserWithPassword(formData: FormData) {
  const email = str(formData, "email").toLowerCase();
  const full_name = str(formData, "full_name");
  const password = String(formData.get("password") ?? "");
  const roles = pickRoles(formData);
  if (!email || !email.includes("@")) fail("/users", "Enter a valid email address.");
  if (!full_name) fail("/users", "Enter the person's full name.");
  if (password.length < 8) fail("/users", "Set a password of at least 8 characters to create the account directly.");
  const admin = adminClient();
  if (!admin) fail("/users", NO_SERVICE_ROLE);
  let newId = "";
  try {
    const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name } });
    if (error) throw new Error(error.message);
    newId = data.user.id;
    await grantRoles(newId, roles);
  } catch (e) {
    fail("/users", errMsg(e));
  }
  revalidatePath("/users");
  redirect(withFlash(`/users/${newId}`, { ok: `Account created for ${email}. Share the password with them securely.` }));
}

/** Diff-sync user_roles with the submitted checkboxes. */
export async function syncRoles(formData: FormData) {
  const userId = str(formData, "user_id");
  const wanted = pickRoles(formData);
  const back = `/users/${userId}`;
  if (!isUuid(userId)) fail("/users", "Unknown user.");
  const supabase = await createClient();
  const { data: { user: me } } = await supabase.auth.getUser();
  if (me?.id === userId && !wanted.includes("admin")) fail(back, "You can't remove your own admin role.");
  const { data: current, error: readErr } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  if (readErr) fail(back, readErr.message);
  const have = ((current ?? []) as { role: Role }[]).map((r) => r.role);
  const toAdd = wanted.filter((r) => !have.includes(r));
  const toRemove = have.filter((r) => !wanted.includes(r));
  if (toAdd.length) {
    const { error } = await supabase.from("user_roles").insert(toAdd.map((role) => ({ user_id: userId, role, granted_by: me?.id ?? null })));
    if (error) fail(back, error.message);
  }
  if (toRemove.length) {
    const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).in("role", toRemove);
    if (error) fail(back, error.message);
  }
  revalidatePath(back);
  revalidatePath("/users");
  done(back, toAdd.length || toRemove.length ? "Roles updated." : "No changes to roles.");
}

export async function searchMembersAction(q: string): Promise<MemberSearchRow[]> {
  const term = q.trim();
  if (term.length < 2) return [];
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("search_members", { q: term, lim: 10 });
  if (error) return [];
  return (data ?? []) as MemberSearchRow[];
}

export async function linkMember(formData: FormData) {
  const userId = str(formData, "user_id");
  const memberId = str(formData, "member_id");
  const back = `/users/${userId}`;
  if (!isUuid(userId) || !isUuid(memberId)) fail(back, "Pick a member to link.");
  const supabase = await createClient();
  // one account ↔ one member: clear any other member pointing at this user
  const { error: clearErr } = await supabase.from("members").update({ user_id: null }).eq("user_id", userId).neq("id", memberId);
  if (clearErr) fail(back, clearErr.message);
  const { error } = await supabase.from("members").update({ user_id: userId }).eq("id", memberId);
  if (error) fail(back, error.message);
  const { error: pErr } = await supabase.from("profiles").update({ member_id: memberId }).eq("id", userId);
  if (pErr) fail(back, pErr.message);
  revalidatePath(back);
  revalidatePath("/users");
  done(back, "Member record linked.");
}

export async function unlinkMember(formData: FormData) {
  const userId = str(formData, "user_id");
  const memberId = str(formData, "member_id");
  const back = `/users/${userId}`;
  if (!isUuid(userId)) fail("/users", "Unknown user.");
  const supabase = await createClient();
  if (isUuid(memberId)) {
    const { error } = await supabase.from("members").update({ user_id: null }).eq("id", memberId);
    if (error) fail(back, error.message);
  }
  const { error: pErr } = await supabase.from("profiles").update({ member_id: null }).eq("id", userId);
  if (pErr) fail(back, pErr.message);
  revalidatePath(back);
  revalidatePath("/users");
  done(back, "Member record unlinked.");
}

export async function sendPasswordReset(formData: FormData) {
  const userId = str(formData, "user_id");
  const email = str(formData, "email").toLowerCase();
  const back = `/users/${userId}`;
  if (!email) fail(back, "This account has no email address.");
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${LINKS.admin}/auth/callback?next=${encodeURIComponent("/account/password")}` });
  if (error) fail(back, error.message);
  done(back, `Password reset email sent to ${email}.`);
}

export async function deleteUser(formData: FormData) {
  const userId = str(formData, "user_id");
  const back = `/users/${userId}`;
  if (!isUuid(userId)) fail("/users", "Unknown user.");
  const supabase = await createClient();
  const { data: { user: me } } = await supabase.auth.getUser();
  if (me?.id === userId) fail(back, "You can't delete your own account while signed in.");
  const admin = adminClient();
  if (!admin) fail(back, NO_SERVICE_ROLE);
  try {
    await supabase.from("members").update({ user_id: null }).eq("user_id", userId);
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) throw new Error(error.message);
  } catch (e) {
    fail(back, errMsg(e));
  }
  revalidatePath("/users");
  done("/users", "Account deleted.");
}
