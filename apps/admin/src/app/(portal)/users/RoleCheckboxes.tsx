import { ROLE_LABELS, type Role } from "@phanet/supabase/roles";

const PORTAL_GROUP: Role[] = ["leader", "finance", "finance_head", "cec_chair", "pastor", "welfare", "usher", "database"];
const ADMIN_GROUP: Role[] = ["admin"];

/** Grouped role checkboxes (name="roles"). */
export function RoleCheckboxes({ selected = [] as Role[], idPrefix = "r" }: { selected?: Role[]; idPrefix?: string }) {
  const group = (title: string, roles: Role[]) => (
    <div>
      <div className="field-label mb-2">{title}</div>
      <div className="grid gap-2 sm:grid-cols-2">
        {roles.map((r) => (
          <label key={r} htmlFor={`${idPrefix}-${r}`} className="option-row cursor-pointer flex items-center gap-3 text-sm" data-selected={selected.includes(r) ? "true" : undefined}>
            <input id={`${idPrefix}-${r}`} type="checkbox" name="roles" value={r} className="check" defaultChecked={selected.includes(r)} />
            <span>
              <span className="font-bold">{ROLE_LABELS[r]}</span>
              <span className="block text-[11px] text-muted">{r}</span>
            </span>
          </label>
        ))}
      </div>
    </div>
  );
  return (
    <div className="flex flex-col gap-4">
      {group("Portals", PORTAL_GROUP)}
      {group("Admin", ADMIN_GROUP)}
    </div>
  );
}
