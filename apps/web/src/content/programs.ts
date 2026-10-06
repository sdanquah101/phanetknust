/**
 * PHANET KNUST programs. Used for illustrations and as a fallback when the database has no programs.
 * The database (Admin → Programs) is the source of truth for names and schedules when it has rows;
 * illustrations are matched by slug unless a program has its own cover image.
 */
export type ProgramIcon = "moon" | "people" | "book" | "flame" | "briefcase";
export type ProgramContent = {
  slug: string; name: string; schedule_label: string; tagline: string; description: string;
  illustration: string | null; icon: ProgramIcon; main?: boolean;
};

export const PROGRAMS: ProgramContent[] = [
  {
    slug: "gathering-of-the-adelphos", name: "Gathering of the Adelphos", main: true,
    schedule_label: "Every Saturday · 2:30–5:30pm",
    tagline: "Our main weekly meeting.",
    description: "Adelphos is the Greek word for brother. Every Saturday afternoon we gather as one family to worship, pray and study the Word together.",
    illustration: null, icon: "people",
  },
  {
    slug: "night-of-solemnities", name: "Night of Solemnities",
    schedule_label: "Monthly · All night",
    tagline: "A monthly all-night of prayer with Dr. Godfred Bonnah Nkansah.",
    description: "Once a month we stay up through the night to worship, intercede and hear the Word with our founder, Dr. Godfred Bonnah Nkansah.",
    illustration: "/programs/night-of-solemnities.webp", icon: "moon",
  },
  {
    slug: "academic-excellence-retreat", name: "Academic Excellence Retreat",
    schedule_label: "Once each semester",
    tagline: "Praying over our studies, and learning to study well.",
    description: "A retreat each semester where we pray for our academic work, share study habits that work and encourage one another to excel.",
    illustration: null, icon: "book",
  },
  {
    slug: "prophetic-convocation", name: "Prophetic Convocation",
    schedule_label: "Once each semester",
    tagline: "Worship, the Word and prayer for the season ahead.",
    description: "A gathering each semester for worship, prophetic ministry and prayer over the semester ahead.",
    illustration: null, icon: "flame",
  },
  {
    slug: "business-masterclass", name: "Business Masterclass",
    schedule_label: "Once each year",
    tagline: "Equipping emissaries for the marketplace.",
    description: "A yearly masterclass on entrepreneurship, brand strategy and growing a business, so we can serve God well in the marketplace.",
    illustration: null, icon: "briefcase",
  },
];

export const programContent = (slug: string) => PROGRAMS.find((p) => p.slug === slug);
