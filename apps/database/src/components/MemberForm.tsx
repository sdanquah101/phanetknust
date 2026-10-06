import { Field, Input, Select, SubmitButton, Textarea } from "@phanet/ui";
import type { LeaderRow, Member } from "@phanet/supabase/types";
import { GENDERS, REGIONS, RESIDENCE_TYPES, STATUSES, YEARS } from "@/lib/constants";

type Props = {
  action: (formData: FormData) => Promise<void>;
  leaders: LeaderRow[];
  member?: Member | null;
  photoSrc?: string | null;
  submitLabel?: string;
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Shared create / edit form. All members columns except system ones. */
export function MemberForm({ action, leaders, member, photoSrc, submitLabel }: Props) {
  const m = member ?? null;
  const v = (k: keyof Member) => (m?.[k] ?? "") as string;
  return (
    <form action={action} className="flex flex-col gap-6">
      {m && <input type="hidden" name="id" value={m.id} />}

      <section className="card p-6">
        <div className="label-caps-orange mb-4">Personal</div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="First name"><Input name="first_name" defaultValue={v("first_name")} required autoComplete="off" /></Field>
          <Field label="Last name"><Input name="last_name" defaultValue={v("last_name")} required autoComplete="off" /></Field>
          <Field label="Other names"><Input name="other_names" defaultValue={v("other_names")} /></Field>
          <Field label="Gender">
            <Select name="gender" defaultValue={v("gender")}>
              <option value="">—</option>
              {GENDERS.map((g) => <option key={g} value={g}>{cap(g)}</option>)}
            </Select>
          </Field>
          <Field label="Date of birth"><Input name="dob" type="date" defaultValue={v("dob")} /></Field>
          <Field label="Photo" hint={m?.photo_path ? "Choose a file to replace the current photo." : "JPG or PNG, up to 5 MB."}>
            <div className="flex items-center gap-3">
              {photoSrc && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoSrc} alt="" className="w-12 h-12 rounded-full object-cover flex-none" />
              )}
              <input name="photo" type="file" accept="image/*" className="input !py-2.5 text-xs" />
            </div>
          </Field>
        </div>
      </section>

      <section className="card p-6">
        <div className="label-caps-orange mb-4">Contact</div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Phone"><Input name="phone" type="tel" defaultValue={v("phone")} placeholder="024 000 0000" /></Field>
          <Field label="WhatsApp"><Input name="whatsapp" type="tel" defaultValue={v("whatsapp")} /></Field>
          <Field label="Email"><Input name="email" type="email" defaultValue={v("email")} /></Field>
          <Field label="Hometown"><Input name="hometown" defaultValue={v("hometown")} /></Field>
          <Field label="Region">
            <Select name="region" defaultValue={v("region")}>
              <option value="">—</option>
              {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </Select>
          </Field>
        </div>
      </section>

      <section className="card p-6">
        <div className="label-caps-orange mb-4">Campus</div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Programme"><Input name="programme" defaultValue={v("programme")} placeholder="BSc Computer Science" /></Field>
          <Field label="College"><Input name="college" defaultValue={v("college")} placeholder="College of Science" /></Field>
          <Field label="Year of study">
            <Select name="year_of_study" defaultValue={v("year_of_study")}>
              <option value="">—</option>
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </Select>
          </Field>
          <Field label="Hall / hostel"><Input name="hall" defaultValue={v("hall")} placeholder="Unity Hall" /></Field>
          <Field label="Room"><Input name="room" defaultValue={v("room")} /></Field>
          <Field label="Residence type">
            <Select name="residence_type" defaultValue={v("residence_type")}>
              <option value="">—</option>
              {RESIDENCE_TYPES.map((r) => <option key={r} value={r}>{cap(r)}</option>)}
            </Select>
          </Field>
        </div>
      </section>

      <section className="card p-6">
        <div className="label-caps-orange mb-4">Church</div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Membership status">
            <Select name="membership_status" defaultValue={m?.membership_status ?? "active"} required>
              {STATUSES.map((s) => <option key={s} value={s}>{cap(s)}</option>)}
            </Select>
          </Field>
          <Field label="Joined on"><Input name="joined_at" type="date" defaultValue={v("joined_at")} /></Field>
          <Field label="Baptized">
            <Select name="baptized" defaultValue={m?.baptized === true ? "yes" : m?.baptized === false ? "no" : ""}>
              <option value="">Not sure</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </Select>
          </Field>
          <Field label="Department"><Input name="department" defaultValue={v("department")} placeholder="Ushering, Choir…" /></Field>
          <Field label="Leader (shepherd)">
            <Select name="leader_id" defaultValue={v("leader_id")}>
              <option value="">Unassigned</option>
              {leaders.map((l) => <option key={l.id} value={l.id}>{l.full_name}{l.department ? ` · ${l.department}` : ""}</option>)}
            </Select>
          </Field>
        </div>
      </section>

      <section className="card p-6">
        <div className="label-caps-orange mb-4">Emergency contact</div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name"><Input name="emergency_contact_name" defaultValue={v("emergency_contact_name")} /></Field>
          <Field label="Phone"><Input name="emergency_contact_phone" type="tel" defaultValue={v("emergency_contact_phone")} /></Field>
        </div>
        <Field label="Notes" className="mt-4"><Textarea name="notes" defaultValue={v("notes")} placeholder="Anything the team should know." /></Field>
      </section>

      <div className="flex justify-end gap-2">
        <SubmitButton pendingText="Saving…">{submitLabel ?? (m ? "Save changes" : "Add member")}</SubmitButton>
      </div>
    </form>
  );
}
