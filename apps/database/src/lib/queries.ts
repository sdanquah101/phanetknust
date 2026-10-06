import "server-only";
import type { Db } from "@phanet/supabase/server";
import type { Attendance, Event, Followup, LeaderRow, Member, Profile, Program, TransferRequest } from "@phanet/supabase/types";
import { PAGE_SIZE, academicYearStart } from "./constants";

/* ---------- helpers ---------- */
export type Count = { key: string; count: number };
function tally(values: (string | null | undefined)[], fallback = "Unknown"): Count[] {
  const m = new Map<string, number>();
  for (const v of values) {
    const k = (v ?? "").trim() || fallback;
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return [...m.entries()].map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}

export type EventCount = { event_id: string; title: string; starts_at: string; attendees: number };
export type MemberLite = Pick<Member, "id" | "first_name" | "last_name" | "other_names" | "member_code" | "photo_path" | "programme" | "year_of_study" | "hall" | "room" | "phone" | "leader_id" | "membership_status">;
const LITE = "id, first_name, last_name, other_names, member_code, photo_path, programme, year_of_study, hall, room, phone, leader_id, membership_status";

/* ---------- dashboard ---------- */
export async function getDashboard(supabase: Db) {
  const [{ data: rows }, { data: upcoming }, { data: latest }] = await Promise.all([
    supabase.from("members").select("hall, programme, year_of_study, gender, membership_status, joined_at"),
    supabase.from("events").select("*").gte("starts_at", new Date().toISOString()).order("starts_at", { ascending: true }).limit(5),
    supabase.from("event_attendance_counts").select("*").lte("starts_at", new Date().toISOString()).order("starts_at", { ascending: false }).limit(5),
  ]);
  const members = (rows ?? []) as Pick<Member, "hall" | "programme" | "year_of_study" | "gender" | "membership_status" | "joined_at">[];
  const since = academicYearStart().toISOString().slice(0, 10);
  const active = members.filter((m) => m.membership_status === "active");
  return {
    total: members.length,
    active: active.length,
    newThisSemester: members.filter((m) => m.joined_at && m.joined_at >= since).length,
    alumni: members.filter((m) => m.membership_status === "alumni").length,
    byHall: tally(active.map((m) => m.hall), "No hall").slice(0, 8),
    byProgramme: tally(active.map((m) => m.programme), "No programme").slice(0, 8),
    byYear: tally(active.map((m) => m.year_of_study), "Unknown"),
    gender: {
      male: active.filter((m) => m.gender === "male").length,
      female: active.filter((m) => m.gender === "female").length,
      unknown: active.filter((m) => !m.gender).length,
    },
    upcoming: (upcoming ?? []) as Event[],
    latest: (latest ?? []) as EventCount[],
  };
}

/* ---------- members ---------- */
export type MemberFilters = { q?: string; status?: string; hall?: string; year?: string; leader?: string; page?: number };

export async function listMembers(supabase: Db, f: MemberFilters) {
  const page = Math.max(1, f.page ?? 1);
  let query = supabase.from("members").select(LITE, { count: "exact" });
  const q = f.q?.trim();
  if (q) {
    const like = `%${q.replace(/[%,()]/g, " ").trim()}%`;
    query = query.or(`first_name.ilike.${like},last_name.ilike.${like},other_names.ilike.${like},member_code.ilike.${like},phone.ilike.${like}`);
  }
  if (f.status) query = query.eq("membership_status", f.status);
  if (f.hall) query = query.eq("hall", f.hall);
  if (f.year) query = query.eq("year_of_study", f.year);
  if (f.leader === "none") query = query.is("leader_id", null);
  else if (f.leader) query = query.eq("leader_id", f.leader);
  const from = (page - 1) * PAGE_SIZE;
  const { data, count, error } = await query.order("last_name").order("first_name").range(from, from + PAGE_SIZE - 1);
  return { rows: (data ?? []) as MemberLite[], total: count ?? 0, page, pages: Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE)), error: error?.message ?? null };
}

export async function listHalls(supabase: Db): Promise<string[]> {
  const { data } = await supabase.from("members").select("hall").not("hall", "is", null);
  const set = new Set<string>();
  for (const r of (data ?? []) as { hall: string | null }[]) if (r.hall?.trim()) set.add(r.hall.trim());
  return [...set].sort((a, b) => a.localeCompare(b));
}

export async function getMember(supabase: Db, id: string): Promise<Member | null> {
  const { data } = await supabase.from("members").select("*").eq("id", id).maybeSingle();
  return (data as Member | null) ?? null;
}

export async function getMemberLite(supabase: Db, id: string): Promise<MemberLite | null> {
  const { data } = await supabase.from("members").select(LITE).eq("id", id).maybeSingle();
  return (data as MemberLite | null) ?? null;
}

export type AttendanceWithEvent = Attendance & { events: Pick<Event, "id" | "title" | "starts_at"> | null };
export async function memberAttendance(supabase: Db, memberId: string, limit = 20): Promise<AttendanceWithEvent[]> {
  const { data } = await supabase.from("attendance").select("*, events(id, title, starts_at)").eq("member_id", memberId).order("marked_at", { ascending: false }).limit(limit);
  return (data ?? []) as AttendanceWithEvent[];
}

export async function memberFollowupCount(supabase: Db, memberId: string): Promise<number> {
  const { count } = await supabase.from("followups").select("id", { count: "exact", head: true }).eq("sheep_id", memberId);
  return count ?? 0;
}

export async function memberFollowups(supabase: Db, memberId: string, limit = 5): Promise<Followup[]> {
  const { data } = await supabase.from("followups").select("*").eq("sheep_id", memberId).order("occurred_at", { ascending: false }).limit(limit);
  return (data ?? []) as Followup[];
}

