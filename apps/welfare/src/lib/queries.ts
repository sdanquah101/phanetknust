import "server-only";
import { createClient } from "@phanet/supabase/server";
import type { Profile, WelfareItem, WelfareRequest, WelfareStockMovement } from "@phanet/supabase/types";
import type { RequestStatus } from "./status";

export type WelfareStatusRow = {
  code: string;
  requester_name: string;
  status: RequestStatus;
  created_at: string;
  decision_note: string | null;
  items: { name: string; qty: number; unit: string }[];
};

export type RequestItemRow = { request_id: string; item_id: string; qty: number; welfare_items: { name: string; unit: string } | null };
export type MovementRow = WelfareStockMovement & { welfare_items: { name: string; unit: string } | null };

/* ---------- public ---------- */
export async function listActiveItems(): Promise<WelfareItem[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("welfare_items").select("*").eq("is_active", true).order("category").order("name");
    return (data ?? []) as WelfareItem[];
  } catch {
    return [];
  }
}

export async function getRequestStatus(code: string): Promise<WelfareStatusRow | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.rpc("welfare_request_status", { p_code: code });
    const rows = (data ?? []) as WelfareStatusRow[];
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

/* ---------- team ---------- */
export async function listRequests(status: RequestStatus | "all", limit = 200): Promise<WelfareRequest[]> {
  const supabase = await createClient();
  let q = supabase.from("welfare_requests").select("*").order("created_at", { ascending: false }).limit(limit);
  if (status !== "all") q = q.eq("status", status);
  const { data } = await q;
  return (data ?? []) as WelfareRequest[];
}

export async function getRequestItems(requestIds: string[]): Promise<Record<string, RequestItemRow[]>> {
  const out: Record<string, RequestItemRow[]> = {};
  if (requestIds.length === 0) return out;
  const supabase = await createClient();
  const { data } = await supabase.from("welfare_request_items").select("request_id, item_id, qty, welfare_items(name, unit)").in("request_id", requestIds);
  for (const row of (data ?? []) as unknown as RequestItemRow[]) {
    (out[row.request_id] ??= []).push(row);
  }
  return out;
}

export async function listAllItems(): Promise<WelfareItem[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("welfare_items").select("*").order("is_active", { ascending: false }).order("category").order("name");
  return (data ?? []) as WelfareItem[];
}

export async function getItem(id: string): Promise<WelfareItem | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("welfare_items").select("*").eq("id", id).maybeSingle();
  return (data as WelfareItem | null) ?? null;
}

export async function listCategories(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("welfare_items").select("category");
  const set = new Set<string>(["Groceries", "Toiletries", "Provisions", "Stationery"]);
  for (const r of (data ?? []) as { category: string }[]) if (r.category) set.add(r.category);
  return [...set].sort();
}

export async function listMovements(opts: { itemId?: string; limit?: number; since?: Date } = {}): Promise<MovementRow[]> {
  const supabase = await createClient();
  let q = supabase.from("welfare_stock_movements").select("*, welfare_items(name, unit)").order("created_at", { ascending: false }).limit(opts.limit ?? 200);
  if (opts.itemId) q = q.eq("item_id", opts.itemId);
  if (opts.since) q = q.gte("created_at", opts.since.toISOString());
  const { data } = await q;
  return (data ?? []) as unknown as MovementRow[];
}

export async function profileNames(userIds: (string | null)[]): Promise<Record<string, string>> {
  const ids = [...new Set(userIds.filter((x): x is string => Boolean(x)))];
  const out: Record<string, string> = {};
  if (ids.length === 0) return out;
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("id, full_name, email").in("id", ids);
  for (const p of (data ?? []) as Pick<Profile, "id" | "full_name" | "email">[]) out[p.id] = p.full_name ?? p.email ?? "Team";
  return out;
}

export async function countRequests(status: RequestStatus): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase.from("welfare_requests").select("id", { count: "exact", head: true }).eq("status", status);
  return count ?? 0;
}
