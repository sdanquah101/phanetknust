/** Academic period helpers. Semester 1 = Aug 1 – Jan 31, semester 2 = Feb 1 – Jul 31 of the academic year. */

export type Period = { year: string; semester: 1 | 2 };
export const DEFAULT_PERIOD: Period = { year: "2026/27", semester: 1 };

/** "2026/27" → 2026. Falls back to the current calendar year when unparsable. */
export function startYearOf(year: string): number {
  const n = Number(String(year).slice(0, 4));
  return Number.isFinite(n) && n > 1900 ? n : new Date().getFullYear();
}

/** ISO range [from, to) for a semester. `to` is exclusive. */
export function periodRange(year: string, semester: 1 | 2): { from: string; to: string } {
  const y = startYearOf(year);
  if (semester === 1) return { from: new Date(Date.UTC(y, 7, 1)).toISOString(), to: new Date(Date.UTC(y + 1, 1, 1)).toISOString() };
  return { from: new Date(Date.UTC(y + 1, 1, 1)).toISOString(), to: new Date(Date.UTC(y + 1, 7, 1)).toISOString() };
}

/** ISO range [from, to) for the whole academic year (Aug 1 – Jul 31). */
export function yearRange(year: string): { from: string; to: string } {
  const y = startYearOf(year);
  return { from: new Date(Date.UTC(y, 7, 1)).toISOString(), to: new Date(Date.UTC(y + 1, 7, 1)).toISOString() };
}

export function periodLabel(p: Period) {
  return `${p.year} S${p.semester}`;
}

/** Academic years to offer in pickers: two back, current, one ahead. */
export function yearOptions(current: string): string[] {
  const y = startYearOf(current);
  return [y - 2, y - 1, y, y + 1].map((s) => `${s}/${String(s + 1).slice(2)}`);
}
