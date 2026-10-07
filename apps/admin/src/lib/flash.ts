import { redirect } from "next/navigation";

/** Append ?ok= / ?error= to a path for the <Flash> toast. */
export function withFlash(path: string, f: { ok?: string; error?: string }) {
  const u = new URLSearchParams();
  if (f.ok) u.set("ok", f.ok);
  if (f.error) u.set("error", f.error);
  const q = u.toString();
  if (!q) return path;
  // Keep any #section at the very end, or the browser treats the query as part of the hash.
  const [base, hash] = path.split("#", 2);
  return `${base}${base.includes("?") ? "&" : "?"}${q}${hash ? `#${hash}` : ""}`;
}
export function fail(path: string, message: string): never {
  redirect(withFlash(path, { error: message }));
}
export function done(path: string, message: string): never {
  redirect(withFlash(path, { ok: message }));
}
export const errMsg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong.");
