"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getLeaderContext, listMySheep, NOT_LINKED_MESSAGE } from "@/lib/queries";
import { str, withMsg } from "@/lib/followup-input";

/** Upsert one sheep_reports row per sheep for the chosen week. */
export async function saveWeeklyReportAction(formData: FormData) {
  const week = str(formData.get("week_start"));
  const back = week ? `/reports?week=${week}` : "/reports";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(week)) redirect(withMsg("/reports", "error", "That week doesn't look right."));

  const { session, leaderMemberId, supabase } = await getLeaderContext();
  if (!leaderMemberId) redirect(withMsg(back, "error", NOT_LINKED_MESSAGE));

  const sheep = await listMySheep(supabase, leaderMemberId);
  const ids = new Set(sheep.map((s) => s.id));
  const submitted = formData.getAll("sheep_id").map((v) => String(v)).filter((id) => ids.has(id));
  if (!submitted.length) redirect(withMsg(back, "error", "Nothing to save yet."));

  const rows = submitted.map((sheep_id) => {
    const wb = Number(formData.get(`wellbeing_${sheep_id}`));
    const notes = str(formData.get(`notes_${sheep_id}`));
    return {
      leader_id: leaderMemberId,
      sheep_id,
      week_start: week,
      attended: formData.get(`attended_${sheep_id}`) === "on",
      contacted: formData.get(`contacted_${sheep_id}`) === "on",
      wellbeing: wb >= 1 && wb <= 5 ? Math.round(wb) : null,
      notes: notes || null,
      created_by: session.user.id,
    };
  });

  const { error } = await supabase.from("sheep_reports").upsert(rows, { onConflict: "sheep_id,week_start" });
  if (error) redirect(withMsg(back, "error", error.message));

  revalidatePath("/");
  revalidatePath("/sheep");
  revalidatePath("/reports");
  redirect(withMsg(back, "ok", `Saved ${rows.length} ${rows.length === 1 ? "report" : "reports"} for this week.`));
}
