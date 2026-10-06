import type { Followup } from "@phanet/supabase/types";
import { FOLLOWUP_KINDS } from "./queries";

export type FollowupInput = {
  sheep_id: string;
  kind: Followup["kind"];
  summary: string;
  needs: string | null;
  prayer_points: string | null;
  next_action: string | null;
  next_action_date: string | null;
  occurred_at: string;
};

export function str(v: FormDataEntryValue | null) {
  return typeof v === "string" ? v.trim() : "";
}
export function orNull(s: string) {
  return s ? s : null;
}

/** Parse + validate a follow-up form. Returns an error message or the input. */
export function parseFollowup(formData: FormData): { error: string } | { input: FollowupInput } {
  const sheep_id = str(formData.get("sheep_id"));
  const kindRaw = str(formData.get("kind")) as Followup["kind"];
  const summary = str(formData.get("summary"));
  const occurredRaw = str(formData.get("occurred_at"));
  const next_action_date = str(formData.get("next_action_date"));
  if (!sheep_id) return { error: "Pick a sheep." };
  if (!FOLLOWUP_KINDS.includes(kindRaw)) return { error: "Pick a valid kind." };
  if (!summary) return { error: "Write a short summary." };
  let occurred_at = new Date().toISOString();
  if (occurredRaw) {
    const d = new Date(occurredRaw);
    if (Number.isNaN(d.getTime())) return { error: "That date doesn't look right." };
    occurred_at = d.toISOString();
  }
  if (next_action_date && Number.isNaN(new Date(next_action_date).getTime())) return { error: "Next action date doesn't look right." };
  return {
    input: {
      sheep_id,
      kind: kindRaw,
      summary,
      needs: orNull(str(formData.get("needs"))),
      prayer_points: orNull(str(formData.get("prayer_points"))),
      next_action: orNull(str(formData.get("next_action"))),
      next_action_date: orNull(next_action_date),
      occurred_at,
    },
  };
}

/** Only allow same-origin relative paths for redirect targets. */
export function safeBack(v: FormDataEntryValue | null, fallback: string) {
  const s = str(v);
  return s.startsWith("/") && !s.startsWith("//") ? s : fallback;
}

export function withMsg(path: string, key: "ok" | "error", msg: string) {
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}${key}=${encodeURIComponent(msg)}`;
}
