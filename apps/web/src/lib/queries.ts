import "server-only";
import { createClient } from "@phanet/supabase/server";
import type { Event, GivingFund, PrayerPublic, Product, Program } from "@phanet/supabase/types";

export type Theme = { year: string; title: string; reference: string; tagline: string };
export type Verse = { text: string; reference: string };
export type Live = { label: string; title: string; url: string };
export type Socials = { instagram?: string; youtube?: string; whatsapp?: string; tiktok?: string };
export type About = { mission: string; vision: string; values: string[] };

const DEFAULTS = {
  theme: { year: "2026/2027", title: "Let No Man Despise Thy Youth", reference: "1 Timothy 4:12", tagline: "Raising impactful intercessors who avail themselves to be conduits of the change they pray for." } as Theme,
  verse_of_day: { text: "Be thou an example of the believers, in word, in conversation, in charity, in spirit, in faith, in purity.", reference: "1 Timothy 4:12 · KJV" } as Verse,
  live: { label: "LIVE · WED 7PM", title: "Midweek Altar", url: "https://youtube.com/@phanetknust" } as Live,
  socials: {} as Socials,
  about: {
    mission: "PHANET KNUST is a campus fellowship of students who pray, serve and grow together at the Kwame Nkrumah University of Science and Technology.",
    vision: "A generation of young people who are examples of the believers in word, conduct, love, faith and purity.",
    values: ["Prayer", "Word", "Service", "Community"],
  } as About,
};

export type Settings = typeof DEFAULTS;

export async function getSettings(): Promise<Settings> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("site_settings").select("key,value");
    const out: Settings = structuredClone(DEFAULTS);
    for (const row of (data ?? []) as { key: string; value: unknown }[]) {
      if (row.key in out) Object.assign(out[row.key as keyof Settings] as object, row.value as object);
    }
    return out;
  } catch {
    return structuredClone(DEFAULTS);
  }
}

export async function getPrograms(): Promise<Program[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("programs").select("*").eq("is_active", true).order("sort_order");
    return (data ?? []) as Program[];
  } catch { return []; }
}

export async function getUpcomingEvents(limit = 6): Promise<Event[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("events").select("*").eq("is_public", true).gte("starts_at", new Date(Date.now() - 3 * 3600_000).toISOString()).order("starts_at").limit(limit);
    return (data ?? []) as Event[];
  } catch { return []; }
}

export async function getFunds(): Promise<GivingFund[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("giving_funds").select("*").eq("is_active", true).order("sort_order");
    return (data ?? []) as GivingFund[];
  } catch { return []; }
}

export async function getProducts(): Promise<Product[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("products").select("*").eq("is_active", true).order("sort_order");
    return (data ?? []) as Product[];
  } catch { return []; }
}

export async function getProduct(slug: string): Promise<Product | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("products").select("*").eq("slug", slug).maybeSingle();
    return (data as Product | null) ?? null;
  } catch { return null; }
}

export async function getPrayerTeaser(): Promise<{ count: number; topics: PrayerPublic[] }> {
  try {
    const supabase = await createClient();
    const [{ data: topics }, { data: stats }] = await Promise.all([
      supabase.from("prayer_wall_public").select("*").order("created_at", { ascending: false }).limit(6),
      supabase.from("prayer_wall_public").select("pray_count"),
    ]);
    const rows = (stats ?? []) as { pray_count: number }[];
    const count = rows.reduce((s, r) => s + (r.pray_count ?? 0), 0) + rows.length;
    return { count, topics: (topics ?? []) as PrayerPublic[] };
  } catch { return { count: 0, topics: [] }; }
}
