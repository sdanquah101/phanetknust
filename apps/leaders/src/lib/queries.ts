import "server-only";
import { redirect } from "next/navigation";
import { createClient, getSession, type Db, type Session } from "@phanet/supabase/server";
import type { Followup, FollowupShare, LeaderRow, Member, MemberSearchRow, SheepReport } from "@phanet/supabase/types";
import { isoDate, startOfWeek } from "@phanet/supabase/format";

export type LeaderContext = {
  session: Session;
  leaderMemberId: string | null;
  leader: Member | null;
  supabase: Db;
};

/** The signed-in executive: session, their member id (profiles.member_id) and member row. */
export async function getLeaderContext(): Promise<LeaderContext> {
  const supabase = await createClient();
  const session = await getSession();
  if (!session) redirect("/login");
  const leaderMemberId = session.profile?.member_id ?? null;
  let leader: Member | null = null;
  if (leaderMemberId) {
    try {
      const { data } = await supabase.from("members").select("*").eq("id", leaderMemberId).maybeSingle();
      leader = (data as Member | null) ?? null;
    } catch {
      leader = null;
    }
  }
  return { session, leaderMemberId, leader, supabase };
}

export const NOT_LINKED_MESSAGE = "Your account isn't linked to a member record yet. Ask the admin to link it.";

export const FOLLOWUP_KINDS: Followup["kind"][] = ["call", "visit", "text", "prayer", "meeting", "other"];
export const KIND_LABELS: Record<Followup["kind"], string> = { call: "Call", visit: "Visit", text: "Text", prayer: "Prayer", meeting: "Meeting", other: "Other" };

export function fullName(m: Pick<Member, "first_name" | "last_name" | "other_names"> | null | undefined) {
  if (!m) return "—";
  return [m.first_name, m.other_names, m.last_name].filter(Boolean).join(" ");
}

/** "0244123456" → "233244123456" for wa.me links. Returns null when there is no usable number. */
export function whatsappNumber(raw: string | null | undefined) {
  if (!raw) return null;
  let digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = "233" + digits.slice(1);
  else if (digits.length === 9) digits = "233" + digits;
  return digits;
}
export function whatsappLink(m: Pick<Member, "whatsapp" | "phone">) {
  const n = whatsappNumber(m.whatsapp ?? m.phone);
  return n ? `https://wa.me/${n}` : null;
}

export function weekStartIso(d = new Date()) {
  return isoDate(startOfWeek(d));
}

export function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/** All members assigned to this leader, optionally filtered by a search string. */
export async function listMySheep(supabase: Db, leaderMemberId: string, q?: string): Promise<Member[]> {
  let query = supabase.from("members").select("*").eq("leader_id", leaderMemberId).order("last_name").order("first_name");
  const term = q?.trim();
  if (term) {
    const safe = term.replace(/[%_,()]/g, " ").trim();
    if (safe) {
      const like = `%${safe}%`;
      query = query.or(`first_name.ilike.${like},last_name.ilike.${like},other_names.ilike.${like},member_code.ilike.${like},phone.ilike.${like}`);
    }
  }
  const { data } = await query;
  return (data ?? []) as Member[];
}

export async function getMySheep(supabase: Db, leaderMemberId: string, sheepId: string): Promise<Member | null> {
  const { data } = await supabase.from("members").select("*").eq("id", sheepId).eq("leader_id", leaderMemberId).maybeSingle();
  return (data as Member | null) ?? null;
}

export async function listMyFollowups(supabase: Db, leaderMemberId: string, opts: { sheepId?: string; limit?: number } = {}): Promise<Followup[]> {
  let q = supabase.from("followups").select("*").eq("leader_id", leaderMemberId).order("occurred_at", { ascending: false });
  if (opts.sheepId) q = q.eq("sheep_id", opts.sheepId);
  if (opts.limit) q = q.limit(opts.limit);
  const { data } = await q;
  return (data ?? []) as Followup[];
}

export type SharedFollowup = { share: FollowupShare; followup: Followup | null };

/** Follow-ups other leaders shared with me, with the share row. */
export async function listSharedWithMe(supabase: Db, leaderMemberId: string): Promise<SharedFollowup[]> {
  const { data: shares } = await supabase.from("followup_shares").select("*").eq("shared_with", leaderMemberId).order("created_at", { ascending: false });
  const rows = (shares ?? []) as FollowupShare[];
  if (!rows.length) return [];
  const ids = rows.map((s) => s.followup_id);
  const { data: fus } = await supabase.from("followups").select("*").in("id", ids);
  const byId = new Map(((fus ?? []) as Followup[]).map((f) => [f.id, f]));
  return rows.map((share) => ({ share, followup: byId.get(share.followup_id) ?? null }));
}

/** Weekly report rows for a given week start (YYYY-MM-DD). */
export async function listReportsForWeek(supabase: Db, leaderMemberId: string, weekStart: string): Promise<SheepReport[]> {
  const { data } = await supabase.from("sheep_reports").select("*").eq("leader_id", leaderMemberId).eq("week_start", weekStart);
  return (data ?? []) as SheepReport[];
}

export async function listLeaders(supabase: Db): Promise<LeaderRow[]> {
  const { data } = await supabase.rpc("list_leaders");
  return (data ?? []) as LeaderRow[];
}

/** Names for a set of member ids. Only ids RLS lets us see come back (my sheep, me). */
export async function memberNames(supabase: Db, ids: string[]): Promise<Map<string, string>> {
  const uniq = Array.from(new Set(ids.filter(Boolean)));
  const map = new Map<string, string>();
  if (!uniq.length) return map;
  const { data } = await supabase.from("members").select("id, first_name, last_name, other_names").in("id", uniq);
  for (const m of (data ?? []) as Pick<Member, "id" | "first_name" | "last_name" | "other_names">[]) map.set(m.id, fullName(m));
  return map;
}

/**
 * Names for members that are not my sheep (e.g. sheep on follow-ups shared with me).
 * RLS hides other leaders' sheep, so we go through the staff `search_members` RPC.
 */
export async function lookupMemberNames(supabase: Db, ids: string[]): Promise<Map<string, string>> {
  const want = new Set(ids.filter(Boolean));
  const map = new Map<string, string>();
  if (!want.size) return map;
  try {
    const { data } = await supabase.rpc("search_members", { q: "", lim: 2000 });
    for (const r of (data ?? []) as MemberSearchRow[]) if (want.has(r.id)) map.set(r.id, r.full_name);
  } catch {
    /* empty */
  }
  return map;
}

/** Names for leaders (via list_leaders, which is visible to staff). */
export async function leaderNames(supabase: Db): Promise<Map<string, string>> {
  const leaders = await listLeaders(supabase);
  return new Map(leaders.map((l) => [l.id, l.full_name]));
}
