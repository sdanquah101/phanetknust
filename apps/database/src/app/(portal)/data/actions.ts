"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, getSession } from "@phanet/supabase/server";
import { PORTAL_ROLES, canAccess } from "@phanet/supabase/roles";
import type { Member } from "@phanet/supabase/types";
import { CSV_ALIASES, GENDERS, REGIONS, STATUSES, YEARS, type CsvColumn } from "@/lib/constants";
import { normaliseHeader, parseCsv, parseDate } from "@/lib/csv";

const BATCH = 100;
const MAX_ROWS = 5000;

function normaliseGender(v: string): Member["gender"] {
  const s = v.trim().toLowerCase();
  if (s === "m" || s === "male" || s === "man" || s === "boy") return "male";
  if (s === "f" || s === "female" || s === "woman" || s === "girl") return "female";
  return (GENDERS as readonly string[]).includes(s) ? (s as Member["gender"]) : null;
}
function normaliseYear(v: string): string | null {
  const s = v.trim();
  if (!s) return null;
  const digits = s.match(/\d{3}/)?.[0];
  if (digits && (YEARS as readonly string[]).includes(digits)) return digits;
  const lower = s.toLowerCase();
  if (lower.startsWith("post") || lower.startsWith("grad") || lower.startsWith("pg") || lower.startsWith("msc") || lower.startsWith("phd")) return "Postgraduate";
  if (lower.startsWith("alum")) return "Alumni";
  const n = s.match(/^\s*(?:year|level|l)?\s*([1-6])\s*$/i)?.[1];
  return n ? `${n}00` : s;
}
function normaliseStatus(v: string): Member["membership_status"] {
  const s = v.trim().toLowerCase();
  return (STATUSES as readonly string[]).includes(s) ? (s as Member["membership_status"]) : "active";
}
function normaliseRegion(v: string): string | null {
  const s = v.trim();
  if (!s) return null;
  const hit = REGIONS.find((r) => r.toLowerCase() === s.toLowerCase().replace(/\s+region$/, ""));
  return hit ?? s;
}

export async function importMembersAction(formData: FormData) {
  const session = await getSession();
  if (!session || !canAccess(session.roles, PORTAL_ROLES.database)) redirect("/no-access");
  const fail: (m: string) => never = (m) => redirect(`/data?error=${encodeURIComponent(m)}`);

  let text = String(formData.get("csv") ?? "");
  const file = formData.get("file");
  if (file instanceof File && file.size > 0) {
    if (file.size > 8 * 1024 * 1024) fail("The CSV must be 8 MB or smaller.");
    text = await file.text();
  }
  if (!text.trim()) fail("Paste CSV text or choose a file.");

  const rows = parseCsv(text);
  if (rows.length < 2) fail("The CSV needs a header row and at least one member.");
  const header = rows[0].map(normaliseHeader);
  const mapping: (CsvColumn | null)[] = header.map((h) => CSV_ALIASES[h] ?? null);
  if (!mapping.includes("first_name") || !mapping.includes("last_name")) fail("The header must include first_name and last_name (or 'first name' / 'surname').");
  const body = rows.slice(1, 1 + MAX_ROWS);

  const prepared: Partial<Member>[] = [];
  const skipped: string[] = [];
  body.forEach((cells, i) => {
    const line = i + 2;
    const rec: Partial<Record<CsvColumn, string>> = {};
    mapping.forEach((col, idx) => { if (col) rec[col] = (cells[idx] ?? "").trim(); });
    const first_name = rec.first_name ?? "";
    const last_name = rec.last_name ?? "";
    if (!first_name || !last_name) { skipped.push(`Line ${line}: missing first or last name`); return; }
    const email = rec.email || null;
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { skipped.push(`Line ${line}: invalid email “${email}”`); return; }
    const dob = rec.dob ? parseDate(rec.dob) : null;
    if (rec.dob && !dob) { skipped.push(`Line ${line}: unreadable date of birth “${rec.dob}”`); return; }
    const joined_at = rec.joined_at ? parseDate(rec.joined_at) : null;
    if (rec.joined_at && !joined_at) { skipped.push(`Line ${line}: unreadable joined date “${rec.joined_at}”`); return; }
    prepared.push({
      first_name, last_name,
      other_names: rec.other_names || null,
      gender: rec.gender ? normaliseGender(rec.gender) : null,
      dob, email,
      phone: rec.phone || null,
      whatsapp: rec.whatsapp || null,
      programme: rec.programme || null,
      college: rec.college || null,
      year_of_study: rec.year_of_study ? normaliseYear(rec.year_of_study) : null,
      hall: rec.hall || null,
      room: rec.room || null,
      hometown: rec.hometown || null,
      region: rec.region ? normaliseRegion(rec.region) : null,
      membership_status: normaliseStatus(rec.membership_status ?? ""),
      joined_at,
      department: rec.department || null,
      created_by: session.user.id,
    });
  });

  const supabase = await createClient();
  let inserted = 0;
  for (let i = 0; i < prepared.length; i += BATCH) {
    const batch = prepared.slice(i, i + BATCH);
    const { data, error } = await supabase.from("members").insert(batch).select("id");
    if (!error) { inserted += data?.length ?? batch.length; continue; }
    // Batch failed: insert one by one so good rows still land and bad ones are named.
    for (const row of batch) {
      const { error: e1 } = await supabase.from("members").insert(row);
      if (e1) skipped.push(`${row.first_name} ${row.last_name}: ${e1.message}`);
      else inserted++;
    }
  }

  revalidatePath("/members");
  revalidatePath("/");
  const params = new URLSearchParams({ inserted: String(inserted), skipped: String(skipped.length) });
  if (skipped.length) params.set("reasons", skipped.slice(0, 15).join("\n"));
  if (rows.length - 1 > MAX_ROWS) params.set("note", `Only the first ${MAX_ROWS} rows were read.`);
  redirect(`/data?${params.toString()}`);
}
