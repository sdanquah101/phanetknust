/**
 * PHANET KNUST leadership, shown in the "Leadership" drop-down on the About page.
 * Photos live in /public/leaders and are numbered to match the contact sheet.
 * Fill in `name` and `role`; leave either empty and it simply isn't shown.
 * Reorder the list to change the order on the page.
 */
export type Leader = { photo: string; name: string; role: string };

export const LEADERS: Leader[] = Array.from({ length: 18 }, (_, i) => ({
  photo: `/leaders/leader-${String(i + 1).padStart(2, "0")}.webp`,
  name: "",
  role: "",
}));
