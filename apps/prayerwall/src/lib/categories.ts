export const CATEGORIES = [
  "General",
  "Academics",
  "Health",
  "Family",
  "Finances",
  "Campus",
  "Nation",
  "Ministry",
  "Relationships",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export function isCategory(value: unknown): value is Category {
  return typeof value === "string" && (CATEGORIES as readonly string[]).includes(value);
}