/* ---------- leaders ---------- */
export async function listLeaders(supabase: Db): Promise<LeaderRow[]> {
  const { data } = await supabase.rpc("list_leaders");
  return (data ?? []) as LeaderRow[];
}

export async function leaderMap(supabase: Db): Promise<Map<string, LeaderRow>> {
  const leaders = await listLeaders(supabase);
  return new Map(leaders.map((l) => [l.id, l]));
}

export async function sheepCounts(supabase: Db): Promise<Map<string, number>> {
  const { data } = await supabase.from("members").select("leader_id").not("leader_id", "is", null);
  const m = new Map<string, number>();
  for (const r of (data ?? []) as { leader_id: string }[]) m.set(r.leader_id, (m.get(r.leader_id) ?? 0) + 1);
  return m;
}

export async function listSheep(supabase: Db, leaderId: string): Promise<MemberLite[]> {
  const { data } = await supabase.from("members").select(LITE).eq("leader_id", leaderId).order("last_name").order("first_name");
  return (data ?? []) as MemberLite[];
}

/* ---------- events ---------- */
export async function listPrograms(supabase: Db): Promise<Program[]> {
  const { data } = await supabase.from("programs").select("*").eq("is_active", true).order("sort_order");
  return (data ?? []) as Program[];
}

export async function listEvents(supabase: Db, tab: "upcoming" | "past") {
  const now = new Date().toISOString();
  const base = supabase.from("events").select("*");
  const { data } = tab === "upcoming"
    ? await base.gte("starts_at", now).order("starts_at", { ascending: true }).limit(100)
    : await base.lt("starts_at", now).order("starts_at", { ascending: false }).limit(100);
  return (data ?? []) as Event[];
}

export async function attendanceCounts(supabase: Db, eventIds: string[]): Promise<Map<string, number>> {
  const m = new Map<string, number>();
  if (!eventIds.length) return m;
  const { data } = await supabase.from("event_attendance_counts").select("event_id, attendees").in("event_id", eventIds);
  for (const r of (data ?? []) as { event_id: string; attendees: number }[]) m.set(r.event_id, r.attendees);
  return m;
}

export async function getEvent(supabase: Db, id: string): Promise<Event | null> {
  const { data } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
  return (data as Event | null) ?? null;
}

/** Events for the attendance picker: ±14 days, or everything (newest first) when `all`. */
export async function eventsForAttendance(supabase: Db, opts: { all?: boolean; q?: string }) {
  let query = supabase.from("events").select("*");
  if (opts.q?.trim()) query = query.ilike("title", `%${opts.q.trim()}%`);
  if (!opts.all && !opts.q?.trim()) {
    const from = new Date(Date.now() - 14 * 86400000).toISOString();
    const to = new Date(Date.now() + 14 * 86400000).toISOString();
    query = query.gte("starts_at", from).lte("starts_at", to);
  }
  const { data } = await query.order("starts_at", { ascending: false }).limit(opts.all || opts.q ? 100 : 50);
  return (data ?? []) as Event[];
}

export type MarkedRow = {
  id: string; member_id: string; marked_at: string; marked_by: string | null; method: Attendance["method"];
  members: Pick<Member, "first_name" | "last_name" | "other_names" | "member_code"> | null;
  marker_name: string | null;
};
export async function eventAttendance(supabase: Db, eventId: string): Promise<MarkedRow[]> {
  const { data } = await supabase
    .from("attendance")
    .select("id, member_id, marked_at, marked_by, method, members(first_name, last_name, other_names, member_code)")
    .eq("event_id", eventId)
    .order("marked_at", { ascending: false });
  const rows = (data ?? []) as unknown as Omit<MarkedRow, "marker_name">[];
  const ids = Array.from(new Set(rows.map((r) => r.marked_by).filter((x): x is string => Boolean(x))));
  const names = new Map<string, string>();
  if (ids.length) {
    const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", ids);
    for (const p of (profiles ?? []) as Pick<Profile, "id" | "full_name">[]) if (p.full_name) names.set(p.id, p.full_name);
  }
  return rows.map((r) => ({ ...r, marker_name: r.marked_by ? names.get(r.marked_by) ?? null : null }));
}

/* ---------- transfers ---------- */
type NameBits = Pick<Member, "id" | "first_name" | "last_name" | "other_names" | "member_code"> | null;
export type TransferRow = TransferRequest & { sheep: NameBits; from: NameBits; to: NameBits };
const TRANSFER_SELECT = "*, sheep:members!transfer_requests_sheep_id_fkey(id, first_name, last_name, other_names, member_code), from:members!transfer_requests_from_leader_fkey(id, first_name, last_name, other_names, member_code), to:members!transfer_requests_to_leader_fkey(id, first_name, last_name, other_names, member_code)";

export async function listTransfers(supabase: Db) {
  const [{ data: pending }, { data: history }] = await Promise.all([
    supabase.from("transfer_requests").select(TRANSFER_SELECT).eq("status", "pending").order("created_at", { ascending: true }),
    supabase.from("transfer_requests").select(TRANSFER_SELECT).neq("status", "pending").order("decided_at", { ascending: false }).limit(50),
  ]);
  return { pending: (pending ?? []) as TransferRow[], history: (history ?? []) as TransferRow[] };
}

/* ---------- export ---------- */
export async function allMembers(supabase: Db): Promise<Member[]> {
  const out: Member[] = [];
  const step = 1000;
  for (let from = 0; ; from += step) {
    const { data, error } = await supabase.from("members").select("*").order("last_name").order("first_name").range(from, from + step - 1);
    if (error || !data?.length) break;
    out.push(...(data as Member[]));
    if (data.length < step) break;
  }
  return out;
}
