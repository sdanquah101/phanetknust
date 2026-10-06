import { Field, Input, Select, SubmitButton, Textarea } from "@phanet/ui";
import type { Resource } from "@phanet/supabase/types";
import { saveResource } from "../actions";

export function ResourceForm({ resource }: { resource?: Resource | null }) {
  return (
    <form action={saveResource} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={resource?.id ?? ""} />
      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <Field label="Title"><Input name="title" defaultValue={resource?.title ?? ""} placeholder="Purpose Driven Life (summary)" required /></Field>
        <Field label="Type">
          <Select name="kind" defaultValue={resource?.kind ?? "message"}>
            <option value="message">Message</option><option value="book">Book</option><option value="audio">Audio</option><option value="document">Document</option>
          </Select>
        </Field>
      </div>
      <Field label="Author / speaker"><Input name="author" defaultValue={resource?.author ?? ""} placeholder="Ps. Stefan" /></Field>
      <Field label="Description"><Textarea name="description" defaultValue={resource?.description ?? ""} className="!min-h-[90px]" /></Field>
      <Field label="YouTube link" hint="For video messages."><Input name="youtube_url" type="url" defaultValue={resource?.youtube_url ?? ""} placeholder="https://youtu.be/…" /></Field>
      <Field label="File" hint={resource?.file_url ? "Upload to replace the current file." : "PDF or audio; uploads to the resources bucket."}><input type="file" name="file" accept=".pdf,audio/*,application/pdf,application/epub+zip" className="input" /></Field>
      <Field label="Cover image"><input type="file" name="cover" accept="image/*" className="input" /></Field>
      <div className="grid gap-4 sm:grid-cols-2 items-end">
        <Field label="Sort order"><Input name="sort_order" type="number" defaultValue={resource?.sort_order ?? 0} /></Field>
        <label className="option-row flex items-center gap-3 cursor-pointer">
          <input type="checkbox" name="is_published" className="check" defaultChecked={resource?.is_published ?? true} />
          <span className="font-bold text-sm">Published</span>
        </label>
      </div>
      <div><SubmitButton pendingText="Saving…">{resource ? "Save changes" : "Add resource"}</SubmitButton></div>
    </form>
  );
}
