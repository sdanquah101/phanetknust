import type { Db } from "@phanet/supabase/server";
import { PHOTO_BUCKET } from "./constants";

/** Signed URL for a private member photo (1 hour). Null when missing or on any error. */
export async function photoUrl(supabase: Db, path: string | null | undefined, expires = 3600): Promise<string | null> {
  if (!path) return null;
  try {
    const { data, error } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrl(path, expires);
    if (error) return null;
    return data?.signedUrl ?? null;
  } catch {
    return null;
  }
}

/** Signed URLs for many photos at once → Map<path, url>. */
export async function photoUrls(supabase: Db, paths: (string | null | undefined)[], expires = 3600): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const list = Array.from(new Set(paths.filter((p): p is string => Boolean(p))));
  if (!list.length) return map;
  try {
    const { data, error } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrls(list, expires);
    if (error || !data) return map;
    for (const d of data) if (d.path && d.signedUrl) map.set(d.path, d.signedUrl);
  } catch {
    /* storage unreachable: fall back to initials */
  }
  return map;
}
