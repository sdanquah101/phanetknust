import { Field, Input, Select, SubmitButton, Textarea } from "@phanet/ui";
import type { Followup, Member } from "@phanet/supabase/types";
import { FOLLOWUP_KINDS, KIND_LABELS, fullName } from "@/lib/queries";

function localDateTime(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Shared follow-up form. Pass `sheep` (list) to show a picker, or a single `sheepId` to lock it.
 * Pass `existing` to edit. `action` is the server action; `back` is where the action redirects on error.
 */
export function FollowupForm({
  action, sheep, sheepId, existing, back, submitLabel = "Save follow-up", hidden = {},
}: {
  action: (formData: FormData) => Promise<void>;
  sheep?: Member[];
  sheepId?: string;
  existing?: Followup | null;
  back: string;
  submitLabel?: string;
  hidden?: Record<string, string>;
}) {
  const occurred = existing ? new Date(existing.occurred_at) : new Date();
  return (
    <form action={action} className="grid gap-4 md:grid-cols-2">
      <input type="hidden" name="back" value={back} />
      {Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      {sheep ? (
        <Field label="Sheep" className="md:col-span-2">
          <Select name="sheep_id" defaultValue={sheepId ?? existing?.sheep_id ?? ""} required>
            <option value="" disabled>Choose a member…</option>
            {sheep.map((m) => <option key={m.id} value={m.id}>{fullName(m)} · {m.member_code}</option>)}
          </Select>
        </Field>
      ) : (
        <input type="hidden" name="sheep_id" value={sheepId ?? existing?.sheep_id ?? ""} />
      )}
      <Field label="Kind">
        <Select name="kind" defaultValue={existing?.kind ?? "call"} required>
          {FOLLOWUP_KINDS.map((k) => <option key={k} value={k}>{KIND_LABELS[k]}</option>)}
        </Select>
      </Field>
      <Field label="When">
        <Input name="occurred_at" type="datetime-local" defaultValue={localDateTime(occurred)} required />
      </Field>
      <Field label="Summary" className="md:col-span-2">
        <Textarea name="summary" defaultValue={existing?.summary ?? ""} placeholder="How are they doing? What did you talk about?" required className="!min-h-[90px]" />
      </Field>
      <Field label="Needs" hint="Practical or spiritual needs you noticed.">
        <Textarea name="needs" defaultValue={existing?.needs ?? ""} className="!min-h-[80px]" />
      </Field>
      <Field label="Prayer points">
        <Textarea name="prayer_points" defaultValue={existing?.prayer_points ?? ""} className="!min-h-[80px]" />
      </Field>
      <Field label="Next action">
        <Input name="next_action" defaultValue={existing?.next_action ?? ""} placeholder="e.g. Visit after Tuesday lectures" />
      </Field>
      <Field label="Next action date">
        <Input name="next_action_date" type="date" defaultValue={existing?.next_action_date ?? ""} />
      </Field>
      <div className="md:col-span-2 flex justify-end">
        <SubmitButton pendingText="Saving…">{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
