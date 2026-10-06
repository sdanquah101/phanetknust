import type { Db } from "@phanet/supabase/server";

export function extOf(file: File) {
  const m = file.name.match(/\.([a-z0-9]+)$/i);
  return m ? m[1].toLowerCase() : "bin";
}

/** Upload to a public bucket (upsert) and return the public URL (cache-busted). */
export async function uploadPublic(supabase: Db, bucket: string, path: string, file: File) {
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true, contentType: file.type || undefined });
  if (error) throw new Error(`Upload failed: ${error.message}`);
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}
