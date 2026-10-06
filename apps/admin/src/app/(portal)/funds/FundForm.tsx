import { Field, Input, SubmitButton, Textarea } from "@phanet/ui";
import type { GivingFund } from "@phanet/supabase/types";
import { saveFund } from "./actions";

export function FundForm({ fund }: { fund?: GivingFund | null }) {
  return (
    <form action={saveFund} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={fund?.id ?? ""} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name"><Input name="name" defaultValue={fund?.name ?? ""} placeholder="Building fund" required /></Field>
        <Field label="Slug" hint="Used as the income category. Leave blank to generate."><Input name="slug" defaultValue={fund?.slug ?? ""} placeholder="building" /></Field>
      </div>
      <Field label="Description"><Textarea name="description" defaultValue={fund?.description ?? ""} className="!min-h-[80px]" /></Field>
      <div className="grid gap-4 sm:grid-cols-3 items-end">
        <Field label="Target (GH₵)" hint="Optional."><Input name="target_amount" type="number" step="0.01" min="0" defaultValue={fund?.target_amount ?? ""} /></Field>
        <Field label="Sort order"><Input name="sort_order" type="number" defaultValue={fund?.sort_order ?? 0} /></Field>
        <label className="option-row flex items-center gap-3 cursor-pointer">
          <input type="checkbox" name="is_active" className="check" defaultChecked={fund?.is_active ?? true} />
          <span className="font-bold text-sm">Open for giving</span>
        </label>
      </div>
      <div><SubmitButton pendingText="Saving…">{fund ? "Save changes" : "Add fund"}</SubmitButton></div>
    </form>
  );
}
