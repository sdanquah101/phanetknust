/** Public URLs of the other PHANET apps (overridable via NEXT_PUBLIC_*_URL). */
const env = (k: string, fallback: string) => {
  const v = process.env[k];
  return v && v.trim() ? v.trim().replace(/\/$/, "") : fallback;
};

export const LINKS = {
  site: env("NEXT_PUBLIC_SITE_URL", "https://phaneteers.com"),
  academy: env("NEXT_PUBLIC_ACADEMY_URL", "https://academy.phaneteers.com"),
  leaders: env("NEXT_PUBLIC_LEADERS_URL", "https://leaders.phaneteers.com"),
  finance: env("NEXT_PUBLIC_FINANCE_URL", "https://finance.phaneteers.com"),
  welfare: env("NEXT_PUBLIC_WELFARE_URL", "https://welfare.phaneteers.com"),
  database: env("NEXT_PUBLIC_DATABASE_URL", "https://database.phaneteers.com"),
  prayerwall: env("NEXT_PUBLIC_PRAYERWALL_URL", "https://prayerwall.phaneteers.com"),
  admin: env("NEXT_PUBLIC_ADMIN_URL", "https://admin.phaneteers.com"),
} as const;

export const PORTAL_LINKS: { key: keyof typeof LINKS; label: string; blurb: string }[] = [
  { key: "site", label: "Main site", blurb: "phaneteers.com · programs, give, shop" },
  { key: "academy", label: "Academy", blurb: "Courses, quizzes, certificates" },
  { key: "leaders", label: "Leaders' portal", blurb: "Shepherding & follow-ups" },
  { key: "finance", label: "Finance", blurb: "Inflows, budgets, approvals" },
  { key: "welfare", label: "Welfare", blurb: "Stock & member requests" },
  { key: "database", label: "Database", blurb: "Members & attendance" },
  { key: "prayerwall", label: "Prayer wall", blurb: "Anonymous requests" },
];
