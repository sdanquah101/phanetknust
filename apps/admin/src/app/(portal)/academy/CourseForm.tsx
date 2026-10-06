import { Field, Input, Select, SubmitButton, Textarea } from "@phanet/ui";
import type { Course } from "@phanet/supabase/types";
import { saveCourse } from "./actions";

export function CourseForm({ course }: { course?: Course | null }) {
  return (
    <form action={saveCourse} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={course?.id ?? ""} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Title"><Input name="title" defaultValue={course?.title ?? ""} placeholder="Foundations of Faith" required /></Field>
        <Field label="Slug" hint="Leave blank to generate."><Input name="slug" defaultValue={course?.slug ?? ""} placeholder="foundations-of-faith" /></Field>
      </div>
      <Field label="Summary" hint="One or two lines for the course card."><Input name="summary" defaultValue={course?.summary ?? ""} /></Field>
      <Field label="Description"><Textarea name="description" defaultValue={course?.description ?? ""} /></Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Format">
          <Select name="format" defaultValue={course?.format ?? "video"}>
            <option value="video">Video</option><option value="audio">Audio</option><option value="mixed">Mixed</option>
          </Select>
        </Field>
        <Field label="Level"><Input name="level" defaultValue={course?.level ?? "Foundation"} placeholder="Foundation" /></Field>
        <Field label="Instructor"><Input name="instructor" defaultValue={course?.instructor ?? ""} placeholder="Ps. Stefan" /></Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Duration label"><Input name="duration_label" defaultValue={course?.duration_label ?? ""} placeholder="4 weeks · 6 lessons" /></Field>
        <Field label="Pass mark (%)"><Input name="pass_mark" type="number" min={1} max={100} defaultValue={course?.pass_mark ?? 70} /></Field>
        <Field label="Sort order"><Input name="sort_order" type="number" defaultValue={course?.sort_order ?? 0} /></Field>
      </div>
      <label className="option-row flex items-center gap-3 cursor-pointer">
        <input type="checkbox" name="is_published" className="check" defaultChecked={course?.is_published ?? false} />
        <span className="font-bold text-sm">Published in the Academy</span>
      </label>
      <Field label="Cover image" hint="Uploads to the course-media bucket."><input type="file" name="cover" accept="image/*" className="input" /></Field>
      <div><SubmitButton pendingText="Saving…">{course ? "Save course" : "Create course"}</SubmitButton></div>
    </form>
  );
}
