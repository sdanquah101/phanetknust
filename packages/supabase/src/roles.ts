export const ROLES = [
  "admin",
  "leader",
  "finance",
  "finance_head",
  "cec_chair",
  "pastor",
  "welfare",
  "usher",
  "database",
] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrator",
  leader: "Leader / Executive",
  finance: "Finance team",
  finance_head: "Finance head",
  cec_chair: "CEC Chair",
  pastor: "Ps. Stefan (final approver)",
  welfare: "Welfare team",
  usher: "Usher (attendance)",
  database: "Database access",
};

/** Which roles may enter each portal. Admin is always allowed. */
export const PORTAL_ROLES: Record<"leaders" | "finance" | "welfare" | "database" | "admin" | "attendance", Role[]> = {
  leaders: ["leader"],
  finance: ["finance", "finance_head", "cec_chair", "pastor"],
  welfare: ["welfare"],
  database: ["database"],
  attendance: ["database", "usher", "leader"],
  admin: [],
};

export const FINANCE_APPROVER_ROLES: Role[] = ["finance_head", "cec_chair", "pastor"];

/** Expense approval ladder in GH₵. */
export function requiredApproverRole(amount: number): Extract<Role, "finance_head" | "cec_chair" | "pastor"> {
  if (amount < 2000) return "finance_head";
  if (amount < 5000) return "cec_chair";
  return "pastor";
}

export function canAccess(roles: readonly string[], allowed: readonly Role[]) {
  if (roles.includes("admin")) return true;
  return allowed.some((r) => roles.includes(r));
}
