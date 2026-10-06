import { ROLE_LABELS, type Role } from "@phanet/supabase/roles";
import type { Transaction } from "@phanet/supabase/types";

export type ApproverRole = "finance_head" | "cec_chair" | "pastor";

export const APPROVAL_LEVELS: { role: ApproverRole; title: string; range: string }[] = [
  { role: "finance_head", title: "Finance head", range: "under GH₵2,000" },
  { role: "cec_chair", title: "CEC Chair", range: "GH₵2,000–4,999" },
  { role: "pastor", title: "Ps. Stefan", range: "GH₵5,000+" },
];

export const EXPENSE_STATUSES = ["pending", "approved", "rejected", "paid"] as const;
export const INCOME_STATUSES = ["paid", "counted"] as const;
export const CHANNELS = ["momo_mtn", "telecel_cash", "card", "cash", "bank"] as const;

/** Roles that may record / edit money. Approvers who are not on the team see a read-only ledger. */
export function canWrite(roles: readonly string[]) {
  return roles.some((r) => r === "admin" || r === "finance" || r === "finance_head");
}
export function canDisburse(roles: readonly string[]) {
  return canWrite(roles);
}
export function canManageFunds(roles: readonly string[]) {
  return roles.some((r) => r === "admin" || r === "finance_head");
}
export function isAdmin(roles: readonly string[]) {
  return roles.includes("admin");
}
/** May this user decide an expense that needs `approver`? */
export function canDecide(roles: readonly string[], approver: string | null | undefined) {
  if (roles.includes("admin")) return true;
  return Boolean(approver && roles.includes(approver));
}
export function approverLabel(role: string | null | undefined) {
  return role ? ROLE_LABELS[role as Role] ?? role : "the finance team";
}

const ROLE_RANK: Role[] = ["admin", "pastor", "cec_chair", "finance_head", "finance", "leader", "welfare", "database", "usher"];
/** The most senior role label for the sidebar. */
export function highestRoleLabel(roles: readonly string[]) {
  const r = ROLE_RANK.find((x) => roles.includes(x));
  return r ? ROLE_LABELS[r] : "Member";
}

export function statusLabel(t: Pick<Transaction, "kind" | "status">) {
  if (t.kind === "expense" && t.status === "paid") return "Paid out";
  if (t.status === "counted") return "Counted";
  return t.status.charAt(0).toUpperCase() + t.status.slice(1);
}

/** Who/what to show as the counterparty in a ledger row. */
export function counterparty(t: Pick<Transaction, "kind" | "payer_name" | "payee_name" | "description" | "category">) {
  return (t.kind === "income" ? t.payer_name : t.payee_name) || t.description || t.category;
}

/** `datetime-local` value for a date (local time). */
export function toLocalInput(d: Date | string = new Date()) {
  const date = new Date(d);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Read a trimmed string from FormData; empty → null. */
export function str(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  const s = typeof v === "string" ? v.trim() : "";
  return s ? s : null;
}
