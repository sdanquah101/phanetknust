import { NextResponse } from "next/server";
import { createClient, getSession } from "@phanet/supabase/server";
import { PORTAL_ROLES, canAccess } from "@phanet/supabase/roles";
import { allMembers } from "@/lib/queries";
import { toCsv } from "@/lib/csv";

export const dynamic = "force-dynamic";

const COLUMNS = [
  "id", "member_code", "first_name", "last_name", "other_names", "gender", "dob", "phone", "whatsapp", "email", "photo_path",
  "programme", "college", "year_of_study", "hall", "room", "residence_type", "hometown", "region",
  "emergency_contact_name", "emergency_contact_phone", "membership_status", "joined_at", "baptized", "department",
  "leader_id", "user_id", "notes", "created_by", "created_at", "updated_at",
];

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  if (!canAccess(session.roles, PORTAL_ROLES.database)) return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  const supabase = await createClient();
  const members = await allMembers(supabase);
  const csv = toCsv(COLUMNS, members as unknown as Record<string, unknown>[]);
  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="phanet-members-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
