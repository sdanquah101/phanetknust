import { ButtonLink, Card, Field, Input, Notice, PageHeader, Select, SubmitButton, Textarea, Toast } from "@phanet/ui";
import { createClient, getSession } from "@phanet/supabase/server";
import { getPeriod, listEvents, listPrograms, yearOptions } from "@/lib/queries";
import { canWrite } from "@/lib/finance";
import { createBudgetAction } from "../actions";

export default async function NewBudgetPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const sp = await searchParams;
  const [session, supabase] = await Promise.all([getSession(), createClient()]);
  const roles = session?.roles ?? [];
  const period = await getPeriod(supabase);
  const [programs, events] = await Promise.all([listPrograms(supabase), listEvents(supabase, 100)]);

  return (
    <>
      <PageHeader eyebrow="Finance · Budgets" title="New" script="budget" actions={<ButtonLink href="/budgets" variant="ice" size="sm">← Budgets</ButtonLink>} />
      <Toast message={sp.error} tone="peach" />
      {!canWrite(roles) && <Notice tone="peach">Only the finance team can create budgets.</Notice>}
      <Card className="max-w-2xl">
        <form action={createBudgetAction} className="grid gap-4 md:grid-cols-2">
          <Field label="Title" className="md:col-span-2"><Input name="title" placeholder="Midweek Altar · Semester 1" required /></Field>
          <Field label="Academic year">
            <Select name="academic_year" defaultValue={period.year}>{yearOptions(period.year).map((y) => <option key={y} value={y}>{y}</option>)}</Select>
          </Field>
          <Field label="Semester">
            <Select name="semester" defaultValue={String(period.semester)}>
              <option value="">Whole year</option>
              <option value="1">Semester 1</option>
              <option value="2">Semester 2</option>
            </Select>
          </Field>
          <Field label="Program (optional)">
            <Select name="program_id" defaultValue=""><option value="">— None —</option>{programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select>
          </Field>
          <Field label="Event (optional)">
            <Select name="event_id" defaultValue=""><option value="">— None —</option>{events.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}</Select>
          </Field>
          <Field label="Notes" className="md:col-span-2"><Textarea name="notes" placeholder="Assumptions, who approved the plan, anything the team should know." className="!min-h-[90px]" /></Field>
          <div className="md:col-span-2 flex items-center gap-3 pt-1">
            <SubmitButton variant="blue" pendingText="Creating…" disabled={!canWrite(roles)}>Create budget</SubmitButton>
            <ButtonLink href="/budgets" variant="ice">Cancel</ButtonLink>
          </div>
        </form>
      </Card>
    </>
  );
}
