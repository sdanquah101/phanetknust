"use server";
import { revalidatePath } from "next/cache";
import { createClient, getSession } from "@phanet/supabase/server";
import { PORTAL_ROLES, canAccess } from "@phanet/supabase/roles";
import type { MemberSearchRow } from "@phanet/supabase/types";

export type MarkResult = { ok: true; already?: boolean; name?: string } | { ok: false; error: string };

/** Staff member search (rpc search_members). Shared by attendance and leaders tools. */
export async function searchMembers(q: string): Promise<MemberSearchRow[]> {
  const term = q.trim();
  if (term.length < 2) return [];
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("search_members", { q: term, lim: 20 });
  if (error) return [];
  return (data ?? []) as MemberSearchRow[];
}

async function insertMark(eventId: string, memberId: string, name?: string): Promise<MarkResult> {
  const session = await getSession();
  if (!session || !canAccess(session.roles, PORTAL_ROLES.attendance)) return { ok: false, error: "You don't have access to attendance." };
  const method = canAccess(session.roles, ["database", "usher"]) ? "usher" : "leader";
  const supabase = await createClient();
  const { error } = await supabase.from("attendance").insert({ event_id: eventId, member_id: memberId, marked_by: session.user.id, method });
  if (error) {
    if (error.code === "23505") return { ok: true, already: true, name };
    if (error.code === "42501" || /row-level security/i.test(error.message)) return { ok: false, error: "You can only mark members assigned to you." };
    return { ok: false, error: error.message };
  }
  revalidatePath(`/attendance/${eventId}`);
  revalidatePath(`/events/${eventId}`);
  return { ok: true, name };
}

export async function markAttendance(eventId: string, memberId: string): Promise<MarkResult> {
  if (!eventId || !memberId) return { ok: false, error: "Pick a member first." };
  return insertMark(eventId, memberId);
}

/** Exact member_code match (case-insensitive) → mark. */
export async function markByCode(eventId: string, code: string): Promise<MarkResult> {
  const c = code.trim();
  if (!eventId || !c) return { ok: false, error: "Enter a member code." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("search_members", { q: c, lim: 10 });
  if (error) return { ok: false, error: error.message };
  const rows = (data ?? []) as MemberSearchRow[];
  const hit = rows.find((r) => r.member_code?.toLowerCase() === c.toLowerCase()) ?? (rows.length === 1 ? rows[0] : undefined);
  if (!hit) return { ok: false, error: `No member with code “${c}”.` };
  return insertMark(eventId, hit.id, hit.full_name);
}

export async function unmarkAttendance(attendanceId: string, eventId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!attendanceId) return { ok: false, error: "Nothing to remove." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("attendance").delete().eq("id", attendanceId).select("id");
  if (error) return { ok: false, error: error.message };
  if (!data?.length) return { ok: false, error: "Only the person who marked this (or the database team) can remove it." };
  revalidatePath(`/attendance/${eventId}`);
  revalidatePath(`/events/${eventId}`);
  return { ok: true };
}
