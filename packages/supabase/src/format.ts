export const GHS = new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS", currencyDisplay: "narrowSymbol", minimumFractionDigits: 2 });

/** "GH₵ 1,240.00" */
export function money(amount: number | string | null | undefined, opts: { compact?: boolean } = {}) {
  const n = Number(amount ?? 0);
  if (opts.compact) return `GH₵ ${n.toLocaleString("en-GH", { maximumFractionDigits: 0 })}`;
  return `GH₵ ${n.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function fmtDate(d: string | Date | null | undefined, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", opts);
}
export function fmtDateTime(d: string | Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}
export function fmtTime(d: string | Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit" });
}
export function todayLabel() {
  return new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" }).toUpperCase();
}
export function greeting(name?: string | null) {
  const first = name?.trim().split(/\s+/)[0];
  return first ? `Akwaaba, ${first}` : "Akwaaba";
}
export function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
export function startOfWeek(d = new Date()) {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // Monday = 0
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  return date;
}
export function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}
export function pct(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}
