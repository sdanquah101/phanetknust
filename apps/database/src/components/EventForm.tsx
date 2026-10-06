import { Field, Input, Select, SubmitButton, Textarea } from "@phanet/ui";
import type { Event, Program } from "@phanet/supabase/types";
import { academicYearLabel } from "@/lib/constants";

/** ISO → value for <input type="datetime-local"> (Africa/Accra = UTC). */
function local(v: string | null | undefined) {
  if (!v) return "";
  const d = new Date(v);
  if (isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}T${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`;
}

export function EventForm({ action, programs, event }: { action: (fd: FormData) => Promise<void>; programs: Program[]; event?: Event | null }) {
  const e = event ?? null;
  return (
    <form action={action} className="card p-6 flex flex-col gap-5">
      {e && <input type="hidden" name="id" value={e.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Title" className="sm:col-span-2"><Input name="title" defaultValue={e?.title ?? ""} required placeholder="Sunday Service" /></Field>
        <Field label="Programme">
          <Select name="program_id" defaultValue={e?.program_id ?? ""}>
            <option value="">— None —</option>
            {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
        </Field>
        <Field label="Location"><Input name="location" defaultValue={e?.location ?? ""} placeholder="Great Hall" /></Field>
        <Field label="Starts" hint="Ghana time."><Input name="starts_at" type="datetime-local" defaultValue={local(e?.starts_at)} required /></Field>
        <Field label="Ends"><Input name="ends_at" type="datetime-local" defaultValue={local(e?.ends_at)} /></Field>
        <Field label="Academic year"><Input name="academic_year" defaultValue={e?.academic_year ?? academicYearLabel()} placeholder="2026/27" /></Field>
        <Field label="Semester">
          <Select name="semester" defaultValue={e?.semester ? String(e.semester) : ""}>
            <option value="">—</option>
            <option value="1">Semester 1</option>
            <option value="2">Semester 2</option>
          </Select>
        </Field>
        <Field label="Description" className="sm:col-span-2"><Textarea name="description" defaultValue={e?.description ?? ""} placeholder="What's happening and who it's for." /></Field>
      </div>
      <label className="option-row cursor-pointer">
        <input type="checkbox" name="is_public" className="check" defaultChecked={e ? e.is_public : true} />
        <span>Show on the public website</span>
      </label>
      <div className="flex justify-end">
        <SubmitButton pendingText="Saving…">{e ? "Save event" : "Create event"}</SubmitButton>
      </div>
    </form>
  );
}
