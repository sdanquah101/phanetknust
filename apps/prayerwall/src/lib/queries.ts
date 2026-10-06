import { createClient } from "@phanet/supabase/server";
import type { PrayerPublic, TestimonyPublic } from "@phanet/supabase/types";
import type { Category } from "./categories";

export const PAGE_SIZE = 60;

export type Verse = { text: string; reference: string };
export const FALLBACK_VERSE: Verse = {
  text: "Let no man despise thy youth; but be thou an example of the believers, in word, in conversation, in charity, in spirit, in faith, in purity.",
  reference: "1 Timothy 4:12 · KJV",
};

export type Socials = { instagram?: string; youtube?: string; whatsapp?: string; tiktok?: string };

export type PrayerLookup = {
  id: string;
  topic: string;
  body: string | null;
  category: string;
  status: "open" | "answered";
  pray_count: number;
  created_at: string;
  testimonies: { id: string; body: string; created_at: string }[];
};

function pageRange(page: number) {
  const p = Math.max(1, Math.floor(page) || 1);
  const from = (p - 1) * PAGE_SIZE;
  return { from, to: from + PAGE_SIZE - 1 };
}

/** Verse of the day from site_settings, with the theme verse as fallback. */
export async function getVerse(): Promise<Verse> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("site_settings").select("value").eq("key", "verse_of_day").maybeSingle();
    const v = (data?.value ?? null) as Partial<Verse> | null;
    if (v && typeof v.text === "string" && v.text.trim()) {
      return { text: v.text.trim(), reference: typeof v.reference === "string" && v.reference.trim() ? v.reference.trim() : FALLBACK_VERSE.reference };
    }
  } catch {
    /* render the fallback */
  }
  return FALLBACK_VERSE;
}

export async function getSocials(): Promise<Socials> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("site_settings").select("value").eq("key", "socials").maybeSingle();
    const v = (data?.value ?? null) as Record<string, unknown> | null;
    if (!v) return {};
    const pick = (k: keyof Socials) => (typeof v[k] === "string" && (v[k] as string).startsWith("http") ? (v[k] as string) : undefined);
    return { instagram: pick("instagram"), youtube: pick("youtube"), whatsapp: pick("whatsapp"), tiktok: pick("tiktok") };
  } catch {
    return {};
  }
}

/** sum(pray_count) + count(requests) over the public wall. */
export async function getPrayingCount(): Promise<number> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("prayer_wall_public").select("pray_count");
    const rows = (data ?? []) as { pray_count: number }[];
    return rows.reduce((sum, r) => sum + (Number(r.pray_count) || 0), 0) + rows.length;
  } catch {
    return 0;
  }
}

export async function getWall(opts: { category?: Category; page?: number } = {}): Promise<{ items: PrayerPublic[]; total: number }> {
  try {
    const supabase = await createClient();
    const { from, to } = pageRange(opts.page ?? 1);
    let q = supabase.from("prayer_wall_public").select("*", { count: "exact" }).order("created_at", { ascending: false }).range(from, to);
    if (opts.category) q = q.eq("category", opts.category);
    const { data, count } = await q;
    return { items: (data ?? []) as PrayerPublic[], total: count ?? 0 };
  } catch {
    return { items: [], total: 0 };
  }
}

export async function getTestimonies(opts: { page?: number } = {}): Promise<{ items: TestimonyPublic[]; total: number }> {
  try {
    const supabase = await createClient();
    const { from, to } = pageRange(opts.page ?? 1);
    const { data, count } = await supabase
      .from("testimonies_public")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);
    return { items: (data ?? []) as TestimonyPublic[], total: count ?? 0 };
  } catch {
    return { items: [], total: 0 };
  }
}

export const CODE_RE = /^PW-[A-Z0-9]{6}$/;

export function normalizeCode(raw: string | null | undefined): string {
  return (raw ?? "").trim().toUpperCase().replace(/\s+/g, "");
}

/** Looks a request up by its PW- code (the code itself is never returned to the page beyond what the member typed). */
export async function lookupByCode(code: string): Promise<PrayerLookup | null> {
  const clean = normalizeCode(code);
  if (!clean) return null;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("lookup_prayer_by_code", { p_code: clean });
    if (error) return null;
    const rows = (Array.isArray(data) ? data : data ? [data] : []) as Array<Omit<PrayerLookup, "testimonies"> & { testimonies: unknown }>;
    const row = rows[0];
    if (!row) return null;
    const testimonies = Array.isArray(row.testimonies) ? (row.testimonies as PrayerLookup["testimonies"]) : [];
    return { ...row, testimonies };
  } catch {
    return null;
  }
}
