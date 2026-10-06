import "server-only";
import { unstable_cache } from "next/cache";
import { createPublicClient } from "@phanet/supabase/public";
import type { Event, GivingFund, PrayerPublic, Product, Program } from "@phanet/supabase/types";

export type Theme = { year: string; title: string; reference: string; tagline: string };
export type Verse = { text: string; reference: string };
export type Live = { label: string; title: string; url: string };
export type Socials = { instagram?: string; youtube?: string; whatsapp?: string; tiktok?: string };
export type About = { intro: string; idea: string; story: string; mandate: string; vision: string; mission: string; streams: string[]; values: string[]; emissary: string };

const DEFAULTS = {
  theme: { year: "2026/2027", title: "Let No Man Despise Thy Youth", reference: "1 Timothy 4:12", tagline: "We pray about the problems of our generation. Then we make ourselves available to be part of the answer." } as Theme,
  verse_of_day: { text: "Be thou an example of the believers, in word, in conversation, in charity, in spirit, in faith, in purity.", reference: "1 Timothy 4:12 · KJV" } as Verse,
  live: { label: "LIVE · WED 7PM", title: "Midweek Altar", url: "https://youtube.com/@phanetknust" } as Live,
  socials: {} as Socials,
  about: {
      "intro": "PHANET KNUST is a Christian youth movement on the KNUST campus. We pray. And we try to become people God can use to answer the very things we pray about.",
      "idea": "Most of us learn to pray \"Lord, send help.\" At PHANET we also learn to pray \"Lord, if I can be part of the answer, send me.\" So we pray about our campus, our country and our generation. Then we study, train and serve, so that when God wants to send someone into those places, we are ready.",
      "story": "PHANET is short for Phanerosis Prayer Network International. It started with a small group of intercessors praying for revival in Ghana, led by Dr. Godfred Bonnah Nkansah. Today there are chapters across Ghana, the rest of Africa, the United Kingdom and North America. PHANET KNUST is the university chapter at the Kwame Nkrumah University of Science and Technology.",
      "mandate": "Raising and deploying Kingdom emissaries to transform every sphere of society.",
      "vision": "To raise one billion intercessors.",
      "mission": "To reach the unreached, strengthen the weak and support the strong.",
      "streams": [
          "Intercession: We stand in the gap for people, our campus, our nation and those who do not yet know Christ.",
          "Fellowship: We are a family. We carry one another, honour our leaders and make room for newcomers.",
          "The Word: Everything we teach is measured against Scripture and centred on Jesus.",
          "Witnessing: We pray for the lost, and then we go and tell them."
      ],
      "values": [
          "Intercession for the lost: Praying for people who do not know Christ is our heartbeat, not a programme.",
          "Christ-centred teaching: Anchored in Scripture and the person of Jesus. We do not water down the Gospel, and we do not put tradition above the Bible.",
          "Sacrifice for the Kingdom: Night watches, fasting, missions and giving. We offer our time, comfort, money and ambition.",
          "Love for God and the brethren: Costly, practical love that shapes how we treat newcomers, leaders and one another.",
          "Unity of the Body of Christ: We do not exist to gather a tribe. We serve the whole Church, across denominations, generations and places."
      ],
      "emissary": "You do not have to be a pastor in training. Engineers, doctors, teachers, lawyers, business people and parents can all be emissaries. Prayer gives you the burden. Training gives you the ability. God does the sending."
  } as About,
};
export type Settings = typeof DEFAULTS;

// Public content is cached at the edge of the server for 60s and revalidated in the background,
// so navigation is instant and Supabase is hit about once a minute per page, not once per visitor.
const REVALIDATE = 60;

export const getSettings = unstable_cache(async (): Promise<Settings> => {
  const out: Settings = structuredClone(DEFAULTS);
  try {
    const { data } = await createPublicClient().from("site_settings").select("key,value");
    for (const row of (data ?? []) as { key: string; value: unknown }[]) {
      if (row.key in out) Object.assign(out[row.key as keyof Settings] as object, row.value as object);
    }
  } catch { /* defaults */ }
  return out;
}, ["site-settings-v2"], { revalidate: REVALIDATE, tags: ["settings"] });

export const getPrograms = unstable_cache(async (): Promise<Program[]> => {
  try {
    const { data } = await createPublicClient().from("programs").select("*").eq("is_active", true).order("sort_order");
    return (data ?? []) as Program[];
  } catch { return []; }
}, ["programs"], { revalidate: REVALIDATE, tags: ["programs"] });

export const getUpcomingEvents = unstable_cache(async (limit = 6): Promise<Event[]> => {
  try {
    const { data } = await createPublicClient().from("events").select("*").eq("is_public", true).gte("starts_at", new Date(Date.now() - 3 * 3600_000).toISOString()).order("starts_at").limit(limit);
    return (data ?? []) as Event[];
  } catch { return []; }
}, ["events"], { revalidate: REVALIDATE, tags: ["events"] });

export const getFunds = unstable_cache(async (): Promise<GivingFund[]> => {
  try {
    const { data } = await createPublicClient().from("giving_funds").select("*").eq("is_active", true).order("sort_order");
    return (data ?? []) as GivingFund[];
  } catch { return []; }
}, ["funds"], { revalidate: REVALIDATE, tags: ["funds"] });

export const getProducts = unstable_cache(async (): Promise<Product[]> => {
  try {
    const { data } = await createPublicClient().from("products").select("*").eq("is_active", true).order("sort_order");
    return (data ?? []) as Product[];
  } catch { return []; }
}, ["products"], { revalidate: REVALIDATE, tags: ["products"] });

export const getProduct = unstable_cache(async (slug: string): Promise<Product | null> => {
  try {
    const { data } = await createPublicClient().from("products").select("*").eq("slug", slug).maybeSingle();
    return (data as Product | null) ?? null;
  } catch { return null; }
}, ["product"], { revalidate: REVALIDATE, tags: ["products"] });

export const getPrayerTeaser = unstable_cache(async (): Promise<{ count: number; topics: PrayerPublic[] }> => {
  try {
    const supabase = createPublicClient();
    const [{ data: topics }, { data: stats }] = await Promise.all([
      supabase.from("prayer_wall_public").select("*").order("created_at", { ascending: false }).limit(6),
      supabase.from("prayer_wall_public").select("pray_count"),
    ]);
    const rows = (stats ?? []) as { pray_count: number }[];
    const count = rows.reduce((s, r) => s + (r.pray_count ?? 0), 0) + rows.length;
    return { count, topics: (topics ?? []) as PrayerPublic[] };
  } catch { return { count: 0, topics: [] }; }
}, ["prayer-teaser"], { revalidate: REVALIDATE, tags: ["prayerwall"] });
