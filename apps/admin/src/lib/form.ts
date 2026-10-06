/** Small FormData readers used by every server action. */
export const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();
export const opt = (fd: FormData, key: string): string | null => {
  const v = str(fd, key);
  return v ? v : null;
};
export const num = (fd: FormData, key: string, fallback = 0) => {
  const raw = fd.get(key);
  if (raw === null || raw === "") return fallback;
  const v = Number(raw);
  return Number.isFinite(v) ? v : fallback;
};
export const bool = (fd: FormData, key: string) => {
  const v = fd.get(key);
  return v === "on" || v === "true" || v === "1";
};
export const file = (fd: FormData, key: string): File | null => {
  const f = fd.get(key);
  return f instanceof File && f.size > 0 && f.name ? f : null;
};
export const lines = (s: string) => s.split(/\r?\n/).map((t) => t.trim()).filter(Boolean);
export const csv = (s: string) => s.split(",").map((t) => t.trim()).filter(Boolean);
export const isUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
/** datetime-local value → ISO string (or null). */
export const toIso = (s: string | null) => {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};
/** ISO → value for <input type="datetime-local">. */
export const toLocalInput = (iso: string | null | undefined) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
