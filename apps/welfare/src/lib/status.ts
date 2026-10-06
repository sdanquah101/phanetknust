import type { WelfareRequest } from "@phanet/supabase/types";

export type RequestStatus = WelfareRequest["status"];
export const PIPELINE: RequestStatus[] = ["pending", "approved", "ready", "collected"];
export const STATUS_LABEL: Record<RequestStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  ready: "Ready for pickup",
  collected: "Collected",
  declined: "Declined",
};
export const STATUS_HELP: Record<RequestStatus, string> = {
  pending: "The welfare team has your request and will look at it soon.",
  approved: "Approved! We're packing your items.",
  ready: "Your pack is ready. Collect it from the welfare desk after Midweek Altar.",
  collected: "Collected. We're glad we could help.",
  declined: "We couldn't fulfil this one. Read the note below or speak to the welfare team.",
};
export function isStatus(s: string | null | undefined): s is RequestStatus {
  return s === "pending" || s === "approved" || s === "ready" || s === "collected" || s === "declined";
}

/** Ghana phone → wa.me link. "024 123 4567" → 233241234567 */
export function whatsappLink(phone: string) {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = "233" + digits.slice(1);
  return `https://wa.me/${digits}`;
}
