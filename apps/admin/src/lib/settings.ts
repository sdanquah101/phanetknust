export type SettingField = { name: string; label: string; type?: "text" | "textarea" | "url" | "lines"; hint?: string; placeholder?: string };
export type SettingDef = { key: string; title: string; blurb: string; fields: SettingField[] };

/** Editable site_settings keys. One form per key; the value is a JSON object of these fields. */
export const SETTINGS: SettingDef[] = [
  {
    key: "theme",
    title: "Theme of the year",
    blurb: "Shown on the hero, portal badges and certificates.",
    fields: [
      { name: "year", label: "Year", placeholder: "2026/27" },
      { name: "title", label: "Title", placeholder: "Let No Man Despise Thy Youth" },
      { name: "reference", label: "Scripture reference", placeholder: "1 Timothy 4:12" },
      { name: "tagline", label: "Tagline", type: "textarea", placeholder: "Young, planted, unashamed." },
    ],
  },
  {
    key: "verse_of_day",
    title: "Verse of the day",
    blurb: "The verse badge on the home page.",
    fields: [
      { name: "text", label: "Verse text", type: "textarea" },
      { name: "reference", label: "Reference", placeholder: "Psalm 119:9" },
    ],
  },
  {
    key: "live",
    title: "Live stream",
    blurb: "The 'Join live' button. Leave the URL blank to hide it.",
    fields: [
      { name: "label", label: "Button label", placeholder: "Join live" },
      { name: "title", label: "Title", placeholder: "Sunday service · 8:00 AM" },
      { name: "url", label: "Stream URL", type: "url", placeholder: "https://youtube.com/@phanetknust/live" },
    ],
  },
  {
    key: "socials",
    title: "Social links",
    blurb: "Footer and share buttons.",
    fields: [
      { name: "instagram", label: "Instagram", type: "url" },
      { name: "youtube", label: "YouTube", type: "url" },
      { name: "whatsapp", label: "WhatsApp", type: "url", hint: "Group or channel invite link." },
      { name: "tiktok", label: "TikTok", type: "url" },
    ],
  },
  {
    key: "about",
    title: "About PHANET",
    blurb: "Mission, vision and values on the About page.",
    fields: [
      { name: "mission", label: "Mission", type: "textarea" },
      { name: "vision", label: "Vision", type: "textarea" },
      { name: "values", label: "Values", type: "lines", hint: "One value per line." },
    ],
  },
  {
    key: "academic",
    title: "Academic calendar",
    blurb: "Current year and semester, used as defaults for events, budgets and dues.",
    fields: [
      { name: "year", label: "Academic year", placeholder: "2026/2027" },
      { name: "semester", label: "Semester", placeholder: "1" },
    ],
  },
];
